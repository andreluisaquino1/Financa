import { goalService } from './goalService';
import { goalTransactionService } from './goalTransactionService';
import { investmentService } from './investmentService';
import { investmentMovementService } from './investmentMovementService';
import { profileService } from './profileService';
import { getLocalDateISOString } from '@/domain/formatters';
import { SavingsGoal, CoupleInfo, UserProfileDB, Investment } from '@/types';

export const migrationService = {
    async migrateToTransactions(userId: string, householdId: string, coupleInfo: CoupleInfo): Promise<CoupleInfo> {
        // 1. Migrate Existing Goals
        const { data: goals } = await goalService.getAll(householdId);
        let updatedCoupleInfo = { ...coupleInfo };

        if (goals) {
            for (const goal of goals) {
                // Check if goal already has transactions
                const { data: existingTransactions } = await goalTransactionService.getByGoal(goal.id);

                if (!existingTransactions || existingTransactions.length === 0) {
                    // Create initial deposit if current_value > 0
                    if (goal.current_value > 0) {
                        await goalTransactionService.create({
                            goal_id: goal.id,
                            type: 'deposit',
                            value: goal.current_value,
                            person: 'person1', // Default to person1 for legacy data
                            date: getLocalDateISOString(),
                            description: 'Saldo Inicial (Migração)'
                        });
                    }

                    // Also check for individual savings fields if they exist and count towards balance
                    if (goal.current_savings_p1 && goal.current_savings_p1 > 0) {
                        await goalTransactionService.create({
                            goal_id: goal.id,
                            type: 'deposit',
                            value: goal.current_savings_p1,
                            person: 'person1',
                            date: getLocalDateISOString(),
                            description: 'Saldo P1 (Migração)'
                        });
                    }

                    if (goal.current_savings_p2 && goal.current_savings_p2 > 0) {
                        await goalTransactionService.create({
                            goal_id: goal.id,
                            type: 'deposit',
                            value: goal.current_savings_p2,
                            person: 'person2',
                            date: getLocalDateISOString(),
                            description: 'Saldo P2 (Migração)'
                        });
                    }

                    // Zero out legacy fields in the database
                    await goalService.update(goal.id, {
                        current_value: 0,
                        current_savings_p1: 0,
                        current_savings_p2: 0
                    });
                }
            }
        }

        // 2. Migrate Emergency Reserve from CoupleInfo
        const emergencyP1 = coupleInfo.emergencyReserveP1 ?? 0;
        const emergencyP2 = coupleInfo.emergencyReserveP2 ?? 0;

        if (emergencyP1 > 0 || emergencyP2 > 0) {
            // Check if emergency goal already exists
            let emergencyGoal = goals?.find(g => g.is_emergency);

            if (!emergencyGoal) {
                const { data: newEmergencyGoal } = await goalService.create({
                    user_id: userId,
                    household_id: householdId,
                    title: 'Reserva de Emergência',
                    target_value: (emergencyP1 + emergencyP2) * 2, // Placeholder target
                    current_value: 0,
                    goal_type: 'couple',
                    is_emergency: true,
                    is_completed: false,
                    icon: '🛡️',
                    priority: 'high'
                } as any);
                emergencyGoal = newEmergencyGoal || undefined;
            }

            if (emergencyGoal) {
                // Check if it already has migration transactions to avoid duplicates
                const { data: currentTransactions } = await goalTransactionService.getByGoal(emergencyGoal.id);
                const hasMigration = currentTransactions?.some(t => t.description.includes('Legacy Hub Migration'));

                if (!hasMigration) {
                    if (emergencyP1 > 0) {
                        await goalTransactionService.create({
                            goal_id: emergencyGoal.id,
                            type: 'deposit',
                            value: emergencyP1,
                            person: 'person1',
                            date: getLocalDateISOString(),
                            description: 'Legacy Hub Migration - P1'
                        });
                    }
                    if (emergencyP2 > 0) {
                        await goalTransactionService.create({
                            goal_id: emergencyGoal.id,
                            type: 'deposit',
                            value: emergencyP2,
                            person: 'person2',
                            date: getLocalDateISOString(),
                            description: 'Legacy Hub Migration - P2'
                        });
                    }
                }

                // Zero out the legacy fields
                updatedCoupleInfo.emergencyReserveP1 = 0;
                updatedCoupleInfo.emergencyReserveP2 = 0;
            }
        }

        return updatedCoupleInfo;
    },

    async migrateInvestments(householdId: string) {
        const { data: investments } = await investmentService.getAll(householdId);
        if (!investments) return;

        for (const inv of investments) {
            const { data: existingMovements } = await investmentMovementService.getByInvestment(inv.id);
            if (!existingMovements || existingMovements.length === 0) {
                // Determine initial movements based on legacy fields
                const invested = Number(inv.invested_value ?? 0);
                const current = Number(inv.current_value ?? 0);
                const person = (inv.owner === 'person2') ? 'person2' : 'person1';

                if (invested > 0) {
                    await investmentMovementService.create({
                        investment_id: inv.id,
                        type: 'buy',
                        value: invested,
                        quantity: inv.quantity,
                        price_per_unit: inv.price_per_unit,
                        date: inv.created_at.split('T')[0],
                        person: person,
                        description: 'Custo Histórico (Migração)'
                    });
                }

                const diff = current - invested;
                if (Math.abs(diff) > 0.01) {
                    await investmentMovementService.create({
                        investment_id: inv.id,
                        type: 'yield',
                        value: diff,
                        date: new Date().toISOString().split('T')[0],
                        person: person,
                        description: 'Rendimento Acumulado (Migração)'
                    });
                }
            }
        }
    }
};
