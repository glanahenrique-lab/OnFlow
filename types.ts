
export type ViewState = 'dashboard' | 'transactions' | 'subscriptions' | 'goals' | 'investments' | 'installments';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
}

export interface ActivityItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: string;
  description: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  cardName?: string; // Nome do cartão (ex: Nubank, XP)
  debtorName?: string;
  isPaid?: boolean;
  
  // Novos campos
  isSplit?: boolean;
  splitWith?: string; // Nome da pessoa
  splitStatus?: 'paid' | 'pending';
  
  giftRecipient?: string; // Para quem é o presente
  
  transportApp?: string; // Uber, 99
  transportPayer?: string; // Quem pediu/pagou
  
  isRefunded?: boolean;
  relatedInstallmentId?: string; // Se for visualização de parcela
  installmentCurrent?: number; // Número da parcela atual
  installmentTotal?: number; // Total de parcelas
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingDay: number; 
  logo?: string;
  category: string;
  startDate: string; 
  paymentMethod: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string; // Data de criação para filtragem mensal
  deadline?: string; 
  icon?: string;
}

export interface InvestmentTransaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
}

export interface Investment {
  id: string;
  name: string;
  type: 'Stock' | 'Crypto' | 'Fixed Income' | 'Fund';
  investedAmount: number; 
  currentValue: number; 
  history: InvestmentTransaction[]; 
  lastUpdated: string;
}

export interface Installment {
  id: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  startDate: string; 
  paymentMethod: string;
  cardName?: string; // Nome do cartão específico
}

export interface Receivable {
  id: string;
  debtorName: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
}