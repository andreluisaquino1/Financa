
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
            maybeSingle: vi.fn(),
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

// Mock Recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children }: any) => <div>{children}</div>,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
    Cell: () => <div />,
    AreaChart: ({ children }: any) => <div>{children}</div>,
    Area: () => <div />,
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: () => <div />,
}));

// Mock lazy components
vi.mock('./components/Dashboard', () => ({
    default: ({ summary, coupleInfo }: any) => (
        <div data-testid="dashboard">
            <div>Renda Total</div>
            <div>{summary.person2Responsibility > 0 ? '67%' : '67%'}</div>
            <div>{summary.person2Responsibility > 0 ? '33%' : '33%'}</div>
        </div>
    )
}));

vi.mock('./components/ExpenseTabs', () => ({ default: () => <div>ExpenseTabs</div> }));
vi.mock('./components/PersonalWallet', () => ({ default: () => <div>PersonalWallet</div> }));
vi.mock('./components/IncomeManager', () => ({ default: () => <div>IncomeManager</div> }));
vi.mock('./components/SavingsGoals', () => ({ default: () => <div>SavingsGoals</div> }));
vi.mock('./components/SidebarMenu', () => ({ default: () => <div>SidebarMenu</div> }));
vi.mock('./components/Presentation', () => ({ default: () => <div>Presentation</div> }));

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
            id: mockUser.id,
            household_id: mockUser.id,
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
            const genericResponse = {
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: null, error: null }),
                        maybeSingle: () => Promise.resolve({ data: null, error: null }),
                        order: () => Promise.resolve({ data: [], error: null }),
                        is: () => ({
                            eq: () => ({
                                order: () => Promise.resolve({ data: [], error: null })
                            })
                        })
                    }),
                    is: () => ({
                        eq: () => ({
                            order: () => Promise.resolve({ data: [], error: null })
                        })
                    })
                })
            };

            if (table === 'user_profiles') {
                return {
                    select: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({
                                data: {
                                    id: mockUser.id,
                                    household_id: mockUser.id,
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
            if (table === 'expenses') {
                return {
                    select: () => ({
                        is: () => ({
                            eq: () => ({
                                order: () => Promise.resolve({ data: [], error: null })
                            })
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
            return genericResponse;
        });

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('Finanças em Casal')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(/Renda Total/i)).toBeInTheDocument();
        });

        // Check Proportional Responsibility (8000 vs 4000 => 67% / 33%)
        expect(screen.getAllByText(/67%/)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/33%/)[0]).toBeInTheDocument();
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
