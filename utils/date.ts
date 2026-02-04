
export const calculateAgeInMonths = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const now = new Date();
  
  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += now.getMonth();
  
  // Adjust for days (if current day is before birth day, subtract a month)
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  
  return Math.max(0, months);
};

export const calculateDays = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const calculateMonthsBetween = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days in month
    return parseFloat(diffMonths.toFixed(1));
};
