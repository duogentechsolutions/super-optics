import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Building2, Database, MessageSquareText, RotateCcw, Save, SlidersHorizontal, UserCog, Workflow } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/Modal';
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea, Toggle } from '../components/ui/primitives';
import { automationIcon } from '../components/ui/badges';
import { fillTemplate } from '../lib/format';
import type { QuickTemplate, Settings as SettingsT } from '../types';

const SECTIONS = [
  { id: 'business', label: 'Business Profile', icon: Building2 },
  { id: 'templates', label: 'WhatsApp Templates', icon: MessageSquareText },
  { id: 'automation', label: 'Automation Settings', icon: Workflow },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell },
  { id: 'user', label: 'User Preferences', icon: UserCog },
  { id: 'demo', label: 'Demo Data', icon: Database },
] as const;

const VARS = ['{{customer_name}}', '{{store_name}}', '{{appointment_date}}', '{{order_number}}'];
const SAMPLE = { customer_name: 'Arun', store_name: 'OptiCare', appointment_date: 'Sat 26 Sep, 11:30 AM', order_number: 'OC-2469' };

export default function Settings() {
  const [active, setActive] = useState<string>('business');

  const go = (id: string) => {
    setActive(id);
    document.getElementById(`set-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Store profile, messaging and demo controls" />
      <div className="settings">
        <nav className="settings__nav" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <button key={s.id} className={active === s.id ? 'is-active' : ''} onClick={() => go(s.id)}>
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </nav>
        <div className="settings__body">
          <BusinessSection />
          <TemplatesSection />
          <AutomationSection />
          <NotificationSection />
          <UserSection />
          <DemoSection />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Business */

function BusinessSection() {
  const { state, updateSettings } = useStore();
  const toast = useToast();
  const [f, setF] = useState(state.settings.business);
  const [errors, setErrors] = useState<Partial<Record<keyof SettingsT['business'], string>>>({});
  useEffect(() => setF(state.settings.business), [state.settings.business]);
  const dirty = JSON.stringify(f) !== JSON.stringify(state.settings.business);
  const set = (k: keyof SettingsT['business']) => (e: { target: { value: string } }) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  const save = () => {
    const e: typeof errors = {};
    if (!f.name.trim()) e.name = 'Business name is required';
    if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address';
    if (!f.address.trim()) e.address = 'Address is required';
    setErrors(e);
    if (Object.keys(e).length) return;
    updateSettings({ business: f });
    toast('Business profile saved', { tone: 'success' });
  };

  return (
    <Card className="settings__card">
      <div id="set-business" className="anchor" />
      <CardHeader title="Business Profile" subtitle="Shown in WhatsApp messages and customer receipts" />
      <div className="form-grid">
        <Field label="Business name" error={errors.name}><Input value={f.name} onChange={set('name')} /></Field>
        <Field label="Phone" error={errors.phone}><Input value={f.phone} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="Email" error={errors.email}><Input value={f.email} onChange={set('email')} type="email" /></Field>
        <Field label="Opening hours"><Input value={f.hours} onChange={set('hours')} /></Field>
        <Field label="Address" error={errors.address} full><Textarea rows={2} value={f.address} onChange={set('address')} /></Field>
      </div>
      <div className="settings__foot">
        {dirty && <span className="muted small">Unsaved changes</span>}
        <Button variant="ghost" disabled={!dirty} onClick={() => { setF(state.settings.business); setErrors({}); }}>Discard</Button>
        <Button variant="primary" icon={<Save size={15} />} disabled={!dirty} onClick={save}>Save changes</Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ Templates */

function TemplatesSection() {
  const { state } = useStore();
  return (
    <Card className="settings__card">
      <div id="set-templates" className="anchor" />
      <CardHeader title="WhatsApp Templates" subtitle="Quick replies available in the WhatsApp hub. Variables are filled in per customer." />
      <div className="template-list">
        {state.templates.map((t) => <TemplateRow key={t.id} t={t} />)}
      </div>
    </Card>
  );
}

function TemplateRow({ t }: { t: QuickTemplate }) {
  const { updateTemplate } = useStore();
  const toast = useToast();
  const [body, setBody] = useState(t.body);
  const [open, setOpen] = useState(false);
  useEffect(() => setBody(t.body), [t.body]);
  const dirty = body !== t.body;

  return (
    <div className={`template-row ${open ? 'is-open' : ''}`}>
      <button className="template-row__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <strong>{t.name}</strong>
        <span className="template-row__preview">{fillTemplate(t.body, SAMPLE)}</span>
        <span className="template-row__edit">{open ? 'Close' : 'Edit'}</span>
      </button>
      {open && (
        <div className="template-row__body">
          <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="var-chips">
            {VARS.map((v) => <button key={v} className="var-chip" onClick={() => setBody((b) => `${b}${b.endsWith(' ') || !b ? '' : ' '}${v}`)}>{v}</button>)}
          </div>
          <div className="phone-preview phone-preview--inline">
            <div className="bubble">{fillTemplate(body, SAMPLE) || <em className="muted">Empty message</em>}</div>
          </div>
          <div className="settings__foot">
            <Button variant="ghost" disabled={!dirty} onClick={() => setBody(t.body)}>Discard</Button>
            <Button variant="primary" disabled={!dirty || !body.trim()} onClick={() => { updateTemplate(t.id, body); toast('Template updated', { body: t.name, tone: 'success' }); setOpen(false); }}>Save template</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Automation */

function AutomationSection() {
  const { state, updateSettings, toggleAutomation } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const a = state.settings.automation;
  const set = (patch: Partial<SettingsT['automation']>) => { updateSettings({ automation: { ...a, ...patch } }); };

  return (
    <Card className="settings__card">
      <div id="set-automation" className="anchor" />
      <CardHeader title="Automation Settings" subtitle="When and how often automated reminders go out" action={<Button size="sm" variant="ghost" onClick={() => nav('/follow-ups')}>Manage automations</Button>} />
      <div className="form-grid">
        <Field label="Send window starts"><Input type="time" value={a.sendWindowStart} onChange={(e) => set({ sendWindowStart: e.target.value })} /></Field>
        <Field label="Send window ends" error={a.sendWindowEnd <= a.sendWindowStart ? 'End must be after start' : undefined}><Input type="time" value={a.sendWindowEnd} onChange={(e) => set({ sendWindowEnd: e.target.value })} /></Field>
        <Field label="Max messages per customer per week" hint="Protects customers from over-messaging">
          <Select value={a.maxPerWeek} onChange={(e) => set({ maxPerWeek: Number(e.target.value) })}>
            {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
        <div className="setting-line">
          <div><strong>Pause on Sundays</strong><p className="muted small">Queue Sunday reminders for Monday morning</p></div>
          <Toggle label="Pause on Sundays" checked={a.skipSundays} onChange={(v) => set({ skipSundays: v })} />
        </div>
      </div>
      <div className="setting-list">
        {state.automations.map((au) => {
          const Icon = automationIcon[au.icon];
          return (
            <div key={au.id} className="setting-line">
              <div className="setting-line__lead">
                <span className="icon-tile"><Icon size={16} /></span>
                <div><strong>{au.name}</strong><p className="muted small">{au.trigger}</p></div>
              </div>
              <div className="setting-line__end">
                <Badge tone={au.enabled ? 'green' : 'grey'} dot>{au.enabled ? 'On' : 'Off'}</Badge>
                <Toggle label={au.name} checked={au.enabled} onChange={() => { toggleAutomation(au.id); toast(`${au.name} ${au.enabled ? 'paused' : 'turned on'}`, { tone: 'info' }); }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------- Notifications */

const NOTIFS: { key: keyof SettingsT['notifications']; label: string; body: string }[] = [
  { key: 'orderReady', label: 'Order ready alerts', body: 'Notify staff when a lab order is marked Ready' },
  { key: 'dailySummary', label: 'Daily summary', body: 'A 9 PM digest of sales, bookings and follow-ups' },
  { key: 'overdueAlerts', label: 'Overdue follow-up alerts', body: 'Flag reminders that are more than 2 days late' },
  { key: 'newEnquiry', label: 'New WhatsApp enquiries', body: 'Alert when a new customer messages the store' },
];

function NotificationSection() {
  const { state, updateSettings } = useStore();
  const toast = useToast();
  const n = state.settings.notifications;
  return (
    <Card className="settings__card">
      <div id="set-notifications" className="anchor" />
      <CardHeader title="Notification Preferences" subtitle="Alerts for the store team (changes save instantly)" />
      <div className="setting-list">
        {NOTIFS.map((x) => (
          <div key={x.key} className="setting-line">
            <div><strong>{x.label}</strong><p className="muted small">{x.body}</p></div>
            <Toggle label={x.label} checked={n[x.key]} onChange={(v) => { updateSettings({ notifications: { ...n, [x.key]: v } }); toast(`${x.label} ${v ? 'on' : 'off'}`, { tone: 'info' }); }} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- User */

function UserSection() {
  const { state, updateSettings } = useStore();
  const toast = useToast();
  const [u, setU] = useState(state.settings.user);
  const [err, setErr] = useState('');
  useEffect(() => setU(state.settings.user), [state.settings.user]);
  const dirty = JSON.stringify(u) !== JSON.stringify(state.settings.user);

  return (
    <Card className="settings__card">
      <div id="set-user" className="anchor" />
      <CardHeader title="User Preferences" subtitle="Your account on this device" />
      <div className="form-grid">
        <Field label="Display name" error={err}><Input value={u.name} onChange={(e) => { setU({ ...u, name: e.target.value }); setErr(''); }} /></Field>
        <Field label="Role">
          <Select value={u.role} onChange={(e) => setU({ ...u, role: e.target.value })}>
            {['Owner', 'Store Manager', 'Optometrist', 'Sales Staff'].map((r) => <option key={r}>{r}</option>)}
          </Select>
        </Field>
        <div className="setting-line field--full">
          <div><strong>Compact tables</strong><p className="muted small">Tighter rows on customer and order lists</p></div>
          <Toggle label="Compact tables" checked={u.compactTables} onChange={(v) => setU({ ...u, compactTables: v })} />
        </div>
      </div>
      <div className="settings__foot">
        <Button variant="ghost" disabled={!dirty} onClick={() => setU(state.settings.user)}>Discard</Button>
        <Button variant="primary" icon={<Save size={15} />} disabled={!dirty} onClick={() => {
          if (!u.name.trim()) { setErr('Name is required'); return; }
          updateSettings({ user: u });
          toast('Preferences saved', { tone: 'success' });
        }}>Save preferences</Button>
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- Demo */

function DemoSection() {
  const { state, resetDemo } = useStore();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const counts = [
    ['Customers', state.customers.length],
    ['Prescriptions', state.prescriptions.length],
    ['Orders', state.orders.length],
    ['Follow-ups', state.followUps.length],
    ['Conversations', state.conversations.length],
    ['Products', state.products.length],
    ['Appointments', state.appointments.length],
  ] as const;

  return (
    <Card className="settings__card settings__card--demo">
      <div id="set-demo" className="anchor" />
      <CardHeader title="Demo Data" subtitle="Everything runs in your browser. Changes are saved on this device only." action={<Badge tone="amber" dot>Demo mode</Badge>} />
      <div className="demo-counts">
        {counts.map(([l, v]) => <div key={l}><strong>{v}</strong><span>{l}</span></div>)}
      </div>
      <div className="demo-reset">
        <div>
          <strong>Reset demo data</strong>
          <p className="muted small">Restore the original customers, orders, conversations and settings. Anything you added during the demo will be removed.</p>
        </div>
        <Button variant="danger" icon={<RotateCcw size={15} />} onClick={() => setConfirm(true)}>Reset Demo Data</Button>
      </div>
      <p className="muted small with-icon"><SlidersHorizontal size={13} /> No backend, payment, SMS or WhatsApp API is connected — all messages are simulated.</p>
      <ConfirmDialog
        open={confirm}
        title="Reset all demo data?"
        body="This restores the original sample data. Customers, orders, messages and settings you changed will be lost."
        confirmLabel="Reset data"
        danger
        onClose={() => setConfirm(false)}
        onConfirm={() => { resetDemo(); setConfirm(false); toast('Demo data reset', { body: 'Sample data restored.', tone: 'success' }); }}
      />
    </Card>
  );
}
