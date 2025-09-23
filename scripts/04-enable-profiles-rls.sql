-- IMPORTANT: Make sure to execute this script in Supabase SQL Editor.

-- Transfer ownership of tables to postgres role for SECURITY DEFINER functions if needed
-- This ensures that functions using SECURITY DEFINER can bypass RLS as intended.
-- You might need to run this from the 'postgres' user, or ensure your admin role has privileges.
-- ALTER TABLE public.profiles OWNER TO postgres;

-- Enable RLS on the public.profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts and ensure only new ones are applied
-- It's crucial that these policies are removed to avoid duplication or conflicts,
-- especially the ones causing recursion.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles; -- Redundant from previous attempt
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;   -- Redundant from previous attempt


-- Create a function to check if a user is an admin, bypassing RLS.
-- This is necessary to avoid infinite recursion in RLS policies that check user roles.
-- The function is owned by 'postgres' and uses SECURITY DEFINER to bypass RLS.
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS on tables it queries
AS $$
BEGIN
RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin');
END;
$$;
-- Grant execute permissions to authenticated users to use this function in policies
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;


-- Policy for authenticated users to insert their own profile
-- This is the most important policy for your profile not being populated.
-- It ensures that the profile ID matches the authenticated user's ID.
CREATE POLICY "Allow authenticated users to insert their own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Policy for authenticated users to view their own profile
CREATE POLICY "Allow authenticated users to view their own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

-- Policy for authenticated users to update their own profile
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);


-- Policies for Admin users, now using the is_admin() function to avoid recursion
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- Admins can delete any profile
CREATE POLICY "Admins can delete any profile" ON public.profiles
FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
