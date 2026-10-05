import React, { useState } from 'react';
import { useFinanceStore } from './hooks/useFinanceStore';
import { Sidebar } from './components/Sidebar';
import { AlertBanner } from './components/AlertBanner';
import { MonthScrubber } from './components/MonthScrubber';
import { QuickStatsHero } from './components/QuickStatsHero';
import { InstallmentFutureViewer } from './components/InstallmentFutureViewer';
import { BudgetProgressCard } from './components/charts/BudgetProgressCard';
import { FutureProjectionViewer } from './components/FutureProjectionViewer';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BudgetLimitModal } from './components/BudgetLimitModal';
import { IncomeConfigModal } from './components/IncomeConfigModal';
import { CreditCardManager } from './components/CreditCardManager';
import { InvestmentManager } from './components/InvestmentManager';
import { ExportImportModal } from './components/ExportImportModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { Transaction } from './types/finance';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

export default function App() {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const store = useFinanceStore(() => setIsAdminModalOpen(true));

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'transactions'
    | 'cards'
    | 'installments'
    | 'investments'
    | 'budgets'
    | 'projection'
  >('overview');

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Quick handler to open new transaction
  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  // Handler to open edit transaction
  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  // Filter category shortcut
  const handleFilterCategory = (category: string) => {
    if (activeCategoryFilter === category) {
      setActiveCategoryFilter(null);
    } else {
      setActiveCategoryFilter(category === 'all' ? null : category);
    }
  };

  // Zero out all values
  const handleResetToZero = () => {
    if (
      confirm(
        'Deseja realmente zerar todos os lançamentos para começar do zero?\n\nIsso limpará suas transações para que você organize suas finanças com seus próprios números.'
      )
    ) {
      store.resetToZero();
    }
  };

  const overallAlert = store.limitAlerts.find((a) => a.category === 'overall');
  const overallLimit = overallAlert?.limitAmount || 5500;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased transition-colors duration-200">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMonth={store.selectedMonth}
        selectedYear={store.selectedYear}
        onPrevMonth={store.goToPreviousMonth}
        onNextMonth={store.goToNextMonth}
        onCurrentMonth={store.goToCurrentMonth}
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        isCloudActive={store.isCloudActive}
        hasActiveAlerts={store.activeAlerts.length > 0}
      />

      {/* 2. Main Body Area */}
      <div className="flex-1 lg:pl-64 sm:lg:pl-72 flex flex-col min-w-0">
        {/* Quota Exceeded Notification (only shown if Google daily limit reached) */}
        {store.cloudQuotaExceeded && (
          <div className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800/80 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                  ⚠️
                </span>
                <span>
                  <strong>Limite diário gratuito do Google Firestore atingido:</strong> A sincronização entre aparelhos está temporariamente pausada até a renovação diária da cota. Seus dados continuam salvos com segurança.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Limit Warning Banner */}
        <AlertBanner
          alerts={store.activeAlerts}
          onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          onFilterCategory={handleFilterCategory}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
          {/* TAB 1: VISÃO GERAL (Month Timeline + 3 Cards: Entradas, Saídas, Saldo + Extrato) */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Month Timeline Scrubber with Values */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Linha do Tempo Mensal
                  </h2>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Selecione um mês para ver valores
                  </span>
                </div>
                <MonthScrubber
                  selectedYear={store.selectedYear}
                  selectedMonth={store.selectedMonth}
                  onSelectMonthYear={(year, month) => {
                    store.setSelectedYear(year);
                    store.setSelectedMonth(month);
                  }}
                  transactions={store.transactions}
                  overallLimit={overallLimit}
                />
              </div>

              {/* 3 Clean Dashboard Cards: Entradas, Saídas, Saldo Atual */}
              <QuickStatsHero
                summary={store.currentMonthSummary}
                onOpenNewTransaction={() => handleOpenNewTransaction()}
                onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
              />

              {/* Month Transactions List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Lançamentos de {store.currentMonthSummary.label}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {store.monthTransactions.length} registros
                  </span>
                </div>

                <TransactionList
                  transactions={store.monthTransactions}
                  onOpenNewTransaction={() => handleOpenNewTransaction()}
                  onEditTransaction={handleEditTransaction}
                  onDeleteTransaction={store.deleteTransaction}
                  onTogglePaid={store.toggleTransactionPaid}
                  initialCategoryFilter={activeCategoryFilter}
                />
              </div>
            </div>
          )}

          {/* TAB 2: TODOS OS LANÇAMENTOS */}
          {activeTab === 'transactions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Extrato de Lançamentos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {store.monthTransactions.length} lançamentos em {store.currentMonthSummary.label}
                  </p>
                </div>
              </div>

              <TransactionList
                transactions={store.monthTransactions}
                onOpenNewTransaction={() => handleOpenNewTransaction()}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={store.deleteTransaction}
                onTogglePaid={store.toggleTransactionPaid}
                initialCategoryFilter={activeCategoryFilter}
              />
            </div>
          )}

          {/* TAB 3: CARTÕES DE CRÉDITO */}
          {activeTab === 'cards' && (
            <div className="animate-in fade-in duration-200">
              <CreditCardManager
                creditCards={store.creditCards}
                transactions={store.monthTransactions}
                onOpenNewTransaction={() => handleOpenNewTransaction()}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={store.deleteTransaction}
                onAddCreditCard={store.addCreditCard}
                onUpdateCreditCard={store.updateCreditCard}
                onDeleteCreditCard={store.deleteCreditCard}
                onMarkCardInvoicePaid={(cardName, isPaid) => {
                  store.setCardInvoicePaid(cardName, store.selectedMonthKey, isPaid);
                }}
                onToggleTransactionPaid={store.toggleTransactionPaid}
                selectedMonthName={store.currentMonthSummary.label}
              />
            </div>
          )}

          {/* TAB 4: PARCELAS FUTURAS */}
          {activeTab === 'installments' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Compras Parceladas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cronograma futuro de vencimentos de compras divididas no cartão
                </p>
              </div>

              <InstallmentFutureViewer
                transactions={store.transactions}
                onSelectMonthYear={(year, month) => {
                  store.setSelectedYear(year);
                  store.setSelectedMonth(month);
                }}
                selectedMonthKey={store.selectedMonthKey}
              />
            </div>
          )}

          {/* TAB 5: INVESTIMENTOS & METAS */}
          {activeTab === 'investments' && (
            <div className="animate-in fade-in duration-200">
              <InvestmentManager
                investments={store.investments}
                contributions={store.contributions}
                totalInvested={store.totalInvested}
                totalTargetInvested={store.totalTargetInvested}
                monthInvestedNet={store.monthInvestedNet}
                selectedMonthName={store.currentMonthSummary.label}
                onAddGoal={store.addInvestmentGoal}
                onUpdateGoal={store.updateInvestmentGoal}
                onDeleteGoal={store.deleteInvestmentGoal}
                onAddContribution={store.addInvestmentContribution}
                onDeleteContribution={store.deleteInvestmentContribution}
              />
            </div>
          )}

          {/* TAB 6: LIMITES DE GASTOS */}
          {activeTab === 'budgets' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121927] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs transition-colors">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Limites de Gastos & Teto Orçamentário
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Defina tetos mensais para manter suas despesas sob controle
                  </p>
                </div>

                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-xs"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Configurar Limites</span>
                </button>
              </div>

              <BudgetProgressCard
                alerts={store.limitAlerts}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              />
            </div>
          )}

          {/* TAB 7: PROJEÇÃO FUTURA */}
          {activeTab === 'projection' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <FutureProjectionViewer
                transactions={store.transactions}
                onSelectMonthYear={(year, month) => {
                  store.setSelectedYear(year);
                  store.setSelectedMonth(month);
                  setActiveTab('overview');
                }}
                onOpenNewTransaction={() => handleOpenNewTransaction()}
                onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
              />
            </div>
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0B0F17]/50 py-4 px-6 text-xs text-slate-400 dark:text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>Gestão Financeira · Controle Pessoal</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetToZero}
              className="text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Zerar Dados</span>
            </button>
            <span>·</span>
            <button
              onClick={() => store.loadSampleData()}
              className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
            >
              Carregar Dados de Exemplo
            </button>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={(data, existingId, options) => {
          if (existingId) {
            const isInstallment =
              options?.updateAllInGroup ||
              editingTransaction?.installmentGroupId ||
              (data.totalInstallments && data.totalInstallments > 1) ||
              (editingTransaction?.totalInstallments && editingTransaction.totalInstallments > 1);

            if (isInstallment) {
              store.updateInstallmentSeries(existingId, data, options);
            } else {
              store.updateTransaction(existingId, data);
            }
          } else {
            store.addTransaction(data, options);
          }
        }}
        editingTransaction={editingTransaction}
        creditCards={store.creditCards}
        onAddCreditCard={store.addCreditCard}
        defaultDate={(() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        })()}
      />

      <IncomeConfigModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        currentSalary={store.currentMonthSummary.salaryIncome}
        currentCommission={store.currentMonthSummary.commissionIncome}
        currentExtra={store.currentMonthSummary.otherIncome}
        selectedMonthName={store.currentMonthSummary.label}
        onSaveIncomes={(data) => {
          store.updateMonthlyIncomes(data);
        }}
      />

      <BudgetLimitModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgetLimits={store.budgetLimits}
        onSaveLimits={store.saveAllBudgetLimits}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={store.transactions}
        budgetLimits={store.budgetLimits}
        creditCards={store.creditCards}
        onImportData={({ transactions, budgetLimits }) => {
          if (transactions) store.setTransactions(transactions);
          if (budgetLimits) store.setBudgetLimits(budgetLimits);
        }}
        onResetData={handleResetToZero}
        onLoadSampleData={store.loadSampleData}
      />

      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isCloudActive={store.isCloudActive}
        isSyncing={store.isCloudSyncing}
        onForceSyncToCloud={store.forceSyncToCloud}
        transactionCount={store.transactions.length}
      />
    </div>
  );
}
