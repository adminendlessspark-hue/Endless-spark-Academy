import React, { useState, useEffect, useMemo } from 'react';
import { Play, ExternalLink, Download, Video, RefreshCw, ListVideo, ChevronRight } from 'lucide-react';

interface SecureVideoPlayerProps {
  url?: string;
  secondaryVideoUrl?: string;
  theoreticalVideoUrl?: string;
  videoUrls?: Record<string, string> | Array<string>;
  nativeLanguage?: string;
  title?: string;
  className?: string;
  userName?: string;
  userId?: string;
  autoPlay?: boolean;
  thumbnailUrl?: string;
  defaultActiveIndex?: number;
}

export interface VideoItem {
  id: string;
  label: string;
  url: string;
}

export const getGoogleDriveFileId = (urlStr: string): string | null => {
  if (!urlStr) return null;
  const match = urlStr.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                urlStr.match(/id=([a-zA-Z0-9_-]+)/) ||
                urlStr.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
                urlStr.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  if (/^[a-zA-Z0-9_-]{25,}$/.test(urlStr.trim())) {
    return urlStr.trim();
  }
  return null;
};

export const parseMultipleVideoSources = (
  primaryUrl?: string, 
  videoUrlsProp?: Record<string, string> | Array<string>,
  secondaryUrl?: string,
  theoreticalUrl?: string
): VideoItem[] => {
  const items: VideoItem[] = [];
  const seenUrls = new Set<string>();

  const addUrl = (label: string, rawUrl: string) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const trimmed = rawUrl.trim();
    if (!trimmed || seenUrls.has(trimmed)) return;
    seenUrls.add(trimmed);
    items.push({
      id: `vid-${items.length + 1}-${Math.random().toString(36).substring(2, 7)}`,
      label: label.trim(),
      url: trimmed
    });
  };

  const hasSecondary = Boolean(secondaryUrl && secondaryUrl.trim());
  const hasTheoretical = Boolean(theoreticalUrl && theoreticalUrl.trim());
  const isFullLengthMode = hasTheoretical || hasSecondary;

  // 1. Process explicit full-length theoretical video first if provided
  if (hasTheoretical && theoreticalUrl) {
    addUrl('Theoretical Video', theoreticalUrl);
  }

  // 2. Process explicit full-length practical video next if provided
  if (hasSecondary && secondaryUrl) {
    addUrl('Practical Video', secondaryUrl);
  }

  // If explicit full-length videos are present, return ONLY full-length videos
  // so short syllabus overview videos (English, Tamil, etc.) do not leak into the full-length player
  if (isFullLengthMode) {
    if (!hasTheoretical && primaryUrl && typeof primaryUrl === 'string') {
      let fallbackUrl = primaryUrl;
      try {
        const parsed = JSON.parse(primaryUrl);
        if (Array.isArray(parsed) && parsed[0]) fallbackUrl = String(parsed[0]);
      } catch (e) {
        const lines = primaryUrl.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
        if (lines[0]) {
          const urlMatch = lines[0].match(/(https?:\/\/[^\s]+)/);
          if (urlMatch) fallbackUrl = urlMatch[1];
        }
      }
      addUrl('Theoretical Video', fallbackUrl);
    }
    return items;
  }

  // 3. Process primaryUrl string
  if (primaryUrl && typeof primaryUrl === 'string') {
    try {
      const parsed = JSON.parse(primaryUrl);
      if (Array.isArray(parsed)) {
        parsed.forEach((u, idx) => {
          let label = parsed.length === 2 ? (idx === 0 ? 'English' : 'Tamil') : `Video ${idx + 1}`;
          if (hasSecondary && !hasTheoretical) {
            label = parsed.length === 2 ? (idx === 0 ? 'Theoretical (English)' : 'Theoretical (Tamil)') : 'Theoretical Video';
          }
          addUrl(label, String(u));
        });
      } else if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([k, v]) => addUrl(k, String(v)));
      }
    } catch (e) {
      const lines = primaryUrl.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
      
      const parsedLines = lines.map((line, index) => {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/) || [line, line];
        const extractedUrl = urlMatch[1] || line;
        let label = line.replace(extractedUrl, '').replace(/[:\-–—]/g, '').trim();
        return { extractedUrl, label, index };
      });

      if (parsedLines.length === 2) {
        if (!parsedLines[0].label && parsedLines[1].label) {
          if (parsedLines[1].label.toLowerCase().includes('tamil')) {
            parsedLines[0].label = 'English';
          } else {
            parsedLines[0].label = 'Video 1';
          }
        } else if (parsedLines[0].label && !parsedLines[1].label) {
          if (parsedLines[0].label.toLowerCase().includes('english')) {
            parsedLines[1].label = 'Tamil';
          } else {
            parsedLines[1].label = 'Video 2';
          }
        } else if (!parsedLines[0].label && !parsedLines[1].label) {
          parsedLines[0].label = 'English';
          parsedLines[1].label = 'Tamil';
        }
      }

      parsedLines.forEach(({ extractedUrl, label, index }) => {
        let finalLabel = label;
        if (!finalLabel) {
          finalLabel = parsedLines.length > 1 ? `Video ${index + 1}` : 'English';
        }

        if (hasSecondary && !hasTheoretical) {
          if (parsedLines.length === 1) {
            finalLabel = 'Theoretical Video';
          } else {
            finalLabel = `Theoretical Video (${finalLabel})`;
          }
        }
        addUrl(finalLabel, extractedUrl);
      });
    }
  }

  // 4. Process videoUrls prop if provided as object or array
  if (videoUrlsProp) {
    if (Array.isArray(videoUrlsProp)) {
      videoUrlsProp.forEach((u, idx) => {
        if (typeof u === 'string') {
          const label = videoUrlsProp.length === 2 ? (idx === 0 ? 'English' : 'Tamil') : `Video ${idx + 1}`;
          addUrl(label, u);
        }
      });
    } else if (typeof videoUrlsProp === 'object') {
      Object.entries(videoUrlsProp).forEach(([key, val]) => {
        if (val && typeof val === 'string') {
          let formattedLabel = key.replace(/_/g, ' ');
          formattedLabel = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);
          addUrl(formattedLabel, val);
        }
      });
    }
  }

  return items;
};

