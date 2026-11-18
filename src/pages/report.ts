import '../content/overrides';
import { initCommon } from '../common';
import { CONFIG } from '../config';
import { decodeInputs, buildModel, FOCUS_KO, SAMPLE_HASH, type Model } from '../report/model';
import { renderReport, esc, verdictOf, setVerdictOverride } from '../report/render';
import { wireCharts } from '../charts/charts';
import { isUnlocked, rememberReport, isPaidReport, buyUrl, markPending, autoPay, hasRef, checkPaid, findPaid, keyIn, stripKey, importKey, keyLink } from '../unlock';
import { pillarHanja, STEMS, BRANCHES } from '../saju/constants';
import { DIST } from '../content/distortions';
import { COPE } from '../content/coping';

initCommon();

const root = document.getElementById('report')!;
// sample.html: 결제 후 화면을 보여주는 고정 예시
const SAMPLE = document.body.hasAttribute('data-sample');
// full-*.html: 관리자용. 페이지에 박힌 입력 한 건만 결제한 상태로 보여 준다 (사이트 어디에도 링크 없음)
const FIXED = document.body.dataset.fixed ?? '';
if (FIXED && document.body.dataset.verdict) { try { setVerdictOverride(JSON.parse(document.body.dataset.verdict)); } catch { /* 잘못된 값이면 자동 문장 */ } }
// 열쇠 링크(#...&k=zs_...)로 들어오면 열쇠를 저장하고 주소에서는 뺀다
const rawHash = FIXED || (SAMPLE ? SAMPLE_HASH : location.hash.slice(1));
const key = !FIXED && !SAMPLE ? keyIn(rawHash) : '';
const hash = key ? stripKey(rawHash) : rawHash;
if (key) { importKey(hash, key); history.replaceState(null, '', `#${hash}`); }
// 리포트 창에서 다른 결과 링크를 열거나 뒤로 가기로 주소 뒤쪽(#)만 바뀌면 페이지가 새로 안 그려지므로 다시 불러온다
if (!FIXED && !SAMPLE) addEventListener('hashchange', () => { if (!location.hash.startsWith('#s-')) location.reload(); });
const inp = decodeInputs(hash);

if (!inp) {
  root.innerHTML = `<div class="page-head" style="margin-top:40px"><div class="kicker mono">입력 없음</div><h1>아직 입력한 게 없어요</h1><p>첫 화면에서 생년월일부터 넣어 주세요.</p></div><a class="btn" href="./#form">입력하러 가기</a>`;
} else {
  if (!SAMPLE && !FIXED) rememberReport(hash);
  const m = buildModel(inp);
  const unlocked = SAMPLE || !!FIXED || isUnlocked() || isPaidReport(hash);
  const { head, body, toc } = renderReport(m, unlocked);
  const bar = SAMPLE ? `<div class="sample-bar"><div><b>예시 리포트</b><span>결제하면 이렇게 끝까지 다 나와요. 아래는 김예빈님(1993년생) 예시예요.</span></div><a class="btn" href="./#form">내 걸로 보기</a></div>` : '';
  root.innerHTML = bar + head + body + `<div class="disclaimer"><p>계산: 만세력(진태양시 −${m.chart.correctionMin}분 보정${m.chart.corrected ? '' : ', 시각 미상'}), 대운수 ${m.chart.daeunStartAge}. 생각 버릇 · 대처 · 갈등 점수는 내 사주 비중을 무작위 생년월일 2만 개랑 비교해서 몇 등쯤인지 본 거예요. 되풀이된 해는 그해 세운이 원국을 건드린 정도로 골랐어요.</p><p>나를 알아보는 용도로 봐 주세요. 심리 진단이나 상담을 대신하지 않아요. 많이 힘들면 사주보다 상담이 먼저예요.</p></div>`;
  document.title = SAMPLE ? `예시 리포트 · ${CONFIG.brand}` : `${inp.owner ? inp.owner + '님' : '내'} 사주 리포트 · ${CONFIG.brand}`;
  document.querySelector('[data-no]')!.textContent = `No.${m.reportNo}`;
  document.querySelector('[data-toc]')!.innerHTML = toc.map((t) => `<a href="#${t.id}" class="${t.locked ? 'lk' : ''}"><span class="mono">${t.no}</span>${esc(t.t)}</a>`).join('');
  const b = inp.birth;
  document.querySelector('[data-inp]')!.innerHTML = [
    ['이름', inp.owner || '-'],
    ['생일', `${b.y}.${b.m}.${b.d} ${b.calendar === 'lunar' ? (b.leap ? '음(윤)' : '음') : '양'}`],
    ['시각', b.hh === null ? '모름' : `${String(b.hh).padStart(2, '0')}:${String(b.mm ?? 0).padStart(2, '0')}`],
    ['성별', b.gender === 'f' ? '여' : '남'],
    ['요즘 걸리는 쪽', FOCUS_KO[inp.focus]],
  ].map(([k, v]) => `<li><span class="mono">${k}</span>${esc(v)}</li>`).join('');

  // 목차의 내부 링크가 해시(입력값)를 덮어쓰지 않도록
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#s-"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById(a.getAttribute('href')!.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  if (!SAMPLE && !FIXED) wireBuy(unlocked);
  wireCharts(root);
  wireChecks(m);
  wireShare(m, unlocked);
}

