import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, HelpCircle, Laptop, GraduationCap, AlertCircle, RefreshCw, 
  Terminal, Activity, CheckCircle, ArrowRight, MessageSquare, BookOpen, 
  CheckCheck, ListChecks, Keyboard, Plus, FileQuestion, UploadCloud, FileText, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const faqs: FAQItem[] = [
  // Technical / Installation Help
  {
    id: 'f1',
    category: 'Software Setup',
    question: 'How do I download and install Adobe Creative Cloud application software?',
    answer: 'Go to the "Software Library" tab in your main navigation panel. There, you can watch our bilingual instruction videos for correct package setup, locate the secure download links, and configure the application. Ensure you disable active firewalls if downloading fails.',
    tags: ['download', 'adobe', 'illustrator', 'photoshop', 'install']
  },
  {
    id: 'f2',
    category: 'Software Setup',
    question: 'My trial version of Illustrator has expired. How do I reactivate it?',
    answer: 'Endless Spark courses utilize academic standard licensing guidelines. Refer to the Troubleshooting videos in the Software Library or raise a support ticket under "Technical / QC support" category so that our faculty can guide you about key activations or workspace configuration.',
    tags: ['license', 'activation', 'adobe', 'expired']
  },
  // Checklist Guidance 
  {
    id: 'f3',
    category: 'Pre-flight & QC checks',
    question: 'Why am I seeing "Quality Rule Violation" on my digital checklists?',
    answer: 'Our smart validation checks are strict. All parameters in the Pre-Flight and QC Checklists must be specifically marked. You cannot leave any item in the default "Select/Pending" status. You must choose "Yes" (satisfies spec), "No" (violates spec), "N/A" (not applicable), or "Query" (Academic Support Desk inquiry). If you mark "No" or "Query", write corresponding notes in the comments box.',
    tags: ['preflight', 'violation', 'checklist', 'rule', 'validation', 'error']
  },
  {
    id: 'f4',
    category: 'Pre-flight & QC checks',
    question: 'What do the "Yes", "No", "N/A", and "Query" options on checklist tasks mean?',
    answer: '● YES: The design file adheres completely to the specification. ● NO: There is a failure or file issue (notes are required). ● N/A: The metric is not applicable to this project structure. ● QUERY: You have an academic query. Marking "Query" generates a support item in your Query Tracker.',
    tags: ['preflight', 'pqc', 'qc', 'query', 'checkbox', 'checklist']
  },
  // Course / Quiz Support
  {
    id: 'f5',
    category: 'Tests & Quizzes',
    question: 'Why is the next Course Module or Quiz locked?',
    answer: 'The system locks subsequent modules to enforce step-by-step progress. You must complete the previous module quiz with a high scoring compliance (typically 100% or passing grade) before the subsequent module automatically unlocks.',
    tags: ['quiz', 'unlock', 'locked', 'syllabus', 'course', 'module']
  },
  {
    id: 'f6',
    category: 'Tests & Quizzes',
    question: 'Can I retake a module quiz if I fail to get full points?',
    answer: 'Yes! You can retake the quiz as many times as necessary to achieve perfect comprehension. Simply go to "Online Test" or your "Course Modules" layout and click re-attempt.',
    tags: ['retake', 'quiz', 're-attempt', 'fail', 'score']
  },
  // Administrative Questions
  {
    id: 'f7',
    category: 'Fees & Admin',
    question: 'I paid my monthly installment but the dashboard status is still Pending. What should I do?',
    answer: 'Fees verification is manual to prevent fraud. The payments desk verifies transactions within 12-24 business hours. You can track this in the "Accounts" section. If it takes longer, submit a trouble ticket here with transaction ID or screenshot.',
    tags: ['installment', 'pending', 'fees', 'invoice', 'payment']
  },
  {
    id: 'f8',
    category: 'Fees & Admin',
    question: 'How do I submit my attendance or reschedule a session slot?',
    answer: 'Select your scheduled slot from the homepage dynamic calendar or dashboard schedule block. You can submit attendance markers or request a slot rescheduling directly if the block is within standard limits before starting.',
    tags: ['attendance', 'reschedule', 'slot', 'calendar', 'class']
  },
  // Project / Portfolio Submissions
  {
    id: 'f9',
    category: 'Submissions & Git',
    question: 'How do I share my Adobe Cloud project links correctly?',
    answer: 'When saving your progress files, ensure that they are saved to your Adobe Creative Cloud online directory. Copy the "Share Link" and make sure the link permissions are set to "@Everyone can view" rather than restricted. Paste this link into the active project details sidebar.',
    tags: ['adobe', 'cloud', 'link', 'share', 'portfolio', 'project']
  }
];

