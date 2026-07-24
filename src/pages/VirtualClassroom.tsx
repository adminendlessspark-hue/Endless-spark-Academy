import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Video, 
  ExternalLink, 
  Monitor, 
  Info, 
  Presentation, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  BookOpen
} from 'lucide-react';
import { collection, query, where, getDocs, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScreenRecorder from '../components/ScreenRecorder';
import SecurePdfViewer from '../components/SecurePdfViewer';
import { useSettings } from '../hooks/useSettings';

export default function VirtualClassroom() {
  const { roomId } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { jitsiServer } = useSettings();
  
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [bandwidthStatus, setBandwidthStatus] = useState<'checking' | 'good' | 'low' | null>('checking');
  
  // Real-time synchronization states
  const [sessionDocId, setSessionDocId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'split' | 'jitsi' | 'slides'>('split');
  const [embedJitsi, setEmbedJitsi] = useState<boolean>(true);
  const [screenshareOptimization, setScreenshareOptimization] = useState<'text' | 'motion' | 'lowres_text' | 'lowres_motion'>('lowres_text');

  const handleGoBack = () => {
    navigate(-1);
  };

  // Check bandwidth on mount
  useEffect(() => {
    const checkBandwidth = async () => {
      try {
        const startTime = performance.now();
        const response = await fetch('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&q=80', { cache: 'no-store' });
        const blob = await response.blob();
        const endTime = performance.now();
        const durationInSeconds = (endTime - startTime) / 1000;
        const bitsLoaded = blob.size * 8;
        const speedMbps = (bitsLoaded / durationInSeconds) / (1024 * 1024);
        
        if (speedMbps < 2) {
          setBandwidthStatus('low');
        } else {
          setBandwidthStatus('good');
        }
      } catch (err) {
        setBandwidthStatus(null);
      }
    };
    checkBandwidth();
  }, []);

  // Fetch access and subscribe to the live session in real-time
  useEffect(() => {
    if (!roomId) return;
    
    const isDemoRoom = roomId.startsWith('EndlessSpark-Demo') || 
                       roomId.toLowerCase().includes('demo');

    // If user is not logged in yet but room is a demo room, allow guest/demo access
    if (!user) {
      if (isDemoRoom) {
        setIsAllowed(true);
      }
      return;
    }

    const setupRealtimeSession = async () => {
      try {
        const isUserAdmin = isAdmin || 
                            user.role === 'admin' || 
                            (user.email && [
                              'adminendlessspark@gmail.com',
                              'endlessspark.in@gmail.com',
                              'info@endlesssparkcreativehub.in'
                            ].includes(user.email));

        if (isDemoRoom || isUserAdmin || user.role === 'marketing' || user.registeredForDemo || user.role === 'student' || user.role === 'faculty') {
          setIsAllowed(true);
        }

        const q = query(collection(db, 'live_sessions'), where('roomId', '==', roomId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setIsAllowed(true);
          return;
        }

        const docSnapshot = querySnapshot.docs[0];
        setSessionDocId(docSnapshot.id);
        setSessionData(docSnapshot.data());

        // Always allow access for demo rooms or logged-in users
        setIsAllowed(true);

        // Real-time synchronization subscription
        const unsubscribe = onSnapshot(doc(db, 'live_sessions', docSnapshot.id), (updatedDoc) => {
          if (updatedDoc.exists()) {
            setSessionData(updatedDoc.data());
          }
        });

        return unsubscribe;
      } catch (err) {
        console.error("Error setting up live classroom access:", err);
        setAccessError(err instanceof Error ? err.message : String(err));
        // Always allow access for demo or logged-in users
        setIsAllowed(true);
      }
    };

    let unsubscribePromise = setupRealtimeSession();

    return () => {
      unsubscribePromise.then(unsub => {
        if (unsub) unsub();
      });
    };
  }, [roomId, user, isAdmin]);

  // Load modules that have slides
  useEffect(() => {
    const fetchCourseModules = async () => {
      try {
        const q = query(collection(db, 'course_modules'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter to only modules that have admin PowerPoint/PDF slides uploaded
        setCourseModules(list.filter((m: any) => m.slidesUrl));
      } catch (err) {
        console.error("Error loading course modules for presentation:", err);
      }
    };
    
    if (user?.role === 'admin' || user?.role === 'marketing' || user?.role === 'faculty') {
      fetchCourseModules();
    }
  }, [user]);

  // Handle slide sharing actions (Presenter controls)
  const startPresenting = async () => {
    if (!sessionDocId || !selectedModuleId) return;
    const selectedModule = courseModules.find(m => m.id === selectedModuleId);
    if (!selectedModule) return;
    
    try {
      await updateDoc(doc(db, 'live_sessions', sessionDocId), {
        activeSlidesUrl: selectedModule.slidesUrl,
        activeModuleTitle: selectedModule.title,
        activeSlidesPage: 1
      });
    } catch (err) {
      console.error("Error starting presentation:", err);
      alert("Failed to start presentation: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const stopPresenting = async () => {
    if (!sessionDocId) return;
    try {
      await updateDoc(doc(db, 'live_sessions', sessionDocId), {
        activeSlidesUrl: null,
        activeModuleTitle: null,
        activeSlidesPage: null
      });
    } catch (err) {
      console.error("Error stopping presentation:", err);
    }
  };

  const updatePresenterPage = async (page: number) => {
    if (!sessionDocId) return;
    try {
      await updateDoc(doc(db, 'live_sessions', sessionDocId), {
        activeSlidesPage: page
      });
    } catch (err) {
      console.error("Error syncing presenter page number:", err);
    }
  };

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Room ID</h2>
          <button 
            onClick={handleGoBack}
            className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <p>Verifying access and syncing room...</p>
        </div>
      </div>
    );
  }

  if (isAllowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md w-full p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4 text-sm">
            You do not have permission to join this classroom. It may be assigned to a different faculty member or student group.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-left text-xs space-y-1.5 font-mono text-slate-700">
            <div><span className="font-bold text-slate-500">Logged User:</span> {user?.email || 'N/A'}</div>
            <div><span className="font-bold text-slate-500">User Role:</span> {user?.role || 'N/A'}</div>
            <div><span className="font-bold text-slate-500">Is Admin Role:</span> {isAdmin ? 'True' : 'False'}</div>
            <div><span className="font-bold text-slate-500">Room ID:</span> {roomId}</div>
            {accessError && (
              <div className="text-red-600 mt-2 border-t border-slate-200/60 pt-2 break-all whitespace-pre-wrap">
                <span className="font-bold text-red-700">System Error:</span> {accessError}
              </div>
            )}
          </div>

          <button 
            onClick={handleGoBack}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Jitsi settings URL
  const baseDomain = jitsiServer ? jitsiServer.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '') : 'jitsi.belnet.be';
  
  let resolution = '1080';
  let minFps = 5;
  let maxFps = 5;
  let extraParams = '';

  if (screenshareOptimization === 'text') {
    resolution = '1080';
    minFps = 5;
    maxFps = 5;
    extraParams = '&config.constraints.video.height.ideal=1080&config.constraints.video.width.ideal=1920&config.videoQuality.preferredCodec=vp9&config.videoQuality.maxReceiverVideoQuality=1080';
  } else if (screenshareOptimization === 'motion') {
    resolution = '1080';
    minFps = 15;
    maxFps = 30;
    extraParams = '&config.constraints.video.height.ideal=1080&config.constraints.video.width.ideal=1920&config.videoQuality.preferredCodec=vp8&config.videoQuality.maxReceiverVideoQuality=1080';
  } else if (screenshareOptimization === 'lowres_text') {
    resolution = '720';
    minFps = 5;
    maxFps = 5;
    extraParams = '&config.constraints.video.height.ideal=720&config.constraints.video.width.ideal=1280&config.videoQuality.preferredCodec=vp9&config.videoQuality.maxReceiverVideoQuality=720';
  } else if (screenshareOptimization === 'lowres_motion') {
    resolution = '480';
    minFps = 10;
    maxFps = 15;
    extraParams = '&config.constraints.video.height.ideal=480&config.constraints.video.width.ideal=854&config.videoQuality.preferredCodec=vp8&config.videoQuality.maxReceiverVideoQuality=480';
  }

  const jitsiUrl = `https://${baseDomain}/${roomId}#config.resolution=${resolution}&config.desktopSharingFrameRate.min=${minFps}&config.desktopSharingFrameRate.max=${maxFps}&config.videoQuality.enforcePreferredCodec=true${extraParams}&config.startWithVideoMuted=false&config.startWithAudioMuted=false`;

  // Determine slide file types & viewer setup - Disabled since slide view is not supported
  const hasActiveSlides = false;
  const activeSlidesUrl = sessionData?.activeSlidesUrl || '';
  const activeSlidesTitle = sessionData?.activeModuleTitle || 'Class Presentation';
  const activeSlidesPage = sessionData?.activeSlidesPage || 1;

  const isPdf = activeSlidesUrl.toLowerCase().endsWith('.pdf') || (activeSlidesUrl.includes('/course_modules/') && !activeSlidesUrl.includes('.ppt') && !activeSlidesUrl.includes('.pptx'));
  
  const parsedEmbedUrl = activeSlidesUrl 
    ? (activeSlidesUrl.includes('docs.google.com/presentation') 
        ? (activeSlidesUrl.includes('/pub') 
            ? activeSlidesUrl.replace('/pub?', '/embed?') 
            : activeSlidesUrl)
        : `https://docs.google.com/gview?url=${encodeURIComponent(activeSlidesUrl)}&embedded=true`)
    : '';

  const isPresenter = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 overflow-hidden">
      {/* Header & Control Center */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoBack}
            className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-350 hover:text-white"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-md font-bold tracking-wide uppercase text-slate-200">Interactive Live Classroom</h1>
            </div>
            {hasActiveSlides && (
              <p className="text-xs text-pink-400 font-semibold mt-0.5 flex items-center gap-1">
                <Presentation className="w-3.5 h-3.5 inline" /> Presenting Slide: {activeSlidesTitle}
              </p>
            )}
          </div>
        </div>

        {/* Layout Modes Toggle (Active only when presenting slides) */}
        {hasActiveSlides && (
          <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${layoutMode === 'split' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Split View
            </button>
            <button
              onClick={() => setLayoutMode('slides')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${layoutMode === 'slides' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Slides Only
            </button>
            <button
              onClick={() => setLayoutMode('jitsi')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${layoutMode === 'jitsi' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Video Only
            </button>
          </div>
        )}

        {/* Jitsi Mode Controller & Settings */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Screen Share Optimization Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Monitor className="w-3.5 h-3.5 text-pink-500 shrink-0" />
            <span className="text-slate-400 font-semibold hidden lg:inline">Screen Quality:</span>
            <select
              value={screenshareOptimization}
              onChange={(e) => setScreenshareOptimization(e.target.value as any)}
              className="bg-transparent text-slate-200 font-bold focus:ring-0 focus:outline-none border-none py-0.5 cursor-pointer pr-6 text-xs outline-none"
              title="Optimize screen share for text readability (low frame rate, high resolution) or smooth video motion"
            >
              <option value="text" className="bg-slate-950 text-slate-200">Text & Slides (Crisp 1080p)</option>
              <option value="motion" className="bg-slate-950 text-slate-200">Video & Motion (Smooth FPS)</option>
              <option value="lowres_text" className="bg-slate-950 text-slate-200">Low-Res Readable (720p Text)</option>
              <option value="lowres_motion" className="bg-slate-950 text-slate-200">Low-Res Smooth (480p Low Bandwidth)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs hover:bg-slate-850 cursor-pointer">
            <input 
              type="checkbox" 
              checked={embedJitsi} 
              onChange={(e) => setEmbedJitsi(e.target.checked)}
              className="rounded text-pink-500 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0"
            />
            <span className="font-semibold text-slate-300">Embed Call Here</span>
          </label>

          <a
            href={jitsiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold rounded-xl transition-all"
            title="Open Jitsi Call in a new browser tab"
          >
            <ExternalLink className="w-4 h-4" />
            New Tab Call
          </a>

          <div className="text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            {roomId}
          </div>
        </div>
      </div>

      {/* Presenter controls box disabled since slide view is not supported */}
      {false && isPresenter && (
        <div className="bg-slate-950/60 border-b border-slate-850 px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-10 transition-all text-sm">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <Presentation className="w-5 h-5 text-pink-500 shrink-0" />
            <span className="font-bold text-slate-300 shrink-0">Admin Slide Deck presenter:</span>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-slate-200 block outline-none flex-1 max-w-sm"
            >
              <option value="">-- Choose Module Slide Deck --</option>
              {courseModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.course.toUpperCase()} - {m.title}
                </option>
              ))}
            </select>
            {selectedModuleId ? (
              <button
                onClick={startPresenting}
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> Present Slide within App
              </button>
            ) : (
              <button
                disabled
                className="bg-slate-800 text-slate-500 font-bold text-xs px-4 py-2 rounded-xl"
              >
                Present Slide within App
              </button>
            )}
          </div>

          {hasActiveSlides && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 font-semibold">Active Pres.: <strong className="text-slate-200">{activeSlidesTitle}</strong></span>
              
              {/* Optional page controller for PDF presentation sync */}
              {isPdf && (
                <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => updatePresenterPage(Math.max(activeSlidesPage - 1, 1))}
                    disabled={activeSlidesPage <= 1}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30"
                    title="Slide Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono px-1">Page {activeSlidesPage}</span>
                  <button 
                    onClick={() => updatePresenterPage(activeSlidesPage + 1)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300"
                    title="Slide Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <button
                onClick={stopPresenting}
                className="bg-red-950/50 hover:bg-red-900/60 border border-red-900/40 text-red-400 hover:text-red-300 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Stop Presentations
              </button>
            </div>
          )}
        </div>
      )}

      {/* Primary Workstation / Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* If NO active slides are being shown right now, render the standard call view / information panel */}
        {!hasActiveSlides ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-auto p-6 gap-6">
            
            {/* Embedded Jitsi Meeting Panel */}
            {embedJitsi ? (
              <div className="flex-1 bg-slate-950 rounded-3xl border border-slate-850 p-3 overflow-hidden shadow-2xl relative min-h-[500px]">
                <iframe
                  src={jitsiUrl}
                  className="w-full h-full border-0 rounded-2xl bg-slate-950"
                  allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media"
                  id="jitsi-iframe-main"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="bg-slate-950 shadow-2xl max-w-xl w-full rounded-3xl p-10 border border-slate-800">
                  <div className="w-20 h-20 bg-pink-900/40 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/20">
                    <Video className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Launch Call in a Secure Window</h2>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    You have toggled off embedding. Click below to enter the live call in a maximized external tab, while managing materials here.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a
                      href={jitsiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 bg-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-md hover:bg-pink-700 transition-all shadow-lg hover:-translate-y-1"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Join Classroom Now
                    </a>
                  </div>

                  {bandwidthStatus === 'low' && (
                    <div className="mt-8 p-4 bg-orange-950/30 border border-orange-900/30 rounded-2xl text-left max-w-md mx-auto">
                      <h4 className="font-bold text-orange-400 flex items-center gap-2 mb-1.5 text-sm">
                        <AlertCircle className="w-4 h-4" /> Connection warning
                      </h4>
                      <p className="text-orange-300 text-xs leading-relaxed">
                        Internet status is below recommended. System quality has adjusted to prevent disconnection.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sidebar Guidelines & Screen Recorder panel (mainly for admins/faculties) */}
            {isPresenter && (
              <div className="w-full md:w-96 bg-slate-950/35 border border-slate-850 p-6 rounded-3xl space-y-6 overflow-auto">
                <div className="p-5 bg-slate-950/90 rounded-2xl border border-slate-850 shadow-md">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-3">
                    <Monitor className="w-4 h-4 text-pink-500" /> Screen Recording
                  </h3>
                  <p className="text-xs text-slate-440 mb-4 leading-relaxed">
                    Record class presentations cleanly. Utilize Jitsi alongside presentation slides to capture classroom moments files securely.
                  </p>
                  <ScreenRecorder />
                </div>

                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-850">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1 text-sm mb-3">
                    <Info className="w-4 h-4 text-pink-500" /> Interactive Slides Guide
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed space-y-2">
                    To show presentation slides inside the virtual room, select an Admin-configured course slide deck from the drop-down menu above and click <span className="text-pink-400 font-semibold font-mono">Present Slide within App</span>.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          
          /* If presentation IS sharing, show Split-pane, Slides-only, or Jitsi-only depending on layoutMode */
          <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden h-full">
            
            {/* Jitsi Video Section (Visible in 'split' and 'jitsi' layout modes) */}
            {(layoutMode === 'split' || layoutMode === 'jitsi') && (
              <div 
                className={`bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden relative shadow-2xl flex flex-col transition-all duration-300 ${
                  layoutMode === 'jitsi' ? 'w-full h-full' : 'w-full md:w-[48%] h-full'
                }`}
              >
                {embedJitsi ? (
                  <iframe
                    src={jitsiUrl}
                    className="w-full flex-1 border-0"
                    allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media"
                    id="jitsi-iframe-split"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Video className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
                    <p className="text-sm font-bold text-slate-300">Call is launched in background / external tab.</p>
                    <a
                      href={jitsiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Re-open Call Tab
                    </a>
                  </div>
                )}
                
                {/* Visual title inside split view */}
                <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-900 text-xs flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Audio/Video Classroom Stream</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
                </div>
              </div>
            )}

            {/* PowerPoint Slide Deck Presenter Panel (Visible in 'split' and 'slides' layout modes) */}
            {(layoutMode === 'split' || layoutMode === 'slides') && (
              <div 
                className={`bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
                  layoutMode === 'slides' ? 'w-full h-full' : 'w-full md:flex-1 h-full'
                }`}
              >
                {/* Header for Presentation */}
                <div className="bg-slate-950 px-5 py-3 border-b border-slate-900 flex justify-between items-center text-xs shrink-0 font-bold text-slate-350">
                  <div className="flex items-center gap-1.5 text-pink-400">
                    <Presentation className="w-4 h-4" /> Live Presentation Module Material
                  </div>
                  <div className="text-[10px] text-slate-400 border border-slate-800 bg-slate-900 px-3 py-1 rounded-lg uppercase">
                    In-App Synchronized Slide
                  </div>
                </div>

                {/* Slides content frame */}
                <div className="flex-1 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                  {isPdf ? (
                    // Native secure watermarked PDF presentation
                    <div className="w-full h-full p-2 overflow-auto">
                      <SecurePdfViewer
                        url={activeSlidesUrl}
                        title={activeSlidesTitle}
                        userName={user?.name || "Student"}
                        userId={user?.id || "ID"}
                        isFullscreen={true}
                        externalPageNumber={activeSlidesPage}
                        onPageChange={(page) => {
                          // Faculty/Admin scrolls propagates to students
                          if (isPresenter) {
                            updatePresenterPage(page);
                          }
                        }}
                        userRole={user?.role}
                      />
                    </div>
                  ) : (
                    // External / PPTX / Google Slides embed view
                    <iframe
                      src={parsedEmbedUrl}
                      className="w-full h-full border-0 select-none bg-slate-950"
                      allow="autoplay"
                      title={activeSlidesTitle}
                    />
                  )}
                </div>

                {/* Secure Watermark notification for studious material safety */}
                <div className="bg-slate-950 py-2 border-t border-slate-900 text-[10px] text-slate-500 text-center select-none shrink-0 italic">
                  🔒 Secure Presentation View. User Watermark is enforced active. Material downloads are disabled for course safety.
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
