import { describe, expect, it } from 'vitest';
import { BOUNDARY_OVERRIDES, DEFAULT_BOUNDARIES } from '../src/data/boundaries';
import { getSubjectEntry, SUBJECT_ENTRIES } from '../src/data/components';
import { isSlOnlySubject } from '../src/rules/data';
import {
  baseFromSlug,
  diplomaLinkFor,
  effectiveBounds,
  encodeSubjectHash,
  findSlotForBase,
  gradeForTotal,
  parseSubjectHash,
  slugifyBase,
  validateSubjectMarks,
  weightedTotal,
} from '../src/data/subjectGrade';

describe('component tables', () => {
  it('weights add up to 100 for every subject and level', () => {
    expect(SUBJECT_ENTRIES.length).toBeGreaterThan(20);
    for (const entry of SUBJECT_ENTRIES) {
      const total = entry.components.reduce((a, c) => a + c.weight, 0);
      expect(total, `${entry.subject} ${entry.level}`).toBe(100);
    }
  });

  it('every max is > 0 and every subject has a name', () => {
    for (const entry of SUBJECT_ENTRIES) {
      expect(entry.subject.length).toBeGreaterThan(0);
      expect(entry.level === 'HL' || entry.level === 'SL').toBe(true);
      expect(entry.components.length).toBeGreaterThan(0);
      for (const c of entry.components) {
        expect(c.name.length).toBeGreaterThan(0);
        if (c.max !== null) expect(c.max).toBeGreaterThan(0);
      }
    }
  });

  it('marks unverified rows so founders can check them', () => {
    const unverified = SUBJECT_ENTRIES.filter((e) =>
      e.components.some((c) => c.status === 'unverified'),
    ).map((e) => `${e.subject} ${e.level}`);
    expect(unverified).toEqual(['Chemistry SL']);
    const confirmed = SUBJECT_ENTRIES.filter((e) =>
      e.components.every((c) => c.status === 'confirmed'),
    );
    expect(confirmed.length).toBeGreaterThan(0);
  });

  it('locks Turkey in the 20th Century to SL', () => {
    expect(isSlOnlySubject('Turkey in the 20th Century')).toBe(true);
  });

  it('looks rows up by subject and level', () => {
    expect(getSubjectEntry('Chemistry', 'SL')?.components.map((c) => c.weight)).toEqual([
      19, 17, 44, 20,
    ]);
    expect(getSubjectEntry('Chemistry', 'SL')?.components.map((c) => c.max)).toEqual([
      30, 25, 50, 24,
    ]);
    expect(getSubjectEntry('Chemistry', 'SL')?.components.map((c) => c.status)).toEqual([
      'one-source',
      'one-source',
      'unverified',
      'confirmed',
    ]);
    expect(
      getSubjectEntry('Turkey in the 20th Century', 'SL')?.components.map((c) => c.weight),
    ).toEqual([30, 45, 25]);
    expect(getSubjectEntry('Turkey in the 20th Century', 'HL')).toBeNull();
    expect(getSubjectEntry('Film', 'SL')).toBeNull();
    expect(getSubjectEntry(null, 'SL')).toBeNull();
    expect(getSubjectEntry('', 'HL')).toBeNull();
  });
});

describe('default boundaries', () => {
  it('is the generic estimate 7>=72 .. 2>=15', () => {
    expect(DEFAULT_BOUNDARIES).toEqual([15, 27, 38, 49, 60, 72]);
    expect(BOUNDARY_OVERRIDES).toEqual({});
    expect(effectiveBounds(null)).toEqual(DEFAULT_BOUNDARIES);
    expect(effectiveBounds([10, 20, 30, 40, 50, 60])).toEqual([10, 20, 30, 40, 50, 60]);
  });
});

