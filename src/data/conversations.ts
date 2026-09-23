import type { Activity, Conversation, Message } from '../types';

const ago = (m: number) => Date.now() - m * 60_000;
let n = 0;
const c = (from: Message['from'], text: string, minutesAgo: number, extra: Partial<Message> = {}): Message => ({
  id: `m${++n}`,
  from,
  text,
  time: ago(minutesAgo),
  status: from === 'store' ? 'read' : undefined,
  ...extra,
});

export const STORE_ADDRESS = '14, 2nd Avenue, Anna Nagar, Chennai 600040';

export function buildSeedConversations(): Conversation[] {
  n = 0;
  return [
    {
      id: 'cv01', customerId: 'c01', unread: 1, messages: [
        c('store', 'Hi Arun, your Ray-Ban RB123 with progressive lenses is ready. Thank you for choosing OptiCare! 👓', 60 * 24 * 11),
        c('customer', 'Collected, thanks. Feels great.', 60 * 24 * 11 - 90),
        c('customer', 'Hi, I want to book an eye test.', 9),
        c('store', 'Sure! Please select a date.', 8),
        c('customer', 'Saturday', 6),
        c('store', 'Available slots:', 5, { interactive: { kind: 'slots', options: ['10:00 AM', '11:30 AM', '3:00 PM'], meta: { date: 'Sat 26 Sep', iso: '2026-09-26', for: 'Eye Test' } } }),
      ],
    },
    {
      id: 'cv02', customerId: 'c02', unread: 0, messages: [
        c('store', "Hi Priya 👋\n\nIt's been 6 months since your last eye check-up at OptiCare.\n\nWould you like to book your next appointment?", 60 * 26),
        c('customer', 'Yes please. Weekend works best.', 60 * 2),
        c('store', 'Available dates', 58, { interactive: { kind: 'dates', options: ['Thu 24 Sep', 'Fri 25 Sep', 'Sat 26 Sep'], used: true } }),
        c('customer', 'Sat 26 Sep', 17),
        c('store', 'Available slots:', 16, { interactive: { kind: 'slots', options: ['10:00 AM', '11:30 AM', '3:00 PM'], used: true } }),
        c('customer', '11:30 AM', 15),
        c('store', 'Appointment Confirmed ✅\nEye Test · Sat 26 Sep · 11:30 AM\nOptiCare, Anna Nagar', 15),
      ],
    },
    {
      id: 'cv03', customerId: 'c03', unread: 0, messages: [
        c('customer', 'How long for the photochromic lenses?', 60 * 24 * 3),
        c('store', 'About 4 days, Karthik. We will message you the moment they are ready.', 60 * 24 * 3 - 20),
        c('store', 'Hi Karthik, your order OC-2462 is ready for collection at OptiCare. We are open 10 AM – 9 PM.', 32),
      ],
    },
    {
      id: 'cv04', customerId: 'c04', unread: 0, messages: [
        c('store', "Hi Divya 👋\n\nIt's been 6 months since your last eye check-up at OptiCare.\n\nWould you like to book your next appointment?", 62),
      ],
    },
    {
      id: 'cv05', customerId: 'c05', unread: 0, messages: [
        c('store', 'Hi Rahul, how are you finding your new glasses? If anything feels off, reply here and we will adjust the fit for free.', 60 * 24 * 11),
        c('customer', 'All good! Much clearer than my old pair 🙌', 60 * 24 * 11 - 45),
        c('store', 'Wonderful to hear. See you at your next check-up!', 60 * 24 * 11 - 50),
      ],
    },
    {
      id: 'cv06', customerId: 'c06', unread: 2, messages: [
        c('customer', 'Do you have the new Ray-Ban aviators in gold?', 60 * 5),
        c('store', 'Yes, Meena ma’am. Sharing a few options.', 60 * 5 - 10, { interactive: { kind: 'products', options: ['p02', 'p01', 'p06'], used: true } }),
        c('customer', 'I will come today evening.', 60 * 4),
        c('customer', 'Please keep the gold one aside.', 60 * 4 - 1),
      ],
    },
    {
      id: 'cv07', customerId: 'c09', unread: 0, messages: [
        c('customer', 'Can I get Acuvue lenses today itself?', 60 * 6),
        c('store', 'Yes, we have them in stock. Drop by anytime before 9 PM.', 60 * 6 - 12),
      ],
    },
    {
      id: 'cv08', customerId: 'c12', unread: 1, messages: [
        c('customer', 'Hi, any update on my order?', 44),
      ],
    },
    {
      id: 'cv09', customerId: 'c15', unread: 0, messages: [
        c('store', 'Hi Irfan, your contact lens supply may run out soon. Reply REORDER to reserve a box.', 60 * 24 * 2),
        c('customer', 'REORDER', 60 * 24 * 2 - 30),
        c('store', 'Reserved ✅ Biotrue ONEday, ready for pickup.', 60 * 24 * 2 - 35),
      ],
    },
    {
      id: 'cv10', customerId: 'c14', unread: 0, messages: [
        c('store', 'Hi Revathi, thank you for visiting OptiCare! We hope you love your new Carrera frames.', 60 * 24 * 225),
      ],
    },
    {
      id: 'cv11', customerId: 'c24', unread: 0, messages: [
        c('customer', 'Please let me know when my lenses arrive.', 60 * 24 * 3),
        c('store', 'Sure, Janani. Expected by Monday.', 60 * 24 * 3 - 5),
      ],
    },
  ];
}

export function buildSeedActivity(): Activity[] {
  return [
    { id: 'ac1', kind: 'purchase', text: 'Meena Krishnan purchased Ray-Ban Aviator RB3025', ts: ago(2), customerId: 'c06' },
    { id: 'ac2', kind: 'message', text: 'Arun Kumar asked to book an eye test on WhatsApp', ts: ago(9), customerId: 'c01' },
    { id: 'ac3', kind: 'appointment', text: 'Priya Sharma booked an eye test', ts: ago(15), customerId: 'c02' },
    { id: 'ac4', kind: 'order', text: "Karthik Raj's order marked Ready", ts: ago(32), customerId: 'c03' },
    { id: 'ac5', kind: 'followup', text: 'Divya S follow-up message sent', ts: ago(62), customerId: 'c04' },
    { id: 'ac6', kind: 'customer', text: 'Pooja Reddy added as a new customer', ts: ago(95), customerId: 'c22' },
    { id: 'ac7', kind: 'prescription', text: 'Prescription recorded for Pooja Reddy', ts: ago(100), customerId: 'c22' },
    { id: 'ac8', kind: 'purchase', text: 'Deepak Menon purchased Ray-Ban RB123', ts: ago(140), customerId: 'c11' },
  ];
}
