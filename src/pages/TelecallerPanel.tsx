import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import { 
  DEFAULT_GENERAL_TEMPLATE, 
  DEFAULT_COURSE_PROMO_TEMPLATE, 
  resolveTemplateText 
} from '../utils/whatsappTemplates';
import { Lead } from '../types';
import { Phone, Mail, Calendar, CheckCircle, XCircle, Clock, UserPlus, FileText, Search, Filter, Plus, Edit2, Trash2, Briefcase, MessageCircle, ChevronDown, ChevronUp, BookOpen, Sparkles, Loader2, Mic, MicOff, Square, Play, Pause, Volume2, Upload, Radio, HelpCircle, PhoneCall, PhoneOff, FileAudio, Download } from 'lucide-react';
import { cn } from '../utils';

export default function TelecallerPanel() {
  const { user } = useAuth();
  const { whatsappSettings } = useSettings();
  const promoVideoUrl = whatsappSettings?.coursePromotionVideoUrl || 'https://youtu.be/vMl8FHK75HM';
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

  // In-App Calling & Call Recording States
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'paused' | 'ended'>('idle');
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  // Advice & Guide Modal State
  const [showCallAdviceModal, setShowCallAdviceModal] = useState(false);

  // Expanded Call Recordings State per Lead
  const [expandedRecordings, setExpandedRecordings] = useState<Record<string, boolean>>({});

  // Audio Recording Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer Helper
  const startCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start In-App Call with Live Microphone Recording
  const handleStartInAppCall = async (lead: Lead) => {
    setActiveCallLead(lead);
    setCallStatus('dialing');
    setCallTimer(0);
    setIsMuted(false);
    setCallNotes('');
    setRecordingBlob(null);
    setRecordingUrl(null);
    audioChunksRef.current = [];

    // Trigger device phone dialer directly without opening popup tabs
    window.location.href = `tel:${lead.phone.replace(/\s+/g, '')}`;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordingBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
      };

      mediaRecorder.start(1000);
      setCallStatus('connected');
      startCallTimer();
    } catch (err) {
      console.error("Error accessing microphone for call recording:", err);
      // Still allow call timer and notes even if mic permission is restricted
      setCallStatus('connected');
      startCallTimer();
    }
  };

  // Mute / Unmute Microphone
  const toggleMuteMicrophone = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Pause / Resume Recording
  const togglePauseRecording = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        stopCallTimer();
        setCallStatus('paused');
      } else if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        startCallTimer();
        setCallStatus('connected');
      }
    }
  };

  // End Call
  const handleEndCall = () => {
    stopCallTimer();
    setCallStatus('ended');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping media recorder:", e);
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Save Call Recording & Add Note
  const handleSaveCallRecording = async () => {
    if (!activeCallLead) return;
    setIsUploadingRecording(true);
    setUploadProgressMsg('Saving call recording and logs...');

    try {
      let finalAudioUrl = '';

      if (recordingBlob && recordingBlob.size > 0) {
        setUploadProgressMsg('Uploading audio recording file...');
        const formDataUpload = new FormData();
        const fileExt = recordingBlob.type.includes('ogg') ? 'ogg' : 'webm';
        const fileName = `call_recording_${activeCallLead.id}_${Date.now()}.${fileExt}`;
        formDataUpload.append('file', new File([recordingBlob], fileName, { type: recordingBlob.type }));

        const res = await fetch('/api/upload-template?path=course_modules/call_recordings', {
          method: 'POST',
          body: formDataUpload
        });

        if (res.ok) {
          const data = await res.json();
          finalAudioUrl = data.url || '';
        } else {
          finalAudioUrl = recordingUrl || '';
        }
      }

      const durationStr = formatTime(callTimer);
      const newRecordingItem = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: durationStr,
        audioUrl: finalAudioUrl,
        authorId: user?.id || 'telecaller',
        authorName: user?.name || 'Telecaller',
        note: callNotes.trim()
      };

      const updatedRecordings = [newRecordingItem, ...(activeCallLead.callRecordings || [])];

      const callNoteText = `📞 In-App Recorded Call (${durationStr}): ${callNotes.trim() || 'Call completed.'}${finalAudioUrl ? ' [Audio Recording Attached]' : ''}`;
      const newNoteObj = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        text: callNoteText,
        authorId: user?.id || 'telecaller',
        authorName: user?.name || 'Telecaller'
      };
      const updatedNotes = [newNoteObj, ...activeCallLead.notes];

      await updateDoc(doc(db, 'leads', activeCallLead.id), {
        callRecordings: updatedRecordings,
        notes: updatedNotes,
        status: activeCallLead.status === 'new' ? 'contacted' : activeCallLead.status,
        updatedAt: new Date().toISOString()
      });

      setSuccessMessage('Call recording and log saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3500);

      setActiveCallLead(null);
      setCallStatus('idle');
      setRecordingBlob(null);
      setRecordingUrl(null);
    } catch (err) {
      console.error("Error saving call recording:", err);
      alert("Failed to save call recording. Please try again.");
    } finally {
      setIsUploadingRecording(false);
      setUploadProgressMsg('');
    }
  };
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
            onClick={() => setShowCallAdviceModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all shadow-md rounded-xl py-2 px-4 text-sm font-medium cursor-pointer"
          >
            <Radio className="w-5 h-5 text-yellow-300 animate-pulse" />
            Call Recording Guide
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
                    onClick={() => handleAddNote(lead.id, lead.notes, "Initiated direct call")}
                    className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shrink-0 cursor-pointer"
                    title="Direct Phone Call (Triggers Phone Dialer Immediately)"
                  >
                    <PhoneCall className="w-4 h-4 animate-bounce" />
                    <span>Direct Call</span>
                  </a>
                  <button 
                    onClick={() => handleStartInAppCall(lead)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shrink-0 cursor-pointer"
                    title="In-App Call & Live Microphone Audio Recording"
                  >
                    <Mic className="w-4 h-4 text-yellow-300 animate-pulse" />
                    <span>Call & Record</span>
                  </button>
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

              {/* Call Recordings Accordion */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button 
                  onClick={() => setExpandedRecordings(prev => ({ ...prev, [lead.id]: !prev[lead.id] }))}
                  className={cn(
                    "w-full flex items-center justify-between font-bold text-[13px] md:text-sm transition-all px-4 py-2 rounded-xl border shadow-2xs cursor-pointer",
                    expandedRecordings[lead.id]
                      ? "bg-purple-50 text-purple-700 border-purple-300"
                      : "bg-white text-purple-700 border-purple-200 hover:bg-purple-50/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-purple-600" /> 
                    <span>Call Recordings ({lead.callRecordings?.length || 0})</span>
                  </div>
                  {expandedRecordings[lead.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedRecordings[lead.id] && (
                  <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                    {(!lead.callRecordings || lead.callRecordings.length === 0) ? (
                      <div className="bg-white p-3 rounded-lg border border-gray-100 text-xs text-gray-500 italic text-center">
                        No audio call recordings attached yet. Use "Call & Record" to save recorded calls.
                      </div>
                    ) : (
                      lead.callRecordings.map(rec => (
                        <div key={rec.id} className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs text-xs space-y-2">
                          <div className="flex justify-between items-center text-gray-600 font-semibold">
                            <span className="flex items-center gap-1.5 text-purple-800">
                              <Mic className="w-3.5 h-3.5 text-purple-600" />
                              {rec.authorName || 'Telecaller'}
                            </span>
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              Duration: {rec.duration || '00:00'}
                            </span>
                          </div>
                          {rec.note && <p className="text-gray-800 italic bg-gray-50 p-2 rounded-lg border border-gray-100">{rec.note}</p>}
                          {rec.audioUrl ? (
                            <div className="pt-1">
                              <audio controls src={rec.audioUrl} className="w-full h-8 rounded-lg outline-none" />
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">No audio file available</p>
                          )}
                          <div className="text-[10px] text-gray-400 text-right">
                            {new Date(rec.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
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
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-green-500" /> WhatsApp Marketing Templates
                </h2>
                <a 
                  href="/marketing?tab=templates" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-pink-600 font-bold hover:underline mt-1"
                >
                  <span>Open Full Marketing Templates Page</span>
                  <span>↗</span>
                </a>
              </div>
              <button
                onClick={() => setIsShowingTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Course Promotion Video Highlight Banner */}
              <div className="p-3 bg-pink-50 border border-pink-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-pink-600 text-white rounded-lg">🎥</span>
                  <div>
                    <span className="font-bold text-gray-900 block">Course Promotion Video URL:</span>
                    <a href={promoVideoUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 font-mono underline font-medium">
                      {promoVideoUrl}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(promoVideoUrl);
                    alert('Video URL copied!');
                  }}
                  className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 font-bold rounded-lg hover:bg-pink-100 transition-colors shrink-0"
                >
                  Copy Video Link
                </button>
              </div>

              {/* General Inquiry & Course Overview Template */}
              {(() => {
                const textGeneral = resolveTemplateText(
                  whatsappSettings?.customGeneralTemplate,
                  DEFAULT_GENERAL_TEMPLATE,
                  { promoVideoUrl, courses }
                );
                return (
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                    <h3 className="font-semibold text-base text-gray-800">General Inquiry Template with Course Promotion Video</h3>
                    <div id="whatsapp-template-view" className="bg-white border text-sm text-gray-700 whitespace-pre-wrap border-gray-200 rounded-lg p-4 font-mono leading-relaxed">
                      {textGeneral}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textGeneral)}`, '_blank');
                        }}
                        className="flex-1 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Share Directly on WhatsApp</span>
                      </button>
                      <button
                        id="copy-whatsapp-template-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(textGeneral);
                          alert('Template copied to clipboard!');
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
                      >
                        Copy Text
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Dedicated Video Promotion Template Card */}
              {(() => {
                const textCoursePromo = resolveTemplateText(
                  whatsappSettings?.customCoursePromoTemplate,
                  DEFAULT_COURSE_PROMO_TEMPLATE,
                  { promoVideoUrl }
                );
                return (
                  <div className="border border-pink-200 rounded-xl p-4 bg-pink-50/40 space-y-3">
                    <h3 className="font-bold text-base text-pink-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-600" /> Dedicated Course Promotion Video Template
                    </h3>
                    <div className="bg-white border text-sm text-gray-700 whitespace-pre-wrap border-gray-200 rounded-lg p-4 font-mono leading-relaxed">
                      {textCoursePromo}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textCoursePromo)}`, '_blank');
                        }}
                        className="flex-1 w-full bg-pink-600 hover:bg-pink-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Share Directly on WhatsApp</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(textCoursePromo);
                          alert('Course Promotion Video template copied!');
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
                      >
                        Copy Text
                      </button>
                    </div>
                  </div>
                );
              })()}
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

      {/* Active In-App Call & Live Recording Modal */}
      {activeCallLead && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-purple-100 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-full shadow-lg ring-8 ring-purple-100 relative">
                {callStatus === 'connected' ? (
                  <PhoneCall className="w-10 h-10 animate-bounce" />
                ) : callStatus === 'ended' ? (
                  <PhoneOff className="w-10 h-10 text-red-300" />
                ) : (
                  <Phone className="w-10 h-10 animate-pulse" />
                )}
                {callStatus === 'connected' && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">{activeCallLead.name}</h2>
                <p className="text-lg font-bold text-purple-700 mt-1">{activeCallLead.phone}</p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-bold border border-purple-200">
                  <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                  {callStatus === 'dialing' && 'Initiating Call & Microphone...'}
                  {callStatus === 'connected' && 'Call Active & Recording...'}
                  {callStatus === 'paused' && 'Recording Paused'}
                  {callStatus === 'ended' && 'Call Completed'}
                </div>
              </div>

              {/* Timer Display */}
              <div className="py-3 bg-gray-900 text-white rounded-2xl font-mono text-3xl font-bold tracking-widest shadow-inner flex items-center justify-center gap-3">
                <Clock className="w-6 h-6 text-purple-400" />
                <span>{formatTime(callTimer)}</span>
              </div>

              {/* Active Call Controls */}
              {callStatus !== 'ended' ? (
                <div className="flex items-center justify-center gap-4 py-3">
                  <button
                    onClick={toggleMuteMicrophone}
                    className={cn(
                      "p-4 rounded-full font-bold transition-all shadow-md active:scale-90 flex flex-col items-center gap-1 text-xs",
                      isMuted ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff className="w-6 h-6 text-red-600" /> : <Mic className="w-6 h-6 text-purple-600" />}
                    <span>{isMuted ? 'Muted' : 'Mute'}</span>
                  </button>

                  <button
                    onClick={togglePauseRecording}
                    className="p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold transition-all shadow-md active:scale-90 flex flex-col items-center gap-1 text-xs"
                    title={callStatus === 'paused' ? "Resume Recording" : "Pause Recording"}
                  >
                    {callStatus === 'paused' ? <Play className="w-6 h-6 text-green-600" /> : <Pause className="w-6 h-6 text-amber-600" />}
                    <span>{callStatus === 'paused' ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all shadow-lg active:scale-90 flex flex-col items-center gap-1 text-xs ring-4 ring-red-100"
                    title="End Call"
                  >
                    <PhoneOff className="w-6 h-6" />
                    <span>End Call</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-2 text-left">
                  {recordingUrl && (
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                        <Volume2 className="w-4 h-4 text-purple-600" /> Live Audio Recording Preview ({formatTime(callTimer)})
                      </div>
                      <audio controls src={recordingUrl} className="w-full h-10 rounded-lg outline-none" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Call Outcome Notes / Discussion Summary</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Lead interested in Graphic Design course, demo session confirmed for Friday..."
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none text-gray-800"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setActiveCallLead(null);
                        setCallStatus('idle');
                      }}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm"
                    >
                      Discard Call
                    </button>
                    <button
                      onClick={handleSaveCallRecording}
                      disabled={isUploadingRecording}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUploadingRecording ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{uploadProgressMsg || 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-300" />
                          <span>Save Call & Recording</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Call & Recording Setup Guide Modal */}
      {showCallAdviceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-purple-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-purple-600" /> Telecaller Call & Recording Guide
              </h2>
              <button onClick={() => setShowCallAdviceModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>

            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-base mb-1">
                  <PhoneCall className="w-5 h-5 text-emerald-700" /> 1. Direct Phone Call
                </h3>
                <p className="text-xs text-emerald-800">
                  Click <strong>"Direct Call"</strong> on any lead card to trigger your phone dialer immediately with the lead's mobile number.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                <h3 className="font-bold text-purple-900 flex items-center gap-2 text-base mb-1">
                  <Mic className="w-5 h-5 text-purple-700" /> 2. In-App Call & Live Recording
                </h3>
                <p className="text-xs text-purple-800">
                  Click <strong>"Call & Record"</strong> on any lead card. The app triggers your phone dialer and captures live microphone audio during the conversation. Upon ending the call, your audio recording and outcome notes are automatically saved to the lead's history.
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-base mb-1">
                  <CheckCircle className="w-5 h-5 text-indigo-700" /> 3. Review Call Logs
                </h3>
                <p className="text-xs text-indigo-800">
                  Admins and Telecallers can expand <strong>"Call Recordings"</strong> under any lead card to listen to audio recordings, check durations, and review follow-up notes anytime.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowCallAdviceModal(false)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
