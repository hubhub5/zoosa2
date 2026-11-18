import { initCommon } from '../common';
import '../styles/form.css';
import { encodeInputs, decodeInputs, buildModel, SAMPLE_HASH, type Inputs } from '../report/model';
import { relLine, eventLine, esc } from '../report/render';
import { pillarHanja } from '../saju/constants';
import { correctionMinutes } from '../saju/calc';
import { BRANCHES, BRANCH_KO } from '../saju/constants';
import { lastReport } from '../unlock';
import { Lunar } from 'lunar-javascript';

initCommon();

// 첫 화면 오른쪽: 예시 사주의 되풀이된 해 (실제 계산 결과)
{
  const box = document.querySelector('[data-demo]');
  const sm = decodeInputs(SAMPLE_HASH);
  if (box && sm) {
    const m = buildModel(sm);
    document.querySelector('[data-demo-day]')!.textContent = `${pillarHanja(m.chart.day)} 일주`;
    box.innerHTML = m.repeats.past.slice(-3).map((r) => `<li><b>${r.year}</b><span class="mono">${esc(relLine(m, r))}</span><p>${esc(eventLine(m, r).replace(/^\d+년 /, ''))}</p></li>`).join('');
  }
}


const f = document.querySelector<HTMLFormElement>('.fm')!;
const bh = f.querySelector<HTMLSelectElement>('[name=bh]')!, bmin = f.querySelector<HTMLInputElement>('[name=bmin]')!;
for (let h = 0; h < 24; h++) bh.add(new Option(`${String(h).padStart(2, '0')}시`, String(h)));
const sishi = f.querySelector<HTMLElement>('[data-sishi]')!;
const pad = (n: number) => String(n).padStart(2, '0');
// 고른 시각이 무슨 시(時)인지, 경계 근처인지 바로 보여준다
const syncMin = () => {
  bmin.disabled = bh.value === '';
  sishi.classList.remove('edge');
  if (bh.value === '') { sishi.textContent = '몰라도 돼요. 시간 칸만 빼고 6글자로 봐요.'; return; }
  const h = +bh.value, mRaw = bmin.value.trim(), m = mRaw === '' ? 0 : Math.min(59, Math.max(0, +mRaw || 0));
  const y = +((f.querySelector('[name=by]') as HTMLInputElement).value) || 2000;
  const mo = +((f.querySelector('[name=bm]') as HTMLInputElement).value) || 1;
  const d = +((f.querySelector('[name=bd]') as HTMLInputElement).value) || 1;
  const corr = correctionMinutes(y, mo, d);
  const t = (((h * 60 + m - corr) % 1440) + 1440) % 1440;
  const b = Math.floor((t + 60) / 120) % 12;
  const start = (((b * 120 - 60 + corr) % 1440) + 1440) % 1440, end = (start + 119) % 1440;
  const fmt = (x: number) => `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
  const off = (t + 60) % 120;
  const edge = off < 10 || off >= 110;
  sishi.innerHTML = `${pad(h)}:${pad(m)} → <b>${BRANCH_KO[b]}시(${BRANCHES[b]}時)</b> · ${fmt(start)}~${fmt(end)} 출생이 다 같은 시예요.${edge ? ' 근데 딱 경계라 분이 중요해요. 출생증명서 시간으로 넣어 주세요.' : mRaw === '' ? ' 분은 몰라도 대부분 괜찮아요.' : ''}`;
  if (edge) sishi.classList.add('edge');
};
bmin.addEventListener('input', syncMin);
f.querySelectorAll('[name=by],[name=bm],[name=bd]').forEach((el) => el.addEventListener('input', syncMin));
bh.addEventListener('change', syncMin); syncMin();

// 이전 입력 복원
const prev = lastReport();
const old = prev ? decodeInputs(prev) : null;
if (old) fill(old);

function fill(i: Inputs) {
  const set = (n: string, v: string) => { const el = f.querySelector<HTMLInputElement>(`[name=${n}]`); if (el) el.value = v; };
  set('owner', i.owner); set('by', String(i.birth.y)); set('bm', String(i.birth.m)); set('bd', String(i.birth.d));
  bh.value = i.birth.hh === null ? '' : String(i.birth.hh); syncMin();
  bmin.value = i.birth.mm !== null && i.birth.hh !== null ? String(i.birth.mm) : ''; syncMin();
  const cal = i.birth.calendar === 'solar' ? 's' : i.birth.leap ? 'L' : 'l';
  f.querySelector<HTMLInputElement>(`[name=cal][value=${cal}]`)!.checked = true;
  f.querySelector<HTMLInputElement>(`[name=g][value=${i.birth.gender}]`)!.checked = true;
  (f.querySelector('[name=focus]') as HTMLSelectElement).value = i.focus;
}

const err = f.querySelector<HTMLParagraphElement>('.fm-err')!;
f.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(f);
  const n = (k: string) => Number(String(fd.get(k) ?? '').trim());
  const s = (k: string) => String(fd.get(k) ?? '').trim();
  const now = new Date();
  const fail = (msg: string, name: string) => { err.textContent = msg; f.querySelector<HTMLElement>(`[name=${name}]`)?.focus(); return false; };
  const by = n('by'), bm = n('bm'), bd = n('bd');
  const validDate = (y: number, m: number, d: number) => { const t = new Date(y, m - 1, d); return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d; };
  const cal = s('cal');
  if (!(by >= 1930 && by <= now.getFullYear())) return fail('태어난 연도 한 번만 확인해 주세요. (1930년 이후)', 'by');
  if (!(bm >= 1 && bm <= 12)) return fail('태어난 월이 이상해요.', 'bm');
  if (cal === 's' && !validDate(by, bm, bd)) return fail('태어난 날짜가 이상해요.', 'bd');
  if (cal !== 's') {
    if (!(bd >= 1 && bd <= 30)) return fail('음력 날짜가 이상해요.', 'bd');
    try { Lunar.fromYmd(by, cal === 'L' ? -bm : bm, bd).getSolar(); } catch { return fail(cal === 'L' ? '그해엔 그 달 윤달이 없어요.' : '음력 날짜가 이상해요.', 'bd'); }
  }
  if (s('bh') !== '' && s('bmin') !== '' && !/^\d{1,2}$/.test(s('bmin')) || n('bmin') > 59) return fail('분은 0부터 59까지 숫자로 넣어 주세요.', 'bmin');
  err.textContent = '';
  const inp: Inputs = {
    owner: s('owner'),
    birth: { y: by, m: bm, d: bd, hh: s('bh') === '' ? null : n('bh'), mm: s('bh') === '' ? null : Math.min(59, Math.max(0, n('bmin') || 0)), calendar: cal === 's' ? 'solar' : 'lunar', leap: cal === 'L', gender: s('g') === 'm' ? 'm' : 'f' },
    focus: (['work', 'love', 'family', 'money', 'self'].includes(s('focus')) ? s('focus') : '') as Inputs['focus'],
  };
  location.href = `./report.html#${encodeInputs(inp)}`;
  return true;
});
