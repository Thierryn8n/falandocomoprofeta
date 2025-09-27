-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own attachments" ON message_attachments;
DROP POLICY IF EXISTS "Users can insert their own attachments" ON message_attachments;

-- Criar políticas mais permissivas para teste
CREATE POLICY "Allow all operations for authenticated users" ON message_attachments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Ou se quiser manter a segurança, criar políticas mais específicas
-- CREATE POLICY "Users can view their own attachments" ON message_attachments 
-- FOR SELECT 
-- TO authenticated 
-- USING (
--   EXISTS (
--     SELECT 1 FROM messages m
--     JOIN conversations c ON m.conversation_id = c.id
--     WHERE m.id = message_attachments.message_id 
--     AND c.user_id = auth.uid()
--   )
-- );

-- CREATE POLICY "Users can insert their own attachments" ON message_attachments 
-- FOR INSERT 
-- TO authenticated 
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM messages m
--     JOIN conversations c ON m.conversation_id = c.id
--     WHERE m.id = message_attachments.message_id 
--     AND c.user_id = auth.uid()
--   )
-- );