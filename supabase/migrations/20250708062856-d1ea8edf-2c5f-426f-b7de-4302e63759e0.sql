-- Seed default admin account
-- First, insert the admin user into auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'admin@devnet.local',
  crypt('AdminPassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "admin", "display_name": "System Administrator"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Insert or update the admin profile
INSERT INTO public.profiles (
  user_id,
  username,
  display_name,
  is_admin,
  is_moderator,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'admin',
  'System Administrator',
  true,
  true,
  now(),
  now()
) ON CONFLICT (user_id) 
DO UPDATE SET 
  is_admin = true,
  is_moderator = true,
  updated_at = now();