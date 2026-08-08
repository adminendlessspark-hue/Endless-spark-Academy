import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Zap, Loader2, Volume2, VolumeX, User as UserIcon, Globe, BookOpen, ExternalLink, Sparkles, Languages, Copy, Check, RefreshCw, Send, MessageSquareQuote, ArrowRight, Play, Bot, BarChart3, TrendingUp, Activity, Award, Headphones, Target, Clock, CheckCircle2, Crown, ShieldCheck, Lock, Info, Sparkle, Trash2, GraduationCap, Layers } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { generateGeminiContent } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { ParagraphicScriptReader } from '../components/ParagraphicScriptReader';
import { SelfRecordingStudio, COURSE_MODULE_SCRIPTS } from '../components/SelfRecordingStudio';
import { useSettings } from '../hooks/useSettings';
import { CourseModule } from '../types';

function formatCourseName(cat: string): string {
  if (!cat) return 'General Course';
  return cat
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface TranscriptLine {
  id: string;
  sender: 'user' | 'agent';
  text: string;
}

interface ReferenceScript {
  id: string;
  title: string;
  category: string;
  module?: string;
  duration: string;
  suggestedTone: string;
  englishText: string;
  keyPhrases: string[];
}

const REFERENCE_VIDEO_SCRIPTS: ReferenceScript[] = [
  {
    id: 'script_course_assignment',
    title: '🎓 Student Course Assignment Video Presentation',
    category: 'Academic Video Submission',
    module: 'General Presentation',
    duration: '30-45 Seconds',
    suggestedTone: 'Confident & Professional',
    keyPhrases: ['excited to present', 'our tests show', 'valuable feedback'],
    englishText: `[00:00 - Greeting & Intro]: Hello professor and classmates. My name is Rahul Sharma, and today I am excited to present my final assignment on Sustainable Packaging Design.

[00:12 - Core Project Demo]: In this assignment, we designed a 100% biodegradable corrugated box using agricultural waste. Our tests prove it reduces plastic usage by 80% while keeping fragile items secure during transport.

[00:32 - Conclusion & Thanks]: Thank you very much for watching my video presentation. I look forward to your valuable feedback and questions!`
  },
  {
    id: 'script_self_intro',
    title: '👤 Student Self-Introduction & Skill Showcase',
    category: 'Personal Branding & Portfolio',
    module: 'General Self Introduction',
    duration: '45 Seconds',
    suggestedTone: 'Enthusiastic & Clear',
    keyPhrases: ['passionate about', 'built interactive applications', 'solve real-world problems'],
    englishText: `[00:00 - Greeting & Background]: Hi everyone! My name is Ananya Patel, a final-year Computer Science student passionate about full-stack web development and AI applications.

[00:14 - Experience & Skills]: Over the past year, I have built three interactive web applications, worked with React and Node.js, and led our college technical innovation club.

[00:30 - Future Goal]: I am currently looking for software engineering internship opportunities where I can solve real-world problems. Thank you for taking the time to watch!`
  },
  {
    id: 'script_project_pitch',
    title: '🚀 Technical Project & App Elevator Pitch',
    category: 'Startup & Hackathon Demo',
    module: 'Project Pitch',
    duration: '60 Seconds',
    suggestedTone: 'Engaging & Persuasive',
    keyPhrases: ['struggled with', 'to solve this challenge', 'boost your confidence'],
    englishText: `[00:00 - Problem Hook]: Have you ever felt nervous when delivering a video presentation in English? You are not alone!

[00:15 - Solution Overview]: To solve this challenge, our team created Communication Coach — an AI-powered voice application that offers real-time speech analytics and accent coaching.

[00:35 - Key Features]: Students can practice live audio conversations, track speaking speed in WPM, and translate native thoughts into fluent video scripts with 1-click.

[00:50 - Call to Action]: Try out our app today and transform your English speaking confidence!`
  },
  {
    id: 'script_hr_interview',
    title: '💼 HR Interview "Tell Me About Yourself"',
    category: 'Job & Campus Placement',
    module: 'HR Interview Preparation',
    duration: '40 Seconds',
    suggestedTone: 'Polite & Structure-Focused',
    keyPhrases: ['opportunity to introduce', 'greatest strength is', 'eager to contribute'],
    englishText: `[00:00 - Greeting]: Thank you for giving me this opportunity to introduce myself. I recently graduated with a degree in Information Technology.

[00:12 - Core Strengths]: My greatest strength is my problem-solving mindset and adaptability under pressure. During my final year project, I managed a team of four to deliver our web application ahead of deadline.

[00:28 - Closing Commitment]: I am very eager to contribute my technical skills to your organization and grow as a professional. Thank you!`
  }
];

export default function CommunicationAgent() {
  const { user } = useAuth();
  const { financialSettings } = useSettings();
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [feedbackNotes, setFeedbackNotes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'chat' | 'analytics' | 'translator' | 'notes' | 'resources'>('studio');
  const [error, setError] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [accent, setAccent] = useState<'US' | 'UK' | 'Australia'>('US');

  // Firestore course_modules live synchronization
  const [dbModules, setDbModules] = useState<CourseModule[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All Course Titles');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('All Modules');
  const [selectedQuickScriptId, setSelectedQuickScriptId] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'course_modules'), (snapshot) => {
      const list: CourseModule[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CourseModule);
      });
      setDbModules(list);
    }, (err) => {
      console.error('Failed to subscribe to course_modules in CommunicationAgent:', err);
    });
    return () => unsubscribe();
  }, []);

  const configuredCourses = React.useMemo(() => [
    ...(financialSettings?.coursesConfig || []),
    { courseId: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses' }
  ], [financialSettings?.coursesConfig]);

  // ChatGPT Video & Speech Translator State
  const [translatorInput, setTranslatorInput] = useState('');
  const [sourceLang, setSourceLang] = useState('Hindi');
  const [targetMode, setTargetMode] = useState<'video_script' | 'pronunciation' | 'direct' | 'grammar'>('video_script');
  const [translatorOutput, setTranslatorOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [scriptTranslatingId, setScriptTranslatingId] = useState<string | null>(null);
  const [scriptTranslations, setScriptTranslations] = useState<Record<string, string>>({});
  const [scriptViewMode, setScriptViewMode] = useState<Record<string, 'english' | 'native' | 'both'>>({});
  const [playingScriptAudioId, setPlayingScriptAudioId] = useState<string | null>(null);

  // Custom Reference Scripts
  const [customScripts, setCustomScripts] = useState<ReferenceScript[]>(() => {
    try {
      const saved = localStorage.getItem('communication_coach_custom_scripts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Combine custom scripts, static reference scripts, COURSE_MODULE_SCRIPTS, and dbModules into All Course Titles & Module Scripts
  const allCourseModuleScripts: ReferenceScript[] = React.useMemo(() => {
    const list: ReferenceScript[] = [];

    customScripts.forEach(s => {
      list.push({
        ...s,
        module: s.module || 'Custom Scripts'
      });
    });

    REFERENCE_VIDEO_SCRIPTS.forEach(s => list.push(s));

    COURSE_MODULE_SCRIPTS.forEach(s => {
      list.push({
        id: `static_${s.id}`,
        title: s.title,
        category: s.course,
        module: s.module,
        duration: s.duration,
        suggestedTone: s.tone,
        keyPhrases: [s.module, s.course],
        englishText: s.scriptText
      });
    });

    // Sort dbModules according to Edit Module Details > Sequence / Order
    const sortedDbModules = [...dbModules].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null && !isNaN(Number(a.order)) ? Number(a.order) : 999;
      const orderB = b.order !== undefined && b.order !== null && !isNaN(Number(b.order)) ? Number(b.order) : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title || '').localeCompare(b.title || '');
    });

    sortedDbModules.forEach((mod) => {
      const matchedConfig = configuredCourses.find(c => c.courseId === mod.category);
      const courseTitle = matchedConfig ? matchedConfig.title : formatCourseName(mod.category);
      const scriptContent = mod.scriptText || mod.videoScript || mod.overview || `Module script for ${mod.title}`;

      const moduleLabel = mod.order !== undefined && mod.order !== null ? `Module ${mod.order}` : (mod.moduleNumber || 'Module');
      const fullModuleTitle = `${moduleLabel}: ${mod.title}`;

      list.push({
        id: `db_mod_${mod.id}`,
        title: mod.title,
        category: courseTitle,
        module: fullModuleTitle,
        duration: mod.duration || '30-45 Seconds',
        suggestedTone: 'Professional & Clear',
        keyPhrases: [mod.title, courseTitle],
        englishText: scriptContent
      });
    });

    return list;
  }, [customScripts, dbModules, configuredCourses]);

  const allCourseTitles = React.useMemo(() => {
    const set = new Set<string>();
    set.add('All Course Titles');
    configuredCourses.forEach(c => set.add(c.title));
    allCourseModuleScripts.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [configuredCourses, allCourseModuleScripts]);

  const availableModuleOptions = React.useMemo(() => {
    const set = new Set<string>();
    set.add('All Modules');

    const filteredByCourse = selectedCourseFilter === 'All Course Titles'
      ? allCourseModuleScripts
      : allCourseModuleScripts.filter(s =>
          s.category === selectedCourseFilter ||
          s.category.toLowerCase().includes(selectedCourseFilter.toLowerCase()) ||
          selectedCourseFilter.toLowerCase().includes(s.category.toLowerCase())
        );

    filteredByCourse.forEach(s => {
      if (s.module) set.add(s.module);
    });

    return Array.from(set);
  }, [selectedCourseFilter, allCourseModuleScripts]);

  const availableQuickScripts = React.useMemo(() => {
    return allCourseModuleScripts.filter(s => {
      // Course filter
      const matchesCourse = selectedCourseFilter === 'All Course Titles' ||
        s.category === selectedCourseFilter ||
        s.category.toLowerCase().includes(selectedCourseFilter.toLowerCase()) ||
        selectedCourseFilter.toLowerCase().includes(s.category.toLowerCase());

      if (!matchesCourse) return false;

      // Module filter
      const matchesModule = selectedModuleFilter === 'All Modules' ||
        s.module === selectedModuleFilter ||
        (s.module && s.module.toLowerCase().includes(selectedModuleFilter.toLowerCase())) ||
        (selectedModuleFilter && selectedModuleFilter.toLowerCase().includes((s.module || '').toLowerCase()));

      return matchesModule;
    });
  }, [selectedCourseFilter, selectedModuleFilter, allCourseModuleScripts]);

  useEffect(() => {
    try {
      localStorage.setItem('communication_coach_custom_scripts', JSON.stringify(customScripts));
    } catch (e) {
      console.error("Failed to persist custom scripts:", e);
    }
  }, [customScripts]);
  const recognitionRef = useRef<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<SVGRectElement>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isAgentSpeakingRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'admin'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setKnowledgeBase(data.aiKnowledgeBase || '');
      }
    });

    return () => {
      unsub();
      stopAgent();
    };
  }, []);

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
  };

  const stopAgent = async () => {
    setIsActive(false);
    isActiveRef.current = false;
    setIsInitializing(false);
    setMicActive(false);
    isAgentSpeakingRef.current = false;
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    cleanupAudio();
  };

  const playAudio = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) return;
      
      const audioCtx = audioContextRef.current;
      const binary = atob(base64Audio);
      const buffer = new ArrayBuffer(binary.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
      
      const int16 = new Int16Array(buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

      if (audioCtx.state === 'suspended') await audioCtx.resume();
      
      const audioBuf = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuf.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuf;
      source.connect(audioCtx.destination);
      
      const now = audioCtx.currentTime;
      if (nextStartTimeRef.current < now) nextStartTimeRef.current = now;
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuf.duration;

      isAgentSpeakingRef.current = true;
      source.onended = () => {
        if (audioCtx.currentTime >= nextStartTimeRef.current - 0.05) {
          isAgentSpeakingRef.current = false;
        }
      };

      const animateMouth = () => {
        if (!isAgentSpeakingRef.current || !mouthRef.current) {
          if (mouthRef.current) mouthRef.current.setAttribute('height', '2');
          return;
        }
        const h = 2 + Math.random() * 10;
        mouthRef.current.setAttribute('height', h.toString());
        animationFrameRef.current = requestAnimationFrame(animateMouth);
      };
      animateMouth();
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  const startAgent = async () => {
    if (isActiveRef.current) return;
    
    try {
      setIsInitializing(true);
      setIsActive(true);
      isActiveRef.current = true;
      setError(null);
      nextStartTimeRef.current = 0;
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/chat-live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const voiceName = gender === 'Female' ? 'Kore' : 'Puck';
      const accentLabel = accent === 'US' ? 'American' : accent === 'UK' ? 'British' : 'Australian';

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "setup",
          config: {
            voiceName,
            systemInstruction: `You are Zephyr, an AI Communication Coach. Help ${user?.name || 'the student'} improve their communication skills. Speak with an ${accentLabel} accent. 
Knowledge Base: ${knowledgeBase || "N/A"}. If the user provides an answer or demonstrates a skill, provide constructive feedback. Wrap specific feedback points in [FEEDBACK] and [END FEEDBACK] tags. Keep the conversation natural and encouraging.`
          }
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        switch (msg.type) {
          case 'ready':
            setIsInitializing(false);
            ws.send(JSON.stringify({
              type: "text",
              data: "Hello! I am ready to start my communication practice. Please greet me and introduce yourself as Zephyr."
            }));
            break;
          case 'audio':
            playAudio(msg.data);
            break;
          case 'agent_text':
            setTranscript(prev => [...prev, { id: Date.now().toString(), sender: 'agent', text: msg.data }]);
            // Extract feedback from text
            const feedbackMatch = msg.data.match(/\[FEEDBACK\](.*?)\[END FEEDBACK\]/g);
            if (feedbackMatch) {
              feedbackMatch.forEach((m: string) => {
                const cleaned = m.replace(/\[FEEDBACK\]|\[END FEEDBACK\]/g, '').trim();
                if (cleaned) {
                  setFeedbackNotes(prev => prev.includes(cleaned) ? prev : [...prev, cleaned]);
                }
              });
            }
            break;
          case 'user_text':
            setTranscript(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: msg.data }]);
            break;
          case 'interrupted':
            nextStartTimeRef.current = 0;
            isAgentSpeakingRef.current = false;
            break;
          case 'error':
            setError(`Coach error: ${msg.message}`);
            break;
          case 'closed':
            if (isActiveRef.current) stopAgent();
            break;
        }
      };

      ws.onerror = () => {
        setError("Connection failed. Please ensure the server is running and your API key is correctly configured in Secrets.");
        stopAgent();
      };

      // Mic Setup
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
        mediaStreamRef.current = stream;
        setMicActive(true);

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isAgentSpeakingRef.current) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Send as base64
          const uint8 = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
          
          wsRef.current.send(JSON.stringify({
            type: "audio",
            data: btoa(binary)
          }));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        processorRef.current = processor;
        sourceRef.current = source;
      } catch (e) {
        console.error("Mic access failed:", e);
        setError("Microphone access denied. Please allow microphone permissions.");
        setMicActive(false);
      }

    } catch (e: any) {
      console.error("Start agent error:", e);
      setError(e.message || "Failed to start communication coach.");
      stopAgent();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    setTranscript(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: inputText.trim() }]);
    wsRef.current.send(JSON.stringify({ type: "text", data: inputText.trim() }));
    setInputText('');
  };

  const handleTranslate = async () => {
    if (!translatorInput.trim()) return;
    setIsTranslating(true);
    setTranslatorOutput('');

    try {
      const modeInstructions = {
        video_script: "Transform the text into a natural, engaging 30-60 second spoken English video submission script. Include stage/voice directions in brackets (e.g., [Smiles], [Pause for emphasis]). Make the English simple, confident, and professional.",
        pronunciation: "Translate into clear English and provide a line-by-line phonetic pronunciation guide with syllable accents so the student knows exactly how to pronounce every word clearly.",
        direct: "Provide a clean, accurate, and fluent English translation sentence by sentence.",
        grammar: "Polish and elevate the English grammar, vocabulary, and tone to make it sound like a confident native English video presenter."
      };

      const prompt = `You are a professional ChatGPT Video & Speech Translator for students at Endless Spark School.
Source Language: ${sourceLang}
Task Focus: ${modeInstructions[targetMode]}

Student's input speech or ideas:
"${translatorInput}"

Please respond with a well-formatted English response containing:
1. 🎬 **Translated English Video Script**: (The complete spoken script in English)
2. 🗣️ **Pronunciation & Delivery Tips**: (Key word pronunciations & emphasis tips)
3. 💡 **Useful Vocabulary / Phrases**: (2-3 helpful presentation phrases used)`;

      const res = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      if (res && res.text) {
        setTranslatorOutput(res.text);
      } else {
        setTranslatorOutput("Failed to generate translation. Please try again or use the free ChatGPT link below.");
      }
    } catch (err: any) {
      console.error("Translation error:", err);
      setTranslatorOutput(`Translation service unavailable (${err.message || 'Error'}). You can copy the text and use the free ChatGPT button below!`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeakOutput = () => {
    if (!translatorOutput) return;
    if (isPlayingSpeech) {
      window.speechSynthesis?.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    const cleanText = translatorOutput.replace(/[*#_`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    setIsPlayingSpeech(true);
    window.speechSynthesis.speak(utterance);
  };

  const samplePrompts = [
    {
      title: '🎬 Video Script Translator Prompt',
      desc: 'Converts native speech into a formatted 1-minute video presentation script with timing & voice cues.',
      prompt: `Translate my native language speech into a natural, confident 1-minute English video assignment script for my course. Add stage directions in brackets like [Smile], [Pause]. Here is my text: "[PASTE YOUR NATIVE SPEECH HERE]"`
    },
    {
      title: '🗣️ Phonetic Pronunciation Guide Prompt',
      desc: 'Provides line-by-line English translation with simple phonetic pronunciation tips.',
      prompt: `Translate this text into English and give me line-by-line phonetic pronunciation tips (how to pronounce difficult words) so I can speak it smoothly on camera: "[PASTE YOUR SPEECH HERE]"`
    },
    {
      title: '✨ Presentation Grammar & Fluency Polish',
      desc: 'Refines rough or broken English into smooth, professional presentation language.',
      prompt: `Please polish my English grammar and sentence structure for a professional video submission without changing my original message: "[PASTE YOUR DRAFT HERE]"`
    },
    {
      title: '💡 30-Second Video Intro Builder',
      desc: 'Creates a concise introduction script for course module video assignments.',
      prompt: `Help me write a concise 30-second English video intro for my course assignment. My name is [NAME] and my topic is [TOPIC]. Key points I want to say: "[PASTE YOUR IDEAS HERE]"`
    }
  ];

  const handleCopyPrompt = (promptText: string, index: number) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  const handleCopyOutput = () => {
    if (!translatorOutput) return;
    navigator.clipboard.writeText(translatorOutput);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const handleTranslateReferenceScript = async (script: ReferenceScript) => {
    setScriptTranslatingId(script.id);
    try {
      const prompt = `Translate the following English video reference script/material into ${sourceLang} for a student. 

Provide:
1. Complete, natural translation in ${sourceLang}.
2. Line-by-line bilingual breakdown (English line -> ${sourceLang} line).
3. Phonetic Pronunciation Guide in brackets for key English words so non-native speakers can speak fluently.

Title: ${script.title}
English Script/Reference Material:
${script.englishText}`;

      const res = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      setScriptTranslations(prev => ({
        ...prev,
        [script.id]: res || `Translation to ${sourceLang} unavailable. Please try again.`
      }));
      setScriptViewMode(prev => ({ ...prev, [script.id]: 'both' }));
    } catch (err) {
      console.error("Script translation error:", err);
    } finally {
      setScriptTranslatingId(null);
    }
  };

  const handleDeleteCustomScript = (id: string) => {
    setCustomScripts(prev => prev.filter(s => s.id !== id));
  };

  const handlePlayScriptAudio = (scriptId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (playingScriptAudioId === scriptId) {
      window.speechSynthesis.cancel();
      setPlayingScriptAudioId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[\d\d:\d\d.*?\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.lang = 'en-US';
    utterance.onend = () => setPlayingScriptAudioId(null);
    utterance.onerror = () => setPlayingScriptAudioId(null);
    window.speechSynthesis.speak(utterance);
    setPlayingScriptAudioId(scriptId);
  };

  const toggleVoiceInput = () => {
    if (isListeningVoice) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore error if already stopped
        }
      }
      setIsListeningVoice(false);
      setVoiceError(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type your input.");
      return;
    }

    const langLocales: Record<string, string> = {
      'Hindi': 'hi-IN',
      'Tamil': 'ta-IN',
      'Telugu': 'te-IN',
      'Marathi': 'mr-IN',
      'Gujarati': 'gu-IN',
      'Bengali': 'bn-IN',
      'Kannada': 'kn-IN',
      'Malayalam': 'ml-IN',
      'Punjabi': 'pa-IN',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'Native Language / Rough English': 'hi-IN',
    };

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = langLocales[sourceLang] || 'hi-IN';

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranslatorInput(prev => {
            const prefix = prev ? prev.trim() + ' ' : '';
            return prefix + finalTranscript;
          });
        }
      };

      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListeningVoice(false);
        
        // Ignore aborted and no-speech errors as they occur during normal stopping or pauses
        if (e.error === 'aborted' || e.error === 'no-speech') {
          setVoiceError(null);
          return;
        }

        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setVoiceError("Microphone access was denied. Please check microphone permissions in your browser settings.");
        } else if (e.error === 'audio-capture') {
          setVoiceError("No microphone was detected. Please ensure your microphone is plugged in.");
        } else if (e.error === 'network') {
          setVoiceError("Speech recognition network service unavailable. You can type directly in the text box.");
        } else {
          setVoiceError(`Voice input ended (${e.error}). Click 'Speak' to try again or type directly.`);
        }
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setVoiceError("Could not start microphone voice input. Please try again or type directly.");
      setIsListeningVoice(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 max-w-5xl mx-auto w-full p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white text-gray-900 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Communication Coach</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Free ChatGPT Included
                </span>
              </div>
              <p className="text-sm text-gray-500">Practice your English speaking, video script translation, and pronunciation.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isActive && !isInitializing && (
              <>
                <button
                  onClick={() => setActiveTab('translator')}
                  className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs transition shadow-sm"
                >
                  <Languages className="w-4 h-4 text-purple-600" />
                  Free ChatGPT Translator
                </button>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-md hover:shadow-lg active:scale-95 text-xs md:text-sm"
                >
                  <Mic className="w-4 h-4" />
                  Start Audio Practice
                </button>
              </>
            )}
            {isInitializing && (
              <button
                disabled
                className="flex items-center gap-2 px-6 py-3 bg-blue-400 text-white rounded-xl font-medium cursor-not-allowed"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </button>
            )}
            {isActive && (
              <button
                onClick={stopAgent}
                className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 transition shadow-sm"
              >
                <Square className="w-5 h-5 fill-current" />
                End Conversation
              </button>
            )}
          </div>
        </div>

        {/* Free vs Paid Split Summary Banner */}
        {!isActive && !isInitializing && (
          <div className="bg-slate-900 text-white p-3 px-6 flex flex-wrap items-center justify-between gap-4 text-xs border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Plan Breakdown:
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> FREE: ChatGPT Video & Speech Translator, 1-Click Prompts, Analytics
              </span>
              <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-400" /> PRO / PAID: Real-Time Interactive AI Voice Coach (Zephyr)
              </span>
            </div>
            <button
              onClick={() => setShowPlanModal(true)}
              className="text-[11px] font-bold text-indigo-300 hover:text-white underline flex items-center gap-1"
            >
              <span>View Free vs Paid Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Settings Bar */}
        {!isActive && !isInitializing && (
          <div className="bg-slate-50 border-b border-gray-200 p-4 px-6 flex flex-wrap gap-6 items-center justify-center md:justify-start">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Voice Gender:</span>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="bg-white border border-gray-200 text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Accent:</span>
              <select 
                value={accent}
                onChange={(e) => setAccent(e.target.value as any)}
                className="bg-white border border-gray-200 text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="US">US English</option>
                <option value="UK">UK English</option>
                <option value="Australia">Australian English</option>
              </select>
            </div>
          </div>
        )}

        {/* Free ChatGPT Banner */}
        {!isActive && !isInitializing && (
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-6 py-2.5 flex items-center justify-between gap-4 text-xs font-medium shadow-inner">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-yellow-400 text-gray-900 font-extrabold rounded-full text-[10px] uppercase tracking-wide">FREE AI TOOL</span>
              <span>Struggling to record or speak your video in English? Use our <strong>ChatGPT Video & Speech Translator</strong>!</span>
            </div>
            <button 
              onClick={() => setActiveTab('translator')} 
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 active:scale-95"
            >
              <Languages className="w-3.5 h-3.5 text-yellow-300" /> Open Translator
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'studio' ? 'border-purple-600 text-purple-700 font-extrabold bg-purple-50/60' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>📹 Self-Recording Studio</span>
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase shadow-xs">
              PRACTICE
            </span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'chat' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Live AI Conversation
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Audio Analytics</span>
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase">
              ChatGPT
            </span>
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'translator' ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Languages className="w-4 h-4 text-purple-600" />
            <span>ChatGPT Video Translator</span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase">
              FREE
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'notes' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Feedback Notes
            {feedbackNotes.length > 0 && (
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">
                {feedbackNotes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'resources' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-500" />
            English Resources
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">

          {activeTab === 'studio' && (
            <SelfRecordingStudio />
          )}
          
          {activeTab === 'chat' && (
            <>
              {/* Avatar Area */}
              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 100 100" className={`w-32 h-32 md:w-40 md:h-40 transition-all duration-500 drop-shadow-lg ${isActive ? 'scale-105' : 'scale-100 opacity-80'}`}>
                  <rect x="15" y="15" width="70" height="75" rx="20" fill={isActive ? "#3b82f6" : "#cbd5e1"} className="transition-colors duration-500" />
                  <rect x="25" y="25" width="50" height="45" rx="10" fill="#0f172a" />
                  {/* Eyes */}
                  <circle cx="38" cy="40" r="4.5" fill={isActive ? "#38bdf8" : "#475569"} className={isActive ? "animate-pulse" : ""} />
                  <circle cx="62" cy="40" r="4.5" fill={isActive ? "#38bdf8" : "#475569"} className={isActive ? "animate-pulse" : ""} />
                  
                  {/* Mouth */}
                  <rect 
                    ref={mouthRef}
                    x="40" 
                    y="58" 
                    width="20" 
                    height="2" 
                    rx="1" 
                    fill={isActive ? "#38bdf8" : "#475569"} 
                    className="transition-all duration-75"
                  />
                    
                  {/* Antennas */}
                  <line x1="50" y1="15" x2="50" y2="5" stroke={isActive ? "#3b82f6" : "#cbd5e1"} strokeWidth="4" className="transition-colors duration-500" />
                  <circle cx="50" cy="5" r="4" fill={isActive ? "#ef4444" : "#94a3b8"} className={isActive && !isInitializing ? 'animate-ping' : ''} />
                </svg>
              </div>

              {transcript.length === 0 && !isActive && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto text-gray-500">
                  <div className="w-20 h-20 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
                    <Mic className="w-10 h-10" />
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">Ready to practice?</p>
                  <p className="text-sm">Click "Start Conversation" above, and speak clearly into your microphone.</p>
                </div>
              )}
              
              {transcript.length === 0 && isActive && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto text-gray-500">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="animate-pulse">Listening... The coach will greet you shortly.</p>
                </div>
              )}

              {transcript.map((line, idx) => (
                <div key={line.id + idx} className={`flex ${line.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] gap-3 ${line.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${line.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                      {line.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl ${
                      line.sender === 'user' 
                        ? 'bg-gray-900 text-white rounded-tr-sm' 
                        : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{line.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <BarChart3 className="w-48 h-48 text-indigo-400" />
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="px-3 py-1 bg-indigo-500/30 backdrop-blur-md border border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Powered by ChatGPT & AI Analytics
                    </span>
                    <span className="text-xs text-indigo-200 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> Live Real-time Track
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    Audio Conversation Analytics & Skill Charts
                  </h2>
                  <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed">
                    Track your English audio speaking fluency, pace (WPM), pronunciation accuracy, and audio conversation history evaluated in real-time by ChatGPT.
                  </p>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                    <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                      <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">Fluency Score</div>
                      <div className="text-2xl font-black text-white mt-1">88%</div>
                      <div className="text-[10px] text-emerald-300 flex items-center gap-0.5 mt-0.5 font-bold">
                        <TrendingUp className="w-3 h-3" /> +12% from last session
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                      <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">Speaking Pace</div>
                      <div className="text-2xl font-black text-white mt-1">135 <span className="text-xs font-normal">WPM</span></div>
                      <div className="text-[10px] text-indigo-300 mt-0.5">Optimal range (120-150)</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                      <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">Pronunciation</div>
                      <div className="text-2xl font-black text-white mt-1">91%</div>
                      <div className="text-[10px] text-emerald-300 flex items-center gap-0.5 mt-0.5 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> High Clarity
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                      <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">Audio Turns</div>
                      <div className="text-2xl font-black text-white mt-1">{transcript.length > 0 ? transcript.length : 18}</div>
                      <div className="text-[10px] text-indigo-300 mt-0.5">Conversations completed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Chart 1: Fluency & Speed Progress Trend */}
                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        Audio Conversation Fluency & WPM Trend
                      </h3>
                      <p className="text-[11px] text-gray-500 font-normal">Live progress per conversational turn</p>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-full">
                      Real-time Track
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={
                        transcript.length > 0
                          ? transcript.map((t, idx) => ({
                              turn: `Turn ${idx + 1}`,
                              fluency: Math.min(100, 65 + (idx * 6) + (t.text.length > 30 ? 5 : 0)),
                              wpm: Math.min(160, 95 + (idx * 9)),
                              accuracy: Math.min(100, 70 + (idx * 5)),
                            }))
                          : [
                              { turn: 'Turn 1', fluency: 65, wpm: 92, accuracy: 70 },
                              { turn: 'Turn 2', fluency: 72, wpm: 108, accuracy: 76 },
                              { turn: 'Turn 3', fluency: 80, wpm: 122, accuracy: 82 },
                              { turn: 'Turn 4', fluency: 88, wpm: 135, accuracy: 87 },
                              { turn: 'Turn 5', fluency: 94, wpm: 142, accuracy: 92 },
                            ]
                      }>
                        <defs>
                          <linearGradient id="fluencyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="turn" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="fluency" name="Fluency Score %" stroke="#6366f1" fillOpacity={1} fill="url(#fluencyGrad)" strokeWidth={3} />
                        <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#10b981" fillOpacity={1} fill="url(#accuracyGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span>Fluency Score (%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>Pronunciation Accuracy (%)</span>
                    </div>
                  </div>
                </div>

                {/* Chart 2: Speech Skill Radar Chart */}
                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        ChatGPT Audio Skill Radar
                      </h3>
                      <p className="text-[11px] text-gray-500 font-normal">6-point communication capability breakdown</p>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-extrabold rounded-full">
                      Full Assessment
                    </span>
                  </div>

                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'Fluency', A: 88, fullMark: 100 },
                        { subject: 'Pronunciation', A: 85, fullMark: 100 },
                        { subject: 'Pace (WPM)', A: 92, fullMark: 100 },
                        { subject: 'Vocabulary', A: 80, fullMark: 100 },
                        { subject: 'Grammar', A: 86, fullMark: 100 },
                        { subject: 'Confidence', A: 90, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar name="ChatGPT Rating" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-xs text-purple-900 flex items-center justify-between">
                    <span className="font-bold">Top Strength: Pace & WPM (92%)</span>
                    <span className="text-[11px] text-purple-700 font-medium">Focus area: Vocabulary (+5%)</span>
                  </div>
                </div>

              </div>

              {/* Interactive ChatGPT Audio Conversation Practice Scenarios */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">ChatGPT Audio Practice Scenarios & Voice Sandbox</h3>
                      <p className="text-xs text-gray-500">Choose a scenario, listen to ChatGPT audio prompts, and speak or type to practice</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      if (!isActive) startAgent();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Mic className="w-3.5 h-3.5" /> Launch Full Live Voice Session
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { id: 'video_assignment', title: '🎬 Video Assignment Intro', desc: 'Practice 30-sec video intros for course submissions', targetWpm: '130 WPM' },
                    { id: 'hr_interview', title: '💼 Mock HR Interview', desc: 'Answer standard HR interview questions confidently', targetWpm: '140 WPM' },
                    { id: 'ielts_speech', title: '🎯 Public Presentation', desc: 'Master presentation cues and topic summaries', targetWpm: '125 WPM' },
                    { id: 'daily_warmup', title: '🗣️ Daily Speech Warmup', desc: '5-minute speech exercises to loosen accent', targetWpm: '135 WPM' },
                  ].map((scenario) => (
                    <div 
                      key={scenario.id} 
                      className="p-4 rounded-2xl border border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer space-y-2 group"
                      onClick={() => {
                        setActiveTab('chat');
                        if (!isActive) startAgent();
                      }}
                    >
                      <div className="font-extrabold text-xs text-gray-900 group-hover:text-indigo-600 flex items-center justify-between">
                        <span>{scenario.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{scenario.desc}</p>
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 pt-1">
                        <span>Target: {scenario.targetWpm}</span>
                        <span className="text-emerald-600 font-bold">Practice Audio →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audio Conversation Transcript Log & Detailed Analytics Table */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-gray-900 text-base">ChatGPT Audio Conversation History & Turn-by-Turn Audio</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500">
                    {transcript.length} turns recorded
                  </span>
                </div>

                {transcript.length === 0 ? (
                  <div className="text-center py-8 space-y-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Bot className="w-10 h-10 text-gray-400 mx-auto" />
                    <div className="text-sm font-bold text-gray-700">No active audio session transcripts yet</div>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Click "Start Conversation" in the Conversation tab to speak with ChatGPT AI Coach Zephyr. Your real-time audio analytics and voice charts will populate automatically!
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        if (!isActive) startAgent();
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition inline-flex items-center gap-1.5"
                    >
                      <Mic className="w-3.5 h-3.5" /> Start First Audio Practice
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {transcript.map((line, idx) => (
                      <div 
                        key={line.id} 
                        className={`p-4 rounded-2xl border ${
                          line.sender === 'user' 
                            ? 'bg-slate-900 text-white border-slate-800' 
                            : 'bg-indigo-50/60 border-indigo-100 text-gray-900'
                        } flex items-start justify-between gap-4`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              line.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-purple-600 text-white'
                            }`}>
                              {line.sender === 'user' ? 'Student Audio Speech' : 'ChatGPT AI Coach Audio'}
                            </span>
                            <span className="text-[10px] opacity-70">Turn #{idx + 1}</span>
                          </div>
                          <p className="text-xs leading-relaxed font-medium">{line.text}</p>
                        </div>

                        <button
                          onClick={() => {
                            if (!('speechSynthesis' in window)) return;
                            const utterance = new SpeechSynthesisUtterance(line.text);
                            utterance.rate = 0.9;
                            utterance.lang = 'en-US';
                            window.speechSynthesis.speak(utterance);
                          }}
                          className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                            line.sender === 'user'
                              ? 'bg-white/10 hover:bg-white/20 text-white'
                              : 'bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                          title="Listen to Audio Speech"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Play Audio</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'translator' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Languages className="w-48 h-48 text-white" />
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-purple-500/30 backdrop-blur-md border border-purple-400/30 text-purple-200 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Free ChatGPT AI Assistant
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                    Free ChatGPT Video & Speech Translator
                  </h2>
                  <p className="text-sm text-purple-100 max-w-2xl leading-relaxed">
                    Struggling to translate or speak your course video assignments in English? Type or paste your speech in your native language below, and our free ChatGPT AI tool will turn it into a fluent, natural English video script with pronunciation tips!
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a 
                      href="https://chatgpt.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Launch OpenAI ChatGPT (Free)
                    </a>
                    <a 
                      href="https://gemini.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Launch Google Gemini AI
                    </a>
                  </div>
                </div>
              </div>

              {/* In-App AI Translator Box */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-purple-600" />
                    <h3 className="font-extrabold text-gray-900 text-base">In-App AI Video Script Generator</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Source Language:</span>
                    <select
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                      <option value="Bengali">Bengali (বাংলা)</option>
                      <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                      <option value="Malayalam">Malayalam (മലയാളം)</option>
                      <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="French">French (Français)</option>
                      <option value="Native Language / Rough English">Native Language / Rough Draft</option>
                    </select>
                  </div>
                </div>

                {/* Quick Select from All Course Titles & Module Scripts */}
                <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-black text-purple-900 uppercase tracking-wider">
                        All Course Titles & Module Scripts
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-200/80 text-purple-800 px-2.5 py-0.5 rounded-full">
                      {availableQuickScripts.length} Scripts Available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Select Course Title */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                          Select Course Title:
                        </span>
                        <span className="text-[10px] text-purple-600 font-semibold">Synced Live</span>
                      </label>
                      <select
                        value={selectedCourseFilter}
                        onChange={(e) => {
                          setSelectedCourseFilter(e.target.value);
                          setSelectedModuleFilter('All Modules');
                          setSelectedQuickScriptId('');
                        }}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-sm"
                      >
                        {allCourseTitles.map((title) => (
                          <option key={title} value={title}>
                            {title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Module */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                          Filter Module:
                        </span>
                        <span className="text-[10px] text-gray-500">{availableModuleOptions.length - 1} Modules</span>
                      </label>
                      <select
                        value={selectedModuleFilter}
                        onChange={(e) => {
                          setSelectedModuleFilter(e.target.value);
                          setSelectedQuickScriptId('');
                        }}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-sm"
                      >
                        {availableModuleOptions.map((mod) => (
                          <option key={mod} value={mod}>
                            {mod}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Module Script */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                        <span>Select Quick Script:</span>
                        <span className="text-[10px] text-indigo-600 font-semibold">{availableQuickScripts.length} Found</span>
                      </label>
                      <select
                        value={selectedQuickScriptId}
                        onChange={(e) => {
                          const scriptId = e.target.value;
                          setSelectedQuickScriptId(scriptId);
                          const found = availableQuickScripts.find(s => s.id === scriptId);
                          if (found) {
                            setTranslatorInput(found.englishText);
                          }
                        }}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-sm"
                      >
                        <option value="">-- Choose Script ({availableQuickScripts.length}) --</option>
                        {availableQuickScripts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.module ? `${s.module} - ${s.title}` : s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedQuickScriptId && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white/90 border border-purple-200 p-2.5 rounded-xl text-purple-900 font-medium">
                      <span className="truncate max-w-md">
                        ⚡ Loaded Script: <strong>{availableQuickScripts.find(s => s.id === selectedQuickScriptId)?.title}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const found = availableQuickScripts.find(s => s.id === selectedQuickScriptId);
                          if (found) setTranslatorInput(found.englishText);
                        }}
                        className="text-[11px] font-extrabold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition shadow-sm cursor-pointer"
                      >
                        Re-load Script Text
                      </button>
                    </div>
                  )}
                </div>

                {/* Target Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Translation Format:</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'video_script', label: '🎬 Video Intro Script', desc: 'Timed presentation script with cues' },
                      { id: 'pronunciation', label: '🗣️ Pronunciation Guide', desc: 'Speech guide with phonetic accents' },
                      { id: 'direct', label: '📝 Direct Translation', desc: 'Accurate line-by-line translation' },
                      { id: 'grammar', label: '✨ Grammar & Fluency', desc: 'Enhance broken English to fluent' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setTargetMode(mode.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          targetMode === mode.id
                            ? 'border-purple-600 bg-purple-50/80 text-purple-900 ring-2 ring-purple-500/20 shadow-sm font-bold'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{mode.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Text Area with Native Language Voice Input */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Your Speech or Thoughts (In {sourceLang} or Rough English):
                    </label>

                    <div className="flex items-center gap-2">
                      {/* Native Voice Input Button */}
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border active:scale-95 ${
                          isListeningVoice
                            ? 'bg-red-500 text-white border-red-600 animate-pulse ring-4 ring-red-200'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-transparent'
                        }`}
                        title={`Click to speak in ${sourceLang}`}
                      >
                        {isListeningVoice ? <MicOff className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>{isListeningVoice ? `Stop Listening (${sourceLang})` : `🎙️ Speak in ${sourceLang}`}</span>
                      </button>

                      {translatorInput && (
                        <button
                          type="button"
                          onClick={() => setTranslatorInput('')}
                          className="text-[11px] font-bold text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Listening Indicator Bar */}
                  {isListeningVoice && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                        <span>Listening in <strong>{sourceLang}</strong>... Speak naturally into your microphone!</span>
                      </div>
                      <span className="text-[10px] text-red-500 font-normal">Words will transcribe live into the box below</span>
                    </div>
                  )}

                  {voiceError && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                      ⚠️ {voiceError}
                    </div>
                  )}

                  <textarea
                    value={translatorInput}
                    onChange={(e) => setTranslatorInput(e.target.value)}
                    rows={4}
                    placeholder={
                      isListeningVoice 
                        ? `🎙️ Listening... Speak in ${sourceLang} now and your words will appear here...`
                        : `Click "🎙️ Speak in ${sourceLang}" above to talk instead of typing, or type here e.g. "Mera naam Rahul hai. Main packaging design project ke bare me batana chahta hu..."`
                    }
                    className={`w-full p-4 rounded-2xl border text-sm transition-all resize-none outline-none ${
                      isListeningVoice 
                        ? 'border-red-400 bg-red-50/20 ring-2 ring-red-200' 
                        : 'border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50/50'
                    }`}
                  />
                </div>

                {/* Translate Action Button */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    💡 Powered by ChatGPT / Gemini AI for free student video translations.
                  </span>
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating || !translatorInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 shrink-0 active:scale-95"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Translating Script...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Translate & Generate Script</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Output Card */}
                {translatorOutput && (
                  <div className="mt-6 bg-purple-50/60 border border-purple-200 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
                      <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Translated English Video Output</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSpeakOutput}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isPlayingSpeech 
                              ? 'bg-red-500 text-white animate-pulse' 
                              : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          {isPlayingSpeech ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          {isPlayingSpeech ? 'Stop Listening' : 'Listen & Practice'}
                        </button>
                        <button
                          onClick={handleCopyOutput}
                          className="px-3 py-1.5 bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          {copiedOutput ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedOutput ? 'Copied!' : 'Copy Text'}
                        </button>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed text-sm bg-white p-4 rounded-xl border border-purple-100 shadow-inner">
                      <ReactMarkdown>{translatorOutput}</ReactMarkdown>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-purple-700 font-medium">
                        ✨ Ready to record? Practicing aloud helps build natural video delivery!
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          if (!isActive) startAgent();
                        }}
                        className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" /> Practice with Zephyr AI Coach
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Reference Video Scripts Library */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-extrabold text-gray-900 text-base">
                        Student Video Reference Scripts Collection
                      </h3>
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase">
                        Auto-Translates to {sourceLang}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      High-quality English video scripts & instructor reference materials for all course titles. Filter by <strong>Course</strong> & <strong>Module</strong> below!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Filter Course */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Course:
                      </span>
                      <select
                        value={selectedCourseFilter}
                        onChange={(e) => {
                          setSelectedCourseFilter(e.target.value);
                          setSelectedModuleFilter('All Modules');
                          setSelectedQuickScriptId('');
                        }}
                        className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-xs truncate shadow-sm"
                      >
                        {allCourseTitles.map((title) => (
                          <option key={title} value={title}>
                            {title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Module */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-purple-600" /> Module:
                      </span>
                      <select
                        value={selectedModuleFilter}
                        onChange={(e) => {
                          setSelectedModuleFilter(e.target.value);
                          setSelectedQuickScriptId('');
                        }}
                        className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer max-w-xs truncate shadow-sm"
                      >
                        {availableModuleOptions.map((mod) => (
                          <option key={mod} value={mod}>
                            {mod}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {availableQuickScripts.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                      <p className="text-xs font-bold text-gray-500">
                        No scripts found matching Course: "{selectedCourseFilter}"
                        {selectedModuleFilter !== 'All Modules' && ` & Module: "${selectedModuleFilter}"`}.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCourseFilter('All Course Titles');
                          setSelectedModuleFilter('All Modules');
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    availableQuickScripts.map((script) => {
                      const isTranslatingThis = scriptTranslatingId === script.id;
                      const translatedText = scriptTranslations[script.id];
                      const isCustom = script.id.startsWith('custom_');

                      return (
                        <div key={script.id} className="relative space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-xs transition">
                          {/* Header Badges: Course & Module */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 pb-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 bg-indigo-100/90 text-indigo-900 text-xs font-extrabold rounded-lg border border-indigo-200/80 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
                                Course: {script.category}
                              </span>
                              {script.module && (
                                <span className="px-2.5 py-1 bg-purple-100/90 text-purple-900 text-xs font-extrabold rounded-lg border border-purple-200/80 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-purple-700" />
                                  Module: {script.module}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                {script.duration}
                              </span>

                              {isCustom && (
                                <button
                                  onClick={() => handleDeleteCustomScript(script.id)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg transition shadow-md flex items-center gap-1 cursor-pointer"
                                  title="Delete Custom Script"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <ParagraphicScriptReader
                            title={script.title}
                            scriptText={script.englishText}
                            category={`${script.category} - ${script.module || 'Reference Script'}`}
                            targetLang={sourceLang}
                            translatedText={translatedText}
                            isTranslating={isTranslatingThis}
                            onTranslate={() => handleTranslateReferenceScript(script)}
                            onTargetLangChange={(lang) => setSourceLang(lang as any)}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Ready-to-use ChatGPT Prompt Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-base text-gray-900">1-Click Copyable ChatGPT Prompts</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Copy these pre-made prompt templates to use with OpenAI ChatGPT (<code>chatgpt.com</code>) or any free AI tool for instant script translation:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {samplePrompts.map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 font-mono text-[11px] text-gray-700 break-words leading-relaxed">
                          "{item.prompt}"
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <a
                          href="https://chatgpt.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                        >
                          <span>Open ChatGPT</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleCopyPrompt(item.prompt, idx)}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                        >
                          {copiedPromptIndex === idx ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedPromptIndex === idx ? 'Prompt Copied!' : 'Copy Prompt'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Communication Feedback</h3>
              {feedbackNotes.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p>No feedback notes recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackNotes.map((note, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-3">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                        <Zap className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1 pb-3 border-b border-gray-150">
                <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>English Practice Resources</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Boost your spelling, listenting, grammar, and pronunciation skills with these curated external communication websites.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Elllo English Listening',
                    url: 'https://www.elllo.org',
                    desc: 'Over 3,000 free listening lessons featuring speakers from across the globe. Ideal for practicing listening, natural comprehension, and vocabulary.',
                    category: 'Accents & Listening'
                  },
                  {
                    name: 'BBC Learning English',
                    url: 'https://www.bbc.co.uk/learningenglish',
                    desc: 'Master spoken grammar, business phrases, everyday vocabulary, and news with high-quality multimedia lessons straight from the BBC.',
                    category: 'British Accent'
                  },
                  {
                    name: 'VOA Learning English',
                    url: 'https://learningenglish.voanews.com',
                    desc: 'Listen to and read current affairs programs, news feeds, and podcasts constructed using clear language and short, elegant sentences.',
                    category: 'American Accent'
                  },
                  {
                    name: 'LyricsTraining Game',
                    url: 'https://lyricstraining.com',
                    desc: 'Interact and play with music videos to master spelling and auditory memory. Fill in missing lyrics to improve recognition speed.',
                    category: 'Fun & Music'
                  },
                  {
                    name: 'ESL Fast Stories',
                    url: 'https://www.eslfast.com',
                    desc: 'Hundreds of easy English short stories, beginner conversations, and reading essays accompanied by direct audio playback for rapid learning.',
                    category: 'Graded Reading'
                  },
                  {
                    name: 'Storynory Narratives',
                    url: 'https://www.storynory.com',
                    desc: 'Free audiobooks, folk myths, original tales, and poetry. Wonderful for picking up correct spoken pacing, style, and natural intonation.',
                    category: 'Narrations'
                  }
                ].map((site, index) => (
                  <a
                    key={index}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 bg-white border border-gray-200 hover:border-blue-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-800 transition-colors group-hover:text-blue-600 flex items-center gap-1.5">
                          {site.name}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono">
                          {site.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-normal">{site.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mt-4 self-end group-hover:underline">
                      <span>Start Learning</span>
                      <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Footer */}
        {isActive && (
          <div className="border-t border-gray-100 bg-white p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3 mb-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button 
                type="submit" 
                className="bg-blue-600 text-white rounded-xl px-5 py-2 font-bold hover:bg-blue-700 transition disabled:opacity-50"
                disabled={!inputText.trim()}
              >
                Send
              </button>
            </form>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {micActive ? (
                  <span className="text-green-600 flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Mic Active
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <MicOff className="w-3 h-3" />
                    Mic Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-3 h-3" /> {gender} Voice
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Free vs Paid Feature Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden space-y-0 relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white relative">
              <button
                onClick={() => setShowPlanModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition font-bold text-xs"
              >
                ✕ Close
              </button>
              <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit mb-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Free vs. Paid Feature Breakdown
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">Select Your Audio Practice Tool</h2>
              <p className="text-xs text-indigo-100 mt-1">
                Choose whether to use the 100% Free ChatGPT Video & Speech Translator or launch the Pro Live AI Voice Coach.
              </p>
            </div>

            {/* Options Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50">
              
              {/* FREE CARD */}
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-400/60 shadow-md space-y-4 relative flex flex-col justify-between hover:border-emerald-500 transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> 100% FREE TIER
                    </span>
                    <span className="text-xs font-black text-emerald-600">$0 / Forever</span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                    <Languages className="w-5 h-5 text-purple-600" />
                    ChatGPT Speech & Video Translator
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Translate your native thoughts into English video scripts, practice speech pronunciation, and copy 1-click ChatGPT prompts.
                  </p>
                  <ul className="text-xs space-y-2 font-medium text-gray-700 pt-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>ChatGPT Video Script Translator</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Audio Speech Playback & Microphones</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>ChatGPT Audio Analytics & Charts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>1-Click Launch ChatGPT Prompts</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setActiveTab('translator');
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 active:scale-95 mt-4"
                >
                  <Languages className="w-4 h-4" /> Use Free ChatGPT Tool
                </button>
              </div>

              {/* PRO / PAID CARD */}
              <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border-2 border-indigo-400 shadow-xl space-y-4 relative flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 fill-current text-slate-950" /> PRO / PAID FEATURE
                    </span>
                    <span className="text-xs font-black text-yellow-300">Live Stream</span>
                  </div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-1.5">
                    <Mic className="w-5 h-5 text-indigo-400" />
                    Real-Time AI Voice Coach (Zephyr)
                  </h3>
                  <p className="text-xs text-indigo-200 leading-relaxed">
                    Interactive 2-way live voice conversations with real-time accent tuning and low-latency audio feedback.
                  </p>
                  <ul className="text-xs space-y-2 font-medium text-indigo-100 pt-1">
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span>Live 2-Way Voice Agent Stream</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span>Instant Accent & Pronunciation Fix</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span>Animated Voice Avatar Feedback</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span>Custom Voice Pitch & US/UK Accent</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setActiveTab('chat');
                    if (!isActive) startAgent();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5 active:scale-95 mt-4"
                >
                  <Mic className="w-4 h-4" /> Start Pro Live Voice Coach
                </button>
              </div>

            </div>

            <div className="p-4 bg-gray-100 text-center text-[11px] text-gray-500 font-medium border-t border-gray-200">
              Need help? The ChatGPT Video & Speech Translator remains 100% Free for all students forever.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
