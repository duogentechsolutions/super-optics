import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Pencil, Users } from 'lucide-react';
import { useStore } from '../../store/AppStore';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Avatar, Badge, Button, Field, Input, Select, Textarea, Toggle } from '../ui/primitives';
import { automationIcon } from '../ui/badges';
import type { Automation, AutomationIcon, FollowUpType } from '../../types';
import { fillTemplate, fmtDate, num, relativeDay, uid } from '../../lib/format';
import { followUpBucket } from '../../lib/selectors';

export function AutomationCard({ a, onEdit, onView }: { a: Automation; onEdit: () => void; onView: () => void }) {
  const { toggleAutomation, state } = useStore();
  const toast = useToast();
  const Icon = automationIcon[a.icon];
  const queued = state.followUps.filter((f) => f.type === a.followUpType && f.status === 'Pending').length;
  return (
    <article className={`automation ${a.enabled ? '' : 'is-off'}`}>
      <header>
        <span className="automation__icon"><Icon size={18} strokeWidth={1.8} /></span>
        <h4>{a.name}</h4>
        <span className="automation__state">{a.enabled ? 'On' : 'Off'}</span>
        <Toggle checked={a.enabled} label={`Turn ${a.name} ${a.enabled ? 'off' : 'on'}`} onChange={() => { toggleAutomation(a.id); toast(`${a.name} ${a.enabled ? 'paused' : 'turned on'}`, { tone: a.enabled ? 'warning' : 'success' }); }} />
      </header>
      <dl>
        <div><dt>Trigger</dt><dd>{a.delay === 'Immediately' || a.delay.startsWith('Same') ? a.trigger : `${a.delay} ${a.trigger.toLowerCase()}`}</dd></div>
        <div><dt>Audience</dt><dd>{a.audience}</dd></div>
        <div><dt>Channel</dt><dd><MessageCircle size={13} className="text-green" /> {a.channel}</dd></div>
      </dl>
      <footer>
        <span className="muted small">{num(a.sentCount)} sent · {queued} queued</span>
        <div>
          <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={onEdit}>Edit</Button>
          <Button size="sm" icon={<Users size={14} />} onClick={onView}>View customers</Button>
        </div>
      </footer>
    </article>
  );
}

const VARS = ['customer_name', 'store_name', 'appointment_date', 'order_number'];
const TRIGGERS = ['After last eye examination', 'After lens purchase', 'On customer birthday', 'Order status changes to Ready', 'After purchase is collected', 'On a custom date'];
const TYPE_FOR: Record<string, FollowUpType> = {
  'After last eye examination': 'Eye Check Reminder',
  'After lens purchase': 'Lens Replacement',
  'On customer birthday': 'Birthday',
  'Order status changes to Ready': 'Order Ready',
  'After purchase is collected': 'Post-Purchase Follow-up',
  'On a custom date': 'Custom Reminder',
};
const ICON_FOR: Record<FollowUpType, AutomationIcon> = {
  'Eye Check Reminder': 'eye', 'Lens Replacement': 'lens', Birthday: 'cake', 'Order Ready': 'package', 'Post-Purchase Follow-up': 'heart', 'Custom Reminder': 'bell',
};

