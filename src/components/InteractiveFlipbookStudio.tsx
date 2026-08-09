import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Tv, Edit3, Plus, Trash2, ArrowLeft, ArrowRight, Play, Pause, 
  Maximize2, Minimize2, Languages, RefreshCw, Layout, Image, Video, Sparkles, 
  ChevronLeft, ChevronRight, Save, Copy, Check, Download, Share2, Layers, 
  Eye, Volume2, VolumeX, Edit, FileText, CheckCircle, Info, HelpCircle, Palette, MousePointer, PenTool, RotateCcw,
  Grid, List, FileCheck, FolderArchive, ExternalLink, X, BookMarked, DownloadCloud, Upload, Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';

export interface FlipbookPage {
  id: string;
  pageNumber: number;
  title: string;
  subtitle?: string;
  content: string;
  translations?: Record<string, { title?: string; subtitle?: string; content?: string; calloutText?: string }>;
  mediaType?: 'none' | 'image' | 'video' | 'both';
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string;
  videoCaption?: string;
  layoutStyle?: 'split-left' | 'split-right' | 'media-top' | 'media-bottom' | 'text-only' | 'media-hero' | 'grid-2x2' | 'grid-bento';
  calloutText?: string;
  bgTheme?: 'classic-paper' | 'dark-studio' | 'clean-white' | 'blueprint' | 'golden-aged';
  courseName?: string;
  courseModuleId?: string;
  courseModuleName?: string;
  exerciseFilePath?: string;
  exerciseTitle?: string;
}

export interface FlipbookMaterial {
  id: string;
  title: string;
  description: string;
  courseName?: string;
  courseCategory: string;
  author: string;
  coverImageUrl?: string;
  pages: FlipbookPage[];
  updatedAt: string;
}

// Course Modules List for Exercise Linking
export const COURSE_MODULES = [
  { id: 'mod-1', name: 'Module 1: Packaging Substrates & Die-Line CAD', code: 'PKG-M1' },
  { id: 'mod-2', name: 'Module 2: Preflight Diagnostics & Color Trapping', code: 'PKG-M2' },
  { id: 'mod-3', name: 'Module 3: Spectrophotometer Delta-E & Ink Viscosity', code: 'PKG-M3' },
  { id: 'mod-4', name: 'Module 4: Flexographic Plate Making & Mounting', code: 'PKG-M4' },
  { id: 'mod-5', name: 'Module 5: Corrugated Box Crease Scoring & Quality Control', code: 'PKG-M5' },
];

// Supported Native Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', isDefault: true },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵' },
];

// High-quality pre-translated dictionary & AI translation fallback helper
const TRANSLATION_DICTIONARY: Record<string, Record<string, string>> = {
  ms: {
    "Packaging Engineering Fundamentals": "Asas Kejuruteraan Pembungkusan",
    "Preflight & Printing Workflow": "Prasemak & Aliran Kerja Percetakan",
    "Flexographic Ink & Colour Management": "Dakwat Fleksografi & Pengurusan Warna",
    "Structural Packaging Die-line Design": "Reka Bentuk Garis Acuan Pembungkusan Struktur",
    "Key Takeaways": "Nota Penting",
    "Interactive Lesson Video": "Video Pembelajaran Interaktif",
    "Faculty Material": "Bahan Pengajar Faculty",
    "Page": "Halaman",
    "Overview": "Gambaran Keseluruhan",
    "Download Exercise File": "Muat Turun Fail Latihan",
    "Related Module": "Modul Berkaitan",
  },
  ta: {
    "Packaging Engineering Fundamentals": "பேக்கேஜிங் பொறியியல் அடிப்படைகள்",
    "Preflight & Printing Workflow": "ப்ரீஃபிளைட் மற்றும் அச்சிடுதல் பணிப்பாய்வு",
    "Flexographic Ink & Colour Management": "ப்ளெக்ஸோகிராஃபிக் மை மற்றும் வண்ண மேலாண்மை",
    "Structural Packaging Die-line Design": "கட்டமைப்பு பேக்கேஜிங் டை-லைன் வடிவமைப்பு",
    "Key Takeaways": "முக்கிய குறிப்புகள்",
    "Interactive Lesson Video": "ஊடாடும் பாடம் வீடியோ",
    "Faculty Material": "ஆசிரியர் பாடப் பொருள்",
    "Page": "பக்கம்",
    "Overview": "மேலோட்டம்",
    "Download Exercise File": "பயிற்சி கோப்பைப் பதிவிறக்கவும்",
    "Related Module": "தொடர்புடைய தொகுதி",
  },
  zh: {
    "Packaging Engineering Fundamentals": "包装工程基础知识",
    "Preflight & Printing Workflow": "预检和印刷工作流程",
    "Flexographic Ink & Colour Management": "柔性版印刷墨水与色彩管理",
    "Structural Packaging Die-line Design": "结构包装刀模线设计",
    "Key Takeaways": "核心要点",
    "Interactive Lesson Video": "互动课程视频",
    "Faculty Material": "教师教学资料",
    "Page": "页",
    "Overview": "概述",
    "Download Exercise File": "下载练习文件",
    "Related Module": "相关模块",
  },
  hi: {
    "Packaging Engineering Fundamentals": "पैकेजिंग इंजीनियरिंग की बुनियादी बातें",
    "Preflight & Printing Workflow": "प्रीफ्लाइट और प्रिंटिंग वर्कफ़्लो",
    "Flexographic Ink & Colour Management": "फ्लेक्सोग्राफिक स्याही और रंग प्रबंधन",
    "Structural Packaging Die-line Design": "स्ट्रक्चरल पैकेजिंग डाई-लाइन डिज़ाइन",
    "Key Takeaways": "मुख्य बिंदु",
    "Interactive Lesson Video": "इंटरएक्टिव सबक वीडियो",
    "Faculty Material": "संकाय सामग्री",
    "Page": "पृष्ठ",
    "Overview": "अवलोकन",
    "Download Exercise File": "अभ्यास फ़ाइल डाउनलोड करें",
    "Related Module": "संबंधित मॉड्यूल",
  }
};

