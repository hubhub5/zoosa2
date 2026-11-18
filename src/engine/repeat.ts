// 반복된 해: 1위 생각 버릇이 세운에서 튀고, 세운 지지가 원국(특히 일지)을 건드린 해.
// 과거 연도는 무료 화면에서 그대로 보여 주고(맞히는 느낌), 앞으로 올 해는 잠금 미끼로 쓴다.
import type { Chart } from '../saju/calc';
import { yearPillar, daeunAt, monthOfBranch } from '../saju/calc';
import { type Analysis, luckScore, relationsWith } from '../saju/analysis';
import { type Pillar, type TgGroup, TG_GROUP, tenGod, mainHidden, isChung, isHap } from '../saju/constants';
import { type DistId, rawScores } from './distortion';

/** 그해 일이 엮인 상대 */
export type Slot = 'boss' | 'partner' | 'family' | 'friend' | 'mouth' | 'money';
export type RelKind = '충' | '형' | '원진' | '합';
export type RelWith = 'year' | 'month' | 'day' | 'hour';

export interface RepeatYear {
  year: number;
  age: number;
  pillar: Pillar;
  /** 세운 지지가 원국 지지와 맺은 관계 중 가장 센 것 */
  rel: { kind: RelKind; with: RelWith; branch: number } | null;
  group: TgGroup;
  slot: Slot;
  /** 그해 가장 크게 튄 버릇 (상위 3개 중, 같은 문장이 겹치지 않게) */
  dist: DistId;
  /** 그해 가장 무거웠던 달(절기 기준) */
  month: number;
  score: number;
}

const REL_W: Record<RelKind, Record<RelWith, number>> = {
  충: { day: 16, month: 10, year: 5, hour: 5 },
  형: { day: 9, month: 6, year: 3, hour: 3 },
  원진: { day: 8, month: 5, year: 2, hour: 2 },
  합: { day: 3, month: 1, year: 0, hour: 0 },
};

/** 그해 상대: 지지가 일지를 건드리면 지지 쪽 십성(배우자궁이 흔들림), 아니면 천간 쪽 */
function slotOf(chart: Chart, p: Pillar, rel: RepeatYear['rel'], female: boolean): { group: TgGroup; slot: Slot } {
  const ds = chart.day.s;
  const g = TG_GROUP[rel ? tenGod(ds, mainHidden(p.b)) : tenGod(ds, p.s)];
  const onDay = rel?.with === 'day';
  // 여자 사주의 관성, 남자 사주의 재성은 연인·배우자 자리. 일지가 같이 흔들리면 그쪽으로 읽는다
  if (g === 'power') return { group: g, slot: female && onDay ? 'partner' : 'boss' };
  if (g === 'wealth') return { group: g, slot: !female && onDay ? 'partner' : 'money' };
  if (g === 'resource') return { group: g, slot: 'family' };
  if (g === 'self') return { group: g, slot: onDay ? 'partner' : 'friend' };
  return { group: g, slot: 'mouth' };
}

function strongestRel(chart: Chart, p: Pillar): RepeatYear['rel'] {
  let best: RepeatYear['rel'] = null, bw = 0;
  for (const r of relationsWith(chart, p)) {
    const w = REL_W[r.kind as RelKind]?.[r.with] ?? 0;
    if (w > bw) { bw = w; best = { kind: r.kind as RelKind, with: r.with, branch: chart[r.with]!.b }; }
  }
  return best;
}

/** 그해 열두 달 중 운 점수가 가장 낮은 달 (세운과 충하는 달은 더 무겁게) */
function heavyMonth(a: Analysis, chart: Chart, p: Pillar): number {
  const first = ((p.s % 5) * 2 + 2) % 10; // 寅월 천간
  let lo = 999, mon = 0;
  for (let k = 0; k < 12; k++) {
    const mp = { s: (first + k) % 10, b: (2 + k) % 12 };
    const v = luckScore(a, chart, mp) - (isChung(mp.b, p.b) ? 22 : 0) + (isHap(mp.b, p.b) ? 16 : 0) - (isChung(mp.b, chart.day.b) ? 12 : 0);
    if (v < lo) { lo = v; mon = monthOfBranch(mp.b); }
  }
  return mon;
}

function yearScore(a: Analysis, chart: Chart, top: DistId, base: number, y: number) {
  const p = yearPillar(y);
  const du = daeunAt(chart, y);
  const spike = rawScores(a, du ? [du.pillar, p] : [p], 7)[top] - base;
  const rel = strongestRel(chart, p);
  const relW = rel ? REL_W[rel.kind][rel.with] : 0;
  const score = spike * 1.6 + relW + (55 - luckScore(a, chart, p)) * 0.25;
  return { p, rel, score };
}

function pick(cands: { y: number; score: number }[], n: number, gap: number) {
  const out: typeof cands = [];
  for (const c of [...cands].sort((x, y) => y.score - x.score || y.y - x.y)) {
    if (out.length >= n) break;
    if (out.every((o) => Math.abs(o.y - c.y) >= gap)) out.push(c);
  }
  return out.sort((x, y) => x.y - y.y);
}

export interface Repeats { past: RepeatYear[]; next: RepeatYear[] }

export function readRepeats(chart: Chart, a: Analysis, tops: DistId[], nowYear: number, female: boolean): Repeats {
  const by = chart.solar.y;
  const top = tops[0];
  const all = rawScores(a);
  const base = all[top];
  const make = (y: number): RepeatYear => {
    const { p, rel, score } = yearScore(a, chart, top, base, y);
    const age = y - by;
    const so = slotOf(chart, p, rel, female);
    // 열여덟 전에는 연인·돈 자리가 아직 약하다: 친구·집 쪽으로 읽는다
    if (age < 19 && so.slot === 'partner') so.slot = 'friend';
    if (age < 19 && so.slot === 'money') so.slot = 'family';
    return { year: y, age, pillar: p, rel, ...so, dist: top, month: heavyMonth(a, chart, p), score: Math.round(score * 10) / 10 };
  };
  // 기억나는 나이(만 14세)부터 작년까지. 너무 어리면 10살부터
  const from = Math.min(by + 14, Math.max(by + 10, nowYear - 6));
  const pastC = [];
  for (let y = from; y < nowYear; y++) pastC.push({ y, score: make(y).score });
  const past = pick(pastC, nowYear - from >= 24 ? 5 : nowYear - from >= 12 ? 4 : 3, 3).map((c) => make(c.y));
  // 해마다 상위 3개 버릇 중 그해 세운에서 가장 크게 튄 것. 버릇 × 상대 조합은 겹치지 않게
  const used = new Set<string>();
  const assign = (r: RepeatYear) => {
    const du = daeunAt(chart, r.year);
    const sp = rawScores(a, du ? [du.pillar, r.pillar] : [r.pillar], 7);
    const by = (xs: DistId[]) => [...xs].sort((x, z) => (sp[z] - all[z]) - (sp[x] - all[x]));
    // 상위 3개 먼저, 다 쓰였으면 그다음 순위부터
    const order = [...by(tops.slice(0, 3)), ...tops.slice(3)];
    r.dist = order.find((d) => !used.has(`${d}.${r.slot}`)) ?? order[0];
    used.add(`${r.dist}.${r.slot}`);
  };
  past.forEach(assign);
  const nextC = [];
  for (let y = nowYear; y < nowYear + 10; y++) nextC.push({ y, score: make(y).score });
  const next = pick(nextC, 2, 3).map((c) => make(c.y));
  next.forEach(assign);
  return { past, next };
}
