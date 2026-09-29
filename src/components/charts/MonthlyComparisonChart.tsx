import React, { useState } from 'react';
import { MonthSummary } from '../../types/finance';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface MonthlyComparisonChartProps {
  historyData: MonthSummary[];
  selectedMonthKey: string;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  historyData,
  selectedMonthKey,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'balance' | 'expenses_breakdown'>('balance');

  const maxVal = Math.max(
    ...historyData.map((d) => Math.max(d.totalIncome, d.totalExpense)),
    1000
  );

  const activeItem =
    hoveredIndex !== null
      ? historyData[hoveredIndex]
      : historyData[historyData.length - 1];

  return (
    <div className="bg-[#121927] rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between shadow-sm">
      {/* Header with Title and Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">
            Comparativo Mensal (Últimos 6 Meses)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evolução de entradas, saídas e economia acumulada
          </p>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('balance')}
            className={`px-2.5 py-1 font-medium rounded-lg transition-all ${
              viewMode === 'balance'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entradas x Saídas
          </button>
          <button
            onClick={() => setViewMode('expenses_breakdown')}
            className={`px-2.5 py-1 font-medium rounded-lg transition-all ${
              viewMode === 'expenses_breakdown'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Detalhamento Saídas
          </button>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="mt-6 h-52 relative flex items-end">
        <div className="w-full h-full flex items-end justify-between gap-2 sm:gap-4 pt-4 pb-6 border-b border-slate-800">
          {historyData.map((item, index) => {
            const isSelected = item.monthKey === selectedMonthKey;
            const isHovered = hoveredIndex === index;

            const incomeHeight = Math.max(8, (item.totalIncome / maxVal) * 160);
            const expenseHeight = Math.max(8, (item.totalExpense / maxVal) * 160);

            const cardHeight = (item.creditCardExpense / maxVal) * 160;
            const fixedHeight = (item.fixedDebtExpense / maxVal) * 160;
            const generalHeight = (item.generalExpense / maxVal) * 160;

            return (
              <div
                key={item.monthKey}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group transition-opacity ${
                  hoveredIndex !== null && !isHovered ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {/* Bars Area */}
                {viewMode === 'balance' ? (
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 px-1">
                    {/* Income Bar (Green) */}
                    <div
                      style={{ height: `${incomeHeight}px` }}
                      className={`w-1/2 max-w-[28px] rounded-t-sm transition-all duration-300 ${
                        isSelected || isHovered ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-emerald-600/80'
                      }`}
                    />
                    {/* Expense Bar (Rose) */}
                    <div
                      style={{ height: `${expenseHeight}px` }}
                      className={`w-1/2 max-w-[28px] rounded-t-sm transition-all duration-300 ${
                        isSelected || isHovered ? 'bg-rose-500 shadow-sm shadow-rose-500/20' : 'bg-rose-600/80'
                      }`}
                    />
                  </div>
                ) : (
                  /* Stacked Expense Bar */
                  <div className="w-full max-w-[36px] flex flex-col justify-end items-center px-1">
                    <div
                      style={{ height: `${Math.max(4, generalHeight)}px` }}
                      className="w-full bg-rose-500 rounded-t-sm"
                      title={`Gastos: ${formatCurrency(item.generalExpense)}`}
                    />
                    <div
                      style={{ height: `${Math.max(4, fixedHeight)}px` }}
                      className="w-full bg-amber-500"
                      title={`Fixas: ${formatCurrency(item.fixedDebtExpense)}`}
                    />
                    <div
                      style={{ height: `${Math.max(4, cardHeight)}px` }}
                      className="w-full bg-purple-500 rounded-b-xs"
                      title={`Cartão: ${formatCurrency(item.creditCardExpense)}`}
                    />
                  </div>
                )}

                {/* X-Axis Label */}
                <div
                  className={`mt-2 text-xs font-mono tabular-nums text-center whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'font-bold text-emerald-400'
                      : isHovered
                      ? 'text-white font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {item.label}
                  {isSelected && (
                    <span className="block w-1.5 h-1.5 bg-emerald-400 rounded-full mx-auto mt-0.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        {activeItem && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums text-xs">
            <span className="font-semibold text-white">{activeItem.label}:</span>
            <span className="text-emerald-400">
              +{formatCurrency(activeItem.totalIncome)}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-rose-400">
              -{formatCurrency(activeItem.totalExpense)}
            </span>
            <span className="text-slate-600">·</span>
            <span
              className={
                activeItem.netBalance >= 0 ? 'text-slate-200' : 'text-rose-400'
              }
            >
              Saldo: {formatCurrency(activeItem.netBalance)} ({formatPercent(activeItem.savingsRate, 0)})
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-slate-400 text-xs shrink-0">
          {viewMode === 'balance' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span>Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                <span>Saídas</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-purple-500" />
                <span>Cartão</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                <span>Fixas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                <span>Gastos</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
