// pixel/breeds.mjs 에서 생성 (견종 · 털색 이름만). 견종을 바꾸면 다시 생성
export interface BreedColor { id: string; name: string }
export interface Breed { id: string; name: string; colors: BreedColor[] }
export const BREED_LIST: Breed[] = [
  { id: 'maltese', name: '말티즈', colors: [{ id: 'std', name: '기본' }] },
  { id: 'poodle', name: '푸들', colors: [{ id: 'brown', name: '갈색' }, { id: 'apricot', name: '크림' }, { id: 'white', name: '흰색' }, { id: 'black', name: '검정' }, { id: 'red', name: '레드' }] },
  { id: 'pomeranian', name: '포메라니안', colors: [{ id: 'orange', name: '오렌지' }, { id: 'cream', name: '크림' }, { id: 'white', name: '흰색' }, { id: 'black', name: '검정' }] },
  { id: 'bichon', name: '비숑', colors: [{ id: 'std', name: '기본' }] },
  { id: 'shihtzu', name: '시츄', colors: [{ id: 'brown', name: '갈색 · 흰색' }, { id: 'black', name: '검정 · 흰색' }, { id: 'gold', name: '골드' }] },
  { id: 'chihuahua', name: '치와와', colors: [{ id: 'fawn', name: '황갈색' }, { id: 'cream', name: '크림' }, { id: 'chocolate', name: '초코' }, { id: 'blacktan', name: '블랙탄' }] },
  { id: 'corgi', name: '웰시 코기', colors: [{ id: 'red', name: '레드' }, { id: 'tri', name: '트라이' }] },
  { id: 'shiba', name: '시바', colors: [{ id: 'red', name: '적색' }, { id: 'sesame', name: '참깨' }, { id: 'blacktan', name: '블랙탄' }, { id: 'cream', name: '크림' }] },
  { id: 'jindo', name: '진돗개', colors: [{ id: 'white', name: '백구' }, { id: 'yellow', name: '황구' }, { id: 'black', name: '흑구' }, { id: 'brindle', name: '호구' }] },
  { id: 'golden', name: '골든 리트리버', colors: [{ id: 'gold', name: '골드' }, { id: 'light', name: '라이트' }, { id: 'red', name: '레드' }] },
  { id: 'labrador', name: '래브라도', colors: [{ id: 'yellow', name: '옐로' }, { id: 'black', name: '블랙' }, { id: 'chocolate', name: '초코' }] },
  { id: 'dachshund', name: '닥스훈트', colors: [{ id: 'red', name: '레드' }, { id: 'blacktan', name: '블랙탄' }, { id: 'cream', name: '크림' }] },
  { id: 'yorkie', name: '요크셔테리어', colors: [{ id: 'std', name: '기본' }] },
  { id: 'frenchie', name: '프렌치 불독', colors: [{ id: 'fawn', name: '폰' }, { id: 'cream', name: '크림' }, { id: 'brindle', name: '브린들' }, { id: 'pied', name: '파이드' }] },
  { id: 'schnauzer', name: '슈나우저', colors: [{ id: 'saltpepper', name: '솔트앤페퍼' }, { id: 'blacksilver', name: '블랙실버' }, { id: 'black', name: '검정' }, { id: 'white', name: '흰색' }] },
  { id: 'beagle', name: '비글', colors: [{ id: 'tri', name: '트라이' }, { id: 'lemon', name: '레몬' }] },
  { id: 'bordercollie', name: '보더 콜리', colors: [{ id: 'black', name: '흑백' }, { id: 'red', name: '레드' }, { id: 'blue', name: '블루멀' }] },
  { id: 'samoyed', name: '사모예드', colors: [{ id: 'std', name: '기본' }] },
  { id: 'sighthound', name: '이탈리안 그레이하운드', colors: [{ id: 'grey', name: '블루' }, { id: 'fawn', name: '폰' }, { id: 'black', name: '블랙' }, { id: 'red', name: '레드' }, { id: 'cream', name: '크림' }, { id: 'white', name: '화이트' }, { id: 'spot', name: '파티' }] },
  { id: 'mix', name: '믹스', colors: [{ id: 'cream', name: '크림' }, { id: 'brown', name: '갈색' }, { id: 'yellow', name: '황구' }, { id: 'white', name: '흰색' }, { id: 'black', name: '검정' }, { id: 'spot', name: '얼룩' }, { id: 'grey', name: '회색' }] },
];
export type BreedId = string;

