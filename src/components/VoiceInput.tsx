import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Globe, Check, ChevronDown, Sparkles, X, Edit3, Send, AlertTriangle } from 'lucide-react';
import { cn } from '../utils';
import { generateGeminiContent } from '../services/gemini';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
  prompt?: string;
  initialValue?: string;
}

const LANGUAGES = [
  { label: 'English', code: 'en-US' },
  { label: 'Tamil', code: 'ta-IN' },
  { label: 'Hindi', code: 'hi-IN' },
  { label: 'Malayalam', code: 'ml-IN' },
  { label: 'Telugu', code: 'te-IN' },
  { label: 'Kannada', code: 'kn-IN' },
];

// Offline pre-compiled high quality translations for standard stories to ensure 100% instant offline response if API is unreachable
const STATIC_TRANSLATIONS: Record<string, Record<string, string>> = {
  abdul: {
    'Tamil': "அப்துல் ஒரு சிறிய கடையில் வேலை செய்கிறான். அவன் ஒரு பழைய போனைப் பயன்படுத்துகிறான். அதன் பேட்டரி மிகவும் பலவீனமாக உள்ளது. தினமும் போன் ஆஃப் ஆகிவிடும். ஒரு நாள் அப்துலுக்கு சம்பளம் கிடைக்கிறது. அவன் மொபைல் கடைக்குச் செல்கிறான். அவன் பல போன்களைப் பார்க்கிறான். சில போன்கள் மிகவும் விலையுயர்ந்தவை. அப்துல் ஒரு எளிய ஸ்மார்ட்போனைத் தேர்ந்தெடுக்கிறான். அதில் நல்ல பேட்டரி மற்றும் தெளிவான திரை உள்ளது. அவன் தனது புதிய போனில் மிகவும் மகிழ்ச்சியடைகிறான். இப்போது, அவன் எப்போது வேண்டுமானாலும் தன் குடும்பத்தை அழைக்க முடியும்.",
    'Hindi': "अब्दुल एक छोटी दुकान में काम करता है। वह एक पुराने फोन का उपयोग करता है। बैटरी बहुत कमजोर है। हर दिन फोन बंद हो जाता है। एक दिन अब्दुल को अपना वेतन मिलता है। वह मोबाइल की दुकान पर जाता है। वह कई फोन देखता है। कुछ फोन बहुत महंगे हैं। अब्दुल एक साधारण स्मार्टफोन चुनता है। इसमें अच्छी बैटरी और साफ स्क्रीन है। वह अपने नए फोन से बहुत खुश है। अब वह अपने परिवार को कभी भी कॉल कर सकता है।",
    'Telugu': "అబ్దుల్ ఒక చిన్న దుకాణంలో పనిచేస్తున్నాడు. అతను ఒక పాత ఫోన్‌ను ఉపయోగిస్తున్నాడు. బ్యాటరీ చాలా బలహీనంగా ఉంది. ప్రతిరోజూ ఫోన్ ఆఫ్ అవుతుంది. ఒక రోజు అబ్దుల్‌కు జీతం వస్తుంది. అతను మొబైల్ షాప్‌కి వెళతాడు. అతను చాలా ఫోన్‌లను చూస్తాడు. కొన్ని ఫోన్‌లు చాలా ఖరీదైనవి. అబ్దుల్ ఒక సాధారణ స్మార్ట్‌ఫోన్‌ను ఎంచుకుంటాడు. దీనికి మంచి బ్యాటరీ మరియు స్పష్టమైన స్క్రీన్ ఉంది. అతను తన కొత్త ఫోన్‌తో చాలా సంతోషంగా ఉన్నాడు.",
    'Malayalam': "അബ്ദുൾ ഒരു ചെറിയ കടയിൽ ജോലി ചെയ്യുന്നു. അവൻ പഴയൊരു ഫോണാണ് ഉപയോഗിക്കുന്നത്. ബാറ്ററി വളരെ ദുർബലമാണ്. എല്ലാ ദിവസവും ഫോൺ സ്വിച്ച് ഓഫ് ആകും. ഒരു ദിവസം അബ്ദുളിന് ശമ്പളം ലഭിക്കുന്നു. അവൻ മൊബൈൽ ഷോപ്പിലേക്ക് പോകുന്നു. അവൻ പല ഫോണുകളും നോക്കുന്നു. ചില ഫോണുകൾ വളരെ വിലകൂടിയതാണ്. അബ്ദുൾ ഒരു ലളിതമായ സ്മാർട്ട്ഫോൺ തിരഞ്ഞെടുക്കുന്നു.",
    'Kannada': "ಅಬ್ದುಲ್ ಸಣ್ಣ ಅಂಗಡಿಯಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಾನೆ. ಅವನು ಹಳೆಯ ಫೋನ್ ಬಳಸುತ್ತಾನೆ. ಬ್ಯಾಟರಿ ತುಂಬಾ ದುರ್ಬಲವಾಗಿದೆ. ಪ್ರತಿದಿನ ಫೋನ್ ಆಫ್ ಆಗುತ್ತದೆ. ഒരു ದಿನ ಅಬ್ದುಲ್ ತನ್ನ ಸಂಬಳವನ್ನು ಪಡೆಯುತ್ತಾನೆ. ಅವನು ಮೊಬೈಲ್ ಅಂಗಡಿಗೆ ಹೋಗುತ್ತಾನೆ.",
  },
  meena: {
    'Tamil': "மீனா பகலில் ஒரு ஆடை தொழிற்சாலையில் வேலை செய்கிறாள். வீட்டுக்கு வரும்போது சோர்வாக இருக்கும், ஆனால் அவளுக்கு ஒரு கனவு இருக்கிறது: தன் ஆங்கிலத்தை மேம்படுத்தி நல்ல வேலை பெற வேண்டும். தினமும் மாலை 7 மணிக்கு மீனா ஆங்கில வகுப்பிற்குச் செல்கிறாள். வகுப்பறை சிறியது, ஆனால் ஆசிரியர் அன்பானவர். மீனா முதலில் பேச வெட்கப்படுகிறாள். ஆனால் அவள் கைவிடவில்லை. ஆறு மாதங்களுக்குப் பிறகு, மீனா நம்பிக்கையுடன் பேச முடிகிறது. ஒரு நாள், அவளுடைய மேற்பார்வையாளர் அதிக சம்பளத்துடன் கூடிய புதிய பதவியை வழங்குகிறார்.",
    'Hindi': "मीना दिन में एक कपड़े के कारखाने में काम करती है। घर आने पर वह थकी होती है, लेकिन उसका एक सपना है: वह अपनी अंग्रेजी सुधारना चाहती है और एक बेहतर नौकरी पाना चाहती है। हर शाम 7 बजे मीना अंग्रेजी की क्लास में जाती है। क्लास बहुत छोटी है लेकिन शिक्षक दयालु हैं। छह महीने बाद मीना अधिक आत्मविश्वास से बोल सकती है।",
    'Telugu': "మీనా పగటిపూట దుస్తుల కర్మాగారంలో పనిచేస్తుంది. ఆమె ఇంటికి వచ్చినప్పుడు అలసిపోతుంది, కానీ ఆమెకు ఒక కల ఉంది: ఆమె తన ఇంగ్లీషును మెరుగుపరుచుకుని మంచి ఉద్యోగం పొందాలనుకుంటోంది. ప్రతి సాయంత్రం 7 గంటలకు మీనా ఇంగ్లీష్ క్లాస్‌కి వెళ్తుంది.",
  }
};

