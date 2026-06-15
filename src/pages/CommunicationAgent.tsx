import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Zap, Loader2, Volume2, User as UserIcon, Globe, BookOpen, ExternalLink } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface TranscriptLine {
  id: string;
  sender: 'user' | 'agent';
  text: string;
}

export default function CommunicationAgent() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [feedbackNotes, setFeedbackNotes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'resources'>('chat');
  const [error, setError] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [accent, setAccent] = useState<'US' | 'UK' | 'Australia'>('US');

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
              <h1 className="text-xl font-bold">Communication Coach</h1>
              <p className="text-sm text-gray-500">Practice your English, pronunciation, and confidence.</p>
            </div>
          </div>
          <div>
            {!isActive && !isInitializing && (
              <button
                onClick={startAgent}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm hover:shadow"
              >
                <Mic className="w-5 h-5" />
                Start Conversation
              </button>
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

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Conversation
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
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
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'resources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-500" />
            English Practice Resources
          </button>
        </div>

        {/* Chat / Notes Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          
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
    </div>
  );
}
