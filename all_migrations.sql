-- Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'client');
CREATE TYPE connection_status AS ENUM ('pending', 'active', 'rejected');
CREATE TYPE workout_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'client'::user_role NOT NULL,
  full_name TEXT DEFAULT '' NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Existing users migration (just in case)
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'client'::user_role, 'User' FROM auth.users ON CONFLICT (id) DO NOTHING;

-- TRAINER_CLIENTS
CREATE TABLE public.trainer_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status connection_status DEFAULT 'pending'::connection_status NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(trainer_id, client_id)
);

-- WORKOUTS
CREATE TABLE public.workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 60 NOT NULL,
  notes TEXT,
  status workout_status DEFAULT 'scheduled'::workout_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- WORKOUT_EXERCISES
CREATE TABLE public.workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_target DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- EXERCISE_LOGS
CREATE TABLE public.exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  reps INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CONVERSATIONS
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CONVERSATION_PARTICIPANTS
CREATE TABLE public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (conversation_id, profile_id)
);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ
);

-- AUTO-CREATE PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
    COALESCE((NEW.raw_user_meta_data->>'full_name')::text, 'Felhasználó'),
    COALESCE((NEW.raw_user_meta_data->>'avatar_url')::text, '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- UPDATE CONVERSATION TRIGGER
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.update_conversation_updated_at();

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles: Anyone can read profiles. Users can update their own. Admins can update all.
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trainer_Clients
CREATE POLICY "Trainers and clients can view their connections" ON public.trainer_clients FOR SELECT USING (
  auth.uid() = trainer_id OR auth.uid() = client_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can request connection (insert)" ON public.trainer_clients FOR INSERT WITH CHECK (
  auth.uid() = client_id OR auth.uid() = trainer_id
);
CREATE POLICY "Trainers can update connection status" ON public.trainer_clients FOR UPDATE USING (
  auth.uid() = trainer_id OR auth.uid() = client_id
);
CREATE POLICY "Trainers or clients can delete connection" ON public.trainer_clients FOR DELETE USING (
  auth.uid() = trainer_id OR auth.uid() = client_id
);

-- Workouts
CREATE POLICY "Trainers and clients can view relevant workouts" ON public.workouts FOR SELECT USING (
  auth.uid() = trainer_id OR auth.uid() = client_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Trainers can insert workouts" ON public.workouts FOR INSERT WITH CHECK (
  auth.uid() = trainer_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Trainers can update their workouts" ON public.workouts FOR UPDATE USING (
  auth.uid() = trainer_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Trainers can delete their workouts" ON public.workouts FOR DELETE USING (
  auth.uid() = trainer_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Workout Exercises
CREATE POLICY "Users can view workout exercises if they have access to the workout" ON public.workout_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_exercises.workout_id AND (trainer_id = auth.uid() OR client_id = auth.uid()))
);
CREATE POLICY "Trainers can manage workout exercises" ON public.workout_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_exercises.workout_id AND trainer_id = auth.uid())
);

-- Exercise Logs
CREATE POLICY "Clients can view and manage their own logs" ON public.exercise_logs FOR ALL USING (
  auth.uid() = client_id
);
CREATE POLICY "Trainers can view logs of their clients" ON public.exercise_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trainer_clients WHERE trainer_id = auth.uid() AND client_id = exercise_logs.client_id AND status = 'active')
);

-- Conversations
CREATE POLICY "Participants can view their conversations" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = id AND profile_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);

-- Conversation Participants
CREATE POLICY "Participants can view members of their conversations" ON public.conversation_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.profile_id = auth.uid())
);
CREATE POLICY "Users can add participants to conversations" ON public.conversation_participants FOR INSERT WITH CHECK (
  profile_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = conversation_participants.conversation_id AND profile_id = auth.uid())
);

-- Messages
CREATE POLICY "Participants can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid())
);
CREATE POLICY "Participants can update message read_at" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid())
) WITH CHECK (
  auth.uid() != sender_id -- Only receiver can mark as read
);

-- Allow Admin access to everything (as a backup)
CREATE POLICY "Admins can view everything in exercise_logs" ON public.exercise_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- Add 'available' to workout_status
ALTER TYPE workout_status ADD VALUE IF NOT EXISTS 'available';

