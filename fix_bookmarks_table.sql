-- CORREÇÃO: Criar/Atualizar tabela de bookmarks com políticas RLS corretas

-- 1. Atualizar referência da FK para auth.users (se necessário)
ALTER TABLE user_bookmarks DROP CONSTRAINT IF EXISTS user_bookmarks_user_id_fkey;
ALTER TABLE user_bookmarks 
  ADD CONSTRAINT user_bookmarks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Habilitar RLS
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas
DROP POLICY IF EXISTS "Users can only see their own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON user_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON user_bookmarks;

-- 4. Criar políticas RLS corretas

-- Política para SELECT (ler)
CREATE POLICY "Users can select their own bookmarks"
  ON user_bookmarks
  FOR SELECT
  USING (user_id = auth.uid());

-- Política para INSERT (criar)
CREATE POLICY "Users can insert their own bookmarks"
  ON user_bookmarks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política para UPDATE (atualizar)
CREATE POLICY "Users can update their own bookmarks"
  ON user_bookmarks
  FOR UPDATE
  USING (user_id = auth.uid());

-- Política para DELETE (deletar)
CREATE POLICY "Users can delete their own bookmarks"
  ON user_bookmarks
  FOR DELETE
  USING (user_id = auth.uid());

-- 5. Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_bookmarks';
