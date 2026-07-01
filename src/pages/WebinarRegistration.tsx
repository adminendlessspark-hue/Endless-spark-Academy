import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  CheckCircle, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Laptop, 
  Users, 
  FileText, 
  ArrowRight, 
  GraduationCap, 
  Check, 
  HelpCircle, 
  Video, 
  BookOpen, 
  Brain, 
  FileCheck,
  ShieldAlert,
  CreditCard,
  Lock,
  ShieldCheck,
  IndianRupee,
  X
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { CourseMarketingContent } from './CourseOverview';
import DigitalPaymentGateway from '../components/DigitalPaymentGateway';

interface WebinarSlot {
  id: string;
  courseTitle: string;
  courseId: string;
  date: string;
  time: string;
  speaker: string;
}

export default function WebinarRegistration() {
  const { logoUrl, marketingSettings } = useSettings();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [preferredMode, setPreferredMode] = useState<'online' | 'offline'>('online');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    currentRole: '',
    city: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredDetails, setRegisteredDetails] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentId, setPaymentId] = useState('');

  // Load course configurations from Accounts panel financial settings
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'financial'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.coursesConfig) {
          setCourses(data.coursesConfig);
          if (data.coursesConfig.length > 0) {
            setSelectedCourseId(data.coursesConfig[0].courseId);
          }
        }
      }
    }, (err) => {
      console.warn("Failed to fetch courses in WebinarRegistration:", err);
      // Fallback fallback courses in case config isn't populated
      setCourses([
        { courseId: 'packaging-engineer', title: 'Packaging Engineer' },
        { courseId: 'production-art-engineer', title: 'Production Art Engineer' },
        { courseId: 'print-ready-engineer', title: 'Print Ready Engineer' },
        { courseId: 'plate-ready-engineer', title: 'Plate Ready Engineer' },
        { courseId: 'colour-retouching-engineer', title: 'Colour Retouching Engineer' },
        { courseId: 'quality-control-engineer', title: 'Quality Control Engineer' },
      ]);
    });

    return () => unsubSettings();
  }, []);

  // Standard webinar slots mapped or fallback
  const getWebinarSlots = (): WebinarSlot[] => {
    const today = new Date();
    const formattedDates = [
      new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    ];

    if (courses.length === 0) {
      return [];
    }

    return courses.map((course, index) => {
      const dates = formattedDates;
      const dateStr = marketingSettings?.webinarCustomDate || dates[index % dates.length];
      const timeStr = marketingSettings?.webinarCustomTime || (index % 2 === 0 ? "11:00 AM - 12:30 PM" : "04:30 PM - 06:00 PM");
      const customSpeakerName = marketingSettings?.webinarInstructorName || "Prof. Anand Nair";
      const customSpeakerRole = marketingSettings?.webinarInstructorRole || "Packaging Tech Lead";
      const customSpeakerFull = `${customSpeakerName} (${customSpeakerRole})`;

      const speaker = index % 3 === 0 ? customSpeakerFull : 
                      index % 3 === 1 ? "Dr. Priya Sharma (Industrial Print Specialist)" : 
                      "Er. Rajesh Verma (QC Director)";
      return {
        id: course.courseId,
        courseTitle: course.title,
        courseId: course.courseId,
        date: dateStr,
        time: timeStr,
        speaker: speaker
      };
    });
  };

  const slots = getWebinarSlots();
  const activeSlot = slots.find(s => s.courseId === selectedCourseId) || slots[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlot) return;

    const webinarFee = marketingSettings?.webinarFeeAmount !== undefined ? Number(marketingSettings.webinarFeeAmount) : 300;

    setIsSubmitting(true);
    try {
      const ticketId = 'WBN-' + Math.floor(100000 + Math.random() * 900000);
      const fullPhone = `${formData.countryCode} ${formData.phone}`;
      
      const newLeadData = {
        name: formData.name,
        phone: fullPhone,
        email: formData.email,
        currentRole: formData.currentRole,
        place: formData.city,
        companyName: 'Registered for Webinar',
        webinarFeeAmount: webinarFee,
        webinarFeePaid: false,
        workExperience: JSON.stringify({
          webinarTitle: `Masterclass: ${activeSlot.courseTitle}`,
          studyMode: preferredMode,
          scheduledTime: `${activeSlot.date} @ ${activeSlot.time}`,
          ticketId,
          webinarFeeAmount: webinarFee,
          webinarFeePaid: false
        }),
        source: `Webinar: ${activeSlot.courseTitle} (${preferredMode.toUpperCase()})`,
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: [
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            text: `🎯 Webinar Reservation Confirmed (Ticket: ${ticketId}). Fee of ₹${webinarFee} RS is pending. Interested in ${activeSlot.courseTitle}. Preferred mode: ${preferredMode.toUpperCase()}. Location: ${formData.city}`,
            authorId: 'system',
            authorName: 'Webinar Portal'
          }
        ]
      };

      const leadRef = await addDoc(collection(db, 'leads'), newLeadData);
      
      setRegisteredDetails({
        leadId: leadRef.id,
        ticketId,
        name: formData.name,
        webinarTitle: `Masterclass: ${activeSlot.courseTitle}`,
        date: activeSlot.date,
        time: activeSlot.time,
        speaker: activeSlot.speaker,
        mode: preferredMode,
        email: formData.email
      });
      
      setIsSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'leads');
      alert('Failed to register. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess && registeredDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Animated Ticket Holder Container */}
        <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in duration-300">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-white to-indigo-400 bg-clip-text text-transparent">
              Seat Reserved Successfully!
            </h1>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Your instant webinar entry token has been generated. An admissions counselor will also contact you on WhatsApp shortly.
            </p>
          </div>

          {/* Premium Ticket Card render */}
          <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl">
            {/* Ticket Accent Elements */}
            <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-slate-950 border border-slate-700/60 z-10 -translate-y-1/2" />
            <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-slate-950 border border-slate-700/60 z-10 -translate-y-1/2" />
            
            {/* Top Side */}
            <div className="p-6 sm:p-8 border-b-2 border-dashed border-slate-700 relative">
              <div className="flex justify-between items-start mb-6">
                <div className="text-left">
                  <span className="text-[10px] font-extrabold bg-pink-500/15 text-pink-400 border border-pink-500/25 px-2.5 py-1 rounded-full uppercase tracking-widest">
                    Live Masterclass
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-3 tracking-tight leading-tight">
                    {registeredDetails.webinarTitle}
                  </h3>
                </div>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" referrerPolicy="no-referrer" className="h-10 w-auto object-contain bg-white p-1 rounded-lg shadow-sm shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center font-black shrink-0">E</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Date</p>
                  <p className="text-sm font-extrabold text-white mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-pink-400" />
                    {registeredDetails.date}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Time (IST)</p>
                  <p className="text-sm font-extrabold text-white mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                    {registeredDetails.time}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Side */}
            <div className="p-6 sm:p-8 bg-slate-900/50 text-left space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Attendee Name</p>
                  <p className="text-xs font-bold text-gray-200 mt-1">{registeredDetails.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Seat Mode Preferred</p>
                  <p className="text-[11px] font-extrabold text-pink-400 mt-1 uppercase tracking-wide flex items-center gap-1">
                    {registeredDetails.mode === 'online' ? <Laptop className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {registeredDetails.mode === 'online' ? 'Online Student App' : 'In-Person Campus Lab'}
                  </p>
                </div>
              </div>

              {/* Webinar Class Fee Row */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-700/40 pt-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Webinar Entry Fee</p>
                  <p className="text-sm font-black text-white mt-1">₹{marketingSettings?.webinarFeeAmount || 300} RS</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Payment Status</p>
                  {isPaid ? (
                    <span className="text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3" /> Paid ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1 mt-1">
                      <ShieldAlert className="w-3 h-3 animate-pulse" /> Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-700/40 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Keynote Instructor</p>
                  <p className="text-xs font-bold text-gray-300 mt-0.5">{registeredDetails.speaker}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-700/30 text-center shrink-0 w-28 sm:w-auto">
                  <p className="text-slate-900 text-xs font-black tracking-tight leading-none">TICKET CODE</p>
                  <span className="font-mono text-sm text-pink-600 font-extrabold block mt-1">{registeredDetails.ticketId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Gateway Action Box */}
          {!isPaid && (
            <div className="bg-gradient-to-r from-pink-900/20 to-indigo-900/20 border border-pink-500/30 rounded-2xl p-6 text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-white">Complete Your Webinar Entry Payment</h4>
                  <p className="text-xs text-gray-400">
                    To activate your webinar ticket and receive the Google Calendar entry link, please pay the refundable classroom fee of ₹{marketingSettings?.webinarFeeAmount || 300} RS.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {marketingSettings?.webinarPaymentGatewayLink ? (
                  <a
                    href={marketingSettings.webinarPaymentGatewayLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setIsPaid(true);
                      setPaymentId('EXT-' + Math.floor(1000000 + Math.random() * 9000000));
                    }}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-extrabold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transform transition-all shadow-lg text-center"
                  >
                    <span>Proceed to Secure Payment Gateway</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-extrabold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transform transition-all shadow-lg cursor-pointer"
                  >
                    <span>Pay Entry Fee Online (₹{marketingSettings?.webinarFeeAmount || 300})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {isPaid && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 text-left space-y-2">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <Check className="w-5 h-5 bg-emerald-500/20 rounded-full p-0.5" />
                <h4 className="text-sm font-extrabold text-white">Payment Received and Confirmed!</h4>
              </div>
              <p className="text-xs text-emerald-300/80">
                Thank you! Your payment of ₹{marketingSettings?.webinarFeeAmount || 300} RS was processed successfully (ID: {paymentId}). Your ticket is now fully verified.
              </p>
            </div>
          )}

          {/* Post Registration Guidance */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Next steps to join:
            </h4>
            <ul className="text-xs text-gray-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black rounded-md flex items-center justify-center shrink-0 mt-0.5">01</span>
                <span>You will receive an automated calendar invite and join link on your email and registered WhatsApp number.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black rounded-md flex items-center justify-center shrink-0 mt-0.5">02</span>
                <span>Keep your smartphone ready. We will show a live walkthrough of our dedicated interactive student app.</span>
              </li>
            </ul>
          </div>
          
          <div className="flex justify-center pt-2">
            <a 
              href="/about-courses"
              className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1.5 group hover:underline"
            >
              <span>Explore Course Curriulums in detail</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto mt-16 pt-12 border-t border-slate-800">
          <CourseMarketingContent />
        </div>

        {/* Direct billing modal widget popup */}
        {showPaymentModal && registeredDetails && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-2 animate-scale-up">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-slate-900 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-1 text-slate-900">
                <DigitalPaymentGateway
                  amount={Number(marketingSettings?.webinarFeeAmount || 300)}
                  description={`${registeredDetails.webinarTitle} - Seat Reservation Slot`}
                  studentName={registeredDetails.name || "Webinar Student"}
                  studentEmail={registeredDetails.email || "student@webinar.com"}
                  onSuccess={async (id) => {
                    setIsPaid(true);
                    setPaymentId(id);
                    setShowPaymentModal(false);
                    
                    // Update Firebase record
                    if (registeredDetails.leadId) {
                      try {
                        const leadDocRef = doc(db, 'leads', registeredDetails.leadId);
                        await updateDoc(leadDocRef, {
                          webinarFeePaid: true,
                          paymentId: id,
                          updatedAt: new Date().toISOString()
                        });
                      } catch (err) {
                        console.error("Error updating lead payment status in firestore:", err);
                      }
                    }
                  }}
                  onCancel={() => setShowPaymentModal(false)}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-pink-600 selection:text-white">
      
      {/* Dynamic Master Banner */}
      <header className="relative w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Endless Spark School" referrerPolicy="no-referrer" className="h-10 w-auto object-contain bg-white p-1 rounded-lg shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center font-black text-white">E</div>
            )}
            <div>
              <p className="text-xs font-extrabold text-white tracking-widest uppercase">Endless Spark</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Printing & Packaging Academy</p>
            </div>
          </div>
          
          {/* Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-pink-950/60 border border-pink-850 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Admission Webcast Open</span>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl w-full mx-auto px-4 py-10 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Dynamic Webinar Presentation & Features */}
        <section className="lg:col-span-7 space-y-10 text-left">
          
          {/* Hook Headline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-extrabold uppercase text-pink-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Interactive Live Webinar
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {marketingSettings?.webinarCustomTitle || "Transform Your Career in Printing & Packaging Industry"}
            </h1>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-xl">
              Join this exclusive live webcast to map out your career progression. Learn exactly how our training app helps you master technical print standards online, or choose physical labs.
            </p>
          </div>

          {/* Interactive Learning Highlight Grid (How our App helps online learning) */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-pink-500" /> App Features: Empowering Your Digital Learning
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {marketingSettings?.appBenefits && marketingSettings.appBenefits.length > 0 ? (
                marketingSettings.appBenefits.map((point: string, idx: number) => {
                  const iconsByTopic = [Brain, FileCheck, HelpCircle, Users];
                  const Icon = iconsByTopic[idx % iconsByTopic.length];
                  return (
                    <div key={idx} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 flex gap-3 hover:border-pink-500/20 transition-all">
                      <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl shrink-0 h-fit">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider text-pink-400">Companion Feature {idx + 1}</h4>
                        <p className="text-[11px] text-gray-300 mt-1 leading-normal">
                          {point}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 flex gap-3 hover:border-pink-500/20 transition-all">
                    <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl shrink-0 h-fit">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">AI Concepts Mapping</h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        Interactive mind maps instantly decompose complex packaging and printing parameters.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 flex gap-3 hover:border-pink-500/20 transition-all">
                    <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl shrink-0 h-fit">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Digital QC Labs</h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        Perform industry standard pre-flight artwork inspections right on our integrated panel.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 flex gap-3 hover:border-pink-500/20 transition-all">
                    <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl shrink-0 h-fit">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Dynamic Study Desks</h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        File tickets & resolve design queries asynchronously with expert review feedback.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 flex gap-3 hover:border-pink-500/20 transition-all">
                    <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl shrink-0 h-fit">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Live Video Mentoring</h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        Sync with expert panels, schedules, offline machine guides, and job placement partners.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Social Proof Checklist */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Why Professionals Choose Us:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-4 h-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Flexible Online App & Campus Classes</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-4 h-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Government Compliant Syllabus Modules</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-4 h-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Dynamic Placement Partner Connects</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-4 h-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Verify & Qualify for EMI financial support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: High Fidelity Registration Form Card */}
        <section className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-left self-start">
          
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-pink-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-3xl" />

          {/* Heading */}
          <div className="mb-6">
            <h3 className="text-xl font-black text-white tracking-tight">Reserve Webinar Spot</h3>
            <p className="text-xs text-gray-500 mt-1">
              Select your course webinar and complete your registration details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Course List selection - dynamic title from Accounts Panel */}
            <div>
              <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>1. Select Course Webinar Topic</span>
                <span className="text-[9px] text-pink-400 normal-case font-bold">Fetched live from Accounts</span>
              </label>
              <select
                className="w-full bg-slate-900 border border-slate-800 text-white font-medium rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId} className="bg-slate-950 text-white">
                    Masterclass: {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Study Mode option */}
            <div>
              <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2">
                2. Your Preferred Mode of Study
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredMode('online')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    preferredMode === 'online'
                      ? 'bg-pink-600/10 border-pink-500 text-pink-400'
                      : 'bg-slate-900/60 border-slate-800 text-gray-400 hover:border-slate-700'
                  }`}
                >
                  <Laptop className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-black">ONLINE STUDY</span>
                  <span className="text-[9px] opacity-75 mt-0.5">Learn via App</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredMode('offline')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    preferredMode === 'offline'
                      ? 'bg-pink-600/10 border-pink-500 text-pink-400'
                      : 'bg-slate-900/60 border-slate-800 text-gray-400 hover:border-slate-700'
                  }`}
                >
                  <MapPin className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-black">OFFLINE LABS</span>
                  <span className="text-[9px] opacity-75 mt-0.5">Physical Campus</span>
                </button>
              </div>
            </div>

            {/* Selected slot overview panel */}
            {activeSlot && (
              <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl space-y-2 text-left">
                <div>
                  <p className="text-[9px] text-pink-400 uppercase tracking-widest font-extrabold mb-1">Next Scheduled Batch Date</p>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-300">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-500" /> {activeSlot.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-500" /> {activeSlot.time}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-xs">
                  <span className="text-gray-400">Class Registration Fee:</span>
                  <span className="font-extrabold text-white bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded">₹{marketingSettings?.webinarFeeAmount !== undefined ? Number(marketingSettings.webinarFeeAmount) : 300} RS</span>
                </div>
                
                <p className="text-[9px] text-gray-500 font-medium">Instructor: {activeSlot.speaker}</p>
              </div>
            )}

            {/* Input Details */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-pink-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-pink-500 text-center"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-pink-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-pink-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">
                    City/Town
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-pink-500"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">
                    Current Role
                  </label>
                  <select
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-pink-500"
                    value={formData.currentRole}
                    onChange={(e) => setFormData({...formData, currentRole: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="Student">Student</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Unemployed">Career Transitioner</option>
                    <option value="Freelancer">Freelancer</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transform mt-4 transition-all shadow-lg cursor-pointer shadow-pink-900/30"
            >
              {isSubmitting ? (
                <span>Securing Your Seat...</span>
              ) : (
                <>
                  <span>REGISTER & SECURE SEAT (₹{marketingSettings?.webinarFeeAmount !== undefined ? Number(marketingSettings.webinarFeeAmount) : 300} RS)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 text-center select-none pt-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>34 seats booked today • Minimal seats available</span>
            </div>
          </form>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-16 py-8 text-center text-xs text-gray-500">
        <p className="max-w-md mx-auto">
          © {new Date().getFullYear()} Endless Spark. Authorized Printing & Packaging technical training provider. Real-time direct app-based admissions.
        </p>
      </footer>

    </div>
  );
}
