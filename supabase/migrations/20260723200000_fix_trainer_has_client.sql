-- Migráció az edző-kliens jogosultság ellenőrző függvény javítására.
-- A felületen (coach/clients) minden olyan kliens megjelenik, akinek van közös edzése az edzővel (ha a status nem 'rejected').
-- Az eredeti private.trainer_has_client függvény csak 'pending' és 'accepted' státuszokat fogadott el, 
-- ami miatt a régebbi/egyéb státuszú edzéssel rendelkező klienseknél az RPC (update_client_metrics) megtagadta a módosítást.

CREATE OR REPLACE FUNCTION private.trainer_has_client(p_trainer_id uuid, p_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workout_participants wp
    JOIN public.workouts w ON w.id = wp.workout_id
    WHERE wp.client_id = p_client_id 
      AND w.trainer_id = p_trainer_id 
      AND (wp.status IS NULL OR wp.status != 'rejected')
  ) OR EXISTS (
    SELECT 1 FROM public.trainer_clients tc 
    WHERE tc.trainer_id = p_trainer_id 
      AND tc.client_id = p_client_id 
      AND tc.status != 'rejected'
  );
$$;
