-- Create IP geolocation table for tracking user locations
CREATE TABLE IF NOT EXISTS public.ip_geolocation (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    country TEXT NULL,
    country_code TEXT NULL,
    region TEXT NULL,
    city TEXT NULL,
    latitude NUMERIC(10, 8) NULL,
    longitude NUMERIC(11, 8) NULL,
    timezone TEXT NULL,
    isp TEXT NULL,
    organization TEXT NULL,
    as_number TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT ip_geolocation_pkey PRIMARY KEY (id),
    CONSTRAINT ip_geolocation_ip_address_key UNIQUE (ip_address)
) TABLESPACE pg_default;

-- Create index for better performance on IP lookups
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_ip ON public.ip_geolocation USING btree (ip_address) TABLESPACE pg_default;

-- Create additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_country ON public.ip_geolocation USING btree (country);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_region ON public.ip_geolocation USING btree (region);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_city ON public.ip_geolocation USING btree (city);
CREATE INDEX IF NOT EXISTS idx_ip_geolocation_created_at ON public.ip_geolocation USING btree (created_at DESC);

-- Enable RLS
ALTER TABLE public.ip_geolocation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can view all geolocation data
CREATE POLICY "Admins can view all geolocation data" ON public.ip_geolocation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow public insert for tracking user locations
CREATE POLICY "Allow public insert for geolocation tracking" ON public.ip_geolocation
    FOR INSERT WITH CHECK (true);

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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ip_geolocation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ip_geolocation_updated_at
    BEFORE UPDATE ON public.ip_geolocation
    FOR EACH ROW
    EXECUTE FUNCTION update_ip_geolocation_updated_at();

-- Create function to get geolocation statistics
CREATE OR REPLACE FUNCTION get_geolocation_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    country TEXT,
    region TEXT,
    city TEXT,
    user_count BIGINT,
    percentage NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT g.country, g.region, g.city
        FROM public.ip_geolocation g
        WHERE (start_date IS NULL OR g.created_at >= start_date)
        AND (end_date IS NULL OR g.created_at <= end_date)
    ),
    location_counts AS (
        SELECT 
            f.country,
            f.region,
            f.city,
            COUNT(*) as user_count
        FROM filtered_data f
        GROUP BY f.country, f.region, f.city
    ),
    total_count AS (
        SELECT SUM(user_count) as total FROM location_counts
    )
    SELECT 
        lc.country,
        lc.region,
        lc.city,
        lc.user_count,
        ROUND((lc.user_count::NUMERIC / tc.total::NUMERIC) * 100, 2) as percentage
    FROM location_counts lc
    CROSS JOIN total_count tc
    ORDER BY lc.user_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;