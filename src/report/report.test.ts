import '../content/overrides';
import { describe, it, expect } from 'vitest';
import { buildModel, encodeInputs, decodeInputs, type Inputs } from './model';
import { renderReport, eventLine } from './render';

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

function randomInput(): Inputs {
  const by = 1940 + Math.floor(rnd() * 82);
  const lunar = rnd() < 0.25;
  const hh = rnd() < 0.3 ? null : Math.floor(rnd() * 24);
  return {
    owner: pick(['', '한솔', '김', '민']),
    birth: { y: by, m: 1 + Math.floor(rnd() * 12), d: 1 + Math.floor(rnd() * 28), hh, mm: hh === null ? null : Math.floor(rnd() * 12) * 5, calendar: lunar ? 'lunar' : 'solar', leap: false, gender: rnd() < 0.5 ? 'f' : 'm' },
    focus: pick(['', 'work', 'love', 'family', 'money', 'self'] as const),
  };
}

describe('리포트 전체', () => {
  it('무작위 입력 300건이 오류 없이 그려진다', () => {
    const today = new Date(2026, 10, 12);
    for (let i = 0; i < 300; i++) {
      const inp = randomInput();
      const m = buildModel(inp, today);
      for (const unlocked of [false, true]) {
        const r = renderReport(m, unlocked);
        expect(r.body).not.toMatch(/undefined|NaN|\[object/);
        expect(r.head).not.toMatch(/undefined|NaN/);
      }
      expect(m.dist).toHaveLength(10);
      expect(m.cope).toHaveLength(6);
      expect(m.conflict).toHaveLength(6);
      expect(m.years).toHaveLength(10);
    }
  });
  it('되풀이된 해: 지나온 해만, 3년 넘게 떨어져서, 열 살 이후', () => {
    const today = new Date(2026, 10, 12);
    for (let i = 0; i < 200; i++) {
      const m = buildModel(randomInput(), today);
      const ys = m.repeats.past.map((r) => r.year);
      if (m.age >= 25) expect(ys.length).toBeGreaterThanOrEqual(3);
      ys.forEach((y, k) => {
        expect(y).toBeLessThan(2026);
        expect(y - m.chart.solar.y).toBeGreaterThanOrEqual(10);
        if (k) expect(y - ys[k - 1]).toBeGreaterThanOrEqual(3);
      });
      m.repeats.next.forEach((r) => expect(r.year).toBeGreaterThanOrEqual(2026));
      // 한 리포트 안에서 같은 장면 문장이 두 번 나오지 않는다
      const lines = [...m.repeats.past, ...m.repeats.next].map((r) => eventLine(m, r).replace(/^\d+년 \S+\. /, ''));
      expect(new Set(lines).size).toBe(lines.length);
    }
  });
  it('1위가 한쪽으로 몰리지 않는다 (버릇 · 대처 · 갈등, 각 3% 이상)', () => {
    const today = new Date(2026, 10, 12);
    const cnt: Record<string, Record<string, number>> = { dist: {}, cope: {}, conflict: {} };
    const N = 1500;
    for (let i = 0; i < N; i++) {
      const m = buildModel(randomInput(), today);
      for (const k of ['dist', 'cope', 'conflict'] as const) cnt[k][m[k][0].id] = (cnt[k][m[k][0].id] ?? 0) + 1;
    }
    expect(Object.keys(cnt.dist)).toHaveLength(10);
    expect(Object.keys(cnt.cope)).toHaveLength(6);
    expect(Object.keys(cnt.conflict)).toHaveLength(6);
    for (const k of ['dist', 'cope', 'conflict']) for (const v of Object.values(cnt[k])) expect(v / N).toBeGreaterThan(0.03);
  });
  it('URL 직렬화 왕복', () => {
    for (let i = 0; i < 50; i++) {
      const inp = randomInput();
      expect(decodeInputs(encodeInputs(inp))).toEqual(inp);
    }
  });
  it('같은 입력은 같은 결과', () => {
    const inp = randomInput();
    const d = new Date(2026, 10, 12);
    expect(renderReport(buildModel(inp, d), true).body).toBe(renderReport(buildModel(inp, d), true).body);
  });
});
