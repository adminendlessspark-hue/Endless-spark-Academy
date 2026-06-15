import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Calendar, FileText, Video, UserCheck, Eye, CircleCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, LeaveRequest, CourseType, TopicScore, ApplicationData } from '../types';
import { cn, getScoreKey, formatCourseName } from '../utils';
import { useAuth } from '../AuthContext';
import { collection, doc, onSnapshot, query, updateDoc, where, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import FacultySchedule from '../components/FacultySchedule';
import Reports from '../components/Reports';
import { useNotifications } from '../useNotifications';
import SecureVideoPlayer from '../components/SecureVideoPlayer';

export default function FacultyPanel() {
  const { user: facultyUser } = useAuth();
  const { requestPermission } = useNotifications();
  const [activeTab, setActiveTab] = useState<'students' | 'approvals' | 'applications' | 'leaves' | 'schedule' | 'live-classes'>('students');
  const [students, setStudents] = useState<User[]>([]);
  const [pendingApplications, setPendingApplications] = useState<User[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionStudentIds, setNewSessionStudentIds] = useState<string[]>([]);
  const [newSessionDate, setNewSessionDate] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionType, setNewSessionType] = useState<'live' | 'demo'>('live');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [sessionToUpdateRecording, setSessionToUpdateRecording] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [viewingApplication, setViewingApplication] = useState<ApplicationData | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<{
    studentId: string;
    course: CourseType;
    topic: string;
    field: 'assignmentStatus' | 'videoStatus' | 'attendanceStatus' | 'worksheetStatus' | 'projectStatus' | 'mindMapStatus';
    maxScore: number;
  } | null>(null);
  const [gradingMark, setGradingMark] = useState<number | ''>('');

  useEffect(() => {
    if (!facultyUser?.id) return;

    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('assignedFacultyId', '==', facultyUser.id)
    );

    let unsubLeaves: (() => void) | null = null;

    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      const assignedStudents = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setStudents(assignedStudents);
      
      // Also fetch pending applications assigned to this faculty
      const pendingApps = assignedStudents.filter(s => s.applicationStatus === 'submitted' && !s.isApproved);
      setPendingApplications(pendingApps);

      // Fetch leaves for these students
      if (assignedStudents.length > 0) {
        const studentIds = assignedStudents.map(s => s.id);
        
        if (unsubLeaves) {
          unsubLeaves();
        }
        
        const leavesQuery = query(collection(db, 'leave_requests'));
        unsubLeaves = onSnapshot(leavesQuery, (leaveSnapshot) => {
          const allLeaves = leaveSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LeaveRequest));
          const assignedLeaves = allLeaves.filter(l => studentIds.includes(l.studentId));
          setLeaves(assignedLeaves);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'leave_requests'));
      } else {
        setLeaves([]);
        if (unsubLeaves) {
          unsubLeaves();
          unsubLeaves = null;
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    const unsubLiveSessions = onSnapshot(
      query(collection(db, 'live_sessions'), where('facultyId', '==', facultyUser.id)),
      (snapshot) => {
        setLiveSessions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'live_sessions')
    );

    return () => {
      unsubStudents();
      unsubLiveSessions();
      if (unsubLeaves) {
        unsubLeaves();
      }
    };
  }, [facultyUser?.id]);

  const checkPreview = () => {
    return false;
  };

  const handleApproveApplication = async (studentId: string) => {
    if (checkPreview()) return;
    try {
      await updateDoc(doc(db, 'users', studentId), {
        isApproved: true,
        applicationStatus: 'approved',
        admissionDate: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleUpdateDailyAttendance = async (studentId: string, date: string, status: 'approved' | 'rejected') => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const dailyAttendance = (student.dailyAttendance || []).map(a => 
        a.date === date ? { ...a, status } : a
      );
      
      const approvedCount = dailyAttendance.filter(a => a.status === 'approved').length;
      const scores = student.scores ? { ...student.scores } : {};
      
      const assignedCourse = student.assignedCourses?.[0] || student.assignedCourse;
      if (assignedCourse && approvedCount >= 20) {
        const courseKey = getScoreKey(assignedCourse);
        if (!scores[courseKey]) scores[courseKey] = {};
        const firstTopic = Object.keys(scores[courseKey])[0];
        if (firstTopic) {
          scores[courseKey][firstTopic].attendance = 10;
        }
      }

      await updateDoc(doc(db, 'users', studentId), {
        dailyAttendance,
        scores
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleUpdateStatus = async (studentId: string, course: CourseType, topic: string, field: 'assignmentStatus' | 'videoStatus' | 'attendanceStatus' | 'worksheetStatus' | 'projectStatus' | 'mindMapStatus', status: 'approved' | 'rejected', mark?: number) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const scores = student.scores ? JSON.parse(JSON.stringify(student.scores)) : {};
      const courseKey = getScoreKey(course);
      if (!scores[courseKey]) scores[courseKey] = {};
      const topicScores = { ...(scores[courseKey][topic] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 }) } as TopicScore;
      topicScores[field] = status;
      
      if (status === 'approved') {
        if (field === 'assignmentStatus') topicScores.assignment = mark !== undefined ? mark : 10;
        if (field === 'videoStatus') topicScores.video = mark !== undefined ? mark : 20;
        if (field === 'worksheetStatus') topicScores.worksheet = mark !== undefined ? mark : 20;
        if (field === 'projectStatus') topicScores.project = mark !== undefined ? mark : 20;
        if (field === 'mindMapStatus') topicScores.mindMap = mark !== undefined ? mark : 10;
        if (field === 'attendanceStatus') topicScores.attendance = mark !== undefined ? mark : 10;
      } else {
        if (field === 'assignmentStatus') topicScores.assignment = 0;
        if (field === 'videoStatus') topicScores.video = 0;
        if (field === 'worksheetStatus') topicScores.worksheet = 0;
        if (field === 'projectStatus') topicScores.project = 0;
        if (field === 'mindMapStatus') topicScores.mindMap = 0;
        if (field === 'attendanceStatus') topicScores.attendance = 0;
      }
      
      scores[courseKey][topic] = topicScores;
      await updateDoc(doc(db, 'users', studentId), { scores });
      setGradingSubmission(null);
      setGradingMark('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${studentId}`);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'leave_requests', leaveId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leave_requests/${leaveId}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage your assigned students and their submissions.</p>
        </div>
        {('Notification' in window && Notification.permission !== 'granted') && (
          <button 
            onClick={requestPermission}
            className="mt-2 text-xs text-pink-600 hover:text-pink-800 underline block"
          >
            Enable Notifications for Schedule Changes
          </button>
        )}
        <div className="mt-4">
          <Link
            to="/ai-tutor"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-sm hover:from-blue-600 hover:to-blue-700 transition hover:shadow"
          >
            <Zap className="w-5 h-5" />
            Practice Communication Skills
          </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-200 pb-px overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('students')}
          className={cn("btn-tab", activeTab === 'students' ? "btn-tab-active" : "btn-tab-inactive")}
        >
          <Users className="w-4 h-4" />
          My Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={cn("btn-tab", activeTab === 'approvals' ? "btn-tab-active" : "btn-tab-inactive")}
        >
          <UserCheck className="w-4 h-4" />
          Topic Approvals
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={cn("btn-tab", activeTab === 'applications' ? "btn-tab-active" : "btn-tab-inactive")}
        >
          <FileText className="w-4 h-4" />
          Student Applications ({pendingApplications.length})
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={cn("btn-tab", activeTab === 'leaves' ? "btn-tab-active" : "btn-tab-inactive")}
        >
          <Calendar className="w-4 h-4" />
          Leave Requests ({leaves.filter(l => l.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={cn("btn-tab", activeTab === 'schedule' ? "btn-tab-active" : "btn-tab-inactive")}
        >
          <Clock className="w-4 h-4" />
          Roster & Schedule
        </button>
        <button
          onClick={() => setActiveTab('live-classes')}
          className={cn("btn-tab", activeTab === 'live-classes' ? "btn-tab-active" : "btn-tab-inactive")}
        >
          <Video className="w-4 h-4" />
          Live Classes
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'students' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map(student => (
                <div key={student.id} className="p-6 border border-gray-100 rounded-3xl hover:border-pink-100 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{student.name}</h4>
                      <p className="text-xs text-gray-500">{student.studentId || 'No ID'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Course</span>
                      <span className="font-bold text-pink-600 uppercase">{student.assignedCourse?.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Admission</span>
                      <span className="font-medium">{student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 italic">
                  No students assigned to you yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-semibold text-sm text-gray-500">Student</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Topic</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Type</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Status</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.flatMap(student => {
                    const courses: CourseType[] = student.assignedCourses || (student.assignedCourse ? [student.assignedCourse] : []);
                    return courses.flatMap(course => {
                      const courseScores = (student.scores || {})[getScoreKey(course) as keyof typeof student.scores] || {};
                      return Object.entries(courseScores).flatMap(([topic, score]) => {
                        const s = score as TopicScore;
                        const items = [];
                        if (s.assignmentStatus === 'pending') {
                          items.push({ student, topic, course, type: 'Assignment' as const, field: 'assignmentStatus' as const, data: s.assignmentFile });
                        }
                        if (s.videoStatus === 'pending') {
                          items.push({ student, topic, course, type: 'Video Intro' as const, field: 'videoStatus' as const, data: s.videoData });
                        }
                        if (s.worksheetStatus === 'pending') {
                          items.push({ student, topic, course, type: 'Worksheet' as const, field: 'worksheetStatus' as const, data: s.worksheetFile });
                        }
                        if (s.projectStatus === 'pending') {
                          items.push({ student, topic, course, type: 'Project' as const, field: 'projectStatus' as const, data: s.projectFile });
                        }
                        if (s.mindMapStatus === 'pending') {
                          items.push({ student, topic, course, type: 'Mind Map' as const, field: 'mindMapStatus' as const, data: s.mindMapFile });
                        }
                        if (s.attendanceStatus === 'pending') {
                          items.push({ student, topic, course, type: 'Topic Attendance', field: 'attendanceStatus' as const });
                        }
                        return items;
                      });
                    });
                  }).concat(students.flatMap(student => 
                    (student.dailyAttendance || [])
                      .filter(a => a.status === 'pending')
                      .map(a => ({
                        student,
                        topic: `Daily Attendance: ${a.date}`,
                        course: (student.assignedCourses?.[0] || student.assignedCourse || 'production-art-engineer') as CourseType,
                        type: 'Daily Attendance' as const,
                        field: 'dailyAttendance' as any,
                        date: a.date
                      }))
                  )).map((item, i) => (
                    <tr key={i} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{item.student.name}</p>
                        <p className="text-xs text-gray-500">{item.student.username}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-700">{item.topic}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                          {item.type === 'Assignment' ? <FileText className="w-3 h-3" /> : item.type === 'Video Intro' ? <Video className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {item.type}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.type !== 'Topic Attendance' && item.type !== 'Daily Attendance' && (item as any).data && (
                            <a
                              href={(item as any).data!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                              title="View Submission Link"
                            >
                              <Eye className="w-5 h-5" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              if (item.type === 'Daily Attendance') {
                                handleUpdateDailyAttendance(item.student.id, (item as any).date, 'approved');
                              } else if (item.type === 'Topic Attendance') {
                                handleUpdateStatus(item.student.id, item.course, item.topic, item.field as any, 'approved');
                              } else {
                                const maxScore = item.type === 'Video Intro' ? 20 : (item.type === 'Assignment' ? 10 : (item.type === 'Mind Map' ? 10 : 20));
                                setGradingSubmission({
                                  studentId: item.student.id,
                                  course: item.course,
                                  topic: item.topic,
                                  field: item.field as any,
                                  maxScore
                                });
                                setGradingMark(maxScore);
                              }
                            }}
                            className="btn-icon-blue p-1.5"
                            title="Approve"
                          >
                            <CircleCheck className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (item.type === 'Daily Attendance') {
                                handleUpdateDailyAttendance(item.student.id, (item as any).date, 'rejected');
                              } else {
                                handleUpdateStatus(item.student.id, item.course, item.topic, item.field as any, 'rejected');
                              }
                            }}
                            className="btn-icon-red p-1.5"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="py-12 text-center text-gray-500 italic">
                  No pending approvals.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="p-6">
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-semibold text-sm text-gray-500">Student</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Email</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Status</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingApplications.map((student) => (
                    <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.username}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-700">{student.email}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold">
                          <Clock className="w-3 h-3" /> Submitted
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => student.applicationData && setViewingApplication(student.applicationData)}
                            className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="View Application Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleApproveApplication(student.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
                          >
                            Validate & Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingApplications.length === 0 && (
                <div className="py-12 text-center text-gray-500 italic">
                  No pending student applications assigned to you.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="p-6">
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-semibold text-sm text-gray-500">Student</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Dates</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Reason</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500">Status</th>
                    <th className="pb-4 font-semibold text-sm text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaves.map(leave => (
                    <tr key={leave.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{leave.studentName}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-700">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-sm text-gray-500 max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold",
                          leave.status === 'approved' ? "bg-green-50 text-green-600" :
                          leave.status === 'rejected' ? "bg-red-50 text-red-600" :
                          "bg-orange-50 text-orange-600"
                        )}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {leave.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateLeaveStatus(leave.id, 'approved')}
                              className="btn-ghost text-green-600 hover:bg-green-50"
                              title="Approve Leave"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleUpdateLeaveStatus(leave.id, 'rejected')}
                              className="btn-icon-red"
                              title="Reject Leave"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500 italic">
                        No leave requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <FacultySchedule students={students} />
        )}

        {activeTab === 'live-classes' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Live Classes</h3>
                <p className="text-sm text-gray-500">Manage your virtual classrooms and live sessions.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingSessionId(null);
                  setNewSessionTitle('');
                  setNewSessionStudentIds([]);
                  setNewSessionDate('');
                  setNewSessionType('live');
                  setShowCreateSessionModal(true);
                }}
                className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
              >
                <Video className="w-4 h-4" /> Create Live Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{session.title}</h4>
                      {session.type === 'demo' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Demo Class
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      session.status === 'live' ? "bg-red-100 text-red-700" : 
                      session.status === 'scheduled' ? "bg-blue-100 text-blue-700" : 
                      "bg-gray-100 text-gray-700"
                    )}>
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 mb-6 text-sm text-gray-600 flex-1">
                    {session.students && session.students.length > 0 ? (
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 mt-1 shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {session.students.map((s: any) => (
                            <span key={s.id} className="bg-gray-100 px-2 py-0.5 rounded-md text-xs">{s.name}</span>
                          ))}
                        </div>
                      </div>
                    ) : session.studentName && (
                      <p className="flex items-center gap-2"><Users className="w-4 h-4" /> {session.studentName}</p>
                    )}
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(session.scheduledFor).toLocaleString()}</p>
                    {session.recordingUrl && (
                      <div className="mt-4">
                        <div className="aspect-video bg-black rounded-xl overflow-hidden">
                          <SecureVideoPlayer url={session.recordingUrl} title="Live Session Recording" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {session.status !== 'completed' && (
                      <button 
                        onClick={async () => {
                          window.open(`/classroom/${session.roomId}`, '_blank');
                          if (session.status === 'scheduled') {
                            try {
                              await updateDoc(doc(db, 'live_sessions', session.id), { status: 'live' });
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${session.id}`);
                            }
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-pink-50 text-pink-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-100 transition-colors"
                      >
                        <Video className="w-4 h-4" /> {session.status === 'scheduled' ? 'Start Class' : 'Join Class'}
                      </button>
                    )}
                    {session.status === 'live' && (
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'live_sessions', session.id), { status: 'completed' });
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${session.id}`);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                      >
                        End Class
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setEditingSessionId(session.id);
                        setNewSessionTitle(session.title);
                        setNewSessionType(session.type || 'live');
                        setNewSessionStudentIds(session.students ? session.students.map((s: any) => s.id) : (session.studentId ? [session.studentId] : []));
                        
                        // Format date for datetime-local input
                        const date = new Date(session.scheduledFor);
                        const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setNewSessionDate(formattedDate);
                        
                        setShowCreateSessionModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                      title="Edit Session"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setSessionToUpdateRecording(session.id);
                        setRecordingUrl(session.recordingUrl || '');
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Add/Edit Recording Link"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setSessionToDelete(session.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {liveSessions.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No live classes scheduled.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>



      {/* Application View Modal */}
      {viewingApplication && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-500 text-white">
              <div>
                <h3 className="text-xl font-bold">Application Details</h3>
                <p className="text-pink-100 text-xs mt-1">Submitted application form data</p>
              </div>
              <button 
                onClick={() => setViewingApplication(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.dob}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Gender</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.gender}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Educational Background</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Highest Qualification</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.qualification}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">University/College</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.university}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Graduation Year</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.graduationYear}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Professional Experience</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Current Role</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.currentRole}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Company</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.company}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Experience (Years)</p>
                      <p className="text-sm font-medium text-gray-900">{viewingApplication.experienceYears}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setViewingApplication(null)}
                className="px-8 py-2 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-100"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-500 text-white">
              <div>
                <h3 className="text-xl font-bold">Grade Submission</h3>
                <p className="text-pink-100 text-xs mt-1">Enter marks before approving</p>
              </div>
              <button 
                onClick={() => setGradingSubmission(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Marks (Max: {gradingSubmission.maxScore})</label>
                <input
                  type="number"
                  min="0"
                  max={gradingSubmission.maxScore}
                  value={gradingMark}
                  onChange={(e) => setGradingMark(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder={`Enter marks out of ${gradingSubmission.maxScore}`}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setGradingSubmission(null)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (gradingMark === '' || gradingMark < 0 || gradingMark > gradingSubmission.maxScore) {
                    alert(`Please enter a valid mark between 0 and ${gradingSubmission.maxScore}`);
                    return;
                  }
                  handleUpdateStatus(
                    gradingSubmission.studentId,
                    gradingSubmission.course,
                    gradingSubmission.topic,
                    gradingSubmission.field,
                    'approved',
                    Number(gradingMark)
                  );
                }}
                className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100"
              >
                Submit Grade & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Live Session Modal */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-600 text-white">
              <div>
                <h3 className="text-xl font-bold">{editingSessionId ? 'Edit Class' : 'Create Class'}</h3>
                <p className="text-pink-100 text-xs mt-1">{editingSessionId ? 'Update virtual classroom details' : 'Start a new virtual classroom'}</p>
              </div>
              <button 
                onClick={() => setShowCreateSessionModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="sessionType" 
                      value="live" 
                      checked={newSessionType === 'live'} 
                      onChange={() => setNewSessionType('live')}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">Live Class</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="sessionType" 
                      value="demo" 
                      checked={newSessionType === 'demo'} 
                      onChange={() => setNewSessionType('demo')}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">Demo Class</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Title</label>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., Introduction to Production Art Engineer"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled For</label>
                <input
                  type="datetime-local"
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Students</label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {students
                    .filter(s => newSessionType === 'demo' ? (s.registeredForDemo && !s.isApproved) : s.isApproved)
                    .map(s => (
                    <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newSessionStudentIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSessionStudentIds([...newSessionStudentIds, s.id]);
                          } else {
                            setNewSessionStudentIds(newSessionStudentIds.filter(id => id !== s.id));
                          }
                        }}
                        className="text-pink-600 focus:ring-pink-500 rounded"
                      />
                      <span className="text-sm text-gray-700">{s.name} ({s.username})</span>
                    </label>
                  ))}
                  {students.filter(s => newSessionType === 'demo' ? (s.registeredForDemo && !s.isApproved) : s.isApproved).length === 0 && (
                    <p className="text-sm text-gray-500 p-2 text-center">No students available for this type.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowCreateSessionModal(false)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!newSessionTitle.trim()) {
                    alert('Please enter a class title');
                    return;
                  }
                  if (!newSessionDate) {
                    alert('Please select a date and time');
                    return;
                  }
                  if (newSessionStudentIds.length === 0) {
                    alert('Please select at least one student');
                    return;
                  }
                  
                  const selectedStudents = students
                    .filter(s => newSessionStudentIds.includes(s.id))
                    .map(s => ({ id: s.id, name: s.name }));
                  
                  if (editingSessionId) {
                    updateDoc(doc(db, 'live_sessions', editingSessionId), {
                      title: newSessionTitle,
                      students: selectedStudents,
                      studentIds: selectedStudents.map(s => s.id),
                      scheduledFor: new Date(newSessionDate).toISOString(),
                      type: newSessionType
                    }).then(() => {
                      setShowCreateSessionModal(false);
                      setEditingSessionId(null);
                      setNewSessionTitle('');
                      setNewSessionStudentIds([]);
                      setNewSessionDate('');
                    }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${editingSessionId}`));
                  } else {
                    const roomId = `EndlessSpark-${Math.random().toString(36).substring(2, 10)}`;
                    addDoc(collection(db, 'live_sessions'), {
                      title: newSessionTitle,
                      roomId,
                      facultyId: facultyUser?.id,
                      facultyName: facultyUser?.name,
                      students: selectedStudents,
                      studentIds: selectedStudents.map(s => s.id),
                      scheduledFor: new Date(newSessionDate).toISOString(),
                      status: 'scheduled',
                      type: newSessionType,
                      createdAt: new Date().toISOString()
                    }).then(() => {
                      setShowCreateSessionModal(false);
                      setNewSessionTitle('');
                      setNewSessionStudentIds([]);
                      setNewSessionDate('');
                    }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'live_sessions'));
                  }
                }}
                className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-100"
              >
                {editingSessionId ? 'Save Changes' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Live Class?</h3>
              <p className="text-gray-500 text-sm">
                Are you sure you want to delete this live class? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setSessionToDelete(null)}
                className="btn-secondary flex-1 py-3"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteDoc(doc(db, 'live_sessions', sessionToDelete))
                    .then(() => setSessionToDelete(null))
                    .catch(err => handleFirestoreError(err, OperationType.DELETE, `live_sessions/${sessionToDelete}`));
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Recording URL Modal */}
      {sessionToUpdateRecording && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Add Recording Link</h3>
                <p className="text-blue-100 text-xs mt-1">Provide a Google Drive link to the recording</p>
              </div>
              <button 
                onClick={() => setSessionToUpdateRecording(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Link</label>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setSessionToUpdateRecording(null)}
                className="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateDoc(doc(db, 'live_sessions', sessionToUpdateRecording), {
                    recordingUrl
                  }).then(() => {
                    setSessionToUpdateRecording(null);
                    setRecordingUrl('');
                  }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `live_sessions/${sessionToUpdateRecording}`));
                }}
                className="btn-primary bg-blue-600 hover:bg-blue-700 shadow-blue-100 px-6 py-2"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
