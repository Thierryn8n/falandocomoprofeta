-- Create user sessions table for real-time tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_logged_in BOOLEAN DEFAULT FALSE,
    device_type TEXT DEFAULT 'desktop',
    browser TEXT DEFAULT 'unknown',
    os TEXT DEFAULT 'unknown',
    country TEXT DEFAULT 'Unknown',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create site visits table for total access tracking
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_logged_in BOOLEAN DEFAULT FALSE,
    page_url TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user devices table for device analytics
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type TEXT DEFAULT 'desktop',
    browser TEXT DEFAULT 'unknown',
    os TEXT DEFAULT 'unknown',
    country TEXT DEFAULT 'Unknown',
    screen_resolution TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context TEXT DEFAULT 'unknown',
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create response time logs table
CREATE TABLE IF NOT EXISTS response_time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    response_time_ms INTEGER NOT NULL,
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_user_id ON site_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_type ON user_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_user_devices_country ON user_devices(country);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_created_at ON system_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_response_time_logs_created_at ON response_time_logs(created_at);

-- Function to clean old sessions (older than 5 minutes)
CREATE OR REPLACE FUNCTION clean_old_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to record system metrics
CREATE OR REPLACE FUNCTION record_system_metric(
    p_metric_name TEXT,
    p_metric_value NUMERIC,
    p_metric_unit TEXT DEFAULT ''
)
RETURNS void AS $$
BEGIN
    INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
    VALUES (p_metric_name, p_metric_value, p_metric_unit);
END;
$$ LANGUAGE plpgsql;

-- Function to get peak hours
CREATE OR REPLACE FUNCTION get_peak_hours()
RETURNS TABLE(hour_of_day INTEGER, session_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM created_at)::INTEGER as hour_of_day,
        COUNT(*) as session_count
    FROM user_sessions 
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY session_count DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get user retention
CREATE OR REPLACE FUNCTION get_user_retention()
RETURNS TABLE(period TEXT, retention_rate NUMERIC) AS $$
BEGIN
    RETURN QUERY
    WITH week1_users AS (
        SELECT DISTINCT user_id
        FROM site_visits
        WHERE created_at >= NOW() - INTERVAL '7 days'
        AND user_id IS NOT NULL
    ),
    week2_users AS (
        SELECT DISTINCT user_id
        FROM site_visits
        WHERE created_at >= NOW() - INTERVAL '14 days'
        AND created_at < NOW() - INTERVAL '7 days'
        AND user_id IS NOT NULL
    )
    SELECT 'Week 1'::TEXT, COUNT(*)::NUMERIC FROM week1_users
    UNION ALL
    SELECT 'Week 2'::TEXT, COUNT(*)::NUMERIC FROM week2_users;
END;
$$ LANGUAGE plpgsql;

-- Insert some initial system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_unit) VALUES
('system_uptime', 99.9, '%'),
('storage_used', 2500, 'MB'),
('bandwidth_used', 15700, 'MB'),
('avg_response_time', 1200, 'ms')
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_time_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can view all sessions" ON user_sessions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin can view all visits" ON site_visits FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin can view all devices" ON user_devices FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin can view all errors" ON error_logs FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin can view all metrics" ON system_metrics FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admin can view all response times" ON response_time_logs FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Allow public insert for tracking (sessions will be created by anonymous users too)
CREATE POLICY "Allow public session insert" ON user_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public visit insert" ON site_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public device insert" ON user_devices FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public error insert" ON error_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public response time insert" ON response_time_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow public update for session tracking
CREATE POLICY "Allow public session update" ON user_sessions FOR UPDATE TO anon, authenticated USING (true);

-- Allow public delete for session cleanup
CREATE POLICY "Allow public session delete" ON user_sessions FOR DELETE TO anon, authenticated USING (true);
