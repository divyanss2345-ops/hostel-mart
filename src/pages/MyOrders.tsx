import { useEffect, useState } from 'react';
import { ClipboardList, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase, type OrderWithItems } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigateTo } from '@/lib/router';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { FullPageLoader } from '@/components/ui/Spinner';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOrders() {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, user_id, student_name, room_number, contact_number, total_amount, status, created_at, order_items(id, order_id, product_id, quantity, price, product:products(id, name, description, price, image_url, available))',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }
    setOrders((data as unknown as OrderWithItems[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <FullPageLoader message="Loading your orders..." />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">My Orders</h1>
          <p className="text-sm text-ink-400 mt-1">Track your Maggie packet orders</p>
        </div>
        <button
          onClick={loadOrders}
          className="btn-ghost px-3 py-2"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title="Something went wrong"
          description={error}
          action={<button onClick={loadOrders} className="btn-primary">Try Again</button>}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title="No orders yet"
          description="When you place an order, it will show up here."
          action={
            <button onClick={() => navigateTo('/menu')} className="btn-primary">
              Order Maggie Packets
              <ArrowRight className="w-4 h-4" />
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5 hover:border-ink-500 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-ink-400">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-ink-400 mt-1">
                    {new Date(order.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-400">
                    ₹{Number(order.total_amount).toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-ink-700 flex-shrink-0">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <span className="text-white font-medium">{item.product?.name ?? 'Maggie Packet'}</span>
                      <span className="text-ink-400 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="text-ink-300">
                      ₹{(Number(item.price) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-ink-700 flex items-center gap-4 text-xs text-ink-400">
                <span>Room: <span className="text-ink-200">{order.room_number}</span></span>
                <span>Contact: <span className="text-ink-200">{order.contact_number}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
