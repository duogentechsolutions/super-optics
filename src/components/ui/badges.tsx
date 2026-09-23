import { Bell, Cake, Eye, Heart, Package, RefreshCw } from 'lucide-react';
import type { AutomationIcon, CustomerStatus, CustomerView, FollowUpType, OrderStatus } from '../../types';
import { Badge, type Tone } from './primitives';

export const orderTone: Record<OrderStatus, Tone> = {
  Received: 'blue',
  Processing: 'amber',
  Ready: 'green',
  Collected: 'grey',
  Cancelled: 'red',
};

export function OrderBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={orderTone[status]} dot>{status === 'Collected' ? 'Completed' : status}</Badge>;
}

const statusTone: Record<CustomerStatus, Tone> = { Active: 'green', 'Follow-up Due': 'amber', Inactive: 'grey' };

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <Badge tone={statusTone[status]} dot>{status}</Badge>;
}

export function CustomerTypeBadge({ c }: { c: Pick<CustomerView, 'type' | 'highValue'> }) {
  return (
    <span className="badge-row">
      <Badge tone={c.type === 'New' ? 'blue' : 'navy'}>{c.type}</Badge>
      {c.highValue && <Badge tone="violet">High value</Badge>}
    </span>
  );
}

export const followUpIcon: Record<FollowUpType, typeof Eye> = {
  'Eye Check Reminder': Eye,
  'Lens Replacement': RefreshCw,
  Birthday: Cake,
  'Order Ready': Package,
  'Post-Purchase Follow-up': Heart,
  'Custom Reminder': Bell,
};

export const automationIcon: Record<AutomationIcon, typeof Eye> = {
  eye: Eye,
  lens: RefreshCw,
  cake: Cake,
  package: Package,
  heart: Heart,
  bell: Bell,
};
