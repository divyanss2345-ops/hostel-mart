import { useEffect, useState } from 'react';
import { Tag, Save, RefreshCw, IndianRupee } from 'lucide-react';
import { supabase, type ProductAdmin } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import { ButtonLoader, FullPageLoader } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminProduct() {
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function loadProduct() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    if (error) {
      toast('Failed to load product.', 'error');
      setLoading(false);
      return;
    }
    const p = (data as ProductAdmin[])?.[0] ?? null;
    setProduct(p);
    if (p) {
      setName(p.name);
      setDescription(p.description ?? '');
      setPrice(String(Number(p.price)));
      setImageUrl(p.image_url ?? '');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast('Please enter a valid price.', 'error');
      return;
    }
    if (!name.trim()) {
      toast('Product name cannot be empty.', 'error');
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc('admin_update_product', {
      p_product_id: product.id,
      p_name: name.trim(),
      p_description: description.trim(),
      p_price: priceNum,
      p_image_url: imageUrl.trim() || null,
    });

    if (error) {
      toast(error.message || 'Failed to update product.', 'error');
      setSaving(false);
      return;
    }

    setProduct({
      ...product,
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      image_url: imageUrl.trim() || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    toast('Product updated successfully.', 'success');
  }

  if (loading) {
    return (
      <AdminLayout active="product">
        <FullPageLoader message="Loading product..." />
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout active="product">
        <EmptyState
          icon={<Tag className="w-8 h-8" />}
          title="No product found"
          description="Add a product to get started."
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="product">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Product & Price</h1>
          <p className="text-sm text-ink-400 mt-1">Update Maggie packet details and pricing</p>
        </div>
        <button onClick={loadProduct} className="btn-ghost px-3 py-2" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden sticky top-24">
            <div className="aspect-square bg-ink-700 overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt={name || 'Maggie Packet'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-500">
                  <Tag className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-white">{name || 'Maggie Packet'}</h3>
              <p className="text-sm text-ink-400 mt-1 line-clamp-2">
                {description || 'Sealed instant Maggie noodle packet.'}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xl font-bold text-brand-400">
                  ₹{price ? parseFloat(price).toFixed(0) : '0'}
                </span>
                <span className="badge bg-success-500/15 text-success-400 border border-success-500/30">
                  {product.available ? 'Available' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6 space-y-5">
            <div>
              <label className="label" htmlFor="name">Product Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Maggie Packet"
              />
            </div>

            <div>
              <label className="label" htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[100px] resize-none"
                placeholder="Sealed instant Maggie noodle packet for your late-night hostel cravings."
              />
            </div>

            <div>
              <label className="label" htmlFor="price">Selling Price (per packet)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input pl-10"
                  min={0}
                  step={1}
                  placeholder="20"
                />
              </div>
              <p className="text-xs text-ink-400 mt-1.5">
                This is the price students see and pay.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="image">Image URL</label>
              <input
                id="image"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="input"
                placeholder="https://..."
              />
              <p className="text-xs text-ink-400 mt-1.5">
                Paste a direct link to a product image.
              </p>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? <ButtonLoader /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          {/* Info card */}
          <div className="card p-5 bg-ink-900/40">
            <p className="text-xs text-ink-400 leading-relaxed">
              <span className="text-ink-200 font-semibold">Note:</span> Changes to price and
              description are visible to students immediately. Stock management is handled in the
              Inventory section. Students never see the stock quantity.
            </p>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
