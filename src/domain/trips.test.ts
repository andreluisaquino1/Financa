import { describe, it, expect } from 'vitest';
import { calculateTripSettlement } from './trips';
import { Trip } from '@/types';

describe('Trips Domain Logic', () => {
    const mockTrip: Trip = {
        id: 'trip1',
        household_id: 'h1',
        name: 'EuroTrip',
        proportionType: 'proportional',
        created_at: '',
        deposits: [
            { id: 'd1', trip_id: 'trip1', person: 'person1', value: 1000, date: '2024-01-01', description: 'Dep', created_at: '' },
            { id: 'd2', trip_id: 'trip1', person: 'person2', value: 1000, date: '2024-01-01', description: 'Dep', created_at: '' }
        ],
        expenses: [
            { id: 'e1', trip_id: 'trip1', description: 'Hotel', value: 1500, paidBy: 'person1', date: '2024-01-02', category: 'H', created_at: '' },
            { id: 'e2', trip_id: 'trip1', description: 'Food', value: 500, paidBy: 'fund', date: '2024-01-03', category: 'F', created_at: '' }
        ]
    };

    it('should calculate settlement correctly with fund usage', () => {
        // Total Expenses: 1500 (P1) + 500 (Fund) = 2000
        // P1 Salary Ratio: 0.5 -> Responsibility 1000 each
        // P1 Paid: 1500 (Direct) + 1000 (Deposit) = 2500
        // P2 Paid: 0 (Direct) + 1000 (Deposit) = 1000

        // P1 Responsibility: 1000
        // P1 Balance: 1000 - 2500 = -1500 (Receives)

        // P2 Responsibility: 1000
        // P2 Balance: 1000 - 1000 = 0

        // Wait, if P1 paid 1500 and both gave 1000 to fund (total 2000 in fund).
        // Fund used 500. Fund remains 1500.
        // If P1 receives 1500, it's exactly the fund balance!

        const settlement = calculateTripSettlement(mockTrip, 0.5);

        expect(settlement.totalExpenses).toBe(2000);
        expect(settlement.fundBalance).toBe(1500);
        expect(settlement.p1Balance).toBe(-1500);
        expect(settlement.p2Balance).toBe(0);
        expect(settlement.whoOwes).toBe('none'); // Since P1 just receives from fund
    });

    it('should handle custom proportions', () => {
        const customTrip: Trip = {
            ...mockTrip,
            proportionType: 'custom',
            customPercentage1: 70, // P1 pays 70%
            expenses: [
                { id: 'e1', trip_id: 'trip1', description: 'All', value: 1000, paidBy: 'person1', date: '2024-01-01', category: 'X', created_at: '' }
            ],
            deposits: []
        };

        // Total: 1000
        // P1 Resp: 700. P1 Paid: 1000. Balance P1: 700 - 1000 = -300 (receives)
        // P2 Resp: 300. P2 Paid: 0. Balance P2: 300 - 0 = 300 (owes)

        const settlement = calculateTripSettlement(customTrip, 0.5);
        expect(settlement.p1Responsibility).toBe(700);
        expect(settlement.p2Responsibility).toBe(300);
        expect(settlement.whoOwes).toBe('person2');
        expect(settlement.amountToSettle).toBe(300);
    });
});
