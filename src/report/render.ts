import type { Model } from './model';
import { FOCUS_SLOT } from './model';
import {
  STEMS, BRANCHES, STEM_KO, BRANCH_KO, STEM_EL, BRANCH_EL, EL_KO, TG_KO, TG_GROUP, GROUP_KO,
  tenGod, mainHidden, pillarHanja, pillarKo, BRANCH_ANIMAL, type El, type Pillar, type TenGod, EL_ORDER,
} from '../saju/constants';
import type { RepeatYear } from '../engine/repeat';
import { DIST } from '../content/distortions';
import { STEM_TEXT, TG_TEXT, GROUP_THEME, EL_TEXT } from '../content/saju';
import { COPE, COPE_DEEP } from '../content/coping';
import { CONFLICT } from '../content/conflict';
import { EVENT, SLOT, SEASON, REL_TEXT, REL_NONE, WITH_KO, WITH_MEAN, NEXT_LINE } from '../content/events';
import { elementBars, timelineChart, distBars, gauge, spark, elVar } from '../charts/charts';
import { CONFIG } from '../config';
import { autoPay } from '../unlock';
import { base } from '../paths';
import { VERDICT, VERDICT_META } from '../content/verdict';
import { DIST_DEEP } from '../content/deep';

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
const redact = (n: number) => `<span class="redact">${'█'.repeat(Math.max(2, n))}</span>`;

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

/** 반복된 해의 사주 근거 한 줄: "卯가 일지 酉를 정면으로 친 해 · 묘유충" */
export function relLine(m: Model, r: RepeatYear): string {
  const ga = (ko: string) => (hasBatchim(ko) ? '이' : '가'), eul = (ko: string) => (hasBatchim(ko) ? '을' : '를');
  if (!r.rel) { const t = TG_KO[tgOf(m, r.pillar.s)]; return `세운 ${pillarHanja(r.pillar)} · ${t}${ga(t)} ${SLOT[r.slot].saju}를 흔든 해`; }
  const a = r.pillar.b, b = r.rel.branch;
  return `${BRANCHES[a]}${ga(BRANCH_KO[a])} ${WITH_KO[r.rel.with]}(${WITH_MEAN[r.rel.with]}) ${BRANCHES[b]}${eul(BRANCH_KO[b])} ${REL_TEXT[r.rel.kind].verb} 해 · ${BRANCH_KO[a]}${BRANCH_KO[b]}${r.rel.kind}`;
}

/** 반복된 해 문장: "2019년 늦가을. {장면} {대처}" */
export function eventLine(m: Model, r: RepeatYear): string {
  const c = COPE[m.cope[0].id];
  // 대처 문장은 해마다 돌아가며 (지나온 해 · 다음 해를 이어서 센다)
  if (r.year >= m.nowYear) return `${r.year}년 ${SEASON[r.month]}. ${SLOT[r.slot].who} ${NEXT_LINE.a} "${DIST[r.dist].inner[0]}"${NEXT_LINE.b}`;
  const k = m.repeats.past.findIndex((x) => x.year === r.year);
  return `${r.year}년 ${SEASON[r.month]}. ${EVENT[r.dist][r.slot]} ${c.did[(Math.max(0, k) + Number(m.reportNo)) % c.did.length]}`;
}

function repeatRows(m: Model, rows: RepeatYear[], open: (r: RepeatYear, i: number) => boolean, future = false): string {
  return `<div class="rys">${rows.map((r, i) => `
    <div class="ry${future ? ' next' : ''}">
      <div class="ry-y"><b>${r.year}</b><span class="mono">${r.age}세 · ${pillarHanja(r.pillar)}</span><span class="mono ry-w">${esc(SLOT[r.slot].who)}</span></div>
      <div class="ry-t">
        <span class="mono">${esc(relLine(m, r))}</span>
        ${open(r, i) ? `<p>${esc(eventLine(m, r))}</p>` : `<p class="ry-lock">${redact(18)} ${redact(9)} ${redact(14)}<span class="mono">결제하면 열려요</span></p>`}
      </div>
    </div>`).join('')}</div>`;
}

