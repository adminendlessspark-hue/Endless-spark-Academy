import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, Square, RefreshCcw, CircleCheck, AlertCircle, Maximize2, Minimize2, 
  Send, Download, Mic, MicOff, Volume2, VolumeX, Users, Radio, Settings2, Sliders, 
  CheckCircle2, Cloud, HardDrive, ShieldCheck, Sparkles, Film, Play, Info, ExternalLink
} from 'lucide-react';
import { cn } from '../utils';

interface ScreenRecorderProps {
  onSave?: (blob: Blob) => void;
  title?: string;
  onClose?: () => void;
  roomId?: string;
  jitsiServer?: string;
}

export default function ScreenRecorder({ 
  onSave, 
  title = "Record Live Class", 
  onClose,
  roomId,
  jitsiServer 
}: ScreenRecorderProps) {
  const [recordingMode, setRecordingMode] = useState<'mixer' | 'jitsi_native'>('mixer');
  const [recording, setRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('video/webm');
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Audio Mixer Source States
  const [includeFacultyMic, setIncludeFacultyMic] = useState(true);
  const [includeSystemAudio, setIncludeSystemAudio] = useState(true);
  const [includeStudentAudio, setIncludeStudentAudio] = useState(true);
  const [facultyVolume, setFacultyVolume] = useState(1.0);
  const [systemVolume, setSystemVolume] = useState(1.0);
  const [studentVolume, setStudentVolume] = useState(1.0);

  // Visual Audio VU Meter Level State (0-100)
  const [facultyLevel, setFacultyLevel] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);
  const [studentLevel, setStudentLevel] = useState(0);
  const [masterLevel, setMasterLevel] = useState(0);

  // Audio Context & Nodes Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const studentStreamRef = useRef<MediaStream | null>(null);
  const facultyGainRef = useRef<GainNode | null>(null);
  const systemGainRef = useRef<GainNode | null>(null);
  const studentGainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Clean up all streams and audio contexts on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (studentStreamRef.current) {
      studentStreamRef.current.getTracks().forEach(t => t.stop());
      studentStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setStream(null);
    setFacultyLevel(0);
    setSystemLevel(0);
    setStudentLevel(0);
    setMasterLevel(0);
  };

  // Setup Dual-Track Web Audio API Mixer & Level Analysis
  const setupAudioMixer = async (screenMedia: MediaStream): Promise<MediaStream | null> => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;
      
      const destination = audioCtx.createMediaStreamDestination();
      audioDestinationRef.current = destination;

      // 1. Capture Local Faculty Microphone
      if (includeFacultyMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          micStreamRef.current = micStream;

          if (micStream.getAudioTracks().length > 0) {
            const micSource = audioCtx.createMediaStreamSource(micStream);
            const micGain = audioCtx.createGain();
            micGain.gain.value = facultyVolume;
            facultyGainRef.current = micGain;

            const micAnalyser = audioCtx.createAnalyser();
            micAnalyser.fftSize = 64;
            micSource.connect(micGain);
            micGain.connect(micAnalyser);
            micGain.connect(destination);

            // Live faculty VU meter loop
            setupAnalyserLoop(micAnalyser, setFacultyLevel);
          }
        } catch (micErr) {
          console.warn("Faculty microphone access notice:", micErr);
        }
      }

      // 2. Capture System / Tab Audio from Screen Capture (Jitsi iframe / student voices)
      const screenAudioTracks = screenMedia.getAudioTracks();
      if (screenAudioTracks.length > 0 && includeSystemAudio) {
        try {
          const screenSource = audioCtx.createMediaStreamSource(screenMedia);
          const sysGain = audioCtx.createGain();
          sysGain.gain.value = systemVolume;
          systemGainRef.current = sysGain;

          const sysAnalyser = audioCtx.createAnalyser();
          sysAnalyser.fftSize = 64;
          screenSource.connect(sysGain);
          sysGain.connect(sysAnalyser);
          sysGain.connect(destination);

          // Live system/tab VU meter loop
          setupAnalyserLoop(sysAnalyser, setSystemLevel);
        } catch (sysErr) {
          console.warn("System audio routing notice:", sysErr);
        }
      }

      // 3. Aux / Student DOM Audio elements (if accessible from page)
      if (includeStudentAudio) {
        try {
          const audioElements = document.querySelectorAll('audio, video');
          let attached = false;
          audioElements.forEach(el => {
            if ((el as any).srcObject && el !== videoRef.current) {
              try {
                const elemSource = audioCtx.createMediaElementSource(el as HTMLMediaElement);
                const stGain = audioCtx.createGain();
                stGain.gain.value = studentVolume;
                studentGainRef.current = stGain;
                const stAnalyser = audioCtx.createAnalyser();
                stAnalyser.fftSize = 64;
                elemSource.connect(stGain);
                stGain.connect(stAnalyser);
                stGain.connect(destination);
                setupAnalyserLoop(stAnalyser, setStudentLevel);
                attached = true;
              } catch (e) {}
            }
          });

          if (!attached) {
            const stGain = audioCtx.createGain();
            stGain.gain.value = studentVolume;
            studentGainRef.current = stGain;
          }
        } catch (stErr) {
          console.warn("Student audio channel notice:", stErr);
        }
      }

      // Master Analyser on destination
      const masterAnalyser = audioCtx.createAnalyser();
      masterAnalyser.fftSize = 64;
      destination.connect(masterAnalyser);
      setupAnalyserLoop(masterAnalyser, setMasterLevel);

      return destination.stream;
    } catch (e) {
      console.warn("Audio mixer initialization fallback:", e);
      return null;
    }
  };

  const setupAnalyserLoop = (analyser: AnalyserNode, setLevel: React.Dispatch<React.SetStateAction<number>>) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      if (analyser.context.state === 'running') {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setLevel(Math.min(100, Math.round((avg / 255) * 100 * 1.5)));
      }
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  // Adjust live gains when volume sliders change
  useEffect(() => {
    if (facultyGainRef.current) facultyGainRef.current.gain.value = includeFacultyMic ? facultyVolume : 0;
  }, [facultyVolume, includeFacultyMic]);

  useEffect(() => {
    if (systemGainRef.current) systemGainRef.current.gain.value = includeSystemAudio ? systemVolume : 0;
  }, [systemVolume, includeSystemAudio]);

  useEffect(() => {
    if (studentGainRef.current) studentGainRef.current.gain.value = includeStudentAudio ? studentVolume : 0;
  }, [studentVolume, includeStudentAudio]);

  const startScreenCapture = async () => {
    setError(null);
    setIsInitializing(true);
    try {
      // 1. Capture screen video + tab audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          frameRate: { ideal: 30, max: 60 },
          displaySurface: 'monitor'
        } as any,
        audio: true // Captures Jitsi iframe / system tab audio
      });
      screenStreamRef.current = displayStream;

      // 2. Mix Faculty Microphone + System / Tab Audio using Web Audio API
      const mixedAudioStream = await setupAudioMixer(displayStream);

      // 3. Combine display video track with mixed audio stream
      const audioTracks = mixedAudioStream && mixedAudioStream.getAudioTracks().length > 0
        ? mixedAudioStream.getAudioTracks()
        : displayStream.getAudioTracks();

      const combinedTracks = [
        ...displayStream.getVideoTracks(),
        ...audioTracks
      ];

      const combinedStream = new MediaStream(combinedTracks);
      setStream(combinedStream);

      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
      }

      // Automatically trigger stopRecording when the user stops screen sharing via browser banner
      if (displayStream.getVideoTracks()[0]) {
        displayStream.getVideoTracks()[0].onended = () => {
          console.log("Screen sharing ended by user");
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            stopRecording();
          }
          stopAllMedia();
        };
      }
    } catch (err: any) {
      console.error('Error accessing screen capture:', err);
      if (err.name !== 'NotAllowedError') {
        setError('Could not access screen capture. Please ensure permissions are granted and try again.');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    try {
      // Standard fallback MIME types with VP9/VP8 and Opus audio
      const candidateMimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4'
      ];
      
      const selectedMime = candidateMimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      setRecordedMimeType(selectedMime);

      const recorder = new MediaRecorder(stream, { 
        mimeType: selectedMime,
        videoBitsPerSecond: 2500000 // 2.5 Mbps for crisp slides & clear text
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMime });
        setVideoUrl(URL.createObjectURL(blob));
        setRecordedBlob(blob);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // 1-second timeslice chunks to prevent zero-byte recordings or buffer dropouts
      recorder.start(1000);
      setRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (e: any) {
      console.error('MediaRecorder start error:', e);
      setError('Could not start live recorder: ' + (e?.message || String(e)));
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setIsPaused(false);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => {
    setVideoUrl(null);
    setRecordedBlob(null);
    stopAllMedia();
    startScreenCapture();
  };

  const handleDownload = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      const ext = recordedMimeType.includes('mp4') ? 'mp4' : 'webm';
      a.download = `live_class_recording_${(roomId || 'session').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSubmit = () => {
    if (recordedBlob && onSave) {
      onSave(recordedBlob);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={cn(
      "space-y-4 transition-all duration-300",
      isFullScreen ? "fixed inset-0 z-[60] bg-slate-950 p-6 flex flex-col items-center justify-center" : "relative"
    )}>
      {isFullScreen && (
        <button 
          onClick={toggleFullScreen}
          className="absolute top-6 right-6 p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors z-50 cursor-pointer shadow-lg"
          title="Exit Full Screen"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}

      {/* Recording Architecture Mode Tabs */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setRecordingMode('mixer')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              recordingMode === 'mixer'
                ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md shadow-red-900/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Dual-Track Web Audio Mixer (Teams-Style)</span>
          </button>
          <button
            onClick={() => setRecordingMode('jitsi_native')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              recordingMode === 'jitsi_native'
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Native Jitsi Cloud / Jibri Option</span>
          </button>
        </div>

        {/* Live Audio Source VU Indicator Badges */}
        {recordingMode === 'mixer' && (
          <div className="flex items-center gap-2">
            {/* Faculty Mic Badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition",
              includeFacultyMic ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"
            )}>
              {includeFacultyMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
              <span>Faculty Mic</span>
              {includeFacultyMic && (
                <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${facultyLevel}%` }}
                  />
                </div>
              )}
            </div>

            {/* System Audio Badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition",
              includeSystemAudio ? "bg-cyan-950/60 border-cyan-500/30 text-cyan-300" : "bg-slate-950 border-slate-800 text-slate-500"
            )}>
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tab / Jitsi</span>
              {includeSystemAudio && (
                <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${systemLevel}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mode 1: Dual-Track Web Audio API Mixer */}
      {recordingMode === 'mixer' && (
        <>
          {/* Screen Selection Initial Screen */}
          {!stream && !videoUrl && (
            <div className="space-y-4">
              <button
                onClick={startScreenCapture}
                disabled={isInitializing}
                className={cn(
                  "w-full bg-slate-900/60 border-2 border-dashed border-slate-700 hover:border-red-500/50 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-white transition-all group cursor-pointer shadow-xl",
                  isFullScreen ? "h-[65vh]" : "aspect-video"
                )}
              >
                <div className="p-4 bg-slate-800 group-hover:bg-red-600/20 group-hover:text-red-400 text-slate-400 rounded-2xl mb-3 transition border border-slate-700">
                  <Monitor className="w-12 h-12" />
                </div>
                <p className="font-black text-lg text-white">Select Screen / Window to Record</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md text-center">
                  Click to select the live classroom window, presentation slide deck, or whiteboard.
                </p>
                <div className="mt-4 flex items-center gap-2 bg-red-950/50 border border-red-500/30 px-3.5 py-1.5 rounded-full text-red-300 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Integrated Mixer: Faculty Voice (Mic) + Student Audio (Jitsi Tab) + PC Sounds</span>
                </div>
                {error && (
                  <p className="text-xs text-red-400 mt-3 font-bold bg-red-950/80 px-3 py-1 rounded-lg border border-red-500/30">
                    {error}
                  </p>
                )}
              </button>
              
              {/* Audio Mixing Controls */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Audio Channel Mixing Controls</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Web Audio API Active</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Faculty Mic Control */}
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Mic className="w-4 h-4 text-emerald-400" />
                        <span>Faculty Mic (Local)</span>
                      </div>
                      <button 
                        onClick={() => setIncludeFacultyMic(!includeFacultyMic)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded cursor-pointer ${includeFacultyMic ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {includeFacultyMic ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1.5" 
                      step="0.05"
                      value={facultyVolume} 
                      disabled={!includeFacultyMic}
                      onChange={(e) => setFacultyVolume(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>Mute</span>
                      <span>{Math.round(facultyVolume * 100)}%</span>
                      <span>Boost</span>
                    </div>
                  </div>

                  {/* System Audio Control */}
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        <span>Jitsi Tab / System Sound</span>
                      </div>
                      <button 
                        onClick={() => setIncludeSystemAudio(!includeSystemAudio)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded cursor-pointer ${includeSystemAudio ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {includeSystemAudio ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1.5" 
                      step="0.05"
                      value={systemVolume} 
                      disabled={!includeSystemAudio}
                      onChange={(e) => setSystemVolume(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>Mute</span>
                      <span>{Math.round(systemVolume * 100)}%</span>
                      <span>Boost</span>
                    </div>
                  </div>

                  {/* Student Audio Channel */}
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Users className="w-4 h-4 text-amber-400" />
                        <span>Student Voice Gain</span>
                      </div>
                      <button 
                        onClick={() => setIncludeStudentAudio(!includeStudentAudio)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded cursor-pointer ${includeStudentAudio ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {includeStudentAudio ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1.5" 
                      step="0.05"
                      value={studentVolume} 
                      disabled={!includeStudentAudio}
                      onChange={(e) => setStudentVolume(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>Mute</span>
                      <span>{Math.round(studentVolume * 100)}%</span>
                      <span>Boost</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-950/30 border border-blue-500/20 p-3 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-300 leading-relaxed">
                    <strong>Critical Browser Step:</strong> When the browser dialog opens, check <strong className="text-white">"Share tab audio"</strong> or <strong className="text-white">"Share system audio"</strong>. The Web Audio mixer will automatically bind your microphone with student audio into one seamless master track.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Stream Viewport & In-Recording Controls */}
          {stream && !videoUrl && (
            <div className={cn(
              "relative bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800",
              isFullScreen ? "w-full max-w-5xl h-[68vh]" : "aspect-video"
            )}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain bg-black"
              />

              {/* Top Floating Telemetry & Status Bar */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                {recording ? (
                  <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-black shadow-lg animate-pulse border border-red-400/50">
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    <span>REC {formatTime(recordingTime)}</span>
                    {isPaused && <span className="bg-amber-500 px-1.5 py-0.5 rounded text-[10px] ml-1">PAUSED</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-slate-300 text-xs font-bold border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Screen & Audio Mixer Ready • Click Start Recording</span>
                  </div>
                )}

                {/* Live Master Audio VU Bar */}
                <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-[11px] font-mono text-slate-300">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MIXED AUDIO:</span>
                  <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-75",
                        masterLevel > 80 ? "bg-red-500" : masterLevel > 50 ? "bg-amber-400" : "bg-emerald-400"
                      )}
                      style={{ width: `${masterLevel}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Bottom Floating Control Bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md p-2 rounded-full border border-slate-800 shadow-2xl">
                {!recording ? (
                  <>
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-7 py-2.5 rounded-full font-black hover:from-red-500 hover:to-rose-500 transition-all shadow-lg text-sm cursor-pointer active:scale-95"
                    >
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      Start Recording
                    </button>
                    <button
                      onClick={() => { stopAllMedia(); startScreenCapture(); }}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors cursor-pointer"
                      title="Change Screen / Window"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    {!isFullScreen && (
                      <button
                        onClick={toggleFullScreen}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors cursor-pointer"
                        title="Full Screen View"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={pauseRecording}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full font-bold text-xs cursor-pointer transition"
                    >
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 bg-white text-slate-950 px-7 py-2.5 rounded-full font-black hover:bg-slate-200 transition-all shadow-lg text-sm cursor-pointer active:scale-95"
                    >
                      <Square className="w-4 h-4 fill-current text-red-600" />
                      Finish & Save Recording
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Recording Complete Preview & Export Controls */}
          {videoUrl && (
            <div className={cn(
              "space-y-4 w-full",
              isFullScreen ? "max-w-5xl" : ""
            )}>
              <div className={cn(
                "bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800",
                isFullScreen ? "h-[60vh]" : "aspect-video"
              )}>
                <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                    <CircleCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Class Recording Completed Successfully</p>
                    <p className="text-xs text-slate-400">
                      Duration: {formatTime(recordingTime)} • Size: {recordedBlob ? formatFileSize(recordedBlob.size) : 'Ready'} • Dual-Track Mixed Audio (Faculty Mic + Jitsi Tab)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={reset}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-xl cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Record Again
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Video (.webm)
                  </button>
                  {onSave && (
                    <button
                      onClick={handleSubmit}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:from-pink-500 hover:to-rose-500 transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Attach to Class
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mode 2: Native Jitsi Cloud / Jibri Recording Guide & Controls */}
      {recordingMode === 'jitsi_native' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Native Jitsi Server Recording (Jibri / Dropbox)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Record your live conference directly on the Jitsi media server or link with a cloud storage account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> How to Start Jitsi Native Recording:
              </span>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <li>Inside the active Jitsi meeting toolbar at the bottom, click the <strong className="text-white">Three Dots (•••)</strong> menu.</li>
                <li>Select <strong className="text-pink-400">"Start recording"</strong> from the popup list.</li>
                <li>Sign in with your <strong className="text-cyan-300">Dropbox</strong> account or choose local server storage if Jibri is configured.</li>
                <li>When the meeting concludes, stop the recording to auto-generate the cloud video file.</li>
              </ol>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" /> Why Use Browser Dual-Track Mixer?
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                The <strong className="text-pink-400">Dual-Track Web Audio Mixer</strong> (Tab 1) runs 100% locally in your browser with no cloud account or server Jibri setup required. It captures 1080p crisp presentation slides and mixes your faculty mic with student audio directly into a downloadable <code className="bg-slate-900 text-pink-300 px-1.5 py-0.5 rounded">.webm</code> file.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={() => setRecordingMode('mixer')}
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Radio className="w-4 h-4" />
              <span>Switch to Dual-Track Audio Mixer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