-- Make client_id nullable to allow open slots
ALTER TABLE public.workouts ALTER COLUMN client_id DROP NOT NULL;
-- Update RLS policies for workouts to allow clients to see 'available' workouts even if they are not the client
DROP POLICY IF EXISTS "Users can view their own or assigned workouts" ON public.workouts;
CREATE POLICY "Users can view their own or assigned workouts" ON public.workouts
FOR SELECT USING (
  auth.uid() = trainer_id 
  OR auth.uid() = client_id 
  OR status = 'available'
);

-- Allow clients to update workouts IF they are claiming an available workout
DROP POLICY IF EXISTS "Clients can book available workouts" ON public.workouts;
CREATE POLICY "Clients can book available workouts" ON public.workouts
FOR UPDATE USING (
  status = 'available' AND client_id IS NULL AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'client')
) WITH CHECK (
  auth.uid() = client_id AND status = 'scheduled'
);
-- 1. PROFIL BŐVÍTÉS
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR,
  ADD COLUMN IF NOT EXISTS fitness_level VARCHAR;

-- 2. EDZÉS KAPACITÁS
ALTER TABLE public.workouts 
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1;

-- 3. ÚJ RÉSZTVEVŐ TÁBLA
-- First, create the enum type (needs to be separate if used in the same block, but in script runner usually fine if no functions depend on it immediately. To be safe, we don't use ENUM, we use VARCHAR with check constraint to avoid the Postgres 55P04 error).
CREATE TABLE IF NOT EXISTS public.workout_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_id, client_id)
);

-- Enable RLS
ALTER TABLE public.workout_participants ENABLE ROW LEVEL SECURITY;

-- Kliensek láthatják a saját jelentkezéseiket
CREATE POLICY "Clients can view their own participations" ON public.workout_participants
  FOR SELECT USING (auth.uid() = client_id);

-- Kliensek jelentkezhetnek edzésekre (INSERT)
CREATE POLICY "Clients can insert their own participation" ON public.workout_participants
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Kliensek törölhetik (visszavonhatják) a jelentkezésüket
CREATE POLICY "Clients can delete their own participation" ON public.workout_participants
  FOR DELETE USING (auth.uid() = client_id);

-- Edzők láthatják, módosíthatják a saját edzéseikhez tartozó jelentkezéseket
CREATE POLICY "Trainers can view and manage their workout participants" ON public.workout_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workouts w 
      WHERE w.id = workout_id AND w.trainer_id = auth.uid()
    )
  );

-- 4. ADATOK MIGRÁLÁSA
-- Move existing client_id bookings from workouts to the new table as 'accepted'
INSERT INTO public.workout_participants (workout_id, client_id, status)
SELECT id, client_id, 'accepted'
FROM public.workouts
WHERE client_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Optionally, we can drop the client_id column later, but for now we leave it to not break everything at once.
-- We will ignore it in the UI and queries from now on.
-- EXERCISES TABLE (Gyakorlat-könyvtár)
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR,
  muscle_group VARCHAR,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage their own exercises" ON public.exercises
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (true);
-- Enable Realtime for messages table (needed for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- weight_logs tábla (testsúly napló)
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL(5,1) NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE(client_id, logged_at)
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;

CREATE POLICY "Users can manage own weight logs" ON public.weight_logs
  FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Trainers can view client weight logs" ON public.weight_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_participants wp
      JOIN workouts w ON w.id = wp.workout_id
      WHERE wp.client_id = weight_logs.client_id
        AND w.trainer_id = auth.uid()
    )
  );

-- Phase 5 UI relies on these columns while editing workout cards/plans.
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0 NOT NULL;

-- Clients must be able to read workouts they booked through workout_participants,
-- even when the legacy workouts.client_id column is null.
DROP POLICY IF EXISTS "Users can view their own or assigned workouts" ON public.workouts;
CREATE POLICY "Users can view their own or assigned workouts" ON public.workouts
  FOR SELECT USING (
    auth.uid() = trainer_id
    OR auth.uid() = client_id
    OR status = 'available'
    OR EXISTS (
      SELECT 1
      FROM public.workout_participants wp
      WHERE wp.workout_id = workouts.id
        AND wp.client_id = auth.uid()
    )
  );

