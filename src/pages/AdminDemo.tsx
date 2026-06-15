import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Eye, 
  Gamepad2, 
  Compass, 
  CheckCircle2, 
  Info,
  LayoutDashboard,
  MessageSquare
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import MoralEducation from '../components/MoralEducation';
import EntranceTest from './EntranceTest';
import QueryTracker from './QueryTracker';
import { cn } from '../utils';

export default function AdminDemo() {
  const navigate = useNavigate();
  const { 
    wellnessEnabled, 
    wellnessVideoUrl
  } = useSettings();
  
  const [activeDemo, setActiveDemo] = useState<'none' | 'wellness' | 'entrance' | 'queries'>('none');

  const demoFeatures = [
    {
      id: 'wellness',
      title: 'Self-Care & Wellness',
      description: 'The holistic morning routine that starts a student\'s day with purpose.',
      icon: Sparkles,
      color: 'bg-green-50 text-green-600',
      badge: wellnessEnabled ? 'Enabled' : 'Disabled',
      badgeColor: wellnessEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    },
    {
      id: 'entrance',
      title: 'Entrance Test',
      description: 'The assessment students take to evaluate their technical and linguistic skills.',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
      badge: 'Required',
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'queries',
      title: 'Query Support Desk',
      description: 'The real-time workspace where students submit academic queries and staff provide direct solutions.',
      icon: MessageSquare,
      color: 'bg-pink-50 text-pink-600',
      badge: 'Interactive',
      badgeColor: 'bg-pink-100 text-pink-700'
    }
  ];

  if (activeDemo === 'wellness') {
    return (
      <MoralEducation
        userName="Admin (Demo)"
        videoUrl={wellnessVideoUrl}
        onComplete={() => setActiveDemo('none')}
        onBack={() => setActiveDemo('none')}
      />
    );
  }

  if (activeDemo === 'entrance') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-[100] bg-white border-b border-gray-250 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveDemo('none')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="font-bold text-gray-900">Entrance Test Demo</h2>
              <p className="text-xs text-gray-500">Previewing the student assessment experience</p>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-xs font-bold uppercase tracking-wider">
            Demo Mode
          </div>
        </div>
        <div className="p-4 md:p-8">
           <EntranceTest isDemo={true} />
        </div>
      </div>
    );
  }

  if (activeDemo === 'queries') {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="sticky top-0 z-[100] bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveDemo('none')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="font-bold text-gray-900">Query Support Desk Demo</h2>
              <p className="text-xs text-gray-500">Previewing the student query & faculty resolution layout format</p>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-xs font-bold uppercase tracking-wider">
            Sandbox Mode
          </div>
        </div>
        <div className="p-4 md:p-8">
           <QueryTracker isDemoMode={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-pink-600 font-bold text-sm uppercase tracking-widest mb-2">
              <Eye className="w-4 h-4" />
              Admin Preview Center
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight"> Student Experience <span className="text-pink-600 underline decoration-pink-200 underline-offset-8">Demos</span></h1>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl">
              Preview how students interact with core modules. Ensure your settings provide the best experience for your learners.
            </p>
          </div>
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Admin Panel
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {demoFeatures.map((feature) => (
            <motion.div
              key={feature.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", feature.color)}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", feature.badgeColor)}>
                  {feature.badge}
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {feature.description}
              </p>

              <button
                onClick={() => setActiveDemo(feature.id as any)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-pink-600 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                Launch Demo Preview
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-pink-50 rounded-[2.5rem] border border-pink-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg text-pink-600 shrink-0">
             <Gamepad2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">More Demos Coming Soon</h4>
            <p className="text-gray-600">
              We are building interactive previews for Course Modules, Assignments, and Real-time Lab sessions to help you manage your students better.
            </p>
          </div>
          <div className="flex gap-2 ml-auto">
             <div className="w-3 h-3 bg-pink-200 rounded-full animate-bounce" />
             <div className="w-3 h-3 bg-pink-200 rounded-full animate-bounce [animation-delay:0.2s]" />
             <div className="w-3 h-3 bg-pink-200 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    </div>
  );
}
