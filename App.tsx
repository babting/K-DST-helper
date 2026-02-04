
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { ChildProfile, ScreeningStage, AssessmentResult, AssessmentAnswer, GrowthRecord } from './types';
import { SCREENING_STAGES } from './constants';
import { calculateAgeInMonths, calculateDays } from './utils/date';
import { ProfileSetup } from './components/ProfileSetup';
import { StageSelector } from './components/StageSelector';
import { Checklist } from './components/Checklist';
import { ResultView } from './components/ResultView';
import { GrowthStats } from './components/GrowthStats';
import { Stethoscope, ChevronRight, Home, LineChart, ClipboardList } from 'lucide-react';

// --- WRAPPER COMPONENTS FOR ROUTING ---

const ProtectedRoute = ({ children, profile }: { children: React.ReactNode, profile: ChildProfile | null }) => {
  if (!profile) {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
};

const ChecklistRoute = ({ 
  onSubmit 
}: { 
  onSubmit: (stageId: string, answers: AssessmentAnswer[]) => void 
}) => {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = SCREENING_STAGES.find(s => s.id === stageId);

  if (!stage) return <Navigate to="/" replace />;

  return (
    <div className="h-full bg-slate-50 min-h-screen">
        <Checklist 
            stage={stage}
            onBack={() => navigate('/')}
            onSubmit={(answers) => onSubmit(stageId!, answers)}
        />
    </div>
  );
};

const ResultRoute = ({ 
  results, 
  onRestart 
}: { 
  results: Record<string, AssessmentResult>, 
  onRestart: () => void 
}) => {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = SCREENING_STAGES.find(s => s.id === stageId);
  const result = results[stageId || ''];

  if (!stage || !result) return <Navigate to="/" replace />;

  return (
    <div className="h-full bg-slate-50 min-h-screen">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur shadow-sm border-b border-slate-100 px-4 py-3 flex items-center">
            <button onClick={() => navigate('/')} className="mr-3">
                 <ChevronRight className="w-6 h-6 rotate-180 text-slate-500" />
            </button>
            <h2 className="font-bold text-slate-800">검사 결과</h2>
        </div>
        <ResultView result={result} stage={stage} onRestart={onRestart} />
    </div>
  );
};

// --- MAIN APP COMPONENT ---

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Data State with Persistence
  const [profile, setProfile] = useState<ChildProfile | null>(() => {
    try {
      const saved = localStorage.getItem('childProfile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Store results by stageId to allow persistence across navigation
  const [assessmentResults, setAssessmentResults] = useState<Record<string, AssessmentResult>>({});

  useEffect(() => {
    if (profile) {
      localStorage.setItem('childProfile', JSON.stringify(profile));
    }
  }, [profile]);

  // --- HANDLERS ---

  const handleProfileComplete = (newProfile: ChildProfile) => {
    setProfile(newProfile);
    navigate('/', { replace: true });
  };

  const handleSubmitAssessment = (stageId: string, answers: AssessmentAnswer[]) => {
    if (!profile) return;
    const result: AssessmentResult = {
      date: new Date().toISOString(),
      childAgeMonths: calculateAgeInMonths(profile.birthDate),
      stageId: stageId,
      answers,
    };
    
    setAssessmentResults(prev => ({...prev, [stageId]: result}));
    navigate(`/result/${stageId}`);
  };

  const handleAddGrowthRecord = (record: GrowthRecord) => {
    if (!profile) return;

    const existingIndex = profile.growthHistory.findIndex(r => r.date === record.date);
    let updatedHistory = [...profile.growthHistory];

    if (existingIndex >= 0) {
        const existing = updatedHistory[existingIndex];
        updatedHistory[existingIndex] = {
            ...existing,
            height: record.height !== undefined ? record.height : existing.height,
            weight: record.weight !== undefined ? record.weight : existing.weight,
            headCircumference: record.headCircumference !== undefined ? record.headCircumference : existing.headCircumference,
        };
    } else {
        updatedHistory.push(record);
    }
    updatedHistory.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setProfile({ ...profile, growthHistory: updatedHistory });
  };

  // --- HELPER VARS ---
  const ageInMonths = profile ? calculateAgeInMonths(profile.birthDate) : 0;
  const daysSinceBirth = profile ? calculateDays(profile.birthDate) : 0;
  
  const matchedStage = SCREENING_STAGES.find(
    s => ageInMonths >= s.minMonths && ageInMonths <= s.maxMonths
  );

  // Check if we should show the bottom tab bar
  const showTabBar = ['/', '/growth'].includes(location.pathname);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl flex flex-col">
        
        {/* Header (Only on Home/Growth) */}
        {showTabBar && profile && (
          <header className="bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 shrink-0 sticky top-0">
            <div className="px-4 py-3 flex items-center justify-between">
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => navigate('/')}
              >
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">아이건강해</h1>
              </div>
              <div 
                  className="flex items-center gap-2 cursor-pointer group rounded-full hover:bg-slate-50 transition-colors pr-1"
                  onClick={() => navigate('/setup')}
              >
                  <div className="text-right">
                      <p className="font-bold text-slate-800 text-sm">{profile.name}</p>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-full text-slate-400">
                      <ChevronRight className="w-3 h-3" />
                  </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto scrollbar-hide">
            <Routes>
                {/* Profile Setup */}
                <Route path="/setup" element={
                    <ProfileSetup 
                        onComplete={handleProfileComplete} 
                        initialProfile={profile} 
                    />
                } />

                {/* Home Tab */}
                <Route path="/" element={
                    <ProtectedRoute profile={profile}>
                         <div className="p-4 space-y-6 pb-24 animate-fade-in">
                            {/* Hero Section */}
                            <div className="px-1 pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                     <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                                        {profile?.gender === 'MALE' ? '왕자님 🤴' : '공주님 👸'}
                                     </span>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {profile?.name}와(과) 함께한 지<br/>
                                    <span className="text-indigo-600 text-4xl font-extrabold">D+{daysSinceBirth}</span>
                                </h2>
                                <p className="text-slate-500 text-sm mt-2">
                                    생후 {ageInMonths}개월차 • 건강하게 자라고 있어요 🌱
                                </p>
                            </div>

                            <div className="h-px bg-slate-200 w-full" />

                            {/* Screening Card */}
                            <div>
                                 <div className="flex items-center gap-2 mb-3 px-1">
                                    <ClipboardList className="w-5 h-5 text-slate-800" />
                                    <h3 className="text-lg font-bold text-slate-800">발달 체크리스트</h3>
                                </div>
                                <StageSelector 
                                    currentAgeMonths={ageInMonths} 
                                    matchedStage={matchedStage}
                                    allStages={SCREENING_STAGES}
                                    onStart={(stage) => navigate(`/checklist/${stage.id}`)}
                                    onViewResult={(result) => navigate(`/result/${result.stageId}`)}
                                    allResults={assessmentResults}
                                />
                            </div>
                            
                            {/* Tip Card */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-3">💡 오늘의 육아 팁</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {ageInMonths < 12 
                                        ? "이 시기 아이들은 애착 형성이 가장 중요합니다. 눈을 맞추고 자주 안아주세요. 까꿍 놀이는 대상 영속성을 기르는데 좋아요." 
                                        : "아이의 자율성이 발달하는 시기입니다. 위험하지 않은 선에서 혼자 해보게 기다려주세요. '안돼'라는 말보다는 대안을 제시해주세요."}
                                </p>
                            </div>
                        </div>
                    </ProtectedRoute>
                } />

                {/* Growth Tab */}
                <Route path="/growth" element={
                    <ProtectedRoute profile={profile}>
                        <div className="p-4 h-full flex flex-col animate-fade-in">
                            {profile && <GrowthStats profile={profile} onAddRecord={handleAddGrowthRecord} />}
                        </div>
                    </ProtectedRoute>
                } />

                {/* Screening Routes */}
                <Route path="/checklist/:stageId" element={
                    <ProtectedRoute profile={profile}>
                        <ChecklistRoute onSubmit={handleSubmitAssessment} />
                    </ProtectedRoute>
                } />

                <Route path="/result/:stageId" element={
                    <ProtectedRoute profile={profile}>
                        <ResultRoute results={assessmentResults} onRestart={() => navigate('/')} />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </main>

        {/* Bottom Tab Bar (Only on Home/Growth) */}
        {showTabBar && (
            <div className="bg-white border-t border-slate-100 px-6 py-3 pb-safe shrink-0 flex justify-between items-center z-20 sticky bottom-0">
                <button 
                    onClick={() => navigate('/')}
                    className={`flex-1 flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Home className={`w-6 h-6 ${location.pathname === '/' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold">홈</span>
                </button>

                <button 
                    onClick={() => navigate('/growth')}
                    className={`flex-1 flex flex-col items-center gap-1 transition-colors ${location.pathname === '/growth' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LineChart className={`w-6 h-6 ${location.pathname === '/growth' ? 'stroke-[2.5px]' : ''}`} />
                    <span className="text-[10px] font-bold">성장관리</span>
                </button>
            </div>
        )}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
