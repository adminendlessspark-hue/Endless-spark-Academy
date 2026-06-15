import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CircleCheck, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

type RegistrationFormData = {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  qualification: string;
  experienceYears: string;
  currentRole?: string;
  company?: string;
  workLocation?: string;
  currentCity?: string;
  preferredDate: string;
  preferredTime: string;
  demoMode: 'physical' | 'online';
};

export default function Registration() {
  const { user, updateUser } = useAuth();
  const { logoUrl } = useSettings();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (user?.registeredForDemo) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.registeredForDemo, navigate]);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<RegistrationFormData>({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      countryCode: '+91',
      demoMode: 'online'
    }
  });

  const onSubmit = async (data: RegistrationFormData) => {
    console.log('Registration Data:', data);
    
    const fullPhone = `${data.countryCode} ${data.phone}`;
    
    try {
      await updateUser({ 
        phone: fullPhone,
        registeredForDemo: true,
        demoData: {
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          qualification: data.qualification,
          experienceYears: data.experienceYears,
          currentRole: data.currentRole,
          company: data.company,
          workLocation: data.workLocation,
          currentCity: data.currentCity,
          mode: data.demoMode,
          completed: false
        }
      });

      // Auto-capture direct student inquiry and create a new lead in the telecaller database
      try {
        await addDoc(collection(db, 'leads'), {
          name: data.fullName,
          phone: fullPhone,
          email: data.email,
          companyName: data.company || '',
          workExperience: data.experienceYears || 'Fresher',
          currentRole: data.currentRole || '',
          source: 'direct', // add the category as direct
          place: data.currentCity || '',
          status: 'demo_scheduled',
          nextFollowUpDate: data.preferredDate, // auto capture the date
          studentId: user?.id || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: [
            {
              id: `sys-${Date.now()}-${Math.random().toString(36).substring(2,6)}`,
              date: new Date().toISOString(),
              text: `Auto-captured direct student enquiry. Demo scheduled directly online for ${data.preferredDate} at ${data.preferredTime} (${data.demoMode} mode).`,
              authorId: 'system',
              authorName: 'System'
            }
          ]
        });
        console.log('Lead auto-captured under direct category.');
      } catch (leadError) {
        console.error('Error auto-capturing direct lead:', leadError);
      }

      setIsSubmitted(true);
      // Wait 3 seconds then navigate
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 3000);
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update registration status. Please try again.");
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CircleCheck className="w-10 h-10 text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
        <p className="text-gray-700 font-medium">Your demo class slot has been reserved. Redirecting to dashboard...</p>
        <button
          onClick={() => {
            const data = getValues();
            const fullPhone = `${data.countryCode} ${data.phone}`;
            const message = `New Demo Registration!\nName: ${data.fullName}\nPhone: ${fullPhone}\nMode: ${data.demoMode === 'physical' ? 'Physical' : 'Online'}\nDate: ${data.preferredDate}\nTime: ${data.preferredTime}`;
            window.open(`https://wa.me/919042821999?text=${encodeURIComponent(message)}`, '_blank');
          }}
          className="mt-6 btn-secondary flex items-center justify-center gap-2 mx-auto"
        >
          <MessageCircle className="w-5 h-5 text-green-600" />
          Notify Admin on WhatsApp
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left Column: Videos */}
      <div className="lg:col-span-7 space-y-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
            {logoUrl && (
              <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex-shrink-0">
                <img src={logoUrl} alt="Endless Spark Logo" className="h-20 object-contain" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Your Tech Journey</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Watch this quick message from our founder about what you'll achieve in our program.
          </p>
          
          {/* Founder Video Section */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-lg border border-gray-200 mb-8">
            <iframe 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              className="w-full h-full" 
              title="Message from the Founder"
              allowFullScreen
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Training Overview</h2>
          <p className="text-lg text-gray-600 mb-6">
            Get a comprehensive overview of our curriculum and training methodology.
          </p>

          {/* Training Overview Video Section */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-lg border border-gray-200">
            <iframe 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              className="w-full h-full" 
              title="Training Overview"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="lg:col-span-5">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 sticky top-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Book Your Free Demo</h2>
            <p className="text-gray-500 mt-2">Experience our teaching methodology firsthand. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                {...register('fullName', { required: 'Name is required' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="flex gap-2">
                <select
                  {...register('countryCode')}
                  className="w-24 px-2 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
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
                  {...register('phone', { required: 'Phone number is required' })}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="Phone number"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
              <input
                {...register('qualification', { required: 'Qualification is required' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="e.g., B.Tech, MCA, BSc"
              />
              {errors.qualification && <p className="text-red-500 text-xs mt-1">{errors.qualification.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                <select
                  {...register('experienceYears', { required: 'Experience is required' })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                >
                  <option value="">Select experience</option>
                  <option value="Fresher">Fresher (0 years)</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
                {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                <input
                  {...register('currentRole', { required: 'Current role is required' })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="e.g., Developer"
                />
                {errors.currentRole && <p className="text-red-500 text-xs mt-1">{errors.currentRole.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                {...register('company', { required: 'Company is required' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="e.g., Tech Corp"
              />
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
              <input
                {...register('workLocation', { required: 'Work location is required' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="e.g., New York, NY"
              />
              {errors.workLocation && <p className="text-red-500 text-xs mt-1">{errors.workLocation.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current City/Residence</label>
              <input
                {...register('currentCity', { required: 'Current city is required' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="e.g., Brooklyn, NY"
              />
              {errors.currentCity && <p className="text-red-500 text-xs mt-1">{errors.currentCity.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  {...register('preferredDate', { required: 'Date is required' })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                />
                {errors.preferredDate && <p className="text-red-500 text-xs mt-1">{errors.preferredDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <select
                  {...register('preferredTime', { required: 'Time is required' })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                >
                  <option value="">Select time</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="18:00">06:00 PM</option>
                </select>
                {errors.preferredTime && <p className="text-red-500 text-xs mt-1">{errors.preferredTime.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Demo Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="online"
                    {...register('demoMode', { required: 'Mode is required' })}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="font-medium text-gray-900">Online</span>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="physical"
                    {...register('demoMode', { required: 'Mode is required' })}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="font-medium text-gray-900">Physical</span>
                </label>
              </div>
              {errors.demoMode && <p className="text-red-500 text-xs mt-1">{errors.demoMode.message}</p>}
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-start">
                <input
                  id="registration-acknowledgment"
                  type="checkbox"
                  required
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-1 cursor-pointer"
                />
                <label htmlFor="registration-acknowledgment" className="ml-2 text-sm text-gray-600">
                  I strictly acknowledge the <Link to="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>, <Link to="/terms" className="text-pink-600 hover:underline">Terms & Conditions</Link>, and Course Material Copyright Information without fail.
                </label>
              </div>
              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <span>Confirm Registration</span>
                <CircleCheck className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
