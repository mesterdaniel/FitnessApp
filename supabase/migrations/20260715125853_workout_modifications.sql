ALTER TABLE public.workout_participants
ADD COLUMN requested_time TIMESTAMPTZ,
ADD COLUMN modification_status VARCHAR DEFAULT NULL CHECK (modification_status IN ('pending', 'approved', 'rejected'));
