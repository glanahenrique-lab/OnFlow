import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Wallet, ArrowUpRight, LayoutGrid, CheckCircle2, Calendar, History, TrendingUp, BarChart4 } from 'lucide-react';
import { Button, Input, Modal } from './ui/UIComponents';
import { Investment, InvestmentTransaction } from '../types';
import { formatCurrency, generateId, isSameMonth, parseLocalDate } from '../utils';

interface InvestmentsProps {
  investments: Investment[];
  onAdd: (i: Investment) => void;
  onUpdate: (i: Investment) => void;
  onDelete: (id: string) => void;
  isPrivacyMode: boolean;
  currentDate: Date;
}

const Investments: React.FC<InvestmentsProps> = ({ investments, onAdd, onUpdate, onDelete, isPrivacyMode, currentDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('new');

  const [formData, setFormData] = useState({
    name: '',
    type: 'Stock' as Investment['type'],
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // 1. Filtrar APORTES EXCLUSIVOS do mês selecionado
  const monthlyContributions = useMemo(() => {
    const items: { assetId: string, assetName: string, transaction: InvestmentTransaction, type: Investment['type'] }[] = [];
    investments.forEach(inv => {
      inv.history.forEach(h => {
        if (isSameMonth(new Date(h.date), currentDate)) {
          items.push({ assetId: inv.id, assetName: inv.name, transaction: h, type: inv.type });
        }
      });
    });
    return items.sort((a, b) => new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime());
  }, [investments, currentDate]);

  // 2. Patrimônio Consolidado (Soma total de todos os tempos)
  const consolidatedPortfolio = useMemo(() => {
    return investments.map(inv => {
      const totalInvested = inv.history.reduce((acc, h) => acc + h.amount, 0);
      return { ...inv, totalInvested };
    }).filter(inv => inv.totalInvested > 0);
  }, [investments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;

    const newTx: InvestmentTransaction = {
      id: generateId(),
      date: formData.date || new Date().toISOString(),
      type: 'deposit',
      amount: Number(formData.amount)
    };

    if (selectedAssetId === 'new') {
      onAdd({
        id: generateId(),
        name: formData.name || 'Novo Ativo',
        type: formData.type,
        investedAmount: Number(formData.amount),
        currentValue: Number(formData.amount),
        lastUpdated: new Date().toISOString(),
        history: [newTx]
      });
    } else {
      const existing = investments.find(inv => inv.id === selectedAssetId);
      if (existing) {
        onUpdate({
          ...existing,
          history: [...existing.history, newTx],
          investedAmount: existing.investedAmount + Number(formData.amount),
          currentValue: existing.currentValue + Number(formData.amount),
          lastUpdated: new Date().toISOString()
        });
      }
    }

    setIsModalOpen(false);
    setFormData({ name: '', type: 'Stock', amount: 0, date: new Date().toISOString().split('T')[0] });
    setSelectedAssetId('new');
  };

  const handleDeleteContribution = (assetId: string, transactionId: string) => {
    const asset = investments.find(inv => inv.id === assetId);
    if (!asset) return;

    const txToRemove = asset.history.find(h => h.id === transactionId);
    if (!txToRemove) return;

    const newHistory = asset.history.filter(h => h.id !== transactionId);
    
    // Se o histórico ficar vazio, talvez queira remover o ativo ou manter com saldo zero
    onUpdate({
      ...asset,
      history: newHistory,
      investedAmount: asset.investedAmount - txToRemove.amount,
      currentValue: asset.currentValue - txToRemove.amount, // Ajuste simplificado
      lastUpdated: new Date().toISOString()
    });
  };

  const handleDeleteAsset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  const totalInvested = investments.reduce((acc, curr) => acc + curr.investedAmount, 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-24">
      {/* 1. Top Summary Card */}
      <div className="bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-start md:items-center justify-between shadow-xl gap-6 relative overflow-hidden transition-colors duration-300">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <TrendingUp size={20} />
                </div>
                <span className="text-blue-600 dark:text-blue-300 font-bold uppercase tracking-widest text-xs">Patrimônio Investido</span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalInvested, isPrivacyMode)}</h3>
            <p className="text-slate-500 text-base mt-2">{consolidatedPortfolio.length} ativos em carteira</p>
         </div>
         <button onClick={() => setIsModalOpen(true)} className="relative z-10 w-full md:w-auto px-10 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white transition-all flex items-center justify-center gap-3 shadow-glow text-lg">
             <Plus size={24} />
             <span>Novo Aporte</span>
         </button>
      </div>

      {investments.length > 0 ? (
        <>
            {/* Aportes do Mês */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                    <Calendar size={20} className="text-emerald-500" />
                    <h3 className="text-slate-900 dark:text-white font-bold text-xl">Aportes de {currentDate.toLocaleString('pt-BR', { month: 'long' })}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monthlyContributions.length > 0 ? monthlyContributions.map((item) => (
                    <div key={item.transaction.id} className="bg-white/60 dark:bg-[#0f0f0f]/60 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] p-6 rounded-[2rem] flex justify-between items-center group hover:shadow-lg dark:hover:bg-[#0f0f0f] dark:hover:border-white/10 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/10 text-lg">
                            {item.assetName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                            <span className="text-slate-900 dark:text-white font-bold block text-lg leading-tight">{item.assetName}</span>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">{item.type}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xl">{formatCurrency(item.transaction.amount, isPrivacyMode)}</span>
                            <button 
                            onClick={() => handleDeleteContribution(item.assetId, item.transaction.id)}
                            className="p-3 text-slate-500 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                            title="Excluir este aporte"
                            >
                            <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                    )) : (
                    <div className="md:col-span-3 py-16 border border-dashed border-slate-300 dark:border-white/5 rounded-[2rem] text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-600">
                        <History size={28} className="mb-3 opacity-20" />
                        <p className="text-base">Nenhum aporte registrado para este mês.</p>
                    </div>
                    )}
                </div>
            </div>

            {/* Carteira Consolidada */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                    <LayoutGrid size={20} className="text-slate-400" />
                    <h3 className="text-slate-900 dark:text-white font-bold text-xl">Carteira Consolidada</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {consolidatedPortfolio.length > 0 ? consolidatedPortfolio.map(inv => (
                    <div key={inv.id} className="bg-white/60 dark:bg-[#0f0f0f]/60 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] p-8 rounded-[2.5rem] flex flex-col justify-between group hover:shadow-lg dark:hover:bg-[#0f0f0f] dark:hover:border-white/10 transition-all min-h-[180px]">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-300 font-black border border-slate-200 dark:border-white/5 text-lg">
                                {inv.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                <span className="text-slate-900 dark:text-slate-200 font-bold block text-xl">{inv.name}</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ativo</span>
                                </div>
                                </div>
                            </div>
                            <button 
                            onClick={(e) => handleDeleteAsset(e, inv.id)}
                            className="p-3 text-slate-500 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="Excluir ativo e todo histórico"
                            >
                            <Trash2 size={20} />
                            </button>
                        </div>
                        
                        <div className="mt-8">
                            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter mb-1">Total Acumulado</p>
                            <span className="text-slate-900 dark:text-white font-black text-3xl">{formatCurrency(inv.totalInvested, isPrivacyMode)}</span>
                        </div>
                    </div>
                    )) : (
                        <div className="md:col-span-4 text-center py-10 text-slate-600 text-sm italic">
                            Carteira vazia.
                        </div>
                    )}
                </div>
            </div>
        </>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-[3rem] animate-in fade-in duration-700">
           <div className="w-24 h-24 rounded-full bg-blue-500/5 flex items-center justify-center text-blue-500 mb-8 border border-blue-500/10">
              <BarChart4 size={48} className="opacity-40" />
           </div>
           <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Carteira de investimentos vazia</h3>
           <p className="text-slate-500 text-center max-w-md mb-10 text-lg">
             Planeje seu futuro multiplicando seu patrimônio. Cada mês no OnFlow pode ter seus novos aportes.
           </p>
           <Button onClick={() => setIsModalOpen(true)} className="px-12 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-black font-black hover:bg-blue-500 dark:hover:bg-blue-500 hover:text-white transition-all text-lg">
              <Plus size={24} className="mr-3" /> Começar a Investir
           </Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Aporte">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Origem do Ativo</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-black p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
               <button type="button" onClick={() => setSelectedAssetId('new')} className={`py-3 rounded-xl text-xs font-bold transition-all ${selectedAssetId === 'new' ? 'bg-white dark:bg-white text-slate-900 dark:text-black' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Novo</button>
               <button type="button" onClick={() => setSelectedAssetId(investments[0]?.id || 'new')} className={`py-3 rounded-xl text-xs font-bold transition-all ${selectedAssetId !== 'new' ? 'bg-white dark:bg-white text-slate-900 dark:text-black' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`} disabled={investments.length === 0}>Existente</button>
            </div>
          </div>

          {selectedAssetId === 'new' ? (
            <div className="space-y-4">
              <Input label="Nome (ex: PETR4, BTC)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <Input as="select" label="Tipo de Ativo" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})}>
                <option value="Stock">Ações / BDRs</option>
                <option value="Crypto">Criptomoedas</option>
                <option value="Fixed Income">Renda Fixa / Tesouro</option>
                <option value="Fund">Fundos de Investimento</option>
              </Input>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Selecionar Ativo para Recompra</label>
              <select className="w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-emerald-500 outline-none transition-all" value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}>
                {investments.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.type})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor do Aporte" type="number" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} required />
            <Input label="Data da Operação" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
          </div>
          <Button type="submit" className="w-full py-4 bg-emerald-500 text-black font-black text-lg shadow-glow">Confirmar Investimento</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Investments;