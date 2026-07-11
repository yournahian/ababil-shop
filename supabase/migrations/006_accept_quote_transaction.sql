-- ============================================================
-- ABABIL SHOP — AGENTIC COMMERCE LAYER
-- Migration 006: Atomic Quote Acceptance & Escrow Locking RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_rfq_quote(
    p_rfq_id            UUID,
    p_quote_id          UUID,
    p_buyer_id          UUID,
    p_shipping_address  JSONB
)
RETURNS UUID AS $$
DECLARE
    v_rfq_status         public.rfq_status;
    v_quote_status       public.quote_status;
    v_quote_vendor_id    UUID;
    v_total_amount       NUMERIC;
    v_xp_earned          INTEGER;
    v_order_id           UUID;
BEGIN
    -- 1. Row-Level Lock on the RFQ using SELECT FOR UPDATE
    SELECT status INTO v_rfq_status
    FROM public.rfqs
    WHERE id = p_rfq_id AND buyer_id = p_buyer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RFQ not found or access denied';
    END IF;

    IF v_rfq_status IN ('accepted', 'fulfilled') THEN
        RAISE EXCEPTION 'RFQ is already accepted or completed';
    END IF;

    -- 2. Row-Level Lock on the chosen Quote using SELECT FOR UPDATE
    SELECT status, vendor_id, total_price_usdc INTO v_quote_status, v_quote_vendor_id, v_total_amount
    FROM public.vendor_quotes
    WHERE id = p_quote_id AND rfq_id = p_rfq_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote not found for this RFQ';
    END IF;

    IF v_quote_status != 'pending' THEN
        RAISE EXCEPTION 'Quote must be in pending status to accept';
    END IF;

    v_xp_earned := FLOOR(v_total_amount * 10.0) + 20;

    -- 3. Create the Order
    INSERT INTO public.orders (
        customer_id,
        vendor_id,
        status,
        shipping_address,
        payment_status,
        payment_intent_id,
        total_amount,
        shipping_cost,
        xp_earned,
        delivery_engine_status,
        agent_initiated,
        rfq_quote_id
    ) VALUES (
        p_buyer_id,
        v_quote_vendor_id,
        'processing',
        p_shipping_address,
        'paid',
        'escrow_intent_' || substring(p_quote_id::text from 1 for 8),
        v_total_amount,
        0.00,
        v_xp_earned,
        'preparing',
        true,
        p_quote_id
    )
    RETURNING id INTO v_order_id;

    -- 4. Accept the Quote & Lock Escrow
    UPDATE public.vendor_quotes
    SET
        status = 'accepted',
        escrow_status = 'locked',
        escrow_locked_at = NOW(),
        order_id = v_order_id,
        updated_at = NOW()
    WHERE id = p_quote_id;

    -- 5. Reject other quotes
    UPDATE public.vendor_quotes
    SET
        status = 'rejected',
        updated_at = NOW()
    WHERE rfq_id = p_rfq_id AND id != p_quote_id AND status = 'pending';

    -- 6. Update RFQ Status to accepted
    UPDATE public.rfqs
    SET
        status = 'accepted',
        updated_at = NOW()
    WHERE id = p_rfq_id;

    -- 7. Spawn Delivery Job
    INSERT INTO public.delivery_jobs (
        order_id,
        courier_name,
        status,
        latitude,
        longitude,
        estimated_delivery_at
    ) VALUES (
        v_order_id,
        'Ababil Drone Courier #09',
        'preparing',
        40.7128000,
        -74.0060000,
        NOW() + INTERVAL '15 minutes'
    );

    -- 8. Award purchase XP
    INSERT INTO public.xp_transactions (
        user_id,
        amount,
        source,
        description
    ) VALUES (
        p_buyer_id,
        v_xp_earned,
        'purchase',
        'Accepted vendor quote for RFQ. Escrow locked.'
    );

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
