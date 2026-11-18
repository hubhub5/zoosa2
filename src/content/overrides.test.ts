import { describe, it, expect } from 'vitest';
import { applyOv, invalid, getAt, ROOTS, DEFAULTS } from './overrides';
import { DIST } from './distortions';
import { ADOPT } from './adoption';

describe('문구 덮어쓰기', () => {
  it('문장과 목록을 바꾼다', () => {
    applyOv({ 'DIST.filter.def': '새 정의', 'DIST.filter.inner': ['하나', '둘'], 'DIST.filter.scenes.0.line': '새 장면' });
    expect(DIST.filter.def).toBe('새 정의');
    expect(DIST.filter.inner).toEqual(['하나', '둘']);
    expect(DIST.filter.scenes[0].line).toBe('새 장면');
  });
  it('리포트를 깨는 값은 무시한다', () => {
    const before = ADOPT.move.after;
    applyOv({ 'ADOPT.move.after': '화살표 없음', 'DIST.label.inner': ['한 줄뿐'], 'DIST.label.def': '  ', 'DIST.nope.def': 'x', 'DIST.label.factors.0.k': 'x' });
    expect(ADOPT.move.after).toBe(before);
    expect(DIST.label.inner.length).toBeGreaterThanOrEqual(2);
    expect(DIST.label.def.trim()).not.toBe('');
  });
  it('검사 규칙', () => {
    expect(invalid('ADOPT.move.after', 'a → b')).toBe('');
    expect(invalid('DIST.label.inner', ['한 줄뿐'])).not.toBe('');
    expect(invalid('DIST.label.factors', ['x'])).not.toBe('');
    expect(getAt(DEFAULTS, 'DIST.filter.def')).not.toBe(getAt(ROOTS, 'DIST.filter.def'));
  });
});
