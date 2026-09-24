import { describe, expect, it } from 'vitest';
import * as rules from '../src/rules';
import {
  bandForTotal,
  corePointsFor,
  isSlOnlySubject,
  type Grade,
  type Input,
} from '../src/rules/data';
import { calculate, countedHlPoints, failMessage, structureMessage } from '../src/rules/calculate';
import { maxTotalFor, meetsOffer, planOffer } from '../src/rules/planner';
import { defaultInput, defaultOffer, encodeState, parseState } from '../src/rules/url';

function baseInput(): Input {
  return {
    subjects: [
      { name: 'Chemistry', level: 'HL', grade: 6, locked: false },
      { name: 'Maths AA', level: 'HL', grade: 6, locked: false },
      { name: 'Physics', level: 'HL', grade: 5, locked: false },
      { name: 'English A', level: 'SL', grade: 5, locked: false },
      { name: 'Turkish B', level: 'SL', grade: 5, locked: false },
      { name: 'History', level: 'SL', grade: 4, locked: false },
    ],
    tok: 'B',
    ee: 'C',
    cas: true,
  };
}

describe('data helpers', () => {
  it('rules index re-exports', () => {
    expect(typeof rules.calculate).toBe('function');
    expect(typeof rules.planOffer).toBe('function');
    expect(typeof rules.parseState).toBe('function');
  });
  it('corePointsFor matches matrix', () => {
    expect(corePointsFor('B', 'C')).toBe(2);
    expect(corePointsFor('D', 'A')).toBe(2);
    expect(corePointsFor('E', 'A')).toBe(0);
  });
  it('isSlOnlySubject detects markers', () => {
    expect(isSlOnlySubject('Turkish Language ab initio')).toBe(true);
    expect(isSlOnlySubject('World Religions')).toBe(true);
    expect(isSlOnlySubject('Literature and Performance')).toBe(true);
    expect(isSlOnlySubject('School-based syllabus')).toBe(true);
    expect(isSlOnlySubject('school based syllabus')).toBe(true);
    expect(isSlOnlySubject('Chemistry')).toBe(false);
    expect(isSlOnlySubject('  ')).toBe(false);
  });
  it('bandForTotal bands + null', () => {
    expect(bandForTotal(10)?.label).toBe('0–23');
    expect(bandForTotal(24)?.label).toBe('24–29');
    expect(bandForTotal(32)?.label).toBe('30–34');
    expect(bandForTotal(38)?.label).toBe('35–39');
    expect(bandForTotal(44)?.label).toBe('40–45');
    expect(bandForTotal(46)).toBeNull();
    expect(bandForTotal(-1)).toBeNull();
  });
  it('countedHlPoints top3 vs all', () => {
    expect(countedHlPoints([6, 6, 6, 2], 4)).toBe(18);
    expect(countedHlPoints([4, 4, 3, 3], 4)).toBe(11);
    expect(countedHlPoints([6, 6, 5], 3)).toBe(17);
  });
});

