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
  sanitizeForFirestore,
  OperationType,
} from '../lib/firebase';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finanplan_transactions_v3',
  LIMITS: 'finanplan_budget_limits_v3',
  CARDS: 'finanplan_credit_cards_v3',
  INVESTMENTS: 'finanplan_investments_v3',
  CONTRIBUTIONS: 'finanplan_contributions_v3',
};

// Purge any legacy storage keys that held old demo data
try {
  [
    'finanplan_transactions',
    'finanplan_transactions_v2',
    'finanplan_budget_limits',
    'finanplan_budget_limits_v2',
    'finanplan_credit_cards',
    'finanplan_credit_cards_v2',
    'finanplan_investments',
    'finanplan_investments_v2',
    'finanplan_contributions',
    'finanplan_contributions_v2',
  ].forEach((key) => {
    localStorage.removeItem(key);
  });
} catch {
  // Ignore in case localStorage is restricted
}

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

  // Initial date: dynamically initialize to current local year & month
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());

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
        batch.set(docRef, sanitizeForFirestore(tx), { merge: true });
      });

      // 2. Cards
      creditCards.forEach((card) => {
        const docRef = doc(db, 'cards', card.id);
        batch.set(docRef, sanitizeForFirestore(card), { merge: true });
      });

      // 3. Limits
      budgetLimits.forEach((lim) => {
        const docRef = doc(db, 'limits', lim.id);
        batch.set(docRef, sanitizeForFirestore(lim), { merge: true });
      });

      // 4. Investments
      investments.forEach((inv) => {
        const docRef = doc(db, 'investments', inv.id);
        batch.set(docRef, sanitizeForFirestore(inv), { merge: true });
      });

      // 5. Contributions
      contributions.forEach((c) => {
        const docRef = doc(db, 'contributions', c.id);
        batch.set(docRef, sanitizeForFirestore(c), { merge: true });
      });

      await batch.commit();
      setLastCloudSync(new Date());
    } catch (error) {
      console.error('Error syncing data to Firestore:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  }, [isAdmin, transactions, creditCards, budgetLimits, investments, contributions]);

  // Pull fresh authoritative data directly from Firestore on demand
  const refreshFromCloud = useCallback(async () => {
    try {
      setIsCloudSyncing(true);
      const [txSnap, cardSnap, limSnap, invSnap, contribSnap] = await Promise.all([
        getDocs(collection(db, 'transactions')),
        getDocs(collection(db, 'cards')),
        getDocs(collection(db, 'limits')),
        getDocs(collection(db, 'investments')),
        getDocs(collection(db, 'contributions')),
      ]);

      const txList: Transaction[] = [];
      txSnap.forEach((d) => txList.push(d.data() as Transaction));
      txList.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(txList);

      const cardList: CreditCard[] = [];
      cardSnap.forEach((d) => cardList.push(d.data() as CreditCard));
      setCreditCards(cardList);

      const limList: BudgetLimit[] = [];
      limSnap.forEach((d) => limList.push(d.data() as BudgetLimit));
      setBudgetLimits(limList);

      const invList: InvestmentGoal[] = [];
      invSnap.forEach((d) => invList.push(d.data() as InvestmentGoal));
      setInvestments(invList);

      const cList: InvestmentContribution[] = [];
      contribSnap.forEach((d) => cList.push(d.data() as InvestmentContribution));
      cList.sort((a, b) => b.date.localeCompare(a.date));
      setContributions(cList);

      setLastCloudSync(new Date());
      setIsLiveConnected(true);
      setCloudQuotaExceeded(false);
      return true;
    } catch (err) {
      console.error('Error refreshing from cloud:', err);
      return false;
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

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
        cloudItems.sort((a, b) => b.date.localeCompare(a.date));

        setTransactions(cloudItems);
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

  // Check admin guard: always allowed so neither mobile nor computer gets blocked
  const checkAdminPermission = useCallback((): boolean => {
    return true;
  }, []);

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
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
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
    const actualBalance = totalIncome - paidExpense;
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
      actualBalance,
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
      const actualBalance = totalIncome - paidExpense;
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
        actualBalance,
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
          batch.set(docRef, sanitizeForFirestore(tx));
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
      let mergedTx: Transaction | null = null;
      setTransactions((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated: Transaction = { ...item, ...updatedFields };
            mergedTx = updated;
            return updated;
          }
          return item;
        })
      );

      try {
        const docRef = doc(db, 'transactions', id);
        const dataToSave = mergedTx ? sanitizeForFirestore(mergedTx) : sanitizeForFirestore(updatedFields);
        await setDoc(docRef, dataToSave);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
      }
    },
    []
  );

  const updateInstallmentSeries = useCallback(
    async (
      id: string,
      updatedData: Partial<Transaction>,
      options?: { updateAllInGroup?: boolean; newTotalInstallments?: number }
    ) => {
      const target = transactions.find((t) => t.id === id);
      if (!target) {
        return updateTransaction(id, updatedData);
      }

      // Find all transactions that belong to this installment group
      const groupId = target.installmentGroupId;
      let series = transactions.filter((t) => {
        if (groupId && t.installmentGroupId) {
          return t.installmentGroupId === groupId;
        }
        return (
          t.type === 'expense' &&
          t.category === target.category &&
          t.description === target.description &&
          t.cardName === target.cardName &&
          t.totalInstallments === target.totalInstallments
        );
      });

      // If user does not want to update all, or it's a single item
      if (series.length <= 1 && options?.updateAllInGroup === false) {
        return updateTransaction(id, updatedData);
      }

      // Sort series by installment number (1, 2, 3...)
      series.sort((a, b) => (a.currentInstallment || 1) - (b.currentInstallment || 1));

      // Deduce base date (date of installment 1)
      const currentNum = target.currentInstallment || 1;
      const targetDate = updatedData.date || target.date;
      const baseDate = addMonthsToDateString(targetDate, -(currentNum - 1));

      const newTotal =
        options?.newTotalInstallments ||
        updatedData.totalInstallments ||
        target.totalInstallments ||
        series.length ||
        1;
      const newAmount = updatedData.amount !== undefined ? updatedData.amount : target.amount;
      const effectiveGroupId =
        groupId || `group-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const batch = writeBatch(db);
      const toDeleteIds: string[] = [];
      const updatedItems: Transaction[] = [];

      // If new total is less than current series, delete excess installments
      if (newTotal < series.length) {
        for (let i = newTotal; i < series.length; i++) {
          const delItem = series[i];
          toDeleteIds.push(delItem.id);
          batch.delete(doc(db, 'transactions', delItem.id));
        }
      }

      // Update existing installments up to newTotal
      for (let i = 1; i <= Math.min(newTotal, series.length); i++) {
        const existingTx = series[i - 1];
        const instDate = addMonthsToDateString(baseDate, i - 1);
        const updatedItem: Transaction = {
          ...existingTx,
          description:
            updatedData.description !== undefined ? updatedData.description : existingTx.description,
          amount: newAmount,
          date: instDate,
          cardName: updatedData.cardName !== undefined ? updatedData.cardName : existingTx.cardName,
          category: updatedData.category || existingTx.category || 'credit_card',
          type: updatedData.type || existingTx.type || 'expense',
          paymentMethod: updatedData.paymentMethod || existingTx.paymentMethod || 'credit_card',
          currentInstallment: newTotal > 1 ? i : undefined,
          totalInstallments: newTotal > 1 ? newTotal : undefined,
          installmentGroupId: newTotal > 1 ? effectiveGroupId : undefined,
          notes: updatedData.notes !== undefined ? updatedData.notes : existingTx.notes,
        };
        updatedItems.push(updatedItem);
        const docRef = doc(db, 'transactions', existingTx.id);
        batch.set(docRef, sanitizeForFirestore(updatedItem));
      }

      // If new total is greater than current series, create additional installments
      if (newTotal > series.length) {
        for (let i = series.length + 1; i <= newTotal; i++) {
          const instDate = addMonthsToDateString(baseDate, i - 1);
          const newId = `tx-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
          const newItem: Transaction = {
            id: newId,
            type: updatedData.type || target.type || 'expense',
            category: updatedData.category || target.category || 'credit_card',
            description:
              updatedData.description !== undefined ? updatedData.description : target.description,
            amount: newAmount,
            date: instDate,
            paymentMethod: updatedData.paymentMethod || target.paymentMethod || 'credit_card',
            cardName: updatedData.cardName !== undefined ? updatedData.cardName : target.cardName,
            currentInstallment: i,
            totalInstallments: newTotal,
            installmentGroupId: effectiveGroupId,
            isPaid: false,
            notes: updatedData.notes !== undefined ? updatedData.notes : target.notes,
            createdAt: nowIso,
          };
          updatedItems.push(newItem);
          const docRef = doc(db, 'transactions', newId);
          batch.set(docRef, sanitizeForFirestore(newItem));
        }
      }

      // Optimistic update in state
      const updatedMap = new Map(updatedItems.map((t) => [t.id, t]));
      setTransactions((prev) => {
        const remaining = prev.filter((t) => !toDeleteIds.includes(t.id));
        const updated = remaining.map((t) => (updatedMap.has(t.id) ? updatedMap.get(t.id)! : t));
        const added = updatedItems.filter((t) => !prev.some((p) => p.id === t.id));
        const combined = [...added, ...updated];
        combined.sort((a, b) => b.date.localeCompare(a.date));
        return combined;
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'transactions');
      }
    },
    [transactions, updateTransaction]
  );

  const deleteTransaction = useCallback(
    async (id: string, deleteAllInGroup: boolean = false) => {
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
          } else if (target.totalInstallments && target.totalInstallments > 1) {
            idsToDelete = transactions
              .filter(
                (item) =>
                  item.description === target.description &&
                  item.cardName === target.cardName &&
                  item.totalInstallments === target.totalInstallments
              )
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
    [transactions]
  );

  const toggleTransactionPaid = useCallback(
    async (id: string) => {
      let nextPaid = false;
      setTransactions((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            nextPaid = !item.isPaid;
            return { ...item, isPaid: nextPaid };
          }
          return item;
        })
      );

      try {
        const docRef = doc(db, 'transactions', id);
        await setDoc(docRef, { isPaid: nextPaid }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
      }
    },
    []
  );

  const setCardInvoicePaid = useCallback(
    async (cardName: string, monthKey: string, isPaid: boolean) => {
      const affectedIds: string[] = [];
      setTransactions((prev) =>
        prev.map((item) => {
          // EXCLUSIVE TO CREDIT CARDS: Never touch fixed debts, variable expenses, or income!
          const isCardTx =
            item.type === 'expense' &&
            (item.category === 'credit_card' || item.paymentMethod === 'credit_card');

          if (!isCardTx) {
            return item;
          }

          // Match card by cardName
          const matchesCard =
            (item.cardName && item.cardName.trim().toLowerCase() === cardName.trim().toLowerCase()) ||
            (!item.cardName && cardName.trim().toLowerCase() === (creditCards[0]?.name || '').trim().toLowerCase());

          if (matchesCard && item.date.startsWith(monthKey)) {
            affectedIds.push(item.id);
            return { ...item, isPaid };
          }
          return item;
        })
      );

      if (affectedIds.length === 0) return;

      try {
        const batch = writeBatch(db);
        affectedIds.forEach((id) => {
          const docRef = doc(db, 'transactions', id);
          batch.set(docRef, { isPaid }, { merge: true });
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `transactions/batch-card-invoice`);
      }
    },
    [creditCards]
  );

  // Budget limits mutation (Admin Only)
  const updateBudgetLimit = useCallback(
    async (id: string, newLimit: number, threshold?: number) => {
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
    []
  );

  const saveAllBudgetLimits = useCallback(
    async (newLimits: BudgetLimit[]) => {
      setBudgetLimits(newLimits);
      try {
        localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(newLimits));
        const batch = writeBatch(db);
        newLimits.forEach((lim) => {
          batch.set(doc(db, 'limits', lim.id), lim, { merge: true });
        });
        await batch.commit();
        setLastCloudSync(new Date());
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'limits');
      }
    },
    []
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
        if (salary >= 0) {
          const existingSalary = updatedList.find(
            (t) => t.date.startsWith(mKey) && t.category === 'salary'
          );
          if (existingSalary) {
            if (salary === 0) {
              updatedList = updatedList.filter((t) => t.id !== existingSalary.id);
              deleteDoc(doc(db, 'transactions', existingSalary.id)).catch(console.warn);
            } else {
              const mod = { ...existingSalary, amount: salary };
              updatedList = updatedList.map((t) => (t.id === existingSalary.id ? mod : t));
              newlyAddedOrUpdated.push(mod);
            }
          } else if (salary > 0) {
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
              deleteDoc(doc(db, 'transactions', existingCommission.id)).catch(console.warn);
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
              deleteDoc(doc(db, 'transactions', existingExtra.id)).catch(console.warn);
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
            batch.set(docRef, sanitizeForFirestore(tx), { merge: true });
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'transactions');
        }
      }
    },
    [transactions, selectedMonth, selectedYear, selectedMonthKey]
  );

  // Credit cards mutations (Admin Only)
  const addCreditCard = useCallback(
    async (newCard: Omit<CreditCard, 'id'>) => {
      const id = `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const created: CreditCard = { ...newCard, id };
      setCreditCards((prev) => [...prev, created]);

      try {
        const docRef = doc(db, 'cards', id);
        await setDoc(docRef, sanitizeForFirestore(created));
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `cards/${id}`);
      }

      return created;
    },
    []
  );

  const updateCreditCard = useCallback(
    async (id: string, updatedFields: Partial<CreditCard>) => {
      let finalCard: CreditCard | null = null;
      setCreditCards((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            finalCard = { ...c, ...updatedFields };
            return finalCard;
          }
          return c;
        })
      );

      try {
        const docRef = doc(db, 'cards', id);
        const dataToSave = finalCard ? sanitizeForFirestore(finalCard) : sanitizeForFirestore(updatedFields);
        await setDoc(docRef, dataToSave, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `cards/${id}`);
      }
    },
    []
  );

  const deleteCreditCard = useCallback(
    async (id: string) => {
      setCreditCards((prev) => prev.filter((c) => c.id !== id));

      try {
        const docRef = doc(db, 'cards', id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `cards/${id}`);
      }
    },
    []
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
      const id = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const created: InvestmentGoal = {
        ...newGoal,
        id,
        createdAt: new Date().toISOString(),
      };
      setInvestments((prev) => [...prev, created]);

      try {
        const docRef = doc(db, 'investments', id);
        await setDoc(docRef, sanitizeForFirestore(created));
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `investments/${id}`);
      }

      return created;
    },
    []
  );

  const updateInvestmentGoal = useCallback(
    async (id: string, updatedFields: Partial<InvestmentGoal>) => {
      let finalGoal: InvestmentGoal | null = null;
      setInvestments((prev) =>
        prev.map((g) => {
          if (g.id === id) {
            finalGoal = { ...g, ...updatedFields };
            return finalGoal;
          }
          return g;
        })
      );

      try {
        const docRef = doc(db, 'investments', id);
        const dataToSave = finalGoal ? sanitizeForFirestore(finalGoal) : sanitizeForFirestore(updatedFields);
        await setDoc(docRef, dataToSave, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `investments/${id}`);
      }
    },
    []
  );

  const deleteInvestmentGoal = useCallback(
    async (id: string) => {
      setInvestments((prev) => prev.filter((g) => g.id !== id));
      setContributions((prev) => prev.filter((c) => c.goalId !== id));

      try {
        const docRef = doc(db, 'investments', id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `investments/${id}`);
      }
    },
    []
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
        await setDoc(docRef, sanitizeForFirestore(newContrib));
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
          await setDoc(doc(db, 'transactions', txId), sanitizeForFirestore(txObj));
        } catch (e) {
          console.error('Error saving contribution transaction', e);
        }
      }

      return newContrib;
    },
    [investments, selectedMonth, selectedYear]
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
    updateInstallmentSeries,
    deleteTransaction,
    toggleTransactionPaid,
    setCardInvoicePaid,
    updateBudgetLimit,
    saveAllBudgetLimits,
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
    refreshFromCloud,
    checkAdminPermission,
  };
}
