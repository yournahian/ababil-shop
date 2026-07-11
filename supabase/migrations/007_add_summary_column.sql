-- ============================================================
-- ABABIL SHOP — AGENTIC COMMERCE LAYER
-- Migration 007: Add Summary Column to Agent Conversations
-- ============================================================

ALTER TABLE public.agent_conversations 
    ADD COLUMN IF NOT EXISTS summary TEXT;
