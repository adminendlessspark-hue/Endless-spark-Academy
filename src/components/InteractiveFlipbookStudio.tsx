import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, Tv, Edit3, Plus, Trash2, ArrowLeft, ArrowRight, ArrowLeftRight, Play, Pause, 
  Maximize2, Minimize2, Languages, RefreshCw, Layout, Image, Video, Sparkles, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Save, Copy, Check, Download, Share2, Layers, 
  Eye, Volume2, VolumeX, Edit, FileText, CheckCircle, CheckCircle2, Info, HelpCircle, Palette, MousePointer, PenTool, RotateCcw, Type,
  Bold, Italic, Underline, Highlighter, Eraser, Wand2, GripVertical, Move,
  Grid, List, FileCheck, FolderArchive, ExternalLink, Link, X, BookMarked, DownloadCloud, Upload, Film, GraduationCap,
  MessageSquare, Captions, Subtitles, FileAudio, Settings, Sliders, Moon, Sun, Clock, Globe, Server, HardDrive, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import { formatCourseName } from '../utils';
import { CourseModule } from '../types';
import { saveMediaToIDB, getMediaFromIDB, fileToDataUrl, getFallbackImageForTopic, FALLBACK_SAMPLE_VIDEOS } from '../utils/mediaStore';
import { generateGeminiContent } from '../services/gemini';

export interface FlipbookPage {
  id: string;
  pageNumber: number;
  title: string;
  subtitle?: string;
  content: string;
  isCustomEdited?: boolean;
  contentFontFamily?: string;
  contentFontSize?: string;
  contentTextColor?: string;
  contentFontStyle?: string;
  contentTextAlign?: 'left' | 'center' | 'right' | 'justify';
  pageBackgroundColor?: string;
  translations?: Record<string, { 
    title?: string; 
    subtitle?: string; 
    content?: string; 
    calloutText?: string; 
    imageCaption?: string; 
    secondaryImageCaption?: string; 
    videoCaption?: string; 
    videoTranscription?: string 
  }>;
  mediaType?: 'none' | 'image' | 'video' | 'both';
  imageUrl?: string;
  imageCaption?: string;
  secondaryImageUrl?: string;
  secondaryImageCaption?: string;
  videoUrl?: string;
  videoCaption?: string;
  videoTranscription?: string;
  layoutStyle?: 'split-left' | 'split-right' | 'media-top' | 'media-bottom' | 'text-only' | 'media-hero' | 'grid-2x2' | 'grid-bento' | 'grid-right-2-images' | 'grid-2-images';
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
export const COURSE_MODULES: { id: string; name: string; code: string }[] = [];

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

// Normalize external domain image URLs (Google Drive, Dropbox, Imgur, GitHub, HTTP to HTTPS, etc.)
export const normalizeExternalImageUrl = (url?: string): string => {
  if (!url) return '';
  let clean = url.trim();

  // If already base64, blob, or idb: key, keep intact
  if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.startsWith('idb:')) {
    return clean;
  }

  // Upgrade http to https to avoid mixed-content blocks
  if (clean.startsWith('http://')) {
    clean = clean.replace('http://', 'https://');
  }

  // Google Drive Image URLs -> Use high-res thumbnail endpoint (w1600) which works reliably in all iframes and without authentication cookies
  if (clean.includes('drive.google.com/file/d/')) {
    const id = clean.split('/d/')[1]?.split('/')[0]?.split('?')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }
  if (clean.includes('drive.google.com/open?id=')) {
    const id = clean.split('id=')[1]?.split('&')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }
  if (clean.includes('drive.google.com/uc?')) {
    const match = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600`;
  }
  if (clean.includes('lh3.googleusercontent.com/d/')) {
    const id = clean.split('/d/')[1]?.split('?')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }

  // Dropbox Image URLs
  if (clean.includes('dropbox.com/s/')) {
    return clean.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=[01]/g, '');
  }
  if (clean.includes('dropbox.com/scl/fi/')) {
    return clean.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=[01]/g, '').replace('raw=0', 'raw=1');
  }

  // Imgur page URL -> direct image URL
  if (/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/.test(clean)) {
    const match = clean.match(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/);
    if (match && match[1]) return `https://i.imgur.com/${match[1]}.jpg`;
  }

  // GitHub raw file image
  if (clean.includes('github.com/') && clean.includes('/blob/')) {
    clean = clean.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/');
  }

  return clean;
};

