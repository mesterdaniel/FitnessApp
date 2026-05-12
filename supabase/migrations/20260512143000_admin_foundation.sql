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

