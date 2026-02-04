
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentResult, ScreeningStage, ChildProfile } from "../types";
import { GROWTH_STANDARDS } from "../constants";
import { calculateMonthsBetween } from "../utils/date";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Development Analysis Logic ---

export const analyzeDevelopment = async (
  result: AssessmentResult,
  stage: ScreeningStage
): Promise<string> => {
    
    // Construct prompt context
    const questions = stage.questions;
    const answers = result.answers;
    
    let promptContext = `Child Age: ${result.childAgeMonths} months.\n`;
    promptContext += `Screening Stage: ${stage.label}\n`;
    promptContext += `Questions and Answers (0: Not at all, 1: Sometimes, 2: Often, 3: Well):\n`;
    
    questions.forEach(q => {
      const ans = answers.find(a => a.questionId === q.id);
      const score = ans ? ans.score : 0;
      promptContext += `- [${q.domain}] ${q.text}: Score ${score}\n`;
    });
  
    const prompt = `Analyze the developmental screening results for this child.
  Provide a comprehensive assessment report in Markdown format.
  
  Please follow this structure:
  1. **🏆 종합 평가**: Give a summary of the child's development status based on the scores (e.g., Excellent, Good, or Needs Attention).
  2. **💪 집중 케어 포인트**: Identify domains where the child scored low (< 2) and provide specific, actionable parenting tips.
  3. **🌈 육아 팁**: General encouraging advice suitable for this age.
  
  Use friendly, supportive language suitable for parents. Korean language only.`;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { role: 'user', parts: [{ text: promptContext }] },
            { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: "You are a helpful child development expert assistant."
        }
      });
      
      return response.text || "분석 결과를 생성하지 못했습니다.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "죄송합니다. AI 분석을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
};


// --- Growth Analysis Logic ---

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
    const standard = standards.reduce((prev, curr) => 
        Math.abs(curr.month - recordAgeMonths) < Math.abs(prev.month - recordAgeMonths) ? curr : prev
    );

    const stdVal = metric === 'height' ? standard.h : metric === 'weight' ? standard.w : standard.hc;
    const percentDiff = ((val - stdVal) / stdVal) * 100;
    
    const metricName = metric === 'height' ? '키' : metric === 'weight' ? '몸무게' : '머리둘레';
    const unit = metric === 'height' ? 'cm' : metric === 'weight' ? 'kg' : 'cm';

    const prompt = `
    Analyze this child growth data:
    - Age: ${recordAgeMonths} months
    - Gender: ${profile.gender}
    - Metric: ${metricName}
    - Value: ${val} ${unit}
    - Standard (50th percentile): ${stdVal} ${unit}
    - Difference: ${percentDiff.toFixed(1)}%
    
    Provide a short, 1-2 sentence friendly insight in Korean.
    Return JSON:
    {
       "title": "Short catchy title with emoji (e.g. 키가 쑥쑥 컸어요! 🦒)",
       "content": "Friendly explanation comparing to average.",
       "status": "positive" | "caution" | "warning"
    }
    Rules for status:
    - "positive": Within reasonable range (e.g. +/- 10% for weight, +/- 5% for height).
    - "caution": Slightly outside average.
    - "warning": Significantly outside.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        status: { type: Type.STRING, description: "positive, caution, or warning" }
                    },
                    required: ["title", "content", "status"]
                },
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        const json = JSON.parse(text);
        
        // Validate status
        const validStatus = ['positive', 'caution', 'warning'].includes(json.status) ? json.status : 'positive';
        
        return {
            title: json.title,
            content: json.content,
            status: validStatus
        };

    } catch (error) {
        console.error("Gemini Growth Analysis Error:", error);
        // Fallback
        return {
            title: "분석 중...",
            content: "AI 분석 연결 상태가 좋지 않습니다. 잠시 후 다시 시도해주세요.",
            status: "positive"
        };
    }
};
