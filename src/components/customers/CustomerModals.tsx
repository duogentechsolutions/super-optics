import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store/AppStore';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button, Field, Input, Select, Textarea } from '../ui/primitives';
import type { AppointmentType, Customer, CustomerView, EyeRx, FollowUpType, OrderItem, OrderStatus } from '../../types';
import { TODAY, addDays, fillTemplate, fmtDate, fmtDayLabel, inr } from '../../lib/format';
import { OPTOMETRISTS } from '../../data/prescriptions';

interface Base { open: boolean; onClose: () => void }

/* ------------------------------------------------------ Add / edit customer */

type CustomerForm = Omit<Customer, 'id' | 'notes' | 'customerSince'>;
const blank: CustomerForm = { name: '', phone: '', email: '', gender: 'Female', dob: '', area: '', preferredChannel: 'WhatsApp' };

export function CustomerFormModal({ open, onClose, customer, onSaved }: Base & { customer?: Customer; onSaved?: (c: Customer) => void }) {
  const { addCustomer, updateCustomer, state } = useStore();
  const toast = useToast();
  const [form, setForm] = useState<CustomerForm>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(customer ? { name: customer.name, phone: customer.phone, email: customer.email, gender: customer.gender, dob: customer.dob, area: customer.area, preferredChannel: customer.preferredChannel } : blank);
      setErrors({});
    }
  }, [open, customer]);

  const set = <K extends keyof CustomerForm>(k: K, v: CustomerForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const e: Record<string, string> = {};
    const digits = form.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (form.name.trim().length < 2) e.name = 'Enter the customer’s full name.';
    if (!/^[6-9]\d{9}$/.test(digits)) e.phone = 'Enter a 10-digit Indian mobile number.';
    else if (state.customers.some((c) => c.id !== customer?.id && c.phone.replace(/\D/g, '') === digits)) e.phone = 'A customer with this number already exists.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email or leave it blank.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const clean = { ...form, name: form.name.trim(), phone: `${digits.slice(0, 5)} ${digits.slice(5)}` };
    if (customer) {
      updateCustomer(customer.id, clean);
      toast('Customer updated', { body: clean.name });
      onClose();
    } else {
      const c = addCustomer(clean);
      toast('Customer added', { body: `${c.name} is now in your CRM.` });
      onClose();
      onSaved?.(c);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? 'Edit customer' : 'Add customer'}
      subtitle={customer ? undefined : 'Create a profile when a customer visits or enquires.'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>{customer ? 'Save changes' : 'Add customer'}</Button></>}
    >
      <div className="form-grid">
        <Field label="Full name" error={errors.name} full><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Arun Kumar" /></Field>
        <Field label="Mobile number" error={errors.phone} hint="Used for WhatsApp updates"><Input value={form.phone} inputMode="tel" onChange={(e) => set('phone', e.target.value)} placeholder="98765 43210" /></Field>
        <Field label="Email" error={errors.email}><Input value={form.email} type="email" onChange={(e) => set('email', e.target.value)} placeholder="Optional" /></Field>
        <Field label="Date of birth" hint="Enables birthday messages"><Input type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
        <Field label="Gender">
          <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Customer['gender'])}>
            <option>Female</option><option>Male</option>
          </Select>
        </Field>
        <Field label="Area"><Input value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="e.g. Anna Nagar" /></Field>
        <Field label="Preferred channel">
          <Select value={form.preferredChannel} onChange={(e) => set('preferredChannel', e.target.value as Customer['preferredChannel'])}>
            <option>WhatsApp</option><option>SMS</option><option>Call</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ Add purchase */

