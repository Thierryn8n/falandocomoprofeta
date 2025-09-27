-- Adicionar coluna allow_system_switch à tabela payment_system_config
-- Esta coluna controla se o usuário pode alternar entre sistemas de pagamento

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_system_config' 
        AND column_name = 'allow_system_switch'
    ) THEN
        ALTER TABLE payment_system_config 
        ADD COLUMN allow_system_switch BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Coluna allow_system_switch adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna allow_system_switch já existe.';
    END IF;
END $$;

-- Atualizar registros existentes para ter allow_system_switch = true
UPDATE payment_system_config 
SET allow_system_switch = true 
WHERE allow_system_switch IS NULL;

-- Verificar a estrutura da tabela após a alteração
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payment_system_config'
ORDER BY ordinal_position;