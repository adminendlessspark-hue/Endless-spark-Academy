import React, { useState } from 'react';
import { Save, AlertTriangle, CheckSquare, Square, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '../utils';

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

interface ReworkItem {
  id: string; 
  sectionName: string;
  sectionKey: string;
  index?: number;
  text: string;
}

export function extractReworkItems(qcProduction: any): ReworkItem[] {
  if (!qcProduction) return [];
  const items: ReworkItem[] = [];

  const sectionLabelMap: Record<string, string> = {
    preflight: "Pre-flight",
    instruction: "Instruction",
    code: "Code",
    mandate: "Mandate",
    illustrator: "Illustrator Layout/Settings",
    image: "Linked Images",
    compare: "Comparison",
    printerSpec: "Printer Specification",
    legend: "Legend Color Sequence"
  };

  Object.entries(SECTIONS).forEach(([sectionKey, checklistArray]) => {
    const qcStatuses = qcProduction[sectionKey];
    if (Array.isArray(qcStatuses)) {
      qcStatuses.forEach((status, idx) => {
        if (status === 'rework') {
          items.push({
            id: `${sectionKey}_${idx}`,
            sectionKey,
            sectionName: sectionLabelMap[sectionKey] || sectionKey,
            index: idx,
            text: checklistArray[idx] || `Checkpoint ${idx + 1}`
          });
        }
      });
    }
  });

  // Barcode section
  if (qcProduction.barcode?.status === 'rework') {
    const flags: string[] = [];
    if (qcProduction.barcode.colour) flags.push('Colour');
    if (qcProduction.barcode.type) flags.push('Type');
    if (qcProduction.barcode.magnification) flags.push('Magnification');
    if (qcProduction.barcode.bwr) flags.push('BWR');
    
    let text = "Check barcode information matches brief";
    if (flags.length > 0) {
      text += ` (Flagged details: ${flags.join(', ')})`;
    }
    items.push({
      id: 'barcode',
      sectionKey: 'barcode',
      sectionName: 'Barcode Check',
      text
    });
  }

  // Eye mark section
  if (qcProduction.eyeMark?.status === 'rework') {
    const flags: string[] = [];
    if (qcProduction.eyeMark.position) flags.push('Position');
    if (qcProduction.eyeMark.colour) flags.push('Colour');
    if (qcProduction.eyeMark.size) flags.push('Size');
    if (qcProduction.eyeMark.dimension) flags.push('Dimension');

    let text = "Check eye mark settings";
    if (flags.length > 0) {
      text += ` (Flagged details: ${flags.join(', ')})`;
    }
    items.push({
      id: 'eyeMark',
      sectionKey: 'eyeMark',
      sectionName: 'Eye Mark Check',
      text
    });
  }

  return items;
}

export default function ProductionReworkChecklist({
  qcProductionData,
  initialReworkData,
  onSave,
  readOnly = false
}: {
  qcProductionData: any;
  initialReworkData?: Record<string, 'pending' | 'completed'>;
  onSave?: (data: Record<string, 'pending' | 'completed'>) => Promise<void> | void;
  readOnly?: boolean;
}) {
  const reworkItems = extractReworkItems(qcProductionData);
  const [isSaving, setIsSaving] = useState(false);
  
  const [progress, setProgress] = useState<Record<string, 'pending' | 'completed'>>(() => {
    const initial: Record<string, 'pending' | 'completed'> = {};
    reworkItems.forEach(item => {
      initial[item.id] = initialReworkData?.[item.id] || 'pending';
    });
    return initial;
  });

  // Synchronize when initialReworkData or qcProductionData updates
  React.useEffect(() => {
    const newProgress: Record<string, 'pending' | 'completed'> = {};
    reworkItems.forEach(item => {
      newProgress[item.id] = initialReworkData?.[item.id] || 'pending';
    });
    setProgress(newProgress);
  }, [JSON.stringify(initialReworkData || null), JSON.stringify(qcProductionData || null)]);

  const toggleItemProgress = (itemId: string) => {
    if (readOnly) return;
    setProgress(prev => ({
      ...prev,
      [itemId]: prev[itemId] === 'completed' ? 'pending' : 'completed'
    }));
  };

  if (reworkItems.length === 0) {
    return (
      <div className="p-8 text-center bg-green-50/50 border border-green-150 rounded-2xl">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <h4 className="font-bold text-green-950">QC Rework Checklist Clear</h4>
        <p className="text-xs text-green-700 mt-1 max-w-sm mx-auto">
          No points flagged for rework by Quality Control. Your work alignment is pristine.
        </p>
      </div>
    );
  }

  const completedCount = reworkItems.filter(item => progress[item.id] === 'completed').length;
  const progressPercent = Math.round((completedCount / reworkItems.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 md:p-6 border-b border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-600 animate-spin-reverse" />
            <h3 className="text-base md:text-lg font-black text-orange-950 tracking-tight font-sans">
              Production Rework Checklist
            </h3>
          </div>
          <p className="text-xs text-orange-850 mt-1">
            Re-verify and fix the specific checkpoints flagged with <span className="font-extrabold uppercase text-orange-600">REWORK</span> by QC.
          </p>
        </div>
        
        {/* Progress Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-orange-850 font-bold">{completedCount} of {reworkItems.length} Solved</div>
            <div className="text-[10px] text-gray-400">Rework Completion</div>
          </div>
          <div className="w-20 bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-150">
            <div 
              className="bg-orange-500 h-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          <span className="text-xs font-black text-orange-600 w-8">{progressPercent}%</span>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-3.5 bg-white">
        {reworkItems.map((item, idx) => {
          const isCompleted = progress[item.id] === 'completed';
          return (
            <div 
              key={item.id}
              onClick={() => toggleItemProgress(item.id)}
              className={cn(
                "p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer",
                isCompleted 
                  ? "bg-green-50/40 border-green-200 shadow-sm" 
                  : "bg-amber-50/20 border-amber-200 hover:border-orange-300"
              )}
            >
              <button
                type="button"
                disabled={readOnly}
                className={cn(
                  "mt-0.5 w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 transition-colors focus:ring-2 focus:ring-orange-300",
                  isCompleted 
                    ? "bg-green-600 border-green-600" 
                    : "bg-white border-orange-350"
                )}
              >
                {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
              </button>
              
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[9px] uppercase font-bold text-orange-800 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                    {item.sectionName}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">
                    Point #{item.index !== undefined ? item.index + 1 : idx + 1}
                  </span>
                  {isCompleted ? (
                    <span className="text-[9px] font-black text-green-700 bg-green-100/60 px-1.5 py-0.5 rounded uppercase">
                      FIXED
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-orange-700 bg-orange-100/60 px-1.5 py-0.5 rounded uppercase animate-pulse">
                      Needs Rework
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 leading-relaxed font-sans">{item.text}</p>
              </div>
            </div>
          );
        })}

        {!readOnly && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={async () => {
                if (onSave) {
                  setIsSaving(true);
                  try {
                    await onSave(progress);
                    alert("Production Rework Checklist progress saved securely!");
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
              disabled={isSaving}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-colors flex items-center gap-2 uppercase tracking-wide text-xs font-sans",
                isSaving ? "bg-orange-400 cursor-not-allowed shadow-none" : "bg-orange-600 hover:bg-orange-700 shadow-orange-100 cursor-pointer"
              )}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Rework Checklist"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
