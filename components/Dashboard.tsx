import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Wallet, Receipt, Sparkles, TrendingUp, History, Users, CreditCard, 
  ArrowUpRight, ArrowDownRight, Zap, TrendingDown, Scale, Activity,
  ArrowRight
} from 'lucide-react';
import { Card } from './ui/UIComponents';
import { Transaction, Investment, ActivityItem, Receivable, Installment, Subscription } from '../types';
import { formatCurrency, parseLocalDate } from '../utils';

interface DashboardProps {
  transactions: Transaction[]; 
  allTransactions?: Transaction[]; 
  subscriptions: Subscription[];
  installments: (Installment & { paidInstallments: number })[];
  investments: Investment[];
  receivables?: Receivable[];
  monthlyFixedCost: number; 
  isPrivacyMode: boolean;
  activityLog: ActivityItem[];
  currentDate: Date;
  theme: 'dark' | 'light';
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, allTransactions = [], subscriptions, installments, investments, receivables = [],
  monthlyFixedCost, isPrivacyMode, activityLog, currentDate, theme
}) => {
  
  const variableIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const variableExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const totalIncome = variableIncome;
  const totalExpense = variableExpense + monthlyFixedCost; 
  const currentBalance = totalIncome - totalExpense;
  const totalInvested = investments.reduce((acc, curr) => acc + curr.currentValue, 0);
  const pendingReceivables = receivables.filter(r => r.status === 'pending');
  const totalReceivable = pendingReceivables.reduce((acc, curr) => acc + curr.amount, 0);

  // 1. Histórico Multidimensional (Últimos 6 meses)
  const historyData = useMemo(() => {
     const data: Record<string, { month: string, income: number, expense: number, investment: number, withdrawal: number, balance: number, timestamp: number }> = {};
     
     allTransactions.forEach(t => {
        const date = parseLocalDate(t.date);
        const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
        if (!data[key]) data[key] = { month: date.toLocaleString('pt-BR', { month: 'short' }), income: 0, expense: 0, investment: 0, withdrawal: 0, balance: 0, timestamp: date.getTime() };
        if (t.type === 'income') data[key].income += t.amount;
        if (t.type === 'expense') data[key].expense += t.amount;
     });

     investments.forEach(inv => {
        inv.history.forEach(h => {
           const date = parseLocalDate(h.date);
           const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
           if (!data[key]) data[key] = { month: date.toLocaleString('pt-BR', { month: 'short' }), income: 0, expense: 0, investment: 0, withdrawal: 0, balance: 0, timestamp: date.getTime() };
           if (h.type === 'deposit') data[key].investment += h.amount;
           if (h.type === 'withdrawal') data[key].withdrawal += h.amount;
        });
     });

     return Object.keys(data).sort().slice(-6).map(key => ({
        ...data[key],
        balance: data[key].income - data[key].expense - data[key].investment + data[key].withdrawal
     }));
  }, [allTransactions, investments]);

  // 2. Cálculo de Insights de Comparação (Mês Atual vs Anterior)
  const comparison = useMemo(() => {
    if (historyData.length < 2) return null;
    const current = historyData[historyData.length - 1];
    const prev = historyData[historyData.length - 2];

    const getDiff = (curr: number, old: number) => {
        if (old === 0) return { val: 0, pct: 0 };
        const diff = curr - old;
        const pct = (diff / old) * 100;
        return { val: diff, pct };
    };

    return {
        expense: getDiff(current.expense, prev.expense),
        income: getDiff(current.income, prev.income),
        investment: getDiff(current.investment, prev.investment),
        withdrawal: current.withdrawal
    };
  }, [historyData]);

  // 3. Gráfico de Pizza (Categorias)
  const pieData = useMemo(() => {
    const stats: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
       const cat = t.category || 'Outros';
       stats[cat] = (stats[cat] || 0) + t.amount;
    });
    subscriptions.forEach(s => {
       const cat = s.category || 'Assinaturas';
       stats[cat] = (stats[cat] || 0) + s.amount;
    });
    if (installments.length > 0) {
        const total = installments.reduce((acc, i) => acc + (i.totalAmount / i.totalInstallments), 0);
        stats['Parcelados'] = (stats['Parcelados'] || 0) + total;
    }
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions, subscriptions, installments]);

  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#050505', border: '1px solid #333', borderRadius: '12px', color: '#fff' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };

  return (
    <div className="space-y-8 pb-24">
      
      {/* 0. WELCOME HERO */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 p-8 md:p-12 shadow-xl dark:shadow-2xl transition-colors duration-300">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
               <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-widest text-[10px] uppercase">Dashboard OnFlow • {currentDate.toLocaleString('pt-BR', { month: 'long' })}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Resumo Executivo</h1>
            <p className="text-slate-500 font-medium max-w-md">Controle absoluto sobre seu capital, histórico e projeções.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-100 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 p-5 rounded-3xl min-w-[140px]">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Saldo</p>
                <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(currentBalance, isPrivacyMode)}</span>
             </div>
             <div className="bg-slate-100 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 p-5 rounded-3xl min-w-[140px]">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">A Receber</p>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">{formatCurrency(totalReceivable, isPrivacyMode)}</span>
             </div>
          </div>
        </div>
      </div>

      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Entradas', value: totalIncome, color: 'text-emerald-600 dark:text-emerald-400', icon: ArrowUpRight, trend: comparison?.income.pct },
           { label: 'Gastos', value: totalExpense, color: 'text-red-600 dark:text-red-400', icon: ArrowDownRight, trend: comparison?.expense.pct },
           { label: 'Investido', value: totalInvested, color: 'text-blue-600 dark:text-blue-400', icon: TrendingUp, trend: comparison?.investment.pct },
           { label: 'A Receber', value: totalReceivable, color: 'text-purple-600 dark:text-purple-400', icon: Users, trend: 0 },
         ].map((kpi, idx) => (
           <div key={idx} className="bg-white/70 dark:bg-[#0f0f0f]/60 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2rem] p-6 group transition-all duration-300 hover:shadow-lg dark:hover:shadow-none">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon size={20} />
                </div>
                {kpi.trend !== undefined && kpi.trend !== 0 && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${kpi.trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                    {kpi.trend > 0 ? '+' : ''}{kpi.trend.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(kpi.value, isPrivacyMode)}</h3>
           </div>
         ))}
      </div>

      {/* 2. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribuição por Categoria */}
        <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-8 min-h-[400px]">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Categorias de Gastos</h3>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                       {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" formatter={(val) => <span className="text-slate-600 dark:text-slate-300 font-medium ml-1">{val}</span>} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Histórico Comparativo */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fluxo dos Últimos Meses</h3>
              <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Ganhos</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Gastos</div>
              </div>
           </div>
           <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={historyData} barSize={12} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#222" : "#e2e8f0"} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#666' : '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#666' : '#94a3b8', fontSize: 10 }} />
                    <RechartsTooltip cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} contentStyle={tooltipStyle} />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="investment" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* 3. NOVO: RELATÓRIO COMPARATIVO E TENDÊNCIA PATRIMONIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Card de Análise Dinâmica */}
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-black border border-indigo-100 dark:border-indigo-500/20 rounded-[2.5rem] p-8 flex flex-col justify-between">
              <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-glow">
                      <Scale size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 leading-tight">Relatório de Evolução</h3>
                  <div className="space-y-4">
                      {comparison && (
                          <>
                              <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-indigo-100 dark:border-white/5">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Diferença de Gastos</p>
                                  <div className="flex items-center gap-2">
                                      <span className={`text-lg font-black ${comparison.expense.val > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                          {formatCurrency(Math.abs(comparison.expense.val), isPrivacyMode)}
                                      </span>
                                      {comparison.expense.val > 0 ? <TrendingUp size={16} className="text-red-500 dark:text-red-400" /> : <TrendingDown size={16} className="text-emerald-500 dark:text-emerald-400" />}
                                  </div>
                                  <p className="text-[10px] text-slate-600 mt-1 italic">Comparado ao mês anterior</p>
                              </div>

                              <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-indigo-100 dark:border-white/5">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Aporte em Investimentos</p>
                                  <div className="flex items-center gap-2">
                                      <span className={`text-lg font-black ${comparison.investment.val >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`}>
                                          {formatCurrency(Math.abs(comparison.investment.val), isPrivacyMode)}
                                      </span>
                                      {comparison.investment.val >= 0 ? <TrendingUp size={16} className="text-blue-500 dark:text-blue-400" /> : <TrendingDown size={16} className="text-orange-500 dark:text-orange-400" />}
                                  </div>
                                  <p className="text-[10px] text-slate-600 mt-1 italic">
                                      {comparison.investment.val >= 0 ? 'Você investiu mais este mês!' : 'Seu aporte reduziu.'}
                                  </p>
                              </div>
                          </>
                      )}
                      {(!comparison || historyData.length < 2) && (
                          <p className="text-sm text-slate-500 italic py-10">Aguardando mais meses de histórico para análise comparativa...</p>
                      )}
                  </div>
              </div>
              <div className="mt-8 pt-6 border-t border-indigo-100 dark:border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">OnFlow Intelligent Report</span>
              </div>
          </div>

          {/* Gráfico de Tendência (Liquidez e Patrimônio) */}
          <div className="lg:col-span-3 bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-8">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evolução da Saúde Financeira</h3>
                   <p className="text-xs text-slate-500">Monitoramento de acúmulo e retiradas ao longo do tempo</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-2 rounded-2xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-300 dark:border-white/10">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Aportes</span>
                    </div>
                    <div className="flex items-center gap-2 px-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Saldo Final</span>
                    </div>
                </div>
             </div>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ left: -20 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#222" : "#e2e8f0"} vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#666' : '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#666' : '#94a3b8', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="investment" name="Investido" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInvest)" />
                        <Area type="monotone" dataKey="balance" name="Saldo Líquido" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
             
             {/* Rodapé Descritivo do Gráfico */}
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-700 dark:text-white">
                        <Activity size={20} />
                    </div>
                    <p>
                        A linha <span className="text-emerald-600 dark:text-emerald-400 font-bold">verde</span> representa sua liquidez mensal. Se ela sobe enquanto a <span className="text-blue-600 dark:text-blue-400 font-bold">azul</span> também sobe, você está gerando riqueza real e sustentável.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-700 dark:text-white">
                        <History size={20} />
                    </div>
                    <p>
                        Retiradas identificadas aparecerão como quedas na área azul. Mantenha os aportes constantes para garantir que sua curva de longo prazo seja ascendente.
                    </p>
                </div>
             </div>
          </div>
      </div>

      {/* 4. ATIVIDADE RECENTE E MÉTODOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-8 min-h-[300px]">
             <div className="flex items-center gap-2 mb-6">
                 <CreditCard size={18} className="text-slate-900 dark:text-white" />
                 <h3 className="font-bold text-slate-900 dark:text-white text-sm">Uso de Métodos</h3>
             </div>
             <div className="space-y-4">
                <p className="text-xs text-slate-500 italic">Analise aqui quais cartões ou bancos estão concentrando suas despesas.</p>
             </div>
         </div>

         <div className="bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] p-8 min-h-[300px]">
             <div className="flex items-center gap-2 mb-6">
                 <History size={18} className="text-slate-900 dark:text-white" />
                 <h3 className="text-slate-900 dark:text-white font-bold text-sm">Histórico OnFlow</h3>
             </div>
             <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                {activityLog.map((item) => (
                    <div key={item.id} className="flex gap-4 items-start border-l border-slate-200 dark:border-white/5 pl-4 ml-1">
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-300"><span className="font-bold text-slate-800 dark:text-white">{item.entity}</span> {item.description}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
