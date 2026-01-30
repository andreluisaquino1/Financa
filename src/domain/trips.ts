import { Trip, TripExpense, TripDeposit } from '@/types';

const roundMoney = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

export interface TripSettlement {
    totalExpenses: number;
    totalPaidByP1: number;
    totalPaidByP2: number;
    totalPaidByFund: number;
    p1Responsibility: number;
    p2Responsibility: number;
    p1Balance: number; // Positive means owes, Negative means receives
    p2Balance: number;
    whoOwes: 'person1' | 'person2' | 'none';
    amountToSettle: number;
    fundBalance: number;
}

export const calculateTripSettlement = (trip: Trip, p1SalaryRatio: number): TripSettlement => {
    const expenses = trip.expenses || [];
    const deposits = trip.deposits || [];

    const totalExpenses = roundMoney(expenses.reduce((sum, e) => sum + e.value, 0));

    // 1. Who actually paid the expenses?
    const totalPaidByP1 = roundMoney(expenses.filter(e => e.paidBy === 'person1').reduce((sum, e) => sum + e.value, 0));
    const totalPaidByP2 = roundMoney(expenses.filter(e => e.paidBy === 'person2').reduce((sum, e) => sum + e.value, 0));
    const totalPaidByFund = roundMoney(expenses.filter(e => e.paidBy === 'fund').reduce((sum, e) => sum + e.value, 0));

    // 2. Fund contributions (deposits)
    const p1Deposits = roundMoney(deposits.filter(d => d.person === 'person1').reduce((sum, d) => sum + d.value, 0));
    const p2Deposits = roundMoney(deposits.filter(d => d.person === 'person2').reduce((sum, d) => sum + d.value, 0));
    const fundBalance = roundMoney(p1Deposits + p2Deposits - totalPaidByFund);

    // 3. Financial responsibility (Split)
    // The responsibility is calculated on totalExpenses MINUS what was already covered by the fund
    // Or more traditionally: Responsibility on totalExpenses, and deposits count as "payments"
    // Let's use the standard: Contribution + direct pay = Total Paid vs Responsibility

    let p1Ratio = p1SalaryRatio;
    if (trip.proportionType === 'custom' && trip.customPercentage1 !== undefined) {
        p1Ratio = trip.customPercentage1 / 100;
    }
    const p2Ratio = 1 - p1Ratio;

    const p1Responsibility = roundMoney(totalExpenses * p1Ratio);
    const p2Responsibility = roundMoney(totalExpenses * p2Ratio);

    // 4. Final Balance
    // Total Paid = Direct Payment + Deposits to Fund
    const p1TotalGiven = roundMoney(totalPaidByP1 + p1Deposits);
    const p2TotalGiven = roundMoney(totalPaidByP2 + p2Deposits);

    const b1 = roundMoney(p1Responsibility - p1TotalGiven);
    const b2 = roundMoney(p2Responsibility - p2TotalGiven);

    let whoOwes: 'person1' | 'person2' | 'none' = 'none';
    let amountToSettle = 0;

    if (b1 > 0.01) {
        whoOwes = 'person1';
        amountToSettle = b1;
    } else if (b2 > 0.01) {
        whoOwes = 'person2';
        amountToSettle = b2;
    }

    return {
        totalExpenses,
        totalPaidByP1,
        totalPaidByP2,
        totalPaidByFund,
        p1Responsibility,
        p2Responsibility,
        p1Balance: b1,
        p2Balance: b2,
        whoOwes,
        amountToSettle,
        fundBalance
    };
};
