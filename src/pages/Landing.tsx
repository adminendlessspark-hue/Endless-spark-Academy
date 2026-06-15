import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Shield, FileText, Award, BookOpen, Video, GraduationCap, MessageCircle, PhoneCall, XCircle, Mail, ChevronLeft, ChevronRight, MapPin, Zap } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export default function Landing() {
  const { logoUrl, landingPageTitleImageUrl, branches, banners, landingPageStats, loading } = useSettings();
  const [showEnquireModal, setShowEnquireModal] = useState(false);
  const [enquireForm, setEnquireForm] = useState({ name: '', email: '', phone: '', countryCode: '+91' });
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleEnquireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent("New Enquiry from Landing Page");
    const body = encodeURIComponent(`Name: ${enquireForm.name}\nEmail: ${enquireForm.email}\nContact Number: ${enquireForm.countryCode} ${enquireForm.phone}\n\nI would like to enquire about the courses.`);
    window.location.href = `mailto:adminendlessspark@gmail.com?subject=${subject}&body=${body}`;
    setShowEnquireModal(false);
    setEnquireForm({ name: '', email: '', phone: '', countryCode: '+91' });
  };

  const showLoader = loading && !logoUrl && !landingPageTitleImageUrl;

  if (showLoader) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="Endless Spark Logo" className="h-16 md:h-24 object-contain py-2 drop-shadow-md" />}
          </div>
          <div className="flex items-center gap-4">
            <a href="https://wa.me/919042821999" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 transition-colors bg-green-50 px-4 py-2 rounded-xl">
              <MessageCircle className="w-4 h-4" />
              +91 90428 21999
            </a>
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-pink-600 transition-colors px-2">
              Log In
            </Link>
            <Link to="/signup" className="btn-primary py-2.5 px-6 text-sm shadow-xl shadow-pink-200">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative bg-white pt-16 pb-12 md:pt-28 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-50/90 via-white/95 to-white/95 -z-10"></div>
        <div 
          className="absolute inset-0 -z-20 opacity-15 mix-blend-multiply bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1598520106830-8c45c2035460?auto=format&fit=crop&q=80')" }}
        ></div>
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 text-pink-700 font-bold text-sm mb-8 border border-pink-100 shadow-sm"
          >
            <Award className="w-4 h-4" />
            <span>Empowering the Next Generation of Print Professionals</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {landingPageTitleImageUrl ? (
              <div className="flex justify-center mb-8">
                <img src={landingPageTitleImageUrl} alt="School of Printing and Packaging" className="w-full max-w-lg h-auto object-contain transition-all duration-300 hover:scale-[1.02]" />
              </div>
            ) : (
              <h1 className="tracking-tight mb-8 leading-tight">
                <span className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 block transition-all duration-300 hover:scale-[1.02] cursor-default drop-shadow-sm">
                  Endless Spark
                </span>
                <span className="text-sm sm:text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600 mt-2 block tracking-tight">
                  School of Printing and Packaging
                </span>
              </h1>
            )}
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-slate-700 max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
          >
            The official training and certification portal for the next generation of printing and packaging professionals. 
            Manage your admission, access specialized modules, and track your academic journey all in one place.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/signup" className="w-full sm:w-auto bg-[#1a1c25] text-white px-10 py-5 text-lg rounded-[2.5rem] shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 font-bold hover:scale-105 transition-all duration-300 group">
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-transform" />
              Apply Now
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white text-[#1a1c25] px-10 py-5 text-lg rounded-[2.5rem] shadow-xl shadow-slate-100 flex items-center justify-center gap-3 font-bold hover:scale-105 transition-all duration-300 border border-slate-50">
              <LogIn className="w-5 h-5 text-pink-600" />
              Sign In
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="pb-16 bg-white">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow"
            >
              <span className="text-5xl md:text-6xl font-black text-pink-600 mb-3 tracking-tighter">
                {landingPageStats?.modules || '12+'}
              </span>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Industry Modules</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow"
            >
              <span className="text-5xl md:text-6xl font-black text-[#2e3192] mb-3 tracking-tighter">
                {landingPageStats?.students || '500+'}
              </span>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Certified Students</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow"
            >
              <span className="text-5xl md:text-6xl font-black text-pink-600 mb-3 tracking-tighter">
                {landingPageStats?.placement || '100%'}
              </span>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Placement Support</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow"
            >
              <span className="text-5xl md:text-6xl font-black text-[#f7931e] mb-3">
                {landingPageStats?.access || '24/7'}
              </span>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Learning Access</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Banner Carousel */}
      {banners && banners.length > 0 && (
        <section className="bg-white pb-16 pt-8">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden group">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {banners.map((banner) => (
                  <div key={banner.id} className="w-full flex-shrink-0 px-2 sm:px-4">
                    {banner.title ? (
                      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                        <div className="w-full md:w-1/2 h-[250px] md:h-auto relative">
                          <img 
                            src={banner.imageUrl} 
                            alt={banner.title} 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{banner.title}</h2>
                          
                          <div className="flex items-center gap-1 mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className="w-6 h-6 text-[#FF9800]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>

                          <div className="w-full bg-gray-100 rounded-lg h-12 mb-8 flex overflow-hidden relative">
                            <div 
                              className="bg-[#E91E63] h-full flex items-center justify-between px-4 absolute left-0 top-0"
                              style={{ width: `${banner.levelPercentage || 80}%` }}
                            >
                              <span className="text-white font-bold tracking-wider text-sm">{banner.level?.toUpperCase() || 'BASIC'}</span>
                              <span className="text-white font-bold text-sm">{banner.levelPercentage || 80}%</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {banner.overview?.map((point, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-1">
                                  <svg className="w-6 h-6 text-[#FF9800]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xl text-gray-700">{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                        <img 
                          src={banner.imageUrl} 
                          alt="Course Banner" 
                          className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {banners.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
                    className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
                    className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentBanner(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          currentBanner === idx ? 'bg-pink-600' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Purpose & Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Purpose of the Platform</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Our platform is designed to provide a seamless digital experience for students pursuing excellence in the printing and packaging industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Specialized Modules</h3>
              <p className="text-slate-600 leading-relaxed">
                Access industry-leading course content covering Production Art Engineer, Print Ready Engineer processes, and advanced packaging techniques.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Virtual Classes</h3>
              <p className="text-slate-600 leading-relaxed">
                Participate in live virtual sessions and access recorded training overview videos from our expert faculty.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Academic Tracking</h3>
              <p className="text-slate-600 leading-relaxed">
                Monitor your progress with real-time scorecards, attendance tracking, and official certification upon completion.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                New
              </div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Our New Feature</h3>
              <p className="text-slate-600 leading-relaxed">
                Experience our latest tools and resources designed to further enhance your learning journey and career prospects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between gap-12 mb-12">
            <div className="flex flex-col gap-6 w-full md:w-auto">
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <img src={logoUrl} alt="Endless Spark Logo" className="h-14 md:h-16 object-contain" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-auto max-w-sm">
              <h4 className="font-bold text-slate-900 mb-6 text-lg">Contact Us</h4>
              <div className="space-y-4 text-slate-600">
                <p className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                  <span>189, Rathinam Complex 2nd floor, Pollachi Main road (opposite Balaji Hospital) Sundarapuram Coimbatore 641024</span>
                </p>
                <p className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-pink-500 shrink-0" />
                  <a href="mailto:adminendlessspark@gmail.com" className="hover:text-pink-600 transition-colors">adminendlessspark@gmail.com</a>
                </p>
                <p className="flex items-center gap-3">
                  <PhoneCall className="w-5 h-5 text-gray-400 shrink-0" />
                  <a href="tel:+919042821999" className="hover:text-pink-600 transition-colors font-bold">+91 90428 21999</a>
                </p>
                <p className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <a href="https://wa.me/919042821999" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 font-bold transition-colors">+91 90428 21999</a>
                </p>
              </div>
            </div>

            {branches && branches.length > 0 && (
              <div className="w-full md:w-auto max-w-sm">
                <h4 className="font-bold text-slate-900 mb-6 text-lg">Study Centers</h4>
                <ul className="space-y-3 text-slate-700 font-medium">
                  {branches.map((branch, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 shrink-0" />
                      <span>{branch}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="w-full md:w-auto max-w-sm">
              <h4 className="font-bold text-slate-900 mb-6 text-lg">Legal</h4>
              <div className="flex flex-col gap-4 text-slate-600 font-medium">
                <Link to="/privacy" className="hover:text-pink-600 transition-colors flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-400" /> Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-pink-600 transition-colors flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" /> Terms of Service
                </Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Endless Spark. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.a 
        drag
        dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
        whileDrag={{ scale: 1.1 }}
        href="https://wa.me/919042821999" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all z-40 flex items-center justify-center group cursor-move"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-4 bg-white text-gray-900 text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Need help? Chat with us!
        </span>
      </motion.a>

      {/* Floating Enquire Button */}
      <button
        onClick={() => setShowEnquireModal(true)}
        className="fixed top-1/2 right-0 -translate-y-1/2 bg-pink-600 text-white py-2 px-1 rounded-l-lg shadow-2xl hover:bg-pink-700 hover:pr-2 transition-all z-40 flex flex-col items-center justify-center"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <span className="font-bold tracking-widest rotate-180 uppercase text-xs">Enquire</span>
      </button>

      {/* Enquire Modal */}
      {showEnquireModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowEnquireModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Enquire Now</h3>
                <p className="text-sm text-gray-500">We'll get back to you via email.</p>
              </div>
            </div>

            <form onSubmit={handleEnquireSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={enquireForm.name}
                  onChange={(e) => setEnquireForm({ ...enquireForm, name: e.target.value })}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                <input
                  type="email"
                  required
                  value={enquireForm.email}
                  onChange={(e) => setEnquireForm({ ...enquireForm, email: e.target.value })}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <div className="flex gap-2">
                  <select
                    value={enquireForm.countryCode}
                    onChange={(e) => setEnquireForm({ ...enquireForm, countryCode: e.target.value })}
                    className="w-24 rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 bg-gray-50"
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
                    type="tel"
                    required
                    value={enquireForm.phone}
                    onChange={(e) => setEnquireForm({ ...enquireForm, phone: e.target.value })}
                    className="flex-1 rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                >
                  Send Enquiry
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-4">
                Don't have WhatsApp? Fill out this form and we'll email you at adminendlessspark@gmail.com.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
