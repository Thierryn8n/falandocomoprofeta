-- Create table to track online users and visitors
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  is_logged_in BOOLEAN DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table to track all site visits
CREATE TABLE IF NOT EXISTS site_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  is_logged_in BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_is_logged_in ON site_visits(is_logged_in);

-- Function to clean old sessions (older than 30 minutes)
CREATE OR REPLACE FUNCTION clean_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE last_activity < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to update or create session
CREATE OR REPLACE FUNCTION upsert_user_session(
  p_user_id UUID,
  p_session_id TEXT,
  p_is_logged_in BOOLEAN
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_sessions (user_id, session_id, is_logged_in, last_activity)
  VALUES (p_user_id, p_session_id, p_is_logged_in, NOW())
  ON CONFLICT (session_id) 
  DO UPDATE SET 
    user_id = p_user_id,
    is_logged_in = p_is_logged_in,
    last_activity = NOW();
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for these tables (admin access only)
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits DISABLE ROW LEVEL SECURITY;
