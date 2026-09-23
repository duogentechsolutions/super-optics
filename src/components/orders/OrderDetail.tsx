import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MessageCircle, PackageCheck, XCircle } from 'lucide-react';
import { useStore } from '../../store/AppStore';
import { useToast } from '../ui/Toast';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { Button } from '../ui/primitives';
import { OrderBadge } from '../ui/badges';
import type { Order, OrderStatus } from '../../types';
import { fmtDate, inr } from '../../lib/format';

const FLOW: OrderStatus[] = ['Received', 'Processing', 'Ready', 'Collected'];

export function useOrderActions() {
  const { setOrderStatus, customer } = useStore();
  const toast = useToast();
  return (o: Order, status: OrderStatus) => {
    const { notified } = setOrderStatus(o.id, status);
    const name = customer(o.customerId)?.name ?? 'Customer';
    if (status === 'Ready') {
      toast(`Order ${o.id} marked Ready`, { body: `${name} can collect it now.` });
      if (notified) setTimeout(() => toast('WhatsApp notification sent', { tone: 'whatsapp', body: `“Your order ${o.id} is ready for collection” sent to ${name}.` }), 450);
      else setTimeout(() => toast('Order Ready automation is off', { tone: 'warning', body: 'Turn it on in Follow-ups to notify customers automatically.' }), 450);
    } else if (status === 'Collected') {
      toast(`Order ${o.id} completed`, { body: `Post-purchase follow-up scheduled for ${name} in 7 days.` });
    } else if (status === 'Cancelled') {
      toast(`Order ${o.id} cancelled`, { tone: 'warning' });
    } else {
      toast(`Order ${o.id} moved to ${status}`);
    }
  };
}

export function nextAction(o: Order): { status: OrderStatus; label: string } | null {
  if (o.status === 'Received') return { status: 'Processing', label: 'Start processing' };
  if (o.status === 'Processing') return { status: 'Ready', label: 'Mark as Ready' };
  if (o.status === 'Ready') return { status: 'Collected', label: 'Mark as Collected' };
  return null;
}

export function OrderDetailModal({ order, onClose }: { order?: Order; onClose: () => void }) {
  const { customer, state } = useStore();
  const act = useOrderActions();
  const nav = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const live = order ? state.orders.find((o) => o.id === order.id) ?? order : undefined;
  if (!live) return null;
  const c = customer(live.customerId);
  const step = FLOW.indexOf(live.status);
  const next = nextAction(live);

  return (
    <>
      <Modal open={!!order} onClose={onClose} title={`Order ${live.id}`} subtitle={`${c?.name} · ${fmtDate(live.date)} · ${live.paymentMode}`}
        footer={
          <>
            {live.status !== 'Cancelled' && live.status !== 'Collected' && (
              <Button variant="ghost" icon={<XCircle size={16} />} onClick={() => setConfirmCancel(true)}>Cancel order</Button>
            )}
            <Button variant="secondary" icon={<MessageCircle size={16} />} onClick={() => nav(`/whatsapp?c=${live.customerId}`)}>Open chat</Button>
            {next && (
              <Button variant="primary" icon={next.status === 'Ready' ? <PackageCheck size={16} /> : <Check size={16} />} onClick={() => act(live, next.status)}>
                {next.label}
              </Button>
            )}
          </>
        }>
        <div className="order-detail">
          <div className="order-detail__status">
            <OrderBadge status={live.status} />
            {live.expectedDate && live.status !== 'Collected' && live.status !== 'Cancelled' && <span className="muted">Expected {fmtDate(live.expectedDate)}</span>}
          </div>
          {live.status !== 'Cancelled' && (
            <ol className="stepper">
              {FLOW.map((s, i) => (
                <li key={s} className={i < step ? 'is-done' : i === step ? 'is-current' : ''}>
                  <span>{i < step ? <Check size={12} /> : i + 1}</span>
                  {s === 'Collected' ? 'Completed' : s}
                </li>
              ))}
            </ol>
          )}
          <ul className="line-items line-items--static">
            {live.items.map((i) => (
              <li key={i.productId}>
                <div><strong>{i.name}</strong><small>{i.category}{i.qty > 1 ? ` · ${i.qty} × ${inr(i.price)}` : ''}</small></div>
                <strong className="line-items__amt">{inr(i.price * i.qty)}</strong>
              </li>
            ))}
            <li className="line-items__total"><span>Total</span><strong>{inr(live.amount)}</strong></li>
          </ul>
          {live.status === 'Processing' && <p className="hint-box">Marking this order Ready sends the customer an automatic WhatsApp message.</p>}
        </div>
      </Modal>
      <ConfirmDialog open={confirmCancel} onClose={() => setConfirmCancel(false)} danger title={`Cancel order ${live.id}?`}
        body="The order will be marked Cancelled and removed from sales totals. This can't be undone in the demo."
        confirmLabel="Cancel order" onConfirm={() => act(live, 'Cancelled')} />
    </>
  );
}
