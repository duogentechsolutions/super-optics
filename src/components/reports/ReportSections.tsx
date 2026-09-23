import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { AppState } from '../../data';
import type { CustomerView } from '../../types';
import { Badge, Card, CardHeader, Segmented, Skeleton } from '../ui/primitives';
import { ChartTip } from '../dashboard/widgets';
import { ProductArt } from '../products/ProductArt';
import { TODAY, addDays, fmtDate, inr, inrCompact, num } from '../../lib/format';
import { productGroupStats, productSales, salesSeries } from '../../lib/selectors';
import { customerTrend, followUpTrend } from '../../data/analytics';

const AXIS = { tickLine: false, axisLine: false, tick: { fontSize: 11, fill: '#6B7A8E' } } as const;
const MONTH_START = TODAY.slice(0, 8) + '01';

function Metric({ label, value, delta, note }: { label: string; value: string; delta?: number; note?: string }) {
  return (
    <div className="metric">
      <span className="metric__label">{label}</span>
      <span className="metric__value">{value}</span>
      {delta !== undefined ? (
        <span className={`metric__delta ${delta >= 0 ? 'is-up' : 'is-down'}`}>
          {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta >= 0 ? '+' : ''}{delta}% {note ?? 'vs previous period'}
        </span>
      ) : note ? <span className="metric__note">{note}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Sales */

const SALES_MODES = ['Daily', 'Weekly', 'Monthly'] as const;
type SalesMode = (typeof SALES_MODES)[number];

export function SalesReport({ state, loading }: { state: AppState; loading: boolean }) {
  const [mode, setMode] = useState<SalesMode>('Daily');
  const data = useMemo(() => {
    const range = mode === 'Daily' ? '30D' : mode === 'Weekly' ? '3M' : '1Y';
    return salesSeries(state, range);
  }, [state, mode]);

  const stats = useMemo(() => {
    const cur = data.slice(Math.floor(data.length / 2));
    const prev = data.slice(0, Math.floor(data.length / 2));
    const sum = (a: typeof data) => a.reduce((s, d) => s + d.value, 0);
    const total = data.reduce((s, d) => s + d.value, 0);
    const best = data.reduce((b, d) => (d.value > b.value ? d : b), data[0]);
    const delta = sum(prev) ? Math.round(((sum(cur) - sum(prev)) / sum(prev)) * 100) : 0;
    const since = mode === 'Daily' ? addDays(TODAY, -29) : mode === 'Weekly' ? addDays(TODAY, -90) : addDays(TODAY, -365);
    const orders = state.orders.filter((o) => o.status !== 'Cancelled' && o.date >= since);
    const aov = orders.length ? orders.reduce((s, o) => s + o.amount, 0) / orders.length : 0;
    return { total, best, delta, avg: total / data.length, aov };
  }, [data, mode, state.orders]);

  const unit = mode === 'Daily' ? 'day' : mode === 'Weekly' ? 'week' : 'month';

  return (
    <Card>
      <CardHeader
        title="Sales"
        subtitle={mode === 'Daily' ? 'Last 30 days' : mode === 'Weekly' ? 'Last 13 weeks' : 'Last 12 months'}
        action={<Segmented options={SALES_MODES} value={mode} onChange={setMode} />}
      />
      <div className="metric-row">
        <Metric label="Total sales" value={inr(stats.total)} delta={stats.delta} note="second half vs first half" />
        <Metric label={`Average per ${unit}`} value={inrCompact(stats.avg)} />
        <Metric label={`Best ${unit}`} value={inrCompact(stats.best?.value ?? 0)} note={stats.best?.label} />
        <Metric label="Avg. order value" value={inr(stats.aov)} note="recorded orders" />
      </div>
      <div className="chart-box" style={{ height: 260 }}>
        {loading ? <Skeleton h={240} /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#EDF1F5" vertical={false} />
              <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={14} />
              <YAxis {...AXIS} tickFormatter={(v) => inrCompact(v)} width={56} />
              <Tooltip content={<ChartTip />} cursor={{ fill: '#EEF4FB' }} />
              <Bar dataKey="value" name="Sales" fill="#0F2A4A" radius={[5, 5, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------- Customers */

export function CustomerReport({ customers, loading }: { customers: CustomerView[]; loading: boolean }) {
  const nav = useNavigate();
  const live = useMemo(() => {
    const newM = customers.filter((c) => c.customerSince >= MONTH_START).length;
    const retM = customers.filter((c) => c.customerSince < MONTH_START && c.lastVisit >= MONTH_START).length;
    const inactive = customers.filter((c) => c.status === 'Inactive').length;
    return {
      newTotal: customers.filter((c) => c.type === 'New').length,
      returning: customers.filter((c) => c.type === 'Returning').length,
      inactive,
      newM, retM,
      high: customers.filter((c) => c.highValue).length,
    };
  }, [customers]);

  // Store-wide history (Apr–Aug) plus September month-to-date including CRM activity recorded in this demo.
  const data = useMemo(() => customerTrend.map((r) =>
    r.month === 'Sep' ? { month: 'Sep (MTD)', new: 46 + live.newM, returning: 88 + live.retM, inactive: 19 + live.inactive } : r,
  ), [live]);

  const retention = Math.round((live.returning / Math.max(1, customers.length)) * 100);

  return (
    <Card>
      <CardHeader title="Customers" subtitle="Store-wide monthly movement · last 6 months" />
      <div className="metric-row">
        <button className="metric metric--link" onClick={() => nav('/customers?filter=new')}>
          <span className="metric__label">New <ArrowUpRight size={12} /></span>
          <span className="metric__value">{live.newTotal}</span>
          <span className="metric__note">{live.newM} joined this month</span>
        </button>
        <button className="metric metric--link" onClick={() => nav('/customers?filter=returning')}>
          <span className="metric__label">Returning <ArrowUpRight size={12} /></span>
          <span className="metric__value">{live.returning}</span>
          <span className="metric__note">{retention}% of CRM profiles</span>
        </button>
        <button className="metric metric--link" onClick={() => nav('/customers?filter=inactive')}>
          <span className="metric__label">Inactive <ArrowUpRight size={12} /></span>
          <span className="metric__value">{live.inactive}</span>
          <span className="metric__note">No visit in 9+ months</span>
        </button>
        <button className="metric metric--link" onClick={() => nav('/customers?filter=high')}>
          <span className="metric__label">High value <ArrowUpRight size={12} /></span>
          <span className="metric__value">{live.high}</span>
          <span className="metric__note">Lifetime spend ₹25k+</span>
        </button>
      </div>
      <div className="chart-box" style={{ height: 250 }}>
        {loading ? <Skeleton h={230} /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#EDF1F5" vertical={false} />
              <XAxis dataKey="month" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip content={<ChartTip unit="" />} cursor={{ fill: '#EEF4FB' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="new" name="New" stackId="a" fill="#3B78C3" maxBarSize={40} />
              <Bar dataKey="returning" name="Returning" stackId="a" fill="#0F2A4A" maxBarSize={40} />
              <Bar dataKey="inactive" name="Went inactive" stackId="a" fill="#C9D3DF" radius={[5, 5, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- Follow-ups */

export function FollowUpReport({ state, loading }: { state: AppState; loading: boolean }) {
  const nav = useNavigate();
  const live = useMemo(() => {
    const f = state.followUps;
    const sent = f.filter((x) => x.status === 'Sent' || (x.status === 'Completed' && x.sentAt)).length;
    const autoSent = state.automations.reduce((s, a) => s + a.sentCount, 0);
    const pending = f.filter((x) => x.status === 'Pending').length;
    const completed = f.filter((x) => x.status === 'Completed').length;
    return { sent, autoSent, pending, completed };
  }, [state.followUps, state.automations]);

  const totalSent = live.autoSent + live.sent;
  const delivered = Math.round(totalSent * 0.972);
  const data = useMemo(() => [
    ...followUpTrend,
    { month: 'Sep (MTD)', sent: 160 + live.sent, delivered: Math.round((160 + live.sent) * 0.97), completed: 58 + live.completed },
  ], [live]);

  return (
    <Card>
      <CardHeader title="Follow-ups" subtitle="Automated and manual reminders" />
      <div className="metric-row">
        <Metric label="Sent" value={num(totalSent)} note="all automations, lifetime" />
        <Metric label="Delivered" value={num(delivered)} note={`${Math.round((delivered / Math.max(1, totalSent)) * 100)}% delivery rate`} />
        <button className="metric metric--link" onClick={() => nav('/follow-ups?tab=overdue')}>
          <span className="metric__label">Pending <ArrowUpRight size={12} /></span>
          <span className="metric__value">{live.pending}</span>
          <span className="metric__note">Waiting to be sent</span>
        </button>
        <button className="metric metric--link" onClick={() => nav('/follow-ups?tab=completed')}>
          <span className="metric__label">Completed <ArrowUpRight size={12} /></span>
          <span className="metric__value">{live.completed}</span>
          <span className="metric__note">Customer responded or returned</span>
        </button>
      </div>
      <div className="chart-box" style={{ height: 250 }}>
        {loading ? <Skeleton h={230} /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#EDF1F5" vertical={false} />
              <XAxis dataKey="month" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip content={<ChartTip unit="" />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="sent" name="Sent" stroke="#0F2A4A" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="delivered" name="Delivered" stroke="#3B78C3" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#1F8A5B" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- Products */

export function ProductReport({ state }: { state: AppState }) {
  const nav = useNavigate();
  const groups = useMemo(() => productGroupStats(state), [state]);
  const bestSelling = [...groups].sort((a, b) => b.units - a.units).slice(0, 5);
  const topRevenue = groups.slice(0, 5);
  const maxUnits = Math.max(...bestSelling.map((g) => g.units), 1);
  const maxRev = Math.max(...topRevenue.map((g) => g.revenue), 1);

  const low = useMemo(() => {
    const sales = productSales(state);
    const cutoff = addDays(TODAY, -60);
    return state.products
      .map((p) => ({ p, s: sales.get(p.id) }))
      .filter((x) => !x.s || !x.s.lastSold || x.s.lastSold < cutoff || x.s.units <= 1)
      .sort((a, b) => (a.s?.units ?? 0) - (b.s?.units ?? 0))
      .slice(0, 5);
  }, [state]);

  return (
    <div className="report-products">
      <Card>
        <CardHeader title="Best selling" subtitle="Units · last 30 days" />
        <ol className="rank-list">
          {bestSelling.map((g, i) => (
            <li key={g.group}>
              <span className="rank-list__n">{i + 1}</span>
              <div className="rank-list__main">
                <div className="rank-list__top"><strong>{g.group}</strong><span>{num(g.units)} units</span></div>
                <div className="bar"><i style={{ width: `${(g.units / maxUnits) * 100}%` }} /></div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <CardHeader title="Highest revenue" subtitle="Revenue · last 30 days" />
        <ol className="rank-list">
          {topRevenue.map((g, i) => (
            <li key={g.group}>
              <span className="rank-list__n">{i + 1}</span>
              <div className="rank-list__main">
                <div className="rank-list__top"><strong>{g.group}</strong><span>{inr(g.revenue)}</span></div>
                <div className="bar bar--blue"><i style={{ width: `${(g.revenue / maxRev) * 100}%` }} /></div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <CardHeader title="Low activity" subtitle="No sale in 60 days, or 1 unit or fewer" />
        {low.length === 0 ? <p className="muted">Every product sold recently. 🎉</p> : (
          <ul className="low-list">
            {low.map(({ p, s }) => (
              <li key={p.id}>
                <button onClick={() => nav(`/products?open=${p.id}`)}>
                  <ProductArt p={p} className="low-list__art" />
                  <span className="low-list__main">
                    <strong>{p.name}</strong>
                    <small>{s?.lastSold ? `Last sold ${fmtDate(s.lastSold)}` : 'No recorded sales'} · {p.stock} in stock</small>
                  </span>
                  <Badge tone={s?.units ? 'amber' : 'grey'}>{s?.units ?? 0} sold</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
