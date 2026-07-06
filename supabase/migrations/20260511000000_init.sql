-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'client');
CREATE TYPE connection_status AS ENUM ('pending', 'active', 'rejected');
CREATE TYPE workout_status AS ENUM ('scheduled', 'completed', 'cancelled', 'available');


-- 2. TABLES (Created first so private schema helper functions can reference them during SQL validation)

-- profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'client'::user_role NOT NULL,
  full_name TEXT DEFAULT '' NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  weight_kg NUMERIC,
  height_cm INTEGER,
  birth_date DATE,
  gender VARCHAR,
  fitness_level VARCHAR,
  onboarding_completed BOOLEAN DEFAULT false,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- trainer_clients
CREATE TABLE public.trainer_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status connection_status DEFAULT 'pending'::connection_status NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(trainer_id, client_id)
);

-- client_passes
CREATE TABLE public.client_passes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_occasions INTEGER NOT NULL CHECK (total_occasions > 0),
    used_occasions INTEGER DEFAULT 0 CHECK (used_occasions >= 0 AND used_occasions <= total_occasions),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN GENERATED ALWAYS AS (used_occasions < total_occasions) STORED
);

-- workouts
CREATE TABLE public.workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 60 NOT NULL,
  capacity INTEGER DEFAULT 1,
  notes TEXT,
  status workout_status DEFAULT 'scheduled'::workout_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- workout_participants
CREATE TABLE public.workout_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pass_id UUID REFERENCES public.client_passes(id) ON DELETE SET NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_id, client_id)
);

-- workout_exercises
CREATE TABLE public.workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_target DECIMAL(5,2),
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  rir INTEGER CHECK (rir >= 0 AND rir <= 10),
  is_superset BOOLEAN DEFAULT false,
  rest_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- exercise_categories
CREATE TABLE public.exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(trainer_id, name)
);

-- exercises
CREATE TABLE public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR,
  muscle_groups TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- weight_logs
CREATE TABLE public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL(5,1) NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE(client_id, logged_at)
);

-- exercise_logs
CREATE TABLE public.exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  reps INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- conversations
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- conversation_participants
CREATE TABLE public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (conversation_id, profile_id)
);

-- messages
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ
);

-- notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR NOT NULL, 
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- push_subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, subscription)
);

-- external_calendar_events
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

-- admin_audit_logs
CREATE TABLE public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- platform_settings
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- 3. PRIVATE SCHEMA & SECURITY DEFINER FUNCTIONS (Prevents Infinite Recursion in RLS)
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'admin' AND account_status <> 'suspended'
  );
$$;

