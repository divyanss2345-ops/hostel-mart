import { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingCart, ArrowLeft, UtensilsCrossed, Clock, Flame, Star } from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { navigateTo } from '@/lib/router';
import { FullPageLoader } from '@/components/ui/Spinner';

export default function ProductDetail({ productId }: { productId: string }) {
  const { profile } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_products_student');
      if (error) {
        setLoading(false);
        return;
      }
      const found = (data as Product[])?.find((p) => p.id === productId) ?? null;
      setProduct(found);
      setLoading(false);
    }
    load();
  }, [productId]);

  function handleAddToCart() {
    if (!product) return;
    if (!profile) {
      toast('Please log in to place an order.', 'info');
      navigateTo('/login');
      return;
    }
    if (!product.available) {
      toast('Maggie packets are currently out of stock.', 'error');
      return;
    }
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.image_url,
      },
      quantity,
    );
    toast(`${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to cart!`, 'success');
    navigateTo('/cart');
  }

  if (loading) return <FullPageLoader message="Loading product..." />;

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-ink-400">Product not found.</p>
        <button onClick={() => navigateTo('/menu')} className="btn-primary mt-4">
          Back to Menu
        </button>
      </div>
    );
  }

  const total = Number(product.price) * quantity;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button
        onClick={() => navigateTo('/menu')}
        className="flex items-center gap-2 text-sm text-ink-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </button>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square md:aspect-auto bg-ink-700 overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-500">
                <UtensilsCrossed className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              {product.available ? (
                <span className="badge bg-success-500/15 text-success-400 border border-success-500/30">
                  Available
                </span>
              ) : (
                <span className="badge bg-danger-500/15 text-danger-400 border border-danger-500/30">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white font-display">{product.name}</h1>
            <p className="text-ink-300 mt-3">{product.description}</p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { icon: Clock, label: '5 min', sub: 'Prep time' },
                { icon: Flame, label: 'Ready', sub: 'To cook' },
                { icon: Star, label: '4.8', sub: 'Rating' },
              ].map((f) => (
                <div key={f.sub} className="bg-ink-900/60 rounded-xl p-3 text-center">
                  <f.icon className="w-4 h-4 text-brand-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-white">{f.label}</div>
                  <div className="text-[10px] text-ink-400 uppercase tracking-wide">{f.sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="text-3xl font-bold text-brand-400">
                ₹{Number(product.price).toFixed(0)}
                <span className="text-sm text-ink-400 font-normal ml-1">per packet</span>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="mt-6">
              <label className="label">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!product.available || quantity <= 1}
                  className="w-10 h-10 rounded-xl bg-ink-700 hover:bg-ink-600 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-xl font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={!product.available}
                  className="w-10 h-10 rounded-xl bg-ink-700 hover:bg-ink-600 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total + Add */}
            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-ink-300">Total</span>
                <span className="text-2xl font-bold text-white">₹{total.toFixed(0)}</span>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!product.available}
                className="btn-primary w-full"
              >
                <ShoppingCart className="w-4 h-4" />
                {product.available ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
