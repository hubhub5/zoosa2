import type { Model } from './model';
import {
  STEMS, BRANCHES, STEM_KO, BRANCH_KO, STEM_EL, BRANCH_EL, EL_KO, EL_HANJA, TG_KO, TG_HANJA, TG_GROUP, GROUP_KO,
  tenGod, mainHidden, pillarHanja, pillarKo, BRANCH_ANIMAL, type El, type Pillar, type TenGod, EL_ORDER,
} from '../saju/constants';
import { DIST } from '../content/distortions';
import { ADOPT, ROUTE_KO } from '../content/adoption';
import { STEM_TEXT, TG_TEXT, GROUP_THEME, EL_TEXT } from '../content/saju';
import { elementBars, pairedBars, timelineChart, distBars, gauge, spark, elVar } from '../charts/charts';
import { CONFIG } from '../config';
import { autoPay } from '../unlock';
import { base } from '../paths';
import { VERDICT, VERDICT_EL, VERDICT_META } from '../content/verdict';
import { spriteFor } from '../content/breeds';
import { DIST_DEEP, ADOPT_DEEP } from '../content/deep';
export const breedLabel = (b: string, c: string) => (c ? `${b} · ${c}` : b);
export const spriteKey = (b: string, c: string) => { const s = spriteFor(b, c); return `${s.breed}-${s.color}`; };

export const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const hasBatchim = (w: string) => {
  const c = w.charCodeAt(w.length - 1);
  if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 !== 0;
  return /[136780lmnr]$/i.test(w);
};
export const josa = (w: string, a: string, b: string) => w + (hasBatchim(w) ? a : b);

const sec = (id: string, no: string, title: string, small = '') =>
  `<header class="sec-h" id="${id}"><span class="mono">${no}</span><h2>${title}</h2>${small ? `<small>${small}</small>` : ''}</header>`;

const tgOf = (m: Model, s: number) => tenGod(m.chart.day.s, s);
const elDot = (e: El) => `<i class="eld" style="background:${elVar(e)}" title="${EL_KO[e]}"></i>`;

function factorValue(m: Model, k: string): string {
  const a = m.a;
  if (k === 'spread') return `${Math.round(Math.max(...EL_ORDER.map((e) => a.elWeight[e])) - Math.min(...EL_ORDER.map((e) => a.elWeight[e])))}p`;
  if (k === 'yang') return m.chart.day.s % 2 === 0 ? '양' : '음';
  if (k === 'W') return `${Math.round(100 - a.strength)}`;
  if (k === 'S') return `${Math.round(a.strength)}`;
  const [kind, key] = k.split('.');
  if (kind === 'T') return `${Math.round(a.tgWeight[key as TenGod])}%`;
  if (kind === 'G') return `${Math.round(a.groupWeight[key as keyof typeof a.groupWeight])}%`;
  if (kind === 'E') return `${Math.round(a.elWeight[key as El])}%`;
  return '';
}

function pillarCol(m: Model, label: string, p: Pillar | null, isDay = false): string {
  if (!p) return `<div class="pc none"><span class="mono pl">${label}</span><div class="ch">?</div><div class="ch">?</div><span class="mono tg">시간 미상</span></div>`;
  const sTg = isDay ? '일간' : TG_KO[tgOf(m, p.s)];
  const bTg = TG_KO[tgOf(m, mainHidden(p.b))];
  return `<div class="pc${isDay ? ' me' : ''}">
    <span class="mono pl">${label}</span>
    <span class="mono tg">${sTg}</span>
    <div class="ch" style="--c:${elVar(STEM_EL[p.s])}"><b>${STEMS[p.s]}</b><small>${STEM_KO[p.s]} · ${EL_KO[STEM_EL[p.s]]}</small></div>
    <div class="ch" style="--c:${elVar(BRANCH_EL[p.b])}"><b>${BRANCHES[p.b]}</b><small>${BRANCH_KO[p.b]} · ${EL_KO[BRANCH_EL[p.b]]}</small></div>
    <span class="mono tg">${bTg}</span>
  </div>`;
}

/** 표지 한 줄: 1위 생각 버릇 + 강아지가 채워준 기운. 같은 버릇끼리도 계기·채운 기운에 따라 다른 버전 */
export interface Verdict { label: string; line1: string; line2: string; line3: string }
/** 관리자 페이지에서 문구를 직접 지정할 때 (full-*.html 의 data-verdict) */
let verdictOverride: Verdict | null = null;
export const setVerdictOverride = (v: Verdict | null) => { verdictOverride = v; };

