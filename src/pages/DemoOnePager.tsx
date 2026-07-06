import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowLeft, 
  LayoutDashboard, 
  Play, 
  CheckCircle2, 
  XCircle, 
  BrainCircuit, 
  FileText, 
  Cpu, 
  Layers, 
  Maximize2, 
  User, 
  Compass, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  ChevronDown,
  Laptop, 
  Check, 
  RotateCcw,
  BookOpen, 
  FolderOpen,
  Calendar, 
  UploadCloud,
  Loader2,
  FileCheck2,
  Send,
  Download,
  Video
} from 'lucide-react';
import { cn } from '../utils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { generateGeminiContent } from '../services/gemini';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../AuthContext';
import { getProjectsForCourse, getCapstoneProjectForCourse } from '../data/courseProjects';

// Predefined Mock Projects for Showcase
const DEMO_PROJECTS = [
  {
    title: 'Precision Corrugated Packaging',
    type: 'Packaging Design',
    category: 'Packaging Specialist',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
    bleed: '3mm Offset',
    colors: 'CMYK (Fogra 39)',
    fonts: 'Outlined',
    status: 'Certified Pass',
    feedback: 'Excellent folding tolerances. The glue margins conform perfectly to standard automatic folders.',
    score: 98
  },
  {
    title: 'Premium Cosmetic Box Die-Cut',
    type: 'Die-line Layout',
    category: 'Packaging Specialist',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=600',
    bleed: '5mm Bleed Area',
    colors: 'CMYK + 1 Spot (Pantone 872C)',
    fonts: 'Outlined',
    status: 'Certified Pass',
    feedback: 'Registration marks are correctly offset. Spot gold channel matches production standards.',
    score: 95
  },
  {
    title: 'High-Density Marketing Brochure',
    type: 'Multi-page Layout',
    category: 'Print Ready Engineer',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    bleed: 'None (Warning)',
    colors: 'RGB Mode (Critical Error)',
    fonts: 'Unoutlined (Warning)',
    status: 'Failed Preflight',
    feedback: 'Critical issues: Layout is in RGB. Color shifting will occur during plate production. No bleed is provided.',
    score: 42
  }
];

// Presets for Pre-flight Artwork Analyzer
const PREFLIGHT_PRESETS = [
  {
    id: 'pass_pack',
    name: 'Certified Cosmetic Packaging Draft (PDF)',
    colorSpace: 'CMYK',
    bleed: '3.0 mm',
    fontsOutlined: true,
    resolution: '300 DPI',
    status: 'PASS',
    issues: [],
    fileSize: '14.2 MB'
  },
  {
    id: 'fail_rgb',
    name: 'Marketing Brochure Banner (AI)',
    colorSpace: 'RGB (Profile Mismatch)',
    bleed: '0.0 mm (Missing)',
    fontsOutlined: false,
    resolution: '72 DPI (Low Res)',
    status: 'FAIL',
    issues: [
      'Document contains RGB images. Convert to CMYK for accurate ink reproduction.',
      'Bleed margin is missing. Cutting tolerances will cause white borders on physical prints.',
      'Text contains active system fonts. Font "Helvetica-Bold" must be outlined to prevent substitution.'
    ],
    fileSize: '24.8 MB'
  },
  {
    id: 'pass_flyer',
    name: 'Offset Flyer Plate Layout (PDF)',
    colorSpace: 'CMYK',
    bleed: '3.0 mm',
    fontsOutlined: true,
    resolution: '450 DPI',
    status: 'PASS',
    issues: [],
    fileSize: '8.4 MB'
  }
];

const getSyllabusForCourse = (courseId: string, dbModules: any[]) => {
  const filteredDb = dbModules.filter(m => m.category === courseId);
  return filteredDb.map((m, idx) => ({
    num: String(idx + 1).padStart(2, '0'),
    title: m.title,
    desc: m.description || '',
    topics: m.topics || [],
    status: idx < 2 ? 'Completed' : idx === 2 ? 'In Progress' : 'Upcoming',
    badgeClass: idx < 2 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : idx === 2 ? 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200'
  }));
};

// Delegated to imported functions from /src/data/courseProjects.ts
;

interface DemoOnePagerProps {
  isAdminMode?: boolean;
}

