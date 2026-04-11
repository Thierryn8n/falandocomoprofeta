-- =============================================================================
-- TABELA ÚNICA DA BÍBLIA - 66 LIVROS
-- Estrutura otimizada: uma tabela com todos os versículos
-- =============================================================================

-- Criar enum para os livros da Bíblia (66 livros)
CREATE TYPE bible_book AS ENUM (
  -- Antigo Testamento (39 livros)
  'genesis', 'exodo', 'levitico', 'numeros', 'deuteronomio',
  'josue', 'juizes', 'rute', '1_samuel', '2_samuel',
  '1_reis', '2_reis', '1_cronicas', '2_cronicas', 'esdras',
  'neemias', 'ester', 'jo', 'salmos', 'proverbios',
  'eclesiastes', 'cantares', 'isaias', 'jeremias', 'lamentacoes',
  'ezequiel', 'daniel', 'oseias', 'joel', 'amos',
  'obadias', 'jonas', 'miqueias', 'naum', 'habacuque',
  'sofonias', 'ageu', 'zacarias', 'malaquias',
  -- Novo Testamento (27 livros)
  'mateus', 'marcos', 'lucas', 'joao', 'atos',
  'romanos', '1_corintios', '2_corintios', 'galatas', 'efesios',
  'filipenses', 'colossenses', '1_tessalonicenses', '2_tessalonicenses',
  '1_timoteo', '2_timoteo', 'tito', 'filemom', 'hebreus',
  'tiago', '1_pedro', '2_pedro', '1_joao', '2_joao',
  '3_joao', 'judas', 'apocalipse'
);

