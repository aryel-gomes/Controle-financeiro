import React, { useState } from 'react';
import { X, Check, SlidersHorizontal, ShieldAlert, RotateCcw } from 'lucide-react';
import { BudgetLimit } from '../types/finance';
import { INITIAL_BUDGET_LIMITS } from '../utils/sampleData';

interface BudgetLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetLimits: BudgetLimit[];
  onSaveLimits: (updatedLimits: BudgetLimit[]) => void;
}

export const BudgetLimitModal: React.FC<BudgetLimitModalProps> = ({
  isOpen,
  onClose,
  budgetLimits,
  onSaveLimits,
}) => {
  const [limits, setLimits] = useState<BudgetLimit[]>(budgetLimits);

  if (!isOpen) return null;

  const handleChangeAmount = (id: string, amount: number) => {
    setLimits((prev) =>
      prev.map((lim) => (lim.id === id ? { ...lim, monthlyLimit: amount } : lim))
    );
  };

  const handleChangeThreshold = (id: string, threshold: number) => {
    setLimits((prev) =>
      prev.map((lim) =>
        lim.id === id ? { ...lim, alertThresholdPercent: threshold } : lim
      )
    );
  };

  const handleToggle = (id: string) => {
    setLimits((prev) =>
      prev.map((lim) => (lim.id === id ? { ...lim, enabled: !lim.enabled } : lim))
    );
  };

  const handleResetDefaults = () => {
    setLimits(INITIAL_BUDGET_LIMITS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLimits(limits);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Configurar Limites & Alertas
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Defina os tetos mensais e margens de risco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Como funcionam os alertas:</strong> Quando seus gastos atingirem o
              percentual configurado (ex: 80%), o FinanPlan exibirá um aviso e
              destacará o status. Caso ultrapasse 100%, você receberá o
              alerta de limite estourado.
            </div>
          </div>

          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {limits.map((lim) => (
              <div key={lim.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`chk-${lim.id}`}
                      checked={lim.enabled}
                      onChange={() => handleToggle(lim.id)}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor={`chk-${lim.id}`}
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {lim.title}
                    </label>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Gatilho: {lim.alertThresholdPercent}%
                  </span>
                </div>

                {lim.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Limite Mensal (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                          R$
                        </span>
                        <input
                          type="number"
                          step="50"
                          min="0"
                          value={lim.monthlyLimit}
                          onChange={(e) =>
                            handleChangeAmount(lim.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono tabular-nums font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Avisar com:
                        </label>
                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          {lim.alertThresholdPercent}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={lim.alertThresholdPercent}
                        onChange={(e) =>
                          handleChangeThreshold(lim.id, parseInt(e.target.value) || 80)
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrões</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Limites</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
