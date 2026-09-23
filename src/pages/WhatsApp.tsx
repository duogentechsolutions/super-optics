import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarPlus, Glasses, Headset, Info, MapPin, MessageCirclePlus, MoreVertical,
  Package, Send, ShieldCheck, Sparkles, User, X, Zap,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/ui/Toast';
import { Avatar, Badge, Button, EmptyState, Field, SearchInput, Select, Textarea } from '../components/ui/primitives';
import { CustomerStatusBadge, CustomerTypeBadge, OrderBadge } from '../components/ui/badges';
import { Modal } from '../components/ui/Modal';
import { ChatMessage, TypingBubble, dayDivider } from '../components/whatsapp/ChatMessage';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { TODAY, addDays, clock, fillTemplate, firstName, fmtDate, fmtDayLabel, inr, rx, timeAgo } from '../lib/format';
import { isOpenOrder } from '../lib/selectors';
import type { Message } from '../types';

const SLOTS = ['10:00 AM', '11:30 AM', '3:00 PM', '5:30 PM'];
const CANNED = ['Thank you! 👍', 'Okay, noted 🙏', 'Great, thanks for letting me know.', 'Sure, will do.'];

/** Next n store days after today (store is closed for eye tests on Sundays). */
function nextStoreDays(n: number): string[] {
  const out: string[] = [];
  let d = TODAY;
  while (out.length < n) {
    d = addDays(d, 1);
    if (new Date(d).getUTCDay() !== 0) out.push(d);
  }
  return out;
}

