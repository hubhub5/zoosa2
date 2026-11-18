import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import worker, { verify, redact, normId } from './src/index.js';

// D1 대신 쓰는 메모리 저장소 (d1Store 와 같은 함수들)
function memStore() {
  const rows = new Map(); const shapes = [];
  return {
    rows,
    async insertPaid(r) { rows.set(r.ref, { ...rows.get(r.ref), ...r, rid: rows.get(r.ref)?.rid ?? null, refunded: 0 }); },
    async byRef(ref) { return rows.get(ref) ?? null; },
    async bindRid(ref, rid) { const r = rows.get(ref); if (r && !r.rid) r.rid = rid; },
    async refundUid(uid) { let n = 0; for (const r of rows.values()) if (r.uid === uid) { r.refunded = 1; n++; } return n; },
    async byContact(h) { return [...rows.values()].filter((r) => (r.phone === h || r.email === h) && !r.refunded).sort((a, b) => a.at.localeCompare(b.at)); },
    async addShape(b) { shapes.push(b); },
    async shapes() { return shapes.map((body) => ({ at: 'x', body })); },
  };
}
const SECRET = 'whsec_test';
const env = () => ({ STORE: memStore(), GROBLE_SECRET: SECRET, SHAPES_KEY: 'sk', HASH_PEPPER: 'pep', ALLOWED_ORIGIN: 'https://hubhub5.github.io' });
const REF = 'zs_abcdefghijklmnop1234';
const RID_A = 'a'.repeat(64), RID_B = 'b'.repeat(64);

