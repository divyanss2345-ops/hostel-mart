import { Clock, ChefHat, CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import type { OrderStatus } from '@/lib/supabase';

const config: Record<OrderStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: {
    label: 'Pending',
    className: 'bg-warning-500/15 text-warning-400 border border-warning-500/30',
    icon: Clock,
  },
  preparing: {
    label: 'Preparing',
    className: 'bg-brand-500/15 text-brand-400 border border-brand-500/30',
    icon: ChefHat,
  },
  ready: {
    label: 'Ready',
    className: 'bg-accent-500/15 text-accent-400 border border-accent-500/30',
    icon: PackageCheck,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-success-500/15 text-success-400 border border-success-500/30',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-danger-500/15 text-danger-400 border border-danger-500/30',
    icon: XCircle,
  },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`badge ${c.className}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}
