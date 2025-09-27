-- Adicionar coluna audio_url à tabela conversations para armazenar links dos áudios
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Criar índice para melhor performance em consultas de áudio
CREATE INDEX IF NOT EXISTS idx_conversations_audio_url ON public.conversations(audio_url);

-- Mostrar estrutura atualizada da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Mostrar conversas existentes para verificar a nova coluna
SELECT 
    id,
    title,
    audio_url,
    jsonb_array_length(messages) as message_count,
    created_at
FROM public.conversations
ORDER BY updated_at DESC
LIMIT 5;