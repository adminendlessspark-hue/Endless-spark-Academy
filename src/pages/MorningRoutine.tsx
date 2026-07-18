import React from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import MoralEducation from '../components/MoralEducation';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export default function MorningRoutine() {
  const { user } = useAuth();
  const { wellnessVideoUrl, wellnessEnabled } = useSettings();
  const navigate = useNavigate();

  const handleWellnessComplete = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateDoc(doc(db, 'users', user.id), {
        lastWellnessDate: today
      });
      alert('Morning Routine completed! Keep up the great energy today.');
      navigate('/dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  if (!wellnessEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center bg-white rounded-3xl border border-gray-100 max-w-2xl mx-auto shadow-sm">
        <h3 className="text-xl font-extrabold text-gray-800 mb-2">Morning Routine Module is Currently Disabled</h3>
        <p className="text-sm text-gray-500 max-w-md">Please ask your administrator to enable the Wellness Day Starter to access this routine.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <MoralEducation
        userName={user?.name || 'Student'}
        videoUrl={wellnessVideoUrl}
        onComplete={handleWellnessComplete}
        onBack={() => navigate('/dashboard')}
      />
    </div>
  );
}
