import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Award, Check, Clock, CreditCard, CheckCircle2, User, Mail, Phone, ChevronDown, MessageCircle, Sparkles, Calendar, ArrowLeft, LogIn, X, Copy, ExternalLink, Users, Video, CircleCheck, ArrowRight } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import DigitalPaymentGateway from '../components/DigitalPaymentGateway';
import { cn } from '../utils';

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

export default function BookConsultation() {
  const navigate = useNavigate();
  const { logoUrl, loading } = useSettings();
  
  const [scheduledRoomId, setScheduledRoomId] = useState('');
  const [scheduledFacultyName, setScheduledFacultyName] = useState('');
  const [scheduledFacultyEmail, setScheduledFacultyEmail] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [copied, setCopied] = useState(false);
  
  // 1-on-1 Consultation & Demo Slots Booking State
  const [consultantForm, setConsultantForm] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    topic: 'Career Development'
  });
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [showBookingPayment, setShowBookingPayment] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [lastBookingId, setLastBookingId] = useState('');

  const getNext14Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getSlotsForDate = (dateString: string) => {
    if (!dateString) return [];
    const [year, month, dayNum] = dateString.split('-').map(Number);
    // Explicitly use noon to prevent timezone shifts to previous/next day
    const date = new Date(year, month - 1, dayNum, 12, 0, 0);
    const day = date.getDay(); // 0 = Sun, 1 = Mon, ...
    const slots = [];

    // Saturday (6) and Sunday (0): every two hours 9:00 AM to 5:00 PM
    if (day === 6 || day === 0) {
      slots.push("09:00 AM - 11:00 AM");
      slots.push("11:00 AM - 01:00 PM");
      slots.push("01:00 PM - 03:00 PM");
      slots.push("03:00 PM - 05:00 PM");
    }

    // Monday to Friday (1 to 5): Only available 7:30 PM to 8:00 PM
    if (day >= 1 && day <= 5) {
      slots.push("07:30 PM - 08:00 PM");
    }

    return slots;
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) {
      alert("Please select a date.");
      return;
    }
    if (!bookingTime) {
      alert("Please select an available time slot.");
      return;
    }
    setShowBookingPayment(true);
  };

  const handleBookingPaymentSuccess = async (paymentId: string) => {
    setShowBookingPayment(false);
    try {
      const fullPhone = `${consultantForm.countryCode} ${consultantForm.phone}`;
      const roomId = `EndlessSpark-Demo-${Math.random().toString(36).substring(2, 10)}`;
      setScheduledRoomId(roomId);

      const parsedTime = parseDateTime(bookingDate, bookingTime);
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
      
      // Save to consultation_bookings
      const bookingRef = await addDoc(collection(db, 'consultation_bookings'), {
        name: consultantForm.name,
        email: consultantForm.email,
        phone: fullPhone,
        date: bookingDate,
        time: bookingTime,
        topic: consultantForm.topic,
        amountPaid: 500,
        paymentId: paymentId,
        status: 'paid',
        feeReduced: false,
        createdAt: new Date().toISOString()
      });

      // Register student lead
      const studentRef = await addDoc(collection(db, 'users'), {
        name: consultantForm.name,
        username: consultantForm.email.split('@')[0] + '_consultant',
        email: consultantForm.email,
        phone: fullPhone,
        role: 'student',
        isApproved: false,
        registeredForDemo: true,
        status: 'demo_scheduled',
        demoData: {
          preferredDate: bookingDate,
          preferredTime: bookingTime,
          mode: 'online',
          feePaid: 500,
          paymentId: paymentId,
          topic: consultantForm.topic,
          completed: false,
          adjustableFeeReduced: false,
          roomId
        },
        createdAt: new Date().toISOString()
      });

      const studentId = studentRef.id;

      // Automatically schedule a virtual class session (Autopilot)
      await addDoc(collection(db, 'live_sessions'), {
        title: `Demo Class: ${consultantForm.name}`,
        roomId,
        facultyId,
        facultyName,
        students: [{ id: studentId, name: consultantForm.name, email: consultantForm.email }],
        studentIds: [studentId],
        studentId,
        scheduledFor: parsedTime,
        status: 'scheduled',
        type: 'demo',
        createdAt: new Date().toISOString()
      });

      // Auto-capture direct student inquiry and create a new lead in the telecaller database
      try {
        await addDoc(collection(db, 'leads'), {
          name: consultantForm.name,
          phone: fullPhone,
          email: consultantForm.email,
          companyName: '',
          workExperience: 'Fresher',
          currentRole: '',
          source: 'direct', 
          place: '',
          status: 'demo_scheduled',
          nextFollowUpDate: bookingDate,
          studentId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: [
            {
              id: `sys-${Date.now()}-${Math.random().toString(36).substring(2,6)}`,
              date: new Date().toISOString(),
              text: `Autopilot Demo Booking (Paid consultation ₹500, Payment: ${paymentId}) registered and scheduled. Room ID: ${roomId}. Assigned Faculty: ${facultyName}.`,
              authorId: 'system',
              authorName: 'System'
            }
          ]
        });
        console.log('Consultation lead auto-captured under direct category.');
      } catch (leadError) {
        console.error('Error auto-capturing direct lead:', leadError);
      }

      setLastBookingId(bookingRef.id);
      setBookingSuccess(true);
    } catch (err) {
      console.error("Booking write error: ", err);
      alert("Error booking slot. Our staff will coordinate manually.");
    }
  };

  const showLoader = loading && !logoUrl;

  if (showLoader) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-pink-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            {logoUrl && <img src={logoUrl} alt="Endless Spark Logo" className="h-16 md:h-24 object-contain py-2 drop-shadow-md hidden sm:block ml-4" />}
          </div>
          <div className="flex items-center gap-4">
            <a href="https://wa.me/919042821999" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 transition-colors bg-green-50 px-4 py-2 rounded-xl">
              <MessageCircle className="w-4 h-4" />
              +91 90428 21999
            </a>
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-pink-600 transition-colors px-2">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden border-t border-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
              Personalized Career Guidance
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mt-4">
              Consultation
            </h1>
            <p className="text-slate-600 mt-4 text-lg">
              Secure a dedicated slot with our leading educational consultants. Get a personalized walkthrough of the syllabus, live platform features, and a clear career roadmap.
            </p>
          </div>

          {bookingSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto bg-white rounded-[2.5rem] border border-emerald-100 shadow-2xl p-10 relative overflow-hidden"
              id="booking-success-card"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900">Demo Scheduled Successfully!</h3>
                <p className="text-slate-500 mt-2 text-sm">
                  Our autopilot mode has created a dedicated virtual classroom and assigned an educational advisor.
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">Receipt/Booking ID: {lastBookingId}</p>
              </div>

              {/* Live Classroom Widget */}
              {(() => {
                const classroomUrl = `${window.location.origin}/classroom/${scheduledRoomId}`;
                const handleCopy = () => {
                  navigator.clipboard.writeText(classroomUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                };

                const studentWaMsg = `Hello ${consultantForm.name}! 🌟\n\nYour online Demo Class at Endless Spark is successfully scheduled!\n\n📅 Date/Time: ${scheduledDateTime}\n💻 Join Your Live Virtual Classroom directly:\n${classroomUrl}\n\n(No downloads or signups required. Just open on Google Chrome / Apple Safari to begin!).`;
                
                const adminWaMsg = `Hi Admin! 🚀\n\nNew Demo booked under Autopilot Mode!\n\nStudent: ${consultantForm.name}\nPhone: ${consultantForm.countryCode} ${consultantForm.phone}\nEmail: ${consultantForm.email}\n📅 Date/Time: ${scheduledDateTime}\n💻 Access Live Classroom: ${classroomUrl}\nFaculty Assigned: ${scheduledFacultyName}`;
                
                const facultyWaMsg = `Hello ${scheduledFacultyName}! 🎓\n\nYou have been auto-assigned to guide a Demo Class:\n\nStudent: ${consultantForm.name}\n📅 Date/Time: ${scheduledDateTime}\n💻 Start Virtual Classroom:\n${classroomUrl}\n\nThank you!`;

                const mailSubject = encodeURIComponent(`Demo Class Scheduled: ${consultantForm.name} - ${scheduledDateTime}`);
                const mailBody = encodeURIComponent(`Hello,

A new online Demo Class has been successfully scheduled via Autopilot Mode:

Student Name: ${consultantForm.name}
Contact Email: ${consultantForm.email}
Contact Phone: ${consultantForm.countryCode} ${consultantForm.phone}

Assigned Faculty: ${scheduledFacultyName}
Scheduled Date & Time: ${scheduledDateTime}

💻 Live Virtual Classroom Link (Zero Install, direct joining):
${classroomUrl}

Best regards,
Endless Spark School of Printing and Packaging Admissions Team`);

                const adminEmail = "adminendlessspark@gmail.com";
                const toEmails = [consultantForm.email, adminEmail, scheduledFacultyEmail].filter(Boolean).join(',');

                return (
                  <>
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
                    <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50 mb-8 text-left" id="sharing-autopilot-actions">
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
                  </>
                );
              })()}

              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-5 mb-8 text-left flex gap-4 items-start">
                <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-pink-900">Adjustable Fee Advantage Activated</h4>
                  <p className="text-xs text-pink-700 leading-relaxed mt-1">
                    Your ₹500 booking fee has been fully credited. When you register for admission, this ₹500 will be automatically deducted from your final tuition fees!
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setBookingSuccess(false);
                    setBookingDate('');
                    setBookingTime('');
                    setConsultantForm({ name: '', email: '', phone: '', countryCode: '+91', topic: 'Student Dashboard & AI Features' });
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-bold transition-all"
                >
                  Book Another Slot
                </button>
                <Link
                  to="/login"
                  className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-850 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  Go to Login Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Side: Copy & Features */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900" id="highlights-header">Consultation Highlights</h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 font-bold" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-800">1-on-1 Career Roadmap</h4>
                        <p className="text-sm text-slate-500 mt-1">Get precise guidance suited for your skill level, background, and visual aspirations.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 font-bold" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-800">Interactive Platform Walkthrough</h4>
                        <p className="text-sm text-slate-500 mt-1">Look around the student portal, modules, assignment sheets, and video library.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 font-bold" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-800">100% Fully Adjustable Fee</h4>
                        <p className="text-sm text-slate-500 mt-1">The ₹500 slot booking fee secures your slot and is deducted from course fees when you join.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-xl" id="fee-notice-box">
                  <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
                    <Award className="w-48 h-48 animate-pulse" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Why is there a booking fee?</h4>
                  <p className="text-indigo-200 text-sm leading-relaxed">
                    Our educational advisors give high-value, dedicated, custom 1-on-1 time to each slot. The fully refundable/deductible ₹500 fee helps filter genuine learners and ensures zero waiting lists!
                  </p>
                </div>
              </div>

              {/* Right Side: Stepper Slot Picker / Form */}
              <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8" id="booking-form-card">
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Step 1: Student Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-mono">1</span>
                      Your Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            required
                            placeholder="Full name"
                            value={consultantForm.name}
                            onChange={(e) => setConsultantForm({ ...consultantForm, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm animate-none"
                            id="consultant-name-input"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email ID</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="email"
                            required
                            placeholder="your@email.com"
                            value={consultantForm.email}
                            onChange={(e) => setConsultantForm({ ...consultantForm, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm animate-none"
                            id="consultant-email-input"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Number</label>
                        <div className="flex gap-2">
                          <select
                            value={consultantForm.countryCode}
                            onChange={(e) => setConsultantForm({ ...consultantForm, countryCode: e.target.value })}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-indigo-500 focus:ring-indigo-500 py-3"
                            id="consultant-country-select"
                          >
                            <option value="+91">+91 (IN)</option>
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+971">+971 (UAE)</option>
                          </select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                              type="tel"
                              required
                              placeholder="Phone number"
                              value={consultantForm.phone}
                              onChange={(e) => setConsultantForm({ ...consultantForm, phone: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm animate-none"
                              id="consultant-phone-input"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Focus Program</label>
                        <div className="relative">
                          <select
                            value={consultantForm.topic}
                            onChange={(e) => setConsultantForm({ ...consultantForm, topic: e.target.value })}
                            className="w-full pl-4 pr-10 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm appearance-none"
                            id="consultant-topic-select"
                          >
                            <option value="Career Development">Career Development</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Choose Date */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-mono">2</span>
                      Select Date (Mon-Sun availability)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {getNext14Days().map((dayDate) => {
                        const year = dayDate.getFullYear();
                        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
                        const dayVal = String(dayDate.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${dayVal}`;
                        const isSelected = bookingDate === dateStr;
                        const dayOfWeek = dayDate.toLocaleDateString(undefined, { weekday: 'short' });
                        const dayOfMonth = dayDate.getDate();
                        const monthName = dayDate.toLocaleDateString(undefined, { month: 'short' });

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              setBookingDate(dateStr);
                              setBookingTime(''); // reset slot when day changes
                            }}
                            className={cn(
                              "p-3 rounded-2xl border text-center transition-all flex flex-col justify-center items-center gap-1 cursor-pointer",
                              isSelected 
                                ? "border-slate-900 bg-slate-950 text-white shadow-md shadow-slate-900/10 scale-102" 
                                : "border-slate-200 hover:border-slate-400 text-slate-700 bg-slate-50/40"
                            )}
                            id={`date-btn-${dateStr}`}
                          >
                            <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-pink-400" : "text-slate-400")}>{dayOfWeek}</span>
                            <span className="text-lg font-extrabold">{dayOfMonth}</span>
                            <span className="text-[10px] font-semibold">{monthName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Choose Time Slot */}
                  {bookingDate && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-mono">3</span>
                        Select Available Slot
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {getSlotsForDate(bookingDate).map((slot) => {
                          const isSelected = bookingTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingTime(slot)}
                              className={cn(
                                "py-3 px-4 rounded-xl border text-left transition-all flex items-center justify-between text-sm font-semibold cursor-pointer",
                                isSelected 
                                  ? "border-slate-900 bg-slate-950 text-white shadow-md" 
                                  : "border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/30"
                              )}
                              id={`slot-btn-${slot.replace(/\s+/g, '-')}`}
                            >
                              <span className="flex items-center gap-2">
                                <Clock className={cn("w-4 h-4", isSelected ? "text-pink-400" : "text-indigo-500")} />
                                {slot}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400 font-bold shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pricing Notice & Submit */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">Slot Fee</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-extrabold text-slate-900">₹500</span>
                        <span className="text-xs text-slate-500 font-medium">(100% adjustable from course fees)</span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-4 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 hover:scale-102 transition-all shadow-lg shadow-pink-200 text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                      id="secure-slot-btn"
                    >
                      <CreditCard className="w-4 h-4" /> Secure Slot & Pay ₹500
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Digital Payment Gateway Modal */}
      {showBookingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden" id="booking-payment-modal">
            <button 
              onClick={() => setShowBookingPayment(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors z-10"
              id="close-booking-payment-btn"
            >
              <X className="w-6 h-6" />
            </button>
            <DigitalPaymentGateway
              amount={500}
              description={`1-on-1 Consultation: ${consultantForm.topic} with Student ${consultantForm.name}`}
              studentName={consultantForm.name}
              studentEmail={consultantForm.email}
              onSuccess={handleBookingPaymentSuccess}
              onCancel={() => setShowBookingPayment(false)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-400 relative overflow-hidden pt-12 pb-10 border-t border-slate-850 mt-auto">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Endless Spark School of Printing and Packaging. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
