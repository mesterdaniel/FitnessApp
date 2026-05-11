-- 1. PROFIL BŐVÍTÉS
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR,
  ADD COLUMN IF NOT EXISTS fitness_level VARCHAR;

-- 2. EDZÉS KAPACITÁS
ALTER TABLE public.workouts 
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1;

-- 3. ÚJ RÉSZTVEVŐ TÁBLA
-- First, create the enum type (needs to be separate if used in the same block, but in script runner usually fine if no functions depend on it immediately. To be safe, we don't use ENUM, we use VARCHAR with check constraint to avoid the Postgres 55P04 error).
CREATE TABLE IF NOT EXISTS public.workout_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_id, client_id)
);

-- Enable RLS
ALTER TABLE public.workout_participants ENABLE ROW LEVEL SECURITY;

-- Kliensek láthatják a saját jelentkezéseiket
CREATE POLICY "Clients can view their own participations" ON public.workout_participants
  FOR SELECT USING (auth.uid() = client_id);

-- Kliensek jelentkezhetnek edzésekre (INSERT)
CREATE POLICY "Clients can insert their own participation" ON public.workout_participants
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Kliensek törölhetik (visszavonhatják) a jelentkezésüket
CREATE POLICY "Clients can delete their own participation" ON public.workout_participants
  FOR DELETE USING (auth.uid() = client_id);

-- Edzők láthatják, módosíthatják a saját edzéseikhez tartozó jelentkezéseket
CREATE POLICY "Trainers can view and manage their workout participants" ON public.workout_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workouts w 
      WHERE w.id = workout_id AND w.trainer_id = auth.uid()
    )
  );

-- 4. ADATOK MIGRÁLÁSA
-- Move existing client_id bookings from workouts to the new table as 'accepted'
INSERT INTO public.workout_participants (workout_id, client_id, status)
SELECT id, client_id, 'accepted'
FROM public.workouts
WHERE client_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Optionally, we can drop the client_id column later, but for now we leave it to not break everything at once.
-- We will ignore it in the UI and queries from now on.
