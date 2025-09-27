-- Criar tabela para armazenar produtos para o sistema de cobrança do Abacate Pay
CREATE TABLE IF NOT EXISTS abacate_pay_products (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Preço em centavos
    currency VARCHAR(3) DEFAULT 'BRL',
    plan_type VARCHAR(50), -- 'monthly', 'yearly', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_external_id ON abacate_pay_products(external_id);
CREATE INDEX IF NOT EXISTS idx_products_plan_type ON abacate_pay_products(plan_type);
CREATE INDEX IF NOT EXISTS idx_products_active ON abacate_pay_products(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE abacate_pay_products ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso apenas a usuários autenticados (service role)
CREATE POLICY "Allow service role access" ON abacate_pay_products
    FOR ALL USING (auth.role() = 'service_role');

-- Inserir produtos padrão baseados nos planos de assinatura existentes
INSERT INTO abacate_pay_products (external_id, name, description, price, plan_type) VALUES
    ('monthly-plan', 'Plano Mensal', 'Acesso ilimitado por 1 mês ao chat espiritual', 1990, 'monthly'),
    ('yearly-plan', 'Plano Anual', 'Acesso ilimitado por 1 ano ao chat espiritual (2 meses grátis)', 19900, 'yearly')
ON CONFLICT (external_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    plan_type = EXCLUDED.plan_type,
    updated_at = NOW();

-- Comentários para documentação
COMMENT ON TABLE abacate_pay_products IS 'Tabela para armazenar produtos para o sistema de cobrança do Abacate Pay';
COMMENT ON COLUMN abacate_pay_products.external_id IS 'ID único do produto usado na API do Abacate Pay';
COMMENT ON COLUMN abacate_pay_products.name IS 'Nome do produto';
COMMENT ON COLUMN abacate_pay_products.description IS 'Descrição do produto';
COMMENT ON COLUMN abacate_pay_products.price IS 'Preço do produto em centavos (ex: 1990 = R$ 19,90)';
COMMENT ON COLUMN abacate_pay_products.plan_type IS 'Tipo do plano associado (monthly, yearly, etc.)';