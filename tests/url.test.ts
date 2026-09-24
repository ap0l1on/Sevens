import { describe, expect, it } from 'vitest';
import { defaultInput, defaultOffer, encodeState, parseState } from '../src/rules/url';
import type { Input } from '../src/rules/data';

describe('URL state', () => {
  it('round-trips Deniz scenario', () => {
    const input: Input = {
      subjects: [
        { name: 'Chemistry', level: 'HL', grade: 6, locked: false },
        { name: 'Mathematics: analysis and approaches', level: 'HL', grade: 6, locked: false },
        { name: 'Physics', level: 'HL', grade: 5, locked: false },
        { name: 'English A', level: 'SL', grade: 5, locked: false },
        { name: 'Turkish B', level: 'SL', grade: 5, locked: false },
        { name: 'History', level: 'SL', grade: 4, locked: false },
      ],
      tok: 'B',
      ee: 'C',
      cas: true,
    };
    const offer = { total: 36, hl: [] as never[], sl: [] as never[], subjectMins: [] };
    const qs = encodeState(input, offer);
    const parsed = parseState(`?${qs}`);
    expect(parsed.damaged).toBe(false);
    expect(parsed.input).toEqual(input);
    expect(parsed.offer.total).toBe(36);
  });

  it('empty query gives 6 empty rows 3HL 3SL', () => {
    const parsed = parseState('');
    expect(parsed.input.subjects.length).toBe(6);
    expect(parsed.input.subjects.filter((s) => s.level === 'HL').length).toBe(3);
    expect(parsed.input.cas).toBe(true);
  });

  it('hostile link opens clean page with damaged note, no throw', () => {
    const parsed = parseState('?s=<script>alert(1)</script>');
    expect(parsed.damaged).toBe(true);
    expect(parsed.input.subjects.length).toBe(6);
  });

  it('unknown keys ignored, bad values dropped, names trimmed to 40', () => {
    const long = 'x'.repeat(100);
    const parsed = parseState(`?unknown=1&tok=Z&ee=B&s=H6-${long}&ot=99`);
    expect(parsed.damaged).toBe(true);
    expect(parsed.input.subjects[0]!.name.length).toBeLessThanOrEqual(40);
    expect(parsed.offer.total).toBeNull();
  });

  it('caps URL at 1500 chars', () => {
    const input = defaultInput();
    input.subjects[0]!.name = 'x'.repeat(40);
    const offer = defaultOffer();
    const qs = encodeState(input, offer);
    expect(qs.length).toBeLessThanOrEqual(1500);
    const big = `?s=${'H7-abc.'.repeat(500)}`;
    const parsed = parseState(big);
    expect(parsed.damaged).toBe(true);
  });

  it('fuzz: 1000 random hostile query strings never throw', () => {
    const hostile = [
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      'x'.repeat(10000),
      '%00%01%02%1F%7F',
      '\u202e\u200b\u0000',
      '..;--',
      '%E0%A4%A8',
      'H9-foo',
      'ot=abc',
    ];
    let seed = 123456789;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 1000; i++) {
      const pick = hostile[Math.floor(rand() * hostile.length)]!;
      const q = `?s=${encodeURIComponent(pick)}&tok=${pick.slice(0, 3)}&ot=${pick.slice(0, 5)}&om=${pick.slice(0, 7)}&lk=${pick.slice(0, 5)}`;
      let parsed;
      expect(() => {
        parsed = parseState(q);
      }).not.toThrow();
      // Never produce invalid grade state: grades are 1-7 or null.
      for (const s of parsed!.input.subjects) {
        expect(s.grade === null || (s.grade >= 1 && s.grade <= 7)).toBe(true);
      }
    }
  });
});
