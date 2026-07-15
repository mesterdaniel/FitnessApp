CREATE OR REPLACE FUNCTION request_workout_modification(p_workout_id UUID, p_requested_time TIMESTAMPTZ)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.workout_participants
  SET requested_time = p_requested_time,
      modification_status = 'pending'
  WHERE workout_id = p_workout_id
    AND client_id = auth.uid();
END;
$$;
