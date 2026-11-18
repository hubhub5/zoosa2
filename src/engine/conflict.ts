// 갈등 자리 6: 같은 종류의 싸움이 어디서 반복되는지
import type { Analysis } from '../saju/analysis';
import type { Pillar } from '../saju/constants';
import { rank, type F, type Ranked } from './features';

export type ConflictId = 'authority' | 'close' | 'money' | 'rival' | 'overload' | 'boundary';
export const CONFLICT_ORDER: ConflictId[] = ['authority', 'close', 'money', 'rival', 'overload', 'boundary'];

export const CONFLICT_RAW: Record<ConflictId, (f: F) => number> = {
  // 윗사람·규칙: 관성 + 상관(상관견관)
  authority: (f) => f.G.power * 0.4 + f.T.sanggwan * 0.8 + f.T.pyeongwan * 0.4,
  // 가까운 사람 서운함: 원국 충·원진 + 편인·수
  close: (f) => f.R.chung * 6 + f.R.wonjin * 7 + f.T.pyeonin * 0.4 + f.E.water * 0.3 + f.G.output * 0.15,
  // 돈·공정: 비겁이 재성을 나눠 감(군겁쟁재)
  money: (f) => f.T.geopjae * 0.8 + f.G.self * 0.3 + f.G.wealth * 0.3,
  // 비교·경쟁: 비견·겁재·편관 + 화
  rival: (f) => f.T.bijeon * 0.7 + f.T.geopjae * 0.3 + f.T.pyeongwan * 0.3 + f.E.fire * 0.3,
  // 거절 못 해 떠안기: 신약 + 재성·관성
  overload: (f) => (100 - f.S) * 0.25 + f.G.wealth * 0.3 + f.G.power * 0.3 + f.T.jeongjae * 0.2,
  // 선 넘는 사람 · 간섭: 인성 과다 + 형
  boundary: (f) => f.G.resource * 0.5 + f.T.jeongin * 0.3 + f.R.hyeong * 6 + f.T.pyeonjae * 0.2,
};

export type ConflictResult = Ranked<ConflictId>;
export const readConflict = (a: Analysis, daeun: Pillar | null): ConflictResult[] => rank(CONFLICT_ORDER, CONFLICT_RAW, a, daeun);