export function AddPurchaseModal({ open, onClose, customer }: Base & { customer: CustomerView }) {
  const { state, addPurchase } = useStore();
  const toast = useToast();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [pick, setPick] = useState('');
  const [status, setStatus] = useState<OrderStatus>('Received');
  const [payment, setPayment] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [confirm, setConfirm] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => { if (open) { setItems([]); setPick(''); setStatus('Received'); setErr(''); setConfirm(true); } }, [open]);

  const add = (id: string) => {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    setErr('');
    setItems((it) => {
      const ex = it.find((i) => i.productId === id);
      if (ex) return it.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i));
      return [...it, { productId: p.id, name: p.name, category: p.category, price: p.price, qty: 1 }];
    });
    setPick('');
  };
  const qty = (id: string, d: number) => setItems((it) => it.map((i) => (i.productId === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)));
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const save = () => {
    if (!items.length) { setErr('Add at least one product to record the purchase.'); return; }
    const o = addPurchase({ customerId: customer.id, items, status, paymentMode: payment, sendConfirmation: confirm });
    toast(`Purchase recorded · ${o.id}`, { body: `${inr(o.amount)} for ${customer.name}` });
    if (confirm) setTimeout(() => toast('WhatsApp confirmation sent', { tone: 'whatsapp', body: `Order ${o.id} details shared with ${customer.name.split(' ')[0]}.` }), 500);
    onClose();
  };

  const groups = ['Frames', 'Lenses', 'Contact Lenses', 'Accessories'] as const;

  return (
    <Modal open={open} onClose={onClose} title="Add purchase" subtitle={customer.name} size="lg"
      footer={<><span className="foot-total">Total <strong>{inr(total)}</strong></span><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Record purchase</Button></>}>
      <div className="form-grid">
        <Field label="Add product" error={err} full>
          <Select value={pick} onChange={(e) => add(e.target.value)}>
            <option value="">Choose a frame, lens or accessory…</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {state.products.filter((p) => p.category === g).map((p) => <option key={p.id} value={p.id}>{p.name} · {inr(p.price)}{p.stock < 5 ? ` (only ${p.stock} left)` : ''}</option>)}
              </optgroup>
            ))}
          </Select>
        </Field>
      </div>
      {items.length > 0 ? (
        <ul className="line-items">
          {items.map((i) => (
            <li key={i.productId}>
              <div><strong>{i.name}</strong><small>{i.category} · {inr(i.price)}</small></div>
              <div className="qty">
                <button className="icon-btn icon-btn--sm" onClick={() => qty(i.productId, -1)} aria-label="Decrease"><Minus size={14} /></button>
                <span>{i.qty}</span>
                <button className="icon-btn icon-btn--sm" onClick={() => qty(i.productId, 1)} aria-label="Increase"><Plus size={14} /></button>
              </div>
              <strong className="line-items__amt">{inr(i.price * i.qty)}</strong>
              <button className="icon-btn icon-btn--sm" onClick={() => setItems((it) => it.filter((x) => x.productId !== i.productId))} aria-label="Remove"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint-box">Tip: pair a frame with lenses. {customer.latestRx ? `Latest prescription advice: ${customer.latestRx.lensAdvice}.` : ''}</p>
      )}
      <div className="form-grid">
        <Field label="Order status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
            <option value="Received">Received — lenses to be fitted</option>
            <option value="Collected">Completed — handed over today</option>
          </Select>
        </Field>
        <Field label="Payment">
          <Select value={payment} onChange={(e) => setPayment(e.target.value as 'UPI')}>
            <option>UPI</option><option>Card</option><option>Cash</option>
          </Select>
        </Field>
        <label className="check field--full">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          Send WhatsApp confirmation to +91 {customer.phone}
        </label>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------- Add prescription */

const emptyEye: EyeRx = { sph: 0, cyl: 0, axis: 0, add: 0, pd: 31, va: '6/6' };

export function AddPrescriptionModal({ open, onClose, customer }: Base & { customer: CustomerView }) {
  const { addPrescription } = useStore();
  const toast = useToast();
  const [right, setRight] = useState<EyeRx>(emptyEye);
  const [left, setLeft] = useState<EyeRx>(emptyEye);
  const [date, setDate] = useState(TODAY);
  const [optometrist, setOpt] = useState(OPTOMETRISTS[0]);
  const [advice, setAdvice] = useState('Single vision, anti-glare');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    const prev = customer.latestRx;
    setRight(prev ? { ...prev.right } : emptyEye);
    setLeft(prev ? { ...prev.left } : emptyEye);
    setDate(TODAY); setNotes(''); setErr('');
    setAdvice(prev?.lensAdvice ?? 'Single vision, anti-glare');
  }, [open, customer.latestRx]);

  const rows: { key: keyof EyeRx; label: string; step: number; min: number; max: number }[] = [
    { key: 'sph', label: 'SPH', step: 0.25, min: -20, max: 20 },
    { key: 'cyl', label: 'CYL', step: 0.25, min: -6, max: 6 },
    { key: 'axis', label: 'AXIS', step: 1, min: 0, max: 180 },
    { key: 'add', label: 'ADD', step: 0.25, min: 0, max: 4 },
    { key: 'pd', label: 'PD', step: 0.5, min: 20, max: 40 },
  ];

  const save = () => {
    for (const eye of [right, left]) {
      if (eye.cyl !== 0 && (eye.axis < 1 || eye.axis > 180)) { setErr('Axis must be between 1 and 180 when CYL is set.'); return; }
      if (eye.pd < 20 || eye.pd > 40) { setErr('PD should be between 20 and 40 mm per eye.'); return; }
    }
    const { reminder } = addPrescription({ customerId: customer.id, date, optometrist, right, left, lensAdvice: advice, notes });
    toast('Prescription saved', { body: reminder ? `Eye check reminder scheduled for ${fmtDate(reminder.dueDate)}.` : customer.name });
    onClose();
  };

  const num = (eye: EyeRx, set: (e: EyeRx) => void, r: (typeof rows)[number]) => (
    <input className="input input--rx" type="number" step={r.step} min={r.min} max={r.max} value={eye[r.key] as number}
      onChange={(e) => set({ ...eye, [r.key]: Number(e.target.value) })} aria-label={r.label} />
  );

  return (
    <Modal open={open} onClose={onClose} title="Add prescription" subtitle={`${customer.name}${customer.latestRx ? ' · prefilled from last prescription' : ''}`} size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save prescription</Button></>}>
      <div className="rx-edit">
        <div className="rx-edit__row rx-edit__row--head"><span /><span>Right eye (OD)</span><span>Left eye (OS)</span></div>
        {rows.map((r) => (
          <div key={r.key} className="rx-edit__row">
            <span>{r.label}</span>
            {num(right, setRight, r)}
            {num(left, setLeft, r)}
          </div>
        ))}
      </div>
      {err && <p className="field__error" style={{ marginTop: 8 }}>{err}</p>}
      <div className="form-grid">
        <Field label="Date"><Input type="date" value={date} max={TODAY} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Optometrist">
          <Select value={optometrist} onChange={(e) => setOpt(e.target.value)}>{OPTOMETRISTS.map((o) => <option key={o}>{o}</option>)}</Select>
        </Field>
        <Field label="Lens advice" full><Input value={advice} onChange={(e) => setAdvice(e.target.value)} /></Field>
        <Field label="Notes" full><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations, next review…" /></Field>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------- Book appointment */

const SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '4:30 PM', '6:00 PM'];

export function BookAppointmentModal({ open, onClose, customer }: Base & { customer: CustomerView }) {
  const { addAppointment, state } = useStore();
  const toast = useToast();
  const days = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(TODAY, i + 1)).filter((d) => new Date(d).getUTCDay() !== 0), []);
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState('');
  const [type, setType] = useState<AppointmentType>('Eye Test');
  const [notify, setNotify] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => { if (open) { setDate(days[0]); setTime(''); setErr(''); } }, [open, days]);

  const taken = new Set(state.appointments.filter((a) => a.date === date && a.status === 'Scheduled').map((a) => a.time));

  const save = () => {
    if (!time) { setErr('Choose a time slot.'); return; }
    addAppointment({ customerId: customer.id, date, time, type, source: 'Phone' }, notify);
    toast('Appointment booked', { body: `${type} · ${fmtDayLabel(date)}, ${time}` });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Book appointment" subtitle={customer.name}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Book appointment</Button></>}>
      <div className="form-grid">
        <Field label="Appointment type" full>
          <Select value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
            <option>Eye Test</option><option>Frame Fitting</option><option>Contact Lens Trial</option><option>Collection</option>
          </Select>
        </Field>
      </div>
      <span className="field__label">Date</span>
      <div className="chip-grid">
        {days.map((d) => <button key={d} className={`chip ${d === date ? 'is-active' : ''}`} onClick={() => { setDate(d); setTime(''); }}>{fmtDayLabel(d)}</button>)}
      </div>
      <span className="field__label">Time</span>
      <div className="chip-grid">
        {SLOTS.map((s) => (
          <button key={s} disabled={taken.has(s)} className={`chip ${s === time ? 'is-active' : ''}`} onClick={() => { setTime(s); setErr(''); }} title={taken.has(s) ? 'Already booked' : undefined}>
            {s}
          </button>
        ))}
      </div>
      {err && <p className="field__error">{err}</p>}
      <label className="check"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Send WhatsApp confirmation</label>
    </Modal>
  );
}

