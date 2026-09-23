import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, MessageCircle, TriangleAlert, X } from 'lucide-react';

type Tone = 'success' | 'info' | 'whatsapp' | 'warning';
interface Toast { id: number; title: string; body?: string; tone: Tone }

const ToastCtx = createContext<(title: string, opts?: { body?: string; tone?: Tone }) => void>(() => {});

const icons = { success: CheckCircle2, info: Info, whatsapp: MessageCircle, warning: TriangleAlert };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const push = useCallback((title: string, opts: { body?: string; tone?: Tone } = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, title, body: opts.body, tone: opts.tone ?? 'success' }]);
    setTimeout(() => dismiss(id), 4200);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div key={t.id} className={`toast toast--${t.tone}`}>
              <Icon size={18} className="toast__icon" />
              <div className="toast__text">
                <strong>{t.title}</strong>
                {t.body && <span>{t.body}</span>}
              </div>
              <button className="icon-btn icon-btn--sm" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
