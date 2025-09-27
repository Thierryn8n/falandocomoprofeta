-- Criação das tabelas necessárias para o sistema de assinaturas
-- Execute este script primeiro se as tabelas não existirem

-- 1. Criar tabela user_subscriptions se não existir
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Verificar se a coluna tokens_included existe na tabela subscription_plans
-- Se não existir, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'tokens_included'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.subscription_plans 
        ADD COLUMN tokens_included INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3. Atualizar planos existentes para ter tokens ilimitados (0)
UPDATE public.subscription_plans 
SET tokens_included = 0
WHERE tokens_included IS NULL OR tokens_included > 0;

-- 4. Habilitar RLS para user_subscriptions se necessário
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Criar política RLS para user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON public.user_subscriptions(current_period_end);