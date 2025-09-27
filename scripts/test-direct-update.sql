-- Teste direto de atualização na tabela subscription_plans
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados atuais
SELECT plan_type, price, updated_at FROM public.subscription_plans WHERE plan_type = 'monthly';

-- 2. Tentar atualização simples
UPDATE public.subscription_plans 
SET price = 25.90 
WHERE plan_type = 'monthly'
RETURNING *;

-- 3. Verificar se a atualização funcionou
SELECT plan_type, price, updated_at FROM public.subscription_plans WHERE plan_type = 'monthly';

-- 4. Verificar permissões RLS (Row Level Security)
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'subscription_plans';

-- 5. Verificar políticas RLS ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'subscription_plans';

-- 6. Desabilitar RLS temporariamente para teste (se necessário)
-- ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;

-- 7. Testar novamente após desabilitar RLS
-- UPDATE public.subscription_plans 
-- SET price = 26.90 
-- WHERE plan_type = 'monthly'
-- RETURNING *;