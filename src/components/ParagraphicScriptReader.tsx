import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Maximize2, Minimize2, ExternalLink, Copy, Check, Volume2, 
  VolumeX, Sparkles, Languages, Search, Type, Printer, X, ArrowRight,
  Clock, Film, CheckCircle2, FileText, Presentation, Loader2, Globe
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateGeminiContent } from '../services/gemini';

export interface ParagraphBlock {
  id: string;
  timestamp?: string;
  title?: string;
  actionNote?: string;
  speaker?: string;
  content: string;
}

interface ParagraphicScriptReaderProps {
  title: string;
  scriptText: string;
  category?: string;
  targetLang?: string;
  translatedText?: string;
  isTranslating?: boolean;
  onTranslate?: (lang: string) => void;
  onTargetLangChange?: (lang: string) => void;
  onPracticeInCoach?: () => void;
}

/**
 * Intelligently parses raw string script text into structured paragraph blocks
 * Splits on double newlines, timestamps, "Part X", "Section X", "[Action:]", or long sentence blocks.
 */
export function parseScriptToParagraphs(rawText: string): ParagraphBlock[] {
  if (!rawText || !rawText.trim()) return [];

  // Normalize newlines
  const text = rawText.replace(/\r\n/g, '\n').trim();

  // Split cleanly on double newlines or explicit [Action:] / Part / Timestamp markers
  const splitRegex = /(?=\[\d{1,2}:\d{2}(?:\s*[-–—]\s*\d{1,2}:\d{2})?\]|\b(?:Part|Section|Lesson|Module)\s+\d+|\bPart\b\s*[:\-–—]|\[Action:)/gi;

  const initialChunks = text.split(/\n\s*\n/);
  const rawBlocks: string[] = [];

  for (const chunk of initialChunks) {
    const subChunks = chunk.split(splitRegex).map(s => s.trim()).filter(Boolean);
    if (subChunks.length > 0) {
      rawBlocks.push(...subChunks);
    } else if (chunk.trim()) {
      rawBlocks.push(chunk.trim());
    }
  }

  // Preserve every single non-empty block with zero content deletion or aggressive merging
  const result: ParagraphBlock[] = [];

  for (let index = 0; index < rawBlocks.length; index++) {
    const blockStr = rawBlocks[index];
    let content = blockStr.trim();
    let timestamp: string | undefined;
    let title: string | undefined;
    let actionNote: string | undefined;
    let speaker: string | undefined;

    // Extract Timestamp e.g. [03:15 – 04:00] or [00:00]
    const tsMatch = content.match(/\[(\d{1,2}:\d{2}(?:\s*[-–—]\s*\d{1,2}:\d{2})?)\]/);
    if (tsMatch) {
      timestamp = tsMatch[1];
      content = content.replace(tsMatch[0], '').trim();
    }

    // Extract Action Notes e.g. [Action: Move your hand...]
    const actionMatch = content.match(/\[Action:\s*([^\]]+)\]/i);
    if (actionMatch) {
      actionNote = actionMatch[1];
      content = content.replace(actionMatch[0], '').trim();
    }

    // Extract Part/Section/Lesson Title e.g. "Part 5: Metallic Book Name & Usage" or "Part 5"
    const partMatch = content.match(/^((?:Part|Section|Lesson|Module)\s+\d+(?:\s*[:\-–—]\s*[^\n"]+|\s+[^\n"]+)?|Part\s*[:\-–—][^\n"]+|[A-Z\s]{4,}:)/i);
    if (partMatch) {
      title = partMatch[1].trim();
      const afterTitle = content.slice(partMatch[0].length).replace(/^[:\-–—\s"'“”]+/, '').trim();
      if (afterTitle) {
        content = afterTitle;
      }
    }

    // Extract Speaker Cue e.g. "Speaker 1:" or "Presenter:"
    const speakerMatch = content.match(/^([A-Z][a-z0-9\s]+:)/);
    if (speakerMatch && !title) {
      speaker = speakerMatch[1];
      const afterSpeaker = content.slice(speakerMatch[0].length).trim();
      if (afterSpeaker) {
        content = afterSpeaker;
      }
    }

    // Clean up leftover outer quotes or leading/trailing punctuation if needed
    content = content.replace(/^["'“”:]+|["'“”:]+$/g, '').trim();

    // If title exists and content starts with title, strip title from content to prevent duplicate title rendering
    if (title && content.toLowerCase().startsWith(title.toLowerCase())) {
      content = content.slice(title.length).replace(/^[:\-–—\s"'“”]+/, '').trim();
    }

    result.push({
      id: `p_${index}_${Date.now()}`,
      timestamp,
      title,
      actionNote,
      speaker,
      content: content || (title ? title : blockStr.trim())
    });
  }

  return result;
}

export const ParagraphicScriptReader: React.FC<ParagraphicScriptReaderProps> = ({
  title,
  scriptText,
  category = 'Video Reference Material',
  targetLang = 'Tamil',
  translatedText = '',
  isTranslating = false,
  onTranslate,
  onTargetLangChange,
  onPracticeInCoach
}) => {
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState<'US' | 'UK' | 'IN' | 'AU'>('UK');
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available voices on mount
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const getVoiceForAccent = (accent: 'US' | 'UK' | 'IN' | 'AU') => {
    if (!availableVoices.length) return null;
    const langCodes: Record<string, string[]> = {
      US: ['en-US', 'en_US', 'en'],
      UK: ['en-GB', 'en_GB', 'en-UK'],
      IN: ['en-IN', 'en_IN', 'hi-IN'],
      AU: ['en-AU', 'en_AU']
    };
    const targetLangs = langCodes[accent] || ['en'];

    // Collect candidate voices matching any of the target language tags
    const matchedVoices = availableVoices.filter(v =>
      targetLangs.some(lang => v.lang.replace('_', '-').toLowerCase().includes(lang.toLowerCase()))
    );

    if (matchedVoices.length > 0) {
      // Prioritize natural, neural, google, enhanced, or online high-definition voices
      const qualityKeywords = [
        'natural', 'neural', 'google', 'online', 'enhanced', 'premium',
        'sonia', 'jenny', 'guy', 'aria', 'daniel', 'rishi', 'neerja', 'karen', 'oliver', 'catherine'
      ];
      
      const highQualityVoice = matchedVoices.find(v =>
        qualityKeywords.some(kw => v.name.toLowerCase().includes(kw))
      );
      if (highQualityVoice) return highQualityVoice;

      return matchedVoices[0];
    }

    // Secondary fallback: Any natural/google voice
    return availableVoices.find(v => 
      v.name.toLowerCase().includes('natural') || 
      v.name.toLowerCase().includes('google') || 
      v.name.toLowerCase().includes('neural')
    ) || availableVoices.find(v => v.lang.toLowerCase().startsWith('en')) || availableVoices[0] || null;
  };

  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
      .replace(/\[(?:Action|Note|Scene|Visual|Audio|Stage):?[^\]]*\]/gi, '')
      .replace(/🎬\s*Action:[^\n]*/gi, '')
      .replace(/⏱️\s*\d+:\d+/g, '')
      .replace(/Paragraph\s*\d+:?/gi, '')
      .replace(/^#+\s+/gm, '') // Remove markdown headings
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // Bold/italic formatting
      .replace(/[`~#]/g, '')
      .replace(/&/g, ' and ')
      .replace(/\+/g, ' plus ')
      .replace(/%/g, ' percent ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Unified translation state support (props or internal fallback)
  const [localTargetLang, setLocalTargetLang] = useState<string>(targetLang || 'Tamil');
  const [localTranslating, setLocalTranslating] = useState<boolean>(false);
  const [localTranslatedText, setLocalTranslatedText] = useState<string>('');

  const activeTargetLang = targetLang || localTargetLang;
  const activeIsTranslating = isTranslating || localTranslating;
  const activeTranslatedText = translatedText || localTranslatedText;

  const handleLangSelect = (newLang: string) => {
    setLocalTargetLang(newLang);
    if (onTargetLangChange) {
      onTargetLangChange(newLang);
    }
  };

  const handleDoTranslate = async (langToUse: string) => {
    setLocalTranslating(true);
    if (onTargetLangChange) {
      onTargetLangChange(langToUse);
    }
    if (onTranslate) {
      onTranslate(langToUse);
    }
    try {
      const prompt = `Translate the following English video reference script into ${langToUse} for a student.

Provide:
1. Complete, natural translation in ${langToUse}.
2. Line-by-line bilingual breakdown (English line -> ${langToUse} line).
3. Phonetic Pronunciation Guide in brackets for key English words so non-native speakers can speak fluently.

Title: ${title}
English Script:
${scriptText}`;

      const res = await generateGeminiContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction: 'You are an expert bilingual speech and translation coach.' }
      });

      if (res && res.text) {
        setLocalTranslatedText(res.text);
      }
    } catch (err) {
      console.error('Local translation error:', err);
    } finally {
      setLocalTranslating(false);
    }
  };

  const paragraphs = parseScriptToParagraphs(scriptText);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = (textToRead: string) => {
    if (!('speechSynthesis' in window)) return;
    if (playingAudio) {
      window.speechSynthesis.cancel();
      setPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const cleaned = cleanTextForSpeech(textToRead);
      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      const voice = getVoiceForAccent(selectedAccent);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      utterance.onend = () => setPlayingAudio(false);
      utterance.onerror = () => setPlayingAudio(false);
      setPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Open in Standalone Popout Browser Window
  const handleOpenInNewPopoutWindow = () => {
    const win = window.open('', '_blank', 'width=1100,height=850,scrollbars=yes,resizable=yes');
    if (!win) {
      alert('Pop-up window blocked. Showing in Fullscreen Reader modal instead.');
      setIsFullscreenModalOpen(true);
      return;
    }

    const formattedParagraphsHtml = paragraphs.map((p, idx) => `
      <div style="margin-bottom: 24px; padding: 20px; background: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 800; color: #4338ca; background: #e0e7ff; padding: 3px 8px; border-radius: 20px; text-transform: uppercase;">Paragraph ${idx + 1}</span>
          ${p.timestamp ? `<span style="font-size: 11px; font-weight: 800; color: #d97706; background: #fef3c7; padding: 3px 8px; border-radius: 20px;">⏱️ ${p.timestamp}</span>` : ''}
          ${p.title ? `<span style="font-size: 13px; font-weight: 800; color: #1e1b4b;">${p.title}</span>` : ''}
        </div>
        ${p.actionNote ? `<div style="font-size: 12px; font-style: italic; color: #047857; background: #d1fae5; padding: 6px 12px; border-radius: 8px; margin-bottom: 10px;">🎬 Action: ${p.actionNote}</div>` : ''}
        ${p.speaker ? `<div style="font-size: 13px; font-weight: 700; color: #312e81; margin-bottom: 4px;">${p.speaker}</div>` : ''}
        ${p.content && p.content.trim() !== '' && p.content.trim().toLowerCase() !== (p.title || '').trim().toLowerCase() ? `<p style="font-size: 16px; line-height: 1.7; color: #1e293b; margin: 0; white-space: pre-wrap;">${p.content}</p>` : ''}
      </div>
    `).join('');

    const translatedHtml = translatedText ? `
      <div style="margin-top: 32px; padding: 24px; background: #faf5ff; border: 2px solid #c084fc; border-radius: 16px;">
        <h2 style="font-size: 18px; font-weight: 800; color: #6b21a8; margin-top: 0; margin-bottom: 16px;">✨ Auto-Translated Script (${targetLang}):</h2>
        <div style="font-size: 15px; line-height: 1.8; color: #3b0764; white-space: pre-wrap;">${translatedText.replace(/\n/g, '<br/>')}</div>
      </div>
    ` : '';

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Full Script Reader</title>
          <meta charset="utf-8"/>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #0f172a; padding: 32px; max-width: 900px; margin: 0 auto; }
            h1 { font-size: 24px; color: #1e1b4b; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            .meta { font-size: 12px; color: #64748b; font-weight: 700; margin-bottom: 24px; text-transform: uppercase; }
            .btn-bar { margin-bottom: 24px; display: flex; gap: 12px; }
            button { background: #4f46e5; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
            button:hover { background: #4338ca; }
          </style>
        </head>
        <body>
          <div class="meta">📖 ${category} • Full Reader View</div>
          <h1>${title}</h1>
          <div class="btn-bar">
            <button onclick="window.print()">🖨️ Print / Save PDF</button>
            <button onclick="window.close()">❌ Close Window</button>
          </div>
          <div>${formattedParagraphsHtml}</div>
          ${translatedHtml}
        </body>
      </html>
    `);
    win.document.close();
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-xs sm:text-sm leading-relaxed';
      case 'base': return 'text-sm sm:text-base leading-relaxed';
      case 'lg': return 'text-base sm:text-lg leading-relaxed';
      case 'xl': return 'text-lg sm:text-xl leading-relaxed';
    }
  };

  const filteredParagraphs = paragraphs.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.content.toLowerCase().includes(q) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.actionNote && p.actionNote.toLowerCase().includes(q)) ||
      (p.timestamp && p.timestamp.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 shadow-2xl border border-indigo-700/60 space-y-5 relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-800/80 pb-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-0.5 bg-yellow-400 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider">
              {category}
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-800/90 text-indigo-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-indigo-600/50">
              {paragraphs.length} Paragraphs
            </span>
          </div>
          <h3 className="font-black text-white text-lg sm:text-xl flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>{title}</span>
          </h3>
        </div>

        {/* Primary Action Buttons & Accent Voice Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Accent Selection Pills */}
          <div className="flex items-center bg-slate-900/90 border border-indigo-700/60 rounded-xl p-1 gap-1">
            <span className="text-[10px] font-black text-indigo-300 px-1.5 uppercase flex items-center gap-1">
              <Globe className="w-3 h-3 text-amber-400" />
              <span>Voice Accent:</span>
            </span>
            {(
              [
                { code: 'UK', label: '🇬🇧 UK Native' },
                { code: 'US', label: '🇺🇸 US Natural' },
                { code: 'IN', label: '🇮🇳 Indian Eng' },
                { code: 'AU', label: '🇦🇺 Australian' }
              ] as const
            ).map((accent) => (
              <button
                key={accent.code}
                type="button"
                onClick={() => {
                  setSelectedAccent(accent.code);
                  if (playingAudio) {
                    window.speechSynthesis?.cancel();
                    setPlayingAudio(false);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                  selectedAccent === accent.code
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-indigo-200 hover:bg-indigo-900/60 hover:text-white'
                }`}
              >
                <span>{accent.label}</span>
              </button>
            ))}
          </div>

          {/* Speed Rate Control Pills */}
          <div className="flex items-center bg-slate-900/90 border border-indigo-700/60 rounded-xl p-1 gap-1">
            <span className="text-[10px] font-black text-indigo-300 px-1 uppercase">Pace:</span>
            {[
              { rate: 0.85, label: '0.85x Calm' },
              { rate: 0.95, label: '0.95x Natural' },
              { rate: 1.1, label: '1.1x Crisp' }
            ].map((item) => (
              <button
                key={item.rate}
                type="button"
                onClick={() => setSpeechRate(item.rate)}
                className={`px-1.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                  speechRate === item.rate
                    ? 'bg-indigo-500 text-white shadow font-black'
                    : 'text-indigo-200 hover:bg-indigo-900/60 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* OPEN IN NEW WINDOW BUTTON */}
          <button
            onClick={handleOpenInNewPopoutWindow}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Open script in standalone browser window for distraction-free reading"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Window</span>
          </button>

          {/* FULLSCREEN READER MODAL BUTTON */}
          <button
            onClick={() => setIsFullscreenModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-800/80 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl border border-indigo-600/60 transition flex items-center gap-1.5 cursor-pointer"
            title="Expand into full screen paragraphic reader modal"
          >
            <Maximize2 className="w-4 h-4 text-indigo-300" />
            <span>Fullscreen Reader</span>
          </button>

          {/* LISTEN AUDIO WITH ACCENT */}
          <button
            onClick={() => handleToggleSpeech(scriptText)}
            className={`px-3 py-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              playingAudio
                ? 'bg-red-600/90 text-white border-red-500 shadow-md animate-pulse'
                : 'bg-indigo-900/90 hover:bg-indigo-800 text-amber-300 border-indigo-600/80'
            }`}
            title={`Listen to full English speech narration (${selectedAccent} Accent)`}
          >
            {playingAudio ? (
              <>
                <VolumeX className="w-4 h-4 text-white" />
                <span>Stop Narration</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-amber-300" />
                <span>Listen Narration ({selectedAccent})</span>
              </>
            )}
          </button>

          {/* COPY TEXT */}
          <button
            onClick={handleCopyAll}
            className="p-2 bg-slate-800/90 hover:bg-slate-700 text-indigo-200 rounded-xl border border-indigo-700/50 transition cursor-pointer"
            title="Copy English Script Text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Paragraphic Display Area - Beautifully Formatted, No Awkward Cutoffs! */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-indigo-200 font-bold px-1">
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>English Video Reference Material (Paragraphic Breakdown)</span>
          </span>
          <span className="text-[11px] text-indigo-300 font-medium">
            Formatted line-by-line with timestamps & action notes
          </span>
        </div>

        {/* PARAGRAPHIC CARDS LIST */}
        <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-slate-900">
          {paragraphs.length === 0 ? (
            <div className="p-6 bg-slate-950/60 rounded-2xl text-center text-xs text-slate-400">
              No text content available.
            </div>
          ) : (
            paragraphs.map((p, idx) => (
              <div 
                key={p.id}
                className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-indigo-800/70 space-y-2 hover:border-indigo-500 transition-all shadow-md group"
              >
                {/* Paragraph Meta Tags Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-indigo-900/90 text-indigo-200 font-extrabold rounded-full uppercase tracking-wider text-[10px] border border-indigo-700">
                      Paragraph {idx + 1}
                    </span>

                    {p.timestamp && (
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-extrabold rounded-full text-[10px] border border-amber-500/40 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{p.timestamp}</span>
                      </span>
                    )}

                    {p.title && (
                      <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide">
                        {p.title}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleSpeech(p.content)}
                    className="opacity-70 group-hover:opacity-100 text-indigo-300 hover:text-yellow-300 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title={`Listen to Paragraph ${idx + 1} (${selectedAccent} Accent)`}
                  >
                    <Volume2 className="w-3 h-3 text-amber-300" />
                    <span>Listen ({selectedAccent})</span>
                  </button>
                </div>

                {/* Action / Stage Note if present */}
                {p.actionNote && (
                  <div className="bg-emerald-950/60 border border-emerald-600/50 text-emerald-200 px-3 py-1.5 rounded-xl text-xs italic font-medium flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Action Note: {p.actionNote}</span>
                  </div>
                )}

                {/* Speaker Cue if present */}
                {p.speaker && (
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    {p.speaker}
                  </div>
                )}

                {/* Main Paragraph Content */}
                {p.content && p.content.trim() !== '' && p.content.trim().toLowerCase() !== (p.title || '').trim().toLowerCase() && (
                  <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-normal whitespace-pre-line tracking-normal">
                    {p.content}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auto-Translation Section */}
      <div className="bg-indigo-950/70 p-4 sm:p-5 rounded-2xl border border-indigo-700/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
            <Languages className="w-4.5 h-4.5 text-purple-300 shrink-0" />
            <span>Auto-Translate into Native Language:</span>
            <select
              value={activeTargetLang}
              onChange={(e) => handleLangSelect(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-indigo-600 rounded-xl text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
              <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
              <option value="Kannada">🇮🇳 Kannada (ಕನ್ನಡ)</option>
              <option value="Malayalam">🇮🇳 Malayalam (മലയാളം)</option>
              <option value="Telugu">🇮🇳 Telugu (తెలుగు)</option>
              <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
              <option value="Bengali">🇮🇳 Bengali (বাংলা)</option>
              <option value="Gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
              <option value="Spanish">🇲🇽 Spanish</option>
              <option value="French">🇫🇷 French</option>
              <option value="German">🇩🇪 German</option>
            </select>
          </div>

          <button
            onClick={() => handleDoTranslate(activeTargetLang)}
            disabled={activeIsTranslating}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {activeIsTranslating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Translating Script...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Translate into {activeTargetLang}</span>
              </>
            )}
          </button>
        </div>

        {/* Display Translated Result */}
        {activeTranslatedText && (
          <div className="bg-purple-950/80 p-4 sm:p-5 rounded-2xl border border-purple-500/50 text-xs sm:text-sm text-purple-100 space-y-3 leading-relaxed animate-in fade-in max-h-72 overflow-y-auto scrollbar-thin">
            <div className="font-extrabold text-[11px] text-purple-300 uppercase tracking-wider flex items-center justify-between border-b border-purple-800/80 pb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> {activeTargetLang} Auto-Translation & Speech Guide
              </span>
              <span className="text-[10px] bg-purple-800 text-purple-100 px-2 py-0.5 rounded-full font-bold">Bilingual Paragraphs</span>
            </div>
            <div className="prose prose-sm prose-invert text-purple-100 font-medium leading-relaxed">
              <ReactMarkdown>{activeTranslatedText}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Optional Practice Link */}
      {onPracticeInCoach && (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-indigo-800/60">
          <p className="text-[11px] text-indigo-200 font-medium">
            Want to practice speaking this script live with AI audio feedback?
          </p>
          <button
            onClick={onPracticeInCoach}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Practice in Communication Coach</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FULLSCREEN READER MODAL DIALOG */}
      {isFullscreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-700/80 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-white">
            
            {/* Modal Top Bar */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-indigo-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-yellow-400 text-slate-950 text-[10px] font-black rounded-full uppercase">
                    Fullscreen Reader
                  </span>
                  <span className="text-xs text-indigo-300 font-bold">{category}</span>
                </div>
                <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span>{title}</span>
                </h2>
              </div>

              {/* Reader Controls Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Voice Accent Pills in Modal */}
                <div className="flex items-center bg-slate-950 border border-indigo-700/60 rounded-xl p-1 gap-1">
                  <span className="text-[10px] font-black text-indigo-300 px-1 uppercase flex items-center gap-1">
                    <Globe className="w-3 h-3 text-amber-400" />
                    <span className="hidden sm:inline">Accent:</span>
                  </span>
                  {(
                    [
                      { code: 'UK', label: '🇬🇧 UK' },
                      { code: 'US', label: '🇺🇸 US' },
                      { code: 'IN', label: '🇮🇳 IN' },
                      { code: 'AU', label: '🇦🇺 AU' }
                    ] as const
                  ).map((accent) => (
                    <button
                      key={`modal_${accent.code}`}
                      type="button"
                      onClick={() => {
                        setSelectedAccent(accent.code);
                        if (playingAudio) {
                          window.speechSynthesis?.cancel();
                          setPlayingAudio(false);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                        selectedAccent === accent.code
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'text-indigo-200 hover:bg-indigo-900/60 hover:text-white'
                      }`}
                    >
                      {accent.label}
                    </button>
                  ))}
                </div>

                {/* Modal Translation Trigger */}
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs font-bold text-indigo-200">
                  <Languages className="w-3.5 h-3.5 text-purple-300" />
                  <select
                    value={activeTargetLang}
                    onChange={(e) => handleLangSelect(e.target.value)}
                    className="bg-slate-900 text-white font-bold text-xs rounded-lg px-2 py-1 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                  >
                    <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
                    <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
                    <option value="Kannada">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                    <option value="Malayalam">🇮🇳 Malayalam (മലയാളം)</option>
                    <option value="Telugu">🇮🇳 Telugu (తెలుగు)</option>
                    <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
                    <option value="Bengali">🇮🇳 Bengali (বাংলা)</option>
                    <option value="Gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
                    <option value="Spanish">🇲🇽 Spanish</option>
                    <option value="French">🇫🇷 French</option>
                    <option value="German">🇩🇪 German</option>
                  </select>
                  <button
                    onClick={() => handleDoTranslate(activeTargetLang)}
                    disabled={activeIsTranslating}
                    className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {activeIsTranslating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Translate Now</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search paragraph..."
                    className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-32 sm:w-44"
                  />
                </div>

                {/* Font Size Selector */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
                  <Type className="w-3.5 h-3.5 text-indigo-300 ml-1" />
                  <button 
                    onClick={() => setFontSize('sm')} 
                    className={`px-2 py-0.5 rounded-lg ${fontSize === 'sm' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
                  >
                    A-
                  </button>
                  <button 
                    onClick={() => setFontSize('base')} 
                    className={`px-2 py-0.5 rounded-lg ${fontSize === 'base' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
                  >
                    A
                  </button>
                  <button 
                    onClick={() => setFontSize('lg')} 
                    className={`px-2 py-0.5 rounded-lg ${fontSize === 'lg' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
                  >
                    A+
                  </button>
                  <button 
                    onClick={() => setFontSize('xl')} 
                    className={`px-2 py-0.5 rounded-lg ${fontSize === 'xl' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
                  >
                    A++
                  </button>
                </div>

                {/* Popout Window Button */}
                <button
                  onClick={handleOpenInNewPopoutWindow}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                  title="Open in Browser Popout Window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Popout Window</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsFullscreenModalOpen(false)}
                  className="p-2 bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Full Content Paragraphic View */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-slate-950">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1: Paragraphic English Script */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-800 pb-2">
                    <h4 className="font-extrabold text-sm text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>English Original Script ({filteredParagraphs.length} Paragraphs)</span>
                    </h4>
                    <button
                      onClick={handleCopyAll}
                      className="text-xs text-indigo-300 hover:text-white font-bold flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy All'}</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {filteredParagraphs.map((p, idx) => (
                      <div 
                        key={`m_${p.id}`}
                        className="bg-slate-950 p-5 rounded-2xl border border-indigo-800/80 space-y-2.5 shadow-lg"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-indigo-900 text-indigo-200 font-black rounded-full uppercase text-[10px]">
                              Paragraph {idx + 1}
                            </span>
                            {p.timestamp && (
                              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-extrabold rounded-full text-[10px] border border-amber-500/40">
                                ⏱️ {p.timestamp}
                              </span>
                            )}
                            {p.title && (
                              <span className="font-extrabold text-white text-sm">
                                {p.title}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleToggleSpeech(p.content)}
                            className="text-indigo-300 hover:text-yellow-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title={`Listen in ${selectedAccent} Accent`}
                          >
                            <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                            <span>Listen ({selectedAccent})</span>
                          </button>
                        </div>

                        {p.actionNote && (
                          <div className="bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 px-3 py-1.5 rounded-xl text-xs italic font-medium">
                            🎬 Action: {p.actionNote}
                          </div>
                        )}

                        {p.content && p.content.trim() !== '' && p.content.trim().toLowerCase() !== (p.title || '').trim().toLowerCase() && (
                          <p className={`${getFontSizeClass()} text-slate-100 font-normal whitespace-pre-line`}>
                            {p.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Native Language Auto-Translation View */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-800 pb-2">
                    <h4 className="font-extrabold text-sm text-purple-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>{activeTargetLang} Translation & Bilingual Guide</span>
                    </h4>

                    <div className="flex items-center gap-2">
                      <select
                        value={activeTargetLang}
                        onChange={(e) => handleLangSelect(e.target.value)}
                        className="px-2.5 py-1 bg-slate-800 border border-indigo-600 rounded-lg text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                      >
                        <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
                        <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
                        <option value="Kannada">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                        <option value="Malayalam">🇮🇳 Malayalam (മലയാളം)</option>
                        <option value="Telugu">🇮🇳 Telugu (తెలుగు)</option>
                        <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
                        <option value="Bengali">🇮🇳 Bengali (বাংলা)</option>
                        <option value="Gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
                        <option value="Spanish">🇲🇽 Spanish</option>
                        <option value="French">🇫🇷 French</option>
                        <option value="German">🇩🇪 German</option>
                      </select>

                      <button
                        onClick={() => handleDoTranslate(activeTargetLang)}
                        disabled={activeIsTranslating}
                        className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                      >
                        {activeIsTranslating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Translating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-yellow-300" />
                            <span>Translate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {activeIsTranslating ? (
                    <div className="bg-purple-950/80 p-8 rounded-2xl border border-purple-500/50 text-center space-y-4 animate-pulse">
                      <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mx-auto" />
                      <p className="text-sm font-bold text-purple-200">
                        Translating script into {activeTargetLang} using AI...
                      </p>
                      <p className="text-xs text-purple-300">Generating line-by-line bilingual guide & pronunciation tips. Please wait a moment.</p>
                    </div>
                  ) : activeTranslatedText ? (
                    <div className="bg-purple-950/90 p-6 rounded-2xl border border-purple-500/60 text-purple-100 space-y-4 shadow-xl">
                      <div className="prose prose-invert max-w-none leading-relaxed text-purple-100">
                        <ReactMarkdown>{activeTranslatedText}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800 text-center space-y-4">
                      <Languages className="w-10 h-10 text-indigo-400 mx-auto" />
                      <p className="text-xs text-slate-300 max-w-sm mx-auto">
                        Click <strong>Translate into {activeTargetLang}</strong> to view line-by-line bilingual native translation and pronunciation cues side-by-side in full view!
                      </p>
                      <button
                        onClick={() => handleDoTranslate(activeTargetLang)}
                        disabled={activeIsTranslating}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-2 mx-auto"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Translate Now ({activeTargetLang})</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-slate-950 border-t border-indigo-800 flex items-center justify-between text-xs text-indigo-300">
              <span>📖 Full Paragraphic Script Reader View • All lines visible</span>
              <button
                onClick={() => setIsFullscreenModalOpen(false)}
                className="px-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Done Reading
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
