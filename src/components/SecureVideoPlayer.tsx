import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface SecureVideoPlayerProps {
  url: string;
  videoUrls?: Record<string, string>;
  nativeLanguage?: string;
  title?: string;
  className?: string;
  userName?: string;
  userId?: string;
  autoPlay?: boolean;
  thumbnailUrl?: string;
}

export default function SecureVideoPlayer({ 
  url, 
  videoUrls, 
  nativeLanguage, 
  title = "Video Player", 
  className = "", 
  userName, 
  userId,
  autoPlay = false,
  thumbnailUrl
}: SecureVideoPlayerProps) {
  const [currentLang, setCurrentLang] = useState<string>('english');
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);

  useEffect(() => {
    setIsPlaying(autoPlay);
  }, [autoPlay, url, videoUrls]);

  // Normalize the videoUrls object to lowercase keys for consistent case-insensitive handling
  const normalizedVideoUrls = React.useMemo(() => {
    if (!videoUrls) return null;
    const normalized: Record<string, string> = {};
    Object.entries(videoUrls).forEach(([key, val]) => {
      if (val) {
        normalized[key.toLowerCase()] = val;
      }
    });
    return normalized;
  }, [videoUrls]);

  useEffect(() => {
    // Auto-select native language if available, otherwise default to english
    const lang = nativeLanguage?.toLowerCase();
    if (lang && lang !== 'english' && normalizedVideoUrls && normalizedVideoUrls[lang]) {
      setCurrentLang(lang);
    } else {
      setCurrentLang('english');
    }
  }, [nativeLanguage, normalizedVideoUrls]);

  // Determine which URL to play
  let currentUrl = url;
  if (normalizedVideoUrls && normalizedVideoUrls[currentLang]) {
    currentUrl = normalizedVideoUrls[currentLang];
  } else if (normalizedVideoUrls && normalizedVideoUrls['english']) {
    currentUrl = normalizedVideoUrls['english'];
  }

  if (!currentUrl) return null;

  // Convert Google Drive /view links to /preview for embedding
  if (currentUrl.includes('drive.google.com/file/d/')) {
    currentUrl = currentUrl.replace(/\/view.*$/, '/preview');
  }

  // Prevent auto play by rewriting URL query parameters if isPlaying is false
  try {
    const hasProtocol = currentUrl.startsWith('http://') || currentUrl.startsWith('https://') || currentUrl.startsWith('//');
    const parseUrl = hasProtocol 
      ? (currentUrl.startsWith('//') ? 'https:' + currentUrl : currentUrl) 
      : 'https://dummy.com/' + currentUrl;
    
    const urlObj = new URL(parseUrl);
    
    if (isPlaying) {
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be') || urlObj.hostname.includes('vimeo.com')) {
        urlObj.searchParams.set('autoplay', '1');
      } else {
        urlObj.searchParams.set('autoplay', 'true');
      }
    } else {
      urlObj.searchParams.set('autoplay', '0');
      urlObj.searchParams.delete('play');
      urlObj.searchParams.set('play', 'false');
      
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be') || urlObj.hostname.includes('vimeo.com')) {
        urlObj.searchParams.set('autoplay', '0');
      } else {
        urlObj.searchParams.set('autoplay', 'false');
      }
    }
    
    const updatedSearch = urlObj.search;
    const hash = urlObj.hash;
    const baseWithoutSearch = currentUrl.split('?')[0].split('#')[0];
    currentUrl = baseWithoutSearch + updatedSearch + hash;
  } catch (err) {
    console.error('Failed to parse and adjust video URL for autoplay configuration:', err);
  }

  const isIframeSupported = 
    currentUrl.includes('youtube.com') || 
    currentUrl.includes('youtu.be') || 
    currentUrl.includes('player.vdocipher.com') || 
    currentUrl.includes('mediadelivery.net') ||
    currentUrl.includes('bunnycdn.com') ||
    currentUrl.includes('player.vimeo.com') ||
    currentUrl.includes('drive.google.com');

  const hasMultipleLanguages = normalizedVideoUrls && Object.keys(normalizedVideoUrls).filter(k => normalizedVideoUrls[k]).length > 1;
  const isGoogleDrive = currentUrl.includes('drive.google.com');

  // Extract YouTube Video ID to fetch high-quality default thumbnail image if available
  const getYoutubeId = (urlStr: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlStr?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

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
        onClick={() => setIsPlaying(true)}
        className={`w-full h-full min-h-[160px] relative cursor-pointer bg-slate-950 flex flex-col justify-center items-center hover:bg-slate-900 transition-all duration-300 ${className} group overflow-hidden`}
        style={displayThumbnailUrl ? { backgroundImage: `url(${displayThumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {/* Semi-transparent overlay to ensure contrast and readable text */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300 pointer-events-none" />
        
        {/* Subtle dynamic grid overlay */}
        {!displayThumbnailUrl && (
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        )}
        
        {/* Soft elegant vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40 pointer-events-none" />

        {/* Big gorgeous play button */}
        <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-pink-600 border border-white/20 group-hover:border-pink-500 flex items-center justify-center text-white transition-all duration-300 transform group-hover:scale-110 shadow-2xl relative z-10 backdrop-blur-sm">
          <Play className="w-7 h-7 fill-current translate-x-0.5 text-white" />
        </div>
        

      </div>
    );
  }

  return (
    <div className={`w-full h-full relative bg-black flex flex-col ${className}`}>
      <div 
        className="w-full flex-grow relative overflow-hidden"
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click
      >
        {isIframeSupported ? (
          <iframe
            src={currentUrl}
            title={title}
            className="w-full absolute border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={
              isGoogleDrive 
                ? { height: 'calc(100% + 60px)', top: '-60px', left: 0 } 
                : { height: '100%', top: 0, left: 0 }
            }
          />
        ) : (
          <video 
            src={currentUrl} 
            className="w-full h-full absolute inset-0" 
            controls 
            controlsList="nodownload" // Prevent download button
            disablePictureInPicture // Prevent PiP which can sometimes be used to bypass restrictions
            autoPlay={true}
          />
        )}
        {/* Overlay to prevent easy inspection of video element if it's a direct mp4 */}
        {!isIframeSupported && (
          <div className="absolute inset-0 z-10 pointer-events-none" />
        )}
        
        {/* Watermark Overlay */}
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
      
      {hasMultipleLanguages && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {Object.entries(normalizedVideoUrls)
            .filter(([_, vUrl]) => !!vUrl)
            .map(([lang, _]) => (
              <button
                key={lang}
                onClick={() => setCurrentLang(lang)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors shadow-sm cursor-pointer ${
                  currentLang === lang 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-white/90 text-gray-700 hover:bg-white border border-gray-200'
                }`}
              >
                {lang === 'tamil' ? 'TAMIL' : lang === 'english' ? 'ENGLISH' : lang.toUpperCase()}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
