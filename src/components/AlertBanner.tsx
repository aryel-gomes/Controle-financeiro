import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, SlidersHorizontal, X } from 'lucide-react';
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
  if (!primaryAlert) return null;

  const isDanger = primaryAlert.status === 'danger';

  return (
    <div
      role="alert"
      className={`border-b transition-all text-xs ${
        isDanger
          ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-200'
          : 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-900/80 text-amber-900 dark:text-amber-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Icon and message */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`p-1 rounded-lg shrink-0 ${
                isDanger
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400'
              }`}
            >
              {isDanger ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-bold">
                {isDanger ? 'Limite Ultrapassado:' : 'Atenção ao Limite:'}
              </span>
              <span>
                <strong>{primaryAlert.title}</strong> está em{' '}
                <span className="font-mono font-bold">
                  {formatPercent(primaryAlert.percentage, 0)}
                </span>{' '}
                ({formatCurrency(primaryAlert.spentAmount)} de {formatCurrency(primaryAlert.limitAmount)})
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {primaryAlert.category && onFilterCategory && (
              <button
                onClick={() => onFilterCategory(primaryAlert.category!)}
                className="font-medium underline hover:opacity-80 transition-opacity"
              >
                Ver gastos
              </button>
            )}

            <button
              onClick={onOpenBudgetModal}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Ajustar Teto</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              aria-label="Dispensar aviso"
              className="p-1 hover:opacity-75 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
