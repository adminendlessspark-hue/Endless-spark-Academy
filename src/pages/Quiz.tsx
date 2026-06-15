import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CourseModule, QuizQuestion, TopicScore } from '../types';
import { CircleCheck, XCircle, ArrowRight, Trophy, RefreshCcw, Camera, ShieldAlert, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleGenAI, Type } from '@google/genai';
import { cn, getScoreKey } from '../utils';
import { generateGeminiContent } from '../services/gemini';

function VideoPreview({ stream, className }: { stream: MediaStream | null, className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
      <div className="absolute top-2 right-2 flex items-center justify-center p-1 bg-black/40 rounded-full">
        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
      </div>
    </div>
  );
}

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'productionArtEngineer';
  const topic = searchParams.get('topic') || 'Color Fundamental';
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [descriptiveAnswers, setDescriptiveAnswers] = useState<Record<string, string>>({});
  const [descriptiveFeedback, setDescriptiveFeedback] = useState<Record<string, { score: number, feedback: string }>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Security / Proctoring State
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState(0);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // isTestStarted is true and showResults is false while the test is active
      if (isTestStarted && !showResults) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTestStarted, showResults]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(
          collection(db, 'course_modules'),
          where('category', '==', category),
          where('title', '==', topic)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const moduleData = snapshot.docs[0].data() as CourseModule;
          if (moduleData.quizQuestions && moduleData.quizQuestions.length > 0) {
            setQuestions(moduleData.quizQuestions);
          } else {
            // Fallback questions if none are defined for the module
            setQuestions([
              {
                id: '1',
                question: 'Define colour gamut.',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: 'A color gamut is the entire range of colors available on a particular device such as a monitor or printer. A good definition mentions the full range or absolute extent of colors that can be reproduced.'
              },
              {
                id: '2',
                question: 'Differentiate between additive colour and subtractive colour.',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: 'Additive colors (RGB) are created by adding light, starting from black. Used for screens. Subtractive colors (CMYK) are created by subtracting light, starting from white paper. Used for printing.'
              },
              {
                id: '3',
                question: 'What is a Pantone (PMS) colour?',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: 'The Pantone Matching System (PMS) is a standardized color reproduction system. It uses specific spot colors, pre-mixed inks, to ensure color consistency across different printers and materials.'
              },
              {
                id: '4',
                question: 'Write any three benefits of using Pantone colours in packaging.',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: '1. Brand consistency / Color accuracy. 2. Reproduce colors that CMYK cannot accurately recreate (like metallics, neons, or very vibrant colors). 3. Saves money/time on press if using fewer than 4 process colors (e.g., a 2-color job).'
              },
              {
                id: '5',
                question: 'What is a non-Pantone (process) colour?',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: 'A process color is created by blending the four standard process inks: Cyan, Magenta, Yellow, and Black (CMYK). They are mixed on the press as tiny dots of ink.'
              },
              {
                id: '6',
                question: 'What is the maximum number of colours typically used in CMYK printing?',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: '4 colors (Cyan, Magenta, Yellow, Black).'
              },
              {
                id: '7',
                question: 'Explain the terms coated ink and uncoated ink in printing.',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: 'Normally, "coated" and "uncoated" refer to the paper, which affects how ink appears. Pantone formulas come in Coated (C) and Uncoated (U) to simulate how the ink will look on glossy/coated vs matte/uncoated paper stock.'
              },
              {
                id: '8',
                question: 'Define opaque ink and transparent ink with one example each.',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: 'Opaque ink completely covers the substrate or underlying colors (e.g., Titanium White, metallic inks). Transparent ink allows light to pass through, blending with the substrate or colors underneath (e.g., standard CMYK process inks).'
              },
              {
                id: '9',
                question: 'Name any three source files or references used for colour matching in packaging.',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: '1. Physical Pantone book/swatches. 2. Approved target proof / hard copy proof. 3. Physical sample of a previous run. (also acceptable: digital color profiles, drawdowns).'
              },
              {
                id: '10',
                question: 'Briefly explain how to increase and how to reduce the number of colours in a packaging design.',
                options: [],
                correctAnswer: 0,
                type: 'descriptive',
                answerKey: 'To reduce: Convert spot colors to CMYK where acceptable, or use tints of a spot color instead of introducing a new one. To increase: Add spot colors (Pantones) to single out critical brand elements, add varnishes or metallic inks.'
              }
            ]);
          }
        } else {
          setQuestions([
            {
              id: '1',
              question: 'No quiz questions found for this module.',
              options: ['Ok', 'Ok', 'Ok', 'Ok'],
              correctAnswer: 0
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching quiz questions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category, topic]);

  useEffect(() => {
    if (user) {
      const categoryKey = getScoreKey(category);
      const scores = user.scores || {};
      const currentScores = (scores as any)[categoryKey] || {};
      const topicScores = currentScores[topic];
      
      if (topicScores && topicScores.quizAttempted) {
        if (!user.quizCompleted) {
          updateUser({ quizCompleted: true }).catch(console.error);
        }
        setScore(topicScores.quiz || 0);
        setShowResults(true);
      }
    }
  }, [user, category, topic, navigate, updateUser]);

  // Proctoring: Camera cleanup & auto-stop on results
  useEffect(() => {
    if (showResults && mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream, showResults]);

  // Proctoring: Tab change detection
  useEffect(() => {
    if (!isTestStarted || showResults || autoSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(w => {
          const newWarnings = w + 1;
          if (newWarnings >= 3) {
            setAutoSubmitted(true);
          } else {
            alert(`SECURITY WARNING (${newWarnings}/3): You have navigated away from the test tab. Your test will be automatically submitted if you continue.`);
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isTestStarted, showResults, autoSubmitted]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      setCameraError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access is required for proctoring. Please allow camera permissions to start the test.");
    }
  };

  const currentQuestion = questions[currentQuestionIdx];

  const handleOptionSelect = (idx: number) => {
    if (isAnswered || !currentQuestion) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: idx }));
    
    if (idx === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  // Handle auto-submit trigger
  useEffect(() => {
    if (autoSubmitted && !showResults) {
      alert("SECURITY VIOLATION: Test automatically submitted due to multiple tab switches.");
      finishQuiz(score);
    }
  }, [autoSubmitted, showResults, score]);

  const handleDescriptiveChange = (text: string) => {
    if (isAnswered) return;
    setDescriptiveAnswers(prev => ({ ...prev, [currentQuestion.id]: text }));
  };

  const finishQuiz = (finalScore: number) => {
    setShowResults(true);
    const passed = finalScore >= questions.length / 2;
    
    if (passed) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    // Update score card regardless of passing
    if (user) {
      const categoryKey = category === 'print-ready-engineer' ? 'printReadyEngineer' : 'productionArtEngineer';
      const scores = user.scores || { productionArtEngineer: {}, printReadyEngineer: {}, qualityControlEngineer: {} };
      const currentScores = (scores as any)[categoryKey] || {};
      const topicScores = currentScores[topic] || { assignment: 0, video: 0, worksheet: 0, project: 0, mindMap: 0, quiz: 0, onlineTest: 0, attendance: 0 } as TopicScore;
      
      // Calculate online test mark: (score / total) * 20
      const onlineTestMark = Math.round((finalScore / questions.length) * 20);

      // Construct onlineTestDetails
      const onlineTestDetails = questions.map(q => {
        const isDescriptive = q.type === 'descriptive';
        const aiEvaluation = descriptiveFeedback[q.id];
        
        let answerStr = '';
        if (isDescriptive) {
          answerStr = descriptiveAnswers[q.id] || '';
        } else {
          answerStr = selectedAnswers[q.id] !== undefined ? q.options[selectedAnswers[q.id]] : 'No answer';
        }

        let isCorrect = false;
        let aiScore = 0;
        if (isDescriptive) {
          aiScore = aiEvaluation?.score || 0;
          isCorrect = aiScore > 0;
        } else {
          isCorrect = selectedAnswers[q.id] === q.correctAnswer;
          aiScore = isCorrect ? 1 : 0;
        }

        return {
          questionId: q.id,
          question: q.question,
          answer: answerStr,
          aiScore: aiScore,
          aiFeedback: isDescriptive ? (aiEvaluation?.feedback || '') : (isCorrect ? 'Correct' : 'Incorrect'),
          isDescriptive: isDescriptive,
          correctAnswerStr: isDescriptive ? q.answerKey : q.options[q.correctAnswer]
        };
      });
      
      const newScores = {
        ...scores,
        [categoryKey]: {
          ...currentScores,
          [topic]: { ...topicScores, onlineTest: onlineTestMark, onlineTestAttempted: true, onlineTestDetails }
        }
      };
      
      updateUser({ quizCompleted: true, scores: newScores });
    }
  };

  const handleNext = async () => {
    let currentFinalScore = score;
    // For multiple choice, score was already updated via setScore in handleOptionSelect, but state might be behind if running fast.
    // Assuming score is reliable here.

    if (currentQuestion.type === 'descriptive') {
      if (!isAnswered) {
        setIsEvaluating(true);
        const answer = descriptiveAnswers[currentQuestion.id] || '';
        try {
          const prompt = `You are a strict and knowledgeable evaluator grading a quiz for a student in a Printing and Packaging course.
Question: ${currentQuestion.question}
Correct criteria / answer key: ${currentQuestion.answerKey}

Student's Answer: ${answer}

Evaluate the student's answer. The question is worth 1 point.
Respond with a JSON object in exactly this format without markdown tags:
{
  "score": <1 if correct or Mostly Correct, 0 if wrong, partial credit round up to 1 if good enough>,
  "feedback": "<brief feedback explaining why it's right or wrong, 1-2 sentences. Keep it very direct.>"
}`;
          const response = await generateGeminiContent({
             model: 'gemini-3-flash-preview',
             contents: [{ role: 'user', parts: [{ text: prompt }] }],
             config: { 
               responseMimeType: "application/json",
               responseSchema: {
                 type: Type.OBJECT,
                 properties: {
                   score: { type: Type.NUMBER },
                   feedback: { type: Type.STRING }
                 },
                 required: ["score", "feedback"]
               }
             }
          });
          const resultText = response.text || "{}";
          const result = JSON.parse(resultText);
          
          setDescriptiveFeedback(prev => ({ ...prev, [currentQuestion.id]: result }));
          if (result.score > 0) {
            setScore(prev => prev + result.score);
            currentFinalScore += result.score;
          }
        } catch (e: any) {
          console.error('Error evaluating answer:', e);
          const msg = (e?.message || '').toLowerCase();
          if (msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied') || msg.includes('api_key_invalid')) {
            alert('Access Denied (403). Please check your Gemini API key in Settings > Secrets. You may need a billing-enabled key for some features.');
          } else {
            console.warn(`AI Evaluation fallback: ${e.message || 'Unknown error'}`);
          }
          const fallbackFeedback = { score: 1, feedback: "Automatically approved due to evaluation timeout/error." };
          setDescriptiveFeedback(prev => ({ ...prev, [currentQuestion.id]: fallbackFeedback }));
          setScore(prev => prev + 1);
          currentFinalScore += 1;
        }
        setIsEvaluating(false);
        setIsAnswered(true);
        return; // Stay on the question so they can read the feedback
      } else {
         // Already answered and graded, just move next
         if (currentQuestionIdx < questions.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
          setSelectedOption(null);
          setIsAnswered(false);
        } else {
          finishQuiz(currentFinalScore);
        }
      }
    } else {
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        finishQuiz(currentFinalScore);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setScore(0);
    setShowResults(false);
    setShowAnswers(false);
    setIsAnswered(false);
    setSelectedAnswers({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (showResults) {
    const passed = score >= questions.length / 2;
    
    if (showAnswers) {
      return (
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">Quiz Answers</h2>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {questions.map((q, idx) => {
                const isDescriptive = q.type === 'descriptive';
                
                let isCorrect = false;
                if (isDescriptive) {
                   isCorrect = (descriptiveFeedback[q.id]?.score || 0) > 0;
                } else {
                   isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                }
                
                return (
                  <div key={q.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <h5 className="text-lg font-bold text-gray-900 mb-1">{q.question}</h5>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-600 rounded-md w-fit">
                          {q.type === 'true-false' ? 'True or False' : q.type === 'descriptive' ? 'Descriptive' : 'Choice the best answer'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pl-12">
                      {isDescriptive ? (
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <span className="text-sm font-bold text-gray-500 block mb-2">Your Answer:</span>
                            <p className="text-gray-900 whitespace-pre-wrap">{descriptiveAnswers[q.id] || <span className="italic text-gray-400">No answer provided</span>}</p>
                          </div>
                          <div className={`p-4 rounded-xl border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'}`}>
                            <span className="text-sm font-bold text-gray-500 block mb-2">Evaluator Feedback:</span>
                            <p className="text-gray-800">{descriptiveFeedback[q.id]?.feedback || 'No feedback available.'}</p>
                            <div className="mt-3 text-sm font-medium">
                               <span className="text-gray-500">Correct criteria was: </span>
                               <span className="text-gray-700">{q.answerKey}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {q.options.map((option, optIdx) => {
                            const userAnswer = selectedAnswers[q.id];
                            const isSelected = userAnswer === optIdx;
                            const isActualCorrect = q.correctAnswer === optIdx;
                            
                            let optionClass = "bg-white border-gray-200 text-gray-700";
                            let iconClass = "border-gray-200 text-gray-400";
                            
                            if (isActualCorrect) {
                              optionClass = "bg-green-50 border-green-500 ring-1 ring-green-500 text-green-900";
                              iconClass = "bg-green-500 border-green-500 text-white";
                            } else if (isSelected && !isActualCorrect) {
                              optionClass = "bg-red-50 border-red-500 ring-1 ring-red-500 text-red-900";
                              iconClass = "bg-red-500 border-red-500 text-white";
                            }
                            
                            return (
                              <div
                                key={optIdx}
                                className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 ${optionClass}`}
                              >
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${iconClass}`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="font-medium">{option}</span>
                                
                                {isActualCorrect && <CircleCheck className="w-5 h-5 text-green-500 ml-auto" />}
                                {isSelected && !isActualCorrect && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${passed ? 'bg-orange-100' : 'bg-red-100'}`}>
            {passed ? <Trophy className="w-12 h-12 text-orange-600" /> : <RefreshCcw className="w-12 h-12 text-red-600" />}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h2>
          <p className="text-gray-500 mb-8">
            You scored <span className="font-bold text-pink-600">{score}</span> out of <span className="font-bold">{questions.length}</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowAnswers(true)}
              className="px-8 py-3 bg-white text-pink-500 border-2 border-pink-500 rounded-xl font-bold hover:bg-pink-50 transition-colors w-full sm:w-auto"
            >
              Show Answers
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors w-full sm:w-auto shadow-lg shadow-pink-500/20"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isTestStarted) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-red-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Proctored Assessment</h2>
          
          <div className="text-left space-y-4 text-gray-700 mb-8 bg-orange-50/50 p-6 rounded-2xl border border-orange-100/50">
            <p className="font-bold text-gray-900 border-b border-orange-200/50 pb-3 mb-4">Please read carefully before starting:</p>
            <ul className="space-y-3 font-medium">
              <li className="flex gap-3"><Camera className="w-5 h-5 text-orange-500 shrink-0"/> <span><strong>Camera Requirement:</strong> You must allow camera access. Your video feed will remain active as a security measure.</span></li>
              <li className="flex gap-3"><AlertTriangle className="w-5 h-5 text-orange-500 shrink-0"/> <span><strong>No Tab Switching:</strong> Navigating away from this tab will be recorded as a warning. After 3 warnings, your test will automatically submit.</span></li>
              <li className="flex gap-3"><ShieldAlert className="w-5 h-5 text-orange-500 shrink-0"/> <span><strong>No Copy/Paste:</strong> Selecting text, copying, or pasting is disabled to prevent cheating.</span></li>
            </ul>
          </div>
          
          {cameraError && (
            <p className="text-red-500 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 font-medium">{cameraError}</p>
          )}

          <div className="flex flex-col items-center gap-6">
            {!mediaStream && (
              <button onClick={startCamera} className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Camera className="w-5 h-5"/> Enable Camera to Start
              </button>
            )}
            
            {mediaStream && (
              <div className="mb-2">
                <p className="text-sm font-bold text-green-600 mb-3 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Camera Active
                </p>
                <div className="w-48 aspect-video rounded-xl overflow-hidden border-4 border-green-100 mx-auto shadow-sm">
                  <VideoPreview stream={mediaStream} />
                </div>
              </div>
            )}

            <button 
              disabled={!mediaStream}
              onClick={() => setIsTestStarted(true)} 
              className="w-full sm:w-auto px-8 py-4 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-pink-500/20"
            >
              I accept, Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="max-w-3xl mx-auto pb-24"
      onCopy={(e) => { e.preventDefault(); alert("Copying is disabled during the test."); }}
      onPaste={(e) => { e.preventDefault(); alert("Pasting is disabled during the test."); }}
      onContextMenu={(e) => { e.preventDefault(); }}
    >
      {/* Proctoring PIP */}
      {mediaStream && (
        <div className="fixed bottom-6 right-6 w-48 aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-4 border-white z-50 pointer-events-none">
          <VideoPreview stream={mediaStream} />
        </div>
      )}

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Quiz</h1>
          <p className="text-gray-500 mt-2">Test your basic understanding of software development.</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Question</span>
          <div className="text-xl font-bold text-pink-600">{currentQuestionIdx + 1} / {questions.length}</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-pink-500 h-full transition-all duration-300" 
            style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-8">{currentQuestion.question}</h3>
            
            <div className="space-y-4">
              {currentQuestion.type === 'descriptive' ? (
                <div className="space-y-4">
                  <textarea
                    rows={6}
                    value={descriptiveAnswers[currentQuestion.id] || ''}
                    onChange={(e) => handleDescriptiveChange(e.target.value)}
                    disabled={isAnswered || isEvaluating}
                    placeholder="Type your answer here in detail..."
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-shadow"
                  />
                  {isAnswered && descriptiveFeedback[currentQuestion.id] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border-l-4 ${descriptiveFeedback[currentQuestion.id].score > 0 ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'}`}
                    >
                      <h4 className="font-bold mb-1 flex items-center gap-2">
                        {descriptiveFeedback[currentQuestion.id].score > 0 ? (
                          <><CircleCheck className="w-5 h-5 text-green-600" /> <span className="text-green-800">Good Answer! (+{descriptiveFeedback[currentQuestion.id].score} pts)</span></>
                        ) : (
                          <><XCircle className="w-5 h-5 text-orange-600" /> <span className="text-orange-800">Needs Improvement (0 pts)</span></>
                        )}
                      </h4>
                      <p className="text-gray-700">{descriptiveFeedback[currentQuestion.id].feedback}</p>
                    </motion.div>
                  )}
                </div>
              ) : (
                currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctAnswer;
                  
                  let variantClass = "border-gray-100 hover:border-pink-200 hover:bg-pink-50/30";
                  if (isAnswered) {
                    if (isCorrect) variantClass = "border-orange-500 bg-orange-50 text-orange-700";
                    else if (isSelected) variantClass = "border-red-500 bg-red-50 text-red-700";
                    else variantClass = "border-gray-100 opacity-50";
                  } else if (isSelected) {
                    variantClass = "border-pink-600 bg-pink-50 text-pink-700";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isAnswered}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left font-medium ${variantClass}`}
                    >
                      <span>{option}</span>
                      {isAnswered && isCorrect && <CircleCheck className="w-5 h-5 text-orange-600" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex justify-end">
          <button
            onClick={handleNext}
            disabled={
              isEvaluating || 
              (currentQuestion.type === 'descriptive' 
                ? !isAnswered && !(descriptiveAnswers[currentQuestion.id] || '').trim() 
                : !isAnswered)
            }
            className="flex items-center gap-2 bg-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20"
          >
            {isEvaluating ? 'Evaluating...' : 
              (currentQuestion.type === 'descriptive' && !isAnswered) ? 'Submit Answer' :
              (currentQuestionIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question')
            }
            <ArrowRight className={`w-4 h-4 ${isEvaluating ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
