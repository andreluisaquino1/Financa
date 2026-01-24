
export enum ExpenseType {
  FIXED = 'FIXED',
  COMMON = 'COMMON',
  EQUAL = 'EQUAL',
  REIMBURSEMENT = 'REIMBURSEMENT',
  PERSONAL_P1 = 'PERSONAL_P1' // Gastos exclusivos do André
}

export interface CoupleInfo {
  person1Name: string; // André
  person2Name: string; // Luciana
  salary1: number;
  salary2: number;
  andreCreditCardValue: number;
  andrePersonalExpenses: number; // Mantido para compatibilidade, mas os novos serão via Expense
}

export interface UserAccount {
  email: string;
  coupleInfo: CoupleInfo;
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
  person1PersonalTotal: number; // Soma dos gastos PERSONAL_P1 do André
  transferAmount: number;
  whoTransfers: 'person1' | 'person2' | 'none';
}
