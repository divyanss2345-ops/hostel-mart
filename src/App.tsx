import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/ui/Toast';
import { useRouter, navigateTo } from '@/lib/router';
import { FullPageLoader } from '@/components/ui/Spinner';
import { Lock } from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import Home from '@/pages/Home';
import Menu from '@/pages/Menu';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import MyOrders from '@/pages/MyOrders';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminProduct from '@/pages/admin/AdminProduct';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullPageLoader message="Checking your session..." />;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card p-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-brand-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Please log in to continue</h2>
          <p className="text-sm text-ink-400 mt-1 mb-6">
            You need an account to access this page.
          </p>
          <button onClick={() => navigateTo('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card p-8">
          <div className="w-14 h-14 rounded-2xl bg-danger-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-danger-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Admin access only</h2>
          <p className="text-sm text-ink-400 mt-1 mb-6">
            You don't have permission to view this page.
          </p>
          <button onClick={() => navigateTo('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin>
      {children}
    </ProtectedRoute>
  );
}

function Routes() {
  const { route } = useRouter();
  const { profile } = useAuth();

  // Admin pages have their own layout — no student navbar/footer
  if (route.name.startsWith('admin')) {
    let page: React.ReactNode;
    switch (route.name) {
      case 'admin':
        page = <AdminDashboard />;
        break;
      case 'admin-orders':
        page = <AdminOrders />;
        break;
      case 'admin-inventory':
        page = <AdminInventory />;
        break;
      case 'admin-product':
        page = <AdminProduct />;
        break;
      default:
        page = <AdminDashboard />;
    }
    return <AdminRoute>{page}</AdminRoute>;
  }

  // Student-facing pages with navbar + footer
  let page: React.ReactNode;
  switch (route.name) {
    case 'home':
      page = <Home />;
      break;
    case 'menu':
      page = <Menu />;
      break;
    case 'product':
      page = <ProductDetail productId={route.productId} />;
      break;
    case 'cart':
      page = <Cart />;
      break;
    case 'checkout':
      page = (
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      );
      break;
    case 'orders':
      page = (
        <ProtectedRoute>
          <MyOrders />
        </ProtectedRoute>
      );
      break;
    case 'login':
      page = <Login />;
      break;
    case 'register':
      page = <Register />;
      break;
    default:
      page = <Home />;
  }

  // If logged in as admin and on login/register, redirect home
  if (profile && (route.name === 'login' || route.name === 'register')) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <p className="text-ink-400">You're already signed in.</p>
            <button onClick={() => navigateTo('/')} className="btn-primary mt-4">
              Go Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}

function App() {
  // Ensure hash routing starts at home
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/';
    }
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Routes />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
