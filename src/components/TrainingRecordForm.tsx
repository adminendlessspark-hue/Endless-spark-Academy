import React, { useState, useRef, useEffect } from 'react';
import { FileText, Save, CheckCircle, X, User, Calendar, Clock, Star, Edit, Check, BookOpen } from 'lucide-react';
import { cn } from '../utils';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  label: string;
  disabled?: boolean;
}

function SignaturePad({ onSave, label, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (disabled) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const clear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSave('');
  };

  return (
    <div className={cn("space-y-2", disabled && "opacity-50")}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      <div className={cn("border border-gray-200 rounded-lg bg-white overflow-hidden", disabled ? "bg-gray-50" : "bg-white")}>
        <canvas
          ref={canvasRef}
          width={400}
          height={100}
          className={cn("w-full touch-none", disabled ? "cursor-default" : "cursor-crosshair")}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        {!disabled && (
          <div className="bg-gray-50 p-2 flex justify-end">
            <button type="button" onClick={clear} className="text-[10px] text-red-500 font-bold hover:underline">Clear</button>
          </div>
        )}
      </div>
    </div>
  );
}

interface TrainingRecordFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isStaffUser?: boolean;
  logoUrl?: string;
}

export default function TrainingRecordForm({ initialData, onSubmit, onCancel, isStaffUser, logoUrl }: TrainingRecordFormProps) {
  const [formData, setFormData] = useState({
    studentName: initialData?.studentName || '',
    trainerName: initialData?.trainerName || '',
    duration: initialData?.duration || '',
    trainingDate: initialData?.trainingDate || new Date().toISOString().split('T')[0],
    courseModuleId: initialData?.courseModuleId || '',
    courseModuleName: initialData?.courseModuleName || '',
    topics: initialData?.topics || '',
    feedback: initialData?.feedback || {
      logistics: 'Good',
      presentation: 'Good',
      trainingMaterial: 'Good',
      qualityOfPresentation: 'Good',
      examplesCaseStudies: 'Good',
      usefulnessOfTopic: 'Good',
      fulfilmentOfObjective: 'Good',
      overallSatisfaction: 'Good',
    },
    postTrainingImplementation: initialData?.postTrainingImplementation || '',
    effectivenessVerification: initialData?.effectivenessVerification || {
      questionnaire: false,
      interview: false,
      onTheJob: false,
    },
    effectivenessDetails: initialData?.effectivenessDetails || '',
    evaluatedBy: initialData?.evaluatedBy || '',
    evaluationDate: initialData?.evaluationDate || new Date().toISOString().split('T')[0],
    trainerSign: initialData?.trainerSign || '',
    traineeSign: initialData?.traineeSign || '',
    traineeSignImplementation: initialData?.traineeSignImplementation || '',
    evaluatorSign: initialData?.evaluatorSign || '',
  });

  const feedbackOptions = ['Satisfactory', 'Good', 'Excellent'];
  const feedbackItems = [
    { key: 'logistics', label: 'Logistics' },
    { key: 'presentation', label: 'Presentation' },
    { key: 'trainingMaterial', label: 'Training Material' },
    { key: 'qualityOfPresentation', label: 'Quality of Presentation' },
    { key: 'examplesCaseStudies', label: 'Examples / Case studies' },
    { key: 'usefulnessOfTopic', label: 'Usefulness of topic' },
    { key: 'fulfilmentOfObjective', label: 'Fulfilment of Objective' },
    { key: 'overallSatisfaction', label: 'Overall Satisfaction' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
      <div className="p-6 bg-pink-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-sm">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
            ) : (
              <FileText className="w-10 h-10" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Training Record</h2>
            <p className="text-pink-100 text-sm mt-0.5 font-medium">Digital documentation & assessment</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-blue-50 px-8 py-4 border-b border-blue-100 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">Training Workflow</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            1. <strong>Trainer/Faculty</strong> fills details & signs. 2. <strong>Student</strong> provides feedback & signs. 
            3. <strong>Admin</strong> reviews implementation and verifies effectiveness to close the record.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
        {/* Top Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> Trainee Name
            </label>
            <input
              type="text"
              required
              disabled={!isStaffUser}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> Trainer (Faculty)
            </label>
            <input
              type="text"
              required
              disabled={!isStaffUser}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
              value={formData.trainerName}
              onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Course Module
            </label>
            <input
              type="text"
              required
              disabled={!isStaffUser}
              placeholder="e.g. Adobe Illustrator Basic"
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
              value={formData.courseModuleName}
              onChange={(e) => setFormData({ ...formData, courseModuleName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Training Date
            </label>
            <input
              type="date"
              required
              disabled={!isStaffUser}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500"
              value={formData.trainingDate}
              onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3" /> Duration
            </label>
            <input
              type="text"
              required
              disabled={!isStaffUser}
              placeholder="e.g. 2 hours"
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Topics Covered</label>
            <input
              type="text"
              required
              disabled={!isStaffUser}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
              placeholder="List main topics"
              value={formData.topics}
              onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
            />
          </div>
        </div>

        {/* Feedback Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-pink-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Feedback</h3>
          </div>
          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Description</th>
                  {feedbackOptions.map(opt => (
                    <th key={opt} className="px-6 py-4 text-center">{opt}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feedbackItems.map(item => (
                  <tr key={item.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.label}</td>
                    {feedbackOptions.map(opt => (
                      <td key={opt} className="px-6 py-4 text-center">
                        <label className="inline-flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name={item.key}
                            value={opt}
                            className="hidden"
                            checked={formData.feedback[item.key as keyof typeof formData.feedback] === opt}
                            onChange={() => setFormData({
                              ...formData,
                              feedback: { ...formData.feedback, [item.key]: opt }
                            })}
                          />
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            formData.feedback[item.key as keyof typeof formData.feedback] === opt
                              ? "border-pink-600 bg-pink-600 shadow-sm"
                              : "border-gray-200 group-hover:border-pink-300"
                          )}>
                            {formData.feedback[item.key as keyof typeof formData.feedback] === opt && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mid-form Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SignaturePad label="Trainer's Signature" disabled={!isStaffUser || !!formData.trainerSign} onSave={(url) => setFormData({ ...formData, trainerSign: url })} />
          <SignaturePad label="Trainee's Signature" disabled={isStaffUser || !!formData.traineeSign} onSave={(url) => setFormData({ ...formData, traineeSign: url })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Post training implementation details</label>
            <textarea
              disabled={isStaffUser}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 h-24 disabled:bg-gray-50"
              placeholder="Enter implementation details..."
              value={formData.postTrainingImplementation}
              onChange={(e) => setFormData({ ...formData, postTrainingImplementation: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <div className="w-full">
              <SignaturePad label="Trainee's Signature (Post-Implementation)" disabled={isStaffUser || !!formData.traineeSignImplementation} onSave={(url) => setFormData({ ...formData, traineeSignImplementation: url })} />
            </div>
          </div>
        </div>

        {/* Effectiveness Section */}
        <div className={cn("space-y-6 pt-6 border-t border-gray-100", !isStaffUser && "opacity-60 pointer-events-none")}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Effectiveness of training</h3>
            {!isStaffUser && <span className="text-[10px] bg-amber-100 text-amber-700 font-black px-2 py-1 rounded">STAFF EVALUATION ONLY</span>}
          </div>
          <p className="text-sm text-gray-500 font-medium">Verified through below Report:</p>
          <div className="flex flex-wrap gap-6">
            {Object.keys(formData.effectivenessVerification).map((key) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="hidden"
                  disabled={!isStaffUser}
                  checked={formData.effectivenessVerification[key as keyof typeof formData.effectivenessVerification]}
                  onChange={(e) => setFormData({
                    ...formData,
                    effectivenessVerification: {
                      ...formData.effectivenessVerification,
                      [key]: e.target.checked
                    }
                  })}
                />
                <div className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  formData.effectivenessVerification[key as keyof typeof formData.effectivenessVerification]
                    ? "border-pink-600 bg-pink-600"
                    : "border-gray-200 group-hover:border-pink-300"
                )}>
                  {formData.effectivenessVerification[key as keyof typeof formData.effectivenessVerification] && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm font-bold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Effectiveness Details</label>
            <textarea
              disabled={!isStaffUser}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 h-24 disabled:bg-gray-50"
              placeholder={isStaffUser ? "Summary of effectiveness evaluation..." : "Awaiting staff evaluation..."}
              value={formData.effectivenessDetails}
              onChange={(e) => setFormData({ ...formData, effectivenessDetails: e.target.value })}
            />
          </div>
        </div>

        {/* Evaluation Footer */}
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100", !isStaffUser && "opacity-60 pointer-events-none")}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Evaluated By</label>
            <input
              type="text"
              disabled={!isStaffUser}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
              value={formData.evaluatedBy}
              onChange={(e) => setFormData({ ...formData, evaluatedBy: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
            <input
              type="date"
              disabled={!isStaffUser}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
              value={formData.evaluationDate}
              onChange={(e) => setFormData({ ...formData, evaluationDate: e.target.value })}
            />
          </div>
          <SignaturePad label="Evaluator Sign (Staff)" disabled={!isStaffUser || !!formData.evaluatorSign} onSave={(url) => setFormData({ ...formData, evaluatorSign: url })} />
        </div>

        <div className="pt-8 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] btn-primary flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" /> Save Training Record
          </button>
        </div>
      </form>
    </div>
  );
}
