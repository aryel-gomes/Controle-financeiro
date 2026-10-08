import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Eye, EyeOff } from 'lucide-react';
import { MonthSummary } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { usePrivacy } from '../context/PrivacyContext';

interface QuickStatsHeroProps {
  summary: MonthSummary;
  onOpenNewTransaction?: (presetType?: 'income' | 'expense') => void;
  onOpenIncomeModal?: () => void;
}

export const QuickStatsHero: React.FC<QuickStatsHeroProps> = ({
  summary,
}) => {
  const { hideValues, toggleHideValues } = usePrivacy();
  const isActualPositive = summary.actualBalance >= 0;
  const isProjectedPositive = summary.netBalance >= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Resumo Financeiro
        </span>
        <button
          onClick={toggleHideValues}
          type="button"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all ${
            hideValues
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 shadow-2xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title={hideValues ? 'Mostrar valores' : 'Esconder valores'}
        >
          {hideValues ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
              <span>Valores ocultos</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Esconder valores</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. Entradas */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Total Entradas
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Salário, comissões e extras
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
            +{formatCurrency(summary.totalIncome)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Receita total do mês
          </div>
        </div>
      </div>

      {/* 2. Saídas */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Total Saídas
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Cartões, fixas e variáveis
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-rose-600 dark:text-rose-400 truncate">
            -{formatCurrency(summary.totalExpense)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Pago: {formatCurrency(summary.paidExpense)}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              A Pagar: {formatCurrency(summary.pendingExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Saldo Atual */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Saldo Atual
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Entradas menos despesas pagas
            </span>
          </div>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isActualPositive
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
              isActualPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.actualBalance)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>Saldo Previsto ao fim do mês:</span>
            <span
              className={`font-semibold ${
                isProjectedPositive
                  ? 'text-slate-900 dark:text-slate-200'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
