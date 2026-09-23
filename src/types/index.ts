export type ID = string;

export interface Note {
  id: ID;
  text: string;
  date: string; // ISO date
  author: string;
}

export interface Customer {
  id: ID;
  name: string;
  phone: string; // 10 digit, formatted "98765 43210"
  email: string;
  gender: 'Male' | 'Female';
  dob: string; // YYYY-MM-DD
  area: string;
  customerSince: string; // YYYY-MM-DD
  preferredChannel: 'WhatsApp' | 'SMS' | 'Call';
  notes: Note[];
}

export interface EyeRx {
  sph: number;
  cyl: number;
  axis: number;
  add: number;
  pd: number;
  va: string;
}

export interface Prescription {
  id: ID;
  customerId: ID;
  date: string;
  optometrist: string;
  right: EyeRx;
  left: EyeRx;
  lensAdvice: string;
  notes: string;
}

export type ProductCategory = 'Frames' | 'Lenses' | 'Contact Lenses' | 'Accessories';
export type FrameShape = 'rect' | 'round' | 'aviator' | 'cateye' | 'wayfarer';

export interface Product {
  id: ID;
  name: string;
  brand: string;
  collection: string;
  category: ProductCategory;
  price: number;
  stock: number;
  shape?: FrameShape;
  tint: string; // hex used by product illustration
  description: string;
  group: string; // reporting group, e.g. "Ray-Ban Frames"
}

export type OrderStatus = 'Received' | 'Processing' | 'Ready' | 'Collected' | 'Cancelled';

export interface OrderItem {
  productId: ID;
  name: string;
  category: ProductCategory;
  price: number;
  qty: number;
}

export interface Order {
  id: ID;
  customerId: ID;
  items: OrderItem[];
  amount: number;
  date: string;
  status: OrderStatus;
  paymentMode: 'UPI' | 'Card' | 'Cash';
  expectedDate?: string;
  prescriptionId?: ID;
}

/** A purchase is an order viewed from the customer's side. */
export type Purchase = Order;

export type FollowUpType =
  | 'Eye Check Reminder'
  | 'Lens Replacement'
  | 'Birthday'
  | 'Order Ready'
  | 'Post-Purchase Follow-up'
  | 'Custom Reminder';

export type FollowUpStatus = 'Pending' | 'Sent' | 'Completed';

export interface FollowUp {
  id: ID;
  customerId: ID;
  type: FollowUpType;
  dueDate: string;
  status: FollowUpStatus;
  channel: 'WhatsApp' | 'SMS' | 'Call';
  note: string;
  automated: boolean;
  sentAt?: number;
}

export interface InteractiveBlock {
  kind: 'dates' | 'slots' | 'products';
  options: string[];
  used?: boolean;
  meta?: Record<string, string>;
}

export interface Message {
  id: ID;
  from: 'customer' | 'store' | 'system';
  text: string;
  time: number; // epoch ms
  status?: 'sent' | 'delivered' | 'read';
  interactive?: InteractiveBlock;
}

export interface Conversation {
  id: ID;
  customerId: ID;
  messages: Message[];
  unread: number;
}

export type AppointmentType = 'Eye Test' | 'Frame Fitting' | 'Contact Lens Trial' | 'Collection';

export interface Appointment {
  id: ID;
  customerId: ID;
  date: string;
  time: string;
  type: AppointmentType;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  source: 'WhatsApp' | 'Walk-in' | 'Phone';
}

export type AutomationIcon = 'eye' | 'lens' | 'cake' | 'package' | 'heart' | 'bell';

export interface Automation {
  id: ID;
  name: string;
  icon: AutomationIcon;
  trigger: string;
  delay: string;
  audience: string;
  channel: 'WhatsApp' | 'SMS';
  template: string;
  enabled: boolean;
  followUpType: FollowUpType;
  sentCount: number;
}

export type ActivityKind =
  | 'purchase'
  | 'appointment'
  | 'order'
  | 'message'
  | 'followup'
  | 'customer'
  | 'prescription';

export interface Activity {
  id: ID;
  kind: ActivityKind;
  text: string;
  ts: number;
  customerId?: ID;
}

export interface QuickTemplate {
  id: ID;
  name: string;
  body: string;
}

export interface Settings {
  business: {
    name: string;
    phone: string;
    email: string;
    address: string;
    hours: string;
  };
  notifications: {
    orderReady: boolean;
    dailySummary: boolean;
    overdueAlerts: boolean;
    newEnquiry: boolean;
  };
  automation: {
    sendWindowStart: string;
    sendWindowEnd: string;
    skipSundays: boolean;
    maxPerWeek: number;
  };
  user: {
    name: string;
    role: string;
    compactTables: boolean;
  };
}

export type CustomerType = 'New' | 'Returning';
export type CustomerStatus = 'Active' | 'Follow-up Due' | 'Inactive';

/** Values derived from the shared data — never stored. */
export interface CustomerView extends Customer {
  orders: Order[];
  prescriptions: Prescription[];
  appointments: Appointment[];
  followUps: FollowUp[];
  lastVisit: string;
  lastPurchase?: Order;
  latestRx?: Prescription;
  nextFollowUp?: FollowUp;
  totalSpent: number;
  visits: number;
  type: CustomerType;
  status: CustomerStatus;
  highValue: boolean;
}
