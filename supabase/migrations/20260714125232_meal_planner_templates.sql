-- ============================================================
-- Migration: Meal Planner – Template Support
-- Created: 2026-07-14
-- Description: Additive changes to meal_plans:
--   1. Make client_id nullable (templates have no client)
--   2. Add is_template column
--   3. Update RLS policies to cover template visibility
--   4. Add index for template queries
-- Does NOT drop or modify any existing tables or rows.
-- ============================================================

-- 1. Allow NULL in client_id (templates don't have a client)
ALTER TABLE public.meal_plans
  ALTER COLUMN client_id DROP NOT NULL;

-- 2. Add is_template flag (defaults to false – all existing rows stay as client plans)
ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;

-- 3. Index for fast template lookups per trainer
CREATE INDEX IF NOT EXISTS idx_meal_plans_is_template
  ON public.meal_plans (trainer_id, is_template);

-- 4. Update RLS policies
-- Drop the existing policies that reference client_id in a way that breaks for templates

-- Trainer: already has full ALL policy – no change needed
-- But we need to allow trainer to see their own templates (client_id IS NULL)
-- The existing "Trainer can manage own meal plans" policy uses trainer_id = auth.uid()
-- which already covers templates. No change needed for trainer.

-- Client: narrow the existing SELECT policy so it only returns non-template rows
-- (templates have client_id IS NULL, so the existing check `auth.uid() = client_id`
-- already excludes them – no change needed for client either).

-- For safety: drop and recreate the client select policy to be explicit:
DROP POLICY IF EXISTS "Client can view own meal plans" ON public.meal_plans;

CREATE POLICY "Client can view own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = client_id AND is_template = false);

-- 5. Same treatment for nested tables (meals, meal_items)
-- The existing policies traverse via meal_plan_id → trainer_id, which naturally
-- covers template meals too. No changes needed for meals or meal_items.
