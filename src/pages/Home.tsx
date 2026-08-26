import { useEffect, useState } from 'react';
import { Moon, Star, Clock, Flame, ShoppingCart, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { navigateTo } from '@/lib/router';

export default function Home() {
  const { profile } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      const maggie = (data as Product[])?.[0] ?? null;
      setProduct(maggie);
      setLoading(false);
    }
    load();
  }, []);

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
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.image_url,
    });
    toast(`${product.name} added to cart!`, 'success');
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-ink-950 to-ink-950" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(249,115,22,0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(234,179,8,0.1), transparent 50%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6 animate-pulse-glow">
              <Moon className="w-3.5 h-3.5" />
              Open Late Night
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white font-display tracking-tight text-balance leading-tight">
              Late Night Hunger?
              <br />
              <span className="text-gradient">We've Got You Covered.</span>
            </h1>
            <p className="text-base sm:text-lg text-ink-300 mt-6 max-w-xl mx-auto text-balance">
              Instant Maggie packets delivered straight to your hostel room. Order in seconds,
              track in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                onClick={() => navigateTo('/menu')}
                className="btn-primary w-full sm:w-auto"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Order Now
                <ArrowRight className="w-4 h-4" />
              </button>
              {!profile && (
                <button
                  onClick={() => navigateTo('/register')}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Create Account
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, title: 'Late Night Service', desc: 'Open when others are closed' },
            { icon: Flame, title: 'Ready to Cook', desc: 'Easy late-night hostel snack' },
            { icon: Star, title: 'Hostel Delivery', desc: 'Straight to your room' },
          ].map((f) => (
            <div key={f.title} className="card p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-xs text-ink-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured product */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title">Tonight's Special</h2>
            <p className="text-sm text-ink-400 mt-1">Ready to cook, just for you</p>
          </div>
          <button
            onClick={() => navigateTo('/menu')}
            className="text-sm text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
          >
            View Menu <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="card p-8 h-64 skeleton" />
        ) : product ? (
          <div className="card-hover overflow-hidden max-w-2xl mx-auto group">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-1/2 aspect-square sm:aspect-auto overflow-hidden bg-ink-700">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-500">
                    <UtensilsCrossed className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="sm:w-1/2 p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  {product.stock > 0 ? (
                    <span className="badge bg-success-500/15 text-success-400 border border-success-500/30">
                      Available
                    </span>
                  ) : (
                    <span className="badge bg-danger-500/15 text-danger-400 border border-danger-500/30">
                      Out of Stock
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white font-display">{product.name}</h3>
                <p className="text-sm text-ink-300 mt-2 flex-1">
                  {product.description ?? 'Sealed instant Maggie noodle packet for your late-night hostel cravings.'}
                </p>
                <div className="flex items-center justify-between mt-6">
                  <div>
                    <span className="text-2xl font-bold text-brand-400">
                      ₹{Number(product.price).toFixed(0)}
                    </span>
                    <span className="text-xs text-ink-400 ml-1">per packet</span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={product.stock <= 0 ? "bg-gray-400 opacity-50 cursor-not-allowed px-3 py-2 rounded-md" : "btn-primary"}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center text-ink-400">
            No products available right now. Check back soon!
          </div>
        )}
      </section>
      {/* Watermark Footer */}
<div className="w-full text-center py-6 mt-10 border-t border-gray-800/50">
  <p className="text-xs text-gray-500 tracking-wider uppercase font-semibold">
    Created for Hostel Mart • Powered by <span className="text-brand-400">Gemini AI</span>
  </p>
</div>
    </div>
  );
}
