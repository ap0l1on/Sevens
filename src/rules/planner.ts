import { calculate } from './calculate';
import type { Grade, Input, Offer, Result, FailCode } from './data';

export interface PlanChange {
  index: number;
  from: Grade | null;
  to: Grade;
}

export type PlannerResult =
  | { kind: 'ALREADY_MET'; result: Result; margin: number }
  | {
      kind: 'PLAN';
      changes: PlanChange[];
      newResult: Result;
      newTotal: number;
      alternatives: { changes: PlanChange[]; newTotal: number }[];
    }
  | { kind: 'UNREACHABLE'; maxTotal: number }
  | { kind: 'BLOCKED'; codes: FailCode[] };

const UNFIXABLE: FailCode[] = ['CAS_NOT_MET', 'TOK_E', 'EE_E'];

function sortedDesc(values: number[]): number[] {
  return [...values].sort((a, b) => b - a);
}

export function meetsOffer(
  result: Result,
  grades: (Grade | null)[],
  levels: ('HL' | 'SL')[],
  offer: Offer,
): boolean {
  if (result.status !== 'on_track') return false;
  // on_track implies total is not null.
  if (offer.total !== null && (result.total as number) < offer.total) return false;

  const hlGrades = sortedDesc(
    grades.filter((g, i) => levels[i] === 'HL' && typeof g === 'number') as number[],
  );
  if (hlGrades.length < offer.hl.length) return false;
  for (let i = 0; i < offer.hl.length; i++) {
    const need = offer.hl[i] as Grade;
    const have = hlGrades[i] as number;
    if (have < need) return false;
  }
  const slGrades = sortedDesc(
    grades.filter((g, i) => levels[i] === 'SL' && typeof g === 'number') as number[],
  );
  if (slGrades.length < offer.sl.length) return false;
  for (let i = 0; i < offer.sl.length; i++) {
    const need = offer.sl[i] as Grade;
    const have = slGrades[i] as number;
    if (have < need) return false;
  }
  for (const sm of offer.subjectMins) {
    const g = grades[sm.index];
    if (g === null || g === undefined) return false;
    if ((g as number) < sm.min) return false;
  }
  return true;
}

function isEmptyOffer(offer: Offer): boolean {
  return (
    offer.total === null &&
    offer.hl.length === 0 &&
    offer.sl.length === 0 &&
    offer.subjectMins.length === 0
  );
}

