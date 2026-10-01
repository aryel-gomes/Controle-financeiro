import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { MonthSummary } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface QuickStatsHeroProps {
  summary: MonthSummary;
  onOpenNewTransaction?: (presetType?: 'income' | 'expense') => void;
  onOpenIncomeModal?: () => void;
}

export const QuickStatsHero: React.FC<QuickStatsHeroProps> = ({
  summary,
}) => {
  const isPositive = summary.netBalance >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. Entradas */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Entradas
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
            +{formatCurrency(summary.totalIncome)}
          </div>
        </div>
      </div>

      {/* 2. Saídas */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Saídas
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-rose-600 dark:text-rose-400 truncate">
            -{formatCurrency(summary.totalExpense)}
          </div>
        </div>
      </div>

      {/* 3. Saldo Atual */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Saldo Atual
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
            }`}
          >
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight truncate ${
              isPositive
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.netBalance)}
          </div>
        </div>
      </div>
    </div>
  );
};
