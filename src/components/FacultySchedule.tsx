import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { User, ScheduleSlot } from '../types';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { cn } from '../utils';

interface FacultyScheduleProps {
  students: User[];
}

export default function FacultySchedule({ students }: FacultyScheduleProps) {
  const { user: facultyUser } = useAuth();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  
  // Form state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [type, setType] = useState<'live_class' | 'self_task' | 'demo'>('live_class');

  useEffect(() => {
    if (!facultyUser?.id) return;

    const q = query(
      collection(db, 'schedule_slots'),
      where('facultyId', '==', facultyUser.id),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newSlots = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ScheduleSlot));
      // Sort by start time
      newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setSlots(newSlots);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schedule_slots');
    });

    return () => unsubscribe();
  }, [facultyUser?.id, selectedDate]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyUser?.id || !selectedStudent) return;

    const student = students.find(s => s.id === selectedStudent);
    if (!student) return;

    try {
      const startDateObj = new Date(selectedDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj < startDateObj) {
        alert("End date cannot be before start date.");
        return;
      }

      if (selectedDays.length === 0) {
        alert("Please select at least one day of the week.");
        return;
      }

      const currentDate = new Date(startDateObj);
      const batchPromises = [];

      while (currentDate <= endDateObj) {
        if (selectedDays.includes(currentDate.getDay())) {
          const dateString = currentDate.toISOString().split('T')[0];
          const newSlot: Omit<ScheduleSlot, 'id'> = {
            facultyId: facultyUser.id,
            studentId: student.id,
            studentName: student.name,
            date: dateString,
            startTime,
            endTime,
            type,
            status: 'scheduled'
          };
          batchPromises.push(addDoc(collection(db, 'schedule_slots'), newSlot));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      await Promise.all(batchPromises);
      setIsAdding(false);
      // Reset form
      setSelectedStudent('');
      setStartTime('09:00');
      setEndTime('11:00');
      setEndDate(selectedDate);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schedule_slots');
    }
  };

  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;
    try {
      await deleteDoc(doc(db, 'schedule_slots', slotToDelete));
      setSlotToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `schedule_slots/${slotToDelete}`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shift Roster & Schedule</h2>
          <p className="text-sm text-gray-500">Manage 2-hour clock-in windows for your students.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSlot} className="bg-pink-50 p-4 rounded-2xl border border-pink-100 mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-pink-900 mb-1">Type</label>
              <select 
                value={type}
                onChange={(e) => {
                  setType(e.target.value as 'live_class' | 'self_task' | 'demo');
                  setSelectedStudent(''); // Reset student when type changes
                }}
                className="w-full rounded-xl border-pink-200 text-sm focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="live_class">Live Class (1-on-1)</option>
                <option value="self_task">Self Task</option>
                <option value="demo">Demo Class</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-pink-900 mb-1">Student</label>
              <select 
                required
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full rounded-xl border-pink-200 text-sm focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Select Student</option>
                {students
                  .filter(s => type === 'demo' ? (s.registeredForDemo && !s.isApproved) : s.isApproved)
                  .map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.studentId || 'Pending Approval'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-pink-900 mb-1">End Date</label>
              <input 
                type="date" 
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border-pink-200 text-sm focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-pink-900 mb-1">Start Time</label>
              <input 
                type="time" 
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border-pink-200 text-sm focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-pink-900 mb-1">End Time</label>
              <input 
                type="time" 
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border-pink-200 text-sm focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-pink-900 mb-2">Repeat on Days</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 1, label: 'Mon' },
                  { id: 2, label: 'Tue' },
                  { id: 3, label: 'Wed' },
                  { id: 4, label: 'Thu' },
                  { id: 5, label: 'Fri' },
                  { id: 6, label: 'Sat' },
                  { id: 0, label: 'Sun' }
                ].map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      if (selectedDays.includes(day.id)) {
                        setSelectedDays(selectedDays.filter(d => d !== day.id));
                      } else {
                        setSelectedDays([...selectedDays, day.id]);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                      selectedDays.includes(day.id)
                        ? "bg-pink-600 text-white"
                        : "bg-white text-pink-600 border border-pink-200 hover:bg-pink-50"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button type="submit" className="flex-1 md:flex-none px-6 bg-pink-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-pink-700">
                Save Schedule
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 md:flex-none px-6 bg-white text-gray-700 border border-gray-300 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {slots.length === 0 ? (
          <div className="text-center py-12 text-gray-500 italic bg-gray-50 rounded-2xl border border-gray-100">
            No slots scheduled for this date.
          </div>
        ) : (
          slots.map(slot => (
            <div key={slot.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-pink-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${slot.type === 'live_class' ? 'bg-pink-100 text-pink-600' : slot.type === 'demo' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{slot.studentName}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${slot.type === 'live_class' ? 'bg-pink-50 text-pink-700' : slot.type === 'demo' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'}`}>
                      {slot.type === 'live_class' ? 'Live Class' : slot.type === 'demo' ? 'Demo Class' : 'Self Task'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      slot.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      slot.status === 'missed' ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
                
              <div className="flex items-center gap-4">
                {slot.clockInTime && (
                  <div className="text-right text-xs text-gray-500">
                    <div>In: {new Date(slot.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    {slot.clockOutTime && <div>Out: {new Date(slot.clockOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>}
                  </div>
                )}
                <button 
                  onClick={() => setSlotToDelete(slot.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete Slot"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Delete Slot Modal */}
      {slotToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Slot</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this slot? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSlotToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSlot}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
