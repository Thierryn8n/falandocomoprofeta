-- Drop existing table if it exists
DROP TABLE IF EXISTS api_keys CASCADE;

-- Create api_keys table with correct structure
CREATE TABLE api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    key_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can manage API keys" ON api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert default API keys
INSERT INTO api_keys (provider, key_name, key_value, is_active) VALUES
('gemini', 'Default Gemini Key', 'AIzaSyB90mse8rY7Tf36awk3-vGQopOL_s4i03g', true),
('openai', 'Default OpenAI Key', 'sk-proj-test-key-placeholder', false);
