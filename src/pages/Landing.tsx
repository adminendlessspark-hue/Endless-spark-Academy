import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, UserPlus, Shield, FileText, Award, BookOpen, Video, 
  GraduationCap, MessageCircle, PhoneCall, Mail, ChevronLeft, 
  ChevronRight, MapPin, Zap, Sparkles, Calendar, Clock, 
  CreditCard, CheckCircle2, User, Phone, Check, ChevronDown, 
  Globe, Rocket, TrendingUp, Megaphone, Target, ArrowRight, Sparkle,
  Instagram, Facebook, Youtube, Linkedin, X
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

const packagingBlogPosts = [
  {
    id: 'eco-smart-packaging',
    title: 'The Future of Eco-Friendly Smart Packaging',
    category: 'Sustainable Design',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
    date: 'July 15, 2026',
    readTime: '5 min read',
    author: 'Dr. Arul Kumar',
    authorRole: 'Head of Packaging Tech',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
    excerpt: 'Exploring biodegradable substrates, water-soluble inks, and active barrier layers that prolong shelf-life without microplastics.',
    content: `
      The packaging industry is undergoing a seismic shift. The convergence of strict environmental regulations and high consumer demand for sustainable products is pushing brands to rethink their packaging architectures. We are moving beyond simple "recyclability" into the era of Eco-Friendly Smart Packaging.

      ### Biodegradable Substrates
      Traditional plastics are being replaced by bio-based polymers derived from agricultural byproducts, seaweed, and fungi mycelium. These materials offer comparable structural integrity and water resistance but decompose naturally in compost environments within weeks.

      ### Water-Soluble and Soy Inks
      Petroleum-based inks release volatile organic compounds (VOCs) and contaminate paper recycling streams. Modern printing operations are shifting to soy-based and water-soluble inks, which provide brilliant high-fidelity colors while maintaining a clean, chemical-free de-inking process during recycling.

      ### Active & Smart Barrier Layers
      Smart packaging isn't just about eco-friendly materials; it's also about performance. Integrated natural antimicrobial agents and oxygen scavengers built directly into the substrate help preserve food freshness. When paired with printed NFC tags and heat-sensitive visual indicators, consumers can verify product quality and source history with a single tap of their phone.

      ### Conclusion
      Integrating eco-friendly smart substrates with modern flexographic and digital printing is no longer a luxury—it's a critical requirement for next-generation packaging engineering.
    `
  },
  {
    id: 'prepress-mastery',
    title: 'Prepress Mastery: Vector File Prep for High-Speed Press',
    category: 'Prepress Engineering',
    categoryColor: 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100',
    date: 'July 08, 2026',
    readTime: '8 min read',
    author: 'Sarah Jenkins',
    authorRole: 'Senior Print Engineer',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    excerpt: 'A comprehensive guide to flawless trapping, bleed allowances, ink-density limits (TAC/TIL), and custom ICC color-profile conversions.',
    content: `
      In high-speed offset and gravure printing, a single error in file preparation can ruin thousands of meters of expensive substrate. Prepress engineering is the crucial shield that ensures what you see on screen matches the final physical printed surface perfectly.

      ### 1. Perfect Trapping and Bleeds
      When printing on high-speed presses, slight mechanical vibrations can cause minute shifts in registration. To prevent unsightly white gaps between adjacent colors, prepress engineers apply trapping—a tiny overlap of lighter colors under darker ones. Additionally, a strict minimum of 3mm (or 1/8 inch) of bleed must extend beyond the trim line to account for minor cutting tolerances.

      ### 2. Understanding Ink Density (TAC/TIL)
      Total Area Coverage (TAC), or Total Ink Limit (TIL), defines the maximum combined percentage of Cyan, Magenta, Yellow, and Black (CMYK) ink in the darkest shadow areas. For high-speed web presses, exceeding a TAC of 300% leads to slow drying, ink smearing, and paper tearing. Proper conversion using standard profiles (like GRACoL or FOGRA) automatically compresses these values safely.

      ### 3. Vectorization and Font Embedding
      To prevent pixelated lines and fuzzy barcodes, all artwork must remain as resolution-independent vector shapes. Text must be fully outlined (converted to paths) or verified as fully embedded. Barcodes should always be constructed with clean black vectors (K:100%) to ensure perfect scanning readability.

      ### Actionable Checklist
      - Convert color space to CMYK or designated spot colors.
      - Apply custom ICC profiles tailored to the specific substrate (coated vs. uncoated).
      - Set black text to "Overprint" to avoid alignment halos.
    `
  },
  {
    id: 'holographic-cold-foil',
    title: 'Elevating Brands with Holographic Cold Foil Tech',
    category: 'Brand Finishing',
    categoryColor: 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
    date: 'June 28, 2026',
    readTime: '6 min read',
    author: 'Rajasekar V',
    authorRole: 'Brand & Finishes Consultant',
    image: 'https://images.unsplash.com/photo-1507208773393-40d9fc670acf?auto=format&fit=crop&q=80&w=600',
    excerpt: 'How digital cold foil inline application elevates packaging luxury, optimizes production costs, and delivers breathtaking metallic textures.',
    content: `
      In a crowded retail environment, products have less than two seconds to capture a customer's eye. Packaging finishes have become the ultimate differentiator, and holographic cold foil is leading the revolution in luxury brand finishing.

      ### What is Cold Foil?
      Unlike traditional hot foil stamping, which requires custom metal dies and separate offline steps, cold foil is applied inline during the standard printing process. An UV-curable adhesive is printed onto the substrate in the exact shape of the metallic design. The foil film is then pressed against the substrate, adhering only to the adhesive, followed by instant UV curing.

      ### Creative Freedom & Gradients
      Because cold foil is printed using high-resolution offset or flexo plates, designers can create extremely fine lines, half-tone gradients, and microscopic textures that are impossible with hot stamping. Overprinting the foil with translucent inks yields an infinite spectrum of custom metallic colors and shimmering effects.

      ### Cost-Effectiveness & Speed
      By running inline at maximum press speeds, cold foil cuts production time by 50% compared to traditional hot stamping methods. It also eliminates the tooling cost of heavy brass dies, making luxury finishes economically viable even for short-run promotional packaging.

      ### Summary
      Holographic cold foil is a game-changer for brand owners, offering an eco-friendly (readily recyclable), affordable, and visually stunning way to stand out on the shelves.
    `
  }
];

