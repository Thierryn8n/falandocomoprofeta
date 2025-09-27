-- Script para criar configurações de métodos de pagamento
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de configurações de métodos de pagamento
CREATE TABLE IF NOT EXISTS public.payment_methods_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    method_name TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    display_name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    config_data JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir configurações padrão dos métodos de pagamento
INSERT INTO public.payment_methods_config (method_name, is_enabled, display_name, description, icon_name, sort_order, config_data) VALUES
('stripe', true, 'Cartão de Crédito', 'Pagamento seguro via Stripe', 'CreditCard', 1, '{"supports_cards": true, "supports_subscriptions": true}'::jsonb),
('pix', true, 'PIX', 'QR Code com liberação automática', 'QrCode', 2, '{"qr_code_expires_minutes": 30}'::jsonb),
('abacate_pay', false, 'Abacate Pay', 'Pagamento via Abacate Pay', 'Wallet', 3, '{"api_url": "", "webhook_url": ""}'::jsonb)
ON CONFLICT (method_name) DO NOTHING;

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_payment_methods_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_payment_methods_config_updated_at_trigger ON public.payment_methods_config;
CREATE TRIGGER update_payment_methods_config_updated_at_trigger
    BEFORE UPDATE ON public.payment_methods_config
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_config_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.payment_methods_config ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de acesso
-- Permitir leitura para usuários autenticados
CREATE POLICY "Allow read access for authenticated users" ON public.payment_methods_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir todas as operações para service_role (admin)
CREATE POLICY "Allow all operations for service_role" ON public.payment_methods_config
    FOR ALL USING (auth.role() = 'service_role');

-- 7. Comentários para documentação
COMMENT ON TABLE public.payment_methods_config IS 'Configurações dos métodos de pagamento disponíveis';
COMMENT ON COLUMN public.payment_methods_config.method_name IS 'Nome único do método de pagamento';
COMMENT ON COLUMN public.payment_methods_config.is_enabled IS 'Se o método está habilitado ou não';
COMMENT ON COLUMN public.payment_methods_config.display_name IS 'Nome para exibição na interface';
COMMENT ON COLUMN public.payment_methods_config.description IS 'Descrição do método de pagamento';
COMMENT ON COLUMN public.payment_methods_config.icon_name IS 'Nome do ícone para exibição';
COMMENT ON COLUMN public.payment_methods_config.config_data IS 'Configurações específicas do método em JSON';
COMMENT ON COLUMN public.payment_methods_config.sort_order IS 'Ordem de exibição dos métodos';