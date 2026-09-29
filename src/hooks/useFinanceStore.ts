import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BudgetLimit,
  CreditCard,
  InvestmentGoal,
  InvestmentContribution,
  MonthSummary,
  Transaction,
} from '../types/finance';
import {
  INITIAL_BUDGET_LIMITS,
  INITIAL_CREDIT_CARDS,
  INITIAL_INVESTMENTS,
  INITIAL_CONTRIBUTIONS,
  INITIAL_TRANSACTIONS,
} from '../utils/sampleData';
import { getMonthName, getMonthShortName, addMonthsToDateString } from '../utils/formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finanplan_transactions_v1',
  LIMITS: 'finanplan_budget_limits_v1',
  CARDS: 'finanplan_credit_cards_v1',
  INVESTMENTS: 'finanplan_investments_v1',
  CONTRIBUTIONS: 'finanplan_contributions_v1',
};

export interface LimitAlert {
  id: string;
  category: string;
  title: string;
  limitAmount: number;
  spentAmount: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  remaining: number;
  overspent: number;
}

export function useFinanceStore() {
  // Initial date: 2026-09 (current local year & month)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 8 is September (0-indexed)

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_TRANSACTIONS;
  });

  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIMITS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_BUDGET_LIMITS;
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_CREDIT_CARDS;
  });

  const [investments, setInvestments] = useState<InvestmentGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_INVESTMENTS;
  });

  const [contributions, setContributions] = useState<InvestmentContribution[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTRIBUTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_CONTRIBUTIONS;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(budgetLimits));
    } catch (e) {
      console.error('Error saving limits', e);
    }
  }, [budgetLimits]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(creditCards));
    } catch (e) {
      console.error('Error saving cards', e);
    }
  }, [creditCards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
    } catch (e) {
      console.error('Error saving investments', e);
    }
  }, [investments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(contributions));
    } catch (e) {
      console.error('Error saving contributions', e);
    }
  }, [contributions]);

  // Month navigation
  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((prevMonth) => {
      if (prevMonth === 0) {
        setSelectedYear((prevYear) => prevYear - 1);
        return 11;
      }
      return prevMonth - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prevMonth) => {
      if (prevMonth === 11) {
        setSelectedYear((prevYear) => prevYear + 1);
        return 0;
      }
      return prevMonth + 1;
    });
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedYear(2026);
    setSelectedMonth(8); // September 2026
  }, []);

  const selectedMonthKey = useMemo(() => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${mm}`;
  }, [selectedYear, selectedMonth]);

  // Filter transactions for the selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedMonthKey));
  }, [transactions, selectedMonthKey]);

  // Calculate detailed month summary
  const currentMonthSummary: MonthSummary = useMemo(() => {
    let salaryIncome = 0;
    let commissionIncome = 0;
    let otherIncome = 0;

    let creditCardExpense = 0;
    let fixedDebtExpense = 0;
    let generalExpense = 0;

    let paidExpense = 0;
    let pendingExpense = 0;

    monthTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (tx.category === 'salary') {
          salaryIncome += tx.amount;
        } else if (tx.category === 'commission') {
          commissionIncome += tx.amount;
        } else {
          otherIncome += tx.amount;
        }
      } else {
        if (tx.category === 'credit_card') {
          creditCardExpense += tx.amount;
        } else if (tx.category === 'fixed_debt') {
          fixedDebtExpense += tx.amount;
        } else {
          generalExpense += tx.amount;
        }

        if (tx.isPaid) {
          paidExpense += tx.amount;
        } else {
          pendingExpense += tx.amount;
        }
      }
    });

    const totalIncome = salaryIncome + commissionIncome + otherIncome;
    const totalExpense = creditCardExpense + fixedDebtExpense + generalExpense;
    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100) : 0;

    return {
      monthKey: selectedMonthKey,
      label: `${getMonthName(selectedMonth)} de ${selectedYear}`,
      totalIncome,
      salaryIncome,
      commissionIncome,
      otherIncome,
      totalExpense,
      creditCardExpense,
      fixedDebtExpense,
      generalExpense,
      netBalance,
      savingsRate,
      paidExpense,
      pendingExpense,
    };
  }, [monthTransactions, selectedMonthKey, selectedMonth, selectedYear]);

  // Compute Alerts based on active BudgetLimits
  const limitAlerts: LimitAlert[] = useMemo(() => {
    const alerts: LimitAlert[] = [];

    budgetLimits.forEach((limit) => {
      if (!limit.enabled) return;

      let spent = 0;
      if (limit.category === 'overall') {
        spent = currentMonthSummary.totalExpense;
      } else if (limit.category === 'credit_card') {
        spent = currentMonthSummary.creditCardExpense;
      } else if (limit.category === 'fixed_debt') {
        spent = currentMonthSummary.fixedDebtExpense;
      } else if (limit.category === 'general_expenses') {
        spent = currentMonthSummary.generalExpense;
      }

      const percentage = limit.monthlyLimit > 0 ? (spent / limit.monthlyLimit) * 100 : 0;
      let status: 'safe' | 'warning' | 'danger' = 'safe';

      if (percentage >= 100) {
        status = 'danger';
      } else if (percentage >= limit.alertThresholdPercent) {
        status = 'warning';
      }

      const remaining = Math.max(0, limit.monthlyLimit - spent);
      const overspent = Math.max(0, spent - limit.monthlyLimit);

      alerts.push({
        id: limit.id,
        category: limit.category,
        title: limit.title,
        limitAmount: limit.monthlyLimit,
        spentAmount: spent,
        percentage,
        status,
        remaining,
        overspent,
      });
    });

    return alerts;
  }, [budgetLimits, currentMonthSummary]);

  // Has critical or warning alerts
  const activeAlerts = useMemo(() => {
    return limitAlerts.filter((a) => a.status === 'danger' || a.status === 'warning');
  }, [limitAlerts]);

  // Multi-month history (past 6 months) for comparative charts
  const historyData = useMemo(() => {
    const result: MonthSummary[] = [];

    for (let i = 5; i >= 0; i--) {
      let targetM = selectedMonth - i;
      let targetY = selectedYear;
      while (targetM < 0) {
        targetM += 12;
        targetY -= 1;
      }

      const mKey = `${targetY}-${String(targetM + 1).padStart(2, '0')}`;
      const filtered = transactions.filter((t) => t.date.startsWith(mKey));

      let totalIncome = 0;
      let salaryIncome = 0;
      let commissionIncome = 0;
      let otherIncome = 0;
      let totalExpense = 0;
      let creditCardExpense = 0;
      let fixedDebtExpense = 0;
      let generalExpense = 0;
      let paidExpense = 0;
      let pendingExpense = 0;

      filtered.forEach((tx) => {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
          if (tx.category === 'salary') salaryIncome += tx.amount;
          else if (tx.category === 'commission') commissionIncome += tx.amount;
          else otherIncome += tx.amount;
        } else {
          totalExpense += tx.amount;
          if (tx.category === 'credit_card') creditCardExpense += tx.amount;
          else if (tx.category === 'fixed_debt') fixedDebtExpense += tx.amount;
          else generalExpense += tx.amount;

          if (tx.isPaid) paidExpense += tx.amount;
          else pendingExpense += tx.amount;
        }
      });

      const netBalance = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100) : 0;

      result.push({
        monthKey: mKey,
        label: `${getMonthShortName(targetM)}/${String(targetY).slice(2)}`,
        totalIncome,
        salaryIncome,
        commissionIncome,
        otherIncome,
        totalExpense,
        creditCardExpense,
        fixedDebtExpense,
        generalExpense,
        netBalance,
        savingsRate,
        paidExpense,
        pendingExpense,
      });
    }

    return result;
  }, [selectedMonth, selectedYear, transactions]);

  // Transaction mutations
  const addTransaction = useCallback(
    (
      newTx: Omit<Transaction, 'id' | 'createdAt'>,
      options?: { repeatMonthsCount?: number }
    ) => {
      const createdAt = new Date().toISOString();
      const createdList: Transaction[] = [];

      // 1. Multiple Installments (e.g. 10x)
      if (newTx.totalInstallments && newTx.totalInstallments > 1) {
        const installmentGroupId =
          newTx.installmentGroupId ||
          `group-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const startInstallment = newTx.currentInstallment || 1;
        const total = newTx.totalInstallments;

        for (let i = startInstallment; i <= total; i++) {
          const monthsOffset = i - startInstallment;
          const targetDate = addMonthsToDateString(newTx.date, monthsOffset);
          const id = `tx-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

          createdList.push({
            ...newTx,
            id,
            date: targetDate,
            currentInstallment: i,
            totalInstallments: total,
            installmentGroupId,
            // Only the initial installment keeps user's isPaid flag; subsequent future installments are pending
            isPaid: i === startInstallment ? newTx.isPaid : false,
            createdAt,
          });
        }
      }
      // 2. Recurring Monthly Expense / Income (e.g. fixed debt for 6 or 12 months)
      else if (options?.repeatMonthsCount && options.repeatMonthsCount > 1) {
        const recurrenceGroupId =
          newTx.recurrenceGroupId ||
          `group-rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        for (let i = 0; i < options.repeatMonthsCount; i++) {
          const targetDate = addMonthsToDateString(newTx.date, i);
          const id = `tx-${Date.now()}-rec${i}-${Math.random().toString(36).substring(2, 6)}`;

          createdList.push({
            ...newTx,
            id,
            date: targetDate,
            recurrenceGroupId,
            isRecurring: true,
            isPaid: i === 0 ? newTx.isPaid : false,
            createdAt,
          });
        }
      }
      // 3. Single standard transaction
      else {
        const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        createdList.push({
          ...newTx,
          id,
          createdAt,
        });
      }

      setTransactions((prev) => [...createdList, ...prev]);
      return createdList[0]?.id;
    },
    []
  );

  const updateTransaction = useCallback((id: string, updatedFields: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  }, []);

  const deleteTransaction = useCallback((id: string, deleteAllInGroup: boolean = false) => {
    setTransactions((prev) => {
      if (!deleteAllInGroup) {
        return prev.filter((item) => item.id !== id);
      }

      const target = prev.find((item) => item.id === id);
      if (!target) return prev.filter((item) => item.id !== id);

      if (target.installmentGroupId) {
        return prev.filter(
          (item) => item.installmentGroupId !== target.installmentGroupId
        );
      }

      if (target.recurrenceGroupId) {
        return prev.filter(
          (item) => item.recurrenceGroupId !== target.recurrenceGroupId
        );
      }

      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const toggleTransactionPaid = useCallback((id: string) => {
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPaid: !item.isPaid } : item))
    );
  }, []);

  // Budget limits mutation
  const updateBudgetLimit = useCallback((id: string, newLimit: number, threshold?: number) => {
    setBudgetLimits((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              monthlyLimit: newLimit,
              ...(threshold !== undefined ? { alertThresholdPercent: threshold } : {}),
            }
          : item
      )
    );
  }, []);

  // Update incomes (Salário, Comissão, Extra) for current month or propagate to all months
  const updateMonthlyIncomes = useCallback(
    ({
      salary,
      commission,
      extra,
      applyToAllMonths = false,
    }: {
      salary: number;
      commission: number;
      extra: number;
      applyToAllMonths?: boolean;
    }) => {
      setTransactions((prev) => {
        const targetMonths: string[] = [];
        if (applyToAllMonths) {
          // Current month and next 12 months (plus previous 2 months)
          for (let offset = -2; offset <= 12; offset++) {
            let m = selectedMonth + offset;
            let y = selectedYear;
            while (m < 0) {
              m += 12;
              y -= 1;
            }
            while (m >= 12) {
              m -= 12;
              y += 1;
            }
            targetMonths.push(`${y}-${String(m + 1).padStart(2, '0')}`);
          }
        } else {
          targetMonths.push(selectedMonthKey);
        }

        let updatedList = [...prev];

        targetMonths.forEach((mKey) => {
          // 1. Salário
          if (salary > 0) {
            const existingSalary = updatedList.find(
              (t) => t.date.startsWith(mKey) && t.category === 'salary'
            );
            if (existingSalary) {
              updatedList = updatedList.map((t) =>
                t.id === existingSalary.id ? { ...t, amount: salary } : t
              );
            } else {
              updatedList.push({
                id: `tx-salary-${mKey}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                type: 'income',
                category: 'salary',
                subCategory: 'Salário Fixo',
                description: 'Salário Mensal',
                amount: salary,
                date: `${mKey}-05`,
                paymentMethod: 'bank_transfer',
                isPaid: mKey <= selectedMonthKey,
                createdAt: new Date().toISOString(),
              });
            }
          }

          // 2. Comissão
          if (commission >= 0) {
            const existingCommission = updatedList.find(
              (t) => t.date.startsWith(mKey) && t.category === 'commission'
            );
            if (existingCommission) {
              if (commission === 0) {
                updatedList = updatedList.filter((t) => t.id !== existingCommission.id);
              } else {
                updatedList = updatedList.map((t) =>
                  t.id === existingCommission.id ? { ...t, amount: commission } : t
                );
              }
            } else if (commission > 0) {
              updatedList.push({
                id: `tx-comm-${mKey}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                type: 'income',
                category: 'commission',
                subCategory: 'Comissões',
                description: 'Comissões de Vendas',
                amount: commission,
                date: `${mKey}-15`,
                paymentMethod: 'pix',
                isPaid: mKey <= selectedMonthKey,
                createdAt: new Date().toISOString(),
              });
            }
          }

          // 3. Extra / Freelance
          if (extra >= 0) {
            const existingExtra = updatedList.find(
              (t) =>
                t.date.startsWith(mKey) &&
                (t.category === 'freelance' || t.category === 'other_income')
            );
            if (existingExtra) {
              if (extra === 0) {
                updatedList = updatedList.filter((t) => t.id !== existingExtra.id);
              } else {
                updatedList = updatedList.map((t) =>
                  t.id === existingExtra.id ? { ...t, amount: extra } : t
                );
              }
            } else if (extra > 0) {
              updatedList.push({
                id: `tx-extra-${mKey}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                type: 'income',
                category: 'freelance',
                subCategory: 'Renda Extra',
                description: 'Renda Extra / Serviços',
                amount: extra,
                date: `${mKey}-20`,
                paymentMethod: 'pix',
                isPaid: mKey <= selectedMonthKey,
                createdAt: new Date().toISOString(),
              });
            }
          }
        });

        return updatedList;
      });
    },
    [selectedMonth, selectedYear, selectedMonthKey]
  );

  // Credit cards mutations
  const addCreditCard = useCallback((newCard: Omit<CreditCard, 'id'>) => {
    const id = `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const created: CreditCard = { ...newCard, id };
    setCreditCards((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCreditCard = useCallback((id: string, updatedFields: Partial<CreditCard>) => {
    setCreditCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
  }, []);

  const deleteCreditCard = useCallback((id: string) => {
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Investment mutations & calculations
  const totalInvested = useMemo(() => {
    return investments.reduce((acc, curr) => acc + (curr.currentAmount || 0), 0);
  }, [investments]);

  const totalTargetInvested = useMemo(() => {
    return investments.reduce((acc, curr) => acc + (curr.targetAmount || 0), 0);
  }, [investments]);

  const monthContributions = useMemo(() => {
    return contributions.filter((c) => c.date.startsWith(selectedMonthKey));
  }, [contributions, selectedMonthKey]);

  const monthInvestedNet = useMemo(() => {
    return monthContributions.reduce((acc, curr) => {
      return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
    }, 0);
  }, [monthContributions]);

  const addInvestmentGoal = useCallback((newGoal: Omit<InvestmentGoal, 'id' | 'createdAt'>) => {
    const id = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const created: InvestmentGoal = {
      ...newGoal,
      id,
      createdAt: new Date().toISOString(),
    };
    setInvestments((prev) => [...prev, created]);
    return created;
  }, []);

  const updateInvestmentGoal = useCallback((id: string, updatedFields: Partial<InvestmentGoal>) => {
    setInvestments((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updatedFields } : g))
    );
  }, []);

  const deleteInvestmentGoal = useCallback((id: string) => {
    setInvestments((prev) => prev.filter((g) => g.id !== id));
    setContributions((prev) => prev.filter((c) => c.goalId !== id));
  }, []);

  const addInvestmentContribution = useCallback(
    ({
      goalId,
      type,
      amount,
      date,
      notes,
      createTransactionRecord = false,
    }: {
      goalId: string;
      type: 'deposit' | 'withdraw';
      amount: number;
      date?: string;
      notes?: string;
      createTransactionRecord?: boolean;
    }) => {
      const contribDate = date || `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-15`;
      const contribId = `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newContrib: InvestmentContribution = {
        id: contribId,
        goalId,
        type,
        amount,
        date: contribDate,
        notes,
        createdAt: new Date().toISOString(),
      };

      setContributions((prev) => [newContrib, ...prev]);

      // Update goal accumulated balance
      setInvestments((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g;
          const updatedAmount =
            type === 'deposit'
              ? (g.currentAmount || 0) + amount
              : Math.max(0, (g.currentAmount || 0) - amount);
          return { ...g, currentAmount: updatedAmount };
        })
      );

      // Optional: Add to ledger
      if (createTransactionRecord) {
        const targetGoal = investments.find((g) => g.id === goalId);
        const goalName = targetGoal ? targetGoal.name : 'Investimento';
        const txId = `tx-inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        if (type === 'deposit') {
          setTransactions((prev) => [
            {
              id: txId,
              type: 'expense',
              category: 'general_expenses',
              subCategory: 'Investimentos & Poupança',
              description: `Aporte: ${goalName}`,
              amount,
              date: contribDate,
              paymentMethod: 'pix',
              isPaid: true,
              notes: notes || `Valor guardado na meta ${goalName}`,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        } else {
          // Withdraw is registered as other income if selected
          setTransactions((prev) => [
            {
              id: txId,
              type: 'income',
              category: 'investments',
              subCategory: 'Resgate de Investimento',
              description: `Resgate: ${goalName}`,
              amount,
              date: contribDate,
              paymentMethod: 'pix',
              isPaid: true,
              notes: notes || `Resgate da meta ${goalName}`,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }

      return newContrib;
    },
    [investments, selectedMonth, selectedYear]
  );

  const deleteInvestmentContribution = useCallback((id: string) => {
    setContributions((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target) {
        // Revert goal amount
        setInvestments((invs) =>
          invs.map((g) => {
            if (g.id !== target.goalId) return g;
            const reverted =
              target.type === 'deposit'
                ? Math.max(0, (g.currentAmount || 0) - target.amount)
                : (g.currentAmount || 0) + target.amount;
            return { ...g, currentAmount: reverted };
          })
        );
      }
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  // Reset / Zero out all data to start completely from scratch
  const resetToZero = useCallback(() => {
    setTransactions([]);
    setCreditCards([]);
    setInvestments([]);
    setContributions([]);
    setBudgetLimits((prev) =>
      prev.map((lim) => ({
        ...lim,
        monthlyLimit: 0,
      }))
    );
    setSelectedYear(2026);
    setSelectedMonth(8);

    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify([]));
      localStorage.setItem(
        STORAGE_KEYS.LIMITS,
        JSON.stringify(
          INITIAL_BUDGET_LIMITS.map((lim) => ({ ...lim, monthlyLimit: 0 }))
        )
      );
    } catch (e) {
      console.error('Error clearing data', e);
    }
  }, []);

  // For compatibility with the requested "restaurar demonstração zere todos os valores"
  const resetToSampleData = useCallback(() => {
    resetToZero();
  }, [resetToZero]);

  // Option to reload demo items if desired
  const loadSampleData = useCallback(() => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgetLimits(INITIAL_BUDGET_LIMITS);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setInvestments(INITIAL_INVESTMENTS);
    setContributions(INITIAL_CONTRIBUTIONS);
    setSelectedYear(2026);
    setSelectedMonth(8);
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(INITIAL_BUDGET_LIMITS));
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(INITIAL_CREDIT_CARDS));
      localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(INITIAL_INVESTMENTS));
      localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(INITIAL_CONTRIBUTIONS));
    } catch (e) {
      console.error('Error saving sample data', e);
    }
  }, []);

  return {
    selectedYear,
    selectedMonth,
    selectedMonthKey,
    setSelectedYear,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    transactions,
    monthTransactions,
    currentMonthSummary,
    budgetLimits,
    creditCards,
    investments,
    contributions,
    monthContributions,
    totalInvested,
    totalTargetInvested,
    monthInvestedNet,
    limitAlerts,
    activeAlerts,
    historyData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    toggleTransactionPaid,
    updateBudgetLimit,
    updateMonthlyIncomes,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addInvestmentGoal,
    updateInvestmentGoal,
    deleteInvestmentGoal,
    addInvestmentContribution,
    deleteInvestmentContribution,
    resetToZero,
    resetToSampleData,
    loadSampleData,
    setTransactions,
    setBudgetLimits,
    setCreditCards,
    setInvestments,
    setContributions,
  };
}
