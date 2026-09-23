import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, BellPlus, CalendarCheck, CalendarPlus, Eye, FilePlus2, Mail, MapPin, MessageCircle,
  Pencil, Phone, ShoppingBag, StickyNote, Send, Cake,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/ui/Toast';
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Stat, Tabs, Textarea } from '../components/ui/primitives';
import { CustomerStatusBadge, CustomerTypeBadge, OrderBadge, followUpIcon } from '../components/ui/badges';
import {
  AddFollowUpModal, AddPrescriptionModal, AddPurchaseModal, BookAppointmentModal, CustomerFormModal, SendWhatsAppModal,
} from '../components/customers/CustomerModals';
import { RxSlip, RxTimeline } from '../components/prescriptions/Rx';
import { OrderDetailModal } from '../components/orders/OrderDetail';
import { clock, fmtDate, fmtDateLong, fmtDayLabel, fmtMonthYear, inr, relativeDay, TODAY, diffDays } from '../lib/format';
import { followUpBucket } from '../lib/selectors';
import type { Order } from '../types';

const TABS = ['Overview', 'Prescription', 'Purchase History', 'Appointments', 'Communication', 'Notes'] as const;
type Tab = (typeof TABS)[number];
type ModalKey = 'purchase' | 'rx' | 'appt' | 'followup' | 'whatsapp' | 'edit' | null;

