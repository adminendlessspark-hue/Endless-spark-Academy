import AdminMarketingSettings from '../components/AdminMarketingSettings';
import AdminWhatsAppSettings from '../components/AdminWhatsAppSettings';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, CheckCircle, XCircle, Upload, Plus, Trash2, Video, Clock, ShieldCheck, Calendar, UserCheck, X, Download, FileText, Map, FileSpreadsheet, HelpCircle, Eye, Check, ExternalLink, User as UserIcon, PhoneCall, MapPin, Edit2, Edit, IndianRupee, Image, MoreVertical, Key, Ban, RefreshCw, Briefcase, Calculator, Bot, Loader2, FolderKanban, Copy, UserPlus, AlertCircle, FileCheck, ChevronDown, ChevronUp, Sparkles, Printer, Wind, Cloud, Layers, Wallet, CheckSquare, Globe, MessageCircle, Info, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { User, CourseModule, QuizQuestion, CourseType, TopicScore, Holiday, ApplicationData, TeamMember, TrainingPlanRow } from '../types';
import { DEFAULT_TRAINING_PLANS } from '../defaultTrainingPlans';
import { cn, compressImage, calculateSLADate, formatCourseName, getScoreKey, getOrdinalSuffix } from '../utils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { FileUploader } from '../components/FileUploader';
import FacultyRoadmapPlanner from '../components/FacultyRoadmapPlanner';
import DemoOnePager from './DemoOnePager';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  getDocs,
  writeBatch,
  addDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

import Reports from '../components/Reports';
import FacultyAvailabilityModal from '../components/FacultyAvailabilityModal';
import ApplicationEditModal from '../components/ApplicationEditModal';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import Dashboard from './Dashboard';

import DigitalPreFlightChecklist from '../components/PreFlightChecklist';
import DigitalProductionArtChecklist from '../components/ProductionArtChecklist';
import QcProductionChecklist from '../components/QcProductionChecklist';
import ProductionReworkChecklist from '../components/ProductionReworkChecklist';
import PlacementAdminView from '../components/PlacementAdminView';
import CertificateGenerator from '../components/CertificateGenerator';
import PublicQcPanel from './PublicQcPanel';

import { generateGeminiContent } from '../services/gemini';
import * as mammoth from 'mammoth';
import PrinterSpecForm from '../components/PrinterSpecForm';
import { PrintStyles, ClientBriefPrintable } from '../components/PrintableChecklists';

