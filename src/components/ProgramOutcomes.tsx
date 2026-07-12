import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Info,
  Building
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface CareerOpportunity {
  title: string;
  desc: string;
  skills: string[];
  growth: string;
}

interface CompensationScenario {
  amount: string;
  label: string;
  role: string;
  exp: string;
  years: number;
  color: string;
  bgLight: string;
  borderCol: string;
  textCol: string;
  perks: string[];
}

export default function ProgramOutcomes() {
  const { logoUrl, placementSettings } = useSettings();
  const [selectedCareer, setSelectedCareer] = useState<number | null>(null);
  const [targetExp, setTargetExp] = useState<number>(3);

  const careerOpportunities: CareerOpportunity[] = [
    {
      title: "Production Executive",
      desc: "Manages day-to-day print runs, schedules workflow alignments, and maintains machinery throughput on flexo and offset presses.",
      skills: ["Press Scheduling", "Ink Weight Calculations", "Format Optimization"],
      growth: "Production Manager (+50% salary hike)"
    },
    {
      title: "Color Retoucher",
      desc: "Executes professional ICC color profile conversions, image tonal corrections, and high-fidelity Pantone spot color separations.",
      skills: ["Adobe Photoshop CMYK", "ICC Profiling", "Spot Separations"],
      growth: "Senior Repro Artist"
    },
    {
      title: "Team Lead",
      desc: "Coordinates junior pre-press artists, reviews final layout folders, and ensures on-time deliveries of packaging dies.",
      skills: ["Operations Management", "Trapping Review", "Client Delivery"],
      growth: "Prepress Supervisor"
    },
    {
      title: "Pre Press Executive",
      desc: "Prepares digital files for plating, executes page traps and bleed extensions, and performs preflight analysis.",
      skills: ["InDesign Preflight", "ExtendScript Automated Trimming", "PDF compliance"],
      growth: "Prepress Technical Lead"
    },
    {
      title: "Client Service Executive",
      desc: "Acts as technical bridge between corporate clients and the plant floor, translating brand assets into exact prepress files.",
      skills: ["Print Specifications Analysis", "CRM Tools", "Proofing Sign-offs"],
      growth: "Account Manager"
    },
    {
      title: "Production Manager",
      desc: "Directs end-to-end printing and packaging production, manages cost budgets, and controls quality metrics.",
      skills: ["Lean Manufacturing", "Plant Safety Controls", "ERP Systems"],
      growth: "Operations Director"
    },
    {
      title: "QC Executive",
      desc: "Conducts precision structural measurement checks, analyzes dot gain, and verifies bleed tolerances to enforce standards.",
      skills: ["Densitometer Usage", "Spectrophotometry", "ISO 12647 Compliance"],
      growth: "Quality Assurance Director"
    },
    {
      title: "Print Production Manager",
      desc: "Supervises plate-making operations and ensures ink registration matches physical proofing outputs.",
      skills: ["Platemaking (CTP)", "Ink Keys Calibration", "Color Management"],
      growth: "General Manager (Print Operations)"
    },
    {
      title: "Account Manager",
      desc: "Secures packaging accounts with leading consumer products companies and supervises order flows.",
      skills: ["Key Account Management", "Packaging Sales", "Strategic Partnerships"],
      growth: "Business Development Director"
    }
  ];

  const compensationScenarios: CompensationScenario[] = [
    {
      amount: "₹40K",
      label: "Monthly",
      role: "Production Executive",
      exp: "1.5 Years Experience",
      years: 1.5,
      color: "bg-orange-500",
      bgLight: "bg-orange-50/70",
      borderCol: "border-orange-500",
      textCol: "text-orange-600",
      perks: ["Shift allowance", "Health insurance", "Overtime bonus"]
    },
    {
      amount: "₹60K",
      label: "Monthly",
      role: "Pre Press Executive",
      exp: "3 Years Experience",
      years: 3,
      color: "bg-amber-500",
      bgLight: "bg-amber-50/70",
      borderCol: "border-amber-500",
      textCol: "text-amber-600",
      perks: ["Performance incentives", "Certification subsidy", "Paid annual leave"]
    },
    {
      amount: "₹80K",
      label: "Monthly",
      role: "Hybrid Executive",
      exp: "4 Years Experience",
      years: 4,
      color: "bg-yellow-600",
      bgLight: "bg-yellow-50/70",
      borderCol: "border-yellow-600",
      textCol: "text-yellow-700",
      perks: ["Flexible hours", "Prepress lab allowance", "Performance bonus"]
    },
    {
      amount: "₹1.2L",
      label: "Monthly",
      role: "Team Lead",
      exp: "5 Years Experience",
      years: 5,
      color: "bg-rose-400",
      bgLight: "bg-rose-50/70",
      borderCol: "border-rose-400",
      textCol: "text-rose-500",
      perks: ["Leadership training", "Client visitation bonus", "Profit sharing pool"]
    },
    {
      amount: "₹1.5L",
      label: "Monthly",
      role: "Production Manager",
      exp: "7 Years Experience",
      years: 7,
      color: "bg-lime-600",
      bgLight: "bg-lime-50/70",
      borderCol: "border-lime-600",
      textCol: "text-lime-700",
      perks: ["Executive car allocation", "Equity shares options", "Corporate health cover"]
    }
  ];

  // Find best match for slider
  const activeScenarioIdx = compensationScenarios.reduce((bestIdx, curr, idx) => {
    if (Math.abs(curr.years - targetExp) < Math.abs(compensationScenarios[bestIdx].years - targetExp)) {
      return idx;
    }
    return bestIdx;
  }, 0);

  return (
    <div className="space-y-12">
      {/* Banner / Header containing Outcome of Program & Brand */}
      <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-3xl p-6 md:p-10 shadow-lg overflow-hidden border border-teal-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-400/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mb-20" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-[11px] font-bold uppercase rounded-full tracking-wider border border-white/10">
              <Award className="w-3.5 h-3.5 text-yellow-300" />
              Verified Educational Roadmap
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Outcome Of Program
            </h3>
            <p className="text-teal-50 text-xs md:text-sm max-w-2xl leading-relaxed">
              Explore your professional path. Our curriculum guarantees end-to-end expertise aligned with modern prepress, color standards, and industrial automation.
            </p>
          </div>

          {/* Endless Spark Logo */}
          <div className="bg-white/95 p-4 rounded-2xl shadow-xl border border-teal-100 flex flex-col items-center shrink-0 self-start md:self-auto group transition-transform hover:scale-105 duration-300">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Endless Spark Logo" 
                referrerPolicy="no-referrer"
                className="h-12 md:h-16 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-center">
                <span className="text-sm font-black text-slate-900 tracking-wider flex items-center gap-1">
                  ENDLESS SPARK <Sparkles className="w-4 h-4 text-pink-600 animate-pulse" />
                </span>
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">To succeed in your mission</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Career Opportunities Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Career Opportunities
            </h4>
            <p className="text-xs text-slate-500">Graduates from Endless Spark are certified to hold any of these 9 industrial positions</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            9 High-Demand Roles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {careerOpportunities.map((career, idx) => (
            <div
              key={career.title}
              onClick={() => setSelectedCareer(selectedCareer === idx ? null : idx)}
              className="relative overflow-hidden bg-white hover:bg-slate-50/50 border border-slate-200/80 p-6 rounded-2xl shadow-xs flex flex-col justify-between group transition-all duration-300 cursor-pointer hover:shadow-md hover:border-indigo-300 min-h-[110px]"
              id={`career-card-${idx}`}
            >
              <div className="space-y-2 pr-4">
                <h5 className="font-extrabold text-slate-800 text-sm md:text-[15px] group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {career.title}
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                  {career.desc}
                </p>
              </div>

              {/* Slanted Wedge at bottom right matching the photo exactly */}
              <div 
                className="absolute bottom-0 right-0 w-12 h-6 bg-indigo-900 transition-colors group-hover:bg-pink-600" 
                style={{ clipPath: 'polygon(30% 100%, 100% 0, 100% 100%)' }} 
              />

              {/* Interactive Info Icon */}
              <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-400 transition-colors">
                <Info className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Modal-like Card Explainer */}
        {selectedCareer !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-indigo-600 uppercase font-black tracking-widest">Selected Role Deep-Dive</span>
                <h4 className="text-lg font-extrabold text-slate-950 mt-1">{careerOpportunities[selectedCareer].title}</h4>
              </div>
              <button 
                onClick={() => setSelectedCareer(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-white border border-slate-200 shadow-xs"
              >
                Close Explainer
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {careerOpportunities[selectedCareer].desc}
            </p>
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Required Prepress Skillsets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {careerOpportunities[selectedCareer].skills.map((skill) => (
                    <span key={skill} className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-mono text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1 bg-white/60 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Typical Career Escalation:</span>
                <p className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                  {careerOpportunities[selectedCareer].title} <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> {careerOpportunities[selectedCareer].growth}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Compensation Scenarios Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Compensation Scenarios - 2025
            </h4>
            <p className="text-xs text-slate-500">Typical starting and mid-career salary structures across experience milestones</p>
          </div>
          
          {/* Experience Filter Slider */}
          <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-700">Target Experience:</span>
            <input 
              type="range" 
              min="1" 
              max="8" 
              step="0.5"
              value={targetExp}
              onChange={(e) => setTargetExp(parseFloat(e.target.value))}
              className="w-32 accent-teal-600 cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {targetExp} Yrs
            </span>
          </div>
        </div>

        {/* The Capsule Arch Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {compensationScenarios.map((sc, idx) => {
            const isActive = activeScenarioIdx === idx;
            return (
              <motion.div
                key={sc.role}
                animate={{ scale: isActive ? 1.04 : 0.98, opacity: isActive ? 1 : 0.75 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col items-center transition-all ${isActive ? 'z-10 filter drop-shadow-md' : ''}`}
                id={`comp-capsule-${idx}`}
              >
                {/* Top Arch Part */}
                <div className={`w-full aspect-[4/3.8] rounded-t-[5rem] border-t-8 border-x-8 ${sc.borderCol} flex flex-col items-center justify-center pt-8 pb-3 bg-white relative overflow-hidden`}>
                  <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{sc.amount}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{sc.label}</span>
                  {isActive && (
                    <span className="absolute top-2 text-[8px] bg-teal-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Matches
                    </span>
                  )}
                </div>
                {/* Bottom Solid Box Part */}
                <div className={`w-full ${sc.color} text-white rounded-b-3xl p-4 text-center space-y-1 min-h-[100px] flex flex-col justify-center`}>
                  <h5 className="font-black text-xs leading-snug tracking-tight">{sc.role}</h5>
                  <p className="text-[10px] text-white/80 font-bold mt-1 uppercase tracking-wider bg-black/10 py-0.5 rounded">
                    {sc.exp}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Compensation Insight Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Active Salary Bracket Insight</span>
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${compensationScenarios[activeScenarioIdx].color}`} />
              {compensationScenarios[activeScenarioIdx].role} Milestone ({compensationScenarios[activeScenarioIdx].exp})
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              This bracket reflects standard compensation for professionals with hands-on preflight and plating supervision experience. Common perks include:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {compensationScenarios[activeScenarioIdx].perks.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-full text-[10px] text-slate-700 font-semibold shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {p}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-100 p-5 rounded-2xl text-center md:text-right shrink-0 self-stretch flex flex-col justify-center">
            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">Starting Salary Guarantee</span>
            <span className="text-2xl font-black text-teal-800 font-mono block mt-1">
              {compensationScenarios[activeScenarioIdx].amount} / Mo
            </span>
            <span className="text-[9px] text-teal-500">Based on industry standard covenants</span>
          </div>
        </div>
      </div>

      {/* Corporate Placements Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Corporate Placements & Hiring Partners
            </h4>
            <p className="text-xs text-slate-500">Real-time placement records synchronized directly from the Admin Panel</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Direct Corporate Pipeline
          </span>
        </div>

        {(!placementSettings || !placementSettings.yearlyRecords || placementSettings.yearlyRecords.length === 0) ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center max-w-4xl mx-auto space-y-4">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h5 className="font-bold text-slate-800 text-sm">No custom corporate records uploaded yet</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Showing default alumni hiring partners:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="p-4 bg-white border border-slate-150 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Endless Spark Print Systems</div>
                  <div className="text-slate-500 text-[10px]">12 Students Placed successfully (2024-2025)</div>
                </div>
                <span className="font-bold text-indigo-600 text-xs">₹ 4,50,000 max</span>
              </div>
              <div className="p-4 bg-white border border-slate-150 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Spectrum Flexo Graphics</div>
                  <div className="text-slate-500 text-[10px]">8 Students Placed successfully (2023-2024)</div>
                </div>
                <span className="font-bold text-indigo-600 text-xs">₹ 3,80,000 max</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {[...placementSettings.yearlyRecords]
              .sort((a, b) => b.year.localeCompare(a.year))
              .map((yr: any) => (
                <div key={yr.year} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg">
                        Year {yr.year}
                      </span>
                      <h5 className="text-sm font-bold text-slate-800">Campus Recruitment Drive</h5>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Total Placed: <strong className="text-slate-800 font-bold">{yr.records.reduce((acc: number, r: any) => acc + (r.studentsPlaced || 0), 0)} students</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {yr.records.map((rec: any) => (
                      <div key={rec.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between gap-3 transition-all duration-200">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 border border-slate-200/80 rounded-xl bg-white flex items-center justify-center p-1 shrink-0 shadow-sm">
                            {rec.logoUrl ? (
                              <img src={rec.logoUrl} alt={rec.companyName} className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Building className="w-5 h-5 text-slate-350" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h6 className="font-bold text-slate-800 text-xs truncate" title={rec.companyName}>
                              {rec.companyName}
                            </h6>
                            <p className="text-[10px] text-slate-500">
                              {rec.studentsPlaced} {rec.studentsPlaced === 1 ? 'Student' : 'Students'} Placed
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-[10px] text-slate-400 uppercase font-bold text-xs">Highest Package</span>
                          <span className="font-bold text-xs text-indigo-600 font-mono">
                            ₹{rec.highestPackage ? rec.highestPackage.toLocaleString('en-IN') : '0'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {yr.records.length === 0 && (
                      <div className="col-span-full text-center py-4 text-xs text-slate-400 italic">
                        No corporate records registered for this year.
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
