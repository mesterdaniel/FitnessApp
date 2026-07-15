-- RPC a kliens mutatóinak biztonságos módosítására (RLS kikerülésével, mivel az edzők nem írhatják a profiles táblát közvetlenül)
CREATE OR REPLACE FUNCTION update_client_metrics(
  p_client_id UUID,
  p_body_fat_pct NUMERIC,
  p_muscle_mass_kg NUMERIC,
  p_visceral_fat_level NUMERIC,
  p_calorie_limit INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ellenőrizzük, hogy a hívó egy admin-e vagy az adott kliens edzője
  IF NOT (private.is_admin(auth.uid()) OR private.trainer_has_client(auth.uid(), p_client_id)) THEN
    RAISE EXCEPTION 'Nincs jogosultságod módosítani ezt a klienst.';
  END IF;

  -- Profil frissítése
  UPDATE public.profiles
  SET 
    body_fat_pct = p_body_fat_pct,
    muscle_mass_kg = p_muscle_mass_kg,
    visceral_fat_level = p_visceral_fat_level,
    calorie_limit = p_calorie_limit
  WHERE id = p_client_id;

  -- Napló bejegyzés létrehozása
  INSERT INTO public.client_metrics_logs (
    client_id, 
    body_fat_pct, 
    muscle_mass_kg, 
    visceral_fat_level, 
    calorie_limit
  ) VALUES (
    p_client_id,
    p_body_fat_pct,
    p_muscle_mass_kg,
    p_visceral_fat_level,
    p_calorie_limit
  );
END;
$$;
