
import React, { useState } from 'react';
import { AssessmentAnswer, Question, ScreeningStage, DevelopmentalDomain } from '../types';
import { ArrowLeft, Send, Award, ArrowRight } from 'lucide-react';

interface Props {
  stage: ScreeningStage;
  onBack: () => void;
  onSubmit: (answers: AssessmentAnswer[]) => void;
}

export const Checklist: React.FC<Props> = ({ stage, onBack, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  // Group questions by domain
  const questionsByDomain = stage.questions.reduce((acc, q) => {
    if (!acc[q.domain]) acc[q.domain] = [];
    acc[q.domain].push(q);
    return acc;
  }, {} as Record<DevelopmentalDomain, Question[]>);

  const domains = Object.keys(questionsByDomain) as DevelopmentalDomain[];
  const [activeDomainIndex, setActiveDomainIndex] = useState(0);
  const currentDomain = domains[activeDomainIndex];
  const currentQuestions = questionsByDomain[currentDomain];

  const handleAnswer = (questionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  };

  const isCurrentDomainComplete = currentQuestions.every(q => answers[q.id] !== undefined);
  
  const handleNext = () => {
    if (activeDomainIndex < domains.length - 1) {
      setActiveDomainIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Prepare submission
        const answersList: AssessmentAnswer[] = Object.entries(answers).map(([qid, score]) => ({
            questionId: qid,
            score: score as number
        }));
        onSubmit(answersList);
    }
  };

  const calculateProgress = () => {
    const answeredCount = Object.keys(answers).length;
    const totalCount = stage.questions.length;
    return Math.round((answeredCount / totalCount) * 100);
  };

  return (
    <div className="pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur shadow-sm border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
                <h2 className="font-bold text-slate-800">{stage.label} 검사</h2>
            </div>
            <div className="w-10 text-xs font-bold text-indigo-600 flex justify-end">
                {activeDomainIndex + 1}/{domains.length}
            </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
            <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
            />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Domain Header Card */}
        <div className="text-center py-4">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mb-2">
                영역 {activeDomainIndex + 1}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                {currentDomain}
            </h2>
            <p className="text-slate-500 text-sm">
                아이가 평소에 보여주는 행동을 떠올려보세요.
            </p>
        </div>

        {currentQuestions.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-900 mb-8 leading-relaxed">
                    {q.text}
                </h3>
                
                {/* Swipe-like Slider UI */}
                <div className="px-2">
                    <div className="relative mb-6">
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="1"
                            value={answers[q.id] ?? 0}
                            onChange={(e) => handleAnswer(q.id, parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            style={{
                                background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${(answers[q.id] ?? 0) * 33.3}%, #e2e8f0 ${(answers[q.id] ?? 0) * 33.3}%, #e2e8f0 100%)`
                            }}
                        />
                         {/* Tick Marks Visuals (approximate) */}
                         <div className="flex justify-between text-xs text-slate-400 mt-3 font-medium select-none">
                            <span 
                                className={`cursor-pointer transition-colors ${answers[q.id] === 0 ? 'text-indigo-600 font-bold' : ''}`}
                                onClick={() => handleAnswer(q.id, 0)}
                            >전혀 못함</span>
                            <span 
                                className={`cursor-pointer transition-colors ${answers[q.id] === 1 ? 'text-indigo-600 font-bold' : ''}`}
                                onClick={() => handleAnswer(q.id, 1)}
                            >가끔 함</span>
                            <span 
                                className={`cursor-pointer transition-colors ${answers[q.id] === 2 ? 'text-indigo-600 font-bold' : ''}`}
                                onClick={() => handleAnswer(q.id, 2)}
                            >자주 함</span>
                            <span 
                                className={`cursor-pointer transition-colors ${answers[q.id] === 3 ? 'text-indigo-600 font-bold' : ''}`}
                                onClick={() => handleAnswer(q.id, 3)}
                            >잘 함</span>
                        </div>
                    </div>
                </div>
            </div>
        ))}

        <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-slate-200 flex justify-center z-20">
             <button
                onClick={handleNext}
                disabled={!isCurrentDomainComplete}
                className={`
                    max-w-md w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                    ${isCurrentDomainComplete 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-lg shadow-indigo-200' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }
                `}
             >
                {activeDomainIndex < domains.length - 1 ? (
                    <>다음 영역으로 <ArrowRight className="w-5 h-5" /></>
                ) : (
                    <>결과 확인하기 <Award className="w-5 h-5" /></>
                )}
             </button>
        </div>
      </div>
      
      {/* CSS for Range Slider Thumb styling customization */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: #ffffff;
            border: 4px solid #4f46e5;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};