export function AutomationModal({ open, onClose, automation }: { open: boolean; onClose: () => void; automation?: Automation }) {
  const { saveAutomation, state } = useStore();
  const toast = useToast();
  const ta = useRef<HTMLTextAreaElement>(null);
  const [a, setA] = useState<Automation>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setA(automation ? { ...automation } : {
      id: uid('au'), name: '', icon: 'bell', trigger: TRIGGERS[0], delay: '3 months', audience: 'All customers', channel: 'WhatsApp',
      template: 'Hi {{customer_name}} 👋\n\n', enabled: true, followUpType: 'Custom Reminder', sentCount: 0,
    });
  }, [open, automation]);

  if (!a) return null;
  const set = <K extends keyof Automation>(k: K, v: Automation[K]) => setA((x) => (x ? { ...x, [k]: v } : x));

  const insertVar = (v: string) => {
    const el = ta.current;
    const token = `{{${v}}}`;
    if (!el) { set('template', a.template + token); return; }
    const start = el.selectionStart ?? a.template.length;
    const end = el.selectionEnd ?? start;
    const next = a.template.slice(0, start) + token + a.template.slice(end);
    set('template', next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (a.name.trim().length < 3) e.name = 'Give the automation a clear name.';
    if (!a.template.includes('{{customer_name}}')) e.template = 'Include {{customer_name}} so each message is personal.';
    if (a.template.trim().length < 20) e.template = 'The message is too short.';
    setErrors(e);
    if (Object.keys(e).length) return;
    saveAutomation({ ...a, name: a.name.trim() });
    toast(automation ? 'Automation updated' : 'Automation created', { body: `${a.name} is ${a.enabled ? 'on' : 'off'}.` });
    onClose();
  };

  const sample = fillTemplate(a.template, { customer_name: 'Arun', store_name: state.settings.business.name, appointment_date: 'Sat 26 Sep, 11:30 AM', order_number: 'OC-2455' });
  const buttons = [...sample.matchAll(/\[(.+?)\]/g)].map((m) => m[1]);
  const body = sample.replace(/\n*\[(.+?)\]/g, '').trim();

  return (
    <Modal open={open} onClose={onClose} title={automation ? 'Edit automation' : 'Create automation'} size="lg"
      footer={
        <>
          <label className="check check--inline"><Toggle checked={a.enabled} onChange={(v) => set('enabled', v)} label="Status" /> {a.enabled ? 'Active' : 'Paused'}</label>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{automation ? 'Save changes' : 'Create automation'}</Button>
        </>
      }>
      <div className="automation-edit">
        <div className="form-grid">
          <Field label="Automation name" error={errors.name} full><Input value={a.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Contact lens reorder" /></Field>
          <Field label="Trigger" full>
            <Select value={a.trigger} onChange={(e) => { const t = e.target.value; const type = TYPE_FOR[t] ?? 'Custom Reminder'; setA({ ...a, trigger: t, followUpType: type, icon: ICON_FOR[type] }); }}>
              {[...new Set([a.trigger, ...TRIGGERS])].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Delay">
            <Select value={a.delay} onChange={(e) => set('delay', e.target.value)}>
              {[...new Set([a.delay, 'Immediately', '7 days', '1 month', '3 months', '6 months', '12 months', 'Same day, 9:00 AM'])].map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Channel">
            <Select value={a.channel} onChange={(e) => set('channel', e.target.value as 'WhatsApp')}><option>WhatsApp</option><option>SMS</option></Select>
          </Field>
          <Field label="Audience" full><Input value={a.audience} onChange={(e) => set('audience', e.target.value)} /></Field>
          <Field label="Message template" error={errors.template} full>
            <Textarea ref={ta} rows={7} value={a.template} onChange={(e) => set('template', e.target.value)} />
          </Field>
        </div>
        <div className="var-chips">
          <span className="field__label">Insert variable</span>
          <div className="chip-grid">
            {VARS.map((v) => <button key={v} type="button" className="chip chip--var" onClick={() => insertVar(v)}>{`{{${v}}}`}</button>)}
          </div>
          <span className="field__hint">Add a button with square brackets, e.g. [Book Appointment]</span>
        </div>
        <aside className="phone-preview" aria-label="Message preview">
          <div className="phone-preview__bar"><Avatar name={state.settings.business.name} size={26} /><span><strong>{state.settings.business.name}</strong><small>Business account</small></span></div>
          <div className="phone-preview__screen">
            <div className="bubble bubble--store">
              <p>{body}</p>
              {buttons.length > 0 && <div className="bubble__buttons">{buttons.map((b) => <span key={b}>{b}</span>)}</div>}
              <small>9:00 AM</small>
            </div>
          </div>
          <p className="phone-preview__note">Preview for Arun Kumar</p>
        </aside>
      </div>
    </Modal>
  );
}

export function AutomationAudienceModal({ automation, onClose }: { automation?: Automation; onClose: () => void }) {
  const { state, customer } = useStore();
  const nav = useNavigate();
  if (!automation) return null;
  const items = state.followUps
    .filter((f) => f.type === automation.followUpType)
    .sort((x, y) => x.dueDate.localeCompare(y.dueDate));
  return (
    <Modal open onClose={onClose} title={automation.name} subtitle={`${items.length} customers in this automation`}
      footer={<Button onClick={onClose}>Close</Button>}>
      {items.length === 0 ? <p className="muted">No customers have reached this trigger yet.</p> : (
        <ul className="mini-list">
          {items.map((f) => {
            const c = customer(f.customerId);
            const b = followUpBucket(f);
            return (
              <li key={f.id} className="is-clickable" onClick={() => nav(`/customers/${f.customerId}`)}>
                <Avatar name={c?.name ?? '?'} size={30} />
                <span><strong>{c?.name}</strong><small>{f.status === 'Pending' ? relativeDay(f.dueDate) : `Due ${fmtDate(f.dueDate)}`}</small></span>
                <Badge tone={f.status === 'Completed' ? 'green' : f.status === 'Sent' ? 'blue' : b === 'overdue' ? 'red' : 'amber'}>{f.status === 'Pending' && b === 'overdue' ? 'Overdue' : f.status}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