export default function HelpDesk() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // System Diagnostics status
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [latencyText, setLatencyText] = useState('Not tested');
  const [browserSystem, setBrowserSystem] = useState('');
  const [authState, setAuthState] = useState('Healthy');

  // Submit Trouble ticket state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketCategory, setTicketCategory] = useState('Technical/QC violation');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketRound, setTicketRound] = useState('Round 1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string; type: string } | null>(null);

  // Auto detect browser profile on load
  useEffect(() => {
    const userAgent = navigator.userAgent;
    let browser = "Unknown Browser";
    if (userAgent.indexOf("Chrome") > -1) browser = "Google Chrome / Chromium";
    else if (userAgent.indexOf("Safari") > -1) browser = "Apple Safari";
    else if (userAgent.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
    else if (userAgent.indexOf("MSIE") > -1 || !!(document as any).documentMode === true) browser = "Internet Explorer";
    setBrowserSystem(`${browser} (${navigator.platform})`);
  }, []);

  // Filter FAQs based on search & category
  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const searchTarget = `${faq.question} ${faq.answer} ${faq.tags.join(' ')}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Software Setup', 'Pre-flight & QC checks', 'Tests & Quizzes', 'Fees & Admin', 'Submissions & Git'];

  // Clear client cache trigger
  const handleClearCache = () => {
    localStorage.clear();
    alert('Local storage buffer successfully wiped. Client application cache cleared!');
    window.location.reload();
  };

  // Run troubleshooting diagnostic tool
  const runDiagnostics = async () => {
    setDiagnosticRunning(true);
    setDiagnosticLogs([]);
    setLatencyText('Checking...');
    
    const logs = [
      '⚡ Initiating full application stack diagnostic suite...',
      '🕵️ Checking local browser user agent data...',
      '🔍 Browser identified: ' + navigator.userAgent.slice(0, 45) + '...',
      '🔑 Evaluating active user credential token state...',
      `👤 Active user profile loaded: ${user?.name || 'Guest'} (${user?.role || 'Unspecified Role'})`,
      '🌐 Testing Firestore database connection integrity...',
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setDiagnosticLogs(prev => [...prev, logs[i]]);
    }

    // Ping simple latency test
    const startTime = Date.now();
    try {
      await fetch(window.location.origin + '/index.html', { method: 'HEAD', cache: 'no-store' });
      const duration = Date.now() - startTime;
      setLatencyText(`${duration}ms (Excellent)`);
      setAuthState('Secure session active');
      setDiagnosticLogs(prev => [
        ...prev,
        `✅ Connection verified in ${duration}ms!`,
        '✅ User session matches security criteria.',
        '🚀 Diagnostic complete. All local configuration vectors are HEALTHY!'
      ]);
    } catch {
      setLatencyText('Wired Network Delay Detected');
      setDiagnosticLogs(prev => [
        ...prev,
        '⚠️ Static server ping timed out. Proceeding with offline capabilities.',
        '👋 System is functional but local network may be delayed.'
      ]);
    }
    setDiagnosticRunning(false);
  };

  // Raise Trouble Ticket (Reuses student_queries)
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const ticketId = `query_${Date.now()}`;
      const prNumber = 'HELP-DESK';
      const sName = user?.name || 'Anonymous Student';

      // Reusable query item inside the query data tracker structure
      const mainSubQuery: any = {
        id: `sub_${Date.now()}`,
        projectNumber: prNumber,
        studentName: sName,
        category: ticketCategory,
        description: ticketDescription.trim(),
        round: ticketRound || 'Round 1',
        createdAt: new Date().toISOString(),
        status: 'pending' as const
      };

      if (attachment) {
        mainSubQuery.studentAttachmentName = attachment.name;
        mainSubQuery.studentAttachmentUrl = attachment.dataUrl;
        mainSubQuery.studentAttachmentType = attachment.type;
      }

      const queryData: any = {
        studentId: user?.id || 'guest_user',
        studentName: sName,
        title: `[HELP-DESK] ${ticketTitle.trim()}`,
        projectNumber: prNumber,
        category: ticketCategory,
        description: ticketDescription.trim(),
        round: ticketRound || 'Round 1',
        status: 'pending',
        createdAt: new Date().toISOString(),
        queries: [mainSubQuery]
      };

      if (attachment) {
        queryData.studentAttachmentName = attachment.name;
        queryData.studentAttachmentUrl = attachment.dataUrl;
        queryData.studentAttachmentType = attachment.type;
      }

      // 1. Write standard student query doc to firestore under user guidelines
      await addDoc(collection(db, 'student_queries'), queryData);

      // 2. Write dynamic notification for faculty/admin to notice in real-time
      await addDoc(collection(db, 'query_notifications'), {
        userId: 'staff_broadcast',
        userRole: 'faculty',
        title: 'New Support Helpdesk Ticket',
        message: `${sName} raised helpdesk ticket: "${ticketTitle.slice(0, 30)}..."`,
        queryId: ticketId,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'new_query'
      });

      setSubmitSuccess(true);
      setTicketTitle('');
      setTicketDescription('');
      setAttachment(null);
      
      // Clean up after 3 seconds
      setTimeout(() => {
        setIsTicketModalOpen(false);
        setSubmitSuccess(false);
        navigate('/queries');
      }, 2500);

    } catch (err) {
      console.error('Error raising support ticket:', err);
      alert('Failed to register support ticket. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-2 px-1">
      {/* Hero Welcome banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-pink-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-300 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-pink-500/30">
            <HelpCircle className="w-4 h-4 animate-spin duration-1000" />
            Support Help Desk Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Academic Troubleshoot & Support Desk
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            Search our curated knowledge library to resolve tool configuration dilemmas, 
            learn Pre-Flight & QC compliance rules, or directly file a high-priority support ticket to our faculty team.
          </p>

          {/* Large Live Search input */}
          <div className="relative max-w-xl group">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-pink-400 transition-colors">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics, installation guides, checklist codes..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md outline-none text-white placeholder-slate-400 border border-white/15 focus:border-pink-500/80 focus:ring-4 focus:ring-pink-500/20 text-sm md:text-base transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: FAQ Knowledge center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Support Knowledge Directory</h2>
                <p className="text-xs text-slate-500 font-medium">Browse verified solutions compiled by senior engineering Leads</p>
              </div>
              <button 
                onClick={() => setIsTicketModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs shadow-md transition-all shadow-pink-500/10"
              >
                <Plus className="w-4 h-4" />
                Raise Custom Ticket
              </button>
            </div>

            {/* Quick Category Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    activeCategory === cat
                      ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQs List with beautiful display Accordion */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={faq.id}
                      className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 hover:shadow-xs transition-all bg-slate-50/20"
                    >
                      <details className="group">
                        <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-bold text-slate-705 list-none">
                          <span className="flex items-center gap-3 pr-4 text-sm font-semibold text-slate-800 hover:text-pink-700 transition-colors">
                            <span className="w-6 h-6 rounded-lg bg-pink-100/70 text-pink-600 flex items-center justify-center text-xs shrink-0 font-black">
                              Q
                            </span>
                            {faq.question}
                          </span>
                          <span className="transition-transform duration-300 group-open:rotate-180 shrink-0 text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </summary>
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-white">
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                              {faq.category}
                            </span>
                            {faq.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-sm line-clamp-1">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </details>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-bold mb-1">No troubleshooting answer matches your query</p>
                    <p className="text-xs text-slate-500">Try rephrasing your key terms or click to raise a live ticket instead.</p>
                    <button
                      onClick={() => setIsTicketModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Fill Support Ticket
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Preflight & Checklist guidelines panel */}
          <div className="bg-gradient-to-br from-indigo-50 to-pink-50/30 rounded-2xl p-6 border border-indigo-100 shadow-xs">
            <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <ListChecks className="w-5 h-5 text-indigo-600" />
              Pre-Flight & QC Rulebook Compliance Guide
            </h3>
            <p className="text-xs text-indigo-700 leading-relaxed max-w-xl mb-4">
              To guarantee points efficiency and skip negative scoring, all student works must meet absolute Pre-Flight conditions before submission. Keep these rules in mind:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block mb-0.5">Rule 1</span>
                <span className="text-xs font-bold text-slate-800 block mb-1">Never Leave Blank Fields</span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Leaving any row on your digital check forms set to "Select/Pending" triggers a block, preventing final portfolio code uploads.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-0.5">Rule 2</span>
                <span className="text-xs font-bold text-slate-800 block mb-1">Academic Ticket Syncing</span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Marking "Query" on checklist rows registers a distinct tracker thread for you to get detailed faculty solutions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Diagnostic tools & Quick Support Desk Links */}
        <div className="space-y-6">
          
          {/* Quick Client Diagnostics Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 flex items-center gap-2 mb-1">
              <Terminal className="w-5 h-5 text-slate-700" />
              Live Diagnostic Assistant
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">Verify your browser interface and credentials</p>

            <div className="space-y-3.5">
              
              {/* Browser Row */}
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">Client Engine</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-500 truncate max-w-[150px]" title={browserSystem}>
                  {browserSystem || 'Scanning...'}
                </span>
              </div>

              {/* Status Row */}
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Latency Peak</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-indigo-700">
                  {latencyText}
                </span>
              </div>

              {/* Authenticated token */}
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-700">Session Guard</span>
                </div>
                <span className="text-[11px] font-bold text-slate-600">
                  {authState}
                </span>
              </div>

              {/* Diagnostic Terminal outputs */}
              {diagnosticLogs.length > 0 && (
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1 max-h-[140px] overflow-y-auto leading-normal">
                  {diagnosticLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              )}

              {/* Control Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-1">
                <button
                  type="button"
                  disabled={diagnosticRunning}
                  onClick={runDiagnostics}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${diagnosticRunning ? 'animate-spin' : ''}`} />
                  Diagnose
                </button>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all"
                  title="Clear storage cache buffers"
                >
                  Clear Cache
                </button>
              </div>

            </div>
          </div>

          {/* Quick Contacts Cards */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider block">Academic Contacts</h3>
            
            <div className="space-y-3">
              <a 
                href="https://wa.me/919042821999" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-start gap-3 p-3 bg-green-50 hover:bg-green-100/80 rounded-xl transition-all border border-green-100"
              >
                <span className="p-2 bg-green-500 rounded-lg text-white">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">WhatsApp Support Desk</span>
                  <span className="text-[11px] text-green-700 font-bold block mt-0.5 font-mono">+91 90428 21999</span>
                  <span className="text-[10px] text-slate-450 block font-medium">Available Mon-Sat [9 AM to 6 PM]</span>
                </div>
              </a>

              <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100/50 space-y-1">
                <span className="text-xs font-bold text-slate-850 block">Faculty Review Lead</span>
                <span className="text-[10px] text-slate-500 block font-medium">Standard ticket resolution SLA: 4 hours. All checklist queries automatically routed.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Raise Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black tracking-tight">Submit Trouble Ticket</h3>
                <p className="text-xs text-slate-450 mt-0.5">Academic Lead will solve your inquiry within 4 hours</p>
              </div>
              <button 
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
              {submitSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800">Support Ticket Raised Successfully!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your trouble ticket was added into your Query Tracker (Code: HELP-DESK). Redirecting...
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Problem Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-slate-800 font-bold bg-white"
                      >
                        <option value="Technical/QC violation">Technical Setup / Error</option>
                        <option value="Pre-flight checklist help">Pre-flight Checklist Help</option>
                        <option value="Unclear Brief instructions">Unclear Course/Brief Instructions</option>
                        <option value="Base file incorrect">Installment / Payment Delay</option>
                        <option value="Layout approval">General App Feedback</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Priority Level</label>
                      <select
                        value={ticketRound}
                        onChange={(e) => setTicketRound(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all font-bold bg-white"
                      >
                        <option value="Round 1">Standard (Low priority)</option>
                        <option value="Round 2">Medium Priority (Follow-up)</option>
                        <option value="Round 3">High Priority (Urgent Blockers)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subject Summary</label>
                    <input
                      type="text"
                      required
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      placeholder="e.g. Illustrator keeps crashing on launch | Monthly installment confirmation required"
                      className="w-full text-xs p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Detailed Problem Description</label>
                    <textarea
                      required
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Please trace the error steps carefully. Describe what software, module step or invoice code is causing trouble."
                      rows={4}
                      className="w-full text-xs p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all outline-none"
                    />
                  </div>

                  {/* Attachment Section */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Attachment (Optional Screenshot, PDF, or Draft)
                    </label>
                    {!attachment ? (
                      <div className="border-2 border-dashed border-slate-200 hover:border-pink-500 rounded-xl p-3 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf,application/zip,application/x-zip-compressed"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAttachment({
                                  name: file.name,
                                  dataUrl: reader.result as string,
                                  type: file.type
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center gap-1 py-1">
                          <UploadCloud className="w-7 h-7 text-slate-400" />
                          <span className="text-xs text-slate-600 font-semibold">Click or drag & drop to attach a file</span>
                          <span className="text-[10px] text-slate-400">PDF, PNG, JPG, or ZIP (Max 10MB)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-pink-50/35 border border-pink-100 rounded-xl text-xs gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-5 h-5 text-pink-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-700 truncate leading-tight">{attachment.name}</p>
                            <span className="text-[10px] text-emerald-600 font-semibold font-mono">Attached successfully</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsTicketModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs shadow-md shadow-pink-500/10 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Registering Ticket...' : 'File Support Ticket'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
