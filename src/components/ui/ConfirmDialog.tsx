import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) return null;

  const confirmClass =
    variant === 'danger'
      ? 'bg-[var(--color-error)] hover:opacity-90 text-white'
      : 'bg-[var(--color-warning)] hover:opacity-90 text-white';

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--color-overlay)]" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-6 animate-fade-in">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          variant === 'danger' ? 'bg-[var(--color-error)]/10' : 'bg-[var(--color-warning)]/10'
        }`}>
          <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-[var(--color-error)]' : 'text-[var(--color-warning)]'}`} />
        </div>
        <h3 className="text-h4 text-[var(--color-text-primary)] mb-2">{title}</h3>
        <p className="text-body-md text-[var(--color-text-secondary)] mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${confirmClass} disabled:opacity-60`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
