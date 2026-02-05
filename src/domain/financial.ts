import { Expense, ExpenseType, CoupleInfo, MonthlySummary, Income, SavingsGoal, GoalTransaction } from '@/types';
import { parseSafeDate } from './formatters';
import { calculateGoalStats } from './goals';

const roundMoney = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const isExpenseInMonth = (exp: Expense, monthKey: string): boolean => {
    const [targetYear, targetMonth] = monthKey.split('-').map(Number);
    const expDate = parseSafeDate(exp.date);
    const diffMonths = (targetYear - expDate.getFullYear()) * 12 + (targetMonth - (expDate.getMonth() + 1));

    return diffMonths >= 0 && (exp.type === ExpenseType.FIXED || exp.type === ExpenseType.REIMBURSEMENT_FIXED || diffMonths < (exp.installments || 1));
};

export const getMonthlyExpenseValue = (exp: Expense, monthKey: string): number => {
    const isFixed = exp.type === ExpenseType.FIXED || exp.type === ExpenseType.REIMBURSEMENT_FIXED;
    if (isFixed) {
        if (exp.metadata?.overrides?.[monthKey]) {
            return exp.metadata.overrides[monthKey];
        }
        return exp.totalValue;
    }

    const installments = exp.installments || 1;
    if (installments <= 1) return exp.totalValue;

    const [targetYear, targetMonth] = monthKey.split('-').map(Number);
    const expDate = parseSafeDate(exp.date);
    const diffMonths = (targetYear - expDate.getFullYear()) * 12 + (targetMonth - (expDate.getMonth() + 1));

    const standardInstallment = roundMoney(exp.totalValue / installments);

    // Se for a última parcela, ajustamos para cobrir qualquer diferença de arredondamento
    if (diffMonths === installments - 1) {
        const previousTotal = standardInstallment * (installments - 1);
        return roundMoney(exp.totalValue - previousTotal);
    }

    return standardInstallment;
};

export const getInstallmentInfo = (exp: Expense, monthKey: string): { current: number; total: number } | null => {
    if (exp.type === ExpenseType.FIXED || exp.type === ExpenseType.REIMBURSEMENT_FIXED || !exp.installments || exp.installments <= 1) return null;
    const [targetYear, targetMonth] = monthKey.split('-').map(Number);
    const expDate = parseSafeDate(exp.date);
    const diffMonths = (targetYear - expDate.getFullYear()) * 12 + (targetMonth - (expDate.getMonth() + 1));
    return { current: diffMonths + 1, total: exp.installments };
};

