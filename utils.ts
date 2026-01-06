export const formatCurrency = (value: number, hidden: boolean = false): string => {
  if (hidden) return '••••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const calculateGoalMonthlyNeed = (target: number, current: number, deadline?: string): number => {
  if (!deadline) return 0;
  // Parse deadline strictly as local date end of day or just compare months
  const now = new Date();
  const end = parseLocalDate(deadline);
  
  const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  if (months <= 0) return 0;
  
  const remaining = target - current;
  return remaining > 0 ? remaining / months : 0;
};

export const isSameMonth = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
};

export const formatMonthYear = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
};

export const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

// Helper to parse YYYY-MM-DD string as LOCAL Time (00:00:00) 
// avoiding UTC conversion issues (e.g. previous day shift)
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};