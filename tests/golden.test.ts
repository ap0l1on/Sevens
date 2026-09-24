import { describe, expect, it } from 'vitest';
import { calculate } from '../src/rules/calculate';
import { CORE_MATRIX, type CoreGrade, type Grade, type Input } from '../src/rules/data';
import { planOffer } from '../src/rules/planner';

function makeInput(
  hl: Grade[],
  sl: Grade[],
  tok: CoreGrade | null,
  ee: CoreGrade | null,
  cas: boolean,
  hlNames?: string[],
  slNames?: string[],
): Input {
  const subjects: Input['subjects'] = [];
  hl.forEach((g, i) => {
    subjects.push({
      name: hlNames?.[i] ?? `HL Subject ${i + 1}`,
      level: 'HL',
      grade: g,
      locked: false,
    });
  });
  sl.forEach((g, i) => {
    subjects.push({
      name: slNames?.[i] ?? `SL Subject ${i + 1}`,
      level: 'SL',
      grade: g,
      locked: false,
    });
  });
  return { subjects, tok, ee, cas };
}

describe('golden diploma rules T01-T24', () => {
  const cases: {
    id: string;
    hl: Grade[];
    sl: Grade[];
    tok: CoreGrade;
    ee: CoreGrade;
    cas: boolean;
    core: number;
    total: number;
    status: 'on_track' | 'not_on_track';
    fails: string[];
    names?: { hl?: string[]; sl?: string[] };
  }[] = [
    {
      id: 'T01 max score',
      hl: [7, 7, 7],
      sl: [7, 7, 7],
      tok: 'A',
      ee: 'A',
      cas: true,
      core: 3,
      total: 45,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T02 typical',
      hl: [6, 6, 5],
      sl: [5, 5, 4],
      tok: 'B',
      ee: 'C',
      cas: true,
      core: 2,
      total: 33,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T03 exactly 24',
      hl: [4, 4, 4],
      sl: [4, 4, 3],
      tok: 'C',
      ee: 'C',
      cas: true,
      core: 1,
      total: 24,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T04 23 points',
      hl: [4, 4, 4],
      sl: [4, 4, 3],
      tok: 'D',
      ee: 'C',
      cas: true,
      core: 0,
      total: 23,
      status: 'not_on_track',
      fails: ['TOTAL_UNDER_24'],
    },
    {
      id: 'T05 a grade 1',
      hl: [7, 7, 7],
      sl: [7, 7, 1],
      tok: 'A',
      ee: 'A',
      cas: true,
      core: 3,
      total: 39,
      status: 'not_on_track',
      fails: ['GRADE_1'],
    },
    {
      id: 'T06 three 2s',
      hl: [7, 7, 2],
      sl: [7, 2, 2],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 29,
      status: 'not_on_track',
      fails: ['MORE_THAN_TWO_2S'],
    },
    {
      id: 'T07 two 2s allowed',
      hl: [7, 7, 2],
      sl: [7, 7, 2],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 34,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T08 four grades ≤ 3',
      hl: [7, 6, 3],
      sl: [3, 3, 3],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 27,
      status: 'not_on_track',
      fails: ['MORE_THAN_THREE_3_OR_BELOW'],
    },
    {
      id: 'T09 three 3s allowed',
      hl: [7, 6, 3],
      sl: [7, 3, 3],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 31,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T10 HL 11',
      hl: [5, 3, 3],
      sl: [7, 7, 7],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 34,
      status: 'not_on_track',
      fails: ['HL_UNDER_12'],
    },
    {
      id: 'T11 HL exactly 12',
      hl: [4, 4, 4],
      sl: [7, 7, 7],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 35,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T12 SL 8',
      hl: [7, 7, 7],
      sl: [4, 2, 2],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 31,
      status: 'not_on_track',
      fails: ['SL_UNDER_9'],
    },
    {
      id: 'T13 SL exactly 9',
      hl: [7, 7, 7],
      sl: [3, 3, 3],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 32,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T14 4 HL, on track',
      hl: [6, 6, 6, 2],
      sl: [3, 2],
      tok: 'C',
      ee: 'C',
      cas: true,
      core: 1,
      total: 26,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T15 4 HL, top three = 11',
      hl: [4, 4, 3, 3],
      sl: [7, 7],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 30,
      status: 'not_on_track',
      fails: ['HL_UNDER_12'],
    },
    {
      id: 'T16 4 HL, SL = 4',
      hl: [7, 7, 7, 7],
      sl: [2, 2],
      tok: 'B',
      ee: 'B',
      cas: true,
      core: 2,
      total: 34,
      status: 'not_on_track',
      fails: ['SL_UNDER_5'],
    },
    {
      id: 'T17 EE E',
      hl: [7, 7, 7],
      sl: [7, 7, 7],
      tok: 'A',
      ee: 'E',
      cas: true,
      core: 0,
      total: 42,
      status: 'not_on_track',
      fails: ['EE_E'],
    },
    {
      id: 'T18 TOK E',
      hl: [7, 7, 7],
      sl: [7, 7, 7],
      tok: 'E',
      ee: 'A',
      cas: true,
      core: 0,
      total: 42,
      status: 'not_on_track',
      fails: ['TOK_E'],
    },
    {
      id: 'T19 CAS not met',
      hl: [6, 6, 6],
      sl: [6, 6, 6],
      tok: 'B',
      ee: 'B',
      cas: false,
      core: 2,
      total: 38,
      status: 'not_on_track',
      fails: ['CAS_NOT_MET'],
    },
    {
      id: 'T20 EE A + TOK D',
      hl: [5, 5, 5],
      sl: [5, 5, 5],
      tok: 'D',
      ee: 'A',
      cas: true,
      core: 2,
      total: 32,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T21 EE C + TOK D',
      hl: [4, 4, 4],
      sl: [4, 4, 4],
      tok: 'D',
      ee: 'C',
      cas: true,
      core: 0,
      total: 24,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T22 many fails, in order',
      hl: [3, 2, 1],
      sl: [2, 2, 1],
      tok: 'D',
      ee: 'D',
      cas: false,
      core: 0,
      total: 11,
      status: 'not_on_track',
      fails: [
        'CAS_NOT_MET',
        'TOTAL_UNDER_24',
        'GRADE_1',
        'MORE_THAN_TWO_2S',
        'MORE_THAN_THREE_3_OR_BELOW',
        'HL_UNDER_12',
        'SL_UNDER_9',
      ],
    },
    {
      id: 'T23 4 HL max',
      hl: [7, 7, 7, 7],
      sl: [7, 7],
      tok: 'A',
      ee: 'A',
      cas: true,
      core: 3,
      total: 45,
      status: 'on_track',
      fails: [],
    },
    {
      id: 'T24 24 only thanks to core',
      hl: [4, 4, 4],
      sl: [4, 4, 1],
      tok: 'A',
      ee: 'A',
      cas: true,
      core: 3,
      total: 24,
      status: 'not_on_track',
      fails: ['GRADE_1'],
    },
  ];

  for (const c of cases) {
    it(c.id, () => {
      const input = makeInput(c.hl, c.sl, c.tok, c.ee, c.cas, c.names?.hl, c.names?.sl);
      const r = calculate(input);
      expect(r.corePoints).toBe(c.core);
      expect(r.total).toBe(c.total);
      expect(r.status).toBe(c.status);
      expect(r.fails).toEqual(c.fails);
    });
  }
});