export const findBreed = (id: string) => BREED_LIST.find((b) => b.id === id) ?? BREED_LIST.find((b) => b.id === 'mix')!;
/** 견종 + 털색 표시 이름. 털색이 하나뿐이면 견종만 */
export function breedName(id: string, color?: string) {
  const b = findBreed(id);
  if (b.colors.length < 2) return b.name;
  const c = b.colors.find((x) => x.id === color) ?? b.colors[0];
  return `${b.name} · ${c.name}`;
}
/** 존재하는 조합으로 맞춤 */
export function normalize(id: string, color?: string | null): { breed: string; color: string } {
  const b = findBreed(id);
  const c = b.colors.find((x) => x.id === color) ?? b.colors[0];
  return { breed: b.id, color: c.id };
}
/** 예전 링크 값 호환: mix-cream, cream, shiba 등 */
export function fromLegacy(f: string): { breed: string; color: string } {
  const coat: Record<string, string> = { cream: 'cream', brown: 'brown', white: 'white', black: 'black', spot: 'spot', grey: 'grey' };
  if (f.startsWith('mix-')) return normalize('mix', f.slice(4));
  if (coat[f]) return normalize('mix', coat[f]);
  return normalize(f);
}

// ---------- 직접 입력용: 추천 견종 목록과 그림 연결
// sprite: 표지 그림에 쓸 체형(위 BREED_LIST 의 id), color: 그 견종의 기본 털색 id
export interface Suggest { name: string; sprite: string; color?: string; aliases?: string[] }
export const BREED_SUGGEST: Suggest[] = [
  { name: '말티즈', sprite: 'maltese', aliases: ['말티'] },
  { name: '푸들', sprite: 'poodle', aliases: ['토이푸들', '토이 푸들', '미니푸들', '미니어처 푸들', '스탠다드 푸들'] },
  { name: '포메라니안', sprite: 'pomeranian', aliases: ['포메'] },
  { name: '비숑 프리제', sprite: 'bichon', aliases: ['비숑'] },
  { name: '시츄', sprite: 'shihtzu', aliases: ['시추'] },
  { name: '치와와', sprite: 'chihuahua' },
  { name: '웰시 코기', sprite: 'corgi', aliases: ['코기', '웰시코기'] },
  { name: '시바', sprite: 'shiba', aliases: ['시바견', '시바이누', '시바 이누'] },
  { name: '진돗개', sprite: 'jindo', aliases: ['진도', '진도견', '백구', '황구'] },
  { name: '골든 리트리버', sprite: 'golden', aliases: ['골든', '골리', '골든리트리버'] },
  { name: '래브라도 리트리버', sprite: 'labrador', aliases: ['래브라도', '리트리버', '래브'] },
  { name: '닥스훈트', sprite: 'dachshund', aliases: ['닥스', '미니어처 닥스훈트'] },
  { name: '요크셔테리어', sprite: 'yorkie', aliases: ['요키', '요크셔'] },
  { name: '프렌치 불독', sprite: 'frenchie', aliases: ['프불', '프렌치불독'] },
  { name: '슈나우저', sprite: 'schnauzer', aliases: ['미니어처 슈나우저', '미니 슈나우저'] },
  { name: '비글', sprite: 'beagle' },
  { name: '보더 콜리', sprite: 'bordercollie', aliases: ['보더콜리'] },
  { name: '사모예드', sprite: 'samoyed', aliases: ['사모'] },
  { name: '이탈리안 그레이하운드', sprite: 'sighthound', color: 'grey', aliases: ['이탈리안', '이그', '이탈리안그레이하운드'] },
  { name: '휘핏', sprite: 'sighthound', color: 'fawn' },
  { name: '그레이하운드', sprite: 'sighthound', color: 'grey' },
  { name: '스피츠', sprite: 'samoyed', aliases: ['재패니즈 스피츠', '저먼 스피츠'] },
  { name: '폼피츠', sprite: 'pomeranian', color: 'white' },
  { name: '풍산개', sprite: 'jindo' },
  { name: '삽살개', sprite: 'mix', color: 'grey', aliases: ['삽살이'] },
  { name: '미니어처 핀셔', sprite: 'chihuahua', color: 'blacktan', aliases: ['미니핀'] },
  { name: '잭 러셀 테리어', sprite: 'mix', color: 'spot', aliases: ['잭러셀', '잭 러셀'] },
  { name: '코카 스파니엘', sprite: 'golden', aliases: ['코카', '아메리칸 코카 스파니엘', '잉글리시 코카 스파니엘'] },
  { name: '카바리에 킹 찰스 스파니엘', sprite: 'mix', color: 'spot', aliases: ['카발리에', '카바리에'] },
  { name: '퍼그', sprite: 'frenchie', color: 'fawn' },
  { name: '페키니즈', sprite: 'shihtzu', color: 'gold' },
  { name: '파피용', sprite: 'chihuahua', color: 'cream' },
  { name: '하바니즈', sprite: 'shihtzu' },
  { name: '꼬똥 드 툴레아', sprite: 'bichon', aliases: ['꼬똥', '코통'] },
  { name: '베들링턴 테리어', sprite: 'bichon', aliases: ['베들링턴'] },
  { name: '웨스트 하이랜드 화이트 테리어', sprite: 'schnauzer', color: 'white', aliases: ['웨스티', '웨스트하이랜드'] },
  { name: '말티푸', sprite: 'poodle', color: 'apricot' },
  { name: '말티숑', sprite: 'bichon' },
  { name: '골든두들', sprite: 'poodle', color: 'apricot', aliases: ['라브라두들'] },
  { name: '차우차우', sprite: 'pomeranian', color: 'red' },
  { name: '시베리안 허스키', sprite: 'jindo', color: 'grey', aliases: ['허스키'] },
  { name: '알래스칸 말라뮤트', sprite: 'jindo', color: 'grey', aliases: ['말라뮤트'] },
  { name: '아키타', sprite: 'shiba', aliases: ['아키타견'] },
  { name: '저먼 셰퍼드', sprite: 'jindo', color: 'brindle', aliases: ['셰퍼드', '세퍼드'] },
  { name: '셔틀랜드 쉽독', sprite: 'bordercollie', color: 'red', aliases: ['셸티', '쉘티'] },
  { name: '오스트레일리안 셰퍼드', sprite: 'bordercollie', color: 'blue', aliases: ['오쉐', '오스트레일리안'] },
  { name: '버니즈 마운틴 독', sprite: 'bordercollie', aliases: ['버니즈'] },
  { name: '그레이트 피레니즈', sprite: 'samoyed', aliases: ['피레니즈'] },
  { name: '보스턴 테리어', sprite: 'frenchie', color: 'pied' },
  { name: '불독', sprite: 'frenchie', color: 'cream', aliases: ['잉글리시 불독'] },
  { name: '도베르만', sprite: 'mix', color: 'black' },
  { name: '로트와일러', sprite: 'mix', color: 'black' },
  { name: '달마시안', sprite: 'mix', color: 'spot' },
  { name: '믹스', sprite: 'mix', aliases: ['믹스견', '시고르자브종', '시골개', '잡종', '모름'] },
];

