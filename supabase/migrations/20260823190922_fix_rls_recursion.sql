/*
# Fix infinite recursion in RLS policies

## Problem
The admin-check policies on profiles, orders, order_items, and products all run:
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
But that SELECT on profiles is itself subject to RLS, which checks admin status
by querying profiles again → infinite recursion → HTTP 500 on every profile query.

## Fix
1. Create a SECURITY DEFINER function `is_admin()` that reads the profiles table
   with owner privileges (bypassing RLS). This breaks the recursion because the
   function runs as the table owner, not the authenticated role.
2. Replace all `EXISTS (SELECT 1 FROM profiles ...)` predicates with `is_admin()`.
3. Keep all existing non-admin policies (ownership checks) unchanged.

## Security
- `is_admin()` is SECURITY DEFINER, search_path locked to public, read-only.
- Only authenticated users can execute it.
- No data is exposed — it returns a boolean.
*/

-- ============ Helper: is_admin() — breaks RLS recursion ============
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============ PROFILES: fix admin policies ============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============ PRODUCTS: fix admin policies ============
DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_admin" ON products FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_admin" ON products FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- ============ ORDERS: fix admin policies ============
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_select_admin" ON orders;
CREATE POLICY "orders_select_admin" ON orders FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ ORDER_ITEMS: fix admin policies ============
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "order_items_select_admin" ON order_items;
CREATE POLICY "order_items_select_admin" ON order_items FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );
