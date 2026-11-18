import { computeChart, datePillars, yearPillar, daeunAt, monthOfBranch, type BirthInput, type Chart, type Daeun } from '../saju/calc';
import { analyze, luckScore, type Analysis } from '../saju/analysis';
import {
  type El, type Pillar, type TenGod, STEM_EL, BRANCH_EL, EL_ORDER, tenGod, mainHidden, isChung, isHap, TG_GROUP,
} from '../saju/constants';
import { readAdoption, type AdoptionResult, type Route } from '../engine/adoption';
import { readDistortions, type DistResult } from '../engine/distortion';

import { fromParams } from '../content/breeds';

export interface Inputs {
  owner: string;
  birth: BirthInput;
  dog: string;
  /** 쓴 그대로의 견종·털색 */
  breed: string;
  color: string;
  adopt: { y: number; m: number; d: number | null };
  route: Route;
  sick: boolean;
  /** 날짜가 '우리 집 온 날'인지 '생일'인지 */
  dateKind: 'meet' | 'birth';
  dogBirthYear: number | null;
}

export interface YearRow {
  year: number; pillar: Pillar; tg: TenGod; tgB: TenGod; score: number;
  dogClash: boolean; dogHarmony: boolean; ownerClash: boolean;
  watchMonth: number; bestMonth: number; age: number; dogAge: number | null; together: number;
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
  adoption: AdoptionResult;
  dogPillar: Pillar;
  daeunAtAdopt: Daeun | null;
  timeline: { year: number; age: number; seun: number; daeun: number; v: number }[];
  daeunScores: number[];
  elBefore: Record<El, number>;
  elAfter: Record<El, number>;
  filled: El;
  dist: DistResult[];
  years: YearRow[];
  reportNo: string;
}

const pctEl = (cnt: Record<El, number>) => {
  const t = EL_ORDER.reduce((s, e) => s + cnt[e], 0) || 1;
  return Object.fromEntries(EL_ORDER.map((e) => [e, Math.round((cnt[e] / t) * 1000) / 10])) as Record<El, number>;
};

export function buildModel(inp: Inputs, today = new Date()): Model {
  const chart = computeChart(inp.birth);
  const a = analyze(chart);
  const nowYear = today.getFullYear();
  const daeunNow = daeunAt(chart, nowYear);
  const daeunNext = daeunNow ? chart.daeun.find((d) => d.idx === daeunNow.idx + 1) ?? null : chart.daeun[0] ?? null;
  const adoption = readAdoption(chart, a, { ...inp.adopt, route: inp.route, sick: inp.sick }, today);
  const dp = datePillars(inp.adopt.y, inp.adopt.m, inp.adopt.d ?? 15);
  const dogPillar = inp.adopt.d !== null ? dp.day : dp.month;
  const daeunAtAdopt = daeunAt(chart, inp.adopt.y);

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

  // 원국 글자 수 → 개의 기둥 두 글자를 더한 뒤
  const cnt = { ...a.elCount };
  const elBefore = pctEl(cnt);
  const after = { ...cnt };
  after[STEM_EL[dogPillar.s]] += 1;
  after[BRANCH_EL[dogPillar.b]] += 1;
  const elAfter = pctEl(after);
  // 채워준 오행: 원래 적은 것 중 개가 가져온 것, 없으면 가장 많이 늘어난 것
  const brought = [STEM_EL[dogPillar.s], BRANCH_EL[dogPillar.b]];
  const filled = [...brought].sort((x, y) => cnt[x] - cnt[y] || a.favor[y] - a.favor[x])[0];

  const dist = readDistortions(a, daeunNow?.pillar ?? null);

  const years: YearRow[] = [];
  for (let y = nowYear; y < nowYear + 10; y++) {
    const p = yearPillar(y);
    // 그해 열두 달의 월주를 점수로 매겨 가장 낮은 달과 높은 달
    const first = ((p.s % 5) * 2 + 2) % 10; // 寅월 천간
    let watch = 0, best = 0, lo = 999, hi = -1;
    for (let k = 0; k < 12; k++) {
      const mp = { s: (first + k) % 10, b: (2 + k) % 12 };
      // 세운 지지와 충하는 달은 깎고 합하는 달은 올린다 (월운이 세운을 건드리는 달)
      const v = luckScore(a, chart, mp) - (isChung(mp.b, p.b) ? 22 : 0) + (isHap(mp.b, p.b) ? 16 : 0) - (isChung(mp.b, dogPillar.b) ? 8 : 0);
      if (v < lo) { lo = v; watch = monthOfBranch(mp.b); }
      if (v > hi) { hi = v; best = monthOfBranch(mp.b); }
    }
    years.push({
      year: y, pillar: p, tg: tenGod(chart.day.s, p.s), tgB: tenGod(chart.day.s, mainHidden(p.b)),
      score: luckScore(a, chart, p),
      dogClash: isChung(p.b, dogPillar.b), dogHarmony: isHap(p.b, dogPillar.b),
      ownerClash: isChung(p.b, chart.day.b),
      watchMonth: watch, bestMonth: best, age: y - by,
      dogAge: inp.dogBirthYear ? y - inp.dogBirthYear : null,
      together: y - inp.adopt.y,
    });
  }

  const reportNo = String(((by * 7919 + inp.adopt.y * 104729 + chart.day.s * 31 + chart.day.b * 17 + inp.adopt.m * 13) % 9000) + 1000);
  return {
    inp, chart, a, today, nowYear, age: nowYear - by, daeunNow, daeunNext, adoption, dogPillar, daeunAtAdopt,
    timeline, daeunScores, elBefore, elAfter, filled, dist, years, reportNo,
  };
}

