import { Solar, Lunar } from 'lunar-javascript';
import { type Pillar, pillarFromHanja, pillarFromCycle } from './constants';

export interface BirthInput {
  y: number; m: number; d: number;
  /** 시각을 모르면 null */
  hh: number | null; mm: number | null;
  calendar: 'solar' | 'lunar';
  leap?: boolean;
  gender: 'f' | 'm';
}

export interface Daeun {
  idx: number;           // 1부터
  pillar: Pillar;
  startYear: number;
  endYear: number;       // 포함
  startAge: number;      // 만 나이 기준 대략값
}

export interface Chart {
  solar: { y: number; m: number; d: number };
  corrected: { y: number; m: number; d: number; hh: number; mm: number } | null;
  correctionMin: number;
  year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null;
  daeunStartAge: number;      // 대운수
  daeunForward: boolean;
  daeun: Daeun[];
}

// 한국 서머타임 (시작일 00시 ~ 종료일 00시, 현지 시각 기준)
const DST: [string, string][] = [
  ['1948-06-01', '1948-09-13'], ['1949-04-03', '1949-09-11'], ['1950-04-01', '1950-09-10'],
  ['1951-05-06', '1951-09-09'], ['1955-05-05', '1955-09-09'], ['1956-05-20', '1956-09-30'],
  ['1957-05-05', '1957-09-22'], ['1958-05-04', '1958-09-21'], ['1959-05-03', '1959-09-20'],
  ['1960-05-01', '1960-09-18'], ['1987-05-10', '1987-10-11'], ['1988-05-08', '1988-10-09'],
];
const ymdKey = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** 서울 경도(127°) 기준 진태양시 보정량(분). 시계를 이만큼 뒤로 돌린다. */
export function correctionMinutes(y: number, m: number, d: number): number {
  const k = ymdKey(y, m, d);
  // 1954.03.21 ~ 1961.08.09 표준시가 UTC+8:30
  let base = k >= '1954-03-21' && k < '1961-08-10' ? 0 : 30;
  if (DST.some(([a, b]) => k >= a && k < b)) base += 60;
  return base;
}

export function toSolar(inp: BirthInput) {
  if (inp.calendar === 'solar') return { y: inp.y, m: inp.m, d: inp.d };
  const s = Lunar.fromYmd(inp.y, inp.leap ? -inp.m : inp.m, inp.d).getSolar();
  return { y: s.getYear(), m: s.getMonth(), d: s.getDay() };
}

export function computeChart(inp: BirthInput): Chart {
  const sol = toSolar(inp);
  const known = inp.hh !== null;
  let corr = 0;
  let cy = sol.y, cm = sol.m, cd = sol.d, ch = 12, cmi = 0;
  if (known) {
    corr = correctionMinutes(sol.y, sol.m, sol.d);
    const t = new Date(Date.UTC(sol.y, sol.m - 1, sol.d, inp.hh!, inp.mm ?? 0) - corr * 60000);
    cy = t.getUTCFullYear(); cm = t.getUTCMonth() + 1; cd = t.getUTCDate(); ch = t.getUTCHours(); cmi = t.getUTCMinutes();
  }
  const solar = Solar.fromYmdHms(cy, cm, cd, ch, cmi, 0);
  const ec = solar.getLunar().getEightChar();
  ec.setSect(1);
  const yun = ec.getYun(inp.gender === 'm' ? 1 : 0, 2);
  const list = yun.getDaYun(11).slice(1);
  const daeun: Daeun[] = list.map((dy: any, i: number) => ({
    idx: i + 1,
    pillar: pillarFromHanja(dy.getGanZhi()),
    startYear: dy.getStartYear(),
    endYear: dy.getEndYear(),
    startAge: dy.getStartYear() - sol.y,
  }));
  const year = pillarFromHanja(ec.getYear());
  // 대운 방향: 양남음녀 순행
  const yangYear = year.s % 2 === 0;
  return {
    solar: sol,
    corrected: known ? { y: cy, m: cm, d: cd, hh: ch, mm: cmi } : null,
    correctionMin: corr,
    year,
    month: pillarFromHanja(ec.getMonth()),
    day: pillarFromHanja(ec.getDay()),
    hour: known ? pillarFromHanja(ec.getTime()) : null,
    daeunStartAge: daeun.length ? daeun[0].startAge : 0,
    daeunForward: (inp.gender === 'm') === yangYear,
    daeun,
  };
}

/** 세운 (입춘 기준 연도의 간지) */
export const yearPillar = (y: number): Pillar => pillarFromCycle(y - 4);

export interface DatePillars { year: Pillar; month: Pillar; day: Pillar }
export function datePillars(y: number, m: number, d: number): DatePillars {
  const l = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar();
  return {
    year: pillarFromHanja(l.getYearInGanZhiByLiChun()),
    month: pillarFromHanja(l.getMonthInGanZhiExact()),
    day: pillarFromHanja(l.getDayInGanZhiExact()),
  };
}

/** 해당 연도에 지지 b가 월지로 들어오는 양력 월 (절기 기준 대략) */
export const monthOfBranch = (b: number) => { const m = ((b + 10) % 12) + 2; return m > 12 ? m - 12 : m; }; // 寅→2월, 子→12월, 丑→1월

export function daeunAt(chart: Chart, year: number): Daeun | null {
  return chart.daeun.find((d) => year >= d.startYear && year <= d.endYear) ?? null;
}
