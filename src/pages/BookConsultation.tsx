import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Award, Check, Clock, CreditCard, CheckCircle2, User, Mail, Phone, ChevronDown, MessageCircle, Sparkles, Calendar, ArrowLeft, LogIn } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import DigitalPaymentGateway from '../components/DigitalPaymentGateway';
import { cn } from '../utils';

export default function BookConsultation() {
  const navigate = useNavigate();
  const { logoUrl, loading } = useSettings();
  
  // 1-on-1 Consultation & Demo Slots Booking State
  const [consultantForm, setConsultantForm] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    topic: 'Student Dashboard & AI Features'
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
      if (d.getDay() !== 0) { // Skip Sundays
        days.push(d);
      }
    }
    return days;
  };

  const getSlotsForDate = (dateString: string) => {
    if (!dateString) return [];
    const [year, month, dayNum] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, dayNum);
    const day = date.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, ...
    const slots = [];

    // Monday (1) or Saturday (6): every two hours 9:00 AM to 4:00 PM
    if (day === 1 || day === 6) {
      slots.push("09:00 AM - 11:00 AM");
      slots.push("11:00 AM - 01:00 PM");
      slots.push("01:00 PM - 03:00 PM");
      slots.push("03:00 PM - 05:00 PM");
    }

    // Monday to Friday (1 to 5): After 7:30 PM to 8:00 PM
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
      await addDoc(collection(db, 'users'), {
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
          adjustableFeeReduced: false
        },
        createdAt: new Date().toISOString()
      });

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
              Book a 1-on-1 Consultation & Demo
            </h1>
            <p className="text-slate-600 mt-4 text-lg">
              Secure a dedicated slot with our leading educational consultants. Get a personalized walkthrough of the syllabus, live platform features, and a clear career roadmap.
            </p>
          </div>

          {bookingSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-emerald-100 shadow-2xl p-10 text-center relative overflow-hidden"
              id="booking-success-card"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Slot Booked Successfully!</h3>
              <p className="text-slate-500 text-sm mb-8 font-mono">Receipt/Booking ID: {lastBookingId}</p>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-4 border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Student Name</span>
                    <span className="text-sm font-bold text-slate-800">{consultantForm.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Contact Phone</span>
                    <span className="text-sm font-bold text-slate-800">{consultantForm.countryCode} {consultantForm.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Date</span>
                    <span className="text-sm font-bold text-indigo-600 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> {(() => {
                        const [year, month, dayNum] = bookingDate.split('-').map(Number);
                        const date = new Date(year, month - 1, dayNum);
                        return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Time Slot</span>
                    <span className="text-sm font-bold text-indigo-600 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {bookingTime}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60">
                  <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Topic</span>
                  <span className="text-sm font-bold text-slate-800">{consultantForm.topic}</span>
                </div>
              </div>

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

              <button
                onClick={() => {
                  setBookingSuccess(false);
                  setBookingDate('');
                  setBookingTime('');
                  setConsultantForm({ name: '', email: '', phone: '', countryCode: '+91', topic: 'Student Dashboard & AI Features' });
                }}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-850 transition-colors shadow-lg"
                id="book-another-slot-btn"
              >
                Book Another Slot
              </button>
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
                            <option value="Student Dashboard & AI Features">Student Dashboard & AI Features (Demo & Overview)</option>
                            <option value="Student Projects Showcase & Review">Student Projects Showcase & Review (Demo & Showcase)</option>
                            <option value="Production Art Engineer">Production Art Engineer (Syllabus & Demo)</option>
                            <option value="Print Ready Engineer">Print Ready Engineer (Syllabus & Demo)</option>
                            <option value="Packaging Design Specialist">Packaging Design Specialist (Syllabus & Demo)</option>
                            <option value="General Career Consultation">General 1-on-1 Career Advice</option>
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
                      Select Date (Mon-Sat availability)
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
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden" id="booking-payment-modal">
            <button 
              onClick={() => setShowBookingPayment(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors z-10"
              id="close-booking-payment-btn"
            >
              <CheckCircle2 className="w-6 h-6" />
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
