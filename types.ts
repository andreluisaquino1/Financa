
export interface Category {
  name: string;
  icon?: string;
}

export enum ExpenseType {
  FIXED = 'FIXED',
  COMMON = 'COMMON',
  EQUAL = 'EQUAL',
  REIMBURSEMENT = 'REIMBURSEMENT',
  REIMBURSEMENT_FIXED = 'REIMBURSEMENT_FIXED',
  PERSONAL_P1 = 'PERSONAL_P1',
  PERSONAL_P2 = 'PERSONAL_P2'
}

export interface RecurringIncome {
  id: string; // unique identifier for the recurring template
  description: string;
  value: number;
}

export interface TripDeposit {
  id: string;
  person: 'person1' | 'person2';
  value: number;
  date: string;
  description: string;
}

export interface TripExpense {
  id: string;
  description: string;
  value: number;
  paidBy: 'person1' | 'person2';
  date: string;
  category: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  proportionType: 'proportional' | 'custom' | 'equal';
  customPercentage1?: number;
  deposits: TripDeposit[];
  expenses: TripExpense[];
}

export interface CoupleInfo {
  person1Name: string;
  person2Name: string;
  salary1: number;
  salary2: number;
  categories?: (string | Category)[];
  theme?: 'light' | 'dark';
  person1Color?: string; // hex code
  person2Color?: string; // hex code
  salary1Description?: string;
  salary2Description?: string;
  person1RecurringIncomes?: RecurringIncome[];
  person2RecurringIncomes?: RecurringIncome[];
  trips?: Trip[];
}

export interface UserAccount {
  email: string;
  coupleInfo: CoupleInfo;
  household_id?: string;
  invite_code?: string;
  is_premium?: boolean;
  premium_until?: string;
}

export interface Expense {
  id: string;
  date: string;
  type: ExpenseType;
  category: string;
  description: string;
  totalValue: number;
  installments: number;
  paidBy: 'person1' | 'person2';
  createdAt: string;
  household_id?: string;
  splitMethod?: 'proportional' | 'custom';
  splitPercentage1?: number; // Only used if splitMethod is 'custom'
  specificValueP1?: number; // Part of the expense that is 100% P1's responsibility
  specificValueP2?: number; // Part of the expense that is 100% P2's responsibility
  metadata?: {
    overrides?: Record<string, number>;
  };
  reminderDay?: number; // 1-31
}

export interface Income {
  id: string;
  description: string;
  value: number;
  category: string; // e.g., 'Salário', 'Investimento', 'Bônus', etc.
  paidBy: 'person1' | 'person2';
  date: string;
  household_id?: string;
  user_id?: string;
  createdAt: string;
}

export interface MonthlySummary {
  totalFixed: number;
  totalCommon: number;
  totalEqual: number;
  totalReimbursement: number;
  person1Paid: number;
  person2Paid: number;
  person1Responsibility: number;
  person2Responsibility: number;
  person1PersonalTotal: number;
  person2PersonalTotal: number;
  person1TotalIncome: number;
  person2TotalIncome: number;
  transferAmount: number;
  whoTransfers: 'person1' | 'person2' | 'none';
  categoryTotals: Record<string, number>;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_value: number;
  current_value: number;
  monthly_contribution?: number;
  interest_rate?: number;
  deadline?: string;
  icon?: string;
  is_completed: boolean;
  created_at: string;
}
