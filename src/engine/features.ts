import type { Analysis } from '../saju/analysis';
import type { Pillar, TenGod, TgGroup, El } from '../saju/constants';
import { STEM_EL, BRANCH_EL, TG_GROUP, tenGod, mainHidden } from '../saju/constants';
import norms from './norms.json';

/** 점수 공식이 보는 사주 비중. T 십성 · G 십성 묶음 · E 오행 (각각 합 100), S 신강도, R 원국 안 관계 개수 */
export interface F {
  T: Record<TenGod, number>; G: Record<TgGroup, number>; E: Record<El, number>; S: number; yang: boolean;
  R: { chung: number; hyeong: number; wonjin: number; hap: number };
}

export function features(a: Analysis, extra: Pillar[] = [], extraW = 0): F {
  const T = { ...a.tgWeight }, E = { ...a.elWeight };
  if (extra.length) {
    // 운 기둥을 가중치로 섞은 뒤 다시 100으로 맞춘다
    for (const p of extra) {
      T[tenGod(a.dayStem, p.s)] += extraW;
      T[tenGod(a.dayStem, mainHidden(p.b))] += extraW * 1.3;
      E[STEM_EL[p.s]] += extraW;
      E[BRANCH_EL[p.b]] += extraW * 1.3;
    }
    const tt = Object.values(T).reduce((x, y) => x + y, 0), te = Object.values(E).reduce((x, y) => x + y, 0);
    for (const k in T) T[k as TenGod] = (T[k as TenGod] / tt) * 100;
    for (const k in E) E[k as El] = (E[k as El] / te) * 100;
  }
  const G: Record<TgGroup, number> = { self: 0, output: 0, wealth: 0, power: 0, resource: 0 };
  for (const k in T) G[TG_GROUP[k as TenGod]] += T[k as TenGod];
  const cnt = (k: string) => a.relations.filter((r) => r === k).length;
  return { T, G, E, S: a.strength, yang: a.dayStem % 2 === 0, R: { chung: cnt('충'), hyeong: cnt('형'), wonjin: cnt('원진'), hap: cnt('합') } };
}

/** 모집단(무작위 2만 명) 분위로 1~99 */
export function pct(id: string, v: number): number {
  const q: number[] | undefined = (norms as Record<string, number[]>)[id];
  if (!q) return 50;
  let lo = 0, hi = q.length - 1;
  if (v <= q[0]) return 1;
  if (v >= q[hi]) return 99;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (q[mid] <= v) lo = mid; else hi = mid; }
  const t = (v - q[lo]) / (q[hi] - q[lo] || 1);
  return Math.max(1, Math.min(99, Math.round(((lo + t) / (q.length - 1)) * 100)));
}

export interface Ranked<Id extends string> { id: Id; score: number; now: number; delta: number }

/** 원점수 공식 묶음 → 원국 분위 + 지금 대운 반영 분위, 높은 순 */
export function rank<Id extends string>(order: Id[], raw: Record<Id, (f: F) => number>, a: Analysis, daeun: Pillar | null): Ranked<Id>[] {
  const f0 = features(a), f1 = daeun ? features(a, [daeun], 9) : f0;
  return order.map((id) => {
    const score = pct(id, raw[id](f0));
    const now = pct(id, raw[id](f1));
    return { id, score, now, delta: now - score };
  }).sort((x, y) => y.score - x.score || order.indexOf(x.id) - order.indexOf(y.id));
}
