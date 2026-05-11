-- EXERCISES TABLE (Gyakorlat-könyvtár)
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR,
  muscle_group VARCHAR,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage their own exercises" ON public.exercises
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (true);
