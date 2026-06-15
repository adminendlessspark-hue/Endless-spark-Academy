import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Square, RefreshCcw, CircleCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';

export default function VideoIntro() {
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { logoUrl } = useSettings();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera or microphone. Please ensure permissions are granted.');
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoUrl]);

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
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSave = () => {
    if (videoBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ 
          videoRecorded: true,
          videoIntroStatus: 'pending',
          videoIntroData: reader.result as string
        });
        navigate('/');
      };
      reader.readAsDataURL(videoBlob);
    } else {
      updateUser({ videoRecorded: true });
      navigate('/');
    }
  };

  const resetRecording = () => {
    setVideoBlob(null);
    setVideoUrl(null);
    if (!stream) {
      startCamera();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Video Introduction</h1>
        <p className="text-gray-500 mt-2">Record a short (30-60s) video introducing yourself and your goals for this training.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {!stream && !videoUrl && (
          <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white p-6 text-center">
            <Video className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ready to record?</h3>
            <p className="text-gray-400 mb-6 max-w-sm">We'll need access to your camera and microphone to proceed.</p>
            <button
              onClick={startCamera}
              className="bg-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/20"
            >
              Enable Camera
            </button>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {stream && !videoUrl && (
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
              {!recording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-colors shadow-lg"
                >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Stop Recording
                </button>
              )}
            </div>

            {recording && (
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-white text-sm font-medium">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                REC
              </div>
            )}
          </div>
        )}

        {videoUrl && (
          <div className="space-y-6">
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={resetRecording}
                className="flex items-center gap-2 text-gray-600 font-medium hover:text-gray-900"
              >
                <RefreshCcw className="w-4 h-4" />
                Record Again
              </button>
              
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/20"
              >
                <CircleCheck className="w-5 h-5" />
                Looks Good, Submit
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-pink-50 rounded-xl">
          <p className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">Tip 1</p>
          <p className="text-sm text-gray-700">Ensure you are in a well-lit environment.</p>
        </div>
        <div className="p-4 bg-pink-50 rounded-xl">
          <p className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">Tip 2</p>
          <p className="text-sm text-gray-700">Speak clearly and maintain eye contact.</p>
        </div>
        <div className="p-4 bg-pink-50 rounded-xl">
          <p className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">Tip 3</p>
          <p className="text-sm text-gray-700">Keep it under 60 seconds.</p>
        </div>
      </div>
    </div>
  );
}
