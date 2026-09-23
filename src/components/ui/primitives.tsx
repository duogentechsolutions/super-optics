import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { initials } from '../../lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; icon?: ReactNode }) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
      {icon}
      {children && <span>{children}</span>}
    </button>
  );
}

export type Tone = 'navy' | 'blue' | 'green' | 'amber' | 'red' | 'grey' | 'violet';

export function Badge({ tone = 'grey', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <i className="badge__dot" />}
      {children}
    </span>
  );
}

export function Card({ children, className = '', pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={`card ${pad ? 'card--pad' : ''} ${className}`}>{children}</section>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="card__head">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const avatarTints = ['#DCE8F5', '#E3F1EA', '#F6EBD9', '#ECE5F5', '#F4E2E0', '#E0EEF0'];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const tint = avatarTints[name.charCodeAt(0) % avatarTints.length];
  return (
    <span className="avatar" style={{ width: size, height: size, background: tint, fontSize: size * 0.36 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <h4>{title}</h4>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%', r = 8 }: { h?: number; w?: number | string; r?: number }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-rows">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row">
          <Skeleton h={36} w={36} r={18} />
          <div style={{ flex: 1, display: 'grid', gap: 6 }}>
            <Skeleton h={12} w="40%" />
            <Skeleton h={10} w="25%" />
          </div>
          <Skeleton h={22} w={80} r={11} />
        </div>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  counts,
}: {
  tabs: readonly T[] | readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  const items = (tabs as readonly (T | { value: T; label: string })[]).map((t) => (typeof t === 'string' ? { value: t, label: t } : t));
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          className={`tabs__tab ${value === t.value ? 'is-active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {counts?.[t.value] !== undefined && <span className="tabs__count">{counts[t.value]}</span>}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={o} role="radio" aria-checked={o === value} className={o === value ? 'is-active' : ''} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, error, hint, children, full }: { label: string; error?: string; hint?: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={`field ${error ? 'has-error' : ''} ${full ? 'field--full' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input className="input" {...p} />;
export const Select = ({ children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className="input select" {...p}>{children}</select>
);
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>((p, ref) => <textarea ref={ref} className="input textarea" {...p} />);
Textarea.displayName = 'Textarea';

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'is-on' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    >
      <span className="toggle__knob" />
    </button>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="search">
      <Search size={16} className="search__icon" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && (
        <button className="search__clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {sub && <span className="stat__sub">{sub}</span>}
    </div>
  );
}
