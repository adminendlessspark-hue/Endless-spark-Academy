import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, Video, Mic, MicOff, Square, RefreshCcw, Maximize2, Minimize2, 
  Download, Upload, Sparkles, Captions, MousePointer, Layers, Play, Pause, 
  CheckCircle2, AlertCircle, ExternalLink, Settings, Volume2, Move, Eye, EyeOff,
  Copy, FileText, ChevronRight, X, Radio, ArrowUpRight, GraduationCap, BookOpen
} from 'lucide-react';
import { cn } from '../utils';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { FALLBACK_COURSE_MODULES } from '../fallbackData';

const COURSE_NAME_MAP: Record<string, string> = {
  'packaging-engineer': 'Packaging Engineer',
  'production-art-engineer': 'Production Art Engineer',
  'print-ready-engineer': 'Print Ready Engineer',
  'plate-ready-engineer': 'Plate Ready Engineer',
  'colour-retouching-engineer': 'Colour Retouching Engineer',
  'quality-control-engineer': 'Quality Control Engineer',
  'printing-and-packaging-cross-courses': 'Printing & Packaging Cross Courses',
  'software-tool-library-acrobat': 'Software Tool Library > Adobe Acrobat',
  'software-tool-library-illustrator': 'Software Tool Library > Adobe Illustrator',
  'software-tool-library-photoshop': 'Software Tool Library > Adobe Photoshop',
  'software-tool-library': 'Software Tool Library',
  'quality-check-process': 'Quality Check Process'
};

const DYNAMIC_TOPICS_BY_CATEGORY: Record<string, string[]> = {
  'software-tool-library-acrobat': [
    'Adobe Acrobat PDF/X Preflighting & Prepress Output Preview',
    'Spot Color Remapping & Ink Coverage Analysis in Acrobat',
    'PitStop Automatic Prepress Action List Processing',
    'Bleed, Trim & Crop Box Calibration in Acrobat'
  ],
  'software-tool-library-illustrator': [
    'Packaging Delineation & Die-Line Layer Isolation',
    'Trapping, Overprint & Knockout Preview Settings',
    'Barcode Generation, Quiet Zone & Vector Optimization',
    'Esko Studio 3D Packaging Folding Preview'
  ],
  'software-tool-library-photoshop': [
    'CMYK Separation & GCR/UCR Retouching Curves',
    '300% TAC Total Area Coverage Ink Limit Reduction',
    'Spot Varnish & Foil Metallic Channel Masks',
    'Unsharp Masking & High-Resolution Image Prep for Offset'
  ],
  'quality-check-process': [
    'Spectrophotometer DeltaE Audit Procedure',
    'ISO Barcode Verification & Scan Grade Test',
    'Crease Resistance & Rub Test Quality Audit',
    'Standard Operating Procedure for Pre-press Artwork Signoff'
  ],
  'packaging-engineer': [
    'Structural Packaging Design & Flute Caliper Calculation',
    'Folding Carton Tolerances & Cutting Die Layout',
    'Corrugated Box Compression Strength (BCT & ECT)'
  ],
  'production-art-engineer': [
    'Vector Asset Optimization & Layer Standards',
    'Trapping & Bleed Allowance Setup',
    'Barcode Quiet Zone & Industrial Vector Cleanup'
  ],
  'print-ready-engineer': [
    'PDF/X-1a vs PDF/X-4 Export Standards',
    'ICC Profile Embedding & Color Separations',
    'Preflighting Checks in Adobe Acrobat'
  ],
  'plate-ready-engineer': [
    'Imposition Schemes & Head-to-Head Margins',
    'CTP Thermal Platemaking & Chemical Wash',
    'Grip Edge Safety Allowance Setup'
  ],
  'colour-retouching-engineer': [
    'CMYK Color Separation & Gray Component Replacement',
    'TAC Ink Limit Allocation & Spot Channels',
    'Color Proof Matching vs Press Sheet Audit'
  ],
  'quality-control-engineer': [
    'Densitometry Standards & Dot Gain (TVI)',
    'DeltaE Color Difference Target Audit',
    'Mechanical Slur & Registration Marks'
  ]
};

