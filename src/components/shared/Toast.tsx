import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CircleCheck, X } from 'lucide-react';

interface ToastContextValue {
  /** Mostra uma confirmação que agradece de verdade, ex.: "Valeu, Alex! Mais 4 horas geradas…". */
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ text: string; key: number } | null>(null);
  const show = useCallback((text: string) => setMessage({ text, key: Date.now() }), []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6"
      >
        {message && (
          <div
            key={message.key}
            className="pointer-events-auto flex max-w-md items-start gap-3 rounded-lg bg-brand-deep px-4 py-3 text-on-brand-deep shadow-raised"
          >
            <CircleCheck size={20} aria-hidden className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm font-semibold">{message.text}</p>
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Fechar aviso"
              className="-m-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}
