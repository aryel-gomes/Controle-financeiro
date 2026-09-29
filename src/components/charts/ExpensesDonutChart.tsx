import React, { useState } from 'react';
import { MonthSummary } from '../../types/finance';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface ExpensesDonutChartProps {
  summary: MonthSummary;
  onFilterCategory?: (category: string) => void;
}

export const ExpensesDonutChart: React.FC<ExpensesDonutChartProps> = ({
  summary,
  onFilterCategory,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const total = summary.totalExpense;

  const slices = [
    {
      id: 'credit_card',
      label: 'Compras de Cartão',
      value: summary.creditCardExpense,
      color: '#a855f7', // purple-500
      hoverColor: '#c084fc',
      textColor: 'text-purple-400',
    },
    {
      id: 'fixed_debt',
      label: 'Dívidas Fixas',
      value: summary.fixedDebtExpense,
      color: '#f59e0b', // amber-500
      hoverColor: '#fbbf24',
      textColor: 'text-amber-400',
    },
    {
      id: 'general_expenses',
      label: 'Gastos Variáveis',
      value: summary.generalExpense,
      color: '#f43f5e', // rose-500
      hoverColor: '#fb7185',
      textColor: 'text-rose-400',
    },
  ];

  let cumulativeAngle = 0;
  const radius = 68;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-[#121927] rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              Distribuição das Saídas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cartão x Dívidas Fixas x Gastos Variáveis
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-300 tabular-nums">
            Total: {formatCurrency(total)}
          </span>
        </div>

        {total === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-slate-500 text-xs">
            Nenhuma despesa registrada neste mês.
          </div>
        ) : (
          <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                {slices.map((slice) => {
                  const percent = total > 0 ? slice.value / total : 0;
                  const strokeDasharray = `${percent * circumference} ${circumference}`;
                  const strokeDashoffset = -cumulativeAngle * circumference;
                  cumulativeAngle += percent;

                  const isHovered = hoveredSlice === slice.id;

                  return (
                    <circle
                      key={slice.id}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={isHovered ? slice.hoverColor : slice.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredSlice(slice.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => onFilterCategory && onFilterCategory(slice.id)}
                    />
                  );
                })}
              </svg>

              {/* Center Stat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  {hoveredSlice
                    ? slices.find((s) => s.id === hoveredSlice)?.label
                    : 'Total Saídas'}
                </span>
                <span className="text-sm font-bold font-mono tabular-nums text-white mt-0.5">
                  {formatCurrency(
                    hoveredSlice
                      ? slices.find((s) => s.id === hoveredSlice)?.value || 0
                      : total
                  )}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {formatPercent(
                    total > 0
                      ? ((hoveredSlice
                          ? slices.find((s) => s.id === hoveredSlice)?.value || 0
                          : total) /
                          total) *
                          100
                      : 0,
                    1
                  )}
                </span>
              </div>
            </div>

            {/* Legend & Percentages */}
            <div className="w-full sm:w-auto flex-1 space-y-2">
              {slices.map((slice) => {
                const percent = total > 0 ? (slice.value / total) * 100 : 0;
                const isHovered = hoveredSlice === slice.id;

                return (
                  <div
                    key={slice.id}
                    onMouseEnter={() => setHoveredSlice(slice.id)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => onFilterCategory && onFilterCategory(slice.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-colors border ${
                      isHovered
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'border-slate-800/60 bg-slate-900/50 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="font-semibold text-slate-200">
                          {slice.label}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-bold text-white">
                        {formatCurrency(slice.value)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                      <span>Representatividade</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-300">
                        {formatPercent(percent, 1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
