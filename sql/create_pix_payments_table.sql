-- Tabela para armazenar pagamentos PIX do Mercado Pago
CREATE TABLE IF NOT EXISTS pix_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados do pagamento PIX
  payment_id VARCHAR(255) UNIQUE, -- ID do pagamento no Mercado Pago
  external_reference VARCHAR(255), -- Referência externa do pagamento
  qr_code TEXT NOT NULL, -- Código QR do PIX
  qr_code_base64 TEXT, -- QR Code em base64 para exibição
  
  -- Dados financeiros
  amount DECIMAL(10,2) NOT NULL, -- Valor do pagamento
  currency VARCHAR(3) DEFAULT 'BRL', -- Moeda (padrão BRL)
  
  -- Dados do pagamento
  description TEXT, -- Descrição do pagamento
  payer_email VARCHAR(255), -- Email do pagador
  payer_name VARCHAR(255), -- Nome do pagador
  payer_document VARCHAR(20), -- CPF/CNPJ do pagador
  
  -- Status e controle
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled, expired
  status_detail VARCHAR(100), -- Detalhes do status
  
  -- Configurações PIX
  expiration_date TIMESTAMP WITH TIME ZONE, -- Data de expiração do PIX
  expiration_minutes INTEGER DEFAULT 30, -- Minutos para expiração
  
  -- URLs de callback
  notification_url TEXT, -- URL para notificações
  success_url TEXT, -- URL de sucesso
  failure_url TEXT, -- URL de falha
  pending_url TEXT, -- URL para pendente
  
  -- Dados do Mercado Pago
  preference_id VARCHAR(255), -- ID da preferência no Mercado Pago
  collector_id BIGINT, -- ID do coletor
  operation_type VARCHAR(50), -- Tipo de operação
  
  -- Metadados
  metadata JSONB, -- Dados adicionais em JSON
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id), -- Usuário que criou
  
  -- Índices para performance
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_pix_payments_payment_id ON pix_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_external_reference ON pix_payments(external_reference);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_created_at ON pix_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_pix_payments_expiration_date ON pix_payments(expiration_date);
CREATE INDEX IF NOT EXISTS idx_pix_payments_payer_email ON pix_payments(payer_email);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pix_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pix_payments_updated_at
  BEFORE UPDATE ON pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_pix_payments_updated_at();

-- RLS (Row Level Security) para segurança
ALTER TABLE pix_payments ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios pagamentos
CREATE POLICY "Users can view their own pix payments" ON pix_payments
  FOR SELECT USING (created_by = auth.uid());

-- Política para permitir que usuários criem pagamentos
CREATE POLICY "Users can create pix payments" ON pix_payments
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Política para permitir que usuários atualizem seus próprios pagamentos
CREATE POLICY "Users can update their own pix payments" ON pix_payments
  FOR UPDATE USING (created_by = auth.uid());

-- Política para administradores verem todos os pagamentos
CREATE POLICY "Admins can view all pix payments" ON pix_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Comentários para documentação
COMMENT ON TABLE pix_payments IS 'Tabela para armazenar pagamentos PIX do Mercado Pago';
COMMENT ON COLUMN pix_payments.payment_id IS 'ID único do pagamento no Mercado Pago';
COMMENT ON COLUMN pix_payments.qr_code IS 'Código PIX para pagamento';
COMMENT ON COLUMN pix_payments.amount IS 'Valor do pagamento em reais';
COMMENT ON COLUMN pix_payments.status IS 'Status atual do pagamento';
COMMENT ON COLUMN pix_payments.expiration_date IS 'Data e hora de expiração do PIX';