// 털색 단어 → 색 id 후보 (긴 단어부터 검사)
const COLOR_WORDS: [string, string[]][] = [
  ['블랙탄', ['blacktan']], ['블탄', ['blacktan']], ['블랙실버', ['blacksilver']], ['솔트', ['saltpepper']], ['후추', ['saltpepper']],
  ['트라이', ['tri']], ['삼색', ['tri']], ['참깨', ['sesame']], ['브린들', ['brindle']], ['호랑', ['brindle']], ['호구', ['brindle']],
  ['파이드', ['pied', 'spot']], ['얼룩', ['spot', 'pied', 'tri']], ['점박', ['spot', 'pied']], ['바둑', ['spot', 'pied']], ['파티', ['spot', 'pied']],
  ['레몬', ['lemon']], ['블루', ['blue', 'grey']], ['멀', ['blue']], ['라이트', ['light', 'cream']],
  ['초코', ['chocolate', 'brown']], ['브라운', ['brown', 'chocolate', 'red']], ['갈색', ['brown', 'chocolate', 'red', 'fawn']],
  ['애프리콧', ['apricot', 'cream']], ['살구', ['apricot', 'cream']], ['베이지', ['cream', 'apricot', 'fawn', 'light']], ['아이보리', ['cream', 'white']], ['크림', ['cream', 'apricot', 'light']],
  ['오렌지', ['orange', 'red']], ['주황', ['orange', 'red']], ['골드', ['gold', 'yellow', 'apricot']], ['금색', ['gold', 'yellow']],
  ['레드', ['red', 'orange']], ['빨강', ['red']], ['적', ['red']],
  ['옐로', ['yellow', 'gold']], ['노랑', ['yellow', 'gold']], ['누렁', ['yellow']], ['황', ['yellow', 'fawn', 'gold']], ['폰', ['fawn', 'cream']],
  ['실버', ['grey', 'blacksilver', 'saltpepper']], ['그레이', ['grey', 'blue', 'saltpepper']], ['회색', ['grey', 'blue', 'saltpepper']], ['쥐색', ['grey']],
  ['블랙', ['black']], ['검정', ['black']], ['검은', ['black']], ['까만', ['black']], ['흑', ['black']],
  ['화이트', ['white']], ['흰', ['white']], ['하얀', ['white']], ['백', ['white']],
];

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/** 쓴 견종 이름 → 추천 목록 항목 (없으면 null) */
export function matchBreed(text: string): Suggest | null {
  const t = norm(text);
  if (!t) return null;
  for (const s of BREED_SUGGEST) if (norm(s.name) === t || (s.aliases ?? []).some((a) => norm(a) === t)) return s;
  for (const s of BREED_SUGGEST) if ([s.name, ...(s.aliases ?? [])].some((a) => t.includes(norm(a)) && norm(a).length >= 2)) return s;
  return null;
}

