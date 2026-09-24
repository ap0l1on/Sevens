import { composeName, CUSTOM_VALUE, inferSlotBase, OTHER_VALUE } from './rules/data';
import type { Grade, Input, Offer } from './rules/data';
import { defaultCalc } from './rules/url';
import type { CalcState } from './rules/url';

export type State = {
  input: Input;
  offer: Offer;
  calc: CalcState;
  showSlOffer: boolean;
  damaged: boolean;
  startSnapshot: { input: Input; total: number } | null;
  shareMsg: string;
};

export type Action =
  | { type: 'INIT'; input: Input; offer: Offer; calc: CalcState | null; damaged: boolean }
  | { type: 'SET_NAME'; index: number; name: string }
  | { type: 'SET_SLOT_SUBJECT'; index: number; base: string }
  | { type: 'SET_LANG'; index: number; lang: string | null }
  | { type: 'SET_LEVEL'; index: number; level: 'HL' | 'SL' }
  | { type: 'SET_GRADE'; index: number; grade: Grade | null }
  | { type: 'TOGGLE_LOCK'; index: number }
  | { type: 'SET_TOK'; tok: Input['tok'] }
  | { type: 'SET_EE'; ee: Input['ee'] }
  | { type: 'SET_CAS'; cas: boolean }
  | { type: 'CALC_FILL'; base: string | null; level: 'HL' | 'SL'; fromSlot: number | null }
  | { type: 'CALC_USED' }
  | { type: 'CALC_SET_BASE'; base: string | null }
  | { type: 'CALC_SET_LEVEL'; level: 'HL' | 'SL' }
  | { type: 'CALC_SET_MARK'; index: number; value: number | null }
  | { type: 'CALC_SET_MAX'; index: number; value: number | null }
  | { type: 'SET_CALC_BOUNDS'; bounds: number[] | null }
  | { type: 'SET_OFFER_TOTAL'; total: number | null }
  | { type: 'SET_OFFER_HL'; hl: Grade[] }
  | { type: 'SET_OFFER_SL'; sl: Grade[] }
  | { type: 'ADD_SUBJECT_MIN' }
  | { type: 'SET_SUBJECT_MIN'; pos: number; index: number; min: Grade }
  | { type: 'REMOVE_SUBJECT_MIN'; pos: number }
  | { type: 'SET_SHOW_SL'; show: boolean }
  | { type: 'LOAD_EXAMPLE' }
  | { type: 'BACK_TO_START' }
  | { type: 'SET_START'; snapshot: { input: Input; total: number } }
  | { type: 'SHARE_MSG'; msg: string };

function denizExample(): { input: Input; offer: Offer } {
  return {
    input: {
      subjects: [
        {
          name: 'English A: Language and literature',
          level: 'SL',
          grade: 5,
          locked: false,
          base: 'Language A: Language and literature',
          lang: 'English',
        },
        {
          name: 'Turkish B',
          level: 'SL',
          grade: 5,
          locked: false,
          base: 'Language B',
          lang: 'Turkish',
        },
        { name: 'History', level: 'SL', grade: 4, locked: false, base: 'History' },
        { name: 'Chemistry', level: 'HL', grade: 6, locked: false, base: 'Chemistry' },
        {
          name: 'Mathematics: analysis and approaches',
          level: 'HL',
          grade: 6,
          locked: false,
          base: 'Mathematics: analysis and approaches',
        },
        { name: 'Physics', level: 'HL', grade: 5, locked: false, base: 'Physics' },
      ],
      tok: 'B',
      ee: 'C',
      cas: true,
    },
    offer: { total: 36, hl: [], sl: [], subjectMins: [] },
  };
}

