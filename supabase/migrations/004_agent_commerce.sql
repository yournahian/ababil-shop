-- ============================================================
-- ABABIL SHOP — AGENTIC COMMERCE LAYER
-- Migration 004: Agent Commerce Tables
-- ============================================================
-- New tables (additive, no existing tables altered until line ~180):
--   1. agent_conversations
--   2. agent_messages
--   3. rfqs
--   4. vendor_quotes
--   5. vendor_agent_settings
--
-- Additive columns on existing tables:
--   orders:   agent_initiated, rfq_quote_id
--   vendors:  arc_wallet_address
--   profiles: telegram_chat_id, arc_wallet_address
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

-- RFQ type: product procurement OR service procurement
CREATE TYPE public.rfq_type AS ENUM ('product', 'service');

-- RFQ lifecycle status
CREATE TYPE public.rfq_status AS ENUM (
    'open',       -- awaiting vendor quotes
    'quoted',     -- at least one quote received
    'accepted',   -- buyer accepted a quote; escrow locked
    'fulfilled',  -- vendor delivered; escrow released
    'cancelled'
);

-- Procurement categories — supports both physical goods and services
CREATE TYPE public.rfq_category AS ENUM (
    'Merchandise',
    'Printing',
    'Software Development',
    'Design',
    'Marketing',
    'Logistics'
);

-- Vendor quote status
CREATE TYPE public.quote_status AS ENUM (
    'pending',   -- awaiting buyer decision
    'accepted',  -- buyer chose this quote
    'rejected',  -- buyer chose a different quote
    'withdrawn'  -- vendor retracted
);

-- Simulated escrow status (Arc-ready: real contract calls added in future)
CREATE TYPE public.escrow_status AS ENUM (
    'none',      -- no escrow yet
    'locked',    -- funds committed after quote acceptance
    'released',  -- funds released to vendor after delivery
    'refunded'   -- funds returned to buyer (cancellation/dispute)
);

-- Agent conversation channel source (channel-agnostic backend)
CREATE TYPE public.agent_source AS ENUM ('web', 'telegram', 'discord', 'api');

-- ─── 1. AGENT CONVERSATIONS ──────────────────────────────────────────────────

CREATE TABLE public.agent_conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title       TEXT NOT NULL DEFAULT 'New Conversation',
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    source      public.agent_source NOT NULL DEFAULT 'web',
    -- Telegram/Discord context (nullable)
    external_chat_id TEXT, -- Telegram chat_id or Discord channel_id
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_agent_conversations_user    ON public.agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_status  ON public.agent_conversations(status);
CREATE INDEX idx_agent_conversations_source  ON public.agent_conversations(source);

-- ─── 2. AGENT MESSAGES ───────────────────────────────────────────────────────

CREATE TABLE public.agent_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
    content         JSONB NOT NULL,    -- string for user/assistant; structured for tool results
    tool_name       TEXT,              -- populated when role = 'tool'
    tool_call_id    TEXT,              -- OpenAI tool_call_id for correlation
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_agent_messages_conversation ON public.agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_created      ON public.agent_messages(created_at);

-- ─── 3. RFQS (REQUEST FOR QUOTATION) ─────────────────────────────────────────
-- Supports both product procurement and service procurement.

CREATE TABLE public.rfqs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,

    -- RFQ identity
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    rfq_type            public.rfq_type NOT NULL DEFAULT 'product',
    category            public.rfq_category NOT NULL,

    -- RFQ Wizard fields (collected by agent before submission)
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    budget_usdc         NUMERIC(10,2) NOT NULL CHECK (budget_usdc > 0),
    delivery_deadline   TIMESTAMP WITH TIME ZONE,
    location            TEXT,          -- buyer's preferred supplier location/region
    requirements        JSONB NOT NULL DEFAULT '{}', -- additional structured requirements

    -- Lifecycle
    status              public.rfq_status NOT NULL DEFAULT 'open',

    -- Agent context
    conversation_id     UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,

    -- Arc future fields (nullable, unused in MVP — plug in real contract later)
    arc_job_id          TEXT,
    arc_tx_hash         TEXT,

    created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_rfqs_buyer    ON public.rfqs(buyer_id);
CREATE INDEX idx_rfqs_status   ON public.rfqs(status);
CREATE INDEX idx_rfqs_category ON public.rfqs(category);
CREATE INDEX idx_rfqs_type     ON public.rfqs(rfq_type);