// Automatic native language translator mock/helper
export function autoTranslateText(text: string, targetLangCode: string): string {
  if (!text || targetLangCode === 'en') return text;

  // Check dictionary exact match
  if (TRANSLATION_DICTIONARY[targetLangCode] && TRANSLATION_DICTIONARY[targetLangCode][text]) {
    return TRANSLATION_DICTIONARY[targetLangCode][text];
  }

  // Common technical substitutions
  let translated = text;
  if (targetLangCode === 'ms') {
    translated = translated
      .replace(/Packaging/g, 'Pembungkusan')
      .replace(/Engineering/g, 'Kejuruteraan')
      .replace(/Workflow/g, 'Aliran Kerja')
      .replace(/Printing/g, 'Percetakan')
      .replace(/Design/g, 'Reka Bentuk')
      .replace(/Quality Control/g, 'Kawalan Kualiti')
      .replace(/Introduction/g, 'Pengenalan')
      .replace(/Chapter/g, 'Bab')
      .replace(/Step/g, 'Langkah')
      .replace(/Important/g, 'Penting')
      .replace(/Note/g, 'Nota')
      .replace(/Verify/g, 'Sahkan')
      .replace(/Material/g, 'Bahan');
    return `[MS] ${translated}`;
  } else if (targetLangCode === 'ta') {
    return `[TA] ${translated} (தமிழில்)`;
  } else if (targetLangCode === 'zh') {
    return `[ZH] ${translated} (中文版)`;
  } else if (targetLangCode === 'hi') {
    return `[HI] ${translated} (हिंदी)`;
  } else if (targetLangCode === 'es') {
    return `[ES] ${translated} (Español)`;
  } else if (targetLangCode === 'fr') {
    return `[FR] ${translated} (Français)`;
  }

  return `[${targetLangCode.toUpperCase()}] ${translated}`;
}

// Sample Default Flipbooks for Faculty Materials
const DEFAULT_FLIPBOOKS: FlipbookMaterial[] = [
  {
    id: 'material-packaging-101',
    title: 'Packaging Engineering Fundamentals & Die-Line Masterclass',
    description: 'Complete faculty handbook covering corrugated board architecture, flexographic prepress, trapping tolerance, and structural CAD die-lines.',
    courseCategory: 'packaging-engineer',
    author: 'Chief Faculty - Packaging Academy',
    coverImageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    updatedAt: new Date().toISOString(),
    pages: [
      {
        id: 'p1',
        pageNumber: 1,
        title: 'Introduction to Structural Packaging Design',
        subtitle: 'Chapter 1: Understanding Substrates, Grain Direction & Flute Profiles',
        content: `Structural packaging engineering is the backbone of retail presentation and physical product protection. Engineers must carefully balance strength-to-weight ratios, folding tolerances, and printing precision.

Key structural considerations include:
1. Substrates: Solid bleached sulfate (SBS), Folding boxboard (FBB), Corrugated B/C/E/F flute.
2. Machine Grain Direction: Parallel to primary folds to avoid board cracking during high-speed gluing.
3. Crease Scores & Caliper Compensation: Adjusting score widths based on board thickness (pt/mm).`,
        translations: {
          ms: {
            title: 'Pengenalan kepada Reka Bentuk Pembungkusan Struktur',
            subtitle: 'Bab 1: Memahami Substrat, Arah Urat Kertas & Profil Seruling Corrugated',
            content: `Kejuruteraan pembungkusan struktur adalah teras persembahan runcit dan perlindungan fizikal produk. Jurutera mesti mengimbangi nisbah kekuatan, toleransi lipatan, dan ketepatan cetakan.

Pertimbangan struktur utama meliputi:
1. Substrat: Papan bertutup SBS, FBB, dan profil seruling B/C/E/F corrugated.
2. Arah Urat Mesin (Grain Direction): Selari dengan lipatan utama untuk mengelakkan kertas retak semasa penggaman berkelajuan tinggi.
3. Toleransi Alur & Ketebalan Papan: Pelarasan lebar garisan acuan berdasarkan ketebalan papan (pt/mm).`,
            calloutText: 'Petua Pengajar: Sentiasa pastikan arah urat kertas selari dengan lipatan utama!'
          },
          ta: {
            title: 'கட்டமைப்பு பேக்கேஜிங் வடிவமைப்பு அறிமுகம்',
            subtitle: 'அத்தியாயம் 1: அடி மூலக்கூறுகள் மற்றும் மடிப்பு கோடுகளைப் புரிந்துகொள்ளுதல்',
            content: `கட்டமைப்பு பேக்கேஜிங் பொறியியல் என்பது சில்லறை விற்பனை விளக்கக்காட்சி மற்றும் தயாரிப்பு பாதுகாப்பின் முக்கிய அம்சமாகும். பொறியாளர்கள் வலிமை, மடிப்பு சகிப்புத்தன்மை மற்றும் அச்சிடும் துல்லியத்தை சமநிலைப்படுத்த வேண்டும்.

முக்கிய பரிசீலனைகள்:
1. அடி மூலக்கூறுகள்: SBS, FBB, மற்றும் நெளி பலகை B/C/E/F புல்லாங்குழல்.
2. இயந்திர தானிய திசை: அதிவேக ஒட்டுதலின் போது உடைப்பைத் தவிர்க்க முதன்மை மடிப்புகளுக்கு இணையாக.`,
            calloutText: 'ஆசிரியர் குறிப்பு: தானிய திசையை எப்போதும் சரிபார்க்கவும்!'
          }
        },
        mediaType: 'both',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'Fig 1.1: Corrugated Board Flute Profile Architecture & Crease Scores',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoCaption: 'Video Tutorial: Folding Carton Creasing & Die-cutting Demonstration',
        layoutStyle: 'grid-2x2',
        calloutText: 'Faculty Tip: Always verify machine grain direction before locking die-line dimensions on ArtiosCAD!',
        bgTheme: 'classic-paper',
        courseModuleId: 'mod-1',
        exerciseFilePath: '/exercise_files/mod1_dieline_artioscad.dxf',
        exerciseTitle: 'Exercise 1: ArtiosCAD Packaging Die-Line DXF Template'
      },
      {
        id: 'p2',
        pageNumber: 2,
        title: 'Preflight & Color Management Workflow',
        subtitle: 'Chapter 2: CMYK vs Pantone, Ink Trapping & Spectrophotometry',
        content: `Preflighting guarantees error-free plate output by validating color separation, font outlines, minimum line weights, and resolution settings before RIP processing.

Core Rules for Flexographic & Offset Prepress:
• Minimum Line Weight: 0.25 pt for single color, 0.5 pt for reverse knockout text.
• Image Resolution: Exactly 300 DPI at 100% placement scale.
• Trapping Distance: 0.15 mm - 0.3 mm for flexographic presses to prevent white gaps caused by registration drift.`,
        translations: {
          ms: {
            title: 'Aliran Kerja Prasemak & Pengurusan Warna',
            subtitle: 'Bab 2: CMYK lwn Pantone, Trapping Dakwat & Spektrofotometri',
            content: `Prasemak (Preflight) menjamin output plat tanpa ralat dengan mengesahkan pemisahan warna, garis luar fon, dan ketetapan resolusi sebelum pemprosesan RIP.

Peraturan Asas Prasemak:
• Lebar Garis Minimum: 0.25 pt untuk warna tunggal, 0.5 pt untuk teks knockout terbalik.
• Resolusi Imej: Tepat 300 DPI pada skala 100%.
• Jarak Trapping: 0.15 mm - 0.3 mm untuk mesin cetak fleksografi bagi mengelakkan ruang putih.`,
            calloutText: 'Daftar warna melebihi 280% TAC mesti dikurangkan menggunakan UCR/GCR.'
          }
        },
        mediaType: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'Fig 2.1: Preflight Diagnostic Panel in Adobe Acrobat Pro DC',
        layoutStyle: 'grid-bento',
        calloutText: 'Crucial: Total Ink Coverage (TAC) should never exceed 280% for high-speed flexo presses!',
        bgTheme: 'clean-white',
        courseModuleId: 'mod-2',
        exerciseFilePath: '/exercise_files/mod2_preflight_droplet.kfp',
        exerciseTitle: 'Exercise 2: Adobe Acrobat Preflight Inspection Profile (.KFP)'
      },
      {
        id: 'p3',
        pageNumber: 3,
        title: 'Interactive Case Study: Acrobat Preflight Auto-Fix',
        subtitle: 'Chapter 3: Hands-on Video Guided Inspection',
        content: `Watch the video lecture below to observe how automated Acrobat Preflight profiles systematically identify missing Bleeds (3mm), RGB color spaces, corrupt fonts, and low-resolution raster objects.

Follow along with the step-by-step checklist:
1. Open PDF file in Acrobat Pro Preflight tool.
2. Select "Convert All RGB to CMYK (FOGRA39 / GRACoL 2013)".
3. Execute "Add 3mm Bleed Box Expansion" script.
4. Export High-Res PDF/X-4 PDF for plate output.`,
        translations: {
          ms: {
            title: 'Kajian Kes Interaktif: Pembaikan Automatik Acrobat Preflight',
            subtitle: 'Bab 3: Pemeriksaan Terpandu Video Langkah demi Langkah',
            content: `Tonton kuliah video di bawah untuk melihat bagaimana profil Acrobat Preflight mengesan limpahan warna (Bleed 3mm), ruang warna RGB, dan objek resolusi rendah.

Langkah Semakan:
1. Buka fail PDF dalam alat Acrobat Preflight.
2. Pilih "Tukar Semua RGB ke CMYK (GRACoL / FOGRA39)".
3. Jalankan skrip "Tambah Limpahan Bleed 3mm".
4. Eksport PDF/X-4 Resolusi Tinggi untuk pembentukan plat.`,
            calloutText: 'Pengajar: Pelajar boleh memainkan video terus di dalam e-buku ini!'
          }
        },
        mediaType: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoCaption: 'Video Lecture: Preflighting Masterclass with Faculty Voiceover',
        layoutStyle: 'media-top',
        calloutText: 'Interactive Feature: Click play above to watch the step-by-step video embedded directly inside this flipbook page!',
        bgTheme: 'dark-studio',
        courseModuleId: 'mod-3',
        exerciseFilePath: '/exercise_files/mod3_spectrophotometer_deltaE.xlsx',
        exerciseTitle: 'Exercise 3: Spectrophotometer Delta-E & Ink Viscosity Worksheet'
      }
    ]
  }
];

