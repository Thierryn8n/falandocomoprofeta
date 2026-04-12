-- =============================================================================
-- TABELA BÍBLIA JSON - 66 COLUNAS JSONB (uma para cada livro)
-- Cada coluna contém array JSON com todos os versículos do livro
-- =============================================================================

CREATE TABLE IF NOT EXISTS bible_json (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) DEFAULT 'NVI',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- ANTIGO TESTAMENTO - 39 LIVROS
    -- ═══════════════════════════════════════════════════════════════════════════
    
    -- Pentateuco (5 livros)
    genesis JSONB DEFAULT '[]'::jsonb,
    exodo JSONB DEFAULT '[]'::jsonb,
    levitico JSONB DEFAULT '[]'::jsonb,
    numeros JSONB DEFAULT '[]'::jsonb,
    deuteronomio JSONB DEFAULT '[]'::jsonb,
    
    -- Livros Históricos (12 livros)
    josue JSONB DEFAULT '[]'::jsonb,
    juizes JSONB DEFAULT '[]'::jsonb,
    rute JSONB DEFAULT '[]'::jsonb,
    primeiro_samuel JSONB DEFAULT '[]'::jsonb,
    segundo_samuel JSONB DEFAULT '[]'::jsonb,
    primeiro_reis JSONB DEFAULT '[]'::jsonb,
    segundo_reis JSONB DEFAULT '[]'::jsonb,
    primeiro_cronicas JSONB DEFAULT '[]'::jsonb,
    segundo_cronicas JSONB DEFAULT '[]'::jsonb,
    esdras JSONB DEFAULT '[]'::jsonb,
    neemias JSONB DEFAULT '[]'::jsonb,
    ester JSONB DEFAULT '[]'::jsonb,
    
    -- Livros Poéticos (5 livros)
    jo JSONB DEFAULT '[]'::jsonb,
    salmos JSONB DEFAULT '[]'::jsonb,
    proverbios JSONB DEFAULT '[]'::jsonb,
    eclesiastes JSONB DEFAULT '[]'::jsonb,
    cantares JSONB DEFAULT '[]'::jsonb,
    
    -- Profetas Maiores (5 livros)
    isaias JSONB DEFAULT '[]'::jsonb,
    jeremias JSONB DEFAULT '[]'::jsonb,
    lamentacoes JSONB DEFAULT '[]'::jsonb,
    ezequiel JSONB DEFAULT '[]'::jsonb,
    daniel JSONB DEFAULT '[]'::jsonb,
    
    -- Profetas Menores (12 livros)
    oseias JSONB DEFAULT '[]'::jsonb,
    joel JSONB DEFAULT '[]'::jsonb,
    amos JSONB DEFAULT '[]'::jsonb,
    obadias JSONB DEFAULT '[]'::jsonb,
    jonas JSONB DEFAULT '[]'::jsonb,
    miqueias JSONB DEFAULT '[]'::jsonb,
    naum JSONB DEFAULT '[]'::jsonb,
    habacuque JSONB DEFAULT '[]'::jsonb,
    sofonias JSONB DEFAULT '[]'::jsonb,
    ageu JSONB DEFAULT '[]'::jsonb,
    zacarias JSONB DEFAULT '[]'::jsonb,
    malaquias JSONB DEFAULT '[]'::jsonb,
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- NOVO TESTAMENTO - 27 LIVROS
    -- ═══════════════════════════════════════════════════════════════════════════
    
    -- Evangelhos (4 livros)
    mateus JSONB DEFAULT '[]'::jsonb,
    marcos JSONB DEFAULT '[]'::jsonb,
    lucas JSONB DEFAULT '[]'::jsonb,
    joao JSONB DEFAULT '[]'::jsonb,
    
    -- História (1 livro)
    atos JSONB DEFAULT '[]'::jsonb,
    
    -- Epístolas Paulinas (13 livros)
    romanos JSONB DEFAULT '[]'::jsonb,
    primeiro_corintios JSONB DEFAULT '[]'::jsonb,
    segundo_corintios JSONB DEFAULT '[]'::jsonb,
    galatas JSONB DEFAULT '[]'::jsonb,
    efesios JSONB DEFAULT '[]'::jsonb,
    filipenses JSONB DEFAULT '[]'::jsonb,
    colossenses JSONB DEFAULT '[]'::jsonb,
    primeiro_tessalonicenses JSONB DEFAULT '[]'::jsonb,
    segundo_tessalonicenses JSONB DEFAULT '[]'::jsonb,
    primeiro_timoteo JSONB DEFAULT '[]'::jsonb,
    segundo_timoteo JSONB DEFAULT '[]'::jsonb,
    tito JSONB DEFAULT '[]'::jsonb,
    filemom JSONB DEFAULT '[]'::jsonb,
    
    -- Epístolas Gerais (8 livros)
    hebreus JSONB DEFAULT '[]'::jsonb,
    tiago JSONB DEFAULT '[]'::jsonb,
    primeiro_pedro JSONB DEFAULT '[]'::jsonb,
    segundo_pedro JSONB DEFAULT '[]'::jsonb,
    primeiro_joao JSONB DEFAULT '[]'::jsonb,
    segundo_joao JSONB DEFAULT '[]'::jsonb,
    terceiro_joao JSONB DEFAULT '[]'::jsonb,
    judas JSONB DEFAULT '[]'::jsonb,
    
    -- Profético (1 livro)
    apocalipse JSONB DEFAULT '[]'::jsonb
);

