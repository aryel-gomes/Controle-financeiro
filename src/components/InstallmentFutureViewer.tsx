import React from 'react';
import { CreditCard as CardIcon } from 'lucide-react';
import { Transaction } from '../types/finance';
import { formatCurrency, getMonthShortName } from '../utils/formatters';

interface InstallmentFutureViewerProps {
  transactions: Transaction[];
  onSelectMonthYear: (year: number, month: number) => void;
  selectedMonthKey: string;
}

export const InstallmentFutureViewer: React.FC<InstallmentFutureViewerProps> = ({
  transactions,
  onSelectMonthYear,
  selectedMonthKey,
}) => {
  // Group all transactions that have totalInstallments > 1 by their description or groupId
  const installmentGroups = React.useMemo(() => {
    const map = new Map<
      string,
      {
        title: string;
        cardName?: string;
        amountPerMonth: number;
        totalInstallments: number;
        items: Transaction[];
      }
    >();

    transactions.forEach((tx) => {
      if (tx.totalInstallments && tx.totalInstallments > 1) {
        const key =
          tx.installmentGroupId ||
          tx.description.replace(/\(Parcela \d+\/\d+\)/i, '').trim();

        if (!map.has(key)) {
          map.set(key, {
            title: tx.description.replace(/\(Parcela \d+\/\d+\)/i, '').trim(),
            cardName: tx.cardName,
            amountPerMonth: tx.amount,
            totalInstallments: tx.totalInstallments,
            items: [],
          });
        }

        const group = map.get(key)!;
        if (!group.items.some((i) => i.date === tx.date)) {
          group.items.push(tx);
        }
      }
    });

    map.forEach((g) => {
      g.items.sort((a, b) => a.date.localeCompare(b.date));
    });

    return Array.from(map.values());
  }, [transactions]);

  if (installmentGroups.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#121927] rounded-2xl p-5 border border-slate-800/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CardIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Mapa de Compras & Dívidas Parceladas nos Próximos Meses
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe o cronograma de parcelas futuras e clique para ir direto ao mês
          </p>
        </div>
        <span className="text-xs font-mono font-medium text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/60">
          {installmentGroups.length} compra{installmentGroups.length > 1 ? 's' : ''} parcelada
          {installmentGroups.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3.5">
        {installmentGroups.map((group, idx) => {
          const totalPaid = group.items.filter((i) => i.isPaid).length;
          const remainingValue =
            group.amountPerMonth * (group.totalInstallments - totalPaid);

          return (
            <div
              key={idx}
              className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2.5"
            >
              {/* Top row: Title, Card, and Amounts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{group.title}</span>
                  {group.cardName && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      · {group.cardName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                  <span className="text-slate-300">
                    {group.totalInstallments}x de{' '}
                    <strong className="text-purple-400">
                      {formatCurrency(group.amountPerMonth)}
                    </strong>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">
                    Resta {formatCurrency(remainingValue)}
                  </span>
                </div>
              </div>

              {/* Installment Pills Ribbon */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {group.items.map((item) => {
                  const isCurrentSelectedMonth = item.date.startsWith(selectedMonthKey);
                  const [y, m] = item.date.split('-').map(Number);
                  const monthShort = getMonthShortName(m - 1);

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectMonthYear(y, m - 1)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums border flex items-center gap-1 shrink-0 transition-all ${
                        isCurrentSelectedMonth
                          ? 'bg-purple-600 border-purple-500 text-white shadow-sm font-bold ring-1 ring-purple-400'
                          : item.isPaid
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-purple-500/60 hover:text-white'
                      }`}
                      title={`Ir para ${monthShort}/${y}`}
                    >
                      <span>
                        {item.currentInstallment || 1}/{item.totalInstallments}
                      </span>
                      <span className="text-[10px] opacity-75">({monthShort})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
