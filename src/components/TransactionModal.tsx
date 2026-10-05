import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, CreditCard as CardIcon, Calendar, Trash2 } from 'lucide-react';
import {
  CategoryId,
  CreditCard,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '../types/finance';
import {
  formatCurrency,
  addMonthsToDateString,
  getMonthName,
  calculateCardDueDate,
  formatDateBR,
} from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tx: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string,
    options?: {
      repeatMonthsCount?: number;
      updateAllInGroup?: boolean;
      newTotalInstallments?: number;
    }
  ) => void;
  onDelete?: (id: string, deleteAllInGroup?: boolean) => void;
  onAddCreditCard?: (card: Omit<CreditCard, 'id'>) => void;
  editingTransaction?: Transaction | null;
  creditCards: CreditCard[];
  defaultDate?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onAddCreditCard,
  editingTransaction,
  creditCards,
  defaultDate,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<CategoryId>('credit_card');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [amountMode, setAmountMode] = useState<'installment' | 'total'>('total');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [cardName, setCardName] = useState(creditCards[0]?.name || 'Nubank');
  const [enableInstallments, setEnableInstallments] = useState<boolean>(true);
  const [currentInstallment, setCurrentInstallment] = useState<number>(1);
  const [totalInstallments, setTotalInstallments] = useState<number>(1);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [scheduleOnDueDate, setScheduleOnDueDate] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [updateAllInGroup, setUpdateAllInGroup] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected credit card
  const selectedCard = useMemo(() => {
    return (
      creditCards.find((c) => c.name.toLowerCase() === cardName.trim().toLowerCase()) ||
      creditCards[0]
    );
  }, [creditCards, cardName]);

  // Invoice due date calculated using closingDay and dueDay
  const invoiceDueDate = useMemo(() => {
    if (!selectedCard) return date;
    return calculateCardDueDate(date, selectedCard.closingDay, selectedCard.dueDay);
  }, [date, selectedCard]);

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      const hasInst = !!(
        editingTransaction.totalInstallments && editingTransaction.totalInstallments > 1
      );
      if (hasInst && editingTransaction.totalInstallments) {
        const totalPurchaseVal =
          editingTransaction.amount * editingTransaction.totalInstallments;
        setAmountStr(totalPurchaseVal.toFixed(2));
        setAmountMode('total');
      } else {
        setAmountStr(editingTransaction.amount.toString());
        setAmountMode('total');
      }
      setDate(editingTransaction.date);
      setCardName(editingTransaction.cardName || creditCards[0]?.name || 'Nubank');
      setEnableInstallments(hasInst);
      setCurrentInstallment(editingTransaction.currentInstallment || 1);
      setTotalInstallments(editingTransaction.totalInstallments || 1);
      setIsPaid(editingTransaction.isPaid);
      setNotes(editingTransaction.notes || '');
      setUpdateAllInGroup(true);
    } else {
      setType('expense');
      setCategory('credit_card');
      setDescription('');
      setAmountStr('');
      setAmountMode('total');
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setDate(defaultDate || todayStr);
      setCardName(creditCards[0]?.name || 'Nubank');
      setEnableInstallments(true);
      setCurrentInstallment(1);
      setTotalInstallments(1);
      setIsPaid(false); // Credit cards are unpaid until the card invoice is paid!
      setScheduleOnDueDate(true);
      setNotes('');
      setUpdateAllInGroup(true);
    }
    setError(null);
  }, [editingTransaction, isOpen, defaultDate, creditCards]);

  const toggleAmountMode = () => {
    const rawVal = parseFloat(amountStr.replace(',', '.')) || 0;
    const installments = totalInstallments > 1 ? totalInstallments : 1;

    if (amountMode === 'total') {
      setAmountMode('installment');
      if (rawVal > 0) {
        setAmountStr((rawVal / installments).toFixed(2));
      }
    } else {
      setAmountMode('total');
      if (rawVal > 0) {
        setAmountStr((rawVal * installments).toFixed(2));
      }
    }
  };

  const isCardExpense = type === 'expense' && category === 'credit_card';

  // Compute calculated installment and total amounts for credit card
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

    const effectiveBaseDate = isCardExpense && scheduleOnDueDate ? invoiceDueDate : date;
    const endDate = installments > 1 ? addMonthsToDateString(effectiveBaseDate, installments - 1) : effectiveBaseDate;
    const [, startMonth] = (effectiveBaseDate || '').split('-').map(Number);
    const [startYear] = (effectiveBaseDate || '').split('-').map(Number);
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
  }, [amountStr, enableInstallments, totalInstallments, amountMode, date, isCardExpense, scheduleOnDueDate, invoiceDueDate]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('salary');
      setEnableInstallments(false);
      setTotalInstallments(1);
      setIsPaid(true); // Income received
    } else {
      setCategory('credit_card');
      setEnableInstallments(true);
      setIsPaid(false); // Cards default to unpaid until invoice is paid
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr.replace(',', '.'));

    if (!description.trim()) {
      setError('Por favor, informe a descrição.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    if (!date) {
      setError('Informe a data.');
      return;
    }

    const isCard = type === 'expense' && category === 'credit_card';
    const finalAmountPerMonth =
      isCard && enableInstallments && totalInstallments > 1
        ? amountCalculations.installmentAmount
        : parsedAmount;

    // Determine clean paymentMethod
    let resolvedPaymentMethod: PaymentMethod = 'pix';
    if (isCard) {
      resolvedPaymentMethod = 'credit_card';
    } else if (type === 'income') {
      resolvedPaymentMethod = 'bank_transfer';
    } else if (category === 'fixed_debt') {
      resolvedPaymentMethod = 'boleto';
    } else {
      resolvedPaymentMethod = 'pix';
    }

    // Auto-register card if new
    if (
      isCard &&
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

    // If card expense and user enabled schedule on due date, save with invoice due date
    const effectiveDate = isCard && scheduleOnDueDate ? invoiceDueDate : date;

    onSave(
      {
        type,
        category,
        description: description.trim(),
        amount: finalAmountPerMonth,
        date: effectiveDate,
        paymentMethod: resolvedPaymentMethod,
        cardName: isCard ? cardName.trim() || 'Cartão' : undefined,
        currentInstallment:
          isCard && enableInstallments && totalInstallments > 1 ? currentInstallment : undefined,
        totalInstallments:
          isCard && enableInstallments && totalInstallments > 1 ? totalInstallments : undefined,
        installmentGroupId: editingTransaction?.installmentGroupId,
        isPaid: isPaid,
        notes: notes.trim() || undefined,
      },
      editingTransaction?.id,
      {
        updateAllInGroup,
        newTotalInstallments: totalInstallments,
      }
    );

    onClose();
  };

  const handleDeleteCurrent = () => {
    if (!editingTransaction || !onDelete) return;

    if (
      editingTransaction.installmentGroupId ||
      (editingTransaction.totalInstallments && editingTransaction.totalInstallments > 1)
    ) {
      const deleteAll = confirm(
        `Esta é a parcela ${editingTransaction.currentInstallment || 1}/${
          editingTransaction.totalInstallments || 1
        } de "${editingTransaction.description}".\n\nDeseja excluir TODAS as parcelas deste lançamento?\n\n• OK: Excluir TODAS as parcelas\n• Cancelar: Excluir APENAS esta parcela`
      );
      onDelete(editingTransaction.id, deleteAll);
    } else {
      if (confirm(`Deseja realmente excluir "${editingTransaction.description}"?`)) {
        onDelete(editingTransaction.id, false);
      }
    }
    onClose();
  };

  const isFixedDebt = type === 'expense' && category === 'fixed_debt';
  const isVariableExpense = type === 'expense' && category === 'general_expenses';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              {editingTransaction?.totalInstallments && editingTransaction.totalInstallments > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                  Parcela {editingTransaction.currentInstallment || 1}/{editingTransaction.totalInstallments}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {type === 'income' ? 'Registre uma entrada' : 'Registre uma despesa'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Type Selector (Entrada vs Saída) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>+ Entrada</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>- Saída</span>
            </button>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de {type === 'income' ? 'Entrada' : 'Despesa'}
            </label>

            {type === 'income' ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('salary')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    category === 'salary'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Salário
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('commission')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    category === 'commission'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Comissão
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('freelance')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    category === 'freelance'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Outros / Extra
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('credit_card');
                    setEnableInstallments(true);
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    category === 'credit_card'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Cartão de Crédito
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('fixed_debt');
                    setEnableInstallments(false);
                    setTotalInstallments(1);
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    category === 'fixed_debt'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Dívidas Fixas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('general_expenses');
                    setEnableInstallments(false);
                    setTotalInstallments(1);
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    category === 'general_expenses'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Gastos Variáveis
                </button>
              </div>
            )}
          </div>

          {/* Description (subcategoria livre removed per user request) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isCardExpense
                  ? 'Ex: Supermercado, Eletrônico, Roupa...'
                  : isFixedDebt
                  ? 'Ex: Aluguel, Luz, Internet...'
                  : type === 'income'
                  ? 'Ex: Salário da Empresa, Comissão Projeto X...'
                  : 'Ex: Almoço, Combustível, Farmácia...'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isCardExpense && totalInstallments > 1
                    ? amountMode === 'total'
                      ? 'Valor Total da Compra *'
                      : 'Valor da Parcela *'
                    : 'Valor *'}
                </label>
                {isCardExpense && totalInstallments > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAmountMode(amountMode === 'total' ? 'installment' : 'total')
                    }
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium"
                  >
                    {amountMode === 'total' ? 'Valor por parcela' : 'Valor total'}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* CREDIT CARD SPECIFIC (Only choose card and installments) */}
          {isCardExpense && (
            <div className="space-y-3 p-3.5 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                  Qual cartão será parcelada a dívida?
                </label>
                {creditCards.length > 0 ? (
                  <select
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Ex: Nubank, Itaú, Bradesco..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                )}
              </div>

              {/* Installments selection */}
              <div>
                <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                  Número de parcelas
                </label>
                <select
                  value={totalInstallments}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setTotalInstallments(val);
                    if (currentInstallment > val) setCurrentInstallment(val);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value={1}>À vista (1x)</option>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                    <option key={n} value={n}>
                      {n}x parcelas mensais
                    </option>
                  ))}
                </select>
              </div>

              {/* Card billing cycle and due date projection */}
              {selectedCard && (
                <div className="p-3 bg-white/90 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-950 dark:text-purple-200">
                      Ciclo de Fatura ({selectedCard.name})
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-purple-700 dark:text-purple-300">
                      <span>Fecha dia <strong>{selectedCard.closingDay}</strong></span>
                      <span>·</span>
                      <span>Vence dia <strong>{selectedCard.dueDay}</strong></span>
                    </div>
                  </div>

                  <div className="text-[11px] p-2 rounded-lg border leading-relaxed bg-purple-50/80 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900/50">
                    {parseInt(date.split('-')[2] || '0') >= selectedCard.closingDay ? (
                      <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                        <span className="shrink-0 mt-0.5">⚡</span>
                        <span>
                          Compra no dia {date.split('-')[2]}: <strong>A fatura deste mês já virou</strong> (fecha dia {selectedCard.closingDay}). Esta compra entrará na fatura com vencimento em <strong>{formatDateBR(invoiceDueDate)}</strong>.
                        </span>
                      </p>
                    ) : (
                      <p className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <span className="shrink-0 mt-0.5">📅</span>
                        <span>
                          Compra antes do fechamento: entra na fatura que vence em <strong>{formatDateBR(invoiceDueDate)}</strong>.
                        </span>
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-2 pt-1 text-xs text-purple-900 dark:text-purple-200 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleOnDueDate}
                      onChange={(e) => setScheduleOnDueDate(e.target.checked)}
                      className="rounded border-purple-300 dark:border-purple-700 text-purple-600 focus:ring-purple-500 w-4 h-4 mt-0.5"
                    />
                    <span>
                      Lançar vencimento da compra no dia de pagar o cartão (<strong>{formatDateBR(invoiceDueDate)}</strong>)
                    </span>
                  </label>
                </div>
              )}

              {totalInstallments > 1 && (
                <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono font-bold text-purple-700 dark:text-purple-300">
                    <span>
                      {totalInstallments}x de{' '}
                      {formatCurrency(amountCalculations.installmentAmount)}/mês
                    </span>
                    <span>Total: {formatCurrency(amountCalculations.totalPurchaseAmount)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Vencimentos de <strong>{amountCalculations.startLabel}</strong> até{' '}
                      <strong>{amountCalculations.endLabel}</strong>
                    </span>
                  </div>

                  {editingTransaction && (
                    <label className="flex items-start gap-2 pt-2 border-t border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={updateAllInGroup}
                        onChange={(e) => setUpdateAllInGroup(e.target.checked)}
                        className="rounded border-purple-300 dark:border-purple-700 text-purple-600 focus:ring-purple-500 w-4 h-4 mt-0.5"
                      />
                      <span>
                        Aplicar alterações a <strong>todas as parcelas</strong> desta compra (recalcula valores e datas futuras)
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status do Lançamento: Para todos os tipos (inclusive cartão de crédito) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Status do Pagamento
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {isCardExpense
                  ? 'Fatura aberta fica pendente até você confirmar o pagamento do cartão'
                  : 'Indique se o valor já foi quitado/recebido ou se está pendente'}
              </span>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className={isPaid ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500'}>
                {isPaid
                  ? isCardExpense
                    ? 'Fatura Paga'
                    : type === 'income'
                    ? 'Já Recebido'
                    : 'Já Pago'
                  : isCardExpense
                  ? 'Fatura Aberta (A Pagar)'
                  : 'Pendente'}
              </span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações adicionais..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
            {editingTransaction && onDelete ? (
              <button
                type="button"
                onClick={handleDeleteCurrent}
                className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>
                  {editingTransaction
                    ? 'Salvar'
                    : isCardExpense && totalInstallments > 1
                    ? `Gerar ${totalInstallments} Parcelas`
                    : 'Adicionar'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
