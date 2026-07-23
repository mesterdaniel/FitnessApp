-- Szolgáltatás igénylések (Service Requests) tábla létrehozása
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('assessment', 'workout', 'meal_plan', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'rejected')),
  message TEXT,
  coach_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS beállítása
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Kliensek láthatják a saját igényléseiket
CREATE POLICY "Clients can view their own requests" 
  ON public.service_requests FOR SELECT 
  USING (auth.uid() = client_id);

-- Kliensek hozhatnak létre saját igénylést
CREATE POLICY "Clients can create requests" 
  ON public.service_requests FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

-- Edzők láthatják a hozzájuk érkező igényléseket
CREATE POLICY "Trainers can view requests sent to them" 
  ON public.service_requests FOR SELECT 
  USING (auth.uid() = trainer_id);

-- Edzők frissíthetik a hozzájuk érkező igényléseket (státusz, megjegyzés)
CREATE POLICY "Trainers can update their requests" 
  ON public.service_requests FOR UPDATE 
  USING (auth.uid() = trainer_id);

-- Adminok mindent láthatnak és szerkeszthetnek
CREATE POLICY "Admins can view and edit all requests" 
  ON public.service_requests FOR ALL 
  USING (private.is_admin(auth.uid()));

-- Jogosultságok
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated, anon, service_role;

-- Trigger az updated_at frissítésére
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
