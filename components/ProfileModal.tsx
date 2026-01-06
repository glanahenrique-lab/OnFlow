import React, { useState, useRef } from 'react';
import { User, Trash2, Save, X, Loader2, AlertTriangle, ShieldCheck, Camera, Upload } from 'lucide-react';
import { Modal, Input, Button } from './ui/UIComponents';
import { User as UserType } from '../types';
import { deleteUser, updateProfile, signOut } from 'firebase/auth';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onUpdateUser: (u: UserType) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("A imagem deve ter no máximo 2MB.");
        return;
    }

    setIsUploading(true);
    setError('');

    try {
        if (!user.uid) throw new Error("Usuário não identificado");

        // Criar referência no Storage: avatars/UID
        const storageRef = ref(storage, `avatars/${user.uid}`);
        
        // Fazer Upload
        await uploadBytes(storageRef, file);
        
        // Pegar URL
        const downloadUrl = await getDownloadURL(storageRef);
        
        setPhotoURL(downloadUrl);
    } catch (err: any) {
        console.error("Erro no upload:", err);
        setError("Falha ao enviar imagem. Verifique se o Firebase Storage está ativado.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (auth.currentUser) {
        // 1. Atualizar Auth do Firebase
        await updateProfile(auth.currentUser, {
            displayName,
            photoURL
        });

        // 2. Atualizar Firestore
        await updateDoc(doc(db, "users", user.uid), {
            displayName,
            photoURL
        });

        // 3. Atualizar estado local
        onUpdateUser({ ...user, displayName, photoURL });
        onClose();
      }
    } catch (err: any) {
        console.error(err);
        setError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setError('');
    
    try {
        if (auth.currentUser) {
            // 1. Deletar documento do Firestore
            await deleteDoc(doc(db, "users", user.uid));
            
            // 2. Deletar usuário do Auth (requer login recente)
            await deleteUser(auth.currentUser);
            
            // A sessão cairá automaticamente e o App.tsx redirecionará para a LandingPage
        }
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/requires-recent-login') {
            setError('Para excluir a conta, faça login novamente e tente de novo.');
        } else {
            setError('Erro ao excluir conta.');
        }
        setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Meu Perfil">
        {showDeleteConfirm ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20 shadow-glow">
                    <AlertTriangle size={32} />
                </div>
                <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Tem certeza absoluta?</h4>
                    <p className="text-slate-500 text-sm">Essa ação não pode ser desfeita. Todos os seus dados, transações e metas serão apagados permanentemente.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button 
                        variant="danger" 
                        onClick={handleDeleteAccount} 
                        disabled={isLoading}
                        className="w-full py-4 flex items-center justify-center gap-2"
                    >
                         {isLoading ? <Loader2 size={18} className="animate-spin"/> : <><Trash2 size={18}/> Excluir Minha Conta</>}
                    </Button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white py-2">Cancelar</button>
                </div>
                {error && <p className="text-xs text-red-500 font-bold bg-red-500/10 p-2 rounded-lg">{error}</p>}
            </div>
        ) : (
            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 overflow-hidden relative">
                             {isUploading ? (
                                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                     <Loader2 className="animate-spin text-white" size={32} />
                                 </div>
                             ) : (
                                <img src={photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}`} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                             )}
                        </div>
                        <div className="absolute bottom-1 right-1 w-10 h-10 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black border-4 border-white dark:border-[#0a0a0a] shadow-lg transition-transform group-hover:scale-110">
                            <Camera size={16} />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload size={24} className="text-white drop-shadow-md" />
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                    />
                    <p className="text-xs text-slate-500 font-medium">Toque na foto para alterar (Máx: 2MB)</p>
                </div>

                <div className="space-y-4">
                    <Input label="Nome Completo" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                    
                    {/* Campo de URL removido em favor do Upload, mas mantendo campo readonly de email */}
                    <div className="opacity-50 pointer-events-none">
                        <Input label="E-mail (Não editável)" value={user.email || ''} readOnly />
                    </div>
                </div>

                {error && <p className="text-xs text-red-500 font-bold bg-red-500/10 p-2 rounded-lg text-center">{error}</p>}

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
                    <Button type="submit" className="w-full py-4 bg-emerald-500 text-black font-black flex items-center justify-center gap-2" disabled={isLoading || isUploading}>
                         {isLoading ? <Loader2 size={18} className="animate-spin"/> : <><Save size={18}/> Salvar Alterações</>}
                    </Button>
                    
                    <button 
                        type="button" 
                        onClick={() => setShowDeleteConfirm(true)} 
                        className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-500/5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14} />
                        Excluir Conta
                    </button>
                </div>
            </form>
        )}
    </Modal>
  );
};