-- ─── 4. VENDOR QUOTES ────────────────────────────────────────────────────────

CREATE TABLE public.vendor_quotes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id              UUID REFERENCES public.rfqs(id) ON DELETE CASCADE NOT NULL,
    vendor_id           UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,

    -- Pricing
    unit_price_usdc     NUMERIC(10,2) NOT NULL CHECK (unit_price_usdc > 0),
    total_price_usdc    NUMERIC(10,2) NOT NULL CHECK (total_price_usdc > 0),
    delivery_days       INTEGER NOT NULL CHECK (delivery_days > 0),
    notes               TEXT,
    auto_generated      BOOLEAN NOT NULL DEFAULT false,

    -- Lifecycle
    status              public.quote_status NOT NULL DEFAULT 'pending',

    -- Simulated escrow (Arc-ready: fields present, real contract calls added later)
    escrow_status       public.escrow_status NOT NULL DEFAULT 'none',
    escrow_locked_at    TIMESTAMP WITH TIME ZONE,
    escrow_released_at  TIMESTAMP WITH TIME ZONE,

    -- Arc future fields (nullable, unused in MVP)
    arc_job_id          TEXT,
    arc_tx_hash         TEXT,
    arc_wallet_address  TEXT,          -- vendor Arc wallet used for this quote

    -- Link to created order (set when quote is accepted)
    order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,

    created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- One quote per vendor per RFQ
    UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX idx_vendor_quotes_rfq    ON public.vendor_quotes(rfq_id);
CREATE INDEX idx_vendor_quotes_vendor ON public.vendor_quotes(vendor_id);
CREATE INDEX idx_vendor_quotes_status ON public.vendor_quotes(status);
CREATE INDEX idx_vendor_quotes_escrow ON public.vendor_quotes(escrow_status);

-- ─── 5. VENDOR AGENT SETTINGS ────────────────────────────────────────────────

