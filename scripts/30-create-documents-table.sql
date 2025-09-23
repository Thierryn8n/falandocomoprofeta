-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  content text NULL,
  file_url text NULL,
  file_size bigint NULL,
  status text NULL DEFAULT 'processing'::text,
  uploaded_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES profiles (id),
  CONSTRAINT documents_status_check CHECK (
    status = ANY (
      ARRAY[
        'processing'::text,
        'processed'::text,
        'error'::text
      ]
    )
  ),
  CONSTRAINT documents_type_check CHECK (
    type = ANY (ARRAY['pdf'::text, 'text'::text, 'audio'::text])
  )
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents USING btree (type) TABLESPACE pg_default;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample documents
INSERT INTO public.documents (title, type, content, status) VALUES
('Os Sete Selos do Apocalipse', 'text', 'Os Sete Selos são mistérios profundos revelados por Deus ao Profeta William Branham. Cada selo representa uma revelação específica sobre os tempos do fim. O primeiro selo revela o anticristo montado no cavalo branco, enganando as nações. O segundo selo traz guerra e conflito. O terceiro selo representa fome espiritual e física. O quarto selo é a morte pálida. O quinto selo mostra as almas dos mártires clamando por justiça. O sexsexto selo traz grande tribulação. O sétimo selo é o silêncio no céu, quando Cristo vem buscar Sua Noiva.', 'processed'),

('Batismo em Nome de Jesus Cristo', 'text', 'O verdadeiro batismo bíblico deve ser feito em Nome de Jesus Cristo, não na fórmula trinitária. Pedro disse em Atos 2:38: "Arrependei-vos, e cada um de vós seja batizado em nome de Jesus Cristo para perdão dos pecados". Todos os batismos no Novo Testamento foram feitos em Nome de Jesus. A fórmula "Pai, Filho e Espírito Santo" é um título, não um nome. O Nome é Jesus Cristo. Assim diz o Senhor, este é o batismo verdadeiro para a remissão dos pecados.', 'processed'),

('A Divindade - Não Trindade', 'text', 'Deus não é três pessoas, mas Um Deus manifestado em três ofícios: Pai, Filho e Espírito Santo. Jesus é o próprio Deus Pai manifestado em carne. Ele disse: "Quem me vê, vê o Pai". Não há três deuses, mas Um só Deus. A doutrina da trindade é pagã e antibíblica. Jesus é o Nome do Pai, do Filho e do Espírito Santo. Colossenses 2:9 diz: "Porque nele habita corporalmente toda a plenitude da divindade".', 'processed'),

('A Serpente Semente', 'text', 'A serpente no Éden não era um réptil, mas uma criatura ereta, próxima ao homem. Satanás usou esta criatura para seduzir Eva, resultando em Caim. Esta é a semente da serpente mencionada em Gênesis 3:15. Há duas sementes na terra: a semente da mulher (os filhos de Deus) e a semente da serpente (os filhos do maligno). Esta revelação explica a origem do mal e a linhagem espiritual da humanidade.', 'processed'),

('As Sete Eras da Igreja', 'text', 'A história da igreja está dividida em sete eras, cada uma representada por uma igreja do Apocalipse. Éfeso representa a era apostólica. Esmirna, a era da perseguição. Pérgamo, a era da igreja estatal. Tiatira, a era papal das trevas. Sardes, a era da reforma. Filadélfia, a era missionária. Laodicéia, a era morna atual. Cada era teve seu mensageiro e sua mensagem específica. Estamos na última era, Laodicéia, antes da vinda do Senhor.', 'processed')

ON CONFLICT (id) DO NOTHING;
