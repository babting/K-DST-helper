
import { AssessmentResult, ScreeningStage, ChildProfile } from "../types";
import { GROWTH_STANDARDS } from "../constants";
import { calculateMonthsBetween } from "../utils/date";

// --- Development Analysis Logic ---

const DOMAIN_ADVICE: Record<string, string> = {
    '대근육 운동': '대근육 발달을 위해서는 몸 전체를 움직이는 놀이가 좋습니다. 엎드려서 고개를 들게 하거나, 조금 더 큰 아이라면 공차기, 계단 오르기 같은 활동을 함께 해주세요.',
    '소근육 운동': '손가락을 사용하는 놀이가 필요해요. 작은 물건 집기, 블록 쌓기, 단추 끼우기 등 세밀한 조작을 요구하는 장난감을 활용해보세요.',
    '인지': '아이의 호기심을 자극해주세요. "이게 뭐지?" 하고 물어보거나, 숨겨진 물건 찾기 놀이(까꿍 놀이)가 인지 발달에 큰 도움이 됩니다.',
    '언어': '아이와 끊임없이 대화하세요. 아이가 옹알이를 하거나 말을 하면 적극적으로 반응해주고, 사물의 이름을 정확하게 말해주는 것이 좋습니다.',
    '사회성': '거울 보기 놀이나 가족들과의 상호작용 시간을 늘려주세요. 또래 친구들과 어울릴 기회를 만들어주는 것도 사회성 발달의 밑거름이 됩니다.',
    '자조': '혼자 해보려는 시도를 격려해주세요. 컵 잡고 마시기, 수저질 하기, 옷 입기 등을 서툴더라도 기다려주면 아이의 자존감이 높아집니다.'
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

    // 1. Overall Assessment
    if (totalPercentage >= 85) {
        lines.push(`### 🌟 종합 평가: 매우 우수 (상위 10% 예상)`);
        lines.push(`아이의 발달 상태가 전반적으로 **매우 훌륭합니다!** 대부분의 영역에서 또래보다 빠른 성장을 보이고 있으며, 특히 새로운 과제에 대한 적응력이 뛰어납니다.`);
        lines.push(`지금처럼 아이가 흥미를 보이는 활동을 적극적으로 지지해주시고, 다양한 감각 자극을 경험하게 해주세요.`);
    } else if (totalPercentage >= 60) {
        lines.push(`### 🌱 종합 평가: 양호 (평균 범위)`);
        lines.push(`아이는 또래와 비슷한 속도로 **건강하게 자라고 있습니다.** 몇몇 과업은 아주 잘 수행하고 있고, 일부 연습이 필요한 부분도 보이지만 지극히 정상적인 발달 과정입니다.`);
        lines.push(`조급해하지 마시고, 아이와 눈을 맞추며 즐겁게 놀아주는 시간을 조금 더 늘려보세요.`);
    } else {
        lines.push(`### 🦁 종합 평가: 관심과 격려 필요`);
        lines.push(`현재 아이의 발달 속도가 또래보다 **조금 천천히 가고 있습니다.** 하지만 아이들의 성장은 계단식이므로, 부모님의 관심과 자극이 있다면 금방 따라잡을 수 있습니다.`);
        lines.push(`너무 걱정하기보다는, 아이가 어려워하는 부분을 놀이처럼 반복해서 경험하게 도와주세요.`);
    }

    lines.push(`\n---\n`);

    // 2. Specific Advice
    if (lowDomains.length > 0) {
        lines.push(`### 💪 집중 케어 가이드`);
        lines.push(`다음 영역에 조금 더 신경 써주시면 좋아요:`);
        lowDomains.forEach(domain => {
            lines.push(`- **${domain}**: ${DOMAIN_ADVICE[domain] || '다양한 자극을 주며 지켜봐주세요.'}`);
        });
    } else {
        lines.push(`### 🌈 앞으로의 육아 팁`);
        lines.push(`특별히 부족한 부분 없이 고르게 발달하고 있습니다. 이제는 아이가 좋아하는 놀이를 스스로 선택하게 하고, 성취감을 느낄 수 있는 작은 미션들을 주어 자존감을 높여주세요.`);
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
            title: "데이터 부족",
            content: "성장 기록을 입력해주시면 또래 평균과 비교해 분석해드립니다.",
            status: "caution"
        };
    }

    const latest = history[history.length - 1];
    const val = metric === 'height' ? latest.height : metric === 'weight' ? latest.weight : latest.headCircumference;
    const date = latest.date;
    
    if (!val) return { title: "분석 불가", content: "데이터 오류입니다.", status: "warning" };

    // Calculate Age in Months at the time of record
    const recordAgeMonths = Math.round(calculateMonthsBetween(profile.birthDate, date));
    
    // Find Standard
    const standards = GROWTH_STANDARDS[profile.gender];
    // Find closest month in standards
    const standard = standards.reduce((prev, curr) => 
        Math.abs(curr.month - recordAgeMonths) < Math.abs(prev.month - recordAgeMonths) ? curr : prev
    );

    const stdVal = metric === 'height' ? standard.h : metric === 'weight' ? standard.w : standard.hc;
    
    // Calculate simple deviation (This is a simplified Z-score proxy for demo)
    // Assuming roughly: 1 SD is ~ 4-5% for height, ~10-12% for weight.
    const percentDiff = ((val - stdVal) / stdVal) * 100;

    // Generate Message
    if (metric === 'height') {
        if (percentDiff >= 5) {
            return {
                title: "키가 큰 편이에요! 🦒",
                content: `또래 평균(${stdVal}cm)보다 약 ${percentDiff.toFixed(1)}% 더 큽니다. 유전적인 영향일 수도 있지만, 잘 먹고 잘 자고 있다는 증거예요. 지금의 성장세를 유지해주세요!`,
                status: "positive"
            };
        } else if (percentDiff <= -5) {
            return {
                title: "조금 천천히 크고 있어요 🌱",
                content: `또래 평균(${stdVal}cm)보다 약간 작습니다. 하지만 걱정 마세요. 아이마다 성장 급등기가 다릅니다. 단백질 섭취를 늘리고, 밤 10시 전 수면 습관을 챙겨주세요.`,
                status: "caution"
            };
        } else {
            return {
                title: "평균 키만큼 잘 자라요 🌳",
                content: `또래 평균(${stdVal}cm)과 거의 비슷합니다. 성장 곡선을 잘 따라가고 있어 아주 이상적입니다. 규칙적인 운동은 키 성장에 더 도움이 됩니다.`,
                status: "positive"
            };
        }
    } else if (metric === 'weight') {
        if (percentDiff >= 15) {
             return {
                title: "체격이 든든해요 💪",
                content: `또래 평균(${stdVal}kg)보다 체중이 많이 나가는 편입니다. 한참 활동량이 늘어날 때라 괜찮지만, 간식으로 과자보다는 과일이나 야채를 주는 것이 좋겠습니다.`,
                status: "caution"
            };
        } else if (percentDiff <= -10) {
             return {
                title: "조금 가벼운 편이에요 🍃",
                content: `또래 평균(${stdVal}kg)보다 적게 나갑니다. 밥을 잘 안 먹는다면 식재료의 질감을 바꿔보거나, 식사 시간을 즐거운 놀이처럼 만들어주세요.`,
                status: "caution"
            };
        } else {
             return {
                title: "딱 좋은 몸무게예요 ✨",
                content: `또래 평균(${stdVal}kg) 범위 내에서 잘 성장하고 있습니다. 영양 밸런스가 잘 잡혀 있는 것 같네요. 지금처럼 골고루 먹여주세요!`,
                status: "positive"
            };
        }
    } else { // Head
        if (percentDiff >= 5) {
             return {
                title: "머리둘레가 넉넉해요 🧠",
                content: `평균(${stdVal}cm)보다 조금 큽니다. 머리둘레는 유전적 영향이 크며, 뇌가 잘 자라고 있다는 신호이기도 하니 크게 걱정하지 않으셔도 됩니다.`,
                status: "positive"
            };
        } else if (percentDiff <= -5) {
             return {
                title: "머리가 작고 귀여워요 👶",
                content: `평균(${stdVal}cm)보다 약간 작습니다. 정기 검진에서 꾸준히 자라고 있다면 문제입니다. 다양한 소리와 색깔 자극을 많이 주시면 좋습니다.`,
                status: "positive"
            };
        } else {
             return {
                title: "평균 머리둘레예요 📏",
                content: `평균(${stdVal}cm)과 비슷하게 잘 자라고 있습니다. 머리둘레는 뇌 발달의 지표 중 하나이니, 꾸준히 기록하며 지켜봐주세요.`,
                status: "positive"
            };
        }
    }
};