CREATE OR REPLACE FUNCTION private.profile_role(p_user_id uuid)
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION private.profile_account_status(p_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT account_status FROM public.profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION private.is_workout_participant(p_workout_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workout_participants wp
    WHERE wp.workout_id = p_workout_id AND wp.client_id = p_user_id AND wp.status IN ('pending', 'accepted')
  );
$$;

CREATE OR REPLACE FUNCTION private.trainer_owns_workout(p_workout_id uuid, p_trainer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workouts w WHERE w.id = p_workout_id AND w.trainer_id = p_trainer_id
  );
$$;

CREATE OR REPLACE FUNCTION private.trainer_has_client(p_trainer_id uuid, p_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workout_participants wp
    JOIN public.workouts w ON w.id = wp.workout_id
    WHERE wp.client_id = p_client_id AND w.trainer_id = p_trainer_id AND wp.status IN ('pending', 'accepted')
  ) OR EXISTS (
    SELECT 1 FROM public.trainer_clients tc 
    WHERE tc.trainer_id = p_trainer_id AND tc.client_id = p_client_id AND tc.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_conversation_participant(p_conversation_id uuid, p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id AND cp.profile_id = p_profile_id
  );
$$;

CREATE OR REPLACE FUNCTION private.can_create_notification(p_sender_id uuid, p_recipient_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p_sender_id = p_recipient_id
    OR private.is_admin(p_sender_id)
    OR EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.status = 'active' AND (
        (tc.trainer_id = p_sender_id AND tc.client_id = p_recipient_id) OR 
        (tc.client_id = p_sender_id AND tc.trainer_id = p_recipient_id)
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.workout_participants wp
      JOIN public.workouts w ON w.id = wp.workout_id
      WHERE wp.status IN ('pending', 'accepted') AND (
        (w.trainer_id = p_sender_id AND wp.client_id = p_recipient_id) OR 
        (wp.client_id = p_sender_id AND w.trainer_id = p_recipient_id)
      )
    );
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.profile_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.profile_account_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_workout_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.trainer_owns_workout(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.trainer_has_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_create_notification(uuid, uuid) TO authenticated;


-- 4. PERMISSIONS & RLS SETUP

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_clients TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_participants TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_categories TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_passes TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_calendar_events TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_logs TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated, anon, service_role;


-- 5. POLICIES

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id AND role = private.profile_role(auth.uid()) AND account_status = private.profile_account_status(auth.uid()));
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

-- trainer_clients
CREATE POLICY "Trainers and clients can view their connections" ON public.trainer_clients FOR SELECT 
  USING (auth.uid() = trainer_id OR auth.uid() = client_id OR private.is_admin(auth.uid()));
CREATE POLICY "Clients can request connection (insert)" ON public.trainer_clients FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = trainer_id);
CREATE POLICY "Trainers can update connection status" ON public.trainer_clients FOR UPDATE USING (auth.uid() = trainer_id OR auth.uid() = client_id);
CREATE POLICY "Trainers or clients can delete connection" ON public.trainer_clients FOR DELETE USING (auth.uid() = trainer_id OR auth.uid() = client_id);

-- client_passes
CREATE POLICY "Users can view own passes" ON public.client_passes FOR SELECT TO authenticated USING (client_id = auth.uid() OR private.profile_role(auth.uid()) IN ('admin', 'trainer'));
CREATE POLICY "Trainers and admins can insert passes" ON public.client_passes FOR INSERT TO authenticated WITH CHECK (private.profile_role(auth.uid()) IN ('admin', 'trainer'));
CREATE POLICY "Trainers and admins can update passes" ON public.client_passes FOR UPDATE TO authenticated USING (private.profile_role(auth.uid()) IN ('admin', 'trainer'));
CREATE POLICY "Trainers and admins can delete passes" ON public.client_passes FOR DELETE TO authenticated USING (private.profile_role(auth.uid()) IN ('admin', 'trainer'));

-- workouts
CREATE POLICY "Users can view their own or assigned workouts" ON public.workouts FOR SELECT USING (
  auth.uid() = trainer_id OR auth.uid() = client_id OR status = 'available' OR private.is_workout_participant(id, auth.uid()) OR private.is_admin(auth.uid())
);
CREATE POLICY "Trainers can insert workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = trainer_id OR private.is_admin(auth.uid()));
CREATE POLICY "Trainers can update their workouts" ON public.workouts FOR UPDATE USING (auth.uid() = trainer_id OR private.is_admin(auth.uid()));
CREATE POLICY "Trainers can delete their workouts" ON public.workouts FOR DELETE USING (auth.uid() = trainer_id OR private.is_admin(auth.uid()));

-- workout_participants
CREATE POLICY "Clients can view their own participations" ON public.workout_participants FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can insert their own participation" ON public.workout_participants FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can delete their own participation" ON public.workout_participants FOR DELETE USING (auth.uid() = client_id);
CREATE POLICY "Trainers can view and manage their workout participants" ON public.workout_participants FOR ALL USING (private.trainer_owns_workout(workout_id, auth.uid()));

-- workout_exercises
CREATE POLICY "Users can view workout exercises if they have access to the workout" ON public.workout_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_exercises.workout_id AND (w.trainer_id = auth.uid() OR private.is_workout_participant(w.id, auth.uid())))
);
CREATE POLICY "Trainers can manage workout exercises" ON public.workout_exercises FOR ALL USING (private.trainer_owns_workout(workout_id, auth.uid()));

-- exercise_categories
CREATE POLICY "Trainers can manage their own categories" ON public.exercise_categories FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Anyone can view categories" ON public.exercise_categories FOR SELECT USING (true);

-- exercises
CREATE POLICY "Trainers can manage their own exercises" ON public.exercises FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);

-- weight_logs
CREATE POLICY "Users can manage own weight logs" ON public.weight_logs FOR ALL USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Trainers can view client weight logs" ON public.weight_logs FOR SELECT USING (private.trainer_has_client(auth.uid(), client_id));

-- exercise_logs
CREATE POLICY "Clients can view and manage their own logs" ON public.exercise_logs FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Trainers can view logs of their clients" ON public.exercise_logs FOR SELECT USING (private.trainer_has_client(auth.uid(), client_id));
CREATE POLICY "Admins can view everything in exercise_logs" ON public.exercise_logs FOR SELECT USING (private.is_admin(auth.uid()));

-- conversations
CREATE POLICY "Participants can view their conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);

-- conversation_participants
CREATE POLICY "Participants can view members of their conversations" ON public.conversation_participants FOR SELECT USING (private.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Users can add participants to conversations" ON public.conversation_participants FOR INSERT WITH CHECK (true);

-- messages
CREATE POLICY "Participants can view messages in their conversations" ON public.messages FOR SELECT USING (private.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND private.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Participants can update message read_at" ON public.messages FOR UPDATE USING (private.is_conversation_participant(conversation_id, auth.uid())) WITH CHECK (auth.uid() != sender_id);

-- notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create related notifications" ON public.notifications FOR INSERT WITH CHECK (created_by = auth.uid() AND private.can_create_notification(auth.uid(), user_id));

-- push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- external_calendar_events
CREATE POLICY "Users can view own calendar events" ON public.external_calendar_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.profile_role(auth.uid()) = 'admin');
CREATE POLICY "Users can manage own calendar events" ON public.external_calendar_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR private.profile_role(auth.uid()) = 'admin');
CREATE POLICY "Users can manage own calendar events update" ON public.external_calendar_events FOR UPDATE TO authenticated USING (user_id = auth.uid() OR private.profile_role(auth.uid()) = 'admin');
CREATE POLICY "Users can manage own calendar events delete" ON public.external_calendar_events FOR DELETE TO authenticated USING (user_id = auth.uid() OR private.profile_role(auth.uid()) = 'admin');

