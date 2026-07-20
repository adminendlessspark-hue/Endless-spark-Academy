import React, { useState } from 'react';
import { Save, CheckCircle2, FileCheck, ShieldAlert } from 'lucide-react';
import { cn } from '../utils';
import { useSettings } from '../hooks/useSettings';

const TECHNICAL_FIELD_OPTIONS: Record<string, string[]> = {
  typeOfPackaging: ['Primary', 'Secondary', 'Tertiary'],
  packType: ['Pouch', 'Folding Carton', 'Label', 'Shrink Sleeve', 'Tube', 'Can', 'Blister Pack', 'Corrugated Box', 'Flow Wrap'],
  productCategory: ['Food & Beverage', 'Pharmaceutical', 'Personal Care/Cosmetics', 'Pet Care', 'Household/Cleaning'],
  substrateType: ['Paperboard', 'Kraft Paper', 'Plastic Film', 'Poly white', 'Corrugated Cardboard', 'Metal (Tin/Aluminum)'],
  printingProcess: ['Flexo', 'Offset', 'Digital', 'Gravure', 'Screen Printing'],
  printType: ['Surface', 'Reverse', 'Both']
};

const SECTIONS = {
  preflight: [
    "Client Annotation PDF and Supplied PDF are same?",
    "Confirm that the supplied AI file and PDF are identical (Server) (Check timestamp)",
    "Ensure variant name, net weight, matching design file, and brief information."
  ],
  instruction: [
    "Checked Client Provided documents & Brief information?",
    "Checked the Print Spec",
    "Check Structural Drawing is 1:1",
    "Check the Structural Drawing annotation",
    "Check Structural Drawing is overprint",
    "Variant name, SKU are matching with supplied documents",
    "Checked Structural Drawing instruction, Panel orientation and Dimensions",
    "Checked Aesthetic of artwork, edited text alignment (good layout and Visibility of elements)",
    "Got Confirmation from client for the proactive decisions",
    "Consistency of brand across region is consider",
    "Replicate the elements properly Place Etach Panel",
    "Brand Guideline followed in artwork (Guideline particular artwork)",
    "Checked for the 'Online Coding area size, Position and Color",
    "Spell-check done, Superscript and Subscript are corrected"
  ],
  code: [
    "Check the barcode information match with Brief",
    "QR or Data matrices code match with Brief"
  ],
  mandate: [
    "Checked Legal requirement updated",
    "Check Brand Guideline followed Artwork"
  ],
  illustrator: [
    "Check document raster setting in 300 dpi",
    "Check layer content are correct and Artboard outside elements are remove.",
    "Check layer name and structure are correct.",
    "Check embedded links. Swatches name / Colour as per std.",
    "Checked the unwanted Swatches, Barcode, Brush, Style appearance",
    "Check process colour in ink-manager & Ink manager setting.",
    "Checked for the updating of non-visible stations and Thumbnail Updated"
  ],
  image: [
    "Checked the Link file name",
    "Checked the color mode in CMYK",
    "Checked the Resolution of the image is above 300 dpi",
    "Checked 1:1 link used in artwork",
    "Checked the Link path (all should be from respective folder)"
  ],
  compare: [
    "Checked in animation and difference mode in 400% zoom level (Base Compare)",
    "Element Compare (Tiled the documents and compared all elements for ED Change or Different SKU)",
    "Checked with range compare",
    "Checked ED Compare",
    "Check Common plate"
  ],
  printerSpec: [
    "Check line thickness pos / neg",
    "Check Min. text size pos / rev [pt]",
    "Bleed, Rollover and Type Safety",
    "Min. dot size on file",
    "Check Finishing operation separation match with design file"
  ],
  legend: [
    "Check number of Color and Colour Sequence",
    "General and Technical information match with Brief",
    "Color Sequence Match with Brief"
  ]
};

