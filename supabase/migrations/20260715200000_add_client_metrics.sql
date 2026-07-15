-- Adatbázis migráció a kliens mutatókhoz
-- Hozzáadja a zsír %, izomtömeg, zsigeri zsír és kalória limit oszlopokat a profiles táblához

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS body_fat_pct NUMERIC,
ADD COLUMN IF NOT EXISTS muscle_mass_kg NUMERIC,
ADD COLUMN IF NOT EXISTS visceral_fat_level NUMERIC,
ADD COLUMN IF NOT EXISTS calorie_limit INTEGER;
