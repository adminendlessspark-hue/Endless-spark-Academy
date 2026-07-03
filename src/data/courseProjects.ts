export interface ProjectData {
  title: string;
  filename: string;
  specs: string;
  desc: string;
  badge: string;
  activeStudents?: number;
}

export const getProjectsForCourse = (courseId: string): ProjectData[] => {
  const projectsData: { [key: string]: ProjectData[] } = {
    'packaging-engineer': [
      {
        title: 'PE_01_Luxury_Perfume_Box_CAD_V1',
        filename: 'Luxury_Perfume_Box_CAD_v1.ard',
        specs: '450 GSM Artboard | Structural Dieline | Tuck Closures | Nested Flaps',
        desc: 'Design a high-end luxury perfume rigid box with fully nested structural flaps and score-bend guidelines.',
        badge: 'CAD Verification Required',
        activeStudents: 4
      },
      {
        title: 'PE_02_Corrugated_Shipping_Container_CAD',
        filename: 'Corrugated_Shipping_Container_CAD.ard',
        specs: '125 ECT B-Flute Corrugated | RSC Style | Flap Overlap',
        desc: 'Calculate optimum sizing and structural load tolerance for an industrial corrugated master outer carton.',
        badge: 'Structural Check Required',
        activeStudents: 3
      },
      {
        title: 'PE_03_Tuck_Top_Carton_Dieline_Master',
        filename: 'Tuck_Top_Carton_Dieline_Master.ard',
        specs: '350 GSM SBS Board | Double-wall Base | Friction Fit Cherry Locks',
        desc: 'Construct a precise lock-bottom and friction top tuck closure carton dieline with exact crease compensations.',
        badge: 'Crease Alignment Required',
        activeStudents: 5
      },
      {
        title: 'PE_04_Rigid_Chocolate_Box_Nesting',
        filename: 'Luxury_Chocolate_Box_Cad_v1.ard',
        specs: '1200 GSM Greyboard | Base & Lid Wrap | Score-bend Guidelines',
        desc: 'Formulate flat-blank outer wrappers with score lines and nested corners for a deluxe 24-piece chocolate gift pack.',
        badge: 'CAD Verification Required',
        activeStudents: 2
      },
      {
        title: 'PE_05_Counter_Display_Unit_CDU_Structural',
        filename: 'Counter_Display_CDU_Structural.ard',
        specs: '500 GSM Artboard | Tiered Display Shelves | Header Card Lock',
        desc: 'Establish physical load-bearing tiers and header fold-back structures for a retail cosmetics tabletop display.',
        badge: 'Load Test Required',
        activeStudents: 2
      }
    ],
    'production-art-engineer': [
      {
        title: 'PA_04_Primary_Master Cashew Carton_Pack to Pack',
        filename: 'PA_04_Primary_Master_Cashew_Carton.pdf',
        specs: 'CMYK Coated FOGRA39 | 3.0mm Bleeds | Fonts Outlined',
        desc: 'Design a complete high-resolution outer folding box for organic cashew kernels, optimized with FOGRA39 standards.',
        badge: 'Pre-Flight Verification Required',
        activeStudents: 2
      },
      {
        title: 'PA_01_Secondary_Carton _Master_Cashew_Pack Style to Pack Style',
        filename: 'PA_01_Secondary_Carton_Master_Cashew.pdf',
        specs: 'CMYK Coated FOGRA39 | 3.0mm Bleeds | Spot Foil Layer',
        desc: 'Formulate press-ready secondary shelf packaging featuring dynamic layout transitions and custom spot metallic inks.',
        badge: 'Spot Foil Check Required',
        activeStudents: 4
      },
      {
        title: 'PA_03_Primary_Master_Cashew_Pouch_Recreation',
        filename: 'PA_03_Primary_Master_Cashew_Pouch_Recreation.pdf',
        specs: 'CMYK + White Layer | Flexible BOPP Film | Gloss Spot UV',
        desc: 'Recreate primary flexible stand-up pouch artwork layout ensuring continuous flow and matching registration lines.',
        badge: 'White Underprint Required',
        activeStudents: 3
      },
      {
        title: 'PA_02_Secondary_Carton _Variant_Almond',
        filename: 'PA_02_Secondary_Carton_Variant_Almond.pdf',
        specs: 'CMYK Coated FOGRA39 | 3.0mm Bleeds | Fonts Outlined',
        desc: 'Design a high-fidelity variant wrapper for standard almond line expansion, ensuring correct brand element registration.',
        badge: 'Variant Alignment Check',
        activeStudents: 3
      },
      {
        title: 'PA_05_Teritorey_corrugated box _Master_Cashew',
        filename: 'PA_05_Teritorey_corrugated_box_Master_Cashew.pdf',
        specs: 'Flexo 2-Color GRACoL | Flute Direction Marker | High Ink Coverage',
        desc: 'Set up brown Kraft paperboard outer shipping box artwork with physical flute directions and heavy duty trap margins.',
        badge: 'Flute Direction Check',
        activeStudents: 1
      }
    ],
    'print-ready-engineer': [
      {
        title: 'PR_01_Preflight_Check_FOGRA39_Catalog',
        filename: 'HighRes_Corporate_Catalog_PressReady.pdf',
        specs: 'PDF/X-4 compliant | Embedded ICC profiles | TAC < 300%',
        desc: 'Compile and audit a 16-page corporate prospectus ensuring total area coverage compliance for high-speed offset.',
        badge: 'PDF/X Verification Required',
        activeStudents: 6
      },
      {
        title: 'PR_02_Inposition_32Page_Section_Signature',
        filename: 'Inposition_32Page_Section_Signature.pdf',
        specs: '16-page signature | Work-and-Turn layout | Creep compensation',
        desc: 'Perform a complete 32-page sheet layout imposition taking paper caliper and creep into account to ensure flush margins.',
        badge: 'Imposition Audit Required',
        activeStudents: 4
      },
      {
        title: 'PR_03_RGB_to_CMYK_Profile_Audit_Log',
        filename: 'RGB_to_CMYK_Profile_Audit_Log.pdf',
        specs: 'FOGRA39 profile injection | Delta E threshold < 1.5',
        desc: 'Configure profile color mappings for deep rich black configurations without exceeding standard heavy ink limits.',
        badge: 'Color Space Verification',
        activeStudents: 3
      },
      {
        title: 'PR_04_Ink_Coverage_TAC_Optimizer_Report',
        filename: 'Ink_Coverage_TAC_Optimizer_Report.pdf',
        specs: 'TAC Optimizer | Max Ink limit 280% | GCR Setup',
        desc: 'Implement standard gray component replacement (GCR) policies to optimize production speeds and minimize offset dry-time.',
        badge: 'TAC Optimization Check',
        activeStudents: 5
      }
    ],
    'plate-ready-engineer': [
      {
        title: 'PL_01_CTP_Thermal_Laser_Calibration',
        filename: 'Shrink_Sleeve_Imposition_ThermalPlate.pdf',
        specs: 'AM Screening 175 LPI | Flexo Plate Relief 0.045" | 830nm Laser',
        desc: 'Determine correct label imposition nesting on standard photopolymer sheets and establish correct laser plate imaging parameters.',
        badge: 'CTP Calibration Required',
        activeStudents: 2
      },
      {
        title: 'PL_02_AM_Screening_175LPI_Halftone_Setup',
        filename: 'AM_Screening_175LPI_Halftone_Setup.pdf',
        specs: '175 Lines Per Inch | Elliptical Dot Shape | Screen Angles: C15 M75 Y0 K45',
        desc: 'Establish correct screen angles to prevent catastrophic moiré pattern interference during multi-color wet-on-wet runs.',
        badge: 'Screen Angle Audit',
        activeStudents: 3
      },
      {
        title: 'PL_03_Flexo_Plate_Relief_Anilox_Matching',
        filename: 'Flexo_Plate_Relief_Anilox_Matching.pdf',
        specs: 'Anilox cell count 800 LPI | BCM 1.8 | Floor thickness 0.032"',
        desc: 'Optimize flexographic backing and plate reliefs to guarantee clean solid print laydown and zero halftone dot-slurring.',
        badge: 'Anilox Match Verification',
        activeStudents: 4
      },
      {
        title: 'PL_04_Microgap_Compensation_Prepress_Plate',
        filename: 'Microgap_Compensation_Prepress_Plate.pdf',
        specs: 'Microgap overlap 0.02mm | Dot gain compensation curve',
        desc: 'Construct a precise calibration lookup table for high-speed cylinder plate mounting dot gain offsets.',
        badge: 'Calibration Verification',
        activeStudents: 2
      }
    ],
    'colour-retouching-engineer': [
      {
        title: 'CR_01_Spot_Separation_Pantone_Multichannel',
        filename: 'Beverage_Bottle_SpotChannels_Separated.psd',
        specs: 'Pantone Spot Channel | Specular Highlight Retouch | Gray Balance',
        desc: 'Isolate complex background gradients on a commercial beverage mockup and construct discrete custom spot color channels.',
        badge: 'Spot Separation Required',
        activeStudents: 5
      },
      {
        title: 'CR_02_Flesh_Tone_Spectral_Matching_Ad',
        filename: 'Flesh_Tone_Spectral_Matching_Ad.psd',
        specs: 'CMYK + Pantone 877C | Neutral Gray Replacement | Spectral Contrast',
        desc: 'Perform advanced tone adjustments on high-profile cosmetic model advertising sheets for maximum natural realism.',
        badge: 'Flesh Tone Calibration',
        activeStudents: 3
      },
      {
        title: 'CR_03_Gray_Balance_Neutral_Density_Correct',
        filename: 'Gray_Balance_Neutral_Density_Correct.psd',
        specs: 'G7 Master Standard | Neutral Density Curve matching',
        desc: 'Recalibrate ink density balances across four process plates to maintain highly consistent gray neutrality under varying lights.',
        badge: 'G7 Standard Check',
        activeStudents: 4
      },
      {
        title: 'CR_04_Beverage_Specular_Highlight_Retouch',
        filename: 'Beverage_Bottle_SpotChannels_Separated.psd',
        specs: 'Opacity mask retouch | Glass specular highlights correction',
        desc: 'Isolate high-gloss reflections on commercial beverage bottles to optimize printing without causing screen breaks.',
        badge: 'Highlight Separation Check',
        activeStudents: 2
      }
    ],
    'quality-control-engineer': [
      {
        title: 'QC_01_Spectrophotometer_DeltaE_Tolerance',
        filename: 'Cosmetic_Carton_Friction_Rub_Audit.pdf',
        specs: 'dE2000 < 1.0 vs Pantone | Rub test pass (100 cycles) | ANSI Grade A',
        desc: 'Formulate a systematic Quality Control and Spectrophotometric check-sheet for cosmetic box shipments.',
        badge: 'QC Standard Verification Required',
        activeStudents: 4
      },
      {
        title: 'QC_02_Rub_Resistance_Sutherland_Test_Log',
        filename: 'Rub_Resistance_Sutherland_Test_Log.pdf',
        specs: '100 Cycles | 4lb weight | Ink transfer percentage < 2%',
        desc: 'Configure testing logsheets for outer coating abrasion checks using standard mechanical friction systems.',
        badge: 'Sutherland Test Verify',
        activeStudents: 3
      },
      {
        title: 'QC_03_ANSI_Barcoded_Verification_Grade_A',
        filename: 'ANSI_Barcoded_Verification_Grade_A.pdf',
        specs: 'UPC-A barcode | ISO/IEC 15416 standard | Grade A verification',
        desc: 'Audit printed retail UPC barcodes for print contrast, modulation, and quiet-zone standards to ensure global scan readiness.',
        badge: 'ISO Barcode Check',
        activeStudents: 2
      },
      {
        title: 'QC_04_Crease_Stiffness_Carton_Friction_Lab',
        filename: 'Crease_Stiffness_Carton_Friction_Lab.pdf',
        specs: '90-degree fold | Resistance force < 150 mN',
        desc: 'Conduct physical carton stiffness measurements to protect high-speed packaging machine fold lines from failure.',
        badge: 'Folding Force Audit',
        activeStudents: 3
      }
    ],
    'printing-and-packaging-cross-courses': [
      {
        title: 'CC_01_Automated_HotFolder_Enfocus_Switch',
        filename: 'Combined_Automated_Prepress_Switch.pdf',
        specs: 'Enfocus XML Switch integration | Preflight hot-folder | Central imposition',
        desc: 'Configure and run a complete multi-process automated pre-flight pipeline for mixed offset and flexo packaging orders.',
        badge: 'Workflow Verification Required',
        activeStudents: 3
      },
      {
        title: 'CC_02_End_to_End_Dieline_to_Plate_Workflow',
        filename: 'End_to_End_Dieline_to_Plate_Workflow.pdf',
        specs: 'XML preflight metadata | Automatic trapping engine',
        desc: 'Track structural dieline exports from ESKO CAD through automated prepress art layout mapping onto plates.',
        badge: 'Integrity Check Required',
        activeStudents: 5
      },
      {
        title: 'CC_03_Offset_Flexo_Mixed_Production_Plan',
        filename: 'Offset_Flexo_Mixed_Production_Plan.pdf',
        specs: 'Process division logic | Hybrid screening (AM + FM)',
        desc: 'Design production division schedules for mixed packaging orders separating rigid boxes (offset) and wrappers (flexo).',
        badge: 'Hybrid Spec Review',
        activeStudents: 2
      }
    ]
  };

  return projectsData[courseId] || [];
};

