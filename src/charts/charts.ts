import { type El, EL_ORDER, EL_KO, EL_HANJA, pillarHanja, type Pillar } from '../saju/constants';
import type { Daeun } from '../saju/calc';

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const elVar = (e: El) => `var(--el-${e})`;

/** 오행 가로 막대: 값은 %, 개수 옆에 직접 표기 */
export function elementBars(pct: Record<El, number>, cnt: Record<El, number> | null, total: number): string {
  const max = Math.max(...EL_ORDER.map((e) => pct[e]), 1);
  return `<div class="hbars" role="table" aria-label="오행 분포">${EL_ORDER.map((e) => `
    <div class="hbar" role="row" data-tip="${EL_KO[e]}(${EL_HANJA[e]}) ${pct[e].toFixed(1)}%${cnt ? ` · ${cnt[e]}/${total}글자` : ''}">
      <span class="hb-l" role="rowheader"><b style="color:${elVar(e)}">${EL_HANJA[e]}</b>${EL_KO[e]}</span>
      <span class="hb-t"><i style="width:${(pct[e] / max) * 100}%;background:${elVar(e)}"></i></span>
      <span class="hb-v mono" role="cell">${cnt ? `${cnt[e]}` : ''}<em>${Math.round(pct[e])}%</em></span>
    </div>`).join('')}</div>`;
}

/** 전후 비교 막대 (같은 행에 두 줄) */
export function pairedBars(before: Record<El, number>, after: Record<El, number>, highlight: El): string {
  const max = Math.max(...EL_ORDER.flatMap((e) => [before[e], after[e]]), 1);
  return `<div class="pbars">${EL_ORDER.map((e) => {
    const d = Math.round((after[e] - before[e]) * 10) / 10;
    return `<div class="pbar${e === highlight ? ' hi' : ''}" data-tip="${EL_KO[e]} ${before[e]}% → ${after[e]}%">
      <span class="hb-l"><b style="color:${elVar(e)}">${EL_HANJA[e]}</b>${EL_KO[e]}</span>
      <span class="pb-t">
        <i class="b" style="width:${(before[e] / max) * 100}%"></i>
        <i class="a" style="width:${(after[e] / max) * 100}%;background:${elVar(e)}"></i>
      </span>
      <span class="hb-v mono">${d > 0 ? '+' : ''}${d === 0 ? '·' : d.toFixed(1)}</span>
    </div>`;
  }).join('')}</div>`;
}

export interface TimelinePoint { year: number; age: number; v: number; daeun: number; seun: number }

/** 대운 흐름 선 그래프 */
export function timelineChart(pts: TimelinePoint[], daeun: Daeun[], scores: number[], nowYear: number, adoptYear: number, adoptLabel: string): string {
  const W = 720, H = 260, L = 30, R = 12, T = 28, B = 58;
  const iw = W - L - R, ih = H - T - B;
  const y0 = pts[0].year, y1 = pts[pts.length - 1].year;
  const x = (y: number) => L + ((y - y0) / (y1 - y0)) * iw;
  const y = (v: number) => T + ih - (v / 100) * ih;
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.year).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const area = `${line}L${x(y1)},${T + ih}L${x(y0)},${T + ih}Z`;
  const bands = daeun.filter((d) => d.startYear <= y1).map((d, i) => {
    const xa = x(Math.max(y0, d.startYear)), xb = x(Math.min(y1, d.endYear + 1));
    const sc = scores[i];
    return `<g class="band${d.startYear <= nowYear && nowYear <= d.endYear ? ' now' : ''}">
      <rect x="${xa}" y="${T}" width="${Math.max(0, xb - xa - 1)}" height="${ih}" class="bd${i % 2}"/>
      <line x1="${xa}" x2="${xb - 1}" y1="${y(sc)}" y2="${y(sc)}" class="dstep"/>
      <text x="${(xa + xb) / 2}" y="${T + ih + 18}" class="gz">${pillarHanja(d.pillar)}</text>
      <text x="${(xa + xb) / 2}" y="${T + ih + 32}" class="ag">${d.startAge}</text>
    </g>`;
  }).join('');
  const grid = [25, 50, 75].map((g) => `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" class="grid"/><text x="${L - 6}" y="${y(g) + 3}" class="tick">${g}</text>`).join('');
  const nowX = x(Math.min(y1, nowYear)), adX = x(adoptYear);
  const adP = pts.find((p) => p.year === adoptYear);
  const nowP = pts.find((p) => p.year === nowYear);
  return `<div class="scroll-x tl-wrap"><figure class="chart tl" data-y0="${y0}" data-y1="${y1}">
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="나이별 운 흐름. 입양 ${adoptYear}년, 현재 ${nowYear}년">
    ${bands}${grid}
    <path d="${area}" class="area"/>
    <path d="${line}" class="ln"/>
    <line x1="${nowX}" x2="${nowX}" y1="${T - 6}" y2="${T + ih}" class="nowl"/>
    <text x="${nowX}" y="${T - 10}" class="nowt">NOW ${nowYear}</text>
    ${adP ? `<line x1="${adX}" x2="${adX}" y1="${T + 10}" y2="${T + ih}" class="adl"/>
    <rect x="${adX - 5}" y="${y(adP.v) - 5}" width="10" height="10" class="adm"/>
    <text x="${adX + (adX > W - 150 ? -8 : 8)}" y="${T + 20}" class="adt" text-anchor="${adX > W - 150 ? 'end' : 'start'}">${esc(adoptLabel)}</text>` : ''}
    ${nowP ? `<circle cx="${nowX}" cy="${y(nowP.v)}" r="4.5" class="nowm"/>` : ''}
    <text x="${L}" y="${T + ih + 48}" class="axl">대운 간지 · 시작 나이</text>
    <g class="hover"><line class="hx" y1="${T}" y2="${T + ih}"/><circle class="hc" r="4"/></g>
    <rect x="${L}" y="${T}" width="${iw}" height="${ih}" class="hit"/>
  </svg>
  <script type="application/json">${JSON.stringify(pts.map((p) => [p.year, p.age, p.v, p.daeun, p.seun]))}</script>
</figure></div>`;
}

