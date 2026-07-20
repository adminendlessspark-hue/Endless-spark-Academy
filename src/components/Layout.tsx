import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, FileText, Video, GraduationCap, BookOpen, LogOut, ShieldCheck, UserCheck, Menu, X, PhoneCall, MessageCircle, DollarSign, FolderKanban, Zap, FileQuestion, UserSquare2, Sparkles, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import ChatBox from './ChatBox';
import StudentAIAgent from './StudentAIAgent';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Tutor', path: '/ai-tutor', icon: Zap },
  { name: 'Online Test', path: '/online-tests', icon: FileQuestion },
  { name: 'Entrance Test', path: '/entrance-test', icon: FileText },
  { name: 'Demo Registration', path: '/register', icon: UserPlus },
  { name: 'Application', path: '/apply', icon: FileText },
  { name: 'Video Intro', path: '/video-intro', icon: Video },
  { name: 'Course Modules', path: '/modules', icon: BookOpen },
  { name: 'Software Library', path: '/software-library', icon: Video },
  { name: 'Morning Routine', path: '/morning-routine', icon: Sparkles },

  { name: 'Master Library', path: '/master-library', icon: FolderKanban, adminOnly: true },
  { name: 'My Projects', path: '/projects', icon: FolderKanban },
  { name: 'Query Tracker', path: '/queries', icon: MessageCircle },
  { name: 'Help Desk', path: '/help-desk', icon: FileQuestion },
  { name: 'Résumé Builder', path: '/resume-builder', icon: UserSquare2 },
  { name: 'Faculty Panel', path: '/faculty', icon: UserCheck, facultyOnly: true },
  { name: 'Sales Panel', path: '/telecaller', icon: PhoneCall, telecallerOnly: true },
  { name: 'Marketing Panel', path: '/marketing', icon: Sparkles, marketingOnly: true },
  { name: 'Accounts Panel', path: '/accounts', icon: DollarSign, accountsOnly: true },
  { name: 'Admin Panel', path: '/admin', icon: ShieldCheck, adminOnly: true },
  { name: 'Toolkit', path: '/adobe-toolkit', icon: Sparkles },
  { name: 'Quality Control', path: '/public-qc', icon: ShieldCheck, adminOnly: true },
  { name: 'Security Guidelines', path: '/security-guidelines', icon: ShieldCheck },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isQC } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logoUrl, wellnessEnabled, socialInstagram, socialFacebook, socialYoutube, socialLinkedin } = useSettings();

  const filteredNavItems = navItems.filter(item => {
    // If it's Morning Routine, show for all students and admins so they can practice wellness whenever they want
    if (item.path === '/morning-routine') {
      return user?.role === 'student' || isAdmin;
    }

    // If it's Entrance Test, allow student access if assigned, evaluated or submitted
    if (item.path === '/entrance-test') {
      if (user?.role === 'student') {
        return user.entranceTestStatus === 'assigned' || user.entranceTestStatus === 'evaluated' || user.entranceTestStatus === 'submitted';
      }
      return false;
    }

    // If it's AI tutor let all roles access it, except unapproved students and those without active coach
    if (item.path === '/ai-tutor') {
      if (user?.role === 'student') {
        if (!user.isApproved) return false;
        if (!user.isCommunicationCoachActive) return false;
      }
      return true; 
    }
    
    if (isAdmin || isQC || user?.role === 'faculty' || user?.role === 'telecaller' || user?.role === 'marketing' || user?.role === 'accounts_executive') {
      if (item.adminOnly && (isAdmin || isQC)) return true;
      if (item.facultyOnly && user?.role === 'faculty') return true;
      if (item.telecallerOnly && (user?.role === 'telecaller' || isAdmin)) return true;
      if ((item as any).marketingOnly && (user?.role === 'marketing' || isAdmin)) return true;
      if (item.accountsOnly && (user?.role === 'accounts_executive' || isAdmin)) return true;
      
      // Common items for staff
      return ['/dashboard', '/modules', '/software-library', '/online-tests', '/resume-builder', '/queries', '/help-desk', '/adobe-toolkit'].includes(item.path);
    }

    if (user?.role === 'student') {
      // 1st stage: show only demo registration
      if (!user.registeredForDemo) {
        return item.path === '/register' || item.path === '/help-desk';
      }
      
      // 2nd stage: show dashboard, application and software library
      if (!user.applicationStatus || user.applicationStatus === 'pending' || user.applicationStatus === 'none') {
        return item.path === '/dashboard' || item.path === '/apply' || item.path === '/software-library' || item.path === '/queries' || item.path === '/help-desk' || item.path === '/adobe-toolkit';
      }
      
      // 3rd stage: show dashboard and software library
      if (user.applicationStatus === 'submitted' && !user.isApproved) {
        return item.path === '/dashboard' || item.path === '/software-library' || item.path === '/queries' || item.path === '/help-desk' || item.path === '/adobe-toolkit';
      }
      
      // 4th stage (Approved): show Dashboard, Video intro, Course Module, Software Library, Templates, Master, My Projects, Online Test
      if (user.isApproved) {
        return ['/dashboard', '/video-intro', '/modules', '/software-library', '/projects', '/online-tests', '/resume-builder', '/queries', '/help-desk', '/adobe-toolkit'].includes(item.path);
      }
    }
    
    return false;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row print:block print:bg-white">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-3">
          {location.pathname !== '/video-intro' && logoUrl && (
            <img src={logoUrl} alt="Endless Spark Logo" referrerPolicy="no-referrer" className="h-14 md:h-24 object-contain" />
          )}
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 pt-20 md:pt-0 no-print",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:block text-center mb-4">
          {location.pathname !== '/video-intro' && logoUrl && (
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 inline-block">
              <img src={logoUrl} alt="Endless Spark Logo" referrerPolicy="no-referrer" className="h-32 md:h-44 object-contain mx-auto transition-transform hover:scale-105 duration-300" />
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-4 py-4 md:py-0 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group overflow-hidden",
                  isActive 
                    ? "text-pink-700" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-transparent"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-pink-50 border-r-2 border-pink-500 z-0"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 z-10 relative transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className="z-10 relative">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {user ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-400 font-mono truncate">@{user?.username}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === 'admin' ? 'Admin Account' : user?.role === 'faculty' ? 'Faculty Account' : user?.role === 'telecaller' ? 'Telecaller Account' : user?.role === 'qc' ? 'QC Reviewer' : 'Student Account'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="btn-icon-red shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2 px-2 py-1">
              <p className="text-xs text-gray-500 font-medium">Layout Automation Portal:</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-[11px] font-bold text-center transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold text-center transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>
          )}

          {/* Social Links Row */}
          {(socialInstagram || socialFacebook || socialYoutube || socialLinkedin) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-gray-400">
              {socialInstagram && (
                <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors" title="Follow us on Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialFacebook && (
                <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors" title="Follow us on Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {socialYoutube && (
                <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors" title="Subscribe to our YouTube Channel">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {socialLinkedin && (
                <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors" title="Follow us on LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 print:block">
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 shrink-0 no-print">
          <h2 className="text-lg font-semibold text-gray-800">
            {filteredNavItems.find(item => item.path === location.pathname)?.name || 'Welcome'}
          </h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/help-desk')}
              className="text-sm text-gray-500 hover:text-gray-700 font-bold transition-colors"
            >
              Help
            </button>
            <button 
              onClick={() => navigate('/help-desk')}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-700 transition-colors shadow-xs"
            >
              Support Desk
            </button>
          </div>
        </header>
        
        <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-auto relative print:p-0 print:overflow-visible">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating WhatsApp Button */}
      <motion.a 
        drag
        dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
        whileDrag={{ scale: 1.1 }}
        href="https://wa.me/919042821999" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-24 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all z-50 flex items-center justify-center group cursor-move no-print"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-4 bg-white text-gray-900 text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Need help? Chat with us!
        </span>
      </motion.a>

      {/* Global Chat Box */}
      {user && <ChatBox user={user} />}

      {/* Student AI Agent */}
      {user?.role === 'student' && <StudentAIAgent />}
    </div>
  );
}