-- Criar índices GIN para busca rápida em JSONB
CREATE INDEX idx_bible_genesis ON bible_json USING gin(genesis jsonb_path_ops);
CREATE INDEX idx_bible_exodo ON bible_json USING gin(exodo jsonb_path_ops);
CREATE INDEX idx_bible_levitico ON bible_json USING gin(levitico jsonb_path_ops);
CREATE INDEX idx_bible_numeros ON bible_json USING gin(numeros jsonb_path_ops);
CREATE INDEX idx_bible_deuteronomio ON bible_json USING gin(deuteronomio jsonb_path_ops);
CREATE INDEX idx_bible_salmos ON bible_json USING gin(salmos jsonb_path_ops);
CREATE INDEX idx_bible_isaias ON bible_json USING gin(isaias jsonb_path_ops);
CREATE INDEX idx_bible_jeremias ON bible_json USING gin(jeremias jsonb_path_ops);
CREATE INDEX idx_bible_mateus ON bible_json USING gin(mateus jsonb_path_ops);
CREATE INDEX idx_bible_marcos ON bible_json USING gin(marcos jsonb_path_ops);
CREATE INDEX idx_bible_lucas ON bible_json USING gin(lucas jsonb_path_ops);
CREATE INDEX idx_bible_joao ON bible_json USING gin(joao jsonb_path_ops);
CREATE INDEX idx_bible_atos ON bible_json USING gin(atos jsonb_path_ops);
CREATE INDEX idx_bible_romanos ON bible_json USING gin(romanos jsonb_path_ops);
CREATE INDEX idx_bible_hebreus ON bible_json USING gin(hebreus jsonb_path_ops);
CREATE INDEX idx_bible_apocalipse ON bible_json USING gin(apocalipse jsonb_path_ops);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_bible_json_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bible_json_timestamp
    BEFORE UPDATE ON bible_json
    FOR EACH ROW
    EXECUTE FUNCTION update_bible_json_timestamp();

-- Inserir registro inicial (você preencherá manualmente os JSONs)
INSERT INTO bible_json (version) VALUES ('NVI')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÕES AUXILIARES PARA CONSULTA
-- ═══════════════════════════════════════════════════════════════════════════

-- Função para buscar versículo específico de um livro
CREATE OR REPLACE FUNCTION get_verse_from_book(book_name TEXT, chapter_num INT, verse_num INT)
RETURNS TABLE(verse JSONB) AS $$
DECLARE
    column_name TEXT;
    query TEXT;
