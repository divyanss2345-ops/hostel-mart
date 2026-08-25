import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { navigateTo } from '@/lib/router';
import EmptyState from '@/components/ui/EmptyState';

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const { profile } = useAuth();
  const { toast } = useToast();

  function handleCheckout() {
    if (!profile) {
      toast('Please log in to place an order.', 'info');
      navigateTo('/login');
      return;
    }
    if (items.length === 0) {
      toast('Your cart is empty.', 'error');
      return;
    }
    navigateTo('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
        <h1 className="section-title mb-6">Your Cart</h1>
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Your cart is empty"
          description="Add some Maggie packets to get started!"
          action={
            <button onClick={() => navigateTo('/menu')} className="btn-primary">
              Browse Menu
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button
        onClick={() => navigateTo('/menu')}
        className="flex items-center gap-2 text-sm text-ink-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Continue Shopping
      </button>

      <h1 className="section-title mb-6">
        Your Cart
        <span className="text-sm font-normal text-ink-400 ml-2">({totalItems} item{totalItems > 1 ? 's' : ''})</span>
      </h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="card p-4 flex items-center gap-4">
            {/* Image */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-ink-700 flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-500">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-white truncate">{item.name}</h3>
              <p className="text-sm text-brand-400 font-bold">₹{item.price.toFixed(0)}</p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="w-8 h-8 rounded-lg bg-ink-700 hover:bg-ink-600 text-white flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-8 h-8 rounded-lg bg-ink-700 hover:bg-ink-600 text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white">₹{(item.price * item.quantity).toFixed(0)}</div>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.productId)}
              className="w-8 h-8 rounded-lg text-ink-400 hover:text-danger-400 hover:bg-danger-500/10 flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card p-5 mt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-ink-300">
            <span>Items</span>
            <span>{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-300">
            <span>Delivery</span>
            <span className="text-success-400">Free</span>
          </div>
          <div className="border-t border-ink-700 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-white">Total</span>
              <span className="text-2xl font-bold text-brand-400">₹{totalPrice.toFixed(0)}</span>
            </div>
          </div>
        </div>
        <button onClick={handleCheckout} className="btn-primary w-full mt-5">
          Proceed to Checkout
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
