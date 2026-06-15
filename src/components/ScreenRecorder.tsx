import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Square, RefreshCcw, CircleCheck, AlertCircle, Maximize2, Minimize2, Send, Download } from 'lucide-react';
import { cn } from '../utils';

interface ScreenRecorderProps {
  onSave?: (blob: Blob) => void;
  title?: string;
}

export default function ScreenRecorder({ onSave, title = "Record Screen" }: ScreenRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startScreenCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { frameRate: { ideal: 30 } },
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);

      // Handle user stopping the share via browser UI
      mediaStream.getVideoTracks()[0].onended = () => {
        stopRecording();
        setStream(null);
      };
    } catch (err) {
      console.error('Error accessing screen capture:', err);
      setError('Could not access screen capture. Please ensure permissions are granted.');
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoUrl(URL.createObjectURL(blob));
      setRecordedBlob(blob);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const reset = () => {
    setVideoUrl(null);
    setRecordedBlob(null);
    startScreenCapture();
  };

  const handleDownload = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen_recording_${new Date().getTime()}.webm`;
      a.click();
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

  return (
    <div className={cn(
      "space-y-4 transition-all duration-300",
      isFullScreen ? "fixed inset-0 z-[60] bg-black p-8 flex flex-col items-center justify-center" : "relative"
    )}>
      {isFullScreen && (
        <button 
          onClick={toggleFullScreen}
          className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <Minimize2 className="w-6 h-6" />
        </button>
      )}

      {!stream && !videoUrl && (
        <div className="space-y-4">
          <button
            onClick={startScreenCapture}
            className={cn(
              "w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-pink-300 hover:text-pink-600 transition-all",
              isFullScreen ? "h-[70vh]" : "aspect-video"
            )}
          >
            <Monitor className="w-10 h-10 mb-2" />
            <p className="font-bold text-lg">Select Screen to Record</p>
            <p className="text-xs text-gray-400 mt-1">Capture live calls or presentations</p>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </button>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">Privacy Notice:</p>
              <p>To comply with privacy guidelines, please ensure you are only recording the <strong>shared screen content</strong> (whiteboard, presentation, or mind map). Avoid recording student or faculty camera feeds.</p>
            </div>
          </div>
        </div>
      )}

      {stream && !videoUrl && (
        <div className={cn(
          "relative bg-black rounded-xl overflow-hidden shadow-2xl",
          isFullScreen ? "w-full max-w-5xl h-[70vh]" : "aspect-video"
        )}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {!recording ? (
              <>
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-colors shadow-lg text-lg"
                >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  Start Recording
                </button>
                {!isFullScreen && (
                  <button
                    onClick={toggleFullScreen}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                    title="Full Screen"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg text-lg"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </button>
            )}
          </div>

          {recording && (
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full text-white text-xs font-bold animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
              REC
            </div>
          )}
        </div>
      )}

      {videoUrl && (
        <div className={cn(
          "space-y-6 w-full",
          isFullScreen ? "max-w-5xl" : ""
        )}>
          <div className={cn(
            "bg-black rounded-2xl overflow-hidden shadow-2xl",
            isFullScreen ? "h-[60vh]" : "aspect-video"
          )}>
            <video src={videoUrl} controls className="w-full h-full object-contain" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                <CircleCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Recording Complete</p>
                <p className="text-xs text-gray-500">Preview your screen recording</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={reset}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-pink-600 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Re-record
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-pink-50 text-pink-600 px-6 py-2 rounded-xl font-bold hover:bg-pink-100 transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              {onSave && (
                <button
                  onClick={handleSubmit}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-pink-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
