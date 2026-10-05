import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  CreditCard as CardIcon,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Wallet,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { Transaction } from '../types/finance';
import {
  formatCurrency,
  formatPercent,
  getMonthName,
  getMonthShortName,
  addMonthsToDateString,
} from '../utils/formatters';

interface FutureProjectionViewerProps {
  transactions: Transaction[];
  onSelectMonthYear: (year: number, month: number) => void;
  onOpenNewTransaction: () => void;
  onOpenIncomeModal: () => void;
}

interface MonthlyProjection {
  year: number;
  month: number; // 0-indexed
  monthKey: string; // YYYY-MM
  label: string;
  isCurrent: boolean;
  totalIncome: number;
  totalExpense: number;
  cardInstallmentExpense: number;
  fixedDebtExpense: number;
  generalExpense: number;
  netBalance: number;
  cumulativeBalance: number;
  activeInstallments: {
    description: string;
    cardName?: string;
    amount: number;
    currentInstallment: number;
    totalInstallments: number;
    groupId?: string;
    isFinalInstallment: boolean;
  }[];
  finishedPurchasesThisMonth: {
    description: string;
    cardName?: string;
    amount: number;
    totalInstallments: number;
  }[];
}

interface PurchasePayoff {
  key: string;
  title: string;
  cardName?: string;
  amountPerMonth: number;
  totalInstallments: number;
  remainingInstallments: number;
  payoffMonthKey: string;
  payoffLabel: string;
}

