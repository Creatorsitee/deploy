'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    custom: (item: Omit<ToastItem, 'id'>) => void;
    dismiss: (id: string) => void;
  };
  confirmModal: (options: ConfirmDialogOptions) => void;
  toasts: ToastItem[];
  confirmDialog: ConfirmDialogOptions | null;
  confirmLoading: boolean;
  dismiss: (id: string) => void;
  handleConfirmAction: () => Promise<void>;
  handleCancelAction: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: {
        success: (msg: string) => console.log('[Success]', msg),
        error: (msg: string) => console.error('[Error]', msg),
        warning: (msg: string) => console.warn('[Warning]', msg),
        info: (msg: string) => console.info('[Info]', msg),
        custom: () => {},
        dismiss: () => {},
      },
      confirmModal: (opts: ConfirmDialogOptions) => {
        opts.onConfirm();
      },
      toasts: [],
      confirmDialog: null,
      confirmLoading: false,
      dismiss: () => {},
      handleConfirmAction: async () => {},
      handleCancelAction: () => {},
    };
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4500) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toastMethods = {
    success: (message: string, title?: string, duration?: number) =>
      addToast('success', message, title, duration),
    error: (message: string, title?: string, duration?: number) =>
      addToast('error', message, title, duration),
    warning: (message: string, title?: string, duration?: number) =>
      addToast('warning', message, title, duration),
    info: (message: string, title?: string, duration?: number) =>
      addToast('info', message, title, duration),
    custom: (item: Omit<ToastItem, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { ...item, id }]);
      if (item.duration && item.duration > 0) {
        setTimeout(() => dismiss(id), item.duration);
      }
    },
    dismiss,
  };

  const openConfirmModal = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    try {
      setConfirmLoading(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (err: any) {
      toastMethods.error(err?.message || 'Operation failed');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (confirmDialog?.onCancel) {
      confirmDialog.onCancel();
    }
    setConfirmDialog(null);
  };

  return (
    <ToastContext.Provider
      value={{
        toast: toastMethods,
        confirmModal: openConfirmModal,
        toasts,
        confirmDialog,
        confirmLoading,
        dismiss,
        handleConfirmAction,
        handleCancelAction,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}
