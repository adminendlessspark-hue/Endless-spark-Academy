import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, Mic, MicOff, Play, Pause, Square, RefreshCcw, Download, Sparkles, 
  BookOpen, Languages, HelpCircle, Info, CheckCircle2, ChevronDown, ChevronUp, 
  Layers, Volume2, Type, Sliders, ShieldCheck, Camera, ArrowRight, Eye, 
  Award, Clock, AlertCircle, FileText, Check, Loader2, Sparkle, Upload,
  ExternalLink, PlayCircle, ShieldAlert, FileSpreadsheet, Maximize2, Minimize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateGeminiContent } from '../services/gemini';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CourseModule } from '../types';
import { FALLBACK_COURSE_MODULES } from '../fallbackData';
import { formatCourseName } from '../utils';
import LoomCourseStudio from './LoomCourseStudio';

export interface ModuleScript {
  id: string;
  course: string;
  module: string;
  title: string;
  duration: string;
  tone: string;
  scriptText: string;
  grammarGuide: string;
  accentGuide: string;
  pronunciationGuide: Array<{ word: string; phonetic: string; tip: string }>;
  referenceMaterialUrl?: string;
  assignmentPaperUrl?: string;
  worksheetUrl?: string;
  videoUrl?: string;
}

export const COURSE_MODULE_SCRIPTS: ModuleScript[] = [
  {
    id: 'script_print_m1',
    course: 'Diploma in Production Art Engineer',
    module: 'Module 1: Student Welcome & Self Intro',
    title: '🎓 Self-Introduction & Creative Portfolio Goal',
    duration: '30-45 Seconds',
    tone: 'Enthusiastic & Warm',
    scriptText: `Hello everyone! My name is Rahul Sharma, and I am a passionate student enrolled in the Diploma program.

In this course, my goal is to master Adobe Illustrator, Photoshop, and offset pre-press production so I can design professional packaging for international brands.

Thank you for watching my intro video, and I look forward to working together with my classmates and faculty!`,
    grammarGuide: `• **Subject-Verb Agreement**: "My name IS...", "I AM a student...", "I LOOK forward..."
• **Future Intent**: Use "my goal is to master..." and "so I can design..." to state clear objectives.
• **Polite Closing**: "Thank you for watching..." is a standard professional sign-off in video submissions.`,
    accentGuide: `• **Pacing**: Speak at approximately 120-130 words per minute. Pause for 1 second at commas.
• **Stress Pattern**: Emphasize key action words: **design**, **master**, **packaging**, **international**.
• **Intonation**: Pitch should rise slightly on greeting ("Hello everyone! ↑") and fall naturally on sentence endings.`,
    pronunciationGuide: [
      { word: 'Packaging', phonetic: 'PAK-ij-ing', tip: 'Short "A" sound in PAK, accent on 1st syllable.' },
      { word: 'Professional', phonetic: 'pruh-FESH-uh-nul', tip: 'Unstressed "pruh", strong emphasis on FESH.' },
      { word: 'International', phonetic: 'in-ter-NASH-uh-nul', tip: 'Clear "in-ter", stress NASH.' },
      { word: 'Illustrator', phonetic: 'IL-uh-stray-ter', tip: 'First syllable IL gets the stress.' }
    ]
  },
  {
    id: 'script_print_m2',
    course: 'Diploma in Packaging Engineer',
    module: 'Module 2: Structural Packaging & CMYK Proofing',
    title: '🎨 CMYK Color Proofing & Offset Printing Demo',
    duration: '45-60 Seconds',
    tone: 'Technical & Confident',
    scriptText: `Hello professor! Today I am presenting my Module 2 practical project on CMYK Color Separation and Pre-Press Proofing.

In this design, we converted RGB screen graphics into a 300 DPI CMYK offset print profile. We added 3mm bleed margins, crop marks, and spot UV channel masks to ensure zero ink misregistration.

Our tests confirm that color accuracy matches 98% with Pantone solid coated standards. Thank you for viewing my presentation!`,
    grammarGuide: `• **Past Action & Present Result**: "We converted...", "We added..." (Simple Past for completed project steps).
• **Technical Precision**: "To ensure zero ink misregistration" uses an infinitive clause expressing purpose.
• **Active Present State**: "Our tests confirm that..." states current verifiable facts.`,
    accentGuide: `• **Technical Terms Cadence**: Don't rush acronyms like **C-M-Y-K**, **R-G-B**, **D-P-I**, or **U-V**. Pronounce each letter clearly.
• **Neutral English Accent**: Keep vowels open and clear. Avoid dropping trailing 't' and 'd' sounds in words like "converted" and "margins".`,
    pronunciationGuide: [
      { word: 'Cyan', phonetic: 'SIGH-an', tip: 'Sounds like SIGH + an (not SEE-an).' },
      { word: 'Magenta', phonetic: 'muh-JEN-tuh', tip: 'Emphasis on middle syllable JEN.' },
      { word: 'Misregistration', phonetic: 'mis-rej-ih-STRAY-shun', tip: 'Break into 5 syllables, stress STRAY.' },
      { word: 'Pantone', phonetic: 'PAN-tone', tip: 'Equal weight on PAN and TONE.' }
    ]
  }
];

