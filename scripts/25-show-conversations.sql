-- Show all conversations with details
SELECT 
  c.id,
  c.user_id,
  p.email as user_email,
  c.title,
  jsonb_array_length(c.messages) as message_count,
  c.created_at,
  c.updated_at
FROM conversations c
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.updated_at DESC
LIMIT 10;

-- Show message details for latest conversation
SELECT 
  c.id,
  c.title,
  c.messages
FROM conversations c
ORDER BY c.updated_at DESC
LIMIT 1;
