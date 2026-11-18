// 옆모습 강아지 생성기. 굵은 검은 외곽선, 단색 + 아래쪽 그림자 한 단계, 점 눈.
import { Sprite, paint, inEllipse } from './engine.mjs';

export const OUT = '#231c1a';
const W = 36, H = 30, GROUND = 28;

const mixHex = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  return '#' + [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
};

const BASE = {
  body: { x: 15, y: 19, rx: 8, ry: 4.5 },
  leg: { w: 2 },
  head: { dx: -1, dy: -6.4, rx: 5, ry: 4.5 },
  snout: { len: 3, h: 2.6, dy: 1.4 },
  ear: { type: 'flop', size: 4 },
  tail: { type: 'up', len: 6 },
  fluffy: 0,
  marks: [],
};

/** 견종 정의. 숫자는 36×30 캔버스 기준 */
export const BREEDS = {
  maltese: { name: '말티즈', c: { base: '#fbf9f4', shade: '#e3ddd1' }, body: { x: 15, y: 21, rx: 6.5, ry: 4 }, head: { dx: -1, dy: -5.5, rx: 5, ry: 4.5 }, snout: { len: 2, h: 2.4, dy: 1.2 }, ear: { type: 'flop', size: 5, col: '#f1ebdf' }, tail: { type: 'curl', len: 5 }, fluffy: 1, bow: '#e0645a' },
  poodle: { name: '푸들', c: { base: '#a96b43', shade: '#83502f' }, body: { x: 15, y: 20, rx: 6.5, ry: 4.2 }, head: { dx: -1, dy: -6, rx: 4.6, ry: 4.4 }, snout: { len: 2.6, h: 2.4, dy: 1.2 }, ear: { type: 'flop', size: 4.5 }, tail: { type: 'pom', len: 4 }, fluffy: 1.2 },
  pomeranian: { name: '포메라니안', c: { base: '#e59b4f', shade: '#c47b35' }, body: { x: 15, y: 21, rx: 6.5, ry: 4.6 }, head: { dx: -1.5, dy: -5, rx: 5, ry: 4.6 }, snout: { len: 1.6, h: 2.2, dy: 1.2 }, ear: { type: 'prick', size: 2.6 }, tail: { type: 'curl', len: 6 }, fluffy: 1.6 },
  bichon: { name: '비숑', c: { base: '#fdfbf6', shade: '#e6e0d4' }, body: { x: 15, y: 20.5, rx: 6.8, ry: 4.5 }, head: { dx: -1, dy: -5.6, rx: 5.6, ry: 5.2 }, snout: { len: 1.6, h: 2.2, dy: 1.6 }, ear: { type: 'none' }, tail: { type: 'curl', len: 5 }, fluffy: 1.6 },
  shihtzu: { name: '시츄', c: { base: '#f6f1e8', shade: '#ddd5c7' }, body: { x: 15, y: 21, rx: 7, ry: 4.6 }, head: { dx: -1, dy: -5.4, rx: 5, ry: 4.6 }, snout: { len: 1.4, h: 2.2, dy: 1.4 }, ear: { type: 'flop', size: 5.5, col: '#a8784e' }, tail: { type: 'curl', len: 5 }, fluffy: 1, marks: [{ on: 'head', x: -1.2, y: -1.5, rx: 3.2, ry: 3, col: '#b9875a' }], bow: '#5d8bd0' },
  chihuahua: { name: '치와와', c: { base: '#dcab78', shade: '#b98855' }, body: { x: 16, y: 21, rx: 5.5, ry: 3.4 }, leg: { w: 1.6 }, head: { dx: -0.5, dy: -5, rx: 4.4, ry: 4 }, snout: { len: 1.8, h: 2, dy: 1.4 }, ear: { type: 'bat', size: 5 }, tail: { type: 'up', len: 5 }, marks: [{ on: 'body', x: 4, y: 1.5, rx: 2.4, ry: 2.2, col: '#f7ecdc' }] },
  corgi: { name: '웰시 코기', c: { base: '#e2954a', shade: '#bf7633' }, body: { x: 15, y: 22, rx: 9, ry: 4 }, head: { dx: -1, dy: -5.6, rx: 4.6, ry: 4 }, snout: { len: 2.8, h: 2.4, dy: 1.2 }, ear: { type: 'prick', size: 4.4 }, tail: { type: 'stub', len: 2 }, legLen: 3, fluffy: 0.4, marks: [{ on: 'body', x: 1, y: 3.2, rx: 9, ry: 2.2, col: '#fbf4e8' }, { on: 'head', x: 3.4, y: 2.4, rx: 2.6, ry: 2, col: '#fbf4e8' }, { on: 'snout', x: 0, y: 0, rx: 9, ry: 9, col: '#fbf4e8' }, { on: 'leg', x: 0, y: 0, rx: 99, ry: 99, col: '#fbf4e8' }] },
  shiba: { name: '시바', c: { base: '#da8b3e', shade: '#b56c2b' }, body: { x: 15, y: 20, rx: 8, ry: 4.4 }, head: { dx: -1, dy: -6, rx: 4.6, ry: 4 }, snout: { len: 2.6, h: 2.4, dy: 1.2 }, ear: { type: 'prick', size: 3.6 }, tail: { type: 'curl', len: 6 }, fluffy: 0.3, marks: [{ on: 'body', x: 3, y: 2.6, rx: 6, ry: 2, col: '#f8ecdb' }, { on: 'snout', x: 0, y: 0, rx: 9, ry: 9, col: '#f8ecdb' }, { on: 'head', x: 2.6, y: 2.4, rx: 2.2, ry: 1.6, col: '#f8ecdb' }] },
  jindo: { name: '진돗개', c: { base: '#f6efe2', shade: '#ddd2bf' }, body: { x: 15, y: 19.5, rx: 8.5, ry: 4.6 }, head: { dx: -1, dy: -6.2, rx: 4.6, ry: 4.1 }, snout: { len: 3, h: 2.4, dy: 1.2 }, ear: { type: 'prick', size: 3.8 }, tail: { type: 'curl', len: 7 }, fluffy: 0.3 },
  golden: { name: '골든 리트리버', c: { base: '#e2a64b', shade: '#bf8535' }, body: { x: 14.5, y: 18.5, rx: 9.5, ry: 5 }, head: { dx: -1, dy: -6.2, rx: 4.8, ry: 4.2 }, snout: { len: 3.4, h: 2.8, dy: 1.2 }, ear: { type: 'fold', size: 3.4 }, tail: { type: 'plume', len: 7 }, fluffy: 0.5 },
  labrador: { name: '래브라도', c: { base: '#ebca85', shade: '#caa866' }, body: { x: 14.5, y: 18.5, rx: 9.5, ry: 5 }, head: { dx: -1, dy: -6.2, rx: 4.8, ry: 4.1 }, snout: { len: 3.6, h: 2.8, dy: 1.2 }, ear: { type: 'fold', size: 3 }, tail: { type: 'otter', len: 7 } },
  dachshund: { name: '닥스훈트', c: { base: '#93502b', shade: '#6e391c' }, body: { x: 15, y: 23, rx: 10, ry: 3.4 }, head: { dx: -0.5, dy: -4.4, rx: 4, ry: 3.4 }, snout: { len: 4, h: 2.2, dy: 1 }, ear: { type: 'flop', size: 4.2 }, tail: { type: 'long', len: 7 }, legLen: 2 },
  yorkie: { name: '요크셔테리어', c: { base: '#59626e', shade: '#424954' }, body: { x: 15, y: 21, rx: 6.5, ry: 3.8 }, head: { dx: -0.5, dy: -5, rx: 4.2, ry: 3.8 }, snout: { len: 2, h: 2.2, dy: 1.2 }, ear: { type: 'prick', size: 3, col: '#c9944f' }, tail: { type: 'up', len: 4 }, fluffy: 0.8, marks: [{ on: 'head', x: 0, y: 0, rx: 99, ry: 99, col: '#c99650' }, { on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: '#c99650' }, { on: 'leg', x: 0, y: 0, rx: 99, ry: 99, col: '#c99650' }], bow: '#e0645a' },
  frenchie: { name: '프렌치 불독', c: { base: '#ddc49c', shade: '#bea47b' }, body: { x: 15, y: 20.5, rx: 7.5, ry: 5 }, head: { dx: -0.5, dy: -5.2, rx: 4.8, ry: 4.4 }, snout: { len: 1.2, h: 2.6, dy: 1.4 }, ear: { type: 'bat', size: 4.4 }, tail: { type: 'stub', len: 1 }, marks: [{ on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: '#4a3c33' }] },
  schnauzer: { name: '슈나우저', c: { base: '#8c8b88', shade: '#6c6b68' }, body: { x: 15, y: 19.5, rx: 7.5, ry: 4.4 }, head: { dx: -0.5, dy: -6, rx: 4.2, ry: 4 }, snout: { len: 3.6, h: 3.4, dy: 1.6 }, ear: { type: 'fold', size: 2.6 }, tail: { type: 'stub', len: 2 }, marks: [{ on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: '#e8e5de' }, { on: 'leg', x: 0, y: 0, rx: 99, ry: 99, col: '#d6d3cc' }], brows: '#e8e5de' },
  beagle: { name: '비글', c: { base: '#cf8d4a', shade: '#ad7136' }, body: { x: 15, y: 19.5, rx: 8, ry: 4.4 }, head: { dx: -1, dy: -6, rx: 4.5, ry: 4 }, snout: { len: 3, h: 2.6, dy: 1.2 }, ear: { type: 'flop', size: 4.6, col: '#a86a33' }, tail: { type: 'up', len: 6, tip: '#fbf4e8' }, marks: [{ on: 'body', x: -1, y: -2.4, rx: 6.4, ry: 2.6, col: '#2c2522' }, { on: 'body', x: 4.6, y: 2.6, rx: 3.2, ry: 2.4, col: '#fbf4e8' }, { on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: '#fbf4e8' }, { on: 'leg', x: 0, y: 2, rx: 99, ry: 3, col: '#fbf4e8' }] },
  bordercollie: { name: '보더 콜리', c: { base: '#2a2422', shade: '#1a1514' }, body: { x: 15, y: 19.5, rx: 8.5, ry: 4.4 }, head: { dx: -1, dy: -6, rx: 4.5, ry: 4 }, snout: { len: 3, h: 2.4, dy: 1.2 }, ear: { type: 'fold', size: 2.8 }, tail: { type: 'plume', len: 7, tip: '#fbf4e8' }, fluffy: 0.6, marks: [{ on: 'body', x: 6, y: 0, rx: 2.8, ry: 6, col: '#fbf4e8' }, { on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: '#fbf4e8' }, { on: 'head', x: 1.4, y: -1, rx: 0.9, ry: 4, col: '#fbf4e8' }, { on: 'leg', x: 0, y: 2, rx: 99, ry: 3, col: '#fbf4e8' }] },
  samoyed: { name: '사모예드', c: { base: '#fdfbf7', shade: '#e4ded2' }, body: { x: 14.5, y: 19, rx: 9, ry: 5.2 }, head: { dx: -1, dy: -6, rx: 4.8, ry: 4.4 }, snout: { len: 2.6, h: 2.4, dy: 1.2 }, ear: { type: 'prick', size: 3.2 }, tail: { type: 'curl', len: 7 }, fluffy: 1.4 },
  sighthound: { name: '이탈리안 그레이하운드', c: { base: '#9aa0a8', shade: '#7b818a' }, body: { x: 14.5, y: 14.2, rx: 7.4, ry: 2.6 }, leg: { w: 1 }, head: { dx: 2.2, dy: -6.4, rx: 3.3, ry: 2.6 }, snout: { len: 4.2, h: 1.7, dy: 0.8 }, neck: true, deepChest: true, ear: { type: 'fold', size: 2 }, tail: { type: 'whip', len: 8 }, marks: [{ on: 'body', x: 4.4, y: 1.6, rx: 2, ry: 1.8, col: '#eceae6' }] },
  mix: { name: '믹스', c: { base: '#f0d6a8', shade: '#d4b07c' } },
};
export const BREED_ORDER = Object.keys(BREEDS);

