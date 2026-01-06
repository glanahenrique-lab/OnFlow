import React from 'react';
import { X } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => (
  <div className={`relative overflow-hidden bg-white/70 dark:bg-[#0f0f0f]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] rounded-[2rem] p-8 shadow-xl dark:shadow-2xl transition-all duration-300 hover:border-emerald-500/20 dark:hover:border-white/[0.15] group ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.4] to-transparent dark:from-white/[0.05] pointer-events-none"></div>
    {(title || action) && (
      <div className="flex justify-between items-center mb-6 relative z-10">
        {title && <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-wide">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="relative z-10 h-full text-slate-700 dark:text-slate-200">
      {children}
    </div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold tracking-wide transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 relative overflow-hidden";
  
  const variants = {
    primary: "bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] border border-transparent",
    secondary: "bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] backdrop-blur-md shadow-sm dark:shadow-none",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20",
    ghost: "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label?: string;
  as?: 'input' | 'select';
  children?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, as = 'input', className = '', children, ...props }) => (
  <div className="flex flex-col gap-2">
    {label && <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
    <div className="relative group">
       {as === 'select' ? (
         <select
            className={`w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 group-hover:border-emerald-500/30 dark:group-hover:border-white/[0.2] appearance-none ${className}`}
            {...(props as any)}
         >
           {children}
         </select>
       ) : (
        <input
          className={`w-full bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white rounded-xl px-5 py-4 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 group-hover:border-emerald-500/30 dark:group-hover:border-white/[0.2] ${className}`}
          {...(props as any)}
        />
       )}
    </div>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/80 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/[0.1] w-full max-w-lg rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden animate-in zoom-in-95 duration-300 slide-in-from-bottom-10 flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/[0.5] dark:bg-white/[0.02]">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0a0a0a]">
          {children}
        </div>
      </div>
    </div>
  );
};