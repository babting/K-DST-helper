
import React, { useState, useEffect } from 'react';
import { ChildProfile, Gender } from '../types';
import { Calendar as CalendarIcon, X, Ruler, Weight, CircleDashed, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  onComplete: (profile: ChildProfile) => void;
  initialProfile?: ChildProfile | null;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const ProfileSetup: React.FC<Props> = ({ onComplete, initialProfile }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [showCalendar, setShowCalendar] = useState(false);

  // Physical Stats (Now Required)
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setBirthDate(initialProfile.birthDate);
      setGender(initialProfile.gender);
      
      // Get latest record if available
      if (initialProfile.growthHistory.length > 0) {
        const latest = initialProfile.growthHistory[initialProfile.growthHistory.length - 1];
        setHeight(latest.height?.toString() || '');
        setWeight(latest.weight?.toString() || '');
        setHeadCircumference(latest.headCircumference?.toString() || '');
      }
    }
  }, [initialProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && birthDate && height && weight && headCircumference) {
      
      const newProfile: ChildProfile = {
          name,
          birthDate,
          gender,
          growthHistory: initialProfile?.growthHistory || []
      };

      const today = new Date().toISOString().split('T')[0];
      
      if (!initialProfile) {
          // NEW PROFILE: Create the "Birth" record (Month 0)
          const birthRecord = {
              date: birthDate, 
              height: parseFloat(height),
              weight: parseFloat(weight),
              headCircumference: parseFloat(headCircumference),
          };
          newProfile.growthHistory = [birthRecord];
      } else {
          // EDIT PROFILE: Add/Update "Today's" record
          const newRecord = {
              date: today,
              height: parseFloat(height),
              weight: parseFloat(weight),
              headCircumference: parseFloat(headCircumference),
          };

          // Remove any existing record for today to avoid duplicates
          newProfile.growthHistory = newProfile.growthHistory.filter(r => r.date !== today);
          newProfile.growthHistory.push(newRecord);
          newProfile.growthHistory.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      onComplete(newProfile);
    } else {
        alert("모든 정보를 입력해주세요.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-white animate-fade-in relative">
      {/* Scrollable Form Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
        {/* Title */}
        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 leading-tight whitespace-pre-line">
              {initialProfile ? '아이 정보를\n수정할까요?' : '우리 아이\n등록하기'}
          </h1>
          <p className="text-slate-500">
              {initialProfile ? '변경된 내용이 있다면 입력해주세요' : '성장 분석을 위해 출생 정보를 입력해주세요'}
          </p>
        </div>

        <form className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">이름 <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-0 py-3 border-b-2 border-slate-100 focus:border-indigo-600 focus:ring-0 transition-all outline-none text-2xl font-bold placeholder:text-slate-200 bg-transparent"
              placeholder="이름 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">생년월일 <span className="text-red-500">*</span></label>
            <div 
              onClick={() => setShowCalendar(true)}
              className="w-full py-3 border-b-2 border-slate-100 cursor-pointer flex items-center justify-between group"
            >
              <span className={`text-2xl font-bold ${birthDate ? 'text-slate-900' : 'text-slate-200'}`}>
                  {birthDate || 'YYYY-MM-DD'}
              </span>
              <CalendarIcon className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">성별 <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender('MALE')}
                className={`flex-1 py-4 rounded-2xl border-2 transition-all ${
                  gender === 'MALE'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                    : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                남자 아이
              </button>
              <button
                type="button"
                onClick={() => setGender('FEMALE')}
                className={`flex-1 py-4 rounded-2xl border-2 transition-all ${
                  gender === 'FEMALE'
                    ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold'
                    : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                여자 아이
              </button>
            </div>
          </div>

          <div className="pt-4 pb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {initialProfile ? '현재 신체 정보' : '출생 시 신체 정보'} <span className="text-red-500">*</span>
              </h3>
              <div className="space-y-4">
                  {/* Height */}
                  <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                          <Ruler className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-400 mb-1">키</label>
                          <input
                              type="number"
                              step="0.1"
                              required
                              value={height}
                              onChange={(e) => setHeight(e.target.value)}
                              className="w-full bg-transparent outline-none font-bold text-3xl text-slate-800 placeholder:text-slate-300"
                              placeholder="0.0"
                          />
                      </div>
                      <span className="text-slate-400 font-bold">cm</span>
                  </div>

                  {/* Weight */}
                  <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                          <Weight className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-400 mb-1">몸무게</label>
                          <input
                              type="number"
                              step="0.1"
                              required
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                              className="w-full bg-transparent outline-none font-bold text-3xl text-slate-800 placeholder:text-slate-300"
                              placeholder="0.0"
                          />
                      </div>
                      <span className="text-slate-400 font-bold">kg</span>
                  </div>

                   {/* Head Circumference */}
                   <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                          <CircleDashed className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-400 mb-1">머리둘레</label>
                          <input
                              type="number"
                              step="0.1"
                              required
                              value={headCircumference}
                              onChange={(e) => setHeadCircumference(e.target.value)}
                              className="w-full bg-transparent outline-none font-bold text-3xl text-slate-800 placeholder:text-slate-300"
                              placeholder="0.0"
                          />
                      </div>
                      <span className="text-slate-400 font-bold">cm</span>
                  </div>
              </div>
          </div>
        </form>
      </div>

      {/* Fixed Bottom Button */}
      <div className="p-4 bg-white border-t border-slate-100 z-10 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={!name || !birthDate || !height || !weight || !headCircumference}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-lg"
        >
          {initialProfile ? '정보 수정 완료' : '등록하고 시작하기'}
        </button>
      </div>

      {/* Custom Calendar Modal */}
      {showCalendar && (
        <DatePickerPopup 
            initialDate={birthDate}
            onClose={() => setShowCalendar(false)}
            onSelect={(date) => {
                setBirthDate(date);
                setShowCalendar(false);
            }}
        />
      )}
    </div>
  );
};

// --- Custom Date Picker Component ---
interface DatePickerProps {
    initialDate: string; // YYYY-MM-DD
    onClose: () => void;
    onSelect: (date: string) => void;
}

const DatePickerPopup: React.FC<DatePickerProps> = ({ initialDate, onClose, onSelect }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight for comparison

    const d = initialDate ? new Date(initialDate) : new Date();
    
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-white rounded-2xl w-full max-w-[350px] p-6 shadow-2xl animate-scale-up">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-slate-900">생년월일 선택</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Controls */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex gap-2">
                            <select 
                                value={currentYear} 
                                onChange={(e) => setCurrentYear(Number(e.target.value))}
                                className="font-bold text-slate-800 bg-transparent cursor-pointer outline-none hover:text-indigo-600 text-lg text-center appearance-none"
                            >
                                {years.map(y => <option key={y} value={y}>{y}년</option>)}
                            </select>
                            <select 
                                value={currentMonth} 
                                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                                className="font-bold text-slate-800 bg-transparent cursor-pointer outline-none hover:text-indigo-600 text-lg text-center appearance-none"
                            >
                                {months.map(m => <option key={m} value={m - 1}>{m}월</option>)}
                            </select>
                        </div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {WEEKDAYS.map((day, idx) => (
                            <div key={day} className={`text-xs font-medium ${idx === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-y-2 mb-2">
                        {blanks.map(b => (
                            <div key={`blank-${b}`} className="h-10"></div>
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
                                        h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm transition-all
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-200 text-lg"
                >
                    확인
                </button>
            </div>
        </div>
    );
};
