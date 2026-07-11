-- ============================================================
-- ABABIL SHOP — AGENTIC COMMERCE LAYER
-- Migration 005: Row Level Security Policies for Agent Tables
-- ============================================================
-- Tables covered:
--   agent_conversations, agent_messages, rfqs,
--   vendor_quotes, vendor_agent_settings
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.agent_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_quotes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_agent_settings  ENABLE ROW LEVEL SECURITY;

-- ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
-- Reuse existing public.is_admin() and public.is_vendor() from migration 002.

-- ─── AGENT_CONVERSATIONS ─────────────────────────────────────────────────────

-- Users own their own conversations; admins see all
CREATE POLICY "Users can view own conversations"
    ON public.agent_conversations FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create own conversations"
    ON public.agent_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON public.agent_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
    ON public.agent_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- ─── AGENT_MESSAGES ──────────────────────────────────────────────────────────

-- Messages are scoped to the conversation owner
CREATE POLICY "Users can view messages in own conversations"
    ON public.agent_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.agent_conversations ac
            WHERE ac.id = conversation_id
              AND (ac.user_id = auth.uid() OR public.is_admin(auth.uid()))
        )
    );

CREATE POLICY "Users can insert messages into own conversations"
    ON public.agent_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.agent_conversations ac
            WHERE ac.id = conversation_id
              AND ac.user_id = auth.uid()
        )
    );

-- Note: messages are immutable — no UPDATE or DELETE policies for end users.
-- The service_role key (used by server-side API routes) bypasses RLS.

-- ─── RFQS ────────────────────────────────────────────────────────────────────

-- Buyers always see their own RFQs (any status)
CREATE POLICY "Buyers can view own RFQs"
    ON public.rfqs FOR SELECT
    USING (auth.uid() = buyer_id);

-- Vendors see open/quoted RFQs in categories relevant to their products
CREATE POLICY "Vendors can view open RFQs in their categories"
    ON public.rfqs FOR SELECT
    USING (
        public.is_vendor(auth.uid())
        AND status IN ('open', 'quoted')
    );

-- Admins see everything
CREATE POLICY "Admins can view all RFQs"
    ON public.rfqs FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Only buyers can create RFQs (authenticated)
CREATE POLICY "Authenticated users can create RFQs"
    ON public.rfqs FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Buyers can cancel their own open RFQs
CREATE POLICY "Buyers can update own open RFQs"
    ON public.rfqs FOR UPDATE
    USING (auth.uid() = buyer_id AND status IN ('open', 'quoted'));

-- ─── VENDOR_QUOTES ───────────────────────────────────────────────────────────

-- Vendors see all their own quotes
CREATE POLICY "Vendors can view own quotes"
    ON public.vendor_quotes FOR SELECT
    USING (auth.uid() = vendor_id);

-- Buyers see quotes submitted on their RFQs
CREATE POLICY "Buyers can view quotes on their RFQs"
    ON public.vendor_quotes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.rfqs r
            WHERE r.id = rfq_id
              AND r.buyer_id = auth.uid()
        )
    );

-- Admins see all quotes
CREATE POLICY "Admins can view all quotes"
    ON public.vendor_quotes FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Vendors can submit quotes on open/quoted RFQs
CREATE POLICY "Vendors can submit quotes on open RFQs"
    ON public.vendor_quotes FOR INSERT
    WITH CHECK (
        auth.uid() = vendor_id
        AND public.is_vendor(auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.rfqs r
            WHERE r.id = rfq_id
              AND r.status IN ('open', 'quoted')
        )
    );

-- Vendors can update their own pending quotes (e.g., revise before acceptance)
CREATE POLICY "Vendors can update own pending quotes"
    ON public.vendor_quotes FOR UPDATE
    USING (auth.uid() = vendor_id AND status = 'pending');

-- ─── VENDOR_AGENT_SETTINGS ───────────────────────────────────────────────────

-- Settings are publicly readable (needed by the agent's auto-quote logic
-- and by the Buyer Agent when deciding which vendors support auto-reply)
CREATE POLICY "Vendor agent settings are publicly readable"
    ON public.vendor_agent_settings FOR SELECT
    USING (true);

-- Only the owning vendor can create their settings row
CREATE POLICY "Vendors can insert own agent settings"
    ON public.vendor_agent_settings FOR INSERT
    WITH CHECK (auth.uid() = vendor_id);

-- Only the owning vendor can update their settings
CREATE POLICY "Vendors can update own agent settings"
    ON public.vendor_agent_settings FOR UPDATE
    USING (auth.uid() = vendor_id);
