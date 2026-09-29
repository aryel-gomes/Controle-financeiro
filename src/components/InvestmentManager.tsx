import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  PiggyBank,
  ShieldCheck,
  Building2,
  Plane,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Edit2,
  Trash2,
  X,
  Check,
  Percent,
  Sparkles,
  Info,
} from 'lucide-react';
import { InvestmentCategory, InvestmentContribution, InvestmentGoal } from '../types/finance';
import { formatCurrency, formatPercent, formatDateBR } from '../utils/formatters';

interface InvestmentManagerProps {
  investments: InvestmentGoal[];
  contributions: InvestmentContribution[];
  totalInvested: number;
  totalTargetInvested: number;
  monthInvestedNet: number;
  selectedMonthName: string;
  onAddGoal: (goal: Omit<InvestmentGoal, 'id' | 'createdAt'>) => void;
  onUpdateGoal: (id: string, goal: Partial<InvestmentGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onAddContribution: (data: {
    goalId: string;
    type: 'deposit' | 'withdraw';
    amount: number;
    date?: string;
    notes?: string;
    createTransactionRecord?: boolean;
  }) => void;
  onDeleteContribution: (id: string) => void;
}

const CATEGORY_MAP: Record<
  InvestmentCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  emergency: {
    label: 'Reserva de Emergência',
    icon: ShieldCheck,
    color: '#10b981',
    bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30',
  },
  cdb_fixed: {
    label: 'Renda Fixa / Tesouro',
    icon: Building2,
    color: '#3b82f6',
    bg: 'bg-blue-950/40 text-blue-400 border-blue-500/30',
  },
  caixinha: {
    label: 'Caixinha / Poupança',
    icon: PiggyBank,
    color: '#ec4899',
    bg: 'bg-pink-950/40 text-pink-400 border-pink-500/30',
  },
  stocks: {
    label: 'Ações / FIIs',
    icon: TrendingUp,
    color: '#8b5cf6',
    bg: 'bg-purple-950/40 text-purple-400 border-purple-500/30',
  },
  goals: {
    label: 'Sonhos & Metas',
    icon: Plane,
    color: '#f59e0b',
    bg: 'bg-amber-950/40 text-amber-400 border-amber-500/30',
  },
  crypto: {
    label: 'Criptoativos',
    icon: Coins,
    color: '#06b6d4',
    bg: 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30',
  },
  other: {
    label: 'Outros',
    icon: Sparkles,
    color: '#94a3b8',
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
  },
};