describe('TOK/EE matrix — all 25 cells', () => {
  const expected: Record<string, Record<string, number>> = {
    A: { A: 3, B: 3, C: 2, D: 2, E: 0 },
    B: { A: 3, B: 2, C: 2, D: 1, E: 0 },
    C: { A: 2, B: 2, C: 1, D: 0, E: 0 },
    D: { A: 2, B: 1, C: 0, D: 0, E: 0 },
    E: { A: 0, B: 0, C: 0, D: 0, E: 0 },
  };
  const grades: CoreGrade[] = ['A', 'B', 'C', 'D', 'E'];
  for (const ee of grades) {
    for (const tok of grades) {
      it(`EE ${ee} + TOK ${tok} = ${expected[ee]![tok]}`, () => {
        expect(CORE_MATRIX[ee]![tok]).toBe(expected[ee]![tok]);
        const input = makeInput([4, 4, 4], [4, 4, 4], tok, ee, true);
        const r = calculate(input);
        expect(r.corePoints).toBe(expected[ee]![tok]);
      });
    }
  }
});

describe('state tests', () => {
  it('5 subjects gives invalid / NEED_6_SUBJECTS', () => {
    const input: Input = {
      subjects: [
        { name: 'A', level: 'HL', grade: 5, locked: false },
        { name: 'B', level: 'HL', grade: 5, locked: false },
        { name: 'C', level: 'HL', grade: 5, locked: false },
        { name: 'D', level: 'SL', grade: 5, locked: false },
        { name: 'E', level: 'SL', grade: 5, locked: false },
      ],
      tok: 'B',
      ee: 'B',
      cas: true,
    };
    const r = calculate(input);
    expect(r.status).toBe('invalid');
    expect(r.structure).toContain('NEED_6_SUBJECTS');
  });

  it('2 HL gives invalid / HL_COUNT', () => {
    const input = makeInput([5, 5], [5, 5, 5, 5] as unknown as Grade[], 'B', 'B', true);
    // makeInput with 2 HL + 4 SL = 6 subjects, HL count 2
    expect(input.subjects.length).toBe(6);
    const r = calculate(input);
    expect(r.status).toBe('invalid');
    expect(r.structure).toContain('HL_COUNT');
  });

  it('5 HL gives invalid / HL_COUNT', () => {
    const input: Input = {
      subjects: [
        { name: 'A', level: 'HL', grade: 5, locked: false },
        { name: 'B', level: 'HL', grade: 5, locked: false },
        { name: 'C', level: 'HL', grade: 5, locked: false },
        { name: 'D', level: 'HL', grade: 5, locked: false },
        { name: 'E', level: 'HL', grade: 5, locked: false },
        { name: 'F', level: 'SL', grade: 5, locked: false },
      ],
      tok: 'B',
      ee: 'B',
      cas: true,
    };
    const r = calculate(input);
    expect(r.status).toBe('invalid');
    expect(r.structure).toContain('HL_COUNT');
  });

  it('Language ab initio at HL gives invalid / SL_ONLY_AT_HL', () => {
    const input = makeInput([5, 5, 5], [5, 5, 5], 'B', 'B', true, undefined, [
      'Language ab initio',
      'History',
      'English A',
    ]);
    input.subjects[3]!.level = 'HL';
    input.subjects[3]!.name = 'Turkish Language ab initio';
    // Now 4 HL 2 SL but one SL-only at HL
    const r = calculate(input);
    expect(r.status).toBe('invalid');
    expect(r.structure).toContain('SL_ONLY_AT_HL');
  });

  it('6 grades with no EE gives incomplete with totalRange', () => {
    const input = makeInput([6, 6, 5], [5, 5, 4], 'B', null, true);
    const r = calculate(input);
    expect(r.status).toBe('incomplete');
    expect(r.subjectPoints).toBe(31);
    expect(r.totalRange).toEqual([31, 34]);
    expect(r.total).toBeNull();
  });
});

