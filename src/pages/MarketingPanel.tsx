import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';
import { 
  Video, 
  Users, 
  Laptop, 
  MapPin, 
  Search, 
  MessageCircle, 
  Trash2, 
  Phone, 
  Clock, 
  Calendar, 
  Download,
  CheckCircle,
  FileText,
  Filter,
  Plus,
  Share2,
  Copy,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Image,
  Globe,
  Settings,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { cn } from '../utils';

interface Note {
  id: string;
  date: string;
  text: string;
  authorId: string;
  authorName: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  currentRole?: string;
  place?: string;
  source?: string;
  status: 'new' | 'contacted' | 'willing' | 'demo_scheduled' | 'demo_completed' | 'admission_started' | 'not_interested' | 'not_qualified';
  createdAt: string;
  workExperience?: string;
  notes?: Note[];
}

export default function MarketingPanel() {
  const { user } = useAuth();
  const { logoUrl: hookLogoUrl, landingPageTitleImageUrl: hookTitleImg } = useSettings();

  // Active Tab: leads, customization, whatsapp-templates, schedules
  const [activePanelTab, setActivePanelTab] = useState<'leads' | 'customize' | 'templates' | 'schedules'>('leads');

  // Live Webinar Call Sessions state
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [showCreateWebinarModal, setShowCreateWebinarModal] = useState(false);
  const [webinarTitleText, setWebinarTitleText] = useState('');
  const [webinarSpeaker, setWebinarSpeaker] = useState('');
  const [webinarDate, setWebinarDate] = useState('');
  const [webinarDescription, setWebinarDescription] = useState('');
  const [editingWebinarId, setEditingWebinarId] = useState<string | null>(null);

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [activeNoteLeadId, setActiveNoteLeadId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Branding & Configuration states
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [titleImageInputUrl, setTitleImageInputUrl] = useState('');
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [webinarCustomTitle, setWebinarCustomTitle] = useState('Hands-on Printing & Packaging Advanced Webcast');
  const [webinarCustomDate, setWebinarCustomDate] = useState('Sunday, Forthcoming Weekend');
  const [webinarCustomTime, setWebinarCustomTime] = useState('11:00 AM - 12:30 PM (IST)');
  const [webinarInstructorName, setWebinarInstructorName] = useState('Prof. Anand Nair');
  const [webinarInstructorRole, setWebinarInstructorRole] = useState('Packaging Tech Lead');

  // Online Benefits customization lists
  const [appBenefits, setAppBenefits] = useState<string[]>([
    "Cloud preflight inspector which matches actual industry-standard parameters instantly.",
    "Dynamic live mock simulators designed to emulate offset & digital printing presses on any device.",
    "Bite-sized technical micro-modules accessible anywhere, anytime on the school companion app.",
    "Direct live audio classrooms connecting you directly with tier-1 pre-press specialists."
  ]);
  const [newBenefitText, setNewBenefitText] = useState('');

  // Loaded from Firebase settings/marketing document
  useEffect(() => {
    const unsubMarketing = onSnapshot(doc(db, 'settings', 'marketing'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.webinarCustomTitle) setWebinarCustomTitle(data.webinarCustomTitle);
        if (data.webinarCustomDate) setWebinarCustomDate(data.webinarCustomDate);
        if (data.webinarCustomTime) setWebinarCustomTime(data.webinarCustomTime);
        if (data.webinarInstructorName) setWebinarInstructorName(data.webinarInstructorName);
        if (data.webinarInstructorRole) setWebinarInstructorRole(data.webinarInstructorRole);
        if (data.appBenefits && Array.isArray(data.appBenefits)) setAppBenefits(data.appBenefits);
      }
    });

    const unsubAdmin = onSnapshot(doc(db, 'settings', 'admin'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logoUrl) setLogoInputUrl(data.logoUrl);
        if (data.landingPageTitleImageUrl) setTitleImageInputUrl(data.landingPageTitleImageUrl);
      }
    });

    return () => {
      unsubMarketing();
      unsubAdmin();
    };
  }, []);

  // Update branding properties in firestore settings
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBranding(true);
    try {
      // Write to settings/admin
      await updateDoc(doc(db, 'settings', 'admin'), {
        logoUrl: logoInputUrl,
        landingPageTitleImageUrl: titleImageInputUrl,
        updatedAt: new Date().toISOString()
      });

      // Write to settings/marketing
      await setDoc(doc(db, 'settings', 'marketing'), {
        webinarCustomTitle,
        webinarCustomDate,
        webinarCustomTime,
        webinarInstructorName,
        webinarInstructorRole,
        appBenefits,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      alert('Branding and dynamic webinar settings updated successfully! Page templates will update in real-time.');
    } catch (err) {
      console.error('Error saving marketing settings:', err);
      alert('Error updating marketing details: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleAddAppBenefit = () => {
    if (!newBenefitText.trim()) return;
    setAppBenefits([...appBenefits, newBenefitText.trim()]);
    setNewBenefitText('');
  };

  const handleRemoveAppBenefit = (index: number) => {
    setAppBenefits(appBenefits.filter((_, idx) => idx !== index));
  };

  // Subscribe to leads
  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLeads = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      })) as Lead[];
      
      const webinarLeads = allLeads.filter(lead => 
        (lead.source && lead.source.toLowerCase().includes('webinar')) || 
        (lead.workExperience && lead.workExperience.includes('ticketId'))
      );
      setLeads(webinarLeads);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'leads');
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to live webinar call sessions
  useEffect(() => {
    const q = query(collection(db, 'live_sessions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSessions = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
      // Filter for type 'webinar'
      const webinarSessions = allSessions.filter((s: any) => s.type === 'webinar');
      setLiveSessions(webinarSessions);
    }, (err) => {
      console.error('Error fetching live sessions:', err);
    });

    return () => unsubscribe();
  }, []);

  // Parse metadata from workExperience
  const parseWebinarMeta = (workExperienceString?: string) => {
    if (!workExperienceString) return null;
    try {
      const parsed = JSON.parse(workExperienceString);
      if (parsed && typeof parsed === 'object' && parsed.ticketId) {
        return {
          webinarTitle: parsed.webinarTitle || 'Masterclass',
          studyMode: parsed.studyMode || 'online',
          scheduledTime: parsed.scheduledTime || 'Date/Time TBA',
          ticketId: parsed.ticketId || 'WBN-GEN'
        };
      }
    } catch (e) {
      // not JSON
    }
    return null;
  };

  // Update Lead Status
  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  // Add Log Note
  const handleAddNote = async (leadId: string, existingNotes: Note[] = []) => {
    if (!newNoteText.trim()) return;
    try {
      const updatedNotes = [
        ...existingNotes,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          text: newNoteText,
          authorId: user?.id || 'marketing',
          authorName: user?.name || 'Marketing Executive'
        }
      ];

      await updateDoc(doc(db, 'leads', leadId), {
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      });

      setNewNoteText('');
      setActiveNoteLeadId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  // Remove registration lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to remove this registration?')) return;
    try {
      await deleteDoc(doc(db, 'leads', leadId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leads/${leadId}`);
    }
  };

  // Webinar call session operations
  const handleCreateOrUpdateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webinarTitleText.trim()) {
      alert('Please enter a session title');
      return;
    }
    if (!webinarDate) {
      alert('Please select date and time');
      return;
    }

    try {
      const sessionData = {
        title: webinarTitleText.trim(),
        facultyId: user?.id || 'marketing-host',
        facultyName: webinarSpeaker.trim() || user?.name || 'Lead Instructor',
        scheduledFor: new Date(webinarDate).toISOString(),
        type: 'webinar',
        description: webinarDescription.trim(),
        updatedAt: new Date().toISOString()
      };

      if (editingWebinarId) {
        await updateDoc(doc(db, 'live_sessions', editingWebinarId), sessionData);
        alert('Webinar session updated successfully!');
      } else {
        const roomId = `Webinar-${Math.random().toString(36).substring(2, 10)}`;
        await addDoc(collection(db, 'live_sessions'), {
          ...sessionData,
          roomId,
          status: 'scheduled',
          createdAt: new Date().toISOString()
        });
        alert('Webinar session scheduled successfully! You can now share the live stream lobby link.');
      }

      // Reset
      setShowCreateWebinarModal(false);
      setEditingWebinarId(null);
      setWebinarTitleText('');
      setWebinarSpeaker('');
      setWebinarDate('');
      setWebinarDescription('');
    } catch (err) {
      console.error('Error saving webinar session:', err);
      alert('Error saving session: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteWebinar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webinar session?')) return;
    try {
      await deleteDoc(doc(db, 'live_sessions', id));
    } catch (err) {
      console.error('Error deleting webinar:', err);
      alert('Error deleting session');
    }
  };

  // Trigger WhatsApp Ticket Send
  const sendWhatsAppNotification = (lead: Lead) => {
    const meta = parseWebinarMeta(lead.workExperience);
    const cleanedPhone = lead.phone.replace(/[^0-9+]/g, '');
    
    const attendeeJoinedName = lead.name;
    const ticketCode = meta?.ticketId || 'WBN-GEN';
    const masterclassTitle = meta?.webinarTitle || lead.source || 'Printing & Packaging Masterclass';
    const scheduledTime = meta?.scheduledTime || webinarCustomDate;
    const modeJoined = meta?.studyMode === 'offline' ? '📍 Physical Campus Practical Lab' : '💻 Online Interactive App';

    const text = `*Hello ${attendeeJoinedName}!* 👋 \n\nWelcome to *Endless Spark School of Printing and Packaging*!\n\nYour registration for *${masterclassTitle}* is confirmed! 🚀\n\n📌 *Seat Details:*\n📅 Slot: *${scheduledTime}*\n🎓 Mode: *${modeJoined}*\n🎟️ Ticket Code: *${ticketCode}*\n\n_Next Steps:_\nOur companion app future details:\n- Real-time preflight inspector simulator\n- High-contrast interactive lab walkthroughs\n- Instant pre-press certification checks\n\nBest regards,\nThe Admissions Team`;

    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  // Export CSV helper
  const exportWebinarLeadsCsv = () => {
    if (filteredLeads.length === 0) return alert('No registrants to export');
    
    const headers = ['Register Date', 'Name', 'Phone', 'Email', 'City', 'Current Role', 'Topic', 'Mode', 'Ticket', 'Status'];
    const rows = filteredLeads.map(l => {
      const meta = parseWebinarMeta(l.workExperience);
      return [
        new Date(l.createdAt).toLocaleDateString(),
        `"${l.name.replace(/"/g, '""')}"`,
        l.phone,
        l.email,
        l.place || 'N/A',
        l.currentRole || 'N/A',
        `"${(meta?.webinarTitle || l.source || '').replace(/"/g, '""')}"`,
        meta?.studyMode?.toUpperCase() || 'N/A',
        meta?.ticketId || 'N/A',
        l.status.toUpperCase()
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "webinar_registrations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations for dashboard
  const totalRegistrations = leads.length;
  const onlineStudyCount = leads.filter(l => {
    const m = parseWebinarMeta(l.workExperience);
    return m ? m.studyMode === 'online' : l.source?.toLowerCase().includes('(online)');
  }).length;
  const offlineStudyCount = totalRegistrations - onlineStudyCount;

  // Filter registrations
  const filteredLeads = leads.filter(lead => {
    const meta = parseWebinarMeta(lead.workExperience);
    const mode = meta ? meta.studyMode : (lead.source?.toLowerCase().includes('(online)') ? 'online' : 'offline');
    
    const matchSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (meta && meta.ticketId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchMode = selectedModeFilter === 'all' || mode === selectedModeFilter;
    const matchStatus = selectedStatusFilter === 'all' || lead.status === selectedStatusFilter;

    return matchSearch && matchMode && matchStatus;
  });

  // Marketing templates details
  const triggerCopyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('WhatsApp marketing template copied to clipboard! Ready to paste into chat.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <span className="text-pink-600 font-extrabold text-xs uppercase tracking-widest bg-pink-50 border border-pink-100 px-3 py-1 rounded-full">
            Split Workspace
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-2.5 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-600" />
            Marketing & Webinar Hub
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage live marketing campaigns, landing page assets, and attendee leads.</p>
        </div>

        {/* Action button to open Webinar Registration live preview */}
        <a 
          href="/webinar" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Launch Landing Page</span>
        </a>
      </div>

      {/* Tabs Menu buttons */}
      <div className="flex border-b border-gray-100 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActivePanelTab('leads')}
          className={cn(
            "px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all",
            activePanelTab === 'leads' 
              ? "border-pink-600 text-pink-600" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Webinar Lead CRM ({filteredLeads.length})
        </button>
        <button
          onClick={() => setActivePanelTab('customize')}
          className={cn(
            "px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all",
            activePanelTab === 'customize' 
              ? "border-pink-600 text-pink-600" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Customizer & Logo Upload
        </button>
        <button
          onClick={() => setActivePanelTab('templates')}
          className={cn(
            "px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all",
            activePanelTab === 'templates' 
              ? "border-pink-600 text-pink-600" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          WhatsApp Share Templates
        </button>
        <button
          onClick={() => setActivePanelTab('schedules')}
          className={cn(
            "px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all",
            activePanelTab === 'schedules' 
              ? "border-pink-600 text-pink-600" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Live Call Schedules ({liveSessions.length})
        </button>
      </div>

      {/* Sub tabs rendering */}
      {activePanelTab === 'leads' && (
        <div className="space-y-6">
          
          {/* KPI Mini dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Webinar registrations</span>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{totalRegistrations}</h3>
                <p className="text-[10px] text-green-500 font-bold mt-1">● Synced with checkout landing desk</p>
              </div>
              <div className="w-12 h-12 bg-pink-50 border border-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Online App Studies</span>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{onlineStudyCount}</h3>
                <p className="text-[10px] text-pink-500 font-bold mt-1">
                  {totalRegistrations > 0 ? `${Math.round((onlineStudyCount / totalRegistrations) * 100)}%` : '0%'} Preference
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Laptop className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Physical Labs Seats</span>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{offlineStudyCount}</h3>
                <p className="text-[10px] text-indigo-500 font-bold mt-1">
                  {totalRegistrations > 0 ? `${Math.round((offlineStudyCount / totalRegistrations) * 100)}%` : '0%'} Preference
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket code, email, name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  className="bg-transparent border-none text-[11px] font-bold text-gray-700 focus:outline-none cursor-pointer"
                  value={selectedModeFilter}
                  onChange={(e) => setSelectedModeFilter(e.target.value)}
                >
                  <option value="all">All Study Preference</option>
                  <option value="online">Online Companion App</option>
                  <option value="offline">Offline Labs Seat</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-xl">
                <select
                  className="bg-transparent border-none text-[11px] font-bold text-gray-700 focus:outline-none cursor-pointer"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="all">All Lead Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="willing">Willing to Join</option>
                  <option value="not_interested">Not Interested</option>
                </select>
              </div>

              <button
                onClick={exportWebinarLeadsCsv}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-white font-bold py-2 px-3 rounded-xl text-[11px] transition-all ml-auto md:ml-0 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Registrations List table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stamp & Ticket</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attendee Info</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Selected Webinar Course</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assoc. Preference</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lead Status</th>
                    <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {filteredLeads.map((lead) => {
                    const meta = parseWebinarMeta(lead.workExperience);
                    const modePreference = meta ? meta.studyMode : (lead.source?.toLowerCase().includes('(online)') ? 'online' : 'offline');
                    const courseTitleParsed = meta ? meta.webinarTitle : (lead.source || '').replace('Webinar: ', '');
                    
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 space-y-1">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                            {meta?.ticketId || 'WBN-GEN'}
                          </span>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>

                        <td className="p-4 space-y-1">
                          <p className="font-bold text-slate-900">{lead.name}</p>
                          <p className="text-[10px] text-gray-500">{lead.email}</p>
                          <p className="text-[10px] font-semibold text-pink-600 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {lead.phone}
                          </p>
                        </td>

                        <td className="p-4 max-w-[220px]">
                          <p className="font-bold text-blue-950 uppercase tracking-tight text-[10px] leading-snug">
                            {courseTitleParsed}
                          </p>
                          {lead.place && <span className="inline-block mt-1 text-[8px] bg-slate-100 text-slate-600 font-bold px-1 rounded uppercase">{lead.place}</span>}
                        </td>

                        <td className="p-4">
                          {modePreference === 'online' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-pink-100 text-pink-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wide border border-pink-200">
                              <Laptop className="w-2.5 h-2.5" />
                              Online App Preference
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-100 text-indigo-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wide border border-indigo-200">
                              <MapPin className="w-2.5 h-2.5" />
                              Offline Labs Preference
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <select
                            className={`text-[10px] font-bold rounded-lg border p-1 focus:outline-none transition-all cursor-pointer ${
                              lead.status === 'new' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              lead.status === 'contacted' ? 'bg-sky-50 border-sky-200 text-sky-700' :
                              lead.status === 'willing' ? 'bg-violet-50 border-violet-200 text-violet-700' :
                              'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="willing">Willing to Join</option>
                            <option value="not_interested">Not Interested</option>
                          </select>
                        </td>

                        <td className="p-4 text-right space-y-1">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => sendWhatsAppNotification(lead)}
                              className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 flex items-center text-[10px] font-black transition-transform active:scale-95 cursor-pointer shadow-sm shadow-emerald-700/20"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Notify</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveNoteLeadId(lead.id);
                                setNewNoteText('');
                              }}
                              className="p-1 px-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Log Call</span>
                            </button>
                            
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1 px-2 border border-rose-150 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {lead.notes && lead.notes.length > 0 && (
                            <p className="text-[9px] text-gray-400 italic max-w-[200px] truncate ml-auto">
                              Last Call: "{lead.notes[lead.notes.length - 1].text}"
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 bg-gray-50/50">
                        <Video className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-bold text-gray-600">No leads registered matching criteria.</p>
                        <p className="text-xs text-gray-400 mt-1">Lead codes will generate on dynamic registrations form.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activePanelTab === 'customize' && (
        <form onSubmit={handleSaveBranding} className="space-y-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-4xl">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-pink-600" />
              Landing Page Assets & Customizer
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">Maintain global school branding and live webinar slots settings instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Logo Configuration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Global Banner/Logo Url</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs flex-1 focus:ring-2 focus:ring-pink-500"
                  value={logoInputUrl}
                  onChange={(e) => setLogoInputUrl(e.target.value)}
                />
                {logoInputUrl && (
                  <div className="w-11 h-11 border border-gray-200 bg-white rounded-xl flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <img src={logoInputUrl} alt="Logo preview" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400">If your logo is currently blank or invisible, copy-paste your valid file URL here and hit save.</p>
            </div>

            {/* Campaign Header Title Banner */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Campaign Title Image Url</label>
              <input
                type="text"
                placeholder="https://example.com/title_banner.png"
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500"
                value={titleImageInputUrl}
                onChange={(e) => setTitleImageInputUrl(e.target.value)}
              />
              <p className="text-[10px] text-gray-400">Specify an optional display heading graphic for high-profile masterclass landing sheets.</p>
            </div>

            {/* Target Webinar Details */}
            <div className="space-y-4 md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Calendar className="w-4 h-4 text-pink-600" />
                Live Webinar Event Scheduling Parameters
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 block uppercase">Webinar Master Theme Title</label>
                  <input
                    type="text"
                    required
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500"
                    value={webinarCustomTitle}
                    onChange={(e) => setWebinarCustomTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 block uppercase">Target Scheduled Session Date</label>
                  <input
                    type="text"
                    required
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500"
                    placeholder="E.g. Sunday, July 15"
                    value={webinarCustomDate}
                    onChange={(e) => setWebinarCustomDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 block uppercase">Webinar Scheduled Time (IST)</label>
                  <input
                    type="text"
                    required
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500"
                    placeholder="11:00 AM - 12:30 PM (IST)"
                    value={webinarCustomTime}
                    onChange={(e) => setWebinarCustomTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 block uppercase">Webinar Instructor Name</label>
                  <input
                    type="text"
                    required
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500"
                    placeholder="E.g. Prof. Anand Nair"
                    value={webinarInstructorName}
                    onChange={(e) => setWebinarInstructorName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 block uppercase">Webinar Instructor Role/Title</label>
                  <input
                    type="text"
                    required
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500"
                    placeholder="E.g. Packaging Tech Lead"
                    value={webinarInstructorRole}
                    onChange={(e) => setWebinarInstructorRole(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic app future points - How our app helps to learn online */}
            <div className="space-y-4 md:col-span-2 bg-pink-50/50 p-5 rounded-2xl border border-pink-100/50">
              <h4 className="text-xs font-extrabold text-pink-900 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-600 animate-pulse" />
                Differentiate Online Learning (Dynamic App Features)
              </h4>
              <p className="text-[10px] text-pink-700 leading-snug">
                These core advantages explain how our custom app companion features help candidates learn printing & media engineering online successfully.
              </p>

              <div className="space-y-2">
                {appBenefits.map((point, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-white p-2.5 rounded-xl border border-pink-100 text-[11px] gap-2">
                    <span className="text-gray-700 leading-relaxed font-medium">● {point}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAppBenefit(idx)}
                      className="text-rose-500 hover:text-rose-700 text-[10px] font-extrabold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a stellar point about companion app features..."
                  className="p-2.5 bg-white border border-gray-200 rounded-xl outline-none text-xs flex-1 focus:ring-2 focus:ring-pink-500"
                  value={newBenefitText}
                  onChange={(e) => setNewBenefitText(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddAppBenefit}
                  className="bg-pink-600 text-white font-bold text-xs px-4 rounded-xl hover:bg-pink-700 transition"
                >
                  Add Benefit Point
                </button>
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={isSavingBranding}
            className="w-full bg-slate-900 text-white text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition active:scale-95"
          >
            {isSavingBranding ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Real-Time Changes'}
          </button>
        </form>
      )}

      {activePanelTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          
          {/* Template Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded uppercase font-black tracking-widest">
              Direct Invite Template (Sales Oriented)
            </span>
            <h4 className="font-extrabold text-[#0D0D0D] text-sm leading-tight">Masterclass Seat Allocation Trigger</h4>
            <div className="bg-slate-50 p-4 rounded-2xl font-mono text-[10px] text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
{`*Endless Spark School Admission Invitation!* 👋 

Hello [Name]! 

Congratulations, your live webcast pass for *${webinarCustomTitle}* is ready.

🗓️ Batch Date: *${webinarCustomDate}*
⏰ Live Stream: *${webinarCustomTime}*
🎟️ Secure ticket: *[TicketID]*

💡 *How our customized app environment helps you learn online:*
- Visual preflight simulator directly inside your browser
- Instant offset digital production color matching tool
- Daily technical puzzles and pre-press validation checklist

Reply with "YES" to schedule your live app setup walkthrough with our specialists.`}
            </div>
            
            <button
              onClick={() => triggerCopyTemplate(`*Endless Spark School Admission Invitation!* 👋 \n\nHello [Name]!\n\nCongratulations, your live webcast pass for *${webinarCustomTitle}* is ready.\n\n🗓️ Batch Date: *${webinarCustomDate}*\n⏰ Live Stream: *${webinarCustomTime}*\n🎟️ Secure ticket: *[TicketCode]*\n\n💡 *How our customized app environment helps you learn online:*\n- Visual preflight simulator directly inside your browser\n- Instant offset digital production color matching tool\n- Daily technical puzzles and pre-press validation checklist\n\nReply with "YES" to schedule your live app setup walkthrough with our specialists.`)}
              className="w-full bg-slate-950 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-850 transition duration-300 flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Template Copy</span>
            </button>
          </div>

          {/* Template Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <span className="text-[9px] bg-indigo-50 text-indigo-850 border border-indigo-100 px-2 py-0.5 rounded uppercase font-black tracking-widest">
              Follow-up Advantage Template (Technical Oriented)
            </span>
            <h4 className="font-extrabold text-[#0D0D0D] text-sm leading-tight">App-Based Hybrid Digital Learning Benefits</h4>
            <div className="bg-slate-50 p-4 rounded-2xl font-mono text-[10px] text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
{`*Learn Printing & Packaging Engineering remotely* 🚀

Our school companion app replaces dry theory with live engineering action:

1. *Interactive Lab walkthroughs* — Master pre-press layout prep visually on any mobile screen.
2. *Real-time digital audits* — Submit work files directly inside of our preflight tracker.
3. *Expert Pre-Press guidance* — Access live Q&As whenever you encounter production blockers.

Join the admission webinar on *${webinarCustomDate}* to explore these tools in action!`}
            </div>

            <button
              onClick={() => triggerCopyTemplate(`*Learn Printing & Packaging Engineering remotely* 🚀\n\nOur school companion app replaces dry theory with live engineering action:\n\n1. *Interactive Lab walkthroughs* — Master pre-press layout prep visually on any mobile screen.\n2. *Real-time digital audits* — Submit work files directly inside of our preflight tracker.\n3. *Expert Pre-Press guidance* — Access live Q&As whenever you encounter production blockers.\n\nJoin the admission webinar on *${webinarCustomDate}* to explore these tools in action!`)}
              className="w-full bg-slate-950 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-850 transition duration-300 flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Template Copy</span>
            </button>
          </div>

        </div>
      )}

      {activePanelTab === 'schedules' && (
        <div className="space-y-6">
          {/* Header & explanation */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-pink-600/20 text-pink-405 border border-pink-500/30 px-2.5 py-1 rounded-full uppercase font-black tracking-widest">
                <Video className="w-3.5 h-3.5 text-pink-500" />
                Live Webinar Webcasting Centre
              </span>
              <h3 className="text-xl font-bold mt-2">Webinar Live Call Scheduler</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-xl">
                Maintain and schedule premium interactive classrooms. Attendees are able to connect and stream with zero app-download blocks on Windows, macOS, Android mobile phones, and Apple iPhones natively!
              </p>
            </div>
            <button
              onClick={() => {
                setEditingWebinarId(null);
                setWebinarTitleText('');
                setWebinarSpeaker('');
                setWebinarDate('');
                setWebinarDescription('');
                setShowCreateWebinarModal(true);
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition duration-200 flex items-center gap-1.5 shadow-md shadow-pink-600/10 shrink-0 self-stretch md:self-auto justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Live Webinar</span>
            </button>
          </div>

          {/* Quick FAQ / Technical specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-[#0D0D0D] text-xs uppercase tracking-wider mb-1">🖥️ Windows & macOS Desktop</h4>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Attendees join perfectly using browsers like Google Chrome, MS Edge, or Apple Safari. Sharing screen and high-resolution digital color match demos are supported at 1080p speed.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-[#0D0D0D] text-xs uppercase tracking-wider mb-1">📱 Android & Apple iOS Safari</h4>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  100% responsive join screens are optimized for handheld screens. Users are NOT required to download secondary ZIP or Zoom apps. Simply click and launch directly.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-[#0D0D0D] text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                  👥 Real-Time Attendee Tracking
                </h4>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  To view the exact headcount and who has joined, host and presenters can tap the <strong>Participants/People</strong> button on the bottom menu within the live virtual room.
                </p>
              </div>
            </div>
          </div>

          {/* List of Scheduled Webinars */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-150 flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest">Active Webinar Schedules ({liveSessions.length})</h4>
              <p className="text-[10px] text-gray-400">All rooms utilize highly encrypted virtual classrooms</p>
            </div>

            <div className="divide-y divide-gray-100">
              {liveSessions.map((session) => {
                const isLive = session.status === 'live';
                const isCompleted = session.status === 'completed';
                const shareText = `*Webinar Invitation: ${session.title}* 🚀\n\nJoin our live masterclass stream guided by presenter *${session.facultyName}*!\n\n📅 Date/Time: *${new Date(session.scheduledFor).toLocaleString()}*\n💻 Access Live Room directly (Zero Install): ${window.location.origin}/classroom/${session.roomId}\n\nSupported on all Windows, macOS, Android, and iOS Safari screens! Join us!`;

                return (
                  <div key={session.id} className="p-6 hover:bg-gray-50/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 text-[9px] bg-rose-50 text-rose-700 font-extrabold px-2.5 py-1 rounded-full border border-rose-200 uppercase tracking-widest animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-600 block animate-ping"></span>
                            Live Broadcast Active
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 text-[9px] bg-gray-100 text-gray-600 font-bold px-2.5 py-0.5 rounded-full border border-gray-200 uppercase tracking-widest">
                            Completed & Saved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[9px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-widest">
                            Scheduled Event
                          </span>
                        )}
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                          Room ID: {session.roomId}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 leading-snug">{session.title}</h4>
                        {session.description && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xl italic">"{session.description}"</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Users className="w-4 h-4 text-slate-400" />
                          Presenter: <strong className="text-slate-800">{session.facultyName}</strong>
                        </span>
                        <span className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-4 h-4 text-slate-400" />
                          Time: <strong className="text-slate-805">{new Date(session.scheduledFor).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0">
                      {/* Copy Invite Link */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareText);
                          alert('Masterclass invite copy formatted and sent to clipboard!');
                        }}
                        className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copy Invitation details"
                      >
                        <Copy className="w-3.5 h-3.5 text-pink-600" />
                        <span>Copy Attendee Invite</span>
                      </button>

                      {/* Launch Admin / Host virtual room */}
                      <button
                        onClick={async () => {
                          if (!isLive && !isCompleted) {
                            try {
                              await updateDoc(doc(db, 'live_sessions', session.id), { status: 'live' });
                            } catch (e) {
                              console.error(e);
                            }
                          }
                          window.open(`/classroom/${session.roomId}`, '_blank');
                        }}
                        className={cn(
                          "p-2 text-white font-bold text-xs px-3.5 rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm",
                          isLive 
                            ? "bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200" 
                            : "bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-100"
                        )}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isLive ? 'Rejoin Broadcast' : 'Launch Live Webcast'}</span>
                      </button>

                      {/* mark complete button */}
                      {!isCompleted && (
                        <button
                          onClick={async () => {
                            if (confirm('Mark this webinar stream as completed? This resets the visible status badge.')) {
                              try {
                                await updateDoc(doc(db, 'live_sessions', session.id), { status: 'completed' });
                              } catch (e) {
                                console.error(e);
                              }
                            }
                          }}
                          className="p-2 border border-emerald-250 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                          title="Finish class session"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Close Session</span>
                        </button>
                      )}

                      {/* Edit option */}
                      <button
                        onClick={() => {
                          setEditingWebinarId(session.id);
                          setWebinarTitleText(session.title);
                          setWebinarSpeaker(session.facultyName);
                          try {
                            const dateObj = new Date(session.scheduledFor);
                            const pad = (num: number) => String(num).padStart(2, '0');
                            const formatted = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
                            setWebinarDate(formatted);
                          } catch (err) {
                            setWebinarDate('');
                          }
                          setWebinarDescription(session.description || '');
                          setShowCreateWebinarModal(true);
                        }}
                        className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl cursor-pointer"
                        title="Edit properties"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteWebinar(session.id)}
                        className="p-2 border border-rose-150 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Delete webinar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {liveSessions.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Video className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-600">No live webinars scheduled yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Tap 'Schedule Live Webinar' to schedule and broadcast calls natively.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule / Edit Webinar Modal */}
      {showCreateWebinarModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 pb-3 border-b">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{editingWebinarId ? 'Modify Webinar Settings' : 'Schedule Live Webinar Session'}</h4>
                <p className="text-xs text-gray-400 mt-0.5">Integrates directly with the school's virtual classroom platform.</p>
              </div>
              <button
                onClick={() => setShowCreateWebinarModal(false)}
                className="w-8 h-8 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-extrabold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateWebinar} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block">Webinar broadcast Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Masterclass on Pre-press Offset Proofing"
                  className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500 font-bold"
                  value={webinarTitleText}
                  onChange={(e) => setWebinarTitleText(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block">Lead Speaker / Instructor Name</label>
                <input
                  type="text"
                  placeholder="E.g., Prof. Rajesh Nair"
                  className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500 font-bold"
                  value={webinarSpeaker}
                  onChange={(e) => setWebinarSpeaker(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500 font-bold"
                  value={webinarDate}
                  onChange={(e) => setWebinarDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest block">Internal Details / Summary (Optional)</label>
                <textarea
                  placeholder="What will represent this live event theme..."
                  rows={3}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs w-full focus:ring-2 focus:ring-pink-500"
                  value={webinarDescription}
                  onChange={(e) => setWebinarDescription(e.target.value)}
                />
              </div>

              <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-[11px] leading-relaxed">
                <strong>👉 Platform Capability:</strong> Your scheduled webinar acts like a real digital web broadcasting station with no participant count blocks. Ideal for sharing mock layouts or pre-press puzzles live with leads!
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateWebinarModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-pink-600/10 cursor-pointer"
                >
                  {editingWebinarId ? 'Save Changes' : 'Publish & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-in Notes Drawer Dialog */}
      {activeNoteLeadId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Interaction History & Contact Log</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Attendee: {leads.find(l => l.id === activeNoteLeadId)?.name}</p>
              </div>
              <button
                onClick={() => setActiveNoteLeadId(null)}
                className="w-7 h-7 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-450 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Note logs list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
              {leads.find(l => l.id === activeNoteLeadId)?.notes?.map((n) => (
                <div key={n.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold">{n.authorName}</span>
                    <span>{new Date(n.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-750 text-xs leading-relaxed">{n.text}</p>
                </div>
              ))}

              {(!leads.find(l => l.id === activeNoteLeadId)?.notes || leads.find(l => l.id === activeNoteLeadId)?.notes?.length === 0) && (
                <p className="text-center py-6 text-gray-400 text-xs italic">No follow-up action logs registered yet.</p>
              )}
            </div>

            {/* Write-up form */}
            <div className="space-y-3">
              <textarea
                placeholder="Log a call or add internal notes..."
                rows={3}
                className="w-full text-xs p-3 border border-gray-200 outline-none rounded-2xl focus:ring-2 focus:ring-pink-500"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
              />
              <button
                onClick={() => handleAddNote(activeNoteLeadId, leads.find(l => l.id === activeNoteLeadId)?.notes)}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition duration-200 text-center"
              >
                Log Contact History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
