import { TrainingPlanRow } from './types';

export const DEFAULT_TRAINING_PLANS: TrainingPlanRow[] = [
  {
    id: 'tp-1-1',
    courseId: 'production-art-engineer',
    sNo: 1,
    courseSubject: 'Understanding of Briefs & Annotation',
    level: 'Level 1',
    topics: [
      'Understanding Job briefs & annotated PDF',
      'Working with workorder info',
      'Working with annotated PDF',
      'Query raising Techniques',
      'Importance of SOP'
    ],
    trainerSme: 'ANBU',
    durationHrs: '1.5 hrs',
    status: 'Completed',
    materialType: 'Power Point',
    targetDate: '2026-07-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tp-1-2',
    courseId: 'production-art-engineer',
    sNo: 1,
    courseSubject: 'Understanding of Briefs & Annotation',
    level: 'Level 2',
    topics: [
      'Instructions-interpreting',
      'Techniques while carrying instructions',
      'Standardization of Queries between different shifts'
    ],
    trainerSme: 'ANBU',
    durationHrs: '1 hr',
    status: 'Completed',
    materialType: 'Video',
    targetDate: '2026-07-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tp-2-1',
    courseId: 'production-art-engineer',
    sNo: 2,
    courseSubject: 'Good Artwork Build & Artwork Building Techniques',
    level: 'Level 1',
    topics: [
      'What is GAB?',
      'Importance of GAB',
      'Steps for good artworking',
      'About tolerance and checking techniques'
    ],
    trainerSme: 'ANBU',
    durationHrs: '2 hrs',
    status: 'WIP',
    materialType: 'Power Point',
    targetDate: '2026-08-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tp-2-2',
    courseId: 'production-art-engineer',
    sNo: 2,
    courseSubject: 'Good Artwork Build & Artwork Building Techniques',
    level: 'Level 2',
    topics: [
      'Major issues on artwork building',
      'Things to remember while building artwork in AI'
    ],
    trainerSme: 'ANBU',
    durationHrs: '1.5 hrs',
    status: 'WIP',
    materialType: 'Excel File',
    targetDate: '2026-08-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tp-3-1',
    courseId: 'production-art-engineer',
    sNo: 3,
    courseSubject: 'When to build a new job / What can be adapted',
    level: 'Level 1',
    topics: [
      'Difference between New job/Adaptation/Amend',
      'What are the elements can be adapted while building range jobs',
      'Examples of adaptation work'
    ],
    trainerSme: 'Praveen',
    durationHrs: '1.5 hrs',
    status: 'To Do',
    materialType: 'Video',
    targetDate: '2026-08-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tp-4-1',
    courseId: 'production-art-engineer',
    sNo: 4,
    courseSubject: 'Maintaining Consistency',
    level: 'Level 1',
    topics: [
      'About consistency',
      'Importance of consistency',
      'Consistency between master files'
    ],
    trainerSme: 'ANBU',
    durationHrs: '1 hr',
    status: 'To Do',
    materialType: 'Power Point',
    targetDate: '2026-08-25',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tp-5-1',
    courseId: 'production-art-engineer',
    sNo: 5,
    courseSubject: 'Technical & Printer Specification',
    level: 'Level 1',
    topics: [
      'Advance level packaging techniques',
      'About Special plates and techniques (Varnish, White, emboss..)',
      'About specifications, Process spec, printer spec'
    ],
    trainerSme: 'Praveen',
    durationHrs: '2.5 hrs',
    status: 'WIP',
    materialType: 'Excel File',
    targetDate: '2026-09-05',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tp-5-2',
    courseId: 'production-art-engineer',
    sNo: 5,
    courseSubject: 'Technical & Printer Specification',
    level: 'Level 2',
    topics: [
      'Importance of specifications',
      'Spec checking method'
    ],
    trainerSme: 'Praveen',
    durationHrs: '1.5 hrs',
    status: 'WIP',
    materialType: 'Power Point',
    targetDate: '2026-09-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
