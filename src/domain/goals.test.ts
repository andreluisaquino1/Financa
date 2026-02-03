import { describe, it, expect } from 'vitest';
import { calculateGoalBalance, calculateIndividualGoalBalance, getGoalProgress } from './goals';
import { GoalTransaction, SavingsGoal } from '@/types';

describe('Goals Domain Logic', () => {
    const mockGoal: SavingsGoal = {
        id: 'g1',
        title: 'Test Goal',
        target_value: 1000,
        current_value: 0,
        goal_type: 'couple',
        is_completed: false,
        is_emergency: false,
        created_at: '',
        user_id: ''
    };

    const mockTransactions: GoalTransaction[] = [
        { id: 't1', goal_id: 'g1', type: 'deposit', value: 500, person: 'person1', date: '2024-01-01', description: 'Dep', created_at: '' },
        { id: 't2', goal_id: 'g1', type: 'deposit', value: 300, person: 'person2', date: '2024-01-02', description: 'Dep', created_at: '' },
        { id: 't3', goal_id: 'g1', type: 'withdraw', value: 100, person: 'person1', date: '2024-01-03', description: 'Wit', created_at: '' },
    ];

    it('should calculate total balance correctly', () => {
        expect(calculateGoalBalance(mockTransactions)).toBe(700);
    });

    it('should calculate individual balances correctly', () => {
        expect(calculateIndividualGoalBalance(mockTransactions, 'person1')).toBe(400);
        expect(calculateIndividualGoalBalance(mockTransactions, 'person2')).toBe(300);
    });

    it('should calculate progress percentage securely', () => {
        expect(getGoalProgress(mockGoal, 700)).toBe(70);
        expect(getGoalProgress(mockGoal, 1200)).toBe(100);
        expect(getGoalProgress({ ...mockGoal, target_value: 0 }, 100)).toBe(0);
    });
});
