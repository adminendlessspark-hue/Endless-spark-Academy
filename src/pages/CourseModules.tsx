import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CourseModule, TopicScore, CourseType, TrainingRecord, TrainingPlanRow } from '../types';
import { Play, CheckCircle, Lock, Clock, BookOpen, ChevronRight, Upload, FileCheck, Info, Video as VideoIcon, FileText, Eye, X, XCircle, Download, ArrowRight, Map, FileSpreadsheet, HelpCircle, FolderGit2, Maximize, Minimize2, Brain, CheckSquare, Loader2 } from 'lucide-react';
import { cn, getDirectDownloadUrl, formatCourseName, getOrdinalSuffix } from '../utils';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import VideoRecorder from '../components/VideoRecorder';
import { collection, onSnapshot, query, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import SecurePdfViewer from '../components/SecurePdfViewer';
import MindMapAI from '../components/MindMapAI';
import { FALLBACK_COURSE_MODULES } from '../fallbackData';

const ensureAbsoluteUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('uploads/')) {
    const relativePart = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
    return typeof window !== 'undefined' ? window.location.origin + relativePart : relativePart;
  }
  if (/^(f|ht)tps?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return 'https:' + trimmed;
  }
  return 'https://' + trimmed;
};

export default function CourseModules() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { enableDocumentDownloads, financialSettings } = useSettings();
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [category, setCategory] = useState<string>('');
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string, title: string, isSecure?: boolean } | null>(null);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState<boolean>(false);
  const [viewingIframe, setViewingIframe] = useState<{ url: string, title: string } | null>(null);
  const [iframeZoom, setIframeZoom] = useState<number>(1);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const handleOpenDocument = (url: string, title: string, isSecure: boolean = true) => {
    const absoluteUrl = ensureAbsoluteUrl(url);
    
    // 1. Handle Google Drive URLs specifically to render via embedded preview iframe (extremely fast and 100% CORS safe)
    if (absoluteUrl.includes('drive.google.com')) {
      let previewUrl = absoluteUrl;
      const driveMatch = absoluteUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || absoluteUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        previewUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      }
      setViewingIframe({ url: previewUrl, title });
      return;
    }

    // 2. Handle standard iframe-compatible content, images, Office documents, or PDFs
    const lowerUrl = absoluteUrl.toLowerCase();
    const isPdf = lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?') || (absoluteUrl.includes('/uploads/') && lowerUrl.endsWith('.pdf'));
    const isImage = lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.webp') || lowerUrl.includes('.png?') || lowerUrl.includes('.jpg?') || lowerUrl.includes('.jpeg?') || lowerUrl.includes('.webp?') || (absoluteUrl.includes('/uploads/') && (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.webp')));
    const isOfficeDoc = lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx') || lowerUrl.endsWith('.ppt') || lowerUrl.endsWith('.pptx') || lowerUrl.endsWith('.xls') || lowerUrl.endsWith('.xlsx') || lowerUrl.includes('.doc?') || lowerUrl.includes('.docx?') || lowerUrl.includes('.ppt?') || lowerUrl.includes('.pptx?') || lowerUrl.includes('.xls?') || lowerUrl.includes('.xlsx?');

    if (isOfficeDoc) {
      // Use official Google Docs embedded viewer to render Office documents seamlessly
      const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(absoluteUrl)}`;
      setViewingIframe({ url: googleViewerUrl, title });
    } else if (
      absoluteUrl.includes('indd.adobe.com') || 
      absoluteUrl.includes('youtube.com/embed') || 
      absoluteUrl.includes('vimeo.com/video') ||
      (!isPdf && !isImage)
    ) {
      setViewingIframe({ url: absoluteUrl, title });
    } else {
      setViewingPdf({ url: absoluteUrl, title, isSecure });
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'course_modules'), (snapshot) => {
      const allModules = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseModule));
      if (allModules.length > 0) {
        setModules(allModules);
        localStorage.setItem('cached_course_modules', JSON.stringify(allModules));
      } else {
        setModules([]);
      }
      
      // Select initial category
      if (!category) {
        const defaultCat = user?.assignedCourses?.[0] || user?.assignedCourse || allModules[0]?.category || 'production-art-engineer';
        setCategory(defaultCat);
      }
    }, (err) => {
      console.warn("Firestore collection 'course_modules' subscription failed, keeping blank:", err);
      setModules([]);
      
      if (!category) {
        const defaultCat = user?.assignedCourses?.[0] || user?.assignedCourse || 'production-art-engineer';
        setCategory(defaultCat);
      }
      handleFirestoreError(err, OperationType.GET, 'course_modules');
    });

    return () => unsub();
  }, [user]);

  // Derived filtered modules and available categories
  const filteredModules = modules.filter(m => m.category === category).sort((a, b) => {
    const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
    const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.title || '').localeCompare(b.title || '');
  });
  
  // Available course categories from financial settings or modules
  const availableCategories = financialSettings?.coursesConfig?.map((c: any) => c.courseId) || Array.from(new Set(modules.map(m => m.category)));

  useEffect(() => {
    if (filteredModules.length > 0 && (!activeModule || activeModule.category !== category)) {
      setActiveModule(filteredModules[0]);
    }
  }, [category, filteredModules, activeModule]);
  const [uploading, setUploading] = useState(false);
  const [urlModal, setUrlModal] = useState<{ isOpen: boolean, type: 'assignment' | 'worksheet' | 'project' | 'mindMap' | 'video' | null, url: string }>({ isOpen: false, type: null, url: '' });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizType, setQuizType] = useState<'quiz' | 'onlineTest'>('quiz');
  const [showAnswers, setShowAnswers] = useState(false);
  const [showMindMapAI, setShowMindMapAI] = useState(false);
  const [quizResults, setQuizResults] = useState<{ score: number; total: number } | null>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const worksheetInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'syllabus' | 'training-plan'>('syllabus');
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlanRow[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(collection(db, 'training_records'), where('studentId', '==', user.id));
    const unsub = onSnapshot(q, (snapshot) => {
      setTrainingRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingRecord)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'training_records'));
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'training_plans'), (snapshot) => {
      setTrainingPlans(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TrainingPlanRow)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'training_plans'));
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // quizResults is null while the test is active (not finished)
      if (showQuiz && !quizResults) {
        e.preventDefault();
        e.returnValue = ''; // Standard way to show confirmation dialog
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showQuiz, quizResults]);

  const completedIds = user?.completedModules || [];
  const scores = user?.scores || {};

  const handleModuleComplete = async (module: CourseModule) => {
    if (!completedIds.includes(module.id)) {
      const newCompleted = [...completedIds, module.id];
      
      // Update score card for video completion (20 marks)
      const categoryKey = formatCourseName(module.category as any).replace(/\s+/g, '').replace(/&/g, 'And') as keyof typeof user.scores;
      const currentTopicScores = (scores[categoryKey] as any)?.[module.title] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 } as TopicScore;
      
      const newScores = {
        ...scores,
        [categoryKey]: {
          ...(scores[categoryKey] || {}),
          [module.title]: { ...currentTopicScores, attendance: 20 }
        }
      };

      updateUser({ completedModules: newCompleted, scores: newScores });

      // AUTO PILOT: Create Training Record automatically
      const existing = trainingRecords.find(r => r.courseModuleId === module.id);
      if (!existing && user) {
        try {
          // Attempt to get trainer name from assignedFacultyId
          let trainerName = 'Assigned Faculty';
          if (user.assignedFacultyId) {
            const facultySnap = await getDoc(doc(db, 'users', user.assignedFacultyId));
            if (facultySnap.exists()) {
              trainerName = facultySnap.data().name;
            }
          }

          const newRecord = {
            studentId: user.id,
            studentName: user.name,
            trainerName: trainerName,
            courseModuleId: module.id,
            courseModuleName: module.title,
            trainingDate: new Date().toISOString().split('T')[0],
            duration: module.duration,
            topics: module.description,
            feedback: {
              logistics: 'Good',
              presentation: 'Good',
              trainingMaterial: 'Good',
              qualityOfPresentation: 'Good',
              examplesCaseStudies: 'Good',
              usefulnessOfTopic: 'Good',
              fulfilmentOfObjective: 'Good',
              overallSatisfaction: 'Good',
            },
            postTrainingImplementation: '',
            effectivenessVerification: {
              questionnaire: false,
              interview: false,
              onTheJob: false,
            },
            effectivenessDetails: '',
            evaluatedBy: '',
            evaluationDate: '',
            trainerSign: '',
            traineeSign: '',
            traineeSignImplementation: '',
            evaluatorSign: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await addDoc(collection(db, 'training_records'), newRecord);
          alert(`Great job! Module completed and Training Record generated. Please sign the record in your Dashboard to unlock the next module.`);
        } catch (err) {
          console.error("Error creating training record:", err);
        }
      } else {
        alert('Module completed successfully!');
      }
    }
  };

  const handleUrlSubmit = (type: 'assignment' | 'worksheet' | 'project' | 'mindMap' | 'video') => {
    setUrlModal({ isOpen: true, type, url: '' });
  };

  const processUrlSubmit = () => {
    if (!urlModal.type || !urlModal.url || urlModal.url.trim() === '') return;
    
    setUploading(true);
    const type = urlModal.type;
    const url = urlModal.url.trim();
    
    const categoryKey = formatCourseName(activeModule!.category as any).replace(/\s+/g, '').replace(/&/g, 'And') as keyof typeof user.scores;
    const currentTopicScores = (scores[categoryKey] as any)?.[activeModule!.title] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 } as TopicScore;
    
    const statusKey = `${type}Status` as keyof typeof currentTopicScores;
    const fileKey = type === 'video' ? 'videoData' : `${type}File` as keyof typeof currentTopicScores;

    const newScores = {
      ...scores,
      [categoryKey]: {
        ...(scores[categoryKey] || {}),
        [activeModule!.title]: { 
          ...currentTopicScores, 
          [type]: 0, 
          [statusKey]: 'pending', 
          [fileKey]: url 
        }
      }
    };
    
    updateUser({ scores: newScores }).then(() => {
      setUploading(false);
      setUrlModal({ isOpen: false, type: null, url: '' });
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} link submitted for faculty approval.`);
    }).catch(err => {
      console.error(err);
      setUploading(false);
    });
  };

  const handleQuizSubmit = () => {
    const questions = quizType === 'quiz' ? activeModule?.quizQuestions : activeModule?.onlineTestQuestions;
    if (!questions || questions.length === 0) return;
    
    let correctCount = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 20);
    setQuizResults({ score, total: 20 });

    const categoryKey = formatCourseName(activeModule!.category as any).replace(/\s+/g, '').replace(/&/g, 'And') as keyof typeof user.scores;
    const currentTopicScores = (scores[categoryKey] as any)?.[activeModule!.title] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 } as TopicScore;
    
    const newScores = {
      ...scores,
      [categoryKey]: {
        ...(scores[categoryKey] || {}),
        [activeModule!.title]: { 
          ...currentTopicScores, 
          [quizType]: score, 
          [`${quizType}Attempted`]: true 
        }
      }
    };
    
    updateUser({ scores: newScores });
  };

  const handleMindMapValidation = (score: number) => {
    if (!activeModule) return;
    const categoryKey = formatCourseName(activeModule.category as any).replace(/\s+/g, '').replace(/&/g, 'And') as keyof typeof user.scores;
    const currentTopicScores = (scores[categoryKey] as any)?.[activeModule.title] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 } as TopicScore;
    
    const newScores = {
      ...scores,
      [categoryKey]: {
        ...(scores[categoryKey] || {}),
        [activeModule.title]: { ...currentTopicScores, mindMap: score, mindMapStatus: 'approved' } // Auto-approve mindmap based on AI val
      }
    };
    
    updateUser({ scores: newScores });
  };

  if (!activeModule) return null;

  const categoryKey = formatCourseName(category as any).replace(/\s+/g, '').replace(/&/g, 'And') as keyof typeof user.scores;
  const currentScore = (scores[categoryKey] as any)?.[activeModule.title] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, attendance: 0, onlineTest: 0 } as TopicScore;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl w-full sm:w-fit">
        {availableCategories.map((cat: string) => {
          const isAssigned = user?.role !== 'student' || 
            (user?.assignedCourses && user.assignedCourses.includes(cat as any)) || 
            (user?.assignedCourse === cat);
          
          if (user?.role === 'student' && !isAssigned) return null;

          return (
            <button
              key={cat}
              onClick={() => { setCategory(cat); }}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 whitespace-nowrap",
                category === cat ? "bg-white text-pink-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {formatCourseName(cat as any)}
            </button>
          );
        })}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('syllabus')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer",
            activeSubTab === 'syllabus'
              ? "border-pink-600 text-pink-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Syllabus Modules
        </button>
        <button
          onClick={() => setActiveSubTab('training-plan')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer",
            activeSubTab === 'training-plan'
              ? "border-pink-600 text-pink-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Detailed Training Plan
        </button>
      </div>

      {activeSubTab === 'training-plan' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {formatCourseName(category as any)} - Detailed Training Plan
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Course-wise schedule and syllabus breakdown.
            </p>
          </div>

          <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainingPlans
                    .filter(tp => tp.courseId === category)
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
                      </tr>
                    ))}
                  {trainingPlans.filter(tp => tp.courseId === category).length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                        <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-semibold text-slate-700">No training plans finalized yet</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                          The administration has not published the training plan for this course yet. Please check back later.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-8", activeSubTab !== 'syllabus' && "hidden")}>
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg relative group">
            <SecureVideoPlayer 
              url={activeModule.videoUrl} 
              videoUrls={activeModule.videoUrls}
              nativeLanguage={user?.nativeLanguage}
              title={activeModule.title} 
              userName={user?.name}
              userId={user?.studentId || user?.id}
              thumbnailUrl={activeModule.thumbnailUrl}
            />
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeModule.title}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {activeModule.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {formatCourseName(category as any)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleModuleComplete(activeModule)}
                disabled={completedIds.includes(activeModule.id)}
                className={cn(
                  "px-6 py-2 rounded-lg font-bold transition-all transform active:scale-95",
                  completedIds.includes(activeModule.id)
                    ? "bg-orange-50 text-orange-600 border border-orange-200 cursor-default"
                    : "bg-pink-500 text-white hover:bg-pink-600 hover:shadow-lg hover:-translate-y-0.5 shadow-pink-500/20"
                )}
              >
                {completedIds.includes(activeModule.id) ? 'Completed' : 'Mark as Complete'}
              </button>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-8">
              {activeModule.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
              {/* Reference Materials Column */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Reference Materials</h3>
                
                {activeModule.assignmentPaperUrl && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                       <FileText className="w-4 h-4 text-pink-600" />
                       Assignment
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenDocument(activeModule.assignmentPaperUrl!, `Assignment: ${activeModule.title}`, true)}
                        className="flex-1 flex items-center justify-between p-4 bg-pink-50 border border-pink-100 rounded-xl hover:bg-pink-100 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-pink-600 shadow-sm">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">View Assignment</p>
                            <p className="text-xs text-gray-500">Reference material for this module</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {activeModule.mindMapUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <Map className="w-4 h-4 text-pink-600" />
                        Mind Map
                      </h4>
                      <button 
                        onClick={() => setShowMindMapAI(true)}
                        className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-pink-50 px-2 py-1 rounded-md"
                      >
                        <Brain className="w-3 h-3" />
                        AI Mind Map
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenDocument(activeModule.mindMapUrl!, `Mind Map: ${activeModule.title}`, true)}
                        className="flex-1 flex items-center justify-between p-4 bg-pink-50 border border-pink-100 rounded-xl hover:bg-pink-100 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-pink-600 shadow-sm">
                            <Map className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">View Mind Map</p>
                            <p className="text-xs text-gray-500">Visual summary of this module</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                      {user?.role !== 'student' && (
                        <a 
                          href={`/api/download?url=${encodeURIComponent(activeModule.mindMapUrl!)}&title=${encodeURIComponent(`Mind Map - ${activeModule.title}`)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-4 bg-pink-50 border border-pink-100 rounded-xl hover:bg-pink-100 transition-colors text-pink-600 shadow-sm flex items-center justify-center"
                          title="Download Mind Map"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {activeModule.worksheetUrl && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                      Worksheet
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenDocument(activeModule.worksheetUrl!, `Worksheet: ${activeModule.title}`, true)}
                        className="flex-1 flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-orange-600 shadow-sm">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">View Worksheet</p>
                            <p className="text-xs text-gray-500">Practice material for this module</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                      {user?.role !== 'student' && (
                        <a 
                          href={`/api/download?url=${encodeURIComponent(activeModule.worksheetUrl!)}&title=${encodeURIComponent(`Worksheet - ${activeModule.title}`)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-4 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors text-orange-600 shadow-sm flex items-center justify-center"
                          title="Download Worksheet"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {activeModule.referenceMaterialUrl && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      Reference Material
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenDocument(activeModule.referenceMaterialUrl!, `Reference Material: ${activeModule.title}`, true)}
                        className="flex-1 flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl hover:bg-purple-100 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-purple-600 shadow-sm">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">View Reference Material</p>
                            <p className="text-xs text-gray-500">Additional reading and resources</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                      {user?.role !== 'student' && (
                        <a 
                          href={`/api/download?url=${encodeURIComponent(activeModule.referenceMaterialUrl!)}&title=${encodeURIComponent(`Reference Material - ${activeModule.title}`)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-4 bg-purple-50 border border-purple-100 rounded-xl hover:bg-purple-100 transition-colors text-purple-600 shadow-sm flex items-center justify-center"
                          title="Download Reference Material"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {activeModule.additionalReferenceMaterials && activeModule.additionalReferenceMaterials.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Additional Materials
                    </h4>
                    {activeModule.additionalReferenceMaterials.map((material, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenDocument(material.url, material.title, true)}
                          className="flex-1 flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors group text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{material.title}</p>
                              <p className="text-xs text-gray-500">Additional resource</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                        {user?.role !== 'student' && (
                          <a 
                            href={`/api/download?url=${encodeURIComponent(material.url)}&title=${encodeURIComponent(material.title)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors text-indigo-600 shadow-sm flex items-center justify-center"
                            title={`Download ${material.title}`}
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeModule.projectTemplateUrl && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-pink-600" />
                      Project
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenDocument(activeModule.projectTemplateUrl!, `Project Template: ${activeModule.title}`, true)}
                        className="flex-1 flex items-center justify-between p-4 bg-pink-50 border border-pink-100 rounded-xl hover:bg-pink-100 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-pink-600 shadow-sm">
                            <FolderGit2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">View Template</p>
                            <p className="text-xs text-gray-500">Starting files for your project</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                      {user?.role !== 'student' && (
                        <a 
                          href={`/api/download?url=${encodeURIComponent(activeModule.projectTemplateUrl!)}&title=${encodeURIComponent(`Project Template - ${activeModule.title}`)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-4 bg-pink-50 border border-pink-100 rounded-xl hover:bg-pink-100 transition-colors text-pink-600 shadow-sm flex items-center justify-center"
                          title="Download Project Template"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Student Uploads Column */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Student Uploads</h3>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <VideoIcon className="w-4 h-4 text-pink-600" />
                    Video
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    {currentScore.videoStatus === 'approved' ? (
                      <div className="flex flex-col items-center text-orange-600 py-4">
                        <CheckCircle className="w-8 h-8 mb-2" />
                        <p className="text-sm font-bold">Video Approved</p>
                        <p className="text-xs opacity-75">Score: {currentScore.video}/20</p>
                      </div>
                    ) : currentScore.videoStatus === 'pending' ? (
                      <div className="flex flex-col items-center text-orange-600 py-4">
                        <Clock className="w-8 h-8 mb-2" />
                        <p className="text-sm font-bold">Pending Approval</p>
                        <p className="text-xs opacity-75">Submitted for review</p>
                      </div>
                    ) : currentScore.videoStatus === 'rejected' ? (
                      <div className="flex flex-col items-center text-red-600 py-4">
                        <XCircle className="w-8 h-8 mb-2" />
                        <p className="text-sm font-bold">Video Rejected</p>
                        <button 
                          onClick={() => handleUrlSubmit('video')}
                          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-all active:scale-95 mt-3"
                        >
                          Upload Again
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleUrlSubmit('video')}
                        disabled={uploading}
                        className="w-full flex flex-col items-center text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all py-4 active:scale-95"
                      >
                        <Upload className="w-8 h-8 mb-2" />
                        <p className="text-sm font-bold">{uploading ? 'Uploading...' : 'Submit Video Link'}</p>
                        <p className="text-xs">Google Drive or YouTube URL</p>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-pink-600" />
                    Assignment
                  </h4>
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-pink-300 transition-colors bg-gray-50/50">
                    <div className="text-center">
                      {currentScore.assignmentStatus === 'approved' ? (
                        <div className="flex flex-col items-center text-orange-600">
                          <FileCheck className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Assignment Approved</p>
                          <p className="text-xs opacity-75">Score: {currentScore.assignment}/10</p>
                        </div>
                      ) : currentScore.assignmentStatus === 'pending' ? (
                        <div className="flex flex-col items-center text-orange-600">
                          <Clock className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Pending Approval</p>
                          <p className="text-xs opacity-75">Submitted for review</p>
                        </div>
                      ) : currentScore.assignmentStatus === 'rejected' ? (
                        <div className="flex flex-col items-center text-red-600">
                          <XCircle className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Assignment Rejected</p>
                          <button 
                            onClick={() => handleUrlSubmit('assignment')}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-all active:scale-95 mt-3"
                          >
                            Upload Again
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUrlSubmit('assignment')}
                          disabled={uploading}
                          className="w-full flex flex-col items-center text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all py-4 active:scale-95"
                        >
                          <Upload className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">{uploading ? 'Uploading...' : 'Submit Assignment Link'}</p>
                          <p className="text-xs">Google Drive URL</p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-orange-600" />
                    Worksheet
                  </h4>
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-300 transition-colors bg-gray-50/50">
                    <div className="text-center">
                      {currentScore.worksheetStatus === 'approved' ? (
                        <div className="flex flex-col items-center text-orange-600">
                          <FileCheck className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Worksheet Approved</p>
                          <p className="text-xs opacity-75">Score: {currentScore.worksheet}/20</p>
                        </div>
                      ) : currentScore.worksheetStatus === 'pending' ? (
                        <div className="flex flex-col items-center text-orange-600">
                          <Clock className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Pending Approval</p>
                          <p className="text-xs opacity-75">Submitted for review</p>
                        </div>
                      ) : currentScore.worksheetStatus === 'rejected' ? (
                        <div className="flex flex-col items-center text-red-600">
                          <XCircle className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Worksheet Rejected</p>
                          <button 
                            onClick={() => handleUrlSubmit('worksheet')}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-all active:scale-95 mt-3"
                          >
                            Upload Again
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUrlSubmit('worksheet')}
                          disabled={uploading}
                          className="w-full flex flex-col items-center text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all py-4 active:scale-95"
                        >
                          <Upload className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">{uploading ? 'Uploading...' : 'Submit Worksheet Link'}</p>
                          <p className="text-xs">Google Drive URL</p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-pink-600" />
                    Project
                  </h4>
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-pink-300 transition-colors bg-gray-50/50">
                    <div className="text-center">
                      {currentScore.projectStatus === 'approved' ? (
                        <div className="flex flex-col items-center text-orange-600">
                          <FileCheck className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Project Approved</p>
                          <p className="text-xs opacity-75">Score: {currentScore.project}/20</p>
                        </div>
                      ) : currentScore.projectStatus === 'pending' ? (
                        <div className="flex flex-col items-center text-orange-600">
                          <Clock className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Pending Approval</p>
                          <p className="text-xs opacity-75">Submitted for review</p>
                        </div>
                      ) : currentScore.projectStatus === 'rejected' ? (
                        <div className="flex flex-col items-center text-red-600">
                          <XCircle className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Project Rejected</p>
                          <button 
                            onClick={() => handleUrlSubmit('project')}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-all active:scale-95 mt-3"
                          >
                            Upload Again
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUrlSubmit('project')}
                          disabled={uploading}
                          className="w-full flex flex-col items-center text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all py-4 active:scale-95"
                        >
                          <Upload className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">{uploading ? 'Uploading...' : 'Submit Project Link'}</p>
                          <p className="text-xs">Google Drive URL</p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-600" />
                    Mind Map
                  </h4>
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 transition-colors bg-gray-50/50">
                    <div className="text-center">
                      {currentScore.mindMapStatus === 'approved' ? (
                        <div className="flex flex-col items-center text-orange-600">
                          <FileCheck className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Mind Map Approved</p>
                          <p className="text-xs opacity-75">Score: {currentScore.mindMap}/10</p>
                        </div>
                      ) : currentScore.mindMapStatus === 'pending' ? (
                        <div className="flex flex-col items-center text-orange-600">
                          <Clock className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Pending Approval</p>
                          <p className="text-xs opacity-75">Submitted for review</p>
                        </div>
                      ) : currentScore.mindMapStatus === 'rejected' ? (
                        <div className="flex flex-col items-center text-red-600">
                          <XCircle className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">Mind Map Rejected</p>
                          <button 
                            onClick={() => handleUrlSubmit('mindMap')}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-all active:scale-95 mt-3"
                          >
                            Upload Again
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUrlSubmit('mindMap')}
                          disabled={uploading}
                          className="w-full flex flex-col items-center text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all py-4 active:scale-95"
                        >
                          <Upload className="w-8 h-8 mb-2" />
                          <p className="text-sm font-bold">{uploading ? 'Uploading...' : 'Submit Mind Map Link'}</p>
                          <p className="text-xs">Google Drive URL</p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-pink-600" />
                    Module Status
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Video</p>
                      <p className="text-lg font-bold text-gray-700">{currentScore.video}/20</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Assignment</p>
                      <p className="text-lg font-bold text-gray-700">{currentScore.assignment}/10</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Attendance</p>
                      <p className="text-lg font-bold text-gray-700">{currentScore.attendance}/10</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Worksheet</p>
                      <p className="text-lg font-bold text-gray-700">{currentScore.worksheet}/20</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Project</p>
                      <p className="text-lg font-bold text-gray-700">{currentScore.project}/20</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Mind Map</p>
                      <p className="text-lg font-bold text-gray-700">{currentScore.mindMap || 0}/10</p>
                    </div>
                    <div className="p-4 bg-pink-50 rounded-lg border border-pink-100 col-span-2">
                      <p className="text-[10px] uppercase text-pink-400 font-bold mb-1">Total</p>
                      <p className="text-lg font-bold text-pink-600">{currentScore.video + currentScore.assignment + currentScore.worksheet + currentScore.project + (currentScore.mindMap || 0) + currentScore.attendance}/90</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                  <h5 className="text-orange-800 font-bold text-sm mb-2 font-black uppercase tracking-wider">Next Steps</h5>
                  {completedIds.includes(activeModule.id) && !trainingRecords.find(r => r.courseModuleId === activeModule.id)?.traineeSign ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-white/60 p-3 rounded-xl border border-orange-200">
                        <p className="text-sm font-bold text-red-600 flex items-center gap-2 mb-1">
                          <CheckSquare className="w-4 h-4" /> Signature Required
                        </p>
                        <p className="text-[11px] text-orange-800 leading-relaxed">
                          Your training record has been auto-generated. Please visit your <Link to="/dashboard" className="underline font-black hover:text-pink-600 transition-colors">Dashboard</Link> to sign it before proceeding to the next module.
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-2 bg-pink-600 text-white rounded-lg text-xs font-bold hover:bg-pink-700 transition-all shadow-md shadow-pink-200"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  ) : (
                    <ul className="text-orange-700 text-[11px] space-y-2 font-medium">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0" />
                        Record and submit your module introduction video
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0" />
                        Complete and upload your assignment link
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0" />
                        Take the module quiz to earn extra marks
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Module List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 px-2">
            {formatCourseName(category as any)} Modules
          </h3>
          <div className="space-y-2">
            {filteredModules.map((module, idx) => {
              const isActive = activeModule.id === module.id;
              const isCompleted = completedIds.includes(module.id);
              
              // Blocking logic: must complete PREVIOUS module AND sign its record
              let isLocked = false;
              let lockReason = null;

              if (idx > 0) {
                const prevModule = filteredModules[idx - 1];
                const prevCompleted = completedIds.includes(prevModule.id);
                const prevRecord = trainingRecords.find(r => r.courseModuleId === prevModule.id);
                const prevRecordSigned = prevRecord && prevRecord.traineeSign;

                if (!prevCompleted) {
                  isLocked = true;
                  lockReason = "Complete previous module first";
                } else if (!prevRecordSigned) {
                  isLocked = true;
                  lockReason = "Sign previous module's training record in Dashboard";
                }
              }

              return (
                <button
                  key={module.id}
                  disabled={isLocked}
                  onClick={() => setActiveModule(module)}
                  title={lockReason || ""}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left group active:scale-[0.98]",
                    isActive 
                      ? "bg-pink-50 border-pink-200 ring-1 ring-pink-200" 
                      : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50",
                    isLocked && "opacity-60 cursor-not-allowed disabled:active:scale-100"
                  )}
                >
                  <div className={cn(
                    "mt-1 p-2 rounded-lg relative",
                    isActive ? "bg-pink-600 text-white" : 
                    isCompleted ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"
                  )}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : 
                     isLocked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    
                    {isCompleted && !trainingRecords.find(r => r.courseModuleId === module.id)?.traineeSign && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-bold truncate",
                      isActive ? "text-pink-900" : "text-gray-900"
                    )}>
                      {module.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{module.duration}</p>
                  </div>

                  <ChevronRight className={cn(
                    "w-4 h-4 mt-1 transition-transform",
                    isActive ? "text-pink-400 translate-x-1" : "text-gray-300"
                  )} />
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            <div className="p-6 bg-pink-500 rounded-2xl text-white shadow-lg shadow-pink-500/20">
              <h4 className="font-bold mb-2">Module Quiz</h4>
              <p className="text-sm text-pink-100 mb-4">
                {currentScore.quizAttempted 
                  ? `Quiz completed. Your score: ${currentScore.quiz}/20` 
                  : `Complete the ${activeModule.quizQuestions?.length || 0}-question quiz for this module to earn 20 marks.`}
              </p>
              <button 
                onClick={() => {
                  if (activeModule.quizQuestions && activeModule.quizQuestions.length > 0) {
                    setQuizType('quiz');
                    setShowQuiz(true);
                    setCurrentQuizStep(0);
                    setSelectedAnswers({});
                    setQuizResults(null);
                    setShowAnswers(false);
                  } else {
                    navigate(`/quiz?category=${category}&topic=${activeModule.title}`);
                  }
                }}
                disabled={currentScore.quizAttempted}
                className={cn(
                  "w-full py-2 rounded-lg text-sm font-bold transition-all active:scale-95",
                  currentScore.quizAttempted
                    ? "bg-pink-400 text-pink-100 cursor-not-allowed"
                    : "bg-white text-pink-600 hover:bg-pink-50"
                )}
              >
                {currentScore.quizAttempted ? 'Quiz Completed' : 'Take Quiz'}
              </button>
            </div>

            {currentScore.onlineTestAssigned && (
              <div className="p-6 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                <h4 className="font-bold mb-2">Final Online Test</h4>
                <p className="text-sm text-orange-100 mb-4">
                  {currentScore.onlineTestAttempted 
                    ? `Test completed. Your score: ${currentScore.onlineTest}/20` 
                    : `Complete the ${activeModule.onlineTestQuestions?.length || 0}-question final test for this module.`}
                </p>
                <button 
                  onClick={() => {
                    if (activeModule.onlineTestQuestions && activeModule.onlineTestQuestions.length > 0) {
                      setQuizType('onlineTest');
                      setShowQuiz(true);
                      setCurrentQuizStep(0);
                      setSelectedAnswers({});
                      setQuizResults(null);
                      setShowAnswers(false);
                    } else {
                      alert('Final test questions not available for this module yet.');
                    }
                  }}
                  disabled={currentScore.onlineTestAttempted}
                  className={cn(
                    "w-full py-2 rounded-lg text-sm font-bold transition-all active:scale-95",
                    currentScore.onlineTestAttempted
                      ? "bg-orange-400 text-orange-100 cursor-not-allowed"
                      : "bg-white text-orange-600 hover:bg-orange-50"
                  )}
                >
                  {currentScore.onlineTestAttempted ? 'Test Completed' : 'Start Final Test'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* URL Submission Modal */}
      {urlModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-pink-600" />
                Submit {urlModal.type?.charAt(0).toUpperCase()}{urlModal.type?.slice(1)}
              </h3>
              <button 
                onClick={() => setUrlModal({ isOpen: false, type: null, url: '' })}
                className="p-2 hover:bg-pink-100 rounded-full transition-all active:scale-95"
                disabled={uploading}
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Please paste the Google Drive or YouTube link for your {urlModal.type}. Make sure the link is set to "Anyone with the link can view".
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submission URL</label>
                <input
                  type="url"
                  value={urlModal.url}
                  onChange={(e) => setUrlModal(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  disabled={uploading}
                />
              </div>
              <button
                onClick={processUrlSubmit}
                disabled={uploading || !urlModal.url.trim()}
                className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {uploading ? 'Submitting...' : 'Submit Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col relative">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                {quizType === 'quiz' ? <HelpCircle className="w-5 h-5 text-pink-600" /> : <FileCheck className="w-5 h-5 text-orange-600" />}
                <h3 className="font-bold text-gray-900">{quizType === 'quiz' ? 'Module Quiz' : 'Final Online Test'}: {activeModule.title}</h3>
              </div>
              <button 
                onClick={() => {
                  if (!quizResults && !confirm("Exit test? Your progress will be lost.")) return;
                  setShowQuiz(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-95"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto">
              {!quizResults ? (
                <div className="space-y-8">
                  {(() => {
                    const questions = quizType === 'quiz' ? activeModule.quizQuestions : activeModule.onlineTestQuestions;
                    if (!questions || questions.length === 0) return <div>No questions found.</div>;
                    const question = questions[currentQuizStep];
                    
                    return (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            quizType === 'quiz' ? "text-pink-600" : "text-orange-600"
                          )}>
                            Question {currentQuizStep + 1} of {questions.length}
                          </span>
                          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-300",
                                quizType === 'quiz' ? "bg-pink-500" : "bg-orange-500"
                              )}
                              style={{ width: `${((currentQuizStep + 1) / questions.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        <h4 className="text-xl font-bold text-gray-900">
                          {question.question}
                        </h4>

                        <div className="grid grid-cols-1 gap-3">
                          {question.options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedAnswers({
                                ...selectedAnswers,
                                [question.id]: idx
                              })}
                              className={cn(
                                "w-full p-4 rounded-xl border text-left transition-all active:scale-[0.98]",
                                selectedAnswers[question.id] === idx
                                  ? (quizType === 'quiz' ? "bg-pink-50 border-pink-600 ring-1 ring-pink-600" : "bg-orange-50 border-orange-600 ring-1 ring-orange-600")
                                  : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold",
                                  selectedAnswers[question.id] === idx
                                    ? (quizType === 'quiz' ? "bg-pink-500 border-pink-500 text-white" : "bg-orange-500 border-orange-500 text-white")
                                    : "border-gray-200 text-gray-400"
                                )}>
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <span className={cn(
                                  "font-medium",
                                  selectedAnswers[question.id] === idx
                                    ? (quizType === 'quiz' ? "text-pink-900" : "text-orange-900")
                                    : "text-gray-700"
                                )}>
                                  {option}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="flex justify-between pt-8">
                          <button
                            disabled={currentQuizStep === 0}
                            onClick={() => setCurrentQuizStep(prev => prev - 1)}
                            className="px-6 py-2 rounded-lg font-bold text-gray-500 hover:text-gray-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                          >
                            Previous
                          </button>
                          {currentQuizStep === questions.length - 1 ? (
                            <button
                              disabled={selectedAnswers[question.id] === undefined}
                              onClick={handleQuizSubmit}
                              className={cn(
                                "px-8 py-2 text-white rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                                quizType === 'quiz' ? "bg-pink-500 hover:bg-pink-600" : "bg-orange-500 hover:bg-orange-600"
                              )}
                            >
                              Submit {quizType === 'quiz' ? 'Quiz' : 'Test'}
                            </button>
                          ) : (
                            <button
                              disabled={selectedAnswers[question.id] === undefined}
                              onClick={() => setCurrentQuizStep(prev => prev + 1)}
                              className={cn(
                                "px-8 py-2 text-white rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                                quizType === 'quiz' ? "bg-pink-500 hover:bg-pink-600" : "bg-orange-500 hover:bg-orange-600"
                              )}
                            >
                              Next Question
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : showAnswers ? (
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <h4 className="text-2xl font-bold text-gray-900 mb-6 sticky top-0 bg-white pb-4 border-b z-10">{quizType === 'quiz' ? 'Quiz Answers' : 'Test Answers'}</h4>
                  <div className="space-y-8">
                    {(quizType === 'quiz' ? activeModule.quizQuestions : activeModule.onlineTestQuestions || []).map((q, idx) => {
                      const userAnswer = selectedAnswers[q.id];
                      const isCorrect = userAnswer === q.correctAnswer;
                      
                      return (
                        <div key={q.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={cn(
                              "w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-white",
                              isCorrect ? "bg-green-500" : "bg-red-500"
                            )}>
                              {idx + 1}
                            </div>
                            <div>
                              <h5 className="text-lg font-bold text-gray-900 mb-1">{q.question}</h5>
                              <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-600 rounded-md">
                                {q.type === 'true-false' ? 'True or False' : 'Choice the best answer'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 pl-12">
                            {q.options.map((option, optIdx) => {
                              const isSelected = userAnswer === optIdx;
                              const isActualCorrect = q.correctAnswer === optIdx;
                              
                              let optionClass = "bg-white border-gray-200 text-gray-700";
                              let iconClass = "border-gray-200 text-gray-400";
                              
                              if (isActualCorrect) {
                                optionClass = "bg-green-50 border-green-500 ring-1 ring-green-500 text-green-900";
                                iconClass = "bg-green-500 border-green-500 text-white";
                              } else if (isSelected && !isActualCorrect) {
                                optionClass = "bg-red-50 border-red-500 ring-1 ring-red-500 text-red-900";
                                iconClass = "bg-red-500 border-red-500 text-white";
                              }
                              
                              return (
                                <div
                                  key={optIdx}
                                  className={cn(
                                    "w-full p-4 rounded-xl border text-left flex items-center gap-3",
                                    optionClass
                                  )}
                                >
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0",
                                    iconClass
                                  )}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </div>
                                  <span className="font-medium">{option}</span>
                                  
                                  {isActualCorrect && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                                  {isSelected && !isActualCorrect && <X className="w-5 h-5 text-red-500 ml-auto" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex justify-center sticky bottom-0 bg-white pt-4 border-t">
                    <button
                      onClick={() => setShowQuiz(false)}
                      className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all active:scale-95"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h4>
                  <p className="text-gray-500 mb-8">You've earned {quizResults.score} marks for this module.</p>
                  
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 max-w-sm mx-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Score</span>
                      <span className="text-lg font-bold text-gray-900">{quizResults.score}/20</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500" 
                        style={{ width: `${(quizResults.score / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setShowAnswers(true)}
                      className="px-8 py-3 bg-white text-pink-500 border-2 border-pink-500 rounded-xl font-bold hover:bg-pink-50 transition-all active:scale-95"
                    >
                      Show Answers
                    </button>
                    <button
                      onClick={() => setShowQuiz(false)}
                      className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all active:scale-95"
                    >
                      Close Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={cn(
            "bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
            isPdfFullscreen 
              ? "fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none z-50 p-0" 
              : "w-full max-w-5xl max-h-[90vh] rounded-2xl p-0"
          )}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
              <h3 className="text-xl font-bold text-gray-900 truncate pr-4">{viewingPdf.title}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setIsPdfFullscreen(prev => !prev)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title={isPdfFullscreen ? "Exit Full Screen" : "Full Screen"}
                  id="toggle-pdf-fullscreen"
                >
                  {isPdfFullscreen ? (
                    <Minimize2 className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Maximize className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    setViewingPdf(null);
                    setIsPdfFullscreen(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  id="close-pdf-modal"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 relative">
              <SecurePdfViewer 
                url={viewingPdf.url} 
                title={viewingPdf.title} 
                userName={user?.name}
                userId={user?.studentId || user?.id}
                isFullscreen={isPdfFullscreen}
                isSecure={viewingPdf.isSecure}
                userRole={user?.role}
              />
            </div>
          </div>
        </div>
      )}

      {/* Iframe Viewer Modal (for Reference Materials like Adobe InDesign) */}
      {viewingIframe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{viewingIframe.title}</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
                  <button 
                    onClick={() => setIframeZoom(prev => Math.max(0.5, prev - 0.1))}
                    className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors"
                    title="Zoom Out"
                  >
                    <span className="text-lg font-bold leading-none">-</span>
                  </button>
                  <span className="px-3 text-sm font-medium text-gray-700 min-w-[4rem] text-center">
                    {Math.round(iframeZoom * 100)}%
                  </span>
                  <button 
                    onClick={() => setIframeZoom(prev => Math.min(3, prev + 0.1))}
                    className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors"
                    title="Zoom In"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </button>
                  <button 
                    onClick={() => setIframeZoom(1)}
                    className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors ml-1 text-xs font-bold"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                </div>
                <button 
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      iframeContainerRef.current?.requestFullscreen().catch(err => {
                        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                      });
                    } else {
                      document.exitFullscreen();
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Full Screen"
                >
                  <Maximize className="w-5 h-5 text-gray-500" />
                </button>
                <button 
                  onClick={() => {
                    setViewingIframe(null);
                    setIframeZoom(1);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div ref={iframeContainerRef} className="flex-1 w-full h-full bg-gray-100 relative overflow-auto flex items-center justify-center">
              <div 
                className="w-full h-full transition-transform duration-200 origin-center"
                style={{ transform: `scale(${iframeZoom})` }}
              >
                <iframe 
                  src={(() => {
                  const url = viewingIframe.url;
                  let finalUrl = url;
                  const srcMatch = url.match(/src=["']([^"']+)["']/);
                  if (srcMatch) {
                    finalUrl = srcMatch[1];
                  } else {
                    finalUrl = url.replace(/^["']|["']$/g, '').trim();
                  }
                  
                  // Attempt to disable sharing via URL parameters for Adobe InDesign
                  if (finalUrl.includes('indd.adobe.com')) {
                    const separator = finalUrl.includes('?') ? '&' : '?';
                    if (!finalUrl.includes('share=')) {
                      finalUrl += `${separator}share=false&embed=false`;
                    }
                  }
                  return finalUrl;
                })()}
                className="w-full h-full border-0" 
                allow="clipboard-read; clipboard-write; fullscreen"
                title={viewingIframe.title}
              />
              </div>
              
              {/* Watermark Overlay */}
              <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex flex-wrap justify-center items-center opacity-10 select-none">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div key={i} className="transform -rotate-45 p-10 text-2xl font-bold text-gray-900 whitespace-nowrap">
                    {user?.name} - {user?.studentId || user?.id}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mind Map AI Modal */}
      {showMindMapAI && (
        <MindMapAI 
          moduleId={activeModule.id}
          moduleTitle={activeModule.title}
          officialNotes={activeModule.mindMapNotes}
          expectedCriteria={activeModule.mindMapExpectedCriteria}
          onValidationComplete={handleMindMapValidation}
          onClose={() => setShowMindMapAI(false)}
        />
      )}
    </div>
  );
}
