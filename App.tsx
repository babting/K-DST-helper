
import React, { useState, useEffect } from 'react';
import { ChildProfile, ScreeningStage, AssessmentResult, AssessmentAnswer, GrowthRecord } from './types';
import { SCREENING_STAGES } from './constants';
import { calculateAgeInMonths, calculateDays } from './utils/date';
import { ProfileSetup } from './components/ProfileSetup';
import { StageSelector } from './components/StageSelector';
import { Checklist } from './components/Checklist';
import { ResultView } from './components/ResultView';
import { GrowthStats } from './components/GrowthStats';
import { Stethoscope, ChevronRight, Home, LineChart, ClipboardList, User } from 'lucide-react';

enum AppView {
  PROFILE_SETUP,
  HOME,
  GROWTH,
  SCREENING,
  CHECKLIST_RUN,
  RESULT,
}

export default function App() {
  // Data State with Persistence
  const [profile, setProfile] = useState<ChildProfile | null>(() => {
    try {
      const saved = localStorage.getItem('childProfile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to load profile", e);
      return null;
    }
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<'HOME' | 'GROWTH'>('HOME');
  const [viewMode, setViewMode] = useState<'MAIN' | 'FULLSCREEN_TASK'>('MAIN'); 
  const [isTestActive, setIsTestActive] = useState(false); // New flag to distinguish Checklist vs Result
  
  // If profile exists, setup is closed by default
  const [profileSetupOpen, setProfileSetupOpen] = useState(() => !profile);

  const [selectedStage, setSelectedStage] = useState<ScreeningStage | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  // Persistence Effect
  useEffect(() => {
    if (profile) {
      localStorage.setItem('childProfile', JSON.stringify(profile));
    }
  }, [profile]);

  // --- HANDLERS ---

  const handleProfileComplete = (newProfile: ChildProfile) => {
    setProfile(newProfile);
    setProfileSetupOpen(false);
    setViewMode('MAIN');
    setActiveTab('HOME');
  };

  const handleStartScreening = (stage: ScreeningStage) => {
    setSelectedStage(stage);
    setIsTestActive(true); // Explicitly enter test mode
    setViewMode('FULLSCREEN_TASK'); 
  };

  const handleSubmitAssessment = (answers: AssessmentAnswer[]) => {
    if (!profile || !selectedStage) return;
    const result: AssessmentResult = {
      date: new Date().toISOString(),
      childAgeMonths: calculateAgeInMonths(profile.birthDate),
      stageId: selectedStage.id,
      answers,
    };
    setAssessmentResult(result);
    setIsTestActive(false); // Test finished, show result
  };

  const handleRestart = () => {
    setViewMode('MAIN');
    setActiveTab('HOME'); 
    setIsTestActive(false);
  };
  
  const handleViewResult = (result: AssessmentResult) => {
      // Find the stage for this result
      const stage = SCREENING_STAGES.find(s => s.id === result.stageId);
      if (stage) {
          setSelectedStage(stage);
          setAssessmentResult(result);
          setIsTestActive(false); // Viewing result, not taking test
          setViewMode('FULLSCREEN_TASK');
      }
  }

  const handleAddGrowthRecord = (record: GrowthRecord) => {
    if (!profile) return;

    // Check if record exists for this date
    const existingIndex = profile.growthHistory.findIndex(r => r.date === record.date);
    let updatedHistory = [...profile.growthHistory];

    if (existingIndex >= 0) {
        // Merge updates
        const existing = updatedHistory[existingIndex];
        updatedHistory[existingIndex] = {
            ...existing,
            // Only update fields that are provided
            height: record.height !== undefined ? record.height : existing.height,
            weight: record.weight !== undefined ? record.weight : existing.weight,
            headCircumference: record.headCircumference !== undefined ? record.headCircumference : existing.headCircumference,
        };
    } else {
        // Add new
        updatedHistory.push(record);
    }
    
    updatedHistory.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Update profile with new history
    const updatedProfile = {
        ...profile,
        growthHistory: updatedHistory
    };
    setProfile(updatedProfile);
  };

  // --- RENDER HELPERS ---

  const ageInMonths = profile ? calculateAgeInMonths(profile.birthDate) : 0;
  const daysSinceBirth = profile ? calculateDays(profile.birthDate) : 0;
  
  const matchedStage = SCREENING_STAGES.find(
    s => ageInMonths >= s.minMonths && ageInMonths <= s.maxMonths
  );

  const renderContent = () => {
    // 1. Profile Setup (Fullscreen)
    if (profileSetupOpen || !profile) {
        return <ProfileSetup onComplete={handleProfileComplete} initialProfile={profile} />;
    }

    // 2. Fullscreen Tasks (Checklist / Result)
    if (viewMode === 'FULLSCREEN_TASK') {
        if (isTestActive && selectedStage) {
             return (
                <Checklist 
                    stage={selectedStage}
                    onBack={() => setViewMode('MAIN')}
                    onSubmit={handleSubmitAssessment}
                />
            );
        }
        
        if (assessmentResult && selectedStage) {
            return <ResultView result={assessmentResult} stage={selectedStage} onRestart={handleRestart} />;
        }
        
        // Fallback
        return <div onClick={() => setViewMode('MAIN')}>Error State. Tap to go back.</div>;
    }

    // 3. Main Tabs
    switch (activeTab) {
        case 'HOME':
            return (
                <div className="p-4 space-y-6 pb-24">
                    {/* Hero Section */}
                    <div className="px-1 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                                {profile.gender === 'MALE' ? '왕자님 🤴' : '공주님 👸'}
                             </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {profile.name}와(과) 함께한 지<br/>
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
                            onStart={handleStartScreening}
                            onViewResult={handleViewResult}
                            completedResult={assessmentResult}
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
            );
        
        case 'GROWTH':
            return (
                <div className="p-4 h-full flex flex-col">
                    <GrowthStats profile={profile} onAddRecord={handleAddGrowthRecord} />
                </div>
            );
            
        default:
            return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center sm:items-center sm:py-10">
      {/* Mobile Frame */}
      <div className="w-full max-w-[430px] bg-slate-50 h-[100dvh] sm:h-[850px] sm:min-h-0 sm:rounded-[32px] shadow-2xl overflow-hidden relative border-slate-200 sm:border-[8px] flex flex-col">
        
        {/* Top Header - Only show in Main Tabs */}
        {!profileSetupOpen && viewMode === 'MAIN' && (
          <header className="bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 shrink-0">
            <div className="px-4 py-3 flex items-center justify-between">
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => setActiveTab('HOME')}
              >
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">아이건강해</h1>
              </div>
              <div 
                  className="flex items-center gap-2 cursor-pointer group rounded-full hover:bg-slate-50 transition-colors pr-1"
                  onClick={() => setProfileSetupOpen(true)}
              >
                  <div className="text-right">
                      <p className="font-bold text-slate-800 text-sm">{profile?.name}</p>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-full text-slate-400">
                      <ChevronRight className="w-3 h-3" />
                  </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content (Scrollable) */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
           <div className="flex-1 overflow-y-auto scrollbar-hide">
              {renderContent()}
           </div>
        </main>

        {/* Bottom Navigation Bar - Only show in Main Tabs */}
        {!profileSetupOpen && viewMode === 'MAIN' && (
            <div className="bg-white border-t border-slate-100 px-6 py-3 pb-5 sm:pb-3 shrink-0 flex justify-between items-center z-20">
                <button 
                    onClick={() => setActiveTab('HOME')}
                    className={`flex-1 flex flex-col items-center gap-1 transition-colors ${activeTab === 'HOME' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Home className={`w-6 h-6 ${activeTab === 'HOME' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold">홈</span>
                </button>

                <button 
                    onClick={() => setActiveTab('GROWTH')}
                    className={`flex-1 flex flex-col items-center gap-1 transition-colors ${activeTab === 'GROWTH' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LineChart className={`w-6 h-6 ${activeTab === 'GROWTH' ? 'stroke-[2.5px]' : ''}`} />
                    <span className="text-[10px] font-bold">성장관리</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
