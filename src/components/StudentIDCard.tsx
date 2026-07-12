import React from 'react';
import { User } from '../types';
import { useSettings } from '../hooks/useSettings';
import { Mail, Globe } from 'lucide-react';

interface StudentIDCardProps {
  user: User;
  adminSignature?: string;
}

export default function StudentIDCard({ user, adminSignature }: StudentIDCardProps) {
  const { logoUrl } = useSettings();
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const assignedCourses = user.assignedCourses || (user.assignedCourse ? [user.assignedCourse] : []);
  const courseName = assignedCourses.length > 0 
    ? assignedCourses.map(c => c.replace(/-/g, ' ')).join(', ') 
    : 'PENDING ASSIGNMENT';

  const absoluteLogoUrl = logoUrl ? (logoUrl.startsWith('/') ? window.location.origin + logoUrl : logoUrl) : '';

  // Determine course mode and branch
  const modeOfStudy = user.applicationData?.modeOfStudy || user.demoData?.mode || 'online';
  const isOffline = modeOfStudy === 'physical';
  const modeText = isOffline ? 'Offline Class' : 'Online Class';
  const branchName = user.applicationData?.branch || '';

  return (
    <div id="student-id-card-container" className="flex justify-center">
      {/* Front Card Only - Horizontal */}
      <div id="student-id-card-front" className="w-[600px] h-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden relative font-sans border border-gray-200 flex">
        
        {/* Left Pink Bar */}
        <div className="w-16 bg-[#e91e63] flex items-center justify-center shrink-0 relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-white/20 rounded-br-full"></div>
          <span className="transform -rotate-90 text-white font-bold tracking-widest whitespace-nowrap text-sm">
            STUDENT ID CARD
          </span>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col py-6 px-8 relative bg-white justify-between">
          {/* Faint background circle */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-50 rounded-full opacity-50 pointer-events-none"></div>

          {/* Header */}
          <div className="flex justify-between items-end mb-4 relative z-10 shrink-0">
            <div className="flex gap-4 items-end flex-1">
              <img src={absoluteLogoUrl} alt="Logo" className="h-20 object-contain shrink-0" />
              <div className="pb-1">
                <h2 className="text-gray-900 font-black text-[13px] leading-tight tracking-wide uppercase">
                  ENDLESS SPARK SCHOOL<br/>
                  OF PRINTING<br/>
                  AND PACKAGING
                </h2>
              </div>
            </div>
            <div className="text-right shrink-0 ml-4 self-start pt-1">
              <p className="text-[#e91e63] font-bold text-[9px] tracking-widest mb-0.5 whitespace-nowrap">STUDENT ID</p>
              <p className="text-gray-900 font-black text-base whitespace-nowrap">{user.studentId || 'PENDING'}</p>
            </div>
          </div>

          {/* Body */}
          <div className="flex gap-6 flex-1 items-center relative z-10 my-1">
            {/* Photo */}
            <div className="w-28 h-36 rounded-2xl overflow-hidden bg-pink-50 flex items-center justify-center shrink-0 p-1 border border-pink-100">
              <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 shadow-inner">
                {user.photo ? (
                  <img 
                    src={user.photo} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-gray-400 text-[10px] flex items-center justify-center h-full text-center px-1 font-bold">No Photo</span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-center gap-2.5">
              <div>
                <p className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">NAME</p>
                <h3 className="text-gray-900 font-black text-xl uppercase tracking-tight leading-none">{user.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">COURSE</p>
                  <p className="text-[#e91e63] font-bold text-xs uppercase leading-tight">{courseName}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">STUDY MODE</p>
                  <p className="text-gray-900 font-extrabold text-xs uppercase leading-tight">{modeText}</p>
                  {isOffline && branchName && (
                    <p className="text-pink-600 font-black text-[10px] uppercase mt-0.5 leading-tight">
                      {branchName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-8 border-t border-gray-100 pt-2">
                <div>
                  <p className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">ADMISSION</p>
                  <p className="text-gray-900 font-bold text-xs">{formatDate(user.admissionDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">VALID UNTIL</p>
                  <p className="text-gray-900 font-bold text-xs">{formatDate(user.expiryDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - No Phone Number, High Contrast, Centered and Spaced Clearly */}
          <div className="mt-2 pt-3 border-t border-gray-100 flex justify-around items-center relative z-10 shrink-0">
            <div className="flex items-center gap-1.5 text-gray-700 text-xs font-bold transition-colors">
              <Mail className="w-4 h-4 text-[#e91e63]" />
              <span>info@endlesssparkcreativehub.in</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700 text-xs font-bold transition-colors">
              <Globe className="w-4 h-4 text-[#e91e63]" />
              <span>endlesssparkcreativehub.in</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
