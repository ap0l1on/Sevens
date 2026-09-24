// IB DP rules as data.
// Source: https://ibo.org/about-the-ib/what-it-means-to-be-an-ib-student/recognizing-student-achievement/about-assessment/dp-passing-criteria/
// Checked: 2026-09-24
// Matrix source: same page (TOK/EE points matrix). Some third-party sites print
// a different version (e.g. A/D = 1); those are wrong — use this one.

export type Level = 'HL' | 'SL';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type CoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Subject {
  name: string;
  level: Level;
  grade: Grade | null;
  locked: boolean;
  /** Catalogue base name for fixed slots, '__other' for free text, '__custom' for anything else. */
  base?: string | null;
  /** Language for Language A/B, ab initio and Classical languages. */
  lang?: string | null;
}

export interface Input {
  subjects: Subject[];
  tok: CoreGrade | null;
  ee: CoreGrade | null;
  cas: boolean;
}

export type FailCode =
  | 'CAS_NOT_MET'
  | 'TOTAL_UNDER_24'
  | 'TOK_E'
  | 'EE_E'
  | 'GRADE_1'
  | 'MORE_THAN_TWO_2S'
  | 'MORE_THAN_THREE_3_OR_BELOW'
  | 'HL_UNDER_12'
  | 'SL_UNDER_9'
  | 'SL_UNDER_5';

export type StructureIssue = 'NEED_6_SUBJECTS' | 'HL_COUNT' | 'SL_ONLY_AT_HL';

export interface Result {
  status: 'incomplete' | 'invalid' | 'on_track' | 'not_on_track';
  subjectPoints: number;
  corePoints: number | null;
  total: number | null;
  totalRange: [number, number] | null;
  hlPoints: number;
  slPoints: number;
  hlCount: number;
  fails: FailCode[];
  structure: StructureIssue[];
  missing: { subjects: number; tok: boolean; ee: boolean };
}

export interface Offer {
  total: number | null;
  hl: Grade[];
  sl: Grade[];
  subjectMins: { index: number; min: Grade }[];
}

/** Ordered fail codes — section 3.2 table order. */
export const FAIL_ORDER: FailCode[] = [
  'CAS_NOT_MET',
  'TOTAL_UNDER_24',
  'TOK_E',
  'EE_E',
  'GRADE_1',
  'MORE_THAN_TWO_2S',
  'MORE_THAN_THREE_3_OR_BELOW',
  'HL_UNDER_12',
  'SL_UNDER_9',
  'SL_UNDER_5',
];

/**
 * TOK/EE core points matrix.
 * Rows = EE grade, columns = TOK grade.
 * Source: ibo.org DP passing criteria page, checked 2026-09-24.
 */
export const CORE_MATRIX: Record<CoreGrade, Record<CoreGrade, number>> = {
  A: { A: 3, B: 3, C: 2, D: 2, E: 0 },
  B: { A: 3, B: 2, C: 2, D: 1, E: 0 },
  C: { A: 2, B: 2, C: 1, D: 0, E: 0 },
  D: { A: 2, B: 1, C: 0, D: 0, E: 0 },
  E: { A: 0, B: 0, C: 0, D: 0, E: 0 },
};

export function corePointsFor(tok: CoreGrade, ee: CoreGrade): number {
  return CORE_MATRIX[ee][tok];
}

export const RULES_SOURCE_URL =
  'https://ibo.org/about-the-ib/what-it-means-to-be-an-ib-student/recognizing-student-achievement/about-assessment/dp-passing-criteria/';
export const RULES_CHECKED_DATE = '2026-09-24';

/** Subjects that are SL-only (section 3.4). Matching is case-insensitive substring. */
export const SL_ONLY_MARKERS = [
  'ab initio',
  'world religions',
  'literature and performance',
  'school-based syllabus',
  'school based syllabus',
  'turkey in the 20th century',
];

export function isSlOnlySubject(name: string): boolean {
  const n = name.trim().toLowerCase();
  return SL_ONLY_MARKERS.some((m) => n.includes(m));
}

