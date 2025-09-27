-- Criar tabela para armazenar pagamentos PIX do Mercado Pago
CREATE TABLE IF NOT EXISTS mercado_pago_pix_payments (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  transaction_amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  status_detail VARCHAR(100),
  qr_code TEXT,
  qr_code_base64 TEXT,
  external_reference VARCHAR(255),
  date_created TIMESTAMP WITH TIME ZONE,
  date_of_expiration TIMESTAMP WITH TIME ZONE,
  date_approved TIMESTAMP WITH TIME ZONE,
  mercado_pago_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_mercado_pago_pix_payments_payment_id ON mercado_pago_pix_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_pix_payments_status ON mercado_pago_pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_pix_payments_created_at ON mercado_pago_pix_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_pix_payments_external_reference ON mercado_pago_pix_payments(external_reference);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mercado_pago_pix_payments_updated_at 
    BEFORE UPDATE ON mercado_pago_pix_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE mercado_pago_pix_payments IS 'Tabela para armazenar pagamentos PIX gerados via Mercado Pago';
COMMENT ON COLUMN mercado_pago_pix_payments.payment_id IS 'ID único do pagamento no Mercado Pago';
COMMENT ON COLUMN mercado_pago_pix_payments.transaction_amount IS 'Valor da transação em reais';
COMMENT ON COLUMN mercado_pago_pix_payments.description IS 'Descrição do pagamento';
COMMENT ON COLUMN mercado_pago_pix_payments.status IS 'Status do pagamento (pending, approved, rejected, etc.)';
COMMENT ON COLUMN mercado_pago_pix_payments.qr_code IS 'Código PIX para cópia e cola';
COMMENT ON COLUMN mercado_pago_pix_payments.qr_code_base64 IS 'QR Code em formato base64 para exibição';
COMMENT ON COLUMN mercado_pago_pix_payments.external_reference IS 'Referência externa para identificação';
COMMENT ON COLUMN mercado_pago_pix_payments.mercado_pago_data IS 'Dados completos retornados pelo Mercado Pago em formato JSON';

-- Criar tabela para armazenar pagamentos com cartão do Mercado Pago
CREATE TABLE IF NOT EXISTS mercado_pago_card_payments (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  transaction_amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  status_detail VARCHAR(100),
  payment_method_id VARCHAR(50) NOT NULL,
  payment_type_id VARCHAR(50),
  installments INTEGER DEFAULT 1,
  payer_email VARCHAR(255) NOT NULL,
  external_reference VARCHAR(255),
  date_created TIMESTAMP WITH TIME ZONE,
  date_approved TIMESTAMP WITH TIME ZONE,
  mercado_pago_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para pagamentos com cartão
CREATE INDEX IF NOT EXISTS idx_mercado_pago_card_payments_payment_id ON mercado_pago_card_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_card_payments_status ON mercado_pago_card_payments(status);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_card_payments_created_at ON mercado_pago_card_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_card_payments_external_reference ON mercado_pago_card_payments(external_reference);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_mercado_pago_card_payments_updated_at 
    BEFORE UPDATE ON mercado_pago_card_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela para armazenar pagamentos com boleto do Mercado Pago
CREATE TABLE IF NOT EXISTS mercado_pago_boleto_payments (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  transaction_amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  status_detail VARCHAR(100),
  payment_method_id VARCHAR(50) NOT NULL,
  barcode TEXT,
  external_resource_url TEXT,
  payer_email VARCHAR(255) NOT NULL,
  payer_identification VARCHAR(20),
  external_reference VARCHAR(255),
  date_created TIMESTAMP WITH TIME ZONE,
  date_of_expiration TIMESTAMP WITH TIME ZONE,
  mercado_pago_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para pagamentos com boleto
CREATE INDEX IF NOT EXISTS idx_mercado_pago_boleto_payments_payment_id ON mercado_pago_boleto_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_boleto_payments_status ON mercado_pago_boleto_payments(status);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_boleto_payments_created_at ON mercado_pago_boleto_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_boleto_payments_external_reference ON mercado_pago_boleto_payments(external_reference);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_mercado_pago_boleto_payments_updated_at 
    BEFORE UPDATE ON mercado_pago_boleto_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação das novas tabelas
COMMENT ON TABLE mercado_pago_card_payments IS 'Tabela para armazenar pagamentos com cartão gerados via Mercado Pago';
COMMENT ON TABLE mercado_pago_boleto_payments IS 'Tabela para armazenar pagamentos com boleto gerados via Mercado Pago';