export default function CustomerProfile() {
  const { id = '' } = useParams();
  const { customer, sendFollowUp, completeAppointment, addNote, state } = useStore();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const c = customer(id);
  const tab = (TABS.find((t) => t.toLowerCase().replace(' ', '-') === params.get('tab')) ?? 'Overview') as Tab;
  const [modal, setModal] = useState<ModalKey>(null);
  const [rxId, setRxId] = useState<string>();
  const [order, setOrder] = useState<Order>();
  const [note, setNote] = useState('');

  useEffect(() => setRxId(undefined), [id]);

  if (!c) {
    return (
      <div className="page">
        <EmptyState icon={<Eye size={22} />} title="Customer not found" body="This profile may have been removed when the demo data was reset."
          action={<Button onClick={() => nav('/customers')}>Back to customers</Button>} />
      </div>
    );
  }

  const setTab = (t: Tab) => {
    const p = new URLSearchParams(params);
    if (t === 'Overview') p.delete('tab'); else p.set('tab', t.toLowerCase().replace(' ', '-'));
    setParams(p, { replace: true });
  };

  const activeRx = c.prescriptions.find((p) => p.id === rxId) ?? c.latestRx;
  const activeIdx = activeRx ? c.prescriptions.indexOf(activeRx) : -1;
  const conv = state.conversations.find((x) => x.customerId === c.id);
  const upcoming = c.appointments.filter((a) => a.status === 'Scheduled').sort((a, b) => a.date.localeCompare(b.date));
  const pendingFU = c.followUps.filter((f) => f.status === 'Pending');
  const bday = c.dob ? `${TODAY.slice(0, 4)}-${c.dob.slice(5)}` : '';
  const birthdaySoon = !!bday && diffDays(bday, TODAY) >= 0 && diffDays(bday, TODAY) <= 30;

  const sendFU = (fid: string, type: string) => {
    sendFollowUp(fid);
    toast('Message sent', { tone: 'whatsapp', body: `${type} sent to ${c.name}.` });
  };

  return (
    <div className="page profile">
      <Link to="/customers" className="back-link"><ArrowLeft size={16} /> Customers</Link>

      <section className="profile-head">
        <div className="profile-head__id">
          <Avatar name={c.name} size={64} />
          <div>
            <h1>{c.name}</h1>
            <div className="profile-head__meta">
              <span><Phone size={14} /> +91 {c.phone}</span>
              <span><Mail size={14} /> {c.email}</span>
              <span><MapPin size={14} /> {c.area}</span>
              {birthdaySoon && <span className="is-bday"><Cake size={14} /> Birthday {bday === TODAY ? 'today' : fmtDate(bday)}</span>}
            </div>
            <div className="badge-row">
              <CustomerTypeBadge c={c} />
              <CustomerStatusBadge status={c.status} />
            </div>
          </div>
        </div>
        <dl className="profile-head__facts">
          <div><dt>Customer since</dt><dd>{fmtMonthYear(c.customerSince)}</dd></div>
          <div><dt>Last visit</dt><dd>{fmtDateLong(c.lastVisit)}</dd></div>
          <div><dt>Visits</dt><dd>{c.visits}</dd></div>
        </dl>
      </section>

      <div className="action-bar">
        <Button variant="primary" icon={<ShoppingBag size={16} />} onClick={() => setModal('purchase')}>Add purchase</Button>
        <Button icon={<FilePlus2 size={16} />} onClick={() => setModal('rx')}>Add prescription</Button>
        <Button icon={<CalendarPlus size={16} />} onClick={() => setModal('appt')}>Book appointment</Button>
        <Button icon={<BellPlus size={16} />} onClick={() => setModal('followup')}>Add follow-up</Button>
        <Button variant="whatsapp" icon={<MessageCircle size={16} />} onClick={() => setModal('whatsapp')}>Send WhatsApp</Button>
        <Button variant="ghost" icon={<Pencil size={16} />} onClick={() => setModal('edit')}>Edit customer</Button>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} counts={{ Prescription: c.prescriptions.length, 'Purchase History': c.orders.length, Appointments: c.appointments.length, Notes: c.notes.length }} />

      {tab === 'Overview' && (
        <div className="profile-grid">
          <Card className="span-2">
            <div className="stat-row">
              <Stat label="Total purchases" value={c.orders.filter((o) => o.status !== 'Cancelled').length} />
              <Stat label="Last purchase" value={c.lastPurchase ? fmtDate(c.lastPurchase.date) : '—'} sub={c.lastPurchase?.items.map((i) => i.name).join(' + ')} />
              <Stat label="Total spent" value={inr(c.totalSpent)} sub={c.highValue ? 'High value customer' : undefined} />
              <Stat label="Next follow-up" value={c.nextFollowUp ? relativeDay(c.nextFollowUp.dueDate) : 'None'} sub={c.nextFollowUp?.type} />
              <Stat label="Customer type" value={c.type} sub={`${c.visits} visit${c.visits > 1 ? 's' : ''}`} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Current prescription" action={c.latestRx && <button className="link-btn" onClick={() => setTab('Prescription')}>View history</button>} />
            {c.latestRx ? <RxSlip p={c.latestRx} /> : (
              <EmptyState icon={<Eye size={20} />} title="No prescription yet" body="Record the eye test to start eye-check reminders." action={<Button size="sm" onClick={() => setModal('rx')}>Add prescription</Button>} />
            )}
          </Card>
          <div className="stack-gap">
            <Card>
              <CardHeader title="Upcoming" />
              {upcoming.length === 0 && pendingFU.length === 0 && <p className="muted">Nothing scheduled.</p>}
              <ul className="mini-list">
                {upcoming.map((a) => (
                  <li key={a.id}>
                    <CalendarCheck size={16} className="text-blue" />
                    <span><strong>{a.type}</strong><small>{fmtDayLabel(a.date)} · {a.time} · via {a.source}</small></span>
                  </li>
                ))}
                {pendingFU.slice(0, 3).map((f) => {
                  const Icon = followUpIcon[f.type];
                  const b = followUpBucket(f);
                  return (
                    <li key={f.id}>
                      <Icon size={16} className={b === 'overdue' ? 'text-red' : 'text-amber'} />
                      <span><strong>{f.type}</strong><small>{relativeDay(f.dueDate)} · {f.channel}</small></span>
                      <Button size="sm" variant="ghost" icon={<Send size={14} />} onClick={() => sendFU(f.id, f.type)}>Send now</Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card>
              <CardHeader title="Latest note" action={<button className="link-btn" onClick={() => setTab('Notes')}>All notes</button>} />
              {c.notes[0] ? <p className="note-text">{c.notes[0].text}<small>{c.notes[0].author} · {fmtDate(c.notes[0].date)}</small></p> : <p className="muted">No notes yet.</p>}
            </Card>
          </div>
        </div>
      )}

      {tab === 'Prescription' && (
        c.prescriptions.length === 0 ? (
          <Card><EmptyState icon={<Eye size={22} />} title="No prescriptions recorded" body="Add the first prescription after the eye test." action={<Button variant="primary" onClick={() => setModal('rx')}>Add prescription</Button>} /></Card>
        ) : (
          <div className="rx-layout">
            <Card>
              <CardHeader title="Prescription history" subtitle={`${c.prescriptions.length} records`} />
              <RxTimeline items={c.prescriptions} activeId={activeRx?.id} onSelect={setRxId} />
            </Card>
            <Card>
              <CardHeader title={activeIdx === 0 ? 'Current prescription' : `Prescription from ${fmtDate(activeRx!.date)}`} subtitle={`Optometrist: ${activeRx!.optometrist}`} />
              <RxSlip p={activeRx!} compare={c.prescriptions[activeIdx + 1]} />
            </Card>
          </div>
        )
      )}

      {tab === 'Purchase History' && (
        <Card pad={false}>
          {c.orders.length === 0 ? (
            <EmptyState icon={<ShoppingBag size={22} />} title="No purchases yet" body="Record the first purchase to start post-purchase follow-ups." action={<Button variant="primary" onClick={() => setModal('purchase')}>Add purchase</Button>} />
          ) : (
            <ul className="purchases">
              {c.orders.map((o) => (
                <li key={o.id}>
                  <button onClick={() => setOrder(o)}>
                    <span className="purchases__date">{fmtDate(o.date)}<small>{o.id}</small></span>
                    <span className="purchases__items">{o.items.map((i) => <span key={i.productId}>{i.qty > 1 ? `${i.qty} × ` : ''}{i.name}</span>)}</span>
                    <strong>{inr(o.amount)}</strong>
                    <OrderBadge status={o.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'Appointments' && (
        <Card pad={false}>
          {c.appointments.length === 0 ? (
            <EmptyState icon={<CalendarCheck size={22} />} title="No appointments" body="Book an eye test or fitting, or let the customer book on WhatsApp." action={<Button variant="primary" onClick={() => setModal('appt')}>Book appointment</Button>} />
          ) : (
            <ul className="purchases">
              {c.appointments.map((a) => (
                <li key={a.id}>
                  <div className="purchases__row">
                    <span className="purchases__date">{fmtDate(a.date)}<small>{a.time}</small></span>
                    <span className="purchases__items"><span>{a.type}</span><small className="muted">Booked via {a.source}</small></span>
                    <Badge tone={a.status === 'Completed' ? 'green' : a.status === 'Cancelled' ? 'red' : 'blue'} dot>{a.status}</Badge>
                    {a.status === 'Scheduled' ? (
                      <Button size="sm" onClick={() => { completeAppointment(a.id); toast('Visit recorded', { body: `${c.name} checked in for ${a.type.toLowerCase()}.` }); }}>Mark visited</Button>
                    ) : <span />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'Communication' && (
        <div className="profile-grid">
          <Card>
            <CardHeader title="Follow-ups" subtitle="Automated and manual reminders" action={<Button size="sm" icon={<BellPlus size={14} />} onClick={() => setModal('followup')}>Add</Button>} />
            {c.followUps.length === 0 ? <p className="muted">No follow-ups yet.</p> : (
              <ul className="mini-list">
                {[...c.followUps].reverse().map((f) => {
                  const Icon = followUpIcon[f.type];
                  return (
                    <li key={f.id}>
                      <Icon size={16} className="muted" />
                      <span><strong>{f.type}</strong><small>{fmtDate(f.dueDate)} · {f.channel}{f.note ? ` · ${f.note}` : ''}</small></span>
                      {f.status === 'Pending'
                        ? <Button size="sm" variant="ghost" icon={<Send size={14} />} onClick={() => sendFU(f.id, f.type)}>Send</Button>
                        : <Badge tone={f.status === 'Sent' ? 'blue' : 'green'}>{f.status}</Badge>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="WhatsApp" subtitle={conv ? `${conv.messages.length} messages` : 'No conversation yet'} action={<Button size="sm" variant="whatsapp" icon={<MessageCircle size={14} />} onClick={() => nav(`/whatsapp?c=${c.id}`)}>Open chat</Button>} />
            {conv ? (
              <ul className="msg-preview">
                {conv.messages.slice(-4).map((m) => (
                  <li key={m.id} className={`is-${m.from}`}><p>{m.text}</p><small>{clock(m.time)}</small></li>
                ))}
              </ul>
            ) : <p className="muted">Send a message to start the conversation.</p>}
          </Card>
        </div>
      )}

      {tab === 'Notes' && (
        <Card>
          <div className="note-form">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note about preferences, fit, or anything the team should know…" />
            <Button variant="primary" icon={<StickyNote size={16} />} disabled={!note.trim()} onClick={() => { addNote(c.id, note.trim()); setNote(''); toast('Note added'); }}>Add note</Button>
          </div>
          <ul className="notes">
            {c.notes.map((n) => <li key={n.id}><p>{n.text}</p><small>{n.author} · {fmtDate(n.date)}</small></li>)}
            {c.notes.length === 0 && <li className="muted">No notes yet.</li>}
          </ul>
        </Card>
      )}

      <AddPurchaseModal open={modal === 'purchase'} onClose={() => setModal(null)} customer={c} />
      <AddPrescriptionModal open={modal === 'rx'} onClose={() => setModal(null)} customer={c} />
      <BookAppointmentModal open={modal === 'appt'} onClose={() => setModal(null)} customer={c} />
      <AddFollowUpModal open={modal === 'followup'} onClose={() => setModal(null)} customer={c} />
      <SendWhatsAppModal open={modal === 'whatsapp'} onClose={() => setModal(null)} customer={c} />
      <CustomerFormModal open={modal === 'edit'} onClose={() => setModal(null)} customer={c} />
      <OrderDetailModal order={order} onClose={() => setOrder(undefined)} />
    </div>
  );
}