export function verdictOf(m: Model): Verdict {
  if (verdictOverride) return verdictOverride;
  const top = m.dist[0].id;
  const order = ['move', 'work', 'relation', 'low', 'restart', 'chance', 'rescue'];
  const seed = Number(m.reportNo) + order.indexOf(m.adoption.primary) * 7 + EL_ORDER.indexOf(m.filled) * 3;
  const v = VERDICT[top][seed % VERDICT[top].length];
  const els = VERDICT_EL[m.filled];
  return { label: VERDICT_META.label, line1: v.me, line2: `"${v.msg}"고 말해주러 온 ${m.inp.dog}.`, line3: els[Math.floor(seed / 3) % els.length] };
}

export function renderReport(m: Model, unlocked: boolean): { head: string; body: string; toc: { id: string; no: string; t: string; locked: boolean }[] } {
  const { inp, chart, a, adoption: ad } = m;
  const owner = inp.owner || '당신';
  const ownerN = inp.owner ? `${inp.owner}님` : '당신';
  const dog = inp.dog;
  const st = STEM_TEXT[chart.day.s];
  const du = m.daeunAtAdopt;
  const nth = du ? `${du.idx}번째 대운` : '첫 대운도 오기 전';
  const nowK = m.daeunNow ? m.nowYear - m.daeunNow.startYear + 1 : 0;
  const prim = ADOPT[ad.primary];
  const BD = inp.dateKind === 'birth';
  const cameT = BD ? `${josa(dog, '이', '가')} 태어난 때` : `${josa(dog, '이', '가')} 온 때`;
  const adoptLabel = `${inp.adopt.y}.${String(inp.adopt.m).padStart(2, '0')}${inp.adopt.d ? '.' + String(inp.adopt.d).padStart(2, '0') : ''}`;
  const top = m.dist.slice(0, 3);
  const toc: { id: string; no: string; t: string; locked: boolean }[] = [];
  const T = (id: string, no: string, t: string, locked = false) => { toc.push({ id, no, t, locked }); };

  // ---------- 표지
  const head = `
  <div class="cover">
    <div class="cover-meta mono">
      <span>REPORT No.${m.reportNo}</span>
      <span>${pillarHanja(chart.day)} 일주</span>
      ${m.daeunNow ? `<span>${pillarHanja(m.daeunNow.pillar)} 대운 ${nowK}/10</span>` : ''}
      <span>${esc(dog)} D+${ad.dPlus.toLocaleString()}</span>
    </div>
    <div class="cover-art">
      <img src="${base}px/scene-${spriteKey(inp.breed, inp.color)}.gif" width="440" height="220" alt="${esc(josa(owner, '과', '와'))} ${esc(dog)}의 픽셀 그림" class="px">
    </div>
    <p class="cover-kick">${esc(ownerN)} 사주 위에 ${esc(dog)} 얹어 봄 <span class="mono">· ${esc(breedLabel(inp.breed, inp.color))}</span></p>
    <h1 class="cover-title">${esc(josa(dog, '은', '는'))}<br>${esc(ownerN)}의 <em>${nth}</em>에 왔다</h1>
    ${(() => { const v = verdictOf(m); return `<div class="verdict"><span class="mono">${esc(v.label)}</span><p>${esc(v.line1)}<br><b>${esc(v.line2)}</b></p><small>${esc(v.line3)}</small></div>`; })()}
    <div class="cover-facts">
      <div><span class="mono">${BD ? '생일' : '우리 집 온 날'}</span><b>${adoptLabel}</b></div>
      <div><span class="mono">그해</span><b>${pillarHanja(ad.pillars.year)}년 ${pillarHanja(ad.pillars.month)}월</b></div>
      <div><span class="mono">${du ? '대운' : '나이'}</span><b>${du ? `${pillarHanja(du.pillar)} ${ad.daeunYear}년 차` : `${inp.adopt.y - chart.solar.y}세`}</b></div>
      <div><span class="mono">${esc(dog)} 기둥</span><b>${pillarHanja(m.dogPillar)}</b></div>
    </div>
  </div>`;

  let body = '';

  // ---------- 01 원국
  T('s-chart', '01', '내 사주 여덟 글자');
  const relTxt = a.relations.length ? [...new Set(a.relations)].join(' · ') : '없음';
  body += `<section class="sec">${sec('s-chart', '01', '내 사주 여덟 글자', `${chart.solar.y}.${String(chart.solar.m).padStart(2, '0')}.${String(chart.solar.d).padStart(2, '0')}${chart.corrected ? ` ${String(inp.birth.hh).padStart(2, '0')}:${String(inp.birth.mm ?? 0).padStart(2, '0')}` : ''} · ${inp.birth.gender === 'f' ? '여' : '남'}`)}
    <div class="pillars">${pillarCol(m, '時 시', chart.hour)}${pillarCol(m, '日 일', chart.day, true)}${pillarCol(m, '月 월', chart.month)}${pillarCol(m, '年 년', chart.year)}</div>
    <div class="info">
      <div class="row"><span>일간</span><span><b>${STEMS[chart.day.s]} ${STEM_KO[chart.day.s]}${EL_KO[STEM_EL[chart.day.s]]}</b> · ${st.image}</span></div>
      <div class="row"><span>한마디로</span><span class="tags">${st.words.map((w) => `<span class="tag">${w}</span>`).join('')}</span></div>
      <div class="row"><span>남들 눈엔 / 실제론</span><span>${st.outside} <span class="mute">/</span> ${st.inside}</span></div>
      <div class="row"><span>보호자 타입</span><span>${st.asOwner}</span></div>
      <div class="row"><span>사주 안 충돌</span><span>${relTxt}</span></div>
      <div class="row"><span>띠</span><span>${BRANCH_ANIMAL[chart.year.b]}띠 · ${pillarKo(chart.year)}년생</span></div>
    </div>
    <div class="two-col">
      <div>
        <h3 class="sub">오행 <span class="mono mute">글자 수 · 비중</span></h3>
        ${elementBars(a.elWeight, a.elCount, chart.hour ? 8 : 6)}
        <p class="mono mute fine">${a.missing.length ? `아예 없는 거 ${a.missing.map((e) => EL_KO[e]).join('·')}` : '다섯 개 다 있음. 골고루 있는 편'}${a.excess.length ? ` · 몰려 있는 거 ${a.excess.map((e) => EL_KO[e]).join('·')}` : ''}</p>
      </div>
      <div>
        <h3 class="sub">십성 묶음 <span class="mono mute">비중</span></h3>
        <div class="hbars">${(['self', 'output', 'wealth', 'power', 'resource'] as const).map((g) => `
          <div class="hbar" data-tip="${GROUP_KO[g]} ${Math.round(a.groupWeight[g])}%"><span class="hb-l">${GROUP_KO[g]}</span><span class="hb-t"><i style="width:${Math.min(100, a.groupWeight[g] * 2)}%" class="ink"></i></span><span class="hb-v mono"><em>${Math.round(a.groupWeight[g])}%</em></span></div>`).join('')}</div>
        <h3 class="sub" style="margin-top:18px">버티는 힘 <span class="mono mute">신강 · 신약</span></h3>
        ${gauge(Math.round(a.strength), '신약', '신강')}
        <p class="mono mute fine">${Math.round(a.strength)} / 100 · ${a.strong ? '혼자서도 잘 버티는 쪽' : '주변 영향 꽤 받는 쪽'}</p>
      </div>
    </div>
  </section>`;

  // ---------- 02 대운
  T('s-flow', '02', '10년씩 끊어 본 인생');
  const adPrev = m.timeline.filter((p) => p.year >= inp.adopt.y - 3 && p.year < inp.adopt.y);
  const adNext = m.timeline.filter((p) => p.year >= inp.adopt.y && p.year < inp.adopt.y + 3);
  const avg = (xs: { v: number }[]) => (xs.length ? Math.round(xs.reduce((s, p) => s + p.v, 0) / xs.length) : 0);
  body += `<section class="sec">${sec('s-flow', '02', '10년씩 끊어 본 인생', `대운수 ${chart.daeunStartAge} · ${chart.daeunForward ? '순행' : '역행'}`)}
    <div class="stats">
      <div><span class="mono">${esc(cameT)}</span><b>${du ? `${du.idx}대운 ${ad.daeunYear}년 차` : '대운 전'}</b><small>${adoptLabel}</small></div>
      <div><span class="mono">지금</span><b>${m.daeunNow ? `${m.daeunNow.idx}대운 ${nowK}년 차` : '-'}</b><small>${m.daeunNow ? pillarHanja(m.daeunNow.pillar) + ' ' + pillarKo(m.daeunNow.pillar) : ''}</small></div>
      <div><span class="mono">다음 대운</span><b>${m.daeunNext ? `${m.daeunNext.startYear}년` : '-'}</b><small>${m.daeunNext ? `${m.daeunNext.startAge}세 · ${pillarHanja(m.daeunNext.pillar)}` : ''}</small></div>
      <div><span class="mono">${BD ? '태어나기 전 3년 → 후 3년' : '오기 전 3년 → 온 뒤 3년'}</span><b>${avg(adPrev)} → ${avg(adNext)}</b><small>운 점수 평균</small></div>
    </div>
    ${timelineChart(m.timeline, chart.daeun, m.daeunScores, m.nowYear, inp.adopt.y, `${dog} ${inp.adopt.y}`)}
    <div class="scroll-x"><table class="tbl dtable">
      <thead><tr><th>대운</th><th>나이</th><th>연도</th><th>간지</th><th>천간 십성</th><th>점수</th><th></th></tr></thead>
      <tbody>${chart.daeun.slice(0, 9).map((d, i) => {
        const isNow = m.daeunNow?.idx === d.idx, isAd = du?.idx === d.idx;
        const tg = tgOf(m, d.pillar.s);
        return `<tr class="${isNow ? 'now' : ''}${isAd ? ' ad' : ''}"><td class="mono">${d.idx}</td><td>${d.startAge}–${d.startAge + 9}</td><td class="mono">${d.startYear}</td><td><b class="hz">${pillarHanja(d.pillar)}</b> ${pillarKo(d.pillar)}</td><td>${TG_KO[tg]} <span class="mute">${TG_TEXT[tg].tag}</span></td><td>${spark(m.daeunScores[i])}<span class="mono"> ${m.daeunScores[i]}</span></td><td class="mono">${isAd ? `<span class="pin">${esc(dog)}</span>` : ''}${isNow ? '<span class="pin now">NOW</span>' : ''}</td></tr>`;
      }).join('')}</tbody></table></div>
  </section>`;

  // ---------- 03 입양 타이밍
  T('s-when', '03', cameT);
  const maxV = Math.max(...ad.ranked.map((r) => r.v), 1);
  const relY = [];
  if (ad.daeunTurn) relY.push('대운 교체기');
  body += `<section class="sec">${sec('s-when', '03', esc(cameT), ROUTE_KO[inp.route] ?? '')}
    ${BD ? `<p class="mono mute fine" style="margin:0 0 10px">생일 기준으로 계산했어요. 분양이면 실제로 만난 건 보통 몇 달 뒤라, 그해 전체 흐름으로 읽어 주세요.</p>` : ''}
    <div class="evid mono">
      <span>${adoptLabel}</span>
      <span>세운 ${pillarHanja(ad.pillars.year)} · ${TG_KO[ad.yearTg]}</span>
      <span>월운 ${pillarHanja(ad.pillars.month)} · ${TG_KO[ad.monthTg]}</span>
      ${relY.map((r) => `<span>${r}</span>`).join('')}
      <span>그해 운 점수 ${ad.score}</span>
    </div>
    ${ad.primary === 'rescue'
      ? `<p class="when-lead"><span class="mute">그해 ${esc(owner + '한테')} 온 건</span><br><b>${prim.title}</b>${hasBatchim(prim.title) ? '이었어요' : '였어요'}.</p>`
      : `<p class="when-lead"><span class="mute">${esc(josa(dog, '이', '가'))} ${BD ? '태어난' : '오던'} 해, ${esc(owner === '당신' ? '당신' : inp.owner + '님')}은</span><br><b>${prim.title}</b>${hasBatchim(prim.title) ? '이었을' : '였을'} 거예요.</p>`}
    <div class="when-grid">
      <div>
        <h3 class="sub">솔직히 몇 개 해당돼요? <span class="mono mute" data-count>0 / ${prim.checks.length}</span></h3>
        <div class="checks">${prim.checks.map((c, i) => `<label><input type="checkbox" data-k="${i}"><span>${c}</span></label>`).join('')}</div>
        <h3 class="sub" style="margin-top:22px">그때 이런 말 했을걸요</h3>
        <div class="says">${prim.quotes.map((q) => `<div class="say"><span>그때</span><q>${q}</q></div>`).join('')}</div>
      </div>
      <div>
        <h3 class="sub">그해 운이 가리키는 쪽 <span class="mono mute">계기별 점수</span></h3>
        <div class="hbars rank">${ad.ranked.filter((r) => r.v > 0 || r.id !== 'rescue').map((r) => `
          <div class="hbar${r.id === ad.primary ? ' on' : ''}" data-tip="${ADOPT[r.id].title} · ${r.v}"><span class="hb-l">${ADOPT[r.id].tag}</span><span class="hb-t"><i class="ink" style="width:${(r.v / maxV) * 100}%"></i></span><span class="hb-v mono"><em>${Math.round((r.v / maxV) * 100)}</em></span></div>`).join('')}</div>
        <div class="info" style="margin-top:18px">
          <div class="row"><span>세운 천간</span><span>${TG_KO[ad.yearTg]} ${TG_HANJA[ad.yearTg]} · ${TG_TEXT[ad.yearTg].words.slice(0, 3).join(', ')}</span></div>
          <div class="row"><span>세운 지지</span><span>${TG_KO[ad.yearBranchTg]} · ${TG_TEXT[ad.yearBranchTg].words.slice(0, 3).join(', ')}</span></div>
          <div class="row"><span>뭐가 바뀌었냐면</span><span><b>${prim.after}</b></span></div>
          <div class="row"><span>남들한테 댄 이유</span><span>"${ADOPT_DEEP[ad.primary].said}"</span></div>
          <div class="row"><span>한 겹 아래</span><span>${ADOPT_DEEP[ad.primary].real}</span></div>
        </div>
      </div>
    </div>
    <div class="also">${ad.secondary.map((id) => `<div class="also-i"><span class="mono">이것도 걸려 있음 · ${ADOPT[id].tag}</span><b>${ADOPT[id].title}</b><p>${ADOPT[id].checks.slice(0, 2).join(' / ')}</p></div>`).join('')}</div>
  </section>`;

  // ---------- 잠금
  const t1 = m.dist[0];
  const watchYears = m.years.filter((y) => y.score < 45 || y.dogClash).length;
  if (!unlocked) {
    T('s-lock', '04–09', '나머지 여섯 장', true);
    body += `<section class="sec lock" id="s-lock">
      <div class="lock-h">
        <span class="mono">04 – 09 · 나머지 여섯 장</span>
        <h2>여기서부터가 본론이에요</h2>
      </div>
      <ol class="lock-list">
        <li><span class="mono">04</span><b>${esc(josa(dog, '이', '가'))} 오고 나서 바뀐 것</b><span class="lk-v">${esc(josa(dog, '이', '가'))} 채워준 거 <b>${EL_KO[m.filled]}(${EL_HANJA[m.filled]})</b></span></li>
        <li><span class="mono">05</span><b>내 생각 버릇 10가지</b><span class="lk-v">1위 <span class="redact">${'█'.repeat(DIST[t1.id].name.length)}</span> · 상위 ${Math.max(1, 100 - t1.score)}%</span></li>
        <li class="lk-q"><span class="mono"></span><q>${DIST[t1.id].inner[0]}</q><span class="mono mute">혹시 이 말 자주 해요? 1위 버릇에서 나오는 말</span></li>
        <li><span class="mono">06</span><b>지금 10년, 다음 10년</b><span class="lk-v">${m.daeunNow ? pillarHanja(m.daeunNow.pillar) : '-'} → ${m.daeunNext ? pillarHanja(m.daeunNext.pillar) : '-'}</span></li>
        <li><span class="mono">07</span><b>${esc(josa(dog, '이랑', '랑'))} 같이 갈 10년</b><span class="lk-v">${m.nowYear}–${m.nowYear + 9} · 조심할 해 ${watchYears}번</span></li>
        <li><span class="mono">08</span><b>${esc(josa(dog, '이랑', '랑'))} 주고받는 것</b><span class="lk-v">받는 거 / 줄 거 / 내려놓을 거</span></li>
        <li><span class="mono">09</span><b>인스타용 카드</b><span class="lk-v">이미지 저장</span></li>
      </ol>
      <div class="lock-blur" aria-hidden="true">
        <div class="ghost-bars">${Array.from({ length: 10 }, (_, i) => `<i style="width:${88 - i * 7}%"></i>`).join('')}</div>
      </div>
      <div class="buy">
        <a class="btn" data-buy href="${CONFIG.grobleUrl}" target="_blank" rel="noopener">나머지 다 보기 · ${CONFIG.priceLabel}</a>
        <a class="btn ghost" href="${base}unlock.html">코드 있어요</a>
        <a class="wl lock-sample" href="${base}sample.html">결제하면 어떻게 나오는지 예시 먼저 볼래요</a>
      </div>
      <details class="find" data-find hidden>
        <summary class="mono">이미 결제했어요 (다른 기기·브라우저에서 보는 중)</summary>
        <p class="mono mute fine">결제할 때와 똑같이 입력한 리포트에서, 결제할 때 쓴 휴대폰 번호를 넣으면 열려요.</p>
        <form class="ul-form find-f" novalidate>
          <input name="id" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000" aria-label="결제할 때 쓴 휴대폰 번호">
          <button class="btn" type="submit">열기</button>
        </form>
        <p class="mono fine" data-find-msg role="status"></p>
      </details>
      <p class="mono mute fine">${autoPay() ? '그로블에서 결제하면 이 리포트로 돌아와서 바로 열려요. 코드 넣을 필요 없어요. 생일 같은 입력 정보는 원문 그대로 저장되지 않아요.' : '그로블에서 결제하면 코드가 바로 와요. 한 번 넣으면 이 브라우저에선 계속 열려 있고, 입력한 정보는 어디에도 저장 안 돼요.'}</p>
    </section>`;
  } else {
    body += renderPaid(m);
    T('s-after', '04', '오기 전과 후'); T('s-dist', '05', '생각 버릇 10'); T('s-now', '06', '지금 10년');
    T('s-years', '07', '같이 갈 10년'); T('s-give', '08', '주고받는 것'); T('s-share', '09', '인스타용 카드');
  }
  if (!unlocked) T('s-share', '··', '표지 카드');
  if (!unlocked) body += shareBlock(m, false);

  return { head, body, toc };
}

