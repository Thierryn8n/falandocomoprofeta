-- Criar tabela de versículos salvos/favoritos
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_name TEXT NOT NULL,
  book_column TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar favoritos do usuário
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_book_chapter ON user_bookmarks(book_column, chapter);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_bookmarks_updated_at ON user_bookmarks;
CREATE TRIGGER update_user_bookmarks_updated_at
  BEFORE UPDATE ON user_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentário da tabela
COMMENT ON TABLE user_bookmarks IS 'Versículos salvos/favoritos dos usuários';

-- Política RLS (permitir usuário ver apenas seus próprios favoritos)
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only see their own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can only see their own bookmarks"
  ON user_bookmarks
  FOR ALL
  USING (user_id = auth.uid());
