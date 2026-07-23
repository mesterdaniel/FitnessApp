-- RPC a hibás testösszetétel bejegyzések törlésére az edzők számára
CREATE OR REPLACE FUNCTION delete_client_metric_log(
  p_log_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id UUID;
  v_latest RECORD;
BEGIN
  -- Lekérjük a törlendő bejegyzéshez tartozó client_id-t
  SELECT client_id INTO v_client_id
  FROM public.client_metrics_logs
  WHERE id = p_log_id;

  IF v_client_id IS NULL THEN
    RETURN;
  END IF;

  -- Jogosultság ellenőrzés
  IF NOT (private.is_admin(auth.uid()) OR private.trainer_has_client(auth.uid(), v_client_id)) THEN
    RAISE EXCEPTION 'Nincs jogosultságod törölni ezt a bejegyzést.';
  END IF;

  -- Bejegyzés törlése
  DELETE FROM public.client_metrics_logs
  WHERE id = p_log_id;

  -- Lekérjük a legfrissebb megmaradt bejegyzést, hogy beállítsuk a profilban
  SELECT body_fat_pct, muscle_mass_kg, visceral_fat_level, calorie_limit
  INTO v_latest
  FROM public.client_metrics_logs
  WHERE client_id = v_client_id
  ORDER BY logged_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.profiles
    SET 
      body_fat_pct = v_latest.body_fat_pct,
      muscle_mass_kg = v_latest.muscle_mass_kg,
      visceral_fat_level = v_latest.visceral_fat_level,
      calorie_limit = v_latest.calorie_limit
    WHERE id = v_client_id;
  ELSE
    UPDATE public.profiles
    SET 
      body_fat_pct = NULL,
      muscle_mass_kg = NULL,
      visceral_fat_level = NULL,
      calorie_limit = NULL
    WHERE id = v_client_id;
  END IF;
END;
$$;
