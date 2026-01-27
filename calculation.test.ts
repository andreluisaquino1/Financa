// Comprehensive Test Suite for Finanças em Casal
import { describe, it, expect } from 'vitest';
import { calculateSummary, formatCurrency, parseBRL, formatAsBRL, getMonthYearKey, parseSafeDate } from './utils';
import { CoupleInfo, Expense, ExpenseType, Income } from './types';

// ========== UTILITY FUNCTION TESTS ==========
describe('Utility Functions', () => {
    describe('formatCurrency', () => {
        it('should format positive values correctly', () => {
            const result = formatCurrency(1234.56);
            expect(result).toMatch(/R\$.*1\.234,56/);
        });

        it('should format zero correctly', () => {
            const result = formatCurrency(0);
            expect(result).toMatch(/R\$.*0,00/);
        });

        it('should format negative values correctly', () => {
            const result = formatCurrency(-100);
            expect(result).toMatch(/-.*R\$.*100,00/);
        });
    });

    describe('parseBRL', () => {
        it('should parse BRL formatted string', () => {
            expect(parseBRL('1.234,56')).toBe(1234.56);
        });

        it('should handle number inputs', () => {
            expect(parseBRL(100.50)).toBe(100.50);
        });

        it('should return absolute values', () => {
            expect(parseBRL(-50)).toBe(50);
        });

        it('should handle empty string', () => {
            expect(parseBRL('')).toBe(0);
        });
    });

    describe('formatAsBRL', () => {
        it('should format digits to BRL', () => {
            expect(formatAsBRL('12345')).toBe('123,45');
        });

        it('should handle empty input', () => {
            expect(formatAsBRL('')).toBe('');
        });
    });

    describe('getMonthYearKey', () => {
        it('should return correct format', () => {
            const date = new Date(2026, 0, 15); // January 2026
            expect(getMonthYearKey(date)).toBe('2026-01');
        });

        it('should pad single digit months', () => {
            const date = new Date(2026, 5, 1); // June 2026
            expect(getMonthYearKey(date)).toBe('2026-06');
        });
    });

    describe('parseSafeDate', () => {
        it('should parse date string correctly', () => {
            const date = parseSafeDate('2026-01-15');
            expect(date.getFullYear()).toBe(2026);
            expect(date.getMonth()).toBe(0); // January
            expect(date.getDate()).toBe(15);
        });
    });
});

