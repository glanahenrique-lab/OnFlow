import React, { useState } from 'react';
import { Lock, User, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { Button, Input } from './ui/UIComponents';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin(username, password);
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black font-sans">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="w-20 h-20 bg-white text-black rounded-3xl flex items-center justify-center font-black text-4xl mx-auto mb-6 shadow-[0_0_50px_rgba(255,255,255,0.2)]">O</div>
           <h1 className="text-4xl font-black text-white tracking-tighter mb-2">OnFlow</h1>
           <p className="text-slate-500 font-medium">Sua jornada financeira começa aqui.</p>
        </div>

        <div className={`bg-[#0a0a0a]/80 backdrop-blur-3xl border ${isError ? 'border-red-500/50 animate-shake' : 'border-white/10'} rounded-[2.5rem] p-8 md:p-10 shadow-2xl transition-all duration-300`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                   <User size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Seu usuário"
                  className="w-full bg-black border border-white/5 text-white rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                   <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  placeholder="Sua senha"
                  className="w-full bg-black border border-white/5 text-white rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
               <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-black checked:bg-emerald-500 outline-none" />
                  <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Lembrar de mim</span>
               </label>
               <button type="button" className="text-xs text-emerald-500 font-bold hover:text-emerald-400">Esqueci a senha</button>
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group transition-all active:scale-95"
            >
              <span>Acessar Dashboard</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} />
                Conexão Segura
             </div>
             <div className="flex items-center gap-2 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                <Zap size={14} />
                Alta Performance
             </div>
          </div>
        </div>

        <p className="text-center mt-10 text-slate-600 text-sm">
          Não tem uma conta? <button className="text-white font-bold hover:text-emerald-500 transition-colors">Criar agora</button>
        </p>
      </div>
      
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