// 견종별 실제로 흔한 털색. 첫 번째가 기본. 무늬가 견종 특징이면 marks/ear 까지 통째로 바꾼다
const W_ = '#fbf4e8';
export const COLORS = {
  poodle: [
    { id: 'brown', name: '갈색' },
    { id: 'apricot', name: '크림', c: { base: '#ecd2a6', shade: '#cfb07e' } },
    { id: 'white', name: '흰색', c: { base: '#fbf9f4', shade: '#e3ddd1' } },
    { id: 'black', name: '검정', c: { base: '#332d2b', shade: '#211c1a' } },
    { id: 'red', name: '레드', c: { base: '#c2622f', shade: '#9b4a21' } },
  ],
  pomeranian: [
    { id: 'orange', name: '오렌지' },
    { id: 'cream', name: '크림', c: { base: '#f1dcb5', shade: '#d6bb8c' } },
    { id: 'white', name: '흰색', c: { base: '#fdfbf6', shade: '#e6e0d4' } },
    { id: 'black', name: '검정', c: { base: '#2f2a28', shade: '#1d1918' } },
  ],
  shihtzu: [
    { id: 'brown', name: '갈색 · 흰색' },
    { id: 'black', name: '검정 · 흰색', ear: { type: 'flop', size: 5.5, col: '#3a3330' }, marks: [{ on: 'head', x: -1.2, y: -1.5, rx: 3.2, ry: 3, col: '#3a3330' }] },
    { id: 'gold', name: '골드', c: { base: '#ebc58c', shade: '#cba26a' }, ear: { type: 'flop', size: 5.5, col: '#c48e52' }, marks: [{ on: 'head', x: -1.2, y: -1.5, rx: 3.2, ry: 3, col: '#c48e52' }] },
  ],
  chihuahua: [
    { id: 'fawn', name: '황갈색' },
    { id: 'cream', name: '크림', c: { base: '#f2e0bf', shade: '#d5bf98' } },
    { id: 'chocolate', name: '초코', c: { base: '#7a4a2c', shade: '#5c341d' } },
    { id: 'blacktan', name: '블랙탄', c: { base: '#2f2826', shade: '#1d1817' }, marks: [{ on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: '#c98a4a' }, { on: 'leg', x: 0, y: 1, rx: 99, ry: 3, col: '#c98a4a' }, { on: 'body', x: 4, y: 1.5, rx: 2.4, ry: 2.2, col: W_ }] },
  ],
  corgi: [
    { id: 'red', name: '레드' },
    { id: 'tri', name: '트라이', marks: [{ on: 'body', x: -1, y: -1.6, rx: 7.5, ry: 2.6, col: '#2c2522' }, { on: 'body', x: 1, y: 3.2, rx: 9, ry: 2.2, col: W_ }, { on: 'head', x: 3.4, y: 2.4, rx: 2.6, ry: 2, col: W_ }, { on: 'snout', x: 0, y: 0, rx: 9, ry: 9, col: W_ }, { on: 'leg', x: 0, y: 0, rx: 99, ry: 99, col: W_ }] },
  ],
  shiba: [
    { id: 'red', name: '적색' },
    { id: 'sesame', name: '참깨', c: { base: '#b88a55', shade: '#8f663b' } },
    { id: 'blacktan', name: '블랙탄', c: { base: '#2d2725', shade: '#1c1817' } },
    { id: 'cream', name: '크림', c: { base: '#f0dcb6', shade: '#d4bc90' } },
  ],
  jindo: [
    { id: 'white', name: '백구' },
    { id: 'yellow', name: '황구', c: { base: '#d9a45a', shade: '#b8843e' } },
    { id: 'black', name: '흑구', c: { base: '#2f2a28', shade: '#1d1918' } },
    { id: 'brindle', name: '호구', c: { base: '#7a5d3e', shade: '#5a432b' } },
  ],
  golden: [
    { id: 'gold', name: '골드' },
    { id: 'light', name: '라이트', c: { base: '#efd39c', shade: '#d2b479' } },
    { id: 'red', name: '레드', c: { base: '#c4783a', shade: '#9e5c27' } },
  ],
  labrador: [
    { id: 'yellow', name: '옐로' },
    { id: 'black', name: '블랙', c: { base: '#2a2523', shade: '#1a1716' } },
    { id: 'chocolate', name: '초코', c: { base: '#6e4228', shade: '#52301b' } },
  ],
  dachshund: [
    { id: 'red', name: '레드' },
    { id: 'blacktan', name: '블랙탄', c: { base: '#2c2523', shade: '#1b1716' }, marks: [{ on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: '#b9773d' }, { on: 'leg', x: 0, y: 0, rx: 99, ry: 99, col: '#b9773d' }] },
    { id: 'cream', name: '크림', c: { base: '#e3bb85', shade: '#c49c66' } },
  ],
  frenchie: [
    { id: 'fawn', name: '폰' },
    { id: 'cream', name: '크림', c: { base: '#f1e5cd', shade: '#d6c6a6' }, marks: [] },
    { id: 'brindle', name: '브린들', c: { base: '#4a3c33', shade: '#33281f' }, marks: [{ on: 'body', x: 5, y: 1.5, rx: 2.2, ry: 3, col: W_ }] },
    { id: 'pied', name: '파이드', c: { base: '#f7f2e9', shade: '#ddd5c7' }, ear: { type: 'bat', size: 4.4, col: '#3a302a' }, marks: [{ on: 'head', x: -1, y: -1.4, rx: 2.2, ry: 2.2, col: '#3a302a' }, { on: 'body', x: -2, y: -1, rx: 2.6, ry: 2, col: '#3a302a' }] },
  ],
  schnauzer: [
    { id: 'saltpepper', name: '솔트앤페퍼' },
    { id: 'blacksilver', name: '블랙실버', c: { base: '#2e2a28', shade: '#1c1918' }, marks: [{ on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: '#cfccc5' }, { on: 'leg', x: 0, y: 0, rx: 99, ry: 99, col: '#a9a6a0' }], brows: '#cfccc5' },
    { id: 'black', name: '검정', c: { base: '#2e2a28', shade: '#1c1918' }, marks: [], brows: '#4a4542' },
    { id: 'white', name: '흰색', c: { base: '#f3f0ea', shade: '#d8d3ca' }, marks: [], brows: null },
  ],
  beagle: [
    { id: 'tri', name: '트라이' },
    { id: 'lemon', name: '레몬', c: { base: '#ebcf96', shade: '#cdb077' }, ear: { type: 'flop', size: 4.6, col: '#d9b06e' }, marks: [{ on: 'body', x: 4.6, y: 2.6, rx: 3.2, ry: 2.4, col: W_ }, { on: 'snout', x: 0, y: 0, rx: 99, ry: 99, col: W_ }, { on: 'leg', x: 0, y: 2, rx: 99, ry: 3, col: W_ }] },
  ],
  bordercollie: [
    { id: 'black', name: '흑백' },
    { id: 'red', name: '레드', c: { base: '#7a4428', shade: '#5a2f19' } },
    { id: 'blue', name: '블루멀', c: { base: '#7d8794', shade: '#5f6873' } },
  ],
  sighthound: [
    { id: 'grey', name: '블루' },
    { id: 'fawn', name: '폰', c: { base: '#d8b98e', shade: '#b8996e' } },
    { id: 'black', name: '블랙', c: { base: '#2c2826', shade: '#1b1817' } },
    { id: 'red', name: '레드', c: { base: '#c08051', shade: '#9b6239' } },
    { id: 'cream', name: '크림', c: { base: '#efe2c9', shade: '#d2c2a4' }, marks: [] },
    { id: 'white', name: '화이트', c: { base: '#f6f3ee', shade: '#dad4ca' }, marks: [] },
    { id: 'spot', name: '파티', c: { base: '#f6f3ee', shade: '#dad4ca' }, marks: [{ on: 'body', x: -2, y: -1, rx: 3.4, ry: 2.4, col: '#8e949c' }, { on: 'head', x: -0.6, y: -0.8, rx: 2, ry: 1.8, col: '#8e949c' }] },
  ],
  mix: [
    { id: 'cream', name: '크림' },
    { id: 'brown', name: '갈색', c: { base: '#a8693b', shade: '#82492a' } },
    { id: 'yellow', name: '황구', c: { base: '#d9a45a', shade: '#b8843e' }, ear: { type: 'prick', size: 3.4 }, tail: { type: 'curl', len: 6 } },
    { id: 'white', name: '흰색', c: { base: '#f7f3eb', shade: '#ddd5c7' } },
    { id: 'black', name: '검정', c: { base: '#36302d', shade: '#211c1a' }, marks: [{ on: 'body', x: 4.6, y: 1.6, rx: 2.4, ry: 2.6, col: '#f1e9dc' }] },
    { id: 'spot', name: '얼룩', c: { base: '#f8f3ea', shade: '#ddd5c7' }, ear: { type: 'flop', size: 4.2, col: '#9b6a43' }, marks: [{ on: 'body', x: -2.5, y: -1.5, rx: 3.6, ry: 2.6, col: '#9b6a43' }, { on: 'head', x: -0.6, y: -1.6, rx: 2.2, ry: 2, col: '#9b6a43' }] },
    { id: 'grey', name: '회색', c: { base: '#a7a49e', shade: '#83807b' } },
  ],
};
export const colorsOf = (id) => COLORS[id] ?? [{ id: 'std', name: '기본' }];
/** 모든 (견종, 털색) 조합 */
export const VARIANTS = BREED_ORDER.flatMap((id) => colorsOf(id).map((c) => ({ id, color: c.id, key: `${id}-${c.id}` })));

