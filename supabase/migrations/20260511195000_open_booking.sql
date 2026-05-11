-- Add 'available' to workout_status
ALTER TYPE workout_status ADD VALUE IF NOT EXISTS 'available';

-- Make client_id nullable to allow open slots
ALTER TABLE public.workouts ALTER COLUMN client_id DROP NOT NULL;

-- If a workout has no client, it should default to 'available', but we handle this in the app logic.
-- However, we can add a check constraint that if client_id is null, status should be 'available' or 'cancelled'.
-- But for simplicity, we just allow null.

-- Update RLS policies for workouts to allow clients to see 'available' workouts even if they are not the client
DROP POLICY IF EXISTS "Users can view their own or assigned workouts" ON public.workouts;
CREATE POLICY "Users can view their own or assigned workouts" ON public.workouts
FOR SELECT USING (
  auth.uid() = trainer_id 
  OR auth.uid() = client_id 
  OR status = 'available'
);

-- Allow clients to update workouts IF they are claiming an available workout
-- We add a policy that allows a client to update a workout if it is 'available' and they are setting themselves as client_id
DROP POLICY IF EXISTS "Clients can book available workouts" ON public.workouts;
CREATE POLICY "Clients can book available workouts" ON public.workouts
FOR UPDATE USING (
  status = 'available' AND client_id IS NULL AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'client')
) WITH CHECK (
  auth.uid() = client_id AND status = 'scheduled'
);
