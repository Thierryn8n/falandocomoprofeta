-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
ALTER TABLE user_question_limits DISABLE ROW LEVEL SECURITY;

-- Verificar se há dados na tabela
SELECT * FROM user_question_limits;

-- Testar inserção manual
INSERT INTO user_question_limits (user_id, question_count, limit_date, max_questions)
VALUES ('8c2bc427-030e-4ee2-851e-8fcc31bd2ee3', 1, CURRENT_DATE, 50)
ON CONFLICT (unique_user_daily_limit) 
DO UPDATE SET 
  question_count = user_question_limits.question_count + 1,
  updated_at = NOW();

-- Verificar se foi inserido
SELECT * FROM user_question_limits WHERE user_id = '8c2bc427-030e-4ee2-851e-8fcc31bd2ee3';
