import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BellRing, Check, Plus, Send, Trash2, Zap } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/ui/Toast';
import { useFakeLoading } from '../hooks/useFakeLoading';
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, PageHeader, SearchInput, Select, SkeletonRows, Tabs } from '../components/ui/primitives';
import { ConfirmDialog } from '../components/ui/Modal';
import { followUpIcon } from '../components/ui/badges';
import { AddFollowUpModal } from '../components/customers/CustomerModals';
import { AutomationAudienceModal, AutomationCard, AutomationModal } from '../components/followups/Automations';
import { followUpBucket, type FollowUpBucket } from '../lib/selectors';
import { fmtDate, relativeDay, timeAgo } from '../lib/format';
import type { Automation, FollowUp, FollowUpType } from '../types';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
] as const;
type TabKey = (typeof TABS)[number]['value'];

const bucketBadge: Record<FollowUpBucket, { tone: 'red' | 'amber' | 'blue' | 'green' | 'grey'; label: string }> = {
  overdue: { tone: 'red', label: 'Overdue' },
  today: { tone: 'amber', label: 'Due today' },
  week: { tone: 'amber', label: 'This week' },
  upcoming: { tone: 'green', label: 'Upcoming' },
  completed: { tone: 'grey', label: 'Done' },
};

export default function FollowUps() {
  const { state, customer, sendFollowUp, completeFollowUp, deleteFollowUp } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const loading = useFakeLoading(400);
  const tab = (TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'all') as TabKey;
  const [type, setType] = useState<FollowUpType | ''>('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Automation | 'new'>();
  const [viewing, setViewing] = useState<Automation>();
  const [removing, setRemoving] = useState<FollowUp>();
  const [justSent, setJustSent] = useState<Set<string>>(new Set());

  const setTab = (t: TabKey) => {
    const p = new URLSearchParams(params);
    if (t === 'all') p.delete('tab'); else p.set('tab', t);
    setParams(p, { replace: true });
    setSelected(new Set());
  };

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: state.followUps.length, overdue: 0, today: 0, week: 0, upcoming: 0, completed: 0 };
    for (const f of state.followUps) c[followUpBucket(f)]++;
    return c;
  }, [state.followUps]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return state.followUps
      .filter((f) => tab === 'all' || followUpBucket(f) === tab)
      .filter((f) => !type || f.type === type)
      .filter((f) => !t || (customer(f.customerId)?.name.toLowerCase().includes(t) ?? false))
      .sort((a, b) => {
        const done = Number(a.status !== 'Pending') - Number(b.status !== 'Pending');
        return done || (a.status === 'Pending' ? a.dueDate.localeCompare(b.dueDate) : (b.sentAt ?? 0) - (a.sentAt ?? 0));
      });
  }, [state.followUps, tab, type, q, customer]);

  const pendingInView = list.filter((f) => f.status === 'Pending');

  const send = (f: FollowUp) => {
    sendFollowUp(f.id);
    setJustSent((s) => new Set(s).add(f.id));
    setSelected((s) => { const n = new Set(s); n.delete(f.id); return n; });
    toast('Message sent', { tone: 'whatsapp', body: `${f.type} delivered to ${customer(f.customerId)?.name} via ${f.channel === 'Call' ? 'WhatsApp' : f.channel}.` });
  };

  const sendSelected = () => {
    const items = state.followUps.filter((f) => selected.has(f.id) && f.status === 'Pending');
    items.forEach((f) => sendFollowUp(f.id));
    setJustSent((s) => new Set([...s, ...items.map((f) => f.id)]));
    setSelected(new Set());
    toast(`${items.length} reminders sent`, { tone: 'whatsapp', body: 'Customers will see them on WhatsApp.' });
  };

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allChecked = pendingInView.length > 0 && pendingInView.every((f) => selected.has(f.id));

  return (
    <div className="page">
      <PageHeader title="Follow-ups" subtitle="Reminders created by automations and your team"
        actions={<>
          <Button icon={<Zap size={16} />} onClick={() => setEditing('new')}>New automation</Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAdding(true)}>Add follow-up</Button>
        </>} />

      <Tabs tabs={TABS} value={tab} onChange={setTab} counts={counts} />

      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search customer" />
        <Select value={type} onChange={(e) => setType(e.target.value as FollowUpType)} aria-label="Filter by type" style={{ maxWidth: 240 }}>
          <option value="">All reminder types</option>
          {Object.keys(followUpIcon).map((t) => <option key={t}>{t}</option>)}
        </Select>
        {selected.size > 0 && (
          <div className="bulk-bar">
            <span>{selected.size} selected</span>
            <Button variant="whatsapp" size="sm" icon={<Send size={14} />} onClick={sendSelected}>Send reminders</Button>
          </div>
        )}
      </div>

      <Card pad={false}>
        {loading ? <SkeletonRows /> : list.length === 0 ? (
          <EmptyState icon={<BellRing size={22} />} title={tab === 'overdue' ? 'Nothing overdue' : 'No follow-ups here'}
            body={tab === 'overdue' ? 'Every reminder has been sent on time.' : 'Add a follow-up from a customer profile or here.'}
            action={<Button onClick={() => setAdding(true)}>Add follow-up</Button>} />
        ) : (
          <ul className="fu-list">
            {pendingInView.length > 0 && (
              <li className="fu-list__head">
                <label className="check"><input type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(pendingInView.map((f) => f.id)))} /> Select all pending</label>
              </li>
            )}
            {list.map((f) => {
              const c = customer(f.customerId);
              const Icon = followUpIcon[f.type];
              const b = followUpBucket(f);
              const bb = bucketBadge[b];
              return (
                <li key={f.id} className={`fu-row ${justSent.has(f.id) ? 'is-flash' : ''}`}>
                  {f.status === 'Pending'
                    ? <input type="checkbox" className="fu-row__check" checked={selected.has(f.id)} onChange={() => toggle(f.id)} aria-label={`Select ${c?.name}`} />
                    : <span className="fu-row__check" />}
                  <button className="fu-row__who" onClick={() => nav(`/customers/${f.customerId}?tab=communication`)}>
                    <Avatar name={c?.name ?? '?'} size={34} />
                    <span><strong>{c?.name}</strong><small>+91 {c?.phone}</small></span>
                  </button>
                  <div className="fu-row__what">
                    <span className={`fu-type fu-type--${b}`}><Icon size={14} /> {f.type}</span>
                    <small>{f.note || (f.automated ? 'Created by automation' : 'Added manually')}</small>
                  </div>
                  <div className="fu-row__when">
                    {f.status === 'Pending' ? (
                      <><strong>{relativeDay(f.dueDate)}</strong><small>{fmtDate(f.dueDate)} · {f.channel}</small></>
                    ) : (
                      <><strong>{f.status}</strong><small>{f.sentAt ? timeAgo(f.sentAt) : fmtDate(f.dueDate)}</small></>
                    )}
                  </div>
                  <Badge tone={f.status === 'Sent' ? 'blue' : f.status === 'Completed' ? 'green' : bb.tone} dot>{f.status === 'Pending' ? bb.label : f.status === 'Sent' ? 'Message sent' : 'Completed'}</Badge>
                  <div className="fu-row__actions">
                    {f.status === 'Pending' && <Button size="sm" variant="whatsapp" icon={<Send size={14} />} onClick={() => send(f)}>Send reminder</Button>}
                    {f.status === 'Sent' && <Button size="sm" icon={<Check size={14} />} onClick={() => { completeFollowUp(f.id); toast('Marked as completed'); }}>Mark done</Button>}
                    <button className="icon-btn icon-btn--sm" data-tip="Delete" onClick={() => setRemoving(f)}><Trash2 size={15} /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <section className="section">
        <CardHeader title="Automations" subtitle="Reminders these rules create appear in the list above" />
        <div className="automation-grid">
          {state.automations.map((a) => <AutomationCard key={a.id} a={a} onEdit={() => setEditing(a)} onView={() => setViewing(a)} />)}
        </div>
      </section>

      <AddFollowUpModal open={adding} onClose={() => setAdding(false)} />
      <AutomationModal open={!!editing} onClose={() => setEditing(undefined)} automation={editing === 'new' ? undefined : editing} />
      <AutomationAudienceModal automation={viewing} onClose={() => setViewing(undefined)} />
      <ConfirmDialog open={!!removing} onClose={() => setRemoving(undefined)} danger title="Delete this follow-up?"
        body={`${removing?.type} for ${removing ? customer(removing.customerId)?.name : ''} will be removed. Automations won't recreate it.`}
        confirmLabel="Delete follow-up" onConfirm={() => { if (removing) { deleteFollowUp(removing.id); toast('Follow-up deleted', { tone: 'warning' }); } }} />
    </div>
  );
}