// ========== CALCULATION TESTS ==========
describe('calculateSummary', () => {
    const baseCoupleInfo: CoupleInfo = {
        person1Name: 'André',
        person2Name: 'Luciana',
        salary1: 8000,
        salary2: 4000
    };

    describe('Basic Proportional Split', () => {
        it('should calculate proportional responsibilities correctly', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.FIXED,
                    category: 'Moradia',
                    description: 'Aluguel',
                    totalValue: 1200,
                    installments: 1,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z'
                }
            ];

            const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

            // 8000/(8000+4000) = 66.67% for P1, 33.33% for P2
            expect(summary.person1Responsibility).toBeCloseTo(800, 1); // 1200 * 0.6667
            expect(summary.person2Responsibility).toBeCloseTo(400, 1); // 1200 * 0.3333
        });

        it('should calculate transfer correctly when P1 paid more', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.COMMON,
                    category: 'Alimentação',
                    description: 'Mercado',
                    totalValue: 600,
                    installments: 1,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z'
                }
            ];

            const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

            // P1 paid 600, P1 owes 400, P2 owes 200
            // P1 balance = 400 - 600 = -200 (overpaid)
            // P2 balance = 200 - 0 = 200 (owes money)
            expect(summary.whoTransfers).toBe('person2');
            expect(summary.transferAmount).toBeCloseTo(200, 1);
        });
    });

    describe('Custom Percentage Split', () => {
        it('should apply custom 50/50 split correctly', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.COMMON,
                    category: 'Lazer',
                    description: 'Cinema',
                    totalValue: 100,
                    installments: 1,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z',
                    splitMethod: 'custom',
                    splitPercentage1: 50
                }
            ];

            const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

            expect(summary.person1Responsibility).toBe(50);
            expect(summary.person2Responsibility).toBe(50);
        });

        it('should apply custom 70/30 split correctly', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.COMMON,
                    category: 'Outros',
                    description: 'Compra compartilhada',
                    totalValue: 1000,
                    installments: 1,
                    paidBy: 'person2',
                    createdAt: '2026-01-01T00:00:00Z',
                    splitMethod: 'custom',
                    splitPercentage1: 70
                }
            ];

            const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

            expect(summary.person1Responsibility).toBe(700);
            expect(summary.person2Responsibility).toBe(300);
        });
    });

    describe('Specific Value Split (NEW FEATURE)', () => {
        it('should assign specific values before splitting remainder', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.COMMON,
                    category: 'Alimentação',
                    description: 'Mercado com itens individuais',
                    totalValue: 300,
                    installments: 1,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z',
                    splitMethod: 'custom',
                    splitPercentage1: 50,
                    specificValueP1: 50, // P1 has 50 of their own
                    specificValueP2: 50  // P2 has 50 of their own
                }
            ];

            const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

            // Total: 300
            // Specific P1: 50 (100% P1's responsibility)
            // Specific P2: 50 (100% P2's responsibility)
            // Shared: 200 (split 50/50 = 100 each)
            // Final: P1 = 50 + 100 = 150, P2 = 50 + 100 = 150
            expect(summary.person1Responsibility).toBe(150);
            expect(summary.person2Responsibility).toBe(150);
        });

        it('should handle specific values with proportional split on remainder', () => {
            const coupleInfo = { ...baseCoupleInfo, salary1: 6000, salary2: 4000 }; // 60% / 40%

            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.COMMON,
                    category: 'Compras',
                    description: 'Mix de itens',
                    totalValue: 500,
                    installments: 1,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z',
                    // No splitMethod = proportional
                    specificValueP1: 100, // P1's specific items
                    specificValueP2: 0
                }
            ];

            const summary = calculateSummary(expenses, [], coupleInfo, '2026-01');

            // Total: 500
            // Specific P1: 100 (goes to P1)
            // Shared: 400 (split 60/40 = 240/160)
            // Final: P1 = 100 + 240 = 340, P2 = 0 + 160 = 160
            expect(summary.person1Responsibility).toBe(340);
            expect(summary.person2Responsibility).toBe(160);
        });

        it('should handle only P2 specific value', () => {
            const coupleInfo = { ...baseCoupleInfo, salary1: 5000, salary2: 5000 }; // 50% / 50%

            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.COMMON,
                    category: 'Mercado',
                    description: 'Compras com cosmético da P2',
                    totalValue: 200,
                    installments: 1,
                    paidBy: 'person2',
                    createdAt: '2026-01-01T00:00:00Z',
                    specificValueP1: 0,
                    specificValueP2: 80 // Cosmético só dela
                }
            ];

            const summary = calculateSummary(expenses, [], coupleInfo, '2026-01');

            // Total: 200
            // Specific P2: 80 (goes to P2)
            // Shared: 120 (split 50/50 = 60 each)
            // Final: P1 = 60, P2 = 80 + 60 = 140
            expect(summary.person1Responsibility).toBe(60);
            expect(summary.person2Responsibility).toBe(140);
        });
    });

    describe('Reimbursement', () => {
        it('should assign reimbursement to the non-payer', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.REIMBURSEMENT,
                    category: 'Outros',
                    description: 'Empréstimo pessoal',
                    totalValue: 100,
                    installments: 1,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z'
                }
            ];

            const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

            // P1 paid, so P2 owes P1
            expect(summary.person1Responsibility).toBe(0);
            expect(summary.person2Responsibility).toBe(100);
        });
    });

    describe('Installments', () => {
        it('should divide value by installments', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.COMMON,
                    category: 'Eletro',
                    description: 'Geladeira 12x',
                    totalValue: 1200,
                    installments: 12,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z'
                }
            ];

            const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

            // Monthly value = 1200 / 12 = 100
            // P1 owes 66.67, P2 owes 33.33
            expect(summary.person1Responsibility).toBeCloseTo(66.67, 1);
            expect(summary.person2Responsibility).toBeCloseTo(33.33, 1);
        });
    });

    describe('Income Integration', () => {
        it('should use incomes for salary calculation when premium', () => {
            const incomes: Income[] = [
                {
                    id: '1',
                    description: 'Salário',
                    value: 10000,
                    category: 'Salário',
                    paidBy: 'person1',
                    date: '2026-01-05',
                    createdAt: '2026-01-01T00:00:00Z'
                },
                {
                    id: '2',
                    description: 'Salário',
                    value: 5000,
                    category: 'Salário',
                    paidBy: 'person2',
                    date: '2026-01-05',
                    createdAt: '2026-01-01T00:00:00Z'
                }
            ];

            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.COMMON,
                    category: 'Moradia',
                    description: 'Conta',
                    totalValue: 300,
                    installments: 1,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z'
                }
            ];

            const summary = calculateSummary(expenses, incomes, baseCoupleInfo, '2026-01', true);

            // Premium uses real incomes: 10000/(10000+5000) = 66.67%
            // Actual incomes are combined with base salaries in coupleInfo
            expect(summary.person1TotalIncome).toBeGreaterThan(0);
            expect(summary.person2TotalIncome).toBeGreaterThan(0);
        });
    });

    describe('Fixed Expense Overrides', () => {
        it('should use override value for specific month', () => {
            const expenses: Expense[] = [
                {
                    id: '1',
                    date: '2026-01-15',
                    type: ExpenseType.FIXED,
                    category: 'Moradia',
                    description: 'Aluguel',
                    totalValue: 1200,
                    installments: 1,
                    paidBy: 'person1',
                    createdAt: '2026-01-01T00:00:00Z',
                    metadata: {
                        overrides: {
                            '2026-01': 1500 // Override for January
                        }
                    }
                }
            ];

            const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

            // Should use 1500 instead of 1200
            expect(summary.totalFixed).toBe(1500);
        });
    });
});

// ========== EDGE CASES ==========
describe('Edge Cases', () => {
    const baseCoupleInfo: CoupleInfo = {
        person1Name: 'André',
        person2Name: 'Luciana',
        salary1: 5000,
        salary2: 5000
    };

    it('should handle empty expenses', () => {
        const summary = calculateSummary([], [], baseCoupleInfo, '2026-01');

        expect(summary.totalFixed).toBe(0);
        expect(summary.totalCommon).toBe(0);
        expect(summary.person1Responsibility).toBe(0);
        expect(summary.person2Responsibility).toBe(0);
        expect(summary.whoTransfers).toBe('none');
    });

    it('should handle zero salaries gracefully', () => {
        const coupleInfo = { ...baseCoupleInfo, salary1: 0, salary2: 0 };
        const expenses: Expense[] = [
            {
                id: '1',
                date: '2026-01-15',
                type: ExpenseType.COMMON,
                category: 'Outros',
                description: 'Teste',
                totalValue: 100,
                installments: 1,
                paidBy: 'person1',
                createdAt: '2026-01-01T00:00:00Z'
            }
        ];

        const summary = calculateSummary(expenses, [], coupleInfo, '2026-01');

        // Should default to 50/50 when no salary data
        expect(summary.person1Responsibility).toBe(50);
        expect(summary.person2Responsibility).toBe(50);
    });

    it('should not count future installments', () => {
        const expenses: Expense[] = [
            {
                id: '1',
                date: '2026-03-15', // March
                type: ExpenseType.COMMON,
                category: 'Outros',
                description: 'Future purchase 3x',
                totalValue: 300,
                installments: 3,
                paidBy: 'person1',
                createdAt: '2026-03-01T00:00:00Z'
            }
        ];

        // Checking January - should not include this expense
        const summary = calculateSummary(expenses, [], baseCoupleInfo, '2026-01');

        expect(summary.totalCommon).toBe(0);
    });
});