-- Clients now access workouts through workout_participants, not only workouts.client_id.
DROP POLICY IF EXISTS "Users can view workout exercises if they have access to the workout" ON public.workout_exercises;
CREATE POLICY "Users can view workout exercises if they have access to the workout" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND (
          w.trainer_id = auth.uid()
          OR w.client_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.workout_participants wp
            WHERE wp.workout_id = w.id
              AND wp.client_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Trainers can manage workout exercises" ON public.workout_exercises;
CREATE POLICY "Trainers can manage workout exercises" ON public.workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.trainer_id = auth.uid()
    )
  );

-- Coach client detail pages are based on workout participation, so trainer log access
-- needs to follow the same relationship model.
DROP POLICY IF EXISTS "Trainers can view logs of their clients" ON public.exercise_logs;
CREATE POLICY "Trainers can view logs of their clients" ON public.exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = exercise_logs.client_id
        AND tc.status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM public.workout_participants wp
      JOIN public.workouts w ON w.id = wp.workout_id
      WHERE wp.client_id = exercise_logs.client_id
        AND w.trainer_id = auth.uid()
    )
  );
-- Ensure weight log inserts/upserts work for authenticated clients even if the
-- original Phase 5 migration was already applied before policy/grant fixes.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;

DROP POLICY IF EXISTS "Users can manage own weight logs" ON public.weight_logs;
CREATE POLICY "Users can manage own weight logs" ON public.weight_logs
  FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Trainers can view client weight logs" ON public.weight_logs;
CREATE POLICY "Trainers can view client weight logs" ON public.weight_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.workout_participants wp
      JOIN public.workouts w ON w.id = wp.workout_id
      WHERE wp.client_id = weight_logs.client_id
        AND w.trainer_id = auth.uid()
    )
  );
-- Break RLS recursion between workouts, workout_participants, workout_exercises,
-- exercise_logs and weight_logs.
--
-- These helpers live outside the exposed public schema. They are SECURITY
-- DEFINER functions so policy checks can inspect relationship rows without
-- recursively invoking the same RLS policies.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_workout_participant(
  p_workout_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_participants wp
    WHERE wp.workout_id = p_workout_id
      AND wp.client_id = p_user_id
      AND wp.status IN ('pending', 'accepted')
  );
$$;

CREATE OR REPLACE FUNCTION private.trainer_owns_workout(
  p_workout_id uuid,
  p_trainer_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = p_workout_id
      AND w.trainer_id = p_trainer_id
  );
$$;

