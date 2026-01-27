
import { Expense, ExpenseType, CoupleInfo, MonthlySummary, Income } from './types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const getMonthYearKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const formatAsBRL = (val: string): string => {
  const clean = val.replace(/\D/g, '');
  const numberValue = parseInt(clean || '0') / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

export const parseBRL = (val: string | number): number => {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  // Remove tudo que não é número ou vírgula
  const clean = val.toString().replace(/[^\d]/g, '');
  const cents = parseInt(clean || '0');
  return Math.abs(cents / 100) || 0;
};

export const parseSafeDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day || 1);
};

const roundMoney = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateSummary = (
  expenses: Expense[],
  incomes: Income[],
  coupleInfo: CoupleInfo,
  monthKey: string,
  isPremium: boolean = false
): MonthlySummary => {
  // Somar as rendas do mês por categoria e pessoa
  const monthIncomes = incomes.filter(inc => inc.date.startsWith(monthKey));

  const p1Salary = monthIncomes
    .filter(i => i.paidBy === 'person1' && i.category === 'Salário')
    .reduce((sum, i) => roundMoney(sum + i.value), 0);

  const p2Salary = monthIncomes
    .filter(i => i.paidBy === 'person2' && i.category === 'Salário')
    .reduce((sum, i) => roundMoney(sum + i.value), 0);

  const totalIncome1 = monthIncomes
    .filter(i => i.paidBy === 'person1')
    .reduce((sum, i) => roundMoney(sum + i.value), 0);

  const totalIncome2 = monthIncomes
    .filter(i => i.paidBy === 'person2')
    .reduce((sum, i) => roundMoney(sum + i.value), 0);

  const combinedTotalIncome = roundMoney(totalIncome1 + totalIncome2);
  const combinedSalaries = roundMoney(p1Salary + p2Salary);

  // Determinar a proporção baseada na configuração
  let ratio1 = 0.5;
  let ratio2 = 0.5;

  const { customSplitMode, manualPercentage1 } = coupleInfo;

  if (customSplitMode === 'fixed' && manualPercentage1 !== undefined) {
    ratio1 = manualPercentage1 / 100;
    ratio2 = 1 - ratio1;
  } else {
    // SE FOR GRÁTIS: A proporção é baseada APENAS nas entradas de categoria 'Salário'
    // SE FOR PRO: A proporção considera o TOTAL de todas as rendas (Investimentos, Bônus, etc)
    if (isPremium) {
      ratio1 = combinedTotalIncome > 0 ? totalIncome1 / combinedTotalIncome : 0.5;
      ratio2 = combinedTotalIncome > 0 ? totalIncome2 / combinedTotalIncome : 0.5;
    } else {
      ratio1 = combinedSalaries > 0 ? p1Salary / combinedSalaries : 0.5;
      ratio2 = combinedSalaries > 0 ? p2Salary / combinedSalaries : 0.5;
    }
  }

  let totalFixed = 0;
  let totalCommon = 0;
  let totalEqual = 0;
  let totalReimbursement = 0;
  let person1PersonalTotal = 0;
  let person2PersonalTotal = 0;

  let p1Target = 0;
  let p1Spent = 0;
  let p2Target = 0;
  let p2Spent = 0;

  const [targetYear, targetMonth] = monthKey.split('-').map(Number);
  const categoryTotals: Record<string, number> = {};

  expenses.forEach((exp) => {
    const expDate = parseSafeDate(exp.date);
    const diffMonths = (targetYear - expDate.getFullYear()) * 12 + (targetMonth - (expDate.getMonth() + 1));

    const isValidMonth = diffMonths >= 0 && (exp.type === ExpenseType.FIXED || diffMonths < exp.installments);
    if (!isValidMonth) return;

    let monthlyValue = roundMoney(exp.totalValue / exp.installments);
    if (exp.metadata?.overrides?.[monthKey]) {
      monthlyValue = exp.metadata.overrides[monthKey];
    }

    const cat = exp.category || 'Outros';
    categoryTotals[cat] = roundMoney((categoryTotals[cat] || 0) + monthlyValue);

    switch (exp.type) {
      case ExpenseType.FIXED:
      case ExpenseType.COMMON:
        if (exp.type === ExpenseType.FIXED) totalFixed = roundMoney(totalFixed + monthlyValue);
        else totalCommon = roundMoney(totalCommon + monthlyValue);

        const isActuallyEqual = exp.splitMethod === 'equal';
        if (isActuallyEqual) {
          p1Target = roundMoney(p1Target + (monthlyValue * 0.5));
          p2Target = roundMoney(p2Target + (monthlyValue * 0.5));
        } else {
          p1Target = roundMoney(p1Target + (monthlyValue * ratio1));
          p2Target = roundMoney(p2Target + (monthlyValue * ratio2));
        }
        break;

      case ExpenseType.EQUAL:
        totalEqual = roundMoney(totalEqual + monthlyValue);
        p1Target = roundMoney(p1Target + (monthlyValue * 0.5));
        p2Target = roundMoney(p2Target + (monthlyValue * 0.5));
        break;

      case ExpenseType.REIMBURSEMENT:
        totalReimbursement = roundMoney(totalReimbursement + monthlyValue);
        if (exp.paidBy === 'person1') {
          p2Target = roundMoney(p2Target + monthlyValue);
        } else {
          p1Target = roundMoney(p1Target + monthlyValue);
        }
        break;

      case ExpenseType.PERSONAL_P1:
        person1PersonalTotal = roundMoney(person1PersonalTotal + monthlyValue);
        break;

      case ExpenseType.PERSONAL_P2:
        person2PersonalTotal = roundMoney(person2PersonalTotal + monthlyValue);
        break;
    }

    if (exp.type !== ExpenseType.PERSONAL_P1 && exp.type !== ExpenseType.PERSONAL_P2) {
      if (exp.paidBy === 'person1') p1Spent = roundMoney(p1Spent + monthlyValue);
      else p2Spent = roundMoney(p2Spent + monthlyValue);
    }
  });

  const balance1 = roundMoney(p1Target - p1Spent);
  const balance2 = roundMoney(p2Target - p2Spent);

  let transferAmount = 0;
  let whoTransfers: 'person1' | 'person2' | 'none' = 'none';

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
    person1TotalIncome: totalIncome1,
    person2TotalIncome: totalIncome2,
    transferAmount,
    whoTransfers,
    categoryTotals
  };
};
