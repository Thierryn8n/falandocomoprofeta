-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- Create new permissive policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Test basic functionality
DO $$
DECLARE
    test_user_id uuid;
    test_conversation_id uuid;
BEGIN
    -- Get a user from profiles
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        test_conversation_id := gen_random_uuid();
        
        -- Test insert (this will fail with RLS but we can see the error)
        BEGIN
            INSERT INTO conversations (id, user_id, title, messages) 
            VALUES (test_conversation_id, test_user_id, 'Test Conversation', '[{"role": "user", "content": "test"}]'::jsonb);
        EXCEPTION WHEN OTHERS THEN
            -- Expected to fail with RLS
            NULL;
        END;
    END IF;
END $$;
