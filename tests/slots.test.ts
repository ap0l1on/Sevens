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
  type Input,
} from '../src/rules/data';
import { defaultOffer, encodeState, parseState } from '../src/rules/url';

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
      duplicateSlots(['History', 'Chemistry', 'history', '', '  ', 'Environmental systems and societies', 'environmental systems and societies']),
    ).toEqual([false, false, true, false, false, false, true]);
  });
});

describe('grade boundaries in the hash', () => {
  it('round-trips bounds', () => {
    const qs = encodeState(baseInput(), defaultOffer(), { 2: [15, 30, 45, 55, 63, 75] });
    expect(qs).toContain('gb=2:');
    const parsed = parseState(`#${qs}`);
    expect(parsed.damaged).toBe(false);
    expect(parsed.bounds).toEqual({ 2: [15, 30, 45, 55, 63, 75] });
  });

  it('skips invalid bound entries when encoding', () => {
    const qs = encodeState(baseInput(), defaultOffer(), {
      9: [1, 2, 3, 4, 5, 6],
      0: [1, 2],
      1: [1, 2, 3, 4, 5, 'x' as unknown as number],
    });
    expect(qs).not.toContain('gb=');
    const empty = encodeState(baseInput(), defaultOffer(), {});
    expect(empty).not.toContain('gb=');
  });

  it('drops bad gb values when parsing', () => {
    expect(parseState('?gb=9:1,2,3,4,5,6').damaged).toBe(true);
    expect(parseState('?gb=0:10,20,30,40,50,101').damaged).toBe(true);
    expect(parseState('?gb').bounds).toEqual({});
    expect(parseState('?gb=').bounds).toEqual({});
    const good = parseState('?gb=0:10,20,30,40,50,60.6:5,15,25,35,45,55');
    expect(good.bounds).toEqual({ 0: [10, 20, 30, 40, 50, 60], 6: [5, 15, 25, 35, 45, 55] });
  });

  it('keeps old links loading without bounds', () => {
    const parsed = parseState('?s=H6-Chemistry.H6-Physics.H5-Biology.S5-English.S5-Turkish.S4-History&tok=B&ee=C&cas=1');
    expect(parsed.damaged).toBe(false);
    expect(parsed.bounds).toEqual({});
    expect(parsed.input.subjects.map((s) => s.grade)).toEqual([6, 6, 5, 5, 5, 4] as Grade[]);
  });
});
