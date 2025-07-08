-- Create a stored procedure to safely create admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;
BEGIN
  -- Insert or update the admin profile directly
  INSERT INTO public.profiles (
    user_id,
    username,
    display_name,
    is_admin,
    is_moderator,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
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
END;
$$;

-- Execute the function to create the admin profile
SELECT create_admin_user();

-- Drop the function as it's no longer needed
DROP FUNCTION create_admin_user();