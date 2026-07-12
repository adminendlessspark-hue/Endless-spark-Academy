import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLogo from '../components/CompanyLogo';
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
  Video,
  Award,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Users,
  MapPin,
  IndianRupee,
  CreditCard,
  Plus,
  Trash2,
  Settings,
  AlertTriangle,
  Lock,
  Bot,
  Mic,
  Terminal,
  Type,
  RefreshCw,
  Calculator,
  Building
} from 'lucide-react';
import { cn } from '../utils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { generateGeminiContent } from '../services/gemini';
import { collection, query, orderBy, onSnapshot, where, doc, setDoc } from 'firebase/firestore';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../AuthContext';
import { getProjectsForCourse, getCapstoneProjectForCourse } from '../data/courseProjects';
import StudentAIAgent from '../components/StudentAIAgent';
import ProgramOutcomes from '../components/ProgramOutcomes';

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
  const { financialSettings, placementSettings } = useSettings();
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
    // Only show the Master Projects that we provide. Do not add student projects here.
    const masterProjects = getProjectsForCourse(courseId);
    return masterProjects.map((proj, idx) => {
      const codePrefix = courseId === 'packaging-engineer' ? 'PE' :
                         courseId === 'production-art-engineer' ? 'PA' :
                         courseId === 'print-ready-engineer' ? 'PR' :
                         courseId === 'plate-ready-engineer' ? 'PL' :
                         courseId === 'colour-retouching-engineer' ? 'CR' :
                         courseId === 'quality-control-engineer' ? 'QC' : 'CC';
      return {
        title: proj.title,
        projectCode: `${codePrefix}_0${idx + 1}`,
        studentName: '', // Do not show student name for master projects provided by us
        courseName: coursesList.find((c: any) => c.id === courseId)?.title || '',
        filename: proj.filename,
        specs: proj.specs,
        desc: proj.desc,
        badge: proj.badge || 'Master Project Spec',
        activeStudents: proj.activeStudents || 1
      };
    });
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
  
  // Tabs: 'journey', 'ai', 'preflight', 'projects', 'accounts', 'outcomes'
  const [activeTab, setActiveTab] = useState<'journey' | 'ai' | 'preflight' | 'projects' | 'accounts' | 'outcomes'>('journey');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'outcomes') {
      setActiveTab('outcomes');
    } else if (tabParam && ['journey', 'ai', 'preflight', 'projects', 'accounts', 'outcomes'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

  // Student Dashboard Simulator state
  const [dashboardStage, setDashboardStage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>(4);
  const [offerAccepted, setOfferAccepted] = useState(false);

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
  const [aiSubTab, setAiSubTab] = useState<'prepress' | 'student-agent'>('prepress');

  // Software & Toolkit Hub State
  const [selectedSoftwareId, setSelectedSoftwareId] = useState<string>('illustrator');
  const [isSoftwareSimulating, setIsSoftwareSimulating] = useState(false);
  const [softwareSimProgress, setSoftwareSimProgress] = useState(0);
  const [softwareTerminalLogs, setSoftwareTerminalLogs] = useState<string[]>([]);
  const [bananaCompression, setBananaCompression] = useState<number>(100);
  const [fireflyPrompt, setFireflyPrompt] = useState<string>('Luxury geometric rose-gold packaging grid');
  const [fireflyImage, setFireflyImage] = useState<string | null>(null);
  const [photoshopMode, setPhotoshopMode] = useState<'RGB' | 'CMYK'>('RGB');
  const [activeFonts, setActiveFonts] = useState<string[]>(['Space Grotesk', 'Inter', 'JetBrains Mono']);
  const [fontServerSynced, setFontServerSynced] = useState(false);

  // Preflight Simulator State
  const [selectedPreset, setSelectedPreset] = useState<string>('pass_pack');
  const [isPreflighting, setIsPreflighting] = useState(false);
  const [preflightProgress, setPreflightProgress] = useState(0);
  const [preflightResult, setPreflightResult] = useState<any | null>(null);

  // Simulated Accounts Tab State
  const initialDemoInvoice = {
    id: 'INV-DEMO-2026',
    courseName: 'Diploma in Production Art Engineer',
    courseId: 'production-art-engineer',
    baseFee: 35000,
    concessionApplied: 'none' as 'none' | 'single-parent' | 'transgender',
    customDiscount: 0,
    emis: [
      { emiNumber: 1, baseAmount: 12000, interestAmount: 700, penaltyAmount: 0, waiverAmount: 0, status: 'paid' as 'paid' | 'pending' | 'overdue', dueDate: '2026-05-15', paidDate: '2026-05-14' },
      { emiNumber: 2, baseAmount: 12000, interestAmount: 700, penaltyAmount: 0, waiverAmount: 0, status: 'overdue' as 'paid' | 'pending' | 'overdue', dueDate: '2026-06-15', paidDate: null as string | null },
      { emiNumber: 3, baseAmount: 11000, interestAmount: 350, penaltyAmount: 0, waiverAmount: 0, status: 'pending' as 'paid' | 'pending' | 'overdue', dueDate: '2026-07-15', paidDate: null as string | null }
    ],
    waivers: [] as Array<{emiNumber: number, type: 'interest' | 'penalty', percentage: number, amount: number, reason: string, date: string, approvedBy: string}>,
    referrals: [
      { id: 'ref-1', name: 'Rajesh Kumar', status: 'Registered (Telecaller)', date: '2026-06-10', rewardAmount: 1000, paid: false },
      { id: 'ref-2', name: 'Priya Sharma', status: 'Enrolled & Paid', date: '2026-06-25', rewardAmount: 1500, paid: true }
    ],
    referralCode: 'ES-STUDENT-99',
    bonusWithdrawn: 1500,
    rulesSnapshot: null as {
      interestRatePercentage: number;
      penaltyPercentage: number;
      internalReferralPercentage: number;
      externalReferralPercentage: number;
    } | null
  };

  const [demoInvoice, setDemoInvoice] = useState(initialDemoInvoice);
  const [newWaiverEmiNum, setNewWaiverEmiNum] = useState<number>(2);
  const [newWaiverType, setNewWaiverType] = useState<'interest' | 'penalty'>('penalty');
  const [newWaiverPercent, setNewWaiverPercent] = useState<number>(100);
  const [newWaiverReason, setNewWaiverReason] = useState<string>('Academic performance attendance consistency waiver');
  const [couponCode, setCouponCode] = useState<string>('');
  const [isWithdrawingBonus, setIsWithdrawingBonus] = useState(false);

  // Dynamic EMI Calculator Sandbox States
  const [calcCourseId, setCalcCourseId] = useState<string>('production-art-engineer');
  const [calcBaseFee, setCalcBaseFee] = useState<string>('');
  const [calcConcession, setCalcConcession] = useState<'none' | 'single-parent' | 'transgender'>('none');
  const [calcEmiPlan, setCalcEmiPlan] = useState<string>('2');
  const [calcCustomEmiCount, setCalcCustomEmiCount] = useState<number>(3);
  const [calcInterestRate, setCalcInterestRate] = useState<string>('');
  const [hasInitializedCalc, setHasInitializedCalc] = useState(false);

  // Prepayment & Pre-Closure Bank Rule Simulation States
  const [prepayAmount, setPrepayAmount] = useState<string>('15000');
  const [prepaySuccessMessage, setPrepaySuccessMessage] = useState<string | null>(null);

  // Career Center & Placement Sandbox States
  const [careerCenterTab, setCareerCenterTab] = useState<'dispatch' | 'alumni' | 'students'>('dispatch');
  const [newAlumniYear, setNewAlumniYear] = useState('2025-2026');
  const [newAlumniCompanyName, setNewAlumniCompanyName] = useState('');
  const [newAlumniStudentsPlaced, setNewAlumniStudentsPlaced] = useState('1');
  const [newAlumniHighestPackage, setNewAlumniHighestPackage] = useState('');
  const [newAlumniLogoUrl, setNewAlumniLogoUrl] = useState('');
  const [isSavingAlumni, setIsSavingAlumni] = useState(false);
  const [alumniAddSuccess, setAlumniAddSuccess] = useState(false);

  // Student Placement Console States
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [showAddNewStudentForm, setShowAddNewStudentForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [isUpdatingStudentPlacement, setIsUpdatingStudentPlacement] = useState(false);
  const [studentPlacementForm, setStudentPlacementForm] = useState({
    eligible: false,
    status: 'Course Ongoing',
    placedCompany: '',
    packageAmount: '',
    interviewCompany: '',
    interviewDate: '',
    notes: ''
  });

  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    assignedCourse: 'production-art-engineer',
    eligible: true,
    status: 'Pending' as 'Course Ongoing' | 'Pending' | 'Interview Scheduled' | 'Placed' | 'Not Placed',
    placedCompany: '',
    packageAmount: '',
    notes: ''
  });

  // Fetch actual student users in real-time
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsub = onSnapshot(q, (snapshot) => {
      const studentUsers = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
      setStudents(studentUsers);
    }, (err) => {
      console.error("Error fetching students for demo center placements:", err);
    });
    return () => unsub();
  }, []);

  const handleAddAlumniRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlumniCompanyName || !newAlumniStudentsPlaced || !newAlumniHighestPackage) {
      alert('Please fill out all required fields.');
      return;
    }
    setIsSavingAlumni(true);
    setAlumniAddSuccess(false);
    try {
      const currentRecords = placementSettings?.yearlyRecords || [];
      const newRecord = {
        id: Date.now().toString(),
        companyName: newAlumniCompanyName,
        studentsPlaced: Number(newAlumniStudentsPlaced),
        highestPackage: Number(newAlumniHighestPackage),
        logoUrl: newAlumniLogoUrl || undefined
      };
      
      let yearExists = false;
      const updatedRecords = currentRecords.map((yr: any) => {
        if (yr.year === newAlumniYear) {
          yearExists = true;
          return {
            ...yr,
            records: [...yr.records, newRecord]
          };
        }
        return yr;
      });

      const finalRecords = yearExists 
        ? updatedRecords 
        : [...updatedRecords, { year: newAlumniYear, records: [newRecord] }];

      await setDoc(doc(db, 'settings', 'placements'), {
        id: 'placements',
        yearlyRecords: finalRecords
      }, { merge: true });

      setNewAlumniCompanyName('');
      setNewAlumniStudentsPlaced('1');
      setNewAlumniHighestPackage('');
      setNewAlumniLogoUrl('');
      setAlumniAddSuccess(true);
      setTimeout(() => setAlumniAddSuccess(false), 3000);
      alert('New alumni placement record successfully added and synchronized with Career Center!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/placements');
    } finally {
      setIsSavingAlumni(false);
    }
  };

  const handleSaveStudentPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsUpdatingStudentPlacement(true);
    try {
      const placementInfo = {
        eligible: studentPlacementForm.eligible,
        status: studentPlacementForm.status,
        placedCompany: studentPlacementForm.status === 'Placed' ? studentPlacementForm.placedCompany : '',
        packageAmount: studentPlacementForm.status === 'Placed' ? studentPlacementForm.packageAmount : '',
        interviewCompany: studentPlacementForm.status === 'Interview Scheduled' ? studentPlacementForm.interviewCompany : '',
        interviewDate: studentPlacementForm.status === 'Interview Scheduled' ? studentPlacementForm.interviewDate : '',
        notes: studentPlacementForm.notes
      };

      await setDoc(doc(db, 'users', editingStudent.id), {
        placementInfo
      }, { merge: true });

      alert(`Placement status for ${editingStudent.name} successfully updated and synchronized!`);
      setEditingStudent(null);
    } catch (err) {
      console.error("Error updating student placement:", err);
      alert("Failed to update student placement.");
    } finally {
      setIsUpdatingStudentPlacement(false);
    }
  };

  const handleCreateNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.email) {
      alert("Name and Email are required.");
      return;
    }
    setIsUpdatingStudentPlacement(true);
    try {
      const studentId = 'ES-' + Math.floor(100000 + Math.random() * 900000);
      const username = newStudentForm.email.split('@')[0] + Math.floor(10 + Math.random() * 90);
      const newUserId = 'student_' + Date.now().toString();

      const newStudentUser = {
        id: newUserId,
        studentId,
        name: newStudentForm.name,
        username,
        email: newStudentForm.email,
        phone: newStudentForm.phone || '',
        role: 'student',
        isApproved: true,
        applicationStatus: 'approved',
        registeredForDemo: false,
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        assignedCourse: newStudentForm.assignedCourse,
        admissionDate: new Date().toISOString().split('T')[0],
        placementInfo: {
          eligible: newStudentForm.eligible,
          status: newStudentForm.status,
          placedCompany: newStudentForm.status === 'Placed' ? newStudentForm.placedCompany : '',
          packageAmount: newStudentForm.status === 'Placed' ? newStudentForm.packageAmount : '',
          notes: newStudentForm.notes
        }
      };

      await setDoc(doc(db, 'users', newUserId), newStudentUser);

      alert(`Successfully added and registered new student: ${newStudentForm.name}!`);
      setShowAddNewStudentForm(false);
      setNewStudentForm({
        name: '',
        email: '',
        phone: '',
        assignedCourse: 'production-art-engineer',
        eligible: true,
        status: 'Pending',
        placedCompany: '',
        packageAmount: '',
        notes: ''
      });
    } catch (err) {
      console.error("Error creating student:", err);
      alert("Failed to add new student details.");
    } finally {
      setIsUpdatingStudentPlacement(false);
    }
  };

  // Initialize dynamic calculator with the first course once courses are available
  useEffect(() => {
    if (coursesList && coursesList.length > 0 && !hasInitializedCalc) {
      const firstCourse = coursesList[0];
      if (firstCourse) {
        setCalcCourseId(firstCourse.id);
        setCalcBaseFee(String(firstCourse.fees));
        setHasInitializedCalc(true);
      }
    }
  }, [coursesList, hasInitializedCalc]);

  // Dynamic Real-time Calculations for UI display
  const currentBaseVal = calcBaseFee !== '' ? (parseFloat(calcBaseFee) || 0) : (coursesList.find(c => c.id === calcCourseId)?.fees || 50000);
  
  const currentConcessionPercent = calcConcession === 'single-parent' 
    ? (financialSettings?.singleParentConcessionPercentage ?? 10)
    : calcConcession === 'transgender'
    ? (financialSettings?.transgenderConcessionPercentage ?? 75)
    : 0;
    
  const currentDiscountAmount = Math.round(currentBaseVal * (currentConcessionPercent / 100));
  const currentFinalAmount = Math.max(0, currentBaseVal - currentDiscountAmount);

  const currentEmiCount = calcEmiPlan === '1'
    ? 1
    : calcEmiPlan === '2'
    ? 2
    : calcEmiPlan === '5'
    ? 5
    : calcEmiPlan === 'custom'
    ? Math.max(1, calcCustomEmiCount)
    : (coursesList.find(c => c.id === calcCourseId)?.durationMonths || 6);

  const currentParsedRate = calcInterestRate !== '' ? (parseFloat(calcInterestRate) ?? null) : null;
  const currentInterestRate = currentParsedRate !== null ? currentParsedRate : (financialSettings?.interestRatePercentage ?? 7);

  // 0% interest if fee > 69,000 and EMI count is 2 or 5
  const isPromoApplied = currentFinalAmount > 69000 && (currentEmiCount === 2 || currentEmiCount === 5) && currentParsedRate === null;
  const currentTotalInterest = (currentEmiCount > 1 && !isPromoApplied)
    ? Math.round(currentFinalAmount * (currentInterestRate / 100))
    : 0;

  const currentTotalPayable = currentFinalAmount + currentTotalInterest;
  const currentEmiAmount = Math.round(currentTotalPayable / currentEmiCount);

  const handleCourseChange = (id: string) => {
    setCalcCourseId(id);
    const course = coursesList.find(c => c.id === id);
    if (course) {
      setCalcBaseFee(String(course.fees));
    }
  };

  const handleApplyCalculatedEmi = () => {
    const baseVal = calcBaseFee !== '' ? parseFloat(calcBaseFee) : (coursesList.find(c => c.id === calcCourseId)?.fees || 50000);
    
    // Concession
    let concessionPercent = 0;
    if (calcConcession === 'single-parent') {
      concessionPercent = financialSettings?.singleParentConcessionPercentage ?? 10;
    } else if (calcConcession === 'transgender') {
      concessionPercent = financialSettings?.transgenderConcessionPercentage ?? 75;
    }
    const discountAmount = Math.round(baseVal * (concessionPercent / 100));
    const finalAmount = Math.max(0, baseVal - discountAmount);

    // EMI count
    let emiCount = 1;
    if (calcEmiPlan === '1') {
      emiCount = 1;
    } else if (calcEmiPlan === '2') {
      emiCount = 2;
    } else if (calcEmiPlan === '5') {
      emiCount = 5;
    } else if (calcEmiPlan === 'custom') {
      emiCount = Math.max(1, calcCustomEmiCount);
    } else {
      // 'standard' -> based on course duration
      const duration = coursesList.find(c => c.id === calcCourseId)?.durationMonths || 6;
      emiCount = duration;
    }

    // Interest rate
    const parsedRate = calcInterestRate !== '' ? parseFloat(calcInterestRate) : null;
    const interestRate = parsedRate !== null ? parsedRate : (financialSettings?.interestRatePercentage ?? 7);

    const isPromoApplied = finalAmount > 69000 && (emiCount === 2 || emiCount === 5) && parsedRate === null;

    let totalInterest = 0;
    if (emiCount > 1) {
      if (isPromoApplied) {
        totalInterest = 0;
      } else {
        totalInterest = Math.round(finalAmount * (interestRate / 100));
      }
    }

    const baseEmiAmount = Math.round(finalAmount / emiCount);
    const interestPerEmi = Math.round(totalInterest / emiCount);

    const generatedEmis = [];
    const now = new Date();
    for (let i = 1; i <= emiCount; i++) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() + i, 15);
      generatedEmis.push({
        emiNumber: i,
        baseAmount: baseEmiAmount,
        interestAmount: interestPerEmi,
        penaltyAmount: 0,
        waiverAmount: 0,
        status: (i === 1 ? 'paid' : 'pending') as 'paid' | 'pending' | 'overdue',
        dueDate: dueDate.toISOString().split('T')[0],
        paidDate: i === 1 ? now.toISOString().split('T')[0] : null
      });
    }

    const courseObj = coursesList.find(c => c.id === calcCourseId);
    setDemoInvoice({
      ...demoInvoice,
      courseId: calcCourseId,
      courseName: courseObj?.title || calcCourseId,
      baseFee: baseVal,
      concessionApplied: calcConcession,
      customDiscount: discountAmount,
      emis: generatedEmis,
      rulesSnapshot: {
        interestRatePercentage: isPromoApplied ? 0 : (emiCount > 1 ? interestRate : 0),
        penaltyPercentage: financialSettings?.penaltyPercentage || 0,
        internalReferralPercentage: financialSettings?.internalReferralPercentage || 2,
        externalReferralPercentage: financialSettings?.externalReferralPercentage || 5
      }
    });

    alert(`Dynamic EMI schedule calculated successfully:\n- Principal: ₹${finalAmount.toLocaleString()}\n- Interest: ₹${totalInterest.toLocaleString()} (${interestRate}% Rate)\n- EMIs: ${emiCount} instalments of ₹${(Math.round((finalAmount + totalInterest) / emiCount)).toLocaleString()} each.\n\nLedger sandbox updated below!`);
  };

  const calculatePrepaymentSimulation = (inputAmount: number) => {
    if (isNaN(inputAmount) || inputAmount <= 0) {
      return {
        currentDuesPaid: 0,
        excessPrepayment: 0,
        emisFullyPaidCount: 0,
        interestSaved: 0,
        isFullyPreclosed: false,
        newRemainingEmisCount: demoInvoice.emis.filter(e => e.status !== 'paid').length
      };
    }

    const simulatedEmis = demoInvoice.emis.map(e => ({ ...e }));
    simulatedEmis.sort((a, b) => a.emiNumber - b.emiNumber);

    let funds = inputAmount;
    let currentDuesPaid = 0;
    let excessPrepayment = 0;
    let interestSaved = 0;
    let emisFullyPaidCount = 0;

    // Pay current active dues
    for (let i = 0; i < simulatedEmis.length; i++) {
      if (simulatedEmis[i].status !== 'paid') {
        const netDue = Math.max(0, simulatedEmis[i].baseAmount + simulatedEmis[i].interestAmount + simulatedEmis[i].penaltyAmount - simulatedEmis[i].waiverAmount);
        if (funds >= netDue) {
          funds -= netDue;
          currentDuesPaid += netDue;
          simulatedEmis[i].status = 'paid';
        } else {
          currentDuesPaid += funds;
          funds = 0;
          break;
        }
      }
    }

    // Excess prepayment applied to future principal
    if (funds > 0) {
      excessPrepayment = funds;
      const futureUnpaid = simulatedEmis.filter(e => e.status !== 'paid');
      for (let i = 0; i < futureUnpaid.length; i++) {
        if (funds <= 0) break;
        const emi = futureUnpaid[i];
        const base = emi.baseAmount;
        const interest = emi.interestAmount;

        if (funds >= base) {
          funds -= base;
          interestSaved += interest;
          emi.status = 'paid';
          emisFullyPaidCount++;
        } else {
          const reduction = funds;
          const interestReduction = Math.round(interest * (reduction / base));
          interestSaved += interestReduction;
          funds = 0;
        }
      }
    }

    const newRemainingEmisCount = simulatedEmis.filter(e => e.status !== 'paid').length;
    const isFullyPreclosed = newRemainingEmisCount === 0;

    return {
      currentDuesPaid,
      excessPrepayment,
      emisFullyPaidCount,
      interestSaved,
      isFullyPreclosed,
      newRemainingEmisCount
    };
  };

  const handleProcessPrepayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToPay = parseFloat(prepayAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    const updatedEmis = demoInvoice.emis.map(e => ({ ...e }));
    updatedEmis.sort((a, b) => a.emiNumber - b.emiNumber);

    let remainingFunds = amountToPay;
    let savedInterest = 0;
    let emisFullyPrepaid = 0;
    let emisPartiallyPrepaid = 0;

    // Clear currently pending EMIs
    for (let i = 0; i < updatedEmis.length; i++) {
      if (updatedEmis[i].status !== 'paid') {
        const netDue = Math.max(0, updatedEmis[i].baseAmount + updatedEmis[i].interestAmount + updatedEmis[i].penaltyAmount - updatedEmis[i].waiverAmount);
        if (remainingFunds >= netDue) {
          remainingFunds -= netDue;
          updatedEmis[i].status = 'paid';
          updatedEmis[i].paidDate = new Date().toISOString().split('T')[0];
        } else if (remainingFunds > 0) {
          const originalNetDue = netDue;
          const fraction = remainingFunds / originalNetDue;
          updatedEmis[i].baseAmount = Math.max(0, Math.round(updatedEmis[i].baseAmount * (1 - fraction)));
          updatedEmis[i].interestAmount = Math.max(0, Math.round(updatedEmis[i].interestAmount * (1 - fraction)));
          remainingFunds = 0;
          break;
        }
      }
    }

    // Apply remaining funds as future principal prepayment
    if (remainingFunds > 0) {
      const futureUnpaidEmis = updatedEmis.filter(e => e.status !== 'paid');
      for (let i = 0; i < futureUnpaidEmis.length; i++) {
        if (remainingFunds <= 0) break;
        const currentEmi = futureUnpaidEmis[i];
        const oldBase = currentEmi.baseAmount;
        const oldInterest = currentEmi.interestAmount;

        if (remainingFunds >= oldBase) {
          remainingFunds -= oldBase;
          savedInterest += oldInterest;
          currentEmi.baseAmount = 0;
          currentEmi.interestAmount = 0;
          currentEmi.status = 'paid';
          currentEmi.paidDate = new Date().toISOString().split('T')[0];
          emisFullyPrepaid++;
        } else {
          const reduction = remainingFunds;
          currentEmi.baseAmount = oldBase - reduction;
          const interestReduction = Math.round(oldInterest * (reduction / oldBase));
          currentEmi.interestAmount = Math.max(0, oldInterest - interestReduction);
          savedInterest += interestReduction;
          emisPartiallyPrepaid++;
          remainingFunds = 0;
        }
      }
    }

    setDemoInvoice({
      ...demoInvoice,
      emis: updatedEmis
    });

    const isFullyClosed = updatedEmis.every(e => e.status === 'paid');
    const summaryMsg = `Prepayment of ₹${amountToPay.toLocaleString()} applied under standard Bank Pre-closure Rules!\n\n` +
      `- Future EMIs fully settled: ${emisFullyPrepaid}\n` +
      `- Future EMIs principal reduced: ${emisPartiallyPrepaid}\n` +
      `- Total future interest saved/waived: ₹${savedInterest.toLocaleString()}\n\n` +
      (isFullyClosed ? "🎉 CONGRATULATIONS! Your student loan account is now FULLY PRE-CLOSED!" : "Your updated payment ledger is reflected below.");

    setPrepaySuccessMessage(summaryMsg);
    setTimeout(() => {
      setPrepaySuccessMessage(null);
    }, 15000);

    alert(`Bank Pre-Closure / Prepayment processed successfully!\nInterest saved: ₹${savedInterest.toLocaleString()}`);
  };

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

  // Software Hub Action Simulators
  const [acrobatChecked, setAcrobatChecked] = useState(false);

  const handleIllustratorSim = () => {
    if (isSoftwareSimulating) return;
    setIsSoftwareSimulating(true);
    setSoftwareSimProgress(0);
    setSoftwareTerminalLogs([
      '[SYS] Initializing Adobe Illustrator ExtendScript context...',
      '[SYS] Fetching document handle... app.activeDocument detected.'
    ]);
    const interval = setInterval(() => {
      setSoftwareSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSoftwareSimulating(false);
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] Text layer traversing completed.',
            '[SYS] Text outlines generated successfully for all unvectorized blocks.',
            '[SYS] Script compiled for standard prepress execution.'
          ]);
          return 100;
        }
        if (prev === 40) {
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] Scanning active layers for unoutlined fonts...',
            '[SYS] Found 12 active textframes (fonts: Space Grotesk, Inter).'
          ]);
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleAcrobatSim = () => {
    if (isSoftwareSimulating) return;
    setIsSoftwareSimulating(true);
    setSoftwareSimProgress(0);
    setAcrobatChecked(false);
    setSoftwareTerminalLogs([
      '[SYS] Starting Adobe PDFPrintEngine pre-flight diagnostics...',
      '[SYS] Validating file structures against PDF/X-4:2010 profile...'
    ]);
    const interval = setInterval(() => {
      setSoftwareSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSoftwareSimulating(false);
          setAcrobatChecked(true);
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] PDF compliance certified: PASS',
            '[SYS] OutputIntent FOGRA39 profile is valid.',
            '[SYS] No Low-Res images or active system fonts found.'
          ]);
          return 100;
        }
        if (prev === 40) {
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] Checking embedded color spaces... (Coated GRACoL/FOGRA found)',
            '[SYS] Verifying bleed boundaries... (3.0mm margin confirmed)'
          ]);
        }
        if (prev === 80) {
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] Scanning text vector elements... (100% outlined)',
            '[SYS] Analyzing image plate resolution... (300+ DPI confirmed)'
          ]);
        }
        return prev + 20;
      });
    }, 150);
  };

  const handlePhotoshopModeChange = (mode: 'RGB' | 'CMYK') => {
    setPhotoshopMode(mode);
    if (mode === 'CMYK') {
      setSoftwareTerminalLogs([
        `[SYS] Switching active workspace profile to: Coated GRACoL 2006`,
        `[SYS] Performing RGB to CMYK process plate separation...`,
        `[SYS] Out-of-gamut pixels normalized. Cyan, Magenta, Yellow, Key (Black) plates synchronized.`
      ]);
    } else {
      setSoftwareTerminalLogs([
        `[SYS] Switching active workspace profile to: sRGB IEC61966-2.1`,
        `[SYS] WARNING: RGB profiles are not supported for offset plate production.`,
        `[SYS] Workspace is now calibrated for high-dynamic digital display only.`
      ]);
    }
  };

  const handleFireflySim = () => {
    if (isSoftwareSimulating) return;
    setIsSoftwareSimulating(true);
    setSoftwareSimProgress(0);
    setSoftwareTerminalLogs([
      '[SYS] Connecting to Adobe Firefly Image Generation pipeline...',
      `[SYS] Processing structured design prompt: "${fireflyPrompt}"`
    ]);
    const interval = setInterval(() => {
      setSoftwareSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSoftwareSimulating(false);
          setFireflyImage(fireflyPrompt.toLowerCase().includes('gold') ? 'gold' : fireflyPrompt.toLowerCase().includes('floral') ? 'floral' : 'geometric');
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] Generative AI tile computed.',
            '[SYS] Tile seamlessness boundaries matched.',
            '[SYS] CMYK color separation metadata embedded successfully.'
          ]);
          return 100;
        }
        if (prev === 50) {
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] Generating high-fidelity vector lattice texture...',
            '[SYS] Normalizing ink weights for industrial press coverage...'
          ]);
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleFontServerSync = () => {
    if (isSoftwareSimulating) return;
    setIsSoftwareSimulating(true);
    setSoftwareSimProgress(0);
    setSoftwareTerminalLogs([
      '[SYS] Querying Central Font Server typographical catalog...',
      `[SYS] Selected fonts for distribution: ${activeFonts.join(', ')}`
    ]);
    const interval = setInterval(() => {
      setSoftwareSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSoftwareSimulating(false);
          setFontServerSynced(true);
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] Typographical digital licensing tokens validated.',
            '[SYS] Client terminal synchronization complete.',
            `[SYS] System-wide fonts active: ${activeFonts.length} families.`
          ]);
          return 100;
        }
        if (prev === 50) {
          setSoftwareTerminalLogs(logs => [
            ...logs,
            '[SYS] Packaging OTF/TTF format outlines into RIP cache...',
            '[SYS] Deploying secure licensing tokens to client machines...'
          ]);
        }
        return prev + 25;
      });
    }, 150);
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
              <Laptop className="w-4 h-4" />
              Licensed Software & Toolkit Hub
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
            <button
              onClick={() => setActiveTab('accounts')}
              className={cn(
                "px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2.5",
                activeTab === 'accounts' 
                  ? "border-pink-500 text-white bg-slate-800/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
              id="demo-tab-accounts"
            >
              <CreditCard className="w-4 h-4" />
              Accounts & Fees Panel
            </button>
            <button
              onClick={() => setActiveTab('outcomes')}
              className={cn(
                "px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2.5",
                activeTab === 'outcomes' 
                  ? "border-pink-500 text-white bg-slate-800/40" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
              id="demo-tab-outcomes"
            >
              <Award className="w-4 h-4" />
              Outcome of Program
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

                  <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                    {[
                      { num: 1, name: 'Phase 1: Registration Complete', desc: 'Pre-requisite video & registration verification.' },
                      { num: 2, name: 'Phase 2: Self-Care & Wellness', desc: '15-minute mandatory morning routine module.' },
                      { num: 3, name: 'Phase 3: Entrance Assessment', desc: 'Interactive grammar & logic MCQ test.' },
                      { num: 4, name: 'Phase 4: Verified Class Modules', desc: 'Access to dynamic syllabus, tools, & AI assistance.' },
                      { num: 5, name: 'Phase 5: Master Projects Provided', desc: 'Browse the list of real-world industrial projects we provide.' },
                      { num: 6, name: 'Phase 6: Industrial Visit (IV)', desc: 'On-site industry visits to premier printing and packaging plants.' },
                      { num: 7, name: 'Phase 7: Student Score Card', desc: 'Real-time performance metrics, marks, and attendance log.' },
                      { num: 8, name: 'Phase 8: Internal Interviews', desc: 'Pre-press portfolio defense with senior faculty assessors.' },
                      { num: 9, name: 'Phase 9: HR Interviews', desc: 'Mock HR interviews, communication check, & placement review.' },
                      { num: 10, name: 'Phase 10: Placement Assistance', desc: 'Direct corporate referral and interview dispatch center.' },
                      { num: 11, name: 'Phase 11: Course Certification', desc: 'Award of verified digital diploma in Print & Packaging.' },
                      { num: 12, name: 'Phase 12: Endless Spark Hiring', desc: 'Secured internal employment within our pre-press design agency.' }
                    ].map((stg) => (
                      <button
                        key={stg.num}
                        onClick={() => {
                          if (stg.num === 12) {
                            const hasPendingInvoices = demoInvoice.emis.some(emi => emi.status !== 'paid');
                            if (hasPendingInvoices) {
                              alert("🚫 Access Blocked: Outstanding Dues Detected!\n\nYou have overdue course fee instalments in your commercial ledger. Please resolve all outstanding EMIs under the 'Accounts & Fees Panel' to unlock your internal prepress design employment offer.");
                            }
                          }
                          setDashboardStage(stg.num as any);
                        }}
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
                                  <FileCheck2 className="w-5 h-5 text-pink-600" /> Provided Master Projects
                                </h3>
                                <p className="text-xs text-slate-500">Explore the industrial master projects provided for hands-on student training</p>
                              </div>
                              <span className="px-3 py-1 bg-pink-500/10 text-pink-700 rounded-full text-[10px] font-bold">
                                Master Project Showcase
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
                                      className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-150 transition-colors flex items-center gap-4"
                                    >
                                      <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center shrink-0">
                                        {String(idx + 1).padStart(2, '0')}
                                      </span>
                                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight break-words min-w-0 flex-1">
                                        {proj.projectCode ? `${proj.projectCode} - ${proj.title}` : proj.title}
                                      </h4>
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
                            <span className="text-[10px] text-slate-500">Access campus-wide design licensing, compression algorithms, and font servers.</span>
                            <button 
                              onClick={() => setActiveTab('preflight')}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
                            >
                              Open Licensed Software Hub <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stage 6 Render: Industrial Visit (IV) */}
                    {dashboardStage === 6 && (
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-pink-600" /> Industrial Visit (IV)
                              </h3>
                              <p className="text-xs text-slate-500">Practical on-site factory learning and machinery plant inspection</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                              Status: Completed
                            </span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 mb-5 text-slate-700 leading-relaxed space-y-3">
                            <div className="flex justify-between text-xs font-semibold text-slate-800">
                              <span>Visited Plant: Vanguard Corrugated & Offset Packagers Ltd</span>
                              <span>Date: June 25, 2026</span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Students witnessed heavy industrial prepress and high-speed multi-color printing machines in action, gaining deep vocational exposure to commercial manufacturing.
                            </p>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inspected Plant Modules:</h4>
                            {[
                              { section: 'CTP Direct-Imaging Plate Room', detail: 'Observed thermographic laser exposure & FOGRA39 calibration charts.', duration: '2 Hours' },
                              { section: 'High-Speed 6-Color Offset Press Line', detail: 'Monitored automatic densitometer scanning & ink key controls.', duration: '3 Hours' },
                              { section: 'Post-Press Die-Cutting & Structural Nesting', detail: 'Analyzed automated flatbed punch machines & folding gluers.', duration: '2 Hours' }
                            ].map((item, idx) => (
                              <div key={idx} className="p-3 bg-white border border-slate-150 rounded-xl hover:bg-slate-50 transition-colors flex items-start justify-between gap-3">
                                <div>
                                  <h5 className="text-xs font-bold text-slate-800">{item.section}</h5>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{item.detail}</p>
                                </div>
                                <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">{item.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-5">
                          <span className="text-[10px] text-slate-500">A detailed photo-dossier of the Industrial Visit (IV) has been uploaded & certified.</span>
                          <button 
                            onClick={() => alert("Industrial Visit (IV) Report PDF downloaded successfully!")}
                            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" /> Download IV Report
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stage 7 Render: Student Score Card */}
                    {dashboardStage === 7 && (
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-pink-600" /> Student Score Card & Marks Tracker
                              </h3>
                              <p className="text-xs text-slate-500">Real-time academic records, grades, and overall progress report</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                              Status: Distinction
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggregate Marks</span>
                              <span className="text-3xl font-black text-pink-600 block mt-1">84 / 90</span>
                              <span className="text-[10px] text-slate-500 mt-1 block">Percentage: 93.3%</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Grade</span>
                              <span className="text-3xl font-black text-indigo-600 block mt-1">A+</span>
                              <span className="text-[10px] text-slate-500 mt-1 block">Outstanding Excellence</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Attendance</span>
                              <span className="text-3xl font-black text-slate-800 block mt-1">96%</span>
                              <span className="text-[10px] text-slate-500 mt-1 block">24 of 25 Sessions</span>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Detailed Marks Breakdown:</h4>
                            {[
                              { label: 'Video Lecture Attendance', score: '20 / 20', status: 'Approved', color: 'text-emerald-600 bg-emerald-50' },
                              { label: 'Practical Assignment Draft', score: '9 / 10', status: 'Approved', color: 'text-emerald-600 bg-emerald-50' },
                              { label: 'Weekly Theoretical Worksheet', score: '18 / 20', status: 'Approved', color: 'text-emerald-600 bg-emerald-50' },
                              { label: 'Master Project Execution spec', score: '19 / 20', status: 'Approved', color: 'text-emerald-600 bg-emerald-50' },
                              { label: 'Concept Mind Map Construction', score: '9 / 10', status: 'Approved', color: 'text-emerald-600 bg-emerald-50' },
                              { label: 'Final Online Examination', score: '9 / 10', status: 'Completed', color: 'text-pink-600 bg-pink-50' }
                            ].map((row, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-xl hover:bg-slate-50 transition-colors">
                                <span className="text-xs text-slate-700 font-medium">{row.label}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-slate-900">{row.score}</span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${row.color}`}>
                                    {row.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-5">
                          <span className="text-[10px] text-slate-500">Grading scales strictly comply with industrial pre-press QA standards.</span>
                          <button 
                            onClick={() => alert("Digital Score Card downloaded successfully!")}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" /> Download PDF Report
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stage 8 Render: Internal Interviews */}
                    {dashboardStage === 8 && (
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-pink-600" /> Internal Pre-Press & Design Interviews
                              </h3>
                              <p className="text-xs text-slate-500">Technical assessment with our senior subject matter experts</p>
                            </div>
                            <span className="px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full text-[10px] font-bold">
                              Evaluation Completed
                            </span>
                          </div>

                          <div className="p-4 bg-slate-950 rounded-2xl text-white mb-6 border border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Video className="w-24 h-24" />
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Recorded Assessment Session</span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-100 mb-1">Pre-Press Technology Panel</h4>
                            <p className="text-xs text-slate-400">Interviewer: <strong>Er. Rajesh Kumar</strong> (Chief Trapping Specialist)</p>
                          </div>

                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assessor Ratings & Metrics:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-150">
                                <span className="text-[10px] text-slate-400 block font-medium">Technical & Preflight Concepts</span>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">Trapping, Bleed, Gutter settings</span>
                                  <span className="text-xs font-bold text-pink-600">9.0 / 10</span>
                                </div>
                              </div>
                              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-150">
                                <span className="text-[10px] text-slate-400 block font-medium">Software Excellence</span>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">Illustrator & Automation Scripts</span>
                                  <span className="text-xs font-bold text-pink-600">8.5 / 10</span>
                                </div>
                              </div>
                              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-150">
                                <span className="text-[10px] text-slate-400 block font-medium">Color Calibration Know-How</span>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">FOGRA39 & Dot Gain compensation</span>
                                  <span className="text-xs font-bold text-indigo-600">9.5 / 10</span>
                                </div>
                              </div>
                              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-150">
                                <span className="text-[10px] text-slate-400 block font-medium">Portfolio Presentation</span>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">Master Project layouts</span>
                                  <span className="text-xs font-bold text-indigo-600">8.8 / 10</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 leading-relaxed">
                              <strong>Assessor Feedback:</strong> "Exceptional grasp of mechanical parameters. The candidate explained dot gain compensation curve models flawlessly and illustrated standard nesting algorithms. Highly recommended for corporate interviews."
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-5">
                          <span className="text-[10px] text-slate-500">Upon clearing internal interviews, the profile lock releases for external placement.</span>
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 rounded-full text-[10px] font-bold">
                            Overall Status: Passed & Recommended
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Stage 9 Render: HR Interviews */}
                    {dashboardStage === 9 && (
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-pink-600" /> HR Interviews & Corporate Readiness
                              </h3>
                              <p className="text-xs text-slate-500">Professional behavior, mock interviews, and communication evaluation</p>
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100">
                              Stage: Complete
                            </span>
                          </div>

                          <div className="grid md:grid-cols-12 gap-6 items-start mb-6">
                            <div className="md:col-span-4 text-center p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                                HR
                              </div>
                              <h4 className="font-bold text-xs text-slate-800">Ms. Neha Sharma</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">Corporate Placement Head</p>
                              <div className="mt-3 inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-700 text-[9px] font-bold rounded-full">
                                Mock Rated: 4.8 / 5
                              </div>
                            </div>

                            <div className="md:col-span-8 space-y-4">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Corporate Preparation Checklist:</h4>
                              <div className="space-y-2">
                                {[
                                  { task: 'Self-Introduction & Elevator Pitch Tuning', status: 'Completed', detail: 'Formulated a concise summary of specialized training.' },
                                  { task: 'Professional Behavior & Workplace Ethics', status: 'Completed', detail: 'Passed mock behavioral situational scenario test.' },
                                  { task: 'Salary and Package Negotiation Workshop', status: 'Completed', detail: 'Trained on industrial benchmarks and salary structure.' },
                                  { task: 'Pre-press Agency Portfolio Compilation', status: 'Completed', detail: 'Consolidated master project sheets in clean physical folders.' }
                                ].map((item, idx) => (
                                  <div key={idx} className="p-3 bg-white border border-slate-150 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                      <span className="text-xs font-bold text-slate-800">{item.task}</span>
                                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">{item.status}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 pl-0.5">{item.detail}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-5">
                          <span className="text-[10px] text-slate-500">Corporate readiness certificate is appended to final student dossier.</span>
                          <button 
                            onClick={() => alert("Ready to dispatch! Placement support activated.")}
                            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            Activate Placements Portal
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stage 10 Render: Placement Assistance */}
                    {dashboardStage === 10 && (
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          {/* Main Section Header */}
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-pink-600" /> Career Center & Placements Sandbox
                              </h3>
                              <p className="text-xs text-slate-500">Track mock interviews, register new students, and manage official historical corporate placements</p>
                            </div>
                            <span className="px-3 py-1 bg-pink-500/10 text-pink-700 rounded-full text-[10px] font-bold">
                              {careerCenterTab === 'dispatch' ? '4 Open Interviews' : careerCenterTab === 'alumni' ? 'Corporate Records' : `${students.length} Registered Students`}
                            </span>
                          </div>

                          {/* Sub Tabs */}
                          <div className="flex flex-wrap sm:flex-nowrap gap-1.5 mb-4 bg-slate-100/85 p-1 rounded-xl">
                            <button
                              onClick={() => setCareerCenterTab('dispatch')}
                              className={cn(
                                "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap",
                                careerCenterTab === 'dispatch' 
                                  ? "bg-white text-slate-800 shadow-sm" 
                                  : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              <Clock className="w-3.5 h-3.5" /> Dispatch Log
                            </button>
                            <button
                              onClick={() => setCareerCenterTab('alumni')}
                              className={cn(
                                "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap",
                                careerCenterTab === 'alumni' 
                                  ? "bg-white text-slate-800 shadow-sm" 
                                  : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              <Award className="w-3.5 h-3.5" /> Corporate Records
                            </button>
                            <button
                              onClick={() => {
                                setCareerCenterTab('students');
                                setEditingStudent(null);
                                setShowAddNewStudentForm(false);
                              }}
                              className={cn(
                                "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap",
                                careerCenterTab === 'students' 
                                  ? "bg-white text-slate-800 shadow-sm" 
                                  : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              <Users className="w-3.5 h-3.5 text-indigo-500" /> Student Placements
                            </button>
                          </div>

                          {careerCenterTab === 'dispatch' ? (
                            <div className="space-y-4">
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 text-xs text-slate-700 leading-relaxed">
                                💡 <strong>Direct Placement Pipeline:</strong> We share student profiles and certified project briefs with premium print and packaging industries directly. Here is your application dispatch log:
                              </div>

                              <div className="space-y-3">
                                {[
                                  { company: 'Vanguard Carton Packaging Ltd', role: 'Junior Pre-Press Engineer', status: 'Interview Scheduled', date: 'July 15, 2026', type: 'Off-Campus', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                  { company: 'Galaxy Flexibles Private Ltd', role: 'Plate-Ready Engineer', status: 'Shortlisted', date: 'Under Review', type: 'Direct Placement', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                                  { company: 'Trident Print Media Group', role: 'Color Specialist', status: 'Application Dispatched', date: 'Dispatched July 05', type: 'Partner Pool', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                                  { company: 'Alpha Corrugated Box Labs', role: 'Structural Packaging Draftsman', status: 'Screening Passed', date: 'July 18, 2026', type: 'Off-Campus', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                                ].map((job, idx) => (
                                  <div key={idx} className="p-3.5 bg-white border border-slate-150 rounded-xl hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-xs text-slate-800">{job.company}</h4>
                                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{job.type}</span>
                                      </div>
                                      <p className="text-[11px] text-slate-500">{job.role} • <span className="font-mono text-[10px] text-indigo-500 font-semibold">{job.date}</span></p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border text-center shrink-0 ${job.color}`}>
                                      {job.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : careerCenterTab === 'alumni' ? (
                            <div className="space-y-4">
                              {/* Alumni Placements List */}
                              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                {(!placementSettings || !placementSettings.yearlyRecords || placementSettings.yearlyRecords.length === 0) ? (
                                  <div className="p-4 text-center text-slate-450 italic text-xs bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                                    <p className="text-slate-600 font-medium">No custom corporate records uploaded yet. Showing default alumni hiring partners:</p>
                                    <div className="grid grid-cols-1 gap-3 not-italic">
                                      <div className="p-4 bg-white border border-slate-150 rounded-xl flex justify-between items-center text-xs shadow-xs">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 border border-slate-100 rounded bg-white flex items-center justify-center p-0.5 shadow-xs shrink-0">
                                            <Building className="w-4 h-4 text-slate-400" />
                                          </div>
                                          <div className="text-left">
                                            <div className="font-bold text-slate-800">Endless Spark Print Systems</div>
                                            <div className="text-slate-500 text-[10px]">12 Students Placed successfully (2024-2025)</div>
                                          </div>
                                        </div>
                                        <span className="font-bold text-indigo-600 shrink-0">₹ 4,50,000 max</span>
                                      </div>
                                      <div className="p-4 bg-white border border-slate-150 rounded-xl flex justify-between items-center text-xs shadow-xs">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 border border-slate-100 rounded bg-white flex items-center justify-center p-0.5 shadow-xs shrink-0">
                                            <Building className="w-4 h-4 text-slate-400" />
                                          </div>
                                          <div className="text-left">
                                            <div className="font-bold text-slate-800">Spectrum Flexo Graphics</div>
                                            <div className="text-slate-500 text-[10px]">8 Students Placed successfully (2023-2024)</div>
                                          </div>
                                        </div>
                                        <span className="font-bold text-indigo-600 shrink-0">₹ 3,80,000 max</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  [...placementSettings.yearlyRecords]
                                    .sort((a, b) => b.year.localeCompare(a.year))
                                    .map(yr => (
                                      <div key={yr.year} className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs space-y-3 mb-3">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md">
                                              Year {yr.year}
                                            </span>
                                            <h5 className="text-xs font-bold text-slate-800">Campus Drive</h5>
                                          </div>
                                          <span className="text-[10px] text-slate-500 font-medium">
                                            Total: <strong className="text-slate-800 font-black">{yr.records.reduce((acc: number, r: any) => acc + (r.studentsPlaced || 0), 0)} placed</strong>
                                          </span>
                                        </div>
                                        <div className="space-y-2">
                                          {yr.records.map((rec: any) => (
                                            <div key={rec.id} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2 transition-all duration-200">
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <CompanyLogo src={rec.logoUrl} name={rec.companyName} className="w-8 h-8 border border-slate-200/80 rounded-lg bg-white shadow-xs" />
                                                <div className="min-w-0">
                                                  <h6 className="font-bold text-slate-800 text-xs truncate" title={rec.companyName}>
                                                    {rec.companyName}
                                                  </h6>
                                                  <p className="text-[10px] text-slate-500">
                                                    {rec.studentsPlaced} {rec.studentsPlaced === 1 ? 'Student' : 'Students'} Placed
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="text-right shrink-0">
                                                <span className="block text-[8px] text-slate-400 uppercase font-bold">Highest Package</span>
                                                <span className="font-bold text-xs text-indigo-600 font-mono">
                                                  ₹{rec.highestPackage ? rec.highestPackage.toLocaleString('en-IN') : '0'}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                          {yr.records.length === 0 && (
                                            <div className="text-center text-slate-400 italic text-[10px]">No records registered for this year.</div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                )}
                              </div>

                              {/* Form to Add New Record */}
                              <form onSubmit={handleAddAlumniRecord} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                                  <Plus className="w-4 h-4 text-pink-600" /> Add New Alumni Placement Record
                                </h4>
                                <p className="text-[10px] text-slate-500">Submit new student placements. This automatically updates the official Placements & Career dataset.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Academic Year</label>
                                    <select
                                      value={newAlumniYear}
                                      onChange={(e) => setNewAlumniYear(e.target.value)}
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 transition-all"
                                    >
                                      <option value="2025-2026">2025-2026</option>
                                      <option value="2024-2025">2024-2025</option>
                                      <option value="2023-2024">2023-2024</option>
                                      <option value="2022-2023">2022-2023</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Company Name</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Tetra Pak India"
                                      value={newAlumniCompanyName}
                                      onChange={(e) => setNewAlumniCompanyName(e.target.value)}
                                      required
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Students Placed</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={newAlumniStudentsPlaced}
                                      onChange={(e) => setNewAlumniStudentsPlaced(e.target.value)}
                                      required
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 transition-all font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Highest Package (₹ per annum)</label>
                                    <input
                                      type="number"
                                      placeholder="e.g. 550000"
                                      value={newAlumniHighestPackage}
                                      onChange={(e) => setNewAlumniHighestPackage(e.target.value)}
                                      required
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 transition-all font-semibold"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Company Logo URL (optional)</label>
                                    <input
                                      type="url"
                                      placeholder="e.g. https://logo.clearbit.com/tetrapak.com"
                                      value={newAlumniLogoUrl}
                                      onChange={(e) => setNewAlumniLogoUrl(e.target.value)}
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  disabled={isSavingAlumni}
                                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-[11px] font-black tracking-wider shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                                >
                                  {isSavingAlumni ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Corporate Record...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Save Record & Sync with Career Center
                                    </>
                                  )}
                                </button>
                              </form>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150 gap-2">
                                <span className="text-[11px] font-semibold text-slate-600">
                                  Manage individual student placement tracking, updates, and eligibility profiles.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddNewStudentForm(!showAddNewStudentForm);
                                    setEditingStudent(null);
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shrink-0"
                                >
                                  <Plus className="w-3 h-3" /> Add New Student Record
                                </button>
                              </div>

                              {showAddNewStudentForm ? (
                                <form onSubmit={handleCreateNewStudent} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                  <div className="flex justify-between items-center border-b pb-2 mb-2">
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                      <Users className="w-4 h-4 text-indigo-600" /> Register New Student & Placement Profile
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => setShowAddNewStudentForm(false)}
                                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Student Name *</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. Anand Sharma"
                                        value={newStudentForm.name}
                                        onChange={e => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Email Address *</label>
                                      <input
                                        type="email"
                                        required
                                        placeholder="anand@example.com"
                                        value={newStudentForm.email}
                                        onChange={e => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                                      <input
                                        type="tel"
                                        placeholder="9876543210"
                                        value={newStudentForm.phone}
                                        onChange={e => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Assigned Course</label>
                                      <select
                                        value={newStudentForm.assignedCourse}
                                        onChange={e => setNewStudentForm({ ...newStudentForm, assignedCourse: e.target.value })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                      >
                                        <option value="production-art-engineer">Diploma in Production Art Engineer</option>
                                        <option value="packaging-engineer">Diploma in Packaging Engineer</option>
                                        <option value="print-ready-engineer">Diploma in Print Ready Engineer</option>
                                        <option value="plate-ready-engineer">Diploma in Plate Ready Engineer</option>
                                        <option value="colour-retouching-engineer">Diploma in Colour Retouching Engineer</option>
                                        <option value="quality-control-engineer">Diploma in Quality Control Engineer</option>
                                        <option value="printing-and-packaging-cross-courses">Printing and Packaging Cross Courses</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Placement Eligibility</label>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <input
                                          type="checkbox"
                                          id="newStudentEligible"
                                          checked={newStudentForm.eligible}
                                          onChange={e => setNewStudentForm({ ...newStudentForm, eligible: e.target.checked })}
                                          className="accent-pink-600 w-4 h-4 cursor-pointer"
                                        />
                                        <label htmlFor="newStudentEligible" className="text-xs text-slate-700 font-semibold cursor-pointer">Approved Eligible</label>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Current Placement Status</label>
                                      <select
                                        value={newStudentForm.status}
                                        onChange={e => setNewStudentForm({ ...newStudentForm, status: e.target.value as any })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                      >
                                        <option value="Course Ongoing">Course Ongoing</option>
                                        <option value="Pending">Pending (Searching)</option>
                                        <option value="Interview Scheduled">Interview Scheduled</option>
                                        <option value="Not Placed">Not Placed</option>
                                        <option value="Placed">Placed successfully</option>
                                      </select>
                                    </div>

                                    {newStudentForm.status === 'Placed' && (
                                      <>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Placed Company Name</label>
                                          <input
                                            type="text"
                                            required
                                            placeholder="e.g. Amcor India"
                                            value={newStudentForm.placedCompany}
                                            onChange={e => setNewStudentForm({ ...newStudentForm, placedCompany: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Annual Package (₹ per annum)</label>
                                          <input
                                            type="text"
                                            required
                                            placeholder="e.g. 5,20,000"
                                            value={newStudentForm.packageAmount}
                                            onChange={e => setNewStudentForm({ ...newStudentForm, packageAmount: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                          />
                                        </div>
                                      </>
                                    )}

                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Coordinator / Board Placement Notes</label>
                                      <textarea
                                        placeholder="e.g. Shortlisted for final interview round at Amcor..."
                                        value={newStudentForm.notes}
                                        onChange={e => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs min-h-[60px]"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={isUpdatingStudentPlacement}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-black tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                                  >
                                    {isUpdatingStudentPlacement ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />} Register Student Details
                                  </button>
                                </form>
                              ) : editingStudent ? (
                                <form onSubmit={handleSaveStudentPlacement} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                  <div className="flex justify-between items-center border-b pb-2 mb-2">
                                    <div>
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                        Update {editingStudent.name}
                                      </h4>
                                      <p className="text-[10px] text-slate-500">{editingStudent.email}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setEditingStudent(null)}
                                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                                    >
                                      Back to List
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Placement Eligibility</label>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <input
                                          type="checkbox"
                                          id="editEligible"
                                          checked={studentPlacementForm.eligible}
                                          onChange={e => setStudentPlacementForm({ ...studentPlacementForm, eligible: e.target.checked })}
                                          className="accent-pink-600 w-4 h-4 cursor-pointer"
                                        />
                                        <label htmlFor="editEligible" className="text-xs text-slate-700 font-semibold cursor-pointer">Eligible for Placements</label>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Placement Status</label>
                                      <select
                                        value={studentPlacementForm.status}
                                        onChange={e => setStudentPlacementForm({ ...studentPlacementForm, status: e.target.value as any })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                      >
                                        <option value="Course Ongoing">Course Ongoing</option>
                                        <option value="Pending">Pending (Searching)</option>
                                        <option value="Interview Scheduled">Interview Scheduled</option>
                                        <option value="Not Placed">Not Placed</option>
                                        <option value="Placed">Placed successfully</option>
                                      </select>
                                    </div>

                                    {studentPlacementForm.status === 'Interview Scheduled' && (
                                      <>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Interview Company Name</label>
                                          <input
                                            type="text"
                                            required
                                            placeholder="e.g. Vanguard Carton"
                                            value={studentPlacementForm.interviewCompany}
                                            onChange={e => setStudentPlacementForm({ ...studentPlacementForm, interviewCompany: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Interview Date & Time</label>
                                          <input
                                            type="datetime-local"
                                            required
                                            value={studentPlacementForm.interviewDate}
                                            onChange={e => setStudentPlacementForm({ ...studentPlacementForm, interviewDate: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs font-mono"
                                          />
                                        </div>
                                      </>
                                    )}

                                    {studentPlacementForm.status === 'Placed' && (
                                      <>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Placed Company Name</label>
                                          <input
                                            type="text"
                                            required
                                            placeholder="e.g. Vanguard Carton"
                                            value={studentPlacementForm.placedCompany}
                                            onChange={e => setStudentPlacementForm({ ...studentPlacementForm, placedCompany: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs font-semibold"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Annual Package (₹ per annum)</label>
                                          <input
                                            type="text"
                                            required
                                            placeholder="e.g. 4,50,000"
                                            value={studentPlacementForm.packageAmount}
                                            onChange={e => setStudentPlacementForm({ ...studentPlacementForm, packageAmount: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs font-semibold"
                                          />
                                        </div>
                                      </>
                                    )}

                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Coordinator / Board Placement Notes</label>
                                      <textarea
                                        placeholder="e.g. Profile forwarded to Vanguard Carton. Shortlisted."
                                        value={studentPlacementForm.notes}
                                        onChange={e => setStudentPlacementForm({ ...studentPlacementForm, notes: e.target.value })}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-xl text-xs min-h-[60px]"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={isUpdatingStudentPlacement}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-black tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                                  >
                                    {isUpdatingStudentPlacement ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />} Save Placement Details
                                  </button>
                                </form>
                              ) : (
                                <div className="space-y-3">
                                  {/* Search */}
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="Search students by name or email..."
                                      value={studentSearchTerm}
                                      onChange={e => setStudentSearchTerm(e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 transition-all font-medium pl-8"
                                    />
                                    <span className="absolute left-2.5 top-2.5 text-slate-400">
                                      <Users className="w-4 h-4" />
                                    </span>
                                  </div>

                                  {/* Student Grid list */}
                                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                    {students.length === 0 ? (
                                      <div className="p-8 text-center text-slate-400 italic text-xs bg-slate-50 border border-slate-150 rounded-2xl">
                                        No registered students found in database. Use the "Add New Student Record" button to register one.
                                      </div>
                                    ) : (
                                      students
                                        .filter(s => 
                                          s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
                                          s.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                                        )
                                        .map((student, idx) => {
                                          const info = student.placementInfo || { eligible: false, status: 'Course Ongoing' };
                                          return (
                                            <div 
                                              key={student.id || idx} 
                                              onClick={() => {
                                                setEditingStudent(student);
                                                setStudentPlacementForm({
                                                  eligible: info.eligible ?? false,
                                                  status: info.status || 'Course Ongoing',
                                                  placedCompany: info.placedCompany || '',
                                                  packageAmount: info.packageAmount || '',
                                                  interviewCompany: info.interviewCompany || '',
                                                  interviewDate: info.interviewDate || '',
                                                  notes: info.notes || ''
                                                });
                                              }}
                                              className="p-3 bg-white border border-slate-150 rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex justify-between items-center group"
                                            >
                                              <div>
                                                <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                  {student.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                  {student.email} • <span className="font-medium text-slate-400">{student.assignedCourse?.replace(/-/g, ' ')}</span>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-2">
                                                <span className={cn(
                                                  "text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                                                  info.status === 'Placed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                  info.status === 'Interview Scheduled' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                  "bg-slate-50 text-slate-600 border-slate-150"
                                                )}>
                                                  {info.status || 'Ongoing'}
                                                </span>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                                              </div>
                                            </div>
                                          );
                                        })
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-5">
                          <span className="text-[10px] text-slate-500">Placement coordinators update selection statuses directly through Firestore.</span>
                          <button 
                            onClick={() => alert("Placement coordinator contacted. They will email your schedule!")}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            Contact Placement Officer
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stage 11 Render: Course Certification */}
                    {dashboardStage === 11 && (
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-pink-600" /> Professional Course Certification
                              </h3>
                              <p className="text-xs text-slate-500">Verified institutional diploma credential in Printing & Packaging Engineering</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                              Verified Issued
                            </span>
                          </div>

                          {/* Certificate Mock Box */}
                          <div className="p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-2xl border-4 border-double border-amber-300 relative text-center mb-6 shadow-inner overflow-hidden">
                            <div className="absolute inset-0 border border-slate-200/50 m-2.5" />
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Award className="w-32 h-32 text-amber-500" />
                            </div>
                            
                            <h4 className="font-serif text-amber-800 text-[11px] font-bold tracking-widest uppercase mb-1">Diploma Certificate of Completion</h4>
                            <div className="w-10 h-0.5 bg-amber-400 mx-auto mb-4" />
                            
                            <p className="text-[9px] text-slate-500 italic">This is proudly presented to</p>
                            <h5 className="font-extrabold text-slate-900 text-base my-2 font-sans tracking-tight">
                              {user?.name || "Distinguished Student Lead"}
                            </h5>
                            <p className="text-[10px] text-slate-600 leading-relaxed max-w-md mx-auto mb-4">
                              for successfully demonstrating absolute technical proficiency and clearing all pre-flight automation, trapping layout, and structural specifications in
                            </p>
                            <h6 className="font-bold text-indigo-700 text-xs uppercase tracking-wider mb-5">
                              {selectedCourse.title}
                            </h6>

                            <div className="flex items-center justify-between px-6 text-left mt-6 pt-3 border-t border-slate-200/50">
                              <div>
                                <span className="text-[8px] text-slate-400 block font-bold">VERIFICATION ID</span>
                                <span className="font-mono text-[9px] text-slate-700 font-bold">ES-CERT-94031-2026</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-slate-400 block font-bold">ACADEMIC REGISTRAR</span>
                                <span className="text-[9px] text-slate-800 font-semibold italic">Endless Spark School</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-5">
                          <span className="text-[10px] text-slate-500">This certificate carries an authentic cryptographical QR code for employer verification.</span>
                          <button 
                            onClick={() => alert("High-res diploma PDF generation started!")}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" /> Download High-Res PDF
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stage 12 Render: Employment in Endless Spark */}
                    {dashboardStage === 12 && (() => {
                      const hasPendingInvoices = demoInvoice.emis.some(emi => emi.status !== 'paid');
                      
                      if (hasPendingInvoices) {
                        return (
                          <div className="flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                                <div>
                                  <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" /> Access Locked: Outstanding Dues Detected
                                  </h3>
                                  <p className="text-xs text-slate-500">Student Account Ledger holds pending commercial invoices</p>
                                </div>
                                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-bold border border-red-100">
                                  Hiring Lock Active
                                </span>
                              </div>

                              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4 my-6">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                                  <Lock className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-extrabold text-red-800">Commercial Ledger Verification Failed</h4>
                                <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">
                                  Your final internal employment contract with the **Endless Spark Pre-Press Design Hub** has been temporarily locked. Institutional policies require a clean commercial balance sheet before executing payroll and corporate onboarding.
                                </p>
                                
                                <div className="bg-white rounded-xl p-4 border border-red-150 max-w-sm mx-auto text-left space-y-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unpaid Dues Summary:</p>
                                  {demoInvoice.emis.filter(e => e.status !== 'paid').map(e => (
                                    <div key={e.emiNumber} className="flex items-center justify-between text-xs font-mono">
                                      <span className="text-slate-600">EMI instalment #{e.emiNumber} (Due: {e.dueDate})</span>
                                      <span className="font-bold text-red-600">₹{(e.baseAmount + e.interestAmount).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-5">
                              <span className="text-[10px] text-slate-500">Go to the Accounts & Fees Panel to clear outstanding instalments to automatically unlock this stage.</span>
                              <button 
                                onClick={() => setActiveTab('accounts')}
                                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm shadow-pink-900/15 cursor-pointer"
                              >
                                Go to Accounts & Fees <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                  <Award className="w-5 h-5 text-pink-600" /> Internal Employment: Endless Spark Prepress Hub
                                </h3>
                                <p className="text-xs text-slate-500">Congratulations! Employment offer for internal production agency</p>
                              </div>
                              <span className="px-3 py-1 bg-pink-500/10 text-pink-700 rounded-full text-[10px] font-bold">
                                {offerAccepted ? "Offer Accepted!" : "Offer Released"}
                              </span>
                            </div>

                            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 mb-6 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Award className="w-24 h-24 text-pink-500" />
                              </div>
                              <h4 className="font-bold text-sm mb-1 text-pink-300">Pre-Press Automation Engineer / QC Specialist</h4>
                              <p className="text-xs text-slate-300">Division: Prepress, Art, Trapping & Verification Center</p>
                              
                              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Starting Package</span>
                                  <span className="font-bold text-white">₹4.8 Lakhs Per Annum (LPA)</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Work Location</span>
                                  <span className="font-bold text-white">Endless Spark Design Hub / Remote</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Internal Onboarding Requirements:</h4>
                              <div className="space-y-2 text-xs text-slate-600">
                                <p>• <strong>Joining Date:</strong> August 01, 2026</p>
                                <p>• <strong>Direct Scope:</strong> Handle high-resolution pre-flight packaging artwork diagnostics and construct production-ready trap lines.</p>
                                <p>• <strong>Verification Step:</strong> Digitally execute the employment bond agreement directly inside your dashboard.</p>
                              </div>

                              {offerAccepted ? (
                                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
                                  🎉 Offer Accepted! Welcome to the Endless Spark Core Team. We are preparing your login credentials!
                                </div>
                              ) : (
                                <button
                                  onClick={() => setOfferAccepted(true)}
                                  className="mt-4 w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-pink-900/10 cursor-pointer"
                                >
                                  Digitally Sign & Accept Employment Offer
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4 mt-5">
                            <span className="text-[10px] text-slate-500">Employment with Endless Spark is subject to satisfactory completion of final master project specifications.</span>
                            <span className="text-[10px] text-slate-400 italic">Issued by: Director of Admissions & Recruiting</span>
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
              className="space-y-6"
            >
              {/* AI Agent Sub-navigation Switcher */}
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-4xl mx-auto">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-3 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-pink-500 animate-pulse" />
                  Select AI Agent Demo View:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setAiSubTab('prepress')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                      aiSubTab === 'prepress'
                        ? "bg-pink-600 text-white shadow-md shadow-pink-900/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    )}
                    id="ai-subtab-prepress"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Pre-press Expert Chatbot
                  </button>
                  <button
                    onClick={() => setAiSubTab('student-agent')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                      aiSubTab === 'student-agent'
                        ? "bg-pink-600 text-white shadow-md shadow-pink-900/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    )}
                    id="ai-subtab-student-agent"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Smart Student Agent Console
                  </button>
                </div>
              </div>

              {aiSubTab === 'prepress' ? (
                <div className="grid lg:grid-cols-12 gap-8">
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
                              className="w-full text-left p-2.5 bg-slate-50 hover:bg-pink-50/50 hover:text-pink-600 rounded-xl text-xs text-slate-700 font-medium transition-all border border-slate-100 truncate block cursor-pointer"
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
                          className="px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all font-bold flex items-center justify-center shrink-0 cursor-pointer"
                          id="ai-chat-send-btn"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-150 p-6 md:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
                      <Bot className="w-6 h-6 text-pink-600 animate-bounce" /> Smart Student AI Agent Console
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      Experience the multi-functional companion built for Endless Spark students. Learn concepts via chat, test your knowledge with instant AI-generated MCQ quizzes, or practice standard speech interviews using the verbal <strong>Communication Coach</strong>.
                    </p>
                  </div>
                  <StudentAIAgent embedded />
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: Licensed Software & Font Server Workspace */}
          {activeTab === 'preflight' && (() => {
            const softwares = [
              {
                id: 'illustrator',
                name: 'Adobe Illustrator',
                tagline: 'Vector Pre-press & Packaging Design',
                version: '2026 (v30.2.1) Enterprise',
                status: 'Running',
                licenseType: 'Creative Cloud Floating',
                icon: 'Laptop',
                color: 'amber',
                info: 'Used for bleed definition, custom trapping paths, spot colors, and packaging layouts. Automate text-to-outline conversion with ExtendScript.',
                specs: [
                  { label: 'Spot Plates', value: 'Pantone® Solid Coated active' },
                  { label: 'Standard Profile', value: 'FOGRA39 (ISO 12647-2)' },
                  { label: 'ExtendScript Engine', value: 'v4.8 Active' }
                ]
              },
              {
                id: 'photoshop',
                name: 'Adobe Photoshop',
                tagline: 'High-Resolution Raster Color Separation',
                version: '2026 (v27.0.1) Enterprise',
                status: 'Active',
                licenseType: 'Creative Cloud Floating',
                icon: 'Layers',
                color: 'blue',
                info: 'Used for photographic image cropping, high-DPI raster pre-processing, and multi-channel CMYK plate adjustments.',
                specs: [
                  { label: 'Max Target Resolution', value: '300-600 DPI' },
                  { label: 'ICC Profile Link', value: 'Coated GRACoL 2006' },
                  { label: 'Dot Gain Calibration', value: 'Standard 15% Offset' }
                ]
              },
              {
                id: 'acrobat',
                name: 'Adobe Acrobat Pro',
                tagline: 'PDF/X Compliance, Preflighting & RIP Optimization',
                version: '2026 Continuous Edition',
                status: 'Active',
                licenseType: 'Enterprise Standard',
                icon: 'FileText',
                color: 'red',
                info: 'Ensures output files are fully compliant with PDF/X-1a, PDF/X-3, or PDF/X-4 print standards, ensuring fonts are fully embedded or vectorized.',
                specs: [
                  { label: 'PDF Compliance Standard', value: 'PDF/X-4:2010 compliant' },
                  { label: 'PostScript Engine', value: 'Adobe PDFPrintEngine v6' },
                  { label: 'Font Inclusions', value: '100% Embedded' }
                ]
              },
              {
                id: 'nanobanana',
                name: 'Nano Banana',
                tagline: 'High-Performance Asset Compression & Vector Micro-Packer',
                version: 'v2.8.4 Academic Build',
                status: 'Ready',
                licenseType: 'Academic Campus Site License',
                icon: 'Cpu',
                color: 'yellow',
                info: 'A specialized, ultra-fast vector cruncher that cleans layout waste, strips metadata duplicates, and shrinks complex files to save bandwidth on automated high-speed printers.',
                specs: [
                  { label: 'Compression Ratio', value: 'Average 62% reduction' },
                  { label: 'SVG Optimizer', value: 'SVGO-Banana custom' },
                  { label: 'File Integrity', value: 'Lossless' }
                ]
              },
              {
                id: 'firefly',
                name: 'Adobe Firefly',
                tagline: 'Generative AI for Smart Assets & Packaging Textures',
                version: 'v4.0 API Integrator',
                status: 'Connected',
                licenseType: 'API Commercial License',
                icon: 'Bot',
                color: 'purple',
                info: 'Generate pristine packaging background patterns, high-fidelity mock textures, and prompt-driven brand assets seamlessly.',
                specs: [
                  { label: 'Model Version', value: 'Firefly Image v4.0' },
                  { label: 'Resolution Cap', value: '4096 x 4096 SuperRes' },
                  { label: 'Safety Filters', value: 'Commercial safe active' }
                ]
              },
              {
                id: 'fontserver',
                name: 'Endless Spark Font Server',
                tagline: 'Academic Typographical Distribution & Server License',
                version: 'v5.1 Central',
                status: 'Online',
                licenseType: 'Unlimited Client License',
                icon: 'Type',
                color: 'teal',
                info: 'Ensures license-compliant typography distribution across all classroom terminals. Auto-injects standard prepress font libraries to prevent rasterization failures.',
                specs: [
                  { label: 'Active Distribution', value: 'Space Grotesk, Inter, Fira Code' },
                  { label: 'Licensing Verification', value: 'OFL & Commercial active' },
                  { label: 'Server Ingress Port', value: 'Port 8042 (Secure TLS)' }
                ]
              }
            ];

            const currentSoftware = softwares.find(s => s.id === selectedSoftwareId) || softwares[0];

            return (
              <motion.div
                key="preflight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid lg:grid-cols-12 gap-8"
              >
                {/* Left Software List */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                        <Laptop className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-none">
                          Software & Licensing Hub
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Central Academic Directory</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                      All campus terminals are fully equipped with enterprise-grade design utilities and font sync systems. Select an active platform below to interact with its virtual prepress workstation.
                    </p>

                    <div className="space-y-2">
                      {softwares.map((sw) => {
                        return (
                          <button
                            key={sw.id}
                            onClick={() => {
                              setSelectedSoftwareId(sw.id);
                              setSoftwareTerminalLogs([`[SYS] Switched console workspace focus to: ${sw.name}`]);
                              setSoftwareSimProgress(0);
                            }}
                            className={cn(
                              "w-full text-left p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer",
                              selectedSoftwareId === sw.id 
                                ? "border-pink-600 bg-pink-50/10 text-pink-700 shadow-sm" 
                                : "border-slate-150 hover:border-slate-200 hover:bg-slate-50/50"
                            )}
                            id={`software-item-${sw.id}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white font-black text-xs",
                                sw.color === 'amber' && "bg-amber-500",
                                sw.color === 'blue' && "bg-blue-600",
                                sw.color === 'red' && "bg-rose-600",
                                sw.color === 'yellow' && "bg-yellow-500 text-slate-950",
                                sw.color === 'purple' && "bg-purple-600",
                                sw.color === 'teal' && "bg-teal-600"
                              )}>
                                {sw.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'SW'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 block truncate">{sw.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">{sw.tagline}</span>
                              </div>
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0",
                              sw.status === 'Running' || sw.status === 'Active' || sw.status === 'Connected' || sw.status === 'Online'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            )}>
                              {sw.status}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Licensing Status Dashboard</span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Seat Limit:</span>
                        <span className="font-bold text-slate-200">500 Terminals</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Active Sync:</span>
                        <span className="font-bold text-slate-200 text-emerald-400">100% OK</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Prepress Workspace */}
                <div className="lg:col-span-7">
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col justify-between">
                    <div className="p-6 sm:p-8 space-y-6">
                      
                      {/* Workstation Header */}
                      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono text-white",
                              currentSoftware.color === 'amber' && "bg-amber-500",
                              currentSoftware.color === 'blue' && "bg-blue-600",
                              currentSoftware.color === 'red' && "bg-rose-600",
                              currentSoftware.color === 'yellow' && "bg-yellow-500 text-slate-950",
                              currentSoftware.color === 'purple' && "bg-purple-600",
                              currentSoftware.color === 'teal' && "bg-teal-600"
                            )}>
                              {currentSoftware.id.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">{currentSoftware.version}</span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 tracking-tight">{currentSoftware.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{currentSoftware.tagline}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full font-mono shrink-0">
                          ✓ LICENSED
                        </span>
                      </div>

                      {/* Info and specs */}
                      <div className="space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {currentSoftware.info}
                        </p>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {currentSoftware.specs.map((sp, idx) => (
                            <div key={idx} className="p-3 bg-white border border-slate-150 rounded-xl">
                              <span className="text-[9px] text-slate-400 font-semibold uppercase block mb-1">{sp.label}</span>
                              <span className="text-xs font-bold text-slate-800 block truncate">{sp.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* INTERACTIVE WORKSPACE DESK */}
                      <div className="border-t border-slate-100 pt-5 space-y-4">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Terminal className="w-4 h-4 text-pink-600" /> Interactive Prepress Workstation Sandbox
                        </h5>

                        {/* WORKSPACE COMPONENT BY ID */}
                        {selectedSoftwareId === 'illustrator' && (
                          <div className="space-y-3">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">Dynamic Text-to-Outline ExtendScript Compiler</span>
                                <span className="text-[10px] text-pink-600 font-bold font-mono">Adobe Scripting SDK</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Automatically outlines all text elements in an open Illustrator layout draft before rendering plates. Outlining stops font substitution failures in the raster line.
                              </p>
                              <div className="pt-2">
                                <button
                                  onClick={handleIllustratorSim}
                                  disabled={isSoftwareSimulating}
                                  className="px-4 py-2.5 bg-slate-900 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  {isSoftwareSimulating ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Compiling Outliner Script...
                                    </>
                                  ) : (
                                    <>
                                      <Cpu className="w-3.5 h-3.5" />
                                      Compile Text Outlining Script
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Compiled script view */}
                            {!isSoftwareSimulating && softwareSimProgress === 100 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">✓ Build Complete</span>
                                <pre className="bg-slate-950 text-emerald-400 font-mono p-4 rounded-2xl overflow-x-auto text-[10px] border border-slate-850 select-all max-h-[160px]">
                                  <code>{`// Endless Spark Prepress Font Outliner
(function() {
  var doc = app.activeDocument;
  var textFrames = doc.textFrames;
  var count = 0;
  for (var i = textFrames.length - 1; i >= 0; i--) {
    var tf = textFrames[i];
    if (!tf.locked && tf.layer.visible) {
      tf.createOutline();
      count++;
    }
  }
  alert('Outlined ' + count + ' layout elements successfully.');
})();`}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedSoftwareId === 'photoshop' && (
                          <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">Raster CMYK Color Plate Separation</span>
                                <span className="text-[10px] text-blue-600 font-bold font-mono">ICC Engine V4</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Switch the color workspace mode to convert image arrays from display RGB into subtractive Cyan, Magenta, Yellow, and Black plate separations.
                              </p>

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handlePhotoshopModeChange('RGB')}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    photoshopMode === 'RGB'
                                      ? "bg-rose-500 text-white shadow-sm"
                                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                  )}
                                >
                                  RGB (Digital Monitor)
                                </button>
                                <button
                                  onClick={() => handlePhotoshopModeChange('CMYK')}
                                  className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    photoshopMode === 'CMYK'
                                      ? "bg-emerald-600 text-white shadow-sm"
                                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                  )}
                                >
                                  CMYK (Offset Press Safe)
                                </button>
                              </div>
                            </div>

                            {/* Color Profile split preview simulation */}
                            <div className="p-4 border border-slate-150 rounded-2xl space-y-2">
                              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Dynamic Color Profile Gamut Preview</span>
                              <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className={cn(
                                  "w-28 h-28 rounded-2xl transition-all duration-500 flex items-center justify-center text-center p-3 text-white font-extrabold text-xs shadow-md",
                                  photoshopMode === 'RGB' 
                                    ? "bg-pink-500 shadow-pink-500/40 border-4 border-pink-400" 
                                    : "bg-pink-700 border-4 border-pink-800 shadow-none"
                                )}>
                                  {photoshopMode === 'RGB' ? 'RGB Neon (Non-Printable)' : 'CMYK Plated (Calibrated)'}
                                </div>
                                <div className="text-xs space-y-1 text-slate-600 flex-1">
                                  {photoshopMode === 'RGB' ? (
                                    <>
                                      <p className="text-rose-600 font-bold">⚠️ Warning: Out of Print Gamut</p>
                                      <p className="text-[11px] leading-relaxed">Colors look vibrant on monitors, but lack physical equivalents. Printing raw RGB will result in muddy, desaturated packaging plates.</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-emerald-600 font-bold">✓ Print Ready CMYK Separation</p>
                                      <p className="text-[11px] leading-relaxed">Cyan, Magenta, Yellow, Black inks are fully mapped. Output is balanced to GRACol 2006 prepress standard specifications.</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedSoftwareId === 'acrobat' && (
                          <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">PDF/X-4:2010 Production Pre-Flight</span>
                                <span className="text-[10px] text-rose-600 font-bold font-mono">Adobe PDF Library</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Scans final file drafts for critical compliance markers: vector font outlines, 3.0mm bleeds, and high plate resolution (&gt;=300 DPI).
                              </p>
                              <div className="pt-2">
                                <button
                                  onClick={handleAcrobatSim}
                                  disabled={isSoftwareSimulating}
                                  className="px-4 py-2.5 bg-slate-900 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  {isSoftwareSimulating ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Auditing PDF Compliance...
                                    </>
                                  ) : (
                                    <>
                                      <FileCheck2 className="w-3.5 h-3.5" />
                                      Run PDF/X Preflight Audit
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Compliance results */}
                            {acrobatChecked && !isSoftwareSimulating && (
                              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                                <h6 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Preflight Audit Passed successfully
                                </h6>
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800">
                                  <div className="flex items-center gap-1">✓ Fonts: Outlined & Vectorized</div>
                                  <div className="flex items-center gap-1">✓ Bleed: 3.0mm Boundary Valid</div>
                                  <div className="flex items-center gap-1">✓ Profile: FOGRA39 OutputIntent</div>
                                  <div className="flex items-center gap-1">✓ Images: 300 DPI High-Res</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedSoftwareId === 'nanobanana' && (
                          <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">Nano Banana Lossless Vector Cruncher</span>
                                <span className="text-[10px] text-yellow-600 font-bold font-mono">Banana Core v2.8</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Drag the slider to simulate optimizing coordinate points, removing unused styles, and compressing vector layouts. Highly useful for reducing RIP process load times.
                              </p>

                              <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                  <span>Compression Strength:</span>
                                  <span className="text-pink-600 font-mono">{100 - bananaCompression}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="20"
                                  max="100"
                                  value={bananaCompression}
                                  onChange={(e) => {
                                    setBananaCompression(Number(e.target.value));
                                    setSoftwareTerminalLogs([
                                      `[SYS] Nano Banana vector micro-packer active.`,
                                      `[SYS] Mesh optimization strength: ${100 - Number(e.target.value)}%`,
                                      `[SYS] Outlines simplified. Unused coordinate precision trimmed.`,
                                      `[SYS] Output package size: ${(14.2 * (Number(e.target.value) / 100)).toFixed(2)} MB`
                                    ]);
                                  }}
                                  className="w-full accent-pink-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                                />
                              </div>
                            </div>

                            {/* Compression comparison metrics */}
                            <div className="p-4 border border-slate-150 rounded-2xl bg-white flex items-center justify-between gap-4">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Original File Size</span>
                                <h5 className="text-lg font-black text-slate-700 leading-none mt-1">14.2 MB</h5>
                              </div>
                              <div className="text-center font-black text-pink-600 text-lg">
                                &rarr; {100 - bananaCompression}% Optimized &rarr;
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Compressed Size</span>
                                <h5 className="text-lg font-black text-emerald-600 leading-none mt-1">
                                  {(14.2 * (bananaCompression / 100)).toFixed(2)} MB
                                </h5>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedSoftwareId === 'firefly' && (
                          <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">Generative Brand Texture Studio</span>
                                <span className="text-[10px] text-purple-600 font-bold font-mono">Firefly REST API</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Enter a style prompt to synthetically generate seamless, high-resolution background textures for your packaging cartons.
                              </p>

                              <div className="space-y-3">
                                <input
                                  type="text"
                                  placeholder="Luxury geometric rose-gold packaging grid..."
                                  value={fireflyPrompt}
                                  onChange={(e) => setFireflyPrompt(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-xs text-slate-800 font-bold"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    onClick={() => setFireflyPrompt('Minimalist botanical leaves pastel outline')}
                                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
                                  >
                                    Botanical
                                  </button>
                                  <button
                                    onClick={() => setFireflyPrompt('Gold luxury linear hexagonal mosaic')}
                                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
                                  >
                                    Gold Lattice
                                  </button>
                                  <button
                                    onClick={() => setFireflyPrompt('Neon cyber grid packaging overlay')}
                                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
                                  >
                                    Cyber Matrix
                                  </button>
                                </div>
                                <div className="pt-1">
                                  <button
                                    onClick={handleFireflySim}
                                    disabled={isSoftwareSimulating}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                  >
                                    {isSoftwareSimulating ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Computing Vector Layers...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="w-3.5 h-3.5" />
                                        Generate Brand Asset Tile
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Generative texture rendering panel */}
                            {fireflyImage && !isSoftwareSimulating && (
                              <div className="p-4 border border-slate-150 rounded-2xl space-y-2">
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Computed Seamless Vector Pattern</span>
                                <div className="flex gap-4 items-center">
                                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-950 flex items-center justify-center relative border border-slate-800">
                                    {/* Procedural Pattern render using CSS vector SVGs */}
                                    {fireflyImage === 'gold' && (
                                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                                        <defs>
                                          <pattern id="gold-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 20 M 0 0 L 20 20" fill="none" stroke="#fbbf24" strokeWidth="1"/>
                                          </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#gold-grid)" />
                                      </svg>
                                    )}
                                    {fireflyImage === 'floral' && (
                                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                                        <defs>
                                          <pattern id="floral-circles" width="30" height="30" patternUnits="userSpaceOnUse">
                                            <circle cx="15" cy="15" r="10" fill="none" stroke="#ec4899" strokeWidth="1.5"/>
                                            <circle cx="15" cy="15" r="5" fill="none" stroke="#a855f7" strokeWidth="1"/>
                                          </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#floral-circles)" />
                                      </svg>
                                    )}
                                    {fireflyImage === 'geometric' && (
                                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                                        <defs>
                                          <pattern id="geo-squares" width="25" height="25" patternUnits="userSpaceOnUse">
                                            <rect x="5" y="5" width="15" height="15" fill="none" stroke="#3b82f6" strokeWidth="1"/>
                                            <circle cx="12.5" cy="12.5" r="3" fill="#6366f1" />
                                          </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#geo-squares)" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="text-xs space-y-1 text-slate-600">
                                    <p className="text-purple-600 font-extrabold font-mono">✓ High Resolution SVG Tile Ready</p>
                                    <p className="text-[11px] leading-relaxed font-semibold">Prompt matching: "{fireflyPrompt}"</p>
                                    <p className="text-[10px] text-slate-400 font-mono font-semibold">License: Authorized for commercial printing under classroom API credentials.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedSoftwareId === 'fontserver' && (
                          <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">Campus Typography Catalog Synchronization</span>
                                <span className="text-[10px] text-teal-600 font-bold font-mono">Secure TLS Server</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Select default font families to sync with client workstation catalogs. All selected fonts will bypass licensing validation checks on classroom terminals.
                              </p>

                              <div className="flex flex-wrap gap-2 pt-1">
                                {['Space Grotesk', 'Inter', 'JetBrains Mono', 'Outfit', 'Playfair Display'].map((fontName) => {
                                  const isSelected = activeFonts.includes(fontName);
                                  return (
                                    <button
                                      key={fontName}
                                      onClick={() => {
                                        if (isSelected) {
                                          setActiveFonts(activeFonts.filter(f => f !== fontName));
                                        } else {
                                          setActiveFonts([...activeFonts, fontName]);
                                        }
                                        setFontServerSynced(false);
                                      }}
                                      className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border",
                                        isSelected 
                                          ? "bg-teal-50 border-teal-200 text-teal-800 shadow-sm" 
                                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                      )}
                                    >
                                      <span>{fontName}</span>
                                      {isSelected && <span className="text-[10px] text-teal-600 font-black">✓</span>}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="pt-2">
                                <button
                                  onClick={handleFontServerSync}
                                  disabled={isSoftwareSimulating || activeFonts.length === 0}
                                  className="px-4 py-2.5 bg-slate-900 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  {isSoftwareSimulating ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Syncing Vault with Classroom Terminals...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      Synchronize Font Server Catalog
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Typography preview panel */}
                            <div className="p-4 border border-slate-150 rounded-2xl space-y-2.5">
                              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Workstation Typography Render Preview</span>
                              <div className="space-y-3">
                                {activeFonts.map((font) => (
                                  <div key={font} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[9px] text-slate-400 block font-mono">{font} font style</span>
                                      <span 
                                        className="text-xs font-extrabold text-slate-800 leading-tight block truncate mt-0.5"
                                        style={{ fontFamily: font === 'Space Grotesk' ? 'Space Grotesk, sans-serif' : font === 'JetBrains Mono' ? 'monospace' : 'sans-serif' }}
                                      >
                                        The quick brown fox jumps over the lazy dog (Print Outlines Validated)
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-emerald-600 font-black shrink-0 font-mono">
                                      {fontServerSynced ? '✓ Synced' : '● Ready'}
                                    </span>
                                  </div>
                                ))}
                                {activeFonts.length === 0 && (
                                  <p className="text-[11px] text-rose-500 font-bold text-center py-4">No active typography selected! Sync catalog immediately.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TERMINAL OUTPUT LOGGER */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-slate-500" /> Active Console Terminal Log Output:
                          </span>
                          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl font-mono text-[10px] text-slate-300 space-y-1.5 max-h-[120px] overflow-y-auto">
                            {softwareTerminalLogs.map((log, lIdx) => (
                              <div key={lIdx} className={cn(
                                "leading-relaxed",
                                log.includes('WARNING') || log.includes('Warning') ? "text-rose-400 font-bold" : log.includes('✓') || log.includes('certified') ? "text-emerald-400 font-bold" : "text-slate-300"
                              )}>
                                {log}
                              </div>
                            ))}
                            {softwareTerminalLogs.length === 0 && (
                              <div className="text-slate-500 italic">No console logs recorded yet. Run a simulation trigger above.</div>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between font-mono">
                      <span className="text-[10px] text-slate-500">Licensed software and typography synced with local RIP classroom hardware.</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            );
          })()}

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

          {/* TAB 5: Interactive Student Account Panel */}
          {activeTab === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Account Overview Header */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 text-pink-600 font-bold mb-1">
                    <Settings className="w-5 h-5 animate-spin-slow text-pink-500" />
                    <span className="text-xs uppercase tracking-wider">Simulated Institutional Accounts System</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Billing & Accounts Panel</h3>
                  <p className="text-xs text-slate-500 max-w-2xl mt-1">
                    Manage your commercial fee ledger, EMI instalment dates, institutional waivers, and live referral cashback metrics. Perfect for testing financial ledger math and administrative overrides.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setDemoInvoice(initialDemoInvoice);
                      alert("Simulated accounts database reset to defaults successfully!");
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Ledger
                  </button>
                  <button 
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Official Ledger Statement - ${demoInvoice.id}</title>
                              <style>
                                body { font-family: monospace; padding: 40px; color: #333; }
                                h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                                th { background-color: #f5f5f5; }
                              </style>
                            </head>
                            <body>
                              <h1>ENDLESS SPARK ACADEMY - ACCOUNT LEDGER</h1>
                              <p><strong>Invoice ID:</strong> ${demoInvoice.id}</p>
                              <p><strong>Course Name:</strong> ${demoInvoice.courseName}</p>
                              <p><strong>Base Course Fee:</strong> INR ${demoInvoice.baseFee.toLocaleString()}</p>
                              <p><strong>Total Paid Balance:</strong> INR ${demoInvoice.emis.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.baseAmount + e.interestAmount, 0).toLocaleString()}</p>
                              <h2>EMI Schedule</h2>
                              <table>
                                <thead>
                                  <tr>
                                    <th>EMI No</th>
                                    <th>Due Date</th>
                                    <th>Base Amount</th>
                                    <th>Interest</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${demoInvoice.emis.map(e => `
                                    <tr>
                                      <td>EMI ${e.emiNumber}</td>
                                      <td>${e.dueDate}</td>
                                      <td>INR ${e.baseAmount.toLocaleString()}</td>
                                      <td>INR ${e.interestAmount.toLocaleString()}</td>
                                      <td><strong>${e.status.toUpperCase()}</strong></td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>
                              <p style="margin-top: 40px; font-size: 11px; color: #777;">* This is a simulated academy ledger statement produced for demonstration purposes.</p>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Export PDF Statement
                  </button>
                </div>
              </div>

              {/* KPI Scorecard Bento */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const base = demoInvoice.baseFee;
                  const discount = demoInvoice.customDiscount || 0;
                  const finalBillable = base - discount;

                  const totalInterest = demoInvoice.emis.reduce((sum, e) => sum + e.interestAmount, 0);
                  const finalPayableNet = finalBillable + totalInterest;
                  const totalPaid = demoInvoice.emis.filter(e => e.status === 'paid').reduce((sum, e) => {
                    return sum + e.baseAmount + e.interestAmount;
                  }, 0);
                  const outstandingBalance = Math.max(0, finalPayableNet - totalPaid);
                  const activeInterestRate = demoInvoice.rulesSnapshot?.interestRatePercentage ?? (financialSettings?.interestRatePercentage ?? 7);

                  return (
                    <>
                      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Course Fee</span>
                        <div className="mt-2">
                          <p className="text-xl font-extrabold text-slate-900 font-mono">₹{base.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Commercial List Price</p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Billable Amount</span>
                        <div className="mt-2">
                          <p className="text-xl font-extrabold text-indigo-600 font-mono">₹{finalPayableNet.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {discount > 0 ? `Concessions: -₹${discount.toLocaleString()}` : `Inc. Interest (${activeInterestRate}%)`}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fees Paid</span>
                        <div className="mt-2">
                          <p className="text-xl font-extrabold text-emerald-700 font-mono">₹{totalPaid.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Received in Bank Account</p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Balance</span>
                        <div className="mt-2">
                          <p className="text-xl font-extrabold text-rose-600 font-mono">₹{outstandingBalance.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Due Installments</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Two-Column Detail Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Interactive Instalments Ledger */}
                <div className="lg:col-span-2 space-y-6">
                  {/* LIVE EMI CALCULATOR & SIMULATOR */}
                  <div className="bg-white rounded-3xl border border-slate-150 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Dynamic Course EMI Calculator & Sandbox</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Simulate different pricing packages, concessions, and dynamic interest rules in real-time</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Side: Inputs */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Select Course</label>
                          <select
                            value={calcCourseId}
                            onChange={(e) => handleCourseChange(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                          >
                            {coursesList.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title} (₹{course.fees.toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Base Course Fee (₹)</label>
                          <input
                            type="number"
                            value={calcBaseFee}
                            onChange={(e) => setCalcBaseFee(e.target.value)}
                            placeholder="Enter custom base fee..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Concession</label>
                            <select
                              value={calcConcession}
                              onChange={(e) => setCalcConcession(e.target.value as any)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                            >
                              <option value="none">None (0% Off)</option>
                              <option value="single-parent">Single Parent ({financialSettings?.singleParentConcessionPercentage ?? 10}% Off)</option>
                              <option value="transgender">Transgender ({financialSettings?.transgenderConcessionPercentage ?? 75}% Off)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Interest Rate (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={calcInterestRate}
                              onChange={(e) => setCalcInterestRate(e.target.value)}
                              placeholder={`Default (${financialSettings?.interestRatePercentage || 7}%)`}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">EMI Installments Plan</label>
                          <select
                            value={calcEmiPlan}
                            onChange={(e) => setCalcEmiPlan(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                          >
                            <option value="standard">Standard (Based on Course Duration)</option>
                            <option value="1">Full Payment (1 Installment)</option>
                            <option value="2">2 Installments (0% Interest if Fee &gt; 69k)</option>
                            <option value="5">5 Installments (0% Interest if Fee &gt; 69k)</option>
                            <option value="custom">Custom EMI Plan...</option>
                          </select>
                        </div>

                        {calcEmiPlan === 'custom' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Custom Installments Count</label>
                            <input
                              type="number"
                              min="2"
                              max="24"
                              value={calcCustomEmiCount}
                              onChange={(e) => setCalcCustomEmiCount(Math.max(2, parseInt(e.target.value) || 2))}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                            />
                          </div>
                        )}
                      </div>

                      {/* Right Side: Real-time Output & Action */}
                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5 text-xs">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Live Calculation Estimate</span>
                          
                          <div className="flex justify-between pb-1 border-b border-slate-100">
                            <span className="text-slate-500">Base Price:</span>
                            <span className="font-bold text-slate-800">₹{currentBaseVal.toLocaleString()}</span>
                          </div>

                          {currentDiscountAmount > 0 && (
                            <div className="flex justify-between pb-1 border-b border-slate-100 text-rose-600">
                              <span>Discount Applied ({calcConcession === 'single-parent' ? 'Single Parent' : 'Transgender'}):</span>
                              <span className="font-bold">-₹{currentDiscountAmount.toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex justify-between pb-1 border-b border-slate-100">
                            <span className="text-slate-500">Net Principal Course Fee:</span>
                            <span className="font-bold text-slate-900">₹{currentFinalAmount.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between pb-1 border-b border-slate-100">
                            <span className="text-slate-500">Interest Rate:</span>
                            <span className={cn("font-bold", isPromoApplied ? "text-emerald-600" : "text-slate-800")}>
                              {isPromoApplied ? "0% Promo Active" : `${currentInterestRate}% per annum`}
                            </span>
                          </div>

                          {currentTotalInterest > 0 ? (
                            <div className="flex justify-between pb-1 border-b border-slate-100 text-indigo-600 font-mono">
                              <span>Total Calculated Interest:</span>
                              <span>₹{currentTotalInterest.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between pb-1 border-b border-slate-100 text-emerald-600 font-mono">
                              <span>Total Calculated Interest:</span>
                              <span className="font-semibold">₹0 (No Interest)</span>
                            </div>
                          )}

                          <div className="flex justify-between pt-1 font-bold text-slate-900 text-sm">
                            <span>Total Net Billable:</span>
                            <span className="text-indigo-600">₹{currentTotalPayable.toLocaleString()}</span>
                          </div>

                          <div className="p-2.5 bg-indigo-50/50 border border-indigo-100/50 rounded-xl mt-2 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-indigo-800">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-semibold">Monthly EMI Instalment</span>
                            </div>
                            <span className="text-indigo-700 font-extrabold font-mono text-sm">
                              ₹{currentEmiAmount.toLocaleString()} <span className="text-[10px] text-indigo-500 font-normal">/ {currentEmiCount} EMIs</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleApplyCalculatedEmi}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black tracking-wide shadow-md transition-colors flex items-center justify-center gap-2 mt-auto"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Apply & Load Schedule to Ledger Sandbox
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">EMI Instalment & Ledger Statement</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Detailed breakdown of principal, interest, and digital payments</p>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        Invoice: {demoInvoice.id}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-150">
                          <tr>
                            <th className="px-4 py-3">Instalment</th>
                            <th className="px-4 py-3 border-l border-slate-100">Due Date</th>
                            <th className="px-4 py-3 text-right border-l border-slate-100">Principal</th>
                            <th className="px-4 py-3 text-right border-l border-slate-100">Interest ({demoInvoice.rulesSnapshot?.interestRatePercentage ?? (financialSettings?.interestRatePercentage ?? 7)}%)</th>
                            <th className="px-4 py-3 text-right border-l border-slate-100 bg-slate-50">Net Due</th>
                            <th className="px-4 py-3 text-center border-l border-slate-100">Status</th>
                            <th className="px-4 py-3 text-center border-l border-slate-100">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {demoInvoice.emis.map((emi, index) => {
                            // Calculate net payable for this EMI
                            const netPayable = Math.max(0, emi.baseAmount + emi.interestAmount);

                            return (
                              <tr key={index} className="hover:bg-slate-50/50 transition-all">
                                <td className="px-4 py-3.5 font-bold text-slate-900">EMI {emi.emiNumber}</td>
                                <td className="px-4 py-3.5 text-slate-500 font-mono text-[10px] border-l border-slate-100">
                                  {new Date(emi.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="px-4 py-3.5 text-right font-semibold text-slate-700 border-l border-slate-100">₹{emi.baseAmount.toLocaleString()}</td>
                                <td className="px-4 py-3.5 text-right text-indigo-600 font-mono border-l border-slate-100">₹{emi.interestAmount.toLocaleString()}</td>
                                <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 text-sm border-l border-slate-100 bg-slate-50/30">₹{netPayable.toLocaleString()}</td>
                                <td className="px-4 py-3.5 text-center border-l border-slate-100">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                    emi.status === 'paid' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                    emi.status === 'overdue' ? "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse" :
                                    "bg-amber-50 text-amber-700 border border-amber-100"
                                  )}>
                                    {emi.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-center border-l border-slate-100">
                                  {emi.status === 'paid' ? (
                                    <button
                                      onClick={() => alert(`Official Receipt for EMI #\${emi.emiNumber} (Transaction ID: TXN-\${Math.random().toString(36).substring(2,10).toUpperCase()}) downloaded!`)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" /> Receipt
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const updatedEmis = demoInvoice.emis.map((e, idx) => {
                                          if (idx === index) {
                                            return { ...e, status: 'paid' as 'paid', paidDate: new Date().toISOString().split('T')[0] };
                                          }
                                          return e;
                                        });
                                        setDemoInvoice({ ...demoInvoice, emis: updatedEmis });
                                        alert(`Simulated payment of ₹\${netPayable.toLocaleString()} for EMI #\${emi.emiNumber} processed successfully via digital sandbox bank!`);
                                      }}
                                      className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-md text-[10px] font-bold transition-colors shadow-sm inline-flex items-center gap-1"
                                    >
                                      <CreditCard className="w-3 h-3" /> Pay Now
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* BANK PRE-CLOSURE & OVERPAYMENT SIMULATOR */}
                  <div className="bg-white rounded-3xl border border-slate-150 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                        <IndianRupee className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          Bank-Format Prepayment & Pre-Closure Sandbox
                          <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-700 text-[8px] font-black uppercase rounded-md tracking-wider">
                            Prepayment Option
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Enter any custom payment amount (e.g. ₹15,000 against a ₹1,000 EMI) to simulate tenure reduction and interest savings.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleProcessPrepayment} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Enter Payment Amount (₹)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={prepayAmount}
                            onChange={(e) => setPrepayAmount(e.target.value)}
                            placeholder="e.g. 15000"
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all text-slate-800"
                          />
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black tracking-wide shadow transition-colors flex items-center justify-center gap-1.5 h-[34px] cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Submit Prepayment
                      </button>
                    </form>

                    {/* Prepayment success or info message */}
                    {prepaySuccessMessage && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 whitespace-pre-wrap leading-relaxed animate-fade-in font-medium">
                        {prepaySuccessMessage}
                      </div>
                    )}

                    {/* Live Simulation Calculator Box */}
                    {(() => {
                      const amount = parseFloat(prepayAmount);
                      const sim = calculatePrepaymentSimulation(amount);

                      return (
                        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-150 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                              Prepayment Impact Summary
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-bold rounded-md border border-indigo-100 font-mono">
                              Bank Rule Engine Active
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Current Dues Met</span>
                              <span className="text-xs font-extrabold text-slate-700">₹{sim.currentDuesPaid.toLocaleString()}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Excess Principal Pay</span>
                              <span className="text-xs font-extrabold text-indigo-600">₹{sim.excessPrepayment.toLocaleString()}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">EMIs Fully Paid</span>
                              <span className="text-xs font-extrabold text-emerald-600">-{sim.emisFullyPaidCount} instalments</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Interest Saved</span>
                              <span className="text-xs font-extrabold text-pink-600">₹{sim.interestSaved.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 leading-relaxed pt-2.5 flex items-start gap-1.5 border-t border-slate-150">
                            <div className="p-0.5 bg-indigo-50 text-indigo-600 rounded-md mt-0.5 shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              {sim.isFullyPreclosed ? (
                                <span className="font-extrabold text-emerald-700 block">
                                  🎉 This amount will FULLY PRE-CLOSE the loan! All future interest is completely waived.
                                </span>
                              ) : (
                                <span>
                                  By paying ₹{(amount || 0).toLocaleString()}, your remaining unpaid tenure is reduced to <strong>{sim.newRemainingEmisCount} instalments</strong>, and you save <strong>₹{sim.interestSaved.toLocaleString()}</strong> in future interest charges.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right: Referrals and Fee Receipt Vault */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-5 border border-slate-150 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-sm text-slate-900">Referral Incentives & Cashback Tracker</h4>
                      <span className="text-[10px] font-mono font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                        Code: {demoInvoice.referralCode}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Earn standard commercial cashback payouts when students enroll using your unique referral code. Earn **5%** for external partners or **2%** for internal leads.
                    </p>

                    {/* Earnings Summary & Payout */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Eligible Unpaid Balance</span>
                        {(() => {
                          const totalEarned = demoInvoice.referrals.reduce((sum, r) => sum + r.rewardAmount, 0);
                          const withdrawable = Math.max(0, totalEarned - demoInvoice.bonusWithdrawn);
                          return (
                            <>
                              <p className="text-xl font-black text-slate-900 mt-1">₹{withdrawable.toLocaleString()}</p>
                              <p className="text-[9px] text-slate-500">Total Accumulated: ₹{totalEarned.toLocaleString()}</p>
                            </>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => {
                          const totalEarned = demoInvoice.referrals.reduce((sum, r) => sum + r.rewardAmount, 0);
                          const withdrawable = Math.max(0, totalEarned - demoInvoice.bonusWithdrawn);
                          if (withdrawable <= 0) {
                            alert("You have no pending referral cashback to withdraw at this time!");
                            return;
                          }

                          setIsWithdrawingBonus(true);
                          setTimeout(() => {
                            setIsWithdrawingBonus(false);
                            setDemoInvoice(prev => ({
                              ...prev,
                              bonusWithdrawn: prev.bonusWithdrawn + withdrawable
                            }));
                            alert(`Cashback payout of ₹\${withdrawable.toLocaleString()} has been securely disbursed to your registered bank account via IMPS/NEFT! Check your bank statement.`);
                          }, 1500);
                        }}
                        disabled={isWithdrawingBonus}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 shadow"
                      >
                        {isWithdrawingBonus ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <IndianRupee className="w-3.5 h-3.5" /> Disburse Cashback
                          </>
                        )}
                      </button>
                    </div>

                    {/* Referrals List */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Your Referral Leads Network:</span>
                      {demoInvoice.referrals.map((ref) => (
                        <div key={ref.id} className="p-3 bg-white border border-slate-150 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-[11px]">
                          <div>
                            <h5 className="font-bold text-slate-800">{ref.name}</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Date: {ref.date} | Status: <span className="font-semibold text-indigo-600">{ref.status}</span></p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-900 block font-mono">₹{ref.rewardAmount.toLocaleString()}</span>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest",
                              ref.paid || (ref.id === 'ref-2' && demoInvoice.bonusWithdrawn >= 2500) ? "text-emerald-600" : "text-amber-600"
                            )}>
                              {ref.paid || (ref.id === 'ref-2' && demoInvoice.bonusWithdrawn >= 2500) ? "Disbursed" : "Unpaid"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: Outcome of Program (from snap) */}
          {activeTab === 'outcomes' && (
            <motion.div
              key="outcomes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <ProgramOutcomes />
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
