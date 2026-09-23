import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, UserRound } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useFakeLoading } from '../hooks/useFakeLoading';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, SearchInput, SkeletonRows } from '../components/ui/primitives';
import { Modal } from '../components/ui/Modal';
import { RxSlip } from '../components/prescriptions/Rx';
import { TODAY, diffDays, fmtDate, rx } from '../lib/format';
import type { Prescription } from '../types';

const FILTERS = ['All', 'Current only', 'Progressive', 'Blue cut', 'Contact lenses', 'Re-check due'] as const;
type F = (typeof FILTERS)[number];

export default function Prescriptions() {
  const { state, customer } = useStore();
  const nav = useNavigate();
  const loading = useFakeLoading(400);
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('All');
  const [open, setOpen] = useState<Prescription>();

  const latestByCustomer = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of [...state.prescriptions].sort((a, b) => a.date.localeCompare(b.date))) m.set(p.customerId, p.id);
    return m;
  }, [state.prescriptions]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...state.prescriptions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((p) => {
        const current = latestByCustomer.get(p.customerId) === p.id;
        const advice = p.lensAdvice.toLowerCase();
        switch (f) {
          case 'Current only': return current;
          case 'Progressive': return advice.includes('progressive');
          case 'Blue cut': return advice.includes('blue');
          case 'Contact lenses': return advice.includes('contact');
          case 'Re-check due': return current && diffDays(TODAY, p.date) >= 182;
          default: return true;
        }
      })
      .filter((p) => !t || (customer(p.customerId)?.name.toLowerCase().includes(t) ?? false) || p.optometrist.toLowerCase().includes(t));
  }, [state.prescriptions, q, f, latestByCustomer, customer]);

  return (
    <div className="page">
      <PageHeader title="Prescriptions" subtitle={`${state.prescriptions.length} prescriptions across ${latestByCustomer.size} customers`} />
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search by customer or optometrist" />
        <div className="filter-chips">
          {FILTERS.map((x) => <button key={x} className={`chip ${f === x ? 'is-active' : ''}`} onClick={() => setF(x)}>{x}</button>)}
        </div>
      </div>
      <Card pad={false}>
        {loading ? <SkeletonRows /> : list.length === 0 ? (
          <EmptyState icon={<Eye size={22} />} title="No prescriptions found" body="Try another filter or search term." action={<Button onClick={() => { setQ(''); setF('All'); }}>Clear filters</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="table table--cards">
              <thead>
                <tr><th>Customer</th><th>Date</th><th>Right (OD)</th><th>Left (OS)</th><th>Add</th><th>Lens advice</th><th>Optometrist</th><th /></tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const c = customer(p.customerId);
                  const current = latestByCustomer.get(p.customerId) === p.id;
                  const age = diffDays(TODAY, p.date);
                  return (
                    <tr key={p.id} className="is-clickable" onClick={() => setOpen(p)}>
                      <td data-label="Customer"><div className="person"><Avatar name={c?.name ?? '?'} size={30} /><span><strong>{c?.name}</strong><small>{current ? 'Current' : 'Previous'}</small></span></div></td>
                      <td data-label="Date" className="nowrap">{fmtDate(p.date)}{current && age >= 182 && <> <Badge tone="amber">Re-check due</Badge></>}</td>
                      <td data-label="Right (OD)" className="mono-num">{rx(p.right.sph)} / {rx(p.right.cyl)} × {p.right.axis || '—'}</td>
                      <td data-label="Left (OS)" className="mono-num">{rx(p.left.sph)} / {rx(p.left.cyl)} × {p.left.axis || '—'}</td>
                      <td data-label="Add" className="mono-num">{p.right.add ? rx(p.right.add) : '—'}</td>
                      <td data-label="Lens advice">{p.lensAdvice}</td>
                      <td data-label="Optometrist" className="nowrap">{p.optometrist}</td>
                      <td><button className="icon-btn icon-btn--sm" data-tip="Open profile" onClick={(e) => { e.stopPropagation(); nav(`/customers/${p.customerId}?tab=prescription`); }}><UserRound size={16} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {open && (
        <Modal open onClose={() => setOpen(undefined)} title={customer(open.customerId)?.name ?? 'Prescription'} subtitle={`Prescription · ${fmtDate(open.date)}`}
          footer={<><Button variant="ghost" onClick={() => setOpen(undefined)}>Close</Button><Button variant="primary" onClick={() => nav(`/customers/${open.customerId}?tab=prescription`)}>View full history</Button></>}>
          <RxSlip p={open} />
        </Modal>
      )}
    </div>
  );
}
