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
    goal_type: z.enum(['individual_p1', 'individual_p2', 'couple']).optional(),
    deadline: z.string().optional().nullable(),
    monthly_contribution_p1: z.number().min(0).optional(),
    monthly_contribution_p2: z.number().min(0).optional(),
    interest_rate: z.number().min(0).max(100).optional(),
});

export const loanSchema = z.object({
    borrower_name: z.string().min(1, 'Nome do tomador é obrigatório'),
    description: z.string().min(1, 'Descrição é obrigatória'),
    total_value: z.number().positive('Valor total deve ser positivo'),
    remaining_value: z.number().min(0, 'Valor restante não pode ser negativo'),
    installments: z.number().int().min(1).optional(),
    paid_installments: z.number().int().min(0).optional(),
    due_date: z.string().optional().nullable(),
    lender: z.enum(['person1', 'person2']),
    status: z.enum(['pending', 'partial', 'paid']),
});

export const investmentSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: z.enum(['fixed_income', 'variable_income', 'crypto', 'funds', 'real_estate', 'custom']),
    current_value: z.number().min(0, 'Valor atual não pode ser negativo'),
    invested_value: z.number().min(0, 'Valor investido não pode ser negativo'),
    quantity: z.number().min(0).optional(),
    price_per_unit: z.number().min(0).optional(),
    owner: z.enum(['person1', 'person2', 'couple']),
});

export const tripSchema = z.object({
    name: z.string().min(1, 'Nome da viagem é obrigatório'),
    budget: z.number().min(0, 'Orçamento não pode ser negativo'),
    proportionType: z.enum(['equal', 'custom']).optional(),
    customPercentage1: z.number().min(0).max(100).optional(),
});

export const tripExpenseSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    value: z.number().positive('Valor deve ser positivo'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    paidBy: z.enum(['person1', 'person2']),
    category: z.string().optional(),
});

export const tripDepositSchema = z.object({
    person: z.enum(['person1', 'person2']),
    value: z.number().positive('Valor deve ser positivo'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    description: z.string().optional(),
});

export const coupleInfoSchema = z.object({
    person1Name: z.string().min(1, 'Nome da pessoa 1 é obrigatório'),
    person2Name: z.string().min(1, 'Nome da pessoa 2 é obrigatório'),
    salary1: z.number().min(0),
    salary2: z.number().min(0),
    theme: z.enum(['light', 'dark']).optional(),
});

export const profileSchema = z.object({
    email: z.string().email('E-mail inválido'),
    coupleInfo: coupleInfoSchema,
    household_id: z.string().optional(),
    invite_code: z.string().optional(),
});

export const validateExpense = (data: unknown) => expenseSchema.safeParse(data);
export const validateIncome = (data: unknown) => incomeSchema.safeParse(data);
export const validateGoal = (data: unknown) => goalSchema.safeParse(data);
export const validateLoan = (data: unknown) => loanSchema.safeParse(data);
export const validateInvestment = (data: unknown) => investmentSchema.safeParse(data);
export const validateTrip = (data: unknown) => tripSchema.safeParse(data);
export const validateTripExpense = (data: unknown) => tripExpenseSchema.safeParse(data);
export const validateTripDeposit = (data: unknown) => tripDepositSchema.safeParse(data);
export const validateProfile = (data: unknown) => profileSchema.safeParse(data);


