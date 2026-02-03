import { describe, it, expect } from 'vitest';
import { calculateSummary } from './financial';
import { Expense, ExpenseType, Income, CoupleInfo } from '@/types';

describe('Financial Domain Logic', () => {
    describe('calculateSummary', () => {
        const getMockCoupleInfo = (): CoupleInfo => ({
            salary1: 5000,
            salary2: 5000,
            person1Name: 'P1',
            person2Name: 'P2',
            salary1Description: 'Sal1',
            salary2Description: 'Sal2',
            person1RecurringIncomes: [],
            person2RecurringIncomes: []
        });

        const mockIncomes: Income[] = []; // No extra incomes for simplicity

        it('should split common expenses evenly (legacy/default)', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    type: ExpenseType.COMMON,
                    totalValue: 1000,
                    date: '2024-01-15',
                    paidBy: 'person1',
                    household_id: 'h1',
                    category: 'Test',
                    description: 'Test',
                    installments: 1,
                    createdAt: '',
                    splitMethod: 'custom', // 50/50 by default if percentage not set or 50
                    splitPercentage1: 50
                }
            ];

            const result = calculateSummary(expenses, mockIncomes, getMockCoupleInfo(), '2024-01');

            // P1 paid 1000.
            // Split 50/50 -> P1 owes 500, P2 owes 500.
            // P1 Balance = Target (500) - Paid (1000) = -500 (Receives 500)
            // P2 Balance = Target (500) - Paid (0) = 500 (Pays 500)

            expect(result.person1Paid).toBe(1000);
            expect(result.person2Paid).toBe(0);
            expect(result.person1Responsibility).toBe(500);
            expect(result.person2Responsibility).toBe(500);
            expect(result.transferAmount).toBe(500);
            expect(result.whoTransfers).toBe('person2');
        });

        it('should handle proportional split based on salary', () => {
            const unequalSalaryInfo: CoupleInfo = {
                ...getMockCoupleInfo(),
                salary1: 7000,
                salary2: 3000
            };
            // Total 10k. P1=70%, P2=30%

            const expenses: Expense[] = [
                {
                    id: '1',
                    type: ExpenseType.COMMON,
                    totalValue: 1000,
                    date: '2024-01-15',
                    paidBy: 'person1',
                    household_id: 'h1',
                    category: 'Test',
                    description: 'Test',
                    installments: 1,
                    createdAt: '',
                    splitMethod: undefined // Default is proportional
                }
            ];

            const result = calculateSummary(expenses, mockIncomes, unequalSalaryInfo, '2024-01');

            expect(result.person1Responsibility).toBe(700);
            expect(result.person2Responsibility).toBe(300);
            // P1 Paid 1000. Target 700. Balance -300.
            // P2 Paid 0. Target 300. Balance +300. Transfers 300.
            expect(result.transferAmount).toBe(300);
            expect(result.whoTransfers).toBe('person2');
        });

        it('should handle specific values correctly', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    type: ExpenseType.COMMON,
                    totalValue: 1000,
                    date: '2024-01-15',
                    paidBy: 'person1',
                    household_id: 'h1',
                    category: 'Test',
                    description: 'Test',
                    installments: 1,
                    createdAt: '',
                    splitMethod: 'custom',
                    splitPercentage1: 50,
                    specificValueP1: 200, // P1 pays specific 200
                    specificValueP2: 0
                }
            ];
            // Total 1000. Specific P1 = 200. Remainder = 800.
            // Remainder split 50/50 -> 400 each.
            // P1 Total Target = 200 + 400 = 600.
            // P2 Total Target = 0 + 400 = 400.

            const result = calculateSummary(expenses, mockIncomes, getMockCoupleInfo(), '2024-01');

            expect(result.person1Responsibility).toBe(600);
            expect(result.person2Responsibility).toBe(400);
        });

        it('should include goal contributions and calculate remaining values', () => {
            const goals: any[] = [
                {
                    id: 'g1',
                    monthly_contribution_p1: 500,
                    monthly_contribution_p2: 300,
                    is_completed: false,
                    current_value: 0, // Post-migration state
                    current_savings_p1: 0,
                    current_savings_p2: 0
                }
            ];

            const goalTransactions: any[] = [
                { goal_id: 'g1', type: 'deposit', value: 1000, person: 'person1', date: '2024-01-01', description: 'Migração' },
                { goal_id: 'g1', type: 'deposit', value: 100, person: 'person1', date: '2024-01-01', description: 'Migração P1' },
                { goal_id: 'g1', type: 'deposit', value: 200, person: 'person2', date: '2024-01-01', description: 'Migração P2' },
            ];

            const result = calculateSummary([], [], getMockCoupleInfo(), '2024-01', goals, goalTransactions);

            // Total Income P1=5000, P2=5000 (from getMockCoupleInfo)
            // No expenses -> Responsibility 0
            // Contributions: P1=500, P2=300
            // Remaining: P1 = 5000 - 0 - 0 - 500 = 4500
            // Remaining: P2 = 5000 - 0 - 0 - 300 = 4700
            // Total Savings: 1000 + 100 + 200 = 1300

            expect(result.person1GoalContribution).toBe(500);
            expect(result.person2GoalContribution).toBe(300);
            expect(result.person1Remaining).toBe(4500);
            expect(result.person2Remaining).toBe(4700);
            expect(result.totalGoalSavings).toBe(1300);
        });
        it('should handle null/undefined goals and transactions gracefully', () => {
            const result = calculateSummary([], [], getMockCoupleInfo(), '2024-01', undefined as any, undefined as any);

            expect(result.person1GoalContribution).toBe(0);
            expect(result.person2GoalContribution).toBe(0);
            expect(result.person1Remaining).toBe(5000);
            expect(result.person2Remaining).toBe(5000);
            expect(result.totalGoalSavings).toBe(0);
        });
    });
});