// Safe Image component with topic fallback, IndexedDB resolution, and external domain normalization
export const SafeImage = ({ 
  src, 
  alt, 
  title,
  subtitle,
  caption,
  className,
  onEnlarge,
  enableZoom = true,
}: { 
  src?: string; 
  alt?: string; 
  title?: string;
  subtitle?: string;
  caption?: string;
  className?: string; 
  onEnlarge?: (src: string, alt: string) => void;
  enableZoom?: boolean;
}) => {
  const [hasError, setHasError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  useEffect(() => {
    setHasError(false);
    setIsFallback(false);
    if (!src || src.trim() === '') {
      const topicFallback = getFallbackImageForTopic(alt, title, subtitle, caption);
      setResolvedSrc(topicFallback);
      setIsFallback(true);
      setIsLoading(false);
      return;
    }

    const normalized = normalizeExternalImageUrl(src);

    if (src.startsWith('idb:')) {
      const key = src.replace('idb:', '');
      setIsLoading(true);
      getMediaFromIDB(key)
        .then(resolved => {
          if (resolved) {
            setResolvedSrc(resolved);
            setHasError(false);
            setIsFallback(false);
          } else {
            setResolvedSrc(getFallbackImageForTopic(alt, title, subtitle, caption));
            setIsFallback(true);
            setHasError(false);
          }
        })
        .catch(() => {
          setResolvedSrc(getFallbackImageForTopic(alt, title, subtitle, caption));
          setIsFallback(true);
          setHasError(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setResolvedSrc(normalized);
      setIsLoading(false);
    }
  }, [src, alt, title, subtitle, caption]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-6 bg-slate-900/80 rounded-xl border border-amber-500/20 ${className || 'min-h-[220px]'}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400"></div>
          <span>Loading visual diagram...</span>
        </div>
      </div>
    );
  }

  // Handle secondary fallback for Google Drive thumbnails or alternative direct URLs
  const handleImageError = () => {
    if (!isFallback) {
      if (resolvedSrc.includes('googleusercontent.com') || (src && src.includes('drive.google.com'))) {
        const idMatch = resolvedSrc.match(/\/d\/([a-zA-Z0-9_-]+)/) || (src ? src.match(/\/d\/([a-zA-Z0-9_-]+)/) : null) || (src ? src.match(/[?&]id=([a-zA-Z0-9_-]+)/) : null);
        if (idMatch && idMatch[1] && !resolvedSrc.includes('thumbnail?id=')) {
          setResolvedSrc(`https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1600`);
          return;
        }
      }
      setIsFallback(true);
      setResolvedSrc(getFallbackImageForTopic(alt, title, subtitle, caption));
      setHasError(false);
    } else {
      // If even the fallback failed, load the guaranteed color wheel diagram
      setResolvedSrc(getFallbackImageForTopic('Fundamental of colour'));
      setHasError(false);
    }
  };

  if (hasError || !resolvedSrc) {
    const rawExternalUrl = src && !src.startsWith('idb:') ? normalizeExternalImageUrl(src) : '';
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-slate-900/90 border border-amber-500/30 rounded-xl text-center space-y-2.5 ${className || 'min-h-[220px]'}`}>
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
          <Image className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <span className="text-xs font-bold text-amber-200 block">{alt || title || 'Diagram / Image Attachment'}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">High-Resolution Technical Diagram</span>
        </div>
        {rawExternalUrl && !rawExternalUrl.startsWith('data:') && (
          <div className="flex items-center gap-2 pt-1">
            <a
              href={rawExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-[11px] text-amber-300 font-bold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Original Image</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setIsFallback(false);
                setResolvedSrc(normalizeExternalImageUrl(src));
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
            >
              Reload
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative group/img w-full h-full flex items-center justify-center">
      <img
        src={resolvedSrc}
        alt={alt || title || 'Page Attachment'}
        className={className}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={handleImageError}
        onClick={() => {
          if (onEnlarge && resolvedSrc) {
            onEnlarge(resolvedSrc, alt || title || 'Diagram');
          }
        }}
      />
      {enableZoom && onEnlarge && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEnlarge(resolvedSrc, alt || title || 'Diagram');
          }}
          className="absolute bottom-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-900 border border-amber-500/40 text-amber-300 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg cursor-pointer"
          title="Click to Enlarge Diagram in High-Resolution"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// Helper to detect default placeholder callout notes that should be off by default
export const isDefaultCalloutText = (text?: string): boolean => {
  if (!text || !text.trim()) return true;
  const str = text.trim().toLowerCase();
  return (
    str === 'faculty key takeaway' ||
    str === 'faculty tip or student key takeaway note' ||
    str === 'faculty tip or student key takeaway' ||
    str.includes('faculty tip') ||
    str.includes('key takeaway') ||
    str.includes('மாணவர் குறிப்பு') ||
    str.includes('ஆசிரியர் குறிப்பு')
  );
};

// High-quality pre-translated dictionary & AI translation fallback helper
const TRANSLATION_DICTIONARY: Record<string, Record<string, string>> = {
  ms: {
    "What is color?": "Apakah itu warna?",
    "Fundamentals of Color": "Asas-Asas Teori Warna",
    "Visual Electromagnetic Perception": "Persepsi Elektromagnetik Visual",
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
    "Diploma in Production Art Engineer": "Diploma Kejuruteraan Seni Pengeluaran",
    "Module 1: Color Management": "Modul 1: Pengurusan Warna",
    "FACULTY TAKEAWAY NOTE": "NOTA PENTING PENGAJAR",
    "Faculty Tip: Always verify machine grain direction before locking die-line dimensions on ArtiosCAD!": "Petua Pengajar: Sentiasa sahkan arah urat mesin sebelum mengunci dimensi garis acuan pada ArtiosCAD!",
    "The Triad of Color Perception": "Triad Persepsi Warna",
    "Light Source": "Sumber Cahaya",
    "Object (Substrate)": "Objek (Substrat)",
    "Observer": "Pemerhati",
    "Primary Colors": "Warna Primer",
    "Secondary Colors": "Warna Sekunder",
    "Tertiary Colors": "Warna Tertier",
  },
  ta: {
    "What is color?": "வண்ணம் என்றால் என்ன?",
    "Fundamentals of Color": "வண்ணக் கோட்பாட்டின் அடிப்படைகள்",
    "Visual Electromagnetic Perception": "காட்சி மின்காந்த புலனுணர்வு",
    "Colour is how our eyes and brain see different light waves.": "நமது கண்களும் மூளையும் வெவ்வேறு ஒளி அலைகளை எவ்வாறு பார்க்கின்றன என்பதே வண்ணம் ஆகும்.",
    "Objects absorb some light and reflect other light.": "பொருட்கள் சில ஒளியை உறிஞ்சி மற்ற ஒளியை பிரதிபலிக்கின்றன.",
    "Your eyes catch the reflected light and your brain turns it into a colour like red, blue, or green.": "உங்கள் கண்கள் பிரதிபலித்த ஒளியைப் பிடிக்கும், மேலும் உங்கள் மூளை அதை சிவப்பு, நீலம் அல்லது பச்சை போன்ற வண்ணமாக மாற்றுகிறது.",
    "Color is the visual sensation created when electromagnetic radiation in the 380–750 nm wavelength range is captured by the human eye and interpreted by the brain.": "வண்ணம் என்பது 380–750 nm அலைநீள வரம்பில் உள்ள மின்காந்த கதிர்வீச்சை மனித கண் பிடித்து மூளையால் விளக்கும் போது உருவாக்கப்படும் காட்சி உணர்வாகும்.",
    "How We See": "நாம் எவ்வாறு பார்க்கிறோம்",
    "Colour Light waves:": "வண்ண ஒளி அலைகள்:",
    "Light waves:": "ஒளி அலைகள்:",
    "Light travels in waves.": "ஒளி அலைகளாகப் பயணிக்கிறது.",
    "Each colour has a different size or length.": "ஒவ்வொரு வண்ணத்திற்கும் வெவ்வேறு அளவு அல்லது நீளம் உள்ளது.",
    "Long waves look red.": "நீண்ட அலைகள் சிவப்பாக இருக்கும்.",
    "Short waves look blue or violet.": "குறுகிய அலைகள் நீலமாக அல்லது ஊதாவாக இருக்கும்.",
    "The eye:": "கண்:",
    "Special cells in your eyes called cones catch these light waves.": "உங்கள் கண்களில் உள்ள கூம்புகள் எனப்படும் சிறப்பு செல்கள் இந்த ஒளி அலைகளைப் பிடிக்கின்றன.",
    "The brain:": "மூளை:",
    "Your brain takes signals from your eyes and names the colour.": "உங்கள் மூளை உங்கள் கண்களிலிருந்து சிக்னல்களை எடுத்து வண்ணத்திற்கு பெயரிடுகிறது.",
    "Main Parts of Colour": "வண்ணத்தின் முக்கிய பகுதிகள்",
    "Hue:": "நிறம் (ஹியூ):",
    "Hue: The name of the family of the colour, like red or yellow.": "நிறம்: சிவப்பு அல்லது மஞ்சள் போன்ற வண்ணத்தின் குடும்பத்தின் பெயர்.",
    "Lightness:": "வெளிச்சம் (லைட்னஸ்):",
    "Lightness: How light or dark a colour is.": "வெளிச்சம்: ஒரு வண்ணம் எவ்வளவு வெளிச்சமாக அல்லது இருளாக இருக்கிறது என்பது.",
    "Brightness:": "பிரகாசம் (பிரைட்னஸ்):",
    "Brightness: How strong or pale a colour appears.": "பிரகாசம்: ஒரு வண்ணம் எவ்வளவு வலுவாக அல்லது வெளிறியதாகக் காணப்படுகிறது.",
    "It is a sensory experience.": "இது ஒரு உணர்ச்சி அனுபவம்.",
    "It is a sensory experience": "இது ஒரு உணர்ச்சி அனுபவம்",
    "It results from the visible spectrum,": "இது கண்ணுறு நிறமாலையிலிருந்து பெறப்படுகிறது,",
    "It results from the visible spectrum": "இது கண்ணுறு நிறமாலையிலிருந்து பெறப்படுகிறது",
    "driven by a triad,": "ஒரு முக்கோணத்தால் இயக்கப்படுகிறது,",
    "driven by a triad": "ஒரு முக்கோணத்தால் இயக்கப்படுகிறது",
    "interacting with objects,": "பொருட்களுடன் தொடர்பு கொள்கிறது,",
    "interacting with objects": "பொருட்களுடன் தொடர்பு கொள்கிறது",
    "and perceived by our eyes.": "மற்றும் நமது கண்களால் உணரப்படுகிறது.",
    "and perceived by our eyes": "மற்றும் நமது கண்களால் உணரப்படுகிறது",
    "perceived by our eyes.": "நமது கண்களால் உணரப்படுகிறது.",
    "perceived by our eyes": "நமது கண்களால் உணரப்படுகிறது",
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
    "Diploma in Production Art Engineer": "தயாரிப்பு கலை பொறியியல் பட்டயப்படிப்பு",
    "Module 1: Color Management": "தொகுதி 1: வண்ண மேலாண்மை",
    "FACULTY TAKEAWAY NOTE": "ஆசிரியர் குறிப்பு",
    "Faculty Tip: Always verify machine grain direction before locking die-line dimensions on ArtiosCAD!": "ஆசிரியர் குறிப்பு: ஆர்டியோஸ்கேடில் டை-லைன் பரிமாணங்களைப் பூட்டுவதற்கு முன்பு எப்போதும் இயந்திர தானிய திசையைச் சரிபார்க்கவும்!",
    "The Triad of Color Perception": "வண்ணப் புலனுணர்வின் முக்கோணம்",
    "Light Source": "ஒளி மூலம்",
    "Object (Substrate)": "பொருள் (அடி மூலக்கூறு)",
    "Observer": "பார்வையாளர்",
    "Primary Colors": "முதன்மை வண்ணங்கள்",
    "Secondary Colors": "இரண்டாம் நிலை வண்ணங்கள்",
    "Tertiary Colors": "மூன்றாம் நிலை வண்ணங்கள்",
    "Core Structure": "முக்கிய கட்டமைப்பு"
  },
  zh: {
    "What is color?": "什么是颜色？",
    "Fundamentals of Color": "色彩理论基础",
    "Visual Electromagnetic Perception": "视觉电磁感知",
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
    "Diploma in Production Art Engineer": "生产艺术工程文凭",
    "Module 1: Color Management": "模块 1：色彩管理",
    "FACULTY TAKEAWAY NOTE": "教师重点提示",
    "Faculty Tip: Always verify machine grain direction before locking die-line dimensions on ArtiosCAD!": "教师提示：在 ArtiosCAD 上锁定刀模线尺寸之前，请务必验证机器纹理方向！",
    "The Triad of Color Perception": "色彩感知三要素",
    "Light Source": "光源",
    "Object (Substrate)": "物体（承印物）",
    "Observer": "观察者",
    "Primary Colors": "原色 / 一次色",
    "Secondary Colors": "二次色",
    "Tertiary Colors": "三次色",
  },
  hi: {
    "What is color?": "रंग क्या है?",
    "Fundamentals of Color": "रंग सिद्धांत के मूल सिद्धांत",
    "Visual Electromagnetic Perception": "दृश्य विद्युतचुंबकीय धारणा",
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
    "Diploma in Production Art Engineer": "प्रोडक्शन आर्ट इंजीनियर में डिप्लोमा",
    "Module 1: Color Management": "मॉड्यूल 1: रंग प्रबंधन",
    "FACULTY TAKEAWAY NOTE": "संकाय टिप्पणी",
    "Faculty Tip: Always verify machine grain direction before locking die-line dimensions on ArtiosCAD!": "संकाय युक्ति: ArtiosCAD पर डाई-लाइन आयामों को लॉक करने से पहले हमेशा मशीन ग्रेन दिशा की पुष्टि करें!",
    "The Triad of Color Perception": "रंग धारणा का त्रय",
    "Light Source": "प्रकाश स्रोत",
    "Object (Substrate)": "वस्तु (सब्सट्रेट)",
    "Observer": "पर्यवेक्षक",
    "Primary Colors": "प्राथमिक रंग",
    "Secondary Colors": "द्वितीयक रंग",
    "Tertiary Colors": "तृतीयक रंग",
  },
  es: {
    "What is color?": "¿Qué es el color?",
    "Fundamentals of Color": "Fundamentos del Color",
    "Visual Electromagnetic Perception": "Percepción Electromagnética Visual",
    "Diploma in Production Art Engineer": "Diplomado en Ingeniería de Arte de Producción",
    "Module 1: Color Management": "Módulo 1: Gestión del Color",
    "FACULTY TAKEAWAY NOTE": "NOTA DEL PROFESOR",
    "The Triad of Color Perception": "La Tríada de la Percepción del Color",
    "Primary Colors": "Colores Primarios",
    "Secondary Colors": "Colores Secundarios",
    "Tertiary Colors": "Colores Terciarios",
  },
  fr: {
    "What is color?": "Qu'est-ce que la couleur ?",
    "Fundamentals of Color": "Fondamentaux de la Couleur",
    "Visual Electromagnetic Perception": "Perception Électromagnétique Visuelle",
    "Diploma in Production Art Engineer": "Diplôme en Ingénierie de l'Art de Production",
    "Module 1: Color Management": "Module 1 : Gestion des Couleurs",
    "FACULTY TAKEAWAY NOTE": "NOTE DE L'ENSEIGNANT",
    "The Triad of Color Perception": "La Triade de la Perception des Couleurs",
    "Primary Colors": "Couleurs Primaires",
    "Secondary Colors": "Couleurs Secondaires",
    "Tertiary Colors": "Couleurs Tertiaires",
  },
  de: {
    "What is color?": "Was ist Farbe?",
    "Fundamentals of Color": "Grundlagen der Farblehre",
    "Visual Electromagnetic Perception": "Visuelle elektromagnetische Wahrnehmung",
    "Diploma in Production Art Engineer": "Diplom im Bereich Produktionskunst-Ingenieurwesen",
    "Module 1: Color Management": "Modul 1: Farbmanagement",
    "FACULTY TAKEAWAY NOTE": "DOZENTEN-HINWEIS",
    "The Triad of Color Perception": "Die Triade der Farbwahrnehmung",
    "Primary Colors": "Primärfarben",
    "Secondary Colors": "Sekundärfarben",
    "Tertiary Colors": "Tertiärfarben",
  },
  ja: {
    "What is color?": "色彩とは何か？",
    "Fundamentals of Color": "色彩理論の基礎",
    "Visual Electromagnetic Perception": "視覚的電磁波知覚",
    "Diploma in Production Art Engineer": "プロダクションアートエンジニア・ディプロマ",
    "Module 1: Color Management": "モジュール1：カラーマネジメント",
    "FACULTY TAKEAWAY NOTE": "講師からの重要ポイント",
    "The Triad of Color Perception": "色彩知覚の3要素",
    "Primary Colors": "原色（一次色）",
    "Secondary Colors": "二次色",
    "Tertiary Colors": "三次色",
  }
};

// Global runtime translation cache for dynamic Gemini AI native translation
const RUNTIME_TRANSLATION_CACHE: Record<string, Record<string, string>> = {};

// Automatic native language translator helper
export function autoTranslateText(text: string, targetLangCode: string): string {
  if (!text || targetLangCode === 'en') return text;

  const cleanText = text.trim();

  // 1. Check runtime translation cache by exact string
  if (RUNTIME_TRANSLATION_CACHE[targetLangCode]?.[cleanText]) {
    return RUNTIME_TRANSLATION_CACHE[targetLangCode][cleanText];
  }

  // 2. Check dictionary exact match
  if (TRANSLATION_DICTIONARY[targetLangCode]?.[cleanText]) {
    return TRANSLATION_DICTIONARY[targetLangCode][cleanText];
  }

  // 3. Preserve HTML tags during translation
  const tagRegex = /(<[^>]+>)/g;
  const parts = text.split(tagRegex);

  const translatedParts = parts.map(part => {
    // If it's an HTML tag, leave it completely untouched
    if (part.startsWith('<') && part.endsWith('>')) {
      return part;
    }

    const trimmedPart = part.trim();
    if (!trimmedPart) return part;

    // Check runtime translation cache for this part
    if (RUNTIME_TRANSLATION_CACHE[targetLangCode]?.[trimmedPart]) {
      return part.replace(trimmedPart, RUNTIME_TRANSLATION_CACHE[targetLangCode][trimmedPart]);
    }

    // Check dictionary exact match for this part
    if (TRANSLATION_DICTIONARY[targetLangCode]?.[trimmedPart]) {
      return part.replace(trimmedPart, TRANSLATION_DICTIONARY[targetLangCode][trimmedPart]);
    }

    // Replace complete multi-word phrases only (length >= 10) to avoid mixed language corruption
    let translated = part;
    const dict = TRANSLATION_DICTIONARY[targetLangCode];
    if (dict) {
      Object.keys(dict).forEach(phrase => {
        if (phrase.length >= 10 && translated.includes(phrase)) {
          translated = translated.split(phrase).join(dict[phrase]);
        }
      });
    }

    return translated;
  });

  return translatedParts.join('');
}

import { DEFAULT_FLIPBOOKS } from '../data/defaultFlipbooks';

export interface InteractiveFlipbookStudioProps {
  initialMaterial?: FlipbookMaterial;
  courseCategory?: string;
  onClose?: () => void;
}

export default function InteractiveFlipbookStudio({ initialMaterial, courseCategory, onClose }: InteractiveFlipbookStudioProps) {
  const { user, isAdmin, isQC, isElevated } = useAuth();
  const { financialSettings } = useSettings();
  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';

  // Firestore course_modules live synchronization & Configured Courses
  const [dbModules, setDbModules] = useState<CourseModule[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All Course Titles');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('All Modules');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'course_modules'), (snapshot) => {
      const list: CourseModule[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CourseModule);
      });
      setDbModules(list);
    }, (err) => {
      console.warn('Firestore course_modules subscription notice in FlipbookStudio:', err.message);
    });
    return () => unsubscribe();
  }, []);

  const configuredCourses = React.useMemo(() => [
    ...(financialSettings?.coursesConfig || []),
    { courseId: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses' }
  ], [financialSettings?.coursesConfig]);

  // Student assigned course titles derived from user profile
  const isStudent = user?.role === 'student' || (!isAdmin && !isQC && !isElevated && user?.role !== 'faculty' && user?.role !== 'admin');

  const studentAssignedCourses = React.useMemo(() => {
    if (!user) return [];
    const assigned = user.assignedCourses || (user.assignedCourse ? [user.assignedCourse] : (user.requestedCourses || (user.requestedCourse ? [user.requestedCourse] : [])));
    return assigned || [];
  }, [user]);

  const studentAssignedCourseTitles = React.useMemo(() => {
    if (!studentAssignedCourses || studentAssignedCourses.length === 0) return [];
    return studentAssignedCourses.map(cId => {
      const matchedConfig = configuredCourses.find(c => c.courseId === cId);
      if (matchedConfig) return matchedConfig.title;
      return formatCourseName(cId);
    });
  }, [studentAssignedCourses, configuredCourses]);

  // All Course Titles list (same as Free ChatGPT Video & Speech Translator)
  const allCourseTitles = React.useMemo(() => {
    if (isStudent && studentAssignedCourseTitles.length > 0) {
      if (studentAssignedCourseTitles.length > 1) {
        return ['All Assigned Courses', ...studentAssignedCourseTitles];
      }
      return studentAssignedCourseTitles;
    }

    const set = new Set<string>();
    set.add('All Course Titles');
    configuredCourses.forEach(c => set.add(c.title));
    dbModules.forEach(mod => {
      if (mod.category) {
        const matchedConfig = configuredCourses.find(c => c.courseId === mod.category);
        set.add(matchedConfig ? matchedConfig.title : formatCourseName(mod.category));
      }
    });
    DEFAULT_FLIPBOOKS.forEach(m => {
      if (m.courseName) set.add(m.courseName);
      if (m.courseCategory) {
        const matchedConfig = configuredCourses.find(c => c.courseId === m.courseCategory);
        set.add(matchedConfig ? matchedConfig.title : formatCourseName(m.courseCategory));
      }
    });
    return Array.from(set);
  }, [isStudent, studentAssignedCourseTitles, configuredCourses, dbModules]);

  const studentAssignedTitle = React.useMemo(() => {
    if (studentAssignedCourseTitles.length === 0) return null;
    return studentAssignedCourseTitles[0];
  }, [studentAssignedCourseTitles]);

  // Auto-set selectedCourseFilter to student assigned course on load
  useEffect(() => {
    if (isStudent && studentAssignedCourseTitles.length > 0) {
      if (!studentAssignedCourseTitles.includes(selectedCourseFilter) && selectedCourseFilter !== 'All Assigned Courses') {
        setSelectedCourseFilter(studentAssignedCourseTitles[0]);
      }
    } else if (user && studentAssignedTitle && selectedCourseFilter === 'All Course Titles') {
      setSelectedCourseFilter(studentAssignedTitle);
    }
  }, [isStudent, studentAssignedCourseTitles, user, studentAssignedTitle, selectedCourseFilter]);

  // Mode States: 'flipbook' (3D Book View), 'presentation' (PowerPoint Slide Mode), 'editor' (Faculty Creation/Editing), 'grid-overview' (Grid Overview), 'settings' (Settings Studio Tab)
  const [viewMode, setViewMode] = useState<'flipbook' | 'presentation' | 'editor' | 'grid-overview' | 'settings'>('flipbook');
  
  // Materials List & Active Material
  const [materials, setMaterials] = useState<FlipbookMaterial[]>(DEFAULT_FLIPBOOKS);
  const [activeMaterial, setActiveMaterial] = useState<FlipbookMaterial>(initialMaterial || DEFAULT_FLIPBOOKS[0]);

  // Resolve student assigned native language
  const studentAssignedNativeLang = React.useMemo(() => {
    if (!user || user.role !== 'student') return null;
    const raw = (user as any).nativeLanguage || (user as any).preferredLanguage || '';
    if (!raw || !raw.trim()) return null;
    const lower = raw.trim().toLowerCase();
    
    // Direct code matching
    const byCode = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === lower);
    if (byCode) return byCode;

    // Name matching
    if (lower.includes('tamil') || lower.includes('தமிழ்')) return SUPPORTED_LANGUAGES.find(l => l.code === 'ta');
    if (lower.includes('malay') || lower.includes('melayu') || lower.includes('bahasa')) return SUPPORTED_LANGUAGES.find(l => l.code === 'ms');
    if (lower.includes('hindi') || lower.includes('हिंदी')) return SUPPORTED_LANGUAGES.find(l => l.code === 'hi');
    if (lower.includes('chinese') || lower.includes('mandarin') || lower.includes('中文')) return SUPPORTED_LANGUAGES.find(l => l.code === 'zh');
    if (lower.includes('spanish') || lower.includes('español')) return SUPPORTED_LANGUAGES.find(l => l.code === 'es');
    if (lower.includes('french') || lower.includes('français')) return SUPPORTED_LANGUAGES.find(l => l.code === 'fr');
    if (lower.includes('german') || lower.includes('deutsch')) return SUPPORTED_LANGUAGES.find(l => l.code === 'de');
    if (lower.includes('japanese') || lower.includes('日本語')) return SUPPORTED_LANGUAGES.find(l => l.code === 'ja');
    if (lower.includes('english')) return SUPPORTED_LANGUAGES.find(l => l.code === 'en');

    return { code: lower.slice(0, 2), name: raw, flag: '🌐' };
  }, [user]);

  // For students, ONLY show assigned native language in the language selector
  const availableLanguages = React.useMemo(() => {
    if (isStudent && studentAssignedNativeLang) {
      return [studentAssignedNativeLang];
    }
    return SUPPORTED_LANGUAGES;
  }, [isStudent, studentAssignedNativeLang]);

  // Available Modules list based on selected course filter
  // For students: ONLY include completed modules and the single active uncompleted module
  const availableModuleOptions = React.useMemo(() => {
    const set = new Set<string>();
    set.add('All Modules');

    // Gather modules from dbModules matching course filter
    const sortedDbModules = [...dbModules].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null && !isNaN(Number(a.order)) ? Number(a.order) : 999;
      const orderB = b.order !== undefined && b.order !== null && !isNaN(Number(b.order)) ? Number(b.order) : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title || '').localeCompare(b.title || '');
    });

    const completedModuleIds = new Set(user?.completedModules || []);

    // Filter modules for student: only completed + active module
    let eligibleDbModules = sortedDbModules;
    if (isStudent) {
      const studentVisibleMods: typeof sortedDbModules = [];
      let foundActive = false;
      for (const mod of sortedDbModules) {
        if (completedModuleIds.has(mod.id)) {
          studentVisibleMods.push(mod);
        } else if (!foundActive) {
          studentVisibleMods.push(mod);
          foundActive = true;
        }
      }
      eligibleDbModules = studentVisibleMods.length > 0 ? studentVisibleMods : (sortedDbModules.length > 0 ? [sortedDbModules[0]] : []);
    }

    eligibleDbModules.forEach(mod => {
      const matchedConfig = configuredCourses.find(c => c.courseId === mod.category);
      const courseTitle = matchedConfig ? matchedConfig.title : formatCourseName(mod.category);

      const matchesCourse = selectedCourseFilter === 'All Course Titles' ||
        selectedCourseFilter === 'All Assigned Courses' ||
        courseTitle === selectedCourseFilter ||
        courseTitle.toLowerCase().includes(selectedCourseFilter.toLowerCase()) ||
        selectedCourseFilter.toLowerCase().includes(courseTitle.toLowerCase());

      if (matchesCourse) {
        const moduleLabel = mod.order !== undefined && mod.order !== null ? `Module ${mod.order}` : ((mod as any).moduleNumber || 'Module');
        set.add(`${moduleLabel}: ${mod.title}`);
      }
    });

    materials.forEach(m => {
      m.pages.forEach(p => {
        if (p.courseModuleName) set.add(p.courseModuleName);
      });
    });

    return Array.from(set);
  }, [dbModules, configuredCourses, selectedCourseFilter, materials, isStudent, user?.completedModules]);

  // Filtered materials matching Course and Module filters
  const filteredMaterials = React.useMemo(() => {
    return materials.filter(m => {
      let courseMatch = true;
      if (selectedCourseFilter !== 'All Course Titles' && selectedCourseFilter !== 'All Assigned Courses') {
        const matCourse = m.courseName || formatCourseName(m.courseCategory);
        courseMatch = matCourse === selectedCourseFilter ||
          matCourse.toLowerCase().includes(selectedCourseFilter.toLowerCase()) ||
          selectedCourseFilter.toLowerCase().includes(matCourse.toLowerCase()) ||
          m.pages.some(p => p.courseName && (
            p.courseName === selectedCourseFilter ||
            p.courseName.toLowerCase().includes(selectedCourseFilter.toLowerCase()) ||
            selectedCourseFilter.toLowerCase().includes(p.courseName.toLowerCase())
          ));
      }

      let moduleMatch = true;
      if (selectedModuleFilter !== 'All Modules') {
        moduleMatch = m.pages.some(p => p.courseModuleName && (
          p.courseModuleName === selectedModuleFilter ||
          p.courseModuleName.toLowerCase().includes(selectedModuleFilter.toLowerCase()) ||
          selectedModuleFilter.toLowerCase().includes(p.courseModuleName.toLowerCase())
        ));
      }

      return courseMatch && moduleMatch;
    });
  }, [materials, selectedCourseFilter, selectedModuleFilter]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Multi-language Translation State
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    if (user?.role === 'student') {
      const raw = (user as any).nativeLanguage || (user as any).preferredLanguage || '';
      if (raw) {
        const lower = raw.trim().toLowerCase();
        if (lower.includes('tamil') || lower.includes('தமிழ்')) return 'ta';
        if (lower.includes('malay') || lower.includes('melayu') || lower.includes('bahasa')) return 'ms';
        if (lower.includes('hindi') || lower.includes('हिंदी')) return 'hi';
        if (lower.includes('chinese') || lower.includes('mandarin') || lower.includes('中文')) return 'zh';
        if (lower.includes('spanish') || lower.includes('español')) return 'es';
        if (lower.includes('french') || lower.includes('français')) return 'fr';
        if (lower.includes('german') || lower.includes('deutsch')) return 'de';
        if (lower.includes('japanese') || lower.includes('日本語')) return 'ja';
        const match = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === lower);
        if (match) return match.code;
      }
    }
    return 'en';
  });
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationStatus, setTranslationStatus] = useState<string>('');

  // Auto-enforce assigned native language for student when user loads or updates
  useEffect(() => {
    if (isStudent && studentAssignedNativeLang) {
      setSelectedLanguage(studentAssignedNativeLang.code);
    }
  }, [isStudent, studentAssignedNativeLang]);

  // Lightbox modal for high-resolution image / diagram zoom
  const [lightboxMedia, setLightboxMedia] = useState<{ src: string; alt: string; type?: 'image' | 'video' } | null>(null);

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
  const contentAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const wysiwygRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastInitializedPageIdRef = useRef<string | null>(null);
  const lastInitializedTabRef = useRef<string | null>(null);
  const [editorTab, setEditorTab] = useState<'wysiwyg' | 'code'>('wysiwyg');
  const [floatingToolbar, setFloatingToolbar] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const [selectionToast, setSelectionToast] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Pagination & Tabs Scroll Synchronization Refs (Ensures 16+ pages always stay in view)
  const paginationContainerRef = useRef<HTMLDivElement | null>(null);
  const pageButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const editorTabsContainerRef = useRef<HTMLDivElement | null>(null);
  const editorTabRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Auto-scroll active page indicator button into view whenever page index changes
  useEffect(() => {
    const btn = pageButtonRefs.current[currentPageIndex];
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentPageIndex]);

  // Auto-scroll active faculty editor tab into view
  useEffect(() => {
    const tabEl = editorTabRefs.current[currentPageIndex];
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentPageIndex, editingPage?.id]);

  // Synchronize WYSIWYG element HTML content when changing page or switching tabs without destroying active DOM selection
  useEffect(() => {
    if (editorTab === 'wysiwyg' && wysiwygRef.current && editingPage) {
      const pageChanged = lastInitializedPageIdRef.current !== editingPage.id;
      const tabChanged = lastInitializedTabRef.current !== editorTab;

      if (pageChanged || tabChanged || !wysiwygRef.current.innerHTML) {
        wysiwygRef.current.innerHTML = cleanNestedHtmlTags(editingPage.content || '');
        lastInitializedPageIdRef.current = editingPage.id;
        lastInitializedTabRef.current = editorTab;
      }
    }
  }, [editingPage?.id, editorTab]);

  // Media IndexedDB cache state & Subtitles / Video Transcription state
  const [mediaCache, setMediaCache] = useState<Record<string, string>>({});
  const [showCcSubtitles, setShowCcSubtitles] = useState<boolean>(true);
  const [showTranscriptionDrawer, setShowTranscriptionDrawer] = useState<boolean>(false);
  const [isGeneratingAiTranscription, setIsGeneratingAiTranscription] = useState<boolean>(false);

  // Helper to resolve media URLs (handles 'idb:key' stored in IndexedDB for heavy video/image files)
  const resolveMediaUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('idb:')) {
      const key = url.replace('idb:', '');
      if (mediaCache[key]) return mediaCache[key];
      getMediaFromIDB(key).then(resolved => {
        if (resolved) {
          setMediaCache(prev => ({ ...prev, [key]: resolved }));
        }
      });
      return mediaCache[key] || '';
    }
    return url;
  };

  // Audio / Sound FX toggle for page flip
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Studio Settings & Preferences States
  const [autoFlipInterval, setAutoFlipInterval] = useState<number>(0); // 0 = off, 3, 5, 8, 10, 15 seconds
  const [isAutoFlipping, setIsAutoFlipping] = useState<boolean>(false);
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [ttsAutoRead, setTtsAutoRead] = useState<boolean>(false);
  const [readerFontSize, setReaderFontSize] = useState<string>('text-sm');
  const [readerFontFamily, setReaderFontFamily] = useState<string>('sans');
  const [readerTheme, setReaderTheme] = useState<'dark' | 'sepia' | 'light'>('dark');

  // Auto Page Turn Slideshow Effect
  useEffect(() => {
    if (!isAutoFlipping || autoFlipInterval <= 0) return;
    const timer = setInterval(() => {
      setCurrentPageIndex(prev => (prev < activeMaterial.pages.length - 1 ? prev + 1 : 0));
    }, autoFlipInterval * 1000);
    return () => clearInterval(timer);
  }, [isAutoFlipping, autoFlipInterval, activeMaterial.pages.length]);

  // TTS Auto-Read Page Narration Effect
  useEffect(() => {
    if (!ttsAutoRead) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const currentPageObj = activeMaterial.pages[currentPageIndex];
      if (currentPageObj) {
        const textToRead = `${currentPageObj.title}. ${stripHtml(currentPageObj.content || '')}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = ttsRate;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [currentPageIndex, ttsAutoRead, ttsRate, activeMaterial.pages]);

  // "How to Create E-Books" Modal Guide State
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [guideStep, setGuideStep] = useState<number>(1);

  // Load Flipbooks from Firestore on mount & merge with default curriculum flipbooks
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'course_flipbooks'),
      (snapshot) => {
        const loaded = !snapshot.empty 
          ? snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FlipbookMaterial))
          : [];
        
        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem('deleted_flipbook_ids') || '[]');
        } catch (_) {}

        // Filter out any explicitly deleted flipbooks
        const cleanLoaded = loaded.filter(m => !deletedIds.includes(m.id));
        
        // Merge with DEFAULT_FLIPBOOKS so standard templates are available unless deleted
        const merged = [...cleanLoaded];
        DEFAULT_FLIPBOOKS.forEach(def => {
          if (!deletedIds.includes(def.id) && !merged.some(m => m.id === def.id)) {
            merged.push(def);
          }
        });

        // Ensure every material's title strictly matches its course title and clean up any placeholder strings
        const formattedMerged = merged.map(m => {
          let effectiveCourse = m.courseName || m.pages?.[0]?.courseName || '';
          if (!effectiveCourse || effectiveCourse.toLowerCase().includes('new course') || effectiveCourse.toLowerCase().includes('lecture material')) {
            if (m.title && !m.title.toLowerCase().includes('new course') && !m.title.toLowerCase().includes('lecture material')) {
              effectiveCourse = m.title;
            } else {
              effectiveCourse = configuredCourses[0]?.title || 'Diploma in Production Art Engineer';
            }
          }
          return {
            ...m,
            courseName: effectiveCourse,
            title: effectiveCourse,
            pages: m.pages?.map(p => ({
              ...p,
              courseName: p.courseName && !p.courseName.toLowerCase().includes('new course') ? p.courseName : effectiveCourse
            })) || []
          };
        });

        setMaterials(formattedMerged);
        setActiveMaterial(prevActive => {
          if (!prevActive) {
            return initialMaterial || formattedMerged[0];
          }
          const matched = formattedMerged.find(m => m.id === prevActive.id);
          return matched || formattedMerged[0] || prevActive;
        });
      },
      (err) => {
        console.warn('Firestore flipbooks load notice:', err.message);
        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem('deleted_flipbook_ids') || '[]');
        } catch (_) {}
        const filteredDefaults = DEFAULT_FLIPBOOKS.filter(d => !deletedIds.includes(d.id)).map(m => ({
          ...m,
          title: m.courseName || m.title || 'Diploma in Production Art Engineer'
        }));
        setMaterials(filteredDefaults);
      }
    );
    return () => unsub();
  }, [initialMaterial]);

  // Auto-sync activeMaterial when filtered materials change
  useEffect(() => {
    if (filteredMaterials.length > 0) {
      const isCurrentInFiltered = filteredMaterials.some(m => m.id === activeMaterial?.id);
      if (!isCurrentInFiltered) {
        setActiveMaterial(filteredMaterials[0]);
        setCurrentPageIndex(0);
      }
    }
  }, [filteredMaterials, activeMaterial?.id]);

  // Current Active Page
  const currentPage = activeMaterial.pages[currentPageIndex] || activeMaterial.pages[0];

  // Language translated strings generator
  const getTranslatedPage = (page: FlipbookPage, langCode: string) => {
    if (langCode === 'en' || !page) return page;

    const existingTrans = page.translations?.[langCode];
    const rawCallout = page.calloutText && !isDefaultCalloutText(page.calloutText) ? page.calloutText : '';

    if (existingTrans && (existingTrans.title || existingTrans.content)) {
      const transCallout = existingTrans.calloutText && !isDefaultCalloutText(existingTrans.calloutText) ? existingTrans.calloutText : '';
      return {
        ...page,
        title: existingTrans.title || autoTranslateText(page.title, langCode),
        subtitle: existingTrans.subtitle !== undefined && existingTrans.subtitle !== '' ? existingTrans.subtitle : (page.subtitle || ''),
        content: existingTrans.content || autoTranslateText(page.content, langCode),
        calloutText: transCallout || (rawCallout ? autoTranslateText(rawCallout, langCode) : ''),
        imageCaption: existingTrans.imageCaption || page.imageCaption || '',
        secondaryImageCaption: existingTrans.secondaryImageCaption || page.secondaryImageCaption || '',
        videoCaption: existingTrans.videoCaption || page.videoCaption || '',
        videoTranscription: existingTrans.videoTranscription || page.videoTranscription || ''
      };
    }

    // Check runtime cache by page ID or raw text
    const cachedTitle = RUNTIME_TRANSLATION_CACHE[langCode]?.[page.title?.trim()];
    const cachedContent = RUNTIME_TRANSLATION_CACHE[langCode]?.[page.content?.trim()];

    // Dynamic translation on English text
    return {
      ...page,
      title: cachedTitle || autoTranslateText(page.title, langCode),
      subtitle: page.subtitle ? autoTranslateText(page.subtitle, langCode) : '',
      content: cachedContent || autoTranslateText(page.content, langCode),
      calloutText: rawCallout ? autoTranslateText(rawCallout, langCode) : '',
      imageCaption: page.imageCaption ? autoTranslateText(page.imageCaption, langCode) : '',
      secondaryImageCaption: page.secondaryImageCaption ? autoTranslateText(page.secondaryImageCaption, langCode) : '',
      videoCaption: page.videoCaption ? autoTranslateText(page.videoCaption, langCode) : '',
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

  // Helper to clean up cluttered, duplicated, malformed, or nested HTML tags and unescape entities
  const cleanNestedHtmlTags = (htmlStr: string): string => {
    if (!htmlStr) return '';
    let text = htmlStr;

    // 1. Unescape HTML entities if the string contains encoded tags like &lt;span, &lt;div, &lt;p, etc.
    if (/&lt;(span|div|p|h[1-6]|b|i|u|mark|table|tr|td|ul|ol|li|strong|em|br|img|a)\b/i.test(text)) {
      text = text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
    }

    // 2. Fix broken split opening tags like <div>style="font-weight: normal;"> or <div>style=""<b>
    text = text.replace(/<div\s*>\s*style="([^"]*)"\s*>/gi, '<div style="$1">');
    text = text.replace(/<span\s*>\s*style="([^"]*)"\s*>/gi, '<span style="$1">');
    text = text.replace(/<p\s*>\s*style="([^"]*)"\s*>/gi, '<p style="$1">');
    text = text.replace(/<h([1-6])\s*>\s*style="([^"]*)"\s*>/gi, '<h$1 style="$2">');
    text = text.replace(/<(div|span|p|h[1-6])\s*>\s*style='([^']*)'\s*>/gi, '<$1 style=\'$2\'>');
    text = text.replace(/<(div|span|p|h[1-6])\s*>\s*style=""\s*/gi, '<$1>');
    text = text.replace(/<(div|span|p|h[1-6])\s*>\s*style="[^"]*"\s*/gi, '<$1>');

    // 3. Remove zero-effect wrapper spans & Apple/WebKit copy artifacts
    text = text.replace(/<span\s+style="[^"]*font-style:\s*normal;?\s*text-decoration:\s*none;?[^"]*">([\s\S]*?)<\/span>/gi, '$1');
    text = text.replace(/<span\s+class="Apple-converted-space">([\s\S]*?)<\/span>/gi, '$1');
    text = text.replace(/<span\s+style="[^"]*background-color:\s*transparent;?[^"]*">([\s\S]*?)<\/span>/gi, '$1');

    let prev = '';
    let iterations = 0;
    while (text !== prev && iterations < 8) {
      prev = text;
      iterations++;

      // Unnest duplicate <b><b> -> <b>
      text = text.replace(/<b>\s*<b>([\s\S]*?)<\/b>\s*<\/b>/gi, '<b>$1</b>');
      text = text.replace(/<strong>\s*<strong>([\s\S]*?)<\/strong>\s*<\/strong>/gi, '<strong>$1</strong>');
      // Unnest duplicate <i><i> -> <i>
      text = text.replace(/<i>\s*<i>([\s\S]*?)<\/i>\s*<\/i>/gi, '<i>$1</i>');
      text = text.replace(/<em>\s*<em>([\s\S]*?)<\/em>\s*<\/em>/gi, '<em>$1</em>');
      // Unnest duplicate <u><u> -> <u>
      text = text.replace(/<u>\s*<u>([\s\S]*?)<\/u>\s*<\/u>/gi, '<u>$1</u>');

      // Unnest duplicate <mark...><mark...>...</mark></mark>
      text = text.replace(/<mark[^>]*>\s*<mark[^>]*>([\s\S]*?)<\/mark>\s*<\/mark>/gi, (match, inner) => {
        return `<mark style="background-color: #fef08a; color: #1e293b; padding: 1px 4px; border-radius: 4px;">${inner}</mark>`;
      });

      // Strip unwanted dark grey inline background colors from spans/divs that cover text
      text = text.replace(/background-color:\s*(rgb\(100,\s*116,\s*139\)|#64748b|#475569|#334155);?/gi, '');

      // Remove empty tags
      text = text.replace(/<(b|strong|i|em|u|mark|span)[^>]*>\s*<\/\1>/gi, '');
    }

    return text;
  };

  // One-click action to fix & clean cluttered HTML tags
  const handleCleanAllHtmlTags = () => {
    if (!editingPage) return;
    const cleaned = cleanNestedHtmlTags(editingPage.content || '');
    const updated = { ...editingPage, content: cleaned };
    setEditingPage(updated);
    handleUpdatePage(updated);
    if (wysiwygRef.current) {
      wysiwygRef.current.innerHTML = cleaned;
    }
  };

  // Floating Contextual Selection Handler & Range Saver
  const handleEditorTextSelection = (e?: React.SyntheticEvent) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
      try {
        const range = sel.getRangeAt(0);
        if (wysiwygRef.current && wysiwygRef.current.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range.cloneRange();
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setFloatingToolbar(prev => {
              if (prev && prev.visible && (prev.x !== 0 || prev.y !== 0)) {
                return { ...prev, visible: true };
              }
              return {
                x: Math.max(12, Math.min(window.innerWidth - 420, rect.left + rect.width / 2 - 200)),
                y: Math.max(12, rect.top - 70),
                visible: true
              };
            });
            return;
          }
        }
      } catch (err) {
        // Selection rect fallback
      }
    }
  };

  // Draggable Floating Toolbar Event Handlers
  const handleStartDragToolbar = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!floatingToolbar) return;
    setIsDraggingToolbar(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: floatingToolbar.x,
      initialY: floatingToolbar.y,
    };
  };

  useEffect(() => {
    if (!isDraggingToolbar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setFloatingToolbar({
        x: Math.max(10, Math.min(window.innerWidth - 300, dragStartRef.current.initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 150, dragStartRef.current.initialY + dy)),
        visible: true
      });
    };

    const handleMouseUp = () => {
      setIsDraggingToolbar(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingToolbar]);

  // Helper to safely render formatted HTML strings (e.g. bold, color, font-size on selected text)
  const renderFormattedHtml = (contentStr: string) => {
    if (!contentStr) return null;
    const cleaned = cleanNestedHtmlTags(contentStr);
    const hasHtmlBlocks = /<(p|div|h[1-6]|ul|ol|li|table|blockquote|br)\b/i.test(cleaned);
    const formatted = hasHtmlBlocks ? cleaned : cleaned.replace(/\n/g, '<br />');
    return <div className="formatted-flipbook-content leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Selection-Aware Text Formatting Helper - ONLY applies to selected range!
  const applyFormatToSelection = (openTag: string, closeTag: string) => {
    if (!editingPage) return;

    // 1. WYSIWYG Editor Mode Formatting
    if (editorTab === 'wysiwyg') {
      let sel = window.getSelection();
      let range: Range | null = null;

      if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
        range = sel.getRangeAt(0);
      } else if (savedRangeRef.current && !savedRangeRef.current.collapsed) {
        range = savedRangeRef.current;
      }

      if (!range || range.collapsed || !wysiwygRef.current || !wysiwygRef.current.contains(range.commonAncestorContainer)) {
        setSelectionToast('Please highlight specific text in the editor first!');
        setTimeout(() => setSelectionToast(''), 3500);
        return;
      }

      if (wysiwygRef.current) {
        wysiwygRef.current.focus();
      }

      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }

      // Special handling for standard inline style toggles: Bold, Italic, Underline, Normal
      if (openTag === '<b>' || openTag === '<i>' || openTag === '<u>' || openTag === 'normal') {
        if (openTag === '<b>') {
          document.execCommand('bold', false);
        } else if (openTag === '<i>') {
          document.execCommand('italic', false);
        } else if (openTag === '<u>') {
          document.execCommand('underline', false);
        } else if (openTag === 'normal') {
          document.execCommand('removeFormat', false);
          try {
            const extracted = range.extractContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(extracted);

            // Strip b, i, u, strong, em, mark tags inside extracted
            tempDiv.querySelectorAll('b, strong, i, em, u, mark').forEach(el => {
              const p = el.parentNode;
              while (el.firstChild) p?.insertBefore(el.firstChild, el);
              p?.removeChild(el);
            });

            // Strip inline font-weight, font-style, text-decoration from styled spans
            tempDiv.querySelectorAll('[style]').forEach(el => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.fontWeight = 'normal';
              htmlEl.style.fontStyle = 'normal';
              htmlEl.style.textDecoration = 'none';
            });

            const span = document.createElement('span');
            span.style.fontWeight = 'normal';
            span.style.fontStyle = 'normal';
            span.style.textDecoration = 'none';
            span.appendChild(tempDiv);

            range.insertNode(span);
          } catch (e) {
            console.warn('Normal formatting reset error:', e);
          }
        }

        const newSel = window.getSelection();
        if (newSel && newSel.rangeCount > 0) {
          savedRangeRef.current = newSel.getRangeAt(0).cloneRange();
        }

        const newHtml = wysiwygRef.current.innerHTML;
        const cleaned = cleanNestedHtmlTags(newHtml);
        const updated = { ...editingPage, content: cleaned };
        setEditingPage(updated);
        handleUpdatePage(updated);
        setSelectionToast('');
        return;
      }

      // Custom style attributes (Font Family, Font Size, Color, Highlight Mark)
      const span = document.createElement('span');

      if (openTag.includes('style=')) {
        const match = openTag.match(/style=["']([^"']*)["']/);
        if (match) {
          span.setAttribute('style', match[1]);
        }
      } else if (openTag.includes('<mark')) {
        span.style.backgroundColor = '#fef08a';
        span.style.color = '#1e293b';
        span.style.padding = '1px 4px';
        span.style.borderRadius = '4px';
      }

      try {
        const extracted = range.extractContents();
        span.appendChild(extracted);
        range.insertNode(span);

        // Keep selection on the newly formatted span so selection isn't lost
        if (wysiwygRef.current) {
          wysiwygRef.current.focus();
        }
        const newSel = window.getSelection();
        if (newSel) {
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          newSel.removeAllRanges();
          newSel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();
        }

        const newHtml = wysiwygRef.current.innerHTML;
        const cleaned = cleanNestedHtmlTags(newHtml);
        const updated = { ...editingPage, content: cleaned };
        setEditingPage(updated);
        handleUpdatePage(updated);
        setSelectionToast('');
      } catch (err) {
        console.warn('WYSIWYG formatting range error:', err);
      }
      return;
    }

    // 2. Code Editor Mode Formatting
    const textarea = contentAreaRef.current;
    if (textarea) {
      const text = editingPage.content || '';
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start === end) {
        const inserted = openTag + 'sample text' + closeTag;
        const newText = text.substring(0, start) + inserted + text.substring(end);
        const cleaned = cleanNestedHtmlTags(newText);
        const updated = { ...editingPage, content: cleaned };
        setEditingPage(updated);
        handleUpdatePage(updated);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + openTag.length, start + openTag.length + 11);
        }, 50);
        return;
      }

      const selectedText = text.substring(start, end);
      const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
      const cleaned = cleanNestedHtmlTags(newText);
      const updated = { ...editingPage, content: cleaned };
      setEditingPage(updated);
      handleUpdatePage(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
      }, 50);
    }
  };

  const clearSelectionFormatting = () => {
    if (!editingPage) return;

    if (editorTab === 'wysiwyg') {
      let sel = window.getSelection();
      let range: Range | null = null;

      if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
        range = sel.getRangeAt(0);
      } else if (savedRangeRef.current && !savedRangeRef.current.collapsed) {
        range = savedRangeRef.current;
      }

      if (range && wysiwygRef.current && wysiwygRef.current.contains(range.commonAncestorContainer)) {
        const textContent = range.toString();
        const textNode = document.createTextNode(textContent);
        range.deleteContents();
        range.insertNode(textNode);

        const newHtml = wysiwygRef.current.innerHTML;
        const cleaned = cleanNestedHtmlTags(newHtml);
        const updated = { ...editingPage, content: cleaned };
        setEditingPage(updated);
        handleUpdatePage(updated);
        setSelectionToast('');
        return;
      }
    }

    // Fallback: If no range is selected or in Code mode, strip all HTML tags
    const text = editingPage.content || '';
    const cleanedAll = text.replace(/<[^>]*>/g, '');
    const updated = { ...editingPage, content: cleanedAll };
    setEditingPage(updated);
    handleUpdatePage(updated);
    if (wysiwygRef.current) {
      wysiwygRef.current.innerHTML = cleanedAll;
    }
  };

  // Specific helper to remove highlight (yellow mark & background-color) from selection or entire content
  const removeHighlightFromSelection = () => {
    if (!editingPage) return;

    if (editorTab === 'wysiwyg') {
      let sel = window.getSelection();
      let range: Range | null = null;

      if (sel && sel.rangeCount > 0 && sel.toString().trim().length > 0) {
        range = sel.getRangeAt(0);
      } else if (savedRangeRef.current && !savedRangeRef.current.collapsed) {
        range = savedRangeRef.current;
      }

      if (range && wysiwygRef.current && wysiwygRef.current.contains(range.commonAncestorContainer)) {
        try {
          const fragment = range.cloneContents();
          const div = document.createElement('div');
          div.appendChild(fragment);

          // Strip <mark> tags from range fragment
          const marks = div.querySelectorAll('mark');
          marks.forEach(m => {
            const parent = m.parentNode;
            while (m.firstChild) parent?.insertBefore(m.firstChild, m);
            parent?.removeChild(m);
          });

          // Also strip background-color style properties
          const styledElements = div.querySelectorAll('[style*="background"]');
          styledElements.forEach(el => {
            (el as HTMLElement).style.backgroundColor = '';
            (el as HTMLElement).style.background = '';
            if (!(el as HTMLElement).getAttribute('style')) {
              el.removeAttribute('style');
            }
          });

          range.deleteContents();
          const children = Array.from(div.childNodes);
          children.forEach(child => range?.insertNode(child));

          const newHtml = wysiwygRef.current.innerHTML;
          const cleaned = cleanNestedHtmlTags(newHtml);
          const updatedPage = { ...editingPage, content: cleaned };
          setEditingPage(updatedPage);
          handleUpdatePage(updatedPage);
          setSelectionToast('Highlight removed from selected text!');
          setTimeout(() => setSelectionToast(''), 3000);
          return;
        } catch (err) {
          console.warn('Remove highlight error:', err);
        }
      }
    }

    // Fallback if nothing selected: Remove all highlights from current paragraph
    const rawText = editingPage.content || '';
    const stripMark = rawText
      .replace(/<mark[^>]*>/gi, '')
      .replace(/<\/mark>/gi, '')
      .replace(/background-color:\s*[^;"]*;?/gi, '')
      .replace(/background:\s*[^;"]*;?/gi, '');
    const cleaned = cleanNestedHtmlTags(stripMark);
    const updatedPage = { ...editingPage, content: cleaned };
    setEditingPage(updatedPage);
    handleUpdatePage(updatedPage);
    if (wysiwygRef.current) {
      wysiwygRef.current.innerHTML = cleaned;
    }
    setSelectionToast('All highlights removed from page content!');
    setTimeout(() => setSelectionToast(''), 3000);
  };

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

  // Convert YouTube/Vimeo/Drive/Loom/Dailymotion/Canva URLs to Embeddable URLs
  const getEmbedVideoUrl = (url?: string) => {
    if (!url) return '';
    let clean = url.trim();

    // Upgrade http to https for security
    if (clean.startsWith('http://')) {
      clean = clean.replace('http://', 'https://');
    }

    // YouTube Standard Watch (e.g. youtube.com/watch?v=ID)
    if (clean.includes('youtube.com/watch')) {
      const match = clean.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      const id = match ? match[1] : clean.split('v=')[1]?.split('&')[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&modestbranding=1&rel=0&enablejsapi=1`;
    }
    // YouTube Shortened (e.g. youtu.be/ID)
    if (clean.includes('youtu.be/')) {
      const id = clean.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&modestbranding=1&rel=0&enablejsapi=1`;
    }
    // YouTube Shorts (e.g. youtube.com/shorts/ID)
    if (clean.includes('youtube.com/shorts/')) {
      const id = clean.split('shorts/')[1]?.split('?')[0]?.split('&')[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&modestbranding=1&rel=0&enablejsapi=1`;
    }
    // YouTube Live (e.g. youtube.com/live/ID)
    if (clean.includes('youtube.com/live/')) {
      const id = clean.split('live/')[1]?.split('?')[0]?.split('&')[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&modestbranding=1&rel=0&enablejsapi=1`;
    }
    // YouTube Embed (e.g. youtube.com/embed/ID)
    if (clean.includes('youtube.com/embed/')) {
      return clean;
    }
    // Vimeo (e.g. vimeo.com/ID)
    if (clean.includes('vimeo.com/')) {
      const match = clean.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
      const id = match ? match[1] : clean.split('vimeo.com/')[1]?.split('?')[0];
      if (id) return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`;
    }
    // Google Drive Video (e.g. drive.google.com/file/d/ID/view or drive.google.com/open?id=ID)
    if (clean.includes('drive.google.com/file/d/')) {
      const id = clean.split('/d/')[1]?.split('/')[0]?.split('?')[0];
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }
    if (clean.includes('drive.google.com/open?id=')) {
      const id = clean.split('id=')[1]?.split('&')[0];
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }
    // Loom (e.g. loom.com/share/ID)
    if (clean.includes('loom.com/share/')) {
      const id = clean.split('share/')[1]?.split('?')[0];
      if (id) return `https://www.loom.com/embed/${id}`;
    }
    // Dailymotion
    if (clean.includes('dailymotion.com/video/') || clean.includes('dai.ly/')) {
      const id = clean.includes('dai.ly/')
        ? clean.split('dai.ly/')[1]?.split('?')[0]
        : clean.split('/video/')[1]?.split('?')[0]?.split('_')[0];
      if (id) return `https://www.dailymotion.com/embed/video/${id}`;
    }
    // Dropbox Video direct link
    if (clean.includes('dropbox.com/s/')) {
      return clean.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=[01]/g, '');
    }
    // Canva Video / Presentation Embed
    if (clean.includes('canva.com/design/')) {
      return clean.includes('?') ? `${clean}&embed` : `${clean}?embed`;
    }
    // Streamable
    if (clean.includes('streamable.com/')) {
      const id = clean.split('streamable.com/')[1]?.split('?')[0];
      if (id) return `https://streamable.com/e/${id}`;
    }
    // Wistia
    if (clean.includes('wistia.com/medias/')) {
      const id = clean.split('medias/')[1]?.split('?')[0];
      if (id) return `https://fast.wistia.net/embed/iframe/${id}`;
    }
    return clean;
  };

  // Helper to strip HTML tags from strings (removes <mark>, style attributes, etc.)
  const stripHtml = (input?: string): string => {
    if (!input) return '';
    return input
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  // Helper to clean unwanted metadata labels & boilerplate prefixes from subtitle cue text
  const cleanSubtitleCueText = (input?: string): string => {
    if (!input) return '';
    let text = stripHtml(input);
    // Remove unwanted prefix labels often added by auto-gen templates or external tools
    text = text
      .replace(/^(Lecture Topic|Key Technical Overview|Operational Guidelines & Quality Inspection Checklist|Faculty Takeaway Note|Topic|Note|Overview|Summary|Light Source|Object \(Substrate\)|Observer|The Triad of Color Perception)\s*:\s*/i, '')
      .replace(/^textformatted textColor\s*/i, '')
      .replace(/^textformatted\s*/i, '')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\$+/g, '')
      .replace(/^[-*•\d+.]+\s*/, '')
      .trim();
    return text;
  };

  // Helper to check if a URL is a direct video (local upload Data URL, blob, IDB key, MP4, WebM, MOV, S3, Firebase)
  const isDirectVideo = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase().trim();

    // Explicit iframe embed providers are NOT direct videos
    if (
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('vimeo.com') ||
      lower.includes('drive.google.com') ||
      lower.includes('loom.com') ||
      lower.includes('dailymotion.com') ||
      lower.includes('dai.ly') ||
      lower.includes('streamable.com') ||
      lower.includes('wistia.com') ||
      lower.includes('canva.com')
    ) {
      return false;
    }

    return (
      lower.startsWith('data:video') ||
      lower.startsWith('blob:') ||
      lower.startsWith('idb:') ||
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.endsWith('.ogg') ||
      lower.endsWith('.m4v') ||
      lower.includes('.mp4?') ||
      lower.includes('.webm?') ||
      lower.includes('.mov?') ||
      lower.includes('.m4v?') ||
      lower.includes('commondatastorage.googleapis.com') ||
      lower.includes('storage.googleapis.com') ||
      lower.includes('firebasestorage.googleapis.com') ||
      lower.includes('s3.amazonaws.com') ||
      lower.includes('blob.core.windows.net') ||
      lower.includes('raw.githubusercontent.com') ||
      lower.includes('dl.dropboxusercontent.com') ||
      lower.includes('w3schools.com/html/mov')
    );
  };

  // Video Player Component with Synchronized Subtitle Cues, WebVTT Track, Real-Time Timeupdate, and External Domain Recovery
  const VideoSubtitledPlayer: React.FC<{
    url: string;
    caption?: string;
    transcription?: string;
    pageObj?: FlipbookPage;
  }> = ({ url, caption, transcription, pageObj }) => {
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [vttTrackUrl, setVttTrackUrl] = useState<string>('');
    const [translationVersion, setTranslationVersion] = useState<number>(0);
    const [resolvedUrl, setResolvedUrl] = useState<string>('');
    const [hasPlaybackError, setHasPlaybackError] = useState<boolean>(false);
    const [directPlaybackFailed, setDirectPlaybackFailed] = useState<boolean>(false);
    const [manualPlayerMode, setManualPlayerMode] = useState<'auto' | 'video' | 'iframe'>('auto');
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Asynchronously resolve IndexedDB idb: keys to valid blob object URLs with seamless fallback
    useEffect(() => {
      setHasPlaybackError(false);
      setDirectPlaybackFailed(false);
      if (!url) {
        setResolvedUrl('');
        return;
      }
      if (url.startsWith('idb:')) {
        const key = url.replace('idb:', '');
        if (mediaCache[key]) {
          setResolvedUrl(mediaCache[key]);
        } else {
          getMediaFromIDB(key)
            .then(resolved => {
              if (resolved) {
                setResolvedUrl(resolved);
                setMediaCache(prev => ({ ...prev, [key]: resolved }));
              } else {
                // If local idb video is not on this device/session, seamlessly stream the sample lesson video
                setResolvedUrl(FALLBACK_SAMPLE_VIDEOS[0]);
              }
            })
            .catch(() => {
              setResolvedUrl(FALLBACK_SAMPLE_VIDEOS[0]);
            });
        }
      } else {
        setResolvedUrl(url);
      }
    }, [url, mediaCache]);

    const activeUrl = resolvedUrl || (url && !url.startsWith('idb:') ? url : '');
    const rawCap = caption || pageObj?.videoCaption || '';
    const rawTx = transcription || pageObj?.videoTranscription || '';

    const cleanCap = stripHtml(rawCap);
    const cleanTx = stripHtml(rawTx);

    // Parse transcript lines into raw timestamp cues
    const rawCues = useMemo(() => {
      const lines = cleanTx.split('\n').map(l => l.trim()).filter(Boolean);
      const parsed: { start: number; text: string }[] = [];
      lines.forEach((line, index) => {
        const match = line.match(/^\[(\d{2}):(\d{2})\]\s*(.*)/);
        if (match) {
          const mins = parseInt(match[1], 10);
          const secs = parseInt(match[2], 10);
          const cueText = cleanSubtitleCueText(match[3]);
          if (cueText) {
            parsed.push({ start: mins * 60 + secs, text: cueText });
          }
        } else {
          const cueText = cleanSubtitleCueText(line);
          if (cueText) {
            parsed.push({ start: index * 2.5, text: cueText });
          }
        }
      });
      if (parsed.length === 0 && cleanCap) {
        const cueText = cleanSubtitleCueText(cleanCap);
        if (cueText) {
          parsed.push({ start: 0, text: cueText });
        }
      }
      return parsed;
    }, [cleanTx, cleanCap]);

    // Dynamically scale cue timestamps if the video duration is shorter than the highest cue timestamp
    const cues = useMemo(() => {
      if (rawCues.length === 0) return [];
      const maxCueStart = Math.max(...rawCues.map(c => c.start));
      
      if (duration > 0 && rawCues.length > 1 && (maxCueStart >= duration || maxCueStart === 0)) {
        const interval = duration / rawCues.length;
        return rawCues.map((cue, idx) => ({
          start: idx * interval,
          text: cue.text,
        }));
      }
      return rawCues;
    }, [rawCues, duration]);

    // Auto-translate untranslated subtitle cues via Gemini AI whenever language or cues change
    useEffect(() => {
      if (!selectedLanguage || selectedLanguage === 'en' || cues.length === 0) return;

      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
      const langName = langObj ? langObj.name : selectedLanguage;

      const untranslatedTexts = Array.from(new Set(
        cues
          .map(c => cleanSubtitleCueText(c.text))
          .filter(t => t && !RUNTIME_TRANSLATION_CACHE[selectedLanguage]?.[t] && !TRANSLATION_DICTIONARY[selectedLanguage]?.[t])
      ));

      if (untranslatedTexts.length === 0) return;

      let isMounted = true;
      fetch('/api/gemini/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [{
              text: `Translate the following English video subtitle cues into ${langName} (${selectedLanguage}). Return ONLY a valid JSON array of translated strings in the exact same order. Do not include markdown code block syntax if possible.
Lines: ${JSON.stringify(untranslatedTexts)}`
            }]
          }]
        })
      })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (resultText) {
          try {
            const cleanJson = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const translatedArray: string[] = JSON.parse(jsonMatch[0]);
              if (!RUNTIME_TRANSLATION_CACHE[selectedLanguage]) {
                RUNTIME_TRANSLATION_CACHE[selectedLanguage] = {};
              }
              untranslatedTexts.forEach((orig, idx) => {
                if (translatedArray[idx]) {
                  RUNTIME_TRANSLATION_CACHE[selectedLanguage][orig] = translatedArray[idx];
                }
              });
              setTranslationVersion(v => v + 1);
            }
          } catch (err) {
            console.warn('Subtitle dynamic translation JSON error:', err);
          }
        }
      })
      .catch(err => {
        console.warn('Subtitle dynamic translation request failed:', err);
      });

      return () => { isMounted = false; };
    }, [cues, selectedLanguage]);

    // Active subtitle cue based on current video playback time
    const activeCue = useMemo(() => {
      if (cues.length === 0) return null;
      const sorted = [...cues].sort((a, b) => a.start - b.start);
      const current = sorted.filter(c => c.start <= currentTime).pop();
      return current || sorted[0];
    }, [cues, currentTime]);

    const activeSubtitleText = useMemo(() => {
      if (!activeCue) return '';
      return autoTranslateText(cleanSubtitleCueText(activeCue.text), selectedLanguage);
    }, [activeCue, selectedLanguage, translationVersion]);

    // Generate WebVTT subtitle track Blob for native video player subtitles
    useEffect(() => {
      if (cues.length === 0) return;
      const formatTime = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0');
        return `00:${m}:${sec}.${ms}`;
      };

      const vttLines = ['WEBVTT\n'];
      cues.forEach((cue, i) => {
        const defaultEnd = duration > 0 ? (duration / cues.length) * (i + 1) : cue.start + 3;
        const nextStart = cues[i + 1] ? cues[i + 1].start : defaultEnd;
        vttLines.push(`${i + 1}`);
        vttLines.push(`${formatTime(cue.start)} --> ${formatTime(nextStart)}`);
        vttLines.push(autoTranslateText(cleanSubtitleCueText(cue.text), selectedLanguage));
        vttLines.push('');
      });

      const blob = new Blob([vttLines.join('\n')], { type: 'text/vtt' });
      const objectUrl = URL.createObjectURL(blob);
      setVttTrackUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }, [cues, duration, selectedLanguage, translationVersion]);

    if (url.startsWith('idb:') && !activeUrl && !hasPlaybackError) {
      return (
        <div className="relative w-full h-full min-h-[160px] bg-slate-950 rounded-xl border border-pink-500/20 p-4 flex flex-col items-center justify-center text-center space-y-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
          <div className="text-xs font-semibold text-pink-300">Loading video demonstration...</div>
        </div>
      );
    }

    const shouldRenderDirectVideo =
      manualPlayerMode === 'video' ||
      (manualPlayerMode !== 'iframe' &&
        !directPlaybackFailed &&
        (isDirectVideo(url) ||
          activeUrl.startsWith('blob:') ||
          activeUrl.startsWith('data:video') ||
          activeUrl.endsWith('.mp4') ||
          activeUrl.endsWith('.webm') ||
          activeUrl.endsWith('.mov') ||
          activeUrl.includes('commondatastorage.googleapis.com')));

    const embedUrl = getEmbedVideoUrl(activeUrl || url);
    const rawExternalUrl = url && !url.startsWith('idb:') && !url.startsWith('data:') ? url : '';

    return (
      <div className="relative w-full h-full group bg-black rounded-xl overflow-hidden flex flex-col justify-center">
        {shouldRenderDirectVideo ? (
          <video
            ref={videoRef}
            src={activeUrl}
            controls
            playsInline
            onError={() => {
              console.warn('Direct video playback error, switching to embed iframe fallback');
              setDirectPlaybackFailed(true);
            }}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            className="w-full h-full object-contain bg-black rounded-lg"
          >
            {vttTrackUrl && (
              <track
                kind="subtitles"
                src={vttTrackUrl}
                srcLang={selectedLanguage}
                label={`${selectedLanguage.toUpperCase()} Subtitles`}
                default
              />
            )}
          </video>
        ) : (
          <iframe
            src={embedUrl}
            title={cleanCap || "Lesson Video"}
            className="w-full h-full border-0 rounded-lg min-h-[180px]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}

        {/* Video Control Bar overlay in Top-Right Corner */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2 py-1 rounded-lg border border-amber-500/40 shadow-xl flex-wrap">
          {rawExternalUrl && (
            <a
              href={rawExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-slate-300 hover:text-amber-300 transition"
              title="Open video in external domain tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          
          {/* Switch Player mode button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setManualPlayerMode(prev => (prev === 'iframe' ? 'video' : 'iframe'));
            }}
            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Toggle between HTML5 Direct Player and Embedded Iframe"
          >
            {shouldRenderDirectVideo ? 'Direct' : 'Embed'}
          </button>

          {/* Closed Captions toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCcSubtitles(prev => !prev);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
              showCcSubtitles
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle Closed Captions (CC)"
          >
            <Captions className="w-3.5 h-3.5" />
            <span>{showCcSubtitles ? 'CC ON' : 'CC OFF'}</span>
          </button>
          <span className="text-[10px] font-extrabold text-amber-300 uppercase px-1">
            {selectedLanguage.toUpperCase()}
          </span>
        </div>

        {/* Dynamic Real-Time Time-Synced Closed Caption Subtitle Banner */}
        {showCcSubtitles && activeSubtitleText && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-lg pointer-events-none text-center">
            <div className="inline-block px-4 py-2 rounded-xl bg-black/95 border border-amber-400/60 shadow-2xl backdrop-blur-md">
              <p className="text-xs sm:text-sm font-black text-amber-300 tracking-wide drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]">
                💬 {activeSubtitleText}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Smart Video Player Wrapper
  const renderVideoPlayer = (url?: string, caption?: string, transcription?: string, pageObj?: FlipbookPage) => {
    if (!url) return null;
    return (
      <VideoSubtitledPlayer
        url={url}
        caption={caption}
        transcription={transcription}
        pageObj={pageObj}
      />
    );
  };

  // Image File Upload Handler with instant Base64 data URL & IndexedDB Persistent Storage
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPage) {
      const dataUrl = await fileToDataUrl(file);
      const idbKey = `image_idb_${editingPage.id}`;
      await saveMediaToIDB(idbKey, file);
      
      const finalImageUrl = dataUrl || `idb:${idbKey}`;
      setMediaCache(prev => ({ ...prev, [idbKey]: finalImageUrl }));

      const updated: FlipbookPage = {
        ...editingPage,
        imageUrl: finalImageUrl,
        imageCaption: editingPage.imageCaption || file.name.replace(/\.[^/.]+$/, ""),
      };
      setEditingPage(updated);
      handleUpdatePage(updated);
    }
  };

  // Secondary Image File Upload Handler with instant Base64 data URL & IndexedDB Persistent Storage
  const handleSecondaryImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPage) {
      const dataUrl = await fileToDataUrl(file);
      const idbKey = `sec_image_idb_${editingPage.id}`;
      await saveMediaToIDB(idbKey, file);

      const finalImageUrl = dataUrl || `idb:${idbKey}`;
      setMediaCache(prev => ({ ...prev, [idbKey]: finalImageUrl }));

      const updated: FlipbookPage = {
        ...editingPage,
        secondaryImageUrl: finalImageUrl,
        secondaryImageCaption: editingPage.secondaryImageCaption || file.name.replace(/\.[^/.]+$/, ""),
      };
      setEditingPage(updated);
      handleUpdatePage(updated);
    }
  };

  // Video File Upload Handler with IndexedDB Persistent Storage
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPage) {
      const idbKey = `video_idb_${editingPage.id}`;
      await saveMediaToIDB(idbKey, file);
      const objectUrl = URL.createObjectURL(file);
      setMediaCache(prev => ({ ...prev, [idbKey]: objectUrl }));

      const defaultCaption = editingPage.videoCaption || `Video Demonstration: ${file.name.replace(/\.[^/.]+$/, "")}`;

      const updated: FlipbookPage = {
        ...editingPage,
        videoUrl: `idb:${idbKey}`,
        videoCaption: defaultCaption,
      };
      setEditingPage(updated);
      handleUpdatePage(updated);

      // Auto-transcribe spoken video audio using Gemini Multimodal AI
      handleAutoGenerateTranscription(updated);
    }
  };

  // Subtitle / Caption File Upload Handler (.vtt, .srt, .txt, .json)
  const handleSubtitleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        let formattedTranscript = '';

        // Handle .srt SubRip Subtitle Format
        if (file.name.toLowerCase().endsWith('.srt') || (text.includes('-->') && !text.startsWith('WEBVTT'))) {
          const blocks = text.split(/\n\s*\n/);
          const lines: string[] = [];
          blocks.forEach(block => {
            const blockLines = block.trim().split('\n');
            const timeLine = blockLines.find(l => l.includes('-->'));
            if (timeLine) {
              const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2})/);
              if (timeMatch) {
                const mins = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
                const secs = timeMatch[3];
                const contentText = blockLines.slice(blockLines.indexOf(timeLine) + 1).join(' ').trim();
                if (contentText) {
                  lines.push(`[${mins.toString().padStart(2, '0')}:${secs}] ${contentText}`);
                }
              }
            }
          });
          formattedTranscript = lines.join('\n') || text;
        } 
        // Handle .vtt WebVTT Subtitle Format
        else if (file.name.toLowerCase().endsWith('.vtt') || text.startsWith('WEBVTT')) {
          const blocks = text.replace(/^WEBVTT[^\n]*\n/, '').split(/\n\s*\n/);
          const lines: string[] = [];
          blocks.forEach(block => {
            const blockLines = block.trim().split('\n');
            const timeLine = blockLines.find(l => l.includes('-->'));
            if (timeLine) {
              const timeMatch = timeLine.match(/(\d{2}):(\d{2})/);
              if (timeMatch) {
                const mins = timeMatch[1];
                const secs = timeMatch[2];
                const contentText = blockLines.slice(blockLines.indexOf(timeLine) + 1).join(' ').trim();
                if (contentText) {
                  lines.push(`[${mins}:${secs}] ${contentText}`);
                }
              }
            }
          });
          formattedTranscript = lines.join('\n') || text;
        }
        // Handle .json Subtitle Format
        else if (file.name.toLowerCase().endsWith('.json')) {
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
              formattedTranscript = parsed.map((item: any) => {
                const time = item.time || item.timestamp || item.start || '00:00';
                const content = item.text || item.subtitle || item.caption || item.line || '';
                return `[${time}] ${content}`;
              }).join('\n');
            } else if (parsed.subtitles || parsed.transcript) {
              const items = parsed.subtitles || parsed.transcript;
              if (Array.isArray(items)) {
                formattedTranscript = items.map((item: any) => `[${item.time || '00:00'}] ${item.text || item.caption}`).join('\n');
              }
            }
          } catch {
            formattedTranscript = text;
          }
        } 
        // Plain TXT or generic text file
        else {
          formattedTranscript = text;
        }

        const updated: FlipbookPage = {
          ...editingPage,
          videoTranscription: stripHtml(formattedTranscript),
        };
        setEditingPage(updated);
        handleUpdatePage(updated);
      };
      reader.readAsText(file);
    }
  };

  // AI Auto-Generate Video Transcription & Native Subtitles via Gemini Multimodal AI
  const handleAutoGenerateTranscription = async (pageToTranscribe?: FlipbookPage) => {
    const targetPage = pageToTranscribe || editingPage || currentPage;
    if (!targetPage) return;

    setIsGeneratingAiTranscription(true);

    try {
      let generatedTranscription = '';
      const videoRawUrl = targetPage.videoUrl ? resolveMediaUrl(targetPage.videoUrl) : '';

      // 1. If video file is present, attempt Gemini Multimodal Audio/Video Transcription
      if (videoRawUrl && (videoRawUrl.startsWith('data:') || videoRawUrl.startsWith('blob:') || videoRawUrl.startsWith('http'))) {
        try {
          let base64Data = '';
          let mimeType = 'video/mp4';

          if (videoRawUrl.startsWith('data:')) {
            const parts = videoRawUrl.split(',');
            const match = parts[0].match(/:(.*?);/);
            if (match) mimeType = match[1];
            base64Data = parts[1];
          } else {
            // Fetch blob from blob: or http: URL and convert to base64
            const blobRes = await fetch(videoRawUrl);
            const blob = await blobRes.blob();
            mimeType = blob.type || 'video/mp4';

            if (blob.size < 18 * 1024 * 1024) {
              base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const resStr = reader.result as string;
                  resolve(resStr.split(',')[1] || '');
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          }

          if (base64Data) {
            const geminiRes = await fetch('/api/gemini/generate-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'gemini-2.5-flash',
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        inlineData: {
                          mimeType: mimeType,
                          data: base64Data
                        }
                      },
                      {
                        text: `Listen closely to the audio narration in this video and transcribe the exact spoken voiceover as timestamped subtitles.

RULES:
1. ONLY transcribe what is actually SPOKEN in the video audio narration.
2. DO NOT include textbook descriptions, written document text, or extra commentary.
3. Keep each subtitle line short and concise (3 to 8 words).
4. Format strictly as [mm:ss] Spoken text.

Example:
[00:00] What is color?
[00:01] It is a sensory experience.
[00:03] It results from the visible spectrum,
[00:05] driven by a triad,
[00:07] interacting with objects,
[00:08] and perceived by our eyes.`
                      }
                    ]
                  }
                ]
              })
            });

            if (geminiRes.ok) {
              const data = await geminiRes.json();
              const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textResult) {
                generatedTranscription = textResult
                  .replace(/```[a-z]*\n?/gi, '')
                  .replace(/```/g, '')
                  .trim();
              }
            }
          }
        } catch (mediaErr) {
          console.warn('Gemini video audio transcription error, falling back to Gemini text:', mediaErr);
        }
      }

      // 2. Fallback text request to Gemini if video binary transcription failed or no video file
      if (!generatedTranscription) {
        try {
          const cleanTitle = cleanSubtitleCueText(targetPage.title) || 'What is color?';
          const geminiRes = await fetch('/api/gemini/generate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gemini-2.5-flash',
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Generate a short 10-second spoken video voiceover transcript for an educational clip titled "${cleanTitle}".

RULES:
1. Output ONLY 4 to 5 short spoken narration lines corresponding to natural speech audio.
2. Maximum 6 words per line.
3. DO NOT include textbook notes, technical checklists, or document paragraphs.
4. Format each line strictly as [00:ss] Spoken sentence.

Example:
[00:00] What is color?
[00:02] It is a sensory experience.
[00:05] Driven by light, object, and observer.
[00:08] Perceived by the human eye.`
                    }
                  ]
                }
              ]
            })
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResult) {
              generatedTranscription = textResult
                .replace(/```[a-z]*\n?/gi, '')
                .replace(/```/g, '')
                .trim();
            }
          }
        } catch (textErr) {
          console.warn('Gemini text fallback failed:', textErr);
        }
      }

      // 3. Ultimate clean local fallback
      if (!generatedTranscription) {
        const cleanTitle = cleanSubtitleCueText(targetPage.title) || 'What is color?';
        generatedTranscription = `[00:00] ${cleanTitle}\n[00:02] It is a sensory experience.\n[00:05] Driven by a triad of light, object, and observer.\n[00:08] Perceived by the human eye.`;
      }

      const generatedCaption = cleanSubtitleCueText(targetPage.videoCaption) || cleanSubtitleCueText(targetPage.title) || 'Interactive Video Lesson';

      const updatedPage: FlipbookPage = {
        ...targetPage,
        videoCaption: generatedCaption,
        videoTranscription: generatedTranscription,
        isCustomEdited: true,
      };

      if (editingPage && editingPage.id === targetPage.id) {
        setEditingPage(updatedPage);
      }
      handleUpdatePage(updatedPage);
    } catch (err) {
      console.error('Error generating AI transcription:', err);
    } finally {
      setIsGeneratingAiTranscription(false);
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

  const translatingRef = useRef<Set<string>>(new Set());

  // Fast AI Single Page Translation Helper
  const translateSinglePageWithAI = async (pageToTranslate: FlipbookPage, langCode: string, force: boolean = true) => {
    if (langCode === 'en' || !pageToTranslate) return;
    const reqKey = `${pageToTranslate.id}_${langCode}`;
    if (translatingRef.current.has(reqKey)) return;

    translatingRef.current.add(reqKey);
    setIsTranslating(true);
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const langName = langObj ? langObj.name : langCode;
    setTranslationStatus(`Translating Page ${pageToTranslate.pageNumber} into ${langName}...`);

    try {
      const pagePayload = [{
        id: pageToTranslate.id,
        title: pageToTranslate.title,
        subtitle: pageToTranslate.subtitle || '',
        content: pageToTranslate.content,
        calloutText: pageToTranslate.calloutText || '',
        imageCaption: pageToTranslate.imageCaption || '',
        secondaryImageCaption: pageToTranslate.secondaryImageCaption || '',
        videoCaption: pageToTranslate.videoCaption || ''
      }];

      const prompt = `You are a professional educational textbook translator and curriculum specialist.
Translate the following ebook page into natural, fluent, and mathematically/scientifically accurate ${langName} (${langCode}).

CRITICAL REQUIREMENTS:
1. Translate completely into natural, accurate, high-quality ${langName}.
2. Do NOT leave English sentences or untranslated partial words in the output.
3. Preserve paragraph structure, line breaks, bullet points, numbers, and technical terminology.
4. Return ONLY a valid JSON array of objects with the exact structure:
[
  {
    "id": "${pageToTranslate.id}",
    "title": "Translated Page Title",
    "subtitle": "Translated Subtitle",
    "content": "Translated Full Page Content",
    "calloutText": "Translated Callout",
    "imageCaption": "Translated Image Caption",
    "secondaryImageCaption": "Translated Secondary Image Caption",
    "videoCaption": "Translated Video Caption"
  }
]

Page to translate:
${JSON.stringify(pagePayload, null, 2)}`;

      const res = await generateGeminiContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: `You are an expert educational translator specializing in ${langName}. Always respond with clean, valid JSON array only.`
        }
      });

      if (res && res.text) {
        let cleanText = res.text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const translatedArray = JSON.parse(cleanText);
        if (Array.isArray(translatedArray) && translatedArray.length > 0) {
          const match = translatedArray[0];
          const transObj = {
            title: match.title || pageToTranslate.title,
            subtitle: match.subtitle || pageToTranslate.subtitle || '',
            content: match.content || pageToTranslate.content,
            calloutText: match.calloutText || pageToTranslate.calloutText || '',
            imageCaption: match.imageCaption || pageToTranslate.imageCaption || '',
            secondaryImageCaption: match.secondaryImageCaption || pageToTranslate.secondaryImageCaption || '',
            videoCaption: match.videoCaption || pageToTranslate.videoCaption || ''
          };

          if (!RUNTIME_TRANSLATION_CACHE[langCode]) RUNTIME_TRANSLATION_CACHE[langCode] = {};
          RUNTIME_TRANSLATION_CACHE[langCode][pageToTranslate.title.trim()] = transObj.title;
          RUNTIME_TRANSLATION_CACHE[langCode][pageToTranslate.content.trim()] = transObj.content;

          const updatedPages = activeMaterial.pages.map(p => {
            if (p.id === pageToTranslate.id) {
              return {
                ...p,
                translations: {
                  ...(p.translations || {}),
                  [langCode]: transObj
                }
              };
            }
            return p;
          });

          const updatedMat = { ...activeMaterial, pages: updatedPages };
          setActiveMaterial(updatedMat);
          setMaterials(prev => prev.map(m => m.id === updatedMat.id ? updatedMat : m));
          if (editingPage && editingPage.id === pageToTranslate.id) {
            setEditingPage(updatedPages.find(p => p.id === pageToTranslate.id) || null);
          }

          // Persist translated page
          try {
            await setDoc(doc(db, 'course_flipbooks', updatedMat.id), {
              ...updatedMat,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.warn('Firestore auto-sync single page translation notice:', e);
          }
        }
      }
    } catch (err) {
      console.error('AI Single Page Translation error:', err);
    } finally {
      setIsTranslating(false);
      setTranslationStatus('');
      translatingRef.current.delete(reqKey);
    }
  };

  // AI Auto Translate all pages in material using Gemini with chunked batching for 30+ page modules
  const translateMaterialPagesWithAI = async (mat: FlipbookMaterial, langCode: string, forceReTranslate: boolean = false) => {
    if (langCode === 'en' || !mat || !mat.pages || mat.pages.length === 0) return;

    const reqKey = `${mat.id}_${langCode}`;
    if (translatingRef.current.has(reqKey)) return;

    // Check if any pages need translation
    const rawPagesNeeding = forceReTranslate
      ? [...mat.pages]
      : mat.pages.filter(p => !p.translations?.[langCode]?.title || !p.translations?.[langCode]?.content);
    
    if (rawPagesNeeding.length === 0) return;

    // Sort to prioritize currently active page first for instantaneous user feedback
    const activePageId = mat.pages[currentPageIndex]?.id;
    const pagesNeedingTranslation = [...rawPagesNeeding].sort((a, b) => {
      if (a.id === activePageId) return -1;
      if (b.id === activePageId) return 1;
      return a.pageNumber - b.pageNumber;
    });

    translatingRef.current.add(reqKey);
    setIsTranslating(true);
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const langName = langObj ? langObj.name : langCode;
    const totalPages = pagesNeedingTranslation.length;

    try {
      // Chunk pages into batches of 4 for speed, reliability, and to avoid token timeouts on 30+ page modules
      const CHUNK_SIZE = 4;
      let currentWorkingMat = { ...mat };

      for (let i = 0; i < totalPages; i += CHUNK_SIZE) {
        const chunk = pagesNeedingTranslation.slice(i, i + CHUNK_SIZE);
        const chunkStart = i + 1;
        const chunkEnd = Math.min(i + CHUNK_SIZE, totalPages);
        const progressPct = Math.round((chunkEnd / totalPages) * 100);
        
        setTranslationStatus(`Translating pages ${chunkStart}-${chunkEnd} of ${totalPages} into ${langName} (${progressPct}%)...`);

        const pagesToTranslate = chunk.map(p => ({
          id: p.id,
          title: p.title,
          subtitle: p.subtitle || '',
          content: p.content,
          calloutText: p.calloutText || '',
          imageCaption: p.imageCaption || '',
          secondaryImageCaption: p.secondaryImageCaption || '',
          videoCaption: p.videoCaption || ''
        }));

        const prompt = `You are a professional educational textbook translator and curriculum specialist.
Translate the following ebook pages into natural, fluent, and mathematically/scientifically accurate ${langName} (${langCode}).

CRITICAL REQUIREMENTS:
1. Translate every page completely into natural, accurate, high-quality ${langName}.
2. Do NOT leave English sentences or untranslated partial words in the output.
3. Preserve paragraph structure, line breaks, bullet points, numbers, and technical terminology in the appropriate ${langName} translation.
4. Return ONLY a valid JSON array of objects with the exact structure:
[
  {
    "id": "page_id",
    "title": "Translated Page Title",
    "subtitle": "Translated Subtitle",
    "content": "Translated Full Page Content",
    "calloutText": "Translated Callout",
    "imageCaption": "Translated Image Caption",
    "secondaryImageCaption": "Translated Secondary Image Caption",
    "videoCaption": "Translated Video Caption"
  }
]

Pages to translate:
${JSON.stringify(pagesToTranslate, null, 2)}`;

        try {
          const res = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              systemInstruction: `You are an expert educational translator specializing in ${langName}. Always respond with clean, valid JSON array only.`
            }
          });

          if (res && res.text) {
            let cleanText = res.text.trim();
            if (cleanText.startsWith('```json')) {
              cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanText.startsWith('```')) {
              cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const translatedArray = JSON.parse(cleanText);
            if (Array.isArray(translatedArray)) {
              const updatedPages = currentWorkingMat.pages.map(p => {
                const match = translatedArray.find((t: any) => t.id === p.id);
                if (match) {
                  const transObj = {
                    title: match.title || p.title,
                    subtitle: match.subtitle || p.subtitle || '',
                    content: match.content || p.content,
                    calloutText: match.calloutText || p.calloutText || '',
                    imageCaption: match.imageCaption || p.imageCaption || '',
                    secondaryImageCaption: match.secondaryImageCaption || p.secondaryImageCaption || '',
                    videoCaption: match.videoCaption || p.videoCaption || ''
                  };

                  if (!RUNTIME_TRANSLATION_CACHE[langCode]) RUNTIME_TRANSLATION_CACHE[langCode] = {};
                  RUNTIME_TRANSLATION_CACHE[langCode][p.title.trim()] = transObj.title;
                  RUNTIME_TRANSLATION_CACHE[langCode][p.content.trim()] = transObj.content;

                  return {
                    ...p,
                    translations: {
                      ...(p.translations || {}),
                      [langCode]: transObj
                    }
                  };
                }
                return p;
              });

              currentWorkingMat = { ...currentWorkingMat, pages: updatedPages };
              setActiveMaterial(currentWorkingMat);
              setMaterials(prev => prev.map(m => m.id === currentWorkingMat.id ? currentWorkingMat : m));
              
              // Persist chunk progress to Firestore immediately
              try {
                await setDoc(doc(db, 'course_flipbooks', currentWorkingMat.id), {
                  ...currentWorkingMat,
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              } catch (e) {
                console.warn('Firestore chunk auto-sync translation notice:', e);
              }
            }
          }
        } catch (chunkErr) {
          console.warn(`Chunk translation error for pages ${chunkStart}-${chunkEnd}:`, chunkErr);
        }
      }
    } catch (err) {
      console.error('AI Auto-translation overall error:', err);
    } finally {
      setIsTranslating(false);
      setTranslationStatus('');
      translatingRef.current.delete(reqKey);
    }
  };

  // Auto Translate all pages in current material
  const handleAutoTranslateAll = (langCode?: string, force: boolean = true) => {
    const targetLang = langCode || selectedLanguage;
    if (targetLang === 'en' || !activeMaterial) return;
    translateMaterialPagesWithAI(activeMaterial, targetLang, force);
  };

  // Auto Translate current page only
  const handleAutoTranslateCurrentPage = (langCode?: string) => {
    const targetLang = langCode || selectedLanguage;
    const pageObj = activeMaterial.pages[currentPageIndex] || editingPage;
    if (targetLang === 'en' || !pageObj) return;
    translateSinglePageWithAI(pageObj, targetLang, true);
  };

  // Automatically trigger AI translation when selectedLanguage changes or activeMaterial pages count changes
  useEffect(() => {
    if (selectedLanguage !== 'en' && activeMaterial && activeMaterial.pages.length > 0) {
      translateMaterialPagesWithAI(activeMaterial, selectedLanguage, false);
    }
  }, [selectedLanguage, activeMaterial?.id, activeMaterial?.pages?.length]);

  // Save current material to Firestore with multi-system persistence
  const handleSaveMaterial = async (mat?: FlipbookMaterial, skipLocalOnlyNotice = false) => {
    setIsSaving(true);
    try {
      const baseMat = mat || activeMaterial;
      if (!baseMat || !baseMat.id) {
        setIsSaving(false);
        return;
      }

      // Merge current editingPage into pages array if active
      let sourcePages = baseMat.pages ? [...baseMat.pages] : [];
      if (editingPage) {
        const pageIdx = sourcePages.findIndex(p => p.id === editingPage.id);
        if (pageIdx >= 0) {
          sourcePages[pageIdx] = { ...editingPage };
        } else {
          sourcePages.push({ ...editingPage });
        }
      }

      // Ensure all media are persisted in IndexedDB and cloud-ready
      const sanitizedPages = await Promise.all(
        sourcePages.map(async (page) => {
          const p = { ...page };
          // Ensure video URLs are clean
          if (p.videoUrl) {
            p.videoUrl = p.videoUrl.trim();
            if (p.videoUrl.startsWith('data:video')) {
              const idbKey = `video_idb_${p.id}`;
              await saveMediaToIDB(idbKey, p.videoUrl).catch(() => {});
              p.videoUrl = `idb:${idbKey}`;
            }
          }
          // Preserve image data URLs in cloud document so other devices can render them
          if (p.imageUrl) {
            p.imageUrl = p.imageUrl.trim();
            if (p.imageUrl.startsWith('data:image')) {
              const idbKey = `image_idb_${p.id}`;
              await saveMediaToIDB(idbKey, p.imageUrl).catch(() => {});
              // Only convert to idb: reference if image payload exceeds Firestore's 900KB single field threshold
              if (p.imageUrl.length > 900000) {
                p.imageUrl = `idb:${idbKey}`;
              }
            }
          }
          if (p.secondaryImageUrl) {
            p.secondaryImageUrl = p.secondaryImageUrl.trim();
            if (p.secondaryImageUrl.startsWith('data:image')) {
              const idbKey = `sec_image_idb_${p.id}`;
              await saveMediaToIDB(idbKey, p.secondaryImageUrl).catch(() => {});
              if (p.secondaryImageUrl.length > 900000) {
                p.secondaryImageUrl = `idb:${idbKey}`;
              }
            }
          }
          return p;
        })
      );

      // Enforce E-Book Title strictly as Course Title
      const effectiveCourseTitle = baseMat.courseName || baseMat.title || 'Diploma in Production Art Engineer';
      const sanitizedMat: FlipbookMaterial = {
        ...baseMat,
        title: effectiveCourseTitle,
        courseName: effectiveCourseTitle,
        courseCategory: effectiveCourseTitle,
        pages: sanitizedPages,
        updatedAt: new Date().toISOString()
      };
      const cleanData = JSON.parse(JSON.stringify(sanitizedMat));

      // 1. Immediately update in-memory state and localStorage backup for instant UX
      setMaterials(prev => {
        const idx = prev.findIndex(m => m.id === baseMat.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = sanitizedMat;
          return next;
        }
        return [...prev, sanitizedMat];
      });
      setActiveMaterial(sanitizedMat);

      try {
        localStorage.setItem(`flipbook_backup_${baseMat.id}`, JSON.stringify(cleanData));
      } catch (_) {}

      // 2. Persist to Firestore
      const firestoreWrite = setDoc(doc(db, 'course_flipbooks', baseMat.id), {
        ...cleanData,
        updatedAt: new Date().toISOString()
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore write timeout')), 6000)
      );

      await Promise.race([firestoreWrite, timeoutPromise]);

      setSaveMessage('Saved successfully to Cloud database! Synchronized across all devices.');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err: any) {
      console.warn('Firestore save notice:', err?.message || err);
      if (!skipLocalOnlyNotice) {
        setSaveMessage('Saved successfully to local memory & media store.');
        setTimeout(() => setSaveMessage(''), 3500);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete / Remove an E-Book permanently from Cloud and Local Session
  const handleDeleteMaterial = async (matIdToDelete: string) => {
    const targetMat = materials.find(m => m.id === matIdToDelete);
    const title = targetMat ? (targetMat.courseName || targetMat.title) : 'this E-Book';

    const confirmed = window.confirm(
      `Are you sure you want to remove the E-Book "${title}"?\n\nThis will delete it from the cloud database and remove it from the E-Book list.`
    );
    if (!confirmed) return;

    try {
      setIsSaving(true);
      // 1. Delete from Firestore with timeout protection
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore delete timeout')), 4000));
      await Promise.race([
        deleteDoc(doc(db, 'course_flipbooks', matIdToDelete)),
        timeoutPromise
      ]).catch(err => {
        console.warn('Firestore delete notice:', err);
      });

      // 2. Track deleted ID in localStorage so templates don't respawn
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem('deleted_flipbook_ids') || '[]');
        if (!deletedIds.includes(matIdToDelete)) {
          deletedIds.push(matIdToDelete);
          localStorage.setItem('deleted_flipbook_ids', JSON.stringify(deletedIds));
        }
      } catch (_) {}

      // 3. Remove from materials state
      const remainingMaterials = materials.filter(m => m.id !== matIdToDelete);
      setMaterials(remainingMaterials);

      // 4. Update active material
      if (activeMaterial.id === matIdToDelete) {
        if (remainingMaterials.length > 0) {
          setActiveMaterial(remainingMaterials[0]);
          setCurrentPageIndex(0);
          if (remainingMaterials[0].pages?.length > 0) {
            setEditingPage(remainingMaterials[0].pages[0]);
          }
        } else {
          handleCreateNewMaterial();
        }
      }

      setSaveMessage('E-Book removed successfully!');
      setTimeout(() => setSaveMessage(''), 3500);
    } catch (err) {
      console.error('Error removing flipbook:', err);
      setSaveMessage('Removed from current session.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Update Course Title & E-Book Name across active material and all pages
  const handleUpdateCourseTitle = (newCourseTitle: string) => {
    if (!newCourseTitle) return;
    const cleanTitle = newCourseTitle.trim();
    if (!cleanTitle) return;

    const updatedPages = (activeMaterial.pages || []).map(p => ({
      ...p,
      courseName: cleanTitle
    }));

    const updatedMat: FlipbookMaterial = {
      ...activeMaterial,
      title: cleanTitle,
      courseName: cleanTitle,
      courseCategory: cleanTitle,
      pages: updatedPages
    };

    setActiveMaterial(updatedMat);
    setMaterials(prev => prev.map(m => m.id === updatedMat.id ? updatedMat : m));
    
    if (editingPage) {
      const updatedCurrentPage = { ...editingPage, courseName: cleanTitle };
      setEditingPage(updatedCurrentPage);
      handleUpdatePage(updatedCurrentPage);
    }

    handleSaveMaterial(updatedMat, true);
  };

  // Editor Actions
  const handleCreateNewMaterial = () => {
    const newMatId = `mat_${Date.now()}`;
    const defaultCourse = (selectedCourseFilter !== 'All Course Titles' && selectedCourseFilter !== 'All Assigned Courses' ? selectedCourseFilter : '')
      || (configuredCourses[0]?.title || 'Diploma in Production Art Engineer');
    const defaultMod = selectedModuleFilter !== 'All Modules' ? selectedModuleFilter : '';
    
    const initialTitle = 'Page 1: Lesson Topic Header';
    const initialContent = 'Enter main topic description, lecture notes, or key course summary here...';
    const initialCaption = 'Topic Illustration';
    
    const initialTranslations: Record<string, any> = {};
    if (selectedLanguage !== 'en') {
      initialTranslations[selectedLanguage] = {
        title: autoTranslateText(initialTitle, selectedLanguage),
        subtitle: '',
        content: autoTranslateText(initialContent, selectedLanguage),
        calloutText: '',
        imageCaption: autoTranslateText(initialCaption, selectedLanguage),
        secondaryImageCaption: '',
        videoCaption: ''
      };
    }

    const newMat: FlipbookMaterial = {
      id: newMatId,
      title: defaultCourse, // Strictly named as per Course Title
      description: `Faculty interactive course E-book and presentation slides for ${defaultCourse}.`,
      courseCategory: defaultCourse,
      courseName: defaultCourse,
      author: (user as any)?.displayName || user?.email || 'Endless School of Printing and Packaging',
      coverImageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
      updatedAt: new Date().toISOString(),
      pages: [
        {
          id: `p_${Date.now()}_1`,
          pageNumber: 1,
          title: initialTitle,
          subtitle: '',
          content: initialContent,
          layoutStyle: 'grid-2x2',
          mediaType: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
          imageCaption: initialCaption,
          calloutText: '',
          bgTheme: 'classic-paper',
          courseName: defaultCourse,
          courseModuleName: defaultMod,
          exerciseFilePath: '',
          exerciseTitle: '',
          translations: initialTranslations
        }
      ]
    };

    setMaterials(prev => [...prev, newMat]);
    setActiveMaterial(newMat);
    setCurrentPageIndex(0);
    setEditingPage(newMat.pages[0]);
    setViewMode('editor');
    handleSaveMaterial(newMat);

    // If currently in a non-English language, immediately run AI translation on the newly created material
    if (selectedLanguage !== 'en') {
      translateMaterialPagesWithAI(newMat, selectedLanguage, false);
    }
  };

  const handleAddNewPage = () => {
    const newPageNum = activeMaterial.pages.length + 1;
    const initialTitle = `Page ${newPageNum}: New Topic Header`;
    const initialContent = 'Paste your course material text, lecture notes, or key summaries here...';
    const initialCaption = 'Illustration Caption';

    const initialTranslations: Record<string, any> = {};
    if (selectedLanguage !== 'en') {
      initialTranslations[selectedLanguage] = {
        title: autoTranslateText(initialTitle, selectedLanguage),
        subtitle: '',
        content: autoTranslateText(initialContent, selectedLanguage),
        calloutText: '',
        imageCaption: autoTranslateText(initialCaption, selectedLanguage),
        secondaryImageCaption: '',
        videoCaption: ''
      };
    }

    const effectiveCourse = editingPage?.courseName || activeMaterial?.courseName || activeMaterial?.title || 'Diploma in Production Art Engineer';

    const newPage: FlipbookPage = {
      id: `p_${Date.now()}`,
      pageNumber: newPageNum,
      title: initialTitle,
      subtitle: '',
      content: initialContent,
      layoutStyle: 'grid-2x2',
      mediaType: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      imageCaption: initialCaption,
      calloutText: '',
      bgTheme: 'classic-paper',
      courseName: effectiveCourse,
      courseModuleName: editingPage?.courseModuleName || activeMaterial?.pages?.[0]?.courseModuleName || '',
      courseModuleId: '',
      exerciseFilePath: '',
      exerciseTitle: '',
      translations: initialTranslations
    };

    const updatedPages = [...activeMaterial.pages, newPage];
    const updatedMat = { ...activeMaterial, pages: updatedPages, title: effectiveCourse, courseName: effectiveCourse };
    setActiveMaterial(updatedMat);
    setCurrentPageIndex(updatedPages.length - 1);
    setEditingPage(newPage);
    handleSaveMaterial(updatedMat);

    // If currently in a non-English language, trigger translation for the new page immediately
    if (selectedLanguage !== 'en') {
      translateMaterialPagesWithAI(updatedMat, selectedLanguage, false);
    }
  };

  const handleUpdatePage = (updatedPage: FlipbookPage) => {
    const pageWithEditFlag: FlipbookPage = {
      ...updatedPage,
      isCustomEdited: true,
    };

    if (selectedLanguage !== 'en') {
      pageWithEditFlag.translations = {
        ...(updatedPage.translations || {}),
        [selectedLanguage]: {
          title: updatedPage.title,
          subtitle: updatedPage.subtitle,
          content: updatedPage.content,
          calloutText: updatedPage.calloutText,
          imageCaption: updatedPage.imageCaption,
          secondaryImageCaption: updatedPage.secondaryImageCaption,
          videoCaption: updatedPage.videoCaption,
          videoTranscription: updatedPage.videoTranscription
        }
      };
    }

    const updatedPages = activeMaterial.pages.map(p => p.id === updatedPage.id ? pageWithEditFlag : p);
    const updatedMat = { ...activeMaterial, pages: updatedPages };
    setActiveMaterial(updatedMat);
    // Persist synchronously to state & backup
    setMaterials(prev => prev.map(m => m.id === updatedMat.id ? updatedMat : m));
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

  // Page Swapping / Reordering Helper
  const handleSwapPages = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx < 0 ||
      fromIdx >= activeMaterial.pages.length ||
      toIdx < 0 ||
      toIdx >= activeMaterial.pages.length ||
      fromIdx === toIdx
    ) {
      return;
    }
    const pagesCopy = [...activeMaterial.pages];
    const temp = pagesCopy[fromIdx];
    pagesCopy[fromIdx] = pagesCopy[toIdx];
    pagesCopy[toIdx] = temp;

    // Renumber pages sequentially
    const renumbered = pagesCopy.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    const updatedMat = { ...activeMaterial, pages: renumbered };
    setActiveMaterial(updatedMat);
    setCurrentPageIndex(toIdx);
    setEditingPage(renumbered[toIdx]);
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

  const currentCourseName = displayPage.courseName || activeMaterial.courseName || (selectedCourseFilter !== 'All Course Titles' && selectedCourseFilter !== 'All Assigned Courses' ? selectedCourseFilter : 'Course Title');
  const currentModuleName = displayPage.courseModuleName || (selectedModuleFilter !== 'All Modules' ? selectedModuleFilter : 'Module Content');

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

          <button
            onClick={() => setViewMode('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'settings'
                ? 'bg-slate-700 text-white shadow-md shadow-slate-700/40 ring-1 ring-slate-500'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Studio Settings & Preferences"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Settings</span>
          </button>
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

          {/* Native Language Selector & Quick Translate Action */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1 gap-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 px-2 py-0.5">
              <Languages className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Native Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setSelectedLanguage(newLang);
                  if (newLang !== 'en' && activeMaterial) {
                    translateMaterialPagesWithAI(activeMaterial, newLang, false);
                  }
                }}
                className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
              >
                {availableLanguages.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedLanguage !== 'en' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAutoTranslateCurrentPage(selectedLanguage)}
                  disabled={isTranslating}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase transition flex items-center gap-1 cursor-pointer border ${
                    isTranslating
                      ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-wait'
                      : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-amber-500/40 active:scale-95'
                  }`}
                  title="Translate ONLY the currently viewed page using Gemini AI"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>Translate Page</span>
                </button>

                <button
                  onClick={() => handleAutoTranslateAll(selectedLanguage, true)}
                  disabled={isTranslating}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase transition flex items-center gap-1 cursor-pointer shadow-md ${
                    isTranslating
                      ? 'bg-amber-600/60 text-amber-200 cursor-wait'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 active:scale-95'
                  }`}
                  title="Translate all pages in batches into selected language using Gemini AI"
                >
                  <Sparkles className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">{isTranslating ? 'Translating...' : 'Translate All'}</span>
                </button>
              </div>
            )}
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

      {/* Select Filter Course Title & Filter Module Bar (Same as Free ChatGPT Video & Speech Translator) */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md z-30">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-200 uppercase tracking-wider">
            Select Course Title & Module
          </span>
          {isStudent && studentAssignedTitle && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold hidden sm:inline">
              ⭐ Your Assigned Course: {studentAssignedTitle}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-4xl">
          {/* Select Course Title */}
          <div className="flex-1 min-w-[210px] flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Course Title:</span>
            <select
              value={selectedCourseFilter}
              onChange={(e) => {
                const newCourse = e.target.value;
                setSelectedCourseFilter(newCourse);
                setSelectedModuleFilter('All Modules');
                if (newCourse !== 'All Course Titles' && newCourse !== 'All Assigned Courses') {
                  const match = materials.find(m => {
                    const matCourse = m.courseName || formatCourseName(m.courseCategory);
                    return matCourse === newCourse ||
                      matCourse.toLowerCase().includes(newCourse.toLowerCase()) ||
                      newCourse.toLowerCase().includes(matCourse.toLowerCase()) ||
                      m.pages.some(p => p.courseName === newCourse || (p.courseName && p.courseName.toLowerCase().includes(newCourse.toLowerCase())));
                  });
                  if (match) {
                    setActiveMaterial(match);
                    setCurrentPageIndex(0);
                  }
                }
              }}
              className="w-full bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer truncate"
            >
              {allCourseTitles.map((title) => (
                <option key={title} value={title} className="bg-slate-900 text-slate-200">
                  {title}{title === studentAssignedTitle ? ' (⭐ Your Assigned Course)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Module */}
          <div className="flex-1 min-w-[190px] flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Filter Module:</span>
            <select
              value={selectedModuleFilter}
              onChange={(e) => {
                const newMod = e.target.value;
                setSelectedModuleFilter(newMod);
                if (newMod !== 'All Modules') {
                  const match = materials.find(m => 
                    m.pages.some(p => p.courseModuleName === newMod || (p.courseModuleName && (
                      p.courseModuleName.toLowerCase().includes(newMod.toLowerCase()) ||
                      newMod.toLowerCase().includes(p.courseModuleName.toLowerCase())
                    )))
                  );
                  if (match) {
                    setActiveMaterial(match);
                    const pIdx = match.pages.findIndex(p => p.courseModuleName === newMod || (p.courseModuleName && (
                      p.courseModuleName.toLowerCase().includes(newMod.toLowerCase()) ||
                      newMod.toLowerCase().includes(p.courseModuleName.toLowerCase())
                    )));
                    setCurrentPageIndex(pIdx >= 0 ? pIdx : 0);
                  }
                }
              }}
              className="w-full bg-transparent text-xs font-bold text-blue-300 focus:outline-none cursor-pointer truncate"
            >
              {availableModuleOptions.map((mod) => (
                <option key={mod} value={mod} className="bg-slate-900 text-slate-200">
                  {mod}
                </option>
              ))}
            </select>
          </div>

          {/* Select Interactive E-Book / PPT Material */}
          <div className="flex-1 min-w-[210px] flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 shrink-0">E-Book:</span>
            <select
              value={activeMaterial.id}
              onChange={(e) => {
                const found = materials.find(m => m.id === e.target.value);
                if (found) {
                  setActiveMaterial(found);
                  setCurrentPageIndex(0);
                }
              }}
              className="w-full bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer truncate"
            >
              {filteredMaterials.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.courseName || m.title || 'Diploma in Production Art Engineer'}
                </option>
              ))}
              {filteredMaterials.length === 0 && (
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  (No E-Books matching filter)
                </option>
              )}
            </select>
            {(isAdmin || isElevated || user?.role === 'faculty') && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleCreateNewMaterial}
                  title="Create New E-Book Material"
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New</span>
                </button>
                {materials.length > 0 && (
                  <button
                    onClick={() => handleDeleteMaterial(activeMaterial.id)}
                    title="Delete / Remove Current E-Book"
                    className="px-2 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 relative">

        {/* Translation Banner Loading Indicator */}
        {isTranslating && (
          <div className="absolute top-4 z-50 bg-amber-500 text-slate-950 text-xs font-black px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce border-2 border-slate-950">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{translationStatus || `Adapting Page Layout & Translating into ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage}...`}</span>
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
                  <div 
                    className="p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-900/10 dark:border-slate-800 relative min-h-[440px]"
                    style={{ backgroundColor: displayPage.pageBackgroundColor || undefined }}
                  >
                    
                    {/* Clean Top Header & Page Counter */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 pb-1 border-b border-amber-900/10 dark:border-slate-800/60 text-slate-400">
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 tracking-wide uppercase flex items-center gap-1.5 truncate">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          Endless School of Printing and Packaging
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                          Page {displayPage.pageNumber} of {activeMaterial.pages.length}
                        </span>
                      </div>

                      <h2 className={`${titleSizeClass} text-slate-900 dark:text-white mb-1.5`}>
                        {displayPage.title}
                      </h2>

                      {displayPage.subtitle && 
                       displayPage.subtitle.trim() !== '' && 
                       !displayPage.subtitle.includes('Key Concepts & Media') && 
                       !displayPage.subtitle.includes('Overview & Objectives') && (
                        <h3 className="text-xs md:text-sm font-bold text-amber-800 dark:text-amber-400 mb-4">
                          {displayPage.subtitle}
                        </h3>
                      )}

                      {/* Main Paragraph Body */}
                      <div 
                        className={`leading-relaxed space-y-3 ${displayPage.contentFontSize || fontSizeClass} ${displayPage.contentFontStyle || 'font-normal'} ${!displayPage.contentTextColor ? 'text-slate-800 dark:text-slate-200' : ''}`}
                        style={{
                          fontFamily: displayPage.contentFontFamily || undefined,
                          color: displayPage.contentTextColor || undefined,
                          textAlign: displayPage.contentTextAlign || undefined,
                        }}
                      >
                        {renderFormattedHtml(displayPage.content)}
                      </div>

                      {/* Downloadable Exercise File Path Card (Shown only if added by admin) */}
                      {Boolean(displayPage.exerciseFilePath && displayPage.exerciseFilePath.trim() !== '' && !displayPage.exerciseFilePath.includes('/exercise_files/module_')) && (
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

                      {/* Callout Box (Shown only if added by admin) */}
                      {Boolean(
                        displayPage.calloutText && 
                        displayPage.calloutText.trim() !== '' && 
                        !isDefaultCalloutText(displayPage.calloutText) &&
                        !isDefaultCalloutText(currentPage.calloutText)
                      ) && (
                        <div className="mt-4 p-3.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border-l-4 border-amber-500 text-xs text-amber-950 dark:text-amber-200 font-medium shadow-sm flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold block text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                              {autoTranslateText('FACULTY TAKEAWAY NOTE', selectedLanguage)}
                            </span>
                            {displayPage.calloutText}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Footer Page Marker: Course & Module at bottom of book */}
                    <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-2 truncate max-w-[80%]" title={`${currentCourseName} - ${currentModuleName}`}>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate">📖 {currentCourseName || activeMaterial.title}</span>
                        {currentModuleName && (
                          <span className="text-amber-700 dark:text-amber-400 font-bold truncate">
                            • Module: {currentModuleName}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold shrink-0">{displayPage.pageNumber}</span>
                    </div>
                  </div>

                  {/* Right Side: Interactive Media & Embedded Video/Image or Grid Layout */}
                  <div 
                    className="p-6 md:p-8 flex flex-col justify-between relative min-h-[440px]"
                    style={{ backgroundColor: displayPage.pageBackgroundColor || undefined }}
                  >
                    
                    <div className="space-y-4">
                      
                      {/* Section Title */}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                          <Video className="w-3.5 h-3.5 text-amber-500" /> Interactive Media Component
                        </span>
                        <span>Layout: {displayPage.layoutStyle || 'split-left'}</span>
                      </div>

                      {/* IF LAYOUT IS 2-IMAGES GRID (Stacked Top & Bottom) */}
                      {(displayPage.layoutStyle === 'grid-right-2-images' || displayPage.layoutStyle === 'grid-2-images') ? (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-4">
                            {/* Image #1 (Top) */}
                            <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-md flex flex-col justify-between">
                              <span className="text-[11px] font-extrabold uppercase text-amber-300 mb-1.5 flex items-center gap-1.5">
                                <Image className="w-3.5 h-3.5 text-amber-400" /> Image 1 (Top): {displayPage.imageCaption || displayPage.title || 'Primary Diagram'}
                              </span>
                              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 min-h-[220px] max-h-[360px] flex items-center justify-center p-2">
                                <SafeImage 
                                  src={displayPage.imageUrl} 
                                  alt={displayPage.imageCaption || displayPage.title || 'Image 1'} 
                                  title={displayPage.title}
                                  subtitle={displayPage.subtitle}
                                  caption={displayPage.imageCaption}
                                  className="max-h-[340px] w-full object-contain cursor-pointer" 
                                  onEnlarge={(src, alt) => setLightboxMedia({ src, alt, type: 'image' })}
                                />
                              </div>
                              {displayPage.imageCaption && (
                                <div className="flex items-center gap-1.5 text-left text-xs font-semibold text-amber-200 dark:text-amber-300 pt-1.5">
                                  <Link className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <ExternalLink className="w-3 h-3 text-amber-400/80 shrink-0" />
                                  <span>{displayPage.imageCaption}</span>
                                </div>
                              )}
                            </div>

                            {/* Image #2 (Bottom) */}
                            <div className="p-3 rounded-xl bg-slate-900/90 border border-blue-500/40 shadow-md flex flex-col justify-between">
                              <span className="text-[11px] font-extrabold uppercase text-blue-300 mb-1.5 flex items-center gap-1.5">
                                <Image className="w-3.5 h-3.5 text-blue-400" /> Image 2 (Bottom): {displayPage.secondaryImageCaption || 'Secondary Diagram'}
                              </span>
                              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 min-h-[220px] max-h-[360px] flex items-center justify-center p-2">
                                <SafeImage 
                                  src={displayPage.secondaryImageUrl || displayPage.imageUrl} 
                                  alt={displayPage.secondaryImageCaption || displayPage.title || 'Image 2'} 
                                  title={displayPage.title}
                                  subtitle={displayPage.subtitle}
                                  caption={displayPage.secondaryImageCaption}
                                  className="max-h-[340px] w-full object-contain cursor-pointer" 
                                  onEnlarge={(src, alt) => setLightboxMedia({ src, alt, type: 'image' })}
                                />
                              </div>
                              {displayPage.secondaryImageCaption && (
                                <div className="flex items-center gap-1.5 text-left text-xs font-semibold text-blue-200 dark:text-blue-300 pt-1.5">
                                  <Link className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <ExternalLink className="w-3 h-3 text-blue-400/80 shrink-0" />
                                  <span>{displayPage.secondaryImageCaption}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (displayPage.layoutStyle === 'grid-2x2' || displayPage.layoutStyle === 'grid-bento') ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          
                          {/* Grid Tile 1: Video */}
                          {displayPage.videoUrl && (
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/40 shadow-sm flex flex-col justify-between">
                              <span className="text-[11px] font-bold uppercase text-purple-300 mb-1.5 flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-pink-400" /> Video Lesson
                              </span>
                              <div className="rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video min-h-[240px]">
                                {renderVideoPlayer(displayPage.videoUrl, displayPage.videoCaption, displayPage.videoTranscription, displayPage)}
                              </div>
                            </div>
                          )}

                          {/* Grid Tile 2: Image Diagram */}
                          {displayPage.imageUrl && (
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
                              <span className="text-[11px] font-bold uppercase text-amber-300 mb-1.5 flex items-center gap-1.5">
                                <Image className="w-3.5 h-3.5 text-amber-400" /> High-Res Technical Diagram
                              </span>
                              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 min-h-[240px] flex items-center justify-center p-2">
                                <SafeImage 
                                  src={displayPage.imageUrl} 
                                  alt={displayPage.imageCaption || displayPage.title || 'Diagram'} 
                                  title={displayPage.title}
                                  subtitle={displayPage.subtitle}
                                  caption={displayPage.imageCaption}
                                  className="max-h-[260px] w-full object-contain cursor-pointer" 
                                  onEnlarge={(src, alt) => setLightboxMedia({ src, alt, type: 'image' })}
                                />
                              </div>
                            </div>
                          )}

                          {/* Grid Tile 3: Exercise File Download (Shown only if added by admin) */}
                          {Boolean(displayPage.exerciseFilePath && displayPage.exerciseFilePath.trim() !== '' && !displayPage.exerciseFilePath.includes('/exercise_files/module_')) && (
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
                          
                          {/* Video Embed & Native Language Subtitles / Transcription */}
                          {displayPage.videoUrl && (
                            <div className="space-y-2.5">
                              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black aspect-video min-h-[280px] md:min-h-[340px] shadow-2xl group">
                                {renderVideoPlayer(displayPage.videoUrl, displayPage.videoCaption, displayPage.videoTranscription, displayPage)}
                              </div>

                              {/* Native Subtitles & Caption Control Bar */}
                              <div className="p-3 bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-xl space-y-2 shadow-sm text-white">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-amber-500/30">
                                      <Captions className="w-3 h-3 text-amber-400" />
                                      <span>Native Subtitles ({selectedLanguage.toUpperCase()})</span>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => setShowCcSubtitles(prev => !prev)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                        showCcSubtitles ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      <Subtitles className="w-3 h-3" />
                                      <span>{showCcSubtitles ? 'CC ON' : 'CC OFF'}</span>
                                    </button>

                                    <button
                                      onClick={() => setShowTranscriptionDrawer(prev => !prev)}
                                      className="px-2 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <FileAudio className="w-3 h-3 text-indigo-400" />
                                      <span>{showTranscriptionDrawer ? 'Hide Transcript' : 'Full Transcript'}</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Expandable Native Language Video Transcript Drawer */}
                                {showTranscriptionDrawer && (
                                  <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-indigo-500/40 space-y-2 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto">
                                    <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-sans font-bold text-indigo-300">
                                      <span className="flex items-center gap-1">
                                        <Languages className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Native Video Transcript ({SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage})</span>
                                      </span>
                                      <button
                                        onClick={() => handleAutoGenerateTranscription(displayPage)}
                                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
                                      >
                                        <Sparkles className="w-3 h-3" /> Regenerate
                                      </button>
                                    </div>

                                    <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-[11px]">
                                      {autoTranslateText(cleanSubtitleCueText(displayPage.videoTranscription || `[00:00] ${displayPage.title}\n[00:02] ${stripHtml(displayPage.content).slice(0, 120)}`), selectedLanguage)}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {displayPage.videoCaption && (
                                <div className="flex items-center gap-1.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
                                  <Link className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                                  <ExternalLink className="w-3 h-3 text-pink-400 shrink-0" />
                                  <span>{displayPage.videoCaption}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Image Preview - Big Size */}
                          {displayPage.imageUrl && (
                            <div className="space-y-2.5">
                              <div className="rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-900 min-h-[300px] md:min-h-[420px] max-h-[600px] flex items-center justify-center shadow-2xl p-2.5 relative group/imgcontainer">
                                <SafeImage
                                  src={displayPage.imageUrl}
                                  alt={displayPage.imageCaption || displayPage.title || 'Page Diagram'}
                                  title={displayPage.title}
                                  subtitle={displayPage.subtitle}
                                  caption={displayPage.imageCaption}
                                  className="max-h-[560px] w-full object-contain rounded-xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                                  onEnlarge={(src, alt) => setLightboxMedia({ src, alt, type: 'image' })}
                                />
                              </div>
                              {displayPage.imageCaption && (
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1 px-1">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Link className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span className="truncate">{displayPage.imageCaption}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setLightboxMedia({ src: displayPage.imageUrl!, alt: displayPage.imageCaption || displayPage.title || 'Diagram', type: 'image' })}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    <Maximize2 className="w-3 h-3" /> Enlarge
                                  </button>
                                </div>
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

                    {/* Right Footer Page Marker: Page Number, Module & Publisher at bottom */}
                    <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span className="font-mono font-bold">Page {displayPage.pageNumber}</span>
                      <div className="flex items-center gap-2 truncate text-right">
                        {currentModuleName && (
                          <span className="font-bold text-blue-700 dark:text-blue-400 truncate hidden sm:inline">
                            Module: {currentModuleName} •
                          </span>
                        )}
                        <span className="font-semibold text-slate-600 dark:text-slate-400 shrink-0">Endless School of Printing and Packaging</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              </AnimatePresence>

            </div>

            {/* Bottom Flipbook Navigation Controls & Thumbnails (Dynamic Responsive Scrolling for 16+ Pages) */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/95 backdrop-blur p-3 md:p-4 rounded-2xl border border-slate-800 shadow-xl">
              
              {/* Prev / First Page Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start shrink-0">
                <button
                  onClick={() => {
                    playPageTurnSound();
                    setCurrentPageIndex(0);
                  }}
                  disabled={currentPageIndex === 0}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed border border-slate-700 shadow-sm"
                  title="Jump to First Page (Page 1)"
                >
                  <ChevronsLeft className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">First</span>
                </button>

                <button
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0}
                  className="flex-1 md:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border border-slate-700 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 text-amber-400" />
                  <span>Previous</span>
                </button>
              </div>

              {/* Dynamic Scrolling Page Number Indicator Strip */}
              <div className="flex items-center gap-1.5 w-full md:w-auto justify-center max-w-full overflow-hidden px-1 py-1">
                {/* Scroll Left Quick Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (paginationContainerRef.current) {
                      paginationContainerRef.current.scrollBy({ left: -140, behavior: 'smooth' });
                    }
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition shrink-0 cursor-pointer border border-slate-700/80"
                  title="Scroll Page Buttons Left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Horizontally Scrollable Page Buttons with Auto-Centering for All 16+ Pages */}
                <div
                  ref={paginationContainerRef}
                  className="flex items-center gap-1.5 overflow-x-auto max-w-[260px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[560px] py-1 px-1.5 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {activeMaterial.pages.map((p, idx) => (
                    <button
                      key={p.id}
                      ref={(el) => { pageButtonRefs.current[idx] = el; }}
                      onClick={() => {
                        playPageTurnSound();
                        setCurrentPageIndex(idx);
                      }}
                      className={`h-8 min-w-[34px] px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer ${
                        currentPageIndex === idx
                          ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                      }`}
                      title={`Jump to Page ${idx + 1}: ${p.title}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Scroll Right Quick Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (paginationContainerRef.current) {
                      paginationContainerRef.current.scrollBy({ left: 140, behavior: 'smooth' });
                    }
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition shrink-0 cursor-pointer border border-slate-700/80"
                  title="Scroll Page Buttons Right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Page Counter Badge */}
                <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 shrink-0 hidden sm:inline-block">
                  Page {currentPageIndex + 1} of {activeMaterial.pages.length}
                </span>
              </div>

              {/* Next / Last Page Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0">
                <button
                  onClick={handleNextPage}
                  disabled={currentPageIndex === activeMaterial.pages.length - 1}
                  className="flex-1 md:flex-initial px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>

                <button
                  onClick={() => {
                    playPageTurnSound();
                    setCurrentPageIndex(activeMaterial.pages.length - 1);
                  }}
                  disabled={currentPageIndex === activeMaterial.pages.length - 1}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed border border-slate-700 shadow-sm"
                  title={`Jump to Last Page (Page ${activeMaterial.pages.length})`}
                >
                  <span className="hidden sm:inline">Last</span>
                  <ChevronsRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>

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
                  <div 
                    className={`leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800 ${displayPage.contentFontSize || 'text-sm md:text-base'} ${displayPage.contentFontStyle || 'font-normal'} ${!displayPage.contentTextColor ? 'text-slate-300' : ''}`}
                    style={{
                      fontFamily: displayPage.contentFontFamily || undefined,
                      color: displayPage.contentTextColor || undefined,
                    }}
                  >
                    {renderFormattedHtml(displayPage.content)}
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
                    <div className="rounded-xl overflow-hidden border-2 border-purple-500/50 bg-black aspect-video min-h-[280px] shadow-xl">
                      {renderVideoPlayer(displayPage.videoUrl, displayPage.videoCaption, displayPage.videoTranscription, displayPage)}
                    </div>
                  ) : displayPage.imageUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[280px] max-h-[460px] flex items-center justify-center p-3">
                      <SafeImage 
                        src={displayPage.imageUrl} 
                        alt={displayPage.title || 'Slide Visual'} 
                        title={displayPage.title}
                        subtitle={displayPage.subtitle}
                        caption={displayPage.imageCaption}
                        className="max-h-[420px] w-full object-contain rounded-lg cursor-pointer" 
                        onEnlarge={(src, alt) => setLightboxMedia({ src, alt, type: 'image' })}
                      />
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
              {activeMaterial.pages.map((p, idx) => {
                const translatedP = getTranslatedPage(p, selectedLanguage);
                return (
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

                      <h3 className="text-sm font-bold text-white line-clamp-1">{translatedP.title}</h3>
                      {translatedP.subtitle && <p className="text-xs text-slate-400 line-clamp-1">{translatedP.subtitle}</p>}
                      
                      <div className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                        {renderFormattedHtml(translatedP.content)}
                      </div>
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
              );
            })}
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
              
              <div className="flex flex-wrap items-center gap-2">
                {(isAdmin || isElevated || user?.role === 'faculty') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMaterial(activeMaterial.id)}
                    className="px-3.5 py-2 bg-rose-700/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/30 border border-rose-600/50"
                    title="Remove / Delete this E-Book permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete E-Book</span>
                  </button>
                )}

                <button
                  onClick={handleCreateNewMaterial}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-900/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New E-Book</span>
                </button>

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
                  <span>Course (E-Book Title): {activeMaterial.title || editingPage.courseName || activeMaterial.courseName || 'Diploma in Production Art Engineer'}</span>
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/40 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                  <BookMarked className="w-3.5 h-3.5 text-blue-400" />
                  <span>Module: {editingPage.courseModuleName || (selectedModuleFilter !== 'All Modules' ? selectedModuleFilter : 'Not Set')}</span>
                </span>
              </div>
            </div>

            {/* Page Selector & Reorder/Swap Tabs */}
            <div 
              ref={editorTabsContainerRef}
              className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scroll-smooth"
            >
              <span className="text-[11px] font-black uppercase text-amber-400 shrink-0 flex items-center gap-1">
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" /> Page Tabs & Order:
              </span>
              {activeMaterial.pages.map((p, idx) => (
                <div
                  key={p.id}
                  ref={(el) => { editorTabRefs.current[idx] = el; }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                    editingPage.id === p.id
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <button
                    onClick={() => {
                      setCurrentPageIndex(idx);
                      setEditingPage(p);
                    }}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <span>Page {p.pageNumber}</span>
                  </button>

                  {/* Move Left / Swap Up */}
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwapPages(idx, idx - 1);
                      }}
                      className="hover:text-amber-300 ml-0.5 p-0.5 rounded transition cursor-pointer text-slate-400 hover:bg-blue-700/60"
                      title={`Swap Page ${p.pageNumber} with Page ${p.pageNumber - 1}`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Move Right / Swap Down */}
                  {idx < activeMaterial.pages.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwapPages(idx, idx + 1);
                      }}
                      className="hover:text-amber-300 p-0.5 rounded transition cursor-pointer text-slate-400 hover:bg-blue-700/60"
                      title={`Swap Page ${p.pageNumber} with Page ${p.pageNumber + 1}`}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Page */}
                  {activeMaterial.pages.length > 1 && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(p.id);
                      }}
                      className="hover:text-red-300 ml-1 cursor-pointer p-0.5 text-slate-400"
                      title="Delete Page"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Direct Page Swap Dropdown Tool */}
              {activeMaterial.pages.length > 1 && (
                <div className="ml-auto flex items-center gap-1.5 shrink-0 bg-slate-900 border border-slate-700 px-2 py-1 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-300 uppercase">Swap Page {currentPageIndex + 1} with:</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const targetIdx = parseInt(e.target.value, 10);
                      if (!isNaN(targetIdx)) {
                        handleSwapPages(currentPageIndex, targetIdx);
                      }
                    }}
                    className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="" disabled>-- Select Target Page --</option>
                    {activeMaterial.pages.map((p, pIdx) => (
                      pIdx !== currentPageIndex && (
                        <option key={p.id} value={pIdx}>
                          Page {p.pageNumber}: {stripHtml(p.title).slice(0, 20)}...
                        </option>
                      )
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Editor Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Course Name, Module, and Text Inputs */}
              <div className="space-y-4">

                {/* Course Name Selection & Automatic E-Book Title Assignment */}
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-2xl space-y-2.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Course Title (E-Book Name)</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/50">
                      Matches Course
                    </span>
                  </label>
                  
                  {/* Quick Select from Configured Courses */}
                  <select
                    value={configuredCourses.some(c => c.title === (activeMaterial.title || editingPage.courseName)) ? (activeMaterial.title || editingPage.courseName) : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        handleUpdateCourseTitle(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-amber-800/60 rounded-xl px-3 py-2 text-xs font-bold text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="custom">-- Select Configured Course or Type Below --</option>
                    {configuredCourses.map(c => (
                      <option key={c.courseId} value={c.title} className="bg-slate-900">
                        {c.title}
                      </option>
                    ))}
                    {allCourseTitles
                      .filter(t => t !== 'All Course Titles' && t !== 'All Assigned Courses' && !configuredCourses.some(c => c.title === t))
                      .map(t => (
                        <option key={t} value={t} className="bg-slate-900">
                          {t}
                        </option>
                      ))}
                  </select>

                  {/* Direct Editable Text Input for Course Title / E-Book Name */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-amber-400/80">Type or Edit Course Title (updates E-Book title instantly):</span>
                    <input
                      type="text"
                      value={activeMaterial.title || editingPage.courseName || activeMaterial.courseName || ''}
                      onChange={(e) => {
                        handleUpdateCourseTitle(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-amber-800/60 rounded-xl px-3 py-2 text-xs font-bold text-amber-200 focus:outline-none focus:border-amber-400 placeholder:text-amber-700/60"
                      placeholder="e.g. Diploma in Production Art Engineer"
                    />
                  </div>
                </div>

                {/* Module Name Selector and Custom Module Input */}
                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-blue-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <BookMarked className="w-4 h-4 text-blue-400" />
                      <span>Module Name & Code</span>
                    </span>
                    <span className="text-[10px] text-blue-400 font-medium">{availableModuleOptions.length - 1} Modules</span>
                  </label>
                  
                  <select
                    value={availableModuleOptions.includes(editingPage.courseModuleName || '') ? (editingPage.courseModuleName || '') : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        const updated = { 
                          ...editingPage, 
                          courseModuleName: e.target.value
                        };
                        setEditingPage(updated);
                        handleUpdatePage(updated);
                      }
                    }}
                    className="w-full bg-slate-950 border border-blue-800/60 rounded-xl px-3 py-2 text-xs text-blue-200 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="custom">-- Custom Module Title --</option>
                    {availableModuleOptions.filter(m => m !== 'All Modules').map(m => (
                      <option key={m} value={m} className="bg-slate-900">
                        {m}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={editingPage.courseModuleName || ''}
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

                {/* PAGE BACKGROUND COLOR & TEXT STYLING CUSTOMIZATION PANEL */}
                <div className="p-3.5 bg-slate-950 border border-amber-500/40 rounded-2xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span>Page Background Color & Text Styling</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-extrabold bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800/60">
                      Active Page #{editingPage.pageNumber}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Background Color Swatches & Picker */}
                    <div>
                      <label className="text-[11px] font-extrabold text-amber-200 block mb-1.5">
                        Background Color Swatches & Custom Picker:
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { name: 'Paper', hex: '#fdfbf7', darkText: true },
                          { name: 'White', hex: '#ffffff', darkText: true },
                          { name: 'Cream', hex: '#fef3c7', darkText: true },
                          { name: 'Slate', hex: '#f1f5f9', darkText: true },
                          { name: 'Dark', hex: '#0f172a', darkText: false },
                          { name: 'Black', hex: '#18181b', darkText: false },
                          { name: 'Emerald', hex: '#022c22', darkText: false },
                          { name: 'Indigo', hex: '#1e1b4b', darkText: false },
                        ].map((swatch) => {
                          const isActive = (editingPage.pageBackgroundColor || '#fdfbf7').toLowerCase() === swatch.hex.toLowerCase();
                          return (
                            <button
                              key={swatch.name}
                              type="button"
                              onClick={() => {
                                const updated = { ...editingPage, pageBackgroundColor: swatch.hex };
                                setEditingPage(updated);
                                handleUpdatePage(updated);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                isActive
                                  ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-md scale-105'
                                  : 'border-slate-700 hover:border-amber-400/60'
                              }`}
                              style={{
                                backgroundColor: swatch.hex,
                                color: swatch.darkText ? '#0f172a' : '#f8fafc',
                              }}
                              title={`Apply ${swatch.name} (${swatch.hex}) background`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 inline-block"
                                style={{ backgroundColor: swatch.hex }}
                              />
                              <span>{swatch.name}</span>
                            </button>
                          );
                        })}

                        {/* Custom Color Input */}
                        <label
                          className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold text-amber-300"
                          title="Pick custom hex background color"
                        >
                          <input
                            type="color"
                            value={editingPage.pageBackgroundColor || '#fdfbf7'}
                            onChange={(e) => {
                              const updated = { ...editingPage, pageBackgroundColor: e.target.value };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <span>Custom Hex</span>
                        </label>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <label className="text-[11px] font-extrabold text-amber-200 block mb-1">
                        Page Text Alignment:
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => {
                              const updated = { ...editingPage, contentTextAlign: align };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className={`py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                              (editingPage.contentTextAlign || 'left') === align
                                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative">
                  {/* Editor Header & Mode Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Course Content / Lecture Paragraphs</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {/* Editor Mode Tabs */}
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => setEditorTab('wysiwyg')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            editorTab === 'wysiwyg'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>Visual Editor</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorTab('code')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            editorTab === 'code'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>Code View</span>
                        </button>
                      </div>

                      {/* Clean Cluttered HTML Tags Button */}
                      <button
                        type="button"
                        onClick={handleCleanAllHtmlTags}
                        className="text-[11px] bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 transition cursor-pointer"
                        title="Remove duplicate nested tags and clean up cluttered HTML code"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Fix Cluttered Tags</span>
                      </button>
                    </div>
                  </div>

                  {/* SELECTION FORMATTING INSTRUCTION & TOAST BANNER */}
                  {selectionToast ? (
                    <div className="flex items-center justify-between gap-2 text-xs bg-amber-950/90 border border-amber-500/60 px-3.5 py-2 rounded-xl text-amber-200 font-bold animate-in fade-in slide-in-from-top-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{selectionToast}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectionToast('')}
                        className="text-slate-400 hover:text-white transition p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-blue-950/60 border border-blue-500/30 px-3 py-1.5 rounded-xl text-blue-300">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Highlight text in editor to format ONLY that text! Use the Floating Tool anywhere on screen.</span>
                      </span>
                      <button
                        type="button"
                        onClick={clearSelectionFormatting}
                        onMouseDown={(e) => e.preventDefault()}
                        className="text-[10px] bg-slate-900 border border-slate-700 hover:border-amber-400 text-amber-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0"
                        title="Remove inline style tags from selected text or entire box"
                      >
                        <Eraser className="w-3 h-3" />
                        <span>Clear Selection Format</span>
                      </button>
                    </div>
                  )}

                  {/* TOOLBAR PART 1: INLINE SELECTION STYLES (BOLD, ITALIC, UNDERLINE, HIGHLIGHT) */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Selection Format:</span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormatToSelection('<b>', '</b>')}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-white font-black text-xs transition cursor-pointer flex items-center gap-1"
                      title="Bold Selected Text (Toggle)"
                    >
                      <Bold className="w-3.5 h-3.5 text-blue-400" />
                      <span>Bold</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormatToSelection('<i>', '</i>')}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-white font-semibold italic text-xs transition cursor-pointer flex items-center gap-1"
                      title="Italic Selected Text (Toggle)"
                    >
                      <Italic className="w-3.5 h-3.5 text-blue-400" />
                      <span>Italic</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormatToSelection('<u>', '</u>')}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-white font-semibold underline text-xs transition cursor-pointer flex items-center gap-1"
                      title="Underline Selected Text (Toggle)"
                    >
                      <Underline className="w-3.5 h-3.5 text-blue-400" />
                      <span>Underline</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormatToSelection('normal', '')}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-400 rounded-lg text-slate-200 font-normal text-xs transition cursor-pointer flex items-center gap-1"
                      title="Set Selected Text to Normal (Regular Weight & Style)"
                    >
                      <Type className="w-3.5 h-3.5 text-slate-400" />
                      <span>Normal</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormatToSelection('<mark style="background-color: #fef08a; color: #1e293b; padding: 1px 4px; border-radius: 4px;">', '</mark>')}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-yellow-500 rounded-lg text-yellow-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                      title="Highlight Yellow"
                    >
                      <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Highlight</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={removeHighlightFromSelection}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-amber-500/80 rounded-lg text-amber-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                      title="Remove Highlight from selected text or entire page"
                    >
                      <Eraser className="w-3.5 h-3.5 text-amber-400" />
                      <span>Remove Highlight</span>
                    </button>
                  </div>

                  {/* TOOLBAR PART 2: SELECTED TEXT FONT FAMILY & FONT SIZE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    {/* Selected Text Font Family */}
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 block mb-1 uppercase tracking-wider">Font Family (Selected Text Only)</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            applyFormatToSelection(`<span style="font-family: ${e.target.value}">`, '</span>');
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="" disabled>-- Apply Font to Highlighted Text --</option>
                        <option value="system-ui, -apple-system, sans-serif">Sans-Serif (Modern Clean)</option>
                        <option value='Georgia, Cambria, "Times New Roman", serif'>Serif (Editorial / Classic)</option>
                        <option value="ui-monospace, SFMono-Regular, Consolas, monospace">Monospace (Code / Technical)</option>
                        <option value='"Playfair Display", Georgia, serif'>Playfair Display (Luxury)</option>
                        <option value='"Plus Jakarta Sans", sans-serif'>Plus Jakarta Sans (Corporate)</option>
                        <option value='cursive, "Comic Sans MS", sans-serif'>Handwritten / Casual</option>
                      </select>
                    </div>

                    {/* Selected Text Font Size */}
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 block mb-1 uppercase tracking-wider">Font Size (Selected Text Only)</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            applyFormatToSelection(`<span style="font-size: ${e.target.value}">`, '</span>');
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="" disabled>-- Apply Size to Highlighted Text --</option>
                        <option value="11px">Extra Small (11px)</option>
                        <option value="13px">Small (13px)</option>
                        <option value="16px">Medium (16px)</option>
                        <option value="18px">Large (18px)</option>
                        <option value="22px">Extra Large (22px)</option>
                        <option value="28px">Jumbo (28px)</option>
                      </select>
                    </div>
                  </div>

                  {/* TOOLBAR PART 3: TEXT COLOR FOR SELECTED TEXT */}
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Text Color (Selected Text Only)</label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { label: 'White', color: '#ffffff' },
                        { label: 'Slate', color: '#cbd5e1' },
                        { label: 'Amber Yellow', color: '#fbbf24' },
                        { label: 'Emerald Green', color: '#34d399' },
                        { label: 'Sky Blue', color: '#60a5fa' },
                        { label: 'Indigo', color: '#a5b4fc' },
                        { label: 'Rose Pink', color: '#f472b6' },
                        { label: 'Crimson Red', color: '#f87171' },
                        { label: 'Deep Dark', color: '#0f172a' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          title={`Format selected text in ${preset.label}`}
                          onClick={() => applyFormatToSelection(`<span style="color: ${preset.color}">`, '</span>')}
                          className="px-2 py-1 rounded-md text-[10px] font-bold border border-slate-800 bg-slate-950 hover:border-blue-400 text-slate-300 transition cursor-pointer flex items-center gap-1"
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full border border-slate-700 shrink-0 inline-block" 
                            style={{ backgroundColor: preset.color }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}

                      {/* Custom Hex Color for Selected Text */}
                      <label 
                        className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-blue-500 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold text-slate-300"
                      >
                        <span>Custom:</span>
                        <input
                          type="color"
                          defaultValue="#fbbf24"
                          onChange={(e) => applyFormatToSelection(`<span style="color: ${e.target.value}">`, '</span>')}
                          className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                      </label>
                    </div>
                  </div>

                  {/* BASE PAGE DEFAULT THEME STYLES (FALLBACK FOR UNSTYLED PORTIONS) */}
                  <details className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-xs group">
                    <summary className="font-bold text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-between text-[11px] uppercase tracking-wider">
                      <span>Base Page Default Theme Styles (Fallback)</span>
                      <span className="text-[10px] text-blue-400 font-normal">Click to expand/collapse</span>
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-2.5 pt-2 border-t border-slate-800">
                      {/* Text Alignment Settings */}
                      <div>
                        <label className="text-[10px] text-amber-300 font-extrabold uppercase block mb-1">Page Text Alignment</label>
                        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...editingPage, contentTextAlign: 'left' as const };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className={`p-1.5 rounded text-[10px] font-bold transition flex justify-center items-center cursor-pointer ${
                              (editingPage.contentTextAlign || 'left') === 'left' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Align Text Left"
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...editingPage, contentTextAlign: 'center' as const };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className={`p-1.5 rounded text-[10px] font-bold transition flex justify-center items-center cursor-pointer ${
                              editingPage.contentTextAlign === 'center' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Align Text Center"
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...editingPage, contentTextAlign: 'right' as const };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className={`p-1.5 rounded text-[10px] font-bold transition flex justify-center items-center cursor-pointer ${
                              editingPage.contentTextAlign === 'right' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Align Text Right"
                          >
                            Right
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...editingPage, contentTextAlign: 'justify' as const };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className={`p-1.5 rounded text-[10px] font-bold transition flex justify-center items-center cursor-pointer ${
                              editingPage.contentTextAlign === 'justify' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Justify Text"
                          >
                            Justify
                          </button>
                        </div>
                      </div>

                      {/* Page Background Color Setting */}
                      <div>
                        <label className="text-[10px] text-amber-300 font-extrabold uppercase block mb-1">Page Background Color</label>
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                          <input
                            type="color"
                            value={editingPage.pageBackgroundColor || '#fdfbf7'}
                            onChange={(e) => {
                              const updated = { ...editingPage, pageBackgroundColor: e.target.value };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                            title="Select Custom Page Background Color"
                          />
                          <select
                            value={editingPage.pageBackgroundColor || '#fdfbf7'}
                            onChange={(e) => {
                              const updated = { ...editingPage, pageBackgroundColor: e.target.value };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className="w-full bg-slate-900 text-white text-[11px] rounded px-1.5 py-1 font-bold focus:outline-none"
                          >
                            <option value="#fdfbf7">Classic Paper (#fdfbf7)</option>
                            <option value="#ffffff">Pure White (#ffffff)</option>
                            <option value="#fef3c7">Vintage Cream (#fef3c7)</option>
                            <option value="#f1f5f9">Slate Gray (#f1f5f9)</option>
                            <option value="#0f172a">Night Dark (#0f172a)</option>
                            <option value="#18181b">Charcoal Black (#18181b)</option>
                            <option value="#022c22">Deep Emerald (#022c22)</option>
                            <option value="#1e1b4b">Royal Indigo (#1e1b4b)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Base Font Family</label>
                        <select
                          value={editingPage.contentFontFamily || 'system-ui, -apple-system, sans-serif'}
                          onChange={(e) => {
                            const updated = { ...editingPage, contentFontFamily: e.target.value };
                            setEditingPage(updated);
                            handleUpdatePage(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                        >
                          <option value="system-ui, -apple-system, sans-serif">Sans-Serif (Modern)</option>
                          <option value='Georgia, Cambria, "Times New Roman", serif'>Serif (Classic)</option>
                          <option value="ui-monospace, SFMono-Regular, Consolas, monospace">Monospace</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Base Font Size & Weight</label>
                        <div className="grid grid-cols-2 gap-1">
                          <select
                            value={editingPage.contentFontSize || 'text-sm'}
                            onChange={(e) => {
                              const updated = { ...editingPage, contentFontSize: e.target.value };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="text-xs">Extra Small (12px)</option>
                            <option value="text-sm">Small (14px)</option>
                            <option value="text-base">Medium (16px)</option>
                            <option value="text-lg">Large (18px)</option>
                          </select>

                          <select
                            value={editingPage.contentFontStyle || 'font-normal'}
                            onChange={(e) => {
                              const updated = { ...editingPage, contentFontStyle: e.target.value };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="font-normal">Regular</option>
                            <option value="font-medium">Medium</option>
                            <option value="font-bold">Bold</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* MAIN EDITOR AREA: VISUAL WYSIWYG vs CODE VIEW */}
                  {editorTab === 'wysiwyg' ? (
                    <div
                      ref={wysiwygRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        const html = e.currentTarget.innerHTML;
                        const cleaned = cleanNestedHtmlTags(html);
                        const updated = { ...editingPage, content: cleaned };
                        setEditingPage(updated);
                        handleUpdatePage(updated);
                      }}
                      onMouseUp={handleEditorTextSelection}
                      onKeyUp={handleEditorTextSelection}
                      onContextMenu={(e) => {
                        handleEditorTextSelection(e);
                      }}
                      style={{
                        fontFamily: editingPage.contentFontFamily || undefined,
                        color: editingPage.contentTextColor || undefined,
                        minHeight: '140px',
                      }}
                      className={`w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3.5 leading-relaxed focus:outline-none transition-all ${
                        editingPage.contentFontSize || 'text-xs'
                      } ${editingPage.contentFontStyle || 'font-normal'} ${!editingPage.contentTextColor ? 'text-slate-200' : ''}`}
                    />
                  ) : (
                    <textarea
                      ref={contentAreaRef}
                      rows={6}
                      value={cleanNestedHtmlTags(editingPage.content || '')}
                      onSelect={handleEditorTextSelection}
                      onMouseUp={handleEditorTextSelection}
                      onKeyUp={handleEditorTextSelection}
                      onContextMenu={(e) => {
                        handleEditorTextSelection(e);
                      }}
                      onChange={(e) => {
                        const updated = { ...editingPage, content: e.target.value };
                        setEditingPage(updated);
                        handleUpdatePage(updated);
                      }}
                      style={{
                        fontFamily: editingPage.contentFontFamily || undefined,
                        color: editingPage.contentTextColor || undefined,
                      }}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 leading-relaxed focus:outline-none focus:border-blue-500 transition-all font-mono text-xs text-amber-200`}
                      placeholder="Type or paste lecture text or HTML code here..."
                    />
                  )}

                  {/* FLOATING CONTEXTUAL SELECTION TOOLBAR OVERLAY (DRAGGABLE) */}
                  {floatingToolbar?.visible && (
                    <div
                      style={{
                        position: 'fixed',
                        left: `${floatingToolbar.x}px`,
                        top: `${floatingToolbar.y}px`,
                      }}
                      className="z-[9999] bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-2 max-w-[380px] sm:max-w-[500px] flex flex-wrap items-center gap-1.5 animate-in fade-in zoom-in-95 select-none"
                    >
                      {/* DRAGGABLE HEADER HANDLE */}
                      <div 
                        onMouseDown={handleStartDragToolbar}
                        className="flex items-center justify-between w-full pb-1 border-b border-slate-800 text-[10px] font-extrabold text-blue-400 uppercase tracking-wider px-1 cursor-grab active:cursor-grabbing hover:bg-slate-800/50 rounded-t-xl transition"
                        title="Click and drag to move toolbar anywhere on screen"
                      >
                        <span className="flex items-center gap-1 text-slate-300">
                          <GripVertical className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-blue-400">Moveable Tool Panel</span>
                          <span className="text-[9px] text-slate-400 font-normal ml-1">(Drag Header)</span>
                        </span>
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setFloatingToolbar(null)}
                          className="text-slate-400 hover:text-white transition cursor-pointer p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* BOLD, ITALIC, UNDERLINE, HIGHLIGHT */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormatToSelection('<b>', '</b>')}
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-white font-black text-xs transition cursor-pointer"
                          title="Bold Selected Text (Toggle)"
                        >
                          <Bold className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormatToSelection('<i>', '</i>')}
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-white font-semibold italic text-xs transition cursor-pointer"
                          title="Italic Selected Text (Toggle)"
                        >
                          <Italic className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormatToSelection('<u>', '</u>')}
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-white font-semibold underline text-xs transition cursor-pointer"
                          title="Underline Selected Text (Toggle)"
                        >
                          <Underline className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormatToSelection('normal', '')}
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-400 rounded-lg text-slate-200 text-xs transition cursor-pointer flex items-center gap-1"
                          title="Set Selected Text to Normal (Regular)"
                        >
                          <Type className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] hidden sm:inline font-normal">Normal</span>
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormatToSelection('<mark style="background-color: #fef08a; color: #1e293b; padding: 1px 4px; border-radius: 4px;">', '</mark>')}
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-yellow-500 rounded-lg text-yellow-300 text-xs transition cursor-pointer"
                          title="Highlight Yellow"
                        >
                          <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={removeHighlightFromSelection}
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-lg text-amber-300 text-xs transition cursor-pointer flex items-center gap-1"
                          title="Remove Highlight"
                        >
                          <Eraser className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] hidden sm:inline font-semibold">Unhighlight</span>
                        </button>
                      </div>

                      {/* FONT SIZE SELECTOR */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            applyFormatToSelection(`<span style="font-size: ${e.target.value}">`, '</span>');
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="" disabled>Size</option>
                        <option value="11px">11px</option>
                        <option value="13px">13px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                        <option value="22px">22px</option>
                        <option value="28px">28px</option>
                      </select>

                      {/* FONT FAMILY SELECTOR */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            applyFormatToSelection(`<span style="font-family: ${e.target.value}">`, '</span>');
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="" disabled>Font</option>
                        <option value="system-ui, sans-serif">Sans-Serif</option>
                        <option value='Georgia, serif'>Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value='"Playfair Display", serif'>Playfair</option>
                        <option value='"Plus Jakarta Sans", sans-serif'>Plus Jakarta</option>
                      </select>

                      {/* COLOR SWATCHES */}
                      <div className="flex items-center gap-1">
                        {[
                          { color: '#ffffff', title: 'White' },
                          { color: '#fbbf24', title: 'Yellow' },
                          { color: '#34d399', title: 'Green' },
                          { color: '#60a5fa', title: 'Blue' },
                          { color: '#f472b6', title: 'Pink' },
                          { color: '#f87171', title: 'Red' },
                        ].map(c => (
                          <button
                            key={c.color}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyFormatToSelection(`<span style="color: ${c.color}">`, '</span>')}
                            className="w-4 h-4 rounded-full border border-slate-700 hover:scale-110 transition cursor-pointer shrink-0"
                            style={{ backgroundColor: c.color }}
                            title={c.title}
                          />
                        ))}
                        <input
                          type="color"
                          defaultValue="#fbbf24"
                          onChange={(e) => applyFormatToSelection(`<span style="color: ${e.target.value}">`, '</span>')}
                          className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
                          title="Custom Color"
                        />
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={clearSelectionFormatting}
                          className="p-1 bg-amber-950/60 border border-amber-800/60 hover:border-amber-400 text-amber-300 rounded-md text-[10px] transition cursor-pointer flex items-center gap-1"
                          title="Clear Selection Formatting"
                        >
                          <Eraser className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleCleanAllHtmlTags}
                          className="p-1 bg-emerald-950/60 border border-emerald-800/60 hover:border-emerald-400 text-emerald-300 rounded-md text-[10px] transition cursor-pointer flex items-center gap-1"
                          title="Clean Cluttered Tags"
                        >
                          <Wand2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* LIVE TYPOGRAPHY PREVIEW CARD */}
                  {editingPage.content && (
                    <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center justify-between">
                        <span>Live Reader Preview (Formatted Output)</span>
                        <span className="text-emerald-400">Renders Inline Styles</span>
                      </span>
                      <div
                        className={`whitespace-pre-line leading-relaxed ${editingPage.contentFontSize || 'text-xs'} ${editingPage.contentFontStyle || 'font-normal'} ${!editingPage.contentTextColor ? 'text-slate-200' : ''}`}
                        style={{
                          fontFamily: editingPage.contentFontFamily || undefined,
                          color: editingPage.contentTextColor || undefined,
                        }}
                      >
                        {renderFormattedHtml(editingPage.content)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Video & Image File Upload Options & Layout Settings */}
              <div className="space-y-4">

                {/* MULTI-SYSTEM MEDIA SYNC & CUSTOM DOMAIN ID HUB */}
                <div className="p-3.5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-800/80 rounded-2xl space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-blue-200">Custom Domain Media & Multi-System Sync</h4>
                        <p className="text-[10px] text-slate-400">Ensures video and images load seamlessly on all students' and faculty's devices</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-700/60 rounded-md">
                      Multi-Device Ready
                    </span>
                  </div>

                  {/* Domain ID Base Address & Quick Actions */}
                  <div className="p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 gap-1 flex-wrap">
                      <span className="text-slate-400">Custom Domain ID:</span>
                      <span className="text-blue-300 font-bold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50 break-all select-all">
                        https://endlesssparkcreativehub.in/ebook-studio
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const base = 'https://endlesssparkcreativehub.in/ebook-studio/videos/';
                          const updated = { ...editingPage, videoUrl: editingPage.videoUrl?.startsWith('http') ? editingPage.videoUrl : `${base}lesson_video.mp4` };
                          setEditingPage(updated);
                          handleUpdatePage(updated);
                        }}
                        className="p-1.5 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-700/50 text-pink-300 rounded-lg transition text-left cursor-pointer flex items-center gap-1"
                        title="Fill Custom Domain Video URL"
                      >
                        <Video className="w-3 h-3 text-pink-400 shrink-0" />
                        <span className="truncate">Set Domain Video URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const base = 'https://endlesssparkcreativehub.in/ebook-studio/images/';
                          const updated = { ...editingPage, imageUrl: editingPage.imageUrl?.startsWith('http') ? editingPage.imageUrl : `${base}diagram_1.png` };
                          setEditingPage(updated);
                          handleUpdatePage(updated);
                        }}
                        className="p-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 text-amber-300 rounded-lg transition text-left cursor-pointer flex items-center gap-1"
                        title="Fill Custom Domain Image 1 URL"
                      >
                        <Image className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">Set Domain Image 1 URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const base = 'https://endlesssparkcreativehub.in/ebook-studio/images/';
                          const updated = { ...editingPage, secondaryImageUrl: editingPage.secondaryImageUrl?.startsWith('http') ? editingPage.secondaryImageUrl : `${base}diagram_2.png` };
                          setEditingPage(updated);
                          handleUpdatePage(updated);
                        }}
                        className="p-1.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-700/50 text-blue-300 rounded-lg transition text-left cursor-pointer flex items-center gap-1"
                        title="Fill Custom Domain Image 2 URL"
                      >
                        <Image className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">Set Domain Image 2 URL</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">
                      💡 <b>Cross-System Notice:</b> Videos hosted on your custom domain (<code className="text-blue-300">https://endlesssparkcreativehub.in/ebook-studio</code>) or cloud URLs (YouTube, Drive, Vimeo) display on <b>all client and student systems</b>. Local device uploads (<code className="text-amber-300">idb:</code>) stay in this browser only.
                    </p>
                  </div>
                </div>
                
                {/* VIDEO UPLOAD & EMBED SECTION */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-pink-400" />
                      <span>Video Lesson (Custom Domain URL / Cloud / Upload)</span>
                    </label>
                    {editingPage.videoUrl && (
                      <button
                        onClick={() => {
                          const updated = { ...editingPage, videoUrl: '', videoCaption: '', videoTranscription: '' };
                          setEditingPage(updated);
                          handleUpdatePage(updated);
                        }}
                        className="text-[11px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Remove Video
                      </button>
                    )}
                  </div>

                  {/* Video Media Source Badge */}
                  {editingPage.videoUrl && (
                    <div className="text-[10px] flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400">Source:</span>
                      {editingPage.videoUrl.startsWith('https://endlesssparkcreativehub.in') ? (
                        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-md font-bold flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Custom Domain ID (Multi-System Ready)
                        </span>
                      ) : editingPage.videoUrl.startsWith('http') ? (
                        <span className="px-2 py-0.5 bg-blue-950/80 text-blue-300 border border-blue-700/60 rounded-md font-bold flex items-center gap-1">
                          <Server className="w-3 h-3" /> Cloud Hosted URL (Multi-System Ready)
                        </span>
                      ) : editingPage.videoUrl.startsWith('idb:') ? (
                        <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-700/60 rounded-md font-bold flex items-center gap-1">
                          <HardDrive className="w-3 h-3" /> Local Browser File (Visible only on this system)
                        </span>
                      ) : null}
                    </div>
                  )}

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

                  {/* Video URL Text Input with Domain Guide */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editingPage.videoUrl || ''}
                      onChange={(e) => {
                        const updated = { ...editingPage, videoUrl: e.target.value.trim() };
                        setEditingPage(updated);
                        handleUpdatePage(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      placeholder="Paste Custom Domain URL (https://endlesssparkcreativehub.in/...) or YouTube, Drive, Vimeo..."
                    />
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 pt-0.5">
                      <span className="font-semibold text-pink-300">Supported:</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Custom Domain</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">YouTube</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Google Drive</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Vimeo</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Direct MP4 / WebM</span>
                    </div>
                  </div>

                  {/* Video Caption Field */}
                  <div>
                    <label className="text-[11px] font-semibold text-pink-300 block mb-1">
                      Video Subtitle Header / Short Caption
                    </label>
                    <input
                      type="text"
                      value={stripHtml(editingPage.videoCaption || '')}
                      onChange={(e) => {
                        const updated = { ...editingPage, videoCaption: stripHtml(e.target.value) };
                        setEditingPage(updated);
                        handleUpdatePage(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      placeholder="e.g. Video Demonstration: Folding Carton Creasing & Die-cutting..."
                    />
                  </div>

                  {/* Video Transcription & Native Subtitles Textarea & File Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
                      <label className="text-[11px] font-semibold text-pink-300 flex items-center gap-1">
                        <Subtitles className="w-3.5 h-3.5 text-pink-400" />
                        <span>Full Video Lesson Subtitles & Transcription</span>
                      </label>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Subtitle File Upload Button */}
                        <label className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-extrabold rounded-lg border border-amber-500/40 flex items-center gap-1 cursor-pointer transition shrink-0">
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>📁 Upload Subtitle File (.vtt, .srt, .txt, .json)</span>
                          <input
                            type="file"
                            accept=".vtt,.srt,.txt,.json,text/vtt,text/plain,application/json"
                            onChange={handleSubtitleFileUpload}
                            className="hidden"
                          />
                        </label>

                        {/* AI Auto-Generate Button */}
                        <button
                          type="button"
                          onClick={() => handleAutoGenerateTranscription(editingPage)}
                          disabled={isGeneratingAiTranscription}
                          className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-extrabold rounded-lg border border-indigo-500/40 flex items-center gap-1 cursor-pointer transition shrink-0"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>{isGeneratingAiTranscription ? 'Generating...' : '✨ Auto-AI Generate'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Format Guide Box */}
                    <div className="p-2.5 bg-slate-900/90 border border-amber-500/20 rounded-xl space-y-1 text-[10px] text-slate-300">
                      <div className="font-bold text-amber-400 flex items-center gap-1">
                        <span>ℹ️ Supported Subtitle Upload Formats & Guide:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-400 font-mono">
                        <div>• <b className="text-amber-300">.VTT</b> (WebVTT)</div>
                        <div>• <b className="text-amber-300">.SRT</b> (SubRip Subtitles)</div>
                        <div>• <b className="text-amber-300">.TXT</b> ([00:15] Time format)</div>
                        <div>• <b className="text-amber-300">.JSON</b> (Array of cues)</div>
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={stripHtml(editingPage.videoTranscription || '')}
                      onChange={(e) => {
                        const updated = { ...editingPage, videoTranscription: stripHtml(e.target.value) };
                        setEditingPage(updated);
                        handleUpdatePage(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-pink-200 focus:outline-none focus:border-pink-500"
                      placeholder="[00:00] Welcome to the video lesson...\n[00:15] Reviewing key technical principles..."
                    />
                  </div>

                  {/* Video Preview */}
                  {editingPage.videoUrl && (
                    <div className="rounded-xl overflow-hidden border border-pink-500/40 bg-black aspect-video relative max-h-48">
                      {renderVideoPlayer(editingPage.videoUrl, editingPage.videoCaption, editingPage.videoTranscription, editingPage)}
                    </div>
                  )}
                </div>

                {/* PRIMARY IMAGE UPLOAD & EMBED SECTION */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-amber-400" />
                      <span>Primary Image / Diagram 1 (Custom Domain / Cloud / File)</span>
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
                        <X className="w-3 h-3" /> Remove Image 1
                      </button>
                    )}
                  </div>

                  {/* Primary Image Media Source Badge */}
                  {editingPage.imageUrl && (
                    <div className="text-[10px] flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400">Source:</span>
                      {editingPage.imageUrl.startsWith('https://endlesssparkcreativehub.in') ? (
                        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-md font-bold flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Custom Domain ID (Multi-System Ready)
                        </span>
                      ) : editingPage.imageUrl.startsWith('http') ? (
                        <span className="px-2 py-0.5 bg-blue-950/80 text-blue-300 border border-blue-700/60 rounded-md font-bold flex items-center gap-1">
                          <Server className="w-3 h-3" /> Cloud Hosted URL (Multi-System Ready)
                        </span>
                      ) : editingPage.imageUrl.startsWith('data:image') ? (
                        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-md font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cloud Database Synchronized
                        </span>
                      ) : editingPage.imageUrl.startsWith('idb:') ? (
                        <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-700/60 rounded-md font-bold flex items-center gap-1">
                          <HardDrive className="w-3 h-3" /> Local Browser Cache (Visible only on this system)
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* Primary Image Upload File Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 rounded-xl text-xs font-extrabold text-amber-200 transition cursor-pointer shadow-sm">
                    <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Upload Image 1 File (PNG / JPG / SVG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Primary Image URL Text Input with Domain Guide */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editingPage.imageUrl || ''}
                      onChange={(e) => {
                        const updated = { ...editingPage, imageUrl: e.target.value.trim() };
                        setEditingPage(updated);
                        handleUpdatePage(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      placeholder="Paste Custom Domain URL (https://endlesssparkcreativehub.in/...) or Drive, Imgur, direct URL..."
                    />
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 pt-0.5">
                      <span className="font-semibold text-amber-300">Supported:</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Custom Domain</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Google Drive</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Dropbox</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Direct Image URL</span>
                    </div>
                  </div>

                  {/* Primary Image Caption Input */}
                  <input
                    type="text"
                    value={editingPage.imageCaption || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, imageCaption: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                    placeholder="Image 1 Caption (e.g. Primary CAD Technical Diagram)"
                  />

                  {/* Primary Image Preview */}
                  {editingPage.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 p-2 max-h-36 flex items-center justify-center">
                      <SafeImage src={editingPage.imageUrl} alt="Diagram Preview" className="max-h-32 object-contain rounded-lg" />
                    </div>
                  )}
                </div>

                {/* SECONDARY IMAGE (IMAGE #2) SECTION FOR 2-IMAGES GRID */}
                <div className="p-3 bg-slate-950 border border-blue-900/60 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-blue-400" />
                      <span>Secondary Image / Diagram 2 (For 2-Images Grid)</span>
                    </label>
                    {editingPage.secondaryImageUrl && (
                      <button
                        onClick={() => {
                          const updated = { ...editingPage, secondaryImageUrl: '' };
                          setEditingPage(updated);
                          handleUpdatePage(updated);
                        }}
                        className="text-[11px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Remove Image 2
                      </button>
                    )}
                  </div>

                  {/* Secondary Image Media Source Badge */}
                  {editingPage.secondaryImageUrl && (
                    <div className="text-[10px] flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400">Source:</span>
                      {editingPage.secondaryImageUrl.startsWith('https://endlesssparkcreativehub.in') ? (
                        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-md font-bold flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Custom Domain ID (Multi-System Ready)
                        </span>
                      ) : editingPage.secondaryImageUrl.startsWith('http') ? (
                        <span className="px-2 py-0.5 bg-blue-950/80 text-blue-300 border border-blue-700/60 rounded-md font-bold flex items-center gap-1">
                          <Server className="w-3 h-3" /> Cloud Hosted URL (Multi-System Ready)
                        </span>
                      ) : editingPage.secondaryImageUrl.startsWith('data:image') ? (
                        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-md font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cloud Database Synchronized
                        </span>
                      ) : editingPage.secondaryImageUrl.startsWith('idb:') ? (
                        <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-700/60 rounded-md font-bold flex items-center gap-1">
                          <HardDrive className="w-3 h-3" /> Local Browser Cache (Visible only on this system)
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* Secondary Image Upload File Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/60 rounded-xl text-xs font-extrabold text-blue-200 transition cursor-pointer shadow-sm">
                    <Upload className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Upload Image 2 File (PNG / JPG / SVG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSecondaryImageFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Secondary Image URL Text Input with Domain Guide */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editingPage.secondaryImageUrl || ''}
                      onChange={(e) => {
                        const updated = { ...editingPage, secondaryImageUrl: e.target.value.trim() };
                        setEditingPage(updated);
                        handleUpdatePage(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      placeholder="Paste Custom Domain URL (https://endlesssparkcreativehub.in/...) or Drive, Imgur, direct URL..."
                    />
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 pt-0.5">
                      <span className="font-semibold text-blue-300">Supported:</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Custom Domain</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Google Drive</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Dropbox</span>
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Direct Image URL</span>
                    </div>
                  </div>

                  {/* Secondary Image Caption Input */}
                  <input
                    type="text"
                    value={editingPage.secondaryImageCaption || ''}
                    onChange={(e) => {
                      const updated = { ...editingPage, secondaryImageCaption: e.target.value };
                      setEditingPage(updated);
                      handleUpdatePage(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-blue-200 focus:outline-none focus:border-blue-500"
                    placeholder="Image 2 Caption (e.g. Cross-section / Secondary Diagram)"
                  />

                  {/* Secondary Image Preview */}
                  {editingPage.secondaryImageUrl && (
                    <div className="rounded-xl overflow-hidden border border-blue-500/40 bg-slate-900 p-2 max-h-36 flex items-center justify-center">
                      <SafeImage src={editingPage.secondaryImageUrl} alt="Secondary Diagram Preview" className="max-h-32 object-contain rounded-lg" />
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
                    <option value="grid-right-2-images">🖼️ Right Side Grid (2 Images Stacked Top & Bottom)</option>
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

        {/* MODE 5: SETTINGS & PREFERENCES STUDIO TAB */}
        {viewMode === 'settings' && (
          <div className="w-full max-w-5xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span>Studio Settings & Reading Preferences</span>
                  </h2>
                  <p className="text-xs text-slate-400">Configure audio, slideshow timing, accessibility subtitles, typography, and narration.</p>
                </div>
              </div>

              <button
                onClick={() => setViewMode('flipbook')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20"
              >
                Back to 3D Flipbook
              </button>
            </div>

            {/* Grid of Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* CARD 1: AUDIO & SOUND FX */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                  <Volume2 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-extrabold text-white">Audio & Page Turn Sound FX</h3>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">3D Page Flip Sound Effects</span>
                    <span className="text-[11px] text-slate-400 block">Plays realistic paper rustle sound when turning pages</span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      soundEnabled ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Sound Effect Status:</span>
                  <span className={`font-mono font-bold ${soundEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {soundEnabled ? '● Sound Active' : '○ Sound Disabled'}
                  </span>
                </div>
              </div>

              {/* CARD 2: AUTO-PLAY SLIDESHOW TIMER */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-extrabold text-white">Auto-Play Slideshow & Auto-Turn</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Auto-Flip Page Timer Interval</label>
                  <select
                    value={autoFlipInterval}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAutoFlipInterval(val);
                      if (val === 0) setIsAutoFlipping(false);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={0}>Disabled (Manual Page Flip Only)</option>
                    <option value={3}>3 Seconds per page</option>
                    <option value={5}>5 Seconds per page</option>
                    <option value={8}>8 Seconds per page</option>
                    <option value={10}>10 Seconds per page</option>
                    <option value={15}>15 Seconds per page</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Slideshow Player:</span>
                  <button
                    disabled={autoFlipInterval === 0}
                    onClick={() => setIsAutoFlipping(!isAutoFlipping)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                      isAutoFlipping ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isAutoFlipping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isAutoFlipping ? 'Pause Slideshow' : 'Start Auto Slideshow'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: SUBTITLES & CLOSED CAPTIONS */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                  <Captions className="w-5 h-5 text-pink-400" />
                  <h3 className="text-sm font-extrabold text-white">Closed Captions & Subtitles (CC)</h3>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">Video Subtitles Overlay</span>
                    <span className="text-[11px] text-slate-400 block">Show caption subtitles box over embedded lesson videos</span>
                  </div>
                  <button
                    onClick={() => setShowCcSubtitles(!showCcSubtitles)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      showCcSubtitles ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Subtitles className="w-4 h-4" />
                    <span>{showCcSubtitles ? 'CC On' : 'CC Off'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 4: TEXT-TO-SPEECH (TTS) SPOKEN NARRATION */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                  <FileAudio className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-extrabold text-white">Text-to-Speech (TTS) Voice Narration</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Narration Speed (Playback Rate)</label>
                    <span className="text-xs font-mono font-bold text-indigo-400">{ttsRate}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={2.0}
                    step={0.25}
                    value={ttsRate}
                    onChange={(e) => setTtsRate(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.75x (Slow)</span>
                    <span>1.0x (Normal)</span>
                    <span>1.5x (Fast)</span>
                    <span>2.0x (Very Fast)</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 pt-2">
                    <div>
                      <span className="text-xs font-bold text-white block">Auto-Read Page Narration</span>
                      <span className="text-[11px] text-slate-400 block">Automatically read slide content aloud when turning pages</span>
                    </div>
                    <button
                      onClick={() => setTtsAutoRead(!ttsAutoRead)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        ttsAutoRead ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{ttsAutoRead ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 5: LANGUAGE & LOCALIZATION */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                  <Languages className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-extrabold text-white">Language & Native Translation</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Default Studio Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="en">English (Original Source)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="ja">日本語 (Japanese)</option>
                    <option value="zh">中文 (Chinese)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="ar">العربية (Arabic)</option>
                    <option value="tl">Tagalog (Filipino)</option>
                    <option value="vi">Tiếng Việt (Vietnamese)</option>
                    <option value="th">ไทย (Thai)</option>
                  </select>
                </div>
              </div>

              {/* CARD 6: READING DISPLAY, TEXT ALIGNMENT & BACKGROUND COLOR */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 md:col-span-2">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                  <Type className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white">Text Alignment, Background Color & Reader Typography</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Setting 1: Text Alignment */}
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">Text Alignment Setting</label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => {
                            if (editingPage) {
                              const updated = { ...editingPage, contentTextAlign: align };
                              setEditingPage(updated);
                              handleUpdatePage(updated);
                            }
                          }}
                          className={`py-1.5 rounded-lg text-xs font-extrabold capitalize transition cursor-pointer ${
                            (editingPage?.contentTextAlign || 'left') === align ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Setting 2: Background Color */}
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">Page Background Color</label>
                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                      <input
                        type="color"
                        value={editingPage?.pageBackgroundColor || '#fdfbf7'}
                        onChange={(e) => {
                          if (editingPage) {
                            const updated = { ...editingPage, pageBackgroundColor: e.target.value };
                            setEditingPage(updated);
                            handleUpdatePage(updated);
                          }
                        }}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0"
                        title="Pick Custom Background Color"
                      />
                      <select
                        value={editingPage?.pageBackgroundColor || '#fdfbf7'}
                        onChange={(e) => {
                          if (editingPage) {
                            const updated = { ...editingPage, pageBackgroundColor: e.target.value };
                            setEditingPage(updated);
                            handleUpdatePage(updated);
                          }
                        }}
                        className="w-full bg-slate-950 text-white text-xs rounded-lg px-2 py-1 font-bold focus:outline-none"
                      >
                        <option value="#fdfbf7">Classic Paper (#fdfbf7)</option>
                        <option value="#ffffff">Pure White (#ffffff)</option>
                        <option value="#fef3c7">Vintage Cream (#fef3c7)</option>
                        <option value="#f1f5f9">Slate Gray (#f1f5f9)</option>
                        <option value="#0f172a">Night Dark (#0f172a)</option>
                        <option value="#18181b">Charcoal Black (#18181b)</option>
                        <option value="#022c22">Deep Emerald (#022c22)</option>
                        <option value="#1e1b4b">Royal Indigo (#1e1b4b)</option>
                      </select>
                    </div>
                  </div>

                  {/* Setting 3: Base Reader Font Size */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Base Reader Font Size</label>
                    <select
                      value={readerFontSize}
                      onChange={(e) => setReaderFontSize(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="text-xs">Small (12px)</option>
                      <option value="text-sm">Medium (14px - Default)</option>
                      <option value="text-base">Large (16px)</option>
                      <option value="text-lg">Extra Large (18px)</option>
                    </select>
                  </div>

                  {/* Setting 4: Reader Font Family */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Reader Font Family</label>
                    <select
                      value={readerFontFamily}
                      onChange={(e) => setReaderFontFamily(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="sans">System Sans-Serif (Clean UI)</option>
                      <option value="serif">Editorial Serif (Book Style)</option>
                      <option value="mono">Technical Monospace (Code / Engineering)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSoundEnabled(true);
                  setAutoFlipInterval(0);
                  setIsAutoFlipping(false);
                  setTtsRate(1.0);
                  setTtsAutoRead(false);
                  setShowCcSubtitles(true);
                  setSelectedLanguage('en');
                  setReaderFontSize('text-sm');
                  setReaderFontFamily('sans');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Reset All Preferences to Default
              </button>

              <button
                onClick={() => setViewMode('flipbook')}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Apply Settings & Open 3D Flipbook
              </button>
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

      {/* High-Resolution Media Lightbox / Zoom Overlay */}
      <AnimatePresence>
        {lightboxMedia && (
          <div
            id="ebook-media-lightbox"
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setLightboxMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-sm text-white">{lightboxMedia.alt || 'High-Resolution Diagram'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxMedia(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 min-h-[400px]">
                <img
                  src={lightboxMedia.src}
                  alt={lightboxMedia.alt}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Vector High-Definition Technical Visual</span>
                <button
                  type="button"
                  onClick={() => setLightboxMedia(null)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Close Zoom
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
