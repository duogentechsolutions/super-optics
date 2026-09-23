import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, IndianRupee, Package, Plus, Repeat, UserPlus } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useFakeLoading } from '../hooks/useFakeLoading';
import { TODAY, addDays, diffDays, fmtDateLong, greeting, inr, inrCompact } from '../lib/format';
import { dailySales, followUpBucket, isLiveOrder, isOpenOrder } from '../lib/selectors';
import {
  CustomerOverview, FollowUpSummary, JourneyStrip, KpiCard, RecentActivity, SalesOverview, TopProducts,
  journeyIcons, type Kpi,
} from '../components/dashboard/widgets';
import { Button } from '../components/ui/primitives';

const MONTH_START = TODAY.slice(0, 8) + '01';

export default function Dashboard() {
  const { state, customers } = useStore();
  const loading = useFakeLoading(500);
  const nav = useNavigate();

  const m = useMemo(() => {
    const daily = dailySales(state);
    const today = daily.get(TODAY) ?? 0;
    const yesterday = daily.get(addDays(TODAY, -1)) ?? 0;
    const lastWeekSameDay = daily.get(addDays(TODAY, -7)) ?? 0;
    const pct = yesterday ? Math.round(((today - yesterday) / yesterday) * 100) : 0;

    const newThisMonth = customers.filter((c) => c.customerSince >= MONTH_START);
    const newThisWeek = newThisMonth.filter((c) => diffDays(TODAY, c.customerSince) < 7).length;
    const returningThisMonth = customers.filter((c) => c.customerSince < MONTH_START && c.lastVisit >= MONTH_START);
    const visitsThisMonth = newThisMonth.length + returningThisMonth.length;

    const open = state.orders.filter(isOpenOrder);
    const ready = open.filter((o) => o.status === 'Ready').length;

    const buckets = state.followUps.map(followUpBucket);
    const overdue = buckets.filter((b) => b === 'overdue').length;
    const due = buckets.filter((b) => b === 'overdue' || b === 'today' || b === 'week').length;

    const monthSales = [...daily].filter(([d]) => d >= MONTH_START).reduce((s, [, v]) => s + v, 0);
    const rxThisMonth = state.prescriptions.filter((p) => p.date >= MONTH_START).length;
    const storeMsgs = state.conversations.reduce((s, c) => s + c.messages.filter((x) => x.from === 'store').length, 0);
    const bookedFromWhatsApp = state.appointments.filter((a) => a.source === 'WhatsApp' && a.status === 'Scheduled').length;

    const kpis: Kpi[] = [
      { label: "Today's sales", value: inr(today), icon: IndianRupee, trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat', compare: `${pct >= 0 ? '+' : ''}${pct}% vs yesterday`, to: '/reports' },
      { label: 'New customers', value: String(newThisMonth.length), icon: UserPlus, trend: newThisWeek ? 'up' : 'flat', compare: `+${newThisWeek} this week`, to: '/customers?filter=new' },
      { label: 'Returning customers', value: String(returningThisMonth.length), icon: Repeat, trend: 'up', compare: `${visitsThisMonth ? Math.round((returningThisMonth.length / visitsThisMonth) * 100) : 0}% of visits this month`, to: '/customers?filter=returning' },
      { label: 'Pending orders', value: String(open.length), icon: Package, trend: 'flat', compare: `${ready} ready for pickup`, to: '/orders?status=open' },
      { label: 'Follow-ups due', value: String(due), icon: BellRing, trend: overdue ? 'down' : 'flat', good: false, compare: `${overdue} overdue`, to: '/follow-ups?tab=overdue' },
    ];

    const stages = [
      { label: 'Acquire', value: String(newThisMonth.length), caption: 'new customers', icon: journeyIcons.UserPlus, to: '/customers?filter=new' },
      { label: 'Manage', value: String(rxThisMonth), caption: 'prescriptions recorded', icon: journeyIcons.ClipboardList, to: '/prescriptions' },
      { label: 'Communicate', value: String(storeMsgs), caption: 'WhatsApp messages sent', icon: journeyIcons.MessageCircle, to: '/whatsapp' },
      { label: 'Follow up', value: String(due), caption: 'reminders due this week', icon: journeyIcons.BellRing, to: '/follow-ups' },
      { label: 'Retain', value: String(returningThisMonth.length + bookedFromWhatsApp), caption: 'returns and bookings', icon: journeyIcons.Users, to: '/customers?filter=returning' },
      { label: 'Grow', value: inrCompact(monthSales), caption: 'sales this month', icon: journeyIcons.IndianRupee, to: '/reports' },
    ];

    return { kpis, stages, due, lastWeekSameDay, todayOrders: state.orders.filter((o) => o.date === TODAY && isLiveOrder(o)).length };
  }, [state, customers]);

  return (
    <div className="page dashboard">
      <header className="page-head page-head--hero">
        <div>
          <h1>{greeting()}, Owner 👋</h1>
          <p>Here's what's happening with your store today, {fmtDateLong(TODAY)}.</p>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" icon={<Plus size={16} />} onClick={() => nav('/customers?new=1')}>Add customer</Button>
          <Button variant="primary" icon={<Package size={16} />} onClick={() => nav('/orders')}>View {m.todayOrders} orders today</Button>
        </div>
      </header>

      <div className="kpi-grid">
        {m.kpis.map((k) => <KpiCard key={k.label} k={k} loading={loading} />)}
      </div>

      <JourneyStrip stages={m.stages} />

      <div className="dash-grid">
        <SalesOverview state={state} loading={loading} />
        <CustomerOverview customers={customers} followUpsDue={m.due} />
        <FollowUpSummary state={state} />
        <TopProducts state={state} />
        <RecentActivity state={state} />
      </div>
    </div>
  );
}
