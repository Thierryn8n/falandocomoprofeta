-- Corrigir políticas RLS da tabela heresy_logs

-- Primeiro, remover todas as políticas existentes
DROP POLICY IF EXISTS "Allow authenticated users to insert heresy logs" ON public.heresy_logs;
DROP POLICY IF EXISTS "Allow admins to read all heresy logs" ON public.heresy_logs;

-- Verificar se RLS está habilitado
ALTER TABLE public.heresy_logs ENABLE ROW LEVEL SECURITY;

-- Política para inserção: apenas usuários autenticados podem inserir
CREATE POLICY "heresy_logs_insert_policy" ON public.heresy_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Permite inserção para qualquer usuário autenticado

-- Política para leitura: apenas admins podem ler
CREATE POLICY "heresy_logs_select_policy" ON public.heresy_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para atualização: apenas admins podem atualizar
CREATE POLICY "heresy_logs_update_policy" ON public.heresy_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para exclusão: apenas admins podem excluir
CREATE POLICY "heresy_logs_delete_policy" ON public.heresy_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );