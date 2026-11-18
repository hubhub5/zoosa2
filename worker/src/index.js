// 보호자사주 결제 확인 서버 (Cloudflare Workers + D1)
//
// 흐름: 사이트가 리포트마다 랜덤 참조값(zs_...)을 만들어 그로블 결제창 링크 뒤에 ?ref= 로 붙인다
//   → 결제되면 그로블이 웹훅(payment.completed)에 그 값을 sellerReference 로 돌려준다
//   → 서버가 "이 참조값 결제됨"을 기록한다 (구매자 휴대폰·메일은 해시로만)
//   → 사이트가 /check {ref, rid} 로 물어보고 그 리포트를 연다. 처음 확인한 리포트(rid)에 결제가 묶인다
//   → 다른 기기: 열쇠 링크(ref 포함)로 열거나, 같은 정보 입력 + 결제한 번호로 /find
//
// POST /hook                 그로블 웹훅 (X-Groble-Signature 로 진짜인지 확인)
// POST /check {ref, rid}     결제됐는지 (rid = 리포트 입력값의 해시. 결제 1건 = 리포트 1개)
// POST /find  {id, rid}      결제한 휴대폰 번호나 메일로 이 리포트 결제 찾기
// GET  /shapes/<SHAPES_KEY>  최근 웹훅 모양(개인정보 가림). 연결 확인용
//
// 비밀값: GROBLE_SECRET (그로블 웹훅 키), SHAPES_KEY, HASH_PEPPER (번호·메일 해시에 섞는 값)
// 이름·이메일·전화번호 원문, 생년월일은 저장하지 않는다.

const JSONH = { 'content-type': 'application/json; charset=utf-8' };
const REF_RE = /^zs_[A-Za-z0-9_-]{16,64}$/;
const RID_RE = /^[0-9a-f]{64}$/;

export default {
  async fetch(req, env) {
    const p = new URL(req.url).pathname;
    try {
      if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req, env) });
      if (req.method === 'POST' && p === '/hook') return await hook(req, env);
      if (req.method === 'POST' && p === '/check') return await check(req, env);
      if (req.method === 'POST' && p === '/find') return await find(req, env);
      if (req.method === 'GET' && env.SHAPES_KEY && p === `/shapes/${env.SHAPES_KEY}`) return await shapes(env);
      if (p === '/') return new Response('ok');
      return new Response('not found', { status: 404 });
    } catch (e) {
      console.log('error', String(e));
      // 500 이면 그로블이 다시 보내 준다
      return new Response(JSON.stringify({ ok: false, error: 'server' }), { status: 500, headers: { ...JSONH, ...cors(req, env) } });
    }
  },
};

/* ---------- 저장소 (D1). 테스트에서는 env.STORE 로 바꿔 끼운다 ---------- */

export function d1Store(db) {
  return {
    async insertPaid(r) {
      await db.prepare('INSERT INTO paid (ref, uid, phone, email, at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(ref) DO UPDATE SET uid = ?2, phone = ?3, email = ?4, refunded = 0')
        .bind(r.ref, r.uid, r.phone, r.email, r.at).run();
    },
    byRef: (ref) => db.prepare('SELECT * FROM paid WHERE ref = ?1').bind(ref).first(),
    async bindRid(ref, rid) { await db.prepare('UPDATE paid SET rid = ?2 WHERE ref = ?1 AND rid IS NULL').bind(ref, rid).run(); },
    async refundUid(uid) { return (await db.prepare('UPDATE paid SET refunded = 1 WHERE uid = ?1').bind(uid).run()).meta.changes; },
    async byContact(h) {
      return (await db.prepare('SELECT * FROM paid WHERE (phone = ?1 OR email = ?1) AND refunded = 0 ORDER BY at').bind(h).all()).results;
    },
    async addShape(body) {
      await db.prepare('INSERT INTO shapes (at, body) VALUES (?1, ?2)').bind(new Date().toISOString(), body).run();
      await db.prepare('DELETE FROM shapes WHERE id NOT IN (SELECT id FROM shapes ORDER BY id DESC LIMIT 20)').run();
    },
    async shapes() { return (await db.prepare('SELECT at, body FROM shapes ORDER BY id DESC LIMIT 10').all()).results; },
  };
}
const store = (env) => env.STORE ?? d1Store(env.DB);

/* ---------- 그로블 → 서버 ---------- */

async function hook(req, env) {
  const raw = await req.text();
  if (!env.GROBLE_SECRET) return new Response('secret not set', { status: 503 }); // 키 넣기 전이면 나중에 다시 보내게
  if (!(await verify(req.headers, raw, env.GROBLE_SECRET))) return new Response('bad signature', { status: 401 });

  const ev = JSON.parse(raw);
  const o = ev?.data?.object ?? {};
  const s = store(env);
  await s.addShape(JSON.stringify(redact(ev)));

  const uid = typeof o.merchantUid === 'string' ? o.merchantUid : '';
  if (ev.type === 'payment.completed') {
    const ref = typeof o.sellerReference === 'string' ? o.sellerReference : '';
    if (!REF_RE.test(ref)) return new Response('ignored: no ref'); // 다른 상품이거나 사이트를 안 거친 결제
    const phone = normId(String(o.buyer?.phoneNumber ?? ''));
    const email = normId(String(o.buyer?.email ?? ''));
    await s.insertPaid({
      ref, uid,
      phone: phone ? await contactHash(env, phone) : null,
      email: email ? await contactHash(env, email) : null,
      at: String(ev.occurredAt ?? new Date().toISOString()),
    });
    return new Response('saved');
  }
  if (ev.type === 'payment.refunded') {
    // 환불 알림에는 참조값이 없어서 merchantUid 로 찾는다
    const n = uid ? await s.refundUid(uid) : 0;
    return new Response(n ? 'refunded' : 'ignored: unknown uid');
  }
  return new Response('ignored: ' + String(ev.type));
}

/** HMAC-SHA256(secret, `${timestamp}.${raw}`) hex. 키 교체 중엔 이전 키 서명도 받는다. 5분 넘은 요청은 거절 */
export async function verify(headers, raw, secret, now = Date.now()) {
  const ts = headers.get('x-groble-timestamp') || '';
  if (!/^\d+$/.test(ts) || Math.abs(now / 1000 - Number(ts)) > 300) return false;
  const want = await hmac(secret, `${ts}.${raw}`);
  return [headers.get('x-groble-signature'), headers.get('x-groble-signature-previous')]
    .some((s) => s && safeEq(s.trim().toLowerCase().replace(/^sha256=/, ''), want));
}

/* ---------- 사이트 → 서버 ---------- */

async function check(req, env) {
  const h = { ...JSONH, ...cors(req, env) };
  const b = await body(req);
  const ref = String(b.ref ?? ''), rid = String(b.rid ?? '');
  if (!REF_RE.test(ref) || !RID_RE.test(rid)) return json({ ok: false, error: 'format' }, h, 400);
  const s = store(env);
  const row = await s.byRef(ref);
  if (!row || row.refunded) return json({ ok: false }, h);
  if (!row.rid) { await s.bindRid(ref, rid); return json({ ok: true }, h); } // 처음 연 리포트에 묶는다
  return json(row.rid === rid ? { ok: true } : { ok: false, error: 'other' }, h);
}

const tries = new Map(); // IP별 /find 시도 수 (인스턴스 단위, 대충 막는 용도)

async function find(req, env) {
  const h = { ...JSONH, ...cors(req, env) };
  const ip = req.headers.get('cf-connecting-ip') || 'x';
  const slot = `${ip}:${Math.floor(Date.now() / 600000)}`;
  const n = (tries.get(slot) ?? 0) + 1;
  tries.set(slot, n);
  if (tries.size > 5000) tries.clear();
  if (n > 10) return json({ ok: false, error: 'many' }, h, 429);

  const b = await body(req);
  const id = normId(String(b.id ?? '')), rid = String(b.rid ?? '');
  if (!id || !RID_RE.test(rid)) return json({ ok: false, error: 'format' }, h, 400);
  const s = store(env);
  const rows = await s.byContact(await contactHash(env, id));
  // 이 리포트에 이미 묶인 결제가 있으면 그것, 없으면 아직 아무 리포트에도 안 묶인 결제 하나를 여기에 묶는다
  const hit = rows.find((r) => r.rid === rid) ?? rows.find((r) => !r.rid);
  if (!hit) return json({ ok: false, error: rows.length ? 'other' : 'notfound' }, h);
  if (!hit.rid) await s.bindRid(hit.ref, rid);
  return json({ ok: true, ref: hit.ref }, h);
}

async function shapes(env) {
  const rows = await store(env).shapes();
  return new Response(JSON.stringify(rows.map((r) => ({ at: r.at, body: JSON.parse(r.body) })), null, 2), { headers: JSONH });
}

/* ---------- 도우미 ---------- */

const json = (o, h, status = 200) => new Response(JSON.stringify(o), { status, headers: h });
async function body(req) { try { return await req.json(); } catch { return {}; } }

export function normId(s) {
  const t = s.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return t;
  let d = t.replace(/\D/g, '');
  if (d.startsWith('82')) d = '0' + d.slice(2);
  if (/^01\d{8,9}$/.test(d)) return d;
  return '';
}

const contactHash = (env, id) => hmac(env.HASH_PEPPER || 'zoosa2', 'contact:' + id);

/** 값은 가리고 키 이름과 종류만 남긴다. 상태·상품·참조값처럼 개인정보가 아닌 칸만 그대로 */
export function redact(v, key = '') {
  if (v == null) return v;
  if (Array.isArray(v)) return v.slice(0, 5).map((x) => redact(x, key));
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redact(x, `${key}.${k}`)]));
  if (typeof v === 'number' || typeof v === 'boolean') return typeof v;
  const s = String(v);
  if (/buyer|shipping|question|paymentMethod/i.test(key)) return `<가림 ${s.length}자>`;
  if (/(^\.type|version|occurredAt|merchantUid|sellerReference|content\.(id|type|title|paymentType)|currency)$/i.test(key)) return s;
  return `<글자 ${s.length}자>`;
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function cors(req, env) {
  const o = req.headers.get('origin') || '';
  const ok = (env.ALLOWED_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
  return ok.includes(o) || o.startsWith('http://localhost:')
    ? { 'access-control-allow-origin': o, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin' }
    : {};
}
