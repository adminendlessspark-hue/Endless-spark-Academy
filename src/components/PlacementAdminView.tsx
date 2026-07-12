import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PlacementSettings, GlobalPlacementYear, GlobalPlacementRecord, User, StudentPlacementInfo } from '../types';
import { Briefcase, Plus, Trash2, Edit, Check, X, Image } from 'lucide-react';
import { cn } from '../utils';
import { FileUploader } from './FileUploader';
import CompanyLogo from './CompanyLogo';

export default function PlacementAdminView({ students }: { students: User[] }) {
  const [placementSettings, setPlacementSettings] = useState<PlacementSettings | null>(null);
  const [subTab, setSubTab] = useState<'global' | 'students'>('global');
  
  // States for Global
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const [newYearForm, setNewYearForm] = useState({ year: '' });
  const [newRecordForm, setNewRecordForm] = useState<Partial<GlobalPlacementRecord>>({});
  const [editingRecord, setEditingRecord] = useState<{ year: string; recordId: string } | null>(null);
  const [editRecordForm, setEditRecordForm] = useState<Partial<GlobalPlacementRecord>>({});
  
  // States for Students
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [studentForm, setStudentForm] = useState<StudentPlacementInfo | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'placements'), (docSnap) => {
      if (docSnap.exists()) {
        setPlacementSettings(docSnap.data() as PlacementSettings);
      } else {
        setPlacementSettings({ id: 'placements', yearlyRecords: [] });
      }
    });
    return () => unsub();
  }, []);

  const handleSaveGlobal = async (newSettings: PlacementSettings) => {
    try {
      // Deep clean undefined fields before saving to Firestore
      const cleanObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(cleanObject);
        } else if (obj !== null && typeof obj === 'object') {
          return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = cleanObject(value);
            }
            return acc;
          }, {} as any);
        }
        return obj;
      };
      await setDoc(doc(db, 'settings', 'placements'), cleanObject(newSettings), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/placements');
    }
  };

  const handleAddYear = () => {
    if (!newYearForm.year) return;
    const current = placementSettings?.yearlyRecords || [];
    if (current.find(y => y.year === newYearForm.year)) {
      alert('Year already exists');
      return;
    }
    const newSettings = {
      id: 'placements',
      yearlyRecords: [...current, { year: newYearForm.year, records: [] }]
    };
    handleSaveGlobal(newSettings);
    setNewYearForm({ year: '' });
  };

  const handleAddRecord = (year: string) => {
    if (!newRecordForm.companyName || !newRecordForm.studentsPlaced || !newRecordForm.highestPackage) return;
    
    const newRecord: GlobalPlacementRecord = {
      id: Date.now().toString(),
      companyName: newRecordForm.companyName,
      studentsPlaced: Number(newRecordForm.studentsPlaced),
      highestPackage: Number(newRecordForm.highestPackage),
      logoUrl: newRecordForm.logoUrl || ''
    };

    const current = placementSettings?.yearlyRecords || [];
    const updated = current.map(y => {
      if (y.year === year) {
        return { ...y, records: [...y.records, newRecord] };
      }
      return y;
    });

    handleSaveGlobal({ id: 'placements', yearlyRecords: updated });
    setNewRecordForm({});
    setEditingYear(null);
  };

  const handleRemoveRecord = (year: string, recordId: string) => {
    const current = placementSettings?.yearlyRecords || [];
    const updated = current.map(y => {
      if (y.year === year) {
        return { ...y, records: y.records.filter(r => r.id !== recordId) };
      }
      return y;
    });
    handleSaveGlobal({ id: 'placements', yearlyRecords: updated });
  };

  const handleEditRecord = (year: string, record: GlobalPlacementRecord) => {
    setEditingRecord({ year, recordId: record.id });
    setEditRecordForm({ ...record });
    setEditingYear(null); // Close add form if open
  };

  const handleUpdateRecord = (year: string) => {
    if (!editRecordForm.companyName || !editRecordForm.studentsPlaced || !editRecordForm.highestPackage) return;

    const current = placementSettings?.yearlyRecords || [];
    const updated = current.map(y => {
      if (y.year === year) {
        return {
          ...y,
          records: y.records.map(r => {
            if (r.id === editingRecord?.recordId) {
              return {
                ...r,
                companyName: editRecordForm.companyName!,
                studentsPlaced: Number(editRecordForm.studentsPlaced),
                highestPackage: Number(editRecordForm.highestPackage),
                logoUrl: editRecordForm.logoUrl || ''
              };
            }
            return r;
          })
        };
      }
      return y;
    });

    handleSaveGlobal({ id: 'placements', yearlyRecords: updated });
    setEditingRecord(null);
    setEditRecordForm({});
  };

  const handleRemoveYear = (year: string) => {
    const current = placementSettings?.yearlyRecords || [];
    const updated = current.filter(y => y.year !== year);
    handleSaveGlobal({ id: 'placements', yearlyRecords: updated });
  };

  const handleStudentPlacementSave = async () => {
    if (!editingStudent || !studentForm) return;
    try {
      // Deep clean studentForm to prevent undefined values
      const cleanObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(cleanObject);
        } else if (obj !== null && typeof obj === 'object') {
          return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = cleanObject(value);
            }
            return acc;
          }, {} as any);
        }
        return obj;
      };
      await setDoc(doc(db, 'users', editingStudent.id), { placementInfo: cleanObject(studentForm) }, { merge: true });
      setEditingStudent(null);
      setStudentForm(null);
      alert('Student placement updated');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
  };

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-px">
        <button
          onClick={() => setSubTab('global')}
          className={cn("px-4 py-2 font-bold", subTab === 'global' ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500")}
        >
          Student Placed Companies
        </button>
        <button
          onClick={() => setSubTab('students')}
          className={cn("px-4 py-2 font-bold", subTab === 'students' ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500")}
        >
          Student Placements Console
        </button>
      </div>

      {subTab === 'global' && (
        <div>
          <div className="mb-8 flex items-end gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Add Academic Year</label>
              <input type="text" placeholder="e.g. 2022-2023" value={newYearForm.year} onChange={e => setNewYearForm({year: e.target.value})} className="px-3 py-2 border rounded-lg" />
            </div>
            <button onClick={handleAddYear} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Add Year</button>
          </div>

          <div className="space-y-8">
            {(placementSettings?.yearlyRecords || []).map(y => (
              <div key={y.year} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <h4 className="text-xl font-bold">Placements for {y.year}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingYear(editingYear === y.year ? null : y.year)} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-sm font-bold">Add Company</button>
                    <button onClick={() => handleRemoveYear(y.year)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm font-bold">Remove Year</button>
                  </div>
                </div>

                {editingYear === y.year && (
                  <div className="mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-200">
                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Company Details</h5>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Company Name</label>
                        <input
                          type="text"
                          value={newRecordForm.companyName || ''}
                          onChange={e => setNewRecordForm({ ...newRecordForm, companyName: e.target.value })}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 outline-none"
                          placeholder="e.g. Acme Corporation"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Students Placed</label>
                          <input
                            type="number"
                            value={newRecordForm.studentsPlaced || ''}
                            onChange={e => setNewRecordForm({ ...newRecordForm, studentsPlaced: Number(e.target.value) })}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 outline-none"
                            placeholder="e.g. 5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Highest Package (₹ Annual)</label>
                          <input
                            type="number"
                            value={newRecordForm.highestPackage || ''}
                            onChange={e => setNewRecordForm({ ...newRecordForm, highestPackage: Number(e.target.value) })}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 outline-none"
                            placeholder="e.g. 600000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Logo URL (Optional, or upload on the right)</label>
                        <input
                          type="text"
                          value={newRecordForm.logoUrl || ''}
                          onChange={e => setNewRecordForm({ ...newRecordForm, logoUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-850 outline-none text-xs"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">Company Logo Upload</h5>
                        <div className="flex items-center gap-4">
                          <CompanyLogo
                            src={newRecordForm.logoUrl}
                            name={newRecordForm.companyName || 'New Company'}
                            className="w-16 h-16 border border-slate-200 rounded-xl bg-white"
                          />
                          <div className="flex-1">
                            <FileUploader
                              path="placement-logos"
                              onUploadComplete={(url) => setNewRecordForm({ ...newRecordForm, logoUrl: url })}
                              accept="image/jpeg,image/png,image/webp,image/svg+xml"
                              className="scale-95 origin-left"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setEditingYear(null);
                            setNewRecordForm({});
                          }}
                          className="px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddRecord(y.year)}
                          className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <Check className="w-4 h-4" /> Save Company
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {editingRecord && editingRecord.year === y.year && (
                  <div className="mb-6 p-6 bg-amber-50/40 rounded-2xl border border-amber-200 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-200">
                    <div className="space-y-4">
                      <h5 className="font-bold text-amber-900 text-sm uppercase tracking-wider">Edit Company Details</h5>
                      
                      <div>
                        <label className="block text-xs font-bold text-amber-850 mb-1">Company Name</label>
                        <input
                          type="text"
                          value={editRecordForm.companyName || ''}
                          onChange={e => setEditRecordForm({ ...editRecordForm, companyName: e.target.value })}
                          className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 outline-none"
                          placeholder="e.g. Acme Corporation"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-amber-850 mb-1">Students Placed</label>
                          <input
                            type="number"
                            value={editRecordForm.studentsPlaced || ''}
                            onChange={e => setEditRecordForm({ ...editRecordForm, studentsPlaced: Number(e.target.value) })}
                            className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 outline-none"
                            placeholder="e.g. 5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-amber-850 mb-1">Highest Package (₹ Annual)</label>
                          <input
                            type="number"
                            value={editRecordForm.highestPackage || ''}
                            onChange={e => setEditRecordForm({ ...editRecordForm, highestPackage: Number(e.target.value) })}
                            className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 outline-none"
                            placeholder="e.g. 600000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-850 mb-1">Logo URL (Optional, or upload on the right)</label>
                        <input
                          type="text"
                          value={editRecordForm.logoUrl || ''}
                          onChange={e => setEditRecordForm({ ...editRecordForm, logoUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium text-slate-850 outline-none text-xs"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-amber-900 text-sm uppercase tracking-wider mb-3">Company Logo Upload</h5>
                        <div className="flex items-center gap-4">
                          <CompanyLogo
                            src={editRecordForm.logoUrl}
                            name={editRecordForm.companyName || 'Edit Company'}
                            className="w-16 h-16 border border-amber-200 rounded-xl bg-white"
                          />
                          <div className="flex-1">
                            <FileUploader
                              path="placement-logos"
                              onUploadComplete={(url) => setEditRecordForm({ ...editRecordForm, logoUrl: url })}
                              accept="image/jpeg,image/png,image/webp,image/svg+xml"
                              className="scale-95 origin-left"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-amber-200">
                        <button
                          onClick={() => {
                            setEditingRecord(null);
                            setEditRecordForm({});
                          }}
                          className="px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateRecord(y.year)}
                          className="px-6 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <Check className="w-4 h-4" /> Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <table className="w-full text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Company</th>
                      <th className="p-2 text-center">Logo</th>
                      <th className="p-2">Students Placed</th>
                      <th className="p-2">Highest Package</th>
                      <th className="p-2 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {y.records.map(r => (
                      <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-slate-50/50">
                        <td className="p-2 font-medium text-slate-800">{r.companyName}</td>
                        <td className="p-2 text-center flex justify-center">
                          <CompanyLogo src={r.logoUrl} name={r.companyName} className="w-10 h-10" />
                        </td>
                        <td className="p-2 text-slate-700">{r.studentsPlaced}</td>
                        <td className="p-2 font-medium text-slate-800">₹ {r.highestPackage.toLocaleString()}</td>
                        <td className="p-2 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => handleEditRecord(y.year, r)}
                              className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Edit company"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveRecord(y.year, r.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete company"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {y.records.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500 italic">No companies added yet</td></tr>}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'students' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 border-r border-gray-200 pr-6">
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="overflow-y-auto max-h-[60vh] space-y-2 pr-2">
              {students
                .filter(s => s.role === 'student' && s.isApproved)
                .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(s => (
                <button 
                  key={s.id}
                  onClick={() => {
                    setEditingStudent(s);
                    setStudentForm(s.placementInfo || { eligible: false, status: 'Course Ongoing' });
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-colors",
                    editingStudent?.id === s.id ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-100 hover:bg-gray-50"
                  )}
                >
                  <div className="font-bold text-gray-900 truncate">{s.name}</div>
                  <div className="text-xs text-gray-500 uppercase flex items-center justify-between mt-1">
                    <span className="truncate pr-2">{s.assignedCourse ? s.assignedCourse.replace(/-/g, ' ') : 'No Course'}</span>
                    <span className={cn("px-1.5 py-0.5 rounded font-bold text-[9px]", s.placementInfo?.status === 'Placed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {s.placementInfo?.status || 'Ongoing'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            {!editingStudent || !studentForm ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <Briefcase className="w-12 h-12 mb-4 opacity-50" />
                <p>Select a student to update their placement record.</p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{editingStudent.name}</h3>
                    <p className="text-sm text-gray-500">{editingStudent.email} • {editingStudent.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                      <input 
                        type="checkbox" 
                        checked={studentForm.eligible} 
                        onChange={e => setStudentForm({...studentForm, eligible: e.target.checked})}
                        className="accent-indigo-600 cursor-pointer w-4 h-4"
                      />
                      Eligible for Placement
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Current Status</label>
                    <select 
                      value={studentForm.status}
                      onChange={e => setStudentForm({...studentForm, status: e.target.value as any})}
                      className="w-full px-4 py-2 border rounded-xl"
                    >
                      <option value="Course Ongoing">Course Ongoing</option>
                      <option value="Pending">Pending (Searching)</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Not Placed">Not Placed</option>
                      <option value="Placed">Placed successfully</option>
                    </select>
                  </div>

                  {studentForm.status === 'Interview Scheduled' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Interview Company</label>
                        <input type="text" value={studentForm.interviewCompany || ''} onChange={e=>setStudentForm({...studentForm, interviewCompany: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Interview Date</label>
                        <input type="datetime-local" value={studentForm.interviewDate || ''} onChange={e=>setStudentForm({...studentForm, interviewDate: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                      </div>
                    </>
                  )}

                  {studentForm.status === 'Placed' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Placed Company</label>
                        <input type="text" value={studentForm.placedCompany || ''} onChange={e=>setStudentForm({...studentForm, placedCompany: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Annual Package (e.g. 5,00,000)</label>
                        <input type="text" value={studentForm.packageAmount || ''} onChange={e=>setStudentForm({...studentForm, packageAmount: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                      </div>
                    </>
                  )}
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Admin Notes (visible to student)</label>
                    <textarea 
                      value={studentForm.notes || ''} 
                      onChange={e=>setStudentForm({...studentForm, notes: e.target.value})} 
                      className="w-full px-4 py-2 border rounded-xl min-h-[100px]"
                      placeholder="e.g. Prepare well for your HR round tomorrow..."
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-6">
                  <button onClick={handleStudentPlacementSave} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700">
                    <Check className="w-4 h-4" /> Save Record
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
