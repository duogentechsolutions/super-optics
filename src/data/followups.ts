import type { Appointment, Automation, FollowUp, QuickTemplate } from '../types';

const min = (m: number) => Date.now() - m * 60_000;

export function buildSeedFollowUps(): FollowUp[] {
  return [
    { id: 'f01', customerId: 'c04', type: 'Eye Check Reminder', dueDate: '2026-05-20', status: 'Sent', channel: 'WhatsApp', note: '6 months since last eye check (20 Nov 2025).', automated: true, sentAt: min(62) },
    { id: 'f02', customerId: 'c02', type: 'Eye Check Reminder', dueDate: '2026-09-22', status: 'Completed', channel: 'WhatsApp', note: 'Booked eye test for Sat 26 Sep via WhatsApp.', automated: true, sentAt: min(60 * 26) },
    { id: 'f03', customerId: 'c08', type: 'Eye Check Reminder', dueDate: '2026-02-11', status: 'Pending', channel: 'Call', note: 'Cataract watch. Prefers a phone call.', automated: true },
    { id: 'f04', customerId: 'c17', type: 'Lens Replacement', dueDate: '2026-06-20', status: 'Pending', channel: 'SMS', note: '12 months since progressive lens purchase.', automated: true },
    { id: 'f05', customerId: 'c23', type: 'Lens Replacement', dueDate: '2026-05-11', status: 'Pending', channel: 'SMS', note: '12 months since last lens purchase.', automated: true },
    { id: 'f06', customerId: 'c07', type: 'Eye Check Reminder', dueDate: '2026-09-23', status: 'Pending', channel: 'WhatsApp', note: 'Progressive wearer, 6 month review.', automated: true },
    { id: 'f07', customerId: 'c14', type: 'Birthday', dueDate: '2026-09-23', status: 'Pending', channel: 'WhatsApp', note: 'Include 10% birthday offer on sunglasses.', automated: true },
    { id: 'f08', customerId: 'c05', type: 'Post-Purchase Follow-up', dueDate: '2026-09-12', status: 'Completed', channel: 'WhatsApp', note: 'Customer happy with thin-index lenses.', automated: true, sentAt: min(60 * 24 * 11) },
    { id: 'f09', customerId: 'c09', type: 'Post-Purchase Follow-up', dueDate: '2026-09-25', status: 'Pending', channel: 'WhatsApp', note: 'Check comfort with new contact lenses.', automated: true },
    { id: 'f10', customerId: 'c03', type: 'Order Ready', dueDate: '2026-09-23', status: 'Sent', channel: 'WhatsApp', note: 'Order OC-2462 ready for collection.', automated: true, sentAt: min(32) },
    { id: 'f11', customerId: 'c10', type: 'Eye Check Reminder', dueDate: '2026-07-15', status: 'Pending', channel: 'WhatsApp', note: 'Review was due in July.', automated: true },
    { id: 'f12', customerId: 'c12', type: 'Custom Reminder', dueDate: '2026-09-25', status: 'Pending', channel: 'Call', note: 'Call when frames arrive from the lab.', automated: false },
    { id: 'f13', customerId: 'c06', type: 'Post-Purchase Follow-up', dueDate: '2026-09-30', status: 'Pending', channel: 'Call', note: 'Check progressive adaptation after new add.', automated: true },
    { id: 'f14', customerId: 'c19', type: 'Eye Check Reminder', dueDate: '2026-10-18', status: 'Pending', channel: 'Call', note: 'Diabetic, include retina check.', automated: true },
    { id: 'f15', customerId: 'c13', type: 'Eye Check Reminder', dueDate: '2027-01-02', status: 'Pending', channel: 'WhatsApp', note: '6 month review after progressive upgrade.', automated: true },
    { id: 'f16', customerId: 'c15', type: 'Lens Replacement', dueDate: '2026-09-27', status: 'Pending', channel: 'WhatsApp', note: 'Contact lens reorder reminder.', automated: true },
    { id: 'f17', customerId: 'c24', type: 'Order Ready', dueDate: '2026-09-22', status: 'Pending', channel: 'WhatsApp', note: 'Order OC-2463 ready, not yet notified.', automated: true },
    { id: 'f18', customerId: 'c16', type: 'Eye Check Reminder', dueDate: '2026-06-05', status: 'Pending', channel: 'WhatsApp', note: '6 months since last eye check.', automated: true },
    { id: 'f19', customerId: 'c21', type: 'Birthday', dueDate: '2026-10-12', status: 'Pending', channel: 'WhatsApp', note: '', automated: true },
    { id: 'f20', customerId: 'c11', type: 'Lens Replacement', dueDate: '2026-04-22', status: 'Completed', channel: 'WhatsApp', note: 'Customer came in today for new pair.', automated: true, sentAt: min(60 * 24 * 150) },
    { id: 'f21', customerId: 'c20', type: 'Custom Reminder', dueDate: '2026-09-24', status: 'Pending', channel: 'Call', note: 'Confirm refund for cancelled order OC-2461.', automated: false },
    { id: 'f22', customerId: 'c01', type: 'Eye Check Reminder', dueDate: '2027-03-12', status: 'Pending', channel: 'WhatsApp', note: '6 month review after moving to progressives.', automated: true },
  ];
}

