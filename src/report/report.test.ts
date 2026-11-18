import '../content/overrides';
import { describe, it, expect } from 'vitest';
import { buildModel, encodeInputs, decodeInputs, type Inputs } from './model';
import { renderReport } from './render';

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

function randomInput(): Inputs {
  const by = 1940 + Math.floor(rnd() * 70);
  const ay = Math.min(2026, by + Math.floor(rnd() * 50));
  const lunar = rnd() < 0.25;
  const hh = rnd() < 0.3 ? null : Math.floor(rnd() * 24);
  return {
    owner: pick(['', '한솔', '김', '민']),
    birth: { y: by, m: 1 + Math.floor(rnd() * 12), d: 1 + Math.floor(rnd() * 28), hh, mm: hh === null ? null : Math.floor(rnd() * 12) * 5, calendar: lunar ? 'lunar' : 'solar', leap: false, gender: rnd() < 0.5 ? 'f' : 'm' },
    dog: pick(['율이', '콩', '보리', 'Max']),
    breed: pick(['푸들', '이탈리안 그레이하운드', '믹스', '우리집 똥강아지', '말티즈']),
    color: pick(['', '검정', '회색', '크림', '알록달록']),
    adopt: { y: ay, m: 1 + Math.floor(rnd() * (ay === 2026 ? 10 : 12)), d: rnd() < 0.3 ? null : 1 + Math.floor(rnd() * 28) },
    route: pick(['', 'shop', 'shelter', 'rescue', 'family', 'etc'] as const),
    sick: rnd() < 0.2,
    ...(rnd() < 0.4 ? { dateKind: 'birth' as const, dogBirthYear: ay } : { dateKind: 'meet' as const, dogBirthYear: null }),
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
      expect(m.years).toHaveLength(10);
    }
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
