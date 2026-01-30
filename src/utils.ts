import { Expense, ExpenseType, CoupleInfo, MonthlySummary, Income } from '@/types';
import { formatCurrency, getMonthYearKey, formatAsBRL, parseBRL, parseSafeDate } from '@/domain/formatters';
import { isExpenseInMonth, getMonthlyExpenseValue, getInstallmentInfo, calculateSummary } from '@/domain/financial';

// Re-exporting for backward compatibility
export {
  formatCurrency,
  getMonthYearKey,
  formatAsBRL,
  parseBRL,
  parseSafeDate,
  isExpenseInMonth,
  getMonthlyExpenseValue,
  getInstallmentInfo,
  calculateSummary
};