/** 표지 한 줄 */
export interface Verdict { label: string; line1: string; line2: string; line3: string }
/** 관리자 페이지에서 문구를 직접 지정할 때 (full-*.html 의 data-verdict) */
let verdictOverride: Verdict | null = null;
export const setVerdictOverride = (v: Verdict | null) => { verdictOverride = v; };

export function verdictOf(m: Model): Verdict {
  if (verdictOverride) return verdictOverride;
  const top = m.dist[0];
  const seed = Number(m.reportNo);
  const years = m.repeats.past.map((r) => r.year).join(' · ');
  return {
    label: VERDICT_META.label,
    line1: years ? `${years}년. ${VERDICT_META.back}` : VERDICT_META.back,
    line2: `${VERDICT[top.id][seed % VERDICT[top.id].length]} ${COPE[m.cope[0].id].verdict}.`,
    line3: top.delta > 2 ? VERDICT_META.up : top.delta < -2 ? VERDICT_META.down : VERDICT_META.flat,
  };
}

export function renderReport(m: Model, unlocked: boolean): { head: string; body: string; toc: { id: string; no: string; t: string; locked: boolean }[] } {
  const { inp, chart, a } = m;
  const ownerN = inp.owner ? `${inp.owner}님` : '당신';
  const st = STEM_TEXT[chart.day.s];
  const nowK = m.daeunNow ? m.nowYear - m.daeunNow.startYear + 1 : 0;
  const d0 = DIST[m.dist[0].id], c0 = COPE[m.cope[0].id], k0 = CONFLICT[m.conflict[0].id];
  const past = m.repeats.past, last = past[past.length - 1];
  const toc: { id: string; no: string; t: string; locked: boolean }[] = [];
  const T = (id: string, no: string, t: string, locked = false) => { toc.push({ id, no, t, locked }); };
  const nextY = m.repeats.next[0];

  // ---------- 표지
  const v = verdictOf(m);
  const head = `
  <div class="cover">
    <div class="cover-meta mono">
      <span>REPORT No.${m.reportNo}</span>
      <span>${pillarHanja(chart.day)} 일주</span>
      ${m.daeunNow ? `<span>${pillarHanja(m.daeunNow.pillar)} 대운 ${nowK}/10</span>` : ''}
      <span>만 ${m.age}세</span>
    </div>
    <p class="cover-kick">${esc(ownerN)} 사주 여덟 글자 l 대운 · 세운 대조</p>
    <h1 class="cover-title">${esc(ownerN)} 사주에서<br><em>${past.length}번</em> 되풀이된 장면</h1>
    <div class="verdict"><span class="mono">${esc(v.label)}</span><p>${esc(v.line1)}<br><b>${esc(v.line2)}</b></p><small>${esc(v.line3)}</small></div>
    <div class="cover-facts">
      <div><span class="mono">일주</span><b>${pillarHanja(chart.day)}</b></div>
      <div><span class="mono">지금 대운</span><b>${m.daeunNow ? `${pillarHanja(m.daeunNow.pillar)} ${nowK}년 차` : '대운 전'}</b></div>
      <div><span class="mono">되풀이된 해</span><b>${past.length ? `${past[0].year}–${last.year}` : '-'}</b></div>
      <div><span class="mono">다음 차례</span><b>${nextY ? (unlocked ? `${nextY.year}년` : `${String(nextY.year).slice(0, 2)}██년`) : '-'}</b></div>
    </div>
  </div>`;

  let body = '';

  // ---------- 01 원국
  T('s-chart', '01', '사주 여덟 글자');
  const relTxt = a.relations.length ? [...new Set(a.relations)].join(' · ') : '없음';
  const exc = EL_ORDER.slice().sort((x, y) => a.elWeight[y] - a.elWeight[x])[0];
  body += `<section class="sec">${sec('s-chart', '01', '사주 여덟 글자', `${chart.solar.y}.${String(chart.solar.m).padStart(2, '0')}.${String(chart.solar.d).padStart(2, '0')}${chart.corrected ? ` ${String(inp.birth.hh).padStart(2, '0')}:${String(inp.birth.mm ?? 0).padStart(2, '0')}` : ''} · ${inp.birth.gender === 'f' ? '여' : '남'}`)}
    <div class="pillars">${pillarCol(m, '時 시', chart.hour)}${pillarCol(m, '日 일', chart.day, true)}${pillarCol(m, '月 월', chart.month)}${pillarCol(m, '年 년', chart.year)}</div>
    <div class="info">
      <div class="row"><span>일간</span><span><b>${STEMS[chart.day.s]} ${STEM_KO[chart.day.s]}${EL_KO[STEM_EL[chart.day.s]]}</b> · ${st.image}</span></div>
      <div class="row"><span>한마디로</span><span class="tags">${st.words.map((w) => `<span class="tag">${w}</span>`).join('')}</span></div>
      <div class="row"><span>남들 눈엔 / 실제론</span><span>${st.outside} <span class="mute">/</span> ${st.inside}</span></div>
      <div class="row"><span>일할 때</span><span>${st.work}</span></div>
      <div class="row"><span>몰린 기운</span><span>${EL_KO[exc]} · ${EL_TEXT[exc].excess.join(', ')}</span></div>
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
  const inDaeun = (y: number, d: { startYear: number; endYear: number }) => y >= d.startYear && y <= d.endYear;
  body += `<section class="sec">${sec('s-flow', '02', '10년씩 끊어 본 인생', `대운수 ${chart.daeunStartAge} · ${chart.daeunForward ? '순행' : '역행'}`)}
    <div class="stats">
      <div><span class="mono">지금</span><b>${m.daeunNow ? `${m.daeunNow.idx}대운 ${nowK}년 차` : '-'}</b><small>${m.daeunNow ? pillarHanja(m.daeunNow.pillar) + ' ' + pillarKo(m.daeunNow.pillar) : ''}</small></div>
      <div><span class="mono">다음 대운</span><b>${m.daeunNext ? `${m.daeunNext.startYear}년` : '-'}</b><small>${m.daeunNext ? `${m.daeunNext.startAge}세 · ${pillarHanja(m.daeunNext.pillar)}` : ''}</small></div>
      <div><span class="mono">되풀이된 해</span><b>${past.length}번</b><small>${past.map((r) => r.year).join(' · ')}</small></div>
      <div><span class="mono">지금 대운 점수</span><b>${m.daeunNow ? m.daeunScores[m.daeunNow.idx - 1] : '-'}</b><small>50이 보통</small></div>
    </div>
    ${timelineChart(m.timeline, chart.daeun, m.daeunScores, m.nowYear, past.map((r) => ({ year: r.year, label: String(r.year) })))}
    <p class="mono mute fine">네모 표시가 같은 장면이 되풀이된 해예요. 03장에서 한 해씩 짚어요.</p>
    <div class="scroll-x"><table class="tbl dtable">
      <thead><tr><th>대운</th><th>나이</th><th>연도</th><th>간지</th><th>천간 십성</th><th>점수</th><th></th></tr></thead>
      <tbody>${chart.daeun.slice(0, 9).map((d, i) => {
        const isNow = m.daeunNow?.idx === d.idx;
        const hits = past.filter((r) => inDaeun(r.year, d)).length;
        const tg = tgOf(m, d.pillar.s);
        return `<tr class="${isNow ? 'now' : ''}${hits ? ' ad' : ''}"><td class="mono">${d.idx}</td><td>${d.startAge}–${d.startAge + 9}</td><td class="mono">${d.startYear}</td><td><b class="hz">${pillarHanja(d.pillar)}</b> ${pillarKo(d.pillar)}</td><td>${TG_KO[tg]} <span class="mute">${TG_TEXT[tg].tag}</span></td><td>${spark(m.daeunScores[i])}<span class="mono"> ${m.daeunScores[i]}</span></td><td class="mono">${hits ? `<span class="pin">되풀이 ${hits}</span>` : ''}${isNow ? '<span class="pin now">NOW</span>' : ''}</td></tr>`;
      }).join('')}</tbody></table></div>
  </section>`;

  // ---------- 03 반복된 패턴
  T('s-loop', '03', '이미 몇 번 겪은 일');
  const top = m.dist[0].id;
  const checks: string[] = [];
  if (last) {
    const sl = SLOT[last.slot];
    checks.push(`${last.month}월 전후로, ${sl.check[0]}`, sl.check[1], `"${d0.inner[0]}" 이 말을 그해 여러 번 했다`, c0.check, last.rel ? REL_TEXT[last.rel.kind].sign : REL_NONE.sign);
    if (inp.focus && FOCUS_SLOT[inp.focus] !== last.slot) checks.push(SLOT[FOCUS_SLOT[inp.focus]].check[0]);
  }
  body += `<section class="sec">${sec('s-loop', '03', '이미 몇 번 겪은 일', '세운이 원국을 건드린 해')}
    <p class="when-lead"><span class="mute">${esc(ownerN)} 사주에서 되풀이되는 고리</span><br><b>${esc(d0.alias)}</b> · <b>${esc(c0.name)}</b></p>
    <div class="loop">
      <div><span class="mono">01 이럴 때</span><b>${k0.trigger}</b><small>${k0.name}</small></div>
      <div><span class="mono">02 머릿속에선</span><b>"${d0.inner[0]}"</b><small>${d0.alias}</small></div>
      <div><span class="mono">03 그래서 나는</span><b>${c0.verdict}</b><small>${c0.name} · 남들 눈엔 "${c0.looks}"</small></div>
      <div><span class="mono">04 결국</span><b>${c0.costs[0]}</b><small>${d0.costs[0]}</small></div>
    </div>
    <div class="basis mono">사주 근거 ${d0.factors.map((f) => `<span>${f.label} <b>${factorValue(m, f.k)}</b></span>`).join('')}<span>신강도 <b>${Math.round(a.strength)}</b></span></div>
    <p class="lead-s">${d0.saju}</p>

    <h3 class="sub" style="margin-top:28px">되풀이된 해 <span class="mono mute">${past.length}번 · 세운 × 원국</span></h3>
    ${past.length ? repeatRows(m, past, (r) => unlocked || r === last) : '<p class="mute">아직 짚을 만큼 지나온 해가 많지 않아요. 08장 앞으로 10년에서 먼저 볼 해를 짚어요.</p>'}

    ${last ? `<div class="when-grid" style="margin-top:28px">
      <div>
        <h3 class="sub">${last.year}년, 몇 개 맞아요? <span class="mono mute" data-count>0 / ${checks.length}</span></h3>
        <div class="checks">${checks.map((c, i) => `<label><input type="checkbox" data-k="${i}"><span>${esc(c)}</span></label>`).join('')}</div>
      </div>
      <div>
        <h3 class="sub">한 겹 아래</h3>
        <div class="info deep">
          <div class="row"><span>그때 남들한테 댄 이유</span><span>"${DIST_DEEP[top].said}"</span></div>
          <div class="row"><span>속을 뜯어보면</span><span><b>${DIST_DEEP[top].real}</b></span></div>
          <div class="row"><span>${esc(c0.name)}를 고른 이유</span><span>${COPE_DEEP[m.cope[0].id].real}</span></div>
        </div>
      </div>
    </div>` : ''}
  </section>`;

  // ---------- 잠금
  if (!unlocked) {
    const d1 = DIST[m.dist[1].id], d2 = DIST[m.dist[2].id];
    T('s-lock', '04–09', '나머지 여섯 장', true);
    body += `<section class="sec lock" id="s-lock">
      <div class="lock-h">
        <span class="mono">04 – 09 · 나머지 여섯 장</span>
        <h2>${past.length > 1 ? `나머지 ${past.length - 1}개 해, 그리고 다음 차례` : '다음 차례'}</h2>
      </div>
      <ol class="lock-list">
        <li><span class="mono">04</span><b>생각 버릇 10가지</b><span class="lk-v">1위 ${esc(d0.alias)} · 2위 ${redact(d1.alias.length)} · 3위 ${redact(d2.alias.length)}</span></li>
        <li class="lk-q"><span class="mono"></span><q>${d1.inner[0]}</q><span class="mono mute">이 말도 자주 해요? 2위 버릇에서 나오는 말</span></li>
        <li><span class="mono">05</span><b>부딪히는 자리</b><span class="lk-v">${esc(k0.name)} 외 5곳 · 되풀이된 해 ${past.length}개 전부</span></li>
        <li><span class="mono">06</span><b>버티는 방식</b><span class="lk-v">${esc(c0.name)} 상위 ${redact(2)}% · 6가지 순위</span></li>
        <li><span class="mono">07</span><b>지금 10년, 다음 10년</b><span class="lk-v">${m.daeunNow ? pillarHanja(m.daeunNow.pillar) : '-'} → ${m.daeunNext ? pillarHanja(m.daeunNext.pillar) : '-'}</span></li>
        <li><span class="mono">08</span><b>앞으로 10년</b><span class="lk-v">같은 장면 올 해 ${nextY ? `${String(nextY.year).slice(0, 2)}${redact(2)}년` : '-'} · 일지 충 ${m.years.filter((y) => y.ownerClash).length}번</span></li>
        <li><span class="mono">09</span><b>저장 카드</b><span class="lk-v">이미지 저장</span></li>
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
    T('s-share', '··', '표지 카드');
    body += shareBlock(m, false);
  } else {
    body += renderPaid(m);
    T('s-dist', '04', '생각 버릇 10'); T('s-fight', '05', '부딪히는 자리'); T('s-cope', '06', '버티는 방식');
    T('s-now', '07', '지금 10년'); T('s-years', '08', '앞으로 10년'); T('s-share', '09', '저장 카드');
  }

  return { head, body, toc };
}

