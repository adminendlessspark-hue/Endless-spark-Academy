import React, { useState } from 'react';
import { Save, CheckCircle2, Circle, HelpCircle, AlertCircle, FileCheck, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { cn } from '../utils';
import { useSettings } from '../hooks/useSettings';

export default function PreFlightChecklist({ 
  isAdmin = true,
  readOnly = false,
  initialData,
  printerSpec,
  onSave
}: { 
  isAdmin?: boolean;
  readOnly?: boolean;
  initialData?: any;
  printerSpec?: any;
  onSave?: (data: any) => Promise<void> | void;
}) {
  const { logoUrl, printMethods, printingSubstrates } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [formData, setFormData] = useState(() => {
    const defaultFormData = {
      // Header
      clientName: '',
      projectNumber: '',
      version: '',
      date: new Date().toISOString().split('T')[0],
      
      // Technical Verification
      tech: {
        typeOfPackaging: '',
        packType: '',
        productCategory: '',
        printingProcess: printerSpec?.printMethod || '',
        printType: '',
        substrateType: printerSpec?.printingSubstrate || ''
      },

      // File Verification
      fileVer: Array(8).fill('pending'),

      // Scope of Work
      sow: {
        clarity: 'pending',
        specsProvided: 'pending',
        refs: {
          structural: false,
          layout: false,
          content: false,
          color: false,
          element: false
        },
        jobsBooked: '',
        projectNumbersText: '',
        briefClear: 'pending',
        briefs: {
          addition: '',
          deletion: '',
          replacement: ''
        },
        scopeChanges: ''
      },

      // Query Management
      query: {
        meetingNecessary: 'pending',
        address: {
          brief: 'pending',
          doc: 'pending',
          pspec: 'pending',
          links: 'pending',
          baseFile: 'pending',
          fonts: 'pending',
          color: 'pending'
        },
        trackerUpdated: 'pending'
      },
      
      // Notes
      notes: ''
    };

    if (!initialData) return defaultFormData;
    return {
      ...defaultFormData,
      ...initialData,
      tech: { 
        typeOfPackaging: initialData.tech?.typeOfPackaging || '',
        packType: initialData.tech?.packType || '',
        productCategory: initialData.tech?.productCategory || '',
        printingProcess: initialData.tech?.printingProcess || printerSpec?.printMethod || '',
        printType: initialData.tech?.printType || '',
        substrateType: initialData.tech?.substrateType || printerSpec?.printingSubstrate || ''
      },
      sow: { 
        ...defaultFormData.sow, 
        ...(initialData.sow || {}),
        refs: { ...defaultFormData.sow.refs, ...(initialData.sow?.refs || {}) },
        briefs: { ...defaultFormData.sow.briefs, ...(initialData.sow?.briefs || {}) }
      },
      query: { 
        ...defaultFormData.query, 
        ...(initialData.query || {}),
        address: { ...defaultFormData.query.address, ...(initialData.query?.address || {}) }
      },
      fileVer: initialData.fileVer || defaultFormData.fileVer
    };
  });

  // Sync initialData when it becomes available
  const serializedInitial = JSON.stringify(initialData || null);
  const serializedPrinterSpec = JSON.stringify(printerSpec || null);
  React.useEffect(() => {
    if (initialData) {
      setFormData((prev: any) => ({
        ...prev,
        ...initialData,
        tech: { 
          ...(prev.tech || {}), 
          ...(initialData.tech || {}),
          printingProcess: initialData.tech?.printingProcess || prev.tech?.printingProcess || printerSpec?.printMethod || '',
          substrateType: initialData.tech?.substrateType || prev.tech?.substrateType || printerSpec?.printingSubstrate || ''
        },
        sow: { 
          ...(prev.sow || {}), 
          ...(initialData.sow || {}),
          refs: { ...(prev.sow?.refs || {}), ...(initialData.sow?.refs || {}) },
          briefs: { ...(prev.sow?.briefs || {}), ...(initialData.sow?.briefs || {}) }
        },
        query: { 
          ...(prev.query || {}), 
          ...(initialData.query || {}),
          address: { ...(prev.query?.address || {}), ...(initialData.query?.address || {}) }
        },
        fileVer: initialData.fileVer || prev.fileVer || []
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedInitial, serializedPrinterSpec]);

  const [fileVerificationOptions, setFileVerificationOptions] = useState([
    "Ensure variant name, net weight, matching design file, and brief information.",
    "Confirm that the supplied AI file and PDF are identical (Check timestamp).",
    "Verify that the provided Structural Drawing is in 1:1 scale.",
    "Check for any missing fonts.",
    "Check for any missing images (Color mode, Resolution, any embedded images used).",
    "Verify that the supplied file is live.",
    "Check if the number of colors matches the design file.",
    "Confirm that the barcode number matches the design file."
  ]);

  const updateNestedState = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...((prev as any)[section] || {}),
        [field]: value
      }
    }));
  };

  const updateDeepNestedState = (section: string, subSection: string, field: string, value: any) => {
    setFormData(prev => {
      const secObj = (prev as any)[section] || {};
      const subSecObj = secObj[subSection] || {};
      return {
        ...prev,
        [section]: {
          ...secObj,
          [subSection]: {
            ...subSecObj,
            [field]: value
          }
        }
      };
    });
  };

  // Helper validation stats function
  const getValidationStats = () => {
    const issues: string[] = [];
    let completedFields = 0;

    // 1. Header (Client Name & Project Number)
    if (formData.clientName?.trim()) completedFields++; else issues.push("Client Name");
    if (formData.projectNumber?.trim()) completedFields++; else issues.push("Project Number");

    // 2. Tech Verification (6 parameters)
    if (formData.tech.typeOfPackaging?.trim()) completedFields++; else issues.push("Type of Packaging");
    if (formData.tech.packType?.trim()) completedFields++; else issues.push("Pack Type");
    if (formData.tech.productCategory?.trim()) completedFields++; else issues.push("Product Category");
    if (formData.tech.printingProcess?.trim()) completedFields++; else issues.push("Printing Process");
    if (formData.tech.printType?.trim()) completedFields++; else issues.push("Print Type");
    if (formData.tech.substrateType?.trim()) completedFields++; else issues.push("Substrate Type");

    // 3. File Verification
    const fileVerList = formData.fileVer || [];
    fileVerificationOptions.forEach((_, idx) => {
      const val = fileVerList[idx];
      if (val && val !== 'pending') {
        completedFields++;
      } else {
        issues.push(`File Verification Point ${idx + 1}`);
      }
    });

    // 4. SOW
    if (formData.sow?.clarity && formData.sow.clarity !== 'pending') completedFields++; else issues.push("Clarity of Scope of Work");
    if (formData.sow?.specsProvided && formData.sow.specsProvided !== 'pending') completedFields++; else issues.push("Print Specifications Provided");
    if (formData.sow?.briefClear && formData.sow.briefClear !== 'pending') completedFields++; else issues.push("Client Brief Clear");

    // 5. Query Management
    if (formData.query?.meetingNecessary && formData.query.meetingNecessary !== 'pending') completedFields++; else issues.push("Project Meeting Necessary");
    
    const queryKeys = ['brief', 'doc', 'pspec', 'links', 'baseFile', 'fonts', 'color'];
    queryKeys.forEach((key) => {
      const val = formData.query?.address?.[key];
      if (val && val !== 'pending') {
        completedFields++;
      } else {
        const readableNames: any = {
          brief: "Brief Query",
          doc: "Doc Query",
          pspec: "PSpec Query",
          links: "Links Query",
          baseFile: "Base File Query",
          fonts: "Fonts Query",
          color: "Color Query"
        };
        issues.push(readableNames[key] || `${key} Query`);
      }
    });

    if (formData.query?.trackerUpdated && formData.query.trackerUpdated !== 'pending') completedFields++; else issues.push("Tracker Updated");

    const totalFields = 2 + 6 + fileVerificationOptions.length + 3 + 1 + 7 + 1;

    return {
      total: totalFields,
      completed: completedFields,
      missingCount: totalFields - completedFields,
      issues
    };
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {readOnly && !isAdmin && (
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 animate-pulse" />
            <p className="text-sm font-bold text-amber-800">
              Checklist is Locked. <span className="text-pink-700 underline underline-offset-2">START TIMER</span> in the project header to begin your review.
            </p>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-pink-600 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pre-Flight Checklist</h1>
              <p className="text-pink-100 mt-1 text-sm font-medium">Quality Begins with Process Alignment</p>
            </div>
          </div>
          {logoUrl && (
            <div className="bg-white p-2 rounded-xl h-16 flex items-center justify-center shadow-sm max-w-[160px]">
              <img src={logoUrl} alt="Company Logo" className="max-h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>

        {/* Dynamic Completeness Check Section */}
        {(() => {
          const stats = getValidationStats();
          const percent = Math.round((stats.completed / stats.total) * 100);
          const isComplete = stats.completed === stats.total;

          return (
            <div className="bg-slate-50 border-b border-gray-200 p-5 md:p-6">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-widest">
                      Pre-flight Checklist Completion Progress
                    </span>
                    <span className={cn(
                      "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                      isComplete 
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                        : "bg-pink-100 text-pink-800 border border-pink-250 animate-pulse"
                    )}>
                      {isComplete ? "Ready for Submission" : "Filling in progress"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-250 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500 rounded-full",
                          isComplete ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-pink-500 to-rose-600"
                        )}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-black text-slate-700 whitespace-nowrap min-w-[55px] text-right">
                      {stats.completed} / {stats.total} Checked ({percent}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowValidationErrors(true);
                      const currentStats = getValidationStats();
                      if (currentStats.missingCount === 0) {
                        alert("🎉 Checklist is 100% completed! Ready to submit or generate standard production orders!");
                      } else {
                        alert(`⚠️ Validation audit loaded: We detected ${currentStats.missingCount} checklist points still unresolved or pending feedback. We have highlighted them in red below.`);
                      }
                    }}
                    className="cursor-pointer bg-slate-900 shadow-lg hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase px-4 py-3 rounded-xl transition duration-150 flex items-center gap-1.5 border border-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                    <span>Validate checklist completeness</span>
                  </button>
                </div>
              </div>

              {/* Show error alerts listing what is missing to fulfill the user's explicit checklist requirement */}
              {showValidationErrors && !isComplete && (
                <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 animate-in slide-in-from-top-1 duration-200">
                  <div className="flex gap-3 text-red-900">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-red-800">
                        Incomplete checklist validation alert ({stats.missingCount} items unfulfilled)
                      </p>
                      <p className="text-xs text-red-700 leading-relaxed font-medium">
                        Your preflight checks are not fully complete. All outstanding required items have been highlighted in <strong>glowing red borders</strong> below. Please check each point to verify.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showValidationErrors && isComplete && (
                <div className="mt-4 bg-emerald-50 border border-emerald-250 rounded-xl p-4 animate-in slide-in-from-top-1 duration-200">
                  <div className="flex gap-3 text-emerald-950">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-800">
                        Checklist 100% verification successful
                      </p>
                      <p className="text-xs text-emerald-700 leading-relaxed font-semibold">
                        All checklist criteria are completed with full approval ratings. Excellent pre-press work!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <div className="p-6 md:p-8 space-y-10">
          
          {/* General Information */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Client Name</span>
                {showValidationErrors && !formData.clientName?.trim() && (
                  <span className="text-[10px] font-bold text-red-650 uppercase">Required</span>
                )}
              </label>
              <input 
                type="text" 
                disabled={readOnly}
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 font-medium transition-colors",
                  showValidationErrors && !formData.clientName?.trim() 
                    ? "border-red-500 bg-red-50/10 placeholder-red-300" 
                    : "border-gray-300"
                )}
                placeholder="Enter client name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Project Number</span>
                {showValidationErrors && !formData.projectNumber?.trim() && (
                  <span className="text-[10px] font-bold text-red-655 uppercase">Required</span>
                )}
              </label>
              <input 
                type="text" 
                disabled={readOnly}
                value={formData.projectNumber}
                onChange={e => setFormData({...formData, projectNumber: e.target.value})}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 font-medium transition-colors",
                  showValidationErrors && !formData.projectNumber?.trim() 
                    ? "border-red-500 bg-red-50/10 placeholder-red-300" 
                    : "border-gray-300"
                )}
                placeholder="Enter project number"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Version</label>
              <input 
                type="text" 
                disabled={readOnly}
                value={formData.version}
                onChange={e => setFormData({...formData, version: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 font-medium"
                placeholder="e.g. v1.0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Date</label>
              <input 
                type="date" 
                disabled={readOnly}
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 font-medium"
              />
            </div>
          </section>

          {/* Technical Verification */}
          <section>
            <h2 className="text-lg font-bold text-gray-905 border-b border-gray-200 pb-2 mb-4 text-slate-900">1. Technical Verification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Type of Packaging */}
              <div className={cn(
                "flex flex-col bg-gray-50 rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 shadow-sm transition-all",
                showValidationErrors && !formData.tech.typeOfPackaging?.trim()
                  ? "border-red-500 bg-red-50/10"
                  : "border-gray-200"
              )}>
                <span className={cn(
                  "px-4 py-1.5 text-xs font-bold border-b shrink-0 flex items-center justify-between",
                  showValidationErrors && !formData.tech.typeOfPackaging?.trim()
                    ? "bg-red-50/50 border-red-200 text-red-700 font-black"
                    : "bg-gray-100 border-gray-200 text-gray-600"
                )}>
                  <span>Type of Packaging</span>
                  {showValidationErrors && !formData.tech.typeOfPackaging?.trim() && (
                    <span className="text-[10px] font-bold text-red-600 animate-pulse font-black">MISSED</span>
                  )}
                </span>
                <select 
                  disabled={readOnly} 
                  className="px-4 py-2.5 outline-none bg-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500 w-full font-bold text-gray-800 cursor-pointer" 
                  value={formData.tech.typeOfPackaging || ''} 
                  onChange={e => updateNestedState('tech', 'typeOfPackaging', e.target.value)}
                >
                  <option value="" className="text-gray-400 font-normal">Select Type of Packaging</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Tertiary">Tertiary</option>
                </select>
              </div>

              {/* Pack Type */}
              <div className={cn(
                "flex flex-col bg-gray-50 rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 shadow-sm transition-all",
                showValidationErrors && !formData.tech.packType?.trim()
                  ? "border-red-500 bg-red-50/10"
                  : "border-gray-200"
              )}>
                <span className={cn(
                  "px-4 py-1.5 text-xs font-bold border-b shrink-0 flex items-center justify-between",
                  showValidationErrors && !formData.tech.packType?.trim()
                    ? "bg-red-50/50 border-red-200 text-red-700 font-black"
                    : "bg-gray-100 border-gray-200 text-gray-600"
                )}>
                  <span>Pack Type</span>
                  {showValidationErrors && !formData.tech.packType?.trim() && (
                    <span className="text-[10px] font-bold text-red-655 animate-pulse font-black">MISSED</span>
                  )}
                </span>
                <select 
                  disabled={readOnly} 
                  className="px-4 py-2.5 outline-none bg-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500 w-full font-bold text-gray-800 cursor-pointer" 
                  value={formData.tech.packType || ''} 
                  onChange={e => updateNestedState('tech', 'packType', e.target.value)}
                >
                  <option value="" className="text-gray-400 font-normal">Select Pack Type</option>
                  <option value="Pouch">Pouch</option>
                  <option value="Folding Carton">Folding Carton</option>
                  <option value="Label">Label</option>
                  <option value="Shrink Sleeve">Shrink Sleeve</option>
                  <option value="Tube">Tube</option>
                  <option value="Can">Can</option>
                  <option value="Blister Pack">Blister Pack</option>
                  <option value="Corrugated Box">Corrugated Box</option>
                  <option value="Flow Wrap">Flow Wrap</option>
                </select>
              </div>

              {/* Product Category */}
              <div className={cn(
                "flex flex-col bg-gray-50 rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 shadow-sm transition-all",
                showValidationErrors && !formData.tech.productCategory?.trim()
                  ? "border-red-500 bg-red-50/10"
                  : "border-gray-200"
              )}>
                <span className={cn(
                  "px-4 py-1.5 text-xs font-bold border-b shrink-0 flex items-center justify-between",
                  showValidationErrors && !formData.tech.productCategory?.trim()
                    ? "bg-red-50/50 border-red-200 text-red-700 font-black"
                    : "bg-gray-100 border-gray-200 text-gray-600"
                )}>
                  <span>Product Category</span>
                  {showValidationErrors && !formData.tech.productCategory?.trim() && (
                    <span className="text-[10px] font-bold text-red-655 animate-pulse font-black">MISSED</span>
                  )}
                </span>
                <select 
                  disabled={readOnly} 
                  className="px-4 py-2.5 outline-none bg-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500 w-full font-bold text-gray-800 cursor-pointer" 
                  value={formData.tech.productCategory || ''} 
                  onChange={e => updateNestedState('tech', 'productCategory', e.target.value)}
                >
                  <option value="" className="text-gray-400 font-normal">Select Product Category</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Pharmaceutical">Pharmaceutical</option>
                  <option value="Personal Care/Cosmetics">Personal Care/Cosmetics</option>
                  <option value="Pet Care">Pet Care</option>
                  <option value="Household/Cleaning">Household/Cleaning</option>
                </select>
              </div>

              {/* Printing Process */}
              <div className={cn(
                "flex flex-col bg-gray-50 rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 shadow-sm transition-all",
                showValidationErrors && !formData.tech.printingProcess?.trim()
                  ? "border-red-500 bg-red-50/10"
                  : "border-gray-200"
              )}>
                <span className={cn(
                  "px-4 py-1.5 text-xs font-bold border-b shrink-0 flex items-center justify-between",
                  showValidationErrors && !formData.tech.printingProcess?.trim()
                    ? "bg-red-50/55 border-red-200 text-red-705 text-red-700 font-black"
                    : "bg-gray-100 border-gray-200 text-gray-600"
                )}>
                  <span>Printing Process</span>
                  {showValidationErrors && !formData.tech.printingProcess?.trim() && (
                    <span className="text-[10px] font-bold text-red-655 animate-pulse font-black">MISSED</span>
                  )}
                </span>
                <select 
                  disabled={readOnly} 
                  className="px-4 py-2.5 outline-none bg-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500 w-full font-bold text-gray-800 cursor-pointer" 
                  value={formData.tech.printingProcess || ''} 
                  onChange={e => updateNestedState('tech', 'printingProcess', e.target.value)}
                >
                  <option value="" className="text-gray-400 font-normal">Select Printing Process</option>
                  {printMethods.map((pm: string) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>

              {/* Print Type */}
              <div className={cn(
                "flex flex-col bg-gray-50 rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 shadow-sm transition-all",
                showValidationErrors && !formData.tech.printType?.trim()
                  ? "border-red-500 bg-red-50/10"
                  : "border-gray-200"
              )}>
                <span className={cn(
                  "px-4 py-1.5 text-xs font-bold border-b shrink-0 flex items-center justify-between",
                  showValidationErrors && !formData.tech.printType?.trim()
                    ? "bg-red-50/50 border-red-200 text-red-700 font-black"
                    : "bg-gray-100 border-gray-200 text-gray-600"
                )}>
                  <span>Print Type</span>
                  {showValidationErrors && !formData.tech.printType?.trim() && (
                    <span className="text-[10px] font-bold text-red-655 animate-pulse font-black">MISSED</span>
                  )}
                </span>
                <select 
                  disabled={readOnly} 
                  className="px-4 py-2.5 outline-none bg-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500 w-full font-bold text-gray-800 cursor-pointer" 
                  value={formData.tech.printType || ''} 
                  onChange={e => updateNestedState('tech', 'printType', e.target.value)}
                >
                  <option value="" className="text-gray-400 font-normal">Select Print Type</option>
                  <option value="Surface">Surface</option>
                  <option value="Reverse">Reverse</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              {/* Substrate Type */}
              <div className={cn(
                "flex flex-col bg-gray-50 rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 shadow-sm transition-all",
                showValidationErrors && !formData.tech.substrateType?.trim()
                  ? "border-red-500 bg-red-50/10"
                  : "border-gray-200"
              )}>
                <span className={cn(
                  "px-4 py-1.5 text-xs font-bold border-b shrink-0 flex items-center justify-between",
                  showValidationErrors && !formData.tech.substrateType?.trim()
                    ? "bg-red-50/50 border-red-200 text-red-700 font-black"
                    : "bg-gray-100 border-gray-200 text-gray-600"
                )}>
                  <span>Substrate Type</span>
                  {showValidationErrors && !formData.tech.substrateType?.trim() && (
                    <span className="text-[10px] font-bold text-red-655 animate-pulse font-black">MISSED</span>
                  )}
                </span>
                <select 
                  disabled={readOnly} 
                  className="px-4 py-2.5 outline-none bg-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500 w-full font-bold text-gray-800 cursor-pointer" 
                  value={formData.tech.substrateType || ''} 
                  onChange={e => updateNestedState('tech', 'substrateType', e.target.value)}
                >
                  <option value="" className="text-gray-400 font-normal">Select Substrate Type</option>
                  {printingSubstrates.map((sub: string) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

            </div>
          </section>

          {/* File Verification */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-250 pb-2 mb-4 flex items-center justify-between">
              <span>2. File Verification</span>
              {isAdmin && !readOnly && (
                <button 
                  onClick={() => {
                    setFileVerificationOptions([...fileVerificationOptions, "New preflight checklist rule..."]);
                    setFormData({ ...formData, fileVer: [...formData.fileVer, 'pending'] });
                  }}
                  className="text-sm font-bold text-pink-600 hover:text-pink-750 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add custom rule
                </button>
              )}
            </h2>
            <div className="space-y-3">
              {fileVerificationOptions.map((text, idx) => {
                const currentVal = formData.fileVer?.[idx] || 'pending';
                const isFieldMissed = showValidationErrors && currentVal === 'pending';
                
                return (
                  <div key={idx} className={cn(
                    "flex flex-col lg:flex-row lg:items-center justify-between p-3.5 bg-white rounded-xl border gap-4 transition-all duration-200",
                    isFieldMissed 
                      ? "border-red-400 bg-red-50/10 shadow-sm" 
                      : "border-gray-200 hover:border-pink-300"
                  )}>
                    <div className="flex items-start gap-3 w-full min-w-0">
                      <span className={cn(
                        "flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0 mt-0.5",
                        isFieldMissed ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                      )}>{idx + 1}</span>
                      
                      {isAdmin && !readOnly ? (
                        <input 
                          type="text" 
                          value={text}
                          onChange={(e) => {
                            const newOpts = [...fileVerificationOptions];
                            newOpts[idx] = e.target.value;
                            setFileVerificationOptions(newOpts);
                          }}
                          className="text-sm text-gray-800 outline-none border-b border-gray-300 focus:border-pink-500 w-full bg-transparent font-medium"
                        />
                      ) : (
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 font-semibold leading-relaxed break-words">{text}</p>
                          {isFieldMissed && (
                            <span className="text-[10px] font-black text-red-600 animate-pulse uppercase tracking-wider block mt-1">
                              ⚠️ Check Point is pending verification!
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto mt-2 lg:mt-0 border-t lg:border-0 pt-2.5 lg:pt-0">
                      {isFieldMissed && (
                        <span className="text-[10px] font-black text-red-655 lg:hidden uppercase tracking-widest">Missed checkbox</span>
                      )}
                      
                      <StatusDropdown 
                        disabled={readOnly}
                        value={currentVal} 
                        onChange={(val) => {
                          const currentVer = formData.fileVer || [];
                          const newVer = Array.isArray(currentVer) ? [...currentVer] : [];
                          if (idx >= newVer.length) {
                            newVer.length = idx + 1;
                          }
                          newVer[idx] = val;
                          setFormData({ ...formData, fileVer: newVer });
                        }} 
                      />
                      {isAdmin && !readOnly && (
                        <button
                          onClick={() => {
                            const newOpts = fileVerificationOptions.filter((_, i) => i !== idx);
                            const newVer = (formData.fileVer || []).filter((_, i) => i !== idx);
                            setFileVerificationOptions(newOpts);
                            setFormData({ ...formData, fileVer: newVer });
                          }}
                          className="text-gray-400 hover:text-red-655 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Scope of Work */}
          <section>
            <h2 className="text-lg font-bold text-gray-905 border-b border-gray-200 pb-2 mb-4 text-slate-900">3. Scope of Work</h2>
            <div className="space-y-4">
              
              {/* SOW 1 */}
              <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border gap-4 transition-all duration-150",
                showValidationErrors && (!formData.sow?.clarity || formData.sow.clarity === 'pending')
                  ? "border-red-400 bg-red-50/10 shadow-sm"
                  : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0 mt-0.5",
                    showValidationErrors && (!formData.sow?.clarity || formData.sow.clarity === 'pending')
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  )}>1</span>
                  <div>
                    <span className="text-sm text-gray-800 font-semibold leading-relaxed">Ensure clarity in the scope of work.</span>
                    {showValidationErrors && (!formData.sow?.clarity || formData.sow.clarity === 'pending') && (
                      <span className="text-[10px] font-bold text-red-600 block mt-0.5">⚠️ Required Response</span>
                    )}
                  </div>
                </div>
                <StatusDropdown disabled={readOnly} value={formData.sow?.clarity || 'pending'} onChange={val => updateNestedState('sow', 'clarity', val)} />
              </div>

              {/* SOW 2 */}
              <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border gap-4 transition-all duration-155",
                showValidationErrors && (!formData.sow?.specsProvided || formData.sow.specsProvided === 'pending')
                  ? "border-red-400 bg-red-50/10 shadow-sm"
                  : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0 mt-0.5",
                    showValidationErrors && (!formData.sow?.specsProvided || formData.sow.specsProvided === 'pending')
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  )}>2</span>
                  <div>
                    <span className="text-sm text-gray-800 font-semibold leading-relaxed">Check if print specifications are provided.</span>
                    {showValidationErrors && (!formData.sow?.specsProvided || formData.sow.specsProvided === 'pending') && (
                      <span className="text-[10px] font-bold text-red-600 block mt-0.5">⚠️ Required Response</span>
                    )}
                  </div>
                </div>
                <StatusDropdown disabled={readOnly} value={formData.sow?.specsProvided || 'pending'} onChange={val => updateNestedState('sow', 'specsProvided', val)} />
              </div>

              {/* SOW 3 */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span className="text-sm text-gray-850 font-semibold">Verify if all relevant reference documents are provided.</span>
                </div>
                <div className="flex flex-wrap gap-4 pl-0 sm:pl-9 mt-1">
                  {['Structural', 'Layout', 'Content', 'Color', 'Element'].map((item) => {
                    const key = item.toLowerCase();
                    const isChecked = !!(formData.sow?.refs && (formData.sow.refs as any)[key]);
                    return (
                      <button 
                        key={key} 
                        disabled={readOnly}
                        type="button"
                        onClick={() => !readOnly && updateDeepNestedState('sow', 'refs', key, !isChecked)}
                        className={cn(
                          "flex items-center gap-2 outline-none rounded p-1 transition-colors",
                          readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer group focus:ring-2 focus:ring-pink-500"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-all",
                          isChecked ? "bg-pink-600 border-pink-600 shadow-sm" : "border-gray-300 bg-white group-hover:border-pink-400"
                        )}>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm text-gray-700 font-bold">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SOW 4 */}
              <div className="flex flex-col p-4 bg-white rounded-xl border border-gray-200 gap-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0">4</span>
                    <span className="text-sm text-gray-800 font-semibold">Determine the number of jobs booked within the job range.</span>
                  </div>
                  <input 
                    type="number" 
                    disabled={readOnly}
                    value={formData.sow?.jobsBooked || ''}
                    onChange={e => updateNestedState('sow', 'jobsBooked', e.target.value)}
                    className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm text-center font-extrabold text-pink-600 disabled:bg-gray-50"
                    placeholder="Count"
                  />
                </div>
                <div className="pl-0 sm:pl-9 pr-1 mt-1">
                  <input 
                    type="text" 
                    disabled={readOnly}
                    value={formData.sow?.projectNumbersText || ''}
                    onChange={e => updateNestedState('sow', 'projectNumbersText', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm disabled:bg-gray-50 font-bold"
                    placeholder="Enter the project numbers (e.g., PRJ-101, PRJ-102)"
                  />
                </div>
              </div>

              {/* SOW 5 */}
              <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border gap-4 transition-all duration-150",
                showValidationErrors && (!formData.sow?.briefClear || formData.sow.briefClear === 'pending')
                  ? "border-red-400 bg-red-50/10 shadow-sm"
                  : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0 mt-0.5",
                    showValidationErrors && (!formData.sow?.briefClear || formData.sow.briefClear === 'pending')
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  )}>5</span>
                  <div>
                    <span className="text-sm text-gray-800 font-semibold leading-relaxed">Confirm that client brief information is clear.</span>
                    {showValidationErrors && (!formData.sow?.briefClear || formData.sow.briefClear === 'pending') && (
                      <span className="text-[10px] font-bold text-red-655 block mt-0.5">⚠️ Required Response</span>
                    )}
                  </div>
                </div>
                <StatusDropdown disabled={readOnly} value={formData.sow?.briefClear || 'pending'} onChange={val => updateNestedState('sow', 'briefClear', val)} />
              </div>

              {/* SOW 6: Brief Categories Count (Layout flow enhanced to prevent overlaps) */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0">6</span>
                  <span className="text-sm text-gray-850 font-semibold leading-relaxed">
                    Understand the number of briefs provided in the following categories:
                  </span>
                </div>
                
                {/* Fixed Overlap by using wraps with flex pattern */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pl-0 sm:pl-9 pt-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-650 font-bold min-w-[70px]">Addition:</span>
                    <input 
                      type="number" 
                      disabled={readOnly} 
                      value={formData.sow?.briefs?.addition || ''} 
                      onChange={e => updateDeepNestedState('sow', 'briefs', 'addition', e.target.value)} 
                      className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 font-bold text-center text-slate-800" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-655 font-bold min-w-[70px]">Deletion:</span>
                    <input 
                      type="number" 
                      disabled={readOnly} 
                      value={formData.sow?.briefs?.deletion || ''} 
                      onChange={e => updateDeepNestedState('sow', 'briefs', 'deletion', e.target.value)} 
                      className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 font-bold text-center text-slate-800" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-660 font-bold min-w-[95px]">Replacement:</span>
                    <input 
                      type="number" 
                      disabled={readOnly} 
                      value={formData.sow?.briefs?.replacement || ''} 
                      onChange={e => updateDeepNestedState('sow', 'briefs', 'replacement', e.target.value)} 
                      className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 font-bold text-center text-slate-800" 
                      placeholder="0" 
                    />
                  </div>
                </div>
              </div>

              {/* SOW 7: Production Art Engineer Scope Changes - Fixed whitespace compression overlap! */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-gray-200 gap-4 shadow-sm">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0 mt-0.5">7</span>
                  <span className="text-sm text-gray-800 font-semibold break-words">
                    Production Art Engineer Scope Changes related to:
                  </span>
                </div>
                <input 
                  type="text" 
                  disabled={readOnly}
                  value={formData.sow?.scopeChanges || ''}
                  onChange={e => updateNestedState('sow', 'scopeChanges', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm w-full md:max-w-md disabled:bg-gray-50 font-bold"
                  placeholder="Details of adjustments..."
                />
              </div>

            </div>
          </section>

          {/* Query Management */}
          <section>
            <h2 className="text-lg font-bold text-gray-905 border-b border-gray-200 pb-2 mb-4 text-slate-900">4. Query Management</h2>
            <div className="space-y-4">
              
              {/* Query 1 */}
              <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border gap-4 transition-all duration-150",
                showValidationErrors && (!formData.query?.meetingNecessary || formData.query.meetingNecessary === 'pending')
                  ? "border-red-400 bg-red-50/10 shadow-sm"
                  : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0 mt-0.5",
                    showValidationErrors && (!formData.query?.meetingNecessary || formData.query.meetingNecessary === 'pending')
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  )}>1</span>
                  <div>
                    <span className="text-sm text-gray-800 font-semibold leading-relaxed">Determine if a project meeting is necessary.</span>
                    {showValidationErrors && (!formData.query?.meetingNecessary || formData.query.meetingNecessary === 'pending') && (
                      <span className="text-[10px] font-bold text-red-655 block mt-0.5">⚠️ Required Response</span>
                    )}
                  </div>
                </div>
                <StatusDropdown disabled={readOnly} value={formData.query?.meetingNecessary || 'pending'} onChange={val => updateNestedState('query', 'meetingNecessary', val)} />
              </div>

              {/* Query 2 sub-options grid - Fixed layout cramping overlaps entirely */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0">2</span>
                  <span className="text-sm text-gray-850 font-semibold leading-relaxed">Address queries related to:</span>
                </div>
                
                {/* Beautiful simplified toggle cards with YES / N/A selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pl-0 sm:pl-9 mt-1">
                  {['Brief', 'Doc', 'PSpec', 'Links', 'Base File', 'Fonts', 'Color'].map((item) => {
                    const key = item === 'Base File' ? 'baseFile' : item.toLowerCase();
                    const currentValue = formData.query?.address?.[key] || 'pending';
                    const isChecked = currentValue !== 'pending';
                    const hasError = showValidationErrors && !isChecked;
                    
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex flex-col p-3 rounded-xl border gap-2.5 transition-all duration-200 w-full min-w-0 shadow-sm",
                          currentValue === 'yes'
                            ? "border-emerald-500 bg-emerald-50/20"
                            : currentValue === 'na'
                              ? "border-slate-400 bg-slate-50/50"
                              : hasError
                                ? "border-red-400 bg-red-50/10 animate-pulse"
                                : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <div className="flex justify-between items-center min-w-0">
                          <span className={cn(
                            "text-sm font-extrabold tracking-wide break-words",
                            currentValue === 'yes' ? "text-emerald-950" : currentValue === 'na' ? "text-slate-700" : "text-slate-800"
                          )}>
                            {item}
                          </span>
                          {hasError && (
                            <span className="text-[10px] font-black text-red-655 uppercase tracking-widest mt-0.5 animate-pulse shrink-0">
                              Missed
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-0.5" role="group">
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => {
                              const newVal = currentValue === 'yes' ? 'pending' : 'yes';
                              updateDeepNestedState('query', 'address', key, newVal);
                            }}
                            className={cn(
                              "flex-1 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border rounded-lg transition-all focus:outline-none focus:ring-2 shadow-sm text-center",
                              readOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                              currentValue === 'yes'
                                ? "bg-emerald-600 border-emerald-650 text-white focus:ring-emerald-400"
                                : "bg-white border-gray-200 text-emerald-700 hover:bg-emerald-50/60"
                            )}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => {
                              const newVal = currentValue === 'na' ? 'pending' : 'na';
                              updateDeepNestedState('query', 'address', key, newVal);
                            }}
                            className={cn(
                              "flex-1 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border rounded-lg transition-all focus:outline-none focus:ring-2 shadow-sm text-center",
                              readOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                              currentValue === 'na'
                                ? "bg-slate-700 border-slate-750 text-white focus:ring-slate-400"
                                : "bg-white border-gray-200 text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            N/A
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Query 3 */}
              <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border gap-4 transition-all duration-150",
                showValidationErrors && (!formData.query?.trackerUpdated || formData.query.trackerUpdated === 'pending')
                  ? "border-red-400 bg-red-50/10 shadow-sm"
                  : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0 mt-0.5",
                    showValidationErrors && (!formData.query?.trackerUpdated || formData.query.trackerUpdated === 'pending')
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  )}>3</span>
                  <div>
                    <span className="text-sm text-gray-800 font-semibold leading-relaxed">Update queries in the Query tracker.</span>
                    {showValidationErrors && (!formData.query?.trackerUpdated || formData.query.trackerUpdated === 'pending') && (
                      <span className="text-[10px] font-bold text-red-655 block mt-0.5">⚠️ Required Response</span>
                    )}
                  </div>
                </div>
                <StatusDropdown disabled={readOnly} value={formData.query?.trackerUpdated || 'pending'} onChange={val => updateNestedState('query', 'trackerUpdated', val)} />
              </div>

            </div>
          </section>

          {/* Notes for Production */}
          <section>
            <h2 className="text-lg font-bold text-gray-955 border-b border-gray-200 pb-2 mb-4 text-slate-900">Note for Production</h2>
            <textarea
              className="w-full h-32 p-4 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 resize-none text-sm disabled:bg-gray-50 disabled:text-gray-500 font-medium"
              placeholder="Enter any additional notes for production..."
              disabled={readOnly}
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </section>

        </div>

        {/* Footer Actions */}
        {!readOnly && (
          <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            <div className="text-xs text-gray-500 font-bold">
              Check all fields carefully before submitting your work.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {showResetConfirm ? (
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-800">Clear all selections?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        clientName: '',
                        projectNumber: '',
                        version: '',
                        date: new Date().toISOString().split('T')[0],
                        tech: {
                          typeOfPackaging: '',
                          packType: '',
                          productCategory: '',
                          printingProcess: '',
                          printType: '',
                          substrateType: ''
                        },
                        fileVer: Array(8).fill('pending'),
                        sow: {
                          clarity: 'pending',
                          specsProvided: 'pending',
                          refs: {
                            structural: false,
                            layout: false,
                            content: false,
                            color: false,
                            element: false
                          },
                          jobsBooked: '',
                          projectNumbersText: '',
                          briefClear: 'pending',
                          briefs: {
                            addition: '',
                            deletion: '',
                            replacement: ''
                          },
                          scopeChanges: ''
                        },
                        query: {
                          meetingNecessary: 'pending',
                          address: {
                            brief: 'pending',
                            doc: 'pending',
                            pspec: 'pending',
                            links: 'pending',
                            baseFile: 'pending',
                            fonts: 'pending',
                            color: 'pending'
                          },
                          trackerUpdated: 'pending'
                        },
                        notes: ''
                      });
                      setShowValidationErrors(false);
                      setShowResetConfirm(false);
                    }}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowResetConfirm(true)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Reset Checklist
                </button>
              )}
              <button 
                onClick={async () => {
                  const checkStats = getValidationStats();
                  if (checkStats.missingCount > 0) {
                    setShowValidationErrors(true);
                    alert(`⚠️ Your pre-flight checklist is incomplete! There are ${checkStats.missingCount} pending check points highlighted in red. Please review them.`);
                  }
                  
                  if (onSave) {
                    setIsSaving(true);
                    try {
                      await onSave(formData);
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }}
                disabled={isSaving}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-extrabold text-white shadow-md transition-colors flex items-center gap-2 cursor-pointer",
                  isSaving ? "bg-pink-400 cursor-not-allowed shadow-none" : "bg-pink-600 hover:bg-pink-100 bg-pink-600 hover:bg-pink-700 shadow-pink-205"
                )}
              >
                <Save className="w-4 h-4" /> 
                {isSaving ? "Saving..." : "Save Checklist"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const StatusDropdown = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
  const opts = [
    { key: 'yes', label: 'YES', activeBg: 'bg-green-600 border-green-650 text-white focus:ring-green-400', inactiveBg: 'bg-white border-gray-200 text-green-700 hover:bg-green-50' },
    { key: 'no', label: 'NO', activeBg: 'bg-red-600 border-red-655 text-white focus:ring-red-400', inactiveBg: 'bg-white border-gray-200 text-red-700 hover:bg-red-50' },
    { key: 'na', label: 'N/A', activeBg: 'bg-gray-700 border-gray-750 text-white focus:ring-gray-300', inactiveBg: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100' },
    { key: 'query', label: 'QUERY', activeBg: 'bg-amber-500 border-amber-550 text-white focus:ring-amber-300', inactiveBg: 'bg-white border-gray-200 text-amber-700 hover:bg-amber-50' }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, curKey: string) => {
    if (disabled) return;
    const key = e.key.toLowerCase();
    if (key === 'y') {
      onChange('yes');
      e.preventDefault();
    } else if (key === 'n') {
      onChange('no');
      e.preventDefault();
    } else if (key === 'a') {
      onChange('na');
      e.preventDefault();
    } else if (key === 'q') {
      onChange('query');
      e.preventDefault();
    } else if (e.key === ' ' || e.key === 'Enter') {
      onChange(curKey);
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 shrink-0" role="group">
      {opts.map((opt) => {
        const isSelected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(opt.key);
            }}
            onKeyDown={(e) => handleKeyDown(e, opt.key)}
            className={cn(
              "w-[64px] sm:w-[74px] h-[28px] sm:h-[32px] flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-wider border rounded-lg transition-all focus:outline-none focus:ring-2 shadow-sm",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              isSelected 
                ? opt.activeBg
                : opt.inactiveBg
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