export default function SecureVideoPlayer({ 
  url, 
  secondaryVideoUrl,
  theoreticalVideoUrl,
  videoUrls, 
  nativeLanguage, 
  title = "Video Player", 
  className = "", 
  userName, 
  userId,
  autoPlay = false,
  thumbnailUrl,
  defaultActiveIndex
}: SecureVideoPlayerProps) {
  const playlistItems = useMemo(() => {
    return parseMultipleVideoSources(url, videoUrls, secondaryVideoUrl, theoreticalVideoUrl);
  }, [url, videoUrls, secondaryVideoUrl, theoreticalVideoUrl]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [useIframeEmbed, setUseIframeEmbed] = useState<boolean>(true);

  useEffect(() => {
    setIsPlaying(autoPlay);
    setUseIframeEmbed(true);
    
    if (defaultActiveIndex !== undefined && defaultActiveIndex >= 0 && defaultActiveIndex < playlistItems.length) {
      setActiveIndex(defaultActiveIndex);
      return;
    }

    if (nativeLanguage && playlistItems.length > 0) {
      const targetLang = nativeLanguage.toLowerCase();
      const matchIdx = playlistItems.findIndex(item => item.label.toLowerCase().includes(targetLang));
      if (matchIdx !== -1) {
        setActiveIndex(matchIdx);
        return;
      }
    }
    setActiveIndex(0);
  }, [autoPlay, nativeLanguage, playlistItems, defaultActiveIndex]);

  if (!playlistItems || playlistItems.length === 0) {
    return (
      <div className={`w-full h-full min-h-[180px] bg-slate-900 flex items-center justify-center text-slate-400 text-sm ${className}`}>
        <Video className="w-5 h-5 mr-2 text-slate-500" />
        No video available
      </div>
    );
  }

  const activeVideo = playlistItems[activeIndex] || playlistItems[0];
  const rawUrl = activeVideo.url;

  const driveFileId = getGoogleDriveFileId(rawUrl);
  const isGoogleDrive = !!driveFileId || rawUrl.includes('drive.google.com');

  let currentUrl = rawUrl;
  let directDriveViewUrl = '';
  let directDriveDownloadUrl = '';
  let backendStreamUrl = '';

  if (driveFileId) {
    currentUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
    directDriveViewUrl = `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`;
    directDriveDownloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
    backendStreamUrl = `/api/stream-drive-video?id=${driveFileId}`;
  } else if (isGoogleDrive) {
    if (currentUrl.includes('drive.google.com/file/d/')) {
      currentUrl = currentUrl.replace(/\/view.*$/, '/preview');
    }
    directDriveViewUrl = currentUrl.replace('/preview', '/view');
  }

  const getYoutubeId = (urlStr: string): string | null => {
    if (!urlStr) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeId(rawUrl);
  const loomMatch = rawUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  const loomId = loomMatch ? loomMatch[1] : null;
  const vimeoMatch = rawUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  const vimeoId = vimeoMatch ? vimeoMatch[1] : null;

  if (youtubeId) {
    currentUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=${isPlaying ? 1 : 0}&rel=0`;
  } else if (loomId) {
    currentUrl = `https://www.loom.com/embed/${loomId}`;
  } else if (vimeoId) {
    currentUrl = `https://player.vimeo.com/video/${vimeoId}`;
  } else if (!isGoogleDrive) {
    try {
      const hasProtocol = currentUrl.startsWith('http://') || currentUrl.startsWith('https://') || currentUrl.startsWith('//');
      const parseUrl = hasProtocol 
        ? (currentUrl.startsWith('//') ? 'https:' + currentUrl : currentUrl) 
        : 'https://dummy.com/' + currentUrl;
      
      const urlObj = new URL(parseUrl);
      
      if (isPlaying) {
        if (urlObj.hostname.includes('vimeo.com')) {
          urlObj.searchParams.set('autoplay', '1');
        } else {
          urlObj.searchParams.set('autoplay', 'true');
        }
      } else {
        urlObj.searchParams.set('autoplay', '0');
        urlObj.searchParams.delete('play');
        urlObj.searchParams.set('play', 'false');
      }
      
      const updatedSearch = urlObj.search;
      const hash = urlObj.hash;
      const baseWithoutSearch = currentUrl.split('?')[0].split('#')[0];
      currentUrl = baseWithoutSearch + updatedSearch + hash;
    } catch (err) {
      console.error('Failed to parse video URL:', err);
    }
  }

  const isIframeSupported = 
    (!isGoogleDrive || useIframeEmbed) && (
      !!youtubeId || 
      !!loomId ||
      !!vimeoId ||
      currentUrl.includes('youtube.com') || 
      currentUrl.includes('youtu.be') || 
      currentUrl.includes('player.vdocipher.com') || 
      currentUrl.includes('mediadelivery.net') ||
      currentUrl.includes('bunnycdn.com') ||
      currentUrl.includes('player.vimeo.com') ||
      isGoogleDrive
    );

  if (!isPlaying) {
    let displayThumbnailUrl = thumbnailUrl || null;
    if (!displayThumbnailUrl) {
      const youtubeId = getYoutubeId(currentUrl);
      displayThumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null;
    }

    if (displayThumbnailUrl && (displayThumbnailUrl.startsWith('/') || displayThumbnailUrl.startsWith('uploads/'))) {
      const relativePart = displayThumbnailUrl.startsWith('/') ? displayThumbnailUrl : '/' + displayThumbnailUrl;
      displayThumbnailUrl = typeof window !== 'undefined' ? window.location.origin + relativePart : relativePart;
    }

    return (
      <div 
        className={`w-full h-full min-h-[200px] relative bg-slate-950 flex flex-col justify-between ${className} group overflow-hidden rounded-xl border border-slate-800`}
        style={displayThumbnailUrl ? { backgroundImage: `url(${displayThumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div 
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 cursor-pointer flex flex-col justify-center items-center z-10"
        >
          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors duration-300 pointer-events-none" />
          
          {!displayThumbnailUrl && (
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />

          <div className="w-16 h-16 rounded-full bg-pink-600 hover:bg-pink-500 border border-pink-400 flex items-center justify-center text-white transition-all duration-300 transform group-hover:scale-110 shadow-2xl relative z-10">
            <Play className="w-7 h-7 fill-current translate-x-0.5 text-white" />
          </div>
          
          <span className="relative z-10 mt-3 text-xs font-semibold text-slate-200 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
            Click to Play Video
          </span>
        </div>

        {playlistItems.length > 1 && (
          <div className="relative z-20 p-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
            <ListVideo className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="text-slate-400 font-medium shrink-0">Videos ({playlistItems.length}):</span>
            {playlistItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                  setIsPlaying(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeIndex === idx
                    ? 'bg-pink-600 text-white font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative bg-black flex flex-col ${className}`}>
      {playlistItems.length > 1 && (
        <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-2 overflow-x-auto text-xs z-30 shrink-0">
          <ListVideo className="w-4 h-4 text-pink-400 shrink-0" />
          <span className="text-slate-400 font-medium shrink-0">Select Video:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {playlistItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveIndex(idx);
                  setUseIframeEmbed(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  activeIndex === idx
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{item.label}</span>
                {activeIndex === idx && <ChevronRight className="w-3 h-3 text-pink-200" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div 
        className="w-full flex-grow relative overflow-hidden min-h-[220px]"
        onContextMenu={(e) => e.preventDefault()}
      >
        {isGoogleDrive && driveFileId && !useIframeEmbed ? (
          <video 
            src={backendStreamUrl} 
            className="w-full h-full absolute inset-0 object-contain bg-black" 
            controls 
            controlsList="nodownload"
            disablePictureInPicture
            autoPlay={true}
            playsInline
            preload="metadata"
            onError={() => {
              console.warn("Backend video stream encountered an error, falling back to Drive embed mode");
              setUseIframeEmbed(true);
            }}
          >
            <source src={backendStreamUrl} type="video/webm" />
            <source src={backendStreamUrl} type="video/mp4" />
            Your browser does not support HTML5 video streaming.
          </video>
        ) : isIframeSupported ? (
          <iframe
            src={currentUrl}
            title={`${title} - ${activeVideo.label}`}
            className="w-full h-full absolute inset-0 border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video 
            src={currentUrl} 
            className="w-full h-full absolute inset-0 object-contain bg-black" 
            controls 
            controlsList="nodownload"
            disablePictureInPicture
            autoPlay={true}
            playsInline
          />
        )}
        
        {(userName || userId) && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-wrap justify-center items-center opacity-10 select-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="transform -rotate-45 p-8 text-xl font-bold text-white whitespace-nowrap drop-shadow-md">
                {userName} {userName && userId ? '-' : ''} {userId}
              </div>
            ))}
          </div>
        )}
      </div>

      {isGoogleDrive && driveFileId && (
        <div className="bg-slate-900 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 text-xs text-slate-300 z-30 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] truncate">
            <Video className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="truncate">{title} ({activeVideo.label})</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setUseIframeEmbed(!useIframeEmbed)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
              title="Toggle between Direct Streaming and Drive Embed mode"
            >
              <RefreshCw className="w-3 h-3 text-pink-400" />
              <span>{!useIframeEmbed ? 'Embed Mode' : 'Direct Stream'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
