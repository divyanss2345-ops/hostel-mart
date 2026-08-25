import { useState } from 'react';
import { ArrowLeft, CheckCircle2, User, DoorOpen, Phone, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { navigateTo } from '@/lib/router';
import { ButtonLoader } from '@/components/ui/Spinner';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name ?? '');
  const [room, setRoom] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  // If cart is empty and not confirmed, redirect
  if (items.length === 0 && !confirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="card p-8">
          <ShoppingBag className="w-12 h-12 text-ink-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white">Your cart is empty</h2>
          <p className="text-sm text-ink-400 mt-1 mb-6">Add some Maggie packets before checking out!</p>
          <button onClick={() => navigateTo('/menu')} className="btn-primary">
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !room.trim() || !contact.trim()) {
      toast('Please fill in all fields.', 'error');
      return;
    }
    if (!/^\d{10}$/.test(contact.trim())) {
      toast('Please enter a valid 10-digit contact number.', 'error');
      return;
    }
    // We only sell Maggie, so there's exactly one product in the cart.
    const item = items[0];
    if (!item) {
      toast('Your cart is empty.', 'error');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('place_order', {
      p_student_name: name.trim(),
      p_room_number: room.trim(),
      p_contact_number: contact.trim(),
      p_product_id: item.productId,
      p_quantity: item.quantity,
    });

    if (error) {
      setLoading(false);
      toast(error.message || 'Something went wrong. Please try again.', 'error');
      return;
    }

    clearCart();
    setLoading(false);
    setConfirmed(data as string);
    toast('Order placed successfully!', 'success');
  }

  // Confirmation screen
  if (confirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success-500/15 border-2 border-success-500/30 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <CheckCircle2 className="w-8 h-8 text-success-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Order Placed!</h1>
          <p className="text-sm text-ink-300 mt-2">
            Your Maggie packet order is confirmed. Track it in My Orders.
          </p>
          <div className="bg-ink-900/60 rounded-xl p-4 mt-6 inline-block">
            <p className="text-xs text-ink-400 uppercase tracking-wide">Order ID</p>
            <p className="text-sm font-mono text-brand-400 mt-1">
              {confirmed.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button onClick={() => navigateTo('/orders')} className="btn-primary">
              View My Orders
            </button>
            <button onClick={() => navigateTo('/menu')} className="btn-secondary">
              Order More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button
        onClick={() => navigateTo('/cart')}
        className="flex items-center gap-2 text-sm text-ink-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </button>

      <h1 className="section-title mb-6">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="space-y-6">
        {/* Delivery details */}
        <div className="card p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Delivery Details
          </h2>

          <div>
            <label className="label" htmlFor="name">Student Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input pl-10"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="room">Hostel Room Number</label>
            <div className="relative">
              <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                id="room"
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="input pl-10"
                placeholder="e.g. B-204"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="contact">Contact Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                id="contact"
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="input pl-10"
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="card p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-ink-700 flex-shrink-0">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-ink-400 text-xs">₹{item.price.toFixed(0)} x {item.quantity}</p>
                  </div>
                </div>
                <span className="text-white font-semibold">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-ink-700 mt-4 pt-4">
            <div className="flex justify-between text-sm text-ink-300">
              <span>Delivery</span>
              <span className="text-success-400">Free</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-base font-semibold text-white">Total Amount</span>
              <span className="text-2xl font-bold text-brand-400">₹{totalPrice.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
          {loading ? (
            <>
              <ButtonLoader />
              Placing Order...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Place Order
            </>
          )}
        </button>
      </form>
    </div>
  );
}
