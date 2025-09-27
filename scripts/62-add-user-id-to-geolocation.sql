-- Add user_id column to ip_geolocation table to track which user the IP belongs to
-- This will help us exclude admin users from geolocation statistics

-- Add user_id column with foreign key reference to profiles table
ALTER TABLE public.ip_geolocation 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_user_id ON public.ip_geolocation USING btree (user_id);

-- Update RLS policies to include user_id considerations
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all geolocation data" ON public.ip_geolocation;
DROP POLICY IF EXISTS "Allow public insert for geolocation tracking" ON public.ip_geolocation;
DROP POLICY IF EXISTS "Admins can update geolocation data" ON public.ip_geolocation;
DROP POLICY IF EXISTS "Admins can delete geolocation data" ON public.ip_geolocation;

-- Recreate policies with user_id considerations
-- Admins can view all geolocation data
CREATE POLICY "Admins can view all geolocation data" ON public.ip_geolocation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Users can view their own geolocation data
CREATE POLICY "Users can view own geolocation data" ON public.ip_geolocation
    FOR SELECT USING (user_id = auth.uid());

-- Allow authenticated users to insert their own geolocation data
CREATE POLICY "Allow authenticated insert for geolocation tracking" ON public.ip_geolocation
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (user_id = auth.uid() OR user_id IS NULL)
    );

-- Admins can update geolocation data
CREATE POLICY "Admins can update geolocation data" ON public.ip_geolocation
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Admins can delete geolocation data
CREATE POLICY "Admins can delete geolocation data" ON public.ip_geolocation
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to get geolocation statistics excluding admin users
CREATE OR REPLACE FUNCTION get_geolocation_stats_excluding_admins(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    group_by_field TEXT DEFAULT 'country'
)
RETURNS TABLE (
    location TEXT,
    user_count BIGINT,
    percentage NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            CASE 
                WHEN group_by_field = 'country' THEN COALESCE(g.country, 'Unknown')
                WHEN group_by_field = 'region' THEN COALESCE(g.country || ' - ' || g.region, 'Unknown')
                WHEN group_by_field = 'city' THEN COALESCE(g.city || ', ' || g.region || ', ' || g.country, 'Unknown')
                ELSE COALESCE(g.country, 'Unknown')
            END as location_key
        FROM public.ip_geolocation g
        LEFT JOIN public.profiles p ON g.user_id = p.id
        WHERE (start_date IS NULL OR g.created_at >= start_date)
        AND (end_date IS NULL OR g.created_at <= end_date)
        AND (p.role IS NULL OR p.role != 'admin') -- Exclude admin users
    ),
    location_counts AS (
        SELECT 
            location_key,
            COUNT(*) as count
        FROM filtered_data
        GROUP BY location_key
    ),
    total_count AS (
        SELECT SUM(count) as total FROM location_counts
    )
    SELECT 
        lc.location_key::TEXT,
        lc.count,
        CASE 
            WHEN tc.total > 0 THEN ROUND((lc.count::NUMERIC / tc.total::NUMERIC) * 100, 2)
            ELSE 0::NUMERIC(5,2)
        END
    FROM location_counts lc
    CROSS JOIN total_count tc
    ORDER BY lc.count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_geolocation_stats_excluding_admins(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;