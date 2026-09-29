import React from 'react';
import {
  TrendingUp,
  CreditCard as CardIcon,
  Home,
  ShoppingBag,
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  SlidersHorizontal,
  Wallet,
  Edit3,
} from 'lucide-react';
import { MonthSummary } from '../types/finance';
import { LimitAlert } from '../hooks/useFinanceStore';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface QuickStatsHeroProps {
  summary: MonthSummary;
  overallAlert?: LimitAlert;
  onOpenNewTransaction: (presetType?: 'income' | 'expense', presetCategory?: string) => void;
  onOpenBudgetModal: () => void;
  onOpenIncomeModal: () => void;
  onSelectCategoryFilter: (cat: string) => void;
  activeFilter?: string | null;
}

export const QuickStatsHero: React.FC<QuickStatsHeroProps> = ({
  summary,
  overallAlert,
  onOpenNewTransaction,
  onOpenBudgetModal,
  onOpenIncomeModal,
  onSelectCategoryFilter,
  activeFilter,
}) => {
  const isPositive = summary.netBalance >= 0;
  const overallLimit = overallAlert?.limitAmount || 5500;
  const overallSpent = summary.totalExpense;
  const percentUsed = overallLimit > 0 ? (overallSpent / overallLimit) * 100 : 0;
  const isDanger = percentUsed >= 100;
  const isWarning = overallAlert?.status === 'warning' || percentUsed >= 80;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
      {/* 1. HERO BALANCE CARD (Lg: 5 cols) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-[#101726] to-[#0A0E17] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-400 truncate">
              Saldo Previsto do Mês
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono shrink-0">
              <Wallet className="w-3 h-3" />
              <span>{formatPercent(summary.savingsRate, 0)} poupado</span>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3">
            <div
              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono tracking-tight tabular-nums truncate ${
                isPositive ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </div>
          </div>

          {/* Quick bar visual of Incomes vs Expenses */}
          <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            <div className="min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 block text-[10px] sm:text-[11px]">Total Entradas</span>
                <button
                  onClick={onOpenIncomeModal}
                  title="Editar Salário, Comissão e Extra"
                  className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-0.5 hover:underline"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              </div>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 tabular-nums truncate block">
                +{formatCurrency(summary.totalIncome)}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px] sm:text-[11px]">Total Saídas</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-rose-400 tabular-nums truncate block">
                -{formatCurrency(summary.totalExpense)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={() => onOpenNewTransaction('income')}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>+ Entrada</span>
          </button>
          <button
            onClick={() => onOpenNewTransaction('expense')}
            className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>+ Saída / Parcela</span>
          </button>
        </div>
      </div>

      {/* 2. ENTRADAS & SAÍDAS BREAKDOWN (Lg: 7 cols) */}
      <div className="lg:col-span-7 bg-[#121927] rounded-2xl p-4 sm:p-5 border border-slate-800/80 shadow-sm flex flex-col justify-between space-y-3.5 sm:space-y-4">
        {/* Top: Spending Limit Status Banner */}
        <div className="p-3 sm:p-3.5 rounded-xl border transition-colors bg-slate-900/80 border-slate-800">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {isDanger ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : isWarning ? (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="font-bold text-slate-100 truncate">
                Limite Mensal: {formatCurrency(overallLimit)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`font-mono font-bold tabular-nums text-xs ${
                  isDanger
                    ? 'text-rose-400'
                    : isWarning
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatPercent(percentUsed, 0)} gasto
              </span>
              <button
                onClick={onOpenBudgetModal}
                title="Configurar limite de gastos"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDanger
                  ? 'bg-rose-500'
                  : isWarning
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap justify-between gap-1 text-[11px] font-mono tabular-nums text-slate-400">
            <span>Gasto no mês: {formatCurrency(overallSpent)}</span>
            <span className={isDanger ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
              {isDanger
                ? `Estourado em +${formatCurrency(overallSpent - overallLimit)}`
                : `Resta ${formatCurrency(overallLimit - overallSpent)} livre`}
            </span>
          </div>
        </div>

        {/* Bottom: 5 Key Financial Pillars */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex flex-wrap items-center justify-between gap-1.5">
            <span className="flex items-center gap-1.5">
              <span>Fontes & Gastos (Clique para filtrar)</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenIncomeModal}
                className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                <Edit3 className="w-3 h-3" />
                <span>Editar Renda</span>
              </button>
              {activeFilter && (
                <button
                  onClick={() => onSelectCategoryFilter('all')}
                  className="text-slate-400 hover:text-white hover:underline capitalize"
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* Salários */}
            <button
              onClick={() => onSelectCategoryFilter('salary')}
              className={`p-2.5 rounded-xl border text-left transition-all min-w-0 ${
                activeFilter === 'salary'
                  ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-semibold text-emerald-400 uppercase flex items-center justify-between">
                <span>Salários</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <div className="mt-1 text-xs font-bold font-mono tabular-nums text-white truncate">
                {formatCurrency(summary.salaryIncome)}
              </div>
            </button>

            {/* Comissões */}
            <button
              onClick={() => onSelectCategoryFilter('commission')}
              className={`p-2.5 rounded-xl border text-left transition-all min-w-0 ${
                activeFilter === 'commission'
                  ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-semibold text-teal-400 uppercase flex items-center justify-between">
                <span>Comissões</span>
                <TrendingUp className="w-3 h-3 text-teal-400 shrink-0" />
              </div>
              <div className="mt-1 text-xs font-bold font-mono tabular-nums text-white truncate">
                {formatCurrency(summary.commissionIncome)}
              </div>
            </button>

            {/* Compras de Cartão */}
            <button
              onClick={() => onSelectCategoryFilter('credit_card')}
              className={`p-2.5 rounded-xl border text-left transition-all min-w-0 ${
                activeFilter === 'credit_card'
                  ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-semibold text-purple-400 uppercase flex items-center justify-between">
                <span>Cartão</span>
                <CardIcon className="w-3 h-3 text-purple-400 shrink-0" />
              </div>
              <div className="mt-1 text-xs font-bold font-mono tabular-nums text-white truncate">
                {formatCurrency(summary.creditCardExpense)}
              </div>
            </button>

            {/* Dívidas Fixas */}
            <button
              onClick={() => onSelectCategoryFilter('fixed_debt')}
              className={`p-2.5 rounded-xl border text-left transition-all min-w-0 ${
                activeFilter === 'fixed_debt'
                  ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-semibold text-amber-400 uppercase flex items-center justify-between">
                <span>Fixas</span>
                <Home className="w-3 h-3 text-amber-400 shrink-0" />
              </div>
              <div className="mt-1 text-xs font-bold font-mono tabular-nums text-white truncate">
                {formatCurrency(summary.fixedDebtExpense)}
              </div>
            </button>

            {/* Gastos Variáveis */}
            <button
              onClick={() => onSelectCategoryFilter('general_expenses')}
              className={`p-2.5 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 min-w-0 ${
                activeFilter === 'general_expenses'
                  ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-semibold text-rose-400 uppercase flex items-center justify-between">
                <span>Gastos</span>
                <ShoppingBag className="w-3 h-3 text-rose-400 shrink-0" />
              </div>
              <div className="mt-1 text-xs font-bold font-mono tabular-nums text-white truncate">
                {formatCurrency(summary.generalExpense)}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
