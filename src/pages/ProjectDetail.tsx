import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import { StudentProject, StudentQuery } from '../types';
import { downloadDataUrlFile } from './QueryTracker';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, FileText, Play, Square, ExternalLink, Cloud, Calendar, Printer, ChevronDown, ChevronUp, FileCheck, Upload, Download, Loader2, Globe, Lightbulb, HelpCircle } from 'lucide-react';
import { cn } from '../utils';
import { Type, GoogleGenAI } from "@google/genai";
import { generateGeminiContent } from '../services/gemini';
import { FileUploader } from '../components/FileUploader';
import { PrintStyles, ClientBriefPrintable, ProductionArtChecklist, PreFlightChecklistPrintable } from '../components/PrintableChecklists';
import DigitalPreFlightChecklist from '../components/PreFlightChecklist';
import DigitalProductionArtChecklist from '../components/ProductionArtChecklist';
import ProductionReworkChecklist, { extractReworkItems } from '../components/ProductionReworkChecklist';

const stages = ['client', 'preflight', 'production', 'pqc', 'qc', 'approved'];

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isQC, isElevated } = useAuth();
  const { logoUrl, brandGuidelineUrl, legalMandateUrl } = useSettings();
  const [project, setProject] = useState<StudentProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeViewerUrl, setActiveViewerUrl] = useState<string | null>(null);
  const [activeViewerTitle, setActiveViewerTitle] = useState<string>('');
  const [showDocNotice, setShowDocNotice] = useState<boolean>(true);

  // States for Quick Edit Project Details & Brief
  const isStaff = isAdmin || user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'qc' || user?.role === 'telecaller' || user?.role === 'accounts_executive' || isElevated;
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editDetails, setEditDetails] = useState<string>('');
  const [editClientBrief, setEditClientBrief] = useState<any>({
    projectNumber: '',
    brandName: '',
    packType: '',
    variantName: '',
    fileName: '',
    netWeight: '',
    baseFileName: '',
    edName: '',
    referenceFileName: '',
    masterJob: '',
    annotationPdfName: '',
    jobBrief: ''
  });
  const [isSavingBrief, setIsSavingBrief] = useState<boolean>(false);

  const handleSaveProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsSavingBrief(true);
    try {
      const projectRef = doc(db, 'student_projects', project.id);
      await updateDoc(projectRef, {
        details: editDetails,
        clientBrief: editClientBrief
      });
      alert('Project details and brief specifications updated successfully in realtime!');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating project details:', err);
      alert('Failed to update project: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingBrief(false);
    }
  };

  const getViewerEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
      if (url.includes('id=')) {
        const parts = url.split('id=');
        if (parts.length > 1) {
          const id = parts[1].split('&')[0];
          return `https://drive.google.com/file/d/${id}/preview`;
        }
      }
    }
    return url;
  };

  const getDirectDownloadUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/view?usp=sharing`;
      }
      if (url.includes('id=')) {
        const parts = url.split('id=');
        if (parts.length > 1) {
          const id = parts[1].split('&')[0];
          return `https://drive.google.com/file/d/${id}/view?usp=sharing`;
        }
      }
    }
    return url;
  };
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [printingChecklist, setPrintingChecklist] = useState<'preflight' | 'production' | 'client' | null>(null);
  const [localAdobeLink, setLocalAdobeLink] = useState('');
  const [localFinalFileLink, setLocalFinalFileLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [overrideStatusMsg, setOverrideStatusMsg] = useState<string | null>(null);
  const [overrideErrorMsg, setOverrideErrorMsg] = useState<string | null>(null);
  
  const [detailQcDecision, setDetailQcDecision] = useState<'approve' | 'reject' | null>(null);
  const [detailQcRejectionCategory, setDetailQcRejectionCategory] = useState('Typography');
  const [detailQcSelectedCategories, setDetailQcSelectedCategories] = useState<string[]>(['Typography']);
  const [detailQcRejectionNotes, setDetailQcRejectionNotes] = useState('');
  const [detailQcRejectionPdfUrl, setDetailQcRejectionPdfUrl] = useState('');
  const [detailQcRejectionTargetStage, setDetailQcRejectionTargetStage] = useState('production');
  const [qcErrorCategories, setQcErrorCategories] = useState<string[]>(['Typography', 'Color', 'Layout', 'Bleed/Trim', 'Other']);

  useEffect(() => {
    let active = true;
    const fetchAdminSettings = async () => {
      try {
        const { getDoc } = await import('firebase/firestore');
        const docSnap = await getDoc(doc(db, 'settings', 'admin'));
        if (active && docSnap.exists() && docSnap.data().qcErrorCategories) {
          setQcErrorCategories(docSnap.data().qcErrorCategories);
        }
      } catch (err) {
        console.error("Error fetching quality control categories", err);
      }
    };
    fetchAdminSettings();
    return () => {
      active = false;
    };
  }, []);
  
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    details: false,
    printerSpec: false,
    guideline: true,
    queries: true,
    preflight: false,
    production: false
  });

  const currentStageIndex = project ? stages.indexOf(project.status) : -1;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (project?.adobeCloudLink) {
      setLocalAdobeLink(project.adobeCloudLink);
    }
    if (project?.projectFileUrl) {
      setLocalFinalFileLink(project.projectFileUrl);
    }
  }, [project?.adobeCloudLink, project?.projectFileUrl]);

  const checkPreview = () => {
    return false;
  };

  const handleUpdateAdobeLink = async () => {
    if (checkPreview()) return;
    if (!project) return;
    try {
      await updateDoc(doc(db, 'student_projects', project.id), {
        adobeCloudLink: localAdobeLink,
        updatedAt: new Date().toISOString()
      });
      alert('Adobe Cloud link updated successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
    }
  };

  const handleUpdateFinalFileLink = async () => {
    if (checkPreview()) return;
    if (!project) return;
    
    // Calculate total actual time after this operation (if timer is running)
    const sessionTime = project.isTimerRunning && project.lastTimerStart
      ? Math.ceil((Date.now() - new Date(project.lastTimerStart).getTime()) / 60000)
      : 0;
    
    const totalTimeAfter = (project.actualTime || 0) + sessionTime;
    const lastStageTime = project.lastStageActualTime || 0;
    
    // Enforce at least 1 minute of work in the current stage before submitting to QC
    if (totalTimeAfter <= lastStageTime) {
      alert("Action Required: You must record some work for this stage using the timer before you can submit files for QC. Students must spend time in the current stage before progressing.");
      return;
    }

    // New Quality Rule: Block submission if "In Progress"
    if (project.workStatus === 'In Progress' || project.isTimerRunning) {
      alert("Action Required: Your work is still 'In Progress' or the timer is running. Please stop the timer or set your stage status to 'Completed' (which will automatically submit for QC) or 'Paused' before manual submission. Students must explicitly close their work session before QC.");
      return;
    }

    // Ensure student is in the PQC stage before submitting for QC review
    if (project.status !== 'pqc' && project.status !== 'qc' && project.status !== 'approved') {
      alert(`Quality Rule Violation: You are currently in the "${project.status}" stage. You must progress through the stages in sequence (Pre-Flight -> Production -> PQC) before submitting for QC Review.`);
      return;
    }

    // Quality Rule: Ensure rework is fully completed if there are any flagged items
    if (project.qcProduction) {
      const reworkItems = extractReworkItems(project.qcProduction);
      if (reworkItems.length > 0) {
        const reworkData = (project as any).reworkChecklist || {};
        const hasIncompleteRework = reworkItems.some(item => reworkData[item.id] !== 'completed');
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
        setExpandedSections(prev => ({ ...prev, production: true }));
        return;
      }
    }

    setIsUploading(true);
    try {
      const updates: any = {
        projectFileUrl: localFinalFileLink,
        status: 'qc',
        workStatus: 'Submitted',
        lastStageActualTime: totalTimeAfter, // Lock in the time
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

      await updateDoc(doc(db, 'student_projects', project.id), updates);
      alert('Project submitted for QC successfully! Status changed to QC.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrintAction = () => {
    let targetId = '';
    let title = '';
    
    if (printingChecklist === 'client') {
      targetId = 'client-brief-printable';
      title = `Project Brief - ${project.clientBrief?.projectNumber || project.projectCode || project.title}`;
    } else if (printingChecklist === 'production') {
      targetId = 'production-art-checklist-printable';
      title = `Production Checklist - ${project.clientBrief?.projectNumber || project.projectCode}`;
    } else if (printingChecklist === 'preflight') {
      targetId = 'preflight-checklist-printable';
      title = `Pre-flight Checklist - ${project.clientBrief?.projectNumber || project.projectCode}`;
    }

    const printContent = document.getElementById(targetId);
    if (!printContent) {
      alert('Error: Could not find printable content. Please try again.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print/download the brief.');
      return;
    }

    // Get all styles from the current document
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          ${styles}
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              background: white !important; 
              padding: 0; 
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-container { 
              display: block !important; 
              visibility: visible !important;
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = () => {
              // Wait for all images to load
              const images = Array.from(document.querySelectorAll('img'));
              if (images.length === 0) {
                setTimeout(() => window.print(), 1000);
                return;
              }
              
              let loadedCount = 0;
              images.forEach(img => {
                if (img.complete) {
                  loadedCount++;
                } else {
                  img.onload = img.onerror = () => {
                    loadedCount++;
                    if (loadedCount === images.length) {
                      setTimeout(() => window.print(), 1000);
                    }
                  };
                }
              });
              
              if (loadedCount === images.length) {
                setTimeout(() => window.print(), 1000);
              }
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrint = (type: 'preflight' | 'production' | 'client') => {
    setPrintingChecklist(type);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      // Keep modal open for manual close or retry
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'student_projects', projectId), (docSnap) => {
      if (docSnap.exists()) {
        setProject({ ...docSnap.data(), id: docSnap.id } as StudentProject);
      } else {
        setProject(null);
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, `student_projects/${projectId}`));

    return () => unsub();
  }, [projectId]);

  // Auto-pilot: Automatically share any associated Google Drive files to avoid permission / edit approval prompts
  useEffect(() => {
    if (!project || user?.role !== 'student' || !user?.email) return;

    // 1. Share assigned templates / files with the logged in student
    const assignedLinks = [project.googleDriveLink, project.adobeCloudLink];
    assignedLinks.forEach(link => {
      if (link && link.includes('drive.google.com')) {
        console.log("Auto-pilot: Automatically sharing assigned Google Drive file with student:", link);
        fetch('/api/share-drive-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driveUrl: link, studentEmail: user.email, role: 'writer' })
        }).catch(err => console.error("Error auto-sharing assigned link:", err));
      }
    });

    // 2. Share the student's submitted project files with info@endlesssparkcreativehub.in so the QC team doesn't need approval
    const submittedLinks = [project.projectFileUrl];
    submittedLinks.forEach(link => {
      if (link && link.includes('drive.google.com')) {
        console.log("Auto-pilot: Automatically sharing student submitted file with admin:", link);
        fetch('/api/share-drive-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driveUrl: link, studentEmail: 'info@endlesssparkcreativehub.in', role: 'writer' })
        }).catch(err => console.error("Error auto-sharing submitted link with admin:", err));
      }
    });
  }, [project?.id, project?.googleDriveLink, project?.adobeCloudLink, project?.projectFileUrl, user?.id, user?.email, user?.role]);

  const [queries, setQueries] = useState<StudentQuery[]>([]);

  useEffect(() => {
    if (!user || !project) return;

    let q;
    const isStaff = isAdmin || user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'qc' || user?.role === 'telecaller' || user?.role === 'accounts_executive';

    if (isStaff) {
      q = query(collection(db, 'student_queries'), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        collection(db, 'student_queries'), 
        where('studentId', '==', user.id), 
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const queriesList: StudentQuery[] = [];
      snapshot.forEach((docSnap) => {
        queriesList.push({ id: docSnap.id, ...docSnap.data() } as StudentQuery);
      });
      setQueries(queriesList);
    }, (err) => {
      console.error('Error fetching project queries:', err);
    });

    return () => unsubscribe();
  }, [user, project?.id, isAdmin]);

  const projectQueries = queries.filter(q => {
    if (!project) return false;
    const codeToCompare = (q.projectNumber || '').toLowerCase().trim();
    const currentCode = (project.projectCode || '').toLowerCase().trim();
    const pId = (project.id || '').toLowerCase().trim();
    const briefNum = (project.clientBrief?.projectNumber || '').toLowerCase().trim();
    return (
      (currentCode && codeToCompare === currentCode) ||
      (pId && codeToCompare === pId) ||
      (briefNum && codeToCompare === briefNum)
    );
  });

  // Timer logic for display
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (project?.isTimerRunning && project.lastTimerStart) {
      const startTime = new Date(project.lastTimerStart).getTime();
      
      // Initial calculation
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [project?.isTimerRunning, project?.lastTimerStart]);

  // Main return happens after all hooks are defined
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h2>
        <button onClick={() => navigate('/dashboard')} className="text-pink-600 hover:underline font-bold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleWorkStatusChange = async (newWorkStatus: string) => {
    if (!project) return;
    
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
      setLocalFinalFileLink('');
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
      // Calculate total actual time after this operation
      const sessionTime = project.isTimerRunning && project.lastTimerStart
        ? Math.ceil((Date.now() - new Date(project.lastTimerStart).getTime()) / 60000)
        : 0;
      
      const totalTimeAfter = (project.actualTime || 0) + sessionTime;
      const lastStageTime = project.lastStageActualTime || 0;
      
      // Enforce at least 1 minute of work in the current stage
      if (totalTimeAfter <= lastStageTime) {
        alert('Action Required: You must record some work for this stage using the timer before you can mark it as "Completed". Students must spend time in the current stage before progressing.');
        return;
      }

      // Quality Rules: Ensure checklists are completed before progressing
      if (project.qcProduction) {
        const reworkItems = extractReworkItems(project.qcProduction);
        if (reworkItems.length > 0) {
          const reworkData = (project as any).reworkChecklist || {};
          const hasIncompleteRework = reworkItems.some(item => reworkData[item.id] !== 'completed');
          if (hasIncompleteRework) {
            alert('Quality Rule Violation: You have pending rework items. Please complete and mark all QC rework items as "Completed" on the Rework Checklist before progressing.');
            return;
          }
        }
      }

      // Master deep checker for 'pending' values in checklists
      const hasPending = (obj: any): boolean => {
        if (!obj) return false;
        if (Array.isArray(obj)) return obj.some(item => item === 'pending' || hasPending(item));
        if (typeof obj === 'object') return Object.values(obj).some(val => val === 'pending' || hasPending(val));
        return false;
      };

      if (project.status === 'preflight') {
        const preflight = (project as any).digitalPreflight;
        if (!preflight) {
          alert('Quality Rule Violation: You must complete and SAVE the Digital Pre-Flight Checklist before progressing to the Production stage.');
          setExpandedSections(prev => ({ ...prev, preflight: true }));
          return;
        }

        if (hasPending(preflight) || !preflight.clientName || !preflight.projectNumber) {
          alert('Quality Rule Violation: Your Digital Pre-Flight Checklist is incomplete. Please ensure all "Pending/Select" fields are marked (Yes/No/NA/Query) and header info is filled.');
          setExpandedSections(prev => ({ ...prev, preflight: true }));
          return;
        }
      }


      // Production Art stage check list does not required, removed.

      // Quality Rules: Ensure Production Art checklist is completed before progressing from PQC to QC
      if (project.status === 'pqc') {
        const currentLink = localFinalFileLink.trim() || project.projectFileUrl?.trim() || '';
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
          // Save link
          setLocalFinalFileLink(promptLink.trim());
          updates.projectFileUrl = promptLink.trim();
        } else {
          updates.projectFileUrl = currentLink;
        }

        const pqc = (project as any).digitalProduction;
        if (!pqc) {
          alert('Quality Rule Violation: You must complete and SAVE the Production Art Engineer PQC Checklist before progressing.');
          setExpandedSections(prev => ({ ...prev, production: true }));
          return;
        }

        if (hasPending(pqc)) {
          alert('Quality Rule Violation: Your Production Art Engineer PQC Checklist is incomplete. Please ensure all "Pending/Select" fields are marked (Yes/No/NA/Query).');
          setExpandedSections(prev => ({ ...prev, production: true }));
          return;
        }
      }

      const nextIndex = currentStageIndex + 1;
      if (nextIndex < stages.length) {
        updates.status = stages[nextIndex];
        updates.workStatus = stages[nextIndex] === 'qc' ? 'Submitted' : 'Not Started';
        updates.lastStageActualTime = totalTimeAfter; // Lock in the time spent so far for the next stage's comparison
      }
    }

    try {
      await updateDoc(doc(db, 'student_projects', project.id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChecklistChange = async (index: number, type: 'preflight' | 'production', value: string) => {
    if (!project) return;
    
    if (!project.isTimerRunning) {
      alert('Please start the timer to record your work progress.');
      return;
    }

    const progressKey = type === 'preflight' ? 'preflightChecklistProgress' : 'productionChecklistProgress';
    const checklistKey = type === 'preflight' ? 'preflightChecklist' : 'productionChecklist';
    
    const currentChecklist = (project[checklistKey] as string[]) || [];
    let currentProgress = (project[progressKey] as string[]) || [];
    
    // Ensure progress array matches checklist length
    if (currentProgress.length !== currentChecklist.length) {
      const newBaseProgress = new Array(currentChecklist.length).fill('');
      currentProgress.forEach((val, i) => {
        if (i < newBaseProgress.length) newBaseProgress[i] = val;
      });
      currentProgress = newBaseProgress;
    }
    
    const newProgress = [...currentProgress];
    newProgress[index] = value;
    
    try {
      await updateDoc(doc(db, 'student_projects', project.id), {
        [progressKey]: newProgress,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
    }
  };

  return (
    <>
      <PrintStyles />
      {printingChecklist && (
        <>
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center no-print">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-pink-100 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-gray-900">Preparing Printable Forms...</h3>
                <p className="text-sm text-gray-500">The print window will open automatically.</p>
                <div className="flex flex-col gap-2 mt-4">
                  <button 
                    onClick={handlePrintAction}
                    className="px-6 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Open Print / Download Window
                  </button>
                  <button 
                    onClick={() => setPrintingChecklist(null)}
                    className="text-sm text-gray-400 hover:text-pink-600 font-medium py-2"
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="print-only">
            {printingChecklist === 'client' && <ClientBriefPrintable project={project} logoUrl={logoUrl} />}
            {printingChecklist === 'production' && <ProductionArtChecklist project={project} logoUrl={logoUrl} />}
            {printingChecklist === 'preflight' && <PreFlightChecklistPrintable project={project} logoUrl={logoUrl} />}
          </div>
        </>
      )}
      
      <div className={cn("max-w-5xl mx-auto p-6", printingChecklist ? "print:hidden" : "")}>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Prominent Google Drive Submission Banner for PQC stage to prevent students from forgetting */}
        {project.status === 'pqc' && !project.projectFileUrl && user?.role === 'student' && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl mb-6 shadow-lg shadow-emerald-50 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-100 animate-pulse" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">Google Submission Link Needed</h3>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl font-medium">
                You are currently in the <strong>Production QC (PQC)</strong> stage. Before you can complete this stage, you MUST submit your Google Drive share link. Provide it below to save automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <input 
                type="text"
                value={localFinalFileLink}
                onChange={(e) => setLocalFinalFileLink(e.target.value)}
                placeholder="Paste Google Drive link here..."
                className="flex-1 md:w-80 px-4 py-2.5 rounded-2xl border-0 text-sm bg-white/95 text-gray-800 font-medium placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none transition-all shadow-inner"
              />
              <button
                onClick={handleUpdateFinalFileLink}
                disabled={isUploading || !localFinalFileLink.trim()}
                className="bg-white hover:bg-emerald-50 text-emerald-800 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shrink-0 uppercase tracking-widest cursor-pointer disabled:opacity-50"
              >
                Submit Link
              </button>
            </div>
          </div>
        )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <button 
          onClick={() => setIsHeaderExpanded(prev => !prev)}
          className={cn(
            "w-full text-left p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 outline-none focus:outline-none group transition-all duration-200 bg-gray-50",
            isHeaderExpanded ? "border-b border-gray-150" : ""
          )}
          id="toggle-project-header"
        >
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors leading-tight">
                {project.title}
              </h1>
              {(project.clientBrief?.projectNumber || project.projectCode) && (
                <span className="bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                  {project.clientBrief?.projectNumber || project.projectCode}
                </span>
              )}
              {project.courseName && (
                <span className="bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  {project.courseName}
                </span>
              )}
            </div>
            
            {/* Show metadata below title only when expanded */}
            {isHeaderExpanded ? (
              <div className="flex flex-wrap items-center gap-4 text-gray-500 mt-3 animate-in fade-in duration-200">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <Clock className="w-4 h-4 text-gray-400" /> Total Est: {project.estimatedTime}m
                </p>
                {project.status !== 'approved' && project.stageEstimates && (
                  <p className="flex items-center gap-1.5 text-pink-600 font-medium bg-pink-50 px-2.5 py-1 rounded-full text-xs">
                    <Clock className="w-4 h-4" /> {project.status.toUpperCase()} Est: {project.stageEstimates[project.status as keyof typeof project.stageEstimates] || 0}m
                  </p>
                )}
                {project.slaDate && (
                  <p className="flex items-center gap-1.5 text-pink-700 font-bold bg-pink-50 px-2.5 py-1 rounded-full text-xs">
                    <Calendar className="w-4 h-4" /> SLA: {new Date(project.slaDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium font-mono uppercase tracking-wider mt-1">
                Click to expand steps & metadata
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            {/* Minimal Status Indicator when collapsed */}
            {!isHeaderExpanded && (
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                project.status === 'approved' ? "bg-green-50 border-green-200 text-green-700" :
                project.status === 'qc' ? "bg-orange-50 border-orange-200 text-orange-700" :
                "bg-blue-50 border-blue-200 text-blue-700"
              )}>
                {project.status === 'pqc' ? 'Prod. QC' : project.status === 'qc' ? 'QC' : project.status}
              </span>
            )}

            {isHeaderExpanded && (
              <div className="flex flex-col items-end gap-1 relative mr-1 animate-in fade-in duration-200">
                {isElevated ? (
                  <div className="flex flex-col items-end gap-1 relative">
                    <span className="text-[9px] font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      Change Project Stage
                    </span>
                    <select
                      value={project.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        if (!project) return;
                        try {
                          await updateDoc(doc(db, 'student_projects', project.id), {
                            status: newStatus,
                            updatedAt: new Date().toISOString()
                          });
                          alert(`Project stage successfully updated to: ${newStatus.toUpperCase()}`);
                        } catch (err) {
                          handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
                        }
                      }}
                      className="bg-white border border-pink-200 hover:border-pink-300 rounded-xl px-2.5 py-1 text-xs font-bold text-pink-700 outline-none cursor-pointer shadow-sm uppercase shrink-0 transition-all font-sans"
                    >
                      {stages.map((stg) => (
                        <option key={stg} value={stg} className="text-gray-700 bg-white">
                          {stg === 'client' ? 'Client Brief' :
                           stg === 'preflight' ? 'Pre-Flight Plan' :
                           stg === 'production' ? 'Production Art' :
                           stg === 'pqc' ? 'Production QC' :
                           stg === 'qc' ? 'QC' :
                           stg === 'approved' ? 'Approved' : stg}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                    project.status === 'approved' ? "bg-green-100 text-green-700" :
                    project.status === 'qc' ? "bg-orange-100 text-orange-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {project.status}
                  </span>
                )}
                {project.status === 'approved' && (
                  <div className="text-[10px] font-bold text-green-600">
                    Points: {project.points} | Efficiency: {project.efficiency.toFixed(1)}%
                  </div>
                )}
              </div>
            )}

            <div className="p-2 border border-pink-400 rounded-xl bg-white text-pink-600 group-hover:bg-pink-50 group-hover:text-pink-700 transition-all duration-150 shadow-sm shrink-0">
              {isHeaderExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {isHeaderExpanded && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Horizontal Project Stages Stepper */}
            <div className="p-8 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 md:pb-0">
                <div className="flex-1 flex items-center min-w-[600px] md:min-w-0">
                  {stages.map((stage, index) => (
                    <div key={stage} className="flex flex-col items-center relative flex-1 first:flex-initial first:w-20 last:flex-initial last:w-20">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                        index < currentStageIndex ? "bg-pink-600 border-pink-600 text-white" :
                        index === currentStageIndex ? "bg-white border-pink-600 text-pink-600 shadow-md scale-110" :
                        "bg-white border-gray-200 text-gray-300"
                      )}>
                        {index < currentStageIndex ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      <span className={cn(
                        "mt-3 text-[10px] md:text-xs font-bold uppercase tracking-wider text-center px-1 whitespace-nowrap",
                        index <= currentStageIndex ? "text-pink-600" : "text-gray-400"
                      )}>
                        {stage === 'pqc' ? 'Prod. QC' : stage}
                      </span>
                      
                      {/* Connecting Line */}
                      {index < stages.length - 1 && (
                        <div className={cn(
                          "absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 z-0",
                          index < currentStageIndex ? "bg-pink-600" : "bg-gray-100"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Vertical Stage Tracker */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Project Workflow Steps</h4>
                <div className="space-y-3">
                  {stages.map((stage, idx) => {
                    const isActive = stage === project.status;
                    const isCompleted = stages.indexOf(project.status) > idx;
                    
                    return (
                      <div key={stage} className="border-b border-gray-150/30 last:border-0 py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                              isActive ? "bg-pink-600 border-pink-600 text-white" :
                              isCompleted ? "bg-green-100 border-green-200 text-green-600" :
                              "bg-white border-gray-300 text-gray-400"
                            )}>
                              {isCompleted ? <CheckCircle className="w-3 h-3" /> : idx}
                            </div>
                            {idx < stages.length - 1 && (
                              <div className={cn(
                                "w-0.5 h-4 my-0.5 transition-colors",
                                isCompleted ? "bg-green-200" : "bg-gray-200"
                              )} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={cn(
                                  "text-xs font-bold uppercase tracking-wider transition-colors truncate",
                                  isActive ? "text-pink-700" : 
                                  isCompleted ? "text-green-700" : 
                                  "text-gray-400"
                                )}>
                                  {stage === 'pqc' ? 'Production QC' : 
                                   stage === 'qc' ? 'QC' : stage}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => navigate('/queries', {
                                    state: {
                                      projectNumber: project.clientBrief?.projectNumber || project.projectCode || project.id,
                                      selectAndOpenRaise: true,
                                      initialTitle: `Query regarding stage: ${stage === 'pqc' ? 'Production QC' : stage === 'qc' ? 'QC' : stage.toUpperCase()}`,
                                      initialCategory: stage === 'preflight' ? 'Pre-flight checklist help' : stage === 'pqc' ? 'Technical/QC violation' : 'Layout approval',
                                      initialRound: 'Round 1'
                                    }
                                  })}
                                  className="p-1 rounded text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all shrink-0 animate-pulse duration-1000"
                                  title={`Raise support query for ${stage === 'pqc' ? 'Production QC' : stage === 'qc' ? 'QC' : stage} stage`}
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {isActive && (
                                <div className="relative">
                                  {(stage === 'qc' || stage === 'approved') && user?.role === 'student' ? (
                                    <span className={cn(
                                      "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border",
                                      project.status === 'approved' ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700"
                                    )}>
                                      {project.status === 'approved' ? 'Approved' : (project.workStatus || 'Submitted')}
                                    </span>
                                  ) : (
                                    <>
                                      <select 
                                        value={project.workStatus || 'Not Started'}
                                        onChange={(e) => handleWorkStatusChange(e.target.value)}
                                        className={cn(
                                          "appearance-none pl-3 pr-8 py-1 rounded text-[10px] font-black border transition-all cursor-pointer outline-none shadow-sm",
                                          project.workStatus === 'Completed' ? "bg-green-50 border-green-200 text-green-700" :
                                          project.workStatus === 'Paused' ? "bg-orange-50 border-orange-200 text-orange-700" :
                                          project.workStatus === 'In Progress' ? "bg-blue-50 border-blue-200 text-blue-700" :
                                          "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                        )}
                                      >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Paused">Paused</option>
                                        <option value="Completed">Completed</option>
                                      </select>
                                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inline Google Drive Submission form right near the 'pqc' stage in Vertical Stage Tracker */}
                        {isActive && stage === 'pqc' && user?.role === 'student' && (
                          <div className="mt-3 ml-9 p-4 bg-green-50/50 rounded-2xl border border-green-100 text-left animate-in fade-in slide-in-from-top-2 duration-300">
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
                                  value={localFinalFileLink}
                                  onChange={(e) => {
                                    setLocalFinalFileLink(e.target.value);
                                    // Auto-save path to database immediately as they type so we don't keep it separately
                                    updateDoc(doc(db, 'student_projects', project.id), {
                                      projectFileUrl: e.target.value,
                                      updatedAt: new Date().toISOString()
                                    });
                                  }}
                                  placeholder="Paste Google Drive link here..."
                                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-green-200 bg-white focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-800"
                                />
                              </div>
                              <button
                                onClick={handleUpdateFinalFileLink}
                                disabled={isUploading || !localFinalFileLink.trim()}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 uppercase tracking-widest cursor-pointer disabled:opacity-50"
                              >
                                Submit Link
                              </button>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1 leading-normal italic">
                              Enable download permission before submitting so that the QC team can retrieve your work.
                            </p>
                          </div>
                        )}

                        {/* Completed/Reviewed Link Status */}
                        {((stage === 'qc' || stage === 'approved') && isActive && project.projectFileUrl) && (
                          <div className="mt-3 ml-9 p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-sm text-left">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-[8px] uppercase font-bold text-gray-400">Submitted Google Drive Path</p>
                              <p className="text-xs font-mono font-bold text-gray-750 truncate">{project.projectFileUrl}</p>
                            </div>
                            <a 
                              href={project.projectFileUrl.match(/^https?:\/\//i) ? project.projectFileUrl : `https://${project.projectFileUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {project.status !== 'approved' && project.status !== 'qc' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-[10px] font-medium text-gray-400 leading-tight">
                    Change status to <span className="text-green-600 font-bold">"Completed"</span> to automatically move to the next vertical step.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Project Details Section */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleSection('details')}
                className="w-full p-5 md:p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group"
                id="toggle-project-details"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors">
                    <FileText className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900">
                    Project Details & Brief
                  </h3>
                </div>
                <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {expandedSections.details ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>
              </button>
              
              {expandedSections.details && (
                <div className="p-4 md:p-6 space-y-6">
                  <div className="bg-gray-50 p-4 md:p-6 rounded-2xl text-gray-700 whitespace-pre-wrap text-sm md:text-base border border-gray-100">
                    {project.details}
                  </div>

                  {project.clientBrief && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Project Brief & Specifications</h4>
                        <div className="flex items-center gap-3">
                          {isStaff && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditDetails(project.details || '');
                                setEditClientBrief({
                                  projectNumber: project.clientBrief?.projectNumber || '',
                                  brandName: project.clientBrief?.brandName || '',
                                  packType: project.clientBrief?.packType || '',
                                  variantName: project.clientBrief?.variantName || '',
                                  fileName: project.clientBrief?.fileName || '',
                                  netWeight: project.clientBrief?.netWeight || '',
                                  baseFileName: project.clientBrief?.baseFileName || '',
                                  edName: project.clientBrief?.edName || '',
                                  referenceFileName: project.clientBrief?.referenceFileName || '',
                                  masterJob: project.clientBrief?.masterJob || '',
                                  annotationPdfName: project.clientBrief?.annotationPdfName || '',
                                  jobBrief: project.clientBrief?.jobBrief || ''
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="text-pink-600 hover:text-pink-700 hover:scale-[1.02] flex items-center gap-1 text-xs font-black p-1 px-2.5 rounded bg-pink-50 hover:bg-pink-100 transition-all active:scale-95 cursor-pointer border border-pink-205"
                            >
                              <FileCheck className="w-3 h-3" /> Edit Details & Brief
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrint('client');
                            }}
                            className="text-pink-600 hover:text-pink-700 flex items-center gap-1 text-xs font-bold p-1 rounded hover:bg-pink-50 transition-all active:scale-95 cursor-pointer"
                          >
                            <Printer className="w-3 h-3 pointer-events-none" /> Print Brief
                          </button>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          <div className="p-3 md:p-4 border-b border-gray-100 last:border-b-0 md:border-r">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Project Number
                            </span>
                            <span className="text-sm font-medium text-gray-900 break-words font-mono">
                              {project.clientBrief.projectNumber || 'Pending / Unavailable'}
                            </span>
                          </div>
                          {Object.entries(project.clientBrief).map(([key, value]) => {
                            if (key === 'jobBrief' || key === 'preflightChecklist' || key === 'productionChecklist' || key === 'projectNumber') return null;
                            return (
                              <div key={key} className="p-3 md:p-4 border-b border-gray-100 last:border-b-0 md:border-r">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="block text-sm text-gray-900 font-semibold break-words">
                                  {value || '-'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {project.clientBrief.jobBrief && (
                          <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Job Brief / Special Instructions</span>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {project.clientBrief.jobBrief}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Brand Guideline & Mandate Section */}
            <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleSection('guideline')}
                className="w-full p-5 md:p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group"
                id="toggle-project-guidelines"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors">
                    <FileCheck className="w-5 h-5 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base md:text-lg font-bold text-gray-900">
                      Brand Guideline & Mandate
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Access official brand assets, packaging guidelines, and mandatory regulatory standards
                    </p>
                  </div>
                </div>
                <div className="p-2 hover:bg-gray-150 rounded-lg transition-colors">
                  {expandedSections.guideline ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>
              </button>
              
              {expandedSections.guideline && (
                <div className="p-5 md:p-6 space-y-6 bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Brand Guideline card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between group/card hover:border-pink-300 transition-all h-full">
                      <div className="space-y-3">
                        <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-600 font-bold text-xs">
                          01
                        </div>
                        <h4 className="text-sm md:text-base font-extrabold text-gray-950">Brand Guideline Specification</h4>
                        <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                          Reference correct brand logos, typography weights, color palette standards, spacing bounds, and visual identity requirements before drafting artwork templates.
                        </p>
                      </div>
                      <div className="pt-5 flex flex-col gap-2">
                        {brandGuidelineUrl ? (
                          <>
                            <button 
                              onClick={() => {
                                setActiveViewerUrl(brandGuidelineUrl);
                                setActiveViewerTitle("Brand Guideline Specification");
                                setShowDocNotice(true);
                              }}
                              className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 group-hover/card:scale-[1.02] transition-all cursor-pointer shadow-md shadow-pink-100"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Brand Guideline Spec
                            </button>
                            <a 
                              href={getDirectDownloadUrl(brandGuidelineUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full py-2 px-4 border border-gray-200 hover:border-pink-300 text-gray-600 hover:text-pink-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-gray-50/50 hover:bg-pink-50/20"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Guideline PDF (2nd Option)
                            </a>
                          </>
                        ) : (
                          <div className="w-full py-2.5 px-4 bg-gray-100 text-gray-400 rounded-xl text-xs font-black text-center select-none border border-gray-200">
                            Guideline PDF Not Configured Yet
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Legal Mandate card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between group/card hover:border-pink-300 transition-all h-full">
                      <div className="space-y-3">
                        <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-600 font-bold text-xs">
                          02
                        </div>
                        <h4 className="text-sm md:text-base font-extrabold text-gray-950">Legal & Regulatory Mandates</h4>
                        <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                          Ensure packaging artwork complies with mandatory size guidelines, barcode safety clearances, font sizing tolerances, placement rules, and net content disclosures.
                        </p>
                      </div>
                      <div className="pt-5 flex flex-col gap-2">
                        {legalMandateUrl ? (
                          <>
                            <button 
                              onClick={() => {
                                setActiveViewerUrl(legalMandateUrl);
                                setActiveViewerTitle("Legal & Regulatory Mandates");
                                setShowDocNotice(true);
                              }}
                              className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 group-hover/card:scale-[1.02] transition-all cursor-pointer shadow-md shadow-pink-100"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Legal Mandate Spec
                            </button>
                            <a 
                              href={getDirectDownloadUrl(legalMandateUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full py-2 px-4 border border-gray-200 hover:border-pink-300 text-gray-600 hover:text-pink-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-gray-50/50 hover:bg-pink-50/20"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Mandate PDF (2nd Option)
                            </a>
                          </>
                        ) : (
                          <div className="w-full py-2.5 px-4 bg-gray-100 text-gray-400 rounded-xl text-xs font-black text-center select-none border border-gray-200">
                            Legal Mandate PDF Not Configured Yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

              {project.printerSpec && (
                <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleSection('printerSpec')}
                    className="w-full p-5 md:p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors">
                        <Printer className="w-5 h-5 text-pink-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900">
                        Printer Specification
                      </h3>
                    </div>
                    <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      {expandedSections.printerSpec ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </div>
                  </button>
                  {expandedSections.printerSpec && (
                    <div className="p-4 md:p-6 space-y-6 overflow-x-hidden">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Printer Name</span>
                          <span className="text-sm font-bold text-gray-900">{project.printerSpec.printerName || '-'}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Print Method</span>
                          <span className="text-sm font-bold text-gray-900">{project.printerSpec.printMethod || '-'}</span>
                        </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Printing Substrate</span>
                        <span className="text-sm font-bold text-gray-900">{project.printerSpec.printingSubstrate || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Face/Reverse Print</span>
                        <span className="text-sm font-bold text-gray-900">{project.printerSpec.faceReversePrint || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Max Colors</span>
                        <span className="text-sm font-bold text-gray-900">{project.printerSpec.maxColors || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Varnish Included</span>
                        <span className="text-sm font-bold text-gray-900">{project.printerSpec.varnishIncluded || '-'}</span>
                      </div>
                    </div>

                    {project.printerSpec.barcodes && project.printerSpec.barcodes.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Barcodes</h5>
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-2 border-r last:border-r-0">Type</th>
                                <th className="p-2 border-r last:border-r-0">Number</th>
                                <th className="p-2 border-r last:border-r-0">Colour</th>
                                <th className="p-2 border-r last:border-r-0">BWR</th>
                                <th className="p-2">Narrow Bar</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {project.printerSpec.barcodes.map((bc, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 border-r last:border-r-0 font-medium">{bc.codeType || '-'}</td>
                                  <td className="p-2 border-r last:border-r-0">{bc.codeNumber || '-'}</td>
                                  <td className="p-2 border-r last:border-r-0">{bc.codeColour || '-'}</td>
                                  <td className="p-2 border-r last:border-r-0">{bc.bwr || '-'}</td>
                                  <td className="p-2">{bc.narrowBar || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {project.printerSpec.colorRotation && project.printerSpec.colorRotation.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Color Rotation Details</h5>
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-2 border-r last:border-r-0">Color Name</th>
                                <th className="p-2 border-r last:border-r-0">Screen</th>
                                <th className="p-2 border-r last:border-r-0">LPI</th>
                                <th className="p-2 border-r last:border-r-0">Angle</th>
                                <th className="p-2">New</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {project.printerSpec.colorRotation.filter(cr => cr.colorName).map((cr, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 border-r last:border-r-0 font-medium">{cr.colorName}</td>
                                  <td className="p-2 border-r last:border-r-0">{cr.lineScreen || '-'}</td>
                                  <td className="p-2 border-r last:border-r-0">{cr.lpi || '-'}</td>
                                  <td className="p-2 border-r last:border-r-0">{cr.angle || '-'}</td>
                                  <td className="p-2">{cr.new || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {project.printerSpec.artworkInfo && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Artwork Information</h5>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(project.printerSpec.artworkInfo).map(([key, val]) => (
                            <div key={key} className="p-2 bg-white border border-gray-100 rounded-lg">
                              <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="text-xs font-bold text-gray-900 break-all">{val || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.printerSpec.eyeMark && (
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Eye Mark</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(project.printerSpec.eyeMark).map(([key, val]) => (
                              <div key={key} className="p-2 bg-white border border-gray-100 rounded-lg">
                                <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-xs font-bold text-gray-900">{val || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {project.printerSpec.microdot && (
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Microdot</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(project.printerSpec.microdot).map(([key, val]) => (
                              <div key={key} className="p-2 bg-white border border-gray-100 rounded-lg">
                                <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-xs font-bold text-gray-900">{val || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {project.printerSpec.richBlack && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Rich Black</h5>
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(project.printerSpec.richBlack).map(([key, val]) => (
                            <div key={key} className="p-2 bg-white border border-gray-100 rounded-lg text-center">
                              <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">{key}</span>
                              <span className="text-xs font-bold text-gray-900">{val || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.printerSpec.trappingBleed && (
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Trapping/Bleed</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(project.printerSpec.trappingBleed).map(([key, val]) => (
                              <div key={key} className="p-2 bg-white border border-gray-100 rounded-lg">
                                <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-xs font-bold text-gray-900">{val || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {project.printerSpec.pullbackHoldback && (
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Pullback/Holdback</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(project.printerSpec.pullbackHoldback).map(([key, val]) => (
                              <div key={key} className="p-2 bg-white border border-gray-100 rounded-lg">
                                <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-xs font-bold text-gray-900">{val || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Proofing Profile Name</span>
                        <span className="text-sm font-bold text-gray-900">{project.printerSpec.proofingProfile || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Preferred Format</span>
                        <span className="text-sm font-bold text-gray-900">{project.printerSpec.preferredFormat || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
                </section>
              )}

              {/* Dynamic Checklists */}
              <div className="space-y-6 md:space-y-8">
                {/* Rework Checklist (Only displayed if QC has flagged items for rework) */}
                {project.qcProduction && extractReworkItems(project.qcProduction).length > 0 && (
                  <ProductionReworkChecklist
                    key={`rework-${project.id}`}
                    qcProductionData={project.qcProduction}
                    initialReworkData={(project as any).reworkChecklist}
                    readOnly={(project.status !== 'preflight' && project.status !== 'production' && project.status !== 'pqc') || !project.isTimerRunning}
                    onSave={async (data) => {
                      if (!project) return;
                      try {
                        const projectRef = doc(db, 'student_projects', project.id);
                        await updateDoc(projectRef, { 
                          reworkChecklist: data,
                          updatedAt: new Date().toISOString()
                        });
                      } catch (error) {
                        handleFirestoreError(error, OperationType.UPDATE, `student_projects/${project.id}`);
                      }
                    }}
                  />
                )}

                {/* Raised Support Queries & Clarifications */}
                <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleSection('queries' as any)}
                    className="w-full p-5 md:p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group"
                    id="toggle-project-queries"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors">
                        <HelpCircle className="w-5 h-5 text-pink-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base md:text-lg font-bold text-gray-900">
                          Raised Support Queries & Clarifications
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Track critical technical discussions, briefs, and file approvals
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {projectQueries.length > 0 && (
                        <span className="bg-pink-100 text-pink-850 text-[10px] font-black px-2.5 py-0.5 rounded-full select-none">
                          {projectQueries.length} {projectQueries.length === 1 ? 'Query' : 'Queries'}
                        </span>
                      )}
                      <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        {expandedSections.queries ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </div>
                    </div>
                  </button>
                  {expandedSections.queries && (
                    projectQueries.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 border-t border-gray-100 bg-gray-50/50">
                        <div className="max-w-md mx-auto py-4 space-y-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <HelpCircle className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-semibold text-slate-600">No active queries raised yet for this project</p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            If you encounter issues with fonts, colors, line screens, barcode numbers, or unclear brief instructions, you can raise an investigation ticket instantly.
                          </p>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => navigate('/queries', {
                                state: {
                                  projectNumber: project.clientBrief?.projectNumber || project.projectCode || project.id,
                                  selectAndOpenRaise: true,
                                  initialTitle: `Query regarding project: ${project.title}`,
                                  initialCategory: 'Brief is not clear',
                                  initialRound: 'Round 1'
                                }
                              })}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                            >
                              <HelpCircle className="w-4 h-4" />
                              <span>Raise First Query / Clarification</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border-t border-gray-100 divide-y divide-gray-150">
                        <div className="p-4 bg-slate-50 flex items-center justify-between border-b border-gray-100 px-5 md:px-6">
                          <div className="text-xs font-semibold text-slate-500">
                            Showing support tickets linked to Project Code: <span className="font-mono font-bold text-pink-750">{project.projectCode || project.id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('/queries', {
                              state: {
                                projectNumber: project.clientBrief?.projectNumber || project.projectCode || project.id,
                                selectAndOpenRaise: true,
                                initialTitle: `New Query: ${project.title}`,
                                initialCategory: 'Technical/QC violation',
                                initialRound: 'Round 1'
                              }
                            })}
                            className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer border border-pink-100"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Raise Another Query</span>
                          </button>
                        </div>

                        {projectQueries.map((ticket) => {
                          return (
                            <div key={ticket.id} className="p-5 md:p-6 space-y-4">
                              {/* Ticket Header Info */}
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-black ${
                                    ticket.status === 'solved' 
                                      ? 'bg-green-100 text-green-700 border border-green-200/50' 
                                      : 'bg-amber-100 text-amber-700 border border-amber-200/50'
                                  }`}>
                                    {ticket.status}
                                  </span>
                                  <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-black">
                                    {ticket.category || 'Technical Clarification'}
                                  </span>
                                  {ticket.round && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-pink-50 text-pink-700 border-pink-100 shadow-sm">
                                      {ticket.round}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1 font-semibold">
                                  <Calendar className="w-3 h-3 text-gray-350" />
                                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}
                                </span>
                              </div>

                              {/* Ticket Title */}
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-800 leading-snug">
                                  {ticket.title}
                                </h4>
                              </div>

                              {/* Ticket Sub-Queries/Conversations */}
                              <div className="space-y-4 pt-1">
                                {(() => {
                                  const subItems = ticket.queries && ticket.queries.length > 0 
                                    ? ticket.queries 
                                    : [{
                                        id: `sub_${ticket.id}`,
                                        projectNumber: ticket.projectNumber || 'N/A',
                                        studentName: ticket.studentName,
                                        category: ticket.category || 'Base file incorrect',
                                        description: ticket.description,
                                        createdAt: ticket.createdAt,
                                        status: ticket.status,
                                        solution: ticket.solution,
                                        solvedBy: ticket.solvedBy,
                                        solvedByName: ticket.solvedByName,
                                        solvedAt: ticket.solvedAt,
                                        studentAttachmentName: ticket.studentAttachmentName,
                                        studentAttachmentUrl: ticket.studentAttachmentUrl,
                                        answerAttachmentName: ticket.answerAttachmentName,
                                        answerAttachmentUrl: ticket.answerAttachmentUrl
                                      }];

                                  return (
                                    <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                                      {subItems.map((item, index) => {
                                        const isSolved = item.status === 'solved' || !!item.solution;
                                        return (
                                          <div key={item.id || index} className="space-y-3 bg-slate-55/40 p-4 rounded-xl border border-slate-100">
                                            {/* Query Part */}
                                            <div className="space-y-2 text-left">
                                              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                                                <span className="font-extrabold text-slate-500 font-mono">Query Task #{index + 1}</span>
                                                <span className="font-semibold">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
                                              </div>
                                              <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                                                {item.description}
                                              </p>

                                              {/* Student Attachment */}
                                              {item.studentAttachmentName && (
                                                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs max-w-lg mt-2 shadow-sm">
                                                  <div className="flex items-center gap-2 truncate">
                                                    <FileText className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                                                    <span className="font-bold text-slate-700 truncate text-xs">
                                                      {item.studentAttachmentName}
                                                    </span>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => downloadDataUrlFile(item.studentAttachmentName!, item.studentAttachmentUrl)}
                                                    className="px-2.5 py-1 bg-white hover:bg-pink-50 text-pink-705 border border-slate-200 hover:border-pink-200 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all shrink-0 cursor-pointer text-right"
                                                  >
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span>Download</span>
                                                  </button>
                                                </div>
                                              )}
                                            </div>

                                            {/* Solution Part if Solved */}
                                            {isSolved && (
                                              <div className="mt-3 pt-3 border-t border-green-100 bg-green-50/20 p-3 rounded-lg border-dashed">
                                                <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs mb-1.5">
                                                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                  <span>Resolution by {item.solvedByName || 'Instructor'}</span>
                                                </div>
                                                <p className="text-slate-600 text-xs font-semibold whitespace-pre-wrap leading-relaxed text-left">
                                                  {item.solution}
                                                </p>

                                                {/* Solution answer file attachment */}
                                                {item.answerAttachmentName && (
                                                  <div className="mt-2.5 flex items-center justify-between p-2 bg-white border border-green-100 rounded-lg text-xs max-w-lg shadow-sm">
                                                    <div className="flex items-center gap-2 truncate">
                                                      <FileText className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                                      <span className="font-bold text-slate-700 truncate text-xs">
                                                        {item.answerAttachmentName}
                                                      </span>
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => downloadDataUrlFile(item.answerAttachmentName!, item.answerAttachmentUrl)}
                                                      className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-800 border border-green-150 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all shrink-0 cursor-pointer text-right"
                                                    >
                                                      <Download className="w-3.5 h-3.5" />
                                                      <span>Download Solution Document</span>
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {/* Not solved notification */}
                                            {!isSolved && (
                                              <div className="mt-2.5 pt-2.5 border-t border-slate-150 text-[10px] font-mono text-slate-400 font-extrabold flex items-center gap-1.5">
                                                <span className="relative flex h-2 w-2">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                </span>
                                                <span>Awaiting Instructor Response</span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </section>

                {/* Digital Pre-Flight Checklist */}
                {(project.status === 'preflight' || (project as any).digitalPreflight) && (
                  <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <button 
                      onClick={() => toggleSection('preflight')}
                      className="w-full p-5 md:p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors">
                          <CheckCircle className={cn("w-5 h-5", project.status === 'preflight' ? "text-pink-600" : "text-gray-400")} />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900">
                          Digital Pre-Flight Checklist
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        {project.status !== 'preflight' && <span className="hidden sm:inline-block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Read Only</span>}
                        <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          {expandedSections.preflight ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                        </div>
                      </div>
                    </button>
                    {expandedSections.preflight && (
                    <div className="bg-white border-t border-gray-100">
                      {project.status === 'preflight' && !project.isTimerRunning && (
                        <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
                          <p className="text-sm font-bold text-amber-800">
                            Checklist is Read-Only. Please <span className="text-pink-600">Start the Timer</span> above to begin your work session.
                          </p>
                        </div>
                      )}
                      <DigitalPreFlightChecklist
                        key={project.id}
                        isAdmin={false}
                        readOnly={project.status !== 'preflight' || !project.isTimerRunning}
                        initialData={(project as any).digitalPreflight}
                        onSave={async (data) => {
                          if (!project) return;
                          try {
                            const projectRef = doc(db, 'student_projects', project.id);
                            await updateDoc(projectRef, { digitalPreflight: data });
                            alert('Pre-flight checklist saved securely.');
                          } catch (error) {
                            handleFirestoreError(error, OperationType.UPDATE, `student_projects/${project.id}`);
                          }
                        }}
                      />
                    </div>
                    )}
                  </section>
                )}

                {/* Production Art Checklist - Required only for PQC stage as student fills the checklist */}
                {(project.status === 'pqc' || project.status === 'qc' || project.status === 'approved' || (project as any).digitalProduction) && (
                  <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <button 
                      onClick={() => toggleSection('production')}
                      className="w-full p-5 md:p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors">
                          <CheckCircle className={cn("w-5 h-5", (project.status === 'pqc') ? "text-pink-600" : "text-gray-400")} />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900">
                          Production Art PQC Checklist
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        {project.status !== 'pqc' && <span className="hidden sm:inline-block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Read Only</span>}
                        <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          {expandedSections.production ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                        </div>
                      </div>
                    </button>
                    {expandedSections.production && (
                      <div className="bg-white border-t border-gray-100">
                        {(project.status === 'pqc' && !project.isTimerRunning) && (
                          <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
                            <p className="text-sm font-bold text-amber-800">
                              Checklist is Read-Only. Please <span className="text-pink-600">Start the Timer</span> above to begin your work session.
                            </p>
                          </div>
                        )}
                        <DigitalProductionArtChecklist
                          key={project.id}
                          isAdmin={false}
                          readOnly={project.status !== 'pqc' || !project.isTimerRunning}
                          initialData={(project as any).digitalProduction}
                          onSave={async (data) => {
                            if (!project) return;
                            try {
                              const projectRef = doc(db, 'student_projects', project.id);
                              await updateDoc(projectRef, { digitalProduction: data });
                              alert('Production Art checklist saved securely.');
                            } catch (error) {
                              handleFirestoreError(error, OperationType.UPDATE, `student_projects/${project.id}`);
                            }
                          }}
                        />
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>

            {(project.googleDriveLink || (project.supportDocuments && project.supportDocuments.length > 0)) && (
              <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden p-6 mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" /> Project Workspace
                </h3>
                <div className="flex flex-wrap gap-3">
                  {project.googleDriveLink && (
                    <a 
                      href={project.googleDriveLink.match(/^https?:\/\//i) ? project.googleDriveLink : `https://${project.googleDriveLink}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Google Drive Folder
                    </a>
                  )}
                  {project.correctionPdfUrl && (
                    <a 
                      href={project.correctionPdfUrl.match(/^https?:\/\//i) ? project.correctionPdfUrl : `https://${project.correctionPdfUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors border border-red-200 animate-pulse"
                    >
                      <FileCheck className="w-4 h-4" />
                      QC Correction PDF
                    </a>
                  )}
                  {project.supportDocuments && project.supportDocuments.map((doc, idx) => {
                    const formattedUrl = doc.match(/^https?:\/\//i) ? doc : `https://${doc}`;
                    return (
                      <a 
                        key={idx} 
                        href={formattedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Support Document {project.supportDocuments.length > 1 ? `(${idx + 1})` : ''}
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {project.qcRejections && project.qcRejections.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> QC Feedback
                </h3>
                <div className="space-y-4">
                  {project.qcRejections.map((rejection, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-100 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-red-800">{rejection.errorCategory} Error</span>
                        <span className="text-xs text-red-500">{new Date(rejection.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-red-700 text-sm">{rejection.notes}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">

            {/* Time Tracking */}
            {project.status !== 'approved' && project.status !== 'qc' && (
              <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg">
                <h3 className="font-bold mb-4 text-gray-300">Time Tracking</h3>
                <div className="text-4xl font-mono text-center mb-6">
                  {formatTime(elapsedTime)}
                </div>
                {project.isTimerRunning && (
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium animate-pulse">
                    <Play className="w-4 h-4" /> Timer is running in background
                  </div>
                )}
                <div className="mt-4 text-center text-sm text-gray-400">
                  Total Logged: {project.actualTime || 0} minutes
                </div>
              </div>
            )}

            {project.status === 'qc' && (
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl">
                {!isElevated ? (
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                    <h3 className="font-bold text-orange-900 mb-2">Under QC Review</h3>
                    <p className="text-sm text-orange-800 mb-4">
                      Your project is currently being reviewed by a Quality Control Engineer.
                    </p>

                    {/* Student Material Details */}
                    {project.projectFileUrl && (
                      <div className="mt-4 p-3 bg-white border border-orange-100 rounded-xl flex items-center justify-between shadow-sm text-left">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-[9px] uppercase font-bold text-gray-400">Your Submitted File / Link</p>
                          <p className="text-xs font-mono font-bold text-gray-750 truncate">{project.projectFileUrl.split('/').pop() || 'Project File'}</p>
                        </div>
                        <a 
                          href={project.projectFileUrl.match(/^https?:\/\//i) ? project.projectFileUrl : `https://${project.projectFileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-pink-100 hover:bg-pink-100 shadow-sm shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Submitted File
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-orange-800">
                      <AlertCircle className="w-5 h-5 text-orange-600 animate-pulse shrink-0" />
                      <h3 className="font-bold text-xs uppercase tracking-wider">Quality Control Review</h3>
                    </div>
                    <p className="text-xs text-orange-800 mb-4 font-medium">
                      Review student files and checklists. You can <strong>Approve</strong> or <strong>Reject</strong> this project.
                    </p>

                    {/* Student Material Details */}
                    {project.projectFileUrl && (
                      <div className="mb-4 p-4 bg-white border border-orange-100 rounded-2xl shadow-sm space-y-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] uppercase font-extrabold text-orange-800 tracking-wider">Student Submission File / Google Drive Link</p>
                          <p className="text-xs font-mono font-bold text-gray-700 break-all select-all mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-150">{project.projectFileUrl}</p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <a 
                            href={project.projectFileUrl.match(/^https?:\/\//i) ? project.projectFileUrl : `https://${project.projectFileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-700 transition-all shadow-md active:scale-95 text-center cursor-pointer uppercase tracking-wider"
                          >
                            <ExternalLink className="w-4 h-4" /> Download Final PDF from Google Path
                          </a>
                          
                          <p className="text-[10px] text-orange-800 text-left leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 font-medium">
                            <strong>Note for QC:</strong> Click the button above to go to the student's submitted Google path. Download their PDF design files to perform your quality check.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Decision Selection Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => setDetailQcDecision(detailQcDecision === 'approve' ? null : 'approve')}
                        className={cn(
                          "py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          detailQcDecision === 'approve'
                            ? "bg-green-600 text-white border-green-600 shadow-md"
                            : "bg-white text-green-700 border-green-200 hover:bg-green-50"
                        )}
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => setDetailQcDecision(detailQcDecision === 'reject' ? null : 'reject')}
                        className={cn(
                          "py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          detailQcDecision === 'reject'
                            ? "bg-red-600 text-white border-red-600 shadow-md"
                            : "bg-white text-red-700 border-red-200 hover:bg-red-50"
                        )}
                      >
                        <AlertCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>

                    {/* Approve Confirm View */}
                    {detailQcDecision === 'approve' && (
                      <div className="bg-white p-4 border border-green-100 rounded-xl space-y-3 shadow-md mb-2 text-left">
                        <p className="text-xs text-green-800 font-bold">
                          Are you sure you want to approve this project?
                        </p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          This will permanently mark the project as Approved, compute the points efficiency, and close the design workflow.
                        </p>
                        <button
                          onClick={async () => {
                            const qcProd = project.qcProduction;
                            if (!qcProd) {
                              alert('Quality Rule Violation: You must complete and SAVE the QC Production Art Checklist before approving the project.');
                              return;
                            }

                            const hasPendingLocal = (obj: any): boolean => {
                              if (!obj) return false;
                              if (Array.isArray(obj)) return obj.some(item => item === 'pending' || hasPendingLocal(item));
                              if (typeof obj === 'object') return Object.values(obj).some(val => val === 'pending' || hasPendingLocal(val));
                              return false;
                            };

                            if (hasPendingLocal(qcProd)) {
                              alert('Quality Rule Violation: The QC Production Art Checklist is incomplete. Please ensure all "Pending" fields on the checklist are marked (Yes/No/NA/Query) and saved before approving.');
                              return;
                            }

                            try {
                              const efficiency = project.actualTime > 0 
                                ? (project.estimatedTime / project.actualTime) * 100 
                                : 100;
                              
                              await updateDoc(doc(db, 'student_projects', project.id), {
                                status: 'approved',
                                workStatus: 'Completed',
                                correctionPdfUrl: null, // Clear correction if approved
                                efficiency: efficiency,
                                updatedAt: new Date().toISOString()
                              });
                              alert('Project approved successfully.');
                              setDetailQcDecision(null);
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
                            }
                          }}
                          className="w-full bg-green-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          Confirm Approval
                        </button>
                      </div>
                    )}

                    {/* Reject Form View */}
                    {detailQcDecision === 'reject' && (
                      <div className="bg-white p-4 border border-red-100 rounded-xl space-y-3 shadow-md mb-2 text-left">
                        <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide animate-pulse">QC Rejection Form</h4>
                        
                        {/* Target Stage Override */}
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Reject BACK to Stage</label>
                          <select
                            value={detailQcRejectionTargetStage}
                            onChange={(e) => setDetailQcRejectionTargetStage(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 font-bold text-xs text-gray-700 bg-white outline-none cursor-pointer"
                          >
                            <option value="preflight">0 - Prepress / Assembly</option>
                            <option value="production">1 - Production Art (Default)</option>
                            <option value="pqc">2 - Production QC / PQC Checklist</option>
                          </select>
                        </div>

                        {/* Error Category */}
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Error Category (Select Multiple)</label>
                          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-100 border border-gray-200 rounded-xl">
                            {qcErrorCategories.map((cat, idx) => {
                              const isSelected = detailQcSelectedCategories.includes(cat);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setDetailQcSelectedCategories(prev =>
                                      prev.includes(cat)
                                        ? prev.filter(c => c !== cat)
                                        : [...prev, cat]
                                    );
                                  }}
                                  className={cn(
                                    "px-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border rounded-lg transition-all focus:outline-none focus:ring-1 select-none cursor-pointer shadow-sm",
                                    isSelected
                                      ? "bg-red-600 border-red-700 text-white focus:ring-red-300"
                                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300"
                                  )}
                                >
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Details / Notes */}
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Rejection Remarks / Notes</label>
                          <textarea
                             value={detailQcRejectionNotes}
                             onChange={(e) => setDetailQcRejectionNotes(e.target.value)}
                             className="w-full px-3 py-1.5 rounded-lg border border-gray-200 font-medium text-xs text-gray-700 outline-none h-16 resize-none focus:ring-1 focus:ring-pink-500"
                             placeholder="Reason for rejection..."
                          />
                        </div>

                        {/* Correction PDF Upload / Link */}
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-red-600 uppercase mb-0.5">Correction File / PDF / Image</label>
                          <FileUploader 
                            path="corrections"
                            accept="application/pdf,image/*"
                            onUploadComplete={(url) => setDetailQcRejectionPdfUrl(url)}
                            className="mb-1"
                          />
                          <div className="relative">
                            <label className="block text-[8px] font-extrabold text-gray-400 uppercase mb-0.5">Or Manual Link</label>
                            <input
                              type="text"
                              value={detailQcRejectionPdfUrl}
                              onChange={(e) => setDetailQcRejectionPdfUrl(e.target.value)}
                              className="w-full px-3 py-2 border border-red-100 rounded-lg outline-none focus:ring-1 focus:ring-red-500 text-[11px] font-mono"
                              placeholder="Paste PDF link or reference path..."
                            />
                          </div>
                        </div>

                        {/* Submit Rejection */}
                        <button
                          onClick={async () => {
                            if (!detailQcRejectionNotes.trim()) {
                              alert('Please provide notes/feedback for rejection.');
                              return;
                            }
                            if (detailQcSelectedCategories.length === 0) {
                              alert('Please select at least one error category.');
                              return;
                            }
                            try {
                              const newRejection = {
                                timestamp: new Date().toISOString(),
                                errorCategory: detailQcSelectedCategories.join(', '),
                                notes: detailQcRejectionNotes
                              };
                              await updateDoc(doc(db, 'student_projects', project.id), {
                                status: detailQcRejectionTargetStage,
                                workStatus: 'Not Started',
                                lastStageActualTime: project.actualTime || 0,
                                qcRejections: [...(project.qcRejections || []), newRejection],
                                correctionPdfUrl: detailQcRejectionPdfUrl || null,
                                points: Math.max(0, (project.points || 100) - 5),
                                updatedAt: new Date().toISOString()
                              });
                              alert('Project rejected successfully!');
                              setDetailQcDecision(null);
                              setDetailQcRejectionNotes('');
                              setDetailQcRejectionPdfUrl('');
                              setDetailQcSelectedCategories(['Typography']);
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
                            }
                          }}
                          className="w-full bg-red-600 text-white py-2.5 rounded-lg font-bold text-xs hover:bg-red-700 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          Confirm Rejection to {detailQcRejectionTargetStage === 'preflight' ? 'Pre-Flight' : detailQcRejectionTargetStage === 'pqc' ? 'Production QC' : 'Production'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {project.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl shadow-sm">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-bold text-green-900 mb-2">Project Approved!</h3>
                  <p className="text-sm text-green-700 mb-4 leading-relaxed">
                    Congratulations! Your project has passed final Quality Control review and is Approved.
                  </p>

                  {/* Student Material Details */}
                  {project.projectFileUrl && (
                    <div className="mt-4 p-3 bg-white border border-green-100 rounded-xl flex items-center justify-between shadow-sm text-left">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-[9px] uppercase font-bold text-gray-450">Approved Google Drive Path / Link</p>
                        <p className="text-xs font-mono font-bold text-gray-750 truncate">{project.projectFileUrl}</p>
                      </div>
                      <a 
                        href={project.projectFileUrl.match(/^https?:\/\//i) ? project.projectFileUrl : `https://${project.projectFileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Approved Path
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Printable Forms */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Printer className="w-5 h-5 text-gray-400" /> Printable Forms
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint('client');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer text-sm font-medium text-gray-700"
                >
                  <span>Project Brief & Specifications (PDF)</span>
                  <Printer className="w-4 h-4 text-gray-400 pointer-events-none" />
                </button>
                
                {project.status === 'preflight' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrint('preflight');
                    }} 
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer text-sm font-medium text-gray-700"
                  >
                    <span>Pre-Flight Checklist</span>
                    <Printer className="w-4 h-4 text-gray-400 pointer-events-none" />
                  </button>
                )}
                
                {/* Production Art Engineer Checklist printable option removed */}
              </div>
            </div>
          </div>
        </div>

        {/* High-Fidelity In-App Document PDF Viewer Overlay / Modal */}
        {activeViewerUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in animate-duration-200">
            <div className="relative w-full h-full md:max-w-6xl md:h-[90vh] bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/30">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-600/10 rounded-xl text-pink-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base tracking-tight leading-none text-slate-100">{activeViewerTitle}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Interactive Reader & Specification Document Viewer</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* 2nd Option: Download action */}
                  <a 
                    href={getDirectDownloadUrl(activeViewerUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-pink-905/20 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File (2nd Option)</span>
                  </a>
                  
                  {/* Close Button */}
                  <button 
                    onClick={() => {
                      setActiveViewerUrl(null);
                      setActiveViewerTitle('');
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer w-8 h-8 flex items-center justify-center text-lg font-bold"
                    title="Close Viewer"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Document Content Frame Instructions banner */}
              {showDocNotice && (
                <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-3 flex items-start justify-between gap-4 text-xs shadow-inner shrink-0 relative pr-12">
                  <div className="flex items-start gap-3">
                    <span className="text-sm select-none shrink-0">💡</span>
                    {isAdmin ? (
                      <div className="leading-relaxed text-amber-955">
                        <span className="font-extrabold text-amber-900">How to Fix "File is too large to preview" Error: </span>
                        The secure document viewer has embedded file size limits for heavy high-res files. If the PDF fails to load or preview inside the app, please <strong className="text-pink-700 underline font-extrabold">compress or export a lower resolution version</strong> of your PDF (ideally kept under 15MB) and re-link it in the Admin Panel to guarantee instant previews for students.
                      </div>
                    ) : (
                      <div className="leading-relaxed text-amber-955">
                        <span className="font-extrabold text-amber-900">Having trouble loading this specification file? </span>
                        If the in-app secure preview fails to display because of the high-resolution file size, simply <strong className="text-pink-700 font-extrabold">click the "Download File (2nd Option)" button above</strong> to instantly download and view the full document.
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowDocNotice(false)}
                    className="p-1 px-1.5 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-800 hover:text-amber-950 font-bold rounded-lg transition-all text-sm absolute right-3 top-2.5 w-6 h-6 flex items-center justify-center cursor-pointer"
                    title="Close warning note"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Document Content Frame - Google Drive elements completely cropped */}
              <div className="flex-1 bg-slate-100 relative min-h-0 overflow-hidden w-full">
                <iframe 
                  src={getViewerEmbedUrl(activeViewerUrl)} 
                  className="absolute left-0 w-full h-[calc(100%+56px)] -top-[56px] border-none shadow-inner"
                  allow="autoplay; fullscreen"
                  title={activeViewerTitle}
                />
              </div>
              
              {/* Modal Footer */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Studying Brand Guidelines & mandated rules.</span>
                <span className="font-mono text-[10px]">Secure Sandbox Document Preview</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Edit Project Details & Brief Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fade-in animate-duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
              {/* Modal Header */}
              <div className="bg-pink-650 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="font-extrabold text-base text-white tracking-tight leading-none">Edit Project Details & Brief</h3>
                    <p className="text-[11px] text-pink-100 mt-1 font-medium">Direct Real-time Specification & Brief Update</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 text-pink-100 hover:text-white rounded-lg transition-colors cursor-pointer text-xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  &times;
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveProjectDetails} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b">1. Project Description / Details</h4>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1">General Details</label>
                    <textarea
                      rows={3}
                      value={editDetails}
                      onChange={e => setEditDetails(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      placeholder="Specify project requirements..."
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b">2. Project Brief Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Project Number</label>
                      <input
                        type="text"
                        value={editClientBrief.projectNumber || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, projectNumber: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm font-mono text-pink-700 font-extrabold"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Brand Name</label>
                      <input
                        type="text"
                        value={editClientBrief.brandName || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, brandName: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm font-semibold"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Pack Type</label>
                      <select
                        value={editClientBrief.packType || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, packType: e.target.value})}
                        className="px-3 py-2 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm cursor-pointer"
                      >
                        <option value="">Select Pack Type</option>
                        {['Pouch', 'Folding Carton', 'Label', 'Shrink Sleeve', 'Tube', 'Can', 'Blister Pack', 'Corrugated Box', 'Flow Wrap'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Variant Name</label>
                      <input
                        type="text"
                        value={editClientBrief.variantName || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, variantName: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Net Weight</label>
                      <input
                        type="text"
                        value={editClientBrief.netWeight || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, netWeight: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">ED Name</label>
                      <input
                        type="text"
                        value={editClientBrief.edName || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, edName: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Base File Name</label>
                      <input
                        type="text"
                        value={editClientBrief.baseFileName || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, baseFileName: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Reference File Name</label>
                      <input
                        type="text"
                        value={editClientBrief.referenceFileName || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, referenceFileName: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Master Job Name</label>
                      <input
                        type="text"
                        value={editClientBrief.masterJob || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, masterJob: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Annotation PDF Name</label>
                      <input
                        type="text"
                        value={editClientBrief.annotationPdfName || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, annotationPdfName: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                      />
                    </div>

                    <div className="flex flex-col md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 mb-1">Target File Name</label>
                      <input
                        type="text"
                        value={editClientBrief.fileName || ''}
                        onChange={e => setEditClientBrief({...editClientBrief, fileName: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                        placeholder="Auto generated or specific filename template"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Job Brief / Special Instructions</label>
                  <textarea
                    rows={3}
                    value={editClientBrief.jobBrief || ''}
                    onChange={e => setEditClientBrief({...editClientBrief, jobBrief: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                    placeholder="Provide specific notes and rules"
                  />
                </div>

                {/* Submit button bar */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold transition-all cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBrief}
                    className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-450 text-white rounded-xl text-sm font-black shadow-md shadow-pink-905/30 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    {isSavingBrief ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
