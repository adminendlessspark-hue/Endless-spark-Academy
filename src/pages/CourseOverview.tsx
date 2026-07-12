import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle, Clock, Zap, ArrowRight, Video, Briefcase, Users, Layout, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useSettings } from '../hooks/useSettings';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import CompanyLogo from '../components/CompanyLogo';
import { TeamMember } from '../types';
import { getOrdinalSuffix, formatCourseName } from '../utils';

export function CourseMarketingContent() {
  const { marketingSettings, financialSettings, placementSettings } = useSettings();
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'course_modules'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModules(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'course_modules'));
    return () => unsub();
  }, []);

  // Professional fallbacks in case database variables are empty of detailed content
  const fallbackSyllabi = `Our professional curriculum is structured across 5 core technical phases:
• Phase 1: Structural Engineering & Packaging CAD Design
• Phase 2: Production Artworking, Trapping, and Bleed Margins
• Phase 3: Colour Retouching, Calibrations & High-End Image Mastering
• Phase 4: Plate Making, Gravure & Flexography Pre-Press Operations
• Phase 5: High-Performance QC Checklists, Error Detection and Plant Sign-Offs`;

  const fallbackDurationFees = ``;

  const fallbackTestimonials = `The structured curriculum and absolute focus on industry standard workflows gave me the practical knowledge and confidence to handle complex client briefs from day one. I secured multiple job opportunities immediately following completion! — Rahul K., Senior Production Art Specialist`;

  const fallbackInstructorProfiles = `Our programs are coached exclusively by active Prepress Supervisors, Directors of Packaging, and Certified Colour Calibration experts with broad global production exposure.`;

  const fallbackHiringPartners = `Our graduates have been placed at top packaging design agencies, global consumer good companies, and advanced commercial print centers across India, Singapore, and Europe.`;

  const defaultModules = [
    {
      id: "def-mod-1",
      title: "Packaging Materials & Formats Science",
      type: "read",
      category: "packaging-engineer",
      description: "Delve deep into the material sciences, paperboard structures, corrugated boxes, and technical structures that govern printing formats."
    },
    {
      id: "def-mod-2",
      title: "Pre-press Planning & Layout Margins",
      type: "layout",
      category: "production-art-engineer",
      description: "Master dieline creation, bleed allocations, trim sizes, trapping, and press-optimal sheet layout strategies."
    },
    {
      id: "def-mod-3",
      title: "Color Calibration & Image Reprostatics",
      type: "quiz",
      category: "colour-retouching-engineer",
      description: "Understand ICC profiles, color proofing, high-fidelity spot separation, and retouching under standard lighting conditions."
    },
    {
      id: "def-mod-4",
      title: "Industrial Plating & Press Execution",
      type: "video",
      category: "plate-ready-engineer",
      description: "Analyze flexography, offset lithography, gravure setups, and run interactive press-run checklists."
    }
  ];

  const modulesToDisplay = modules;
  const detailedSyllabi = marketingSettings?.courseOverview?.detailedCourseSyllabi || fallbackSyllabi;
  let rawDurationFees = marketingSettings?.courseOverview?.courseDurationFees || fallbackDurationFees;
  
  // Strip out requested tailored options sentence if present
  if (rawDurationFees) {
    rawDurationFees = rawDurationFees
      .replace(/We offer multiple tailored options for aspiring professionals:[\s\S]*?Executive Weekend Masterclasses for Active Practitioners?/gi, '')
      .trim();
  }
  const courseDurationFees = rawDurationFees;

  const studentTestimonials = marketingSettings?.courseOverview?.studentTestimonials || fallbackTestimonials;
  const instructorProfiles = marketingSettings?.courseOverview?.instructorProfiles || fallbackInstructorProfiles;
  const hiringPartners = marketingSettings?.courseOverview?.hiringPartners || fallbackHiringPartners;

  // Let's define default courses details locally to have baseline fallback values for fees and duration
  const defaultCourseModules = [
    { id: 'packaging-engineer', title: 'Diploma in Packaging Engineer', durationMonths: 6, fees: 60000, description: 'Master structural & technical aspects of CAD packaging.' },
    { id: 'production-art-engineer', title: 'Diploma in Production Art Engineer', durationMonths: 6, fees: 50000, description: 'Prepare artwork to press-ready perfection.' },
    { id: 'print-ready-engineer', title: 'Diploma in Print Ready Engineer', durationMonths: 6, fees: 55000, description: 'Establish dynamic color proofs & pre-flight setups.' },
    { id: 'plate-ready-engineer', title: 'Diploma in Plate Ready Engineer', durationMonths: 6, fees: 52000, description: 'Pre-press operations and industrial plate laser calibration.' },
    { id: 'colour-retouching-engineer', title: 'Diploma in Colour Retouching Engineer', durationMonths: 6, fees: 58000, description: 'Advanced global color separation & tonal image correction.' },
    { id: 'quality-control-engineer', title: 'Diploma in Quality Control Engineer', durationMonths: 6, fees: 48000, description: 'Conduct structural measurement metrics & quality checks.' },
    { id: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses', durationMonths: 12, fees: 95000, description: 'Pre-press, production artwork, plate making cross-disciplinary curriculum.' }
  ];

  // Group modulesToDisplay by category
  const modulesByCategory: { [key: string]: any[] } = {};
  modulesToDisplay.forEach((mod: any) => {
    const cat = mod.category || 'production-art-engineer';
    if (!modulesByCategory[cat]) {
      modulesByCategory[cat] = [];
    }
    modulesByCategory[cat].push(mod);
  });

  // Build the list of active courses mapping details from config
  const coursesList = (financialSettings?.coursesConfig && Array.isArray(financialSettings.coursesConfig) && financialSettings.coursesConfig.length > 0)
    ? financialSettings.coursesConfig.map((c: any) => {
        const id = c.courseId || '';
        const defaultMatch = defaultCourseModules.find(d => d.id === id);
        return {
          id,
          title: c.title || defaultMatch?.title || id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          durationMonths: c.durationMonths || defaultMatch?.durationMonths || 6,
          fees: c.fees || defaultMatch?.fees || 50000,
          description: c.description || defaultMatch?.description || ''
        };
      })
    : defaultCourseModules;

  // Filter out courses where modules are NOT available
  const coursesWithModules = coursesList.filter(course => {
    const catModules = modulesByCategory[course.id] || [];
    return catModules.length > 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="detailed-syllabus">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center tracking-tight">Detailed Syllabi & Course Fees</h2>
      <p className="text-gray-500 text-center mb-10 max-w-2xl mx-auto">
        Explore our intensive industry engineering courses, standard durations, transparent fee structures, and curriculum details in one integrated view.
      </p>

      {/* Main Courses list container */}
      <div className="space-y-10">
        {coursesWithModules.length > 0 ? (
          coursesWithModules.map((course) => {
            const catModules = modulesByCategory[course.id] || [];
            return (
              <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-md transition-shadow">
                {/* Course Header: Logo, Name, Duration & Fees all showing together in the exact same place */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center shrink-0 text-pink-600 border border-pink-100 mt-1">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold font-sans text-gray-900 tracking-tight">
                        {course.title}
                      </h3>
                      {course.description ? (
                        <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">Professional specialization training certificate program.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Duration & Fees badges - highlighted next to the course name */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-bold text-sm shadow-sm">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>Duration: {course.durationMonths} Months</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-100 rounded-xl text-green-700 font-bold text-sm shadow-sm">
                      <span className="text-green-500 font-extrabold text-base">₹</span>
                      <span>Fees: ₹{course.fees?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                  </div>
                </div>

                {/* Syllabus Modules details */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-pink-500 animate-pulse" /> COURSE SYLLABUS & MODULES
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catModules.map((mod) => (
                      <div key={mod.id} className="group p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50/40 transition-all border border-gray-100/50 hover:border-indigo-100/60">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-indigo-600 border border-gray-100">
                            {mod.type === 'video' ? <Video className="w-4 h-4" /> : mod.type === 'quiz' ? <BookOpen className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-950 mb-1 group-hover:text-indigo-950 text-sm">
                              {mod.title}
                            </h5>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{mod.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">No Active Classes Published</h3>
            <p className="text-sm text-gray-500">All modules are currently undergoing calibration update. Contact admin panel for seat admissions.</p>
          </div>
        )}
      </div>

      {/* Auxiliary metadata grid below: Testimonials, Instructor Profiles, and Placement records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Student Testimonials */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-500" /> Student Testimonials
            </h3>
            <div className="text-sm text-gray-600 italic border-l-4 border-green-500 pl-4 py-1 leading-relaxed">
              "{studentTestimonials}"
            </div>
          </div>
        </div>

        {/* Instructor Profiles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" /> Instructor Profiles
          </h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">
            {instructorProfiles}
          </p>
        </div>

        {/* Student Placed Companies */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-6 h-6 text-indigo-600" />
                Corporate Placements & Hiring Partners
              </h3>
              <p className="text-xs text-gray-500 mt-1">Real-time recruitment statistics and partner placement drives</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
              Direct Corporate Pipeline
            </span>
          </div>

          {(!placementSettings || !placementSettings.yearlyRecords || placementSettings.yearlyRecords.length === 0) ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center max-w-4xl mx-auto space-y-4">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h5 className="font-bold text-slate-800 text-sm">No custom corporate records uploaded yet</h5>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Showing default alumni hiring partners:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="p-4 bg-white border border-slate-150 rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Endless Spark Print Systems</div>
                    <div className="text-slate-500 text-[10px]">12 Students Placed successfully (2024-2025)</div>
                  </div>
                  <span className="font-bold text-indigo-600 text-xs">₹ 4,50,000 max</span>
                </div>
                <div className="p-4 bg-white border border-slate-150 rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Spectrum Flexo Graphics</div>
                    <div className="text-slate-500 text-[10px]">8 Students Placed successfully (2023-2024)</div>
                  </div>
                  <span className="font-bold text-indigo-600 text-xs">₹ 3,80,000 max</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {[...placementSettings.yearlyRecords]
                .sort((a, b) => b.year.localeCompare(a.year))
                .map((yr: any) => (
                  <div key={yr.year} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg">
                          Year {yr.year}
                        </span>
                        <h5 className="text-sm font-bold text-slate-800">Campus Recruitment Drive</h5>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Total Placed: <strong className="text-slate-800 font-bold">{yr.records.reduce((acc: number, r: any) => acc + (r.studentsPlaced || 0), 0)} students</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {yr.records.map((rec: any) => (
                        <div key={rec.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-3 transition-all duration-200">
                          <div className="flex items-center gap-3 min-w-0">
                            <CompanyLogo src={rec.logoUrl} name={rec.companyName} className="w-10 h-10 border border-slate-200/80 rounded-lg bg-white shadow-sm" />
                            <div className="min-w-0">
                              <h6 className="font-bold text-slate-800 text-xs truncate" title={rec.companyName}>
                                {rec.companyName}
                              </h6>
                              <p className="text-[10px] text-slate-500">
                                {rec.studentsPlaced} {rec.studentsPlaced === 1 ? 'Student' : 'Students'} Placed
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Highest Package</span>
                            <span className="font-bold text-xs text-indigo-600 font-mono">
                              ₹{rec.highestPackage ? rec.highestPackage.toLocaleString('en-IN') : '0'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {yr.records.length === 0 && (
                        <div className="col-span-full text-center py-4 text-xs text-slate-400 italic">
                          No corporate records registered for this year.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CourseOverview() {
  const { logoUrl, marketingSettings, financialSettings } = useSettings();
  const [hasRequestedInfo, setHasRequestedInfo] = useState(false);
  const [founderVideoUrl, setFounderVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [founderVideoUrlTamil, setFounderVideoUrlTamil] = useState('');
  const [overviewVideoUrl, setOverviewVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [overviewVideoUrlTamil, setOverviewVideoUrlTamil] = useState('');
  const [founderVideoEnabled, setFounderVideoEnabled] = useState<boolean>(true);
  const [overviewVideoEnabled, setOverviewVideoEnabled] = useState<boolean>(true);
  const [founders, setFounders] = useState<TeamMember[]>([]);

  useEffect(() => {
    const unsubAdmin = onSnapshot(doc(db, 'settings', 'admin'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.founderVideoUrl) setFounderVideoUrl(data.founderVideoUrl);
        if (data.founderVideoUrlTamil) setFounderVideoUrlTamil(data.founderVideoUrlTamil);
        if (data.overviewVideoUrl) setOverviewVideoUrl(data.overviewVideoUrl);
        if (data.overviewVideoUrlTamil) setOverviewVideoUrlTamil(data.overviewVideoUrlTamil);
        setFounderVideoEnabled(data.founderVideoEnabled ?? true);
        setOverviewVideoEnabled(data.overviewVideoEnabled ?? true);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/admin'));

    const q = query(collection(db, 'team_members'), orderBy('order', 'asc'));
    const unsubTeam = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
      const founderMembers = docs.filter((m) => m.isFounder);
      setFounders(founderMembers);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'team_members'));

    return () => {
      unsubAdmin();
      unsubTeam();
    };
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+91',
    email: '',
    workExperience: '',
    currentRole: '',
    source: 'Course Overview Form',
    place: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setHasRequestedInfo(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'leads');
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const coursesFromConfig = (financialSettings?.coursesConfig && Array.isArray(financialSettings.coursesConfig)) ? financialSettings.coursesConfig.map((config: any) => {
    const id = config.courseId || '';
    const title = config.title || id.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    let icon = <BookOpen className="w-6 h-6 text-blue-500" />;
    if (id.includes('art')) icon = <Layout className="w-6 h-6 text-pink-500" />;
    else if (id.includes('print-ready')) icon = <CheckCircle className="w-6 h-6 text-green-500" />;
    else if (id.includes('plate')) icon = <Zap className="w-6 h-6 text-orange-500" />;
    else if (id.includes('colour') || id.includes('color')) icon = <Video className="w-6 h-6 text-purple-500" />;
    else if (id.includes('quality') || id.includes('qc')) icon = <Briefcase className="w-6 h-6 text-red-500" />;
    else if (id.includes('packaging')) icon = <Layout className="w-6 h-6 text-indigo-500" />;

    return {
      title: title,
      description: config.description || `Master the principles and practices of ${title}.`,
      icon: icon
    };
  }) : [
    {
      title: 'Production Art Engineer',
      description: 'Learn to prepare creative artwork into production-ready files with precision.',
      icon: <Layout className="w-6 h-6 text-pink-500" />
    },
    {
      title: 'Print Ready Engineer',
      description: 'Become an expert in creating flawless, color-accurate files ready for the press.',
      icon: <CheckCircle className="w-6 h-6 text-green-500" />
    },
    {
      title: 'Plate Ready Engineer',
      description: 'Specialize in prepress operations, layout, and plating technologies.',
      icon: <Zap className="w-6 h-6 text-orange-500" />
    },
    {
      title: 'Colour Retouching Engineer',
      description: 'Master advanced color correction, grading, and image manipulation techniques.',
      icon: <Video className="w-6 h-6 text-purple-500" />
    },
    {
      title: 'Quality Control Engineer',
      description: 'Ensure the highest production standards with comprehensive QA protocols.',
      icon: <Briefcase className="w-6 h-6 text-red-500" />
    },
    {
      title: 'Printing & Packaging Cross Courses',
      description: 'Comprehensive cross-disciplinary training for versatile industry professionals.',
      icon: <BookOpen className="w-6 h-6 text-blue-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-20 mx-auto mb-8 object-contain" />
            )}
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-6">
              Empower Your Career in Printing & Packaging
            </h1>
            <p className="text-xl text-gray-500 mb-10">
              Endless Spark provides industry-leading, hands-on training to turn your creative potential into technical mastery. Our structured programs guarantee you are job-ready from day one.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/register" className="btn-primary flex items-center gap-2 px-8 py-4 text-lg">
                Inquire Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/signup" className="bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-lg shadow-sm transition-colors text-lg">
                Join Platform
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Industry-Aligned Curriculum</h3>
            <p className="text-gray-600">Courses designed by industry veterans to match the current demands of the printing and packaging sectors.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">100% Placement Assistance</h3>
            <p className="text-gray-600">We work closely with top employers to help you secure interviews and land your dream job upon graduation.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-7 h-7 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Flexible Learning</h3>
            <p className="text-gray-600">Access interactive online modules, practical assignments, and virtual classrooms at your own pace.</p>
          </div>
        </div>
      </div>

      {/* Dynamic Founder Message & Training Overview Video Section */}
      {(founderVideoEnabled || overviewVideoEnabled) && (
        <div className="bg-white border-y border-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
                Hear From Our Founder & Program Overview
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Watch these videos to understand our vision and discover how we prepare you for high-paying technical careers.
              </p>
            </div>

            <div className={`grid grid-cols-1 ${founderVideoEnabled && overviewVideoEnabled ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'} gap-8`}>
              {/* Founder Message Video Card */}
              {founderVideoEnabled && (
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Video className="w-5 h-5 text-indigo-600" />
                      Founder's Message
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      A personal message detailing our core mission, educational philosophy, and commitment to student success.
                    </p>
                  </div>
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner border border-gray-100">
                    <SecureVideoPlayer 
                      url={founderVideoUrl} 
                      videoUrls={{
                        "english": founderVideoUrl,
                        "tamil": founderVideoUrlTamil,
                        "English": founderVideoUrl,
                        "Tamil": founderVideoUrlTamil
                      }}
                      title="Founder Message" 
                    />
                  </div>
                </div>
              )}

              {/* Training Overview Video Card */}
              {overviewVideoEnabled && (
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Video className="w-5 h-5 text-indigo-600" />
                      Training Overview
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      A comprehensive overview of our curriculum, interactive pre-press labs, and job placement process.
                    </p>
                  </div>
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner border border-gray-100">
                    <SecureVideoPlayer 
                      url={overviewVideoUrl} 
                      videoUrls={{
                        "english": overviewVideoUrl,
                        "tamil": overviewVideoUrlTamil,
                        "English": overviewVideoUrl,
                        "Tamil": overviewVideoUrlTamil
                      }}
                      title="Training Overview" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Offerings */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Specialized Courses</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the learning path that fits your career goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesFromConfig.map((course, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  {course.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{course.description}</p>
                <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 text-xs">
                  Request detailed syllabus <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Founders Showcase */}
      {founders.length > 0 && (
        <div className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Meet Our Founders</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The leading experts driving technical excellence at Endless Spark.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {founders.map((member) => (
                <div key={member.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all max-w-md w-full flex flex-col sm:flex-row gap-6 items-center">
                  {member.photoUrl ? (
                    <img 
                      src={member.photoUrl} 
                      alt={member.name} 
                      className="w-28 h-28 rounded-2xl object-cover shadow-sm bg-white shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Users className="w-10 h-10 text-indigo-500" />
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                    <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">{member.role}</p>
                    {member.bio && (
                      <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Syllabi Showcase */}
      <div className="bg-gray-50 border-t border-gray-200">
        <CourseMarketingContent />
      </div>

      {/* Inquiry Form */}
      {!hasRequestedInfo ? (
        <div className="bg-white py-16 border-t border-gray-200" id="inquiry-form">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Have Questions? Reach Out Directly</h2>
              <p className="text-gray-600">Submit an inquiry and our admissions team will contact you with fee concessions and schedule options.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City/Place</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="New York"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Software Engineer"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 py-16 border-t border-green-100 text-center">
          <div className="max-w-md mx-auto px-4 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-green-900 mb-1">Inquiry Submitted Successfully!</h3>
            <p className="text-sm text-green-700">Detailed course syllabi are available above. Our counsel team will contact you with further placement options.</p>
          </div>
        </div>
      )}
      
      {/* Call to Action */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Upskill?</h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Take the first step towards a rewarding career in the structural and visual world of printing and packaging.
          </p>
          <Link to="/inquiry" className="inline-block bg-white text-indigo-600 font-bold py-4 px-10 rounded-full hover:bg-gray-50 transition-colors shadow-lg">
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}

// Dummy AlertCircle icon since it's not imported at the top
function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
