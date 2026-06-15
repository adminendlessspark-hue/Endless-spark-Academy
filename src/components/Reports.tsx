import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User } from '../types';
import { Download, Users, Clock, Calendar, Phone, FileText, ClipboardList, FolderKanban } from 'lucide-react';

import { useAuth } from '../AuthContext';

export default function Reports({ role, userId }: { role: 'admin' | 'faculty', userId?: string }) {
  const [students, setStudents] = useState<User[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [telecallers, setTelecallers] = useState<User[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setStudents(allUsers.filter(u => u.role === 'student' && u.isApproved));
      setFaculty(allUsers.filter(u => u.role === 'faculty'));
      setTelecallers(allUsers.filter(u => u.role === 'telecaller'));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubSlots = onSnapshot(collection(db, 'schedule_slots'), (snapshot) => {
      setScheduleSlots(snapshot.docs.map(doc => doc.data()));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'schedule_slots'));

    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'leads'));

    const unsubProjects = onSnapshot(collection(db, 'student_projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'student_projects'));

    return () => {
      unsubUsers();
      unsubSlots();
      unsubLeads();
      unsubProjects();
    };
  }, []);

  const isWithinDateRange = (dateStr: string | number | undefined) => {
    if (!dateStr) return false;
    if (!startDate && !endDate) return true;
    
    const date = new Date(dateStr);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    
    if (start && date < start) return false;
    if (end && date > end) return false;
    
    return true;
  };

  const downloadStudentComplianceReport = () => {
    let csv = 'Student ID,Name,Email,Joining Date,Target Classes,Attended Classes,Attendance %,Status,Telecaller Name\n';
    
    const relevantStudents = role === 'faculty' ? students.filter(s => s.assignedFacultyId === userId) : students;
    const filteredStudents = relevantStudents.filter(s => isWithinDateRange(s.admissionDate || s.createdAt));

    filteredStudents.forEach(student => {
      const joiningDate = new Date(student.admissionDate || student.createdAt || Date.now());
      const today = new Date();
      const daysSinceJoining = Math.max(1, Math.floor((today.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24)));
      const monthsSinceJoining = Math.max(1, Math.ceil(daysSinceJoining / 30));
      const targetClasses = monthsSinceJoining * 20;
      
      const legacyAttendance = student.dailyAttendance?.filter(a => a.status === 'approved').length || 0;
      const studentSlots = scheduleSlots.filter(s => s.studentId === student.id);
      const newAttendance = studentSlots.filter(s => s.status === 'completed').length;
      const totalAttended = legacyAttendance + newAttendance;
      
      const attendancePercentage = Math.min(100, Math.round((totalAttended / targetClasses) * 100));
      const status = attendancePercentage >= 80 ? 'Compliant' : 'Non-Compliant';
      const telecallerName = (student as any).telecallerName || '';

      csv += `"${student.studentId || ''}","${student.name}","${student.email}","${joiningDate.toLocaleDateString()}","${targetClasses}","${totalAttended}","${attendancePercentage}%","${status}","${telecallerName}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_compliance_report.csv';
    a.click();
  };

  const downloadFacultyHoursReport = () => {
    let csv = 'Faculty Name,Email,Total Scheduled Slots,Completed Slots,Missed Slots,Total Hours Taught\n';
    
    const relevantFaculty = role === 'faculty' ? faculty.filter(f => f.id === userId) : faculty;
    const filteredSlots = scheduleSlots.filter(s => isWithinDateRange(s.date));

    relevantFaculty.forEach(fac => {
      const facSlots = filteredSlots.filter(s => s.facultyId === fac.id);
      const totalSlots = facSlots.length;
      const completedSlots = facSlots.filter(s => s.status === 'completed').length;
      const missedSlots = facSlots.filter(s => s.status === 'missed').length;
      const totalHours = completedSlots * 2; // Each slot is 2 hours

      csv += `"${fac.name}","${fac.email}","${totalSlots}","${completedSlots}","${missedSlots}","${totalHours}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty_hours_report.csv';
    a.click();
  };

  const downloadDetailedAttendanceReport = () => {
    let csv = 'Date,Student Name,Faculty Name,Start Time,End Time,Type,Status,Clock In,Clock Out\n';
    
    let relevantSlots = scheduleSlots;
    if (role === 'faculty') {
      relevantSlots = scheduleSlots.filter(s => s.facultyId === userId);
    }
    
    const filteredSlots = relevantSlots.filter(s => isWithinDateRange(s.date));

    filteredSlots.forEach(slot => {
      const student = students.find(s => s.id === slot.studentId);
      const fac = faculty.find(f => f.id === slot.facultyId);
      
      csv += `"${slot.date}","${student?.name || slot.studentName}","${fac?.name || ''}","${slot.startTime}","${slot.endTime}","${slot.type}","${slot.status}","${slot.clockInTime ? new Date(slot.clockInTime).toLocaleTimeString() : ''}","${slot.clockOutTime ? new Date(slot.clockOutTime).toLocaleTimeString() : ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detailed_attendance_report.csv';
    a.click();
  };

  const downloadLeadsReport = () => {
    let csv = 'Lead Name,Phone,Email,Company,Role,Experience,Status,Created At,Telecaller Name\n';
    
    const filteredLeads = leads.filter(l => isWithinDateRange(l.createdAt));

    filteredLeads.forEach(lead => {
      const telecaller = telecallers.find(t => t.id === lead.assignedTo);
      const telecallerName = telecaller?.name || 'Unassigned';
      const createdAt = new Date(lead.createdAt).toLocaleDateString();
      
      csv += `"${lead.name}","${lead.phone}","${lead.email}","${lead.companyName || ''}","${lead.currentRole || ''}","${lead.workExperience || ''}","${lead.status}","${createdAt}","${telecallerName}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_crm_report.csv';
    a.click();
  };

  const downloadDemoReport = () => {
    let csv = 'Student Name,Email,Phone,Work Location,Current City,Preferred Date,Preferred Time,Status,Assigned Faculty\n';
    
    const demoStudents = students.filter(s => s.registeredForDemo);
    const filteredStudents = demoStudents.filter(s => isWithinDateRange(s.demoData?.preferredDate || s.createdAt));

    filteredStudents.forEach(student => {
      const demoData = student.demoData;
      const appData = student.applicationData;
      const phone = appData?.mobileNumber || appData?.phone || '';
      const workLocation = demoData?.workLocation || '';
      const currentCity = demoData?.currentCity || '';
      const preferredDate = demoData?.preferredDate || '';
      const preferredTime = demoData?.preferredTime || '';
      const status = student.isApproved ? 'Approved' : (student.applicationStatus === 'submitted' ? 'Submitted' : (demoData?.completed ? 'Demo Completed' : 'Demo Scheduled'));
      const assignedFaculty = faculty.find(f => f.id === student.assignedFacultyId)?.name || 'Unassigned';

      csv += `"${student.name}","${student.email}","${phone}","${workLocation}","${currentCity}","${preferredDate}","${preferredTime}","${status}","${assignedFaculty}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demo_registrations_report.csv';
    a.click();
  };

  const downloadApplicationReport = () => {
    let csv = 'Student Name,Email,Phone,DOB,Gender,Home Address,Temporary Address,Qualification,University,Graduation Year,Experience,Current Role,Company,Requested Courses,Status,Assigned Faculty\n';
    
    const appliedStudents = students.filter(s => s.applicationData);
    const filteredStudents = appliedStudents.filter(s => isWithinDateRange(s.createdAt));

    filteredStudents.forEach(student => {
      const appData = student.applicationData!;
      const phone = appData.mobileNumber || appData.phone || '';
      const dob = appData.dob || '';
      const gender = appData.gender || '';
      const homeAddress = appData.homeAddress ? appData.homeAddress.replace(/"/g, '""') : '';
      const temporaryAddress = appData.temporaryAddress ? appData.temporaryAddress.replace(/"/g, '""') : '';
      const qualification = appData.qualification ? appData.qualification.replace(/"/g, '""') : '';
      const university = appData.university ? appData.university.replace(/"/g, '""') : '';
      const graduationYear = appData.graduationYear || '';
      const experience = appData.experienceYears || '';
      const currentRole = appData.currentRole ? appData.currentRole.replace(/"/g, '""') : '';
      const company = appData.company ? appData.company.replace(/"/g, '""') : '';
      const requestedCourses = student.requestedCourses ? student.requestedCourses.join('; ') : '';
      
      const status = student.isApproved ? 'Approved' : (student.applicationStatus === 'submitted' ? 'Submitted' : 'Pending');
      const assignedFaculty = faculty.find(f => f.id === student.assignedFacultyId)?.name || 'Unassigned';

      csv += `"${student.name}","${student.email}","${phone}","${dob}","${gender}","${homeAddress}","${temporaryAddress}","${qualification}","${university}","${graduationYear}","${experience}","${currentRole}","${company}","${requestedCourses}","${status}","${assignedFaculty}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_applications_report.csv';
    a.click();
  };

  const downloadProjectsReport = () => {
    let csv = 'Project Number,Student Name,Course,Project Title,Status,SLA Date,Estimated Time (mins),Actual Time (mins),Points,Efficiency %,Created At\n';
    
    const filteredProjects = projects.filter(p => isWithinDateRange(p.createdAt));

    filteredProjects.forEach(project => {
      const createdAt = new Date(project.createdAt).toLocaleDateString();
      const slaDate = project.slaDate ? new Date(project.slaDate).toLocaleDateString() : '';
      const efficiency = project.efficiency ? project.efficiency.toFixed(1) : '0';
      
      csv += `"${project.clientBrief?.projectNumber || project.projectNumber || project.projectCode || ''}","${project.studentName || ''}","${project.courseName || ''}","${project.title}","${project.status}","${slaDate}","${project.estimatedTime || 0}","${project.actualTime || 0}","${project.points || 0}","${efficiency}%","${createdAt}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_projects_report.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-6 h-6 text-pink-600" />
            Download Reports
          </h2>
          
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">From:</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">To:</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs font-bold text-pink-600 hover:text-pink-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Student Compliance</h3>
                <p className="text-sm text-gray-500">Attendance and completion metrics</p>
              </div>
            </div>
            <button
              onClick={downloadStudentComplianceReport}
              className="w-full py-2 bg-pink-50 text-pink-600 rounded-lg font-bold hover:bg-pink-100 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          <div className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Faculty Hours</h3>
                <p className="text-sm text-gray-500">Scheduled and completed teaching hours</p>
              </div>
            </div>
            <button
              onClick={downloadFacultyHoursReport}
              className="w-full py-2 bg-orange-50 text-orange-600 rounded-lg font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          <div className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Detailed Attendance</h3>
                <p className="text-sm text-gray-500">All slots and clock-in times</p>
              </div>
            </div>
            <button
              onClick={downloadDetailedAttendanceReport}
              className="w-full py-2 bg-orange-50 text-orange-600 rounded-lg font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          {role === 'admin' && (
            <div className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Leads CRM Report</h3>
                  <p className="text-sm text-gray-500">All leads and telecaller assignments</p>
                </div>
              </div>
              <button
                onClick={downloadLeadsReport}
                className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          )}

          {role === 'admin' && (
            <div className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Demo Registrations</h3>
                  <p className="text-sm text-gray-500">
                    {students.filter(s => s.registeredForDemo).length} Total • {students.filter(s => s.demoData?.completed).length} Completed
                  </p>
                </div>
              </div>
              <button
                onClick={downloadDemoReport}
                className="w-full py-2 bg-purple-50 text-purple-600 rounded-lg font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          )}

          {role === 'admin' && (
            <div className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Student Applications</h3>
                  <p className="text-sm text-gray-500">
                    {students.filter(s => s.applicationData).length} Total • {students.filter(s => s.isApproved).length} Approved
                  </p>
                </div>
              </div>
              <button
                onClick={downloadApplicationReport}
                className="w-full py-2 bg-pink-50 text-pink-600 rounded-lg font-bold hover:bg-pink-100 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          )}

          {role === 'admin' && (
            <div className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Student Projects</h3>
                  <p className="text-sm text-gray-500">
                    {projects.length} Total • {projects.filter(p => p.status === 'approved').length} Approved
                  </p>
                </div>
              </div>
              <button
                onClick={downloadProjectsReport}
                className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
