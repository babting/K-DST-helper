
import React from 'react';
import { ScreeningStage, AssessmentResult } from '../types';
import { AlertCircle, CheckCircle2, ChevronRight, FileText, Lock, CalendarCheck, Search } from 'lucide-react';

interface Props {
  currentAgeMonths: number;
  matchedStage?: ScreeningStage;
  allStages: ScreeningStage[];
  onStart: (stage: ScreeningStage) => void;
  onViewResult: (result: AssessmentResult) => void;
  allResults: Record<string, AssessmentResult>;
}

export const StageSelector: React.FC<Props> = ({ 
  currentAgeMonths, 
  matchedStage, 
  allStages, 
  onStart, 
  onViewResult, 
  allResults 
}) => {
  
  // 1. Determine Nearest Stage (if no direct match)
  // We calculate the distance from the child's age to the stage's range
  const nearestStage = allStages.reduce((prev, curr) => {
    const getDistance = (stage: ScreeningStage) => {
        if (currentAgeMonths < stage.minMonths) return stage.minMonths - currentAgeMonths;
        if (currentAgeMonths > stage.maxMonths) return currentAgeMonths - stage.maxMonths;
        return 0; // Inside range
    };
    return getDistance(curr) < getDistance(prev) ? curr : prev;
  }, allStages[0]);
    
  // 2. Determine Primary Stage to Display
  // Priority: Matched (Current Age) -> Nearest (Close Age)
  const primaryStage = matchedStage || nearestStage;

  // 3. Check if Primary Stage is completed
  const completedResult = allResults[primaryStage.id];
  const isPrimaryCompleted = !!completedResult;
  const isPrimaryMatched = matchedStage && primaryStage.id === matchedStage.id;
  const isNearestMode = !isPrimaryMatched;
  
  // Calculate next stage for preview
  const primaryIndex = allStages.findIndex(s => s.id === primaryStage.id);
  const nextStage = (primaryIndex < allStages.length - 1) ? allStages[primaryIndex + 1] : null;

  if (!primaryStage) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            현재 아이의 월령: <span className="text-indigo-600 text-2xl">{currentAgeMonths}개월</span>
          </h3>
          
          <div className={`mt-4 border rounded-xl p-4 transition-all 
            ${isPrimaryCompleted ? 'bg-indigo-50 border-indigo-200' : 
              (isPrimaryMatched ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200')}`
          }>
              
            {/* Header Badge */}
            <div className={`flex items-center gap-2 font-bold mb-2 
                ${isPrimaryCompleted ? 'text-indigo-800' : 
                  (isPrimaryMatched ? 'text-green-800' : 'text-amber-800')}`
            }>
                {isPrimaryCompleted && <><CheckCircle2 className="w-5 h-5" /> 검사 완료 ({primaryStage.label})</>}
                {isPrimaryMatched && !isPrimaryCompleted && <><CalendarCheck className="w-5 h-5" /> 추천 검사 시기: {primaryStage.label}</>}
                {isNearestMode && !isPrimaryCompleted && <><Search className="w-5 h-5" /> 가장 가까운 검사: {primaryStage.label}</>}
            </div>

            {/* Description */}
            <p className={`text-sm mb-4 
                ${isPrimaryCompleted ? 'text-indigo-700' : 
                  (isPrimaryMatched ? 'text-green-700' : 'text-amber-700')}`
            }>
                {isPrimaryCompleted 
                    ? "선택하신 단계의 발달 선별검사를 완료했습니다. 결과를 확인해보세요."
                    : (isPrimaryMatched 
                        ? "현재 아이의 월령에 딱 맞는 검사 시기입니다. 지금 바로 발달 상태를 확인해보세요."
                        : `현재 권장 검사 기간은 아니지만, 가장 가까운 ${primaryStage.label} 단계를 미리 확인하거나 진행할 수 있습니다.`)
                }
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
                {isPrimaryCompleted ? (
                <>
                    <button
                        onClick={() => onViewResult(completedResult)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <FileText className="w-4 h-4" /> 결과 보기
                    </button>
                        <button
                        onClick={() => onStart(primaryStage)}
                        className="px-4 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold py-3 rounded-lg transition-colors"
                    >
                        재검사
                    </button>
                </>
                ) : (
                <button
                    onClick={() => onStart(primaryStage)}
                    className={`w-full font-bold py-3 rounded-lg transition-colors shadow-sm 
                        ${isPrimaryMatched 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-amber-500 hover:bg-amber-600 text-white'}`
                    }
                >
                    {primaryStage.label} 검사 시작하기
                </button>
                )}
            </div>
          </div>

          {/* Next Stage Info - Only shown if the current stage is COMPLETED */}
          {nextStage && isPrimaryCompleted && (
              <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 animate-fade-in">
                  <div className="p-1.5 bg-white rounded-full shadow-sm">
                      <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400">다음 단계 예고</div>
                      <div className="text-sm font-bold text-slate-600">
                          {nextStage.label} (생후 {nextStage.minMonths}개월부터)
                      </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
