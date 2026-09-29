import React, { useState, useEffect } from 'react';
import { X, Check, Banknote, TrendingUp, Sparkles, Calendar, CheckSquare, Square } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface IncomeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSalary: number;
  currentCommission: number;
  currentExtra: number;
  selectedMonthName: string;
  onSaveIncomes: (data: {
    salary: number;
    commission: number;
    extra: number;
    applyToAllMonths: boolean;
  }) => void;
}

export const IncomeConfigModal: React.FC<IncomeConfigModalProps> = ({
  isOpen,
  onClose,
  currentSalary,
  currentCommission,
  currentExtra,
  selectedMonthName,
  onSaveIncomes,
}) => {
  const [salaryStr, setSalaryStr] = useState('');
  const [commissionStr, setCommissionStr] = useState('');
  const [extraStr, setExtraStr] = useState('');
  const [applyToAllMonths, setApplyToAllMonths] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSalaryStr(currentSalary > 0 ? currentSalary.toString() : '');
      setCommissionStr(currentCommission > 0 ? currentCommission.toString() : '');
      setExtraStr(currentExtra > 0 ? currentExtra.toString() : '');
      setApplyToAllMonths(true);
    }
  }, [isOpen, currentSalary, currentCommission, currentExtra]);

  if (!isOpen) return null;

  const parsedSalary = parseFloat(salaryStr.replace(',', '.')) || 0;
  const parsedCommission = parseFloat(commissionStr.replace(',', '.')) || 0;
  const parsedExtra = parseFloat(extraStr.replace(',', '.')) || 0;
  const totalProjected = parsedSalary + parsedCommission + parsedExtra;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIncomes({
      salary: parsedSalary,
      commission: parsedCommission,
      extra: parsedExtra,
      applyToAllMonths,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Definir Entradas & Renda Mensal
              </h3>
              <p className="text-xs text-slate-400">
                Configure salário, comissões e extras para o mês ou ano todo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Salário Fixo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Salário Fixo Mensal</span>
              </label>
              <span className="text-[11px] text-slate-400">Principal</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={salaryStr}
                onChange={(e) => setSalaryStr(e.target.value)}
                placeholder="6.500,00"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tabular-nums bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 2. Comissões Previstas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                <span>Comissões de Vendas / Metas</span>
              </label>
              <span className="text-[11px] text-slate-400">Variável</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={commissionStr}
                onChange={(e) => setCommissionStr(e.target.value)}
                placeholder="1.950,00"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tabular-nums bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 3. Renda Extra / Freelance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Renda Extra / Freelance / Outros</span>
              </label>
              <span className="text-[11px] text-slate-400">Opcional</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={extraStr}
                onChange={(e) => setExtraStr(e.target.value)}
                placeholder="650,00"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tabular-nums bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Total Preview */}
          <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Total de Entradas Previsto:</span>
            <span className="text-base font-bold font-mono tabular-nums text-emerald-400">
              {formatCurrency(totalProjected)}
            </span>
          </div>

          {/* Checkbox: Apply to all months */}
          <div
            onClick={() => setApplyToAllMonths(!applyToAllMonths)}
            className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors cursor-pointer flex items-start gap-2.5 text-xs"
          >
            <div className="text-emerald-400 mt-0.5">
              {applyToAllMonths ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div>
              <span className="font-bold text-white block">
                Repetir estes valores em todos os meses futuros
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {applyToAllMonths
                  ? '✓ Seu salário e receitas serão projetados automaticamente em todos os meses da linha do tempo.'
                  : `Aplicar apenas no mês de ${selectedMonthName}.`}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Entradas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
