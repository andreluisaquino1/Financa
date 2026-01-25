
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
        if (error) {
          setError(error.message);
        } else {
          setMessage('Email enviado! Verifique sua caixa de entrada para redefinir a senha.');
        }
      } else if (isNew) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Conta criada! Verifique seu email para confirmar o cadastro.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-900 font-sans">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-100 border border-white animate-in fade-in duration-500">
        <div className="mb-10 text-center">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg inline-block mb-6 shadow-blue-200">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900">
            {isForgot ? 'Redefinir Senha' : 'Finanças em Casal'}
          </h1>
          {isForgot && <p className="mt-2 text-sm text-gray-400 font-bold">Enviaremos um link de acesso ao seu e-mail</p>}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white text-black border-2 border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-600 outline-none transition-all duration-300"
              placeholder="seu@email.com"
            />
          </div>

          {!isForgot && (
            <div className="space-y-1">
              <div className="flex justify-between px-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</label>
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(null); setMessage(null); }}
                    className="text-[10px] font-bold text-blue-600 hover:underline transition uppercase tracking-tighter"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white text-black border-2 border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-600 outline-none transition-all duration-300"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-blue-100 active:scale-[0.98] transform"
          >
            {loading ? 'Aguarde...' : isForgot ? 'Enviar link de recuperação' : isNew ? 'Criar minha conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 text-center space-y-4">
          <button
            onClick={() => { setIsForgot(false); setIsNew(!isNew); setError(null); setMessage(null); }}
            className="block w-full text-sm font-bold text-blue-600 hover:underline transition underline-offset-4"
          >
            {isNew ? 'Já possui uma conta? Acesse aqui' : 'Não tem acesso? Crie sua conta'}
          </button>

          {isForgot && (
            <button
              onClick={() => { setIsForgot(false); setError(null); setMessage(null); }}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition uppercase tracking-widest"
            >
              Voltar ao login
            </button>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400 font-medium">
        &copy; 2025 Finanças em Casal - Gestão Financeira Segura
      </p>
    </div>
  );
};

export default Auth;
