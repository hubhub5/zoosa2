import { computeChart, yearPillar, daeunAt, monthOfBranch, type BirthInput, type Chart, type Daeun } from '../saju/calc';
import { analyze, luckScore, type Analysis } from '../saju/analysis';
import { type Pillar, type TenGod, tenGod, mainHidden, isChung, isHap, TG_GROUP } from '../saju/constants';
import { readDistortions, type DistResult, type DistId } from '../engine/distortion';
import { readCoping, type CopeResult } from '../engine/coping';
import { readConflict, type ConflictResult } from '../engine/conflict';
import { readRepeats, type Repeats, type Slot } from '../engine/repeat';

/** 요즘 제일 걸리는 쪽 (안 골라도 됨) */
export type Focus = '' | 'work' | 'love' | 'family' | 'money' | 'self';
export const FOCUS_KO: Record<Focus, string> = { '': '-', work: '일', love: '연애', family: '가족', money: '돈', self: '나 자신' };
export const FOCUS_SLOT: Record<Exclude<Focus, ''>, Slot> = { work: 'boss', love: 'partner', family: 'family', money: 'money', self: 'mouth' };
const FOCUSES: Focus[] = ['work', 'love', 'family', 'money', 'self'];

export interface Inputs {
  owner: string;
  birth: BirthInput;
  focus: Focus;
}

export interface YearRow {
  year: number; pillar: Pillar; tg: TenGod; tgB: TenGod; score: number;
  /** 세운 지지가 일지를 충 */
  ownerClash: boolean;
  /** 반복된 해 엔진이 고른 다음 해 */
  repeat: boolean;
  /** 그해 가장 많이 커지는 생각 버릇 */
  watchDist: DistId;
  watchMonth: number; bestMonth: number; age: number;
}

export interface Model {
  inp: Inputs;
  chart: Chart;
  a: Analysis;
  today: Date;
  nowYear: number;
  age: number;
  daeunNow: Daeun | null;
  daeunNext: Daeun | null;
  timeline: { year: number; age: number; seun: number; daeun: number; v: number }[];
  daeunScores: number[];
  dist: DistResult[];
  cope: CopeResult[];
  conflict: ConflictResult[];
  repeats: Repeats;
  years: YearRow[];
  reportNo: string;
}