describe('offer planner P01-P08', () => {
  it('P01 total 36', () => {
    const input = makeInput([6, 6, 5], [5, 5, 4], 'B', 'C', true);
    const res = planOffer(input, { total: 36, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('PLAN');
    if (res.kind === 'PLAN') {
      expect(res.changes).toEqual([
        { index: 2, from: 5, to: 6 },
        { index: 3, from: 5, to: 6 },
        { index: 5, from: 4, to: 5 },
      ]);
    }
  });

  it('P02 38 with 7 6 6 at HL', () => {
    const input = makeInput([6, 6, 5], [5, 5, 4], 'B', 'C', true);
    const res = planOffer(input, { total: 38, hl: [7, 6, 6], sl: [], subjectMins: [] });
    expect(res.kind).toBe('PLAN');
    if (res.kind === 'PLAN') {
      expect(res.changes).toEqual([
        { index: 0, from: 6, to: 7 },
        { index: 2, from: 5, to: 6 },
        { index: 3, from: 5, to: 6 },
        { index: 4, from: 5, to: 6 },
        { index: 5, from: 4, to: 5 },
      ]);
    }
  });

  it('P03 already met', () => {
    const input = makeInput([7, 6, 6], [6, 6, 5], 'B', 'B', true);
    const res = planOffer(input, { total: 36, hl: [6, 6, 6], sl: [], subjectMins: [] });
    expect(res.kind).toBe('ALREADY_MET');
  });

  it('P04 unreachable maxTotal 43', () => {
    const input = makeInput([6, 6, 5], [5, 5, 4], 'C', 'C', true);
    const res = planOffer(input, { total: 45, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('UNREACHABLE');
    if (res.kind === 'UNREACHABLE') expect(res.maxTotal).toBe(43);
  });

  it('P05 high total with a grade 1', () => {
    const input = makeInput([7, 7, 7], [7, 7, 1], 'A', 'A', true);
    const res = planOffer(input, { total: 38, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('PLAN');
    if (res.kind === 'PLAN') {
      expect(res.changes).toEqual([{ index: 5, from: 1, to: 2 }]);
    }
  });

  it('P06 subject minimum', () => {
    const input = makeInput([6, 6, 5], [5, 5, 4], 'B', 'C', true);
    const res = planOffer(input, {
      total: 34,
      hl: [],
      sl: [],
      subjectMins: [{ index: 0, min: 7 }],
    });
    expect(res.kind).toBe('PLAN');
    if (res.kind === 'PLAN') {
      expect(res.changes).toEqual([{ index: 0, from: 6, to: 7 }]);
    }
  });

  it('P07 locked subjects', () => {
    const input = makeInput([6, 6, 5], [5, 5, 4], 'B', 'C', true);
    input.subjects[4]!.locked = true;
    input.subjects[5]!.locked = true;
    const res = planOffer(input, { total: 36, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('PLAN');
    if (res.kind === 'PLAN') {
      expect(res.changes).toEqual([
        { index: 0, from: 6, to: 7 },
        { index: 2, from: 5, to: 6 },
        { index: 3, from: 5, to: 6 },
      ]);
    }
  });

  it('P08 CAS not ticked', () => {
    const input = makeInput([6, 6, 6], [6, 6, 6], 'B', 'B', false);
    const res = planOffer(input, { total: 30, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('BLOCKED');
    if (res.kind === 'BLOCKED') expect(res.codes).toEqual(['CAS_NOT_MET']);
  });
});
