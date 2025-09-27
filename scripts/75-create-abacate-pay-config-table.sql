-- Script para criar tabela de configurações do Abacate Pay
-- Suporta sistema interno vs externo com todas as configurações avançadas

-- 1. Criar tabela de configurações do Abacate Pay
CREATE TABLE IF NOT EXISTS public.abacate_pay_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    api_url TEXT NOT NULL DEFAULT 'https://api.abacatepay.com',
    enabled BOOLEAN DEFAULT false,
    test_mode BOOLEAN DEFAULT true,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER DEFAULT 30000, -- timeout em millisegundos
    retry_attempts INTEGER DEFAULT 3,
    purchase_link_template TEXT DEFAULT 'https://pay.abacatepay.com/checkout/{product_id}',
    enable_purchase_links BOOLEAN DEFAULT true,
    enable_pix BOOLEAN DEFAULT true,
    pix_expiration_minutes INTEGER DEFAULT 30,
    use_external_system BOOLEAN DEFAULT false, -- true = sistema externo, false = sistema interno
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir configuração padrão
INSERT INTO public.abacate_pay_config (
    api_key, 
    api_url, 
    enabled, 
    test_mode, 
    use_external_system
) VALUES (
    'your-api-key-here',
    'https://api.abacatepay.com',
    false,
    true,
    false
) ON CONFLICT DO NOTHING;

-- 3. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_abacate_pay_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_abacate_pay_config_updated_at_trigger ON public.abacate_pay_config;
CREATE TRIGGER update_abacate_pay_config_updated_at_trigger
    BEFORE UPDATE ON public.abacate_pay_config
    FOR EACH ROW
    EXECUTE FUNCTION update_abacate_pay_config_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.abacate_pay_config ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de acesso
-- Permitir leitura para usuários autenticados
CREATE POLICY "Allow read access for authenticated users" ON public.abacate_pay_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir todas as operações para admins
CREATE POLICY "Allow all operations for admins" ON public.abacate_pay_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Permitir todas as operações para service_role
CREATE POLICY "Allow all operations for service_role" ON public.abacate_pay_config
    FOR ALL USING (auth.role() = 'service_role');

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_abacate_pay_config_enabled ON public.abacate_pay_config(enabled);
CREATE INDEX IF NOT EXISTS idx_abacate_pay_config_use_external ON public.abacate_pay_config(use_external_system);

-- 8. Comentários para documentação
COMMENT ON TABLE public.abacate_pay_config IS 'Configurações do sistema de pagamento Abacate Pay';
COMMENT ON COLUMN public.abacate_pay_config.api_key IS 'Chave da API do Abacate Pay';
COMMENT ON COLUMN public.abacate_pay_config.api_url IS 'URL base da API do Abacate Pay';
COMMENT ON COLUMN public.abacate_pay_config.enabled IS 'Se o sistema está habilitado';
COMMENT ON COLUMN public.abacate_pay_config.test_mode IS 'Se está em modo de teste';
COMMENT ON COLUMN public.abacate_pay_config.webhook_url IS 'URL para receber webhooks';
COMMENT ON COLUMN public.abacate_pay_config.webhook_secret IS 'Segredo para validar webhooks';
COMMENT ON COLUMN public.abacate_pay_config.timeout IS 'Timeout para requisições em millisegundos';
COMMENT ON COLUMN public.abacate_pay_config.retry_attempts IS 'Número de tentativas em caso de falha';
COMMENT ON COLUMN public.abacate_pay_config.purchase_link_template IS 'Template para links de compra externos';
COMMENT ON COLUMN public.abacate_pay_config.enable_purchase_links IS 'Se links de compra estão habilitados';
COMMENT ON COLUMN public.abacate_pay_config.enable_pix IS 'Se pagamentos PIX estão habilitados';
COMMENT ON COLUMN public.abacate_pay_config.pix_expiration_minutes IS 'Tempo de expiração do PIX em minutos';
COMMENT ON COLUMN public.abacate_pay_config.use_external_system IS 'true = sistema externo (links), false = sistema interno (processamento completo)';