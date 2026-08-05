CREATE TABLE public.coach_portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  introduction TEXT,
  specialties TEXT[],
  services TEXT,
  phone_number TEXT,
  email TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  portfolio_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.coach_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolios are viewable by everyone."
  ON public.coach_portfolios FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own portfolio."
  ON public.coach_portfolios FOR INSERT
  WITH CHECK ( auth.uid() = trainer_id );

CREATE POLICY "Users can update own portfolio."
  ON public.coach_portfolios FOR UPDATE
  USING ( auth.uid() = trainer_id );

-- Add a trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_coach_portfolios_updated
  BEFORE UPDATE ON public.coach_portfolios
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Add storage bucket for portfolios
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Portfolio images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'portfolios' );

CREATE POLICY "Anyone can upload a portfolio image."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'portfolios' );

CREATE POLICY "Anyone can update a portfolio image."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'portfolios' );

CREATE POLICY "Anyone can delete a portfolio image."
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'portfolios' );
