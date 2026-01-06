import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, CalendarClock, ShoppingBag, Banknote } from 'lucide-react';
import { Button, Input, Modal } from './ui/UIComponents';
import { Installment, Transaction } from '../types';
import { formatCurrency, generateId, parseLocalDate } from '../utils';

interface InstallmentsProps {
  installments: Installment[];
  onAdd: (i: Installment) => void;
  onAddTransaction: (t: Transaction) => void; // Para criar o pagamento da fatura
  onDelete: (id: string) => void;
  isPrivacyMode: boolean;
  currentDate: Date;
}

const CARD_OPTIONS = ['Nubank', 'Inter', 'Itaú', 'Bradesco', 'Santander', 'C6 Bank', 'XP', 'BTG', 'Caixa', 'Banco do Brasil', 'Outros'];

const Installments: React.FC<InstallmentsProps> = ({ installments, onAdd, onAddTransaction, onDelete, isPrivacyMode, currentDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [customCard, setCustomCard] = useState(false);
  
  const getCurrentMonthDate = () => {
     const y = currentDate.getFullYear();
     const m = String(currentDate.getMonth() + 1).padStart(2, '0');
     return `${y}-${m}-01`; 
  };

  const [formData, setFormData] = useState<Partial<Installment>>({
    description: '', totalAmount: 0, totalInstallments: 3, startDate: '', paymentMethod: 'Cartão de Crédito', cardName: 'Nubank'
  });

  const [paymentData, setPaymentData] = useState({
      amount: 0,
      description: 'Pagamento Fatura Parcial',
      date: new Date().toISOString().split('T')[0]
  });

  const openNewModal = () => {
      setFormData({ description: '', totalAmount: 0, totalInstallments: 3, startDate: getCurrentMonthDate(), paymentMethod: 'Cartão de Crédito', cardName: 'Nubank' });
      setIsModalOpen(true);
  };

  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description && formData.totalAmount && formData.totalInstallments) {
      onAdd({
        id: generateId(),
        description: formData.description,
        totalAmount: Number(formData.totalAmount),
        totalInstallments: Number(formData.totalInstallments),
        startDate: formData.startDate || getCurrentMonthDate(),
        paymentMethod: 'Cartão de Crédito',
        cardName: formData.cardName || 'Outros'
      });
      setIsModalOpen(false);
      setCustomCard(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (paymentData.amount > 0) {
          onAddTransaction({
              id: generateId(),
              type: 'expense',
              amount: paymentData.amount,
              description: paymentData.description,
              category: 'Pagamento Fatura',
              date: paymentData.date,
              paymentMethod: 'Conta Corrente'
          });
          setIsPaymentModalOpen(false);
          setPaymentData({ amount: 0, description: 'Pagamento Fatura Parcial', date: new Date().toISOString().split('T')[0] });
          alert('Pagamento registrado no Fluxo com sucesso!');
      }
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'Outros') {
          setCustomCard(true);
          setFormData({...formData, cardName: ''});
      } else {
          setCustomCard(false);
          setFormData({...formData, cardName: val});
      }
  };

  // Calculate Monthly Total
  const totalMonthly = installments.reduce((acc, inst) => {
      // Need to cast because installments are filtered in App.tsx
      const i = inst as Installment & { paidInstallments: number };
      return acc + (i.totalAmount / i.totalInstallments);
  }, 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-24">
      
      {/* 1. Top Summary Card */}
      <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between shadow-xl gap-6 relative overflow-hidden transition-colors duration-300">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    <CreditCard size={20} />
                </div>
                <span className="text-orange-600 dark:text-orange-300 font-bold uppercase tracking-widest text-xs">Fatura Parcelada (Mês)</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalMonthly, isPrivacyMode)}</h3>
            <p className="text-slate-500 text-base mt-2">{installments.length} compras parceladas ativas</p>
         </div>
         <div className="flex flex-col md:flex-row gap-3 relative z-10 w-full md:w-auto">
             <button onClick={() => setIsPaymentModalOpen(true)} className="px-8 py-5 rounded-3xl bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 font-bold hover:bg-slate-100 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                 <Banknote size={20} />
                 <span>Pagar Valor X</span>
             </button>
             <button onClick={openNewModal} className="px-10 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-glow text-lg">
                 <Plus size={24} />
                 <span>Nova Compra</span>
             </button>
         </div>
      </div>

      {installments.length > 0 ? (
        <>
            {/* MOBILE CARD VIEW (< md) */}
            <div className="md:hidden space-y-4">
                {installments.map((inst) => {
                    const dynamicInst = inst as Installment & { paidInstallments: number };
                    const monthlyVal = dynamicInst.totalAmount / dynamicInst.totalInstallments;
                    const percent = (dynamicInst.paidInstallments / dynamicInst.totalInstallments) * 100;
                    return (
                        <div key={inst.id} className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 flex flex-col gap-4 relative overflow-hidden active:scale-[0.98] transition-all shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white text-base block leading-tight">{inst.description}</span>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <CreditCard size={12} className="text-slate-400" />
                                        <span className="text-xs text-slate-500 font-bold uppercase">{inst.cardName || inst.paymentMethod}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-black text-xl text-slate-900 dark:text-white">{formatCurrency(monthlyVal, isPrivacyMode)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                                    <span>{dynamicInst.paidInstallments} de {dynamicInst.totalInstallments}</span>
                                    <span>{Math.round(percent)}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                                    <div className="h-full bg-orange-500 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }}></div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                                <button onClick={() => onDelete(inst.id)} className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[3rem] overflow-hidden shadow-xl dark:shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.05]">
                        <tr>
                            <th className="px-10 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Descrição</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Cartão</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-right">Valor Mensal</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-center">Progresso</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-right">Restante</th>
                            <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                        {installments.map((inst) => {
                            const dynamicInst = inst as Installment & { paidInstallments: number };
                            const monthlyVal = dynamicInst.totalAmount / dynamicInst.totalInstallments;
                            const remainingVal = (dynamicInst.totalInstallments - dynamicInst.paidInstallments) * monthlyVal;
                            const percent = (dynamicInst.paidInstallments / dynamicInst.totalInstallments) * 100;

                            return (
                                <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500 border border-orange-500/10">
                                        <ShoppingBag size={18} />
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white text-base">{inst.description}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={16} className="text-slate-400" />
                                        <span className="text-base text-slate-500 dark:text-slate-400 font-bold">{inst.cardName || inst.paymentMethod}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right font-bold text-lg text-slate-900 dark:text-white">
                                    {formatCurrency(monthlyVal, isPrivacyMode)}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-2 w-48 mx-auto">
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span>{dynamicInst.paidInstallments}/{dynamicInst.totalInstallments}</span>
                                        <span>{Math.round(percent)}%</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right text-slate-500 dark:text-slate-400 text-base font-medium">
                                    {formatCurrency(remainingVal, isPrivacyMode)}
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <button onClick={() => onDelete(inst.id)} className="p-3 rounded-xl text-slate-500 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    </table>
                </div>
            </div>
        </>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[3rem] animate-in fade-in duration-700">
           <div className="w-24 h-24 rounded-full bg-orange-500/5 flex items-center justify-center text-orange-500 mb-8 border border-orange-500/10">
              <ShoppingBag size={48} className="opacity-40" />
           </div>
           <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 text-center">Sem compras parceladas</h3>
           <p className="text-slate-500 text-center max-w-md mb-10 text-lg">
             Planeje seu futuro gerenciando seu crédito.
           </p>
           <Button onClick={openNewModal} className="px-12 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white transition-all text-lg">
              <Plus size={24} className="mr-3" /> Nova Compra
           </Button>
        </div>
      )}

      {/* Modal Nova Compra Parcelada */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Compra Parcelada">
        <form onSubmit={handleInstallmentSubmit} className="space-y-6">
          <Input label="Descrição" placeholder="Ex: iPhone" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor Total" type="number" step="0.01" value={formData.totalAmount || ''} onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value)})} required className="font-bold text-lg" />
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Cartão Utilizado</label>
                {!customCard ? (
                    <div className="relative group">
                        <select 
                            className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder:text-slate-400 group-hover:border-slate-300 dark:group-hover:border-white/[0.2] appearance-none"
                            value={formData.cardName}
                            onChange={handleCardChange}
                        >
                            {CARD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="relative">
                        <input 
                            className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-orange-500/50 outline-none"
                            placeholder="Nome do Cartão..."
                            value={formData.cardName}
                            onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                        />
                         <button type="button" onClick={() => setCustomCard(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">Voltar</button>
                    </div>
                )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Input label="Nº Parcelas" type="number" min="2" value={formData.totalInstallments} onChange={(e) => setFormData({...formData, totalInstallments: parseInt(e.target.value)})} required />
             <Input label="Primeira Cobrança" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required />
          </div>
          <Button type="submit" className="w-full py-4 mt-2 bg-orange-600 hover:bg-orange-500 text-white font-black">Registrar Compra</Button>
        </form>
      </Modal>

      {/* Modal Pagamento Parcial */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Pagamento Parcial de Fatura">
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-white/5">
                  Isso irá criar uma despesa única no seu fluxo de caixa chamada "Pagamento Fatura", útil para quando você paga um valor específico do cartão e não a fatura cheia.
              </div>
              <Input label="Valor a Pagar" type="number" step="0.01" value={paymentData.amount || ''} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})} required className="font-bold text-lg" />
              <Input label="Data do Pagamento" type="date" value={paymentData.date} onChange={(e) => setPaymentData({...paymentData, date: e.target.value})} required />
              <Input label="Descrição (Opcional)" value={paymentData.description} onChange={(e) => setPaymentData({...paymentData, description: e.target.value})} />
              
              <Button type="submit" className="w-full py-4 bg-emerald-500 text-black font-black text-lg">Confirmar Pagamento</Button>
          </form>
      </Modal>
    </div>
  );
};

export default Installments;