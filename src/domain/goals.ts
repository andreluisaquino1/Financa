import { SavingsGoal, GoalTransaction } from '@/types';

const roundMoney = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateGoalBalance = (transactions: GoalTransaction[]): number => {
    return transactions.reduce((sum, t) => {
        if (t.type === 'deposit') return roundMoney(sum + t.value);
        if (t.type === 'withdraw') return roundMoney(sum - t.value);
        return sum;
    }, 0);
};

export const calculateIndividualGoalBalance = (transactions: GoalTransaction[], person: 'person1' | 'person2'): number => {
    return transactions
        .filter(t => t.person === person)
        .reduce((sum, t) => {
            if (t.type === 'deposit') return roundMoney(sum + t.value);
            if (t.type === 'withdraw') return roundMoney(sum - t.value);
            return sum;
        }, 0);
};

export const getGoalProgress = (goal: SavingsGoal, currentBalance: number): number => {
    if (goal.target_value <= 0) return 0;
    return Math.min(roundMoney((currentBalance / goal.target_value) * 100), 100);
};

export const calculateGoalStats = (goal: SavingsGoal, transactions: GoalTransaction[]) => {
    const totalBalance = calculateGoalBalance(transactions);
    const p1Balance = calculateIndividualGoalBalance(transactions, 'person1');
    const p2Balance = calculateIndividualGoalBalance(transactions, 'person2');
    const progress = getGoalProgress(goal, totalBalance);

    return {
        totalBalance,
        p1Balance,
        p2Balance,
        progress,
        isCompleted: progress >= 100
    };
};
