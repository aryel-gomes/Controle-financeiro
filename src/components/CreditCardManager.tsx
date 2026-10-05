import React, { useState } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { CreditCard, Transaction } from '../types/finance';
import { formatCurrency, formatPercent, formatDateBR } from '../utils/formatters';

interface CreditCardManagerProps {
  creditCards: CreditCard[];
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  onUpdateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  onDeleteCreditCard: (id: string) => void;
  onMarkCardInvoicePaid?: (cardName: string, isPaid: boolean) => void;
  onToggleTransactionPaid?: (id: string) => void;
  selectedMonthName: string;
}

const CARD_COLOR_PRESETS = [
  { name: 'Roxo Nubank', value: '#820ad1' },
  { name: 'Laranja Inter', value: '#ff7a00' },
  { name: 'Azul Itaú / Caixa', value: '#004990' },
  { name: 'Vermelho Santander / Bradesco', value: '#cc092f' },
  { name: 'Preto Carbon / Black', value: '#1e293b' },
  { name: 'Dourado Gold', value: '#d97706' },
  { name: 'Esmeralda', value: '#059669' },
  { name: 'Cinza Titânio', value: '#475569' },
];

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  creditCards,
  transactions,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddCreditCard,
  onUpdateCreditCard,
  onDeleteCreditCard,
  onMarkCardInvoicePaid,
  onToggleTransactionPaid,
  selectedMonthName,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards[0]?.id || '');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Form states for new/editing card
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [closingDay, setClosingDay] = useState(24);
  const [dueDay, setDueDay] = useState(3);
  const [color, setColor] = useState('#820ad1');
  const [formError, setFormError] = useState<string | null>(null);

  const cardTransactions = transactions.filter(
    (tx) => tx.type === 'expense' && (tx.category === 'credit_card' || tx.paymentMethod === 'credit_card')
  );

  // Overall statistics for cards in this month
  const cardStats = React.useMemo(() => {
    let totalAll = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidCardsCount = 0;
    let pendingCardsCount = 0;

    creditCards.forEach((card) => {
      const txs = cardTransactions.filter(
        (tx) => tx.cardName === card.name || (!tx.cardName && card.id === creditCards[0]?.id)
      );
      const invTotal = txs.reduce((sum, t) => sum + t.amount, 0);
      const invPaid = txs.filter((t) => t.isPaid).reduce((sum, t) => sum + t.amount, 0);
      const invPending = invTotal - invPaid;

      totalAll += invTotal;
      totalPaid += invPaid;
      totalPending += invPending;

      if (txs.length > 0 && txs.every((t) => t.isPaid)) {
        paidCardsCount++;
      } else if (txs.length > 0) {
        pendingCardsCount++;
      }
    });

    return { totalAll, totalPaid, totalPending, paidCardsCount, pendingCardsCount };
  }, [creditCards, cardTransactions]);

  // Filtered cards based on statusFilter
  const displayedCards = React.useMemo(() => {
    if (statusFilter === 'all') return creditCards;
    return creditCards.filter((card) => {
      const txs = cardTransactions.filter(
        (tx) => tx.cardName === card.name || (!tx.cardName && card.id === creditCards[0]?.id)
      );
      const isPaid = txs.length > 0 && txs.every((t) => t.isPaid);
      if (statusFilter === 'paid') return isPaid;
      if (statusFilter === 'pending') return !isPaid && txs.length > 0;
      return true;
    });
  }, [creditCards, cardTransactions, statusFilter]);

  const handleOpenAddCard = () => {
    setEditingCard(null);
    setName('');
    setBank('');
    setLimitStr('');
    setClosingDay(20);
    setDueDay(28);
    setColor('#1e293b');
    setFormError(null);
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (card: CreditCard, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(card);
    setName(card.name);
    setBank(card.bank || '');
    setLimitStr(card.limit.toString());
    setClosingDay(card.closingDay);
    setDueDay(card.dueDay);
    setColor(card.color || '#1e293b');
    setFormError(null);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitStr.replace(',', '.'));

    if (!name.trim()) {
      setFormError('Por favor, informe o nome do cartão.');
      return;
    }

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setFormError('Informe um limite válido maior que zero.');
      return;
    }

    if (editingCard) {
      onUpdateCreditCard(editingCard.id, {
        name: name.trim(),
        bank: bank.trim() || undefined,
        limit: parsedLimit,
        closingDay,
        dueDay,
        color,
      });
    } else {
      onAddCreditCard({
        name: name.trim(),
        bank: bank.trim() || undefined,
        limit: parsedLimit,
        closingDay,
        dueDay,
        color,
      });
    }

    setIsCardModalOpen(false);
  };

  const handleDeleteCard = (card: CreditCard, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Deseja realmente excluir o cartão "${card.name}"?\n(As transações já registradas serão mantidas no histórico).`
      )
    ) {
      onDeleteCreditCard(card.id);
      if (selectedCardId === card.id) {
        const remaining = creditCards.filter((c) => c.id !== card.id);
        setSelectedCardId(remaining[0]?.id || '');
      }
    }
  };

  const selectedCard = creditCards.find((c) => c.id === selectedCardId) || creditCards[0];

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-white dark:bg-[#121927] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Cartões de Crédito ({selectedMonthName})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe faturas, limites, datas de vencimento e confirme o pagamento dos cartões
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenAddCard}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>+ Novo Cartão</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-xl transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Compra</span>
          </button>
        </div>
      </div>

      {/* Overview Cards: Total Faturas, Cartões Pagos, Faturas Abertas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white dark:bg-[#121927] rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Total Faturas do Mês
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(cardStats.totalAll)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CardIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-[#121927] rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
              Cartões Pagos (Debitado)
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(cardStats.totalPaid)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {cardStats.paidCardsCount} fatura(s) quitada(s)
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-[#121927] rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">
              Faturas Abertas (A Pagar)
            </span>
            <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(cardStats.totalPending)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {cardStats.pendingCardsCount} fatura(s) a vencer
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter tabs: Todos, Faturas Abertas, Cartões Pagos */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit border border-slate-200/60 dark:border-slate-800/60">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'all'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Todos os Cartões ({creditCards.length})
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Faturas Abertas</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px]">
            {cardStats.pendingCardsCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            statusFilter === 'paid'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Cartões Pagos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px]">
            {cardStats.paidCardsCount}
          </span>
        </button>
      </div>

      {/* Credit Cards Grid or Empty State */}
      {creditCards.length === 0 ? (
        <div className="bg-white dark:bg-[#121927] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
            <CardIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nenhum cartão cadastrado ainda</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Cadastre seus cartões de crédito (Itaú, Santander, Nubank, Inter, Bradesco, C6, etc.) para acompanhar limites, faturas e compras parceladas.
          </p>
          <button
            onClick={handleOpenAddCard}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Primeiro Cartão</span>
          </button>
        </div>
      ) : displayedCards.length === 0 ? (
        <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nenhum cartão encontrado para o filtro "{statusFilter === 'paid' ? 'Cartões Pagos' : 'Faturas Abertas'}".
          </p>
          <button
            onClick={() => setStatusFilter('all')}
            className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
          >
            Ver todos os cartões
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedCards.map((card) => {
            const txsOnCard = cardTransactions.filter(
              (tx) => tx.cardName === card.name || (!tx.cardName && card.id === creditCards[0]?.id)
            );
            const currentInvoice = txsOnCard.reduce((acc, curr) => acc + curr.amount, 0);
            const paidInvoice = txsOnCard.filter((tx) => tx.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
            const pendingInvoice = currentInvoice - paidInvoice;
            const isInvoiceFullyPaid = txsOnCard.length > 0 && txsOnCard.every((tx) => tx.isPaid);

            const availableLimit = Math.max(0, card.limit - currentInvoice);
            const usedPercent = card.limit > 0 ? (currentInvoice / card.limit) * 100 : 0;
            const isOverCardLimit = usedPercent >= 100;
            const isWarning = usedPercent >= 80;

            const isSelected = selectedCardId === card.id;

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`rounded-2xl p-5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-500 shadow-md ring-1 ring-purple-500 bg-purple-50/40 dark:bg-[#151D2E]'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121927] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Card Bar with Edit/Delete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: card.color || '#7c3aed' }}
                      >
                        <CardIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{card.name}</h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{card.bank || 'Cartão'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditCard(card, e)}
                        title="Editar dados do cartão"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {creditCards.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteCard(card, e)}
                          title="Excluir este cartão"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Invoice Amount */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium block">
                        Fatura Atual
                      </span>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(currentInvoice)}
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      Limite: {formatCurrency(card.limit)}
                    </span>
                  </div>

                  {/* Progress bar of Card limit */}
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverCardLimit
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-400'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, usedPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice dates & Available limit */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium block">
                      Disponível
                    </span>
                    <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatCurrency(availableLimit)}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium block">
                      Fecha dia
                    </span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                      {card.closingDay}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium block">
                      Vence dia
                    </span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                      {card.dueDay}
                    </span>
                  </div>
                </div>

                {/* Status da Fatura e Ação de Pagamento */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    {txsOnCard.length === 0 ? (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        Sem compras no mês
                      </span>
                    ) : isInvoiceFullyPaid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Cartão Pago (Debitado)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Fatura Aberta · Vence dia {card.dueDay}
                      </span>
                    )}
                  </div>

                  {txsOnCard.length > 0 && onMarkCardInvoicePaid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkCardInvoicePaid(card.name, !isInvoiceFullyPaid);
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs ${
                        isInvoiceFullyPaid
                          ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                      }`}
                      title={
                        isInvoiceFullyPaid
                          ? 'Desfazer pagamento da fatura'
                          : 'Confirmar pagamento do cartão (debita o valor do Saldo Atual de entradas)'
                      }
                    >
                      {isInvoiceFullyPaid ? (
                        <span>Reabrir Fatura</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Pagar Cartão</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Card Purchases List */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs transition-colors">
        {(() => {
          const txsForThisCard = cardTransactions.filter(
            (tx) =>
              tx.cardName === selectedCard?.name ||
              (!tx.cardName && selectedCard?.id === creditCards[0]?.id)
          );
          const thisCardTotal = txsForThisCard.reduce((acc, curr) => acc + curr.amount, 0);
          const thisCardPaid = txsForThisCard
            .filter((tx) => tx.isPaid)
            .reduce((acc, curr) => acc + curr.amount, 0);
          const thisCardPending = thisCardTotal - thisCardPaid;
          const isThisCardFullyPaid =
            txsForThisCard.length > 0 && txsForThisCard.every((tx) => tx.isPaid);

          return (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Compras na Fatura de {selectedCard?.name || 'Cartão Selecionado'}</span>
                    <span className="text-xs font-mono font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/60">
                      {txsForThisCard.length} compras
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Fatura de {selectedMonthName} · Total: <strong>{formatCurrency(thisCardTotal)}</strong> (Pago:{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                      {formatCurrency(thisCardPaid)}
                    </span>{' '}
                    · A pagar:{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
                      {formatCurrency(thisCardPending)}
                    </span>
                    )
                  </p>
                </div>

                {txsForThisCard.length > 0 && onMarkCardInvoicePaid && (
                  <button
                    onClick={() => onMarkCardInvoicePaid(selectedCard.name, !isThisCardFullyPaid)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors shadow-xs ${
                      isThisCardFullyPaid
                        ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : 'text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                    }`}
                  >
                    {isThisCardFullyPaid ? (
                      <span>Reabrir Fatura Inteira</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Pagar Fatura Inteira ({formatCurrency(thisCardTotal)})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-3 divide-y divide-slate-800/60">
                {txsForThisCard.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Nenhuma compra registrada para este cartão no mês de {selectedMonthName}.
                  </div>
                ) : (
                  txsForThisCard.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/60 px-2 rounded-xl transition-colors group border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
                    >
                      <div
                        onClick={() => onEditTransaction(tx)}
                        className="space-y-0.5 cursor-pointer flex-1"
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{tx.description}</span>
                          {tx.totalInstallments && tx.totalInstallments > 1 && (
                            <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-1 rounded">
                              Parcela {tx.currentInstallment || 1}/{tx.totalInstallments}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDateBR(tx.date)}</span>
                          {tx.subCategory && (
                            <>
                              <span>·</span>
                              <span>{tx.subCategory}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                            {formatCurrency(tx.amount)}
                          </span>
                          <div className="text-[11px] flex items-center justify-end gap-1 mt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTransactionPaid?.(tx.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title={
                                tx.isPaid
                                  ? 'Compra paga (clique para reabrir)'
                                  : 'Compra aberta (clique para marcar como paga e abater do saldo)'
                              }
                            >
                              {tx.isPaid ? (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                                  <CheckCircle2 className="w-3 h-3" /> Paga
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                                  <AlertCircle className="w-3 h-3" /> Aberta
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Quick delete button */}
                        <button
                          onClick={() => {
                            if (confirm(`Excluir compra "${tx.description}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Excluir compra"
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-70 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* Modal to Add/Edit Credit Card */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <CardIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingCard ? 'Editar Cartão de Crédito' : 'Cadastrar Novo Cartão'}
                </h3>
              </div>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {formError}
                </div>
              )}

              {/* Card Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Cartão *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Itaú Click, Santander SX, C6 Carbon, XP..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Banco / Emissor
                </label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="Ex: Itaú, Santander, C6 Bank, Bradesco, XP..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>

              {/* Limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Limite Total do Cartão (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="50"
                    required
                    value={limitStr}
                    onChange={(e) => setLimitStr(e.target.value)}
                    placeholder="5.000,00"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Closing and Due days */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Dia de Fechamento (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={closingDay}
                    onChange={(e) => setClosingDay(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Dia de Vencimento (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Card Color Preset */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cor do Cartão
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {CARD_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                        color === preset.value
                          ? 'ring-2 ring-purple-500 scale-110 border-white'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    >
                      {color === preset.value && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCard ? 'Salvar Cartão' : 'Cadastrar Cartão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
