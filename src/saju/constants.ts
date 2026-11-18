export type El = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type TenGod =
  | 'bijeon' | 'geopjae'
  | 'siksin' | 'sanggwan'
  | 'pyeonjae' | 'jeongjae'
  | 'pyeongwan' | 'jeonggwan'
  | 'pyeonin' | 'jeongin';

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const STEM_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const BRANCH_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const BRANCH_ANIMAL = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

export const STEM_EL: El[] = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];
export const BRANCH_EL: El[] = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water'];

/** 지장간. 마지막 원소가 본기. */
export const HIDDEN: number[][] = [
  [8, 9], [9, 7, 5], [4, 2, 0], [0, 1], [1, 9, 4], [4, 6, 2],
  [2, 5, 3], [3, 1, 5], [4, 8, 6], [6, 7], [7, 3, 4], [4, 0, 8],
];
export const mainHidden = (b: number) => HIDDEN[b][HIDDEN[b].length - 1];

export const EL_ORDER: El[] = ['wood', 'fire', 'earth', 'metal', 'water'];
export const EL_KO: Record<El, string> = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
export const EL_HANJA: Record<El, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };

export const TG_ORDER: TenGod[] = ['bijeon', 'geopjae', 'siksin', 'sanggwan', 'pyeonjae', 'jeongjae', 'pyeongwan', 'jeonggwan', 'pyeonin', 'jeongin'];
export const TG_KO: Record<TenGod, string> = {
  bijeon: '비견', geopjae: '겁재', siksin: '식신', sanggwan: '상관', pyeonjae: '편재',
  jeongjae: '정재', pyeongwan: '편관', jeonggwan: '정관', pyeonin: '편인', jeongin: '정인',
};
export const TG_HANJA: Record<TenGod, string> = {
  bijeon: '比肩', geopjae: '劫財', siksin: '食神', sanggwan: '傷官', pyeonjae: '偏財',
  jeongjae: '正財', pyeongwan: '偏官', jeonggwan: '正官', pyeonin: '偏印', jeongin: '正印',
};
export type TgGroup = 'self' | 'output' | 'wealth' | 'power' | 'resource';
export const TG_GROUP: Record<TenGod, TgGroup> = {
  bijeon: 'self', geopjae: 'self', siksin: 'output', sanggwan: 'output', pyeonjae: 'wealth',
  jeongjae: 'wealth', pyeongwan: 'power', jeonggwan: 'power', pyeonin: 'resource', jeongin: 'resource',
};
export const GROUP_KO: Record<TgGroup, string> = { self: '비겁', output: '식상', wealth: '재성', power: '관성', resource: '인성' };

const elIdx = (e: El) => EL_ORDER.indexOf(e);
export const generates = (a: El, b: El) => (elIdx(a) + 1) % 5 === elIdx(b);
export const controls = (a: El, b: El) => (elIdx(a) + 2) % 5 === elIdx(b);

/** 일간 기준 다른 천간의 십성 */
export function tenGod(day: number, other: number): TenGod {
  const d = STEM_EL[day], o = STEM_EL[other];
  const same = day % 2 === other % 2;
  if (d === o) return same ? 'bijeon' : 'geopjae';
  if (generates(d, o)) return same ? 'siksin' : 'sanggwan';
  if (controls(d, o)) return same ? 'pyeonjae' : 'jeongjae';
  if (controls(o, d)) return same ? 'pyeongwan' : 'jeonggwan';
  return same ? 'pyeonin' : 'jeongin';
}

/** 일간 기준으로 특정 오행이 어떤 십성 그룹인지 */
export function groupOfEl(day: number, el: El): TgGroup {
  const d = STEM_EL[day];
  if (d === el) return 'self';
  if (generates(d, el)) return 'output';
  if (controls(d, el)) return 'wealth';
  if (controls(el, d)) return 'power';
  return 'resource';
}

const pair = (a: number, b: number, list: [number, number][]) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
export const CHUNG: [number, number][] = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
export const HAP6: [number, number][] = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
export const HYEONG: [number, number][] = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3]];
export const WONJIN: [number, number][] = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
export const STEM_HAP: [number, number][] = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]];
export const STEM_CHUNG: [number, number][] = [[0, 6], [1, 7], [2, 8], [3, 9]];
export const isChung = (a: number, b: number) => pair(a, b, CHUNG);
export const isHap = (a: number, b: number) => pair(a, b, HAP6);
export const isHyeong = (a: number, b: number) => pair(a, b, HYEONG);
export const isWonjin = (a: number, b: number) => pair(a, b, WONJIN);
export const isStemHap = (a: number, b: number) => pair(a, b, STEM_HAP);
export const isStemChung = (a: number, b: number) => pair(a, b, STEM_CHUNG);
/** 역마: 寅申巳亥 */
export const isYeokma = (b: number) => [2, 5, 8, 11].includes(b);

export interface Pillar { s: number; b: number }
export const pillarHanja = (p: Pillar) => STEMS[p.s] + BRANCHES[p.b];
export const pillarKo = (p: Pillar) => STEM_KO[p.s] + BRANCH_KO[p.b];
export function pillarFromHanja(gz: string): Pillar {
  return { s: STEMS.indexOf(gz[0] as any), b: BRANCHES.indexOf(gz[1] as any) };
}
/** 60갑자 인덱스로부터 */
export const pillarFromCycle = (n: number): Pillar => ({ s: ((n % 10) + 10) % 10, b: ((n % 12) + 12) % 12 });
