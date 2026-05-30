-- 1. UPDATE UPDATED_AT TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_delivery_jobs_updated_at BEFORE UPDATE ON public.delivery_jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. HANDLE NEW USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Generate unique username from email if not provided
  v_username := split_part(NEW.email, '@', 1) || '_' || substr(md5(random()::text), 1, 5);
  
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url, role, xp, level)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'customer',
    0,
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. HANDLE XP AND LEVEL CALCULATIONS
-- Level formula: Level = floor(1 + sqrt(XP / 100))
-- 0 XP -> Level 1
-- 100 XP -> Level 2
-- 400 XP -> Level 3
-- 900 XP -> Level 4
-- 1600 XP -> Level 5
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(1 + SQRT(xp / 100.0))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.handle_xp_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_is_vendor BOOLEAN;
BEGIN
  -- 1. Update Profile XP
  UPDATE public.profiles
  SET xp = xp + NEW.amount
  WHERE id = NEW.user_id
  RETURNING xp INTO v_new_xp;

  -- 2. Calculate New Level
  v_new_level := public.calculate_level(v_new_xp);
  
  -- Update Profile Level
  UPDATE public.profiles
  SET level = v_new_level
  WHERE id = NEW.user_id;

  -- 3. If User is also a Vendor, sync vendor XP/Level
  SELECT EXISTS(SELECT 1 FROM public.vendors WHERE id = NEW.user_id) INTO v_is_vendor;
  IF v_is_vendor THEN
    UPDATE public.vendors
    SET xp = xp + NEW.amount,
        level = public.calculate_level(xp + NEW.amount)
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_xp_transaction_added
  AFTER INSERT ON public.xp_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_xp_transaction();

-- 4. RECALCULATE RATINGS AND NUM_REVIEWS ON NEW REVIEWS
CREATE OR REPLACE FUNCTION public.recalculate_ratings()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_vendor_id UUID;
  v_prod_avg NUMERIC(3,2);
  v_prod_count INTEGER;
  v_vend_avg NUMERIC(3,2);
  v_vend_count INTEGER;
BEGIN
  -- Determine product_id depending on trigger operation
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- Get product's vendor
  SELECT vendor_id INTO v_vendor_id FROM public.products WHERE id = v_product_id;

  -- 1. Product aggregates
  SELECT COALESCE(AVG(rating), 5.00)::NUMERIC(3,2), COUNT(id)
  INTO v_prod_avg, v_prod_count
  FROM public.reviews
  WHERE product_id = v_product_id;

  UPDATE public.products
  SET rating = v_prod_avg,
      num_reviews = v_prod_count
  WHERE id = v_product_id;

  -- 2. Vendor aggregates
  -- Aggregate ratings of all products belonging to this vendor
  SELECT COALESCE(AVG(rating), 5.00)::NUMERIC(3,2), COUNT(id)
  INTO v_vend_avg, v_vend_count
  FROM public.reviews
  WHERE product_id IN (SELECT id FROM public.products WHERE vendor_id = v_vendor_id);

  UPDATE public.vendors
  SET rating = v_vend_avg,
      num_reviews = v_vend_count
  WHERE id = v_vendor_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_ratings();
