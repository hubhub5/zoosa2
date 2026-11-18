// 대처 방식 6: 일이 터졌을 때 몸이 먼저 고르는 쪽
import type { Analysis } from '../saju/analysis';
import type { Pillar } from '../saju/constants';
import { rank, type F, type Ranked } from './features';

export type CopeId = 'avoid' | 'suppress' | 'vent' | 'control' | 'please' | 'intellect';
export const COPE_ORDER: CopeId[] = ['avoid', 'suppress', 'vent', 'control', 'please', 'intellect'];

export const COPE_RAW: Record<CopeId, (f: F) => number> = {
  // 피하기: 인성(특히 편인)·수 → 생각 속으로 숨음, 신약일수록
  avoid: (f) => f.T.pyeonin * 0.8 + f.G.resource * 0.3 + f.E.water * 0.4 + (100 - f.S) * 0.12,
  // 참기: 관성·토 → 말 삼키고 버팀. 음간
  suppress: (f) => f.G.power * 0.6 + f.T.jeonggwan * 0.5 + f.E.earth * 0.4 + (f.yang ? 0 : 5),
  // 터뜨리기: 식상(특히 상관)·화 → 말로 먼저 나감. 양간
  vent: (f) => f.T.sanggwan * 0.9 + f.G.output * 0.3 + f.E.fire * 0.5 + (f.yang ? 5 : 0),
  // 움켜쥐기: 재성·금·신강 → 판을 내 손으로 정리
  control: (f) => f.G.wealth * 0.5 + f.T.pyeonjae * 0.4 + f.E.metal * 0.4 + f.S * 0.12 + f.T.bijeon * 0.3,
  // 맞춰주기: 신약 + 관성·정인 → 상대 기분부터
  please: (f) => (100 - f.S) * 0.22 + f.T.jeonggwan * 0.4 + f.T.jeongin * 0.6 + f.T.jeongjae * 0.3 + f.R.hap * 2,
  // 머리로 정리: 인성·금·수 → 이유를 붙여 납득시킴
  intellect: (f) => f.T.jeongin * 0.4 + f.T.pyeonin * 0.3 + f.E.metal * 0.3 + f.E.water * 0.3 + f.T.siksin * 0.5,
};

export type CopeResult = Ranked<CopeId>;
export const readCoping = (a: Analysis, daeun: Pillar | null): CopeResult[] => rank(COPE_ORDER, COPE_RAW, a, daeun);
