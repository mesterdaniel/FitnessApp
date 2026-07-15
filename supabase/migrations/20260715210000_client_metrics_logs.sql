-- Tábla létrehozása a kliens mutatók (testzsír, izomtömeg stb.) historikus tárolására
CREATE TABLE IF NOT EXISTS public.client_metrics_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body_fat_pct NUMERIC,
  muscle_mass_kg NUMERIC,
  visceral_fat_level NUMERIC,
  calorie_limit INTEGER,
  logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS (Row Level Security) engedélyezése
ALTER TABLE public.client_metrics_logs ENABLE ROW LEVEL SECURITY;

-- Kliensek láthatják a saját naplóikat
CREATE POLICY "Clients can view their own metrics logs" ON public.client_metrics_logs 
  FOR SELECT USING (auth.uid() = client_id);

-- Edzők láthatják és szerkeszthetik a klienseik naplóit
CREATE POLICY "Trainers can manage their clients metrics logs" ON public.client_metrics_logs 
  FOR ALL USING (private.trainer_has_client(auth.uid(), client_id));

-- Adminok mindent láthatnak
CREATE POLICY "Admins can view all metrics logs" ON public.client_metrics_logs 
  FOR SELECT USING (private.is_admin(auth.uid()));

-- Jogosultságok megadása a role-oknak
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_metrics_logs TO authenticated, anon, service_role;
