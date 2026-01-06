import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Clock, Users } from 'lucide-react';
import { Button, Input, Modal } from './ui/UIComponents';
import { Receivable } from '../types';
import { formatCurrency, generateId, parseLocalDate } from '../utils';

interface ReceivablesProps {
  receivables: Receivable[];
  onAdd: (r: Receivable) => void;
  onUpdate: (r: Receivable) => void;
  onDelete: (id: string) => void;
  isPrivacyMode: boolean;
}

const Receivables: React.FC<ReceivablesProps> = ({ receivables, onAdd, onUpdate, onDelete, isPrivacyMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Receivable>>({
    debtorName: '', description: '', amount: 0, date: '', status: 'pending'
  });

  const openNewModal = () => {
    setFormData({ debtorName: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], status: 'pending' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.debtorName && formData.amount) {
      onAdd({
        id: generateId(),
        debtorName: formData.debtorName,
        description: formData.description || 'Geral',
        amount: Number(formData.amount),
        date: formData.date!,
        status: 'pending'
      });
      setIsModalOpen(false);
    }
  };

  const toggleStatus = (r: Receivable) => {
      onUpdate({ ...r, status: r.status === 'pending' ? 'paid' : 'pending' });
  };

  const totalPending = receivables.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-r from-cyan-900/40 via-slate-900 to-slate-900 border border-cyan-500/20 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between shadow-xl gap-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
         <div className="relative z-10">
            <span className="text-cyan-300 font-bold uppercase tracking-widest text-xs mb-1 block">A Receber</span>
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{formatCurrency(totalPending, isPrivacyMode)}</h3>
         </div>
         <button onClick={openNewModal} className="relative z-10 w-full md:w-auto px-6 py-4 rounded-3xl bg-slate-800 border border-slate-700 text-white font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 hover:border-cyan-500/50 shadow-lg">
             <Plus size={20} className="text-cyan-500" />
             <span>Nova Cobrança</span>
         </button>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-4">
        {receivables.map(r => (
           <div key={r.id} className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 flex flex-col gap-4 relative overflow-hidden active:scale-[0.98] transition-all shadow-sm">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-900/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                           <Users size={18} />
                      </div>
                      <div>
                          <span className="font-bold text-slate-900 dark:text-white block text-lg leading-tight">{r.debtorName}</span>
                          <span className="text-sm text-slate-500 mt-1 block">{r.description}</span>
                      </div>
                  </div>
                  <span className="font-black text-xl text-slate-900 dark:text-white">{formatCurrency(r.amount, isPrivacyMode)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Data</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{parseLocalDate(r.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleStatus(r)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                            r.status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                        }`}
                      >
                          {r.status === 'paid' ? 'Pago' : 'Pendente'}
                      </button>
                      <button onClick={() => onDelete(r.id)} className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                          <Trash2 size={18} />
                      </button>
                  </div>
              </div>
           </div>
        ))}
        {receivables.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                Nenhuma cobrança registrada.
            </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-xl dark:shadow-2xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.05]">
                <tr>
                    <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Devedor</th>
                    <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Descrição</th>
                    <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-right">Valor</th>
                    <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-center">Data</th>
                    <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-center">Status</th>
                    <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-center">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {receivables.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-cyan-900/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                 <Users size={16} />
                             </div>
                             <span className="font-bold text-slate-900 dark:text-white">{r.debtorName}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-base text-slate-500 font-medium">
                        {r.description}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-lg text-slate-900 dark:text-white">
                        {formatCurrency(r.amount, isPrivacyMode)}
                    </td>
                    <td className="px-8 py-6 text-center text-base text-slate-500">
                        {parseLocalDate(r.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => toggleStatus(r)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                              r.status === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
                          }`}
                        >
                            {r.status === 'paid' ? 'Pago' : 'Pendente'}
                        </button>
                    </td>
                    <td className="px-8 py-6 text-center">
                        <button onClick={() => onDelete(r.id)} className="p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={20} />
                        </button>
                    </td>
                    </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Dívida de Terceiro">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nome da Pessoa" placeholder="Ex: João Silva" value={formData.debtorName} onChange={(e) => setFormData({...formData, debtorName: e.target.value})} required />
          <Input label="O que foi comprado?" placeholder="Ex: Ingresso Show" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
             <Input label="Valor (R$)" type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} required className="font-bold" />
             <Input label="Data da Compra" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
          </div>
          <Button type="submit" className="w-full py-3 mt-2 bg-cyan-600 hover:bg-cyan-500 text-white">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Receivables;