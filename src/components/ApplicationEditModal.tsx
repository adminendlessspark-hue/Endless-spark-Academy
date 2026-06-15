import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { ApplicationData } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase';

import { useSettings } from '../hooks/useSettings';

interface ApplicationEditModalProps {
  studentId: string;
  initialName?: string;
  initialEmail?: string;
  applicationData: ApplicationData;
  onClose: () => void;
  onSave: (updatedData: { name?: string; email?: string; applicationData: ApplicationData }) => void;
}

export default function ApplicationEditModal({ studentId, initialName, initialEmail, applicationData, onClose, onSave }: ApplicationEditModalProps) {
  const { branches } = useSettings();
  const [formData, setFormData] = useState<ApplicationData>(applicationData);
  const [basicInfo, setBasicInfo] = useState({
    name: initialName || applicationData.fullName || '',
    email: initialEmail || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = {
        applicationData: formData,
        name: basicInfo.name,
        email: basicInfo.email
      };
      
      // Also sync fullName in applicationData if it changed
      if (formData.fullName !== basicInfo.name) {
        updates.applicationData.fullName = basicInfo.name;
      }

      await updateDoc(doc(db, 'users', studentId), updates);
      onSave({ 
        name: basicInfo.name, 
        email: basicInfo.email, 
        applicationData: updates.applicationData 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (label: string, name: keyof ApplicationData, type: string = 'text', options?: string[]) => (
    <div>
      <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">{label}</label>
      {options ? (
        <select
          name={name}
          value={(formData[name] as string) || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : name === 'mobileNumber' || name === 'emergencyContact' ? (
        <div className="flex gap-2">
          <select
            name={name === 'mobileNumber' ? 'mobileCountryCode' : 'emergencyCountryCode'}
            value={(formData[name === 'mobileNumber' ? 'mobileCountryCode' : 'emergencyCountryCode'] as string) || '+91'}
            onChange={handleChange}
            className="w-24 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 outline-none transition-all"
          >
            <option value="+91">+91 (IN)</option>
            <option value="+1">+1 (US/CA)</option>
            <option value="+44">+44 (UK)</option>
            <option value="+971">+971 (UAE)</option>
            <option value="+61">+61 (AU)</option>
            <option value="+65">+65 (SG)</option>
            <option value="+60">+60 (MY)</option>
          </select>
          <input
            type={type}
            name={name}
            value={(formData[name] as string) || ''}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={(formData[name] as string) || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
          <div>
            <h3 className="text-xl font-bold">Edit Student Profile</h3>
            <p className="text-pink-100 text-xs mt-1">Modify account and application information</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1">
          <div className="space-y-8">
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-pink-600 uppercase tracking-widest border-b border-pink-100 pb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-600 rounded-full"></span>
                Account Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Display Name</label>
                  <input
                    type="text"
                    name="name"
                    value={basicInfo.name}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 border border-blue-100 bg-blue-50/30 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={basicInfo.email}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 border border-blue-100 bg-blue-50/30 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  />
                  <p className="text-[10px] text-orange-500 mt-1 font-medium">* Changing email will update login credentials.</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                    Personal Details
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {renderField('Contact Number', 'mobileNumber')}
                    {renderField('Emergency Contact', 'emergencyContact')}
                    {renderField('Blood Group', 'bloodGroup', 'text', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])}
                    <div className="grid grid-cols-2 gap-4">
                      {renderField('Date of Birth', 'dob', 'date')}
                      {renderField('Gender', 'gender', 'text', ['Male', 'Female', 'Other'])}
                    </div>
                    {renderField('Place of Birth', 'placeOfBirth')}
                    {renderField('Nationality', 'nationality')}
                    {renderField('Home Address', 'homeAddress')}
                    {renderField('Temporary Address', 'temporaryAddress')}
                  </div>
                </section>
              </div>
              
              <div className="space-y-6">
                <section className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                    Professional & Study
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {renderField('Highest Qualification', 'qualification')}
                    {renderField('University/College', 'university')}
                    {renderField('Graduation Year', 'graduationYear')}
                    {renderField('Current Role', 'currentRole')}
                    {renderField('Company', 'company')}
                    {renderField('Experience (Years)', 'experienceYears')}
                    
                    <div className="pt-4 space-y-4 grayscale-0">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                        Preferences
                      </h4>
                      {renderField('Mode of Study', 'modeOfStudy', 'text', ['physical', 'online'])}
                      {renderField('Study Center (Branch)', 'branch', 'text', branches || [])}
                      <div className="grid grid-cols-2 gap-4">
                        {renderField('Preferred Date', 'preferredDate', 'date')}
                        {renderField('Preferred Time', 'preferredTime', 'time')}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
