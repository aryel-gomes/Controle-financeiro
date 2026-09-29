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
} from 'lucide-react';
import { Transaction } from '../types/finance';
import {
  CATEGORY_DEFINITIONS,
  PAYMENT_METHOD_LABELS,
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
        const matchSub = (tx.subCategory || '').toLowerCase().includes(term);
        const matchCard = (tx.cardName || '').toLowerCase().includes(term);
        if (!matchDesc && !matchCat && !matchSub && !matchCard) {
          return false;
        }
      }

      // Category / Type filter
      if (selectedFilter !== 'all') {
        if (selectedFilter === 'income' && tx.type !== 'income') return false;
        if (selectedFilter === 'expense' && tx.type !== 'expense') return false;
        if (
          selectedFilter !== 'income' &&
          selectedFilter !== 'expense' &&
          tx.category !== selectedFilter
        ) {
          return false;
        }
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
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    });
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  return (
    <div className="bg-[#121927] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, cartão, categoria..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Quick CTA */}
          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Adicionar Transação</span>
          </button>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Todas ({transactions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('salary')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'salary'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Salários
            </button>
            <button
              onClick={() => setSelectedFilter('commission')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'commission'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Comissões
            </button>
            <button
              onClick={() => setSelectedFilter('credit_card')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'credit_card'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Cartão & Parcelas
            </button>
            <button
              onClick={() => setSelectedFilter('fixed_debt')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'fixed_debt'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dívidas Fixas
            </button>
            <button
              onClick={() => setSelectedFilter('general_expenses')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
                selectedFilter === 'general_expenses'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Gastos Variáveis
            </button>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                selectedStatus === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedStatus('paid')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                selectedStatus === 'paid'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pagos
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                selectedStatus === 'pending'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
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
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
            <Tag className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">
            Nenhuma transação encontrada
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchTerm || selectedFilter !== 'all' || selectedStatus !== 'all'
              ? 'Tente ajustar os filtros ou o termo de busca para visualizar registros.'
              : 'Comece adicionando suas primeiras entradas de salário, comissão ou despesas.'}
          </p>
          <button
            onClick={onOpenNewTransaction}
            className="mt-4 px-3.5 py-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 rounded-xl transition-colors"
          >
            + Adicionar Nova Transação
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List (screen width < 768px) */}
          <div className="md:hidden divide-y divide-slate-800/70">
            {filteredTransactions.map((tx) => {
              const catMeta = CATEGORY_DEFINITIONS[tx.category] || {
                label: tx.category,
                color: '#94a3b8',
                bgColor: '#1e293b',
              };
              const isIncome = tx.type === 'income';

              const handleDeleteClick = () => {
                if (tx.installmentGroupId || (tx.totalInstallments && tx.totalInstallments > 1)) {
                  const deleteAll = confirm(
                    `Esta é a parcela ${tx.currentInstallment || 1}/${tx.totalInstallments || 1} de "${tx.description}".\n\nDeseja excluir TODAS as parcelas deste lançamento?\n\n• OK: Excluir TODAS as parcelas deste item\n• Cancelar: Excluir APENAS esta parcela`
                  );
                  if (deleteAll) {
                    onDeleteTransaction(tx.id, true);
                  } else {
                    if (confirm(`Confirmar exclusão de APENAS esta parcela ${tx.currentInstallment || 1}/${tx.totalInstallments || 1}?`)) {
                      onDeleteTransaction(tx.id, false);
                    }
                  }
                } else if (tx.recurrenceGroupId) {
                  const deleteAll = confirm(
                    `Este lançamento faz parte de uma despesa recorrente.\n\nDeseja excluir TODOS os lançamentos desta recorrência?`
                  );
                  onDeleteTransaction(tx.id, deleteAll);
                } else {
                  if (confirm(`Deseja excluir "${tx.description}"?`)) {
                    onDeleteTransaction(tx.id, false);
                  }
                }
              };

              return (
                <div
                  key={tx.id}
                  className="p-3.5 hover:bg-slate-900/60 transition-colors flex items-start justify-between gap-3"
                >
                  {/* Left: Status Toggle & Info */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => onTogglePaid(tx.id)}
                      title={tx.isPaid ? 'Pago/Recebido' : 'Pendente'}
                      className="mt-0.5 p-1 text-slate-500 hover:text-slate-300 rounded transition-colors shrink-0"
                    >
                      {tx.isPaid ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Description & Installment */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          onClick={() => onEditTransaction(tx)}
                          className="font-semibold text-white text-xs sm:text-sm cursor-pointer hover:text-emerald-400 transition-colors truncate max-w-full"
                        >
                          {tx.description}
                        </span>
                        {tx.totalInstallments && tx.totalInstallments > 1 && (
                          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 border border-purple-800/60 px-1.5 py-0.5 rounded shrink-0">
                            {tx.currentInstallment || 1}/{tx.totalInstallments}x
                          </span>
                        )}
                      </div>

                      {/* Meta Tags: Category, Card, Date */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-800 shrink-0"
                          style={{
                            backgroundColor: '#0F172A',
                            color: catMeta.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: catMeta.color }}
                          />
                          <span>{catMeta.label}</span>
                        </span>

                        {tx.cardName && (
                          <span className="inline-flex items-center gap-1 text-slate-300 font-mono truncate max-w-[130px]">
                            <CardIcon className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate">{tx.cardName}</span>
                          </span>
                        )}

                        <span className="font-mono text-slate-500">
                          {formatDateBR(tx.date)}
                        </span>
                      </div>

                      {tx.subCategory && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {tx.subCategory}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span
                      className={`font-mono tabular-nums font-bold text-xs sm:text-sm ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        title="Editar"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        title="Excluir"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
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
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">Status</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Pagamento / Cartão</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  const catMeta = CATEGORY_DEFINITIONS[tx.category] || {
                    label: tx.category,
                    color: '#94a3b8',
                    bgColor: '#1e293b',
                  };
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-900/60 transition-colors group"
                    >
                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onTogglePaid(tx.id)}
                          title={
                            tx.isPaid
                              ? 'Marcado como Pago/Recebido (clique para pendente)'
                              : 'Marcado como Pendente (clique para liquidar)'
                          }
                          className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
                        >
                          {tx.isPaid ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400" />
                          )}
                        </button>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <span>{tx.description}</span>
                          {tx.totalInstallments && tx.totalInstallments > 1 && (
                            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.5 rounded">
                              {tx.currentInstallment || 1}/{tx.totalInstallments}x
                            </span>
                          )}
                        </div>
                        {tx.subCategory && (
                          <div className="text-[11px] text-slate-400">
                            {tx.subCategory}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-800"
                          style={{
                            backgroundColor: '#0F172A',
                            color: catMeta.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: catMeta.color }}
                          />
                          <span>{catMeta.label}</span>
                        </span>
                      </td>

                      {/* Payment Method & Card Details */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          {tx.paymentMethod === 'credit_card' ? (
                            <>
                              <CardIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span className="truncate max-w-[140px]">
                                {tx.cardName || 'Cartão de Crédito'}
                              </span>
                            </>
                          ) : (
                            <span>
                              {PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono tabular-nums whitespace-nowrap">
                        {formatDateBR(tx.date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono tabular-nums font-semibold ${
                            isIncome ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Editar transação"
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (tx.installmentGroupId || (tx.totalInstallments && tx.totalInstallments > 1)) {
                                const deleteAll = confirm(
                                  `Esta é a parcela ${tx.currentInstallment || 1}/${tx.totalInstallments || 1} de "${tx.description}".\n\nDeseja excluir TODAS as parcelas deste lançamento?\n\n• OK: Excluir TODAS as parcelas deste item\n• Cancelar: Excluir APENAS esta parcela`
                                );
                                if (deleteAll) {
                                  onDeleteTransaction(tx.id, true);
                                } else {
                                  if (confirm(`Confirmar exclusão de APENAS esta parcela ${tx.currentInstallment || 1}/${tx.totalInstallments || 1}?`)) {
                                    onDeleteTransaction(tx.id, false);
                                  }
                                }
                              } else if (tx.recurrenceGroupId) {
                                const deleteAll = confirm(
                                  `Este lançamento faz parte de uma despesa recorrente.\n\nDeseja excluir TODOS os lançamentos desta recorrência?`
                                );
                                onDeleteTransaction(tx.id, deleteAll);
                              } else {
                                if (confirm(`Deseja excluir "${tx.description}"?`)) {
                                  onDeleteTransaction(tx.id, false);
                                }
                              }
                            }}
                            title="Excluir transação"
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
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
        <div className="p-3.5 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums text-slate-400">
          <div>
            <span>Exibindo </span>
            <strong className="text-white">{filteredTransactions.length}</strong>
            <span> transações no filtro</span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              Entradas:{' '}
              <strong className="text-emerald-400">
                {formatCurrency(filteredTotals.income)}
              </strong>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              Saídas:{' '}
              <strong className="text-rose-400">
                {formatCurrency(filteredTotals.expense)}
              </strong>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              Saldo:{' '}
              <strong
                className={
                  filteredTotals.balance >= 0 ? 'text-white' : 'text-rose-400'
                }
              >
                {formatCurrency(filteredTotals.balance)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
