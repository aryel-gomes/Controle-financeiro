import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
  // Generate 7 months: 2 past, current, 4 future
  const monthsList = React.useMemo(() => {
    const list: { year: number; month: number; key: string; label: string; isCurrent: boolean }[] = [];
    const baseYear = 2026;
    const baseMonth = 8; // September 2026

    for (let offset = -2; offset <= 4; offset++) {
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
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none py-1">
      <div className="flex items-center gap-1.5 p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {monthsList.map((item) => {
          const isSelected = item.year === selectedYear && item.month === selectedMonth;

          // Compute quick expense total
          const monthTxs = transactions.filter((t) => t.date.startsWith(item.key));
          let monthExpense = 0;
          monthTxs.forEach((t) => {
            if (t.type === 'expense') monthExpense += t.amount;
          });

          return (
            <button
              key={item.key}
              onClick={() => onSelectMonthYear(item.year, item.month)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{item.label}</span>
              {item.isCurrent && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
              {monthExpense > 0 && (
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {formatCurrency(monthExpense)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
