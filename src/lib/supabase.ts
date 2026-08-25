import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
  // keep Supabase from spamming console about localStorage in SSR-like contexts
    storageKey: 'hostel-mart-auth',
  },
});

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
}

export interface ProductAdmin extends Product {
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  student_name: string;
  room_number: string;
  contact_number: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}