export function planOffer(input: Input, offer: Offer): PlannerResult {
  const current = calculate(input);
  const grades = input.subjects.map((s) => s.grade);
  const levels = input.subjects.map((s) => s.level);

  if (isEmptyOffer(offer)) {
    // No requirements: still requires diploma on track.
    if (current.status === 'on_track') {
      return { kind: 'ALREADY_MET', result: current, margin: 0 };
    }
    // Fall through to planner to suggest fixes for diploma fails (unless blocked).
  } else if (current.total !== null && meetsOffer(current, grades, levels, offer)) {
    const margin = offer.total !== null ? (current.total as number) - offer.total : 0;
    return { kind: 'ALREADY_MET', result: current, margin };
  }

  // Grade rises cannot fix CAS / TOK E / EE E. If any of those fail now,
  // they will fail for every combination, so report BLOCKED.
  const unfixableNow = current.fails.filter((f) => (UNFIXABLE as string[]).includes(f));
  if (unfixableNow.length > 0) {
    return { kind: 'BLOCKED', codes: unfixableNow };
  }
  // Also handle incomplete inputs where TOK/EE are E? They would be in fails only
  // when complete. For incomplete with tok/ee = E, grade rises still cannot fix,
  // so check directly.
  const directBlocked: FailCode[] = [];
  if (!input.cas) directBlocked.push('CAS_NOT_MET');
  if (input.tok === 'E') directBlocked.push('TOK_E');
  if (input.ee === 'E') directBlocked.push('EE_E');
  // Only return BLOCKED here when there is no other way the planner could be
  // interpreted as needing grades first. If input is incomplete/invalid and has
  // an unfixable flag, surface BLOCKED (grades alone cannot fix it).
  if (
    directBlocked.length > 0 &&
    (current.status === 'invalid' || current.status === 'incomplete')
  ) {
    // If grades are also missing, the user still needs to fix CAS/TOK/EE.
    // Return BLOCKED to match the "Grades alone can't fix this" copy.
    return {
      kind: 'BLOCKED',
      codes: directBlocked.filter((c, i) => directBlocked.indexOf(c) === i),
    };
  }

  // If structure is invalid, grade rises cannot fix HL count / subject count /
  // SL-only issues. Report UNREACHABLE with maxTotal.
  if (current.status === 'invalid') {
    const maxTotal = maxTotalFor(input);
    return { kind: 'UNREACHABLE', maxTotal };
  }

  // Enumerate combinations: each unlocked subject from current (or 1 if missing) to 7.
  const n = input.subjects.length;

  const ranges: number[][] = [];
  for (let i = 0; i < n; i++) {
    const s = input.subjects[i]!;
    if (s.locked) {
      ranges.push(s.grade === null ? [NaN] : [s.grade]);
    } else {
      const from = s.grade === null ? 1 : s.grade;
      const r: number[] = [];
      for (let g = from; g <= 7; g++) r.push(g);
      ranges.push(r);
    }
  }

  // If any locked subject has no grade, no combination can be complete.
  if (ranges.some((r) => r.length === 1 && Number.isNaN(r[0] as number))) {
    return { kind: 'UNREACHABLE', maxTotal: maxTotalFor(input) };
  }

  interface Candidate {
    grades: number[];
    sumRises: number;
    maxRise: number;
    weakSum: number;
    changes: PlanChange[];
    result: Result;
  }

  const candidates: Candidate[] = [];

  // Brute force with nested loops (at most 7^6 = 117649).
  const trialGrades: number[] = [0, 0, 0, 0, 0, 0];

  // Precompute sizes
  const sizes = ranges.map((r) => r.length);
  const totalCombos = sizes.reduce((a, b) => a * b, 1);

  for (let c = 0; c < totalCombos; c++) {
    // Decode c into mixed radix (faster than incrementing idx array).
    let rest = c;
    for (let i = n - 1; i >= 0; i--) {
      const sz = sizes[i]!;
      const pos = rest % sz;
      rest = Math.floor(rest / sz);
      trialGrades[i] = ranges[i]![pos] as number;
    }

    const trialInput: Input = {
      subjects: input.subjects.map((s, i) => ({
        ...s,
        grade: trialGrades[i] as Grade,
      })),
      tok: input.tok,
      ee: input.ee,
      cas: input.cas,
    };
    const res = calculate(trialInput);
    /* v8 ignore next -- trial is complete when tok/ee set; null only when core missing */
    if (res.total === null) continue;
    if (!meetsOffer(res, trialGrades as Grade[], levels, offer)) continue;

    const changes: PlanChange[] = [];
    let sumRises = 0;
    let maxRise = 0;
    let weakSum = 0;
    for (let i = 0; i < n; i++) {
      const from = input.subjects[i]!.grade;
      const to = trialGrades[i] as Grade;
      if (from === null) {
        const rise = to - 1;
        changes.push({ index: i, from, to });
        sumRises += rise;
        if (rise > maxRise) maxRise = rise;
        weakSum += 1;
      } else if (to !== from) {
        const rise = to - from;
        changes.push({ index: i, from, to });
        sumRises += rise;
        if (rise > maxRise) maxRise = rise;
        weakSum += from;
      }
    }

    candidates.push({ grades: [...trialGrades], sumRises, maxRise, weakSum, changes, result: res });
  }

  if (candidates.length === 0) {
    return { kind: 'UNREACHABLE', maxTotal: maxTotalFor(input) };
  }

  candidates.sort((a, b) => {
    if (a.sumRises !== b.sumRises) return a.sumRises - b.sumRises;
    if (a.maxRise !== b.maxRise) return a.maxRise - b.maxRise;
    if (a.weakSum !== b.weakSum) return a.weakSum - b.weakSum;
    // Earliest subjects in list order (deterministic).
    const ai = a.changes.map((ch) => ch.index);
    const bi = b.changes.map((ch) => ch.index);
    const len = Math.min(ai.length, bi.length);
    for (let i = 0; i < len; i++) {
      if (ai[i] !== bi[i]) return (ai[i] as number) - (bi[i] as number);
    }
    /* v8 ignore next 4 -- different-length same-prefix plans are rare; deterministic fallback */
    if (ai.length !== bi.length) return ai.length - bi.length;
    for (let i = 0; i < a.changes.length; i++) {
      if (a.changes[i]!.to !== b.changes[i]!.to) return a.changes[i]!.to - b.changes[i]!.to;
    }
    /* v8 ignore next -- identical candidates cannot occur (unique grade combos) */
    return 0;
  });

  const best = candidates[0]!;
  const bestSum = best.sumRises;
  const alternatives = candidates
    .slice(1)
    .filter((cand) => cand.sumRises === bestSum)
    .slice(0, 2)
    .map((cand) => ({ changes: cand.changes, newTotal: cand.result.total as number }));

  // Ensure changes sorted by index for stable UI.
  const changesSorted = [...best.changes].sort((a, b) => a.index - b.index);
  return {
    kind: 'PLAN',
    changes: changesSorted,
    newResult: best.result,
    newTotal: best.result.total as number,
    alternatives,
  };
}

export function maxTotalFor(input: Input): number {
  let subj = 0;
  for (const s of input.subjects) {
    if (s.locked) {
      subj += s.grade ?? 0;
    } else {
      subj += 7;
    }
  }
  // Unlocked count as 7; locked missing as 0.
  const coreNow = input.tok !== null && input.ee !== null ? corePointsNow(input) : 0;
  return subj + coreNow;
}

function corePointsNow(input: Input): number {
  const tok = input.tok as NonNullable<Input['tok']>;
  const ee = input.ee as NonNullable<Input['ee']>;
  const m: Record<string, Record<string, number>> = {
    A: { A: 3, B: 3, C: 2, D: 2, E: 0 },
    B: { A: 3, B: 2, C: 2, D: 1, E: 0 },
    C: { A: 2, B: 2, C: 1, D: 0, E: 0 },
    D: { A: 2, B: 1, C: 0, D: 0, E: 0 },
    E: { A: 0, B: 0, C: 0, D: 0, E: 0 },
  };
  return m[ee]![tok]!;
}
