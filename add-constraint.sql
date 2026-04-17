-- Adicionar constraint UNIQUE na tabela user_question_limits
ALTER TABLE user_question_limits 
ADD CONSTRAINT unique_user_daily_limit 
UNIQUE (user_id, limit_date);

-- Verificar se a constraint foi criada
SELECT conname, condefinition 
FROM pg_constraint 
WHERE conrelid = 'user_question_limits'::regclass;
