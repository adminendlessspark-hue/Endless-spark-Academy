import { CourseModule } from './types';

// Concrete, high-quality, pre-defined course modules used as fallback
// when Firestore is offline or Google Cloud's daily free-tier quota is reached.
export const FALLBACK_COURSE_MODULES: CourseModule[] = [
  // ==========================================
  // 1. Packaging Engineer
  // ==========================================
  {
    id: 'pkg_mod_1',
    title: 'Introduction to Structural Packaging Design',
    description: 'Learn the fundamentals of sheet-fed packaging structures, creasing allowances, and corrugated flute types (A, B, C, E, F corrugated flutes). This module covers folding carton layout, CAD drawing layout preparation, and die-cutter tooling specifications.',
    videoUrl: 'https://www.youtube.com/embed/lA8g5Qre6P4',
    secondaryVideoUrl: 'https://www.youtube.com/embed/lA8g5Qre6P4',
    theoreticalVideoUrl: 'https://www.youtube.com/embed/lA8g5Qre6P4',
    duration: '45 mins',
    category: 'packaging-engineer',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1D8e-m9h0J_structural_design_details/view',
    mindMapUrl: 'https://drive.google.com/file/d/1D9f-k8j_mind_map_structural_design/view',
    worksheetUrl: 'https://drive.google.com/file/d/1D_g-s7w_worksheet_packaging_design/view',
    referenceMaterialUrl: 'https://drive.google.com/file/d/1D_h-r3m_ref_structural_design/view',
    videoScript: `In structural packaging design, understanding material caliper and flute profiles is essential. Flute types range from A-Flute (thickest cushioning) to F-Flute (micro-flute with premium printability). When generating carton CAD dielines, always calculate crease allowances to compensate for board thickness during 90-degree and 180-degree folding.`,
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
      },
      {
        id: 'pkg_q3',
        question: 'Explain why fiber grain direction must run perpendicular to the main crease score in a folding carton.',
        options: [],
        correctAnswer: 0,
        type: 'descriptive',
        answerKey: 'Grain direction perpendicular to crease lines ensures clean, crack-free folds and higher box compression test strength.'
      }
    ],
    onlineTestQuestions: [
      {
        id: 'pkg_ot1',
        question: 'What is the primary factor that determines the depth of a creasing channel on a counter matrix?',
        options: ['Machine speed', 'Board thickness (caliper) and rule width', 'Ink coverage percentage', 'Glue flap angle'],
        correctAnswer: 1,
        type: 'multiple-choice'
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
    worksheetUrl: 'https://drive.google.com/file/d/1E_worksheet_dies/view',
    referenceMaterialUrl: 'https://drive.google.com/file/d/1E_ref_cutting_dies/view',
    videoScript: `Laser-cut plywood die boards require precise bridge placements and nicks to hold blanks together during high-speed blanking and die-cutting. Ejection rubbers must be chosen based on shore hardness to prevent sheet distortion and tearing.`,
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
  {
    id: 'pkg_mod_3',
    title: 'Corrugated Box Strength & Compression Testing (BCT/ECT)',
    description: 'Learn Edge Crush Test (ECT), Box Compression Test (BCT) formulas (McKee formula), Bursting Strength (Mullen Test), and environmental humidity impact on shipping carton integrity.',
    videoUrl: 'https://www.youtube.com/embed/bct_ect_packaging',
    duration: '50 mins',
    category: 'packaging-engineer',
    order: 3,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1E_pkg3_assignment/view',
    mindMapUrl: 'https://drive.google.com/file/d/1E_pkg3_mindmap/view',
    quizQuestions: [
      {
        id: 'pkg_s3_q1',
        question: 'Which equation is standard in packaging engineering for estimating Box Compression Strength from ECT?',
        options: ['McKee Formula', 'Beer-Lambert Law', 'Euler-Bernoulli Beam Theory', 'Navier-Stokes Equation'],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },
  {
    id: 'pkg_mod_4',
    title: 'Rigid Luxury Boxes & Packaging Automation CAD',
    description: 'Specialized luxury packaging design: neck boxes, book-style rigid cartons, magnetic closure integrations, wrapped board V-cut grooving, and high-speed automated box wrapping workflows.',
    videoUrl: 'https://www.youtube.com/embed/rigid_box_cad_demo',
    duration: '55 mins',
    category: 'packaging-engineer',
    order: 4,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1E_pkg4_assignment/view',
    mindMapUrl: 'https://drive.google.com/file/d/1E_pkg4_mindmap/view',
    quizQuestions: [
      {
        id: 'pkg_s4_q1',
        question: 'In rigid box wrapping, what corner relief angle is standard to ensure clean paper turn-in without bulging?',
        options: ['45 degrees', '90 degrees', '15 degrees', '120 degrees'],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 2. Production Art Engineer
  // ==========================================
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
    videoScript: `Artwork prepared for offset or flexographic printing must have clean vector paths without excess bezier handles. Always separate dielines into non-printing spot color layers marked Overprint Stroke to prevent knocking out background graphics.`,
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
  {
    id: 'prod_mod_2',
    title: 'Overprint, Knockout Matrix & Dieline Separation',
    description: 'Master spot color overprint attributes, 100% K Black overprint defaults, white ink underprint for transparent foils, and structural dieline setup in Adobe Illustrator.',
    videoUrl: 'https://www.youtube.com/embed/overprint_knockout_demo',
    duration: '55 mins',
    category: 'production-art-engineer',
    order: 2,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1F_prod2_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1F_prod2_mindmap/view',
    quizQuestions: [
      {
        id: 'prod_q2',
        question: 'What happens if a spot UV varnish plate is mistakenly set to Knockout instead of Overprint?',
        options: [
          'The background artwork beneath the varnish will disappear (leave white holes)',
          'The varnish color will turn dark black',
          'The printer will automatically fix the file',
          'The varnish will become transparent'
        ],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },
  {
    id: 'prod_mod_3',
    title: 'Barcode Standards (EAN-13, UPC-A, QR) & Bar Width Reduction (BWR)',
    description: 'Learn ISO barcode sizing, quiet zone margins, magnification limits (80% to 200%), and Bar Width Reduction (BWR) to compensate for press ink spread.',
    videoUrl: 'https://www.youtube.com/embed/barcode_bwr_mastery',
    duration: '45 mins',
    category: 'production-art-engineer',
    order: 3,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1F_prod3_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1F_prod3_mindmap/view',
    quizQuestions: [
      {
        id: 'prod_q3',
        question: 'Why is Bar Width Reduction (BWR) applied when generating barcodes for flexo or offset printing?',
        options: [
          'To compensate for physical ink dot gain and press spread so bars do not merge',
          'To make the barcode smaller for compact packaging',
          'To change the UPC code into an EAN code',
          'To print in multiple CMYK plates'
        ],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 3. Print Ready Engineer
  // ==========================================
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
    worksheetUrl: 'https://drive.google.com/file/d/1G_worksheet_pdfx/view',
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
  {
    id: 'ready_mod_2',
    title: 'Bleed, Slugs, Transparency Flattening & Font Embedding',
    description: 'Practical guide to calculating minimum 3mm - 5mm bleed, safety margins, handling live transparencies in PDF/X-4 vs flattened PDF/X-1a, and embedding CID type font subsets.',
    videoUrl: 'https://www.youtube.com/embed/bleed_transparency_flattening',
    duration: '50 mins',
    category: 'print-ready-engineer',
    order: 2,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1G_ready2_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1G_ready2_mindmap/view',
    quizQuestions: [
      {
        id: 'ready_q2',
        question: 'What is the minimum industry standard bleed required for sheet-fed commercial print packaging?',
        options: ['0.5mm', '1mm', '3mm (0.125 in)', '15mm'],
        correctAnswer: 2,
        type: 'multiple-choice'
      }
    ]
  },
  {
    id: 'ready_mod_3',
    title: 'Acrobat Pro Preflight Fixups & Separation Output Preview',
    description: 'Learn to build automated preflight droplets, detect low-resolution images (< 300 DPI), convert RGB images to ISO Coated v2, and audit Total Area Coverage (TAC) warnings.',
    videoUrl: 'https://www.youtube.com/embed/acrobat_fixups_demo',
    duration: '45 mins',
    category: 'print-ready-engineer',
    order: 3,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1G_ready3_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1G_ready3_mindmap/view',
    quizQuestions: [
      {
        id: 'ready_q3',
        question: 'What effective resolution in DPI is standard for continuous-tone photographic images in offset printing?',
        options: ['72 DPI', '150 DPI', '300 DPI', '1200 DPI'],
        correctAnswer: 2,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 4. Plate Ready Engineer
  // ==========================================
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
        question: 'What is the standard grip allowance safety margin on standard thermal aluminum plates?',
        options: ['2mm - 5mm', '10mm - 12mm', '0mm', '20mm - 25mm'],
        correctAnswer: 1,
        type: 'multiple-choice'
      }
    ]
  },
  {
    id: 'plate_mod_2',
    title: 'Work & Turn vs. Work & Tumble Imposition Schemes',
    description: 'Master sheet layout mechanics: Work & Turn (same gripper edge, changing side guide) vs. Work & Tumble (changing gripper edge, same side guide) for multi-page book signatures and folding cartons.',
    videoUrl: 'https://www.youtube.com/embed/work_turn_tumble_demo',
    duration: '50 mins',
    category: 'plate-ready-engineer',
    order: 2,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1H_plate2_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1H_plate2_mindmap/view',
    quizQuestions: [
      {
        id: 'plate_q2',
        question: 'In a Work-and-Tumble imposition, does the paper gripper edge remain the same or change after turning?',
        options: ['It remains the same', 'It changes to the opposite edge (new gripper edge)', 'It rotates 45 degrees', 'No gripper is needed'],
        correctAnswer: 1,
        type: 'multiple-choice'
      }
    ]
  },
  {
    id: 'plate_mod_3',
    title: 'CTP Thermal Lasers, Calibration Curves & RIP Linearization',
    description: 'Learn 830nm thermal laser diode imaging, plate wash-out chemistry, plate dot gain linearization curves, and screening technologies (AM/Halftone vs. FM/Stochastic screening).',
    videoUrl: 'https://www.youtube.com/embed/ctp_laser_linearization',
    duration: '55 mins',
    category: 'plate-ready-engineer',
    order: 3,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1H_plate3_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1H_plate3_mindmap/view',
    quizQuestions: [
      {
        id: 'plate_q3',
        question: 'Which screening method varies the frequency of randomly dispersed micro-dots of constant size?',
        options: ['AM (Amplitude Modulated) Screening', 'FM (Frequency Modulated / Stochastic) Screening', 'Line screening', 'RGB screening'],
        correctAnswer: 1,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 5. Colour Retouching Engineer
  // ==========================================
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
  {
    id: 'colour_mod_2',
    title: 'Photoshop Channel Masks, Spot Varnishes & Metallic Channels',
    description: 'Creating custom fifth and sixth spot color channels for metallic foils, spot UV gloss varnishes, opaque white screen plates, and high-end cosmetic retouching.',
    videoUrl: 'https://www.youtube.com/embed/spot_channels_photoshop',
    duration: '50 mins',
    category: 'colour-retouching-engineer',
    order: 2,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1I_color2_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1I_color2_mindmap/view',
    quizQuestions: [
      {
        id: 'color_q2',
        question: 'Why must spot channels created for white ink or metallic foil be designated with a specific solidity percentage in Photoshop?',
        options: [
          'To simulate opacity on screen while preserving underlying image separations',
          'To convert the file into RGB automatically',
          'To lower the file size on disk',
          'To flatten all layers'
        ],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 6. Quality Control Engineer
  // ==========================================
  {
    id: 'qc_mod_1',
    title: 'Densitometry Standards & Color Difference deltaE (dE2000)',
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
  {
    id: 'qc_mod_2',
    title: 'TVI Tone Value Increase & Press Check Standardization',
    description: 'Audit dot gain (TVI curves), print contrast ratio, trapping efficiency formulas, and barcode ISO grade verification (grades A to F).',
    videoUrl: 'https://www.youtube.com/embed/tvi_press_audit',
    duration: '45 mins',
    category: 'quality-control-engineer',
    order: 2,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1J_qc2_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1J_qc2_mindmap/view',
    quizQuestions: [
      {
        id: 'qc_q2',
        question: 'What instrument is used on press to measure spectral reflectance and calculate L*a*b* coordinates?',
        options: ['Spectrophotometer', 'Tension meter', 'pH indicator paper', 'Magnifying loupe only'],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 7. Printing and Packaging Cross Courses
  // ==========================================
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
  },
  {
    id: 'cross_mod_2',
    title: 'UV / LED vs. Conventional Offset Ink Drying & Coating Dynamics',
    description: 'Deep dive into photo-initiators, UV polymerization curing vs oxidative penetration drying, aqueous coatings, soft-touch laminations, and blister pack heat-seal coatings.',
    videoUrl: 'https://www.youtube.com/embed/uv_led_coatings_demo',
    duration: '50 mins',
    category: 'printing-and-packaging-cross-courses',
    order: 2,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1K_cross2_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1K_cross2_mindmap/view',
    quizQuestions: [
      {
        id: 'cross_q2',
        question: 'What is the key advantage of UV LED ink curing over traditional infrared/spray powder drying in offset packaging?',
        options: [
          'Instant dry film polymerization without set-off powder or drying delays',
          'UV LED inks are made entirely of water',
          'No printing plates are needed',
          'It eliminates the need for dielines'
        ],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 8. Software Tool Library - Adobe Acrobat
  // ==========================================
  {
    id: 'sw_acrobat_1',
    title: 'Adobe Acrobat Pro Preflight & Output Preview Masterclass',
    description: 'Learn preflight checks, spot color remapping, object inspection, ink coverage analysis, and PDF/X verification using Adobe Acrobat Pro DC for commercial printing.',
    videoUrl: 'https://www.youtube.com/embed/acrobat_preflight_demo',
    duration: '35 mins',
    category: 'software-tool-library-acrobat',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1L_acrobat_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1L_acrobat_mindmap/view',
    quizQuestions: [
      {
        id: 'sw_ac_q1',
        question: 'In Adobe Acrobat Pro, which tool window allows you to preview individual CMYK plate separations and check total ink coverage percentage in real time?',
        options: ['Output Preview', 'Compare Files', 'Organize Pages', 'Edit PDF'],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 9. Software Tool Library - Adobe Illustrator
  // ==========================================
  {
    id: 'sw_illustrator_1',
    title: 'Adobe Illustrator Packaging Delineation, Layers & Trapping',
    description: 'Master structural CAD die-line layer isolation, spot ink swatches, vector path simplification, barcode creation, and automatic trapping setting in Adobe Illustrator.',
    videoUrl: 'https://www.youtube.com/embed/illustrator_packaging_demo',
    duration: '45 mins',
    category: 'software-tool-library-illustrator',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1M_illustrator_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1M_illustrator_mindmap/view',
    quizQuestions: [
      {
        id: 'sw_il_q1',
        question: 'Which panel in Adobe Illustrator controls the Overprint Fill and Overprint Stroke attributes?',
        options: ['Attributes Panel', 'Appearance Panel', 'Swatches Panel', 'Transform Panel'],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 10. Software Tool Library - Adobe Photoshop
  // ==========================================
  {
    id: 'sw_photoshop_1',
    title: 'Adobe Photoshop CMYK Separation, Retouching & TAC Limits',
    description: 'Advanced Photoshop retouching techniques for packaging graphics, CMYK channel separation, 300% Total Area Coverage (TAC) ink reduction curves, and spot varnish masks.',
    videoUrl: 'https://www.youtube.com/embed/photoshop_retouching_demo',
    duration: '40 mins',
    category: 'software-tool-library-photoshop',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1N_photoshop_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1N_photoshop_mindmap/view',
    quizQuestions: [
      {
        id: 'sw_ps_q1',
        question: 'Which color mode in Photoshop allows you to create custom Spot Channels alongside standard CMYK channels?',
        options: ['CMYK Color Mode', 'Indexed Color', 'Bitmap', 'Lab Color only'],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  },

  // ==========================================
  // 11. Quality Check Process
  // ==========================================
  {
    id: 'qc_proc_1',
    title: 'Standard Quality Check Process for Print & Packaging Artwork',
    description: 'Step-by-step Quality Control SOP for proof reading, barcode verification, deltaE spectrophotometer calibration, die-line alignment audit, and pre-press signoff checklists.',
    videoUrl: 'https://www.youtube.com/embed/qc_process_sop_demo',
    duration: '50 mins',
    category: 'quality-check-process',
    order: 1,
    assignmentPaperUrl: 'https://drive.google.com/file/d/1P_qc_proc_assign/view',
    mindMapUrl: 'https://drive.google.com/file/d/1P_qc_proc_mindmap/view',
    quizQuestions: [
      {
        id: 'qc_proc_q1',
        question: 'What is the final stage of Quality Check sign-off before committing plates to an industrial web or sheet press?',
        options: ['Certified Contract Digital Color Proof Verification & Client Prepress Signoff', 'Uncalibrated desktop print', 'Screenshot check', 'Oral confirmation only'],
        correctAnswer: 0,
        type: 'multiple-choice'
      }
    ]
  }
];

export const DEFAULT_FACULTY: any[] = [
  {
    id: "faculty-arul",
    name: "Arul",
    fullName: "Dr. Arul Kumar",
    email: "arul@endlesssparkcreativehub.in",
    username: "arul_faculty",
    role: "faculty",
    isApproved: true,
    applicationStatus: "approved",
    status: "active",
    registeredForDemo: false,
    quizCompleted: false,
    completedModules: [],
    videoRecorded: false,
    createdAt: "2026-08-01T00:00:00.000Z"
  }
];

export const DEFAULT_STUDENTS: any[] = [
  {
    id: "student-jagadeesh-a",
    name: "Jagadeesh A",
    fullName: "Jagadeesh A",
    email: "jagario93@gmail.com",
    username: "jagario93",
    role: "student",
    isApproved: true,
    applicationStatus: "approved",
    status: "active",
    registeredForDemo: true,
    quizCompleted: true,
    completedModules: [],
    videoRecorded: true,
    requestedCourses: ["print-ready-engineer", "production-art-engineer"],
    requestedCourse: "print-ready-engineer",
    assignedCourses: ["print-ready-engineer"],
    assignedCourse: "print-ready-engineer",
    nativeLanguage: "tamil",
    assignedFacultyId: "faculty-arul",
    assignedFaculty: "Arul",
    entranceTestStatus: "evaluated",
    entranceTestMarks: 39,
    admissionDate: "2026-08-01",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z"
  },
  {
    id: "student-ajay-lavis",
    name: "Ajay Lavis",
    fullName: "Ajay Lavis",
    email: "ajaylavis018@gmail.com",
    username: "Ajay",
    role: "student",
    isApproved: true,
    applicationStatus: "approved",
    status: "active",
    registeredForDemo: true,
    quizCompleted: false,
    completedModules: [],
    videoRecorded: false,
    requestedCourses: ["quality-control-engineer"],
    requestedCourse: "quality-control-engineer",
    assignedCourses: ["quality-control-engineer"],
    assignedCourse: "quality-control-engineer",
    nativeLanguage: "english",
    assignedFacultyId: "faculty-arul",
    assignedFaculty: "Arul",
    entranceTestStatus: "pending",
    admissionDate: "2026-08-05",
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z"
  },
  {
    id: "student-poongodi-thirunarayanan",
    name: "Poongodi Thirunarayanan",
    fullName: "Poongodi Thirunarayanan",
    email: "tpoongodi410@gmail.com",
    username: "tpoongodi410",
    role: "student",
    isApproved: true,
    applicationStatus: "approved",
    status: "active",
    registeredForDemo: true,
    quizCompleted: true,
    completedModules: [],
    videoRecorded: true,
    requestedCourses: ["packaging-engineer", "production-art-engineer"],
    requestedCourse: "packaging-engineer",
    assignedCourses: ["production-art-engineer"],
    assignedCourse: "production-art-engineer",
    nativeLanguage: "english",
    assignedFacultyId: "faculty-arul",
    assignedFaculty: "Arul",
    entranceTestStatus: "evaluated",
    entranceTestMarks: 56,
    admissionDate: "2026-08-10",
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z"
  },
  {
    id: "student-arumugam-palanisamy",
    name: "Arumugam Palanisamy",
    fullName: "Arumugam Palanisamy",
    email: "arumugambsccs@gmail.com",
    username: "arumugambsccs",
    role: "student",
    isApproved: true,
    applicationStatus: "approved",
    status: "active",
    registeredForDemo: true,
    quizCompleted: false,
    completedModules: [],
    videoRecorded: false,
    requestedCourses: ["packaging-engineer", "production-art-engineer"],
    requestedCourse: "packaging-engineer",
    assignedCourses: ["production-art-engineer"],
    assignedCourse: "production-art-engineer",
    nativeLanguage: "english",
    assignedFacultyId: "faculty-arul",
    assignedFaculty: "Arul",
    entranceTestStatus: "pending",
    admissionDate: "2026-08-12",
    createdAt: "2026-08-12T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z"
  },
  {
    id: "student-muthu-veeran",
    name: "MUTHU VEERAN.R",
    fullName: "MUTHU VEERAN.R",
    email: "muthuveeran1397@gmail.com",
    username: "Muthu",
    role: "student",
    isApproved: true,
    applicationStatus: "approved",
    status: "active",
    registeredForDemo: true,
    quizCompleted: false,
    completedModules: [],
    videoRecorded: false,
    requestedCourses: ["production-art-engineer", "packaging-engineer"],
    requestedCourse: "production-art-engineer",
    assignedCourses: ["production-art-engineer"],
    assignedCourse: "production-art-engineer",
    nativeLanguage: "english",
    assignedFacultyId: "faculty-arul",
    assignedFaculty: "Arul",
    entranceTestStatus: "pending",
    admissionDate: "2026-08-15",
    createdAt: "2026-08-15T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z"
  }
];

