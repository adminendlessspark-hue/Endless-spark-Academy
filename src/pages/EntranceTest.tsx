import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../utils';
import { CheckCircle, AlertCircle, Loader2, Play, Pause, Volume2, ArrowLeft } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import { GoogleGenAI, Type } from '@google/genai';
import { generateGeminiContent } from '../services/gemini';

const FATMAN_STORY_TEXT = `There is a fat man. He wants to lose weight. He is very fat. He weighs 300 pounds. The doctor tells him, "You must lose weight or you will die." The fat man is scared. He doesn't want to die. So he starts a diet. For one month, he eats only grass. Of course, the grass tastes terrible. But the man wants to lose weight. Unfortunately, after one month, he is still very fat. He does not lose any weight! Not one pound! He is frustrated. He decides to exercise. Every day, he walks 12 miles. He is very tired. In fact, he is exhausted. But after one month, he is still very fat! Oh, no! He is extremely frustrated. He decides to give up. He goes to a restaurant. He wants to eat everything because he is so frustrated. At the restaurant, he meets a beautiful woman. She likes him, and he likes her. They begin to date. Every day, the beautiful woman cooks healthy food for the fat man. His new girlfriend makes a difference in his life. The fat man loses weight! After six months, he weighs only 170 pounds. He is thin and he has a wonderful girlfriend. The man and his girlfriend are both thrilled.`;