export default function Landing() {
  const { logoUrl, landingPageTitleImageUrl, branches, banners, landingPageStats, financialSettings, loading, socialInstagram, socialFacebook, socialYoutube, socialLinkedin } = useSettings();
  const [selectedCourse, setSelectedCourse] = useState<'printing' | 'marketing' | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedBlogPost, setSelectedBlogPost] = useState<typeof packagingBlogPosts[0] | null>(null);

  const defaultCourses = [
    { courseId: 'packaging-engineer', title: 'Diploma in Packaging Engineer' },
    { courseId: 'production-art-engineer', title: 'Diploma in Production Art Engineer' },
    { courseId: 'print-ready-engineer', title: 'Diploma in Print Ready Engineer' },
    { courseId: 'plate-ready-engineer', title: 'Diploma in Plate Ready Engineer' },
    { courseId: 'colour-retouching-engineer', title: 'Diploma in Colour Retouching Engineer' },
    { courseId: 'quality-control-engineer', title: 'Diploma in Quality Control Engineer' },
    { courseId: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses' }
  ];

  const printingCourses = financialSettings?.coursesConfig && financialSettings.coursesConfig.length > 0
    ? financialSettings.coursesConfig
    : defaultCourses;

  // Auto-scroll banner
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const showLoader = loading && !logoUrl && !landingPageTitleImageUrl;

  if (showLoader) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- DIGITAL MARKETING DIGITAL BANNERS DATA ---
  const marketingBanners = [
    {
      id: 'dm-1',
      title: 'Performance Marketing Masterclass',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      level: 'Advanced',
      levelPercentage: 95,
      overview: [
        'Google Ads & Meta Business Manager setup',
        'Custom pixel integrations and target audience modeling',
        'Budget optimization & high-ROI campaign frameworks'
      ]
    },
    {
      id: 'dm-2',
      title: 'SEO & Content Automation with GenAI',
      imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80',
      level: 'Intermediate',
      levelPercentage: 85,
      overview: [
        'Semantics Search Engine Optimization architectures',
        'AI-driven copywriting and content generation pipelines',
        'Technical SEO, core web vitals, and ranking audits'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 transition-all duration-500">
      
      {/* Dynamic Header Badge/Switcher to return to gateway */}
      {selectedCourse && (
        <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs font-bold tracking-wide flex items-center justify-center gap-3">
          <span>Currently Viewing: <span className="text-yellow-400 font-extrabold uppercase">{selectedCourse === 'printing' ? 'Printing & Packaging Technology' : 'Digital Marketing & Growth'}</span> LMS Portal</span>
          <button 
            onClick={() => setSelectedCourse(null)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase rounded-md tracking-wider transition-all"
          >
            ← Switch Course
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Endless Spark Logo" 
                className="h-14 md:h-16 object-contain cursor-pointer hover:scale-105 transition-all duration-300" 
                style={{ imageRendering: '-webkit-optimize-contrast', transform: 'translateZ(0)' } as React.CSSProperties}
                onClick={() => setSelectedCourse(null)} 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <a href="https://wa.me/919042821999" target="_blank" rel="noopener noreferrer" className="hidden lg:flex items-center gap-2 text-xs font-black text-green-600 hover:text-green-700 transition-colors bg-green-50 px-4 py-2 rounded-xl">
              <MessageCircle className="w-4 h-4" />
              +91 90428 21999
            </a>
            {selectedCourse && (
              <button 
                onClick={() => setSelectedCourse(null)}
                className="hidden sm:inline-block text-xs font-extrabold text-slate-500 hover:text-slate-800 transition-all border border-slate-200 px-3.5 py-2 rounded-xl bg-white"
              >
                Change Course
              </button>
            )}
            {selectedCourse === 'printing' && (
              <Link 
                to="/printing-blog" 
                className="text-xs font-extrabold text-pink-600 hover:text-pink-700 transition-all border border-pink-200 px-3.5 py-2 rounded-xl bg-pink-50"
              >
                Printing Blog
              </Link>
            )}
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-pink-600 transition-colors px-2">
              Log In
            </Link>
            <Link to="/signup" className="btn-primary py-2.5 px-6 text-sm shadow-xl shadow-pink-200">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ---------------------------------------------------- */}
      {/* VIEW 1: GATEWAY HUB (COURSE SELECTION VIEW) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence mode="wait">
        {!selectedCourse ? (
          <motion.div
            key="gateway"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="py-12 md:py-24"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              
              {/* Header Info */}
              <div className="max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm mb-6 border border-indigo-100 shadow-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span>Interactive Learning Management System (LMS)</span>
                </div>
                {logoUrl && (
                  <div className="flex justify-center mb-6">
                    <img 
                      src={logoUrl} 
                      alt="Endless Spark Logo" 
                      className="h-28 md:h-36 object-contain transition-all hover:scale-105 duration-300 select-none pointer-events-none" 
                      style={{ imageRendering: '-webkit-optimize-contrast', transform: 'translateZ(0)' } as React.CSSProperties}
                    />
                  </div>
                )}

                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  Welcome to India's premier creative technology education portal. Choose your specialized course academy below to access custom modules, mock exams, training records, and live interactive study sessions.
                </p>
              </div>

              {/* TWO COURSE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
                
                {/* CARD 1: PRINTING & PACKAGING TECHNOLOGY */}
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col text-left relative overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedCourse('printing')}
                >
                  <div className="absolute top-0 right-0 bg-pink-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                    Most Popular
                  </div>
                  
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-2.5 mb-8 group-hover:scale-110 transition-all duration-300 shrink-0 shadow-sm">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                        style={{ imageRendering: '-webkit-optimize-contrast', transform: 'translateZ(0)' } as React.CSSProperties}
                      />
                    ) : (
                      <Award className="w-8 h-8 text-pink-600" />
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-pink-600 transition-colors">
                    Printing & Packaging Technology
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Master professional prepress art engineering, color management systems, offset processes, digital printing ready workflows, and physical brand packaging designs.
                  </p>

                  <div className="space-y-3 mb-8 border-t border-slate-100 pt-6 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar flex-grow">
                    {printingCourses.map((course: any, idx: number) => (
                      <div key={course.courseId || idx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-600 leading-tight">
                        <Check className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                        <span>{course.title}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-4 px-6 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-2xl text-center flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-200 group-hover:gap-4">
                    Enter Academy Portal <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>

                {/* CARD 2: DIGITAL MARKETING */}
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col text-left relative overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedCourse('marketing')}
                >
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                    New Program
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-2.5 mb-8 group-hover:scale-110 transition-all duration-300 shrink-0 shadow-sm">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                        style={{ imageRendering: '-webkit-optimize-contrast', transform: 'translateZ(0)' } as React.CSSProperties}
                      />
                    ) : (
                      <Globe className="w-8 h-8 text-indigo-600" />
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    Digital Marketing & Growth
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Master modern SEO ranking architectures, social media growth, AI-driven content generation pipelines, high-ROI campaign management, and digital brand tracking.
                  </p>

                  <div className="space-y-3.5 mb-8 border-t border-slate-100 pt-6 flex-grow">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                      <Check className="w-4 h-4 text-indigo-600" />
                      <span>SEO & SEM Search Engine Domination</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                      <Check className="w-4 h-4 text-indigo-600" />
                      <span>Social Media & Brand Growth Strategies</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                      <Check className="w-4 h-4 text-indigo-600" />
                      <span>GenAI Copywriting & Workflow Automations</span>
                    </div>
                  </div>

                  <button className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-center flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 group-hover:gap-4">
                    Enter Academy Portal <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>

              </div>

              {/* Shared Quick Stats Overview */}
              <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] max-w-5xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[60px]"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px]"></div>
                
                <h4 className="text-xs font-black tracking-[0.2em] uppercase text-pink-400 mb-6">Our Joint Academic Excellence</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl md:text-4xl font-black text-white mb-1">20+</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expert Mentors</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-black text-white mb-1">1,700+</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trained Alumni</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-black text-white mb-1">100%</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Placement Help</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-black text-white mb-1">24/7</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LMS Access</div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        ) : selectedCourse === 'printing' ? (
          
          // ----------------------------------------------------
          // VIEW 2: ORIGINAL PRINTING & PACKAGING LANDING PAGE
          // ----------------------------------------------------
          <motion.div
            key="printing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 text-pink-700 font-bold text-sm mb-8 border border-pink-100 shadow-sm"
                >
                  <Award className="w-4 h-4 text-pink-600" />
                  <span>School of Printing & Packaging Technology LMS</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  {logoUrl ? (
                    <div className="flex flex-col items-center justify-center mb-8">
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="h-28 md:h-36 object-contain transition-all duration-300 hover:scale-[1.02] cursor-pointer" 
                        style={{ imageRendering: '-webkit-optimize-contrast', transform: 'translateZ(0)' } as React.CSSProperties}
                        onClick={() => setSelectedCourse(null)}
                      />
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-pink-600 mt-8 max-w-4xl text-center leading-tight">
                        PRINTING AND PACKAGING TECHNOLOGY
                      </h1>
                    </div>
                  ) : landingPageTitleImageUrl ? (
                    <div className="flex flex-col items-center justify-center mb-8">
                      <img src={landingPageTitleImageUrl} alt="School of Printing and Packaging" className="w-full max-w-xs md:max-w-sm h-auto object-contain transition-all duration-300 hover:scale-[1.02]" />
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-pink-600 mt-8 max-w-4xl text-center leading-tight">
                        PRINTING AND PACKAGING TECHNOLOGY
                      </h1>
                    </div>
                  ) : (
                    <h1 className="tracking-tight mb-8 leading-tight">
                      <span className="text-sm sm:text-lg md:text-xl font-bold uppercase text-pink-600 mt-2 block tracking-tight text-center">
                        PRINTING AND PACKAGING TECHNOLOGY
                      </span>
                    </h1>
                  )}
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-lg md:text-xl text-slate-700 max-w-3xl mx-auto mb-4 leading-relaxed font-medium"
                >
                  Welcome to our official **Student Learning Management System (LMS)** portal. Here, print and packaging technology students can securely manage their admission, access specialized course modules, join live virtual classes, submit files, and track their certification journey.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap mt-8"
                >
                  <Link to="/book-consultation" className="w-full sm:w-auto bg-pink-600 text-white px-8 py-5 text-lg rounded-[2.5rem] shadow-2xl shadow-pink-200 flex items-center justify-center gap-3 font-bold hover:scale-105 transition-all duration-300 group">
                    <Calendar className="w-5 h-5 text-pink-200 group-hover:scale-125 transition-transform" />
                    Consultation
                  </Link>
                  <Link to="/signup" className="w-full sm:w-auto bg-[#1a1c25] text-white px-8 py-5 text-lg rounded-[2.5rem] shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 font-bold hover:scale-105 transition-all duration-300 group">
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-transform" />
                    Apply Now
                  </Link>
                  <button 
                    onClick={() => setSelectedCourse(null)}
                    className="w-full sm:w-auto bg-white text-[#1a1c25] px-8 py-5 text-lg rounded-[2.5rem] shadow-xl shadow-slate-100 flex items-center justify-center gap-3 font-bold hover:scale-105 transition-all duration-300 border border-slate-100"
                  >
                    ← Back to Hub
                  </button>
                </motion.div>
              </div>
            </header>

            {/* Stats Section */}
            <section className="pb-16 bg-white">
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                    <span className="text-5xl md:text-6xl font-black text-pink-600 mb-3 tracking-tighter">
                      {landingPageStats?.modules || '12+'}
                    </span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Industry Modules</span>
                  </div>
                  
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                    <span className="text-5xl md:text-6xl font-black text-[#2e3192] mb-3 tracking-tighter">
                      {landingPageStats?.students || '500+'}
                    </span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Certified Students</span>
                  </div>
                  
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                    <span className="text-5xl md:text-6xl font-black text-pink-600 mb-3 tracking-tighter">
                      {landingPageStats?.placement || '100%'}
                    </span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Placement Support</span>
                  </div>
                  
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                    <span className="text-5xl md:text-6xl font-black text-[#f7931e] mb-3">
                      {landingPageStats?.access || '24/7'}
                    </span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Learning Access</span>
                  </div>
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
                                  referrerPolicy="no-referrer"
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
                                referrerPolicy="no-referrer"
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
                  <h2 className="text-4xl font-black text-slate-900 mb-6">Purpose of our LMS Platform</h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Our comprehensive Student LMS is designed to provide a seamless digital experience for students pursuing excellence in the printing and packaging industry.
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

            {/* Blog Posts Section */}
            <section className="py-24 bg-white border-t border-slate-100">
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600 bg-pink-50 px-3.5 py-1.5 rounded-full">
                    Technical Publications
                  </span>
                  <h2 className="text-4xl font-black text-slate-900 mt-4 mb-4">Printing & Packaging Insights</h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-semibold">
                    Explore professional articles, guidelines, and breakthroughs curated by our academic instructors and industry veterans.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {packagingBlogPosts.map((post) => (
                    <article 
                      key={post.id} 
                      className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group"
                      onClick={() => setSelectedBlogPost(post)}
                    >
                      <div className="h-52 w-full overflow-hidden relative">
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border ${post.categoryColor} shadow-sm`}>
                          {post.category}
                        </span>
                      </div>
                      
                      <div className="p-8 flex-grow flex flex-col">
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {post.date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readTime}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-extrabold text-slate-900 mb-3 group-hover:text-pink-600 transition-colors leading-snug">
                          {post.title}
                        </h3>
                        
                        <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                          {post.excerpt}
                        </p>
                        
                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                              {post.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{post.author}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{post.authorRole}</p>
                            </div>
                          </div>
                          
                          <span className="text-xs font-extrabold text-pink-600 flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform">
                            <span>Read</span>
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* Blog Post Modal Detail */}
            <AnimatePresence>
              {selectedBlogPost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
                  {/* Backdrop */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedBlogPost(null)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />

                  {/* Modal Container */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
                  >
                    {/* Close Button */}
                    <button 
                      onClick={() => setSelectedBlogPost(null)}
                      className="absolute top-5 right-5 z-25 p-2.5 rounded-full bg-white/95 text-slate-800 hover:text-pink-600 shadow-md transition-colors border border-slate-100 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto flex-grow">
                      {/* Image Header */}
                      <div className="h-64 sm:h-80 w-full relative">
                        <img 
                          src={selectedBlogPost.image} 
                          alt={selectedBlogPost.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                        
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border border-white/20 bg-white/10 backdrop-blur-md text-white mb-3 inline-block`}>
                            {selectedBlogPost.category}
                          </span>
                          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                            {selectedBlogPost.title}
                          </h1>
                        </div>
                      </div>

                      {/* Article Details */}
                      <div className="p-6 sm:p-8 md:p-10">
                        {/* Meta Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 font-extrabold border border-pink-100">
                              {selectedBlogPost.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{selectedBlogPost.author}</p>
                              <p className="text-xs text-slate-500 font-semibold">{selectedBlogPost.authorRole}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {selectedBlogPost.date}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {selectedBlogPost.readTime}
                            </span>
                          </div>
                        </div>

                        {/* Article Text Content */}
                        <div className="text-slate-700 leading-relaxed text-sm sm:text-base space-y-6 font-medium">
                          {selectedBlogPost.content.split('\n\n').map((paragraph, index) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;
                            if (trimmed.startsWith('###')) {
                              return (
                                <h3 key={index} className="text-lg sm:text-xl font-extrabold text-slate-900 pt-4">
                                  {trimmed.replace('###', '').trim()}
                                </h3>
                              );
                            }
                            if (trimmed.startsWith('-')) {
                              return (
                                <ul key={index} className="list-disc pl-6 space-y-2">
                                  {trimmed.split('\n').map((li, liIdx) => (
                                    <li key={liIdx} className="text-slate-700">{li.replace('-', '').trim()}</li>
                                  ))}
                                </ul>
                              );
                            }
                            return (
                              <p key={index} className="text-slate-600">
                                {trimmed}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Footer Close Button */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setSelectedBlogPost(null)}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-pink-600 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
                      >
                        Close Article
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          
          // ----------------------------------------------------
          // VIEW 3: BEAUTIFUL NEW DIGITAL MARKETING LANDING PAGE
          // ----------------------------------------------------
          <motion.div
            key="marketing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hero Section */}
            <header className="relative bg-white pt-16 pb-12 md:pt-28 md:pb-20 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/90 via-white/95 to-white/95 -z-10"></div>
              <div 
                className="absolute inset-0 -z-20 opacity-10 mix-blend-multiply bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80')" }}
              ></div>
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm mb-8 border border-indigo-100 shadow-sm"
                >
                  <Rocket className="w-4 h-4 text-indigo-600" />
                  <span>School of Digital Marketing & Creative Growth</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  {logoUrl ? (
                    <div className="flex flex-col items-center justify-center mb-8">
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="h-28 md:h-36 object-contain transition-all duration-300 hover:scale-[1.02] cursor-pointer" 
                        style={{ imageRendering: '-webkit-optimize-contrast', transform: 'translateZ(0)' } as React.CSSProperties}
                        onClick={() => setSelectedCourse(null)}
                      />
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-indigo-600 mt-8 max-w-4xl text-center leading-tight">
                        DIGITAL MARKETING & BRAND STRATEGY
                      </h1>
                    </div>
                  ) : (
                    <h1 className="tracking-tight mb-8 leading-tight">
                      <span className="text-sm sm:text-lg md:text-xl font-bold uppercase text-indigo-600 mt-2 block tracking-tight">
                        DIGITAL MARKETING & BRAND STRATEGY
                      </span>
                    </h1>
                  )}
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-lg md:text-xl text-slate-700 max-w-3xl mx-auto mb-4 leading-relaxed font-medium"
                >
                  Unleash your creative potential. Master state-of-the-art SEO architecture, high-ROI performance advertising, AI-driven copywriting, and marketing funnel automation designed to scale modern brands.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap mt-8"
                >
                  <Link to="/book-consultation" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-5 text-lg rounded-[2.5rem] shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 font-bold hover:scale-105 transition-all duration-300 group">
                    <Calendar className="w-5 h-5 text-indigo-200 group-hover:scale-125 transition-transform" />
                    Book Free Consultation
                  </Link>
                  <Link to="/signup" className="w-full sm:w-auto bg-[#1a1c25] text-white px-8 py-5 text-lg rounded-[2.5rem] shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 font-bold hover:scale-105 transition-all duration-300 group">
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-transform" />
                    Apply for Digital Marketing
                  </Link>
                  <button 
                    onClick={() => setSelectedCourse(null)}
                    className="w-full sm:w-auto bg-white text-[#1a1c25] px-8 py-5 text-lg rounded-[2.5rem] shadow-xl shadow-slate-100 flex items-center justify-center gap-3 font-bold hover:scale-105 transition-all duration-300 border border-slate-100"
                  >
                    ← Back to Hub
                  </button>
                </motion.div>
              </div>
            </header>

            {/* Stats Section */}
            <section className="pb-16 bg-white">
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                    <span className="text-5xl md:text-6xl font-black text-indigo-600 mb-3 tracking-tighter">
                      15+
                    </span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Creative Modules</span>
                  </div>
                  
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                    <span className="text-5xl md:text-6xl font-black text-[#2e3192] mb-3 tracking-tighter">
                      1,200+
                    </span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Trained Growth Marketers</span>
                  </div>
                  
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                    <span className="text-5xl md:text-6xl font-black text-indigo-600 mb-3 tracking-tighter">
                      100%
                    </span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Placement & Live Project Support</span>
                  </div>
                  
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
                    <span className="text-5xl md:text-6xl font-black text-[#f7931e] mb-3">
                      LIFETIME
                    </span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Community Circle Access</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Carousel Section tailored to Marketing */}
            <section className="bg-white pb-16 pt-8">
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                <h3 className="text-center text-2xl font-black text-slate-900 mb-10 tracking-tight">Digital Marketing Advanced Tracks</h3>
                <div className="relative overflow-hidden group">
                  <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-[250px] md:h-auto relative">
                      <img 
                        src={marketingBanners[currentBanner % 2].imageUrl} 
                        alt="Digital Marketing Campaign" 
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                      <h2 className="text-3xl md:text-4xl font-black text-indigo-950 mb-4">{marketingBanners[currentBanner % 2].title}</h2>
                      
                      <div className="w-full bg-gray-100 rounded-lg h-12 mb-8 flex overflow-hidden relative">
                        <div 
                          className="bg-indigo-600 h-full flex items-center justify-between px-4 absolute left-0 top-0"
                          style={{ width: `${marketingBanners[currentBanner % 2].levelPercentage}%` }}
                        >
                          <span className="text-white font-bold tracking-wider text-sm">{marketingBanners[currentBanner % 2].level.toUpperCase()}</span>
                          <span className="text-white font-bold text-sm">{marketingBanners[currentBanner % 2].levelPercentage}%</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {marketingBanners[currentBanner % 2].overview.map((point, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="mt-1 shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="text-base text-slate-700">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 mt-6">
                    {marketingBanners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentBanner(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          currentBanner === idx ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Digital marketing modules details */}
            <section className="py-24 bg-slate-50">
              <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                  <h2 className="text-4xl font-black text-slate-900 mb-6">Core Learning Domains</h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Designed to transform beginners into highly paid, multi-talented creative directors and growth operators.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <SearchIcon />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">SEO & Search Dominance</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      Master crawling mechanics, keyword silos, internal link architecture, and strategic link-building to capture organic traffic at scale.
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                      <Megaphone className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Social Media & Branding</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      Establish high-impact brand identities. Program engaging social media content calendars and design loops that drive user action and organic shares.
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">AI Copywriting & Funnels</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      Maximize productivity with GenAI integrations. Write high-conversion copy, build high-performing landing pages, and automate target email campaigns.
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Performance Marketing</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      Deploy and optimize high-budget Meta and Google ad campaigns, handle conversion tracking, and construct actionable business metrics dashboards.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* SHARED FOOTER & BRANDING */}
      {/* ---------------------------------------------------- */}
      <footer className="bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-400 relative overflow-hidden pt-20 pb-10 border-t border-slate-850">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2"></div>
        
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-slate-800/80">
            
            {/* Column 1: Brand Intro */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="bg-white p-2.5 rounded-2xl shadow-xl shadow-pink-500/5 border border-slate-200/50 hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => setSelectedCourse(null)}>
                    <img 
                      src={logoUrl} 
                      alt="Endless Spark Logo" 
                      className="h-14 object-contain" 
                      style={{ imageRendering: '-webkit-optimize-contrast', transform: 'translateZ(0)' } as React.CSSProperties}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-pink-500 border border-slate-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-black text-white">Endless Spark Creative Hub</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Multi-Academy LMS Portal</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Igniting careers in printing, packaging technology, and digital marketing with state-of-the-art LMS structures, live virtual labs, and secure professional certifications.
              </p>
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Admissions Open — 2026 Batch</span>
              </div>

              {/* Social Media Links */}
              {(socialInstagram || socialFacebook || socialYoutube || socialLinkedin) && (
                <div className="flex items-center gap-4 pt-2 text-slate-400">
                  {socialInstagram && (
                    <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-800/50 hover:bg-pink-600 hover:text-white transition-all duration-300 border border-slate-700/50" title="Follow us on Instagram">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {socialFacebook && (
                    <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-800/50 hover:bg-blue-600 hover:text-white transition-all duration-300 border border-slate-700/50" title="Follow us on Facebook">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {socialYoutube && (
                    <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-800/50 hover:bg-red-600 hover:text-white transition-all duration-300 border border-slate-700/50" title="Subscribe to our YouTube Channel">
                      <Youtube className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinkedin && (
                    <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-800/50 hover:bg-blue-700 hover:text-white transition-all duration-300 border border-slate-700/50" title="Follow us on LinkedIn">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Academies */}
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Our Academies</h4>
              <ul className="space-y-3.5 text-sm">
                <li className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer" onClick={() => setSelectedCourse('printing')}>
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Printing & Packaging</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer" onClick={() => setSelectedCourse('marketing')}>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Digital Marketing</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span>Interactive LMS Portal</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact details */}
            <div className="lg:col-span-3 space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Contact Info</h4>
              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20 group-hover:bg-pink-500/20 transition-all duration-300">
                    <MapPin className="w-4 h-4 text-pink-400" />
                  </div>
                  <span className="leading-relaxed text-slate-400 group-hover:text-slate-200 transition-colors">
                    189, Rathinam Complex 2nd floor, Pollachi Main road, Sundarapuram, Coimbatore 641024
                  </span>
                </div>
                
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all duration-300">
                    <Mail className="w-4 h-4 text-indigo-400" />
                  </div>
                  <a href="mailto:info@endlesssparkcreativehub.in" className="text-slate-400 hover:text-slate-200 transition-colors truncate">
                    info@endlesssparkcreativehub.in
                  </a>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <a href="https://wa.me/919042821999" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-200 transition-colors font-bold">
                    +91 90428 21999
                  </a>
                </div>
              </div>
            </div>

            {/* Column 4: Branches */}
            <div className="lg:col-span-3 space-y-8">
              {branches && branches.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">Study Centers</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {branches.map((branch, index) => (
                      <span key={index} className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-705 rounded-xl text-xs font-semibold text-slate-300 transition-all duration-300 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Company Policies</h4>
                <div className="flex flex-col gap-3">
                  <Link to="/privacy" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all text-sm flex items-center gap-2 duration-300">
                    <Shield className="w-4 h-4 text-slate-500" /> Privacy Policy
                  </Link>
                  <Link to="/terms" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all text-sm flex items-center gap-2 duration-300">
                    <FileText className="w-4 h-4 text-slate-500" /> Terms of Service
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright Section */}
          <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <p>&copy; {new Date().getFullYear()} Endless Spark. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 transition-colors cursor-pointer">Security Audited</span>
              <span className="hover:text-slate-400 transition-colors cursor-pointer">Education Platform</span>
              <span className="hover:text-slate-400 transition-colors cursor-pointer">V2.5.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/919042821999" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 hover:scale-110 transition-all z-40 flex items-center justify-center group"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-4 bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
          Need help? Chat with us!
        </span>
      </a>
    </div>
  );
}

// Simple custom inline SVG search icon
function SearchIcon() {
  return (
    <svg 
      className="w-7 h-7" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth="2.5"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
      />
    </svg>
  );
}
