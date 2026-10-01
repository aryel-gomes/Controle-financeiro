import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  SlidersHorizontal,
  Download,
  Wallet,
  Banknote,
  Cloud,
  Sun,
  Moon,
  MoreVertical,
  RotateCcw,
} from 'lucide-react';
import { getMonthName } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onOpenNewTransaction: () => void;
  onOpenBudgetModal: () => void;
  onOpenExportModal: () => void;
  onOpenIncomeModal: () => void;
  onOpenAdminModal: () => void;
  isCloudActive: boolean;
  activeTab: 'overview' | 'transactions' | 'cards' | 'investments' | 'budgets';
  setActiveTab: (tab: 'overview' | 'transactions' | 'cards' | 'investments' | 'budgets') => void;
  hasActiveAlerts: boolean;
  onResetToZero?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onOpenNewTransaction,
  onOpenBudgetModal,
  onOpenExportModal,
  onOpenIncomeModal,
  onOpenAdminModal,
  isCloudActive,
  activeTab,
  setActiveTab,
  hasActiveAlerts,
  onResetToZero,
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isCurrentMonth = selectedYear === 2026 && selectedMonth === 8;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Desktop Header Bar */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* 1. Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  FinanPlan
                </span>
                <span className="hidden md:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Gestão Pessoal
                </span>
              </div>
            </div>
          </div>

          {/* 2. Desktop Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Transações
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cartões
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'investments'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Investimentos
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'budgets'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Limites & Metas
              {hasActiveAlerts && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* 3. Actions: Month Navigator + Theme Toggle + Cloud + New Transaction */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Period Navigator */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0.5">
              <button
                onClick={onPrevMonth}
                aria-label="Mês anterior"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onCurrentMonth}
                title={isCurrentMonth ? 'Mês atual' : 'Voltar para mês atual'}
                className="px-2 sm:px-2.5 py-1 text-xs font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap"
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">
                  {getMonthName(selectedMonth)} {selectedYear}
                </span>
                <span className="sm:hidden">
                  {getMonthName(selectedMonth).slice(0, 3)}/{String(selectedYear).slice(2)}
                </span>
              </button>
              <button
                onClick={onNextMonth}
                aria-label="Próximo mês"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Explicit Theme Switch: Claro / Escuro */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                title="Ativar Tema Claro"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  theme === 'light'
                    ? 'bg-white text-amber-600 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Claro</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                title="Ativar Tema Escuro"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-amber-300 shadow-xs ring-1 ring-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                <span>Escuro</span>
              </button>
            </div>

            {/* Mobile Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
              aria-label="Alternar tema"
              className="sm:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Cloud Sync Status Indicator */}
            <button
              onClick={onOpenAdminModal}
              title="Banco de dados na nuvem ativo e sincronizado"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors relative flex items-center justify-center"
            >
              <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Settings / More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen((v) => !v)}
                title="Mais opções e configurações"
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenIncomeModal();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <Banknote className="w-4 h-4 text-emerald-500" />
                      <span>Definir Salário & Renda</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenBudgetModal();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                      <span>Configurar Limites de Gastos</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenExportModal();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <Download className="w-4 h-4 text-blue-500" />
                      <span>Exportar CSV / Backup</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        toggleTheme();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-4 h-4 text-amber-400" />
                          <span>Mudar para Tema Claro</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4 text-slate-700" />
                          <span>Mudar para Tema Escuro</span>
                        </>
                      )}
                    </button>

                    {onResetToZero && (
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          onResetToZero();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Zerar Dados</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Primary Action Button: New Transaction */}
            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Scrollable Bar) */}
        <div className="md:hidden flex items-center overflow-x-auto py-2 gap-1.5 scrollbar-none -mx-1 px-1 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
              activeTab === 'transactions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Transações
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
              activeTab === 'cards'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Cartões
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
              activeTab === 'investments'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Investimentos
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`relative px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
              activeTab === 'budgets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Limites
            {hasActiveAlerts && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
