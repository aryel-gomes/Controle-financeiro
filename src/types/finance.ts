export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'salary'        // Salários
  | 'commission'    // Comissões
  | 'freelance'     // Freelance / Serviços
  | 'investments'   // Rendimentos / Investimentos
  | 'other_income'; // Outras Entradas

export type ExpenseCategory =
  | 'credit_card'       // Compras de Cartão
  | 'fixed_debt'        // Dívidas Fixas
  | 'general_expenses'; // Gastos / Variáveis / Dia a dia

export type CategoryId = IncomeCategory | ExpenseCategory;

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'boleto'
  | 'cash'
  | 'bank_transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: CategoryId;
  subCategory?: string;
  description: string;
  amount: number; // in BRL
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  isPaid: boolean; // Pago/Recebido vs Pendente/A pagar
  cardName?: string;
  currentInstallment?: number;
  totalInstallments?: number;
  installmentGroupId?: string; // Links all installments of the same purchase
  recurrenceGroupId?: string;  // Links recurring monthly items
  isRecurring?: boolean;
  notes?: string;
  createdAt: string;
}

export interface BudgetLimit {
  id: string;
  category: 'overall' | ExpenseCategory;
  title: string;
  monthlyLimit: number; // in BRL
  alertThresholdPercent: number; // e.g., 80 for 80%
  enabled: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  bank?: string;
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  type: TransactionType;
  group: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  description: string;
}

export interface MonthSummary {
  monthKey: string; // "YYYY-MM"
  label: string;
  totalIncome: number;
  salaryIncome: number;
  commissionIncome: number;
  otherIncome: number;
  totalExpense: number;
  creditCardExpense: number;
  fixedDebtExpense: number;
  generalExpense: number;
  netBalance: number;
  savingsRate: number; // percentage
  paidExpense: number;
  pendingExpense: number;
}

export type InvestmentCategory =
  | 'emergency' // Reserva de Emergência
  | 'cdb_fixed' // Renda Fixa / CDB / Tesouro Selic
  | 'caixinha'  // Caixinhas / Poupança
  | 'stocks'    // Ações / FIIs / ETFs
  | 'goals'     // Sonhos / Metas (Viagem, Carro, Casa)
  | 'crypto'    // Criptoativos
  | 'other';    // Outros Investimentos

export interface InvestmentGoal {
  id: string;
  name: string;
  category: InvestmentCategory;
  institution?: string; // Nubank, Inter, XP, Itaú, Tesouro Direto, etc.
  currentAmount: number; // Valor acumulado
  targetAmount: number;  // Meta a atingir
  monthlyContribution?: number; // Aporte mensal planejado
  color?: string;
  expectedReturnAnnual?: number; // Ex: 10.5% ao ano (100% CDI)
  notes?: string;
  createdAt: string;
}

export interface InvestmentContribution {
  id: string;
  goalId: string;
  type: 'deposit' | 'withdraw'; // Guardar / Aportar vs Resgatar
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}
