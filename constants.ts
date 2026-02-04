import { DevelopmentalDomain, Question, ScreeningStage } from './types';

// Helper to create questions quickly
const q = (id: string, domain: DevelopmentalDomain, text: string): Question => ({ id, domain, text });

// Simplified K-DST Questions
const questions4to6: Question[] = [
  q('4-6_GM_1', DevelopmentalDomain.GROSS_MOTOR, '엎드려 놓으면 팔로 지지하여 머리와 가슴을 들어 올립니까?'),
  q('4-6_GM_2', DevelopmentalDomain.GROSS_MOTOR, '바로 누운 자세에서 양손을 잡고 당기면 머리를 따라 올라옵니까?'),
  q('4-6_FM_1', DevelopmentalDomain.FINE_MOTOR, '손에 닿는 물건을 잡으려고 손을 뻗습니까?'),
  q('4-6_CG_1', DevelopmentalDomain.COGNITION, '움직이는 물체를 따라 시선을 180도 정도 움직입니까?'),
  q('4-6_LG_1', DevelopmentalDomain.LANGUAGE, '기분이 좋으면 옹알이를 합니까? (예: 아아, 우우 등)'),
  q('4-6_SC_1', DevelopmentalDomain.SOCIAL, '얼르는 소리를 내면 웃습니까?'),
];

const questions9to12: Question[] = [
  q('9-12_GM_1', DevelopmentalDomain.GROSS_MOTOR, '물건을 잡고 일어섭니까?'),
  q('9-12_GM_2', DevelopmentalDomain.GROSS_MOTOR, '혼자서 앉은 자세를 유지하며 장난감을 가지고 놉니까?'),
  q('9-12_FM_1', DevelopmentalDomain.FINE_MOTOR, '엄지와 검지를 사용하여 작은 물건(건포도 등)을 집을 수 있습니까?'),
  q('9-12_CG_1', DevelopmentalDomain.COGNITION, '찾으려는 물건을 덮어 감추면 덮개를 들추고 찾습니까?'),
  q('9-12_LG_1', DevelopmentalDomain.LANGUAGE, '"안 돼"라고 말하면 하던 행동을 잠시 멈춥니까?'),
  q('9-12_LG_2', DevelopmentalDomain.LANGUAGE, '"엄마", "아빠" 외에 할 수 있는 단어가 한두 개 있습니까?'),
  q('9-12_SC_1', DevelopmentalDomain.SOCIAL, '낯선 사람을 보면 불안해하거나 웁니까?'),
  q('9-12_SH_1', DevelopmentalDomain.SELF_HELP, '혼자서 컵을 잡고 물을 마십니까?'),
];

const questions18to24: Question[] = [
  q('18-24_GM_1', DevelopmentalDomain.GROSS_MOTOR, '난간을 잡지 않고 계단을 오르내릴 수 있습니까?'),
  q('18-24_GM_2', DevelopmentalDomain.GROSS_MOTOR, '제자리에서 공을 찰 수 있습니까?'),
  q('18-24_FM_1', DevelopmentalDomain.FINE_MOTOR, '블록을 3~4개 정도 쌓을 수 있습니까?'),
  q('18-24_CG_1', DevelopmentalDomain.COGNITION, '간단한 심부름을 수행합니까? (예: 기저귀 가져와)'),
  q('18-24_LG_1', DevelopmentalDomain.LANGUAGE, '두 단어를 연결하여 말합니까? (예: 엄마 물, 이거 뭐야)'),
  q('18-24_SC_1', DevelopmentalDomain.SOCIAL, '다른 아이들과 함께 있는 것을 좋아합니까?'),
  q('18-24_SH_1', DevelopmentalDomain.SELF_HELP, '수저를 사용하여 밥을 먹으려 노력합니까?'),
];

const questions30to36: Question[] = [
  q('30-36_GM_1', DevelopmentalDomain.GROSS_MOTOR, '한 발로 1~2초간 서 있을 수 있습니까?'),
  q('30-36_FM_1', DevelopmentalDomain.FINE_MOTOR, '단추를 끼우거나 뺄 수 있습니까?'),
  q('30-36_FM_2', DevelopmentalDomain.FINE_MOTOR, '원을 보고 비슷하게 그릴 수 있습니까?'),
  q('30-36_CG_1', DevelopmentalDomain.COGNITION, '크다/작다의 개념을 이해합니까?'),
  q('30-36_LG_1', DevelopmentalDomain.LANGUAGE, '자신의 이름을 말할 수 있습니까?'),
  q('30-36_SC_1', DevelopmentalDomain.SOCIAL, '친구와 장난감을 나누어 쓰거나 순서를 지킬 수 있습니까?'),
  q('30-36_SH_1', DevelopmentalDomain.SELF_HELP, '혼자서 바지를 내리고 입을 수 있습니까?'),
];