-- Tabela principal da Bíblia
CREATE TABLE IF NOT EXISTS bible_verses (
    id SERIAL PRIMARY KEY,
    book bible_book NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
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

-- View para facilitar consultas com nomes em português
CREATE OR REPLACE VIEW bible_books AS
SELECT 
  book,
  CASE book
    -- Antigo Testamento
    WHEN 'genesis' THEN 'Gênesis'
    WHEN 'exodo' THEN 'Êxodo'
    WHEN 'levitico' THEN 'Levítico'
    WHEN 'numeros' THEN 'Números'
    WHEN 'deuteronomio' THEN 'Deuteronômio'
    WHEN 'josue' THEN 'Josué'
    WHEN 'juizes' THEN 'Juízes'
    WHEN 'rute' THEN 'Rute'
    WHEN '1_samuel' THEN '1º Samuel'
    WHEN '2_samuel' THEN '2º Samuel'
    WHEN '1_reis' THEN '1º Reis'
    WHEN '2_reis' THEN '2º Reis'
    WHEN '1_cronicas' THEN '1º Crônicas'
    WHEN '2_cronicas' THEN '2º Crônicas'
    WHEN 'esdras' THEN 'Esdras'
    WHEN 'neemias' THEN 'Neemias'
    WHEN 'ester' THEN 'Ester'
    WHEN 'jo' THEN 'Jó'
    WHEN 'salmos' THEN 'Salmos'
    WHEN 'proverbios' THEN 'Provérbios'
    WHEN 'eclesiastes' THEN 'Eclesiastes'
    WHEN 'cantares' THEN 'Cantares'
    WHEN 'isaias' THEN 'Isaías'
    WHEN 'jeremias' THEN 'Jeremias'
    WHEN 'lamentacoes' THEN 'Lamentações'
    WHEN 'ezequiel' THEN 'Ezequiel'
    WHEN 'daniel' THEN 'Daniel'
    WHEN 'oseias' THEN 'Oséias'
    WHEN 'joel' THEN 'Joel'
    WHEN 'amos' THEN 'Amós'
    WHEN 'obadias' THEN 'Obadias'
    WHEN 'jonas' THEN 'Jonas'
    WHEN 'miqueias' THEN 'Miquéias'
    WHEN 'naum' THEN 'Naum'
    WHEN 'habacuque' THEN 'Habacuque'
    WHEN 'sofonias' THEN 'Sofonias'
    WHEN 'ageu' THEN 'Ageu'
    WHEN 'zacarias' THEN 'Zacarias'
    WHEN 'malaquias' THEN 'Malaquias'
    -- Novo Testamento
    WHEN 'mateus' THEN 'Mateus'
    WHEN 'marcos' THEN 'Marcos'
    WHEN 'lucas' THEN 'Lucas'
    WHEN 'joao' THEN 'João'
    WHEN 'atos' THEN 'Atos'
    WHEN 'romanos' THEN 'Romanos'
    WHEN '1_corintios' THEN '1º Coríntios'
    WHEN '2_corintios' THEN '2º Coríntios'
    WHEN 'galatas' THEN 'Gálatas'
    WHEN 'efesios' THEN 'Efésios'
    WHEN 'filipenses' THEN 'Filipenses'
    WHEN 'colossenses' THEN 'Colossenses'
    WHEN '1_tessalonicenses' THEN '1º Tessalonicenses'
    WHEN '2_tessalonicenses' THEN '2º Tessalonicenses'
    WHEN '1_timoteo' THEN '1º Timóteo'
    WHEN '2_timoteo' THEN '2º Timóteo'
    WHEN 'tito' THEN 'Tito'
    WHEN 'filemom' THEN 'Filemom'
    WHEN 'hebreus' THEN 'Hebreus'
    WHEN 'tiago' THEN 'Tiago'
    WHEN '1_pedro' THEN '1º Pedro'
    WHEN '2_pedro' THEN '2º Pedro'
    WHEN '1_joao' THEN '1º João'
    WHEN '2_joao' THEN '2º João'
    WHEN '3_joao' THEN '3º João'
    WHEN 'judas' THEN 'Judas'
    WHEN 'apocalipse' THEN 'Apocalipse'
  END as book_name_pt,
  testament,
  CASE testament
    WHEN 'old' THEN 'Antigo Testamento'
    WHEN 'new' THEN 'Novo Testamento'
  END as testament_name
FROM (
  SELECT unnest(enum_range(NULL::bible_book)) as book
) books
JOIN bible_verses bv ON bv.book = books.book
GROUP BY book, testament;

-- Função para buscar versículo específico
CREATE OR REPLACE FUNCTION get_verse(p_book bible_book, p_chapter INTEGER, p_verse INTEGER)
RETURNS TABLE(book bible_book, book_name TEXT, chapter INTEGER, verse INTEGER, text TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bv.book,
    CASE bv.book
      WHEN 'genesis' THEN 'Gênesis'
      WHEN 'exodo' THEN 'Êxodo'
      WHEN 'levitico' THEN 'Levítico'
      WHEN 'numeros' THEN 'Números'
      WHEN 'deuteronomio' THEN 'Deuteronômio'
      WHEN 'josue' THEN 'Josué'
      WHEN 'juizes' THEN 'Juízes'
      WHEN 'rute' THEN 'Rute'
      WHEN '1_samuel' THEN '1º Samuel'
      WHEN '2_samuel' THEN '2º Samuel'
      WHEN '1_reis' THEN '1º Reis'
      WHEN '2_reis' THEN '2º Reis'
      WHEN '1_cronicas' THEN '1º Crônicas'
      WHEN '2_cronicas' THEN '2º Crônicas'
      WHEN 'esdras' THEN 'Esdras'
      WHEN 'neemias' THEN 'Neemias'
      WHEN 'ester' THEN 'Ester'
      WHEN 'jo' THEN 'Jó'
      WHEN 'salmos' THEN 'Salmos'
      WHEN 'proverbios' THEN 'Provérbios'
      WHEN 'eclesiastes' THEN 'Eclesiastes'
      WHEN 'cantares' THEN 'Cantares'
      WHEN 'isaias' THEN 'Isaías'
      WHEN 'jeremias' THEN 'Jeremias'
      WHEN 'lamentacoes' THEN 'Lamentações'
      WHEN 'ezequiel' THEN 'Ezequiel'
      WHEN 'daniel' THEN 'Daniel'
      WHEN 'oseias' THEN 'Oséias'
      WHEN 'joel' THEN 'Joel'
      WHEN 'amos' THEN 'Amós'
      WHEN 'obadias' THEN 'Obadias'
      WHEN 'jonas' THEN 'Jonas'
      WHEN 'miqueias' THEN 'Miquéias'
      WHEN 'naum' THEN 'Naum'
      WHEN 'habacuque' THEN 'Habacuque'
      WHEN 'sofonias' THEN 'Sofonias'
      WHEN 'ageu' THEN 'Ageu'
      WHEN 'zacarias' THEN 'Zacarias'
      WHEN 'malaquias' THEN 'Malaquias'
      WHEN 'mateus' THEN 'Mateus'
      WHEN 'marcos' THEN 'Marcos'
      WHEN 'lucas' THEN 'Lucas'
      WHEN 'joao' THEN 'João'
      WHEN 'atos' THEN 'Atos'
      WHEN 'romanos' THEN 'Romanos'
      WHEN '1_corintios' THEN '1º Coríntios'
      WHEN '2_corintios' THEN '2º Coríntios'
      WHEN 'galatas' THEN 'Gálatas'
      WHEN 'efesios' THEN 'Efésios'
      WHEN 'filipenses' THEN 'Filipenses'
      WHEN 'colossenses' THEN 'Colossenses'
      WHEN '1_tessalonicenses' THEN '1º Tessalonicenses'
      WHEN '2_tessalonicenses' THEN '2º Tessalonicenses'
      WHEN '1_timoteo' THEN '1º Timóteo'
      WHEN '2_timoteo' THEN '2º Timóteo'
      WHEN 'tito' THEN 'Tito'
      WHEN 'filemom' THEN 'Filemom'
      WHEN 'hebreus' THEN 'Hebreus'
      WHEN 'tiago' THEN 'Tiago'
      WHEN '1_pedro' THEN '1º Pedro'
      WHEN '2_pedro' THEN '2º Pedro'
      WHEN '1_joao' THEN '1º João'
      WHEN '2_joao' THEN '2º João'
      WHEN '3_joao' THEN '3º João'
      WHEN 'judas' THEN 'Judas'
      WHEN 'apocalipse' THEN 'Apocalipse'
    END::TEXT,
    bv.chapter,
    bv.verse,
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
COMMENT ON COLUMN bible_verses.book IS 'Livro da Bíblia (enum com 66 valores)';
COMMENT ON COLUMN bible_verses.chapter IS 'Número do capítulo';
COMMENT ON COLUMN bible_verses.verse IS 'Número do versículo';
COMMENT ON COLUMN bible_verses.text IS 'Texto do versículo em português';
COMMENT ON COLUMN bible_verses.testament IS 'Testamento: old=Antigo, new=Novo';
