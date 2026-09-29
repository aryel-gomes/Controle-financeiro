import React, { useState } from 'react';
import { useFinanceStore } from './hooks/useFinanceStore';
import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { MonthScrubber } from './components/MonthScrubber';
import { QuickStatsHero } from './components/QuickStatsHero';
import { InstallmentFutureViewer } from './components/InstallmentFutureViewer';
import { MonthlyComparisonChart } from './components/charts/MonthlyComparisonChart';
import { ExpensesDonutChart } from './components/charts/ExpensesDonutChart';
import { BudgetProgressCard } from './components/charts/BudgetProgressCard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BudgetLimitModal } from './components/BudgetLimitModal';
import { IncomeConfigModal } from './components/IncomeConfigModal';
import { CreditCardManager } from './components/CreditCardManager';
import { InvestmentManager } from './components/InvestmentManager';
import { ExportImportModal } from './components/ExportImportModal';
import { Transaction } from './types/finance';
import { formatCurrency } from './utils/formatters';
import {
  SlidersHorizontal,
  Plus,
  Banknote,
  CreditCard as CardIcon,
  PiggyBank,
  ArrowRight,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const store = useFinanceStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'transactions' | 'cards' | 'investments' | 'budgets'
  >('overview');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Quick handler to open new transaction with preset
  const handleOpenNewTransaction = (
    presetType?: 'income' | 'expense',
    presetCategory?: string
  ) => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  // Handler to open edit transaction
  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  // Filter category shortcut from pills or charts
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
        'Deseja realmente zerar todos os valores e começar tudo do zero?\n\nIsso limpará todos os lançamentos de teste, faturas e investimentos para que você organize suas finanças com seus próprios números.'
      )
    ) {
      store.resetToZero();
    }
  };

  const overallAlert = store.limitAlerts.find((a) => a.category === 'overall');
  const overallLimit = overallAlert?.limitAmount || 5500;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. Sticky Navigation Header */}
      <Header
        selectedMonth={store.selectedMonth}
        selectedYear={store.selectedYear}
        onPrevMonth={store.goToPreviousMonth}
        onNextMonth={store.goToNextMonth}
        onCurrentMonth={store.goToCurrentMonth}
        onOpenNewTransaction={() => handleOpenNewTransaction()}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveAlerts={store.activeAlerts.length > 0}
      />

      {/* 2. Spending Limit Warning Banner */}
      <AlertBanner
        alerts={store.activeAlerts}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onFilterCategory={handleFilterCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Interactive Month Timeline Scrubber */}
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

        {/* Tab 1: Visão Geral Unificada & Simplificada */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Modern Financial Cockpit (Hero Balance + Entradas/Saídas) */}
            <QuickStatsHero
              summary={store.currentMonthSummary}
              overallAlert={overallAlert}
              onOpenNewTransaction={handleOpenNewTransaction}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              onOpenIncomeModal={() => setIsIncomeModalOpen(true)}
              onSelectCategoryFilter={handleFilterCategory}
              activeFilter={activeCategoryFilter}
            />

            {/* Visual Installments & Future Debts Progression Map */}
            <InstallmentFutureViewer
              transactions={store.transactions}
              onSelectMonthYear={(year, month) => {
                store.setSelectedYear(year);
                store.setSelectedMonth(month);
              }}
              selectedMonthKey={store.selectedMonthKey}
            />

            {/* Overview Quick Glance: Cards & Investments Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Credit Cards Quick View */}
              <div className="bg-[#121927] p-5 rounded-2xl border border-slate-800/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <CardIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Cartões de Crédito</h3>
                      <p className="text-[11px] text-slate-400">
                        {store.creditCards.length} cartões cadastrados · Faturas do mês
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('cards')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span>Ver todos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {store.creditCards.length === 0 ? (
                  <div className="py-6 px-4 bg-slate-900/60 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
                    <p className="text-xs text-slate-400">Nenhum cartão cadastrado ainda.</p>
                    <button
                      onClick={() => setActiveTab('cards')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar seu primeiro cartão</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {store.creditCards.slice(0, 4).map((card) => {
                      const cardTxs = store.monthTransactions.filter(
                        (tx) =>
                          tx.type === 'expense' &&
                          (tx.cardName === card.name ||
                            (!tx.cardName && card.id === store.creditCards[0]?.id))
                      );
                      const invoice = cardTxs.reduce((acc, curr) => acc + curr.amount, 0);
                      const available = Math.max(0, card.limit - invoice);
                      const usedPct = card.limit > 0 ? (invoice / card.limit) * 100 : 0;

                      return (
                        <div
                          key={card.id}
                          onClick={() => setActiveTab('cards')}
                          className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                              {card.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Venc: dia {card.dueDay}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Fatura:</span>
                            <span className="font-mono tabular-nums font-bold text-white">
                              {formatCurrency(invoice)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                usedPct >= 90
                                  ? 'bg-rose-500'
                                  : usedPct >= 75
                                  ? 'bg-amber-400'
                                  : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.min(100, usedPct)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                            <span>Disp: {formatCurrency(available)}</span>
                            <span>Lim: {formatCurrency(card.limit)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/60">
                  <button
                    onClick={() => setActiveTab('cards')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar / Gerenciar Cartões</span>
                  </button>
                  <button
                    onClick={() => handleOpenNewTransaction('expense', 'credit_card')}
                    className="text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    + Lançar compra
                  </button>
                </div>
              </div>

              {/* Investments Quick View */}
              <div className="bg-[#121927] p-5 rounded-2xl border border-slate-800/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <PiggyBank className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Investimentos & Dinheiro Guardado
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {formatCurrency(store.totalInvested)} acumulados em {store.investments.length} metas
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('investments')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>Abrir aba</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {store.investments.length === 0 ? (
                  <div className="py-6 px-4 bg-slate-900/60 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
                    <p className="text-xs text-slate-400">Nenhuma meta de investimento criada ainda.</p>
                    <button
                      onClick={() => setActiveTab('investments')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar meta para guardar dinheiro</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {store.investments.slice(0, 4).map((inv) => {
                      const progress =
                        inv.targetAmount > 0 ? (inv.currentAmount / inv.targetAmount) * 100 : 0;

                      return (
                        <div
                          key={inv.id}
                          onClick={() => setActiveTab('investments')}
                          className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                              {inv.name}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Guardado:</span>
                            <span className="font-mono tabular-nums font-bold text-white">
                              {formatCurrency(inv.currentAmount)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                            <span>Meta: {formatCurrency(inv.targetAmount)}</span>
                            {inv.expectedReturnAnnual && (
                              <span className="text-slate-500">~{inv.expectedReturnAnnual}% a.a.</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/60">
                  <button
                    onClick={() => setActiveTab('investments')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Dinheiro / Nova Meta</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Rendimento: ~{formatCurrency(store.totalInvested * 0.0085)}/mês
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <MonthlyComparisonChart
                historyData={store.historyData}
                selectedMonthKey={store.selectedMonthKey}
              />
              <ExpensesDonutChart
                summary={store.currentMonthSummary}
                onFilterCategory={handleFilterCategory}
              />
            </div>

            {/* Transactions Section directly accessible on same screen */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Transações de {store.currentMonthSummary.label}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {store.monthTransactions.length} lançamentos neste mês (incluindo parcelas)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsIncomeModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 rounded-xl transition-colors"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Ajustar Renda Mensal</span>
                  </button>

                  <button
                    onClick={() => handleOpenNewTransaction()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Nova Transação</span>
                  </button>
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
          </div>
        )}

        {/* Tab 2: Todas as Transações */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-in fade-in duration-200">
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

        {/* Tab 3: Cartões de Crédito */}
        {activeTab === 'cards' && (
          <div className="animate-in fade-in duration-200">
            <CreditCardManager
              creditCards={store.creditCards}
              transactions={store.monthTransactions}
              onOpenNewTransaction={() => handleOpenNewTransaction('expense', 'credit_card')}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={store.deleteTransaction}
              onAddCreditCard={store.addCreditCard}
              onUpdateCreditCard={store.updateCreditCard}
              onDeleteCreditCard={store.deleteCreditCard}
              selectedMonthName={store.currentMonthSummary.label}
            />
          </div>
        )}

        {/* Tab 4: Investimentos & Guardar Dinheiro */}
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

        {/* Tab 5: Limites & Metas */}
        {activeTab === 'budgets' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121927] p-5 rounded-2xl border border-slate-800 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-white">
                  Limites & Alertas Orçamentários
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ajuste o teto de gastos para evitar estouros nas compras de cartão e dívidas
                </p>
              </div>

              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shadow-sm"
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
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0B0F17] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Controle financeiro</span>
            <span>·</span>
            <span>Gestão Pessoal Descomplicada</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('investments')}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Investimentos
            </button>
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Renda Mensal
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Exportar CSV / Backup
            </button>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Ajustar Limites
            </button>
            <button
              onClick={handleResetToZero}
              title="Zera todos os lançamentos, cartões e investimentos para começar do zero"
              className="text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zerar Tudo (Começar do Zero)</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Deseja carregar os dados de exemplo da demonstração para testes?')) {
                  store.loadSampleData();
                }
              }}
              title="Recarrega dados de demonstração para testar"
              className="text-slate-500 hover:text-slate-400 text-[11px] transition-colors"
            >
              (Exemplo demo)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={(data, existingId, options) => {
          if (existingId) {
            store.updateTransaction(existingId, data);
          } else {
            store.addTransaction(data, options);
          }
        }}
        editingTransaction={editingTransaction}
        creditCards={store.creditCards}
        onAddCreditCard={store.addCreditCard}
        defaultDate={`${store.selectedYear}-${String(store.selectedMonth + 1).padStart(2, '0')}-15`}
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
        onSaveLimits={(limits) => store.setBudgetLimits(limits)}
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
    </div>
  );
}
