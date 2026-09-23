import type { AppState } from '../data';
import { baselineDailySales, baselineProductGroups } from '../data/analytics';
import type { CustomerView, FollowUp, Order } from '../types';
import { TODAY, addDays, diffDays, monthLabel, fmtShort } from './format';

export const INACTIVE_AFTER_DAYS = 270;
export const HIGH_VALUE_SPEND = 25000;

export type FollowUpBucket = 'overdue' | 'today' | 'week' | 'upcoming' | 'completed';

export function followUpBucket(f: FollowUp): FollowUpBucket {
  if (f.status !== 'Pending') return 'completed';
  const d = diffDays(f.dueDate, TODAY);
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  if (d <= 7) return 'week';
  return 'upcoming';
}

export const isLiveOrder = (o: Order) => o.status !== 'Cancelled';
export const isOpenOrder = (o: Order) => o.status === 'Received' || o.status === 'Processing' || o.status === 'Ready';

export function buildCustomerViews(s: AppState): CustomerView[] {
  return s.customers.map((c) => {
    const orders = s.orders.filter((o) => o.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date));
    const prescriptions = s.prescriptions.filter((p) => p.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date));
    const appointments = s.appointments.filter((a) => a.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date));
    const followUps = s.followUps.filter((f) => f.customerId === c.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const visitDates = new Set<string>([
      ...orders.filter(isLiveOrder).map((o) => o.date),
      ...prescriptions.map((p) => p.date),
      ...appointments.filter((a) => a.status === 'Completed').map((a) => a.date),
    ]);
    const lastVisit = [...visitDates, c.customerSince].sort().pop()!;
    const liveOrders = orders.filter(isLiveOrder);
    const totalSpent = liveOrders.reduce((sum, o) => sum + o.amount, 0);
    const pending = followUps.filter((f) => f.status === 'Pending');
    const nextFollowUp = pending[0];
    const inactive = diffDays(TODAY, lastVisit) > INACTIVE_AFTER_DAYS;
    const dueSoon = pending.some((f) => diffDays(f.dueDate, TODAY) <= 7);

    return {
      ...c,
      orders,
      prescriptions,
      appointments,
      followUps,
      lastVisit,
      lastPurchase: liveOrders[0],
      latestRx: prescriptions[0],
      nextFollowUp,
      totalSpent,
      visits: Math.max(visitDates.size, 1),
      type: visitDates.size >= 2 ? 'Returning' : 'New',
      status: inactive ? 'Inactive' : dueSoon ? 'Follow-up Due' : 'Active',
      highValue: totalSpent >= HIGH_VALUE_SPEND,
    };
  });
}

/** Store-wide daily sales: baseline walk-in sales + orders recorded in the demo. */
export function dailySales(s: AppState): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of baselineDailySales) map.set(d.date, d.value);
  map.set(TODAY, 0);
  for (const o of s.orders) {
    if (!isLiveOrder(o) || !map.has(o.date)) continue;
    map.set(o.date, (map.get(o.date) ?? 0) + o.amount);
  }
  return map;
}

export type SalesRange = '7D' | '30D' | '3M' | '1Y';
export interface SalesPoint { label: string; value: number; orders?: number }

export function salesSeries(s: AppState, range: SalesRange): SalesPoint[] {
  const daily = dailySales(s);
  const get = (d: string) => daily.get(d) ?? 0;
  if (range === '7D' || range === '30D') {
    const n = range === '7D' ? 7 : 30;
    return Array.from({ length: n }, (_, i) => {
      const date = addDays(TODAY, i - n + 1);
      return { label: date === TODAY ? 'Today' : fmtShort(date), value: get(date) };
    });
  }
  if (range === '3M') {
    return Array.from({ length: 13 }, (_, w) => {
      const end = addDays(TODAY, -(12 - w) * 7);
      let sum = 0;
      for (let i = 0; i < 7; i++) sum += get(addDays(end, -i));
      return { label: w === 12 ? 'This wk' : fmtShort(addDays(end, -6)), value: sum };
    });
  }
  // 1Y — monthly totals
  const buckets = new Map<string, number>();
  for (const [date, v] of daily) {
    const key = date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + v);
  }
  return [...buckets.keys()].sort().slice(-12).map((k) => ({ label: monthLabel(`${k}-01`), value: buckets.get(k)! }));
}

export function salesOn(s: AppState, date: string): number {
  return dailySales(s).get(date) ?? 0;
}

export interface ProductGroupStat { group: string; units: number; revenue: number }

export function productGroupStats(s: AppState): ProductGroupStat[] {
  const since = addDays(TODAY, -30);
  const stats: Record<string, { units: number; revenue: number }> = JSON.parse(JSON.stringify(baselineProductGroups));
  for (const o of s.orders) {
    if (!isLiveOrder(o) || o.date < since) continue;
    for (const item of o.items) {
      const group = s.products.find((p) => p.id === item.productId)?.group ?? 'Other';
      stats[group] ??= { units: 0, revenue: 0 };
      stats[group].units += item.qty;
      stats[group].revenue += item.qty * item.price;
    }
  }
  return Object.entries(stats)
    .map(([group, v]) => ({ group, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function productSales(s: AppState) {
  const map = new Map<string, { units: number; revenue: number; lastSold?: string }>();
  for (const o of s.orders) {
    if (!isLiveOrder(o)) continue;
    for (const it of o.items) {
      const cur = map.get(it.productId) ?? { units: 0, revenue: 0 };
      cur.units += it.qty;
      cur.revenue += it.qty * it.price;
      if (!cur.lastSold || o.date > cur.lastSold) cur.lastSold = o.date;
      map.set(it.productId, cur);
    }
  }
  return map;
}