export function buildModel(inp: Inputs, today = new Date()): Model {
  const chart = computeChart(inp.birth);
  const a = analyze(chart);
  const nowYear = today.getFullYear();
  const daeunNow = daeunAt(chart, nowYear);
  const daeunNext = daeunNow ? chart.daeun.find((d) => d.idx === daeunNow.idx + 1) ?? null : chart.daeun[0] ?? null;

  const by = chart.solar.y;
  const daeunScores = chart.daeun.map((d) => luckScore(a, chart, d.pillar, 0.4));
  const timeline = [];
  for (let y = by; y <= by + 90; y++) {
    const du = daeunAt(chart, y);
    const ds = du ? daeunScores[du.idx - 1] : 50;
    const ss = luckScore(a, chart, yearPillar(y));
    timeline.push({ year: y, age: y - by, seun: ss, daeun: ds, v: Math.round(ds * 0.62 + ss * 0.38) });
  }
  // 해마다 튀는 세운을 앞뒤 해와 섞어 선을 고르게 (툴팁에는 원래 세운 점수)
  const raw = timeline.map((t) => t.v);
  timeline.forEach((t, i) => { t.v = Math.round(((raw[i - 1] ?? raw[i]) + raw[i] * 2 + (raw[i + 1] ?? raw[i])) / 4); });

  const dp = daeunNow?.pillar ?? null;
  const dist = readDistortions(a, dp);
  const cope = readCoping(a, dp);
  const conflict = readConflict(a, dp);
  const repeats = readRepeats(chart, a, dist.map((d) => d.id), nowYear, inp.birth.gender === 'f');

  const years: YearRow[] = [];
  for (let y = nowYear; y < nowYear + 10; y++) {
    const p = yearPillar(y);
    // 그해 열두 달의 월주를 점수로 매겨 가장 낮은 달과 높은 달
    const first = ((p.s % 5) * 2 + 2) % 10; // 寅월 천간
    let watch = 0, best = 0, lo = 999, hi = -1;
    for (let k = 0; k < 12; k++) {
      const mp = { s: (first + k) % 10, b: (2 + k) % 12 };
      // 세운 지지와 충하는 달은 깎고 합하는 달은 올린다 (월운이 세운을 건드리는 달)
      const v = luckScore(a, chart, mp) - (isChung(mp.b, p.b) ? 22 : 0) + (isHap(mp.b, p.b) ? 16 : 0) - (isChung(mp.b, chart.day.b) ? 8 : 0);
      if (v < lo) { lo = v; watch = monthOfBranch(mp.b); }
      if (v > hi) { hi = v; best = monthOfBranch(mp.b); }
    }
    const yd = readDistortions(a, p);
    // 원래 높은 버릇(상위 5) 중에서 그해 가장 커지는 것
    const top5 = new Set(dist.slice(0, 5).map((d) => d.id));
    const watchDist = yd.filter((d) => top5.has(d.id)).sort((x, z) => z.delta - x.delta || z.now - x.now)[0].id;
    years.push({
      year: y, pillar: p, tg: tenGod(chart.day.s, p.s), tgB: tenGod(chart.day.s, mainHidden(p.b)),
      score: luckScore(a, chart, p),
      ownerClash: isChung(p.b, chart.day.b),
      repeat: repeats.next.some((r) => r.year === y),
      watchDist, watchMonth: watch, bestMonth: best, age: y - by,
    });
  }

  const b = inp.birth;
  const reportNo = String(((by * 7919 + b.m * 104729 + b.d * 1301 + chart.day.s * 31 + chart.day.b * 17 + (b.hh ?? 25) * 13) % 9000) + 1000);
  return { inp, chart, a, today, nowYear, age: nowYear - by, daeunNow, daeunNext, timeline, daeunScores, dist, cope, conflict, repeats, years, reportNo };
}

export const groupOf = (t: TenGod) => TG_GROUP[t];

/** sample.html 과 첫 화면 예시에 쓰는 고정 입력 (1993.08.21 09:20 여) */
export const SAMPLE_HASH = 'o=%EA%B9%80%EC%98%88%EB%B9%88&b=19930821&t=0920&c=s&g=f&f=work';

// ---- URL 해시 직렬화
export function encodeInputs(i: Inputs): string {
  const b = i.birth;
  const q = new URLSearchParams({
    o: i.owner,
    b: `${b.y}${String(b.m).padStart(2, '0')}${String(b.d).padStart(2, '0')}`,
    t: b.hh === null ? '' : `${String(b.hh).padStart(2, '0')}${String(b.mm ?? 0).padStart(2, '0')}`,
    c: b.calendar === 'lunar' ? (b.leap ? 'L' : 'l') : 's',
    g: b.gender,
    f: i.focus,
  });
  return q.toString();
}

export function decodeInputs(s: string): Inputs | null {
  try {
    const q = new URLSearchParams(s.replace(/^#/, ''));
    const b = q.get('b') ?? '', t = q.get('t') ?? '';
    if (!/^\d{8}$/.test(b)) return null;
    const c = q.get('c') ?? 's';
    const f = (q.get('f') ?? '') as Focus;
    return {
      owner: (q.get('o') ?? '').slice(0, 12),
      birth: {
        y: +b.slice(0, 4), m: +b.slice(4, 6), d: +b.slice(6, 8),
        hh: /^\d{4}$/.test(t) ? +t.slice(0, 2) : null, mm: /^\d{4}$/.test(t) ? +t.slice(2, 4) : null,
        calendar: c === 's' ? 'solar' : 'lunar', leap: c === 'L', gender: q.get('g') === 'm' ? 'm' : 'f',
      },
      focus: FOCUSES.includes(f) ? f : '',
    };
  } catch { return null; }
}
