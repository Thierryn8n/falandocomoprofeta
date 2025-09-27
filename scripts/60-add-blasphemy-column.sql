-- Adicionar coluna is_blasphemy à tabela conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_blasphemy BOOLEAN DEFAULT FALSE;

-- Criar índice para melhor performance em consultas de blasfêmia
CREATE INDEX IF NOT EXISTS idx_conversations_blasphemy ON public.conversations(is_blasphemy);

-- Atualizar conversas existentes baseado na análise de mensagens
UPDATE public.conversations
SET is_blasphemy = EXISTS (
  SELECT 1
  FROM jsonb_array_elements(messages) AS msg
  WHERE (msg->>'role' = 'assistant' AND msg->>'content' LIKE '%heresia%')
     OR (msg->>'role' = 'assistant' AND msg->>'content' LIKE '%blasfêmia%')
     OR (msg->>'role' = 'assistant' AND msg->>'content' LIKE '%herética%')
);

-- Mostrar conversas atualizadas
SELECT id, title, is_blasphemy, updated_at
FROM public.conversations
WHERE is_blasphemy = true
ORDER BY updated_at DESC
LIMIT 5;