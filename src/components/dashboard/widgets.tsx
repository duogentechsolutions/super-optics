import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  ArrowDownRight, ArrowUpRight, CalendarCheck, ClipboardList, IndianRupee, MessageCircle, Minus,
  Package, ShoppingBag, UserPlus, Users, BellRing, Eye, type LucideIcon,
} from 'lucide-react';
import type { AppState } from '../../data';
import type { ActivityKind, CustomerView } from '../../types';
import { followUpBucket, productGroupStats, salesSeries, type SalesRange } from '../../lib/selectors';
import { inr, inrCompact, num, timeAgo } from '../../lib/format';
import { Card, CardHeader, Segmented, Skeleton } from '../ui/primitives';

/* ------------------------------------------------------------------ KPI */

export interface Kpi {
  label: string;
  value: string;
  icon: LucideIcon;
  compare: string;
  trend: 'up' | 'down' | 'flat';
  good?: boolean; // whether the trend direction is good news
  to?: string;
}

export function KpiCard({ k, loading }: { k: Kpi; loading?: boolean }) {
  const nav = useNavigate();
  const TrendIcon = k.trend === 'up' ? ArrowUpRight : k.trend === 'down' ? ArrowDownRight : Minus;
  const tone = k.trend === 'flat' ? 'flat' : (k.good ?? k.trend === 'up') ? 'good' : 'bad';
  return (
    <button className="kpi" onClick={() => k.to && nav(k.to)} disabled={!k.to}>
      <div className="kpi__top">
        <span className="kpi__icon"><k.icon size={18} strokeWidth={1.8} /></span>
        <span className="kpi__label">{k.label}</span>
      </div>
      {loading ? <Skeleton h={30} w="60%" /> : <strong className="kpi__value">{k.value}</strong>}
      <span className={`kpi__trend kpi__trend--${tone}`}>
        <TrendIcon size={14} />
        {k.compare}
      </span>
    </button>
  );
}

/* --------------------------------------------------------- Sales chart */

const RANGES = ['7D', '30D', '3M', '1Y'] as const;
const RANGE_LABEL: Record<SalesRange, string> = { '7D': '7 Days', '30D': '30 Days', '3M': '3 Months', '1Y': '1 Year' };

function ChartTip({ active, payload, label, unit = '₹' }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <span>{label}</span>
      {payload.map((p, i) => (
        <strong key={i} style={{ color: payload.length > 1 ? p.color : undefined }}>
          {payload.length > 1 && `${p.name}: `}
          {unit === '₹' ? inr(p.value) : num(p.value)}
        </strong>
      ))}
    </div>
  );
}
export { ChartTip };

