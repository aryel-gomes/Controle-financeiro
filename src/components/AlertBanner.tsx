import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, ArrowRight, X, SlidersHorizontal } from 'lucide-react';
import { LimitAlert } from '../hooks/useFinanceStore';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface AlertBannerProps {
  alerts: LimitAlert[];
  onOpenBudgetModal: () => void;
  onFilterCategory?: (category: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onOpenBudgetModal,
  onFilterCategory,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (alerts.length === 0 || isDismissed) {
    return null;
  }

  const dangerAlerts = alerts.filter((a) => a.status === 'danger');
  const warningAlerts = alerts.filter((a) => a.status === 'warning');

  const primaryAlert = dangerAlerts[0] || warningAlerts[0];
  const isDanger = primaryAlert.status === 'danger';

  return (
    <div
      role="alert"
      className={`border-b transition-all ${
        isDanger
          ? 'bg-rose-950/70 border-rose-900/80 text-rose-200'
          : 'bg-amber-950/70 border-amber-900/80 text-amber-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Icon and message */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-1 rounded-lg shrink-0 ${
                isDanger ? 'bg-rose-900/60 text-rose-400' : 'bg-amber-900/60 text-amber-400'
              }`}
            >
              {isDanger ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-bold text-white">
                {isDanger ? 'Alerta de Limite Ultrapassado:' : 'Atenção ao Orçamento:'}
              </span>
              <span>
                <strong>{primaryAlert.title}</strong> atingiu{' '}
                <span className="font-mono font-bold text-white">
                  {formatPercent(primaryAlert.percentage, 0)}
                </span>{' '}
                do teto ({formatCurrency(primaryAlert.spentAmount)} de{' '}
                {formatCurrency(primaryAlert.limitAmount)}).
              </span>
              {isDanger ? (
                <span className="font-bold text-rose-400">
                  Excedeu {formatCurrency(primaryAlert.overspent)}.
                </span>
              ) : (
                <span className="text-amber-300">
                  Restam {formatCurrency(primaryAlert.remaining)}.
                </span>
              )}
              {alerts.length > 1 && (
                <span className="text-slate-400 font-medium">
                  (+{alerts.length - 1} outro{alerts.length > 2 ? 's' : ''} limite
                  {alerts.length > 2 ? 's' : ''} em atenção)
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onFilterCategory && primaryAlert.category !== 'overall' && (
              <button
                onClick={() => onFilterCategory(primaryAlert.category)}
                className={`px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1 transition-colors ${
                  isDanger
                    ? 'hover:bg-rose-900/60 text-rose-300'
                    : 'hover:bg-amber-900/60 text-amber-300'
                }`}
              >
                <span>Ver gastos</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={onOpenBudgetModal}
              className={`px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1 border transition-colors ${
                isDanger
                  ? 'bg-rose-600 text-white border-rose-500 hover:bg-rose-500'
                  : 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Ajustar Limites</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              aria-label="Dispensar aviso"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
