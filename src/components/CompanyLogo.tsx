import React, { useState } from 'react';

interface CompanyLogoProps {
  src?: string;
  name: string;
  className?: string;
  imgClassName?: string;
}

export default function CompanyLogo({
  src,
  name,
  className = "w-10 h-10",
  imgClassName = "object-contain max-w-full max-h-full"
}: CompanyLogoProps) {
  const [error, setError] = useState(false);

  // Handle case where src is empty or has loading error
  if (!src || error) {
    const cleanedName = (name || '').trim();
    const words = cleanedName.split(/\s+/).filter(Boolean);
    let initials = '';
    if (words.length > 1) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else {
      initials = '?';
    }

    // A list of soft, professional color themes
    const colors = [
      'bg-blue-50 text-blue-600 border-blue-150',
      'bg-indigo-50 text-indigo-600 border-indigo-150',
      'bg-purple-50 text-purple-600 border-purple-150',
      'bg-pink-50 text-pink-600 border-pink-150',
      'bg-rose-50 text-rose-600 border-rose-150',
      'bg-orange-50 text-orange-600 border-orange-150',
      'bg-teal-50 text-teal-600 border-teal-150',
      'bg-emerald-50 text-emerald-600 border-emerald-150',
    ];
    
    let hash = 0;
    for (let i = 0; i < cleanedName.length; i++) {
      hash = cleanedName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorClass = colors[Math.abs(hash) % colors.length];

    return (
      <div 
        className={`flex items-center justify-center font-bold text-xs rounded-xl border shrink-0 select-none ${colorClass} ${className}`}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
        className={imgClassName}
      />
    </div>
  );
}
