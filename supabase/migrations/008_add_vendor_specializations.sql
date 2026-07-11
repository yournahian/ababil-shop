-- Add specializations column to vendors table if it doesn't exist
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS specializations TEXT[];

-- Drop the view first to allow column list restructuring
DROP VIEW IF EXISTS public.vendor_rankings CASCADE;

-- Recreate the view with specializations
CREATE VIEW public.vendor_rankings AS
SELECT
    v.id,
    v.name,
    v.slug,
    v.description,
    v.logo_url,
    v.banner_url,
    v.rating,
    v.verified,
    v.xp,
    v.level,
    v.wallet_address,
    v.arc_wallet_address,
    v.specializations, -- included in the original logical position

    -- Completed orders count
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.status = 'delivered'
    )::INTEGER AS completed_orders,

    -- Total meaningful orders (for success rate denominator)
    COUNT(DISTINCT o.id) FILTER (
        WHERE o.status IN ('delivered', 'cancelled', 'shipped', 'processing')
    )::INTEGER AS total_orders,

    -- Delivery success rate: delivered / (delivered + cancelled)
    CASE
        WHEN COUNT(DISTINCT o.id) FILTER (
            WHERE o.status IN ('delivered', 'cancelled')
        ) > 0
        THEN ROUND(
            COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'delivered')::NUMERIC /
            COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('delivered', 'cancelled'))::NUMERIC,
            4
        )
        ELSE 0.80  -- new vendor default
    END AS delivery_success_rate,

    -- Response time metrics
    vas.avg_response_hours,
    COALESCE(vas.auto_reply_enabled, false)       AS auto_reply_enabled,
    vas.max_discount_pct,
    vas.preferred_delivery_days,
    vas.auto_quote_categories,

    -- Composite search score (0–100)
    public.vendor_search_score(
        v.rating,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'delivered')::INTEGER,
        CASE
            WHEN COUNT(DISTINCT o.id) FILTER (
                WHERE o.status IN ('delivered', 'cancelled')
            ) > 0
            THEN COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'delivered')::NUMERIC /
                 COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('delivered', 'cancelled'))::NUMERIC
            ELSE 0.80
        END,
        vas.avg_response_hours
    ) AS search_score,

    v.created_at

FROM public.vendors v
LEFT JOIN public.orders       o   ON o.vendor_id  = v.id
LEFT JOIN public.vendor_agent_settings vas ON vas.vendor_id = v.id
GROUP BY
    v.id, v.name, v.slug, v.description, v.logo_url, v.banner_url,
    v.rating, v.verified, v.xp, v.level, v.wallet_address, v.arc_wallet_address, v.specializations,
    vas.avg_response_hours, vas.auto_reply_enabled,
    vas.max_discount_pct, vas.preferred_delivery_days, vas.auto_quote_categories,
    v.created_at;

-- Seed specializations for Neon Threads
UPDATE public.vendors
SET specializations = ARRAY['hoodies', 'streetwear', 'custom apparel', 'clothing', 'apparel', 'merchandise']
WHERE slug = 'neon-threads';

-- Seed specializations for CyberCore Tech
UPDATE public.vendors
SET specializations = ARRAY['hardware', 'chips', 'haptic', 'vr', 'metaverse', 'sensors', 'electronics']
WHERE slug = 'cybercore-tech';
