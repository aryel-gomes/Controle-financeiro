import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MonthSummary } from '../types/finance';
import { LimitAlert } from '../hooks/useFinanceStore';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface MetricCardsProps {
  summary: MonthSummary;
  overallAlert?: LimitAlert;
  onOpenBudgetModal: () => void;
  onOpenIncomeModal?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  summary,
  overallAlert,
  onOpenBudgetModal,
  onOpenIncomeModal,
}) => {
  const isPositiveBalance = summary.netBalance >= 0;
  const overallLimit = overallAlert?.limitAmount || 5500;
  const overallSpent = summary.totalExpense;
  const overallPercent = overallLimit > 0 ? (overallSpent / overallLimit) * 100 : 0;
  const isLimitExceeded = overallPercent >= 100;
  const isLimitWarning = overallPercent >= 80;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* CARD 1: Saldo Líquido do Mês */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo Previsto
            </span>
            <div
              className={`p-2 rounded-xl ${
                isPositiveBalance
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight ${
                isPositiveBalance
                  ? 'text-slate-900 dark:text-white'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Taxa Poupada</span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
            {formatPercent(summary.savingsRate, 0)} economizado
          </span>
        </div>
      </div>

      {/* CARD 2: Total Entradas */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Entradas
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(summary.totalIncome)}
            </div>
          </div>
        </div>

        {/* Breakdown Salários & Comissões */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Salário Fixo</span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(summary.salaryIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>Comissões / Extra</span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(summary.commissionIncome + summary.otherIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: Total Saídas */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Saídas
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              -{formatCurrency(summary.totalExpense)}
            </div>
          </div>
        </div>

        {/* Breakdown: Cartão, Dívidas Fixas, Gastos */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Cartão de Crédito</span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(summary.creditCardExpense)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Contas & Boletos</span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(summary.fixedDebtExpense + summary.generalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 4: Orçamento & Teto Geral */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Teto de Gastos
            </span>
            <button
              onClick={onOpenBudgetModal}
              title="Configurar limites"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isLimitExceeded ? (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              ) : isLimitWarning ? (
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              {formatPercent(overallPercent, 0)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Teto: {formatCurrency(overallLimit)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isLimitExceeded
                  ? 'bg-rose-500'
                  : isLimitWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Margem Livre</span>
          <span
            className={`font-semibold font-mono tabular-nums ${
              isLimitExceeded
                ? 'text-rose-600 dark:text-rose-400'
                : isLimitWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isLimitExceeded
              ? `Estourado em +${formatCurrency(overallSpent - overallLimit)}`
              : `Resta ${formatCurrency(overallLimit - overallSpent)}`}
          </span>
        </div>
      </div>
    </div>
  );
};
