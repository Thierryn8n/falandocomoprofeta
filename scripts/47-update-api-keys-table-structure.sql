-- Criar ou atualizar tabela api_keys com estrutura correta
DROP TABLE IF EXISTS api_keys CASCADE;

CREATE TABLE api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    key_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir chave do Gemini (substitua pela sua chave válida)
INSERT INTO api_keys (provider, key_name, key_value, is_active) VALUES
('gemini', 'Gemini API Key', 'SUA_CHAVE_GEMINI_AQUI', true);

-- Inserir chave do xAI (se tiver)
INSERT INTO api_keys (provider, key_name, key_value, is_active) VALUES
('xai', 'xAI API Key', 'SUA_CHAVE_XAI_AQUI', true);

-- Criar índices para performance
CREATE INDEX idx_api_keys_provider ON api_keys(provider);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- Verificar dados inseridos
SELECT * FROM api_keys ORDER BY created_at DESC;

DO $$
BEGIN
    RAISE NOTICE '✅ Tabela api_keys criada com sucesso!';
    RAISE NOTICE '⚠️  IMPORTANTE: Substitua SUA_CHAVE_GEMINI_AQUI pela sua chave válida do Google AI Studio';
    RAISE NOTICE '🔗 Obtenha uma nova chave em: https://aistudio.google.com/app/apikey';
END $$;
