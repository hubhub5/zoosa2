import type { Analysis } from '../saju/analysis';
import type { Pillar, TenGod, TgGroup, El } from '../saju/constants';
import { STEM_EL, BRANCH_EL, EL_ORDER, TG_GROUP, tenGod, mainHidden } from '../saju/constants';
import norms from './norms.json';

export type DistId =
  | 'allOrNothing' | 'overgeneral' | 'filter' | 'discount' | 'jump'
  | 'magnify' | 'emotional' | 'should' | 'label' | 'personal';

export const DIST_ORDER: DistId[] = ['allOrNothing', 'overgeneral', 'filter', 'discount', 'jump', 'magnify', 'emotional', 'should', 'label', 'personal'];

interface F { T: Record<TenGod, number>; G: Record<TgGroup, number>; E: Record<El, number>; S: number; yang: boolean }

const RAW: Record<DistId, (f: F) => number> = {
  allOrNothing: (f) => (Math.max(...EL_ORDER.map((e) => f.E[e])) - Math.min(...EL_ORDER.map((e) => f.E[e]))) * 0.5 + f.T.pyeongwan * 0.8 + f.T.geopjae * 0.4 + (f.yang ? 5 : 0),
  overgeneral: (f) => f.T.pyeonin * 1.2 + f.G.resource * 0.3 + f.E.water * 0.2,
  filter: (f) => f.E.metal * 0.7 + f.T.pyeonin * 0.6 + f.T.pyeongwan * 0.3,
  discount: (f) => (30 - f.G.output) * 0.6 + f.G.power * 0.6 + (100 - f.S) * 0.1,
  // 성급한 결론 = 독심술(상관·편인) + 점쟁이 오류(수 과다·신약)
  jump: (f) => f.T.sanggwan * 0.45 + f.T.pyeonin * 0.45 + f.E.water * 0.45 + (100 - f.S) * 0.12 + f.T.pyeongwan * 0.2,
  magnify: (f) => f.E.fire * 0.7 + f.T.sanggwan * 0.6 + f.T.geopjae * 0.3,
  emotional: (f) => f.G.output * 0.5 + f.E.water * 0.35 + (30 - f.G.resource) * 0.3 + f.E.fire * 0.2,
  should: (f) => f.T.jeonggwan * 1.2 + f.E.earth * 0.5 + f.T.jeongin * 0.3,
  label: (f) => f.T.pyeongwan * 0.9 + f.T.geopjae * 0.7 + f.E.metal * 0.3,
  personal: (f) => (30 - f.G.self) * 0.6 + f.G.power * 0.4 + f.G.resource * 0.4 + f.E.earth * 0.2,
};

function features(a: Analysis, extra: Pillar[] = [], extraW = 0): F {
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
  return { T, G, E, S: a.strength, yang: a.dayStem % 2 === 0 };
}

export const rawScores = (a: Analysis, extra: Pillar[] = [], w = 0) => {
  const f = features(a, extra, w);
  return Object.fromEntries(DIST_ORDER.map((id) => [id, RAW[id](f)])) as Record<DistId, number>;
};

/** 모집단 분위로 0~100 */
function pct(id: DistId, v: number): number {
  const q: number[] = (norms as Record<string, number[]>)[id];
  if (!q) return 50;
  let lo = 0, hi = q.length - 1;
  if (v <= q[0]) return 1;
  if (v >= q[hi]) return 99;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (q[mid] <= v) lo = mid; else hi = mid; }
  const t = (v - q[lo]) / (q[hi] - q[lo] || 1);
  return Math.max(1, Math.min(99, Math.round(((lo + t) / (q.length - 1)) * 100)));
}

export interface DistResult {
  id: DistId;
  score: number;      // 원국 분위
  now: number;        // 현재 대운 반영 분위
  delta: number;
}

export function readDistortions(a: Analysis, daeun: Pillar | null): DistResult[] {
  const base = rawScores(a);
  const withD = daeun ? rawScores(a, [daeun], 9) : base;
  return DIST_ORDER.map((id) => {
    const score = pct(id, base[id]);
    const now = pct(id, withD[id]);
    return { id, score, now, delta: now - score };
  }).sort((x, y) => y.score - x.score);
}
