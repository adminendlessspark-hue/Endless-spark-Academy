import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { Lead } from '../types';
import { Phone, Mail, Calendar, CheckCircle, XCircle, Clock, UserPlus, FileText, Search, Filter, Plus, Edit2, Trash2, Briefcase, MessageCircle, ChevronDown, ChevronUp, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../utils';

export default function TelecallerPanel() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShowingTemplates, setIsShowingTemplates] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingLeadDetails, setEditingLeadDetails] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [showTodayFollowUps, setShowTodayFollowUps] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+91',
    email: '',
    companyName: '',
    workExperience: '',
    currentRole: '',
    source: 'Advertisement',
    place: '',
    status: 'new' as Lead['status'],
  });

  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lead)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'leads'));

    // Subscribe to course settings dynamically
    const unsubSettings = onSnapshot(doc(db, 'settings', 'financial'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.coursesConfig) {
          setCourses(data.coursesConfig);
        }
      }
    }, (err) => {
      console.warn("Failed to subscribe to settings/financial in TelecallerPanel:", err);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  const checkPreview = () => {
    return false;
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPreview()) return;
    try {
      const fullPhone = `${formData.countryCode} ${formData.phone}`;
      const leadDataToSave = {
        ...formData,
        phone: fullPhone,
      };
      // Remove countryCode from the object we save to DB
      delete (leadDataToSave as any).countryCode;

      if (editingLeadDetails) {
        await updateDoc(doc(db, 'leads', editingLeadDetails.id), {
          ...leadDataToSave,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newLeadData = {
          ...leadDataToSave,
          notes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: user?.id,
        };
        await addDoc(collection(db, 'leads'), newLeadData);
      }
      setIsAddingLead(false);
      setEditingLeadDetails(null);
      setFormData({ name: '', phone: '', countryCode: '+91', email: '', companyName: '', workExperience: '', currentRole: '', source: 'Advertisement', place: '', status: 'new' });
    } catch (err) {
      handleFirestoreError(err, editingLeadDetails ? OperationType.UPDATE : OperationType.CREATE, 'leads');
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const handleAddNote = async (leadId: string, currentNotes: Lead['notes'], overrideNote?: string) => {
    const noteText = overrideNote || newNote;
    if (!noteText.trim() || !user) return;
    
    try {
      const note = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        text: noteText,
        authorId: user.id,
        authorName: user.name
      };
      
      const updateData: any = {
        notes: [...currentNotes, note],
        updatedAt: new Date().toISOString()
      };

      if (nextFollowUp && !overrideNote) {
        updateData.nextFollowUpDate = nextFollowUp;
      }

      await updateDoc(doc(db, 'leads', leadId), updateData);
      if (!overrideNote) {
        setNewNote('');
        setNextFollowUp('');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'leads', leadToDelete.id));
      setLeadToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leads/${leadToDelete.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConvertToStudent = async () => {
    if (!leadToConvert) return;
    
    try {
      // Create a new user document for the student
      const newStudentRef = await addDoc(collection(db, 'users'), {
        name: leadToConvert.name,
        email: leadToConvert.email,
        phone: leadToConvert.phone,
        role: 'student',
        isApproved: false,
        registeredForDemo: leadToConvert.status === 'demo_completed' || leadToConvert.status === 'demo_scheduled',
        applicationStatus: 'none',
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        createdAt: new Date().toISOString(),
        leadId: leadToConvert.id, // Link back to the lead
        telecallerId: user?.id || '',
        telecallerName: user?.name || ''
      });

      // Update lead status
      await updateDoc(doc(db, 'leads', leadToConvert.id), {
        status: 'admission_started',
        updatedAt: new Date().toISOString(),
        studentId: newStudentRef.id
      });

      setSuccessMessage(`Successfully converted ${leadToConvert.name} to a student!`);
      setLeadToConvert(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error converting lead:', err);
      alert('Failed to convert lead. You may not have permission.');
    }
  };

  const todayTasksCount = leads.filter(lead => {
    if (!lead.nextFollowUpDate) return false;
    const today = new Date().toISOString().split('T')[0];
    const followUpDate = new Date(lead.nextFollowUpDate).toISOString().split('T')[0];
    return followUpDate === today;
  }).length;

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.phone.includes(searchTerm) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    let matchesFollowUp = true;
    if (showTodayFollowUps) {
      if (!lead.nextFollowUpDate) {
        matchesFollowUp = false;
      } else {
        const today = new Date().toISOString().split('T')[0];
        const followUpDate = new Date(lead.nextFollowUpDate).toISOString().split('T')[0];
        matchesFollowUp = followUpDate === today;
      }
    }

    let matchesDate = true;
    if (startDate || endDate) {
      const leadDate = new Date(lead.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      
      if (start && leadDate < start) matchesDate = false;
      if (end && leadDate > end) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesFollowUp && matchesDate;
  });

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'willing': return 'bg-purple-100 text-purple-800';
      case 'demo_scheduled': return 'bg-pink-100 text-pink-800';
      case 'demo_completed': return 'bg-orange-100 text-orange-800';
      case 'admission_started': return 'bg-green-100 text-green-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      case 'not_qualified': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Lead['status']) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage leads, calls, and admissions</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 custom-scrollbar w-full md:w-auto shrink-0 touch-pan-x whitespace-nowrap">
          <a
            href="/about-courses"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all shadow-md rounded-xl py-2 px-4 text-sm font-medium"
          >
            <BookOpen className="w-5 h-5" />
            View Course Overview
          </a>
          <button
            onClick={() => setIsShowingTemplates(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all shadow-md rounded-xl py-2 px-4 text-sm font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp Templates
          </button>
          <button
            onClick={() => {
              setEditingLeadDetails(null);
              setFormData({ name: '', phone: '', countryCode: '+91', email: '', companyName: '', workExperience: '', currentRole: '', source: 'Advertisement', place: '', status: 'new' });
              setIsAddingLead(true);
            }}
            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
          >
            <UserPlus className="w-5 h-5" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="willing">Willing</option>
            <option value="demo_scheduled">Demo Scheduled</option>
            <option value="demo_completed">Demo Completed</option>
            <option value="admission_started">Admission Started</option>
            <option value="not_interested">Not Interested</option>
            <option value="not_qualified">Not Qualified</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
              title="From Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
              title="To Date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs font-bold text-pink-600 hover:text-pink-700"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setShowTodayFollowUps(!showTodayFollowUps)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors relative",
              showTodayFollowUps 
                ? "bg-pink-50 border-pink-200 text-pink-700 font-medium" 
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Clock className="w-4 h-4" />
            Today's Tasks
            {todayTasksCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {todayTasksCount}
              </span>
            )}
          </button>
          <Filter className="w-5 h-5 text-gray-400 ml-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="willing">Willing</option>
            <option value="demo_scheduled">Demo Scheduled</option>
            <option value="demo_completed">Demo Completed</option>
            <option value="admission_started">Admission Started</option>
            <option value="not_interested">Not Interested</option>
            <option value="not_qualified">Not Qualified</option>
          </select>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLeads.map(lead => (
          <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div className="min-w-[200px] flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{lead.name}</h3>
                  <div className="flex flex-col gap-1 mt-2 text-sm text-gray-500">
                    <div className="flex flex-wrap items-center gap-4">
                      <a 
                        href={`tel:${lead.phone.replace(/\s+/g, '')}`} 
                        onClick={() => handleAddNote(lead.id, lead.notes, "Initiated system call")}
                        className="flex items-center gap-1 text-pink-600 hover:text-pink-700 font-medium transition-colors"
                      >
                        <Phone className="w-4 h-4" /> {lead.phone}
                      </a>
                      <a 
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleAddNote(lead.id, lead.notes, "Initiated WhatsApp chat")}
                        className="flex items-center gap-1 text-[#25D366] hover:text-[#128C7E] font-medium transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                      <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {lead.email}</span>
                    </div>
                    {(lead.companyName || lead.currentRole || lead.workExperience) && (
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" /> 
                          {[lead.currentRole, lead.companyName].filter(Boolean).join(' at ') || 'Professional'}
                          {lead.workExperience && ` (${lead.workExperience} yrs)`}
                        </span>
                      </div>
                    )}
                    {(lead.source || lead.place) && (
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                        {lead.source && <span className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">Source: {lead.source}</span>}
                        {lead.place && <span className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">Place: {lead.place}</span>}
                        {lead.testScore !== undefined && <span className="flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-bold">Test Score: {lead.testScore}/75</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar touch-pan-x whitespace-nowrap justify-start lg:justify-end w-full lg:w-auto shrink-0 pr-2">
                  <a 
                    href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                    onClick={() => handleAddNote(lead.id, lead.notes, "Initiated system call")}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shrink-0"
                    title="Call Lead"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </a>
                  <a 
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleAddNote(lead.id, lead.notes, "Initiated WhatsApp chat")}
                    className="flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white hover:bg-[#128C7E] rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shrink-0"
                    title="WhatsApp Lead"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                  <select
                    value={lead.status}
                    onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as Lead['status'])}
                    className={cn(
                      "text-sm font-bold px-3 py-1 rounded-full border-0 cursor-pointer max-w-[160px] truncate shrink-0",
                      getStatusColor(lead.status)
                    )}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="willing">Willing</option>
                    <option value="demo_scheduled">Demo Scheduled</option>
                    <option value="demo_completed">Demo Completed</option>
                    <option value="admission_started">Admission Started</option>
                    <option value="not_interested">Not Interested</option>
                    <option value="not_qualified">Not Qualified</option>
                  </select>
                  {user?.role === 'admin' && (
                    <>
                      <button 
                        onClick={() => {
                          setEditingLeadDetails(lead);
                          const phoneParts = lead.phone.split(' ');
                          const countryCode = phoneParts.length > 1 && phoneParts[0].startsWith('+') ? phoneParts[0] : '+91';
                          const phone = phoneParts.length > 1 && phoneParts[0].startsWith('+') ? phoneParts.slice(1).join(' ') : lead.phone;
                          
                          setFormData({
                            name: lead.name,
                            phone: phone,
                            countryCode: countryCode,
                            email: lead.email,
                            companyName: lead.companyName || '',
                            workExperience: lead.workExperience || '',
                            currentRole: lead.currentRole || '',
                            source: lead.source || 'Advertisement',
                            place: lead.place || '',
                            status: lead.status,
                          });
                          setIsAddingLead(true);
                        }} 
                        className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all active:scale-90 shadow-md shrink-0"
                        title="Edit Lead"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setLeadToDelete(lead)} 
                        className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all active:scale-90 shadow-md shrink-0"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="text-xs text-gray-400 flex items-center gap-1 flex-1">
                  <Clock className="w-3 h-3" /> 
                  <span className={cn(lead.source === 'Demo Entrance Test' && "text-blue-600 font-bold")}>
                    Added {new Date(lead.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {lead.source === 'Demo Entrance Test' && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold">
                      Demo Test
                    </span>
                  )}
                </div>
                {['willing', 'demo_completed', 'demo_scheduled'].includes(lead.status) && !lead.studentId && (
                  <button
                    onClick={() => setLeadToConvert(lead)}
                    className="text-xs bg-pink-50 text-pink-600 hover:bg-pink-100 hover:shadow-sm active:scale-95 px-3 py-1.5 rounded-lg font-bold transition-all"
                  >
                    Convert to Student
                  </button>
                )}
                {lead.studentId && (
                  <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Converted
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 flex-1 flex flex-col">
              <button 
                onClick={() => setExpandedNotes(prev => ({ ...prev, [lead.id]: !prev[lead.id] }))}
                className={cn(
                  "w-full flex items-center justify-between font-bold text-[13px] md:text-sm transition-all px-4 py-2.5 rounded-xl border shadow-sm",
                  expandedNotes[lead.id]
                    ? "bg-pink-50 text-pink-700 border-pink-300"
                    : "bg-white text-pink-600 border-pink-500"
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Call Notes ({lead.notes.length})
                </div>
                {expandedNotes[lead.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {expandedNotes[lead.id] && (
                <div className="flex-1 flex flex-col pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-3 mb-4 flex-1 max-h-48 overflow-y-auto pr-2">
                    {lead.notes.length === 0 ? (
                      <p className="text-sm text-gray-500 italic px-1">No notes yet.</p>
                    ) : (
                      lead.notes.map(note => (
                        <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-100 text-sm shadow-2xs">
                          <p className="text-gray-800">{note.text}</p>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                            <span>{note.authorName}</span>
                            <span>{new Date(note.date).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-auto border-t border-gray-150 pt-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a note..."
                        value={editingLead?.id === lead.id ? newNote : ''}
                        onChange={(e) => {
                          setEditingLead(lead);
                          setNewNote(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingLead?.id === lead.id) {
                            handleAddNote(lead.id, lead.notes);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-gray-800"
                      />
                      <input
                        type="date"
                        title="Next Follow Up Date"
                        value={editingLead?.id === lead.id ? nextFollowUp : ''}
                        onChange={(e) => {
                          setEditingLead(lead);
                          setNextFollowUp(e.target.value);
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-gray-800"
                      />
                      <button
                        onClick={() => handleAddNote(lead.id, lead.notes)}
                        disabled={editingLead?.id !== lead.id || !newNote.trim()}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                      >
                        Add
                      </button>
                    </div>
                    {lead.nextFollowUpDate && (
                      <div className="text-xs text-pink-600 flex items-center gap-1 font-medium bg-pink-50 px-2 py-1 rounded-md self-start">
                        <Clock className="w-3 h-3" /> Next Follow Up: {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredLeads.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">No leads found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* WhatsApp Templates Modal */}
      {isShowingTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-green-500" /> WhatsApp Marketing Templates
              </h2>
              <button
                onClick={() => setIsShowingTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">General Inquiry Template</h3>
                <div id="whatsapp-template-view" className="bg-white border text-sm text-gray-700 whitespace-pre-wrap border-gray-200 rounded-lg p-4 font-mono mb-3">
{`*Hello!* 👋

Welcome to *Endless Spark School of Printing and Packaging*!

We are excited to share an amazing opportunity to transform your career! 🚀

*Modes of Study Available:*
📍 *Offline Classes*: Practical, hands-on physical labs and classroom training.
💻 *Online Classes*: Learn from anywhere with our advanced interactive student app.

*Explore our industry-leading courses:*
${courses.length > 0 ? courses.map(course => `🎓 ${course.title}`).join('\n') : "🎓 Packaging Engineer\n🎓 Production Art Engineer\n🎓 Print Ready Engineer\n🎓 Plate Ready Engineer\n🎓 Colour Retouching Engineer\n🎓 Quality Control Engineer\n🎓 Printing & Packaging Cross Courses"}

*How Our Dedicated Learning App Helps You Excel Online:*
🧠 *Interactive AI Mind Maps*: Simplify complex technical concepts with visual structures.
📋 *Digital Project Checklists*: Work on real-world Pre-Flight & QC checklists dynamically.
🎥 *Secure Video Hub*: Replay recorded lectures anytime with lightning-fast streaming.
💬 *Live Queries Resolver*: Raise doubts via our support catalog and get timely solutions from faculty.
📅 *Smart Cohort Scheduler*: Effortlessly plan offline labs and schedule live online mentoring sessions.

*Join us to get:*
✅ Flexible Class Schedules 
✅ 100% Placement Assistance 
✅ Industry Expert Mentorship

Ready to get started or learn more? 
👉 Fill out this quick inquiry form and we'll get right back to you:
${window.location.origin}/inquiry

📞 Or reach us directly on Call / WhatsApp: *+91 90428 21999*

Let’s build your future together! 🌟

Best,
The Admissions Team`}
                </div>
                <button
                  id="copy-whatsapp-template-btn"
                  onClick={() => {
                    const text = `*Hello!* 👋\n\nWelcome to *Endless Spark School of Printing and Packaging*!\n\nWe are excited to share an amazing opportunity to transform your career! 🚀\n\n*Modes of Study Available:*\n📍 *Offline Classes*: Practical, hands-on physical labs and classroom training.\n💻 *Online Classes*: Learn from anywhere with our advanced interactive student app.\n\n*Explore our industry-leading courses:*\n${courses.length > 0 ? courses.map(course => `🎓 ${course.title}`).join('\n') : "🎓 Packaging Engineer\n🎓 Production Art Engineer\n🎓 Print Ready Engineer\n🎓 Plate Ready Engineer\n🎓 Colour Retouching Engineer\n🎓 Quality Control Engineer\n🎓 Printing & Packaging Cross Courses"}\n\n*How Our Dedicated Learning App Helps You Excel Online:*\n🧠 *Interactive AI Mind Maps*: Simplify complex technical concepts with visual structures.\n📋 *Digital Project Checklists*: Work on real-world Pre-Flight & QC checklists dynamically.\n🎥 *Secure Video Hub*: Replay recorded lectures anytime with lightning-fast streaming.\n💬 *Live Queries Resolver*: Raise doubts via our support catalog and get timely solutions from faculty.\n📅 *Smart Cohort Scheduler*: Effortlessly plan offline labs and schedule live online mentoring sessions.\n\n*Join us to get:*\n✅ Flexible Class Schedules \n✅ 100% Placement Assistance \n✅ Industry Expert Mentorship\n\nReady to get started or learn more? \n👉 Fill out this quick inquiry form and we'll get right back to you:\n${window.location.origin}/inquiry\n\n📞 Or reach us directly on Call / WhatsApp: *+91 90428 21999*\n\nLet’s build your future together! 🌟\n\nBest,\nThe Admissions Team\n`;
                    navigator.clipboard.writeText(text);
                    alert('Template copied to clipboard!');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsShowingTemplates(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Lead Modal */}
      {isAddingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingLeadDetails ? 'Edit Lead' : 'Add New Lead'}</h2>
            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={e => setFormData({...formData, countryCode: e.target.value})}
                    className="w-24 px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+971">+971 (UAE)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+65">+65 (SG)</option>
                    <option value="+60">+60 (MY)</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                <input
                  type="text"
                  value={formData.currentRole}
                  onChange={e => setFormData({...formData, currentRole: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience (Years)</label>
                <input
                  type="text"
                  value={formData.workExperience}
                  onChange={e => setFormData({...formData, workExperience: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                <select
                  value={formData.source}
                  onChange={e => setFormData({...formData, source: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="Advertisement">Advertisement</option>
                  <option value="Student referral">Student referral</option>
                  <option value="External referral">External referral</option>
                  <option value="Cold Call">Cold Call</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                <input
                  type="text"
                  value={formData.place}
                  onChange={e => setFormData({...formData, place: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as Lead['status']})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="willing">Willing</option>
                  <option value="not_qualified">Not Qualified</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingLead(false);
                    setEditingLeadDetails(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  {editingLeadDetails ? 'Save Changes' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Lead Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Lead</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the lead for <strong>{leadToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLeadToDelete(null)}
                className="btn-secondary py-2 px-4 shadow-none text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 font-bold shadow-md"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Student Modal */}
      {leadToConvert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Convert to Student</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to convert <strong>{leadToConvert.name}</strong> to a student? This will create a new student account.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLeadToConvert(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToStudent}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
