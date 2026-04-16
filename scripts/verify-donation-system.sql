-- =====================================================
-- SCRIPT DE VERIFICAÇÃO DO SISTEMA DE DOAÇÕES
-- Execute no Supabase SQL Editor para verificar
-- =====================================================

-- 1. Verificar tabelas existentes
SELECT 
    'TABELAS EXISTENTES:' as check_type,
    table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'donation_packages'
    ) as donation_packages_exists,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_donations'
    ) as user_donations_exists,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_bonus_questions'
    ) as user_bonus_questions_exists;

-- 2. Verificar colunas na user_donations
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_donations'
ORDER BY ordinal_position;

-- 3. Verificar funções existentes
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'add_questions_from_donation',
    'process_completed_donation',
    'create_donation',
    'get_pending_donations',
    'get_user_total_available_questions',
    'use_bonus_question'
)
ORDER BY routine_name;

-- 4. Verificar pacotes inseridos
SELECT 
    name,
    price,
    questions_added,
    is_active,
    display_order
FROM public.donation_packages
ORDER BY display_order;

-- 5. Verificar RLS ativado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('donation_packages', 'user_donations', 'user_bonus_questions');

-- 6. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('donation_packages', 'user_donations', 'user_bonus_questions');