/** 쓴 털색 → 그림 털색 id. 못 찾으면 null */
export function matchColor(spriteBreed: string, text: string): string | null {
  const b = findBreed(spriteBreed);
  const t = norm(text);
  if (!t) return null;
  const exact = b.colors.find((c) => norm(c.name) === t);
  if (exact) return exact.id;
  for (const [w, ids] of COLOR_WORDS) {
    if (!t.includes(w)) continue;
    const hit = ids.find((id) => b.colors.some((c) => c.id === id));
    if (hit) return hit;
  }
  return null;
}

/** 쓴 글자(견종, 털색) → 표지 그림 파일 키 */
export function spriteFor(breedText: string, colorText: string): { breed: string; color: string } {
  const s = matchBreed(breedText);
  const sb = s ? s.sprite : 'mix';
  const c = matchColor(sb, colorText) ?? (s?.color && findBreed(sb).colors.some((x) => x.id === s.color) ? s.color : null);
  return normalize(sb, c);
}

/** 견종 이름을 고르면 털색 칸에 띄울 추천 */
export function colorSuggest(breedText: string): string[] {
  const s = matchBreed(breedText);
  const own = s ? findBreed(s.sprite).colors.filter((c) => c.id !== 'std').map((c) => c.name) : [];
  const common = ['흰색', '크림', '갈색', '검정', '회색', '황구', '얼룩', '블랙탄', '레드', '초코'];
  return [...new Set([...own, ...common])];
}

/** URL 값 → 화면에 보일 견종·털색 글자. 예전 링크(id 값)도 이름으로 바꿔 준다 */
export function fromParams(f: string, fc: string | null): { breed: string; color: string } {
  const old = BREED_LIST.find((b) => b.id === f);
  if (old) {
    const c = old.colors.find((x) => x.id === fc) ?? old.colors[0];
    return { breed: old.id === 'mix' ? '믹스' : old.name, color: c.id === 'std' ? '' : c.name };
  }
  if (!fc && (f.startsWith('mix-') || ['cream', 'brown', 'white', 'black', 'spot', 'grey'].includes(f))) {
    const id = f.replace(/^mix-/, '');
    const c = findBreed('mix').colors.find((x) => x.id === id);
    return { breed: '믹스', color: c?.name ?? '' };
  }
  return { breed: f.trim().slice(0, 24) || '믹스', color: (fc ?? '').trim().slice(0, 16) };
}
