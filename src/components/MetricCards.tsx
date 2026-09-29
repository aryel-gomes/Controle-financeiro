import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MonthSummary } from '../types/finance';
import { LimitAlert } from '../hooks/useFinanceStore';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface MetricCardsProps {
  summary: MonthSummary;
  overallAlert?: LimitAlert;
  onOpenBudgetModal: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  summary,
  overallAlert,
  onOpenBudgetModal,
}) => {
  const isPositiveBalance = summary.netBalance >= 0;
  const overallLimit = overallAlert?.limitAmount || 5500;
  const overallSpent = summary.totalExpense;
  const overallPercent = overallLimit > 0 ? (overallSpent / overallLimit) * 100 : 0;
  const isLimitExceeded = overallPercent >= 100;
  const isLimitWarning = overallPercent >= (overallAlert?.percentage ? 80 : 80);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: Saldo Líquido */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between transition-shadow hover:shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo do Mês
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                isPositiveBalance ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
                isPositiveBalance ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Taxa de Poupança</span>
          <span className="font-mono font-medium text-slate-800">
            {formatPercent(summary.savingsRate, 1)} economizado
          </span>
        </div>
      </div>

      {/* CARD 2: Total Entradas (Salários + Comissões) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between transition-shadow hover:shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Entradas
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-emerald-700">
              {formatCurrency(summary.totalIncome)}
            </div>
          </div>
        </div>

        {/* Breakdown Salários & Comissões */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Salários</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-800">
              {formatCurrency(summary.salaryIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>Comissões</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-800">
              {formatCurrency(summary.commissionIncome)}
            </span>
          </div>

          {summary.otherIncome > 0 && (
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Outros</span>
              </span>
              <span className="font-mono tabular-nums">
                {formatCurrency(summary.otherIncome)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CARD 3: Total Saídas (Cartão + Fixas + Gastos) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between transition-shadow hover:shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Saídas
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
              {formatCurrency(summary.totalExpense)}
            </div>
          </div>
        </div>

        {/* Breakdown: Cartão, Dívidas Fixas, Gastos */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Compras de Cartão</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-800">
              {formatCurrency(summary.creditCardExpense)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Dívidas Fixas</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-800">
              {formatCurrency(summary.fixedDebtExpense)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Gastos Variáveis</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-800">
              {formatCurrency(summary.generalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 4: Orçamento & Limite Geral */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between transition-shadow hover:shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Limite de Gastos
            </span>
            <button
              onClick={onOpenBudgetModal}
              title="Configurar limites"
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isLimitExceeded ? (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              ) : isLimitWarning ? (
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </button>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
              {formatPercent(overallPercent, 0)}
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Teto: {formatCurrency(overallLimit)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Status</span>
          <span
            className={`font-medium font-mono tabular-nums ${
              isLimitExceeded
                ? 'text-rose-600'
                : isLimitWarning
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            {isLimitExceeded
              ? `Estourado (+${formatCurrency(overallSpent - overallLimit)})`
              : `Resta ${formatCurrency(overallLimit - overallSpent)}`}
          </span>
        </div>
      </div>
    </div>
  );
};