CREATE TABLE public.vendor_agent_settings (
    vendor_id               UUID REFERENCES public.vendors(id) ON DELETE CASCADE PRIMARY KEY,

    -- Auto-response controls
    auto_reply_enabled      BOOLEAN NOT NULL DEFAULT false,
    max_discount_pct        NUMERIC(5,2) NOT NULL DEFAULT 10.00
                                CHECK (max_discount_pct >= 0 AND max_discount_pct <= 100),
    min_margin_pct          NUMERIC(5,2) NOT NULL DEFAULT 20.00
                                CHECK (min_margin_pct >= 0 AND min_margin_pct <= 100),
    preferred_delivery_days INTEGER NOT NULL DEFAULT 7
                                CHECK (preferred_delivery_days > 0),
    auto_quote_categories   public.rfq_category[],   -- NULL = respond to all categories
    agent_persona_notes     TEXT,                    -- vendor-specific AI instructions

    -- Ranking metrics (auto-updated by trigger on quote submission)
    avg_response_hours      NUMERIC(10,2),           -- rolling avg; NULL = no data yet

    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ─── ADDITIVE COLUMNS ON EXISTING TABLES ─────────────────────────────────────

-- orders: mark agent-initiated orders + link back to accepted quote
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS agent_initiated  BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS rfq_quote_id     UUID REFERENCES public.vendor_quotes(id) ON DELETE SET NULL;

-- vendors: Arc wallet (future — nullable)
ALTER TABLE public.vendors
    ADD COLUMN IF NOT EXISTS arc_wallet_address TEXT;

-- profiles: Telegram linking + Arc wallet (future — nullable)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS telegram_chat_id   TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS arc_wallet_address TEXT;

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────────────────
-- Reuse the handle_updated_at() function defined in migration 003

CREATE TRIGGER set_agent_conversations_updated_at
    BEFORE UPDATE ON public.agent_conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_rfqs_updated_at
    BEFORE UPDATE ON public.rfqs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_vendor_quotes_updated_at
    BEFORE UPDATE ON public.vendor_quotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_vendor_agent_settings_updated_at
    BEFORE UPDATE ON public.vendor_agent_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── VENDOR RANKING INFRASTRUCTURE ───────────────────────────────────────────
-- Used by the search_vendors() agent tool to rank suppliers.
--
-- Score formula (100 pts max):
--   Rating score     = (rating / 5.0) × 20          → max 20 pts
--   Order volume     = log-scale completed orders    → max 30 pts
--   Delivery success = (delivered / total) × 30     → max 30 pts
--   Response speed   = (1 − avg_hours/72h) × 20     → max 20 pts

CREATE OR REPLACE FUNCTION public.vendor_search_score(
    p_rating                NUMERIC,
    p_completed_orders      INTEGER,
    p_delivery_success_rate NUMERIC,  -- 0.0 to 1.0
    p_avg_response_hours    NUMERIC   -- NULL = unknown → 10 pts (neutral)
)
RETURNS NUMERIC AS $$
DECLARE
    v_rating_score   NUMERIC;
    v_order_score    NUMERIC;
    v_delivery_score NUMERIC;
    v_response_score NUMERIC;
BEGIN
    -- Rating: 0–5 → 0–20 pts
    v_rating_score := COALESCE(p_rating, 3.0) / 5.0 * 20.0;

    -- Completed orders: log scale → 0–30 pts
    -- log(101) ≈ 4.615 → 100+ completed orders = full 30 pts
    v_order_score := LEAST(
        LN(GREATEST(COALESCE(p_completed_orders, 0), 0) + 1.0) / LN(101.0) * 30.0,
        30.0
    );

    -- Delivery success rate: 0.0–1.0 → 0–30 pts
    -- New vendors (no orders) default to 0.80 (industry average)
    v_delivery_score := COALESCE(p_delivery_success_rate, 0.80) * 30.0;

    -- Response speed: faster is better; >72h = 0 pts; NULL = 10 pts (neutral)
    IF p_avg_response_hours IS NULL THEN
        v_response_score := 10.0;
    ELSE
        v_response_score := GREATEST(0.0, (72.0 - p_avg_response_hours) / 72.0) * 20.0;
    END IF;

    RETURN ROUND(v_rating_score + v_order_score + v_delivery_score + v_response_score, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─── VENDOR RANKINGS VIEW ────────────────────────────────────────────────────
-- The search_vendors tool queries this view to get ranked suppliers.
-- Refreshed in real-time (standard view, not materialized — keeps data live).

CREATE OR REPLACE VIEW public.vendor_rankings AS
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
    v.rating, v.verified, v.xp, v.level, v.wallet_address, v.arc_wallet_address,
    vas.avg_response_hours, vas.auto_reply_enabled,
    vas.max_discount_pct, vas.preferred_delivery_days, vas.auto_quote_categories,
    v.created_at;

-- ─── TRIGGER: AUTO-UPDATE VENDOR RESPONSE TIME ───────────────────────────────
-- When a vendor submits a quote, compute hours elapsed since RFQ creation
-- and update their rolling average response time in vendor_agent_settings.

CREATE OR REPLACE FUNCTION public.update_vendor_response_time()
RETURNS TRIGGER AS $$
DECLARE
    v_rfq_created_at   TIMESTAMP WITH TIME ZONE;
    v_hours_elapsed    NUMERIC;
BEGIN
    -- Get when the RFQ was opened
    SELECT created_at INTO v_rfq_created_at
    FROM public.rfqs
    WHERE id = NEW.rfq_id;

    -- Hours elapsed between RFQ open and this quote
    v_hours_elapsed := EXTRACT(EPOCH FROM (NEW.created_at - v_rfq_created_at)) / 3600.0;

    -- Upsert vendor_agent_settings; exponential moving average (70/30 weight)
    INSERT INTO public.vendor_agent_settings (vendor_id, avg_response_hours, updated_at)
    VALUES (NEW.vendor_id, v_hours_elapsed, NOW())
    ON CONFLICT (vendor_id) DO UPDATE
    SET
        avg_response_hours = CASE
            WHEN vendor_agent_settings.avg_response_hours IS NULL
                THEN v_hours_elapsed
            ELSE ROUND(
                (vendor_agent_settings.avg_response_hours * 0.7 + v_hours_elapsed * 0.3)::NUMERIC,
                2
            )
        END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vendor_quote_submitted
    AFTER INSERT ON public.vendor_quotes
    FOR EACH ROW EXECUTE FUNCTION public.update_vendor_response_time();

-- ─── TRIGGER: AUTO-UPDATE RFQ STATUS TO 'quoted' ─────────────────────────────
-- When a vendor_quote is inserted, bump the RFQ status from 'open' → 'quoted'.

CREATE OR REPLACE FUNCTION public.handle_rfq_quoted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.rfqs
    SET status = 'quoted', updated_at = NOW()
    WHERE id = NEW.rfq_id AND status = 'open';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_first_quote_received
    AFTER INSERT ON public.vendor_quotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_rfq_quoted();
