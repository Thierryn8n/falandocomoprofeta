-- Criar tabela de configuração do Mercado Pago
CREATE TABLE IF NOT EXISTS mercado_pago_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  public_key TEXT,
  access_token TEXT,
  test_mode BOOLEAN DEFAULT true,
  webhook_url TEXT,
  notification_url TEXT,
  success_url TEXT,
  failure_url TEXT,
  pending_url TEXT,
  auto_return TEXT DEFAULT 'approved',
  binary_mode BOOLEAN DEFAULT false,
  statement_descriptor TEXT,
  external_reference_prefix TEXT DEFAULT 'MP_',
  expires_in INTEGER DEFAULT 30, -- minutos
  installments INTEGER DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de produtos do Mercado Pago
CREATE TABLE IF NOT EXISTS mercado_pago_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id TEXT,
  currency_id TEXT DEFAULT 'BRL',
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  picture_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de transações do Mercado Pago
CREATE TABLE IF NOT EXISTS mercado_pago_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT UNIQUE,
  preference_id TEXT,
  external_reference TEXT,
  status TEXT,
  status_detail TEXT,
  payment_type TEXT,
  payment_method_id TEXT,
  transaction_amount DECIMAL(10,2),
  currency_id TEXT DEFAULT 'BRL',
  payer_email TEXT,
  payer_id TEXT,
  collector_id TEXT,
  date_created TIMESTAMP WITH TIME ZONE,
  date_approved TIMESTAMP WITH TIME ZONE,
  date_last_updated TIMESTAMP WITH TIME ZONE,
  money_release_date TIMESTAMP WITH TIME ZONE,
  installments INTEGER,
  fee_details JSONB DEFAULT '[]',
  charges_details JSONB DEFAULT '[]',
  captured BOOLEAN DEFAULT true,
  binary_mode BOOLEAN DEFAULT false,
  live_mode BOOLEAN DEFAULT false,
  card_id TEXT,
  issuer_id TEXT,
  authorization_code TEXT,
  transaction_details JSONB DEFAULT '{}',
  additional_info JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de configuração do sistema de pagamento
CREATE TABLE IF NOT EXISTS payment_system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  active_system TEXT DEFAULT 'abacate_pay' CHECK (active_system IN ('abacate_pay', 'mercado_pago')),
  abacate_pay_enabled BOOLEAN DEFAULT true,
  mercado_pago_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão se não existir
INSERT INTO payment_system_config (active_system, abacate_pay_enabled, mercado_pago_enabled)
SELECT 'abacate_pay', true, false
WHERE NOT EXISTS (SELECT 1 FROM payment_system_config);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_payment_id ON mercado_pago_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_user_id ON mercado_pago_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_status ON mercado_pago_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_created_at ON mercado_pago_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_products_status ON mercado_pago_products(status);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_mercado_pago_config_updated_at 
    BEFORE UPDATE ON mercado_pago_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mercado_pago_products_updated_at 
    BEFORE UPDATE ON mercado_pago_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mercado_pago_transactions_updated_at 
    BEFORE UPDATE ON mercado_pago_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_system_config_updated_at 
    BEFORE UPDATE ON payment_system_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) se necessário
-- ALTER TABLE mercado_pago_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mercado_pago_products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mercado_pago_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payment_system_config ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE mercado_pago_config IS 'Configurações do Mercado Pago';
COMMENT ON TABLE mercado_pago_products IS 'Produtos/Planos do Mercado Pago';
COMMENT ON TABLE mercado_pago_transactions IS 'Transações do Mercado Pago';
COMMENT ON TABLE payment_system_config IS 'Configuração do sistema de pagamento ativo';