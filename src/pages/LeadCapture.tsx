import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CheckCircle, BookOpen, GraduationCap, Briefcase, PlayCircle } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { CourseMarketingContent } from './CourseOverview';

export default function LeadCapture() {
  const { logoUrl } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+91',
    email: '',
    workExperience: '',
    currentRole: '',
    source: 'WhatsApp Campaign',
    place: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fullPhone = `${formData.countryCode} ${formData.phone}`;
      const newLeadData = {
        name: formData.name,
        phone: fullPhone,
        email: formData.email,
        workExperience: formData.workExperience,
        currentRole: formData.currentRole,
        companyName: '',
        source: formData.source,
        place: formData.place,
        status: 'new',
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'leads'), newLeadData);
      setIsSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'leads');
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-4xl text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted Successfully!</h2>
          <p className="text-gray-600 text-lg">
            Thanks for your interest. Our admissions team will reach out to you shortly. In the meantime, explore our detailed course information below.
          </p>
        </div>
        
        <div className="w-full max-w-7xl mx-auto">
          <CourseMarketingContent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row shadow-2xl rounded-2xl overflow-hidden bg-white">
        
        {/* Left column / Hero */}
        <div className="w-full md:w-5/12 bg-indigo-600 text-white p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500 opacity-50 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-500 opacity-50 blur-3xl" />
          
          <div className="relative z-10">
            {logoUrl && (
              <div className="mb-8 bg-white p-3 rounded-2xl shadow-lg w-fit">
                <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
              </div>
            )}
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Start Your Journey Today</h2>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              Transform your career with our industry-leading courses. Learn from experts, build real projects, and land your dream job.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center mr-4">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Interactive Learning</h4>
                  <p className="text-indigo-200 text-sm">Hands-on practical sessions</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center mr-4">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Placement Assistance</h4>
                  <p className="text-indigo-200 text-sm">100% career support</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center mr-4">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Expert Mentors</h4>
                  <p className="text-indigo-200 text-sm">Learn from industry pros</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column / Form */}
        <div className="w-full md:w-7/12 p-10 bg-white">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Request Information</h3>
            <p className="text-gray-500 mt-2">Fill out the form below and we'll get in touch with you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="flex space-x-3">
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+91"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                />
              </div>
              <div className="w-2/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="flex space-x-3">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">City/Place</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Mumbai"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                >
                  <option value="">Select Role</option>
                  <option value="Student">Student</option>
                  <option value="Working Professional">Working Professional</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Unemployed">Looking for job</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Inquiry & Get Callback'}
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">
              Your information is secure. We will only contact you regarding our courses.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
