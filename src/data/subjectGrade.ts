import { SLOTS } from '../rules/data';
import type { Level } from '../rules/data';
import type { Grade } from '../rules/data';
import { DEFAULT_BOUNDARIES } from './boundaries';
import type { SubjectComponent } from './components';

// Pure helpers for the Subject Grade Calculator page (subject.html).

/** Weighted total out of 100. Null while any mark or max is missing. */
export function weightedTotal(
  marks: (number | null)[],
  maxes: (number | null)[],
  weights: number[],
): number | null {
  let total = 0;
  for (let i = 0; i < weights.length; i++) {
    const mark = marks[i];
    const max = maxes[i];
    if (mark === null || mark === undefined || max === null || max === undefined || max <= 0) {
      return null;
    }
    total += (mark / max) * (weights[i] as number);
  }
  return total;
}

export type SubjectMarkError = { index: number; code: 'missing' | 'negative' | 'over' };

/** Validation errors for written marks. Empty means every component is usable. */
export function validateSubjectMarks(
  marks: (number | null)[],
  maxes: (number | null)[],
): SubjectMarkError[] {
  const errors: SubjectMarkError[] = [];
  for (let i = 0; i < maxes.length; i++) {
    const mark = marks[i];
    const max = maxes[i];
    if (mark === null || mark === undefined || max === null || max === undefined) {
      errors.push({ index: i, code: 'missing' });
    } else if (mark < 0 || max < 0) {
      errors.push({ index: i, code: 'negative' });
    } else if (mark > max) {
      errors.push({ index: i, code: 'over' });
    }
  }
  return errors;
}

/** Highest grade whose boundary minimum is met, else 1. Bounds are min % for grades 2-7. */
export function gradeForTotal(total: number, bounds: number[]): Grade {
  for (let g = 7; g >= 2; g--) {
    if (total >= (bounds[g - 2] as number)) return g as Grade;
  }
  return 1;
}

/** URL-safe slug for a subject base name, e.g. 'Chemistry' -> 'chemistry'. */
export function slugifyBase(base: string): string {
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** Reverse a slug to a catalogue base name, or null when unknown. */
export function baseFromSlug(slug: string): string | null {
  if (slug === '') return null;
  const seen = new Set<string>();
  const names: string[] = [];
  for (const slot of SLOTS) {
    for (const n of slot.subjects) {
      if (!seen.has(n)) {
        seen.add(n);
        names.push(n);
      }
    }
  }
  for (const n of names) {
    if (slugifyBase(n) === slug) return n;
  }
  return null;
}

export interface SubjectPageState {
  base: string | null;
  level: Level;
  marks: (number | null)[];
  bounds: number[] | null;
}

/** Encode subject-page state for the URL hash. */
export function encodeSubjectHash(state: SubjectPageState): string {
  const parts: string[] = [];
  if (state.base !== null) parts.push(`s=${encodeURIComponent(slugifyBase(state.base))}`);
  parts.push(`l=${state.level}`);
  if (state.marks.some((m) => m !== null && m !== undefined)) {
    parts.push(
      `m=${state.marks.map((m) => (m === null || m === undefined ? '' : String(m))).join(',')}`,
    );
  }
  if (state.bounds !== null) parts.push(`b=${state.bounds.join(',')}`);
  return parts.join('&');
}

/** Parse subject-page state from a hash string. Never throws. */
export function parseSubjectHash(hash: string): {
  base: string | null;
  level: Level;
  marks: (number | null)[];
  bounds: number[] | null;
  damaged: boolean;
} {
  let damaged = false;
  let base: string | null = null;
  let level: Level = 'HL';
  let marks: (number | null)[] = [];
  let bounds: number[] | null = null;
  try {
    const q = hash.startsWith('#') ? hash.slice(1) : hash;
    if (q === '') return { base, level, marks, bounds, damaged };
    const params = new URLSearchParams(q);
    const s = params.get('s');
    if (s !== null && s !== '') {
      const found = baseFromSlug(s);
      if (found === null) damaged = true;
      else base = found;
    }
    const l = params.get('l');
    if (l === 'HL' || l === 'SL') level = l;
    else if (l !== null) damaged = true;
    const m = params.get('m');
    if (m !== null && m !== '') {
      marks = m.split(',').map((p) => {
        if (p === '') return null;
        const n = Number(p);
        return Number.isFinite(n) ? n : null;
      });
    }
    const b = params.get('b');
    if (b !== null && b !== '') {
      const nums = b.split(',').map(Number);
      if (nums.length === 6 && nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) {
        bounds = nums;
      } else {
        damaged = true;
      }
    }
  } catch {
    damaged = true;
  }
  return { base, level, marks, bounds, damaged };
}

/** First slot (0-5) whose list contains the base. Falls back to 5. */
export function findSlotForBase(base: string): number {
  for (let i = 0; i < SLOTS.length; i++) {
    if ((SLOTS[i] as (typeof SLOTS)[number]).subjects.includes(base)) return i;
  }
  return 5;
}

/** Link from the subject page back to the diploma page with a grade for a slot. */
export function diplomaLinkFor(slot: number, grade: Grade, base: string, level: Level): string {
  return `index.html#use=${slot}:${grade}&us=${encodeURIComponent(base)}&ul=${level}`;
}

/** Default boundaries used unless the student enters their own. */
export function effectiveBounds(custom: number[] | null): number[] {
  return custom ?? DEFAULT_BOUNDARIES;
}

export type { SubjectComponent };
