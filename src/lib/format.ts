/**
 * The demo runs on a fixed business date so the mock data always reads
 * consistently (overdue stays overdue, "today" always has sales).
 */
export const TODAY = '2026-09-23';

const DAY = 86_400_000;

export function toDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  return toISO(new Date(toDate(iso).getTime() + n * DAY));
}

export function addMonths(iso: string, n: number): string {
  const d = toDate(iso);
  d.setUTCMonth(d.getUTCMonth() + n);
  return toISO(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((toDate(a).getTime() - toDate(b).getTime()) / DAY);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtDateLong(iso?: string): string {
  if (!iso) return '—';
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtMonthYear(iso: string): string {
  const d = toDate(iso);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtShort(iso: string): string {
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function fmtDayLabel(iso: string): string {
  const d = toDate(iso);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function monthLabel(iso: string): string {
  const d = toDate(iso);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

export function relativeDay(iso: string): string {
  const n = diffDays(iso, TODAY);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${Math.abs(n)} days ago`;
  return `In ${n} days`;
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return 'Just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function inr(n: number): string {
  return `₹${inrFmt.format(Math.round(n))}`;
}

export function inrCompact(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

export function num(n: number): string {
  return inrFmt.format(n);
}

export function rx(n: number, signed = true): string {
  if (!signed) return String(n);
  if (n === 0) return '0.00';
  return `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function firstName(name: string): string {
  return name.split(' ')[0];
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => vars[k] ?? m);
}
