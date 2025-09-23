-- Test manual insert with real data
DO $$
DECLARE
    test_user_id uuid;
    test_conversation_id uuid := gen_random_uuid();
    test_messages jsonb;
BEGIN
    -- Get first user from profiles
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in profiles table';
        RETURN;
    END IF;
    
    -- Create test messages
    test_messages := '[
        {
            "role": "user",
            "content": "Olá Profeta, como está?",
            "timestamp": "2024-01-21T10:00:00.000Z"
        },
        {
            "role": "assistant", 
            "content": "Amém irmão, estou bem pela graça do Senhor!",
            "timestamp": "2024-01-21T10:00:30.000Z"
        }
    ]'::jsonb;
    
    -- Insert test conversation
    INSERT INTO conversations (
        id,
        user_id,
        title,
        messages,
        created_at,
        updated_at
    ) VALUES (
        test_conversation_id,
        test_user_id,
        'Teste Manual',
        test_messages,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Test conversation inserted with ID: %', test_conversation_id;
    RAISE NOTICE 'User ID: %', test_user_id;
    
    -- Verify the insert
    IF EXISTS (SELECT 1 FROM conversations WHERE id = test_conversation_id) THEN
        RAISE NOTICE 'SUCCESS: Test conversation found in database';
    ELSE
        RAISE NOTICE 'ERROR: Test conversation not found in database';
    END IF;
    
END $$;

-- Show the test result
SELECT 
    id,
    user_id,
    title,
    jsonb_array_length(messages) as message_count,
    created_at
FROM conversations 
WHERE title = 'Teste Manual'
ORDER BY created_at DESC
LIMIT 1;
