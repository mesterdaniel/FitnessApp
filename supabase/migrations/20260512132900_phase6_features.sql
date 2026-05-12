-- Phase 6 Migrations: Onboarding, Advanced Workouts, Notifications

-- 1. Onboarding
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Advanced Workouts
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  ADD COLUMN IF NOT EXISTS rir INTEGER CHECK (rir >= 0 AND rir <= 10),
  ADD COLUMN IF NOT EXISTS is_superset BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rest_seconds INTEGER;

-- 3. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR NOT NULL, -- e.g., 'workout_alert', 'booking_status', 'system'
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Insert policy for system/coaches (trigger functions or direct inserts)
CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true); -- Usually restricted to service role or specific functions, but we allow authenticated inserts for coaches to clients for now

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);
