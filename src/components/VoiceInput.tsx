import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '../utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
}

const LANGUAGES = [
  { label: 'English', code: 'en-US' },
  { label: 'Tamil', code: 'ta-IN' },
  { label: 'Hindi', code: 'hi-IN' },
  { label: 'Malayalam', code: 'ml-IN' },
  { label: 'Telugu', code: 'te-IN' },
  { label: 'Kannada', code: 'kn-IN' },
];

export default function VoiceInput({ onTranscript, language: initialLanguage = 'Tamil', className, prompt }: VoiceInputProps & { prompt?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [currentLang, setCurrentLang] = useState(initialLanguage);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [sessionTranscript, setSessionTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      setBrowserSupported(false);
    }
  }, []);

  const getLangCode = (lang: string) => {
    const found = LANGUAGES.find(l => l.label === lang);
    if (found) return found.code;
    return 'ta-IN'; 
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = getLangCode(currentLang);
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
      setSessionTranscript('');
    };

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        onTranscript(final);
        setSessionTranscript(prev => prev + ' ' + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  if (!browserSupported) return null;

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-all"
        >
          <Globe className="w-3 h-3 text-pink-600" />
          {currentLang}
          <ChevronDown className="w-3 h-3" />
        </button>

        {showLangMenu && (
          <div className="absolute top-full right-0 mt-1 w-28 bg-white border border-gray-200 rounded-xl shadow-xl z-[110] overflow-hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.label}
                onClick={() => {
                  setCurrentLang(lang.label);
                  setShowLangMenu(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-[10px] font-bold hover:bg-pink-50 transition-colors flex items-center justify-between",
                  currentLang === lang.label ? "text-pink-600 bg-pink-50/50" : "text-gray-600"
                )}
              >
                {lang.label}
                {currentLang === lang.label && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm",
            isListening 
              ? "bg-red-600 text-white animate-pulse" 
              : "bg-white border border-gray-200 text-gray-700 hover:border-pink-200 hover:text-pink-600"
          )}
        >
          {isListening ? (
            <>
              <Mic className="w-3 h-3" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-3 h-3" />
              Voice Input
            </>
          )}
        </button>

        {isListening && (
          <div className="fixed inset-x-0 bottom-0 top-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl bg-white rounded-t-[2.5rem] rounded-b-[1rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Recording in {currentLang}</span>
                </div>
                <button 
                  onClick={toggleListening}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  Stop Recording
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                {prompt && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Translate this text:</h4>
                    <p className="text-gray-600 italic leading-relaxed text-sm bg-pink-50 p-4 rounded-2xl border border-pink-100">
                      "{prompt}"
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Your Translation:</h4>
                  <div className="space-y-3">
                    <p className="text-lg font-medium text-gray-900 leading-relaxed">
                      {sessionTranscript}
                      <span className="text-gray-400 italic"> {interimTranscript}</span>
                      <span className="inline-block w-1 h-6 bg-pink-600 ml-1 animate-pulse" />
                    </p>
                    {(!sessionTranscript && !interimTranscript) && (
                      <p className="text-gray-400 italic text-sm">Start speaking to see the transcript here...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 text-center text-[10px] text-gray-400 font-medium">
                Tip: Speak clearly and pauses will be handled automatically. Click "Stop Recording" when finished.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
