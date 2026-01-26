
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

interface Props {
    onLinked: (householdId: string) => void;
    onSkip: () => void;
}

const HouseholdLink: React.FC<Props> = ({ onLinked, onSkip }) => {
    const { user } = useAuth();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // O código de convite é simplesmente o ID do parceiro
            const targetId = inviteCode.trim();

            // 1. Verificar se esse perfil existe usando o código de convite
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('household_id, id')
                .eq('invite_code', targetId)
                .single();

            if (profileError || !profile) {
                throw new Error('Código de convite inválido ou não encontrado.');
            }

            const householdId = profile.household_id || profile.id;

            // 2. Atualizar o meu perfil com o household_id dele
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ household_id: householdId })
                .eq('id', user.id);

            if (updateError) throw updateError;

            onLinked(householdId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-900 font-sans">
            <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-100 border border-white animate-in zoom-in duration-500">
                <div className="mb-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">Conectar Parceiro</h2>
                    <p className="text-gray-500 font-medium text-sm">
                        Deseja entrar em um painel compartilhado existente ou começar um novo sozinho?
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLink} className="space-y-6">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Código de Convite</label>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="w-full bg-white text-black border-2 border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-600 outline-none transition-all duration-300 font-mono text-sm"
                            placeholder="Cole o código do seu parceiro"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !inviteCode.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-blue-100 active:scale-[0.98]"
                    >
                        {loading ? 'Conectando...' : 'Entrar no painel compartilhado'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                    <button
                        onClick={onSkip}
                        className="text-sm font-bold text-gray-400 hover:text-gray-600 transition uppercase tracking-widest"
                    >
                        Gerenciar minhas próprias finanças
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HouseholdLink;