export default function EntranceTest({ isDemo = false }: { isDemo?: boolean }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [currentPart, setCurrentPart] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');
  const [partAStage, setPartAStage] = useState<'intro' | 'memorize' | 'questions'>('intro');
  const [timeLeft, setTimeLeft] = useState(20);
  const [showLanguageModal, setShowLanguageModal] = useState(!isDemo && !user?.nativeLanguage);
  const [showDemoLeadModal, setShowDemoLeadModal] = useState(isDemo);
  const [demoLeadInfo, setDemoLeadInfo] = useState({ name: '', email: '', phone: '' });
  const [selectedLanguage, setSelectedLanguage] = useState((!isDemo && user?.nativeLanguage) || '');
  
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [ttsProgress, setTtsProgress] = useState(0);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (currentPart !== 'D' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      setTtsPaused(false);
    }
  }, [currentPart]);

  const startTts = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(FATMAN_STORY_TEXT);
      utterance.rate = 0.95;
      utterance.onend = () => {
        setTtsPlaying(false);
        setTtsPaused(false);
        setTtsProgress(100);
      };
      utterance.onerror = () => {
        setTtsPlaying(false);
        setTtsPaused(false);
      };
      setTtsPlaying(true);
      setTtsPaused(false);
      setTtsProgress(0);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  };

  const pauseTts = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setTtsPaused(false);
        } else {
          window.speechSynthesis.pause();
          setTtsPaused(true);
        }
      }
    }
  };

  const stopTts = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      setTtsPaused(false);
      setTtsProgress(0);
    }
  };
  
  const [audioUrl, setAudioUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Answers state
  const [answers, setAnswers] = useState({
    partA: { q1: '', q2: '', q3: '', q4: '', q5: '' },
    partB_understanding: { q1: '', q2: '', q3: '', q4: '', q5: '' },
    partB_grammar: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: '' },
    partC: { story1: '', story2: '' },
    partD_listening: '',
    partE_paragraph: '',
    partF: { q1: '', q2: '', q3: '', q4: '', q5: '' }
  });

  useEffect(() => {
    // Fetch audio URL from settings
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'admin'));
        if (docSnap.exists() && docSnap.data().entranceTestAudioUrl) {
          setAudioUrl(docSnap.data().entranceTestAudioUrl);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (partAStage === 'memorize' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (partAStage === 'memorize' && timeLeft === 0) {
      setPartAStage('questions');
    }
    return () => clearTimeout(timer);
  }, [partAStage, timeLeft]);

  const handleStartMemorize = () => {
    setPartAStage('memorize');
    setTimeLeft(20);
  };

  const handleAnswerChange = (part: string, subPart: string | null, question: string, value: string) => {
    setAnswers(prev => {
      if (part === 'partD_listening' || part === 'partE_paragraph') {
        return {
          ...prev,
          [part]: value
        };
      }
      if (subPart) {
        return {
          ...prev,
          [part]: {
            ...(prev as any)[part],
            [question]: value
          }
        };
      } else {
        return {
          ...prev,
          [part]: {
            ...prev[part as keyof typeof prev] as any,
            [question]: value
          }
        };
      }
    });
  };

  const handleAppendAnswer = (part: string, question: string, text: string) => {
    setAnswers(prev => {
      if (part === 'partD_listening' || part === 'partE_paragraph') {
        return {
          ...prev,
          [part]: text.trim()
        };
      }
      const currentPart = (prev as any)[part] || {};
      return {
        ...prev,
        [part]: {
          ...currentPart,
          [question]: text.trim()
        }
      };
    });
  };

  const calculateMultipleChoiceMarks = () => {
    let marks = 0;
    const correctAnswers = {
      partA: { q1: 'B', q2: 'B', q3: 'A', q4: 'A', q5: 'B' },
      partB_understanding: { q1: 'D', q2: 'B', q3: 'B', q4: 'C', q5: 'A', q6: 'C', q7: 'C', q8: 'B', q9: 'B', q10: 'C' },
      partB_grammar: { q1: 'B', q2: 'B', q3: 'B', q4: 'B', q5: 'A', q6: 'B', q7: 'C', q8: 'B', q9: 'B', q10: 'A' }
    };

    Object.keys(correctAnswers.partA).forEach(q => {
      if (answers.partA[q as keyof typeof answers.partA] === correctAnswers.partA[q as keyof typeof correctAnswers.partA]) marks += 1;
    });
    Object.keys(correctAnswers.partB_understanding).forEach(q => {
      if ((answers.partB_understanding as any)[q] === (correctAnswers.partB_understanding as any)[q]) marks += 1;
    });
    Object.keys(correctAnswers.partB_grammar).forEach(q => {
      if (answers.partB_grammar[q as keyof typeof answers.partB_grammar] === correctAnswers.partB_grammar[q as keyof typeof correctAnswers.partB_grammar]) marks += 1;
    });

    return marks; // Out of 25
  };

  const evaluateWithAI = async () => {
    const prompt = `
      You are an expert language evaluator. Please evaluate the following student submissions for an entrance test.
      The student's native language is: ${selectedLanguage}.

      Task 1: Translate Story 1 to Native Language
      Original: Abdul works in a small shop. He uses an old phone. The battery is very weak. Every day, the phone switches off. One day, Abdul gets his salary. He goes to the mobile shop. He looks at many phones. Some phones are very expensive. Abdul chooses a simple smartphone. It has a good battery and a clear screen. He is very happy with his new phone. Now, he can call his family anytime.
      Student Translation: ${answers.partC.story1}
      
      Task 2: Translate Story 2 to Native Language
      Original: Meena works in a garment factory during the day. She is tired when she comes home, but she has a dream: she wants to improve her English and get a better job. Every evening at 7 p.m., Meena goes to an English class. The classroom is small, but the teacher is kind and patient. There are students of different ages; some are young, while others are older adults. At first, Meena feels shy speaking in English. She makes many mistakes and sometimes forgets words, but she does not give up. She practices a little every day, even on Sundays. After six months, Meena can speak more confidently. She can answer customers in English at the factory, and her supervisor has noticed her improvement. One day, he offers her a new position with a higher salary. Meena thanks her teacher and classmates. She understands that small, daily efforts can change her life.
      Student Translation: ${answers.partC.story2}

      Task 3: Listening Practice (FatMan Story)
      Student wrote down what they heard/translated to ${selectedLanguage}: ${answers.partD_listening}

      Task 4: Paragraph Writing (My Daily Routine)
      Student Paragraph: ${answers.partE_paragraph}

      Task 5: Story Understanding (The Starfish Thrower)
      The Story:
      An old man was walking along a beach after a big storm. The shore was covered with thousands of starfish that had been washed up by the waves. Under the hot sun, the starfish were drying out and dying.
      As the man walked, he saw a young girl. She was constantly picking up starfish and throwing them back into the ocean. The old man approached her and said, "Little girl, why are you doing this? There are miles of beach and thousands of starfish. You cannot possibly save them all. It doesn’t even make a difference!"
      The girl listened politely. Then, she bent down, picked up another starfish, and threw it into the sea. She smiled at the man and said, "It made a difference to that one."

      Questions & Student Answers:
      1. Where was the old man walking? -> ${answers.partF.q1}
      2. What happened to the starfish after the storm? -> ${answers.partF.q2}
      3. What was the young girl doing? -> ${answers.partF.q3}
      4. Why did the old man think the girl’s actions did not make a difference? -> ${answers.partF.q4}
      5. What was the girl’s reply to the old man? -> ${answers.partF.q5}

      Evaluate each task (story1, story2, listening, paragraph, partF) out of 10 marks (Total 50 marks).
      Provide a JSON response with the following structure:
      {
        "marks": {
          "story1": number,
          "story2": number,
          "listening": number,
          "paragraph": number,
          "partF": number
        },
        "totalAiMarks": number,
        "feedback": "Brief overall feedback for the student"
      }
      Do not include any markdown formatting like \`\`\`json, just return the raw JSON object.
    `;

    try {
      const response = await generateGeminiContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marks: {
                type: Type.OBJECT,
                properties: {
                  story1: { type: Type.NUMBER },
                  story2: { type: Type.NUMBER },
                  listening: { type: Type.NUMBER },
                  paragraph: { type: Type.NUMBER },
                  partF: { type: Type.NUMBER }
                },
                required: ["story1", "story2", "listening", "paragraph", "partF"]
              },
              totalAiMarks: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["marks", "totalAiMarks", "feedback"]
          }
        }
      });

      let responseText = response.text || '{}';
      responseText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(responseText);
    } catch (err: any) {
      console.error("AI Evaluation failed:", err);
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
        throw new Error('Access Denied (403). Please check your Gemini API key in the Settings panel. You may need a billing-enabled key for some models.');
      }
      if (err.message && err.message.includes('GEMINI_API_KEY')) {
        throw new Error('Please configure your Gemini API Key in the Settings panel to enable AI evaluation.');
      }
      // Fallback if AI fails
      return {
        marks: { story1: 5, story2: 5, listening: 5, paragraph: 5, partF: 5 },
        totalAiMarks: 25,
        feedback: "Evaluation completed with default marks due to system error."
      };
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      if (!selectedLanguage) {
        throw new Error('Please select your native language first.');
      }

      const mcqMarks = calculateMultipleChoiceMarks();
      const aiEvaluation = await evaluateWithAI();
      const totalMarks = mcqMarks + aiEvaluation.totalAiMarks; // Out of 75

      const testResults = {
        answers,
        mcqMarks,
        aiEvaluation,
        totalMarks,
        maxMarks: 75,
        nativeLanguage: selectedLanguage,
        submittedAt: new Date().toISOString()
      };

      if (isDemo) {
        // Save demo student results to leads collection (CRM)
        await addDoc(collection(db, 'leads'), {
          name: demoLeadInfo.name || 'Demo Student',
          email: demoLeadInfo.email || 'demo@student.com',
          phone: demoLeadInfo.phone || '0000000000',
          source: 'Demo Entrance Test',
          status: 'new',
          testScore: totalMarks,
          testResults: testResults,
          createdAt: new Date().toISOString(),
          notes: `Submitted via Demo Entrance Test. Score: ${totalMarks}/75`
        });
        alert(`Demo Test Completed! Your score is ${totalMarks}/75. In a real scenario, this would be saved to your profile. Your details have been sent to our counselors.`);
        navigate('/');
        return;
      }

      await updateDoc(doc(db, 'users', user!.id), {
        entranceTestStatus: 'evaluated',
        entranceTestMarks: totalMarks,
        entranceTestResults: testResults,
        nativeLanguage: selectedLanguage
      });

      await updateUser({
        entranceTestStatus: 'evaluated',
        entranceTestMarks: totalMarks,
        nativeLanguage: selectedLanguage
      });

      // Trigger WhatsApp notification for entrance test completion (non-blocking)
      fetch('/api/notify-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: user?.name || '',
          studentEmail: user?.email || '',
          studentPhone: (user?.whatsapp || user?.phone || '').replace(/\+/g, ''),
          milestone: 'entrance_test',
          score: totalMarks
        })
      }).catch(err => console.error("Failed to send WhatsApp entrance test completed alert:", err));

      navigate('/entrance-test-results');
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || 'Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isDemo && user?.entranceTestStatus === 'evaluated') {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Completed</h2>
        <p className="text-gray-600 mb-6">You have already completed the entrance test.</p>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 inline-block text-left">
          <p className="text-lg font-bold text-gray-900 mb-2">Your Score: {user.entranceTestMarks} / 75</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/entrance-test-results')}
              className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
            >
              View Detailed Results
            </button>
            <button 
              onClick={() => navigate('/')}
              className="mt-2 text-gray-500 hover:text-gray-900 font-bold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {showDemoLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 font-bold text-2xl">
              D
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Demo Student Entrance Test</h2>
            <p className="text-gray-500 mb-6 text-sm">Please provide your details to begin the demo test. Your results will be saved to our CRM.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={demoLeadInfo.name}
                  onChange={(e) => setDemoLeadInfo({...demoLeadInfo, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                <input 
                  type="email"
                  placeholder="email@example.com"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={demoLeadInfo.email}
                  onChange={(e) => setDemoLeadInfo({...demoLeadInfo, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">WhatsApp Number</label>
                <input 
                  type="tel"
                  placeholder="10-digit number"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={demoLeadInfo.phone}
                  onChange={(e) => setDemoLeadInfo({...demoLeadInfo, phone: e.target.value})}
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                if (!demoLeadInfo.name || !demoLeadInfo.phone) {
                  alert('Please provide name and phone number.');
                  return;
                }
                setShowDemoLeadModal(false);
                setShowLanguageModal(true);
              }}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
            >
              Start Demo Test
            </button>
          </div>
        </div>
      )}

      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Native Language</h2>
            <p className="text-gray-500 mb-6">This will help our AI agent evaluate your translations correctly.</p>
            
            <div className="mb-8">
              <label className="block text-xs font-bold text-pink-600 uppercase mb-2 tracking-wider">Choose Language</label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none appearance-none cursor-pointer transition-all"
                >
                  <option value="" disabled>Select native language...</option>
                  {['Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati', 'Odia', 'Punjabi', 'Assamese', 'Urdu', 'English', 'Other'].map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              
              {selectedLanguage && (
                <div className="mt-4 p-4 bg-pink-50/50 rounded-xl border border-pink-100 text-pink-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></span>
                  AI evaluation will optimize translations for: <strong className="font-bold">{selectedLanguage}</strong>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowLanguageModal(false)}
              disabled={!selectedLanguage}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Continue to Test
            </button>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Entrance Test / <span className="text-pink-600">நுழைவுத் தேர்வு</span></h1>
        <p className="text-xl text-gray-600 mt-3 leading-relaxed max-w-3xl">Please complete all sections carefully. Your answers will be evaluated automatically by our AI system.</p>
      </div>

      {/* Progress Tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        {['A', 'B', 'C', 'D', 'E', 'F'].map((part) => (
          <button
            key={part}
            onClick={() => setCurrentPart(part as any)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              currentPart === part 
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-100 scale-105' 
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            Part {part}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-100/50 border border-gray-100">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium border border-red-100">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* PART A */}
        {currentPart === 'A' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Part A - Memory</h2>
                <p className="text-gray-500 font-medium">Focus: Cognitive Retention & Speed</p>
              </div>
              <div className="px-4 py-2 bg-pink-50 text-pink-600 rounded-xl text-xs font-bold uppercase tracking-widest">
                5 Marks
              </div>
            </div>

            {partAStage === 'intro' && (
              <div className="text-center py-16 bg-gradient-to-br from-pink-50 to-white rounded-[2rem] border border-pink-100/50">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Play className="w-8 h-8 text-pink-600 fill-current" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready for the Memory Challenge?</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                  You will have 20 seconds to memorize a list of items. Stay focused!
                </p>
                <button 
                  onClick={handleStartMemorize}
                  className="bg-pink-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-xl shadow-pink-200 hover:-translate-y-1 active:translate-y-0"
                >
                  Start Recall Session
                </button>
              </div>
            )}

            {partAStage === 'memorize' && (
              <div className="text-center py-16 bg-indigo-50 rounded-[2rem] border border-indigo-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 blur-3xl -mr-16 -mt-16" />
                <div className="text-6xl font-black text-indigo-600 mb-10 drop-shadow-sm">{timeLeft}s</div>
                <div className="space-y-8 text-left max-w-xl mx-auto bg-white p-10 rounded-[2rem] shadow-xl relative z-10">
                  <div className="p-4 border-l-4 border-pink-500 bg-pink-50/30">
                    <p className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-2">Word List 1</p>
                    <p className="text-2xl font-bold text-gray-900 tracking-wide">CAT, HOUSE, RIVER, GREEN, BOTTLE, TRAIN, ORANGE</p>
                  </div>
                  <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50/30">
                    <p className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-2">Number Sequence</p>
                    <p className="text-2xl font-bold text-gray-900 tracking-[0.3em]">7, 4, 9, 2, 5, 8</p>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50/30">
                    <p className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-2">Logical Sentence</p>
                    <p className="text-2xl font-medium text-gray-900 italic">"Smart students finish their work early."</p>
                  </div>
                </div>
              </div>
            )}

            {partAStage === 'questions' && (
              <div className="space-y-10">
                {[
                  { q: "Which word was third in the first list?", id: "q1", opts: ["HOUSE", "RIVER", "GREEN", "BOTTLE"] },
                  { q: "Which pair is in the list?", id: "q2", opts: ["CAT, CAR", "BOTTLE, TRAIN", "RIVER, GLASS", "ORANGE, TREE"] },
                  { q: "Which number was in the 4th position?", id: "q3", opts: ["2", "5", "9", "4"] },
                  { q: "Which word came immediately before \"work\"?", id: "q4", opts: ["their", "finish", "students", "early"] },
                  { q: "Which colors were second and fifth?", id: "q5", opts: ["RED and WHITE", "BLUE and WHITE", "YELLOW and BLACK", "BLUE and BLACK"] }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-5">
                    <div className="flex gap-4">
                       <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-500 shrink-0">{idx+1}</span>
                       <p className="text-xl font-bold text-gray-900 pt-1 leading-relaxed">{item.q}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                      {item.opts.map((opt, i) => (
                        <label key={i} className={cn(
                          "flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all",
                          answers.partA[item.id as keyof typeof answers.partA] === ['A','B','C','D'][i]
                            ? "border-pink-600 bg-pink-50 ring-2 ring-pink-100"
                            : "border-gray-50 bg-gray-50/50 hover:border-gray-100 hover:bg-gray-100/50"
                        )}>
                          <input type="radio" name={`a_${item.id}`} value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partA', null, item.id, e.target.value)} checked={answers.partA[item.id as keyof typeof answers.partA] === ['A','B','C','D'][i]} className="w-5 h-5 text-pink-600 focus:ring-pink-500 border-gray-300" />
                          <span className="font-bold text-gray-700">{['A','B','C','D'][i]}. {opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-10">
                  <button onClick={() => setCurrentPart('B')} className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-pink-600 transition-all shadow-xl shadow-gray-200 flex items-center gap-2">Next Module <ArrowLeft className="w-4 h-4 rotate-180" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PART B */}
        {currentPart === 'B' && (
          <div className="space-y-10 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Part B - Understanding & Grammar</h2>
              
              <div className="space-y-8">
                <h3 className="text-lg font-bold text-pink-600 border-b pb-2">Understanding</h3>
                
                <div className="space-y-4">
                  <p className="font-bold text-gray-900">1. All printers are machines. Some machines are computers. Which statement is definitely true?</p>
                  <div className="space-y-2">
                    {['All computers are printers.', 'Some printers are computers.', 'All machines are printers.', 'Some machines are printers.'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q1" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q1', e.target.value)} checked={answers.partB_understanding.q1 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">2. If yesterday was Monday, what day will it be tomorrow?</p>
                  <div className="space-y-2">
                    {['Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q2" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q2', e.target.value)} checked={answers.partB_understanding.q2 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">3. A student scored 40 marks in Test 1 and 60 marks in Test 2. What is the average mark?</p>
                  <div className="space-y-2">
                    {['45', '50', '55', '60'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q3" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q3', e.target.value)} checked={answers.partB_understanding.q3 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">4. Find the missing number in the series: 3, 6, 9, 12, __, 18</p>
                  <div className="space-y-2">
                    {['13', '14', '15', '16'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q4" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q4', e.target.value)} checked={answers.partB_understanding.q4 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">5. In a class, 10 students like Math, 8 like Science, and 5 like both. How many students like at least one of these subjects?</p>
                  <div className="space-y-2">
                    {['13', '15', '18', '23'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q5" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q5', e.target.value)} checked={answers.partB_understanding.q5 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">6. Which word does NOT belong with the others?</p>
                  <div className="space-y-2">
                    {['Apple', 'Banana', 'Carrot', 'Grape'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q6" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q6', e.target.value)} checked={(answers.partB_understanding as any).q6 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">7. If you rearrange the letters "CIFAIPC", you get the name of an:</p>
                  <div className="space-y-2">
                    {['City', 'Animal', 'Ocean', 'River'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q7" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q7', e.target.value)} checked={(answers.partB_understanding as any).q7 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">8. Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?</p>
                  <div className="space-y-2">
                    {['(1/3)', '(1/8)', '(2/8)', '(1/16)'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q8" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q8', e.target.value)} checked={(answers.partB_understanding as any).q8 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">9. Which number should come next in the series: 7, 10, 8, 11, 9, 12, ...</p>
                  <div className="space-y-2">
                    {['7', '10', '12', '13'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q9" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q9', e.target.value)} checked={(answers.partB_understanding as any).q9 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-gray-900">10. If 5 machines take 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?</p>
                  <div className="space-y-2">
                    {['100 minutes', '50 minutes', '5 minutes', '1 minute'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="b_u_q10" value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_understanding', null, 'q10', e.target.value)} checked={(answers.partB_understanding as any).q10 === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                        <span>{['A','B','C','D'][i]}. {opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8 mt-12">
                <h3 className="text-lg font-bold text-pink-600 border-b pb-2">Simple Grammar Test</h3>
                
                {[
                  { q: "1. I ___ a student.", opts: ["is", "am", "are", "be"] },
                  { q: "2. She ___ to school every day.", opts: ["go", "goes", "going", "gone"] },
                  { q: "3. They ___ football on Sundays.", opts: ["plays", "play", "playing", "played"] },
                  { q: "4. My brother ___ not like coffee.", opts: ["do", "does", "do not", "doing"] },
                  { q: "5. We ___ in Chennai.", opts: ["live", "lives", "living", "lived"] },
                  { q: "6. There is ___ apple on the table.", opts: ["a", "an", "the", "no article"] },
                  { q: "7. This is ___ book I told you about.", opts: ["a", "an", "the", "that"] },
                  { q: "8. She is good ___ English.", opts: ["in", "at", "on", "for"] },
                  { q: "9. Choose the correct sentence.", opts: ["He go to school.", "He goes to school.", "He going to school.", "He is go to school."] },
                  { q: "10. How often ___ you read English books?", opts: ["do", "does", "did", "are"] }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-4">
                    <p className="font-bold text-gray-900">{item.q}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {item.opts.map((opt, i) => (
                        <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                          <input type="radio" name={`b_g_q${idx+1}`} value={['A','B','C','D'][i]} onChange={(e) => handleAnswerChange('partB_grammar', null, `q${idx+1}`, e.target.value)} checked={(answers.partB_grammar as any)[`q${idx+1}`] === ['A','B','C','D'][i]} className="text-pink-600 focus:ring-pink-500" />
                          <span>{['A','B','C','D'][i]}. {opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <button onClick={() => setCurrentPart('A')} className="text-gray-500 hover:text-gray-900 font-bold">Previous</button>
                <button onClick={() => setCurrentPart('C')} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800">Next Part</button>
              </div>
            </div>
          </div>
        )}

        {/* PART C */}
        {currentPart === 'C' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Part C - Translate in Native Language</h2>
              <p className="text-gray-500 text-sm">Read the stories in English and translate them into your native language.</p>
            </div>

            <div className="space-y-12">
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-md hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Story 1: Abdul's New Phone</h3>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">Level: Beginner</span>
                  </div>
                  <VoiceInput 
                    language={selectedLanguage} 
                    prompt="Abdul works in a small shop. He uses an old phone. The battery is very weak. Every day, the phone switches off. One day, Abdul gets his salary. He goes to the mobile shop. He looks at many phones. Some phones are very expensive. Abdul chooses a simple smartphone. It has a good battery and a clear screen. He is very happy with his new phone. Now, he can call his family anytime."
                    initialValue={answers.partC.story1}
                    onTranscript={(text) => handleAppendAnswer('partC', 'story1', text)} 
                  />
                </div>
                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                  <p className="text-xl text-gray-700 leading-relaxed font-medium">
                    Abdul works in a small shop. He uses an old phone. The battery is very weak. Every day, the phone switches off. One day, Abdul gets his salary. He goes to the mobile shop. He looks at many phones. Some phones are very expensive. Abdul chooses a simple smartphone. It has a good battery and a clear screen. He is very happy with his new phone. Now, he can call his family anytime.
                  </p>
                </div>
                <textarea
                  value={answers.partC.story1}
                  onChange={(e) => handleAnswerChange('partC', null, 'story1', e.target.value)}
                  placeholder="Type or use voice to translate here..."
                  className="w-full h-56 p-6 text-xl border border-gray-200 rounded-[1.5rem] focus:ring-4 focus:ring-pink-100 focus:border-pink-500 outline-none resize-none bg-gray-50/20 transition-all font-medium"
                />
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-md hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Story 2: The Evening Class</h3>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">Level: Intermediate</span>
                  </div>
                  <VoiceInput 
                    language={selectedLanguage} 
                    prompt="Meena works in a garment factory during the day. She is tired when she comes home, but she has a dream: she wants to improve her English and get a better job. Every evening at 7 p.m., Meena goes to an English class. The classroom is small, but the teacher is kind and patient. There are students of different ages; some are young, while others are older adults. At first, Meena feels shy speaking in English. She makes many mistakes and sometimes forgets words, but she does not give up. She practices a little every day, even on Sundays. After six months, Meena can speak more confidently. She can answer customers in English at the factory, and her supervisor has noticed her improvement. One day, he offers her a new position with a higher salary. Meena thanks her teacher and classmates. She understands that small, daily efforts can change her life."
                    initialValue={answers.partC.story2}
                    onTranscript={(text) => handleAppendAnswer('partC', 'story2', text)} 
                  />
                </div>
                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                  <p className="text-xl text-gray-700 leading-relaxed font-medium">
                    Meena works in a garment factory during the day. She is tired when she comes home, but she has a dream: she wants to improve her English and get a better job. Every evening at 7 p.m., Meena goes to an English class. The classroom is small, but the teacher is kind and patient. There are students of different ages; some are young, while others are older adults. At first, Meena feels shy speaking in English. She makes many mistakes and sometimes forgets words, but she does not give up. She practices a little every day, even on Sundays. After six months, Meena can speak more confidently. She can answer customers in English at the factory, and her supervisor has noticed her improvement. One day, he offers her a new position with a higher salary. Meena thanks her teacher and classmates. She understands that small, daily efforts can change her life.
                  </p>
                </div>
                <textarea
                  value={answers.partC.story2}
                  onChange={(e) => handleAnswerChange('partC', null, 'story2', e.target.value)}
                  placeholder="Type or use voice to translate here..."
                  className="w-full h-64 p-6 text-xl border border-gray-200 rounded-[1.5rem] focus:ring-4 focus:ring-pink-100 focus:border-pink-500 outline-none resize-none bg-gray-50/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex justify-between pt-10">
              <button onClick={() => setCurrentPart('B')} className="text-gray-400 hover:text-gray-900 font-bold flex items-center gap-2 transition-colors"><ArrowLeft className="w-4 h-4" /> Previous Module</button>
              <button onClick={() => setCurrentPart('D')} className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-pink-600 transition-all shadow-xl shadow-gray-200">Next Module</button>
            </div>
          </div>
        )}

        {/* PART D */}
        {currentPart === 'D' && (
          <div className="space-y-10 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Part D - Listening Practice</h2>
                <p className="text-gray-500 font-medium">Focus: Auditory Processing & Translation</p>
              </div>
              <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold uppercase tracking-widest">
                10 Marks
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-10 rounded-[3rem] border border-blue-100">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-2xl font-black text-blue-900 tracking-tight">FatMan Audio Story</h3>
                <VoiceInput 
                  language={selectedLanguage} 
                  prompt="Listen to the FatMan story audio and translate or summarize it here."
                  initialValue={answers.partD_listening}
                  onTranscript={(text) => handleAppendAnswer('partD_listening', '', text)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Custom Audio Player/Source */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-blue-600" /> Admin Uploaded Audio
                    </h4>
                    <p className="text-xs text-gray-400 mb-4">The native audio player configured by your school administrator.</p>
                  </div>
                  {audioUrl ? (
                    <audio key={audioUrl} controls className="w-full h-12 rounded-lg bg-gray-50 border">
                      <source src={audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-400 italic">
                      No custom audio uploaded by administrator yet.
                    </div>
                  )}
                </div>

                {/* AI Voice Fallback Player */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-pink-600" /> AI Narrator Voice (Fallback)
                    </h4>
                    <p className="text-xs text-gray-400 mb-4">Click below to play the FatMan audio story read out loud by the interactive AI voice narrator.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!ttsPlaying ? (
                      <button
                        type="button"
                        onClick={startTts}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-current" /> Play Story Audio
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={pauseTts}
                          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 text-white font-bold rounded-xl text-xs hover:bg-yellow-600 transition-all shadow-md"
                        >
                          {ttsPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                          {ttsPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          type="button"
                          onClick={stopTts}
                          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition-all shadow-md"
                        >
                          Stop
                        </button>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></span>
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Playing...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <textarea
                value={answers.partD_listening}
                onChange={(e) => handleAnswerChange('partD_listening', null, '', e.target.value)}
                placeholder="Type your translation or summary here..."
                className="w-full h-32 p-4 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium text-gray-800"
              />
            </div>

            <div className="flex justify-between pt-6">
              <button onClick={() => setCurrentPart('C')} className="text-gray-500 hover:text-gray-900 font-bold">Previous</button>
              <button onClick={() => setCurrentPart('E')} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800">Next Part</button>
            </div>
          </div>
        )}

        {/* PART E */}
        {currentPart === 'E' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Part E - Simple Paragraph Task</h2>
              <p className="text-gray-500 text-sm">Write a short paragraph based on the topic below.</p>
            </div>

            <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/30 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="mb-8 relative z-10">
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Topic: My Daily Routine</h3>
                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                  Write a short paragraph (50–100 words) about your daily routine. Include what time you wake up, your studies, and your evening activities.
                </p>
              </div>
              <textarea
                value={answers.partE_paragraph}
                onChange={(e) => handleAnswerChange('partE_paragraph', null, '', e.target.value)}
                placeholder="Share your daily routine here..."
                className="w-full h-72 p-8 text-xl border border-gray-200 rounded-[2rem] focus:ring-4 focus:ring-pink-100 focus:border-pink-500 outline-none resize-none bg-white transition-all font-medium shadow-inner"
              />
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button onClick={() => setCurrentPart('D')} className="text-gray-500 hover:text-gray-900 font-bold">Previous</button>
              <button 
                onClick={() => setCurrentPart('F')}
                className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
              >
                Next Part
              </button>
            </div>
          </div>
        )}

        {/* PART F */}
        {currentPart === 'F' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Part F - Story Understanding</h2>
                <p className="text-gray-500 font-medium">Focus: Critical Thinking & Summarization</p>
              </div>
              <div className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold uppercase tracking-widest">
                10 Marks
              </div>
            </div>

            <div className="bg-purple-50 p-10 rounded-[3rem] border border-purple-100 italic text-xl text-purple-900 leading-relaxed font-medium shadow-inner">
              <h3 className="text-2xl font-black mb-6 non-italic tracking-tight">The Story: The Starfish Thrower</h3>
              <p className="mb-4">An old man was walking along a beach after a big storm. The shore was covered with thousands of starfish that had been washed up by the waves. Under the hot sun, the starfish were drying out and dying.</p>
              <p className="mb-4">As the man walked, he saw a young girl. She was constantly picking up starfish and throwing them back into the ocean. The old man approached her and said, "Little girl, why are you doing this? There are miles of beach and thousands of starfish. You cannot possibly save them all. It doesn’t even make a difference!"</p>
              <p>The girl listened politely. Then, she bent down, picked up another starfish, and threw it into the sea. She smiled at the man and said, "It made a difference to that one."</p>
            </div>

            <div className="space-y-8 mt-10">
              {[
                { id: 'q1', q: "1. Where was the old man walking?" },
                { id: 'q2', q: "2. What happened to the starfish after the storm?" },
                { id: 'q3', q: "3. What was the young girl doing?" },
                { id: 'q4', q: "4. Why did the old man think the girl’s actions did not make a difference?" },
                { id: 'q5', q: "5. What was the girl’s reply to the old man?" },
              ].map((item) => (
                <div key={item.id} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-gray-900">{item.q}</p>
                    <VoiceInput 
                      language={selectedLanguage} 
                      prompt={item.q}
                      initialValue={answers.partF[item.id as keyof typeof answers.partF]}
                      onTranscript={(text) => handleAppendAnswer('partF', item.id, text)} 
                    />
                  </div>
                  <textarea
                    value={answers.partF[item.id as keyof typeof answers.partF]}
                    onChange={(e) => handleAnswerChange('partF', null, item.id, e.target.value)}
                    placeholder="Type or voice your answer here..."
                    className="w-full h-24 p-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none resize-none bg-white font-medium"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-10 border-t border-gray-100">
              <button onClick={() => setCurrentPart('E')} className="text-gray-500 hover:text-gray-900 font-bold">Previous</button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 disabled:opacity-50"
              >
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Submit Test'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
