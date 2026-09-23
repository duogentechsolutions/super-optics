import type {
  Activity, Appointment, Automation, Conversation, Customer, FollowUp,
  Order, Prescription, Product, QuickTemplate, Settings,
} from '../types';
import { seedCustomers } from './customers';
import { seedPrescriptions } from './prescriptions';
import { seedOrders } from './orders';
import { buildSeedFollowUps, seedAppointments, seedAutomations, seedTemplates } from './followups';
import { buildSeedActivity, buildSeedConversations, STORE_ADDRESS } from './conversations';
import { seedProducts } from './products';

export interface AppState {
  customers: Customer[];
  prescriptions: Prescription[];
  orders: Order[];
  followUps: FollowUp[];
  conversations: Conversation[];
  products: Product[];
  appointments: Appointment[];
  automations: Automation[];
  templates: QuickTemplate[];
  activity: Activity[];
  settings: Settings;
}

export const seedSettings: Settings = {
  business: {
    name: 'OptiCare',
    phone: '+91 44 2626 4040',
    email: 'hello@opticare.in',
    address: STORE_ADDRESS,
    hours: 'Mon – Sat, 10:00 AM – 9:00 PM · Sun, 11:00 AM – 7:00 PM',
  },
  notifications: { orderReady: true, dailySummary: true, overdueAlerts: true, newEnquiry: false },
  automation: { sendWindowStart: '09:00', sendWindowEnd: '20:00', skipSundays: false, maxPerWeek: 2 },
  user: { name: 'Ramesh Iyer', role: 'Owner', compactTables: false },
};

/** Builds a fresh copy of the demo data. Used on first load and on reset. */
export function buildSeedState(): AppState {
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
  return {
    customers: clone(seedCustomers),
    prescriptions: clone(seedPrescriptions),
    orders: clone(seedOrders),
    followUps: buildSeedFollowUps(),
    conversations: buildSeedConversations(),
    products: clone(seedProducts),
    appointments: clone(seedAppointments),
    automations: clone(seedAutomations),
    templates: clone(seedTemplates),
    activity: buildSeedActivity(),
    settings: clone(seedSettings),
  };
}
