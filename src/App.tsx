import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import StudentProjects from './pages/StudentProjects';
import EntranceTestResults from './pages/EntranceTestResults';
import SoftwareLibrary from './pages/SoftwareLibrary';
import SecurityGuidelines from './pages/SecurityGuidelines';
import Registration from './pages/Registration';
import Application from './pages/Application';
import EntranceTest from './pages/EntranceTest';
import VideoIntro from './pages/VideoIntro';
import CourseModules from './pages/CourseModules';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminPanel from './pages/AdminPanel';
import AdminDemo from './pages/AdminDemo';
import FacultyPanel from './pages/FacultyPanel';
import TelecallerPanel from './pages/TelecallerPanel';
import MarketingPanel from './pages/MarketingPanel';
import AccountsPanel from './pages/AccountsPanel';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Landing from './pages/Landing';
import VirtualClassroom from './pages/VirtualClassroom';
import ClassroomClean from './pages/ClassroomClean';
import InterviewRoom from './pages/InterviewRoom';
import LeadCapture from './pages/LeadCapture';
import CourseOverview from './pages/CourseOverview';
import CommunicationAgent from './pages/CommunicationAgent';
import ResumeBuilder from './pages/ResumeBuilder';
import ProjectTemplateLibrary from './pages/ProjectTemplateLibrary';
import MasterProjectLibrary from './pages/MasterProjectLibrary';
import QueryTracker from './pages/QueryTracker';
import HelpDesk from './pages/HelpDesk';
import PublicQcPanel from './pages/PublicQcPanel';
import WebinarRegistration from './pages/WebinarRegistration';
import AdobeScriptToolkit from './pages/AdobeScriptToolkit';
import BookConsultation from './pages/BookConsultation';
import DemoOnePager from './pages/DemoOnePager';
import { useSettings } from './hooks/useSettings';

function ClassroomRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

function AgentRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  return <>{children}</>;
}

function ProtectedRoute({ children, allowAdmin = false }: { children: React.ReactNode, allowAdmin?: boolean }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  if (!user || (user.role === 'student' && user.isPhasedOut)) return <Navigate to="/login" />;
  
  if (!allowAdmin) {
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'faculty') return <Navigate to="/faculty" />;
    if (user.role === 'telecaller') return <Navigate to="/telecaller" />;
    if (user.role === 'accounts_executive') return <Navigate to="/accounts" />;
  }
  
  if (user.role === 'student') {
    const appStatus = user.applicationStatus || 'none';
    
    // 4th stage (Approved): don't allow /register or /apply
    if (user.isApproved) {
      if (location.pathname === '/register' || location.pathname === '/apply') {
        return <Navigate to="/dashboard" />;
      }
      return <>{children}</>;
    }

    // 1st stage: only allow /register
    if (!user.registeredForDemo && location.pathname !== '/register') {
      return <Navigate to="/register" />;
    }
    
    // 1.5 stage: Demo registered but not completed/approved by admin
    if (user.registeredForDemo && !user.demoData?.completed) {
      if (location.pathname !== '/dashboard') {
        return <Navigate to="/dashboard" />;
      }
      return <>{children}</>;
    }

    // 2nd stage: only allow /apply (Demo completed)
    if (user.registeredForDemo && user.demoData?.completed && (appStatus === 'pending' || appStatus === 'none') && location.pathname !== '/apply') {
      return <Navigate to="/apply" />;
    }
    // 3rd stage: only allow /dashboard (for "Under Review" message)
    if (appStatus === 'submitted' && !user.isApproved && location.pathname !== '/dashboard') {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'qc') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function FacultyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  if (!user || user.role !== 'faculty') return <Navigate to="/" />;
  
  return <>{children}</>;
}

function TelecallerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  if (!user || (user.role !== 'telecaller' && user.role !== 'admin')) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function MarketingRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  if (!user || (user.role !== 'marketing' && user.role !== 'admin')) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function AccountsRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  if (!user || (user.role !== 'accounts_executive' && user.role !== 'admin')) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function Home() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900 text-xl font-medium">Loading...</div>;
  
  if (user?.role === 'admin' || user?.role === 'qc') return <Navigate to="/admin" />;
  if (user?.role === 'faculty') return <Navigate to="/faculty" />;
  if (user?.role === 'telecaller') return <Navigate to="/telecaller" />;
  if (user?.role === 'marketing') return <Navigate to="/marketing" />;
  if (user?.role === 'accounts_executive') return <Navigate to="/accounts" />;
  if (user?.role === 'student') {
    if (user.isApproved) return <Navigate to="/dashboard" />;
    if (!user.registeredForDemo) return <Navigate to="/register" />;
    return <Navigate to="/dashboard" />;
  }
  
  return <Landing />;
}