export const InvestmentManager: React.FC<InvestmentManagerProps> = ({
  investments,
  contributions,
  totalInvested,
  totalTargetInvested,
  monthInvestedNet,
  selectedMonthName,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddContribution,
  onDeleteContribution,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<InvestmentGoal | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoalForAction, setSelectedGoalForAction] = useState<InvestmentGoal | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');

  // Form states for Goal
  const [goalName, setGoalName] = useState('');
  const [goalCategory, setGoalCategory] = useState<InvestmentCategory>('emergency');
  const [goalInstitution, setGoalInstitution] = useState('');
  const [goalTargetStr, setGoalTargetStr] = useState('');
  const [goalCurrentStr, setGoalCurrentStr] = useState('');
  const [goalMonthlyStr, setGoalMonthlyStr] = useState('');
  const [goalReturnStr, setGoalReturnStr] = useState('10.75');
  const [goalNotes, setGoalNotes] = useState('');
  const [goalFormError, setGoalFormError] = useState<string | null>(null);

  // Form states for Deposit/Withdraw
  const [actionAmountStr, setActionAmountStr] = useState('');
  const [actionDate, setActionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [actionNotes, setActionNotes] = useState('');
  const [createTxRecord, setCreateTxRecord] = useState(true);
  const [actionFormError, setActionFormError] = useState<string | null>(null);

  // Overall calculations
  const overallProgressPercent =
    totalTargetInvested > 0 ? (totalInvested / totalTargetInvested) * 100 : 0;

  // Estimated monthly interest yield across portfolio (weighted or average around ~10.5% a.a.)
  const averageAnnualReturn = 10.65;
  const estimatedMonthlyYield = totalInvested * (Math.pow(1 + averageAnnualReturn / 100, 1 / 12) - 1);

  // Filtered goals
  const filteredGoals = investments.filter((g) => {
    if (selectedCategoryFilter === 'all') return true;
    return g.category === selectedCategoryFilter;
  });

  // Open Add Goal
  const handleOpenAddGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalCategory('emergency');
    setGoalInstitution('');
    setGoalTargetStr('');
    setGoalCurrentStr('');
    setGoalMonthlyStr('');
    setGoalReturnStr('10.75');
    setGoalNotes('');
    setGoalFormError(null);
    setIsGoalModalOpen(true);
  };

  // Open Edit Goal
  const handleOpenEditGoal = (goal: InvestmentGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalCategory(goal.category);
    setGoalInstitution(goal.institution || '');
    setGoalTargetStr(goal.targetAmount.toString());
    setGoalCurrentStr(goal.currentAmount.toString());
    setGoalMonthlyStr(goal.monthlyContribution ? goal.monthlyContribution.toString() : '');
    setGoalReturnStr(goal.expectedReturnAnnual ? goal.expectedReturnAnnual.toString() : '10.75');
    setGoalNotes(goal.notes || '');
    setGoalFormError(null);
    setIsGoalModalOpen(true);
  };

  // Save Goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseFloat(goalTargetStr.replace(',', '.'));
    const currentAmount = parseFloat(goalCurrentStr.replace(',', '.')) || 0;
    const monthlyContribution = parseFloat(goalMonthlyStr.replace(',', '.')) || undefined;
    const expectedReturnAnnual = parseFloat(goalReturnStr.replace(',', '.')) || undefined;

    if (!goalName.trim()) {
      setGoalFormError('Por favor, informe o nome da meta ou investimento.');
      return;
    }

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setGoalFormError('Informe um valor de meta válido maior que zero.');
      return;
    }

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, {
        name: goalName.trim(),
        category: goalCategory,
        institution: goalInstitution.trim() || undefined,
        targetAmount,
        currentAmount,
        monthlyContribution,
        expectedReturnAnnual,
        notes: goalNotes.trim() || undefined,
      });
    } else {
      onAddGoal({
        name: goalName.trim(),
        category: goalCategory,
        institution: goalInstitution.trim() || undefined,
        targetAmount,
        currentAmount,
        monthlyContribution,
        expectedReturnAnnual,
        notes: goalNotes.trim() || undefined,
      });
    }

    setIsGoalModalOpen(false);
  };

  // Open Quick Action (Deposit or Withdraw)
  const handleOpenAction = (goal: InvestmentGoal, type: 'deposit' | 'withdraw') => {
    setSelectedGoalForAction(goal);
    setActionType(type);
    setActionAmountStr('');
    setActionNotes(type === 'deposit' ? `Aporte para ${goal.name}` : `Resgate de ${goal.name}`);
    setActionDate(new Date().toISOString().split('T')[0]);
    setCreateTxRecord(true);
    setActionFormError(null);
    setIsDepositModalOpen(true);
  };

  // Save Contribution
  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForAction) return;

    const parsedAmount = parseFloat(actionAmountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setActionFormError('Informe um valor monetário válido maior que zero.');
      return;
    }

    if (actionType === 'withdraw' && parsedAmount > selectedGoalForAction.currentAmount) {
      setActionFormError(
        `O valor do resgate não pode exceder o saldo acumulado atual (${formatCurrency(
          selectedGoalForAction.currentAmount
        )}).`
      );
      return;
    }

    onAddContribution({
      goalId: selectedGoalForAction.id,
      type: actionType,
      amount: parsedAmount,
      date: actionDate,
      notes: actionNotes.trim() || undefined,
      createTransactionRecord: createTxRecord,
    });

    setIsDepositModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-[#121927] p-4 sm:p-5 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PiggyBank className="w-4 sm:w-5 h-4 sm:h-5" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Investimentos & Guardar Dinheiro
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Organize suas reservas, caixinhas e aplicações financeiras para construir seu patrimônio
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          {investments.length > 0 && (
            <button
              onClick={() => handleOpenAction(investments[0], 'deposit')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-500/30 rounded-xl transition-colors shadow-sm whitespace-nowrap"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>+ Guardar</span>
            </button>
          )}

          <button
            onClick={handleOpenAddGoal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Meta</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Guardado */}
        <div className="bg-[#121927] p-4.5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Patrimônio Guardado</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <PiggyBank className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {formatCurrency(totalInvested)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Meta Total:</span>
            <span className="font-mono tabular-nums text-slate-300">
              {formatCurrency(totalTargetInvested)}
            </span>
          </div>
        </div>

        {/* Card 2: Aportado neste Mês */}
        <div className="bg-[#121927] p-4.5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Aporte Líquido ({selectedMonthName.split(' ')[0]})
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {monthInvestedNet >= 0 ? '+' : ''} {formatCurrency(monthInvestedNet)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Movimentações no mês:</span>
            <span className="font-mono tabular-nums text-slate-300">
              {contributions.filter((c) => c.date.startsWith(selectedMonthName)).length || contributions.length} lançamentos
            </span>
          </div>
        </div>

        {/* Card 3: Progresso Geral */}
        <div className="bg-[#121927] p-4.5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Conclusão das Metas</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {formatPercent(overallProgressPercent)}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, overallProgressPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Rendimento Estimado */}
        <div className="bg-[#121927] p-4.5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Rendimento Estimado</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-300">
            ~{formatCurrency(estimatedMonthlyYield)}
            <span className="text-xs font-normal text-slate-400 ml-1">/mês</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Base 100% CDI:</span>
            <span className="text-slate-300">~10,75% a.a.</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
            selectedCategoryFilter === 'all'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
              : 'bg-[#121927] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          Todas as Metas ({investments.length})
        </button>

        {Object.entries(CATEGORY_MAP).map(([catKey, catMeta]) => {
          const count = investments.filter((g) => g.category === catKey).length;
          if (count === 0 && selectedCategoryFilter !== catKey) return null;
          const Icon = catMeta.icon;

          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategoryFilter(catKey)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                selectedCategoryFilter === catKey
                  ? 'bg-slate-800 text-white border-slate-600 shadow-xs'
                  : 'bg-[#121927] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{catMeta.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800/80 text-slate-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.map((goal) => {
          const catMeta = CATEGORY_MAP[goal.category] || CATEGORY_MAP.other;
          const Icon = catMeta.icon;
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="bg-[#121927] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-sm"
            >
              <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: '#0F172A',
                        borderColor: `${catMeta.color}40`,
                        color: catMeta.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {goal.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span>{goal.institution || 'Aplicação'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditGoal(goal)}
                      title="Editar meta"
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir a meta "${goal.name}"?`)) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      title="Excluir meta"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Badge Category */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${catMeta.bg}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{catMeta.label}</span>
                  </span>

                  {goal.expectedReturnAnnual && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                      ~{goal.expectedReturnAnnual}% a.a.
                    </span>
                  )}
                </div>

                {/* Values display */}
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Saldo Acumulado
                  </span>
                  <div className="flex items-baseline justify-between gap-2 mt-0.5">
                    <span className="text-xl font-bold font-mono tabular-nums text-white">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      de {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                    <span className="text-emerald-400 font-semibold">{formatPercent(progress)}</span>
                    <span className="text-slate-400">Falta: {formatCurrency(remaining)}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: catMeta.color,
                        width: `${Math.min(100, progress)}%`,
                      }}
                    />
                  </div>
                </div>

                {goal.monthlyContribution && (
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Planejado por mês:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-200">
                      {formatCurrency(goal.monthlyContribution)}/mês
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Guardar Dinheiro & Resgatar */}
              <div className="pt-4 mt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleOpenAction(goal, 'deposit')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 rounded-xl transition-all shadow-xs"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Guardar</span>
                </button>

                <button
                  onClick={() => handleOpenAction(goal, 'withdraw')}
                  disabled={goal.currentAmount <= 0}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resgatar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGoals.length === 0 && (
        <div className="bg-[#121927] border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Nenhum investimento cadastrado nesta categoria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Comece criando sua Reserva de Emergência, Caixinha do Nubank/Inter ou uma meta para guardar dinheiro.
          </p>
          <button
            onClick={handleOpenAddGoal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Criar Primeira Meta</span>
          </button>
        </div>
      )}

      {/* Recent Movements / Contributions Ledger */}
      <div className="bg-[#121927] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Histórico de Aportes & Resgates</h3>
            <p className="text-xs text-slate-400">
              Registro das movimentações de dinheiro guardado
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {contributions.length} movimentações registradas
          </span>
        </div>

        {contributions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhum aporte ou resgate registrado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Meta / Destino</th>
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-4">Anotações</th>
                  <th className="py-2.5 px-4 text-right">Valor</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contributions.map((c) => {
                  const targetGoal = investments.find((g) => g.id === c.goalId);
                  const isDeposit = c.type === 'deposit';

                  return (
                    <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isDeposit
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isDeposit ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Aporte (Guardou)</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Resgate</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-white">
                        {targetGoal ? targetGoal.name : 'Meta Deletada'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-400">
                        {formatDateBR(c.date)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{c.notes || '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">
                        <span className={isDeposit ? 'text-emerald-400' : 'text-amber-400'}>
                          {isDeposit ? '+' : '-'} {formatCurrency(c.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir este registro de aporte/resgate?')) {
                              onDeleteContribution(c.id);
                            }
                          }}
                          title="Excluir movimentação"
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Nova Meta / Editar Meta */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121927] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A]">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingGoal ? 'Editar Meta / Investimento' : 'Nova Meta para Guardar Dinheiro'}
                </h3>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-4 sm:p-5 space-y-4">
              {goalFormError && (
                <div className="p-3 text-xs bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl">
                  {goalFormError}
                </div>
              )}

              {/* Goal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Meta / Aplicação *
                </label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Ex: Reserva de Emergência, Viagem Disney, Tesouro Selic..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Category & Institution */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as InvestmentCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="emergency">Reserva de Emergência</option>
                    <option value="cdb_fixed">Renda Fixa / CDB / Tesouro</option>
                    <option value="caixinha">Caixinha / Poupança</option>
                    <option value="stocks">Ações / FIIs</option>
                    <option value="goals">Sonhos & Metas (Viagem, Carro)</option>
                    <option value="crypto">Criptoativos</option>
                    <option value="other">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Instituição / Banco
                  </label>
                  <input
                    type="text"
                    value={goalInstitution}
                    onChange={(e) => setGoalInstitution(e.target.value)}
                    placeholder="Ex: Nubank, Inter, XP, Itaú..."
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Target & Current Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meta Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={goalTargetStr}
                    onChange={(e) => setGoalTargetStr(e.target.value)}
                    placeholder="Ex: 20000,00"
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Saldo Já Guardado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={goalCurrentStr}
                    onChange={(e) => setGoalCurrentStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Monthly contribution & Return */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aporte Mensal Pretendido
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={goalMonthlyStr}
                    onChange={(e) => setGoalMonthlyStr(e.target.value)}
                    placeholder="Ex: 500,00"
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rendimento Anual (% a.a.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={goalReturnStr}
                    onChange={(e) => setGoalReturnStr(e.target.value)}
                    placeholder="Ex: 10.75"
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Objetivo
                </label>
                <textarea
                  rows={2}
                  value={goalNotes}
                  onChange={(e) => setGoalNotes(e.target.value)}
                  placeholder="Ex: Liquidez diária imediata para segurança..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingGoal ? 'Atualizar Meta' : 'Salvar Meta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Guardar Dinheiro (Aporte) / Resgatar */}
      {isDepositModalOpen && selectedGoalForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121927] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A]">
              <div className="flex items-center gap-2">
                {actionType === 'deposit' ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {actionType === 'deposit' ? 'Guardar Dinheiro (Aporte)' : 'Resgatar Valor'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Meta: <span className="text-white font-semibold">{selectedGoalForAction.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="p-4 sm:p-5 space-y-4">
              {actionFormError && (
                <div className="p-3 text-xs bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl">
                  {actionFormError}
                </div>
              )}

              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionType('deposit')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    actionType === 'deposit'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Guardar (Aportar)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('withdraw')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    actionType === 'withdraw'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Resgatar (Retirar)</span>
                </button>
              </div>

              {/* Goal Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Selecione a Meta / Aplicação
                </label>
                <select
                  value={selectedGoalForAction.id}
                  onChange={(e) => {
                    const target = investments.find((g) => g.id === e.target.value);
                    if (target) setSelectedGoalForAction(target);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  {investments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Saldo atual: {formatCurrency(g.currentAmount)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={actionAmountStr}
                      onChange={(e) => setActionAmountStr(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data da Operação *
                  </label>
                  <input
                    type="date"
                    required
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição / Motivo
                </label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Ex: Sobra do salário, comissão de vendas..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Checkbox: Also register in monthly transactions ledger */}
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createTxRecord}
                    onChange={(e) => setCreateTxRecord(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>
                    {actionType === 'deposit'
                      ? 'Lançar como saída/despesa no mês para abater do saldo'
                      : 'Lançar como entrada no mês do resgate'}
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  {actionType === 'deposit'
                    ? 'Útil para refletir o dinheiro guardado saindo da sua conta corrente.'
                    : 'Útil para refletir o dinheiro resgatado entrando na sua conta corrente.'}
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors shadow-sm flex items-center gap-1.5 ${
                    actionType === 'deposit'
                      ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {actionType === 'deposit' ? 'Confirmar Aporte' : 'Confirmar Resgate'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
