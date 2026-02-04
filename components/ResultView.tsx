
import React, { useEffect, useState, useRef } from 'react';
import { AssessmentResult, ScreeningStage } from '../types';
import { analyzeDevelopment } from '../services/geminiService';
import {  RefreshCw, Share2, Award, BrainCircuit, Activity, Download, Check } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';

interface Props {
  result: AssessmentResult;
  stage: ScreeningStage;
  onRestart: () => void;
}

export const ResultView: React.FC<Props> = ({ result, stage, onRestart }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // Calculate scores per domain
  const domainScores = React.useMemo(() => {
    const scores: Record<string, { current: number, max: number }> = {};
    stage.questions.forEach(q => {
        if (!scores[q.domain]) scores[q.domain] = { current: 0, max: 0 };
        const ans = result.answers.find(a => a.questionId === q.id);
        scores[q.domain].current += ans ? ans.score : 0;
        scores[q.domain].max += 3;
    });
    
    return Object.entries(scores).map(([domain, val]) => ({
        subject: domain,
        A: (val.current / val.max) * 100, // Normalized to 100 for chart
        fullMark: 100,
        rawScore: val.current,
        maxScore: val.max
    }));
  }, [result, stage]);

  const handleAiAnalysis = async () => {
    if (aiAnalysis || isLoadingAi) return; // Prevent double call
    
    setIsLoadingAi(true);
    try {
        const analysis = await analyzeDevelopment(result, stage);
        setAiAnalysis(analysis);
    } catch (e) {
        setAiAnalysis("분석을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
        setIsLoadingAi(false);
    }
  };

  // Auto-start AI analysis on mount
  useEffect(() => {
    handleAiAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    if (!captureRef.current) return;
    
    try {
        // Simple loading state for button could be added here
        const canvas = await html2canvas(captureRef.current, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher resolution
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `아이건강해_발달리포트_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
    } catch (err) {
        console.error("Image generation failed", err);
        alert("이미지 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      {/* Capture Area Start */}
      <div ref={captureRef} className="bg-slate-50 p-4 -m-4 mb-4 rounded-xl">
          <div className="text-center mb-8 pt-4">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
                <Award className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">검사 완료!</h2>
            <p className="text-slate-600">
                {stage.label} 단계 발달 선별검사를 모두 마쳤습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Chart Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                <h3 className="text-lg font-bold text-slate-800 mb-4 w-full flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" /> 발달 영역별 점수
                </h3>
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={domainScores}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="점수"
                            dataKey="A"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            fill="#6366f1"
                            fillOpacity={0.4}
                        />
                        <Tooltip 
                            formatter={(value: number) => value.toFixed(1)} 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">영역별 상세 점수</h3>
                 <div className="space-y-4">
                     {domainScores.map((ds) => (
                         <div key={ds.subject}>
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="font-medium text-slate-700">{ds.subject}</span>
                                 <span className="text-slate-500">{ds.rawScore} / {ds.maxScore}점 ({ds.A.toFixed(1)}%)</span>
                             </div>
                             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full ${
                                        ds.A >= 80 ? 'bg-green-500' :
                                        ds.A >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                                    }`} 
                                    style={{ width: `${ds.A}%` }} 
                                 />
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-indigo-900">AI 정밀 분석 & 육아 가이드</h3>
                    <p className="text-sm text-indigo-700">Gemini가 분석한 맞춤형 조언을 받아보세요.</p>
                </div>
            </div>

            {isLoadingAi && !aiAnalysis && (
                 <div className="text-center py-12 flex flex-col items-center justify-center text-indigo-500">
                    <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                    <p className="font-medium animate-pulse">아이의 응답 결과를 분석하고 있습니다...</p>
                    <p className="text-xs mt-1 opacity-70">잠시만 기다려주세요</p>
                </div>
            )}

            {!isLoadingAi && !aiAnalysis && (
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">분석을 불러오는데 실패했습니다.</p>
                    <button
                        onClick={() => handleAiAnalysis()}
                        className="inline-flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 font-bold py-2 px-6 rounded-full hover:bg-indigo-50"
                    >
                        <RefreshCw className="w-4 h-4" /> 다시 시도
                    </button>
                </div>
            )}

            {aiAnalysis && (
                <div className="prose prose-indigo max-w-none bg-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
            )}
          </div>
      </div>
      {/* Capture Area End */}

      <div className="mt-8 flex flex-col gap-3">
        <button
            onClick={onRestart}
            className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-lg flex items-center justify-center gap-2"
        >
            <Check className="w-5 h-5" /> 확인
        </button>
        <button 
            onClick={handleShare}
            className="w-full py-4 rounded-xl bg-white border border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
        >
            <Download className="w-5 h-5" /> 결과 이미지로 저장
        </button>
      </div>
    </div>
  );
};
