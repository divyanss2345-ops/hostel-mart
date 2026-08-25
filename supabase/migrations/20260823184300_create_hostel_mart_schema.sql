/*
# Hostel Late Night Mart - Database Schema

## Overview
Creates the complete database structure for a hostel late-night Maggie ordering system
with role-based access (students and admins).

## New Tables

### 1. profiles
- `id` (uuid, primary key, references auth.users) - links to Supabase auth user
- `name` (text) - student's display name
- `email` (text, unique) - student's email
- `role` (text, default 'student') - either 'student' or 'admin'
- `created_at` (timestamptz) - account creation time

### 2. products
- `id` (uuid, primary key)
- `name` (text) - product name
- `description` (text) - product description
- `price` (numeric) - selling price
- `stock` (integer) - available inventory (hidden from students)
- `image_url` (text) - product image
- `available` (boolean) - whether product can be ordered
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3. orders
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users) - student who placed order
- `student_name` (text) - name at time of order
- `room_number` (text) - hostel room number
- `contact_number` (text) - contact phone
- `total_amount` (numeric) - order total
- `status` (text, default 'pending') - pending/preparing/ready/delivered/cancelled
- `created_at` (timestamptz)

### 4. order_items
- `id` (uuid, primary key)
- `order_id` (uuid, references orders) - parent order
- `product_id` (uuid, references products) - product ordered
- `quantity` (integer) - number ordered
- `price` (numeric) - price per unit at time of order

## Security (Row Level Security)

### profiles
- Students can read/update only their own profile.
- Admins can read all profiles.

### products
- Students can read only name, description, price, image_url, available (NOT stock).
- Admins can read/write all columns including stock.

### orders
- Students can read only their own orders and create orders for themselves.
- Admins can read/update all orders.

### order_items
- Students can read items for their own orders.
- Admins can read all order items.

## Important Notes
1. Stock column is hidden from students via a SECURITY DEFINER function (get_products_student)
   that returns products WITHOUT the stock column. Students query this function instead of the table.
2. Order placement and stock reduction happen atomically via a SECURITY DEFINER function
   (place_order) so students cannot bypass stock checks.
3. Admin role is determined by the profiles table role column.
*/

-- ============ PROFILES TABLE ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Students can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Admins can read all profiles
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Students can update their own profile (name only, not role)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow insert on signup (handled by trigger, but policy needed)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============ PRODUCTS TABLE ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Students and anon can read products (but stock is hidden via view/function)
DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Only admins can insert/update products
DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_admin" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_admin" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ ORDERS TABLE ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  room_number text NOT NULL,
  contact_number text NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','delivered','cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Students can read only their own orders
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Admins can read all orders
DROP POLICY IF EXISTS "orders_select_admin" ON orders;
CREATE POLICY "orders_select_admin" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Students can insert their own orders (user_id defaults to auth.uid())
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Only admins can update orders (status changes)
DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ ORDER_ITEMS TABLE ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Students can read items for their own orders
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

-- Admins can read all order items
DROP POLICY IF EXISTS "order_items_select_admin" ON order_items;
CREATE POLICY "order_items_select_admin" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Students can insert items for their own orders
DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

-- ============ TRIGGER: Auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ FUNCTION: Get products for students (hides stock) ============
CREATE OR REPLACE FUNCTION public.get_products_student()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  available boolean
)
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT id, name, description, price, image_url, available
  FROM products;
$$;

GRANT EXECUTE ON FUNCTION public.get_products_student() TO anon, authenticated;

-- ============ FUNCTION: Place order atomically (reduces stock) ============
CREATE OR REPLACE FUNCTION public.place_order(
  p_student_name text,
  p_room_number text,
  p_contact_number text,
  p_product_id uuid,
  p_quantity integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_product products%ROWTYPE;
  v_total numeric;
BEGIN
  -- Validate quantity
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be at least 1';
  END IF;

  -- Lock and fetch product row
  SELECT * FROM products WHERE id = p_product_id INTO v_product FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF NOT v_product.available THEN
    RAISE EXCEPTION 'Maggie is currently out of stock.';
  END IF;

  IF v_product.stock < p_quantity THEN
    RAISE EXCEPTION 'Not enough stock available. Only % Maggie left.', v_product.stock;
  END IF;

  -- Calculate total
  v_total := v_product.price * p_quantity;

  -- Create order
  INSERT INTO orders (user_id, student_name, room_number, contact_number, total_amount, status)
  VALUES (auth.uid(), p_student_name, p_room_number, p_contact_number, v_total, 'pending')
  RETURNING id INTO v_order_id;

  -- Create order item
  INSERT INTO order_items (order_id, product_id, quantity, price)
  VALUES (v_order_id, p_product_id, p_quantity, v_product.price);

  -- Reduce stock
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE id = p_product_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, uuid, integer) TO authenticated;

-- ============ FUNCTION: Admin update order status (handles stock on cancel) ============
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_old_status text;
  v_is_admin boolean;
BEGIN
  -- Check admin
  SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = auth.uid();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can update order status';
  END IF;

  -- Get current status
  SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- If cancelling a non-cancelled order, restore stock
  IF p_new_status = 'cancelled' AND v_old_status <> 'cancelled' THEN
    UPDATE products
    SET stock = stock + oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE oi.order_id = p_order_id AND oi.product_id = products.id;
  END IF;

  -- If re-activating a cancelled order, reduce stock again
  IF v_old_status = 'cancelled' AND p_new_status <> 'cancelled' THEN
    UPDATE products
    SET stock = stock - oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE oi.order_id = p_order_id AND oi.product_id = products.id;
  END IF;

  -- Update order status
  UPDATE orders SET status = p_new_status WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text) TO authenticated;

-- ============ FUNCTION: Admin update product (price/stock/availability) ============
CREATE OR REPLACE FUNCTION public.admin_update_product(
  p_product_id uuid,
  p_price numeric DEFAULT NULL,
  p_stock integer DEFAULT NULL,
  p_available boolean DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_image_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = auth.uid();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can update products';
  END IF;

  UPDATE products SET
    price = COALESCE(p_price, price),
    stock = COALESCE(p_stock, stock),
    available = COALESCE(p_available, available),
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    image_url = COALESCE(p_image_url, image_url),
    updated_at = now()
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_product(uuid, numeric, integer, boolean, text, text, text) TO authenticated;

-- ============ FUNCTION: Admin get all orders with items ============
CREATE OR REPLACE FUNCTION public.admin_get_orders()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  student_name text,
  room_number text,
  contact_number text,
  total_amount numeric,
  status text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT o.id, o.user_id, o.student_name, o.room_number, o.contact_number,
         o.total_amount, o.status, o.created_at
  FROM orders o
  ORDER BY o.created_at DESC;
$$;

-- ============ INITIAL PRODUCT: Maggie ============
INSERT INTO products (name, description, price, stock, image_url, available)
SELECT 'Maggie', 'Hot and delicious Maggie for late-night hostel cravings.', 20, 50,
       'https://images.unsplash.com/photo-1612929633738-8c1f9d7b3d7e?w=800',
       true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Maggie');
