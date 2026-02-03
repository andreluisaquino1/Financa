import { describe, it, expect } from 'vitest';
import { Investment, InvestmentMovement } from '../types';
import { calculateInvestmentStats } from './investments';

describe('calculateInvestmentStats', () => {
    const mockInvestment: Investment = {
        id: 'inv-1',
        user_id: 'user-1',
        household_id: 'house-1',
        name: 'Tesouro Selic',
        type: 'fixed_income',
        current_value: 0,
        invested_value: 0,
        owner: 'couple',
        created_at: new Date().toISOString()
    };

    it('should correctly calculate balance after buy and sell', () => {
        const movements: InvestmentMovement[] = [
            {
                id: 'm1',
                investment_id: 'inv-1',
                type: 'buy',
                value: 1000,
                quantity: 1,
                date: '2024-01-01',
                person: 'person1',
                created_at: new Date().toISOString()
            },
            {
                id: 'm2',
                investment_id: 'inv-1',
                type: 'sell',
                value: 400,
                quantity: 0.4,
                date: '2024-01-15',
                person: 'person1',
                created_at: new Date().toISOString()
            }
        ];

        const stats = calculateInvestmentStats(mockInvestment, movements);
        expect(stats.totalBalance).toBe(600);
        expect(stats.investedAmount).toBe(600);
        expect(stats.quantity).toBe(0.6);
    });

    it('should increase balance and yield on yield movement', () => {
        const movements: InvestmentMovement[] = [
            {
                id: 'm1',
                investment_id: 'inv-1',
                type: 'buy',
                value: 1000,
                quantity: 1,
                date: '2024-01-01',
                person: 'person1',
                created_at: new Date().toISOString()
            },
            {
                id: 'm2',
                investment_id: 'inv-1',
                type: 'yield',
                value: 50,
                date: '2024-02-01',
                person: 'person1',
                created_at: new Date().toISOString()
            }
        ];

        const stats = calculateInvestmentStats(mockInvestment, movements);
        expect(stats.totalBalance).toBe(1050);
        expect(stats.totalYield).toBe(50);
        expect(stats.investedAmount).toBe(1000);
    });

    it('should handle adjustments correctly', () => {
        const movements: InvestmentMovement[] = [
            {
                id: 'm1',
                investment_id: 'inv-1',
                type: 'buy',
                value: 1000,
                quantity: 1,
                date: '2024-01-01',
                person: 'person1',
                created_at: new Date().toISOString()
            },
            {
                id: 'm2',
                investment_id: 'inv-1',
                type: 'adjustment',
                value: -20,
                date: '2024-02-01',
                person: 'person1',
                created_at: new Date().toISOString()
            }
        ];

        const stats = calculateInvestmentStats(mockInvestment, movements);
        expect(stats.totalBalance).toBe(980);
        expect(stats.investedAmount).toBe(1000);
    });

    it('should calculate profit and percentage correctly', () => {
        const movements: InvestmentMovement[] = [
            {
                id: 'm1',
                investment_id: 'inv-1',
                type: 'buy',
                value: 1000,
                quantity: 1,
                date: '2024-01-01',
                person: 'person1',
                created_at: new Date().toISOString()
            },
            {
                id: 'm2',
                investment_id: 'inv-1',
                type: 'yield',
                value: 100,
                date: '2024-02-01',
                person: 'person1',
                created_at: new Date().toISOString()
            }
        ];

        const stats = calculateInvestmentStats(mockInvestment, movements);
        expect(stats.profit).toBe(100);
        expect(stats.profitPercentage).toBe(10);
    });
});