import GlobalNotification from './components/GlobalNotification';

function AppContent() {
  const { logoUrl } = useSettings();

  useEffect(() => {
    if (logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = logoUrl;
    }
  }, [logoUrl]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/inquiry" element={<LeadCapture />} />
        <Route path="/webinar" element={<WebinarRegistration />} />
        <Route path="/about-courses" element={<CourseOverview />} />
        <Route path="/public-qc" element={<PublicQcPanel />} />
        <Route path="/book-consultation" element={<BookConsultation />} />
        <Route path="/demo" element={<DemoOnePager />} />
        
        <Route path="/" element={<Home />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute allowAdmin>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId" element={
          <ProtectedRoute allowAdmin>
            <Layout><ProjectDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute allowAdmin>
            <Layout><StudentProjects /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/queries" element={
          <ProtectedRoute allowAdmin>
            <Layout><QueryTracker /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/help-desk" element={
          <ProtectedRoute allowAdmin>
            <Layout><HelpDesk /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/project-library" element={
          <ProtectedRoute allowAdmin>
            <Layout><ProjectTemplateLibrary /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/master-library" element={
          <AdminRoute>
            <Layout><MasterProjectLibrary /></Layout>
          </AdminRoute>
        } />
        <Route path="/software-library" element={
          <ProtectedRoute allowAdmin>
            <Layout><SoftwareLibrary /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/adobe-toolkit" element={
          <Layout><AdobeScriptToolkit /></Layout>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <Layout><AdminPanel /></Layout>
          </AdminRoute>
        } />
        <Route path="/security-guidelines" element={
          <ProtectedRoute allowAdmin>
            <Layout><SecurityGuidelines /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/demo" element={
          <AdminRoute>
            <Layout><AdminDemo /></Layout>
          </AdminRoute>
        } />
        <Route path="/faculty" element={
          <FacultyRoute>
            <Layout><FacultyPanel /></Layout>
          </FacultyRoute>
        } />
        <Route path="/telecaller" element={
          <TelecallerRoute>
            <Layout><TelecallerPanel /></Layout>
          </TelecallerRoute>
        } />
        <Route path="/marketing" element={
          <MarketingRoute>
            <Layout><MarketingPanel /></Layout>
          </MarketingRoute>
        } />
        <Route path="/accounts" element={
          <AccountsRoute>
            <Layout><AccountsPanel /></Layout>
          </AccountsRoute>
        } />
        <Route path="/register" element={
          <ProtectedRoute>
            <Layout><Registration /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/apply" element={
          <ProtectedRoute>
            <Layout><Application /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/entrance-test" element={
          <ProtectedRoute>
            <Layout><EntranceTest /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/entrance-test-results" element={
          <ProtectedRoute>
            <Layout><EntranceTestResults /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/video-intro" element={
          <ProtectedRoute>
            <Layout><VideoIntro /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/modules" element={
          <ProtectedRoute allowAdmin>
            <Layout><CourseModules /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/quiz" element={
          <ProtectedRoute allowAdmin>
            <Layout><Quiz /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/online-tests" element={
          <ProtectedRoute allowAdmin>
            <Layout><OnlineTestsList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/classroom/:roomId" element={
          <ClassroomRoute>
            <VirtualClassroom />
          </ClassroomRoute>
        } />
        <Route path="/classroom-clean/:roomId" element={
          <ClassroomRoute>
            <ClassroomClean />
          </ClassroomRoute>
        } />
        <Route path="/ai-tutor" element={
          <AgentRoute>
            <Layout><CommunicationAgent /></Layout>
          </AgentRoute>
        } />
        <Route path="/resume-builder" element={
          <ProtectedRoute allowAdmin>
            <Layout><ResumeBuilder /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/interview/:roomId" element={<InterviewRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalNotification />
    </Router>
  );
}

import OnlineTestsList from './pages/OnlineTestsList';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
