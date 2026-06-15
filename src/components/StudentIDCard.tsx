import React from 'react';
import { User } from '../types';
import { useSettings } from '../hooks/useSettings';
import { Mail, Globe, Phone } from 'lucide-react';

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
        <div className="flex-1 flex flex-col p-8 relative bg-white">
          {/* Faint background circle */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-50 rounded-full opacity-50 pointer-events-none"></div>

          {/* Header */}
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div className="flex gap-4 items-end flex-1">
              <img src={absoluteLogoUrl} alt="Logo" className="h-24 object-contain shrink-0" />
              <div className="pb-1">
                <h2 className="text-gray-900 font-black text-[15px] leading-tight tracking-wide uppercase">
                  ENDLESS SPARK SCHOOL<br/>
                  OF PRINTING<br/>
                  AND PACKAGING
                </h2>
              </div>
            </div>
            <div className="text-right shrink-0 ml-4 self-start pt-2">
              <p className="text-[#e91e63] font-bold text-[10px] tracking-widest mb-0.5 whitespace-nowrap">STUDENT ID</p>
              <p className="text-gray-900 font-black text-base whitespace-nowrap">{user.studentId || 'PENDING'}</p>
            </div>
          </div>

          {/* Body */}
          <div className="flex gap-8 flex-1 relative z-10">
            {/* Photo */}
            <div className="w-32 h-40 rounded-2xl overflow-hidden bg-pink-50 flex items-center justify-center shrink-0 p-1.5">
              <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 shadow-inner">
                {user.photo ? (
                  <img 
                    src={user.photo} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-gray-400 text-xs flex items-center justify-center h-full text-center px-2">No Photo</span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-4">
                <p className="text-gray-400 font-bold text-[10px] tracking-widest mb-1">NAME</p>
                <h3 className="text-gray-900 font-black text-2xl uppercase tracking-tight">{user.name}</h3>
              </div>
              
              <div className="mb-5">
                <p className="text-gray-400 font-bold text-[10px] tracking-widest mb-1">COURSE</p>
                <p className="text-[#e91e63] font-bold text-sm uppercase">{courseName}</p>
              </div>

              <div className="flex gap-12">
                <div>
                  <p className="text-gray-400 font-bold text-[10px] tracking-widest mb-1">ADMISSION</p>
                  <p className="text-gray-900 font-bold text-sm">{formatDate(user.admissionDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[10px] tracking-widest mb-1">VALID UNTIL</p>
                  <p className="text-gray-900 font-bold text-sm">{formatDate(user.expiryDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium">
              <Phone className="w-3.5 h-3.5" />
              <span>+91 90428 21999</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium">
              <Mail className="w-3.5 h-3.5" />
              <span>info@endlessspark.in</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium">
              <Globe className="w-3.5 h-3.5" />
              <span>endlessspark.in</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