/* --------------------------------------------------------------- Follow-up */

const FU_TYPES: FollowUpType[] = ['Eye Check Reminder', 'Lens Replacement', 'Birthday', 'Order Ready', 'Post-Purchase Follow-up', 'Custom Reminder'];

export function AddFollowUpModal({ open, onClose, customer }: Base & { customer?: CustomerView }) {
  const { addFollowUp, customers } = useStore();
  const toast = useToast();
  const [cid, setCid] = useState(customer?.id ?? '');
  const [type, setType] = useState<FollowUpType>('Custom Reminder');
  const [due, setDue] = useState(addDays(TODAY, 7));
  const [channel, setChannel] = useState<'WhatsApp' | 'SMS' | 'Call'>('WhatsApp');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => { if (open) { setCid(customer?.id ?? ''); setDue(addDays(TODAY, 7)); setNote(''); setErr({}); setType('Custom Reminder'); } }, [open, customer]);

  const save = () => {
    const e: Record<string, string> = {};
    if (!cid) e.cid = 'Choose a customer.';
    if (!due) e.due = 'Choose a due date.';
    if (type === 'Custom Reminder' && note.trim().length < 3) e.note = 'Describe what the reminder is for.';
    setErr(e);
    if (Object.keys(e).length) return;
    addFollowUp({ customerId: cid, type, dueDate: due, channel, note: note.trim() });
    const name = customers.find((c) => c.id === cid)?.name;
    toast('Follow-up scheduled', { body: `${type} for ${name} on ${fmtDate(due)}. It now appears in Follow-ups.` });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add follow-up" subtitle={customer?.name}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save follow-up</Button></>}>
      <div className="form-grid">
        {!customer && (
          <Field label="Customer" error={err.cid} full>
            <Select value={cid} onChange={(e) => setCid(e.target.value)}>
              <option value="">Select a customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Type" full>
          <Select value={type} onChange={(e) => setType(e.target.value as FollowUpType)}>{FU_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
        </Field>
        <Field label="Due date" error={err.due}><Input type="date" value={due} min={TODAY} onChange={(e) => setDue(e.target.value)} /></Field>
        <Field label="Channel">
          <Select value={channel} onChange={(e) => setChannel(e.target.value as 'WhatsApp')}><option>WhatsApp</option><option>SMS</option><option>Call</option></Select>
        </Field>
        <Field label="Note" error={err.note} full><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Call when the photochromic lenses arrive" /></Field>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- Send WhatsApp */

export function SendWhatsAppModal({ open, onClose, customer }: Base & { customer: CustomerView }) {
  const { state, sendMessage, templateVars } = useStore();
  const toast = useToast();
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setText(''); setErr(''); } }, [open]);

  const send = () => {
    if (!text.trim()) { setErr('Write a message or pick a template.'); return; }
    sendMessage(customer.id, text.trim());
    toast('Message sent', { tone: 'whatsapp', body: `Delivered to ${customer.name} on WhatsApp.` });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Send WhatsApp message" subtitle={`${customer.name} · +91 ${customer.phone}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="whatsapp" onClick={send}>Send message</Button></>}>
      <span className="field__label">Templates</span>
      <div className="chip-grid">
        {state.templates.map((t) => (
          <button key={t.id} className="chip" onClick={() => { setText(fillTemplate(t.body, templateVars(customer.id))); setErr(''); }}>{t.name}</button>
        ))}
      </div>
      <Field label="Message" error={err} full>
        <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
      </Field>
    </Modal>
  );
}
