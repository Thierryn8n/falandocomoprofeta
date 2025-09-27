-- Atualizar bucket attachments para aceitar arquivos de áudio
-- Problema: O bucket estava configurado apenas para imagens, mas precisamos de áudio também

-- Atualizar o bucket para aceitar imagens e áudio
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/*', 'audio/*', 'audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg']
WHERE id = 'attachments';

-- Verificar se a atualização foi bem-sucedida
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'attachments';

-- Atualizar a função ensure_attachments_bucket para incluir tipos de áudio
CREATE OR REPLACE FUNCTION ensure_attachments_bucket()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir/atualizar bucket com suporte a imagens e áudio
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('attachments', 'attachments', true, 10485760, ARRAY['image/*', 'audio/*', 'audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg'])
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/*', 'audio/*', 'audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg'];
  
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
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to manage attachments'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated users to manage attachments" ON storage.objects FOR ALL TO authenticated USING (bucket_id = ''attachments'') WITH CHECK (bucket_id = ''attachments'')';
  END IF;
END;
$$;

-- Executar a função atualizada
SELECT ensure_attachments_bucket();

-- Mostrar configuração final
SELECT 
  'Bucket attachments configurado com sucesso!' as status,
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'attachments';