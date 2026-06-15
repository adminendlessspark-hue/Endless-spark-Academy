import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import { generateGeminiContent } from '../services/gemini';
import { Brain, Upload, Plus, Save, Trash2, Maximize2, Minimize2, Download, Loader2, FileText, Map as MapIcon, ChevronRight, ChevronDown, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
  description?: string;
}

interface StudentNotes {
  personalNotes: string;
  uploadedDocuments: { name: string, content: string }[];
}

interface MindMapAIProps {
  moduleId: string;
  moduleTitle: string;
  officialNotes?: string;
  expectedCriteria?: string;
  onClose: () => void;
  onValidationComplete?: (score: number) => void;
}

export default function MindMapAI({ moduleId, moduleTitle, officialNotes, expectedCriteria, onClose, onValidationComplete }: MindMapAIProps) {
  const { user } = useAuth();
  const [personalNotes, setPersonalNotes] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string, content: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'outline' | 'map'>('notes');
  const [outlineText, setOutlineText] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<{ score: number, feedback: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id || !moduleId) return;

    const unsub = onSnapshot(doc(db, 'student_mindmap_data', `${user.id}_${moduleId}`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as StudentNotes & { outlineText?: string, validationScore?: number, validationFeedback?: string };
        setPersonalNotes(data.personalNotes || '');
        setUploadedDocs(data.uploadedDocuments || []);
        if (data.outlineText) {
          setOutlineText(data.outlineText);
        }
        if (data.validationScore !== undefined && data.validationFeedback) {
          setValidationFeedback({ score: data.validationScore, feedback: data.validationFeedback });
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'student_mindmap_data'));

    return () => unsub();
  }, [user?.id, moduleId]);

  const handleSaveNotes = async () => {
    if (!user?.id || !moduleId) return;
    try {
      await setDoc(doc(db, 'student_mindmap_data', `${user.id}_${moduleId}`), {
        personalNotes,
        uploadedDocuments: uploadedDocs,
        outlineText,
        validationScore: validationFeedback?.score ?? null,
        validationFeedback: validationFeedback?.feedback ?? null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('Saved successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'student_mindmap_data');
    }
  };

  useEffect(() => {
    // Parse outlineText into mindMapData
    if (!outlineText.trim()) {
      setMindMapData(null);
      return;
    }

    const lines = outlineText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      setMindMapData(null);
      return;
    }

    const root: MindMapNode = { name: "Root", children: [] };
    const stack: { node: MindMapNode; indent: number }[] = [{ node: root, indent: -1 }];

    for (const line of lines) {
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].length : 0;
      
      const name = line.replace(/^\s*(?:-\s*|\*\s*|\d+\.\s*)?/, '').trim();
      if (!name) continue;

      const newNode: MindMapNode = { name, children: [] };

      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;
      if (!parent.children) parent.children = [];
      parent.children.push(newNode);
      
      stack.push({ node: newNode, indent });
    }

    if (root.children && root.children.length === 1) {
      setMindMapData(root.children[0]);
    } else if (root.children && root.children.length > 0) {
      setMindMapData({ ...root, name: moduleTitle || "Mind Map" });
    } else {
      setMindMapData(null);
    }
  }, [outlineText, moduleTitle]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedDocs(prev => [...prev, { name: file.name, content }]);
    };
    reader.readAsText(file);
  };

  const handleRemoveDoc = (index: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index));
  };

  const validateMindMap = async () => {
    if (!outlineText.trim()) {
      alert('Please create a mind map outline first.');
      return;
    }

    setIsValidating(true);
    try {
      const prompt = `
        Evaluate the student's mind map outline based on the expected criteria.
        
        Module Title: ${moduleTitle}
        Expected Criteria: ${expectedCriteria || 'Evaluate for correctness, structure, and completeness regarding the module topic.'}
        
        Student's Mind Map Outline:
        ${outlineText}
        
        Respond with a JSON object containing:
        - "score": A number out of 20.
        - "feedback": A short paragraph of constructive feedback, what they did well, and what is missing based on the expected criteria.
      `;

      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      if (result && typeof result.score === 'number' && result.feedback) {
        setValidationFeedback({ score: result.score, feedback: result.feedback });
        
        // Save the feedback to database immediately
        await setDoc(doc(db, 'student_mindmap_data', `${user?.id}_${moduleId}`), {
          personalNotes,
          uploadedDocuments: uploadedDocs,
          outlineText,
          validationScore: result.score,
          validationFeedback: result.feedback,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (onValidationComplete) {
          onValidationComplete(result.score);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error("Error validating mind map:", err);
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
        alert("Access Denied (403). Please check your Gemini API key in Settings > Secrets. You may need a billing-enabled key for some features.");
      } else {
        let errorMessage = err.message || "Failed to validate mind map. Please try again.";
        alert(errorMessage);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const generateMindMap = async () => {
    setIsGenerating(true);
    setActiveTab('outline');
    try {
      const combinedContext = `
        Module Title: ${moduleTitle}
        Official Notes: ${officialNotes || 'None provided'}
        Student Personal Notes: ${personalNotes}
        Uploaded Documents Content: ${uploadedDocs.map(d => `File: ${d.name}\nContent: ${d.content}`).join('\n\n')}
      `;

      const response = await generateGeminiContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Create a structured text outline for a mind map based on the following topic and notes.
              Use indentation (spaces) to represent hierarchy (e.g., Parent -> Children).
              Do not use markdown formatting like ** or \`\`\`. Just pure text with spaces for indentation.
              
              Example format:
              Topic Name
                Subtopic
                  Detail 1
                  Detail 2
              
              Context:
              ${combinedContext}
              
              Output ONLY the raw text outline.` }] }]
      });

      setOutlineText(response.text || '');
    } catch (err: any) {
      console.error("Error generating mind map:", err);
      let errorMessage = err.message || "Failed to generate mind map. Please try again.";
      
      if (errorMessage.includes('403') || errorMessage.includes('permission denied')) {
        errorMessage = "Access Denied (403). Please ensure the Generative AI API is enabled for your project.";
      } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        errorMessage = "Quota Exceeded (429). Please wait a moment and try again.";
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (mindMapData && svgRef.current) {
      renderMindMap();
    }
  }, [mindMapData, isExpanded]);

  const renderMindMap = () => {
    const width = isExpanded ? window.innerWidth * 0.8 : 800;
    const height = isExpanded ? window.innerHeight * 0.8 : 600;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tree = d3.tree<MindMapNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    const root = d3.hierarchy(mindMapData);
    tree(root);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#db2777")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkHorizontal()
        .x(d => (d as any).y)
        .y(d => (d as any).x) as any);

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => `translate(${(d as any).y},${(d as any).x})`);

    node.append("circle")
      .attr("r", 6)
      .attr("fill", d => d.children ? "#db2777" : "#fff")
      .attr("stroke", "#db2777")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -10 : 10)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .attr("font-size", "12px")
      .attr("font-weight", d => d.depth === 0 ? "bold" : "normal")
      .clone(true).lower()
      .attr("stroke", "white")
      .attr("stroke-width", 3);
      
    // Add tooltips or descriptions on hover
    node.append("title")
      .text(d => d.data.description || d.data.name);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all",
      isExpanded ? "p-0" : "p-4"
    )}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
          isExpanded ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[85vh] rounded-3xl"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Mind Map Generator</h2>
              <p className="text-xs text-pink-100">{moduleTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isExpanded ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('notes')}
            className={cn(
              "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              activeTab === 'notes' ? "text-pink-600 border-b-2 border-pink-600 bg-pink-50/30" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <FileText className="w-4 h-4" />
            Notes & Sources
          </button>
          <button 
            onClick={() => setActiveTab('outline')}
            className={cn(
              "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              activeTab === 'outline' ? "text-pink-600 border-b-2 border-pink-600 bg-pink-50/30" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <FileText className="w-4 h-4" />
            Text Outline
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={cn(
              "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              activeTab === 'map' ? "text-pink-600 border-b-2 border-pink-600 bg-pink-50/30" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <MapIcon className="w-4 h-4" />
            Visual Mind Map
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          <AnimatePresence mode="wait">
            {activeTab === 'notes' ? (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 overflow-y-auto p-6 space-y-8"
              >
                {/* Official Notes */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-pink-600" />
                    Official Module Notes
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 leading-relaxed italic">
                    {officialNotes || "No official notes provided for this module."}
                  </div>
                </div>

                {/* Personal Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-pink-600" />
                      Your Personal Notes
                    </h3>
                    <button 
                      onClick={handleSaveNotes}
                      className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Save Changes
                    </button>
                  </div>
                  <textarea 
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="Type your notes here... These will be used to generate the mind map."
                    className="w-full h-40 p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm resize-none"
                  />
                </div>

                {/* Uploaded Documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-pink-600" />
                      Reference Documents
                    </h3>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Upload Text File
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".txt,.md" 
                      className="hidden" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {uploadedDocs.length === 0 ? (
                      <div className="col-span-full py-8 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
                        <Upload className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs">No documents uploaded yet</p>
                      </div>
                    ) : (
                      uploadedDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-pink-50 text-pink-600 rounded-md">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium text-gray-700 truncate">{doc.name}</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveDoc(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <button 
                    onClick={generateMindMap}
                    disabled={isGenerating || (!personalNotes && uploadedDocs.length === 0 && !officialNotes)}
                    className="w-full py-4 bg-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-600/20 active:scale-[0.98]"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Notes & Generating Map...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        Generate AI Mind Map
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : activeTab === 'outline' ? (
              <motion.div 
                key="outline"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col bg-gray-50 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-pink-600" />
                    Text Outline Editor
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={validateMindMap}
                      disabled={isValidating || !outlineText.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      {isValidating ? 'Validating...' : 'Validate against Answer Key'}
                    </button>
                    <button 
                      onClick={handleSaveNotes}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-pink-700 transition"
                    >
                      Save Outline
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Use indentation (spaces) to create parent/child relationships. The visual mind map will update automatically based on this structure.
                </p>

                {validationFeedback && (
                  <div className={`mb-4 p-4 rounded-xl border ${validationFeedback.score >= 15 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-lg font-bold ${validationFeedback.score >= 15 ? 'text-green-700' : 'text-orange-700'}`}>
                        Score: {validationFeedback.score}/20
                      </span>
                    </div>
                    <p className={`text-sm ${validationFeedback.score >= 15 ? 'text-green-800' : 'text-orange-800'}`}>
                      {validationFeedback.feedback}
                    </p>
                  </div>
                )}

                <textarea
                  className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-6 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none shadow-sm"
                  placeholder="Topic Name
  Subtopic
    Detail 1
    Detail 2"
                  value={outlineText}
                  onChange={(e) => setOutlineText(e.target.value)}
                  spellCheck="false"
                />
              </motion.div>
            ) : (
              <motion.div 
                key="map"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col bg-gray-50"
              >
                {mindMapData ? (
                  <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center">
                    <svg 
                      ref={svgRef} 
                      width={isExpanded ? window.innerWidth * 0.8 : 800} 
                      height={isExpanded ? window.innerHeight * 0.8 : 600}
                      className="bg-white rounded-2xl shadow-inner"
                    />
                    
                    <div className="absolute top-8 right-8 flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          const svgData = new XMLSerializer().serializeToString(svgRef.current!);
                          const svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
                          const svgUrl = URL.createObjectURL(svgBlob);
                          const downloadLink = document.createElement("a");
                          downloadLink.href = svgUrl;
                          downloadLink.download = `${moduleTitle}_MindMap.svg`;
                          document.body.appendChild(downloadLink);
                          downloadLink.click();
                          document.body.removeChild(downloadLink);
                        }}
                        className="p-3 bg-white shadow-md rounded-xl text-pink-600 hover:bg-pink-50 transition-colors"
                        title="Download as SVG"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={generateMindMap}
                        className="p-3 bg-white shadow-md rounded-xl text-pink-600 hover:bg-pink-50 transition-colors"
                        title="Regenerate"
                      >
                        <Brain className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <Brain className="w-16 h-16 mb-4 opacity-10" />
                    <h3 className="text-lg font-bold text-gray-500">No Mind Map Generated Yet</h3>
                    <p className="text-sm max-w-xs mt-2">Go to the Notes tab, add your thoughts, and click Generate to see the AI's visual summary.</p>
                    <button 
                      onClick={() => setActiveTab('notes')}
                      className="mt-6 px-6 py-2 bg-pink-100 text-pink-600 rounded-lg font-bold hover:bg-pink-200 transition-colors"
                    >
                      Go to Notes
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

import { X } from 'lucide-react';
import { cn } from '../utils';
