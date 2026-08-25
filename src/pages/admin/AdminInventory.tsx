import { useEffect, useState } from 'react';
import { Package, Plus, Minus, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { supabase, type ProductAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import { ButtonLoader, FullPageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminInventory() {
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockInput, setStockInput] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadProduct() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    if (error) {
      toast('Failed to load inventory.', 'error');
      setLoading(false);
      return;
    }
    const p = (data as ProductAdmin[])?.[0] ?? null;
    setProduct(p);
    setStockInput(p ? String(p.stock) : '');
    setLoading(false);
  }

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStock(delta: number) {
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    setSaving(true);
    const { error } = await supabase.rpc('admin_update_product', {
      p_product_id: product.id,
      p_stock: newStock,
    });
    if (error) {
      toast(error.message || 'Failed to update stock.', 'error');
      setSaving(false);
      return;
    }
    setProduct({ ...product, stock: newStock });
    setStockInput(String(newStock));
    setSaving(false);
    toast(`Stock ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}.`, 'success');
  }

  async function setStock() {
    if (!product) return;
    const val = parseInt(stockInput, 10);
    if (isNaN(val) || val < 0) {
      toast('Please enter a valid stock number.', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('admin_update_product', {
      p_product_id: product.id,
      p_stock: val,
    });
    if (error) {
      toast(error.message || 'Failed to update stock.', 'error');
      setSaving(false);
      return;
    }
    setProduct({ ...product, stock: val });
    setSaving(false);
    toast('Stock updated successfully.', 'success');
  }

  async function toggleAvailable() {
    if (!product) return;
    setSaving(true);
    const { error } = await supabase.rpc('admin_update_product', {
      p_product_id: product.id,
      p_available: !product.available,
    });
    if (error) {
      toast(error.message || 'Failed to update availability.', 'error');
      setSaving(false);
      return;
    }
    setProduct({ ...product, available: !product.available });
    setSaving(false);
    toast(`Maggie packets are now ${!product.available ? 'available' : 'unavailable'}.`, 'success');
  }

  if (loading) {
    return (
      <AdminLayout active="inventory">
        <FullPageLoader message="Loading inventory..." />
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout active="inventory">
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No products found"
          description="Add a product from the Product & Price section."
        />
      </AdminLayout>
    );
  }

  const stockLevel = product.stock === 0 ? 'out' : product.stock <= 10 ? 'low' : 'good';
  const stockColor =
    stockLevel === 'out' ? 'text-danger-400 bg-danger-500/10' : stockLevel === 'low' ? 'text-warning-400 bg-warning-500/10' : 'text-success-400 bg-success-500/10';

  return (
    <AdminLayout active="inventory">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Inventory</h1>
          <p className="text-sm text-ink-400 mt-1">Manage Maggie packet stock levels</p>
        </div>
        <button onClick={loadProduct} className="btn-ghost px-3 py-2" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stock status card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-ink-700 flex-shrink-0">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{product.name}</h2>
            <p className="text-sm text-ink-400">₹{Number(product.price).toFixed(0)} per packet</p>
          </div>
          <div className="ml-auto text-right">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${stockColor}`}>
              {stockLevel === 'out' && <AlertTriangle className="w-4 h-4" />}
              {product.stock} packets in stock
            </div>
          </div>
        </div>

        {/* Quick adjust */}
        <div className="border-t border-ink-700 pt-5">
          <p className="text-sm font-semibold text-white mb-3">Quick Adjust Stock</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => updateStock(-1)}
              disabled={saving || product.stock === 0}
              className="btn-danger px-4 py-2.5"
            >
              <Minus className="w-4 h-4" />
              1
            </button>
            <button
              onClick={() => updateStock(-5)}
              disabled={saving || product.stock < 5}
              className="btn-danger px-4 py-2.5"
            >
              <Minus className="w-4 h-4" />
              5
            </button>
            <button
              onClick={() => updateStock(5)}
              disabled={saving}
              className="btn-secondary px-4 py-2.5"
            >
              <Plus className="w-4 h-4" />
              5
            </button>
            <button
              onClick={() => updateStock(10)}
              disabled={saving}
              className="btn-secondary px-4 py-2.5"
            >
              <Plus className="w-4 h-4" />
              10
            </button>
            <button
              onClick={() => updateStock(50)}
              disabled={saving}
              className="btn-secondary px-4 py-2.5"
            >
              <Plus className="w-4 h-4" />
              50
            </button>
          </div>
        </div>
      </div>

      {/* Set exact stock */}
      <div className="card p-6 mb-6">
        <p className="text-sm font-semibold text-white mb-3">Set Exact Stock</p>
        <div className="flex gap-3">
          <input
            type="number"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            min={0}
            className="input"
            placeholder="Enter stock quantity"
          />
          <button onClick={setStock} disabled={saving} className="btn-primary px-5">
            {saving ? <ButtonLoader /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Availability toggle */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Product Availability</p>
            <p className="text-xs text-ink-400 mt-1">
              {product.available
                ? 'Maggie packets are currently visible and orderable by students.'
                : 'Maggie packets are hidden from students and cannot be ordered.'}
            </p>
          </div>
          <button
            onClick={toggleAvailable}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              product.available ? 'bg-success-500' : 'bg-ink-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                product.available ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
