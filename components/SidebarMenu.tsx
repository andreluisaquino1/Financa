
import React, { useState } from 'react';
import { CoupleInfo } from '../types';
import { parseBRL } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
  coupleInfo: CoupleInfo;
  onUpdateSettings: (n1: string, n2: string, s1: number, s2: number) => void;
  userEmail?: string;
  onSignOut?: () => void;
}

const SidebarMenu: React.FC<Props> = ({ isOpen, onClose, onDeleteAccount, coupleInfo, onUpdateSettings, userEmail, onSignOut }) => {
  const [n1, setN1] = useState(coupleInfo.person1Name);
  const [n2, setN2] = useState(coupleInfo.person2Name);
  const [s1, setS1] = useState(coupleInfo.salary1 ? coupleInfo.salary1.toString().replace('.', ',') : '');
  const [s2, setS2] = useState(coupleInfo.salary2 ? coupleInfo.salary2.toString().replace('.', ',') : '');

  const handleSave = () => {
    onUpdateSettings(n1, n2, parseBRL(s1), parseBRL(s2));
    onClose();
  };

  return (
    <>
      <div className={`fixed inset-0 bg-gray-900/60 z-40 transition-opacity backdrop-blur-sm ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 bottom-0 w-80 bg-white z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 bg-blue-600 text-white rounded-br-[3rem]">
          <h2 className="text-2xl font-black tracking-tighter">Ajustes</h2>
          <p className="text-sm font-medium opacity-80 mt-1">Configurações Gerais</p>
          {userEmail && (
            <p className="text-xs font-medium opacity-60 mt-3 truncate">{userEmail}</p>
          )}
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Perfil 1</h3>
            <div className="space-y-3">
                <TextInput label="Nome" value={n1} onChange={setN1} />
                <MoneyInput label="Salário" value={s1} onChange={setS1} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Perfil 2</h3>
            <div className="space-y-3">
                <TextInput label="Nome" value={n2} onChange={setN2} />
                <MoneyInput label="Salário" value={s2} onChange={setS2} />
            </div>
          </div>

          <button onClick={handleSave} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition mt-4">
            Salvar Alterações
          </button>

          <hr className="border-gray-100" />

          {onSignOut && (
            <button onClick={onSignOut} className="w-full flex items-center space-x-3 text-gray-600 font-bold p-3 rounded-xl hover:bg-gray-50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Sair da conta</span>
            </button>
          )}

          <button onClick={onDeleteAccount} className="w-full flex items-center space-x-3 text-red-600 font-bold p-3 rounded-xl hover:bg-red-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Apagar todos os dados</span>
          </button>
        </div>
      </div>
    </>
  );
};

const MoneyInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
      <input type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder="0" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all font-bold text-sm" />
    </div>
  </div>
);

const TextInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</label>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-bold text-sm" placeholder={label} />
  </div>
);

export default SidebarMenu;
