import type { Level } from '../rules/data';

// Assessment components, maximum marks and weightings for the Subject Grade
// Calculator. Source: ib-assessment-research.md (Nov 2026 / May 2027 sessions).
// status per component: 'confirmed' | 'one-source' | 'unverified'.
// max: null means the maximum is not known — the UI makes it editable.
// Out-of values are fixed text unless editable; never invent maxima.

export type ComponentStatus = 'confirmed' | 'one-source' | 'unverified';

export interface SubjectComponent {
  id: string;
  name: string;
  max: number | null;
  weight: number;
  status: ComponentStatus;
}

export interface SubjectEntry {
  subject: string;
  level: Level;
  syllabus: string;
  components: SubjectComponent[];
  sources: string[];
}

const GUIDE_2025 = 'IB Sciences subject guide, first assessment 2025';

export const SUBJECT_ENTRIES: SubjectEntry[] = [
  {
    subject: 'Biology',
    level: 'SL',
    syllabus: '2025',
    components: [
      { id: 'p1a', name: 'Paper 1A', max: 30, weight: 19, status: 'one-source' },
      { id: 'p1b', name: 'Paper 1B', max: 25, weight: 17, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 50, weight: 44, status: 'one-source' },
      { id: 'ia', name: 'Scientific investigation (IA)', max: 24, weight: 20, status: 'confirmed' },
    ],
    sources: ['https://ibpredict.org/subjects/biology', GUIDE_2025],
  },
  {
    subject: 'Chemistry',
    level: 'SL',
    syllabus: '2025',
    components: [
      { id: 'p1a', name: 'Paper 1A', max: 30, weight: 19, status: 'one-source' },
      { id: 'p1b', name: 'Paper 1B', max: 25, weight: 17, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 50, weight: 44, status: 'one-source' },
      { id: 'ia', name: 'Scientific investigation (IA)', max: 24, weight: 20, status: 'confirmed' },
    ],
    sources: ['https://ibpredict.org/subjects/chemistry', GUIDE_2025],
  },
  {
    subject: 'Physics',
    level: 'SL',
    syllabus: '2025',
    components: [
      { id: 'p1a', name: 'Paper 1A', max: 25, weight: 19, status: 'one-source' },
      { id: 'p1b', name: 'Paper 1B', max: 20, weight: 17, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 50, weight: 44, status: 'confirmed' },
      { id: 'ia', name: 'Scientific investigation (IA)', max: 24, weight: 20, status: 'confirmed' },
    ],
    sources: ['https://ibpredict.org/subjects/physics', GUIDE_2025],
  },
  {
    subject: 'Physics',
    level: 'HL',
    syllabus: '2025',
    components: [
      { id: 'p1a', name: 'Paper 1A', max: 40, weight: 19, status: 'unverified' },
      { id: 'p1b', name: 'Paper 1B', max: 20, weight: 17, status: 'unverified' },
      { id: 'p2', name: 'Paper 2', max: 90, weight: 44, status: 'confirmed' },
      { id: 'ia', name: 'Scientific investigation (IA)', max: 24, weight: 20, status: 'confirmed' },
    ],
    sources: ['https://ibpredict.org/subjects/physics', GUIDE_2025],
  },
  {
    subject: 'Biology',
    level: 'HL',
    syllabus: '2025',
    components: [
      { id: 'p1a', name: 'Paper 1A', max: 40, weight: 19, status: 'unverified' },
      { id: 'p1b', name: 'Paper 1B', max: 35, weight: 17, status: 'unverified' },
      { id: 'p2', name: 'Paper 2', max: 80, weight: 44, status: 'unverified' },
      { id: 'ia', name: 'Scientific investigation (IA)', max: 24, weight: 20, status: 'confirmed' },
    ],
    sources: ['https://ibpredict.org/subjects/biology', GUIDE_2025],
  },
  {
    subject: 'Chemistry',
    level: 'HL',
    syllabus: '2025',
    components: [
      { id: 'p1a', name: 'Paper 1A', max: 40, weight: 19, status: 'unverified' },
      { id: 'p1b', name: 'Paper 1B', max: 35, weight: 17, status: 'unverified' },
      { id: 'p2', name: 'Paper 2', max: 90, weight: 44, status: 'unverified' },
      { id: 'ia', name: 'Scientific investigation (IA)', max: 24, weight: 20, status: 'confirmed' },
    ],
    sources: ['https://ibpredict.org/subjects/chemistry', GUIDE_2025],
  },
  {
    subject: 'Mathematics: analysis and approaches',
    level: 'SL',
    syllabus: '2021',
    components: [
      { id: 'p1', name: 'Paper 1', max: 80, weight: 40, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 80, weight: 40, status: 'confirmed' },
      { id: 'ia', name: 'Exploration (IA)', max: 20, weight: 20, status: 'confirmed' },
    ],
    sources: [
      'https://ibpredict.org/subjects/analysis-and-approaches',
      'IB Mathematics subject guide, first assessment 2021',
    ],
  },
  {
    subject: 'Mathematics: analysis and approaches',
    level: 'HL',
    syllabus: '2021',
    components: [
      { id: 'p1', name: 'Paper 1', max: 110, weight: 30, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 110, weight: 30, status: 'confirmed' },
      { id: 'p3', name: 'Paper 3', max: 55, weight: 20, status: 'confirmed' },
      { id: 'ia', name: 'Exploration (IA)', max: 20, weight: 20, status: 'confirmed' },
    ],
    sources: [
      'https://www.pietromeloni.com/insights/ib-math-aa-hl-curriculum-exam-technique-timing',
      'IB Mathematics subject guide, first assessment 2021',
    ],
  },
  {
    subject: 'Mathematics: applications and interpretation',
    level: 'SL',
    syllabus: '2021',
    components: [
      { id: 'p1', name: 'Paper 1', max: 80, weight: 40, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 80, weight: 40, status: 'one-source' },
      { id: 'ia', name: 'Exploration (IA)', max: 20, weight: 20, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/applications-and-interpretation',
      'IB Mathematics subject guide, first assessment 2021',
    ],
  },
  {
    subject: 'Mathematics: applications and interpretation',
    level: 'HL',
    syllabus: '2021',
    components: [
      { id: 'p1', name: 'Paper 1', max: 110, weight: 30, status: 'unverified' },
      { id: 'p2', name: 'Paper 2', max: 110, weight: 30, status: 'unverified' },
      { id: 'p3', name: 'Paper 3', max: 55, weight: 20, status: 'unverified' },
      { id: 'ia', name: 'Exploration (IA)', max: 20, weight: 20, status: 'unverified' },
    ],
    sources: ['IB Mathematics subject guide, first assessment 2021 (same structure as AA HL; confirm)'],
  },
  {
    subject: 'Language A: Literature',
    level: 'SL',
    syllabus: '2021',
    components: [
      { id: 'p1', name: 'Paper 1', max: 20, weight: 35, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 25, weight: 35, status: 'one-source' },
      { id: 'oral', name: 'Individual oral', max: 40, weight: 30, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/literature',
      'IB Language A subject guide, first assessment 2021',
    ],
  },
  {
    subject: 'Language A: Language and literature',
    level: 'SL',
    syllabus: '2021',
    components: [
      { id: 'p1', name: 'Paper 1', max: 20, weight: 35, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 25, weight: 35, status: 'one-source' },
      { id: 'oral', name: 'Individual oral', max: 40, weight: 30, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/language-and-literature',
      'IB Language A subject guide, first assessment 2021',
    ],
  },
  {
    subject: 'Language A: Literature',
    level: 'HL',
    syllabus: '2021',
    components: [
      { id: 'p1', name: 'Paper 1', max: 40, weight: 35, status: 'unverified' },
      { id: 'p2', name: 'Paper 2', max: 25, weight: 25, status: 'one-source' },
      { id: 'essay', name: 'HL essay', max: 20, weight: 20, status: 'unverified' },
      { id: 'oral', name: 'Individual oral', max: 40, weight: 20, status: 'one-source' },
    ],
    sources: ['IB Language A subject guide, first assessment 2021'],
  },
  {
    subject: 'Language A: Language and literature',
    level: 'HL',
    syllabus: '2021',
    components: [
      { id: 'p1', name: 'Paper 1', max: 40, weight: 35, status: 'unverified' },
      { id: 'p2', name: 'Paper 2', max: 25, weight: 25, status: 'one-source' },
      { id: 'essay', name: 'HL essay', max: 20, weight: 20, status: 'unverified' },
      { id: 'oral', name: 'Individual oral', max: 40, weight: 20, status: 'one-source' },
    ],
    sources: ['IB Language A subject guide, first assessment 2021'],
  },
  {
    subject: 'Language B',
    level: 'SL',
    syllabus: '2020',
    components: [
      { id: 'p1', name: 'Paper 1 (writing)', max: 30, weight: 25, status: 'one-source' },
      { id: 'p2l', name: 'Paper 2 (listening)', max: 25, weight: 25, status: 'one-source' },
      { id: 'p2r', name: 'Paper 2 (reading)', max: 40, weight: 25, status: 'one-source' },
      { id: 'oral', name: 'Individual oral', max: 30, weight: 25, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/language-b',
      'IB Language acquisition subject guide, first assessment 2020',
    ],
  },
  {
    subject: 'Language B',
    level: 'HL',
    syllabus: '2020',
    components: [
      { id: 'p1', name: 'Paper 1 (writing)', max: null, weight: 25, status: 'unverified' },
      { id: 'p2l', name: 'Paper 2 (listening)', max: null, weight: 25, status: 'unverified' },
      { id: 'p2r', name: 'Paper 2 (reading)', max: null, weight: 25, status: 'unverified' },
      { id: 'oral', name: 'Individual oral', max: null, weight: 25, status: 'unverified' },
    ],
    sources: ['IB Language acquisition subject guide (HL marks may differ; confirm)'],
  },
  {
    subject: 'Language ab initio',
    level: 'SL',
    syllabus: '2020',
    components: [
      { id: 'p1', name: 'Paper 1 (writing)', max: 30, weight: 25, status: 'one-source' },
      { id: 'p2l', name: 'Paper 2 (listening)', max: 25, weight: 25, status: 'one-source' },
      { id: 'p2r', name: 'Paper 2 (reading)', max: 40, weight: 25, status: 'one-source' },
      { id: 'oral', name: 'Individual oral', max: 30, weight: 25, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/ab-initio',
      'IB Language acquisition subject guide, first assessment 2020',
    ],
  },
  {
    subject: 'Economics',
    level: 'SL',
    syllabus: '2022',
    components: [
      { id: 'p1', name: 'Paper 1', max: 25, weight: 30, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 40, weight: 40, status: 'confirmed' },
      { id: 'ia', name: 'IA portfolio', max: 45, weight: 30, status: 'confirmed' },
    ],
    sources: [
      'https://ibpredict.org/subjects/economics',
      'https://www.bradcartwright.com/pages/ib-economics-assessments',
      'IB Economics subject guide, first assessment 2022',
    ],
  },
  {
    subject: 'Economics',
    level: 'HL',
    syllabus: '2022',
    components: [
      { id: 'p1', name: 'Paper 1', max: 25, weight: 20, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 40, weight: 30, status: 'confirmed' },
      { id: 'p3', name: 'Paper 3', max: null, weight: 30, status: 'unverified' },
      { id: 'ia', name: 'IA portfolio', max: 45, weight: 20, status: 'confirmed' },
    ],
    sources: [
      'https://www.bradcartwright.com/pages/ib-economics-assessments',
      'IB Economics subject guide (Paper 3 marks disagree across sources)',
    ],
  },
  {
    subject: 'Business management',
    level: 'SL',
    syllabus: '2024',
    components: [
      { id: 'p1', name: 'Paper 1', max: 30, weight: 35, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 40, weight: 35, status: 'confirmed' },
      { id: 'ia', name: 'Business research project (IA)', max: 25, weight: 30, status: 'confirmed' },
    ],
    sources: [
      'https://ibpredict.org/subjects/business-management',
      'IB Business management subject guide, first assessment 2024',
    ],
  },
  {
    subject: 'Business management',
    level: 'HL',
    syllabus: '2024',
    components: [
      { id: 'p1', name: 'Paper 1', max: 30, weight: 25, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 50, weight: 30, status: 'confirmed' },
      { id: 'p3', name: 'Paper 3', max: 25, weight: 25, status: 'confirmed' },
      { id: 'ia', name: 'Business research project (IA)', max: 25, weight: 20, status: 'confirmed' },
    ],
    sources: ['IB Business management subject guide, first assessment 2024'],
  },
  {
    subject: 'History',
    level: 'SL',
    syllabus: '2020',
    components: [
      { id: 'p1', name: 'Paper 1', max: 24, weight: 30, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 30, weight: 45, status: 'confirmed' },
      { id: 'ia', name: 'Historical investigation (IA)', max: 25, weight: 25, status: 'confirmed' },
    ],
    sources: ['https://ibpredict.org/subjects/history', 'IB History subject guide'],
  },
  {
    subject: 'History',
    level: 'HL',
    syllabus: '2020',
    components: [
      { id: 'p1', name: 'Paper 1', max: 24, weight: 20, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 30, weight: 25, status: 'confirmed' },
      { id: 'p3', name: 'Paper 3', max: null, weight: 35, status: 'unverified' },
      { id: 'ia', name: 'Historical investigation (IA)', max: 25, weight: 20, status: 'confirmed' },
    ],
    sources: ['https://ibpredict.org/subjects/history', 'IB History subject guide'],
  },
  {
    subject: 'Geography',
    level: 'SL',
    syllabus: '2019',
    components: [
      { id: 'p1', name: 'Paper 1', max: 40, weight: 35, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 50, weight: 40, status: 'one-source' },
      { id: 'ia', name: 'Fieldwork (IA)', max: 25, weight: 25, status: 'one-source' },
    ],
    sources: ['https://ibpredict.org/subjects/geography', 'IB Geography subject guide'],
  },
  {
    subject: 'Geography',
    level: 'HL',
    syllabus: '2019',
    components: [
      { id: 'p1', name: 'Paper 1', max: 60, weight: 35, status: 'unverified' },
      { id: 'p2', name: 'Paper 2', max: 50, weight: 25, status: 'unverified' },
      { id: 'p3', name: 'Paper 3', max: 28, weight: 20, status: 'unverified' },
      { id: 'ia', name: 'Fieldwork (IA)', max: 25, weight: 20, status: 'unverified' },
    ],
    sources: ['IB Geography subject guide (unverified; check with your teacher)'],
  },
  {
    subject: 'Psychology',
    level: 'SL',
    syllabus: 'pre-2027',
    components: [
      { id: 'p1', name: 'Paper 1', max: 49, weight: 50, status: 'confirmed' },
      { id: 'p2', name: 'Paper 2', max: 22, weight: 25, status: 'confirmed' },
      { id: 'ia', name: 'Internal assessment', max: 22, weight: 25, status: 'confirmed' },
    ],
    sources: [
      'https://psychexamreview.com/how-are-ib-psychology-grades-calculated/',
      'IB Psychology subject guide (syllabus assessed through 2026)',
    ],
  },
  {
    subject: 'Psychology',
    level: 'HL',
    syllabus: 'pre-2027',
    components: [
      { id: 'p1', name: 'Paper 1', max: 49, weight: 40, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 44, weight: 20, status: 'one-source' },
      { id: 'p3', name: 'Paper 3', max: 24, weight: 20, status: 'one-source' },
      { id: 'ia', name: 'Internal assessment', max: 22, weight: 20, status: 'one-source' },
    ],
    sources: [
      'https://psychexamreview.com/how-are-ib-psychology-grades-calculated/',
      'IB Psychology subject guide (syllabus assessed through 2026)',
    ],
  },
  {
    subject: 'Computer science',
    level: 'SL',
    syllabus: 'pre-2027',
    components: [
      { id: 'p1', name: 'Paper 1', max: 70, weight: 45, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 45, weight: 25, status: 'one-source' },
      { id: 'ia', name: 'Solution (IA)', max: 34, weight: 30, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/computer-science',
      'IB Computer science subject guide (syllabus assessed through 2026)',
    ],
  },
  {
    subject: 'Computer science',
    level: 'HL',
    syllabus: 'pre-2027',
    components: [
      { id: 'p1', name: 'Paper 1', max: 100, weight: 40, status: 'unverified' },
      { id: 'p2', name: 'Paper 2', max: 65, weight: 20, status: 'unverified' },
      { id: 'p3', name: 'Paper 3', max: 30, weight: 20, status: 'unverified' },
      { id: 'ia', name: 'Solution (IA)', max: 34, weight: 20, status: 'unverified' },
    ],
    sources: ['IB Computer science subject guide (syllabus assessed through 2026; confirm marks)'],
  },
  {
    subject: 'Visual arts',
    level: 'SL',
    syllabus: 'pre-2027',
    components: [
      { id: 'cs', name: 'Comparative study', max: 30, weight: 20, status: 'one-source' },
      { id: 'pp', name: 'Process portfolio', max: 34, weight: 40, status: 'one-source' },
      { id: 'ex', name: 'Exhibition', max: 30, weight: 40, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/visual-arts',
      'IB Visual arts subject guide (syllabus assessed through 2026)',
    ],
  },
  {
    subject: 'Visual arts',
    level: 'HL',
    syllabus: 'pre-2027',
    components: [
      { id: 'cs', name: 'Comparative study', max: 42, weight: 20, status: 'unverified' },
      { id: 'pp', name: 'Process portfolio', max: 34, weight: 40, status: 'unverified' },
      { id: 'ex', name: 'Exhibition', max: 30, weight: 40, status: 'unverified' },
    ],
    sources: ['IB Visual arts subject guide (syllabus assessed through 2026; confirm marks)'],
  },
  {
    subject: 'Environmental systems and societies',
    level: 'SL',
    syllabus: '2026',
    components: [
      { id: 'p1', name: 'Paper 1', max: 35, weight: 25, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 65, weight: 50, status: 'one-source' },
      { id: 'ia', name: 'Internal assessment', max: 30, weight: 25, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/environmental-systems-and-societies',
      'IB ESS subject guide, first assessment 2026',
    ],
  },
  {
    subject: 'Sports, exercise and health science',
    level: 'SL',
    syllabus: 'current',
    components: [
      { id: 'p1', name: 'Paper 1', max: 30, weight: 20, status: 'one-source' },
      { id: 'p2', name: 'Paper 2', max: 50, weight: 35, status: 'one-source' },
      { id: 'p3', name: 'Paper 3', max: 40, weight: 25, status: 'one-source' },
      { id: 'ia', name: 'Internal assessment', max: 24, weight: 20, status: 'one-source' },
    ],
    sources: [
      'https://ibpredict.org/subjects/sports-excercise-and-health-science',
      'IB SEHS subject guide (a new guide may apply from 2026; check)',
    ],
  },
];

/** Find the weighting row for a subject base name + level, or null. */
export function getSubjectEntry(subject: string | null | undefined, level: Level): SubjectEntry | null {
  if (subject == null || subject === '') return null;
  for (const entry of SUBJECT_ENTRIES) {
    if (entry.level === level && entry.subject === subject) return entry;
  }
  return null;
}
