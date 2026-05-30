-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ababilpay_webhooks ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS FOR POLICIES
-- Check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Check if user is a vendor
CREATE OR REPLACE FUNCTION public.is_vendor(user_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vendors
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- 1. PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. VENDORS POLICIES
CREATE POLICY "Vendors are viewable by everyone" ON public.vendors
    FOR SELECT USING (true);

CREATE POLICY "Users can onboard as vendor" ON public.vendors
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Vendors can update their own vendor profile" ON public.vendors
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. PRODUCTS POLICIES
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (status = 'active' OR auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert their own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = vendor_id AND public.is_vendor(auth.uid()));

CREATE POLICY "Vendors can update their own products" ON public.products
    FOR UPDATE USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete their own products" ON public.products
    FOR DELETE USING (auth.uid() = vendor_id);

-- 4. ORDERS POLICIES
CREATE POLICY "Customers and vendors can view their own orders" ON public.orders
    FOR SELECT USING (
        auth.uid() = customer_id 
        OR auth.uid() = vendor_id 
        OR public.is_admin(auth.uid())
    );

CREATE POLICY "Customers can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers and vendors can update their own orders" ON public.orders
    FOR UPDATE USING (
        auth.uid() = customer_id 
        OR auth.uid() = vendor_id 
        OR public.is_admin(auth.uid())
    );

-- 5. ORDER ITEMS POLICIES
CREATE POLICY "Order items are viewable by order participants" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND (o.customer_id = auth.uid() OR o.vendor_id = auth.uid() OR public.is_admin(auth.uid()))
        )
    );

CREATE POLICY "Customers can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.customer_id = auth.uid()
        )
    );

-- 6. REVIEWS POLICIES
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews for products they purchased" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id 
        AND EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.order_items oi ON oi.order_id = o.id
            WHERE o.customer_id = auth.uid() AND oi.product_id = product_id AND o.status = 'delivered'
        )
    );

CREATE POLICY "Customers can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can delete their own reviews" ON public.reviews
    FOR DELETE USING (auth.uid() = customer_id);

-- 7. WISHLISTS POLICIES
CREATE POLICY "Users can view their own wishlist" ON public.wishlists
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can add to their own wishlist" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can remove from their own wishlist" ON public.wishlists
    FOR DELETE USING (auth.uid() = customer_id);

-- 8. XP TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own XP history" ON public.xp_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Read-only from API, modifications only via service_role/triggers

-- 9. DELIVERY JOBS POLICIES
CREATE POLICY "Users associated with the order can view delivery tracking" ON public.delivery_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND (o.customer_id = auth.uid() OR o.vendor_id = auth.uid())
        )
    );

-- Modifications only via background jobs (service_role)

-- 10. WEBHOOKS LOGS
-- Read-only or write-only for background jobs (service_role)
