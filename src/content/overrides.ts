// 관리자 편집 페이지에서 고친 문구를 기본 문구 위에 덮어쓴다.
// overrides.json: { "DIST.allOrNothing.def": "새 문장", "DIST.allOrNothing.inner": ["줄1", "줄2"] }
// 이 모듈을 import 하는 순간 적용된다 (report.ts 에서 렌더링 전에 import).
import { DIST } from './distortions';
import { DIST_DEEP, ADOPT_DEEP } from './deep';
import { ADOPT } from './adoption';
import { VERDICT, VERDICT_EL, VERDICT_META } from './verdict';
import { STEM_TEXT, TG_TEXT, GROUP_THEME, EL_TEXT } from './saju';
import saved from './overrides.json';

export type OvValue = string | string[];
export type Ov = Record<string, OvValue>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const ROOTS: Record<string, any> = { VERDICT_META, VERDICT, VERDICT_EL, STEM_TEXT, ADOPT, ADOPT_DEEP, EL_TEXT, DIST, DIST_DEEP, GROUP_THEME, TG_TEXT };
/** 코드에 적힌 원래 문구 (덮어쓰기 전) */
export const DEFAULTS: Record<string, any> = JSON.parse(JSON.stringify(ROOTS));
/** 배포된 overrides.json */
export const SAVED: Ov = saved as Ov;
/** 편집 중인(아직 저장 안 한) 문구. 미리보기(?draft)에서만 쓴다 */
export const DRAFT_KEY = 'zoosa2.edit.draft';

export function getAt(root: Record<string, any>, path: string): any {
  let cur: any = root;
  for (const k of path.split('.')) { if (cur == null) return undefined; cur = cur[k]; }
  return cur;
}

/** 문자열 목록의 최소 줄 수. 렌더링에서 [0], [1]을 바로 쓰는 곳이 있어서 */
export const minLines = (path: string) => Math.min(2, (getAt(DEFAULTS, path) as string[] | undefined)?.length ?? 1);

/** 이 값을 넣어도 리포트가 안 깨지는지. 문제 있으면 이유, 없으면 '' */
export function invalid(path: string, v: unknown): string {
  const def = getAt(DEFAULTS, path);
  if (typeof def === 'string') {
    if (typeof v !== 'string') return '글자여야 해요';
    if (!v.trim()) return '비워 둘 수 없어요';
    if (/^ADOPT\.[^.]+\.after$/.test(path) && v.split('→').length !== 2) return '"→"가 딱 한 번 들어가야 해요 (앞: 오기 전, 뒤: 온 뒤)';
    return '';
  }
  if (Array.isArray(def) && def.every((x) => typeof x === 'string')) {
    if (!Array.isArray(v) || !v.every((x) => typeof x === 'string' && x.trim())) return '한 줄에 하나씩 써 주세요';
    if (v.length < minLines(path)) return `최소 ${minLines(path)}줄은 있어야 해요`;
    return '';
  }
  return '고칠 수 없는 칸이에요';
}

function setAt(path: string, v: OvValue) {
  if (invalid(path, v)) return; // 잘못된 값이나 없어진 칸은 무시하고 기본 문구를 쓴다
  const keys = path.split('.');
  const parent = getAt(ROOTS, keys.slice(0, -1).join('.'));
  parent[keys[keys.length - 1]] = Array.isArray(v) ? [...v] : v;
}

export function applyOv(ov: Ov) { for (const [p, v] of Object.entries(ov)) setAt(p, v); }

applyOv(SAVED);
if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('draft')) {
  try { applyOv(JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}')); } catch { /* 무시 */ }
}
