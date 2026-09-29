import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Check, FileSpreadsheet } from 'lucide-react';
import { BudgetLimit, CreditCard, Transaction } from '../types/finance';
import { formatDateBR } from '../utils/formatters';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budgetLimits: BudgetLimit[];
  creditCards: CreditCard[];
  onImportData: (data: {
    transactions?: Transaction[];
    budgetLimits?: BudgetLimit[];
    creditCards?: CreditCard[];
  }) => void;
  onResetData: () => void;
  onLoadSampleData?: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  budgetLimits,
  creditCards,
  onImportData,
  onResetData,
  onLoadSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Tipo',
      'Categoria',
      'Subcategoria',
      'Descrição',
      'Valor (R$)',
      'Data',
      'Forma de Pagamento',
      'Cartão',
      'Parcelas',
      'Status',
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.type === 'income' ? 'Entrada' : 'Saída',
      t.category,
      t.subCategory || '',
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      formatDateBR(t.date),
      t.paymentMethod,
      t.cardName || '',
      t.totalInstallments ? `${t.currentInstallment || 1}/${t.totalInstallments}` : '1/1',
      t.isPaid ? 'Pago' : 'Pendente',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `controle_financeiro_relatorio_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMessage('Relatório CSV exportado com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Export to JSON Backup
  const handleExportJSON = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      budgetLimits,
      creditCards,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `controle_financeiro_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setSuccessMessage('Backup JSON exportado com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle JSON File Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions || parsed.budgetLimits || parsed.creditCards) {
          onImportData({
            transactions: parsed.transactions,
            budgetLimits: parsed.budgetLimits,
            creditCards: parsed.creditCards,
          });
          setSuccessMessage('Dados restaurados com sucesso!');
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
          }, 1500);
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch {
        alert('Erro ao ler arquivo JSON. Verifique o formato.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 text-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white">
              Exportação & Backup de Dados
            </h3>
            <p className="text-xs text-slate-400">
              Baixe seus relatórios para planilhas ou faça cópias de segurança
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Option 1: CSV Export */}
          <div className="p-4 border border-slate-800 bg-slate-950/60 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar Planilha Excel / CSV</span>
            </div>
            <p className="text-slate-400">
              Gera um arquivo compatível com Excel e Google Sheets com todas as{' '}
              <strong className="text-slate-200">{transactions.length}</strong> transações registradas.
            </p>
            <button
              onClick={handleExportCSV}
              className="mt-2 w-full py-2 px-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Relatório CSV</span>
            </button>
          </div>

          {/* Option 2: JSON Backup */}
          <div className="p-4 border border-slate-800 bg-slate-950/60 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Download className="w-4 h-4 text-purple-400" />
              <span>Backup Completo (JSON)</span>
            </div>
            <p className="text-slate-400">
              Salva todas as configurações de limites de gastos, cartões e lançamentos.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleExportJSON}
                className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar Backup</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 text-xs font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Reset All Values to Zero */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                if (
                  confirm(
                    'Deseja realmente zerar todos os valores e começar tudo do zero?\n\nIsso removerá todas as transações, cartões, metas e valores para que você comece com o sistema 100% limpo.'
                  )
                ) {
                  onResetData();
                  setSuccessMessage('Todos os valores foram zerados! Comece do zero.');
                  setTimeout(() => {
                    setSuccessMessage(null);
                    onClose();
                  }, 1500);
                }
              }}
              className="w-full py-2.5 px-3 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zerar Tudo e Começar do Zero</span>
            </button>

            {onLoadSampleData && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      'Deseja carregar os dados de demonstração (salários, comissões, faturas e investimentos de teste)?'
                    )
                  ) {
                    onLoadSampleData();
                    setSuccessMessage('Dados de demonstração carregados!');
                    setTimeout(() => {
                      setSuccessMessage(null);
                      onClose();
                    }, 1500);
                  }
                }}
                className="w-full py-1.5 px-3 text-[11px] text-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
              >
                <span>Ou carregar exemplo de demonstração</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