/** 결제 버튼에 이 리포트 전용 참조값을 붙이고, 결제 여부를 서버에 확인한다 */
function wireBuy(unlocked: boolean) {
  if (!autoPay()) return;
  const paidHere = isPaidReport(hash);
  if (!unlocked) {
    const a = root.querySelector<HTMLAnchorElement>('[data-buy]');
    if (a) { a.href = buyUrl(hash); a.removeAttribute('target'); a.addEventListener('click', () => markPending(hash)); }
    wireFind();
    if (hasRef(hash)) {
      // 결제했는데 아직 안 열린 상태(다른 탭에서 결제, 열쇠 링크로 들어옴 등)면 확인해서 연다
      const recheck = () => { void checkPaid(hash).then((r) => { if (r === 'ok') location.reload(); }); };
      recheck();
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') recheck(); });
    }
    return;
  }
  if (paidHere) {
    // 결제로 열린 리포트: 환불됐으면 다음부터 잠기게 확인하고, 결과 링크에 열쇠를 넣는다
    void checkPaid(hash);
    const copy = root.querySelector<HTMLButtonElement>('[data-copy]');
    copy?.setAttribute('data-key', '1');
    const note = copy?.parentElement?.querySelector('.fine');
    if (note) note.textContent = '결과 링크엔 이 리포트를 여는 열쇠가 들어 있어요. 카톡 나에게 보내기로 저장해 두면 폰이든 노트북이든 다시 열 수 있어요. 남한테 보내면 그 사람도 이 리포트를 다 보게 되니 조심하기.';
  }
}

/** 잠긴 리포트: 이미 결제했으면 결제한 번호로 다시 열기 */
function wireFind() {
  const box = root.querySelector<HTMLElement>('[data-find]');
  if (!box) return;
  box.hidden = false;
  const f = box.querySelector('form')!;
  const inp = f.querySelector('input')!;
  const btn = f.querySelector('button')!;
  const msg = box.querySelector<HTMLElement>('[data-find-msg]')!;
  const say = (ok: boolean, t: string) => { msg.className = `mono fine ${ok ? 'ok' : 'no'}`; msg.textContent = t; };
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!inp.value.trim()) { say(false, '결제할 때 쓴 휴대폰 번호를 넣어 주세요.'); return; }
    btn.disabled = true; say(true, '결제 내역 찾는 중이에요.');
    const r = await findPaid(hash, inp.value);
    btn.disabled = false;
    if (r === 'ok') { say(true, '찾았어요. 열게요.'); setTimeout(() => location.reload(), 500); return; }
    say(false, {
      notfound: '이 번호로 결제한 내역이 안 보여요. 결제 직후면 1분쯤 뒤에 다시 해 보세요.',
      other: '이 번호로 결제한 리포트는 있는데, 지금 이 리포트와 입력값이 달라요. 결제할 때와 똑같이(이름, 생일, 시각, 성별, 요즘 걸리는 쪽) 입력했는지 봐 주세요. 결제 1건은 리포트 1개예요. 다른 사람 사주는 따로 신청해야 해요.',
      format: '010으로 시작하는 휴대폰 번호나 메일로 넣어 주세요.',
      many: '여러 번 시도해서 잠깐 막혔어요. 10분 뒤에 다시 해 주세요.',
      nostore: '찾았는데 이 브라우저가 저장을 막고 있어요. 시크릿 창이면 일반 창에서 열어 주세요.',
      error: '결제 확인 서버에 연결이 안 돼요. 잠시 뒤 다시 해 주세요.',
    }[r] + (r === 'notfound' || r === 'error' ? ` 계속 안 되면 ${CONFIG.contact}로 결제 내역 캡처를 보내 주세요.` : ''));
  });
}

