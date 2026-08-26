import { useEffect, useState } from 'react';
import { Package, Plus, Minus, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { supabase, type ProductAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import { ButtonLoader, FullPageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminInventory() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast('Failed to load inventory.', 'error');
      setLoading(false);
      return;
    }

    const prods = (data as ProductAdmin[]) ?? [];
    setProducts(prods);

    // Initialize stock input values for each product
    const inputs: Record<string, string> = {};
    prods.forEach(p => {
      inputs[p.id] = String(p.stock);
    });
    setStockInputs(inputs);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function updateStock(productId: string, delta: number) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);
    setSavingId(productId);

    const { error } = await supabase.rpc('admin_update_product', {
      p_product_id: productId,
      p_stock: newStock,
    });

    if (error) {
      toast(error.message || 'Failed to update stock.', 'error');
      setSavingId(null);
      return;
    }

    setProducts(products.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    setStockInputs({ ...stockInputs, [productId]: String(newStock) });
    setSavingId(null);
    toast(`Stock updated successfully.`, 'success');
  }

  async function setStock(productId: string) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const val = parseInt(stockInputs[productId], 10);
    if (isNaN(val) || val < 0) {
      toast('Please enter a valid stock number.', 'error');
      return;
    }

    setSavingId(productId);
    const { error } = await supabase.rpc('admin_update_product', {
      p_product_id: productId,
      p_stock: val,
    });

    if (error) {
      toast(error.message || 'Failed to update stock.', 'error');
      setSavingId(null);
      return;
    }

    setProducts(products.map(p => p.id === productId ? { ...p, stock: val } : p));
    setSavingId(null);
    toast('Stock updated successfully.', 'success');
  }

  async function toggleAvailable(productId: string) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setSavingId(productId);
    const { error } = await supabase.rpc('admin_update_product', {
      p_product_id: productId,
      p_available: !product.available,
    });

    if (error) {
      toast(error.message || 'Failed to update availability.', 'error');
      setSavingId(null);
      return;
    }

    setProducts(products.map(p => p.id === productId ? { ...p, available: !p.available } : p));
    setSavingId(null);
    toast(`${product.name} status updated.`, 'success');
  }

  if (loading) {
    return (
      <AdminLayout active="inventory">
        <FullPageLoader message="Loading inventory..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="inventory">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Inventory Management</h1>
          <p className="text-sm text-ink-400 mt-1">Manage stock levels for all products in your store</p>
        </div>
        <button
          onClick={loadProducts}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-800 text-white hover:bg-ink-700 transition text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Add products to your store database to manage their inventory here."
        />
      ) : (
        <div className="space-y-6">
          {products.map(product => (
            <div key={product.id} className="card p-6 border border-ink-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-ink-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-ink-800 flex-shrink-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-white font-display">{product.name}</h2>
                      <button
                        onClick={() => toggleAvailable(product.id)}
                        disabled={savingId === product.id}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                          product.available
                            ? 'bg-success-500/10 text-success-400 border border-success-500/20 hover:bg-success-500/20'
                            : 'bg-danger-500/10 text-danger-400 border border-danger-500/20 hover:bg-danger-500/20'
                        }`}
                      >
                        {product.available ? 'Available' : 'Unavailable'}
                      </button>
                    </div>
                    <p className="text-sm text-brand-400 font-medium mt-0.5">₹{product.price} per packet</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-ink-900/60 px-4 py-2 rounded-xl border border-ink-800/80">
                  <Package className="w-4 h-4 text-ink-400" />
                  <span className="text-sm text-ink-300">Current Stock:</span>
                  <span className={`text-base font-bold ${product.stock > 0 ? 'text-white' : 'text-danger-400'}`}>
                    {product.stock} packets
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">
                    Quick Adjust Stock
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[-1, -5, 5, 10, 50].map(delta => (
                      <button
                        key={delta}
                        onClick={() => updateStock(product.id, delta)}
                        disabled={savingId === product.id || (product.stock + delta < 0)}
                        className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                          delta > 0
                            ? 'bg-success-500/10 text-success-400 hover:bg-success-500/20 border border-success-500/20'
                            : 'bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 border border-danger-500/20'
                        }`}
                      >
                        {delta > 0 ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        {delta > 0 ? `+${delta}` : delta}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">
                    Set Exact Stock
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={stockInputs[product.id] ?? ''}
                      onChange={(e) => setStockInputs({ ...stockInputs, [product.id]: e.target.value })}
                      className="input flex-1"
                      placeholder="Enter exact stock"
                    />
                    <button
                      onClick={() => setStock(product.id)}
                      disabled={savingId === product.id}
                      className="btn-primary px-4 py-2 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}