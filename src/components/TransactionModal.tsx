import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, CreditCard as CardIcon, Calendar, Trash2 } from 'lucide-react';
import {
  CategoryId,
  CreditCard,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '../types/finance';
import { formatCurrency, addMonthsToDateString, getMonthName } from '../utils/formatters';

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
  const [amountStr, setAmountStr] = useState('');
  const [amountMode, setAmountMode] = useState<'installment' | 'total'>('total');
  const [date, setDate] = useState(defaultDate);
  const [cardName, setCardName] = useState(creditCards[0]?.name || 'Nubank');
  const [enableInstallments, setEnableInstallments] = useState<boolean>(true);
  const [currentInstallment, setCurrentInstallment] = useState<number>(1);
  const [totalInstallments, setTotalInstallments] = useState<number>(1);
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setAmountStr(editingTransaction.amount.toString());
      setAmountMode('installment');
      setDate(editingTransaction.date);
      setCardName(editingTransaction.cardName || creditCards[0]?.name || 'Nubank');
      const hasInst = !!(editingTransaction.totalInstallments && editingTransaction.totalInstallments > 1);
      setEnableInstallments(hasInst);
      setCurrentInstallment(editingTransaction.currentInstallment || 1);
      setTotalInstallments(editingTransaction.totalInstallments || 1);
      setIsPaid(editingTransaction.isPaid);
      setNotes(editingTransaction.notes || '');
    } else {
      setType('expense');
      setCategory('credit_card');
      setDescription('');
      setAmountStr('');
      setAmountMode('total');
      setDate(defaultDate);
      setCardName(creditCards[0]?.name || 'Nubank');
      setEnableInstallments(true);
      setCurrentInstallment(1);
      setTotalInstallments(1);
      setIsPaid(true);
      setNotes('');
    }
    setError(null);
  }, [editingTransaction, isOpen, defaultDate, creditCards]);

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
      setEnableInstallments(false);
      setTotalInstallments(1);
    } else {
      setCategory('credit_card');
      setEnableInstallments(true);
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

    onSave(
      {
        type,
        category,
        description: description.trim(),
        amount: finalAmountPerMonth,
        date,
        paymentMethod: resolvedPaymentMethod,
        cardName: isCard ? cardName.trim() || 'Cartão' : undefined,
        currentInstallment:
          isCard && enableInstallments && totalInstallments > 1 ? currentInstallment : undefined,
        totalInstallments:
          isCard && enableInstallments && totalInstallments > 1 ? totalInstallments : undefined,
        isPaid: isCard ? true : isPaid,
        notes: notes.trim() || undefined,
      },
      editingTransaction?.id
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

  const isCardExpense = type === 'expense' && category === 'credit_card';
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
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
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
                </div>
              )}
            </div>
          )}

          {/* DÍVIDAS FIXAS & GASTOS VARIÁVEIS & ENTRADAS: Status de pagamento (Formas de pagamento removed) */}
          {!isCardExpense && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status do Lançamento
              </span>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>
                  {type === 'income' ? 'Já recebido na conta' : 'Já pago / liquidado'}
                </span>
              </label>
            </div>
          )}

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