export const FutureProjectionViewer: React.FC<FutureProjectionViewerProps> = ({
  transactions,
  onSelectMonthYear,
  onOpenNewTransaction,
  onOpenIncomeModal,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'commitments_only'>('all');

  // Baseline monthly regular income estimation
  const baselineMonthlyIncome = useMemo(() => {
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curIncomes = transactions.filter(
      (t) => t.type === 'income' && t.date.startsWith(curKey)
    );
    const sumCurrent = curIncomes.reduce((acc, t) => acc + t.amount, 0);
    if (sumCurrent > 0) return sumCurrent;

    // Fallback: check any month with incomes
    const allIncomes = transactions.filter((t) => t.type === 'income');
    if (allIncomes.length > 0) {
      const monthGroups = new Map<string, number>();
      allIncomes.forEach((t) => {
        const m = t.date.slice(0, 7);
        monthGroups.set(m, (monthGroups.get(m) || 0) + t.amount);
      });
      const totals = Array.from(monthGroups.values());
      return totals.reduce((a, b) => a + b, 0) / totals.length;
    }
    return 4500;
  }, [transactions]);

  // Baseline fixed debts estimation
  const baselineFixedDebts = useMemo(() => {
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fixedInMonth = transactions.filter(
      (t) => t.type === 'expense' && t.category === 'fixed_debt' && t.date.startsWith(curKey)
    );
    return fixedInMonth.reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  // Compute projection timeline starting from current month to the end of all commitments
  const { projectionList, purchasesPayoffList, overallStats } = useMemo(() => {
    const now = new Date();
    const baseYear = now.getFullYear();
    const baseMonth = now.getMonth(); // 0-indexed

    // Calculate furthest month among all debts and installments
    let maxYear = baseYear;
    let maxMonth = baseMonth + 5; // at least 6 months forward
    if (maxMonth >= 12) {
      maxYear += Math.floor(maxMonth / 12);
      maxMonth = maxMonth % 12;
    }

    transactions.forEach((tx) => {
      if (tx.date) {
        const [y, m] = tx.date.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m)) {
          const txMonthIndex = m - 1;
          if (y > maxYear || (y === maxYear && txMonthIndex > maxMonth)) {
            maxYear = y;
            maxMonth = txMonthIndex;
          }
        }
      }

      // Projected installment end date
      if (tx.totalInstallments && tx.totalInstallments > 1 && tx.date) {
        const currentInst = tx.currentInstallment || 1;
        const remainingMonths = Math.max(0, tx.totalInstallments - currentInst);
        if (remainingMonths > 0) {
          const projectedEndDate = addMonthsToDateString(tx.date, remainingMonths);
          const [ey, em] = (projectedEndDate || '').split('-').map(Number);
          if (!isNaN(ey) && !isNaN(em)) {
            const endMonthIndex = em - 1;
            if (ey > maxYear || (ey === maxYear && endMonthIndex > maxMonth)) {
              maxYear = ey;
              maxMonth = endMonthIndex;
            }
          }
        }
      }
    });

    // Generate monthly projection entries
    let curYear = baseYear;
    let curMonth = baseMonth;
    let cumulative = 0;

    const list: MonthlyProjection[] = [];

    while (curYear < maxYear || (curYear === maxYear && curMonth <= maxMonth)) {
      const monthKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
      const isCurrent = curYear === baseYear && curMonth === baseMonth;

      // Transactions recorded in that month
      const monthTxs = transactions.filter((t) => t.date.startsWith(monthKey));

      // 1. Income for this month
      const specificIncomes = monthTxs.filter((t) => t.type === 'income');
      const totalIncome =
        specificIncomes.length > 0
          ? specificIncomes.reduce((acc, t) => acc + t.amount, 0)
          : baselineMonthlyIncome;

      // 2. Installments active in this month
      // Collect direct installment transactions matching this month
      const activeInstallments: MonthlyProjection['activeInstallments'] = [];
      const finishedPurchasesThisMonth: MonthlyProjection['finishedPurchasesThisMonth'] = [];

      monthTxs.forEach((t) => {
        if (t.type === 'expense' && t.totalInstallments && t.totalInstallments > 1) {
          const curInst = t.currentInstallment || 1;
          const totalInst = t.totalInstallments;
          const isFinal = curInst === totalInst;

          activeInstallments.push({
            description: t.description,
            cardName: t.cardName,
            amount: t.amount,
            currentInstallment: curInst,
            totalInstallments: totalInst,
            groupId: t.installmentGroupId,
            isFinalInstallment: isFinal,
          });

          if (isFinal) {
            finishedPurchasesThisMonth.push({
              description: t.description,
              cardName: t.cardName,
              amount: t.amount,
              totalInstallments: totalInst,
            });
          }
        }
      });

      const cardInstallmentExpense = activeInstallments.reduce(
        (acc, i) => acc + i.amount,
        0
      );

      // Fixed debts
      const fixedTxs = monthTxs.filter(
        (t) => t.type === 'expense' && t.category === 'fixed_debt'
      );
      const fixedDebtExpense =
        fixedTxs.length > 0
          ? fixedTxs.reduce((acc, t) => acc + t.amount, 0)
          : baselineFixedDebts;

      // Other variable expenses recorded for that month
      const otherExpenses = monthTxs.filter(
        (t) =>
          t.type === 'expense' &&
          t.category !== 'fixed_debt' &&
          (!t.totalInstallments || t.totalInstallments <= 1)
      );
      const generalExpense = otherExpenses.reduce((acc, t) => acc + t.amount, 0);

      const totalExpense = cardInstallmentExpense + fixedDebtExpense + generalExpense;
      const netBalance = totalIncome - totalExpense;
      cumulative += netBalance;

      list.push({
        year: curYear,
        month: curMonth,
        monthKey,
        label: `${getMonthShortName(curMonth)}/${String(curYear).slice(2)}`,
        isCurrent,
        totalIncome,
        totalExpense,
        cardInstallmentExpense,
        fixedDebtExpense,
        generalExpense,
        netBalance,
        cumulativeBalance: cumulative,
        activeInstallments,
        finishedPurchasesThisMonth,
      });

      curMonth++;
      if (curMonth >= 12) {
        curMonth = 0;
        curYear++;
      }
    }

    // Purchase Payoff roadmap
    const purchaseGroups = new Map<string, PurchasePayoff>();
    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.totalInstallments && tx.totalInstallments > 1) {
        const groupKey =
          tx.installmentGroupId ||
          `${tx.description.trim().toLowerCase()}_${tx.cardName || ''}_${tx.totalInstallments}`;

        const currentInst = tx.currentInstallment || 1;
        const totalInst = tx.totalInstallments;
        const remaining = Math.max(0, totalInst - currentInst);
        const endDate = addMonthsToDateString(tx.date, remaining);
        const [ey, em] = (endDate || '').split('-').map(Number);
        const payoffLabel =
          !isNaN(ey) && !isNaN(em)
            ? `${getMonthName(em - 1)}/${ey}`
            : 'Futuro';

        if (!purchaseGroups.has(groupKey)) {
          purchaseGroups.set(groupKey, {
            key: groupKey,
            title: tx.description,
            cardName: tx.cardName,
            amountPerMonth: tx.amount,
            totalInstallments: totalInst,
            remainingInstallments: remaining,
            payoffMonthKey: endDate.slice(0, 7),
            payoffLabel,
          });
        }
      }
    });

    const purchasesPayoffList = Array.from(purchaseGroups.values()).sort((a, b) =>
      a.payoffMonthKey.localeCompare(b.payoffMonthKey)
    );

    // Compute Overall KPI statistics
    let maxExpenseMonth = list[0] || null;
    let minExpenseMonth = list[0] || null;
    let totalCommittedInstallments = 0;

    list.forEach((m) => {
      totalCommittedInstallments += m.cardInstallmentExpense;
      if (!maxExpenseMonth || m.totalExpense > maxExpenseMonth.totalExpense) {
        maxExpenseMonth = m;
      }
      if (!minExpenseMonth || m.totalExpense < minExpenseMonth.totalExpense) {
        minExpenseMonth = m;
      }
    });

    // Month of biggest relief (where installments drop to zero or reach lowest level)
    const reliefMonth = list.find((m) => m.cardInstallmentExpense === 0) || minExpenseMonth;
    const finalDebtMonth = list[list.length - 1];

    const overallStats = {
      totalMonthsProjected: list.length,
      totalCommittedInstallments,
      maxExpenseMonth,
      reliefMonth,
      finalDebtMonth,
      averageMonthlySavings:
        list.length > 0 ? cumulative / list.length : 0,
    };

    return { projectionList: list, purchasesPayoffList, overallStats };
  }, [transactions, baselineMonthlyIncome, baselineFixedDebts]);

  // Selected or active item for detailed inspection
  const focusedMonth = useMemo(() => {
    if (selectedMonthKey) {
      return (
        projectionList.find((m) => m.monthKey === selectedMonthKey) ||
        projectionList[0]
      );
    }
    return projectionList.find((m) => m.isCurrent) || projectionList[0];
  }, [projectionList, selectedMonthKey]);

  // Max expense value for chart scaling (focuses purely on outgoing expenses)
  const chartMaxExpense = useMemo(() => {
    return Math.max(
      ...projectionList.map((m) => m.totalExpense),
      800
    );
  }, [projectionList]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121927] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Projeção Financeira Futura</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                {overallStats.totalMonthsProjected} Meses Projetados
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhe a curva de despesas parceladas, saldo previsto e datas de quitação de todas as suas compras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenIncomeModal}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
          >
            Ajustar Renda Base
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors"
          >
            + Novo Lançamento
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Compromissado */}
        <div className="p-4 bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Parcelas a Vencer</span>
            <div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <CardIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(overallStats.totalCommittedInstallments)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Soma de todas as parcelas futuras comprometidas
          </p>
        </div>

        {/* Card 2: Mês de Pico */}
        <div className="p-4 bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Mês com Maior Saída</span>
            <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {overallStats.maxExpenseMonth
              ? formatCurrency(overallStats.maxExpenseMonth.totalExpense)
              : 'R$ 0,00'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Pico de gastos previsto em{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {overallStats.maxExpenseMonth?.label}
            </strong>
          </p>
        </div>

        {/* Card 3: Mês de Alívio */}
        <div className="p-4 bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Alívio Financeiro</span>
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {overallStats.reliefMonth?.label || 'Em breve'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Quando as principais parcelas terminam e o caixa folga
          </p>
        </div>

        {/* Card 4: Quitação Definitiva */}
        <div className="p-4 bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Quitação Definitiva</span>
            <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
            {overallStats.finalDebtMonth?.label || 'Nenhuma'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Término de 100% das parcelas atualmente cadastradas
          </p>
        </div>
      </div>

      {/* 3. Interactive Visual Multi-Month Projection Chart (Expenses & Commitments only) */}
      <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Curva de Saídas & Parcelamentos Futuros</span>
              <span className="text-xs text-slate-400 font-normal">
                (Clique em qualquer mês para detalhar abaixo)
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Evolução das despesas compromissadas mês a mês até a quitação de todas as parcelas
            </p>
          </div>

          {/* Chart Legend (Saídas strictly) */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-purple-500" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                Parcelas de Cartão
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                Dívidas Fixas
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-400" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                Outros Gastos
              </span>
            </div>
          </div>
        </div>

        {/* Chart Bars Area */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="min-w-[620px] h-64 pt-6 pb-2 flex items-end justify-between gap-2">
            {projectionList.map((item) => {
              const isSelected = item.monthKey === focusedMonth?.monthKey;

              const cardHeight = Math.max(0, (item.cardInstallmentExpense / chartMaxExpense) * 170);
              const fixedHeight = Math.max(0, (item.fixedDebtExpense / chartMaxExpense) * 170);
              const otherHeight = Math.max(0, (item.generalExpense / chartMaxExpense) * 170);
              const totalExpenseHeight = Math.max(8, cardHeight + fixedHeight + otherHeight);

              return (
                <div
                  key={item.monthKey}
                  onClick={() => setSelectedMonthKey(item.monthKey)}
                  className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer group transition-all p-1 rounded-xl ${
                    isSelected
                      ? 'bg-slate-100/90 dark:bg-slate-800/80 ring-2 ring-purple-500/50 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  {/* Top quick tag: Total Outgoing Expense */}
                  <div className="font-mono text-[10px] font-bold tabular-nums mb-1.5 text-slate-700 dark:text-slate-300 text-center">
                    {formatCurrency(item.totalExpense)}
                  </div>

                  {/* Single Stacked Expense Bar */}
                  <div className="w-full flex items-end justify-center px-1">
                    <div
                      style={{ height: `${totalExpenseHeight}px` }}
                      className="w-full max-w-[36px] flex flex-col-reverse rounded-t-lg overflow-hidden shadow-xs transition-all group-hover:brightness-110"
                      title={`Total Saídas de ${item.label}: ${formatCurrency(item.totalExpense)}`}
                    >
                      {/* Purple: Credit Card Installments */}
                      {cardHeight > 0 && (
                        <div
                          style={{ height: `${cardHeight}px` }}
                          className="w-full bg-purple-500"
                        />
                      )}
                      {/* Amber: Fixed Debts */}
                      {fixedHeight > 0 && (
                        <div
                          style={{ height: `${fixedHeight}px` }}
                          className="w-full bg-amber-500"
                        />
                      )}
                      {/* Slate/Red: General Expenses */}
                      {otherHeight > 0 && (
                        <div
                          style={{ height: `${otherHeight}px` }}
                          className="w-full bg-rose-400"
                        />
                      )}
                    </div>
                  </div>

                  {/* Month Label below */}
                  <div className="mt-2 text-center">
                    <span
                      className={`text-[11px] font-bold block ${
                        isSelected
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.isCurrent && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Month Details Callout */}
        {focusedMonth && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                {focusedMonth.label}
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Detalhamento de {focusedMonth.label}
                  {focusedMonth.isCurrent && ' (Mês Atual)'}
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Entradas: {formatCurrency(focusedMonth.totalIncome)} · Parcelas de Cartão:{' '}
                  {formatCurrency(focusedMonth.cardInstallmentExpense)} · Dívidas Fixas:{' '}
                  {formatCurrency(focusedMonth.fixedDebtExpense)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">Saldo Previsto</span>
                <span
                  className={`text-sm font-bold ${
                    focusedMonth.netBalance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(focusedMonth.netBalance)}
                </span>
              </div>

              <button
                onClick={() => onSelectMonthYear(focusedMonth.year, focusedMonth.month)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-xs transition-colors shadow-2xs"
              >
                <span>Ver no Extrato</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Two Column Layout: Detailed Months Timeline & Payoff Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Monthly Breakdown Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Cronograma Mensal de Compromissos</span>
            </h3>
            <span className="text-xs text-slate-400">
              {projectionList.length} meses até a quitação final
            </span>
          </div>

          <div className="space-y-3">
            {projectionList.map((item) => {
              const isSelected = item.monthKey === focusedMonth?.monthKey;

              return (
                <div
                  key={item.monthKey}
                  className={`p-4 bg-white dark:bg-[#121927] rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Card Header: Month, Badges & Numbers */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.label}
                      </span>
                      {item.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          Mês Atual
                        </span>
                      )}
                      {item.cardInstallmentExpense === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                          Zero Parcelas!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Saídas Previstas
                        </span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(item.totalExpense)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Saldo Previsto
                        </span>
                        <span
                          className={`font-bold ${
                            item.netBalance >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatCurrency(item.netBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Installments for this month */}
                  <div className="pt-3 space-y-2">
                    {item.activeInstallments.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Parcelas de Cartão neste mês ({item.activeInstallments.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.activeInstallments.map((inst, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                                inst.isFinalInstallment
                                  ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                                  {inst.description}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {inst.cardName && <span>{inst.cardName} ·</span>}
                                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                    Parcela {inst.currentInstallment}/{inst.totalInstallments}
                                  </span>
                                  {inst.isFinalInstallment && (
                                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                                      (Última!)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                                {formatCurrency(inst.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                        Nenhuma compra parcelada pendente para este mês.
                      </p>
                    )}

                    {/* Finished Purchases Celebratory Note with Sum Total */}
                    {item.finishedPurchasesThisMonth.length > 0 && (() => {
                      const totalLiberadoMes = item.finishedPurchasesThisMonth.reduce(
                        (acc, p) => acc + p.amount,
                        0
                      );
                      return (
                        <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-100 shadow-2xs">
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-emerald-800 dark:text-emerald-200 block">
                                Quitação concluída neste mês:
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                                {item.finishedPurchasesThisMonth.map((p, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-emerald-800/80 font-medium font-mono"
                                  >
                                    {p.description}: {formatCurrency(p.amount)}/mês
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-right sm:border-l sm:border-emerald-200/80 dark:sm:border-emerald-800/80 sm:pl-4 font-mono">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans font-semibold uppercase">
                              Total liberado no mês
                            </span>
                            <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                              +{formatCurrency(totalLiberadoMes)}/mês
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 col): Quitação / Roadmap de Término */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Radar de Quitação</span>
            </h3>
            <span className="text-xs text-slate-400">
              {purchasesPayoffList.length} compras ativas
            </span>
          </div>

          <div className="bg-white dark:bg-[#121927] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 space-y-3.5 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cronograma de término de cada compra parcelada e o impacto no seu orçamento:
            </p>

            {purchasesPayoffList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhuma compra parcelada em andamento no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {purchasesPayoffList.map((p) => (
                  <div
                    key={p.key}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {p.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {p.cardName ? `${p.cardName} · ` : ''}
                          {p.totalInstallments}x de {formatCurrency(p.amountPerMonth)}
                        </span>
                      </div>
                      <div className="text-right font-mono font-bold text-teal-600 dark:text-teal-400 text-xs">
                        {p.payoffLabel}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>
                        Restam <strong>{p.remainingInstallments} parcelas</strong>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{formatCurrency(p.amountPerMonth)}/mês liberados
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
