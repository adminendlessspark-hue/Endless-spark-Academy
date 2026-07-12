import { User, TopicScore, LeaveRequest, Holiday, CourseType, CourseModule, TrainingRecord, PlacementSettings } from '../types';
import { CircleCheck, Circle, Clock, ArrowRight, FileText, Award, Download, Printer, X, ShieldAlert, Key, Calendar, Send, Info, Video, IdCard, IndianRupee, Smartphone, BookOpen, FolderKanban, CheckSquare, FileCheck, Briefcase, Zap, Camera, Upload, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { cn, formatCourseName } from '../utils';
import StudentIDCard from '../components/StudentIDCard';
import StudentSchedule from '../components/StudentSchedule';
import TrainingRecordForm from '../components/TrainingRecordForm';
import CertificateGenerator from '../components/CertificateGenerator';
import DigitalPaymentGateway from '../components/DigitalPaymentGateway';
import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, onSnapshot, query, setDoc, where, or, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useSettings } from '../hooks/useSettings';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import MoralEducation from '../components/MoralEducation';
import PhotoCapture from '../components/PhotoCapture';
import { FALLBACK_COURSE_MODULES } from '../fallbackData';

function ScoreTable({ title, topics, scores, onMarkAttendance, trainingRecords, onViewRecord, categoryId }: { title: string, topics: { title: string, videoUrl?: string }[], scores: Record<string, TopicScore>, onMarkAttendance: (topic: string) => void, trainingRecords?: TrainingRecord[], onViewRecord?: (record: TrainingRecord) => void, categoryId?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
              <th className="px-4 py-3 w-12">S.No</th>
              <th className="px-4 py-3 min-w-[200px]">Module Topic</th>
              <th className="px-4 py-3 text-center">Assignment (10)</th>
              <th className="px-4 py-3 text-center">Video (20)</th>
              <th className="px-4 py-3 text-center">Work Sheet (20)</th>
              <th className="px-4 py-3 text-center">Project (20)</th>
              <th className="px-4 py-3 text-center">Mid Map (10)</th>
              <th className="px-4 py-3 text-center">Quiz (10)</th>
              <th className="px-4 py-3 text-center">Online Test (20)</th>
              <th className="px-4 py-3 text-center">Total (100)</th>
              <th className="px-4 py-3 text-center">Grade</th>
              <th className="px-4 py-3 text-center italic text-[10px]">Digital Record</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {topics.map((topicObj, idx) => {
              const topic = topicObj.title;
              const s: TopicScore = scores[topic] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 } as TopicScore;
              const total = s.assignment + s.video + s.worksheet + s.project + (s.mindMap || 0) + (s.quiz || 0) + (s.onlineTest || 0);
              const grade = total >= 90 ? 'A+' : total >= 80 ? 'A' : total >= 60 ? 'B' : total > 0 ? 'C' : '-';
              
              const associatedRecord = trainingRecords?.find(r => r.courseModuleName === topic || r.topics?.includes(topic));
              
              const getStatusColor = (status?: string) => {
                if (status === 'approved') return 'text-green-600';
                if (status === 'rejected') return 'text-red-600';
                if (status === 'pending') return 'text-orange-600';
                return 'text-gray-400';
              };

              return (
                <tr key={topic} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {topicObj.videoUrl ? (
                      <a href={topicObj.videoUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 hover:underline flex items-center gap-1">
                        {topic}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      topic
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span>{s.assignmentStatus === 'approved' ? s.assignment : '-'}</span>
                      {s.assignmentStatus && <span className={cn("text-[8px] font-bold uppercase", getStatusColor(s.assignmentStatus))}>{s.assignmentStatus}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span>{s.videoStatus === 'approved' ? s.video : '-'}</span>
                      {s.videoStatus && <span className={cn("text-[8px] font-bold uppercase", getStatusColor(s.videoStatus))}>{s.videoStatus}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span>{s.worksheetStatus === 'approved' ? s.worksheet : '-'}</span>
                      {s.worksheetStatus && <span className={cn("text-[8px] font-bold uppercase", getStatusColor(s.worksheetStatus))}>{s.worksheetStatus}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span>{s.projectStatus === 'approved' ? s.project : '-'}</span>
                      {s.projectStatus && <span className={cn("text-[8px] font-bold uppercase", getStatusColor(s.projectStatus))}>{s.projectStatus}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span>{s.mindMapStatus === 'approved' ? s.mindMap : '-'}</span>
                      {s.mindMapStatus && <span className={cn("text-[8px] font-bold uppercase", getStatusColor(s.mindMapStatus))}>{s.mindMapStatus}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span>{s.quizAttempted ? s.quiz : '-'}</span>
                      {s.quizAttempted && (
                        <span className="text-[8px] font-bold uppercase text-green-600">COMPLETED</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span>{s.onlineTestAttempted ? s.onlineTest : '-'}</span>
                      {s.onlineTestAttempted ? (
                        <span className="text-[8px] font-bold uppercase text-green-600">COMPLETED</span>
                      ) : (
                        s.onlineTestAssigned && categoryId ? <Link to={`/quiz?category=${categoryId}&topic=${encodeURIComponent(topic)}`} className="mt-1 text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded font-bold hover:bg-pink-100 flex items-center gap-1"><ShieldAlert className="w-2.5 h-2.5"/> Take Test</Link> : null
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-pink-600">{total}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold",
                      grade === 'A+' ? "bg-orange-100 text-orange-700" :
                      grade === 'A' ? "bg-blue-100 text-blue-700" :
                      grade === 'B' ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {associatedRecord ? (
                      <button 
                        onClick={() => onViewRecord?.(associatedRecord)}
                        className="p-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 hover:scale-110 active:scale-95 transition-all shadow-sm"
                        title="View Official Training Record"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">Not issued</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useNotifications } from '../useNotifications';

export default function Dashboard({ previewUser }: { previewUser?: User }) {
  const { user: authUser, updateUser: authUpdateUser, changePassword: authChangePassword } = useAuth();
  const user = previewUser || authUser;
  
  // Mock updates if in preview mode
  const updateUser = previewUser ? async () => {
    alert('Modifying account data is disabled in Preview Mode.');
  } : authUpdateUser;
  const changePassword = previewUser ? async () => {
    alert('Changing password is disabled in Preview Mode.');
    return true;
  } : authChangePassword;

  const { logoUrl, branches, financialSettings, wellnessEnabled, wellnessVideoUrl } = useSettings();
  const { requestPermission } = useNotifications();
  const [showIDCard, setShowIDCard] = useState(false);
  const [showWellness, setShowWellness] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [adminSignature, setAdminSignature] = useState('');
  const [founderVideoUrl, setFounderVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [founderVideoUrlTamil, setFounderVideoUrlTamil] = useState('');
  const [overviewVideoUrl, setOverviewVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [overviewVideoUrlTamil, setOverviewVideoUrlTamil] = useState('');
  const [founderVideoEnabled, setFounderVideoEnabled] = useState<boolean>(true);
  const [overviewVideoEnabled, setOverviewVideoEnabled] = useState<boolean>(true);

  const [productionArtEngineerTopics, setProductionArtTopics] = useState<{ title: string, videoUrl?: string }[]>([]);
  const [printReadyEngineerTopics, setPrintReadyTopics] = useState<{ title: string, videoUrl?: string }[]>([]);
  const [qualityControlEngineerTopics, setQualityControlTopics] = useState<{ title: string, videoUrl?: string }[]>([]);
  const [packagingEngineerTopics, setPackagingTopics] = useState<{ title: string, videoUrl?: string }[]>([]);
  const [plateReadyEngineerTopics, setPlateReadyTopics] = useState<{ title: string, videoUrl?: string }[]>([]);
  const [colourRetouchingEngineerTopics, setColourRetouchingTopics] = useState<{ title: string, videoUrl?: string }[]>([]);
  const [printingAndPackagingTopics, setPrintingAndPackagingTopics] = useState<{ title: string, videoUrl?: string }[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [viewingTrainingRecord, setViewingTrainingRecord] = useState<TrainingRecord | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [payingInvoices, setPayingInvoices] = useState<{ invoice: any, emi?: any } | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementSettings, setPlacementSettings] = useState<PlacementSettings | null>(null);
  const [projectsCount, setProjectsCount] = useState<number>(0);

  useEffect(() => {
    // Force set the password change modal state to false since the admin-managed password security feature has been removed
    setShowPasswordChange(false);
  }, [user?.mustChangePassword]);

  useEffect(() => {
    if (wellnessEnabled && user && user.role === 'student' && !previewUser) {
      // Only show on first login (if lastWellnessDate is not set yet)
      if (!user.lastWellnessDate && user.isApproved) {
        setShowWellness(true);
      }
    }
  }, [wellnessEnabled, user, previewUser]);

  const handleWellnessComplete = async () => {
    if (!user || previewUser) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateDoc(doc(db, 'users', user.id), {
        lastWellnessDate: today
      });
      setShowWellness(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  useEffect(() => {
    if (!user?.id || previewUser) return;
    
    // Load holidays in real-time
    const unsubHolidays = onSnapshot(collection(db, 'holidays'), (snapshot) => {
      const holidayList = snapshot.docs.map(doc => doc.data() as Holiday);
      setHolidays(holidayList);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'holidays'));
    
    // Load leaves in real-time
    const leavesQuery = query(collection(db, 'leave_requests'), where('studentId', '==', user.id));
    const unsubLeaves = onSnapshot(leavesQuery, (snapshot) => {
      const leaveList = snapshot.docs.map(doc => doc.data() as LeaveRequest);
      setLeaves(leaveList);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'leave_requests'));

    // Load schedule slots
    const slotsQuery = query(collection(db, 'schedule_slots'), where('studentId', '==', user.id));
    const unsubSlots = onSnapshot(slotsQuery, (snapshot) => {
      const slotList = snapshot.docs.map(doc => doc.data());
      setScheduleSlots(slotList);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'schedule_slots'));

    // Load admin signature and video URLs
    const unsubAdmin = onSnapshot(doc(db, 'settings', 'admin'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setAdminSignature(data.signature || '');
        if (data.founderVideoUrl) setFounderVideoUrl(data.founderVideoUrl);
        if (data.founderVideoUrlTamil) setFounderVideoUrlTamil(data.founderVideoUrlTamil);
        if (data.overviewVideoUrl) setOverviewVideoUrl(data.overviewVideoUrl);
        if (data.overviewVideoUrlTamil) setOverviewVideoUrlTamil(data.overviewVideoUrlTamil);
        setFounderVideoEnabled(data.founderVideoEnabled ?? true);
        setOverviewVideoEnabled(data.overviewVideoEnabled ?? true);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/admin'));

    const unsubPlacements = onSnapshot(doc(db, 'settings', 'placements'), (docSnap) => {
      if (docSnap.exists()) {
        setPlacementSettings(docSnap.data() as PlacementSettings);
      } else {
        setPlacementSettings(null);
      }
    });

    // Load course modules to get topics
    const unsubModules = onSnapshot(collection(db, 'course_modules'), (snapshot) => {
      let allModules = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseModule));
      
      setCourseModules(allModules);
      
      const paTopics = allModules.filter(m => m.category === 'production-art-engineer').map(m => ({ title: m.title, videoUrl: m.videoUrl }));
      const prTopics = allModules.filter(m => m.category === 'print-ready-engineer').map(m => ({ title: m.title, videoUrl: m.videoUrl }));
      const qcTopics = allModules.filter(m => m.category === 'quality-control-engineer').map(m => ({ title: m.title, videoUrl: m.videoUrl }));
      const packTopics = allModules.filter(m => m.category === 'packaging-engineer').map(m => ({ title: m.title, videoUrl: m.videoUrl }));
      const plateTopics = allModules.filter(m => m.category === 'plate-ready-engineer').map(m => ({ title: m.title, videoUrl: m.videoUrl }));
      const colourTopics = allModules.filter(m => m.category === 'colour-retouching-engineer').map(m => ({ title: m.title, videoUrl: m.videoUrl }));
      const crossTopics = allModules.filter(m => m.category === 'printing-and-packaging-cross-courses').map(m => ({ title: m.title, videoUrl: m.videoUrl }));
      
      setProductionArtTopics(paTopics);
      setPrintReadyTopics(prTopics);
      setQualityControlTopics(qcTopics);
      setPackagingTopics(packTopics);
      setPlateReadyTopics(plateTopics);
      setColourRetouchingTopics(colourTopics);
      setPrintingAndPackagingTopics(crossTopics);
    }, (err) => {
      console.warn("Firestore collection 'course_modules' listener failed in dashboard, keeping blank:", err);
      setCourseModules([]);
      
      setProductionArtTopics([]);
      setPrintReadyTopics([]);
      setQualityControlTopics([]);
      setPackagingTopics([]);
      setPlateReadyTopics([]);
      setColourRetouchingTopics([]);
      setPrintingAndPackagingTopics([]);
      
      handleFirestoreError(err, OperationType.GET, 'course_modules');
    });

    let unsubLiveSessions: () => void = () => {};
    const liveSessionsQuery = user.assignedFacultyId 
      ? query(
          collection(db, 'live_sessions'),
          or(
            where('facultyId', '==', user.assignedFacultyId),
            where('studentId', '==', user.id),
            where('studentIds', 'array-contains', user.id)
          )
        )
      : query(
          collection(db, 'live_sessions'),
          or(
            where('studentId', '==', user.id),
            where('studentIds', 'array-contains', user.id)
          )
        );

    unsubLiveSessions = onSnapshot(liveSessionsQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
      // Filter sessions: show if assigned to this student (via studentId or studentIds)
      // OR if it's assigned to their faculty AND has no specific student assigned (legacy behavior)
      const filteredSessions = sessions.filter(s => {
        if (s.studentIds && s.studentIds.includes(user.id)) return true;
        if (s.studentId === user.id) return true;
        if (user.assignedFacultyId && s.facultyId === user.assignedFacultyId && !s.studentId && (!s.studentIds || s.studentIds.length === 0)) return true;
        return false;
      });
      setLiveSessions(filteredSessions);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'live_sessions'));

    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('studentId', '==', user.id)
    );
    const unsubInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'invoices'));

    const trainingRecordsQuery = query(
      collection(db, 'training_records'),
      where('studentId', '==', user.id)
    );
    const unsubTraining = onSnapshot(trainingRecordsQuery, (snapshot) => {
      setTrainingRecords(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TrainingRecord)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'training_records'));

    // Load projects count
    const projectsQuery = query(collection(db, 'student_projects'), where('studentId', '==', user.id));
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      setProjectsCount(snapshot.size);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'student_projects'));

    return () => {
      unsubHolidays();
      unsubLeaves();
      unsubSlots();
      unsubAdmin();
      unsubPlacements();
      unsubModules();
      unsubLiveSessions();
      unsubInvoices();
      unsubTraining();
      unsubProjects();
    };
  }, [user?.id, previewUser]);

  const steps = [
    { name: 'Demo Registration', status: user?.registeredForDemo, path: '/register', disabled: user?.registeredForDemo },
    { name: 'Application Process', status: user?.applicationStatus === 'submitted' || user?.applicationStatus === 'approved', path: '/apply', disabled: !user?.demoData?.completed || user?.isApproved || user?.applicationStatus === 'submitted' },
    { name: 'Initial Introduction', status: user?.videoRecorded, path: '/video-intro', disabled: !user?.isApproved },
    { name: 'Profile Photo', status: !!user?.photo, path: '#', disabled: !user?.isApproved },
    { name: 'Module Progress', status: (user?.completedModules || []).length > 0, path: '/modules', disabled: !user?.isApproved },
  ];

  const progress = (steps.filter(s => s.status).length / steps.length) * 100;

  const assignedCourses = user?.assignedCourses || (user?.assignedCourse ? [user.assignedCourse] : []);

  const getAttendanceStats = () => {
    const joiningDate = new Date(user?.admissionDate || user?.createdAt || Date.now());
    const today = new Date();
    const daysSinceJoining = Math.max(1, Math.floor((today.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24)));
    const monthsSinceJoining = Math.max(1, Math.ceil(daysSinceJoining / 30));
    
    const targetClasses = monthsSinceJoining * 20;
    
    const legacyAttendance = user?.dailyAttendance?.filter(a => a.status === 'approved').length || 0;
    const newAttendance = scheduleSlots.filter(s => s.status === 'completed').length;
    const totalAttended = legacyAttendance + newAttendance;
    
    const attendancePercentage = Math.min(100, Math.round((totalAttended / targetClasses) * 100));
    const attendanceMarks = Math.round((attendancePercentage / 100) * 20);
    
    return {
      totalAttended,
      targetClasses,
      attendancePercentage,
      attendanceMarks,
      isLowAttendance: attendancePercentage < 80
    };
  };

  const getStudentScoreCard = () => {
    let totalScore = 0;
    let maxPossible = 0;
    
    const calculateModuleScore = (scores: Record<string, TopicScore>) => {
      Object.values(scores).forEach(s => {
        const sTotal = (s.assignmentStatus === 'approved' ? s.assignment : 0) +
                       (s.videoStatus === 'approved' ? s.video : 0) +
                       (s.worksheetStatus === 'approved' ? s.worksheet : 0) +
                       (s.projectStatus === 'approved' ? s.project : 0) +
                       (s.mindMapStatus === 'approved' ? s.mindMap : 0) +
                       (s.quizAttempted ? s.quiz : 0) +
                       (s.onlineTestAttempted ? s.onlineTest : 0);
        totalScore += sTotal;
        maxPossible += 100; // Since max is 100 per module
      });
    };

    if (user?.scores?.productionArtEngineer) calculateModuleScore(user.scores.productionArtEngineer);
    if (user?.scores?.printReadyEngineer) calculateModuleScore(user.scores.printReadyEngineer);
    if (user?.scores?.qualityControlEngineer) calculateModuleScore(user.scores.qualityControlEngineer);
    if (user?.scores?.packagingEngineer) calculateModuleScore(user.scores.packagingEngineer);
    if (user?.scores?.plateReadyEngineer) calculateModuleScore(user.scores.plateReadyEngineer);
    if (user?.scores?.colourRetouchingEngineer) calculateModuleScore(user.scores.colourRetouchingEngineer);
    if (user?.scores?.printingAndPackagingCrossCourses) calculateModuleScore(user.scores.printingAndPackagingCrossCourses);

    return { totalScore, maxPossible };
  };

  const attendanceStats = getAttendanceStats();

  const certificateEligibility = useMemo(() => {
    if (!user || trainingRecords.length === 0) return { eligible: false, reason: 'Pending Records' };
    
    // 1. Check if all assigned modules are completed
    const relevantModules = courseModules.filter(m => assignedCourses.includes(m.category));
    
    if (relevantModules.length === 0) return { eligible: false, reason: 'No Modules Assigned' };
    
    const completedModuleTitles = user.completedModules || [];
    const allModulesCompleted = relevantModules.every(m => completedModuleTitles.includes(m.title));
    
    if (!allModulesCompleted) return { eligible: false, reason: 'Modules Incomplete' };
    
    // 2. Check if all training records are signed
    const everyRecordSigned = trainingRecords.length >= relevantModules.length && trainingRecords.every(r => !!r.traineeSign);
    if (!everyRecordSigned) return { eligible: false, reason: 'Sign Records First' };
    
    // 3. Attendance
    if (attendanceStats.attendancePercentage < 80) return { eligible: false, reason: 'Low Attendance' };
    
    // 4. Payments
    const hasPendingInvoices = invoices.some(inv => inv.emis.some((emi: any) => emi.status !== 'paid'));
    if (hasPendingInvoices) return { eligible: false, reason: 'Pending Payments' };

    return { eligible: true, course: assignedCourses[0] as CourseType };
  }, [user, courseModules, trainingRecords, attendanceStats, invoices]);

  if (!user) return null;

  const handleMarkAttendance = async (topic: string) => {
    const course = assignedCourses[0]; // Default to first course for simplicity in this demo
    if (!course) return;

    try {
      const scores = user.scores ? { ...user.scores } : {};
      const scoreKeyMap: Record<CourseType, keyof User['scores']> = {
        'packaging-engineer': 'packagingEngineer',
        'production-art-engineer': 'productionArtEngineer',
        'print-ready-engineer': 'printReadyEngineer',
        'plate-ready-engineer': 'plateReadyEngineer',
        'colour-retouching-engineer': 'colourRetouchingEngineer',
        'quality-control-engineer': 'qualityControlEngineer',
        'printing-and-packaging-cross-courses': 'printingAndPackagingCrossCourses'
      };
      const courseKey = scoreKeyMap[course];
      if (!courseKey) return;

      if (!scores[courseKey]) scores[courseKey] = {};
      const topicScores = { ...(scores[courseKey]![topic] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 }) } as TopicScore;
      
      topicScores.attendanceStatus = 'pending';
      topicScores.attendance = 0; // Marks reflect only after approval
      scores[courseKey]![topic] = topicScores;
      
      await updateUser({ scores });
      alert(`Attendance for ${topic} submitted for faculty approval.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const leaveId = Math.random().toString(36).substr(2, 9);
    const newLeave: LeaveRequest = {
      id: leaveId,
      studentId: user.id,
      studentName: user.name,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'leave_requests', leaveId), newLeave);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      setShowLeaveForm(false);
      alert('Leave request submitted to faculty.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leave_requests/${leaveId}`);
    }
  };

  if (showWellness) {
    return (
      <MoralEducation
        userName={user.name || 'Student'}
        videoUrl={wellnessVideoUrl}
        onComplete={handleWellnessComplete}
        onBack={() => setShowWellness(false)}
      />
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    try {
      const success = await changePassword(newPassword);
      if (success) {
        setShowPasswordChange(false);
        setNewPassword('');
        setConfirmPassword('');
        alert('Password changed successfully! Please use your new password from next login.');
      }
    } catch (err: any) {
      console.error('Password Change Error:', err);
      // More descriptive errors
      let msg = err.message || 'An error occurred';
      if (msg.includes('auth/weak-password')) msg = 'Password is too weak. Please use a mix of letters, numbers, and symbols.';
      if (msg.includes('recent login')) msg = 'For security, you must log out and log in again before changing your password.';
      
      setPasswordError(msg);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('student-id-card-container');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get all styles from the current document
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>Student ID Card - ${user.name}</title>
          ${styles}
          <style>
            @page { size: auto; margin: 0; }
            body { 
              margin: 0; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              background: #f9fafb; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #student-id-card-container { 
              box-shadow: none !important; 
              transform: scale(0.9);
              transform-origin: center;
              flex-direction: row !important;
              gap: 20px !important;
            }
            #student-id-card-front, #student-id-card-back {
              border: 1px solid #eee !important;
              box-shadow: none !important;
            }
          </style>
        </head>
        <body>
          <div id="print-wrapper">
            ${printContent.outerHTML}
          </div>
          <script>
            window.onload = () => {
              // Wait for images and fonts to load
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintApplication = () => {
    const applicationData = user?.applicationData;
    if (!applicationData) {
      alert('No application data found.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const absoluteLogoUrl = logoUrl.startsWith('/') ? window.location.origin + logoUrl : logoUrl;

    printWindow.document.write(`
      <html>
        <head>
          <title>Training Application - ${applicationData.fullName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #000; line-height: 1.4; font-size: 12px; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            .title-container { flex: 1; padding-right: 20px; margin-top: 20px; }
            .main-title { font-size: 24px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin: 0 0 5px 0; }
            .logo-container { width: 300px; text-align: center; }
            .logo-container img { max-width: 100%; height: auto; max-height: 120px; object-fit: contain; }
            
            .top-section { display: flex; gap: 20px; margin-bottom: 20px; }
            .personal-details-table { flex: 1; border-collapse: collapse; }
            .photo-box-container { width: 150px; display: flex; flex-direction: column; align-items: center; }
            .photo-box { width: 150px; height: 180px; border: 1px solid #000; display: flex; justify-content: center; align-items: center; overflow: hidden; }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
            .photo-caption { font-size: 8px; text-align: center; margin-top: 5px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 13px; }
            .label-cell { width: 35%; font-weight: bold; color: #1e3a8a; }
            .value-cell { width: 65%; }
            
            .section-title { font-size: 14px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin: 0; padding: 8px; border: 1px solid #000; border-bottom: none; background-color: #f8fafc; }
            
            .footer { margin-top: 30px; font-size: 10px; color: #666; text-align: center; }
            .proof-section { margin-top: 30px; page-break-before: always; }
            .proof-img { max-width: 100%; max-height: 800px; border: 1px solid #000; margin-top: 10px; object-fit: contain; }
            
            @media print {
              body { padding: 0; }
              .proof-section { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="title-container">
              <h1 class="main-title">COURSE ENROLLMENT FORM FOR STUDENTS</h1>
            </div>
            ${absoluteLogoUrl ? `
            <div class="logo-container">
              <img src="${absoluteLogoUrl}" alt="Endless Spark Logo" />
            </div>
            ` : ''}
          </div>
          
          <div class="top-section">
            <table class="personal-details-table">
              <tr>
                <th colspan="2">PERSONAL DETAILS</th>
              </tr>
              <tr>
                <td class="label-cell">Full Legal Name</td>
                <td class="value-cell">${applicationData.fullName}</td>
              </tr>
              <tr>
                <td class="label-cell">Date of Birth (dd/mm/yyyy)</td>
                <td class="value-cell">${applicationData.dob}</td>
              </tr>
              <tr>
                <td class="label-cell">Place of Birth</td>
                <td class="value-cell">${applicationData.placeOfBirth || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Nationality</td>
                <td class="value-cell">${applicationData.nationality || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Gender</td>
                <td class="value-cell">${applicationData.gender}</td>
              </tr>
              <tr>
                <td class="label-cell">Email Address</td>
                <td class="value-cell">${user?.email}</td>
              </tr>
              <tr>
                <td class="label-cell">Mobile No</td>
                <td class="value-cell">${applicationData.mobileCountryCode || '+91'} ${applicationData.mobileNumber || applicationData.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Emergency Contact No</td>
                <td class="value-cell">${applicationData.emergencyCountryCode || '+91'} ${applicationData.emergencyContact || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Blood Group</td>
                <td class="value-cell">${applicationData.bloodGroup || 'N/A'}</td>
              </tr>
            </table>
            
            <div class="photo-box-container">
              <div class="photo-box">
                ${applicationData.photo ? `<img src="${applicationData.photo}" />` : '<span style="color:#999;font-size:10px;">Photo</span>'}
              </div>
              <div class="photo-caption">Please affix a recent, colour passport sized photograph here (do not staple).</div>
            </div>
          </div>

          <div class="section-title">HOME CONTACT DETAILS</div>
          <table>
            <tr>
              <td class="label-cell">Home Address</td>
              <td class="value-cell">${applicationData.homeAddress || 'N/A'}</td>
            </tr>
          </table>

          <div class="section-title">CORRESPONDENCE ADDRESS (If Different From Above)</div>
          <table>
            <tr>
              <td class="label-cell">Temporary Address</td>
              <td class="value-cell">${applicationData.temporaryAddress || 'N/A'}</td>
            </tr>
          </table>

          <div class="section-title">PROGRAMME OF STUDY</div>
          <table>
            <tr>
              <td class="label-cell">Course Name</td>
              <td class="value-cell">
                ${(user?.requestedCourses || []).map((course: string) => 
                  formatCourseName(course)
                ).join(', ') || 'N/A'}
              </td>
            </tr>
            <tr>
              <td class="label-cell">Mode of Study</td>
              <td class="value-cell" style="text-transform: capitalize;">${applicationData.modeOfStudy || 'N/A'}</td>
            </tr>
          </table>

          <div class="section-title">QUALIFICATIONS (Only provide details of undergraduate level and above)</div>
          <table>
            <tr>
              <td style="font-weight:bold; color: #1e3a8a; width: 40%">Name of University/College/Institute</td>
              <td style="font-weight:bold; color: #1e3a8a; width: 30%">Title of Qualification obtained</td>
              <td style="font-weight:bold; color: #1e3a8a; width: 30%">Graduation Year</td>
            </tr>
            <tr>
              <td>${applicationData.university || 'N/A'}</td>
              <td>${applicationData.qualification || 'N/A'}</td>
              <td>${applicationData.graduationYear || 'N/A'}</td>
            </tr>
          </table>

          <div class="section-title">PROFESSIONAL EXPERIENCE</div>
          <table>
            <tr>
              <td style="font-weight:bold; color: #1e3a8a; width: 40%">Company</td>
              <td style="font-weight:bold; color: #1e3a8a; width: 30%">Current Role</td>
              <td style="font-weight:bold; color: #1e3a8a; width: 30%">Experience</td>
            </tr>
            <tr>
              <td>${applicationData.company || 'N/A'}</td>
              <td>${applicationData.currentRole || 'N/A'}</td>
              <td>${applicationData.experienceYears ? applicationData.experienceYears + ' Years' : 'N/A'}</td>
            </tr>
          </table>

          <div class="footer">
            <p>This is a computer-generated document. Submitted on ${new Date().toLocaleDateString()}</p>
          </div>

          ${applicationData.educationProof ? `
            <div class="proof-section">
              <div class="section-title" style="border-bottom: 1px solid #000;">Education Proof</div>
              <img src="${applicationData.educationProof}" class="proof-img" />
            </div>
          ` : ''}

          ${applicationData.addressProof ? `
            <div class="proof-section">
              <div class="section-title" style="border-bottom: 1px solid #000;">Address Proof</div>
              <img src="${applicationData.addressProof}" class="proof-img" />
            </div>
          ` : ''}

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleMarkDailyAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    const dailyAttendance = [...(user?.dailyAttendance || [])];
    
    if (dailyAttendance.some(a => a.date === today)) {
      alert('You have already marked attendance for today.');
      return;
    }

    dailyAttendance.push({ date: today, status: 'pending' });
    updateUser({ dailyAttendance });
    alert('Daily attendance submitted for faculty approval.');
  };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Required Workstation Software Setup Onboarding */}
      {user?.role === 'student' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-105 duration-300" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Required Workstation Software Setup</h3>
                  <p className="text-sm text-gray-500">Please download and install these essential utilities to prepare your system for the course exercises.</p>
                </div>
              </div>
              
              <Link 
                to="/software-library" 
                className="bg-pink-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-pink-700 transition-all shadow-md self-start md:self-auto shrink-0"
              >
                Go to Software Library
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Check 1 */}
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 flex items-start gap-3 hover:border-pink-200 transition-colors">
                <div className="mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    id="setup-adobe-cc" 
                    defaultChecked={localStorage.getItem('setup_adobe_cc') === 'true'}
                    onChange={(e) => localStorage.setItem('setup_adobe_cc', String(e.target.checked))}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer" 
                  />
                </div>
                <label htmlFor="setup-adobe-cc" className="cursor-pointer select-none">
                  <span className="text-sm font-bold text-gray-900 block">Adobe Creative Cloud</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">Photoshop, Illustrator & Acrobat</span>
                </label>
              </div>

              {/* Check 2 */}
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 flex items-start gap-3 hover:border-pink-200 transition-colors">
                <div className="mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    id="setup-pantone" 
                    defaultChecked={localStorage.getItem('setup_pantone') === 'true'}
                    onChange={(e) => localStorage.setItem('setup_pantone', String(e.target.checked))}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer" 
                  />
                </div>
                <label htmlFor="setup-pantone" className="cursor-pointer select-none">
                  <span className="text-sm font-bold text-gray-900 block">Pantone Color Books</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">PMS Swatch library files</span>
                </label>
              </div>

              {/* Check 3 */}
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 flex items-start gap-3 hover:border-pink-200 transition-colors">
                <div className="mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    id="setup-teamviewer" 
                    defaultChecked={localStorage.getItem('setup_teamviewer') === 'true'}
                    onChange={(e) => localStorage.setItem('setup_teamviewer', String(e.target.checked))}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer" 
                  />
                </div>
                <label htmlFor="setup-teamviewer" className="cursor-pointer select-none">
                  <span className="text-sm font-bold text-gray-900 block">TeamViewer Client</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">Remote faculty S.M.E assistance</span>
                </label>
              </div>

              {/* Check 4 */}
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 flex items-start gap-3 hover:border-pink-200 transition-colors">
                <div className="mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    id="setup-scripts" 
                    defaultChecked={localStorage.getItem('setup_scripts') === 'true'}
                    onChange={(e) => localStorage.setItem('setup_scripts', String(e.target.checked))}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer" 
                  />
                </div>
                <label htmlFor="setup-scripts" className="cursor-pointer select-none">
                  <span className="text-sm font-bold text-gray-900 block">Adobe Script Toolkit</span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">Layout automation files</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Homepage Videos - Conditionally visible */}
      {(founderVideoEnabled || overviewVideoEnabled) && (
        <div className={`grid grid-cols-1 ${founderVideoEnabled && overviewVideoEnabled ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'} gap-6`}>
          {founderVideoEnabled && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-pink-600" />
                Founder Message
              </h3>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
                <SecureVideoPlayer 
                  url={founderVideoUrl} 
                  videoUrls={{
                    "english": founderVideoUrl,
                    "tamil": founderVideoUrlTamil,
                    "English": founderVideoUrl,
                    "Tamil": founderVideoUrlTamil
                  }}
                  nativeLanguage={user?.nativeLanguage}
                  title="Founder Message" 
                  userName={user?.name}
                  userId={user?.studentId || user?.id}
                />
              </div>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                A message from our founder about the vision and mission of Endless Spark School of Printing and Packaging.
              </p>
            </div>
          )}
          {overviewVideoEnabled && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-pink-600" />
                Training Overview
              </h3>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
                <SecureVideoPlayer 
                  url={overviewVideoUrl} 
                  videoUrls={{
                    "english": overviewVideoUrl,
                    "tamil": overviewVideoUrlTamil,
                    "English": overviewVideoUrl,
                    "Tamil": overviewVideoUrlTamil
                  }}
                  nativeLanguage={user?.nativeLanguage}
                  title="Training Overview" 
                  userName={user?.name}
                  userId={user?.studentId || user?.id}
                />
              </div>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                Get a comprehensive overview of the training modules, methodology, and career opportunities.
              </p>
            </div>
          )}
        </div>
      )}

      {!user.isApproved ? (
        <div className="bg-pink-50 p-8 rounded-3xl border border-pink-100 text-center">
          <Clock className="w-12 h-12 text-pink-600 mx-auto mb-4 animate-pulse" />
          {(!user.applicationStatus || user.applicationStatus === 'none' || user.applicationStatus === 'pending') ? (
            <>
              <h2 className="text-2xl font-bold text-pink-900">
                {user.demoData?.completed ? 'Demo Completed' : 'Demo Scheduled'}
              </h2>
              <p className="text-pink-700 mt-2 max-w-lg mx-auto mb-6">
                {user.demoData?.completed 
                  ? "Your demo has been completed! You can now apply for the full course."
                  : "Thank you for registering for a demo! Your demo request has been received. Our team will contact you shortly to confirm the schedule."}
              </p>
              {user.demoData?.completed && (
                <button 
                  onClick={() => window.location.href = '/apply'}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Apply for Course
                </button>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-pink-900">Application Under Review</h2>
              <p className="text-pink-700 mt-2 max-w-lg mx-auto font-medium">
                Thank you for applying! Your application is currently being reviewed by our administration team. 
                Once approved, you will get full access to the training modules, score card, and ID card.
              </p>
            </>
          )}
          {(user.applicationStatus === 'submitted' || user.entranceTestStatus === 'assigned') && (
            <div className="flex justify-center flex-wrap gap-4 mt-6">
              {user.entranceTestStatus === 'assigned' ? (
                <button 
                  onClick={() => window.location.href = '/entrance-test'}
                  className="btn-primary inline-flex items-center gap-2 animate-bounce shadow-purple-200 bg-purple-600 hover:bg-purple-700"
                >
                  <FileText className="w-5 h-5" />
                  Complete Assigned Entrance Test
                </button>
              ) : user.entranceTestStatus === 'submitted' ? (
                <div className="px-5 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs">
                  <Clock className="w-4 h-4 animate-spin" />
                  Entrance Test Under Review
                </div>
              ) : user.entranceTestStatus === 'evaluated' ? (
                <Link 
                  to="/entrance-test-results"
                  className="btn-primary inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"
                >
                  <Award className="w-5 h-5" />
                  Entrance Test Results
                </Link>
              ) : (
                <button 
                  onClick={() => window.location.href = '/entrance-test'}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Take Entrance Test
                </button>
              )}
              <button 
                onClick={() => setShowIDCard(true)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <IdCard className="w-5 h-5" />
                View ID Card
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              {user.photo && (
                <img src={user.photo} alt="Profile" className="w-16 h-16 rounded-2xl object-cover border-2 border-pink-50" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
                <p className="text-gray-500 mt-1">Track your training progress and score card.</p>
                {('Notification' in window && Notification.permission !== 'granted') && (
                  <button 
                    onClick={requestPermission}
                    className="mt-2 text-xs text-pink-600 hover:text-pink-800 underline"
                  >
                    Enable Notifications for Schedule Changes
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Overall Progress</span>
              <div className="text-3xl font-bold text-pink-600">{Math.round(progress)}%</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-6">
            <div 
              className="bg-pink-500 h-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-4">
            <Link
              to="/ai-tutor"
              className="mt-4 flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-blue-700 transition hover:shadow-xl"
            >
              <Zap className="w-5 h-5" />
              Practice with AI Communication Coach
            </Link>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className={cn("w-4 h-4", attendanceStats.isLowAttendance ? "text-red-600" : "text-pink-600")} />
                <span className={cn("text-sm font-bold", attendanceStats.isLowAttendance ? "text-red-600" : "text-gray-700")}>
                  Cumulative Attendance ({attendanceStats.targetClasses} classes target)
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className={cn("text-sm font-bold", attendanceStats.isLowAttendance ? "text-red-600" : "text-pink-600")}>
                  {attendanceStats.totalAttended}/{attendanceStats.targetClasses} Classes ({attendanceStats.attendancePercentage}%)
                </span>
                <span className={cn("text-xs font-bold", attendanceStats.isLowAttendance ? "text-red-500" : "text-orange-600")}>
                  Marks: {attendanceStats.attendanceMarks}/20
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
              <div 
                className={cn("h-full transition-all duration-500", attendanceStats.isLowAttendance ? "bg-red-500" : "bg-orange-500")} 
                style={{ width: `${attendanceStats.attendancePercentage}%` }}
              />
            </div>
            {attendanceStats.isLowAttendance && (
              <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <p>Attendance is below 80%. This will reduce your final marks and may prevent certification.</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-72 bg-pink-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-pink-200" />
              <h3 className="text-lg font-semibold">Assigned Courses</h3>
            </div>
            {assignedCourses.length > 0 ? (
              <div className="space-y-3">
                {assignedCourses.map(course => (
                  <div key={course} className="space-y-1">
                    <p className="text-white font-bold text-sm leading-tight">
                      {formatCourseName(course)}
                    </p>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                      course === 'production-art-engineer' ? "bg-pink-400 text-white" : course === 'print-ready-engineer' ? "bg-orange-400 text-white" : "bg-purple-400 text-white"
                    )}>
                      {course === 'production-art-engineer' ? 'Basic' : course === 'print-ready-engineer' ? 'Intermediate' : 'Advanced'}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono opacity-60">ID: {user.studentId}</span>
                </div>
              </div>
            ) : (
              <p className="text-pink-200 text-sm italic">Pending Assignment</p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-pink-200 uppercase tracking-widest mb-1">Application Status</p>
              <p className="text-sm font-bold">{(user.applicationStatus || 'none').toUpperCase()}</p>
            </div>
            {user.applicationData && (
              <button 
                onClick={handlePrintApplication}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                title="View Application Form"
              >
                <FileText className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

        <div className={cn(
          "bg-white p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row items-center justify-between gap-4",
          !user.photo ? "border-orange-200 bg-orange-50/30" : "border-gray-100"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              !user.photo ? "bg-orange-100 text-orange-600" : "bg-pink-50 text-pink-600"
            )}>
              {user.photo ? (
                <img src={user.photo} alt="Profile" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Award className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Student ID Card</h3>
              <p className="text-sm text-gray-500">
                {!user.photo 
                  ? "Please upload your photo to complete your ID card." 
                  : !user.idCardApproved 
                    ? "Your photo is uploaded. Waiting for admin approval."
                    : "Your official training identification is ready."}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowIDCard(true)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-sm",
              !user.photo 
                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200" 
                : !user.idCardApproved
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-pink-500 text-white hover:bg-pink-600 shadow-pink-200"
            )}
            disabled={!!user.photo && !user.idCardApproved}
          >
            <Printer className="w-4 h-4" />
            {!user.photo ? "Upload Photo & View ID" : !user.idCardApproved ? "Pending Approval" : "Download ID Card"}
          </button>
        </div>

        {/* Entrance Test Result for Approved Students */}
        {user.entranceTestStatus === 'evaluated' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Entrance Test Result</h3>
                <p className="text-sm text-gray-500">Your score: <span className="font-bold text-purple-600">{user.entranceTestMarks} / 75</span></p>
              </div>
            </div>
            <Link 
              to="/entrance-test-results"
              className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-sm shadow-purple-200"
            >
              View Analysis
            </Link>
          </div>
        )}

        {/* Assigned Entrance Test for Approved Students */}
        {user.entranceTestStatus === 'assigned' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-200 bg-purple-50/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center animate-bounce">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-purple-950">Assigned Entrance Test</h3>
                <p className="text-sm text-purple-700 font-medium">You have an active entrance test assigned. Please complete it to finalize your evaluation.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/entrance-test'}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-black hover:bg-purple-700 transition-all shadow-md shadow-purple-200 flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Start Entrance Test
            </button>
          </div>
        )}

        {/* Submitted Entrance Test under review for Approved Students */}
        {user.entranceTestStatus === 'submitted' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 bg-amber-50/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">Entrance Test Submitted</h3>
                <p className="text-sm text-amber-700 font-medium">Your submission has been received and is currently being evaluated by our team.</p>
              </div>
            </div>
            <span className="px-4 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 shrink-0">
              Under Review
            </span>
          </div>
        )}

        {/* Assigned Projects (Tasks) Card */}
        {user.isApproved && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Your Tasks (Assigned Projects)</h3>
                <p className="text-sm text-gray-500">You have <span className="font-bold text-blue-600">{projectsCount}</span> projects assigned for practical work.</p>
              </div>
            </div>
            <Link 
              to="/projects"
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 flex items-center gap-2"
            >
              Go to Tasks <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Support Query Tracker Card */}
        {user.isApproved && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Query Support Desk</h3>
                <p className="text-sm text-gray-500">Need help with your tasks or projects? Raise design/tech queries directly to support desk.</p>
              </div>
            </div>
            <Link 
              to="/queries"
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 flex items-center gap-2 whitespace-nowrap"
            >
              Raise / Track Query <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

      {/* STUDENT SCORE CARD - Moved after Student ID as per user request */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <FileText className="w-5 h-5 text-pink-600" />
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">STUDENT SCORE CARD</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Circular Overview */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-6 h-6 text-pink-600" />
                <h3 className="text-lg font-bold text-gray-900">Overall Progress</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#fce7f3" strokeWidth="10" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" stroke="#db2777" strokeWidth="10" 
                      strokeDasharray={`${Math.min(100, Math.max(0, (getStudentScoreCard().totalScore / Math.max(1, getStudentScoreCard().maxPossible)) * 100)) * 2.827} 282.7`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-gray-900 leading-none">{getStudentScoreCard().totalScore}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">/ {getStudentScoreCard().maxPossible}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500 text-center px-4 leading-relaxed">
                  Total marks accumulated across all completed modules and assignments.
                </p>
              </div>
            </div>

            {/* Re-added Institution Holidays */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-6 h-6 text-pink-600" />
                <h3 className="text-lg font-bold text-gray-900">Institution Holidays</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '250px' }}>
                <div className="space-y-3">
                  {holidays
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((holiday, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-pink-200 transition-colors">
                        <div>
                          <p className="font-bold text-xs text-gray-900">{holiday.title}</p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-bold rounded-full">
                            {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  {holidays.length === 0 && (
                    <p className="text-center py-4 text-xs text-gray-400 italic">No holidays scheduled.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Tables for All Assigned Courses */}
          <div className="lg:col-span-2 space-y-6">
            {assignedCourses.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 italic">Score cards will appear here once courses are assigned.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {assignedCourses.map(courseId => {
                  const topicsMap: Record<CourseType, { title: string, videoUrl?: string }[]> = {
                    'packaging-engineer': packagingEngineerTopics,
                    'production-art-engineer': productionArtEngineerTopics,
                    'print-ready-engineer': printReadyEngineerTopics,
                    'plate-ready-engineer': plateReadyEngineerTopics,
                    'colour-retouching-engineer': colourRetouchingEngineerTopics,
                    'quality-control-engineer': qualityControlEngineerTopics,
                    'printing-and-packaging-cross-courses': printingAndPackagingTopics
                  };
                  
                  const scoreKeyMap: Record<CourseType, keyof User['scores']> = {
                    'packaging-engineer': 'packagingEngineer',
                    'production-art-engineer': 'productionArtEngineer',
                    'print-ready-engineer': 'printReadyEngineer',
                    'plate-ready-engineer': 'plateReadyEngineer',
                    'colour-retouching-engineer': 'colourRetouchingEngineer',
                    'quality-control-engineer': 'qualityControlEngineer',
                    'printing-and-packaging-cross-courses': 'printingAndPackagingCrossCourses'
                  };

                  return (
                    <ScoreTable 
                      key={courseId}
                      categoryId={courseId}
                      title={`Module - ${formatCourseName(courseId)}`} 
                      topics={topicsMap[courseId] || []} 
                      scores={user.scores?.[scoreKeyMap[courseId]] || {}} 
                      onMarkAttendance={handleMarkAttendance}
                      trainingRecords={trainingRecords}
                      onViewRecord={(record) => {
                        setViewingTrainingRecord(record);
                        setShowTrainingModal(true);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {certificateEligibility.eligible && (() => {
        const scoreStats = getStudentScoreCard();
        const percentage = scoreStats.maxPossible > 0 ? (scoreStats.totalScore / scoreStats.maxPossible) * 100 : 0;
        const overallGrade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage > 0 ? 'C' : '-';
        
        const assignedCourseId = certificateEligibility.course;
        let durationMonths = 6; // default
        if (financialSettings?.coursesConfig && assignedCourseId) {
          const matchedCourse = financialSettings.coursesConfig.find((c: any) => c.courseId === assignedCourseId);
          if (matchedCourse && matchedCourse.durationMonths) {
            durationMonths = matchedCourse.durationMonths;
          }
        }

        return (
          <>
            {user.certificateApproved ? (
              <CertificateGenerator 
                user={user} 
                course={certificateEligibility.course!} 
                logoUrl={logoUrl} 
                adminSignature={adminSignature}
                grade={overallGrade}
                durationMonths={durationMonths}
              />
            ) : (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 flex items-center justify-between col-span-full mb-8 relative overflow-hidden bg-orange-50/50">
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 bg-orange-100/80 rounded-2xl flex items-center justify-center text-orange-600 flex-shrink-0">
                    <Award className="w-10 h-10 opacity-50" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Course Completed - Certificate Pending
                    </h2>
                    <p className="text-gray-600 text-sm max-w-lg">
                      Congratulations on completing all modules! Your certificate is currently pending final approval from administration. It will be available for download here once approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">OFFICIAL TRAINING RECORDS</h2>
            </div>
            <span className="text-xs text-gray-500 font-medium">{trainingRecords.length} Records Issued</span>
          </div>

          {trainingRecords.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
               <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-400 italic">No official training records have been issued yet. They will appear here once faculty evaluates your modules.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingRecords.map((record) => (
                <div 
                  key={record.id} 
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => {
                    setViewingTrainingRecord(record);
                    setShowTrainingModal(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    {!record.traineeSign && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full font-black animate-pulse uppercase">NEED SIGNATURE</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors uppercase leading-tight mb-1">
                    {record.courseModuleName || record.topics.split('\n')[0]}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">{new Date(record.trainingDate).toLocaleDateString()}</p>
                  
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ISSUED BY: {record.trainerName}</div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <StudentSchedule />

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Video className="w-5 h-5 text-pink-600" />
          <h2 className="text-xl font-bold text-gray-900">{user.isApproved ? 'LIVE CLASSES' : 'DEMO CLASSES'}</h2>
        </div>
        
        {(user.isApproved ? liveSessions.filter(s => s.type === 'live' || !s.type) : liveSessions.filter(s => s.type === 'demo')).length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No {user.isApproved ? 'Live' : 'Demo'} Classes</h3>
            <p className="text-gray-500">There are no {user.isApproved ? 'live' : 'demo'} classes scheduled at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(user.isApproved ? liveSessions.filter(s => s.type === 'live' || !s.type) : liveSessions.filter(s => s.type === 'demo')).map((session) => (
              <div key={session.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{session.title}</h3>
                        <p className="text-sm text-gray-500">by {session.facultyName}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      session.status === 'live' ? "bg-red-50 text-red-600 animate-pulse" :
                      session.status === 'scheduled' ? "bg-blue-50 text-blue-600" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(session.scheduledFor).toLocaleString()}</span>
                    </div>
                    {session.recordingUrl && (
                      <div className="mt-4">
                        <div className="aspect-video bg-black rounded-xl overflow-hidden">
                          <SecureVideoPlayer 
                            url={session.recordingUrl} 
                            title="Live Session Recording" 
                            userName={user?.name}
                            userId={user?.studentId || user?.id}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {session.status === 'completed' ? (
                    <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-500 cursor-not-allowed">
                      <Video className="w-4 h-4" /> Class Ended
                    </div>
                  ) : (
                    <Link
                      to={`/classroom/${session.roomId}`}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all",
                        session.status === 'live'
                          ? "bg-pink-600 text-white hover:bg-pink-700 shadow-md shadow-pink-200"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        if (session.status !== 'live') {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Video className="w-4 h-4" />
                      {session.status === 'live' ? 'Join Class' : 'Not Started'}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Video className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">INTERVIEWS</h2>
          </div>
            
            {liveSessions.filter(s => s.type === 'interview').length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Interviews</h3>
                <p className="text-gray-500">There are no technical interviews scheduled at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveSessions.filter(s => s.type === 'interview').map((session) => (
                  <div key={session.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Video className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{session.title}</h3>
                            <p className="text-sm text-gray-500">Technical Interview</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          session.status === 'live' ? "bg-red-50 text-red-600 animate-pulse" :
                          session.status === 'scheduled' ? "bg-blue-50 text-blue-600" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {session.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(session.scheduledFor).toLocaleString()}</span>
                        </div>
                        
                        {session.status === 'completed' && session.interviewStatus && (
                          <div className={cn(
                            "p-3 rounded-xl border text-sm",
                            session.interviewStatus === 'pass' ? "bg-green-50 border-green-200 text-green-800" :
                            session.interviewStatus === 'fail' ? "bg-red-50 border-red-200 text-red-800" :
                            "bg-orange-50 border-orange-200 text-orange-800"
                          )}>
                            <div className="font-bold uppercase mb-1">Result: {session.interviewStatus}</div>
                            {session.feedback && <div className="mt-2"><span className="font-semibold">Feedback:</span> {session.feedback}</div>}
                            {session.skillsGap && <div className="mt-2"><span className="font-semibold">Skill Gaps:</span> {session.skillsGap}</div>}
                          </div>
                        )}
                      </div>

                      {session.status === 'completed' ? (
                        <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-500 cursor-not-allowed">
                          <Video className="w-4 h-4" /> Interview Ended
                        </div>
                      ) : (
                        <Link
                          to={`/classroom/${session.roomId}`}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all",
                            session.status === 'live'
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            if (session.status !== 'live') {
                              e.preventDefault();
                            }
                          }}
                        >
                          <Video className="w-4 h-4" />
                          {session.status === 'live' ? 'Join Interview' : 'Not Started'}
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Video className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">HR INTERVIEWS</h2>
            </div>
            
            {liveSessions.filter(s => s.type === 'hr_interview').length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No HR Interviews</h3>
                <p className="text-gray-500">There are no HR interviews scheduled at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveSessions.filter(s => s.type === 'hr_interview').map((session) => (
                  <div key={session.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Video className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{session.title}</h3>
                            <p className="text-sm text-gray-500">HR Interview</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          session.status === 'live' ? "bg-red-50 text-red-600 animate-pulse" :
                          session.status === 'scheduled' ? "bg-purple-50 text-purple-600" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {session.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(session.scheduledFor).toLocaleString()}</span>
                        </div>
                        
                        {session.status === 'completed' && session.interviewStatus && (
                          <div className={cn(
                            "p-3 rounded-xl border text-sm",
                            session.interviewStatus === 'pass' ? "bg-green-50 border-green-200 text-green-800" :
                            session.interviewStatus === 'fail' ? "bg-red-50 border-red-200 text-red-800" :
                            "bg-orange-50 border-orange-200 text-orange-800"
                          )}>
                            <div className="font-bold uppercase mb-1">Result: {session.interviewStatus}</div>
                            {session.feedback && <div className="mt-2"><span className="font-semibold">Feedback:</span> {session.feedback}</div>}
                            {session.skillsGap && <div className="mt-2"><span className="font-semibold">Skill Gaps:</span> {session.skillsGap}</div>}
                          </div>
                        )}
                      </div>

                      {session.status === 'completed' ? (
                        <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-500 cursor-not-allowed">
                          <Video className="w-4 h-4" /> Interview Ended
                        </div>
                      ) : (
                        <Link
                          to={`/classroom/${session.roomId}`}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all",
                            session.status === 'live'
                              ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-200"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            if (session.status !== 'live') {
                              e.preventDefault();
                            }
                          }}
                        >
                          <Video className="w-4 h-4" />
                          {session.status === 'live' ? 'Join Interview' : 'Not Started'}
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

      {invoices.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-pink-600" />
            Invoices & Payments
          </h2>
          <div className="grid gap-6">
            {invoices.map((invoice) => {
              const totalInterest = invoice.emis.reduce((sum: number, emi: any) => sum + (emi.interestAmount || 0), 0);
              const totalPenalty = invoice.emis.reduce((sum: number, emi: any) => sum + (emi.penaltyAmount || 0), 0);
              const totalWaiver = (invoice.waivers || []).reduce((sum: number, w: any) => sum + w.amount, 0);
              const finalPayable = invoice.finalAmount + totalInterest + totalPenalty - totalWaiver;

              return (
              <div key={invoice.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Invoice ID: {invoice.id}</h4>
                    <p className="text-sm text-gray-500">Generated on {new Date(invoice.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">₹{finalPayable.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Total Fee</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => setPayingInvoices({ invoice })}
                        disabled={invoice.emis.every((e: any) => e.status === 'paid')}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-sm",
                          invoice.emis.every((e: any) => e.status === 'paid')
                            ? "bg-green-100 text-green-600 cursor-not-allowed"
                            : "bg-pink-600 text-white hover:bg-pink-700 shadow-pink-200"
                        )}
                      >
                        <IndianRupee className="w-4 h-4" />
                        {invoice.emis.every((e: any) => e.status === 'paid') ? 'Fully Paid' : 'Pay Full Amount'}
                      </button>
                      <button 
                        onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          const absoluteLogoUrl = logoUrl ? (logoUrl.startsWith('/') ? window.location.origin + logoUrl : logoUrl) : '';
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Invoice ${invoice.id}</title>
                                <style>
                                  body { font-family: system-ui, sans-serif; padding: 40px; color: #111827; }
                                  .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
                                  .header-left { flex: 1; }
                                  .header-right { text-align: right; }
                                  .logo { max-height: 100px; object-fit: contain; margin-bottom: 10px; }
                                  .title { font-size: 24px; font-weight: bold; margin: 0 0 10px 0; }
                                  .subtitle { color: #6b7280; margin-top: 5px; margin-bottom: 0; }
                                  .row { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f3f4f6; }
                                  .label { color: #6b7280; font-weight: 500; }
                                  .value { font-weight: bold; }
                                  .total { font-size: 20px; font-weight: bold; margin-top: 30px; text-align: right; }
                                  .waiver { color: #16a34a; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <div class="header-left">
                                    <img src="${absoluteLogoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'" style="height: 60px; object-fit: contain;" />
                                  </div>
                                  <div class="header-right">
                                    <h1 class="title">INVOICE</h1>
                                    <p class="subtitle">ID: ${invoice.id}</p>
                                    <p class="subtitle">Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div class="row">
                                  <span class="label">Student Name</span>
                                  <span class="value">${user.name}</span>
                                </div>
                                <div class="row">
                                  <span class="label">Base Fee</span>
                                  <span class="value">₹${invoice.totalFee.toLocaleString()}</span>
                                </div>
                                <div class="row">
                                  <span class="label">Concession Applied</span>
                                  <span class="value">${invoice.concessionApplied.replace('-', ' ').toUpperCase()}</span>
                                </div>
                                ${invoice.waivers && invoice.waivers.length > 0 ? invoice.waivers.map((w: any) => `
                                  <div class="row waiver">
                                    <span class="label">${w.percentage}% ${w.type === 'interest' ? 'Interest' : 'Penalty'} Waiver (EMI ${w.emiNumber}) - ${w.reason}</span>
                                    <span class="value">-₹${w.amount.toLocaleString()}</span>
                                  </div>
                                `).join('') : ''}
                                <div class="total">
                                  Final Amount: ₹${finalPayable.toLocaleString()}
                                </div>
                                <div style="margin-top: 40px;">
                                  <h3 style="margin-bottom: 15px;">EMI Schedule</h3>
                                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                                    <thead>
                                      <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                                        <th style="padding: 8px;">EMI</th>
                                        <th style="padding: 8px;">Due Date</th>
                                        <th style="padding: 8px;">Base Fee</th>
                                        <th style="padding: 8px;">Interest</th>
                                        <th style="padding: 8px;">Penalty</th>
                                        <th style="padding: 8px;">Waiver</th>
                                        <th style="padding: 8px;">Total Payable</th>
                                        <th style="padding: 8px;">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${invoice.emis.map((emi: any) => {
                                        const emiWaivers = (invoice.waivers || []).filter((w: any) => w.emiNumber === emi.emiNumber);
                                        const emiWaiverAmount = emiWaivers.reduce((sum: number, w: any) => sum + w.amount, 0);
                                        const emiPayable = emi.baseAmount + (emi.interestAmount || 0) + (emi.penaltyAmount || 0) - emiWaiverAmount;
                                        const interestRate = invoice.rulesSnapshot?.interestRatePercentage || 7;
                                        const interestDisplay = emi.interestAmount > 0 ? `${interestRate}% (₹${emi.interestAmount.toLocaleString()})` : '₹0';
                                        return `
                                        <tr style="border-bottom: 1px solid #e5e7eb;">
                                          <td style="padding: 8px;">${emi.emiNumber}</td>
                                          <td style="padding: 8px;">${new Date(emi.dueDate).toLocaleDateString()}</td>
                                          <td style="padding: 8px;">₹${emi.baseAmount.toLocaleString()}</td>
                                          <td style="padding: 8px;">${interestDisplay}</td>
                                          <td style="padding: 8px;">₹${(emi.penaltyAmount || 0).toLocaleString()}</td>
                                          <td style="padding: 8px;">-₹${emiWaiverAmount.toLocaleString()}</td>
                                          <td style="padding: 8px; font-weight: bold;">₹${emiPayable.toLocaleString()}</td>
                                          <td style="padding: 8px;">${emi.status.toUpperCase()}</td>
                                        </tr>
                                      `}).join('')}
                                    </tbody>
                                  </table>
                                </div>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.onload = () => {
                            printWindow.print();
                          };
                        }
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>
                
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Base Fee</p>
                    <p className="font-bold text-gray-900">₹{invoice.totalFee.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Concession</p>
                    <p className="font-bold text-gray-900 capitalize">{invoice.concessionApplied.replace('-', ' ')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">EMIs</p>
                    <p className="font-bold text-gray-900">{invoice.emis.length}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      invoice.emis.every((e: any) => e.status === 'paid') ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {invoice.emis.every((e: any) => e.status === 'paid') ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>

                {invoice.waivers && invoice.waivers.length > 0 && (
                  <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-100">
                    <h5 className="font-bold text-sm text-green-800 mb-2">Fee Waivers</h5>
                    <div className="space-y-2">
                      {invoice.waivers.map((waiver: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm text-green-700">
                          <span>{waiver.percentage}% {waiver.type === 'interest' ? 'Interest' : 'Penalty'} Waiver (EMI {waiver.emiNumber}) - {waiver.reason}</span>
                          <span className="font-bold">-₹{waiver.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h5 className="font-bold text-sm text-gray-900 mb-3">EMI Schedule</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-2 font-medium rounded-tl-lg">EMI</th>
                          <th className="px-4 py-2 font-medium">Due Date</th>
                          <th className="px-4 py-2 font-medium">Base Fee</th>
                          <th className="px-4 py-2 font-medium">Interest</th>
                          <th className="px-4 py-2 font-medium">Penalty</th>
                          <th className="px-4 py-2 font-medium">Waiver</th>
                          <th className="px-4 py-2 font-medium">Total Payable</th>
                          <th className="px-4 py-2 font-medium capitalize">Status</th>
                          <th className="px-4 py-2 font-medium rounded-tr-lg text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoice.emis.map((emi: any, index: number) => {
                          const emiWaivers = (invoice.waivers || []).filter((w: any) => w.emiNumber === emi.emiNumber);
                          const emiWaiverAmount = emiWaivers.reduce((sum: number, w: any) => sum + w.amount, 0);
                          const emiPayable = emi.baseAmount + (emi.interestAmount || 0) + (emi.penaltyAmount || 0) - emiWaiverAmount;
                          const interestRate = invoice.rulesSnapshot?.interestRatePercentage || 7;
                          const interestDisplay = emi.interestAmount > 0 ? `${interestRate}% (₹${emi.interestAmount.toLocaleString()})` : '₹0';

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-bold text-gray-900">{emi.emiNumber}</td>
                              <td className="px-4 py-3 text-gray-500">{new Date(emi.dueDate).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-gray-900">₹{emi.baseAmount.toLocaleString()}</td>
                              <td className="px-4 py-3 text-orange-600">{interestDisplay}</td>
                              <td className="px-4 py-3 text-red-600">₹{(emi.penaltyAmount || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-green-600">-₹{emiWaiverAmount.toLocaleString()}</td>
                              <td className="px-4 py-3 font-bold text-gray-900">₹{emiPayable.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                                  emi.status === 'paid' ? "bg-green-50 text-green-600" : 
                                  emi.status === 'overdue' ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"
                                )}>
                                  {emi.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {emi.status !== 'paid' && (
                                  <button 
                                    onClick={() => setPayingInvoices({ invoice, emi })}
                                    className="p-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                                    title="Pay Now Online"
                                  >
                                    <Smartphone className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold">Leave Requests</h3>
              </div>
              <button 
                onClick={() => setShowLeaveForm(!showLeaveForm)}
                className="text-xs font-bold text-pink-600 hover:text-pink-700"
              >
                {showLeaveForm ? 'Cancel' : '+ New Request'}
              </button>
            </div>

            {showLeaveForm && (
              <form onSubmit={handleLeaveSubmit} className="mb-6 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    className="p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                  <input
                    type="date"
                    required
                    className="p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </div>
                <textarea
                  placeholder="Reason for leave..."
                  required
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 h-20"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
                <button type="submit" className="w-full bg-pink-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-pink-700 flex items-center justify-center gap-2">
                  <Send className="w-3 h-3" /> Submit Request
                </button>
              </form>
            )}

            <div className="space-y-3">
              {leaves.map(leave => (
                <div key={leave.id} className="p-3 border border-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{leave.reason}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    leave.status === 'approved' ? "bg-green-100 text-green-700" :
                    leave.status === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-orange-100 text-orange-700"
                  )}>
                    {leave.status}
                  </span>
                </div>
              ))}
              {leaves.length === 0 && !showLeaveForm && (
                <p className="text-center py-4 text-xs text-gray-400 italic">No leave requests yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-semibold">Institution Holidays</h3>
            </div>
            <div className="space-y-3">
              {(() => {
                const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                return (
                  <>
                    {sortedHolidays.map(holiday => (
                      <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{holiday.title}</p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(holiday.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-500">{new Date(holiday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    ))}
                    {sortedHolidays.length === 0 && (
                      <p className="text-center py-4 text-xs text-gray-400 italic">No holidays scheduled.</p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-600" />
            Onboarding Roadmap
          </h3>
          <div className="relative">
            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-100" />
            <div className="space-y-8 relative">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-6 items-start">
                  <div className={cn(
                    "relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    step.status 
                      ? "bg-pink-600 border-pink-600 shadow-lg shadow-pink-100 text-white" 
                      : step.disabled
                        ? "bg-gray-50 border-gray-100 text-gray-300"
                        : "bg-white border-pink-200 text-pink-600"
                  )}>
                    {step.status ? (
                      <CircleCheck className="w-6 h-6" />
                    ) : (
                      <span className="font-black text-lg">{idx + 1}</span>
                    )}
                  </div>
                  <Link 
                    to={step.disabled ? '#' : step.path}
                    className={cn(
                      "flex-1 p-4 rounded-2xl border transition-all duration-300",
                      step.status 
                        ? "bg-gray-50 border-gray-200 opacity-75" 
                        : step.disabled
                          ? "bg-gray-50 border-transparent opacity-50 cursor-not-allowed"
                          : "bg-white border-pink-100 hover:border-pink-300 hover:shadow-md"
                    )}
                    onClick={(e) => step.disabled && e.preventDefault()}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={cn(
                          "font-bold text-lg leading-none mb-1",
                          step.status ? "text-gray-500 line-through" : "text-gray-900"
                        )}>
                          {step.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {step.status 
                            ? 'Completed' 
                            : step.disabled 
                              ? 'Waiting for previous steps' 
                              : `Click to ${step.name.toLowerCase()}`}
                        </p>
                      </div>
                      {!step.status && !step.disabled && <ArrowRight className="w-5 h-5 text-pink-600" />}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Next Learning Session</h3>
            <p className="text-gray-500 text-sm">Continue your journey with the course modules.</p>
          </div>
          <div className="mt-8">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Clock className="w-4 h-4" />
              Available 24/7
            </div>
            <Link 
              to={user.isApproved ? "/modules" : "#"}
              onClick={(e) => !user.isApproved && e.preventDefault()}
              className={cn(
                "block w-full py-3 rounded-xl font-bold transition-all text-center",
                user.isApproved 
                  ? "btn-primary" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              Go to Modules
            </Link>
          </div>
        </div>
      </div>

        <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Placements & Career</h3>
            <p className="text-gray-500 text-sm">View your placement eligible status and historical global placements data.</p>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => setShowPlacementModal(true)}
              className="w-full md:w-auto btn-primary bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <Briefcase className="w-5 h-5" /> View Placement Details
            </button>
          </div>
        </div>
      </>
    )}

      {/* ID Card Modal */}
      {showIDCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-8 relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowIDCard(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Your Student ID Card</h3>
              <p className="text-sm text-gray-500 mt-1">Official identification for Endless Spark School of Printing and Packaging</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <StudentIDCard user={user} adminSignature={adminSignature} />
              
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {user.photo ? 'Change ID Photo' : 'Upload ID Photo'}
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCapturingPhoto(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-xl text-sm font-bold hover:bg-pink-100 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Live
                    </button>
                    
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Upload File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              updateUser({ photo: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {isCapturingPhoto && (
                    <PhotoCapture 
                      onCapture={(image) => {
                        updateUser({ photo: image });
                        setIsCapturingPhoto(false);
                      }}
                      onCancel={() => setIsCapturingPhoto(false)}
                    />
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Recommended: Square photo, max 1MB</p>
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setShowIDCard(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
              <button 
                onClick={handlePrint}
                disabled={!user.idCardApproved}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-lg",
                  user.idCardApproved 
                    ? "btn-primary" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none py-3"
                )}
              >
                <Printer className="w-5 h-5" />
                {user.idCardApproved ? "Print / Save PDF" : "Awaiting Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Payment Modal */}
      {payingInvoices && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 relative">
            <button
              onClick={() => setPayingInvoices(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors z-20"
              title="Close Payment Gateway"
            >
              <X className="w-5 h-5" />
            </button>
            <DigitalPaymentGateway 
              amount={payingInvoices.emi 
                ? payingInvoices.emi.baseAmount + (payingInvoices.emi.interestAmount || 0) + (payingInvoices.emi.penaltyAmount || 0) - ((payingInvoices.invoice.waivers || []).filter((w: any) => w.emiNumber === payingInvoices.emi.emiNumber).reduce((sum: number, w: any) => sum + w.amount, 0))
                : payingInvoices.invoice.finalAmount + 
                  payingInvoices.invoice.emis.reduce((sum: number, emi: any) => sum + (emi.interestAmount || 0), 0) + 
                  payingInvoices.invoice.emis.reduce((sum: number, emi: any) => sum + (emi.penaltyAmount || 0), 0) - 
                  (payingInvoices.invoice.waivers || []).reduce((sum: number, w: any) => sum + w.amount, 0)
              }
              description={payingInvoices.emi ? `EMI ${payingInvoices.emi.emiNumber} - Course Fee` : 'Full Course Fee Payment'}
              studentName={user.name}
              studentEmail={user.email}
              onSuccess={async (paymentId) => {
                const { invoice, emi } = payingInvoices;
                try {
                  if (emi) {
                    const updatedEmis = invoice.emis.map((e: any) => 
                      e.emiNumber === emi.emiNumber ? { ...e, status: 'paid', paidAt: new Date().toISOString(), paymentId } : e
                    );
                    await updateDoc(doc(db, 'invoices', invoice.id), { emis: updatedEmis });
                  } else {
                    const updatedEmis = invoice.emis.map((e: any) => ({ ...e, status: 'paid', paidAt: new Date().toISOString(), paymentId }));
                    await updateDoc(doc(db, 'invoices', invoice.id), { emis: updatedEmis });
                  }
                  setPayingInvoices(null);
                  alert('Payment successful!');
                } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, `invoices/${invoice.id}`);
                }
              }}
              onCancel={() => setPayingInvoices(null)}
            />
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Security Update Required</h2>
              <p className="text-gray-500 mt-2 text-sm">
                You are currently using a default or temporary password. For your security, please set a new password to continue.
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {passwordError}
                  </div>
                  {(passwordError.includes('recent login') || passwordError.includes('auth/requires-recent-login')) && (
                    <button
                      type="button"
                      onClick={() => {
                        auth.signOut();
                        window.location.reload();
                      }}
                      className="mt-2 text-[10px] bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 transition-colors uppercase tracking-wider text-center"
                    >
                      Log Out & Log In Again
                    </button>
                  )}
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-2">
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mb-1">Password Requirements:</p>
                <ul className="text-[9px] text-blue-600 space-y-0.5 list-disc pl-3">
                  <li>At least 6 characters long</li>
                  <li>Should be different from your old password</li>
                  <li>Include letters and numbers for better security</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">New Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    placeholder="New password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary mt-4 flex items-center justify-center gap-2"
              >
                <CircleCheck className="w-4 h-4" />
                Secure My Account
              </button>
            </form>
          </div>
        </div>
      )}

      {showTrainingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <TrainingRecordForm 
              initialData={viewingTrainingRecord || undefined}
              isStaffUser={false} // Student view
              logoUrl={logoUrl}
              onCancel={() => {
                setViewingTrainingRecord(null);
                setShowTrainingModal(false);
              }}
              onSubmit={async (data) => {
                if (viewingTrainingRecord) {
                  try {
                    const { doc, setDoc } = await import('firebase/firestore');
                    const { db } = await import('../firebase');
                    await setDoc(doc(db, 'training_records', viewingTrainingRecord.id), {
                      ...data,
                      updatedAt: new Date().toISOString()
                    }, { merge: true });
                    setShowTrainingModal(false);
                    setViewingTrainingRecord(null);
                    alert('Signature and feedback saved successfully!');
                  } catch (err) {
                    console.error('Error updating training record:', err);
                    alert('Failed to save signature. Please try again.');
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Placement Modal */}
      {showPlacementModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white max-w-5xl w-full h-[85vh] rounded-3xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-lg">Placement & Career Center</h3>
              </div>
              <button 
                onClick={() => setShowPlacementModal(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-8 bg-gray-50/50">
              
              {/* My Placement Card */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h4 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" /> My Placement Status
                </h4>
                
                {user.placementInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                      <p className="text-xs text-indigo-500/80 uppercase font-bold tracking-wider mb-2">Status</p>
                      <p className={cn(
                        "text-sm font-bold w-fit px-3 py-1 rounded-lg",
                        user.placementInfo.status === 'Placed' ? "bg-green-100 text-green-700" :
                        user.placementInfo.status === 'Interview Scheduled' ? "bg-orange-100 text-orange-700" :
                        user.placementInfo.status === 'Not Placed' ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>{user.placementInfo.status}</p>
                    </div>
                    
                    {user.placementInfo.status === 'Interview Scheduled' && (
                       <>
                         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Interview Company</p>
                          <p className="text-sm font-bold text-gray-900">{user.placementInfo.interviewCompany}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Interview Date</p>
                          <p className="text-sm font-bold text-gray-900">{user.placementInfo.interviewDate ? new Date(user.placementInfo.interviewDate).toLocaleString() : 'TBD'}</p>
                        </div>
                       </>
                    )}
                    
                    {user.placementInfo.status === 'Placed' && (
                       <>
                         <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm bg-green-50/20">
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Placed Company</p>
                          <p className="text-base font-bold text-green-700">{user.placementInfo.placedCompany}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Annual Package</p>
                          <p className="text-base font-bold text-gray-900">{user.placementInfo.packageAmount}</p>
                        </div>
                       </>
                    )}
                    
                    {user.placementInfo.notes && (
                      <div className="bg-yellow-50/50 p-5 rounded-2xl border border-yellow-100/50 col-span-full mt-2">
                        <p className="text-xs text-yellow-600/80 uppercase font-bold tracking-wider mb-2">Placement Board Notes</p>
                        <p className="text-sm text-gray-700 italic">{user.placementInfo.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h5 className="font-bold text-gray-900 text-lg mb-2">Course In Progress</h5>
                    <p className="text-sm text-gray-500 max-w-md">Upon completing your enrolled course successfully, you will become eligible for campus placements. Auto-updates will appear here.</p>
                  </div>
                )}
              </div>
              
              {/* Global Placement History */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-8">
                  <h4 className="font-bold text-gray-800 text-lg">Historical Global Placements</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">Official Data</span>
                </div>
                
                <div className="space-y-10">
                  {(!placementSettings || !placementSettings.yearlyRecords || placementSettings.yearlyRecords.length === 0) ? (
                    <div className="p-8 text-center text-gray-400 italic">No historical placement records found.</div>
                  ) : (
                    [...placementSettings.yearlyRecords]
                      .sort((a, b) => b.year.localeCompare(a.year))
                      .map(yearRecord => (
                      <div key={yearRecord.year} className="last:pb-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-3 mb-6">
                          <h5 className="text-2xl font-bold text-gray-900 shadow-sm-bottom">{yearRecord.year}</h5>
                          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mt-2 sm:mt-0">
                            Total Placed: {yearRecord.records.reduce((acc, curr) => acc + curr.studentsPlaced, 0)}
                          </span>
                        </div>
                        
                        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                          <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-[#b1b9c7]">
                              <tr>
                                <th className="px-6 py-4 font-bold text-black border-r border-[#9ea9bb]/30 last:border-0 w-1/2">Company</th>
                                <th className="px-6 py-4 font-bold text-black border-r border-[#9ea9bb]/30 last:border-0 text-center">Students</th>
                                <th className="px-6 py-4 font-bold text-black border-r border-[#9ea9bb]/30 last:border-0 text-right">Highest Annual Package</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {yearRecord.records
                                .sort((a, b) => b.highestPackage - a.highestPackage)
                                .map(record => (
                                <tr key={record.id} className="hover:bg-gray-50 transition-colors bg-white">
                                  <td className="px-6 py-4 text-sm text-gray-900 font-medium border-r border-gray-200">{record.companyName}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600 text-center border-r border-gray-200 font-semibold">{record.studentsPlaced}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600 text-right font-medium">{record.highestPackage.toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
