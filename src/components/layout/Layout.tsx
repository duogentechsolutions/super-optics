import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, BellRing, ChevronDown, Eye, Glasses, Home, Menu, MessageCircle,
  Package, Search, Settings, Users, X, type LucideIcon,
} from 'lucide-react';
import { useStore } from '../../store/AppStore';
import { followUpBucket } from '../../lib/selectors';
import { inr, timeAgo } from '../../lib/format';
import { Avatar } from '../ui/primitives';
import { OrderBadge } from '../ui/badges';

interface NavItem { to: string; label: string; icon: LucideIcon; badge?: number; badgeTone?: 'red' | 'green' }

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--navy)" />
      <circle cx="11" cy="17" r="5.2" fill="none" stroke="#9CC3EE" strokeWidth="2.2" />
      <circle cx="21" cy="17" r="5.2" fill="none" stroke="#fff" strokeWidth="2.2" />
      <path d="M14.6 15.2c.9-.8 1.9-.8 2.8 0" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="brand">
      <BrandMark />
      <div>
        <strong>OptiCare</strong>
        <span>Clear Vision. Stronger Relationships.</span>
      </div>
    </div>
  );
}

function useNav(): NavItem[] {
  const { state } = useStore();
  const overdue = state.followUps.filter((f) => followUpBucket(f) === 'overdue').length;
  const unread = state.conversations.reduce((s, c) => s + c.unread, 0);
  return [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/prescriptions', label: 'Prescriptions', icon: Eye },
    { to: '/orders', label: 'Orders', icon: Package },
    { to: '/follow-ups', label: 'Follow-ups', icon: BellRing, badge: overdue, badgeTone: 'red' },
    { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, badge: unread, badgeTone: 'green' },
    { to: '/products', label: 'Products', icon: Glasses },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ];
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNav();
  return (
    <>
      <div className={`drawer-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden />
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar__top">
          <Brand />
          <button className="icon-btn sidebar__close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="sidebar__nav">
          {nav.map(({ to, label, icon: Icon, badge, badgeTone }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`} onClick={onClose}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {!!badge && <em className={`nav-link__badge nav-link__badge--${badgeTone}`}>{badge}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`} onClick={onClose}>
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </NavLink>
          <div className="demo-chip" data-tip="No backend. Changes are saved in this browser only.">
            <i /> Demo mode
          </div>
        </div>
      </aside>
    </>
  );
}

function GlobalSearch() {
  const { customers, state } = useStore();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return null;
    const digits = t.replace(/\D/g, '');
    return {
      customers: customers.filter((c) => c.name.toLowerCase().includes(t) || c.email.includes(t) || (digits.length > 2 && c.phone.replace(/\D/g, '').includes(digits))).slice(0, 5),
      orders: state.orders.filter((o) => o.id.toLowerCase().includes(t)).slice(0, 3),
      products: state.products.filter((p) => p.name.toLowerCase().includes(t) || p.brand.toLowerCase().includes(t)).slice(0, 3),
    };
  }, [q, customers, state.orders, state.products]);

  const go = (path: string) => { nav(path); setOpen(false); setQ(''); };
  const empty = results && !results.customers.length && !results.orders.length && !results.products.length;

  return (
    <div className="global-search" ref={box}>
      <Search size={16} className="search__icon" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search customers, phone, orders…"
        aria-label="Search"
      />
      <kbd>/</kbd>
      {open && results && (
        <div className="popover search-results">
          {empty && <p className="popover__empty">No matches for “{q}”. Try a name, phone number or order ID.</p>}
          {!!results.customers.length && <h6>Customers</h6>}
          {results.customers.map((c) => (
            <button key={c.id} className="result" onClick={() => go(`/customers/${c.id}`)}>
              <Avatar name={c.name} size={28} />
              <span><strong>{c.name}</strong><small>+91 {c.phone}</small></span>
            </button>
          ))}
          {!!results.orders.length && <h6>Orders</h6>}
          {results.orders.map((o) => (
            <button key={o.id} className="result" onClick={() => go(`/orders?open=${o.id}`)}>
              <Package size={16} className="muted" />
              <span><strong>{o.id}</strong><small>{inr(o.amount)}</small></span>
              <OrderBadge status={o.status} />
            </button>
          ))}
          {!!results.products.length && <h6>Products</h6>}
          {results.products.map((p) => (
            <button key={p.id} className="result" onClick={() => go(`/products?open=${p.id}`)}>
              <Glasses size={16} className="muted" />
              <span><strong>{p.name}</strong><small>{p.category} · {inr(p.price)}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(() => Date.now() - 20 * 60_000);
  const box = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const unseen = state.activity.filter((a) => a.ts > seenAt).length;

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="notif" ref={box}>
      <button className="icon-btn" aria-label="Notifications" onClick={() => setOpen((o) => !o)}>
        <Bell size={19} />
        {unseen > 0 && <span className="notif__dot">{unseen}</span>}
      </button>
      {open && (
        <div className="popover notif__panel">
          <div className="notif__head">
            <strong>Notifications</strong>
            <button className="link-btn" onClick={() => setSeenAt(Date.now())}>Mark all as read</button>
          </div>
          {state.activity.slice(0, 7).map((a) => (
            <button key={a.id} className={`notif__item ${a.ts > seenAt ? 'is-new' : ''}`} onClick={() => { setOpen(false); if (a.customerId) nav(`/customers/${a.customerId}`); }}>
              <span>{a.text}</span>
              <small>{timeAgo(a.ts)}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNav() {
  const nav = useNav();
  const pick = ['/', '/customers', '/follow-ups', '/whatsapp', '/orders'];
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {nav.filter((n) => pick.includes(n.to)).map(({ to, label, icon: Icon, badge }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'is-active' : '')}>
          <span className="bottom-nav__icon">
            <Icon size={20} strokeWidth={1.8} />
            {!!badge && <i />}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout() {
  const [drawer, setDrawer] = useState(false);
  const { state } = useStore();
  const loc = useLocation();
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    setDrawer(false);
    main.current?.scrollTo?.({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('.global-search input')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const chat = loc.pathname.startsWith('/whatsapp');

  return (
    <div className={`app ${chat ? 'app--chat' : ''}`}>
      <Sidebar open={drawer} onClose={() => setDrawer(false)} />
      <div className="app__body">
        <header className="topbar">
          <button className="icon-btn topbar__menu" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="topbar__brand"><BrandMark size={28} /><strong>OptiCare</strong></div>
          <GlobalSearch />
          <div className="topbar__right">
            <span className="demo-chip demo-chip--top"><i /> Demo mode</span>
            <Notifications />
            <NavLink to="/settings" className="user-chip">
              <Avatar name={state.settings.user.name} size={32} />
              <span><strong>{state.settings.user.name}</strong><small>{state.settings.user.role} · Anna Nagar</small></span>
              <ChevronDown size={16} className="muted" />
            </NavLink>
          </div>
        </header>
        <main className="main" ref={main}>
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
