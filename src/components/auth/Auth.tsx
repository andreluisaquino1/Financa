
import React, { useState } from 'react';
import { useAuth } from '@/AuthContext';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 font-sans overflow-hidden relative selection:bg-p1 selection:text-white">
      {/* Background Blurs */}
      <div className="absolute top-0 -left-20 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-p1/10 rounded-full blur-[80px] sm:blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-p2/10 rounded-full blur-[80px] sm:blur-[120px] opacity-30 animate-pulse [animation-delay:2s]"></div>

      <div className="max-w-[440px] w-full bg-white dark:bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        <div className="mb-8 sm:mb-10 text-center flex flex-col items-center">
          <div className="mb-6 sm:mb-8 relative group cursor-default">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-3xl opacity-0 group-hover:opacity-20 transition-all duration-700 scale-150"></div>
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-white/5 relative z-10 transform group-hover:-rotate-6 transition-transform duration-500">
              <img src="/logo.png" alt="Logo" className="h-12 w-12 sm:h-16 sm:w-16 object-contain grayscale-[0.2] group-hover:grayscale-0 transition-all" />
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-p1 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white dark:border-slate-800 animate-bounce group-hover:animate-none">PRO</div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            {isForgot ? 'Recuperar' : isNew ? 'Criar Conta' : 'Boas-vindas'}
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
            {isForgot ? 'Acesso ao painel' : 'Sua vida financeira a dois'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-3 animate-in fade-in">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-3 animate-in fade-in">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">E-mail</label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-300 group-focus-within:text-p1 transition-colors pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-5 py-4 focus:bg-white dark:focus:bg-slate-900 focus:border-p1 outline-none transition-all duration-300 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                placeholder="nome@exemplo.com"
              />
            </div>
          </div>

          {!isForgot && (
            <div className="space-y-2">
              <div className="flex justify-between px-1">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Senha</label>
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(null); setMessage(null); }}
                    className="text-[10px] font-black text-p1 hover:text-p1/80 transition-colors uppercase tracking-widest"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-300 group-focus-within:text-p1 transition-colors pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-5 py-4 focus:bg-white dark:focus:bg-slate-900 focus:border-p1 outline-none transition-all duration-300 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-p1 hover:bg-slate-800 dark:hover:brightness-110 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-p1/10 active:scale-[0.98] disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <span className="relative z-10 uppercase tracking-widest text-xs">
              {loading ? 'Processando...' : isForgot ? 'Recuperar Acesso' : isNew ? 'Começar Agora' : 'Entrar na Conta'}
            </span>
            {!loading && (
              <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </form>

        <div className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-slate-100 dark:border-white/5 text-center flex flex-col items-center gap-6">
          <button
            onClick={() => { setIsForgot(false); setIsNew(!isNew); setError(null); setMessage(null); }}
            className="text-[13px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex flex-col sm:flex-row items-center gap-1 sm:gap-2 group"
          >
            {isNew ? 'Já tem uma conta?' : 'Novo por aqui?'}
            <span className="text-p1 font-black">
              {isNew ? 'Acesse sua conta' : 'Crie sua conta agora'}
            </span>
          </button>

          {isForgot && (
            <button
              onClick={() => { setIsForgot(false); setError(null); setMessage(null); }}
              className="text-[10px] font-black text-slate-300 hover:text-p1 transition-colors uppercase tracking-[0.3em]"
            >
              Voltar para o Login
            </button>
          )}
        </div>
      </div>

      <footer className="mt-8 sm:mt-12 text-center relative z-10">
        <p className="text-[9px] sm:text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-[0.6em]">
          Finança em Casal &copy; 2026
        </p>
      </footer>
    </div>
  );
};

export default Auth;
