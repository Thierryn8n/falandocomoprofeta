-- Script para criar tabela payment_transactions
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela de transações/pagamentos
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'pix', 'manual', 'abacate_pay')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_intent_id TEXT,
    pix_qr_code TEXT,
    pix_qr_code_expires_at TIMESTAMP WITH TIME ZONE,
    -- Campos específicos para Abacate Pay
    abacate_pay_link TEXT,
    abacate_pay_tracking_token TEXT UNIQUE,
    abacate_pay_external_id TEXT,
    tokens_granted INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de acesso
-- Usuários podem ver suas próprias transações
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Admins podem gerenciar todas as transações
CREATE POLICY "Admins can manage transactions" ON public.payment_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Service role pode fazer tudo
CREATE POLICY "Service role can manage transactions" ON public.payment_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON public.payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_abacate_tracking ON public.payment_transactions(abacate_pay_tracking_token);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_abacate_external ON public.payment_transactions(abacate_pay_external_id);

-- 5. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at_trigger ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at_trigger
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transactions_updated_at();

-- 7. Comentários para documentação
COMMENT ON TABLE public.payment_transactions IS 'Tabela para armazenar transações de pagamento';
COMMENT ON COLUMN public.payment_transactions.user_id IS 'ID do usuário que fez a transação';
COMMENT ON COLUMN public.payment_transactions.plan_id IS 'ID do plano de assinatura (opcional)';
COMMENT ON COLUMN public.payment_transactions.amount IS 'Valor da transação em reais';
COMMENT ON COLUMN public.payment_transactions.payment_method IS 'Método de pagamento utilizado';
COMMENT ON COLUMN public.payment_transactions.payment_status IS 'Status atual da transação';
COMMENT ON COLUMN public.payment_transactions.abacate_pay_link IS 'Link de pagamento gerado pelo Abacate Pay';
COMMENT ON COLUMN public.payment_transactions.abacate_pay_tracking_token IS 'Token único para rastrear pagamentos do Abacate Pay';
COMMENT ON COLUMN public.payment_transactions.abacate_pay_external_id IS 'ID externo da transação no Abacate Pay';
COMMENT ON COLUMN public.payment_transactions.tokens_granted IS 'Quantidade de tokens concedidos pela transação';
COMMENT ON COLUMN public.payment_transactions.metadata IS 'Dados adicionais da transação em formato JSON';

-- 8. Verificar se a tabela foi criada
SELECT 'Tabela payment_transactions criada com sucesso!' as status;