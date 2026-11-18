import {
  type El, type TenGod, type TgGroup, type Pillar,
  STEM_EL, BRANCH_EL, EL_ORDER, TG_ORDER, TG_GROUP, mainHidden, HIDDEN, tenGod, groupOfEl,
  isChung, isHap, isHyeong, isWonjin, isStemHap, isStemChung, generates, controls,
} from './constants';
import type { Chart } from './calc';

export interface Analysis {
  dayStem: number;
  pillars: { key: 'hour' | 'day' | 'month' | 'year'; p: Pillar | null }[];
  elCount: Record<El, number>;      // 8(또는 6)글자 표면 개수
  elWeight: Record<El, number>;     // 지장간·월령 가중치 반영, 합 100
  tgCount: Record<TenGod, number>;  // 표면 + 지지 본기 (일간 제외)
  tgWeight: Record<TenGod, number>; // 가중치
  groupWeight: Record<TgGroup, number>;
  strength: number;                 // 0~100, 50 이상 신강
  strong: boolean;
  /** 원하는 오행(용신에 가까운 대략값) 점수 -1~1 */
  favor: Record<El, number>;
  missing: El[];
  excess: El[];
  relations: string[];              // 원국 안의 충·합 표시
}

const zeroEl = (): Record<El, number> => ({ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 });
const zeroTg = (): Record<TenGod, number> => Object.fromEntries(TG_ORDER.map((t) => [t, 0])) as Record<TenGod, number>;

// 위치 가중치: 월지가 가장 크다
const W_STEM = { year: 0.8, month: 1.1, day: 0, hour: 0.9 };
const W_BRANCH = { year: 1.0, month: 3.0, day: 1.6, hour: 1.0 };
const HIDDEN_SPLIT = (n: number) => (n === 2 ? [0.3, 0.7] : [0.15, 0.25, 0.6]);

export function analyze(c: Chart): Analysis {
  const ds = c.day.s;
  const pillars = [
    { key: 'hour' as const, p: c.hour },
    { key: 'day' as const, p: c.day },
    { key: 'month' as const, p: c.month },
    { key: 'year' as const, p: c.year },
  ];
  const elCount = zeroEl(), elWeight = zeroEl(), tgCount = zeroTg(), tgWeight = zeroTg();
  for (const { key, p } of pillars) {
    if (!p) continue;
    elCount[STEM_EL[p.s]]++;
    elCount[BRANCH_EL[p.b]]++;
    if (key !== 'day') {
      const t = tenGod(ds, p.s);
      tgCount[t]++;
      tgWeight[t] += W_STEM[key];
      elWeight[STEM_EL[p.s]] += W_STEM[key];
    } else {
      elWeight[STEM_EL[p.s]] += 1.0;
    }
    tgCount[tenGod(ds, mainHidden(p.b))]++;
    const hs = HIDDEN[p.b], sp = HIDDEN_SPLIT(hs.length);
    hs.forEach((h, i) => {
      const w = W_BRANCH[key] * sp[i];
      tgWeight[tenGod(ds, h)] += w;
      elWeight[STEM_EL[h]] += w;
    });
  }
  const totEl = EL_ORDER.reduce((a, e) => a + elWeight[e], 0);
  for (const e of EL_ORDER) elWeight[e] = (elWeight[e] / totEl) * 100;
  const totTg = TG_ORDER.reduce((a, t) => a + tgWeight[t], 0);
  for (const t of TG_ORDER) tgWeight[t] = (tgWeight[t] / totTg) * 100;
  const groupWeight: Record<TgGroup, number> = { self: 0, output: 0, wealth: 0, power: 0, resource: 0 };
  for (const t of TG_ORDER) groupWeight[TG_GROUP[t]] += tgWeight[t];

  // 신강도: 일간 오행 + 인성 오행 가중치 비율 (일간 자신 포함)
  const dEl = STEM_EL[ds];
  const resEl = EL_ORDER.find((e) => generates(e, dEl))!;
  const help = elWeight[dEl] + elWeight[resEl];
  const strength = Math.max(0, Math.min(100, ((help - 18) / 50) * 100));
  const strong = strength >= 50;

  // 용신 대략: 신강이면 식상·재·관, 신약이면 인성·비겁. 과다 오행은 감점, 결핍 오행은 가점
  const favor = zeroEl();
  for (const e of EL_ORDER) {
    const g = groupOfEl(ds, e);
    const helps = g === 'self' || g === 'resource';
    let f = strong ? (helps ? -0.6 : 0.5) : (helps ? 0.6 : -0.3);
    if (!strong && g === 'output') f = -0.1;
    if (elWeight[e] < 8) f += 0.35;
    if (elWeight[e] > 35) f -= 0.4;
    favor[e] = Math.max(-1, Math.min(1, f));
  }
  const missing = EL_ORDER.filter((e) => elCount[e] === 0);
  const excess = EL_ORDER.filter((e) => elWeight[e] >= 32);

  const relations: string[] = [];
  const ps = pillars.filter((x) => x.p) as { key: string; p: Pillar }[];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i].p, b = ps[j].p;
    if (isChung(a.b, b.b)) relations.push('충');
    if (isHap(a.b, b.b)) relations.push('합');
    if (isHyeong(a.b, b.b)) relations.push('형');
    if (isWonjin(a.b, b.b)) relations.push('원진');
    if (isStemHap(a.s, b.s)) relations.push('간합');
    if (isStemChung(a.s, b.s)) relations.push('간충');
  }

  return { dayStem: ds, pillars, elCount, elWeight, tgCount, tgWeight, groupWeight, strength, strong, favor, missing, excess, relations };
}

/** 운(대운/세운) 한 기둥이 원국에 주는 점수. 0~100 */
export function luckScore(a: Analysis, c: Chart, p: Pillar, weightStem = 0.45): number {
  const fs = a.favor[STEM_EL[p.s]];
  const fb = a.favor[BRANCH_EL[p.b]];
  let v = fs * weightStem + fb * (1 - weightStem);
  const db = c.day.b, mb = c.month.b;
  if (isChung(p.b, db)) v -= 0.28;
  if (isChung(p.b, mb)) v -= 0.16;
  if (isHap(p.b, db)) v += 0.14;
  if (isHyeong(p.b, db)) v -= 0.1;
  if (isWonjin(p.b, db)) v -= 0.06;
  if (isStemHap(p.s, c.day.s)) v += 0.08;
  if (isStemChung(p.s, c.day.s)) v -= 0.12;
  return Math.round(Math.max(4, Math.min(96, 50 + v * 42)));
}

/** 운 기둥이 원국 지지들과 맺는 관계 목록 */
export function relationsWith(c: Chart, p: Pillar): { kind: string; with: 'year' | 'month' | 'day' | 'hour' }[] {
  const out: { kind: string; with: 'year' | 'month' | 'day' | 'hour' }[] = [];
  const keys = ['year', 'month', 'day', 'hour'] as const;
  for (const k of keys) {
    const q = c[k];
    if (!q) continue;
    if (isChung(p.b, q.b)) out.push({ kind: '충', with: k });
    if (isHap(p.b, q.b)) out.push({ kind: '합', with: k });
    if (isHyeong(p.b, q.b)) out.push({ kind: '형', with: k });
    if (isWonjin(p.b, q.b)) out.push({ kind: '원진', with: k });
  }
  return out;
}

/** 오행 a가 b를 돕는지/누르는지 */
export const elRel = (a: El, b: El) => (a === b ? 'same' : generates(a, b) ? 'gen' : controls(a, b) ? 'ctl' : generates(b, a) ? 'genby' : 'ctlby');
