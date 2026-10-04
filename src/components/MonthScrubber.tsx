import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthShortName, formatCurrency, addMonthsToDateString } from '../utils/formatters';
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
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  // Generate months dynamically up to the final month of the furthest installment / debt
  const monthsList = React.useMemo(() => {
    const baseYear = 2026;
    const baseMonth = 8; // September 2026 (month 8, 0-indexed)

    // Base default: at least 6 months ahead from base
    let maxYear = baseYear;
    let maxMonth = baseMonth + 5;
    if (maxMonth >= 12) {
      maxYear += Math.floor(maxMonth / 12);
      maxMonth = maxMonth % 12;
    }

    transactions.forEach((tx) => {
      // 1. Direct transaction date
      if (tx.date) {
        const [y, m] = tx.date.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m)) {
          const txMonthIndex = m - 1;
          if (y > maxYear || (y === maxYear && txMonthIndex > maxMonth)) {
            maxYear = y;
            maxMonth = txMonthIndex;
          }
        }
      }

      // 2. Installment debt projection: check furthest installment end date
      if (tx.totalInstallments && tx.totalInstallments > 1 && tx.date) {
        const currentInst = tx.currentInstallment || 1;
        const remainingMonths = Math.max(0, tx.totalInstallments - currentInst);
        if (remainingMonths > 0) {
          const projectedEndDate = addMonthsToDateString(tx.date, remainingMonths);
          const [ey, em] = (projectedEndDate || '').split('-').map(Number);
          if (!isNaN(ey) && !isNaN(em)) {
            const endMonthIndex = em - 1;
            if (ey > maxYear || (ey === maxYear && endMonthIndex > maxMonth)) {
              maxYear = ey;
              maxMonth = endMonthIndex;
            }
          }
        }
      }
    });

    // 3. Ensure selectedYear and selectedMonth are included
    if (selectedYear > maxYear || (selectedYear === maxYear && selectedMonth > maxMonth)) {
      maxYear = selectedYear;
      maxMonth = selectedMonth;
    }

    // Start 2 months prior to current base month (July 2026)
    let curYear = baseYear;
    let curMonth = baseMonth - 2;
    while (curMonth < 0) {
      curMonth += 12;
      curYear -= 1;
    }

    const list: {
      year: number;
      month: number;
      key: string;
      label: string;
      isCurrent: boolean;
      isFuture: boolean;
    }[] = [];

    // Loop until we reach maxYear and maxMonth
    while (curYear < maxYear || (curYear === maxYear && curMonth <= maxMonth)) {
      const key = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
      const isCurrent = curYear === baseYear && curMonth === baseMonth;
      const isFuture =
        curYear > baseYear || (curYear === baseYear && curMonth > baseMonth);

      list.push({
        year: curYear,
        month: curMonth,
        key,
        label: `${getMonthShortName(curMonth)}/${String(curYear).slice(2)}`,
        isCurrent,
        isFuture,
      });

      curMonth++;
      if (curMonth >= 12) {
        curMonth = 0;
        curYear++;
      }
    }

    return list;
  }, [transactions, selectedYear, selectedMonth]);

  // Auto-scroll selected button into view on load or when selected month changes
  useEffect(() => {
    if (selectedButtonRef.current && scrollContainerRef.current) {
      selectedButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedYear, selectedMonth]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center group">
      {/* Scroll Left Button */}
      <button
        onClick={handleScrollLeft}
        type="button"
        aria-label="Rolar meses para esquerda"
        className="hidden sm:flex absolute -left-2 z-10 p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-opacity opacity-80 hover:opacity-100"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Months Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none py-1 w-full px-1 scroll-smooth"
      >
        <div className="flex items-center gap-1.5 p-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          {monthsList.map((item) => {
            const isSelected = item.year === selectedYear && item.month === selectedMonth;

            // Compute quick expense total for this specific month
            const monthTxs = transactions.filter((t) => t.date.startsWith(item.key));
            let monthExpense = 0;
            monthTxs.forEach((t) => {
              if (t.type === 'expense') monthExpense += t.amount;
            });

            return (
              <button
                key={item.key}
                ref={isSelected ? selectedButtonRef : undefined}
                onClick={() => onSelectMonthYear(item.year, item.month)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{item.label}</span>
                {item.isCurrent && !isSelected && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    title="Mês atual"
                  />
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

      {/* Scroll Right Button */}
      <button
        onClick={handleScrollRight}
        type="button"
        aria-label="Rolar meses para direita"
        className="hidden sm:flex absolute -right-2 z-10 p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-opacity opacity-80 hover:opacity-100"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
