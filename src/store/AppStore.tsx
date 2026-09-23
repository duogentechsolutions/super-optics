import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildSeedState, type AppState } from '../data';
import { STORE_ADDRESS } from '../data/conversations';
import type {
  Activity, Appointment, Automation, Customer, CustomerView, FollowUp, InteractiveBlock,
  Message, Order, OrderItem, OrderStatus, Prescription, Settings,
} from '../types';
import { TODAY, addDays, addMonths, fillTemplate, fmtDayLabel, firstName, uid } from '../lib/format';
import { buildCustomerViews } from '../lib/selectors';

const STORAGE_KEY = 'opticare-demo-state-v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* fall through to seed */
  }
  return buildSeedState();
}

type Mutator = (draft: AppState) => void;

export interface NewPurchase {
  customerId: string;
  items: OrderItem[];
  paymentMode: Order['paymentMode'];
  status: OrderStatus;
  sendConfirmation: boolean;
}

interface Store {
  state: AppState;
  customers: CustomerView[];
  customer: (id: string) => CustomerView | undefined;
  addCustomer: (c: Omit<Customer, 'id' | 'notes' | 'customerSince'>) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addNote: (customerId: string, text: string) => void;
  addPrescription: (p: Omit<Prescription, 'id'>) => { reminder?: FollowUp };
  addPurchase: (p: NewPurchase) => Order;
  setOrderStatus: (orderId: string, status: OrderStatus) => { notified: boolean };
  addAppointment: (a: Omit<Appointment, 'id' | 'status'>, notify?: boolean) => Appointment;
  completeAppointment: (id: string) => void;
  addFollowUp: (f: Omit<FollowUp, 'id' | 'status' | 'automated'>) => FollowUp;
  sendFollowUp: (id: string) => void;
  completeFollowUp: (id: string) => void;
  deleteFollowUp: (id: string) => void;
  sendMessage: (customerId: string, text: string, from?: Message['from'], interactive?: InteractiveBlock) => void;
  markInteractiveUsed: (conversationId: string, messageId: string) => void;
  markRead: (conversationId: string) => void;
  confirmWhatsAppBooking: (customerId: string, dateIso: string, time: string) => void;
  saveAutomation: (a: Automation) => void;
  toggleAutomation: (id: string) => void;
  updateTemplate: (id: string, body: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  templateVars: (customerId: string) => Record<string, string>;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — demo still works in memory */
    }
  }, [state]);

  const update = useCallback((fn: Mutator) => {
    setState((prev) => {
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const customers = useMemo(() => buildCustomerViews(state), [state]);

  const store = useMemo<Store>(() => {
    const nameOf = (d: AppState, id: string) => d.customers.find((c) => c.id === id)?.name ?? 'Customer';

    const log = (d: AppState, kind: Activity['kind'], text: string, customerId?: string) => {
      d.activity.unshift({ id: uid('ac'), kind, text, ts: Date.now(), customerId });
      d.activity = d.activity.slice(0, 40);
    };

    const vars = (d: AppState, customerId: string): Record<string, string> => {
      const c = d.customers.find((x) => x.id === customerId);
      const order = d.orders.filter((o) => o.customerId === customerId).sort((a, b) => b.date.localeCompare(a.date))[0];
      const appt = d.appointments.filter((a) => a.customerId === customerId && a.status === 'Scheduled').sort((a, b) => a.date.localeCompare(b.date))[0];
      return {
        customer_name: c ? firstName(c.name) : 'there',
        store_name: d.settings.business.name,
        order_number: order?.id ?? 'OC-0000',
        appointment_date: appt ? `${fmtDayLabel(appt.date)}, ${appt.time}` : fmtDayLabel(addDays(TODAY, 2)),
      };
    };

    const pushMessage = (d: AppState, customerId: string, msg: Omit<Message, 'id' | 'time'>) => {
      let conv = d.conversations.find((c) => c.customerId === customerId);
      if (!conv) {
        conv = { id: uid('cv'), customerId, messages: [], unread: 0 };
        d.conversations.unshift(conv);
      }
      conv.messages.push({ id: uid('m'), time: Date.now(), status: msg.from === 'store' ? 'delivered' : undefined, ...msg });
      if (msg.from === 'customer') conv.unread += 1;
    };

    const automation = (d: AppState, type: FollowUp['type']) => d.automations.find((a) => a.followUpType === type && a.enabled);

    const nextOrderId = (d: AppState) => {
      const max = Math.max(...d.orders.map((o) => Number(o.id.split('-')[1]) || 0));
      return `OC-${max + 1}`;
    };

    return {
      state,
      customers,
      customer: (id) => customers.find((c) => c.id === id),

      addCustomer: (input) => {
        const c: Customer = { ...input, id: uid('c'), customerSince: TODAY, notes: [] };
        update((d) => {
          d.customers.unshift(c);
          log(d, 'customer', `${c.name} added as a new customer`, c.id);
        });
        return c;
      },

      updateCustomer: (id, patch) =>
        update((d) => {
          const c = d.customers.find((x) => x.id === id);
          if (c) Object.assign(c, patch);
        }),

      addNote: (customerId, text) =>
        update((d) => {
          const c = d.customers.find((x) => x.id === customerId);
          c?.notes.unshift({ id: uid('n'), text, date: TODAY, author: d.settings.user.name });
        }),

      addPrescription: (p) => {
        const rx: Prescription = { ...p, id: uid('rx') };
        let reminder: FollowUp | undefined;
        update((d) => {
          d.prescriptions.unshift(rx);
          log(d, 'prescription', `Prescription recorded for ${nameOf(d, p.customerId)}`, p.customerId);
          if (automation(d, 'Eye Check Reminder')) {
            // replace any pending eye-check reminder with the new 6-month one
            d.followUps = d.followUps.filter((f) => !(f.customerId === p.customerId && f.type === 'Eye Check Reminder' && f.status === 'Pending'));
            reminder = {
              id: uid('f'), customerId: p.customerId, type: 'Eye Check Reminder', dueDate: addMonths(p.date, 6),
              status: 'Pending', channel: 'WhatsApp', note: 'Scheduled automatically from the new prescription.', automated: true,
            };
            d.followUps.push(reminder);
          }
        });
        return { reminder };
      },

      addPurchase: (p) => {
        const d0 = stateRef.current;
        const order: Order = {
          id: nextOrderId(d0),
          customerId: p.customerId,
          items: p.items,
          amount: p.items.reduce((s, i) => s + i.price * i.qty, 0),
          date: TODAY,
          status: p.status,
          paymentMode: p.paymentMode,
          expectedDate: p.status === 'Collected' ? undefined : addDays(TODAY, 4),
        };
        update((d) => {
          d.orders.unshift(order);
          for (const it of order.items) {
            const prod = d.products.find((x) => x.id === it.productId);
            if (prod) prod.stock = Math.max(0, prod.stock - it.qty);
          }
          log(d, 'purchase', `${nameOf(d, p.customerId)} purchased ${order.items[0]?.name}${order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}`, p.customerId);
          if (p.sendConfirmation) {
            const v = vars(d, p.customerId);
            const line = order.status === 'Collected'
              ? `Thank you for your purchase at ${v.store_name}, ${v.customer_name}! 🧾 Order ${order.id} · ₹${order.amount.toLocaleString('en-IN')}. We hope you love your new eyewear.`
              : `Hi ${v.customer_name}, we've received your order ${order.id} (₹${order.amount.toLocaleString('en-IN')}). We'll message you as soon as it's ready. Expected by ${fmtDayLabel(order.expectedDate!)}.`;
            pushMessage(d, p.customerId, { from: 'store', text: line });
          }
          if (order.status === 'Collected' && automation(d, 'Post-Purchase Follow-up')) {
            d.followUps.push({
              id: uid('f'), customerId: p.customerId, type: 'Post-Purchase Follow-up', dueDate: addDays(TODAY, 7),
              status: 'Pending', channel: 'WhatsApp', note: `Check in after order ${order.id}.`, automated: true,
            });
          }
        });
        return order;
      },

      setOrderStatus: (orderId, status) => {
        const notified = status === 'Ready' && !!automation(stateRef.current, 'Order Ready');
        update((d) => {
          const o = d.orders.find((x) => x.id === orderId);
          if (!o) return;
          o.status = status;
          const name = nameOf(d, o.customerId);
          if (status === 'Ready') {
            const auto = automation(d, 'Order Ready');
            if (auto) {
              const v = vars(d, o.customerId);
              pushMessage(d, o.customerId, { from: 'store', text: fillTemplate(auto.template, { ...v, order_number: o.id }) });
              auto.sentCount += 1;
              const pending = d.followUps.find((f) => f.customerId === o.customerId && f.type === 'Order Ready' && f.status === 'Pending');
              if (pending) Object.assign(pending, { status: 'Sent', sentAt: Date.now() });
              else d.followUps.push({ id: uid('f'), customerId: o.customerId, type: 'Order Ready', dueDate: TODAY, status: 'Sent', channel: 'WhatsApp', note: `Order ${o.id} ready for collection.`, automated: true, sentAt: Date.now() });
            }
            log(d, 'order', `${name}'s order ${o.id} marked Ready`, o.customerId);
          } else if (status === 'Collected') {
            d.followUps.filter((f) => f.customerId === o.customerId && f.type === 'Order Ready' && f.status !== 'Completed').forEach((f) => (f.status = 'Completed'));
            if (automation(d, 'Post-Purchase Follow-up')) {
              d.followUps.push({ id: uid('f'), customerId: o.customerId, type: 'Post-Purchase Follow-up', dueDate: addDays(TODAY, 7), status: 'Pending', channel: 'WhatsApp', note: `Check in after order ${o.id}.`, automated: true });
            }
            log(d, 'order', `${name} collected order ${o.id}`, o.customerId);
          } else {
            log(d, 'order', `Order ${o.id} for ${name} moved to ${status}`, o.customerId);
          }
        });
        return { notified };
      },

      addAppointment: (a, notify = true) => {
        const appt: Appointment = { ...a, id: uid('a'), status: 'Scheduled' };
        update((d) => {
          d.appointments.push(appt);
          log(d, 'appointment', `${nameOf(d, a.customerId)} booked ${a.type === 'Eye Test' ? 'an eye test' : a.type.toLowerCase()} for ${fmtDayLabel(a.date)}`, a.customerId);
          if (notify) {
            pushMessage(d, a.customerId, { from: 'store', text: `Appointment Confirmed ✅\n${a.type} · ${fmtDayLabel(a.date)} · ${a.time}\n${d.settings.business.name}, Anna Nagar` });
          }
          d.followUps.filter((f) => f.customerId === a.customerId && f.type === 'Eye Check Reminder' && f.status !== 'Completed' && f.dueDate <= addDays(TODAY, 7))
            .forEach((f) => { f.status = 'Completed'; f.note = `Appointment booked for ${fmtDayLabel(a.date)}.`; });
        });
        return appt;
      },

      completeAppointment: (id) =>
        update((d) => {
          const a = d.appointments.find((x) => x.id === id);
          if (!a) return;
          a.status = 'Completed';
          a.date = a.date > TODAY ? TODAY : a.date;
          log(d, 'appointment', `${nameOf(d, a.customerId)} visited the store for ${a.type.toLowerCase()}`, a.customerId);
        }),

      addFollowUp: (f) => {
        const fu: FollowUp = { ...f, id: uid('f'), status: 'Pending', automated: false };
        update((d) => {
          d.followUps.push(fu);
          log(d, 'followup', `${f.type} scheduled for ${nameOf(d, f.customerId)}`, f.customerId);
        });
        return fu;
      },

      sendFollowUp: (id) =>
        update((d) => {
          const f = d.followUps.find((x) => x.id === id);
          if (!f) return;
          f.status = 'Sent';
          f.sentAt = Date.now();
          const auto = d.automations.find((a) => a.followUpType === f.type);
          const tpl = auto?.template ?? `Hi {{customer_name}}, ${f.note || 'a quick reminder from {{store_name}}.'}`;
          if (auto) auto.sentCount += 1;
          pushMessage(d, f.customerId, { from: 'store', text: fillTemplate(tpl, vars(d, f.customerId)) });
          log(d, 'followup', `${nameOf(d, f.customerId)} ${f.type.toLowerCase()} sent`, f.customerId);
        }),

      completeFollowUp: (id) =>
        update((d) => {
          const f = d.followUps.find((x) => x.id === id);
          if (f) f.status = 'Completed';
        }),

      deleteFollowUp: (id) =>
        update((d) => {
          d.followUps = d.followUps.filter((f) => f.id !== id);
        }),

      sendMessage: (customerId, text, from = 'store', interactive) =>
        update((d) => {
          pushMessage(d, customerId, { from, text, interactive });
          if (from === 'store' && !interactive) {
            const conv = d.conversations.find((c) => c.customerId === customerId);
            if (conv) {
              conv.unread = 0;
              // move to top of the inbox
              d.conversations = [conv, ...d.conversations.filter((c) => c !== conv)];
            }
          }
        }),

      markInteractiveUsed: (conversationId, messageId) =>
        update((d) => {
          const m = d.conversations.find((c) => c.id === conversationId)?.messages.find((x) => x.id === messageId);
          if (m?.interactive) m.interactive.used = true;
        }),

      markRead: (conversationId) =>
        update((d) => {
          const c = d.conversations.find((x) => x.id === conversationId);
          if (c && c.unread) c.unread = 0;
        }),

      confirmWhatsAppBooking: (customerId, dateIso, time) =>
        update((d) => {
          d.appointments.push({ id: uid('a'), customerId, date: dateIso, time, type: 'Eye Test', status: 'Scheduled', source: 'WhatsApp' });
          pushMessage(d, customerId, { from: 'store', text: `Appointment Confirmed ✅\nEye Test · ${fmtDayLabel(dateIso)} · ${time}\n${d.settings.business.name}, ${STORE_ADDRESS.split(',').slice(1, 2).join('').trim()}` });
          d.followUps.filter((f) => f.customerId === customerId && f.type === 'Eye Check Reminder' && f.status !== 'Completed' && f.dueDate <= addDays(TODAY, 7))
            .forEach((f) => { f.status = 'Completed'; f.note = `Booked eye test for ${fmtDayLabel(dateIso)} via WhatsApp.`; });
          log(d, 'appointment', `${nameOf(d, customerId)} booked an eye test via WhatsApp`, customerId);
        }),

      saveAutomation: (a) =>
        update((d) => {
          const i = d.automations.findIndex((x) => x.id === a.id);
          if (i >= 0) d.automations[i] = a;
          else d.automations.push(a);
        }),

      toggleAutomation: (id) =>
        update((d) => {
          const a = d.automations.find((x) => x.id === id);
          if (a) a.enabled = !a.enabled;
        }),

      updateTemplate: (id, body) =>
        update((d) => {
          const t = d.templates.find((x) => x.id === id);
          if (t) t.body = body;
        }),

      updateSettings: (patch) =>
        update((d) => {
          d.settings = { ...d.settings, ...patch };
        }),

      templateVars: (customerId) => vars(stateRef.current, customerId),

      resetDemo: () => {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        setState(buildSeedState());
      },
    };
  }, [state, customers, update]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside AppStoreProvider');
  return s;
}
