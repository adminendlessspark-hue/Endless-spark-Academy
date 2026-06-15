import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { LiveSession } from '../types';
import { Loader2, AlertCircle, Video, CheckCircle, Save } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export default function InterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { jitsiServer } = useSettings();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [feedback, setFeedback] = useState('');
  const [skillsGap, setSkillsGap] = useState('');
  const [interviewStatus, setInterviewStatus] = useState<'pass' | 'fail' | 'pending'>('pending');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!roomId) return;
      try {
        const docRef = doc(db, 'live_sessions', roomId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as LiveSession;
          if (data.type === 'interview' || data.type === 'hr_interview') {
            setSession({ ...data, id: docSnap.id });
            setFeedback(data.feedback || '');
            setSkillsGap(data.skillsGap || '');
            setInterviewStatus(data.interviewStatus || 'pending');
          } else {
            setError("Invalid interview link.");
          }
        } else {
          setError("Interview not found.");
        }
      } catch (err) {
        console.error("Error fetching interview:", err);
        setError("Failed to load interview details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [roomId]);

  const handleSaveFeedback = async () => {
    if (!session) return;
    setIsSaving(true);
    setIsSaved(false);
    try {
      await updateDoc(doc(db, 'live_sessions', session.id), {
        feedback,
        skillsGap,
        interviewStatus,
        status: 'completed'
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Error saving feedback:", err);
      alert("Failed to save feedback.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          <p className="text-gray-600 font-medium">Loading Interview Room...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const baseDomain = jitsiServer ? jitsiServer.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '') : 'jitsi.belnet.be';
  const jitsiUrl = `https://${baseDomain}/${session.roomId}#config.resolution=1080&config.desktopSharingFrameRate.min=15&config.desktopSharingFrameRate.max=30&config.videoQuality.enforcePreferredCodec=true`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left Side: Video Call */}
      <div className="flex-1 flex flex-col h-[50vh] md:h-screen border-r border-gray-200">
        <div className="bg-gray-900 text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-md z-10 gap-2">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-pink-500" />
            <h1 className="text-lg font-semibold">
              {session.type === 'hr_interview' ? 'HR Interview' : 'Technical Interview'} - {session.studentName || 'Student'}
            </h1>
          </div>
          <div className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-lg">
            If screen share is blurry, consider checking your internet bandwidth.
          </div>
        </div>
        <div className="flex-1 bg-black">
          <iframe
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* Right Side: Feedback Form */}
      <div className="w-full md:w-[400px] lg:w-[500px] bg-white flex flex-col h-[50vh] md:h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">Interviewer Evaluation</h2>
          <p className="text-sm text-gray-500 mt-1">Analyze skill set, identify gaps, and provide feedback.</p>
        </div>
        
        <div className="p-6 space-y-6 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide detailed feedback on the student's performance..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none min-h-[150px] resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Identified Skill Gaps</label>
            <textarea
              value={skillsGap}
              onChange={(e) => setSkillsGap(e.target.value)}
              placeholder="What areas does the student need to improve?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none min-h-[120px] resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Final Decision</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setInterviewStatus('pass')}
                className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                  interviewStatus === 'pass' 
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Pass
              </button>
              <button
                onClick={() => setInterviewStatus('fail')}
                className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                  interviewStatus === 'fail' 
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Fail
              </button>
              <button
                onClick={() => setInterviewStatus('pending')}
                className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                  interviewStatus === 'pending' 
                    ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
          <button
            onClick={handleSaveFeedback}
            disabled={isSaving}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            ) : isSaved ? (
              <><CheckCircle className="w-5 h-5 text-green-400" /> Saved Successfully</>
            ) : (
              <><Save className="w-5 h-5" /> Submit Evaluation</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
