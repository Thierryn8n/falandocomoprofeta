-- Fix RLS policy for app_config to allow public read access
-- This allows visitors to see the prophet avatar and other public configs

-- Enable RLS on app_config (if not already enabled)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive SELECT policy if exists
DROP POLICY IF EXISTS "Admin can manage app config" ON app_config;
DROP POLICY IF EXISTS "Public read access for app config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can read app config" ON app_config;

-- Create policy: Allow anyone to read app config (public access)
-- This is needed for prophet avatar, app name, etc. to be visible to visitors
CREATE POLICY "Public read access for app config" 
    ON app_config 
    FOR SELECT 
    TO public 
    USING (true);

-- Create policy: Only admins can modify app config
CREATE POLICY "Admin can manage app config" 
    ON app_config 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'app_config';
