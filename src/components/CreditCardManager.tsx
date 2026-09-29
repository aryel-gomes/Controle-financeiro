import React, { useState } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { CreditCard, Transaction } from '../types/finance';
import { formatCurrency, formatPercent, formatDateBR } from '../utils/formatters';

interface CreditCardManagerProps {
  creditCards: CreditCard[];
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  onUpdateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  onDeleteCreditCard: (id: string) => void;
  selectedMonthName: string;
}

const CARD_COLOR_PRESETS = [
  { name: 'Roxo Nubank', value: '#820ad1' },
  { name: 'Laranja Inter', value: '#ff7a00' },
  { name: 'Azul Itaú / Caixa', value: '#004990' },
  { name: 'Vermelho Santander / Bradesco', value: '#cc092f' },
  { name: 'Preto Carbon / Black', value: '#1e293b' },
  { name: 'Dourado Gold', value: '#d97706' },
  { name: 'Esmeralda', value: '#059669' },
  { name: 'Cinza Titânio', value: '#475569' },
];

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  creditCards,
  transactions,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddCreditCard,
  onUpdateCreditCard,
  onDeleteCreditCard,
  selectedMonthName,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards[0]?.id || '');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Form states for new/editing card
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [closingDay, setClosingDay] = useState(24);
  const [dueDay, setDueDay] = useState(3);
  const [color, setColor] = useState('#820ad1');
  const [formError, setFormError] = useState<string | null>(null);

  const cardTransactions = transactions.filter(
    (tx) => tx.type === 'expense' && (tx.category === 'credit_card' || tx.paymentMethod === 'credit_card')
  );

  const handleOpenAddCard = () => {
    setEditingCard(null);
    setName('');
    setBank('');
    setLimitStr('');
    setClosingDay(20);
    setDueDay(28);
    setColor('#1e293b');
    setFormError(null);
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (card: CreditCard, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(card);
    setName(card.name);
    setBank(card.bank || '');
    setLimitStr(card.limit.toString());
    setClosingDay(card.closingDay);
    setDueDay(card.dueDay);
    setColor(card.color || '#1e293b');
    setFormError(null);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitStr.replace(',', '.'));

    if (!name.trim()) {
      setFormError('Por favor, informe o nome do cartão.');
      return;
    }

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setFormError('Informe um limite válido maior que zero.');
      return;
    }

    if (editingCard) {
      onUpdateCreditCard(editingCard.id, {
        name: name.trim(),
        bank: bank.trim() || undefined,
        limit: parsedLimit,
        closingDay,
        dueDay,
        color,
      });
    } else {
      onAddCreditCard({
        name: name.trim(),
        bank: bank.trim() || undefined,
        limit: parsedLimit,
        closingDay,
        dueDay,
        color,
      });
    }

    setIsCardModalOpen(false);
  };

  const handleDeleteCard = (card: CreditCard, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Deseja realmente excluir o cartão "${card.name}"?\n(As transações já registradas serão mantidas no histórico).`
      )
    ) {
      onDeleteCreditCard(card.id);
      if (selectedCardId === card.id) {
        const remaining = creditCards.filter((c) => c.id !== card.id);
        setSelectedCardId(remaining[0]?.id || '');
      }
    }
  };

  const selectedCard = creditCards.find((c) => c.id === selectedCardId) || creditCards[0];

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121927] p-5 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white">
            Lista dos seus Cartões de Crédito ({selectedMonthName})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre qualquer cartão (Itaú, Bradesco, Santander, C6, Nubank, etc.), acompanhe limites e faturas
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenAddCard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>+ Cadastrar Novo Cartão</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Compra no Cartão</span>
          </button>
        </div>
      </div>

      {/* Credit Cards Grid or Empty State */}
      {creditCards.length === 0 ? (
        <div className="bg-[#121927] border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center">
            <CardIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Nenhum cartão cadastrado ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cadastre seus cartões de crédito (Itaú, Santander, Nubank, Inter, Bradesco, C6, etc.) para acompanhar limites, faturas e compras parceladas.
          </p>
          <button
            onClick={handleOpenAddCard}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Primeiro Cartão</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditCards.map((card) => {
            const txsOnCard = cardTransactions.filter(
              (tx) => tx.cardName === card.name || (!tx.cardName && card.id === creditCards[0]?.id)
            );
            const currentInvoice = txsOnCard.reduce((acc, curr) => acc + curr.amount, 0);
            const availableLimit = Math.max(0, card.limit - currentInvoice);
            const usedPercent = card.limit > 0 ? (currentInvoice / card.limit) * 100 : 0;
            const isOverCardLimit = usedPercent >= 100;
            const isWarning = usedPercent >= 80;

            const isSelected = selectedCardId === card.id;

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`rounded-2xl p-5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-500 shadow-md ring-1 ring-purple-500 bg-[#151D2E]'
                    : 'border-slate-800 bg-[#121927] hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Card Bar with Edit/Delete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: card.color || '#7c3aed' }}
                      >
                        <CardIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{card.name}</h4>
                        <span className="text-[11px] text-slate-400">{card.bank || 'Cartão'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditCard(card, e)}
                        title="Editar dados do cartão"
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {creditCards.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteCard(card, e)}
                          title="Excluir este cartão"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Invoice Amount */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">
                        Fatura Atual
                      </span>
                      <div className="text-lg font-bold font-mono tabular-nums text-white">
                        {formatCurrency(currentInvoice)}
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      Limite: {formatCurrency(card.limit)}
                    </span>
                  </div>

                  {/* Progress bar of Card limit */}
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverCardLimit
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-400'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, usedPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice dates & Available limit */}
                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">
                      Disponível
                    </span>
                    <span className="font-mono tabular-nums font-bold text-emerald-400 text-xs">
                      {formatCurrency(availableLimit)}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">
                      Fecha dia
                    </span>
                    <span className="font-mono tabular-nums font-bold text-white text-xs">
                      {card.closingDay}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">
                      Vence dia
                    </span>
                    <span className="font-mono tabular-nums font-bold text-white text-xs">
                      {card.dueDay}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Card Purchases List */}
      <div className="bg-[#121927] rounded-2xl border border-slate-800/80 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              Compras na Fatura de {selectedCard?.name || 'Cartão Selecionado'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lançamentos computados neste cartão no mês de {selectedMonthName}
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/60">
            {
              cardTransactions.filter(
                (tx) =>
                  tx.cardName === selectedCard?.name ||
                  (!tx.cardName && selectedCard?.id === creditCards[0]?.id)
              ).length
            }{' '}
            compras
          </span>
        </div>

        <div className="mt-3 divide-y divide-slate-800/60">
          {cardTransactions
            .filter(
              (tx) =>
                tx.cardName === selectedCard?.name ||
                (!tx.cardName && selectedCard?.id === creditCards[0]?.id)
            )
            .map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between hover:bg-slate-900/60 px-2 rounded-xl transition-colors group"
              >
                <div
                  onClick={() => onEditTransaction(tx)}
                  className="space-y-0.5 cursor-pointer flex-1"
                >
                  <div className="text-xs font-medium text-white flex items-center gap-2">
                    <span>{tx.description}</span>
                    {tx.totalInstallments && tx.totalInstallments > 1 && (
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/60 px-1 rounded">
                        Parcela {tx.currentInstallment || 1}/{tx.totalInstallments}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{formatDateBR(tx.date)}</span>
                    {tx.subCategory && (
                      <>
                        <span>·</span>
                        <span>{tx.subCategory}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono tabular-nums font-bold text-white text-xs">
                      {formatCurrency(tx.amount)}
                    </span>
                    <div className="text-[11px] flex items-center justify-end gap-1 text-slate-400">
                      {tx.isPaid ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Fatura paga
                        </span>
                      ) : (
                        <span className="text-amber-400">Aberta na fatura</span>
                      )}
                    </div>
                  </div>

                  {/* Quick delete button */}
                  <button
                    onClick={() => {
                      if (confirm(`Excluir compra "${tx.description}"?`)) {
                        onDeleteTransaction(tx.id);
                      }
                    }}
                    title="Excluir compra"
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 opacity-70 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modal to Add/Edit Credit Card */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 text-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <CardIcon className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingCard ? 'Editar Cartão de Crédito' : 'Cadastrar Novo Cartão'}
                </h3>
              </div>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 font-medium">
                  {formError}
                </div>
              )}

              {/* Card Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cartão *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Itaú Click, Santander SX, C6 Carbon, XP..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Banco / Emissor
                </label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="Ex: Itaú, Santander, C6 Bank, Bradesco, XP..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>

              {/* Limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Limite Total do Cartão (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="50"
                    required
                    value={limitStr}
                    onChange={(e) => setLimitStr(e.target.value)}
                    placeholder="5.000,00"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tabular-nums bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Closing and Due days */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Dia de Fechamento (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={closingDay}
                    onChange={(e) => setClosingDay(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Dia de Vencimento (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              {/* Card Color Preset */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cor do Cartão
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {CARD_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                        color === preset.value
                          ? 'ring-2 ring-white scale-110 border-white'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    >
                      {color === preset.value && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCard ? 'Salvar Cartão' : 'Cadastrar Cartão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
