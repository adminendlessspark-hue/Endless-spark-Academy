import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db, storage, auth, handleFirestoreError, OperationType } from '../firebase';
import { FileText, Search, Plus, Trash2, Download, Filter, BookOpen, Clock, FolderKanban, Copy, Info, Upload, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils';
import { useAuth } from '../AuthContext';
import { FileUploader } from '../components/FileUploader';
import { GoogleGenAI } from '@google/genai';
import { generateGeminiContent } from '../services/gemini';

export default function ProjectTemplateLibrary() {
  const { user, isAdmin, isElevated } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    courseId: '',
    fileUrl: '',
    description: '',
    category: 'Basic'
  });

  const isFaculty = user?.role === 'faculty';
  const canManage = isAdmin || isElevated || isFaculty;

  const STATIC_COURSES = [
    { id: 'packaging-engineer', title: 'Packaging Engineer' },
    { id: 'production-art-engineer', title: 'Production Art Engineer' },
    { id: 'print-ready-engineer', title: 'Print Ready Engineer' },
    { id: 'plate-ready-engineer', title: 'Plate Ready Engineer' },
    { id: 'colour-retouching-engineer', title: 'Colour Retouching Engineer' },
    { id: 'quality-control-engineer', title: 'Quality Control Engineer' },
    { id: 'printing-and-packaging-cross-courses', title: 'Printing & Packaging Cross Courses' }
  ];

  useEffect(() => {
    // Load templates
    const unsubTemplates = onSnapshot(collection(db, 'project_templates'), (snapshot) => {
      setTemplates(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => {
      console.warn("Could not fetch project templates from Firestore:", err.message);
      setTemplates([]); 
    });

    // Use static courses for now to avoid permission issues with a common collection
    setCourses(STATIC_COURSES);

    return () => {
      unsubTemplates();
    };
  }, []);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCourseData = courses.find(c => c.id === form.courseId);
      await addDoc(collection(db, 'project_templates'), {
        ...form,
        courseName: selectedCourseData?.title || selectedCourseData?.name || 'General',
        createdAt: new Date().toISOString(),
        createdBy: user?.id || 'Unknown'
      });
      setForm({ title: '', courseId: '', fileUrl: '', description: '', category: 'Basic' });
      setIsModalOpen(false);
      alert('Template added successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'project_templates');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    console.log('Attempting to delete template:', {
      id,
      userRole: user?.role,
      userEmail: user?.email,
      isAdmin,
      isElevated,
      canManage
    });
    
    // Custom confirmation logic to avoid window.confirm blocking in iframe
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000); // Reset after 3 seconds
      return;
    }

    try {
      await deleteDoc(doc(db, 'project_templates', id));
      console.log('Successfully deleted template:', id);
      setDeletingId(null);
      alert('Template deleted successfully!');
    } catch (err: any) {
      console.error('Delete error for ID:', id, err);
      // More descriptive error for the user
      const errorMessage = err.message || 'Unknown error';
      if (errorMessage.includes('Insufficient permissions')) {
        alert('Delete failed: You do not have permission to delete this template. Check your role.');
      } else {
        alert('Delete failed: ' + errorMessage);
      }
      handleFirestoreError(err, OperationType.DELETE, `project_templates/${id}`);
    }
  };

  const handleDownload = async (url: string, title: string) => {
    try {
      // Auto-share Google Drive link with student as writer silently so they don't get request access prompts
      if (url.includes('drive.google.com') && user?.role === 'student' && user?.email) {
        try {
          await fetch('/api/share-drive-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driveUrl: url, studentEmail: user.email, role: 'writer' })
          });
        } catch (e) {
          console.error("Auto-share template error:", e);
        }
      }

      // Use the server-side proxy to bypass CORS and about:blank#blocked
      const proxiedUrl = `/api/download?url=${encodeURIComponent(url)}`;
      console.log('Downloading via proxy:', proxiedUrl);
      
      const response = await fetch(proxiedUrl);
      if (!response.ok) throw new Error('Proxy download failed');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = title || 'template';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: Try opening in a new tab if proxy fails
      window.open(url, '_blank');
    }
  };

  const filteredTemplates = templates.filter(item => {
    const title = item.title || '';
    const description = item.description || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCourse = selectedCourse === 'all' || item.courseId === selectedCourse;
    
    // For students, check if assigned to course
    let isAssigned = true;
    if (user?.role === 'student') {
      const userCourses = user.assignedCourses || (user.assignedCourse ? [user.assignedCourse] : []);
      isAssigned = userCourses.includes(item.courseId);
    }

    return matchesSearch && matchesCourse && isAssigned;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
              <p className="text-gray-500">Download course materials and software templates.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title || course.name}</option>
              ))}
            </select>

            {canManage && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Template
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(item => (
            <div key={item.id} className="group relative bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-indigo-50 transition-all border-b-4 border-b-transparent hover:border-b-indigo-500">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                {canManage && (
                  <button 
                    onClick={() => handleDeleteTemplate(item.id)}
                    className={`p-2 rounded-xl transition-all flex items-center gap-1 ${
                      deletingId === item.id 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title={deletingId === item.id ? "Click again to confirm delete" : "Delete template"}
                  >
                    {deletingId === item.id ? (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold">Confirm?</span>
                      </>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
                    {item.category || 'Basic'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                  <BookOpen className="w-3 h-3" />
                  {courses.find(c => c.id === item.courseId)?.title || 'General'}
                </div>
                <button
                  onClick={() => {
                    const url = item.fileUrl || '';
                    if (!url) return alert('No file link available');
                    handleDownload(url.match(/^https?:\/\//i) ? url : `https://${url}`, item.title);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                {canManage && (
                  <button
                    onClick={() => {
                      const url = item.fileUrl || '';
                      navigator.clipboard.writeText(url);
                      alert('Link copied to clipboard!');
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold">No templates found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Add New Template
              </h2>
              
              <form onSubmit={handleAddTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Template Title</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Master Brochure Template"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Assign Course</label>
                <select
                  required
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title || course.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Master">Master</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-indigo-400" /> Link to Resource
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      required
                      type="text"
                      value={form.fileUrl}
                      onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                      placeholder="Paste link or upload below..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                    />
                  </div>
                  
                  <FileUploader 
                    path="project_templates"
                    onUploadComplete={(url) => {
                      setForm({ ...form, fileUrl: url });
                    }}
                    className="mb-2"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Upload a file or share a Google Drive/Dropbox link.</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Description</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!form.description) return alert('Enter base description first');
                      try {
                        const prompt = `Enhance this project template description for a course library: ${form.description}`;
                        const response = await generateGeminiContent({
                          model: "gemini-3-flash-preview",
                          contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        });
                        if (response.text) setForm({ ...form, description: response.text });
                      } catch (e: any) {
                        const msg = (e?.message || '').toLowerCase();
                        if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
                          alert('Access Denied (403/Forbidden). Please ensure your Gemini API key is correctly set in Settings > Secrets. You may need to select a billing-enabled key for some features.');
                        } else {
                          alert(`AI Enhancement failed: ${e.message || 'Unknown error'}. Check your API key.`);
                        }
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Enhance
                  </button>
                </div>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this template for?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!form.fileUrl}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Template
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    )}
    </div>
  );
}
