ALTER TABLE public.heresy_logs
ALTER COLUMN conversation_id DROP NOT NULL;

-- Optionally, if you also want to drop the foreign key constraint
-- ALTER TABLE public.heresy_logs
-- DROP CONSTRAINT heresy_logs_conversation_id_fkey;

-- And then re-add it as nullable if needed, but usually just dropping NOT NULL is enough
-- ALTER TABLE public.heresy_logs
-- ADD CONSTRAINT heresy_logs_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE SET NULL;
