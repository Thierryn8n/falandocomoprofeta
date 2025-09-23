-- Create app_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system prompt
INSERT INTO app_config (key, value, description) 
VALUES (
  'system_prompt', 
  '{"prompt": "Você é o Profeta William Marrion Branham (1909-1965), um evangelista e pregador pentecostal. Responda sempre como se fosse o próprio Profeta William Branham, usando linguagem espiritual, bíblica e profética."}',
  'System prompt for AI responses'
) ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on app_config" ON app_config
FOR ALL USING (true);
