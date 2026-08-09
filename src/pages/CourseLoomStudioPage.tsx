import React from 'react';
import LoomCourseStudio from '../components/LoomCourseStudio';

export default function CourseLoomStudioPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex flex-col justify-center">
      <LoomCourseStudio isStandaloneWindow={true} />
    </div>
  );
}
