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
