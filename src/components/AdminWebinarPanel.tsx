import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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
  UserCheck,
  Award,
  Filter,
  Plus
} from 'lucide-react';

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

export default function AdminWebinarPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  
  // Note creation state
  const [activeNoteLeadId, setActiveNoteLeadId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Subscribe to all CRM leads
  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLeads = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      })) as Lead[];
      
      // Filter only webinar leads
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

  // Parse custom metadata saved under lead.workExperience
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
      // Not a JSON metadata string, return fallback info
    }
    return null;
  };

  // Quick Action: Update Status
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

  // Add a history / validation note
  const handleAddNote = async (leadId: string, existingNotes: Note[] = []) => {
    if (!newNoteText.trim()) return;
    try {
      const updatedNotes = [
        ...existingNotes,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          text: newNoteText,
          authorId: 'admin',
          authorName: 'Administrator'
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

  // Trigger WhatsApp Quick Notification Link
  const sendWhatsAppNotification = (lead: Lead) => {
    const meta = parseWebinarMeta(lead.workExperience);
    const cleanedPhone = lead.phone.replace(/[^0-9+]/g, '');
    
    const attendeeJoinedName = lead.name;
    const ticketCode = meta?.ticketId || 'WBN-GEN';
    const masterclassTitle = meta?.webinarTitle || lead.source || 'Printing & Packaging Masterclass';
    const scheduledTime = meta?.scheduledTime || 'Upcoming Batch';
    const modeJoined = meta?.studyMode === 'offline' ? '📍 Physical Campus Practical Lab' : '💻 Online Interactive App';

    const text = `*Hello ${attendeeJoinedName}!* 👋 \n\nWelcome to *Endless Spark School of Printing and Packaging*!\n\nYour registration for *${masterclassTitle}* is confirmed! 🚀\n\n📌 *Seat Details:*\n📅 Slot: *${scheduledTime}*\n🎓 Mode: *${modeJoined}*\n🎟️ Ticket Code: *${ticketCode}*\n\n_Next Steps:_\nOur team will share the webinar link & student app setup shortly. Get ready for live hands-on walkthroughs!\n\n📞 For queries, contact us on Call / WhatsApp: *+91 90428 21999*\n\nBest regards,\nThe Admissions Team`;

    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to remove this webinar registration?')) return;
    try {
      await deleteDoc(doc(db, 'leads', leadId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leads/${leadId}`);
    }
  };

  // Calculations for KPI Cards
  const totalRegistrations = leads.length;
  const onlineStudyCount = leads.filter(l => {
    const m = parseWebinarMeta(l.workExperience);
    return m ? m.studyMode === 'online' : l.source?.toLowerCase().includes('(online)');
  }).length;
  const offlineStudyCount = totalRegistrations - onlineStudyCount;
  
  const statusCounts = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    willing: leads.filter(l => l.status === 'willing').length,
    not_interested: leads.filter(l => l.status === 'not_interested').length,
  };

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const meta = parseWebinarMeta(lead.workExperience);
    const mode = meta ? meta.studyMode : (lead.source?.toLowerCase().includes('(online)') ? 'online' : 'offline');
    const title = meta ? meta.webinarTitle : (lead.source || '');
    
    // Search query
    const matchSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (meta && meta.ticketId.toLowerCase().includes(searchQuery.toLowerCase()));

    // Course filter
    const matchCourse = selectedCourseFilter === 'all' || title.toLowerCase().includes(selectedCourseFilter.toLowerCase());

    // Mode filter
    const matchMode = selectedModeFilter === 'all' || mode === selectedModeFilter;

    // Status filter
    const matchStatus = selectedStatusFilter === 'all' || lead.status === selectedStatusFilter;

    return matchSearch && matchCourse && matchMode && matchStatus;
  });

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

  return (
    <div className="space-y-6">
      
      {/* KPI Cards section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Registrants</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{totalRegistrations}</h3>
            <p className="text-[10px] text-green-500 font-bold mt-1">▲ From integrated page</p>
          </div>
          <div className="w-12 h-12 bg-pink-50 border border-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Online App Studies</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{onlineStudyCount}</h3>
            <p className="text-[10px] text-pink-500 font-bold mt-1">
              {totalRegistrations > 0 ? `${Math.round((onlineStudyCount / totalRegistrations) * 100)}%` : '0%'} Preference
            </p>
          </div>
          <div className="w-12 h-12 bg-pink-50 border border-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
            <Laptop className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Offline Lab Seats</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{offlineStudyCount}</h3>
            <p className="text-[10px] text-indigo-500 font-bold mt-1">
              {totalRegistrations > 0 ? `${Math.round((offlineStudyCount / totalRegistrations) * 100)}%` : '0%'} Preference
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Pipeline (State Distribution)</span>
          <div className="grid grid-cols-4 gap-1 mt-2 text-center">
            <div className="bg-emerald-50 rounded p-1.5 border border-emerald-100">
              <span className="text-[9px] text-emerald-800 font-bold block uppercase">New</span>
              <span className="text-xs font-black text-emerald-700">{statusCounts.new}</span>
            </div>
            <div className="bg-sky-50 rounded p-1.5 border border-sky-100">
              <span className="text-[9px] text-sky-850 font-bold block uppercase">InR</span>
              <span className="text-xs font-black text-sky-700">{statusCounts.contacted + statusCounts.willing}</span>
            </div>
            <div className="bg-rose-50 rounded p-1.5 border border-rose-100 col-span-2">
              <span className="text-[9px] text-rose-800 font-bold block uppercase">Not Int</span>
              <span className="text-xs font-black text-rose-750">{statusCounts.not_interested}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket or name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              className="bg-transparent border-none text-[11px] font-bold text-gray-700 focus:outline-none cursor-pointer"
              value={selectedModeFilter}
              onChange={(e) => setSelectedModeFilter(e.target.value)}
            >
              <option value="all">All Study Modes</option>
              <option value="online">Online Study Mode</option>
              <option value="offline">Offline Labs Mode</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-xl">
            <select
              className="bg-transparent border-none text-[11px] font-bold text-gray-700 focus:outline-none cursor-pointer"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="all">All Lead CRM Statuses</option>
              <option value="new">New / Not Contacted</option>
              <option value="contacted">Attempted / Contacted</option>
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date & Ticket</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attendee Info</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Requested Course Masterclass</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Preference</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lead Status</th>
                <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredLeads.map((lead) => {
                const meta = parseWebinarMeta(lead.workExperience);
                const modePreference = meta ? meta.studyMode : (lead.source?.toLowerCase().includes('(online)') ? 'online' : 'offline');
                const courseTitleParsed = meta ? meta.webinarTitle : (lead.source || '').replace('Webinar: ', '');
                
                return (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 space-y-1">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md border border-slate-200">
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

                    <td className="p-4 space-y-1 max-w-[240px]">
                      <p className="font-black text-gray-700 uppercase tracking-tight text-[10px] leading-snug">
                        {courseTitleParsed}
                      </p>
                      {lead.place || lead.currentRole ? (
                        <div className="flex gap-1.5 flex-wrap pt-0.5">
                          {lead.place && <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1 py-0.5 rounded uppercase">{lead.place}</span>}
                          {lead.currentRole && <span className="text-[9px] bg-pink-50 text-pink-600 font-bold px-1 py-0.5 rounded uppercase">{lead.currentRole}</span>}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-4">
                      {modePreference === 'online' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-pink-100 text-pink-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wide border border-pink-200">
                          <Laptop className="w-2.5 h-2.5" />
                          Online App
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-100 text-indigo-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wide border border-indigo-200">
                          <MapPin className="w-2.5 h-2.5" />
                          Offline Labs
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

                    <td className="p-4 text-right space-y-1.5">
                      <div className="flex justify-end gap-1.5">
                        
                        <button
                          onClick={() => sendWhatsAppNotification(lead)}
                          title="Verify and Send Instant Registration Ticket via WhatsApp"
                          className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 flex items-center text-[10px] font-black transition-transform active:scale-95 cursor-pointer shadow-sm shadow-emerald-700/20"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp Notify</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveNoteLeadId(lead.id);
                            setNewNoteText('');
                          }}
                          className="p-1 px-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Notes</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1 px-2 border border-rose-150 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                      {/* Display Latest log directly */}
                      {lead.notes && lead.notes.length > 0 && (
                        <p className="text-[10px] text-gray-400 italic max-w-[250px] truncate ml-auto">
                          Note: "{lead.notes[lead.notes.length - 1].text}"
                        </p>
                      )}
                    </td>
                  </tr>
                );
              }
              )}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 bg-gray-50/50">
                    <Video className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold">No webinar leads found matching criteria.</p>
                    <p className="text-xs text-gray-400 mt-1">Attendees will automatically populate here upon filling out /webinar registrations.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in Notes Dialog Drawer */}
      {activeNoteLeadId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Webinar Contact Log & Notes</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Attendee: {leads.find(l => l.id === activeNoteLeadId)?.name}</p>
              </div>
              <button
                onClick={() => setActiveNoteLeadId(null)}
                className="w-7 h-7 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold cursor-pointer"
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
                  <p className="text-slate-700 text-xs leading-relaxed">{n.text}</p>
                </div>
              ))}

              {(!leads.find(l => l.id === activeNoteLeadId)?.notes || leads.find(l => l.id === activeNoteLeadId)?.notes?.length === 0) && (
                <p className="text-center py-6 text-gray-400 text-xs italic">No manual notes registered for this contact yet.</p>
              )}
            </div>

            {/* New note write-up */}
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
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs cursor-pointer active:scale-95 transition-all text-center"
              >
                Save Contact Activity Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
