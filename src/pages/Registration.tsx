import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CircleCheck, MessageCircle, Copy, Check, ExternalLink, Mail, Phone, ArrowRight, Video, Calendar, Clock, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

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

function parseDateTime(dateStr: string, timeStr: string): string {
  try {
    const cleanTime = timeStr.split('-')[0].trim(); // e.g. "07:30 PM" or "10:00 AM"
    const match = cleanTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day, hours, minutes, 0);
      return d.toISOString();
    }
  } catch (err) {
    console.error("Error parsing date/time:", err);
  }
  return new Date(`${dateStr}T12:00:00Z`).toISOString();
}

export default function Registration() {
  const { user, updateUser } = useAuth();
  const { logoUrl, founderVideoUrl, overviewVideoUrl, founderVideoEnabled, overviewVideoEnabled } = useSettings();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scheduledRoomId, setScheduledRoomId] = useState('');
  const [scheduledFacultyName, setScheduledFacultyName] = useState('');
  const [scheduledFacultyEmail, setScheduledFacultyEmail] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.registeredForDemo) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.registeredForDemo, navigate]);

  const { register, handleSubmit, getValues, watch, formState: { errors } } = useForm<RegistrationFormData>({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      countryCode: '+91',
      demoMode: 'online'
    }
  });

  const watchExperience = watch('experienceYears');
  const isFresher = watchExperience === 'Fresher';

  const onSubmit = async (data: RegistrationFormData) => {
    console.log('Registration Data:', data);
    
    const fullPhone = `${data.countryCode} ${data.phone}`;
    const roomId = `EndlessSpark-Demo-${Math.random().toString(36).substring(2, 10)}`;
    setScheduledRoomId(roomId);

    const parsedTime = parseDateTime(data.preferredDate, data.preferredTime);
    const dateFormatted = new Date(parsedTime).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setScheduledDateTime(dateFormatted);

    // Query for any available faculty member
    let facultyId = 'unassigned';
    let facultyName = 'Pending Assignment (Admin to review)';
    let facultyEmail = '';
    
    try {
      const facultyQuery = query(collection(db, 'users'), where('role', '==', 'faculty'));
      const facultySnapshot = await getDocs(facultyQuery);
      if (!facultySnapshot.empty) {
        const firstFaculty = facultySnapshot.docs[0];
        const facultyData = firstFaculty.data();
        facultyId = firstFaculty.id;
        facultyName = facultyData.name || 'Faculty Member';
        facultyEmail = facultyData.email || '';
      }
    } catch (err) {
      console.error("Error fetching faculty for auto-assign:", err);
    }

    setScheduledFacultyName(facultyName);
    setScheduledFacultyEmail(facultyEmail);
    
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
          completed: false,
          roomId
        }
      });

      // Automatically schedule a virtual class session (Autopilot)
      await addDoc(collection(db, 'live_sessions'), {
        title: `Demo Class: ${data.fullName}`,
        roomId,
        facultyId,
        facultyName,
        students: [{ id: user?.id || '', name: data.fullName, email: data.email || user?.email || '' }],
        studentIds: [user?.id || ''],
        studentId: user?.id || '',
        scheduledFor: parsedTime,
        status: 'scheduled',
        type: 'demo',
        createdAt: new Date().toISOString()
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
              text: `Autopilot direct student inquiry captured. Demo Virtual Classroom auto-scheduled for ${data.preferredDate} at ${data.preferredTime} (Room ID: ${roomId}). Assigned Faculty: ${facultyName}.`,
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
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update registration status. Please try again.");
    }
  };

  if (isSubmitted) {
    const classroomUrl = `${window.location.origin}/classroom/${scheduledRoomId}`;
    
    // Copy link helper
    const handleCopy = () => {
      navigator.clipboard.writeText(classroomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    // Autopilot WhatsApp share texts
    const data = getValues();
    const fullPhone = `${data.countryCode} ${data.phone}`;
    
    const studentWaMsg = `Hello ${data.fullName}! 🌟\n\nYour online Demo Class at Endless Spark is successfully scheduled!\n\n📅 Date/Time: ${scheduledDateTime}\n💻 Join Your Live Virtual Classroom directly:\n${classroomUrl}\n\n(No downloads or signups required. Just open on Google Chrome / Apple Safari to begin!).`;
    
    const adminWaMsg = `Hi Admin! 🚀\n\nNew Demo booked under Autopilot Mode!\n\nStudent: ${data.fullName}\nPhone: ${fullPhone}\nEmail: ${data.email}\n📅 Date/Time: ${scheduledDateTime}\n💻 Access Live Classroom: ${classroomUrl}\nFaculty Assigned: ${scheduledFacultyName}`;
    
    const facultyWaMsg = `Hello ${scheduledFacultyName}! 🎓\n\nYou have been auto-assigned to guide a Demo Class:\n\nStudent: ${data.fullName}\n📅 Date/Time: ${scheduledDateTime}\n💻 Start Virtual Classroom:\n${classroomUrl}\n\nThank you!`;

    // Mailto link for Email invitation
    const mailSubject = encodeURIComponent(`Demo Class Scheduled: ${data.fullName} - ${scheduledDateTime}`);
    const mailBody = encodeURIComponent(`Hello,

A new online Demo Class has been successfully scheduled via Autopilot Mode:

Student Name: ${data.fullName}
Contact Email: ${data.email}
Contact Phone: ${fullPhone}

Assigned Faculty: ${scheduledFacultyName}
Scheduled Date & Time: ${scheduledDateTime}

💻 Live Virtual Classroom Link (Zero Install, direct joining):
${classroomUrl}

Best regards,
Endless Spark School of Printing and Packaging Admissions Team`);

    const adminEmail = "adminendlessspark@gmail.com";
    const toEmails = [data.email, adminEmail, scheduledFacultyEmail].filter(Boolean).join(',');

    return (
      <div className="max-w-3xl mx-auto mt-10 p-8 bg-white border border-slate-150 rounded-3xl shadow-2xl" id="autopilot-success-container">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <CircleCheck className="w-8 h-8 text-pink-600 animate-bounce" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Demo Scheduled Successfully!</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Our autopilot mode has created a dedicated virtual classroom and assigned an educational advisor.
          </p>
        </div>

        {/* Live Classroom Widget */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 mb-8 border border-slate-800 shadow-xl relative overflow-hidden" id="live-classroom-info-box">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Video className="w-32 h-32" />
          </div>
          <span className="px-3 py-1 bg-pink-600/30 text-pink-300 border border-pink-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Autopilot Live Classroom Reserved
          </span>
          <h3 className="text-xl font-bold mt-3 mb-2 flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-400" /> Virtual Classroom Room
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl mb-4">
            A high-definition Jitsi video session has been locked for this slot. All attendees can join instantly with zero application downloads.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl text-xs mb-4">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium block">Date & Time Slot</span>
              <span className="font-bold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-pink-400" /> {scheduledDateTime}</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium block">Assigned Faculty</span>
              <span className="font-bold flex items-center gap-1"><Users className="w-3.5 h-3.5 text-pink-400" /> {scheduledFacultyName}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-black/40 border border-slate-700 p-3 rounded-xl font-mono text-xs text-pink-300 truncate select-all flex items-center justify-between">
              <span className="truncate">{classroomUrl}</span>
              <button 
                onClick={handleCopy}
                className="ml-2 p-1.5 bg-slate-850 hover:bg-slate-750 text-white rounded-lg transition-colors border border-slate-700"
                title="Copy Classroom Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <a 
              href={classroomUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-pink-900/30 shrink-0"
            >
              Direct Join Room <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Autopilot Link Sharing Triggers */}
        <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50 mb-8" id="sharing-autopilot-actions">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-pink-600 rounded-full block"></span>
            Autopilot Communication Kit
          </h4>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            One-click triggers to broadcast this booking and virtual classroom link to Student, Admin, and assigned Faculty over active communication channels.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(studentWaMsg)}`, '_blank')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> Share to Student
            </button>
            <button
              onClick={() => window.open(`https://wa.me/919042821999?text=${encodeURIComponent(adminWaMsg)}`, '_blank')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> Share to Admin
            </button>
            <button
              onClick={() => {
                if (scheduledFacultyName.includes('Pending')) {
                  alert("No specific faculty assigned yet. Booking is shared with Admin for review.");
                } else {
                  window.open(`https://wa.me/?text=${encodeURIComponent(facultyWaMsg)}`, '_blank');
                }
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> Share to Faculty
            </button>
          </div>

          <a
            href={`mailto:${toEmails}?subject=${mailSubject}&body=${mailBody}`}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Mail className="w-4 h-4 text-pink-600" /> Send Email Invitation to All (Student, Admin & Faculty)
          </a>
        </div>

        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-850 transition-colors text-sm flex items-center justify-center gap-2 shadow-lg"
          id="continue-to-dashboard-btn"
        >
          Continue to Student Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const hasVideos = founderVideoEnabled || overviewVideoEnabled;

  return (
    <div className={hasVideos ? "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12" : "max-w-2xl mx-auto"}>
      {hasVideos && (
        /* Left Column: Videos */
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

            {founderVideoEnabled && (
              <>
                <p className="text-lg text-gray-600 mb-6">
                  Watch this quick message from our founder about what you'll achieve in our program.
                </p>
                {/* Founder Video Section */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-lg border border-gray-200 mb-8">
                  <iframe 
                    src={founderVideoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                    className="w-full h-full" 
                    title="Message from the Founder"
                    allowFullScreen
                  />
                </div>
              </>
            )}

            {overviewVideoEnabled && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Training Overview</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Get a comprehensive overview of our curriculum and training methodology.
                </p>
                {/* Training Overview Video Section */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-lg border border-gray-200">
                  <iframe 
                    src={overviewVideoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                    className="w-full h-full" 
                    title="Training Overview"
                    allowFullScreen
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Right Column: Registration Form */}
      <div className={hasVideos ? "lg:col-span-5" : "w-full"}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role{!isFresher && ' *'}</label>
                <input
                  {...register('currentRole', { required: !isFresher ? 'Current role is required' : false })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white disabled:opacity-50"
                  placeholder={isFresher ? "Not applicable (Fresher)" : "e.g., Developer"}
                  disabled={isFresher}
                />
                {!isFresher && errors.currentRole && <p className="text-red-500 text-xs mt-1">{errors.currentRole.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company{!isFresher && ' *'}</label>
              <input
                {...register('company', { required: !isFresher ? 'Company is required' : false })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white disabled:opacity-50"
                placeholder={isFresher ? "Not applicable (Fresher)" : "e.g., Tech Corp"}
                disabled={isFresher}
              />
              {!isFresher && errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Location{!isFresher && ' *'}</label>
              <input
                {...register('workLocation', { required: !isFresher ? 'Work location is required' : false })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white disabled:opacity-50"
                placeholder={isFresher ? "Not applicable (Fresher)" : "e.g., New York, NY"}
                disabled={isFresher}
              />
              {!isFresher && errors.workLocation && <p className="text-red-500 text-xs mt-1">{errors.workLocation.message}</p>}
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