export default function DemoOnePager({ isAdminMode = false }: DemoOnePagerProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { financialSettings } = useSettings();
  const [selectedDemoCourseId, setSelectedDemoCourseId] = useState<string>('production-art-engineer');
  const [selectedProjectIdx, setSelectedProjectIdx] = useState<number>(0);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [studentProjects, setStudentProjects] = useState<any[]>([]);

  useEffect(() => {
    setSelectedProjectIdx(0);
  }, [selectedDemoCourseId]);

  const defaultCourseModules = [
    { id: 'packaging-engineer', title: 'Diploma in Packaging Engineer', durationMonths: 6, fees: 60000, description: 'Master structural & technical aspects of CAD packaging.' },
    { id: 'production-art-engineer', title: 'Diploma in Production Art Engineer', durationMonths: 6, fees: 50000, description: 'Prepare artwork to press-ready perfection.' },
    { id: 'print-ready-engineer', title: 'Diploma in Print Ready Engineer', durationMonths: 6, fees: 55000, description: 'Establish dynamic color proofs & pre-flight setups.' },
    { id: 'plate-ready-engineer', title: 'Diploma in Plate Ready Engineer', durationMonths: 6, fees: 52000, description: 'Pre-press operations and industrial plate laser calibration.' },
    { id: 'colour-retouching-engineer', title: 'Diploma in Colour Retouching Engineer', durationMonths: 6, fees: 58000, description: 'Advanced global color separation & tonal image correction.' },
    { id: 'quality-control-engineer', title: 'Diploma in Quality Control Engineer', durationMonths: 6, fees: 48000, description: 'Conduct structural measurement metrics & quality checks.' },
    { id: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses', durationMonths: 12, fees: 95000, description: 'Pre-press, production artwork, plate making cross-disciplinary curriculum.' }
  ];

  const coursesList = (financialSettings?.coursesConfig && Array.isArray(financialSettings.coursesConfig) && financialSettings.coursesConfig.length > 0)
    ? financialSettings.coursesConfig.map((c: any) => {
        const id = c.courseId || '';
        const defaultMatch = defaultCourseModules.find(d => d.id === id);
        return {
          id,
          title: c.title || defaultMatch?.title || id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          durationMonths: c.durationMonths || defaultMatch?.durationMonths || 6,
          fees: c.fees || defaultMatch?.fees || 50000,
          description: c.description || defaultMatch?.description || ''
        };
      })
    : defaultCourseModules;

  const selectedCourse = coursesList.find(c => c.id === selectedDemoCourseId) || coursesList[0];
  const selectedCourseSyllabus = getSyllabusForCourse(selectedCourse.id, courseModules);
  const selectedCourseCapstone = getCapstoneProjectForCourse(selectedCourse.id);

  const getDisplayProjects = (courseId: string) => {
    const dbProjects = studentProjects.filter((p: any) => p.courseId === courseId);

    if (dbProjects.length > 0) {
      return dbProjects.map((proj: any, idx: number) => {
        let specsStr = 'CMYK Coated FOGRA39 | 3.0mm Bleeds';
        if (proj.printerSpec?.artworkInfo) {
          const info = proj.printerSpec.artworkInfo;
          specsStr = `${info.bleed || '3.0mm'} Bleed | ${proj.printerSpec.printMethod || 'Offset'} | ${info.maxInkCoverage || '300% TAC'}`;
        } else if (proj.details && proj.details.length < 100) {
          specsStr = proj.details;
        }

        const filename = proj.clientBrief?.fileName || proj.projectFileUrl || proj.googleDriveLink || 'artwork_v1.pdf';
        let cleanFilename = filename;
        if (filename.includes('/') && !filename.startsWith('http')) {
          cleanFilename = filename.split('/').pop() || filename;
        }

        let badge = 'Pre-Flight Verification';
        if (proj.status === 'approved') {
          badge = 'Certified Pass';
        } else if (proj.status === 'qc') {
          badge = 'QC Review Required';
        } else if (proj.status === 'production' || proj.status === 'pqc') {
          badge = 'Production Checking';
        }

        return {
          title: proj.title || 'Untitled Student Project',
          projectCode: proj.projectCode || '',
          studentName: proj.studentName || '',
          courseName: proj.courseName || '',
          filename: cleanFilename,
          specs: specsStr,
          desc: proj.details || proj.clientBrief?.briefDetails || 'Review artwork specifications and preflight compliance.',
          badge: badge,
          activeStudents: 1
        };
      });
    }

    // Fallback: If no projects exist in the database for this course, return the pre-defined capstone project course-wise.
    const cap = getCapstoneProjectForCourse(courseId);
    return [{
      title: cap.title,
      projectCode: 'CAPSTONE',
      studentName: user?.name || 'Student',
      courseName: coursesList.find((c: any) => c.id === courseId)?.title || '',
      filename: cap.filename,
      specs: cap.specs,
      desc: cap.desc,
      badge: cap.badge || 'Verification Required',
      activeStudents: 1
    }];
  };

  useEffect(() => {
    const q = query(collection(db, 'course_modules'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourseModules(docs);
    }, (err) => {
      console.error("Firestore subscription failed for course modules:", err);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setStudentProjects([]);
      return;
    }

    let q;
    const isStaff = ['admin', 'faculty', 'qc', 'telecaller', 'accounts_executive', 'marketing'].includes(user.role || '');
    if (isStaff) {
      q = query(collection(db, 'student_projects'));
    } else {
      q = query(collection(db, 'student_projects'), where('studentId', '==', user.id));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentProjects(docs);
    }, (err) => {
      console.error("Firestore subscription failed for student projects:", err);
    });
    return () => unsub();
  }, [user]);
  
  // Tabs: 'journey' (Student Dashboard), 'ai' (AI Tutor Playground), 'preflight' (Artwork Checker), 'projects' (Showcase)
  const [activeTab, setActiveTab] = useState<'journey' | 'ai' | 'preflight' | 'projects'>('journey');

  // Student Dashboard Simulator state
  const [dashboardStage, setDashboardStage] = useState<1 | 2 | 3 | 4 | 5>(4);

  // Entrance Assessment Demo MCQ State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);

  // Mini AI Tutor Simulator State
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: "Hello! I am your Printing & Packaging Expert AI. Select a topic or type any question below to see me analyze print specifications, explain trapping tolerances, or write Adobe automation scripts!" }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Preflight Simulator State
  const [selectedPreset, setSelectedPreset] = useState<string>('pass_pack');
  const [isPreflighting, setIsPreflighting] = useState(false);
  const [preflightProgress, setPreflightProgress] = useState(0);
  const [preflightResult, setPreflightResult] = useState<any | null>(null);

  // MCQs for Stage 3 Demo
  const MOCK_MCQS = [
    {
      question: "Choose the sentence that is grammatically correct and uses the appropriate punctuation.",
      options: [
        "A. Its essential to verify the document before sending it to the client, especially since they have strict guidelines.",
        "B. It's essential to verify the document before sending it to the client, especially since they have strict guidelines.",
        "C. It's essential to verify the document before sending it to the client especially since they have strict guidelines.",
        "D. Its essential to verify the document before sending it to the client; especially since they have strict guidelines."
      ],
      correct: 1,
      explanation: "'It's' is the contraction of 'it is' (necessary here), and the comma properly offsets the dependent clause starting with 'especially since.'"
    },
    {
      question: "If all designers are engineers, and some engineers are printers, which of the following statements must be true?",
      options: [
        "A. Some designers are printers.",
        "B. All printers are designers.",
        "C. Some engineers are designers.",
        "D. No designers are printers."
      ],
      correct: 2,
      explanation: "Since all designers are engineers, any designer is also an engineer. Therefore, there must be some engineers who are designers (specifically, the designers themselves)."
    }
  ];

  // Submit Answer to MCQ demo
  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;
    setHasSubmittedAnswer(true);
  };

  // Reset MCQ Demo
  const handleResetMCQ = () => {
    setSelectedAnswer(null);
    setHasSubmittedAnswer(false);
    setCurrentQuestionIdx((prev) => (prev + 1) % MOCK_MCQS.length);
  };

  // Send message to real Gemini AI (with bulletproof mock fallbacks if API is missing or fails)
  const handleSendAiMessage = async (customPrompt?: string) => {
    const text = customPrompt || aiChatInput;
    if (!text.trim()) return;

    const userMsg = { role: 'user' as const, content: text };
    setAiMessages(prev => [...prev, userMsg]);
    setAiChatInput('');
    setIsAiResponding(true);

    try {
      // Call the real backend Gemini proxy API
      const result = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: 'user',
            parts: [{
              text: `You are an expert AI assistant at Endless Spark School of Printing and Packaging. 
Answer the following question about printing technology, color models (CMYK/RGB), trapping, bleed, imposition, offset lithography, flexography, rotogravure, screen printing, prepress workflows, or quality auditing.
Provide a clear, detailed, and highly professional explanation formatted in elegant Markdown. If relevant, include lists or code snippets. Keep it educational and concise.
Question: ${text}`
            }]
          }
        ],
        config: {
          temperature: 0.7,
        }
      });

      const reply = result.text || "I'm sorry, I couldn't generate a response.";
      setAiMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (apiError: any) {
      console.warn("Gemini API call failed, using high-fidelity pre-press database fallback:", apiError);
      
      // Determine response from the extensive print expert knowledge base
      let reply = "";
      const normalized = text.toLowerCase();

      if (normalized.includes('surface print') || normalized.includes('surface printing')) {
        reply = "### Understanding Surface Printing\n\n**Surface Printing** is one of the oldest mechanical printing processes, primarily used today for traditional wall coverings, tactile wrapping papers, and textured packaging. In surface printing, ink is transferred directly from raised engravings on a metal or polyurethane cylinder with zero cushioning.\n\n*   **Ink Film Thickness**: Surface printing applies a significantly thicker ink film than modern flexography or offset lithography, leaving a rich, tactile, and slightly raised ink deposit.\n*   **Visual Characteristics**: This method results in a beautifully soft, hand-painted look with organic, slightly bleeding edges due to wet-on-wet ink applications.\n*   **Substrates**: Primarily heavyweight paper stocks, premium wallpapers, and specialty packaging boxes.\n*   **Modern Alternatives**: For most modern high-speed high-resolution packaging, **Flexography** or **Rotogravure** is preferred for efficiency and fine detail reproduction.";
      } else if (normalized.includes('trapping')) {
        reply = "### Understanding Printing Trapping\n\n**Trapping** is the intentional overlap of adjacent colors in prepress design to prevent tiny white gaps on press caused by paper expansion/shrinkage, mechanical vibration, or plate registration tolerance.\n\n*   **Spread Trap**: A lighter foreground object expands slightly into a darker background color. The boundary line expands outwards.\n*   **Choke Trap**: A lighter background pushes slightly into a darker foreground shape. The boundary line shrinks inwards.\n*   **Standard Tolerance**: In sheetfed commercial offset printing, standard trapping width ranges from **0.08mm to 0.15mm** (roughly 0.25pt to 0.5pt). Flexographic printing on corrugated board requires wider trapping of **0.5mm to 1.0mm** due to the rougher registration nature of soft polymer plates.";
      } else if (normalized.includes('cmyk') || normalized.includes('rgb') || normalized.includes('color model') || normalized.includes('colour model')) {
        reply = "### RGB vs CMYK Print Standards\n\n*   **RGB (Red, Green, Blue)** is an **additive color model** used for light-emitting digital screens. Mixing all three primaries produces pure white. Its color gamut is extremely wide.\n*   **CMYK (Cyan, Magenta, Yellow, Key/Black)** is a **subtractive color model** representing physical inks mixing on paper. Mixing all primaries absorbs light and produces a dark muddy brown, which is why a separate black plate (K) is required. Its gamut is narrower than RGB.\n*   **The Conversion Issue**: If you send RGB files to an offset plate, colors will convert automatically at the Raster Image Processor (RIP) stage. This automatic conversion leads to **muddy tones, dark shadows, and desaturated blues or greens**.\n*   **Pre-press Standard**: Professional pre-flight rules strictly mandate converting files to *CMYK (e.g., Coated FOGRA39 or GRACoL2006)* and manually adjusting critical brand colors before submitting files to plates.";
      } else if (normalized.includes('bleed')) {
        reply = "### The Importance of Bleed Bounds\n\nWhen printing physical items, the printed sheets are stacked and cut to size using high-speed guillotine cutters or rotary die-cutters. Slight mechanical cutting deviations (usually ±0.5mm to ±2.0mm) are standard physical limits.\n\n*   **Without Bleed**: If the background color ends exactly on the trim line, cutting deviations will leave a **visible white paper margin** on the edges of the final trimmed piece.\n*   **Standard Bleed**: Standard offset lithography jobs require at least **3.0 mm (0.125 inches)** of artwork extended beyond the final trim line to ensure clean cutting. Large-format corrugated packaging or soft flexible bags can require up to **5.0 mm** of bleed bounds.\n*   **Safe Zone**: Keep all critical text, logos, and interactive elements at least **3.0mm inside** the trim line (the safe margin) to prevent them from being cut off during trimming.";
      } else if (normalized.includes('flexo') || normalized.includes('flexography')) {
        reply = "### Flexography Production Standards\n\n**Flexography** uses flexible, raised photopolymer relief plates wrapped around rotating cylinders to print on a wide range of substrates, including plastics, metallic films, labels, and corrugated board.\n\n*   **Plate Relief**: Standard photopolymer plate relief is typically between **0.015\" and 0.045\"** depending on the substrate, protecting non-image areas from touching ink.\n*   **Anilox Rolls**: Flexo relies on engraved ceramic **Anilox rolls** to meter precise ink volumes (measured in BCM - Billion Cubic Microns per square inch). High-cell count rolls are used for fine half-tone screens, while low-cell counts apply thick solids.\n*   **Substrates**: Outstanding for flexible food packaging, heat-shrink sleeves, and self-adhesive labels.";
      } else if (normalized.includes('offset') || normalized.includes('lithography')) {
        reply = "### Offset Lithography Guidelines\n\n**Offset Lithography** is the gold standard for high-volume commercial print, using the chemical principle that oil (ink) and water (fountain solution) do not mix.\n\n*   **Ink/Water Balance**: Precision control of fountain solution (water, alcohol substitute, acid buffers) and greasy inks is critical to prevent ink from adhering to non-image areas (scumming).\n*   **Screen Ruling**: Standard high-quality commercial work is run at **150 to 175 LPI** (Lines Per Inch) using Amplitude Modulated (AM) screening, or custom FM stochastic screening for photorealistic prints.\n*   **Blanket Cylinder**: The inked plate transfers the image to a rubber blanket cylinder, which then 'offsets' it onto the paper. This rubber blanket accommodates surface irregularities of different paper textures.";
      } else if (normalized.includes('script') || normalized.includes('illustrator') || normalized.includes('automation') || normalized.includes('javascript')) {
        reply = "### Automated Illustrator Outlining Script\n\nHere is a production-tested **ExtendScript** code snippet to automatically locate and outline all text frames in an open Adobe Illustrator document before saving:\n\n```javascript\n// Autogenerated by Endless Spark AI\n(function() {\n  if (app.documents.length === 0) {\n    alert('No active documents open!');\n    return;\n  }\n  var doc = app.activeDocument;\n  var textFrames = doc.textFrames;\n  var outlinedCount = 0;\n  \n  for (var i = textFrames.length - 1; i >= 0; i--) {\n    var tf = textFrames[i];\n    if (tf.locked || tf.layer.locked || !tf.layer.visible) continue;\n    try {\n      tf.createOutline();\n      outlinedCount++;\n    } catch (e) {\n      // Safe fallback if outline fails on empty frames\n    }\n  }\n  alert('Outlining completed successfully! ' + outlinedCount + ' text frames verified and outlined.');\n})();\n```";
      } else {
        reply = `### Endless Spark Print AI Assistant\n\nI can definitely help you with that! In professional print and packaging engineering, precise standards are key. \n\n*   **Your Query**: "${text}"\n*   **Context**: Under standard prepress, this relates to **mechanical plate calibration** and **color management workflow**.\n\nTo give you the most accurate solution, could you specify your target print process? We specialize in **Offset Lithography (FOGRA39)**, **Flexography (corrugated/shrink-sleeve)**, and **Digital Variable production**.\n\nFeel free to ask about standard **trapping limits**, **bleed tolerances**, **RGB-to-CMYK conversion**, or automated **Illustrator ExtendScripts**!`;
      }

      // Stagger slightly to mimic real response times if fallback is used
      await new Promise(resolve => setTimeout(resolve, 800));
      setAiMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Preflight Preset Audit Simulation
  const handleRunPreflight = () => {
    setIsPreflighting(true);
    setPreflightProgress(0);
    setPreflightResult(null);

    const interval = setInterval(() => {
      setPreflightProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPreflighting(false);
          const found = PREFLIGHT_PRESETS.find(p => p.id === selectedPreset);
          setPreflightResult(found || null);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  return (
    <div className="text-slate-800 flex flex-col font-sans min-h-screen bg-slate-50">
      
      {/* Top Banner & Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-purple-600/10 to-indigo-600/10 opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
        
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 font-bold text-xs uppercase tracking-widest rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                {isAdminMode ? "Admin Demonstration & Roadmap Center" : "Live Dynamic Experience One-Pager"}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
                {isAdminMode ? "Course Demonstration" : "Interactive"}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-indigo-400">Demo Center</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
                {isAdminMode 
                  ? "Demonstrate the complete student workflow, the real-time AI Printing Consultant playground, and live pre-flight packaging/artwork checker modules to potential students."
                  : "Experience the comprehensive student workflow, test our real-time AI Printing Consultant, and inspect the automated artwork pre-flight checkers of the **Endless Spark School of Printing and Packaging** in one place."
                }
              </p>
            </div>

            {isAdminMode ? (
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => navigate('/admin')}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
                  id="demo-back-admin-btn"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Admin Panel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => navigate('/')}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
                  id="demo-back-home-btn"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Landing Page
                </button>
                <button 
                  onClick={() => navigate('/book-consultation')}
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-900/30 flex items-center gap-2"
                  id="demo-book-direct-btn"
                >
                  <Calendar className="w-4 h-4" />
                  Book 1-on-1 Demo Slot
                </button>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-8 border-b border-slate-800 pb-px">
            <button
              onClick={() => setActiveTab('journey')}
              className={cn(
                "px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2.5",
                activeTab === 'journey' 
                  ? "border-pink-500 text-white bg-slate-800/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
              id="demo-tab-journey"
            >
              <LayoutDashboard className="w-4 h-4" />
              Student Journey Simulator
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={cn(
                "px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2.5",
                activeTab === 'ai' 
                  ? "border-pink-500 text-white bg-slate-800/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
              id="demo-tab-ai"
            >
              <BrainCircuit className="w-4 h-4" />
              AI Printing Tutor Sandbox
            </button>
            <button
              onClick={() => setActiveTab('preflight')}
              className={cn(
                "px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2.5",
                activeTab === 'preflight' 
                  ? "border-pink-500 text-white bg-slate-800/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
              id="demo-tab-preflight"
            >
              <FileCheck2 className="w-4 h-4" />
              Pre-flight Artwork Checker
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={cn(
                "px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2.5",
                activeTab === 'projects' 
                  ? "border-pink-500 text-white bg-slate-800/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
              id="demo-tab-projects"
            >
              <Layers className="w-4 h-4" />
              Interactive Project Portfolio
            </button>
          </div>
        </div>
      </header>

      {/* Main Sandbox Area */}
      <main className="flex-grow max-w-[90rem] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Student Journey Simulator */}
          {activeTab === 'journey' && (
            <motion.div
              key="journey"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              {/* Left Selector: Steps */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Student Journey Stages</h3>
                  <p className="text-xs text-slate-500 mb-5">
                    Click each phase below to view the exact dashboard state, features, and required checks the student experiences at that point in the portal.
                  </p>

                  <div className="space-y-3">
                    {[
                      { num: 1, name: 'Phase 1: Registration Complete', desc: 'Pre-requisite video & registration verification.' },
                      { num: 2, name: 'Phase 2: Self-Care & Wellness', desc: '15-minute mandatory morning routine module.' },
                      { num: 3, name: 'Phase 3: Entrance Assessment', desc: 'Interactive grammar & logic MCQ test.' },
                      { num: 4, name: 'Phase 4: Verified Class Modules', desc: 'Access to dynamic syllabus, tools, & AI assistance.' },
                      { num: 5, name: 'Phase 5: Capstone Project Draft', desc: 'PDF upload, automated pre-flight audit & pass.' }
                    ].map((stg) => (
                      <button
                        key={stg.num}
                        onClick={() => setDashboardStage(stg.num as any)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border transition-all flex gap-3.5 items-start group relative overflow-hidden",
                          dashboardStage === stg.num 
                            ? "border-pink-600 bg-pink-50/50 shadow-sm" 
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        )}
                        id={`journey-step-btn-${stg.num}`}
                      >
                        {dashboardStage === stg.num && (
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-600" />
                        )}
                        <span className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs mt-0.5",
                          dashboardStage === stg.num 
                            ? "bg-pink-600 text-white" 
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        )}>
                          {stg.num}
                        </span>
                        <div>
                          <h4 className={cn("text-xs font-bold uppercase tracking-wider", dashboardStage === stg.num ? "text-pink-600" : "text-slate-800")}>
                            {stg.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{stg.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 border border-indigo-800 shadow-md relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                  <Cpu className="w-8 h-8 text-indigo-400 mb-3" />
                  <h4 className="font-bold text-sm mb-1.5">Interactive Multi-Role System</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This portal operates seamlessly with dedicated interfaces for **Students**, **Faculty coordinators**, **Telecallers**, and **Quality Control (QC)** departments. Any project upload or registration automatically propagates through Firestore.
                  </p>
                </div>
              </div>

              {/* Right: Live Frame Rendering */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="bg-slate-900 rounded-[2rem] border-8 border-slate-850 shadow-2xl relative overflow-hidden flex-grow flex flex-col min-h-[500px]">
                  
                  {/* Mock Browser Header */}
                  <div className="bg-slate-850 px-6 py-3.5 border-b border-slate-800 flex items-center gap-2">
                    <div className="flex gap-1.5 shrink-0">
                      <span className="w-3 h-3 rounded-full bg-rose-500 block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500 block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
                    </div>
                    <div className="bg-slate-900 rounded-lg px-4 py-1 text-[10px] text-slate-400 font-mono flex-grow max-w-sm mx-auto text-center truncate select-none border border-slate-800">
                      https://endlesssparkcreativehub.in/student/dashboard?stage={dashboardStage}
                    </div>
                    <span className="px-3 py-1 bg-pink-500/20 text-pink-400 text-[10px] font-bold rounded-md uppercase border border-pink-500/20">
                      Live Mock Preview
                    </span>
                  </div>

                  {/* Browser Content */}
                  <div className="bg-white flex-grow p-6 sm:p-8 flex flex-col text-slate-800">
                    
                    {/* Stage 1 Render */}
                    {dashboardStage === 1 && (
                      <div className="flex-grow flex flex-col justify-center max-w-xl mx-auto text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                          <Compass className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to Endless Spark!</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                          Thank you for registering. Before accessing the entrance assessment and professional training coursework, you must complete your initial profile verification.
                        </p>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left mb-6">
                          <h4 className="text-xs font-bold uppercase text-slate-700 mb-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> Required Pre-Flight Steps:
                          </h4>
                          <ul className="text-xs text-slate-600 space-y-1.5 pl-5 list-disc">
                            <li>Upload official educational transcripts.</li>
                            <li>Accept the school code of conduct & print guidelines.</li>
                            <li>Schedule consultation or attend the live induction webinar.</li>
                          </ul>
                        </div>
                        <button className="py-3 px-6 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors inline-block mx-auto shadow-sm">
                          Begin Enrollment Onboarding
                        </button>
                      </div>
                    )}

                    {/* Stage 2 Render */}
                    {dashboardStage === 2 && (
                      <div className="flex-grow flex flex-col">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-emerald-500" /> Morning Routine Module
                            </h3>
                            <p className="text-xs text-slate-500">Holistic self-care tracking program for students</p>
                          </div>
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-semibold">
                            Mandatory Daily Task
                          </span>
                        </div>

                        <div className="grid md:grid-cols-12 gap-6 items-center flex-grow">
                          <div className="md:col-span-7 bg-slate-950 rounded-2xl aspect-video relative overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center group cursor-pointer">
                            <img 
                              src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600" 
                              alt="Yoga Routine"
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/40" />
                            <div className="relative z-10 w-12 h-12 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                              <Play className="w-5 h-5 text-slate-900 fill-slate-900 ml-0.5" />
                            </div>
                            <span className="absolute bottom-3 left-3 bg-slate-900/80 px-2 py-1 text-[10px] font-mono text-white rounded">
                              15:00 Minute Routine
                            </span>
                          </div>

                          <div className="md:col-span-5 space-y-4">
                            <h4 className="font-bold text-slate-900 text-sm">Self-Reflection & Focus Checklist</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Each student must watch the mindfulness segment and self-check their focus targets to activate their dashboard for academic modules daily.
                            </p>
                            
                            <div className="space-y-2">
                              {[
                                'Watches physical posture tutorial',
                                'Exercises breathing rhythm check',
                                'Enters focus targets for today'
                              ].map((item, idx) => (
                                <label key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/50">
                                  <input type="checkbox" defaultChecked={idx === 0} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                  <span className="text-xs text-slate-700">{item}</span>
                                </label>
                              ))}
                            </div>

                            <button className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                              Complete Morning Log
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stage 3 Render */}
                    {dashboardStage === 3 && (
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-pink-600" /> Entrance Evaluation Assessment
                              </h3>
                              <p className="text-xs text-slate-500">Verifying grammar, English logic, and analytical reasoning</p>
                            </div>
                            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-[10px] font-bold">
                              Question {currentQuestionIdx + 1} of {MOCK_MCQS.length}
                            </span>
                          </div>

                          <div className="mb-6">
                            <h4 className="font-bold text-sm text-slate-900 mb-3 leading-relaxed">
                              {MOCK_MCQS[currentQuestionIdx].question}
                            </h4>

                            <div className="space-y-2.5">
                              {MOCK_MCQS[currentQuestionIdx].options.map((opt, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => !hasSubmittedAnswer && setSelectedAnswer(idx)}
                                  className={cn(
                                    "w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between",
                                    selectedAnswer === idx 
                                      ? hasSubmittedAnswer
                                        ? idx === MOCK_MCQS[currentQuestionIdx].correct
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                          : "border-rose-500 bg-rose-50 text-rose-800"
                                        : "border-pink-600 bg-pink-50/30 text-pink-700 font-semibold"
                                      : hasSubmittedAnswer && idx === MOCK_MCQS[currentQuestionIdx].correct
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                        : "border-slate-150 hover:border-slate-200"
                                  )}
                                  disabled={hasSubmittedAnswer}
                                  id={`demo-mcq-option-${idx}`}
                                >
                                  <span>{opt}</span>
                                  {hasSubmittedAnswer && idx === MOCK_MCQS[currentQuestionIdx].correct && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                                  )}
                                  {hasSubmittedAnswer && selectedAnswer === idx && idx !== MOCK_MCQS[currentQuestionIdx].correct && (
                                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Interactive result feedback */}
                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
                          {hasSubmittedAnswer ? (
                            <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="text-xs text-slate-600 leading-relaxed">
                                <strong className="text-slate-800 block mb-0.5">Explanation:</strong>
                                {MOCK_MCQS[currentQuestionIdx].explanation}
                              </p>
                              <button
                                onClick={handleResetMCQ}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 self-end flex items-center gap-1.5"
                                id="demo-mcq-next-btn"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Next Question
                              </button>
                            </div>
                          ) : (
                            <div className="ml-auto">
                              <button
                                onClick={handleAnswerSubmit}
                                disabled={selectedAnswer === null}
                                className={cn(
                                  "px-6 py-2.5 text-xs font-bold text-white rounded-lg transition-all",
                                  selectedAnswer !== null 
                                    ? "bg-pink-600 hover:bg-pink-700 cursor-pointer shadow-sm" 
                                    : "bg-slate-300 cursor-not-allowed"
                                )}
                                id="demo-mcq-submit-btn"
                              >
                                Submit Answer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stage 4 Render */}
                    {dashboardStage === 4 && (
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600" /> Active Course Syllabus & Modules
                              </h3>
                              <p className="text-xs text-slate-500">Student is approved & active in classroom study</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                              Verification Level: Approved
                            </span>
                          </div>

                          <div className="space-y-4">
                            {/* Course Select Dropdown Filter */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                              <label htmlFor="course-select-filter" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Select Course Specialization to View Syllabus
                              </label>
                              <select
                                id="course-select-filter"
                                value={selectedDemoCourseId}
                                onChange={(e) => setSelectedDemoCourseId(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                              >
                                {coursesList.map((course: any) => (
                                  <option key={course.id} value={course.id}>
                                    {course.title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Course Overview Card */}
                            <div className="p-4 bg-gradient-to-r from-pink-500/10 to-indigo-500/10 rounded-2xl border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-[10px] text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full font-bold">
                                    {selectedCourse.id.slice(0, 3).toUpperCase()}-101
                                  </span>
                                  <span className="text-[11px] text-slate-600 font-semibold">• Diploma Course</span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-900">{selectedCourse.title}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {selectedCourse.description || "Master industrial prepress and production standards with high-end certifications."}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 sm:border-l sm:border-slate-200 sm:pl-6 shrink-0">
                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration & Fees</p>
                                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                                    {selectedCourse.durationMonths} Months • ₹{selectedCourse.fees?.toLocaleString('en-IN') || '0'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Syllabus List */}
                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                              {selectedCourseSyllabus.length > 0 ? (
                                selectedCourseSyllabus.map((item: any, idx: number) => (
                                  <div key={idx} className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-150 transition-colors">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center shrink-0">
                                          {item.num}
                                        </span>
                                        <h5 className="font-bold text-xs text-slate-800">{item.title}</h5>
                                      </div>
                                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0", item.badgeClass)}>
                                        {item.status}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3 pl-8.5">
                                      {item.desc}
                                    </p>
                                    <div className="pl-8.5 flex flex-wrap gap-1.5">
                                      {item.topics && item.topics.map((t: string, tIdx: number) => (
                                        <span key={tIdx} className="text-[9px] font-medium bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                                          • {t}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="bg-white rounded-xl p-8 text-center border border-slate-150">
                                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                  <h4 className="font-bold text-xs text-slate-700 mb-1">No Syllabus Modules Found</h4>
                                  <p className="text-[10px] text-slate-500">All modules are currently undergoing calibration update.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center justify-between mt-5 gap-3">
                          <p className="text-[11px] text-indigo-800 font-medium">
                            💡 <strong>Instructor Tip:</strong> Students in Stage 4 can access the Virtual Classroom and use the built-in AI Tutor for homework feedback!
                          </p>
                          <button 
                            onClick={() => setActiveTab('ai')}
                            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shrink-0 hover:bg-indigo-700 transition-colors"
                          >
                            Try AI Tutor
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stage 5 Render */}
                    {dashboardStage === 5 && (() => {
                      const activeProjects = getDisplayProjects(selectedDemoCourseId);
                      const activeProject = activeProjects[selectedProjectIdx] || activeProjects[0];
                      return (
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                  <FileCheck2 className="w-5 h-5 text-indigo-600" /> Capstone Project Verification
                                </h3>
                                <p className="text-xs text-slate-500">Auto-validating artwork boundaries and press variables</p>
                              </div>
                              <span className="px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full text-[10px] font-bold">
                                Final Evaluation Stage
                              </span>
                            </div>

                            <div className="space-y-6">
                              {/* Course Filter Bar */}
                              <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <BookOpen className="w-5 h-5 text-pink-600 shrink-0" />
                                  <span className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight shrink-0">Filter by Course:</span>
                                  <div className="relative flex-grow sm:flex-grow-0">
                                    <select
                                      id="course-select-filter-stage5"
                                      value={selectedDemoCourseId}
                                      onChange={(e) => {
                                        setSelectedDemoCourseId(e.target.value);
                                        setSelectedProjectIdx(0);
                                      }}
                                      className="w-full sm:w-auto bg-white border border-pink-500 hover:border-pink-600 text-slate-800 text-xs rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 font-bold cursor-pointer appearance-none"
                                      style={{
                                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 10px center',
                                        backgroundSize: '14px'
                                      }}
                                    >
                                      {coursesList
                                        .map((course: any) => (
                                          <option key={course.id} value={course.id} className="text-slate-800 font-normal">
                                            {course.title}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-slate-400">
                                  Showing {activeProjects.length} projects
                                </span>
                              </div>
 
                              {/* Projects List - Line by Line matching 2nd snap */}
                              <div className="space-y-3">
                                {activeProjects.length > 0 ? (
                                  activeProjects.map((proj, idx) => (
                                    <div 
                                      key={idx}
                                      className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-150 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                      <div className="flex items-start gap-3 min-w-0 flex-grow">
                                        <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                                          {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight break-all">
                                              {proj.projectCode ? `${proj.projectCode} - ${proj.title}` : proj.title}
                                            </h4>
                                            {proj.studentName && (
                                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 uppercase tracking-wider">
                                                Student: {proj.studentName}
                                              </span>
                                            )}
                                            {proj.courseName && (
                                              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-100 uppercase tracking-wider">
                                                {proj.courseName}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-slate-500 mt-1 leading-relaxed break-all">{proj.desc}</p>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-[9px] font-semibold bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                                              File: {proj.filename}
                                            </span>
                                            <span className="text-[9px] font-semibold bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                                              Specs: {proj.specs}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="shrink-0 flex items-center self-start sm:self-center">
                                        <span className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-full text-[10px] font-bold border border-pink-100 uppercase tracking-wider">
                                          {proj.badge}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                                    <FolderOpen className="w-8 h-8 text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-600 font-bold mb-1">No Student Projects Found</p>
                                    <p className="text-[11px] text-slate-500 max-w-md mx-auto mb-4">
                                      Student projects must be picked up directly from the database. Please go to **Admin Control Panel &gt; Student Projects** to create and assign projects.
                                    </p>
                                    <button
                                      onClick={() => navigate('/admin')}
                                      className="text-[11px] font-bold bg-pink-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-pink-700 transition-colors shadow-sm cursor-pointer"
                                    >
                                      Go to Admin Control Panel
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-5">
                            <span className="text-[10px] text-slate-500">Supervisor validation will trigger once artwork passes all pre-checks.</span>
                            <button 
                              onClick={() => setActiveTab('preflight')}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
                            >
                              Launch Artwork Auditor <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: AI Printing Tutor Sandbox */}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              {/* Left Info Panel */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-pink-600" /> Print AI Assistant
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    The Endless Spark custom-trained AI handles production guidelines, answers complex print variables, and writes ExtendScript code to automate Adobe tools.
                  </p>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Click to Simulate Prompts:</h4>
                    <div className="space-y-2">
                      {[
                        { title: 'Explain Trapping Widths', query: 'What are the standard trapping width settings for Commercial Offset press?' },
                        { title: 'Convert RGB to CMYK Guidelines', query: 'Why is printing CMYK different from RGB? What happens if I print RGB?' },
                        { title: 'Explain Bleed Tolerances', query: 'How does bleed work and why do I need 3mm to 5mm margin on physical cuts?' },
                        { title: 'Illustrator ExtendScript Tool', query: 'Write a Javascript script for Adobe Illustrator to outline text frames' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendAiMessage(item.query)}
                          className="w-full text-left p-2.5 bg-slate-50 hover:bg-pink-50/50 hover:text-pink-600 rounded-xl text-xs text-slate-700 font-medium transition-all border border-slate-100 truncate block"
                          id={`ai-prompt-btn-${idx}`}
                        >
                          &rarr; {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-2">Syllabus Integrations</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unlike standard models, our tutor is explicitly bounded with FOGRA, GRACOL, and ISO standard offset margins, enabling students to troubleshoot real-world mechanical discrepancies instantly.
                  </p>
                </div>
              </div>

              {/* Chat Interface Rendering */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
                  
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center font-bold">
                        AI
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Academic AI Tutor</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Status: Connected to model/gemini-2.5-flash</p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  {/* Messages container */}
                  <div className="flex-grow p-6 overflow-y-auto space-y-4 max-h-[400px]">
                    {aiMessages.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "flex gap-3 max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed",
                          msg.role === 'user' 
                            ? "bg-pink-600 text-white ml-auto rounded-tr-none" 
                            : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none font-sans"
                        )}
                      >
                        {msg.role !== 'user' && (
                          <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold text-[9px] mt-0.5">
                            AI
                          </div>
                        )}
                        <div className="flex-grow space-y-1 overflow-x-auto">
                          {msg.role === 'user' ? (
                            <p>{msg.content}</p>
                          ) : (
                            <div className="whitespace-pre-wrap font-sans text-slate-700">
                              {/* Simple renderer for custom layout format */}
                              {msg.content.split('\n\n').map((para, pIdx) => {
                                if (para.startsWith('###')) {
                                  return <h5 key={pIdx} className="text-xs font-black text-slate-950 mt-2 mb-1 uppercase tracking-wider">{para.replace('###', '')}</h5>;
                                }
                                if (para.startsWith('```')) {
                                  const codeContent = para.replace(/```[a-z]*/g, '').trim();
                                  return (
                                    <pre key={pIdx} className="bg-slate-950 text-emerald-400 font-mono p-3 rounded-lg overflow-x-auto text-[10px] border border-slate-850 mt-2 mb-2 select-all">
                                      <code>{codeContent}</code>
                                    </pre>
                                  );
                                }
                                if (para.startsWith('*')) {
                                  return (
                                    <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2">
                                      {para.split('\n').map((li, lIdx) => (
                                        <li key={lIdx}>{li.replace('*', '').trim()}</li>
                                      ))}
                                    </ul>
                                  );
                                }
                                return <p key={pIdx} className="leading-relaxed text-slate-600">{para}</p>;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isAiResponding && (
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3.5 max-w-[200px]">
                        <Loader2 className="w-4 h-4 text-pink-600 animate-spin" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI analyzing...</span>
                      </div>
                    )}
                  </div>

                  {/* Input container */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your printing specifications question..."
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                      className="flex-grow px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-xs text-slate-800"
                      id="ai-chat-input-field"
                    />
                    <button
                      onClick={() => handleSendAiMessage()}
                      className="px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all font-bold flex items-center justify-center shrink-0"
                      id="ai-chat-send-btn"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Pre-flight Artwork Checker */}
          {activeTab === 'preflight' && (
            <motion.div
              key="preflight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              {/* Left Selector & Upload */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-pink-600" /> Artwork Pre-Flight Audit
                  </h3>
                  <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                    Simulate how our automated pre-flight system scans PDF and Vector formats to flag colorspace mismatches, missing bleed margins, and raw typography.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Select Demo File Draft:
                      </label>
                      <div className="space-y-2">
                        {PREFLIGHT_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setSelectedPreset(preset.id);
                              setPreflightResult(null);
                            }}
                            className={cn(
                              "w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all",
                              selectedPreset === preset.id 
                                ? "border-pink-600 bg-pink-50/20 text-pink-700" 
                                : "border-slate-150 hover:border-slate-200"
                            )}
                            id={`preflight-preset-${preset.id}`}
                          >
                            <span className="truncate pr-4">{preset.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{preset.fileSize}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleRunPreflight}
                      disabled={isPreflighting}
                      className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition-all shadow-md flex items-center justify-center gap-2"
                      id="run-preflight-btn"
                    >
                      {isPreflighting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Auditing Layout Components...</span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-4 h-4" />
                          <span>Run Pre-Flight Checker</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Need Custom Formats?</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      Our live application lets students outline fonts directly using ExtendScripts before uploading to avoid RIP processing errors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Output results */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden min-h-[420px] flex flex-col justify-between">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Audit Compliance Report</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Variable Engine: V1.4.2</span>
                    </div>

                    {isPreflighting && (
                      <div className="space-y-6 py-8">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>Scanning Vectors & Outlines...</span>
                            <span>{preflightProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-pink-600 h-full transition-all duration-300"
                              style={{ width: `${preflightProgress}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono text-center animate-pulse">
                          Reading raster maps, font descriptors, colorspaces and bounding dimensions...
                        </p>
                      </div>
                    )}

                    {!isPreflighting && !preflightResult && (
                      <div className="text-center py-12 text-slate-400">
                        <FileCheck2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <h5 className="font-bold text-xs text-slate-700 mb-1">No Active Audit</h5>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                          Select a layout preset file on the left and click "Run Pre-Flight Checker" to simulate production validation.
                        </p>
                      </div>
                    )}

                    {!isPreflighting && preflightResult && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border bg-slate-50">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">File Selected</span>
                            <h5 className="text-xs font-bold text-slate-800">{preflightResult.name}</h5>
                          </div>
                          <span className={cn(
                            "px-3 py-1 text-xs font-black uppercase rounded-full shrink-0 tracking-widest",
                            preflightResult.status === 'PASS' 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-rose-100 text-rose-800"
                          )}>
                            {preflightResult.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Color space', val: preflightResult.colorSpace, passed: preflightResult.colorSpace === 'CMYK' },
                            { label: 'Bleed bounds', val: preflightResult.bleed, passed: preflightResult.bleed !== '0.0 mm (Missing)' },
                            { label: 'Fonts outlined', val: preflightResult.fontsOutlined ? 'Yes' : 'No', passed: preflightResult.fontsOutlined },
                            { label: 'Resolution', val: preflightResult.resolution, passed: preflightResult.resolution !== '72 DPI (Low Res)' }
                          ].map((item, idx) => (
                            <div key={idx} className="p-3 bg-white border border-slate-150 rounded-xl">
                              <span className="text-[9px] text-slate-400 font-semibold uppercase block mb-1">{item.label}</span>
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-bold text-slate-800">{item.val}</span>
                                {item.passed ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {preflightResult.issues.length > 0 ? (
                          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                            <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" /> Flagged Pre-Flight Mismatches:
                            </h5>
                            <ul className="text-[11px] text-rose-800 space-y-1.5 pl-4 list-disc leading-relaxed">
                              {preflightResult.issues.map((issue: string, idx: number) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                            <div>
                              <h5 className="text-xs font-bold text-emerald-900">100% Production Ready</h5>
                              <p className="text-[10px] text-emerald-700 leading-relaxed mt-0.5">
                                No errors or warnings detected. This artwork contains appropriate bleeds and spot configurations. Ready for commercial plate separation.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Integrates with Supervisor plate-making dashboard directly.</span>
                    {preflightResult?.status === 'PASS' && (
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> Download Checked PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Interactive Project Portfolio */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Verified Capstone Portfolios</h3>
                  <p className="text-xs text-slate-500">
                    Explore mock sample projects completed by certified Endless Spark students, complete with full technical details.
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/book-consultation')}
                  className="px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Schedule Live Review Call
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {DEMO_PROJECTS.map((proj, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="aspect-video relative overflow-hidden bg-slate-950">
                        <img 
                          src={proj.image} 
                          alt={proj.title}
                          className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-300"
                        />
                        <span className={cn(
                          "absolute top-3 right-3 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md text-white shadow-sm",
                          proj.score >= 90 ? "bg-emerald-600" : "bg-rose-600"
                        )}>
                          Score: {proj.score}/100
                        </span>
                        <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white px-2.5 py-0.5 rounded text-[10px] font-mono">
                          {proj.type}
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div>
                          <span className="text-[10px] text-indigo-600 uppercase font-black tracking-widest">{proj.category}</span>
                          <h4 className="font-bold text-sm text-slate-900 mt-1">{proj.title}</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-150 font-mono">
                          <div>
                            <span className="text-slate-400 block uppercase">Bleed margin</span>
                            <span className="text-slate-800 font-bold">{proj.bleed}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase">Outlines</span>
                            <span className="text-slate-800 font-bold">{proj.fonts}</span>
                          </div>
                          <div className="col-span-2 border-t border-slate-200/50 pt-2 mt-2">
                            <span className="text-slate-400 block uppercase">Colorspace</span>
                            <span className="text-slate-800 font-bold">{proj.colors}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-700 block">Faculty Review Feedback:</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed italic">
                            "{proj.feedback}"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{proj.status}</span>
                      <button 
                        onClick={() => navigate('/book-consultation')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                      >
                        Book Demo Session &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Dynamic Consultation Booking Callout Card */}
        <section className="mt-16 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="px-3.5 py-1 bg-pink-500/20 text-pink-300 text-xs font-bold uppercase rounded-full tracking-widest border border-pink-500/30">
              Personalized Consultation Slots
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Let's Walk Through the Real Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Database & AI Systems</span> Together
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              We have booked specific demo sessions regarding **Student Dashboard & AI Features** where we can demonstrate live ExtendScript file outputs, active WhatsApp marketing integrations, and custom database schemas.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => navigate('/book-consultation')}
                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-105 duration-300 text-xs sm:text-sm"
                id="demo-book-bottom-btn"
              >
                Schedule Monday Available Slot (7:30 PM - 08:00 PM)
              </button>
              <button
                onClick={() => navigate('/about-courses')}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl transition-all border border-slate-700 hover:scale-105 duration-300 text-xs sm:text-sm"
                id="demo-courses-bottom-btn"
              >
                Explore Syllabus & Core Guides
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Endless Spark School of Printing and Packaging. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-800 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
