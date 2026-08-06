-- 1. Fix 24h Cancellation Bypass (`workout_participants`)
DROP POLICY IF EXISTS "Clients can delete their own participation" ON public.workout_participants;
CREATE POLICY "Clients can delete their own participation" ON public.workout_participants FOR DELETE USING (
  auth.uid() = client_id AND 
  EXISTS (
    SELECT 1 FROM public.workouts w 
    WHERE w.id = workout_id AND w.starts_at > NOW() + INTERVAL '24 hours'
  )
);

-- 2. Fix Workout Capacity Bypass (`workout_participants`)
CREATE OR REPLACE FUNCTION public.check_workout_capacity() RETURNS TRIGGER AS $$
DECLARE
  v_capacity INT;
  v_current_accepted INT;
BEGIN
  IF NEW.status = 'accepted' THEN
    SELECT capacity INTO v_capacity FROM public.workouts WHERE id = NEW.workout_id;
    SELECT COUNT(*) INTO v_current_accepted FROM public.workout_participants 
      WHERE workout_id = NEW.workout_id AND status = 'accepted' AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF v_current_accepted >= v_capacity THEN
      RAISE EXCEPTION 'Workout capacity reached';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_workout_capacity ON public.workout_participants;
CREATE TRIGGER tr_check_workout_capacity
  BEFORE INSERT OR UPDATE OF status ON public.workout_participants
  FOR EACH ROW EXECUTE FUNCTION public.check_workout_capacity();

-- 3. Fix Client Self-Approval (`trainer_clients`)
DROP POLICY IF EXISTS "Clients can request connection (insert)" ON public.trainer_clients;

-- Trainers can insert (if needed in the future)
DROP POLICY IF EXISTS "Trainers can insert client connections" ON public.trainer_clients;
CREATE POLICY "Trainers can insert client connections" ON public.trainer_clients FOR INSERT WITH CHECK (auth.uid() = trainer_id);

-- Only trainers can update connection status
DROP POLICY IF EXISTS "Trainers can update connection status" ON public.trainer_clients;
CREATE POLICY "Trainers can update connection status" ON public.trainer_clients FOR UPDATE USING (auth.uid() = trainer_id);

-- 4. Fix Role Spoofing (Add role checks)

-- workouts
DROP POLICY IF EXISTS "Trainers can insert workouts" ON public.workouts;
CREATE POLICY "Trainers can insert workouts" ON public.workouts FOR INSERT 
  WITH CHECK (
    (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer') 
    OR private.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Trainers can update their workouts" ON public.workouts;
CREATE POLICY "Trainers can update their workouts" ON public.workouts FOR UPDATE 
  USING (
    (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer') 
    OR private.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Trainers can delete their workouts" ON public.workouts;
CREATE POLICY "Trainers can delete their workouts" ON public.workouts FOR DELETE 
  USING (
    (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer') 
    OR private.is_admin(auth.uid())
  );

-- meal_plans
DROP POLICY IF EXISTS "Trainer can manage own meal plans" ON public.meal_plans;
CREATE POLICY "Trainer can manage own meal plans"
  ON public.meal_plans FOR ALL
  USING (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer')
  WITH CHECK (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer');

-- trainer_foods
DROP POLICY IF EXISTS "Trainer can manage own foods" ON public.trainer_foods;
CREATE POLICY "Trainer can manage own foods"
  ON public.trainer_foods FOR ALL
  USING (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer')
  WITH CHECK (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer');

-- exercise_categories
DROP POLICY IF EXISTS "Trainers can manage their own categories" ON public.exercise_categories;
CREATE POLICY "Trainers can manage their own categories" ON public.exercise_categories FOR ALL 
  USING (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer');

-- exercises
DROP POLICY IF EXISTS "Trainers can manage their own exercises" ON public.exercises;
CREATE POLICY "Trainers can manage their own exercises" ON public.exercises FOR ALL 
  USING (auth.uid() = trainer_id AND private.profile_role(auth.uid()) = 'trainer');
