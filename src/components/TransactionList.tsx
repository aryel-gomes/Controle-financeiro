import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Plus,
  CreditCard as CardIcon,
  Tag,
  MoreHorizontal,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Transaction } from '../types/finance';
import {
  CATEGORY_DEFINITIONS,
  formatCurrency,
  formatDateBR,
} from '../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string, deleteAllInGroup?: boolean) => void;
  onTogglePaid: (id: string) => void;
  initialCategoryFilter?: string | null;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onTogglePaid,
  initialCategoryFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>(
    initialCategoryFilter || 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [openMenuTxId, setOpenMenuTxId] = useState<string | null>(null);

  // Close actions menu on click outside
  React.useEffect(() => {
    const handleGlobalClick = () => setOpenMenuTxId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // React to initialCategoryFilter prop updates
  React.useEffect(() => {
    if (initialCategoryFilter) {
      setSelectedFilter(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(term);
        const matchCat = (CATEGORY_DEFINITIONS[tx.category]?.label || '')
          .toLowerCase()
          .includes(term);
        const matchCard = (tx.cardName || '').toLowerCase().includes(term);
        if (!matchDesc && !matchCat && !matchCard) {
          return false;
        }
      }

      // Category / Type filter
      if (selectedFilter !== 'all') {
        if (selectedFilter === 'income' && tx.type !== 'income') return false;
        if (selectedFilter === 'credit_card' && tx.category !== 'credit_card') return false;
        if (selectedFilter === 'fixed_debt' && tx.category !== 'fixed_debt') return false;
        if (selectedFilter === 'general_expenses' && tx.category !== 'general_expenses') return false;
      }

      // Status filter
      if (selectedStatus === 'paid' && !tx.isPaid) return false;
      if (selectedStatus === 'pending' && tx.isPaid) return false;

      return true;
    });
  }, [transactions, searchTerm, selectedFilter, selectedStatus]);

  // Totals of filtered list
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let paidExpense = 0;
    let pendingExpense = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
        if (tx.isPaid) {
          paidExpense += tx.amount;
        } else {
          pendingExpense += tx.amount;
        }
      }
    });

    const actualBalance = income - paidExpense;
    const projectedBalance = income - expense;

    return {
      income,
      expense,
      paidExpense,
      pendingExpense,
      actualBalance,
      projectedBalance,
      balance: projectedBalance,
    };
  }, [filteredTransactions]);

  const handleDeleteClick = (tx: Transaction) => {
    if (tx.installmentGroupId || (tx.totalInstallments && tx.totalInstallments > 1)) {
      const deleteAll = confirm(
        `Esta é a parcela ${tx.currentInstallment || 1}/${tx.totalInstallments || 1} de "${tx.description}".\n\nDeseja excluir TODAS as parcelas deste lançamento?\n\n• OK: Excluir TODAS as parcelas\n• Cancelar: Excluir APENAS esta parcela`
      );
      if (deleteAll) {
        onDeleteTransaction(tx.id, true);
      } else {
        if (
          confirm(
            `Confirmar exclusão de APENAS esta parcela ${tx.currentInstallment || 1}/${
              tx.totalInstallments || 1
            }?`
          )
        ) {
          onDeleteTransaction(tx.id, false);
        }
      }
    } else {
      if (confirm(`Deseja excluir "${tx.description}"?`)) {
        onDeleteTransaction(tx.id, false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden transition-colors">
      {/* Search and Filters Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, cartão..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Quick CTA */}
          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Novo Lançamento</span>
          </button>
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Todas ({transactions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('income')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setSelectedFilter('credit_card')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'credit_card'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Cartão de Crédito
            </button>
            <button
              onClick={() => setSelectedFilter('fixed_debt')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'fixed_debt'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Dívidas Fixas
            </button>
            <button
              onClick={() => setSelectedFilter('general_expenses')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'general_expenses'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Gastos Variáveis
            </button>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedStatus === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedStatus('paid')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedStatus === 'paid'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pagos
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedStatus === 'pending'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pendentes
            </button>
          </div>
        </div>
      </div>

      {/* Content: Mobile Card List (< md) and Desktop Table (>= md) */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
            <Tag className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Nenhum lançamento encontrado
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {searchTerm || selectedFilter !== 'all' || selectedStatus !== 'all'
              ? 'Tente ajustar os filtros ou a busca.'
              : 'Clique no botão abaixo para adicionar seu primeiro lançamento.'}
          </p>
          <button
            onClick={onOpenNewTransaction}
            className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 rounded-xl transition-colors"
          >
            + Adicionar Lançamento
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List (screen width < 768px) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/70">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const catLabel =
                tx.category === 'credit_card'
                  ? tx.cardName || 'Cartão de Crédito'
                  : CATEGORY_DEFINITIONS[tx.category]?.label || tx.category;

              return (
                <div
                  key={tx.id}
                  className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors flex items-start justify-between gap-3"
                >
                  {/* Left: Status Toggle & Info */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onTogglePaid(tx.id)}
                      title={tx.isPaid ? 'Marcado como Pago/Recebido (clique para alterar)' : 'Marcado como Pendente (clique para alterar)'}
                      className="mt-0.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                      {tx.isPaid ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          onClick={() => onEditTransaction(tx)}
                          className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-full"
                        >
                          {tx.description}
                        </span>
                        {tx.totalInstallments && tx.totalInstallments > 1 && (
                          <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 px-1.5 py-0.5 rounded shrink-0">
                            {tx.currentInstallment || 1}/{tx.totalInstallments}x
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{catLabel}</span>
                        <span>·</span>
                        <span className="font-mono">{formatDateBR(tx.date)}</span>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePaid(tx.id);
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-[11px] px-1.5 py-0.5 rounded transition-colors"
                          title="Clique para alternar status entre Pago e Pendente"
                        >
                          {tx.isPaid ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-bold">
                              ✓ {isIncome ? 'Recebido' : 'Pago'}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-bold">
                              ⏳ Pendente
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span
                      className={`font-mono tabular-nums font-bold text-xs sm:text-sm ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1 relative">
                      {/* Menu de opções / Ações */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuTxId(openMenuTxId === tx.id ? null : tx.id);
                        }}
                        title="Opções do lançamento"
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuTxId === tx.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-30 py-1 text-xs"
                        >
                          <button
                            onClick={() => {
                              onTogglePaid(tx.id);
                              setOpenMenuTxId(null);
                            }}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          >
                            {tx.isPaid ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Marcar como Pendente</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Marcar como Pago</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              onEditTransaction(tx);
                              setOpenMenuTxId(null);
                            }}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Editar lançamento</span>
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                          <button
                            onClick={() => {
                              handleDeleteClick(tx);
                              setOpenMenuTxId(null);
                            }}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => onEditTransaction(tx)}
                        title="Editar"
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(tx)}
                        title="Excluir"
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (screen width >= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-10">Status</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria / Cartão</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const catLabel =
                    tx.category === 'credit_card'
                      ? tx.cardName || 'Cartão de Crédito'
                      : CATEGORY_DEFINITIONS[tx.category]?.label || tx.category;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onTogglePaid(tx.id)}
                          title={
                            tx.isPaid
                              ? 'Marcado como Pago/Recebido (clique para alternar)'
                              : 'Marcado como Pendente (clique para alternar)'
                          }
                          className="inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          {tx.isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{isIncome ? 'Recebido' : 'Pago'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md">
                              <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                              <span>Pendente</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{tx.description}</span>
                          {tx.totalInstallments && tx.totalInstallments > 1 && (
                            <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-1.5 py-0.5 rounded">
                              {tx.currentInstallment || 1}/{tx.totalInstallments}x
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category / Card */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {tx.category === 'credit_card' ? (
                          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                            <CardIcon className="w-3.5 h-3.5" />
                            <span>{catLabel}</span>
                          </div>
                        ) : (
                          <span>{catLabel}</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {formatDateBR(tx.date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono tabular-nums font-bold text-xs sm:text-sm ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 relative">
                          {/* Botão de Opções ao lado */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuTxId(openMenuTxId === tx.id ? null : tx.id);
                            }}
                            title="Opções do lançamento"
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Dropdown de Opções */}
                          {openMenuTxId === tx.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 py-1 text-left text-xs"
                            >
                              <button
                                onClick={() => {
                                  onTogglePaid(tx.id);
                                  setOpenMenuTxId(null);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                              >
                                {tx.isPaid ? (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>Alterar p/ Pendente</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>Alterar p/ Pago</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  onEditTransaction(tx);
                                  setOpenMenuTxId(null);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Editar dados</span>
                              </button>
                              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                              <button
                                onClick={() => {
                                  handleDeleteClick(tx);
                                  setOpenMenuTxId(null);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Editar lançamento"
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(tx)}
                            title="Excluir lançamento"
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer Summary */}
      {filteredTransactions.length > 0 && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 transition-colors">
          <div>
            <span>Exibindo </span>
            <strong className="text-slate-900 dark:text-white">{filteredTransactions.length}</strong>
            <span> lançamentos</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span>
              Entradas:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(filteredTotals.income)}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span>
              Saídas:{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                {formatCurrency(filteredTotals.expense)}
              </strong>{' '}
              <span className="text-[10px] text-slate-400">
                (Pago: {formatCurrency(filteredTotals.paidExpense)} · A Pagar: {formatCurrency(filteredTotals.pendingExpense)})
              </span>
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span>
              Saldo Atual:{' '}
              <strong
                className={
                  filteredTotals.actualBalance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }
              >
                {formatCurrency(filteredTotals.actualBalance)}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="text-slate-500">
              Previsto:{' '}
              <strong
                className={
                  filteredTotals.projectedBalance >= 0
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-rose-600 dark:text-rose-400'
                }
              >
                {formatCurrency(filteredTotals.projectedBalance)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
