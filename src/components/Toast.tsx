import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/utils';

type ToastVariant = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = ++counter;
      setToasts((t) => [...t, { id, variant, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const cfg = {
            success: { wrap: 'border-emerald-200', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
            error: { wrap: 'border-red-200', icon: <XCircle size={18} className="text-red-500" /> },
            info: { wrap: 'border-brand-200', icon: <Info size={18} className="text-brand-500" /> },
          }[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-2.5 rounded-lg border bg-white px-4 py-3 shadow-cardHover animate-fade-in',
                cfg.wrap,
              )}
            >
              <span className="mt-0.5">{cfg.icon}</span>
              <p className="flex-1 text-sm text-ink-700">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-ink-400 hover:text-ink-600">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
