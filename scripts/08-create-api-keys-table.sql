-- Drop existing table if it exists to recreate with correct structure
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

-- Insert default Gemini key
INSERT INTO api_keys (provider, key_name, key_value, is_active) 
VALUES ('gemini', 'Default Gemini Key', 'AIzaSyB90mse8rY7Tf36awk3-vGQopOL_s4i03g', true);

-- Insert default OpenAI key placeholder
INSERT INTO api_keys (provider, key_name, key_value, is_active) 
VALUES ('openai', 'Default OpenAI Key', 'sk-placeholder-key', false);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all operations on api_keys" ON api_keys
FOR ALL USING (true);

-- Create indexes
CREATE INDEX idx_api_keys_provider ON api_keys(provider);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
