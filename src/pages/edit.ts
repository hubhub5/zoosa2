// 관리자용 문구 편집 페이지. 고친 문구는 src/content/overrides.json 으로 GitHub 에 커밋 → Actions 가 다시 배포
import { ROOTS, DEFAULTS, DRAFT_KEY, getAt, invalid, type Ov, type OvValue } from '../content/overrides';
import { RULES } from '../../scripts/tone-rules.mjs';
import { STEMS, STEM_KO, STEM_EL, EL_KO, EL_HANJA, TG_KO, GROUP_KO, EL_ORDER } from '../saju/constants';
import { lastReport } from '../unlock';
import { CONFIG } from '../config';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/app.css';
import '../styles/edit.css';

/* ---------- 어떤 칸을 어떤 이름으로 보여 줄지 */
const LABEL: Record<string, string> = {
  'VERDICT_META.label': '꼬리표',
  'VERDICT.me': '첫 줄 (…하는 내게,)', 'VERDICT.msg': '강아지가 해 주는 말 ("다"로 끝나게)',
  'STEM_TEXT.image': '이미지', 'STEM_TEXT.words': '한마디로 (단어)', 'STEM_TEXT.outside': '남들 눈엔', 'STEM_TEXT.inside': '실제론', 'STEM_TEXT.asOwner': '보호자 타입',
  'ADOPT.tag': '짧은 이름', 'ADOPT.title': '제목 ("그해 나는 ___였을 거예요")', 'ADOPT.checks': '체크리스트', 'ADOPT.quotes': '그때 이런 말 했을걸요', 'ADOPT.after': '뭐가 바뀌었냐면 (→ 꼭 넣기)',
  'ADOPT_DEEP.said': '남들한테 댄 이유', 'ADOPT_DEEP.real': '한 겹 아래',
  'EL_TEXT.lack': '모자라면', 'EL_TEXT.excess': '넘치면 (08장 내려놓을 거)', 'EL_TEXT.before': '오기 전 (한 단어)', 'EL_TEXT.after': '온 뒤 (한 단어)', 'EL_TEXT.act': '같이 하면 좋은 거', 'EL_TEXT.gives': '강아지가 준 거',
  'DIST.name': '이름', 'DIST.en': '영문 이름', 'DIST.def': '한 줄 정의', 'DIST.when': '이럴 때 발동', 'DIST.inner': '머릿속 자동재생 (첫 줄은 잠금 화면에도 나옴)',
  'DIST.scenes': '실제로는 이런 식', 'DIST.at': '어디서', 'DIST.line': '장면', 'DIST.costs': '그래서 생기는 일', 'DIST.dog': '강아지가 끊어주는 순간',
  'DIST.reframe': '바꿔 말하기', 'DIST.from': '원래 하던 말', 'DIST.to': '이렇게 바꿔 말하면',
  'DIST_DEEP.said': '겉으로 대는 이유', 'DIST_DEEP.real': '속을 뜯어보면', 'DIST_DEEP.fair': '억울할 수 있는데', 'DIST_DEEP.like': '비유하면', 'DIST_DEEP.test': '확인하는 법', 'DIST_DEEP.bar': '기준 낮추기',
  'GROUP_THEME.ten': '10년 제목', 'GROUP_THEME.words': '단어',
  'TG_TEXT.tag': '꼬리표', 'TG_TEXT.words': '단어', 'TG_TEXT.good': '잘 풀리는 거', 'TG_TEXT.watch': '조심할 거', 'TG_TEXT.dog': '강아지 한 줄',
};
const SKIP = new Set(['factors']);
const labelOf = (path: string) => { const k = path.split('.'); return LABEL[`${k[0]}.${k[k.length - 1]}`] ?? LABEL[`${k[0]}.${k[k.length - 2]}`] ?? k[k.length - 1]; };

