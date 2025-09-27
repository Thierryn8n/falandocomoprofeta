-- Tabela para armazenar credenciais do Mercado Pago de forma segura
CREATE TABLE IF NOT EXISTS mercado_pago_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Credenciais criptografadas (armazenadas como JSONB para incluir IV e tag)
  public_key_encrypted JSONB,
  access_token_encrypted JSONB NOT NULL,
  client_id_encrypted JSONB,
  client_secret_encrypted JSONB,
  
  -- Metadados
  environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox', 'production')),
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mercado_pago_credentials_environment ON mercado_pago_credentials(environment);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_credentials_active ON mercado_pago_credentials(active);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_credentials_env_active ON mercado_pago_credentials(environment, active);

-- RLS (Row Level Security) - Apenas administradores podem acessar
ALTER TABLE mercado_pago_credentials ENABLE ROW LEVEL SECURITY;

-- Política para administradores
CREATE POLICY "Apenas administradores podem acessar credenciais do Mercado Pago" ON mercado_pago_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mercado_pago_credentials_updated_at 
  BEFORE UPDATE ON mercado_pago_credentials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para definir created_by automaticamente
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_mercado_pago_credentials_created_by 
  BEFORE INSERT ON mercado_pago_credentials 
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_mercado_pago_credentials_updated_by 
  BEFORE UPDATE ON mercado_pago_credentials 
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Comentários para documentação
COMMENT ON TABLE mercado_pago_credentials IS 'Armazena credenciais do Mercado Pago de forma criptografada e segura';
COMMENT ON COLUMN mercado_pago_credentials.public_key_encrypted IS 'Chave pública criptografada (JSONB com encrypted, iv, tag)';
COMMENT ON COLUMN mercado_pago_credentials.access_token_encrypted IS 'Token de acesso criptografado (JSONB com encrypted, iv, tag)';
COMMENT ON COLUMN mercado_pago_credentials.client_id_encrypted IS 'Client ID criptografado (JSONB com encrypted, iv, tag)';
COMMENT ON COLUMN mercado_pago_credentials.client_secret_encrypted IS 'Client Secret criptografado (JSONB com encrypted, iv, tag)';
COMMENT ON COLUMN mercado_pago_credentials.environment IS 'Ambiente: sandbox ou production';
COMMENT ON COLUMN mercado_pago_credentials.active IS 'Indica se as credenciais estão ativas (apenas uma por ambiente)';