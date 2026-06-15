import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Plus, 
  Trash2, 
  GraduationCap, 
  Briefcase, 
  Award, 
  Code, 
  Sparkles, 
  Download, 
  Printer, 
  ChevronRight, 
  ChevronLeft,
  Bold,
  Italic,
  Layout as LayoutIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Linkedin,
  Camera,
  Video,
  VideoOff,
  Search,
  Save,
  Database,
  FolderOpen,
  Cloud,
  Sliders,
  CloudUpload
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../utils';
import { GoogleGenAI } from "@google/genai";
import { generateGeminiContent } from '../services/gemini';
import { db } from '../firebase';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';


interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  duration: string;
  score: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  description: string[];
}

interface Project {
  id: string;
  title: string;
  link: string;
  description: string;
}

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    countryFlag?: string;
    location: string;
    linkedin: string;
    portfolio: string;
    summary: string;
    photo?: string;
    showPhoto?: boolean;
    fatherName?: string;
    motherName?: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    maritalStatus?: string;
    visaStatus?: string;
    permanentAddress?: string;
    declaration?: string;
    photoSize?: number;
    photoScale?: number;
    photoBorder?: number;
    multiPageLayout?: boolean;
    summaryBold?: boolean;
    summaryItalic?: boolean;
  };
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: string[];
  certifications: string[];
  languages: string[];
  interests: string[];
}

const COUNTRIES = [
  { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
  { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', dialCode: '+971' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', dialCode: '+966' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49' },
  { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', dialCode: '+81' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', dialCode: '+82' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', dialCode: '+27' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', dialCode: '+55' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', dialCode: '+64' },
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩', dialCode: '+880' },
  { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰', dialCode: '+94' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰', dialCode: '+92' },
  { name: 'Nepal', code: 'NP', flag: '🇳🇵', dialCode: '+977' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', dialCode: '+63' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', dialCode: '+62' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', dialCode: '+60' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', dialCode: '+31' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', dialCode: '+41' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪', dialCode: '+46' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴', dialCode: '+47' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰', dialCode: '+45' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', dialCode: '+39' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', dialCode: '+34' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽', dialCode: '+52' },
];

const parseMarkdownToReact = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    const parsedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx} className="font-extrabold text-gray-950">{part.slice(2, -2)}</strong>;
      } else if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={partIdx} className="italic font-semibold text-gray-800">{part.slice(1, -1)}</em>;
      }
      return part;
    });
    return (
      <React.Fragment key={lineIdx}>
        {lineIdx > 0 && <br />}
        {parsedLine}
      </React.Fragment>
    );
  });
};

const parseMarkdownToHtml = (text: string) => {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
};

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    countryFlag: '🇺🇸', // Default to US flag or empty
    location: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    photo: '',
    showPhoto: true,
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    maritalStatus: '',
    visaStatus: '',
    permanentAddress: '',
    declaration: 'I hereby declare that the above information is true and correct to the best of my knowledge and belief.',
    photoSize: 112,
    photoScale: 100,
    photoBorder: 4,
    multiPageLayout: false,
    summaryBold: false,
    summaryItalic: false,
  },
  education: [
    { id: '1', degree: '', institution: '', location: '', duration: '', score: '' }
  ],
  experience: [
    {
      id: 'exp-1',
      title: 'PACKAGING Engineer',
      company: 'Endless Spark',
      location: 'Coimbatore',
      duration: 'Jan 10thrd, 2024, to Till Now.',
      description: ['Add Achievement']
    },
    {
      id: 'exp-2',
      title: 'DTP Artist',
      company: 'Kumaran photographic',
      location: '',
      duration: 'August 10th, 2017, to Dec 30th, 2019.',
      description: ['Add Achievement']
    }
  ],
  projects: [],
  skills: [],
  certifications: [],
  languages: [],
  interests: [],
};