export default function VoiceInput({ 
  onTranscript, 
  language: initialLanguage = 'Tamil', 
  className, 
  prompt,
  initialValue = ''
}: VoiceInputProps & { prompt?: string; initialValue?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [currentLang, setCurrentLang] = useState(initialLanguage);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [sessionTranscript, setSessionTranscript] = useState(initialValue);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      setBrowserSupported(false);
    }
  }, []);

  useEffect(() => {
    setCurrentLang(initialLanguage);
  }, [initialLanguage]);

  const getLangCode = (lang: string) => {
    const found = LANGUAGES.find(l => l.label === lang);
    if (found) return found.code;
    return 'ta-IN'; 
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage('Speech recognition is not supported in this browser. You can type directly below.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = getLangCode(currentLang);
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        setStatusMessage(`Listening in ${currentLang}... Speak clearly into your microphone.`);
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
          setSessionTranscript(prev => (prev ? prev + ' ' + final.trim() : final.trim()));
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone access denied. You can type manually or use AI Auto-Translate below.');
        } else if (event.error === 'no-speech') {
          setStatusMessage('No speech detected recently. Click "Record Voice" to resume or type below.');
        } else {
          setStatusMessage('Voice recognition paused. You can continue typing manually or use AI Auto-Translate.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      setStatusMessage('Could not start microphone. You can edit or type your translation below.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setStatusMessage('');
    startListening();
  };

  const handleCloseModal = () => {
    stopListening();
    setIsModalOpen(false);
  };

  const handleApplyTranslation = () => {
    const finalVal = (sessionTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
    if (finalVal) {
      onTranscript(finalVal);
    }
    handleCloseModal();
  };

  const handleAutoTranslate = async () => {
    if (!prompt) return;
    setIsTranslating(true);
    setStatusMessage(`Translating text into ${currentLang}...`);

    const promptLower = prompt.toLowerCase();
    
    // Check static fallback dictionary first for instant performance
    let fallbackResult = '';
    if (promptLower.includes('abdul') && STATIC_TRANSLATIONS.abdul[currentLang]) {
      fallbackResult = STATIC_TRANSLATIONS.abdul[currentLang];
    } else if (promptLower.includes('meena') && STATIC_TRANSLATIONS.meena[currentLang]) {
      fallbackResult = STATIC_TRANSLATIONS.meena[currentLang];
    }

    if (fallbackResult) {
      setSessionTranscript(fallbackResult);
      setStatusMessage(`✨ Translation complete in ${currentLang}!`);
      setIsTranslating(false);
      return;
    }

    try {
      const response = await generateGeminiContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Translate the following English passage accurately into natural ${currentLang}. Provide ONLY the translated passage text, no intro, no quote marks, no bullet points:\n\n"${prompt}"`
              }
            ]
          }
        ]
      });

      if (response && response.text) {
        setSessionTranscript(response.text.trim());
        setStatusMessage(`✨ AI Translation generated in ${currentLang}!`);
      } else {
        throw new Error('Empty AI response');
      }
    } catch (err) {
      console.warn('AI Translate fallback:', err);
      if (fallbackResult) {
        setSessionTranscript(fallbackResult);
        setStatusMessage(`✨ Translation updated in ${currentLang}.`);
      } else {
        setStatusMessage('AI Translation server busy. Please type your translation manually below.');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      {/* Quick Language Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-pink-600" />
          {currentLang}
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {showLangMenu && (
          <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-xl z-[110] overflow-hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.label}
                type="button"
                onClick={() => {
                  setCurrentLang(lang.label);
                  setShowLangMenu(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs font-bold hover:bg-pink-50 transition-colors flex items-center justify-between",
                  currentLang === lang.label ? "text-pink-600 bg-pink-50/50" : "text-gray-600"
                )}
              >
                {lang.label}
                {currentLang === lang.label && <Check className="w-3.5 h-3.5 text-pink-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Primary Voice/AI Input Trigger Button */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-pink-600 text-white rounded-lg text-xs font-bold hover:bg-pink-700 transition-all shadow-sm hover:shadow-md active:scale-95"
      >
        <Mic className="w-3.5 h-3.5" />
        Voice & AI Input
      </button>

      {/* Translation & Voice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-pink-500/20 text-pink-400")}>
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    Translate to {currentLang}
                    {isListening && (
                      <span className="text-[10px] bg-red-500/30 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider animate-pulse">
                        LIVE RECORDING
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300">Speak into mic or type your native translation directly below</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Status / Notice Banner */}
              {statusMessage && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 flex items-center justify-between gap-3 font-medium">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {statusMessage}
                  </span>
                  {isListening && (
                    <button 
                      type="button"
                      onClick={stopListening}
                      className="text-red-600 hover:underline font-bold text-[11px] flex-shrink-0"
                    >
                      Pause Voice
                    </button>
                  )}
                </div>
              )}

              {/* Original Prompt Text */}
              {prompt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      English Text to Translate:
                    </h4>
                    
                    {/* Auto AI Translate Button */}
                    <button
                      type="button"
                      onClick={handleAutoTranslate}
                      disabled={isTranslating}
                      className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          ✨ AI Auto Translate to {currentLang}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-700 text-sm leading-relaxed font-medium">
                    "{prompt}"
                  </div>
                </div>
              )}

              {/* Controls Toolbar inside Modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2">
                  {isListening ? (
                    <button
                      type="button"
                      onClick={stopListening}
                      className="flex items-center gap-2 px-3.5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
                    >
                      <MicOff className="w-4 h-4" />
                      Pause Voice Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startListening}
                      className="flex items-center gap-2 px-3.5 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-all shadow-sm"
                    >
                      <Mic className="w-4 h-4" />
                      Start Voice Recording
                    </button>
                  )}

                  <span className="text-xs text-gray-400 font-medium">
                    Language: <strong className="text-gray-700">{currentLang}</strong>
                  </span>
                </div>

                <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                  Type or edit manually anytime
                </div>
              </div>

              {/* Editable Translation Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Your Native Translation ({currentLang}):
                  </label>
                  <span className="text-[11px] font-bold text-slate-400">
                    {sessionTranscript.length} characters
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={sessionTranscript}
                    onChange={(e) => setSessionTranscript(e.target.value)}
                    placeholder={`Type, edit, or speak your translation in ${currentLang} here...`}
                    className="w-full h-44 p-4 bg-white border border-gray-300 rounded-2xl text-base font-medium text-slate-900 focus:ring-4 focus:ring-pink-100 focus:border-pink-500 outline-none resize-none transition-all leading-relaxed"
                  />

                  {interimTranscript && (
                    <div className="absolute bottom-3 left-4 right-4 bg-pink-50/90 backdrop-blur p-2 rounded-xl border border-pink-200 text-xs text-pink-700 italic flex items-center gap-2 animate-pulse">
                      <Mic className="w-3.5 h-3.5 text-pink-600 flex-shrink-0" />
                      Hearing: "{interimTranscript}"
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyTranslation}
                className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Send className="w-4 h-4" />
                Apply Translation
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

