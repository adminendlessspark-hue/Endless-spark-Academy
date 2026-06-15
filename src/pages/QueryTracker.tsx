import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, Check, Clock, AlertCircle, User, 
  Calendar, ArrowRight, CheckCircle, Bell, Search, Filter, 
  Trash2, Sparkles, Send, X, BookOpen, ChevronRight, HelpCircle,
  FileText, UploadCloud, Download, Eye, Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { useLocation } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, doc, deleteDoc, getDocs, limit 
} from 'firebase/firestore';
import { StudentQuery, QueryNotification } from '../types';

export const QUERY_CATEGORIES = [
  "Base file incorrect",
  "Color name incorrect",
  "barcode incorrect",
  "Link missing",
  "Font Missing",
  "Brief is not clear",
  "Layout approval",
  "colour rotation update",
  "Printer Spec",
  "information missing"
] as const;

export const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Base file incorrect":
      return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30";
    case "Color name incorrect":
      return "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-455 dark:border-purple-900/30";
    case "barcode incorrect":
      return "bg-amber-50 text-amber-750 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
    case "Link missing":
      return "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-450 dark:border-indigo-900/30";
    case "Font Missing":
      return "bg-orange-50 text-orange-750 border-orange-100 dark:bg-orange-950/20 dark:text-orange-450 dark:border-orange-900/30";
    case "Brief is not clear":
      return "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-450 dark:border-sky-900/30";
    case "Layout approval":
      return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30";
    case "colour rotation update":
      return "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/20 dark:text-teal-450 dark:border-teal-900/30";
    case "Printer Spec":
      return "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-450 dark:border-violet-900/30";
    case "information missing":
      return "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/20 dark:text-pink-450 dark:border-pink-900/30";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
  }
};

export const renderCategoryBadges = (categoryString: string = 'Base file incorrect') => {
  const parts = categoryString.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    parts.push('Base file incorrect');
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {parts.map((part, index) => {
        const style = getCategoryStyles(part);
        return (
          <span key={`${part}-${index}`} className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 inline-block align-middle" style={{ whiteSpace: 'nowrap' }}>
            {part}
          </span>
        );
      })}
    </div>
  );
};

interface MultiSelectCategoryProps {
  selectedString: string;
  onChange: (newValue: string) => void;
  id?: string;
  size?: 'sm' | 'md';
}

