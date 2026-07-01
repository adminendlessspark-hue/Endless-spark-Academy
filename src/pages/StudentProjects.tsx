import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, MessageSquare, ChevronDown, ChevronUp, Image, Download, ExternalLink, Trash2, CheckCircle2, Globe, Info } from 'lucide-react';
import { cn } from '../utils';
import { StudentProject } from '../types';
import { extractReworkItems } from '../components/ProductionReworkChecklist';

export default function StudentProjects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StudentProject[]>([]);
  const [expandedRow, setExpandedRow] = useState<Record<string, boolean>>({});
  const [localFinalFileLinks, setLocalFinalFileLinks] = useState<Record<string, string>>({});

  const toggleRow = (id: string) => {
    setExpandedRow(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!user?.id) return;
    const projectsQuery = query(
      collection(db, 'student_projects'),
      where('studentId', '==', user.id)
    );
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StudentProject)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'student_projects'));

    return () => unsubProjects();
  }, [user?.id]);

  // Auto-pilot: Automatically share any associated Google Drive files to avoid permission / edit approval prompts
  useEffect(() => {
    if (projects.length === 0 || user?.role !== 'student' || !user?.email) return;

    projects.forEach(project => {
      // 1. Share assigned templates / files with the logged in student
      const assignedLinks = [project.googleDriveLink, project.adobeCloudLink];
      assignedLinks.forEach(link => {
        if (link && link.includes('drive.google.com')) {
          fetch('/api/share-drive-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driveUrl: link, studentEmail: user.email, role: 'writer' })
          }).catch(err => console.error("Error auto-sharing assigned link in list:", err));
        }
      });

      // 2. Share student submitted files with adminendlessspark@gmail.com
      const submittedLinks = [project.projectFileUrl];
      submittedLinks.forEach(link => {
        if (link && link.includes('drive.google.com')) {
          fetch('/api/share-drive-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driveUrl: link, studentEmail: 'adminendlessspark@gmail.com', role: 'writer' })
          }).catch(err => console.error("Error auto-sharing submitted link with admin in list:", err));
        }
      });
    });
  }, [projects, user?.id, user?.email, user?.role]);

  const handleWorkStatusChange = async (project: StudentProject, newWorkStatus: string) => {
    // QC Protection
    if (project.status === 'qc' || project.status === 'approved') {
      if (user?.role === 'student') {
        alert("Action Denied: Only Admins and QC Reviewers are permitted to modify project details or change task status once in the QC stage.");
        return;
      }
    }

    const updates: any = {
      workStatus: newWorkStatus,
      updatedAt: new Date().toISOString()
    };

    // Remove old google path when starting rework
    if (newWorkStatus === 'In Progress' && (project.qcRejections && project.qcRejections.length > 0)) {
      updates.projectFileUrl = '';
      updates.googleDriveLink = '';
      setLocalFinalFileLinks(prev => ({ ...prev, [project.id]: '' }));
    }

    // Timer logic based on status
    if (newWorkStatus === 'In Progress') {
      if (!project.isTimerRunning) {
        updates.isTimerRunning = true;
        updates.lastTimerStart = new Date().toISOString();
      }
    } else {
      // If stopping or completing, stop the timer
      if (project.isTimerRunning && project.lastTimerStart) {
        const startTime = new Date(project.lastTimerStart).getTime();
        const endTime = Date.now();
        const sessionTimeMinutes = Math.ceil((endTime - startTime) / 60000);
        
        updates.isTimerRunning = false;
        updates.lastTimerStart = null;
        updates.actualTime = (project.actualTime || 0) + sessionTimeMinutes;
      }
    }

    if (newWorkStatus === 'Completed') {
      const stages = ['client', 'preflight', 'production', 'pqc', 'qc', 'approved'];
      const currentStageIndex = stages.indexOf(project.status || 'client');

      // Calculate total actual time after this operation
      const sessionTime = project.isTimerRunning && project.lastTimerStart
        ? Math.ceil((Date.now() - new Date(project.lastTimerStart).getTime()) / 60000)
        : 0;
      
      const totalTimeAfter = (project.actualTime || 0) + sessionTime;
      const lastStageTime = project.lastStageActualTime || 0;
      
      // Enforce some work in the current stage
      if (totalTimeAfter <= lastStageTime) {
        alert('Action Required: You must record some work for this stage using the timer before you can mark it as "Completed".');
        return;
      }

      // Quality Rules: Ensure checklists are completed before progressing
      const hasPending = (obj: any): boolean => {
        if (!obj) return false;
        if (Array.isArray(obj)) return obj.some(item => item === 'pending' || hasPending(item));
        if (typeof obj === 'object') return Object.values(obj).some(val => val === 'pending' || hasPending(val));
        return false;
      };

      // Quality Rules: Ensure rework is fully completed if there are any flagged items
      if (project.qcProduction) {
        const reworkFiles = extractReworkItems(project.qcProduction);
        if (reworkFiles.length > 0) {
          const reworkData = (project as any).reworkChecklist || {};
          const hasIncompleteRework = reworkFiles.some(item => reworkData[item.id] !== 'completed');
          if (hasIncompleteRework) {
            alert('Quality Rule Violation: You have pending rework items. Please complete and mark all QC rework items as "Completed" on the Rework Checklist before progressing.');
            return;
          }
        }
      }

      if (project.status === 'preflight') {
        const preflight = (project as any).digitalPreflight;
        if (!preflight) {
          alert('Quality Rule Violation: You must complete and SAVE the Digital Pre-Flight Checklist before progressing to the Production stage.');
          return;
        }

        if (hasPending(preflight) || !preflight.clientName || !preflight.projectNumber) {
          alert('Quality Rule Violation: Your Digital Pre-Flight Checklist is incomplete. Please ensure all "Pending/Select" fields are marked (Yes/No/NA/Query) and head info is filled.');
          return;
        }
      }

      if (project.status === 'pqc') {
        const currentLink = localFinalFileLinks[project.id]?.trim() || project.projectFileUrl?.trim() || '';
        if (!currentLink) {
          const promptLink = prompt(
            "Quality Rule Violation: You must submit a Google Drive share link before completing the Production QC (PQC) stage.\n\nPlease paste your Google Drive link below to automatically submit to QC:"
          );
          if (promptLink === null) {
            alert('Submission Cancelled: Google Drive link is required to complete this stage.');
            return;
          }
          if (!promptLink.trim()) {
            alert('Error: The Google Drive Submission Link cannot be empty.');
            return;
          }
          setLocalFinalFileLinks(prev => ({ ...prev, [project.id]: promptLink.trim() }));
          updates.projectFileUrl = promptLink.trim();
        } else {
          updates.projectFileUrl = currentLink;
        }

        const pqc = (project as any).digitalProduction;
        if (!pqc) {
          alert('Quality Rule Violation: You must complete and SAVE the Production Art Engineer PQC Checklist before submitting for QC Review.');
          return;
        }

        if (hasPending(pqc)) {
          alert('Quality Rule Violation: Your Production Art Engineer PQC Checklist is incomplete. Please ensure all "Pending/Select" fields are marked (Yes/No/NA/Query).');
          return;
        }
      }

      const nextIndex = currentStageIndex + 1;
      if (nextIndex < stages.length) {
        updates.status = stages[nextIndex];
        updates.workStatus = stages[nextIndex] === 'qc' ? 'Submitted' : 'Not Started';
        updates.lastStageActualTime = totalTimeAfter;
      }
    }

    try {
      await updateDoc(doc(db, 'student_projects', project.id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
    }
  };

  const handleGoogleDriveSubmit = async (project: StudentProject) => {
    const link = localFinalFileLinks[project.id]?.trim() || '';
    if (!link) {
      alert("Please provide a valid Google Drive link to submit.");
      return;
    }

    const sessionTime = project.isTimerRunning && project.lastTimerStart
      ? Math.ceil((Date.now() - new Date(project.lastTimerStart).getTime()) / 60000)
      : 0;
    const totalTimeAfter = (project.actualTime || 0) + sessionTime;
    const lastStageTime = project.lastStageActualTime || 0;
    
    // New Quality Rule: Block submission if "In Progress"
    if (project.workStatus === 'In Progress' || project.isTimerRunning) {
      alert("Action Required: Your work is still 'In Progress' or the timer is running. Please STOP the timer or set your stage status to 'Completed' or 'Paused' before submitting files for QC. Students must explicitly close their work session before submission.");
      return;
    }

    if (totalTimeAfter <= lastStageTime) {
      alert("Action Required: You must record some work for this stage using the timer before you can submit files for QC.");
      return;
    }

    // Quality Rule: Ensure rework is fully completed if there are any flagged items
    if (project.qcProduction) {
      const reworkFiles = extractReworkItems(project.qcProduction);
      if (reworkFiles.length > 0) {
        const reworkData = (project as any).reworkChecklist || {};
        const hasIncompleteRework = reworkFiles.some(item => reworkData[item.id] !== 'completed');
        if (hasIncompleteRework) {
          alert('Quality Rule Violation: You have pending rework items. Please complete and mark all QC rework items as "Completed" on the Rework Checklist before submitting for QC Review.');
          return;
        }
      }
    }

    // Quality Rule: Ensure PQC checklist is done before QC submission
    if (project.status === 'pqc') {
      const pqc = (project as any).digitalProduction;
      const hasPending = (obj: any): boolean => {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.some(item => item === 'pending' || hasPending(item));
        if (typeof obj === 'object') return Object.values(obj).some(val => val === 'pending' || hasPending(val));
        return false;
      };

      if (!pqc || hasPending(pqc)) {
        alert('Quality Rule Violation: You must complete and SAVE the Production Art Engineer PQC Checklist (all points) before submitting for QC Review.');
        return;
      }
    } else if (project.status !== 'qc' && project.status !== 'approved') {
      alert(`Quality Rule Violation: You are currently in the "${project.status}" stage. You must progress through the stages in sequence (Pre-Flight -> Production -> PQC) before submitting for QC Review.`);
      return;
    }

    const updates: any = {
      projectFileUrl: link,
      status: 'qc',
      workStatus: 'Submitted',
      lastStageActualTime: totalTimeAfter,
      updatedAt: new Date().toISOString()
    };
    
    // Stop timer if it was running
    if (project.isTimerRunning && project.lastTimerStart) {
      const startTime = new Date(project.lastTimerStart).getTime();
      const endTime = Date.now();
      const sessionTimeMinutes = Math.ceil((endTime - startTime) / 60000);
      updates.isTimerRunning = false;
      updates.lastTimerStart = null;
      updates.actualTime = (project.actualTime || 0) + sessionTimeMinutes;
    }

    try {
      await updateDoc(doc(db, 'student_projects', project.id), updates);
      alert("Project submitted successfully for QC review! The status has been updated to QC.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['client', 'preflight', 'production', 'pqc', 'qc', 'approved'];
    return steps.indexOf(status);
  };

  if (!user?.isApproved) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-500">You must be an approved student to view projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your tasks</h1>
            <p className="text-gray-500">{projects.length} Tasks Found</p>
          </div>
        </div>
      </div>

      {/* Query Tracker Integration in Project Dashboard */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-100/70 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm text-left">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Need Help? Query Support Desk</h3>
            <p className="text-sm text-slate-600">
              Do you have doubt with project brief, design specifications, file downloads or technical software difficulties?
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Raise queries directly regarding any task and receive fast answers from QC and faculty review mentors.
            </p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <Link
            to="/queries"
            className="flex-1 md:flex-none text-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            Open Query Desk
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Projects Assigned</h3>
          <p className="text-gray-500">You don't have any projects assigned yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 bg-gray-50/30 uppercase tracking-wider text-left">
                <th className="py-3 px-4 w-10">
                </th>
                <th className="py-3 px-4">Thumbnail</th>
                <th className="py-3 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100/50">
                  Project Number <ChevronDown className="w-3 h-3" />
                </th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100/50">
                  Job Description <ChevronDown className="w-3 h-3" />
                </th>
                <th className="py-3 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100/50">
                  Item Description <ChevronDown className="w-3 h-3" />
                </th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100/50">
                  Task Name <ChevronDown className="w-3 h-3" />
                </th>
                <th className="py-3 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100/50">
                  Task Status <ChevronDown className="w-3 h-3" />
                </th>
                <th className="py-3 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100/50">
                  Item Due <ChevronDown className="w-3 h-3" />
                </th>
                <th className="py-3 px-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100/50 text-[#e4573d]">
                  Task Due <ChevronDown className="w-3 h-3" />
                </th>
                <th className="py-3 px-4">Drive</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <React.Fragment key={project.id}>
                  <tr className="border-b border-orange-100/30 hover:bg-orange-50/20 transition-colors group">
                    <td className="py-3 px-4">
                      <button onClick={() => toggleRow(project.id)} className="text-gray-400 hover:text-gray-600 outline-none p-1 rounded hover:bg-gray-100">
                        {expandedRow[project.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 mx-auto overflow-hidden shadow-sm">
                        <Image className="w-4 h-4" />
                      </div>
                    </td>
                  <td className="py-3 px-4 text-[#e4573d] font-bold text-sm cursor-pointer hover:underline" onClick={() => navigate(`/project/${project.id}`)}>
                    {project.clientBrief?.projectNumber || project.projectCode || project.id.substring(0, 8)}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400"></td>
                  <td className="py-3 px-4 text-[#e4573d] font-bold text-xs max-w-[220px] whitespace-normal break-words cursor-pointer hover:underline uppercase" onClick={() => navigate(`/project/${project.id}`)}>
                    {project.title}
                  </td>
                  <td className="py-3 px-4 text-orange-400 font-medium text-xs max-w-[220px] whitespace-normal break-words cursor-pointer hover:underline" onClick={() => navigate(`/project/${project.id}`)}>
                    {project.courseName || project.details}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button className="text-blue-500 hover:text-blue-600 transition-colors p-1" title="View details">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-blue-500 font-bold text-xs cursor-pointer hover:underline" onClick={() => navigate(`/project/${project.id}`)}>
                    {project.status === 'client' ? '0 - Client Brief' :
                     project.status === 'preflight' ? '0 - Prepress / Assembly' :
                     project.status === 'production' ? '1 - Production Art' :
                     project.status === 'pqc' ? '2 - Production QC' :
                     project.status === 'qc' ? '3 - QC' :
                     project.status === 'approved' ? '4 - Approved' : project.status}
                  </td>
                  <td className="py-3 px-4">
                    {((project.status === 'qc' || project.status === 'approved') && user?.role === 'student') ? (
                      <span className={cn(
                        "px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider border inline-block leading-none",
                        project.status === 'approved' ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700"
                      )}>
                        {project.status === 'approved' ? 'Approved' : (project.workStatus || 'Submitted')}
                      </span>
                    ) : (
                      <div className="relative inline-block w-36">
                        <select
                          value={project.workStatus || 'Not Started'}
                          onChange={(e) => handleWorkStatusChange(project, e.target.value)}
                          className={cn(
                            "appearance-none w-full pl-6 pr-6 py-1 rounded text-xs font-bold border transition-all cursor-pointer outline-none shadow-sm",
                            project.workStatus === 'Paused' ? "bg-orange-50 border-orange-200 text-orange-600" :
                            project.workStatus === 'In Progress' ? "bg-blue-50 border-blue-100 text-blue-600" :
                            project.workStatus === 'Completed' ? "bg-green-50 border-green-200 text-green-600" :
                            "bg-white border-gray-200 text-gray-500"
                          )}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Paused">Paused</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none text-gray-400">
                          <ChevronDown className="w-3 h-3" />
                        </div>
                        <div className={cn(
                          "absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none",
                          project.workStatus === 'Paused' ? "bg-orange-400" :
                          project.workStatus === 'In Progress' ? "bg-blue-500" :
                          project.workStatus === 'Completed' ? "bg-green-500" :
                          "bg-gray-300 border border-gray-400"
                        )} />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-orange-400 font-bold text-[10px] whitespace-nowrap">
                    {project.slaDate ? new Date(project.slaDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '') : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-[#e4573d] text-white px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                      {project.createdAt ? new Date(project.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '') : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {project.googleDriveLink ? (
                      <div className="flex flex-col items-center gap-1">
                        <a 
                          href={project.googleDriveLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                          title="Open Google Drive Folder"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                        <span className="text-[8px] text-gray-400 font-medium">Read Only</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">No Link</span>
                    )}
                  </td>
                </tr>
                {expandedRow[project.id] && (
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={12} className="p-6">
                      <div className="space-y-8">
                        {/* Status Roadmap */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Project Roadmap</h4>
                          <div className="relative flex items-center justify-between">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                            <div 
                              className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500" 
                              style={{ width: `${(getStatusStep(project.status) / 5) * 100}%` }}
                            />
                            
                            {[
                              { id: 'client', label: 'Client Brief', desc: 'Requirements' },
                              { id: 'preflight', label: 'Preflight', desc: 'Verification' },
                              { id: 'production', label: 'Production', desc: 'Working' },
                              { id: 'pqc', label: 'Production QC', desc: 'Internal Check' },
                              { id: 'qc', label: 'QC', desc: 'Final Review' },
                              { id: 'approved', label: 'Approved', desc: 'Done' }
                            ].map((step, idx) => {
                              const isActive = getStatusStep(project.status) >= idx;
                              const isCurrent = project.status === step.id;
                              return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                    isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110" :
                                    isActive ? "bg-blue-500 text-white" : "bg-white border-2 border-gray-200 text-gray-300"
                                  )}>
                                    {isActive && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{idx}</span>}
                                  </div>
                                  <div className="mt-2 text-center">
                                    <p className={cn("text-[10px] font-bold uppercase", isCurrent ? "text-blue-600" : "text-gray-500")}>{step.label}</p>
                                    <p className="text-[9px] text-gray-400">{step.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Google Drive Link input - integrated directly under the Roadmap */}
                          {project.status === 'pqc' && (
                            <div className="mt-6 pt-4 border-t border-gray-100 text-left">
                              <label className="text-[10px] font-extrabold text-green-800 uppercase tracking-wider block mb-1">
                                Google Drive Submission Link
                              </label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Globe className="w-3.5 h-3.5 text-green-600" />
                                  </div>
                                  <input 
                                    type="text"
                                    value={localFinalFileLinks[project.id] ?? project.projectFileUrl ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setLocalFinalFileLinks(prev => ({ ...prev, [project.id]: val }));
                                      // Logically save on input change
                                      updateDoc(doc(db, 'student_projects', project.id), {
                                        projectFileUrl: val,
                                        updatedAt: new Date().toISOString()
                                      });
                                    }}
                                    placeholder="Paste Google Drive folder or file link"
                                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-green-200 bg-white focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
                                  />
                                </div>
                                <button
                                  onClick={() => handleGoogleDriveSubmit(project)}
                                  disabled={!(localFinalFileLinks[project.id]?.trim() || project.projectFileUrl?.trim())}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 uppercase tracking-widest cursor-pointer disabled:opacity-50"
                                >
                                  Submit Link
                                </button>
                              </div>
                              <p className="text-[9px] text-gray-400 mt-1 leading-normal italic">
                                Please ensure download permission is enabled so that the Quality Control team can access your final design artifacts.
                              </p>
                            </div>
                          )}

                          {/* Completed/Reviewed Link Status */}
                          {(project.status === 'qc' || project.status === 'approved') && project.projectFileUrl && (
                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-left">
                              <div>
                                <h5 className="font-bold text-xs text-gray-950">Submitted Google Drive Path</h5>
                                <p className="text-[10px] text-gray-400">Currently in QC review or Approved status.</p>
                              </div>
                              <a 
                                href={project.projectFileUrl.match(/^https?:\/\//i) ? project.projectFileUrl : `https://${project.projectFileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> View Submitted Link
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Correction PDF Alert */}
                        {project.correctionPdfUrl && (
                          <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 animate-pulse-slow">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200">
                                <MessageSquare className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-red-900">QC Feedback Received</h4>
                                <p className="text-sm text-red-700 mb-4 font-medium">The Quality Control team has requested corrections. Please download the feedback PDF below, make the required changes, and re-submit your artwork.</p>
                                <div className="flex flex-wrap gap-3">
                                  <a 
                                    href={project.correctionPdfUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-100"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download Correction PDF
                                  </a>
                                  {project.qcRejections && project.qcRejections.length > 0 && (
                                    <div className="w-full mt-4 p-4 bg-white/50 rounded-2xl border border-red-100">
                                      <p className="text-xs font-bold text-red-800 uppercase mb-2">Latest Rejection Reason ({project.qcRejections[project.qcRejections.length - 1].errorCategory})</p>
                                      <p className="text-sm text-red-700 italic">"{project.qcRejections[project.qcRejections.length - 1].notes}"</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Project Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 mb-2">Project Details</h4>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                              {project.details || 'No details provided.'}
                            </div>
                          </div>

                          {/* Project Resources */}
                          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <FolderKanban className="w-4 h-4 text-blue-600" />
                              Project Resources
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {project.googleDriveLink && (
                                <a 
                                  href={project.googleDriveLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm text-xs"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Google Drive Folder
                                </a>
                              )}
                              {project.cloudPath && (
                                <div className="text-xs text-gray-500 font-medium italic py-2">
                                  Access project files directly via Cloud Server (see below for instructions).
                                </div>
                              )}
                            </div>
                          </div>


                          {/* Project Queries & Doubts */}
                          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                                Project Support Queries
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Getting stuck on layout directions or have design specification queries for Project <span className="font-mono font-bold bg-slate-100 px-1 py-0.5 rounded text-slate-800">{project.clientBrief?.projectNumber || project.projectCode || project.id.substring(0, 8)}</span>?
                              </p>
                              <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/60 text-[11px] text-emerald-800 mt-3 text-left">
                                <p className="font-semibold mb-1">Doubts support benefits:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                                  <li>Raise direct design/layout tickets</li>
                                  <li>Submit and track queries right here</li>
                                  <li>Receive mentor check-offs & answers</li>
                                </ul>
                              </div>
                            </div>

                            <div className="pt-2">
                              <button
                                onClick={() => {
                                  navigate('/queries', { 
                                    state: { 
                                      projectNumber: project.clientBrief?.projectNumber || project.projectCode || project.id.substring(0, 8), 
                                      selectAndOpenRaise: true 
                                    } 
                                  });
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                              >
                                <MessageSquare className="w-4 h-4 text-white" />
                                Raise Query For This Task
                              </button>
                            </div>
                          </div>
                        </div>

                        {project.isFilesCleanedUp && (
                          <div className="w-full bg-gray-100/50 border border-gray-200 rounded-3xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                              <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-700">Project Files Archived</h5>
                              <p className="text-sm text-gray-500">Cloud files for this project have been removed to save costs as the project is complete.</p>
                            </div>
                          </div>
                        )}

                          {/* Cloud Server Connection Info */}
                          {project.cloudPath && (
                            <div className="w-full mt-6 bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                  <FolderKanban className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-indigo-900">Direct Cloud Access (No Download Needed)</h4>
                                  <p className="text-xs text-indigo-600">Mount this as a network drive to save work directly to the server.</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-white p-3 rounded-xl border border-indigo-100">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Server Path / URL</p>
                                  <code className="text-sm font-mono text-indigo-700 break-all">{project.cloudPath}</code>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-indigo-100">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Credentials</p>
                                  <p className="text-sm font-medium text-gray-900">Use your Student Username & Password</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="p-3 bg-white/50 rounded-xl">
                                  <h5 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-500" /> Windows Instructions
                                  </h5>
                                  <ol className="text-xs text-gray-600 list-decimal pl-4 space-y-1">
                                    <li>Open "This PC" in File Explorer.</li>
                                    <li>Click "Map network drive" in the top menu.</li>
                                    <li>Paste the Server URL above.</li>
                                    <li>Check "Connect using different credentials" and use your student login.</li>
                                  </ol>
                                </div>

                                <div className="p-3 bg-white/50 rounded-xl">
                                  <h5 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500" /> macOS Instructions
                                  </h5>
                                  <ol className="text-xs text-gray-600 list-decimal pl-4 space-y-1">
                                    <li>In Finder, press <kbd className="bg-gray-100 px-1 rounded border">Cmd + K</kbd>.</li>
                                    <li>Paste the Server URL and click "Connect".</li>
                                    <li>Select "Registered User" and enter your student credentials.</li>
                                  </ol>
                                </div>
                              </div>
                            </div>
                          )}
                        
                        {/* Client Brief */}
                        {project.clientBrief && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 mb-2">Client Brief</h4>
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                <div className="p-3 border-b border-gray-100 last:border-b-0 md:border-r">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Project Number</span>
                                  <span className="text-gray-900 font-medium font-mono">{project.clientBrief.projectNumber || 'Pending'}</span>
                                </div>
                                {Object.entries(project.clientBrief).map(([key, value]) => {
                                  if (key === 'jobBrief' || key === 'projectNumber') return null;
                                  return (
                                    <div key={key} className="p-3 border-b border-gray-100 md:border-r last:border-b-0">
                                      <span className="block text-[10px] font-medium text-gray-500 uppercase mb-1">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                      <span className="block text-gray-900 font-medium">
                                        {value || '-'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              {project.clientBrief.jobBrief && (
                                <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                                  <span className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Job Brief</span>
                                  <div className="text-gray-700 whitespace-pre-wrap">
                                    {project.clientBrief.jobBrief}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Printer Specification */}
                        {project.printerSpec && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 mb-2">Printer Specification</h4>
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-4 space-y-4 text-sm">
                              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                                <div><span className="block text-[10px] text-gray-500 uppercase">Printer Name</span><span className="font-medium text-gray-900">{project.printerSpec.printerName || '-'}</span></div>
                                <div><span className="block text-[10px] text-gray-500 uppercase">Print Method</span><span className="font-medium text-gray-900">{project.printerSpec.printMethod || '-'}</span></div>
                                <div><span className="block text-[10px] text-gray-500 uppercase">Substrate</span><span className="font-medium text-gray-900">{project.printerSpec.printingSubstrate || '-'}</span></div>
                                <div><span className="block text-[10px] text-gray-500 uppercase">Face/Reverse</span><span className="font-medium text-gray-900">{project.printerSpec.faceReversePrint || '-'}</span></div>
                                <div><span className="block text-[10px] text-gray-500 uppercase">Max Colors</span><span className="font-medium text-gray-900">{project.printerSpec.maxColors || '-'}</span></div>
                                <div><span className="block text-[10px] text-gray-500 uppercase">Varnish</span><span className="font-medium text-gray-900">{project.printerSpec.varnishIncluded || '-'}</span></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
