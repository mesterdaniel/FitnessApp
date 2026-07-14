-- ============================================================
-- Migration: Meal Planner Module
-- Created: 2026-07-14
-- Description: Adds global_foods, trainer_foods, meal_plans,
--   meals, and meal_items tables with RLS, indexes, GRANTs,
--   and seed data.  Does NOT touch any existing tables.
-- ============================================================

-- 1. Enable pg_trgm for trigram similarity search
-- (safe – IF NOT EXISTS prevents re-enabling errors)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Tables ────────────────────────────────────────────────────────────────────

-- 2a. global_foods  – central, publicly-readable Hungarian food database
--     All macros are per 100 g.
CREATE TABLE IF NOT EXISTS public.global_foods (
  id         UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT           NOT NULL,
  calories   NUMERIC(7, 2)  NOT NULL CHECK (calories >= 0),
  protein    NUMERIC(6, 2)  NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs      NUMERIC(6, 2)  NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat        NUMERIC(6, 2)  NOT NULL DEFAULT 0 CHECK (fat >= 0),
  created_at TIMESTAMPTZ    DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.global_foods IS 'Central, publicly readable food database (per 100 g).';

-- 2b. trainer_foods  – each trainer's own custom foods
CREATE TABLE IF NOT EXISTS public.trainer_foods (
  id           UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id   UUID           REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name         TEXT           NOT NULL,
  calories     NUMERIC(7, 2)  NOT NULL CHECK (calories >= 0),
  protein      NUMERIC(6, 2)  NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs        NUMERIC(6, 2)  NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat          NUMERIC(6, 2)  NOT NULL DEFAULT 0 CHECK (fat >= 0),
  serving_size TEXT,          -- reference only, e.g. "1 szelet (30g)"
  brand        TEXT,
  created_at   TIMESTAMPTZ    DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.trainer_foods IS 'Trainer-owned custom foods (per 100 g). Readable/writable only by the owning trainer (RLS).';

-- 2c. meal_plans  – an eating plan created by a trainer for a client
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id  UUID         REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id   UUID         REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title       TEXT         NOT NULL,
  description TEXT,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.meal_plans IS 'A complete meal plan assigned by a trainer to a client.';

-- 2d. meals  – individual eating occasions within a plan (e.g. Reggeli, Ebéd)
CREATE TABLE IF NOT EXISTS public.meals (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id UUID         REFERENCES public.meal_plans(id) ON DELETE CASCADE NOT NULL,
  name         TEXT         NOT NULL,
  order_index  INTEGER      DEFAULT 0 NOT NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.meals IS 'A single eating occasion (e.g. Reggeli) within a meal plan.';

-- 2e. meal_items  – individual food entries within an eating occasion
--     Macros are pre-calculated at insertion: (amount_grams / 100) × per-100g-value
CREATE TABLE IF NOT EXISTS public.meal_items (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id          UUID          REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  food_source      TEXT          NOT NULL CHECK (food_source IN ('global', 'trainer', 'external')),
  global_food_id   UUID          REFERENCES public.global_foods(id)  ON DELETE SET NULL,
  trainer_food_id  UUID          REFERENCES public.trainer_foods(id) ON DELETE SET NULL,
  food_name        TEXT          NOT NULL,   -- denormalised for display even after food deletion
  brand            TEXT,
  amount_grams     NUMERIC(7, 2) NOT NULL CHECK (amount_grams > 0),
  -- Pre-calculated macros
  calories         NUMERIC(7, 2) NOT NULL CHECK (calories >= 0),
  protein          NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs            NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat              NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (fat >= 0),
  created_at       TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.meal_items IS 'A food item within a meal. Macros are pre-calculated for the given gram weight.';

-- ─── Indexes ───────────────────────────────────────────────────────────────────

-- Trigram indexes for fast ILIKE / similarity search on food names
CREATE INDEX IF NOT EXISTS idx_global_foods_name_trgm
  ON public.global_foods USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_trainer_foods_name_trgm
  ON public.trainer_foods USING gin (name gin_trgm_ops);

-- B-tree indexes for FK / equality lookups
CREATE INDEX IF NOT EXISTS idx_trainer_foods_trainer_id
  ON public.trainer_foods (trainer_id);

CREATE INDEX IF NOT EXISTS idx_meal_plans_trainer_id
  ON public.meal_plans (trainer_id);

CREATE INDEX IF NOT EXISTS idx_meal_plans_client_id
  ON public.meal_plans (client_id);

CREATE INDEX IF NOT EXISTS idx_meals_meal_plan_id
  ON public.meals (meal_plan_id);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id
  ON public.meal_items (meal_id);

-- ─── Auto-update updated_at on meal_plans ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_meal_plan_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.meal_plans SET updated_at = NOW() WHERE id = NEW.meal_plan_id;
  RETURN NEW;
END;
$$;

-- Fire whenever a meal is added/removed
CREATE OR REPLACE TRIGGER tr_meal_plan_updated_on_meal
  AFTER INSERT OR DELETE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.update_meal_plan_updated_at();

-- ─── RLS Setup ─────────────────────────────────────────────────────────────────

ALTER TABLE public.global_foods   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_foods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items     ENABLE ROW LEVEL SECURITY;

-- ─── Grants ────────────────────────────────────────────────────────────────────

GRANT SELECT                          ON public.global_foods  TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE          ON public.global_foods  TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE  ON public.trainer_foods TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.meal_plans    TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.meals         TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.meal_items    TO authenticated, service_role;

-- ─── Policies ──────────────────────────────────────────────────────────────────
-- All policies are idempotent: DROP IF EXISTS before CREATE avoids "already exists" errors.

-- global_foods: anyone can read; only service_role can write (seeded by admin)
DROP POLICY IF EXISTS "Anyone can view global foods" ON public.global_foods;
CREATE POLICY "Anyone can view global foods"
  ON public.global_foods FOR SELECT USING (true);

-- trainer_foods: trainer reads/writes own
DROP POLICY IF EXISTS "Trainer can manage own foods" ON public.trainer_foods;
CREATE POLICY "Trainer can manage own foods"
  ON public.trainer_foods FOR ALL
  USING (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);

-- meal_plans: trainer manages own plans; client can read plans addressed to them
DROP POLICY IF EXISTS "Trainer can manage own meal plans" ON public.meal_plans;
CREATE POLICY "Trainer can manage own meal plans"
  ON public.meal_plans FOR ALL
  USING (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Client can view own meal plans" ON public.meal_plans;
CREATE POLICY "Client can view own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = client_id);

-- meals: accessible via the parent meal_plan's trainer or client
DROP POLICY IF EXISTS "Trainer can manage meals in own plans" ON public.meals;
CREATE POLICY "Trainer can manage meals in own plans"
  ON public.meals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meals.meal_plan_id
        AND mp.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_id
        AND mp.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Client can view meals in own plans" ON public.meals;
CREATE POLICY "Client can view meals in own plans"
  ON public.meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meals.meal_plan_id
        AND mp.client_id = auth.uid()
    )
  );

-- meal_items: accessible via meals → meal_plans trainer/client chain
DROP POLICY IF EXISTS "Trainer can manage meal items in own plans" ON public.meal_items;
CREATE POLICY "Trainer can manage meal items in own plans"
  ON public.meal_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meals m
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE m.id = meal_items.meal_id
        AND mp.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meals m
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE m.id = meal_id
        AND mp.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Client can view meal items in own plans" ON public.meal_items;
CREATE POLICY "Client can view meal items in own plans"
  ON public.meal_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meals m
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE m.id = meal_items.meal_id
        AND mp.client_id = auth.uid()
    )
  );

-- ─── Seed Data ─────────────────────────────────────────────────────────────────
-- Basic Hungarian foods (per 100 g).  ON CONFLICT DO NOTHING for idempotency.

INSERT INTO public.global_foods (name, calories, protein, carbs, fat) VALUES
  ('Csirkemell (főtt)',          165, 31.0,  0.0,  3.6),
  ('Csirkecomb (bőr nélkül)',    182, 27.5,  0.0,  7.6),
  ('Marhahús (sovány)',          250, 26.0,  0.0, 15.0),
  ('Lazac (filé)',               208, 20.0,  0.0, 13.0),
  ('Tuna (konzerv, vízben)',     116, 25.5,  0.0,  0.9),
  ('Tojás (egész)',              155, 12.6,  1.1, 10.6),
  ('Tojásfehérje',               52,  11.0,  0.7,  0.2),
  ('Cottage cheese (sovány)',     72,  12.4,  3.4,  1.0),
  ('Görög joghurt (0%)',          59,  10.0,  3.6,  0.4),
  ('Túró (sovány)',               85,  14.0,  3.4,  1.5),
  ('Tehéntej (2,8%)',             50,   3.4,  4.8,  2.8),
  ('Fehér rizs (főtt)',          130,   2.7, 28.2,  0.3),
  ('Barna rizs (főtt)',          112,   2.6, 22.8,  0.9),
  ('Bulgur (főtt)',               83,   3.1, 18.6,  0.2),
  ('Quinoa (főtt)',              120,   4.4, 21.3,  1.9),
  ('Zab (száraz)',               389,  16.9, 66.3,  6.9),
  ('Száraztészta (főtt)',        131,   5.0, 25.0,  1.1),
  ('Kenyér (teljes kiőrlésű)',   247,   8.8, 48.0,  3.5),
  ('Burgonya (főtt)',             87,   1.9, 20.1,  0.1),
  ('Édesburgonya (főtt)',         86,   1.6, 20.1,  0.1),
  ('Sárgarépa',                   41,   0.9,  9.6,  0.2),
  ('Brokkoli',                    34,   2.8,  6.6,  0.4),
  ('Spenót',                      23,   2.9,  3.6,  0.4),
  ('Paradicsom',                  18,   0.9,  3.9,  0.2),
  ('Uborka',                      15,   0.7,  3.6,  0.1),
  ('Alma',                        52,   0.3, 13.8,  0.2),
  ('Banán',                       89,   1.1, 22.8,  0.3),
  ('Narancs',                     47,   0.9, 11.8,  0.1),
  ('Mandula',                    579,  21.2, 21.7, 49.9),
  ('Dió',                        654,  15.2, 13.7, 65.2),
  ('Mogyoróvaj (natúr)',          588,  25.0, 20.0, 50.0),
  ('Avokádó',                    160,   2.0,  8.5, 14.7),
  ('Olívaolaj',                  884,   0.0,  0.0,100.0),
  ('Napraforgó olaj',            884,   0.0,  0.0,100.0),
  ('Vaj',                        717,   0.6,  0.1, 81.1),
  ('Szójatej (cukrozatlan)',       33,   3.3,  1.8,  1.8),
  ('Zabital (cukrozatlan)',        40,   1.0,  6.6,  1.5),
  ('Lencse (főtt)',              116,   9.0, 20.1,  0.4),
  ('Csicseriborsó (főtt)',       164,   8.9, 27.4,  2.6),
  ('Fekete bab (főtt)',          132,   8.9, 23.7,  0.5),
  ('Tofu',                        76,   8.0,  1.9,  4.8),
  ('Protein por (tejsavó, átlag)',380,  75.0, 10.0,  5.0),
  ('Mozzarella (light)',          185,  19.0,  2.0, 11.0),
  ('Cheddar sajt',               402,  25.0,  1.3, 33.1),
  ('Trappista sajt',             280,  28.0,  1.0, 18.0)
ON CONFLICT DO NOTHING;
