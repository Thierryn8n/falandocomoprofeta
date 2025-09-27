-- Script para criar/atualizar tabela de produtos do Abacate Pay
-- Versão melhorada que suporta sistema interno e externo

-- 1. Criar tabela melhorada de produtos (se não existir)
CREATE TABLE IF NOT EXISTS public.abacate_pay_products_enhanced (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT UNIQUE, -- ID no Abacate Pay (para sistema interno)
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    currency TEXT DEFAULT 'BRL',
    plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly', 'one_time', 'custom')),
    features TEXT[] DEFAULT '{}', -- Array de features
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Configurações para sistema interno
    internal_config JSONB DEFAULT '{}'::jsonb,
    
    -- Configurações para sistema externo
    external_link TEXT, -- Link direto do Abacate Pay
    external_config JSONB DEFAULT '{}'::jsonb,
    
    -- Metadados para UI
    ui_config JSONB DEFAULT '{}'::jsonb, -- cores, ícones, etc.
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migrar dados da tabela antiga (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'abacate_pay_products') THEN
        INSERT INTO public.abacate_pay_products_enhanced (
            external_id, name, description, price, currency, plan_type, is_active
        )
        SELECT 
            external_id, name, description, price/100.0, currency, plan_type, is_active
        FROM public.abacate_pay_products
        ON CONFLICT (external_id) DO NOTHING;
    END IF;
END $$;

-- 3. Inserir produtos padrão melhorados
INSERT INTO public.abacate_pay_products_enhanced (
    external_id, 
    name, 
    description, 
    price, 
    plan_type, 
    features,
    is_featured,
    sort_order,
    internal_config,
    external_link,
    ui_config
) VALUES 
(
    'monthly-premium',
    'Plano Mensal Premium',
    'Acesso completo ao chat espiritual por 1 mês',
    19.90,
    'monthly',
    ARRAY['Chat ilimitado', 'Suporte prioritário', 'Análises personalizadas'],
    false,
    1,
    '{"tokens_granted": 1000, "subscription_duration_days": 30}'::jsonb,
    'https://pay.abacatepay.com/checkout/monthly-premium',
    '{"color": "#ff8100", "icon": "Calendar", "badge": "Mensal"}'::jsonb
),
(
    'yearly-premium',
    'Plano Anual Premium',
    'Acesso completo ao chat espiritual por 1 ano (2 meses grátis)',
    199.00,
    'yearly',
    ARRAY['Chat ilimitado', 'Suporte prioritário', 'Análises personalizadas', '2 meses grátis', 'Desconto de 17%'],
    true,
    2,
    '{"tokens_granted": 12000, "subscription_duration_days": 365, "bonus_tokens": 2000}'::jsonb,
    'https://pay.abacatepay.com/checkout/yearly-premium',
    '{"color": "#ff8100", "icon": "Crown", "badge": "Mais Popular", "highlight": true}'::jsonb
),
(
    'consultation-single',
    'Consulta Única',
    'Uma consulta espiritual personalizada e detalhada',
    29.90,
    'one_time',
    ARRAY['Consulta personalizada', 'Relatório detalhado', 'Suporte por 7 dias'],
    false,
    3,
    '{"tokens_granted": 100, "consultation_type": "single", "support_days": 7}'::jsonb,
    'https://pay.abacatepay.com/checkout/single-consultation',
    '{"color": "#ff8100", "icon": "MessageCircle", "badge": "Único"}'::jsonb
),
(
    'tokens-pack-500',
    'Pacote 500 Tokens',
    'Pacote de 500 tokens para uso flexível',
    9.90,
    'one_time',
    ARRAY['500 tokens', 'Sem expiração', 'Uso flexível'],
    false,
    4,
    '{"tokens_granted": 500, "expiration_days": null}'::jsonb,
    'https://pay.abacatepay.com/checkout/tokens-500',
    '{"color": "#ff8100", "icon": "Zap", "badge": "Tokens"}'::jsonb
)
ON CONFLICT (external_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    plan_type = EXCLUDED.plan_type,
    features = EXCLUDED.features,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order,
    internal_config = EXCLUDED.internal_config,
    external_link = EXCLUDED.external_link,
    ui_config = EXCLUDED.ui_config,
    updated_at = NOW();

-- 4. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_abacate_pay_products_enhanced_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_abacate_pay_products_enhanced_updated_at_trigger ON public.abacate_pay_products_enhanced;
CREATE TRIGGER update_abacate_pay_products_enhanced_updated_at_trigger
    BEFORE UPDATE ON public.abacate_pay_products_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION update_abacate_pay_products_enhanced_updated_at();

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE public.abacate_pay_products_enhanced ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas de acesso
-- Permitir leitura para produtos ativos
CREATE POLICY "Allow read access for active products" ON public.abacate_pay_products_enhanced
    FOR SELECT USING (is_active = true);

-- Permitir todas as operações para admins
CREATE POLICY "Allow all operations for admins" ON public.abacate_pay_products_enhanced
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.abacate_pay_products_enhanced
    FOR ALL USING (auth.role() = 'service_role');

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_abacate_products_enhanced_active ON public.abacate_pay_products_enhanced(is_active);
CREATE INDEX IF NOT EXISTS idx_abacate_products_enhanced_featured ON public.abacate_pay_products_enhanced(is_featured);
CREATE INDEX IF NOT EXISTS idx_abacate_products_enhanced_plan_type ON public.abacate_pay_products_enhanced(plan_type);
CREATE INDEX IF NOT EXISTS idx_abacate_products_enhanced_sort_order ON public.abacate_pay_products_enhanced(sort_order);
CREATE INDEX IF NOT EXISTS idx_abacate_products_enhanced_external_id ON public.abacate_pay_products_enhanced(external_id);

-- 9. Criar view para produtos ativos ordenados
CREATE OR REPLACE VIEW public.active_abacate_products AS
SELECT 
    id,
    external_id,
    name,
    description,
    price,
    currency,
    plan_type,
    features,
    is_featured,
    sort_order,
    internal_config,
    external_link,
    ui_config,
    created_at,
    updated_at
FROM public.abacate_pay_products_enhanced
WHERE is_active = true
ORDER BY sort_order ASC, is_featured DESC, created_at DESC;

-- 10. Comentários para documentação
COMMENT ON TABLE public.abacate_pay_products_enhanced IS 'Produtos do Abacate Pay com suporte a sistema interno e externo';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.external_id IS 'ID único do produto no Abacate Pay (para sistema interno)';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.name IS 'Nome do produto';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.description IS 'Descrição do produto';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.price IS 'Preço em reais';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.currency IS 'Moeda (padrão BRL)';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.plan_type IS 'Tipo do plano: monthly, yearly, one_time, custom';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.features IS 'Array de features/benefícios';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.is_active IS 'Se o produto está ativo';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.is_featured IS 'Se o produto é destacado';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.sort_order IS 'Ordem de exibição';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.internal_config IS 'Configurações para sistema interno (tokens, duração, etc.)';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.external_link IS 'Link direto para pagamento externo';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.external_config IS 'Configurações para sistema externo';
COMMENT ON COLUMN public.abacate_pay_products_enhanced.ui_config IS 'Configurações de UI (cores, ícones, badges)';
COMMENT ON VIEW public.active_abacate_products IS 'View de produtos ativos do Abacate Pay ordenados por relevância';