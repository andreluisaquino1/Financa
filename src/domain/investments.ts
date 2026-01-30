import { Investment, InvestmentMovement } from '@/types';

export interface InvestmentStats {
    investedAmount: number;
    totalBalance: number;
    totalYield: number;
    profit: number;
    profitPercentage: number;
    quantity: number;
    person1Balance: number;
    person2Balance: number;
}

/**
 * Calculates investment statistics based on its movements.
 * Following the progressive approach:
 * - capital investido = soma dos aportes - soma dos resgates
 * - valor atual = soma de todas as movimentações
 * - resultado = soma dos rendimentos
 */
export function calculateInvestmentStats(investment: Investment, movements: InvestmentMovement[]): InvestmentStats {
    let investedAmount = 0;
    let totalYield = 0;
    let netQuantity = 0;
    let totalBalance = 0;
    let person1Balance = 0;
    let person2Balance = 0;

    // Filter out deleted movements and sort by date for consistency (though sum doesn't care about order)
    const activeMovements = movements.filter(m => !m.deleted_at);

    activeMovements.forEach(m => {
        const val = Number(m.value) || 0;
        const qty = Number(m.quantity) || 0;

        // Balance is always cumulative
        totalBalance += val;
        if (m.person === 'person1') person1Balance += val;
        else person2Balance += val;

        switch (m.type) {
            case 'buy':
                investedAmount += val;
                netQuantity += qty;
                break;
            case 'sell':
                // According to user request: "capital investido = soma dos aportes - soma dos resgates"
                // Note: 'sell' value in movements is usually the amount received.
                investedAmount -= val;
                netQuantity -= qty;
                break;
            case 'yield':
                totalYield += val;
                break;
            case 'adjustment':
                // Adjustments affect balance but don't count towards invested or yield normally
                // unless the user wants them to.
                break;
        }
    });

    const profit = totalBalance - investedAmount;
    const profitPercentage = Math.abs(investedAmount) > 0.01 ? (profit / investedAmount) * 100 : 0;

    return {
        investedAmount,
        totalBalance,
        totalYield,
        profit,
        profitPercentage,
        quantity: netQuantity,
        person1Balance,
        person2Balance
    };
}

/**
 * Summarizes a portfolio of investments.
 */
export function calculatePortfolioSummary(investments: Investment[], allMovements: InvestmentMovement[]) {
    let totalEquity = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let p1Equity = 0;
    let p2Equity = 0;

    const statsByInvestment: Record<string, InvestmentStats> = {};

    investments.forEach(inv => {
        const movements = allMovements.filter(m => m.investment_id === inv.id);
        const stats = calculateInvestmentStats(inv, movements);

        statsByInvestment[inv.id] = stats;

        totalEquity += stats.totalBalance;
        totalCost += stats.investedAmount;
        totalProfit += stats.profit;

        p1Equity += stats.person1Balance;
        p2Equity += stats.person2Balance;
    });

    const totalYieldPercentage = totalCost !== 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
        totalEquity,
        totalCost,
        totalProfit,
        totalYieldPercentage,
        p1Equity,
        p2Equity,
        statsByInvestment
    };
}
