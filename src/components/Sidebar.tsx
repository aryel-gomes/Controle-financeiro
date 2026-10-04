import React, { useState } from 'react';
import {
  Wallet,
  Receipt,
  CreditCard as CardIcon,
  Calendar,
  PiggyBank,
  SlidersHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Cloud,
  FileSpreadsheet,
  Banknote,
  Menu,
  X,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMonthName } from '../utils/formatters';

interface SidebarProps {
  activeTab: 'overview' | 'transactions' | 'cards' | 'installments' | 'investments' | 'budgets';
  setActiveTab: (
    tab: 'overview' | 'transactions' | 'cards' | 'installments' | 'investments' | 'budgets'
  ) => void;
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onOpenNewTransaction: () => void;
  onOpenIncomeModal: () => void;
  onOpenExportModal: () => void;
  onOpenAdminModal: () => void;
  isCloudActive: boolean;
  hasActiveAlerts?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onOpenNewTransaction,
  onOpenIncomeModal,
  onOpenExportModal,
  onOpenAdminModal,
  isCloudActive,
  hasActiveAlerts,
}) => {
  const { theme, setTheme } = useTheme();
  const { isAdmin, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCurrentMonth = selectedYear === 2026 && selectedMonth === 8;

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Visão Geral',
      icon: Wallet,
    },
    {
      id: 'transactions' as const,
      label: 'Lançamentos',
      icon: Receipt,
    },
    {
      id: 'cards' as const,
      label: 'Cartões de Crédito',
      icon: CardIcon,
    },
    {
      id: 'installments' as const,
      label: 'Parcelas Futuras',
      icon: Calendar,
    },
    {
      id: 'investments' as const,
      label: 'Investimentos',
      icon: PiggyBank,
    },
    {
      id: 'budgets' as const,
      label: 'Limites de Gastos',
      icon: SlidersHorizontal,
      alert: hasActiveAlerts,
    },
  ];

  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar (screen width < 1024px) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base">Gestão Financeira</span>
          </div>
        </div>

        {/* Mobile quick actions */}
        <div className="flex items-center gap-1.5">
          {/* Admin status button on mobile */}
          <button
            onClick={onOpenAdminModal}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
              isAdmin
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
            title={isAdmin ? 'Admin Conectado' : 'Fazer Login de Admin'}
          >
            {isAdmin ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4" />}
          </button>

          {/* Quick Month navigator */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={onPrevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-bold font-mono text-[11px] text-slate-800 dark:text-slate-200">
              {getMonthName(selectedMonth).slice(0, 3)}/{String(selectedYear).slice(2)}
            </span>
            <button
              onClick={onNextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenNewTransaction}
            className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs"
            title="Novo Lançamento"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs animate-in fade-in"
        />
      )}

      {/* Main Sidebar (Desktop fixed left, Mobile slide-in drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 sm:w-72 bg-white dark:bg-[#0E131F] border-r border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between transition-all duration-200 ${
          mobileMenuOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full lg:translate-x-0 shadow-none'
        }`}
      >
        {/* Top Area: Logo + Month Navigator */}
        <div className="p-5 space-y-4">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
                  Gestão Financeira
                </h1>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Controle Pessoal
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Month Selector Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Mês de Referência
              </span>
              {!isCurrentMonth && (
                <button
                  onClick={onCurrentMonth}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Voltar p/ Hoje
                </button>
              )}
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={onPrevMonth}
                title="Mês anterior"
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold font-mono text-xs sm:text-sm text-slate-900 dark:text-white capitalize">
                {getMonthName(selectedMonth)} {selectedYear}
              </span>

              <button
                onClick={onNextMonth}
                title="Próximo mês"
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prominent Action Button: + Novo Lançamento */}
          <button
            onClick={() => {
              onOpenNewTransaction();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Novo Lançamento</span>
          </button>
        </div>

        {/* Middle Area: Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.alert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Area: Preferences, Admin Login, Theme, Cloud */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
          {/* Admin Login or Connected Card */}
          {isAdmin ? (
            <button
              onClick={() => {
                onOpenAdminModal();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-left flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white truncate block text-[11px]">
                    {user?.displayName || 'Aryel Gomes'}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Admin Conectado
                  </span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenAdminModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-left flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Login de Administrador</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Entrar →</span>
            </button>
          )}

          {/* Explicit Light / Dark Theme Switcher */}
          <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Claro</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              <span>Escuro</span>
            </button>
          </div>

          {/* Quick Utility Links */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
            <button
              onClick={() => {
                onOpenIncomeModal();
                setMobileMenuOpen(false);
              }}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors text-[11px]"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Renda</span>
            </button>

            <button
              onClick={() => {
                onOpenExportModal();
                setMobileMenuOpen(false);
              }}
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors text-[11px]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>

            <button
              onClick={() => {
                onOpenAdminModal();
                setMobileMenuOpen(false);
              }}
              title={
                isCloudActive
                  ? 'Sincronização em nuvem ativa'
                  : 'Sincronização em nuvem'
              }
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors text-[11px]"
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  isCloudActive ? 'text-emerald-500' : 'text-slate-400'
                }`}
              />
              <span>Nuvem</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
