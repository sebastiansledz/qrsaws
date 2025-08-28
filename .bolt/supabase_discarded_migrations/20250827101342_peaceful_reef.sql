/*
  # Fix admin user setup

  This migration ensures the current user has admin privileges and fixes any missing admin flags.
  
  1. Admin Setup
    - Sets admin flag for existing users who should be admins
    - Creates proper user_profiles entries
    
  2. Notes
    - Replace the UUID with your actual auth user ID
    - You can find your user ID by running: SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;
*/

-- First, let's see current auth users (for reference)
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- Replace 'YOUR_AUTH_USER_ID_HERE' with your actual user ID from auth.users
-- Example: '12345678-1234-1234-1234-123456789012'

INSERT INTO public.user_profiles (user_id, display_name, email, is_admin)
VALUES ('YOUR_AUTH_USER_ID_HERE', 'Owner', 'owner@example.com', true)
ON CONFLICT (user_id) 
DO UPDATE SET 
  is_admin = true,
  display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
  email = COALESCE(EXCLUDED.email, user_profiles.email);

-- Also ensure app_roles entry exists
INSERT INTO public.app_roles (user_id, role, is_admin)
VALUES ('YOUR_AUTH_USER_ID_HERE', 'admin', true)
ON CONFLICT (user_id, role) 
DO UPDATE SET is_admin = true;