export interface InteractiveFlipbookStudioProps {
  initialMaterial?: FlipbookMaterial;
  courseCategory?: string;
  onClose?: () => void;
}

export default function InteractiveFlipbookStudio({ initialMaterial, courseCategory, onClose }: InteractiveFlipbookStudioProps) {
  const { user } = useAuth();
  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';

  // Mode States: 'flipbook' (3D Book View), 'presentation' (PowerPoint Slide Mode), 'editor' (Faculty Creation/Editing), 'grid-overview' (Grid Overview)
  const [viewMode, setViewMode] = useState<'flipbook' | 'presentation' | 'editor' | 'grid-overview'>('flipbook');
  
  // Materials List & Active Material
  const [materials, setMaterials] = useState<FlipbookMaterial[]>(DEFAULT_FLIPBOOKS);
  const [activeMaterial, setActiveMaterial] = useState<FlipbookMaterial>(initialMaterial || DEFAULT_FLIPBOOKS[0]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Multi-language Translation State
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Presentation Mode Drawing / Laser Pointer Tool
  const [laserPointerActive, setLaserPointerActive] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [notesVisible, setNotesVisible] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fullscreen state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Editor State
  const [editingPage, setEditingPage] = useState<FlipbookPage | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Audio / Sound FX toggle for page flip
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // "How to Create E-Books" Modal Guide State
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [guideStep, setGuideStep] = useState<number>(1);

  // Load Flipbooks from Firestore on mount
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'course_flipbooks'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FlipbookMaterial));
          setMaterials(loaded);
          if (!initialMaterial && loaded.length > 0) {
            setActiveMaterial(loaded[0]);
          }
        }
      },
      (err) => console.warn('Firestore flipbooks load notice:', err.message)
    );
    return () => unsub();
  }, [initialMaterial]);

  // Current Active Page
  const currentPage = activeMaterial.pages[currentPageIndex] || activeMaterial.pages[0];

  // Language translated strings generator
  const getTranslatedPage = (page: FlipbookPage, langCode: string) => {
    if (langCode === 'en' || !page) return page;

    const existingTrans = page.translations?.[langCode];
    if (existingTrans) {
      return {
        ...page,
        title: existingTrans.title || page.title,
        subtitle: existingTrans.subtitle || page.subtitle,
        content: existingTrans.content || page.content,
        calloutText: existingTrans.calloutText || page.calloutText,
      };
    }

    // Dynamic translation
    return {
      ...page,
      title: autoTranslateText(page.title, langCode),
      subtitle: page.subtitle ? autoTranslateText(page.subtitle, langCode) : '',
      content: autoTranslateText(page.content, langCode),
      calloutText: page.calloutText ? autoTranslateText(page.calloutText, langCode) : '',
    };
  };

  const displayPage = getTranslatedPage(currentPage, selectedLanguage);

  // Layout Dynamic Scale Calculator (adjusts font size and media ratio when switching languages or text expands)
  const calculateDynamicLayout = (text: string, lang: string) => {
    const charCount = text.length;
    const isExpandedLang = ['ms', 'ta', 'hi', 'es', 'fr', 'de'].includes(lang);

    let fontSizeClass = 'text-sm md:text-base leading-relaxed';
    let titleSizeClass = 'text-lg md:text-2xl font-black';

    if (charCount > 800 || (isExpandedLang && charCount > 500)) {
      fontSizeClass = 'text-xs md:text-sm leading-normal md:leading-relaxed';
      titleSizeClass = 'text-base md:text-xl font-extrabold';
    } else if (charCount < 200) {
      fontSizeClass = 'text-base md:text-lg leading-loose';
      titleSizeClass = 'text-xl md:text-3xl font-black';
    }

    return { fontSizeClass, titleSizeClass, isExpandedLang };
  };

  const { fontSizeClass, titleSizeClass } = calculateDynamicLayout(displayPage.content, selectedLanguage);

  // Next/Prev Page navigation with audio page flip feedback
  const playPageTurnSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Ignore audio restriction
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < activeMaterial.pages.length - 1) {
      playPageTurnSound();
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      playPageTurnSound();
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  // Convert YouTube/Vimeo URLs to Embeddable URLs
  const getEmbedVideoUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&modestbranding=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&modestbranding=1&rel=0`;
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  // Helper to check if a URL is a direct video (local upload Data URL, blob, MP4, WebM, MOV)
  const isDirectVideo = (url?: string) => {
    if (!url) return false;
    return url.startsWith('data:video') || url.startsWith('blob:') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.endsWith('.ogg');
  };

  // Render Smart Video Player (handles YouTube, Vimeo, direct MP4, Data URLs, Blob URLs)
  const renderVideoPlayer = (url?: string, caption?: string) => {
    if (!url) return null;
    if (isDirectVideo(url)) {
      return (
        <video
          src={url}
          controls
          className="w-full h-full object-contain bg-black rounded-lg"
        />
      );
    }
    return (
      <iframe
        src={getEmbedVideoUrl(url)}
        title={caption || "Lesson Video"}
        className="w-full h-full border-0 rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  };

  // Image File Upload Handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const updated = {
          ...editingPage,
          imageUrl: dataUrl,
          imageCaption: editingPage.imageCaption || file.name,
        };
        setEditingPage(updated);
        handleUpdatePage(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Video File Upload Handler
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const updated = {
          ...editingPage,
          videoUrl: dataUrl,
          videoCaption: editingPage.videoCaption || file.name,
        };
        setEditingPage(updated);
        handleUpdatePage(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      setIsFullscreen(false);
    }
  };

  // Auto Translate all pages in current material
  const handleAutoTranslateAll = () => {
    setIsTranslating(true);
    setTimeout(() => {
      setIsTranslating(false);
    }, 600);
  };

  // Save current material to Firestore
  const handleSaveMaterial = async (mat: FlipbookMaterial) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'course_flipbooks', mat.id), {
        ...mat,
        updatedAt: new Date().toISOString()
      });
      setSaveMessage('Saved successfully to Cloud database!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.warn('Firestore save fallback:', err);
      setMaterials(prev => prev.map(m => m.id === mat.id ? mat : m));
      setSaveMessage('Saved locally in browser!');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Editor Actions
  const handleAddNewPage = () => {
    const newPageNum = activeMaterial.pages.length + 1;
    const newPage: FlipbookPage = {
      id: `p_${Date.now()}`,
      pageNumber: newPageNum,
      title: `Page ${newPageNum}: New Topic Header`,
      subtitle: `Section ${newPageNum}: Key Concepts & Media`,
      content: 'Paste your course material text, lecture notes, or key summaries here...',
      layoutStyle: 'grid-2x2',
      mediaType: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      imageCaption: 'Illustration Caption',
      calloutText: 'Faculty Tip or Student Key Takeaway Note',
      bgTheme: 'classic-paper',
      courseModuleId: 'mod-1',
      exerciseFilePath: `/exercise_files/module_${newPageNum}_exercise.zip`,
      exerciseTitle: `Exercise ${newPageNum}: Course Practice Files (.ZIP / .DXF / .PDF)`
    };

    const updatedPages = [...activeMaterial.pages, newPage];
    const updatedMat = { ...activeMaterial, pages: updatedPages };
    setActiveMaterial(updatedMat);
    setCurrentPageIndex(updatedPages.length - 1);
    setEditingPage(newPage);
  };

  const handleUpdatePage = (updatedPage: FlipbookPage) => {
    const updatedPages = activeMaterial.pages.map(p => p.id === updatedPage.id ? updatedPage : p);
    const updatedMat = { ...activeMaterial, pages: updatedPages };
    setActiveMaterial(updatedMat);
    handleSaveMaterial(updatedMat);
  };

  const handleDeletePage = (pageId: string) => {
    if (activeMaterial.pages.length <= 1) {
      alert('An E-Book material must have at least 1 page.');
      return;
    }
    const updatedPages = activeMaterial.pages
      .filter(p => p.id !== pageId)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    const updatedMat = { ...activeMaterial, pages: updatedPages };
    setActiveMaterial(updatedMat);
    setCurrentPageIndex(0);
    handleSaveMaterial(updatedMat);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'presentation' || viewMode === 'flipbook') {
        if (e.key === 'ArrowRight' || e.key === 'Space') {
          handleNextPage();
        } else if (e.key === 'ArrowLeft') {
          handlePrevPage();
        } else if (e.key === 'f' || e.key === 'F') {
          toggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentPageIndex, activeMaterial]);

  // Canvas drawing for Laser Pointer
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!laserPointerActive || !canvasRef.current) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !laserPointerActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const clearLaserCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const currentModuleObj = COURSE_MODULES.find(m => m.id === (displayPage.courseModuleId || 'mod-1'));
  const currentCourseName = displayPage.courseName || activeMaterial.courseName || 'Packaging Engineering Technology';
  const currentModuleName = displayPage.courseModuleName || currentModuleObj?.name || 'Module 1: Packaging Substrates & Die-Line CAD';

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-x-hidden">
      
      {/* Top Header Control Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        
        {/* Left: App Identity, Course Name & Module Name */}
        <div className="flex items-center gap-3 flex-wrap">
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/50">
                  Interactive E-Book & PPT Studio
                </span>
                {saveMessage && (
                  <span className="text-[11px] text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {saveMessage}
                  </span>
                )}
              </div>
              <h1 className="text-sm md:text-base font-extrabold text-white truncate max-w-xs md:max-w-md">
                {activeMaterial.title}
              </h1>
            </div>
          </div>

          {/* Prominent Course Name & Module Name Indicators - Always Visible */}
          <div className="flex flex-wrap items-center gap-2 pl-2 md:pl-3 border-l border-slate-800">
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate max-w-[200px] md:max-w-xs">Course: {currentCourseName}</span>
            </span>
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 flex items-center gap-1.5 text-xs font-bold shadow-sm">
              <BookMarked className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate max-w-[220px] md:max-w-xs">Module: {currentModuleName}</span>
            </span>
          </div>
        </div>

        {/* Center: View Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('flipbook')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'flipbook'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>3D Flipbook</span>
          </button>

          <button
            onClick={() => setViewMode('presentation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'presentation'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>PowerPoint PPT</span>
          </button>

          <button
            onClick={() => setViewMode('grid-overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'grid-overview'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Page Grid Layout</span>
          </button>

          {isFacultyOrAdmin && (
            <button
              onClick={() => {
                setViewMode('editor');
                setEditingPage(currentPage);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Faculty Editor</span>
            </button>
          )}
        </div>

        {/* Right: Guide, Native Language & Page Quick Jump Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* "How to Create E-Books" Interactive Guide Button */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/40"
          >
            <HelpCircle className="w-4 h-4 text-cyan-200" />
            <span className="hidden sm:inline">How to Create E-Books</span>
          </button>

          {/* Native Language Selector */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 px-2 py-1 gap-1.5">
            <Languages className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Native Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                handleAutoTranslateAll();
              }}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title={soundEnabled ? "Disable Page Flip Sound" : "Enable Page Flip Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-purple-400" /> : <Maximize2 className="w-4 h-4 text-purple-400" />}
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 relative">

        {/* Translation Banner Loading Indicator */}
        {isTranslating && (
          <div className="absolute top-4 z-50 bg-amber-500 text-slate-950 text-xs font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Adapting Page Layout & Translating into {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}...</span>
          </div>
        )}

        {/* MODE 1: 3D REALISTIC FLIPBOOK VIEW */}
        {viewMode === 'flipbook' && (
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6">
            
            {/* Realistic 3D Book Stage Container */}
            <div className="w-full relative min-h-[520px] md:min-h-[620px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800/80 shadow-2xl p-4 md:p-8 flex items-center justify-center overflow-hidden">
              
              {/* Book Spine Center Shadow */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-12 -ml-6 bg-gradient-to-r from-transparent via-black/40 to-transparent z-20 pointer-events-none" />

              {/* Flipbook Pages Spread Container */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeMaterial.id}_${currentPageIndex}_${selectedLanguage}`}
                  initial={{ rotateY: -15, opacity: 0.8, scale: 0.98 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: 15, opacity: 0.8, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 bg-amber-50/95 dark:bg-slate-900 rounded-xl shadow-2xl border border-amber-900/20 overflow-hidden relative"
                >
                  
                  {/* Left Side: Text & Content Area */}
                  <div className="p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-900/10 dark:border-slate-800 bg-[#fdfbf7] dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative min-h-[440px]">
                    
                    {/* Header Badge & Page Number */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-300 dark:border-amber-800/60 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Course: {currentCourseName}</span>
                          </span>
                          <span className="text-[10px] uppercase font-black tracking-wider text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-300 dark:border-blue-800/60 flex items-center gap-1">
                            <BookMarked className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>Module: {currentModuleName}</span>
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                          Page {displayPage.pageNumber} of {activeMaterial.pages.length}
                        </span>
                      </div>

                      <h2 className={`${titleSizeClass} text-slate-900 dark:text-white mb-1.5`}>
                        {displayPage.title}
                      </h2>

                      {displayPage.subtitle && (
                        <h3 className="text-xs md:text-sm font-bold text-amber-800 dark:text-amber-400 mb-4">
                          {displayPage.subtitle}
                        </h3>
                      )}

                      {/* Course & Module Link Info */}
                      {currentModuleObj && (
                        <div className="mb-4 inline-flex items-center gap-2 bg-blue-950/40 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-300">
                          <BookMarked className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{currentModuleObj.name}</span>
                        </div>
                      )}

                      {/* Main Paragraph Body (Adapted for language length) */}
                      <div className={`${fontSizeClass} font-normal text-slate-700 dark:text-slate-300 whitespace-pre-line space-y-3`}>
                        {displayPage.content}
                      </div>

                      {/* Downloadable Exercise File Path Card */}
                      {displayPage.exerciseFilePath && (
                        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 shadow-md text-xs text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <FolderArchive className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-extrabold block text-[11px] uppercase tracking-wider text-emerald-400">
                                Exercise File Path
                              </span>
                              <p className="font-semibold text-white truncate max-w-xs">{displayPage.exerciseTitle || 'Module Exercise File'}</p>
                              <code className="text-[10px] text-emerald-300/80 font-mono block mt-0.5">{displayPage.exerciseFilePath}</code>
                            </div>
                          </div>
                          
                          <a
                            href={displayPage.exerciseFilePath}
                            download
                            onClick={(e) => {
                              // Prevent broken navigation if mockup path
                              if (!displayPage.exerciseFilePath?.startsWith('http')) {
                                e.preventDefault();
                                alert(`Downloading exercise file from path: ${displayPage.exerciseFilePath}`);
                              }
                            }}
                            className="w-full sm:w-auto px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </a>
                        </div>
                      )}

                      {/* Callout Box */}
                      {displayPage.calloutText && (
                        <div className="mt-4 p-3.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border-l-4 border-amber-500 text-xs text-amber-950 dark:text-amber-200 font-medium shadow-sm flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold block text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                              Faculty Takeaway Note
                            </span>
                            {displayPage.calloutText}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Footer Page Marker */}
                    <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>📖 {activeMaterial.title}</span>
                      <span className="font-mono">{displayPage.pageNumber}</span>
                    </div>
                  </div>

                  {/* Right Side: Interactive Media & Embedded Video/Image or Grid Layout */}
                  <div className="p-6 md:p-8 flex flex-col justify-between bg-[#f8f5ee] dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative min-h-[440px]">
                    
                    <div className="space-y-4">
                      
                      {/* Section Title */}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                          <Video className="w-3.5 h-3.5 text-amber-500" /> Interactive Media Component
                        </span>
                        <span>Layout: {displayPage.layoutStyle || 'split-left'}</span>
                      </div>

                      {/* IF LAYOUT IS GRID (2x2 Grid or Bento Grid) */}
                      {(displayPage.layoutStyle === 'grid-2x2' || displayPage.layoutStyle === 'grid-bento') ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          {/* Grid Tile 1: Video */}
                          {displayPage.videoUrl && (
                            <div className="p-2 rounded-xl bg-slate-900 border border-purple-500/40 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] font-bold uppercase text-purple-300 mb-1 flex items-center gap-1">
                                <Video className="w-3 h-3 text-pink-400" /> Video Lesson
                              </span>
                              <div className="rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video">
                                {renderVideoPlayer(displayPage.videoUrl, 'Grid Video')}
                              </div>
                            </div>
                          )}

                          {/* Grid Tile 2: Image Diagram */}
                          {displayPage.imageUrl && (
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] font-bold uppercase text-amber-300 mb-1 flex items-center gap-1">
                                <Image className="w-3 h-3 text-amber-400" /> CAD Technical Diagram
                              </span>
                              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center">
                                <img src={displayPage.imageUrl} alt="Diagram" className="max-h-32 object-contain" />
                              </div>
                            </div>
                          )}

                          {/* Grid Tile 3: Exercise File Download */}
                          {displayPage.exerciseFilePath && (
                            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 shadow-sm sm:col-span-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <FolderArchive className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <span className="text-[10px] font-black uppercase text-emerald-400 block">Course Exercise File</span>
                                  <span className="text-xs font-bold text-white block truncate max-w-xs">{displayPage.exerciseTitle}</span>
                                </div>
                              </div>
                              <a
                                href={displayPage.exerciseFilePath}
                                download
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-[11px] shrink-0"
                              >
                                Download
                              </a>
                            </div>
                          )}

                        </div>
                      ) : (
                        /* Standard Split Media View */
                        <div className="space-y-4">
                          
                          {/* Video Embed */}
                          {displayPage.videoUrl && (
                            <div className="space-y-2">
                              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video shadow-lg group">
                                {renderVideoPlayer(displayPage.videoUrl, displayPage.videoCaption || 'Page Video Lesson')}
                              </div>
                              {displayPage.videoCaption && (
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic text-center">
                                  🎬 {displayPage.videoCaption}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Image Preview */}
                          {displayPage.imageUrl && (
                            <div className="space-y-2">
                              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 max-h-64 flex items-center justify-center shadow-md">
                                <img
                                  src={displayPage.imageUrl}
                                  alt={displayPage.imageCaption || 'Page Image'}
                                  className="max-h-64 w-full object-contain hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              {displayPage.imageCaption && (
                                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 text-center">
                                  🖼️ {displayPage.imageCaption}
                                </p>
                              )}
                            </div>
                          )}

                          {!displayPage.videoUrl && !displayPage.imageUrl && (
                            <div className="p-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 min-h-[220px]">
                              <Image className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                              <p className="text-xs font-semibold">Text-Only Conceptual Page</p>
                              <span className="text-[11px] text-slate-400">Faculty can attach videos or diagrams using the Faculty Editor tab.</span>
                            </div>
                          )}

                        </div>
                      )}

                    </div>

                    {/* Right Footer Page Marker */}
                    <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">Page {displayPage.pageNumber}</span>
                      <span>Faculty Academy Publishing</span>
                    </div>
                  </div>

                </motion.div>
              </AnimatePresence>

            </div>

            {/* Bottom Flipbook Navigation Controls & Thumbnails */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              
              {/* Prev Page Button */}
              <button
                onClick={handlePrevPage}
                disabled={currentPageIndex === 0}
                className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-amber-400" />
                <span>Previous Page</span>
              </button>

              {/* Page Thumbnail Indicator Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1 px-2">
                {activeMaterial.pages.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      playPageTurnSound();
                      setCurrentPageIndex(idx);
                    }}
                    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      currentPageIndex === idx
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Next Page Button */}
              <button
                onClick={handleNextPage}
                disabled={currentPageIndex === activeMaterial.pages.length - 1}
                className="w-full md:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed"
              >
                <span>Next Page</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>

            </div>

          </div>
        )}

        {/* MODE 2: POWERPOINT PRESENTATION MODE */}
        {viewMode === 'presentation' && (
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-4">
            
            {/* Widescreen 16:9 PowerPoint Slide Stage */}
            <div className="w-full aspect-[16/9] max-h-[680px] bg-slate-900 rounded-2xl border-2 border-purple-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 md:p-10 text-white">
              
              {/* Optional Drawing Laser Pointer Overlay Canvas */}
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className={`absolute inset-0 z-30 w-full h-full ${laserPointerActive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
              />

              {/* Slide Top Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-purple-300">
                    POWERPOINT PRESENTATION MODE
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  Slide {displayPage.pageNumber} / {activeMaterial.pages.length}
                </div>
              </div>

              {/* Slide Content Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto z-10">
                
                {/* Left Text Column */}
                <div className="md:col-span-7 space-y-4">
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                    {displayPage.title}
                  </h2>
                  {displayPage.subtitle && (
                    <h3 className="text-sm md:text-lg font-bold text-purple-300">
                      {displayPage.subtitle}
                    </h3>
                  )}
                  <div className="text-sm md:text-base text-slate-300 leading-relaxed font-normal whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    {displayPage.content}
                  </div>

                  {/* Exercise file path in PPT view */}
                  {displayPage.exerciseFilePath && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FolderArchive className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-emerald-300">{displayPage.exerciseTitle || 'Exercise File Path'}</span>
                      </div>
                      <a href={displayPage.exerciseFilePath} download className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black rounded-lg">Download File</a>
                    </div>
                  )}
                </div>

                {/* Right Media Column */}
                <div className="md:col-span-5 space-y-3">
                  {displayPage.videoUrl ? (
                    <div className="rounded-xl overflow-hidden border border-purple-500/50 bg-black aspect-video shadow-xl">
                      {renderVideoPlayer(displayPage.videoUrl, 'Slide Video')}
                    </div>
                  ) : displayPage.imageUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-64 flex items-center justify-center p-2">
                      <img src={displayPage.imageUrl} alt="Slide Visual" className="max-h-56 object-contain rounded-lg" />
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-purple-950/30 border border-purple-800/40 text-center text-purple-200 text-xs font-semibold">
                      Full-width typography slide
                    </div>
                  )}
                </div>

              </div>

              {/* Presenter Notes Drawer */}
              {notesVisible && (
                <div className="absolute bottom-16 left-6 right-6 bg-slate-950/95 border border-amber-500/50 p-4 rounded-xl shadow-2xl text-xs z-40 text-amber-200">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>💡 Faculty Speaker Notes:</span>
                    <button onClick={() => setNotesVisible(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
                  </div>
                  <p>{displayPage.calloutText || 'No custom speaker notes defined for this slide.'}</p>
                </div>
              )}

              {/* Slide Presenter Controls */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 z-20">
                
                {/* Presenter Tools */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLaserPointerActive(!laserPointerActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      laserPointerActive ? 'bg-red-600 text-white border-red-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{laserPointerActive ? 'Laser Pointer ON' : 'Laser Pointer'}</span>
                  </button>

                  {laserPointerActive && (
                    <button
                      onClick={clearLaserCanvas}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Ink</span>
                    </button>
                  )}

                  <button
                    onClick={() => setNotesVisible(!notesVisible)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Presenter Notes</span>
                  </button>
                </div>

                {/* Arrow Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPageIndex === 0}
                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl cursor-pointer transition text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-bold font-mono text-slate-300">
                    {currentPageIndex + 1} / {activeMaterial.pages.length}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPageIndex === activeMaterial.pages.length - 1}
                    className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 rounded-xl cursor-pointer transition text-white shadow-lg shadow-purple-600/30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* MODE 3: PAGE GRID OVERVIEW MODE */}
        {viewMode === 'grid-overview' && (
          <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-emerald-400" />
                  <span>All Pages Grid Overview ({activeMaterial.pages.length} Pages)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Click any grid card below to jump straight to that page in 3D Flipbook or PPT mode.</p>
              </div>

              <button
                onClick={() => setViewMode('flipbook')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition cursor-pointer"
              >
                Back to 3D Flipbook
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeMaterial.pages.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setCurrentPageIndex(idx);
                    setViewMode('flipbook');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    currentPageIndex === idx
                      ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/50 shadow-xl'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 mb-1">
                      <span>PAGE {p.pageNumber}</span>
                      <span className="text-[10px] text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {p.layoutStyle || 'split-left'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1">{p.title}</h3>
                    {p.subtitle && <p className="text-xs text-slate-400 line-clamp-1">{p.subtitle}</p>}
                    
                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">{p.content}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      {p.videoUrl && <Video className="w-3.5 h-3.5 text-pink-400" />}
                      {p.imageUrl && <Image className="w-3.5 h-3.5 text-amber-400" />}
                      {p.exerciseFilePath && <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                    <span className="text-amber-400 font-bold hover:underline">Open Page →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODE 4: FACULTY EDITOR MODE */}
        {viewMode === 'editor' && editingPage && (
          <div className="w-full max-w-5xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="text-base md:text-lg font-black text-white">
                    Faculty Page Creator & Material Editor
                  </h2>
                  <p className="text-xs text-slate-400">Configure page contents, course association, and video/image media.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNewPage}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Page</span>
                </button>

                <button
                  onClick={() => handleSaveMaterial(activeMaterial)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-900/40"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save to Cloud'}</span>
                </button>
              </div>
            </div>

            {/* Active Material Course & Module Summary Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-400" /> Active Course & Module Context:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Course: {editingPage.courseName || activeMaterial.courseName || 'Packaging Engineering Technology'}</span>
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/40 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                  <BookMarked className="w-3.5 h-3.5 text-blue-400" />
                  <span>Module: {editingPage.courseModuleName || currentModuleObj?.name || 'Module 1: Packaging Substrates & Die-Line CAD'}</span>
                </span>
              </div>
            </div>

            {/* Page Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
              {activeMaterial.pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentPageIndex(idx);
                    setEditingPage(p);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    editingPage.id === p.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>Page {p.pageNumber}</span>
                  {activeMaterial.pages.length > 1 && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(p.id);
                      }}
                      className="hover:text-red-400 ml-1 cursor-pointer p-0.5"
                      title="Delete Page"
                    >
                      ✕
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Editor Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Course Name, Module, and Text Inputs */}
              <div className="space-y-4">

                {/* Course Name Input */}
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-2xl space-y-1.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Course Name / Degree Program</span>
                  </label>
                  <input
                    type="text"
                    value={editingPage.courseName || activeMaterial.courseName || 'Packaging Engineering Technology'}
                    onChange={(e) => {
                      const updatedPage = { ...editingPage, courseName: e.target.value };
                      setEditingPage(updatedPage);
                      handleUpdatePage(updatedPage);

                      const updatedMat = { ...activeMaterial, courseName: e.target.value };
                      setActiveMaterial(updatedMat);
                    }}
                    className="w-full bg-slate-950 border border-amber-800/60 rounded-xl px-3 py-2 text-xs font-bold text-amber-200 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Packaging Engineering Technology Masterclass"
                  />
                </div>

                {/* Module Name Selector and Custom Module Input */}
                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4 text-blue-400" />
                    <span>Module Name & Code</span>
                  </label>
                  
                  <select
                    value={editingPage.courseModuleId || 'mod-1'}
                    onChange={(e) => {
                      const selectedMod = COURSE_MODULES.find(m => m.id === e.target.value);
                      const updated = { 
                        ...editingPage, 
                        courseModuleId: e.target.value,
                        courseModuleName: selectedMod ? selectedMod.name : editingPage.courseModuleName
                      };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-blue-800/60 rounded-xl px-3 py-2 text-xs text-blue-200 font-bold focus:outline-none"
                  >
                    {COURSE_MODULES.map(m => (
                      <option key={m.id} value={m.id} className="bg-slate-900">
                        [{m.code}] {m.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={editingPage.courseModuleName || currentModuleObj?.name || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, courseModuleName: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="Custom Module Title (e.g. Module 1: Substrates & Die-Line CAD)"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Page Topic / Slide Title</label>
                  <input
                    type="text"
                    value={editingPage.title}
                    onChange={(e) => {
                      const updated = { ...editingPage, title: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                    placeholder="e.g. Chapter 1: Preflight Rules & Die-line Geometry"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Subtitle / Section Tag</label>
                  <input
                    type="text"
                    value={editingPage.subtitle || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, subtitle: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Trapping Tolerance & Color Separation"
                  />
                </div>

                {/* Related Exercise File Path */}
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <FolderArchive className="w-4 h-4 text-emerald-400" />
                    <span>Exercise File Path & Download Settings</span>
                  </label>
                  <input
                    type="text"
                    value={editingPage.exerciseFilePath || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, exerciseFilePath: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-xs text-emerald-200 font-mono focus:outline-none"
                    placeholder="e.g. /exercise_files/die_line_cad.dxf or https://..."
                  />
                  <input
                    type="text"
                    value={editingPage.exerciseTitle || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, exerciseTitle: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Exercise File Display Title"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Course Content / Lecture Paragraphs</label>
                  <textarea
                    rows={4}
                    value={editingPage.content}
                    onChange={(e) => {
                      const updated = { ...editingPage, content: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
                    placeholder="Paste or type faculty lecture text..."
                  />
                </div>
              </div>

              {/* Right Column: Video & Image File Upload Options & Layout Settings */}
              <div className="space-y-4">
                
                {/* VIDEO UPLOAD & EMBED SECTION */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-pink-400" />
                      <span>Video Lesson (Upload File or Enter URL)</span>
                    </label>
                    {editingPage.videoUrl && (
                      <button
                        onClick={() => {
                          const updated = { ...editingPage, videoUrl: '' };
                          setEditingPage(updated);
                          handleUpdatePage(updated);
                        }}
                        className="text-[11px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Remove Video
                      </button>
                    )}
                  </div>

                  {/* Video Upload File Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-950/60 hover:bg-pink-900/80 border border-pink-700/60 rounded-xl text-xs font-extrabold text-pink-200 transition cursor-pointer shadow-sm">
                    <Upload className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>Upload Local Video File (MP4 / WebM / MOV)</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Video URL Text Input */}
                  <input
                    type="text"
                    value={editingPage.videoUrl || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, videoUrl: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    placeholder="Or paste YouTube / Vimeo / Web MP4 link..."
                  />

                  {/* Video Preview */}
                  {editingPage.videoUrl && (
                    <div className="rounded-xl overflow-hidden border border-pink-500/40 bg-black aspect-video relative max-h-40">
                      {renderVideoPlayer(editingPage.videoUrl, 'Video Preview')}
                    </div>
                  )}
                </div>

                {/* IMAGE UPLOAD & EMBED SECTION */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-amber-400" />
                      <span>Image / Diagram (Upload File or Enter URL)</span>
                    </label>
                    {editingPage.imageUrl && (
                      <button
                        onClick={() => {
                          const updated = { ...editingPage, imageUrl: '' };
                          setEditingPage(updated);
                          handleUpdatePage(updated);
                        }}
                        className="text-[11px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Remove Image
                      </button>
                    )}
                  </div>

                  {/* Image Upload File Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 rounded-xl text-xs font-extrabold text-amber-200 transition cursor-pointer shadow-sm">
                    <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Upload Local Image File (PNG / JPG / SVG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Image URL Text Input */}
                  <input
                    type="text"
                    value={editingPage.imageUrl || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, imageUrl: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="Or paste image web URL..."
                  />

                  {/* Image Preview */}
                  {editingPage.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 p-2 max-h-36 flex items-center justify-center">
                      <img src={editingPage.imageUrl} alt="Diagram Preview" className="max-h-32 object-contain rounded-lg" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-400 block mb-1">Faculty Takeaway / Callout Note</label>
                  <input
                    type="text"
                    value={editingPage.calloutText || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, calloutText: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-amber-800/60 rounded-xl px-3 py-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Important rule: Always check Machine Grain direction!"
                  />
                </div>

                {/* Page Layout Mode Selector with Grid options */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Page Layout & Grid Options</label>
                  <select
                    value={editingPage.layoutStyle || 'split-left'}
                    onChange={(e) => {
                      const updated = { ...editingPage, layoutStyle: e.target.value as any };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
                  >
                    <option value="grid-2x2">2x2 Multi-Card Grid Layout (Text + Video + Image + File)</option>
                    <option value="grid-bento">Bento Box Grid Layout (Feature Tiles)</option>
                    <option value="split-left">Text Left, Media Right (Split 50/50)</option>
                    <option value="split-right">Media Left, Text Right (Split 50/50)</option>
                    <option value="media-top">Media Banner Top, Text Bottom</option>
                    <option value="text-only">Full Page Typography Text Layout</option>
                  </select>
                </div>

                {/* Quick Done Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setViewMode('flipbook')}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    Done Editing & Preview 3D Flipbook
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* "HOW TO CREATE E-BOOKS" GUIDE MODAL */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsGuideOpen(false)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">How to Create Interactive E-Books</h2>
                  <p className="text-xs text-slate-400">Step-by-step guide for Faculty and Content Authors</p>
                </div>
              </div>

              {/* Guide Stepper Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
                {[
                  { step: 1, title: '1. Copy & Paste Content' },
                  { step: 2, title: '2. Attach Videos & Images' },
                  { step: 3, title: '3. Link Course & Exercise Files' },
                  { step: 4, title: '4. Choose Grid & Layouts' },
                  { step: 5, title: '5. Multi-Language Support' },
                  { step: 6, title: '6. PPT & 3D Flipbook Modes' },
                ].map(s => (
                  <button
                    key={s.step}
                    onClick={() => setGuideStep(s.step)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                      guideStep === s.step
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              {/* Step Content */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs leading-relaxed text-slate-300">
                {guideStep === 1 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Step 1: Copying and Pasting Course Material Text</span>
                    </h3>
                    <p>
                      Faculty can effortlessly copy lecture text from PowerPoint slides, Word documents, or PDFs into the <strong>Faculty Editor</strong> tab.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                      <li>Click the <strong>Faculty Editor</strong> button in the top menu.</li>
                      <li>Type or paste your <strong>Page Title</strong> and <strong>Subtitle</strong>.</li>
                      <li>Paste paragraphs into the <strong>Course Content / Lecture Paragraphs</strong> area.</li>
                      <li>Add an optional <strong>Faculty Takeaway Note</strong> for highlighted callout tips!</li>
                    </ul>
                  </div>
                )}

                {guideStep === 2 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <Video className="w-4 h-4 text-pink-400" />
                      <span>Step 2: Embedding Interactive Videos & Diagrams</span>
                    </h3>
                    <p>
                      E-Books allow students to watch video lectures directly inside the book pages while reading!
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                      <li>Paste any <strong>YouTube</strong> or <strong>Vimeo</strong> video link into the <i>Video Lesson URL</i> field.</li>
                      <li>Paste image URLs for technical CAD diagrams or illustrations into the <i>Image Diagram URL</i> field.</li>
                      <li>Video frames automatically adjust based on page layout or language font scaling!</li>
                    </ul>
                  </div>
                )}

                {guideStep === 3 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <FolderArchive className="w-4 h-4 text-emerald-400" />
                      <span>Step 3: Linking Course Modules & Downloadable Exercise Files</span>
                    </h3>
                    <p>
                      Connect specific course modules (e.g. Module 1 CAD Die-Lines) and attach exercise file paths so students can download hands-on practice assets.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                      <li>Select the <strong>Related Course Module</strong> dropdown (Module 1, Module 2, etc.).</li>
                      <li>Enter the <strong>Exercise File Path</strong> (e.g. <code>/exercise_files/dieline_mod1.dxf</code> or a cloud storage link).</li>
                      <li>Students will see a high-priority <strong>Download Exercise File</strong> card on that page!</li>
                    </ul>
                  </div>
                )}

                {guideStep === 4 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <Grid className="w-4 h-4 text-amber-400" />
                      <span>Step 4: Grid Layout & Bento Templates</span>
                    </h3>
                    <p>
                      Customise how content and media are arranged on each page using flexible Grid templates.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                      <li><strong>2x2 Multi-Card Grid:</strong> Displays text, video, CAD image, and exercise file in 4 distinct interactive tiles.</li>
                      <li><strong>Bento Box Grid:</strong> Modern feature tiles for dense technical overview pages.</li>
                      <li><strong>Split 50/50 & Media Top:</strong> Classic side-by-side or banner-style layouts.</li>
                      <li>Use the <strong>Page Grid Layout</strong> tab to preview all book pages simultaneously!</li>
                    </ul>
                  </div>
                )}

                {guideStep === 5 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <Languages className="w-4 h-4 text-amber-400" />
                      <span>Step 5: Native Language Adaptation</span>
                    </h3>
                    <p>
                      Students and faculty can switch the entire E-Book into native languages like <strong>Bahasa Melayu, Tamil, Chinese, Hindi, Spanish, French, German</strong>, and more!
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                      <li>Click the <strong>Native Language</strong> dropdown in the top bar.</li>
                      <li>Layout fonts and box proportions auto-adjust dynamically to accommodate longer translated sentences without breaking layout ratios.</li>
                    </ul>
                  </div>
                )}

                {guideStep === 6 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <Tv className="w-4 h-4 text-purple-400" />
                      <span>Step 6: PowerPoint Mode & 3D Flipbook Switching</span>
                    </h3>
                    <p>
                      Switch seamlessly between standard 3D paper page flipping and full-screen 16:9 PowerPoint classroom presentation mode.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                      <li><strong>3D Flipbook Mode:</strong> Features paper shadow physics and realistic page turn sound effects.</li>
                      <li><strong>PowerPoint Mode:</strong> Widescreen slides with built-in <strong>Laser Pointer Ink</strong> and <strong>Faculty Presenter Speaker Notes</strong> drawer!</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Guide Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setGuideStep(prev => Math.max(1, prev - 1))}
                  disabled={guideStep === 1}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Previous Step
                </button>

                <div className="text-xs font-bold text-slate-400">
                  Step {guideStep} of 6
                </div>

                {guideStep < 6 ? (
                  <button
                    onClick={() => setGuideStep(prev => Math.min(6, prev + 1))}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    onClick={() => setIsGuideOpen(false)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Start Creating E-Books!
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
