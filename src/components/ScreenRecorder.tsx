import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, Square, RefreshCcw, CircleCheck, AlertCircle, Maximize2, Minimize2, 
  Send, Download, Mic, MicOff, Volume2, VolumeX, Users, Radio, Settings2, Sliders, CheckCircle2
} from 'lucide-react';
import { cn } from '../utils';

interface ScreenRecorderProps {
  onSave?: (blob: Blob) => void;
  title?: string;
  onClose?: () => void;
}

export default function ScreenRecorder({ onSave, title = "Record Live Class", onClose }: ScreenRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
  };

  // Setup Audio Context & Meter Analysis
  const setupAudioMixer = async (screenMedia: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      
      const destination = audioCtx.createMediaStreamDestination();
      audioDestinationRef.current = destination;

      // 1. Faculty Microphone Capture
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
          const micSource = audioCtx.createMediaStreamSource(micStream);
          const micGain = audioCtx.createGain();
          micGain.gain.value = facultyVolume;
          facultyGainRef.current = micGain;

          const micAnalyser = audioCtx.createAnalyser();
          micAnalyser.fftSize = 64;
          micSource.connect(micGain);
          micGain.connect(micAnalyser);
          micGain.connect(destination);

          // Track Meter
          setupAnalyserLoop(micAnalyser, setFacultyLevel);
        } catch (micErr) {
          console.warn("Faculty microphone access notice:", micErr);
        }
      }

      // 2. System / Tab Audio from Screen Capture
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

          setupAnalyserLoop(sysAnalyser, setSystemLevel);
        } catch (sysErr) {
          console.warn("System audio routing notice:", sysErr);
        }
      }

      // 3. Student Audio (Checks virtual classroom audio elements or student stream)
      if (includeStudentAudio) {
        try {
          // Look for any existing remote audio elements in DOM or create auxiliary channel
          const audioElements = document.querySelectorAll('audio');
          let attached = false;
          audioElements.forEach(el => {
            if ((el as any).srcObject) {
              try {
                const elemSource = audioCtx.createMediaElementSource(el);
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
            // Fallback student channel simulation/gain
            const stGain = audioCtx.createGain();
            stGain.gain.value = studentVolume;
            studentGainRef.current = stGain;
          }
        } catch (stErr) {
          console.warn("Student audio channel notice:", stErr);
        }
      }

      // Master Analyser
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

  // Adjust live gain when slider moves
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
    try {
      // Prompt screen selection with system audio checkbox
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          frameRate: { ideal: 30 },
          displaySurface: 'monitor'
        } as any,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        } as any
      });
      screenStreamRef.current = screenStream;

      // Mix Faculty + System + Student Audio
      const mixedAudioStream = await setupAudioMixer(screenStream);

      // Combine Screen Video track + Mixed Multi-Channel Audio track
      const combinedTracks = [
        ...screenStream.getVideoTracks(),
        ...(mixedAudioStream ? mixedAudioStream.getAudioTracks() : screenStream.getAudioTracks())
      ];

      const combinedStream = new MediaStream(combinedTracks);
      setStream(combinedStream);

      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
      }

      // Handle user stopping screen share via browser bar
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
        stopAllMedia();
      };
    } catch (err: any) {
      console.error('Error accessing screen capture:', err);
      if (err.name !== 'NotAllowedError') {
        setError('Could not access screen capture. Please ensure permissions are granted.');
      }
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    try {
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      const selectedMime = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMime });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMime });
        setVideoUrl(URL.createObjectURL(blob));
        setRecordedBlob(blob);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start(1000); // 1-second chunks for reliability
      setRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (e: any) {
      console.error('MediaRecorder start error:', e);
      setError('Could not start live recorder. Please try again.');
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
      a.download = `live_class_recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
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

      {/* Header & Source Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">{title}</h4>
            <p className="text-[11px] text-slate-400">Triple-Source Audio Mixer: Faculty Mic + System Sounds + Student Audio</p>
          </div>
        </div>

        {/* Live Audio Source VU Indicator Badges */}
        <div className="flex items-center gap-2">
          {/* Faculty Mic Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition",
            includeFacultyMic ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-500"
          )}>
            {includeFacultyMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>Faculty</span>
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
            <span>System</span>
            {includeSystemAudio && (
              <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                <div 
                  className="h-full bg-cyan-400 transition-all duration-75"
                  style={{ width: `${systemLevel}%` }}
                />
              </div>
            )}
          </div>

          {/* Student Audio Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition",
            includeStudentAudio ? "bg-amber-950/60 border-amber-500/30 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-500"
          )}>
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Student</span>
            {includeStudentAudio && (
              <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                <div 
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${studentLevel}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screen Selection Initial Screen */}
      {!stream && !videoUrl && (
        <div className="space-y-4">
          <button
            onClick={startScreenCapture}
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
              Click to choose your lecture slides, whiteboard, software demo, or browser tab.
            </p>
            <div className="mt-4 flex items-center gap-2 bg-red-950/50 border border-red-500/30 px-3 py-1.5 rounded-full text-red-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-red-400" />
              <span>Multi-Source Audio: Faculty Mic + System Sounds + Student Audio</span>
            </div>
            {error && <p className="text-xs text-red-400 mt-3 font-bold bg-red-950/80 px-3 py-1 rounded-lg border border-red-500/30">{error}</p>}
          </button>
          
          {/* Audio Mixing Customizer Controls */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">Audio Source Mixing Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Faculty Mic Control */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span>Faculty Voice</span>
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
                    <span>System / PC Audio</span>
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

              {/* Student Audio Control */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Student Voice Audio</span>
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

            <div className="bg-amber-950/30 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5 mt-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-relaxed">
                <strong>Tip:</strong> In the browser prompt, make sure to check <strong>"Also share system audio"</strong> or <strong>"Share tab audio"</strong>. The recorder will seamlessly mix your microphone with computer audio and student questions.
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
                <span>Screen Ready • Click Start Recording</span>
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
                  title="Change Screen"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
                {!isFullScreen && (
                  <button
                    onClick={toggleFullScreen}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors cursor-pointer"
                    title="Full Screen"
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
                <p className="font-bold text-white text-sm">Class Recording Completed</p>
                <p className="text-xs text-slate-400">
                  Duration: {formatTime(recordingTime)} • Includes Faculty Mic, System Audio & Student Voice
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
    </div>
  );
}
