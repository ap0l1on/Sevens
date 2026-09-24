import { describe, expect, it } from 'vitest';
import {
  CUSTOM_VALUE,
  SECOND_CHOICE_SLOTS,
  SLOTS,
  composeName,
  duplicateSlots,
  inferSlotBase,
  isLanguageSubject,
  normalizeSubjectName,
  slotSixSubjects,
  type Grade,
} from '../src/rules/data';
import { parseState, parseSubjectUse } from '../src/rules/url';
import { defaultCalc, type CalcState } from '../src/rules/url';
import { defaultInput, defaultOffer, encodeState } from '../src/rules/url';

describe('fixed slots', () => {
  it('has six slots with the specified headings and counts', () => {
    expect(SLOTS.map((s) => s.title)).toEqual([
      'Language & literature',
      'Language acquisition',
      'Individuals & societies',
      'Sciences',
      'Mathematics',
      'The arts or a second choice',
    ]);
    expect(SLOTS[2]!.subjects).toContain('Environmental systems and societies');
    expect(SLOTS[3]!.subjects).toContain('Environmental systems and societies');
    expect(SECOND_CHOICE_SLOTS).toEqual([0, 1, 2, 3]);
  });

  it('slot six lists arts then groups 1-4 deduplicated', () => {
    const list = slotSixSubjects();
    expect(list.slice(0, 5)).toEqual(['Dance', 'Film', 'Music', 'Theatre', 'Visual arts']);
    expect(list).toContain('History');
    expect(list.filter((n) => n === 'Environmental systems and societies').length).toBe(1);
  });
});

describe('language names', () => {
  it('detects language subjects', () => {
    expect(isLanguageSubject('Language B')).toBe(true);
    expect(isLanguageSubject('History')).toBe(false);
    expect(isLanguageSubject(null)).toBe(false);
    expect(isLanguageSubject(undefined)).toBe(false);
  });

  it('composes display names', () => {
    expect(composeName('Language A: Language and literature', 'English')).toBe(
      'English A: Language and literature',
    );
    expect(composeName('Language B', 'Turkish')).toBe('Turkish B');
    expect(composeName('Language ab initio', 'Spanish')).toBe('Spanish ab initio');
    expect(composeName('History', 'Turkish')).toBe('History');
    expect(composeName('Language B', null)).toBe('Language B');
    expect(composeName('Language B', '  ')).toBe('Language B');
  });

  it('infers base and language back from display names', () => {
    expect(inferSlotBase('History')).toEqual({ base: 'History', lang: null });
    expect(inferSlotBase('  history  ')).toEqual({ base: 'History', lang: null });
    expect(inferSlotBase('English A: Language and literature')).toEqual({
      base: 'Language A: Language and literature',
      lang: 'English',
    });
    expect(inferSlotBase('Turkish B')).toEqual({ base: 'Language B', lang: 'Turkish' });
    expect(inferSlotBase('My made-up subject')).toEqual({ base: CUSTOM_VALUE, lang: null });
    expect(inferSlotBase('')).toEqual({ base: CUSTOM_VALUE, lang: null });
    expect(inferSlotBase('English Chemistry')).toEqual({ base: CUSTOM_VALUE, lang: null });
  });
});

describe('duplicates', () => {
  it('flags second and later picks, ignoring case and blanks', () => {
    expect(normalizeSubjectName('  History ')).toBe('history');
    expect(
      duplicateSlots([
        'History',
        'Chemistry',
        'history',
        '',
        '  ',
        'Environmental systems and societies',
        'environmental systems and societies',
      ]),
    ).toEqual([false, false, true, false, false, false, true]);
  });
});