export default function WhatsApp() {
  const store = useStore();
  const { state, customer, customers, sendMessage, markInteractiveUsed, markRead, confirmWhatsAppBooking, templateVars } = store;
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const mobile = useMediaQuery('(max-width: 860px)');
  const wide = useMediaQuery('(min-width: 1320px)');

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [text, setText] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [newChat, setNewChat] = useState(false);
  const [newChatId, setNewChatId] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const cannedIdx = useRef(0);

  const paramId = params.get('c');
  const activeId = paramId ?? (mobile ? null : state.conversations[0]?.customerId ?? null);
  const active = activeId ? customer(activeId) : undefined;
  const conv = state.conversations.find((c) => c.customerId === activeId);

  const select = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set('c', id); else p.delete('c');
    setParams(p, { replace: !mobile });
    setMenu(false);
    setText('');
  };

  // Mark the open conversation as read whenever new customer messages land.
  useEffect(() => {
    if (conv && conv.unread > 0) markRead(conv.id);
  }, [conv, markRead]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv?.messages.length, typing, activeId]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return state.conversations
      .map((c) => ({ c, cust: customer(c.customerId), last: c.messages[c.messages.length - 1] }))
      .filter((x) => x.cust)
      .filter((x) => filter === 'all' || x.c.unread > 0)
      .filter((x) => !t || x.cust!.name.toLowerCase().includes(t) || x.cust!.phone.replace(/\s/g, '').includes(t.replace(/\s/g, '')) || x.c.messages.some((m) => m.text.toLowerCase().includes(t)))
      .sort((a, b) => (b.last?.time ?? 0) - (a.last?.time ?? 0));
  }, [state.conversations, q, filter, customer]);

  const unreadTotal = state.conversations.reduce((s, c) => s + c.unread, 0);

  /* ---------- simulated conversation engine ---------- */

  const storeReplies = (cid: string, fn: () => void, delay = 1100) => {
    setTyping(cid);
    window.setTimeout(() => {
      fn();
      setTyping((t) => (t === cid ? null : t));
    }, delay);
  };

  const askDates = (cid: string) => {
    const days = nextStoreDays(3);
    const meta: Record<string, string> = {};
    days.forEach((d) => { meta[fmtDayLabel(d)] = d; });
    storeReplies(cid, () => sendMessage(cid, 'Sure! Please select a date for your eye test 👇', 'store', { kind: 'dates', options: days.map(fmtDayLabel), meta }));
  };

  const quickAction = (kind: 'book' | 'frames' | 'order' | 'location' | 'team') => {
    if (!active) return;
    const cid = active.id;
    const s = store.state;
    if (kind === 'book') {
      sendMessage(cid, 'Hi, I want to book an eye test.', 'customer');
      askDates(cid);
    }
    if (kind === 'frames') {
      sendMessage(cid, 'Can I see some frames?', 'customer');
      const frames = s.products.filter((p) => p.category === 'Frames' && p.stock > 0).slice(0, 4).map((p) => p.id);
      storeReplies(cid, () => sendMessage(cid, 'Here are some of our most loved frames right now 👓', 'store', { kind: 'products', options: frames }));
    }
    if (kind === 'order') {
      sendMessage(cid, 'What is the status of my order?', 'customer');
      const orders = s.orders.filter((o) => o.customerId === cid && o.status !== 'Cancelled').sort((a, b) => b.date.localeCompare(a.date));
      const open = orders.find(isOpenOrder);
      const o = open ?? orders[0];
      let reply = `Hi ${firstName(active.name)}, we couldn't find an open order on your number. Visit us any time and we'll be happy to help!`;
      if (o?.status === 'Ready') reply = `Good news! 🎉 Your order ${o.id} (${o.items[0].name}) is ready for collection at OptiCare.`;
      else if (o?.status === 'Received' || o?.status === 'Processing') reply = `Your order ${o.id} (${o.items.map((i) => i.name).join(' + ')}) is currently *${o.status}*.${o.expectedDate ? ` Expected ready by ${fmtDayLabel(o.expectedDate)}.` : ''} We'll message you the moment it's ready.`;
      else if (o?.status === 'Collected') reply = `Your last order ${o.id} was collected on ${fmtDate(o.date)}. There are no open orders right now.`;
      storeReplies(cid, () => sendMessage(cid, reply, 'store'));
    }
    if (kind === 'location') {
      sendMessage(cid, 'Where is your store located?', 'customer');
      const b = s.settings.business;
      storeReplies(cid, () => sendMessage(cid, `📍 ${b.name}\n${b.address}\n\n🕘 ${b.hours}\n📞 ${b.phone}\n\nmaps.google.com/?q=OptiCare+Anna+Nagar`, 'store'));
    }
    if (kind === 'team') {
      sendMessage(cid, "I'd like to talk to someone from the team.", 'customer');
      storeReplies(cid, () => {
        sendMessage(cid, 'Conversation handed over to the store team', 'system');
        sendMessage(cid, `Hi ${firstName(active.name)}, this is ${s.settings.user.name.split(' ')[0]} from OptiCare 🙋. How can I help you today?`, 'store');
      }, 1500);
      toast('Chat handed to team', { body: `${active.name} asked to talk to a person.`, tone: 'info' });
    }
  };

  const onPick = (m: Message, option: string) => {
    if (!conv || !m.interactive || m.interactive.used) return;
    const cid = conv.customerId;
    const block = m.interactive;
    markInteractiveUsed(conv.id, m.id);

    if (block.kind === 'dates') {
      sendMessage(cid, option, 'customer');
      const iso = block.meta?.[option] ?? '';
      const taken = state.appointments.filter((a) => a.date === iso && a.status === 'Scheduled').map((a) => a.time);
      const free = SLOTS.filter((s) => !taken.includes(s)).slice(0, 3);
      storeReplies(cid, () => sendMessage(cid, `Available slots on ${option}:`, 'store', { kind: 'slots', options: free, meta: { date: option, iso } }));
    }
    if (block.kind === 'slots') {
      sendMessage(cid, option, 'customer');
      const iso = block.meta?.iso ?? addDays(TODAY, 3);
      storeReplies(cid, () => {
        confirmWhatsAppBooking(cid, iso, option);
        toast('Appointment confirmed ✅', { body: `${customer(cid)?.name} · Eye test · ${fmtDayLabel(iso)}, ${option}`, tone: 'success' });
      });
    }
    if (block.kind === 'products') {
      const p = state.products.find((x) => x.id === option);
      if (!p) return;
      sendMessage(cid, `I like the ${p.name}`, 'customer');
      storeReplies(cid, () => sendMessage(cid, `Great choice! The ${p.name} (${p.collection}) is ${inr(p.price)} and in stock ✨\n\nWould you like to come in for a free trial fitting? Tap "Book Appointment" any time.`, 'store'));
    }
  };

  const send = () => {
    const body = text.trim();
    if (!body || !active) return;
    const cid = active.id;
    sendMessage(cid, body, 'store');
    setText('');
    // Simulated customer acknowledgement so the thread feels alive.
    window.setTimeout(() => {
      sendMessage(cid, CANNED[cannedIdx.current++ % CANNED.length], 'customer');
    }, 2600);
  };

  const insertTemplate = (body: string) => {
    if (!active) return;
    setText(fillTemplate(body, templateVars(active.id)));
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  };

  const startChat = () => {
    if (!newChatId) return;
    setNewChat(false);
    select(newChatId);
    setNewChatId('');
  };

  /* ---------- render ---------- */

  const showList = !mobile || !activeId;
  const showChat = !mobile || !!activeId;
  const nextAppt = active?.appointments.filter((a) => a.status === 'Scheduled' && a.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date))[0];
  const openOrder = active?.orders.filter(isOpenOrder).sort((a, b) => b.date.localeCompare(a.date))[0];

  let lastDay = '';

  return (
    <div className={`wa ${wide && showInfo && active ? 'wa--info' : ''}`}>
      {showList && (
        <aside className="wa-list">
          <div className="wa-list__head">
            <div className="wa-list__title">
              <h1>WhatsApp</h1>
              <button className="icon-btn" data-tip="New chat" onClick={() => setNewChat(true)} aria-label="New chat"><MessageCirclePlus size={18} /></button>
            </div>
            <div className="sim-note"><ShieldCheck size={14} /> Simulation — no messages leave this demo</div>
            <SearchInput value={q} onChange={setQ} placeholder="Search conversations" />
            <div className="chip-row">
              <button className={`chip ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`chip ${filter === 'unread' ? 'is-active' : ''}`} onClick={() => setFilter('unread')}>Unread {unreadTotal > 0 && <b>{unreadTotal}</b>}</button>
            </div>
          </div>
          <div className="wa-list__items">
            {list.length === 0 && (
              <EmptyState icon={<MessageCirclePlus size={22} />} title={q ? 'No matching chats' : 'No unread chats'} body={q ? `Nothing matches "${q}".` : "You're all caught up."} />
            )}
            {list.map(({ c, cust, last }) => (
              <button key={c.id} className={`wa-item ${c.customerId === activeId ? 'is-active' : ''} ${c.unread ? 'is-unread' : ''}`} onClick={() => select(c.customerId)}>
                <Avatar name={cust!.name} size={42} />
                <span className="wa-item__main">
                  <span className="wa-item__top">
                    <strong>{cust!.name}</strong>
                    <time>{last ? timeAgo(last.time).replace(' ago', '') : ''}</time>
                  </span>
                  <span className="wa-item__bottom">
                    <span className="wa-item__preview">
                      {last?.from === 'store' && 'You: '}
                      {last?.interactive ? `${last.text} [${last.interactive.kind === 'products' ? 'products' : last.interactive.options.join(' · ')}]` : last?.text.replace(/\n+/g, ' ')}
                    </span>
                    {c.unread > 0 && <span className="wa-item__badge">{c.unread}</span>}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>
      )}

      {showChat && (
        <section className="wa-chat">
          {!active ? (
            <div className="wa-chat__empty">
              <EmptyState icon={<MessageCirclePlus size={24} />} title="Select a conversation" body="Pick a chat on the left, or start a new one." />
            </div>
          ) : (
            <>
              <header className="wa-chat__head">
                {mobile && <button className="icon-btn" onClick={() => select(null)} aria-label="Back to chats"><ArrowLeft size={20} /></button>}
                <button className="wa-chat__who" onClick={() => nav(`/customers/${active.id}`)}>
                  <Avatar name={active.name} size={38} />
                  <span>
                    <strong>{active.name}</strong>
                    <small>{typing === active.id ? <em className="typing-text">typing…</em> : `+91 ${active.phone}`}</small>
                  </span>
                </button>
                <div className="wa-chat__actions">
                  {wide && (
                    <button className={`icon-btn ${showInfo ? 'is-active' : ''}`} data-tip="Customer details" onClick={() => setShowInfo((v) => !v)} aria-label="Toggle customer details"><Info size={18} /></button>
                  )}
                  <div className="menu-wrap">
                    <button className="icon-btn" onClick={() => setMenu((v) => !v)} aria-label="More options" aria-expanded={menu}><MoreVertical size={18} /></button>
                    {menu && (
                      <>
                        <div className="menu-scrim" onClick={() => setMenu(false)} />
                        <div className="menu" role="menu">
                          <button onClick={() => nav(`/customers/${active.id}`)}><User size={15} /> View customer profile</button>
                          <button onClick={() => nav(`/customers/${active.id}?tab=appointments`)}><CalendarPlus size={15} /> Appointments</button>
                          {openOrder && <button onClick={() => nav(`/orders?open=${openOrder.id}`)}><Package size={15} /> Open order {openOrder.id}</button>}
                          <button onClick={() => { setMenu(false); toast('Chat marked as resolved', { tone: 'info' }); }}><ShieldCheck size={15} /> Mark as resolved</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </header>

              <div className="wa-chat__body" ref={scroller}>
                <div className="wa-encrypt">Messages in this demo are simulated. Customers see OptiCare as a verified business account.</div>
                {(conv?.messages ?? []).length === 0 && (
                  <div className="wa-system">Start the conversation with {firstName(active.name)} — try a quick reply below.</div>
                )}
                {(conv?.messages ?? []).map((m) => {
                  const day = dayDivider(m.time);
                  const showDay = day !== lastDay;
                  lastDay = day;
                  return (
                    <Fragment key={m.id}>
                      {showDay && <div className="wa-day"><span>{day}</span></div>}
                      <ChatMessage m={m} products={state.products} onPick={onPick} />
                    </Fragment>
                  );
                })}
                {typing === active.id && <TypingBubble />}
              </div>

              <div className="wa-sim">
                <span className="wa-sim__label"><Zap size={13} /> Simulate customer taps</span>
                <div className="wa-sim__row">
                  <button className="qa" onClick={() => quickAction('book')} disabled={!!typing}><CalendarPlus size={15} /> Book Appointment</button>
                  <button className="qa" onClick={() => quickAction('frames')} disabled={!!typing}><Glasses size={15} /> Browse Frames</button>
                  <button className="qa" onClick={() => quickAction('order')} disabled={!!typing}><Package size={15} /> Check Order</button>
                  <button className="qa" onClick={() => quickAction('location')} disabled={!!typing}><MapPin size={15} /> Store Location</button>
                  <button className="qa" onClick={() => quickAction('team')} disabled={!!typing}><Headset size={15} /> Talk to Team</button>
                </div>
              </div>

              <div className="wa-composer">
                <div className="wa-templates" aria-label="Quick replies">
                  <span className="wa-templates__label"><Sparkles size={13} /> Quick replies</span>
                  {state.templates.map((t) => (
                    <button key={t.id} className="chip chip--sm" onClick={() => insertTemplate(t.body)} data-tip={t.body.slice(0, 60) + (t.body.length > 60 ? '…' : '')}>{t.name}</button>
                  ))}
                </div>
                <div className="wa-composer__row">
                  <Textarea
                    ref={inputRef}
                    rows={1}
                    value={text}
                    placeholder={`Message ${firstName(active.name)}…`}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                    }}
                  />
                  {text && <button className="icon-btn" onClick={() => setText('')} aria-label="Clear message"><X size={16} /></button>}
                  <button className="wa-send" onClick={send} disabled={!text.trim()} aria-label="Send message"><Send size={18} /></button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {wide && showInfo && active && (
        <aside className="wa-info">
          <div className="wa-info__head">
            <Avatar name={active.name} size={64} />
            <h3>{active.name}</h3>
            <p>+91 {active.phone}</p>
            <div className="badge-row">
              <CustomerTypeBadge c={active} />
              <CustomerStatusBadge status={active.status} />
            </div>
          </div>
          <dl className="wa-info__facts">
            <div><dt>Customer since</dt><dd>{fmtDate(active.customerSince)}</dd></div>
            <div><dt>Last visit</dt><dd>{fmtDate(active.lastVisit)}</dd></div>
            <div><dt>Total spent</dt><dd>{inr(active.totalSpent)}</dd></div>
            <div><dt>Visits</dt><dd>{active.visits}</dd></div>
          </dl>
          {active.latestRx && (
            <div className="wa-info__block">
              <h4>Latest prescription · {fmtDate(active.latestRx.date)}</h4>
              <div className="mini-rx">
                <span>OD</span><span>{rx(active.latestRx.right.sph)}</span><span>{rx(active.latestRx.right.cyl)}</span><span>×{active.latestRx.right.axis}</span>
                <span>OS</span><span>{rx(active.latestRx.left.sph)}</span><span>{rx(active.latestRx.left.cyl)}</span><span>×{active.latestRx.left.axis}</span>
              </div>
            </div>
          )}
          <div className="wa-info__block">
            <h4>Next appointment</h4>
            {nextAppt ? <p className="strong">{nextAppt.type} · {fmtDayLabel(nextAppt.date)}, {nextAppt.time} <Badge tone="green">{nextAppt.source}</Badge></p> : <p className="muted">None booked</p>}
          </div>
          <div className="wa-info__block">
            <h4>Open order</h4>
            {openOrder ? (
              <button className="link-row" onClick={() => nav(`/orders?open=${openOrder.id}`)}>
                <span>{openOrder.id} · {openOrder.items[0].name}</span>
                <OrderBadge status={openOrder.status} />
              </button>
            ) : <p className="muted">No open orders</p>}
          </div>
          <div className="wa-info__block">
            <h4>Next follow-up</h4>
            {active.nextFollowUp ? <p className="strong">{active.nextFollowUp.type} · {fmtDate(active.nextFollowUp.dueDate)}</p> : <p className="muted">Nothing scheduled</p>}
          </div>
          <Button variant="secondary" icon={<User size={15} />} onClick={() => nav(`/customers/${active.id}`)}>Open full profile</Button>
          {conv && conv.messages.length > 0 && <p className="muted small">Last message {clock(conv.messages[conv.messages.length - 1].time)}</p>}
        </aside>
      )}

      <Modal
        open={newChat}
        onClose={() => setNewChat(false)}
        title="Start a new chat"
        subtitle="Pick a customer to message on WhatsApp"
        size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setNewChat(false)}>Cancel</Button>
          <Button variant="whatsapp" onClick={startChat} disabled={!newChatId}>Open chat</Button>
        </>}
      >
        <Field label="Customer">
          <Select value={newChatId} onChange={(e) => setNewChatId(e.target.value)}>
            <option value="">Select a customer…</option>
            {[...customers].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
            ))}
          </Select>
        </Field>
      </Modal>
    </div>
  );
}
