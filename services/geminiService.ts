
import { AssessmentResult, ScreeningStage, ChildProfile } from "../types";
import { GROWTH_STANDARDS } from "../constants";
import { calculateMonthsBetween } from "../utils/date";

// --- Development Analysis Logic (Rule-based Replacement) ---

export const analyzeDevelopment = async (
  result: AssessmentResult,
  stage: ScreeningStage
): Promise<string> => {
    
    // Calculate basic stats
    const totalQuestions = stage.questions.length;
    const answeredQuestions = result.answers.length;
    let totalScore = 0;
    
    result.answers.forEach(a => totalScore += a.score);
    
    const maxPossibleScore = totalQuestions * 3;
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    let summary = "";
    if (percentage >= 85) {
        summary = "전반적으로 발달 상태가 **매우 우수**합니다! 🎉 또래보다 빠른 발달을 보이고 있어요.";
    } else if (percentage >= 70) {
        summary = "발달 상태가 **양호**합니다. 🌱 또래 아이들과 비슷하게 잘 자라고 있어요.";
    } else {
        summary = "일부 영역에서 세심한 관찰이 필요할 수 있습니다. 🏥 점수가 낮은 영역은 놀이를 통해 자극을 주세요.";
    }

    return `### 📊 ${stage.label} 발달 검사 결과
    
**종합 점수**: ${Math.round(percentage)}점

${summary}

**💡 육아 가이드**
* 아이가 잘하는 행동에는 아낌없이 칭찬해주세요.
* 점수가 낮은 항목은 평소 놀이 과정에서 자연스럽게 유도해보세요.
* 구체적인 발달 상담은 전문의와 상의하는 것이 가장 정확합니다.

_(이 리포트는 AI 연결 없이 생성된 기본 분석 결과입니다)_`;
};


// --- Growth Analysis Logic (Rule-based Replacement) ---

export const analyzeGrowth = async (
    profile: ChildProfile, 
    metric: 'height' | 'weight' | 'head'
): Promise<{ title: string; content: string; status: 'positive' | 'caution' | 'warning' }> => {
    
    const history = profile.growthHistory.filter(r => 
        metric === 'height' ? r.height : 
        metric === 'weight' ? r.weight : 
        r.headCircumference
    );
    
    if (history.length === 0) {
        return {
            title: "데이터 필요",
            content: "성장 기록을 입력하면 또래와 비교해드려요.",
            status: "caution"
        };
    }

    const latest = history[history.length - 1];
    const val = metric === 'height' ? latest.height : metric === 'weight' ? latest.weight : latest.headCircumference;
    const date = latest.date;
    
    if (!val) return { title: "분석 불가", content: "데이터 오류", status: "warning" };

    // Calculate Age in Months at the time of record
    const recordAgeMonths = Math.round(calculateMonthsBetween(profile.birthDate, date));
    
    // Find Standard
    const standards = GROWTH_STANDARDS[profile.gender];
    // Find closest month standard
    const standard = standards.reduce((prev, curr) => 
        Math.abs(curr.month - recordAgeMonths) < Math.abs(prev.month - recordAgeMonths) ? curr : prev
    );

    const stdVal = metric === 'height' ? standard.h : metric === 'weight' ? standard.w : standard.hc;
    const percentDiff = ((val - stdVal) / stdVal) * 100;
    
    const metricName = metric === 'height' ? '키' : metric === 'weight' ? '몸무게' : '머리둘레';
    
    // Rule-based logic
    let title = "";
    let content = "";
    let status: 'positive' | 'caution' | 'warning' = 'positive';

    if (Math.abs(percentDiff) <= 5) {
        title = `평균과 아주 비슷해요! ⚖️`;
        content = `또래 아이들의 평균 ${metricName}와 거의 같습니다. 아주 건강하게 잘 자라고 있어요.`;
        status = 'positive';
    } else if (percentDiff > 5 && percentDiff <= 15) {
        title = `또래보다 큰 편이에요! 🦒`;
        content = `평균보다 약 ${percentDiff.toFixed(1)}% 더 큽니다. 튼튼하게 자라고 있네요!`;
        status = 'positive';
    } else if (percentDiff > 15) {
        title = `성장이 아주 빨라요! 🚀`;
        content = `또래 상위권에 속하는 ${metricName}입니다. 영양 섭취가 충분해 보여요.`;
        status = 'positive'; // Being tall/heavy isn't necessarily a warning unless extreme, but keeping positive for general UX
    } else if (percentDiff < -5 && percentDiff >= -15) {
        title = `평균보다 조금 작아요 🐣`;
        content = `평균보다 약 ${Math.abs(percentDiff).toFixed(1)}% 작지만, 꾸준히 자라고 있다면 걱정하지 마세요.`;
        status = 'caution';
    } else {
        title = `세심한 관찰이 필요해요 🩺`;
        content = `또래 평균보다 차이가 다소 있습니다. (${Math.abs(percentDiff).toFixed(1)}% 차이) 꾸준한 기록과 전문가 상담을 권장합니다.`;
        status = 'warning';
    }

    // Simulate async delay slightly for UX consistency
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        title,
        content,
        status
    };
};
