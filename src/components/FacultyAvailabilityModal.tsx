import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, ScheduleSlot } from '../types';
import { X, Calendar, Clock, Plus, Trash2 } from 'lucide-react';

interface FacultyAvailabilityModalProps {
  faculty: User;
  onClose: () => void;
}

export default function FacultyAvailabilityModal({ faculty, onClose }: FacultyAvailabilityModalProps) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [students, setStudents] = useState<User[]>([]);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [type, setType] = useState<'live_class' | 'self_task'>('live_class');

  useEffect(() => {
    const q = query(
      collection(db, 'schedule_slots'),
      where('facultyId', '==', faculty.id),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newSlots = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ScheduleSlot));
      newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setSlots(newSlots);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schedule_slots');
    });

    return () => unsubscribe();
  }, [faculty.id, selectedDate]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const student = students.find(s => s.id === selectedStudent);
    if (!student) return;

    try {
      const startDateObj = new Date(selectedDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj < startDateObj) {
        alert("End date cannot be before start date.");
        return;
      }

      const currentDate = new Date(startDateObj);
      const batchPromises = [];

      while (currentDate <= endDateObj) {
        const dateString = currentDate.toISOString().split('T')[0];
        const newSlot: Omit<ScheduleSlot, 'id'> = {
          facultyId: faculty.id,
          studentId: student.id,
          studentName: student.name,
          date: dateString,
          startTime,
          endTime,
          type,
          status: 'scheduled'
        };
        batchPromises.push(addDoc(collection(db, 'schedule_slots'), newSlot));
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{faculty.name}'s Schedule</h2>
            <p className="text-sm text-gray-500">View and assign slots</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0"
                />
              </div>
              <div className="text-sm text-gray-500">
                Total Slots: <span className="font-bold text-gray-900">{slots.length}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Assign Slot
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddSlot} className="bg-pink-50 p-4 rounded-2xl border border-pink-100 mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-pink-900 mb-1">Student</label>
                <select 
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full rounded-xl border-pink-200 text-sm focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-pink-900 mb-1">Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as 'live_class' | 'self_task')}
                  className="w-full rounded-xl border-pink-200 text-sm focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="live_class">Live Class (1-on-1)</option>
                  <option value="self_task">Self Task</option>
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
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-pink-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-pink-700">
                  Save
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-white text-gray-700 border border-gray-300 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
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
                <div key={slot.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      slot.type === 'live_class' ? 'bg-pink-100 text-pink-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{slot.studentName}</h4>
                      <p className="text-sm text-gray-500 capitalize">{slot.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="font-mono font-bold text-gray-900">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className={`text-xs font-bold mt-1 uppercase tracking-wider ${
                        slot.status === 'completed' ? 'text-green-600' :
                        slot.status === 'missed' ? 'text-red-600' :
                        'text-pink-600'
                      }`}>
                        {slot.status}
                      </div>
                    </div>
                    <button 
                      onClick={() => setSlotToDelete(slot.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Slot Modal */}
      {slotToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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
