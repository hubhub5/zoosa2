import { CONFIG } from './config';
import { decodeInputs } from './report/model';

const KEY = 'zoosa2.unlock';
const LAST = 'zoosa2.last';

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
};

/** 공백·하이픈 유무와 대소문자를 무시한다. ABCDE1234, abcde 1234 → ABCDE-1234 */
export function normCode(code: string): string {
  const t = code.trim().toUpperCase().replace(/[\s\-‐-―−_.]+/g, '');
  const m = /^([A-Z]{5})(\d{4})$/.exec(t);
  return m ? `${m[1]}-${m[2]}` : code.trim().toUpperCase().replace(/\s+/g, '');
}

export async function hashCode(code: string): Promise<string> {
  const norm = normCode(code);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('zoosa2:' + norm));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 'ok' | 'wrong' | 'nostore'(코드는 맞는데 브라우저가 저장을 막음) */
export async function tryUnlock(code: string): Promise<'ok' | 'wrong' | 'nostore'> {
  const h = await hashCode(code);
  if (!CONFIG.unlockHashes.includes(h)) return 'wrong';
  store.set(KEY, h);
  return store.get(KEY) === h ? 'ok' : 'nostore';
}

export const isUnlocked = () => {
  const h = store.get(KEY);
  return !!h && CONFIG.unlockHashes.includes(h);
};

export const rememberReport = (hash: string) => store.set(LAST, hash);
export const lastReport = () => store.get(LAST);

/* ---------- 자동 결제 확인 (그로블 웹훅 + ref) ---------- */
// 리포트마다 랜덤 참조값을 만들어 결제 링크에 붙이고, 결제되면 그 리포트만 연다.
// 리포트는 링크 문자열이 아니라 입력값으로 구분한다 (순서·열쇠 파라미터가 달라도 같은 리포트)

const REFS = 'zoosa2.refs';       // { [리포트 키]: 참조값 }
const PAID = 'zoosa2.paid';       // [결제된 리포트 키]
const PENDING = 'zoosa2.pending'; // 결제하러 간 리포트의 주소 해시
const readJ = <T>(k: string, d: T): T => { try { return JSON.parse(store.get(k) ?? '') as T; } catch { return d; } };

export const autoPay = () => !!(CONFIG.groblePayUrl && CONFIG.paidApi);

/** 주소 해시에서 열쇠(k=)를 뺀 것 */
export function stripKey(hash: string): string {
  const q = new URLSearchParams(hash.replace(/^#/, ''));
  q.delete('k');
  return q.toString();
}
/** 주소 해시에 들어 있는 열쇠 */
export const keyIn = (hash: string) => new URLSearchParams(hash.replace(/^#/, '')).get('k') ?? '';

/** 같은 입력이면 같은 키 */
export function reportKey(hash: string): string {
  const inp = decodeInputs(stripKey(hash));
  return inp ? JSON.stringify(inp) : stripKey(hash);
}
async function rid(hash: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('zoosa2-rid:' + reportKey(hash)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const getRef = (hash: string) => readJ<Record<string, string>>(REFS, {})[reportKey(hash)] ?? '';
function setRef(hash: string, ref: string) {
  const refs = readJ<Record<string, string>>(REFS, {});
  refs[reportKey(hash)] = ref;
  store.set(REFS, JSON.stringify(refs));
}
export function refFor(hash: string): string {
  let ref = getRef(hash);
  if (!ref) {
    const b = crypto.getRandomValues(new Uint8Array(18));
    ref = 'zs_' + btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    setRef(hash, ref);
  }
  return ref;
}
/** 열쇠 링크로 들어온 경우: 이 리포트의 참조값으로 저장 */
export function importKey(hash: string, ref: string) { if (/^zs_[A-Za-z0-9_-]{16,64}$/.test(ref)) setRef(hash, ref); }

/** 결제 버튼 주소. 자동 확인이 꺼져 있으면 상품 페이지 */
export function buyUrl(hash: string): string {
  if (!autoPay()) return CONFIG.grobleUrl;
  const u = new URL(CONFIG.groblePayUrl);
  u.searchParams.set('ref', refFor(hash));
  return u.toString();
}

export const markPending = (hash: string) => store.set(PENDING, stripKey(hash));
export const pendingReport = () => store.get(PENDING);
export const hasRef = (hash: string) => !!getRef(hash);
export const isPaidReport = (hash: string) => readJ<string[]>(PAID, []).includes(reportKey(hash));

function setPaid(hash: string, on: boolean) {
  const k = reportKey(hash);
  const list = readJ<string[]>(PAID, []).filter((x) => x !== k);
  if (on) list.push(k);
  store.set(PAID, JSON.stringify(list));
}

/** 다른 기기에서도 열리는 내 결과 링크 (열쇠 포함) */
export function keyLink(hash: string): string {
  const ref = getRef(hash);
  const base = location.href.split('#')[0];
  return `${base}#${stripKey(hash)}${ref ? `&k=${ref}` : ''}`;
}

const api = (path: string, body: unknown) => fetch(`${CONFIG.paidApi.replace(/\/$/, '')}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  .then((r) => r.json() as Promise<{ ok: boolean; ref?: string; error?: string }>);

/** 서버에 결제됐는지 물어본다. 'ok' | 'no' | 'nostore' | 'error'. 'no'면 (환불 등) 열린 표시도 지운다 */
export async function checkPaid(hash: string): Promise<'ok' | 'no' | 'nostore' | 'error'> {
  if (!autoPay() || !hasRef(hash)) return 'no';
  let j;
  try { j = await api('/check', { ref: getRef(hash), rid: await rid(hash) }); } catch { return 'error'; }
  if (!j.ok) { if (isPaidReport(hash)) setPaid(hash, false); return 'no'; }
  setPaid(hash, true);
  return isPaidReport(hash) ? 'ok' : 'nostore';
}

/** 결제한 휴대폰 번호나 메일로 이 리포트의 결제를 찾는다 */
export async function findPaid(hash: string, id: string): Promise<'ok' | 'notfound' | 'other' | 'format' | 'many' | 'nostore' | 'error'> {
  let j;
  try { j = await api('/find', { id, rid: await rid(hash) }); } catch { return 'error'; }
  if (!j.ok || !j.ref) return (j.error as 'notfound' | 'other' | 'format' | 'many') ?? 'notfound';
  setRef(hash, j.ref);
  setPaid(hash, true);
  return isPaidReport(hash) ? 'ok' : 'nostore';
}
