import { CourseModule } from './types';

// Concrete, high-quality, pre-defined course modules used as fallback
// when Firestore is offline or Google Cloud's daily free-tier quota is reached.
export const FALLBACK_COURSE_MODULES: CourseModule[] = [
  // 1. Packaging Engineer
  {
    id: 'pkg_mod_1',
    title: 'Introduction to Structural Packaging Design',
    description: 'Learn the fundamentals of sheet-fed packaging structures, creasing allowances, and corrugated flute types (A, B, C, E, F corrugated flutes). This module covers folding carton layout, CAD drawing layout preparation, and die-cutter tooling specifications.',
    videoUrl: 'https://www.youtube.com/embed/lA8g5Qre6P4',
    duration: '45 mins',
    category: 'packaging-engineer',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1D8e-m9h0J_structural_design_details/view',
    mindMapUrl: 'https://drive.google.com/file/d/1D9f-k8j_mind_map_structural_design/view',
    worksheetUrl: 'https://drive.google.com/file/d/1D_g-s7w_worksheet_packaging_design/view',
    referenceMaterialUrl: 'https://drive.google.com/file/d/1D_h-r3m_ref_structural_design/view',
    quizQuestions: [
      {
        id: 'pkg_q1',
        question: 'Which of the following corrugated flutes has the thinnest caliper but highest printing surface quality?',
        options: ['A-Flute', 'B-Flute', 'C-Flute', 'F-Flute'],
        correctAnswer: 3,
        type: 'multiple-choice'
      },
      {
        id: 'pkg_q2',
        question: 'Creasing allowance must be calculated in structural carton design to avoid bulging seams.',
        options: ['True', 'False'],
        correctAnswer: 0,
        type: 'true-false'
      }
    ]
  },
  {
    id: 'pkg_mod_2',
    title: 'Folding Carton Tolerances & Cutting Dies',
    description: 'In-depth analysis of folding box tolerances and die-board layout creation. Understanding cutting creases, nick sizes, rubbering profiles, and folding box board (FBB) fiber directions.',
    videoUrl: 'https://www.youtube.com/embed/gHj83hA_die',
    duration: '60 mins',
    category: 'packaging-engineer',
    order: 2,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1E8a_tolerances_carton/view',
    mindMapUrl: 'https://drive.google.com/file/d/1E9b_mindmap_tolerances/view',
    quizQuestions: [
      {
        id: 'pkg_s2_q1',
        question: 'In folding carton materials, fiber direction should run parallel to safe crease folds to prevent cracking.',
        options: ['True', 'False'],
        correctAnswer: 0,
        type: 'true-false'
      }
    ]
  },

  // 2. Production Art Engineer
  {
    id: 'prod_mod_1',
    title: 'Adobe Illustrator Vector Assets & Path Optimization',
    description: 'Learn vector optimization, redundant anchor point clean-ups, shape builder efficiencies, and layering conventions for industrial printing. Learn about overprinting and trapping basics.',
    videoUrl: 'https://www.youtube.com/embed/lCHY8K5fNqA',
    duration: '50 mins',
    category: 'production-art-engineer',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1F8a_vector_cleanup/view',
    mindMapUrl: 'https://drive.google.com/file/d/1F9b_mindmap_vectors/view',
    worksheetUrl: 'https://drive.google.com/file/d/1F_worksheet_optimization/view',
    quizQuestions: [
      {
        id: 'prod_q1',
        question: 'What is the purpose of "Trapping" in prepress production art?',
        options: [
          'To offset registration shifts between printing plates on press',
          'To color correct photographs',
          'To align folding carton glue flaps',
          'To reduce vector anchor points'
        ],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // 3. Print Ready Engineer
  {
    id: 'ready_mod_1',
    title: 'PDF/X Standards, Color Profiles, and Preflighting',
    description: 'Master industry standards for print-ready PDFs: PDF/X-1a, PDF/X-3, and PDF/X-4. Understand preflight checks in Adobe Acrobat Pro, ICC profile embeddings, and spot color separating.',
    videoUrl: 'https://www.youtube.com/embed/vO8v8vXPre',
    duration: '55 mins',
    category: 'print-ready-engineer',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1G8a_preflight/view',
    mindMapUrl: 'https://drive.google.com/file/d/1G9b_mindmap_preflight/view',
    quizQuestions: [
      {
        id: 'ready_q1',
        question: 'Which PDF/X standard is strictly restricted to CMYK and spot colors, without allowing RGB or device-independent colors?',
        options: ['PDF/X-4', 'PDF/X-3', 'PDF/X-1a', 'PDF/X-5'],
        correctAnswer: 2,
        type: 'multiple-choice'
      }
    ]
  },

  // 4. Plate Ready Engineer
  {
    id: 'plate_mod_1',
    title: 'Imposition Schemes & Large Format Platemaking',
    description: 'Understand sheet imposition logic, head-to-head, head-to-foot margins, grip edge, and color bar distributions. Learn about Computer-To-Plate (CTP) laser thermal platemaking and chemical processing.',
    videoUrl: 'https://www.youtube.com/embed/pPl1Y2_Plate',
    duration: '60 mins',
    category: 'plate-ready-engineer',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1H88_imposition/view',
    mindMapUrl: 'https://drive.google.com/file/d/1H99_mindmap_imposition/view',
    quizQuestions: [
      {
        id: 'plate_q1',
        question: 'What is the standard grip allowance safety margin margin on standard thermal aluminum plates?',
        options: ['2mm - 5mm', '10mm - 12mm', '0mm', '20mm - 25mm'],
        correctAnswer: 1,
        type: 'multiple-choice'
      }
    ]
  },

  // 5. Colour Retouching Engineer
  {
    id: 'colour_mod_1',
    title: 'CMYK Color Separation & Gray Component Replacement (GCR)',
    description: 'Learn advanced Adobe Photoshop color editing curves, spot channel creation, ink limit allocations (TAC / Total Area Coverage), and comparison between UCR (Under Color Removal) and GCR (Gray Component Replacement).',
    videoUrl: 'https://www.youtube.com/embed/cO9Y11_Color',
    duration: '65 mins',
    category: 'colour-retouching-engineer',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1I88_color_separation/view',
    mindMapUrl: 'https://drive.google.com/file/d/1I99_color_mindmap/view',
    quizQuestions: [
      {
        id: 'color_q1',
        question: 'What does a Total Area Coverage (TAC) ink limit percentage of 300% represent?',
        options: [
          'The maximum combined densitometer sum of CMYK screen values on a single point',
          'The transparency of spot coatings',
          'The drying speed of commercial offsets',
          'The resolution of plate screen lines'
        ],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // 6. Quality Control Engineer
  {
    id: 'qc_mod_1',
    title: 'Densitometry Standards & Color Difference deltaE',
    description: 'Study spectrophotometers, deltaE formulas (dE76, dE2000), density targets on press, and ISO 12647 printing standards. Learn the difference between dot gain (TVI) and mechanical slurs.',
    videoUrl: 'https://www.youtube.com/embed/qD1289_QC',
    duration: '40 mins',
    category: 'quality-control-engineer',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1J88_qc_densitometry/view',
    mindMapUrl: 'https://drive.google.com/file/d/1J99_qc_mindmap/view',
    quizQuestions: [
      {
        id: 'qc_q1',
        question: 'What deltaE (dE2000) threshold is generally accepted as the maximum unnoticeable color difference in high-end commercial folding carton packaging?',
        options: ['dE < 1.0', 'dE < 2.0', 'dE < 4.5', 'dE < 6.0'],
        correctAnswer: 1,
        type: 'multiple-choice'
      }
    ]
  },

  // 7. Printing and Packaging Cross Courses
  {
    id: 'cross_mod_1',
    title: 'Substrates and Ink Interactions',
    description: 'Overview of cellulose chemistry, moisture expansion in folding board, paper calipers (GSM, PT), offset paste inks, UV-curable inks, and curing dynamics on non-porous synthetic substrates (PP, PVC, PET).',
    videoUrl: 'https://www.youtube.com/embed/xO23_Cross_Ink',
    duration: '45 mins',
    category: 'printing-and-packaging-cross-courses',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1K88_cross_substrates/view',
    mindMapUrl: 'https://drive.google.com/file/d/1K99_cross_mindmap/view',
    quizQuestions: [
      {
        id: 'cross_q1',
        question: 'Paperboard expands and contracts mostly in the cross-grain direction (CD) relative to the grain direction (MD).',
        options: ['True', 'False'],
        correctAnswer: 0,
        type: 'true-false'
      }
    ]
  }
];
