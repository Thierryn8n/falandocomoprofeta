-- Debug table structure and permissions
SELECT json_build_object(
    'table_structure', (
        SELECT json_agg(json_build_object(
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable,
            'column_default', column_default
        ))
        FROM information_schema.columns 
        WHERE table_name = 'conversations'
        ORDER BY ordinal_position
    ),
    'table_permissions', (
        SELECT json_agg(json_build_object(
            'grantee', grantee,
            'privilege_type', privilege_type
        ))
        FROM information_schema.table_privileges 
        WHERE table_name = 'conversations'
    ),
    'rls_status', (
        SELECT json_agg(json_build_object(
            'schemaname', schemaname,
            'tablename', tablename,
            'rowsecurity', rowsecurity
        ))
        FROM pg_tables 
        WHERE tablename = 'conversations'
    ),
    'conversation_stats', (
        SELECT json_build_object(
            'total_conversations', COUNT(*),
            'unique_users', COUNT(DISTINCT user_id)
        )
        FROM conversations
    ),
    'profile_stats', (
        SELECT json_build_object(
            'total_profiles', COUNT(*)
        )
        FROM profiles
    )
) as debug_info;
