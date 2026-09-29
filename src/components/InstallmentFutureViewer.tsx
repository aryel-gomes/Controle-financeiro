import React, { useState } from 'react';
import { CreditCard as CardIcon, Calendar, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Transaction } from '../types/finance';
import { formatCurrency, getMonthShortName } from '../utils/formatters';

interface InstallmentFutureViewerProps {
  transactions: Transaction[];
  onSelectMonthYear: (year: number, month: number) => void;
  selectedMonthKey: string;
}

export const InstallmentFutureViewer: React.FC<InstallmentFutureViewerProps> = ({
  transactions,
  onSelectMonthYear,
  selectedMonthKey,
}) => {
  const [filterCard, setFilterCard] = useState<string>('all');

  // Group all transactions that have totalInstallments > 1
  const installmentGroups = React.useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        title: string;
        cardName?: string;
        amountPerMonth: number;
        totalInstallments: number;
        items: Transaction[];
      }
    >();

    transactions.forEach((tx) => {
      if (tx.totalInstallments && tx.totalInstallments > 1) {
        const key =
          tx.installmentGroupId ||
          tx.description.replace(/\(Parcela \d+\/\d+\)/i, '').trim();

        if (!map.has(key)) {
          map.set(key, {
            id: key,
            title: tx.description.replace(/\(Parcela \d+\/\d+\)/i, '').trim(),
            cardName: tx.cardName,
            amountPerMonth: tx.amount,
            totalInstallments: tx.totalInstallments,
            items: [],
          });
        }

        const group = map.get(key)!;
        if (!group.items.some((i) => i.date === tx.date)) {
          group.items.push(tx);
        }
      }
    });

    map.forEach((g) => {
      g.items.sort((a, b) => a.date.localeCompare(b.date));
    });

    return Array.from(map.values());
  }, [transactions]);

  // Unique card names for filter
  const cardNames = React.useMemo(() => {
    const set = new Set<string>();
    installmentGroups.forEach((g) => {
      if (g.cardName) set.add(g.cardName);
    });
    return Array.from(set);
  }, [installmentGroups]);

  const filteredGroups = React.useMemo(() => {
    if (filterCard === 'all') return installmentGroups;
    return installmentGroups.filter((g) => g.cardName === filterCard);
  }, [installmentGroups, filterCard]);

  // Overall stats
  const stats = React.useMemo(() => {
    let totalPendingValue = 0;
    let monthlyCommitmentCurrent = 0;
    let totalActivePurchases = installmentGroups.length;

    installmentGroups.forEach((g) => {
      const paidCount = g.items.filter((i) => i.isPaid).length;
      const remainingCount = Math.max(0, g.totalInstallments - paidCount);
      totalPendingValue += remainingCount * g.amountPerMonth;

      const hasCurrentMonth = g.items.some((i) => i.date.startsWith(selectedMonthKey));
      if (hasCurrentMonth) {
        monthlyCommitmentCurrent += g.amountPerMonth;
      }
    });

    return { totalPendingValue, monthlyCommitmentCurrent, totalActivePurchases };
  }, [installmentGroups, selectedMonthKey]);

  if (installmentGroups.length === 0) {
    return (
      <div className="bg-[#121927] rounded-2xl p-6 border border-slate-800 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
          <CardIcon className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-white">Nenhuma compra parcelada registrada</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Ao lançar compras divididas no cartão (ex: 2x, 6x, 10x), o cronograma futuro aparecerá aqui organizado mês a mês.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Quick Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#121927] p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CardIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Compras Parceladas</span>
            <span className="text-sm font-bold text-white font-mono">
              {stats.totalActivePurchases} ativas
            </span>
          </div>
        </div>

        <div className="bg-[#121927] p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Comprometido Este Mês</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {formatCurrency(stats.monthlyCommitmentCurrent)}
            </span>
          </div>
        </div>

        <div className="bg-[#121927] p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Total a Vencer no Futuro</span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              {formatCurrency(stats.totalPendingValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Chips by Card */}
      {cardNames.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] shrink-0">Filtrar por cartão:</span>
          <button
            onClick={() => setFilterCard('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              filterCard === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({installmentGroups.length})
          </button>
          {cardNames.map((name) => (
            <button
              key={name}
              onClick={() => setFilterCard(name)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                filterCard === name
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Clean Cards List */}
      <div className="space-y-3">
        {filteredGroups.map((group) => {
          const totalPaid = group.items.filter((i) => i.isPaid).length;
          const remainingCount = Math.max(0, group.totalInstallments - totalPaid);
          const remainingValue = group.amountPerMonth * remainingCount;
          const progressPct = (totalPaid / group.totalInstallments) * 100;

          return (
            <div
              key={group.id}
              className="bg-[#121927] p-4 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all space-y-3"
            >
              {/* Purchase Title & Values */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <CardIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm truncate block">
                      {group.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {group.cardName && (
                        <span className="text-purple-400 font-medium">
                          {group.cardName}
                        </span>
                      )}
                      <span>·</span>
                      <span>
                        {totalPaid} de {group.totalInstallments} pagas ({progressPct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:text-right font-mono tabular-nums text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block sm:text-right">Parcela</span>
                    <span className="font-bold text-white text-sm">
                      {formatCurrency(group.amountPerMonth)}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-[10px] text-slate-400 block sm:text-right">Restante</span>
                    <span className="font-bold text-rose-400 text-sm">
                      {formatCurrency(remainingValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Installment Months Ribbon */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                {group.items.map((item) => {
                  const isCurrentSelectedMonth = item.date.startsWith(selectedMonthKey);
                  const [y, m] = item.date.split('-').map(Number);
                  const monthShort = getMonthShortName(m - 1);

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectMonthYear(y, m - 1)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums border flex items-center gap-1 shrink-0 transition-all ${
                        isCurrentSelectedMonth
                          ? 'bg-purple-600 border-purple-500 text-white shadow-sm font-bold ring-1 ring-purple-400'
                          : item.isPaid
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-purple-500/60 hover:text-white'
                      }`}
                      title={`Ver mês ${monthShort}/${y}`}
                    >
                      {item.isPaid && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      <span>
                        {item.currentInstallment || 1}/{item.totalInstallments}
                      </span>
                      <span className="text-[10px] opacity-75">({monthShort})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
