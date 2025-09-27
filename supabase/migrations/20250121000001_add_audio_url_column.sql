-- Migration: Add audio_url column to conversations table
-- Created: 2025-01-21

-- Add audio_url column to store audio file URLs
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create index for better performance on audio queries
CREATE INDEX IF NOT EXISTS idx_conversations_audio_url 
ON public.conversations(audio_url) 
WHERE audio_url IS NOT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.conversations.audio_url IS 'URL of the audio file associated with this conversation';