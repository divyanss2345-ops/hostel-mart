import { useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, Search, Filter } from 'lucide-react';
import { supabase, type Order, type OrderItem, type Product, type OrderStatus } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { FullPageLoader, ButtonLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

interface OrderWithItems extends Order {
  order_items: (OrderItem & { product: Product })[];
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, user_id, student_name, room_number, contact_number, total_amount, status, created_at, order_items(id, order_id, product_id, quantity, price, product:products(id, name, description, price, image_url, available))',
      )
      .order('created_at', { ascending: false });

    if (error) {
      toast('Failed to load orders.', 'error');
      setLoading(false);
      return;
    }
    setOrders((data as unknown as OrderWithItems[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    const { error } = await supabase.rpc('admin_update_order_status', {
      p_order_id: orderId,
      p_new_status: newStatus,
    });

    if (error) {
      toast(error.message || 'Failed to update order status.', 'error');
      setUpdatingId(null);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    setUpdatingId(null);
    toast(`Order marked as ${newStatus}.`, 'success');
  }

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.student_name.toLowerCase().includes(q) ||
        o.room_number.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <AdminLayout active="orders">
        <FullPageLoader message="Loading orders..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="orders">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">All Orders</h1>
          <p className="text-sm text-ink-400 mt-1">Manage and update order statuses</p>
        </div>
        <button onClick={loadOrders} className="btn-ghost px-3 py-2" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, room, or order ID..."
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-ink-400 flex-shrink-0" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'all' ? 'bg-brand-500 text-white' : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
            }`}
          >
            All
          </button>
          {statusOptions.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === s.value ? 'bg-brand-500 text-white' : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title="No orders found"
          description={search ? 'Try a different search term.' : 'Orders will appear here once students place them.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-ink-400">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-base font-semibold text-white">{order.student_name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400 mt-1">
                      <span>Room: <span className="text-ink-200">{order.room_number}</span></span>
                      <span>Contact: <span className="text-ink-200">{order.contact_number}</span></span>
                      <span>{new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-brand-400">
                    ₹{Number(order.total_amount).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm bg-ink-900/40 rounded-lg p-2.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-ink-700 flex-shrink-0">
                      {item.product?.image_url && (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-ink-200 flex-1">{item.product?.name ?? 'Maggie Packet'}</span>
                    <span className="text-ink-400">x{item.quantity}</span>
                    <span className="text-white font-medium">
                      ₹{(Number(item.price) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status update */}
              <div className="border-t border-ink-700 pt-4">
                <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-2">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateStatus(order.id, s.value)}
                      disabled={updatingId === order.id || order.status === s.value}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                        order.status === s.value
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                          : 'bg-ink-700 text-ink-200 hover:bg-ink-600 border border-transparent'
                      }`}
                    >
                      {updatingId === order.id && <ButtonLoader />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