function signed(body, { secret = SECRET, ts = Math.floor(Date.now() / 1000) } = {}) {
  const raw = JSON.stringify(body);
  const sig = createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex');
  return new Request('https://w.dev/hook', { method: 'POST', headers: { 'content-type': 'application/json', 'x-groble-signature': sig, 'x-groble-timestamp': String(ts) }, body: raw });
}
const post = (e, path, b, ip = '1.1.1.1') => worker.fetch(new Request(`https://w.dev${path}`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://hubhub5.github.io', 'cf-connecting-ip': ip }, body: JSON.stringify(b) }), e).then(async (r) => ({ status: r.status, cors: r.headers.get('access-control-allow-origin'), ...(await r.json()) }));

const completed = (ref = REF, uid = 'm_1', phone = '010-1234-5678', at = '2026-11-18T10:00:00+09:00') => ({
  id: 'evt_1', type: 'payment.completed', version: '2026-04-30', occurredAt: at,
  data: { object: { merchantUid: uid, sellerReference: ref, buyer: { type: 'MEMBER', displayName: '테스트 구매자', email: 'Test@Buyer.example', phoneNumber: phone }, content: { id: 'g4wFTv', title: '보호자 사주' }, pricing: { finalAmount: 9900, currency: 'KRW' } } },
});
const pay = (e, ...a) => worker.fetch(signed(completed(...a)), e).then((r) => r.text());

describe('결제 확인 서버', () => {
  it('결제 → 처음 연 리포트에 묶임 → 다른 리포트는 안 열림 → 환불하면 잠김', async () => {
    const e = env();
    expect((await post(e, '/check', { ref: REF, rid: RID_A })).ok).toBe(false);
    expect(await pay(e)).toBe('saved');
    const r = await post(e, '/check', { ref: REF, rid: RID_A });
    expect(r).toMatchObject({ ok: true, cors: 'https://hubhub5.github.io' });
    expect((await post(e, '/check', { ref: REF, rid: RID_A })).ok).toBe(true); // 다른 기기에서 같은 리포트
    expect(await post(e, '/check', { ref: REF, rid: RID_B })).toMatchObject({ ok: false, error: 'other' }); // 열쇠 링크로 다른 입력
    await worker.fetch(signed({ id: 'evt_2', type: 'payment.refunded', data: { object: { merchantUid: 'm_1', refund: { amount: 9900 } } } }), e);
    expect((await post(e, '/check', { ref: REF, rid: RID_A })).ok).toBe(false);
  });

  it('결제한 번호로 찾기: 묶인 리포트만, 안 묶였으면 이 리포트에 묶기', async () => {
    const e = env();
    await pay(e); // 결제만 하고 다른 브라우저로 돌아와서 아직 아무 리포트에도 안 묶임
    expect(await post(e, '/find', { id: '010 1234 5678', rid: RID_A })).toMatchObject({ ok: true, ref: REF });
    expect(await post(e, '/find', { id: 'test@buyer.example', rid: RID_A })).toMatchObject({ ok: true, ref: REF }); // 메일로도
    expect(await post(e, '/find', { id: '01012345678', rid: RID_B })).toMatchObject({ ok: false, error: 'other' }); // 번호 알아도 다른 리포트는 안 열림
    expect(await post(e, '/find', { id: '01099999999', rid: RID_A })).toMatchObject({ ok: false, error: 'notfound' });
  });

  it('두 마리 따로 결제하면 각자 열림', async () => {
    const e = env();
    const REF2 = 'zs_secondrefsecondref99';
    await pay(e, REF, 'm_1'); await post(e, '/check', { ref: REF, rid: RID_A });
    await pay(e, REF2, 'm_2', '010-1234-5678', '2026-11-18T11:00:00+09:00');
    expect(await post(e, '/find', { id: '01012345678', rid: RID_B })).toMatchObject({ ok: true, ref: REF2 });
    expect(await post(e, '/find', { id: '01012345678', rid: RID_A })).toMatchObject({ ok: true, ref: REF });
  });

  it('번호 찾기는 IP당 10분에 10번', async () => {
    const e = env();
    for (let i = 0; i < 10; i++) await post(e, '/find', { id: '01000000000', rid: RID_A }, '9.9.9.9');
    expect((await post(e, '/find', { id: '01000000000', rid: RID_A }, '9.9.9.9')).status).toBe(429);
  });

  it('서명이 틀리거나 오래된 알림은 거절, 키 넣기 전이면 503', async () => {
    const e = env();
    expect((await worker.fetch(signed(completed(), { secret: 'wrong' }), e)).status).toBe(401);
    expect((await worker.fetch(signed(completed(), { ts: Math.floor(Date.now() / 1000) - 600 }), e)).status).toBe(401);
    const e2 = env(); delete e2.GROBLE_SECRET;
    expect((await worker.fetch(signed(completed()), e2)).status).toBe(503);
    expect(e.STORE.rows.size).toBe(0);
  });

  it('키 교체 중엔 이전 키 서명도 받는다', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const h = new Headers({ 'x-groble-timestamp': ts, 'x-groble-signature': 'nope', 'x-groble-signature-previous': createHmac('sha256', 'old').update(`${ts}.{}`).digest('hex') });
    expect(await verify(h, '{}', 'old')).toBe(true);
  });

  it('사이트를 안 거친 결제(참조값 없음)는 기록 안 함', async () => {
    const e = env();
    const b = completed(); delete b.data.object.sellerReference;
    expect(await (await worker.fetch(signed(b), e)).text()).toBe('ignored: no ref');
    expect(e.STORE.rows.size).toBe(0);
  });

  it('이름·메일·번호 원문은 저장 안 함', async () => {
    const e = env();
    await pay(e);
    const all = JSON.stringify([...e.STORE.rows.values()]) + JSON.stringify(await e.STORE.shapes());
    expect(all).not.toMatch(/테스트 구매자|buyer\.example|01012345678|1234-5678/i);
    expect(JSON.stringify(redact(completed()))).toMatch(/zs_abcdefghijklmnop1234/);
  });

  it('번호·메일 모양 맞추기', () => {
    expect(normId('+82 10-1234-5678')).toBe('01012345678');
    expect(normId(' A@B.co ')).toBe('a@b.co');
    expect(normId('1234')).toBe('');
  });
});
