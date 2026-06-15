import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { CheckCircle, ArrowLeft, Star, MessageSquare, Award, Clock } from 'lucide-react';
import { cn } from '../utils';

export default function EntranceTestResults() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user?.entranceTestResults) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No Test Results Found</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">It seems you haven't completed your entrance test yet or the results are being processed.</p>
          <button 
            onClick={() => navigate('/entrance-test')}
            className="bg-pink-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200"
          >
            Take Entrance Test
          </button>
        </div>
      </div>
    );
  }

  const results = user.entranceTestResults;
  const aiEvaluation = results.aiEvaluation;

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <div className="mb-10 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-2xl font-bold text-sm">
          <Clock className="w-4 h-4" />
          Submitted on {new Date(results.submittedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-8">
        {/* Header Hero */}
        <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/20 blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-3xl -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Entrance Test Results</h1>
              <p className="text-gray-400 text-lg max-w-md">Congratulations on completing your adaptive entry evaluation!</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 text-center border border-white/20 w-full md:w-auto">
              <p className="text-pink-400 font-bold uppercase tracking-widest text-xs mb-2">Total Score</p>
              <div className="text-6xl font-black mb-1">{results.totalMarks}</div>
              <div className="text-gray-400 font-bold">OUT OF {results.maxMarks || 75}</div>
            </div>
          </div>
        </div>

        {/* Score Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-1">Knowledge IQ</h3>
            <p className="text-3xl font-black text-gray-900">{results.mcqMarks} / 25</p>
            <p className="text-xs text-gray-500 mt-2">Memory, Understanding & Grammar</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-1">Expression Skills</h3>
            <p className="text-3xl font-black text-gray-900">{(aiEvaluation?.totalAiMarks || 0)} / 50</p>
            <p className="text-xs text-gray-500 mt-2">AI-Evaluated Subjective Tasks</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-1">Proficiency</h3>
            <p className="text-3xl font-black text-gray-900">
              {Math.round((results.totalMarks / (results.maxMarks || 75)) * 100)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Overall Performance Grade</p>
          </div>
        </div>

        {/* AI Feedback Section */}
        {aiEvaluation?.feedback && (
          <div className="bg-pink-50 rounded-[2.5rem] p-10 border border-pink-100">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-bold text-gray-900">AI Tutor Feedback</h2>
            </div>
            <p className="text-lg text-pink-900 leading-relaxed italic">
              "{aiEvaluation.feedback}"
            </p>
          </div>
        )}

        {/* Detailed AI Sub-scores */}
        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Skill Breakdown</h2>
          <div className="space-y-6">
            {[
              { label: 'Translation (Beginner)', score: aiEvaluation?.marks?.story1, max: 10, key: 'story1' },
              { label: 'Translation (Intermediate)', score: aiEvaluation?.marks?.story2, max: 10, key: 'story2' },
              { label: 'Listening Comprehension', score: aiEvaluation?.marks?.listening, max: 10, key: 'listening' },
              { label: 'Paragraph Writing', score: aiEvaluation?.marks?.paragraph, max: 10, key: 'paragraph' },
              { label: 'Story Understanding', score: aiEvaluation?.marks?.partF, max: 10, key: 'partF' },
            ].map((skill, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm font-bold text-gray-900">{skill.label}</span>
                  </div>
                  <span className="text-sm font-black text-pink-600">{skill.score} / {skill.max}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(skill.score / skill.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-8">
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-900 text-white px-12 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
