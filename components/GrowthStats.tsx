
import React, { useState, useEffect, useMemo } from 'react';
import { ChildProfile, GrowthRecord } from '../types';
import { GROWTH_STANDARDS } from '../constants';
import { analyzeGrowth } from '../services/geminiService';
import { calculateMonthsBetween } from '../utils/date';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Ruler, Weight, CircleDashed, Plus, Calendar, Sparkles, RefreshCcw, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DatePickerPopup } from './ProfileSetup';
import { useParams, useNavigate } from 'react-router-dom';

interface Props {
  profile: ChildProfile;
  onAddRecord: (record: GrowthRecord) => void;
}

type MetricType = 'height' | 'weight' | 'head';

export const GrowthStats: React.FC<Props> = ({ profile, onAddRecord }) => {
  const { metric, action } = useParams<{ metric: string; action: string }>();
  const navigate = useNavigate();

  // Validate and determine active metric from URL
  const validMetrics: MetricType[] = ['height', 'weight', 'head'];
  const activeMetric: MetricType = (metric && validMetrics.includes(metric as MetricType)) 
    ? (metric as MetricType) 
    : 'height';

  const showAddModal = action === 'add';

  // If invalid metric in URL, redirect to default
  useEffect(() => {
    if (metric && !validMetrics.includes(metric as MetricType)) {
        navigate('/growth/height', { replace: true });
    }
  }, [metric, navigate]);

  // State to hold the structured insight
  const [aiInsight, setAiInsight] = useState<{ title: string; content: string; status: 'positive' | 'caution' | 'warning' } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);
  
  // Get latest stats
  const latestRecord = profile.growthHistory.length > 0 
    ? profile.growthHistory[profile.growthHistory.length - 1] 
    : null;

  // --- AI Insight Effect ---
  useEffect(() => {
    const fetchInsight = async () => {
        if (profile.growthHistory.length === 0) return;
        
        setLoadingInsight(true);
        try {
            // Pass activeMetric to analysis
            const insight = await analyzeGrowth(profile, activeMetric);
            setAiInsight(insight);
        } catch (e) {
            setAiInsight({ title: "분석 오류", content: "분석 정보를 불러오지 못했습니다.", status: 'positive' });
        } finally {
            setLoadingInsight(false);
        }
    };

    fetchInsight();
  }, [profile.growthHistory, profile.birthDate, activeMetric]); 

  // --- CHART DATA PREPARATION ---
  
  // Helper to interpolate standard value for any given month
  const getInterpolatedStandard = (month: number) => {
      const standards = GROWTH_STANDARDS[profile.gender];
      
      // Find range
      const lower = standards.filter(s => s.month <= month).pop();
      const upper = standards.find(s => s.month >= month);

      if (!lower) return upper ? (activeMetric === 'height' ? upper.h : activeMetric === 'weight' ? upper.w : upper.hc) : 0;
      if (!upper) return activeMetric === 'height' ? lower.h : activeMetric === 'weight' ? lower.w : lower.hc;
      if (lower.month === upper.month) return activeMetric === 'height' ? lower.h : activeMetric === 'weight' ? lower.w : lower.hc;

      // Linear Interpolation
      const range = upper.month - lower.month;
      const progress = (month - lower.month) / range;
      
      const valLower = activeMetric === 'height' ? lower.h : activeMetric === 'weight' ? lower.w : lower.hc;
      const valUpper = activeMetric === 'height' ? upper.h : activeMetric === 'weight' ? upper.w : upper.hc;
      
      return valLower + (valUpper - valLower) * progress;
  };

  const chartData = useMemo(() => {
      // 1. Convert User Data
      const userPoints = profile.growthHistory
        .map(record => {
            const m = calculateMonthsBetween(profile.birthDate, record.date);
            return {
                month: m,
                value: activeMetric === 'height' ? record.height : activeMetric === 'weight' ? record.weight : record.headCircumference,
                // Add standard value at this exact point for tooltip
                standard: parseFloat(getInterpolatedStandard(m).toFixed(1)),
                isUser: true
            };
        })
        .filter(d => d.value !== undefined && d.value > 0);

      // Determine Domain from user data
      let minM = 0;
      let maxM = 12;
      
      if (userPoints.length > 0) {
          const months = userPoints.map(d => d.month);
          const rawMin = Math.min(...months);
          const rawMax = Math.max(...months);
          const diff = rawMax - rawMin;

          // Domain Logic
          if (diff === 0) {
            // Single point
             if (rawMin < 1) {
                  minM = 0;
                  maxM = 1.2;
             } else {
                  minM = Math.max(0, rawMin - 1);
                  maxM = rawMin + 1;
             }
          } else if (diff < 2) {
             // Short range
             minM = Math.max(0, rawMin - 0.2);
             maxM = rawMax + 0.2;
          } else {
             // Normal range
             const padding = diff * 0.1;
             minM = Math.max(0, Math.floor(rawMin - padding));
             maxM = Math.ceil(rawMax + padding);
          }
      }

      // 2. Add Standard Curve Points (integer months within view)
      const standardPoints = GROWTH_STANDARDS[profile.gender]
        .filter(d => d.month >= Math.max(0, minM - 1) && d.month <= maxM + 1)
        .map(d => ({
            month: d.month,
            standard: activeMetric === 'height' ? d.h : activeMetric === 'weight' ? d.w : d.hc,
            value: null, // No user data at this point
            isUser: false
        }));

      // 3. Merge and Sort
      // We combine them so Recharts can plot lines correctly on the same axis
      // User points have both 'value' and 'standard'. Standard points only have 'standard'.
      const combined = [...userPoints, ...standardPoints]
        .sort((a, b) => a.month - b.month);

      return { data: combined, minDomain: minM, maxDomain: maxM };
  }, [profile, activeMetric]);

  const { data, minDomain, maxDomain } = chartData;

  // Calculate Y-Axis Domain
  const allValues = data
    .filter(d => d.month >= minDomain && d.month <= maxDomain)
    .flatMap(d => [d.standard, d.value].filter(v => v !== null && v !== undefined) as number[]);
  
  const minVal = allValues.length ? Math.min(...allValues) : 0;
  const maxVal = allValues.length ? Math.max(...allValues) : 100;
  const yRange = maxVal - minVal || 5; 
  const yPadding = yRange * 0.2; 
  
  const yDomain = [
      Math.max(0, Math.floor(minVal - yPadding)), 
      Math.ceil(maxVal + yPadding)
  ];

  const metricLabel = activeMetric === 'height' ? '키' : activeMetric === 'weight' ? '몸무게' : '머리둘레';
  const unit = activeMetric === 'height' ? 'cm' : activeMetric === 'weight' ? 'kg' : 'cm';
  const isMicroView = (maxDomain - minDomain) <= 3;

  const getLatestValue = (type: MetricType) => {
    const relevantRecords = profile.growthHistory.filter(r => 
        type === 'height' ? r.height !== undefined : 
        type === 'weight' ? r.weight !== undefined : 
        r.headCircumference !== undefined
    );
    
    if (relevantRecords.length === 0) return '-';
    
    const last = relevantRecords[relevantRecords.length - 1];
    if (type === 'height') return last.height;
    if (type === 'weight') return last.weight;
    return last.headCircumference;
  };

  const getStatusStyles = (status?: string) => {
      switch(status) {
          case 'warning': 
              return { box: 'bg-red-50 border-red-100 from-red-50 to-orange-50', icon: 'bg-red-500', text: 'text-red-900', iconText: 'text-white' };
          case 'caution':
              return { box: 'bg-amber-50 border-amber-100 from-amber-50 to-yellow-50', icon: 'bg-amber-500', text: 'text-amber-900', iconText: 'text-white' };
          case 'positive':
          default:
              return { box: 'bg-indigo-50 border-indigo-100 from-indigo-50 to-purple-50', icon: 'bg-indigo-600', text: 'text-indigo-900', iconText: 'text-white' };
      }
  };

  const currentStyles = getStatusStyles(aiInsight?.status);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20">
      
      {/* 1. Header with Add Button */}
      <div className="flex justify-between items-center px-1 mb-4 pt-2 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">성장 관리 📏</h2>
            <p className="text-slate-500 text-xs">AI 성장 분석 & 리포트</p>
          </div>
          <button 
            onClick={() => navigate(`/growth/${activeMetric}/add`)}
            className="flex items-center gap-1 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3 h-3" />
            기록하기
          </button>
      </div>

      {/* 2. Compact Segmented Control for Metrics */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 mx-1 shrink-0">
        {[
            { id: 'height', label: '키', unit: 'cm', icon: Ruler },
            { id: 'weight', label: '체중', unit: 'kg', icon: Weight },
            { id: 'head', label: '머리', unit: 'cm', icon: CircleDashed }
        ].map((m) => (
            <button
                key={m.id}
                onClick={() => navigate(`/growth/${m.id}`)}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                    activeMetric === m.id 
                    ? 'bg-white text-indigo-600 shadow-sm font-bold' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                <div className="flex items-center gap-1 text-xs">
                    <m.icon className="w-3 h-3" /> {m.label}
                </div>
                <div className="text-sm font-extrabold mt-0.5">
                    {getLatestValue(m.id as MetricType)} <span className="text-[10px] font-medium opacity-70">{m.unit}</span>
                </div>
            </button>
        ))}
      </div>

      {/* 3. Chart Section with Fixed Height */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mx-1 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {metricLabel} 성장 곡선
            </h3>
            <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                {minDomain.toFixed(1)}~{maxDomain.toFixed(1)}개월 구간
            </div>
          </div>
          
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="month" 
                    type="number"
                    domain={[minDomain, maxDomain]}
                    allowDataOverflow={true}
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    tickFormatter={(val) => isMicroView ? `${val.toFixed(1)}M` : `${Math.round(val)}M`}
                    tickCount={isMicroView ? 5 : 7}
                    interval="preserveStartEnd"
                />
                <YAxis 
                    domain={yDomain} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    width={30} 
                    allowDataOverflow={false}
                />
                <Tooltip 
                    labelFormatter={(v) => `${Number(v).toFixed(1)}개월`}
                    formatter={(value: number, name: string) => {
                        if (name === 'standard') return [`${value}${unit}`, '평균'];
                        if (name === 'value') return [`${value}${unit}`, '내 아이'];
                        return [value, name];
                    }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '4px 8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} iconSize={8} iconType="circle" />
                
                {/* Standard Line */}
                <Line 
                    dataKey="standard" 
                    name="평균" 
                    stroke="#cbd5e1" 
                    strokeWidth={2} 
                    dot={false}
                    type="monotone"
                    strokeDasharray="4 4"
                    isAnimationActive={false}
                    connectNulls
                />
                
                {/* User Data Line */}
                <Line 
                    dataKey="value" 
                    name="내 아이" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' }}
                    activeDot={{ r: 6 }}
                    type="monotone"
                    connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* 4. AI Insight Card */}
      <div className={`mx-1 shrink-0 bg-gradient-to-br ${currentStyles.box} p-4 rounded-2xl border transition-colors relative overflow-hidden min-h-[100px]`}>
          <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg shadow-sm ${currentStyles.icon}`}>
                  <Sparkles className={`w-4 h-4 ${currentStyles.iconText}`} />
              </div>
              <h3 className={`font-bold text-sm ${currentStyles.text}`}>
                  {aiInsight ? aiInsight.title : `${metricLabel} 분석`}
              </h3>
              {loadingInsight && <RefreshCcw className="w-3 h-3 text-indigo-400 animate-spin ml-auto" />}
          </div>
          
          {loadingInsight && !aiInsight ? (
              <div className="flex flex-col items-center justify-center py-2 text-xs text-indigo-400 gap-2">
                  <div className="animate-pulse">{metricLabel} 데이터를 분석하고 있습니다...</div>
              </div>
          ) : (
              <div className={`prose prose-sm max-w-none text-xs leading-relaxed ${currentStyles.text} opacity-90`}>
                  <ReactMarkdown>{aiInsight?.content || "기록을 입력하면 AI가 성장을 분석해드려요!"}</ReactMarkdown>
              </div>
          )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <AddGrowthRecordModal 
            latestRecord={latestRecord}
            onClose={() => navigate(`/growth/${activeMetric}`)} 
            onSubmit={(record) => {
                onAddRecord(record);
                navigate(`/growth/${activeMetric}`);
            }} 
        />
      )}
    </div>
  );
};

// --- Add Record Modal Component ---

interface AddModalProps {
    onClose: () => void;
    onSubmit: (record: GrowthRecord) => void;
    latestRecord: GrowthRecord | null;
}

const AddGrowthRecordModal: React.FC<AddModalProps> = ({ onClose, onSubmit, latestRecord }) => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [showCalendar, setShowCalendar] = useState(false);
    const [height, setHeight] = useState(latestRecord?.height?.toString() || '');
    const [weight, setWeight] = useState(latestRecord?.weight?.toString() || '');
    const [head, setHead] = useState(latestRecord?.headCircumference?.toString() || '');

    const adjustValue = (
        setter: React.Dispatch<React.SetStateAction<string>>, 
        currentVal: string, 
        delta: number
    ) => {
        const current = parseFloat(currentVal || '0');
        const next = Math.max(0, parseFloat((current + delta).toFixed(1)));
        setter(next.toString());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            date,
            height: height ? parseFloat(height) : undefined,
            weight: weight ? parseFloat(weight) : undefined,
            headCircumference: head ? parseFloat(head) : undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl animate-scale-up">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-xl text-slate-900">성장 기록 추가</h3>
                        <p className="text-xs text-slate-500">오늘의 키, 몸무게를 기록해요</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Styled Date Picker Trigger */}
                    <div 
                        className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => setShowCalendar(true)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">기록 날짜</div>
                                <div className="font-bold text-slate-800 text-lg">{date}</div>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors">변경</div>
                    </div>

                    <div className="space-y-4">
                        {/* Height Input */}
                        <div className="space-y-2">
                             <div className="flex justify-between items-end px-1">
                                <label className="text-xs font-bold text-slate-500">키 (cm)</label>
                             </div>
                             <div className="flex gap-2">
                                <input 
                                    type="number" step="0.1" 
                                    value={height} onChange={(e) => setHeight(e.target.value)}
                                    className="flex-1 w-0 px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all text-lg"
                                    placeholder="0.0"
                                />
                                <div className="flex gap-1 shrink-0">
                                    <button type="button" onClick={() => adjustValue(setHeight, height, 0.5)} className="px-3 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 whitespace-nowrap">+0.5</button>
                                    <button type="button" onClick={() => adjustValue(setHeight, height, 1.0)} className="px-3 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 whitespace-nowrap">+1.0</button>
                                </div>
                             </div>
                        </div>

                        {/* Weight Input */}
                        <div className="space-y-2">
                             <div className="flex justify-between items-end px-1">
                                <label className="text-xs font-bold text-slate-500">몸무게 (kg)</label>
                             </div>
                             <div className="flex gap-2">
                                <input 
                                    type="number" step="0.1" 
                                    value={weight} onChange={(e) => setWeight(e.target.value)}
                                    className="flex-1 w-0 px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all text-lg"
                                    placeholder="0.0"
                                />
                                <div className="flex gap-1 shrink-0">
                                    <button type="button" onClick={() => adjustValue(setWeight, weight, 0.1)} className="px-3 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 whitespace-nowrap">+0.1</button>
                                    <button type="button" onClick={() => adjustValue(setWeight, weight, 0.5)} className="px-3 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 whitespace-nowrap">+0.5</button>
                                </div>
                             </div>
                        </div>

                         {/* Head Input */}
                        <div className="space-y-2">
                             <div className="flex justify-between items-end px-1">
                                <label className="text-xs font-bold text-slate-500">머리둘레 (cm)</label>
                             </div>
                             <div className="flex gap-2">
                                <input 
                                    type="number" step="0.1" 
                                    value={head} onChange={(e) => setHead(e.target.value)}
                                    className="flex-1 w-0 px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all text-lg"
                                    placeholder="0.0"
                                />
                                <div className="flex gap-1 shrink-0">
                                    <button type="button" onClick={() => adjustValue(setHead, head, 0.1)} className="px-3 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 whitespace-nowrap">+0.1</button>
                                    <button type="button" onClick={() => adjustValue(setHead, head, 0.5)} className="px-3 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 whitespace-nowrap">+0.5</button>
                                </div>
                             </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 mt-4 hover:bg-slate-800 transition-transform active:scale-[0.98]"
                    >
                        기록 저장하기
                    </button>
                </form>

                {/* Custom Calendar Popup */}
                {showCalendar && (
                    <DatePickerPopup 
                        initialDate={date}
                        onClose={() => setShowCalendar(false)}
                        onSelect={(newDate) => {
                            setDate(newDate);
                            setShowCalendar(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
};