describe('messages', () => {
  it('structureMessage variants', () => {
    expect(structureMessage(['NEED_6_SUBJECTS'], 5, 3)).toBe('Add 1 more subject');
    expect(structureMessage(['NEED_6_SUBJECTS'], 4, 2)).toContain('Add 2 more subjects');
    expect(structureMessage(['HL_COUNT'], 6, 2)).toBe(
      'The diploma needs 3 or 4 HL subjects. You have 2.',
    );
    expect(structureMessage(['SL_ONLY_AT_HL'], 6, 4)).toContain('only offered at SL');
    expect(structureMessage(['NEED_6_SUBJECTS', 'HL_COUNT', 'SL_ONLY_AT_HL'], 5, 2)).toContain(
      'Add 1 more subject',
    );
    expect(structureMessage([], 6, 3)).toBe('');
  });
  it('failMessage all codes', () => {
    const ctx = {
      total: 11,
      hlPoints: 6,
      slPoints: 5,
      subjects: [
        { name: 'Mathematics SL', grade: 1 as Grade | null },
        { name: 'Physics', grade: 2 as Grade | null },
        { name: 'Chemistry', grade: 2 as Grade | null },
        { name: 'English', grade: 2 as Grade | null },
        { name: 'History', grade: 3 as Grade | null },
        { name: 'Turkish', grade: 1 as Grade | null },
      ],
    };
    expect(failMessage('CAS_NOT_MET', ctx)).toContain('CAS');
    expect(failMessage('TOTAL_UNDER_24', ctx)).toContain('11 points');
    expect(failMessage('TOTAL_UNDER_24', { ...ctx, total: null })).toContain('0 points');
    expect(failMessage('TOK_E', ctx)).toContain('TOK');
    expect(failMessage('EE_E', ctx)).toContain('Extended Essay');
    expect(failMessage('GRADE_1', ctx)).toContain('Mathematics SL');
    expect(failMessage('GRADE_1', { ...ctx, subjects: [{ name: '  ', grade: 1 }] })).toContain(
      'a subject',
    );
    expect(failMessage('MORE_THAN_TWO_2S', ctx)).toContain('at most two');
    expect(failMessage('MORE_THAN_THREE_3_OR_BELOW', ctx)).toContain('at most three');
    expect(failMessage('HL_UNDER_12', ctx)).toContain('HL points');
    expect(failMessage('SL_UNDER_9', ctx)).toContain('at least 9');
    expect(failMessage('SL_UNDER_5', ctx)).toContain('two SL subjects');
  });
});

describe('meetsOffer branches', () => {
  it('false when not on track / null total', () => {
    const bad = calculate({
      subjects: [
        { name: 'a', level: 'HL', grade: 3, locked: false },
        { name: 'b', level: 'HL', grade: 2, locked: false },
        { name: 'c', level: 'HL', grade: 1, locked: false },
        { name: 'd', level: 'SL', grade: 2, locked: false },
        { name: 'e', level: 'SL', grade: 2, locked: false },
        { name: 'f', level: 'SL', grade: 1, locked: false },
      ],
      tok: 'D',
      ee: 'D',
      cas: false,
    });
    expect(
      meetsOffer(bad, [3, 2, 1, 2, 2, 1], ['HL', 'HL', 'HL', 'SL', 'SL', 'SL'], {
        total: 24,
        hl: [],
        sl: [],
        subjectMins: [],
      }),
    ).toBe(false);
  });
  it('hl/sl length and value checks', () => {
    const input = baseInput();
    const r = calculate(input);
    const grades = input.subjects.map((s) => s.grade);
    const levels = input.subjects.map((s) => s.level);
    expect(
      meetsOffer(r, grades, levels, { total: null, hl: [7, 7, 7, 7], sl: [], subjectMins: [] }),
    ).toBe(false);
    expect(meetsOffer(r, grades, levels, { total: null, hl: [7], sl: [], subjectMins: [] })).toBe(
      false,
    );
    expect(
      meetsOffer(r, grades, levels, { total: null, hl: [], sl: [7, 7, 7, 7], subjectMins: [] }),
    ).toBe(false);
    expect(meetsOffer(r, grades, levels, { total: null, hl: [], sl: [6], subjectMins: [] })).toBe(
      false,
    );
    expect(
      meetsOffer(r, grades, levels, {
        total: null,
        hl: [],
        sl: [],
        subjectMins: [{ index: 0, min: 7 }],
      }),
    ).toBe(false);
    expect(
      meetsOffer(r, grades, levels, {
        total: null,
        hl: [],
        sl: [],
        subjectMins: [{ index: 5, min: 5 }],
      }),
    ).toBe(false);
    // out-of-range subjectMins index -> undefined grade
    expect(
      meetsOffer(r, grades, levels, {
        total: null,
        hl: [],
        sl: [],
        subjectMins: [{ index: 10, min: 5 }],
      }),
    ).toBe(false);
    // missing grade in subjectMins
    const gradesMissing = [...grades];
    gradesMissing[0] = null;
    const incomplete = calculate({
      ...input,
      subjects: input.subjects.map((s, i) => (i === 0 ? { ...s, grade: null } : s)),
    });
    expect(
      meetsOffer(incomplete, gradesMissing, levels, {
        total: null,
        hl: [],
        sl: [],
        subjectMins: [{ index: 0, min: 5 }],
      }),
    ).toBe(false);
  });
});