describe('calculator slice in the hash', () => {
  const calc: CalcState = {
    base: 'Chemistry',
    level: 'SL',
    fromSlot: 3,
    marks: [24, 18, null, 19],
    maxEdits: [null, null, null, null],
    bounds: [15, 27, 38, 49, 60, 75],
  };

  it('round-trips the full calculator state', () => {
    const qs = encodeState(defaultInput(), defaultOffer(), calc);
    expect(qs).toContain('cs=chemistry');
    expect(qs).toContain('cf=3');
    expect(qs).toContain('cbb=15,27,38,49,60,75');
    const parsed = parseState(`#${qs}`);
    expect(parsed.damaged).toBe(false);
    expect(parsed.calc).toEqual({
      base: 'Chemistry',
      level: 'SL',
      fromSlot: 3,
      marks: [24, 18, null, 19],
      maxEdits: [],
      bounds: [15, 27, 38, 49, 60, 75],
    });
  });

  it('omits empty calculator parts and absent slices', () => {
    expect(parseState('?s=H6-Chemistry').calc).toBeNull();
    const qs = encodeState(defaultInput(), defaultOffer(), defaultCalc());
    expect(qs).not.toContain('cs=');
    expect(qs).not.toContain('cm=');
    const sparse: CalcState = { ...defaultCalc(), marks: [null, 5], maxEdits: [null, 50] };
    const sparseQs = encodeState(defaultInput(), defaultOffer(), sparse);
    expect(sparseQs).toContain('cm=,5');
    expect(sparseQs).toContain('cx=,50');
    expect(parseState(`#${sparseQs}`).calc).toEqual({
      base: null,
      level: 'HL',
      fromSlot: null,
      marks: [null, 5],
      maxEdits: [null, 50],
      bounds: null,
    });
  });

  it('drops bad calculator values without throwing', () => {
    expect(parseState('#cs=nope&cl=SL').damaged).toBe(true);
    expect(parseState('#cs=chemistry&cl=ML').damaged).toBe(true);
    expect(parseState('#cf=9').damaged).toBe(true);
    expect(parseState('#cm=1,xx').damaged).toBe(true);
    expect(parseState('#cm=' + '1,'.repeat(11)).damaged).toBe(true);
    expect(parseState('#cx=1,-2').damaged).toBe(true);
    expect(parseState('#cbb=1,2,3').damaged).toBe(true);
    expect(parseState('#cs=&cl=&cf=&cm=&cx=&cbb=').damaged).toBe(false);
    const parsed = parseState('#cs=chemistry&cl=HL&cf=0&cm=1,2&cbb=1,2,3,4,5,6');
    expect(parsed.calc).toEqual({
      base: 'Chemistry',
      level: 'HL',
      fromSlot: 0,
      marks: [1, 2],
      maxEdits: [],
      bounds: [1, 2, 3, 4, 5, 6],
    });
  });
});

describe('subject-page handoff (#use=SLOT:GRADE&us=BASE&ul=LEVEL)', () => {
  it('parses a valid handoff', () => {
    expect(parseSubjectUse('#use=3:6&us=Chemistry&ul=HL')).toEqual({
      slot: 3,
      grade: 6,
      base: 'Chemistry',
      level: 'HL',
    });
    expect(parseSubjectUse('?use=3:6&us=Chemistry&ul=HL')).toEqual({
      slot: 3,
      grade: 6,
      base: 'Chemistry',
      level: 'HL',
    });
  });

  it('rejects partial or invalid handoffs', () => {
    expect(parseSubjectUse('')).toBeNull();
    expect(parseSubjectUse('#s=H6-Chemistry')).toBeNull();
    expect(parseSubjectUse('#use=9:6&us=Chemistry&ul=HL')).toBeNull();
    expect(parseSubjectUse('#use=3:9&us=Chemistry&ul=HL')).toBeNull();
    expect(parseSubjectUse('#use=3:6&us=&ul=HL')).toBeNull();
    expect(parseSubjectUse('#use=3:6&us=Chemistry&ul=ML')).toBeNull();
    expect(parseSubjectUse(null as unknown as string)).toBeNull();
  });

  it('keeps old links loading', () => {
    const parsed = parseState(
      '?s=H6-Chemistry.H6-Physics.H5-Biology.S5-English.S5-Turkish.S4-History&tok=B&ee=C&cas=1',
    );
    expect(parsed.damaged).toBe(false);
    expect(parsed.input.subjects.map((s) => s.grade)).toEqual([6, 6, 5, 5, 5, 4] as Grade[]);
  });
});
