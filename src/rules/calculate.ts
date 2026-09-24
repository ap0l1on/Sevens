import {
  CORE_MATRIX,
  FAIL_ORDER,
  isSlOnlySubject,
  type FailCode,
  type Input,
  type Result,
  type StructureIssue,
} from './data';

export function getStructureIssues(input: Input): StructureIssue[] {
  const issues: StructureIssue[] = [];
  if (input.subjects.length !== 6) {
    issues.push('NEED_6_SUBJECTS');
  }
  const hlCount = input.subjects.filter((s) => s.level === 'HL').length;
  if (hlCount !== 3 && hlCount !== 4) {
    issues.push('HL_COUNT');
  }
  const slOnlyAtHl = input.subjects.some((s) => s.level === 'HL' && isSlOnlySubject(s.name));
  if (slOnlyAtHl) {
    issues.push('SL_ONLY_AT_HL');
  }
  return issues;
}

function sumGrades(grades: (number | null)[]): number {
  let sum = 0;
  for (const g of grades) {
    if (typeof g === 'number') sum += g;
  }
  return sum;
}

/** HL points counted for the 12-point rule: top 3 when 4 HL, else all HL. */
export function countedHlPoints(hlGrades: number[], hlCount: number): number {
  if (hlCount === 4) {
    const sorted = [...hlGrades].sort((a, b) => b - a).slice(0, 3);
    return sorted.reduce((a, b) => a + b, 0);
  }
  return hlGrades.reduce((a, b) => a + b, 0);
}

export function calculate(input: Input): Result {
  const subjects = input.subjects;
  const hlCount = subjects.filter((s) => s.level === 'HL').length;

  const enteredGrades = subjects.map((s) => s.grade);
  const subjectPoints = sumGrades(enteredGrades);

  const hlGrades: number[] = [];
  const slGrades: number[] = [];
  for (const s of subjects) {
    if (typeof s.grade === 'number') {
      if (s.level === 'HL') hlGrades.push(s.grade);
      else slGrades.push(s.grade);
    }
  }
  const hlPoints = countedHlPoints(hlGrades, hlCount);
  const slPoints = slGrades.reduce((a, b) => a + b, 0);

  const corePoints =
    input.tok !== null && input.ee !== null ? CORE_MATRIX[input.ee][input.tok] : null;

  const missingSubjects = subjects.filter((s) => s.grade === null).length;
  const missing = {
    subjects: missingSubjects,
    tok: input.tok === null,
    ee: input.ee === null,
  };

  const structure = getStructureIssues(input);
  const hasStructureIssue = structure.length > 0;

  if (hasStructureIssue) {
    return {
      status: 'invalid',
      subjectPoints,
      corePoints,
      total: null,
      totalRange: null,
      hlPoints,
      slPoints,
      hlCount,
      fails: [],
      structure,
      missing,
    };
  }

  const allGradesIn = missingSubjects === 0 && subjects.length === 6;
  const coreIn = input.tok !== null && input.ee !== null;

  if (!allGradesIn || !coreIn) {
    let totalRange: [number, number] | null = null;
    if (allGradesIn && !coreIn) {
      totalRange = [subjectPoints + 0, subjectPoints + 3];
    }
    return {
      status: 'incomplete',
      subjectPoints,
      corePoints,
      total: null,
      totalRange,
      hlPoints,
      slPoints,
      hlCount,
      fails: [],
      structure,
      missing,
    };
  }

  // Complete + valid structure: evaluate every condition in 3.2 order.
  const total = subjectPoints + (corePoints as number);
  const fails: FailCode[] = [];

  const grades = subjects.map((s) => s.grade as number);
  const count2 = grades.filter((g) => g === 2).length;
  const countLe3 = grades.filter((g) => g <= 3).length;
  const has1 = grades.some((g) => g === 1);
  const slCount = subjects.length - hlCount;

  // Build in FAIL_ORDER to guarantee order.
  const failSet = new Set<FailCode>();
  if (!input.cas) failSet.add('CAS_NOT_MET');
  if (total < 24) failSet.add('TOTAL_UNDER_24');
  if (input.tok === 'E') failSet.add('TOK_E');
  if (input.ee === 'E') failSet.add('EE_E');
  if (has1) failSet.add('GRADE_1');
  if (count2 > 2) failSet.add('MORE_THAN_TWO_2S');
  if (countLe3 > 3) failSet.add('MORE_THAN_THREE_3_OR_BELOW');
  if (hlPoints < 12) failSet.add('HL_UNDER_12');
  if (hlCount === 3 && slCount === 3) {
    if (slPoints < 9) failSet.add('SL_UNDER_9');
  } else if (hlCount === 4 && slCount === 2) {
    if (slPoints < 5) failSet.add('SL_UNDER_5');
  }

  for (const code of FAIL_ORDER) {
    if (failSet.has(code)) fails.push(code);
  }

  return {
    status: fails.length === 0 ? 'on_track' : 'not_on_track',
    subjectPoints,
    corePoints,
    total,
    totalRange: null,
    hlPoints,
    slPoints,
    hlCount,
    fails,
    structure,
    missing,
  };
}

/** UI copy for structure issues (section 3.4). */
export function structureMessage(
  structure: StructureIssue[],
  subjectCount: number,
  hlCount: number,
): string {
  const parts: string[] = [];
  if (structure.includes('NEED_6_SUBJECTS')) {
    const need = Math.max(0, 6 - subjectCount);
    parts.push(need === 1 ? 'Add 1 more subject' : `Add ${need} more subjects`);
  }
  if (structure.includes('HL_COUNT')) {
    parts.push(`The diploma needs 3 or 4 HL subjects. You have ${hlCount}.`);
  }
  if (structure.includes('SL_ONLY_AT_HL')) {
    parts.push('One of your subjects is only offered at SL and cannot be set to HL.');
  }
  return parts.join(' ');
}

/** UI copy for fail codes (section 3.2), with values filled. */
export function failMessage(
  code: FailCode,
  ctx: {
    total: number | null;
    hlPoints: number;
    slPoints: number;
    subjects: { name: string; grade: number | null }[];
  },
): string {
  switch (code) {
    case 'CAS_NOT_MET':
      return 'CAS isn\u2019t marked complete, and the diploma needs it.';
    case 'TOTAL_UNDER_24':
      return `${ctx.total ?? 0} points, and the diploma needs at least 24.`;
    case 'TOK_E':
      return 'An E in TOK means no diploma.';
    case 'EE_E':
      return 'An E in the Extended Essay means no diploma.';
    case 'GRADE_1': {
      const first = ctx.subjects.find((s) => s.grade === 1);
      const name = first && first.name.trim() ? first.name.trim() : 'a subject';
      return `A 1 in ${name} means no diploma, whatever the total.`;
    }
    case 'MORE_THAN_TWO_2S': {
      const n = ctx.subjects.filter((s) => s.grade === 2).length;
      return `${n} grade 2s, and at most two are allowed.`;
    }
    case 'MORE_THAN_THREE_3_OR_BELOW': {
      const n = ctx.subjects.filter((s) => s.grade !== null && (s.grade as number) <= 3).length;
      return `${n} grades of 3 or below, and at most three are allowed.`;
    }
    case 'HL_UNDER_12':
      return `${ctx.hlPoints} HL points, and you need at least 12.`;
    case 'SL_UNDER_9':
      return `${ctx.slPoints} SL points, and you need at least 9.`;
    case 'SL_UNDER_5':
      return `${ctx.slPoints} SL points, and with two SL subjects you need at least 5.`;
  }
}
