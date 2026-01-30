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
    });
});
