-- Test conversation insert with real data
DO $$
DECLARE
    test_user_id uuid;
    test_conversation_id uuid;
    test_messages jsonb;
BEGIN
    -- Get a user from profiles
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        test_conversation_id := gen_random_uuid();
        test_messages := '[
            {"role": "user", "content": "Olá, Profeta!", "timestamp": "2024-01-21T10:00:00.000Z"},
            {"role": "assistant", "content": "Amém, irmão/irmã. Como posso ajudá-lo?", "timestamp": "2024-01-21T10:00:05.000Z"}
        ]'::jsonb;
        
        -- Try to insert test conversation
        INSERT INTO conversations (id, user_id, title, messages, created_at, updated_at)
        VALUES (
            test_conversation_id,
            test_user_id,
            'Teste de Conversa',
            test_messages,
            NOW(),
            NOW()
        );
        
        -- Verify it was inserted
        IF EXISTS (SELECT 1 FROM conversations WHERE id = test_conversation_id) THEN
            -- Success - clean up test data
            DELETE FROM conversations WHERE id = test_conversation_id;
        END IF;
    END IF;
END $$;

-- Show current conversations
SELECT 
    id, 
    user_id, 
    title, 
    jsonb_array_length(messages) as message_count,
    created_at
FROM conversations 
ORDER BY created_at DESC 
LIMIT 5;
