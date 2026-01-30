import React, { useState } from 'react';
import { CoupleInfo, Expense, MonthlySummary, SavingsGoal, ExpenseType } from '@/types';
import PersonalWallet from './PersonalWallet';

interface Props {
    coupleInfo: CoupleInfo;
    expenses: Expense[];
    monthKey: string;
    summary: MonthlySummary;
    goals: SavingsGoal[];
    onAddExpense: (type: ExpenseType, exp?: Expense | null) => void;
    onUpdateExpense: (id: string, exp: Expense) => void;
    onDeleteExpense: (id: string) => void;
}

/**
 * WalletsTab acts as a derived view of the 'expenses' table, filtering by personal types.
 * It does not require a separate table as it inherits RLS security from the expenses module.
 */
const WalletsTab: React.FC<Props> = (props) => {
    const [activePerson, setActivePerson] = useState<'person1' | 'person2'>('person1');

    return (
        <div className="space-y-6">
            {/* Wallet Switcher */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-white/5 inline-flex items-center gap-2 shadow-sm">
                <button
                    onClick={() => setActivePerson('person1')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activePerson === 'person1' ? 'bg-p1 text-white shadow-lg shadow-p1/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    Carteira {props.coupleInfo.person1Name.split(' ')[0]}
                </button>
                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800"></div>
                <button
                    onClick={() => setActivePerson('person2')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activePerson === 'person2' ? 'bg-p2 text-white shadow-lg shadow-p2/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    Carteira {props.coupleInfo.person2Name.split(' ')[0]}
                </button>
            </div>

            {/* Helper text if needed */}
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold pl-2">
                Gerencie os gastos individuais de cada um. Selecione acima qual carteira visualizar.
            </p>

            <PersonalWallet
                {...props}
                person={activePerson}
                key={activePerson} // Force re-render when switching persons
            />
        </div>
    );
};

export default WalletsTab;
