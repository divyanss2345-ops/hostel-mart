import { type ReactNode } from 'react';
import { LayoutDashboard, ClipboardList, Package, Tag, ArrowLeft, LogOut, Moon, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navigateTo } from '@/lib/router';

interface AdminLayoutProps {
  children: ReactNode;
  active: 'dashboard' | 'orders' | 'inventory' | 'product';
}

export default function AdminLayout({ children, active }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();

  const navItems = [
    { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { key: 'orders' as const, label: 'Orders', icon: ClipboardList, path: '/admin/orders' },
    { key: 'inventory' as const, label: 'Inventory', icon: Package, path: '/admin/inventory' },
    { key: 'product' as const, label: 'Product & Price', icon: Tag, path: '/admin/product' },
  ];

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      {/* Top bar */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-danger-500 to-brand-500 flex items-center justify-center shadow-lg shadow-danger-500/20">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <span className="block text-white font-display font-bold text-sm">Admin Dashboard</span>
              <span className="block text-[10px] text-ink-400 mt-0.5">Hostel Late Night Mart</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('/')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 hover:text-white hover:bg-ink-700/60 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Store</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700/60">
              <Moon className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-ink-200">{profile?.name ?? 'Admin'}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => navigateTo(item.path)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  active === item.key
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-ink-300 hover:text-white hover:bg-ink-700/60 border border-transparent'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