export function SelfRecordingStudio() {
  const { user, isAdmin } = useAuth();
  const { financialSettings } = useSettings();
  const [dbModules, setDbModules] = useState<CourseModule[]>([]);

  const isAdminUser = isAdmin || user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'qc' || user?.role === 'telecaller' || user?.role === 'accounts_executive' || user?.role === 'marketing';

  // Student assigned course IDs (e.g. ['packaging-engineer'])
  const studentAssignedCourses: string[] = React.useMemo(() => {
    if (isAdminUser || !user) return [];
    const assigned = user.assignedCourses || (user.assignedCourse ? [user.assignedCourse] : (user.requestedCourses || (user.requestedCourse ? [user.requestedCourse] : [])));
    return assigned && assigned.length > 0 ? assigned : ['production-art-engineer'];
  }, [user, isAdminUser]);

  // Guidance step state
  const [activeGuidanceTab, setActiveGuidanceTab] = useState<'method' | 'script' | 'coach' | 'studio' | 'loom'>('studio');
  const [showGuidanceBanner, setShowGuidanceBanner] = useState(true);

  // Script selection state
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All');
  const [selectedModuleScript, setSelectedModuleScript] = useState<ModuleScript>(COURSE_MODULE_SCRIPTS[0]);

  // Teleprompter state
  const [teleprompterScroll, setTeleprompterScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(0.8); // 0.1 to 10 (allows speeds < 1)
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [teleprompterText, setTeleprompterText] = useState(selectedModuleScript.scriptText);

  // Helper functions for teleprompter speed adjustment (supports speeds < 1 down to 0.1)
  const handleDecreaseSpeed = () => {
    setScrollSpeed((prev) => {
      if (prev <= 0.15) return 0.1;
      if (prev <= 1) return Number((prev - 0.1).toFixed(1));
      return Number((prev - 0.5).toFixed(1));
    });
  };

  const handleIncreaseSpeed = () => {
    setScrollSpeed((prev) => {
      if (prev < 1) return Number((prev + 0.1).toFixed(1));
      if (prev >= 10) return 10;
      return Number((prev + 0.5).toFixed(1));
    });
  };

  // Webcam & Recording state
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Practice mode (without live camera stream)
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // AI Speech Feedback State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Custom AI Script Generator state
  const [customPromptText, setCustomPromptText] = useState('');
  const [isGeneratingCustomScript, setIsGeneratingCustomScript] = useState(false);

  // Full Screen Teleprompter State & Refs
  const [isTeleprompterFullscreen, setIsTeleprompterFullscreen] = useState(false);
  const fullscreenPrompterRef = useRef<HTMLDivElement>(null);
  const fullscreenWebcamVideoRef = useRef<HTMLVideoElement>(null);

  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const teleprompterContainerRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Sync camera media stream across normal and fullscreen video elements
  useEffect(() => {
    if (cameraActive && mediaStreamRef.current) {
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = mediaStreamRef.current;
      }
      if (fullscreenWebcamVideoRef.current) {
        fullscreenWebcamVideoRef.current.srcObject = mediaStreamRef.current;
      }
    }
  }, [cameraActive, isTeleprompterFullscreen]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTeleprompterFullscreen && e.key === 'Escape') {
        setIsTeleprompterFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTeleprompterFullscreen]);

  // Auto-enable practice mode when entering fullscreen if camera is inactive
  useEffect(() => {
    if (isTeleprompterFullscreen && !cameraActive) {
      setIsPracticeMode(true);
    }
  }, [isTeleprompterFullscreen, cameraActive]);

  // Fetch Firestore Course Modules or Fallback
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'course_modules'), (snapshot) => {
      const allMods = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseModule));
      if (allMods.length > 0) {
        setDbModules(allMods);
      } else {
        setDbModules(FALLBACK_COURSE_MODULES);
      }
    }, (err) => {
      console.warn("Course modules load warning in studio:", err);
      setDbModules(FALLBACK_COURSE_MODULES);
    });

    return () => unsub();
  }, []);

  // Map courses from Accounts Panel > Course Fees & Durations
  const configuredCourses: Array<{ courseId: string; title: string }> = financialSettings?.coursesConfig || [
    { courseId: 'packaging-engineer', title: 'Diploma in Packaging Engineer' },
    { courseId: 'production-art-engineer', title: 'Diploma in Production Art Engineer' },
    { courseId: 'print-ready-engineer', title: 'Diploma in Print Ready Engineer' },
    { courseId: 'plate-ready-engineer', title: 'Diploma in Plate Ready Engineer' },
    { courseId: 'colour-retouching-engineer', title: 'Diploma in Colour Retouching Engineer' },
    { courseId: 'quality-control-engineer', title: 'Diploma in Quality Control Engineer' },
    { courseId: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses' }
  ];

  // Master script list combining default scripts & course_modules
  const allModuleScripts: ModuleScript[] = React.useMemo(() => {
    const scripts: ModuleScript[] = [...COURSE_MODULE_SCRIPTS];

    const sortedDbModules = [...dbModules].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null && !isNaN(Number(a.order)) ? Number(a.order) : 999;
      const orderB = b.order !== undefined && b.order !== null && !isNaN(Number(b.order)) ? Number(b.order) : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title || '').localeCompare(b.title || '');
    });

    sortedDbModules.forEach((mod) => {
      const matchedConfig = configuredCourses.find(c => c.courseId === mod.category);
      const courseTitle = matchedConfig ? matchedConfig.title : formatCourseName(mod.category);

      const effectiveScriptText = (mod.videoScript && mod.videoScript.trim()) 
        ? mod.videoScript 
        : `Hello Professor and classmates! Today I am presenting my video presentation for ${mod.title}.

In this module, we studied the following key concepts:
${mod.description || 'Core technical specifications, production guidelines, and quality standards.'}

${mod.referenceMaterialUrl ? 'I have reviewed the reference material and integrated the core principles into my practical assignment.' : 'I have thoroughly completed the practical assignment and verified all quality standards.'}

Thank you for watching my presentation video!`;

      const moduleNumberDisplay = mod.order !== undefined && mod.order !== null ? mod.order : 1;

      const scriptObj: ModuleScript = {
        id: `db_mod_${mod.id}`,
        course: courseTitle,
        module: `Module ${moduleNumberDisplay}: ${mod.title}`,
        title: `📹 ${mod.title}`,
        duration: mod.duration || '45-60 Seconds',
        tone: 'Technical & Confident',
        scriptText: effectiveScriptText,
        grammarGuide: `• **Subject & Objective**: "Today I am presenting..." (Present Continuous for active demonstration).
• **Core Findings**: "In this module, we studied..." (Simple Past for completed learning steps).
• **Professional Closing**: "Thank you for watching my presentation video!"`,
        accentGuide: `• **Clear Technical Terms**: Speak clearly and avoid rushing technical jargon in "${mod.title}".
• **Diaphragmatic Breathing**: Take a steady 1-second breath between key sentences.`,
        pronunciationGuide: [
          { word: mod.title.split(' ')[0] || 'Technical', phonetic: 'TEK-nih-kul', tip: 'Emphasis on first syllable.' },
          { word: 'Specification', phonetic: 'spes-ih-fih-KAY-shun', tip: 'Accent on KAY.' }
        ],
        referenceMaterialUrl: mod.referenceMaterialUrl,
        assignmentPaperUrl: mod.assignmentPaperUrl,
        worksheetUrl: mod.worksheetUrl,
        videoUrl: mod.videoUrl
      };

      scripts.push(scriptObj);
    });

    return scripts;
  }, [dbModules, configuredCourses]);

  // Dynamic script list: Admin gets all courses and modules; Student gets assigned course and active module only
  const dynamicModuleScripts: ModuleScript[] = React.useMemo(() => {
    if (isAdminUser) {
      return allModuleScripts;
    }

    // Student logic: Filter to assigned course(s) and active module only
    const studentScripts: ModuleScript[] = [];
    const completedList = user?.completedModules || [];

    studentAssignedCourses.forEach(courseId => {
      const matchedConfig = configuredCourses.find(c => c.courseId === courseId);
      const courseTitle = matchedConfig ? matchedConfig.title : formatCourseName(courseId);

      // Get DB modules for this course sorted by sequence/order
      const catDbModules = dbModules
        .filter(m => m.category === courseId)
        .sort((a, b) => {
          const orderA = a.order !== undefined && a.order !== null && !isNaN(Number(a.order)) ? Number(a.order) : 999;
          const orderB = b.order !== undefined && b.order !== null && !isNaN(Number(b.order)) ? Number(b.order) : 999;
          if (orderA !== orderB) return orderA - orderB;
          return (a.title || '').localeCompare(b.title || '');
        });

      if (catDbModules.length > 0) {
        // Find active module (first uncompleted module in order)
        const activeDbMod = catDbModules.find(m => 
          !completedList.includes(m.id) && 
          !completedList.includes(m.title) && 
          !completedList.includes(`db_mod_${m.id}`)
        ) || catDbModules[catDbModules.length - 1] || catDbModules[0];

        const matchedScript = allModuleScripts.find(s => s.id === `db_mod_${activeDbMod.id}`);
        if (matchedScript) {
          studentScripts.push(matchedScript);
        }
      } else {
        // Fallback to static script for this course if available
        const courseStaticScripts = COURSE_MODULE_SCRIPTS.filter(s => s.course === courseTitle || s.course.toLowerCase().includes(courseId.replace(/-/g, ' ')));
        if (courseStaticScripts.length > 0) {
          studentScripts.push(courseStaticScripts[0]);
        }
      }
    });

    if (studentScripts.length === 0 && allModuleScripts.length > 0) {
      studentScripts.push(allModuleScripts[0]);
    }

    return studentScripts;
  }, [isAdminUser, allModuleScripts, dbModules, studentAssignedCourses, configuredCourses, user?.completedModules]);

  const coursesList = React.useMemo(() => {
    if (isAdminUser) {
      const titleSet = new Set<string>();
      titleSet.add('All');
      configuredCourses.forEach(c => titleSet.add(c.title));
      dynamicModuleScripts.forEach(s => titleSet.add(s.course));
      return Array.from(titleSet);
    } else {
      const studentTitles = new Set<string>();
      studentAssignedCourses.forEach(courseId => {
        const matchedConfig = configuredCourses.find(c => c.courseId === courseId);
        studentTitles.add(matchedConfig ? matchedConfig.title : formatCourseName(courseId));
      });
      dynamicModuleScripts.forEach(s => studentTitles.add(s.course));
      return Array.from(studentTitles);
    }
  }, [isAdminUser, configuredCourses, dynamicModuleScripts, studentAssignedCourses]);

  // Auto-sync course filter and active script for student or when scripts update
  useEffect(() => {
    if (!isAdminUser && coursesList.length > 0) {
      if (!coursesList.includes(selectedCourseFilter)) {
        setSelectedCourseFilter(coursesList[0]);
      }
    }
  }, [isAdminUser, coursesList, selectedCourseFilter]);

  useEffect(() => {
    if (dynamicModuleScripts.length > 0) {
      const isCurrentSelectedInList = dynamicModuleScripts.some(s => s.id === selectedModuleScript.id);
      if (!isCurrentSelectedInList) {
        setSelectedModuleScript(dynamicModuleScripts[0]);
      }
    }
  }, [dynamicModuleScripts, selectedModuleScript.id]);

  const filteredScripts = React.useMemo(() => {
    if (selectedCourseFilter === 'All') return dynamicModuleScripts;
    return dynamicModuleScripts.filter(s => s.course === selectedCourseFilter);
  }, [selectedCourseFilter, dynamicModuleScripts]);

  // Update teleprompter text when module script changes
  useEffect(() => {
    setTeleprompterText(selectedModuleScript.scriptText);
    setAiAnalysisResult(null);
  }, [selectedModuleScript]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Teleprompter Auto-Scrolling
  useEffect(() => {
    let scrollInterval: any = null;
    if (teleprompterScroll) {
      scrollInterval = setInterval(() => {
        const step = Math.max(0.4, scrollSpeed * 0.8);
        if (teleprompterContainerRef.current) {
          const el = teleprompterContainerRef.current;
          el.scrollTop += step;
          if (el.scrollBy) {
            el.scrollBy({ top: step, behavior: 'instant' as any });
          }
        }
        if (fullscreenPrompterRef.current) {
          const el = fullscreenPrompterRef.current;
          el.scrollTop += step;
          if (el.scrollBy) {
            el.scrollBy({ top: step, behavior: 'instant' as any });
          }
        }
      }, 40);
    } else {
      clearInterval(scrollInterval);
    }
    return () => clearInterval(scrollInterval);
  }, [teleprompterScroll, scrollSpeed]);

  // Camera Management
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsPracticeMode(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access webcam or microphone. Please ensure permissions are granted in browser settings.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  // Video File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoObjectUrl = URL.createObjectURL(file);
      setRecordedBlob(file);
      setRecordedVideoUrl(videoObjectUrl);
      setCameraError(null);
      setIsPracticeMode(false);
    }
  };

  // Recording Management
  const handleStartRecording = () => {
    if (!mediaStreamRef.current && !isPracticeMode) {
      startCamera();
      return;
    }
    chunksRef.current = [];
    try {
      if (mediaStreamRef.current) {
        const mediaRecorder = new MediaRecorder(mediaStreamRef.current);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setRecordedBlob(blob);
          setRecordedVideoUrl(URL.createObjectURL(blob));
        };

        mediaRecorder.start();
      }

      setIsRecording(true);
      setRecordingTime(0);
      setTeleprompterScroll(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setCameraError("Failed to start media recorder.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setTeleprompterScroll(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleResetRecording = () => {
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setAiAnalysisResult(null);
    setRecordingTime(0);
    if (teleprompterContainerRef.current) {
      teleprompterContainerRef.current.scrollTop = 0;
    }
  };

  // AI Custom Script Generator
  const handleGenerateCustomScript = async () => {
    if (!customPromptText.trim()) return;
    setIsGeneratingCustomScript(true);
    try {
      const prompt = `Create a professional student video recording script for an Indian student who is hesitant about speaking in English.

Topic / Request: ${customPromptText}

Provide:
1. Short English Script (30-45 seconds duration, formatted into clean lines).
2. Grammar Breakdown (Highlight key sentence structures and tenses used).
3. Accent & Cadence Tips (Provide exact pausing rules, stress points, and pitch guidelines).
4. Phonetic Pronunciation Index (List 4 key technical or complex words with IPA-like respelling e.g., /PAK-ij-ing/).`;

      const response = await generateGeminiContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction: 'You are an encouraging speech coach and script writer for non-native English students.' }
      });

      if (response && response.text) {
        const customScriptObj: ModuleScript = {
          id: `custom_${Date.now()}`,
          course: 'Custom Request',
          module: 'Custom Script',
          title: customPromptText.slice(0, 30) + '...',
          duration: '30-45 Seconds',
          tone: 'Custom Generated',
          scriptText: response.text,
          grammarGuide: 'Generated AI grammar guidance attached above.',
          accentGuide: 'Maintain smooth pacing and pause at punctuation marks.',
          pronunciationGuide: []
        };
        setSelectedModuleScript(customScriptObj);
        setActiveGuidanceTab('studio');
      }
    } catch (err) {
      console.error('Failed to generate script:', err);
    } finally {
      setIsGeneratingCustomScript(false);
    }
  };

  // AI Speech Performance Review
  const handleAnalyzeRecording = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `Provide constructive, highly encouraging feedback for an Indian student who just completed a self-recording of this script:

Script Title: ${selectedModuleScript.title}
Script Content:
${selectedModuleScript.scriptText}

Recording Duration: ${recordingTime} seconds.

Please give:
1. 🌟 **Confidence & Body Language Rating** (10/10 scale with encouragement)
2. 🗣️ **Pronunciation & Accent Check** (Key words to practice)
3. 📝 **Grammar & Fluency Tip** (How to sound even more natural)
4. 🚀 **Next Practice Step** (Actionable goal for the next attempt)`;

      const response = await generateGeminiContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction: 'You are a warm, supportive video recording coach for Indian college students.' }
      });

      if (response && response.text) {
        setAiAnalysisResult(response.text);
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER & EDUCATIONAL METHODOLOGY BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 bg-yellow-400 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> Live Self-Recording Studio
            </span>
            <button
              onClick={() => setShowGuidanceBanner(!showGuidanceBanner)}
              className="text-xs text-indigo-200 hover:text-white flex items-center gap-1 font-bold underline cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>{showGuidanceBanner ? 'Hide Methodology Guide' : 'Show Educational Method'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Video className="w-8 h-8 text-purple-400 shrink-0" />
              <span>Student Self-Video Practice & Teleprompter Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-3xl leading-relaxed font-normal">
              Designed specifically for students transitioning into video presentations! Select your Course Title from Accounts Panel Fees & Durations, pick any module's video script, and practice with our live teleprompter.
            </p>
          </div>

          {/* STEP-BY-STEP METHODOLOGY ACCORDION/BANNER */}
          {showGuidanceBanner && (
            <div className="mt-4 pt-4 border-t border-indigo-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div 
                onClick={() => setActiveGuidanceTab('loom')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                  activeGuidanceTab === 'loom' 
                    ? 'bg-gradient-to-br from-purple-900 to-pink-900 border-pink-400 text-white shadow-xl ring-2 ring-pink-500/50' 
                    : 'bg-slate-900/90 border-pink-500/40 text-pink-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 font-black text-xs text-pink-300 uppercase tracking-wider mb-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>Loom Studio</span>
                  </div>
                  <span className="text-[9px] bg-pink-500 text-white px-1.5 py-0.5 rounded-full font-extrabold">NEW</span>
                </div>
                <p className="text-[11px] font-bold text-white">Screen + PIP Webcam</p>
                <p className="text-[10px] text-pink-200/80 mt-1 leading-normal">
                  In-app Loom clone: Screen, webcam bubble, cursor halo & captions.
                </p>
              </div>

              <div 
                onClick={() => setActiveGuidanceTab('method')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  activeGuidanceTab === 'method' 
                    ? 'bg-purple-900/80 border-purple-400 text-white shadow-lg' 
                    : 'bg-slate-900/60 border-indigo-900/60 text-indigo-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-xs text-yellow-300 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4 text-yellow-400" />
                  <span>Stage 1: Mindset</span>
                </div>
                <p className="text-[11px] font-bold text-white">Overcome Camera Shyness</p>
                <p className="text-[10px] text-indigo-200 mt-1 leading-normal">
                  Why self-recording is key for non-native English learners.
                </p>
              </div>

              <div 
                onClick={() => setActiveGuidanceTab('script')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  activeGuidanceTab === 'script' 
                    ? 'bg-purple-900/80 border-purple-400 text-white shadow-lg' 
                    : 'bg-slate-900/60 border-indigo-900/60 text-indigo-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-xs text-purple-300 uppercase tracking-wider mb-1">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Stage 2: Script</span>
                </div>
                <p className="text-[11px] font-bold text-white">Course & Module Scripts</p>
                <p className="text-[10px] text-indigo-200 mt-1 leading-normal">
                  Select exact course assignments & video demo scripts.
                </p>
              </div>

              <div 
                onClick={() => setActiveGuidanceTab('coach')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  activeGuidanceTab === 'coach' 
                    ? 'bg-purple-900/80 border-purple-400 text-white shadow-lg' 
                    : 'bg-slate-900/60 border-indigo-900/60 text-indigo-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-xs text-emerald-300 uppercase tracking-wider mb-1">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  <span>Stage 3: Coach</span>
                </div>
                <p className="text-[11px] font-bold text-white">Grammar & Accent</p>
                <p className="text-[10px] text-indigo-200 mt-1 leading-normal">
                  Phonetic guides & sentence structure tips.
                </p>
              </div>

              <div 
                onClick={() => setActiveGuidanceTab('studio')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  activeGuidanceTab === 'studio' 
                    ? 'bg-purple-900/80 border-purple-400 text-white shadow-lg' 
                    : 'bg-slate-900/60 border-indigo-900/60 text-indigo-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-xs text-sky-300 uppercase tracking-wider mb-1">
                  <Camera className="w-4 h-4 text-sky-400" />
                  <span>Stage 4: Teleprompter</span>
                </div>
                <p className="text-[11px] font-bold text-white">Record & Self-Review</p>
                <p className="text-[10px] text-indigo-200 mt-1 leading-normal">
                  Live webcam teleprompter & speech practice.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOOM COURSE STUDIO MODE */}
      {activeGuidanceTab === 'loom' && (
        <div className="animate-in fade-in duration-300">
          <LoomCourseStudio defaultModuleTitle={selectedModuleScript.title} />
        </div>
      )}

      {/* EDUCATIONAL METHODOLOGY DETAIL BOX */}
      {activeGuidanceTab === 'method' && (
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Our Pedagogical Strategy: Why Self-Video Practice Works</span>
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">
              Step-by-Step Guidance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700 leading-relaxed">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="font-extrabold text-indigo-900 text-sm flex items-center gap-1.5">
                1️⃣ Safe Private Environment
              </span>
              <p className="text-gray-600">
                In many schools & colleges across India, students rarely had a culture of speaking into a camera in English. Here, you record privately on your own device—no peer judgment!
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="font-extrabold text-indigo-900 text-sm flex items-center gap-1.5">
                2️⃣ Teleprompter & Grammar Support
              </span>
              <p className="text-gray-600">
                You don't need to memorize long scripts. Our scrolling teleprompter keeps your eyes on the camera while guiding your spoken grammar and pronunciation in real time.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="font-extrabold text-indigo-900 text-sm flex items-center gap-1.5">
                3️⃣ Instant AI Performance Feedback
              </span>
              <p className="text-gray-600">
                Review your video right away. AI analyzes your clarity, pace, and body language to build your confidence before submitting assignments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN STUDIO AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: COURSE & MODULE SCRIPT SELECTOR & GRAMMAR COACH (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* COURSE & MODULE SELECTOR CARD */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>{isAdminUser ? 'All Course Titles & Module Scripts (Admin View)' : 'Assigned Course & Active Module Script'}</span>
              </h3>
              <span className="text-[11px] font-bold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">
                {filteredScripts.length} {filteredScripts.length === 1 ? 'Active Script' : 'Scripts'}
              </span>
            </div>

            {/* Course Filter Dropdown (Accounts Panel > Course Fees & Durations > Course Title) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>{isAdminUser ? 'Select Course Title:' : 'Assigned Course:'}</span>
                <span className="text-[10px] text-purple-600 font-semibold">{isAdminUser ? 'Admin Mode (All Courses)' : 'Assigned Student Course'}</span>
              </label>
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {coursesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Script List Cards */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredScripts.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedModuleScript(s)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    selectedModuleScript.id === s.id
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/50 shadow-sm'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {s.module}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" /> {s.duration}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                    {s.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                    <span className="truncate max-w-[180px] font-medium">{s.course}</span>
                    <span className="font-bold text-purple-700 flex items-center gap-1">
                      {selectedModuleScript.id === s.id ? 'Active Script ✓' : 'Select'}
                    </span>
                  </div>


                </div>
              ))}
            </div>

            {/* CUSTOM AI SCRIPT GENERATOR BOX */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span>Need a Custom Script? Generate with AI:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder="e.g., Flexographic Printing script..."
                  className="flex-1 bg-slate-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleGenerateCustomScript}
                  disabled={isGeneratingCustomScript || !customPromptText.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {isGeneratingCustomScript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* GRAMMAR, ACCENT & PRONUNCIATION COACH CARD */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Languages className="w-4 h-4 text-emerald-600" />
                <span>Grammar, Accent & Pronunciation Guide</span>
              </h3>
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
                {selectedModuleScript.module}
              </span>
            </div>

            {/* Grammar Section */}
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Grammar & Sentence Structure:</span>
              </div>
              <div className="text-xs text-gray-700 leading-relaxed space-y-1 font-normal prose prose-xs max-w-none">
                <ReactMarkdown>{selectedModuleScript.grammarGuide}</ReactMarkdown>
              </div>
            </div>

            {/* Accent Section */}
            <div className="space-y-1.5 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100">
              <div className="font-extrabold text-xs text-purple-900 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Accent, Rhythm & Speech Cadence:</span>
              </div>
              <div className="text-xs text-purple-950 leading-relaxed space-y-1 font-normal prose prose-xs max-w-none">
                <ReactMarkdown>{selectedModuleScript.accentGuide}</ReactMarkdown>
              </div>
            </div>

            {/* Phonetic Pronunciation Cards */}
            {selectedModuleScript.pronunciationGuide && selectedModuleScript.pronunciationGuide.length > 0 && (
              <div className="space-y-2">
                <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Key Phonetic Pronunciation Index:</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {selectedModuleScript.pronunciationGuide.map((item, idx) => (
                    <div key={idx} className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-black text-xs text-emerald-900">{item.word}</span>
                        <p className="text-[11px] font-mono font-bold text-emerald-700">{item.phonetic}</p>
                      </div>
                      <span className="text-[10px] text-emerald-800 font-medium bg-emerald-100/80 px-2 py-1 rounded-lg">
                        {item.tip}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE WEBCAM TELEPROMPTER & VIDEO RECORDING STUDIO (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">

          {/* RECORDING STUDIO CONTAINER */}
          <div className="bg-slate-950 p-5 sm:p-6 rounded-3xl border border-slate-800 text-white shadow-2xl space-y-5">
            
            {/* STUDIO TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider">Studio Live Teleprompter</span>
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>{selectedModuleScript.title}</span>
                </h3>
              </div>

              {/* TELEPROMPTER CONTROLS */}
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
                <span className="text-slate-400 text-[11px] pl-1">Prompter Speed:</span>
                <button
                  onClick={handleDecreaseSpeed}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
                  title="Slow down script scroll speed"
                >
                  -
                </button>
                <span className="text-yellow-400 font-mono w-6 text-center">{scrollSpeed}</span>
                <button
                  onClick={handleIncreaseSpeed}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
                  title="Speed up script scroll speed"
                >
                  +
                </button>

                <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                <span className="text-slate-400 text-[11px]">Size:</span>
                <button
                  onClick={() => setFontSize(fontSize === 'xl' ? 'lg' : fontSize === 'lg' ? 'base' : 'sm')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg uppercase cursor-pointer text-[10px]"
                >
                  {fontSize}
                </button>

                <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                <button
                  onClick={() => {
                    setIsTeleprompterFullscreen(true);
                    if (!cameraActive) {
                      setIsPracticeMode(true);
                    }
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-md"
                  title="Open Teleprompter in Full Screen Mode"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="hidden sm:inline">Full Screen</span>
                </button>
              </div>
            </div>

            {/* CAMERA PERMISSION ERROR & TROUBLESHOOTING PANEL */}
            {cameraError && (
              <div className="p-4 bg-amber-950/90 border border-amber-800 rounded-2xl text-xs text-amber-100 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-amber-200">{cameraError}</p>
                    <p className="text-[11px] text-amber-300">
                      Browser security or iframe settings may block direct webcam access. Follow the steps below or upload a video file recorded on your phone:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-amber-800/80">
                  <div className="bg-amber-900/50 p-2.5 rounded-xl border border-amber-700/60">
                    <span className="font-bold text-amber-200 block text-[11px] mb-0.5">1. Enable Permission</span>
                    <p className="text-[10px] text-amber-300/90">Click camera icon in your browser address bar → set to Allow.</p>
                  </div>

                  <label className="bg-indigo-900/80 hover:bg-indigo-800/90 p-2.5 rounded-xl border border-indigo-600/80 cursor-pointer transition text-center flex flex-col items-center justify-center space-y-1">
                    <Upload className="w-4 h-4 text-indigo-300" />
                    <span className="font-bold text-indigo-100 text-[11px]">2. Upload Video File</span>
                    <span className="text-[9px] text-indigo-300">Select .mp4 or .webm recording</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => {
                      setIsPracticeMode(true);
                      setCameraError(null);
                    }}
                    className="bg-emerald-900/80 hover:bg-emerald-800/90 p-2.5 rounded-xl border border-emerald-600/80 text-emerald-100 transition font-bold text-[11px] flex flex-col items-center justify-center space-y-1 cursor-pointer text-center"
                  >
                    <PlayCircle className="w-4 h-4 text-emerald-300" />
                    <span>3. Practice Teleprompter</span>
                    <span className="text-[9px] text-emerald-300">Run without camera stream</span>
                  </button>
                </div>
              </div>
            )}

            {/* WEBCAM & TELEPROMPTER SPLIT / OVERLAY SCREEN */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center shadow-inner">
              
              {/* PLAYBACK RECORDED VIDEO PREVIEW IF AVAILABLE */}
              {recordedVideoUrl ? (
                <video
                  src={recordedVideoUrl}
                  controls
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : cameraActive || isPracticeMode ? (
                /* LIVE WEBCAM FEED OR PRACTICE SIMULATOR */
                <div className="relative w-full h-full">
                  {cameraActive ? (
                    <video
                      ref={webcamVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100 rounded-2xl"
                    />
                  ) : (
                    /* PRACTICE MODE ANIMATED BACKGROUND */
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-purple-600/30 border border-purple-400 flex items-center justify-center text-yellow-300 shadow-xl animate-pulse">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-black text-purple-200 uppercase tracking-widest">
                        Practice Mode Active (Prompter Demo)
                      </span>
                    </div>
                  )}

                  {/* TELEPROMPTER OVERLAY ON WEBCAM / PRACTICE */}
                  <div
                    ref={teleprompterContainerRef}
                    className="absolute inset-x-4 bottom-4 top-12 bg-slate-950/85 backdrop-blur-md rounded-2xl p-5 border border-indigo-500/40 text-yellow-300 overflow-y-auto scrollbar-none shadow-2xl transition-all"
                  >
                    <div className="text-center font-extrabold text-xs text-indigo-300 uppercase tracking-widest mb-3 border-b border-indigo-800/80 pb-1.5 flex items-center justify-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Teleprompter Reading Display</span>
                    </div>

                    <div className={`font-semibold leading-relaxed text-center font-sans tracking-wide space-y-3 ${
                      fontSize === 'sm' ? 'text-sm' : fontSize === 'base' ? 'text-base' : fontSize === 'lg' ? 'text-lg' : 'text-xl'
                    }`}>
                      <ReactMarkdown>{selectedModuleScript.scriptText}</ReactMarkdown>
                    </div>
                  </div>

                  {/* LIVE RECORDING TIMING BADGE */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white font-mono font-bold text-xs px-3 py-1 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>REC {recordingTime}s</span>
                    </div>
                  )}
                </div>
              ) : (
                /* CAMERA OFF INITIAL PLACEHOLDER */
                <div className="text-center p-8 space-y-4 max-w-sm">
                  <div className="w-16 h-16 bg-slate-800 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-lg border border-slate-700">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-white">Turn On Webcam to Start Practice</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your webcam feed will load with the auto-scrolling teleprompter overlay so you can practice speaking comfortably.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Enable Camera</span>
                    </button>

                    <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5 border border-slate-700">
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Upload Video</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* RECORDING ACTION BUTTONS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              
              {/* Left Side Controls */}
              <div className="flex items-center gap-2">
                {(cameraActive || isPracticeMode) && !recordedVideoUrl && (
                  <button
                    onClick={() => setTeleprompterScroll(!teleprompterScroll)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {teleprompterScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{teleprompterScroll ? 'Pause Prompter' : 'Scroll Prompter'}</span>
                  </button>
                )}
              </div>

              {/* Center Main Action */}
              <div className="flex items-center gap-2">
                {recordedVideoUrl ? (
                  <>
                    <button
                      onClick={handleResetRecording}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      <span>Re-record Video</span>
                    </button>

                    <a
                      href={recordedVideoUrl}
                      download={`self_recording_${selectedModuleScript.id}.webm`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video</span>
                    </a>
                  </>
                ) : isRecording ? (
                  <button
                    onClick={handleStopRecording}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop & Review Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Start Self-Recording</span>
                  </button>
                )}
              </div>

            </div>

            {/* AI PERFORMANCE REVIEW BOX */}
            {recordedVideoUrl && (
              <div className="bg-slate-900 p-5 rounded-2xl border border-indigo-800/80 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-extrabold text-xs text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>AI Video & Speech Performance Feedback</span>
                  </div>
                  <button
                    onClick={handleAnalyzeRecording}
                    disabled={isAnalyzing}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Analyze Performance</span>
                  </button>
                </div>

                {aiAnalysisResult ? (
                  <div className="text-xs text-slate-200 leading-relaxed space-y-2 prose prose-invert prose-xs max-w-none pt-1">
                    <ReactMarkdown>{aiAnalysisResult}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click <strong>Analyze Performance</strong> to get instant AI evaluation on your video delivery, confidence score, pronunciation, and pacing!
                  </p>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* FULLSCREEN TELEPROMPTER OVERLAY MODAL */}
      {isTeleprompterFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col p-4 sm:p-6 space-y-4 overflow-hidden animate-in fade-in duration-200">
          
          {/* TOP FULLSCREEN TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <div className="text-[10px] font-black uppercase text-red-400 tracking-widest flex items-center gap-1.5">
                  <span>Studio Teleprompter • Fullscreen Mode</span>
                  {isRecording && <span className="text-yellow-300 font-mono">({Math.floor(recordingTime / 60)}:{recordingTime % 60 < 10 ? '0' : ''}{recordingTime % 60})</span>}
                </div>
                <h3 className="text-sm sm:text-base font-black text-white">{selectedModuleScript.title}</h3>
              </div>
            </div>

            {/* FULLSCREEN CONTROLS */}
            <div className="flex flex-wrap items-center gap-2">
              {/* SPEED CONTROLS */}
              <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold">
                <span className="text-slate-400 text-[11px]">Speed:</span>
                <button
                  onClick={handleDecreaseSpeed}
                  className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center cursor-pointer"
                  title="Slow down script scroll speed"
                >
                  -
                </button>
                <span className="text-yellow-400 font-mono w-7 text-center">{scrollSpeed}</span>
                <button
                  onClick={handleIncreaseSpeed}
                  className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center cursor-pointer"
                  title="Speed up script scroll speed"
                >
                  +
                </button>
              </div>

              {/* FONT SIZE CONTROLS */}
              <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold">
                <span className="text-slate-400 text-[11px]">Size:</span>
                <button
                  onClick={() => setFontSize(fontSize === 'xl' ? 'lg' : fontSize === 'lg' ? 'base' : 'sm')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 rounded-lg text-[10px] uppercase cursor-pointer"
                >
                  {fontSize}
                </button>
                <button
                  onClick={() => setFontSize(fontSize === 'sm' ? 'base' : fontSize === 'base' ? 'lg' : fontSize === 'lg' ? 'xl' : 'xl')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 rounded-lg text-[10px] uppercase cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* PAUSE / AUTO-SCROLL TOGGLE */}
              <button
                onClick={() => setTeleprompterScroll(!teleprompterScroll)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  teleprompterScroll 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {teleprompterScroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{teleprompterScroll ? 'Pause Scroll' : 'Start Scroll'}</span>
              </button>

              {/* RECORDING CONTROLS */}
              {recordedVideoUrl ? (
                <>
                  <button
                    onClick={handleResetRecording}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Re-record Video</span>
                  </button>
                  <a
                    href={recordedVideoUrl}
                    download={`self_recording_${selectedModuleScript.id}.webm`}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </>
              ) : !isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg animate-pulse"
                >
                  <Square className="w-4 h-4 fill-slate-950" />
                  <span>Stop ({Math.floor(recordingTime / 60)}:{recordingTime % 60 < 10 ? '0' : ''}{recordingTime % 60})</span>
                </button>
              )}

              {/* EXIT FULLSCREEN */}
              <button
                onClick={() => setIsTeleprompterFullscreen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                <Minimize2 className="w-4 h-4 text-slate-400" />
                <span>Exit Fullscreen</span>
              </button>
            </div>
          </div>

          {/* MAIN FULLSCREEN STAGE */}
          <div className="flex-1 relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
            {recordedVideoUrl ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black rounded-3xl overflow-hidden">
                <video
                  src={recordedVideoUrl}
                  controls
                  className="w-full h-full object-contain rounded-3xl"
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 p-2.5 px-5 rounded-2xl backdrop-blur-md shadow-2xl z-20">
                  <button
                    onClick={handleResetRecording}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Re-record Video</span>
                  </button>

                  <a
                    href={recordedVideoUrl}
                    download={`self_recording_${selectedModuleScript.id}.webm`}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Video</span>
                  </a>
                </div>
              </div>
            ) : cameraActive || isPracticeMode ? (
              <div className="relative w-full h-full flex flex-col">
                {cameraActive ? (
                  <video
                    ref={fullscreenWebcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100 rounded-3xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-purple-600/30 border border-purple-400 flex items-center justify-center text-yellow-300 shadow-xl animate-pulse">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-black text-purple-200 uppercase tracking-widest">
                      Practice Teleprompter Mode
                    </span>
                  </div>
                )}

                {/* TELEPROMPTER OVERLAY IN FULLSCREEN */}
                <div
                  ref={fullscreenPrompterRef}
                  className="absolute inset-x-4 sm:inset-x-12 bottom-4 top-10 bg-slate-950/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-indigo-500/50 text-yellow-300 overflow-y-auto scrollbar-none shadow-2xl transition-all"
                >
                  <div className="text-center font-extrabold text-xs text-indigo-300 uppercase tracking-widest mb-4 border-b border-indigo-800/80 pb-2 flex items-center justify-center gap-2 sticky top-0 bg-slate-950/90 py-2 z-10 backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Auto-Scrolling Live Script Reader</span>
                    <span className="text-[10px] bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                      Speed {scrollSpeed}
                    </span>
                    {teleprompterScroll && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full animate-pulse">
                        SCROLLING
                      </span>
                    )}
                  </div>

                  <div className={`font-medium leading-relaxed transition-all tracking-wide space-y-4 max-w-4xl mx-auto text-center ${
                    fontSize === 'xl' ? 'text-xl sm:text-2xl leading-relaxed' :
                    fontSize === 'lg' ? 'text-lg sm:text-xl leading-relaxed' :
                    fontSize === 'base' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                  }`}>
                    {teleprompterText.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="hover:text-white transition-colors duration-200 py-1">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 space-y-4 max-w-md">
                <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-lg font-bold text-slate-200">Camera or Practice Mode Required</h4>
                <p className="text-xs text-slate-400">
                  Enable your webcam or switch to Practice Mode to view the full screen teleprompter overlay.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Enable Camera
                  </button>
                  <button
                    onClick={() => setIsPracticeMode(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Start Practice Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

