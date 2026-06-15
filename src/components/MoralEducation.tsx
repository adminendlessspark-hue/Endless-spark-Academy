import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flower, Wind, Droplets, Volume2, CheckCircle2, Play, Heart, ArrowRight, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '../utils';

interface MoralEducationProps {
  userName: string;
  videoUrl: string;
  onComplete: () => void;
  onBack?: () => void;
}

export default function MoralEducation({ 
  userName, 
  videoUrl, 
  onComplete,
  onBack
}: MoralEducationProps) {
  const [step, setStep] = useState<'welcome' | 'video' | 'finished'>('welcome');

  const getStepTitle = () => {
    switch (step) {
      case 'welcome': return `Good Morning, ${userName.split(' ')[0]}`;
      case 'video': return 'Self-Care & Wellness';
      case 'finished': return 'Ready to Excel';
      default: return '';
    }
  };

  const nextStep = () => {
    if (step === 'welcome') setStep('video');
    else if (step === 'video') setStep('finished');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#fdfcf8] overflow-hidden flex flex-col items-center justify-center p-6 text-[#2c3e50]">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-8 left-8 z-[210] flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-white hover:text-gray-900 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Wellness
        </button>
      )}

      {/* Nature Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-200 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-100 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-amber-100 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-4xl flex flex-col items-center relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-green-100 flex items-center justify-center mx-auto mb-6 text-green-600"
            >
              {step === 'welcome' && <Heart className="w-8 h-8" />}
              {step === 'video' && <Sparkles className="w-8 h-8" />}
              {step === 'finished' && <CheckCircle2 className="w-8 h-8" />}
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-serif text-[#1a2a1a] mb-4">
              {getStepTitle()}
            </h1>
            <p className="text-lg text-gray-500 font-light tracking-wide max-w-xl mx-auto">
              {step === 'welcome' && "Start your day with a moment of mindfulness and moral grounding."}
              {step === 'video' && "Watch this short guide on self-care and professional wellness."}
              {step === 'finished' && "You are now centered, focused, and ready to excel today."}
            </p>
          </div>

          {/* Content Area */}
          <div className="w-full bg-white rounded-[2rem] shadow-xl shadow-green-900/5 border border-green-50 overflow-hidden mb-8">
            {step === 'welcome' && (
              <div className="p-8 md:p-12 text-center">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center mb-8">
                   <Flower className="w-24 h-24 text-green-200 animate-bounce" />
                </div>
                <button
                  onClick={nextStep}
                  className="px-12 py-4 bg-[#2e4a2e] text-white rounded-full font-bold text-lg hover:bg-[#1a2a1a] transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  Start Wellness Path <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 'video' && (
              <div className="p-4 md:p-8">
                <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden shadow-inner group relative">
                  <iframe
                    className="w-full h-full"
                    src={videoUrl}
                    title="Wellness Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="mt-8 flex items-center justify-center">
                  <button
                    onClick={nextStep}
                    className="group px-8 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-lg shadow-green-100 hover:scale-105 transition-all flex items-center gap-2"
                  >
                    Finish Wellness Path
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {step === 'finished' && (
              <div className="p-8 md:p-12 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                <div className="max-w-md mx-auto mb-8">
                  <p className="text-gray-600 italic">
                    "Self-care is never a selfish act—it is simply good stewardship of the only gift I have, the gift I was put on earth to offer to others."
                  </p>
                </div>
                <button
                  onClick={onComplete}
                  className="px-12 py-4 bg-[#2e4a2e] text-white rounded-full font-bold text-lg hover:bg-[#1a2a1a] transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  Enter Dashboard <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Quote / Tip */}
          <div className="text-center opacity-50">
            <p className="text-xs uppercase tracking-[0.2em] font-bold">Endless Spark Holistic Development</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 w-full p-4 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest pointer-events-none">
        <span>Mind. Body. Craft.</span>
        <span>Est. 2024</span>
      </div>
    </div>
  );
}
