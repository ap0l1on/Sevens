import { describe, expect, it } from 'vitest';
import {
  COMPONENTS,
  getComponents,
  gradeFromBoundaries,
  roundGrade,
  validateMarks,
  weightedAverage,
  weightedPercent,
  weightsSumOk,
} from '../src/rules/components';

describe('component weights add up to 100', () => {
  for (const entry of COMPONENTS) {
    const label = `${entry.subjects.join('/')} ${entry.levels.join('/')}`;
    it(label, () => {
      const total = entry.components.reduce((a, c) => a + c.weight, 0);
      expect(total).toBe(100);
      expect(weightsSumOk(entry.components.map((c) => c.weight))).toBe(true);
    });
  }
  it('rejects sums other than 100', () => {
    expect(weightsSumOk([36, 44, 20])).toBe(true);
    expect(weightsSumOk([30, 40, 20])).toBe(false);
    expect(weightsSumOk([])).toBe(false);
  });
});

describe('getComponents lookup', () => {
  it('finds Biology HL and SL', () => {
    expect(getComponents('Biology', 'HL')?.components.map((c) => c.weight)).toEqual([36, 44, 20]);
    expect(getComponents('Biology', 'SL')?.components.map((c) => c.weight)).toEqual([36, 44, 20]);
  });
  it('finds History HL with Paper 3', () => {
    expect(getComponents('History', 'HL')?.components.map((c) => c.name)).toEqual([
      'Paper 1',
      'Paper 2',
      'Paper 3',
      'Historical investigation (IA)',
    ]);
  });
  it('returns null for unknown subjects and empty base', () => {
    expect(getComponents('Film', 'SL')).toBeNull();
    expect(getComponents('Environmental systems and societies', 'HL')).toBeNull();
    expect(getComponents(null, 'SL')).toBeNull();
    expect(getComponents('', 'SL')).toBeNull();
  });
  it('distinguishes Language A HL from SL', () => {
    expect(getComponents('Language A: Literature', 'SL')?.components.length).toBe(3);
    expect(getComponents('Language A: Literature', 'HL')?.components.length).toBe(4);
  });
});

describe('component-grade mode', () => {
  it('[7,6,5] at [36,44,20] averages 6.16 and rounds to 6', () => {
    const avg = weightedAverage([7, 6, 5], [36, 44, 20]);
    expect(avg).toBeCloseTo(6.16, 2);
    expect(roundGrade(avg)).toBe(6);
  });
  it('[5,6] at [50,50] averages 5.5 and rounds half up to 6', () => {
    expect(weightedAverage([5, 6], [50, 50])).toBe(5.5);
    expect(roundGrade(5.5)).toBe(6);
  });
  it('clamps outside 1-7', () => {
    expect(roundGrade(0.4)).toBe(1);
    expect(roundGrade(7.6)).toBe(7);
    expect(roundGrade(4.4)).toBe(4);
  });
});

describe('marks mode', () => {
  const marks = [
    { mark: 30, out: 45 },
    { mark: 40, out: 50 },
    { mark: 18, out: 24 },
  ];
  const weights = [36, 44, 20];
  it('30/45, 40/50, 18/24 give 24 + 35.2 + 15 = 74.2%', () => {
    expect(weightedPercent(marks, weights)).toBeCloseTo(74.2, 5);
  });
  it('74.2% with 7>=75 and 6>=63 is grade 6', () => {
    expect(gradeFromBoundaries(74.2, [15, 30, 45, 55, 63, 75])).toBe(6);
  });
  it('exact boundary takes the higher grade, below min-2 is a 1', () => {
    expect(gradeFromBoundaries(75, [15, 30, 45, 55, 63, 75])).toBe(7);
    expect(gradeFromBoundaries(14.9, [15, 30, 45, 55, 63, 75])).toBe(1);
  });
  it('returns null while a component is missing or has no out-of', () => {
    expect(
      weightedPercent(
        [
          { mark: 30, out: 45 },
          { mark: null, out: 50 },
          { mark: 18, out: 24 },
        ],
        weights,
      ),
    ).toBeNull();
    expect(
      weightedPercent(
        [
          { mark: 30, out: 45 },
          { mark: 40, out: 0 },
          { mark: 18, out: 24 },
        ],
        weights,
      ),
    ).toBeNull();
  });
});

describe('marks validation', () => {
  it('flags mark over out-of, negatives and missing components', () => {
    expect(
      validateMarks([
        { mark: 50, out: 45 },
        { mark: -1, out: 50 },
        { mark: null, out: null },
        { mark: 10, out: -5 },
        { mark: 10, out: 20 },
      ]),
    ).toEqual([
      { index: 0, code: 'over' },
      { index: 1, code: 'negative' },
      { index: 2, code: 'missing' },
      { index: 3, code: 'negative' },
    ]);
  });
  it('passes clean marks', () => {
    expect(
      validateMarks([
        { mark: 30, out: 45 },
        { mark: 0, out: 50 },
      ]),
    ).toEqual([]);
  });
});
