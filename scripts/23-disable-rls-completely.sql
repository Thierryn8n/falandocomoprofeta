-- Disable RLS on conversations table
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- Test insert without RLS
DO $$
DECLARE
    test_user_id uuid;
    test_conversation_id uuid;
    test_messages jsonb;
BEGIN
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        test_conversation_id := gen_random_uuid();
        test_messages := '[{"role": "user", "content": "Test without RLS", "timestamp": "2024-01-21T10:00:00.000Z"}]'::jsonb;
        
        INSERT INTO conversations (id, user_id, title, messages)
        VALUES (test_conversation_id, test_user_id, 'Test No RLS', test_messages);
        
        -- Clean up
        DELETE FROM conversations WHERE id = test_conversation_id;
    END IF;
END;

-- Show current table status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM conversations) as total_conversations
FROM pg_tables 
WHERE tablename = 'conversations';