export const calculateSummary = (
    expenses: Expense[],
    incomes: Income[],
    coupleInfo: CoupleInfo,
    monthKey: string,
    goals: SavingsGoal[] = [],
    goalTransactions: GoalTransaction[] = []
): MonthlySummary => {
    // Somar as rendas do mês por categoria e pessoa
    const monthIncomes = incomes.filter(inc => inc.date.startsWith(monthKey));

    // Lógica de Múltiplas Rendas Recorrentes
    const p1RealSalaries = monthIncomes.filter(i => i.paidBy === 'person1' && i.category === 'Salário');
    const p2RealSalaries = monthIncomes.filter(i => i.paidBy === 'person2' && i.category === 'Salário');

    // Fase 1: Evitar mutação de estado/props criando cópias
    const p1Recurring = [...(coupleInfo.person1RecurringIncomes || [])];
    const p2Recurring = [...(coupleInfo.person2RecurringIncomes || [])];

    if (p1Recurring.length === 0 && coupleInfo.salary1 > 0) {
        p1Recurring.push({ id: 'legacy-p1', description: coupleInfo.salary1Description || 'Salário Base', value: coupleInfo.salary1 });
    }
    if (p2Recurring.length === 0 && coupleInfo.salary2 > 0) {
        p2Recurring.push({ id: 'legacy-p2', description: coupleInfo.salary2Description || 'Salário Base', value: coupleInfo.salary2 });
    }

    // Fase 3: Normalizar comparação (trim/lowercase)
    const normalize = (s: string) => s.trim().toLowerCase();

    const p1ActiveRecurring = p1Recurring.filter(rec =>
        !p1RealSalaries.some(real => normalize(real.description) === normalize(rec.description))
    );

    const p2ActiveRecurring = p2Recurring.filter(rec =>
        !p2RealSalaries.some(real => normalize(real.description) === normalize(rec.description))
    );

    const p1RealTotal = p1RealSalaries.reduce((sum, i) => roundMoney(sum + i.value), 0);
    const p1VirtualTotal = p1ActiveRecurring.reduce((sum, i) => roundMoney(sum + i.value), 0);
    const p1Salary = roundMoney(p1RealTotal + p1VirtualTotal);

    const p2RealTotal = p2RealSalaries.reduce((sum, i) => roundMoney(sum + i.value), 0);
    const p2VirtualTotal = p2ActiveRecurring.reduce((sum, i) => roundMoney(sum + i.value), 0);
    const p2Salary = roundMoney(p2RealTotal + p2VirtualTotal);

    const p1OtherIncome = monthIncomes
        .filter(i => i.paidBy === 'person1' && i.category !== 'Salário')
        .reduce((sum, i) => roundMoney(sum + i.value), 0);

    const p2OtherIncome = monthIncomes
        .filter(i => i.paidBy === 'person2' && i.category !== 'Salário')
        .reduce((sum, i) => roundMoney(sum + i.value), 0);

    const totalIncome1 = roundMoney(p1Salary + p1OtherIncome);
    const totalIncome2 = roundMoney(p2Salary + p2OtherIncome);

    const combinedTotalIncome = roundMoney(totalIncome1 + totalIncome2);
    const combinedSalaries = roundMoney(p1Salary + p2Salary);

    let salaryRatio1 = combinedSalaries > 0 ? p1Salary / combinedSalaries : 0.5;
    let salaryRatio2 = combinedSalaries > 0 ? 1 - salaryRatio1 : 0.5;



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

    let unspecifiedPaidByCount = 0;

    const categoryTotals: Record<string, number> = {};

    expenses.forEach((exp) => {
        if (!isExpenseInMonth(exp, monthKey)) return;

        const monthlyValue = getMonthlyExpenseValue(exp, monthKey);

        // Category Totals: Exclude reimbursements to avoid polluting spending charts
        if (exp.type !== ExpenseType.REIMBURSEMENT && exp.type !== ExpenseType.REIMBURSEMENT_FIXED) {
            const cat = exp.category || 'Outros';
            categoryTotals[cat] = roundMoney((categoryTotals[cat] ?? 0) + monthlyValue);
        }

        // Fase 1: Tratar EQUAL como categoria própria
        switch (exp.type) {
            case ExpenseType.FIXED:
                totalFixed = roundMoney(totalFixed + monthlyValue);
                break;
            case ExpenseType.COMMON:
                totalCommon = roundMoney(totalCommon + monthlyValue);
                break;
            case ExpenseType.EQUAL:
                totalEqual = roundMoney(totalEqual + monthlyValue);
                break;
        }

        switch (exp.type) {
            case ExpenseType.FIXED:
            case ExpenseType.COMMON:
            case ExpenseType.EQUAL:
                const isCustom = exp.splitMethod === 'custom';
                const spec1Total = isCustom ? (exp.specificValueP1 ?? 0) : 0;
                const spec2Total = isCustom ? (exp.specificValueP2 ?? 0) : 0;

                const specRatio1 = exp.totalValue > 0 ? spec1Total / exp.totalValue : 0;
                const specRatio2 = exp.totalValue > 0 ? spec2Total / exp.totalValue : 0;

                const monthlySpec1 = roundMoney(monthlyValue * specRatio1);
                const monthlySpec2 = roundMoney(monthlyValue * specRatio2);
                const sharedValue = roundMoney(monthlyValue - monthlySpec1 - monthlySpec2);

                p1Target = roundMoney(p1Target + monthlySpec1);
                p2Target = roundMoney(p2Target + monthlySpec2);

                if (isCustom) {
                    const perc1 = (exp.splitPercentage1 !== undefined) ? exp.splitPercentage1 : 50;
                    const r1 = perc1 / 100;
                    const share1 = roundMoney(sharedValue * r1);
                    const share2 = roundMoney(sharedValue - share1);

                    p1Target = roundMoney(p1Target + share1);
                    p2Target = roundMoney(p2Target + share2);
                } else {
                    // Force 50/50 for EQUAL type if not custom
                    const currentRatio1 = exp.type === ExpenseType.EQUAL ? 0.5 : salaryRatio1;
                    const share1 = roundMoney(sharedValue * currentRatio1);
                    const share2 = roundMoney(sharedValue - share1);

                    p1Target = roundMoney(p1Target + share1);
                    p2Target = roundMoney(p2Target + share2);
                }
                break;

            case ExpenseType.REIMBURSEMENT:
            case ExpenseType.REIMBURSEMENT_FIXED:
                // Only count towards settlement if NOT settled
                if (exp.reimbursementStatus !== 'settled') {
                    totalReimbursement = roundMoney(totalReimbursement + monthlyValue);
                    if (exp.paidBy === 'person1') {
                        p2Target = roundMoney(p2Target + monthlyValue);
                    } else if (exp.paidBy === 'person2') {
                        p1Target = roundMoney(p1Target + monthlyValue);
                    }
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
            // Fase 1: Validar paidBy explicitamente
            if (exp.paidBy === 'person1') {
                p1Spent = roundMoney(p1Spent + monthlyValue);
            } else if (exp.paidBy === 'person2') {
                p2Spent = roundMoney(p2Spent + monthlyValue);
            } else {
                unspecifiedPaidByCount++;
            }
        }
    });

    const balance1 = roundMoney(p1Target - p1Spent);
    const balance2 = roundMoney(p2Target - p2Spent);

    let transferAmount = 0;
    let whoTransfers: 'person1' | 'person2' | 'none' = 'none';

    // Fase 4: Limiar consistente
    if (balance1 > 0.009) {
        transferAmount = Math.abs(balance1);
        whoTransfers = 'person1';
    } else if (balance2 > 0.009) {
        transferAmount = Math.abs(balance2);
        whoTransfers = 'person2';
    }

    // Savings Goals Calculations (Transaction-Based)
    const goalData = (goals || []).map(g => {
        const goalTransactionsForGoal = (goalTransactions || []).filter(t => t.goal_id === g.id);
        return {
            goal: g,
            stats: calculateGoalStats(g, goalTransactionsForGoal)
        };
    });

    const totalGoalSavings = goalData.reduce((sum, item) => roundMoney(sum + item.stats.totalBalance), 0);

    // Fase 2: Metas Planejadas vs Realizadas
    const person1GoalContribution = goalData
        .filter(item => !item.stats.isCompleted)
        .reduce((sum, item) => roundMoney(sum + (item.goal.monthly_contribution_p1 || 0)), 0);

    const person2GoalContribution = goalData
        .filter(item => !item.stats.isCompleted)
        .reduce((sum, item) => roundMoney(sum + (item.goal.monthly_contribution_p2 || 0)), 0);

    const person1GoalsRealized = (goalTransactions || [])
        .filter(t => t.person === 'person1' && t.type === 'deposit' && t.date.startsWith(monthKey))
        .reduce((sum, t) => roundMoney(sum + t.value), 0);

    const person2GoalsRealized = (goalTransactions || [])
        .filter(t => t.person === 'person2' && t.type === 'deposit' && t.date.startsWith(monthKey))
        .reduce((sum, t) => roundMoney(sum + t.value), 0);

    // Use "Planejado" for remaining calculation by default (as per user preference for measuring "Sobrou após planejamento")
    const person1Remaining = roundMoney(totalIncome1 - p1Target - person1PersonalTotal - person1GoalContribution);
    const person2Remaining = roundMoney(totalIncome2 - p2Target - person2PersonalTotal - person2GoalContribution);

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
        categoryTotals,
        totalGoalSavings,
        person1GoalContribution,
        person2GoalContribution,
        person1GoalsRealized,
        person2GoalsRealized,
        p1IncomeBreakdown: {
            salaryReal: p1RealTotal,
            salaryRecurring: p1VirtualTotal,
            other: p1OtherIncome
        },
        p2IncomeBreakdown: {
            salaryReal: p2RealTotal,
            salaryRecurring: p2VirtualTotal,
            other: p2OtherIncome
        },
        unspecifiedPaidByCount,
        person1Remaining,
        person2Remaining
    };
};
