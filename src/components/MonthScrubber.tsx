import React from 'react';
import { Calendar } from 'lucide-react';
import { getMonthShortName, formatCurrency } from '../utils/formatters';
import { Transaction } from '../types/finance';

interface MonthScrubberProps {
  selectedYear: number;
  selectedMonth: number;
  onSelectMonthYear: (year: number, month: number) => void;
  transactions: Transaction[];
  overallLimit: number;
}

export const MonthScrubber: React.FC<MonthScrubberProps> = ({
  selectedYear,
  selectedMonth,
  onSelectMonthYear,
  transactions,
  overallLimit,
}) => {
  // Generate 8 months timeline: 2 months back, current month, 5 months ahead
  const monthsList = React.useMemo(() => {
    const list: { year: number; month: number; key: string; label: string; isCurrent: boolean }[] = [];
    const baseYear = 2026;
    const baseMonth = 8; // September 2026 (current time)

    for (let offset = -2; offset <= 5; offset++) {
      let m = baseMonth + offset;
      let y = baseYear;
      while (m < 0) {
        m += 12;
        y -= 1;
      }
      while (m >= 12) {
        m -= 12;
        y += 1;
      }

      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      list.push({
        year: y,
        month: m,
        key,
        label: `${getMonthShortName(m)}/${String(y).slice(2)}`,
        isCurrent: y === baseYear && m === baseMonth,
      });
    }

    return list;
  }, []);

  return (
    <div className="bg-[#121927] rounded-2xl border border-slate-800/80 p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white tracking-tight">
            Linha do Tempo Mensal (Navegue pelos Meses)
          </span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400">
            · Veja como suas parcelas e dívidas impactam os próximos meses
          </span>
        </div>

        <button
          onClick={() => onSelectMonthYear(2026, 8)}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Voltar para Mês Atual
        </button>
      </div>

      {/* Horizontal Scrubber */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {monthsList.map((item) => {
          const isSelected = item.year === selectedYear && item.month === selectedMonth;

          // Compute quick totals for this month to display in scrubber
          const monthTxs = transactions.filter((t) => t.date.startsWith(item.key));
          let monthExpense = 0;
          let monthIncome = 0;
          let installmentCount = 0;

          monthTxs.forEach((t) => {
            if (t.type === 'income') monthIncome += t.amount;
            else {
              monthExpense += t.amount;
              if (t.totalInstallments && t.totalInstallments > 1) {
                installmentCount++;
              }
            }
          });

          const isOverBudget = overallLimit > 0 && monthExpense > overallLimit;
          const isWarning = overallLimit > 0 && monthExpense >= overallLimit * 0.8;

          return (
            <button
              key={item.key}
              onClick={() => onSelectMonthYear(item.year, item.month)}
              className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl border text-left transition-all duration-150 relative group ${
                isSelected
                  ? 'bg-slate-800/95 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
              }`}
            >
              {/* Top row: Label & current badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  {item.label}
                </span>

                {item.isCurrent && (
                  <span
                    className={`text-[9px] font-semibold uppercase px-1 py-0.2 rounded ${
                      isSelected
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                        : 'bg-emerald-950/80 border border-emerald-800/60 text-emerald-400'
                    }`}
                  >
                    Hoje
                  </span>
                )}
              </div>

              {/* Expense & Installment counter */}
              <div className="mt-1 flex items-baseline justify-between gap-1">
                <span
                  className={`text-xs font-mono font-semibold tabular-nums truncate ${
                    isOverBudget
                      ? 'text-rose-400 font-bold'
                      : isSelected
                      ? 'text-white'
                      : 'text-slate-300'
                  }`}
                >
                  {formatCurrency(monthExpense)}
                </span>

                {installmentCount > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      isSelected
                        ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30'
                        : 'bg-purple-950/60 border border-purple-800/50 text-purple-300'
                    }`}
                    title={`${installmentCount} compras parceladas neste mês`}
                  >
                    {installmentCount} parc.
                  </span>
                )}
              </div>

              {/* Status bar */}
              <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, overallLimit > 0 ? (monthExpense / overallLimit) * 100 : 0)}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
