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
import { AdminAuthModal } from './components/AdminAuthModal';
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
  Wallet,
  Cloud,
  Database,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function App() {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const store = useFinanceStore(() => setIsAdminModalOpen(true));

  const [activeTab, setActiveTab] = useState<
    'overview' | 'transactions' | 'cards' | 'investments' | 'budgets'
  >('overview');
  const [overviewSection, setOverviewSection] = useState<
    'transactions' | 'installments' | 'cards' | 'charts' | 'investments'
  >('transactions');
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
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        isCloudActive={store.isCloudActive}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveAlerts={store.activeAlerts.length > 0}
      />

      {/* Quota Exceeded Notification */}
      {store.cloudQuotaExceeded && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2.5 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 font-bold shrink-0">
                ⚠️
              </span>
              <span>
                <strong>Limite diário gratuito do Google Firestore atingido:</strong> A sincronização em tempo real entre aparelhos está temporariamente pausada pelo Google até a renovação diária da cota (à meia-noite). Seus dados locais continuam salvos no navegador.
              </span>
            </div>
            <a
              href="https://console.firebase.google.com/project/hopeful-parsec-5vr20/firestore/databases/ai-studio-finanplangestofi-e463e0bf-aaec-435f-9667-00c9aae03975/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shrink-0 transition-colors"
            >
              Ver Cota / Upgrade no Firebase →
            </a>
          </div>
        </div>
      )}

      {/* Cloud Sync Status Strip (shows if offline/demo or syncing) */}
      {!store.isCloudActive ? (
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 text-xs text-slate-300">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                <strong className="text-white">Modo Consulta (Dados em Nuvem):</strong> Conectado em tempo real com {store.transactions.length} lançamentos do banco de dados.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const ok = await store.refreshFromCloud();
                  if (ok) {
                    alert('Dados da nuvem recarregados com sucesso!');
                  }
                }}
                disabled={store.isCloudSyncing}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5"
                title="Puxar dados atualizados do banco de dados na nuvem"
              >
                <span>🔄</span>
                <span>{store.isCloudSyncing ? 'Atualizando...' : 'Recarregar da Nuvem'}</span>
              </button>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 font-semibold text-emerald-300 transition-colors"
              >
                Acessar como Admin para Editar →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border-b border-emerald-900/50 px-3 py-1.5 text-[11px] text-emerald-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong>Modo Administrador Ativo:</strong> Todas as alterações feitas aqui são salvas no banco de dados e atualizam instantaneamente para qualquer dispositivo ou pessoa que abrir o site.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await store.forceSyncToCloud();
                  alert('Sincronização com a nuvem solicitada! Os dados deste aparelho foram transmitidos.');
                }}
                disabled={store.isCloudSyncing}
                className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 font-semibold text-[10px] transition-colors"
                title="Envia todas as transações e cartões deste aparelho para a nuvem"
              >
                {store.isCloudSyncing ? 'Enviando...' : 'Forçar Envio para Nuvem ☁️'}
              </button>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-[11px]"
              >
                Gerenciar Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Spending Limit Warning Banner */}
      <AlertBanner
        alerts={store.activeAlerts}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onFilterCategory={handleFilterCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 sm:space-y-5 pb-24 sm:pb-6">
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

            {/* Modern Clean Segmented Control Hub */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-x-auto scrollbar-none shadow-xs">
              <button
                onClick={() => setOverviewSection('transactions')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  overviewSection === 'transactions'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Extrato & Lançamentos ({store.monthTransactions.length})</span>
              </button>

              <button
                onClick={() => setOverviewSection('installments')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  overviewSection === 'installments'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mapa de Parcelas</span>
              </button>

              <button
                onClick={() => setOverviewSection('cards')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  overviewSection === 'cards'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CardIcon className="w-3.5 h-3.5" />
                <span>Cartões & Faturas ({store.creditCards.length})</span>
              </button>

              <button
                onClick={() => setOverviewSection('charts')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  overviewSection === 'charts'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Gráficos & Comparativo</span>
              </button>

              <button
                onClick={() => setOverviewSection('investments')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  overviewSection === 'investments'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Investimentos & Metas</span>
              </button>
            </div>

            {/* View 1: Extrato & Lançamentos com Painel Lateral Limpo */}
            {overviewSection === 'transactions' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-150">
                {/* Coluna Principal: Extrato do Mês */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Lançamentos de {store.currentMonthSummary.label}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {store.monthTransactions.length} registros neste mês
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsIncomeModalOpen(true)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 rounded-xl transition-colors"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Ajustar Renda</span>
                      </button>

                      <button
                        onClick={() => handleOpenNewTransaction()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors shadow-sm"
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

                {/* Coluna Lateral: Resumo Compacto e Inteligente */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Mini Donut de Categorias */}
                  <ExpensesDonutChart
                    summary={store.currentMonthSummary}
                    onFilterCategory={handleFilterCategory}
                  />

                  {/* Resumo Rápido de Cartões de Crédito */}
                  <div className="bg-[#121927] p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-white">Faturas dos Cartões</h4>
                      </div>
                      <button
                        onClick={() => setOverviewSection('cards')}
                        className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                      >
                        <span>Gerenciar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {store.creditCards.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">
                        Nenhum cartão cadastrado.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {store.creditCards.slice(0, 3).map((card) => {
                          const cardTxs = store.monthTransactions.filter(
                            (tx) =>
                              tx.type === 'expense' &&
                              (tx.cardName === card.name ||
                                (!tx.cardName && card.id === store.creditCards[0]?.id))
                          );
                          const invoice = cardTxs.reduce((acc, curr) => acc + curr.amount, 0);

                          return (
                            <div
                              key={card.id}
                              onClick={() => setOverviewSection('cards')}
                              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
                            >
                              <span className="font-medium text-white truncate">{card.name}</span>
                              <span className="font-mono font-bold text-purple-300">
                                {formatCurrency(invoice)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Atalho Prático para Mapa de Parcelas */}
                  <div className="bg-[#121927] p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-white">Compras Parceladas</h4>
                      </div>
                      <button
                        onClick={() => setOverviewSection('installments')}
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        <span>Ver Mapa</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Veja o cronograma completo de parcelas que vencem nos próximos meses e o valor total comprometido.
                    </p>
                    <button
                      onClick={() => setOverviewSection('installments')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                    >
                      Abrir Mapa de Parcelas Futuras →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Mapa de Parcelas (Redesenhado & Limpo) */}
            {overviewSection === 'installments' && (
              <div className="animate-in fade-in duration-150">
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

            {/* View 3: Cartões de Crédito & Faturas */}
            {overviewSection === 'cards' && (
              <div className="animate-in fade-in duration-150">
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

            {/* View 4: Gráficos & Comparativo Mensal */}
            {overviewSection === 'charts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-150">
                <MonthlyComparisonChart
                  historyData={store.historyData}
                  selectedMonthKey={store.selectedMonthKey}
                />
                <ExpensesDonutChart
                  summary={store.currentMonthSummary}
                  onFilterCategory={handleFilterCategory}
                />
              </div>
            )}

            {/* View 5: Investimentos & Metas */}
            {overviewSection === 'investments' && (
              <div className="animate-in fade-in duration-150">
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
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0B0F17] py-5 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Controle financeiro</span>
            <span>·</span>
            <span>Gestão Pessoal Descomplicada</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
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

      {/* Mobile Bottom Navigation Bar (screen width < 640px) */}
      <nav
        aria-label="Navegação rápida no celular"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-lg border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
            activeTab === 'overview' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px]">Início</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
            activeTab === 'transactions' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px]">Extrato</span>
        </button>

        {/* Center Prominent Action Button: + Nova Transação */}
        <button
          onClick={() => handleOpenNewTransaction()}
          className="flex items-center justify-center -mt-5 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white shadow-lg shadow-emerald-950/70 ring-4 ring-[#0B0F17] transition-transform active:scale-95 shrink-0"
          aria-label="Nova transação"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>

        <button
          onClick={() => setActiveTab('cards')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
            activeTab === 'cards' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CardIcon className="w-5 h-5" />
          <span className="text-[10px]">Cartões</span>
        </button>

        <button
          onClick={() => setActiveTab('investments')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
            activeTab === 'investments' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PiggyBank className="w-5 h-5" />
          <span className="text-[10px]">Investir</span>
        </button>
      </nav>

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

      {/* Admin Cloud Authentication & Real-Time Sync Modal */}
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
