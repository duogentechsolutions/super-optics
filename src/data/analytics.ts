import { TODAY, addDays, toDate } from '../lib/format';

/** Deterministic PRNG so the charts look the same on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Store-wide walk-in and counter sales that aren't individually modelled as
 * orders in the demo. Live orders from the data layer are added on top.
 * Covers the 365 days before TODAY; TODAY itself comes only from real orders.
 */
export const baselineDailySales: { date: string; value: number }[] = (() => {
  const rand = mulberry32(20260923);
  const out: { date: string; value: number }[] = [];
  for (let i = 365; i >= 1; i--) {
    const date = addDays(TODAY, -i);
    const d = toDate(date);
    const dow = d.getUTCDay();
    const month = d.getUTCMonth();
    const weekend = dow === 0 || dow === 6 ? 1.45 : dow === 5 ? 1.15 : 1;
    const festive = month === 9 || month === 10 ? 1.25 : month === 5 ? 0.88 : 1; // Diwali season, monsoon dip
    const growth = 1 + (365 - i) / 365 * 0.18;
    const value = 26000 * weekend * festive * growth * (0.78 + rand() * 0.44);
    out.push({ date, value: Math.round(value / 50) * 50 });
  }
  return out;
})();

/** Units and revenue over the last 30 days by product group (store-wide). */
export const baselineProductGroups: Record<string, { units: number; revenue: number }> = {
  'Progressive Lens': { units: 58, revenue: 232000 },
  'Blue Cut Lens': { units: 54, revenue: 194400 },
  'Ray-Ban Frames': { units: 19, revenue: 172900 },
  'Contact Lenses': { units: 72, revenue: 141600 },
  'Titan Frames': { units: 31, revenue: 118400 },
  'Single Vision Lens': { units: 41, revenue: 90200 },
  'Other Frames': { units: 16, revenue: 88600 },
  'Photochromic Lens': { units: 9, revenue: 46800 },
  Accessories: { units: 44, revenue: 17300 },
};

/** Monthly store-wide customer movement for the last 6 months. */
export const customerTrend = [
  { month: 'Apr', new: 62, returning: 118, inactive: 31 },
  { month: 'May', new: 71, returning: 124, inactive: 28 },
  { month: 'Jun', new: 54, returning: 109, inactive: 35 },
  { month: 'Jul', new: 68, returning: 131, inactive: 30 },
  { month: 'Aug', new: 77, returning: 142, inactive: 26 },
  { month: 'Sep', new: 0, returning: 0, inactive: 0 }, // filled live
];

/** Follow-up delivery funnel for previous months (store-wide). */
export const followUpTrend = [
  { month: 'Apr', sent: 212, delivered: 204, completed: 71 },
  { month: 'May', sent: 236, delivered: 229, completed: 84 },
  { month: 'Jun', sent: 198, delivered: 190, completed: 66 },
  { month: 'Jul', sent: 251, delivered: 243, completed: 92 },
  { month: 'Aug', sent: 274, delivered: 266, completed: 103 },
];

/** Customer counts beyond the 24 sample profiles, used for store-wide totals. */
export const storeTotals = {
  customers: 1284,
  activeLast12Months: 842,
};
