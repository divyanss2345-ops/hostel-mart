import { useState } from 'react';
import { ShoppingCart, Home as HomeIcon, UtensilsCrossed, ClipboardList, LogIn, User as UserIcon, LogOut, Menu, X, Moon, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { navigateTo } from '@/lib/router';

export default function Navbar() {
  const { profile, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'Home', icon: HomeIcon, path: '/' },
    { label: 'Menu', icon: UtensilsCrossed, path: '/menu' },
    { label: 'My Orders', icon: ClipboardList, path: '/orders' },
    ...(isAdmin ? [{ label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' }] : []),
  ];

  function go(path: string) {
    setMobileOpen(false);
    navigateTo(path);
  }

  return (
    <header className="sticky top-0 z-50 glass">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => go('/')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
            <Moon className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
          </div>
          <div className="text-left leading-none flex flex-col justify-center">
            <span className="block text-white font-display font-bold text-base tracking-tight">
              Late Night Mart
            </span>
            <span className="block text-[10px] text-ink-400 font-medium tracking-wide uppercase">
              Hostel Edition
            </span>
          </div>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.path}
              onClick={() => go(l.path)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-ink-200 hover:text-white hover:bg-ink-700/60 transition-all"
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={() => go('/cart')}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-200 hover:text-white hover:bg-ink-700/60 transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center animate-pulse-glow">
                {totalItems}
              </span>
            )}
          </button>

          {/* Auth */}
          {profile ? (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => go('/orders')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-200 hover:text-white hover:bg-ink-700/60 transition-all"
              >
                <UserIcon className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{profile.name}</span>
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => go('/login')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-400 transition-all shadow-lg shadow-brand-500/20"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-ink-200 hover:bg-ink-700/60 transition-all"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink-700/50 bg-ink-900/95 backdrop-blur-lg animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <button
                key={l.path}
                onClick={() => go(l.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-200 hover:text-white hover:bg-ink-700/60 transition-all"
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </button>
            ))}
            {profile ? (
              <>
                <button
                  onClick={() => go('/orders')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-200 hover:text-white hover:bg-ink-700/60 transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  {profile.name}
                </button>
                <button
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger-400 hover:bg-danger-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => go('/login')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-500 hover:bg-brand-400 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Login / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
