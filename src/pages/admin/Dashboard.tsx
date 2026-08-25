import { useEffect, useState } from 'react';
import { ClipboardList, Clock, CheckCircle2, IndianRupee, Package, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase, type Order, type ProductAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { navigateTo } from '@/lib/router';
import { FullPageLoader } from '@/components/ui/Spinner';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [product, setProduct] = useState<ProductAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ordersRes, productRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: true }),
      ]);

      setOrders((ordersRes.data as Order[]) ?? []);
      const products = (productRes.data as ProductAdmin[]) ?? [];
      setProduct(products[0] ?? null);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout active="dashboard">
        <FullPageLoader message="Loading dashboard..." />
      </AdminLayout>
    );
  }

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready',
  ).length;
  const completedOrders = orders.filter((o) => o.status === 'delivered').length;
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const todaySales = todayOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const stats = [
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: ClipboardList,
      color: 'brand',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders,
      icon: Clock,
      color: 'warning',
    },
    {
      label: 'Completed Orders',
      value: completedOrders,
      icon: CheckCircle2,
      color: 'success',
    },
    {
      label: "Today's Sales",
      value: `₹${todaySales.toFixed(0)}`,
      icon: IndianRupee,
      color: 'accent',
    },
    {
      label: 'Total Sales',
      value: `₹${totalSales.toFixed(0)}`,
      icon: TrendingUp,
      color: 'brand',
    },
    {
      label: 'Maggie Packets in Stock',
      value: product?.stock ?? 0,
      icon: Package,
      color: product && product.stock > 0 ? 'success' : 'danger',
    },
  ];

  const colorMap: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    warning: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
    success: 'bg-success-500/10 text-success-400 border-success-500/20',
    accent: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
    danger: 'bg-danger-500/10 text-danger-400 border-danger-500/20',
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <AdminLayout active="dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-display">Dashboard Overview</h1>
        <p className="text-sm text-ink-400 mt-1">Monitor your mart at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`card p-5 border ${colorMap[stat.color]}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-ink-400 uppercase tracking-wide font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${colorMap[stat.color]} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          <button
            onClick={() => navigateTo('/admin/orders')}
            className="text-sm text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-8">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-xl bg-ink-900/40 hover:bg-ink-900/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-ink-400 hidden sm:block">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{order.student_name}</p>
                    <p className="text-xs text-ink-400">
                      Room {order.room_number} · {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    ₹{Number(order.total_amount).toFixed(0)}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
