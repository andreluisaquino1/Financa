
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
  paidBy: 'person1' | 'person2' | 'fund';
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

  // Bank Balance & Reserves
  bankBalanceP1?: number;
  bankBalanceP2?: number;
  emergencyReserveP1?: number;
  emergencyReserveP2?: number;
  monthlySavingsP1?: number;
  monthlySavingsP2?: number;
}

export interface UserAccount {
  email: string;
  coupleInfo: CoupleInfo;
  household_id?: string;
  invite_code?: string;
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
  deletedAt?: string;
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
  deletedAt?: string;
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

  // Goal ownership
  goal_type: 'individual_p1' | 'individual_p2' | 'couple'; // Who owns this goal

  // Individual contributions
  monthly_contribution_p1?: number; // Person 1's monthly contribution
  monthly_contribution_p2?: number; // Person 2's monthly contribution

  // Current savings already allocated
  current_savings_p1?: number; // How much P1 already has saved for this
  current_savings_p2?: number; // How much P2 already has saved for this

  // Expected returns and expenses
  interest_rate?: number; // Expected annual return %
  expected_monthly_expense?: number; // If this goal has ongoing costs

  // Timeline
  start_date?: string; // When to start contributing
  deadline?: string;

  // Display
  icon?: string;
  priority?: 'low' | 'medium' | 'high';
  investment_location_p1?: string;
  investment_location_p2?: string;
  last_contribution_month?: string; // Format: YYYY-MM
  is_completed: boolean;

  // New split & allocation fields
  split_p1_percentage?: number; // e.g. 50
  split_p2_percentage?: number; // e.g. 50
  initial_withdrawal_p1?: number; // How much was taken from bank balance at start
  initial_withdrawal_p2?: number; // How much was taken from bank balance at start

  created_at: string;
  deletedAt?: string;
}
export interface Loan {
  id: string;
  user_id: string;
  household_id: string;
  borrower_name: string;
  description: string;
  total_value: number;
  remaining_value: number;
  installments?: number;
  paid_installments?: number;
  due_date?: string;
  lender: 'person1' | 'person2';
  status: 'pending' | 'partial' | 'paid';
  created_at: string;
  deleted_at?: string;
}

export interface Investment {
  id: string;
  user_id: string;
  household_id: string;
  name: string;
  type: 'fixed_income' | 'variable_income' | 'crypto' | 'funds' | 'real_estate' | 'custom';
  current_value: number;
  invested_value: number;
  owner: 'person1' | 'person2' | 'couple';
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}
