-- Script para criar tabela de configuração de métodos de pagamento
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela para configuração de métodos de pagamento
CREATE TABLE IF NOT EXISTS public.payment_methods_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method_name VARCHAR(50) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50),
  config_data JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir configurações padrão dos métodos de pagamento
INSERT INTO public.payment_methods_config (method_name, is_enabled, display_name, description, icon_name, sort_order, config_data) VALUES
('stripe', true, 'Stripe', 'Pagamentos via cartão de crédito', 'credit-card', 1, '{"publishable_key": "", "secret_key": "", "webhook_secret": ""}'),
('pix', true, 'PIX', 'Pagamento instantâneo via PIX', 'qr-code', 2, '{}'),
('abacate_pay', false, 'Abacate Pay', 'Pagamento via Abacate Pay', 'heart', 3, '{"api_key": "", "api_url": "", "webhook_url": ""}')
ON CONFLICT (method_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  config_data = EXCLUDED.config_data,
  sort_order = EXCLUDED.sort_order;

-- 3. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_payment_methods_config_updated_at()
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
    EXECUTE FUNCTION public.update_payment_methods_config_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.payment_methods_config ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.payment_methods_config;
DROP POLICY IF EXISTS "Allow all operations for service_role" ON public.payment_methods_config;

-- 7. Criar políticas de acesso
-- Permitir leitura para usuários autenticados
CREATE POLICY "Allow read access for authenticated users" ON public.payment_methods_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir todas as operações para service_role (admin)
CREATE POLICY "Allow all operations for service_role" ON public.payment_methods_config
    FOR ALL USING (auth.role() = 'service_role');

-- 8. Comentários para documentação
COMMENT ON TABLE public.payment_methods_config IS 'Configurações dos métodos de pagamento disponíveis';
COMMENT ON COLUMN public.payment_methods_config.method_name IS 'Nome único do método de pagamento';
COMMENT ON COLUMN public.payment_methods_config.is_enabled IS 'Se o método está habilitado ou não';
COMMENT ON COLUMN public.payment_methods_config.display_name IS 'Nome para exibição na interface';
COMMENT ON COLUMN public.payment_methods_config.description IS 'Descrição do método de pagamento';
COMMENT ON COLUMN public.payment_methods_config.config_data IS 'Configurações específicas do método (JSON)';

-- 9. Verificar se a tabela foi criada corretamente
SELECT 
  method_name, 
  is_enabled, 
  display_name, 
  description,
  config_data
FROM public.payment_methods_config 
ORDER BY sort_order;