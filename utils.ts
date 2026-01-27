
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
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  const numberValue = parseInt(clean) / 100;
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

  // Lógica de Múltiplas Rendas Recorrentes
  // 1. Identificar rendas reais deste mês
  const p1RealSalaries = monthIncomes.filter(i => i.paidBy === 'person1' && i.category === 'Salário');
  const p2RealSalaries = monthIncomes.filter(i => i.paidBy === 'person2' && i.category === 'Salário');

  // 2. Identificar rendas recorrentes ativas (aquelas que NÃO têm uma entrada real correspondente pela descrição)
  const p1Recurring = coupleInfo.person1RecurringIncomes || [];
  const p2Recurring = coupleInfo.person2RecurringIncomes || [];

  // Migração legada: Se não houver recurring array, usar os campos antigos se > 0
  if (p1Recurring.length === 0 && coupleInfo.salary1 > 0) {
    p1Recurring.push({ id: 'legacy-p1', description: coupleInfo.salary1Description || 'Salário Base', value: coupleInfo.salary1 });
  }
  if (p2Recurring.length === 0 && coupleInfo.salary2 > 0) {
    p2Recurring.push({ id: 'legacy-p2', description: coupleInfo.salary2Description || 'Salário Base', value: coupleInfo.salary2 });
  }

  const p1ActiveRecurring = p1Recurring.filter(rec =>
    !p1RealSalaries.some(real => real.description === rec.description)
  );

  const p2ActiveRecurring = p2Recurring.filter(rec =>
    !p2RealSalaries.some(real => real.description === rec.description)
  );

  // 3. Somar Tudo
  const p1RealTotal = p1RealSalaries.reduce((sum, i) => roundMoney(sum + i.value), 0);
  const p1VirtualTotal = p1ActiveRecurring.reduce((sum, i) => roundMoney(sum + i.value), 0);
  const p1Salary = roundMoney(p1RealTotal + p1VirtualTotal);

  const p2RealTotal = p2RealSalaries.reduce((sum, i) => roundMoney(sum + i.value), 0);
  const p2VirtualTotal = p2ActiveRecurring.reduce((sum, i) => roundMoney(sum + i.value), 0);
  const p2Salary = roundMoney(p2RealTotal + p2VirtualTotal);

  const totalIncome1 = roundMoney(p1Salary + monthIncomes
    .filter(i => i.paidBy === 'person1' && i.category !== 'Salário')
    .reduce((sum, i) => roundMoney(sum + i.value), 0));

  const totalIncome2 = roundMoney(p2Salary + monthIncomes
    .filter(i => i.paidBy === 'person2' && i.category !== 'Salário')
    .reduce((sum, i) => roundMoney(sum + i.value), 0));

  const combinedTotalIncome = roundMoney(totalIncome1 + totalIncome2);
  const combinedSalaries = roundMoney(p1Salary + p2Salary);

  // Proporção baseada no salário (usada como uma das opções individuais)
  let salaryRatio1 = combinedSalaries > 0 ? p1Salary / combinedSalaries : 0.5;
  let salaryRatio2 = combinedSalaries > 0 ? p2Salary / combinedSalaries : 0.5;

  if (isPremium) {
    salaryRatio1 = combinedTotalIncome > 0 ? totalIncome1 / combinedTotalIncome : 0.5;
    salaryRatio2 = combinedTotalIncome > 0 ? totalIncome2 / combinedTotalIncome : 0.5;
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
      case ExpenseType.EQUAL: // EQUAL is now handled by splitMethod='custom' with 50%
        if (exp.type === ExpenseType.FIXED) totalFixed = roundMoney(totalFixed + monthlyValue);
        else totalCommon = roundMoney(totalCommon + monthlyValue);

        // Lógica de Divisão Individual com Partes Específicas
        const spec1Total = exp.specificValueP1 || 0;
        const spec2Total = exp.specificValueP2 || 0;

        // Calcular proporção do valor específico em relação ao total
        const specRatio1 = exp.totalValue > 0 ? spec1Total / exp.totalValue : 0;
        const specRatio2 = exp.totalValue > 0 ? spec2Total / exp.totalValue : 0;

        const monthlySpec1 = roundMoney(monthlyValue * specRatio1);
        const monthlySpec2 = roundMoney(monthlyValue * specRatio2);
        const sharedValue = roundMoney(monthlyValue - monthlySpec1 - monthlySpec2);

        // Adiciona partes específicas diretamente à responsabilidade
        p1Target = roundMoney(p1Target + monthlySpec1);
        p2Target = roundMoney(p2Target + monthlySpec2);

        // Divide o restante (sharedValue)
        if (exp.splitMethod === 'custom') {
          const perc1 = (exp.splitPercentage1 !== undefined) ? exp.splitPercentage1 : 50;
          const r1 = perc1 / 100;
          const r2 = 1 - r1;
          p1Target = roundMoney(p1Target + (sharedValue * r1));
          p2Target = roundMoney(p2Target + (sharedValue * r2));
          if (perc1 === 50 && spec1Total === 0 && spec2Total === 0) totalEqual = roundMoney(totalEqual + monthlyValue);
        } else {
          // Default: Proporcional ao Salário
          p1Target = roundMoney(p1Target + (sharedValue * salaryRatio1));
          p2Target = roundMoney(p2Target + (sharedValue * salaryRatio2));
        }
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
