import React, { useState } from 'react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import {
  ShieldCheck,
  Smartphone,
  Monitor,
  CheckCircle2,
  RefreshCw,
  LogOut,
  AlertTriangle,
  X,
  Lock,
  Cloud,
  ArrowRight,
  Database,
} from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloudActive: boolean;
  isSyncing: boolean;
  onForceSyncToCloud?: () => Promise<void>;
  transactionCount: number;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  isCloudActive,
  isSyncing,
  onForceSyncToCloud,
  transactionCount,
}) => {
  const { user, isAdmin, loading, error, signInWithGoogle, logout } = useAuth();
  const [syncingLocal, setSyncingLocal] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    if (!onForceSyncToCloud) return;
    try {
      setSyncingLocal(true);
      setSyncFeedback(null);
      await onForceSyncToCloud();
      setSyncFeedback('Dados sincronizados com sucesso na nuvem!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err) {
      setSyncFeedback('Erro ao sincronizar. Verifique a conexão.');
    } finally {
      setSyncingLocal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Acesso Admin & Sincronização em Nuvem</span>
              </h3>
              <p className="text-xs text-slate-400">
                Banco de dados Firestore compartilhado em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {syncFeedback && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* User Status Card */}
          {user ? (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {user.displayName || 'Administrador'}
                      </span>
                      {isAdmin ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                          CONECTADO
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                  title="Desconectar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sincronização em Tempo Real Ativa</span>
                </div>
                <span className="text-slate-400 font-mono">
                  {transactionCount} lançamentos na nuvem
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-slate-950 to-[#121927] rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Modo Consulta (Leitura ao Vivo)
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    Você já está visualizando todos os dados reais e atualizados do banco de dados na nuvem. Para adicionar, alterar ou excluir qualquer lançamento, entre com sua conta de Administrador.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Entrar com Google ({ADMIN_EMAIL})</span>
                </button>
              </div>
            </div>
          )}

          {/* How real-time sync works */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2.5">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Como funciona a sincronização entre Celular e Computador:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">No Celular</span>
                  <span className="text-[11px] text-slate-400">
                    Ao lançar um Pix ou compra no cartão na rua, o dado é salvo direto no Firestore.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-start gap-2">
                <Monitor className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">No Computador</span>
                  <span className="text-[11px] text-slate-400">
                    O painel recebe a atualização instantaneamente em tempo real, sem precisar recarregar.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync actions */}
          {user && (
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSyncNow}
                disabled={syncingLocal || isSyncing}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <RefreshCw
                  className={`w-4 h-4 text-emerald-400 ${
                    syncingLocal || isSyncing ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {syncingLocal || isSyncing
                    ? 'Sincronizando com o banco...'
                    : 'Forçar Atualização na Nuvem Agora'}
                </span>
              </button>
            </div>
          )}

          {/* Admin badge hint */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
            <span>E-mail de Administrador Registrado:</span>
            <span className="font-mono text-emerald-400 font-medium">
              {ADMIN_EMAIL}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
