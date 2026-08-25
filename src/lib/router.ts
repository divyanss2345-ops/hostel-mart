import { useEffect, useState, useCallback } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'menu' }
  | { name: 'product'; productId: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'orders' }
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'admin' }
  | { name: 'admin-orders' }
  | { name: 'admin-inventory' }
  | { name: 'admin-product' }
  | { name: 'not-found' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'menu') return { name: 'menu' };
  if (parts[0] === 'product' && parts[1]) return { name: 'product', productId: parts[1] };
  if (parts[0] === 'cart') return { name: 'cart' };
  if (parts[0] === 'checkout') return { name: 'checkout' };
  if (parts[0] === 'orders') return { name: 'orders' };
  if (parts[0] === 'login') return { name: 'login' };
  if (parts[0] === 'register') return { name: 'register' };
  if (parts[0] === 'admin') {
    if (parts[1] === 'orders') return { name: 'admin-orders' };
    if (parts[1] === 'inventory') return { name: 'admin-inventory' };
    if (parts[1] === 'product') return { name: 'admin-product' };
    return { name: 'admin' };
  }
  return { name: 'not-found' };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((path: string) => {
    const clean = path.startsWith('#') ? path : `#${path}`;
    window.location.hash = clean;
    window.scrollTo(0, 0);
  }, []);

  return { route, navigate };
}

export function navigateTo(path: string) {
  const clean = path.startsWith('#') ? path : `#${path}`;
  window.location.hash = clean;
  window.scrollTo(0, 0);
}
