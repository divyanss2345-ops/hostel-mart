import { useEffect, useState } from 'react';
import { UtensilsCrossed, ShoppingCart, ArrowRight } from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { navigateTo } from '@/lib/router';
import EmptyState from '@/components/ui/EmptyState';
import { FullPageLoader } from '@/components/ui/Spinner';

export default function Menu() {
  const { profile } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleAdd(product: Product) {
    if (!profile) {
      toast('Please log in to place an order.', 'info');
      navigateTo('/login');
      return;
    }
    if (!product.available) {
      toast('Maggie packets are currently out of stock.', 'error');
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.image_url,
    });
    toast(`${product.name} added to cart!`, 'success');
  }

  if (loading) return <FullPageLoader message="Loading menu..." />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          icon={<UtensilsCrossed className="w-8 h-8" />}
          title="Something went wrong"
          description={error}
          action={<button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title">Our Menu</h1>
        <p className="text-sm text-ink-400 mt-1">Instant Maggie packets, delivered to your room</p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="w-8 h-8" />}
          title="No items available"
          description="Check back later — we're restocking!"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <div key={p.id} className="card-hover overflow-hidden flex flex-col group">
              <button
                onClick={() => navigateTo(`/product/${p.id}`)}
                className="block aspect-[4/3] overflow-hidden bg-ink-700 relative"
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-500">
                    <UtensilsCrossed className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  {p.stock > 0 ? (
                    <span className="badge bg-success-500/20 text-success-400 border border-success-500/40 backdrop-blur-sm">
                      Available
                    </span>
                  ) : (
                    <span className="badge bg-danger-500/20 text-danger-400 border border-danger-500/40 backdrop-blur-sm">
                      Out of Stock
                    </span>
                  )}
                </div>
              </button>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="text-sm text-ink-400 mt-1 flex-1 line-clamp-2">
                  {p.description ?? 'Sealed instant Maggie noodle packet.'}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold text-brand-400">
                    ₹{Number(p.price).toFixed(0)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateTo(`/product/${p.id}`)}
                      className="btn-ghost px-3 py-2"
                    >
                      Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAdd(p)}
                      disabled={p.stock === 0}
                      className={p.stock === 0 ? "bg-gray-400 opacity-50 cursor-not-allowed px-3 py-2 rounded-md" : "btn-primary px-3 py-2"}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
