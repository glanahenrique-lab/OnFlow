import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Search, Calendar, Wallet, Receipt, Undo2, Gift, Car, Users, User, AlertCircle, CreditCard } from 'lucide-react';
import { Button, Input, Modal } from './ui/UIComponents';
import { Transaction, Installment, Receivable } from '../types';
import { formatCurrency, generateId, parseLocalDate } from '../utils';

interface TransactionsProps {
  data: Transaction[]; 
  installments?: (Installment & { paidInstallments: number })[]; // Recebe parcelas para exibir no fluxo
  onAdd: (t: Transaction) => void;
  onAddReceivable?: (r: Receivable) => void; // Para criar contas a receber automaticamente
  onUpdate: (t: Transaction) => void;
  onDelete: (id: string) => void;
  isPrivacyMode: boolean;
  currentDate: Date;
}

const DEFAULT_CATEGORIES = [
  'Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 
  'Assinaturas', 'Presentes', 'Educação', 'Mercado', 'Serviços', 'Outros'
];

const TRANSPORT_APPS = ['Uber', '99', 'Táxi', 'Ônibus/Metrô', 'Carona'];
const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência'];
const CARD_OPTIONS = ['Nubank', 'Inter', 'Itaú', 'Bradesco', 'Santander', 'C6 Bank', 'XP', 'BTG', 'Caixa', 'Banco do Brasil', 'Outros'];

