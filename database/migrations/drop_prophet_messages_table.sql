-- Migration: Drop prophet_messages table (already exists as documents)
-- Description: Remove the prophet_messages table since messages already exist in documents table

-- Drop the prophet_messages table if it exists
DROP TABLE IF EXISTS prophet_messages CASCADE;

-- Note: The prophet messages are already stored in the documents table
-- with titles like:
-- - 'A Serpente Semente - Mensagem 61-0318'
-- - 'Os Sete Selos - Introdução'
-- - 'Cura Divina - O Poder de Deus'
-- - 'As Sete Eras da Igreja'
-- - 'Batismo em Nome de Jesus'

-- The Bible Study API will be updated to use the documents table instead
-- of the prophet_messages table for fetching prophet's teachings
