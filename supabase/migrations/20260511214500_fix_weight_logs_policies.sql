-- Ensure weight log inserts/upserts work for authenticated clients even if the
-- original Phase 5 migration was already applied before policy/grant fixes.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;

DROP POLICY IF EXISTS "Users can manage own weight logs" ON public.weight_logs;
CREATE POLICY "Users can manage own weight logs" ON public.weight_logs
  FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers can view client weight logs" ON public.weight_logs;
CREATE POLICY "Trainers can view client weight logs" ON public.weight_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.workout_participants wp
      JOIN public.workouts w ON w.id = wp.workout_id
      WHERE wp.client_id = weight_logs.client_id
        AND w.trainer_id = auth.uid()
    )
  );