export const seedAppointments: Appointment[] = [
  { id: 'a01', customerId: 'c01', date: '2026-09-12', time: '11:00 AM', type: 'Eye Test', status: 'Completed', source: 'WhatsApp' },
  { id: 'a02', customerId: 'c02', date: '2026-09-26', time: '11:30 AM', type: 'Eye Test', status: 'Scheduled', source: 'WhatsApp' },
  { id: 'a03', customerId: 'c07', date: '2026-09-24', time: '5:00 PM', type: 'Eye Test', status: 'Scheduled', source: 'Phone' },
  { id: 'a04', customerId: 'c12', date: '2026-09-25', time: '4:30 PM', type: 'Collection', status: 'Scheduled', source: 'Phone' },
  { id: 'a05', customerId: 'c10', date: '2026-09-26', time: '10:00 AM', type: 'Contact Lens Trial', status: 'Scheduled', source: 'WhatsApp' },
  { id: 'a06', customerId: 'c19', date: '2026-04-18', time: '10:30 AM', type: 'Eye Test', status: 'Completed', source: 'Walk-in' },
  { id: 'a07', customerId: 'c03', date: '2026-09-19', time: '6:00 PM', type: 'Eye Test', status: 'Completed', source: 'Walk-in' },
];

export const seedAutomations: Automation[] = [
  {
    id: 'au01', name: 'Eye Check Reminder', icon: 'eye', followUpType: 'Eye Check Reminder',
    trigger: 'After last eye examination', delay: '6 months', audience: 'Customers with a completed eye test',
    channel: 'WhatsApp', enabled: true, sentCount: 184,
    template: "Hi {{customer_name}} 👋\n\nIt's been 6 months since your last eye check-up at {{store_name}}.\n\nWould you like to book your next appointment?\n\n[Book Appointment]",
  },
  {
    id: 'au02', name: 'Lens Replacement Reminder', icon: 'lens', followUpType: 'Lens Replacement',
    trigger: 'After lens purchase', delay: '12 months', audience: 'Customers who bought lenses',
    channel: 'WhatsApp', enabled: true, sentCount: 96,
    template: "Hi {{customer_name}}, it has been a year since your last lenses from {{store_name}}. Lens coatings wear over time. Drop in for a free lens check anytime this week.",
  },
  {
    id: 'au03', name: 'Birthday Message', icon: 'cake', followUpType: 'Birthday',
    trigger: 'On customer birthday', delay: 'Same day, 9:00 AM', audience: 'All customers with a date of birth',
    channel: 'WhatsApp', enabled: true, sentCount: 212,
    template: "Happy birthday, {{customer_name}}! 🎂 Everyone at {{store_name}} wishes you a wonderful year. Enjoy 10% off sunglasses this week.",
  },
  {
    id: 'au04', name: 'Order Ready', icon: 'package', followUpType: 'Order Ready',
    trigger: 'Order status changes to Ready', delay: 'Immediately', audience: 'Customers with an active order',
    channel: 'WhatsApp', enabled: true, sentCount: 341,
    template: "Hi {{customer_name}}, your order {{order_number}} is ready for collection at {{store_name}}. We're open 10 AM – 9 PM. See you soon!",
  },
  {
    id: 'au05', name: 'Post-Purchase Follow-up', icon: 'heart', followUpType: 'Post-Purchase Follow-up',
    trigger: 'After purchase is collected', delay: '7 days', audience: 'Customers who collected an order',
    channel: 'WhatsApp', enabled: true, sentCount: 158,
    template: "Hi {{customer_name}}, how are you finding your new glasses? If anything feels off, reply here and we'll adjust the fit for free.",
  },
];

export const seedTemplates: QuickTemplate[] = [
  { id: 't1', name: 'Order Ready', body: 'Hi {{customer_name}}, your order {{order_number}} is ready for collection at {{store_name}}. 👓' },
  { id: 't2', name: 'Appointment Reminder', body: 'Hi {{customer_name}}, a reminder of your eye test at {{store_name}} on {{appointment_date}}. Reply 1 to confirm.' },
  { id: 't3', name: 'Thank You', body: 'Thank you for visiting {{store_name}}, {{customer_name}}! We hope you love your new glasses.' },
  { id: 't4', name: 'Follow-up', body: 'Hi {{customer_name}}, just checking in. How are your new lenses feeling?' },
  { id: 't5', name: 'Birthday', body: 'Happy birthday, {{customer_name}}! 🎂 Enjoy 10% off at {{store_name}} this week.' },
  { id: 't6', name: 'Custom Message', body: 'Hi {{customer_name}}, ' },
];
