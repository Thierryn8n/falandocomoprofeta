-- =============================================================================
-- TABELA ÚNICA DA BÍBLIA - 66 LIVROS
-- Estrutura otimizada: uma tabela com todos os versículos
-- Aceita nomes de livros em português diretamente
-- =============================================================================

-- Tabela principal da Bíblia
CREATE TABLE IF NOT EXISTS bible_verses (
    id SERIAL PRIMARY KEY,
    book VARCHAR(50) NOT NULL,  -- Nome do livro em português: 'Mateus', 'João', '1 Coríntios'
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    reference VARCHAR(100) NOT NULL,  -- Formato: 'Mateus 1:1', 'João 3:16'
    text TEXT NOT NULL,
    testament VARCHAR(10) NOT NULL CHECK (testament IN ('old', 'new')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book, chapter, verse)
);

-- Índices para busca rápida
CREATE INDEX idx_bible_book_chapter_verse ON bible_verses(book, chapter, verse);
CREATE INDEX idx_bible_book ON bible_verses(book);
CREATE INDEX idx_bible_testament ON bible_verses(testament);

-- Índice de texto completo para busca por conteúdo (PostgreSQL)
CREATE INDEX idx_bible_text_search ON bible_verses USING gin(to_tsvector('portuguese', text));

-- View simplificada - book já está em português
CREATE OR REPLACE VIEW bible_books AS
SELECT 
  book as book_name_pt,
  testament,
  CASE testament
    WHEN 'old' THEN 'Antigo Testamento'
    WHEN 'new' THEN 'Novo Testamento'
  END as testament_name,
  COUNT(*) as total_verses
FROM bible_verses
GROUP BY book, testament;

-- Função simplificada para buscar versículo específico
CREATE OR REPLACE FUNCTION get_verse(p_book VARCHAR, p_chapter INTEGER, p_verse INTEGER)
RETURNS TABLE(book VARCHAR, chapter INTEGER, verse INTEGER, reference VARCHAR, text TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bv.book,
    bv.chapter,
    bv.verse,
    bv.reference,
    bv.text
  FROM bible_verses bv
  WHERE bv.book = p_book AND bv.chapter = p_chapter AND bv.verse = p_verse;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bible_verses_updated_at 
  BEFORE UPDATE ON bible_verses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Permitir leitura pública
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bible verses are publicly readable" 
  ON bible_verses 
  FOR SELECT 
  TO PUBLIC 
  USING (true);

-- Comentários
COMMENT ON TABLE bible_verses IS 'Tabela única contendo todos os versículos da Bíblia (66 livros)';
COMMENT ON COLUMN bible_verses.book IS 'Nome do livro em português (ex: Mateus, 1 Coríntios)';
COMMENT ON COLUMN bible_verses.chapter IS 'Número do capítulo';
COMMENT ON COLUMN bible_verses.verse IS 'Número do versículo';
COMMENT ON COLUMN bible_verses.text IS 'Texto do versículo em português';
COMMENT ON COLUMN bible_verses.testament IS 'Testamento: old=Antigo, new=Novo';
