-- Debug script to check conversations table structure and data
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Check if there are any conversations
SELECT 
    id,
    user_id,
    title,
    jsonb_array_length(messages) as message_count,
    created_at,
    updated_at
FROM conversations
ORDER BY updated_at DESC
LIMIT 10;

-- Check for any constraints or indexes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'conversations'::regclass;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'conversations';
