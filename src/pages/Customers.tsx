import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Plus, UserRound, Users } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useFakeLoading } from '../hooks/useFakeLoading';
import { Avatar, Button, Card, EmptyState, PageHeader, SearchInput, SkeletonRows } from '../components/ui/primitives';
import { CustomerStatusBadge, CustomerTypeBadge } from '../components/ui/badges';
import { CustomerFormModal } from '../components/customers/CustomerModals';
import { fmtDate, inr, relativeDay, rx } from '../lib/format';
import type { CustomerView } from '../types';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New customer' },
  { key: 'returning', label: 'Returning customer' },
  { key: 'due', label: 'Follow-up due' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'high', label: 'High value' },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

const match: Record<FilterKey, (c: CustomerView) => boolean> = {
  all: () => true,
  new: (c) => c.type === 'New' && c.status !== 'Inactive',
  returning: (c) => c.type === 'Returning' && c.status !== 'Inactive',
  due: (c) => c.status === 'Follow-up Due',
  inactive: (c) => c.status === 'Inactive',
  high: (c) => c.highValue,
};

export default function Customers() {
  const { customers } = useStore();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const filter = (params.get('filter') as FilterKey) || 'all';
  const [adding, setAdding] = useState(params.get('new') === '1');
  const loading = useFakeLoading(400);

  useEffect(() => { if (params.get('new') === '1') setAdding(true); }, [params]);

  const setFilter = (f: FilterKey) => {
    const p = new URLSearchParams(params);
    if (f === 'all') p.delete('filter'); else p.set('filter', f);
    setParams(p, { replace: true });
  };

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, customers.filter(match[f.key]).length])), [customers]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    return customers
      .filter(match[filter])
      .filter((c) => !t || c.name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || (digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits)))
      .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
  }, [customers, filter, q]);

  const open = (id: string) => nav(`/customers/${id}`);

  return (
    <div className="page">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} profiles · ${counts.due} with follow-ups due`}
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setAdding(true)}>Add customer</Button>}
      />

      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search by name, phone or email" />
        <div className="filter-chips" role="group" aria-label="Filter customers">
          {FILTERS.map((f) => (
            <button key={f.key} className={`chip ${filter === f.key ? 'is-active' : ''}`} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}>
              {f.label} <span>{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {(q || filter !== 'all') && !loading && (
        <p className="result-note">
          {list.length} {list.length === 1 ? 'customer' : 'customers'}{q && <> matching “{q}”</>}
          {filter !== 'all' && <> · {FILTERS.find((f) => f.key === filter)?.label}</>}
          <button className="link-btn" onClick={() => { setQ(''); setFilter('all'); }}>Clear</button>
        </p>
      )}

      <Card pad={false}>
        {loading ? <SkeletonRows rows={7} /> : list.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title="No customers match"
            body={q ? 'Check the spelling or search by the last 4 digits of the phone number.' : 'Nobody fits this filter right now.'}
            action={<Button onClick={() => { setQ(''); setFilter('all'); }}>Show all customers</Button>} />
        ) : (
          <>
            <div className="table-wrap desktop-only">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th><th>Phone</th><th>Last visit</th><th>Last purchase</th><th>Prescription</th>
                    <th>Customer type</th><th>Next follow-up</th><th>Status</th><th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} onClick={() => open(c.id)} className="is-clickable">
                      <td>
                        <div className="person">
                          <Avatar name={c.name} size={32} />
                          <span><strong>{c.name}</strong><small>{c.area}</small></span>
                        </div>
                      </td>
                      <td className="nowrap">+91 {c.phone}</td>
                      <td className="nowrap">{fmtDate(c.lastVisit)}</td>
                      <td>{c.lastPurchase ? <span className="stack"><span>{c.lastPurchase.items[0].name}</span><small>{inr(c.lastPurchase.amount)}</small></span> : <span className="muted">—</span>}</td>
                      <td className="nowrap">{c.latestRx ? <span className="rx-mini">R {rx(c.latestRx.right.sph)} · L {rx(c.latestRx.left.sph)}</span> : <span className="muted">None</span>}</td>
                      <td><CustomerTypeBadge c={c} /></td>
                      <td className="nowrap">{c.nextFollowUp ? <span className="stack"><span>{relativeDay(c.nextFollowUp.dueDate)}</span><small>{c.nextFollowUp.type}</small></span> : <span className="muted">—</span>}</td>
                      <td><CustomerStatusBadge status={c.status} /></td>
                      <td>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="icon-btn icon-btn--sm" data-tip="Open WhatsApp" onClick={() => nav(`/whatsapp?c=${c.id}`)}><MessageCircle size={16} /></button>
                          <button className="icon-btn icon-btn--sm" data-tip="View profile" onClick={() => open(c.id)}><UserRound size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="card-list mobile-only">
              {list.map((c) => (
                <li key={c.id}>
                  <button onClick={() => open(c.id)}>
                    <div className="person">
                      <Avatar name={c.name} size={40} />
                      <span><strong>{c.name}</strong><small>+91 {c.phone}</small></span>
                    </div>
                    <CustomerStatusBadge status={c.status} />
                    <dl>
                      <div><dt>Last visit</dt><dd>{fmtDate(c.lastVisit)}</dd></div>
                      <div><dt>Spent</dt><dd>{inr(c.totalSpent)}</dd></div>
                      <div><dt>Next follow-up</dt><dd>{c.nextFollowUp ? relativeDay(c.nextFollowUp.dueDate) : '—'}</dd></div>
                      <div><dt>Type</dt><dd><CustomerTypeBadge c={c} /></dd></div>
                    </dl>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <CustomerFormModal
        open={adding}
        onClose={() => { setAdding(false); if (params.get('new')) { const p = new URLSearchParams(params); p.delete('new'); setParams(p, { replace: true }); } }}
        onSaved={(c) => nav(`/customers/${c.id}`)}
      />
    </div>
  );
}