interface Group { title: string; paths: string[] }
interface Section { id: string; title: string; where: string; groups: Group[] }
const keysOf = (root: string) => Object.keys(ROOTS[root]);
const SECTIONS: Section[] = [
  { id: 'cover', title: '표지 한 줄', where: '리포트 맨 위 "왜 하필 그때였을까" 칸, 인스타 카드. 1위 생각 버릇에 따라 세 줄 중 하나가 골라져요.', groups: [
    { title: '꼬리표', paths: ['VERDICT_META'] },
    ...keysOf('VERDICT').map((id) => ({ title: `${ROOTS.DIST[id].name} 1위일 때`, paths: [`VERDICT.${id}`] })),
    ...EL_ORDER.map((e) => ({ title: `셋째 줄 · 채워준 기운이 ${EL_KO[e]}일 때`, paths: [`VERDICT_EL.${e}`] })),
  ] },
  { id: 'stem', title: '01장 · 일간', where: '01장 "일간 / 한마디로 / 남들 눈엔 / 보호자 타입" 줄. 08장에도 보호자 타입이 나와요.', groups:
    STEMS.map((s, i) => ({ title: `${s} ${STEM_KO[i]}${EL_KO[STEM_EL[i]]}`, paths: [`STEM_TEXT.${i}`] })) },
  { id: 'adopt', title: '03장 · 입양 계기', where: '03장 (무료). 7가지 중 점수가 제일 높은 계기 하나가 나와요. "뭐가 바뀌었냐면"은 04·08장에도 쓰여요.', groups:
    keysOf('ADOPT').map((id) => ({ title: ROOTS.ADOPT[id].tag, paths: [`ADOPT.${id}`, `ADOPT_DEEP.${id}`] })) },
  { id: 'el', title: '04장 · 오행', where: '04장 "오고 나서 바뀐 것", 08장 "주고받는 것".', groups:
    EL_ORDER.map((e) => ({ title: `${EL_KO[e]} ${EL_HANJA[e]}`, paths: [`EL_TEXT.${e}`] })) },
  { id: 'dist', title: '05장 · 생각 버릇', where: '05장. 상위 3개는 카드 전체, 나머지 7개는 정의와 대사 한 줄만 나와요.', groups:
    keysOf('DIST').map((id) => ({ title: ROOTS.DIST[id].name, paths: [`DIST.${id}`, `DIST_DEEP.${id}`] })) },
  { id: 'luck', title: '06·07장 · 대운과 해마다 운', where: '06장 대운 카드, 07장 10년 표, 02장 대운 표의 "천간 십성".', groups: [
    ...keysOf('GROUP_THEME').map((g) => ({ title: `${GROUP_KO[g as keyof typeof GROUP_KO]} 대운`, paths: [`GROUP_THEME.${g}`] })),
    ...keysOf('TG_TEXT').map((t) => ({ title: TG_KO[t as keyof typeof TG_KO], paths: [`TG_TEXT.${t}`] })),
  ] },
];

/** 객체 아래 고칠 수 있는 칸(문자열 · 문자열 목록) 경로를 펼친다 */
function leaves(path: string): string[] {
  const v = getAt(DEFAULTS, path);
  if (typeof v === 'string') return [path];
  if (Array.isArray(v)) return v.every((x) => typeof x === 'string') ? [path] : v.flatMap((_, i) => leaves(`${path}.${i}`));
  if (v && typeof v === 'object') return Object.keys(v).filter((k) => !SKIP.has(k)).flatMap((k) => leaves(`${path}.${k}`));
  return [];
}

/* ---------- 상태 */
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const deployed = (p: string) => getAt(ROOTS, p) as OvValue;
const loadDraft = (): Ov => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}'); } catch { return {}; } };
const draft: Ov = loadDraft();
// 이미 배포된 값과 같아진 칸은 정리
for (const p of Object.keys(draft)) if (eq(draft[p], deployed(p)) || getAt(DEFAULTS, p) === undefined) delete draft[p];
const keepDraft = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* 저장 불가 */ } };
keepDraft();

const toText = (v: OvValue) => (Array.isArray(v) ? v.join('\n') : v);
const fromText = (p: string, t: string): OvValue => (Array.isArray(getAt(DEFAULTS, p)) ? t.split('\n').map((s) => s.trim()).filter(Boolean) : t.trim());
const toneHits = (v: OvValue) => [...new Set([v].flat().flatMap((s) => RULES.filter(([re]) => re.test(s)).map(([, l]) => l)))];
const problems = (p: string, v: OvValue) => [invalid(p, v), ...toneHits(v).map((l) => `문체 검사: ${l}`)].filter(Boolean);

/* ---------- 그리기 */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const list = document.querySelector<HTMLElement>('[data-list]')!;
const nav = document.querySelector<HTMLElement>('[data-nav]')!;

list.innerHTML = SECTIONS.map((s) => `
  <section class="ed-sec" id="ed-${s.id}">
    <header><h2>${esc(s.title)}</h2><p class="mono mute">${esc(s.where)}</p></header>
    ${s.groups.map((g) => `
      <div class="ed-g">
        <h3>${esc(g.title)}</h3>
        ${g.paths.flatMap(leaves).map((p) => {
          const isList = Array.isArray(getAt(DEFAULTS, p));
          const sub = /\.(\d+)\.[a-z]+$/i.exec(p);
          const lab = labelOf(p) + (sub ? ` ${+sub[1] + 1}` : '');
          return `<div class="ed-f" data-path="${p}">
            <label><span class="ed-l">${esc(lab)}${isList ? ' <i class="mono">한 줄에 하나</i>' : ''}</span>
            <textarea spellcheck="false" rows="${isList ? 4 : 2}"></textarea></label>
            <div class="ed-meta mono"><span class="ed-tag"></span><span class="ed-warn"></span><button type="button" class="ed-reset">기본 문구로</button></div>
          </div>`;
        }).join('')}
      </div>`).join('')}
  </section>`).join('');

