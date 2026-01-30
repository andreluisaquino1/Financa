import { goalService } from './goalService';
import { goalTransactionService } from './goalTransactionService';
import { profileService } from './profileService';
import { SavingsGoal, CoupleInfo, UserProfileDB } from '@/types';

export const migrationService = {
    async migrateToTransactions(userId: string, householdId: string, coupleInfo: CoupleInfo) {
        // 1. Migrate Existing Goals
        const { data: goals } = await goalService.getAll(householdId);

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
                            date: new Date().toISOString().split('T')[0],
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
                            date: new Date().toISOString().split('T')[0],
                            description: 'Saldo P1 (Migração)'
                        });
                    }

                    if (goal.current_savings_p2 && goal.current_savings_p2 > 0) {
                        await goalTransactionService.create({
                            goal_id: goal.id,
                            type: 'deposit',
                            value: goal.current_savings_p2,
                            person: 'person2',
                            date: new Date().toISOString().split('T')[0],
                            description: 'Saldo P2 (Migração)'
                        });
                    }
                }
            }
        }

        // 2. Migrate Emergency Reserve from CoupleInfo
        const emergencyP1 = coupleInfo.emergencyReserveP1 || 0;
        const emergencyP2 = coupleInfo.emergencyReserveP2 || 0;

        if (emergencyP1 > 0 || emergencyP2 > 0) {
            // Check if emergency goal already exists
            const emergencyGoal = goals?.find(g => g.is_emergency);

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

                if (newEmergencyGoal) {
                    if (emergencyP1 > 0) {
                        await goalTransactionService.create({
                            goal_id: newEmergencyGoal.id,
                            type: 'deposit',
                            value: emergencyP1,
                            person: 'person1',
                            date: new Date().toISOString().split('T')[0],
                            description: 'Saldo Inicial Reserva P1'
                        });
                    }
                    if (emergencyP2 > 0) {
                        await goalTransactionService.create({
                            goal_id: newEmergencyGoal.id,
                            type: 'deposit',
                            value: emergencyP2,
                            person: 'person2',
                            date: new Date().toISOString().split('T')[0],
                            description: 'Saldo Inicial Reserva P2'
                        });
                    }
                }
            }
        }
    }
};