export default function ProductionArtChecklist({
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
  const { printMethods, printingSubstrates } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fieldOptions = {
    ...TECHNICAL_FIELD_OPTIONS,
    printingProcess: printMethods,
    substrateType: printingSubstrates,
  };
  const [formData, setFormData] = useState(() => {
    const defaultFormData = {
      tech: {
        typeOfPackaging: '',
        packType: '',
        productCategory: '',
        printingProcess: printerSpec?.printMethod || '',
        printType: '',
        substrateType: printerSpec?.printingSubstrate || ''
      },
      preflight: Array(3).fill('pending'),
      instruction: Array(14).fill('pending'),
      code: Array(2).fill('pending'),
      mandate: Array(2).fill('pending'),
      illustrator: Array(7).fill('pending'),
      barcode: {
        status: 'pending',
        colour: false, type: false, magnification: false, bwr: false
      },
      eyeMark: {
        status: 'pending',
        position: false, colour: false, size: false, dimension: false
      },
      image: Array(5).fill('pending'),
      compare: Array(5).fill('pending'),
      printerSpec: Array(5).fill('pending'),
      legend: Array(3).fill('pending'),
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
      barcode: { ...defaultFormData.barcode, ...(initialData.barcode || {}) },
      eyeMark: { ...defaultFormData.eyeMark, ...(initialData.eyeMark || {}) },
      preflight: initialData.preflight || defaultFormData.preflight,
      instruction: initialData.instruction || defaultFormData.instruction,
      code: initialData.code || defaultFormData.code,
      mandate: initialData.mandate || defaultFormData.mandate,
      illustrator: initialData.illustrator || defaultFormData.illustrator,
      image: initialData.image || defaultFormData.image,
      compare: initialData.compare || defaultFormData.compare,
      printerSpec: initialData.printerSpec || defaultFormData.printerSpec,
      legend: initialData.legend || defaultFormData.legend
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
          printingProcess: initialData.tech?.printingProcess || printerSpec?.printMethod || prev.tech?.printingProcess || '',
          substrateType: initialData.tech?.substrateType || printerSpec?.printingSubstrate || prev.tech?.substrateType || ''
        },
        barcode: { ...(prev.barcode || {}), ...(initialData.barcode || {}) },
        eyeMark: { ...(prev.eyeMark || {}), ...(initialData.eyeMark || {}) }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedInitial, serializedPrinterSpec]);

  const updateSectionArray = (section: keyof typeof formData, idx: number, value: string) => {
    setFormData((prev: any) => {
      const currentSection = prev[section] || [];
      const arr = Array.isArray(currentSection) ? [...currentSection] : [];
      arr[idx] = value;
      return { ...prev, [section]: arr };
    });
  };

  const updateTech = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tech: { ...(prev.tech || {}), [field]: value }
    }));
  };

  const updateBaseObject = (section: keyof typeof formData, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value }
    }));
  };

  return (
    <div className="w-full bg-white rounded-2xl overflow-hidden font-sans border border-gray-100">
      
      {readOnly && !isAdmin && (
        <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 animate-pulse" />
          <p className="text-sm font-bold text-amber-800">
            Checklist is Locked. <span className="text-pink-700 underline underline-offset-2">START TIMER</span> in the project header to begin your review.
          </p>
        </div>
      )}

      <div className="p-4 md:p-8">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
        <div className="p-3 bg-pink-100 rounded-xl text-pink-600">
          <FileCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-905 tracking-tight text-slate-950">Production Art Engineer Checklist</h1>
          <p className="text-sm text-gray-500 font-medium">Quality Being with Process</p>
        </div>
      </div>

      {/* Pre-flight Technical Verification */}
      <section className="mt-4">
        <h2 className="text-lg font-bold text-gray-905 border-b border-gray-200 pb-2 mb-4 text-slate-905">Pre-flight</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {['typeOfPackaging', 'packType', 'productCategory', 'substrateType', 'printingProcess', 'printType'].map((field, idx) => {
            const options = (fieldOptions as any)[field];
            const displayLabel = field.replace(/([A-Z])/g, ' $1').trim();
            return (
              <div key={field} className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1">{displayLabel}</label>
                {options ? (
                  <select
                    disabled={readOnly}
                    value={(formData.tech && (formData.tech as any)[field]) || ''}
                    onChange={e => updateTech(field, e.target.value)}
                    className="px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm disabled:bg-gray-50 disabled:text-gray-500 cursor-pointer"
                  >
                    <option value="">Select {displayLabel}</option>
                    {options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    disabled={readOnly}
                    value={(formData.tech && (formData.tech as any)[field]) || ''}
                    onChange={e => updateTech(field, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="space-y-3">
          {SECTIONS.preflight.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-gray-200 gap-4 hover:border-pink-200 transition-colors">
              <div className="flex items-start gap-3 flex-1 pb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0">{idx + 7}</span>
                <span className="text-sm text-gray-700 pt-0.5">{item}</span>
              </div>
              <StatusDropdown value={(formData.preflight && formData.preflight[idx]) || 'pending'} onChange={val => updateSectionArray('preflight', idx, val)} disabled={readOnly} />
            </div>
          ))}
        </div>
      </section>

      <SectionBlock 
        title="Instruction" 
        sectionKey="instruction" 
        items={SECTIONS.instruction} 
        formData={formData} 
        updateSectionArray={updateSectionArray} 
        readOnly={readOnly} 
      />
      
      <SectionBlock 
        title="Code" 
        sectionKey="code" 
        items={SECTIONS.code} 
        formData={formData} 
        updateSectionArray={updateSectionArray} 
        readOnly={readOnly} 
      />
      
      <SectionBlock 
        title="Mandate" 
        sectionKey="mandate" 
        items={SECTIONS.mandate} 
        formData={formData} 
        updateSectionArray={updateSectionArray} 
        readOnly={readOnly} 
      />

      <SectionBlock 
        title="Illustrator" 
        sectionKey="illustrator" 
        items={SECTIONS.illustrator} 
        formData={formData} 
        updateSectionArray={updateSectionArray} 
        readOnly={readOnly} 
      />

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-905 border-b border-gray-200 pb-2 mb-4 text-slate-905">Barcode</h2>
        <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4 hover:border-pink-200 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-start gap-3 flex-1 pb-1">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0">1</span>
              <span className="text-sm text-gray-700 pt-0.5">Check barcode number match with brief</span>
            </div>
            <StatusDropdown value={formData.barcode?.status || 'pending'} onChange={val => updateBaseObject('barcode', 'status', val)} disabled={readOnly} />
          </div>
          <div className="flex flex-wrap gap-4 pl-9">
            {['Colour', 'Type', 'Magnification', 'BWR'].map(prop => {
              const key = prop.toLowerCase();
              const isChecked = !!(formData.barcode && (formData.barcode as any)[key]);
              return (
                <button 
                  key={key} 
                  disabled={readOnly}
                  type="button"
                  onClick={() => !readOnly && updateBaseObject('barcode', key, !isChecked)}
                  className="flex items-center gap-2 cursor-pointer group outline-none rounded p-1 hover:bg-gray-50"
                >
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                    isChecked ? "bg-pink-600 border-pink-600" : "border-gray-300 bg-white"
                  )}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">{prop}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-950 border-b border-gray-200 pb-2 mb-4 text-slate-950">Eye mark</h2>
        <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4 hover:border-pink-200 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-start gap-3 flex-1 pb-1">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0">1</span>
              <span className="text-sm text-gray-700 pt-0.5">Check eye mark</span>
            </div>
            <StatusDropdown value={formData.eyeMark?.status || 'pending'} onChange={val => updateBaseObject('eyeMark', 'status', val)} disabled={readOnly} />
          </div>
          <div className="flex flex-wrap gap-4 pl-9">
            {['Position', 'Colour', 'Size', 'Dimension'].map(prop => {
              const key = prop.toLowerCase();
              const isChecked = !!(formData.eyeMark && (formData.eyeMark as any)[key]);
              return (
                <button 
                  key={key} 
                  disabled={readOnly}
                  type="button"
                  onClick={() => !readOnly && updateBaseObject('eyeMark', key, !isChecked)}
                  className="flex items-center gap-2 cursor-pointer group outline-none rounded p-1 hover:bg-gray-50"
                >
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                    isChecked ? "bg-pink-600 border-pink-600" : "border-gray-300 bg-white"
                  )}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">{prop}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <SectionBlock 
        title="Image" 
        sectionKey="image" 
        items={SECTIONS.image} 
        formData={formData} 
        updateSectionArray={updateSectionArray} 
        readOnly={readOnly} 
      />
      
      <SectionBlock 
        title="Compare" 
        sectionKey="compare" 
        items={SECTIONS.compare} 
        formData={formData} 
        updateSectionArray={updateSectionArray} 
        readOnly={readOnly} 
      />
      
      <SectionBlock 
        title="Printer Spec" 
        sectionKey="printerSpec" 
        items={SECTIONS.printerSpec} 
        formData={formData} 
        updateSectionArray={updateSectionArray} 
        readOnly={readOnly} 
      />
      
      <SectionBlock 
        title="Legend" 
        sectionKey="legend" 
        items={SECTIONS.legend} 
        formData={formData} 
        updateSectionArray={updateSectionArray} 
        readOnly={readOnly} 
      />

      {!readOnly && (
        <div className="mt-8 bg-gray-50 p-6 md:p-8 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          {showResetConfirm ? (
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-800">Clear all selections?</span>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    tech: {
                      typeOfPackaging: '',
                      packType: '',
                      productCategory: '',
                      substrateType: '',
                      printingProcess: '',
                      printType: ''
                    },
                    preflight: Array(3).fill('pending'),
                    instruction: Array(14).fill('pending'),
                    code: Array(2).fill('pending'),
                    mandate: Array(2).fill('pending'),
                    illustrator: Array(7).fill('pending'),
                    barcode: {
                      status: 'pending',
                      colour: false, type: false, magnification: false, bwr: false
                    },
                    eyeMark: {
                      status: 'pending',
                      position: false, colour: false, size: false, dimension: false
                    },
                    image: Array(5).fill('pending'),
                    compare: Array(5).fill('pending'),
                    printerSpec: Array(5).fill('pending'),
                    legend: Array(3).fill('pending'),
                  });
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
            type="button"
            onClick={async () => {
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
              "px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-colors flex items-center gap-2 w-full sm:w-auto justify-center",
              isSaving ? "bg-pink-400 cursor-not-allowed shadow-none" : "bg-pink-600 hover:bg-pink-700 shadow-pink-200"
            )}
          >
            <Save className="w-4 h-4" /> 
            {isSaving ? "Saving..." : "Save Checklist"}
          </button>
        </div>
      )}

    </div>
    </div>
  );
}

const StatusDropdown = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
  const opts = [
    { key: 'yes', label: 'YES', activeBg: 'bg-green-600 border-green-650 text-white focus:ring-green-400', inactiveBg: 'bg-white border-gray-200 text-green-700 hover:bg-green-50' },
    { key: 'no', label: 'NO', activeBg: 'bg-red-600 border-red-650 text-white focus:ring-red-400', inactiveBg: 'bg-white border-gray-200 text-red-700 hover:bg-red-50' },
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

interface SectionBlockProps {
  title: string;
  sectionKey: string;
  items: string[];
  offset?: number;
  formData: any;
  updateSectionArray: (section: any, idx: number, value: string) => void;
  readOnly?: boolean;
}

const SectionBlock = ({ title, sectionKey, items, offset = 1, formData, updateSectionArray, readOnly }: SectionBlockProps) => (
  <section className="mt-8">
    <h2 className="text-lg font-bold text-gray-905 border-b border-gray-200 pb-2 mb-4 text-slate-905">{title}</h2>
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-gray-200 gap-4 hover:border-pink-200 transition-colors">
          <div className="flex items-start gap-3 flex-1 pb-1">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 text-xs font-bold shrink-0">{idx + offset}</span>
            <span className="text-sm text-gray-700 pt-0.5">{item}</span>
          </div>
          <StatusDropdown 
            value={((formData as any)[sectionKey] && (formData as any)[sectionKey][idx]) || 'pending'} 
            onChange={val => updateSectionArray(sectionKey, idx, val)} 
            disabled={readOnly}
          />
        </div>
      ))}
    </div>
  </section>
);
