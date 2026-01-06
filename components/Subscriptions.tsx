import React, { useState } from 'react';
import { Plus, Trash2, CalendarDays, Zap, Edit2, CalendarClock } from 'lucide-react';
import { Card, Button, Input, Modal } from './ui/UIComponents';
import { Subscription } from '../types';
import { formatCurrency, generateId } from '../utils';

interface SubscriptionsProps {
  subscriptions: Subscription[];
  onAdd: (s: Subscription) => void;
  onUpdate: (s: Subscription) => void;
  onDelete: (id: string) => void;
  isPrivacyMode: boolean;
  currentDate: Date;
}

const PAYMENT_METHODS = [
    'Dinheiro', 'Pix', 'Nubank', 'Inter', 'Itaú', 
    'Bradesco', 'Santander', 'Cartão Crédito', 'Cartão Débito', 'Outros'
];

const Subscriptions: React.FC<SubscriptionsProps> = ({ subscriptions, onAdd, onUpdate, onDelete, isPrivacyMode, currentDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customMethod, setCustomMethod] = useState(false);

  const getCurrentMonthDate = () => {
     const y = currentDate.getFullYear();
     const m = String(currentDate.getMonth() + 1).padStart(2, '0');
     return `${y}-${m}-01`; 
  };

  const [formData, setFormData] = useState<Partial<Subscription>>({
    name: '', amount: 0, billingDay: 1, category: 'Entretenimento', startDate: '', paymentMethod: 'Cartão Crédito'
  });

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', amount: 0, billingDay: 1, category: 'Entretenimento', startDate: getCurrentMonthDate(), paymentMethod: 'Cartão Crédito' });
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingId(sub.id);
    setFormData({ ...sub });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.amount) {
      if (editingId) {
          onUpdate({ ...formData as Subscription, id: editingId });
      } else {
          onAdd({
            id: generateId(),
            name: formData.name,
            amount: Number(formData.amount),
            billingDay: Number(formData.billingDay),
            category: formData.category!,
            startDate: formData.startDate || getCurrentMonthDate(),
            paymentMethod: formData.paymentMethod || 'Cartão Crédito'
          });
      }
      setIsModalOpen(false);
      setCustomMethod(false);
    }
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'Outros') {
          setCustomMethod(true);
          setFormData({...formData, paymentMethod: ''});
      } else {
          setCustomMethod(false);
          setFormData({...formData, paymentMethod: val});
      }
  };

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-24">
      
      {/* 1. Top Summary Card */}
      <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between shadow-xl gap-6 relative overflow-hidden transition-colors duration-300">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Zap size={20} />
                </div>
                <span className="text-purple-600 dark:text-purple-300 font-bold uppercase tracking-widest text-xs">Fixo Mensal</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalMonthly, isPrivacyMode)}</h3>
            <p className="text-slate-500 text-base mt-2">Total de {subscriptions.length} assinaturas ativas</p>
         </div>
         <button onClick={openNewModal} className="relative z-10 w-full md:w-auto px-10 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-glow text-lg">
             <Plus size={24} />
             <span>Nova Assinatura</span>
         </button>
      </div>

      {subscriptions.length > 0 ? (
        <>
            {/* MOBILE CARD VIEW (< md) */}
            <div className="md:hidden space-y-4">
                {subscriptions.map(sub => (
                    <div key={sub.id} className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 flex flex-col gap-4 relative overflow-hidden active:scale-[0.98] transition-all shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#0a0a0a] flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-sm shrink-0">
                                        {sub.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white text-base block leading-tight">{sub.name}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded mt-1.5 inline-block border border-slate-200 dark:border-white/5">{sub.category}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-black text-xl text-slate-900 dark:text-white">{formatCurrency(sub.amount, isPrivacyMode)}</span>
                                <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mt-1 font-bold bg-purple-500/10 px-2 py-0.5 rounded-lg">
                                    <CalendarDays size={12} />
                                    <span>Dia {sub.billingDay}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Método</span>
                                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{sub.paymentMethod}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEditModal(sub)} className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl"><Edit2 size={18} /></button>
                                <button onClick={() => onDelete(sub.id)} className="p-2.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[3rem] overflow-hidden shadow-xl dark:shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.05]">
                        <tr>
                            <th className="px-10 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Serviço</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Categoria</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Método</th>
                            <th className="px-10 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-right">Valor</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-center">Dia Cobrança</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                        {subscriptions.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#0a0a0a] flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                                        {sub.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white text-base">{sub.name}</span>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-white/5">{sub.category}</span>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-base text-slate-500 dark:text-slate-400 font-medium">{sub.paymentMethod}</span>
                            </td>
                            <td className="px-10 py-6 text-right font-bold text-lg text-slate-900 dark:text-white">
                                {formatCurrency(sub.amount, isPrivacyMode)}
                            </td>
                            <td className="px-8 py-6 text-center">
                                <div className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/10 text-xs">
                                <CalendarDays size={14} />
                                <span>Dia {sub.billingDay}</span>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                                <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(sub)} className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"><Edit2 size={20} /></button>
                                    <button onClick={() => onDelete(sub.id)} className="p-3 text-slate-500 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={20} /></button>
                                </div>
                            </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
        </>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[3rem] animate-in fade-in duration-700">
           <div className="w-24 h-24 rounded-full bg-purple-500/5 flex items-center justify-center text-purple-500 mb-8 border border-purple-500/10">
              <CalendarClock size={48} className="opacity-40" />
           </div>
           <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 text-center">Sem assinaturas ativas</h3>
           <p className="text-slate-500 text-center max-w-md mb-10 text-lg">
             Planeje seu futuro controlando seus gastos fixos.
           </p>
           <Button onClick={openNewModal} className="px-12 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white transition-all text-lg">
              <Plus size={24} className="mr-3" /> Nova Assinatura
           </Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Assinatura" : "Nova Assinatura"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Nome do Serviço" placeholder="Ex: Netflix, Adobe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
             <Input label="Valor Mensal" type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} required className="font-bold" />
             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Método</label>
                {!customMethod ? (
                    <div className="relative group">
                        <select 
                            className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-slate-400 group-hover:border-slate-300 dark:group-hover:border-white/[0.2] appearance-none"
                            value={formData.paymentMethod}
                            onChange={handleMethodChange}
                        >
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="relative">
                        <input 
                            className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-purple-500/50 outline-none"
                            placeholder="Digite o método..."
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        />
                         <button type="button" onClick={() => setCustomMethod(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">Voltar</button>
                    </div>
                )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Dia Vencimento" type="number" min="1" max="31" value={formData.billingDay} onChange={(e) => setFormData({...formData, billingDay: parseInt(e.target.value)})} required />
            <Input label="Início" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required />
          </div>
          <Input label="Categoria" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
          <Button type="submit" className="w-full py-4 mt-2 bg-purple-600 hover:bg-purple-500 font-black text-white">{editingId ? "Atualizar" : "Salvar Assinatura"}</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;