import React from 'react';
import LoomCourseStudio from '../components/LoomCourseStudio';
import { Sparkles, ArrowUpRight } from 'lucide-react';

export default function CourseStudio() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              In-App Video Recording
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Course Studio
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Record screen tutorials with webcam bubble overlays, cursor spotlight, live subtitles, script notes, and bind videos directly to course modules.
          </p>
        </div>

        <button
          onClick={() => window.open('/course-studio', '_blank')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-md cursor-pointer border border-slate-700"
        >
          <ArrowUpRight className="w-4 h-4 text-pink-400" />
          <span>Launch in Standalone Tab</span>
        </button>
      </div>

      {/* Loom Course Studio Component */}
      <LoomCourseStudio defaultModuleTitle="Course Video Tutorial" />
    </div>
  );
}
