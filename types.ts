
export type Gender = 'MALE' | 'FEMALE';

export interface GrowthRecord {
  date: string; // YYYY-MM-DD
  height?: number; // cm
  weight?: number; // kg
  headCircumference?: number; // cm
}

export interface ChildProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  growthHistory: GrowthRecord[];
}

export enum DevelopmentalDomain {
  GROSS_MOTOR = '대근육 운동',
  FINE_MOTOR = '소근육 운동',
  COGNITION = '인지',
  LANGUAGE = '언어',
  SOCIAL = '사회성',
  SELF_HELP = '자조',
}

export interface Question {
  id: string;
  domain: DevelopmentalDomain;
  text: string;
}

export interface ScreeningStage {
  id: string;
  label: string;
  minMonths: number;
  maxMonths: number;
  questions: Question[];
}

export interface AssessmentAnswer {
  questionId: string;
  score: number; // 0: 전혀 하지 못한다, 1: 할 수 있는 편이다, 2: 잘 한다, 3: 매우 잘 한다
}

export interface AssessmentResult {
  date: string;
  childAgeMonths: number;
  answers: AssessmentAnswer[];
  stageId: string;
  aiAnalysis?: string;
}