/** 왜곡 10 막대 (세로 목록) */
export function distBars(rows: { name: string; score: number; delta: number; top: boolean }[]): string {
  return `<div class="dbars">${rows.map((r, i) => `
    <div class="dbar${r.top ? ' top' : ''}" data-tip="${esc(r.name)} · 상위 ${100 - r.score}% · 이번 대운 ${r.delta > 0 ? '+' : ''}${r.delta}">
      <span class="mono rk">${String(i + 1).padStart(2, '0')}</span>
      <span class="nm">${esc(r.name)}</span>
      <span class="hb-t"><i style="width:${r.score}%"></i><s style="left:${Math.min(99, Math.max(0, r.score + r.delta))}%"></s></span>
      <span class="mono sc">${r.score}</span>
      <span class="mono dl ${r.delta > 2 ? 'up' : r.delta < -2 ? 'dn' : ''}">${r.delta > 2 ? '▲' : r.delta < -2 ? '▼' : '–'}${Math.abs(r.delta) > 2 ? Math.abs(r.delta) : ''}</span>
    </div>`).join('')}</div>`;
}

/** 0~100 게이지 */
export function gauge(v: number, left: string, right: string): string {
  return `<div class="gauge"><span>${left}</span><span class="g-t"><i style="left:${v}%"></i><s></s></span><span>${right}</span></div>`;
}

/** 작은 막대 묶음 (10년 표용 스파크) */
export const spark = (v: number) => `<span class="spark" title="${v}"><i style="height:${Math.max(6, v)}%"></i></span>`;

export const pillarCell = (p: Pillar) => pillarHanja(p);

/** 호버 툴팁 + 타임라인 크로스헤어 */
export function wireCharts(root: HTMLElement) {
  let tip = document.querySelector<HTMLDivElement>('.tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'tip mono'; document.body.appendChild(tip); }
  const show = (txt: string, ev: PointerEvent) => {
    tip!.textContent = txt; tip!.style.opacity = '1';
    const r = tip!.getBoundingClientRect();
    let left = ev.clientX + 12; if (left + r.width > innerWidth - 8) left = ev.clientX - r.width - 12;
    tip!.style.transform = `translate(${Math.max(8, left)}px, ${ev.clientY - r.height - 10}px)`;
  };
  const hide = () => { tip!.style.opacity = '0'; };
  root.querySelectorAll<HTMLElement>('[data-tip]').forEach((el) => {
    el.addEventListener('pointermove', (e) => show(el.dataset.tip!, e));
    el.addEventListener('pointerleave', hide);
  });
  root.querySelectorAll<HTMLElement>('figure.tl').forEach((fig) => {
    const data: number[][] = JSON.parse(fig.querySelector('script')!.textContent!);
    const svg = fig.querySelector('svg')!, hit = svg.querySelector<SVGRectElement>('.hit')!;
    const hx = svg.querySelector<SVGLineElement>('.hx')!, hc = svg.querySelector<SVGCircleElement>('.hc')!, g = svg.querySelector<SVGGElement>('.hover')!;
    const L = +hit.getAttribute('x')!, iw = +hit.getAttribute('width')!, T = +hit.getAttribute('y')!, ih = +hit.getAttribute('height')!;
    hit.addEventListener('pointermove', (e) => {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      const i = Math.max(0, Math.min(data.length - 1, Math.round(((p.x - L) / iw) * (data.length - 1))));
      const [yr, age, v, d, s] = data[i];
      const xx = L + (i / (data.length - 1)) * iw, yy = T + ih - (v / 100) * ih;
      hx.setAttribute('x1', String(xx)); hx.setAttribute('x2', String(xx)); hc.setAttribute('cx', String(xx)); hc.setAttribute('cy', String(yy));
      g.style.opacity = '1';
      show(`${yr} · ${age}세 · 종합 ${v} (대운 ${d} / 세운 ${s})`, e);
    });
    hit.addEventListener('pointerleave', () => { g.style.opacity = '0'; hide(); });
  });
}
