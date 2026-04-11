-- =============================================================================
-- CRIAÇÃO DAS TABELAS DA BÍBLIA - 66 LIVROS
-- Cada livro tem sua própria tabela com estrutura: capitulo, versiculo, texto
-- =============================================================================

-- =============================================================================
-- TABELA DE ÍNDICE DOS LIVROS (METADADOS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS bible_books (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    nome_normalizado VARCHAR(100) NOT NULL UNIQUE,
    abreviacao VARCHAR(10) NOT NULL,
    testament VARCHAR(20) NOT NULL CHECK (testament IN ('antigo', 'novo')),
    categoria VARCHAR(50) NOT NULL,
    total_capitulos INTEGER NOT NULL,
    total_versiculos INTEGER DEFAULT 0,
    ordem INTEGER NOT NULL UNIQUE,
    tabela_nome VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir metadados dos 66 livros
INSERT INTO bible_books (nome, nome_normalizado, abreviacao, testament, categoria, total_capitulos, ordem, tabela_nome) VALUES
-- ANTIGO TESTAMENTO - Pentateuco (5)
('Gênesis', 'genesis', 'Gn', 'antigo', 'pentateuco', 50, 1, 'genesis'),
('Êxodo', 'exodo', 'Ex', 'antigo', 'pentateuco', 40, 2, 'exodo'),
('Levítico', 'levitico', 'Lv', 'antigo', 'pentateuco', 27, 3, 'levitico'),
('Números', 'numeros', 'Nm', 'antigo', 'pentateuco', 36, 4, 'numeros'),
('Deuteronômio', 'deuteronomio', 'Dt', 'antigo', 'pentateuco', 34, 5, 'deuteronomio'),
-- Históricos (12)
('Josué', 'josue', 'Js', 'antigo', 'historicos', 24, 6, 'josue'),
('Juízes', 'juizes', 'Jz', 'antigo', 'historicos', 21, 7, 'juizes'),
('Rute', 'rute', 'Rt', 'antigo', 'historicos', 4, 8, 'rute'),
('1º Samuel', '1samuel', '1Sm', 'antigo', 'historicos', 31, 9, 'samuel_1'),
('2º Samuel', '2samuel', '2Sm', 'antigo', 'historicos', 24, 10, 'samuel_2'),
('1º Reis', '1reis', '1Rs', 'antigo', 'historicos', 22, 11, 'reis_1'),
('2º Reis', '2reis', '2Rs', 'antigo', 'historicos', 25, 12, 'reis_2'),
('1º Crônicas', '1cronicas', '1Cr', 'antigo', 'historicos', 29, 13, 'cronicas_1'),
('2º Crônicas', '2cronicas', '2Cr', 'antigo', 'historicos', 36, 14, 'cronicas_2'),
('Esdras', 'esdras', 'Ed', 'antigo', 'historicos', 10, 15, 'esdras'),
('Neemias', 'neemias', 'Ne', 'antigo', 'historicos', 13, 16, 'neemias'),
('Ester', 'ester', 'Et', 'antigo', 'historicos', 10, 17, 'ester'),
-- Poéticos (5)
('Jó', 'jo', 'Jó', 'antigo', 'poeticos', 42, 18, 'jo'),
('Salmos', 'salmos', 'Sl', 'antigo', 'poeticos', 150, 19, 'salmos'),
('Provérbios', 'proverbios', 'Pv', 'antigo', 'poeticos', 31, 20, 'proverbios'),
('Eclesiastes', 'eclesiastes', 'Ec', 'antigo', 'poeticos', 12, 21, 'eclesiastes'),
('Cantares', 'cantares', 'Ct', 'antigo', 'poeticos', 8, 22, 'cantares'),
-- Profetas Maiores (5)
('Isaías', 'isaias', 'Is', 'antigo', 'profetas_maiores', 66, 23, 'isaias'),
('Jeremias', 'jeremias', 'Jr', 'antigo', 'profetas_maiores', 52, 24, 'jeremias'),
('Lamentações', 'lamentacoes', 'Lm', 'antigo', 'profetas_maiores', 5, 25, 'lamentacoes'),
('Ezequiel', 'ezequiel', 'Ez', 'antigo', 'profetas_maiores', 48, 26, 'ezequiel'),
('Daniel', 'daniel', 'Dn', 'antigo', 'profetas_maiores', 12, 27, 'daniel'),
-- Profetas Menores (12)
('Oséias', 'oseias', 'Os', 'antigo', 'profetas_menores', 14, 28, 'oseias'),
('Joel', 'joel', 'Jl', 'antigo', 'profetas_menores', 3, 29, 'joel'),
('Amós', 'amos', 'Am', 'antigo', 'profetas_menores', 9, 30, 'amos'),
('Obadias', 'obadias', 'Ob', 'antigo', 'profetas_menores', 1, 31, 'obadias'),
('Jonas', 'jonas', 'Jn', 'antigo', 'profetas_menores', 4, 32, 'jonas'),
('Miquéias', 'miqueias', 'Mq', 'antigo', 'profetas_menores', 7, 33, 'miqueias'),
('Naum', 'naum', 'Na', 'antigo', 'profetas_menores', 3, 34, 'naum'),
('Habacuque', 'habacuque', 'Hc', 'antigo', 'profetas_menores', 3, 35, 'habacuque'),
('Sofonias', 'sofonias', 'Sf', 'antigo', 'profetas_menores', 3, 36, 'sofonias'),
('Ageu', 'ageu', 'Ag', 'antigo', 'profetas_menores', 2, 37, 'ageu'),
('Zacarias', 'zacarias', 'Zc', 'antigo', 'profetas_menores', 14, 38, 'zacarias'),
('Malaquias', 'malaquias', 'Ml', 'antigo', 'profetas_menores', 4, 39, 'malaquias'),
-- NOVO TESTAMENTO - Evangelhos (4)
('Mateus', 'mateus', 'Mt', 'novo', 'evangelhos', 28, 40, 'mateus'),
('Marcos', 'marcos', 'Mc', 'novo', 'evangelhos', 16, 41, 'marcos'),
('Lucas', 'lucas', 'Lc', 'novo', 'evangelhos', 24, 42, 'lucas'),
('João', 'joao', 'Jo', 'novo', 'evangelhos', 21, 43, 'joao'),
-- História (1)
('Atos', 'atos', 'At', 'novo', 'historia', 28, 44, 'atos'),
-- Epístolas Paulinas (13)
('Romanos', 'romanos', 'Rm', 'novo', 'epistolas_paulinas', 16, 45, 'romanos'),
('1º Coríntios', '1corintios', '1Co', 'novo', 'epistolas_paulinas', 16, 46, 'corintios_1'),
('2º Coríntios', '2corintios', '2Co', 'novo', 'epistolas_paulinas', 13, 47, 'corintios_2'),
('Gálatas', 'galatas', 'Gl', 'novo', 'epistolas_paulinas', 6, 48, 'galatas'),
('Efésios', 'efesios', 'Ef', 'novo', 'epistolas_paulinas', 6, 49, 'efesios'),
('Filipenses', 'filipenses', 'Fp', 'novo', 'epistolas_paulinas', 4, 50, 'filipenses'),
('Colossenses', 'colossenses', 'Cl', 'novo', 'epistolas_paulinas', 4, 51, 'colossenses'),
('1º Tessalonicenses', '1tessalonicenses', '1Ts', 'novo', 'epistolas_paulinas', 5, 52, 'tessalonicenses_1'),
('2º Tessalonicenses', '2tessalonicenses', '2Ts', 'novo', 'epistolas_paulinas', 3, 53, 'tessalonicenses_2'),
('1º Timóteo', '1timoteo', '1Tm', 'novo', 'epistolas_paulinas', 6, 54, 'timoteo_1'),
('2º Timóteo', '2timoteo', '2Tm', 'novo', 'epistolas_paulinas', 4, 55, 'timoteo_2'),
('Tito', 'tito', 'Tt', 'novo', 'epistolas_paulinas', 3, 56, 'tito'),
('Filemom', 'filemom', 'Fm', 'novo', 'epistolas_paulinas', 1, 57, 'filemom'),
-- Epístolas Gerais (8)
('Hebreus', 'hebreus', 'Hb', 'novo', 'epistolas_gerais', 13, 58, 'hebreus'),
('Tiago', 'tiago', 'Tg', 'novo', 'epistolas_gerais', 5, 59, 'tiago'),
('1º Pedro', '1pedro', '1Pe', 'novo', 'epistolas_gerais', 5, 60, 'pedro_1'),
('2º Pedro', '2pedro', '2Pe', 'novo', 'epistolas_gerais', 3, 61, 'pedro_2'),
('1º João', '1joao', '1Jo', 'novo', 'epistolas_gerais', 5, 62, 'joao_1'),
('2º João', '2joao', '2Jo', 'novo', 'epistolas_gerais', 1, 63, 'joao_2'),
('3º João', '3joao', '3Jo', 'novo', 'epistolas_gerais', 1, 64, 'joao_3'),
('Judas', 'judas', 'Jd', 'novo', 'epistolas_gerais', 1, 65, 'judas'),
-- Profético (1)
('Apocalipse', 'apocalipse', 'Ap', 'novo', 'profetico', 22, 66, 'apocalipse');

-- =============================================================================
-- FUNÇÃO PARA CRIAR TABELAS DINAMICAMENTE
-- =============================================================================
CREATE OR REPLACE FUNCTION create_bible_book_table(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id SERIAL PRIMARY KEY,
            capitulo INTEGER NOT NULL,
            versiculo INTEGER NOT NULL,
            texto TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(capitulo, versiculo)
        );
        
        CREATE INDEX IF NOT EXISTS %I ON %I(capitulo, versiculo);
        
        ALTER TABLE %I ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Leitura pública de %I" ON %I FOR SELECT TO PUBLIC USING (true);
    ', table_name, 
       'idx_' || table_name || '_cap_vers',
       table_name,
       table_name,
       table_name,
       table_name);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CRIAR TODAS AS 66 TABELAS DOS LIVROS
-- =============================================================================
DO $$
DECLARE
    book_record RECORD;
BEGIN
    FOR book_record IN SELECT tabela_nome FROM bible_books ORDER BY ordem LOOP
        PERFORM create_bible_book_table(book_record.tabela_nome);
    END LOOP;
END $$;

-- =============================================================================
-- VIEW PARA BUSCAR VERSÍCULOS EM TODAS AS TABELAS
-- =============================================================================
CREATE OR REPLACE VIEW bible_all_verses AS
SELECT 'genesis' as livro, 1 as livro_id, capitulo, versiculo, texto FROM genesis
UNION ALL SELECT 'exodo', 2, capitulo, versiculo, texto FROM exodo
UNION ALL SELECT 'levitico', 3, capitulo, versiculo, texto FROM levitico
UNION ALL SELECT 'numeros', 4, capitulo, versiculo, texto FROM numeros
UNION ALL SELECT 'deuteronomio', 5, capitulo, versiculo, texto FROM deuteronomio
UNION ALL SELECT 'josue', 6, capitulo, versiculo, texto FROM josue
UNION ALL SELECT 'juizes', 7, capitulo, versiculo, texto FROM juizes
UNION ALL SELECT 'rute', 8, capitulo, versiculo, texto FROM rute
UNION ALL SELECT 'samuel_1', 9, capitulo, versiculo, texto FROM samuel_1
UNION ALL SELECT 'samuel_2', 10, capitulo, versiculo, texto FROM samuel_2
UNION ALL SELECT 'reis_1', 11, capitulo, versiculo, texto FROM reis_1
UNION ALL SELECT 'reis_2', 12, capitulo, versiculo, texto FROM reis_2
UNION ALL SELECT 'cronicas_1', 13, capitulo, versiculo, texto FROM cronicas_1
UNION ALL SELECT 'cronicas_2', 14, capitulo, versiculo, texto FROM cronicas_2
UNION ALL SELECT 'esdras', 15, capitulo, versiculo, texto FROM esdras
UNION ALL SELECT 'neemias', 16, capitulo, versiculo, texto FROM neemias
UNION ALL SELECT 'ester', 17, capitulo, versiculo, texto FROM ester
UNION ALL SELECT 'jo', 18, capitulo, versiculo, texto FROM jo
UNION ALL SELECT 'salmos', 19, capitulo, versiculo, texto FROM salmos
UNION ALL SELECT 'proverbios', 20, capitulo, versiculo, texto FROM proverbios
UNION ALL SELECT 'eclesiastes', 21, capitulo, versiculo, texto FROM eclesiastes
UNION ALL SELECT 'cantares', 22, capitulo, versiculo, texto FROM cantares
UNION ALL SELECT 'isaias', 23, capitulo, versiculo, texto FROM isaias
UNION ALL SELECT 'jeremias', 24, capitulo, versiculo, texto FROM jeremias
UNION ALL SELECT 'lamentacoes', 25, capitulo, versiculo, texto FROM lamentacoes
UNION ALL SELECT 'ezequiel', 26, capitulo, versiculo, texto FROM ezequiel
UNION ALL SELECT 'daniel', 27, capitulo, versiculo, texto FROM daniel
UNION ALL SELECT 'oseias', 28, capitulo, versiculo, texto FROM oseias
UNION ALL SELECT 'joel', 29, capitulo, versiculo, texto FROM joel
UNION ALL SELECT 'amos', 30, capitulo, versiculo, texto FROM amos
UNION ALL SELECT 'obadias', 31, capitulo, versiculo, texto FROM obadias
UNION ALL SELECT 'jonas', 32, capitulo, versiculo, texto FROM jonas
UNION ALL SELECT 'miqueias', 33, capitulo, versiculo, texto FROM miqueias
UNION ALL SELECT 'naum', 34, capitulo, versiculo, texto FROM naum
UNION ALL SELECT 'habacuque', 35, capitulo, versiculo, texto FROM habacuque
UNION ALL SELECT 'sofonias', 36, capitulo, versiculo, texto FROM sofonias
UNION ALL SELECT 'ageu', 37, capitulo, versiculo, texto FROM ageu
UNION ALL SELECT 'zacarias', 38, capitulo, versiculo, texto FROM zacarias
UNION ALL SELECT 'malaquias', 39, capitulo, versiculo, texto FROM malaquias
UNION ALL SELECT 'mateus', 40, capitulo, versiculo, texto FROM mateus
UNION ALL SELECT 'marcos', 41, capitulo, versiculo, texto FROM marcos
UNION ALL SELECT 'lucas', 42, capitulo, versiculo, texto FROM lucas
UNION ALL SELECT 'joao', 43, capitulo, versiculo, texto FROM joao
UNION ALL SELECT 'atos', 44, capitulo, versiculo, texto FROM atos
UNION ALL SELECT 'romanos', 45, capitulo, versiculo, texto FROM romanos
UNION ALL SELECT 'corintios_1', 46, capitulo, versiculo, texto FROM corintios_1
UNION ALL SELECT 'corintios_2', 47, capitulo, versiculo, texto FROM corintios_2
UNION ALL SELECT 'galatas', 48, capitulo, versiculo, texto FROM galatas
UNION ALL SELECT 'efesios', 49, capitulo, versiculo, texto FROM efesios
UNION ALL SELECT 'filipenses', 50, capitulo, versiculo, texto FROM filipenses
UNION ALL SELECT 'colossenses', 51, capitulo, versiculo, texto FROM colossenses
UNION ALL SELECT 'tessalonicenses_1', 52, capitulo, versiculo, texto FROM tessalonicenses_1
UNION ALL SELECT 'tessalonicenses_2', 53, capitulo, versiculo, texto FROM tessalonicenses_2
UNION ALL SELECT 'timoteo_1', 54, capitulo, versiculo, texto FROM timoteo_1
UNION ALL SELECT 'timoteo_2', 55, capitulo, versiculo, texto FROM timoteo_2
UNION ALL SELECT 'tito', 56, capitulo, versiculo, texto FROM tito
UNION ALL SELECT 'filemom', 57, capitulo, versiculo, texto FROM filemom
UNION ALL SELECT 'hebreus', 58, capitulo, versiculo, texto FROM hebreus
UNION ALL SELECT 'tiago', 59, capitulo, versiculo, texto FROM tiago
UNION ALL SELECT 'pedro_1', 60, capitulo, versiculo, texto FROM pedro_1
UNION ALL SELECT 'pedro_2', 61, capitulo, versiculo, texto FROM pedro_2
UNION ALL SELECT 'joao_1', 62, capitulo, versiculo, texto FROM joao_1
UNION ALL SELECT 'joao_2', 63, capitulo, versiculo, texto FROM joao_2
UNION ALL SELECT 'joao_3', 64, capitulo, versiculo, texto FROM joao_3
UNION ALL SELECT 'judas', 65, capitulo, versiculo, texto FROM judas
UNION ALL SELECT 'apocalipse', 66, capitulo, versiculo, texto FROM apocalipse;

-- =============================================================================
-- FUNÇÃO PARA BUSCAR VERSÍCULO POR REFERÊNCIA
-- =============================================================================
CREATE OR REPLACE FUNCTION get_verse_by_reference(p_livro TEXT, p_capitulo INTEGER, p_versiculo INTEGER)
RETURNS TABLE (texto TEXT, livro_nome TEXT) AS $$
DECLARE
    v_table_name TEXT;
BEGIN
    -- Buscar nome da tabela pelo livro
    SELECT tabela_nome INTO v_table_name 
    FROM bible_books 
    WHERE nome_normalizado = LOWER(REPLACE(REPLACE(REPLACE(p_livro, ' ', ''), 'º', ''), '°', ''))
       OR abreviacao = UPPER(p_livro)
       OR nome = p_livro;
    
    IF v_table_name IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY EXECUTE format(
        'SELECT texto, %L as livro_nome FROM %I WHERE capitulo = %L AND versiculo = %L',
        p_livro,
        v_table_name,
        p_capitulo,
        p_versiculo
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMENTÁRIOS
-- =============================================================================
COMMENT ON TABLE bible_books IS 'Metadados dos 66 livros da Bíblia';
COMMENT ON VIEW bible_all_verses IS 'View unificada de todos os versículos da Bíblia para buscas';