nav.innerHTML = `<button type="button" class="ed-only mono" data-only>고친 칸만 보기</button>` +
  SECTIONS.map((s) => `<a href="#ed-${s.id}">${esc(s.title)}</a>`).join('');

const fields = [...list.querySelectorAll<HTMLElement>('.ed-f')];
const fit = (ta: HTMLTextAreaElement) => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight + 2}px`; };

function paint(f: HTMLElement) {
  const p = f.dataset.path!;
  const ta = f.querySelector('textarea')!;
  const v = fromText(p, ta.value);
  const isDraft = p in draft, custom = !eq(v, getAt(DEFAULTS, p)), live = !eq(deployed(p), getAt(DEFAULTS, p));
  f.classList.toggle('dirty', isDraft);
  f.classList.toggle('custom', custom);
  f.querySelector('.ed-tag')!.textContent = isDraft ? '고침 · 저장 전' : live ? '고친 문구 배포됨' : '';
  const pr = problems(p, v);
  f.classList.toggle('bad', pr.length > 0);
  f.querySelector('.ed-warn')!.textContent = pr.join(' · ');
  f.querySelector<HTMLButtonElement>('.ed-reset')!.hidden = !custom;
}
function counter() {
  const n = Object.keys(draft).length;
  document.querySelector('[data-count]')!.textContent = n ? `저장 전 ${n}칸` : '';
  document.querySelector('[data-only]')!.textContent = `고친 칸만 보기 (${n})`;
}

for (const f of fields) {
  const p = f.dataset.path!;
  const ta = f.querySelector('textarea')!;
  ta.value = toText(draft[p] ?? deployed(p));
  ta.addEventListener('input', () => {
    const v = fromText(p, ta.value);
    if (eq(v, deployed(p))) delete draft[p]; else draft[p] = v;
    keepDraft(); paint(f); counter(); fit(ta);
  });
  f.querySelector('.ed-reset')!.addEventListener('click', () => { ta.value = toText(getAt(DEFAULTS, p)); ta.dispatchEvent(new Event('input')); });
  paint(f);
}
requestAnimationFrame(() => fields.forEach((f) => fit(f.querySelector('textarea')!)));
counter();

/* ---------- 찾기 · 고친 칸만 */
const search = document.querySelector<HTMLInputElement>('.ed-search')!;
let onlyDirty = false;
function filter() {
  const q = search.value.trim().replace(/\s+/g, '');
  for (const f of fields) {
    const hay = (f.querySelector('textarea')!.value + f.querySelector('.ed-l')!.textContent + (f.closest('.ed-g')!.querySelector('h3')!.textContent ?? '')).replace(/\s+/g, '');
    f.hidden = (q !== '' && !hay.includes(q)) || (onlyDirty && !f.classList.contains('dirty'));
  }
  for (const g of list.querySelectorAll<HTMLElement>('.ed-g')) g.hidden = ![...g.querySelectorAll<HTMLElement>('.ed-f')].some((f) => !f.hidden);
  for (const s of list.querySelectorAll<HTMLElement>('.ed-sec')) s.hidden = ![...s.querySelectorAll<HTMLElement>('.ed-g')].some((g) => !g.hidden);
}
search.addEventListener('input', filter);
document.querySelector('[data-only]')!.addEventListener('click', (e) => {
  onlyDirty = !onlyDirty; (e.currentTarget as HTMLElement).classList.toggle('on', onlyDirty); filter();
});

/* ---------- 알림 */
const toastEl = document.querySelector<HTMLElement>('[data-toast]')!;
let toastT = 0;
function toast(html: string, keep = false) {
  toastEl.innerHTML = html; toastEl.classList.add('on');
  clearTimeout(toastT);
  if (!keep) toastT = window.setTimeout(() => toastEl.classList.remove('on'), 5000);
}

/* ---------- 미리보기 */
document.querySelector('[data-mine]')!.addEventListener('click', () => {
  const last = lastReport();
  if (!last) { toast('이 브라우저에서 만든 리포트가 없어요. 첫 화면에서 하나 만들고 오면 그걸로 보여 드려요.'); return; }
  window.open(`./report.html?draft#${last}`, '_blank', 'noopener');
});

