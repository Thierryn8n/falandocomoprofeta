-- Criar a função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se o trigger já existe e removê-lo se necessário
DROP TRIGGER IF EXISTS subscription_plans_updated_at ON public.subscription_plans;

-- Criar o trigger
CREATE TRIGGER subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_plans_updated_at();