function MultiSelectCategory({ selectedString, onChange, id, size = 'md' }: MultiSelectCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedList = selectedString ? selectedString.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggleCategory = (cat: string) => {
    let newList: string[];
    if (selectedList.includes(cat)) {
      newList = selectedList.filter(item => item !== cat);
    } else {
      newList = [...selectedList, cat];
    }
    // ensure at least one category or let it be empty (if empty, we default on save/render)
    onChange(newList.join(', '));
  };

  const removeCategory = (e: React.MouseEvent, cat: string) => {
    e.stopPropagation();
    const newList = selectedList.filter(item => item !== cat);
    onChange(newList.join(', '));
  };

  return (
    <div className="relative w-full" id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all flex items-center justify-between gap-2 cursor-pointer ${
          size === 'sm' ? 'p-2 rounded-lg text-xs' : 'p-3 rounded-xl text-sm'
        }`}
      >
        <div className="flex flex-wrap gap-1.5 items-center mr-6 overflow-hidden">
          {selectedList.length === 0 ? (
            <span className="text-slate-450 dark:text-slate-400">Select categories...</span>
          ) : (
            selectedList.map(cat => {
              const bgStyle = getCategoryStyles(cat);
              return (
                <span
                  key={cat}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border ${bgStyle}`}
                >
                  {cat}
                  <X
                    className="w-3 h-3 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                    onClick={(e) => removeCategory(e, cat)}
                  />
                </span>
              );
            })
          )}
        </div>
        <div className="text-slate-400 shrink-0">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute z-40 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1.5">
            <div className="text-[10px] font-bold text-slate-405 px-2.5 py-1 uppercase tracking-wider border-b border-slate-100 mb-1">
              Select One or More Categories
            </div>
            {QUERY_CATEGORIES.map(cat => {
              const isChecked = selectedList.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isChecked 
                      ? 'bg-pink-50 text-pink-700 font-bold' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all shrink-0 ${
                      isChecked ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                    </span>
                    {cat}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 ${getCategoryStyles(cat)}`}>
                    sample
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export const downloadDataUrlFile = (fileName: string, dataUrl?: string) => {
  const link = document.createElement('a');
  // Fallback to a valid, lightweight micro-PDF outputting "(Attached PDF Document)" if dataUrl is draft/empty
  link.href = dataUrl && dataUrl.startsWith('data:') 
    ? dataUrl 
    : 'data:application/pdf;base64,JVBERi0xLjQKJScsaYVNOTY3CjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNCAwIFIKPj4KPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNTAgNzAwIFRkCihIZWxwIERlc2sgLSBBdHRhY2hlZCBQREYgRG9jdW1lbnQpIFNqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDExMSAwMDAwMCBuIAowMDAwMDAwMjI0IDAwMDAwIG4gCjAwMDAwMDAyOTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgozOTAKJSVFT0Y=';
  link.download = fileName || 'attached-document.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface QueryTrackerProps {
  isDemoMode?: boolean;
  initialRole?: 'student' | 'faculty';
}

export default function QueryTracker({ isDemoMode = false, initialRole = 'student' }: QueryTrackerProps) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [demoRole, setDemoRole] = useState<'student' | 'faculty'>(initialRole);
  const isStaff = isDemoMode 
    ? (demoRole === 'faculty') 
    : (isAdmin || user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'qc');

  // Initial Demo Data
  const initialDemoQueries: StudentQuery[] = [
    {
      id: "demo_q1",
      studentId: "demo_student_1",
      studentName: "Arjun Mehta",
      title: "AutoCAD layout misalignment in Week 4 coursework",
      projectNumber: "AC-104",
      category: "Base file incorrect",
      description: "I am having issues rendering the floorplan correctly in AutoCAD. The scaling doesn't match the guideline values in module 4. Is there an export setting I missed?",
      status: "pending",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      studentAttachmentName: "autocad-week4-draft-lowres.pdf",
      studentAttachmentUrl: "#DEMOMOCK",
      studentAttachmentType: "application/pdf",
      queries: [
        {
          id: "sub_demo_1",
          projectNumber: "AC-104",
          studentName: "Arjun Mehta",
          category: "Base file incorrect",
          description: "I am having issues rendering the floorplan correctly in AutoCAD. The scaling doesn't match the guideline values in module 4. Is there an export setting I missed?",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          status: "pending",
          studentAttachmentName: "autocad-week4-draft-lowres.pdf",
          studentAttachmentUrl: "#DEMOMOCK",
          studentAttachmentType: "application/pdf"
        }
      ]
    },
    {
      id: "demo_q2",
      studentId: "demo_student_2",
      studentName: "Sarah Williams",
      title: "Packaging assignment printing barcode issues",
      projectNumber: "PK-202",
      category: "barcode incorrect",
      description: "I have uploaded my final packaging layout, but the barcodes are rendered extremely small when I try to print to PDF. Is there a specific configuration format?",
      status: "solved",
      solvedBy: "demo_faculty_1",
      solvedByName: "Prof. Vikram Sen",
      solution: "Congratulations on completing your layout! Your barcode just needs to have at least a 0.5-inch padding around the borders so scanner devices can read it correctly in pre-production testing.",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      solvedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      studentAttachmentName: "packaging-barcode-test-lowres.pdf",
      studentAttachmentUrl: "#DEMOMOCK",
      studentAttachmentType: "application/pdf",
      answerAttachmentName: "instructor-barcode-solution.pdf",
      answerAttachmentUrl: "#DEMOMOCK",
      answerAttachmentType: "application/pdf",
      queries: [
        {
          id: "sub_demo_2",
          projectNumber: "PK-202",
          studentName: "Sarah Williams",
          category: "barcode incorrect",
          description: "I have uploaded my final packaging layout, but the barcodes are rendered extremely small when I try to print to PDF. Is there a specific configuration format?",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: "solved",
          solution: "Congratulations on completing your layout! Your barcode just needs to have at least a 0.5-inch padding around the borders so scanner devices can read it correctly in pre-production testing.",
          solvedBy: "demo_faculty_1",
          solvedByName: "Prof. Vikram Sen",
          solvedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
          studentAttachmentName: "packaging-barcode-test-lowres.pdf",
          studentAttachmentUrl: "#DEMOMOCK",
          studentAttachmentType: "application/pdf",
          answerAttachmentName: "instructor-barcode-solution.pdf",
          answerAttachmentUrl: "#DEMOMOCK",
          answerAttachmentType: "application/pdf"
        }
      ]
    }
  ];

  const initialDemoNotifications: QueryNotification[] = [
    {
      id: "demo_notif_1",
      userId: "demo_student_1",
      userRole: "faculty",
      title: "New Query Raised",
      message: "Arjun Mehta raised query: \"AutoCAD layout misalignment...\"",
      queryId: "demo_q1",
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      type: "new_query"
    }
  ];

  const [demoQueriesList, setDemoQueriesList] = useState<StudentQuery[]>(initialDemoQueries);
  const [demoNotifsList, setDemoNotifsList] = useState<QueryNotification[]>(initialDemoNotifications);
  
  // State for queries
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<StudentQuery | null>(null);
  
  // State for raised query form
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProjectNumber, setNewProjectNumber] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newCategory, setNewCategory] = useState('Base file incorrect');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Round and editing
  const [newRound, setNewRound] = useState('Round 1');
  const [subRound, setSubRound] = useState('Round 1');

  // Student Editing States
  const [editingSubQueryId, setEditingSubQueryId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editProjectNumber, setEditProjectNumber] = useState('');
  const [editRound, setEditRound] = useState('Round 1');

  // Multi-query in same task/ticket form states
  const [isAddingSubQuery, setIsAddingSubQuery] = useState(false);
  const [subProjectNumber, setSubProjectNumber] = useState('');
  const [subStudentName, setSubStudentName] = useState('');
  const [subCategory, setSubCategory] = useState('Base file incorrect');
  const [subDescription, setSubDescription] = useState('');
  
  // State for solution form
  const [solutionText, setSolutionText] = useState('');
  const [subAnswers, setSubAnswers] = useState<Record<string, string>>({});
  const [subAnswersAttachments, setSubAnswersAttachments] = useState<Record<string, { name: string; dataUrl: string; type: string } | null>>({});

  // File upload states representing student low-res PDF and faculty/admin answer PDF
  const [newAttachment, setNewAttachment] = useState<{ name: string; dataUrl: string; type: string } | null>(null);
  const [subAttachment, setSubAttachment] = useState<{ name: string; dataUrl: string; type: string } | null>(null);

  // Non-blocking UI confirmation states
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [confirmDeleteSubId, setConfirmDeleteSubId] = useState<string | null>(null);

  // Reset confirmation states on query panel switch
  useEffect(() => {
    setIsConfirmingDelete(false);
    setConfirmDeleteSubId(null);
  }, [selectedQuery]);

  // Sync user info
  useEffect(() => {
    if (user) {
      setNewStudentName(user.name || '');
      setSubStudentName(user.name || '');
    }
  }, [user]);

  // Fetch student projects for query autopilot dropdown selection
  useEffect(() => {
    if (isDemoMode) {
      setUserProjects([
        { id: 'p1', projectCode: '200102062', clientBrief: { projectNumber: '200102062', brandName: 'Athira', variantName: 'Cashew Nut', packType: 'Pouch' } },
        { id: 'p2', projectCode: 'AC-104', clientBrief: { projectNumber: 'AC-104', brandName: 'Premium Bites', variantName: 'Almonds', packType: 'Folding Carton' } },
        { id: 'p3', projectCode: 'PK-202', clientBrief: { projectNumber: 'PK-202', brandName: 'Delight', variantName: 'Sweets Box', packType: 'Label' } }
      ]);
      return;
    }
    if (!user) return;

    let q;
    if (isStaff) {
      // Staff can choose from all projects in the system to help students
      q = query(collection(db, 'student_projects'), orderBy('createdAt', 'desc'), limit(150));
    } else {
      // Students can only see/select their assigned projects
      q = query(collection(db, 'student_projects'), where('studentId', '==', user.id));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUserProjects(list);
    }, (err) => {
      console.error('Error loading projects for query tracker selection:', err);
    });

    return () => unsubscribe();
  }, [user, isStaff, isDemoMode]);

  // Handle auto-populations from React Router navigation state (e.g. from Project Dashboard)
  useEffect(() => {
    if (location.state) {
      const { projectNumber, selectAndOpenRaise, initialTitle, initialCategory, initialRound } = location.state as { 
        projectNumber?: string;
        selectAndOpenRaise?: boolean;
        initialTitle?: string;
        initialCategory?: string;
        initialRound?: string;
      };
      if (projectNumber) {
        setNewProjectNumber(projectNumber);
      }
      if (initialTitle) {
        setNewTitle(initialTitle);
      }
      if (initialCategory) {
        setNewCategory(initialCategory);
      }
      if (initialRound) {
        setNewRound(initialRound || 'Round 1');
      }
      if (selectAndOpenRaise) {
        setIsRaiseModalOpen(true);
      }
    }
  }, [location.state]);

  const handleProjectClick = async (projectNum: string) => {
    if (!projectNum || projectNum === 'N/A') return;
    
    try {
      if (isDemoMode) {
        alert(`In Demo Mode, clicking project number "${projectNum}" would normally look up the project in the system and open it. Since this is a demo, we are showing this placeholder action.`);
        return;
      }
      
      const projectsRef = collection(db, 'student_projects');
      
      // Query projects where 'clientBrief.projectNumber' == projectNum
      const q = query(projectsRef, where('clientBrief.projectNumber', '==', projectNum.trim()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const id = snap.docs[0].id;
        window.open(`/project/${id}`, '_blank');
        return;
      }
      
      // Secondary fallback query for 'projectCode' == projectNum
      const qCode = query(projectsRef, where('projectCode', '==', projectNum.trim()));
      const snapCode = await getDocs(qCode);
      
      if (!snapCode.empty) {
        const id = snapCode.docs[0].id;
        window.open(`/project/${id}`, '_blank');
        return;
      }

      // Check for partial or manual match
      const allQ = query(projectsRef, limit(200));
      const allSnap = await getDocs(allQ);
      const matched = allSnap.docs.find(doc => {
        const data = doc.data();
        const num1 = data.clientBrief?.projectNumber?.toString().toLowerCase().trim();
        const num2 = data.projectCode?.toString().toLowerCase().trim();
        const target = projectNum.toLowerCase().trim();
        return num1 === target || num2 === target;
      });

      if (matched) {
        window.open(`/project/${matched.id}`, '_blank');
        return;
      }
      
      alert(`Could not find an associated Project with Project Number "${projectNum}"`);
    } catch (err) {
      console.error('Error finding project:', err);
      alert('Failed to load project: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  
  // State for notifications
  const [notifications, setNotifications] = useState<QueryNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'solved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dual source selection based on Demo state
  const activeQueries = isDemoMode ? demoQueriesList : queries;
  const activeNotifications = isDemoMode ? demoNotifsList : notifications;

  // 1. Fetch Queries
  useEffect(() => {
    if (isDemoMode) {
      setIsLoading(false);
      return;
    }
    if (!user) return;

    let q;
    if (isStaff) {
      // Staff see all queries
      q = query(collection(db, 'student_queries'), orderBy('createdAt', 'desc'));
    } else {
      // Students see only their queries
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
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'student_queries');
    });

    return () => unsubscribe();
  }, [user, isStaff, isDemoMode]);

  // 2. Fetch Notifications 
  useEffect(() => {
    if (isDemoMode) return;
    if (!user) return;

    let q;
    if (isStaff) {
      // Staff sees notifications targeting faculty/admin
      q = query(
        collection(db, 'query_notifications'),
        where('userRole', 'in', ['faculty', 'admin']),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else {
      // Student sees their specific notifications
      q = query(
        collection(db, 'query_notifications'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsList: QueryNotification[] = [];
      snapshot.forEach((docSnap) => {
        notifsList.push({ id: docSnap.id, ...docSnap.data() } as QueryNotification);
      });
      setNotifications(notifsList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'query_notifications');
    });

    return () => unsubscribe();
  }, [user, isStaff, isDemoMode]);

  // Raise Query Handler
  const handleRaiseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const queryId = `query_${Date.now()}`;
      const prNumber = newProjectNumber.trim() || 'N/A';
      const sName = newStudentName.trim() || user?.name || 'Anonymous Student';

      const fileFields = newAttachment ? {
        studentAttachmentName: newAttachment.name,
        studentAttachmentUrl: newAttachment.dataUrl,
        studentAttachmentType: newAttachment.type
      } : {};

      const firstSubQuery = {
        id: `sub_${Date.now()}`,
        projectNumber: prNumber,
        studentName: sName,
        category: newCategory,
        description: newDescription.trim(),
        round: newRound || 'Round 1',
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
        ...fileFields
      };
      
      if (isDemoMode) {
        // Mimic small response delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const newQuery: StudentQuery = {
          id: queryId,
          studentId: "demo_student_user",
          studentName: sName,
          title: newTitle.trim(),
          projectNumber: prNumber,
          category: newCategory,
          description: newDescription.trim(),
          round: newRound || 'Round 1',
          status: 'pending',
          createdAt: new Date().toISOString(),
          queries: [firstSubQuery],
          ...fileFields
        };

        const newNotif: QueryNotification = {
          id: `demo_notif_${Date.now()}`,
          userId: 'staff_broadcast',
          userRole: 'faculty',
          title: 'New Query Raised',
          message: `${sName} raised query: "${newTitle.slice(0, 30)}..."`,
          queryId: queryId,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'new_query'
        };

        setDemoQueriesList(prev => [newQuery, ...prev]);
        setDemoNotifsList(prev => [newNotif, ...prev]);
        
        setNewTitle('');
        setNewDescription('');
        setNewProjectNumber('');
        setNewAttachment(null);
        setNewRound('Round 1');
        setIsRaiseModalOpen(false);
        return;
      }

      if (!user) return;
      
      const queryData: any = {
        studentId: user.id,
        studentName: sName,
        title: newTitle.trim(),
        projectNumber: prNumber,
        category: newCategory,
        description: newDescription.trim(),
        round: newRound || 'Round 1',
        status: 'pending',
        createdAt: new Date().toISOString(),
        queries: [firstSubQuery],
        ...fileFields
      };

      // 1. Add student query
      const docRef = await addDoc(collection(db, 'student_queries'), queryData);
      
      // 2. Create notification for Admin/Faculty
      await addDoc(collection(db, 'query_notifications'), {
        userId: 'staff_broadcast',
        userRole: 'faculty', // targeted role
        title: 'New Query Raised',
        message: `${sName} raised query: "${newTitle.slice(0, 30)}..."`,
        queryId: docRef.id,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'new_query'
      });

      // Browser push notification fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Query Raised', {
          body: `${sName} submitted: ${newTitle}`
        });
      }

      setNewTitle('');
      setNewDescription('');
      setNewProjectNumber('');
      setNewAttachment(null);
      setIsRaiseModalOpen(false);
    } catch (err) {
      console.error('Error raising query:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add sub-query handler to support raising MULTIPLE queries in the SAME ticket/task
  const handleAddSubQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery || !subDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const prNumber = subProjectNumber.trim() || selectedQuery.projectNumber || 'N/A';
      const sName = subStudentName.trim() || user?.name || selectedQuery.studentName || 'Anonymous Student';

      const fileFields = subAttachment ? {
        studentAttachmentName: subAttachment.name,
        studentAttachmentUrl: subAttachment.dataUrl,
        studentAttachmentType: subAttachment.type
      } : {};

      const newSubQueryItem = {
        id: `sub_${Date.now()}`,
        projectNumber: prNumber,
        studentName: sName,
        category: subCategory,
        description: subDescription.trim(),
        round: subRound || 'Round 2',
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
        ...fileFields
      };

      const existingSubs = (selectedQuery.queries || [
        {
          id: `sub_${selectedQuery.id}`,
          projectNumber: selectedQuery.projectNumber || 'N/A',
          studentName: selectedQuery.studentName,
          category: selectedQuery.category || 'Base file incorrect',
          description: selectedQuery.description,
          round: selectedQuery.round || 'Round 1',
          createdAt: selectedQuery.createdAt,
          status: selectedQuery.status,
          solution: selectedQuery.solution,
          solvedBy: selectedQuery.solvedBy,
          solvedByName: selectedQuery.solvedByName,
          solvedAt: selectedQuery.solvedAt,
          studentAttachmentName: selectedQuery.studentAttachmentName,
          studentAttachmentUrl: selectedQuery.studentAttachmentUrl,
          studentAttachmentType: selectedQuery.studentAttachmentType,
          answerAttachmentName: selectedQuery.answerAttachmentName,
          answerAttachmentUrl: selectedQuery.answerAttachmentUrl,
          answerAttachmentType: selectedQuery.answerAttachmentType
        }
      ]).map(item => ({
        ...item,
        round: item.round || 'Round 1'
      }));

      const finalQueries = [...existingSubs, newSubQueryItem];

      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const updatedQuery: StudentQuery = {
          ...selectedQuery,
          status: 'pending',
          queries: finalQueries
        };

        setDemoQueriesList(prev => prev.map(q => q.id === selectedQuery.id ? updatedQuery : q));
        setSelectedQuery(updatedQuery);
        setSubDescription('');
        setSubAttachment(null);
        setSubRound('Round 1');
        setIsAddingSubQuery(false);
        setIsSubmitting(false);
        
        // Add demo notification
        const newNotif: QueryNotification = {
          id: `demo_notif_${Date.now()}`,
          userId: 'staff_broadcast',
          userRole: 'faculty',
          title: 'Additional Query Added',
          message: `${sName} added query [${subCategory}] under ticket: "${selectedQuery.title}"`,
          queryId: selectedQuery.id,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'new_query'
        };
        setDemoNotifsList(prev => [newNotif, ...prev]);
        return;
      }

      if (!user) return;
      
      const qDocRef = doc(db, 'student_queries', selectedQuery.id);
      await updateDoc(qDocRef, {
        status: 'pending',
        queries: finalQueries
      });

      // Notify faculty
      await addDoc(collection(db, 'query_notifications'), {
        userId: 'staff_broadcast',
        userRole: 'faculty',
        title: 'Additional Query Added',
        message: `${sName} added query [${subCategory}] under ticket: "${selectedQuery.title}"`,
        queryId: selectedQuery.id,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'new_query'
      });

      setSelectedQuery({
        ...selectedQuery,
        status: 'pending',
        queries: finalQueries
      });

      setSubDescription('');
      setSubAttachment(null);
      setSubRound('Round 1');
      setIsAddingSubQuery(false);
    } catch (err) {
      console.error('Error adding sub-query to same ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a sub-query raised by a student (supports the removable option)
  const handleDeleteSubQuery = async (subId: string) => {
    if (!selectedQuery) return;
    
    const isFirstQuery = subId === `sub_${selectedQuery.id}` || selectedQuery.queries?.length === 1;
    
    if (isFirstQuery && (!selectedQuery.queries || selectedQuery.queries.length <= 1)) {
      // Delete entire ticket
      try {
        if (isDemoMode) {
          setDemoQueriesList(prev => prev.filter(q => q.id !== selectedQuery.id));
          setSelectedQuery(null);
          return;
        }
        await deleteDoc(doc(db, 'student_queries', selectedQuery.id));
        setSelectedQuery(null);
      } catch (err) {
        console.error('Error deleting ticket:', err);
      }
      return;
    }

    // Update queries list by filtering out the subId
    const finalQueries = (selectedQuery.queries || []).filter(item => item.id !== subId);
    
    // If we deleted the first subquery, but there are others, we promote the first of the remaining subqueries to be the main queries' info
    let updatePayload: any = { queries: finalQueries };
    if ((subId === `sub_${selectedQuery.id}` || selectedQuery.queries?.[0]?.id === subId) && finalQueries.length > 0) {
      const nextFirst = finalQueries[0];
      updatePayload.projectNumber = nextFirst.projectNumber;
      updatePayload.category = nextFirst.category;
      updatePayload.description = nextFirst.description;
      updatePayload.round = nextFirst.round || 'Round 1';
      updatePayload.studentAttachmentName = nextFirst.studentAttachmentName || null;
      updatePayload.studentAttachmentUrl = nextFirst.studentAttachmentUrl || null;
      updatePayload.studentAttachmentType = nextFirst.studentAttachmentType || null;
    }

    try {
      if (isDemoMode) {
        const updatedQuery = {
          ...selectedQuery,
          ...updatePayload
        };
        setDemoQueriesList(prev => prev.map(q => q.id === selectedQuery.id ? updatedQuery : q));
        setSelectedQuery(updatedQuery);
        return;
      }
      const qDocRef = doc(db, 'student_queries', selectedQuery.id);
      await updateDoc(qDocRef, updatePayload);
      setSelectedQuery({
        ...selectedQuery,
        ...updatePayload
      });
    } catch (err) {
      console.error('Error deleting sub-query:', err);
    }
  };

  // Edit an existing sub-query raised by a student (supports the edit option)
  const handleEditSubQuery = async (subId: string, updatedDescription: string, updatedCategory: string, updatedProj: string, updatedRound: string) => {
    if (!selectedQuery) return;
    
    const finalQueries = (selectedQuery.queries || []).map(item => {
      if (item.id === subId) {
        return {
          ...item,
          description: updatedDescription.trim(),
          category: updatedCategory,
          projectNumber: updatedProj.trim(),
          round: updatedRound
        };
      }
      return item;
    });

    // Sync main ticket details if editing the first subquery
    const isFirstQuery = subId === `sub_${selectedQuery.id}` || selectedQuery.queries?.[0]?.id === subId;
    let updatePayload: any = { queries: finalQueries };
    
    if (isFirstQuery) {
      updatePayload.projectNumber = updatedProj.trim();
      updatePayload.category = updatedCategory;
      updatePayload.description = updatedDescription.trim();
      updatePayload.round = updatedRound;
    }

    try {
      if (isDemoMode) {
        const updatedQuery = {
          ...selectedQuery,
          ...updatePayload
        };
        setDemoQueriesList(prev => prev.map(q => q.id === selectedQuery.id ? updatedQuery : q));
        setSelectedQuery(updatedQuery);
        setEditingSubQueryId(null);
        return;
      }
      const qDocRef = doc(db, 'student_queries', selectedQuery.id);
      await updateDoc(qDocRef, updatePayload);
      
      setSelectedQuery({
        ...selectedQuery,
        ...updatePayload
      });
      setEditingSubQueryId(null);
    } catch (err) {
      console.error('Error updating sub-query:', err);
    }
  };

  // Solve individual sub-query item in standard thread
  const handleSolveSubQuery = async (subId: string, answerText: string) => {
    if (!selectedQuery || !answerText.trim()) return;
    setIsSubmitting(true);
    try {
      const existingSubs = selectedQuery.queries || [
        {
          id: `sub_${selectedQuery.id}`,
          projectNumber: selectedQuery.projectNumber || 'N/A',
          studentName: selectedQuery.studentName,
          category: selectedQuery.category || 'Base file incorrect',
          description: selectedQuery.description,
          createdAt: selectedQuery.createdAt,
          status: selectedQuery.status,
          solution: selectedQuery.solution,
          solvedBy: selectedQuery.solvedBy,
          solvedByName: selectedQuery.solvedByName,
          solvedAt: selectedQuery.solvedAt,
          studentAttachmentName: selectedQuery.studentAttachmentName,
          studentAttachmentUrl: selectedQuery.studentAttachmentUrl,
          studentAttachmentType: selectedQuery.studentAttachmentType,
          answerAttachmentName: selectedQuery.answerAttachmentName,
          answerAttachmentUrl: selectedQuery.answerAttachmentUrl,
          answerAttachmentType: selectedQuery.answerAttachmentType
        }
      ];

      const ansAttachment = subAnswersAttachments[subId];
      const ansAttachmentFields = ansAttachment ? {
        answerAttachmentName: ansAttachment.name,
        answerAttachmentUrl: ansAttachment.dataUrl,
        answerAttachmentType: ansAttachment.type
      } : {};

      const finalQueries = existingSubs.map(item => {
        if (item.id === subId) {
          return {
            ...item,
            status: 'solved' as const,
            solution: answerText.trim(),
            solvedBy: isDemoMode ? 'demo_faculty' : (user?.id || 'staff'),
            solvedByName: isDemoMode ? 'Prof. Vikram Sen' : (user?.name || 'Faculty Member'),
            solvedAt: new Date().toISOString(),
            ...ansAttachmentFields
          };
        }
        return item;
      });

      // Ticket is fully solved if all its sub-queries are resolved
      const allSolved = finalQueries.every(item => item.status === 'solved');
      const newStatus = allSolved ? 'solved' : 'pending';

      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedQuery: StudentQuery = {
          ...selectedQuery,
          status: newStatus,
          queries: finalQueries,
          ...(allSolved ? {
            solution: answerText.trim(),
            solvedBy: 'demo_faculty_1',
            solvedByName: 'Prof. Vikram Sen',
            solvedAt: new Date().toISOString(),
            ...ansAttachmentFields
          } : {})
        };

        setDemoQueriesList(prev => prev.map(q => q.id === selectedQuery.id ? updatedQuery : q));
        setSelectedQuery(updatedQuery);
        setSubAnswersAttachments(prev => {
          const copy = { ...prev };
          delete copy[subId];
          return copy;
        });
        setIsSubmitting(false);
        
        // Notify student
        const newNotif: QueryNotification = {
          id: `demo_notif_${Date.now()}`,
          userId: selectedQuery.studentId,
          userRole: 'student',
          title: 'Query Resolved!',
          message: `A query under ticket "${selectedQuery.title}" has been resolved.`,
          queryId: selectedQuery.id,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'query_answered'
        };
        setDemoNotifsList(prev => [newNotif, ...prev]);
        return;
      }

      if (!user) return;
      const qDocRef = doc(db, 'student_queries', selectedQuery.id);
      
      const updatePayload: any = {
        status: newStatus,
        queries: finalQueries
      };

      if (allSolved) {
        updatePayload.solution = answerText.trim();
        updatePayload.solvedBy = user.id;
        updatePayload.solvedByName = user.name || 'Faculty Member';
        updatePayload.solvedAt = new Date().toISOString();
        Object.assign(updatePayload, ansAttachmentFields);
      }

      await updateDoc(qDocRef, updatePayload);

      // Notify student
      await addDoc(collection(db, 'query_notifications'), {
        userId: selectedQuery.studentId,
        userRole: 'student',
        title: 'Query Resolved!',
        message: `A query under ticket "${selectedQuery.title}" has been resolved.`,
        queryId: selectedQuery.id,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'query_answered'
      });

      setSubAnswersAttachments(prev => {
        const copy = { ...prev };
        delete copy[subId];
        return copy;
      });

      setSelectedQuery({
        ...selectedQuery,
        status: newStatus,
        queries: finalQueries,
        ...(allSolved ? {
          solution: answerText.trim(),
          solvedBy: user.id,
          solvedByName: user.name || 'Faculty',
          ...ansAttachmentFields
        } : {})
      });
    } catch (err) {
      console.error('Error solving sub-query:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Solve Query Handler (Staff only)
  const handleSolveQuery = async (e: React.FormEvent, targetQuery: StudentQuery) => {
    e.preventDefault();
    if (!solutionText.trim()) return;

    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 600));

        const updatedQuery: StudentQuery = {
          ...targetQuery,
          status: 'solved',
          solvedBy: 'demo_faculty_1',
          solvedByName: 'Prof. Vikram Sen',
          solution: solutionText.trim(),
          solvedAt: new Date().toISOString()
        };

        setDemoQueriesList(prev => prev.map(q => q.id === targetQuery.id ? updatedQuery : q));
        
        const newNotif: QueryNotification = {
          id: `demo_notif_${Date.now()}`,
          userId: targetQuery.studentId,
          userRole: 'student',
          title: 'Query Answered!',
          message: `Your query "${targetQuery.title.slice(0, 30)}..." has been answered.`,
          queryId: targetQuery.id,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'query_answered'
        };

        setDemoNotifsList(prev => [newNotif, ...prev]);
        setSelectedQuery(updatedQuery);
        setSolutionText('');
        return;
      }

      if (!user) return;
      const qDocRef = doc(db, 'student_queries', targetQuery.id);
      
      // 1. Update Query status and solution details
      await updateDoc(qDocRef, {
        status: 'solved',
        solvedBy: user.id,
        solvedByName: user.name || 'Faculty Member',
        solution: solutionText.trim(),
        solvedAt: new Date().toISOString()
      });

      // 2. Create notification for the student
      await addDoc(collection(db, 'query_notifications'), {
        userId: targetQuery.studentId,
        userRole: 'student',
        title: 'Query Answered!',
        message: `Your query "${targetQuery.title.slice(0, 30)}..." has been answered.`,
        queryId: targetQuery.id,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'query_answered'
      });

      // Browser notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Query Resolved', {
          body: `Your query has been answered by ${user.name}`
        });
      }

      // Update active selection to reflect changes live
      setSelectedQuery({
        ...targetQuery,
        status: 'solved',
        solvedBy: user.id,
        solvedByName: user.name || 'Faculty Member',
        solution: solutionText.trim(),
        solvedAt: new Date().toISOString()
      });

      setSolutionText('');
    } catch (err) {
      console.error('Error answering query:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark all notifications as read
  const handleMarkNotificationsRead = async () => {
    try {
      if (isDemoMode) {
        setDemoNotifsList(prev => prev.map(n => ({ ...n, read: true })));
        return;
      }
      const unread = notifications.filter(n => !n.read);
      const promises = unread.map(notif => {
        const docRef = doc(db, 'query_notifications', notif.id);
        return updateDoc(docRef, { read: true });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isDemoMode) {
        setDemoNotifsList(prev => prev.filter(n => n.id !== id));
        return;
      }
      await deleteDoc(doc(db, 'query_notifications', id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Filtering Logic
  const filteredQueries = activeQueries.filter(q => {
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const unreadNotifCount = activeNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2" id="query-tracker-root">
      {/* Interactive Role Switcher for Demo Mode */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-pink-500/15 via-pink-400/5 to-purple-500/15 border border-pink-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 animate-pulse shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-pink-700 text-xs uppercase tracking-widest font-mono">Interactive Support Desk Sandbox</span>
              <p className="text-xs text-slate-600 mt-0.5">Toggle roles to experience raising a ticket as a student and resolving it as a faculty member.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-xl border border-pink-200 shadow-sm shrink-0">
            <button
              id="demo-view-student-btn"
              onClick={() => {
                setDemoRole('student');
                setSelectedQuery(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                demoRole === 'student' 
                  ? 'bg-pink-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Student View
            </button>
            <button
              id="demo-view-faculty-btn"
              onClick={() => {
                setDemoRole('faculty');
                setSelectedQuery(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                demoRole === 'faculty' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-505 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Faculty View
            </button>
          </div>
        </div>
      )}

      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
            <span className="text-xs font-bold text-pink-600 uppercase tracking-widest font-mono">Academic Support</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Query Support Desk</h1>
          <p className="text-slate-500 text-sm">
            {isStaff 
              ? "Solve queries raised by students instantly to maintain seamless learning progress." 
              : "Facing hurdles in assignments or projects? Raise a ticket and get resolved by faculty."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {/* Notification Center */}
          <div className="relative">
            <button 
              id="notification-bell-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadNotifCount > 0) {
                  handleMarkNotificationsRead();
                }
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all relative flex items-center justify-center"
              title="Recent Activity"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div 
                    id="notification-dropdown"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">Query Inbox</span>
                      {unreadNotifCount > 0 && (
                        <span className="text-[11px] font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                          {unreadNotifCount} New
                        </span>
                      )}
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {activeNotifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No notifications received
                        </div>
                      ) : (
                        activeNotifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-3 text-xs transition-colors hover:bg-slate-50 cursor-pointer flex gap-3 items-start relative ${!notif.read ? 'bg-pink-50/30' : ''}`}
                            onClick={() => {
                              const matchQ = activeQueries.find(q => q.id === notif.queryId);
                              if (matchQ) setSelectedQuery(matchQ);
                              setShowNotifications(false);
                            }}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${notif.type === 'new_query' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                              {notif.type === 'new_query' ? <HelpCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="font-semibold text-slate-800 truncate">{notif.title}</p>
                              <p className="text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotification(notif.id, e)}
                              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                              title="Dismiss"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {!isStaff && (
            <button
              id="raise-query-btn"
              onClick={() => setIsRaiseModalOpen(true)}
              className="px-5 py-3 bg-pink-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-pink-700 active:scale-95 hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left side: List and Filters (7 cols) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-4">
          
          {/* Sticky filter bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                id="query-search-input"
                type="text"
                placeholder="Search ticket titles or student names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-505 focus:border-pink-500 text-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
              {(['all', 'pending', 'solved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all capitalize ${
                    statusFilter === tab 
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'all' ? 'All Tickets' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Core Ticket List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 border border-slate-100">
                <Clock className="w-8 h-8 text-pink-400 animate-spin mb-3" />
                <span className="text-sm font-medium">Fetching support desk data...</span>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-100">
                <span className="font-semibold block mb-1">No Support Tickets Found</span>
                <span className="text-xs text-slate-400">Try modifying search or filters</span>
              </div>
            ) : (
              filteredQueries.map((q) => {
                const isSelected = selectedQuery?.id === q.id;
                const subItems = q.queries && q.queries.length > 0 ? q.queries : [];
                const totalSubs = subItems.length || 1;
                const solvedSubs = subItems.filter(item => item.status === 'solved').length;

                return (
                  <motion.div
                    key={q.id}
                    layoutId={`query-card-${q.id}`}
                    onClick={() => setSelectedQuery(q)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative group ${
                      isSelected 
                        ? 'border-pink-500 bg-pink-50/5 ring-1 ring-pink-500' 
                        : 'border-slate-150 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-extrabold ${
                          q.status === 'solved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {q.status}
                        </span>
                        {renderCategoryBadges(q.category || 'Base file incorrect')}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-pink-600 transition-colors">
                      {q.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-1 mb-2 font-mono text-[10px] text-slate-400 font-bold">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectClick(q.projectNumber || 'N/A');
                        }}
                        className="bg-pink-100 hover:bg-pink-200 text-pink-700 font-extrabold px-1.5 py-0.5 rounded cursor-pointer border border-pink-200/50 transition-all"
                        title="Click to open project edit page in a new page"
                      >
                        Proj: #{q.projectNumber || 'N/A'}
                      </span>
                      <span className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">{solvedSubs}/{totalSubs} Resolved</span>
                      {q.round && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-black uppercase text-[9px] tracking-wider">
                          {q.round}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                      {q.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] text-slate-400 font-semibold">
                      <div className="flex items-center gap-1.5 font-bold text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-350" />
                        <span className="truncate max-w-[120px]">{q.studentName}</span>
                      </div>
                      <span className="text-pink-655 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        View Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right side: Detailed Workspace & Solutions (5 cols) */}
        <div className="lg:col-span-12 xl:col-span-7">
          <AnimatePresence mode="wait">
            {selectedQuery ? (
              <motion.div 
                key={selectedQuery.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 sticky top-6"
                id="query-details-panel"
              >
                {/* Panel Action Header */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Ticket Workspace</span>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      ID: {selectedQuery.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isStaff && (
                      <div className="flex items-center gap-1.5">
                        {!isConfirmingDelete ? (
                          <button
                            onClick={() => setIsConfirmingDelete(true)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 bg-rose-50/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                            title="Delete Entire Ticket Thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Ticket</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 border border-rose-200 bg-rose-50 p-1 rounded-lg animate-pulse">
                            <span className="text-[10px] sm:text-xs text-rose-700 font-bold px-1 select-none">Are you sure?</span>
                            <button
                              onClick={async () => {
                                try {
                                  if (isDemoMode) {
                                    setDemoQueriesList(prev => prev.filter(q => q.id !== selectedQuery.id));
                                    setSelectedQuery(null);
                                    setIsConfirmingDelete(false);
                                    return;
                                  }
                                  await deleteDoc(doc(db, 'student_queries', selectedQuery.id));
                                  setSelectedQuery(null);
                                  setIsConfirmingDelete(false);
                                } catch (err) {
                                  console.error('Error deleting entire ticket:', err);
                                  alert('Error deleting ticket: ' + (err instanceof Error ? err.message : String(err)));
                                }
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setIsConfirmingDelete(false)}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={() => setSelectedQuery(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded cursor-pointer"
                      title="Close Panel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Support Thread representing multiple queries in same task */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-extrabold ${
                      selectedQuery.status === 'solved' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedQuery.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      Opened: {new Date(selectedQuery.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-slate-800 leading-snug">
                    {selectedQuery.title}
                  </h2>

                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Support Tasks & Queries Details
                    </span>

                    <div className="space-y-4">
                      {(() => {
                        const subItems = selectedQuery.queries && selectedQuery.queries.length > 0 
                          ? selectedQuery.queries 
                          : [{
                              id: `sub_${selectedQuery.id}`,
                              projectNumber: selectedQuery.projectNumber || 'N/A',
                              studentName: selectedQuery.studentName,
                              category: selectedQuery.category || 'Base file incorrect',
                              description: selectedQuery.description,
                              createdAt: selectedQuery.createdAt,
                              status: selectedQuery.status,
                              solution: selectedQuery.solution,
                              solvedBy: selectedQuery.solvedBy,
                              solvedByName: selectedQuery.solvedByName,
                              solvedAt: selectedQuery.solvedAt
                            }];

                        return subItems.map((item, index) => {
                          const isItemSolved = item.status === 'solved';

                          return (
                            <div 
                              key={item.id} 
                              className={`p-4 rounded-xl border transition-all ${
                                isItemSolved 
                                  ? 'border-green-150 bg-green-50/10' 
                                  : 'border-slate-150 bg-slate-50/20'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    Query #{index + 1}
                                  </span>
                                  {item.round && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-pink-50 text-pink-705 border-pink-100/50 shadow-sm">
                                      {item.round}
                                    </span>
                                  )}
                                  {renderCategoryBadges(item.category)}
                                </div>
                                <div className="flex items-center gap-2 text-right">
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(item.createdAt).toLocaleString()}
                                  </span>
                                  {(true) && (
                                    <div className="flex items-center gap-1 select-none">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingSubQueryId(item.id);
                                          setEditDescription(item.description);
                                          setEditCategory(item.category);
                                          setEditProjectNumber(item.projectNumber || '');
                                          setEditRound(item.round || 'Round 1');
                                        }}
                                        className="p-1 text-slate-400 hover:text-pink-600 hover:bg-slate-100 rounded transition-colors"
                                        title="Edit this query"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      {confirmDeleteSubId !== item.id ? (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteSubId(item.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                                          title="Delete this query"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      ) : (
                                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded animate-pulse">
                                          <span className="text-[9px] text-rose-700 font-bold px-0.5 select-none">Delete?</span>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              await handleDeleteSubQuery(item.id);
                                              setConfirmDeleteSubId(null);
                                            }}
                                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold cursor-pointer"
                                          >
                                            Yes
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteSubId(null)}
                                            className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-bold cursor-pointer"
                                          >
                                            No
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-3 font-semibold text-slate-500">
                                <div className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Student: <span className="text-slate-700 font-bold">{item.studentName}</span></span>
                                </div>
                                <div className="text-right md:text-left flex items-center md:justify-start gap-1">
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProjectClick(item.projectNumber || 'N/A');
                                    }}
                                    className="bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-200/50 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none cursor-pointer transition-all font-bold"
                                    title="Click to open project edit page in a new page"
                                  >
                                    Project #{item.projectNumber}
                                  </span>
                                </div>
                              </div>

                              {editingSubQueryId === item.id ? (
                                <div className="space-y-3 bg-pink-50/5 p-4 rounded-xl border border-pink-200 mt-2 text-left mb-3">
                                  <div className="text-xs font-bold text-pink-700">Edit Query Details</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Project Number</label>
                                      <select
                                        value={editProjectNumber}
                                        onChange={(e) => setEditProjectNumber(e.target.value)}
                                        className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-pink-500 outline-none bg-white font-semibold text-slate-705"
                                      >
                                        <option value="">-- Choose Project --</option>
                                        {editProjectNumber && !userProjects.some(p => (p.clientBrief?.projectNumber === editProjectNumber || p.projectCode === editProjectNumber)) && (
                                          <option value={editProjectNumber}>{editProjectNumber} (Current Active Project)</option>
                                        )}
                                        {userProjects.map((proj) => {
                                          const num = proj.clientBrief?.projectNumber || proj.projectCode || proj.id;
                                          const brand = proj.clientBrief?.brandName || '';
                                          const variant = proj.clientBrief?.variantName || '';
                                          const label = `${num}${brand ? ' - ' + brand : ''}${variant ? ' (' + variant + ')' : ''}`;
                                          return (
                                            <option key={proj.id} value={num}>
                                              {label}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Evaluation Round</label>
                                      <select
                                        value={editRound}
                                        onChange={(e) => setEditRound(e.target.value)}
                                        className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-pink-500 outline-none bg-white font-semibold"
                                      >
                                        <option value="Round 1">Round 1 (Initial Inquiry)</option>
                                        <option value="Round 2">Round 2 (Partial/Follow-up)</option>
                                        <option value="Round 3">Round 3</option>
                                        <option value="Round 4">Round 4</option>
                                        <option value="Round 5">Round 5</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Query Category</label>
                                    <select
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(e.target.value)}
                                      className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-pink-500 outline-none bg-white font-semibold"
                                    >
                                      <option value="Base file incorrect">Base file incorrect</option>
                                      <option value="Layout approval">Layout approval</option>
                                      <option value="Visual Hierarchy">Visual Hierarchy</option>
                                      <option value="Font/Typography issue">Font/Typography issue</option>
                                      <option value="Technical/QC violation">Technical/QC violation</option>
                                      <option value="Unclear Brief instructions">Unclear Brief instructions</option>
                                      <option value="Pre-flight checklist help">Pre-flight checklist help</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description</label>
                                    <textarea
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      rows={3}
                                      className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-pink-500 outline-none bg-white"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSubQueryId(null)}
                                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!editDescription.trim()}
                                      onClick={() => handleEditSubQuery(item.id, editDescription, editCategory, editProjectNumber, editRound)}
                                      className="px-3 py-1 bg-pink-705 hover:bg-pink-805 text-white rounded text-[10px] font-bold"
                                    >
                                      Save Details
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-slate-700 text-sm leading-relaxed mb-3 p-3 bg-white border border-slate-100 rounded-lg">
                                  {item.description}
                                </div>
                              )}

                              {/* Student's Uploaded Low-Res PDF/Image attachment */}
                              {item.studentAttachmentName && (
                                <div className="mb-3 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-pink-500 shrink-0" />
                                    <div className="truncate text-left">
                                      <p className="font-bold text-slate-700 truncate leading-tight">
                                        {item.studentAttachmentName}
                                      </p>
                                      <span className="text-[10px] text-slate-400 font-mono font-semibold">
                                        Student Low-Res PDF / Image
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => downloadDataUrlFile(item.studentAttachmentName!, item.studentAttachmentUrl)}
                                    className="px-2.5 py-1 bg-white hover:bg-pink-50 text-pink-700 hover:text-pink-800 border border-slate-200 hover:border-pink-200 rounded-md font-bold text-[10px] flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download</span>
                                  </button>
                                </div>
                              )}

                              {/* Resolution Section for this sub-query */}
                              {isItemSolved ? (
                                <div className="bg-green-50/40 border border-green-100 p-3 rounded-lg mt-2">
                                  <div className="flex items-center gap-1 text-green-755 font-bold text-xs mb-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Resolved by {item.solvedByName || 'Instructor'}</span>
                                  </div>
                                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                                    {item.solution}
                                  </p>

                                  {/* Instructor's Answer PDF/Image attached to resolution */}
                                  {item.answerAttachmentName && (
                                    <div className="mt-2.5 flex items-center justify-between p-2 bg-white border border-green-100/80 rounded-lg text-xs">
                                      <div className="flex items-center gap-2 truncate">
                                        <FileText className="w-4 h-4 text-green-600 shrink-0" />
                                        <div className="truncate text-left">
                                          <p className="font-bold text-slate-700 truncate leading-tight">
                                            {item.answerAttachmentName}
                                          </p>
                                          <span className="text-[9px] text-green-600 font-mono font-extrabold">
                                            Answer File Shared
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => downloadDataUrlFile(item.answerAttachmentName!, item.answerAttachmentUrl)}
                                        className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-800 border border-green-150 rounded-md font-bold text-[9px] flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>Download File</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                isStaff ? (
                                  <div className="bg-amber-50/20 border border-amber-100 p-3 rounded-lg mt-2 space-y-2">
                                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                                      Resolve this inquiry task:
                                    </span>
                                    <textarea
                                      required
                                      placeholder="Type specific instructions or explanation..."
                                      rows={2}
                                      value={subAnswers[item.id] || ''}
                                      onChange={(e) => setSubAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      className="w-full text-xs p-2.5 bg-white border border-slate-205 focus:ring-1 focus:ring-pink-500 rounded-lg focus:outline-none focus:border-pink-500 text-slate-700 font-sans"
                                    />

                                    {/* Faculty / Admin Shared Answer PDF */}
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                                        Attach Same Query Answer PDF / Image (Optional)
                                      </span>
                                      {!subAnswersAttachments[item.id] ? (
                                        <div className="border border-dashed border-slate-305 hover:border-pink-500 rounded-lg p-2.5 text-center cursor-pointer bg-white hover:bg-slate-50 transition-all relative">
                                          <input
                                            type="file"
                                            accept="application/pdf,image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                  setSubAnswersAttachments(prev => ({
                                                    ...prev,
                                                    [item.id]: {
                                                      name: file.name,
                                                      dataUrl: reader.result as string,
                                                      type: file.type
                                                    }
                                                  }));
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                          />
                                          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Attach PDF/Image guide or query response copy</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between p-2 bg-emerald-50/25 border border-emerald-100 rounded-lg text-[10px] gap-2">
                                          <div className="flex items-center gap-1.5 truncate">
                                            <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span className="font-bold text-emerald-800 truncate">
                                              {subAnswersAttachments[item.id]?.name}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setSubAnswersAttachments(prev => {
                                              const copy = { ...prev };
                                              delete copy[item.id];
                                              return copy;
                                            })}
                                            className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      disabled={isSubmitting || !(subAnswers[item.id]?.trim())}
                                      onClick={() => {
                                        handleSolveSubQuery(item.id, subAnswers[item.id] || '');
                                        setSubAnswers(prev => {
                                          const copy = { ...prev };
                                          delete copy[item.id];
                                          return copy;
                                        });
                                      }}
                                      className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 w-full justify-center"
                                    >
                                      {subAnswersAttachments[item.id] ? 'Submit Resolution & Share File' : 'Submit Resolution'}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-50/30 border border-amber-100 p-2.5 rounded-lg">
                                    <Clock className="w-4 h-4 animate-spin shrink-0" />
                                    <span>Inquiry task pending review by assigned faculty advisor</span>
                                  </div>
                                )
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Additional Queries / Tasks raises (Students only, or Demo Toggle view on the same ticket) */}
                {(!isStaff || isDemoMode) && (
                  <div className="pt-4 border-t border-slate-100">
                    {!isAddingSubQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSubProjectNumber(selectedQuery.projectNumber || '');
                          if (user) {
                            setSubStudentName(user.name || '');
                          }
                          setSubCategory('Base file incorrect');
                          setSubDescription('');
                          // Dynamic round selection
                          const currentQueriesCount = selectedQuery.queries?.length || 1;
                          setSubRound(`Round ${currentQueriesCount + 1}`);
                          setIsAddingSubQuery(true);
                        }}
                        className="w-full py-2.5 bg-pink-50 hover:bg-pink-100/85 text-pink-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-pink-100/40"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Raise Another Query / Task under this Ticket</span>
                      </button>
                    ) : (
                      <form onSubmit={handleAddSubQuery} className="bg-pink-50/10 border border-pink-100/40 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-pink-700">Add Query Task to Ticket</span>
                          <button 
                            type="button" 
                            onClick={() => setIsAddingSubQuery(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Student Name *</label>
                            <input
                              type="text"
                              required
                              value={subStudentName}
                              onChange={(e) => setSubStudentName(e.target.value)}
                              placeholder="Name"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Project Number *</label>
                            <select
                              required
                              value={subProjectNumber}
                              onChange={(e) => setSubProjectNumber(e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 font-semibold text-slate-700"
                            >
                              <option value="">-- Choose Project --</option>
                              {subProjectNumber && !userProjects.some(p => (p.clientBrief?.projectNumber === subProjectNumber || p.projectCode === subProjectNumber)) && (
                                <option value={subProjectNumber}>{subProjectNumber} (Current Active Project)</option>
                              )}
                              {userProjects.map((proj) => {
                                const num = proj.clientBrief?.projectNumber || proj.projectCode || proj.id;
                                const brand = proj.clientBrief?.brandName || '';
                                const variant = proj.clientBrief?.variantName || '';
                                const label = `${num}${brand ? ' - ' + brand : ''}${variant ? ' (' + variant + ')' : ''}`;
                                return (
                                  <option key={proj.id} value={num}>
                                    {label}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Query Category *</label>
                            <MultiSelectCategory
                              selectedString={subCategory}
                              onChange={setSubCategory}
                              size="sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Evaluation Round *</label>
                            <select
                              required
                              value={subRound}
                              onChange={(e) => setSubRound(e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 font-bold text-slate-700 bg-white"
                            >
                              <option value="Round 1">Round 1 (Initial Inquiry)</option>
                              <option value="Round 2">Round 2 (Partial/Follow-up)</option>
                              <option value="Round 3">Round 3</option>
                              <option value="Round 4">Round 4</option>
                              <option value="Round 5">Round 5</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Description of Inquiry *</label>
                          <textarea
                            required
                            rows={3}
                            value={subDescription}
                            onChange={(e) => setSubDescription(e.target.value)}
                            placeholder="State your additional query details clearly here..."
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>

                        {/* Sub-query Low-res PDF Upload */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Upload Low Resolution PDF or Image *
                          </label>
                          {!subAttachment ? (
                            <div className="border border-dashed border-slate-200 hover:border-pink-500 rounded-lg p-3 text-center cursor-pointer bg-white hover:bg-slate-50 transition-all relative">
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                required
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setSubAttachment({
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
                              <div className="flex flex-col items-center justify-center gap-1">
                                <UploadCloud className="w-5 h-5 text-slate-400" />
                                <span className="text-[11px] text-slate-600 font-semibold">Click/drop PDF or Image file to upload</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-2 bg-pink-50/30 border border-pink-100 rounded-lg text-xs gap-2">
                              <div className="flex items-center gap-1.5 truncate">
                                <FileText className="w-4 h-4 text-pink-600 shrink-0" />
                                <span className="font-bold text-slate-700 truncate">{subAttachment.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSubAttachment(null)}
                                className="p-0.5 text-slate-405 hover:text-red-500"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingSubQuery(false)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || !subDescription.trim()}
                            className="px-4 py-1.5 bg-pink-750 hover:bg-pink-800 text-white rounded-lg text-[10px] font-bold"
                          >
                            {isSubmitting ? 'Adding...' : 'Add Query Task'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

              </motion.div>
            ) : (
              <div className="hidden xl:flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-400 min-h-[400px]">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-semibold text-slate-800 text-sm">No Ticket Selected</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">
                  Select an active query card from the support catalog to read explanations, view solutions or post responses.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Raise Ticket Modal / Drawer (Students Only) */}
      <AnimatePresence>
        {isRaiseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsRaiseModalOpen(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border border-slate-100 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative z-10"
              id="raise-query-modal"
            >
              {/* Modal header */}
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-50 rounded-lg text-pink-600">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span className="font-black text-slate-800 text-sm">Raise Help Desk Ticket</span>
                </div>
                <button 
                  onClick={() => setIsRaiseModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleRaiseQuery} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="modal-student-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Student Name *
                    </label>
                    <input
                      id="modal-student-name"
                      type="text"
                      required
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="modal-project-number" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Project Number *
                    </label>
                    <select
                      id="modal-project-number"
                      required
                      value={newProjectNumber}
                      onChange={(e) => setNewProjectNumber(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition-all bg-white font-semibold text-slate-700"
                    >
                      <option value="">-- Select Project --</option>
                      {newProjectNumber && !userProjects.some(p => (p.clientBrief?.projectNumber === newProjectNumber || p.projectCode === newProjectNumber)) && (
                        <option value={newProjectNumber}>{newProjectNumber} (Current Active Project)</option>
                      )}
                      {userProjects.map((proj) => {
                        const num = proj.clientBrief?.projectNumber || proj.projectCode || proj.id;
                        const brand = proj.clientBrief?.brandName || '';
                        const variant = proj.clientBrief?.variantName || '';
                        const label = `${num}${brand ? ' - ' + brand : ''}${variant ? ' (' + variant + ')' : ''}`;
                        return (
                          <option key={proj.id} value={num}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="modal-query-category" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Query Category *
                    </label>
                    <MultiSelectCategory
                      selectedString={newCategory}
                      onChange={setNewCategory}
                      id="modal-query-category"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="modal-query-round" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Evaluation Round *
                    </label>
                    <select
                      id="modal-query-round"
                      required
                      value={newRound}
                      onChange={(e) => setNewRound(e.target.value)}
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition-all bg-white"
                    >
                      <option value="Round 1">Round 1 (Initial Inquiry)</option>
                      <option value="Round 2">Round 2 (Partial/Follow-up)</option>
                      <option value="Round 3">Round 3</option>
                      <option value="Round 4">Round 4</option>
                      <option value="Round 5">Round 5</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-query-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Query Topic / Area *
                  </label>
                  <input
                    id="modal-query-title"
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Struggling with Packaging Exercise 3 alignment"
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-query-desc" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Detailed Explanation / Description *
                  </label>
                  <textarea
                    id="modal-query-desc"
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Explain clearly what problems you are experiencing, what you tried, and any questions you have for the faculty."
                    rows={4}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition-all text-slate-700 leading-relaxed"
                  />
                </div>

                {/* Low-res PDF Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Upload Low Resolution PDF or Image *
                  </label>
                  {!newAttachment ? (
                    <div className="border-2 border-dashed border-slate-200 hover:border-pink-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all relative">
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewAttachment({
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
                      <div className="flex flex-col items-center justify-center gap-1">
                        <UploadCloud className="w-8 h-8 text-slate-400" />
                        <span className="text-xs text-slate-600 font-semibold">Click or drag & drop low-res PDF or Image to upload</span>
                        <span className="text-[10px] text-slate-400">PDF or Image file format (Max 150DPI layout draft)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-pink-50/35 border border-pink-100 rounded-xl text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-pink-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-700 truncate">{newAttachment.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">Attached successfully</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewAttachment(null)}
                        className="p-1 text-slate-450 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info Note */}
                <div className="bg-pink-50/20 border border-pink-100/30 p-3 rounded-lg text-xs text-slate-600 flex items-start gap-2 max-w-md">
                  <Sparkles className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                  <span>Your assigned faculty advisor will receive an automated trigger and resolve this within standard academic SLA boundaries.</span>
                </div>

                {/* Form Footer */}
                <div className="flex gap-3 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsRaiseModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    id="modal-submit-query-btn"
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim() || !newDescription.trim()}
                    className="px-5 py-2 bg-pink-700 hover:bg-pink-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Raising Ticket...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
