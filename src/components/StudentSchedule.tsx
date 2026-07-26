import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { ScheduleSlot } from '../types';
import { Clock, Calendar, CheckCircle, AlertCircle, Video, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentSchedule() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [today] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'schedule_slots'),
      where('studentId', '==', user.id),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newSlots = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ScheduleSlot));
      newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setSlots(newSlots);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schedule_slots');
    });

    return () => unsubscribe();
  }, [user?.id, today]);

  const handleClockIn = async (slotId: string) => {
    try {
      await updateDoc(doc(db, 'schedule_slots', slotId), {
        clockInTime: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `schedule_slots/${slotId}`);
    }
  };

  const handleClockOut = async (slotId: string) => {
    try {
      await updateDoc(doc(db, 'schedule_slots', slotId), {
        clockOutTime: new Date().toISOString(),
        status: 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `schedule_slots/${slotId}`);
    }
  };

  const isWithinWindow = (slot: ScheduleSlot) => {
    const now = currentTime;
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    
    const start = new Date(now);
    start.setHours(startHour, startMin, 0, 0);
    
    const end = new Date(now);
    end.setHours(endHour, endMin, 0, 0);
    
    // Allow clock in 5 mins early, up to 15 mins late
    const earlyStart = new Date(start.getTime() - 5 * 60000);
    const lateStart = new Date(start.getTime() + 15 * 60000);
    
    let canClockOut = false;
    if (slot.clockInTime) {
      // Must complete 2 hours from clock in time
      const clockIn = new Date(slot.clockInTime);
      const requiredOutTime = new Date(clockIn.getTime() + 2 * 60 * 60 * 1000);
      canClockOut = now >= requiredOutTime;
    }
    
    return {
      canClockIn: now >= earlyStart && now <= lateStart,
      canClockOut,
      isMissed: now > lateStart
    };
  };

  const getRemainingTime = (clockInTime: string) => {
    const clockIn = new Date(clockInTime);
    const requiredOutTime = new Date(clockIn.getTime() + 2 * 60 * 60 * 1000);
    const diff = requiredOutTime.getTime() - currentTime.getTime();
    if (diff <= 0) return "00:00:00";
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-600" />
            Today's Schedule & Logging Buffer
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-pink-600">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Current Time</p>
        </div>
      </div>

      {/* 15-Min Logging Buffer Rule Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">
            Mandatory 15-Minute Logging Buffer Policy (20 Classes Target)
          </p>
          <p className="leading-relaxed text-amber-800">
            Students must clock in within <strong>15 minutes</strong> of the scheduled start time (starts 5 mins early). If you fail to clock in within the 15-minute buffer window, the class is automatically logged as <strong>Missed (Buffer Exceeded)</strong> and directly reduces your Cumulative Attendance score.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {slots.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic bg-gray-50 rounded-2xl border border-gray-100">
            No classes or tasks scheduled for today.
          </div>
        ) : (
          slots.map(slot => {
            const { canClockIn, canClockOut, isMissed } = isWithinWindow(slot);
            
            // Auto-mark as missed in Firestore if student failed 15m clock-in logging buffer
            if (isMissed && !slot.clockInTime && slot.status === 'scheduled') {
              updateDoc(doc(db, 'schedule_slots', slot.id), {
                status: 'missed',
                missReason: 'Failed 15-minute clock-in logging buffer'
              }).catch(() => {});
            }

            return (
              <div key={slot.id} className={`p-5 rounded-2xl border transition-all ${
                slot.status === 'completed' ? 'bg-green-50 border-green-200' :
                slot.status === 'missed' || (isMissed && !slot.clockInTime) ? 'bg-red-50 border-red-200' :
                'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      slot.type === 'live_class' ? 'bg-pink-100 text-pink-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {slot.type === 'live_class' ? 'Live 1-on-1 Class' : 'Self Task'}
                        </h3>
                        {slot.status === 'scheduled' && !slot.clockInTime && canClockIn && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            15m Clock-In Buffer Open
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <span className="font-mono font-medium">{slot.startTime} - {slot.endTime}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm">2 Hours</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {slot.status === 'completed' ? (
                      <div className="flex items-center gap-2 text-green-700 font-bold bg-green-100 border border-green-200 px-4 py-2 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Completed
                      </div>
                    ) : slot.status === 'missed' || (isMissed && !slot.clockInTime) ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-red-700 font-bold bg-red-100 border border-red-200 px-4 py-2 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          Missed (Buffer Failed)
                        </div>
                        <span className="text-[10px] font-semibold text-red-600 mt-1">
                          Exceeded 15-minute logging buffer
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 items-end">
                        {!slot.clockInTime ? (
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            {slot.type === 'live_class' && (
                              <Link
                                to={`/classroom/${slot.roomId || `ES-Classroom-${user?.assignedFacultyId || user?.id || 'General'}`}`}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-200 transition-all hover:scale-105 shrink-0"
                              >
                                <Video className="w-4 h-4 animate-pulse" />
                                Join Live Class
                              </Link>
                            )}
                            <button
                              onClick={() => handleClockIn(slot.id)}
                              disabled={!canClockIn}
                              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                                canClockIn 
                                  ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-200' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Clock In
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-2">
                            {slot.type === 'live_class' && (
                              <Link
                                to={`/classroom/${slot.roomId || `ES-Classroom-${user?.assignedFacultyId || user?.id || 'General'}`}`}
                                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition-all hover:scale-105 mb-1"
                              >
                                <Video className="w-4 h-4 animate-pulse" />
                                Join Live Classroom
                              </Link>
                            )}
                            <div className="bg-pink-50 text-pink-700 px-4 py-2 rounded-lg border border-pink-100 flex items-center gap-2">
                              <Clock className="w-4 h-4 animate-pulse" />
                              <span className="font-mono font-bold text-lg">{getRemainingTime(slot.clockInTime)}</span>
                              <span className="text-xs uppercase tracking-wider font-bold opacity-70">Remaining</span>
                            </div>
                            <button
                              onClick={() => handleClockOut(slot.id)}
                              disabled={!canClockOut}
                              className={`px-6 py-2.5 rounded-xl font-bold transition-all w-full ${
                                canClockOut 
                                  ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Clock Out
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {slot.clockInTime && (
                      <div className="text-xs text-gray-500 font-mono">
                        In: {new Date(slot.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {slot.clockOutTime && ` | Out: ${new Date(slot.clockOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