function shareBlock(m: Model, paid: boolean) {
  return `<section class="sec">${sec('s-share', paid ? '09' : '··', paid ? '인스타용 카드' : '표지만 먼저 저장', '1080 × 1350')}
    <div class="share">
      <canvas class="share-c" width="1080" height="1350" aria-label="공유 카드 미리보기"></canvas>
      <div class="share-a">
        <button class="btn" data-save>이미지로 저장</button>
        <button class="btn ghost" data-copy>결과 링크 복사</button>
        <p class="mono mute fine">카드엔 생일 안 들어가요. 링크엔 입력한 정보가 들어 있으니까 단톡방 같은 데 올릴 땐 한 번 생각하고 올리기.</p>
      </div>
    </div>
  </section>`;
}

function renderPaid(m: Model): string {
  const { inp, chart, a } = m;
  const BD = inp.dateKind === 'birth';
  const dog = inp.dog;
  let h = '';

  // 04 입양 전후
  const et = EL_TEXT[m.filled];
  const dEls = [STEM_EL[m.dogPillar.s], BRANCH_EL[m.dogPillar.b]];
  h += `<section class="sec">${sec('s-after', '04', `${esc(josa(dog, '이', '가'))} 오고 나서 바뀐 것`, '내 8글자 + 입양일 2글자')}
    <div class="dogp">
      <div class="dp-c"><span class="mono">${esc(dog)}의 기둥</span><b class="hz big">${pillarHanja(m.dogPillar)}</b><small>${pillarKo(m.dogPillar)} · ${BD ? (inp.adopt.d ? '생일 일주' : '생일 달 월주') : inp.adopt.d ? '온 날 일주' : '온 달 월주'}</small></div>
      <div class="dp-c"><span class="mono">들고 온 기운</span><b>${dEls.map((e) => `${elDot(e)}${EL_KO[e]}`).join(' ')}</b><small>${dEls.map((e) => EL_HANJA[e]).join(' · ')}</small></div>
      <div class="dp-c"><span class="mono">채워준 자리</span><b>${EL_KO[m.filled]} ${EL_HANJA[m.filled]}</b><small>원래 ${a.elCount[m.filled]}글자</small></div>
    </div>
    <div class="shift"><span>${et.before}</span><i>→</i><b>${et.after}</b></div>
    <div class="legend mono"><span><i class="lg-b"></i>오기 전</span><span><i class="lg-a"></i>온 뒤</span></div>
    ${pairedBars(m.elBefore, m.elAfter, m.filled)}
    <div class="info" style="margin-top:18px">
      <div class="row"><span>${EL_KO[m.filled]} 모자라면</span><span>${et.lack.join(', ')}</span></div>
      <div class="row"><span>${esc(josa(dog, '이', '가'))} 준 거</span><span>${et.gives.join(', ')}</span></div>
      <div class="row"><span>같이 하면 좋은 거</span><span>${et.act}</span></div>
      <div class="row"><span>달라진 하루</span><span>${ADOPT[m.adoption.primary].after}</span></div>
    </div>
  </section>`;

  // 05 인지왜곡
  const top = m.dist.slice(0, 3);
  h += `<section class="sec">${sec('s-dist', '05', '내 생각 버릇 10가지', '인지왜곡 · 2만 명 중 위치')}
    <p class="lead-s">사주에 한쪽으로 쏠린 기운은 생각 버릇으로 튀어나와요. 심리상담에서 말하는 인지왜곡 10가지에 맞춰 점수를 매겼어요. 높을수록 "어 이거 난데" 할 확률이 높아요. 오른쪽 화살표는 지금 대운에서 더 심해지는지, 덜해지는지.</p>
    <div class="legend mono"><span><i class="lg-a ink"></i>타고난 점수</span><span><i class="lg-tick"></i>요즘 (대운 반영)</span></div>
    ${distBars(m.dist.map((d, i) => ({ name: DIST[d.id].name, score: d.score, delta: d.delta, top: i < 3 })))}
    ${top.map((d, i) => distCard(m, d.id, i + 1, d.score, d.delta)).join('')}
    <h3 class="sub" style="margin-top:32px">나머지 일곱 개</h3>
    <ul class="rest">${m.dist.slice(3).map((d) => `<li><span class="mono">${d.score}</span><b>${DIST[d.id].name}</b><span>${DIST[d.id].def}</span><q>${DIST[d.id].inner[1]}</q></li>`).join('')}</ul>
  </section>`;

  // 06 대운 상세
  const dCard = (d: typeof m.daeunNow, label: string) => {
    if (!d) return '';
    const tg = tgOf(m, d.pillar.s), tgb = tgOf(m, mainHidden(d.pillar.b));
    const th = GROUP_THEME[TG_GROUP[tg]];
    return `<div class="dcard">
      <span class="mono">${label} · ${d.idx}대운 · ${d.startYear}–${d.endYear}</span>
      <b class="hz big">${pillarHanja(d.pillar)}</b>
      <small>${pillarKo(d.pillar)} · ${d.startAge}–${d.startAge + 9}세 · 점수 ${m.daeunScores[d.idx - 1]}</small>
      <p class="dc-t">${th.ten}</p>
      <div class="tags">${[...th.words, ...TG_TEXT[tgb].words.slice(0, 2)].map((w) => `<span class="tag">${w}</span>`).join('')}</div>
      <div class="info">
        <div class="row"><span>천간 ${TG_KO[tg]}</span><span>잘 풀리는 거: ${TG_TEXT[tg].good}<br><span class="mute">조심할 거: ${TG_TEXT[tg].watch}</span></span></div>
        <div class="row"><span>지지 ${TG_KO[tgb]}</span><span>잘 풀리는 거: ${TG_TEXT[tgb].good}<br><span class="mute">조심할 거: ${TG_TEXT[tgb].watch}</span></span></div>
        <div class="row"><span>${esc(josa(dog, '과', '와'))}</span><span>${TG_TEXT[tg].dog}</span></div>
      </div>
    </div>`;
  };
  h += `<section class="sec">${sec('s-now', '06', '지금 10년, 다음 10년')}
    <div class="two-col">${dCard(m.daeunNow, '지금')}${dCard(m.daeunNext, '다음')}</div>
  </section>`;

  // 07 10년 표
  h += `<section class="sec">${sec('s-years', '07', `${esc(josa(dog, '이랑', '랑'))} 같이 갈 10년`, '해마다 운')}
    <div class="scroll-x"><table class="tbl ytable">
      <thead><tr><th>연도</th><th>나이</th><th>세운</th><th>십성</th><th>단어</th><th>점수</th><th>조심할 달</th><th>좋은 달</th><th>${esc(dog)}</th></tr></thead>
      <tbody>${m.years.map((y) => {
        const dl = y.dogClash ? `${esc(josa(dog, '이랑', '랑'))} 부딪히는 해. 이사나 환경 바뀌는 거 조심` : y.dogHarmony ? `${esc(josa(dog, '이랑', '랑'))} 합 맞는 해. 같이 잘 풀림` : TG_TEXT[y.tg].dog;
        return `<tr class="${y.score < 45 ? 'low' : y.score >= 62 ? 'high' : ''}">
          <td class="mono">${y.year}</td><td>${y.age}</td><td><b class="hz">${pillarHanja(y.pillar)}</b></td>
          <td>${TG_KO[y.tg]}</td><td>${TG_TEXT[y.tg].tag}</td>
          <td>${spark(y.score)}<span class="mono"> ${y.score}</span></td>
          <td class="mono">${y.watchMonth}월</td><td class="mono">${y.bestMonth}월</td>
          <td class="dogc">${y.dogAge !== null && y.dogAge >= 0 ? `<span class="mono mute">${y.dogAge}살</span> ` : `<span class="mono mute">함께 ${y.together + 1}년 차</span> `}${dl}</td></tr>`;
      }).join('')}</tbody></table></div>
    <p class="mono mute fine">달은 절기로 쳐서 그달 4~8일쯤부터예요. 45점 아래는 옅은 빨강, 62점 넘으면 굵게.</p>
  </section>`;

  // 08 주고받는 것
  const excess = EL_ORDER.slice().sort((x, y) => a.elWeight[y] - a.elWeight[x])[0];
  const gives = [...new Set(dEls.flatMap((e) => EL_TEXT[e].gives))];
  const acts = [...new Set(dEls.map((e) => EL_TEXT[e].act))];
  h += `<section class="sec">${sec('s-give', '08', `${esc(josa(dog, '이랑', '랑'))} 주고받는 것`)}
    <div class="signals">
      <div><h3>${esc(dog)}한테 받는 거</h3><ul>${gives.map((g) => `<li>${g}</li>`).join('')}<li>${ADOPT[m.adoption.primary].after.split('→')[1].trim()}</li></ul></div>
      <div><h3>${esc(dog)}한테 줄 거</h3><ul>${acts.map((g) => `<li>${g}</li>`).join('')}<li>${STEM_TEXT[chart.day.s].asOwner} 특유의 속도</li></ul></div>
      <div><h3>이제 내려놓을 거</h3><ul>${EL_TEXT[excess].excess.map((g) => `<li>${g}</li>`).join('')}<li>${DIST[m.dist[0].id].reframe[0].from}</li></ul></div>
    </div>
  </section>`;

  h += shareBlock(m, true);
  return h;
}