BEGIN
    -- Mapear nomes para colunas
    column_name := CASE LOWER(REPLACE(REPLACE(book_name, ' ', ''), 'º', ''))
        -- Antigo Testamento
        WHEN 'genesis' THEN 'genesis'
        WHEN 'exodo', 'êxodo' THEN 'exodo'
        WHEN 'levitico', 'levítico' THEN 'levitico'
        WHEN 'numeros', 'números' THEN 'numeros'
        WHEN 'deuteronomio', 'deuteronômio' THEN 'deuteronomio'
        WHEN 'josue', 'josué' THEN 'josue'
        WHEN 'juizes', 'juízes' THEN 'juizes'
        WHEN 'rute' THEN 'rute'
        WHEN '1samuel', 'isamuel', 'primeirosamuel', '1sam' THEN 'primeiro_samuel'
        WHEN '2samuel', 'iisamuel', 'segundosamuel', '2sam' THEN 'segundo_samuel'
        WHEN '1reis', 'ireis', 'primeiroreis' THEN 'primeiro_reis'
        WHEN '2reis', 'iireis', 'segundoreis' THEN 'segundo_reis'
        WHEN '1cronicas', 'icronicas', '1cr', 'primeirocronicas' THEN 'primeiro_cronicas'
        WHEN '2cronicas', 'iicronicas', '2cr', 'segundocronicas' THEN 'segundo_cronicas'
        WHEN 'esdras' THEN 'esdras'
        WHEN 'neemias' THEN 'neemias'
        WHEN 'ester' THEN 'ester'
        WHEN 'jo', 'job' THEN 'jo'
        WHEN 'salmos', 'salmo', 'sl', 'ps' THEN 'salmos'
        WHEN 'proverbios', 'provérbios', 'prov' THEN 'proverbios'
        WHEN 'eclesiastes', 'ecl', 'ec' THEN 'eclesiastes'
        WHEN 'cantares', 'cant', 'ct', 'canticos' THEN 'cantares'
        WHEN 'isaias', 'isaías', 'is', 'isa' THEN 'isaias'
        WHEN 'jeremias', 'jer' THEN 'jeremias'
        WHEN 'lamentacoes', 'lamentações', 'lam', 'lm' THEN 'lamentacoes'
        WHEN 'ezequiel', 'eze', 'ez' THEN 'ezequiel'
        WHEN 'daniel', 'dan', 'dn' THEN 'daniel'
        WHEN 'oseias', 'oséias', 'os', 'ose' THEN 'oseias'
        WHEN 'joel', 'jl' THEN 'joel'
        WHEN 'amos', 'am' THEN 'amos'
        WHEN 'obadias', 'obd', 'ob' THEN 'obadias'
        WHEN 'jonas', 'jon' THEN 'jonas'
        WHEN 'miqueias', 'miq', 'mq' THEN 'miqueias'
        WHEN 'naum', 'na' THEN 'naum'
        WHEN 'habacuque', 'hab', 'hc' THEN 'habacuque'
        WHEN 'sofonias', 'sofo', 'sf' THEN 'sofonias'
        WHEN 'ageu', 'ag' THEN 'ageu'
        WHEN 'zacarias', 'zac', 'zc' THEN 'zacarias'
        WHEN 'malaquias', 'mal', 'ml' THEN 'malaquias'
        -- Novo Testamento
        WHEN 'mateus', 'mat', 'mt' THEN 'mateus'
        WHEN 'marcos', 'mar', 'mc', 'mk' THEN 'marcos'
        WHEN 'lucas', 'luc', 'lc' THEN 'lucas'
        WHEN 'joao', 'joão', 'jn', 'jo' THEN 'joao'
        WHEN 'atos', 'at', 'act' THEN 'atos'
        WHEN 'romanos', 'rom', 'rm', 'ro' THEN 'romanos'
        WHEN '1corintios', 'icorintios', '1co', '1cor', 'primeirocorintios' THEN 'primeiro_corintios'
        WHEN '2corintios', 'iicorintios', '2co', '2cor', 'segundocorintios' THEN 'segundo_corintios'
        WHEN 'galatas', 'gal', 'gl', 'ga' THEN 'galatas'
        WHEN 'efesios', 'efésios', 'ef', 'efe' THEN 'efesios'
        WHEN 'filipenses', 'filip', 'fp', 'fl' THEN 'filipenses'
        WHEN 'colossenses', 'col', 'cl', 'co' THEN 'colossenses'
        WHEN '1tessalonicenses', 'itessalonicenses', '1tes', '1ts', 'primeirotessalonicenses' THEN 'primeiro_tessalonicenses'
        WHEN '2tessalonicenses', 'iitessalonicenses', '2tes', '2ts', 'segundotessalonicenses' THEN 'segundo_tessalonicenses'
        WHEN '1timoteo', 'itimoteo', '1tim', '1tm', '1ti', 'primeirotimoteo' THEN 'primeiro_timoteo'
        WHEN '2timoteo', 'iitimoteo', '2tim', '2tm', '2ti', 'segundotimoteo' THEN 'segundo_timoteo'
        WHEN 'tito', 'tt', 'ti' THEN 'tito'
        WHEN 'filemom', 'filem', 'flm', 'fm' THEN 'filemom'
        WHEN 'hebreus', 'heb', 'hb' THEN 'hebreus'
        WHEN 'tiago', 'tg', 'ti', 'james' THEN 'tiago'
        WHEN '1pedro', 'ipedro', '1pe', '1pd', 'primeiropedro' THEN 'primeiro_pedro'
        WHEN '2pedro', 'iipedro', '2pe', '2pd', 'segundopedro' THEN 'segundo_pedro'
        WHEN '1joao', 'ijoao', '1joão', '1jn', '3joao', 'iii joao' THEN 'terceiro_joao' -- Fix
        WHEN '1joao', 'ijoao', '1joão', '1jn', 'primeirojoao' THEN 'primeiro_joao'
        WHEN '2joao', 'iijoao', '2joão', '2jn', 'segundojoao' THEN 'segundo_joao'
        WHEN '3joao', 'iiijoao', '3joão', '3jn', 'terceirojoao' THEN 'terceiro_joao'
        WHEN 'judas', 'jud', 'jd' THEN 'judas'
        WHEN 'apocalipse', 'apoc', 'ap', 'revelacao', 'revelação', 'rv' THEN 'apocalipse'
        ELSE LOWER(REPLACE(REPLACE(book_name, ' ', '_'), 'º', ''))
    END;
    
    query := format('
        SELECT jsonb_array_elements(%I) as verse 
        FROM bible_json 
        WHERE id = 1
        AND jsonb_array_elements(%I) @> ''{"chapter": %s, "verse": %s}''::jsonb
        LIMIT 1',
        column_name, column_name, chapter_num, verse_num
    );
    
    RETURN QUERY EXECUTE query;
