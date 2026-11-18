import type { El, TenGod, TgGroup } from '../saju/constants';

export interface StemContent { image: string; words: string[]; outside: string; inside: string; work: string }
// 일간 10
export const STEM_TEXT: StemContent[] = [
  { image: '큰 나무', words: ['곧음', '앞장', '고집', '시작', '자존심', '책임감'], outside: '듬직함', inside: '생각 많음', work: '앞장서는데 아무도 안 따라오면 혼자 다 함' },
  { image: '덩굴 · 들꽃', words: ['유연함', '끈기', '눈치', '생활력', '섬세함', '버팀'], outside: '부드러움', inside: '계산 빠름', work: '분위기 읽고 빈자리부터 채움' },
  { image: '한낮의 해', words: ['밝음', '솔직함', '오지랖', '무대', '열정', '기분파'], outside: '분위기 메이커', inside: '쉽게 지침', work: '시작은 제일 빠른데 마무리가 남한테 감' },
  { image: '촛불 · 등불', words: ['섬세함', '집중', '온기', '예민함', '헌신', '속앓이'], outside: '다정함', inside: '불안', work: '한 가지에 꽂히면 밤을 새움' },
  { image: '큰 산', words: ['묵직함', '신뢰', '고집', '느림', '포용', '버팀'], outside: '어른스러움', inside: '외로움', work: '느리지만 맡으면 끝까지 감' },
  { image: '기름진 밭', words: ['살림', '실속', '배려', '걱정', '현실감', '알뜰함'], outside: '챙겨주는 사람', inside: '걱정 많음', work: '남 챙기다 내 일이 밀림' },
  { image: '바위 · 원석', words: ['결단', '의리', '직설', '원칙', '추진력', '단단함'], outside: '센 사람', inside: '여림', work: '원칙 어기는 사람과 꼭 한 번 부딪힘' },
  { image: '세공한 보석', words: ['기준', '깔끔함', '자존심', '예민함', '안목', '완벽주의'], outside: '세련됨', inside: '상처 잘 받음', work: '마감보다 완성도가 먼저' },
  { image: '큰 강 · 바다', words: ['스케일', '자유', '지혜', '변덕', '포용', '방랑'], outside: '여유로움', inside: '공허함', work: '판은 크게 벌리는데 정리는 귀찮음' },
  { image: '비 · 이슬', words: ['감수성', '직감', '배려', '걱정', '상상력', '스며듦'], outside: '조용함', inside: '생각 폭주', work: '눈치로 먼저 알아채고 조용히 처리함' },
];

export interface TgContent { tag: string; words: string[]; good: string; watch: string; people: string }
export const TG_TEXT: Record<TenGod, TgContent> = {
  bijeon: { tag: '나란히', words: ['독립', '내 페이스', '동료', '고집'], good: '혼자 결정하고 밀고 나가기', watch: '돈 새는 거, 고집 싸움', people: '친구·동료와 엮이는 해. 돈 거래는 피하기' },
  geopjae: { tag: '경쟁', words: ['승부', '지출', '동지', '충동'], good: '붙어 보는 거, 도전', watch: '돈 빌려주기, 충동구매', people: '경쟁자가 눈에 들어오는 해. 비교는 하루만' },
  siksin: { tag: '먹고 쉼', words: ['먹을 복', '여유', '취미', '루틴'], good: '루틴 만들기, 맛집', watch: '살, 늘어지는 거', people: '사람들과 먹고 쉬는 해. 약속이 늘어남' },
  sanggwan: { tag: '표현', words: ['말', '재능', '반발', '튀는 생각'], good: '만들고 보여주기', watch: '말실수, 윗사람이랑 부딪힘', people: '말이 앞서는 해. 윗사람 앞에선 한 박자 늦게' },
  pyeonjae: { tag: '큰 흐름', words: ['기회', '이동', '활동량', '사업'], good: '판 키우기', watch: '무리한 투자, 과로', people: '사람이 많이 오가는 해. 새 인연은 천천히' },
  jeongjae: { tag: '살림', words: ['월급', '저축', '꼼꼼함', '안정'], good: '돈 모으고 정리하기', watch: '쪼잔해짐, 돈 걱정', people: '가까운 사람과 돈 얘기가 나오는 해' },
  pyeongwan: { tag: '압박', words: ['책임', '돌파', '긴장', '사고 주의'], good: '버텨서 넘기기', watch: '과로, 다치는 거', people: '윗사람 압박이 세지는 해. 대답 전에 하루 묵히기' },
  jeonggwan: { tag: '질서', words: ['직장', '평판', '규칙', '자리'], good: '인정받기, 자리 잡기', watch: '눈치, 너무 빡빡해짐', people: '평판이 걸린 해. "해야 돼" 목록 줄이기' },
  pyeonin: { tag: '생각', words: ['직감', '공부', '고립', '예민'], good: '혼자 파고들기, 공부', watch: '불면, 의심병', people: '혼자 있고 싶은 해. 연락이 끊기지 않게' },
  jeongin: { tag: '돌봄', words: ['도움', '회복', '문서', '보호'], good: '배우고 채우기', watch: '기대기, 미루기', people: '기댈 사람이 생기는 해. 기대기 전에 내 몫 정하기' },
};

export const GROUP_THEME: Record<TgGroup, { ten: string; words: string[] }> = {
  self: { ten: '내 이름으로 서는 10년', words: ['독립', '주도권', '체력', '경쟁'] },
  output: { ten: '꺼내 놓는 10년', words: ['표현', '창작', '여유', '말'] },
  wealth: { ten: '벌고 움직이는 10년', words: ['돈', '이동', '현실', '결과'] },
  power: { ten: '책임이 커지는 10년', words: ['자리', '압박', '평판', '규칙'] },
  resource: { ten: '채우고 배우는 10년', words: ['공부', '회복', '도움', '생각'] },
};

export interface ElContent { lack: string[]; excess: string[] }
export const EL_TEXT: Record<El, ElContent> = {
  wood: { lack: ['시작이 어려움', '계획만 많음'], excess: ['조급함', '고집'] },
  fire: { lack: ['의욕 저하', '표현 부족'], excess: ['과열', '감정 기복'] },
  earth: { lack: ['루틴 없음', '붕 뜬 느낌'], excess: ['걱정', '버티기'] },
  metal: { lack: ['결정 어려움', '경계 흐림'], excess: ['날카로움', '완벽주의'] },
  water: { lack: ['쉬지 못함', '생각 정리 안 됨'], excess: ['걱정', '가라앉음'] },
};
