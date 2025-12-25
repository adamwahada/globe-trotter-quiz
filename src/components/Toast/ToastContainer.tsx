import React from 'react';
import { useToastContext, ToastType } from '@/contexts/ToastContext';
import { X, CheckCircle, AlertCircle, Info, Trophy } from 'lucide-react';

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-success border-success/50';
    case 'error':
      return 'bg-destructive border-destructive/50';
    case 'game':
      return 'bg-info border-info/50';
    case 'info':
    default:
      return 'bg-secondary border-border';
  }
};

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5" />;
    case 'error':
      return <AlertCircle className="h-5 w-5" />;
    case 'game':
      return <Trophy className="h-5 w-5" />;
    case 'info':
    default:
      return <Info className="h-5 w-5" />;
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`
            toast-enter flex items-center gap-3 p-4 rounded-lg border shadow-lg
            text-foreground ${getToastStyles(toast.type)}
            pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity
          `}
          style={{ animationDelay: `${index * 50}ms` }}
          role="alert"
          aria-live="polite"
        >
          {getToastIcon(toast.type)}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            className="text-foreground/70 hover:text-foreground transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};