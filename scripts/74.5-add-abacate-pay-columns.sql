-- Script para adicionar colunas do Abacate Pay na tabela payment_transactions
-- Execute este script antes do 77-update-payment-transactions-table.sql

-- Adicionar colunas do Abacate Pay se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna para link de pagamento do Abacate Pay
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'abacate_pay_link') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN abacate_pay_link TEXT;
    END IF;

    -- Adicionar coluna para token de rastreamento do Abacate Pay
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'abacate_pay_tracking_token') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN abacate_pay_tracking_token TEXT;
    END IF;

    -- Adicionar coluna para ID externo do Abacate Pay
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' 
                   AND column_name = 'abacate_pay_external_id') THEN
        ALTER TABLE public.payment_transactions 
        ADD COLUMN abacate_pay_external_id TEXT;
    END IF;
END $$;

-- Atualizar constraint do payment_method para incluir abacate_pay
ALTER TABLE public.payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN ('stripe', 'pix', 'manual', 'abacate_pay'));

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_payment_transactions_abacate_link ON public.payment_transactions(abacate_pay_link);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_abacate_token ON public.payment_transactions(abacate_pay_tracking_token);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_abacate_external_id ON public.payment_transactions(abacate_pay_external_id);

-- Comentários nas colunas
COMMENT ON COLUMN public.payment_transactions.abacate_pay_link IS 'Link de pagamento gerado pelo Abacate Pay';
COMMENT ON COLUMN public.payment_transactions.abacate_pay_tracking_token IS 'Token de rastreamento do pagamento no Abacate Pay';
COMMENT ON COLUMN public.payment_transactions.abacate_pay_external_id IS 'ID externo do pagamento no Abacate Pay';