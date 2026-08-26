import { useEffect, useState } from 'react';
import { Package, Save, RefreshCw } from 'lucide-react';
import { supabase, type ProductAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import { ButtonLoader, FullPageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminProduct() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Form states stored per product ID
  const [formData, setFormData] = useState<Record<string, { name: string; description: string; price: string; image_url: string }>>({});

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast('Failed to load products.', 'error');
      setLoading(false);
      return;
    }

    const prods = (data as ProductAdmin[]) ?? [];
    setProducts(prods);

    const initialData: Record<string, { name: string; description: string; price: string; image_url: string }> = {};
    prods.forEach(p => {
      initialData[p.id] = {
        name: p.name,
        description: p.description ?? '',
        price: String(p.price),
        image_url: p.image_url ?? '',
      };
    });
    setFormData(initialData);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleSave(productId: string) {
    const item = formData[productId];
    if (!item) return;

    const priceNum = parseFloat(item.price);
    if (!item.name.trim() || isNaN(priceNum) || priceNum < 0) {
      toast('Please enter a valid name and price.', 'error');
      return;
    }

    setSavingId(productId);
    const { error } = await supabase.rpc('admin_update_product', {
      p_product_id: productId,
      p_name: item.name,
      p_description: item.description,
      p_price: priceNum,
      p_image_url: item.image_url,
    });

    if (error) {
      toast(error.message || 'Failed to update product details.', 'error');
      setSavingId(null);
      return;
    }

    setSavingId(null);
    toast('Product details updated successfully!', 'success');
    loadProducts();
  }

  if (loading) {
    return (
      <AdminLayout active="product">
        <FullPageLoader message="Loading products..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="product">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Product & Price Management</h1>
          <p className="text-sm text-ink-400 mt-1">Update details, descriptions, and pricing for all products</p>
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
          description="Add products to your database to manage them here."
        />
      ) : (
        <div className="space-y-8">
          {products.map(product => {
            const currentForm = formData[product.id] || { name: '', description: '', price: '', image_url: '' };
            const isSaving = savingId === product.id;

            return (
              <div key={product.id} className="card p-6 border border-ink-800 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Preview Card */}
                <div className="lg:col-span-1 bg-ink-900/60 p-4 rounded-2xl border border-ink-800 flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-ink-800 mb-4 shadow-md">
                    <img
                      src={currentForm.image_url || product.image_url}
                      alt={currentForm.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                      }}
                    />
                  </div>
                  <h2 className="text-lg font-bold text-white font-display">{currentForm.name || 'Product Name'}</h2>
                  <p className="text-xs text-ink-400 mt-1 line-clamp-2 px-2">{currentForm.description || 'No description provided.'}</p>
                  <p className="text-base font-bold text-brand-400 mt-3">₹{currentForm.price || '0'} per packet</p>
                  <span className={`mt-3 text-xs px-3 py-1 rounded-full font-medium ${product.available ? 'bg-success-500/10 text-success-400 border border-success-500/20' : 'bg-danger-500/10 text-danger-400 border border-danger-500/20'}`}>
                    {product.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Right Edit Form */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-400 uppercase tracking-wider mb-1.5">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={currentForm.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        [product.id]: { ...currentForm, name: e.target.value }
                      })}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-400 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={currentForm.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        [product.id]: { ...currentForm, description: e.target.value }
                      })}
                      className="input w-full resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-ink-400 uppercase tracking-wider mb-1.5">
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentForm.price}
                        onChange={(e) => setFormData({
                          ...formData,
                          [product.id]: { ...currentForm, price: e.target.value }
                        })}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-400 uppercase tracking-wider mb-1.5">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={currentForm.image_url}
                        onChange={(e) => setFormData({
                          ...formData,
                          [product.id]: { ...currentForm, image_url: e.target.value }
                        })}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleSave(product.id)}
                      disabled={isSaving}
                      className="btn-primary px-6 py-2.5 flex items-center gap-2"
                    >
                      {isSaving ? <ButtonLoader /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}