function distCard(m: Model, id: keyof typeof DIST, rank: number, score: number, delta: number): string {
  const c = DIST[id];
  const dog = m.inp.dog;
  return `<article class="dcard-x">
    <header>
      <span class="mono rk">${String(rank).padStart(2, '0')}</span>
      <h3>${c.name}</h3><span class="mono en">${c.en}</span>
      <span class="mono pct">상위 ${Math.max(1, 100 - score)}%</span>
    </header>
    <p class="doc-line">${c.def}</p>
    <div class="basis mono">사주 근거 ${c.factors.map((f) => `<span>${f.label} <b>${factorValue(m, f.k)}</b></span>`).join('')}<span>요즘 <b>${delta > 2 ? '▲ 더 심해짐' : delta < -2 ? '▼ 좀 덜해짐' : '그대로'}</b></span></div>
    <div class="xg">
      <div>
        <h4>머릿속 자동재생</h4>
        <ul class="inner">${c.inner.map((q) => `<li><q>${q}</q></li>`).join('')}</ul>
      </div>
      <div>
        <h4>이럴 때 발동</h4>
        <div class="tags">${c.when.map((w) => `<span class="tag">${w}</span>`).join('')}</div>
        <h4 style="margin-top:16px">그래서 생기는 일</h4>
        <div class="tags">${c.costs.map((w) => `<span class="tag on">${w}</span>`).join('')}</div>
      </div>
    </div>
    <h4>실제로는 이런 식</h4>
    ${c.scenes.map((s) => `<div class="scene"><span class="mono">${s.at}</span>${s.line}</div>`).join('')}
    <h4>한 겹 더 들어가 보면</h4>
    <div class="info deep">
      <div class="row"><span>겉으로 대는 이유</span><span>"${DIST_DEEP[id].said}"</span></div>
      <div class="row"><span>속을 뜯어보면</span><span><b>${DIST_DEEP[id].real}</b></span></div>
      <div class="row"><span>억울할 수 있는데</span><span>${DIST_DEEP[id].fair}</span></div>
      <div class="row"><span>비유하면</span><span>${DIST_DEEP[id].like}</span></div>
      <div class="row"><span>확인하는 법</span><span>${DIST_DEEP[id].test}</span></div>
      <div class="row"><span>기준 낮추기</span><span>${DIST_DEEP[id].bar}</span></div>
    </div>
    <div class="note-box dogbox"><h3>${esc(josa(dog, '이', '가'))} 끊어주는 순간</h3>${c.dog.map((d) => `<p>${d.replace(/강아지는|강아지가|강아지한테|강아지와|강아지도|강아지 털/g, (w) => esc(dog) + (w === '강아지는' ? (hasBatchim(dog) ? '은' : '는') : w === '강아지가' ? (hasBatchim(dog) ? '이' : '가') : w === '강아지한테' ? '한테' : w === '강아지도' ? '도' : w === '강아지 털' ? ' 털' : (hasBatchim(dog) ? '과' : '와')))}</p>`).join('')}</div>
    <div class="talk"><div class="hd">원래 하던 말</div><div class="hd">이렇게 바꿔 말하면</div>${c.reframe.map((r) => `<div>${r.from}</div><div>${r.to}</div>`).join('')}</div>
  </article>`;
}
