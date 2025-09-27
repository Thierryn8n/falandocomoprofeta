-- Script para debug da tabela subscription_plans
-- Execute este script no Supabase SQL Editor para verificar o estado da tabela

-- 1. Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'subscription_plans'
);

-- 2. Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se existem dados na tabela
SELECT COUNT(*) as total_records FROM public.subscription_plans;

-- 4. Mostrar todos os dados existentes
SELECT * FROM public.subscription_plans ORDER BY created_at;

-- 5. Verificar se a função update_subscription_plans_updated_at existe
SELECT EXISTS (
   SELECT FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'update_subscription_plans_updated_at'
);

-- 6. Verificar se o trigger existe
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'subscription_plans'
AND event_object_schema = 'public';

-- 7. Testar uma atualização simples (descomente para testar)
-- UPDATE public.subscription_plans 
-- SET price = price + 0.01 
-- WHERE plan_type = 'basic'
-- RETURNING *;