const questions42to48: Question[] = [
    q('42-48_GM_1', DevelopmentalDomain.GROSS_MOTOR, '한 발로 깡충깡충 뛸 수 있습니까?'),
    q('42-48_FM_1', DevelopmentalDomain.FINE_MOTOR, '가위로 선을 따라 종이를 오릴 수 있습니까?'),
    q('42-48_LG_1', DevelopmentalDomain.LANGUAGE, '과거나 미래의 일을 문장으로 표현합니까?'),
    q('42-48_SC_1', DevelopmentalDomain.SOCIAL, '규칙이 있는 간단한 게임을 할 수 있습니까?'),
];

const questions54to60: Question[] = [
    q('54-60_GM_1', DevelopmentalDomain.GROSS_MOTOR, '그네를 혼자서 탈 수 있습니까?'),
    q('54-60_FM_1', DevelopmentalDomain.FINE_MOTOR, '삼각형을 보고 따라 그릴 수 있습니까?'),
    q('54-60_CG_1', DevelopmentalDomain.COGNITION, '숫자를 10까지 셀 수 있습니까?'),
    q('54-60_LG_1', DevelopmentalDomain.LANGUAGE, '끝말잇기를 할 수 있습니까?'),
];

export const SCREENING_STAGES: ScreeningStage[] = [
  { id: 'S1', label: '4 ~ 6개월', minMonths: 4, maxMonths: 6, questions: questions4to6 },
  { id: 'S2', label: '9 ~ 12개월', minMonths: 9, maxMonths: 12, questions: questions9to12 },
  { id: 'S3', label: '18 ~ 24개월', minMonths: 18, maxMonths: 24, questions: questions18to24 },
  { id: 'S4', label: '30 ~ 36개월', minMonths: 30, maxMonths: 36, questions: questions30to36 },
  { id: 'S5', label: '42 ~ 48개월', minMonths: 42, maxMonths: 48, questions: questions42to48 },
  { id: 'S6', label: '54 ~ 60개월', minMonths: 54, maxMonths: 60, questions: questions54to60 },
];

// Mock Growth Standard Data (Approximate 50th percentile)
// Format: { month: number, h: height(cm), w: weight(kg), hc: head(cm) }
export const GROWTH_STANDARDS = {
  MALE: [
    { month: 0, h: 49.9, w: 3.3, hc: 34.5 },
    { month: 1, h: 54.7, w: 4.5, hc: 37.3 },
    { month: 2, h: 58.4, w: 5.6, hc: 39.1 },
    { month: 3, h: 61.4, w: 6.4, hc: 40.5 },
    { month: 4, h: 63.9, w: 7.0, hc: 41.6 },
    { month: 5, h: 65.9, w: 7.5, hc: 42.6 },
    { month: 6, h: 67.6, w: 7.9, hc: 43.3 },
    { month: 9, h: 72.0, w: 8.9, hc: 45.0 },
    { month: 12, h: 75.7, w: 9.6, hc: 46.1 },
    { month: 15, h: 79.1, w: 10.3, hc: 47.0 },
    { month: 18, h: 82.3, w: 10.9, hc: 47.7 },
    { month: 24, h: 87.8, w: 12.2, hc: 48.9 },
    { month: 30, h: 91.9, w: 13.3, hc: 49.5 },
    { month: 36, h: 96.1, w: 14.3, hc: 50.0 },
    { month: 42, h: 99.9, w: 15.3, hc: 50.4 },
    { month: 48, h: 103.3, w: 16.3, hc: 50.8 },
    { month: 54, h: 106.7, w: 17.3, hc: 51.2 },
    { month: 60, h: 110.0, w: 18.3, hc: 51.5 },
  ],
  FEMALE: [
    { month: 0, h: 49.1, w: 3.2, hc: 33.9 },
    { month: 1, h: 53.7, w: 4.2, hc: 36.5 },
    { month: 2, h: 57.1, w: 5.1, hc: 38.3 },
    { month: 3, h: 59.8, w: 5.8, hc: 39.5 },
    { month: 4, h: 62.1, w: 6.4, hc: 40.6 },
    { month: 5, h: 64.0, w: 6.9, hc: 41.5 },
    { month: 6, h: 65.7, w: 7.3, hc: 42.2 },
    { month: 9, h: 70.1, w: 8.2, hc: 43.8 },
    { month: 12, h: 74.0, w: 8.9, hc: 44.9 },
    { month: 15, h: 77.5, w: 9.6, hc: 45.8 },
    { month: 18, h: 80.7, w: 10.2, hc: 46.5 },
    { month: 24, h: 86.4, w: 11.5, hc: 47.7 },
    { month: 30, h: 90.7, w: 12.7, hc: 48.4 },
    { month: 36, h: 95.1, w: 13.9, hc: 48.9 },
    { month: 42, h: 99.0, w: 15.0, hc: 49.4 },
    { month: 48, h: 102.7, w: 16.1, hc: 49.9 },
    { month: 54, h: 106.2, w: 17.2, hc: 50.3 },
    { month: 60, h: 109.4, w: 18.2, hc: 50.7 },
  ]
};
