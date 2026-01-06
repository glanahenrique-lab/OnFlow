import React, { useState } from 'react';
import { Target, Calendar, Plus, Trash2, Flag, Edit2, Rocket } from 'lucide-react';
import { Button, Input, Modal } from './ui/UIComponents';
import { Goal } from '../types';
import { formatCurrency, calculateGoalMonthlyNeed, generateId, parseLocalDate } from '../utils';

interface GoalsProps {
  goals: Goal[];
  onAdd: (g: Goal) => void;
  onUpdate: (u: Goal) => void;
  onDelete: (id: string) => void;
  isPrivacyMode: boolean;
  currentDate: Date;
}

const Goals: React.FC<GoalsProps> = ({ goals, onAdd, onUpdate, onDelete, isPrivacyMode, currentDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Goal>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: ''
  });

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      targetAmount: 0, 
      currentAmount: 0, 
      deadline: '',
      startDate: currentDate.toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingId(goal.id);
    setFormData({ ...goal });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.targetAmount) {
      if (editingId) {
          onUpdate({ ...formData as Goal, id: editingId });
      } else {
          onAdd({
            id: generateId(),
            name: formData.name,
            targetAmount: Number(formData.targetAmount),
            currentAmount: Number(formData.currentAmount || 0),
            startDate: currentDate.toISOString().split('T')[0],
            deadline: formData.deadline,
          });
      }
      setIsModalOpen(false);
    }
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-24">
      {/* 1. Top Summary Card (Unified) */}
      <div className="bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-start md:items-center justify-between shadow-xl gap-6 relative overflow-hidden transition-colors duration-300">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Target size={20} />
                </div>
                <span className="text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-widest text-xs">Total Acumulado</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalSaved, isPrivacyMode)}</h3>
            <p className="text-slate-500 text-base mt-2">Meta global: {formatCurrency(totalTarget, isPrivacyMode)}</p>
         </div>
         <button onClick={openNewModal} className="relative z-10 w-full md:w-auto px-10 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-black transition-all flex items-center justify-center gap-3 shadow-glow text-lg">
             <Plus size={24} />
             <span>Nova Meta</span>
         </button>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const monthlyNeed = calculateGoalMonthlyNeed(goal.targetAmount, goal.currentAmount, goal.deadline);

            return (
              <div key={goal.id} className="relative group bg-white/60 dark:bg-[#0f0f0f]/60 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-10 hover:shadow-lg dark:hover:bg-[#0f0f0f] dark:hover:border-white/[0.15] transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-xl dark:shadow-2xl">
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                  <button onClick={() => openEditModal(goal)} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"><Edit2 size={20} /></button>
                  <button onClick={() => onDelete(goal.id)} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10"><Trash2 size={20} /></button>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
                      <Target size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{goal.name}</h3>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Objetivo Financeiro</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-between items-end">
                       <span className="text-4xl font-black text-slate-900 dark:text-white">{Math.floor(progress)}%</span>
                       <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Restante</p>
                          <p className="text-base font-bold text-slate-400 dark:text-slate-300">{formatCurrency(goal.targetAmount - goal.currentAmount, isPrivacyMode)}</p>
                       </div>
                    </div>

                    <div className="relative w-full h-4 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                       <div className="absolute top-0 left-0 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="flex justify-between text-xs font-medium pt-2">
                       <span className="text-slate-500">Guardado: {formatCurrency(goal.currentAmount, isPrivacyMode)}</span>
                       <span className="text-slate-500">Alvo: {formatCurrency(goal.targetAmount, isPrivacyMode)}</span>
                    </div>
                  </div>
                </div>

                {monthlyNeed > 0 && (
                  <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/5">
                    <div className="bg-emerald-500/5 p-5 rounded-3xl border border-emerald-500/10 flex justify-between items-center">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400/70 font-black uppercase tracking-widest">Aporte Mensal</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyNeed, isPrivacyMode)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE - REFERENCE */
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[3rem] animate-in fade-in duration-700">
           <div className="w-24 h-24 rounded-full bg-emerald-500/5 flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/10">
              <Rocket size={48} className="opacity-40" />
           </div>
           <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Sem metas para este mês</h3>
           <p className="text-slate-500 text-center max-w-md mb-10 text-lg">
             Planeje seu futuro registrando seus objetivos. Cada mês no OnFlow pode ter suas próprias metas de economia.
           </p>
           <Button onClick={openNewModal} className="px-12 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-emerald-500 hover:text-black dark:hover:bg-emerald-500 transition-all text-lg">
              <Plus size={24} className="mr-3" /> Começar Agora
           </Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Meta" : "Nova Meta para " + currentDate.toLocaleString('pt-BR', { month: 'long' })}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Título da Meta" placeholder="Ex: Comprar um MacBook" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
             <Input label="Quanto você quer?" type="number" step="0.01" value={formData.targetAmount || ''} onChange={(e) => setFormData({...formData, targetAmount: parseFloat(e.target.value)})} required className="font-bold" />
             <Input label="Já possui?" type="number" step="0.01" value={formData.currentAmount || ''} onChange={(e) => setFormData({...formData, currentAmount: parseFloat(e.target.value)})} />
          </div>
          <Input label="Data Limite (Opcional)" type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
          <Button type="submit" className="w-full py-4 bg-emerald-500 text-black font-black text-base shadow-lg shadow-emerald-500/20 active:scale-95">{editingId ? "Salvar Alterações" : "Ativar Meta"}</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Goals;