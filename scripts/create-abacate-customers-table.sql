-- Criar tabela para armazenar clientes do Abacate Pay
CREATE TABLE IF NOT EXISTS abacate_pay_customers (
    id SERIAL PRIMARY KEY,
    abacate_customer_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    cellphone VARCHAR(20),
    tax_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_abacate_customers_email ON abacate_pay_customers(email);
CREATE INDEX IF NOT EXISTS idx_abacate_customers_abacate_id ON abacate_pay_customers(abacate_customer_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE abacate_pay_customers ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso apenas a usuários autenticados (service role)
CREATE POLICY "Allow service role access" ON abacate_pay_customers
    FOR ALL USING (auth.role() = 'service_role');

-- Comentários para documentação
COMMENT ON TABLE abacate_pay_customers IS 'Tabela para armazenar informações dos clientes do Abacate Pay';
COMMENT ON COLUMN abacate_pay_customers.abacate_customer_id IS 'ID único do cliente no Abacate Pay (ex: cust_aebxkhDZNaMmJeKsy0AHS0FQ)';
COMMENT ON COLUMN abacate_pay_customers.email IS 'Email do cliente (obrigatório)';
COMMENT ON COLUMN abacate_pay_customers.name IS 'Nome do cliente (opcional)';
COMMENT ON COLUMN abacate_pay_customers.cellphone IS 'Telefone do cliente (opcional)';
COMMENT ON COLUMN abacate_pay_customers.tax_id IS 'CPF ou CNPJ do cliente (opcional)';