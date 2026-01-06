import React, { useState, useEffect } from 'react';
import { 
  Zap, Shield, TrendingUp, Sparkles, Check, ArrowRight, 
  LayoutDashboard, Target, CalendarClock, Lock, User as UserIcon, Star, Loader2, Mail, Link as LinkIcon, CheckCircle2, KeyRound, MailCheck, AlertCircle, ShieldAlert
} from 'lucide-react';
import { User } from '../types';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  AuthError 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

interface LandingPageProps {
  onLogin: (user: User) => void; 
  onToggleTheme?: () => void;
  theme?: 'dark' | 'light';
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onToggleTheme, theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration States
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Email Verification State
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationEmailAddr, setVerificationEmailAddr] = useState('');
  const [showUnverifiedScreen, setShowUnverifiedScreen] = useState(false);

  // Password Reset State
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);

  // Verificar se já existe um usuário logado (mas bloqueado pelo App.tsx por falta de verificação)
  useEffect(() => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
        setVerificationEmailAddr(auth.currentUser.email || '');
        setShowUnverifiedScreen(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Fluxo de Registro
        if (password !== confirmPassword) {
            setErrorMsg('As senhas não coincidem.');
            setIsLoading(false);
            return;
        }

        // 1. Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Definir URL da foto e atualizar perfil Auth
        const finalPhotoUrl = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`;
        
        await updateProfile(user, {
            displayName: name,
            photoURL: finalPhotoUrl
        });

        // 3. Salvar no Firestore (/users/{uid})
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: name,
                email: email,
                photoURL: finalPhotoUrl,
                createdAt: new Date().toISOString()
            });
        } catch (dbError) {
            console.error("Erro ao salvar no Firestore:", dbError);
            // Não bloqueamos o fluxo se o banco falhar, mas logamos
        }

        // 4. Enviar e-mail de verificação
        await sendEmailVerification(user);

        // 5. Deslogar imediatamente para impedir acesso ao Dashboard
        await signOut(auth);

        // 6. Exibir tela de verificação
        setVerificationEmailAddr(email);
        setIsVerificationSent(true);
        
      } else {
        // Fluxo de Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Verificar se o e-mail foi validado
        if (!userCredential.user.emailVerified) {
           setVerificationEmailAddr(email);
           setShowUnverifiedScreen(true);
           return; 
        }
      }
      // Sucesso no Login e Validado: O listener no App.tsx cuidará do redirecionamento
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message; 
      
      if (
        errorCode === 'auth/invalid-credential' || 
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password'
      ) {
        setErrorMsg('Senha ou E-mail Incorreto.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está cadastrado.');
      } else if (errorCode === 'auth/weak-password') {
        setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      } else if (errorCode === 'auth/too-many-requests') {
        setErrorMsg('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        console.error("Erro desconhecido de autenticação:", errorCode, errorMessage);
        setErrorMsg('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
            setShowUnverifiedScreen(false);
            setIsVerificationSent(true);
        } else {
            setErrorMsg('Sessão expirada. Faça login novamente.');
            setShowUnverifiedScreen(false);
        }
    } catch (error: any) {
        if (error.code === 'auth/too-many-requests') {
            setErrorMsg('Aguarde um momento antes de reenviar.');
        } else {
            setErrorMsg('Erro ao reenviar. Tente novamente.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        setErrorMsg('Digite seu e-mail para recuperar a senha.');
        return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
        await sendPasswordResetEmail(auth, email);
        setIsResetSent(true);
    } catch (error: any) {
        const errorCode = error.code;
        if (errorCode === 'auth/user-not-found') {
            setErrorMsg('E-mail não encontrado.');
        } else if (errorCode === 'auth/invalid-email') {
            setErrorMsg('E-mail inválido.');
        } else {
            setErrorMsg('Erro ao enviar e-mail. Tente novamente.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const scrollToLogin = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const input = document.getElementById('login-email');
    if (input) input.focus();
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
    setIsVerificationSent(false);
    setIsResettingPassword(false);
    setShowUnverifiedScreen(false);
  };

  const handleBackToLogin = () => {
      if (showUnverifiedScreen && auth.currentUser) {
          signOut(auth).catch(console.error);
      }
      
      setIsVerificationSent(false);
      setIsRegistering(false);
      setIsResettingPassword(false);
      setIsResetSent(false);
      setShowUnverifiedScreen(false);
      setErrorMsg('');
  };

  const features = [
    {
      icon: LayoutDashboard,
      title: "Fluxo Dinâmico",
      desc: "Visualize cada centavo que entra e sai com gráficos de alta precisão."
    },
    {
      icon: CalendarClock,
      title: "Assinaturas sob Controle",
      desc: "Nunca mais seja pego de surpresa por renovações automáticas esquecidas."
    },
    {
      icon: Target,
      title: "Metas Visuais",
      desc: "Transforme seus sonhos em barras de progresso reais e alcançáveis."
    },
    {
      icon: TrendingUp,
      title: "Investimentos",
      desc: "Acompanhe sua carteira e o crescimento do seu patrimônio em tempo real."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "R$ 0",
      features: ["Controle de Fluxo", "Até 3 Metas", "Relatórios Mensais"],
      recommended: false
    },
    {
      name: "OnFlow Pro",
      price: "R$ 19,90",
      features: ["IA OnFlow Gemini Ilimitada", "Metas Ilimitadas", "Gestão de Investimentos", "Suporte Premium"],
      recommended: true
    },
    {
      name: "Elite",
      price: "R$ 34,90",
      features: ["Tudo do Pro", "Multi-perfis de Usuário", "Exportação de Dados", "Consultoria em IA"],
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden transition-colors duration-500">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/5 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <nav className="relative z-50 flex items-center justify-between px-6 py-6 w-full max-w-[90%] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]">O</div>
          <span className="text-2xl font-black tracking-tighter">OnFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#vantagens" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Vantagens</a>
          <a href="#planos" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Preços</a>
          {onToggleTheme && (
            <button onClick={onToggleTheme} className="text-sm font-bold text-slate-500 hover:text-emerald-500 transition-colors">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>
          )}
          <button onClick={scrollToLogin} className="px-6 py-2 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-full text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm dark:shadow-none">Entrar</button>
        </div>
      </nav>

      <section className="relative z-10 pt-10 pb-20 px-6 w-full max-w-[90%] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Controle Financeiro Inteligente</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter leading-[1.1] text-slate-900 dark:text-white">
              Domine seu <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-900 dark:from-emerald-400 dark:via-emerald-200 dark:to-white">Capital.</span>
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-xl font-medium leading-relaxed">
              O OnFlow une design premium e inteligência artificial para transformar a maneira como você visualiza, economiza e investe seu dinheiro.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                    <Shield size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Dados Seguros</p>
                    <p className="text-xs text-slate-500">Firebase Auth</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
                    <Star size={18} className="text-yellow-500 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">IA Gemini Integrada</p>
                    <p className="text-xs text-slate-500">Google AI Studio</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-5 w-full">
             <div className={`relative bg-white/70 dark:bg-white/[0.03] backdrop-blur-2xl border ${errorMsg ? 'border-red-500/50 animate-shake' : 'border-slate-200 dark:border-white/10'} rounded-[2.5rem] p-8 md:p-10 shadow-2xl dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] transition-all duration-300 group hover:border-emerald-500/30 dark:hover:border-white/20 min-h-[500px] flex flex-col justify-center`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                
                {showUnverifiedScreen ? (
                    // 1. TELA DE E-MAIL NÃO VERIFICADO (NOVA)
                    <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 shadow-glow">
                            <ShieldAlert size={40} className="text-yellow-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">E-mail não verificado</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                            Para sua segurança, precisamos que você valide o e-mail <br/>
                            <strong className="text-slate-900 dark:text-white">{verificationEmailAddr}</strong> antes de acessar.
                        </p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={handleResendVerification}
                                disabled={isLoading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                                    <>
                                        <span>Reenviar Verificação</span>
                                        <Mail size={18} />
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={handleBackToLogin}
                                className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm font-bold py-3 transition-colors"
                            >
                                Voltar para o Login
                            </button>
                        </div>
                        
                        {errorMsg && (
                            <p className="mt-4 text-xs font-bold text-red-500 bg-red-500/10 py-2 rounded-lg">{errorMsg}</p>
                        )}
                    </div>
                ) : isVerificationSent ? (
                    // 2. TELA DE E-MAIL ENVIADO (COM AVISO DE SPAM)
                    <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-glow">
                            <MailCheck size={40} className="text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Verifique seu e-mail</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                            Enviamos um link de confirmação para <br/>
                            <strong className="text-emerald-600 dark:text-emerald-400 text-base">{verificationEmailAddr}</strong>
                        </p>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-500 mb-8 bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 mx-2">
                           <span className="font-bold flex items-center justify-center gap-1 mb-1 text-slate-600 dark:text-slate-400"><AlertCircle size={12}/> Atenção:</span>
                           Se não encontrar na caixa de entrada, verifique sua pasta de <span className="text-slate-900 dark:text-white font-bold">Spam</span> ou <span className="text-slate-900 dark:text-white font-bold">Lixo Eletrônico</span>.
                        </p>

                        <button 
                            onClick={handleBackToLogin}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <span>Fazer Login</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                ) : isResettingPassword ? (
                    // ... (resto do código igual ao original)
                    isResetSent ? (
                        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                             <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-glow">
                                <MailCheck size={40} className="text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">E-mail Enviado</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                                Nós enviamos um link de alteração de senha para <strong className="text-blue-500 dark:text-blue-400">{email}</strong>.
                            </p>
                            <button 
                                onClick={handleBackToLogin}
                                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <span>Sign In</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    ) : (
                         <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                             <div className="mb-8">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                                    <KeyRound size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Esqueceu a senha?</h2>
                                <p className="text-slate-500 text-sm">
                                    Insira seu e-mail para receber um link de redefinição.
                                </p>
                            </div>
                             <form onSubmit={handleSendResetLink} className="space-y-5">
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
                                    <input 
                                        type="email" 
                                        placeholder="Seu e-mail cadastrado"
                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-white dark:focus:bg-black/60 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                {errorMsg && (
                                    <div className="text-red-500 text-xs font-bold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                    {errorMsg}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                     {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Obter Link de Redefinição"}
                                </button>

                                <button 
                                    type="button" 
                                    onClick={handleBackToLogin}
                                    className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm font-bold py-2 transition-colors"
                                >
                                    Voltar para o Login
                                </button>
                             </form>
                         </div>
                    )
                ) : (
                    // 5. FORMULÁRIO PADRÃO DE LOGIN/REGISTRO
                    <>
                        <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{isRegistering ? "Criar Conta" : "Bem-vindo"}</h2>
                        <p className="text-slate-500 text-sm">
                            {isRegistering ? "Preencha os dados para começar." : "Insira suas credenciais para acessar o painel."}
                        </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            
                            {/* Campos Extras para Registro */}
                            {isRegistering && (
                            <div className="animate-in fade-in slide-in-from-top-4 space-y-4">
                                <div className="relative group/input">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
                                    <input 
                                    type="text" 
                                    placeholder="Seu Nome Completo"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-white dark:focus:bg-black/60 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    required={isRegistering}
                                    />
                                </div>
                                <div className="relative group/input">
                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
                                    <input 
                                    type="url" 
                                    placeholder="URL da Foto (Opcional)"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-white dark:focus:bg-black/60 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    value={photoUrl} 
                                    onChange={(e) => setPhotoUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                            )}

                            <div className="relative group/input">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
                            <input 
                                id="login-email"
                                type="email" 
                                placeholder="Email"
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-white dark:focus:bg-black/60 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            </div>
                            <div className="relative group/input">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
                            <input 
                                type="password" 
                                placeholder="Senha"
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-white dark:focus:bg-black/60 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            </div>

                            {isRegistering && (
                                <div className="relative group/input animate-in fade-in slide-in-from-top-4">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
                                    <input 
                                    type="password" 
                                    placeholder="Repetir Senha"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-emerald-500/50 focus:bg-white dark:focus:bg-black/60 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required={isRegistering}
                                    minLength={6}
                                    />
                                </div>
                            )}
                        </div>

                        {errorMsg && (
                            <div className="text-red-500 text-xs font-bold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                            {errorMsg}
                            </div>
                        )}

                        {!isRegistering && (
                            <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group/check">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-white/10 bg-white dark:bg-black checked:bg-emerald-500 outline-none appearance-none border checked:border-transparent transition-all relative after:content-[''] after:hidden checked:after:block after:w-2 after:h-2 after:bg-white dark:after:bg-black after:rounded-sm after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2" />
                                <span className="text-xs text-slate-500 group-hover/check:text-slate-800 dark:group-hover/check:text-slate-300 transition-colors">Lembrar-me</span>
                            </label>
                            <button type="button" onClick={() => setIsResettingPassword(true)} className="text-xs text-emerald-600 dark:text-emerald-500 font-bold hover:text-emerald-500 dark:hover:text-emerald-400">Esqueci a senha</button>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                            ) : (
                            <>
                                <span>{isRegistering ? "Criar Conta" : "Acessar Dashboard"}</span>
                                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </>
                            )}
                        </button>
                        </form>

                        <div className="mt-8 text-center">
                        <p className="text-slate-600 text-xs">
                            {isRegistering ? "Já tem uma conta?" : "Não tem conta?"} 
                            <button 
                                onClick={toggleMode}
                                className="text-slate-900 dark:text-white font-bold hover:text-emerald-500 transition-colors ml-1"
                            >
                            {isRegistering ? "Fazer Login" : "Criar agora"}
                            </button>
                        </p>
                        </div>
                    </>
                )}
             </div>
          </div>

        </div>
      </section>

      <section id="vantagens" className="relative z-10 py-32 px-8 w-full max-w-[90%] mx-auto">
        {/* ... (Conteúdo original) ... */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white">Tudo o que você precisa.</h2>
          <p className="text-slate-500">Ferramentas poderosas para organizar sua vida financeira.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] p-8 rounded-[2.5rem] hover:border-emerald-500/30 transition-all duration-500 group hover:shadow-lg dark:hover:shadow-none">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform border border-emerald-500/10">
                <f.icon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Resto do componente permanece igual */}
      <section className="relative z-10 py-32 bg-emerald-500/5 border-y border-emerald-500/10">
         {/* ... */}
         <div className="w-full max-w-[90%] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
             <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full"></div>
             <div className="relative bg-white dark:bg-black border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="space-y-4 font-mono text-sm">
                   <p className="text-emerald-600 dark:text-emerald-400"># Analisando dados financeiros...</p>
                   <p className="text-slate-600 dark:text-slate-400">{">"} Gastos em assinaturas reduzidos em 12%</p>
                   <p className="text-slate-600 dark:text-slate-400">{">"} Recomendação: Mudar Netflix para plano básico</p>
                   <p className="text-purple-500 dark:text-purple-400 animate-pulse"># IA Gemini: Pronto para consultoria.</p>
                </div>
             </div>
          </div>
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black leading-tight text-slate-900 dark:text-white">Consultoria com Inteligência Artificial.</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Nosso sistema utiliza o poder do Google Gemini para analisar seus hábitos e sugerir economias reais. É como ter um consultor financeiro 24h por dia.
            </p>
            <ul className="space-y-4">
              {["Análise de gastos em tempo real", "Projeções de saldo futuro", "Dicas personalizadas de economia"].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-bold">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Check size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="planos" className="relative z-10 py-32 px-8 w-full max-w-[90%] mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-slate-900 dark:text-white">Planos para todos.</h2>
          <p className="text-slate-500">Escolha o nível de controle que você deseja hoje.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p, i) => (
            <div key={i} className={`relative p-8 md:p-10 rounded-[3rem] border transition-all duration-500 ${p.recommended ? 'bg-white text-black border-slate-200 scale-105 shadow-[0_20px_60px_rgba(0,0,0,0.1)]' : 'bg-white/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-emerald-500/30 dark:hover:border-white/20'}`}>
              {p.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Mais Popular</div>
              )}
              <h3 className="text-2xl font-black mb-2">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">{p.price}</span>
                <span className={`text-xs ${p.recommended ? 'text-slate-500' : 'text-slate-500 dark:text-slate-600'}`}>/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {p.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-3 text-sm font-bold">
                    <Check size={16} className={p.recommended ? 'text-emerald-600' : 'text-emerald-500 dark:text-emerald-400'} />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={scrollToLogin} className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${p.recommended ? 'bg-black text-white hover:bg-slate-800' : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                Escolher {p.name}
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 py-12 border-t border-slate-200 dark:border-white/5 text-center text-slate-600 text-xs">
        <p>&copy; 2025 OnFlow Finance. Todos os direitos reservados.</p>
        <p className="mt-2 font-bold tracking-widest uppercase">Privacy & Design Focus</p>
      </footer>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};