export const groupOf = (t: TenGod) => TG_GROUP[t];

// ---- URL 해시 직렬화
export function encodeInputs(i: Inputs): string {
  const b = i.birth;
  const q = new URLSearchParams({
    o: i.owner,
    b: `${b.y}${String(b.m).padStart(2, '0')}${String(b.d).padStart(2, '0')}`,
    t: b.hh === null ? '' : `${String(b.hh).padStart(2, '0')}${String(b.mm ?? 0).padStart(2, '0')}`,
    c: b.calendar === 'lunar' ? (b.leap ? 'L' : 'l') : 's',
    g: b.gender,
    n: i.dog,
    f: i.breed,
    fc: i.color,
    a: `${i.adopt.y}${String(i.adopt.m).padStart(2, '0')}${i.adopt.d ? String(i.adopt.d).padStart(2, '0') : ''}`,
    r: i.route,
    s: i.sick ? '1' : '',
    db: i.dogBirthYear && i.dateKind !== 'birth' ? String(i.dogBirthYear) : '',
    dt: i.dateKind === 'birth' ? 'b' : '',
  });
  return q.toString();
}

export function decodeInputs(s: string): Inputs | null {
  try {
    const q = new URLSearchParams(s.replace(/^#/, ''));
    const b = q.get('b') ?? '', a = q.get('a') ?? '', t = q.get('t') ?? '';
    if (!/^\d{8}$/.test(b) || !/^\d{6}(\d{2})?$/.test(a)) return null;
    const c = q.get('c') ?? 's';
    const f = q.get('f') ?? 'mix-cream';
    const bc = fromParams(f, q.get('fc'));
    return {
      owner: (q.get('o') ?? '').slice(0, 12),
      birth: {
        y: +b.slice(0, 4), m: +b.slice(4, 6), d: +b.slice(6, 8),
        hh: /^\d{4}$/.test(t) ? +t.slice(0, 2) : null, mm: /^\d{4}$/.test(t) ? +t.slice(2, 4) : null,
        calendar: c === 's' ? 'solar' : 'lunar', leap: c === 'L', gender: q.get('g') === 'm' ? 'm' : 'f',
      },
      dog: (q.get('n') ?? '').slice(0, 10) || '우리 개',
      breed: bc.breed,
      color: bc.color,
      adopt: { y: +a.slice(0, 4), m: +a.slice(4, 6), d: a.length === 8 ? +a.slice(6, 8) : null },
      route: (q.get('r') ?? '') as Route,
      sick: q.get('s') === '1',
      dateKind: q.get('dt') === 'b' ? 'birth' : 'meet',
      dogBirthYear: q.get('dt') === 'b' ? +a.slice(0, 4) : q.get('db') ? +q.get('db')! : null,
    };
  } catch { return null; }
}
