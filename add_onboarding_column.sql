-- Adicionar coluna onboarding_completed na tabela profiles
-- Execute este comando no SQL Editor do Supabase

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Comentário da coluna
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica se o usuário completou o onboarding inicial do app';

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed) 
WHERE onboarding_completed = FALSE;

-- Atualizar usuários existentes para ter onboarding_completed = true
-- (assumindo que usuários existentes já viram o onboarding)
UPDATE public.profiles 
SET onboarding_completed = TRUE 
WHERE onboarding_completed IS NULL;
