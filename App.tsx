import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, ArrowRightLeft, CalendarClock, Target, 
  TrendingUp, CreditCard, Eye, EyeOff, ChevronLeft, ChevronRight,
  Bot, Sparkles, LogOut, Sun, Moon, User as UserIcon
} from 'lucide-react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query } from "firebase/firestore";
import { auth, db } from "./firebase";
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Subscriptions from './components/Subscriptions';
import Goals from './components/Goals';
import Investments from './components/Investments';
import Installments from './components/Installments';
import { LandingPage } from './components/LandingPage';
import { GeminiChat } from './components/GeminiChat';
import { ProfileModal } from './components/ProfileModal';
import { ViewState, Transaction, Subscription, Goal, Investment, Installment, ActivityItem, Receivable, User } from './types';
import { isSameMonth, addMonths, formatMonthYear, generateId, parseLocalDate } from './utils';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // App States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Firebase Auth & Firestore Sync Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setIsLoadingData(true);
        const docRef = doc(db, "users", currentUser.uid);
        try {
            const docSnap = await getDoc(docRef);
            let userData: User;
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                userData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: data.displayName || currentUser.displayName,
                    photoURL: data.photoURL || currentUser.photoURL,
                    createdAt: data.createdAt
                };
            } else {
                userData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    createdAt: new Date().toISOString()
                };
                await setDoc(docRef, userData);
            }
            setUser(userData);
            await fetchAllUserData(currentUser.uid);
        } catch (error) {
            console.error("Erro ao sincronizar usuário:", error);
            setUser({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL
            });
        } finally {
            setIsLoadingData(false);
        }
      } else {
        setUser(null);
        resetStates();
      }
    });

    return () => unsubscribe();
  }, []);

  const resetStates = () => {
    setTransactions([]);
    setSubscriptions([]);
    setGoals([]);
    setInvestments([]);
    setInstallments([]);
    setReceivables([]);
    setActivityLog([]);
  };

  const fetchAllUserData = async (uid: string) => {
    const collections = ['transactions', 'subscriptions', 'goals', 'investments', 'installments', 'receivables'];
    
    for (const colName of collections) {
      const q = query(collection(db, "users", uid, colName));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ ...doc.data() } as any));
      
      if (colName === 'transactions') setTransactions(data);
      if (colName === 'subscriptions') setSubscriptions(data);
      if (colName === 'goals') setGoals(data);
      if (colName === 'investments') setInvestments(data);
      if (colName === 'installments') setInstallments(data);
      if (colName === 'receivables') setReceivables(data);
    }
  };

  // Helper to persist in Firestore
  const persist = async (col: string, item: any, isDelete = false) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, col, item.id);
    if (isDelete) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, item);
    }
  };

  // Theme Management
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Filtered Data by Current Month
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => isSameMonth(parseLocalDate(t.date), currentDate));
  }, [transactions, currentDate]);

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
       const start = parseLocalDate(sub.startDate);
       const compStart = new Date(start.getFullYear(), start.getMonth(), 1);
       const compCurrent = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
       return compCurrent >= compStart;
    });
  }, [subscriptions, currentDate]);

  const activeInstallments = useMemo(() => {
    return installments.map(inst => {
       const start = parseLocalDate(inst.startDate);
       const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
       const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
       const endMonth = new Date(start.getFullYear(), start.getMonth() + inst.totalInstallments, 1);

       if (current >= startMonth && current < endMonth) {
          const monthsDiff = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth());
          return { ...inst, paidInstallments: monthsDiff + 1 };
       }
       return null;
    }).filter(Boolean) as (Installment & { paidInstallments: number })[];
  }, [installments, currentDate]);

  const currentMonthGoals = useMemo(() => {
    return goals.filter(g => isSameMonth(parseLocalDate(g.startDate), currentDate));
  }, [goals, currentDate]);

  const totalIncome = useMemo(() => currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [currentMonthTransactions]);
  const variableExpense = useMemo(() => currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [currentMonthTransactions]);
  const fixedExpense = useMemo(() => {
    const subsTotal = activeSubscriptions.reduce((acc, sub) => acc + sub.amount, 0);
    const instTotal = activeInstallments.reduce((acc, inst) => acc + (inst.totalAmount / inst.totalInstallments), 0);
    return subsTotal + instTotal;
  }, [activeSubscriptions, activeInstallments]);

  const totalExpense = variableExpense + fixedExpense;

  // IA Handlers (Modified for Persistence)
  const addActionLog = (entity: string, desc: string, action: ActivityItem['action'] = 'create') => {
    setActivityLog(prev => [{
      id: generateId(),
      entity,
      description: desc,
      action,
      timestamp: new Date().toISOString()
    }, ...prev].slice(0, 10));
  };

  const aiHandlers = {
    addTransaction: (t: Omit<Transaction, 'id'>) => {
      const newT = { ...t, id: generateId() };
      setTransactions(prev => [newT, ...prev]);
      persist('transactions', newT);
      addActionLog('Transação', `IA criou: ${t.description}`);
      return "OK: Transação criada com sucesso.";
    },
    deleteTransaction: (id: string) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      persist('transactions', { id }, true);
      addActionLog('Transação', `IA removeu uma transação`, 'delete');
      return "OK: Transação removida.";
    },
    addGoal: (g: Omit<Goal, 'id'>) => {
      const newG = { ...g, id: generateId(), startDate: currentDate.toISOString().split('T')[0] };
      setGoals(prev => [newG, ...prev]);
      persist('goals', newG);
      addActionLog('Meta', `IA criou: ${g.name}`);
      return "OK: Meta criada com sucesso.";
    },
    deleteGoal: (id: string) => {
      setGoals(prev => prev.filter(g => g.id !== id));
      persist('goals', { id }, true);
      addActionLog('Meta', `IA removeu uma meta`, 'delete');
      return "OK: Meta removida.";
    },
    addSubscription: (s: Omit<Subscription, 'id'>) => {
      const newS = { ...s, id: generateId(), startDate: currentDate.toISOString().split('T')[0] };
      setSubscriptions(prev => [newS, ...prev]);
      persist('subscriptions', newS);
      addActionLog('Assinatura', `IA criou: ${s.name}`);
      return "OK: Assinatura criada com sucesso.";
    }
  };

  const handleLogout = async () => {
      await signOut(auth);
  };

  const handlePrevMonth = () => setCurrentDate(prev => addMonths(prev, -1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Fluxo', icon: ArrowRightLeft },
    { id: 'subscriptions', label: 'Assinaturas', icon: CalendarClock },
    { id: 'installments', label: 'Parcelas', icon: CreditCard },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'investments', label: 'Investir', icon: TrendingUp },
  ];

  const renderContent = () => {
    if (isLoadingData) {
      return (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse">
           <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando seus dados...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
          transactions={currentMonthTransactions}
          allTransactions={transactions}
          subscriptions={activeSubscriptions} 
          installments={activeInstallments} 
          investments={investments} 
          receivables={receivables}
          monthlyFixedCost={fixedExpense} 
          isPrivacyMode={isPrivacyMode} 
          activityLog={activityLog} 
          currentDate={currentDate} 
          theme={theme}
        />;
      case 'transactions':
        return <Transactions 
          data={currentMonthTransactions} 
          installments={activeInstallments} 
          onAdd={(t) => { setTransactions([t, ...transactions]); persist('transactions', t); }} 
          onAddReceivable={(r) => { setReceivables([r, ...receivables]); persist('receivables', r); }}
          onUpdate={(u) => { setTransactions(transactions.map(t => t.id === u.id ? u : t)); persist('transactions', u); }} 
          onDelete={(id) => { setTransactions(transactions.filter(t => t.id !== id)); persist('transactions', { id }, true); }} 
          isPrivacyMode={isPrivacyMode} 
          currentDate={currentDate} 
        />;
      case 'subscriptions':
        return <Subscriptions subscriptions={subscriptions} onAdd={(s) => { setSubscriptions([...subscriptions, s]); persist('subscriptions', s); }} onUpdate={(u) => { setSubscriptions(subscriptions.map(s => s.id === u.id ? u : s)); persist('subscriptions', u); }} onDelete={(id) => { setSubscriptions(subscriptions.filter(s => s.id !== id)); persist('subscriptions', { id }, true); }} isPrivacyMode={isPrivacyMode} currentDate={currentDate} />;
      case 'investments':
        return <Investments 
          investments={investments} 
          onAdd={(i) => { setInvestments([...investments, i]); persist('investments', i); }} 
          onUpdate={(u) => { setInvestments(investments.map(i => i.id === u.id ? u : i)); persist('investments', u); }} 
          onDelete={(id) => {
             const inv = investments.find(i => i.id === id);
             setInvestments(prev => prev.filter(i => i.id !== id));
             persist('investments', { id }, true);
             if(inv) addActionLog('Investimento', `Removido: ${inv.name}`, 'delete');
          }} 
          isPrivacyMode={isPrivacyMode} 
          currentDate={currentDate} 
        />;
      case 'goals':
        return <Goals goals={currentMonthGoals} onAdd={(g) => { setGoals([...goals, g]); persist('goals', g); }} onUpdate={(u) => { setGoals(goals.map(g => g.id === u.id ? u : g)); persist('goals', u); }} onDelete={(id) => { setGoals(goals.filter(g => g.id !== id)); persist('goals', { id }, true); }} isPrivacyMode={isPrivacyMode} currentDate={currentDate} />;
      case 'installments':
        return <Installments 
          installments={activeInstallments} 
          onAdd={(i) => { setInstallments([...installments, i]); persist('installments', i); }} 
          onAddTransaction={(t) => { setTransactions([t, ...transactions]); persist('transactions', t); }}
          onDelete={(id) => { setInstallments(installments.filter(i => i.id !== id)); persist('installments', { id }, true); }} 
          isPrivacyMode={isPrivacyMode} 
          currentDate={currentDate} 
        />;
      default: return null;
    }
  };

  // Contexto Gemini (simplificado para economia de tokens)
  const geminiContext = useMemo(() => ({
    resumo: { receita: totalIncome, despesa: totalExpense, saldo: totalIncome - totalExpense },
    metas: currentMonthGoals.map(g => ({ nome: g.name, alvo: g.targetAmount, atual: g.currentAmount }))
  }), [totalIncome, totalExpense, currentMonthGoals]);

  if (!user) {
    return <LandingPage onLogin={() => {}} onToggleTheme={toggleTheme} theme={theme} />;
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-black selection:bg-emerald-500/30 overflow-x-hidden transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none bg-slate-50 dark:bg-black">
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 w-full">
          <div className="w-full h-full p-6 pb-40 md:p-8 md:pb-48">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsProfileOpen(true)} className="group relative">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-white/10 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden border border-slate-300 dark:border-white/10 shadow-sm transition-transform group-hover:scale-105">
                      {user.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-slate-500 dark:text-slate-400" />}
                    </div>
                 </button>
                 <div>
                    <h1 className="text-2xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">{navItems.find(n => n.id === currentView)?.label}</h1>
                    <p className="text-slate-500 text-xs md:text-sm mt-1">{user.displayName || user.email}</p>
                 </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex-1 md:flex-none flex items-center gap-2 bg-white/70 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] p-1.5 rounded-2xl">
                   <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><ChevronLeft size={16} /></button>
                   <span className="min-w-[120px] text-center font-bold text-slate-900 dark:text-white capitalize text-sm">{formatMonthYear(currentDate)}</span>
                   <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
            {renderContent()}
          </div>
        </main>
        
        <GeminiChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} contextData={geminiContext} onAddGoal={aiHandlers.addGoal} onDeleteGoal={aiHandlers.deleteGoal} onAddTransaction={aiHandlers.addTransaction} onDeleteTransaction={aiHandlers.deleteTransaction} onAddSubscription={aiHandlers.addSubscription} />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} onUpdateUser={(updatedUser) => setUser(updatedUser)} />
        
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] md:w-auto md:min-w-[550px] max-w-4xl">
          <div className="bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-full shadow-2xl p-2 px-4 flex justify-between md:justify-center items-center gap-1 md:gap-3 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
               const Icon = item.icon;
               const isActive = currentView === item.id;
               return (
                 <button key={item.id} onClick={() => setCurrentView(item.id as ViewState)} className={`p-3.5 md:p-4 rounded-full transition-all relative shrink-0 ${isActive ? 'bg-emerald-500 text-black scale-110 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`} title={item.label}>
                   <Icon size={20} />
                 </button>
               )
            })}
            <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-2 md:mx-4 shrink-0"></div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-3.5 md:p-4 rounded-full transition-all ${isChatOpen ? 'bg-purple-500 text-white' : 'text-purple-500 dark:text-purple-400'}`} title="IA Assistant"><Bot size={20}/></button>
                <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="p-3.5 md:p-4 rounded-full transition-all text-slate-500 dark:text-slate-400" title="Privacidade">{isPrivacyMode ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                <button onClick={toggleTheme} className="p-3.5 md:p-4 rounded-full transition-all text-amber-500" title="Tema">{theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button>
                <button onClick={handleLogout} className="p-3.5 md:p-4 rounded-full transition-all text-red-500" title="Sair"><LogOut size={20}/></button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default App;