const rot = ([x, y], [ax, ay], a) => [ax + (x - ax) * Math.cos(a) - (y - ay) * Math.sin(a), ay + (x - ax) * Math.sin(a) + (y - ay) * Math.cos(a)];

/** 오른쪽을 보는 강아지 */
export function sideDog(id, color = null, f = 0, { blink = false, tongue = false } = {}) {
  const col = colorsOf(id).find((c) => c.id === color) ?? colorsOf(id)[0];
  const { id: _cid, name: _cn, ...over } = col;
  const d = { ...BASE, ...BREEDS[id], ...over };
  d.body = { ...BASE.body, ...(BREEDS[id].body || {}) };
  d.head = { ...BASE.head, ...(BREEDS[id].head || {}) };
  d.snout = { ...BASE.snout, ...(BREEDS[id].snout || {}) };
  d.leg = { ...BASE.leg, ...(BREEDS[id].leg || {}) };
  const { base, shade } = d.c;
  // 먼 쪽 다리·귀: 밝은 털은 그림자색, 어두운 털은 살짝 더 어둡게
  const lum = parseInt(base.slice(1, 3), 16) + parseInt(base.slice(3, 5), 16) + parseInt(base.slice(5, 7), 16);
  const dark = lum > 560 ? shade : mixHex(shade, OUT, 0.2);
  const s = new Sprite(W, H);
  const B = d.body;
  const Hx = B.x + B.rx + d.head.dx, Hy = B.y + d.head.dy;
  const fur = { base, light: base, shade };
  const wag = [0, -0.35, 0, 0.3][f % 4];
  const A = [B.x - B.rx + 1.5, B.y - 1.5];

  // 꼬리 (몸 뒤)
  const t = d.tail, L = t.len;
  s.def('tail', { ...fur, edge: OUT });
  const T = (pts) => { const r = pts.map((p) => rot(p, A, wag)); tailEnd = r[r.length - 1]; return r; };
  let tailEnd = A;
  if (t.type === 'curl') s.stroke(T([A, [A[0] - 1.5, A[1] - L * 0.55], [A[0] + 1, A[1] - L * 0.9], [A[0] + 2.6, A[1] - L * 0.55]]), 1.5, 'tail');
  else if (t.type === 'up') s.stroke(T([A, [A[0] - 2, A[1] - L * 0.6], [A[0] - 2.4, A[1] - L]]), 1, 'tail');
  else if (t.type === 'plume') s.stroke(T([A, [A[0] - L * 0.5, A[1] + 0.5], [A[0] - L * 0.85, A[1] + 3]]), 1.6, 'tail');
  else if (t.type === 'otter') s.stroke(T([A, [A[0] - L * 0.55, A[1] + 1], [A[0] - L * 0.9, A[1] + 2.4]]), 1.3, 'tail');
  else if (t.type === 'long') s.stroke(T([A, [A[0] - L * 0.5, A[1] - 0.5], [A[0] - L, A[1] - 2.5]]), 0.9, 'tail');
  else if (t.type === 'pom') { s.stroke(T([A, [A[0] - 1, A[1] - 2.5]]), 0.8, 'tail'); const [px, py] = rot([A[0] - 1.3, A[1] - 4], A, wag); s.ellipse(px, py, 2, 2, 'tail'); }
  else if (t.type === 'whip') s.stroke(T([A, [A[0] - 3.4, A[1] + 1.2], [A[0] - 5.4, A[1] + 4.6], [A[0] - 5.2, A[1] + 8]]), 0.7, 'tail');
  else if (t.type === 'stub') s.ellipse(...rot([A[0] - 0.6, A[1] - 0.6], A, wag), 1.6, 1.4, 'tail');

  // 다리 (먼 쪽 먼저, 어둡게)
  const legLen = d.legLen ?? (GROUND - (B.y + B.ry) + 2);
  const legTop = GROUND - legLen;
  const lw = d.leg.w;
  const bx0 = B.x - B.rx + 1.6, fx0 = B.x + B.rx - 3.8;
  s.def('legFar', { base: dark, light: dark, shade: dark, edge: OUT });
  s.rect(Math.round(bx0 + 1.6), Math.floor(legTop), Math.ceil(lw), GROUND - Math.floor(legTop), 'legFar');
  s.rect(Math.round(fx0 + 1.6), Math.floor(legTop), Math.ceil(lw), GROUND - Math.floor(legTop), 'legFar');
  if (d.ear.type !== 'none' && d.ear.type !== 'flop' && d.ear.type !== 'fold') {
    // 먼 쪽 귀
    s.def('earFar', { base: dark, light: dark, shade: dark, edge: OUT });
    earShape(s, d, Hx + 1.6, Hy, 'earFar');
  }
  s.def('body', { ...fur });
  s.ellipse(B.x, B.y, B.rx, B.ry, 'body');
  // 시각 하운드: 깊은 가슴, 잘록한 허리, 긴 목
  if (d.deepChest) s.ellipse(B.x + B.rx * 0.45, B.y + 1, 3.4, 3.4, 'body');
  if (d.neck) s.stroke([[B.x + B.rx - 2.4, B.y - 1], [Hx - 0.6, Hy + 1.2]], 1.5, 'body');
  s.def('leg', { ...fur, edge: OUT, edgeSkip: ['body'] });
  s.rect(Math.round(bx0), Math.floor(legTop), Math.ceil(lw), GROUND - Math.floor(legTop), 'leg');
  s.rect(Math.round(fx0), Math.floor(legTop), Math.ceil(lw), GROUND - Math.floor(legTop), 'leg');
  if (d.fluffy) {
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      if (Math.sin(a) > 0.55) continue; // 아랫배는 다리와 겹치므로 생략
      s.ellipse(B.x + Math.cos(a) * B.rx, B.y + Math.sin(a) * B.ry, 0.7 + d.fluffy * 0.55, 0.7 + d.fluffy * 0.55, 'body');
    }
  }
  s.def('head', { ...fur });
  s.ellipse(Hx, Hy, d.head.rx, d.head.ry, 'head');
  if (d.fluffy > 0.9) for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    if (Math.cos(a) > 0.5 && Math.sin(a) > -0.2) continue; // 주둥이 쪽 비움
    s.ellipse(Hx + Math.cos(a) * d.head.rx, Hy + Math.sin(a) * d.head.ry, 0.6 + d.fluffy * 0.45, 0.6 + d.fluffy * 0.45, 'head');
  }
  s.def('snout', { ...fur });
  const sx = Hx + d.head.rx - 1.2, sy = Hy + d.snout.dy;
  s.ellipse(sx + d.snout.len / 2, sy, d.snout.len / 2 + 0.9, d.snout.h / 2, 'snout');
  s.def('ear', { base: d.ear.col || dark, light: d.ear.col || dark, shade: d.ear.col ? mixHex(d.ear.col, OUT, 0.15) : dark, edge: OUT });
  if (d.ear.type !== 'none') earShape(s, d, Hx, Hy, 'ear');
  s.render(OUT, { lightDir: [0, -1] });

  // 무늬
  for (const m of d.marks || []) {
    const parts = m.on === 'leg' ? ['leg', 'legFar'] : [m.on];
    const ox = m.on === 'head' ? Hx : m.on === 'snout' ? sx : m.on === 'leg' ? 0 : B.x;
    const oy = m.on === 'head' ? Hy : m.on === 'snout' ? sy : m.on === 'leg' ? GROUND - 2 : B.y;
    const farLeg = (c) => c;
    paint(s, inEllipse(ox + m.x, oy + m.y, m.rx, m.ry), (prev) => (prev === dark && m.on === 'leg' ? mixHex(m.col, OUT, 0.18) : farLeg(m.col)), parts);
  }
  if (t.tip) paint(s, inEllipse(tailEnd[0], tailEnd[1], 2, 2), t.tip, ['tail']);

  // 얼굴
  const E = OUT;
  const ex = Math.round(Hx + 1), ey = Math.round(Hy - 1.6);
  if (blink) s.dots([[ex, ey + 1], [ex + 1, ey + 1]], E);
  else s.dots([[ex, ey], [ex + 1, ey], [ex, ey + 1], [ex + 1, ey + 1]], E);
  if (!blink && lum < 330) s.dot(ex + 1, ey, '#ffffff').dot(ex, ey + 1, '#6b5a52');
  if (d.brows) s.dots([[ex - 1, ey - 1], [ex, ey - 1], [ex + 1, ey - 1]], d.brows);
  // 코: 주둥이 맨 앞 위쪽
  let nx = -1, ny = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (s.P(x, y) === 'snout' && x > nx) { nx = x; ny = y; }
  for (let y = 0; y < H; y++) if (s.P(nx, y) === 'snout') { ny = y; break; }
  s.dots([[nx, ny], [nx - 1, ny]], E);
  if (tongue) s.dots([[nx - 1, ny + 2], [nx - 2, ny + 2]], '#ea8a86');
  // 볼
  s.dot(ex + 1, ey + 2, d.c.base === '#36302d' || d.c.base === '#2a2422' ? '#8a5a55' : '#f2a9a0');
  if (d.bow) { const bx = Math.round(Hx - 1), by = Math.round(Hy - d.head.ry - 0.2); s.dots([[bx - 1, by], [bx + 1, by], [bx - 1, by + 1], [bx + 1, by + 1]], d.bow).dot(bx, by, mixHex(d.bow, OUT, 0.3)).dot(bx, by + 1, mixHex(d.bow, OUT, 0.3)); }
  return s;
}

function earShape(s, d, Hx, Hy, part) {
  const e = d.ear, k = e.size, top = Hy - d.head.ry;
  if (e.type === 'prick') s.poly([[Hx - 2.6, top + 1.6], [Hx - 1.2, top - k], [Hx + 0.8, top + 1.4]], part);
  else if (e.type === 'bat') s.poly([[Hx - 3, top + 2], [Hx - 2, top - k], [Hx + 0.6, top - k + 1.2], [Hx + 1, top + 1.6]], part);
  else if (e.type === 'flop') s.ellipse(Hx - 2.4, Hy + 0.6, 1.9, k / 1.6 + 0.6, part, 0.2);
  else if (e.type === 'fold') s.ellipse(Hx - 2, Hy - 0.8, 1.7, k / 1.5, part, 0.25);
}
