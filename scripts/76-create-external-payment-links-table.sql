-- Script para criar tabela de links de pagamento externos
-- Para gerenciar links do Abacate Pay quando usando sistema externo

-- 1. Criar tabela de links de pagamento externos
CREATE TABLE IF NOT EXISTS public.external_payment_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    currency TEXT DEFAULT 'BRL',
    interval TEXT CHECK (interval IN ('monthly', 'yearly', 'one_time')) DEFAULT 'one_time',
    features TEXT[] DEFAULT '{}', -- Array de features/benefícios
    external_link TEXT NOT NULL, -- Link direto do Abacate Pay
    external_id TEXT, -- ID do produto no Abacate Pay (se aplicável)
    provider TEXT DEFAULT 'abacate_pay',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb, -- Dados adicionais como cores, ícones, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir links padrão de exemplo
INSERT INTO public.external_payment_links (
    name, 
    description, 
    price, 
    interval, 
    features, 
    external_link,
    sort_order,
    metadata
) VALUES 
(
    'Plano Mensal Premium',
    'Acesso completo ao chat espiritual por 1 mês',
    19.90,
    'monthly',
    ARRAY['Chat ilimitado', 'Suporte prioritário', 'Análises personalizadas'],
    'https://pay.abacatepay.com/checkout/monthly-premium',
    1,
    '{"color": "#ff8100", "icon": "Calendar", "highlight": false}'::jsonb
),
(
    'Plano Anual Premium',
    'Acesso completo ao chat espiritual por 1 ano (2 meses grátis)',
    199.00,
    'yearly',
    ARRAY['Chat ilimitado', 'Suporte prioritário', 'Análises personalizadas', '2 meses grátis'],
    'https://pay.abacatepay.com/checkout/yearly-premium',
    2,
    '{"color": "#ff8100", "icon": "Crown", "highlight": true}'::jsonb
),
(
    'Consulta Única',
    'Uma consulta espiritual personalizada',
    29.90,
    'one_time',
    ARRAY['Consulta personalizada', 'Relatório detalhado', 'Suporte por 7 dias'],
    'https://pay.abacatepay.com/checkout/single-consultation',
    3,
    '{"color": "#ff8100", "icon": "MessageCircle", "highlight": false}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 3. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_external_payment_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_external_payment_links_updated_at_trigger ON public.external_payment_links;
CREATE TRIGGER update_external_payment_links_updated_at_trigger
    BEFORE UPDATE ON public.external_payment_links
    FOR EACH ROW
    EXECUTE FUNCTION update_external_payment_links_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.external_payment_links ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de acesso
-- Permitir leitura para todos (links públicos)
CREATE POLICY "Allow read access for everyone" ON public.external_payment_links
    FOR SELECT USING (status = 'active');

-- Permitir todas as operações para admins
CREATE POLICY "Allow all operations for admins" ON public.external_payment_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.external_payment_links
    FOR ALL USING (auth.role() = 'service_role');

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_external_payment_links_status ON public.external_payment_links(status);
CREATE INDEX IF NOT EXISTS idx_external_payment_links_interval ON public.external_payment_links(interval);
CREATE INDEX IF NOT EXISTS idx_external_payment_links_sort_order ON public.external_payment_links(sort_order);
CREATE INDEX IF NOT EXISTS idx_external_payment_links_provider ON public.external_payment_links(provider);

-- 8. Comentários para documentação
COMMENT ON TABLE public.external_payment_links IS 'Links de pagamento externos do Abacate Pay';
COMMENT ON COLUMN public.external_payment_links.name IS 'Nome do plano/produto';
COMMENT ON COLUMN public.external_payment_links.description IS 'Descrição do plano/produto';
COMMENT ON COLUMN public.external_payment_links.price IS 'Preço em reais';
COMMENT ON COLUMN public.external_payment_links.currency IS 'Moeda (padrão BRL)';
COMMENT ON COLUMN public.external_payment_links.interval IS 'Tipo de cobrança: monthly, yearly, one_time';
COMMENT ON COLUMN public.external_payment_links.features IS 'Array de features/benefícios do plano';
COMMENT ON COLUMN public.external_payment_links.external_link IS 'Link direto para pagamento no Abacate Pay';
COMMENT ON COLUMN public.external_payment_links.external_id IS 'ID do produto no sistema externo';
COMMENT ON COLUMN public.external_payment_links.provider IS 'Provedor do pagamento (abacate_pay)';
COMMENT ON COLUMN public.external_payment_links.status IS 'Status: active, inactive, draft';
COMMENT ON COLUMN public.external_payment_links.sort_order IS 'Ordem de exibição';
COMMENT ON COLUMN public.external_payment_links.metadata IS 'Dados adicionais como cores, ícones, configurações de UI';