/** Fill base/lang from a saved display name (old links carry names only). */
export function withInferredBases(input: Input): Input {
  return {
    ...input,
    subjects: input.subjects.map((s) => {
      if (s.base !== undefined) return s;
      if (s.name.trim() === '') return { ...s, base: null, lang: null };
      const inferred = inferSlotBase(s.name);
      return { ...s, base: inferred.base, lang: inferred.lang };
    }),
  };
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'INIT':
      return {
        ...s,
        input: withInferredBases(a.input),
        offer: a.offer,
        calc: a.calc ?? defaultCalc(),
        damaged: a.damaged,
      };
    case 'SET_NAME': {
      const subjects = s.input.subjects.map((sub, i) =>
        i === a.index
          ? {
              ...sub,
              name: a.name.slice(0, 40),
              base: sub.base === OTHER_VALUE || sub.base === CUSTOM_VALUE ? sub.base : CUSTOM_VALUE,
            }
          : sub,
      );
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'SET_SLOT_SUBJECT': {
      const subjects = s.input.subjects.map((sub, i) => {
        if (i !== a.index) return sub;
        if (a.base === OTHER_VALUE || a.base === CUSTOM_VALUE) {
          return { ...sub, base: a.base, lang: null, name: '' };
        }
        return { ...sub, base: a.base, lang: null, name: a.base };
      });
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'SET_LANG': {
      const subjects = s.input.subjects.map((sub, i) => {
        if (i !== a.index) return sub;
        const base = sub.base ?? '';
        return { ...sub, lang: a.lang, name: composeName(base, a.lang) };
      });
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'SET_LEVEL': {
      const subjects = s.input.subjects.map((sub, i) =>
        i === a.index ? { ...sub, level: a.level } : sub,
      );
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'SET_GRADE': {
      const subjects = s.input.subjects.map((sub, i) =>
        i === a.index ? { ...sub, grade: a.grade } : sub,
      );
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'TOGGLE_LOCK': {
      const subjects = s.input.subjects.map((sub, i) =>
        i === a.index ? { ...sub, locked: !sub.locked } : sub,
      );
      return { ...s, input: { ...s.input, subjects } };
    }
    case 'SET_TOK':
      return { ...s, input: { ...s.input, tok: a.tok } };
    case 'SET_EE':
      return { ...s, input: { ...s.input, ee: a.ee } };
    case 'SET_CAS':
      return { ...s, input: { ...s.input, cas: a.cas } };
    case 'CALC_FILL':
      return {
        ...s,
        calc: {
          base: a.base,
          level: a.level,
          fromSlot: a.fromSlot,
          marks: [],
          maxEdits: [],
          bounds: null,
        },
      };
    case 'CALC_SET_BASE':
      return {
        ...s,
        calc: {
          base: a.base,
          level: s.calc.level,
          fromSlot: s.calc.fromSlot,
          marks: [],
          maxEdits: [],
          bounds: null,
        },
      };
    case 'CALC_SET_LEVEL':
      return {
        ...s,
        calc: { ...s.calc, level: a.level, marks: [], maxEdits: [], bounds: null },
      };
    case 'CALC_SET_MARK': {
      const marks = [...s.calc.marks];
      marks[a.index] = a.value;
      return { ...s, calc: { ...s.calc, marks } };
    }
    case 'CALC_SET_MAX': {
      const maxEdits = [...s.calc.maxEdits];
      maxEdits[a.index] = a.value;
      return { ...s, calc: { ...s.calc, maxEdits } };
    }
    case 'SET_CALC_BOUNDS':
      return { ...s, calc: { ...s.calc, bounds: a.bounds } };
    case 'CALC_USED':
      return { ...s, calc: { ...s.calc, fromSlot: null } };
    case 'SET_OFFER_TOTAL':
      return { ...s, offer: { ...s.offer, total: a.total } };
    case 'SET_OFFER_HL':
      return { ...s, offer: { ...s.offer, hl: a.hl } };
    case 'SET_OFFER_SL':
      return { ...s, offer: { ...s.offer, sl: a.sl } };
    case 'ADD_SUBJECT_MIN': {
      if (s.offer.subjectMins.length >= 3) return s;
      return {
        ...s,
        offer: { ...s.offer, subjectMins: [...s.offer.subjectMins, { index: 0, min: 7 as Grade }] },
      };
    }
    case 'SET_SUBJECT_MIN': {
      const subjectMins = s.offer.subjectMins.map((m, i) =>
        i === a.pos ? { index: a.index, min: a.min } : m,
      );
      return { ...s, offer: { ...s.offer, subjectMins } };
    }
    case 'REMOVE_SUBJECT_MIN': {
      return {
        ...s,
        offer: { ...s.offer, subjectMins: s.offer.subjectMins.filter((_, i) => i !== a.pos) },
      };
    }
    case 'SET_SHOW_SL':
      return { ...s, showSlOffer: a.show };
    case 'LOAD_EXAMPLE': {
      const ex = denizExample();
      return { ...s, input: ex.input, offer: ex.offer };
    }
    case 'BACK_TO_START': {
      if (!s.startSnapshot) return s;
      // Deep copy to avoid mutation.
      const snap: Input = JSON.parse(JSON.stringify(s.startSnapshot.input)) as Input;
      return { ...s, input: snap };
    }
    case 'SET_START':
      return { ...s, startSnapshot: s.startSnapshot ?? a.snapshot };
    case 'SHARE_MSG':
      return { ...s, shareMsg: a.msg };
    default:
      return s;
  }
}
