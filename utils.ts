
import { Expense, ExpenseType, CoupleInfo, MonthlySummary } from './types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const getMonthYearKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const parseBRL = (val: string | number): number => {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  const clean = val.toString().replace(/[^\d,]/g, '').replace(',', '.');
  return Math.abs(parseFloat(clean)) || 0;
};

export const parseSafeDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day || 1);
};

export const calculateSummary = (
  expenses: Expense[],
  coupleInfo: CoupleInfo,
  monthKey: string
): MonthlySummary => {
  const { salary1, salary2 } = coupleInfo;
  const totalSalary = salary1 + salary2;

  const ratio1 = totalSalary > 0 ? salary1 / totalSalary : 0.5;
  const ratio2 = totalSalary > 0 ? salary2 / totalSalary : 0.5;

  let totalFixed = 0;
  let totalCommon = 0;
  let totalEqual = 0;
  let totalReimbursement = 0;
  let person1PersonalTotal = 0;
  let person2PersonalTotal = 0;

  // pTarget: O quanto a pessoa DEVERIA ter pago no total
  // pSpent: O quanto a pessoa EFETIVAMENTE pagou do bolso
  let p1Target = 0;
  let p1Spent = 0;
  let p2Target = 0;
  let p2Spent = 0;

  const [targetYear, targetMonth] = monthKey.split('-').map(Number);

  expenses.forEach((exp) => {
    const expDate = parseSafeDate(exp.date);
    const diffMonths = (targetYear - expDate.getFullYear()) * 12 + (targetMonth - (expDate.getMonth() + 1));

    // Validar se o gasto pertence ao mês selecionado (Fixos são recorrentes, outros respeitam parcelas)
    const isValidMonth = diffMonths >= 0 && (exp.type === ExpenseType.FIXED || diffMonths < exp.installments);
    if (!isValidMonth) return;

    const monthlyValue = exp.totalValue / exp.installments;

    switch (exp.type) {
      case ExpenseType.FIXED:
      case ExpenseType.COMMON:
        if (exp.type === ExpenseType.FIXED) totalFixed += monthlyValue;
        else totalCommon += monthlyValue;
        // Divisão Proporcional
        p1Target += monthlyValue * ratio1;
        p2Target += monthlyValue * ratio2;
        break;

      case ExpenseType.EQUAL:
        totalEqual += monthlyValue;
        // Divisão 50/50
        p1Target += monthlyValue * 0.5;
        p2Target += monthlyValue * 0.5;
        break;

      case ExpenseType.REIMBURSEMENT:
        totalReimbursement += monthlyValue;
        // Reembolso: 100% de quem NÃO pagou
        if (exp.paidBy === 'person1') {
          p2Target += monthlyValue;
        } else {
          p1Target += monthlyValue;
        }
        break;

      case ExpenseType.PERSONAL_P1:
        person1PersonalTotal += monthlyValue;
        break;

      case ExpenseType.PERSONAL_P2:
        person2PersonalTotal += monthlyValue;
        break;
    }

    // Registrar quem desembolsou o dinheiro (exceto gastos pessoais que não afetam o casal)
    if (exp.type !== ExpenseType.PERSONAL_P1 && exp.type !== ExpenseType.PERSONAL_P2) {
      if (exp.paidBy === 'person1') p1Spent += monthlyValue;
      else p2Spent += monthlyValue;
    }
  });

  // Saldo: Se Target > Spent, a pessoa deve a diferença.
  const balance1 = p1Target - p1Spent;
  const balance2 = p2Target - p2Spent;

  let transferAmount = 0;
  let whoTransfers: 'person1' | 'person2' | 'none' = 'none';

  // Tolerância de 1 centavo para arredondamentos
  if (balance1 > 0.01) {
    transferAmount = balance1;
    whoTransfers = 'person1';
  } else if (balance2 > 0.01) {
    transferAmount = balance2;
    whoTransfers = 'person2';
  }

  return {
    totalFixed,
    totalCommon,
    totalEqual,
    totalReimbursement,
    person1Paid: p1Spent,
    person2Paid: p2Spent,
    person1Responsibility: p1Target,
    person2Responsibility: p2Target,
    person1PersonalTotal,
    person2PersonalTotal,
    transferAmount,
    whoTransfers
  };
};
