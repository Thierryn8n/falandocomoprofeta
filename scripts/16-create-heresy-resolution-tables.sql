-- Tabela para armazenar definições de heresias e suas respostas corretas
CREATE TABLE IF NOT EXISTS public.heresy_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heresy_phrase text NOT NULL,
  correct_response text NOT NULL,
  keywords text[] DEFAULT '{}'::text[],
  is_active boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS para heresy_responses
ALTER TABLE public.heresy_responses ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para heresy_responses
DROP POLICY IF EXISTS "Enable read access for all users" ON public.heresy_responses;
CREATE POLICY "Enable read access for all users" ON public.heresy_responses FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Allow admins to manage heresy responses" ON public.heresy_responses;
CREATE POLICY "Allow admins to manage heresy responses" ON public.heresy_responses
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tabela para registrar tentativas de heresias ou perguntas fora do tópico
CREATE TABLE IF NOT EXISTS public.heresy_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  user_message text NOT NULL,
  detected_heresy_id uuid REFERENCES public.heresy_responses(id) ON DELETE SET NULL,
  action_taken text NOT NULL, -- e.g., 'responded_with_predefined', 'ignored_off_topic', 'passed_to_ai'
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS para heresy_logs
ALTER TABLE public.heresy_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para heresy_logs
DROP POLICY IF EXISTS "Allow authenticated users to insert heresy logs" ON public.heresy_logs;
CREATE POLICY "Allow authenticated users to insert heresy logs" ON public.heresy_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins to read all heresy logs" ON public.heresy_logs;
CREATE POLICY "Allow admins to read all heresy logs" ON public.heresy_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Função para atualizar a coluna updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para heresy_responses
DROP TRIGGER IF EXISTS set_updated_at_heresy_responses ON public.heresy_responses;
CREATE TRIGGER set_updated_at_heresy_responses
BEFORE UPDATE ON public.heresy_responses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
