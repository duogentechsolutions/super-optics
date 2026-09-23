import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, PackageCheck, Plus } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useFakeLoading } from '../hooks/useFakeLoading';
import { Avatar, Button, Card, EmptyState, Field, PageHeader, SearchInput, Select, SkeletonRows, Stat, Tabs } from '../components/ui/primitives';
import { OrderBadge } from '../components/ui/badges';
import { Modal } from '../components/ui/Modal';
import { OrderDetailModal, nextAction, useOrderActions } from '../components/orders/OrderDetail';
import { AddPurchaseModal } from '../components/customers/CustomerModals';
import { TODAY, fmtDate, inr } from '../lib/format';
import { isOpenOrder } from '../lib/selectors';
import type { Order, OrderStatus } from '../types';

const TABS = ['all', 'open', 'Received', 'Processing', 'Ready', 'Collected', 'Cancelled'] as const;
type T = (typeof TABS)[number];
const LABEL: Record<T, string> = { all: 'All', open: 'Open', Received: 'Received', Processing: 'Processing', Ready: 'Ready', Collected: 'Completed', Cancelled: 'Cancelled' };

export default function Orders() {
  const { state, customer, customers } = useStore();
  const [params, setParams] = useSearchParams();
  const loading = useFakeLoading(400);
  const act = useOrderActions();
  const tab = (TABS.includes(params.get('status') as T) ? params.get('status') : 'all') as T;
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | undefined>(params.get('open') ?? undefined);
  const [pickCustomer, setPickCustomer] = useState(false);
  const [newFor, setNewFor] = useState('');
  const [purchaseFor, setPurchaseFor] = useState<string>();

  useEffect(() => { const o = params.get('open'); if (o) setOpenId(o); }, [params]);

  const setTab = (t: T) => {
    const p = new URLSearchParams(params);
    if (t === 'all') p.delete('status'); else p.set('status', t);
    setParams(p, { replace: true });
  };

  const counts = useMemo(() => {
    const r: Partial<Record<T, number>> = { all: state.orders.length, open: state.orders.filter(isOpenOrder).length };
    for (const s of ['Received', 'Processing', 'Ready', 'Collected', 'Cancelled'] as OrderStatus[]) r[s as T] = state.orders.filter((o) => o.status === s).length;
    return r;
  }, [state.orders]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...state.orders]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .filter((o) => (tab === 'all' ? true : tab === 'open' ? isOpenOrder(o) : o.status === tab))
      .filter((o) => !t || o.id.toLowerCase().includes(t) || (customer(o.customerId)?.name.toLowerCase().includes(t) ?? false) || o.items.some((i) => i.name.toLowerCase().includes(t)));
  }, [state.orders, tab, q, customer]);

  const todays = state.orders.filter((o) => o.date === TODAY && o.status !== 'Cancelled');
  const openOrder = state.orders.find((o) => o.id === openId);
  const purchaseCustomer = purchaseFor ? customer(purchaseFor) : undefined;

  const quick = (o: Order) => {
    const n = nextAction(o);
    if (!n) return null;
    return (
      <Button size="sm" variant={n.status === 'Ready' ? 'primary' : 'secondary'} icon={n.status === 'Ready' ? <PackageCheck size={14} /> : undefined}
        onClick={(e) => { e.stopPropagation(); act(o, n.status); }}>
        {n.label}
      </Button>
    );
  };

  return (
    <div className="page">
      <PageHeader title="Orders" subtitle="Track spectacles from order to collection"
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => { setNewFor(''); setPickCustomer(true); }}>New order</Button>} />

      <Card className="stat-card">
        <div className="stat-row">
          <Stat label="Orders today" value={todays.length} sub={inr(todays.reduce((s, o) => s + o.amount, 0))} />
          <Stat label="In progress" value={(counts.Received ?? 0) + (counts.Processing ?? 0)} sub="Received or processing" />
          <Stat label="Ready for pickup" value={counts.Ready ?? 0} sub="Customers notified on WhatsApp" />
          <Stat label="Completed" value={counts.Collected ?? 0} sub="All time" />
        </div>
      </Card>

      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search order ID, customer or product" />
      </div>
      <Tabs tabs={TABS.map((t) => ({ value: t, label: LABEL[t] }))} value={tab} onChange={setTab} counts={counts} />

      <Card pad={false}>
        {loading ? <SkeletonRows /> : list.length === 0 ? (
          <EmptyState icon={<Package size={22} />} title={q ? 'No orders match your search' : `No ${LABEL[tab].toLowerCase()} orders`} body={q ? 'Search by order ID like OC-2462, a customer name or a product.' : 'Orders appear here as soon as a purchase is recorded.'} />
        ) : (
          <div className="table-wrap">
            <table className="table table--cards">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Order date</th><th>Status</th><th /></tr></thead>
              <tbody>
                {list.map((o) => {
                  const c = customer(o.customerId);
                  return (
                    <tr key={o.id} className="is-clickable" onClick={() => setOpenId(o.id)}>
                      <td data-label="Order ID"><strong className="mono-num">{o.id}</strong></td>
                      <td data-label="Customer"><div className="person"><Avatar name={c?.name ?? '?'} size={28} /><span><strong>{c?.name}</strong></span></div></td>
                      <td data-label="Product"><span className="stack"><span>{o.items[0].name}</span>{o.items.length > 1 && <small>+ {o.items.slice(1).map((i) => i.name).join(', ')}</small>}</span></td>
                      <td data-label="Amount" className="nowrap"><strong>{inr(o.amount)}</strong></td>
                      <td data-label="Order date" className="nowrap">{fmtDate(o.date)}</td>
                      <td data-label="Status"><OrderBadge status={o.status} /></td>
                      <td className="cell-action">{quick(o)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <OrderDetailModal order={openOrder} onClose={() => { setOpenId(undefined); if (params.get('open')) { const p = new URLSearchParams(params); p.delete('open'); setParams(p, { replace: true }); } }} />

      <Modal open={pickCustomer} onClose={() => setPickCustomer(false)} title="New order" subtitle="Who is the order for?" size="sm"
        footer={<><Button variant="ghost" onClick={() => setPickCustomer(false)}>Cancel</Button><Button variant="primary" disabled={!newFor} onClick={() => { setPickCustomer(false); setPurchaseFor(newFor); }}>Continue</Button></>}>
        <Field label="Customer" full hint="New customer? Add them from the Customers page first.">
          <Select value={newFor} onChange={(e) => setNewFor(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
          </Select>
        </Field>
      </Modal>
      {purchaseCustomer && <AddPurchaseModal open onClose={() => setPurchaseFor(undefined)} customer={purchaseCustomer} />}
    </div>
  );
}