export const getCapstoneProjectForCourse = (courseId: string): ProjectData => {
  const projects: { [key: string]: ProjectData } = {
    'packaging-engineer': {
      title: 'Luxury Chocolate Box CAD Construction',
      filename: 'Luxury_Chocolate_Box_Cad_v1.ard',
      specs: '450 GSM Artboard | Structural Dieline | Tuck Closures | Nested Flaps',
      desc: 'Design a high-end luxury chocolate rigid box with fully nested structural flaps and score-bend guidelines.',
      badge: 'CAD Verification Required'
    },
    'production-art-engineer': {
      title: 'Pre-press Perfume Box Production Artwork',
      filename: 'Perfume_Box_Cutfile_V3.pdf',
      specs: 'CMYK Coated FOGRA39 | 3.0mm Bleeds | Fonts Outlined',
      desc: 'Prepare the complete offset artwork wrapper for a 100ml luxury perfume container with specific spot foil layers.',
      badge: 'Pre-Flight Verification Required'
    },
    'print-ready-engineer': {
      title: 'High-Resolution Corporate Catalog Compilation',
      filename: 'HighRes_Corporate_Catalog_PressReady.pdf',
      specs: 'PDF/X-4 compliant | Embedded ICC profiles | TAC < 300%',
      desc: 'Compile and audit a 16-page corporate prospectus ensuring total area coverage compliance for high-speed offset.',
      badge: 'PDF/X Verification Required'
    },
    'plate-ready-engineer': {
      title: 'Shrink Sleeve Imposition & Thermal Imaging Setup',
      filename: 'Shrink_Sleeve_Imposition_ThermalPlate.pdf',
      specs: 'AM Screening 175 LPI | Flexo Plate Relief 0.045" | 830nm Laser',
      desc: 'Determine correct label imposition nesting on standard photopolymer sheets and establish correct laser plate imaging parameters.',
      badge: 'CTP Calibration Required'
    },
    'colour-retouching-engineer': {
      title: 'Multichannel Spot Color Separation & Retouch',
      filename: 'Beverage_Bottle_SpotChannels_Separated.psd',
      specs: 'Pantone Spot Channel | Specular Highlight Retouch | Gray Balance',
      desc: 'Isolate complex background gradients on a commercial beverage mockup and construct discrete custom spot color channels.',
      badge: 'Spot Separation Required'
    },
    'quality-control-engineer': {
      title: 'Cosmetic Carton Friction & Rub Audit System',
      filename: 'Cosmetic_Carton_Friction_Rub_Audit.pdf',
      specs: 'dE2000 < 1.0 vs Pantone | Rub test pass (100 cycles) | ANSI Grade A',
      desc: 'Formulate a systematic Quality Control and Spectrophotometric check-sheet for cosmetic box shipments.',
      badge: 'QC Standard Verification Required'
    },
    'printing-and-packaging-cross-courses': {
      title: 'Combined Automated Prepress Switch Protocol',
      filename: 'Combined_Automated_Prepress_Switch.pdf',
      specs: 'Enfocus XML Switch integration | Preflight hot-folder | Central imposition',
      desc: 'Configure and run a complete multi-process automated pre-flight pipeline for mixed offset and flexo packaging orders.',
      badge: 'Workflow Verification Required'
    }
  };

  return projects[courseId] || projects['production-art-engineer'];
};
