
import React, { useState } from 'react';
import { CoupleInfo } from '@/types';
import { parseBRL, formatAsBRL } from '@/utils';

interface Props {
  onComplete: (info: CoupleInfo) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [person1Name, setPerson1Name] = useState('André');
  const [person2Name, setPerson2Name] = useState('Luciana');
  const [salary1, setSalary1] = useState('');
  const [salary2, setSalary2] = useState('');

  const handleNext = () => {
    if (step === 1 && person1Name && person2Name) {
      setStep(2);
    } else if (step === 2) {
      onComplete({
        person1Name,
        person2Name,
        salary1: parseBRL(salary1),
        salary2: parseBRL(salary2)
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-white p-12 rounded-[2.5rem] shadow-2xl border border-white">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-blue-600 mb-2">Finanças em Casal</h1>
          <p className="text-gray-400 font-medium">Configure seu planejamento compartilhado</p>
        </div>

        <div className="mb-10">
          <div className="flex items-center space-x-2 mb-4 justify-center">
            <div className={`h-2 w-16 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`h-2 w-16 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Nomes do Casal</h2>
              <p className="text-gray-400 text-sm font-medium">Como vocês preferem ser chamados?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Primeiro Integrante</label>
                <input
                  type="text"
                  value={person1Name}
                  onChange={(e) => setPerson1Name(e.target.value)}
                  className="w-full bg-white text-black border-2 border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                  placeholder="Ex: André"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Segundo Integrante</label>
                <input
                  type="text"
                  value={person2Name}
                  onChange={(e) => setPerson2Name(e.target.value)}
                  className="w-full bg-white text-black border-2 border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                  placeholder="Ex: Luciana"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Valores Mensais</h2>
              <p className="text-gray-400 text-sm font-medium">Informe os rendimentos e valores fixos mensais.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Salário de {person1Name}</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={salary1}
                    onChange={(e) => setSalary1(formatAsBRL(e.target.value))}
                    className="w-full bg-white text-black border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Salário de {person2Name}</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={salary2}
                    onChange={(e) => setSalary2(formatAsBRL(e.target.value))}
                    className="w-full bg-white text-black border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 flex items-center justify-between">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition">Voltar</button>
          )}
          <button
            onClick={handleNext}
            disabled={step === 1 ? (!person1Name || !person2Name) : (!salary1 || !salary2)}
            className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black py-4 px-10 rounded-2xl transition shadow-lg active:scale-95 flex items-center space-x-2"
          >
            <span>{step === 1 ? 'Próximo Passo' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