CREATE OR REPLACE FUNCTION private.trainer_has_client(
  p_trainer_id uuid,
  p_client_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_participants wp
    JOIN public.workouts w ON w.id = wp.workout_id
    WHERE wp.client_id = p_client_id
      AND w.trainer_id = p_trainer_id
      AND wp.status IN ('pending', 'accepted')
  );
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_workout_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.trainer_owns_workout(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.trainer_has_client(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can view their own or assigned workouts" ON public.workouts;
CREATE POLICY "Users can view their own or assigned workouts" ON public.workouts
  FOR SELECT USING (
    auth.uid() = trainer_id
    OR auth.uid() = client_id
    OR status = 'available'
    OR private.is_workout_participant(id, auth.uid())
  );

DROP POLICY IF EXISTS "Trainers can view and manage their workout participants" ON public.workout_participants;
CREATE POLICY "Trainers can view and manage their workout participants" ON public.workout_participants
  FOR ALL USING (
    private.trainer_owns_workout(workout_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view workout exercises if they have access to the workout" ON public.workout_exercises;
CREATE POLICY "Users can view workout exercises if they have access to the workout" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND (
          w.trainer_id = auth.uid()
          OR w.client_id = auth.uid()
          OR private.is_workout_participant(w.id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Trainers can manage workout exercises" ON public.workout_exercises;
CREATE POLICY "Trainers can manage workout exercises" ON public.workout_exercises
  FOR ALL USING (
    private.trainer_owns_workout(workout_id, auth.uid())
  );

DROP POLICY IF EXISTS "Trainers can view client weight logs" ON public.weight_logs;
CREATE POLICY "Trainers can view client weight logs" ON public.weight_logs
  FOR SELECT USING (
    private.trainer_has_client(auth.uid(), client_id)
  );

DROP POLICY IF EXISTS "Trainers can view logs of their clients" ON public.exercise_logs;
CREATE POLICY "Trainers can view logs of their clients" ON public.exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = exercise_logs.client_id
        AND tc.status = 'active'
    )
    OR private.trainer_has_client(auth.uid(), client_id)
  );
-- Migrate muscle_group from VARCHAR to TEXT[] (array) to support multiple muscle groups per exercise
-- Step 1: Add new array column
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS muscle_groups TEXT[];

-- Step 2: Migrate existing data from old column to new array column
UPDATE public.exercises
  SET muscle_groups = ARRAY[muscle_group]
  WHERE muscle_group IS NOT NULL AND muscle_groups IS NULL;

-- Step 3: Drop old column
ALTER TABLE public.exercises DROP COLUMN IF EXISTS muscle_group;
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
-- Admin foundation: role hardening, audit log, account status, settings.

CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active', 'suspended', 'pending'));

CREATE OR REPLACE FUNCTION private.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'admin'
      AND account_status <> 'suspended'
  );
$$;

CREATE OR REPLACE FUNCTION private.profile_role(p_user_id uuid)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION private.profile_account_status(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_status FROM public.profiles WHERE id = p_user_id;
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.profile_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.profile_account_status(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = private.profile_role(auth.uid())
    AND account_status = private.profile_account_status(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));

-- New registrations must always start as clients. Authorization is admin-owned.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    'client'::user_role,
    COALESCE((NEW.raw_user_meta_data->>'full_name')::text, 'Felhasznalo'),
    COALESCE((NEW.raw_user_meta_data->>'avatar_url')::text, '')
  );
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
  FOR SELECT USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (private.is_admin(auth.uid()) AND actor_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view platform settings" ON public.platform_settings;
CREATE POLICY "Admins can view platform settings" ON public.platform_settings
  FOR SELECT USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings" ON public.platform_settings
  FOR UPDATE USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;
CREATE POLICY "Admins can insert platform settings" ON public.platform_settings
  FOR INSERT WITH CHECK (private.is_admin(auth.uid()));

INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('booking_min_cancel_hours', '24'::jsonb, 'Minimum lemondasi ido oraban'),
  ('default_workout_duration_min', '60'::jsonb, 'Alapertelmezett edzes hossz percben'),
  ('onboarding_required', 'true'::jsonb, 'Kotelezo kliens onboarding'),
  ('trainer_approval_required', 'true'::jsonb, 'Edzoi fiokok admin jovahagyasa')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION private.can_create_notification(
  p_sender_id uuid,
  p_recipient_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_sender_id = p_recipient_id
    OR private.is_admin(p_sender_id)
    OR EXISTS (
      SELECT 1
      FROM public.trainer_clients tc
      WHERE tc.status = 'active'
        AND (
          (tc.trainer_id = p_sender_id AND tc.client_id = p_recipient_id)
          OR (tc.client_id = p_sender_id AND tc.trainer_id = p_recipient_id)
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.workout_participants wp
      JOIN public.workouts w ON w.id = wp.workout_id
      WHERE wp.status IN ('pending', 'accepted')
        AND (
          (w.trainer_id = p_sender_id AND wp.client_id = p_recipient_id)
          OR (wp.client_id = p_sender_id AND w.trainer_id = p_recipient_id)
        )
    );
$$;

GRANT EXECUTE ON FUNCTION private.can_create_notification(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create related notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create related notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND private.can_create_notification(auth.uid(), user_id)
  );

-- PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, subscription)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE push_subscriptions;
-- Add notifications table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- Client Passes
CREATE TABLE public.client_passes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_occasions INTEGER NOT NULL CHECK (total_occasions > 0),
    used_occasions INTEGER DEFAULT 0 CHECK (used_occasions >= 0 AND used_occasions <= total_occasions),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN GENERATED ALWAYS AS (used_occasions < total_occasions) STORED
);

-- External Calendar Events
CREATE TABLE public.external_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    calendar_provider TEXT NOT NULL DEFAULT 'google',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add pass_id to workout_participants
ALTER TABLE public.workout_participants ADD COLUMN pass_id UUID REFERENCES public.client_passes(id) ON DELETE SET NULL;

-- Trigger to deduct pass on INSERT if pass_id is provided
CREATE OR REPLACE FUNCTION public.deduct_pass_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pass_id IS NOT NULL THEN
        UPDATE public.client_passes
        SET used_occasions = used_occasions + 1
        WHERE id = NEW.pass_id AND used_occasions < total_occasions;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Pass is fully used or not found';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_deduct_pass_on_booking
AFTER INSERT ON public.workout_participants
FOR EACH ROW EXECUTE FUNCTION public.deduct_pass_on_booking();

-- Trigger to refund pass on DELETE if pass_id was provided
CREATE OR REPLACE FUNCTION public.refund_pass_on_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.pass_id IS NOT NULL THEN
        UPDATE public.client_passes
        SET used_occasions = used_occasions - 1
        WHERE id = OLD.pass_id AND used_occasions > 0;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_refund_pass_on_cancellation
AFTER DELETE ON public.workout_participants
FOR EACH ROW EXECUTE FUNCTION public.refund_pass_on_cancellation();

-- RLS Policies for client_passes
ALTER TABLE public.client_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passes" ON public.client_passes FOR SELECT TO authenticated
USING (client_id = auth.uid() OR private.profile_role(auth.uid()) IN ('admin', 'trainer'));

CREATE POLICY "Trainers and admins can insert passes" ON public.client_passes FOR INSERT TO authenticated
WITH CHECK (private.profile_role(auth.uid()) IN ('admin', 'trainer'));

CREATE POLICY "Trainers and admins can update passes" ON public.client_passes FOR UPDATE TO authenticated
USING (private.profile_role(auth.uid()) IN ('admin', 'trainer'));

CREATE POLICY "Trainers and admins can delete passes" ON public.client_passes FOR DELETE TO authenticated
USING (private.profile_role(auth.uid()) IN ('admin', 'trainer'));

-- RLS Policies for external_calendar_events
ALTER TABLE public.external_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events" ON public.external_calendar_events FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.profile_role(auth.uid()) = 'admin');

CREATE POLICY "Users can manage own calendar events" ON public.external_calendar_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR private.profile_role(auth.uid()) = 'admin');

CREATE POLICY "Users can manage own calendar events update" ON public.external_calendar_events FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR private.profile_role(auth.uid()) = 'admin');

CREATE POLICY "Users can manage own calendar events delete" ON public.external_calendar_events FOR DELETE TO authenticated
USING (user_id = auth.uid() OR private.profile_role(auth.uid()) = 'admin');
-- Fix PostgreSQL privileges for profiles table
-- Supabase requires explicit grants in addition to RLS policies.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon, service_role;
CREATE TABLE IF NOT EXISTS public.exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(trainer_id, name)
);

ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage their own categories" ON public.exercise_categories
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "Anyone can view categories" ON public.exercise_categories
  FOR SELECT USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_categories TO authenticated, anon, service_role;
-- Explicitly grant permissions to all relevant tables to ensure no 'permission denied' errors occur.
-- Row Level Security (RLS) is enabled on these tables, so it remains safe.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_participants TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_categories TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon, service_role;
-- Explicitly grant permissions to remaining tables to fix "permission denied" errors

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_passes TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_logs TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_clients TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_calendar_events TO authenticated, anon, service_role;
-- Allow trainers to view the passes of their clients
CREATE POLICY "Trainers and admins can view passes" ON public.client_passes FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'trainer' OR role = 'admin'))
);
-- Fix infinite recursion in conversation_participants and messages policies

CREATE OR REPLACE FUNCTION private.is_conversation_participant(
  p_conversation_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.profile_id = p_profile_id
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_conversation_participant(uuid, uuid) TO authenticated;

-- Drop recursive policies
DROP POLICY IF EXISTS "Participants can view members of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;

-- Create safe policies using the security definer function
CREATE POLICY "Participants can view members of their conversations" ON public.conversation_participants
  FOR SELECT USING (
    private.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Users can add participants to conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() OR 
    private.is_conversation_participant(conversation_id, auth.uid())
  );