END;
$$ LANGUAGE plpgsql;

-- View com nomes amigáveis dos livros
CREATE OR REPLACE VIEW bible_books_columns AS
SELECT 
    'genesis' as column_name, 'Gênesis' as display_name, 'old' as testament, 1 as book_order UNION ALL
    SELECT 'exodo', 'Êxodo', 'old', 2 UNION ALL
    SELECT 'levitico', 'Levítico', 'old', 3 UNION ALL
    SELECT 'numeros', 'Números', 'old', 4 UNION ALL
    SELECT 'deuteronomio', 'Deuteronômio', 'old', 5 UNION ALL
    SELECT 'josue', 'Josué', 'old', 6 UNION ALL
    SELECT 'juizes', 'Juízes', 'old', 7 UNION ALL
    SELECT 'rute', 'Rute', 'old', 8 UNION ALL
    SELECT 'primeiro_samuel', '1º Samuel', 'old', 9 UNION ALL
    SELECT 'segundo_samuel', '2º Samuel', 'old', 10 UNION ALL
    SELECT 'primeiro_reis', '1º Reis', 'old', 11 UNION ALL
    SELECT 'segundo_reis', '2º Reis', 'old', 12 UNION ALL
    SELECT 'primeiro_cronicas', '1º Crônicas', 'old', 13 UNION ALL
    SELECT 'segundo_cronicas', '2º Crônicas', 'old', 14 UNION ALL
    SELECT 'esdras', 'Esdras', 'old', 15 UNION ALL
    SELECT 'neemias', 'Neemias', 'old', 16 UNION ALL
    SELECT 'ester', 'Ester', 'old', 17 UNION ALL
    SELECT 'jo', 'Jó', 'old', 18 UNION ALL
    SELECT 'salmos', 'Salmos', 'old', 19 UNION ALL
    SELECT 'proverbios', 'Provérbios', 'old', 20 UNION ALL
    SELECT 'eclesiastes', 'Eclesiastes', 'old', 21 UNION ALL
    SELECT 'cantares', 'Cantares', 'old', 22 UNION ALL
    SELECT 'isaias', 'Isaías', 'old', 23 UNION ALL
    SELECT 'jeremias', 'Jeremias', 'old', 24 UNION ALL
    SELECT 'lamentacoes', 'Lamentações', 'old', 25 UNION ALL
    SELECT 'ezequiel', 'Ezequiel', 'old', 26 UNION ALL
    SELECT 'daniel', 'Daniel', 'old', 27 UNION ALL
    SELECT 'oseias', 'Oséias', 'old', 28 UNION ALL
    SELECT 'joel', 'Joel', 'old', 29 UNION ALL
    SELECT 'amos', 'Amós', 'old', 30 UNION ALL
    SELECT 'obadias', 'Obadias', 'old', 31 UNION ALL
    SELECT 'jonas', 'Jonas', 'old', 32 UNION ALL
    SELECT 'miqueias', 'Miquéias', 'old', 33 UNION ALL
    SELECT 'naum', 'Naum', 'old', 34 UNION ALL
    SELECT 'habacuque', 'Habacuque', 'old', 35 UNION ALL
    SELECT 'sofonias', 'Sofonias', 'old', 36 UNION ALL
    SELECT 'ageu', 'Ageu', 'old', 37 UNION ALL
    SELECT 'zacarias', 'Zacarias', 'old', 38 UNION ALL
    SELECT 'malaquias', 'Malaquias', 'old', 39 UNION ALL
    SELECT 'mateus', 'Mateus', 'new', 40 UNION ALL
    SELECT 'marcos', 'Marcos', 'new', 41 UNION ALL
    SELECT 'lucas', 'Lucas', 'new', 42 UNION ALL
    SELECT 'joao', 'João', 'new', 43 UNION ALL
    SELECT 'atos', 'Atos', 'new', 44 UNION ALL
    SELECT 'romanos', 'Romanos', 'new', 45 UNION ALL
    SELECT 'primeiro_corintios', '1º Coríntios', 'new', 46 UNION ALL
    SELECT 'segundo_corintios', '2º Coríntios', 'new', 47 UNION ALL
    SELECT 'galatas', 'Gálatas', 'new', 48 UNION ALL
    SELECT 'efesios', 'Efésios', 'new', 49 UNION ALL
    SELECT 'filipenses', 'Filipenses', 'new', 50 UNION ALL
    SELECT 'colossenses', 'Colossenses', 'new', 51 UNION ALL
    SELECT 'primeiro_tessalonicenses', '1º Tessalonicenses', 'new', 52 UNION ALL
    SELECT 'segundo_tessalonicenses', '2º Tessalonicenses', 'new', 53 UNION ALL
    SELECT 'primeiro_timoteo', '1º Timóteo', 'new', 54 UNION ALL
    SELECT 'segundo_timoteo', '2º Timóteo', 'new', 55 UNION ALL
    SELECT 'tito', 'Tito', 'new', 56 UNION ALL
    SELECT 'filemom', 'Filemom', 'new', 57 UNION ALL
    SELECT 'hebreus', 'Hebreus', 'new', 58 UNION ALL
    SELECT 'tiago', 'Tiago', 'new', 59 UNION ALL
    SELECT 'primeiro_pedro', '1º Pedro', 'new', 60 UNION ALL
    SELECT 'segundo_pedro', '2º Pedro', 'new', 61 UNION ALL
    SELECT 'primeiro_joao', '1º João', 'new', 62 UNION ALL
    SELECT 'segundo_joao', '2º João', 'new', 63 UNION ALL
    SELECT 'terceiro_joao', '3º João', 'new', 64 UNION ALL
    SELECT 'judas', 'Judas', 'new', 65 UNION ALL
    SELECT 'apocalipse', 'Apocalipse', 'new', 66;