export function SalesOverview({ state, loading }: { state: AppState; loading?: boolean }) {
  const [range, setRange] = useState<SalesRange>('30D');
  const data = useMemo(() => salesSeries(state, range), [state, range]);
  const total = data.reduce((s, d) => s + d.value, 0);
  const avg = total / data.length;
  const unit = range === '3M' ? 'week' : range === '1Y' ? 'month' : 'day';

  return (
    <Card className="span-2">
      <CardHeader
        title="Sales overview"
        subtitle={`${RANGE_LABEL[range]} · ${inr(total)} total · ${inrCompact(avg)} avg per ${unit}`}
        action={
          <Segmented
            options={RANGES}
            value={range}
            onChange={setRange}
          />
        }
      />
      <div className="chart-box" style={{ height: 260 }}>
        {loading ? <Skeleton h={240} /> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B78C3" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#3B78C3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#EDF1F5" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7A8E' }} interval="preserveStartEnd" minTickGap={18} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7A8E' }} tickFormatter={(v) => inrCompact(v)} width={56} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: '#BFD3EA' }} />
              <Area type="monotone" dataKey="value" stroke="#0F2A4A" strokeWidth={2} fill="url(#salesFill)" activeDot={{ r: 4, fill: '#0F2A4A' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------- Customer overview */

export function CustomerOverview({ customers, followUpsDue }: { customers: CustomerView[]; followUpsDue: number }) {
  const nav = useNavigate();
  const counts = {
    New: customers.filter((c) => c.type === 'New' && c.status !== 'Inactive').length,
    Returning: customers.filter((c) => c.type === 'Returning' && c.status !== 'Inactive').length,
    Inactive: customers.filter((c) => c.status === 'Inactive').length,
  };
  const data = [
    { name: 'New', value: counts.New, color: '#7FAEE3', filter: 'new' },
    { name: 'Returning', value: counts.Returning, color: '#0F2A4A', filter: 'returning' },
    { name: 'Inactive', value: counts.Inactive, color: '#C9D2DD', filter: 'inactive' },
  ];
  return (
    <Card>
      <CardHeader title="Customer overview" subtitle={`${customers.length} customer profiles`} />
      <div className="donut">
        <div className="donut__chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                {data.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip content={<ChartTip unit="" />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut__center"><strong>{customers.length}</strong><span>profiles</span></div>
        </div>
        <ul className="legend">
          {data.map((d) => (
            <li key={d.name}>
              <button onClick={() => nav(`/customers?filter=${d.filter}`)}>
                <i style={{ background: d.color }} />
                <span>{d.name}</span>
                <strong>{d.value}</strong>
              </button>
            </li>
          ))}
          <li>
            <button onClick={() => nav('/customers?filter=due')}>
              <i style={{ background: 'var(--amber)' }} />
              <span>Follow-ups due</span>
              <strong>{followUpsDue}</strong>
            </button>
          </li>
        </ul>
      </div>
    </Card>
  );
}

/* --------------------------------------------------------- Top products */

export function TopProducts({ state }: { state: AppState }) {
  const rows = productGroupStats(state).slice(0, 5);
  const max = rows[0]?.revenue ?? 1;
  return (
    <Card>
      <CardHeader title="Top products" subtitle="Last 30 days, by revenue" />
      <ol className="top-products">
        {rows.map((r, i) => (
          <li key={r.group}>
            <span className="top-products__rank">{i + 1}</span>
            <div className="top-products__main">
              <div className="top-products__line">
                <strong>{r.group}</strong>
                <span>{inr(r.revenue)}</span>
              </div>
              <div className="bar"><i style={{ width: `${(r.revenue / max) * 100}%` }} /></div>
              <small>{r.units} units sold</small>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ------------------------------------------------------ Follow-up summary */

export function FollowUpSummary({ state }: { state: AppState }) {
  const nav = useNavigate();
  const b = { overdue: 0, week: 0, upcoming: 0 };
  for (const f of state.followUps) {
    const k = followUpBucket(f);
    if (k === 'overdue') b.overdue++;
    else if (k === 'today' || k === 'week') b.week++;
    else if (k === 'upcoming') b.upcoming++;
  }
  const items = [
    { key: 'overdue', label: 'Overdue', value: b.overdue, tone: 'red', hint: 'Needs attention today' },
    { key: 'week', label: 'Due this week', value: b.week, tone: 'amber', hint: 'Including today' },
    { key: 'upcoming', label: 'Upcoming', value: b.upcoming, tone: 'green', hint: 'Scheduled by automations' },
  ];
  return (
    <Card>
      <CardHeader title="Follow-up summary" subtitle="Automated reminders across all customers" />
      <div className="fu-summary">
        {items.map((it) => (
          <button key={it.key} className={`fu-summary__item fu-summary__item--${it.tone}`} onClick={() => nav(`/follow-ups?tab=${it.key}`)}>
            <i />
            <strong>{it.value}</strong>
            <span>{it.label}</span>
            <small>{it.hint}</small>
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------- Activity */

const activityIcon: Record<ActivityKind, LucideIcon> = {
  purchase: ShoppingBag,
  appointment: CalendarCheck,
  order: Package,
  message: MessageCircle,
  followup: BellRing,
  customer: UserPlus,
  prescription: Eye,
};

export function RecentActivity({ state }: { state: AppState }) {
  const nav = useNavigate();
  return (
    <Card>
      <CardHeader title="Recent activity" subtitle="Updates from the store, WhatsApp and automations" />
      <ul className="activity">
        {state.activity.slice(0, 7).map((a) => {
          const Icon = activityIcon[a.kind];
          return (
            <li key={a.id}>
              <button onClick={() => a.customerId && nav(`/customers/${a.customerId}`)}>
                <span className={`activity__icon activity__icon--${a.kind}`}><Icon size={15} /></span>
                <span className="activity__text">{a.text}</span>
                <small>{timeAgo(a.ts)}</small>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ---------------------------------------------------- Customer journey */

export function JourneyStrip({ stages }: { stages: { label: string; value: string; caption: string; icon: LucideIcon; to: string }[] }) {
  const nav = useNavigate();
  return (
    <section className="journey" aria-label="Customer lifecycle">
      <div className="journey__intro">
        <h2>Your customer lifecycle, this month</h2>
        <p>Every visit, prescription and message feeds the next reminder.</p>
      </div>
      <ol className="journey__steps">
        {stages.map((s, i) => (
          <li key={s.label}>
            <button onClick={() => nav(s.to)}>
              <span className="journey__num">{i + 1}</span>
              <s.icon size={18} strokeWidth={1.7} />
              <strong>{s.value}</strong>
              <span className="journey__label">{s.label}</span>
              <small>{s.caption}</small>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------ Mini bar chart */

export function MiniBars({ data, keys }: { data: Record<string, number | string>[]; keys: { key: string; color: string; name: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke="#EDF1F5" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7A8E' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7A8E' }} width={40} />
        <Tooltip content={<ChartTip unit="" />} cursor={{ fill: '#F2F6FA' }} />
        {keys.map((k) => <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color} radius={[4, 4, 0, 0]} maxBarSize={22} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export const journeyIcons = { UserPlus, ClipboardList, MessageCircle, BellRing, Users, IndianRupee };
