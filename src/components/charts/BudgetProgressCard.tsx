import React from 'react';
import { ShieldCheck, ShieldAlert, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { LimitAlert } from '../../hooks/useFinanceStore';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface BudgetProgressCardProps {
  alerts: LimitAlert[];
  onOpenBudgetModal: () => void;
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  alerts,
  onOpenBudgetModal,
}) => {
  return (
    <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 flex flex-col justify-between shadow-xs transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Acompanhamento de Limites de Gastos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Alertas em tempo real sobre os tetos orçamentários definidos
          </p>
        </div>

        <button
          onClick={onOpenBudgetModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors shadow-xs"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Configurar Limites</span>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {alerts.map((item) => {
          const isDanger = item.status === 'danger';
          const isWarning = item.status === 'warning';

          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isDanger ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : isWarning ? (
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      isDanger
                        ? 'text-rose-600 dark:text-rose-400'
                        : isWarning
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isDanger
                      ? 'Ultrapassado'
                      : isWarning
                      ? 'Atenção'
                      : 'Dentro da Meta'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">·</span>
                  <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatPercent(item.percentage, 0)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDanger
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>

              {/* Spending vs Limit Details */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <span>
                  Gasto:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.spentAmount)}
                  </strong>{' '}
                  de {formatCurrency(item.limitAmount)}
                </span>
                <span>
                  {isDanger ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      Estourado em +{formatCurrency(item.spentAmount - item.limitAmount)}
                    </span>
                  ) : (
                    <span>
                      Resta{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.limitAmount - item.spentAmount)}
                      </strong>{' '}
                      livre
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
