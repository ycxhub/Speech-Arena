-- Seed the initial admin user.
-- This promotes ychaitanyax@gmail.com to admin role.
-- The user must have already signed up (profile row must exist via handle_new_user trigger).

UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE email = 'ychaitanyax@gmail.com'
  AND role != 'admin';