// --- Subject catalogue (section 3.5, picker suggestions only) ---

export interface CatalogueGroup {
  group: string;
  subjects: { name: string; slOnly?: boolean; note?: string }[];
}

export const SUBJECT_CATALOGUE: CatalogueGroup[] = [
  {
    group: 'Group 1 — Studies in language and literature',
    subjects: [
      { name: 'Language A: Literature' },
      { name: 'Language A: Language and literature' },
      { name: 'Literature and performance', slOnly: true },
    ],
  },
  {
    group: 'Group 2 — Language acquisition',
    subjects: [
      { name: 'Language B' },
      { name: 'Language ab initio', slOnly: true },
      { name: 'Classical languages' },
    ],
  },
  {
    group: 'Group 3 — Individuals and societies',
    subjects: [
      { name: 'Business management' },
      { name: 'Digital society' },
      { name: 'Economics' },
      { name: 'Geography' },
      { name: 'Global politics' },
      { name: 'History' },
      { name: 'Philosophy' },
      { name: 'Psychology' },
      { name: 'Social and cultural anthropology' },
      { name: 'Turkey in the 20th Century', slOnly: true },
      { name: 'World religions', slOnly: true },
    ],
  },
  {
    group: 'Group 4 — Sciences',
    subjects: [
      { name: 'Biology' },
      { name: 'Chemistry' },
      { name: 'Computer science' },
      { name: 'Design technology' },
      { name: 'Physics' },
      { name: 'Sports, exercise and health science' },
      { name: 'Environmental systems and societies', note: 'HL available from May 2026' },
    ],
  },
  {
    group: 'Group 5 — Mathematics',
    subjects: [
      { name: 'Mathematics: analysis and approaches' },
      { name: 'Mathematics: applications and interpretation' },
    ],
  },
  {
    group: 'Group 6 — The arts',
    subjects: [
      { name: 'Dance' },
      { name: 'Film' },
      { name: 'Music' },
      { name: 'Theatre' },
      { name: 'Visual arts' },
    ],
  },
  {
    group: 'Other',
    subjects: [{ name: 'School-based syllabus', slOnly: true }],
  },
];

export const COMMON_LANGUAGES = [
  'English',
  'Turkish',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Arabic',
  'Hindi',
  'Italian',
  'Japanese',
  'Korean',
  'Russian',
];

/** Languages for the "Which language?" field (quick picks + Latin + free text). */
export const SLOT_LANGUAGES = [...COMMON_LANGUAGES, 'Latin'];

export const OTHER_VALUE = '__other';
export const CUSTOM_VALUE = '__custom';

// --- Fixed subject slots (Part B): six cards, each bound to one group. ---

export interface SlotDef {
  title: string;
  group: string;
  subjects: string[];
}

const ARTS = ['Dance', 'Film', 'Music', 'Theatre', 'Visual arts'];

export const SLOTS: SlotDef[] = [
  {
    title: 'Language & literature',
    group: 'Group 1',
    subjects: [
      'Language A: Literature',
      'Language A: Language and literature',
      'Literature and performance',
    ],
  },
  {
    title: 'Language acquisition',
    group: 'Group 2',
    subjects: ['Language B', 'Language ab initio', 'Classical languages'],
  },
  {
    title: 'Individuals & societies',
    group: 'Group 3',
    subjects: [
      'Business management',
      'Digital society',
      'Economics',
      'Geography',
      'Global politics',
      'History',
      'Philosophy',
      'Psychology',
      'Social and cultural anthropology',
      'Turkey in the 20th Century',
      'World religions',
      'Environmental systems and societies',
    ],
  },
  {
    title: 'Sciences',
    group: 'Group 4',
    subjects: [
      'Biology',
      'Chemistry',
      'Computer science',
      'Design technology',
      'Physics',
      'Sports, exercise and health science',
      'Environmental systems and societies',
    ],
  },
  {
    title: 'Mathematics',
    group: 'Group 5',
    subjects: [
      'Mathematics: analysis and approaches',
      'Mathematics: applications and interpretation',
    ],
  },
  { title: 'The arts or a second choice', group: 'Group 6', subjects: ARTS },
];