const formatCourseName = (cat: string) => {
  if (!cat) return 'General Course';
  const key = cat.toLowerCase().trim();
  if (COURSE_NAME_MAP[key]) return COURSE_NAME_MAP[key];
  return cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

interface LoomCourseStudioProps {
  onSave?: (blob: Blob, videoUrl: string, metadata: { title: string; courseModuleId?: string }) => void;
  defaultModuleTitle?: string;
  isStandaloneWindow?: boolean;
}

export default function LoomCourseStudio({ 
  onSave, 
  defaultModuleTitle = "Course Video Tutorial",
  isStandaloneWindow = false 
}: LoomCourseStudioProps) {
  // Mode selection: 'screen-cam' (Loom style), 'screen-only', 'cam-only'
  const [recordingMode, setRecordingMode] = useState<'screen-cam' | 'screen-only' | 'cam-only'>('screen-cam');

  // Media Streams
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // States
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Customization Options
  const [bubblePosition, setBubblePosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center' | 'custom'>('bottom-left');
  const [bubbleX, setBubbleX] = useState<number>(0.04); // Relative 0.0 to 1.0 position
  const [bubbleY, setBubbleY] = useState<number>(0.68); // Relative 0.0 to 1.0 position
  const [isDraggingBubble, setIsDraggingBubble] = useState<boolean>(false);
  const [bubbleSize, setBubbleSize] = useState<'sm' | 'md' | 'lg'>('md'); // sm=120px, md=180px, lg=240px
  const [bubbleShape, setBubbleShape] = useState<'circle' | 'square' | 'rounded'>('circle');
  const [cursorEffect, setCursorEffect] = useState<boolean>(true);
  const [cursorHaloColor, setCursorHaloColor] = useState<string>('#EAB308'); // Yellow halo
  
  // Captions & Video Recording Language Options
  const [showLiveCaptions, setShowLiveCaptions] = useState<boolean>(true);
  const [captionLanguage, setCaptionLanguage] = useState<string>('en-US'); // Recording language
  const [captionColor, setCaptionColor] = useState<string>('#fde047'); // Default yellow
  const [captionPosition, setCaptionPosition] = useState<'bottom' | 'top'>('bottom');
  const [captionStyle, setCaptionStyle] = useState<'pill' | 'box' | 'minimal'>('pill');
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const [fullTranscript, setFullTranscript] = useState<string[]>([]);
  const [showCaptionEditor, setShowCaptionEditor] = useState<boolean>(false);
  const [customCaptionInput, setCustomCaptionInput] = useState<string>('');

  // Dynamic Logo Overlay Options
  const [showLogoOverlay, setShowLogoOverlay] = useState<boolean>(true);
  const [logoText, setLogoText] = useState<string>('Endless Spark Academy');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right');
  const [logoSize, setLogoSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [logoOpacity, setLogoOpacity] = useState<number>(0.85);
  const [logoBgStyle, setLogoBgStyle] = useState<'none' | 'glass' | 'white'>('none');
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);

  // Toggle Picture-in-Picture Floating Camera Bubble for Live Viewing over External Apps
  const handleTogglePiP = async () => {
    if (!camVideoRef.current) {
      alert("Camera stream is not active. Click 'Start Studio Capture' first.");
      return;
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        await camVideoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (err) {
      console.warn("Picture-in-Picture error:", err);
      alert("Floating Camera Bubble (Picture-in-Picture) allows your webcam bubble to float over other apps like Adobe Acrobat or Illustrator. Please ensure camera capture is enabled first.");
    }
  };

  const [teleprompterText, setTeleprompterText] = useState<string>(
    "Welcome to this course video tutorial! Today we will explore technical specifications, step-by-step workflow, and best practices."
  );
  const [showTeleprompter, setShowTeleprompter] = useState<boolean>(false);
  const [teleprompterScroll, setTeleprompterScroll] = useState<boolean>(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1);

  // Video title & module assignment
  const [tutorialTitle, setTutorialTitle] = useState<string>(defaultModuleTitle);
  const [selectedCourseModule, setSelectedCourseModule] = useState<string>('');
  const [selectedCourseCategory, setSelectedCourseCategory] = useState<string>('packaging-engineer');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [availableModules, setAvailableModules] = useState<{ id: string; title: string; category: string; order?: number }[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Filtered Course Modules sorted strictly by sequence / order
  const filteredModules = availableModules
    .filter(m => {
      if (courseFilter === 'all') return true;
      if (courseFilter === 'software-tool-library') {
        return m.category.startsWith('software-tool-library');
      }
      return m.category === courseFilter;
    })
    .sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
      const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });

  // Dynamic Video Topics based on current filter or active category
  const activeTopicKey = courseFilter !== 'all' ? courseFilter : (selectedCourseCategory || 'packaging-engineer');
  const dynamicTopics = DYNAMIC_TOPICS_BY_CATEGORY[activeTopicKey] || DYNAMIC_TOPICS_BY_CATEGORY['packaging-engineer'];

  // Computed Active Course Name
  const activeModule = availableModules.find(m => m.id === selectedCourseModule);
  const activeCourseName = activeModule 
    ? formatCourseName(activeModule.category)
    : formatCourseName(selectedCourseCategory);

  // Refs
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const camVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number; clickPulse: number }>({ x: 0, y: 0, clickPulse: 0 });
  const speechRecognitionRef = useRef<any>(null);
  const prompterContainerRef = useRef<HTMLDivElement>(null);

  // Fetch course modules for optional binding
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const snap = await getDocs(collection(db, 'course_modules'));
        let mods = snap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Untitled Module',
          category: doc.data().category || 'packaging-engineer',
          order: doc.data().order !== undefined && doc.data().order !== null ? Number(doc.data().order) : 999
        }));

        const fallbacks = FALLBACK_COURSE_MODULES.map(m => ({
          id: m.id,
          title: m.title,
          category: m.category || 'packaging-engineer',
          order: m.order !== undefined && m.order !== null ? Number(m.order) : 999
        }));

        if (mods.length === 0) {
          mods = fallbacks;
        } else {
          const existingIds = new Set(mods.map(m => m.id));
          fallbacks.forEach(f => {
            if (!existingIds.has(f.id)) mods.push(f);
          });
        }

        // Sort modules by sequence / order
        mods.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.title.localeCompare(b.title);
        });

        setAvailableModules(mods);
        if (mods.length > 0) {
          setSelectedCourseModule(mods[0].id);
          setSelectedCourseCategory(mods[0].category);
        }
      } catch (e) {
        console.warn("Could not load course modules for Loom studio, using fallbacks:", e);
        const fallbacks = FALLBACK_COURSE_MODULES.map(m => ({
          id: m.id,
          title: m.title,
          category: m.category || 'packaging-engineer'
        }));
        setAvailableModules(fallbacks);
        if (fallbacks.length > 0) {
          setSelectedCourseModule(fallbacks[0].id);
          setSelectedCourseCategory(fallbacks[0].category);
        }
      }
    };
    fetchModules();
  }, []);

  // Track mouse coordinates over canvas preview to synthesize Loom cursor highlight
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mousePosRef.current.x = x;
        mousePosRef.current.y = y;
      }
    };

    const handleMouseDown = () => {
      mousePosRef.current.clickPulse = 1.0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Web Speech API for Auto Captions with Language Selection
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && showLiveCaptions) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = captionLanguage; // Dynamic video recording language

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const final = event.results[i][0].transcript.trim();
              if (final) {
                setFullTranscript(prev => [...prev, final]);
                setCurrentCaption(final);
              }
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (interimTranscript) {
            setCurrentCaption(interimTranscript);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("Speech recognition warning:", err);
        };

        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn("Speech recognition setup error:", err);
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch(e){}
      }
    };
  }, [showLiveCaptions, captionLanguage]);

  // Export Subtitles as .SRT or .VTT File
  const handleExportSubtitles = (format: 'srt' | 'vtt') => {
    if (fullTranscript.length === 0 && !currentCaption) {
      alert("No transcript lines recorded yet. Start recording and speak or enter captions first.");
      return;
    }

    const lines = fullTranscript.length > 0 ? fullTranscript : [currentCaption];
    let content = format === 'vtt' ? "WEBVTT\n\n" : "";

    lines.forEach((line, index) => {
      const startTime = index * 4;
      const endTime = startTime + 3.8;

      const formatSrtTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${hrs}:${mins}:${secs}${format === 'vtt' ? '.' : ','}${ms}`;
      };

      if (format === 'srt') {
        content += `${index + 1}\n`;
      }
      content += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
      content += `${line}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tutorialTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_subtitles.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Teleprompter Auto-Scroll
  useEffect(() => {
    let interval: any = null;
    if (teleprompterScroll && prompterContainerRef.current) {
      interval = setInterval(() => {
        if (prompterContainerRef.current) {
          prompterContainerRef.current.scrollTop += teleprompterSpeed * 0.8;
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [teleprompterScroll, teleprompterSpeed]);

  // Start Capturing Streams (Screen + Camera)
  const handleStartCapture = async () => {
    setErrorMsg(null);
    let currentScreen: MediaStream | null = null;
    let currentCam: MediaStream | null = null;

    // 1. Capture Screen if needed
    if (recordingMode === 'screen-cam' || recordingMode === 'screen-only') {
      try {
        currentScreen = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: { ideal: 60 },
            displaySurface: 'monitor'
          } as any,
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          } as any,
          selfBrowserSurface: 'include',
          surfaceSwitching: 'include',
          monitorTypeSurfaces: 'include'
        } as any);
        setScreenStream(currentScreen);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = currentScreen;
        }

        // Handle user clicking browser's "Stop Sharing" floating button
        currentScreen.getVideoTracks()[0].onended = () => {
          handleStopRecording();
          handleStopCapture();
        };
      } catch (err) {
        console.warn("Screen share request failed/declined:", err);
      }
    }

    // 2. Capture Camera if needed
    if (recordingMode === 'screen-cam' || recordingMode === 'cam-only') {
      try {
        currentCam = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        setCamStream(currentCam);
        if (camVideoRef.current) {
          camVideoRef.current.srcObject = currentCam;
        }
      } catch (err) {
        console.warn("Camera request failed/declined:", err);
      }
    }

    // Evaluate capture results gracefully
    if (recordingMode === 'screen-cam') {
      if (currentScreen && currentCam) {
        setIsCapturing(true);
      } else if (currentScreen && !currentCam) {
        setIsCapturing(true);
        setRecordingMode('screen-only');
        setErrorMsg("Webcam access was declined or unavailable. Automatically switched to Screen-Only recording mode.");
      } else if (!currentScreen && currentCam) {
        setIsCapturing(true);
        setRecordingMode('cam-only');
        setErrorMsg("Screen share permission was declined or restricted in preview frame. Automatically switched to Webcam-Only mode.");
      } else {
        setErrorMsg("PERM_DECLINED");
      }
    } else if (recordingMode === 'screen-only') {
      if (currentScreen) {
        setIsCapturing(true);
      } else {
        setErrorMsg("PERM_DECLINED_SCREEN");
      }
    } else if (recordingMode === 'cam-only') {
      if (currentCam) {
        setIsCapturing(true);
      } else {
        setErrorMsg("PERM_DECLINED_CAM");
      }
    }
  };

  // Stop All Streams
  const handleStopCapture = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (camStream) {
      camStream.getTracks().forEach(track => track.stop());
      setCamStream(null);
    }
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsCapturing(false);
  };

  // Helper to apply preset bubble placement
  const applyPresetPosition = (pos: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center') => {
    setBubblePosition(pos);
    if (pos === 'bottom-left') { setBubbleX(0.04); setBubbleY(0.68); }
    else if (pos === 'bottom-right') { setBubbleX(0.72); setBubbleY(0.68); }
    else if (pos === 'top-left') { setBubbleX(0.04); setBubbleY(0.05); }
    else if (pos === 'top-right') { setBubbleX(0.72); setBubbleY(0.05); }
    else if (pos === 'center') { setBubbleX(0.38); setBubbleY(0.36); }
  };

  // Canvas Compositor Loop (Render Screen + PIP Webcam Bubble + Cursor Halo + Captions onto single 1080p stream)
  useEffect(() => {
    if (!isCapturing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1920;
    canvas.height = 1080;

    let isActive = true;
    let lastRenderTime = Date.now();

    const renderFrame = () => {
      if (!isActive) return;
      lastRenderTime = Date.now();

      // Clear Canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // A) Draw Screen Video Feed
      if ((recordingMode === 'screen-cam' || recordingMode === 'screen-only') && screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
        ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);
      } else if (recordingMode === 'cam-only' && camVideoRef.current && camVideoRef.current.readyState >= 2) {
        ctx.drawImage(camVideoRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // Placeholder grid if video loading
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Preparing Canvas Recorder...', canvas.width / 2, canvas.height / 2);
      }

      // B) Draw Cursor Halo / Pointer Spotlight
      if (cursorEffect && (recordingMode === 'screen-cam' || recordingMode === 'screen-only')) {
        const cx = mousePosRef.current.x * canvas.width;
        const cy = mousePosRef.current.y * canvas.height;

        if (cx > 0 && cy > 0) {
          // Yellow Cursor Spotlight Halo
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, 32, 0, Math.PI * 2);
          ctx.fillStyle = cursorHaloColor + '55'; // 33% alpha halo
          ctx.fill();
          ctx.strokeStyle = cursorHaloColor;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Click Pulse Animation
          if (mousePosRef.current.clickPulse > 0.05) {
            const pSize = 32 + (1.0 - mousePosRef.current.clickPulse) * 45;
            ctx.beginPath();
            ctx.arc(cx, cy, pSize, 0, Math.PI * 2);
            ctx.strokeStyle = cursorHaloColor;
            ctx.lineWidth = 4 * mousePosRef.current.clickPulse;
            ctx.stroke();
            mousePosRef.current.clickPulse *= 0.88; // decay
          }
          ctx.restore();
        }
      }

      // C) Draw Webcam Bubble (Picture-in-Picture)
      if (recordingMode === 'screen-cam' && camVideoRef.current && camVideoRef.current.readyState >= 2) {
        let bWidth = 320;
        let bHeight = 320;

        if (bubbleSize === 'sm') { bWidth = 240; bHeight = 240; }
        if (bubbleSize === 'lg') { bWidth = 420; bHeight = 420; }

        // Dynamic X and Y calculations based on bubbleX (0..1) and bubbleY (0..1)
        let bx = bubbleX * (canvas.width - bWidth);
        let by = bubbleY * (canvas.height - bHeight);

        // Clamp inside canvas margins
        bx = Math.max(20, Math.min(canvas.width - bWidth - 20, bx));
        by = Math.max(20, Math.min(canvas.height - bHeight - 20, by));

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 24;

        if (bubbleShape === 'circle') {
          ctx.beginPath();
          ctx.arc(bx + bWidth / 2, by + bHeight / 2, bWidth / 2, 0, Math.PI * 2);
          ctx.clip();
        } else if (bubbleShape === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(bx, by, bWidth, bHeight, 28);
          ctx.clip();
        }

        // Calculate object-cover source rectangle to prevent stretching/squishing
        const vVideo = camVideoRef.current;
        const vw = vVideo.videoWidth || 1280;
        const vh = vVideo.videoHeight || 720;
        const targetAspect = bWidth / bHeight; // 1.0 aspect ratio for square/circle bubble
        const videoAspect = vw / vh;

        let sx = 0, sy = 0, sw = vw, sh = vh;
        if (videoAspect > targetAspect) {
          // Video is wider than bubble -> crop left & right sides equally
          sw = vh * targetAspect;
          sx = (vw - sw) / 2;
        } else {
          // Video is taller than bubble -> crop top & bottom equally
          sh = vw / targetAspect;
          sy = (vh - sh) / 2;
        }

        // Draw webcam video with center object-cover crop inside bubble
        ctx.drawImage(vVideo, sx, sy, sw, sh, bx, by, bWidth, bHeight);

        // Bubble Border Glow
        ctx.restore();
        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#a855f7'; // Purple neon border
        if (bubbleShape === 'circle') {
          ctx.beginPath();
          ctx.arc(bx + bWidth / 2, by + bHeight / 2, bWidth / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (bubbleShape === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(bx, by, bWidth, bHeight, 28);
          ctx.stroke();
        }
        ctx.restore();
      }

      // D) Draw Live Captions Subtitle Overlay Bar
      if (showLiveCaptions && currentCaption) {
        ctx.save();
        ctx.font = 'bold 32px sans-serif';
        const textMetrics = ctx.measureText(currentCaption);
        const bgPadding = 24;
        const capWidth = Math.min(canvas.width - 120, textMetrics.width + bgPadding * 2);
        const capX = (canvas.width - capWidth) / 2;
        const capY = captionPosition === 'top' ? 120 : canvas.height - 110;

        if (captionStyle === 'pill') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.beginPath();
          ctx.roundRect(capX, capY - 40, capWidth, 60, 16);
          ctx.fill();
        } else if (captionStyle === 'box') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
          ctx.fillRect(capX, capY - 42, capWidth, 64);
        }

        // Subtitle Text with dynamic color
        ctx.fillStyle = captionColor; 
        ctx.textAlign = 'center';
        ctx.fillText(currentCaption, canvas.width / 2, capY);
        ctx.restore();
      }

      // E) Draw Dynamic Watermark Logo
      if (showLogoOverlay) {
        ctx.save();
        ctx.globalAlpha = logoOpacity;

        const isCustomImg = logoImgRef.current && logoImgRef.current.complete && logoImgRef.current.naturalWidth > 0;

        let drawW = 240;
        let drawH = 60;

        if (isCustomImg) {
          const naturalW = logoImgRef.current!.naturalWidth;
          const naturalH = logoImgRef.current!.naturalHeight;
          const imgAspect = naturalW / naturalH;

          // Target bounding box dimensions based on size selection
          const maxH = logoSize === 'sm' ? 50 : logoSize === 'lg' ? 95 : 70;
          const maxW = logoSize === 'sm' ? 220 : logoSize === 'lg' ? 380 : 290;

          drawH = maxH;
          drawW = drawH * imgAspect;

          if (drawW > maxW) {
            drawW = maxW;
            drawH = drawW / imgAspect;
          }
        } else {
          if (logoSize === 'sm') { drawW = 170; drawH = 44; }
          else if (logoSize === 'lg') { drawW = 300; drawH = 76; }
          else { drawW = 240; drawH = 60; }
        }

        let lx = canvas.width - drawW - 30;
        let ly = 30;

        if (logoPosition === 'top-left') { lx = 30; ly = 30; }
        else if (logoPosition === 'bottom-right') { lx = canvas.width - drawW - 30; ly = canvas.height - drawH - 30; }
        else if (logoPosition === 'bottom-left') { lx = 30; ly = canvas.height - drawH - 30; }

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (isCustomImg) {
          // Optional Background Card for Logo Legibility
          if (logoBgStyle === 'white') {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(lx - 12, ly - 8, drawW + 24, drawH + 16, 12);
            ctx.fill();
            ctx.shadowColor = 'transparent';
          } else if (logoBgStyle === 'glass') {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(lx - 12, ly - 8, drawW + 24, drawH + 16, 12);
            ctx.fill();
            ctx.stroke();
          }

          // Custom Uploaded Image Logo with exact Aspect Ratio (No stretching)
          ctx.drawImage(logoImgRef.current!, lx, ly, drawW, drawH);
        } else {
          // Default High-Quality Branded Watermark Badge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(lx, ly, drawW, drawH, 14);
          ctx.fill();
          ctx.stroke();

          // Badge Accent Dot
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(lx + 22, ly + drawH / 2, logoSize === 'sm' ? 6 : 8, 0, Math.PI * 2);
          ctx.fill();

          // Brand Name Text Label
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${logoSize === 'sm' ? '13px' : logoSize === 'lg' ? '18px' : '15px'} sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(logoText || 'Endless Spark Academy', lx + 38, ly + drawH / 2 + 5);
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    // Background interval fallback:
    // Guarantees continuous canvas stream rendering at ~30 FPS even when the browser tab is hidden/unfocused while user works in Acrobat or Illustrator
    const bgInterval = setInterval(() => {
      if (isActive && (document.hidden || Date.now() - lastRenderTime > 35)) {
        renderFrame();
      }
    }, 1000 / 30);

    return () => {
      isActive = false;
      clearInterval(bgInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCapturing, recordingMode, bubblePosition, bubbleX, bubbleY, bubbleSize, bubbleShape, cursorEffect, cursorHaloColor, showLiveCaptions, currentCaption, captionColor, captionPosition, captionStyle, showLogoOverlay, logoText, logoPosition, logoSize, logoOpacity, logoUrl, logoBgStyle]);

  // Start Recording
  const handleStartRecording = () => {
    if (!canvasRef.current) return;

    chunksRef.current = [];
    try {
      const canvasStream = canvasRef.current.captureStream(60);

      // Add audio tracks from screen and microphone
      if (screenStream && screenStream.getAudioTracks().length > 0) {
        canvasStream.addTrack(screenStream.getAudioTracks()[0]);
      }
      if (camStream && camStream.getAudioTracks().length > 0) {
        canvasStream.addTrack(camStream.getAudioTracks()[0]);
      }

      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9' 
          : 'video/webm'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedVideoUrl(videoUrl);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Speech recognition start
      if (speechRecognitionRef.current && showLiveCaptions) {
        try { speechRecognitionRef.current.start(); } catch (e) {}
      }

      // Teleprompter start
      setTeleprompterScroll(true);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Recording error:", err);
      setErrorMsg("Failed to start MediaRecorder on canvas stream.");
    }
  };

  // Pause / Resume Recording
  const handlePauseToggle = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      setTeleprompterScroll(true);
      if (speechRecognitionRef.current && showLiveCaptions) {
        try { speechRecognitionRef.current.start(); } catch (e) {}
      }
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setTeleprompterScroll(false);
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    setTeleprompterScroll(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }
  };

  // Reset Everything
  const handleReset = () => {
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRecordingTime(0);
    setSaveSuccess(false);
    setCurrentCaption('');
  };

  // Download Recording
  const handleDownload = () => {
    if (!recordedBlob) return;
    const a = document.createElement('a');
    a.href = recordedVideoUrl!;
    a.download = `${tutorialTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_loom_recording.webm`;
    a.click();
  };

  // Save / Upload Recording to Course Module or Callback
  const handleSaveUpload = async () => {
    if (!recordedBlob || !recordedVideoUrl) return;
    setIsSaving(true);

    try {
      if (onSave) {
        onSave(recordedBlob, recordedVideoUrl, {
          title: tutorialTitle,
          courseModuleId: selectedCourseModule
        });
      }

      // Also option to save as standalone Firestore video tutorial record
      await addDoc(collection(db, 'loom_course_tutorials'), {
        title: tutorialTitle,
        moduleId: selectedCourseModule || 'general',
        videoUrl: recordedVideoUrl, // blob url / storage reference
        transcript: fullTranscript.join(' '),
        durationSeconds: recordingTime,
        createdAt: new Date().toISOString()
      });

      setSaveSuccess(true);
    } catch (e) {
      console.error("Error saving recording:", e);
      setErrorMsg("Saved locally! Could not sync to cloud database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Format Time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "bg-slate-950 text-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 flex flex-col space-y-6 max-w-7xl mx-auto w-full",
      isStandaloneWindow && "min-h-screen rounded-none p-4"
    )}>
      
      {/* Hidden Videos for Composite Canvas & Picture-in-Picture Floating Camera */}
      <video ref={screenVideoRef} autoPlay muted className="hidden" />
      <video
        ref={camVideoRef}
        autoPlay
        muted
        playsInline
        className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none z-0"
        onEnterPictureInPicture={() => setIsPiPActive(true)}
        onLeavePictureInPicture={() => setIsPiPActive(false)}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2 flex-wrap">
                <span>CourseLoom Studio</span>
                <span className="text-[10px] bg-purple-900/80 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full uppercase font-mono font-bold">
                  In-App Tutorial Recorder
                </span>
                {activeCourseName && (
                  <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-purple-400/40">
                    <GraduationCap className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Course: {activeCourseName}</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Record screen + webcam bubble + cursor spotlight + real-time subtitles for course modules
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isStandaloneWindow && (
            <button
              onClick={() => {
                window.open('/course-recorder', '_blank', 'width=1280,height=800');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Open in standalone window without browser navigation"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              <span>Launch Studio Window</span>
            </button>
          )}

          <button
            onClick={() => setShowTeleprompter(!showTeleprompter)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border",
              showTeleprompter 
                ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40" 
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-yellow-400" />
            <span>Script Notes</span>
          </button>
        </div>
      </div>

      {/* Course Name Filter & Dynamic Video Topic Bar */}
      <div className="bg-slate-900/90 border border-purple-500/30 p-3.5 sm:p-4 rounded-2xl flex flex-col space-y-3 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Course Name Filter Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <GraduationCap className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Filter Course Name:</span>
            </div>
            <select
              value={courseFilter}
              onChange={(e) => {
                const cat = e.target.value;
                setCourseFilter(cat);
                if (cat !== 'all') {
                  setSelectedCourseCategory(cat);
                  const match = availableModules.find(m => m.category === cat);
                  if (match) {
                    setSelectedCourseModule(match.id);
                  }
                }
              }}
              className="bg-slate-950 border border-purple-500/50 text-white text-xs px-3 py-1.5 rounded-xl font-bold focus:border-pink-500 outline-none cursor-pointer"
            >
              <option value="all">🎓 All Course Categories</option>
              <option value="packaging-engineer">📦 Packaging Engineer</option>
              <option value="production-art-engineer">🎨 Production Art Engineer</option>
              <option value="print-ready-engineer">📄 Print Ready Engineer</option>
              <option value="plate-ready-engineer">💿 Plate Ready Engineer</option>
              <option value="colour-retouching-engineer">🌈 Colour Retouching Engineer</option>
              <option value="quality-control-engineer">🔬 Quality Control Engineer</option>
              <option value="printing-and-packaging-cross-courses">🔀 Printing & Packaging Cross Courses</option>
              <optgroup label="🛠️ Software Tool Library">
                <option value="software-tool-library-acrobat">📕 Adobe Acrobat Pro</option>
                <option value="software-tool-library-illustrator">🎨 Adobe Illustrator</option>
                <option value="software-tool-library-photoshop">🖼️ Adobe Photoshop</option>
              </optgroup>
              <option value="quality-check-process">✅ Quality Check Process</option>
            </select>

            <span className="text-[11px] text-slate-400 font-mono">
              ({filteredModules.length} {filteredModules.length === 1 ? 'module' : 'modules'})
            </span>
          </div>

          {/* Active Course Indicator */}
          <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-500/40 px-3 py-1 rounded-xl text-xs text-purple-200 shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <span className="font-bold text-white">Selected Course: {activeCourseName}</span>
          </div>
        </div>

        {/* Dynamic Topics Bar */}
        {dynamicTopics && dynamicTopics.length > 0 && (
          <div className="flex flex-col space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-[11px] font-bold text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Dynamic Video Topics (Click to set title):</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {dynamicTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => setTutorialTitle(topic)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5",
                    tutorialTitle === topic
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-md font-bold"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:border-purple-500/60 hover:text-white"
                  )}
                >
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="bg-gradient-to-r from-red-950/90 to-slate-900 border border-red-500/60 p-4 sm:p-5 rounded-2xl text-red-100 text-xs shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-200 mb-1">
                  {errorMsg.includes('PERM_DECLINED') ? 'Camera or Screen Share Permission Needed' : 'Permission Status'}
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  {errorMsg === 'PERM_DECLINED' && 'Screen sharing or webcam permission was declined or restricted by browser iframe policy.'}
                  {errorMsg === 'PERM_DECLINED_SCREEN' && 'Screen sharing permission was declined or blocked in the preview frame.'}
                  {errorMsg === 'PERM_DECLINED_CAM' && 'Webcam permission was declined or blocked.'}
                  {!errorMsg.startsWith('PERM_DECLINED') && errorMsg}
                </p>
              </div>
            </div>

            <button
              onClick={() => setErrorMsg(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Actionable Steps Box */}
          {errorMsg.includes('PERM_DECLINED') && (
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2.5 text-xs text-slate-300">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Recommended Fixes:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    window.open('/course-studio', '_blank');
                  }}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Launch in Full Top Tab</span>
                </button>

                <button
                  onClick={() => {
                    setRecordingMode('cam-only');
                    setErrorMsg(null);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
                >
                  <Video className="w-4 h-4 text-pink-400" />
                  <span>Try Webcam Only Mode</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 space-y-1 border-t border-slate-800/80">
                <p>1. Click the 🔒 <strong>Camera / Lock Icon</strong> in your browser address bar.</p>
                <p>2. Set <strong>Camera</strong>, <strong>Microphone</strong>, and <strong>Screen sharing</strong> to <strong>Allow</strong>.</p>
                <p>3. If using an embedded frame, open <strong>Course Studio</strong> in a new browser tab for direct OS permission dialog access.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Studio Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Canvas Preview & Recording Deck (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Main Display / Preview Box */}
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center shadow-inner group">
            
            {/* Live Canvas Compositor or Playback */}
            {!recordedVideoUrl ? (
              <>
                <canvas
                  ref={canvasRef}
                  onPointerDown={(e) => {
                    if (recordingMode !== 'screen-cam' || !canvasRef.current) return;
                    const rect = canvasRef.current.getBoundingClientRect();
                    setIsDraggingBubble(true);
                    const relX = Math.max(0, Math.min(0.82, (e.clientX - rect.left) / rect.width - 0.08));
                    const relY = Math.max(0, Math.min(0.82, (e.clientY - rect.top) / rect.height - 0.08));
                    setBubbleX(relX);
                    setBubbleY(relY);
                    setBubblePosition('custom');
                  }}
                  onPointerMove={(e) => {
                    if (!canvasRef.current) return;
                    const rect = canvasRef.current.getBoundingClientRect();
                    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                    mousePosRef.current.x = relX;
                    mousePosRef.current.y = relY;

                    if (isDraggingBubble && recordingMode === 'screen-cam') {
                      const bx = Math.max(0, Math.min(0.82, relX - 0.08));
                      const by = Math.max(0, Math.min(0.82, relY - 0.08));
                      setBubbleX(bx);
                      setBubbleY(by);
                      setBubblePosition('custom');
                    }
                  }}
                  onPointerUp={() => setIsDraggingBubble(false)}
                  onPointerLeave={() => setIsDraggingBubble(false)}
                  className={cn(
                    "w-full h-full object-contain bg-slate-950 transition-cursor",
                    !isCapturing && "hidden",
                    recordingMode === 'screen-cam' && "cursor-move"
                  )}
                />

                {isCapturing && recordingMode === 'screen-cam' && (
                  <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-200 flex items-center gap-1.5 shadow-lg pointer-events-none">
                    <Move className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                    <span>Click & Drag bubble to reposition dynamically</span>
                  </div>
                )}

                {!isCapturing && (
                  <div className="text-center p-8 space-y-4 max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/20">
                      <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Ready to Record Tutorial</h3>
                      <p className="text-xs text-slate-400">
                        Choose your layout mode below, click <strong>Start Capture</strong>, then record your tutorial video with live webcam bubble overlay.
                      </p>
                    </div>

                    <div className="bg-slate-900/90 border border-purple-500/40 p-4 rounded-xl text-left space-y-2 text-xs text-slate-300 shadow-xl">
                      <div className="font-bold text-purple-300 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-4 h-4 text-pink-400" />
                          <span>To Record Desktop Applications (Illustrator, Photoshop, etc.):</span>
                        </div>
                        <span className="bg-pink-950 text-pink-300 border border-pink-700/60 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold">Important Tip</span>
                      </div>
                      
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        1. Select <strong className="text-pink-300">"Entire screen"</strong> in the browser prompt to record any open desktop software window.
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        2. If other software windows are missing from Chrome's picker, open Course Studio in a <strong>standalone tab</strong> so your OS allows full screen access:
                      </p>

                      <button
                        onClick={() => window.open('/course-studio', '_blank')}
                        className="mt-1 w-full py-2 px-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition text-xs shadow-md cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Open Studio in Standalone Tab (Unlocks All Desktop Windows)</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleStartCapture}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-black transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                      >
                        <Video className="w-4 h-4" />
                        <span>Start Studio Capture</span>
                      </button>

                      <label className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
                        <Upload className="w-4 h-4 text-purple-400" />
                        <span>Upload Video File</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setRecordedBlob(file);
                              setRecordedVideoUrl(url);
                              setErrorMsg(null);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Video Playback Preview */
              <div className="w-full h-full relative bg-black flex flex-col items-center justify-center">
                <video
                  src={recordedVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Live Recording Time Badge & Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md border border-red-500/50 px-3 py-1.5 rounded-full flex items-center gap-2 z-20 shadow-xl">
                <span className={cn("w-2.5 h-2.5 rounded-full bg-red-500", !isPaused && "animate-ping")} />
                <span className="text-xs font-mono font-bold text-white">
                  {formatTime(recordingTime)}
                </span>
                {isPaused && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 font-bold px-1.5 py-0.5 rounded uppercase">
                    PAUSED
                  </span>
                )}
              </div>
            )}

            {/* Live Captions Badge on Top Right */}
            {isRecording && showLiveCaptions && (
              <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md border border-yellow-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs text-yellow-300 font-bold z-20">
                <Captions className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                <span>Auto-Captions Active</span>
              </div>
            )}
          </div>

          {/* Recording Control Deck Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Left Status & Time */}
            <div className="flex items-center gap-3">
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePauseToggle}
                    className="p-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-xl transition flex items-center gap-1.5 text-xs font-bold border border-yellow-500/40 cursor-pointer"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={handleStopRecording}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-black shadow-lg shadow-red-900/40 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Finish Recording</span>
                  </button>
                </div>
              ) : recordedVideoUrl ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Record Again</span>
                  </button>
                </div>
              ) : isCapturing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleStartRecording}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-900/50 flex items-center gap-2 cursor-pointer transform hover:scale-105"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>START RECORDING</span>
                  </button>

                  {(recordingMode === 'screen-cam' || recordingMode === 'cam-only') && (
                    <button
                      onClick={handleTogglePiP}
                      className={cn(
                        "px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer shrink-0 shadow-md",
                        isPiPActive
                          ? "bg-pink-600 text-white border-pink-400 shadow-pink-900/50"
                          : "bg-purple-950/90 text-purple-200 border-purple-500/50 hover:bg-purple-900"
                      )}
                      title="Float camera bubble in an Always-On-Top window over Adobe Acrobat or Illustrator"
                    >
                      <ExternalLink className="w-4 h-4 text-pink-400" />
                      <span>{isPiPActive ? 'Floating Cam Active' : '📌 Float Cam'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowTeleprompter(!showTeleprompter)}
                    className={cn(
                      "px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer",
                      showTeleprompter
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg"
                        : "bg-slate-950 text-amber-300 border-amber-500/40 hover:bg-slate-800"
                    )}
                    title="Open Script Reader & Teleprompter Notes"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>{showTeleprompter ? 'Close Script Notes' : '📝 Script Notes'}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTeleprompter(!showTeleprompter)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer",
                    showTeleprompter
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold"
                      : "bg-slate-950 text-amber-300 border-amber-500/40 hover:bg-slate-800"
                  )}
                  title="Open Script Reader & Teleprompter Notes"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>📝 Script Notes</span>
                </button>
              )}
            </div>

            {/* Title & Module Assignment with Course Name */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              {/* Active Course Name Badge */}
              <div className="flex items-center gap-2 bg-slate-900 border border-purple-500/40 px-3 py-1.5 rounded-xl text-xs shrink-0 shadow-md">
                <GraduationCap className="w-4 h-4 text-pink-400 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-purple-300 font-mono font-bold">Course Name</span>
                  <span className="text-white font-black text-xs truncate max-w-[170px]">
                    {activeCourseName}
                  </span>
                </div>
              </div>

              {/* Tutorial Title Input */}
              <input
                type="text"
                value={tutorialTitle}
                onChange={(e) => setTutorialTitle(e.target.value)}
                placeholder="Tutorial Video Title..."
                className="bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:border-purple-500 outline-none w-full sm:w-52 font-medium"
              />

              {/* Module Selector grouped by Course Name */}
              <select
                value={selectedCourseModule}
                onChange={(e) => {
                  const modId = e.target.value;
                  setSelectedCourseModule(modId);
                  const mod = availableModules.find(m => m.id === modId);
                  if (mod) {
                    setSelectedCourseCategory(mod.category);
                  }
                }}
                className="bg-slate-950 border border-purple-800/60 text-purple-200 text-xs px-3 py-2 rounded-xl focus:border-pink-500 outline-none max-w-[220px] truncate font-bold cursor-pointer"
              >
                <option value="">-- Bind to Module --</option>
                {Object.entries(
                  filteredModules.reduce((acc, m) => {
                    const cName = formatCourseName(m.category);
                    if (!acc[cName]) acc[cName] = [];
                    acc[cName].push(m);
                    return acc;
                  }, {} as Record<string, typeof availableModules>)
                ).map(([courseGroup, mods]) => {
                  const sortedMods = [...mods].sort((a, b) => {
                    const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
                    const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.title.localeCompare(b.title);
                  });
                  return (
                    <optgroup key={courseGroup} label={`🎓 ${courseGroup}`} className="bg-slate-900 text-purple-300 font-bold">
                      {sortedMods.map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-950 text-white font-medium">
                          {m.order !== undefined && m.order !== null ? `#${m.order} - ${m.title}` : m.title}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {/* Right Export / Save Buttons */}
            {recordedVideoUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  title="Download .webm video file"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Download</span>
                </button>

                <button
                  onClick={handleSaveUpload}
                  disabled={isSaving || saveSuccess}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg cursor-pointer",
                    saveSuccess 
                      ? "bg-emerald-600 text-white" 
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/50"
                  )}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saved & Attached!</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>{isSaving ? 'Uploading...' : 'Save & Publish Video'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Studio Customization & Settings Panel (1 col) */}
        <div className="space-y-4">
          
          {/* Mode Selector Box */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>1. Layout Mode</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setRecordingMode('screen-cam')}
                className={cn(
                  "p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer",
                  recordingMode === 'screen-cam' 
                    ? "bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950" 
                    : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Screen + Webcam Bubble</div>
                  <div className="text-[10px] text-slate-400">Loom style screen capture with PIP webcam</div>
                </div>
              </button>

              <button
                onClick={() => setRecordingMode('screen-only')}
                className={cn(
                  "p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer",
                  recordingMode === 'screen-only' 
                    ? "bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950" 
                    : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Screen Only</div>
                  <div className="text-[10px] text-slate-400">Record full display, browser tab, or software window</div>
                </div>
              </button>

              <button
                onClick={() => setRecordingMode('cam-only')}
                className={cn(
                  "p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer",
                  recordingMode === 'cam-only' 
                    ? "bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950" 
                    : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                <div className="p-2 bg-pink-600/20 text-pink-400 rounded-lg">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Webcam Only</div>
                  <div className="text-[10px] text-slate-400">Full face introduction or lecture speech</div>
                </div>
              </button>
            </div>
          </div>

          {/* Webcam PIP Bubble Controls (When Screen + Cam) */}
          {recordingMode === 'screen-cam' && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-pink-400" />
                  <span>2. Dynamic Bubble Placement</span>
                </div>
                <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                  X:{Math.round(bubbleX * 100)}% Y:{Math.round(bubbleY * 100)}%
                </span>
              </div>

              {/* Floating Camera Popout Option for Acrobat / Illustrator / External Windows */}
              <div className="bg-gradient-to-r from-purple-950/90 to-slate-950 p-3 rounded-xl border border-purple-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Video className="w-4 h-4 text-pink-400" />
                    <span>Live Floating Camera Bubble</span>
                  </div>
                  <span className="text-[10px] bg-pink-950 text-pink-300 font-bold px-2 py-0.5 rounded border border-pink-700/60 font-mono">
                    Always-On-Top
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Moving to <strong>Adobe Acrobat</strong>, <strong>Illustrator</strong>, or <strong>Photoshop</strong>? Click below to pop out your webcam so your live camera bubble stays floating over external desktop apps while recording!
                </p>

                <button
                  onClick={handleTogglePiP}
                  className={cn(
                    "w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border shadow-md",
                    isPiPActive
                      ? "bg-pink-600 hover:bg-pink-500 text-white border-pink-400 shadow-pink-900/50"
                      : "bg-purple-700 hover:bg-purple-600 text-white border-purple-500"
                  )}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isPiPActive ? 'Close Floating Camera Window' : '📌 Float Camera Bubble (Picture-in-Picture)'}</span>
                </button>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">Quick Preset Positions</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['bottom-left', 'bottom-right', 'top-left', 'top-right', 'center'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => applyPresetPosition(pos)}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-[10px] font-bold border capitalize transition cursor-pointer text-center",
                        bubblePosition === pos 
                          ? "bg-pink-600 text-white border-pink-400 shadow-md" 
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                      )}
                    >
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                  <div
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-[10px] font-bold border capitalize transition text-center flex items-center justify-center gap-1",
                      bubblePosition === 'custom'
                        ? "bg-purple-600 text-white border-purple-400 shadow-md"
                        : "bg-slate-950 text-slate-500 border-slate-800"
                    )}
                  >
                    <span>Custom</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Position Sliders */}
              <div className="space-y-2.5 pt-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                    <span>Horizontal Position (X)</span>
                    <span className="text-purple-400 font-bold">{Math.round(bubbleX * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.82"
                    step="0.01"
                    value={bubbleX}
                    onChange={(e) => {
                      setBubbleX(parseFloat(e.target.value));
                      setBubblePosition('custom');
                    }}
                    className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                    <span>Vertical Position (Y)</span>
                    <span className="text-pink-400 font-bold">{Math.round(bubbleY * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.82"
                    step="0.01"
                    value={bubbleY}
                    onChange={(e) => {
                      setBubbleY(parseFloat(e.target.value));
                      setBubblePosition('custom');
                    }}
                    className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <p className="text-[10px] text-slate-400 italic text-center pt-0.5">
                  💡 Drag the bubble directly on the preview screen or use sliders above.
                </p>
              </div>

              {/* Shape & Size */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Shape</label>
                  <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                    <button
                      onClick={() => setBubbleShape('circle')}
                      className={cn(
                        "flex-1 py-1 text-[10px] font-bold rounded cursor-pointer",
                        bubbleShape === 'circle' ? "bg-purple-600 text-white" : "text-slate-400"
                      )}
                    >
                      Circle
                    </button>
                    <button
                      onClick={() => setBubbleShape('rounded')}
                      className={cn(
                        "flex-1 py-1 text-[10px] font-bold rounded cursor-pointer",
                        bubbleShape === 'rounded' ? "bg-purple-600 text-white" : "text-slate-400"
                      )}
                    >
                      Square
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Size</label>
                  <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                    {(['sm', 'md', 'lg'] as const).map(sz => (
                      <button
                        key={sz}
                        onClick={() => setBubbleSize(sz)}
                        className={cn(
                          "flex-1 py-1 text-[10px] font-bold uppercase rounded cursor-pointer",
                          bubbleSize === sz ? "bg-purple-600 text-white" : "text-slate-400"
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cursor Pointer & Captions Settings */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Captions className="w-3.5 h-3.5 text-yellow-400" />
                <span>3. Recording Language & Captions</span>
              </div>
              <button
                onClick={() => setShowCaptionEditor(!showCaptionEditor)}
                className="text-[11px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 cursor-pointer bg-pink-950/40 border border-pink-500/30 px-2 py-0.5 rounded-lg"
              >
                <span>{showCaptionEditor ? 'Close Editor' : '✏️ Caption Editor'}</span>
              </button>
            </div>

            {/* Video Recording Language Selector */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <span>🗣️ Video Recording Language:</span>
                </label>
                <span className="text-[10px] font-mono text-purple-400 font-bold">{captionLanguage}</span>
              </div>
              <select
                value={captionLanguage}
                onChange={(e) => setCaptionLanguage(e.target.value)}
                className="w-full bg-slate-900 border border-purple-500/50 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium focus:border-pink-500 outline-none cursor-pointer"
              >
                <option value="en-US">🇺🇸 English (United States)</option>
                <option value="en-GB">🇬🇧 English (United Kingdom)</option>
                <option value="ms-MY">🇲🇾 Bahasa Melayu (Malaysia)</option>
                <option value="ta-IN">🇮🇳 Tamil (India / Malaysia / SG)</option>
                <option value="zh-CN">🇨🇳 Mandarin Chinese (Simplified)</option>
                <option value="hi-IN">🇮🇳 Hindi (India)</option>
                <option value="es-ES">🇪🇸 Spanish (Spain / LATAM)</option>
                <option value="fr-FR">🇫🇷 French (France)</option>
                <option value="de-DE">🇩🇪 German (Germany)</option>
                <option value="ja-JP">🇯🇵 Japanese (Japan)</option>
              </select>
            </div>

            {/* Cursor Spotlight Effect */}
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-yellow-400" />
                <div>
                  <div className="text-xs font-bold text-white">Cursor Spotlight & Click Pulse</div>
                  <div className="text-[10px] text-slate-400">Highlights cursor so students can follow mouse</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={cursorEffect}
                onChange={(e) => setCursorEffect(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Auto Subtitles / Live Captions Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Captions className="w-4 h-4 text-yellow-400" />
                <div>
                  <div className="text-xs font-bold text-white">Live AI Auto-Captions</div>
                  <div className="text-[10px] text-slate-400">Displays real-time subtitles as you speak</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showLiveCaptions}
                onChange={(e) => setShowLiveCaptions(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Subtitle Appearance Settings */}
            {showLiveCaptions && (
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-bold">Subtitle Color</label>
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      {[
                        { color: '#fde047', label: 'Yellow' },
                        { color: '#ffffff', label: 'White' },
                        { color: '#22d3ee', label: 'Cyan' },
                        { color: '#4ade80', label: 'Lime' }
                      ].map((c) => (
                        <button
                          key={c.color}
                          onClick={() => setCaptionColor(c.color)}
                          className={cn(
                            "w-5 h-5 rounded-full border cursor-pointer flex items-center justify-center transition",
                            captionColor === c.color ? "border-white scale-110 shadow" : "border-transparent opacity-60"
                          )}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-bold">Position</label>
                    <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                      <button
                        onClick={() => setCaptionPosition('bottom')}
                        className={cn(
                          "flex-1 py-1 text-[10px] font-bold rounded cursor-pointer",
                          captionPosition === 'bottom' ? "bg-purple-600 text-white" : "text-slate-400"
                        )}
                      >
                        Bottom
                      </button>
                      <button
                        onClick={() => setCaptionPosition('top')}
                        className={cn(
                          "flex-1 py-1 text-[10px] font-bold rounded cursor-pointer",
                          captionPosition === 'top' ? "bg-purple-600 text-white" : "text-slate-400"
                        )}
                      >
                        Top
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Caption Editor Panel Drawer */}
          {showCaptionEditor && (
            <div className="bg-slate-900 border border-pink-500/40 p-4 rounded-2xl space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Captions className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Caption & Subtitle Editor</span>
                </div>
                <button
                  onClick={() => setShowCaptionEditor(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active / Current Live Caption Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-pink-300">Active Live Caption (Shows on Video):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentCaption}
                    onChange={(e) => setCurrentCaption(e.target.value)}
                    placeholder="Type or edit live caption here..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-yellow-300 font-bold text-xs p-2 rounded-xl focus:border-pink-500 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (currentCaption.trim()) {
                        setFullTranscript(prev => [...prev, currentCaption.trim()]);
                      }
                    }}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0"
                  >
                    Add Line
                  </button>
                </div>
              </div>

              {/* Recorded Transcript Lines List */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Transcript History ({fullTranscript.length} lines):</span>
                  {fullTranscript.length > 0 && (
                    <button
                      onClick={() => setFullTranscript([])}
                      className="text-[10px] text-red-400 hover:text-red-300"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1 scrollbar-thin">
                  {fullTranscript.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic p-2 text-center">
                      No transcript lines recorded yet. Start speaking during recording or add lines above.
                    </p>
                  ) : (
                    fullTranscript.map((line, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-lg text-xs border border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-500 w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          value={line}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFullTranscript(prev => {
                              const copy = [...prev];
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          className="flex-1 bg-transparent text-slate-200 text-xs px-2 focus:outline-none focus:text-white"
                        />
                        <button
                          onClick={() => setFullTranscript(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Subtitle File Exports */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleExportSubtitles('srt')}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .SRT</span>
                </button>
                <button
                  onClick={() => handleExportSubtitles('vtt')}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-pink-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .VTT</span>
                </button>
                <button
                  onClick={() => {
                    const text = fullTranscript.join('\n');
                    navigator.clipboard.writeText(text);
                    alert("Transcript copied to clipboard!");
                  }}
                  className="py-2 px-3 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Video Watermark Logo Controls */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>4. Dynamic Watermark Logo</span>
              </div>
              <input
                type="checkbox"
                checked={showLogoOverlay}
                onChange={(e) => setShowLogoOverlay(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            {showLogoOverlay && (
              <div className="space-y-3 pt-1">
                {/* Custom Logo Text */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-bold">Logo Brand Name / Watermark Text</label>
                  <input
                    type="text"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    placeholder="e.g. Endless Spark Academy"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:border-purple-500 outline-none font-bold"
                  />
                </div>

                {/* Optional Custom Logo Image Upload */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-bold">Custom Image Logo (Optional PNG/SVG)</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      <span>{logoUrl ? 'Change Logo Image' : 'Upload Logo PNG'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setLogoUrl(url);
                            const img = new Image();
                            img.src = url;
                            logoImgRef.current = img;
                          }
                        }}
                      />
                    </label>

                    {logoUrl && (
                      <button
                        onClick={() => {
                          setLogoUrl(null);
                          logoImgRef.current = null;
                        }}
                        className="p-2 bg-red-950/60 text-red-300 border border-red-800 rounded-xl text-xs font-bold hover:bg-red-900"
                        title="Remove custom logo image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Logo Card Backing Style */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-bold">Logo Backing Style</label>
                  <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                    {[
                      { id: 'none', label: 'Transparent' },
                      { id: 'white', label: 'White Card' },
                      { id: 'glass', label: 'Dark Glass' }
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setLogoBgStyle(st.id as any)}
                        className={cn(
                          "flex-1 py-1 text-[10px] font-bold rounded cursor-pointer transition",
                          logoBgStyle === st.id ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                        )}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Position */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-bold">Watermark Position on Video</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'top-right', label: 'Top Right' },
                      { id: 'top-left', label: 'Top Left' },
                      { id: 'bottom-right', label: 'Bottom Right' },
                      { id: 'bottom-left', label: 'Bottom Left' }
                    ].map(pos => (
                      <button
                        key={pos.id}
                        onClick={() => setLogoPosition(pos.id as any)}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-[10px] font-bold border transition cursor-pointer text-center",
                          logoPosition === pos.id
                            ? "bg-purple-600 text-white border-purple-400 shadow-md"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        )}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Size & Opacity */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-bold">Logo Size</label>
                    <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                      {(['sm', 'md', 'lg'] as const).map(sz => (
                        <button
                          key={sz}
                          onClick={() => setLogoSize(sz)}
                          className={cn(
                            "flex-1 py-1 text-[10px] font-bold uppercase rounded cursor-pointer",
                            logoSize === sz ? "bg-purple-600 text-white" : "text-slate-400"
                          )}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span>Opacity</span>
                      <span className="text-purple-400 font-bold">{Math.round(logoOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.05"
                      value={logoOpacity}
                      onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Teleprompter Drawer (When Toggled) */}
          {showTeleprompter && (
            <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl space-y-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Script Notes & Teleprompter Reader</span>
                </div>
                <button 
                  onClick={() => setShowTeleprompter(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Template Selector */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-bold">Quick Sample Script Notes:</div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {[
                    { label: '📦 Packaging Script', text: "Welcome to this Packaging Engineering session! Today we'll analyze flute caliper, structural crease folding, and cutting die allowances." },
                    { label: '📄 Preflight Script', text: "Hello everyone. In this lesson, we will perform Acrobat PDF/X-4 preflighting, check TAC 300% ink limits, and verify overprint settings." },
                    { label: '🎨 Illustrator Script', text: "Welcome! We are setting up packaging die-line layers, quiet zone barcodes, and automated trapping in Adobe Illustrator." },
                    { label: '🔬 Quality Audit', text: "In this Quality Check module, we demonstrate DeltaE spectrophotometer calibration and TVI dot gain measurement on press." }
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => setTeleprompterText(tpl.text)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-lg whitespace-nowrap cursor-pointer shrink-0"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={teleprompterText}
                onChange={(e) => setTeleprompterText(e.target.value)}
                placeholder="Type or paste your tutorial script notes here..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 text-yellow-300 text-xs p-3 rounded-xl focus:border-amber-500 outline-none leading-relaxed resize-none font-medium"
              />

              {/* Prompter Scrolling Box */}
              <div
                ref={prompterContainerRef}
                className="h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-y-auto scrollbar-none text-yellow-200 text-xs font-medium leading-relaxed shadow-inner"
              >
                {teleprompterText}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setTeleprompterScroll(!teleprompterScroll)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer",
                    teleprompterScroll ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  )}
                >
                  {teleprompterScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{teleprompterScroll ? 'Pause Scroll' : 'Auto-Scroll'}</span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Speed:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.2"
                    value={teleprompterSpeed}
                    onChange={(e) => setTeleprompterSpeed(parseFloat(e.target.value))}
                    className="w-16 accent-amber-500"
                  />
                  <span className="font-mono text-white font-bold">{teleprompterSpeed}x</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
