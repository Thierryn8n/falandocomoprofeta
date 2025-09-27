-- Criar tabela para armazenar credenciais do Mercado Pago de forma segura
CREATE TABLE IF NOT EXISTS mercado_pago_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  environment VARCHAR(20) NOT NULL DEFAULT 'production', -- 'sandbox' ou 'production'
  public_key TEXT,
  access_token TEXT,
  client_id TEXT,
  client_secret TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_mercado_pago_credentials_environment ON mercado_pago_credentials(environment);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_credentials_active ON mercado_pago_credentials(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE mercado_pago_credentials ENABLE ROW LEVEL SECURITY;

-- Política para permitir apenas administradores acessarem as credenciais
CREATE POLICY "Admin only access to Mercado Pago credentials" ON mercado_pago_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mercado_pago_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o campo updated_at
CREATE TRIGGER update_mercado_pago_credentials_updated_at
  BEFORE UPDATE ON mercado_pago_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_mercado_pago_credentials_updated_at();

-- Trigger para definir created_by na inserção
CREATE OR REPLACE FUNCTION set_mercado_pago_credentials_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_mercado_pago_credentials_created_by
  BEFORE INSERT ON mercado_pago_credentials
  FOR EACH ROW
  EXECUTE FUNCTION set_mercado_pago_credentials_created_by();

-- Comentários para documentação
COMMENT ON TABLE mercado_pago_credentials IS 'Tabela para armazenar credenciais do Mercado Pago de forma segura';
COMMENT ON COLUMN mercado_pago_credentials.environment IS 'Ambiente das credenciais: sandbox ou production';
COMMENT ON COLUMN mercado_pago_credentials.public_key IS 'Chave pública do Mercado Pago';
COMMENT ON COLUMN mercado_pago_credentials.access_token IS 'Token de acesso do Mercado Pago';
COMMENT ON COLUMN mercado_pago_credentials.client_id IS 'ID do cliente do Mercado Pago';
COMMENT ON COLUMN mercado_pago_credentials.client_secret IS 'Segredo do cliente do Mercado Pago';
COMMENT ON COLUMN mercado_pago_credentials.webhook_secret IS 'Segredo para validação de webhooks';
COMMENT ON COLUMN mercado_pago_credentials.is_active IS 'Indica se as credenciais estão ativas';