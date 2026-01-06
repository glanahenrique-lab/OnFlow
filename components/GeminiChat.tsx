import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Sparkles, Send, X, MessageSquare, Bot, CheckCircle2 } from 'lucide-react';

interface GeminiChatProps {
  contextData: any; 
  isOpen: boolean;
  onClose: () => void;
  onAddGoal?: (g: any) => string;
  onDeleteGoal?: (id: string) => string;
  onAddTransaction?: (t: any) => string;
  onDeleteTransaction?: (id: string) => string;
  onAddSubscription?: (s: any) => string;
}

// Definições de Funções para o Gemini
const addGoalTool: FunctionDeclaration = {
  name: 'addGoal',
  parameters: {
    type: Type.OBJECT,
    description: 'Cria uma nova meta financeira para o usuário.',
    properties: {
      name: { type: Type.STRING, description: 'Nome da meta (ex: Viagem para o Japão)' },
      targetAmount: { type: Type.NUMBER, description: 'Valor total a ser poupado' },
      currentAmount: { type: Type.NUMBER, description: 'Valor já poupado atualmente' },
      deadline: { type: Type.STRING, description: 'Data limite no formato YYYY-MM-DD' },
    },
    required: ['name', 'targetAmount'],
  },
};

const addTransactionTool: FunctionDeclaration = {
  name: 'addTransaction',
  parameters: {
    type: Type.OBJECT,
    description: 'Cria um novo lançamento de despesa ou receita.',
    properties: {
      description: { type: Type.STRING, description: 'Descrição do gasto ou ganho' },
      amount: { type: Type.NUMBER, description: 'Valor monetário' },
      type: { type: Type.STRING, description: 'Deve ser "income" para ganhos ou "expense" para gastos' },
      category: { type: Type.STRING, description: 'Categoria (ex: Alimentação, Lazer)' },
      date: { type: Type.STRING, description: 'Data do lançamento YYYY-MM-DD' },
      paymentMethod: { type: Type.STRING, description: 'Forma de pagamento (ex: Pix, Cartão)' },
    },
    required: ['description', 'amount', 'type'],
  },
};

const deleteTool: FunctionDeclaration = {
  name: 'deleteEntity',
  parameters: {
    type: Type.OBJECT,
    description: 'Remove uma meta ou transação existente pelo seu ID.',
    properties: {
      id: { type: Type.STRING, description: 'O ID único do item a ser removido' },
      type: { type: Type.STRING, description: 'O tipo do item: "goal" ou "transaction"' },
    },
    required: ['id', 'type'],
  },
};

export const GeminiChat: React.FC<GeminiChatProps> = ({ 
  contextData, isOpen, onClose, 
  onAddGoal, onDeleteGoal, onAddTransaction, onDeleteTransaction, onAddSubscription 
}) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model' | 'system', text: string}[]>([
    { role: 'model', text: 'Olá! Sou o **OnFlow AI**. Analisando seu mês, vi que você tem **' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contextData.resumo?.saldo_liquido || 0) + '** de saldo. Quer que eu crie uma nova **meta** ou registre algum **gasto**?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const renderFormattedText = (text: string, role: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong 
            key={index} 
            className={`font-black ${role === 'user' ? 'text-white underline decoration-white/20' : 'text-emerald-400'}`}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextString = JSON.stringify(contextData);
      
      const systemInstruction = `Você é um CFO de elite no app "OnFlow". 
      CONTEXTO ATUAL: ${contextString}.
      Você tem permissão para CRIAR e EXCLUIR metas e transações usando as ferramentas fornecidas.
      Sempre que o usuário pedir para "criar", "registrar", "anotar" ou "apagar" algo, use as funções.
      Sempre confirme quando uma ação for realizada com sucesso.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: [addGoalTool, addTransactionTool, deleteTool] }],
          temperature: 0.5,
        }
      });

      // Processar Chamadas de Funções
      if (response.functionCalls && response.functionCalls.length > 0) {
        let aiFeedback = "";
        
        for (const call of response.functionCalls) {
          if (call.name === 'addGoal' && onAddGoal) {
            aiFeedback = onAddGoal(call.args);
          } else if (call.name === 'addTransaction' && onAddTransaction) {
            aiFeedback = onAddTransaction(call.args);
          } else if (call.name === 'deleteEntity') {
            const { id, type } = call.args as any;
            if (type === 'goal' && onDeleteGoal) aiFeedback = onDeleteGoal(id);
            if (type === 'transaction' && onDeleteTransaction) aiFeedback = onDeleteTransaction(id);
          }
        }

        // Se houve uma ação, o Gemini geralmente envia um texto confirmando após a função,
        // mas se não enviar, forçamos uma mensagem de sistema.
        if (response.text) {
          setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        } else {
          setMessages(prev => [...prev, { role: 'model', text: "✅ Comando executado com sucesso! Já atualizei seu dashboard." }]);
        }
      } else if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      }
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Ops! Tive um problema ao processar seu pedido. Verifique os dados e tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-md md:bg-transparent" onClick={onClose} />

      <div className="fixed bottom-24 right-4 left-4 md:left-auto md:right-32 z-[60] w-auto md:w-[450px] h-[650px] max-h-[85vh] bg-[#080808]/95 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500 origin-bottom-right">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-950/40 via-transparent to-transparent flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-glow">
                <Bot size={22} className="text-emerald-400" />
             </div>
             <div>
               <h3 className="font-black text-white text-base tracking-tight uppercase italic mb-1">OnFlow AI</h3>
               <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Ações Reais Habilitadas</p>
               </div>
             </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] text-[15px] leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-emerald-500 text-black rounded-tr-none font-bold' 
                  : 'bg-white/[0.04] text-slate-300 rounded-tl-none border border-white/[0.08] backdrop-blur-xl'
              }`}>
                {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={line ? 'mb-4 last:mb-0' : 'mb-0'}>
                      {renderFormattedText(line, msg.role)}
                    </p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-pulse">
               <div className="bg-white/5 p-5 rounded-[2rem] rounded-tl-none flex gap-3 items-center border border-white/5">
                  <Sparkles size={16} className="text-emerald-500 animate-spin" />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">IA está executando...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder='Ex: "Crie uma meta de Viagem de R$ 5000 para Dezembro"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-6 pr-14 py-4.5 text-sm text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center text-black hover:bg-emerald-400 disabled:opacity-20 transition-all shadow-glow active:scale-90"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-1000">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Integração Direta com Dashboard OnFlow</span>
          </div>
        </div>
      </div>
    </>
  );
};