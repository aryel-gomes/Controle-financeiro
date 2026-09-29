import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, CreditCard as CardIcon, Calendar, Repeat, Trash2, Plus } from 'lucide-react';
import {
  CategoryId,
  CreditCard,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '../types/finance';
import { CATEGORY_DEFINITIONS, formatCurrency, addMonthsToDateString, getMonthName } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tx: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string,
    options?: { repeatMonthsCount?: number }
  ) => void;
  onDelete?: (id: string, deleteAllInGroup?: boolean) => void;
  onAddCreditCard?: (card: Omit<CreditCard, 'id'>) => void;
  editingTransaction?: Transaction | null;
  creditCards: CreditCard[];
  defaultDate?: string;
}

const COMMON_BANKS = [
  'Itaú',
  'Bradesco',
  'Santander',
  'Nubank',
  'Banco Inter',
  'C6 Bank',
  'XP Investimentos',
  'Caixa',
  'Banco do Brasil',
  'Nomad',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onAddCreditCard,
  editingTransaction,
  creditCards,
  defaultDate = '2026-09-28',
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<CategoryId>('credit_card');
  const [description, setDescription] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [amountMode, setAmountMode] = useState<'installment' | 'total'>('total');
  const [date, setDate] = useState(defaultDate);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [cardName, setCardName] = useState(creditCards[0]?.name || 'Nubank Ultravioleta');
  const [enableInstallments, setEnableInstallments] = useState<boolean>(true);
  const [currentInstallment, setCurrentInstallment] = useState<number>(1);
  const [totalInstallments, setTotalInstallments] = useState<number>(1);
  const [enableRecurrence, setEnableRecurrence] = useState<boolean>(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState<number>(6);
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [saveCardToCardsList, setSaveCardToCardsList] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setSubCategory(editingTransaction.subCategory || '');
      setAmountStr(editingTransaction.amount.toString());
      setAmountMode('installment');
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setCardName(editingTransaction.cardName || creditCards[0]?.name || '');
      const hasInst = !!(editingTransaction.totalInstallments && editingTransaction.totalInstallments > 1);
      setEnableInstallments(hasInst);
      setCurrentInstallment(editingTransaction.currentInstallment || 1);
      setTotalInstallments(editingTransaction.totalInstallments || 1);
      setEnableRecurrence(false);
      setIsPaid(editingTransaction.isPaid);
      setNotes(editingTransaction.notes || '');
      setSaveCardToCardsList(false);
    } else {
      setType('expense');
      setCategory('credit_card');
      setDescription('');
      setSubCategory('');
      setAmountStr('');
      setAmountMode('total');
      setDate(defaultDate);
      setPaymentMethod('credit_card');
      setCardName(creditCards[0]?.name || 'Nubank Ultravioleta');
      setEnableInstallments(true);
      setCurrentInstallment(1);
      setTotalInstallments(1);
      setEnableRecurrence(false);
      setRecurrenceMonths(6);
      setIsPaid(true);
      setNotes('');
      setSaveCardToCardsList(false);
    }
    setError(null);
  }, [editingTransaction, isOpen, defaultDate, creditCards]);

  // Compute calculated installment and total amounts
  const amountCalculations = useMemo(() => {
    const rawVal = parseFloat(amountStr.replace(',', '.')) || 0;
    const installments = enableInstallments && totalInstallments > 1 ? totalInstallments : 1;

    let installmentAmount = rawVal;
    let totalPurchaseAmount = rawVal;

    if (installments > 1) {
      if (amountMode === 'total') {
        installmentAmount = rawVal / installments;
        totalPurchaseAmount = rawVal;
      } else {
        installmentAmount = rawVal;
        totalPurchaseAmount = rawVal * installments;
      }
    }

    const endDate = installments > 1 ? addMonthsToDateString(date, installments - 1) : date;
    const [, startMonth] = date.split('-').map(Number);
    const [startYear] = date.split('-').map(Number);
    const [endYear, endMonth] = (endDate || '').split('-').map(Number);

    const startLabel = startMonth ? `${getMonthName(startMonth - 1)}/${startYear}` : '';
    const endLabel = endMonth ? `${getMonthName(endMonth - 1)}/${endYear}` : '';

    return {
      rawVal,
      installments,
      installmentAmount,
      totalPurchaseAmount,
      startLabel,
      endLabel,
    };
  }, [amountStr, enableInstallments, totalInstallments, amountMode, date]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('salary');
      setPaymentMethod('pix');
      setEnableInstallments(false);
      setTotalInstallments(1);
    } else {
      setCategory('credit_card');
      setPaymentMethod('credit_card');
      setEnableInstallments(true);
    }
  };

  interface QuickSuggestion {
    desc: string;
    cat: CategoryId;
    pay?: PaymentMethod;
  }

  const quickIncomeSuggestions: QuickSuggestion[] = [
    { desc: 'Salário Mensal', cat: 'salary', pay: 'bank_transfer' },
    { desc: 'Comissão de Vendas', cat: 'commission', pay: 'pix' },
    { desc: 'Bônus por Metas', cat: 'commission', pay: 'pix' },
    { desc: 'Adiantamento Quinzenal', cat: 'salary', pay: 'pix' },
    { desc: 'Freelance / Consultoria', cat: 'freelance', pay: 'pix' },
  ];

  const quickExpenseSuggestions: QuickSuggestion[] = [
    { desc: 'Supermercado Mensal', cat: 'credit_card', pay: 'credit_card' },
    { desc: 'Aluguel do Imóvel', cat: 'fixed_debt', pay: 'boleto' },
    { desc: 'Conta de Luz', cat: 'fixed_debt', pay: 'pix' },
    { desc: 'Internet Fibra', cat: 'fixed_debt', pay: 'boleto' },
    { desc: 'Restaurante / Almoço', cat: 'general_expenses', pay: 'pix' },
    { desc: 'Abastecimento Carro', cat: 'credit_card', pay: 'credit_card' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr.replace(',', '.'));

    if (!description.trim()) {
      setError('Por favor, informe a descrição da transação.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor monetário válido maior que zero.');
      return;
    }

    if (!date) {
      setError('Informe a data da transação.');
      return;
    }

    const finalAmountPerMonth =
      enableInstallments && totalInstallments > 1
        ? amountCalculations.installmentAmount
        : parsedAmount;

    // Check if cardName should be saved to user's cards list
    if (
      saveCardToCardsList &&
      cardName.trim() &&
      onAddCreditCard &&
      !creditCards.some((c) => c.name.toLowerCase() === cardName.trim().toLowerCase())
    ) {
      onAddCreditCard({
        name: cardName.trim(),
        limit: 5000,
        closingDay: 20,
        dueDay: 28,
        color: '#1e293b',
      });
    }

    onSave(
      {
        type,
        category,
        description: description.trim(),
        subCategory: subCategory.trim() || undefined,
        amount: finalAmountPerMonth,
        date,
        paymentMethod,
        cardName:
          paymentMethod === 'credit_card' || category === 'credit_card'
            ? cardName.trim()
            : undefined,
        currentInstallment:
          enableInstallments && totalInstallments > 1 ? currentInstallment : undefined,
        totalInstallments:
          enableInstallments && totalInstallments > 1 ? totalInstallments : undefined,
        isPaid,
        notes: notes.trim() || undefined,
      },
      editingTransaction?.id,
      !editingTransaction && enableRecurrence && recurrenceMonths > 1
        ? { repeatMonthsCount: recurrenceMonths }
        : undefined
    );

    onClose();
  };

  const handleDeleteCurrent = () => {
    if (!editingTransaction || !onDelete) return;

    if (editingTransaction.installmentGroupId || (editingTransaction.totalInstallments && editingTransaction.totalInstallments > 1)) {
      const deleteAll = confirm(
        `Esta é a parcela ${editingTransaction.currentInstallment || 1}/${editingTransaction.totalInstallments || 1} de "${editingTransaction.description}".\n\nDeseja excluir TODAS as parcelas deste lançamento?\n\n• OK: Excluir TODAS as parcelas\n• Cancelar: Excluir APENAS esta parcela`
      );
      onDelete(editingTransaction.id, deleteAll);
    } else {
      if (confirm(`Deseja realmente excluir "${editingTransaction.description}"?`)) {
        onDelete(editingTransaction.id, false);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 text-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {editingTransaction ? 'Editar Item' : 'Novo Item / Lançamento'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              {type === 'income'
                ? 'Registre qualquer salário, comissão ou entrada'
                : 'Registre compras no cartão, dívidas ou gastos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 max-h-[84vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Type Selector (Entrada vs Saída) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>+ Entrada (Receita)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>- Saída (Despesa / Dívida)</span>
            </button>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categoria Principal
            </label>
            {type === 'income' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('salary')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    category === 'salary'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Salários</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Fixo, adiantamentos</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('commission')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    category === 'commission'
                      ? 'border-teal-500 bg-teal-950/40 text-teal-300 font-semibold ring-1 ring-teal-500'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>Comissões</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Metas e bônus</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('freelance')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    category === 'freelance'
                      ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-semibold ring-1 ring-sky-500'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Freelance / Extra</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Serviços extras</div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('credit_card');
                    setPaymentMethod('credit_card');
                    setEnableInstallments(true);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    category === 'credit_card'
                      ? 'border-purple-500 bg-purple-950/40 text-purple-300 font-semibold ring-1 ring-purple-500'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Compras de Cartão</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Faturas e parcelados</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCategory('fixed_debt');
                    if (paymentMethod === 'credit_card') setPaymentMethod('boleto');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    category === 'fixed_debt'
                      ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-semibold ring-1 ring-amber-500'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Dívidas Fixas</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Aluguel, contas fixas</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCategory('general_expenses');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    category === 'general_expenses'
                      ? 'border-rose-500 bg-rose-950/40 text-rose-300 font-semibold ring-1 ring-rose-500'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Gastos Variáveis</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Mercado, lazer, dia a dia</div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Sugestões:</span>
            {(type === 'income' ? quickIncomeSuggestions : quickExpenseSuggestions).map((s) => (
              <button
                key={s.desc}
                type="button"
                onClick={() => {
                  setDescription(s.desc);
                  setCategory(s.cat);
                  if (s.pay) setPaymentMethod(s.pay);
                  if (s.cat === 'credit_card') setEnableInstallments(true);
                }}
                className="px-2 py-0.5 text-[11px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-md transition-colors"
              >
                {s.desc}
              </button>
            ))}
          </div>

          {/* Description & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descrição do Item *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Notebook, Supermercado, Aluguel, Salário..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subcategoria livre
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="Ex: Eletrônicos, Mercado..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  {enableInstallments && totalInstallments > 1
                    ? amountMode === 'total'
                      ? 'Valor Total da Compra (R$) *'
                      : 'Valor de Cada Parcela (R$) *'
                    : 'Valor do Item (R$) *'}
                </label>
                {enableInstallments && totalInstallments > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAmountMode(amountMode === 'total' ? 'installment' : 'total')
                    }
                    className="text-[11px] text-purple-400 hover:underline font-medium"
                  >
                    {amountMode === 'total' ? 'Mudar p/ valor de parcela' : 'Mudar p/ valor total'}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data do Primeiro Lançamento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method & Custom Credit Card input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const val = e.target.value as PaymentMethod;
                  setPaymentMethod(val);
                  if (val === 'credit_card') setEnableInstallments(true);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                <option value="credit_card">Cartão de Crédito</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="bank_transfer">Transferência / TED</option>
                <option value="cash">Dinheiro em Espécie</option>
              </select>
            </div>

            {/* If Credit Card: Custom Card Input & Shortcuts */}
            {paymentMethod === 'credit_card' || category === 'credit_card' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cartão (Digite qualquer um)
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Ex: Itaú, Santander, C6, Nubank, Bradesco..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status de Pagamento
                </label>
                <div className="flex items-center gap-2 pt-1.5">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      {type === 'income' ? 'Já recebido na conta' : 'Já liquidado/pago neste mês'}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick Card Shortcuts if Credit Card is selected */}
          {(paymentMethod === 'credit_card' || category === 'credit_card') && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500">Seus cartões cadastrados:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {creditCards.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCardName(c.name)}
                    className={`px-2 py-0.5 text-[11px] rounded-lg border font-mono transition-colors ${
                      cardName.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-purple-600 text-white border-purple-500 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Bank Presets */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] text-slate-500">Bancos populares:</span>
                {COMMON_BANKS.map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setCardName(bank)}
                    className="px-1.5 py-0.2 text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded transition-colors"
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: PARCELAMENTO MULTI-MÊS */}
          {type === 'expense' && (
            <div className="p-3.5 bg-purple-950/30 border border-purple-900/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <CardIcon className="w-4 h-4 text-purple-400" />
                  <span>Parcelamento nos Próximos Meses</span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs text-purple-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableInstallments}
                    onChange={(e) => {
                      setEnableInstallments(e.target.checked);
                      if (!e.target.checked) setTotalInstallments(1);
                      else if (totalInstallments === 1) setTotalInstallments(10);
                    }}
                    className="rounded border-purple-700 bg-slate-950 text-purple-500 focus:ring-purple-500"
                  />
                  <span>Dividir em parcelas</span>
                </label>
              </div>

              {enableInstallments && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-purple-300 font-medium mb-1">
                        Parcela Inicial
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={totalInstallments}
                        value={currentInstallment}
                        onChange={(e) => setCurrentInstallment(parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-purple-800/80 rounded-lg font-mono font-medium text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-300 font-medium mb-1">
                        Total de Parcelas (ex: 10x)
                      </label>
                      <select
                        value={totalInstallments}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setTotalInstallments(val);
                          if (currentInstallment > val) setCurrentInstallment(val);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-purple-800/80 rounded-lg font-mono font-medium text-white"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                          <option key={n} value={n}>
                            {n}x parcelas mensais
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {totalInstallments > 1 && (
                    <div className="p-2.5 bg-slate-950/80 border border-purple-800/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono font-semibold text-purple-300">
                        <span>
                          {totalInstallments}x de{' '}
                          {formatCurrency(amountCalculations.installmentAmount)}/mês
                        </span>
                        <span>Total: {formatCurrency(amountCalculations.totalPurchaseAmount)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-400">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Serão geradas parcelas de{' '}
                          <strong>{amountCalculations.startLabel}</strong> até{' '}
                          <strong>{amountCalculations.endLabel}</strong>. Você as verá
                          automaticamente nos próximos meses!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION: RECORRÊNCIA FIXA */}
          {(!enableInstallments || totalInstallments <= 1) && !editingTransaction && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Repeat className="w-4 h-4 text-emerald-400" />
                  <span>Repetir todo mês (Recorrência Fixa)</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableRecurrence}
                  onChange={(e) => setEnableRecurrence(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {enableRecurrence && (
                <div className="pt-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">Repetir automaticamente por:</span>
                  <div className="flex items-center gap-1">
                    {[3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setRecurrenceMonths(m)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          recurrenceMonths === m
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {m} meses
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Loja onde comprou, observações de garantia..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2.5">
            {editingTransaction && onDelete ? (
              <button
                type="button"
                onClick={handleDeleteCurrent}
                className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Item</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>
                  {editingTransaction
                    ? 'Salvar Alterações'
                    : enableInstallments && totalInstallments > 1
                    ? `Gerar ${totalInstallments} Parcelas`
                    : 'Adicionar Transação'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