/** Slot indexes (0-based) whose subjects may fill slot 6 as a second choice. */
export const SECOND_CHOICE_SLOTS = [0, 1, 2, 3];

/** Dropdown options for slot 6: arts, then every slot 1–4 subject once. */
export function slotSixSubjects(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (name: string) => {
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  };
  for (const n of SLOTS[5]!.subjects) push(n);
  for (const si of SECOND_CHOICE_SLOTS) {
    for (const n of SLOTS[si]!.subjects) push(n);
  }
  return out;
}

/** Short display forms used after a language, e.g. "Turkish B". */
const LANGUAGE_SHORT: Record<string, string> = {
  'Language A: Literature': 'A: Literature',
  'Language A: Language and literature': 'A: Language and literature',
  'Language B': 'B',
  'Language ab initio': 'ab initio',
  'Classical languages': 'Classical languages',
};

export function isLanguageSubject(base: string | null | undefined): boolean {
  return base != null && Object.prototype.hasOwnProperty.call(LANGUAGE_SHORT, base);
}

/** Saved display name, e.g. "English A: Language and literature" or "Turkish B". */
export function composeName(base: string, lang: string | null | undefined): string {
  const l = (lang ?? '').trim();
  if (!l || !isLanguageSubject(base)) return base;
  return `${l} ${LANGUAGE_SHORT[base]}`;
}

/**
 * Work out the dropdown base + language from a saved display name.
 * Unknown names become '__custom' so old links keep loading.
 */
export function inferSlotBase(name: string): { base: string; lang: string | null } {
  const trimmed = name.trim();
  for (const g of SUBJECT_CATALOGUE) {
    for (const s of g.subjects) {
      if (s.name.toLowerCase() === trimmed.toLowerCase() && trimmed !== '') {
        return { base: s.name, lang: null };
      }
    }
  }
  for (const lang of SLOT_LANGUAGES) {
    const prefix = `${lang} `;
    if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
      const rest = trimmed.slice(prefix.length);
      for (const [full, short] of Object.entries(LANGUAGE_SHORT)) {
        if (
          rest.toLowerCase() === short.toLowerCase() ||
          rest.toLowerCase() === full.toLowerCase()
        ) {
          return { base: full, lang };
        }
      }
    }
  }
  return { base: CUSTOM_VALUE, lang: null };
}

/** Normalized name for duplicate checks (case-insensitive, trimmed). */
export function normalizeSubjectName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Flags slots holding an already-picked subject (second and later
 * occurrences, including ESS in both slots). The flagged slots don't count.
 */
export function duplicateSlots(names: string[]): boolean[] {
  const seen = new Set<string>();
  return names.map((n) => {
    const key = normalizeSubjectName(n);
    if (key === '') return false;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
}

// --- Context statistics (section 3.6, May 2025 final statistical bulletin) ---

export const CONTEXT_STATS = {
  source:
    'https://ibo.org/globalassets/new-structure/about-the-ib/pdfs/dpcp-final-statistical-bulletin-may-2025_en.pdf',
  candidates: 102233,
  passRate: 81.9,
  meanAll: 30.6,
  meanAwarded: 32.7,
  bands: [
    { label: '0–23', share: 14.5, min: 0, max: 23 },
    { label: '24–29', share: 27.7, min: 24, max: 29 },
    { label: '30–34', share: 27.6, min: 30, max: 34 },
    { label: '35–39', share: 20.4, min: 35, max: 39 },
    { label: '40–45', share: 9.8, min: 40, max: 45 },
  ] as { label: string; share: number; min: number; max: number }[],
};

export function bandForTotal(total: number): { label: string; share: number } | null {
  for (const b of CONTEXT_STATS.bands) {
    if (total >= b.min && total <= b.max) return { label: b.label, share: b.share };
  }
  return null;
}
