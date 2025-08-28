/*
  # Fix RLS infinite recursion in user_profiles

  1. Problem
    - Current admin policy checks `user_profiles.is_admin` which creates infinite recursion
    - Policy tries to query the same table it's protecting

  2. Solution
    - Remove problematic policies that cause circular dependencies
    - Create simple, non-recursive policies
    - Use auth.uid() directly without self-referencing queries

  3. Security
    - Users can read/update their own profile
    - Remove admin-specific policies to avoid recursion
    - Keep basic user access controls
*/

-- Drop all existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "admin can select all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admin can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "up_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "up_read_own" ON public.user_profiles;
DROP POLICY IF EXISTS "up_update_own_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user can select own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user can update own non-admin" ON public.user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);