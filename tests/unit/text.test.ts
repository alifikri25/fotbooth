import { expect, it } from 'vitest';
import { limitCaption, fitText } from '../../src/core/text';
it('limits graphemes without breaking combining characters or emoji families', () => {
  const value = 'e\u0301'.repeat(41);
  expect(limitCaption(value)).toBe('e\u0301'.repeat(40));
  expect(limitCaption('👨‍👩‍👧‍👦'.repeat(41))).toBe('👨‍👩‍👧‍👦'.repeat(40));
});
it('wraps into permitted lines using the actual font measure and refuses overflow', () => {
  expect(fitText('aku dan kamu', 80, 50, 20, 10, 2, (s, size) => (s.length * size) / 2)).toEqual({
    size: 20,
    lines: ['aku dan', 'kamu'],
  });
  expect(fitText('W'.repeat(40), 20, 50, 20, 10, 2, (s, size) => s.length * size)).toBeNull();
});
