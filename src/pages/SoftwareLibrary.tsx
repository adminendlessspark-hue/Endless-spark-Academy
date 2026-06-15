import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Video, ArrowRight, Play, X, Clock, Search } from 'lucide-react';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import { useAuth } from '../AuthContext';

export default function SoftwareLibrary() {
  const { user } = useAuth();
  const [softwareVideos, setSoftwareVideos] = useState<any[]>([]);
  const [activeSoftwareVideo, setActiveSoftwareVideo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
