-- Corrigir políticas de storage para permitir upload de logo/favicon

-- Primeiro, garantir que o bucket attachments existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/*'];

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access" ON storage.objects;

-- Criar política para permitir upload público no bucket attachments
CREATE POLICY "Allow public uploads to attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments');

-- Criar política para permitir acesso público aos arquivos
CREATE POLICY "Allow public access to attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

-- Criar política para permitir update/delete para usuários autenticados
CREATE POLICY "Allow authenticated users to manage attachments"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Criar função para garantir que o bucket existe
CREATE OR REPLACE FUNCTION ensure_attachments_bucket()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir bucket se não existir
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('attachments', 'attachments', true, 5242880, ARRAY['image/*'])
  ON CONFLICT (id) DO NOTHING;
  
  -- Garantir que as políticas existem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public uploads to attachments'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow public uploads to attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''attachments'')';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public access to attachments'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow public access to attachments" ON storage.objects FOR SELECT USING (bucket_id = ''attachments'')';
  END IF;
END;
$$;

-- Executar a função para garantir que tudo está configurado
SELECT ensure_attachments_bucket();
