import { CategoryId, CategoryMeta, PaymentMethod } from '../types/finance';

let _hideValuesGlobal = false;
try {
  _hideValuesGlobal = localStorage.getItem('finanplan_hide_values') === 'true';
} catch {
  // localStorage might be unavailable or restricted
}

export const getHideValuesGlobal = (): boolean => _hideValuesGlobal;
export const setHideValuesGlobal = (val: boolean): void => {
  _hideValuesGlobal = val;
  try {
    localStorage.setItem('finanplan_hide_values', val ? 'true' : 'false');
  } catch {}
};

export const formatCurrency = (value: number, hideOverride?: boolean): string => {
  const shouldHide = hideOverride !== undefined ? hideOverride : _hideValuesGlobal;
  if (shouldHide) {
    return 'R$ •••••';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDateBR = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
};

export const formatShortDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
};

export const addMonthsToDateString = (baseDateStr: string, monthsToAdd: number): string => {
  if (!baseDateStr) return '';
  const [y, m, d] = baseDateStr.split('-').map(Number);
  if (!y || !m || !d) return baseDateStr;

  const targetMonthIndex = m - 1 + monthsToAdd;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;

  // Ensure day does not exceed max days in target month (e.g., Feb 28/29, Apr 30)
  const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const validDay = Math.min(d, daysInTargetMonth);

  const mm = String(normalizedMonth + 1).padStart(2, '0');
  const dd = String(validDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
};

/**
 * Calculates the exact invoice due date (data de pagar) for a purchase made on a credit card,
 * taking into account closing day (data de virar a fatura) and due day.
 */
export const calculateCardDueDate = (
  purchaseDateStr: string,
  closingDay: number,
  dueDay: number
): string => {
  if (!purchaseDateStr) return purchaseDateStr;
  const [y, m, d] = purchaseDateStr.split('-').map(Number);
  if (!y || !m || !d) return purchaseDateStr;

  let invoiceMonthIndex = m - 1; // 0-based
  let invoiceYear = y;

  // If purchase is made on or after the closing day, the invoice has already closed (virou a fatura)
  if (d >= closingDay) {
    invoiceMonthIndex += 1;
  }

  // If dueDay is less than closingDay, payment falls in the month following the closing cycle
  // (e.g., closes on the 24th, due on the 3rd of the following month)
  if (dueDay < closingDay) {
    invoiceMonthIndex += 1;
  }

  const targetYear = invoiceYear + Math.floor(invoiceMonthIndex / 12);
  const normalizedMonth = ((invoiceMonthIndex % 12) + 12) % 12;

  const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const validDay = Math.min(dueDay, daysInTargetMonth);

  const mm = String(normalizedMonth + 1).padStart(2, '0');
  const dd = String(validDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[monthIndex] || '';
};

export const getMonthShortName = (monthIndex: number): string => {
  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return months[monthIndex] || '';
};

export const CATEGORY_DEFINITIONS: Record<CategoryId, CategoryMeta> = {
  salary: {
    id: 'salary',
    label: 'Salários',
    type: 'income',
    group: 'Entradas',
    color: '#059669', // emerald-600
    bgColor: '#ecfdf5', // emerald-50
    borderColor: '#a7f3d0',
    iconName: 'Banknote',
    description: 'Salário fixo, adiantamentos, pró-labore e 13º',
  },
  commission: {
    id: 'commission',
    label: 'Comissões',
    type: 'income',
    group: 'Entradas',
    color: '#0d9488', // teal-600
    bgColor: '#f0fdfa', // teal-50
    borderColor: '#99f6e4',
    iconName: 'TrendingUp',
    description: 'Comissões de vendas, metas batidas e bônus',
  },
  freelance: {
    id: 'freelance',
    label: 'Freelance & Serviços',
    type: 'income',
    group: 'Entradas',
    color: '#0284c7', // sky-600
    bgColor: '#f0f9ff', // sky-50
    borderColor: '#bae6fd',
    iconName: 'Briefcase',
    description: 'Trabalhos extras, consultorias e serviços avulsos',
  },
  investments: {
    id: 'investments',
    label: 'Rendimentos',
    type: 'income',
    group: 'Entradas',
    color: '#2563eb', // blue-600
    bgColor: '#eff6ff', // blue-50
    borderColor: '#bfdbfe',
    iconName: 'PiggyBank',
    description: 'Dividendos, juros, aluguéis recebidos e aplicações',
  },
  other_income: {
    id: 'other_income',
    label: 'Outras Entradas',
    type: 'income',
    group: 'Entradas',
    color: '#4f46e5', // indigo-600
    bgColor: '#eef2ff', // indigo-50
    borderColor: '#c7d2fe',
    iconName: 'ArrowDownLeft',
    description: 'Reembolsos, presentes, prêmios ou vendas pontuais',
  },
  credit_card: {
    id: 'credit_card',
    label: 'Compras de Cartão',
    type: 'expense',
    group: 'Saídas',
    color: '#7c3aed', // violet-600
    bgColor: '#f5f3ff', // violet-50
    borderColor: '#ddd6fe',
    iconName: 'CreditCard',
    description: 'Faturas, compras parceladas e gastos no cartão de crédito',
  },
  fixed_debt: {
    id: 'fixed_debt',
    label: 'Dívidas Fixas',
    type: 'expense',
    group: 'Saídas',
    color: '#d97706', // amber-600
    bgColor: '#fffbeb', // amber-50
    borderColor: '#fde68a',
    iconName: 'Home',
    description: 'Aluguel, condomínio, luz, água, internet e parcelas de financiamento',
  },
  general_expenses: {
    id: 'general_expenses',
    label: 'Gastos Variáveis',
    type: 'expense',
    group: 'Saídas',
    color: '#e11d48', // rose-600
    bgColor: '#fff1f2', // rose-50
    borderColor: '#fecdd3',
    iconName: 'ShoppingBag',
    description: 'Mercado, restaurantes, transporte, lazer e imprevistos',
  },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  boleto: 'Boleto Bancário',
  cash: 'Dinheiro',
  bank_transfer: 'Transferência / TED',
};
