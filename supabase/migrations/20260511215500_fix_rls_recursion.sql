-- Break RLS recursion between workouts, workout_participants, workout_exercises,
-- exercise_logs and weight_logs.
--
-- These helpers live outside the exposed public schema. They are SECURITY
-- DEFINER functions so policy checks can inspect relationship rows without
-- recursively invoking the same RLS policies.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_workout_participant(
  p_workout_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_participants wp
    WHERE wp.workout_id = p_workout_id
      AND wp.client_id = p_user_id
      AND wp.status IN ('pending', 'accepted')
  );
$$;

CREATE OR REPLACE FUNCTION private.trainer_owns_workout(
  p_workout_id uuid,
  p_trainer_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = p_workout_id
      AND w.trainer_id = p_trainer_id
  );
$$;

CREATE OR REPLACE FUNCTION private.trainer_has_client(
  p_trainer_id uuid,
  p_client_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_participants wp
    JOIN public.workouts w ON w.id = wp.workout_id
    WHERE wp.client_id = p_client_id
      AND w.trainer_id = p_trainer_id
      AND wp.status IN ('pending', 'accepted')
  );
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_workout_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.trainer_owns_workout(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.trainer_has_client(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can view their own or assigned workouts" ON public.workouts;
CREATE POLICY "Users can view their own or assigned workouts" ON public.workouts
  FOR SELECT USING (
    auth.uid() = trainer_id
    OR auth.uid() = client_id
    OR status = 'available'
    OR private.is_workout_participant(id, auth.uid())
  );

DROP POLICY IF EXISTS "Trainers can view and manage their workout participants" ON public.workout_participants;
CREATE POLICY "Trainers can view and manage their workout participants" ON public.workout_participants
  FOR ALL USING (
    private.trainer_owns_workout(workout_id, auth.uid())
  );

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
          OR private.is_workout_participant(w.id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Trainers can manage workout exercises" ON public.workout_exercises;
CREATE POLICY "Trainers can manage workout exercises" ON public.workout_exercises
  FOR ALL USING (
    private.trainer_owns_workout(workout_id, auth.uid())
  );

DROP POLICY IF EXISTS "Trainers can view client weight logs" ON public.weight_logs;
CREATE POLICY "Trainers can view client weight logs" ON public.weight_logs
  FOR SELECT USING (
    private.trainer_has_client(auth.uid(), client_id)
  );

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
    OR private.trainer_has_client(auth.uid(), client_id)
  );
