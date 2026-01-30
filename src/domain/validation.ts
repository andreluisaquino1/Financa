import { z } from 'zod';
import { ExpenseType } from '@/types';

export const expenseSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    totalValue: z.number().positive('Valor deve ser positivo'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    category: z.string().min(1, 'Categoria é obrigatória'),
    type: z.nativeEnum(ExpenseType),
    paidBy: z.enum(['person1', 'person2']),
    installments: z.number().int().min(1).optional().default(1),
    splitMethod: z.enum(['proportional', 'custom']).optional().nullable(),
    splitPercentage1: z.number().min(0).max(100).optional(),
    specificValueP1: z.number().min(0).optional(),
    specificValueP2: z.number().min(0).optional(),
});

export const incomeSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    value: z.number().positive('Valor deve ser positivo'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    category: z.string().min(1, 'Categoria é obrigatória'),
    paidBy: z.enum(['person1', 'person2']),
});

export const goalSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    target_value: z.number().positive('Valor alvo deve ser positivo'),
    current_value: z.number().min(0, 'Valor atual não pode ser negativo'),
    goal_type: z.enum(['person1', 'person2', 'couple']).optional(),
    deadline: z.string().optional().nullable(),
});

export const validateExpense = (data: any) => expenseSchema.safeParse(data);
export const validateIncome = (data: any) => incomeSchema.safeParse(data);
export const validateGoal = (data: any) => goalSchema.safeParse(data);
