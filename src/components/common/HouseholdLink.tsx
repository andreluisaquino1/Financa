import React, { useState } from 'react';
import { useAuth } from '@/AuthContext';
import { profileService } from '@/services/profileService';

interface Props {
    onLinked: (householdId: string) => void;
    onSkip: () => void;
}

const HouseholdLink: React.FC<Props> = ({ onLinked, onSkip }) => {
    const { user } = useAuth();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Confirmation logic
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingHouseholdId, setPendingHouseholdId] = useState<string | null>(null);

    const handleInitialLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const targetCode = inviteCode.trim();
            const { data: profile, error: profileError } = await profileService.getByInviteCode(targetCode);

            if (profileError || !profile) {
                throw new Error('Código de convite inválido ou não encontrado.');
            }

            const householdId = profile.household_id || profile.id;

            if (householdId === user.id) {
                throw new Error('Você está tentando se conectar ao seu próprio painel.');
            }

            setPendingHouseholdId(householdId);

            // Check if current user has data to merge
            const hasData = await profileService.checkHasData(user.id);

            if (hasData) {
                setShowConfirmation(true);
            } else {
                await executeJoin(householdId, false);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const executeJoin = async (targetId: string, merge: boolean) => {
        setLoading(true);
        try {
            if (merge && user) {
                const { error: migrateError } = await profileService.migrateHouseholdData(user.id, targetId);
                if (migrateError) throw migrateError;
            }

            if (user) {
                const { error: updateError } = await profileService.joinHousehold(user.id, targetId);
                if (updateError) throw updateError;
                onLinked(targetId);
            }
        } catch (err: any) {
            setError('Erro ao processar conexão: ' + err.message);
        } finally {
            setLoading(false);
            setShowConfirmation(false);
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

                {!showConfirmation ? (
                    <form onSubmit={handleInitialLink} className="space-y-6">
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
                            {loading ? 'Verificando...' : 'Entrar no painel compartilhado'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl">
                            <div className="flex items-center gap-3 mb-3 text-amber-700">
                                <span className="text-2xl">⚠️</span>
                                <h4 className="font-black text-sm uppercase tracking-tight">Dados Existentes Detectados</h4>
                            </div>
                            <p className="text-amber-800 text-xs font-medium leading-relaxed">
                                Você já possui registros cadastrados no seu painel. Como deseja prosseguir com a conexão?
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => executeJoin(pendingHouseholdId!, true)}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl text-left border-2 border-transparent transition-all group"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-black text-sm uppercase tracking-tight">🚀 Unir Meus Dados</span>
                                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </div>
                                <p className="text-[10px] opacity-80 font-bold">Leva todas as suas despesas e rendas para o novo painel compartilhado.</p>
                            </button>

                            <button
                                onClick={() => executeJoin(pendingHouseholdId!, false)}
                                disabled={loading}
                                className="w-full bg-white border-2 border-gray-100 hover:border-gray-300 p-5 rounded-2xl text-left transition-all group"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-black text-sm uppercase tracking-tight text-gray-700">🙈 Ocultar Dados Atuais</span>
                                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold">Os dados atuais ficarão ocultos e você começará do zero no novo painel.</p>
                            </button>

                            <button
                                onClick={() => setShowConfirmation(false)}
                                disabled={loading}
                                className="w-full py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                            >
                                Cancelar Conexão
                            </button>
                        </div>
                    </div>
                )}

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
