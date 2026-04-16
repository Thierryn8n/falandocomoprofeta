-- Script para adicionar campos de termos e cookies à tabela profiles
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas para Termos de Uso
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(10);

-- Adicionar colunas para Cookies (LGPD)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cookie_consent JSONB,
ADD COLUMN IF NOT EXISTS cookie_consent_at TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Data e hora que o usuário aceitou os Termos de Uso';
COMMENT ON COLUMN profiles.terms_version IS 'Versão dos Termos aceita pelo usuário';
COMMENT ON COLUMN profiles.cookie_consent IS 'Objeto JSON com preferências de cookies (essential, analytics, marketing)';
COMMENT ON COLUMN profiles.cookie_consent_at IS 'Data e hora da última atualização do consentimento de cookies';

-- Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('terms_accepted_at', 'terms_version', 'cookie_consent', 'cookie_consent_at')
ORDER BY ordinal_position;
