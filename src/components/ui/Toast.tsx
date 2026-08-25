import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-lg animate-slide-up ${
              t.type === 'success'
                ? 'bg-success-500/10 border-success-500/30'
                : t.type === 'error'
                ? 'bg-danger-500/10 border-danger-500/30'
                : 'bg-ink-700/90 border-ink-600'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-ink-100 flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
