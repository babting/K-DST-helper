
import { AssessmentResult, ScreeningStage, ChildProfile } from "../types";
import { GROWTH_STANDARDS } from "../constants";
import { calculateMonthsBetween } from "../utils/date";

// --- Development Analysis Logic ---

const DOMAIN_ADVICE: Record<string, string> = {
    '대근육 운동': '몸 전체를 쓰는 놀이(공차기, 계단)가 좋습니다.',
    '소근육 운동': '손가락 놀이(블록, 단추)를 늘려주세요.',
    '인지': '숨은 물건 찾기나 "이게 뭘까?" 퀴즈가 도움됩니다.',
    '언어': '아이의 말에 적극 반응하고 단어를 정확히 들려주세요.',
    '사회성': '거울 보기, 역할 놀이로 상호작용을 연습하세요.',
    '자조': '서툴러도 혼자 옷 입기, 컵 쓰기를 기다려주세요.'
};

export const analyzeDevelopment = async (
  result: AssessmentResult,
  stage: ScreeningStage
): Promise<string> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    let totalScore = 0;
    let maxTotalScore = 0;
    const domainScores: Record<string, { current: number, max: number }> = {};

    stage.questions.forEach(q => {
        const answer = result.answers.find(a => a.questionId === q.id);
        const score = answer ? answer.score : 0;
        
        if (!domainScores[q.domain]) domainScores[q.domain] = { current: 0, max: 0 };
        domainScores[q.domain].current += score;
        domainScores[q.domain].max += 3;

        totalScore += score;
        maxTotalScore += 3;
    });

    const totalPercentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
    
    // Find weak domains (< 60%)
    const lowDomains = Object.entries(domainScores)
        .filter(([_, val]) => (val.current / val.max) < 0.6)
        .map(([domain]) => domain);

    // Generate Markdown Report
    const lines: string[] = [];

    // 1. Overall Assessment (Concise)
    if (totalPercentage >= 85) {
        lines.push(`**🏆 종합 평가: 매우 우수** (상위 10% 예상)\n또래보다 빠른 성장을 보이고 있어요. 특히 새로운 적응력이 뛰어납니다.`);
    } else if (totalPercentage >= 60) {
        lines.push(`**🌱 종합 평가: 양호** (평균 범위)\n또래와 비슷한 속도로 건강하게 자라고 있어요. 아주 정상적인 발달 과정입니다.`);
    } else {
        lines.push(`**🦁 종합 평가: 격려 필요**\n또래보다 조금 천천히 가고 있어요. 부모님의 자극이 더해지면 금방 따라잡을 거예요.`);
    }

    lines.push(`\n---\n`);

    // 2. Key Tips (Bulleted)
    if (lowDomains.length > 0) {
        lines.push(`**💪 집중 케어 포인트**`);
        lowDomains.forEach(domain => {
            lines.push(`* **${domain}**: ${DOMAIN_ADVICE[domain]}`);
        });
    } else {
        lines.push(`**🌈 육아 팁**\n특별히 부족한 부분 없이 고르게 발달 중입니다. 아이가 좋아하는 놀이를 스스로 선택하게 해주세요.`);
    }

    return lines.join('\n\n');
};


// --- Growth Analysis Logic ---

export const analyzeGrowth = async (
    profile: ChildProfile, 
    metric: 'height' | 'weight' | 'head'
): Promise<{ title: string; content: string; status: 'positive' | 'caution' | 'warning' }> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 600));

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
    const standard = standards.reduce((prev, curr) => 
        Math.abs(curr.month - recordAgeMonths) < Math.abs(prev.month - recordAgeMonths) ? curr : prev
    );

    const stdVal = metric === 'height' ? standard.h : metric === 'weight' ? standard.w : standard.hc;
    const percentDiff = ((val - stdVal) / stdVal) * 100;

    // Concise Messages
    if (metric === 'height') {
        if (percentDiff >= 5) {
            return {
                title: "키가 큰 편이에요! 🦒",
                content: `평균(${stdVal}cm)보다 **${percentDiff.toFixed(1)}%** 큽니다. 잘 크고 있으니 이대로만 유지해주세요!`,
                status: "positive"
            };
        } else if (percentDiff <= -5) {
            return {
                title: "조금 천천히 커요 🌱",
                content: `평균(${stdVal}cm)보다 작아요. 단백질 섭취와 일찍 자는 습관을 챙겨주세요.`,
                status: "caution"
            };
        } else {
            return {
                title: "딱 평균 키예요 🌳",
                content: `평균(${stdVal}cm)과 거의 비슷해요. 성장 곡선을 아주 잘 따라가고 있습니다.`,
                status: "positive"
            };
        }
    } else if (metric === 'weight') {
        if (percentDiff >= 15) {
             return {
                title: "체격이 든든해요 💪",
                content: `평균(${stdVal}kg)보다 체중이 많아요. 간식으로 과자 대신 과일/야채를 추천해요.`,
                status: "caution"
            };
        } else if (percentDiff <= -10) {
             return {
                title: "조금 가벼워요 🍃",
                content: `평균(${stdVal}kg)보다 적어요. 식사 시간을 즐거운 놀이처럼 만들어주세요.`,
                status: "caution"
            };
        } else {
             return {
                title: "딱 좋은 몸무게 ✨",
                content: `평균(${stdVal}kg) 범위 내로 아주 건강합니다. 지금처럼 골고루 먹여주세요!`,
                status: "positive"
            };
        }
    } else { // Head
        if (percentDiff >= 5) {
             return {
                title: "머리가 넉넉해요 🧠",
                content: `평균(${stdVal}cm)보다 조금 큽니다. 뇌가 잘 자라는 신호니 걱정 마세요.`,
                status: "positive"
            };
        } else if (percentDiff <= -5) {
             return {
                title: "작고 귀여운 두상 👶",
                content: `평균(${stdVal}cm)보다 작아요. 꾸준히 자라고 있다면 문제없습니다.`,
                status: "positive"
            };
        } else {
             return {
                title: "평균 머리둘레 📏",
                content: `평균(${stdVal}cm)과 비슷해요. 뇌 발달이 잘 이루어지고 있습니다.`,
                status: "positive"
            };
        }
    }
};