const defaultCourseModules = [
  { id: 'packaging-engineer', title: 'Diploma in Packaging Engineer' },
  { id: 'production-art-engineer', title: 'Diploma in Production Art Engineer' },
  { id: 'print-ready-engineer', title: 'Diploma in Print Ready Engineer' },
  { id: 'plate-ready-engineer', title: 'Diploma in Plate Ready Engineer' },
  { id: 'colour-retouching-engineer', title: 'Diploma in Colour Retouching Engineer' },
  { id: 'quality-control-engineer', title: 'Diploma in Quality Control Engineer' },
  { id: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses' }
];

import TrainingRecordForm from '../components/TrainingRecordForm.tsx';
import QueryTracker from './QueryTracker';
import AdminWebinarPanel from '../components/AdminWebinarPanel';

import { useAuth } from '../AuthContext';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAdmin, isQC, isElevated } = useAuth();
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  const ProjectStatusDropdown = ({ 
    status, 
    onChange, 
    disabled, 
    assignmentId 
  }: { 
    status: string; 
    onChange: (newStatus: string) => void; 
    disabled?: boolean; 
    assignmentId: string; 
  }) => {
    const isDropdownOpen = openStatusDropdownId === assignmentId;
    
    const statuses = [
      { key: 'client', label: 'CLIENT' },
      { key: 'preflight', label: 'PRE-FLIGHT' },
      { key: 'production', label: 'PRODUCTION' },
      { key: 'pqc', label: 'PQC' },
      { key: 'qc', label: 'QC REVIEW' },
      { key: 'approved', label: 'APPROVED' }
    ];

    const current = statuses.find(s => s.key === status) || statuses[0];

    return (
      <div className="relative shrink-0 text-left">
        <button
          disabled={disabled}
          onClick={() => setOpenStatusDropdownId(isDropdownOpen ? null : assignmentId)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 h-8 cursor-pointer select-none",
            disabled ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-500" : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700"
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full select-none", 
            status === 'client' ? 'bg-indigo-500' :
            status === 'preflight' ? 'bg-emerald-500' :
            status === 'production' ? 'bg-blue-500' :
            status === 'pqc' ? 'bg-amber-500' :
            status === 'qc' ? 'bg-orange-500' :
            'bg-green-500'
          )} />
          <span className="font-extrabold text-[10px] tracking-wide select-none">{current.label}</span>
          <ChevronDown className="w-3 h-3 text-gray-400 shrink-0 select-none" />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <>
              {/* Invisible Click-outside Overlay */}
              <div 
                className="fixed inset-0 z-40 bg-transparent cursor-default" 
                onClick={() => setOpenStatusDropdownId(null)} 
              />
              
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1.5 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-1.5 z-50 flex flex-col gap-0.5"
              >
                {statuses.map((s) => {
                  const isSelected = status === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        onChange(s.key);
                        setOpenStatusDropdownId(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-extrabold transition-all text-left uppercase tracking-wider cursor-pointer",
                        isSelected 
                          ? "bg-pink-50 text-pink-700" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <span>{s.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-pink-600 shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  const [activeTab, setActiveTab] = useState<'students' | 'videos' | 'marks' | 'settings' | 'staff' | 'holidays' | 'demo' | 'applications' | 'submissions' | 'reports' | 'live-classes' | 'invoices' | 'referrals' | 'software-videos' | 'projects' | 'pre-flight' | 'training-records' | 'entrance-test' | 'placements' | 'batch-center' | 'team' | 'system' | 'queries' | 'qc' | 'webinar' | 'roadmap' | 'training-plans' | 'interactive-demo'>(() => {
    if (user?.role === 'qc') return 'qc';
    return 'marks';
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  
  useEffect(() => {
    let unsubscribe: any;
    
    const fetchTeam = async () => {
      try {
        const q = query(collection(db, 'team_members'), orderBy('order', 'asc'));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
          setTeamMembers(members);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'team_members');
        });
      } catch (error) {
        console.error('Error fetching team:', error);
      }
    };

    fetchTeam();

    const unsubBatches = onSnapshot(collection(db, 'batches'), (snapshot) => {
      setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'batches'));

    return () => {
      unsubscribe?.();
      unsubBatches();
    };
  }, []);

  const handleSaveTeamMember = async (memberData: Partial<TeamMember>) => {
    try {
      if (editingTeamMember?.id) {
        await updateDoc(doc(db, 'team_members', editingTeamMember.id), {
          ...memberData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'team_members'), {
          ...memberData,
          order: teamMembers.length,
          createdAt: serverTimestamp()
        });
      }
      setIsTeamModalOpen(false);
      setEditingTeamMember(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'team_members');
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await deleteDoc(doc(db, 'team_members', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'team_members');
    }
  };

  const handleCreateBatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBatchName.trim()) return;
    try {
      await addDoc(collection(db, 'batches'), {
        name: newBatchName.trim(),
        createdAt: serverTimestamp(),
        status: 'active'
      });
      setNewBatchName('');
      setShowBatchModal(false);
      alert('Batch created successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'batches');
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    try {
      await deleteDoc(doc(db, 'batches', id));
      alert('Batch deleted successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `batches/${id}`);
    }
  };

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [viewingQuizDetails, setViewingQuizDetails] = useState<{ studentName: string, topic: string, details: any[] } | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  const [students, setStudents] = useState<User[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [telecallers, setTelecallers] = useState<User[]>([]);
  const [marketings, setMarketings] = useState<User[]>([]);
  const [accountsExecutives, setAccountsExecutives] = useState<User[]>([]);
  const [qcReviewers, setQCReviewers] = useState<User[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [masterProjects, setMasterProjects] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [editingTrainingRecord, setEditingTrainingRecord] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningMasterProject, setAssigningMasterProject] = useState<any | null>(null);
  const [assignForm, setAssignForm] = useState<{ studentId: string, googleDriveLink: string }[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [financialSettings, setFinancialSettings] = useState<any>(null);
  const [allRegisteredModules, setAllRegisteredModules] = useState<CourseModule[]>([]);
  const [consultationBookings, setConsultationBookings] = useState<any[]>([]);
  const [consultSubTab, setConsultSubTab] = useState<'demo-classes' | 'consultations'>('demo-classes');
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlanRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('production-art-engineer');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanRow, setEditingPlanRow] = useState<TrainingPlanRow | null>(null);
  const [planSNo, setPlanSNo] = useState<number>(1);
  const [planSubject, setPlanSubject] = useState('');
  const [planLevel, setPlanLevel] = useState('Level 1');
  const [planTopicsText, setPlanTopicsText] = useState('');
  const [planTrainer, setPlanTrainer] = useState('');
  const [planDuration, setPlanDuration] = useState('');
  const [planStatus, setPlanStatus] = useState('To Do');
  const [planMaterialType, setPlanMaterialType] = useState('Power Point');
  const [planTargetDate, setPlanTargetDate] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const courseModules = useMemo(() => {
    if (financialSettings?.coursesConfig && financialSettings.coursesConfig.length > 0) {
      return financialSettings.coursesConfig.map((c: any) => ({
        id: c.courseId,
        title: c.title || formatCourseName(c.courseId)
      }));
    }
    return defaultCourseModules;
  }, [financialSettings]);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionFacultyId, setNewSessionFacultyId] = useState('');
  const [newSessionStudentIds, setNewSessionStudentIds] = useState<string[]>([]);
  const [newSessionDate, setNewSessionDate] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionType, setNewSessionType] = useState<'live' | 'demo' | 'interview' | 'hr_interview'>('live');
  const [newSessionInterviewerEmail, setNewSessionInterviewerEmail] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [cleanupAssignment, setCleanupAssignment] = useState<any | null>(null);
  const [sessionToUpdateRecording, setSessionToUpdateRecording] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '' });
  const [newTelecaller, setNewTelecaller] = useState({ name: '', email: '' });
  const [newMarketing, setNewMarketing] = useState({ name: '', email: '' });
  const [newAccounts, setNewAccounts] = useState({ name: '', email: '' });
  const [newQC, setNewQC] = useState({ name: '', email: '' });
  const [newStudent, setNewStudent] = useState({ name: '', email: '' });
  const DEFAULT_PASSWORD = "Welcome@123";
  const [newHoliday, setNewHoliday] = useState({ date: '', title: '' });
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState<string | null>(null);
  const [selectedCourseForMarks, setSelectedCourseForMarks] = useState<CourseType>('production-art-engineer');
  const [viewingFacultySchedule, setViewingFacultySchedule] = useState<User | null>(null);
  const [staffSubTab, setStaffSubTab] = useState<'faculty' | 'qc' | 'accounts' | 'telecaller' | 'marketing'>('faculty');
  const [adminSignature, setAdminSignature] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png');
  const [cloudServerBaseUrl, setCloudServerBaseUrl] = useState<string>('files.yourserver.com');
  const [jitsiServerAdmin, setJitsiServerAdmin] = useState<string>('jitsi.belnet.be');
  const [adobeCloudUrlAdmin, setAdobeCloudUrlAdmin] = useState<string>('https://creativecloud.adobe.com/apps/all/desktop');
  const [pantoneBooksUrlAdmin, setPantoneBooksUrlAdmin] = useState<string>('https://www.pantone.com/connect');
  const [teamViewerUrlAdmin, setTeamViewerUrlAdmin] = useState<string>('https://www.teamviewer.com/download');
  const [adobeScriptToolkitUrlAdmin, setAdobeScriptToolkitUrlAdmin] = useState<string>('https://github.com/Adobe-CEP/CEP-Resources');
  const [landingPageTitleImageUrl, setLandingPageTitleImageUrl] = useState<string>('');
  const [landingPageStats, setLandingPageStats] = useState({
    modules: '12+',
    students: '500+',
    placement: '100%',
    access: '24/7'
  });
  const [branches, setBranches] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string>('');
  const [newBranch, setNewBranch] = useState<string>('');
  const [founderVideoUrl, setFounderVideoUrl] = useState<string>('');
  const [founderVideoUrlTamil, setFounderVideoUrlTamil] = useState<string>('');
  const [overviewVideoUrl, setOverviewVideoUrl] = useState<string>('');
  const [overviewVideoUrlTamil, setOverviewVideoUrlTamil] = useState<string>('');
  const [founderVideoEnabled, setFounderVideoEnabled] = useState<boolean>(true);
  const [overviewVideoEnabled, setOverviewVideoEnabled] = useState<boolean>(true);
  const [entranceTestAudioUrl, setEntranceTestAudioUrl] = useState<string>('');
  const [wellnessEnabled, setWellnessEnabled] = useState<boolean>(false);
  const [wellnessVideoUrl, setWellnessVideoUrl] = useState<string>('');
  const [brandGuidelineUrl, setBrandGuidelineUrl] = useState<string>('');
  const [legalMandateUrl, setLegalMandateUrl] = useState<string>('');
  const [enableDocumentDownloads, setEnableDocumentDownloads] = useState<boolean>(false);
  const [qcErrorCategories, setQcErrorCategories] = useState<string[]>(['Typography', 'Color', 'Layout', 'Bleed/Trim', 'Other']);
  const [aiKnowledgeBase, setAiKnowledgeBase] = useState<string>('');
  const [googleDriveBaseLink, setGoogleDriveBaseLink] = useState<string>('');
  const [softwareVideos, setSoftwareVideos] = useState<any[]>([]);
  const [showSoftwareVideoModal, setShowSoftwareVideoModal] = useState(false);
  const [editingSoftwareVideoId, setEditingSoftwareVideoId] = useState<string | null>(null);
  const [softwareVideoForm, setSoftwareVideoForm] = useState<{
    toolName: string;
    title: string;
    videoUrl: string;
    duration: string;
    courseIds: string[];
  }>({
    toolName: 'Adobe Acrobat',
    title: '',
    videoUrl: '',
    duration: '5:00',
    courseIds: []
  });

  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [enhancingBrief, setEnhancingBrief] = useState(false);
  const [enhancingDetails, setEnhancingDetails] = useState(false);
  
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 300;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Scroll active tab into view
    const activeTabElement = document.getElementById(`tab-${activeTab}`);
    if (activeTabElement) {
      activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const [batchFilter, setBatchFilter] = useState('all');
  const [projectModalTab, setProjectModalTab] = useState<'general' | 'clientBrief' | 'printerSpec' | 'checklists'>('general');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (tabsElement) {
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          tabsElement.scrollLeft += e.deltaY;
        }
      };
      tabsElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => tabsElement.removeEventListener('wheel', handleWheel);
    }
  }, []);
  const [projectForm, setProjectForm] = useState({
    title: '',
    studentId: '',
    studentAssignments: [] as { studentId: string, cloudPath: string, googleDriveLink?: string }[],
    cloudPath: '',
    projectFileUrl: '',
    googleDriveLink: '',
    courseId: '',
    details: '',
    supportDocuments: '', // comma separated URLs
    stageEstimates: {
      client: 10,
      preflight: 10,
      production: 30,
      pqc: 10,
      qc: 10
    },
    preflightChecklist: [
      'Check if all fonts are embedded or outlined',
      'Verify image resolution is at least 300 DPI',
      'Check if color mode is CMYK',
      'Verify bleed settings (minimum 3mm)',
      'Check for overprint settings on black text',
      'Verify barcode readability and BWR',
      'Check if all links are updated and not missing'
    ],
    productionChecklist: [
      'Verify dimensions match the die-line',
      'Check for correct trapping settings',
      'Verify color separation and spot colors',
      'Check for correct overprint/knockout settings',
      'Verify eye-mark position and color',
      'Check for correct rich black values',
      'Verify all text is legible and correctly spelled'
    ],
    clientBrief: {
      brandName: '',
      packType: '',
      variantName: '',
      fileName: '',
      netWeight: '',
      baseFileName: '',
      edName: '',
      referenceFileName: '',
      masterJob: '',
      annotationPdfName: '',
      jobBrief: ''
    },
    printerSpec: {
      printMethod: '',
      printingSubstrate: '',
      faceReversePrint: '',
      maxColors: '',
      varnishIncluded: '',
      barcodes: [{ codeType: '', codeNumber: '', codeColour: '', bwr: '', magnification: '', narrowBar: '' }],
      colorRotation: Array.from({ length: 15 }, () => ({ colorName: '', lineScreen: '', lpi: '', dotType: '', angle: '', new: '' })),
      artworkInfo: {
        minLineThicknessPos: '', minLineThicknessRev: '', minTextSizePos: '', minTextSizeRev: '',
        minTypeMultiColorPos: '', minTypeMultiColorRev: '', minSymbolSizePos: '', minSymbolSizeNeg: '',
        xHeight: '', bleed: '', rollover: '', typeSafety: '', minDotSize: '', maxTonalValue: '', maxInkCoverage: ''
      },
      eyeMark: { size: '', colour: '', position: '', underColourPullback: '' },
      microdot: { location1: '', location2: '', size: '' },
      richBlack: { cyan: '', yellow: '', magenta: '', black: '' },
      trappingBleed: { minTrap: '', maxTrap: '', standardTrap: '', metalicTrap: '', ctStandardTrap: '', ctMinTrap: '', ctMaxTrap: '', varnishTrap: '' },
      pullbackHoldback: { generalPullback: '', whitePullback1: '', whitePullback2: '', varnishPullback: '', keyline: '' },
      proofingProfile: '',
      preferredFormat: ''
    }
  });

  const enhanceProjectDetails = async () => {
    if (!projectForm.details) {
      alert('Please enter base project details first.');
      return;
    }

    try {
      setEnhancingDetails(true);
      const prompt = `Enhance the following project details for better understanding by students. 
      Make it clear, structured, and educational. 
      Use bullet points for requirements.
      Keep it practical for production training.
      
      Details: ${projectForm.details}`;

      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const enhancedText = response.text || '';
      
      if (enhancedText) {
        setProjectForm(prev => ({
          ...prev,
          details: enhancedText
        }));
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
        alert('Access Denied (403). Please ensure your Gemini API key is correctly set in Settings > Secrets. You may need a billing-enabled key for some features.');
      } else {
        alert(`Failed to enhance details: ${error.message || 'Unknown error'}. Please check your API key in Settings > Secrets.`);
      }
    } finally {
      setEnhancingDetails(false);
    }
  };

  const enhanceJobBrief = async () => {
    if (!projectForm.clientBrief.jobBrief) {
      alert('Please enter a base job brief first.');
      return;
    }

    try {
      setEnhancingBrief(true);
      const prompt = `Enhance the following job brief for better understanding by production artists. 
      Make it professional, point-based, and clear. 
      Do not change the core requirements, just improve the clarity and structure. 
      Keep it practical for high-end packaging production.
      
      Brief: ${projectForm.clientBrief.jobBrief}`;

      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const enhancedText = response.text || '';
      
      if (enhancedText) {
        setProjectForm(prev => ({
          ...prev,
          clientBrief: { ...prev.clientBrief, jobBrief: enhancedText }
        }));
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
        alert('Access Denied (403). Please ensure your Gemini API key is correctly set in Settings > Secrets. Some AI models require a paid key.');
      } else {
        alert(`Failed to enhance brief: ${error.message || 'Unknown error'}. Please check your API key in Settings > Secrets.`);
      }
    } finally {
      setEnhancingBrief(false);
    }
  };

  const [projectToReview, setProjectToReview] = useState<any | null>(null);
  const [reviewChecklistTab, setReviewChecklistTab] = useState<'preflight' | 'production' | 'qcProduction' | 'rework'>('preflight');
  const [correctionPdfUrl, setCorrectionPdfUrl] = useState('');

  useEffect(() => {
    if (projectToReview) {
      setReviewChecklistTab('preflight');
    }
  }, [projectToReview]);

  const [printingMasterProject, setPrintingMasterProject] = useState<any | null>(null);
  const [selectedProjectCourse, setSelectedProjectCourse] = useState<string>('all');
  const [qcRejectionForm, setQcRejectionForm] = useState({
    errorCategory: 'Typography',
    notes: '',
    correctionPdfUrl: '',
    targetStage: 'production'
  });
  const [qcSelectedCategories, setQcSelectedCategories] = useState<string[]>(['Typography']);

  const [bannerForm, setBannerForm] = useState<{
    imageUrl: string;
    title: string;
    level: string;
    levelPercentage: number;
    overview: string[];
  }>({
    imageUrl: '',
    title: '',
    level: 'BASIC',
    levelPercentage: 80,
    overview: ['', '', '']
  });

  const [productionArtEngineerModules, setProductionArtModules] = useState<CourseModule[]>([]);
  const [printReadyEngineerModules, setPrintReadyModules] = useState<CourseModule[]>([]);
  const [qualityControlEngineerModules, setQualityControlModules] = useState<CourseModule[]>([]);
  const [packagingEngineerModules, setPackagingEngineerModules] = useState<CourseModule[]>([]);
  const [plateReadyEngineerModules, setPlateReadyEngineerModules] = useState<CourseModule[]>([]);
  const [colourRetouchingEngineerModules, setColourRetouchingEngineerModules] = useState<CourseModule[]>([]);
  const [crossCourseModules, setCrossCourseModules] = useState<CourseModule[]>([]);
  
  const [editingModule, setEditingModule] = useState<{ course: CourseType, module: CourseModule } | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<CourseType | 'all'>('all');
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');
  const [newModuleData, setNewModuleData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoUrls: {} as Record<string, string>,
    duration: '',
    category: 'production-art-engineer' as CourseType,
    assignmentPaperUrl: '',
    mindMapUrl: '',
    worksheetUrl: '',
    referenceMaterialUrl: '',
    slidesUrl: '',
    thumbnailUrl: '',
    additionalReferenceMaterials: [] as {title: string, url: string}[],
    quizQuestions: [] as QuizQuestion[],
    onlineTestQuestions: [] as QuizQuestion[],
    order: 1
  });
  const [expandedCoursesStudentId, setExpandedCoursesStudentId] = useState<string | null>(null);
  const [expandedViewStudentId, setExpandedViewStudentId] = useState<string | null>(null);
  const [expandedMasterProjects, setExpandedMasterProjects] = useState<Record<string, boolean>>({});

  const checkPreview = () => {
    return false;
  };

  const handleModuleFileUpload = async (moduleId: string, field: 'assignmentPaperUrl' | 'mindMapUrl' | 'worksheetUrl' | 'referenceMaterialUrl' | 'slidesUrl' | 'thumbnailUrl') => {
    if (checkPreview()) return;
    const fieldName = field.replace('Url', '').replace(/([A-Z])/g, ' $1').trim();
    const url = prompt(`Enter the ${fieldName} URL (e.g., Google Drive link):`);
    if (!url) return;

    try {
      await updateDoc(doc(db, 'course_modules', moduleId), { [field]: url });
      alert(`${fieldName} updated successfully.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `course_modules/${moduleId}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdownId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
          setActiveDropdownId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  useEffect(() => {
    // Listen to users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setStudents(allUsers.filter(u => u.role === 'student'));
      setFaculty(allUsers.filter(u => u.role === 'faculty'));
      setTelecallers(allUsers.filter(u => u.role === 'telecaller'));
      setMarketings(allUsers.filter(u => u.role === 'marketing'));
      setAccountsExecutives(allUsers.filter(u => u.role === 'accounts_executive'));
      setQCReviewers(allUsers.filter(u => u.role === 'qc'));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // Listen to holidays
    const unsubHolidays = onSnapshot(collection(db, 'holidays'), (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Holiday)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'holidays'));

    // Listen to modules
    const unsubModules = onSnapshot(collection(db, 'course_modules'), (snapshot) => {
      const allModules = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseModule));
      allModules.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
      setAllRegisteredModules(allModules);
      setProductionArtModules(allModules.filter(m => m.category === 'production-art-engineer'));
      setPrintReadyModules(allModules.filter(m => m.category === 'print-ready-engineer'));
      setQualityControlModules(allModules.filter(m => m.category === 'quality-control-engineer'));
      setPackagingEngineerModules(allModules.filter(m => m.category === 'packaging-engineer'));
      setPlateReadyEngineerModules(allModules.filter(m => m.category === 'plate-ready-engineer'));
      setColourRetouchingEngineerModules(allModules.filter(m => m.category === 'colour-retouching-engineer'));
      setCrossCourseModules(allModules.filter(m => m.category === 'printing-and-packaging-cross-courses'));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'course_modules'));

    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'admin'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdminSignature(data.signature || '');
        setLogoUrl(data.logoUrl || '/logo.png');
        setLandingPageTitleImageUrl(data.landingPageTitleImageUrl || '');
        setGoogleDriveBaseLink(data.googleDriveBaseLink || '');
        if (data.landingPageStats) {
          setLandingPageStats(data.landingPageStats);
        }
        setFounderVideoUrl(data.founderVideoUrl || '');
        setFounderVideoUrlTamil(data.founderVideoUrlTamil || '');
        setOverviewVideoUrl(data.overviewVideoUrl || '');
        setOverviewVideoUrlTamil(data.overviewVideoUrlTamil || '');
        setFounderVideoEnabled(data.founderVideoEnabled ?? true);
        setOverviewVideoEnabled(data.overviewVideoEnabled ?? true);
        setEntranceTestAudioUrl(data.entranceTestAudioUrl || '');
        setWellnessEnabled(data.wellnessEnabled ?? false);
        setWellnessVideoUrl(data.wellnessVideoUrl || 'https://www.youtube.com/embed/-GHd77C4brk?si=lnvBe-_P2fXxAeaW');
        setBrandGuidelineUrl(data.brandGuidelineUrl || '');
        setLegalMandateUrl(data.legalMandateUrl || '');
        if (data.enableDocumentDownloads !== undefined) {
          setEnableDocumentDownloads(data.enableDocumentDownloads);
        }
        if (data.qcErrorCategories) {
          setQcErrorCategories(data.qcErrorCategories);
        }
        setCloudServerBaseUrl(data.cloudServerBaseUrl || 'files.yourserver.com');
        setJitsiServerAdmin(data.jitsiServer || 'jitsi.belnet.be');
        setAdobeCloudUrlAdmin(data.adobeCloudUrl || 'https://creativecloud.adobe.com/apps/all/desktop');
        setPantoneBooksUrlAdmin(data.pantoneBooksUrl || 'https://www.pantone.com/connect');
        setTeamViewerUrlAdmin(data.teamViewerUrl || 'https://www.teamviewer.com/download');
        setAdobeScriptToolkitUrlAdmin(data.adobeScriptToolkitUrl || 'https://github.com/Adobe-CEP/CEP-Resources');
        setAiKnowledgeBase(data.aiKnowledgeBase || '');
        setBranches(data.branches || []);
        // Still read from admin for backward compatibility
        if (data.banners) {
          setBanners(prev => {
            const existingIds = new Set(prev.map(b => b.id));
            const newBanners = data.banners.filter((b: any) => !existingIds.has(b.id));
            return [...prev, ...newBanners];
          });
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/admin'));

    // Listen to banners collection
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const fetchedBanners = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setBanners(prev => {
        const adminBanners = prev.filter(b => !fetchedBanners.some(fb => fb.id === b.id));
        return [...adminBanners, ...fetchedBanners];
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'banners'));

    // Listen to live sessions
    const unsubLiveSessions = onSnapshot(collection(db, 'live_sessions'), (snapshot) => {
      setLiveSessions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'live_sessions'));

    // Listen to student projects
    const unsubProjects = onSnapshot(collection(db, 'student_projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'student_projects'));

    const unsubMasterProjects = onSnapshot(collection(db, 'master_projects'), (snapshot) => {
      setMasterProjects(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'master_projects'));

    // Listen to invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'invoices'));

    // Listen to financial settings
    const unsubFinancialSettings = onSnapshot(doc(db, 'settings', 'financial'), (docSnap) => {
      if (docSnap.exists()) {
        setFinancialSettings({ ...docSnap.data(), id: docSnap.id });
      } else {
        setFinancialSettings({
          id: 'financial',
          emiRules: [
            { durationMonths: 3, emiCount: 2 },
            { durationMonths: 6, emiCount: 5 }
          ],
          interestRatePercentage: 7,
          penaltyPercentage: 0,
          internalReferralPercentage: 2,
          externalReferralPercentage: 5
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/financial'));

    // Listen to software videos
    const unsubSoftwareVideos = onSnapshot(collection(db, 'software_videos'), (snapshot) => {
      setSoftwareVideos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'software_videos'));

    // Listen to consultation bookings
    const unsubConsultationBookings = onSnapshot(collection(db, 'consultation_bookings'), (snapshot) => {
      setConsultationBookings(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'consultation_bookings'));

    // Listen to training plans
    const unsubTrainingPlans = onSnapshot(collection(db, 'training_plans'), (snapshot) => {
      setTrainingPlans(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TrainingPlanRow)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'training_plans'));

    return () => {
      unsubUsers();
      unsubHolidays();
      unsubModules();
      unsubSettings();
      unsubBanners();
      unsubLiveSessions();
      unsubProjects();
      unsubMasterProjects();
      unsubInvoices();
      unsubFinancialSettings();
      unsubSoftwareVideos();
      unsubConsultationBookings();
      unsubTrainingPlans();
    };
  }, []);

  const handleToggleFeeReduction = async (bookingId: string, currentStatus: boolean, studentEmail: string) => {
    if (checkPreview()) return;
    try {
      // 1. Update the booking status
      await updateDoc(doc(db, 'consultation_bookings', bookingId), {
        feeReduced: !currentStatus
      });

      // 2. Also try to find a user with this email to update their demoData or fees details
      const userQuery = query(collection(db, 'users'), where('email', '==', studentEmail));
      const querySnap = await getDocs(userQuery);
      if (!querySnap.empty) {
        for (const userDoc of querySnap.docs) {
          await updateDoc(doc(db, 'users', userDoc.id), {
            'demoData.adjustableFeeReduced': !currentStatus
          });
        }
      }
      alert(`Successfully ${!currentStatus ? 'applied' : 'reverted'} the ₹500 fee reduction for ${studentEmail}. This amount is now marked as reduced from their course tuition fees!`);
    } catch (err) {
      console.error("Error updating fee reduction status: ", err);
      alert("Error updating fee reduction status.");
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPreview()) return;
    let secondaryApp;
    try {
      // Create a secondary app to create the user without signing out the admin
      secondaryApp = initializeApp(firebaseConfig, `SecondaryFaculty_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newFaculty.email,
        DEFAULT_PASSWORD
      );
      
      const facultyId = userCredential.user.uid;
      const username = newFaculty.email.split('@')[0];
      const facultyUser: User = {
        id: facultyId,
        name: newFaculty.name,
        username: username,
        email: newFaculty.email,
        role: 'faculty',
        isApproved: true,
        mustChangePassword: true,
        registeredForDemo: false,
        applicationStatus: 'approved',
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        scores: { productionArtEngineer: {}, printReadyEngineer: {}, qualityControlEngineer: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', facultyId), facultyUser);
      
      // Clean up secondary app
      await signOut(secondaryAuth);
      
      setNewFaculty({ name: '', email: '' });
      alert(`Faculty created successfully. Default password is: ${DEFAULT_PASSWORD}`);
    } catch (err) {
      console.error('Error creating faculty:', err);
      alert('Error creating faculty: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
    }
  };

  const handleSaveTrainingRecord = async (data: any) => {
    if (checkPreview()) return;
    try {
      const student = students.find(s => s.name === data.studentName);
      const record = {
        ...data,
        studentId: student?.id || '',
        updatedAt: new Date().toISOString()
      };

      if (editingTrainingRecord) {
        await updateDoc(doc(db, 'training_records', editingTrainingRecord.id), record);
      } else {
        await addDoc(collection(db, 'training_records'), {
          ...record,
          createdAt: new Date().toISOString()
        });
      }
      setShowTrainingModal(false);
      setEditingTrainingRecord(null);
    } catch (err) {
      handleFirestoreError(err, editingTrainingRecord ? OperationType.UPDATE : OperationType.CREATE, 'training_records');
    }
  };

  const handleDeleteTrainingRecord = async (id: string) => {
    if (checkPreview()) return;
    try {
      await deleteDoc(doc(db, 'training_records', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `training_records/${id}`);
    }
  };

  const handleSaveTrainingPlanRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPreview()) return;
    setIsSavingPlan(true);
    try {
      const topics = planTopicsText
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const rowData = {
        courseId: selectedCourseId,
        sNo: Number(planSNo),
        courseSubject: planSubject,
        level: planLevel,
        topics,
        trainerSme: planTrainer,
        durationHrs: planDuration,
        status: planStatus,
        materialType: planMaterialType,
        targetDate: planTargetDate,
        updatedAt: new Date().toISOString()
      };

      if (editingPlanRow) {
        await updateDoc(doc(db, 'training_plans', editingPlanRow.id), rowData);
      } else {
        await addDoc(collection(db, 'training_plans'), {
          ...rowData,
          createdAt: new Date().toISOString()
        });
      }

      setShowPlanModal(false);
      setEditingPlanRow(null);
      // Reset form
      setPlanSubject('');
      setPlanLevel('Level 1');
      setPlanTopicsText('');
      setPlanTrainer('');
      setPlanDuration('');
      setPlanStatus('To Do');
      setPlanMaterialType('Power Point');
      setPlanTargetDate('');
    } catch (err) {
      handleFirestoreError(err, editingPlanRow ? OperationType.UPDATE : OperationType.CREATE, 'training_plans');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeleteTrainingPlanRow = async (id: string) => {
    if (checkPreview()) return;
    if (!window.confirm('Are you sure you want to delete this training plan row?')) return;
    try {
      await deleteDoc(doc(db, 'training_plans', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `training_plans/${id}`);
    }
  };

  const handleLoadDefaultTrainingPlans = async () => {
    if (checkPreview()) return;
    if (!window.confirm('This will load the default training plan templates for the selected course. Continue?')) return;
    try {
      const batch = writeBatch(db);
      DEFAULT_TRAINING_PLANS.forEach((plan) => {
        const docRef = doc(collection(db, 'training_plans'));
        batch.set(docRef, {
          courseId: selectedCourseId,
          sNo: plan.sNo,
          courseSubject: plan.courseSubject,
          level: plan.level,
          topics: plan.topics,
          trainerSme: plan.trainerSme,
          durationHrs: plan.durationHrs,
          status: plan.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'training_plans');
    }
  };

  const handleCreateTelecaller = async (e: React.FormEvent) => {
    e.preventDefault();
    let secondaryApp;
    try {
      // Create a secondary app to create the user without signing out the admin
      secondaryApp = initializeApp(firebaseConfig, `SecondaryTelecaller_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newTelecaller.email,
        DEFAULT_PASSWORD
      );
      
      const telecallerId = userCredential.user.uid;
      const username = newTelecaller.email.split('@')[0];
      const telecallerUser: User = {
        id: telecallerId,
        name: newTelecaller.name,
        username: username,
        email: newTelecaller.email,
        role: 'telecaller',
        isApproved: true,
        mustChangePassword: true,
        registeredForDemo: false,
        applicationStatus: 'approved',
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        scores: { productionArtEngineer: {}, printReadyEngineer: {}, qualityControlEngineer: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', telecallerId), telecallerUser);
      
      // Clean up secondary app
      await signOut(secondaryAuth);
      
      setNewTelecaller({ name: '', email: '' });
      alert(`Telecaller created successfully. Default password is: ${DEFAULT_PASSWORD}`);
    } catch (err) {
      console.error('Error creating telecaller:', err);
      alert('Error creating telecaller: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
    }
  };

  const handleCreateMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, `SecondaryMarketing_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newMarketing.email,
        DEFAULT_PASSWORD
      );
      
      const marketingId = userCredential.user.uid;
      const username = newMarketing.email.split('@')[0];
      const marketingUser: User = {
        id: marketingId,
        name: newMarketing.name,
        username: username,
        email: newMarketing.email,
        role: 'marketing',
        isApproved: true,
        mustChangePassword: true,
        registeredForDemo: false,
        applicationStatus: 'approved',
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        scores: { productionArtEngineer: {}, printReadyEngineer: {}, qualityControlEngineer: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', marketingId), marketingUser);
      
      await signOut(secondaryAuth);
      
      setNewMarketing({ name: '', email: '' });
      alert(`Marketing Executive created successfully. Default password is: ${DEFAULT_PASSWORD}`);
    } catch (err) {
      console.error('Error creating marketing:', err);
      alert('Error creating marketing: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
    }
  };

  const handleCreateAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, `SecondaryAccounts_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newAccounts.email,
        DEFAULT_PASSWORD
      );
      
      const accountsId = userCredential.user.uid;
      const username = newAccounts.email.split('@')[0];
      const accountsUser: User = {
        id: accountsId,
        name: newAccounts.name,
        username: username,
        email: newAccounts.email,
        role: 'accounts_executive',
        isApproved: true,
        mustChangePassword: true,
        registeredForDemo: false,
        applicationStatus: 'approved',
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        scores: { productionArtEngineer: {}, printReadyEngineer: {}, qualityControlEngineer: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', accountsId), accountsUser);
      await signOut(secondaryAuth);
      
      setNewAccounts({ name: '', email: '' });
      alert(`Accounts Executive created successfully. Default password is: ${DEFAULT_PASSWORD}`);
    } catch (err) {
      console.error('Error creating accounts executive:', err);
      alert('Error creating accounts executive: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
    }
  };

  const handleCreateQC = async (e: React.FormEvent) => {
    e.preventDefault();
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, `SecondaryQC_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newQC.email,
        DEFAULT_PASSWORD
      );
      
      const qcId = userCredential.user.uid;
      const username = newQC.email.split('@')[0];
      const qcUser: User = {
        id: qcId,
        name: newQC.name,
        username: username,
        email: newQC.email,
        role: 'qc',
        isApproved: true,
        mustChangePassword: true,
        registeredForDemo: false,
        applicationStatus: 'approved',
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        scores: { productionArtEngineer: {}, printReadyEngineer: {}, qualityControlEngineer: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', qcId), qcUser);
      await signOut(secondaryAuth);
      
      setNewQC({ name: '', email: '' });
      alert(`QC Reviewer created successfully. Default password is: ${DEFAULT_PASSWORD}`);
    } catch (err) {
      console.error('Error creating QC reviewer:', err);
      alert('Error creating QC reviewer: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
    }
  };

  const handleAssignFaculty = async (studentId: string, facultyId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { assignedFacultyId: facultyId });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleAssignLanguage = async (studentId: string, language: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { nativeLanguage: language });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleAssignEntranceTest = async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { 
        entranceTestStatus: 'assigned',
        updatedAt: new Date().toISOString()
      });
      alert('Entrance test assigned successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const holidayId = Math.random().toString(36).substr(2, 9);
      const holiday: Holiday = {
        id: holidayId,
        date: newHoliday.date,
        title: newHoliday.title
      };
      await setDoc(doc(db, 'holidays', holidayId), holiday);
      setNewHoliday({ date: '', title: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'holidays');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'holidays', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `holidays/${id}`);
    }
  };

  const handleDuplicateProject = async (project: any) => {
    try {
      const now = new Date();
      const slaDateString = calculateSLADate(now, holidays);
      
      const { id, ...projectData } = project;
      const cleanData = JSON.parse(JSON.stringify(projectData));

      await addDoc(collection(db, 'student_projects'), {
        ...cleanData,
        title: `${project.title} (Copy)`,
        actualTime: 0,
        lastStageActualTime: 0,
        status: 'client',
        qcRejections: [],
        points: 100,
        efficiency: 0,
        preflightChecklist: project.preflightChecklist || [],
        productionChecklist: project.productionChecklist || [],
        slaDate: slaDateString,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
      // Removed alert as it may fail in iframe
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'student_projects');
    }
  };

  const handleApprove = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student?.assignedFacultyId) {
      alert('Please assign a faculty member to this student before approving.');
      return;
    }
    setApprovingStudentId(studentId);
    setRegistrationNumber('');
    setReferredBy('');
    setReferrerContact('');
    setReferrerType('direct');
  };

  const handleApproveConfirm = async () => {
    if (checkPreview()) return;
    if (!approvingStudentId) return;
    if (!registrationNumber.trim()) {
      alert('Registration Number is required.');
      return;
    }
    if (referrerType !== 'direct') {
      if (!referredBy.trim()) {
        alert('Referrer Name is required.');
        return;
      }
      if (!referrerContact.trim()) {
        alert('Referrer Contact Number is required.');
        return;
      }
    }

    const fullReferrerContact = referrerType === 'direct' ? 'None' : `${referrerCountryCode} ${referrerContact.trim()}`;

    const student = students.find(s => s.id === approvingStudentId);
    if (!student) return;

    try {
      const assignedCourses = student.assignedCourses || (student.requestedCourses && student.requestedCourses.length > 0 ? student.requestedCourses : (student.requestedCourse ? [student.requestedCourse] : ['production-art-engineer']));
      
      let totalBaseFee = manualBaseFee ? parseInt(manualBaseFee) : 0;
      let totalDurationMonths = 0;

      if (!manualBaseFee) {
        assignedCourses.forEach(courseId => {
          const config = financialSettings?.coursesConfig?.find(c => c.courseId === courseId);
          if (config) {
            totalBaseFee += config.fees || 0;
            totalDurationMonths += config.durationMonths || 3;
          } else {
            totalBaseFee += 35000; // Fallback default
            totalDurationMonths += 3; // Fallback default
          }
        });
      } else {
        // use default duration if manual fee is used but we still need duration for expiry
        totalDurationMonths = assignedCourses.length * 3;
      }

      let finalAmount = totalBaseFee;
      
      const singleParentConcession = financialSettings?.singleParentConcessionPercentage ?? 10;
      const transgenderConcession = financialSettings?.transgenderConcessionPercentage ?? 75;

      if (concessionApplied === 'single-parent') {
        finalAmount = totalBaseFee * (1 - singleParentConcession / 100);
      } else if (concessionApplied === 'transgender') {
        finalAmount = totalBaseFee * (1 - transgenderConcession / 100);
      }

      const emis: any[] = [];
      const courseDurationMonths = Math.min(totalDurationMonths, 12); // Cap at 12 months for EMI rule lookup fallback
      
      const admissionDate = new Date().toISOString();
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + courseDurationMonths);
      const expiryDate = expiry.toISOString();

      await updateDoc(doc(db, 'users', approvingStudentId), {
        isApproved: true,
        applicationStatus: 'approved',
        studentId: registrationNumber.trim(),
        assignedCourses,
        assignedCourse: assignedCourses[0],
        admissionDate,
        expiryDate,
        adminSignature,
        referredBy: referrerType === 'direct' ? 'None' : referredBy.trim(),
        referrerContact: fullReferrerContact,
        referrerType
      });
      
      let emiCount = 1;
      if (emiPlan === '1') {
        emiCount = 1;
      } else if (emiPlan === '2') {
        emiCount = 2;
      } else if (emiPlan === 'custom') {
        emiCount = Math.max(1, customEmiCount);
      } else {
        if (financialSettings && financialSettings.emiRules) {
          const rule = financialSettings.emiRules.find((r: any) => r.durationMonths === courseDurationMonths);
          if (rule) {
            emiCount = rule.emiCount;
          }
        }
      }

      let totalInterest = 0;
      if (emiCount > 1) {
        if (finalAmount > 69000 && emiCount === 2) {
          totalInterest = 0;
        } else {
          const interestRate = financialSettings?.interestRatePercentage || 7;
          totalInterest = finalAmount * (interestRate / 100);
        }
      }

      const totalPayable = finalAmount + totalInterest;
      const baseEmiAmount = finalAmount / emiCount;
      const interestPerEmi = totalInterest / emiCount;
      
      const now = new Date();

      for (let i = 1; i <= emiCount; i++) {
        const emiDate = new Date();
        emiDate.setDate(7);
        if (now.getDate() > 7) {
          emiDate.setMonth(emiDate.getMonth() + i);
        } else {
          emiDate.setMonth(emiDate.getMonth() + (i - 1));
        }

        emis.push({
          emiNumber: i,
          baseAmount: baseEmiAmount,
          interestAmount: interestPerEmi,
          penaltyAmount: 0,
          dueDate: emiDate.toISOString(),
          status: 'pending'
        });
      }

      const invoiceData: any = {
        studentId: approvingStudentId,
        totalFee: totalBaseFee,
        concessionApplied,
        finalAmount,
        emis,
        waivers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rulesSnapshot: financialSettings ? {
          interestRatePercentage: financialSettings.interestRatePercentage || 7,
          penaltyPercentage: financialSettings.penaltyPercentage || 0,
          internalReferralPercentage: financialSettings.internalReferralPercentage || 2,
          externalReferralPercentage: financialSettings.externalReferralPercentage || 5
        } : {
          interestRatePercentage: 7,
          penaltyPercentage: 0,
          internalReferralPercentage: 2,
          externalReferralPercentage: 5
        }
      };

      if (referrerType !== 'direct') {
        const internalPercentage = financialSettings?.internalReferralPercentage || 2;
        const externalPercentage = financialSettings?.externalReferralPercentage || 5;
        
        invoiceData.referral = {
          referredBy: referredBy || 'None',
          referrerContact: fullReferrerContact,
          referrerType,
          bonusPercentage: referrerType === 'internal' ? internalPercentage : externalPercentage,
          bonusEarnedSoFar: 0,
          bonusPaidSoFar: 0
        };
      }

      // Check for existing invoice and delete it if we are editing an approved student's financials
      const existingInvoices = invoices.filter(i => i.studentId === approvingStudentId);
      for (const ei of existingInvoices) {
        await deleteDoc(doc(db, 'invoices', ei.id));
      }

      await addDoc(collection(db, 'invoices'), invoiceData);

      setApprovingStudentId(null);
      setRegistrationNumber('');
      setManualBaseFee('');
      setConcessionApplied('none');
      setEmiPlan('standard');
      setReferredBy('');
      setReferrerContact('');
      setReferrerCountryCode('+91');
      setReferrerType('internal');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${approvingStudentId}`);
    }
  };

  const handleMarkDemoCompleted = async (studentId: string) => {
    try {
      const student = students.find(s => s.id === studentId);
      
      await updateDoc(doc(db, 'users', studentId), {
        'demoData.completed': true
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleRescheduleDemo = async () => {
    if (!reschedulingDemoStudentId || !rescheduleDate || !rescheduleTime) return;
    
    try {
      const student = students.find(s => s.id === reschedulingDemoStudentId);
      
      await updateDoc(doc(db, 'users', reschedulingDemoStudentId), {
        'demoData.preferredDate': rescheduleDate,
        'demoData.preferredTime': rescheduleTime
      });
      
      setReschedulingDemoStudentId(null);
      setRescheduleDate('');
      setRescheduleTime('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${reschedulingDemoStudentId}`);
    }
  };

  const handleRunPenaltyChecks = async () => {
    const now = new Date();
    const currentDay = now.getDate();
    
    // Only run if it's past the 7th
    if (currentDay <= 7) {
      alert('Penalties are only applied after the 7th of the month.');
      return;
    }

    let updatedCount = 0;

    for (const invoice of invoices) {
      let hasUpdates = false;
      const rules = invoice.rulesSnapshot || {
        interestRatePercentage: 7,
        penaltyPercentage: 0
      };

      // Calculate total outstanding amount for interest calculation
      const outstandingAmount = invoice.emis
        .filter((e: any) => e.status !== 'paid')
        .reduce((sum: number, e: any) => sum + e.baseAmount, 0);

      const updatedEmis = invoice.emis.map((emi: any) => {
        if (emi.status === 'paid') return emi;

        const dueDate = new Date(emi.dueDate);
        // Check if the EMI is due this month or earlier
        if (now > dueDate && now.getMonth() >= dueDate.getMonth()) {
          let newPenalty = emi.penaltyAmount;

          // Apply penalty if past 7th and penalty not already applied
          if (currentDay > 7 && newPenalty === 0) {
            newPenalty = rules.penaltyPercentage > 0 
              ? emi.baseAmount * (rules.penaltyPercentage / 100)
              : 500; // Fallback to flat 500 if percentage is 0
            hasUpdates = true;
          }

          return {
            ...emi,
            penaltyAmount: newPenalty,
            status: 'overdue'
          };
        }
        return emi;
      });

      if (hasUpdates) {
        try {
          await updateDoc(doc(db, 'invoices', invoice.id), {
            emis: updatedEmis,
            updatedAt: new Date().toISOString()
          });
          updatedCount++;
        } catch (err) {
          console.error("Error updating invoice penalties:", err);
        }
      }
    }

    alert(`Penalty checks completed. Updated ${updatedCount} invoices.`);
  };

  const handleMarkEmiPaid = async (invoiceId: string, emiNumber: number) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const updatedEmis = invoice.emis.map((emi: any) => {
      if (emi.emiNumber === emiNumber) {
        return {
          ...emi,
          status: 'paid',
          paidDate: new Date().toISOString()
        };
      }
      return emi;
    });

    try {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        emis: updatedEmis,
        updatedAt: new Date().toISOString()
      });
      
      // If there's a referral, update bonusEarnedSoFar
      if (invoice.referral) {
        const paidEmi = updatedEmis.find((e: any) => e.emiNumber === emiNumber);
        const amountPaid = paidEmi.baseAmount + paidEmi.interestAmount + paidEmi.penaltyAmount;
        const bonusEarned = amountPaid * (invoice.referral.bonusPercentage / 100);
        
        await updateDoc(doc(db, 'invoices', invoiceId), {
          'referral.bonusEarnedSoFar': (invoice.referral.bonusEarnedSoFar || 0) + bonusEarned
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${invoiceId}`);
    }
  };



  const handleRecordPayout = async () => {
    if (!payoutModal || payoutModal.amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const invoice = invoices.find(i => i.id === payoutModal.invoiceId);
    if (!invoice || !invoice.referral) return;

    try {
      await updateDoc(doc(db, 'invoices', payoutModal.invoiceId), {
        'referral.bonusPaidSoFar': (invoice.referral.bonusPaidSoFar || 0) + payoutModal.amount,
        updatedAt: new Date().toISOString()
      });
      setPayoutModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${payoutModal.invoiceId}`);
    }
  };

  const [viewingApplication, setViewingApplication] = useState<ApplicationData | null>(null);
  const [viewingApplicationStudentId, setViewingApplicationStudentId] = useState<string | null>(null);
  const [viewingTestResults, setViewingTestResults] = useState<any | null>(null);
  const [viewingTestStudentName, setViewingTestStudentName] = useState<string>('');
  const [isEditingApplication, setIsEditingApplication] = useState(false);
  const [approvingStudentId, setApprovingStudentId] = useState<string | null>(null);
  const [reschedulingDemoStudentId, setReschedulingDemoStudentId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [manualBaseFee, setManualBaseFee] = useState<string>('');
  const [concessionApplied, setConcessionApplied] = useState<'none' | 'single-parent' | 'transgender'>('none');
  const [emiPlan, setEmiPlan] = useState('standard');
  const [customEmiCount, setCustomEmiCount] = useState<number>(3);
  const [referredBy, setReferredBy] = useState('');
  const [referrerCountryCode, setReferrerCountryCode] = useState('+91');
  const [referrerContact, setReferrerContact] = useState('');
  const [referrerType, setReferrerType] = useState<'internal' | 'external' | 'direct'>('direct');
  const [payoutModal, setPayoutModal] = useState<{ invoiceId: string; amount: number } | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<{
    studentId: string;
    course: string;
    topic: string;
    type: 'assignment' | 'video' | 'worksheet' | 'project' | 'mindMap';
    maxScore: number;
  } | null>(null);
  const [gradingMark, setGradingMark] = useState<number | ''>('');

  const handleSubmissionStatus = async (studentId: string, course: string, topic: string, type: 'assignment' | 'video' | 'worksheet' | 'project' | 'mindMap', status: 'approved' | 'rejected', mark?: number) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const newScores = JSON.parse(JSON.stringify(student.scores));
      const categoryKey = course === 'production-art-engineer' ? 'productionArtEngineer' : (course === 'print-ready-engineer' ? 'printReadyEngineer' : 'qualityControlEngineer');
      
      if (!newScores[categoryKey][topic]) {
        newScores[categoryKey][topic] = { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 } as TopicScore;
      }

      const statusKey = `${type}Status` as keyof TopicScore;
      (newScores[categoryKey][topic] as any)[statusKey] = status;

      if (status === 'approved') {
        const scoreKey = type as keyof TopicScore;
        const maxScore = type === 'video' ? 20 : (type === 'assignment' ? 10 : (type === 'mindMap' ? 10 : 20)); // Adjust max scores as needed
        (newScores[categoryKey][topic] as any)[scoreKey] = mark !== undefined ? mark : maxScore;
      }

      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, { scores: newScores });
      alert(`Submission ${status} successfully`);
      setGradingSubmission(null);
      setGradingMark('');
    } catch (error) {
      console.error('Error updating submission status:', error);
      alert('Failed to update submission status');
    }
  };

  const getAllSubmissions = () => {
    const submissions: any[] = [];
    students.forEach(student => {
      if (!student.scores) return;
      
      Object.entries(student.scores).forEach(([categoryKey, topics]) => {
        const course = categoryKey === 'productionArtEngineer' ? 'production-art-engineer' : (categoryKey === 'printReadyEngineer' ? 'print-ready-engineer' : 'quality-control-engineer');
        Object.entries(topics).forEach(([topic, score]) => {
          const types = ['assignment', 'video', 'worksheet', 'project', 'mindMap'] as const;
          types.forEach(type => {
            const statusKey = `${type}Status` as keyof TopicScore;
            const fileKey = type === 'video' ? 'videoData' : `${type}File` as keyof TopicScore;
            
            if (score[statusKey]) {
              submissions.push({
                studentId: student.id,
                studentName: student.name,
                course,
                topic,
                type,
                status: score[statusKey],
                fileData: score[fileKey]
              });
            }
          });
        });
      });
    });
    return submissions.filter(sub => sub.status === submissionFilter);
  };

  const handleToggleCourseAssignment = async (studentId: string, course: CourseType) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    try {
      const currentCourses = student.assignedCourses || (student.assignedCourse ? [student.assignedCourse] : []);
      const newCourses = currentCourses.includes(course)
        ? currentCourses.filter(c => c !== course)
        : [...currentCourses, course];
      
      let expiryDate = student.expiryDate;
      if (student.isApproved && student.admissionDate) {
        const monthsToAdd = newCourses.length > 1 ? 6 : 3;
        const expiry = new Date(student.admissionDate);
        expiry.setMonth(expiry.getMonth() + monthsToAdd);
        expiryDate = expiry.toISOString();
      }

      const updateData: any = {
        assignedCourses: newCourses,
        assignedCourse: newCourses[0] || null,
      };

      if (expiryDate !== undefined) {
        updateData.expiryDate = expiryDate;
      }

      await updateDoc(doc(db, 'users', studentId), updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleReject = async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { 
        isApproved: false, 
        applicationStatus: 'pending' 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleToggleIDApproval = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    try {
      await updateDoc(doc(db, 'users', studentId), { idCardApproved: !student.idCardApproved });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleToggleCertificateApproval = async (studentId: string, currentStatus?: boolean) => {
    try {
      const updates: any = { certificateApproved: !currentStatus };
      if (!currentStatus) {
        updates.certificateIssuedDate = new Date().toISOString();
      }
      await updateDoc(doc(db, 'users', studentId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handlePhaseOut = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    try {
      const isPhasedOut = !student.isPhasedOut;
      await updateDoc(doc(db, 'users', studentId), { 
        isPhasedOut, 
        isApproved: isPhasedOut ? false : student.isApproved,
        applicationStatus: isPhasedOut ? 'phased-out' : (student.isApproved ? 'approved' : 'pending')
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleExtendAccess = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !student.expiryDate) return;
    try {
      const currentExpiry = new Date(student.expiryDate);
      const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry;
      baseDate.setMonth(baseDate.getMonth() + 1);
      await updateDoc(doc(db, 'users', studentId), {
        expiryDate: baseDate.toISOString()
      });
      alert('Access extended by 1 month.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleDownloadReport = () => {
    const approvedStudents = students.filter(s => s.isApproved && s.role === 'student');
    const now = new Date();
    
    let liveCount = 0;
    let expiredCount = 0;
    
    const csvRows = [];
    csvRows.push(['Student ID', 'Name', 'Email', 'Course', 'Admission Date', 'Expiry Date', 'Modules Completed', 'Account Status']);
    
    approvedStudents.forEach(s => {
      const isExpired = s.expiryDate ? new Date(s.expiryDate) < now : false;
      const modulesCompleted = s.completedModules?.length || 0;
      
      if (isExpired) expiredCount++;
      else liveCount++;
      
      csvRows.push([
        s.studentId || 'N/A',
        `"${s.name}"`,
        s.email,
        s.assignedCourse || 'N/A',
        s.admissionDate ? new Date(s.admissionDate).toLocaleDateString() : 'N/A',
        s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : 'N/A',
        modulesCompleted,
        isExpired ? 'Expired' : 'Live'
      ]);
    });

    const header = `Report Date,${now.toLocaleDateString()}\nTotal Approved Students,${approvedStudents.length}\nLive Students,${liveCount}\nExpired Students,${expiredCount}\n\n`;
    const csvContent = header + csvRows.map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_report_${now.toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (checkPreview()) return;
    try {
      await deleteDoc(doc(db, 'users', studentId));
      alert('Student registration deleted successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${studentId}`);
    }
  };

  const [isSeedingLeads, setIsSeedingLeads] = useState(false);
  const [isSeedingStudents, setIsSeedingStudents] = useState(false);

  const seedDemoCRMLeads = async () => {
    if (checkPreview()) return;
    if (!confirm('This will add 5 demo student leads to the CRM. Continue?')) return;
    setIsSeedingLeads(true);
    try {
      const demoLeads = [
        {
          name: 'Arjun Sharma',
          phone: '+91 9876543210',
          email: 'arjun.sharma@example.com',
          companyName: 'Tech Mahindra',
          workExperience: '2 Years',
          currentRole: 'Graphic Designer',
          source: 'Google Ads',
          place: 'Mumbai',
          status: 'new',
          notes: [{ id: crypto.randomUUID(), date: new Date().toISOString(), text: 'Interested in Packaging Engineering course.', authorId: user?.id || 'system', authorName: user?.name || 'System' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: user?.id || ''
        },
        {
          name: 'Priya Patel',
          phone: '+91 8765432109',
          email: 'priya.patel@example.com',
          companyName: 'L&T Infotech',
          workExperience: '1 Year',
          currentRole: 'Junior Artist',
          source: 'Facebook',
          place: 'Ahmedabad',
          status: 'follow_up',
          nextFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: [{ id: crypto.randomUUID(), date: new Date().toISOString(), text: 'Requested course syllabus over email.', authorId: user?.id || 'system', authorName: user?.name || 'System' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: user?.id || ''
        },
        {
          name: 'Vikram Singh',
          phone: '+91 7654321098',
          email: 'vikram.singh@example.com',
          companyName: 'Reliance Retail',
          workExperience: '3 Years',
          currentRole: 'Print Operator',
          source: 'Inquiry',
          place: 'Delhi',
          status: 'demo_scheduled',
          notes: [{ id: crypto.randomUUID(), date: new Date().toISOString(), text: 'Demo scheduled for coming Saturday.', authorId: user?.id || 'system', authorName: user?.name || 'System' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: user?.id || ''
        },
        {
          name: 'Ananya Iyer',
          phone: '+91 6543210987',
          email: 'ananya.iyer@example.com',
          companyName: 'ITC Limited',
          workExperience: '4 Years',
          currentRole: 'Packaging Associate',
          source: 'Recommendation',
          place: 'Bangalore',
          status: 'adm_docs_pending',
          notes: [{ id: crypto.randomUUID(), date: new Date().toISOString(), text: 'Ready for admission. Waiting for degree certificates.', authorId: user?.id || 'system', authorName: user?.name || 'System' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: user?.id || ''
        },
        {
          name: 'Rahul Verma',
          phone: '+91 5432109876',
          email: 'rahul.verma@example.com',
          countryCode: '+1',
          workExperience: 'Fresh Graduate',
          currentRole: 'Student',
          source: 'Instagram',
          place: 'Pune',
          status: 'callback_requested',
          notes: [{ id: crypto.randomUUID(), date: new Date().toISOString(), text: 'Asked to call back after 6 PM.', authorId: user?.id || 'system', authorName: user?.name || 'System' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: user?.id || ''
        }
      ];

      for (const lead of demoLeads) {
        await addDoc(collection(db, 'leads'), lead);
      }
      alert('Successfully added 5 demo student leads to the CRM!');
    } catch (err) {
      console.error('Error seeding leads:', err);
      alert('Failed to seed leads.');
    } finally {
      setIsSeedingLeads(false);
    }
  };

  const seedDemoStudents = async () => {
    if (checkPreview()) return;
    if (!confirm('This will add 3 demo students with complete profiles. Continue?')) return;
    setIsSeedingStudents(true);
    try {
      const demoStudents = [
        {
          name: 'Suresh Kumar',
          email: 'suresh.kumar@demo.com',
          username: 'suresh_demo',
          role: 'student',
          isApproved: true,
          applicationStatus: 'approved',
          assignedCourse: 'production-art-engineer',
          studentId: 'ST-2024-001',
          admissionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          phone: '+91 9988776655',
          applicationData: {
            fullName: 'Suresh Kumar',
            mobileNumber: '9988776655',
            email: 'suresh.kumar@demo.com',
            gender: 'Male',
            qualification: 'B.Tech in Printing Technology',
            experienceYears: '1',
            modeOfStudy: 'Online'
          },
          completedModules: [],
          quizCompleted: false,
          videoRecorded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: 'Meena Reddy',
          email: 'meena.reddy@demo.com',
          username: 'meena_demo',
          role: 'student',
          isApproved: true,
          applicationStatus: 'approved',
          assignedCourse: 'packaging-engineer',
          studentId: 'ST-2024-002',
          admissionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          phone: '+91 8877665544',
          applicationData: {
            fullName: 'Meena Reddy',
            mobileNumber: '8877665544',
            email: 'meena.reddy@demo.com',
            gender: 'Female',
            qualification: 'Diploma in Packaging',
            experienceYears: 'Fresh Graduate',
            modeOfStudy: 'Practical'
          },
          completedModules: ['induction'],
          quizCompleted: true,
          videoRecorded: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: 'Deepak Chopra',
          email: 'deepak.chopra@demo.com',
          username: 'deepak_demo',
          role: 'student',
          isApproved: false,
          applicationStatus: 'submitted',
          phone: '+91 7766554433',
          applicationData: {
            fullName: 'Deepak Chopra',
            mobileNumber: '7766554433',
            email: 'deepak.chopra@demo.com',
            gender: 'Male',
            qualification: 'Graduate',
            experienceYears: '2',
            modeOfStudy: 'Hybrid'
          },
          completedModules: [],
          quizCompleted: false,
          videoRecorded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const student of demoStudents) {
        await addDoc(collection(db, 'users'), student);
      }
      alert('Successfully added 3 demo students (2 approved, 1 pending)!');
    } catch (err) {
      console.error('Error seeding students:', err);
      alert('Failed to seed students.');
    } finally {
      setIsSeedingStudents(false);
    }
  };

  const handleResetFacultyPassword = async (facultyId: string) => {
    try {
      // In Firebase Auth, we'd send a reset email. For now, we'll just flag it in Firestore.
      await updateDoc(doc(db, 'users', facultyId), { mustChangePassword: true });
      alert('Faculty will be prompted to change their password on next login (Note: Actual password reset should be done via Firebase Auth console or email).');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${facultyId}`);
    }
  };

  const handleDeleteFaculty = async (facultyId: string) => {
    if (checkPreview()) return;
    try {
      await deleteDoc(doc(db, 'users', facultyId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${facultyId}`);
    }
  };

  const handleResetTelecallerPassword = async (telecallerId: string) => {
    try {
      await updateDoc(doc(db, 'users', telecallerId), { mustChangePassword: true });
      alert('Telecaller will be prompted to change their password on next login (Note: Actual password reset should be done via Firebase Auth console or email).');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${telecallerId}`);
    }
  };

  const handleDeleteTelecaller = async (telecallerId: string) => {
    try {
      await deleteDoc(doc(db, 'users', telecallerId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${telecallerId}`);
    }
  };

  const handleResetMarketingPassword = async (marketingId: string) => {
    try {
      await updateDoc(doc(db, 'users', marketingId), { mustChangePassword: true });
      alert('Marketing Executive will be prompted to change their password on next login (Note: Actual password reset should be done via Firebase Auth console or email).');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${marketingId}`);
    }
  };

  const handleDeleteMarketing = async (marketingId: string) => {
    try {
      await deleteDoc(doc(db, 'users', marketingId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${marketingId}`);
    }
  };

  const handlePromoteToFaculty = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'faculty', applicationStatus: 'approved', isApproved: true });
      alert('User promoted to Faculty successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handlePromoteToTelecaller = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'telecaller', applicationStatus: 'approved', isApproved: true });
      alert('User promoted to Telecaller successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handlePromoteToAccounts = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'accounts_executive', applicationStatus: 'approved', isApproved: true });
      alert('User promoted to Accounts Executive successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handlePromoteToQC = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'qc', applicationStatus: 'approved', isApproved: true });
      alert('User promoted to QC Reviewer successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleDemoteToStudent = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'student' });
      alert('User demoted to Student successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleResetPassword = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const action = window.prompt(
      `🔒 PASSWORD MANAGEMENT for ${student.name}\n` +
      `--------------------------------------------------\n` +
      `Method 1: Type 'EMAIL' (Standard Reset)\n` +
      `- Sends a link to: ${student.email}\n` +
      `- Recommended first step. Note: Mails may land in SPAM.\n\n` +
      `Method 2: Type 'MANUAL' (Direct Override - RECOMMENDED)\n` +
      `- You set a temporary password now.\n` +
      `- Best if the student is not receiving emails.\n\n` +
      `Method 3: Type 'ENFORCE' (Next Login Force)\n` +
      `- Forces student to change password on next visit.\n\n` +
      `Type selection or Cancel:`,
      'MANUAL'
    );

    if (!action) return;
    const actionUpper = action.toUpperCase();

    try {
      if (actionUpper === 'EMAIL') {
        await updateDoc(doc(db, 'users', studentId), { mustChangePassword: true });
        try {
          await sendPasswordResetEmail(auth, student.email);
          alert(`✅ Reset email sent to ${student.email}. \n\nGUIDELINE: If student doesn't see it, ask them to check SPAM or use the 'MANUAL' method instead.`);
        } catch (emailErr: any) {
          console.error("Email reset failed:", emailErr);
          alert(`❌ EMAIL FAILED: ${emailErr.message}\n\nREASON: Firebase email limits or invalid email.\nFIX: Please use 'MANUAL' method instead.`);
        }
      } else if (actionUpper === 'MANUAL') {
        const newTempPassword = window.prompt('Enter new temporary password for student (Min 6 chars):', 'Welcome@123');
        if (!newTempPassword || newTempPassword.length < 6) {
          alert('Password too short or cancelled.');
          return;
        }

        const adminToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/admin-force-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, newPassword: newTempPassword, adminToken })
        });

        const result = await response.json();
        if (result.success) {
          alert(`Success! Password for ${student.name} is now: ${newTempPassword}. They will still be forced to change it on their next login for final security.`);
        } else {
          throw new Error(result.error || 'Backend reset failed');
        }
      } else if (actionUpper === 'ENFORCE') {
        await updateDoc(doc(db, 'users', studentId), { mustChangePassword: true });
        alert('Password change enforcement enabled for their next login.');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      alert('Operation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdateScore = async (studentId: string, course: CourseType, topic: string, field: keyof TopicScore, value: any) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    try {
      const scores = { ...student.scores };
      const categoryKey = course === 'production-art-engineer' ? 'productionArtEngineer' : (course === 'print-ready-engineer' ? 'printReadyEngineer' : 'qualityControlEngineer');
      const courseScores = { ...(scores[categoryKey] || {}) };
      const topicScore = { ...(courseScores[topic] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 }) } as TopicScore;
      
      (topicScore as any)[field] = value;
      courseScores[topic] = topicScore;
      
      scores[categoryKey] = courseScores;
      
      await updateDoc(doc(db, 'users', studentId), { scores });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleBulkUploadHolidays = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const batch = writeBatch(db);
        
        lines.forEach(line => {
          const [date, title] = line.split(',');
          if (date && title) {
            const holidayId = Math.random().toString(36).substr(2, 9);
            const holidayRef = doc(db, 'holidays', holidayId);
            batch.set(holidayRef, {
              id: holidayId,
              date: date.trim(),
              title: title.trim()
            });
          }
        });

        await batch.commit();
        alert('Holidays uploaded successfully.');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'holidays');
      }
    };
    reader.readAsText(file);
  };

  const handleModuleQuizUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'quizQuestions' | 'onlineTestQuestions' = 'quizQuestions') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const newQuestions: QuizQuestion[] = [];
        
        lines.forEach((line, index) => {
          if (index === 0 || !line.trim()) return; // Skip header or empty lines
          const parts = line.split(',');
          if (parts.length >= 6) {
            newQuestions.push({
              id: Math.random().toString(36).substr(2, 9),
              question: parts[0].trim(),
              options: [parts[1].trim(), parts[2].trim(), parts[3].trim(), parts[4].trim()],
              correctAnswer: parseInt(parts[5].trim()) || 0,
              type: parts[6]?.trim() === 'true-false' ? 'true-false' : 'multiple-choice'
            });
          }
        });

        if (editingModule) {
          setEditingModule({
            ...editingModule,
            module: { 
              ...editingModule.module, 
              [field]: [...(editingModule.module[field] || []), ...newQuestions] 
            }
          });
        } else if (isAddingModule) {
          setNewModuleData({
            ...newModuleData,
            [field]: [...(newModuleData[field] || []), ...newQuestions]
          });
        }
        alert(`${field === 'quizQuestions' ? 'Quiz' : 'Online Test'} questions loaded from CSV successfully.`);
      } catch (err) {
        console.error('Error parsing CSV', err);
        alert('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPreview()) return;
    if (!editingModule) return;

    try {
      const { module } = editingModule;
      await updateDoc(doc(db, 'course_modules', module.id), module as any);
      setEditingModule(null);
      alert('Module updated successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `course_modules/${editingModule.module.id}`);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const moduleId = Math.random().toString(36).substr(2, 9);
      const module: CourseModule = {
        id: moduleId,
        ...newModuleData
      };
      await setDoc(doc(db, 'course_modules', moduleId), module);
      setIsAddingModule(false);
      setNewModuleData({
        title: '',
        description: '',
        videoUrl: '',
        videoUrls: {},
        duration: '',
        category: 'production-art-engineer',
        assignmentPaperUrl: '',
        mindMapUrl: '',
        worksheetUrl: '',
        referenceMaterialUrl: '',
        slidesUrl: '',
        thumbnailUrl: '',
        additionalReferenceMaterials: [],
        quizQuestions: [],
        onlineTestQuestions: [],
        order: 1
      });
      alert('Module created successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'course_modules');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteDoc(doc(db, 'course_modules', moduleId));
      alert('Module deleted successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `course_modules/${moduleId}`);
    }
  };

  const handleBulkUploadMarks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const batch = writeBatch(db);
        let updatedCount = 0;

        // This is tricky because we need to find students by username
        // We'll fetch all students first
        const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const allStudents = studentsSnap.docs.map(d => ({ ...d.data(), id: d.id } as User));

        allStudents.forEach(u => {
          const userLines = lines.filter(line => line.startsWith(u.username + ','));
          if (userLines.length === 0) return;

          const scores = { ...u.scores };
          userLines.forEach(line => {
            const parts = line.split(',');
            if (parts.length < 9) return;

            const course = parts[1] as CourseType;
            const topic = parts[2];
            const courseScores = { ...(scores[getScoreKey(course) as keyof typeof scores] || {}) };
            
            courseScores[topic] = {
              assignment: parseInt(parts[3]) || 0,
              video: parseInt(parts[4]) || 0,
              worksheet: parseInt(parts[5]) || 0,
              project: parseInt(parts[6]) || 0,
              mindMap: parseInt(parts[7]) || 0,
              quiz: parseInt(parts[8]) || 0,
              attendance: parseInt(parts[9]) || 0
            };

            if (course === 'production-art-engineer') {
              scores.productionArtEngineer = courseScores;
            } else if (course === 'print-ready-engineer') {
              scores.printReadyEngineer = courseScores;
            } else {
              scores.qualityControlEngineer = courseScores;
            }
            updatedCount++;
          });

          batch.update(doc(db, 'users', u.id), { scores });
        });

        await batch.commit();
        alert(`Successfully updated ${updatedCount} mark entries.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'users');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSoftwareVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSoftwareVideoId) {
        await updateDoc(doc(db, 'software_videos', editingSoftwareVideoId), {
          ...softwareVideoForm,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'software_videos'), {
          ...softwareVideoForm,
          createdAt: new Date().toISOString()
        });
      }
      setShowSoftwareVideoModal(false);
      setEditingSoftwareVideoId(null);
      setSoftwareVideoForm({ toolName: 'Adobe Acrobat', title: '', videoUrl: '', duration: '5:00', courseIds: [] });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'software_videos');
    }
  };

  const handleDeleteSoftwareVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'software_videos', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `software_videos/${id}`);
    }
  };

  const downloadTemplate = () => {
    const headers = "username,course,topic,assignment(10),video(20),worksheet(20),project(20),mindMap(10),quiz(20),attendance(10)";
    const example = "student1,production-art,Color Fundamental,8,15,18,17,9,19,10";
    const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marks_template.csv';
    a.click();
  };

  const productionArtEngineerTopics = productionArtEngineerModules.map(m => m.title);
  const printReadyEngineerTopics = printReadyEngineerModules.map(m => m.title);
  const qualityControlEngineerTopics = qualityControlEngineerModules.map(m => m.title);
  const packagingEngineerTopics = packagingEngineerModules.map(m => m.title);
  const plateReadyEngineerTopics = plateReadyEngineerModules.map(m => m.title);
  const colourRetouchingEngineerTopics = colourRetouchingEngineerModules.map(m => m.title);
  const printingAndPackagingTopics = crossCourseModules.map(m => m.title);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPreview()) return;
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, `SecondaryStudent_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newStudent.email,
        DEFAULT_PASSWORD
      );
      
      const studentId = userCredential.user.uid;
      const username = newStudent.email.split('@')[0].toLowerCase().trim();
      const studentUser: User = {
        id: studentId,
        name: newStudent.name,
        username: username,
        email: newStudent.email,
        role: 'student',
        isApproved: true,
        mustChangePassword: true,
        registeredForDemo: false,
        applicationStatus: 'approved',
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        scores: { productionArtEngineer: {}, printReadyEngineer: {}, qualityControlEngineer: {} },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', studentId), studentUser);
      await signOut(secondaryAuth);
      setNewStudent({ name: '', email: '' });
      alert(`Student created successfully. Default password is: ${DEFAULT_PASSWORD}`);
    } catch (err) {
      console.error('Error creating student:', err);
      alert('Error creating student: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 400, 200, 0.8);
        await setDoc(doc(db, 'settings', 'admin'), { signature: compressedBase64 }, { merge: true });
        alert('Signature updated successfully.');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 400, 400, 0.8);
        await setDoc(doc(db, 'settings', 'admin'), { logoUrl: compressedBase64 }, { merge: true });
        alert('Logo updated successfully.');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
      }
    }
  };

  const handleLandingTitleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 1200, 400, 0.8);
        await setDoc(doc(db, 'settings', 'admin'), { landingPageTitleImageUrl: compressedBase64 }, { merge: true });
        alert('Landing Page Title Image updated successfully.');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
      }
    }
  };

  const handleSaveVideoUrls = async () => {
    try {
      await setDoc(doc(db, 'settings', 'admin'), { 
        founderVideoUrl, 
        founderVideoUrlTamil,
        overviewVideoUrl,
        overviewVideoUrlTamil,
        founderVideoEnabled,
        overviewVideoEnabled,
        entranceTestAudioUrl,
        wellnessEnabled,
        wellnessVideoUrl,
        enableDocumentDownloads,
        qcErrorCategories,
        landingPageStats
      }, { merge: true });
      alert('Settings saved successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
    }
  };

  const handleKnowledgeBaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Gemini inlineData limit is 20MB, but complex files might timeout.
    // Reducing limit to 8MB to improve reliability and avoid upstream timeouts.
    const MAX_FILE_SIZE_MB = 8; 
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`The file "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB. If you have a larger PDF, please split it into smaller parts (e.g., 5-10 pages each) and upload them separately.`);
      e.target.value = '';
      return;
    }

    setIsExtractingText(true);
    setExtractStatus(`Reading ${file.name}...`);
    try {
      // Handle Word (.docx) files
      if (file.name.toLowerCase().endsWith('.docx')) {
        setExtractStatus(`Extracting text from Word document ${file.name}...`);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const extractedText = result.value;
        
        if (extractedText) {
          setAiKnowledgeBase(prev => prev + '\n\n--- Extracted from ' + file.name + ' ---\n' + extractedText);
          alert('Text extracted from Word document successfully! Please review and click Save Knowledge Base.');
        } else {
          throw new Error('No text content found in the Word document.');
        }
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API Key is not configured. Please add GEMINI_API_KEY to your secrets.');
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          if (!result) {
            reject(new Error('Failed to read file: result is empty'));
            return;
          }
          const base64Data = result.split(',')[1];
          if (!base64Data) {
            reject(new Error('Failed to parse base64 data'));
            return;
          }
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(file);
      });

      setExtractStatus(`Extracting text from ${file.name} using Gemini... This usually takes 30-90 seconds for a 4MB PDF.`);
      
      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [
            { inlineData: { mimeType: file.type || 'application/pdf', data: base64 } },
            { text: "Extract all text from this entire document accurately. Do not summarize. Preserve the logical order. Output ONLY the extracted text content. If the document has images or handwriting, transcribe them into text." }
          ]}
        ]
      });

      const extractedText = response.text;
      if (extractedText) {
        setAiKnowledgeBase(prev => prev + '\n\n--- Extracted from ' + file.name + ' ---\n' + extractedText);
        alert('Text extracted successfully! Please review the text and click Save Knowledge Base.');
      }
    } catch (error: any) {
      console.error('Error extracting text:', error);
      let errorMessage = error?.message || 'Unknown error';
      // Handle the stringified JSON error message often returned by the SDK 
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('permission denied') || errorMessage.includes('API_KEY_INVALID')) {
        errorMessage = "Access Denied (403/Forbidden). Please ensure your Gemini API key is correctly set in Settings > Secrets. You may need to select a billing-enabled key for some features.";
      } else if (errorMessage.includes('504') || errorMessage.includes('timeout') || errorMessage.includes('DEADLINE_EXCEEDED')) {
        errorMessage = "Request Timed Out (504). The file might be too complex or large for a single extraction. Please try splitting the PDF into smaller page ranges and upload them separately.";
      }
      alert(`Failed to extract text from ${file.name}. Error: ${errorMessage}. Please ensure it is a valid PDF or Text file and not too large.`);
    } finally {
      setIsExtractingText(false);
      setExtractStatus('');
      if (e.target) e.target.value = '';
    }
  };

  const handleAddBranch = async () => {
    if (!newBranch.trim()) return;
    try {
      const updatedBranches = [...branches, newBranch.trim()];
      await setDoc(doc(db, 'settings', 'admin'), { branches: updatedBranches }, { merge: true });
      setNewBranch('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
    }
  };

  const handleRemoveBranch = async (branchToRemove: string) => {
    try {
      const updatedBranches = branches.filter(b => b !== branchToRemove);
      await setDoc(doc(db, 'settings', 'admin'), { branches: updatedBranches }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 1200, 1200, 0.7);
        setBannerForm(prev => ({ ...prev, imageUrl: compressedBase64 }));
      } catch (err) {
        console.error("Error compressing image:", err);
        alert("Failed to process image.");
      }
    }
  };

  const handleSaveBanner = async () => {
    if (checkPreview()) return;
    if (!bannerForm.imageUrl) {
      alert("Please upload a banner image.");
      return;
    }
    if (!bannerForm.title.trim()) {
      alert("Please enter a course title.");
      return;
    }

    try {
      const bannerData = {
        ...bannerForm,
        overview: bannerForm.overview.filter(o => o.trim() !== '')
      };

      if (editingBannerId) {
        await setDoc(doc(db, 'banners', editingBannerId), bannerData, { merge: true });
        
        // Also remove from settings/admin if it exists there to free up space
        const adminDoc = await getDocs(query(collection(db, 'settings')));
        const adminData = adminDoc.docs.find(d => d.id === 'admin')?.data();
        if (adminData && adminData.banners) {
          const updatedAdminBanners = adminData.banners.filter((b: any) => b.id !== editingBannerId);
          if (updatedAdminBanners.length !== adminData.banners.length) {
            await setDoc(doc(db, 'settings', 'admin'), { banners: updatedAdminBanners }, { merge: true });
          }
        }
      } else {
        const newId = Date.now().toString();
        await setDoc(doc(db, 'banners', newId), { ...bannerData, id: newId });
      }
      
      setShowBannerModal(false);
      setEditingBannerId(null);
      setBannerForm({
        imageUrl: '',
        title: '',
        level: 'BASIC',
        levelPercentage: 80,
        overview: ['', '', '']
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'banners');
    }
  };

  const handleEditBanner = (banner: any) => {
    setBannerForm({
      imageUrl: banner.imageUrl || '',
      title: banner.title || '',
      level: banner.level || 'BASIC',
      levelPercentage: banner.levelPercentage || 80,
      overview: banner.overview && banner.overview.length > 0 ? [...banner.overview, '', '', ''].slice(0, Math.max(3, banner.overview.length)) : ['', '', '']
    });
    setEditingBannerId(banner.id);
    setShowBannerModal(true);
  };

  const handleRemoveBanner = async (bannerId: string) => {
    try {
      // Remove from banners collection
      await deleteDoc(doc(db, 'banners', bannerId));
      
      // Also remove from settings/admin if it exists there
      const adminDoc = await getDocs(query(collection(db, 'settings')));
      const adminData = adminDoc.docs.find(d => d.id === 'admin')?.data();
      if (adminData && adminData.banners) {
        const updatedAdminBanners = adminData.banners.filter((b: any) => b.id !== bannerId);
        if (updatedAdminBanners.length !== adminData.banners.length) {
          await setDoc(doc(db, 'settings', 'admin'), { banners: updatedAdminBanners }, { merge: true });
        }
      }
      
      // Update local state immediately for better UX
      setBanners(prev => prev.filter(b => b.id !== bannerId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `banners/${bannerId}`);
    }
  };

  const handlePrintMasterProjectAction = () => {
    const printContent = document.getElementById('client-brief-printable');
    if (!printContent) {
      alert('Error: Could not find printable content. Please try again.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print/download the brief.');
      return;
    }

    // Get all styles from the current document
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>Project Brief - ${printingMasterProject?.title}</title>
          ${styles}
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              background: white !important; 
              padding: 0; 
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-container { 
              display: block !important; 
              visibility: visible !important;
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = () => {
              // Wait for all images to load
              const images = Array.from(document.querySelectorAll('img'));
              if (images.length === 0) {
                setTimeout(() => window.print(), 1000);
                return;
              }
              
              let loadedCount = 0;
              images.forEach(img => {
                if (img.complete) {
                  loadedCount++;
                } else {
                  img.onload = img.onerror = () => {
                    loadedCount++;
                    if (loadedCount === images.length) {
                      setTimeout(() => window.print(), 1000);
                    }
                  };
                }
              });
              
              if (loadedCount === images.length) {
                setTimeout(() => window.print(), 1000);
              }
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintMasterProject = (master: any) => {
    setPrintingMasterProject(master);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      // We'll keep the modal open so the user can try again or close it manually
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (!user || (!isAdmin && !isQC)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-8">You do not have the required permissions to access the Admin Panel.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("max-w-6xl mx-auto", printingMasterProject ? "print:max-w-none print:w-full print:mx-0 print:p-0" : "")}>
      <PrintStyles />
      {printingMasterProject && (
        <>
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center no-print">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-pink-100 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-gray-900">Preparing PDF Brief...</h3>
                <p className="text-sm text-gray-500">The print window will open automatically.</p>
                <div className="flex flex-col gap-2 mt-4">
                  <button 
                    onClick={handlePrintMasterProjectAction}
                    className="px-6 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Open Print / Download Window
                  </button>
                  <button 
                    onClick={() => setPrintingMasterProject(null)}
                    className="text-sm text-gray-400 hover:text-pink-600 font-medium py-2"
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="print-only">
            <ClientBriefPrintable project={printingMasterProject} logoUrl={logoUrl} />
          </div>
        </>
      )}
      <div className={cn("mb-8 hidden md:block", printingMasterProject ? "print:hidden" : "")}>
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="text-gray-500 mt-2">Manage students, course content, and assessments.</p>
      </div>

      {/* Tabs */}
      <div className={cn("relative group bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-8", printingMasterProject ? "print:hidden" : "")}>
        {/* Left Scroll Button */}
        <button 
          onClick={() => scrollTabs('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/95 backdrop-blur-sm border border-gray-100 shadow-md flex items-center justify-center text-pink-600 hover:bg-pink-50 transition-all rounded-full -translate-x-1/2 hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div 
          ref={tabsRef}
          className="flex items-center gap-1 overflow-x-auto custom-scrollbar scroll-smooth px-8 py-2"
          onWheel={(e) => {
            if (tabsRef.current) {
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
              tabsRef.current.scrollLeft += e.deltaY;
            }
          }}
        >
          {[
            { id: 'marks', label: 'Score Card', icon: Calculator },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'demo', label: `Demo (${students.filter(s => s.registeredForDemo && !s.isApproved && (!s.applicationStatus || s.applicationStatus === 'none' || s.applicationStatus === 'pending')).length})`, icon: Users },
            { id: 'applications', label: `Apps (${students.filter(s => !s.isApproved && s.applicationStatus === 'submitted').length})`, icon: FileText },
            { id: 'submissions', label: 'Submissions', icon: Upload },
            { id: 'videos', label: 'Modules', icon: BookOpen },
            { id: 'staff', label: 'Staff Accounts', icon: ShieldCheck },
            { id: 'queries', label: 'Query Tracker', icon: MessageCircle },
            { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
            { id: 'referrals', label: 'Referrals', icon: Users },
            { id: 'live-classes', label: 'Live', icon: Video },
            { id: 'software-videos', label: 'Software', icon: Video },
            { id: 'projects', label: 'Projects', icon: FolderKanban },
            { id: 'qc', label: 'QC Desk', icon: FileCheck },
            { id: 'pre-flight', label: 'Checklist', icon: FileCheck },
            { id: 'training-records', label: 'Records', icon: FileText },
            { id: 'training-plans', label: 'Training Plans', icon: BookOpen },
            { id: 'entrance-test', label: 'Entrance Test', icon: FileCheck },
            { id: 'webinar', label: 'Webinar Leads', icon: Video },
            { id: 'batch-center', label: 'Batch Center', icon: Layers },
            { id: 'roadmap', label: 'Faculty Roadmap', icon: Layers },
            { id: 'interactive-demo', label: 'Demo Center', icon: Sparkles },
            { id: 'team', label: 'Manage Team', icon: Users },
            { id: 'placements', label: 'Placements', icon: Briefcase },
            { id: 'holidays', label: 'Holidays', icon: Calendar },
            { id: 'settings', label: 'Settings', icon: ShieldCheck }
          ].filter(tab => {
            if (isQC) return tab.id === 'projects' || tab.id === 'qc' || tab.id === 'settings';
            return true;
          }).map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => {
                if (tab.id === 'interactive-demo') {
                  navigate('/admin/demo-center');
                } else {
                  setActiveTab(tab.id as any);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-pink-600 text-white shadow-md shadow-pink-200" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button 
          onClick={() => scrollTabs('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/95 backdrop-blur-sm border border-gray-100 shadow-md flex items-center justify-center text-pink-600 hover:bg-pink-50 transition-all rounded-full translate-x-1/2 hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className={cn("bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden", printingMasterProject ? "print:hidden" : "")}>
        {activeTab === 'training-plans' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Training Plan Templates</h3>
                <p className="text-gray-500 mt-1">Configure course-wise syllabus subjects, levels, topics, duration, and SMEs.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {trainingPlans.filter(tp => tp.courseId === selectedCourseId).length === 0 && (
                  <button
                    onClick={handleLoadDefaultTrainingPlans}
                    className="flex items-center gap-2 border border-pink-200 text-pink-700 bg-pink-50/50 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-pink-100/60 hover:text-pink-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Load Default Template
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingPlanRow(null);
                    setPlanSNo(trainingPlans.filter(tp => tp.courseId === selectedCourseId).length + 1);
                    setPlanSubject('');
                    setPlanLevel('Level 1');
                    setPlanTopicsText('');
                    setPlanTrainer('');
                    setPlanDuration('');
                    setPlanStatus('To Do');
                    setPlanMaterialType('Power Point');
                    setPlanTargetDate('');
                    setShowPlanModal(true);
                  }}
                  className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Subject Row
                </button>
              </div>
            </div>

            {/* Course Selector Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100 rounded-2xl w-fit">
              {courseModules.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    selectedCourseId === c.id
                      ? "bg-white text-pink-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>

            {/* Training Plan Table */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-4 w-12 text-center">S.No</th>
                      <th className="px-4 py-4 min-w-[180px]">Course Subject</th>
                      <th className="px-4 py-4 w-28">Training Level</th>
                      <th className="px-4 py-4 min-w-[280px]">Topics Covered</th>
                      <th className="px-4 py-4 w-32">Trainer (SME)</th>
                      <th className="px-4 py-4 w-24">Duration</th>
                      <th className="px-4 py-4 w-32">Target Date</th>
                      <th className="px-4 py-4 w-32">Material Type</th>
                      <th className="px-4 py-4 w-28">Status</th>
                      <th className="px-4 py-4 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trainingPlans
                      .filter(tp => tp.courseId === selectedCourseId)
                      .sort((a, b) => {
                        if (a.sNo !== b.sNo) return a.sNo - b.sNo;
                        return a.level.localeCompare(b.level);
                      })
                      .map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-center font-mono text-xs font-semibold text-slate-500">
                            {row.sNo}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                            {row.courseSubject}
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                              row.level === 'Level 1' 
                                ? "bg-blue-50 text-blue-700 border border-blue-100" 
                                : row.level === 'Level 2'
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                : "bg-purple-50 text-purple-700 border border-purple-100"
                            )}>
                              {row.level}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            <ul className="list-disc pl-4 space-y-1">
                              {row.topics.map((t, i) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {row.trainerSme || <span className="text-slate-400 italic">Unassigned</span>}
                          </td>
                          <td className="px-5 py-4 text-sm font-mono text-slate-600">
                            {row.durationHrs || <span className="text-slate-400 italic">-</span>}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700 font-mono">
                            {row.targetDate ? (
                              new Date(row.targetDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            ) : (
                              <span className="text-slate-400 italic">Not set</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                              {(row.materialType || 'Power Point')
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean)
                                .map((type) => (
                                  <span
                                    key={type}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap",
                                      type === 'Power Point'
                                        ? "bg-orange-50 text-orange-700 border-orange-100"
                                        : type === 'Video'
                                        ? "bg-teal-50 text-teal-700 border-teal-100"
                                        : type === 'Exercise file'
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-slate-50 text-slate-700 border-slate-100"
                                    )}
                                  >
                                    {type}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border leading-normal",
                              row.status === 'Completed'
                                ? "bg-green-50 text-green-700 border-green-100"
                                : row.status === 'WIP'
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-slate-50 text-slate-600 border-slate-100"
                            )}>
                              {row.status || 'To Do'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingPlanRow(row);
                                  setPlanSNo(row.sNo);
                                  setPlanSubject(row.courseSubject);
                                  setPlanLevel(row.level);
                                  setPlanTopicsText(row.topics.join('\n'));
                                  setPlanTrainer(row.trainerSme);
                                  setPlanDuration(row.durationHrs);
                                  setPlanStatus(row.status || 'To Do');
                                  setPlanMaterialType(row.materialType || 'Power Point');
                                  setPlanTargetDate(row.targetDate || '');
                                  setShowPlanModal(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
                                title="Edit Row"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrainingPlanRow(row.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {trainingPlans.filter(tp => tp.courseId === selectedCourseId).length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-slate-500">
                          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                          <p className="font-semibold text-slate-700">No training plans added yet</p>
                          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                            Load the default template or click "Add Subject Row" to begin creating the course-wise training plan.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal for adding/editing training plan rows */}
            {showPlanModal && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-screen items-center justify-center p-4 text-center bg-black/50 backdrop-blur-xs">
                  <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-lg p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                      <h3 className="text-lg font-bold text-gray-900">
                        {editingPlanRow ? 'Edit Training Plan Subject' : 'Add Training Plan Subject'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowPlanModal(false);
                          setEditingPlanRow(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-slate-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveTrainingPlanRow} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">S.No</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={planSNo}
                            onChange={(e) => setPlanSNo(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-pink-500 outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Training Level</label>
                          <select
                            value={planLevel}
                            onChange={(e) => setPlanLevel(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-pink-500 outline-hidden"
                          >
                            <option value="Level 1">Level 1</option>
                            <option value="Level 2">Level 2</option>
                            <option value="Level 3">Level 3</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Subject</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Understanding of Briefs & Annotation"
                          value={planSubject}
                          onChange={(e) => setPlanSubject(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-pink-500 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Topics Covered (one per line)
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="e.g.&#10;Understanding Job briefs & annotated PDF&#10;Working with workorder info"
                          value={planTopicsText}
                          onChange={(e) => setPlanTopicsText(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-pink-500 outline-hidden font-sans resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trainer (SME / Faculty)</label>
                          <select
                            required
                            value={planTrainer}
                            onChange={(e) => setPlanTrainer(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-pink-500 outline-hidden"
                          >
                            <option value="">Select Faculty</option>
                            {faculty.map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (hrs)</label>
                          <input
                            type="text"
                            placeholder="e.g. 1.5 hrs"
                            value={planDuration}
                            onChange={(e) => setPlanDuration(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-pink-500 outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Date</label>
                          <input
                            type="date"
                            value={planTargetDate}
                            onChange={(e) => setPlanTargetDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-pink-500 outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material Type</label>
                          <div className="flex flex-wrap gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px] items-center">
                            {(() => {
                              const currentMaterialTypes = planMaterialType
                                ? planMaterialType.split(',').map(s => s.trim()).filter(Boolean)
                                : [];
                              const handleMaterialTypeChange = (type: string, checked: boolean) => {
                                let updatedTypes = [...currentMaterialTypes];
                                if (checked) {
                                  if (!updatedTypes.includes(type)) {
                                    updatedTypes.push(type);
                                  }
                                } else {
                                  updatedTypes = updatedTypes.filter(t => t !== type);
                                }
                                setPlanMaterialType(updatedTypes.join(', '));
                              };
                              return ['Power Point', 'Video', 'Exercise file'].map((type) => {
                                const isChecked = currentMaterialTypes.includes(type);
                                return (
                                  <label key={type} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => handleMaterialTypeChange(type, e.target.checked)}
                                      className="w-3.5 h-3.5 text-pink-600 border-slate-300 rounded-sm focus:ring-pink-500 cursor-pointer"
                                    />
                                    <span>{type}</span>
                                  </label>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                        <select
                          value={planStatus}
                          onChange={(e) => setPlanStatus(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-pink-500 outline-hidden"
                        >
                          <option value="To Do">To Do</option>
                          <option value="WIP">WIP</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 mt-5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPlanModal(false);
                            setEditingPlanRow(null);
                          }}
                          className="px-4 py-2 bg-slate-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingPlan}
                          className="px-5 py-2 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center gap-2"
                        >
                          {isSavingPlan && <Loader2 className="w-4 h-4 animate-spin" />}
                          {editingPlanRow ? 'Save Changes' : 'Create Row'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'entrance-test' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Entrance Test Results</h3>
                <p className="text-gray-500 mt-1">Review student performance in adaptive entrance tests.</p>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total Submissions</span>
                  <span className="text-lg font-bold text-gray-900">{students.filter(s => s.entranceTestResults).length}</span>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Evaluated</span>
                  <span className="text-lg font-bold text-green-600">{students.filter(s => s.entranceTestStatus === 'evaluated').length}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest pl-4">Student</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Test Date</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">MCQ</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">AI Sub-Scores</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total Mark</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students
                    .filter(s => s.entranceTestResults || s.entranceTestStatus === 'assigned')
                    .sort((a, b) => {
                      const dateA = new Date(a.entranceTestResults?.submittedAt || a.updatedAt || 0).getTime();
                      const dateB = new Date(b.entranceTestResults?.submittedAt || b.updatedAt || 0).getTime();
                      return dateB - dateA;
                    })
                    .map((student) => {
                      const results = student.entranceTestResults;
                      
                      return (
                        <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{student.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase">{student.studentId || student.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-gray-600 font-medium">
                              {results?.submittedAt ? new Date(results.submittedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4">
                            {results ? (
                              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                                {results.mcqMarks} / 20
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Pending</span>
                            )}
                          </td>
                          <td className="py-4">
                            {results ? (
                              <div className="flex gap-1">
                                {['story1', 'story2', 'listening', 'paragraph', 'partF'].map((key) => {
                                  const marks = results.aiEvaluation?.marks?.[key as keyof typeof results.aiEvaluation.marks];
                                  return (
                                    <div key={key} className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold bg-gray-100 text-gray-500" title={key}>
                                      {marks || 0}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <div key={i} className="w-6 h-6 rounded border border-dashed border-gray-200" />
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="text-base font-black text-gray-900">
                              {results ? `${results.totalMarks} / ${results.maxMarks || 75}` : '- / -'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              student.entranceTestStatus === 'evaluated' ? "bg-green-100 text-green-700" : 
                              student.entranceTestStatus === 'assigned' ? "bg-purple-100 text-purple-700" :
                              "bg-orange-100 text-orange-700"
                            )}>
                              {student.entranceTestStatus || 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-4">
                            {results ? (
                              <button
                                onClick={() => {
                                  setViewingTestResults(results);
                                  setViewingTestStudentName(student.name);
                                }}
                                className="p-2 bg-white border border-gray-100 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all shadow-sm"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleAssignEntranceTest(student.id)}
                                  className="p-2 bg-white border border-gray-100 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all shadow-sm"
                                  title="Re-assign Test"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {students.filter(s => s.entranceTestResults || s.entranceTestStatus === 'assigned').length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-gray-400 italic">
                        No entrance test submissions found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'training-records' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Training Records</h3>
                <p className="text-sm text-gray-500">View and manage digitized MDS training records.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingTrainingRecord(null);
                  setShowTrainingModal(true);
                }}
                className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Training Record
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingRecords.map((record) => (
                <div key={record.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-gray-900">{record.studentName}</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(record.trainingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-gray-600 flex items-center gap-2 font-medium">
                      <UserIcon className="w-3.5 h-3.5" /> Trainer: {record.trainerName}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2 italic">
                      Topics: {record.topics}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTrainingRecord(record);
                        setShowTrainingModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit / View
                    </button>
                    <button
                      onClick={() => handleDeleteTrainingRecord(record.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {trainingRecords.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No training records found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'placements' && (
          <PlacementAdminView students={students} />
        )}

        {activeTab === 'team' && (
          <div className="p-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-pink-600" />
                  Team & Founder Profiles
                </h3>
                <p className="text-gray-500 mt-1 font-medium">Manage how your leadership and instructors appear to students.</p>
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setEditingTeamMember(null);
                      setTempPhotoUrl('');
                      setIsTeamModalOpen(true);
                    }}
                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-pink-600 transition-all shadow-lg shadow-gray-200 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Founders Section */}
              <div className="lg:col-span-1 space-y-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4">Founders</h4>
                {teamMembers.filter(m => m.isFounder).length === 0 && (
                  <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-dashed border-gray-200 text-center text-gray-400">
                    No founder profiles yet.
                  </div>
                )}
                {teamMembers.filter(m => m.isFounder).map(member => (
                  <div key={member.id} className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/20 blur-3xl -mr-10 -mt-10" />
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-white rounded-3xl mb-6 flex items-center justify-center p-1 shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform overflow-hidden border-2 border-pink-500/30">
                         <img 
                           src={member.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop"} 
                           alt={member.name} 
                           className="w-full h-full object-cover rounded-2xl"
                         />
                      </div>
                      <div className="mb-6">
                        <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.3em]">Chief Founder</span>
                        <h4 className="text-2xl font-black mt-1">{member.name}</h4>
                        <p className="text-gray-400 text-sm mt-2 italic font-medium leading-relaxed">
                          "{member.bio || "Empowering the next generation..."}"
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingTeamMember(member);
                            setTempPhotoUrl(member.photoUrl || '');
                            setIsTeamModalOpen(true);
                          }}
                          className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-3 h-3" /> Edit Profile
                        </button>
                        <button 
                          onClick={() => handleDeleteTeamMember(member.id)}
                          className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructor List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm min-h-[400px]">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-lg font-bold text-gray-900">Instructors & Faculty</h4>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{teamMembers.filter(m => !m.isFounder).length} Members</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers.filter(m => !m.isFounder).map((member) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 rounded-3xl border border-gray-50 hover:border-pink-100 hover:bg-pink-50/30 transition-all group">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                          <img src={member.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop"} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{member.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{member.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingTeamMember(member);
                              setTempPhotoUrl(member.photoUrl || '');
                              setIsTeamModalOpen(true);
                            }}
                            className="p-2 text-gray-300 hover:text-pink-600 bg-white rounded-xl shadow-sm border border-gray-100 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeamMember(member.id)}
                            className="p-2 text-gray-300 hover:text-red-500 bg-white rounded-xl shadow-sm border border-gray-100 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {teamMembers.filter(m => !m.isFounder).length === 0 && (
                      <div className="col-span-2 py-20 text-center text-gray-400 italic">
                        No instructors added yet. Start by clicking "Add Member".
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-pink-50 rounded-[2.5rem] p-8 border border-pink-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Image className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900">Photo Template Tip</h5>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        For best results, use square photos (1:1 aspect ratio) with clear faces. Photos will be automatically rounded into our signature style.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Member Modal */}
            <AnimatePresence>
              {isTeamModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsTeamModalOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                  >
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="text-xl font-bold text-gray-900">
                        {editingTeamMember ? 'Edit Team Member' : 'Add New Member'}
                      </h4>
                      <button onClick={() => setIsTeamModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        handleSaveTeamMember({
                          name: data.get('name') as string,
                          role: data.get('role') as string,
                          bio: data.get('bio') as string,
                          photoUrl: data.get('photoUrl') as string,
                          isFounder: data.get('isFounder') === 'true',
                        });
                      }}
                      className="p-8 space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-widest">Full Name</label>
                          <input 
                            name="name"
                            defaultValue={editingTeamMember?.name}
                            required
                            placeholder="e.g. Dr. Karthikeyan"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-widest">Role</label>
                          <input 
                            name="role"
                            defaultValue={editingTeamMember?.role}
                            required
                            placeholder="e.g. Chief Founder"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-widest">Profile Photo</label>
                        <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <div className="w-20 h-20 rounded-2xl bg-white border border-gray-100 overflow-hidden shrink-0">
                            {tempPhotoUrl ? (
                              <img src={tempPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                <Image className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <FileUploader 
                              path="team"
                              onUploadComplete={(url) => setTempPhotoUrl(url)}
                              accept="image/jpeg,image/png,image/webp"
                            />
                            <p className="mt-2 text-[10px] text-gray-400">Square photos (1:1) work best.</p>
                          </div>
                        </div>
                        <input type="hidden" name="photoUrl" value={tempPhotoUrl} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-widest">Type</label>
                        <select 
                          name="isFounder"
                          defaultValue={editingTeamMember?.isFounder ? 'true' : 'false'}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        >
                          <option value="false">Instructor / Staff</option>
                          <option value="true">Founder / Director</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-widest">Short Bio</label>
                        <textarea 
                          name="bio"
                          defaultValue={editingTeamMember?.bio}
                          rows={3}
                          placeholder="Speak about their expertise..."
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
                        />
                      </div>

                      <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-pink-600 transition-all shadow-xl shadow-gray-200">
                        {editingTeamMember ? 'Save Changes' : 'Add Team Member'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'batch-center' && (
          <>
            {/* Batch Modal */}
            <AnimatePresence>
              {showBatchModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Create New Batch</h3>
                      <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    <form onSubmit={handleCreateBatch} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 px-1 uppercase tracking-widest">Batch Name</label>
                        <input 
                          type="text" 
                          required
                          autoFocus
                          value={newBatchName}
                          onChange={(e) => setNewBatchName(e.target.value)}
                          placeholder="e.g. MORN-APR-24"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={!newBatchName.trim()}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-pink-600 transition-all shadow-lg shadow-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Batch
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-pink-600" />
                  Batch Management Center
                </h3>
                <p className="text-sm text-gray-500">Group students into batches for organized tracking and schedules.</p>
              </div>
              <button 
                onClick={() => setShowBatchModal(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-pink-600 transition-all"
              >
                <Plus className="w-4 h-4" /> Create New Batch
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {batches.length === 0 && (
                <div className="col-span-3 py-20 text-center text-gray-400 italic bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  No batches created yet.
                </div>
              )}
              {batches.map(batch => (
                <div key={batch.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-pink-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-gray-900">{batch.name}</h4>
                    <span className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-100 uppercase">
                      {batch.status || 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-6">
                    <span>Students: {students.filter(s => s.batch === batch.name && s.isApproved).length}</span>
                    <span>
                      {batch.createdAt?.seconds 
                        ? new Date(batch.createdAt.seconds * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Just now'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all">View Students</button>
                    <button 
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div 
                onClick={() => setShowBatchModal(true)}
                className="bg-dashed-border rounded-2xl p-6 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-pink-200 hover:text-pink-400 transition-all cursor-pointer"
              >
                <Plus className="w-8 h-8 mb-2" />
                <span className="text-sm font-bold">Add Custom Batch</span>
              </div>
            </div>
          </div>
          </>
        )}

        {activeTab === 'pre-flight' && (
          <div className="p-6 bg-gray-50 space-y-6">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
               <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded-lg uppercase tracking-wider">Demo Mode</div>
               <DigitalPreFlightChecklist isAdmin={true} readOnly={false} />
             </div>
             
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
               <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded-lg uppercase tracking-wider">Demo Mode</div>
               <DigitalProductionArtChecklist isAdmin={true} readOnly={false} />
             </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="p-6">
            <FacultyRoadmapPlanner isAdmin={true} />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-gray-900">Student Registrations</h3>
                <select 
                  className="text-xs p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                >
                  <option value="all">All Faculty</option>
                  <option value="unassigned">Unassigned</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-xs font-bold">
                  {students.filter(s => !s.isApproved && s.applicationStatus === 'submitted').length} Pending
                </span>
              </div>
            </div>

            {/* Quick Add Student Form */}
            <div className="mb-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-pink-600" />
                Add Student Manually
              </h4>
              <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Student Full Name"
                  className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Student Email Address"
                  className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  required
                />
                <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-100">
                  <Plus className="w-4 h-4" /> Create Student
                </button>
              </form>
              <p className="mt-2 text-[10px] text-gray-400 italic">
                * Students created here will have the default password: <strong>{DEFAULT_PASSWORD}</strong> and must change it on first login.
              </p>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar pb-4">
              <table className="w-full text-left min-w-[1600px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-semibold text-sm text-gray-500">Student Name</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Username</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Requested Course</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Assigned Course</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Language</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Faculty</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Test Score</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Status</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">ID Card</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Certificate</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students
                    .filter(s => s.isApproved)
                    .filter(s => {
                      if (facultyFilter === 'all') return true;
                      if (facultyFilter === 'unassigned') return !s.assignedFacultyId;
                      return s.assignedFacultyId === facultyFilter;
                    })
                    .map((student) => (
                    <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono font-bold">
                          {student.username}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1">
                          {(student.requestedCourses && student.requestedCourses.length > 0) ? (
                            student.requestedCourses.map(course => (
                              <span key={course} className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                course === 'production-art-engineer' ? "bg-pink-50 text-pink-600" : 
                                course === 'print-ready-engineer' ? "bg-orange-50 text-orange-600" :
                                "bg-purple-50 text-purple-600"
                              )}>
                                {formatCourseName(course)}
                              </span>
                            ))
                          ) : student.requestedCourse ? (
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase",
                              student.requestedCourse === 'production-art-engineer' ? "bg-pink-50 text-pink-600" : 
                              student.requestedCourse === 'print-ready-engineer' ? "bg-orange-50 text-orange-600" :
                              "bg-purple-50 text-purple-600"
                            )}>
                              {formatCourseName(student.requestedCourse)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not selected</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1 min-w-[250px] relative">
                          <div className={cn(
                            "flex flex-wrap gap-1.5 transition-all duration-300 w-full",
                            expandedViewStudentId === student.id ? "" : "max-h-[24px] overflow-hidden"
                          )}>
                            {(student.assignedCourses || (student.assignedCourse ? [student.assignedCourse] : [])).length > 0 ? (
                              (student.assignedCourses || (student.assignedCourse ? [student.assignedCourse] : [])).map(course => (
                                <span key={course} className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap",
                                  course === 'production-art-engineer' ? "bg-pink-100 text-pink-700" : 
                                  course === 'print-ready-engineer' ? "bg-orange-100 text-orange-700" :
                                  "bg-purple-100 text-purple-700"
                                )}>
                                  {formatCourseName(course)}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-400 italic mt-1">None assigned</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            {(student.assignedCourses || (student.assignedCourse ? [student.assignedCourse] : [])).length > 2 && (
                              <button 
                                onClick={() => setExpandedViewStudentId(expandedViewStudentId === student.id ? null : student.id)}
                                className="text-[10px] font-bold text-pink-600 hover:text-pink-800 transition-colors hover:underline px-1 py-0.5 rounded-full bg-pink-50 hover:bg-pink-100"
                              >
                                {expandedViewStudentId === student.id ? 'Show Less' : `+${(student.assignedCourses?.length || 1) - 2} More (Expand)`}
                              </button>
                            )}
                            <button 
                              onClick={() => setExpandedCoursesStudentId(expandedCoursesStudentId === student.id ? null : student.id)}
                              className="text-[10px] font-bold text-gray-400 hover:text-pink-600 transition-colors flex items-center gap-1 group"
                              title="Manage Course Assignments"
                            >
                              {expandedCoursesStudentId === student.id ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" />}
                              {expandedCoursesStudentId === student.id ? 'Hide Manage' : 'Manage Courses'}
                            </button>
                          </div>

                          {expandedCoursesStudentId === student.id && (
                            <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-2 mt-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 relative z-[20] w-[220px]">
                              <div className="flex items-center justify-between mb-1 border-b border-gray-50 pb-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Course Selection</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedCoursesStudentId(null);
                                  }}
                                  className="text-gray-400 hover:text-pink-600 transition-colors p-1 bg-gray-50 rounded-full hover:bg-pink-50"
                                  title="Close Selection Window"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              {courseModules.map(({ id: course }) => {
                                const isAssigned = (student.assignedCourses || (student.assignedCourse ? [student.assignedCourse] : [])).includes(course as CourseType);
                                return (
                                  <label key={course} className="flex items-center gap-2 cursor-pointer group/item">
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={() => handleToggleCourseAssignment(student.id, course as CourseType)}
                                      className="w-3.5 h-3.5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 transition-all cursor-pointer"
                                    />
                                    <span className={cn(
                                      "text-[10px] font-medium transition-colors leading-tight",
                                      isAssigned ? "text-pink-600 font-bold" : "text-gray-500 group-hover/item:text-gray-700"
                                    )}>
                                      {formatCourseName(course)}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <select
                          className="text-[10px] p-1 bg-gray-50 border border-gray-200 rounded outline-none focus:ring-1 focus:ring-pink-500 w-24"
                          value={student.nativeLanguage || 'english'}
                          onChange={(e) => handleAssignLanguage(student.id, e.target.value)}
                        >
                          <option value="english">English</option>
                          <option value="tamil">Tamil</option>
                          <option value="kannada">Kannada</option>
                          <option value="malayalam">Malayalam</option>
                          <option value="telugu">Telugu</option>
                          <option value="hindi">Hindi</option>
                        </select>
                      </td>
                      <td className="py-4">
                        <select
                          className="text-[10px] p-1 bg-gray-50 border border-gray-200 rounded outline-none focus:ring-1 focus:ring-pink-500 w-24"
                          value={student.assignedFacultyId || ''}
                          onChange={(e) => handleAssignFaculty(student.id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {faculty.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4">
                        {student.entranceTestStatus === 'evaluated' ? (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                            {student.entranceTestMarks} / 60
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not taken</span>
                        )}
                      </td>
                      <td className="py-4">
                        {student.isPhasedOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                            <XCircle className="w-3 h-3" /> Phased Out
                          </span>
                        ) : student.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleToggleIDApproval(student.id)}
                          className={cn(
                            "btn-compact uppercase",
                            student.idCardApproved 
                              ? "bg-green-100 text-green-700 hover:bg-green-200" 
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          )}
                        >
                          {student.idCardApproved ? 'Approved' : 'Pending'}
                        </button>
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleToggleCertificateApproval(student.id, student.certificateApproved)}
                          className={cn(
                            "btn-compact uppercase",
                            student.certificateApproved 
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          )}
                        >
                          {student.certificateApproved ? 'Approved' : 'Pending'}
                        </button>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2 relative dropdown-container">
                          {!student.isApproved && !student.isPhasedOut ? (
                            <button 
                              onClick={() => handleApprove(student.id)}
                              className="btn-primary-compact"
                            >
                              Approve
                            </button>
                          ) : student.isApproved ? (
                            <button 
                              onClick={() => handleReject(student.id)}
                              className="btn-danger-compact"
                            >
                              Revoke
                            </button>
                          ) : null}

                          <button 
                            onClick={() => {
                              if (student.applicationData) {
                                setViewingApplication(student.applicationData);
                                setViewingApplicationStudentId(student.id);
                              }
                            }}
                            className={cn(
                              "btn-ghost transition-colors",
                              student.applicationData ? "text-pink-600" : "text-gray-300 cursor-not-allowed"
                            )}
                            disabled={!student.applicationData}
                            title="View Application Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {student.entranceTestStatus === 'evaluated' && (
                            <button 
                              onClick={() => {
                                setViewingTestResults(student.entranceTestResults);
                                setViewingTestStudentName(student.name);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Entrance Test Results"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          <button 
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === student.id ? null : student.id)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdownId === student.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200 text-left">
                              <button 
                                onClick={() => { handleResetPassword(student.id); setActiveDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-pink-600 flex items-center gap-2"
                              >
                                <Key className="w-4 h-4" /> Reset Password
                              </button>
                              
                              <button 
                                onClick={() => { handlePhaseOut(student.id); setActiveDropdownId(null); }}
                                className={cn(
                                  "w-full text-left px-4 py-2 text-sm flex items-center gap-2",
                                  student.isPhasedOut ? "text-orange-600 hover:bg-orange-50" : "text-red-600 hover:bg-red-50"
                                )}
                              >
                                {student.isPhasedOut ? <RefreshCw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                {student.isPhasedOut ? "Restore Access" : "Phase Out"}
                              </button>

                              <button 
                                onClick={() => { 
                                  setViewingApplication(student.applicationData || { fullName: student.name, gender: 'Male', dob: '', qualification: '', university: '', graduationYear: '', experienceYears: '' } as any);
                                  setViewingApplicationStudentId(student.id);
                                  setIsEditingApplication(true);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-pink-600 hover:bg-pink-50 flex items-center gap-2 font-medium"
                              >
                                <Edit className="w-4 h-4" /> Edit Profile Details
                              </button>

                              {student.isApproved && (
                                <>
                                  <button 
                                    onClick={() => { handleAssignEntranceTest(student.id); setActiveDropdownId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                                  >
                                    <FileCheck className="w-4 h-4" /> Assign Entrance Test
                                  </button>
                                  <button 
                                     onClick={() => { handleExtendAccess(student.id); setActiveDropdownId(null); }}
                                     className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                   >
                                    <Calendar className="w-4 h-4" /> Extend Access
                                  </button>
                                  <button 
                                    onClick={() => { 
                                      setApprovingStudentId(student.id); 
                                      setRegistrationNumber(student.studentId || '');
                                      const refName = student.referredBy || '';
                                      setReferredBy(refName);
                                      setReferrerContact(student.referrerContact || '');
                                      if (refName.toLowerCase() === 'none' || !refName) {
                                        setReferrerType('direct');
                                      } else {
                                        setReferrerType((student as any).referrerType || 'internal');
                                      }
                                      setActiveDropdownId(null); 
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <IndianRupee className="w-4 h-4" /> Edit Financials
                                  </button>
                                </>
                              )}

                              <div className="h-px bg-gray-100 my-1"></div>
                              <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Promote To</div>

                              <button 
                                onClick={() => { handlePromoteToFaculty(student.id); setActiveDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                              >
                                <UserIcon className="w-4 h-4" /> Faculty
                              </button>
                              
                              <button 
                                onClick={() => { handlePromoteToTelecaller(student.id); setActiveDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                              >
                                <PhoneCall className="w-4 h-4" /> Telecaller
                              </button>
                              
                               <button 
                                onClick={() => { handlePromoteToAccounts(student.id); setActiveDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                              >
                                <Calculator className="w-4 h-4" /> Accounts
                              </button>

                              <button 
                                onClick={() => { handlePromoteToQC(student.id); setActiveDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" /> QC Reviewer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 italic">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'demo' && (
          <div className="p-6">
            {/* Sub-tab Switcher */}
            <div className="flex border-b border-gray-200 mb-8">
              <button
                onClick={() => setConsultSubTab('demo-classes')}
                className={cn(
                  "py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                  consultSubTab === 'demo-classes' 
                    ? "border-pink-600 text-pink-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Video className="w-4 h-4" /> Demo Classes & CRM
              </button>
              <button
                onClick={() => setConsultSubTab('consultations')}
                className={cn(
                  "py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                  consultSubTab === 'consultations' 
                    ? "border-pink-600 text-pink-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Calendar className="w-4 h-4" /> 1-on-1 Consultation Slots & Fees (₹500 Credits)
              </button>
            </div>

            {consultSubTab === 'consultations' ? (
              <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Total Bookings</span>
                      <span className="text-2xl font-black text-gray-950">{consultationBookings.length}</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                      <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Total Revenue</span>
                      <span className="text-2xl font-black text-gray-950">₹{(consultationBookings.length * 500).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Reductions Applied</span>
                      <span className="text-2xl font-black text-emerald-600">
                        {consultationBookings.filter(b => b.feeReduced).length}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Pending Reductions</span>
                      <span className="text-2xl font-black text-amber-600">
                        {consultationBookings.filter(b => !b.feeReduced).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table list */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Career Consultations</h4>
                      <p className="text-xs text-gray-500 mt-1">Students who scheduled a demo and paid the ₹500 slot fee.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Student Info</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Focus Program</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Booked Date & Time</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Details</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Tuition Reduction Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultationBookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-gray-900">{booking.name}</div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">{booking.email}</div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5">{booking.phone}</div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                                {booking.topic || "Demo & General consultation"}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-pink-500" />
                                {booking.date}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-semibold">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                {booking.time}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-xs font-extrabold text-slate-800">₹{booking.amountPaid || 500} RS</div>
                              <div className="text-[10px] font-mono text-slate-400 mt-1">Ref: {booking.paymentId}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {booking.feeReduced ? (
                                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-sm border border-emerald-100">
                                    <CheckCircle className="w-3.5 h-3.5" /> Adjusted (Reduced ₹500)
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-extrabold flex items-center gap-1 border border-amber-100">
                                    <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Adjustment
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleFeeReduction(booking.id, !!booking.feeReduced, booking.email)}
                                  className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                    booking.feeReduced 
                                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                      : "bg-pink-600 text-white hover:bg-pink-700 shadow-md shadow-pink-100"
                                  )}
                                >
                                  {booking.feeReduced ? "Revert Adjustment" : "Apply ₹500 Reduction"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {consultationBookings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-16 text-center text-gray-400 italic">
                              No consultations booked yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Demo Classes</h3>
                  <p className="text-sm text-gray-500">Manage virtual classrooms for demo students.</p>
                </div>
                <button 
                  onClick={() => {
                    setNewSessionType('demo');
                    setShowCreateSessionModal(true);
                  }}
                  className="btn-primary flex items-center gap-2 py-2"
                >
                  <Plus className="w-4 h-4" /> Create Demo Class
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveSessions.filter(s => s.type === 'demo').map((session) => (
                  <div key={session.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-gray-900 text-lg">{session.title}</h4>
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        session.status === 'live' ? "bg-red-100 text-red-700" : 
                        session.status === 'scheduled' ? "bg-blue-100 text-blue-700" : 
                        "bg-gray-100 text-gray-700"
                      )}>
                        {session.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2 mb-6 text-sm text-gray-600 flex-1">
                      <p className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> {session.facultyName}</p>
                      {session.studentName && (
                        <p className="flex items-center gap-2"><Users className="w-4 h-4" /> {session.studentName}</p>
                      )}
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(session.scheduledFor).toLocaleString()}</p>
                      {session.recordingUrl && (
                        <div className="mt-4">
                          <div className="aspect-video bg-black rounded-xl overflow-hidden">
                            <SecureVideoPlayer url={session.recordingUrl} title="Live Session Recording" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {session.status !== 'completed' && (
                        <button 
                          onClick={async () => {
                            window.open(`/classroom/${session.roomId}`, '_blank');
                            if (session.status === 'scheduled') {
                              try {
                                await updateDoc(doc(db, 'live_sessions', session.id), { status: 'live' });
                              } catch (err) {
                                handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${session.id}`);
                              }
                            }
                          }}
                          className="flex-1 btn-primary bg-pink-50 text-pink-600 hover:bg-pink-100 flex items-center justify-center gap-2 py-2"
                        >
                          <Video className="w-4 h-4" /> {session.status === 'scheduled' ? 'Start Class' : 'Join Class'}
                        </button>
                      )}
                      {session.status === 'live' && (
                        <button 
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'live_sessions', session.id), { status: 'completed' });
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${session.id}`);
                            }
                          }}
                          className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2"
                        >
                          End Class
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setSessionToUpdateRecording(session.id);
                          setRecordingUrl(session.recordingUrl || '');
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Add/Edit Recording Link"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setSessionToDelete(session.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {liveSessions.filter(s => s.type === 'demo').length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No demo classes scheduled.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Demo Registrations</h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-semibold text-sm text-gray-500">Student</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Email</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Demo Info</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Faculty</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Status</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students
                    .filter(s => s.registeredForDemo && !s.isApproved && (!s.applicationStatus || s.applicationStatus === 'none' || s.applicationStatus === 'pending'))
                    .map((student) => (
                    <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.username}</p>
                        {student.phone && (
                          <p className="text-xs text-gray-500 mt-1">
                            <a href={`tel:${student.phone.replace(/\s+/g, '')}`} className="hover:text-pink-600 flex items-center gap-1">
                              <PhoneCall className="w-3 h-3" /> {student.phone}
                            </a>
                          </p>
                        )}
                      </td>
                      <td className="py-4 text-sm text-gray-700">{student.email}</td>
                      <td className="py-4">
                        {student.demoData ? (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-900">
                              {student.demoData.preferredDate || 'N/A'} at {student.demoData.preferredTime || 'N/A'}
                            </p>
                            <p className="text-xs font-bold text-pink-600 uppercase">
                              {student.demoData.mode === 'physical' ? 'Physical Demo' : 'Online Demo'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.demoData.qualification || 'No qualification'}
                            </p>
                            {(student.demoData.workLocation || student.demoData.currentCity) && (
                              <p className="text-xs text-gray-500">
                                {student.demoData.workLocation && `Work: ${student.demoData.workLocation}`}
                                {student.demoData.workLocation && student.demoData.currentCity && ' | '}
                                {student.demoData.currentCity && `Live: ${student.demoData.currentCity}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="py-4">
                        <select
                          value={student.assignedFacultyId || ''}
                          onChange={(e) => handleAssignFaculty(student.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="">Unassigned</option>
                          {faculty.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4">
                        {student.demoData?.completed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold">
                            <CheckCircle className="w-3 h-3" /> Demo Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                            <FileText className="w-3 h-3" /> Demo Scheduled
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setViewingApplication(student.applicationData || student.demoData || { fullName: student.name, gender: 'Male' } as any);
                              setViewingApplicationStudentId(student.id);
                              setIsEditingApplication(true);
                            }}
                            className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!student.demoData?.completed && (
                            <>
                              <button
                                onClick={() => {
                                  setReschedulingDemoStudentId(student.id);
                                  setRescheduleDate(student.demoData?.preferredDate || '');
                                  setRescheduleTime(student.demoData?.preferredTime || '');
                                }}
                                className="btn-secondary-compact"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleMarkDemoCompleted(student.id)}
                                className="btn-primary-compact bg-pink-50 text-pink-600 hover:bg-pink-100"
                              >
                                Approve Demo
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDeleteStudent(student.id)}
                            className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                            title="Delete Registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.filter(s => s.registeredForDemo && (!s.applicationStatus || s.applicationStatus === 'none' || s.applicationStatus === 'pending')).length === 0 && (
                <div className="py-12 text-center text-gray-500 italic">
                  No pending demo registrations.
                </div>
              )}
            </div>
            </>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Student Applications</h3>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-semibold text-sm text-gray-500">Student</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Email</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Application Info</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Faculty</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Status</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students
                    .filter(s => !s.isApproved && s.applicationStatus === 'submitted')
                    .map((student) => (
                    <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.username}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-700">{student.email}</td>
                      <td className="py-4">
                        {student.applicationData ? (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-900">
                              {student.applicationData.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              <a 
                                href={`tel:${(student.applicationData.mobileCountryCode || '+91').replace(/\s+/g, '')}${(student.applicationData.mobileNumber || student.applicationData.phone || '').replace(/\s+/g, '')}`}
                                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
                              >
                                {student.applicationData.mobileCountryCode || '+91'} {student.applicationData.mobileNumber || student.applicationData.phone || 'No phone'}
                              </a>
                            </p>
                            {(student.applicationData.modeOfStudy || student.applicationData.branch) && (
                              <p className="text-xs text-gray-500">
                                {student.applicationData.modeOfStudy && <span className="capitalize">{student.applicationData.modeOfStudy}</span>}
                                {student.applicationData.modeOfStudy && student.applicationData.branch && ' - '}
                                {student.applicationData.branch && <span className="font-medium text-pink-600">{student.applicationData.branch}</span>}
                              </p>
                            )}
                            {(student.applicationData.workLocation || student.applicationData.currentCity) && (
                              <p className="text-xs text-gray-500">
                                {student.applicationData.workLocation && `Work: ${student.applicationData.workLocation}`}
                                {student.applicationData.workLocation && student.applicationData.currentCity && ' | '}
                                {student.applicationData.currentCity && `Live: ${student.applicationData.currentCity}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="py-4">
                        <select
                          value={student.assignedFacultyId || ''}
                          onChange={(e) => handleAssignFaculty(student.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          <option value="">Unassigned</option>
                          {faculty.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold">
                          <Clock className="w-3 h-3" /> Submitted
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setViewingApplication(student.applicationData || { fullName: student.name, gender: 'Male', dob: '', qualification: '', university: '', graduationYear: '', experienceYears: '' } as any);
                              setViewingApplicationStudentId(student.id);
                              setIsEditingApplication(true);
                            }}
                            className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Edit Application Details"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (student.applicationData) {
                                setViewingApplication(student.applicationData);
                                setViewingApplicationStudentId(student.id);
                              }
                            }}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              student.applicationData ? "text-pink-600 hover:bg-pink-50" : "text-gray-300 cursor-not-allowed"
                            )}
                            disabled={!student.applicationData}
                            title="View Application Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAssignEntranceTest(student.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              student.entranceTestStatus === 'assigned' ? "bg-purple-100 text-purple-700" : "text-purple-600 hover:bg-purple-50"
                            )}
                            title="Assign Entrance Test"
                          >
                            <FileCheck className="w-5 h-5" />
                          </button>
                          <button
                             onClick={() => handleApprove(student.id)}
                             className="btn-primary-compact px-4 py-2"
                           >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleDeleteStudent(student.id)}
                            className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                            title="Delete Application"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.filter(s => !s.isApproved && s.applicationStatus === 'submitted').length === 0 && (
                <div className="py-12 text-center text-gray-500 italic">
                  No pending applications.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Student Submissions</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSubmissionFilter('pending')}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium", submissionFilter === 'pending' ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600")}
                >
                  Pending
                </button>
                <button
                  onClick={() => setSubmissionFilter('approved')}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium", submissionFilter === 'approved' ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600")}
                >
                  Approved
                </button>
                <button
                  onClick={() => setSubmissionFilter('rejected')}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium", submissionFilter === 'rejected' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600")}
                >
                  Rejected
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAllSubmissions().map((sub, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{sub.studentName}</h4>
                      <p className="text-xs text-gray-500 capitalize">{sub.course.replace('-', ' ')} - {sub.topic}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs font-bold rounded-full capitalize",
                      sub.type === 'video' ? "bg-purple-100 text-purple-700" :
                      sub.type === 'assignment' ? "bg-pink-100 text-pink-700" :
                      sub.type === 'worksheet' ? "bg-orange-100 text-orange-700" :
                      "bg-pink-100 text-pink-700"
                    )}>
                      {sub.type}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    {sub.fileData ? (
                      sub.type === 'video' || sub.fileData.includes('.webm') || sub.fileData.includes('.mp4') || sub.fileData.startsWith('data:video') ? (
                        <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                          <video 
                            src={sub.fileData} 
                            controls 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <a 
                          href={sub.fileData} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg text-sm font-medium text-pink-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View {sub.type} Link
                        </a>
                      )
                    ) : (
                      <div className="flex items-center justify-center w-full py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                        No link attached
                      </div>
                    )}
                  </div>
                  
                  {sub.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const maxScore = sub.type === 'video' ? 20 : (sub.type === 'assignment' ? 10 : (sub.type === 'mindMap' ? 10 : 20));
                          setGradingSubmission({
                            studentId: sub.studentId,
                            course: sub.course,
                            topic: sub.topic,
                            type: sub.type,
                            maxScore
                          });
                          setGradingMark(maxScore);
                        }}
                        className="flex-1 btn-primary-compact bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center gap-2 py-2"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleSubmissionStatus(sub.studentId, sub.course, sub.topic, sub.type, 'rejected')}
                        className="flex-1 btn-danger-compact flex items-center justify-center gap-2 py-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {getAllSubmissions().length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No {submissionFilter} submissions found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Module Video Management</h3>
                <p className="text-sm text-gray-500">Update training videos for each course module.</p>
              </div>
              <div className="flex items-center gap-4">
                <select 
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value as any)}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500 transition-all shadow-sm"
                >
                  <option value="all">All Courses</option>
                  {courseModules.map((c) => (
                    <option key={c.id} value={c.id}>{c.title?.replace('Diploma in ', '') || c.id}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setIsAddingModule(true)}
                  className="btn-primary flex items-center gap-2 py-2 px-4 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add New Module
                </button>
              </div>
            </div>

            <div className="space-y-12">
              {courseModules
                .filter(course => moduleFilter === 'all' || moduleFilter === course.id)
                .map((course) => {
                  const catModules = allRegisteredModules.filter(m => m.category === course.id);
                  const headingColors: Record<string, string> = {
                    'production-art-engineer': 'text-pink-600',
                    'print-ready-engineer': 'text-orange-600',
                    'quality-control-engineer': 'text-purple-600',
                    'packaging-engineer': 'text-blue-600',
                    'plate-ready-engineer': 'text-green-600',
                    'colour-retouching-engineer': 'text-indigo-600',
                    'printing-and-packaging-cross-courses': 'text-teal-600'
                  };
                  const headingColorClass = headingColors[course.id] || 'text-pink-600';
                  
                  return (
                    <div key={course.id} className="border-b border-gray-100 pb-8 last:border-b-0 last:pb-0">
                      <h4 className={`text-base font-bold ${headingColorClass} uppercase tracking-wider mb-4`}>
                        {course.title}
                      </h4>
                      {catModules.length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                          No modules created under this course category yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {catModules.map((module) => (
                            <div key={module.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                              <div className="aspect-video bg-black rounded-xl mb-4 overflow-hidden relative group">
                                <SecureVideoPlayer url={module.videoUrl} videoUrls={module.videoUrls} title={module.title} thumbnailUrl={module.thumbnailUrl} />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 py-3">
                                  <button 
                                    onClick={() => handleModuleFileUpload(module.id, 'thumbnailUrl')}
                                    className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="Set Video Thumbnail URL"
                                  >
                                    <Image className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleModuleFileUpload(module.id, 'assignmentPaperUrl')}
                                    className="p-2 bg-white text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
                                    title="Set Assignment Paper URL"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleModuleFileUpload(module.id, 'mindMapUrl')}
                                    className="p-2 bg-white text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
                                    title="Set Mind Map URL"
                                  >
                                    <Map className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleModuleFileUpload(module.id, 'worksheetUrl')}
                                    className="p-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                                    title="Set Worksheet URL"
                                  >
                                    <FileSpreadsheet className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleModuleFileUpload(module.id, 'referenceMaterialUrl')}
                                    className="p-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                                    title="Set Reference Material URL"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleModuleFileUpload(module.id, 'slidesUrl')}
                                    className="p-2 bg-white text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
                                    title="Set PowerPoint slides URL"
                                  >
                                    <Layers className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingModule({ course: course.id as any, module })}
                                    className="p-2 bg-white text-gray-900 rounded-lg hover:bg-pink-50 transition-colors"
                                    title="Edit Details"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteModule(module.id)}
                                    className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <h5 className="font-bold text-gray-900 text-sm mb-1">
                                {module.title}
                              </h5>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{module.description}</p>
                              <div className="flex items-center gap-2 text-xs font-medium text-pink-600 bg-pink-50 w-fit px-2 py-1 rounded-md">
                                <HelpCircle className="w-3 h-3" />
                                {module.quizQuestions?.length || 0} Quiz Questions
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {editingModule && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                  <button 
                    onClick={() => setEditingModule(null)}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Module Details</h3>
                  <form onSubmit={handleUpdateModule} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Add New Module &gt; Course Category</label>
                      <select 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={editingModule.module.category}
                        onChange={(e) => setEditingModule({
                          ...editingModule,
                          module: { ...editingModule.module, category: e.target.value as any }
                        })}
                      >
                        {courseModules.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Module Title</label>
                        <input 
                          type="text"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                          value={editingModule.module.title}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, title: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sequence / Order</label>
                        <input 
                          type="number"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                          value={editingModule.module.order || ''}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, order: Number(e.target.value) }
                          })}
                          placeholder="e.g. 1"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Duration</label>
                        <input 
                          type="text"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                          value={editingModule.module.duration}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, duration: e.target.value }
                          })}
                          placeholder="e.g. 15:30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                      <textarea 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 h-24"
                        value={editingModule.module.description}
                        onChange={(e) => setEditingModule({
                          ...editingModule,
                          module: { ...editingModule.module, description: e.target.value }
                        })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Video URLs (Bilingual Support)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['english', 'tamil', 'kannada', 'malayalam', 'telugu', 'hindi'].map((lang) => (
                            <div key={lang}>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{lang}</label>
                              <input 
                                type="text"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                                value={lang === 'english' ? (editingModule.module.videoUrls?.english || editingModule.module.videoUrl || '') : (editingModule.module.videoUrls?.[lang] || '')}
                                onChange={(e) => {
                                  const updatedUrls = { ...(editingModule.module.videoUrls || {}) };
                                  updatedUrls[lang] = e.target.value;
                                  setEditingModule({
                                    ...editingModule,
                                    module: { 
                                      ...editingModule.module, 
                                      videoUrls: updatedUrls,
                                      // Keep videoUrl synced with english for backward compatibility
                                      ...(lang === 'english' ? { videoUrl: e.target.value } : {})
                                    }
                                  });
                                }}
                                placeholder={`URL for ${lang}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assignment Paper URL</label>
                        <input 
                          type="text"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                          value={editingModule.module.assignmentPaperUrl || ''}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, assignmentPaperUrl: e.target.value }
                          })}
                          placeholder="URL to PDF or document"
                        />
                        <FileUploader 
                          path="course_modules/assignment_papers"
                          accept=".pdf,.doc,.docx"
                          onUploadComplete={(url) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, assignmentPaperUrl: url }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Video Thumbnail (Optional)</label>
                        <input 
                          type="text"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2 text-sm"
                          value={editingModule.module.thumbnailUrl || ''}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, thumbnailUrl: e.target.value }
                          })}
                          placeholder="URL to custom video thumbnail image"
                        />
                        <FileUploader 
                          path="course_modules/thumbnails"
                          accept="image/*"
                          onUploadComplete={(url) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, thumbnailUrl: url }
                          })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mind Map URL</label>
                        <input 
                          type="text"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                          value={editingModule.module.mindMapUrl || ''}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, mindMapUrl: e.target.value }
                          })}
                          placeholder="URL to Mind Map image/PDF"
                        />
                        <FileUploader 
                          path="course_modules/mind_maps"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onUploadComplete={(url) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, mindMapUrl: url }
                          })}
                        />
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-3">Mind Map Evaluation Criteria</label>
                        <textarea 
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 min-h-[80px] text-sm"
                          value={editingModule.module.mindMapExpectedCriteria || ''}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, mindMapExpectedCriteria: e.target.value }
                          })}
                          placeholder="Points the AI should check in the student's mind map..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Worksheet URL</label>
                        <input 
                          type="text"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                          value={editingModule.module.worksheetUrl || ''}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, worksheetUrl: e.target.value }
                          })}
                          placeholder="URL to Worksheet PDF/Doc"
                        />
                        <FileUploader 
                          path="course_modules/worksheets"
                          accept=".pdf,.doc,.docx"
                          onUploadComplete={(url) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, worksheetUrl: url }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reference Material URL</label>
                        <input 
                          type="text"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                          value={editingModule.module.referenceMaterialUrl || ''}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, referenceMaterialUrl: e.target.value }
                          })}
                          placeholder="URL to Reference Material (e.g., Adobe InDesign embed)"
                        />
                        <FileUploader 
                          path="course_modules/reference_materials"
                          accept=".pdf,.doc,.docx"
                          onUploadComplete={(url) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, referenceMaterialUrl: url }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">PowerPoint Slides / Presentation URL (.pptx/PDF)</label>
                        <input 
                          type="text"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                          value={editingModule.module.slidesUrl || ''}
                          onChange={(e) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, slidesUrl: e.target.value }
                          })}
                          placeholder="URL to PowerPoint / Google Slides / PDF Slides"
                        />
                        <FileUploader 
                          path="course_modules/slides"
                          accept=".pdf,.pptx,.ppt"
                          onUploadComplete={(url) => setEditingModule({
                            ...editingModule,
                            module: { ...editingModule.module, slidesUrl: url }
                          })}
                        />
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Reference Materials</label>
                          <button
                            type="button"
                            onClick={() => {
                              const newRefs = [...(editingModule.module.additionalReferenceMaterials || []), { title: '', url: '' }];
                              setEditingModule({
                                ...editingModule,
                                module: { ...editingModule.module, additionalReferenceMaterials: newRefs }
                              });
                            }}
                            className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Material
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(editingModule.module.additionalReferenceMaterials || []).map((ref, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  placeholder="Title (e.g., Typography Guide)"
                                  className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                                  value={ref.title}
                                  onChange={(e) => {
                                    const newRefs = [...(editingModule.module.additionalReferenceMaterials || [])];
                                    newRefs[idx].title = e.target.value;
                                    setEditingModule({
                                      ...editingModule,
                                      module: { ...editingModule.module, additionalReferenceMaterials: newRefs }
                                    });
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="URL"
                                  className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                                  value={ref.url}
                                  onChange={(e) => {
                                    const newRefs = [...(editingModule.module.additionalReferenceMaterials || [])];
                                    newRefs[idx].url = e.target.value;
                                    setEditingModule({
                                      ...editingModule,
                                      module: { ...editingModule.module, additionalReferenceMaterials: newRefs }
                                    });
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newRefs = (editingModule.module.additionalReferenceMaterials || []).filter((_, i) => i !== idx);
                                  setEditingModule({
                                    ...editingModule,
                                    module: { ...editingModule.module, additionalReferenceMaterials: newRefs }
                                  });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 space-y-8">
                      {/* QUIZ SECTION */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-pink-600" />
                            Module Quiz Questions (Interactive)
                          </h4>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                const csvContent = "Question,Option1,Option2,Option3,Option4,CorrectIndex(0-3),Type(multiple-choice/true-false)\nWhat is CMYK?,Color Model,Printing Machine,Paper Type,Software,0,multiple-choice\nIs RGB used for print?,True,False,,,1,true-false";
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'quiz_template.csv';
                                a.click();
                              }}
                              className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg"
                            >
                              <Download className="w-3 h-3" /> Template
                            </button>
                            <label className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 px-2 py-1 bg-pink-50 rounded-lg cursor-pointer">
                              <Upload className="w-3 h-3" /> Upload CSV
                              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleModuleQuizUpload(e, 'quizQuestions')} />
                            </label>
                            <button 
                              type="button"
                              onClick={() => {
                                const newQuestions = [...(editingModule.module.quizQuestions || [])];
                                newQuestions.push({
                                  id: Math.random().toString(36).substr(2, 9),
                                  question: '',
                                  options: ['', '', '', ''],
                                  correctAnswer: 0
                                });
                                setEditingModule({
                                  ...editingModule,
                                  module: { ...editingModule.module, quizQuestions: newQuestions }
                                });
                              }}
                              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 px-2 py-1 bg-pink-50 rounded-lg"
                            >
                              <Plus className="w-3 h-3" /> Add Question
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          {(editingModule.module.quizQuestions || []).map((q, qIdx) => (
                            <div key={q.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 relative">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newQuestions = editingModule.module.quizQuestions?.filter((_, i) => i !== qIdx);
                                  setEditingModule({
                                    ...editingModule,
                                    module: { ...editingModule.module, quizQuestions: newQuestions }
                                  });
                                }}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Enter quiz question..."
                                    className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium"
                                    value={q.question}
                                    onChange={(e) => {
                                      const newQuestions = [...(editingModule.module.quizQuestions || [])];
                                      newQuestions[qIdx].question = e.target.value;
                                      setEditingModule({
                                        ...editingModule,
                                        module: { ...editingModule.module, quizQuestions: newQuestions }
                                      });
                                    }}
                                  />
                                  <select
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium cursor-pointer"
                                    value={q.type || 'multiple-choice'}
                                    onChange={(e) => {
                                      const newQuestions = [...(editingModule.module.quizQuestions || [])];
                                      const newType = e.target.value as 'multiple-choice' | 'true-false' | 'descriptive';
                                      newQuestions[qIdx].type = newType;
                                      
                                      if (newType === 'true-false') {
                                        newQuestions[qIdx].options = ['True', 'False'];
                                        if (newQuestions[qIdx].correctAnswer > 1) {
                                          newQuestions[qIdx].correctAnswer = 0;
                                        }
                                      } else if (newType === 'multiple-choice') {
                                        if ((newQuestions[qIdx].options?.length || 0) < 4) {
                                          newQuestions[qIdx].options = [...(newQuestions[qIdx].options || []), '', '', '', ''].slice(0, 4);
                                        }
                                      }
                                      
                                      setEditingModule({
                                        ...editingModule,
                                        module: { ...editingModule.module, quizQuestions: newQuestions }
                                      });
                                    }}
                                  >
                                    <option value="multiple-choice">Multiple Choice</option>
                                    <option value="true-false">True/False</option>
                                    <option value="descriptive">Descriptive</option>
                                  </select>
                                </div>

                                {(!q.type || q.type === 'multiple-choice') && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input 
                                          type="radio"
                                          name={`quiz-correct-${q.id}`}
                                          checked={q.correctAnswer === oIdx}
                                          onChange={() => {
                                            const newQuestions = [...(editingModule.module.quizQuestions || [])];
                                            newQuestions[qIdx].correctAnswer = oIdx;
                                            setEditingModule({
                                              ...editingModule,
                                              module: { ...editingModule.module, quizQuestions: newQuestions }
                                            });
                                          }}
                                        />
                                        <input 
                                          type="text"
                                          placeholder={`Option ${oIdx + 1}`}
                                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                                          value={opt}
                                          onChange={(e) => {
                                            const newQuestions = [...(editingModule.module.quizQuestions || [])];
                                            newQuestions[qIdx].options[oIdx] = e.target.value;
                                            setEditingModule({
                                              ...editingModule,
                                              module: { ...editingModule.module, quizQuestions: newQuestions }
                                            });
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'true-false' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.slice(0, 2).map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input 
                                          type="radio"
                                          name={`quiz-correct-${q.id}`}
                                          checked={q.correctAnswer === oIdx}
                                          onChange={() => {
                                            const newQuestions = [...(editingModule.module.quizQuestions || [])];
                                            newQuestions[qIdx].correctAnswer = oIdx;
                                            setEditingModule({
                                              ...editingModule,
                                              module: { ...editingModule.module, quizQuestions: newQuestions }
                                            });
                                          }}
                                        />
                                        <span className="text-sm font-medium">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'descriptive' && (
                                  <div>
                                    <textarea
                                      placeholder="Enter the correct answer key for AI evaluation..."
                                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm min-h-[80px] resize-none"
                                      value={q.answerKey || ''}
                                      onChange={(e) => {
                                        const newQuestions = [...(editingModule.module.quizQuestions || [])];
                                        newQuestions[qIdx].answerKey = e.target.value;
                                        setEditingModule({
                                          ...editingModule,
                                          module: { ...editingModule.module, quizQuestions: newQuestions }
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ONLINE TEST SECTION */}
                      <div className="space-y-4 pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-orange-600" />
                            Online Test Questions (Final Test)
                          </h4>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                const csvContent = "Question,Option1,Option2,Option3,Option4,CorrectIndex(0-3),Type(multiple-choice/true-false)\nFinal Test Q1?,Choice 1,Choice 2,Choice 3,Choice 4,0,multiple-choice";
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'online_test_template.csv';
                                a.click();
                              }}
                              className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg"
                            >
                              <Download className="w-3 h-3" /> Template
                            </button>
                            <label className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg cursor-pointer">
                              <Upload className="w-3 h-3" /> Upload CSV
                              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleModuleQuizUpload(e, 'onlineTestQuestions')} />
                            </label>
                            <button 
                              type="button"
                              onClick={() => {
                                const newQuestions = [...(editingModule.module.onlineTestQuestions || [])];
                                newQuestions.push({
                                  id: Math.random().toString(36).substr(2, 9),
                                  question: '',
                                  options: ['', '', '', ''],
                                  correctAnswer: 0
                                });
                                setEditingModule({
                                  ...editingModule,
                                  module: { ...editingModule.module, onlineTestQuestions: newQuestions }
                                });
                              }}
                              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg"
                            >
                              <Plus className="w-3 h-3" /> Add Test Question
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          {(editingModule.module.onlineTestQuestions || []).map((q, qIdx) => (
                            <div key={q.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 relative">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newQuestions = editingModule.module.onlineTestQuestions?.filter((_, i) => i !== qIdx);
                                  setEditingModule({
                                    ...editingModule,
                                    module: { ...editingModule.module, onlineTestQuestions: newQuestions }
                                  });
                                }}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Enter test question..."
                                    className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium"
                                    value={q.question}
                                    onChange={(e) => {
                                      const newQuestions = [...(editingModule.module.onlineTestQuestions || [])];
                                      newQuestions[qIdx].question = e.target.value;
                                      setEditingModule({
                                        ...editingModule,
                                        module: { ...editingModule.module, onlineTestQuestions: newQuestions }
                                      });
                                    }}
                                  />
                                  <select
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium cursor-pointer"
                                    value={q.type || 'multiple-choice'}
                                    onChange={(e) => {
                                      const newQuestions = [...(editingModule.module.onlineTestQuestions || [])];
                                      const newType = e.target.value as 'multiple-choice' | 'true-false' | 'descriptive';
                                      newQuestions[qIdx].type = newType;
                                      
                                      if (newType === 'true-false') {
                                        newQuestions[qIdx].options = ['True', 'False'];
                                        if (newQuestions[qIdx].correctAnswer > 1) {
                                          newQuestions[qIdx].correctAnswer = 0;
                                        }
                                      } else if (newType === 'multiple-choice') {
                                        if ((newQuestions[qIdx].options?.length || 0) < 4) {
                                          newQuestions[qIdx].options = [...(newQuestions[qIdx].options || []), '', '', '', ''].slice(0, 4);
                                        }
                                      }
                                      
                                      setEditingModule({
                                        ...editingModule,
                                        module: { ...editingModule.module, onlineTestQuestions: newQuestions }
                                      });
                                    }}
                                  >
                                    <option value="multiple-choice">Multiple Choice</option>
                                    <option value="true-false">True/False</option>
                                    <option value="descriptive">Descriptive</option>
                                  </select>
                                </div>

                                {(!q.type || q.type === 'multiple-choice') && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input 
                                          type="radio"
                                          name={`test-correct-${q.id}`}
                                          checked={q.correctAnswer === oIdx}
                                          onChange={() => {
                                            const newQuestions = [...(editingModule.module.onlineTestQuestions || [])];
                                            newQuestions[qIdx].correctAnswer = oIdx;
                                            setEditingModule({
                                              ...editingModule,
                                              module: { ...editingModule.module, onlineTestQuestions: newQuestions }
                                            });
                                          }}
                                        />
                                        <input 
                                          type="text"
                                          placeholder={`Option ${oIdx + 1}`}
                                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                                          value={opt}
                                          onChange={(e) => {
                                            const newQuestions = [...(editingModule.module.onlineTestQuestions || [])];
                                            newQuestions[qIdx].options[oIdx] = e.target.value;
                                            setEditingModule({
                                              ...editingModule,
                                              module: { ...editingModule.module, onlineTestQuestions: newQuestions }
                                            });
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'true-false' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.slice(0, 2).map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input 
                                          type="radio"
                                          name={`test-correct-${q.id}`}
                                          checked={q.correctAnswer === oIdx}
                                          onChange={() => {
                                            const newQuestions = [...(editingModule.module.onlineTestQuestions || [])];
                                            newQuestions[qIdx].correctAnswer = oIdx;
                                            setEditingModule({
                                              ...editingModule,
                                              module: { ...editingModule.module, onlineTestQuestions: newQuestions }
                                            });
                                          }}
                                        />
                                        <span className="text-sm font-medium">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'descriptive' && (
                                  <div>
                                    <textarea
                                      placeholder="Enter the correct answer key for AI evaluation..."
                                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm min-h-[80px] resize-none"
                                      value={q.answerKey || ''}
                                      onChange={(e) => {
                                        const newQuestions = [...(editingModule.module.onlineTestQuestions || [])];
                                        newQuestions[qIdx].answerKey = e.target.value;
                                        setEditingModule({
                                          ...editingModule,
                                          module: { ...editingModule.module, onlineTestQuestions: newQuestions }
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="w-full btn-primary py-3">
                      Save Changes
                    </button>
                  </form>
                </div>
              </div>
            )}

            {isAddingModule && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                  <button 
                    onClick={() => setIsAddingModule(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Module</h3>
                  <form onSubmit={handleCreateModule} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Add New Module &gt; Course Category</label>
                      <select 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={newModuleData.category}
                        onChange={(e) => setNewModuleData({ ...newModuleData, category: e.target.value as CourseType })}
                      >
                        {courseModules.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Module Title</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={newModuleData.title}
                        onChange={(e) => setNewModuleData({ ...newModuleData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sequence / Order (e.g. 1, 2... for student progression)</label>
                      <input 
                        type="number"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={newModuleData.order || ''}
                        onChange={(e) => setNewModuleData({ ...newModuleData, order: Number(e.target.value) })}
                        placeholder="e.g. 1"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                      <textarea 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 h-24"
                        value={newModuleData.description}
                        onChange={(e) => setNewModuleData({ ...newModuleData, description: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Duration</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={newModuleData.duration}
                        onChange={(e) => setNewModuleData({ ...newModuleData, duration: e.target.value })}
                        placeholder="e.g. 15:30"
                        required
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Video URLs (Bilingual Support)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['english', 'tamil', 'kannada', 'malayalam', 'telugu', 'hindi'].map((lang) => (
                          <div key={lang}>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{lang}</label>
                            <input 
                              type="text"
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                              value={lang === 'english' ? (newModuleData.videoUrls?.english || newModuleData.videoUrl || '') : (newModuleData.videoUrls?.[lang] || '')}
                              onChange={(e) => {
                                const updatedUrls = { ...(newModuleData.videoUrls || {}) };
                                updatedUrls[lang] = e.target.value;
                                setNewModuleData({
                                  ...newModuleData,
                                  videoUrls: updatedUrls,
                                  ...(lang === 'english' ? { videoUrl: e.target.value } : {})
                                });
                              }}
                              placeholder={`URL for ${lang}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assignment Paper URL</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                        value={newModuleData.assignmentPaperUrl}
                        onChange={(e) => setNewModuleData({ ...newModuleData, assignmentPaperUrl: e.target.value })}
                        placeholder="URL to PDF or document"
                      />
                      <FileUploader 
                        path="course_modules/assignment_papers"
                        accept=".pdf,.doc,.docx"
                        onUploadComplete={(url) => setNewModuleData({ ...newModuleData, assignmentPaperUrl: url })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mind Map URL</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                        value={newModuleData.mindMapUrl}
                        onChange={(e) => setNewModuleData({ ...newModuleData, mindMapUrl: e.target.value })}
                        placeholder="URL to Mind Map image/PDF"
                      />
                      <FileUploader 
                        path="course_modules/mind_maps"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onUploadComplete={(url) => setNewModuleData({ ...newModuleData, mindMapUrl: url })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Worksheet URL</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                        value={newModuleData.worksheetUrl}
                        onChange={(e) => setNewModuleData({ ...newModuleData, worksheetUrl: e.target.value })}
                        placeholder="URL to Worksheet"
                      />
                      <FileUploader 
                        path="course_modules/worksheets"
                        accept=".pdf,.doc,.docx"
                        onUploadComplete={(url) => setNewModuleData({ ...newModuleData, worksheetUrl: url })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reference Material URL</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                        value={newModuleData.referenceMaterialUrl || ''}
                        onChange={(e) => setNewModuleData({ ...newModuleData, referenceMaterialUrl: e.target.value })}
                        placeholder="URL to Reference Material (e.g., Adobe InDesign embed)"
                      />
                      <FileUploader 
                        path="course_modules/reference_materials"
                        accept=".pdf,.doc,.docx"
                        onUploadComplete={(url) => setNewModuleData({ ...newModuleData, referenceMaterialUrl: url })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">PowerPoint Slides / Presentation URL (.pptx/PDF)</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2"
                        value={newModuleData.slidesUrl || ''}
                        onChange={(e) => setNewModuleData({ ...newModuleData, slidesUrl: e.target.value })}
                        placeholder="URL to PowerPoint / Google Slides / PDF Slides"
                      />
                      <FileUploader 
                        path="course_modules/slides"
                        accept=".pdf,.pptx,.ppt"
                        onUploadComplete={(url) => setNewModuleData({ ...newModuleData, slidesUrl: url })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Video Thumbnail (Optional)</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 mb-2 text-sm"
                        value={newModuleData.thumbnailUrl || ''}
                        onChange={(e) => setNewModuleData({ ...newModuleData, thumbnailUrl: e.target.value })}
                        placeholder="URL to custom video thumbnail image"
                      />
                      <FileUploader 
                        path="course_modules/thumbnails"
                        accept="image/*"
                        onUploadComplete={(url) => setNewModuleData({ ...newModuleData, thumbnailUrl: url })}
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 space-y-8">
                      {/* QUIZ SECTION */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-pink-600" />
                            Module Quiz Questions (Interactive)
                          </h4>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                const csvContent = "Question,Option1,Option2,Option3,Option4,CorrectIndex(0-3),Type(multiple-choice/true-false)\nWhat is CMYK?,Color Model,Printing Machine,Paper Type,Software,0,multiple-choice\nIs RGB used for print?,True,False,,,1,true-false";
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'quiz_template.csv';
                                a.click();
                              }}
                              className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg"
                            >
                              <Download className="w-3 h-3" /> Template
                            </button>
                            <label className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 px-2 py-1 bg-pink-50 rounded-lg cursor-pointer">
                              <Upload className="w-3 h-3" /> Upload CSV
                              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleModuleQuizUpload(e, 'quizQuestions')} />
                            </label>
                            <button 
                              type="button"
                              onClick={() => {
                                const newQuestions = [...(newModuleData.quizQuestions || [])];
                                newQuestions.push({
                                  id: Math.random().toString(36).substr(2, 9),
                                  question: '',
                                  options: ['', '', '', ''],
                                  correctAnswer: 0
                                });
                                setNewModuleData({ ...newModuleData, quizQuestions: newQuestions });
                              }}
                              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 px-2 py-1 bg-pink-50 rounded-lg"
                            >
                              <Plus className="w-3 h-3" /> Add Question
                            </button>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {(newModuleData.quizQuestions || []).map((q, qIdx) => (
                            <div key={q.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 relative">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newQuestions = newModuleData.quizQuestions.filter((_, i) => i !== qIdx);
                                  setNewModuleData({ ...newModuleData, quizQuestions: newQuestions });
                                }}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Enter question..."
                                    className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium"
                                    value={q.question}
                                    onChange={(e) => {
                                      const newQuestions = [...newModuleData.quizQuestions];
                                      newQuestions[qIdx].question = e.target.value;
                                      setNewModuleData({ ...newModuleData, quizQuestions: newQuestions });
                                    }}
                                  />
                                  <select
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium cursor-pointer"
                                    value={q.type || 'multiple-choice'}
                                    onChange={(e) => {
                                      const newQuestions = [...newModuleData.quizQuestions];
                                      const newType = e.target.value as 'multiple-choice' | 'true-false' | 'descriptive';
                                      newQuestions[qIdx].type = newType;
                                      if (newType === 'true-false') {
                                        newQuestions[qIdx].options = ['True', 'False'];
                                        if (newQuestions[qIdx].correctAnswer > 1) newQuestions[qIdx].correctAnswer = 0;
                                      } else if (newType === 'multiple-choice') {
                                        if (newQuestions[qIdx].options.length < 4) {
                                          newQuestions[qIdx].options = [...newQuestions[qIdx].options, '', '', '', ''].slice(0, 4);
                                        }
                                      }
                                      setNewModuleData({ ...newModuleData, quizQuestions: newQuestions });
                                    }}
                                  >
                                    <option value="multiple-choice">Multiple Choice</option>
                                    <option value="true-false">True/False</option>
                                    <option value="descriptive">Descriptive</option>
                                  </select>
                                </div>

                                {(!q.type || q.type === 'multiple-choice') && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input 
                                          type="radio"
                                          name={`new-quiz-correct-${q.id}`}
                                          checked={q.correctAnswer === oIdx}
                                          onChange={() => {
                                            const newQuestions = [...newModuleData.quizQuestions];
                                            newQuestions[qIdx].correctAnswer = oIdx;
                                            setNewModuleData({ ...newModuleData, quizQuestions: newQuestions });
                                          }}
                                        />
                                        <input 
                                          type="text"
                                          placeholder={`Option ${oIdx + 1}`}
                                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                                          value={opt}
                                          onChange={(e) => {
                                            const newQuestions = [...newModuleData.quizQuestions];
                                            newQuestions[qIdx].options[oIdx] = e.target.value;
                                            setNewModuleData({ ...newModuleData, quizQuestions: newQuestions });
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'true-false' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.slice(0, 2).map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input 
                                          type="radio"
                                          name={`new-quiz-correct-${q.id}`}
                                          checked={q.correctAnswer === oIdx}
                                          onChange={() => {
                                            const newQuestions = [...newModuleData.quizQuestions];
                                            newQuestions[qIdx].correctAnswer = oIdx;
                                            setNewModuleData({ ...newModuleData, quizQuestions: newQuestions });
                                          }}
                                        />
                                        <span className="text-sm font-medium">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'descriptive' && (
                                  <div>
                                    <textarea
                                      placeholder="Enter the correct answer key for AI evaluation..."
                                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm min-h-[80px] resize-none"
                                      value={q.answerKey || ''}
                                      onChange={(e) => {
                                        const newQuestions = [...newModuleData.quizQuestions];
                                        newQuestions[qIdx].answerKey = e.target.value;
                                        setNewModuleData({ ...newModuleData, quizQuestions: newQuestions });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ONLINE TEST SECTION */}
                      <div className="space-y-4 pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-orange-600" />
                            Online Test Questions (Final Test)
                          </h4>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                const csvContent = "Question,Option1,Option2,Option3,Option4,CorrectIndex(0-3),Type(multiple-choice/true-false)\nFinal Test Q1?,Choice 1,Choice 2,Choice 3,Choice 4,0,multiple-choice";
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'online_test_template.csv';
                                a.click();
                              }}
                              className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg"
                            >
                              <Download className="w-3 h-3" /> Template
                            </button>
                            <label className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg cursor-pointer">
                              <Upload className="w-3 h-3" /> Upload CSV
                              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleModuleQuizUpload(e, 'onlineTestQuestions')} />
                            </label>
                            <button 
                              type="button"
                              onClick={() => {
                                const newQuestions = [...(newModuleData.onlineTestQuestions || [])];
                                newQuestions.push({
                                  id: Math.random().toString(36).substr(2, 9),
                                  question: '',
                                  options: ['', '', '', ''],
                                  correctAnswer: 0
                                });
                                setNewModuleData({ ...newModuleData, onlineTestQuestions: newQuestions });
                              }}
                              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg"
                            >
                              <Plus className="w-3 h-3" /> Add Test Question
                            </button>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {(newModuleData.onlineTestQuestions || []).map((q, qIdx) => (
                            <div key={q.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 relative">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newQuestions = newModuleData.onlineTestQuestions.filter((_, i) => i !== qIdx);
                                  setNewModuleData({ ...newModuleData, onlineTestQuestions: newQuestions });
                                }}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Enter test question..."
                                    className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium"
                                    value={q.question}
                                    onChange={(e) => {
                                      const newQuestions = [...newModuleData.onlineTestQuestions];
                                      newQuestions[qIdx].question = e.target.value;
                                      setNewModuleData({ ...newModuleData, onlineTestQuestions: newQuestions });
                                    }}
                                  />
                                  <select
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-sm font-medium cursor-pointer"
                                    value={q.type || 'multiple-choice'}
                                    onChange={(e) => {
                                      const newQuestions = [...newModuleData.onlineTestQuestions];
                                      const newType = e.target.value as 'multiple-choice' | 'true-false' | 'descriptive';
                                      newQuestions[qIdx].type = newType;
                                      if (newType === 'true-false') {
                                        newQuestions[qIdx].options = ['True', 'False'];
                                        if (newQuestions[qIdx].correctAnswer > 1) newQuestions[qIdx].correctAnswer = 0;
                                      } else if (newType === 'multiple-choice') {
                                        if (newQuestions[qIdx].options.length < 4) {
                                          newQuestions[qIdx].options = [...newQuestions[qIdx].options, '', '', '', ''].slice(0, 4);
                                        }
                                      }
                                      setNewModuleData({ ...newModuleData, onlineTestQuestions: newQuestions });
                                    }}
                                  >
                                    <option value="multiple-choice">Multiple Choice</option>
                                    <option value="true-false">True/False</option>
                                    <option value="descriptive">Descriptive</option>
                                  </select>
                                </div>

                                {(!q.type || q.type === 'multiple-choice') && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input 
                                          type="radio"
                                          name={`new-test-correct-${q.id}`}
                                          checked={q.correctAnswer === oIdx}
                                          onChange={() => {
                                            const newQuestions = [...newModuleData.onlineTestQuestions];
                                            newQuestions[qIdx].correctAnswer = oIdx;
                                            setNewModuleData({ ...newModuleData, onlineTestQuestions: newQuestions });
                                          }}
                                        />
                                        <input 
                                          type="text"
                                          placeholder={`Option ${oIdx + 1}`}
                                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                                          value={opt}
                                          onChange={(e) => {
                                            const newQuestions = [...newModuleData.onlineTestQuestions];
                                            newQuestions[qIdx].options[oIdx] = e.target.value;
                                            setNewModuleData({ ...newModuleData, onlineTestQuestions: newQuestions });
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'true-false' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {q.options.slice(0, 2).map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input 
                                          type="radio"
                                          name={`new-test-correct-${q.id}`}
                                          checked={q.correctAnswer === oIdx}
                                          onChange={() => {
                                            const newQuestions = [...newModuleData.onlineTestQuestions];
                                            newQuestions[qIdx].correctAnswer = oIdx;
                                            setNewModuleData({ ...newModuleData, onlineTestQuestions: newQuestions });
                                          }}
                                        />
                                        <span className="text-sm font-medium">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'descriptive' && (
                                  <div>
                                    <textarea
                                      placeholder="Enter the correct answer key for AI evaluation..."
                                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm min-h-[80px] resize-none"
                                      value={q.answerKey || ''}
                                      onChange={(e) => {
                                        const newQuestions = [...newModuleData.onlineTestQuestions];
                                        newQuestions[qIdx].answerKey = e.target.value;
                                        setNewModuleData({ ...newModuleData, onlineTestQuestions: newQuestions });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button type="submit" className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors">
                        Create Module
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="p-6">
            <QueryTracker />
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Student Marks Management</h3>
                <p className="text-sm text-gray-500">Update worksheet, project, and attendance marks for live classes.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  <Clock className="w-4 h-4" /> Download Template
                </button>
                <label className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" /> Upload CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleBulkUploadMarks} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Student</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                  value={selectedStudentForMarks || ''}
                  onChange={(e) => setSelectedStudentForMarks(e.target.value)}
                >
                  <option value="">Choose a student...</option>
                  {students
                    .filter(s => s.isApproved)
                    .map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Course</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                  value={selectedCourseForMarks}
                  onChange={(e) => setSelectedCourseForMarks(e.target.value as CourseType)}
                >
                  <option value="packaging-engineer">{formatCourseName('packaging-engineer')}</option>
                  <option value="production-art-engineer">{formatCourseName('production-art-engineer')}</option>
                  <option value="print-ready-engineer">{formatCourseName('print-ready-engineer')}</option>
                  <option value="plate-ready-engineer">{formatCourseName('plate-ready-engineer')}</option>
                  <option value="colour-retouching-engineer">{formatCourseName('colour-retouching-engineer')}</option>
                  <option value="quality-control-engineer">{formatCourseName('quality-control-engineer')}</option>
                  <option value="printing-and-packaging-cross-courses">{formatCourseName('printing-and-packaging-cross-courses')}</option>
                </select>
              </div>
            </div>

            {selectedStudentForMarks ? (
              <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1 pb-4">
                  <table className="w-full text-left whitespace-nowrap min-w-[1200px]">
                    <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#f1f5f9]">Topic</th>
                        <th className="px-4 py-3 text-center">Assignment (10)</th>
                        <th className="px-4 py-3 text-center">Video (20)</th>
                        <th className="px-4 py-3 text-center">Work Sheet (20)</th>
                        <th className="px-4 py-3 text-center">Project (20)</th>
                        <th className="px-4 py-3 text-center">Mind Map (10)</th>
                        <th className="px-4 py-3 text-center">Quiz (10)</th>
                        <th className="px-4 py-3 text-center">Online Test (20)</th>
                        <th className="px-4 py-3 text-center">Attendance (10)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(selectedCourseForMarks === 'production-art-engineer' ? productionArtEngineerTopics : (selectedCourseForMarks === 'print-ready-engineer' ? printReadyEngineerTopics : (selectedCourseForMarks === 'packaging-engineer' ? packagingEngineerTopics : (selectedCourseForMarks === 'plate-ready-engineer' ? plateReadyEngineerTopics : (selectedCourseForMarks === 'colour-retouching-engineer' ? colourRetouchingEngineerTopics : (selectedCourseForMarks === 'printing-and-packaging-cross-courses' ? printingAndPackagingTopics : qualityControlEngineerTopics)))))).map(topic => {
                        const student = students.find(s => s.id === selectedStudentForMarks);
                        const scores = student?.scores?.[getScoreKey(selectedCourseForMarks) as keyof typeof student.scores]?.[topic] || {
                          assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0
                        };

                        return (
                          <tr key={topic} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white/95 backdrop-blur shadow-[1px_0_0_0_#f8fafc] max-w-[200px] truncate" title={topic}>{topic}</td>
                            <td className="px-4 py-3">
                              <input 
                                type="number" 
                                max={10}
                                className="w-full min-w-[70px] p-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all mx-auto block no-spinners"
                                value={scores.assignment || ''}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'assignment', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="number" 
                                max={20}
                                className="w-full min-w-[70px] p-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all mx-auto block no-spinners"
                                value={scores.video || ''}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'video', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              max={20}
                              className="w-[80px] p-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all mx-auto block no-spinners"
                              value={scores.worksheet}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'worksheet', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              max={20}
                              className="w-[80px] p-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all mx-auto block no-spinners"
                              value={scores.project}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'project', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              max={10}
                              className="w-[80px] p-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all mx-auto block no-spinners"
                              value={scores.mindMap || 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'mindMap', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              max={10}
                              className="w-[80px] p-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all mx-auto block no-spinners"
                              value={scores.quiz || 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'quiz', parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2 w-max mx-auto">
                              <input 
                                type="number" 
                                max={20}
                                className="w-[80px] p-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all no-spinners"
                                value={scores.onlineTest || 0}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'onlineTest', parseInt(e.target.value) || 0)}
                              />
                              {!scores.onlineTestAttempted && (
                                <button
                                  onClick={() => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'onlineTestAssigned', !scores.onlineTestAssigned)}
                                  className={`p-2 rounded-lg transition-colors ${scores.onlineTestAssigned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                  title={scores.onlineTestAssigned ? "Test Enabled" : "Enable Test for Student"}
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}
                              {scores.onlineTestDetails ? (
                                <button 
                                  onClick={() => student && setViewingQuizDetails({ studentName: student.name, topic, details: scores.onlineTestDetails! })}
                                  className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                                  title="View Online Test Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              ) : (scores.onlineTestAttempted && (
                                <button 
                                  className="p-2 bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed transition-colors"
                                  title="No detailed preview available for older tests"
                                >
                                  <Eye className="w-4 h-4 opacity-50" />
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              max={10}
                              className="w-[80px] p-2 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all mx-auto block no-spinners"
                              value={scores.attendance}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateScore(selectedStudentForMarks, selectedCourseForMarks, topic, 'attendance', parseInt(e.target.value) || 0)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </div>

              {/* STUDENT SCORE CARD (LIVE PREVIEW FOR DEMO) */}
              {(() => {
                const student = students.find(s => s.id === selectedStudentForMarks);
                const studentAssignedCourses = student?.assignedCourses || (student?.assignedCourse ? [student.assignedCourse] : []);
                
                const getStudentCardScores = (studentObj: any) => {
                  let totalScore = 0;
                  let maxPossible = 0;
                  
                  if (!studentObj?.scores) return { totalScore, maxPossible };
                  
                  const calculateModuleScore = (scoresObj: Record<string, any>) => {
                    Object.values(scoresObj).forEach((s: any) => {
                      const sTotal = (s.assignmentStatus === 'approved' ? s.assignment : 0) +
                                     (s.videoStatus === 'approved' ? s.video : 0) +
                                     (s.worksheetStatus === 'approved' ? s.worksheet : 0) +
                                     (s.projectStatus === 'approved' ? s.project : 0) +
                                     (s.mindMapStatus === 'approved' ? (s.mindMap || 0) : 0) +
                                     (s.quizAttempted ? (s.quiz || 0) : 0) +
                                     (s.onlineTestAttempted ? (s.onlineTest || 0) : 0);
                      totalScore += sTotal;
                      maxPossible += 100;
                    });
                  };

                  if (studentObj.scores.productionArtEngineer) calculateModuleScore(studentObj.scores.productionArtEngineer);
                  if (studentObj.scores.printReadyEngineer) calculateModuleScore(studentObj.scores.printReadyEngineer);
                  if (studentObj.scores.qualityControlEngineer) calculateModuleScore(studentObj.scores.qualityControlEngineer);
                  if (studentObj.scores.packagingEngineer) calculateModuleScore(studentObj.scores.packagingEngineer);
                  if (studentObj.scores.plateReadyEngineer) calculateModuleScore(studentObj.scores.plateReadyEngineer);
                  if (studentObj.scores.colourRetouchingEngineer) calculateModuleScore(studentObj.scores.colourRetouchingEngineer);
                  if (studentObj.scores.printingAndPackagingCrossCourses) calculateModuleScore(studentObj.scores.printingAndPackagingCrossCourses);

                  return { totalScore, maxPossible };
                };

                const stats = getStudentCardScores(student);
                const radius = 45;
                const circumference = 2 * Math.PI * radius; // 282.74
                const percentage = stats.maxPossible > 0 ? (stats.totalScore / stats.maxPossible) * 100 : 0;
                const strokeDashoffset = stats.maxPossible > 0 ? circumference - (percentage / 100) * circumference : circumference;

                return (
                  <div className="mt-12 space-y-6">
                    <div className="flex items-center gap-2 px-2 border-t border-gray-100 pt-8">
                      <FileText className="w-5 h-5 text-pink-600 font-bold" />
                      <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">STUDENT SCORE CARD</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      {/* Left Block - Overall Progress */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                          <Award className="w-6 h-6 text-pink-600" />
                          <h3 className="text-lg font-bold text-gray-900">Overall Progress</h3>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-4">
                          <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r={radius} fill="none" stroke="#fce7f3" strokeWidth="10" />
                              <circle 
                                cx="50" cy="50" r={radius} fill="none" stroke="#db2777" strokeWidth="10" 
                                strokeDasharray={`${circumference}`}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-3xl font-black text-gray-900 leading-none">{stats.totalScore}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">/ {stats.maxPossible}</span>
                            </div>
                          </div>
                          <p className="mt-4 text-xs text-gray-500 text-center px-4 leading-relaxed">
                            Total marks accumulated across all completed modules and assignments.
                          </p>
                        </div>
                      </div>

                      {/* Right Block - Course Score Cards */}
                      <div className="lg:col-span-2 space-y-6">
                        {studentAssignedCourses.length === 0 ? (
                          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 italic">Score cards will appear here once courses are assigned.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {studentAssignedCourses.map((courseId: string) => {
                              const getTopicsForCourse = (cid: string) => {
                                if (cid === 'packaging-engineer') return packagingEngineerTopics;
                                if (cid === 'production-art-engineer') return productionArtEngineerTopics;
                                if (cid === 'print-ready-engineer') return printReadyEngineerTopics;
                                if (cid === 'plate-ready-engineer') return plateReadyEngineerTopics;
                                if (cid === 'colour-retouching-engineer') return colourRetouchingEngineerTopics; // mapped from colourRetouchingEngineerTopics
                                if (cid === 'printing-and-packaging-cross-courses') return printingAndPackagingTopics;
                                return qualityControlEngineerTopics;
                              };
                              
                              const topics = getTopicsForCourse(courseId);
                              const scoreKey = getScoreKey(courseId);
                              const scoresMap = student?.scores?.[scoreKey as keyof typeof student.scores] || {};
                              
                              return (
                                <div key={courseId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                    <h4 className="font-bold text-gray-800 text-sm">Module - {formatCourseName(courseId)}</h4>
                                    <span className="text-[10px] bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full font-bold uppercase">PREVIEW DEMO</span>
                                  </div>
                                  
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                          <th className="px-4 py-3 w-12 text-center">S.No</th>
                                          <th className="px-4 py-3 min-w-[200px]">Module Topic</th>
                                          <th className="px-4 py-3 text-center">Assignment (10)</th>
                                          <th className="px-4 py-3 text-center">Video (20)</th>
                                          <th className="px-4 py-3 text-center">Worksheet (20)</th>
                                          <th className="px-4 py-3 text-center">Project (20)</th>
                                          <th className="px-4 py-3 text-center">Mind Map (10)</th>
                                          <th className="px-4 py-3 text-center">Quiz (10)</th>
                                          <th className="px-4 py-3 text-center">Total (100)</th>
                                          <th className="px-4 py-3 text-center">Grade</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {topics.map((topic, sIdx) => {
                                          const s: any = scoresMap[topic] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0 };
                                          
                                          const sTotal = (s.assignmentStatus === 'approved' ? s.assignment : 0) +
                                                         (s.videoStatus === 'approved' ? s.video : 0) +
                                                         (s.worksheetStatus === 'approved' ? s.worksheet : 0) +
                                                         (s.projectStatus === 'approved' ? s.project : 0) +
                                                         (s.mindMapStatus === 'approved' ? (s.mindMap || 0) : 0) +
                                                         (s.quizAttempted ? (s.quiz || 0) : 0) +
                                                         (s.onlineTestAttempted ? (s.onlineTest || 0) : 0);
                                          
                                          const grade = sTotal >= 90 ? 'A+' : sTotal >= 80 ? 'A' : sTotal >= 60 ? 'B' : sTotal > 0 ? 'C' : '-';
                                          
                                          return (
                                            <tr key={topic} className="hover:bg-slate-50/40 transition-colors">
                                              <td className="px-4 py-3 text-center text-gray-400">{sIdx + 1}</td>
                                              <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[220px]" title={topic}>{topic}</td>
                                              
                                              <td className="px-4 py-3 text-center font-mono text-gray-600">
                                                {s.assignmentStatus === 'approved' ? s.assignment : <span className="text-gray-300">-</span>}
                                              </td>
                                              <td className="px-4 py-3 text-center font-mono text-gray-600">
                                                {s.videoStatus === 'approved' ? s.video : <span className="text-gray-300">-</span>}
                                              </td>
                                              <td className="px-4 py-3 text-center font-mono text-gray-600">
                                                {s.worksheetStatus === 'approved' ? s.worksheet : <span className="text-gray-300">-</span>}
                                              </td>
                                              <td className="px-4 py-3 text-center font-mono text-gray-600">
                                                {s.projectStatus === 'approved' ? s.project : <span className="text-gray-300">-</span>}
                                              </td>
                                              <td className="px-4 py-3 text-center font-mono text-gray-600">
                                                {s.mindMapStatus === 'approved' ? s.mindMap : <span className="text-gray-300">-</span>}
                                              </td>
                                              <td className="px-4 py-3 text-center font-mono text-gray-600">
                                                {s.quizAttempted ? s.quiz : <span className="text-gray-300">-</span>}
                                              </td>
                                              <td className="px-4 py-3 text-center font-bold text-pink-600 font-mono">
                                                {sTotal}
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className={cn(
                                                  "px-2 py-1 rounded text-[10px] font-bold",
                                                  grade === 'A+' ? "bg-orange-100 text-orange-700" :
                                                  grade === 'A' ? "bg-blue-100 text-blue-700" :
                                                  grade === 'B' ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
                                                )}>
                                                  {grade}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              </>
            ) : (
              <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a student to manage their marks.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Staff Access Management</h3>
                <p className="text-sm text-gray-500">Manage login credentials and access levels for all staff roles.</p>
              </div>
            </div>

            {/* Sub-tabs for staff types */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
              {(['faculty', 'qc', 'accounts', 'telecaller', 'marketing'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setStaffSubTab(role)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                    staffSubTab === role 
                      ? "bg-white text-pink-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {role === 'qc' ? 'QC Reviewers' : role === 'accounts' ? 'Accounts Team' : role === 'telecaller' ? 'Sales Team (Telecallers)' : role === 'marketing' ? 'Marketing Team' : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>

            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 items-start">
              <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-indigo-900 mb-1">Staff Login Instructions</h4>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  When you create a staff member, they can login using their <strong>full email</strong> or their <strong>username</strong> (the part before @ in their email). 
                  The default password for all new staff is <code className="bg-white px-2 py-0.5 rounded font-bold border border-indigo-200">Welcome@123</code>. 
                  They will be prompted to change their password upon their first login.
                </p>
              </div>
            </div>

            {/* Faculty Section */}
            {staffSubTab === 'faculty' && (
              <div className="animate-in fade-in duration-300">
                <form onSubmit={handleCreateFaculty} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-3xl">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                    required
                  />
                  <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Faculty
                  </button>
                </form>

                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 font-semibold text-sm text-gray-500">Faculty Name</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Username</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Email</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Assigned</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {faculty.map((f) => {
                        const assignedCount = students.filter(s => s.assignedFacultyId === f.id && s.isApproved).length;
                        return (
                          <tr key={f.id} className="group hover:bg-gray-50 transition-colors">
                            <td className="py-4 font-medium text-gray-900">{f.name}</td>
                            <td className="py-4 text-xs font-mono font-bold text-gray-700">{f.username}</td>
                            <td className="py-4 text-sm text-gray-500">{f.email}</td>
                            <td className="py-4">
                              <span className="px-2 py-1 bg-pink-50 text-pink-600 rounded text-[10px] font-bold">
                                {assignedCount} Students
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => setViewingFacultySchedule(f)}
                                className="btn-ghost text-pink-600 hover:text-pink-700 hover:bg-pink-50 text-xs font-bold mr-2"
                              >
                                Schedule
                              </button>
                              <button 
                                onClick={() => handleDemoteToStudent(f.id)}
                                className="btn-ghost text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs font-bold mr-2"
                              >
                                Demote
                              </button>
                              <button 
                                onClick={() => handleResetFacultyPassword(f.id)}
                                className="btn-ghost text-gray-500 hover:text-pink-600 hover:bg-pink-50 text-xs font-bold mr-2"
                              >
                                Reset Pass
                              </button>
                              <button 
                                onClick={() => handleDeleteFaculty(f.id)}
                                className="btn-icon-red inline-flex items-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* QC Section */}
            {staffSubTab === 'qc' && (
              <div className="animate-in fade-in duration-300">
                <form onSubmit={handleCreateQC} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-3xl">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newQC.name}
                    onChange={(e) => setNewQC({ ...newQC, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newQC.email}
                    onChange={(e) => setNewQC({ ...newQC, email: e.target.value })}
                    required
                  />
                  <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add QC
                  </button>
                </form>

                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 font-semibold text-sm text-gray-500">QC Name</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Username</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Email</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {qcReviewers.map((q) => (
                        <tr key={q.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="py-4 font-medium text-gray-900">{q.name}</td>
                          <td className="py-4 text-xs font-mono font-bold text-gray-700">{q.username}</td>
                          <td className="py-4 text-sm text-gray-500">{q.email}</td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleDemoteToStudent(q.id)}
                              className="btn-ghost text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs font-bold mr-2"
                            >
                              Demote
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this QC account?')) {
                                  deleteDoc(doc(db, 'users', q.id))
                                    .then(() => alert('QC account deleted.'))
                                    .catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${q.id}`));
                                }
                              }}
                              className="btn-icon-red inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Accounts Section */}
            {staffSubTab === 'accounts' && (
              <div className="animate-in fade-in duration-300">
                <form onSubmit={handleCreateAccounts} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-3xl">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newAccounts.name}
                    onChange={(e) => setNewAccounts({ ...newAccounts, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newAccounts.email}
                    onChange={(e) => setNewAccounts({ ...newAccounts, email: e.target.value })}
                    required
                  />
                  <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Accounts
                  </button>
                </form>

                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 font-semibold text-sm text-gray-500">Name</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Username</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Email</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {accountsExecutives.map((a) => (
                        <tr key={a.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="py-4 font-medium text-gray-900">{a.name}</td>
                          <td className="py-4 text-xs font-mono font-bold text-gray-700">{a.username}</td>
                          <td className="py-4 text-sm text-gray-500">{a.email}</td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleDemoteToStudent(a.id)}
                              className="btn-ghost text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs font-bold mr-2"
                            >
                              Demote
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this Accounts account?')) {
                                  deleteDoc(doc(db, 'users', a.id))
                                    .then(() => alert('Account deleted.'))
                                    .catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${a.id}`));
                                }
                              }}
                              className="btn-icon-red inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Telecaller Section */}
            {staffSubTab === 'telecaller' && (
              <div className="animate-in fade-in duration-300">
                <form onSubmit={handleCreateTelecaller} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-3xl">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTelecaller.name}
                    onChange={(e) => setNewTelecaller({ ...newTelecaller, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTelecaller.email}
                    onChange={(e) => setNewTelecaller({ ...newTelecaller, email: e.target.value })}
                    required
                  />
                  <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Telecaller
                  </button>
                </form>

                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 font-semibold text-sm text-gray-500">Telecaller Name</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Username</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Email</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {telecallers.map((t) => (
                        <tr key={t.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="py-4 font-medium text-gray-900">{t.name}</td>
                          <td className="py-4 text-xs font-mono font-bold text-gray-700">{t.username}</td>
                          <td className="py-4 text-sm text-gray-500">{t.email}</td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleResetTelecallerPassword(t.id)}
                              className="btn-ghost text-gray-500 hover:text-pink-600 hover:bg-pink-50 text-xs font-bold mr-2"
                            >
                              Reset Pass
                            </button>
                            <button 
                              onClick={() => handleDeleteTelecaller(t.id)}
                              className="btn-icon-red inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Marketing Section */}
            {staffSubTab === 'marketing' && (
              <div className="animate-in fade-in duration-300">
                <form onSubmit={handleCreateMarketing} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-3xl">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newMarketing.name}
                    onChange={(e) => setNewMarketing({ ...newMarketing, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                    value={newMarketing.email}
                    onChange={(e) => setNewMarketing({ ...newMarketing, email: e.target.value })}
                    required
                  />
                  <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Marketing Executive
                  </button>
                </form>

                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 font-semibold text-sm text-gray-500">Marketing Name</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Username</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500">Email</th>
                        <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {marketings.map((m) => (
                        <tr key={m.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="py-4 font-medium text-gray-900">{m.name}</td>
                          <td className="py-4 text-xs font-mono font-bold text-gray-700">{m.username}</td>
                          <td className="py-4 text-sm text-gray-500">{m.email}</td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleResetMarketingPassword(m.id)}
                              className="btn-ghost text-gray-500 hover:text-pink-600 hover:bg-pink-50 text-xs font-bold mr-2"
                            >
                              Reset Pass
                            </button>
                            <button 
                              onClick={() => handleDeleteMarketing(m.id)}
                              className="btn-icon-red inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}





        {activeTab === 'holidays' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Holiday List</h3>
                <p className="text-sm text-gray-500">Manage institutional holidays.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const csvContent = "2026-01-01,New Year\n2026-01-26,Republic Day";
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'holidays_template.csv';
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  <Clock className="w-4 h-4" /> Download Template
                </button>
                <label className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" /> Upload CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleBulkUploadHolidays} />
                </label>
              </div>
            </div>

            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-3xl">
              <input
                type="date"
                className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Holiday Title (e.g. Diwali)"
                className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                value={newHoliday.title}
                onChange={(e) => setNewHoliday({ ...newHoliday, title: e.target.value })}
                required
              />
              <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Holiday
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map((h) => (
                <div key={h.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-pink-100 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{h.title}</p>
                    <p className="text-xs text-gray-500">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {holidays.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 italic">
                  No holidays added yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="max-w-4xl space-y-6">
              {!isAdmin && isQC ? (
                <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5 text-pink-600" />
                    QC Error Categories Management
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Modify the default error categories available during project QC review. These categories will update dynamically in the feedback dropdowns.
                  </p>
                  <div className="space-y-4">
                    {qcErrorCategories.map((category, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => {
                            const newCategories = [...qcErrorCategories];
                            newCategories[idx] = e.target.value;
                            setQcErrorCategories(newCategories);
                          }}
                          className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        />
                        <button
                          onClick={() => {
                            const newCategories = qcErrorCategories.filter((_, i) => i !== idx);
                            setQcErrorCategories(newCategories);
                          }}
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setQcErrorCategories([...qcErrorCategories, 'New Category'])}
                      className="flex items-center gap-2 text-pink-600 font-bold hover:text-pink-700 text-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                    <button 
                      onClick={handleSaveVideoUrls}
                      className="w-full py-3 mt-4 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
                    >
                      Save QC Categories
                    </button>
                  </div>
                </div>
              ) : (
                <>


              <AdminWhatsAppSettings />

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-pink-600" />
                  Application Logo
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  This logo will appear on the landing page, login, signup, and ID cards. 
                  <strong> Recommended size: 200x200 pixels. Format: PNG with transparent background.</strong>
                </p>
                
                <div className="space-y-4">
                  <div className="w-full h-32 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {logoUrl && logoUrl !== '/logo.png' ? (
                      <div className="bg-white p-6 rounded-3xl shadow-inner border border-gray-100 w-full h-full flex items-center justify-center">
                        <img src={logoUrl} alt="App Logo" className="max-w-full max-h-full object-contain drop-shadow-md" />
                      </div>
                    ) : (
                      <div className="text-center">
                        <img src="/logo.png" alt="Default Logo" className="w-16 h-16 object-contain mx-auto mb-2 opacity-50" />
                        <span className="text-xs text-gray-400">Default logo active</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-pink-600/0 group-hover:bg-pink-600/10 transition-colors cursor-pointer flex items-center justify-center">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <div className="w-full py-2 bg-pink-600 text-white text-center rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors cursor-pointer">
                        {logoUrl && logoUrl !== '/logo.png' ? 'Change Logo' : 'Upload Custom Logo'}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    {logoUrl && logoUrl !== '/logo.png' && (
                      <button 
                        onClick={async () => {
                          try {
                            await setDoc(doc(db, 'settings', 'admin'), { logoUrl: '' }, { merge: true });
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, 'settings/admin');
                          }
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Video className="w-4 h-4 text-pink-600" />
                  Virtual Classroom Server (Jitsi)
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Set the public or self-hosted Jitsi Meet conference server domain. If an active server is down or restricts embedding, you can update this domain instantly.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Jitsi Instance Server Domain</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={jitsiServerAdmin} 
                        onChange={(e) => setJitsiServerAdmin(e.target.value)}
                        placeholder="e.g. jitsi.belnet.be"
                        className="flex-1 bg-white px-4 py-2 text-sm border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                      />
                      <button 
                        onClick={async () => {
                          try {
                            const trimmedServer = jitsiServerAdmin.trim().replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
                            await setDoc(doc(db, 'settings', 'admin'), { jitsiServer: trimmedServer }, { merge: true });
                            alert('Jitsi server domain updated successfully!');
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, 'settings/admin');
                          }
                        }}
                        className="px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors shadow-md"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs text-gray-500">
                    <span className="font-bold text-gray-700 block mb-1">Recommended Public Jitsi Instances:</span>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong className="text-pink-600 font-mono">jitsi.belnet.be</strong> (High capacity academic network, very stable)</li>
                      <li><strong className="text-pink-600 font-mono">meet.opensuse.org</strong> (Hosted by openSUSE, robust embed support)</li>
                      <li><strong className="text-pink-600 font-mono">jitsi.fem.tu-ilmenau.de</strong> (Fast educational server)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-pink-600" />
                  Required Student Software & Toolkit Links
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Configure the installation, download, and helper tool links provided to registered students. These links are prominently displayed on the Student Software Library and Dashboard during onboarding.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Adobe Creative Cloud URL</label>
                    <input 
                      type="text" 
                      value={adobeCloudUrlAdmin} 
                      onChange={(e) => setAdobeCloudUrlAdmin(e.target.value)}
                      placeholder="e.g. https://creativecloud.adobe.com/apps/all/desktop"
                      className="w-full bg-white px-4 py-2.5 text-sm border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Pantone Color Books URL</label>
                    <input 
                      type="text" 
                      value={pantoneBooksUrlAdmin} 
                      onChange={(e) => setPantoneBooksUrlAdmin(e.target.value)}
                      placeholder="e.g. https://www.pantone.com/connect"
                      className="w-full bg-white px-4 py-2.5 text-sm border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">TeamViewer URL</label>
                    <input 
                      type="text" 
                      value={teamViewerUrlAdmin} 
                      onChange={(e) => setTeamViewerUrlAdmin(e.target.value)}
                      placeholder="e.g. https://www.teamviewer.com/download"
                      className="w-full bg-white px-4 py-2.5 text-sm border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Adobe Scripts & Student Toolkit URL</label>
                    <input 
                      type="text" 
                      value={adobeScriptToolkitUrlAdmin} 
                      onChange={(e) => setAdobeScriptToolkitUrlAdmin(e.target.value)}
                      placeholder="e.g. https://github.com/Adobe-CEP/CEP-Resources"
                      className="w-full bg-white px-4 py-2.5 text-sm border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                    />
                  </div>
                  
                  <button 
                    onClick={async () => {
                      try {
                        await setDoc(doc(db, 'settings', 'admin'), { 
                          adobeCloudUrl: adobeCloudUrlAdmin.trim(),
                          pantoneBooksUrl: pantoneBooksUrlAdmin.trim(),
                          teamViewerUrl: teamViewerUrlAdmin.trim(),
                          adobeScriptToolkitUrl: adobeScriptToolkitUrlAdmin.trim()
                        }, { merge: true });
                        alert('Required software installation URLs saved successfully!');
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, 'settings/admin');
                      }
                    }}
                    className="w-full py-3 mt-4 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Save Software Installation Links
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Image className="w-4 h-4 text-pink-600" />
                  Landing Page Title Image
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Replace the text title on the landing page hero section with a custom image.
                  <strong> Recommended size: 600x200 pixels. Format: PNG/JPG with transparent/white background.</strong>
                </p>
                
                <div className="space-y-4">
                  <div className="w-full h-32 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {landingPageTitleImageUrl ? (
                      <img src={landingPageTitleImageUrl} alt="Landing Page Title" className="max-w-full max-h-full object-contain p-2" />
                    ) : (
                      <div className="text-center">
                        <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span className="text-xs text-gray-400">No title image uploaded</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-pink-600/0 group-hover:bg-pink-600/10 transition-colors cursor-pointer flex items-center justify-center">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLandingTitleImageUpload} />
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <div className="w-full py-2 bg-pink-600 text-white text-center rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors cursor-pointer">
                        {landingPageTitleImageUrl ? 'Change Title Image' : 'Upload Title Image'}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLandingTitleImageUpload} />
                    </label>
                    {landingPageTitleImageUrl && (
                      <button 
                        onClick={async () => {
                          try {
                            await setDoc(doc(db, 'settings', 'admin'), { landingPageTitleImageUrl: '' }, { merge: true });
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, 'settings/admin');
                          }
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-pink-600" />
                  Authorized Signature
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  This signature will appear on all approved student ID cards. Use a transparent PNG for best results.
                </p>
                
                <div className="space-y-4">
                  <div className="w-full h-32 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {adminSignature ? (
                      <img src={adminSignature} alt="Admin Signature" className="max-w-full max-h-full object-contain p-4" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                        <span className="text-xs text-gray-400">No signature uploaded</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-pink-600/0 group-hover:bg-pink-600/10 transition-colors cursor-pointer flex items-center justify-center">
                      <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <div className="w-full py-2 bg-pink-600 text-white text-center rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors cursor-pointer">
                        {adminSignature ? 'Change Signature' : 'Upload Signature'}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                    </label>
                    {adminSignature && (
                      <button 
                        onClick={async () => {
                          try {
                            await setDoc(doc(db, 'settings', 'admin'), { signature: '' }, { merge: true });
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, 'settings/admin');
                          }
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <h5 className="font-bold text-gray-800 mb-2">Certificate Demo Preview</h5>
                    <p className="text-xs text-gray-500 mb-4">You can preview the certificate and verify how the signature and logo place.</p>
                    <CertificateGenerator 
                      user={{
                        id: 'demo-user',
                        studentId: 'DEMO-123456',
                        name: 'Demo Student Name',
                        username: 'demostudent',
                        email: 'demo@example.com',
                        role: 'student',
                        isApproved: true,
                        registeredForDemo: false,
                        applicationStatus: 'approved',
                        videoRecorded: true,
                        quizCompleted: true,
                        completedModules: [],
                        scores: {}
                      } as any}
                      course="production-art-engineer"
                      logoUrl={logoUrl}
                      adminSignature={adminSignature}
                      grade="A+"
                      durationMonths={
                        financialSettings?.coursesConfig?.find((c: any) => c.courseId === 'production-art-engineer')?.durationMonths || 6
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pink-600" />
                  Global Project Guidelines & Mandates
                </h4>
                <p className="text-xs text-gray-500 mb-6 font-semibold">
                  Set the Google Drive PDF links for the Brand Guideline and Legal Mandate. These links will be available for all students to access directly on their project workspace.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-450 uppercase tracking-wider mb-2">Brand Guideline PDF URL</label>
                    <input
                      type="text"
                      placeholder="e.g., https://drive.google.com/file/d/.../view?usp=sharing"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm font-semibold mb-2"
                      value={brandGuidelineUrl}
                      onChange={(e) => setBrandGuidelineUrl(e.target.value)}
                    />
                    <FileUploader 
                      path="global_guidelines"
                      accept=".pdf,.doc,.docx"
                      onUploadComplete={(url) => setBrandGuidelineUrl(url)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-450 uppercase tracking-wider mb-2">Legal Mandate PDF URL</label>
                    <input
                      type="text"
                      placeholder="e.g., https://drive.google.com/file/d/.../view?usp=sharing"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm font-semibold mb-2"
                      value={legalMandateUrl}
                      onChange={(e) => setLegalMandateUrl(e.target.value)}
                    />
                    <FileUploader 
                      path="global_mandates"
                      accept=".pdf,.doc,.docx"
                      onUploadComplete={(url) => setLegalMandateUrl(url)}
                    />
                  </div>
                  
                  {/* PDF Size Warning Callout box */}
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1.5 mb-1">
                      ⚠️ OPTIMIZATION NOTICE FOR STUDENT PREVIEWS:
                    </span>
                    Google Drive has file size limits on embedded documents. If you link high-resolution, uncompressed PDFs (e.g. over 25MB), students will see a <span className="font-semibold underline">"file is too large to preview"</span> error inside the workspace. 
                    <br />
                    <strong className="text-pink-700">Please compress your PDFs or export them at a lower resolution (keep file size under 15MB)</strong> before uploading them to Google Drive. This guarantees a smooth, zero-error interactive viewing experience!
                  </div>

                  <button 
                    onClick={async () => {
                      try {
                        await setDoc(doc(db, 'settings', 'admin'), { 
                          brandGuidelineUrl, 
                          legalMandateUrl 
                        }, { merge: true });
                        alert('Guideline and Mandate URLs saved successfully.');
                      } catch (err) {
                        handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
                      }
                    }}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Save Guidelines & Mandates</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Video className="w-4 h-4 text-pink-600" />
                  Dashboard Videos
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Configure the YouTube embed URLs for the videos shown on the student dashboard.
                </p>

                <div className="flex flex-col gap-4 mb-6 bg-white p-4 border border-gray-100 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Enable Founder's Message Video</h5>
                      <p className="text-[11px] text-gray-500">Show/hide Founder's Message on pages.</p>
                    </div>
                    <button
                      onClick={() => setFounderVideoEnabled(!founderVideoEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        founderVideoEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          founderVideoEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Enable Training Overview Video</h5>
                      <p className="text-[11px] text-gray-500">Show/hide Training Overview on pages.</p>
                    </div>
                    <button
                      onClick={() => setOverviewVideoEnabled(!overviewVideoEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        overviewVideoEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          overviewVideoEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Founder Message Video URL (English)</label>
                    <input
                      type="text"
                      placeholder="e.g., https://www.youtube.com/embed/..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm font-semibold"
                      value={founderVideoUrl}
                      onChange={(e) => setFounderVideoUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Founder Message Video URL (Tamil)</label>
                    <input
                      type="text"
                      placeholder="e.g., https://www.youtube.com/embed/..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm font-semibold"
                      value={founderVideoUrlTamil}
                      onChange={(e) => setFounderVideoUrlTamil(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Training Overview Video URL (English)</label>
                    <input
                      type="text"
                      placeholder="e.g., https://www.youtube.com/embed/..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm font-semibold"
                      value={overviewVideoUrl}
                      onChange={(e) => setOverviewVideoUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Training Overview Video URL (Tamil)</label>
                    <input
                      type="text"
                      placeholder="e.g., https://www.youtube.com/embed/..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm font-semibold"
                      value={overviewVideoUrlTamil}
                      onChange={(e) => setOverviewVideoUrlTamil(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleSaveVideoUrls}
                    className="w-full py-3 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Save Video Settings</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  Self-Care & Wellness (Moral Education)
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Enable a holistic morning routine for students including meditation and prayer.
                </p>
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Enable Wellness Day Starter</h4>
                    <p className="text-xs text-gray-500">Students will see this page upon opening the app.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setWellnessEnabled(!wellnessEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        wellnessEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          wellnessEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Self-Care & Wellness Video URL (Single Video)</label>
                    <input
                      type="text"
                      placeholder="YouTube Embed URL (e.g., https://www.youtube.com/embed/-GHd77C4brk?si=lnvBe-_P2fXxAeaW)"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      value={wellnessVideoUrl}
                      onChange={(e) => setWellnessVideoUrl(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleSaveVideoUrls}
                    className="w-full py-3 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
                  >
                    Save Wellness Settings
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pink-600" />
                  Entrance Test Settings
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Configure the audio source for the entrance test listening practice.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entrance Test Audio URL (FatMan Story)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Paste audio URL here..."
                        className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        value={entranceTestAudioUrl}
                        onChange={(e) => setEntranceTestAudioUrl(e.target.value)}
                      />
                    </div>
                    <FileUploader 
                      path="entrance_tests"
                      accept="audio/*"
                      onUploadComplete={(url) => {
                        setEntranceTestAudioUrl(url);
                        alert('Audio uploaded and URL updated! Click Save Test Settings to persist.');
                      }}
                      className="mb-2"
                    />
                  </div>
                  <button 
                    onClick={handleSaveVideoUrls}
                    className="w-full py-3 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
                  >
                    Save Test Settings
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Download className="w-4 h-4 text-pink-600" />
                  Document Settings
                </h4>
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Enable Document Downloads</h4>
                    <p className="text-xs text-gray-500">Allow students to download Mind Maps.</p>
                  </div>
                  <button
                    onClick={() => setEnableDocumentDownloads(!enableDocumentDownloads)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enableDocumentDownloads ? 'bg-pink-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enableDocumentDownloads ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <button 
                  onClick={handleSaveVideoUrls}
                  className="w-full py-3 mt-4 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
                >
                  Save Document Settings
                </button>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-pink-600" />
                  QC Error Categories
                </h4>
                <div className="space-y-4">
                  {qcErrorCategories.map((category, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => {
                          const newCategories = [...qcErrorCategories];
                          newCategories[idx] = e.target.value;
                          setQcErrorCategories(newCategories);
                        }}
                        className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                      <button
                        onClick={() => {
                          const newCategories = qcErrorCategories.filter((_, i) => i !== idx);
                          setQcErrorCategories(newCategories);
                        }}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setQcErrorCategories([...qcErrorCategories, 'New Category'])}
                    className="flex items-center gap-2 text-pink-600 font-bold hover:text-pink-700 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Category
                  </button>
                  <button 
                    onClick={handleSaveVideoUrls}
                    className="w-full py-3 mt-4 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
                  >
                    Save QC Categories
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-pink-600" />
                  Landing Page Stats
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Manage the statistics shown on the landing page hero section.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Industry Modules</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        value={landingPageStats.modules}
                        onChange={(e) => setLandingPageStats({ ...landingPageStats, modules: e.target.value })}
                        placeholder="e.g. 12+"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Certified Students</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        value={landingPageStats.students}
                        onChange={(e) => setLandingPageStats({ ...landingPageStats, students: e.target.value })}
                        placeholder="e.g. 500+"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Placement Support</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        value={landingPageStats.placement}
                        onChange={(e) => setLandingPageStats({ ...landingPageStats, placement: e.target.value })}
                        placeholder="e.g. 100%"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Learning Access</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        value={landingPageStats.access}
                        onChange={(e) => setLandingPageStats({ ...landingPageStats, access: e.target.value })}
                        placeholder="e.g. 24/7"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveVideoUrls}
                    className="w-full py-3 mt-2 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
                  >
                    Save Landing Stats
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink-600" />
                  Study Centers (Branches)
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Add branch locations. These will be available for students to select when applying.
                </p>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., New York Branch"
                      className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddBranch();
                        }
                      }}
                    />
                    <button 
                      onClick={handleAddBranch}
                      disabled={!newBranch.trim()}
                      className="px-6 py-3 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {branches.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {branches.map((branch, index) => (
                          <li key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                            <span className="text-sm text-gray-700 font-medium">{branch}</span>
                            <button 
                              onClick={() => handleRemoveBranch(branch)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 italic">
                        No branches added yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Image className="w-4 h-4 text-pink-600" />
                  Landing Page Banners
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Upload banners to display on the landing page carousel. Recommended size: 1200x400 pixels.
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {banners.map((banner) => (
                      <div key={banner.id} className="relative group rounded-xl overflow-hidden border border-gray-200">
                        <img src={banner.imageUrl} alt="Banner" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditBanner(banner)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="Edit Banner"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveBanner(banner.id)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Delete Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {banner.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-white text-xs font-bold truncate">{banner.title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        setBannerForm({
                          imageUrl: '',
                          title: '',
                          level: 'BASIC',
                          levelPercentage: 80,
                          overview: ['', '', '']
                        });
                        setEditingBannerId(null);
                        setShowBannerModal(true);
                      }}
                      className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 font-medium">Add Banner</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-pink-600" />
                  AI Agent Knowledge Base
                </h4>
                <p className="text-xs text-gray-500 mb-6">
                  Provide the authorized source text for the Student AI Agent. This information will be used to answer student questions about Printing and Packaging.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Knowledge Base Content</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.txt,.docx"
                        onChange={handleKnowledgeBaseUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isExtractingText}
                      />
                      <button 
                        disabled={isExtractingText}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg text-sm font-bold hover:bg-pink-100 transition-colors disabled:opacity-50"
                      >
                        {isExtractingText ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
                        ) : (
                          <><Upload className="w-4 h-4" /> Upload PDF/TXT/DOCX</>
                        )}
                      </button>
                    </div>
                  </div>
                  {extractStatus && (
                    <div className="text-sm text-pink-600 font-medium animate-pulse bg-pink-50 p-3 rounded-xl border border-pink-100">
                      {extractStatus}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 -mt-2 mb-4">Note: Word (.docx), PDF, or TXT files supported. Max size: 8MB. Large files may timeout; please split them if needed.</p>
                  <textarea
                    value={aiKnowledgeBase}
                    onChange={(e) => setAiKnowledgeBase(e.target.value)}
                    placeholder="Paste the authorized printing and packaging knowledge here..."
                    className="w-full h-64 p-4 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none resize-none bg-gray-50"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        try {
                          await setDoc(doc(db, 'settings', 'admin'), { aiKnowledgeBase }, { merge: true });
                          alert('AI Knowledge Base updated successfully!');
                        } catch (err) {
                          handleFirestoreError(err, OperationType.UPDATE, 'settings/admin');
                        }
                      }}
                      className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
                    >
                      Save Knowledge Base
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-pink-50 rounded-3xl border border-pink-100">
                <h4 className="font-bold text-pink-900 mb-2">Approval Workflow</h4>
                <p className="text-xs text-pink-700 leading-relaxed">
                  Students can only download their ID cards once you have approved them individually in the "Student Approvals" tab. 
                  Approved cards will automatically include the signature uploaded above.
                </p>
              </div>
            </>
          )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-pink-50 text-pink-600 rounded-[2rem] flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">System Utilities</h3>
            <p className="text-gray-500 mb-12 max-w-md mx-auto">
              Populate your CRM and student databases with demo records for testing and demonstration purposes.
            </p>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
              <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-left">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Demo CRM Leads</h4>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  Adds 5 realistic leads to the Telecaller CRM with mock notes, phone numbers, and various statuses.
                </p>
                <button 
                  onClick={seedDemoCRMLeads}
                  disabled={isSeedingLeads}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-pink-600 transition-all flex items-center justify-center gap-2"
                >
                  {isSeedingLeads ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {isSeedingLeads ? 'Seeding Leads...' : 'Seed CRM Leads'}
                </button>
              </div>

              <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-left">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Demo Student Data</h4>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  Adds 3 sample student profiles (2 approved, 1 pending) with complete application details and course assignments.
                </p>
                <button 
                  onClick={seedDemoStudents}
                  disabled={isSeedingStudents}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-pink-600 transition-all flex items-center justify-center gap-2"
                >
                  {isSeedingStudents ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {isSeedingStudents ? 'Seeding Students...' : 'Seed Student Data'}
                </button>
              </div>
            </div>

            <div className="mt-12 p-6 bg-orange-50 border border-orange-100 rounded-3xl max-w-2xl text-left flex gap-4">
              <Info className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
              <div className="space-y-1">
                <h5 className="font-bold text-orange-900 text-sm">Note on Demo Data</h5>
                <p className="text-xs text-orange-700 leading-relaxed">
                  Demo records are added primarily for testing workflows. You can manually delete these records anytime from the Students or CRM Leads sections. The students added here will have mock emails and will not be able to login unless you manually change their authentication status in the Firebase console.
                </p>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'software-videos' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Software Video Library</h3>
                <p className="text-sm text-gray-500">Manage 5-minute tool-related videos for students.</p>
              </div>
              <button 
                onClick={() => {
                  setSoftwareVideoForm({ toolName: 'Adobe Acrobat', title: '', videoUrl: '', duration: '5:00', courseIds: [] });
                  setEditingSoftwareVideoId(null);
                  setShowSoftwareVideoModal(true);
                }}
                className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
              >
                <Plus className="w-4 h-4" /> Add Video
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {['Adobe Acrobat', 'Illustrator', 'Photoshop', 'Quality Check Process'].map(tool => (
                <div key={tool} className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-pink-600" />
                    {tool}
                  </h4>
                  <div className="space-y-3">
                    {softwareVideos.filter(v => v.toolName === tool).map(video => (
                      <div key={video.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-pink-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-bold text-sm text-gray-900 line-clamp-1">{video.title}</h5>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                setSoftwareVideoForm({
                                  toolName: video.toolName,
                                  title: video.title,
                                  videoUrl: video.videoUrl,
                                  duration: video.duration,
                                  courseIds: video.courseIds || []
                                });
                                setEditingSoftwareVideoId(video.id);
                                setShowSoftwareVideoModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-pink-600 bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors"
                              title="Edit Video"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSoftwareVideo(video.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {video.duration}
                          </span>
                          <span className="truncate max-w-[100px]">{video.videoUrl}</span>
                        </div>
                      </div>
                    ))}
                    {softwareVideos.filter(v => v.toolName === tool).length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-400">
                        No videos added yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showSoftwareVideoModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative">
                  <button 
                    onClick={() => setShowSoftwareVideoModal(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {editingSoftwareVideoId ? 'Edit Software Video' : 'Add Software Video'}
                  </h3>
                  <form onSubmit={handleSaveSoftwareVideo} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Software Tool</label>
                      <select 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={softwareVideoForm.toolName}
                        onChange={(e) => setSoftwareVideoForm({ ...softwareVideoForm, toolName: e.target.value })}
                        required
                      >
                        <option value="Adobe Acrobat">Adobe Acrobat</option>
                        <option value="Illustrator">Illustrator</option>
                        <option value="Photoshop">Photoshop</option>
                        <option value="Quality Check Process">Quality Check Process</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Video Title</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={softwareVideoForm.title}
                        onChange={(e) => setSoftwareVideoForm({ ...softwareVideoForm, title: e.target.value })}
                        required
                        placeholder="e.g. Introduction to Layers"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">YouTube / Video URL</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={softwareVideoForm.videoUrl}
                        onChange={(e) => setSoftwareVideoForm({ ...softwareVideoForm, videoUrl: e.target.value })}
                        required
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Duration</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
                        value={softwareVideoForm.duration}
                        onChange={(e) => setSoftwareVideoForm({ ...softwareVideoForm, duration: e.target.value })}
                        required
                        placeholder="e.g. 5:00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assign to Courses (Optional)</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        {courseModules.map(course => (
                          <label key={course.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={softwareVideoForm.courseIds?.includes(course.id) || false}
                              onChange={(e) => {
                                const currentIds = softwareVideoForm.courseIds || [];
                                if (e.target.checked) {
                                  setSoftwareVideoForm({ ...softwareVideoForm, courseIds: [...currentIds, course.id] });
                                } else {
                                  setSoftwareVideoForm({ ...softwareVideoForm, courseIds: currentIds.filter((id: string) => id !== course.id) });
                                }
                              }}
                              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            />
                            <span className="text-sm text-gray-700">{course.title}</span>
                          </label>
                        ))}
                        {courseModules.length === 0 && (
                          <p className="text-xs text-gray-500 italic">No courses available.</p>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">If no courses are selected, the video will be visible to all students.</p>
                    </div>
                    <button type="submit" className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100">
                      {editingSoftwareVideoId ? 'Update Video' : 'Save Video'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900">Referral Payouts</h3>
              <p className="text-sm text-gray-500">Track and manage referral bonuses for telecallers and external partners.</p>
            </div>
            <div className="space-y-6">
              {invoices.filter(inv => inv.referral).length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No referrals found.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {invoices.filter(inv => inv.referral).map((invoice) => {
                    const student = students.find(s => s.id === invoice.studentId);
                    return (
                      <div key={invoice.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900">Referred Student: {student?.name || 'Unknown Student'}</h4>
                            <p className="text-sm text-gray-500">Invoice ID: {invoice.id}</p>
                          </div>
                          <div className="text-right">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              invoice.referral?.referrerType === 'internal' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            )}>
                              {invoice.referral?.referrerType === 'internal' ? 'Internal (Telecaller)' : 'External Partner'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Referred By</p>
                            <p className="font-bold text-gray-900">{invoice.referral?.referredBy}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Contact</p>
                            <p className="font-bold text-gray-900">{invoice.referral?.referrerContact || 'N/A'}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Bonus Percentage</p>
                            <p className="font-bold text-gray-900">{invoice.referral?.bonusPercentage}%</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Total Fee Paid</p>
                            <p className="font-bold text-gray-900">
                              ₹{invoice.emis.filter((e: any) => e.status === 'paid').reduce((sum: number, e: any) => sum + e.baseAmount, 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                            <p className="text-xs text-green-700 mb-1">Bonus Earned</p>
                            <p className="font-bold text-green-800 text-lg">₹{(invoice.referral?.bonusEarnedSoFar || 0).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-700 mb-1">Bonus Paid</p>
                            <p className="font-bold text-blue-800 text-lg">₹{(invoice.referral?.bonusPaidSoFar || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={() => setPayoutModal({ invoiceId: invoice.id, amount: (invoice.referral?.bonusEarnedSoFar || 0) - (invoice.referral?.bonusPaidSoFar || 0) })}
                            disabled={(invoice.referral?.bonusEarnedSoFar || 0) <= (invoice.referral?.bonusPaidSoFar || 0)}
                            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <IndianRupee className="w-4 h-4" />
                            Record Payout
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="p-6">
            <Reports role="admin" />
          </div>
        )}

        {activeTab === 'live-classes' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Live Classes</h3>
                <p className="text-sm text-gray-500">Manage virtual classrooms and live sessions.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingSessionId(null);
                    setNewSessionTitle('');
                    setNewSessionFacultyId('');
                    setNewSessionStudentIds([]);
                    setNewSessionDate('');
                    setNewSessionType('hr_interview');
                    setShowCreateSessionModal(true);
                  }}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create HR Interview
                </button>
                <button 
                  onClick={() => {
                    setEditingSessionId(null);
                    setNewSessionTitle('');
                    setNewSessionFacultyId('');
                    setNewSessionStudentIds([]);
                    setNewSessionDate('');
                    setNewSessionType('interview');
                    setShowCreateSessionModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Interview
                </button>
                <button 
                  onClick={() => {
                    setEditingSessionId(null);
                    setNewSessionTitle('');
                    setNewSessionFacultyId('');
                    setNewSessionStudentIds([]);
                    setNewSessionDate('');
                    setNewSessionType('live');
                    setShowCreateSessionModal(true);
                  }}
                  className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Live Class
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveSessions.filter(s => s.type !== 'demo').map((session) => (
                <div key={session.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-gray-900 text-lg">{session.title}</h4>
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      session.status === 'live' ? "bg-red-100 text-red-700" : 
                      session.status === 'scheduled' ? "bg-blue-100 text-blue-700" : 
                      "bg-gray-100 text-gray-700"
                    )}>
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 mb-6 text-sm text-gray-600 flex-1">
                    <p className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> {session.facultyName}</p>
                    {session.students && session.students.length > 0 ? (
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 mt-1 shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {session.students.map((s: any) => (
                            <span key={s.id} className="bg-gray-100 px-2 py-0.5 rounded-md text-xs">{s.name}</span>
                          ))}
                        </div>
                      </div>
                    ) : session.studentName && (
                      <p className="flex items-center gap-2"><Users className="w-4 h-4" /> {session.studentName}</p>
                    )}
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(session.scheduledFor).toLocaleString()}</p>
                    {session.recordingUrl && (
                      <div className="mt-4">
                        <div className="aspect-video bg-black rounded-xl overflow-hidden">
                          <SecureVideoPlayer url={session.recordingUrl} title="Live Session Recording" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {session.status !== 'completed' && (
                      <button 
                        onClick={async () => {
                          window.open(`/classroom/${session.roomId}`, '_blank');
                          if (session.status === 'scheduled') {
                            try {
                              await updateDoc(doc(db, 'live_sessions', session.id), { status: 'live' });
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${session.id}`);
                            }
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-pink-50 text-pink-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-100 transition-colors"
                      >
                        <Video className="w-4 h-4" /> {session.status === 'scheduled' ? 'Start Class' : 'Join Class'}
                      </button>
                    )}
                    {session.status === 'live' && (
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'live_sessions', session.id), { status: 'completed' });
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${session.id}`);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                      >
                        End Class
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setEditingSessionId(session.id);
                        setNewSessionTitle(session.title);
                        setNewSessionFacultyId(session.facultyId);
                        setNewSessionType(session.type || 'live');
                        setNewSessionInterviewerEmail(session.interviewerEmail || '');
                        setNewSessionStudentIds(session.students ? session.students.map((s: any) => s.id) : (session.studentId ? [session.studentId] : []));
                        
                        // Format date for datetime-local input
                        const date = new Date(session.scheduledFor);
                        const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setNewSessionDate(formattedDate);
                        
                        setShowCreateSessionModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                      title="Edit Session"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setSessionToUpdateRecording(session.id);
                        setRecordingUrl(session.recordingUrl || '');
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Add/Edit Recording Link"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setSessionToDelete(session.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {liveSessions.filter(s => s.type !== 'demo').length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No live classes scheduled.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Student Projects</h3>
                <p className="text-sm text-gray-500">Manage and review student projects.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                      try {
                        const allDocsToDelete = [
                          ...masterProjects.map(mp => doc(db, 'master_projects', mp.id)),
                          ...projects.map(p => doc(db, 'student_projects', p.id))
                        ];
                        
                        if (allDocsToDelete.length > 0) {
                          for (let i = 0; i < allDocsToDelete.length; i += 400) {
                            const chunk = allDocsToDelete.slice(i, i + 400);
                            const batch = writeBatch(db);
                            chunk.forEach(ref => batch.delete(ref));
                            await batch.commit();
                          }
                          alert(`Successfully deleted ${allDocsToDelete.length} projects.`);
                        } else {
                          alert('No projects found to delete.');
                        }
                      } catch (err) {
                        handleFirestoreError(err, OperationType.DELETE, 'projects');
                      }
                  }}
                  className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete All Projects
                </button>
                <button 
                  onClick={() => {
                    setEditingProjectId(null);
                    setProjectForm({
                      title: '',
                      studentId: '',
                      studentAssignments: [],
                      cloudPath: '',
                      projectFileUrl: '',
                      googleDriveLink: '',
                      courseId: '',
                      details: '',
                      supportDocuments: '',
                      stageEstimates: {
                        client: 10,
                        preflight: 10,
                        production: 30,
                        pqc: 10,
                        qc: 10
                      },
                      preflightChecklist: [
                        'Check if all fonts are embedded or outlined',
                        'Verify image resolution is at least 300 DPI',
                        'Check if color mode is CMYK',
                        'Verify bleed settings (minimum 3mm)',
                        'Check for overprint settings on black text',
                        'Verify barcode readability and BWR',
                        'Check if all links are updated and not missing'
                      ],
                      productionChecklist: [
                        'Verify dimensions match the die-line',
                        'Check for correct trapping settings',
                        'Verify color separation and spot colors',
                        'Check for correct overprint/knockout settings',
                        'Verify eye-mark position and color',
                        'Check for correct rich black values',
                        'Verify all text is legible and correctly spelled'
                      ],
                      clientBrief: {
                        brandName: '',
                        packType: '',
                        variantName: '',
                        fileName: '',
                        netWeight: '',
                        baseFileName: '',
                        edName: '',
                        referenceFileName: '',
                        masterJob: '',
                        annotationPdfName: '',
                        jobBrief: ''
                      },
                      printerSpec: {
                        printMethod: '',
                        printingSubstrate: '',
                        faceReversePrint: '',
                        maxColors: '',
                        varnishIncluded: '',
                        barcodes: [{ codeType: '', codeNumber: '', codeColour: '', bwr: '', magnification: '', narrowBar: '' }],
                        colorRotation: Array.from({ length: 15 }, () => ({ colorName: '', lineScreen: '', lpi: '', dotType: '', angle: '', new: '' })),
                        artworkInfo: {
                          minLineThicknessPos: '', minLineThicknessRev: '', minTextSizePos: '', minTextSizeRev: '',
                          minTypeMultiColorPos: '', minTypeMultiColorRev: '', minSymbolSizePos: '', minSymbolSizeNeg: '',
                          xHeight: '', bleed: '', rollover: '', typeSafety: '', minDotSize: '', maxTonalValue: '', maxInkCoverage: ''
                        },
                        eyeMark: { size: '', colour: '', position: '', underColourPullback: '' },
                        microdot: { location1: '', location2: '', size: '' },
                        richBlack: { cyan: '', yellow: '', magenta: '', black: '' },
                        trappingBleed: { minTrap: '', maxTrap: '', standardTrap: '', metalicTrap: '', ctStandardTrap: '', ctMinTrap: '', ctMaxTrap: '', varnishTrap: '' },
                        pullbackHoldback: { generalPullback: '', whitePullback1: '', whitePullback2: '', varnishPullback: '', keyline: '' },
                        proofingProfile: '',
                        preferredFormat: ''
                      }
                    });
                    setShowCreateProjectModal(true);
                  }}
                  className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Project
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex-1 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-pink-600" />
                <span className="font-bold text-gray-700">Filter by Course:</span>
                <select 
                  value={selectedProjectCourse}
                  onChange={(e) => setSelectedProjectCourse(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">All Courses</option>
                  {courseModules.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-500">
                Showing {projects.filter(p => selectedProjectCourse === 'all' || p.courseId === selectedProjectCourse).length} projects
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {masterProjects
                .filter(p => selectedProjectCourse === 'all' || p.courseId === selectedProjectCourse)
                .map((master) => {
                  const activeAssignments = projects.filter(p => p.masterProjectId === master.id && p.status !== 'approved');
                  const isExpanded = expandedMasterProjects[master.id] || false;
                  
                  return (
                    <div key={master.id} className={cn(
                      "bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col p-6",
                      isExpanded ? "border-pink-200" : "border-gray-100"
                    )}>
                      {/* Collapsible Header */}
                      <div 
                        onClick={() => {
                          setExpandedMasterProjects(prev => ({
                            ...prev,
                            [master.id]: !prev[master.id]
                          }));
                        }}
                        className="flex items-start justify-between cursor-pointer select-none group gap-3 min-w-0 w-full"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 group-hover:bg-pink-100 transition-colors shrink-0 mt-0.5">
                            <FolderKanban className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors break-all break-words pr-2 text-base leading-snug" title={master.title}>
                              {master.title}
                            </h3>
                            {!isExpanded ? (
                              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">
                                Click to expand • {activeAssignments.length} active students
                              </p>
                            ) : (
                              <div className="flex flex-col gap-1 mt-2">
                                <p className="text-xs text-gray-500 font-semibold">Est. Time: {master.estimatedTime}m</p>
                                {master.courseName && (
                                  <span className="text-[10px] font-bold text-pink-600 uppercase bg-pink-50 px-1.5 py-0.5 rounded w-fit">
                                    {master.courseName}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-1.5 border border-pink-100 rounded-xl bg-pink-50/50 text-pink-600 group-hover:bg-pink-100 transition-all shadow-sm shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200 mt-5 flex flex-col flex-1">
                          <div className="flex-1 mb-4 border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Active Students</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                              {activeAssignments.length === 0 && projects.filter(p => p.masterProjectId === master.id && p.status === 'approved').length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No students assigned</p>
                              ) : (
                                <>
                                  {activeAssignments.map(assignment => (
                                    <div key={assignment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{assignment.studentName}</span>
                                        <span className="text-[10px] text-gray-500">{assignment.clientBrief?.projectNumber || assignment.projectCode}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <ProjectStatusDropdown
                                          status={assignment.status}
                                          assignmentId={assignment.id}
                                          onChange={async (newStatus) => {
                                            try {
                                              await updateDoc(doc(db, 'student_projects', assignment.id), {
                                                status: newStatus,
                                                workStatus: newStatus === 'approved' ? 'Completed' : 'In Progress',
                                                updatedAt: new Date().toISOString()
                                              });
                                            } catch (err) {
                                              handleFirestoreError(err, OperationType.UPDATE, `student_projects/${assignment.id}`);
                                            }
                                          }}
                                        />
                                        {assignment.googleDriveLink && (
                                          <button 
                                            onClick={() => {
                                              const student = students.find(s => s.id === assignment.studentId);
                                              const phone = student?.whatsapp || student?.phone || '';
                                              const cleanPhone = phone.replace(/\D/g, '');
                                              
                                              if (!cleanPhone) {
                                                alert(`Phone number for ${assignment.studentName} is missing in their profile.`);
                                                return;
                                              }
                                              
                                              const msg = `Hi ${assignment.studentName}, your project folder for "${master.title}" is ready on Google Drive: ${assignment.googleDriveLink}\n\nPlease start your work.`;
                                              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                            }}
                                            className="p-1 px-2 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold hover:bg-green-100 flex items-center gap-1 shadow-sm"
                                            title="Share Google Drive Link via WhatsApp"
                                          >
                                            <MessageCircle className="w-3 h-3" /> WhatsApp
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => {
                                            setProjectToReview(assignment);
                                            setCorrectionPdfUrl(assignment.correctionPdfUrl || '');
                                          }}
                                          className="p-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"
                                          title="Review Project"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => navigate(`/project/${assignment.id}`)}
                                          className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                          title="View Project"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDuplicateProject(assignment)}
                                          className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                          title="Duplicate Project"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => setAssignmentToDelete(assignment)}
                                          className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 ml-1"
                                          title="Remove Student"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {projects.filter(p => p.masterProjectId === master.id && p.status === 'approved').map(assignment => (
                                    <div key={assignment.id} className="flex items-center justify-between bg-green-50/50 p-2 rounded-lg border border-green-100/50 grayscale-[0.5] opacity-80">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">{assignment.studentName} (Appr.)</span>
                                        <span className="text-[10px] text-gray-400">{assignment.clientBrief?.projectNumber || assignment.projectCode}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <ProjectStatusDropdown
                                          status={assignment.status}
                                          assignmentId={assignment.id}
                                          onChange={async (newStatus) => {
                                            if (true) {
                                              try {
                                                await updateDoc(doc(db, 'student_projects', assignment.id), {
                                                  status: newStatus,
                                                  workStatus: newStatus === 'approved' ? 'Completed' : 'In Progress',
                                                  updatedAt: new Date().toISOString()
                                                });
                                              } catch (err) {
                                                handleFirestoreError(err, OperationType.UPDATE, `student_projects/${assignment.id}`);
                                              }
                                            }
                                          }}
                                        />
                                        {assignment.googleDriveLink && (
                                          <button 
                                            onClick={() => {
                                              const student = students.find(s => s.id === assignment.studentId);
                                              const phone = student?.whatsapp || student?.phone || '';
                                              const cleanPhone = phone.replace(/\D/g, '');
                                              
                                              if (!cleanPhone) {
                                                alert(`Phone number for ${assignment.studentName} is missing in their profile.`);
                                                return;
                                              }
                                              
                                              const msg = `Hi ${assignment.studentName}, your project folder for "${master.title}" is ready on Google Drive: ${assignment.googleDriveLink}\n\nPlease start your work.`;
                                              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                            }}
                                            className="p-1 px-2 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold hover:bg-green-100 flex items-center gap-1 shadow-sm"
                                            title="Share Google Drive Link via WhatsApp"
                                          >
                                            <MessageCircle className="w-3 h-3" /> WhatsApp
                                          </button>
                                        )}
                                        {assignment.isFilesCleanedUp ? (
                                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                                            <Trash2 className="w-2.5 h-2.5" /> Cleaned
                                          </span>
                                        ) : (
                                          <button 
                                            onClick={() => setCleanupAssignment(assignment)}
                                            className="px-2 py-1 bg-white text-orange-600 border border-orange-200 rounded text-[10px] font-bold hover:bg-orange-50 flex items-center gap-1 shadow-sm"
                                            title="Remove files from cloud to save cost"
                                          >
                                            <Wind className="w-3 h-3" /> Cleanup
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                            <button 
                              onClick={() => {
                                setAssigningMasterProject(master);
                                setAssignForm([]);
                                setShowAssignModal(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-pink-50 text-pink-600 px-3 py-2 rounded-xl text-sm font-bold hover:bg-pink-100 transition-colors"
                            >
                              <UserPlus className="w-4 h-4" /> Assign
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintMasterProject(master);
                              }}
                              className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                              title="Print / Download PDF Brief"
                            >
                              <Printer className="w-5 h-5 pointer-events-none" />
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const now = new Date();
                                  const { id, createdAt, updatedAt, ...projectData } = master;
                                  
                                  // Remove undefined values to prevent Firestore errors
                                  const cleanData = JSON.parse(JSON.stringify(projectData));

                                  await addDoc(collection(db, 'master_projects'), {
                                    ...cleanData,
                                    title: `${master.title} (Copy)`,
                                    createdAt: now.toISOString(),
                                    updatedAt: now.toISOString()
                                  });
                                } catch (err) {
                                  console.error(err);
                                  handleFirestoreError(err, OperationType.CREATE, 'master_projects');
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors"
                              title="Duplicate Project Template"
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                const existingAssignments = projects
                                  .filter(p => p.masterProjectId === master.id)
                                  .map(p => ({ 
                                    studentId: p.studentId, 
                                    cloudPath: p.cloudPath || '',
                                    googleDriveLink: p.googleDriveLink || '' 
                                  }));

                                setEditingProjectId(master.id);
                                setProjectForm({
                                  title: master.title,
                                  studentId: '',
                                  studentAssignments: existingAssignments,
                                  courseId: master.courseId || '',
                                  details: master.details,
                                  cloudPath: master.cloudPath || '',
                                  projectFileUrl: master.projectFileUrl || '',
                                  googleDriveLink: master.googleDriveLink || '',
                                  supportDocuments: master.supportDocuments ? master.supportDocuments.join(', ') : '',
                                  stageEstimates: master.stageEstimates || {
                                    client: 10, preflight: 10, production: 30, pqc: 10, qc: 10
                                  },
                                  preflightChecklist: master.preflightChecklist || [
                                    'Check if all fonts are embedded or outlined',
                                    'Verify image resolution is at least 300 DPI',
                                    'Check if color mode is CMYK',
                                    'Verify bleed settings (minimum 3mm)',
                                    'Check for overprint settings on black text',
                                    'Verify barcode readability and BWR',
                                    'Check if all links are updated and not missing'
                                  ],
                                  productionChecklist: master.productionChecklist || [
                                    'Verify dimensions match the die-line',
                                    'Check for correct trapping settings',
                                    'Verify color separation and spot colors',
                                    'Check for correct overprint/knockout settings',
                                    'Verify eye-mark position and color',
                                    'Check for correct rich black values',
                                    'Verify all text is legible and correctly spelled'
                                  ],
                                  clientBrief: {
                                    brandName: '', packType: '', variantName: '', fileName: '', netWeight: '', baseFileName: '', edName: '', referenceFileName: '', masterJob: '', annotationPdfName: '', jobBrief: '',
                                    ...(master.clientBrief || {})
                                  },
                                  printerSpec: {
                                    printMethod: '', printingSubstrate: '', faceReversePrint: '', maxColors: '', varnishIncluded: '',
                                    barcodes: [{ codeType: '', codeNumber: '', codeColour: '', bwr: '', magnification: '', narrowBar: '' }],
                                    colorRotation: Array.from({ length: 15 }, () => ({ colorName: '', lineScreen: '', lpi: '', dotType: '', angle: '', new: '' })),
                                    artworkInfo: {
                                      minLineThicknessPos: '', minLineThicknessRev: '', minTextSizePos: '', minTextSizeRev: '',
                                      minTypeMultiColorPos: '', minTypeMultiColorRev: '', minSymbolSizePos: '', minSymbolSizeNeg: '',
                                      xHeight: '', bleed: '', rollover: '', typeSafety: '', minDotSize: '', maxTonalValue: '', maxInkCoverage: ''
                                    },
                                    eyeMark: { size: '', colour: '', position: '', underColourPullback: '' },
                                    microdot: { location1: '', location2: '', size: '' },
                                    richBlack: { cyan: '', yellow: '', magenta: '', black: '' },
                                    trappingBleed: { minTrap: '', maxTrap: '', standardTrap: '', metalicTrap: '', ctStandardTrap: '', ctMinTrap: '', ctMaxTrap: '', varnishTrap: '' },
                                    pullbackHoldback: { generalPullback: '', whitePullback1: '', whitePullback2: '', varnishPullback: '', keyline: '' },
                                    proofingProfile: '', preferredFormat: '',
                                    ...(master.printerSpec || {})
                                  }
                                });
                                setShowCreateProjectModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Edit Project Template"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToDelete(master.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Project Template"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              {masterProjects.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <FolderKanban className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No project templates found. Create one to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'qc' && (
          <div className="p-0">
            <PublicQcPanel />
          </div>
        )}

        {activeTab === 'webinar' && (
          <div className="p-0">
            <AdminWebinarPanel />
          </div>
        )}

      </div>
      {/* Application View Modal */}
      {approvingStudentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {students.find(s => s.id === approvingStudentId)?.isApproved 
                ? 'Edit Student Financials/EMI' 
                : 'Approve Student'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {students.find(s => s.id === approvingStudentId)?.isApproved 
                ? 'Update the EMI, rules, and financials for this student.'
                : 'Please enter the Registration Number (Biometric ID) for this student. Type "None" if strictly not available.'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="e.g., REG-2024-001"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manual Base Fee (₹)
                </label>
                <input
                  type="number"
                  value={manualBaseFee}
                  onChange={(e) => setManualBaseFee(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="e.g., 70000 (Overrides automatic calculation)"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Leave empty to use automatic calculation (Sum of course fees).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Concession
                </label>
                <select
                  value={concessionApplied}
                  onChange={(e) => setConcessionApplied(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="none">None</option>
                  <option value="single-parent">Single Parent ({financialSettings?.singleParentConcessionPercentage ?? 10}% Off)</option>
                  <option value="transgender">Transgender ({financialSettings?.transgenderConcessionPercentage ?? 75}% Off)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EMI Plan
                </label>
                <select
                  value={emiPlan}
                  onChange={(e) => setEmiPlan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 mb-2"
                >
                  <option value="none">None / Full Payment</option>
                  <option value="standard">Standard (Based on Course Duration)</option>
                  <option value="1">Full Payment (1 Installment)</option>
                  <option value="2">2 Installments (0% Interest if Fee &gt; 69k)</option>
                  <option value="custom">Custom EMI Plan...</option>
                </select>
                {emiPlan === 'custom' && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">Number of Installments:</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={customEmiCount}
                      onChange={(e) => setCustomEmiCount(parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referrer Type
                </label>
                <select
                  value={referrerType}
                  onChange={(e) => setReferrerType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="direct">Direct (No Referral)</option>
                  <option value="internal">Internal (Telecaller - 2%)</option>
                  <option value="external">External (Partner/Alumni - 5%)</option>
                </select>
              </div>

              {referrerType !== 'direct' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referred By
                    </label>
                    <div className="flex gap-2">
                      <select 
                        className="w-1/3 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        value={referredBy === 'none' ? 'none' : 'name'}
                        onChange={(e) => {
                          if (e.target.value === 'none') setReferredBy('none');
                          else setReferredBy('');
                        }}
                      >
                        <option value="name">Specify Name</option>
                        <option value="none">None</option>
                      </select>
                      {referredBy !== 'none' && (
                        <input
                          type="text"
                          value={referredBy}
                          onChange={(e) => setReferredBy(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Referrer Name or ID"
                        />
                      )}
                    </div>
                  </div>
                  {referredBy !== 'none' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Referrer Contact Number
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={referrerCountryCode}
                          onChange={(e) => setReferrerCountryCode(e.target.value)}
                          className="w-24 px-2 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-gray-50"
                        >
                          <option value="+91">+91 (IN)</option>
                          <option value="+1">+1 (US/CA)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+971">+971 (UAE)</option>
                          <option value="+61">+61 (AU)</option>
                          <option value="+65">+65 (SG)</option>
                          <option value="+60">+60 (MY)</option>
                        </select>
                        <input
                          type="tel"
                          value={referrerContact}
                          onChange={(e) => setReferrerContact(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="Enter contact number"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setApprovingStudentId(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveConfirm}
                  disabled={
                    !registrationNumber.trim() || 
                    (referrerType !== 'direct' && referredBy !== 'none' && (!referredBy.trim() || !referrerContact.trim()))
                  }
                  className="px-4 py-2 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reschedulingDemoStudentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Reschedule Demo</h3>
                <p className="text-pink-100 text-xs mt-1">Update demo date and time</p>
              </div>
              <button 
                onClick={() => setReschedulingDemoStudentId(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setReschedulingDemoStudentId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleDemo}
                disabled={!rescheduleDate || !rescheduleTime}
                className="px-4 py-2 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingApplication && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Application Details</h3>
                <p className="text-pink-100 text-xs mt-1">Submitted application form data</p>
              </div>
              <button 
                onClick={() => {
                  setViewingApplication(null);
                  setViewingApplicationStudentId(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.fullName}</p>
                    </div>
                    {(viewingApplication.mobileNumber || viewingApplication.phone) && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Mobile Number</p>
                        <a 
                          href={`tel:${(viewingApplication.mobileCountryCode || '+91').replace(/\s+/g, '')}${(viewingApplication.mobileNumber || viewingApplication.phone || '').replace(/\s+/g, '')}`}
                          className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
                        >
                          {viewingApplication.mobileCountryCode || '+91'} {viewingApplication.mobileNumber || viewingApplication.phone}
                        </a>
                      </div>
                    )}
                    {viewingApplication.emergencyContact && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Emergency Contact</p>
                        <a 
                          href={`tel:${(viewingApplication.emergencyCountryCode || '+91').replace(/\s+/g, '')}${(viewingApplication.emergencyContact || '').replace(/\s+/g, '')}`}
                          className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
                        >
                          {viewingApplication.emergencyCountryCode || '+91'} {viewingApplication.emergencyContact}
                        </a>
                      </div>
                    )}
                    {viewingApplication.bloodGroup && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Blood Group</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.bloodGroup}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.dob}</p>
                    </div>
                    {viewingApplication.gender && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Gender</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.gender}</p>
                      </div>
                    )}
                    {viewingApplication.placeOfBirth && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Place of Birth</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.placeOfBirth}</p>
                      </div>
                    )}
                    {viewingApplication.nationality && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Nationality</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.nationality}</p>
                      </div>
                    )}
                    {viewingApplication.homeAddress && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Home Address</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.homeAddress}</p>
                      </div>
                    )}
                    {viewingApplication.temporaryAddress && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Temporary Address</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.temporaryAddress}</p>
                      </div>
                    )}
                    {viewingApplication.preferredDate && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Preferred Demo Date</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.preferredDate}</p>
                      </div>
                    )}
                    {viewingApplication.preferredTime && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Preferred Demo Time</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.preferredTime}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Educational Background</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Highest Qualification</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.qualification}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">University/College</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.university}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Graduation Year</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.graduationYear}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Professional Experience</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Current Role</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.currentRole}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Company</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.company}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Experience (Years)</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.experienceYears}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Study Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Mode of Study</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{viewingApplication.modeOfStudy || 'Not Specified'}</p>
                    </div>
                    {viewingApplication.branch && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Study Center (Branch)</p>
                        <p className="text-sm font-medium text-gray-900">{viewingApplication.branch}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditingApplication(true)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Data
              </button>
              <button 
                onClick={() => {
                  setViewingApplication(null);
                  setViewingApplicationStudentId(null);
                }}
                className="px-8 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingTestResults && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Entrance Test Results</h3>
                <p className="text-blue-100 text-xs mt-1">Student: {viewingTestStudentName}</p>
              </div>
              <button 
                onClick={() => setViewingTestResults(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Score</p>
                  <p className="text-2xl font-black text-blue-900">{viewingTestResults.totalMarks} / {viewingTestResults.maxMarks}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">MCQ Score</p>
                  <p className="text-2xl font-black text-green-900">{viewingTestResults.mcqMarks} / 20</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 border-b pb-2">AI Evaluation Feedback</h4>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{viewingTestResults.aiEvaluation?.feedback}"</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Story 1 Translation</p>
                      <p className="text-sm font-bold text-gray-900">{viewingTestResults.aiEvaluation?.marks?.story1} / 10</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Story 2 Translation</p>
                      <p className="text-sm font-bold text-gray-900">{viewingTestResults.aiEvaluation?.marks?.story2} / 10</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Listening Practice</p>
                      <p className="text-sm font-bold text-gray-900">{viewingTestResults.aiEvaluation?.marks?.listening} / 10</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Paragraph Writing</p>
                      <p className="text-sm font-bold text-gray-900">{viewingTestResults.aiEvaluation?.marks?.paragraph} / 10</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Story Understanding</p>
                      <p className="text-sm font-bold text-gray-900">{viewingTestResults.aiEvaluation?.marks?.partF} / 10</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 border-b pb-2">Student Submissions</h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Story 1 Translation ({viewingTestResults.nativeLanguage})</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingTestResults.answers?.partC?.story1}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Story 2 Translation ({viewingTestResults.nativeLanguage})</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingTestResults.answers?.partC?.story2}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Listening Practice Translation ({viewingTestResults.nativeLanguage})</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingTestResults.answers?.partD_listening}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Paragraph: My Daily Routine</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingTestResults.answers?.partE_paragraph}</p>
                  </div>
                  {viewingTestResults.answers?.partF && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Part F - The Starfish Thrower</p>
                      <div className="space-y-4">
                        {['q1', 'q2', 'q3', 'q4', 'q5'].map((id, idx) => (
                          <div key={id} className="border-l-2 border-blue-200 pl-3">
                            <p className="text-[10px] font-bold text-blue-600 mb-1">Question {idx + 1}</p>
                            <p className="text-sm text-gray-700">{viewingTestResults.answers.partF[id] || 'No answer'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setViewingTestResults(null)}
                className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingApplication && viewingApplication && viewingApplicationStudentId && (
        <ApplicationEditModal
          studentId={viewingApplicationStudentId}
          initialName={students.find(s => s.id === viewingApplicationStudentId)?.name}
          initialEmail={students.find(s => s.id === viewingApplicationStudentId)?.email}
          applicationData={viewingApplication}
          onClose={() => setIsEditingApplication(false)}
          onSave={(updated) => {
            if (updated.applicationData) setViewingApplication(updated.applicationData);
            setIsEditingApplication(false);
          }}
        />
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Grade Submission</h3>
                <p className="text-pink-100 text-xs mt-1">Enter marks before approving</p>
              </div>
              <button 
                onClick={() => setGradingSubmission(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Marks (Max: {gradingSubmission.maxScore})</label>
                <input
                  type="number"
                  min="0"
                  max={gradingSubmission.maxScore}
                  value={gradingMark}
                  onChange={(e) => setGradingMark(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder={`Enter marks out of ${gradingSubmission.maxScore}`}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setGradingSubmission(null)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (gradingMark === '' || gradingMark < 0 || gradingMark > gradingSubmission.maxScore) {
                    alert(`Please enter a valid mark between 0 and ${gradingSubmission.maxScore}`);
                    return;
                  }
                  handleSubmissionStatus(
                    gradingSubmission.studentId,
                    gradingSubmission.course,
                    gradingSubmission.topic,
                    gradingSubmission.type,
                    'approved',
                    Number(gradingMark)
                  );
                }}
                className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100"
              >
                Submit Grade & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingFacultySchedule && (
        <FacultyAvailabilityModal
          faculty={viewingFacultySchedule}
          onClose={() => setViewingFacultySchedule(null)}
        />
      )}

      {/* Create Live Session Modal */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
              <div>
                <h3 className="text-xl font-bold">{editingSessionId ? 'Edit Class' : (newSessionType === 'demo' ? 'Create Demo Class' : 'Create Live Class')}</h3>
                <p className="text-pink-100 text-xs mt-1">{editingSessionId ? 'Update virtual classroom details' : 'Start a new virtual classroom'}</p>
              </div>
              <button 
                onClick={() => setShowCreateSessionModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Title</label>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder={newSessionType === 'demo' ? "e.g., Free Trial Demo" : "e.g., Introduction to Production Art Engineer"}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Faculty</label>
                <select
                  value={newSessionFacultyId}
                  onChange={(e) => setNewSessionFacultyId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Faculty</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled For</label>
                <input
                  type="datetime-local"
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              {(newSessionType === 'interview' || newSessionType === 'hr_interview') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer Email (Manager/HR)</label>
                  <input
                    type="email"
                    value={newSessionInterviewerEmail}
                    onChange={(e) => setNewSessionInterviewerEmail(e.target.value)}
                    placeholder="manager@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Students</label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {students
                    .filter(s => newSessionType === 'demo' ? (s.registeredForDemo && !s.isApproved) : s.isApproved)
                    .filter(s => newSessionFacultyId ? s.assignedFacultyId === newSessionFacultyId : true)
                    .map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newSessionStudentIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSessionStudentIds([...newSessionStudentIds, s.id]);
                          } else {
                            setNewSessionStudentIds(newSessionStudentIds.filter(id => id !== s.id));
                          }
                        }}
                        className="text-pink-600 focus:ring-pink-500 rounded"
                      />
                      <span className="text-sm text-gray-700">{s.name} ({s.username})</span>
                    </label>
                  ))}
                  {students
                    .filter(s => newSessionType === 'demo' ? (s.registeredForDemo && !s.isApproved) : s.isApproved)
                    .filter(s => newSessionFacultyId ? s.assignedFacultyId === newSessionFacultyId : true)
                    .length === 0 && (
                    <p className="text-sm text-gray-500 p-2 text-center">No students available for this type.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowCreateSessionModal(false)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!newSessionTitle.trim()) {
                    alert('Please enter a class title');
                    return;
                  }
                  if (!newSessionFacultyId) {
                    alert('Please select a faculty member');
                    return;
                  }
                  if (!newSessionDate) {
                    alert('Please select a date and time');
                    return;
                  }
                  if (newSessionStudentIds.length === 0) {
                    alert('Please select at least one student');
                    return;
                  }
                  
                  const selectedFaculty = faculty.find(f => f.id === newSessionFacultyId);
                  const selectedStudents = students
                    .filter(s => newSessionStudentIds.includes(s.id))
                    .map(s => ({ id: s.id, name: s.name }));
                  
                  if (editingSessionId) {
                    updateDoc(doc(db, 'live_sessions', editingSessionId), {
                      title: newSessionTitle,
                      facultyId: newSessionFacultyId,
                      facultyName: selectedFaculty?.name || 'Unknown Faculty',
                      students: selectedStudents,
                      studentIds: selectedStudents.map(s => s.id),
                      scheduledFor: new Date(newSessionDate).toISOString(),
                      type: newSessionType,
                      interviewerEmail: newSessionInterviewerEmail
                    }).then(() => {
                      setShowCreateSessionModal(false);
                      setEditingSessionId(null);
                      setNewSessionTitle('');
                      setNewSessionFacultyId('');
                      setNewSessionStudentIds([]);
                      setNewSessionDate('');
                      setNewSessionInterviewerEmail('');
                    }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${editingSessionId}`));
                  } else {
                    const roomId = `EndlessSpark-${Math.random().toString(36).substring(2, 10)}`;
                    addDoc(collection(db, 'live_sessions'), {
                      title: newSessionTitle,
                      roomId,
                      facultyId: newSessionFacultyId,
                      facultyName: selectedFaculty?.name || 'Unknown Faculty',
                      students: selectedStudents,
                      studentIds: selectedStudents.map(s => s.id),
                      scheduledFor: new Date(newSessionDate).toISOString(),
                      status: 'scheduled',
                      type: newSessionType,
                      interviewerEmail: newSessionInterviewerEmail,
                      createdAt: new Date().toISOString()
                    }).then(() => {
                      setShowCreateSessionModal(false);
                      setNewSessionTitle('');
                      setNewSessionFacultyId('');
                      setNewSessionStudentIds([]);
                      setNewSessionDate('');
                      setNewSessionInterviewerEmail('');
                      
                      // If it's an interview, open mail client
                      if ((newSessionType === 'interview' || newSessionType === 'hr_interview') && newSessionInterviewerEmail) {
                        const interviewLink = `${window.location.origin}/interview/${roomId}`;
                        const subject = encodeURIComponent(`Interview Scheduled: ${newSessionTitle}`);
                        const body = encodeURIComponent(`Hello,\n\nYou have been scheduled to conduct an interview.\n\nStudent(s): ${selectedStudents.map(s => s.name).join(', ')}\nDate & Time: ${new Date(newSessionDate).toLocaleString()}\n\nPlease join the interview and provide your feedback using this link:\n${interviewLink}\n\nThank you.`);
                        window.open(`mailto:${newSessionInterviewerEmail}?subject=${subject}&body=${body}`, '_blank');
                      }
                    }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'live_sessions'));
                  }
                }}
                className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
              >
                {editingSessionId ? 'Save Changes' : (newSessionType === 'demo' ? 'Create Demo Class' : 'Create Class')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Template?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this project template? This will also delete all associated student assignments. This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setProjectToDelete(null)}
                className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const linkedProjects = projects.filter(p => p.masterProjectId === projectToDelete);
                    if (linkedProjects.length > 0) {
                      const batch = writeBatch(db);
                      linkedProjects.forEach(lp => {
                        batch.delete(doc(db, 'student_projects', lp.id));
                      });
                      await batch.commit();
                    }
                    await deleteDoc(doc(db, 'master_projects', projectToDelete));
                    setProjectToDelete(null);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.DELETE, `master_projects/${projectToDelete}`);
                    alert('Failed to delete template: ' + (err instanceof Error ? err.message : 'Unknown error'));
                  }
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Assignment Modal */}
      {assignmentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Assignment?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove the assignment for student <strong className="text-gray-900">{assignmentToDelete.studentName}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setAssignmentToDelete(null)}
                className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await deleteDoc(doc(db, 'student_projects', assignmentToDelete.id));
                    setAssignmentToDelete(null);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.DELETE, `student_projects/${assignmentToDelete.id}`);
                    alert('Failed to delete assignment: ' + (err instanceof Error ? err.message : 'Unknown error'));
                  }
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Assignment Files Modal */}
      {cleanupAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wind className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clean Cloud Files?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Mark cloud files for <strong className="text-gray-900">{cleanupAssignment.studentName}</strong> as REMOVED to save cost?
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setCleanupAssignment(null)}
                className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await updateDoc(doc(db, 'student_projects', cleanupAssignment.id), {
                      isFilesCleanedUp: true,
                      updatedAt: new Date().toISOString()
                    });
                    setCleanupAssignment(null);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.UPDATE, `student_projects/${cleanupAssignment.id}`);
                    alert('Failed to clean up files: ' + (err instanceof Error ? err.message : 'Unknown error'));
                  }
                }}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100"
              >
                Cleanup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Live Class?</h3>
              <p className="text-gray-500 text-sm">
                Are you sure you want to delete this live class? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteDoc(doc(db, 'live_sessions', sessionToDelete))
                    .then(() => setSessionToDelete(null))
                    .catch(err => handleFirestoreError(err, OperationType.DELETE, `live_sessions/${sessionToDelete}`));
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Recording URL Modal */}
      {sessionToUpdateRecording && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Add Recording Link</h3>
                <p className="text-blue-100 text-xs mt-1">Provide a Google Drive link to the recording</p>
              </div>
              <button 
                onClick={() => setSessionToUpdateRecording(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Link</label>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setSessionToUpdateRecording(null)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateDoc(doc(db, 'live_sessions', sessionToUpdateRecording), {
                    recordingUrl
                  }).then(() => {
                    setSessionToUpdateRecording(null);
                    setRecordingUrl('');
                  }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${sessionToUpdateRecording}`));
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Payout Modal */}
      {payoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Record Payout</h3>
                <p className="text-pink-100 text-xs mt-1">Enter the amount paid to the referrer</p>
              </div>
              <button 
                onClick={() => setPayoutModal(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  value={payoutModal.amount}
                  onChange={(e) => setPayoutModal({ ...payoutModal, amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., 5000"
                  min="1"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setPayoutModal(null)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRecordPayout}
                disabled={payoutModal.amount <= 0}
                className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Record Payout
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
              <div>
                <h3 className="text-xl font-bold">{editingProjectId ? 'Edit Project' : 'Create Project'}</h3>
                <p className="text-pink-100 text-xs mt-1">Assign a new project to a student.</p>
              </div>
              <button 
                onClick={() => setShowCreateProjectModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                className={cn("flex-1 py-3 text-sm font-bold transition-colors border-b-2", projectModalTab === 'general' ? "border-pink-600 text-pink-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700")}
                onClick={() => setProjectModalTab('general')}
              >
                General Settings
              </button>
              <button
                className={cn("flex-1 py-3 text-sm font-bold transition-colors border-b-2", projectModalTab === 'clientBrief' ? "border-pink-600 text-pink-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700")}
                onClick={() => setProjectModalTab('clientBrief')}
              >
                Client Brief
              </button>
              <button
                className={cn("flex-1 py-3 text-sm font-bold transition-colors border-b-2", projectModalTab === 'printerSpec' ? "border-pink-600 text-pink-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700")}
                onClick={() => setProjectModalTab('printerSpec')}
              >
                Printer Spec
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {projectModalTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                    <input
                      type="text"
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                      placeholder="e.g., Brand Identity Design"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <select
                      value={projectForm.courseId}
                      onChange={(e) => setProjectForm({ ...projectForm, courseId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    >
                      <option value="">Select Course</option>
                      {courseModules.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Students</label>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-2">
                      {students
                        .filter(s => {
                          const isApproved = s.isApproved;
                          const courseMatch = !projectForm.courseId || s.assignedCourse === projectForm.courseId;
                          return isApproved && courseMatch;
                        })
                        .map(s => {
                          const assignment = projectForm.studentAssignments.find(a => a.studentId === s.id);
                          const isAssigned = !!assignment;
                          return (
                            <div key={s.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setProjectForm({
                                        ...projectForm,
                                        studentAssignments: [...projectForm.studentAssignments, { studentId: s.id, cloudPath: '', googleDriveLink: '' }]
                                      });
                                    } else {
                                      setProjectForm({
                                        ...projectForm,
                                        studentAssignments: projectForm.studentAssignments.filter(a => a.studentId !== s.id)
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                                />
                                <span className="font-medium text-gray-900">{s.name} ({s.username})</span>
                              </label>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Project Details</label>
                      <button
                        onClick={enhanceProjectDetails}
                        disabled={enhancingDetails}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold hover:bg-pink-100 transition-colors disabled:opacity-50"
                      >
                        {enhancingDetails ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {enhancingDetails ? 'Enhancing...' : 'Enhance with AI'}
                      </button>
                    </div>
                    <textarea
                      value={projectForm.details}
                      onChange={(e) => setProjectForm({ ...projectForm, details: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none min-h-[100px]"
                      placeholder="Describe the project requirements..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Folder Link</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={projectForm.googleDriveLink}
                        onChange={(e) => setProjectForm({ ...projectForm, googleDriveLink: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                        placeholder="https://drive.google.com/drive/folders/..."
                      />
                      <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">This link will be shared with the student for file access.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Support Documents (URL or Upload)</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={projectForm.supportDocuments}
                          onChange={(e) => setProjectForm({ ...projectForm, supportDocuments: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                          placeholder="Paste URL or upload below..."
                        />
                        <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <FileUploader 
                        path="project_support"
                        onUploadComplete={(url) => {
                          const current = projectForm.supportDocuments;
                          const updated = current ? `${current}, ${url}` : url;
                          setProjectForm({ ...projectForm, supportDocuments: updated });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Stage Estimated Times (minutes)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Client</label>
                        <input
                          type="number"
                          value={projectForm.stageEstimates.client}
                          onChange={(e) => setProjectForm({ 
                            ...projectForm, 
                            stageEstimates: { ...projectForm.stageEstimates, client: Number(e.target.value) } 
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Preflight</label>
                        <input
                          type="number"
                          value={projectForm.stageEstimates.preflight}
                          onChange={(e) => setProjectForm({ 
                            ...projectForm, 
                            stageEstimates: { ...projectForm.stageEstimates, preflight: Number(e.target.value) } 
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Production</label>
                        <input
                          type="number"
                          value={projectForm.stageEstimates.production}
                          onChange={(e) => setProjectForm({ 
                            ...projectForm, 
                            stageEstimates: { ...projectForm.stageEstimates, production: Number(e.target.value) } 
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">PQC</label>
                        <input
                          type="number"
                          value={projectForm.stageEstimates.pqc}
                          onChange={(e) => setProjectForm({ 
                            ...projectForm, 
                            stageEstimates: { ...projectForm.stageEstimates, pqc: Number(e.target.value) } 
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">QC</label>
                        <input
                          type="number"
                          value={projectForm.stageEstimates.qc}
                          onChange={(e) => setProjectForm({ 
                            ...projectForm, 
                            stageEstimates: { ...projectForm.stageEstimates, qc: Number(e.target.value) } 
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {projectModalTab === 'clientBrief' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Number</label>
                    <input
                      type="text"
                      disabled
                      value={(projectForm.clientBrief as any)?.projectNumber || '[Auto-generated from student DOB upon assignment]'}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none"
                    />
                  </div>
                  {[
                    { key: 'brandName', label: 'Brand Name' },
                    { key: 'packType', label: 'Pack Type' },
                    { key: 'variantName', label: 'Variant Name' },
                    { key: 'netWeight', label: 'Net Weight' },
                    { key: 'baseFileName', label: 'Base File Name' },
                    { key: 'edName', label: 'ED Name' },
                    { key: 'referenceFileName', label: 'Reference File Name' },
                    { key: 'masterJob', label: 'Master Job' },
                    { key: 'annotationPdfName', label: 'Annotation PDF Name' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={projectForm.clientBrief[key as keyof typeof projectForm.clientBrief]}
                        onChange={(e) => setProjectForm({ 
                          ...projectForm, 
                          clientBrief: { ...projectForm.clientBrief, [key]: e.target.value } 
                        })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                      />
                    </div>
                  ))}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Name (Auto-generated)</label>
                    <input
                      type="text"
                      disabled
                      value={`[Project Number]_${projectForm.clientBrief.brandName}_${projectForm.clientBrief.packType}_${projectForm.clientBrief.variantName}_${projectForm.clientBrief.netWeight}`}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Job Brief</label>
                      <button
                        onClick={enhanceJobBrief}
                        disabled={enhancingBrief}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold hover:bg-pink-100 transition-colors disabled:opacity-50"
                      >
                        {enhancingBrief ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {enhancingBrief ? 'Enhancing...' : 'Enhance with AI'}
                      </button>
                    </div>
                    <textarea
                      value={projectForm.clientBrief.jobBrief}
                      onChange={(e) => setProjectForm({ 
                        ...projectForm, 
                        clientBrief: { ...projectForm.clientBrief, jobBrief: e.target.value } 
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none min-h-[200px]"
                      placeholder="Enter job brief here..."
                    />
                  </div>
                </div>
              )}

              {projectModalTab === 'printerSpec' && (
                <div>
                  <PrinterSpecForm projectForm={projectForm} setProjectForm={setProjectForm} />
                </div>
              )}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowCreateProjectModal(false)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!projectForm.title) {
                    alert('Please enter a project title.');
                    return;
                  }

                  const course = courseModules.find(c => c.id === projectForm.courseId);
                  const totalEstTime = Object.values(projectForm.stageEstimates).reduce((sum, val) => sum + (Number(val) || 0), 0);
                  const now = new Date();
                  const slaDateString = calculateSLADate(now, holidays);

                  const baseProjectData: any = {
                    title: projectForm.title,
                    courseId: projectForm.courseId,
                    courseName: course?.title || 'General',
                    details: projectForm.details,
                    googleDriveLink: projectForm.googleDriveLink,
                    supportDocuments: projectForm.supportDocuments.split(',').map(s => s.trim()).filter(s => s),
                    estimatedTime: totalEstTime,
                    stageEstimates: {
                      client: Number(projectForm.stageEstimates.client) || 0,
                      preflight: Number(projectForm.stageEstimates.preflight) || 0,
                      production: Number(projectForm.stageEstimates.production) || 0,
                      pqc: Number(projectForm.stageEstimates.pqc) || 0,
                      qc: Number(projectForm.stageEstimates.qc) || 0,
                    },
                    preflightChecklist: projectForm.preflightChecklist,
                    productionChecklist: projectForm.productionChecklist,
                    clientBrief: projectForm.clientBrief,
                    printerSpec: projectForm.printerSpec,
                    updatedAt: now.toISOString()
                  };

                  try {
                    if (editingProjectId) {
                      await updateDoc(doc(db, 'master_projects', editingProjectId), baseProjectData);
                      
                      const linkedProjects = projects.filter(p => p.masterProjectId === editingProjectId);
                      const batch = writeBatch(db);
                      
                      for (const assignment of projectForm.studentAssignments) {
                        const matchedProjects = linkedProjects.filter(p => p.studentId === assignment.studentId);
                        
                        if (matchedProjects.length > 0) {
                          // Update all existing projects. Handling duplicates.
                          matchedProjects.forEach(existingProject => {
                            const updateData: any = { ...baseProjectData };
                            // Generate fileName for student project based on their projectNumber
                            if (updateData.clientBrief) {
                              updateData.clientBrief = {
                                ...updateData.clientBrief,
                                fileName: `${existingProject.clientBrief?.projectNumber || existingProject.projectCode}_${updateData.clientBrief.brandName}_${updateData.clientBrief.packType}_${updateData.clientBrief.variantName}_${updateData.clientBrief.netWeight}`
                              };
                            }
                            batch.update(doc(db, 'student_projects', existingProject.id), updateData);
                          });
                        } else {
                          // Create new project for newly assigned student
                          const student = students.find(s => s.id === assignment.studentId);
                          if (!student) continue;

                          const studentProjectsCount = projects.filter(p => p.studentId === student.id).length + 1;
                          const namePrefix = student.name.substring(0, 3).toUpperCase();
                          const projectCode = `${student.username}_${namePrefix}_${studentProjectsCount}`;
                          const dobNumber = student.applicationData?.dob ? student.applicationData.dob.replace(/\D/g, '') : '';
                          const projectNumber = `${dobNumber}${studentProjectsCount}`;

                          const newProjectRef = doc(collection(db, 'student_projects'));
                          const newProjectData = {
                            ...baseProjectData,
                            masterProjectId: editingProjectId,
                            studentId: student.id,
                            studentName: student.name,
                            googleDriveLink: baseProjectData.googleDriveLink,
                            projectCode,
                            slaDate: slaDateString,
                            actualTime: 0,
                            lastStageActualTime: 0,
                            status: 'client',
                            qcRejections: [],
                            points: 100,
                            efficiency: 0,
                            createdAt: now.toISOString()
                          };
                          if (newProjectData.clientBrief) {
                            newProjectData.clientBrief = {
                              ...newProjectData.clientBrief,
                              projectNumber: projectNumber,
                              fileName: `${projectNumber}_${newProjectData.clientBrief.brandName}_${newProjectData.clientBrief.packType}_${newProjectData.clientBrief.variantName}_${newProjectData.clientBrief.netWeight}`
                            };
                          }
                          batch.set(newProjectRef, newProjectData);
                        }
                      }
                      
                      await batch.commit();
                    } else {
                      baseProjectData.createdAt = now.toISOString();
                      const masterRef = await addDoc(collection(db, 'master_projects'), baseProjectData);
                      
                      if (projectForm.studentAssignments.length > 0) {
                        const batch = writeBatch(db);
                        for (const assignment of projectForm.studentAssignments) {
                          const student = students.find(s => s.id === assignment.studentId);
                          if (!student) continue;

                          const studentProjectsCount = projects.filter(p => p.studentId === student.id).length + 1;
                          const namePrefix = student.name.substring(0, 3).toUpperCase();
                          const projectCode = `${student.username}_${namePrefix}_${studentProjectsCount}`;
                          const dobNumber = student.applicationData?.dob ? student.applicationData.dob.replace(/\D/g, '') : '';
                          const projectNumber = `${dobNumber}${studentProjectsCount}`;

                          const newProjectRef = doc(collection(db, 'student_projects'));
                          const newProjectData = {
                            ...baseProjectData,
                            masterProjectId: masterRef.id,
                            studentId: student.id,
                            studentName: student.name,
                            googleDriveLink: baseProjectData.googleDriveLink,
                            projectCode,
                            slaDate: slaDateString,
                            actualTime: 0,
                            lastStageActualTime: 0,
                            status: 'client',
                            qcRejections: [],
                            points: 100,
                            efficiency: 0,
                            createdAt: now.toISOString()
                          };
                          if (newProjectData.clientBrief) {
                            newProjectData.clientBrief = {
                              ...newProjectData.clientBrief,
                              projectNumber: projectNumber,
                              fileName: `${projectNumber}_${newProjectData.clientBrief.brandName}_${newProjectData.clientBrief.packType}_${newProjectData.clientBrief.variantName}_${newProjectData.clientBrief.netWeight}`
                            };
                          }
                          batch.set(newProjectRef, newProjectData);
                        }
                        await batch.commit();
                      }
                    }
                    setShowCreateProjectModal(false);
                  } catch (err) {
                    handleFirestoreError(err, editingProjectId ? OperationType.UPDATE : OperationType.WRITE, 'projects');
                  }
                }}
                className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors"
              >
                {editingProjectId ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review QC Modal */}
      {projectToReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 my-8">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Review Project QC</h3>
                <p className="text-orange-100 text-xs mt-1">{projectToReview.title}</p>
              </div>
              <button 
                onClick={() => setProjectToReview(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
              {/* Left Column: Checklists */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h4 className="font-bold text-gray-900 text-sm">Student Checklists</h4>
                  </div>
                  
                  {/* Tab Headers with Status Badges */}
                  <div className="flex border-b border-gray-200 mb-4 bg-white/50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setReviewChecklistTab('preflight')}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        reviewChecklistTab === 'preflight'
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                      }`}
                    >
                      <span>Digital Pre-Flight</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                        reviewChecklistTab === 'preflight'
                          ? 'bg-white/20 text-white'
                          : 'bg-white border border-gray-200 text-gray-500'
                      }`}>
                        {projectToReview.digitalPreflight ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewChecklistTab('production')}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        reviewChecklistTab === 'production'
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                      }`}
                    >
                      <span>Prod. Art PQC</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                        reviewChecklistTab === 'production'
                          ? 'bg-white/20 text-white'
                          : 'bg-white border border-gray-200 text-gray-500'
                      }`}>
                        {projectToReview.digitalProduction ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewChecklistTab('qcProduction')}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        reviewChecklistTab === 'qcProduction'
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                      }`}
                    >
                      <span>QC Production</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                        reviewChecklistTab === 'qcProduction'
                          ? 'bg-white/20 text-white'
                          : 'bg-white border border-gray-200 text-gray-500'
                      }`}>
                        {projectToReview.qcProduction ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewChecklistTab('rework')}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        reviewChecklistTab === 'rework'
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                      }`}
                    >
                      <span>Rework Progress</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                        reviewChecklistTab === 'rework'
                          ? 'bg-white/20 text-white'
                          : 'bg-white border border-gray-200 text-gray-500'
                      }`}>
                        {projectToReview.reworkChecklist ? 'UPDATED' : 'NONE'}
                      </span>
                    </button>
                  </div>

                  {/* Pre-Flight Checklist */}
                  {reviewChecklistTab === 'preflight' && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <DigitalPreFlightChecklist 
                        isAdmin={true} 
                        readOnly={true} 
                        initialData={projectToReview.digitalPreflight} 
                      />
                    </div>
                  )}

                  {/* Production Art Engineer / PQC Checklist */}
                  {reviewChecklistTab === 'production' && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <DigitalProductionArtChecklist 
                        isAdmin={true} 
                        readOnly={true} 
                        initialData={projectToReview.digitalProduction} 
                      />
                    </div>
                  )}

                  {/* QC Production Checklist */}
                  {reviewChecklistTab === 'qcProduction' && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <QcProductionChecklist 
                        readOnly={false} 
                        initialData={projectToReview.qcProduction} 
                        onSave={async (data) => {
                          try {
                            const projectRef = doc(db, 'student_projects', projectToReview.id);
                            await updateDoc(projectRef, {
                              qcProduction: data,
                              updatedAt: new Date().toISOString()
                            });
                            setProjectToReview((prev: any) => ({
                              ...prev,
                              qcProduction: data
                            }));
                            alert("QC Production Art Checklist saved successfully!");
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, `student_projects/${projectToReview.id}`);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Production Rework Checklist (Read Only for Admin during Review) */}
                  {reviewChecklistTab === 'rework' && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden p-4">
                      <ProductionReworkChecklist
                        readOnly={true}
                        qcProductionData={projectToReview.qcProduction || {}}
                        initialReworkData={projectToReview.reworkChecklist}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: QC Decision */}
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-indigo-800">
                    <p className="font-bold mb-1">QC Workflow Guide:</p>
                    <ul className="list-disc pl-3 space-y-1">
                      <li>Review the student's final file using the link below.</li>
                      <li>Check the checklists on the left for completeness.</li>
                      <li>If perfect: Click <strong>Approve Project</strong>.</li>
                      <li>If issues found: Upload <strong>Correction PDF</strong>, add notes, and click <strong>Reject to Production</strong>.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4 mb-4">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <h4 className="font-bold text-orange-900 mb-2">Project Details</h4>
                    <p className="text-sm text-orange-800"><strong>Student:</strong> {projectToReview.studentName}</p>
                    <p className="text-sm text-orange-800"><strong>Est Time:</strong> {projectToReview.estimatedTime}m</p>
                    <p className="text-sm text-orange-800"><strong>Act Time:</strong> {projectToReview.actualTime}m</p>
                    <div className="mt-2 pt-2 border-t border-orange-200">
                      <p className="text-[10px] font-bold text-orange-900 uppercase mb-1">Override Current Stage:</p>
                      <ProjectStatusDropdown
                        status={projectToReview.status}
                        assignmentId={projectToReview.id}
                        onChange={async (newStatus) => {
                            try {
                              await updateDoc(doc(db, 'student_projects', projectToReview.id), {
                                status: newStatus,
                                workStatus: newStatus === 'approved' ? 'Completed' : 'In Progress',
                                updatedAt: new Date().toISOString()
                              });
                              // Update local state to reflect change in modal if needed, 
                              // but since it's firestore onSnapshot it will refresh projects list.
                              // For immediate modal update:
                              setProjectToReview({ ...projectToReview, status: newStatus });
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, `student_projects/${projectToReview.id}`);
                            }
                        }}
                      />
                    </div>
                    {projectToReview.projectFileUrl && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-orange-900 uppercase mb-1">Final Student File:</p>
                        <a 
                          href={projectToReview.projectFileUrl.match(/^https?:\/\//i) ? projectToReview.projectFileUrl : `https://${projectToReview.projectFileUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-white text-pink-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-200 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Project File
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">Share Correction PDF</h4>
                    <p className="text-xs text-blue-700 mb-3">Upload your correction notes and share the link here.</p>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={correctionPdfUrl}
                        onChange={(e) => setCorrectionPdfUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="flex-1 px-4 py-2 text-sm rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'student_projects', projectToReview.id), {
                              correctionPdfUrl,
                              updatedAt: new Date().toISOString()
                            });
                            alert('Correction PDF link updated.');
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, `student_projects/${projectToReview.id}`);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-3">QC Decision</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reject BACK to Stage</label>
                      <select
                        value={qcRejectionForm.targetStage || 'production'}
                        onChange={(e) => setQcRejectionForm({ ...qcRejectionForm, targetStage: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 font-bold text-gray-700 bg-white outline-none"
                      >
                        <option value="preflight">0 - Prepress / Assembly</option>
                        <option value="production">1 - Production Art (Default)</option>
                        <option value="pqc">2 - Production QC / PQC Checklist</option>
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">
                        By default, rejected jobs return to <strong>Production Art</strong>. If there was a prepress/assignment mistake, select <strong>Pre-Flight / Prepress</strong> instead.
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-medium text-gray-700 font-bold">If Rejecting: Error Category (Select Multiple)</label>
                        <button
                          type="button"
                          onClick={async () => {
                            const newCat = window.prompt("Enter new error category name:");
                            if (newCat && newCat.trim()) {
                              const trimmed = newCat.trim();
                              if (qcErrorCategories.includes(trimmed)) {
                                alert("This category already exists.");
                                return;
                              }
                              const updated = [...qcErrorCategories, trimmed];
                              try {
                                await setDoc(doc(db, 'settings', 'admin'), {
                                  qcErrorCategories: updated
                                }, { merge: true });
                                setQcErrorCategories(updated);
                                setQcSelectedCategories(prev => [...prev, trimmed]);
                              } catch (err) {
                                handleFirestoreError(err, OperationType.WRITE, 'settings/admin');
                              }
                            }
                          }}
                          className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add New Error
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-gray-150 rounded-xl">
                        {qcErrorCategories.map((cat, idx) => {
                          const isSelected = qcSelectedCategories.includes(cat);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setQcSelectedCategories(prev =>
                                  prev.includes(cat)
                                    ? prev.filter(c => c !== cat)
                                    : [...prev, cat]
                                );
                              }}
                              className={cn(
                                "px-3 py-1.5 text-xs font-bold uppercase border rounded-lg transition-all focus:outline-none focus:ring-1 select-none cursor-pointer shadow-sm",
                                isSelected
                                  ? "bg-red-600 border-red-700 text-white focus:ring-red-300"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300"
                              )}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={qcRejectionForm.notes}
                        onChange={(e) => setQcRejectionForm({ ...qcRejectionForm, notes: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                        placeholder="Reason for rejection..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-red-600 font-bold">Correction File / PDF</label>
                      <FileUploader 
                        path="corrections"
                        accept="application/pdf,image/*"
                        onUploadComplete={(url) => setQcRejectionForm({ ...qcRejectionForm, correctionPdfUrl: url })}
                        className="mb-2"
                      />
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Manual Link</label>
                        <input
                          type="text"
                          value={qcRejectionForm.correctionPdfUrl}
                          onChange={(e) => setQcRejectionForm({ ...qcRejectionForm, correctionPdfUrl: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border-2 border-red-100 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all text-xs"
                          placeholder="Link to correction PDF/image..."
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 italic">This file will be shared with the student for corrections.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between gap-3">
              <button 
                onClick={async () => {
                  if (!qcRejectionForm.notes) {
                    alert('Please provide notes for rejection.');
                    return;
                  }
                  if (qcSelectedCategories.length === 0) {
                    alert('Please select at least one error category.');
                    return;
                  }
                  try {
                    const newRejection = {
                      timestamp: new Date().toISOString(),
                      errorCategory: qcSelectedCategories.join(', '),
                      notes: qcRejectionForm.notes
                    };
                    const target = qcRejectionForm.targetStage || 'production';
                    await updateDoc(doc(db, 'student_projects', projectToReview.id), {
                      status: target,
                      workStatus: 'Not Started',
                      lastStageActualTime: projectToReview.actualTime || 0,
                      qcRejections: [...(projectToReview.qcRejections || []), newRejection],
                      correctionPdfUrl: qcRejectionForm.correctionPdfUrl || null,
                      points: Math.max(0, (projectToReview.points || 100) - 5),
                      updatedAt: new Date().toISOString()
                    });
                    setProjectToReview(null);
                    setQcRejectionForm({ errorCategory: 'Typography', notes: '', correctionPdfUrl: '', targetStage: 'production' });
                    setQcSelectedCategories(['Typography']);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.UPDATE, `student_projects/${projectToReview.id}`);
                  }
                }}
                className="px-6 py-2 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors"
              >
                Reject to {qcRejectionForm.targetStage === 'preflight' ? 'Pre-Flight' : qcRejectionForm.targetStage === 'pqc' ? 'Production QC' : 'Production'}
              </button>
              
              <button 
                onClick={async () => {
                  if (true) {
                    try {
                      await updateDoc(doc(db, 'student_projects', projectToReview.id), {
                        status: 'production',
                        workStatus: 'In Progress',
                        updatedAt: new Date().toISOString()
                      });
                      console.log("Project successfully reverted to Production stage!");
                      setProjectToReview(null);
                    } catch (err) {
                      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${projectToReview.id}`);
                    }
                  }
                }}
                className="px-4 py-2 border border-dashed border-pink-300 hover:border-pink-500 rounded-xl bg-pink-50/40 text-pink-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-pink-50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-pink-600" />
                Revert to Production
              </button>

              <button 
                onClick={async () => {
                  const qcProd = projectToReview.qcProduction;
                  if (!qcProd) {
                    alert('Quality Rule Violation: You must complete and SAVE the QC Production Art Checklist before approving the project.');
                    setReviewChecklistTab('qcProduction');
                    return;
                  }

                  const hasPendingLocal = (obj: any): boolean => {
                    if (!obj) return false;
                    if (Array.isArray(obj)) return obj.some(item => item === 'pending' || hasPendingLocal(item));
                    if (typeof obj === 'object') return Object.values(obj).some(val => val === 'pending' || hasPendingLocal(val));
                    return false;
                  };

                  if (hasPendingLocal(qcProd)) {
                    alert('Quality Rule Violation: The QC Production Art Checklist is incomplete. Please ensure all "Pending" fields on the checklist are marked (Yes/No/NA/Query) and saved before approving.');
                    setReviewChecklistTab('qcProduction');
                    return;
                  }

                  try {
                    const efficiency = projectToReview.actualTime > 0 
                      ? (projectToReview.estimatedTime / projectToReview.actualTime) * 100 
                      : 100;
                    
                    await updateDoc(doc(db, 'student_projects', projectToReview.id), {
                      status: 'approved',
                      workStatus: 'Completed',
                      correctionPdfUrl: null, // Clear correction if approved
                      efficiency: efficiency,
                      updatedAt: new Date().toISOString()
                    });
                    setProjectToReview(null);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.UPDATE, `student_projects/${projectToReview.id}`);
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                Approve Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 my-8">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
              <div>
                <h3 className="text-xl font-bold">{editingBannerId ? 'Edit Banner' : 'Add New Banner'}</h3>
                <p className="text-pink-100 text-xs mt-1">Configure the dynamic course banner for the landing page.</p>
              </div>
              <button 
                onClick={() => {
                  setShowBannerModal(false);
                  setEditingBannerId(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                {bannerForm.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={bannerForm.imageUrl} alt="Preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Change Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleBannerImageUpload} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Image className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">Click to upload image</span>
                    <span className="text-xs text-gray-400 mt-1">Recommended size: 1200x400 pixels</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerImageUpload} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="e.g., Production Art Engineer"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <select
                      value={bannerForm.level}
                      onChange={(e) => setBannerForm({ ...bannerForm, level: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none uppercase text-sm"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="UP SKILL">Up Skill</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bannerForm.levelPercentage}
                      onChange={(e) => setBannerForm({ ...bannerForm, levelPercentage: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Overview (Bullet Points)</label>
                <div className="space-y-3">
                  {bannerForm.overview.map((point, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="mt-3 text-orange-500">
                        <Check className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => {
                          const newOverview = [...bannerForm.overview];
                          newOverview[index] = e.target.value;
                          setBannerForm({ ...bannerForm, overview: newOverview });
                        }}
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                        placeholder={`Bullet point ${index + 1}`}
                      />
                      {index === bannerForm.overview.length - 1 && bannerForm.overview.length < 5 && (
                        <button
                          onClick={() => setBannerForm({ ...bannerForm, overview: [...bannerForm.overview, ''] })}
                          className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                      {bannerForm.overview.length > 1 && (
                        <button
                          onClick={() => {
                            const newOverview = bannerForm.overview.filter((_, i) => i !== index);
                            setBannerForm({ ...bannerForm, overview: newOverview });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowBannerModal(false);
                  setEditingBannerId(null);
                }}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBanner}
                className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
              >
                {editingBannerId ? 'Save Changes' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Project Modal */}
      {showAssignModal && assigningMasterProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 my-8">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
            <div>
              <h3 className="text-xl font-bold">Assign Project</h3>
              <p className="text-pink-100 text-xs mt-1">{assigningMasterProject.title}</p>
            </div>
            <button 
              onClick={() => {
                setShowAssignModal(false);
                setAssigningMasterProject(null);
                setAssignForm([]);
                setBatchFilter('all');
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <label className="block text-sm font-medium text-gray-700">Select Students to Assign</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Filter by Batch:</span>
                  <select 
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="all">All Batches</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-[11px] text-blue-700">Once assigned, the <strong>Google Drive Link</strong> from the master project will be visible to the student in their <strong>"My Tasks"</strong> section and also shared with their email.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                {students
                  .filter(s => {
                    const isApproved = s.isApproved;
                    const courseMatch = !assigningMasterProject.courseId || s.assignedCourse === assigningMasterProject.courseId;
                    const batchMatch = batchFilter === 'all' || s.batch === batchFilter;
                    return isApproved && courseMatch && batchMatch;
                  })
                  .map(student => {
                    const isAssigned = assignForm.some(a => a.studentId === student.id);
                    const assignment = assignForm.find(a => a.studentId === student.id);
                    
                    return (
                      <div key={student.id} className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignForm([...assignForm, { studentId: student.id, googleDriveLink: '' }]);
                              } else {
                                setAssignForm(assignForm.filter(a => a.studentId !== student.id));
                              }
                            }}
                            className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{student.name}</span>
                            <span className="text-xs text-gray-500">{student.email}</span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningMasterProject(null);
                  setAssignForm([]);
                }}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (assignForm.length === 0) {
                    alert('Please select at least one student.');
                    return;
                  }

                  try {
                    const batch = writeBatch(db);
                    const now = new Date();
                    const slaDateString = calculateSLADate(now, holidays);

                    for (const assignment of assignForm) {
                      const student = students.find(s => s.id === assignment.studentId);
                      if (!student) continue;

                      const studentProjectsCount = projects.filter(p => p.studentId === student.id).length + 1;
                      const namePrefix = student.name.substring(0, 3).toUpperCase();
                      const projectCode = `${student.username}_${namePrefix}_${studentProjectsCount}`;
                          const dobNumber = student.applicationData?.dob ? student.applicationData.dob.replace(/\D/g, '') : '';
                          const projectNumber = `${dobNumber}${studentProjectsCount}`;

                      const newProjectRef = doc(collection(db, 'student_projects'));
                      const newProjectData: any = {
                        ...assigningMasterProject,
                        id: newProjectRef.id,
                        masterProjectId: assigningMasterProject.id,
                        studentId: student.id,
                        studentName: student.name,
                        googleDriveLink: assigningMasterProject.googleDriveLink,
                        projectCode,
                        slaDate: slaDateString,
                        actualTime: 0,
                        lastStageActualTime: 0,
                        status: 'client',
                        qcRejections: [],
                        points: 100,
                        efficiency: 0,
                        createdAt: now.toISOString(),
                        updatedAt: now.toISOString()
                      };
                      
                      if (newProjectData.clientBrief) {
                        newProjectData.clientBrief = {
                          ...newProjectData.clientBrief,
                          projectNumber,
                          fileName: `${projectNumber}_${newProjectData.clientBrief.brandName}_${newProjectData.clientBrief.packType}_${newProjectData.clientBrief.variantName}_${newProjectData.clientBrief.netWeight}`
                        };
                      }
                      
                      batch.set(newProjectRef, newProjectData);

                      // Auto-pilot: Share Drive link with student email if it's a Google Drive link
                      const driveUrl = newProjectData.fileUrl;
                      if (driveUrl && driveUrl.includes('drive.google.com') && student.email) {
                        try {
                          fetch('/api/share-drive-file', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ driveUrl, studentEmail: student.email })
                          }).then(res => res.json()).then(data => {
                            if (data.error) console.error("Drive Auto-Pilot Error:", data.error);
                            else console.log("Drive Auto-Pilot Success:", data.message);
                          });
                        } catch (err) {
                          console.error("Drive shared fetch error:", err);
                        }
                      }
                    }
                    await batch.commit();
                    setShowAssignModal(false);
                    setAssigningMasterProject(null);
                    setAssignForm([]);
                    alert('Project assigned successfully.');
                  } catch (err) {
                    handleFirestoreError(err, OperationType.WRITE, 'student_projects');
                  }
                }}
                className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
              >
                Assign Project
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingQuizDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-pink-500" />
                  Quiz Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">{viewingQuizDetails.studentName} - {viewingQuizDetails.topic}</p>
              </div>
              <button 
                onClick={() => setViewingQuizDetails(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {viewingQuizDetails.details.map((detail, idx) => (
                <div key={idx} className="bg-white border text-left p-4 rounded-xl space-y-3">
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-white ${detail.aiScore > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <h4 className="font-bold text-gray-900">{detail.question}</h4>
                      <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-600 rounded-md w-fit">
                        {detail.isDescriptive ? 'Descriptive' : 'Multiple Choice'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pl-12 space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Student's Answer</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{detail.answer || <span className="italic text-gray-400">No answer provided</span>}</p>
                    </div>

                    <div className={`p-4 rounded-xl border-l-4 ${detail.aiScore > 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Evaluator Feedback</span>
                      <p className="text-gray-800">{detail.aiFeedback}</p>
                      
                      {detail.correctAnswerStr && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Correct Answer / Criteria:</span>
                          <p className="text-sm font-medium text-gray-700">{detail.correctAnswerStr}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTrainingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-screen">
            <TrainingRecordForm 
              initialData={editingTrainingRecord}
              onSubmit={handleSaveTrainingRecord}
              isStaffUser={true}
              logoUrl={logoUrl}
              onCancel={() => {
                setShowTrainingModal(false);
                setEditingTrainingRecord(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
