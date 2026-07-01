import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { CourseType } from '../types';
import { formatCourseName, cn } from '../utils';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  BookOpen, 
  Users, 
  Check, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  ExternalLink, 
  Save, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

// Interfaces
interface RoadmapTopic {
  id: string;
  name: string;
  isCompleted: boolean;
}

interface RoadmapResource {
  title: string;
  url: string;
}

interface FacultyRoadmap {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  description: string;
  durationHours: number;
  assignedFacultyId: string;
  assignedFacultyName: string;
  topics: RoadmapTopic[];
  status: 'planning' | 'active' | 'completed';
  resources: RoadmapResource[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface FacultyRoadmapPlannerProps {
  isAdmin?: boolean;
}

const COURSES: CourseType[] = [
  'packaging-engineer',
  'production-art-engineer',
  'print-ready-engineer',
  'plate-ready-engineer',
  'colour-retouching-engineer',
  'quality-control-engineer',
  'printing-and-packaging-cross-courses'
];

export default function FacultyRoadmapPlanner({ isAdmin = false }: FacultyRoadmapPlannerProps) {
  const { user } = useAuth();
  
  // Data State
  const [roadmaps, setRoadmaps] = useState<FacultyRoadmap[]>([]);
  const [facultyList, setFacultyList] = useState<{ id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Loading & UI state
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<FacultyRoadmap | null>(null);
  
  // Form State
  const [formCourseId, setFormCourseId] = useState<string>(COURSES[0]);
  const [formWeekNumber, setFormWeekNumber] = useState<number>(1);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState<number>(10);
  const [formFacultyId, setFormFacultyId] = useState('');
  const [formStatus, setFormStatus] = useState<'planning' | 'active' | 'completed'>('planning');
  const [formTopicsText, setFormTopicsText] = useState('');
  const [formResources, setFormResources] = useState<RoadmapResource[]>([{ title: '', url: '' }]);
  const [formNotes, setFormNotes] = useState('');

  // Delivery Notes / Topic complete local edit state
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);

  // Fetch helper functions
  const fetchRoadmaps = async () => {
    try {
      const roadmapsQuery = query(collection(db, 'faculty_roadmaps'), orderBy('weekNumber', 'asc'));
      const snapshot = await getDocs(roadmapsQuery);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FacultyRoadmap));
      setRoadmaps(items);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'faculty_roadmaps');
    }
  };

  const fetchFaculty = async () => {
    try {
      const facultyQuery = query(collection(db, 'users'), where('role', '==', 'faculty'));
      const snapshot = await getDocs(facultyQuery);
      const list = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name || 'Unknown Faculty' 
      }));
      setFacultyList(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  };

  // Fetch Roadmaps & Faculty List on mount
  useEffect(() => {
    fetchRoadmaps();
    fetchFaculty();
  }, []);

  // Filter Roadmaps
  const filteredRoadmaps = roadmaps.filter(item => {
    const matchCourse = selectedCourse === 'all' || item.courseId === selectedCourse;
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    
    // For faculty, if they are not admin, they can view all, but let's highlight their assigned ones
    return matchCourse && matchStatus;
  });

  // Calculate statistics for the selected filter
  const totalWeeks = filteredRoadmaps.length;
  const activeWeeks = filteredRoadmaps.filter(r => r.status === 'active').length;
  const completedWeeks = filteredRoadmaps.filter(r => r.status === 'completed').length;
  const totalHours = filteredRoadmaps.reduce((acc, curr) => acc + (curr.durationHours || 0), 0);

  // Open Modal for Create or Edit
  const openModal = (week: FacultyRoadmap | null = null) => {
    if (week) {
      setEditingWeek(week);
      setFormCourseId(week.courseId);
      setFormWeekNumber(week.weekNumber);
      setFormTitle(week.title);
      setFormDescription(week.description || '');
      setFormDuration(week.durationHours || 10);
      setFormFacultyId(week.assignedFacultyId || '');
      setFormStatus(week.status);
      setFormTopicsText(week.topics ? week.topics.map(t => t.name).join('\n') : '');
      setFormResources(week.resources && week.resources.length > 0 ? week.resources : [{ title: '', url: '' }]);
      setFormNotes(week.notes || '');
    } else {
      setEditingWeek(null);
      // Auto-suggest next week number
      const courseWeeks = roadmaps.filter(r => r.courseId === formCourseId);
      const nextWeekNum = courseWeeks.length > 0 ? Math.max(...courseWeeks.map(r => r.weekNumber)) + 1 : 1;
      
      setFormCourseId(selectedCourse !== 'all' ? selectedCourse : COURSES[0]);
      setFormWeekNumber(nextWeekNum);
      setFormTitle('');
      setFormDescription('');
      setFormDuration(10);
      setFormFacultyId(facultyList[0]?.id || '');
      setFormStatus('planning');
      setFormTopicsText('');
      setFormResources([{ title: '', url: '' }]);
      setFormNotes('');
    }
    setIsModalOpen(true);
  };

  // Add Resource Input Row
  const addResourceField = () => {
    setFormResources([...formResources, { title: '', url: '' }]);
  };

  // Remove Resource Input Row
  const removeResourceField = (index: number) => {
    const list = [...formResources];
    list.splice(index, 1);
    setFormResources(list.length > 0 ? list : [{ title: '', url: '' }]);
  };

  // Handle Resource Change
  const handleResourceChange = (index: number, field: keyof RoadmapResource, val: string) => {
    const list = [...formResources];
    list[index][field] = val;
    setFormResources(list);
  };

  // Save Roadmap Week (Create / Edit)
  const handleSaveRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter a curriculum title');
      return;
    }

    const assignedFaculty = facultyList.find(f => f.id === formFacultyId);
    const facultyName = assignedFaculty ? assignedFaculty.name : 'Unassigned';

    // Parse topics from multi-line text input
    const topics: RoadmapTopic[] = formTopicsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((name, index) => ({
        id: `topic_${Date.now()}_${index}`,
        name,
        isCompleted: false
      }));

    // Filter valid resources
    const validResources = formResources.filter(r => r.title.trim() && r.url.trim());

    const payload: Omit<FacultyRoadmap, 'id'> = {
      courseId: formCourseId,
      weekNumber: Number(formWeekNumber),
      title: formTitle.trim(),
      description: formDescription.trim(),
      durationHours: Number(formDuration),
      assignedFacultyId: formFacultyId,
      assignedFacultyName: facultyName,
      topics: editingWeek ? (editingWeek.topics || []) : topics, // keep completion status if editing, unless admin resets
      status: formStatus,
      resources: validResources,
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: editingWeek ? editingWeek.createdAt : new Date().toISOString()
    };

    // If editing and topics text changed, let's merge or replace
    if (editingWeek) {
      // Re-create topics list if the raw list changed
      const oldTopicsNames = (editingWeek.topics || []).map(t => t.name).join('\n');
      if (oldTopicsNames !== formTopicsText) {
        // Build new ones, matching state for existing ones if names are identical
        payload.topics = formTopicsText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map((name, index) => {
            const existing = (editingWeek.topics || []).find(t => t.name === name);
            return {
              id: existing ? existing.id : `topic_${Date.now()}_${index}`,
              name,
              isCompleted: existing ? existing.isCompleted : false
            };
          });
      }
    }

    try {
      if (editingWeek) {
        await updateDoc(doc(db, 'faculty_roadmaps', editingWeek.id), payload);
      } else {
        await addDoc(collection(db, 'faculty_roadmaps'), payload);
      }
      setIsModalOpen(false);
      setEditingWeek(null);
      await fetchRoadmaps();
    } catch (err) {
      handleFirestoreError(err, editingWeek ? OperationType.UPDATE : OperationType.CREATE, 'faculty_roadmaps');
    }
  };

  // Delete Roadmap Week
  const handleDeleteRoadmap = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this roadmap week?')) return;
    try {
      await deleteDoc(doc(db, 'faculty_roadmaps', id));
      if (expandedWeekId === id) setExpandedWeekId(null);
      await fetchRoadmaps();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `faculty_roadmaps/${id}`);
    }
  };

  // Toggle single topic checklist item
  const handleToggleTopic = async (week: FacultyRoadmap, topicId: string) => {
    // Only assigned faculty or admin can edit
    const isAssigned = week.assignedFacultyId === user?.id;
    if (!isAdmin && !isAssigned) {
      alert('You can only update checklists for your assigned classes.');
      return;
    }

    const updatedTopics = (week.topics || []).map(topic => {
      if (topic.id === topicId) {
        return { ...topic, isCompleted: !topic.isCompleted };
      }
      return topic;
    });

    // Optimistic Update: Update the local state first!
    setRoadmaps(prev => prev.map(item => {
      if (item.id === week.id) {
        return { ...item, topics: updatedTopics };
      }
      return item;
    }));

    try {
      await updateDoc(doc(db, 'faculty_roadmaps', week.id), {
        topics: updatedTopics,
        updatedAt: new Date().toISOString()
      });
      fetchRoadmaps();
    } catch (err) {
      fetchRoadmaps(); // Revert on failure
      handleFirestoreError(err, OperationType.UPDATE, `faculty_roadmaps/${week.id}`);
    }
  };

  // Save Notes and Quick Status Change
  const handleSaveNotesAndStatus = async (week: FacultyRoadmap, newStatus?: 'planning' | 'active' | 'completed') => {
    const isAssigned = week.assignedFacultyId === user?.id;
    if (!isAdmin && !isAssigned) {
      alert('You can only update details for your assigned classes.');
      return;
    }

    const payload: Partial<FacultyRoadmap> = {
      updatedAt: new Date().toISOString()
    };

    if (newStatus) {
      payload.status = newStatus;
    }

    if (editingNotesId === week.id) {
      payload.notes = editingNotes;
    }

    // Optimistic Update: Update local state
    setRoadmaps(prev => prev.map(item => {
      if (item.id === week.id) {
        return { 
          ...item, 
          status: newStatus || item.status, 
          notes: editingNotesId === week.id ? editingNotes : item.notes 
        };
      }
      return item;
    }));

    try {
      await updateDoc(doc(db, 'faculty_roadmaps', week.id), payload);
      setEditingNotesId(null);
      alert('Roadmap progress saved successfully!');
      fetchRoadmaps();
    } catch (err) {
      fetchRoadmaps(); // Revert on failure
      handleFirestoreError(err, OperationType.UPDATE, `faculty_roadmaps/${week.id}`);
    }
  };

  // Quick export mock spreadsheet (CSV style simple file generator for user)
  const handleExportRoadmap = () => {
    if (filteredRoadmaps.length === 0) {
      alert('No roadmap items to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Course,Week,Title,Hours,Faculty,Status,Completed Topics / Total,Notes\n';

    filteredRoadmaps.forEach(item => {
      const courseNameCSV = formatCourseName(item.courseId).replace(/,/g, ' ');
      const titleCSV = item.title.replace(/,/g, ' ');
      const facultyCSV = item.assignedFacultyName.replace(/,/g, ' ');
      const statusCSV = item.status.toUpperCase();
      const completedCount = item.topics ? item.topics.filter(t => t.isCompleted).length : 0;
      const totalCount = item.topics ? item.topics.length : 0;
      const progressCSV = `${completedCount}/${totalCount}`;
      const notesCSV = (item.notes || '').replace(/\n/g, ' ').replace(/,/g, ' ');

      csvContent += `"${courseNameCSV}",${item.weekNumber},"${titleCSV}",${item.durationHours},"${facultyCSV}",${statusCSV},"${progressCSV}","${notesCSV}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faculty_curriculum_roadmap_${selectedCourse}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="faculty-roadmap-planner-container" className="space-y-6">
      
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 text-pink-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" /> Dynamic Syllabus Hub
          </div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Faculty Roadmap & Planner</h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Coordinate weekly progress targets, tick completed topics in real-time, and download spreadsheets for faculty reviews.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportRoadmap}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-750 transition duration-200 border border-slate-700 cursor-pointer shadow"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-400" /> Export CSV Sheet
          </button>
          
          {isAdmin && (
            <button
              onClick={() => openModal(null)}
              className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-500 transition duration-200 shadow-md shadow-pink-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule Week Target
            </button>
          )}
        </div>
      </div>

      {/* 2. Stats Summary Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-150 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Weeks Planned</p>
            <h4 className="text-xl font-extrabold text-slate-850 mt-0.5">{totalWeeks}</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-150 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Classroom Runs</p>
            <h4 className="text-xl font-extrabold text-slate-850 mt-0.5">{activeWeeks}</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-150 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed Chapters</p>
            <h4 className="text-xl font-extrabold text-slate-850 mt-0.5">{completedWeeks}</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-150 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Planned Lecture Hours</p>
            <h4 className="text-xl font-extrabold text-slate-850 mt-0.5">{totalHours} hrs</h4>
          </div>
        </div>
      </div>

      {/* 3. Filters Navigation Bar */}
      <div className="bg-white rounded-2xl border border-gray-150 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Filter Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setExpandedWeekId(null);
              }}
              className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Available Courses</option>
              {COURSES.map(course => (
                <option key={course} value={course}>{formatCourseName(course)}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setExpandedWeekId(null);
              }}
              className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Project Statuses</option>
              <option value="planning">Planning (Draft)</option>
              <option value="active">Active (On-going)</option>
              <option value="completed">Completed (Archived)</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-500 italic font-medium shrink-0">
          Showing <span className="font-bold text-slate-850">{filteredRoadmaps.length}</span> week targets based on filter bounds.
        </p>
      </div>

      {/* 4. Curriculum Roadmap Weeks Timeline */}
      {filteredRoadmaps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <div className="space-y-1">
            <h4 className="font-bold text-gray-800 text-lg">No Roadmap Weeks Scheduled</h4>
            <p className="text-gray-500 text-xs max-w-md mx-auto">
              There are no weekly slots configured matching the filters. Create a new week target to populate the interactive faculty timeline.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openModal(null)}
              className="px-4 py-2 bg-pink-600 text-white font-bold rounded-xl text-xs hover:bg-pink-500 transition shadow cursor-pointer"
            >
              Add First Week Now
            </button>
          )}
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-100 ml-5 pl-8 space-y-6 py-2">
          {filteredRoadmaps.map((week, idx) => {
            const isExpanded = expandedWeekId === week.id;
            const completedTopics = week.topics ? week.topics.filter(t => t.isCompleted).length : 0;
            const totalTopics = week.topics ? week.topics.length : 0;
            const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            const isAssigned = week.assignedFacultyId === user?.id;

            return (
              <div key={week.id} className="relative group">
                
                {/* Visual timeline circle tracker */}
                <div className={cn(
                  "absolute -left-[41px] top-1.5 w-6 h-6 rounded-full border-4 flex items-center justify-center text-[10px] font-black shadow-sm transition duration-300",
                  week.status === 'completed' 
                    ? "bg-emerald-500 border-emerald-100 text-white" 
                    : week.status === 'active'
                    ? "bg-blue-500 border-blue-100 text-white animate-pulse"
                    : "bg-white border-gray-200 text-gray-500"
                )}>
                  {week.weekNumber}
                </div>

                {/* Main Card */}
                <div className={cn(
                  "bg-white rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden",
                  isExpanded ? "ring-2 ring-pink-500/20 border-pink-500/50 scale-[1.005]" : "border-gray-150 hover:border-gray-300"
                )}>
                  
                  {/* Card Header Brief Info */}
                  <div 
                    onClick={() => {
                      setExpandedWeekId(isExpanded ? null : week.id);
                      if (week.notes && editingNotesId !== week.id) {
                        setEditingNotes(week.notes);
                      }
                    }}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                          {formatCourseName(week.courseId)}
                        </span>
                        
                        {/* Status Badges */}
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                          week.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                          week.status === 'active' ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {week.status}
                        </span>

                        {isAssigned && (
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            My Assigned Class
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-850 text-base md:text-lg flex items-center gap-1.5">
                        Week {week.weekNumber}: {week.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" /> {week.durationHours} Target Hours</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" /> Faculty Advisor: <strong className="text-slate-700">{week.assignedFacultyName}</strong></span>
                        {totalTopics > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 
                            Progress: {completedTopics}/{totalTopics} topics ({percentage}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Circle & Expand Button */}
                    <div className="flex items-center gap-4">
                      {totalTopics > 0 && (
                        <div className="hidden sm:block w-36 bg-gray-100 h-2 rounded-full overflow-hidden relative">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              percentage === 100 ? "bg-emerald-500" : percentage > 50 ? "bg-blue-500" : "bg-amber-500"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )}
                      
                      <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-slate-100 transition">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Curriculum Detail Block */}
                  {isExpanded && (
                    <div className="border-t border-gray-150 bg-slate-50 p-6 space-y-6">
                      
                      {/* Course Objectives / Details Description */}
                      <div className="bg-white rounded-xl p-5 border border-gray-150 shadow-sm space-y-2">
                        <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-pink-500" /> Chapter Overview & Objectives
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {week.description || "No custom curriculum descriptions provided for this week's chapter target."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Topic Checklist Column */}
                        <div className="bg-white rounded-xl p-5 border border-gray-150 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-500" /> Topic Checklist Verification
                            </h4>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {completedTopics} / {totalTopics} Checked
                            </span>
                          </div>

                          {(!week.topics || week.topics.length === 0) ? (
                            <p className="text-xs text-gray-400 italic">No checklist items configured for this week.</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                              {week.topics.map((topic) => {
                                const canToggle = isAdmin || isAssigned;
                                return (
                                  <div 
                                    key={topic.id}
                                    onClick={() => canToggle && handleToggleTopic(week, topic.id)}
                                    className={cn(
                                      "flex items-center gap-3 p-2.5 rounded-lg border text-xs font-semibold select-none transition duration-150",
                                      topic.isCompleted 
                                        ? "bg-emerald-50/50 border-emerald-100 text-slate-700" 
                                        : "bg-slate-50 border-gray-200 text-gray-600",
                                      canToggle ? "cursor-pointer hover:bg-slate-100" : "cursor-not-allowed opacity-80"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition",
                                      topic.isCompleted 
                                        ? "bg-emerald-500 border-emerald-600 text-white" 
                                        : "bg-white border-gray-300"
                                    )}>
                                      {topic.isCompleted && <Check className="w-3 h-3" />}
                                    </div>
                                    <span className={cn(topic.isCompleted && "line-through text-gray-400")}>
                                      {topic.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-[10px] text-gray-400 italic">
                            * Assigned faculty can check off topics live to dynamically update study module track metrics.
                          </p>
                        </div>

                        {/* Learning Resources & Documents Column */}
                        <div className="bg-white rounded-xl p-5 border border-gray-150 shadow-sm space-y-4">
                          <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-blue-500" /> Companion Learning Resources
                          </h4>

                          {(!week.resources || week.resources.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400 italic text-xs space-y-1">
                              <span>No static lecture resources are uploaded yet for this chapter.</span>
                            </div>
                          ) : (
                            <div className="space-y-2.5 max-h-64 overflow-y-auto">
                              {week.resources.map((res, rIdx) => (
                                <a 
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 rounded-lg border border-gray-150 bg-slate-50/50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                                >
                                  <span className="truncate pr-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                    {res.title}
                                  </span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery Notes / Faculty Logs */}
                      <div className="bg-white rounded-xl p-5 border border-gray-150 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-amber-500" /> Classroom Delivery & Faculty Notes
                          </h4>
                          {(isAdmin || isAssigned) && editingNotesId !== week.id && (
                            <button
                              onClick={() => {
                                setEditingNotesId(week.id);
                                setEditingNotes(week.notes || '');
                              }}
                              className="text-pink-600 hover:text-pink-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3 h-3" /> Edit Notes
                            </button>
                          )}
                        </div>

                        {editingNotesId === week.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingNotes}
                              onChange={(e) => setEditingNotes(e.target.value)}
                              placeholder="Describe coverage detail, lab performance notes, or trapping recap checklist points..."
                              className="w-full text-xs font-medium p-3 border border-gray-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-pink-500 rounded-xl min-h-[100px] text-gray-700"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-600 text-xs font-bold rounded-lg transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNotesAndStatus(week)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
                              >
                                <Save className="w-3.5 h-3.5" /> Save Note Log
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50/50 p-4 border border-gray-150 rounded-lg">
                            {week.notes ? (
                              <p className="text-xs font-medium text-gray-600 leading-relaxed whitespace-pre-line">
                                {week.notes}
                              </p>
                            ) : (
                              <p className="text-xs font-medium text-gray-400 italic">
                                No specific delivery log entries have been submitted yet.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Admin & Faculty Action Tray */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-150">
                        <div className="flex flex-wrap items-center gap-2">
                          {(isAdmin || isAssigned) && (
                            <>
                              <button
                                onClick={() => handleSaveNotesAndStatus(week, 'planning')}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer",
                                  week.status === 'planning' 
                                    ? "bg-slate-200 text-slate-800" 
                                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                                )}
                              >
                                Draft Stage
                              </button>
                              <button
                                onClick={() => handleSaveNotesAndStatus(week, 'active')}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer",
                                  week.status === 'active' 
                                    ? "bg-blue-100 text-blue-700" 
                                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                                )}
                              >
                                Activate Class
                              </button>
                              <button
                                onClick={() => handleSaveNotesAndStatus(week, 'completed')}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer",
                                  week.status === 'completed' 
                                    ? "bg-emerald-100 text-emerald-700" 
                                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                                )}
                              >
                                Complete Target
                              </button>
                            </>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              onClick={() => openModal(week)}
                              className="p-2 border border-gray-200 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                              title="Edit Week Settings"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoadmap(week.id)}
                              className="p-2 border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete Week Target"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Create & Edit Week Modal (Admins Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-gray-150 shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-6">
              <h3 className="text-xl font-black">{editingWeek ? "Edit Syllabus Week" : "Add Syllabus Week"}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure curriculum guidelines, duration target, materials, and assign specialized pre-press faculty.
              </p>
            </div>

            <form onSubmit={handleSaveRoadmap} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Course</label>
                  <select
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50"
                  >
                    {COURSES.map(course => (
                      <option key={course} value={course}>{formatCourseName(course)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Week Number</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formWeekNumber}
                      onChange={(e) => setFormWeekNumber(Number(e.target.value))}
                      className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lecture Hours</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Week / Unit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Principles of Layout & Folding Dummy Prep"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chapter Objectives / Summary Description</label>
                <textarea
                  placeholder="Provide brief objective descriptions of what students will explore and configure this week."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned Faculty Expert</label>
                  <select
                    value={formFacultyId}
                    onChange={(e) => setFormFacultyId(e.target.value)}
                    className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50"
                  >
                    <option value="">Choose Faculty Member</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50"
                  >
                    <option value="planning">Planning (Draft)</option>
                    <option value="active">Active (On-going)</option>
                    <option value="completed">Completed (Archived)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Checklist Topics (One per line)</label>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Multi-line list</span>
                </div>
                <textarea
                  placeholder="e.g.&#10;Introduction to folding layouts&#10;Folding mockups hands-on lab&#10;Bleed and trim margin pre-flight checks"
                  value={formTopicsText}
                  onChange={(e) => setFormTopicsText(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50 min-h-[100px] font-mono"
                />
              </div>

              {/* Learning Resource Links */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Companion Learning Material Links</label>
                  <button
                    type="button"
                    onClick={addResourceField}
                    className="text-pink-600 hover:text-pink-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Link
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {formResources.map((res, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Link Title (e.g. Folding Dummy PDF guide)"
                        value={res.title}
                        onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                        className="flex-1 text-xs font-semibold p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50"
                      />
                      <input
                        type="url"
                        placeholder="HTTPS Link URL"
                        value={res.url}
                        onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                        className="flex-1 text-xs font-semibold p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-pink-500 bg-slate-50"
                      />
                      {formResources.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResourceField(index)}
                          className="p-2 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" /> Save Curriculum
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