-- RLS - Permitir leitura pública
ALTER TABLE bible_json ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bible JSON is publicly readable" 
    ON bible_json 
    FOR SELECT 
    TO PUBLIC 
    USING (true);

-- Comentários
COMMENT ON TABLE bible_json IS 'Tabela única da Bíblia com 66 colunas JSONB (uma por livro). Cada coluna contém array de versículos no formato: [{"chapter": 1, "verse": 1, "text": "..."}, ...]';
COMMENT ON COLUMN bible_json.genesis IS 'Array JSON com todos os versículos de Gênesis';
COMMENT ON COLUMN bible_json.mateus IS 'Array JSON com todos os versículos de Mateus';
COMMENT ON COLUMN bible_json.joao IS 'Array JSON com todos os versículos de João (Evangelho)';
COMMENT ON COLUMN bible_json.romanos IS 'Array JSON com todos os versículos de Romanos';
COMMENT ON COLUMN bible_json.salmos IS 'Array JSON com todos os versículos de Salmos';
COMMENT ON COLUMN bible_json.apocalipse IS 'Array JSON com todos os versículos de Apocalipse';

-- =============================================================================
-- EXEMPLO DE INSERÇÃO (PARA REFERÊNCIA)
-- =============================================================================
/*
-- Inserir dados de um livro (exemplo: João 3:16)
UPDATE bible_json 
SET joao = '[
    {"chapter": 3, "verse": 16, "text": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."},
    {"chapter": 3, "verse": 17, "text": "Porque Deus enviou o seu Filho ao mundo, não para que condenasse o mundo, mas para que o mundo fosse salvo por ele."}
]'::jsonb
WHERE id = 1;

-- Consultar versículo específico
SELECT jsonb_pretty(verse) FROM get_verse_from_book('João', 3, 16);

-- Ou consulta direta
SELECT 
    jsonb_array_elements(joao) as verse
FROM bible_json
WHERE id = 1
AND jsonb_array_elements(joao) @> '{"chapter": 3, "verse": 16}'::jsonb;
*/
