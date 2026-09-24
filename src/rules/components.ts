import type { Grade, Level } from './data';

// Subject component weightings for the Subject Grade Calculator (Part E).
// Rows marked verified:true were confirmed from public sources during
// research. All other rows are best current knowledge and MUST be checked
// against the official IB subject guide (via the IB coordinator) before
// being marked verified. Never bundle official grade boundaries.

export interface SubjectComponent {
  id: string;
  name: string;
  weight: number;
}

export interface ComponentsEntry {
  /** Catalogue base names this row applies to. */
  subjects: string[];
  levels: Level[];
  components: SubjectComponent[];
  verified: boolean;
  source: string;
}

export const COMPONENTS: ComponentsEntry[] = [
  {
    subjects: ['Biology', 'Chemistry', 'Physics'],
    levels: ['SL', 'HL'],
    components: [
      { id: 'p1', name: 'Paper 1 (1A + 1B)', weight: 36 },
      { id: 'p2', name: 'Paper 2', weight: 44 },
      { id: 'ia', name: 'Scientific investigation (IA)', weight: 20 },
    ],
    verified: true,
    source:
      'IB Sciences subject guide, first assessment 2025 (Physics confirmed; Biology and Chemistry share the assessment model)',
  },
  {
    subjects: ['History'],
    levels: ['SL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 30 },
      { id: 'p2', name: 'Paper 2', weight: 45 },
      { id: 'ia', name: 'Historical investigation (IA)', weight: 25 },
    ],
    verified: true,
    source: 'IB History subject guide',
  },
  {
    subjects: ['History'],
    levels: ['HL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 20 },
      { id: 'p2', name: 'Paper 2', weight: 25 },
      { id: 'p3', name: 'Paper 3', weight: 35 },
      { id: 'ia', name: 'Historical investigation (IA)', weight: 20 },
    ],
    verified: true,
    source: 'IB History subject guide',
  },
  {
    subjects: ['Mathematics: analysis and approaches', 'Mathematics: applications and interpretation'],
    levels: ['SL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 40 },
      { id: 'p2', name: 'Paper 2', weight: 40 },
      { id: 'ia', name: 'Exploration (IA)', weight: 20 },
    ],
    verified: false,
    source: 'IB Mathematics subject guide, first assessment 2021',
  },
  {
    subjects: ['Mathematics: analysis and approaches', 'Mathematics: applications and interpretation'],
    levels: ['HL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 30 },
      { id: 'p2', name: 'Paper 2', weight: 30 },
      { id: 'p3', name: 'Paper 3', weight: 20 },
      { id: 'ia', name: 'Exploration (IA)', weight: 20 },
    ],
    verified: false,
    source: 'IB Mathematics subject guide, first assessment 2021',
  },
  {
    subjects: ['Language A: Literature', 'Language A: Language and literature'],
    levels: ['SL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 35 },
      { id: 'p2', name: 'Paper 2', weight: 35 },
      { id: 'oral', name: 'Individual oral', weight: 30 },
    ],
    verified: false,
    source: 'IB Language A subject guide, first assessment 2021',
  },
  {
    subjects: ['Language A: Literature', 'Language A: Language and literature'],
    levels: ['HL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 35 },
      { id: 'p2', name: 'Paper 2', weight: 25 },
      { id: 'essay', name: 'HL essay', weight: 20 },
      { id: 'oral', name: 'Individual oral', weight: 20 },
    ],
    verified: false,
    source: 'IB Language A subject guide, first assessment 2021',
  },
  {
    subjects: ['Language B', 'Language ab initio'],
    levels: ['SL', 'HL'],
    components: [
      { id: 'p1', name: 'Paper 1 (writing)', weight: 25 },
      { id: 'p2l', name: 'Paper 2 (listening)', weight: 25 },
      { id: 'p2r', name: 'Paper 2 (reading)', weight: 25 },
      { id: 'oral', name: 'Individual oral', weight: 25 },
    ],
    verified: false,
    source: 'IB Language B / ab initio subject guide',
  },
  {
    subjects: ['Economics'],
    levels: ['SL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 30 },
      { id: 'p2', name: 'Paper 2', weight: 40 },
      { id: 'ia', name: 'IA portfolio', weight: 30 },
    ],
    verified: false,
    source: 'IB Economics subject guide, first assessment 2022',
  },
  {
    subjects: ['Economics'],
    levels: ['HL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 20 },
      { id: 'p2', name: 'Paper 2', weight: 30 },
      { id: 'p3', name: 'Paper 3', weight: 30 },
      { id: 'ia', name: 'IA portfolio', weight: 20 },
    ],
    verified: false,
    source: 'IB Economics subject guide, first assessment 2022',
  },
  {
    subjects: ['Business management'],
    levels: ['SL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 35 },
      { id: 'p2', name: 'Paper 2', weight: 35 },
      { id: 'ia', name: 'Internal assessment', weight: 30 },
    ],
    verified: false,
    source: 'IB Business management subject guide, first assessment 2024',
  },
  {
    subjects: ['Business management'],
    levels: ['HL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 25 },
      { id: 'p2', name: 'Paper 2', weight: 30 },
      { id: 'p3', name: 'Paper 3', weight: 25 },
      { id: 'ia', name: 'Internal assessment', weight: 20 },
    ],
    verified: false,
    source: 'IB Business management subject guide, first assessment 2024',
  },
  {
    subjects: ['Geography'],
    levels: ['SL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 35 },
      { id: 'p2', name: 'Paper 2', weight: 40 },
      { id: 'ia', name: 'Fieldwork (IA)', weight: 25 },
    ],
    verified: false,
    source: 'IB Geography subject guide (public sources disagree — check with your teacher)',
  },
  {
    subjects: ['Geography'],
    levels: ['HL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 35 },
      { id: 'p2', name: 'Paper 2', weight: 25 },
      { id: 'p3', name: 'Paper 3', weight: 20 },
      { id: 'ia', name: 'Fieldwork (IA)', weight: 20 },
    ],
    verified: false,
    source: 'IB Geography subject guide (public sources disagree — check with your teacher)',
  },
  {
    subjects: ['Psychology'],
    levels: ['SL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 50 },
      { id: 'p2', name: 'Paper 2', weight: 25 },
      { id: 'ia', name: 'Internal assessment', weight: 25 },
    ],
    verified: false,
    source: 'IB Psychology subject guide (syllabus assessed through 2026; a new guide starts in 2027)',
  },
  {
    subjects: ['Psychology'],
    levels: ['HL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 40 },
      { id: 'p2', name: 'Paper 2', weight: 20 },
      { id: 'p3', name: 'Paper 3', weight: 20 },
      { id: 'ia', name: 'Internal assessment', weight: 20 },
    ],
    verified: false,
    source: 'IB Psychology subject guide (syllabus assessed through 2026; a new guide starts in 2027)',
  },
  {
    subjects: ['Computer science'],
    levels: ['SL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 45 },
      { id: 'p2', name: 'Paper 2', weight: 25 },
      { id: 'ia', name: 'Internal assessment', weight: 30 },
    ],
    verified: false,
    source: 'IB Computer science subject guide (syllabus assessed through 2026; a new guide starts in 2027)',
  },
  {
    subjects: ['Computer science'],
    levels: ['HL'],
    components: [
      { id: 'p1', name: 'Paper 1', weight: 40 },
      { id: 'p2', name: 'Paper 2', weight: 20 },
      { id: 'p3', name: 'Paper 3', weight: 20 },
      { id: 'ia', name: 'Internal assessment', weight: 20 },
    ],
    verified: false,
    source: 'IB Computer science subject guide (syllabus assessed through 2026; a new guide starts in 2027)',
  },
  {
    subjects: ['Visual arts'],
    levels: ['SL', 'HL'],
    components: [
      { id: 'cs', name: 'Comparative study', weight: 20 },
      { id: 'pp', name: 'Process portfolio', weight: 40 },
      { id: 'ex', name: 'Exhibition', weight: 40 },
    ],
    verified: false,
    source: 'IB Visual arts subject guide (syllabus assessed through 2026; a new guide starts in 2027)',
  },
];

