'use client';

import React, { Suspense } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { ToastProvider, useToast } from '@/lib/contexts/ToastContext';
import NavigationSkeleton from './NavigationSkeleton';

function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] pointer-events-none flex flex-col gap-2.5 max-h-[90vh] overflow-y-auto no-scrollbar"
    >
      {toasts.map((t) => {
        let bg = 'bg-white border-neutral-200 text-neutral-900 shadow-xl';
        let icon = <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;

        if (t.type === 'success') {
          bg = 'bg-emerald-950/95 text-white border-emerald-800 shadow-emerald-950/30';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
        } else if (t.type === 'error') {
          bg = 'bg-rose-950/95 text-white border-rose-800 shadow-rose-950/30';
          icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
        } else if (t.type === 'warning') {
          bg = 'bg-amber-950/95 text-white border-amber-800 shadow-amber-950/30';
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
        } else {
          bg = 'bg-neutral-900/95 text-white border-neutral-800 shadow-black/40';
          icon = <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto border rounded-xl p-3.5 px-4 backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start justify-between gap-3 text-xs shadow-lg animate-in slide-in-from-top-3 ${bg}`}
          >
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              {icon}
              <div className="space-y-0.5 min-w-0 flex-1">
                {t.title && <div className="font-bold tracking-tight text-xs">{t.title}</div>}
                <div className="leading-relaxed opacity-90 break-words font-medium">{t.message}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="opacity-70 hover:opacity-100 p-1 -mr-1 rounded text-xs font-bold transition hover:bg-white/10 shrink-0"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConfirmModal() {
  const { confirmDialog, confirmLoading, handleConfirmAction, handleCancelAction } = useToast();

  if (!confirmDialog) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              confirmDialog.danger ? 'bg-rose-100 text-rose-600' : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {confirmDialog.danger ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="font-bold text-sm text-neutral-950">{confirmDialog.title}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{confirmDialog.message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleCancelAction}
            disabled={confirmLoading}
            className="px-4 py-2 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition active:scale-95"
          >
            {confirmDialog.cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={confirmLoading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50 ${
              confirmDialog.danger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-neutral-950 hover:bg-neutral-800'
            }`}
          >
            {confirmLoading ? 'Processing...' : confirmDialog.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <NavigationSkeleton />
      </Suspense>
      {children}
      <ToastContainer />
      <ConfirmModal />
    </ToastProvider>
  );
}

// Re-export hook and types for convenience/compatibility
export { useToast } from '@/lib/contexts/ToastContext';
export type { ToastType, ToastItem, ConfirmDialogOptions } from '@/lib/contexts/ToastContext';