const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'summary', title: 'Professional Summary', icon: Sparkles },
  { id: 'education', title: 'Education', icon: GraduationCap },
  { id: 'experience', title: 'Experience & Projects', icon: Briefcase },
  { id: 'skills', title: 'Skills & Others', icon: Code },
  { id: 'preview', title: 'Preview & Export', icon: LayoutIcon },
];

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
      streamRef.current = stream;
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setCameraError('Please allow camera permission to capture live photo');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const video = videoRef.current;
        const videoWidth = video.videoWidth || 480;
        const videoHeight = video.videoHeight || 480;
        const size = Math.min(videoWidth, videoHeight);
        const x = (videoWidth - size) / 2;
        const y = (videoHeight - size) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(video, x, y, size, size, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        handlePersonalInfo('photo', dataUrl);
        handlePersonalInfo('showPhoto', true);
      }
    }
    stopCamera();
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const [data, setData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('resume_builder_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...initialResumeData,
            ...parsed,
            personalInfo: {
              ...initialResumeData.personalInfo,
              ...(parsed.personalInfo || {})
            },
            education: parsed.education || initialResumeData.education,
            experience: parsed.experience || initialResumeData.experience,
            projects: parsed.projects || initialResumeData.projects,
            skills: parsed.skills || initialResumeData.skills,
            certifications: parsed.certifications || initialResumeData.certifications,
            languages: parsed.languages || initialResumeData.languages,
            interests: parsed.interests || initialResumeData.interests || [],
          };
        }
      } catch (e) {
        console.error('Failed to parse saved resume data', e);
      }
    }
    return {
      ...initialResumeData,
      personalInfo: {
        ...initialResumeData.personalInfo,
        fullName: user?.name || '',
        email: user?.email || '',
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('resume_builder_data', JSON.stringify(data));
  }, [data]);

  // Resume list variables for Admin Section
  const [dbResumes, setDbResumes] = useState<any[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [currentLoadedId, setCurrentLoadedId] = useState<string | null>(null);
  const [currentLoadedName, setCurrentLoadedName] = useState<string | null>(null);
  const [isSlot, setIsSlot] = useState(false);
  const [slotNumber, setSlotNumber] = useState<number | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(true);

  // Dynamic scaling for Live Preview A4 fit on screen
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      if (containerWidth && containerWidth < 820) {
        // fit it within containerWidth with safety padding
        const scale = (containerWidth - 24) / 794;
        setScaleFactor(scale > 0.22 ? scale : 0.22);
      } else {
        setScaleFactor(1);
      }
    };
    
    // Set timeout to let DOM render first
    const timer = setTimeout(handleResize, 100);
    
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fetchAllResumes = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'faculty')) return;
    try {
      setIsLoadingResumes(true);
      const querySnapshot = await getDocs(collection(db, 'saved_resumes'));
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setDbResumes(list);
    } catch (err) {
      console.error("Error fetching all saved resumes:", err);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleSaveToDatabase = async (slotNum?: number) => {
    if (!user) {
      alert("Error: You must be logged in to save resumes.");
      return;
    }
    
    let docId = currentLoadedId || user.id;
    let sName = currentLoadedName || user.name;
    let saveIsSlot = isSlot;
    let saveSlotNumber = slotNumber;
    
    if (slotNum !== undefined) {
      docId = `admin_slot_${slotNum}`;
      sName = `Admin Slot ${slotNum}`;
      saveIsSlot = true;
      saveSlotNumber = slotNum;
    }
    
    try {
      setIsLoadingResumes(true);
      
      const payload = {
        id: docId,
        userId: user.id, // Who saved/updated it
        studentName: data.personalInfo.fullName || sName || 'Unnamed Student',
        data: data,
        updatedAt: new Date().toISOString(),
        isSlot: saveIsSlot || false,
        ...(saveSlotNumber ? { slotNumber: saveSlotNumber } : {})
      };
      
      await setDoc(doc(db, 'saved_resumes', docId), payload);
      
      setCurrentLoadedId(docId);
      setCurrentLoadedName(payload.studentName);
      setIsSlot(saveIsSlot || false);
      if (saveSlotNumber) setSlotNumber(saveSlotNumber);
      
      alert(`Resume successfully saved under "${payload.studentName}"!`);
      
      // Refresh list
      if (user.role === 'admin' || user.role === 'faculty') {
        fetchAllResumes();
      }
    } catch (err: any) {
      console.error("Error saving resume to database:", err);
      alert(`Failed to save resume: ${err.message || err}`);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const loadSpecificResume = async (id: string, name: string, isSlotType: boolean, slotNum?: number) => {
    try {
      setIsLoadingResumes(true);
      const docRef = doc(db, 'saved_resumes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const resData = docSnap.data();
        if (resData && resData.data) {
          setData(resData.data);
          setCurrentLoadedId(id);
          setCurrentLoadedName(name);
          setIsSlot(isSlotType);
          setSlotNumber(slotNum || null);
          alert(`Loaded resume draft: "${name}" successfully in the builder!`);
        }
      } else {
        if (id.startsWith('admin_slot_')) {
          const slotNumParsed = parseInt(id.replace('admin_slot_', ''));
          setCurrentLoadedId(id);
          setCurrentLoadedName(name);
          setIsSlot(true);
          setSlotNumber(slotNumParsed);
          setData({
            ...initialResumeData,
            personalInfo: {
              ...initialResumeData.personalInfo,
              fullName: `Student Resume Slot ${slotNumParsed}`,
              email: '',
            }
          });
          alert(`Slot ${slotNumParsed} is empty! Started fresh workspace under ${name}. Click "Save Active Draft" to save changes!`);
        } else {
          alert(`No saved resume found in the database for "${name}".`);
        }
      }
    } catch (err: any) {
      console.error("Error loading specific resume:", err);
      alert(`Failed to load: ${err.message || err}`);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleDeleteResume = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the saved resume for "${name}" from the database?`)) {
      return;
    }
    try {
      setIsLoadingResumes(true);
      await deleteDoc(doc(db, 'saved_resumes', id));
      alert(`Saved resume for "${name}" deleted from database.`);
      
      if (currentLoadedId === id) {
        setCurrentLoadedId(null);
        setCurrentLoadedName(null);
        setIsSlot(false);
        setSlotNumber(null);
        setData({
          ...initialResumeData,
          personalInfo: {
            ...initialResumeData.personalInfo,
            fullName: user?.name || '',
            email: user?.email || '',
          }
        });
      }
      
      fetchAllResumes();
    } catch (err: any) {
      console.error("Error deleting resume:", err);
      alert(`Failed to delete resume: ${err.message}`);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  useEffect(() => {
    const fetchMySavedResume = async () => {
      if (!user) return;
      
      const queryParams = new URLSearchParams(window.location.search);
      const queryId = queryParams.get('id');
      
      let loadId = user.id; // Default to student's own ID
      if (user.role === 'admin' || user.role === 'faculty') {
        if (queryId) {
          loadId = queryId;
        } else {
          // If admin with no queryId, fetch all saved resumes and slots
          fetchAllResumes();
          return;
        }
      } else if (queryId && queryId !== user.id) {
        // Normal students can only load their own
        return;
      }
      
      try {
        setIsLoadingResumes(true);
        const docRef = doc(db, 'saved_resumes', loadId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const resData = docSnap.data();
          if (resData && resData.data) {
            setData(resData.data);
            setCurrentLoadedId(loadId);
            setCurrentLoadedName(resData.studentName || '');
            if (resData.isSlot) {
              setIsSlot(true);
              setSlotNumber(resData.slotNumber || null);
            }
          }
        } else {
          setCurrentLoadedId(user.id);
          setCurrentLoadedName(user.name);
        }
      } catch (err) {
        console.error("Error loading resume from firestore on mount:", err);
      } finally {
        setIsLoadingResumes(false);
      }
      
      // If admin, *also* fetch all resumes so sidebar is populated
      if (user.role === 'admin' || user.role === 'faculty') {
        fetchAllResumes();
      }
    };
    
    fetchMySavedResume();
  }, [user]);

  const [isOptimizing, setIsOptimizing] = useState<string | null>(null);

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const handleAddSkills = (input: string) => {
    const items = input.split(',').map(item => item.trim()).filter(Boolean);
    if (items.length > 0) {
      setData(prev => {
        const updated = [...(prev.skills || [])];
        items.forEach(item => {
          if (!updated.includes(item)) {
            updated.push(item);
          }
        });
        return { ...prev, skills: updated };
      });
    }
    setNewSkill('');
  };

  const handleAddLanguages = (input: string) => {
    const items = input.split(',').map(item => item.trim()).filter(Boolean);
    if (items.length > 0) {
      setData(prev => {
        const updated = [...(prev.languages || [])];
        items.forEach(item => {
          if (!updated.includes(item)) {
            updated.push(item);
          }
        });
        return { ...prev, languages: updated };
      });
    }
    setNewLanguage('');
  };

  const handleAddCertifications = (input: string) => {
    const items = input.split(',').map(item => item.trim()).filter(Boolean);
    if (items.length > 0) {
      setData(prev => {
        const updated = [...(prev.certifications || [])];
        items.forEach(item => {
          if (!updated.includes(item)) {
            updated.push(item);
          }
        });
        return { ...prev, certifications: updated };
      });
    }
    setNewCertification('');
  };

  const handleAddInterests = (input: string) => {
    const items = input.split(',').map(item => item.trim()).filter(Boolean);
    if (items.length > 0) {
      setData(prev => {
        const updated = [...(prev.interests || [])];
        items.forEach(item => {
          if (!updated.includes(item)) {
            updated.push(item);
          }
        });
        return { ...prev, interests: updated };
      });
    }
    setNewInterest('');
  };

  const downloadAsHtml = () => {
    const fileName = `resume_${(data.personalInfo.fullName || 'builder').replace(/\s+/g, '_').toLowerCase()}.html`;
    
    // Generate contact items list
    const contacts = [
      data.personalInfo.phone,
      data.personalInfo.email,
      data.personalInfo.location,
      data.personalInfo.linkedin ? `LinkedIn: ${data.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}` : '',
      data.personalInfo.portfolio ? `Portfolio: ${data.personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '')}` : ''
    ].filter(Boolean);

    const educationHtmlNested = data.education.map(edu => {
      if (!edu.degree && !edu.institution) return '';
      return `
        <div style="margin-bottom: 9pt; line-height: 1.25;">
          <div style="font-weight: bold; font-size: 9.5pt; color: #ffffff;">${edu.degree || 'Degree'}</div>
          <div style="font-style: italic; font-size: 8.5pt; color: #cbd5e1; margin-top: 2px;">${edu.institution || ''}</div>
          <div style="font-size: 8pt; color: #94a3b8; margin-top: 1px;">${edu.duration || ''}</div>
          ${edu.score ? `<div style="font-size: 8pt; color: #94a3b8; margin-top: 1px;">Score: ${edu.score}</div>` : ''}
        </div>
      `;
    }).filter(Boolean).join('');

    const experienceHtml = data.experience.map(exp => {
      if (!exp.title && !exp.company) return '';
      const bulletItems = exp.description.map(bullet => {
        if (!bullet) return '';
        return `<li style="margin-bottom: 2pt; color: #334155; font-size: 9.5pt; text-align: justify; line-height: 1.35;">${bullet}</li>`;
      }).filter(Boolean).join('');

      return `
        <div style="margin-bottom: 12pt;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 2pt;">
            <tr>
              <td align="left" style="font-weight: bold; font-size: 10.5pt; color: #0f172a;">${exp.title || 'Job Title'}</td>
              <td align="right" style="font-weight: bold; font-size: 9pt; color: #475569; text-align: right;">${exp.duration || ''}</td>
            </tr>
            <tr>
              <td align="left" style="font-weight: bold; font-size: 9.5pt; color: #df2182; text-transform: uppercase;">${exp.company || ''}</td>
              <td align="right" style="text-align: right; font-size: 9pt; color: #64748b;">${exp.location || ''}</td>
            </tr>
          </table>
          ${bulletItems ? `<ul style="margin: 0 0 6pt 13pt; padding: 0; list-style-type: disc;">${bulletItems}</ul>` : ''}
        </div>
      `;
    }).filter(Boolean).join('');

    const projectsHtml = data.projects.map(proj => {
      if (!proj.title && !proj.description) return '';
      return `
        <div style="margin-bottom: 10pt;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 1pt;">
            <tr>
              <td align="left" style="font-weight: bold; font-size: 10pt; color: #0f172a;">${proj.title}</td>
              <td align="right" style="font-size: 8.5pt; color: #2563eb; text-align: right;">${proj.link ? proj.link.replace(/^https?:\/\/(www\.)?/, '') : ''}</td>
            </tr>
          </table>
          <p style="font-size: 9.5pt; color: #334155; margin: 0; text-align: left; line-height: 1.35;">${proj.description}</p>
        </div>
      `;
    }).filter(Boolean).join('');

    const hasPersonalDetails = !!(
      data.personalInfo.fatherName ||
      data.personalInfo.motherName ||
      data.personalInfo.dateOfBirth ||
      data.personalInfo.gender ||
      data.personalInfo.nationality ||
      data.personalInfo.maritalStatus ||
      data.personalInfo.visaStatus ||
      data.personalInfo.permanentAddress
    );

    const detailsRows = [
      data.personalInfo.permanentAddress ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Permanent Address</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.permanentAddress}</td>
        </tr>
      ` : '',
      data.personalInfo.visaStatus ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Visa Status</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.visaStatus}</td>
        </tr>
      ` : '',
      data.personalInfo.nationality ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Nationality</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.nationality}</td>
        </tr>
      ` : '',
      data.personalInfo.dateOfBirth ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Date of birth</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.dateOfBirth}</td>
        </tr>
      ` : '',
      data.personalInfo.maritalStatus ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Marital Status</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.maritalStatus}</td>
        </tr>
      ` : '',
      data.personalInfo.fatherName ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Father's Name</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.fatherName}</td>
        </tr>
      ` : '',
      data.personalInfo.motherName ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Mother's Name</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.motherName}</td>
        </tr>
      ` : '',
      data.personalInfo.gender ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Gender</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.gender}</td>
        </tr>
      ` : '',
    ].filter(Boolean).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${data.personalInfo.fullName || 'Resume'}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.35;
            color: #1e293b;
            background-color: #f1f5f9;
            margin: 0;
            padding: 20px;
          }
          .resume-container {
            width: 210mm;
            height: ${data.personalInfo.multiPageLayout ? 'auto' : '297mm'};
            min-height: 297mm;
            max-height: ${data.personalInfo.multiPageLayout ? 'none' : '297mm'};
            margin: 20px auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
            border-radius: 8px;
            overflow: ${data.personalInfo.multiPageLayout ? 'visible' : 'hidden'};
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td {
            padding: 0;
          }
          .left-col {
            background-color: #ffffff;
            padding: 25pt 30pt 25pt 20pt;
          }
          .right-sidebar {
            background-color: #1b324d !important;
            padding: 30pt 20pt 20pt 20pt;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          h1 {
            font-size: 26pt;
            font-weight: 800;
            color: #010c1e;
            text-transform: uppercase;
            margin: 0 0 4pt 0;
            line-height: 1.1;
          }
          h2 {
            font-size: 11.5pt;
            font-weight: bold;
            color: #010c1e;
            text-transform: uppercase;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 3pt;
            margin: 15pt 0 10pt 0;
            letter-spacing: 0.5pt;
          }
          h3 {
            font-size: 11pt;
            font-weight: bold;
            color: #ffffff;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(255,255,255,0.25);
            padding-bottom: 3pt;
            margin: 15pt 0 10pt 0;
            letter-spacing: 0.5pt;
          }
          @media print {
            body {
              background-color: #ffffff !important;
              padding: 0;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .resume-container {
              width: 210mm;
              height: ${data.personalInfo.multiPageLayout ? 'auto' : '297mm'};
              box-shadow: none;
              margin: 0;
              border-radius: 0;
              max-height: ${data.personalInfo.multiPageLayout ? 'none' : '297mm'};
              overflow: ${data.personalInfo.multiPageLayout ? 'visible' : 'hidden'};
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .right-sidebar {
              background-color: #1b324d !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .left-col {
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="resume-container">
          <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
            <tr>
              <!-- Left Column: 68% -->
              <td width="68%" valign="top" class="left-col">
                 <h1>${data.personalInfo.fullName || 'YOUR NAME'}</h1>
                 <p style="font-size: 9.5pt; color: #475569; margin: 0 0 16pt 0; padding-bottom: 8pt; border-bottom: 1px solid #cbd5e1;">
                   ${contacts.join(' &nbsp;&nbsp;|&nbsp;&nbsp; ')}
                 </p>

                 ${data.personalInfo.summary ? `
                   <div>
                     <h2>PROFILE</h2>
                     <p style="font-size: 10pt; color: #334155; text-align: justify; margin: 0; line-height: 1.4;">${parseMarkdownToHtml(data.personalInfo.summary)}</p>
                   </div>
                 ` : ''}

                 ${experienceHtml ? `
                   <div>
                     <h2>EXPERIENCE</h2>
                     ${experienceHtml}
                   </div>
                 ` : ''}

                 ${projectsHtml ? `
                   <div>
                     <h2>KEY PROJECTS</h2>
                     ${projectsHtml}
                   </div>
                 ` : ''}

                 ${hasPersonalDetails ? `
                   <div>
                     <h2>PERSONAL DETAILS</h2>
                     <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                       ${detailsRows}
                     </table>
                   </div>
                 ` : ''}

                 ${data.personalInfo.declaration ? `
                   <div style="margin-top: 24pt;">
                     <h2>DECLARATION</h2>
                     <p style="font-size: 9.5pt; font-style: italic; color: #475569; text-align: left; margin: 0;">${data.personalInfo.declaration}</p>
                   </div>
                 ` : ''}
              </td>

              <!-- Right Sidebar: 32% -->
              <td width="32%" valign="top" class="right-sidebar">
                 ${data.personalInfo.showPhoto && data.personalInfo.photo ? `
                   <div style="text-align: center; margin-bottom: 20pt;">
                     <div style="width: ${data.personalInfo.photoSize ?? 112}px; height: ${data.personalInfo.photoSize ?? 112}px; border: ${data.personalInfo.photoBorder ?? 4}px solid rgba(255,255,255,0.2); border-radius: 50%; overflow: hidden; display: inline-block; box-sizing: border-box; background: rgba(0, 0, 0, 0.1); margin: 0 auto;">
                       <img src="${data.personalInfo.photo}" style="object-fit: cover; transform: scale(${(data.personalInfo.photoScale ?? 100) / 100}); width: 100%; height: 100%; border-radius: 50%;" />
                     </div>
                   </div>
                 ` : ''}

                 ${data.skills && data.skills.length > 0 ? `
                   <div>
                     <h3>SKILLS</h3>
                     <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                       ${data.skills.map(skill => `
                         <tr><td style="font-size: 9.5pt; color: #f8fafc; padding-bottom: 4pt;">&bull; &nbsp;${skill}</td></tr>
                       `).join('')}
                     </table>
                   </div>
                 ` : ''}

                 ${educationHtmlNested ? `
                   <div>
                     <h3>EDUCATION</h3>
                     ${educationHtmlNested}
                   </div>
                 ` : ''}

                 ${data.languages && data.languages.length > 0 ? `
                   <div>
                     <h3>LANGUAGES</h3>
                     <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                       ${data.languages.map(lang => {
                         const lNormalized = lang.toLowerCase();
                         let dotsText = "&bull;&bull;&bull;&bull;&bull;";
                         let levelText = "";
                         if (lNormalized.includes("intermediate")) {
                           dotsText = "&bull;&bull;&bull;&deg;&deg;";
                           levelText = "Intermediate";
                         } else if (lNormalized.includes("proficient") || lNormalized.includes("fluent")) {
                           dotsText = "&bull;&bull;&bull;&bull;&bull;";
                           levelText = "Proficient";
                         } else if (lNormalized.includes("basic") || lNormalized.includes("beginner")) {
                           dotsText = "&bull;&bull;&deg;&deg;&deg;";
                           levelText = "Basic";
                         }
                         const cleanName = lang.replace(/\(.*\)/g, '').replace(/-.*/g, '').trim();
                         return `
                           <tr>
                             <td align="left" style="font-size: 9.5pt; color: #ffffff; font-weight: bold; padding-bottom: 5pt;">
                               ${cleanName}
                               ${levelText ? `<span style="font-size: 8pt; color: #cbd5e1; display: block; font-weight: normal; margin-top: 1px;">${levelText}</span>` : ''}
                             </td>
                             <td align="right" style="font-size: 10pt; color: #cbd5e1; font-weight: bold; padding-bottom: 5pt; text-align: right;">
                               ${dotsText}
                             </td>
                           </tr>
                         `;
                       }).join('')}
                     </table>
                   </div>
                 ` : ''}

                 ${data.certifications && data.certifications.length > 0 ? `
                   <div>
                     <h3>CERTIFICATIONS</h3>
                     <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                       ${data.certifications.map(cert => `
                         <tr><td style="font-size: 9.5pt; color: #f8fafc; padding-bottom: 4pt;">&bull; &nbsp;${cert}</td></tr>
                       `).join('')}
                     </table>
                   </div>
                 ` : ''}

                 ${data.interests && data.interests.length > 0 ? `
                   <div>
                     <h3>INTERESTS</h3>
                     <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                       ${data.interests.map(interest => `
                         <tr><td style="font-size: 9.5pt; color: #f8fafc; padding-bottom: 4pt;">&bull; &nbsp;${interest}</td></tr>
                       `).join('')}
                     </table>
                   </div>
                 ` : ''}
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAsWordDoc = () => {
    const fileName = `resume_${(data.personalInfo.fullName || 'builder').replace(/\s+/g, '_').toLowerCase()}.doc`;
    
    // Generate contact items list
    const contacts = [
      data.personalInfo.phone,
      data.personalInfo.email,
      data.personalInfo.location,
      data.personalInfo.linkedin ? `LinkedIn: ${data.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}` : '',
      data.personalInfo.portfolio ? `Portfolio: ${data.personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '')}` : ''
    ].filter(Boolean);

    const educationHtmlNested = data.education.map(edu => {
      if (!edu.degree && !edu.institution) return '';
      return `
        <div style="margin-bottom: 9pt; line-height: 1.25;">
          <div style="font-weight: bold; font-size: 9.5pt; color: #ffffff;">${edu.degree || 'Degree'}</div>
          <div style="font-style: italic; font-size: 8.5pt; color: #cbd5e1; margin-top: 2px;">${edu.institution || ''}</div>
          <div style="font-size: 8pt; color: #94a3b8; margin-top: 1px;">${edu.duration || ''}</div>
          ${edu.score ? `<div style="font-size: 8pt; color: #94a3b8; margin-top: 1px;">Score: ${edu.score}</div>` : ''}
        </div>
      `;
    }).filter(Boolean).join('');

    const experienceHtml = data.experience.map(exp => {
      if (!exp.title && !exp.company) return '';
      const bulletItems = exp.description.map(bullet => {
        if (!bullet) return '';
        return `<li style="margin-bottom: 2pt; color: #334155; font-size: 9.5pt; text-align: justify; line-height: 1.35;">${bullet}</li>`;
      }).filter(Boolean).join('');

      return `
        <div style="margin-bottom: 12pt;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 2pt;">
            <tr>
              <td align="left" style="font-weight: bold; font-size: 10.5pt; color: #0f172a;">${exp.title || 'Job Title'}</td>
              <td align="right" style="font-weight: bold; font-size: 9pt; color: #475569; text-align: right;">${exp.duration || ''}</td>
            </tr>
            <tr>
              <td align="left" style="font-weight: bold; font-size: 9.5pt; color: #df2182; text-transform: uppercase;">${exp.company || ''}</td>
              <td align="right" style="text-align: right; font-size: 9pt; color: #64748b;">${exp.location || ''}</td>
            </tr>
          </table>
          ${bulletItems ? `<ul style="margin: 0 0 6pt 13pt; padding: 0; list-style-type: disc;">${bulletItems}</ul>` : ''}
        </div>
      `;
    }).filter(Boolean).join('');

    const projectsHtml = data.projects.map(proj => {
      if (!proj.title && !proj.description) return '';
      return `
        <div style="margin-bottom: 10pt;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 1pt;">
            <tr>
              <td align="left" style="font-weight: bold; font-size: 10pt; color: #0f172a;">${proj.title}</td>
              <td align="right" style="font-size: 8.5pt; color: #2563eb; text-align: right;">${proj.link ? proj.link.replace(/^https?:\/\/(www\.)?/, '') : ''}</td>
            </tr>
          </table>
          <p style="font-size: 9.5pt; color: #334155; margin: 0; text-align: left; line-height: 1.35;">${proj.description}</p>
        </div>
      `;
    }).filter(Boolean).join('');

    const hasPersonalDetails = !!(
      data.personalInfo.fatherName ||
      data.personalInfo.motherName ||
      data.personalInfo.dateOfBirth ||
      data.personalInfo.gender ||
      data.personalInfo.nationality ||
      data.personalInfo.maritalStatus ||
      data.personalInfo.visaStatus ||
      data.personalInfo.permanentAddress
    );

    const detailsRows = [
      data.personalInfo.permanentAddress ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Permanent Address</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.permanentAddress}</td>
        </tr>
      ` : '',
      data.personalInfo.visaStatus ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Visa Status</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.visaStatus}</td>
        </tr>
      ` : '',
      data.personalInfo.nationality ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Nationality</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.nationality}</td>
        </tr>
      ` : '',
      data.personalInfo.dateOfBirth ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Date of birth</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.dateOfBirth}</td>
        </tr>
      ` : '',
      data.personalInfo.maritalStatus ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Marital Status</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.maritalStatus}</td>
        </tr>
      ` : '',
      data.personalInfo.fatherName ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Father's Name</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.fatherName}</td>
        </tr>
      ` : '',
      data.personalInfo.motherName ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Mother's Name</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.motherName}</td>
        </tr>
      ` : '',
      data.personalInfo.gender ? `
        <tr>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: left; width: 140px; white-space: nowrap;">Gender</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: bold; padding-bottom: 4pt; text-align: center; width: 20px;">:</td>
          <td valign="top" style="font-size: 9.5pt; color: #1e293b; font-weight: normal; padding-bottom: 4pt; text-align: left; padding-left: 24px;">${data.personalInfo.gender}</td>
        </tr>
      ` : '',
    ].filter(Boolean).join('');

    let hasPhoto = false;

    if (data.personalInfo.showPhoto && data.personalInfo.photo) {
      hasPhoto = true;
    }

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${data.personalInfo.fullName || 'Resume'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.25;
            color: #1e293b;
            background-color: #ffffff;
          }
          h1, h2, h3, h4, p, ul, li {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
          
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; min-height: 800pt; background-color: #ffffff;">
            <tr>
              <!-- Left Column (Main content): 68% width -->
              <td width="68%" valign="top" style="width: 68%; background-color: #ffffff; padding: 15pt 20pt 15pt 10pt; font-family: 'Calibri', 'Arial', sans-serif;">
                 <!-- Name -->
                 <h1 style="font-size: 26pt; font-weight: 800; color: #010c1e; text-transform: uppercase; margin-bottom: 4pt; font-family: 'Arial', sans-serif; mso-line-height-rule: exactly; line-height: 1.1;">
                   ${data.personalInfo.fullName || 'YOUR NAME'}
                 </h1>
                 
                 <!-- Contact horizontal details -->
                 <p style="font-size: 9.5pt; color: #475569; margin: 0 0 16pt 0; padding-bottom: 8pt; border-bottom: 1px solid #cbd5e1; line-height: 1.3;">
                   ${contacts.join(' &nbsp;&nbsp;|&nbsp;&nbsp; ')}
                 </p>

                 <!-- PROFILE -->
                 ${data.personalInfo.summary ? `
                   <div style="margin-bottom: 16pt;">
                     <h2 style="font-size: 11pt; font-weight: bold; color: #010c1e; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">PROFILE</h2>
                     <p style="font-size: 10pt; color: #334155; line-height: 1.4; margin: 0; text-align: justify;">${parseMarkdownToHtml(data.personalInfo.summary)}</p>
                   </div>
                 ` : ''}

                 <!-- EXPERIENCE -->
                 ${experienceHtml ? `
                   <div style="margin-bottom: 16pt;">
                     <h2 style="font-size: 11pt; font-weight: bold; color: #010c1e; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">EXPERIENCE</h2>
                     ${experienceHtml}
                   </div>
                 ` : ''}

                 <!-- KEY PROJECTS -->
                 ${projectsHtml ? `
                   <div style="margin-bottom: 16pt;">
                     <h2 style="font-size: 11pt; font-weight: bold; color: #010c1e; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">KEY PROJECTS</h2>
                     ${projectsHtml}
                   </div>
                 ` : ''}

                 <!-- PERSONAL DETAILS -->
                 ${hasPersonalDetails ? `
                   <div style="margin-bottom: 16pt;">
                     <h2 style="font-size: 11pt; font-weight: bold; color: #010c1e; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">PERSONAL DETAILS</h2>
                     <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
                       ${detailsRows}
                     </table>
                   </div>
                 ` : ''}

                 <!-- DECLARATION -->
                 ${data.personalInfo.declaration ? `
                   <div style="margin-top: 24pt;">
                     <h2 style="font-size: 11pt; font-weight: bold; color: #010c1e; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 2pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">DECLARATION</h2>
                     <p style="font-size: 9.5pt; font-style: italic; color: #475569; line-height: 1.35; margin: 0; text-align: left;">${data.personalInfo.declaration}</p>
                   </div>
                 ` : ''}
              </td>

              <!-- Right Sidebar Column: 32% width with deep navy background -->
              <td width="32%" valign="top" style="width: 32%; background-color: #1b324d; padding: 25pt 15pt 15pt 15pt; font-family: 'Calibri', 'Arial', sans-serif; color: #ffffff;">
                 
                 <!-- Profile Photo -->
                 ${hasPhoto ? `
                   <div style="text-align: center; margin-bottom: 20pt;">
                     <div style="width: ${data.personalInfo.photoSize ?? 112}px; height: ${data.personalInfo.photoSize ?? 112}px; border: ${data.personalInfo.photoBorder ?? 4}px solid rgba(255,255,255,0.2); border-radius: 50%; overflow: hidden; display: inline-block; box-sizing: border-box; background: rgba(0, 0, 0, 0.1); margin: 0 auto; text-align: center;">
                       <div style="line-height: ${data.personalInfo.photoSize ?? 112}px; font-size: 9pt; color: #cbd5e1; font-weight: bold; font-family: 'Arial', sans-serif;">[ Photo ]</div>
                     </div>
                   </div>
                 ` : ''}

                 <!-- SKILLS -->
                 ${data.skills && data.skills.length > 0 ? `
                   <div style="margin-bottom: 16pt;">
                     <h3 style="font-size: 11pt; font-weight: bold; color: #ffffff; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">SKILLS</h3>
                     <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
                       ${data.skills.map(skill => `
                         <tr><td style="font-size: 9.5pt; color: #f8fafc; padding-bottom: 4pt; padding-left: 2px;">&bull; &nbsp;${skill}</td></tr>
                       `).join('')}
                     </table>
                   </div>
                 ` : ''}

                 <!-- EDUCATION -->
                 ${educationHtmlNested ? `
                   <div style="margin-bottom: 16pt;">
                     <h3 style="font-size: 11pt; font-weight: bold; color: #ffffff; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">EDUCATION</h3>
                     ${educationHtmlNested}
                   </div>
                 ` : ''}

                 <!-- LANGUAGES WITH DYNAMIC DOT INDICATORS FOR WORD -->
                 ${data.languages && data.languages.length > 0 ? `
                   <div style="margin-bottom: 16pt;">
                     <h3 style="font-size: 11pt; font-weight: bold; color: #ffffff; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">LANGUAGES</h3>
                     <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
                       ${data.languages.map(lang => {
                         const lNormalized = lang.toLowerCase();
                         let dotsText = "&bull;&bull;&bull;&bull;&bull;";
                         let levelText = "";
                         if (lNormalized.includes("intermediate")) {
                           dotsText = "&bull;&bull;&bull;&deg;&deg;";
                           levelText = "Intermediate";
                         } else if (lNormalized.includes("proficient") || lNormalized.includes("fluent")) {
                           dotsText = "&bull;&bull;&bull;&bull;&bull;";
                           levelText = "Proficient";
                         } else if (lNormalized.includes("basic") || lNormalized.includes("beginner")) {
                           dotsText = "&bull;&bull;&deg;&deg;&deg;";
                           levelText = "Basic";
                         }
                         const cleanName = lang.replace(/\(.*\)/g, '').replace(/-.*/g, '').trim();
                         return `
                           <tr>
                             <td align="left" style="font-size: 9.5pt; color: #ffffff; font-weight: bold; padding-bottom: 5pt;">
                               ${cleanName}
                               ${levelText ? `<span style="font-size: 8pt; color: #cbd5e1; display: block; font-weight: normal; margin-top: 1px;">${levelText}</span>` : ''}
                             </td>
                             <td align="right" style="font-size: 10pt; color: #cbd5e1; font-family: 'Arial', sans-serif; font-weight: bold; padding-bottom: 5pt; text-align: right;">
                               ${dotsText}
                             </td>
                           </tr>
                         `;
                       }).join('')}
                     </table>
                   </div>
                 ` : ''}

                 <!-- CERTIFICATIONS -->
                 ${data.certifications && data.certifications.length > 0 ? `
                   <div style="margin-bottom: 16pt;">
                     <h3 style="font-size: 11pt; font-weight: bold; color: #ffffff; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">CERTIFICATIONS</h3>
                     <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
                       ${data.certifications.map(cert => `
                         <tr><td style="font-size: 9.5pt; color: #f8fafc; padding-bottom: 4pt; padding-left: 2px;">&bull; &nbsp;${cert}</td></tr>
                       `).join('')}
                     </table>
                   </div>
                 ` : ''}

                 <!-- INTERESTS -->
                 ${data.interests && data.interests.length > 0 ? `
                   <div style="margin-bottom: 16pt;">
                     <h3 style="font-size: 11pt; font-weight: bold; color: #ffffff; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 2pt; margin-top: 5pt; margin-bottom: 8pt; font-family: 'Arial', sans-serif; letter-spacing: 0.5pt;">INTERESTS</h3>
                     <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
                       ${data.interests.map(interest => `
                         <tr><td style="font-size: 9.5pt; color: #f8fafc; padding-bottom: 4pt; padding-left: 2px;">&bull; &nbsp;${interest}</td></tr>
                       `).join('')}
                     </table>
                   </div>
                 ` : ''}
              </td>
            </tr>
          </table>

        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAsRtf = () => {
    const fileName = `resume_${(data.personalInfo.fullName || 'builder').replace(/\\s+/g, '_').toLowerCase()}.rtf`;
    
    let rtf = '{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033\n';
    rtf += '{\\fonttbl{\\f0\\fnil\\fcharset0 Helvetica;}{\\f1\\fswiss\\fcharset0 Arial;}{\\f2\\fnil\\fcharset0 Calibri;}}\n';
    rtf += '{\\colortbl ;\\red27\\green50\\blue77;\\red223\\green33\\blue130;\\red71\\green85\\blue105;\\red203\\green213\\blue225;}\n';
    rtf += '\\margl1440\\margr1440\\margt1440\\margb1440\n';
    rtf += '\\viewkind4\\uc1\n\n';
    
    const name = data.personalInfo.fullName || 'YOUR NAME';
    rtf += `{\\f1\\fs48\\b\\cf1 ${name.toUpperCase()}}\\par\\line\n`;
    
    const contactsList = [
      data.personalInfo.phone,
      data.personalInfo.email,
      data.personalInfo.location,
      data.personalInfo.linkedin ? 'LinkedIn: ' + data.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '') : '',
      data.personalInfo.portfolio ? 'Portfolio: ' + data.personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '') : ''
    ].filter(Boolean);
    rtf += `{\\f2\\fs19\\cf3 ${contactsList.join('   |   ')}}\\par\\line\n`;
    rtf += '\\cf4\\fs2________________________________________________________________________________\\par\\line\\cf0\\fs20\n\n';
    
    if (data.personalInfo.summary) {
      rtf += '{\\f1\\fs24\\b\\cf1 PROFILE}\\par\\line\n';
      const escapedText = data.personalInfo.summary
        .replace(/\\/g, '\\\\')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/\n/g, '\\par\n');
      
      const parts = escapedText.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      const rtfSummary = parts.map(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return `\\b ${part.slice(2, -2)}\\b0 `;
        } else if (part.startsWith('*') && part.endsWith('*')) {
          return `\\i ${part.slice(1, -1)}\\i0 `;
        }
        return part;
      }).join('');
      
      rtf += `{\\f2\\fs20\\cf0 ${rtfSummary}}\\par\\line\\line\n\n`;
    }
    
    if (data.experience && data.experience.length > 0 && data.experience[0].title) {
      rtf += '{\\f1\\fs24\\b\\cf1 EXPERIENCE}\\par\\line\n';
      data.experience.forEach(exp => {
        if (!exp.title && !exp.company) return;
        rtf += `{\\f2\\fs21\\b\\cf0 ${exp.title}}   {\\f2\\fs18\\b\\cf3 ${exp.duration || ''}}\\par\n`;
        rtf += `{\\f2\\fs19\\b\\cf2 ${exp.company || ''}}   {\\f2\\fs18\\cf3 ${exp.location || ''}}\\par\n`;
        
        if (exp.description && exp.description.length > 0) {
          exp.description.forEach(bullet => {
            if (!bullet) return;
            rtf += `{\\f2\\fs19\\cf0 \\bullet  ${bullet}}\\par\n`;
          });
        }
        rtf += '\\par\n';
      });
      rtf += '\\line\n';
    }
    
    const activeProjects = data.projects.filter(p => p.title || p.description);
    if (activeProjects.length > 0) {
      rtf += '{\\f1\\fs24\\b\\cf1 KEY PROJECTS}\\par\\line\n';
      activeProjects.forEach(proj => {
        rtf += `{\\f2\\fs20\\b\\cf0 ${proj.title}}   {\\f2\\fs18\\cf2 ${proj.link || ''}}\\par\n`;
        rtf += `{\\f2\\fs19\\cf0 ${proj.description || ''}}\\par\\line\n`;
      });
      rtf += '\\line\n';
    }
    
    const activeEducation = data.education.filter(e => e.degree || e.institution);
    if (activeEducation.length > 0) {
      rtf += '{\\f1\\fs24\\b\\cf1 EDUCATION}\\par\\line\n';
      activeEducation.forEach(edu => {
        rtf += `{\\f2\\fs20\\b\\cf0 ${edu.degree || 'Degree'}}   {\\f2\\fs18\\cf3 ${edu.duration || ''}}\\par\n`;
        rtf += `{\\f2\\fs19\\i\\cf0 ${edu.institution || ''}}${edu.location ? `, ${edu.location}` : ''}\\par\n`;
        if (edu.score) {
          rtf += `{\\f2\\fs18\\cf3 Score: ${edu.score}}\\par\n`;
        }
        rtf += '\\par\n';
      });
      rtf += '\\line\n';
    }
    
    let hasSidebarContent = (data.skills && data.skills.length > 0) || 
                            (data.languages && data.languages.length > 0) ||
                            (data.certifications && data.certifications.length > 0) ||
                            (data.interests && data.interests.length > 0);
                            
    if (hasSidebarContent) {
      rtf += '{\\f1\\fs24\\b\\cf1 ADDITIONAL SKILLS & QUALIFICATIONS}\\par\\line\n';
      
      if (data.skills && data.skills.length > 0) {
        rtf += `{\\f2\\fs20\\b\\cf3 SKILLS: } {\\f2\\fs20\\cf0 ${data.skills.join(', ')}}\\par\\line\n`;
      }
      
      if (data.languages && data.languages.length > 0) {
        rtf += `{\\f2\\fs20\\b\\cf3 LANGUAGES: } {\\f2\\fs20\\cf0 ${data.languages.join(', ')}}\\par\\line\n`;
      }
      
      if (data.certifications && data.certifications.length > 0) {
        rtf += `{\\f2\\fs20\\b\\cf3 CERTIFICATIONS: } {\\f2\\fs20\\cf0 ${data.certifications.join(', ')}}\\par\\line\n`;
      }
      
      if (data.interests && data.interests.length > 0) {
        rtf += `{\\f2\\fs20\\b\\cf3 INTERESTS: } {\\f2\\fs20\\cf0 ${data.interests.join(', ')}}\\par\\line\n`;
      }
      rtf += '\\line\n';
    }
    
    const hasPersonalDetails = !!(
      data.personalInfo.fatherName ||
      data.personalInfo.motherName ||
      data.personalInfo.dateOfBirth ||
      data.personalInfo.gender ||
      data.personalInfo.nationality ||
      data.personalInfo.maritalStatus ||
      data.personalInfo.visaStatus ||
      data.personalInfo.permanentAddress
    );
    if (hasPersonalDetails) {
      rtf += '{\\f1\\fs24\\b\\cf1 PERSONAL DETAILS}\\par\\line\n';
      if (data.personalInfo.permanentAddress) rtf += `{\\f2\\fs19\\b\\cf3 Permanent Address:\\tab } {\\f2\\fs19\\cf0 ${data.personalInfo.permanentAddress}}\\par\n`;
      if (data.personalInfo.dateOfBirth) rtf += `{\\f2\\fs19\\b\\cf3 Date of Birth:\\tab } {\\f2\\fs19\\cf0 ${data.personalInfo.dateOfBirth}}\\par\n`;
      if (data.personalInfo.gender) rtf += `{\\f2\\fs19\\b\\cf3 Gender:\\tab } {\\f2\\fs19\\cf0 ${data.personalInfo.gender}}\\par\n`;
      if (data.personalInfo.nationality) rtf += `{\\f2\\fs19\\b\\cf3 Nationality:\\tab } {\\f2\\fs19\\cf0 ${data.personalInfo.nationality}}\\par\n`;
      if (data.personalInfo.maritalStatus) rtf += `{\\f2\\fs19\\b\\cf3 Marital Status:\\tab } {\\f2\\fs19\\cf0 ${data.personalInfo.maritalStatus}}\\par\n`;
      if (data.personalInfo.visaStatus) rtf += `{\\f2\\fs19\\b\\cf3 Visa Status:\\tab } {\\f2\\fs19\\cf0 ${data.personalInfo.visaStatus}}\\par\n`;
      if (data.personalInfo.fatherName) rtf += `{\\f2\\fs19\\b\\cf3 Father's Name:\\tab } {\\f2\\fs19\\cf0 ${data.personalInfo.fatherName}}\\par\n`;
      if (data.personalInfo.motherName) rtf += `{\\f2\\fs19\\b\\cf3 Mother's Name:\\tab } {\\f2\\fs19\\cf0 ${data.personalInfo.motherName}}\\par\n`;
      rtf += '\\line\\line\n';
    }
    
    if (data.personalInfo.declaration) {
      rtf += '{\\f1\\fs24\\b\\cf1 DECLARATION}\\par\\line\n';
      rtf += `{\\f2\\fs19\\i\\cf3 ${data.personalInfo.declaration}}\\par\n`;
    }
    
    rtf += '\n}';
    
    const blob = new Blob([rtf], { type: 'application/rtf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePersonalInfo = (field: keyof ResumeData['personalInfo'], value: any) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const handleFormatSummary = (type: 'bold' | 'italic') => {
    const textarea = summaryTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = data.personalInfo.summary || '';
    const selectedText = text.substring(start, end);

    const tag = type === 'bold' ? '**' : '*';
    const replacement = selectedText ? `${tag}${selectedText}${tag}` : `${tag}word${tag}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    handlePersonalInfo('summary', newText);

    // After state update, restore selection and focus
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newSelectionStart = start + tag.length;
        const newSelectionEnd = selectedText ? end + tag.length : start + tag.length + 4; // 'word' length is 4
        textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
      }
    }, 50);
  };

  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { 
        id: Math.random().toString(), 
        degree: '', 
        institution: '', 
        location: '', 
        duration: '', 
        score: '' 
      }]
    }));
  };

  const removeEducation = (id: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.filter(e => e.id !== id)
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Math.random().toString(),
        title: '',
        company: '',
        location: '',
        duration: '',
        description: ['']
      }]
    }));
  };

  const addProject = () => {
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        id: Math.random().toString(),
        title: '',
        link: '',
        description: ''
      }]
    }));
  };

  const handleOptimizeSummary = async () => {
    if (!data.personalInfo.summary) return;
    setIsOptimizing('summary');
    try {
      const prompt = `Rewrite the following professional summary for a student's resume to make it more professional, impactful, and concise. 
      The student is specializing in the Printing and Packaging industry. 
      Original Summary: "${data.personalInfo.summary}"`;
      
      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const optimized = (response.text || "").trim();
      handlePersonalInfo('summary', optimized);
    } catch (e: any) {
      console.error(e);
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
        alert('Access Denied (403/Forbidden). Please ensure your Gemini API key is correctly set in Settings > Secrets. You may need to select a billing-enabled key for some features.');
      }
    } finally {
      setIsOptimizing(null);
    }
  };

  const handleOptimizeExperience = async (experienceId: string) => {
    const exp = data.experience.find(e => e.id === experienceId);
    if (!exp || exp.description.length === 0) return;
    
    setIsOptimizing(experienceId);
    try {
      const prompt = `Improve the following bullet points for a student's resume experience at "${exp.company}" as a "${exp.title}". 
      Make them action-oriented (using strong verbs like 'Spearheaded', 'Optimized', 'Developed'), professional, and impactful.
      Focus on the Printing and Packaging industry context where appropriate.
      Return the points as a simple list separated by new lines, with no extra text.
      Points:
      ${exp.description.join('\n')}`;
      
      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const optimized = (response.text || "").split('\n').map(s => s.replace(/^\s*[-•*]\s*/, '').trim()).filter(s => s);
      
      setData(prev => ({
        ...prev,
        experience: prev.experience.map(e => e.id === experienceId ? { ...e, description: optimized } : e)
      }));
    } catch (e: any) {
      console.error(e);
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
        alert('Access Denied (403/Forbidden). Please ensure your Gemini API key is correctly set in Settings > Secrets. You may need to select a billing-enabled key for some features.');
      }
    } finally {
      setIsOptimizing(null);
    }
  };

  const handleOptimizeProject = async (projectId: string) => {
    const proj = data.projects.find(p => p.id === projectId);
    if (!proj || !proj.description) return;
    
    setIsOptimizing(projectId);
    try {
      const prompt = `Improve the following project description for a student's resume. 
      Project Title: "${proj.title}"
      Original Description: "${proj.description}"
      Make it professional, outcome-focused, and impactful for the Printing and Packaging industry.
      Return only the rewritten description.`;
      
      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const optimized = (response.text || "").trim();
      
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? { ...p, description: optimized } : p)
      }));
    } catch (e: any) {
      console.error(e);
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
        alert('Access Denied (403/Forbidden). Please ensure your Gemini API key is correctly set in Settings > Secrets. You may need to select a billing-enabled key for some features.');
      }
    } finally {
      setIsOptimizing(null);
    }
  };

  const handlePrint = () => {
    // Show the friendly alert before opening
    alert('Your browser limits trigger actions like Print inside live sandbox frames. To successfully print or save your resume to PDF, please click the "Open in New Tab" button in the top bar of this preview frame, and then print from the new window!');
    
    // Fallback/direct execution: Open in printable window (Student Project printable way)
    const printContent = document.getElementById('printable-resume');
    if (!printContent) {
      alert('Error: Could not find printable content. Please try again.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site or click the "Open in New Tab" button in the top bar to print.');
      return;
    }

    // Get styles from the current document
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>${data.personalInfo.fullName || 'Resume_Student'}</title>
          ${styles}
          <style>
            @page { 
              size: A4; 
              margin: 0; 
            }
            body { 
              background: white !important; 
              padding: 0; 
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-resume { 
              display: flex !important; 
              flex-direction: row !important;
              flex-wrap: nowrap !important;
              align-items: stretch !important;
              visibility: visible !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              width: 210mm !important;
              margin: 0 auto !important;
              background: white !important;
            }
            #printable-resume.single-page-layout {
              height: 297mm !important;
              max-height: 297mm !important;
              overflow: hidden !important;
            }
            #printable-resume.multi-page-layout {
              height: auto !important;
              min-height: 297mm !important;
              max-height: none !important;
              overflow: visible !important;
            }
            #printable-resume-left {
              width: calc(100% - 280px) !important;
              flex: 1 1 auto !important;
              box-sizing: border-box !important;
              height: auto !important;
              min-height: 100% !important;
              -webkit-box-decoration-break: clone !important;
              box-decoration-break: clone !important;
            }
            #printable-resume-right {
              width: 280px !important;
              flex: 0 0 280px !important;
              box-sizing: border-box !important;
              height: auto !important;
              min-height: 100% !important;
              -webkit-box-decoration-break: clone !important;
              box-decoration-break: clone !important;
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="p-0 m-0">
            ${printContent.outerHTML}
          </div>
          <script>
            window.onload = () => {
              const images = Array.from(document.querySelectorAll('img'));
              if (images.length === 0) {
                setTimeout(() => { window.print(); }, 1200);
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
                      setTimeout(() => { window.print(); }, 1200);
                    }
                  };
                }
              });
              
              if (loadedCount === images.length) {
                setTimeout(() => { window.print(); }, 1200);
              }
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Résumé Builder</h1>
          <p className="text-gray-500">Create a professional résumé tailored for the Printing & Packaging industry.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={downloadAsWordDoc}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
            title="Download formatted MS Word document with offline embedded photo support"
          >
            <Download className="w-4 h-4" />
            Download Word (.doc)
          </button>
          <button 
            onClick={downloadAsRtf}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
            title="Download standard Rich Text Format (.rtf) file that is 100% compatible with macOS of Apple Pages and TextEdit"
          >
            <Download className="w-4 h-4" />
            Download for Mac (.rtf)
          </button>
          <button 
            onClick={downloadAsHtml}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
            title="Download universal HTML format that opens directly in any Web Browser"
          >
            <Download className="w-4 h-4" />
            Download HTML
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
          <button 
            onClick={() => handleSaveToDatabase()}
            disabled={isLoadingResumes}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all text-sm font-bold"
            title="Save your resume draft to the central Portal database so admins can view it"
          >
            {isLoadingResumes ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save to Portal
          </button>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to reset your résumé? This will delete your current draft and cannot be undone.")) {
                localStorage.removeItem('resume_builder_data');
                setData({
                  ...initialResumeData,
                  personalInfo: {
                    ...initialResumeData.personalInfo,
                    fullName: user?.name || '',
                    email: user?.email || '',
                  }
                });
                setCurrentStep(0);
              }
            }}
            className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-red-50 transition-all font-sans"
          >
            <Trash2 className="w-4 h-4" />
            Reset Form
          </button>
        </div>
      </div>

      {isIframe && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 text-left space-y-1 print:hidden animate-fade-in shadow-sm font-sans flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <div className="font-bold text-amber-900 text-sm mb-0.5">Printer / PDF Export Tip</div>
            <p className="leading-relaxed">
              Your browser limits trigger actions like <strong>Print</strong> inside live sandbox frames. To successfully print or save your resume to PDF, please click the <strong>"Open in New Tab"</strong> button in the top bar of this preview frame, and then print from the new window!
            </p>
          </div>
        </div>
      )}

      {/* Admin Workspace Panel */}
      {(user?.role === 'admin' || user?.role === 'faculty') && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 print:hidden font-sans text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Résumé Desk</h2>
                <p className="text-xs text-gray-500 font-medium">Manage 5 custom slots or load student submitted résumés</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 text-xs text-gray-500">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span>Loaded Draft: <strong>{currentLoadedName || 'Workspace (Default)'}</strong></span>
              {currentLoadedId && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentLoadedId(null);
                    setCurrentLoadedName(null);
                    setIsSlot(false);
                    setSlotNumber(null);
                    setData({
                      ...initialResumeData,
                      personalInfo: {
                        ...initialResumeData.personalInfo,
                        fullName: user?.name || '',
                        email: user?.email || '',
                      }
                    });
                  }}
                  className="ml-2 underline text-red-500 hover:text-red-700 font-bold"
                >
                  Unload / Reset To Me
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* The 5 Custom slots */}
            <div className="space-y-4">
              <div className="font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Database className="w-4 h-4 text-pink-500" />
                The 5 Dedicated Save-Slots (Multi-Student Creator)
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((slot) => {
                  const slotId = `admin_slot_${slot}`;
                  const slotDoc = dbResumes.find(r => r.id === slotId);
                  const isThisSlotLoaded = currentLoadedId === slotId;
                  
                  return (
                    <div 
                      key={slot} 
                      className={cn(
                        "rounded-2xl p-4 border transition-all flex flex-col justify-between min-h-[140px]",
                        isThisSlotLoaded 
                          ? "border-pink-500 bg-pink-50/20 shadow-sm" 
                          : "border-gray-200 hover:border-pink-200"
                      )}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Slot {slot}</span>
                          {slotDoc && (
                            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" title="Slot contains draft" />
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-gray-800 truncate" title={slotDoc?.studentName || "Empty Slot"}>
                          {slotDoc?.studentName || "Empty Slot"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          {slotDoc ? new Date(slotDoc.updatedAt).toLocaleDateString() : 'Ready for drafts'}
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex gap-1 items-center justify-between">
                        <button
                          type="button"
                          onClick={() => loadSpecificResume(slotId, `Admin Slot ${slot}`, true, slot)}
                          className={cn(
                            "text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all flex-1",
                            isThisSlotLoaded 
                              ? "bg-pink-600 text-white" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          {isThisSlotLoaded ? 'Active' : 'Load'}
                        </button>
                        {slotDoc && (
                          <button
                            type="button"
                            onClick={() => handleDeleteResume(slotId, `Admin Slot ${slot}`)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all"
                            title="Reset Slot to Empty"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isSlot && slotNumber && (
                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 text-xs text-pink-800 flex items-center justify-between gap-4 animate-fade-in mt-2 font-sans">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-pink-600 animate-pulse" />
                    <span>You are editing <strong>Admin Slot {slotNumber}</strong>. Click this save button to update the slot directly.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveToDatabase(slotNumber)}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all shadow-sm"
                  >
                    Save Slot {slotNumber} Active Draft
                  </button>
                </div>
              )}
            </div>

            {/* Student Submissions List */}
            <div className="border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 space-y-3">
              <div className="font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-500" />
                  Student Portal Submissions
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-600 py-0.5 px-2 rounded-full font-bold">
                  {dbResumes.filter(r => !r.isSlot).length}
                </span>
              </div>
              
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {dbResumes.filter(r => !r.isSlot).length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No student submissions available</p>
                ) : (
                  dbResumes.filter(r => !r.isSlot).map((resumeDoc) => {
                    const isThisLoaded = currentLoadedId === resumeDoc.id;
                    return (
                      <div 
                        key={resumeDoc.id} 
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all text-left",
                          isThisLoaded 
                            ? "border-blue-300 bg-blue-50/20" 
                            : "border-gray-100 hover:bg-gray-50"
                        )}
                      >
                        <div className="truncate flex-1">
                          <div className="font-bold text-gray-800 truncate" title={resumeDoc.studentName}>{resumeDoc.studentName}</div>
                          <div className="text-[10px] text-gray-400 truncate">Doc ID: {resumeDoc.id}</div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => loadSpecificResume(resumeDoc.id, resumeDoc.studentName, false)}
                            className={cn(
                              "text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all",
                              isThisLoaded 
                                ? "bg-blue-600 text-white" 
                                : "bg-gray-150 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {isThisLoaded ? 'Active' : 'Load'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteResume(resumeDoc.id, resumeDoc.studentName)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Progress Steps */}
      <div className="hidden md:flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <div key={step.id} className="flex items-center group">
              <button 
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all p-2 rounded-xl",
                  isActive ? "text-pink-600" : isCompleted ? "text-green-600" : "text-gray-400"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isActive ? "border-pink-600 bg-pink-50" : isCompleted ? "border-green-600 bg-green-50" : "border-gray-200"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{step.title}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={cn("w-12 h-[2px] mx-2 mb-6", isCompleted ? "bg-green-600" : "bg-gray-100")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div id="resume-main-layout-container" className="grid grid-cols-1 lg:grid-cols-2 gap-8 sticky top-0">
        <div className="space-y-6 print:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 min-h-[500px] flex flex-col"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
                  {React.createElement(STEPS[currentStep].icon, { className: 'w-6 h-6' })}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{STEPS[currentStep].title}</h2>
              </div>

              <div className="flex-1 space-y-6">
                {currentStep === 0 && (
                  <div className="space-y-6">
                    {/* Photo upload section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100/80 text-left">
                      <div className="relative shrink-0 w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 hover:border-pink-400 transition-colors flex items-center justify-center overflow-hidden group">
                        {data.personalInfo.photo ? (
                          <div 
                            style={{
                              width: `${data.personalInfo.photoSize ?? 112}px`,
                              height: `${data.personalInfo.photoSize ?? 112}px`,
                              borderWidth: `${data.personalInfo.photoBorder ?? 4}px`,
                              borderStyle: 'solid',
                              borderColor: '#db2777'
                            }}
                            className="rounded-full overflow-hidden flex items-center justify-center shadow-inner relative transition-all"
                          >
                            <img 
                              src={data.personalInfo.photo} 
                              alt="Profile Preview" 
                              style={{
                                transform: `scale(${(data.personalInfo.photoScale ?? 100) / 100})`,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              className="transition-transform duration-100 rounded-full"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => handlePersonalInfo('photo', '')}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] uppercase font-black tracking-widest transition-all rounded-full"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-2 text-center select-none pointer-events-none">
                            <Camera className="w-6 h-6 text-slate-400" />
                            <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">ADD PHOTO</span>
                          </div>
                        )}
                        {!data.personalInfo.photo && (
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    handlePersonalInfo('photo', reader.result);
                                    handlePersonalInfo('showPhoto', true);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            title="Choose a profile photo"
                          />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="text-sm font-bold text-slate-800">Profile Photo</div>
                        <p className="text-xs text-slate-500 leading-relaxed">Add a professional headshot. Capture a live photo using your camera or upload a file.</p>
                        
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => startCamera()}
                            className="flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border border-pink-100/50 cursor-pointer shadow-sm"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Take Live Photo
                          </button>
                          
                          <div className="relative">
                            <button
                              type="button"
                              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border border-slate-200 cursor-pointer shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5 rotate-180" />
                              Upload From File
                            </button>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      handlePersonalInfo('photo', reader.result);
                                      handlePersonalInfo('showPhoto', true);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full"
                              title="Upload resume headshot image"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 mt-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handlePersonalInfo('showPhoto', !data.personalInfo.showPhoto)}
                            className={cn(
                              "w-10 h-6 flex items-center rounded-full p-1 transition-all outline-none",
                              data.personalInfo.showPhoto ? "bg-pink-600" : "bg-slate-300"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full bg-white shadow-md transform transition-all",
                              data.personalInfo.showPhoto ? "translate-x-4" : "translate-x-0"
                            )} />
                          </button>
                          <span className="text-xs font-bold text-slate-600">Show photo on resume</span>
                        </div>

                        {data.personalInfo.showPhoto && (
                          <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-4 animate-fade-in text-left">
                            <div className="text-[11px] font-black text-slate-700 uppercase tracking-widest block mb-1">
                              Photo Size & Styling Settings
                            </div>
                            
                            {/* Photo Size / Frame Diameter */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span className="flex items-center gap-1">Frame Size (Diameter): <strong className="text-pink-600 font-bold">{data.personalInfo.photoSize ?? 112}px</strong></span>
                                <span className="text-[10px] text-slate-400">60px - 160px</span>
                              </div>
                              <input 
                                type="range" 
                                min="60" 
                                max="160" 
                                value={data.personalInfo.photoSize ?? 112}
                                onChange={(e) => handlePersonalInfo('photoSize', parseInt(e.target.value))}
                                className="w-full accent-pink-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            {/* Photo Zoom/Scale within frame */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span className="flex items-center gap-1">Zoom Photo Inside Frame: <strong className="text-pink-600 font-bold">{data.personalInfo.photoScale ?? 100}%</strong></span>
                                <span className="text-[10px] text-slate-400">30% - 200%</span>
                              </div>
                              <input 
                                type="range" 
                                min="30" 
                                max="200" 
                                value={data.personalInfo.photoScale ?? 100}
                                onChange={(e) => handlePersonalInfo('photoScale', parseInt(e.target.value))}
                                className="w-full accent-pink-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <p className="text-[9px] text-slate-400 italic mt-0.5 font-sans leading-normal">Drag to shrink or enlarge the face/boundaries inside the frame circles.</p>
                            </div>

                            {/* Border Size */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span className="flex items-center gap-1">Frame Border Size: <strong className="text-pink-600 font-bold">{data.personalInfo.photoBorder ?? 4}px</strong></span>
                                <span className="text-[10px] text-slate-400">0px - 10px</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                value={data.personalInfo.photoBorder ?? 4}
                                onChange={(e) => handlePersonalInfo('photoBorder', parseInt(e.target.value))}
                                className="w-full accent-pink-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                        <input 
                          type="text" 
                          value={data.personalInfo.fullName}
                          onChange={(e) => handlePersonalInfo('fullName', e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                        <input 
                          type="email" 
                          value={data.personalInfo.email}
                          onChange={(e) => handlePersonalInfo('email', e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone Number</label>
                        <div className="flex gap-2">
                          <div className="relative shrink-0">
                            <button
                              id="btn-country-selector"
                              type="button"
                              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium h-11 shadow-sm cursor-pointer"
                            >
                              <span className="text-base font-sans">{data.personalInfo.countryFlag || '🇺🇸'}</span>
                              <span className="text-xs text-gray-500 font-bold font-mono">
                                {COUNTRIES.find(c => c.flag === (data.personalInfo.countryFlag || '🇺🇸'))?.dialCode || '+1'}
                              </span>
                              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            <AnimatePresence>
                              {isCountryDropdownOpen && (
                                <>
                                  {/* Close overlay on clicking outside */}
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent" 
                                    onClick={() => {
                                      setIsCountryDropdownOpen(false);
                                      setCountrySearchQuery('');
                                    }} 
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50 space-y-2 text-left"
                                  >
                                    <div className="relative">
                                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Search country name or code..."
                                        value={countrySearchQuery}
                                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-medium text-gray-800"
                                        autoFocus
                                      />
                                    </div>
                                    <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
                                      {COUNTRIES.filter(c => 
                                        c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) || 
                                        c.dialCode.includes(countrySearchQuery) ||
                                        c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
                                      ).map((c) => {
                                        const isSelected = data.personalInfo.countryFlag === c.flag;
                                        return (
                                          <button
                                            key={c.code}
                                            type="button"
                                            onClick={() => {
                                              const selectedFlag = c.flag;
                                              const countryObj = c;
                                              setData((prev) => {
                                                const nextPersonalInfo = {
                                                  ...prev.personalInfo,
                                                  countryFlag: selectedFlag,
                                                };
                                                if (!nextPersonalInfo.phone && countryObj) {
                                                  nextPersonalInfo.phone = countryObj.dialCode + ' ';
                                                } else if (countryObj) {
                                                  const startsWithPlus = nextPersonalInfo.phone.startsWith('+');
                                                  if (startsWithPlus) {
                                                    const match = COUNTRIES.find(c => nextPersonalInfo.phone.startsWith(c.dialCode));
                                                    if (match) {
                                                      nextPersonalInfo.phone = nextPersonalInfo.phone.replace(match.dialCode, countryObj.dialCode);
                                                    } else {
                                                      nextPersonalInfo.phone = countryObj.dialCode + ' ' + nextPersonalInfo.phone;
                                                    }
                                                  } else {
                                                    nextPersonalInfo.phone = countryObj.dialCode + ' ' + nextPersonalInfo.phone;
                                                  }
                                                }
                                                return {
                                                  ...prev,
                                                  personalInfo: nextPersonalInfo,
                                                };
                                              });
                                              setIsCountryDropdownOpen(false);
                                              setCountrySearchQuery('');
                                            }}
                                            className={cn(
                                              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left cursor-pointer",
                                              isSelected 
                                                ? "bg-pink-50 text-pink-700 font-bold" 
                                                : "text-gray-700 hover:bg-gray-50"
                                            )}
                                          >
                                            <span className="flex items-center gap-2">
                                              <span className="text-base font-sans">{c.flag}</span>
                                              <span className="font-medium truncate max-w-[150px]">{c.name}</span>
                                            </span>
                                            <span className="font-mono text-gray-400 font-bold shrink-0">{c.dialCode}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                          <input 
                            id="input-phone-number"
                            type="tel" 
                            value={data.personalInfo.phone}
                            onChange={(e) => handlePersonalInfo('phone', e.target.value)}
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium h-11"
                            placeholder="XXXXX XXXXX"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Location</label>
                        <input 
                          type="text" 
                          value={data.personalInfo.location}
                          onChange={(e) => handlePersonalInfo('location', e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                          placeholder="Chennai, India"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">LinkedIn URL</label>
                      <input 
                        type="url" 
                        value={data.personalInfo.linkedin}
                        onChange={(e) => handlePersonalInfo('linkedin', e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>

                    <div className="border-t border-gray-150 pt-5 mt-5 text-left">
                      <h4 className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-4">Additional Personal Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Father's Name</label>
                          <input 
                            type="text" 
                            value={data.personalInfo.fatherName || ''}
                            onChange={(e) => handlePersonalInfo('fatherName', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                            placeholder="e.g. C.Raja singh"
                          />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mother's Name</label>
                          <input 
                            type="text" 
                            value={data.personalInfo.motherName || ''}
                            onChange={(e) => handlePersonalInfo('motherName', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                            placeholder="e.g. R.Santhakumari"
                          />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                          <input 
                            type="text" 
                            value={data.personalInfo.dateOfBirth || ''}
                            onChange={(e) => handlePersonalInfo('dateOfBirth', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                            placeholder="e.g. 13/07/1997"
                          />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gender</label>
                          <select 
                            value={data.personalInfo.gender || ''}
                            onChange={(e) => handlePersonalInfo('gender', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nationality</label>
                          <input 
                            type="text" 
                            value={data.personalInfo.nationality || ''}
                            onChange={(e) => handlePersonalInfo('nationality', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                            placeholder="e.g. Indian"
                          />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Marital Status</label>
                          <select 
                            value={data.personalInfo.maritalStatus || ''}
                            onChange={(e) => handlePersonalInfo('maritalStatus', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                          >
                            <option value="">Select Marital Status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Visa Status</label>
                          <input 
                            type="text" 
                            value={data.personalInfo.visaStatus || ''}
                            onChange={(e) => handlePersonalInfo('visaStatus', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                            placeholder="e.g. Visiting Visa, Residence Visa"
                          />
                        </div>
                        <div className="space-y-1.5 text-left col-span-1 md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Permanent Address</label>
                          <input 
                            type="text" 
                            value={data.personalInfo.permanentAddress || ''}
                            onChange={(e) => handlePersonalInfo('permanentAddress', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                            placeholder="e.g. 123 Main St, City, State, Country"
                          />
                        </div>
                        <div className="space-y-1.5 text-left col-span-1 md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Declaration Statement</label>
                          <textarea 
                            value={data.personalInfo.declaration || ''}
                            onChange={(e) => handlePersonalInfo('declaration', e.target.value)}
                            rows={3}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                            placeholder="I hereby declare that the above information is true and correct to the best of my knowledge and belief."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Professional summary</label>
                        <div className="flex items-center gap-3">
                          {/* Formatting Controls */}
                          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleFormatSummary('bold')}
                              className="p-1.5 rounded-md flex items-center justify-center transition-all w-8 h-8 text-gray-600 hover:text-pink-600 hover:bg-white hover:shadow-xs active:scale-95"
                              title="Bold highlighted text (Select text first)"
                            >
                              <Bold className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFormatSummary('italic')}
                              className="p-1.5 rounded-md flex items-center justify-center transition-all w-8 h-8 text-gray-600 hover:text-pink-600 hover:bg-white hover:shadow-xs active:scale-95"
                              title="Italicize highlighted text (Select text first)"
                            >
                              <Italic className="w-4 h-4" />
                            </button>
                          </div>

                          <button 
                            onClick={handleOptimizeSummary}
                            disabled={!data.personalInfo.summary || !!isOptimizing}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-pink-600 uppercase hover:text-pink-700 disabled:opacity-50 transition-all"
                          >
                            {isOptimizing === 'summary' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI Optimize
                          </button>
                        </div>
                      </div>
                      <textarea 
                        ref={summaryTextareaRef}
                        value={data.personalInfo.summary}
                        onChange={(e) => handlePersonalInfo('summary', e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all min-h-[200px] font-medium text-gray-700"
                        placeholder="Highlight your key achievements, skills, and career goals specifically for the printing industry..."
                      />
                      <p className="text-[10px] text-gray-400 mt-1 pl-1">
                        💡 Highlight text and click <strong>B</strong> or <em>I</em> to format specific words, or type <code className="bg-gray-100 px-1 rounded font-mono text-gray-600">**bold**</code> and <code className="bg-gray-100 px-1 rounded font-mono text-gray-600">*italic*</code> manually.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 text-blue-700">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-xs">A strong summary clearly states your current status as a student and the specific printing/packaging niche you're passionate about.</p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    {data.education.map((edu, idx) => (
                      <div key={edu.id} className="relative p-6 bg-gray-50 rounded-2xl border border-gray-100 group">
                        {data.education.length > 1 && (
                          <button 
                            onClick={() => removeEducation(edu.id)}
                            className="absolute -top-2 -right-2 p-1.5 bg-white border border-gray-200 text-red-500 rounded-lg shadow-sm hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="Degree (e.g., B.E. Printing Tech)"
                            className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500"
                          />
                          <input 
                            type="text" 
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                            placeholder="Institution"
                            className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500"
                          />
                          <input 
                            type="text" 
                            value={edu.duration}
                            onChange={(e) => updateEducation(edu.id, 'duration', e.target.value)}
                            placeholder="Duration (e.g., 2020 - 2024)"
                            className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500"
                          />
                          <input 
                            type="text" 
                            value={edu.score}
                            onChange={(e) => updateEducation(edu.id, 'score', e.target.value)}
                            placeholder="GPA / Percentage"
                            className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={addEducation}
                      className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-sm hover:border-pink-300 hover:text-pink-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add More Education
                    </button>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-700 uppercase">Work Experience</h3>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Do you want to populate/reset the working experience with the specific Endless Spark & Kumaran photographic timeline?")) {
                              setData(prev => ({
                                ...prev,
                                experience: [
                                  {
                                    id: 'exp-1',
                                    title: 'PACKAGING Engineer',
                                    company: 'Endless Spark',
                                    location: 'Coimbatore',
                                    duration: 'Jan 10thrd, 2024, to Till Now.',
                                    description: ['Add Achievement']
                                  },
                                  {
                                    id: 'exp-2',
                                    title: 'DTP Artist',
                                    company: 'Kumaran photographic',
                                    location: '',
                                    duration: 'August 10th, 2017, to Dec 30th, 2019.',
                                    description: ['Add Achievement']
                                  }
                                ]
                              }));
                            }
                          }}
                          className="text-[10px] font-bold text-pink-600 uppercase tracking-wider bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Load Professional Defaults
                        </button>
                      </div>
                      {data.experience.map((exp) => (
                        <div key={exp.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative group">
                          <button 
                            onClick={() => setData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== exp.id) }))}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              value={exp.title}
                              onChange={(e) => setData(prev => ({
                                ...prev,
                                experience: prev.experience.map(x => x.id === exp.id ? { ...x, title: e.target.value } : x)
                              }))}
                              placeholder="Job Title / Internship Role"
                              className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500"
                            />
                            <input 
                              type="text" 
                              value={exp.company}
                              onChange={(e) => setData(prev => ({
                                ...prev,
                                experience: prev.experience.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x)
                              }))}
                              placeholder="Company"
                              className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              value={exp.duration}
                              onChange={(e) => setData(prev => ({
                                ...prev,
                                experience: prev.experience.map(x => x.id === exp.id ? { ...x, duration: e.target.value } : x)
                              }))}
                              placeholder="Dates (e.g., Jan 10thrd, 2024, to Till Now.)"
                              className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500"
                            />
                            <input 
                              type="text" 
                              value={exp.location || ''}
                              onChange={(e) => setData(prev => ({
                                ...prev,
                                experience: prev.experience.map(x => x.id === exp.id ? { ...x, location: e.target.value } : x)
                              }))}
                              placeholder="Location (e.g., Coimbatore)"
                              className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Description Bullets</label>
                              <button 
                                onClick={() => handleOptimizeExperience(exp.id)}
                                disabled={exp.description.length === 0 || !!isOptimizing}
                                className="flex items-center gap-1 text-[10px] font-bold text-pink-600 uppercase hover:text-pink-700"
                              >
                                {isOptimizing === exp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                AI Enhance
                              </button>
                            </div>
                            {exp.description.map((desc, dIdx) => (
                              <div key={dIdx} className="flex gap-2">
                                <input 
                                  type="text"
                                  value={desc}
                                  onChange={(e) => {
                                    const newDesc = [...exp.description];
                                    newDesc[dIdx] = e.target.value;
                                    setData(prev => ({
                                      ...prev,
                                      experience: prev.experience.map(x => x.id === exp.id ? { ...x, description: newDesc } : x)
                                    }));
                                  }}
                                  placeholder="e.g., Assisted in offset printing plate preparation..."
                                  className="flex-1 bg-white border-gray-200 rounded-xl px-4 py-2 text-sm"
                                />
                                <button 
                                  onClick={() => {
                                    const newDesc = exp.description.filter((_, i) => i !== dIdx);
                                    setData(prev => ({
                                      ...prev,
                                      experience: prev.experience.map(x => x.id === exp.id ? { ...x, description: newDesc } : x)
                                    }));
                                  }}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button 
                              onClick={() => {
                                setData(prev => ({
                                  ...prev,
                                  experience: prev.experience.map(x => x.id === exp.id ? { ...x, description: [...x.description, ''] } : x)
                                }));
                              }}
                              className="text-[10px] text-gray-400 font-bold hover:text-pink-600 transition-all flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Achievement
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={addExperience}
                        className="w-full py-3 bg-pink-50 text-pink-600 rounded-xl font-bold text-xs hover:bg-pink-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Work Experience / Internship
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-700 uppercase">Key Projects</h3>
                      {data.projects.map((proj) => (
                        <div key={proj.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative group">
                           <button 
                            onClick={() => setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== proj.id) }))}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                           <input 
                              type="text" 
                              value={proj.title}
                              onChange={(e) => setData(prev => ({
                                ...prev,
                                projects: prev.projects.map(x => x.id === proj.id ? { ...x, title: e.target.value } : x)
                              }))}
                              placeholder="Project Title"
                              className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm"
                            />
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                                <button 
                                  onClick={() => handleOptimizeProject(proj.id)}
                                  disabled={!proj.description || !!isOptimizing}
                                  className="flex items-center gap-1 text-[10px] font-bold text-pink-600 uppercase hover:text-pink-700"
                                >
                                  {isOptimizing === proj.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                  AI Rewrite
                                </button>
                              </div>
                              <textarea 
                                value={proj.description}
                                onChange={(e) => setData(prev => ({
                                  ...prev,
                                  projects: prev.projects.map(x => x.id === proj.id ? { ...x, description: e.target.value } : x)
                                }))}
                                placeholder="Briefly describe the project, tools used, and your role..."
                                className="w-full bg-white border-gray-200 rounded-xl px-4 py-2 text-sm min-h-[80px]"
                              />
                            </div>
                        </div>
                      ))}
                      <button 
                        onClick={addProject}
                        className="w-full py-3 bg-pink-50 text-pink-600 rounded-xl font-bold text-xs hover:bg-pink-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Academic Project
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 text-left">
                      <p className="text-xs text-pink-700 leading-relaxed font-medium">
                        <strong>💡 Multi-Add Pro Tip:</strong> You can add multiple items at once by separating them with commas (e.g. <i>Photoshop, Illustrator, Packaging Design</i>). Press <b>Enter</b> or click the "+ Add" button.
                      </p>
                    </div>

                    {/* Technical Skills */}
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-700 uppercase ml-1">Technical Skills</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkills(newSkill);
                            }
                          }}
                          placeholder="e.g. Offset Printing, InDesign, Flexography..."
                          className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSkills(newSkill)}
                          className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 rounded-xl text-xs uppercase tracking-wide transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                        {(!data.skills || data.skills.length === 0) ? (
                          <span className="text-xs text-slate-400 italic p-1">No skills added yet.</span>
                        ) : (
                          data.skills.map((skill, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all hover:border-pink-300">
                              {skill}
                              <button 
                                type="button"
                                onClick={() => setData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }))}
                                className="text-pink-400 hover:text-pink-800 p-0.5 rounded-full hover:bg-pink-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Certifications Section */}
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-700 uppercase ml-1">Certifications</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCertifications(newCertification);
                            }
                          }}
                          placeholder="e.g. Adobe Certified Professional, Packaging Design Specialist..."
                          className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCertifications(newCertification)}
                          className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 rounded-xl text-xs uppercase tracking-wide transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                        {(!data.certifications || data.certifications.length === 0) ? (
                          <span className="text-xs text-slate-400 italic p-1">No certifications added yet.</span>
                        ) : (
                          data.certifications.map((cert, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all hover:border-pink-300">
                              {cert}
                              <button 
                                type="button"
                                onClick={() => setData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== idx) }))}
                                className="text-pink-400 hover:text-pink-800 p-0.5 rounded-full hover:bg-pink-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-700 uppercase ml-1">Languages</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddLanguages(newLanguage);
                            }
                          }}
                          placeholder="e.g. English, Tamil, Hindi..."
                          className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddLanguages(newLanguage)}
                          className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 rounded-xl text-xs uppercase tracking-wide transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                        {(!data.languages || data.languages.length === 0) ? (
                          <span className="text-xs text-slate-400 italic p-1">No languages added yet.</span>
                        ) : (
                          data.languages.map((lang, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all hover:border-green-300">
                              {lang}
                              <button 
                                type="button"
                                onClick={() => setData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== idx) }))}
                                className="text-green-400 hover:text-green-800 p-0.5 rounded-full hover:bg-green-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Interests */}
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-700 uppercase ml-1">Interests</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInterests(newInterest);
                            }
                          }}
                          placeholder="e.g. Cooking, Planting, Reading..."
                          className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddInterests(newInterest)}
                          className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 rounded-xl text-xs uppercase tracking-wide transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                        {(!data.interests || data.interests.length === 0) ? (
                          <span className="text-xs text-slate-400 italic p-1">No interests added yet.</span>
                        ) : (
                          data.interests.map((interest, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all hover:border-blue-300">
                              {interest}
                              <button 
                                type="button"
                                onClick={() => setData(prev => ({ ...prev, interests: prev.interests.filter((_, i) => i !== idx) }))}
                                className="text-blue-400 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6 text-center py-10">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Your Résumé is Ready!</h3>
                      <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm leading-relaxed">
                        You've completed all the steps. Review the preview on the right and click the buttons below to export your résumé.
                      </p>
                    </div>

                    {/* Sizing & Slicing Prevention Control Card */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left max-w-md mx-auto space-y-4 shadow-sm font-sans">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-pink-600" />
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Print Sizing & Page Flow Tuning</h4>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        If your résumé got cut off while printing to PDF, or the preview does not show all the content, toggle the page flow mode below.
                      </p>

                      {/* 1. Single Page vs Multi Page Flow */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Page Layout & Flow Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handlePersonalInfo('multiPageLayout', false)}
                            className={cn(
                              "py-2 px-3 rounded-xl font-bold text-xs border transition-all flex flex-col items-center gap-0.5",
                              !data.personalInfo.multiPageLayout 
                                ? "bg-white border-pink-500 text-pink-700 shadow-sm ring-1 ring-pink-400" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <span>Single-Page A4</span>
                            <span className="text-[9px] text-slate-400 font-medium font-sans">Strict 1-Page limit</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handlePersonalInfo('multiPageLayout', true)}
                            className={cn(
                              "py-2 px-3 rounded-xl font-bold text-xs border transition-all flex flex-col items-center gap-0.5",
                              data.personalInfo.multiPageLayout 
                                ? "bg-white border-pink-500 text-pink-700 shadow-sm ring-1 ring-pink-400" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <span>Multi-Page Flow</span>
                            <span className="text-[9px] text-slate-400 font-medium font-sans">Auto grow & break</span>
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-400 italic font-sans leading-normal mt-1">
                          * Choose <strong>Multi-Page Flow</strong> if your résumé is too long and gets clipped or cut off in print or screen previews!
                        </p>
                      </div>

                      {/* 2. Photo adjustments shortcut */}
                      {data.personalInfo.showPhoto && data.personalInfo.photo && (
                        <div className="border-t border-slate-200/60 pt-3.5 space-y-3">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Adjust Photo Frame Size</label>
                          
                          {/* Photo Size Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                              <span>Frame Diameter: <strong className="text-pink-600">{data.personalInfo.photoSize ?? 112}px</strong></span>
                              <span className="text-[10px] text-slate-400">60px - 160px</span>
                            </div>
                            <input 
                              type="range" 
                              min="60" 
                              max="160" 
                              value={data.personalInfo.photoSize ?? 112}
                              onChange={(e) => handlePersonalInfo('photoSize', parseInt(e.target.value))}
                              className="w-full accent-pink-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Inner Photo Zoom scale Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                              <span>Photo Zoom Scale: <strong className="text-pink-600">{data.personalInfo.photoScale ?? 100}%</strong></span>
                              <span className="text-[10px] text-slate-400">30% - 200%</span>
                            </div>
                            <input 
                              type="range" 
                              min="30" 
                              max="200" 
                              value={data.personalInfo.photoScale ?? 100}
                              onChange={(e) => handlePersonalInfo('photoScale', parseInt(e.target.value))}
                              className="w-full accent-pink-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 pt-4 max-w-md mx-auto">
                      <button 
                        onClick={downloadAsWordDoc}
                        className="bg-blue-600 text-white w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl hover:translate-y-[-1px]"
                      >
                        <Download className="w-5 h-5" />
                        Download Word (.doc)
                      </button>
                      <button 
                        onClick={downloadAsRtf}
                        className="bg-sky-600 text-white w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-sky-700 transition-all shadow-xl hover:translate-y-[-1px]"
                        title="Download standard Rich Text Format (.rtf) file that is 100% compatible with macOS of Apple Pages and TextEdit"
                      >
                        <Download className="w-5 h-5" />
                        Download for Mac (.rtf)
                      </button>
                      <button 
                        onClick={downloadAsHtml}
                        className="bg-emerald-600 text-white w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl hover:translate-y-[-1px]"
                      >
                        <Download className="w-5 h-5" />
                        Download HTML (Browser Compatible)
                      </button>
                      <button 
                        onClick={handlePrint}
                        className="bg-gray-900 text-white w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl hover:translate-y-[-1px]"
                      >
                        <Printer className="w-5 h-5" />
                        Print / Save as PDF
                      </button>
                      <button 
                        onClick={() => {
                          const json = JSON.stringify(data, null, 2);
                          const blob = new Blob([json], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `resume_${data.personalInfo.fullName.replace(/\s+/g, '_').toLowerCase()}.json`;
                          a.click();
                        }}
                        className="bg-white border border-gray-200 text-gray-700 w-full py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                      >
                         <Download className="w-4 h-4" />
                         Backup Data (.json)
                      </button>

                      {isIframe && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 text-left space-y-1 block mt-2 font-sans">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900 mb-0.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Iframe Print Block Detection
                          </div>
                          <p className="leading-relaxed">
                            Your browser blocks printing triggers inside sandbox views. To save or print your resume as a pristine PDF, click <strong>"Open in New Tab"</strong> or <strong>"Open App"</strong> in the top header first!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-8 mt-auto">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                    currentStep === 0 ? "opacity-0 pointer-events-none" : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1))}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg",
                    currentStep === STEPS.length - 1 ? "opacity-0 pointer-events-none" : "bg-pink-600 text-white hover:bg-pink-700"
                  )}
                >
                  {currentStep === STEPS.length - 2 ? 'Finish & Preview' : 'Next Step'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Live Preview Pane */}
        <div className="lg:block">
          <div className="sticky top-8 bg-gray-200 p-8 rounded-[40px] shadow-inner min-h-[842px] overflow-hidden group print:bg-white print:p-0 print:shadow-none print:rounded-none print:static print:min-h-0 print:h-auto">
            {/* Desktop UI Frame */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 print:hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
            </div>

            <div 
              ref={printRef}
              id="printable-resume"
              className={cn(
                "bg-white rounded-xl shadow-2xl w-full p-0 text-left text-gray-800 font-sans print:p-0 print:shadow-none transition-all duration-500 flex flex-col md:grid md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_280px]",
                data.personalInfo.multiPageLayout 
                  ? "multi-page-layout min-h-auto h-auto overflow-visible" 
                  : "single-page-layout min-h-[950px] h-[297mm] max-h-[297mm] overflow-hidden"
              )}
            >
              {/* Left Column (Main details): 1fr width */}
              <div id="printable-resume-left" className="p-8 sm:p-10 flex flex-col h-full bg-white text-gray-800">
                {/* Name */}
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight uppercase mb-3 text-left">
                  {data.personalInfo.fullName || 'YOUR NAME'}
                </h1>
                
                {/* Contact information: horizontal list with clean spacing */}
                <div className="flex flex-wrap gap-y-2 gap-x-4 text-[11px] font-semibold text-gray-600 mb-6 pb-4 border-b border-gray-150 text-left">
                  {data.personalInfo.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      {data.personalInfo.countryFlag && (
                        <span className="text-sm font-sans mr-0.5" title="Country Flag">{data.personalInfo.countryFlag}</span>
                      )}
                      <span>{data.personalInfo.phone}</span>
                    </div>
                  )}
                  {data.personalInfo.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      <span>{data.personalInfo.email}</span>
                    </div>
                  )}
                  {data.personalInfo.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      <span>{data.personalInfo.location}</span>
                    </div>
                  )}
                  {data.personalInfo.linkedin && (
                    <div className="flex items-center gap-1">
                      <Linkedin className="w-3 h-3 text-gray-500" />
                      <span>{data.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}</span>
                    </div>
                  )}
                  {data.personalInfo.portfolio && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-gray-500" />
                      <span>{data.personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </div>
                  )}
                </div>

                {/* PROFILE */}
                {data.personalInfo.summary && (
                  <div className="mb-6 h-auto text-left">
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest pb-1 mb-2.5 border-b border-gray-300">
                      PROFILE
                    </h2>
                    <p className="text-[11px] leading-relaxed text-justify text-gray-700 font-medium">
                      {parseMarkdownToReact(data.personalInfo.summary)}
                    </p>
                  </div>
                )}

                {/* EXPERIENCE */}
                {data.experience && data.experience.length > 0 && (
                  <div className="mb-6 text-left">
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest pb-1 mb-3.5 border-b border-gray-300">
                      EXPERIENCE
                    </h2>
                    <div className="space-y-4">
                      {data.experience.map((exp) => (
                        <div key={exp.id} className="text-left break-inside-avoid page-break-inside-avoid">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="text-xs font-bold text-gray-900">{exp.title}</h4>
                            <span className="text-[10px] font-bold text-gray-500 block shrink-0">{exp.duration}</span>
                          </div>
                          <div className="flex justify-between items-baseline mb-1.5 text-[10px]">
                            <span className="text-pink-600 font-bold uppercase tracking-wide">{exp.company}</span>
                            {exp.location && <span className="text-gray-500 font-semibold">{exp.location}</span>}
                          </div>
                          <ul className="list-disc pl-4 space-y-1">
                            {exp.description.map((bullet, idx) => bullet && (
                              <li key={idx} className="text-[11px] text-gray-600 leading-snug font-medium text-justify">
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PROJECTS */}
                {data.projects && data.projects.length > 0 && data.projects.some(proj => proj.title || proj.description) && (
                  <div className="mb-6 text-left">
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest pb-1 mb-3 border-b border-gray-300">
                      KEY PROJECTS
                    </h2>
                    <div className="space-y-3">
                      {data.projects.map((proj) => (proj.title || proj.description) && (
                        <div key={proj.id} className="text-left text-[11px] break-inside-avoid page-break-inside-avoid">
                          {proj.title && (
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h4 className="font-bold text-gray-900">{proj.title}</h4>
                              {proj.link && <span className="text-[9px] text-blue-500 font-medium truncate max-w-[120px]">{proj.link.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                            </div>
                          )}
                          {proj.description && (
                            <p className="text-gray-600 leading-relaxed font-semibold text-left">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PERSONAL DETAILS */}
                {(data.personalInfo.visaStatus || 
                  data.personalInfo.nationality || 
                  data.personalInfo.dateOfBirth || 
                  data.personalInfo.maritalStatus || 
                  data.personalInfo.fatherName || 
                  data.personalInfo.motherName || 
                  data.personalInfo.gender ||
                  data.personalInfo.permanentAddress) && (
                  <div className="mb-6 text-left break-inside-avoid page-break-inside-avoid">
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest pb-1 mb-3 border-b border-gray-300">
                      PERSONAL DETAILS
                    </h2>
                    <div className="space-y-1.5 text-xs text-gray-800 leading-relaxed">
                      {data.personalInfo.permanentAddress && (
                        <div className="grid grid-cols-[140px_16px_1fr] items-start">
                          <span className="font-bold text-gray-900">Permanent Address</span>
                          <span className="font-bold text-gray-950 text-center">:</span>
                          <span className="font-normal text-gray-900 pl-6">{data.personalInfo.permanentAddress}</span>
                        </div>
                      )}
                      {data.personalInfo.visaStatus && (
                        <div className="grid grid-cols-[140px_16px_1fr] items-baseline">
                          <span className="font-bold text-gray-900">Visa Status</span>
                          <span className="font-bold text-gray-950 text-center">:</span>
                          <span className="font-normal text-gray-900 pl-6">{data.personalInfo.visaStatus}</span>
                        </div>
                      )}
                      {data.personalInfo.nationality && (
                        <div className="grid grid-cols-[140px_16px_1fr] items-baseline">
                          <span className="font-bold text-gray-900">Nationality</span>
                          <span className="font-bold text-gray-950 text-center">:</span>
                          <span className="font-normal text-gray-900 pl-6">{data.personalInfo.nationality}</span>
                        </div>
                      )}
                      {data.personalInfo.dateOfBirth && (
                        <div className="grid grid-cols-[140px_16px_1fr] items-baseline">
                          <span className="font-bold text-gray-900">Date of birth</span>
                          <span className="font-bold text-gray-950 text-center">:</span>
                          <span className="font-normal text-gray-900 pl-6">{data.personalInfo.dateOfBirth}</span>
                        </div>
                      )}
                      {data.personalInfo.maritalStatus && (
                        <div className="grid grid-cols-[140px_16px_1fr] items-baseline">
                          <span className="font-bold text-gray-900">Marital Status</span>
                          <span className="font-bold text-gray-950 text-center">:</span>
                          <span className="font-normal text-gray-900 pl-6">{data.personalInfo.maritalStatus}</span>
                        </div>
                      )}
                      {data.personalInfo.fatherName && (
                        <div className="grid grid-cols-[140px_16px_1fr] items-baseline">
                          <span className="font-bold text-gray-900">Father{"'"}s Name</span>
                          <span className="font-bold text-gray-950 text-center">:</span>
                          <span className="font-normal text-gray-900 pl-6">{data.personalInfo.fatherName}</span>
                        </div>
                      )}
                      {data.personalInfo.motherName && (
                        <div className="grid grid-cols-[140px_16px_1fr] items-baseline">
                          <span className="font-bold text-gray-900">Mother{"'"}s Name</span>
                          <span className="font-bold text-gray-950 text-center">:</span>
                          <span className="font-normal text-gray-900 pl-6">{data.personalInfo.motherName}</span>
                        </div>
                      )}
                      {data.personalInfo.gender && (
                        <div className="grid grid-cols-[140px_16px_1fr] items-baseline">
                          <span className="font-bold text-gray-900">Gender</span>
                          <span className="font-bold text-gray-950 text-center">:</span>
                          <span className="font-normal text-gray-900 pl-6">{data.personalInfo.gender}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DECLARATION */}
                {data.personalInfo.declaration && (
                  <div className="mt-auto pt-4 text-left break-inside-avoid page-break-inside-avoid">
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest pb-1 mb-2.5 border-b border-gray-300">
                      DECLARATION
                    </h2>
                    <p className="text-[11px] leading-relaxed text-gray-600 font-medium text-left italic">
                      {data.personalInfo.declaration}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column (Dark Blue Sidebar): 280px width */}
              <div id="printable-resume-right" className="bg-[#1b324d] text-white p-6 pt-10 flex flex-col h-full col-span-1 md:shrink-0 text-left">
                {/* Profile Photo */}
                {data.personalInfo.showPhoto && data.personalInfo.photo && (
                  <div className="mb-8 text-center bg-transparent flex justify-center">
                    <div 
                      style={{
                        width: `${data.personalInfo.photoSize ?? 112}px`,
                        height: `${data.personalInfo.photoSize ?? 112}px`,
                        borderWidth: `${data.personalInfo.photoBorder ?? 4}px`,
                        borderStyle: 'solid',
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      }}
                      className="rounded-full overflow-hidden mx-auto shadow-md flex items-center justify-center bg-slate-900/10"
                    >
                      <img 
                        src={data.personalInfo.photo} 
                        alt={data.personalInfo.fullName || 'Profile Photo'} 
                        style={{
                          transform: `scale(${(data.personalInfo.photoScale ?? 100) / 100})`,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        className="transition-transform duration-200 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* SKILLS */}
                {data.skills && data.skills.length > 0 && (
                  <div className="mb-6 text-left break-inside-avoid page-break-inside-avoid">
                    <h3 className="text-xs font-black uppercase tracking-widest pb-1 mb-3 border-b border-white/20 text-white/95">
                      SKILLS
                    </h3>
                    <div className="space-y-2 text-[11px] text-white/90 font-semibold leading-relaxed">
                      {data.skills.map((skill, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-white/60">•</span>
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EDUCATION */}
                {data.education && data.education.length > 0 && data.education[0].degree && (
                  <div className="mb-6 text-left break-inside-avoid page-break-inside-avoid">
                    <h3 className="text-xs font-black uppercase tracking-widest pb-1 mb-3 border-b border-white/20 text-white/95">
                      EDUCATION
                    </h3>
                    <div className="space-y-4 text-[11px]">
                      {data.education.map((edu) => (
                        <div key={edu.id} className="text-left font-medium">
                          <div className="font-bold text-white text-xs">{edu.degree}</div>
                          <div className="text-white/80 italic mt-0.5">{edu.institution}</div>
                          <div className="text-white/60 text-[10px] mt-0.5">{edu.duration}</div>
                          {edu.score && <div className="text-white/50 text-[9px] mt-0.5">Score: {edu.score}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LANGUAGES WITH DYNAMIC DOT RATINGS */}
                {data.languages && data.languages.length > 0 && (
                  <div className="mb-6 text-left break-inside-avoid page-break-inside-avoid">
                    <h3 className="text-xs font-black uppercase tracking-widest pb-1 mb-3 border-b border-white/20 text-white/95">
                      LANGUAGES
                    </h3>
                    <div className="space-y-3">
                      {data.languages.map((lang, idx) => {
                        const lNormalized = lang.toLowerCase();
                        let levelText = "";
                        let dotsCount = 5;
                        if (lNormalized.includes("intermediate")) {
                          levelText = "Intermediate";
                          dotsCount = 3;
                        } else if (lNormalized.includes("proficient") || lNormalized.includes("fluent")) {
                          levelText = "Proficient";
                          dotsCount = 5;
                        } else if (lNormalized.includes("basic") || lNormalized.includes("beginner")) {
                          levelText = "Basic";
                          dotsCount = 2;
                        }

                        const cleanName = lang.replace(/\(.*\)/g, '').replace(/-.*/g, '').trim();

                        return (
                          <div key={idx} className="flex justify-between items-center text-[11px] font-semibold text-white/95">
                            <div>
                              <span>{cleanName}</span>
                              {levelText && <span className="text-[9px] text-white/60 block font-normal">{levelText}</span>}
                            </div>
                            <div className="flex gap-0.5 text-white/80 shrink-0 select-none font-sans">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className="text-[8px] leading-none">
                                  {i < dotsCount ? '⬤' : '○'}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CERTIFICATIONS */}
                {data.certifications && data.certifications.length > 0 && (
                  <div className="mb-6 text-left break-inside-avoid page-break-inside-avoid">
                    <h3 className="text-xs font-black uppercase tracking-widest pb-1 mb-3 border-b border-white/20 text-white/95">
                      CERTIFICATIONS
                    </h3>
                    <div className="space-y-1.5 text-[11px] text-white/90 font-semibold">
                      {data.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-white/60">•</span>
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INTERESTS */}
                {data.interests && data.interests.length > 0 && (
                  <div className="mb-6 text-left break-inside-avoid page-break-inside-avoid">
                    <h3 className="text-xs font-black uppercase tracking-widest pb-1 mb-3 border-b border-white/20 text-white/95">
                      INTERESTS
                    </h3>
                    <div className="space-y-1.5 text-[11px] text-white/90 font-semibold font-sans">
                      {data.interests.map((interest, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-white/60">•</span>
                          <span>{interest}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Headshot Modal */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans print:hidden"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="font-extrabold text-xs tracking-wider uppercase text-slate-300 text-left">Live Photo Capture</h3>
                </div>
                <button 
                  type="button"
                  onClick={stopCamera}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 cursor-pointer" />
                </button>
              </div>

              {cameraError ? (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
                  <VideoOff className="w-12 h-12 text-red-400" />
                  <p className="text-sm font-semibold text-slate-300">{cameraError}</p>
                  <button 
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Camera stream display container with circular indicator overlay */}
                  <div className="relative w-full aspect-square bg-black border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100 animate-fade-in" 
                    />
                    {/* Centered Guide Mask to help frame headshots */}
                    <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-950/40 flex items-center justify-center">
                      <div className="w-[85%] h-[85%] rounded-full border border-dashed border-pink-500/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]" />
                    </div>
                    {/* Live label overlay */}
                    <div className="absolute top-3 left-3 bg-red-600/90 text-[10px] font-black tracking-widest px-2 py-0.5 rounded text-white uppercase flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      Live Camera
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    Center your face inside the circle guide. Capture a high-quality headline image!
                  </p>

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={stopCamera}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold transition-colors text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Photo
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* HTML View: Standard A4 styling for the resume preview */
        @media (min-width: 1024px) {
          #printable-resume.single-page-layout {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            margin-left: auto !important;
            margin-right: auto !important;
            box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15) !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            background: white !important;
          }

          #printable-resume.multi-page-layout {
            width: 210mm !important;
            height: auto !important;
            min-height: 297mm !important;
            max-height: none !important;
            box-sizing: border-box !important;
            margin-left: auto !important;
            margin-right: auto !important;
            box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15) !important;
            border-radius: 12px !important;
            overflow: visible !important;
            background: white !important;
          }
        }

        @media (max-width: 1023px) {
          #printable-resume {
            width: 100% !important;
            height: auto !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            background: white !important;
          }
        }

        @media print {
          @page {
            size: A4 !important;
            margin: 0mm !important;
          }

          /* Hide external layout components safely */
          aside,
          header,
          footer,
          button,
          a,
          nav,
          .no-print,
          .print\\:hidden,
          [title*="WhatsApp"],
          [class*="ChatBox"],
          [class*="StudentAIAgent"] {
            display: none !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Clean up background/layout of all page parent containers to prevent position offsets or blank pages */
          body, html, #root, #root > div, main, main > div {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            transform: none !important;
            filter: none !important;
            box-shadow: none !important;
          }

          /* Hide left-side forms module completely during print */
          #resume-main-layout-container {
            display: block !important;
          }
          #resume-main-layout-container > div:first-child {
            display: none !important;
          }
          #resume-main-layout-container > div:last-child {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Force resume container to fill page boundaries in flow */
          #printable-resume.single-page-layout,
          #printable-resume.multi-page-layout {
            visibility: visible !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: stretch !important;
            position: relative !important;
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }

          #printable-resume.single-page-layout {
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
          }

          #printable-resume.multi-page-layout {
            height: auto !important;
            min-height: 297mm !important;
            max-height: none !important;
            overflow: visible !important;
          }

          #printable-resume-left {
            width: calc(100% - 280px) !important;
            flex: 1 1 auto !important;
            box-sizing: border-box !important;
            height: auto !important;
            min-height: 100% !important;
            -webkit-box-decoration-break: clone !important;
            box-decoration-break: clone !important;
          }

          #printable-resume-right {
            width: 280px !important;
            flex: 0 0 280px !important;
            box-sizing: border-box !important;
            height: auto !important;
            min-height: 100% !important;
            -webkit-box-decoration-break: clone !important;
            box-decoration-break: clone !important;
          }

          #printable-resume * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

interface XProps {
  className?: string;
}

function X({ className }: XProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
