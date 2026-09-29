import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  SlidersHorizontal,
  Download,
  Wallet,
  Banknote,
  Database,
} from 'lucide-react';
import { getMonthName } from '../utils/formatters';

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
}) => {
  const isCurrentMonth = selectedYear === 2026 && selectedMonth === 8;

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Desktop Header Row (sm and above) */}
        <div className="hidden sm:flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Wallet className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Controle financeiro
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
                Gestão Pessoal
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transações
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'cards'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cartões
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'investments'
                  ? 'bg-slate-800 text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Investimentos
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'budgets'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Limites & Metas
              {hasActiveAlerts && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Period Navigator */}
            <div className="flex items-center bg-slate-900/90 rounded-xl border border-slate-800 p-0.5">
              <button
                onClick={onPrevMonth}
                aria-label="Mês anterior"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onCurrentMonth}
                title={isCurrentMonth ? 'Mês atual' : 'Voltar para mês atual'}
                className="px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-emerald-400 font-mono tabular-nums flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {getMonthName(selectedMonth)} {selectedYear}
                </span>
              </button>
              <button
                onClick={onNextMonth}
                aria-label="Próximo mês"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Income Config Button */}
            <button
              onClick={onOpenIncomeModal}
              title="Configurar Salário, Comissão e Extras"
              className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors hidden sm:flex items-center justify-center gap-1 text-xs font-medium"
            >
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline text-xs">Renda Mensal</span>
            </button>

            {/* Quick Limit Settings */}
            <button
              onClick={onOpenBudgetModal}
              title="Ajustar limites de gastos"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors hidden sm:flex items-center justify-center"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Admin Cloud Sync Button */}
            <button
              onClick={onOpenAdminModal}
              title="Acesso de Administrador e Sincronização em Tempo Real"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                isCloudActive
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/80 shadow-xs'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-950/70 shadow-xs'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloudActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden md:inline">
                {isCloudActive ? 'Admin Sincronizado' : 'Conectar Admin'}
              </span>
              <span className="md:hidden">
                {isCloudActive ? 'Nuvem' : 'Admin'}
              </span>
            </button>

            {/* Export & Backup */}
            <button
              onClick={onOpenExportModal}
              title="Exportar ou importar dados"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors hidden sm:flex items-center justify-center"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Primary Action: New Transaction */}
            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* Mobile Header (screen width < 640px) */}
        <div className="sm:hidden py-2.5 space-y-2">
          {/* Mobile Top Row: Brand + Month Switcher + Quick + Button */}
          <div className="flex items-center justify-between gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Wallet className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span className="text-sm font-bold tracking-tight text-white truncate">
                Controle financeiro
              </span>
            </div>

            {/* Right: Period Navigator + New Transaction */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Compact Period Switcher */}
              <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5">
                <button
                  onClick={onPrevMonth}
                  aria-label="Mês anterior"
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onCurrentMonth}
                  title="Mês atual"
                  className="px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-200 tabular-nums whitespace-nowrap"
                >
                  {getMonthName(selectedMonth).slice(0, 3)}/{String(selectedYear).slice(2)}
                </button>
                <button
                  onClick={onNextMonth}
                  aria-label="Próximo mês"
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* + Nova Button */}
              <button
                onClick={onOpenNewTransaction}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>+ Nova</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Tabs: Horizontal Scroll */}
          <div className="flex items-center overflow-x-auto pb-0.5 gap-1.5 scrollbar-none -mx-1 px-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-white'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'transactions'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-white'
              }`}
            >
              Transações
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'cards'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-white'
              }`}
            >
              Cartões
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'investments'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-white'
              }`}
            >
              Investimentos
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                activeTab === 'budgets'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-white'
              }`}
            >
              Limites & Metas
              {hasActiveAlerts && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={onOpenIncomeModal}
              className="px-2.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors text-emerald-400 bg-slate-900 border border-emerald-500/30 flex items-center gap-1 shrink-0"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Renda</span>
            </button>
            <button
              onClick={onOpenExportModal}
              className="px-2.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors text-slate-400 bg-slate-900 border border-slate-800 flex items-center gap-1 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>
            <button
              onClick={onOpenAdminModal}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                isCloudActive
                  ? 'text-emerald-300 bg-emerald-950/50 border border-emerald-500/40'
                  : 'text-amber-300 bg-amber-950/50 border border-amber-500/40'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCloudActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{isCloudActive ? 'Admin Nuvem' : 'Entrar Admin'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
