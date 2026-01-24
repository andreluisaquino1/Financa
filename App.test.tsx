
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as AuthContextObj from './AuthContext';
import { supabase } from './supabaseClient';
import { calculateSummary } from './utils';

// Mock Supabase
vi.mock('./supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                    order: vi.fn(),
                })),
                single: vi.fn(),
            })),
            insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
            update: vi.fn(() => ({ eq: vi.fn() })),
            delete: vi.fn(() => ({ eq: vi.fn() })),
        })),
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        }
    }
}));

// Mock AuthContext
vi.mock('./AuthContext', async () => {
    const actual = await vi.importActual('./AuthContext');
    return {
        ...actual,
        useAuth: vi.fn(),
        AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    };
});

describe('App Integration Tests', () => {
    const mockUser = { id: 'test-user-id', email: 'test@test.com' };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock user logged in
        (AuthContextObj.useAuth as any).mockReturnValue({
            user: mockUser,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        });

        // Mock initial data loading response
        const mockProfile = {
            couple_info: {
                person1Name: 'André',
                person2Name: 'Luciana',
                salary1: 8000,
                salary2: 4000,
                andreCreditCardValue: 500,
                andrePersonalExpenses: 0
            }
        };

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'user_profiles') {
                return {
                    select: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({ data: mockProfile, error: null })
                        })
                    }),
                    update: () => ({ eq: () => Promise.resolve({}) })
                };
            }
            if (table === 'expenses') {
                return {
                    select: () => ({
                        eq: () => ({
                            order: () => Promise.resolve({ data: [], error: null })
                        })
                    }),
                    insert: (data: any) => ({
                        select: () => ({
                            single: () => Promise.resolve({ data: { ...data, id: 'new-id', created_at: new Date().toISOString() }, error: null })
                        })
                    }),
                    delete: () => ({ eq: () => Promise.resolve({}) })
                };
            }
            return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
        });
    });

    it('calculates summary correctly with loaded data', async () => {
        render(<App />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Finanças em Casal')).toBeInTheDocument();
        });

        // Verify Salaries
        // Note: Dashboard displays formatted currency, so we look for formated values or check logic
        // We can't easily check formatted values inside complex components without data-testids, 
        // but we can verify the text in the "Total Compartilhado" or transfer cards.

        // Check Proportional Responsibility (8000 vs 4000 => 67% / 33%)
        expect(screen.getByText(/67% \/ 33%/)).toBeInTheDocument();

        // Verify Card Value
        // R$ 500,00
        expect(screen.getByDisplayValue('500')).toBeInTheDocument();
    });

    it('logic calculation matches utility function result', () => {
        // Direct unit test of calculation logic to ensure safety
        const coupleInfo = {
            person1Name: 'André',
            person2Name: 'Luciana',
            salary1: 8000,
            salary2: 4000,
            andreCreditCardValue: 500,
            andrePersonalExpenses: 0
        };

        const expenses = [
            {
                id: '1', date: '2026-01-15', type: 'FIXED' as any, category: 'Moradia', description: 'Aluguel',
                totalValue: 1200, installments: 1, paidBy: 'person1' as any, createdAt: ''
            }
        ];

        const summary = calculateSummary(expenses, coupleInfo, '2026-01');

        // Andre ratio: 0.666...
        // Luciana ratio: 0.333...
        // Expense 1200 Fixed
        // Andre should pay: 1200 * 0.666... = 800
        // Luciana should pay: 1200 * 0.333... = 400
        // Card 500 (Andre owes, Luciana paid)
        // Total Andre Responsibility: 800 + 500 = 1300
        // Total Luciana Responsibility: 400

        // Paid:
        // Andre paid 1200
        // Luciana paid 500 (card)

        // Balance:
        // Andre: Target 1300 - Paid 1200 = 100 (Owes 100)
        // Luciana: Target 400 - Paid 500 = -100 (Receives 100)

        expect(summary.transferAmount).toBeCloseTo(100, 1);
        expect(summary.whoTransfers).toBe('person1');
    });
});
