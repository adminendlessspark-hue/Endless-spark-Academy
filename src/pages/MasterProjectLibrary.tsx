import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Search, Download, Filter, BookOpen, FolderKanban, Copy, Globe, Info } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function MasterProjectLibrary() {
  const { user, isAdmin, isElevated } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [permissionModal, setPermissionModal] = useState<{
    isOpen: boolean;
    clientEmail: string;
    url: string;
  }>({
    isOpen: false,
    clientEmail: '',
    url: ''
  });
  const [copied, setCopied] = useState(false);

  const STATIC_COURSES = [
    { id: 'packaging-engineer', title: 'Packaging Engineer' },
    { id: 'production-art-engineer', title: 'Production Art Engineer' },
    { id: 'print-ready-engineer', title: 'Print Ready Engineer' },
    { id: 'plate-ready-engineer', title: 'Plate Ready Engineer' },
    { id: 'colour-retouching-engineer', title: 'Colour Retouching Engineer' },
    { id: 'quality-control-engineer', title: 'Quality Control Engineer' },
    { id: 'printing-and-packaging-cross-courses', title: 'Printing & Packaging Cross Courses' }
  ];

  const isFaculty = user?.role === 'faculty';
  const canManage = isAdmin || isElevated || isFaculty;

  useEffect(() => {
    // Load master projects
    const unsubMaster = onSnapshot(collection(db, 'master_projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => {
      console.warn("Could not fetch master projects from Firestore:", err.message);
      setProjects([]);
    });

    if (user?.role === 'student') {
      const userCourses = user.assignedCourses || (user.assignedCourse ? [user.assignedCourse] : []);
      const filteredCourses = STATIC_COURSES.filter(c => (userCourses as string[]).includes(c.id));
      setCourses(filteredCourses);
      if (filteredCourses.length === 1) {
        setSelectedCourse(filteredCourses[0].id);
      } else {
        setSelectedCourse('all');
      }
    } else {
      setCourses(STATIC_COURSES);
      setSelectedCourse('all');
    }

    return () => unsubMaster();
  }, [user]);

  const handleDownload = async (projectId: string, url: string, title: string) => {
    // If we have a projectId, we can rely entirely on it for secure download.
    // If not, we can fallback to the url if available.
    
    // Auto-share Google Drive link with student as writer silently so they don't get request access prompts
    if (url && url.includes('drive.google.com') && user?.role === 'student' && user?.email) {
      try {
        await fetch('/api/share-drive-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driveUrl: url, studentEmail: user.email, role: 'writer' })
        });
      } catch (e) {
        console.error("Auto-share master project error:", e);
      }
    }

    try {
      let downloadName = title || 'master-project';
      if (!downloadName.toLowerCase().endsWith('.zip') && !downloadName.toLowerCase().endsWith('.pdf') && !downloadName.toLowerCase().endsWith('.ai') && !downloadName.toLowerCase().endsWith('.psd')) {
        downloadName = `${downloadName}.zip`;
      }

      // Secure URL construction using projectId to avoid exposing raw drive link
      let proxiedUrl = `/api/download?projectId=${encodeURIComponent(projectId)}&title=${encodeURIComponent(downloadName)}`;
      if (!projectId && url) {
        const cleanUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
        proxiedUrl = `/api/download?url=${encodeURIComponent(cleanUrl)}&title=${encodeURIComponent(downloadName)}`;
      }
      
      console.log('Downloading master project via secure proxy:', proxiedUrl);
      
      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        let errorMessage = 'Proxy download failed';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
            if (errorData.isPermissionIssue) {
              setPermissionModal({
                isOpen: true,
                clientEmail: errorData.clientEmail,
                url: url || ''
              });
              return;
            }
          }
        } catch (e) {
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch (textErr) {}
        }
        throw new Error(errorMessage);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error('Download failed:', error);
      if (canManage && url) {
        window.open(url, '_blank');
      } else {
        alert(error.message || 'Download failed. Please contact your instructor or administrator.');
      }
    }
  };

  const filteredProjects = projects.filter(item => {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Master Project Library</h1>
              <p className="text-gray-500">Access high-quality master projects for study and reference.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
              />
            </div>
            
            {courses.length > 1 && (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title || course.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-bold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>Click <strong>Download</strong> to automatically download project assets and documents directly as a ZIP file.</li>
              <li>All project materials are bundled automatically so you can immediately begin working on your local machine.</li>
              <li>Source files are secured as read-only templates to ensure they remain pristine for all students.</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(item => (
            <div key={item.id} className="group relative bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-pink-50 transition-all border-b-4 border-b-transparent hover:border-b-pink-500">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
                  <FolderKanban className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-wider">
                    Master Project
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                  <BookOpen className="w-3 h-3" />
                  {courses.find(c => c.id === item.courseId)?.title || 'General'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(item.id, item.googleDriveLink || item.fileUrl, item.title)}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl text-xs font-bold hover:bg-pink-600 hover:text-white transition-all transform active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  {canManage && (
                    <button
                      onClick={() => {
                        const url = item.googleDriveLink || item.fileUrl || '';
                        navigator.clipboard.writeText(url);
                        alert('Link copied to clipboard!');
                      }}
                      className="p-2 text-pink-600 hover:bg-pink-50 rounded-xl transition-all"
                      title="Copy Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold">No master projects found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Permission Guide Modal */}
      {permissionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-pink-600">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Google Drive Permission Required</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              To bundle and download this project on <strong>Autopilot</strong> as a ZIP file, the system's service account needs view/edit access to the source Google Drive file or folder.
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
              <p className="text-xs text-slate-500 mb-1 font-bold">System Service Account Email:</p>
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100">
                <code className="text-[11px] text-pink-600 font-mono select-all break-all pr-2">
                  {permissionModal.clientEmail}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(permissionModal.clientEmail);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold hover:bg-pink-600 hover:text-white transition-all whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="space-y-2.5 mb-6 text-xs text-gray-500">
              <p className="font-bold text-gray-700">How to grant permission (On-The-Fly):</p>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                <span>Open the Google Drive link using the button below.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                <span>Click the <strong>"Share"</strong> button in the top right corner.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                <span>Add the system email above as <strong>"Viewer"</strong> (or Editor) and click <strong>"Send"</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 font-bold text-[10px]">4</span>
                <span>Once shared, return here and click <strong>"Download"</strong> again to bundle the files!</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              {permissionModal.url && (
                <a
                  href={permissionModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2.5 bg-pink-600 text-white font-bold rounded-xl text-xs hover:bg-pink-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Open Google Drive
                </a>
              )}
              <button
                onClick={() => setPermissionModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
