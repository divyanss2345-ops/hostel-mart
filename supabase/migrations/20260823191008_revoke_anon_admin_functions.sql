/*
# Revoke anon execute on admin SECURITY DEFINER functions

The admin functions (admin_get_orders, admin_update_order_status, admin_update_product)
were granted EXECUTE to both anon and authenticated. They check is_admin() internally,
but anon should not be able to call them at all. Revoke from anon, keep for authenticated.
Also revoke anon on is_admin() and get_products_student (students use authenticated session).
get_products_student stays callable by anon since the menu page may load before login.
*/

REVOKE EXECUTE ON FUNCTION public.admin_get_orders() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_product(uuid, numeric, integer, boolean, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
