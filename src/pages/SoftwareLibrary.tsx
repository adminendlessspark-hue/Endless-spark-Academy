import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Video, ArrowRight, Play, X, Clock, Search, Download, BookOpen, HelpCircle, FolderKanban, Info, ExternalLink, Sparkles, Laptop, Monitor, Cpu, HardDrive, ShoppingBag } from 'lucide-react';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import { useAuth } from '../AuthContext';
import { useSettings } from '../hooks/useSettings';

export default function SoftwareLibrary() {
  const { user } = useAuth();
  const { adobeCloudUrl, pantoneBooksUrl, teamViewerUrl } = useSettings();
  const [softwareVideos, setSoftwareVideos] = useState<any[]>([]);
  const [activeSoftwareVideo, setActiveSoftwareVideo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [requirementsOs, setRequirementsOs] = useState<'windows' | 'mac'>('windows');

  useEffect(() => {
    const unsubSoftwareVideos = onSnapshot(collection(db, 'software_videos'), (snapshot) => {
      setSoftwareVideos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'software_videos'));

    return () => unsubSoftwareVideos();
  }, []);

  // Filter videos based on user's assigned courses and search query
  const filteredVideos = softwareVideos.filter(video => {
    // Search filter
    const matchesSearch = video.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.toolName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Course filter - if video has courseIds, check if user is assigned to any of them
    let matchesCourse = true;
    if (video.courseIds && video.courseIds.length > 0 && user) {
      const userCourses = user.assignedCourses || (user.assignedCourse ? [user.assignedCourse] : []);
      matchesCourse = video.courseIds.some((id: any) => userCourses.includes(id));
    }

    return matchesSearch && matchesCourse;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Required Software Setup & Installations */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Required Workstation Setup & Materials</h1>
            <p className="text-gray-500 text-sm">Once registered, please download the essential workstation software tools and purchase the physical packaging reference products before starting your modules.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Adobe Creative Cloud */}
          <div className="bg-slate-50 border border-gray-200/60 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-red-500 relative overflow-hidden group">
            <div>
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 font-bold">
                CC
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Adobe Creative Cloud</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Workstation Core: Log in to download and launch official design applications including Illustrator, Photoshop, and Acrobat.
              </p>
            </div>
            <a 
              href={adobeCloudUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-2 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              Download Installer
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Pantone Books */}
          <div className="bg-slate-50 border border-gray-200/60 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-indigo-500 relative overflow-hidden group">
            <div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Pantone Color Books</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Color Libraries: Import professional PMS color swatch libraries into your design workspace for color-accurate print verification.
              </p>
            </div>
            <a 
              href={pantoneBooksUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              Get Swatch Books
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* TeamViewer Remote Assistance */}
          <div className="bg-slate-50 border border-gray-200/60 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-sky-500 relative overflow-hidden group">
            <div>
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-4">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">TeamViewer Client</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Remote Help: Enables instant remote desktop screen-sharing with S.M.E faculty support for live guidance and troubleshooting.
              </p>
            </div>
            <a 
              href={teamViewerUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-2 w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              Download Remote Client
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Unibic Swaadesi Product Purchase Card */}
          <div className="bg-slate-50 border border-gray-200/60 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-emerald-500 relative overflow-hidden group">
            <div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Unibic Swaadesi Products</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Physical Samples: Purchase authentic Unibic Swaadesi cookie boxes to perform hands-on packaging dimensional measurement and 3D modeling tasks.
              </p>
            </div>
            <a 
              href="https://unibicestore.com/collections/swaadesi-products" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              Purchase Product Samples
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="bg-pink-50/50 rounded-2xl border border-pink-100 p-5 flex gap-4">
          <Info className="w-6 h-6 text-pink-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-pink-900">Quick Installation & Material Setup Walkthrough:</h4>
            <ol className="list-decimal list-inside text-xs text-pink-800 space-y-1.5 mt-2">
              <li>Launch the <strong>Adobe Creative Cloud</strong> installer, sign in, and install Photoshop and Illustrator.</li>
              <li>Download the <strong>Pantone Swatch libraries</strong> and drag the .ase files into your local color books application presets directory.</li>
              <li>Keep <strong>TeamViewer</strong> active when requesting interactive screen review sessions with Trainer S.M.E. members.</li>
              <li>Order the <strong>Unibic Swaadesi products</strong> sample pack to complete the required physical measurement and packaging folding assignment.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Adobe Photoshop & Illustrator System Requirements Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">System Hardware Compatibility Check</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Verify your computer's specifications with official Adobe requirements for running Photoshop and Illustrator smoothly.
              </p>
            </div>
          </div>

          {/* OS Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-center">
            <button
              onClick={() => setRequirementsOs('windows')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                requirementsOs === 'windows'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Windows OS
            </button>
            <button
              onClick={() => setRequirementsOs('mac')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                requirementsOs === 'mac'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Laptop className="w-4 h-4" />
              macOS
            </button>
          </div>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Adobe Photoshop Requirements */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-gray-200/60 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                    Ps
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Adobe Photoshop CC</h3>
                    <p className="text-[10px] text-gray-400">System requirements & guidelines</p>
                  </div>
                </div>
                <a
                  href="https://helpx.adobe.com/photoshop/system-requirements.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Official Help URL
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Requirement Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    Processor (CPU)
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-normal">
                    {requirementsOs === 'windows' 
                      ? 'Intel® or AMD processor with 64-bit support; 2 GHz or faster with SSE 4.2'
                      : 'Apple Silicon M1/M2/M3 chip or Multicore Intel® processor with 64-bit support'}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Memory (RAM)
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-normal">
                    8 GB Minimum <span className="text-gray-400 font-medium">(16 GB or more recommended)</span>
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Monitor className="w-3.5 h-3.5 text-blue-500" />
                    Graphics (GPU)
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-normal">
                    {requirementsOs === 'windows' 
                      ? 'GPU with DirectX 12 support (feature level 12_0 or later); 1.5 GB VRAM (4 GB recommended)'
                      : 'Apple Silicon GPU / Metal-capable GPU; 2 GB VRAM (4 GB recommended)'}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                    Storage Space
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-normal">
                    20 GB available hard-disk space <span className="text-gray-400 font-medium">(Fast SSD recommended)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Adobe Illustrator Requirements */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-gray-200/60 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold text-xs">
                    Ai
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Adobe Illustrator CC</h3>
                    <p className="text-[10px] text-gray-400">System requirements & guidelines</p>
                  </div>
                </div>
                <a
                  href="https://helpx.adobe.com/illustrator/system-requirements.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Official Help URL
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Requirement Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5 text-amber-500" />
                    Processor (CPU)
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-normal">
                    {requirementsOs === 'windows' 
                      ? 'Multicore Intel® processor (with 64-bit support) or AMD Athlon® 64 processor'
                      : 'Apple Silicon M1/M2/M3 chip or Multicore Intel® processor with SSE 4.2 support'}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Memory (RAM)
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-normal">
                    8 GB Minimum <span className="text-gray-400 font-medium">(16 GB or more recommended)</span>
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Monitor className="w-3.5 h-3.5 text-amber-500" />
                    Graphics (GPU)
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-normal">
                    {requirementsOs === 'windows' 
                      ? 'GPU with DirectX 12 support and OpenGL 4.0 or greater; 1 GB VRAM (4 GB recommended)'
                      : 'Apple Silicon GPU / Metal-capable GPU; 1 GB VRAM (2 GB recommended)'}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                    Storage Space
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-normal">
                    4 GB of available hard-disk space for installation <span className="text-gray-400 font-medium">(Fast SSD recommended)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Operating System Note */}
        <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 items-center border border-gray-100 text-xs text-gray-600">
          <Info className="w-5 h-5 text-pink-500 shrink-0" />
          <p>
            <strong>Supported Operating System versions:</strong>{' '}
            {requirementsOs === 'windows' 
              ? 'Windows 10 (64-bit) version 22H2 or later / Windows 11' 
              : 'macOS Monterey (version 12), macOS Ventura (version 13), macOS Sonoma (version 14) or newer'}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Software Tool Library</h1>
              <p className="text-gray-500">Quick 5-minute tutorials for essential software tools.</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Adobe Acrobat', 'Illustrator', 'Photoshop', 'Quality Check Process'].map(tool => {
            const toolVideos = filteredVideos.filter(v => v.toolName === tool);
            
            return (
              <div key={tool} className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-pink-600" />
                  {tool}
                  <span className="ml-auto bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">
                    {toolVideos.length}
                  </span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {toolVideos.map(video => (
                    <button
                      key={video.id}
                      onClick={() => setActiveSoftwareVideo(video)}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-pink-200 hover:shadow-md transition-all group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform flex-shrink-0">
                          <Play className="w-5 h-5 ml-1" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 line-clamp-2">{video.title}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            {video.duration || '5:00'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {toolVideos.length === 0 && (
                    <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 italic">No videos found.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeSoftwareVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-md border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-pink-500" />
                {activeSoftwareVideo.title}
              </h3>
              <button 
                onClick={() => setActiveSoftwareVideo(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <SecureVideoPlayer 
                url={activeSoftwareVideo.videoUrl} 
                title={activeSoftwareVideo.title}
                userName={user?.name || 'Student'}
                userId={user?.studentId || user?.id || 'Unknown'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
