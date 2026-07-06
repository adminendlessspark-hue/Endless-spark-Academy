import React, { useState, useEffect, useRef } from 'react';
import { generateGeminiContent } from '../services/gemini';
import { MessageCircle, Send, X, Bot, User, Loader2, BookOpen, CheckCircle, XCircle, BrainCircuit, Mic, Volume2, Settings2, Sparkles, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../utils';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { useAuth } from '../AuthContext';

// Audio processing functions moved locally
const playAudio = async (base64Audio: string, audioContext: AudioContext, nextStartTimeRef: React.MutableRefObject<number>, isAgentSpeakingRef: React.MutableRefObject<boolean>) => {
  try {
    const binary = atob(base64Audio);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;
    if (audioContext.state === 'suspended') await audioContext.resume();
    const audioBuf = audioContext.createBuffer(1, float32.length, 24000);
    audioBuf.getChannelData(0).set(float32);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuf;
    source.connect(audioContext.destination);
    const now = audioContext.currentTime;
    if (nextStartTimeRef.current < now) nextStartTimeRef.current = now;
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuf.duration;
    isAgentSpeakingRef.current = true;
    source.onended = () => {
      if (audioContext.currentTime >= nextStartTimeRef.current - 0.05) isAgentSpeakingRef.current = false;
    };
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

// Note: We need to export these from CommunicationAgent or move them to a common location.
// For now, I'll assume they are accessible or I'll move them.

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface StudentAIAgentProps {
  embedded?: boolean;
}

export default function StudentAIAgent({ embedded = false }: StudentAIAgentProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Printing and Packaging expert. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  
  // Tabs State
  const [mode, setMode] = useState<'chat' | 'quiz' | 'coach'>('chat');
  
  // Quiz State
  const [quizTopic, setQuizTopic] = useState('');
  const [quizState, setQuizState] = useState<'idle' | 'generating' | 'taking' | 'results'>('idle');
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  
  // Coach State
  const [isCoachActive, setIsCoachActive] = useState(false);
  const [coachInitializing, setCoachInitializing] = useState(false);
  const [coachAgentTranscript, setCoachAgentTranscript] = useState('');
  const [coachUserTranscript, setCoachUserTranscript] = useState('');
  const [coachFeedbackNotes, setCoachFeedbackNotes] = useState<string[]>([]);
  const [coachError, setCoachError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isAgentSpeakingRef = useRef(false);
  const isSessionOpenRef = useRef(false);
  const isCoachActiveRef = useRef(false);

  useEffect(() => {
    // Load knowledge base from admin settings
    const unsub = onSnapshot(doc(db, 'settings', 'admin'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setKnowledgeBase(data.aiKnowledgeBase || '');
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/admin'));

    return () => {
      unsub();
      stopCoach();
    };
  }, []);

  const startCoach = async () => {
    if (isCoachActiveRef.current) return;
    
    setCoachInitializing(true);
    setCoachError(null);
    setCoachFeedbackNotes([]);
    setCoachAgentTranscript('Connecting to Coach...');
    setCoachUserTranscript('');
    nextStartTimeRef.current = 0;
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/chat-live`);
      liveSessionRef.current = ws as any; // Using any for bridge compatibility

      ws.onopen = () => {
        isSessionOpenRef.current = true;
        // Send setup message
        ws.send(JSON.stringify({ 
          type: "setup",
          config: {
            systemInstruction: "You are a professional Communication Specialist at Endless Spark School. Help students improve spoken communication. Greet warmly. Wrap feedback in *FEEDBACK* - [Feedback Note]."
          }
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.type === "ready") {
          setCoachInitializing(false);
          setIsCoachActive(true);
          isCoachActiveRef.current = true;
          ws.send(JSON.stringify({
            type: "text",
            data: "Hello! I am ready for my communication practice. Please greet me and mention that you will provide feedback for my speech."
          }));

          // Mic Setup
          navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } }).then(stream => {
            mediaStreamRef.current = stream;
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN || isAgentSpeakingRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              const uint8 = new Uint8Array(pcm16.buffer);
              let binary = '';
              for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
              ws.send(JSON.stringify({
                type: "audio",
                data: btoa(binary)
              }));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
            processorRef.current = processor;
            sourceRef.current = source;
          }).catch(e => {
            console.error("Mic error:", e);
            setCoachError("Microphone access denied.");
          });
        } else if (msg.type === "audio") {
          if (audioContextRef.current) {
            playAudio(msg.data, audioContextRef.current, nextStartTimeRef, isAgentSpeakingRef);
          }
        } else if (msg.type === "agent_text") {
          setCoachAgentTranscript(msg.data);
          if (msg.data.includes('*FEEDBACK*')) {
            const notes = msg.data.split('*FEEDBACK*')[1].split('\n').filter((l: string) => l.trim().startsWith('-')).map((l: string) => l.trim().substring(1).trim());
            if (notes.length > 0) setCoachFeedbackNotes(prev => [...new Set([...prev, ...notes])]);
          }
        } else if (msg.type === "user_text") {
          setCoachUserTranscript(msg.data);
        } else if (msg.type === "interrupted") {
          nextStartTimeRef.current = 0;
          isAgentSpeakingRef.current = false;
        } else if (msg.type === "error") {
          setCoachError(msg.message || 'Coach connection error');
          stopCoach();
        } else if (msg.type === "closed") {
          stopCoach();
        }
      };

      ws.onerror = () => {
        setCoachError("Bridge WebSocket error");
        stopCoach();
      };

      ws.onclose = () => {
        if (isCoachActiveRef.current) stopCoach();
      };

    } catch (err: any) {
      setCoachError(err.message || 'Failed to start coach');
      setCoachInitializing(false);
      stopCoach();
    }
  };

  const stopCoach = () => {
    isCoachActiveRef.current = false;
    setIsCoachActive(false);
    isSessionOpenRef.current = false;
    
    if (liveSessionRef.current) {
      try { liveSessionRef.current.close(); } catch(e) {}
      liveSessionRef.current = null;
    }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const systemInstruction = `
        You are an expert AI assistant for students at Endless Spark School of Printing and Packaging.
        Your primary knowledge source is the following authorized content:
        
        --- AUTHORIZED SOURCE START ---
        ${knowledgeBase || "No specific source provided yet. Use general expert knowledge about Printing and Packaging."}
        --- AUTHORIZED SOURCE END ---
        
        Guidelines:
        1. Answer questions strictly based on the authorized source if the information is available there.
        2. If the information is not in the source, use your general expertise in Printing and Packaging to provide a helpful, professional answer.
        3. Be concise, encouraging, and educational.
        4. If a question is completely unrelated to printing, packaging, or the school, politely redirect the student to focus on their studies.
        5. ALWAYS format your answers using bullet points for readability.
        6. Respond in ${language}.
      `;

      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: systemInstruction }] },
          ...messages.map(m => ({ 
            role: m.role as any, 
            parts: [{ text: m.content }] 
          })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          temperature: 0.7,
        }
      });
      const aiResponse = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error: any) {
      console.error('AI Error:', error);
      let errorMessage = error.message || "I encountered an error. Please try again later.";
      
      if (errorMessage.includes('Forbidden') || errorMessage.includes('403') || errorMessage.includes('API_KEY_INVALID')) {
        errorMessage = "🔒 **Access Denied**: It looks like there's an issue with the Gemini API key.\n\n**To fix this:**\n1. Go to the **Settings** menu (bottom left).\n2. Select **Secrets**.\n3. Ensure a valid Gemini API key is selected or provided.";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async (topicToUse?: string) => {
    const finalTopic = topicToUse || quizTopic;
    if (!finalTopic.trim() || isLoading) return;
    setQuizState('generating');
    setIsLoading(true);

    try {
      let prompt = `Generate a 5-question multiple-choice quiz about "${finalTopic}" in the context of Printing and Packaging. Respond ONLY with JSON.`;
      if (finalTopic === "Our AI Agent Knowledge Base Content" && knowledgeBase) {
        prompt = `Generate a 5-question multiple-choice quiz based STRICTLY on the following Knowledge Base text: ${knowledgeBase}\nRespond ONLY with JSON.`;
      }
      
      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.7, responseMimeType: "application/json" }
      });

      setQuizData(JSON.parse(response.text || "[]"));
      setUserAnswers({});
      setQuizState('taking');
    } catch (error: any) {
      console.error('Quiz Error:', error);
      alert(`Error: ${error.message}`);
      setQuizState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  if (embedded) {
    return (
      <div className="w-full max-w-4xl mx-auto h-[600px] bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col overflow-hidden no-print">
        {/* Header */}
        <div className="p-4 bg-pink-600 text-white flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Endless Spark AI</h3>
                <p className="text-[10px] text-pink-100 uppercase tracking-wider font-bold">Smart Student Agent (Preview Mode)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode !== 'coach' && (
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-xs bg-pink-700 text-white border-none rounded p-1 outline-none cursor-pointer focus:ring-2 focus:ring-pink-400"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                </select>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => { setMode('chat'); stopCoach(); }}
              className={cn("flex-1 text-[10px] py-1.5 rounded-md font-bold transition-colors flex items-center justify-center gap-1 uppercase", mode === 'chat' ? "bg-white text-pink-600 shadow-sm" : "text-white hover:bg-white/20")}
            >
              <MessageCircle className="w-3 h-3" /> Chat
            </button>
            <button
              onClick={() => { setMode('quiz'); stopCoach(); }}
              className={cn("flex-1 text-[10px] py-1.5 rounded-md font-bold transition-colors flex items-center justify-center gap-1 uppercase", mode === 'quiz' ? "bg-white text-pink-600 shadow-sm" : "text-white hover:bg-white/20")}
            >
              <BrainCircuit className="w-3 h-3" /> Quiz
            </button>
            {(user?.role !== 'student' || user?.isCommunicationCoachActive) && (
              <button
                onClick={() => setMode('coach')}
                className={cn("flex-1 text-[10px] py-1.5 rounded-md font-bold transition-colors flex items-center justify-center gap-1 uppercase", mode === 'coach' ? "bg-white text-pink-600 shadow-sm" : "text-white hover:bg-white/20 text-pink-50")}
              >
                <Mic className="w-3 h-3" /> Communication Coach
              </button>
            )}
          </div>
        </div>

        {mode === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600")}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn("p-3 rounded-2xl text-sm max-w-[80%] overflow-hidden", msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none")}>
                    {msg.role === 'user' ? msg.content : <div className="markdown-body prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex gap-3"><div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center shrink-0"><Bot className="w-4 h-4" /></div><div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100"><Loader2 className="w-4 h-4 animate-spin text-pink-600" /></div></div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask anything..." className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:opacity-50 transition-all"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        )}

        {mode === 'quiz' && (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {quizState === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <BrainCircuit className="w-12 h-12 text-pink-600 bg-pink-100 p-2 rounded-2xl" />
                <h4 className="font-bold text-gray-900">Study Quiz</h4>
                <input type="text" value={quizTopic} onChange={(e) => setQuizTopic(e.target.value)} placeholder="Topic e.g. Flexography" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none" />
                <button onClick={() => handleGenerateQuiz()} disabled={isLoading || !quizTopic} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold">Start Quiz</button>
                <button onClick={() => handleGenerateQuiz("Our AI Agent Knowledge Base Content")} disabled={isLoading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Quiz from Library</button>
              </div>
            )}
            {quizState === 'generating' && <div className="flex-1 flex flex-col items-center justify-center space-y-2"><Loader2 className="w-8 h-8 animate-spin text-pink-600" /><p className="text-sm text-gray-500">Crafting questions...</p></div>}
            {quizState === 'taking' && (
              <div className="space-y-4">
                {quizData.map((q, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="font-bold text-sm mb-3">{idx + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <button key={oIdx} onClick={() => setUserAnswers(prev => ({ ...prev, [idx]: oIdx }))} className={cn("w-full p-2.5 text-left text-sm rounded-lg border transition-colors", userAnswers[idx] === oIdx ? "bg-pink-50 border-pink-200 text-pink-700 font-medium" : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-white")}>{opt}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => setQuizState('results')} disabled={Object.keys(userAnswers).length < quizData.length} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold">Submit Results</button>
              </div>
            )}
            {quizState === 'results' && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 text-center">
                  <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">Score: {Object.keys(userAnswers).filter(k => userAnswers[Number(k)] === quizData[Number(k)].answer).length}/{quizData.length}</p>
                  <button onClick={() => setQuizState('idle')} className="mt-4 text-sm font-bold text-pink-600 underline">Try Another</button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'coach' && (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 flex flex-col">
            {!isCoachActive ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-pink-100 rounded-3xl flex items-center justify-center animate-pulse">
                  <Mic className="w-10 h-10 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">AI Communication Coach</h4>
                  <p className="text-sm text-gray-500 mt-2">Practice your soft skills and spoken English with real-time feedback.</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-left animate-in fade-in zoom-in-95 duration-200">
                  <h5 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Practice Topics
                  </h5>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Career Introduction</li>
                    <li>• Describing Printing Processes</li>
                    <li>• Client Communication</li>
                  </ul>
                </div>

                <button
                  onClick={startCoach}
                  disabled={coachInitializing}
                  className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
                >
                  {coachInitializing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {coachInitializing ? 'Connecting Coach...' : 'Start Voice Session'}
                </button>
                
                {coachError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {coachError}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-pink-600/10" />
                  <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mb-4 relative z-10">
                    <Volume2 className="w-8 h-8 text-white animate-bounce" />
                  </div>
                  <p className="text-xs font-bold text-pink-600 uppercase tracking-widest animate-pulse">Agent is Listening...</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 relative">
                     <MessageSquareQuote className="w-4 h-4 text-blue-300 absolute top-2 right-2" />
                     <h5 className="text-[10px] font-bold text-blue-400 uppercase mb-1">Your Speech</h5>
                     <p className="text-sm text-blue-800 italic">"{coachUserTranscript || 'Say something to start...'}"</p>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm relative">
                     <Bot className="w-4 h-4 text-pink-200 absolute top-2 right-2" />
                     <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Coach Feedback</h5>
                     <p className="text-sm text-gray-700">{coachAgentTranscript.split('*FEEDBACK*')[0]}</p>
                  </div>
                </div>

                {coachFeedbackNotes.length > 0 && (
                  <div className="space-y-2">
                     <h5 className="text-[10px] font-bold text-gray-400 uppercase px-1">Soft Skill Notes</h5>
                     <div className="space-y-1">
                       {coachFeedbackNotes.map((note, idx) => (
                         <div key={idx} className="p-2 bg-green-50 text-green-700 rounded-lg text-xs border border-green-100 flex items-center gap-2">
                           <CheckCircle className="w-3 h-3 shrink-0" />
                           {note}
                         </div>
                       ))}
                     </div>
                  </div>
                )}

                <button
                  onClick={stopCoach}
                  className="mt-auto w-full py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> End Practice
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="no-print">
      {/* Floating Button */}
      <motion.button
        drag
        dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
        whileDrag={{ scale: 1.1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-44 w-14 h-14 bg-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-pink-700 transition-all z-50 group cursor-move"
      >
        <Bot className="w-7 h-7 group-hover:scale-110 transition-transform pointer-events-none" />
        <span className="absolute right-full mr-4 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Ask Printing AI
        </span>
      </motion.button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 bg-pink-600 text-white flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Endless Spark AI</h3>
                  <p className="text-[10px] text-pink-100 uppercase tracking-wider font-bold">Smart Student Agent</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mode !== 'coach' && (
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="text-xs bg-pink-700 text-white border-none rounded p-1 outline-none cursor-pointer focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                )}
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
              <button
                onClick={() => { setMode('chat'); stopCoach(); }}
                className={cn("flex-1 text-[10px] py-1.5 rounded-md font-bold transition-colors flex items-center justify-center gap-1 uppercase", mode === 'chat' ? "bg-white text-pink-600 shadow-sm" : "text-white hover:bg-white/20")}
              >
                <MessageCircle className="w-3 h-3" /> Chat
              </button>
              <button
                onClick={() => { setMode('quiz'); stopCoach(); }}
                className={cn("flex-1 text-[10px] py-1.5 rounded-md font-bold transition-colors flex items-center justify-center gap-1 uppercase", mode === 'quiz' ? "bg-white text-pink-600 shadow-sm" : "text-white hover:bg-white/20")}
              >
                <BrainCircuit className="w-3 h-3" /> Quiz
              </button>
              {(user?.role !== 'student' || user?.isCommunicationCoachActive) && (
                <button
                  onClick={() => setMode('coach')}
                  className={cn("flex-1 text-[10px] py-1.5 rounded-md font-bold transition-colors flex items-center justify-center gap-1 uppercase", mode === 'coach' ? "bg-white text-pink-600 shadow-sm" : "text-white hover:bg-white/20 text-pink-50")}
                >
                  <Mic className="w-3 h-3" /> Communication Coach
                </button>
              )}
            </div>
          </div>

          {mode === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600")}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={cn("p-3 rounded-2xl text-sm max-w-[80%] overflow-hidden", msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none")}>
                      {msg.role === 'user' ? msg.content : <div className="markdown-body prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="flex gap-3"><div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center shrink-0"><Bot className="w-4 h-4" /></div><div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100"><Loader2 className="w-4 h-4 animate-spin text-pink-600" /></div></div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask anything..." className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                  <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:opacity-50 transition-all"><Send className="w-5 h-5" /></button>
                </div>
              </div>
            </>
          )}

          {mode === 'quiz' && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              {quizState === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <BrainCircuit className="w-12 h-12 text-pink-600 bg-pink-100 p-2 rounded-2xl" />
                  <h4 className="font-bold text-gray-900">Study Quiz</h4>
                  <input type="text" value={quizTopic} onChange={(e) => setQuizTopic(e.target.value)} placeholder="Topic e.g. Flexography" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none" />
                  <button onClick={() => handleGenerateQuiz()} disabled={isLoading || !quizTopic} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold">Start Quiz</button>
                  <button onClick={() => handleGenerateQuiz("Our AI Agent Knowledge Base Content")} disabled={isLoading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Quiz from Library</button>
                </div>
              )}
              {quizState === 'generating' && <div className="flex-1 flex flex-col items-center justify-center space-y-2"><Loader2 className="w-8 h-8 animate-spin text-pink-600" /><p className="text-sm text-gray-500">Crafting questions...</p></div>}
              {quizState === 'taking' && (
                <div className="space-y-4">
                  {quizData.map((q, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <p className="font-bold text-sm mb-3">{idx + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <button key={oIdx} onClick={() => setUserAnswers(prev => ({ ...prev, [idx]: oIdx }))} className={cn("w-full p-2.5 text-left text-sm rounded-lg border transition-colors", userAnswers[idx] === oIdx ? "bg-pink-50 border-pink-200 text-pink-700 font-medium" : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-white")}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setQuizState('results')} disabled={Object.keys(userAnswers).length < quizData.length} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold">Submit Results</button>
                </div>
              )}
              {quizState === 'results' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-xl border border-gray-100 text-center">
                    <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">Score: {Object.keys(userAnswers).filter(k => userAnswers[Number(k)] === quizData[Number(k)].answer).length}/{quizData.length}</p>
                    <button onClick={() => setQuizState('idle')} className="mt-4 text-sm font-bold text-pink-600 underline">Try Another</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'coach' && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 flex flex-col">
              {!isCoachActive ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                  <div className="w-20 h-20 bg-pink-100 rounded-3xl flex items-center justify-center animate-pulse">
                    <Mic className="w-10 h-10 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">AI Communication Coach</h4>
                    <p className="text-sm text-gray-500 mt-2">Practice your soft skills and spoken English with real-time feedback.</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-left">
                    <h5 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Practice Topics
                    </h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Career Introduction</li>
                      <li>• Describing Printing Processes</li>
                      <li>• Client Communication</li>
                    </ul>
                  </div>

                  <button
                    onClick={startCoach}
                    disabled={coachInitializing}
                    className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
                  >
                    {coachInitializing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {coachInitializing ? 'Connecting Coach...' : 'Start Voice Session'}
                  </button>
                  
                  {coachError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      {coachError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-6">
                  {/* Active Visualizer (Mock/Static or passed through) */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-pink-600/10" />
                    <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mb-4 relative z-10">
                      <Volume2 className="w-8 h-8 text-white animate-bounce" />
                    </div>
                    <p className="text-xs font-bold text-pink-600 uppercase tracking-widest animate-pulse">Agent is Listening...</p>
                  </div>

                  {/* Transcripts */}
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 relative">
                       <MessageSquareQuote className="w-4 h-4 text-blue-300 absolute top-2 right-2" />
                       <h5 className="text-[10px] font-bold text-blue-400 uppercase mb-1">Your Speech</h5>
                       <p className="text-sm text-blue-800 italic">"{coachUserTranscript || 'Say something to start...'}"</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm relative">
                       <Bot className="w-4 h-4 text-pink-200 absolute top-2 right-2" />
                       <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Coach Feedback</h5>
                       <p className="text-sm text-gray-700">{coachAgentTranscript.split('*FEEDBACK*')[0]}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {coachFeedbackNotes.length > 0 && (
                    <div className="space-y-2">
                       <h5 className="text-[10px] font-bold text-gray-400 uppercase px-1">Soft Skill Notes</h5>
                       <div className="space-y-1">
                         {coachFeedbackNotes.map((note, idx) => (
                           <div key={idx} className="p-2 bg-green-50 text-green-700 rounded-lg text-xs border border-green-100 flex items-center gap-2">
                             <CheckCircle className="w-3 h-3 shrink-0" />
                             {note}
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  <button
                    onClick={stopCoach}
                    className="mt-auto w-full py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> End Practice
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