function wireChecks(m: Model) {
  const box = root.querySelector('.checks');
  if (!box) return;
  const key = `zoosa2.chk.${hash.length}.${m.reportNo}`;
  const cnt = root.querySelector('[data-count]')!;
  const inputs = [...box.querySelectorAll<HTMLInputElement>('input')];
  try { const saved = JSON.parse(localStorage.getItem(key) ?? '[]'); inputs.forEach((i, k) => { i.checked = saved.includes(k); }); } catch { /* 무시 */ }
  const upd = () => {
    const on = inputs.filter((i) => i.checked).length;
    cnt.textContent = `${on} / ${inputs.length}`;
    try { localStorage.setItem(key, JSON.stringify(inputs.map((i, k) => (i.checked ? k : -1)).filter((k) => k >= 0))); } catch { /* 무시 */ }
  };
  box.addEventListener('change', upd); upd();
}

function wireShare(m: Model, paid: boolean) {
  const cv = root.querySelector<HTMLCanvasElement>('.share-c');
  if (!cv) return;
  const draw = async () => {
    await Promise.all([document.fonts.load('800 40px NanumSquareNeo'), document.fonts.load('400 20px NanumSquareNeo'), document.fonts.load('600 40px "Noto Serif KR"')]).catch(() => {});
    const x = cv.getContext('2d')!;
    const cs = getComputedStyle(document.documentElement);
    const C = (v: string) => cs.getPropertyValue(v).trim();
    const W = 1080, H = 1350, P = 84;
    x.fillStyle = '#efe7d8'; x.fillRect(0, 0, W, H);
    const ink = '#26211c', mute = '#8f8475', line = '#cdbfa8', acc = '#c2412b';
    x.strokeStyle = ink; x.lineWidth = 2; x.strokeRect(40, 40, W - 80, H - 80);
    const sans = (w: number, s: number) => `${w} ${s}px NanumSquareNeo, "Apple SD Gothic Neo", sans-serif`;
    const mono = (s: number) => `400 ${s}px NanumSquareNeo, sans-serif`;
    const sp = (t: string, px: number) => { (x as any).letterSpacing = `${px}px`; return t; };
    x.fillStyle = mute; x.font = mono(22); sp('', 0);
    x.fillText(`${CONFIG.brand} · REPORT No.${m.reportNo}`, P, 108);
    x.textAlign = 'right'; x.fillText(`${pillarHanja(m.chart.day)} 일주`, W - P, 108); x.textAlign = 'left';
    x.beginPath(); x.moveTo(P, 132); x.lineTo(W - P, 132); x.strokeStyle = ink; x.lineWidth = 2; x.stroke();
    // 되풀이된 해 (큰 숫자)
    const ys = m.repeats.past.map((r) => String(r.year));
    x.fillStyle = mute; x.font = mono(22); sp('', 0); x.fillText('되풀이된 해', P, 200);
    x.fillStyle = ink; x.font = sans(800, ys.length > 4 ? 92 : 112); sp('', -6);
    ys.forEach((y, i) => { x.fillText(y, P + (i % 2) * 450, 320 + Math.floor(i / 2) * 130); });
    if (!ys.length) x.fillText('-', P, 320);
    const yEnd = 320 + Math.floor(Math.max(0, ys.length - 1) / 2) * 130;
    // 제목
    x.fillStyle = ink; x.font = sans(800, 54); sp('', -4);
    x.fillText(`${m.inp.owner ? m.inp.owner + '님' : '내'} 사주에서`, P, Math.max(640, yEnd + 110));
    x.fillText(`${ys.length}번 되풀이된 장면`, P, Math.max(640, yEnd + 110) + 66);
    // 한 줄
    const v = verdictOf(m);
    const wrap = (t: string, max: number) => { const out: string[] = []; let cur = ''; for (const w of t.split(' ')) { const nx = cur ? cur + ' ' + w : w; if (x.measureText(nx).width > max && cur) { out.push(cur); cur = w; } else cur = nx; } if (cur) out.push(cur); return out; };
    const vy0 = Math.max(808, yEnd + 290); let vy = vy0;
    x.fillStyle = ink; x.font = sans(800, 34); sp('', -2.4);
    for (const l of wrap(v.line2, W - P * 2 - 30).slice(0, 3)) { x.fillText(l, P + 26, vy); vy += 46; }
    x.fillStyle = acc; x.fillRect(P, vy0 - 32, 6, vy - vy0 + 14);
    x.fillStyle = '#8f8475'; x.font = sans(400, 26); sp('', -1.8);
    if (vy < 960) x.fillText(v.line3, P + 26, vy + 18);
    // 사실 칸
    const nx = m.repeats.next[0];
    const facts: [string, string][] = [
      ['지금 대운', m.daeunNow ? pillarHanja(m.daeunNow.pillar) : '-'],
      ['버티는 방식', COPE[m.cope[0].id].name],
      ['생각 버릇 1위', DIST[m.dist[0].id].alias],
      ['다음 차례', nx ? `${nx.year}` : '-'],
    ];
    const cw = (W - P * 2) / 4;
    x.strokeStyle = line; x.lineWidth = 2;
    x.beginPath(); x.moveTo(P, 990); x.lineTo(W - P, 990); x.stroke();
    facts.forEach(([k, v], i) => {
      const fx = P + cw * i;
      if (!paid && i === 3) v = '· · ·';
      x.fillStyle = mute; x.font = mono(20); sp('', 0); x.fillText(k, fx, 1030);
      const sz = v.length > 6 ? 26 : 36;
      x.fillStyle = ink; x.font = /[一-鿿]/.test(v) ? '600 40px "Noto Serif KR", serif' : sans(800, sz); sp('', /[一-鿿]/.test(v) ? 0 : -2.5);
      x.fillText(v, fx, 1082);
    });
    // 원국 8글자
    x.beginPath(); x.moveTo(P, 1124); x.lineTo(W - P, 1124); x.stroke();
    const cols = [m.chart.hour, m.chart.day, m.chart.month, m.chart.year];
    x.fillStyle = mute; x.font = mono(20); sp('', 0); x.fillText('내 사주', P, 1164);
    x.font = '600 44px "Noto Serif KR", serif'; x.fillStyle = ink;
    cols.forEach((p, i) => { const fx = P + 120 + i * 92; x.fillText(p ? STEMS[p.s] : '·', fx, 1170); x.fillText(p ? BRANCHES[p.b] : '·', fx, 1226); });
    x.fillStyle = mute; x.font = mono(20); x.textAlign = 'right'; x.fillText(CONFIG.brand, W - P, 1222); x.textAlign = 'left';
    void C;
  };
  draw();
  document.addEventListener('themechange', draw);
  root.querySelector('[data-save]')?.addEventListener('click', () => {
    cv.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = `${CONFIG.brand}-${m.reportNo}.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });
  root.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const url = btn.dataset.key ? keyLink(hash) : location.href;
    try { await navigator.clipboard.writeText(url); btn.textContent = '복사됨'; } catch { btn.textContent = '복사 실패'; }
    setTimeout(() => { btn.textContent = '결과 링크 복사'; }, 1600);
  });
}
