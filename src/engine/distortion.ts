import type { Analysis } from '../saju/analysis';
import type { Pillar } from '../saju/constants';
import { EL_ORDER } from '../saju/constants';
import { features, rank, type F, type Ranked } from './features';

export type DistId =
  | 'allOrNothing' | 'overgeneral' | 'filter' | 'discount' | 'jump'
  | 'magnify' | 'emotional' | 'should' | 'label' | 'personal';

export const DIST_ORDER: DistId[] = ['allOrNothing', 'overgeneral', 'filter', 'discount', 'jump', 'magnify', 'emotional', 'should', 'label', 'personal'];

export const DIST_RAW: Record<DistId, (f: F) => number> = {
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

export const rawScores = (a: Analysis, extra: Pillar[] = [], w = 0) => {
  const f = features(a, extra, w);
  return Object.fromEntries(DIST_ORDER.map((id) => [id, DIST_RAW[id](f)])) as Record<DistId, number>;
};

export type DistResult = Ranked<DistId>;
export const readDistortions = (a: Analysis, daeun: Pillar | null): DistResult[] => rank(DIST_ORDER, DIST_RAW, a, daeun);
