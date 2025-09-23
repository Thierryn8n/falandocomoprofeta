-- Criar função para criar bucket de attachments se não existir
CREATE OR REPLACE FUNCTION create_attachments_bucket_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o bucket já existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'attachments'
  ) THEN
    -- Criar o bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('attachments', 'attachments', true);
    
    -- Criar política para permitir uploads
    INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
    VALUES (
      'attachments_upload_policy',
      'attachments',
      'Allow uploads to attachments bucket',
      '(true)',
      '(true)',
      'INSERT'
    );
    
    -- Criar política para permitir leitura
    INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
    VALUES (
      'attachments_read_policy',
      'attachments',
      'Allow reading from attachments bucket',
      '(true)',
      '(true)',
      'SELECT'
    );
    
    -- Criar política para permitir updates
    INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
    VALUES (
      'attachments_update_policy',
      'attachments',
      'Allow updates to attachments bucket',
      '(true)',
      '(true)',
      'UPDATE'
    );
    
    -- Criar política para permitir deletes
    INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
    VALUES (
      'attachments_delete_policy',
      'attachments',
      'Allow deletes from attachments bucket',
      '(true)',
      '(true)',
      'DELETE'
    );
  END IF;
END;
$$;

-- Executar a função para criar o bucket
SELECT create_attachments_bucket_if_not_exists();
