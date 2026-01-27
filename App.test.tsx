
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
        // Mock user profile
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'user_profiles') {
                return {
                    select: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({
                                data: {
                                    couple_info: {
                                        person1Name: 'André',
                                        person2Name: 'Luciana',
                                        salary1: 8000,
                                        salary2: 4000
                                    }
                                }, error: null
                            })
                        })
                    }),
                    update: () => ({ eq: () => Promise.resolve({}) })
                };
            }
            // Preserve expenses mock from beforeEach
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

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('Finanças em Casal')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Renda Mensal Total')).toBeInTheDocument();
        });

        // Check Proportional Responsibility (8000 vs 4000 => 67% / 33%)
        expect(screen.getByText(/67% \/ 33%/)).toBeInTheDocument();
    });

    it('logic calculation matches utility function result', () => {
        const coupleInfo = {
            person1Name: 'André',
            person2Name: 'Luciana',
            salary1: 8000,
            salary2: 4000
        };
        const summary = calculateSummary([], [], coupleInfo, '2025-01');

        expect(summary.totalFixed).toBe(0);
        expect(summary.person1Responsibility).toBe(0);
    });
});