function shareBlock(m: Model, paid: boolean) {
  void m;
  return `<section class="sec">${sec('s-share', paid ? '09' : '··', paid ? '저장 카드' : '표지만 먼저 저장', '1080 × 1350')}
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
  const { inp, a } = m;
  let h = '';

  // 04 생각 버릇
  const top = m.dist.slice(0, 3);
  h += `<section class="sec">${sec('s-dist', '04', '생각 버릇 10가지', '사주 비중 · 2만 명 중 위치')}
    <p class="lead-s">사주에서 한쪽으로 쏠린 기운은 생각 버릇으로 튀어나와요. 내 십성·오행 비중을 무작위 사주 2만 개와 비교해서 순위를 매겼어요. 오른쪽 화살표는 지금 대운에서 더 세지는지, 덜해지는지.</p>
    <div class="legend mono"><span><i class="lg-a ink"></i>타고난 점수</span><span><i class="lg-tick"></i>요즘 (대운 반영)</span></div>
    ${distBars(m.dist.map((d, i) => ({ name: DIST[d.id].alias, score: d.score, delta: d.delta, top: i < 3 })))}
    ${top.map((d, i) => distCard(m, d.id, i + 1, d.score, d.delta)).join('')}
    <h3 class="sub" style="margin-top:32px">나머지 일곱 개</h3>
    <ul class="rest">${m.dist.slice(3).map((d) => `<li><span class="mono">${d.score}</span><b>${DIST[d.id].alias}</b><span>${DIST[d.id].def}</span><q>${DIST[d.id].inner[1]}</q></li>`).join('')}</ul>
  </section>`;

  // 05 갈등
  const order = ['가족', '연인', '일', '친구'];
  const first = { work: '일', love: '연인', family: '가족', money: '일', self: '친구', '': '' }[inp.focus];
  const sceneOrder = first ? [first, ...order.filter((o) => o !== first)] : order;
  h += `<section class="sec">${sec('s-fight', '05', '부딪히는 자리', '같은 싸움이 되풀이되는 곳')}
    ${distBars(m.conflict.map((c, i) => ({ name: CONFLICT[c.id].name, score: c.score, delta: c.delta, top: i < 2 })))}
    ${m.conflict.slice(0, 2).map((c, i) => {
      const x = CONFLICT[c.id];
      return `<article class="dcard-x">
        <header><span class="mono rk">${String(i + 1).padStart(2, '0')}</span><h3>${x.name}</h3><span class="mono pct">상위 ${Math.max(1, 100 - c.score)}%</span></header>
        <p class="doc-line">${x.saju}</p>
        <div class="info">
          <div class="row"><span>이럴 때 시작</span><span><b>${x.trigger}</b></span></div>
          ${sceneOrder.map((at) => { const s = x.scenes.find((y) => y.at === at)!; return `<div class="row"><span>${s.at}</span><span>${s.line}</span></div>`; }).join('')}
          <div class="row"><span>그래서 생기는 일</span><span class="tags">${x.costs.map((w) => `<span class="tag on">${w}</span>`).join('')}</span></div>
          <div class="row"><span>다음엔 이 말</span><span>${x.say}</span></div>
        </div>
      </article>`;
    }).join('')}
    <h3 class="sub" style="margin-top:32px">되풀이된 해 전부 <span class="mono mute">지나온 해</span></h3>
    ${m.repeats.past.length ? repeatRows(m, m.repeats.past, () => true) : '<p class="mute">아직 짚을 만큼 지나온 해가 없어요.</p>'}
    ${m.repeats.next.length ? `<h3 class="sub" style="margin-top:24px">다음 차례 <span class="mono mute">앞으로 10년 안</span></h3>${repeatRows(m, m.repeats.next, () => true, true)}
    <p class="mono mute fine">같은 세운이 오면 같은 장면이 열리기 쉬워요. 다만 이번엔 미리 알고 맞는 거라, 03 · 06장의 "한 겹 아래"와 "기준 낮추기"를 먼저 꺼내 두면 돼요.</p>` : ''}
  </section>`;

  // 06 대처
  h += `<section class="sec">${sec('s-cope', '06', '버티는 방식', '일이 터지면 몸이 먼저 고르는 쪽')}
    ${distBars(m.cope.map((c, i) => ({ name: COPE[c.id].name, score: c.score, delta: c.delta, top: i < 2 })))}
    ${m.cope.slice(0, 2).map((c, i) => {
      const x = COPE[c.id], dp = COPE_DEEP[c.id];
      return `<article class="dcard-x">
        <header><span class="mono rk">${String(i + 1).padStart(2, '0')}</span><h3>${x.name}</h3><span class="mono en">${x.en}</span><span class="mono pct">상위 ${Math.max(1, 100 - c.score)}%</span></header>
        <p class="doc-line">${x.saju}</p>
        <div class="xg">
          <div><h4>남들 눈엔</h4><p>${x.looks}</p><h4 style="margin-top:12px">실제론</h4><p>${x.inside}</p></div>
          <div><h4>그해마다 한 일</h4><ul class="inner">${x.did.map((q) => `<li>${q}</li>`).join('')}</ul></div>
        </div>
        <h4>그래서 생기는 일</h4><div class="tags">${x.costs.map((w) => `<span class="tag on">${w}</span>`).join('')}</div>
        <h4>한 겹 더 들어가 보면</h4>
        <div class="info deep">
          <div class="row"><span>겉으로 대는 이유</span><span>"${dp.said}"</span></div>
          <div class="row"><span>속을 뜯어보면</span><span><b>${dp.real}</b></span></div>
          <div class="row"><span>억울할 수 있는데</span><span>${dp.fair}</span></div>
          <div class="row"><span>비유하면</span><span>${dp.like}</span></div>
          <div class="row"><span>확인하는 법</span><span>${dp.test}</span></div>
          <div class="row"><span>기준 낮추기</span><span>${dp.bar}</span></div>
        </div>
      </article>`;
    }).join('')}
  </section>`;

  // 07 대운 상세
  const grow = [...m.dist].sort((x, y) => y.delta - x.delta)[0];
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
        <div class="row"><span>사람 쪽</span><span>${TG_TEXT[tg].people}</span></div>
      </div>
    </div>`;
  };
  h += `<section class="sec">${sec('s-now', '07', '지금 10년, 다음 10년')}
    <div class="two-col">${dCard(m.daeunNow, '지금')}${dCard(m.daeunNext, '다음')}</div>
    ${grow.delta > 2 ? `<p class="lead-s" style="margin-top:18px">지금 대운에서 가장 커지는 버릇은 <b>${DIST[grow.id].alias}</b>${hasBatchim(DIST[grow.id].alias.replace(/"$/, '')) ? '이에요' : '예요'}. 원래 ${grow.score}점인데 요즘은 ${grow.now}점쯤으로 움직여요.</p>` : ''}
  </section>`;

  // 08 10년 표
  h += `<section class="sec">${sec('s-years', '08', '앞으로 10년', '해마다 운')}
    <div class="scroll-x"><table class="tbl ytable">
      <thead><tr><th>연도</th><th>나이</th><th>세운</th><th>십성</th><th>점수</th><th>조심할 달</th><th>좋은 달</th><th>그해 장면</th></tr></thead>
      <tbody>${m.years.map((y) => {
        const tag = `${y.repeat ? '<b>같은 장면 오는 해</b> · ' : ''}${y.ownerClash ? '일지 충 · ' : ''}`;
        return `<tr class="${y.score < 45 || y.repeat ? 'low' : y.score >= 62 ? 'high' : ''}">
          <td class="mono">${y.year}</td><td>${y.age}</td><td><b class="hz">${pillarHanja(y.pillar)}</b></td>
          <td>${TG_KO[y.tg]} <span class="mute">${TG_TEXT[y.tg].tag}</span></td>
          <td>${spark(y.score)}<span class="mono"> ${y.score}</span></td>
          <td class="mono">${y.watchMonth}월</td><td class="mono">${y.bestMonth}월</td>
          <td class="dogc">${tag}${TG_TEXT[y.tg].people} <span class="mute">· ${DIST[y.watchDist].alias}</span></td></tr>`;
      }).join('')}</tbody></table></div>
    <p class="mono mute fine">달은 절기로 쳐서 그달 4~8일쯤부터예요. 45점 아래와 같은 장면 오는 해는 옅은 빨강, 62점 넘으면 굵게. 맨 끝 회색 글씨는 그해 커지는 버릇.</p>
  </section>`;

  void a;
  h += shareBlock(m, true);
  return h;
}

function distCard(m: Model, id: keyof typeof DIST, rank: number, score: number, delta: number): string {
  const c = DIST[id];
  return `<article class="dcard-x">
    <header>
      <span class="mono rk">${String(rank).padStart(2, '0')}</span>
      <h3>${c.alias}</h3><span class="mono en">${c.name} · ${c.en}</span>
      <span class="mono pct">상위 ${Math.max(1, 100 - score)}%</span>
    </header>
    <p class="doc-line">${c.def}</p>
    <p class="lead-s">${c.saju}</p>
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
    <div class="note-box dogbox"><h3>이 버릇이 잠깐 꺼지는 순간</h3>${c.off.map((d) => `<p>${d}</p>`).join('')}</div>
    <div class="talk"><div class="hd">원래 하던 말</div><div class="hd">이렇게 바꿔 말하면</div>${c.reframe.map((r) => `<div>${r.from}</div><div>${r.to}</div>`).join('')}</div>
  </article>`;
}