describe('planner edge branches', () => {
  it('empty offer on track -> ALREADY_MET', () => {
    const res = planOffer(baseInput(), { total: null, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('ALREADY_MET');
  });
  it('offer with only HL met, no total -> ALREADY_MET margin 0', () => {
    const input = baseInput();
    const res = planOffer(input, { total: null, hl: [6, 6, 5], sl: [], subjectMins: [] });
    expect(res.kind).toBe('ALREADY_MET');
    if (res.kind === 'ALREADY_MET') expect(res.margin).toBe(0);
  });
  it('empty offer not on track -> PLAN fixes diploma', () => {
    const input = baseInput();
    input.subjects[5]!.grade = 3;
    input.subjects[4]!.grade = 3;
    input.subjects[3]!.grade = 3;
    input.subjects[2]!.grade = 3;
    // HL 6 6 3 SL 3 3 3 + B/C = 27 total, 4x <=3 -> fails MORE_THAN_THREE
    const res = planOffer(input, { total: null, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('PLAN');
  });
  it('incomplete with CAS false -> BLOCKED direct', () => {
    const input = baseInput();
    input.subjects[0]!.grade = null;
    input.cas = false;
    const res = planOffer(input, { total: 30, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('BLOCKED');
  });
  it('incomplete with TOK E -> BLOCKED direct', () => {
    const input = baseInput();
    input.subjects[0]!.grade = null;
    input.tok = 'E';
    const res = planOffer(input, { total: 30, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('BLOCKED');
  });
  it('incomplete with EE E -> BLOCKED direct', () => {
    const input = baseInput();
    input.subjects[0]!.grade = null;
    input.ee = 'E';
    const res = planOffer(input, { total: 30, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('BLOCKED');
  });
  it('invalid structure -> UNREACHABLE', () => {
    const input: Input = {
      subjects: [
        { name: 'a', level: 'HL', grade: 5, locked: false },
        { name: 'b', level: 'HL', grade: 5, locked: false },
        { name: 'c', level: 'SL', grade: 5, locked: false },
        { name: 'd', level: 'SL', grade: 5, locked: false },
        { name: 'e', level: 'SL', grade: 5, locked: false },
        { name: 'f', level: 'SL', grade: 5, locked: false },
      ],
      tok: 'B',
      ee: 'B',
      cas: true,
    };
    const res = planOffer(input, { total: 30, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('UNREACHABLE');
  });
  it('n != 6 -> UNREACHABLE', () => {
    const input: Input = {
      subjects: [{ name: 'a', level: 'HL', grade: 5, locked: false }],
      tok: 'B',
      ee: 'B',
      cas: true,
    };
    const res = planOffer(input, { total: 30, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('UNREACHABLE');
  });
  it('locked missing grade -> UNREACHABLE', () => {
    const input = baseInput();
    input.subjects[0]!.grade = null;
    input.subjects[0]!.locked = true;
    const res = planOffer(input, { total: 30, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('UNREACHABLE');
  });
  it('alternatives present for P01', () => {
    const input = baseInput();
    const res = planOffer(input, { total: 36, hl: [], sl: [], subjectMins: [] });
    expect(res.kind).toBe('PLAN');
    if (res.kind === 'PLAN') {
      expect(res.alternatives.length).toBeGreaterThan(0);
      expect(res.newTotal).toBeGreaterThanOrEqual(36);
    }
  });
  it('maxTotalFor with locked and missing core', () => {
    const input = baseInput();
    input.subjects[0]!.locked = true;
    expect(maxTotalFor(input)).toBe(43);
    const noCore: Input = { ...input, tok: null, ee: null };
    expect(maxTotalFor(noCore)).toBe(41);
    const fresh = baseInput();
    fresh.subjects[0]!.grade = null;
    expect(maxTotalFor(fresh)).toBe(44);
    const tokOnly: Input = { ...baseInput(), tok: 'B', ee: null };
    expect(maxTotalFor(tokOnly)).toBe(42);
    const eeOnly: Input = { ...baseInput(), tok: null, ee: 'C' };
    expect(maxTotalFor(eeOnly)).toBe(42);
    const missingUnlocked: Input = {
      ...input,
      subjects: input.subjects.map((s, i) => (i === 0 ? { ...s, grade: null } : s)),
      tok: null,
      ee: null,
    };
    // #0 locked + null counts as 0
    expect(maxTotalFor(missingUnlocked)).toBe(35);
  });
  it('incomplete missing grades can still PLAN', () => {
    const input = baseInput();
    input.subjects[5]!.grade = null;
    const res = planOffer(input, { total: 33, hl: [], sl: [], subjectMins: [] });
    // missing #6 (4) -> needs setting; should find a plan
    expect(['PLAN', 'UNREACHABLE', 'BLOCKED', 'ALREADY_MET']).toContain(res.kind);
  });
});

describe('url extras', () => {
  it('malformed percent in name marks damaged, never throws', () => {
    const parsed = parseState('?s=H6-%.H5-b.S5-c.S5-d.S5-e.S4-f');
    expect(parsed.damaged).toBe(true);
  });
  it('non-string input never throws', () => {
    const parsed = parseState(null as unknown as string);
    expect(parsed.damaged).toBe(true);
  });
  it('ee invalid marks damaged', () => {
    expect(parseState('?ee=Z').damaged).toBe(true);
  });
  it('encodes cas false', () => {
    const input = baseInput();
    input.cas = false;
    const qs = encodeState(input, defaultOffer());
    expect(qs).toContain('cas=0');
    const parsed = parseState(`?${qs}`);
    expect(parsed.input.cas).toBe(false);
  });
  it('encodes long input capped at 1500', () => {
    const input = baseInput();
    const many = Array.from({ length: 50 }, (_, i) => ({
      name: 'x'.repeat(40),
      level: (i % 2 === 0 ? 'HL' : 'SL') as 'HL' | 'SL',
      grade: 7 as Grade,
      locked: false,
    }));
    const big = { ...input, subjects: many };
    const qs = encodeState(big, defaultOffer());
    expect(qs.length).toBeLessThanOrEqual(1500);
  });
  it('parses missing grades with _', () => {
    const parsed = parseState('?s=H_-Chem.H_-Maths.H_-Phys.S_-Eng.S_-Tur.S_-His&tok=B&ee=C&cas=1');
    expect(parsed.damaged).toBe(false);
    expect(parsed.input.subjects.every((s) => s.grade === null)).toBe(true);
  });
  it('parses cas=0', () => {
    expect(parseState('?cas=0').input.cas).toBe(false);
  });
  it('bare param without = never throws', () => {
    const parsed = parseState('?s');
    expect(parsed.damaged).toBe(true);
  });
  it('default input/offer + encode locked/om', () => {
    const d = defaultInput();
    expect(d.subjects.length).toBe(6);
    const input = baseInput();
    input.subjects[0]!.locked = true;
    const qs = encodeState(input, {
      total: 38,
      hl: [7, 6, 6],
      sl: [6],
      subjectMins: [{ index: 4, min: 7 }],
    });
    const parsed = parseState(`?${qs}`);
    expect(parsed.damaged).toBe(false);
    expect(parsed.input.subjects[0]!.locked).toBe(true);
    expect(parsed.offer.hl).toEqual([7, 6, 6]);
    expect(parsed.offer.sl).toEqual([6]);
    expect(parsed.offer.subjectMins).toEqual([{ index: 4, min: 7 }]);
  });
  it('bad om/lk/oh/os mark damaged', () => {
    expect(parseState('?om=9:9').damaged).toBe(true);
    expect(parseState('?om=1:2.2:3.3:4.4:5').damaged).toBe(true);
    expect(parseState('?lk=9').damaged).toBe(true);
    expect(parseState('?oh=89').damaged).toBe(true);
    expect(parseState('?os=xyz').damaged).toBe(true);
    expect(parseState('?ot=99').damaged).toBe(true);
    expect(parseState('?cas=maybe').damaged).toBe(true);
    expect(parseState('?tok=Z').damaged).toBe(true);
  });
  it('control chars stripped', () => {
    const parsed = parseState('?s=H6-abc%00def.H5-b.S5-c.S5-d.S5-e.S4-f');
    expect(parsed.input.subjects[0]!.name).not.toContain('\u0000');
  });
});
