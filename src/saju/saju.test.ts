import { describe, it, expect } from 'vitest';
import { computeChart, datePillars, yearPillar, correctionMinutes, monthOfBranch } from './calc';
import { pillarHanja, tenGod } from './constants';
import { analyze } from './analysis';

const ch = (y: number, m: number, d: number, hh: number | null, gender: 'f' | 'm' = 'f', mm = 0) =>
  computeChart({ y, m, d, hh, mm: hh === null ? null : mm, calendar: 'solar', gender });

describe('만세력', () => {
  it('2000-01-01 정오 = 己卯년 丙子월 戊午일', () => {
    const c = ch(2000, 1, 1, 12);
    expect(pillarHanja(c.year)).toBe('己卯');
    expect(pillarHanja(c.month)).toBe('丙子');
    expect(pillarHanja(c.day)).toBe('戊午');
  });
  it('1949-10-01 = 甲子일', () => {
    expect(pillarHanja(datePillars(1949, 10, 1).day)).toBe('甲子');
  });
  it('입춘 전후로 연주가 바뀐다', () => {
    expect(pillarHanja(datePillars(2024, 2, 3).year)).toBe('癸卯');
    expect(pillarHanja(datePillars(2024, 2, 5).year)).toBe('甲辰');
  });
  it('세운 계산', () => {
    expect(pillarHanja(yearPillar(1984))).toBe('甲子');
    expect(pillarHanja(yearPillar(2026))).toBe('丙午');
  });
  it('시간 모름이면 시주 없음', () => {
    expect(ch(1994, 3, 15, null).hour).toBeNull();
  });
  it('경도 보정 30분, 1954~61 표준시 구간은 0, 서머타임은 +60', () => {
    expect(correctionMinutes(1994, 3, 15)).toBe(30);
    expect(correctionMinutes(1958, 1, 1)).toBe(0);
    expect(correctionMinutes(1987, 7, 1)).toBe(90);
    expect(correctionMinutes(1958, 6, 1)).toBe(60);
  });
  it('보정으로 23시대가 되면 다음 날 일주(조자시 규칙)', () => {
    const a = ch(1994, 3, 15, 0, 'f', 10); // 보정 후 3/14 23:40
    const b = ch(1994, 3, 15, 3);
    expect(pillarHanja(a.day)).toBe(pillarHanja(b.day));
    expect(a.hour!.b).toBe(0);
  });
  it('대운 순역: 甲년 여자는 역행', () => {
    const c = ch(1994, 3, 15, 14, 'f', 30);
    expect(c.daeunForward).toBe(false);
    expect(pillarHanja(c.daeun[0].pillar)).toBe('丙寅');
    const m = ch(1994, 3, 15, 14, 'm', 30);
    expect(m.daeunForward).toBe(true);
    expect(pillarHanja(m.daeun[0].pillar)).toBe('戊辰');
  });
  it('월지 → 양력 월', () => {
    expect(monthOfBranch(2)).toBe(2);
    expect(monthOfBranch(0)).toBe(12);
    expect(monthOfBranch(1)).toBe(1);
  });
});

describe('십성', () => {
  it('庚 일간 기준', () => {
    expect(tenGod(6, 0)).toBe('pyeonjae'); // 甲
    expect(tenGod(6, 3)).toBe('jeonggwan'); // 丁
    expect(tenGod(6, 9)).toBe('sanggwan'); // 癸
    expect(tenGod(6, 4)).toBe('pyeonin'); // 戊
    expect(tenGod(6, 7)).toBe('geopjae'); // 辛
  });
  it('분석 합계', () => {
    const a = analyze(ch(1994, 3, 15, 14, 'f', 30));
    const sum = Object.values(a.elWeight).reduce((x, y) => x + y, 0);
    expect(Math.round(sum)).toBe(100);
    expect(a.strength).toBeGreaterThanOrEqual(0);
  });
});