-- admin_audit_logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (private.is_admin(auth.uid()));
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (private.is_admin(auth.uid()) AND actor_id = auth.uid());

-- platform_settings
CREATE POLICY "Admins can view platform settings" ON public.platform_settings FOR SELECT USING (private.is_admin(auth.uid()));
CREATE POLICY "Admins can update platform settings" ON public.platform_settings FOR UPDATE USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins can insert platform settings" ON public.platform_settings FOR INSERT WITH CHECK (private.is_admin(auth.uid()));


-- 6. TRIGGERS & PUBLICATIONS

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    'client'::user_role,
    COALESCE((NEW.raw_user_meta_data->>'full_name')::text, 'Felhasználó'),
    COALESCE((NEW.raw_user_meta_data->>'avatar_url')::text, '')
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Conversation updated_at trigger
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER on_message_created AFTER INSERT ON public.messages FOR EACH ROW EXECUTE PROCEDURE public.update_conversation_updated_at();

-- Deduct pass trigger
CREATE OR REPLACE FUNCTION public.deduct_pass_on_booking() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pass_id IS NOT NULL THEN
        UPDATE public.client_passes SET used_occasions = used_occasions + 1 WHERE id = NEW.pass_id AND used_occasions < total_occasions;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Pass is fully used or not found';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER tr_deduct_pass_on_booking AFTER INSERT ON public.workout_participants FOR EACH ROW EXECUTE FUNCTION public.deduct_pass_on_booking();

-- Refund pass trigger
CREATE OR REPLACE FUNCTION public.refund_pass_on_cancellation() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.pass_id IS NOT NULL THEN
        UPDATE public.client_passes SET used_occasions = used_occasions - 1 WHERE id = OLD.pass_id AND used_occasions > 0;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER tr_refund_pass_on_cancellation AFTER DELETE ON public.workout_participants FOR EACH ROW EXECUTE FUNCTION public.refund_pass_on_cancellation();


-- Realtime Publications
-- Create publication if it doesn't exist (Supabase already has supabase_realtime normally, but we ensure tables are added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'push_subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;
  END IF;
END $$;


-- Default Inserts
INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('booking_min_cancel_hours', '24'::jsonb, 'Minimum lemondasi ido oraban'),
  ('default_workout_duration_min', '60'::jsonb, 'Alapertelmezett edzes hossz percben'),
  ('onboarding_required', 'true'::jsonb, 'Kotelezo kliens onboarding'),
  ('trainer_approval_required', 'true'::jsonb, 'Edzoi fiokok admin jovahagyasa')
ON CONFLICT (key) DO NOTHING;

-- Sync profiles for existing users who do not have one (e.g. after schema resets)
INSERT INTO public.profiles (id, role, full_name, avatar_url)
SELECT 
  id,
  'client'::user_role,
  COALESCE((raw_user_meta_data->>'full_name')::text, 'Felhasználó'),
  COALESCE((raw_user_meta_data->>'avatar_url')::text, '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Trigger to automatically copy profile weight updates to weight_logs
CREATE OR REPLACE FUNCTION public.log_profile_weight_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.weight_kg IS NOT NULL THEN
      INSERT INTO public.weight_logs (client_id, weight_kg, logged_at)
      VALUES (NEW.id, NEW.weight_kg, CURRENT_DATE)
      ON CONFLICT (client_id, logged_at) 
      DO UPDATE SET weight_kg = EXCLUDED.weight_kg;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.weight_kg IS DISTINCT FROM OLD.weight_kg AND NEW.weight_kg IS NOT NULL THEN
      INSERT INTO public.weight_logs (client_id, weight_kg, logged_at)
      VALUES (NEW.id, NEW.weight_kg, CURRENT_DATE)
      ON CONFLICT (client_id, logged_at) 
      DO UPDATE SET weight_kg = EXCLUDED.weight_kg;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_profile_weight_change
  AFTER INSERT OR UPDATE OF weight_kg ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_weight_change();

-- Backfill weight_logs for any profiles that already have weight_kg defined
INSERT INTO public.weight_logs (client_id, weight_kg, logged_at)
SELECT id, weight_kg, CURRENT_DATE
FROM public.profiles
WHERE weight_kg IS NOT NULL
ON CONFLICT (client_id, logged_at) DO NOTHING;


