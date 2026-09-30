import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useAuth } from '../context/AuthContext';
import {
  db,
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finanplan_transactions_v2',
  LIMITS: 'finanplan_budget_limits_v2',
  CARDS: 'finanplan_credit_cards_v2',
  INVESTMENTS: 'finanplan_investments_v2',
  CONTRIBUTIONS: 'finanplan_contributions_v2',
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

export function useFinanceStore(onRequireAdmin?: () => void) {
  const { user, isAdmin } = useAuth();

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
    return [];
  });

  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIMITS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [investments, setInvestments] = useState<InvestmentGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [contributions, setContributions] = useState<InvestmentContribution[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTRIBUTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // Cloud status
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isCloudReady, setIsCloudReady] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudQuotaExceeded, setCloudQuotaExceeded] = useState<boolean>(false);
  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(null);

  // Sync to localStorage as offline fallback
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

  // Seed / Push local data to shared cloud database (only when manually triggered)
  const seedLocalToCloud = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setIsCloudSyncing(true);
      const batch = writeBatch(db);

      // 1. Transactions
      transactions.forEach((tx) => {
        const docRef = doc(db, 'transactions', tx.id);
        batch.set(docRef, tx, { merge: true });
      });

      // 2. Cards
      creditCards.forEach((card) => {
        const docRef = doc(db, 'cards', card.id);
        batch.set(docRef, card, { merge: true });
      });

      // 3. Limits
      budgetLimits.forEach((lim) => {
        const docRef = doc(db, 'limits', lim.id);
        batch.set(docRef, lim, { merge: true });
      });

      // 4. Investments
      investments.forEach((inv) => {
        const docRef = doc(db, 'investments', inv.id);
        batch.set(docRef, inv, { merge: true });
      });

      // 5. Contributions
      contributions.forEach((c) => {
        const docRef = doc(db, 'contributions', c.id);
        batch.set(docRef, c, { merge: true });
      });

      await batch.commit();
      setLastCloudSync(new Date());
    } catch (error) {
      console.error('Error syncing data to Firestore:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  }, [isAdmin, transactions, creditCards, budgetLimits, investments, contributions]);

  // SHARED REALTIME SYNC VIA FIRESTORE onSnapshot (FOR EVERYONE: VISITORS & ADMIN)
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // 1. Transactions Listener (Public Read)
    const unsubTx = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        setIsLiveConnected(true);
        setCloudQuotaExceeded(false);
        const cloudItems: Transaction[] = [];
        snapshot.forEach((d) => {
          cloudItems.push(d.data() as Transaction);
        });

        setTransactions((prev) => {
          const cloudMap = new Map(cloudItems.map((item) => [item.id, item]));
          const unsyncedLocal = prev.filter((p) => !cloudMap.has(p.id));

          // If there are unsynced local items saved while offline, push them to Firestore
          if (unsyncedLocal.length > 0 && isAdmin) {
            const batch = writeBatch(db);
            unsyncedLocal.forEach((tx) => {
              batch.set(doc(db, 'transactions', tx.id), tx);
            });
            batch.commit().catch((err) => console.warn('Sync pending transactions error:', err));
          }

          const merged = [...cloudItems, ...unsyncedLocal];
          merged.sort((a, b) => b.date.localeCompare(a.date));
          return merged;
        });

        setLastCloudSync(new Date());
        setIsCloudReady(true);
      },
      (error) => {
        console.warn('Firestore transactions error:', error);
        const errObj = error as { message?: string; code?: string };
        if (
          errObj.message?.includes('Quota exceeded') ||
          errObj.code === 'resource-exhausted'
        ) {
          setCloudQuotaExceeded(true);
        }
        setIsLiveConnected(false);
        setIsCloudReady(true);
      }
    );
    unsubscribes.push(unsubTx);

    // 2. Cards Listener (Public Read)
    const unsubCards = onSnapshot(
      collection(db, 'cards'),
      (snapshot) => {
        const items: CreditCard[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as CreditCard);
        });
        setCreditCards(items);
      },
      (error) => {
        console.warn('Firestore cards error:', error);
      }
    );
    unsubscribes.push(unsubCards);

    // 3. Limits Listener (Public Read)
    const unsubLimits = onSnapshot(
      collection(db, 'limits'),
      (snapshot) => {
        const items: BudgetLimit[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as BudgetLimit);
        });
        setBudgetLimits(items);
      },
      (error) => {
        console.warn('Firestore limits error:', error);
      }
    );
    unsubscribes.push(unsubLimits);

    // 4. Investments Listener (Public Read)
    const unsubInv = onSnapshot(
      collection(db, 'investments'),
      (snapshot) => {
        const items: InvestmentGoal[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as InvestmentGoal);
        });
        setInvestments(items);
      },
      (error) => {
        console.warn('Firestore investments error:', error);
      }
    );
    unsubscribes.push(unsubInv);

    // 5. Contributions Listener (Public Read)
    const unsubContrib = onSnapshot(
      collection(db, 'contributions'),
      (snapshot) => {
        const items: InvestmentContribution[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as InvestmentContribution);
        });
        items.sort((a, b) => b.date.localeCompare(a.date));
        setContributions(items);
      },
      (error) => {
        console.warn('Firestore contributions error:', error);
      }
    );
    unsubscribes.push(unsubContrib);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  // Check admin guard
  const checkAdminPermission = useCallback((): boolean => {
    if (!isAdmin) {
      if (onRequireAdmin) {
        onRequireAdmin();
      } else {
        alert(
          'Apenas o Administrador (aryelgomes59@gmail.com) pode alterar ou cadastrar informações.\n\nVocê está no modo de consulta para visualizar os dados atualizados.'
        );
      }
      return false;
    }
    return true;
  }, [isAdmin, onRequireAdmin]);

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

      let creditCardExpense = 0;
      let fixedDebtExpense = 0;
      let generalExpense = 0;
      let totalExpense = 0;

      let paidExpense = 0;
      let pendingExpense = 0;

      filtered.forEach((tx) => {
        if (tx.type === 'income') {
          if (tx.category === 'salary') salaryIncome += tx.amount;
          else if (tx.category === 'commission') commissionIncome += tx.amount;
          else otherIncome += tx.amount;
        } else {
          if (tx.category === 'credit_card') creditCardExpense += tx.amount;
          else if (tx.category === 'fixed_debt') fixedDebtExpense += tx.amount;
          else generalExpense += tx.amount;

          if (tx.isPaid) paidExpense += tx.amount;
          else pendingExpense += tx.amount;
        }
      });

      totalIncome = salaryIncome + commissionIncome + otherIncome;
      totalExpense = creditCardExpense + fixedDebtExpense + generalExpense;
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

  // Transaction mutations (Protected: Admin Only)
  const addTransaction = useCallback(
    async (
      newTx: Omit<Transaction, 'id' | 'createdAt'>,
      options?: { repeatMonthsCount?: number }
    ) => {
      if (!checkAdminPermission()) return;

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

      // Optimistic update
      setTransactions((prev) => [...createdList, ...prev]);

      // Write to shared Firestore database
      try {
        const batch = writeBatch(db);
        createdList.forEach((tx) => {
          const docRef = doc(db, 'transactions', tx.id);
          batch.set(docRef, tx);
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'transactions');
      }

      return createdList[0]?.id;
    },
    [checkAdminPermission]
  );

  const updateTransaction = useCallback(
    async (id: string, updatedFields: Partial<Transaction>) => {
      if (!checkAdminPermission()) return;

      setTransactions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
      );

      try {
        const docRef = doc(db, 'transactions', id);
        await setDoc(docRef, { ...updatedFields, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
      }
    },
    [checkAdminPermission]
  );

  const deleteTransaction = useCallback(
    async (id: string, deleteAllInGroup: boolean = false) => {
      if (!checkAdminPermission()) return;

      let idsToDelete: string[] = [id];

      if (deleteAllInGroup) {
        const target = transactions.find((item) => item.id === id);
        if (target) {
          if (target.installmentGroupId) {
            idsToDelete = transactions
              .filter((item) => item.installmentGroupId === target.installmentGroupId)
              .map((item) => item.id);
          } else if (target.recurrenceGroupId) {
            idsToDelete = transactions
              .filter((item) => item.recurrenceGroupId === target.recurrenceGroupId)
              .map((item) => item.id);
          }
        }
      }

      setTransactions((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));

      try {
        const batch = writeBatch(db);
        idsToDelete.forEach((delId) => {
          batch.delete(doc(db, 'transactions', delId));
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'transactions');
      }
    },
    [checkAdminPermission, transactions]
  );

  const toggleTransactionPaid = useCallback(
    async (id: string) => {
      if (!checkAdminPermission()) return;

      const target = transactions.find((item) => item.id === id);
      if (!target) return;
      const nextPaid = !target.isPaid;

      setTransactions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isPaid: nextPaid } : item))
      );

      try {
        const docRef = doc(db, 'transactions', id);
        await setDoc(docRef, { isPaid: nextPaid }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
      }
    },
    [checkAdminPermission, transactions]
  );

  // Budget limits mutation (Admin Only)
  const updateBudgetLimit = useCallback(
    async (id: string, newLimit: number, threshold?: number) => {
      if (!checkAdminPermission()) return;

      const updatedFields = {
        monthlyLimit: newLimit,
        ...(threshold !== undefined ? { alertThresholdPercent: threshold } : {}),
      };

      setBudgetLimits((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
      );

      try {
        const docRef = doc(db, 'limits', id);
        await setDoc(docRef, updatedFields, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `limits/${id}`);
      }
    },
    [checkAdminPermission]
  );

  // Update incomes (Salário, Comissão, Extra)
  const updateMonthlyIncomes = useCallback(
    async ({
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
      if (!checkAdminPermission()) return;

      const targetMonths: string[] = [];
      if (applyToAllMonths) {
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

      let updatedList = [...transactions];
      const newlyAddedOrUpdated: Transaction[] = [];

      targetMonths.forEach((mKey) => {
        // 1. Salário
        if (salary > 0) {
          const existingSalary = updatedList.find(
            (t) => t.date.startsWith(mKey) && t.category === 'salary'
          );
          if (existingSalary) {
            const mod = { ...existingSalary, amount: salary };
            updatedList = updatedList.map((t) => (t.id === existingSalary.id ? mod : t));
            newlyAddedOrUpdated.push(mod);
          } else {
            const newTx: Transaction = {
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
            };
            updatedList.push(newTx);
            newlyAddedOrUpdated.push(newTx);
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
              const mod = { ...existingCommission, amount: commission };
              updatedList = updatedList.map((t) => (t.id === existingCommission.id ? mod : t));
              newlyAddedOrUpdated.push(mod);
            }
          } else if (commission > 0) {
            const newTx: Transaction = {
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
            };
            updatedList.push(newTx);
            newlyAddedOrUpdated.push(newTx);
          }
        }

        // 3. Extra
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
              const mod = { ...existingExtra, amount: extra };
              updatedList = updatedList.map((t) => (t.id === existingExtra.id ? mod : t));
              newlyAddedOrUpdated.push(mod);
            }
          } else if (extra > 0) {
            const newTx: Transaction = {
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
            };
            updatedList.push(newTx);
            newlyAddedOrUpdated.push(newTx);
          }
        }
      });

      setTransactions(updatedList);

      if (newlyAddedOrUpdated.length > 0) {
        try {
          const batch = writeBatch(db);
          newlyAddedOrUpdated.forEach((tx) => {
            const docRef = doc(db, 'transactions', tx.id);
            batch.set(docRef, tx, { merge: true });
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'transactions');
        }
      }
    },
    [checkAdminPermission, transactions, selectedMonth, selectedYear, selectedMonthKey]
  );

  // Credit cards mutations (Admin Only)
  const addCreditCard = useCallback(
    async (newCard: Omit<CreditCard, 'id'>) => {
      if (!checkAdminPermission()) return {} as CreditCard;

      const id = `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const created: CreditCard = { ...newCard, id };
      setCreditCards((prev) => [...prev, created]);

      try {
        const docRef = doc(db, 'cards', id);
        await setDoc(docRef, created);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `cards/${id}`);
      }

      return created;
    },
    [checkAdminPermission]
  );

  const updateCreditCard = useCallback(
    async (id: string, updatedFields: Partial<CreditCard>) => {
      if (!checkAdminPermission()) return;

      setCreditCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
      );

      try {
        const docRef = doc(db, 'cards', id);
        await setDoc(docRef, updatedFields, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `cards/${id}`);
      }
    },
    [checkAdminPermission]
  );

  const deleteCreditCard = useCallback(
    async (id: string) => {
      if (!checkAdminPermission()) return;

      setCreditCards((prev) => prev.filter((c) => c.id !== id));

      try {
        const docRef = doc(db, 'cards', id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `cards/${id}`);
      }
    },
    [checkAdminPermission]
  );

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

  const addInvestmentGoal = useCallback(
    async (newGoal: Omit<InvestmentGoal, 'id' | 'createdAt'>) => {
      if (!checkAdminPermission()) return {} as InvestmentGoal;

      const id = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const created: InvestmentGoal = {
        ...newGoal,
        id,
        createdAt: new Date().toISOString(),
      };
      setInvestments((prev) => [...prev, created]);

      try {
        const docRef = doc(db, 'investments', id);
        await setDoc(docRef, created);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `investments/${id}`);
      }

      return created;
    },
    [checkAdminPermission]
  );

  const updateInvestmentGoal = useCallback(
    async (id: string, updatedFields: Partial<InvestmentGoal>) => {
      if (!checkAdminPermission()) return;

      setInvestments((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updatedFields } : g))
      );

      try {
        const docRef = doc(db, 'investments', id);
        await setDoc(docRef, updatedFields, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `investments/${id}`);
      }
    },
    [checkAdminPermission]
  );

  const deleteInvestmentGoal = useCallback(
    async (id: string) => {
      if (!checkAdminPermission()) return;

      setInvestments((prev) => prev.filter((g) => g.id !== id));
      setContributions((prev) => prev.filter((c) => c.goalId !== id));

      try {
        const docRef = doc(db, 'investments', id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `investments/${id}`);
      }
    },
    [checkAdminPermission]
  );

  const addInvestmentContribution = useCallback(
    async ({
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
      if (!checkAdminPermission()) return {} as InvestmentContribution;

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

      try {
        const docRef = doc(db, 'contributions', contribId);
        await setDoc(docRef, newContrib);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `contributions/${contribId}`);
      }

      // Optional: Add to ledger
      if (createTransactionRecord) {
        const targetGoal = investments.find((g) => g.id === goalId);
        const goalName = targetGoal ? targetGoal.name : 'Investimento';
        const txId = `tx-inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const txObj: Transaction =
          type === 'deposit'
            ? {
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
              }
            : {
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
              };

        setTransactions((prev) => [txObj, ...prev]);

        try {
          await setDoc(doc(db, 'transactions', txId), txObj);
        } catch (e) {
          console.error('Error saving contribution transaction', e);
        }
      }

      return newContrib;
    },
    [checkAdminPermission, investments, selectedMonth, selectedYear]
  );

  const deleteInvestmentContribution = useCallback(
    async (id: string) => {
      if (!checkAdminPermission()) return;

      setContributions((prev) => {
        const target = prev.find((c) => c.id === id);
        if (target) {
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

      try {
        await deleteDoc(doc(db, 'contributions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `contributions/${id}`);
      }
    },
    [checkAdminPermission]
  );

  // Reset to zero (Admin Only)
  const resetToZero = useCallback(async () => {
    if (!checkAdminPermission()) return;

    setTransactions([]);
    setCreditCards([]);
    setInvestments([]);
    setContributions([]);
    setBudgetLimits([]);
    setSelectedYear(2026);
    setSelectedMonth(8);

    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify([]));
    } catch (e) {
      console.error('Error clearing data in localStorage', e);
    }

    try {
      setIsCloudSyncing(true);

      const wipeColl = async (collName: string) => {
        try {
          const snap = await getDocs(collection(db, collName));
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (e) {
          console.warn(`Error wiping ${collName}:`, e);
        }
      };

      await Promise.all([
        wipeColl('transactions'),
        wipeColl('cards'),
        wipeColl('limits'),
        wipeColl('investments'),
        wipeColl('contributions'),
      ]);

      setLastCloudSync(new Date());
    } catch (e) {
      console.error('Error deleting documents from cloud', e);
    } finally {
      setIsCloudSyncing(false);
    }
  }, [checkAdminPermission]);

  const resetToSampleData = useCallback(() => {
    resetToZero();
  }, [resetToZero]);

  const loadSampleData = useCallback(() => {
    if (!checkAdminPermission()) return;
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgetLimits(INITIAL_BUDGET_LIMITS);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setInvestments(INITIAL_INVESTMENTS);
    setContributions(INITIAL_CONTRIBUTIONS);
    setSelectedYear(2026);
    setSelectedMonth(8);

    try {
      const batch = writeBatch(db);
      INITIAL_TRANSACTIONS.forEach((tx) => batch.set(doc(db, 'transactions', tx.id), tx));
      INITIAL_CREDIT_CARDS.forEach((c) => batch.set(doc(db, 'cards', c.id), c));
      INITIAL_BUDGET_LIMITS.forEach((l) => batch.set(doc(db, 'limits', l.id), l));
      INITIAL_INVESTMENTS.forEach((inv) => batch.set(doc(db, 'investments', inv.id), inv));
      INITIAL_CONTRIBUTIONS.forEach((c) => batch.set(doc(db, 'contributions', c.id), c));
      batch.commit().catch(console.error);
    } catch (e) {
      console.error(e);
    }
  }, [checkAdminPermission]);

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
    // Realtime & Cloud status props
    isLiveConnected,
    isCloudReady,
    cloudQuotaExceeded,
    isCloudActive: isAdmin,
    isCloudSyncing,
    lastCloudSync,
    forceSyncToCloud: seedLocalToCloud,
    checkAdminPermission,
  };
}
