import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />,
  error: <XCircle className="w-5 h-5 text-[var(--color-error)]" />,
  warning: <AlertCircle className="w-5 h-5 text-[var(--color-warning)]" />,
  info: <Info className="w-5 h-5 text-[var(--color-info)]" />,
};

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[280px] max-w-sm transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } bg-[var(--color-bg-card)] border-[var(--color-border-primary)]`}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{message}</p>
      <button onClick={onClose} className="p-1 rounded hover:opacity-60 transition-opacity text-[var(--color-text-tertiary)]">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