describe('written-marks calculation', () => {
  it('Biology HL 30/40, 25/35, 60/80, 18/24 gives 74.39, grade 7', () => {
    const total = weightedTotal([30, 25, 60, 18], [40, 35, 80, 24], [19, 17, 44, 20]);
    expect(total).toBeCloseTo(74.39, 2);
    expect(gradeForTotal(total as number, DEFAULT_BOUNDARIES)).toBe(7);
  });

  it('TITC SL 18/24, 20/30, 20/25 gives 72.5, grade 7', () => {
    const total = weightedTotal([18, 20, 20], [24, 30, 25], [30, 45, 25]);
    expect(total).toBeCloseTo(72.5, 5);
    expect(gradeForTotal(total as number, DEFAULT_BOUNDARIES)).toBe(7);
  });

  it('Math AA HL 60/110, 55/110, 25/55, 14/20 gives 54.45, grade 5', () => {
    const total = weightedTotal([60, 55, 25, 14], [110, 110, 55, 20], [30, 30, 20, 20]);
    expect(total).toBeCloseTo(54.45, 2);
    expect(gradeForTotal(total as number, DEFAULT_BOUNDARIES)).toBe(5);
  });

  it('custom boundary 7>=80 turns Chemistry into a 6', () => {
    expect(gradeForTotal(75.83, [15, 27, 38, 49, 60, 80])).toBe(6);
    expect(gradeForTotal(80, [15, 27, 38, 49, 60, 80])).toBe(7);
    expect(gradeForTotal(14.9, DEFAULT_BOUNDARIES)).toBe(1);
  });

  it('returns null while anything is missing', () => {
    expect(weightedTotal([24, null, 37, 19], [30, 25, 50, 24], [19, 17, 44, 20])).toBeNull();
    expect(weightedTotal([24, 18, 37, 19], [30, 25, 0, 24], [19, 17, 44, 20])).toBeNull();
  });

  it('flags over, negative and missing marks', () => {
    expect(validateSubjectMarks([31, -1, null, 10], [30, 25, 50, 24])).toEqual([
      { index: 0, code: 'over' },
      { index: 1, code: 'negative' },
      { index: 2, code: 'missing' },
    ]);
    expect(validateSubjectMarks([24, 18, 37, 19], [30, 25, 50, 24])).toEqual([]);
  });
});

describe('subject page links and slots', () => {
  it('slugifies and reverses catalogue names', () => {
    expect(slugifyBase('Chemistry')).toBe('chemistry');
    expect(baseFromSlug('chemistry')).toBe('Chemistry');
    expect(baseFromSlug('nope')).toBeNull();
    expect(baseFromSlug('')).toBeNull();
  });

  it('round-trips hash state', () => {
    const hash = encodeSubjectHash({
      base: 'Chemistry',
      level: 'SL',
      marks: [24, 18, null, 19],
      bounds: null,
    });
    expect(hash).toBe('s=chemistry&l=SL&m=24,18,,19');
    const parsed = parseSubjectHash(`#${hash}`);
    expect(parsed.damaged).toBe(false);
    expect(parsed.base).toBe('Chemistry');
    expect(parsed.level).toBe('SL');
    expect(parsed.marks).toEqual([24, 18, null, 19]);
    expect(
      encodeSubjectHash({ base: null, level: 'HL', marks: [], bounds: [1, 2, 3, 4, 5, 6] }),
    ).toBe('l=HL&b=1,2,3,4,5,6');
  });

  it('drops bad subject hashes without throwing', () => {
    expect(parseSubjectHash('#s=nope&l=HL').damaged).toBe(true);
    expect(parseSubjectHash('#s=chemistry&l=ML').damaged).toBe(true);
    expect(parseSubjectHash('#b=1,2,3').damaged).toBe(true);
    expect(parseSubjectHash('')).toEqual({
      base: null,
      level: 'HL',
      marks: [],
      bounds: null,
      damaged: false,
    });
    expect(parseSubjectHash(null as unknown as string).damaged).toBe(true);
  });

  it('finds the right diploma slot and builds the back link', () => {
    expect(findSlotForBase('Chemistry')).toBe(3);
    expect(findSlotForBase('History')).toBe(2);
    expect(findSlotForBase('Film')).toBe(5);
    expect(findSlotForBase('Something unknown')).toBe(5);
    expect(diplomaLinkFor(3, 6, 'Chemistry', 'HL')).toBe('index.html#use=3:6&us=Chemistry&ul=HL');
  });
});
