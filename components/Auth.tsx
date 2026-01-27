
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const Auth: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await resetPassword(email);
        if (error) setError(error.message);
        else setMessage('Email enviado! Verifique sua caixa de entrada.');
      } else if (isNew) {
        const { error } = await signUp(email, password);
        if (error) setError(error.message);
        else setMessage('Conta criada! Verifique seu email para confirmar.');
      } else {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-blue-400 rounded-full blur-[120px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-pink-400 rounded-full blur-[120px] opacity-10 animate-pulse [animation-delay:2s]"></div>

      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        <div className="mb-10 text-center">
          <div className="mb-8 relative inline-block group">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <img src="/logo.png" alt="Logo" className="h-20 w-20 mx-auto object-contain relative transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md border-2 border-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">PRO</div>
          </div>

          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">
            {isForgot ? 'Recuperar Acesso' : isNew ? 'Criar Conta' : 'Boas-vindas'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {isForgot ? 'Insira seu email para continuar' : 'Sua vida financeira a dois mais leve'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-500 px-5 py-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in shake">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 px-5 py-4 rounded-xl text-xs font-bold flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-13 pr-5 py-4 focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-500 outline-none transition-all duration-300 font-bold text-slate-900 placeholder-slate-300"
                placeholder="nome@exemplo.com"
              />
            </div>
          </div>

          {!isForgot && (
            <div className="space-y-2">
              <div className="flex justify-between px-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(null); setMessage(null); }}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-500 transition-colors uppercase tracking-widest"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-13 pr-5 py-4 focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-500 outline-none transition-all duration-300 font-bold text-slate-900 placeholder-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black py-4.5 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 group overflow-hidden relative"
          >
            <span className="relative z-10">
              {loading ? 'Sincronizando...' : isForgot ? 'Recuperar Acesso' : isNew ? 'Começar Jornada' : 'Entrar na Conta'}
            </span>
            {!loading && (
              <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center flex flex-col items-center gap-5">
          <button
            onClick={() => { setIsForgot(false); setIsNew(!isNew); setError(null); setMessage(null); }}
            className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 group"
          >
            {isNew ? 'Já tem uma conta?' : 'Novo por aqui?'}
            <span className="text-blue-600 group-hover:underline underline-offset-4 decoration-2">
              {isNew ? 'Acesse o Painel' : 'Crie sua conta agora'}
            </span>
          </button>

          {isForgot && (
            <button
              onClick={() => { setIsForgot(false); setError(null); setMessage(null); }}
              className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em]"
            >
              Voltar ao Início
            </button>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Finança em Casal &copy; 2026</p>
      </div>
    </div>
  );
};

export default Auth;
