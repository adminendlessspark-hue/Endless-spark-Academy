import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, setDoc, query, where, addDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Layers, 
  Clock, 
  FileCheck, 
  RefreshCw, 
  X, 
  Plus, 
  AlertTriangle, 
  FolderOpen, 
  Printer, 
  FileText,
  Download,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { cn, getDirectDownloadUrl } from '../utils';
import { StudentProject, User } from '../types';
import PreFlightChecklist from '../components/PreFlightChecklist';
import ProductionArtChecklist from '../components/ProductionArtChecklist';
import QcProductionChecklist from '../components/QcProductionChecklist';
import ProductionReworkChecklist from '../components/ProductionReworkChecklist';
import { FileUploader } from '../components/FileUploader';
import { PrintStyles, ClientBriefPrintable, ProductionArtChecklist as ProductionArtChecklistPrint, PreFlightChecklistPrintable, QcProductionArtChecklistPrintable } from '../components/PrintableChecklists';

export default function PublicQcPanel() {
  const { user, loginWithGoogle, isLoading } = useAuth();
  const { logoUrl, brandGuidelineUrl, legalMandateUrl } = useSettings();

  const [studentQueries, setStudentQueries] = useState<any[]>([]);
  const [activeViewerUrl, setActiveViewerUrl] = useState<string | null>(null);
  const [activeViewerTitle, setActiveViewerTitle] = useState<string>('');
  const [showDocNotice, setShowDocNotice] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoading) {
      const isStaffUser = user && (user.role === 'admin' || user.role === 'qc');
      if (!isStaffUser) {
        window.location.href = '/admin';
      }
    }
  }, [user, isLoading]);

  const [projects, setProjects] = useState<StudentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<'pending' | 'active' | 'approved'>('pending');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  
  // Decision Form Fields per expanded project
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionTargetStage, setRejectionTargetStage] = useState<string>('production');
  const [rejectionCategories, setRejectionCategories] = useState<string[]>(['Typography']);
  const [rejectionNotes, setRejectionNotes] = useState<string>('');
  const [correctionPdfUrl, setCorrectionPdfUrl] = useState<string>('');

  // States for correction PDF re-upload / editing
  const [editingPdfProject, setEditingPdfProject] = useState<StudentProject | null>(null);
  const [editingRejectionIndex, setEditingRejectionIndex] = useState<number | null>(null);
  const [newCorrectionPdfUrl, setNewCorrectionPdfUrl] = useState<string>('');
  const [isUpdatingCorrectionPdf, setIsUpdatingCorrectionPdf] = useState<boolean>(false);

  // Query raising form states for QC Panel
  const [raisingQueryForProjId, setRaisingQueryForProjId] = useState<string | null>(null);
  const [raTitle, setRaTitle] = useState('');
  const [raCategory, setRaCategory] = useState('QC Review');
  const [raDescription, setRaDescription] = useState('');
  const [raSubmitting, setRaSubmitting] = useState(false);
  const [raAttachmentUrl, setRaAttachmentUrl] = useState('');
  const [raAttachmentName, setRaAttachmentName] = useState('');
  const [raDriveUrl, setRaDriveUrl] = useState('');
  
  // Internal checklist accordion states
  const [showingChecklist, setShowingChecklist] = useState<'none' | 'preflight' | 'production'>('none');
  const [activeStatusDropdown, setActiveStatusDropdown] = useState<string | null>(null);
  const [stageConfirm, setStageConfirm] = useState<{ projectId: string; targetStatus: string } | null>(null);
  const [revertConfirmId, setRevertConfirmId] = useState<string | null>(null);

  // States of expanded sections inside projects
  const [expandedSections, setExpandedSections] = useState<{
    [projectId: string]: {
      details?: boolean;
      printerSpec?: boolean;
      preflight?: boolean;
      production?: boolean;
      qcProduction?: boolean;
      guideline?: boolean;
      queries?: boolean;
    }
  }>({});

  const toggleSection = (projectId: string, section: 'details' | 'printerSpec' | 'preflight' | 'production' | 'qcProduction' | 'guideline' | 'queries') => {
    setExpandedSections(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [section]: !prev[projectId]?.[section]
      }
    }));
  };

  const isSectionExpanded = (projectId: string, section: 'details' | 'printerSpec' | 'preflight' | 'production' | 'qcProduction' | 'guideline' | 'queries') => {
    return !!expandedSections[projectId]?.[section];
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

  // States for printing
  const [printingChecklist, setPrintingChecklist] = useState<'preflight' | 'production' | 'client' | 'qcProduction' | null>(null);
  const [printingProject, setPrintingProject] = useState<StudentProject | null>(null);

  const handlePrintActionForProject = (proj: StudentProject, type: 'preflight' | 'production' | 'client' | 'qcProduction') => {
    let targetId = '';
    let title = '';
    
    if (type === 'client') {
      targetId = 'client-brief-printable';
      title = `Project Brief - ${proj.clientBrief?.projectNumber || proj.projectCode || proj.title}`;
    } else if (type === 'production') {
      targetId = 'production-art-checklist-printable';
      title = `Production Checklist - ${proj.clientBrief?.projectNumber || proj.projectCode}`;
    } else if (type === 'preflight') {
      targetId = 'preflight-checklist-printable';
      title = `Pre-flight Checklist - ${proj.clientBrief?.projectNumber || proj.projectCode}`;
    } else if (type === 'qcProduction') {
      targetId = 'qc-production-checklist-printable';
      title = `QC Production Checklist - ${proj.clientBrief?.projectNumber || proj.projectCode}`;
    }

    const printContent = document.getElementById(targetId);
    if (!printContent) {
      alert('Error: Could not find printable content. Please try again.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print or download the brief.');
      return;
    }

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
          \${printContent.outerHTML}
          <script>
            window.onload = () => {
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

  const errorCategories = ['Typography', 'Color', 'Layout', 'Bleed/Trim', 'Overprint', 'Dimensions', 'Barcode/QR Code', 'Other'];

  // Listen to projects across students and student queries
  useEffect(() => {
    // If we have a user and they are either admin or qc, we can load ALL student projects and queries
    const isStaffUser = user && (user.role === 'admin' || user.role === 'qc');
    if (!isStaffUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Listen to all projects
    const projectsRef = collection(db, 'student_projects');
    const unsub = onSnapshot(projectsRef, (snapshot) => {
      const allProjects = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as StudentProject));
      setProjects(allProjects);
      setLoading(false);
    }, (err) => {
      console.warn("Failed to subscribe to student_projects in Public QC Panel:", err);
      // Try local cache or fallback
      const cached = localStorage.getItem('cached_student_projects');
      if (cached) {
        try {
          setProjects(JSON.parse(cached));
        } catch (e) {}
      }
      setLoading(false);
    });

    // Listen to all student queries
    const queriesRef = collection(db, 'student_queries');
    const unsubQueries = onSnapshot(queriesRef, (snapshot) => {
      const allQueries = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setStudentQueries(allQueries);
    }, (err) => {
      console.warn("Failed to subscribe to student_queries in Public QC Panel:", err);
    });

    return () => {
      unsub();
      unsubQueries();
    };
  }, [user]);

  // Save projects to cache when loaded to handle potential quota limits
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('cached_student_projects', JSON.stringify(projects));
    }
  }, [projects]);



  const handleRaiseQcQuery = async (project: StudentProject) => {
    if (!raTitle.trim() || !raDescription.trim()) {
      alert("Please provide both a Query Title and Description.");
      return;
    }
    setRaSubmitting(true);
    try {
      const qProjNum = project.clientBrief?.projectNumber || project.projectCode || 'N/A';
      const firstSubQuery = {
        id: Math.random().toString(36).substring(2, 9),
        studentId: project.studentId,
        studentName: user?.name || 'QC Reviewer',
        description: raDescription.trim(),
        createdAt: new Date().toISOString(),
        studentAttachmentUrl: raAttachmentUrl || null,
        studentAttachmentName: raAttachmentName || null,
        googleDriveUrl: raDriveUrl.trim() || null
      };

      const queryData: any = {
        studentId: project.studentId,
        studentName: project.studentName || 'Student',
        title: raTitle.trim(),
        projectNumber: qProjNum,
        category: raCategory,
        description: raDescription.trim(),
        round: 'Round 1',
        status: 'pending',
        createdAt: new Date().toISOString(),
        queries: [firstSubQuery],
        studentAttachmentUrl: raAttachmentUrl || null,
        studentAttachmentName: raAttachmentName || null,
        googleDriveUrl: raDriveUrl.trim() || null
      };

      // Create the query ticket
      const docRef = await addDoc(collection(db, 'student_queries'), queryData);

      // Create notification for Faculty and Student
      await addDoc(collection(db, 'query_notifications'), {
        userId: 'staff_broadcast',
        userRole: 'faculty',
        title: 'New Query Opened by QC',
        message: `QC Reviewer opened a query on ${project.studentName}'s project: "${raTitle.slice(0, 30)}..."`,
        queryId: docRef.id,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'new_query'
      });

      await addDoc(collection(db, 'query_notifications'), {
        userId: project.studentId,
        userRole: 'student',
        title: 'QC Desk Opened a Query',
        message: `QC Reviewer opened a query on your project ${project.projectCode}: "${raTitle.slice(0, 30)}..."`,
        queryId: docRef.id,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'new_query'
      });

      alert("Query ticket successfully raised and linked to this project!");
      setRaTitle('');
      setRaDescription('');
      setRaAttachmentUrl('');
      setRaAttachmentName('');
      setRaDriveUrl('');
      setRaisingQueryForProjId(null);
    } catch (err) {
      console.error("Error raising query from QC:", err);
      alert("Failed to raise query: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRaSubmitting(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/admin';
    } catch (e) {
      console.error(e);
    }
  };

  // Extract unique students who have projects in the list
  const uniqueStudents = Array.from(new Set(projects.map(p => p.studentName).filter(Boolean))).sort();

  // Get filtered counts for tab headers
  const pendingCount = projects.filter(p => {
    if (selectedStudent !== 'all' && p.studentName !== selectedStudent) return false;
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && p.status === 'qc';
  }).length;

  const activeCount = projects.filter(p => {
    if (selectedStudent !== 'all' && p.studentName !== selectedStudent) return false;
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && p.status !== 'qc' && p.status !== 'approved';
  }).length;

  const approvedCount = projects.filter(p => {
    if (selectedStudent !== 'all' && p.studentName !== selectedStudent) return false;
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && p.status === 'approved';
  }).length;

  // Filter projects by current tab and search query
  const filteredProjects = projects.filter(project => {
    if (selectedStudent !== 'all' && project.studentName !== selectedStudent) return false;

    const matchesSearch = 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectCode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (currentTab === 'pending') {
      return project.status === 'qc';
    } else if (currentTab === 'active') {
      return project.status !== 'qc' && project.status !== 'approved';
    } else {
      return project.status === 'approved';
    }
  });

  const handleApprove = async (project: StudentProject) => {
    try {
      const efficiency = project.actualTime > 0 
        ? (project.estimatedTime / project.actualTime) * 100 
        : 100;
      
      const projectRef = doc(db, 'student_projects', project.id);
      await updateDoc(projectRef, {
        status: 'approved',
        workStatus: 'Completed',
        correctionPdfUrl: null, // Clear correction if approved
        efficiency: Math.round(efficiency),
        updatedAt: new Date().toISOString()
      });
      
      alert(`Project "${project.title}" approved successfully!`);
      setDecision(null);
      setExpandedProjectId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
    }
  };

  const handleReject = async (project: StudentProject) => {
    if (!rejectionNotes.trim()) {
      alert("Please entering rejection remarks containing precise correction feedback is mandatory!");
      return;
    }
    if (rejectionCategories.length === 0) {
      alert("Please select at least one Error Category!");
      return;
    }

    try {
      const newRejection = {
        id: `rej_${Date.now()}`,
        timestamp: new Date().toISOString(),
        rejectedBy: user?.name || 'Anonymous QC Admin',
        rejectedAt: new Date().toISOString(),
        reason: rejectionNotes,
        errorCategory: rejectionCategories.join(', '),
        notes: rejectionNotes,
        targetStage: rejectionTargetStage,
        correctionPdfUrl: correctionPdfUrl || null
      };

      const projectRef = doc(db, 'student_projects', project.id);
      await updateDoc(projectRef, {
        status: rejectionTargetStage,
        workStatus: 'Rejected',
        qcRejections: [...(project.qcRejections || []), newRejection],
        correctionPdfUrl: correctionPdfUrl || null,
        updatedAt: new Date().toISOString()
      });

      // Auto-pilot: notify student by email of QC rejection
      try {
        fetch('/api/notify-rejection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            errorCategory: rejectionCategories.join(', '),
            notes: rejectionNotes,
            rejectedBy: user?.name || 'Anonymous QC Admin',
            targetStage: rejectionTargetStage,
            correctionPdfUrl: correctionPdfUrl || null
          })
        }).then(res => res.json()).then(data => {
          if (data.error) {
            console.error("Autopilot Rejection Email Error:", data.error);
          } else {
            console.log("Autopilot Rejection Email Sent:", data.message);
          }
        });
      } catch (emailErr) {
        console.error("Failed to fetch notify-rejection API:", emailErr);
      }

      alert(`Project "${project.title}" rejected back to stage: ${rejectionTargetStage.toUpperCase()}`);

      setDecision(null);
      setRejectionNotes('');
      setRejectionCategories(['Typography']);
      setExpandedProjectId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
    }
  };

  const handleUpdateCorrectionPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPdfProject) return;
    setIsUpdatingCorrectionPdf(true);
    try {
      const projectRef = doc(db, 'student_projects', editingPdfProject.id);
      let updatedRejections = [...(editingPdfProject.qcRejections || [])];

      if (editingRejectionIndex !== null && editingRejectionIndex >= 0 && editingRejectionIndex < updatedRejections.length) {
        // Edit specific rejection index
        updatedRejections[editingRejectionIndex] = {
          ...updatedRejections[editingRejectionIndex],
          correctionPdfUrl: newCorrectionPdfUrl.trim()
        };
        
        // If it's the latest rejection, also update the main project.correctionPdfUrl
        if (editingRejectionIndex === updatedRejections.length - 1) {
          await updateDoc(projectRef, {
            correctionPdfUrl: newCorrectionPdfUrl.trim(),
            qcRejections: updatedRejections,
            updatedAt: new Date().toISOString()
          });
        } else {
          await updateDoc(projectRef, {
            qcRejections: updatedRejections,
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Fallback: update latest rejection and main correctionPdfUrl
        const latestRejectionIndex = editingPdfProject.qcRejections ? editingPdfProject.qcRejections.length - 1 : -1;
        if (latestRejectionIndex >= 0) {
          updatedRejections[latestRejectionIndex] = {
            ...updatedRejections[latestRejectionIndex],
            correctionPdfUrl: newCorrectionPdfUrl.trim()
          };
        }
        await updateDoc(projectRef, {
          correctionPdfUrl: newCorrectionPdfUrl.trim(),
          qcRejections: updatedRejections,
          updatedAt: new Date().toISOString()
        });
      }

      alert('Correction PDF Google Drive link updated successfully!');
      setEditingPdfProject(null);
      setEditingRejectionIndex(null);
      setNewCorrectionPdfUrl('');
    } catch (err) {
      console.error('Error updating correction PDF link in Public QC Panel:', err);
      alert('Failed to update: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUpdatingCorrectionPdf(false);
    }
  };

  const isStaff = user && (user.role === 'admin' || user.role === 'qc');

  return (
    <>
      <PrintStyles />
      <div className="bg-slate-50 min-h-screen text-slate-800">
      
      {/* Top Banner / Hero section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt="Endless Spark Logo" className="h-12 object-contain" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quality Control</h1>
              <p className="text-xs text-gray-500 font-medium">Evaluate & process student submissions instantly without credentials barrier</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isStaff ? (
              <div className="flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-2xl px-4 py-2 text-xs font-bold text-pink-700">
                <UserCheck className="w-4 h-4 text-pink-600" />
                <span>Signed as: {user.name} ({user.role.toUpperCase()})</span>
                <button 
                  onClick={() => window.location.href = '/admin'}
                  className="ml-2 pl-2 border-l border-pink-200 text-indigo-650 hover:text-indigo-900 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Admin Panel
                </button>
                <button 
                  onClick={handleLogOut}
                  className="ml-2 pl-2 border-l border-pink-200 text-pink-600 hover:text-pink-900 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-2 flex items-center justify-between gap-3 shrink-0">
                <span className="text-xs font-semibold text-red-800">Session Restricted</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* If user is not authorized, ask them to sign in with an authorized Admin/QC account */}
        {!isStaff ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center my-10">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
              🛡️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Access Restricted</h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto mb-8">
              This Quality Control Review Desk is restricted. Please sign in with an authorized Staff/QC or Admin account to access this console.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/admin'}
                className="bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Go to Admin Panel
              </button>
            </div>
          </div>
        ) : (
          
          /* Full Staff view */
          <div className="space-y-6">
            
            {/* Tab Controls & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0">
                <button
                  onClick={() => { setCurrentTab('pending'); setExpandedProjectId(null); }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider scale-95",
                    currentTab === 'pending'
                      ? "bg-white text-pink-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  Pending QC ({pendingCount})
                </button>
                <button
                  onClick={() => { setCurrentTab('active'); setExpandedProjectId(null); }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider scale-95",
                    currentTab === 'active'
                      ? "bg-white text-pink-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  Active Workloads ({activeCount})
                </button>
                <button
                  onClick={() => { setCurrentTab('approved'); setExpandedProjectId(null); }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider scale-95",
                    currentTab === 'approved'
                      ? "bg-white text-pink-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  Approved & Done ({approvedCount})
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by Student Name, project title, code..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>

                <div className="relative shrink-0">
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full sm:w-auto pl-3 pr-8 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20 appearance-none cursor-pointer"
                  >
                    <option value="all">All Students ({uniqueStudents.length})</option>
                    {uniqueStudents.map(studentName => (
                      <option key={studentName} value={studentName}>
                        {studentName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-gray-500">Loading student workflow database...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-800">No Projects Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">There are currently no matching assignments in the "{currentTab.toUpperCase()}" category.</p>
              </div>
            ) : (
              
              /* Project Grid / Table */
              <div className="space-y-4">
                {filteredProjects.map((project) => {
                  const isExpanded = expandedProjectId === project.id;
                  
                  return (
                    <div 
                      key={project.id}
                      className={cn(
                        "bg-white rounded-3xl border transition-all overflow-hidden",
                        isExpanded ? "border-pink-300 shadow-md ring-1 ring-pink-300" : "border-gray-100 shadow-sm hover:border-gray-300"
                      )}
                    >
                      {/* Condensed Title Row */}
                      <div 
                        onClick={() => {
                          setExpandedProjectId(isExpanded ? null : project.id);
                          setDecision(null);
                          setShowingChecklist('none');
                        }}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold",
                            project.status === 'qc' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                            project.status === 'approved' ? "bg-green-50 text-green-600 border border-green-100" :
                            "bg-slate-50 text-slate-600 border border-slate-100"
                          )}>
                            {project.status === 'qc' ? 'QC' : project.status === 'approved' ? '✓' : '•'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-gray-400 uppercase">{project.projectCode || 'PROJECT'}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider",
                                project.status === 'preflight' ? "bg-amber-100 text-amber-700" :
                                project.status === 'production' ? "bg-blue-100 text-blue-700" :
                                project.status === 'pqc' ? "bg-purple-100 text-purple-700" :
                                project.status === 'qc' ? "bg-orange-500 text-white animate-pulse" :
                                "bg-green-500 text-white"
                              )}>
                                {project.status === 'pqc' ? 'Prod. QC' : project.status === 'qc' ? 'QC' : project.status.toUpperCase()}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider",
                                project.workStatus === 'Paused' ? "bg-orange-100 text-orange-700" :
                                project.workStatus === 'In Progress' ? "bg-blue-100 text-blue-700" :
                                project.workStatus === 'Completed' ? "bg-green-100 text-green-700" :
                                "bg-gray-100 text-gray-655"
                              )}>
                                {project.workStatus || 'Not Started'}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mt-1 truncate">{project.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Student: <span className="font-semibold text-slate-700">{project.studentName || 'Unknown Student'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-6 shrink-0 md:text-right border-t border-gray-50 pt-3 md:border-t-0 md:pt-0">
                          <div className="space-y-1">
                            <span className="block text-[9px] font-bold text-gray-450 uppercase tracking-widest">Time Budget</span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{project.actualTime || 0}m / {project.estimatedTime || 0}m</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-pink-600 hover:underline">
                              {isExpanded ? 'Hide Controls' : 'Review Project'}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-pink-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded QC Inspection Center */}
                      {isExpanded && (
                        <div className="border-t border-gray-150 bg-slate-50/50 p-6 space-y-6">
                          
                          {/* Inner double-column workspace layout */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* LEFT SIDE: Accordions (Brief, Printer Specs, Pre-flight, Production Checklist) */}
                            <div className="lg:col-span-2 space-y-4">
                              
                              {/* 1. Project Details & Brief Accordion */}
                              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <button 
                                  onClick={() => toggleSection(project.id, 'details')}
                                  className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group cursor-pointer"
                                  type="button"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                                      <FileText className="w-4 h-4 text-pink-600" />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                                      Project Details & Brief
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {project.clientBrief && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPrintingProject(project);
                                          setPrintingChecklist('client');
                                        }}
                                        className="text-pink-600 hover:text-pink-700 flex items-center gap-1 text-[10px] font-black uppercase p-1 rounded hover:bg-pink-50 transition-all active:scale-95 cursor-pointer mr-2 border border-pink-100"
                                      >
                                        <Printer className="w-3 h-3" /> Print Brief
                                      </button>
                                    )}
                                    {isSectionExpanded(project.id, 'details') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                  </div>
                                </button>
                                
                                {isSectionExpanded(project.id, 'details') && (
                                  <div className="p-4 space-y-4 bg-slate-50/30">
                                    <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap text-xs md:text-sm border border-gray-150 leading-relaxed font-semibold">
                                      {project.details || 'No detailed instructions provided.'}
                                    </div>

                                    {project.clientBrief && (
                                      <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Brief & Specifications</h4>
                                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                            <div className="p-3">
                                              <span className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Project Number</span>
                                              <span className="text-xs font-semibold text-gray-900 break-words font-mono">{project.clientBrief.projectNumber || project.projectCode || 'Pending / N/A'}</span>
                                            </div>
                                            {Object.entries(project.clientBrief).map(([key, value]) => {
                                              if (key === 'jobBrief' || key === 'preflightChecklist' || key === 'productionChecklist' || key === 'projectNumber') return null;
                                              return (
                                                <div key={key} className="p-3 border-t md:border-t-0 border-gray-100">
                                                  <span className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                  </span>
                                                  <span className="block text-xs text-gray-900 font-semibold break-words">
                                                    {String(value || '-')}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                          {project.clientBrief.jobBrief && (
                                            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                                              <span className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Job Brief / Special Instructions</span>
                                              <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {project.clientBrief.jobBrief}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Brand Guideline & Mandate Accordion */}
                              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <button 
                                  onClick={() => toggleSection(project.id, 'guideline')}
                                  className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group cursor-pointer"
                                  type="button"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                                      <FileCheck className="w-4 h-4 text-pink-600" />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                                      Brand Guideline & Mandate
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-[10px] font-medium bg-white border px-2 py-0.5 rounded-full font-bold uppercase shrink-0",
                                      (brandGuidelineUrl || legalMandateUrl) ? "text-pink-600 border-pink-100 bg-pink-50/50" : "text-gray-400 border-gray-100"
                                    )}>
                                      {(brandGuidelineUrl || legalMandateUrl) ? 'AVAILABLE' : 'N/A'}
                                    </span>
                                    {isSectionExpanded(project.id, 'guideline') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                  </div>
                                </button>
                                
                                {isSectionExpanded(project.id, 'guideline') && (
                                  <div className="p-4 bg-slate-50/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Brand Guideline Card */}
                                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-pink-300 transition-all">
                                        <div className="space-y-2">
                                          <div className="w-6 h-6 bg-pink-50 rounded-lg flex items-center justify-center text-pink-600 font-extrabold text-[10px]">
                                            01
                                          </div>
                                          <h4 className="text-xs font-bold text-gray-950">Brand Guideline Specification</h4>
                                          <p className="text-[11px] text-gray-500 leading-normal">
                                            Reference correct brand logos, typography weights, color palette standards, spacing bounds, and visual identity requirements.
                                          </p>
                                        </div>
                                        <div className="pt-4 flex flex-col gap-1.5">
                                          {brandGuidelineUrl ? (
                                            <>
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  setActiveViewerUrl(brandGuidelineUrl);
                                                  setActiveViewerTitle("Brand Guideline Specification");
                                                }}
                                                className="w-full py-1.5 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                              >
                                                <FileText className="w-3.5 h-3.5" />
                                                View Brand Guideline Spec
                                              </button>
                                              <a 
                                                href={getDirectDownloadUrl(brandGuidelineUrl)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full py-1.5 px-3 border border-gray-250 hover:border-pink-300 text-gray-600 hover:text-pink-600 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all bg-slate-50/50"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                Download Guideline PDF
                                              </a>
                                            </>
                                          ) : (
                                            <div className="w-full py-2 px-3 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-bold text-center border border-gray-200 select-none">
                                              Not Configured
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Legal Mandate Card */}
                                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-pink-300 transition-all">
                                        <div className="space-y-2">
                                          <div className="w-6 h-6 bg-pink-50 rounded-lg flex items-center justify-center text-pink-600 font-extrabold text-[10px]">
                                            02
                                          </div>
                                          <h4 className="text-xs font-bold text-gray-950">Legal & Regulatory Mandates</h4>
                                          <p className="text-[11px] text-gray-500 leading-normal">
                                            Ensure packaging artwork complies with mandatory size guidelines, barcode safety clearances, font sizing tolerances, placement rules, and net content disclosures.
                                          </p>
                                        </div>
                                        <div className="pt-4 flex flex-col gap-1.5">
                                          {legalMandateUrl ? (
                                            <>
                                              <button 
                                                type="button"
                                                onClick={() => {
                                                  setActiveViewerUrl(legalMandateUrl);
                                                  setActiveViewerTitle("Legal & Regulatory Mandates");
                                                }}
                                                className="w-full py-1.5 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                              >
                                                <FileText className="w-3.5 h-3.5" />
                                                View Legal Mandate Spec
                                              </button>
                                              <a 
                                                href={getDirectDownloadUrl(legalMandateUrl)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full py-1.5 px-3 border border-gray-250 hover:border-pink-300 text-gray-600 hover:text-pink-600 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all bg-slate-50/50"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                Download Mandate PDF
                                              </a>
                                            </>
                                          ) : (
                                            <div className="w-full py-2 px-3 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-bold text-center border border-gray-200 select-none">
                                              Not Configured
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Student Queries & Query Answers Accordion */}
                              {(() => {
                                const projectQueries = studentQueries.filter(q => {
                                  const qProjNum = (q.projectNumber || '').toLowerCase().trim();
                                  const projCode = (project.projectCode || '').toLowerCase().trim();
                                  const projNum = (project.clientBrief?.projectNumber || '').toLowerCase().trim();
                                  return qProjNum && (projCode.includes(qProjNum) || qProjNum.includes(projCode) || qProjNum === projNum || projNum.includes(qProjNum));
                                });

                                return (
                                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                    <button 
                                      onClick={() => toggleSection(project.id, 'queries')}
                                      className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group cursor-pointer"
                                      type="button"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                                          <HelpCircle className="w-4 h-4 text-pink-600" />
                                        </div>
                                        <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                                          Student Queries & Query Answers
                                        </h3>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          "text-[10px] font-medium bg-white border px-2 py-0.5 rounded-full font-bold uppercase shrink-0",
                                          projectQueries.length > 0 ? "text-pink-600 border-pink-100 bg-pink-50/50" : "text-gray-400 border-gray-100"
                                        )}>
                                          {projectQueries.length} {projectQueries.length === 1 ? 'QUERY' : 'QUERIES'}
                                        </span>
                                        {isSectionExpanded(project.id, 'queries') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                      </div>
                                    </button>
                                    
                                    {isSectionExpanded(project.id, 'queries') && (
                                      <div className="p-4 bg-slate-50/30 space-y-4">
                                        {/* QC Query submission button/header block */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3.5 rounded-xl border border-gray-150 gap-3 text-left">
                                          <div>
                                            <h4 className="text-xs font-bold text-gray-950">QC Query Submission Tool</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">Submit an official ticket or technical design query directly to the student and faculty tracker for this project.</p>
                                          </div>
                                          {raisingQueryForProjId !== project.id ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setRaisingQueryForProjId(project.id);
                                                setRaTitle('QC Verification Query: ' + (project.projectCode || ''));
                                                setRaCategory('QC Review');
                                                setRaDescription('');
                                              }}
                                              className="py-1.5 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[10px] sm:text-xs font-black uppercase flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm shrink-0 self-start sm:self-center"
                                            >
                                              <Plus className="w-3.5 h-3.5" /> Raise New Query
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => setRaisingQueryForProjId(null)}
                                              className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] sm:text-xs font-black uppercase flex items-center gap-1 transition-all cursor-pointer border border-gray-250 shrink-0 self-start sm:self-center"
                                            >
                                              <X className="w-3.5 h-3.5" /> Close Form
                                            </button>
                                          )}
                                        </div>

                                        {/* Active raising inline form */}
                                        {raisingQueryForProjId === project.id && (
                                          <form 
                                            onSubmit={(e) => {
                                              e.preventDefault();
                                              handleRaiseQcQuery(project);
                                            }}
                                            className="bg-white p-4 rounded-xl border-2 border-pink-100 shadow-sm space-y-3.5 text-left"
                                          >
                                            <h5 className="text-[11px] font-extrabold text-pink-700 uppercase tracking-wider flex items-center gap-1.5">
                                              <HelpCircle className="w-4 h-4 text-pink-600" /> Issue New QC Support Query
                                            </h5>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                              <div className="md:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Query Short Title</label>
                                                <input 
                                                  type="text"
                                                  required
                                                  value={raTitle}
                                                  onChange={(e) => setRaTitle(e.target.value)}
                                                  placeholder="e.g., Font Embed Issue / Color Model mismatch"
                                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Category</label>
                                                <select
                                                  value={raCategory}
                                                  onChange={(e) => setRaCategory(e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs font-bold outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
                                                >
                                                  <option value="QC Review">QC Review</option>
                                                  <option value="Prepress Alignment">Prepress Alignment</option>
                                                  <option value="Color Model">Color Model</option>
                                                  <option value="Technical Requirement">Technical Requirement</option>
                                                  <option value="Other Support">Other Support</option>
                                                </select>
                                              </div>
                                            </div>

                                            <div>
                                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Detailed Query Description</label>
                                              <textarea
                                                required
                                                rows={3}
                                                value={raDescription}
                                                onChange={(e) => setRaDescription(e.target.value)}
                                                placeholder="Provide the exact instructions, issues or details the student/faculty must address..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-y"
                                              />
                                            </div>

                                            {/* File Upload & Google Drive Links option block */}
                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4">
                                              {/* PDF/Image File Uploader Option */}
                                              <div className="flex-1 space-y-1.5">
                                                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block">PDF/Image Attachment Option (Optional)</span>
                                                <FileUploader
                                                  path={`queries/${project.id || 'qc'}`}
                                                  accept="application/pdf,image/*"
                                                  onUploadComplete={(url) => {
                                                    const rawPath = url.split('?')[0];
                                                    const ext = rawPath.includes('.') ? rawPath.split('.').pop()?.toLowerCase() : 'pdf';
                                                    setRaAttachmentUrl(url);
                                                    setRaAttachmentName(`QC_Query_${project.projectCode || 'NoCode'}_Attachment.${ext}`);
                                                  }}
                                                  className="bg-white border rounded-xl"
                                                />
                                                {raAttachmentUrl && (
                                                  <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold bg-green-50 p-2 rounded-lg border border-green-150">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Uploaded: {raAttachmentName}
                                                  </div>
                                                )}
                                              </div>

                                              {/* Google Drive Link Option */}
                                              <div className="flex-1 space-y-1.5">
                                                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block">Google Drive URL Link (Optional)</span>
                                                <div className="relative rounded-md shadow-sm">
                                                  <input
                                                    type="url"
                                                    value={raDriveUrl}
                                                    onChange={(e) => setRaDriveUrl(e.target.value)}
                                                    placeholder="e.g., https://drive.google.com/drive/folders/..."
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
                                                  />
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                                  If your design assets are large, paste a shared Google Drive link or shared folder URL. Ensure link access is unrestricted.
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex justify-end gap-2.5 pt-1">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setRaAttachmentUrl('');
                                                  setRaAttachmentName('');
                                                  setRaDriveUrl('');
                                                  setRaisingQueryForProjId(null);
                                                }}
                                                className="px-3 py-1.5 border border-gray-250 text-gray-600 rounded-lg text-[10px] sm:text-xs font-bold transition-all hover:bg-gray-50 cursor-pointer"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="submit"
                                                disabled={raSubmitting}
                                                className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-lg text-[10px] sm:text-xs uppercase transition-all flex items-center gap-1 cursor-pointer disabled:bg-pink-300 animate-none"
                                              >
                                                {raSubmitting ? "Submitting..." : "Submit Ticket"}
                                              </button>
                                            </div>
                                          </form>
                                        )}

                                        {projectQueries.length === 0 ? (
                                          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200 text-xs font-semibold text-gray-500">
                                            No support tickets or queries raised for this project.
                                          </div>
                                        ) : (
                                          <div className="space-y-4 text-left">
                                            {projectQueries.map((q) => (
                                              <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                  <div>
                                                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                                      {q.category || 'General Support'}
                                                    </span>
                                                    <h4 className="text-xs font-bold text-gray-900 mt-1">{q.title}</h4>
                                                  </div>
                                                  <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                                    q.status === 'solved' ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                                  )}>
                                                    {q.status || 'pending'}
                                                  </span>
                                                </div>
                                                
                                                <div className="border-t border-slate-100 pt-2.5 space-y-3.5">
                                                  {(q.queries || [q]).map((subQ: any, subIdx: number) => (
                                                    <div key={subQ.id || subIdx} className="space-y-3 pl-3 border-l-2 border-pink-400">
                                                      {/* Student Query Text */}
                                                      <div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase mb-1">
                                                          <span>{subQ.studentName || q.studentName || 'Student'}</span>
                                                          <span>•</span>
                                                          <span>{subQ.createdAt ? new Date(subQ.createdAt).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed">
                                                          {subQ.description}
                                                        </p>
                                                        {subQ.studentAttachmentUrl && (
                                                          <div className="mt-1.5">
                                                            <a 
                                                              href={subQ.studentAttachmentUrl} 
                                                              target="_blank" 
                                                              rel="noopener noreferrer"
                                                              className="inline-flex items-center gap-1 text-[10px] text-pink-600 hover:underline font-bold"
                                                            >
                                                              <FileText className="w-3 h-3" />
                                                              View Attached File ({subQ.studentAttachmentName || 'Attachment'})
                                                            </a>
                                                          </div>
                                                        )}
                                                        {subQ.googleDriveUrl && (
                                                          <div className="mt-1.5">
                                                            <a 
                                                              href={subQ.googleDriveUrl} 
                                                              target="_blank" 
                                                              rel="noopener noreferrer"
                                                              className="inline-flex items-center gap-1.5 text-[10px] text-blue-600 hover:underline font-bold bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-150 inline-flex"
                                                            >
                                                              <ExternalLink className="w-3.5 h-3.5 text-blue-500 animate-none" />
                                                              Open Google Drive Reference
                                                            </a>
                                                          </div>
                                                        )}
                                                      </div>

                                                      {/* Faculty Response/Answer */}
                                                      {subQ.solution ? (
                                                        <div className="bg-pink-50/20 p-3 rounded-lg border border-pink-100 space-y-1.5 ml-2">
                                                          <div className="flex items-center justify-between">
                                                            <span className="text-[9px] text-pink-700 font-extrabold uppercase tracking-wider">
                                                              ✓ RESOLVED / RESPONSE BY: {subQ.solvedByName || 'Faculty Member'}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 font-bold">
                                                              {subQ.solvedAt ? new Date(subQ.solvedAt).toLocaleDateString() : ''}
                                                            </span>
                                                          </div>
                                                          <p className="text-xs text-gray-900 leading-normal font-bold">
                                                            {subQ.solution}
                                                          </p>
                                                          {subQ.answerAttachmentUrl && (
                                                            <div className="pt-1">
                                                              <a 
                                                                href={subQ.answerAttachmentUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-[10px] text-pink-600 hover:underline font-bold"
                                                              >
                                                                <FileText className="w-3 h-3" />
                                                                View Attached Solution ({subQ.answerAttachmentName || 'Attachment'})
                                                              </a>
                                                            </div>
                                                          )}
                                                        </div>
                                                      ) : (
                                                        <div className="p-2.5 bg-amber-50/20 border border-amber-100 rounded-lg text-[10px] font-bold text-amber-700 ml-2">
                                                          ⏳ Awaiting resolution from faculty reviewer...
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* 2. Printer Specification Accordion */}
                              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <button 
                                  onClick={() => toggleSection(project.id, 'printerSpec')}
                                  className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group cursor-pointer"
                                  type="button"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                                      <Printer className="w-4 h-4 text-pink-600" />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                                      Printer Specification
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium bg-gray-50 border px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase shrink-0">
                                      {project.printerSpec ? 'AVAILABLE' : 'N/A'}
                                    </span>
                                    {isSectionExpanded(project.id, 'printerSpec') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                  </div>
                                </button>
                                
                                {isSectionExpanded(project.id, 'printerSpec') && (
                                  <div className="p-4 space-y-4 bg-slate-50/30 text-left">
                                    {project.printerSpec ? (
                                      <>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                          <div className="p-2.5 bg-white rounded-xl border border-gray-150">
                                            <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">Printer Name</span>
                                            <span className="text-xs font-bold text-gray-900">{project.printerSpec.printerName || '-'}</span>
                                          </div>
                                          <div className="p-2.5 bg-white rounded-xl border border-gray-150">
                                            <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">Print Method</span>
                                            <span className="text-xs font-bold text-gray-900">{project.printerSpec.printMethod || '-'}</span>
                                          </div>
                                          <div className="p-2.5 bg-white rounded-xl border border-gray-150">
                                            <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">Printing Substrate</span>
                                            <span className="text-xs font-bold text-gray-900">{project.printerSpec.printingSubstrate || '-'}</span>
                                          </div>
                                          <div className="p-2.5 bg-white rounded-xl border border-gray-150">
                                            <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">Face/Reverse Print</span>
                                            <span className="text-xs font-bold text-gray-900">{project.printerSpec.faceReversePrint || '-'}</span>
                                          </div>
                                          <div className="p-2.5 bg-white rounded-xl border border-gray-150">
                                            <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">Max Colors</span>
                                            <span className="text-xs font-bold text-gray-900">{project.printerSpec.maxColors || '-'}</span>
                                          </div>
                                          <div className="p-2.5 bg-white rounded-xl border border-gray-150">
                                            <span className="block text-[9px] text-gray-400 uppercase font-bold mb-0.5">Varnish Included</span>
                                            <span className="text-xs font-bold text-gray-900">{project.printerSpec.varnishIncluded || '-'}</span>
                                          </div>
                                        </div>

                                        {project.printerSpec.barcodes && project.printerSpec.barcodes.length > 0 && (
                                          <div className="space-y-1.5 pt-2">
                                            <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b pb-0.5">Barcodes</h5>
                                            <div className="overflow-x-auto rounded-xl border border-gray-150 bg-white shadow-sm">
                                              <table className="w-full text-xs text-left">
                                                <thead className="bg-gray-50 border-b border-gray-150">
                                                  <tr>
                                                    <th className="p-2 border-r border-gray-100 last:border-r-0 text-[10px] font-bold text-gray-500">Type</th>
                                                    <th className="p-2 border-r border-gray-100 last:border-r-0 text-[10px] font-bold text-gray-500">Number</th>
                                                    <th className="p-2 border-r border-gray-100 last:border-r-0 text-[10px] font-bold text-gray-500">Colour</th>
                                                    <th className="p-2 border-r border-gray-100 last:border-r-0 text-[10px] font-bold text-gray-500">BWR</th>
                                                    <th className="p-2 text-[10px] font-bold text-gray-500">Narrow Bar</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                  {project.printerSpec.barcodes.map((bc, idx) => (
                                                    <tr key={idx}>
                                                      <td className="p-2 border-r border-gray-100 last:border-r-0 font-medium text-gray-800">{bc.codeType || '-'}</td>
                                                      <td className="p-2 border-r border-gray-100 last:border-r-0 font-mono text-gray-800">{bc.codeNumber || '-'}</td>
                                                      <td className="p-2 border-r border-gray-100 last:border-r-0 text-gray-800">{bc.codeColour || '-'}</td>
                                                      <td className="p-2 border-r border-gray-100 last:border-r-0 text-gray-800">{bc.bwr || '-'}</td>
                                                      <td className="p-2 text-gray-800">{bc.narrowBar || '-'}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        )}

                                        {project.printerSpec.colorRotation && project.printerSpec.colorRotation.length > 0 && (
                                          <div className="space-y-1.5 pt-2">
                                            <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b pb-0.5">Color Rotation Details</h5>
                                            <div className="overflow-x-auto rounded-xl border border-gray-150 bg-white shadow-sm">
                                              <table className="w-full text-xs text-left">
                                                <thead className="bg-gray-50 border-b border-gray-150">
                                                  <tr>
                                                    <th className="p-2 border-r border-gray-100 last:border-r-0 text-[10px] font-bold text-gray-500">Color Name</th>
                                                    <th className="p-2 border-r border-gray-100 last:border-r-0 text-[10px] font-bold text-gray-500">Screen</th>
                                                    <th className="p-2 border-r border-gray-100 last:border-r-0 text-[10px] font-bold text-gray-500">LPI</th>
                                                    <th className="p-2 border-r border-gray-100 last:border-r-0 text-[10px] font-bold text-gray-500">Angle</th>
                                                    <th className="p-2 text-[10px] font-bold text-gray-500">New</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                  {project.printerSpec.colorRotation.filter(cr => cr.colorName).map((cr, idx) => (
                                                    <tr key={idx}>
                                                      <td className="p-2 border-r border-gray-100 last:border-r-0 font-medium text-gray-800">{cr.colorName}</td>
                                                      <td className="p-2 border-r border-gray-100 last:border-r-0 text-gray-800">{cr.lineScreen || '-'}</td>
                                                      <td className="p-2 border-r border-gray-100 last:border-r-0 text-gray-800">{cr.lpi || '-'}</td>
                                                      <td className="p-2 border-r border-gray-100 last:border-r-0 text-gray-800">{cr.angle || '-'}</td>
                                                      <td className="p-2 text-gray-800">{cr.new || '-'}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        )}

                                        {project.printerSpec.artworkInfo && (
                                          <div className="space-y-1.5 pt-2">
                                            <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b pb-0.5">Artwork Information</h5>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-150">
                                              {Object.entries(project.printerSpec.artworkInfo).map(([key, val]) => (
                                                <div key={key} className="bg-slate-50 p-2 rounded border border-slate-100">
                                                  <span className="block text-[8px] text-gray-400 uppercase font-bold mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                  <span className="text-[11px] font-bold text-gray-900 break-all">{String(val || '-')}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="p-4 bg-gray-50 rounded-xl text-center text-xs font-semibold text-gray-500 border border-dashed border-gray-200">
                                        No printer specifications configured for this project.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* 3. Digital Pre-Flight Checklist Accordion */}
                              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <button 
                                  onClick={() => toggleSection(project.id, 'preflight')}
                                  className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group cursor-pointer"
                                  type="button"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                                      <FileCheck className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                                      Digital Pre-Flight Checklist
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {project.digitalPreflight && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPrintingProject(project);
                                          setPrintingChecklist('preflight');
                                        }}
                                        className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded hover:bg-teal-50 transition-all active:scale-95 cursor-pointer mr-2 border border-teal-100 bg-white"
                                      >
                                        <Printer className="w-3 h-3" /> Print
                                      </button>
                                    )}
                                    <span className={cn(
                                      "text-[10px] font-medium bg-white border px-2 py-0.5 rounded-full font-bold uppercase shrink-0",
                                      project.digitalPreflight ? "text-teal-600 border-teal-100 bg-teal-50/50" : "text-gray-400 border-gray-100"
                                    )}>
                                      {project.digitalPreflight ? 'COMPLETED' : 'PENDING'}
                                    </span>
                                    {isSectionExpanded(project.id, 'preflight') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                  </div>
                                </button>
                                
                                {isSectionExpanded(project.id, 'preflight') && (
                                  <div className="p-4 bg-slate-50/30">
                                    <PreFlightChecklist 
                                      readOnly={true} 
                                      isAdmin={true} 
                                      initialData={(project as any).digitalPreflight} 
                                      printerSpec={project.printerSpec}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* 4. Production Art Engineer Checklist Accordion */}
                              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <button 
                                  onClick={() => toggleSection(project.id, 'production')}
                                  className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group cursor-pointer"
                                  type="button"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                                      <FileCheck className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                                      Production Art Engineer Checklist
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {project.digitalProduction && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPrintingProject(project);
                                          setPrintingChecklist('production');
                                        }}
                                        className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded hover:bg-teal-50 transition-all active:scale-95 cursor-pointer mr-2 border border-teal-100 bg-white"
                                      >
                                        <Printer className="w-3 h-3" /> Print
                                      </button>
                                    )}
                                    <span className={cn(
                                      "text-[10px] font-medium bg-white border px-2 py-0.5 rounded-full font-bold uppercase shrink-0",
                                      project.digitalProduction ? "text-teal-600 border-teal-100 bg-teal-50/50" : "text-gray-400 border-gray-100"
                                    )}>
                                      {project.digitalProduction ? 'COMPLETED' : 'PENDING'}
                                    </span>
                                    {isSectionExpanded(project.id, 'production') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                  </div>
                                </button>
                                
                                {isSectionExpanded(project.id, 'production') && (
                                  <div className="p-4 bg-slate-50/30">
                                    <ProductionArtChecklist 
                                      readOnly={true} 
                                      isAdmin={true} 
                                      initialData={(project as any).digitalProduction} 
                                      printerSpec={project.printerSpec}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* QC Production Checklist Panel */}
                              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mt-4">
                                <button 
                                  onClick={() => toggleSection(project.id, 'qcProduction')}
                                  className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-all border-b border-gray-100 group cursor-pointer"
                                  type="button"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                                      <FileText className="w-4 h-4 text-pink-600" />
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                                      QC Production Checklist
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {(project as any).qcProduction && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPrintingProject(project);
                                          setPrintingChecklist('qcProduction');
                                        }}
                                        className="text-pink-600 hover:text-pink-700 flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded hover:bg-pink-50 transition-all active:scale-95 cursor-pointer mr-2 border border-pink-100 bg-white"
                                      >
                                        <Printer className="w-3 h-3" /> Print
                                      </button>
                                    )}
                                    <span className={cn(
                                      "text-[10px] font-medium bg-white border px-2 py-0.5 rounded-full font-bold uppercase shrink-0",
                                      (project as any).qcProduction ? "text-pink-600 border-pink-100 bg-pink-50/50" : "text-gray-400 border-gray-100"
                                    )}>
                                      {(project as any).qcProduction ? 'COMPLETED' : 'PENDING'}
                                    </span>
                                    {isSectionExpanded(project.id, 'qcProduction') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                  </div>
                                </button>
                                
                                {isSectionExpanded(project.id, 'qcProduction') && (
                                  <div className="p-4 bg-slate-50/30">
                                    <QcProductionChecklist 
                                      readOnly={!isStaff} 
                                      initialData={(project as any).qcProduction} 
                                      printerSpec={project.printerSpec}
                                      onSave={async (data) => {
                                        try {
                                          const projectRef = doc(db, 'student_projects', project.id);
                                          await updateDoc(projectRef, {
                                            qcProduction: data,
                                            updatedAt: new Date().toISOString()
                                          });
                                          alert("QC Production Art Checklist saved successfully!");
                                        } catch (err) {
                                          handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
                                        }
                                      }}
                                    />

                                    {(project as any).qcProduction && (
                                      <div className="mt-6 border-t border-gray-150 pt-6 bg-white rounded-xl p-4 border border-gray-100">
                                        <h4 className="text-xs uppercase font-extrabold text-orange-900 tracking-wider mb-3">Student's Rework Progress</h4>
                                        <ProductionReworkChecklist
                                          readOnly={true}
                                          qcProductionData={(project as any).qcProduction}
                                          initialReworkData={(project as any).reworkChecklist}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                            </div>

                            {/* RIGHT SIDE: KPI Overview Panel & Decisions */}
                            <div className="lg:col-span-1 space-y-4 text-left">
                              
                              {/* Task KPI Overview */}
                              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-pink-500" /> Task Overview
                                </h4>
                                
                                <div className="space-y-3 text-xs">
                                  <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-gray-450 font-medium">Standard / Course Category</span>
                                    <span className="font-bold text-slate-800 capitalize">{(project.category || '').replace(/-/g, ' ')}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                    <span className="text-gray-450 font-medium">Current Workflow Stage</span>
                                    {isStaff ? (
                                      <div className="flex flex-col items-end gap-1 shrink-0">
                                        <select
                                          value={stageConfirm?.projectId === project.id ? stageConfirm.targetStatus : project.status}
                                          onChange={(e) => {
                                            const newStatus = e.target.value;
                                            if (newStatus === project.status) {
                                              setStageConfirm(null);
                                            } else {
                                              setStageConfirm({ projectId: project.id, targetStatus: newStatus });
                                            }
                                          }}
                                          className="bg-white border border-pink-200 hover:border-pink-300 rounded-xl px-2.5 py-1 text-xs font-bold text-pink-700 outline-none cursor-pointer shadow-sm uppercase shrink-0 transition-all font-sans"
                                        >
                                          {['client', 'preflight', 'production', 'pqc', 'qc', 'approved'].map((stg) => (
                                            <option key={stg} value={stg} className="text-gray-700 bg-white">
                                              {stg === 'client' ? 'Client Brief' :
                                               stg === 'preflight' ? 'Pre-Flight Plan' :
                                               stg === 'production' ? 'Production Art' :
                                               stg === 'pqc' ? 'Production QC' :
                                               stg === 'qc' ? 'QC' :
                                               stg === 'approved' ? 'Approved' : stg.toUpperCase()}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : (
                                      <span className="font-extrabold text-pink-600 uppercase">{project.status}</span>
                                    )}
                                  </div>

                                  {/* Beautiful Inline Confirmation for Stage Override */}
                                  {stageConfirm && stageConfirm.projectId === project.id && (
                                    <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-3 text-xs space-y-2 mt-1 animate-in fade-in slide-in-from-top-1 text-left">
                                      <p className="font-bold text-slate-700">
                                        Are you sure you want to change stage to <span className="text-pink-600 font-extrabold uppercase">
                                          {stageConfirm.targetStatus === 'client' ? 'Client Brief' :
                                           stageConfirm.targetStatus === 'preflight' ? 'Pre-Flight Plan' :
                                           stageConfirm.targetStatus === 'production' ? 'Production Art' :
                                           stageConfirm.targetStatus === 'pqc' ? 'Production QC' :
                                           stageConfirm.targetStatus === 'qc' ? 'QC' :
                                           stageConfirm.targetStatus === 'approved' ? 'Approved' : stageConfirm.targetStatus}
                                        </span>?
                                      </p>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const newStatus = stageConfirm.targetStatus;
                                            try {
                                              await updateDoc(doc(db, 'student_projects', project.id), {
                                                status: newStatus,
                                                workStatus: newStatus === 'approved' ? 'Completed' : 'In Progress',
                                                updatedAt: new Date().toISOString()
                                              });
                                              setStageConfirm(null);
                                            } catch (err) {
                                              handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
                                            }
                                          }}
                                          className="px-3 py-1.5 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors cursor-pointer"
                                        >
                                          Confirm Change
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setStageConfirm(null)}
                                          className="px-3 py-1.5 bg-white border border-slate-250 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-gray-450 font-medium">Student Speed Efficiency</span>
                                    <span className="font-bold text-slate-700">{project.efficiency ? `${project.efficiency}%` : 'Pending Approval'}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-b border-slate-50 pb-2 relative">
                                    <span className="text-gray-450 font-medium">Work Session Status</span>
                                    
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveStatusDropdown(activeStatusDropdown === project.id ? null : project.id);
                                        }}
                                        className={cn(
                                          "w-[140px] flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm bg-white cursor-pointer select-none",
                                          project.workStatus === 'Paused' ? "border-orange-200 text-orange-600 bg-orange-50/30" :
                                          project.workStatus === 'In Progress' ? "border-blue-100 text-blue-600 bg-blue-50/30" :
                                          project.workStatus === 'Completed' ? "border-green-200 text-green-600 bg-green-50/30" :
                                          "border-gray-200 text-gray-500 hover:border-gray-300"
                                        )}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            project.workStatus === 'Paused' ? "bg-orange-500" :
                                            project.workStatus === 'In Progress' ? "bg-blue-500 animate-pulse" :
                                            project.workStatus === 'Completed' ? "bg-green-500" :
                                            "bg-gray-400"
                                          )} />
                                          <span>{project.workStatus || 'Not Started'}</span>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50 transition-transform" />
                                      </button>

                                      {activeStatusDropdown === project.id && (
                                        <>
                                          <div 
                                            className="fixed inset-0 z-45 bg-transparent" 
                                            onClick={(e) => { e.stopPropagation(); setActiveStatusDropdown(null); }} 
                                          />
                                          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-150 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                                            {(['Not Started', 'In Progress', 'Paused', 'Completed'] as const).map((status) => {
                                              const isSelected = (project.workStatus || 'Not Started') === status;
                                              return (
                                                <button
                                                  key={status}
                                                  type="button"
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setActiveStatusDropdown(null);
                                                    
                                                    const updates: any = {
                                                      workStatus: status,
                                                      updatedAt: new Date().toISOString()
                                                    };

                                                    if (status === 'In Progress') {
                                                      if (!project.isTimerRunning) {
                                                        updates.isTimerRunning = true;
                                                        updates.lastTimerStart = new Date().toISOString();
                                                      }
                                                    } else {
                                                      if (project.isTimerRunning && project.lastTimerStart) {
                                                        const startTime = new Date(project.lastTimerStart).getTime();
                                                        const endTime = Date.now();
                                                        const sessionTimeMinutes = Math.ceil((endTime - startTime) / 60000);
                                                        updates.isTimerRunning = false;
                                                        updates.lastTimerStart = null;
                                                        updates.actualTime = (project.actualTime || 0) + sessionTimeMinutes;
                                                      }
                                                    }

                                                    try {
                                                      await updateDoc(doc(db, 'student_projects', project.id), updates);
                                                      alert(`Project status successfully changed to "${status}".`);
                                                    } catch (err) {
                                                      handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
                                                    }
                                                  }}
                                                  className={cn(
                                                    "w-[calc(100%-12px)] mx-1.5 px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors text-left cursor-pointer",
                                                    isSelected
                                                      ? "bg-blue-500 text-white font-bold"
                                                      : "text-gray-750 hover:bg-slate-50"
                                                  )}
                                                >
                                                  <span>{status}</span>
                                                  {isSelected && <CheckCircle className="w-4 h-4 text-white animate-scale-up" />}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-450 font-medium">Task Last Updated</span>
                                    <span className="font-medium text-slate-600">{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Student Submitted File URL</p>
                                  {project.projectFileUrl ? (
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-mono p-2 bg-slate-100 rounded border border-slate-200 font-medium text-slate-600 break-all leading-normal select-all">
                                        {project.projectFileUrl}
                                      </p>
                                      <a 
                                        href={project.projectFileUrl.match(/^https?:\/\//i) ? project.projectFileUrl : `https://${project.projectFileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 bg-indigo-600 text-white rounded-xl py-2 px-3 text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" /> Open Google Path Link
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-center font-bold text-[10px]">
                                      ⚠️ Student hasn't submitted a production file link yet
                                    </div>
                                  )}
                                </div>

                                {project.correctionPdfUrl && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-2 flex items-center gap-1">
                                      <FileCheck className="w-3.5 h-3.5 text-rose-500" /> Active Correction PDF Link
                                    </p>
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-mono p-2 bg-red-50/50 rounded border border-red-100 font-medium text-slate-600 break-all leading-normal select-all">
                                        {project.correctionPdfUrl}
                                      </p>
                                      <div className="flex gap-2">
                                        <a 
                                          href={project.correctionPdfUrl.match(/^https?:\/\//i) ? project.correctionPdfUrl : `https://${project.correctionPdfUrl}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 text-white rounded-xl py-1.5 px-3 text-[11px] font-bold hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" /> View PDF
                                        </a>
                                        <button 
                                          onClick={() => {
                                            setEditingPdfProject(project);
                                            setEditingRejectionIndex(project.qcRejections ? project.qcRejections.length - 1 : null);
                                            setNewCorrectionPdfUrl(project.correctionPdfUrl || '');
                                          }}
                                          className="flex-1 py-1.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-[11px] font-bold transition-all border border-red-200 cursor-pointer"
                                        >
                                          Update Link
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* QC Decision Center & Form */}
                              <div className="bg-gradient-to-br from-slate-50 to-orange-50/20 p-5 rounded-2xl border border-pink-100/70 shadow-sm space-y-4">
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-1">
                                    🛡️ QC Decision Center
                                  </h4>
                                  <p className="text-[11px] text-gray-600 leading-relaxed">
                                    Approve to sign off and award course points. Reject to send back feedback detailing correction steps.
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <button
                                    onClick={() => setDecision(decision === 'approve' ? null : 'approve')}
                                    className={cn(
                                      "py-2 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-1 cursor-pointer",
                                      decision === 'approve'
                                        ? "bg-green-600 text-white border-green-600 shadow-sm"
                                        : "bg-white text-green-700 border-green-200 hover:bg-green-50"
                                    )}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button
                                    onClick={() => setDecision(decision === 'reject' ? null : 'reject')}
                                    className={cn(
                                      "py-2 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-1 cursor-pointer",
                                      decision === 'reject'
                                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                                        : "bg-white text-red-700 border-red-200 hover:bg-red-50"
                                    )}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>

                                {project.status === 'qc' && (
                                  <div className="space-y-2 mt-2 w-full">
                                    {revertConfirmId !== project.id ? (
                                      <button
                                        type="button"
                                        onClick={() => setRevertConfirmId(project.id)}
                                        className="w-full py-2 border border-dashed border-pink-300 hover:border-pink-500 rounded-xl bg-pink-50/40 text-pink-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-pink-50 transition-all cursor-pointer font-sans"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-pink-600" />
                                        Revert to Production (No Rejection / No Penalty)
                                      </button>
                                    ) : (
                                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs space-y-2 text-left animate-in fade-in duration-150">
                                        <p className="font-bold text-amber-900">
                                          Revert stage back to Production?
                                        </p>
                                        <p className="text-[11px] text-amber-700 leading-normal">
                                          This allows the student to immediately resume working without logging a rejection count or penalizing their speed grade/accuracy score.
                                        </p>
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                const projectRef = doc(db, 'student_projects', project.id);
                                                await updateDoc(projectRef, {
                                                  status: 'production',
                                                  workStatus: 'In Progress',
                                                  updatedAt: new Date().toISOString()
                                                });
                                                setRevertConfirmId(null);
                                                setDecision(null);
                                              } catch (err) {
                                                handleFirestoreError(err, OperationType.UPDATE, `student_projects/${project.id}`);
                                              }
                                            }}
                                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                                          >
                                            Yes, Revert Stage
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setRevertConfirmId(null)}
                                            className="px-3 py-1.5 bg-white border border-amber-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Approve Confirmation */}
                                {decision === 'approve' && (
                                  <div className="bg-white p-4 border border-green-100 rounded-xl space-y-3 shadow-inner text-left animate-in fade-in duration-150">
                                    <p className="text-[10px] text-green-800 font-bold uppercase tracking-wider flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5" /> Confirm Task approval
                                    </p>
                                    <p className="text-[11px] text-gray-600 leading-relaxed">
                                      Close production of <strong>{project.title}</strong> of student <strong>{project.studentName}</strong>. This registers student points and is final.
                                    </p>
                                    <button
                                      onClick={() => handleApprove(project)}
                                      className="w-full bg-green-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-green-700 transition-colors uppercase tracking-wider cursor-pointer"
                                    >
                                      Commit Project Approval Now
                                    </button>
                                  </div>
                                )}

                                {/* Reject Correction Form */}
                                {decision === 'reject' && (
                                  <div className="bg-white p-4 border border-red-100 rounded-xl space-y-3 shadow-inner text-left animate-in fade-in duration-150">
                                    <h4 className="text-[10px] font-bold text-red-950 uppercase tracking-wider flex items-center gap-1 border-b pb-1">
                                      <AlertCircle className="w-4 h-4 text-red-600" /> Corrections Feedback
                                    </h4>

                                    <div className="space-y-2">
                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Route Back To Stage</label>
                                        <select
                                          value={rejectionTargetStage}
                                          onChange={(e) => setRejectionTargetStage(e.target.value)}
                                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-bold text-xs text-slate-700 outline-none cursor-pointer"
                                        >
                                          <option value="preflight">0 - Prepress / Assembly</option>
                                          <option value="production">1 - Production Art (Default)</option>
                                          <option value="pqc">2 - Production QC / PQC Checklist</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Error Category (Select Multiple)</label>
                                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-gray-150 rounded-xl">
                                          {errorCategories.map((cat, idx) => {
                                            const isSelected = rejectionCategories.includes(cat);
                                            return (
                                              <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                  setRejectionCategories(prev => 
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

                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Correction Instructions</label>
                                        <textarea
                                          value={rejectionNotes}
                                          onChange={(e) => setRejectionNotes(e.target.value)}
                                          placeholder="e.g. Dimensions error on top bleed flaps..."
                                          className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-medium text-xs text-slate-700 outline-none h-16 resize-none"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Proof Proof Link (Optional)</label>
                                        <input
                                          type="text"
                                          value={correctionPdfUrl}
                                          onChange={(e) => setCorrectionPdfUrl(e.target.value)}
                                          placeholder="https://drive.google.com/open?id=corrections"
                                          className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg font-mono text-xs text-slate-600 outline-none"
                                        />
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => handleReject(project)}
                                      className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer mt-1"
                                    >
                                      Commit Rejection Notes
                                    </button>
                                  </div>
                                )}

                              </div>

                              {/* Rejection History Section */}
                              {project.qcRejections && project.qcRejections.length > 0 && (
                                <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm space-y-4">
                                  <div className="flex items-center justify-between border-b border-red-50 pb-2">
                                    <h4 className="text-xs font-bold text-red-650 uppercase tracking-wider flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" /> Rejection History
                                    </h4>
                                    <span className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      Rejected {project.qcRejections.length} {project.qcRejections.length === 1 ? 'Time' : 'Times'}
                                    </span>
                                  </div>

                                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {project.qcRejections.map((rejection, idx) => (
                                      <div key={idx} className="bg-red-50/40 p-3 rounded-xl border border-red-100/50 space-y-1.5 text-xs text-slate-700">
                                        <div className="flex justify-between items-center">
                                          <span className="font-extrabold text-red-800 text-[10px] bg-red-100 px-1.5 py-0.5 rounded">
                                            REJECTION #{idx + 1}
                                          </span>
                                          <span className="text-[10px] text-red-400 font-mono font-semibold">
                                            {rejection.timestamp ? new Date(rejection.timestamp).toLocaleString() : 'N/A'}
                                          </span>
                                        </div>

                                        <p className="bg-white p-2 rounded border border-red-100/30 text-slate-800 font-medium text-[11px] leading-relaxed">
                                          {rejection.notes || rejection.reason}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 pt-0.5 font-medium">
                                          <div>
                                            <span className="text-gray-400">By:</span> {rejection.rejectedBy || 'Anonymous QC'}
                                          </div>
                                          <div>
                                            <span className="text-gray-400">To:</span> <span className="font-bold text-red-700 uppercase">{rejection.targetStage || 'production'}</span>
                                          </div>
                                        </div>

                                        {rejection.correctionPdfUrl && (
                                          <div className="mt-2 pt-1.5 border-t border-red-100/40 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-red-700">Correction PDF Path:</span>
                                            <div className="flex items-center gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingPdfProject(project);
                                                  setEditingRejectionIndex(idx);
                                                  setNewCorrectionPdfUrl(rejection.correctionPdfUrl || '');
                                                }}
                                                className="text-[10px] font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                                              >
                                                Edit Link
                                              </button>
                                              <a 
                                                href={rejection.correctionPdfUrl.match(/^https?:\/\//i) ? rejection.correctionPdfUrl : `https://${rejection.correctionPdfUrl}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[9px] font-extrabold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors border border-red-200 cursor-pointer"
                                              >
                                                <ExternalLink className="w-2.5 h-2.5" /> View Correction PDF
                                              </a>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>

                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {printingChecklist && (
        <>
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center no-print">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-pink-100 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="flex flex-col gap-1 text-left">
                <h3 className="text-lg font-bold text-gray-900">Preparing Printable Forms...</h3>
                <p className="text-sm text-gray-500">The print window will open automatically.</p>
                <div className="flex flex-col gap-2 mt-4">
                  <button 
                    onClick={() => printingProject && handlePrintActionForProject(printingProject, printingChecklist)}
                    className="px-6 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <Printer className="w-5 h-5" />
                    Open Print / Download Window
                  </button>
                  <button 
                    onClick={() => {
                      setPrintingChecklist(null);
                      setPrintingProject(null);
                    }}
                    className="text-sm text-gray-400 hover:text-pink-600 font-medium py-2 cursor-pointer text-center"
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="print-only">
            {printingChecklist === 'client' && <ClientBriefPrintable project={printingProject} logoUrl={logoUrl} />}
            {printingChecklist === 'production' && <ProductionArtChecklistPrint project={printingProject} logoUrl={logoUrl} />}
            {printingChecklist === 'preflight' && <PreFlightChecklistPrintable project={printingProject} logoUrl={logoUrl} />}
            {printingChecklist === 'qcProduction' && printingProject && <QcProductionArtChecklistPrintable project={printingProject} logoUrl={logoUrl} />}
          </div>
        </>
      )}

      {/* High-Fidelity In-App Document PDF Viewer Overlay / Modal */}
      {activeViewerUrl && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in duration-200 no-print">
          <div className="relative w-full h-full md:max-w-6xl md:h-[90vh] bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/30">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center gap-3 text-left">
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
                >
                  &times;
                </button>
              </div>
            </div>

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
              <span className="font-medium text-left">Studying Brand Guidelines & mandated rules.</span>
              <span className="font-mono text-[10px]">Secure Sandbox Document Preview</span>
            </div>
          </div>
        </div>
      )}

      {/* Update Correction PDF Link Modal */}
      {editingPdfProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-red-500 animate-pulse" />
              Update Correction PDF Link
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Enter the correct Google Drive folder or PDF link. This will automatically update the active correction file and the selected rejection log for the student in autopilot.
            </p>
            <form onSubmit={handleUpdateCorrectionPdf} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Google Drive / Correction Link
                </label>
                <input
                  type="text"
                  required
                  value={newCorrectionPdfUrl}
                  onChange={(e) => setNewCorrectionPdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or Google Drive URL"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPdfProject(null);
                    setEditingRejectionIndex(null);
                    setNewCorrectionPdfUrl('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCorrectionPdf}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-100 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isUpdatingCorrectionPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Path'
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