const Transactions: React.FC<TransactionsProps> = ({ 
  data, installments = [], onAdd, onAddReceivable, onUpdate, onDelete, isPrivacyMode, currentDate 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense', amount: 0, category: 'Alimentação', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Pix'
  });
  
  // Estados Auxiliares de UI do Formulário
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [isCustomCard, setIsCustomCard] = useState(false);

  // Combinar Transações + Parcelas do Mês (Visualização Apenas)
  const combinedData = useMemo(() => {
    // Converter parcelas ativas em formato de transação para visualização
    const installmentTransactions: Transaction[] = installments.map(inst => ({
      id: `inst-${inst.id}`,
      type: 'expense',
      amount: inst.totalAmount / inst.totalInstallments,
      category: 'Parcelado',
      description: `${inst.description} (${inst.paidInstallments}/${inst.totalInstallments})`,
      date: currentDate.toISOString(), // Considera data atual para exibição no fluxo do mês
      paymentMethod: inst.paymentMethod,
      cardName: inst.cardName,
      relatedInstallmentId: inst.id,
      installmentCurrent: inst.paidInstallments,
      installmentTotal: inst.totalInstallments
    }));

    // Merge e ordenar por data
    return [...data, ...installmentTransactions].sort((a, b) => {
       const dateA = parseLocalDate(a.date).getTime();
       const dateB = parseLocalDate(b.date).getTime();
       return dateB - dateA; // Mais recentes primeiro
    });
  }, [data, installments, currentDate]);

  const filteredData = useMemo(() => {
    return combinedData.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.splitWith && t.splitWith.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.cardName && t.cardName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [combinedData, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount && formData.description) {
      
      const newTransaction: Transaction = { 
        ...formData as Transaction, 
        id: generateId(), 
        date: formData.date || new Date().toISOString() 
      };
      
      onAdd(newTransaction);

      // Lógica Automática: Criar "A Receber" se for compra para terceiro não paga
      if (showSplitOptions && formData.splitStatus === 'pending' && onAddReceivable && formData.splitWith) {
         if (window.confirm(`Deseja adicionar ${formatCurrency(Number(formData.amount), false)} em "A Receber" para ${formData.splitWith}?`)) {
             onAddReceivable({
                 id: generateId(),
                 debtorName: formData.splitWith,
                 description: `Ref: ${formData.description}`,
                 amount: Number(formData.amount),
                 date: formData.date || new Date().toISOString(),
                 status: 'pending'
             });
         }
      }

      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowSplitOptions(false);
    setIsCustomCategory(false);
    setIsCustomCard(false);
    setFormData({
        type: 'expense', amount: 0, category: 'Alimentação', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Pix'
    });
  };

  const handleRefund = (t: Transaction) => {
    if (window.confirm(`Confirmar estorno de ${t.description}?`)) {
        const refundTrans: Transaction = {
            id: generateId(),
            type: t.type === 'expense' ? 'income' : 'expense', // Inverte o tipo
            amount: t.amount,
            category: 'Estorno',
            description: `Estorno: ${t.description}`,
            date: new Date().toISOString(),
            paymentMethod: t.paymentMethod,
            cardName: t.cardName,
            isRefunded: true
        };
        onAdd(refundTrans);
        onUpdate({ ...t, isRefunded: true });
    }
  };

  const summary = useMemo(() => {
    const income = data.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = data.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    // Adiciona o custo das parcelas ao resumo de despesas visualizado
    const installmentsCost = installments.reduce((acc, i) => acc + (i.totalAmount / i.totalInstallments), 0);
    
    return { income, expense: expense + installmentsCost, balance: income - (expense + installmentsCost) };
  }, [data, installments]);

  return (
    <div className="space-y-6 md:space-y-8 pb-24">
      
      {/* 1. Top Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
         <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] p-8 rounded-[2.5rem] flex items-center gap-6 relative overflow-hidden group transition-colors duration-300 shadow-xl dark:shadow-none">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 shrink-0">
               <ArrowUpCircle size={32} />
            </div>
            <div>
               <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Entradas</p>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(summary.income, isPrivacyMode)}</h3>
            </div>
         </div>
         <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] p-8 rounded-[2.5rem] flex items-center gap-6 relative overflow-hidden group transition-colors duration-300 shadow-xl dark:shadow-none">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-500/10 shrink-0">
               <ArrowDownCircle size={32} />
            </div>
            <div>
               <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Saídas (+ Parcelas)</p>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(summary.expense, isPrivacyMode)}</h3>
            </div>
         </div>
         <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] p-8 rounded-[2.5rem] flex items-center justify-between relative overflow-hidden group md:col-span-1 transition-colors duration-300 shadow-xl dark:shadow-none">
             <div className="flex flex-col justify-center h-full">
               <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Saldo do Mês</p>
               <h3 className={`text-3xl font-black ${summary.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>{formatCurrency(summary.balance, isPrivacyMode)}</h3>
             </div>
             <button onClick={() => setIsModalOpen(true)} className="w-16 h-16 rounded-3xl bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center hover:scale-110 transition-transform shadow-glow shrink-0">
                <Plus size={28} />
             </button>
         </div>
      </div>

      {combinedData.length > 0 ? (
        <>
          {/* 2. Search */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-[450px] group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar lançamentos, categorias ou cartões..." 
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl pl-14 pr-6 py-4 text-base text-slate-900 dark:text-white focus:border-emerald-500/50 dark:focus:border-white/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm dark:shadow-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          {/* 3. DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[3rem] overflow-hidden shadow-xl dark:shadow-2xl">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.05]">
                    <tr>
                       <th className="px-10 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Descrição</th>
                       <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Detalhes</th>
                       <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Data</th>
                       <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500">Método / Cartão</th>
                       <th className="px-10 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-right">Valor</th>
                       <th className="px-8 py-7 text-xs uppercase font-bold tracking-widest text-slate-500 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                     {filteredData.map(t => (
                       <tr key={t.id} className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group ${t.isRefunded ? 'opacity-50 line-through decoration-slate-400' : ''}`}>
                          <td className="px-10 py-6">
                             <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${t.relatedInstallmentId ? 'bg-orange-500/10 border-orange-500/10 text-orange-600' : t.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
                                   {t.relatedInstallmentId ? <Receipt size={22} /> : t.type === 'income' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white text-base block">{t.description}</span>
                                    {t.isSplit && (
                                        <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold mt-1 uppercase">
                                            <Users size={12} />
                                            Dividido: {t.splitWith} ({t.splitStatus === 'paid' ? 'Pago' : 'Pendente'})
                                        </div>
                                    )}
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex flex-col gap-1 items-start">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 tracking-wide">{t.category}</span>
                                {t.giftRecipient && <span className="text-[10px] text-pink-500 flex gap-1 items-center"><Gift size={10} /> Para: {t.giftRecipient}</span>}
                                {t.transportApp && <span className="text-[10px] text-slate-500 flex gap-1 items-center"><Car size={10} /> {t.transportApp} {t.transportPayer && `(${t.transportPayer})`}</span>}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-base text-slate-500 font-medium">
                             {parseLocalDate(t.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-8 py-6 text-base text-slate-500">
                             <div className="flex flex-col">
                                <span>{t.paymentMethod || '-'}</span>
                                {t.cardName && <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1"><CreditCard size={10}/> {t.cardName}</span>}
                             </div>
                          </td>
                          <td className="px-10 py-6 text-right">
                             <span className={`font-bold text-lg ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                {t.type === 'expense' && '- '}{formatCurrency(t.amount, isPrivacyMode)}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             {!t.relatedInstallmentId && !t.isRefunded && (
                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleRefund(t)} className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all" title="Estornar">
                                        <Undo2 size={18} />
                                    </button>
                                    <button onClick={() => onDelete(t.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                             )}
                             {t.relatedInstallmentId && <span className="text-[10px] uppercase font-bold text-orange-500">Parcela</span>}
                          </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* 4. MOBILE CARD VIEW */}
          <div className="md:hidden space-y-4">
            {filteredData.map(t => (
              <div key={t.id} className={`bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 flex flex-col gap-4 group active:scale-[0.98] transition-all shadow-sm ${t.isRefunded ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${t.relatedInstallmentId ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' : t.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}>
                        {t.relatedInstallmentId ? <Receipt size={24} /> : t.type === 'income' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                     </div>
                     <div>
                        <span className={`font-bold text-slate-900 dark:text-white block text-base leading-tight ${t.isRefunded ? 'line-through' : ''}`}>{t.description}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">{t.category}</span>
                           {t.cardName && <span className="text-[10px] text-indigo-500 font-bold flex gap-1 items-center"><CreditCard size={10} /> {t.cardName}</span>}
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className={`font-black text-lg ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                       {t.type === 'expense' && '- '}{formatCurrency(t.amount, isPrivacyMode)}
                     </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Data</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{parseLocalDate(t.date).toLocaleDateString('pt-BR')}</span>
                   </div>
                   
                   {!t.relatedInstallmentId && !t.isRefunded && (
                       <div className="flex gap-2">
                           <button onClick={() => handleRefund(t)} className="p-2.5 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                              <Undo2 size={18} />
                           </button>
                           <button onClick={() => onDelete(t.id)} className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                              <Trash2 size={18} />
                           </button>
                       </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* 5. EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[3rem] animate-in fade-in duration-700">
           <div className="w-24 h-24 rounded-full bg-emerald-500/5 flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/10">
              <Receipt size={48} className="opacity-40" />
           </div>
           <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 text-center">Sem movimentações</h3>
           <p className="text-slate-500 text-center max-w-md mb-10 text-lg">
             Registre suas entradas, saídas e parcelas para ver o fluxo aqui.
           </p>
           <Button onClick={() => setIsModalOpen(true)} className="px-12 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-emerald-500 hover:text-black dark:hover:bg-emerald-500 transition-all text-lg">
              <Plus size={24} className="mr-3" /> Novo Lançamento
           </Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Novo Lançamento">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-[#050505] p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
              <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-white/10 text-red-500 dark:text-red-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Despesa</button>
              <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-black shadow-glow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Receita</button>
          </div>
          
          <Input label="Descrição" placeholder="Ex: Mercado, Freelance..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
          
          {/* Categoria Inteligente */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Categoria</label>
             {!isCustomCategory ? (
                 <select 
                    className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-emerald-500/50 outline-none transition-all appearance-none"
                    value={formData.category}
                    onChange={(e) => {
                        const val = e.target.value;
                        if(val === 'Outros') setIsCustomCategory(true);
                        setFormData({...formData, category: val});
                    }}
                 >
                    {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
             ) : (
                <div className="relative">
                    <input 
                        className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-emerald-500/50 outline-none"
                        placeholder="Digite a categoria..."
                        value={formData.category === 'Outros' ? '' : formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                    />
                    <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">Lista</button>
                </div>
             )}
          </div>

          {/* Campos Condicionais baseados na Categoria */}
          {formData.category === 'Presentes' && (
              <Input label="Para quem é o presente?" placeholder="Nome da pessoa" value={formData.giftRecipient || ''} onChange={(e) => setFormData({...formData, giftRecipient: e.target.value})} />
          )}

          {formData.category === 'Transporte' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <Input as="select" label="App/Meio" value={formData.transportApp || 'Uber'} onChange={(e) => setFormData({...formData, transportApp: e.target.value})}>
                      {TRANSPORT_APPS.map(app => <option key={app} value={app}>{app}</option>)}
                  </Input>
                  <Input label="Quem pediu/pagou?" placeholder="Ex: Eu, Empresa..." value={formData.transportPayer || ''} onChange={(e) => setFormData({...formData, transportPayer: e.target.value})} />
              </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <Input label="Valor" type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} required />
             <Input label="Data" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
          </div>

           {/* Pagamento e Cartão Específico */}
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Forma de Pagamento</label>
             <div className="grid grid-cols-2 gap-4">
                 <div className="relative group">
                    <select 
                        className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-emerald-500/50 outline-none transition-all appearance-none"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value, cardName: undefined})}
                    >
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
                 
                 {/* Se for Cartão, mostrar seleção de qual cartão */}
                 {(formData.paymentMethod === 'Cartão de Crédito' || formData.paymentMethod === 'Cartão de Débito') && (
                     <div className="animate-in slide-in-from-left-4 fade-in">
                         {!isCustomCard ? (
                             <select 
                                className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-indigo-500/50 outline-none transition-all appearance-none border-indigo-500/30"
                                value={formData.cardName || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if(val === 'Outros') setIsCustomCard(true);
                                    else setFormData({...formData, cardName: val});
                                }}
                             >
                                <option value="" disabled selected>Qual Cartão?</option>
                                {CARD_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                         ) : (
                             <div className="relative">
                                <input 
                                    className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-indigo-500/50 outline-none"
                                    placeholder="Nome do Cartão..."
                                    value={formData.cardName || ''}
                                    onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                                />
                                <button type="button" onClick={() => setIsCustomCard(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">Lista</button>
                             </div>
                         )}
                     </div>
                 )}
             </div>
          </div>


          {/* Opções de Terceiros / Divisão */}
          <div className="pt-2">
             <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => setShowSplitOptions(!showSplitOptions)}>
                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${showSplitOptions ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-white/20'}`}>
                     {showSplitOptions && <CheckCircle2 size={14} className="text-white" />}
                 </div>
                 <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Compra p/ Terceiro ou Dividida?</span>
             </div>

             {showSplitOptions && (
                 <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-2 border border-slate-200 dark:border-white/5">
                     <Input label="Nome da Pessoa" placeholder="Ex: João Silva" value={formData.splitWith || ''} onChange={(e) => setFormData({...formData, isSplit: true, splitWith: e.target.value})} />
                     <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Status do Pagamento</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setFormData({...formData, splitStatus: 'pending'})} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${formData.splitStatus !== 'paid' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'border-slate-200 dark:border-white/10 text-slate-400'}`}>Não Pago (Cobrar)</button>
                            <button type="button" onClick={() => setFormData({...formData, splitStatus: 'paid'})} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${formData.splitStatus === 'paid' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'border-slate-200 dark:border-white/10 text-slate-400'}`}>Já me pagou</button>
                        </div>
                     </div>
                     {formData.splitStatus === 'pending' && (
                         <p className="text-[10px] text-slate-500 flex gap-1 items-center bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-100 dark:border-yellow-500/10">
                             <AlertCircle size={12} />
                             Será sugerido criar uma entrada em "A Receber".
                         </p>
                     )}
                 </div>
             )}
          </div>

          <Button type="submit" className="w-full py-4 bg-emerald-500 text-black font-black text-lg shadow-glow mt-2">Salvar Lançamento</Button>
        </form>
      </Modal>
    </div>
  );
};

// Ícone auxiliar faltante
const CheckCircle2 = ({size, className}: {size:number, className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
)

export default Transactions;