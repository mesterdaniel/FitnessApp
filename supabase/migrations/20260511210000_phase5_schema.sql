-- weight_logs tábla (testsúly napló)
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL(5,1) NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE(client_id, logged_at)
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;

CREATE POLICY "Users can manage own weight logs" ON public.weight_logs
  FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Trainers can view client weight logs" ON public.weight_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_participants wp
      JOIN workouts w ON w.id = wp.workout_id
      WHERE wp.client_id = weight_logs.client_id
        AND w.trainer_id = auth.uid()
    )
  );

-- Phase 5 UI relies on these columns while editing workout cards/plans.
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0 NOT NULL;

-- Clients must be able to read workouts they booked through workout_participants,
-- even when the legacy workouts.client_id column is null.
DROP POLICY IF EXISTS "Users can view their own or assigned workouts" ON public.workouts;
CREATE POLICY "Users can view their own or assigned workouts" ON public.workouts
  FOR SELECT USING (
    auth.uid() = trainer_id
    OR auth.uid() = client_id
    OR status = 'available'
    OR EXISTS (
      SELECT 1
      FROM public.workout_participants wp
      WHERE wp.workout_id = workouts.id
        AND wp.client_id = auth.uid()
    )
  );

-- Clients now access workouts through workout_participants, not only workouts.client_id.
DROP POLICY IF EXISTS "Users can view workout exercises if they have access to the workout" ON public.workout_exercises;
CREATE POLICY "Users can view workout exercises if they have access to the workout" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND (
          w.trainer_id = auth.uid()
          OR w.client_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.workout_participants wp
            WHERE wp.workout_id = w.id
              AND wp.client_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Trainers can manage workout exercises" ON public.workout_exercises;
CREATE POLICY "Trainers can manage workout exercises" ON public.workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.trainer_id = auth.uid()
    )
  );

-- Coach client detail pages are based on workout participation, so trainer log access
-- needs to follow the same relationship model.
DROP POLICY IF EXISTS "Trainers can view logs of their clients" ON public.exercise_logs;
CREATE POLICY "Trainers can view logs of their clients" ON public.exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = exercise_logs.client_id
        AND tc.status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM public.workout_participants wp
      JOIN public.workouts w ON w.id = wp.workout_id
      WHERE wp.client_id = exercise_logs.client_id
        AND w.trainer_id = auth.uid()
    )
  );