/* ---------- 저장 (GitHub) */
const TOKEN_KEY = 'zoosa2.edit.token';
const API = `https://api.github.com/repos/${CONFIG.repo}`;
const FILE = 'src/content/overrides.json';
const getToken = () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } };
const dlg = document.querySelector<HTMLDialogElement>('[data-dlg]')!;
function askToken(): Promise<string | null> {
  return new Promise((res) => {
    const inp = dlg.querySelector<HTMLInputElement>('[name=token]')!;
    inp.value = '';
    dlg.showModal();
    dlg.addEventListener('close', () => {
      const t = inp.value.trim();
      if (dlg.returnValue !== 'ok' || !t) return res(null);
      try { sessionStorage.setItem(TOKEN_KEY, t); } catch { /* 무시 */ }
      res(t);
    }, { once: true });
  });
}
const b64enc = (s: string) => { const b = new TextEncoder().encode(s); let out = ''; for (let i = 0; i < b.length; i += 0x8000) out += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(out); };
const b64dec = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

async function gh(token: string, path: string, init: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, { ...init, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(init.headers ?? {}) } });
  return r;
}

const saveBtn = document.querySelector<HTMLButtonElement>('[data-save]')!;
saveBtn.addEventListener('click', async () => {
  const keys = Object.keys(draft);
  if (!keys.length) { toast('고친 칸이 없어요.'); return; }
  const bad = fields.find((f) => f.classList.contains('dirty') && f.classList.contains('bad'));
  if (bad) { bad.scrollIntoView({ block: 'center' }); toast('빨간 칸부터 고쳐 주세요. 그대로 올리면 배포가 멈춰요.'); return; }
  const token = getToken() ?? await askToken();
  if (!token) return;
  saveBtn.disabled = true;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      toast('GitHub에서 지금 저장된 문구를 받아 오는 중', true);
      const cur = await gh(token, `/contents/${FILE}?ref=main`);
      if (cur.status === 401 || cur.status === 403 || cur.status === 404) {
        try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* 무시 */ }
        toast('토큰이 안 맞아요. zoosa2 저장소에 Contents 읽기·쓰기 권한이 있는 토큰인지 확인하고 다시 눌러 주세요.'); return;
      }
      if (!cur.ok) throw new Error(`GitHub 응답 ${cur.status}`);
      const meta = await cur.json();
      const remote: Ov = JSON.parse(b64dec(meta.content) || '{}');
      for (const p of keys) { if (eq(draft[p], getAt(DEFAULTS, p))) delete remote[p]; else remote[p] = draft[p]; }
      const sorted = Object.fromEntries(Object.keys(remote).sort().map((k) => [k, remote[k]]));
      toast('저장하는 중', true);
      const put = await gh(token, `/contents/${FILE}`, { method: 'PUT', body: JSON.stringify({ message: `문구 수정 (편집 페이지): ${keys.length}칸`, content: b64enc(JSON.stringify(sorted, null, 2) + '\n'), sha: meta.sha, branch: 'main' }) });
      if (put.status === 409 || put.status === 422) continue; // 그사이 파일이 바뀜 → 한 번 더
      if (!put.ok) throw new Error(`GitHub 응답 ${put.status}`);
      const sha: string = (await put.json()).commit.sha;
      await watch(token, sha, keys.length);
      return;
    }
    toast('저장이 겹쳤어요. 잠깐 뒤에 다시 눌러 주세요.');
  } catch (e) {
    toast(`저장 실패: ${(e as Error).message}. 고친 내용은 이 브라우저에 남아 있어요.`);
  } finally { saveBtn.disabled = false; }
});

/** 배포 진행 상황 */
async function watch(token: string, sha: string, n: number) {
  const actions = `https://github.com/${CONFIG.repo}/actions`;
  for (let i = 0; i < 40; i++) {
    const r = await gh(token, `/actions/runs?head_sha=${sha}&per_page=1`);
    if (!r.ok) { toast(`${n}칸 저장됨. 1~2분 뒤 사이트에 반영돼요.`); return; }
    const run = (await r.json()).workflow_runs?.[0];
    if (run?.status === 'completed') {
      if (run.conclusion === 'success') toast(`${n}칸 저장하고 배포까지 끝났어요. 사이트에 반영되기까지 몇 분 걸릴 수 있어요.`, true);
      else toast(`저장은 됐는데 배포가 멈췄어요. <a class="wl" href="${actions}" target="_blank" rel="noopener">GitHub Actions</a>에서 이유를 볼 수 있어요. 사이트는 이전 문구 그대로예요.`, true);
      return;
    }
    toast(`${n}칸 저장됨 · ${run ? (run.status === 'queued' ? '배포 대기 중' : '배포 중') : '배포 준비 중'} (1~2분)`, true);
    await new Promise((res) => setTimeout(res, 6000));
  }
  toast(`${n}칸 저장됨. 배포가 오래 걸리고 있어요. <a class="wl" href="${actions}" target="_blank" rel="noopener">GitHub Actions</a>에서 확인해 주세요.`, true);
}
