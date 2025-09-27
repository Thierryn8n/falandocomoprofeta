-- Criar tabela para planos externos
CREATE TABLE IF NOT EXISTS external_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  currency VARCHAR(3) DEFAULT 'BRL',
  external_link TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_external_plans_status ON external_plans(status);
CREATE INDEX IF NOT EXISTS idx_external_plans_created_at ON external_plans(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_external_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS external_plans_updated_at ON external_plans;
CREATE TRIGGER external_plans_updated_at
  BEFORE UPDATE ON external_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_external_plans_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE external_plans ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos vejam planos ativos
CREATE POLICY "Anyone can view active external plans" ON external_plans
FOR SELECT USING (status = 'active');

-- Política para admins gerenciarem todos os planos
CREATE POLICY "Admins can manage external plans" ON external_plans
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Inserir alguns planos de exemplo (opcional)
INSERT INTO external_plans (name, description, price, currency, external_link, status) VALUES
('Plano Básico', 'Acesso básico às funcionalidades', 5.00, 'BRL', 'https://abacatepay.com/plan/basic', 'active'),
('Plano Premium', 'Acesso completo com recursos avançados', 19.90, 'BRL', 'https://abacatepay.com/plan/premium', 'active'),
('Plano Anual', 'Acesso completo por 12 meses com desconto', 199.00, 'BRL', 'https://abacatepay.com/plan/yearly', 'active')
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE external_plans IS 'Tabela para armazenar planos de assinatura externos do Abacate Pay';
COMMENT ON COLUMN external_plans.name IS 'Nome do plano';
COMMENT ON COLUMN external_plans.description IS 'Descrição detalhada do plano';
COMMENT ON COLUMN external_plans.price IS 'Preço do plano';
COMMENT ON COLUMN external_plans.currency IS 'Moeda do preço (padrão BRL)';
COMMENT ON COLUMN external_plans.external_link IS 'Link externo para o plano no sistema Abacate Pay';
COMMENT ON COLUMN external_plans.status IS 'Status do plano (active/inactive)';