import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flower, Wind, Droplets, Volume2, CheckCircle2, Play, Heart, ArrowRight, Clock, ArrowLeft, Smile, Target, Lightbulb, UserCheck } from 'lucide-react';
import { cn } from '../utils';

interface MoralEducationProps {
  userName: string;
  videoUrl: string;
  onComplete: () => void;
  onBack?: () => void;
}

const moods = [
  { id: 'energized', label: 'Energized & Confident', emoji: '🌟' },
  { id: 'calm', label: 'Calm & Centered', emoji: '😌' },
  { id: 'focused', label: 'Focused & Studious', emoji: '🧠' },
  { id: 'tired', label: 'A Bit Tired', emoji: '🥱' },
  { id: 'overwhelmed', label: 'Slightly Overwhelmed', emoji: '😰' },
];

const goals = [
  { id: 'breaks', label: 'Take regular short breaks', emoji: '⏱️' },
  { id: 'hydration', label: 'Stay hydrated & drink water', emoji: '💧' },
  { id: 'posture', label: 'Maintain good sitting posture', emoji: '🧘' },
  { id: 'support', label: 'Support & respect fellow students', emoji: '🤝' },
  { id: 'positivity', label: 'Stay positive under deadlines', emoji: '🚀' },
];

export default function MoralEducation({ 
  userName, 
  videoUrl, 
  onComplete,
  onBack
}: MoralEducationProps) {
  const [step, setStep] = useState<'welcome' | 'survey' | 'video' | 'finished'>('welcome');
  const [mood, setMood] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [error, setError] = useState<string>('');

  const getStepTitle = () => {
    switch (step) {
      case 'welcome': return `Good Morning, ${userName.split(' ')[0]}`;
      case 'survey': return 'Daily Wellness Check-In';
      case 'video': return 'Self-Care & Wellness';
      case 'finished': return 'Ready to Excel';
      default: return '';
    }
  };

  const nextStep = () => {
    if (step === 'welcome') {
      setStep('survey');
    } else if (step === 'survey') {
      if (!mood || !goal) {
        setError('Please select both your current feeling and today\'s self-care goal.');
        return;
      }
      setError('');
      setStep('video');
    } else if (step === 'video') {
      setStep('finished');
    }
  };

  const getPersonalizedAdvice = () => {
    switch (mood) {
      case 'energized':
        return "That's fantastic! Channel this high energy into mastering your printing and packaging designs today. Inspire those around you with your positivity!";
      case 'calm':
        return "Excellent. A steady mind is the secret to high-quality craftsmanship. Your focus and patience will lead to flawless, high-precision outputs today.";
      case 'focused':
        return "Love the dedication! Remember that deep focus is a marathon, not a sprint—take subtle, conscious breathers to sustain this clarity all day.";
      case 'tired':
        return "It's completely okay to feel tired. Be gentle with yourself. Focus on completing your tasks with deliberate, steady, and safe steps rather than rushing.";
      case 'overwhelmed':
        return "Take a slow, deep breath. You are fully capable and well-supported here. Break your tasks into tiny, manageable steps. Focus on just one detail at a time.";
      default:
        return "We're glad you are here. Take today one step at a time, keeping your wellness at the core of your learning experience.";
    }
  };

  const getGoalTip = () => {
    switch (goal) {
      case 'breaks':
        return "Try the 50-10 rhythm: 50 minutes of focused technical work, followed by a 10-minute stretch to clear your eyes and mind.";
      case 'hydration':
        return "Keep a filled water bottle right at your workspace. Take a refreshing sip every time you complete a task or a module.";
      case 'posture':
        return "Sit all the way back in your chair, relax your shoulders, and keep your computer screen at eye level to prevent neck strain.";
      case 'support':
        return "Offering a word of encouragement or a simple helping hand to a fellow student builds a strong, professional community.";
      case 'positivity':
        return "Quality preparation is your best tool against pressure. Double-check your dimensions early to prevent late-stage rush panic.";
      default:
        return "Take small, intentional steps today to keep your mind and body perfectly balanced.";
    }
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
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-green-100 flex items-center justify-center mx-auto mb-4 text-green-600"
            >
              {step === 'welcome' && <Heart className="w-8 h-8" />}
              {step === 'survey' && <Smile className="w-8 h-8" />}
              {step === 'video' && <Sparkles className="w-8 h-8" />}
              {step === 'finished' && <CheckCircle2 className="w-8 h-8" />}
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-serif text-[#1a2a1a] mb-2">
              {getStepTitle()}
            </h1>
            <p className="text-sm md:text-base text-gray-500 font-light tracking-wide max-w-xl mx-auto">
              {step === 'welcome' && "Start your day with a moment of mindfulness and moral grounding."}
              {step === 'survey' && "Tell us how you are feeling today so we can customize your morning focus."}
              {step === 'video' && "Watch this short guide on self-care and professional wellness."}
              {step === 'finished' && "You are now centered, focused, and ready to excel today."}
            </p>
          </div>

          {/* Content Area */}
          <div className="w-full bg-white rounded-[2rem] shadow-xl shadow-green-900/5 border border-green-50 overflow-hidden mb-6">
            {step === 'welcome' && (
              <div className="p-8 md:p-12 text-center">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center mb-8">
                   <Flower className="w-24 h-24 text-green-200 animate-bounce" />
                </div>
                <button
                  onClick={nextStep}
                  className="px-12 py-4 bg-[#2e4a2e] text-white rounded-full font-bold text-lg hover:bg-[#1a2a1a] transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto cursor-pointer"
                >
                  Start Wellness Path <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 'survey' && (
              <div className="p-6 md:p-10 space-y-8">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm text-center font-medium animate-shake">
                    ⚠️ {error}
                  </div>
                )}

                {/* Mood Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Smile className="w-4 h-4 text-green-600" />
                    How are you feeling today?
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {moods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMood(m.id);
                          setError('');
                        }}
                        className={cn(
                          "p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95",
                          mood === m.id
                            ? "border-green-600 bg-green-50 text-green-800 shadow-md font-bold"
                            : "border-gray-100 bg-gray-50/50 hover:border-green-300 hover:bg-green-50/20 text-gray-700"
                        )}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-xs">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    What is your self-care goal for today's training?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {goals.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setGoal(g.id);
                          setError('');
                        }}
                        className={cn(
                          "p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95",
                          goal === g.id
                            ? "border-green-600 bg-green-50 text-green-800 shadow-md font-bold"
                            : "border-gray-100 bg-gray-50/50 hover:border-green-300 hover:bg-green-50/20 text-gray-700"
                        )}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="text-xs line-clamp-2 leading-tight">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={nextStep}
                    className="px-10 py-3.5 bg-[#2e4a2e] hover:bg-[#1a2a1a] text-white rounded-full font-bold text-base transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    Next: Watch Video <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
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
                    className="group px-8 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-lg shadow-green-100 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    Finish Wellness Path
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {step === 'finished' && (
              <div className="p-6 md:p-10 space-y-6">
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <p className="text-gray-500 text-sm max-w-md mx-auto italic mb-4">
                    "Self-care is never a selfish act—it is simply good stewardship of the only gift I have, the gift I was put on earth to offer to others."
                  </p>
                </div>

                {/* Personalized Survey Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
                  <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100/50 space-y-2">
                    <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Mindfulness Strategy ({moods.find(m => m.id === mood)?.label})
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {getPersonalizedAdvice()}
                    </p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl border border-blue-100/50 space-y-2">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      Pro-tip: {goals.find(g => g.id === goal)?.label}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {getGoalTip()}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={onComplete}
                    className="px-12 py-4 bg-[#2e4a2e] text-white rounded-full font-bold text-lg hover:bg-[#1a2a1a] transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
                  >
                    Enter Dashboard <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
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
