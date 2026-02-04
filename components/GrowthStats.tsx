
import React, { useState, useEffect } from 'react';
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
import { Ruler, Weight, CircleDashed, Plus, Calendar, TrendingUp, AlertCircle, CheckCircle2, X, Sparkles, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  profile: ChildProfile;
  onAddRecord: (record: GrowthRecord) => void;
}

type MetricType = 'height' | 'weight' | 'head';

export const GrowthStats: React.FC<Props> = ({ profile, onAddRecord }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('height');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State to hold the structured insight
  const [aiInsight, setAiInsight] = useState<{ title: string; content: string; status: 'positive' | 'caution' | 'warning' } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);
  
  // Get latest stats
  const latestRecord = profile.growthHistory.length > 0 
    ? profile.growthHistory[profile.growthHistory.length - 1] 
    : null;

  const currentAgeMonths = calculateMonthsBetween(profile.birthDate, new Date().toISOString());

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
  
  const minDomain = 0; 
  const maxDomain = Math.ceil(Math.max(currentAgeMonths + 1, 6)); 

  const standardDataRaw = GROWTH_STANDARDS[profile.gender];
  
  const standardData = standardDataRaw
    .filter(d => d.month >= minDomain && d.month <= maxDomain)
    .map(d => ({
        month: d.month,
        standard: activeMetric === 'height' ? d.h : activeMetric === 'weight' ? d.w : d.hc,
    }));

  const userData = profile.growthHistory
    .map(record => ({
        month: calculateMonthsBetween(profile.birthDate, record.date),
        value: activeMetric === 'height' ? record.height : activeMetric === 'weight' ? record.weight : record.headCircumference,
        date: record.date,
    }))
    .filter(d => d.value !== undefined)
    .sort((a, b) => a.month - b.month);
  
  const allValues = [
      ...standardData.map(d => d.standard),
      ...userData.filter(d => d.month >= minDomain && d.month <= maxDomain).map(d => d.value as number)
  ];
  
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 10;
  const padding = range * 0.2; 
  
  const yDomain = [
      Math.max(0, Math.floor(minVal - padding)), 
      Math.ceil(maxVal + padding)
  ];

  const metricLabel = activeMetric === 'height' ? '키' : activeMetric === 'weight' ? '몸무게' : '머리둘레';
  const unit = activeMetric === 'height' ? 'cm' : activeMetric === 'weight' ? 'kg' : 'cm';

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
    <div className="flex flex-col h-full overflow-hidden pb-16">
      
      {/* 1. Header with Add Button */}
      <div className="flex justify-between items-center px-1 mb-4 pt-2 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">성장 관리 📏</h2>
            <p className="text-slate-500 text-xs">AI 성장 분석 & 리포트</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3 h-3" />
            기록하기
          </button>
      </div>

      {/* 2. Compact Segmented Control for Metrics */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-4 mx-1 shrink-0">
        {[
            { id: 'height', label: '키', unit: 'cm', icon: Ruler },
            { id: 'weight', label: '체중', unit: 'kg', icon: Weight },
            { id: 'head', label: '머리', unit: 'cm', icon: CircleDashed }
        ].map((m) => (
            <button
                key={m.id}
                onClick={() => setActiveMetric(m.id as MetricType)}
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

      {/* 3. Compact Chart Section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mx-1 flex-1 min-h-[200px] flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {metricLabel} 추이
            </h3>
            <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                전체 기간
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="month" 
                    type="number"
                    domain={[minDomain, maxDomain]}
                    allowDataOverflow={true}
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    tickFormatter={(val) => `${val}M`}
                    tickCount={6}
                />
                <YAxis 
                    domain={yDomain} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    width={35} 
                    allowDataOverflow={false}
                />
                <Tooltip 
                    labelFormatter={(v) => `${v}개월`}
                    formatter={(value: number, name: string) => [
                        `${value}${unit}`, 
                        name === 'standard' ? '평균' : name === 'value' ? '내 아이' : name
                    ]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '4px 8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '5px', fontSize: '10px' }} iconSize={8} iconType="circle" />
                <Line 
                    data={standardData}
                    dataKey="standard" 
                    name="평균" 
                    stroke="#cbd5e1" 
                    strokeWidth={2} 
                    dot={false}
                    type="monotone"
                    strokeDasharray="4 4"
                    isAnimationActive={false}
                />
                <Line 
                    data={userData}
                    dataKey="value" 
                    name="내 아이" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ r: 3, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' }}
                    activeDot={{ r: 5 }}
                    type="monotone"
                    connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* 4. AI Insight Card */}
      <div className={`mt-3 mx-1 shrink-0 bg-gradient-to-br ${currentStyles.box} p-4 rounded-2xl border transition-colors relative overflow-hidden min-h-[120px]`}>
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
            onClose={() => setShowAddModal(false)} 
            onSubmit={(record) => {
                onAddRecord(record);
                setShowAddModal(false);
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

// --- Custom Date Picker Component (Duplicated for simplicity in this context) ---
interface DatePickerProps {
    initialDate: string; // YYYY-MM-DD
    onClose: () => void;
    onSelect: (date: string) => void;
}

const DatePickerPopup: React.FC<DatePickerProps> = ({ initialDate, onClose, onSelect }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight for comparison

    const d = initialDate ? new Date(initialDate) : new Date();
    const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
    
    // Validate date
    const startYear = isNaN(d.getFullYear()) ? today.getFullYear() : d.getFullYear();
    const startMonth = isNaN(d.getMonth()) ? today.getMonth() : d.getMonth();

    const [currentYear, setCurrentYear] = useState(startYear);
    const [currentMonth, setCurrentMonth] = useState(startMonth);
    const [selectedDate, setSelectedDate] = useState<string>(initialDate);

    // Generate years for dropdown
    const years = Array.from({ length: 8 }, (_, i) => today.getFullYear() - 7 + i).reverse();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const handleDateClick = (day: number) => {
        const mon = String(currentMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const dateStr = `${currentYear}-${mon}-${dd}`;
        setSelectedDate(dateStr);
    };

    const handleConfirm = () => {
        if (selectedDate) {
            onSelect(selectedDate);
        } else {
             if(!selectedDate && initialDate) onSelect(initialDate);
        }
    };

    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth); 
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4 rounded-[32px]">
            <div className="bg-white rounded-2xl w-full max-w-[300px] p-4 shadow-2xl animate-scale-up">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900">날짜 선택</h3>
                    <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Controls */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex gap-1 text-sm">
                            <select 
                                value={currentYear} 
                                onChange={(e) => setCurrentYear(Number(e.target.value))}
                                className="font-bold text-slate-800 bg-transparent cursor-pointer outline-none hover:text-indigo-600 text-center appearance-none"
                            >
                                {years.map(y => <option key={y} value={y}>{y}년</option>)}
                            </select>
                            <select 
                                value={currentMonth} 
                                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                                className="font-bold text-slate-800 bg-transparent cursor-pointer outline-none hover:text-indigo-600 text-center appearance-none"
                            >
                                {months.map(m => <option key={m} value={m - 1}>{m}월</option>)}
                            </select>
                        </div>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-1 text-center">
                        {WEEKDAYS.map((day, idx) => (
                            <div key={day} className={`text-[10px] font-medium ${idx === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-y-1 mb-2">
                        {blanks.map(b => (
                            <div key={`blank-${b}`} className="h-8"></div>
                        ))}
                        {days.map(day => {
                            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isSelected = selectedDate === dateStr;
                            
                            const checkDate = new Date(currentYear, currentMonth, day);
                            const isFuture = checkDate > today;
                            const isToday = checkDate.getTime() === today.getTime();

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    disabled={isFuture}
                                    onClick={() => !isFuture && handleDateClick(day)}
                                    className={`
                                        h-8 w-8 mx-auto rounded-full flex items-center justify-center text-xs transition-all
                                        ${isFuture
                                            ? 'text-slate-200 cursor-not-allowed'
                                            : isSelected 
                                                ? 'bg-indigo-600 text-white font-bold shadow-md transform scale-105' 
                                                : isToday 
                                                    ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' 
                                                    : 'text-slate-700 hover:bg-slate-100'
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Actions */}
                <button 
                    onClick={handleConfirm}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200 text-sm"
                >
                    확인
                </button>
            </div>
        </div>
    );
};
