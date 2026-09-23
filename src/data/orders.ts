import type { Order, OrderItem, OrderStatus } from '../types';
import { seedProducts } from './products';

export function itemFor(productId: string, qty = 1): OrderItem {
  const p = seedProducts.find((x) => x.id === productId);
  if (!p) throw new Error(`Unknown product ${productId}`);
  return { productId, name: p.name, category: p.category, price: p.price, qty };
}

type Line = string | [string, number];

function o(
  id: string,
  customerId: string,
  date: string,
  lines: Line[],
  status: OrderStatus,
  paymentMode: Order['paymentMode'] = 'UPI',
  expectedDate?: string,
): Order {
  const items = lines.map((l) => (typeof l === 'string' ? itemFor(l) : itemFor(l[0], l[1])));
  return {
    id,
    customerId,
    date,
    items,
    amount: items.reduce((s, i) => s + i.price * i.qty, 0),
    status,
    paymentMode,
    expectedDate,
  };
}

export const seedOrders: Order[] = [
  o('OC-2190', 'c23', '2025-05-11', ['p07', 'p10'], 'Collected', 'Cash'),
  o('OC-2200', 'c17', '2025-06-20', ['p03', 'p08'], 'Collected', 'Cash'),
  o('OC-2210', 'c08', '2025-08-11', ['p04', 'p08'], 'Collected', 'Card'),
  o('OC-2300', 'c06', '2024-08-10', ['p01', 'p08'], 'Collected', 'Card'),
  o('OC-2330', 'c13', '2024-10-05', ['p02', 'p08'], 'Collected', 'Card'),
  o('OC-2350', 'c07', '2024-11-02', ['p03', 'p10'], 'Collected'),
  o('OC-2380', 'c02', '2025-01-20', ['p04', 'p10'], 'Collected'),
  o('OC-2395', 'c06', '2025-02-14', ['p05', 'p11'], 'Collected', 'Card'),
  o('OC-2401', 'c01', '2025-03-15', ['p03', 'p09'], 'Collected'),
  o('OC-2415', 'c11', '2025-04-22', ['p05', 'p10'], 'Collected', 'Card'),
  o('OC-2412', 'c03', '2025-10-08', ['p07', 'p09'], 'Collected'),
  o('OC-2420', 'c04', '2025-11-20', ['p06', 'p10'], 'Collected'),
  o('OC-2425', 'c16', '2025-12-05', ['p03', 'p09'], 'Collected'),
  o('OC-2428', 'c21', '2025-12-22', ['p05', 'p09'], 'Collected', 'Card'),
  o('OC-2430', 'c10', '2026-01-15', ['p06', 'p09'], 'Collected'),
  o('OC-2436', 'c14', '2026-02-10', ['p06', 'p08'], 'Collected', 'Card'),
  o('OC-2435', 'c20', '2026-02-25', ['p14', 'p16'], 'Collected', 'Cash'),
  o('OC-2438', 'c24', '2026-03-05', ['p07', 'p09'], 'Collected'),
  o('OC-2440', 'c02', '2026-03-22', [['p12', 2]], 'Collected'),
  o('OC-2442', 'c19', '2026-04-18', ['p03', 'p08'], 'Collected', 'Cash'),
  o('OC-2445', 'c07', '2026-05-30', ['p04', 'p09'], 'Collected'),
  o('OC-2448', 'c15', '2026-06-02', [['p14', 2]], 'Collected'),
  o('OC-2449', 'c04', '2026-06-14', [['p13', 2]], 'Collected'),
  o('OC-2450', 'c13', '2026-07-02', ['p08', 'p11'], 'Collected', 'Card'),
  o('OC-2458', 'c05', '2026-09-05', ['p02', 'p10'], 'Collected'),
  o('OC-2459', 'c12', '2026-09-10', ['p04', 'p09'], 'Processing', 'UPI', '2026-09-25'),
  o('OC-2455', 'c01', '2026-09-12', ['p01', 'p08'], 'Collected', 'Card'),
  o('OC-2460', 'c09', '2026-09-18', ['p07', 'p09'], 'Collected'),
  o('OC-2462', 'c03', '2026-09-19', ['p05', 'p11'], 'Ready', 'Card', '2026-09-23'),
  o('OC-2461', 'c20', '2026-09-20', ['p06', 'p09'], 'Cancelled'),
  o('OC-2463', 'c24', '2026-09-20', [['p12', 2]], 'Ready', 'UPI', '2026-09-22'),
  o('OC-2464', 'c18', '2026-09-21', ['p06', 'p09'], 'Processing', 'UPI', '2026-09-26'),
  o('OC-2465', 'c22', '2026-09-23', ['p04', 'p10', 'p16'], 'Received', 'UPI', '2026-09-28'),
  o('OC-2466', 'c06', '2026-09-23', ['p02', 'p08'], 'Processing', 'Card', '2026-09-27'),
  o('OC-2467', 'c09', '2026-09-23', [['p12', 2]], 'Collected'),
  o('OC-2468', 'c11', '2026-09-23', ['p01', 'p08'], 'Received', 'Card', '2026-09-29'),
  o('OC-2469', 'c15', '2026-09-23', ['p13', 'p17'], 'Collected', 'Cash'),
];
