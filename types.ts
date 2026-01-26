
export enum ExpenseType {
  FIXED = 'FIXED',
  COMMON = 'COMMON',
  EQUAL = 'EQUAL',
  REIMBURSEMENT = 'REIMBURSEMENT',
  PERSONAL_P1 = 'PERSONAL_P1',
  PERSONAL_P2 = 'PERSONAL_P2'
}

export interface CoupleInfo {
  person1Name: string;
  person2Name: string;
  salary1: number;
  salary2: number;
  categories?: string[];
  customSplitMode?: 'proportional' | 'fixed';
  manualPercentage1?: number; // percentage for person1 (0-100)
}

export interface UserAccount {
  email: string;
  coupleInfo: CoupleInfo;
  household_id?: string;
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
  splitMethod?: 'proportional' | 'equal';
  metadata?: {
    overrides?: Record<string, number>;
  };
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
