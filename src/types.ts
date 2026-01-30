
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
  trip_id: string;
  person: 'person1' | 'person2';
  value: number;
  date: string;
  description: string;
  created_at: string;
  deleted_at?: string;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  description: string;
  value: number;
  paidBy: 'person1' | 'person2' | 'fund';
  date: string;
  category: string;
  created_at: string;
  deleted_at?: string;
}

export interface Trip {
  id: string;
  household_id: string;
  name: string;
  budget?: number;
  proportionType: 'proportional' | 'custom';
  customPercentage1?: number;
  deposits: TripDeposit[];
  expenses: TripExpense[];
  created_at: string;
  deleted_at?: string;
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
  /** @deprecated Use SavingsGoals (Transactions) instead of manual balance */
  bankBalanceP1?: number;
  /** @deprecated Use SavingsGoals (Transactions) instead of manual balance */
  bankBalanceP2?: number;
  /** @deprecated Now mirrored from SavingsGoal where is_emergency = true */
  emergencyReserveP1?: number;
  /** @deprecated Now mirrored from SavingsGoal where is_emergency = true */
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
  user_id?: string;
  splitMethod?: 'proportional' | 'custom';
  splitPercentage1?: number; // Only used if splitMethod is 'custom'
  specificValueP1?: number; // Part of the expense that is 100% P1's responsibility
  specificValueP2?: number; // Part of the expense that is 100% P2's responsibility

  // Reimbursement specific
  reimbursementStatus?: 'open' | 'settled';
  settledAt?: string;

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
  totalGoalSavings: number;
  person1GoalContribution: number;
  person2GoalContribution: number;
  person1GoalsRealized: number; // Sum of actual transactions in month
  person2GoalsRealized: number; // Sum of actual transactions in month
  p1IncomeBreakdown: {
    salaryReal: number;
    salaryRecurring: number;
    other: number;
  };
  p2IncomeBreakdown: {
    salaryReal: number;
    salaryRecurring: number;
    other: number;
  };
  unspecifiedPaidByCount: number;
  person1Remaining: number;
  person2Remaining: number;
}

export interface GoalTransaction {
  id: string;
  goal_id: string;
  type: 'deposit' | 'withdraw';
  value: number;
  person: 'person1' | 'person2';
  date: string;
  description: string;
  created_at: string;
  deleted_at?: string;
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
  is_emergency: boolean;

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
  institution?: string;
  indexer?: string;
  risk?: 'low' | 'medium' | 'high';
  liquidity?: string;
  notes?: string;
  owner: 'person1' | 'person2' | 'couple';

  // Legacy fields (to be derived later)
  /** @deprecated Use InvestmentMovement instead */
  current_value: number;
  /** @deprecated Use InvestmentMovement instead */
  invested_value: number;
  /** @deprecated Use InvestmentMovement instead */
  quantity?: number;
  /** @deprecated Use InvestmentMovement instead */
  price_per_unit?: number;

  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export type InvestmentMovementType = 'buy' | 'sell' | 'yield' | 'adjustment';

export interface InvestmentMovement {
  id: string;
  investment_id: string;
  type: InvestmentMovementType;
  value: number;
  quantity?: number;
  price_per_unit?: number;
  date: string;
  person: 'person1' | 'person2';
  description?: string;
  created_at: string;
  deleted_at?: string;
}


export interface MonthlyConfig {
  id: string;
  household_id: string;
  month_key: string;
  salary1: number;
  salary2: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// Database Interfaces
export interface ExpenseDB {
  id: string;
  user_id: string;
  household_id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  total_value: number;
  installments: number;
  paid_by: string;
  split_method: string | null;
  reminder_day: number | null;
  metadata: any;
  created_at: string;
  deleted_at: string | null;
}

export interface IncomeDB {
  id: string;
  user_id: string;
  household_id: string;
  date: string;
  category: string;
  description: string;
  value: number;
  paid_by: string;
  created_at: string;
  deleted_at: string | null;
}

export interface SavingsGoalDB {
  id: string;
  user_id: string;
  household_id: string;
  title: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  monthly_contribution_p1: number;
  monthly_contribution_p2: number;
  current_savings_p1: number;
  current_savings_p2: number;
  interest_rate: number;
  expected_monthly_expense: number;
  start_date: string | null;
  deadline: string | null;
  icon: string;
  priority: string;
  investment_location_p1: string;
  investment_location_p2: string;
  last_contribution_month: string | null;
  is_completed: boolean;
  is_emergency: boolean;
  split_p1_percentage: number;
  split_p2_percentage: number;
  initial_withdrawal_p1: number;
  initial_withdrawal_p2: number;
  created_at: string;
  deleted_at: string | null;
}

export interface LoanDB extends Loan { } // Structure matches except strict typing, but Loan in types.ts is already snake_case mostly using strict types now
export interface InvestmentDB extends Investment { } // Structure matches
export interface InvestmentMovementDB extends InvestmentMovement { }
export interface TripDB extends Trip { } // Structure matches
export interface UserProfileDB {
  id: string;
  household_id: string | null;
  invite_code: string | null;
  couple_info: any; // Ideally this matches CoupleInfo
  updated_at: string;
}

export interface GoalTransactionDB {
  id: string;
  goal_id: string;
  type: string;
  value: number;
  person: string;
  date: string;
  description: string;
  created_at: string;
  deleted_at: string | null;
}
