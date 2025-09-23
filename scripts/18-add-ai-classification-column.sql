-- Add ai_classification column to heresy_logs table
ALTER TABLE heresy_logs 
ADD COLUMN IF NOT EXISTS ai_classification TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_heresy_logs_ai_classification 
ON heresy_logs(ai_classification);

-- Add index for action_taken for better query performance
CREATE INDEX IF NOT EXISTS idx_heresy_logs_action_taken 
ON heresy_logs(action_taken);
