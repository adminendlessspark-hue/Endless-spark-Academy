import React, { useState, useEffect } from 'react';
import { XCircle, Video, Plus, Trash2, BookOpen, ExternalLink, Code, CheckCircle2, FileText } from 'lucide-react';

interface VideoPart {
  id: string;
  label: string;
  url: string;
}

interface RecordingLinkModalProps {
  isOpen: boolean;
  initialUrl: string;
  onClose: () => void;
  onSave: (formattedUrl: string) => void | Promise<void>;
  title?: string;
  subtitle?: string;
}

export default function RecordingLinkModal({
  isOpen,
  initialUrl,
  onClose,
  onSave,
  title = "Add Recording & Material Links",
  subtitle = "Provide separate paths for video recordings and class reference materials"
}: RecordingLinkModalProps) {
  const [videoParts, setVideoParts] = useState<VideoPart[]>([]);
  const [referenceLink, setReferenceLink] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [showRawTextMode, setShowRawTextMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Parse initialUrl into structured fields on open
  useEffect(() => {
    if (!isOpen) return;

    setRawText(initialUrl || '');
    
    if (!initialUrl || !initialUrl.trim()) {
      setVideoParts([
        { id: 'vid-1', label: 'Video Part 1', url: '' }
      ]);
      setReferenceLink('');
      setShowRawTextMode(false);
      return;
    }

    const lines = initialUrl.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
    const parsedParts: VideoPart[] = [];
    let parsedRef = '';

    lines.forEach((line, index) => {
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/) || [line, line];
      const extractedUrl = urlMatch[1] || line;
      const lowerLine = line.toLowerCase();

      // Check if line is reference material / class notes
      if (
        lowerLine.includes('reference') || 
        lowerLine.includes('notes') || 
        lowerLine.includes('material') || 
        lowerLine.includes('zip') || 
        lowerLine.includes('pdf') ||
        lowerLine.includes('doc')
      ) {
        if (!parsedRef) {
          parsedRef = extractedUrl;
        } else {
          // If already set reference, add as additional part or append
          let label = line.replace(extractedUrl, '').replace(/[:\-–—]/g, '').trim();
          if (!label) label = `Reference File ${parsedParts.length + 1}`;
          parsedParts.push({
            id: `vid-${index + 1}`,
            label,
            url: extractedUrl
          });
        }
      } else {
        let label = line.replace(extractedUrl, '').replace(/[:\-–—]/g, '').trim();
        if (!label) {
          label = lines.length > 1 ? `Video Part ${parsedParts.length + 1}` : 'Video Part 1';
        }
        parsedParts.push({
          id: `vid-${index + 1}`,
          label,
          url: extractedUrl
        });
      }
    });

    if (parsedParts.length === 0) {
      parsedParts.push({ id: 'vid-1', label: 'Video Part 1', url: '' });
    }

    setVideoParts(parsedParts);
    setReferenceLink(parsedRef);
    setShowRawTextMode(false);
  }, [isOpen, initialUrl]);

  if (!isOpen) return null;

  // Add new video part field
  const handleAddVideoPart = () => {
    setVideoParts(prev => [
      ...prev,
      {
        id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        label: `Video Part ${prev.length + 1}`,
        url: ''
      }
    ]);
  };

  // Remove video part field
  const handleRemoveVideoPart = (id: string) => {
    if (videoParts.length <= 1) {
      setVideoParts([{ id: 'vid-1', label: 'Video Part 1', url: '' }]);
      return;
    }
    setVideoParts(prev => prev.filter(p => p.id !== id));
  };

  // Update video part
  const handleUpdateVideoPart = (id: string, field: 'label' | 'url', value: string) => {
    setVideoParts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Synchronize raw text mode when toggled
  const handleToggleRawMode = () => {
    if (!showRawTextMode) {
      // Switching to raw mode: build string from structured fields
      const formatted = buildFinalFormattedString();
      setRawText(formatted);
      setShowRawTextMode(true);
    } else {
      // Switching back from raw mode: re-parse raw text into structured fields
      const lines = rawText.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
      const parsedParts: VideoPart[] = [];
      let parsedRef = '';

      lines.forEach((line, index) => {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/) || [line, line];
        const extractedUrl = urlMatch[1] || line;
        const lowerLine = line.toLowerCase();

        if (
          lowerLine.includes('reference') || 
          lowerLine.includes('notes') || 
          lowerLine.includes('material') || 
          lowerLine.includes('zip')
        ) {
          if (!parsedRef) parsedRef = extractedUrl;
        } else {
          let label = line.replace(extractedUrl, '').replace(/[:\-–—]/g, '').trim();
          if (!label) label = lines.length > 1 ? `Video Part ${parsedParts.length + 1}` : 'Video Part 1';
          parsedParts.push({ id: `vid-${index + 1}`, label, url: extractedUrl });
        }
      });

      if (parsedParts.length === 0) {
        parsedParts.push({ id: 'vid-1', label: 'Video Part 1', url: '' });
      }

      setVideoParts(parsedParts);
      setReferenceLink(parsedRef);
      setShowRawTextMode(false);
    }
  };

  // Construct final formatted string for storage
  const buildFinalFormattedString = (): string => {
    if (showRawTextMode) {
      return rawText.trim();
    }

    const lines: string[] = [];
    
    videoParts.forEach((part, idx) => {
      const cleanUrl = part.url.trim();
      if (cleanUrl) {
        const cleanLabel = part.label.trim() || `Video Part ${idx + 1}`;
        lines.push(`${cleanLabel}: ${cleanUrl}`);
      }
    });

    if (referenceLink.trim()) {
      lines.push(`Reference Material: ${referenceLink.trim()}`);
    }

    return lines.join('\n');
  };

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resultString = buildFinalFormattedString();
      await onSave(resultString);
      onClose();
    } catch (err) {
      console.error('Failed to save recording link:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-blue-100 text-xs mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {!showRawTextMode ? (
            <>
              {/* Separate Field 1: Video Recording Links */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Video className="w-4 h-4" />
                    </span>
                    <label className="text-sm font-bold text-gray-900">
                      Video Recording Links
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {videoParts.filter(p => p.url.trim()).length} Added
                  </span>
                </div>

                {/* Individual Video Part Fields */}
                <div className="space-y-3">
                  {videoParts.map((part, index) => (
                    <div 
                      key={part.id} 
                      className="p-3.5 bg-slate-50 border border-gray-200 rounded-2xl space-y-2 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={part.label}
                          onChange={(e) => handleUpdateVideoPart(part.id, 'label', e.target.value)}
                          placeholder={`Video Part ${index + 1}`}
                          className="text-xs font-bold text-blue-900 bg-transparent outline-none focus:underline w-full"
                        />
                        {videoParts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVideoPart(part.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            title="Remove Video Part"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="url"
                          value={part.url}
                          onChange={(e) => handleUpdateVideoPart(part.id, 'url', e.target.value)}
                          placeholder="Paste Google Drive Video Link (e.g., https://drive.google.com/file/d/...)"
                          className="w-full pl-3 pr-8 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                        />
                        {part.url.trim() && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-2.5 top-3" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Another Video Part Button */}
                <button
                  type="button"
                  onClick={handleAddVideoPart}
                  className="w-full py-2.5 px-4 bg-white border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Add Another Video Part (Part 2, Part 3...)
                </button>
              </div>

              {/* Separate Field 2: Reference Material & ZIP Link */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <label className="text-sm font-bold text-gray-900">
                    Reference Material / Class Notes / ZIP Archive Link
                  </label>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md uppercase">
                    Optional
                  </span>
                </div>

                <div className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-2">
                  <p className="text-xs text-gray-600">
                    Provide a separate link for class worksheets, mind maps, PDF study guides, or ZIP archives:
                  </p>
                  <div className="relative">
                    <input
                      type="url"
                      value={referenceLink}
                      onChange={(e) => setReferenceLink(e.target.value)}
                      placeholder="Paste Google Drive Reference / ZIP Link (e.g., https://drive.google.com/file/d/...)"
                      className="w-full pl-3 pr-8 py-2.5 text-xs bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-mono"
                    />
                    {referenceLink.trim() && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-2.5 top-3" />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Advanced Mode: Raw Text Area */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-600" />
                  Raw Multi-Line Text Editor
                </label>
                <span className="text-xs text-gray-500">Put each link on a new line</span>
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Part 1: https://drive.google.com/file/d/...\nPart 2: https://drive.google.com/file/d/...\nReference Material: https://drive.google.com/file/d/..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-xs bg-slate-50"
              />
            </div>
          )}

          {/* Mode Switcher Toggle */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleToggleRawMode}
              className="text-xs font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {showRawTextMode ? 'Switch to Separate Field Inputs' : 'Advanced: Paste Raw Multi-Line Text'}
            </button>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-100 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Links</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