/** Find the weighting row for a catalogue base name + level, or null. */
export function getComponents(base: string | null | undefined, level: Level): ComponentsEntry | null {
  if (base == null || base === '') return null;
  for (const entry of COMPONENTS) {
    if (entry.levels.includes(level) && entry.subjects.includes(base)) return entry;
  }
  return null;
}

/** Weighted average of complete component grades (weights need not sum to 100 here). */
export function weightedAverage(grades: number[], weights: number[]): number {
  let total = 0;
  for (let i = 0; i < grades.length; i++) {
    total += (grades[i] as number) * (weights[i] as number);
  }
  return total / 100;
}

/** Round half up to a 1–7 grade (e.g. 5.5 → 6). */
export function roundGrade(avg: number): Grade {
  const r = Math.round(avg);
  if (r < 1) return 1;
  if (r > 7) return 7;
  return r as Grade;
}

export interface MarkInput {
  mark: number | null;
  out: number | null;
}

/** Weighted % from marks, or null while any component is missing. */
export function weightedPercent(marks: MarkInput[], weights: number[]): number | null {
  let total = 0;
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i] as MarkInput;
    if (m.mark === null || m.out === null || m.out <= 0) return null;
    total += (m.mark / m.out) * (weights[i] as number);
  }
  return total;
}

export type MarkError = { index: number; code: 'missing' | 'negative' | 'over' };

/** Validation errors for marks mode. Empty means every component is usable. */
export function validateMarks(marks: MarkInput[]): MarkError[] {
  const errors: MarkError[] = [];
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i] as MarkInput;
    if (m.mark === null || m.out === null) {
      errors.push({ index: i, code: 'missing' });
    } else if (m.mark < 0 || m.out < 0) {
      errors.push({ index: i, code: 'negative' });
    } else if (m.mark > m.out) {
      errors.push({ index: i, code: 'over' });
    }
  }
  return errors;
}

/**
 * Turn a weighted % into a grade with teacher boundaries.
 * bounds holds the minimum % for grades 2–7; anything below min-2 is a 1.
 */
export function gradeFromBoundaries(pct: number, bounds: number[]): Grade {
  for (let g = 7; g >= 2; g--) {
    if (pct >= (bounds[g - 2] as number)) return g as Grade;
  }
  return 1;
}

/** Custom-mode weights must add up to exactly 100. */
export function weightsSumOk(weights: number[]): boolean {
  let total = 0;
  for (const w of weights) total += w;
  return total === 100;
}
