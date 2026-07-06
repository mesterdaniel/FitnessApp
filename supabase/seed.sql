-- Seed tesztfelhasználók rögzítése

-- 1. Admin Fiók (admin@fitnessapp.local / admin123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@fitnessapp.local',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Rendszer Adminisztrátor"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Edző Fiók (trainer@fitnessapp.local / trainer123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'trainer@fitnessapp.local',
  crypt('trainer123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Minta Edző"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 3. Kliens Fiók (client@fitnessapp.local / client123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'client@fitnessapp.local',
  crypt('client123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Minta Kliens"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- A felhasználói szerepkörök előléptetése (a handle_new_user trigger alapértelmezetten client-et hoz létre)
UPDATE public.profiles SET role = 'admin' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'trainer' WHERE id = 'b0000000-0000-0000-0000-000000000002';
