-- Script principal para executar todas as atualizações do Abacate Pay
-- Execute este script no Supabase SQL Editor para aplicar todas as mudanças
-- IMPORTANTE: Execute os scripts individuais na seguinte ordem:
-- 1. scripts/74.5-add-abacate-pay-columns.sql
-- 2. scripts/75-create-abacate-pay-config-table.sql  
-- 3. scripts/76-create-external-payment-links-table.sql
-- 4. scripts/77-update-payment-transactions-table.sql
-- 5. scripts/78-create-abacate-pay-products-enhanced.sql
-- 6. Este script (79-execute-all-abacate-pay-updates.sql) por último

-- Início da transação
BEGIN;

-- 5. Criar função para obter configuração ativa
CREATE OR REPLACE FUNCTION get_active_abacate_pay_config()
RETURNS TABLE (
    api_key TEXT,
    api_url TEXT,
    enabled BOOLEAN,
    test_mode BOOLEAN,
    webhook_url TEXT,
    webhook_secret TEXT,
    timeout INTEGER,
    retry_attempts INTEGER,
    purchase_link_template TEXT,
    enable_purchase_links BOOLEAN,
    enable_pix BOOLEAN,
    pix_expiration_minutes INTEGER,
    use_external_system BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.api_key,
        c.api_url,
        c.enabled,
        c.test_mode,
        c.webhook_url,
        c.webhook_secret,
        c.timeout,
        c.retry_attempts,
        c.purchase_link_template,
        c.enable_purchase_links,
        c.enable_pix,
        c.pix_expiration_minutes,
        c.use_external_system
    FROM public.abacate_pay_config c
    ORDER BY c.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar função para obter estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_abacate_pay_dashboard_stats()
RETURNS TABLE (
    total_revenue DECIMAL,
    total_transactions BIGINT,
    active_products BIGINT,
    active_external_links BIGINT,
    conversion_rate DECIMAL,
    today_revenue DECIMAL,
    monthly_growth DECIMAL,
    pending_transactions BIGINT,
    completed_transactions BIGINT,
    failed_transactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COALESCE(SUM(pt.amount) FILTER (WHERE pt.payment_status = 'completed'), 0) as total_rev,
            COUNT(*) as total_trans,
            COUNT(*) FILTER (WHERE pt.payment_status = 'pending') as pending_trans,
            COUNT(*) FILTER (WHERE pt.payment_status = 'completed') as completed_trans,
            COUNT(*) FILTER (WHERE pt.payment_status = 'failed') as failed_trans,
            COALESCE(SUM(pt.amount) FILTER (WHERE pt.payment_status = 'completed' AND pt.created_at >= CURRENT_DATE), 0) as today_rev,
            COALESCE(SUM(pt.amount) FILTER (WHERE pt.payment_status = 'completed' AND pt.created_at >= date_trunc('month', CURRENT_DATE)), 0) as current_month_rev,
            COALESCE(SUM(pt.amount) FILTER (WHERE pt.payment_status = 'completed' AND pt.created_at >= date_trunc('month', CURRENT_DATE - interval '1 month') AND pt.created_at < date_trunc('month', CURRENT_DATE)), 0) as last_month_rev
        FROM public.payment_transactions pt
        WHERE pt.payment_method IN ('abacate_pay', 'abacate_pay_external')
    ),
    products_count AS (
        SELECT COUNT(*) as active_prod
        FROM public.abacate_pay_products_enhanced
        WHERE is_active = true
    ),
    links_count AS (
        SELECT COUNT(*) as active_links
        FROM public.external_payment_links
        WHERE status = 'active'
    )
    SELECT 
        s.total_rev,
        s.total_trans,
        pc.active_prod,
        lc.active_links,
        CASE 
            WHEN s.total_trans > 0 THEN 
                ROUND((s.completed_trans::decimal / s.total_trans::decimal) * 100, 2)
            ELSE 0 
        END,
        s.today_rev,
        CASE 
            WHEN s.last_month_rev > 0 THEN 
                ROUND(((s.current_month_rev - s.last_month_rev) / s.last_month_rev) * 100, 2)
            ELSE 0 
        END,
        s.pending_trans,
        s.completed_trans,
        s.failed_trans
    FROM stats s
    CROSS JOIN products_count pc
    CROSS JOIN links_count lc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar função para obter produtos/links baseado no sistema ativo
CREATE OR REPLACE FUNCTION get_available_payment_options()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    currency TEXT,
    plan_type TEXT,
    features TEXT[],
    is_featured BOOLEAN,
    sort_order INTEGER,
    payment_link TEXT,
    ui_config JSONB,
    system_type TEXT
) AS $$
DECLARE
    config_rec RECORD;
BEGIN
    -- Obter configuração ativa
    SELECT * INTO config_rec FROM get_active_abacate_pay_config() LIMIT 1;
    
    IF config_rec.use_external_system THEN
        -- Retornar links externos
        RETURN QUERY
        SELECT 
            epl.id,
            epl.name,
            epl.description,
            epl.price,
            epl.currency,
            epl.interval as plan_type,
            epl.features,
            (epl.metadata->>'highlight')::boolean as is_featured,
            epl.sort_order,
            epl.external_link as payment_link,
            epl.metadata as ui_config,
            'external'::text as system_type
        FROM public.external_payment_links epl
        WHERE epl.status = 'active'
        ORDER BY epl.sort_order ASC;
    ELSE
        -- Retornar produtos internos
        RETURN QUERY
        SELECT 
            ape.id,
            ape.name,
            ape.description,
            ape.price,
            ape.currency,
            ape.plan_type,
            ape.features,
            ape.is_featured,
            ape.sort_order,
            ape.external_link as payment_link,
            ape.ui_config,
            'internal'::text as system_type
        FROM public.abacate_pay_products_enhanced ape
        WHERE ape.is_active = true
        ORDER BY ape.sort_order ASC, ape.is_featured DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar políticas de acesso para as funções
GRANT EXECUTE ON FUNCTION get_active_abacate_pay_config() TO authenticated;
GRANT EXECUTE ON FUNCTION get_abacate_pay_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_payment_options() TO authenticated;

-- 9. Comentários nas funções
COMMENT ON FUNCTION get_active_abacate_pay_config() IS 'Retorna a configuração ativa do Abacate Pay';
COMMENT ON FUNCTION get_abacate_pay_dashboard_stats() IS 'Retorna estatísticas para o dashboard do Abacate Pay';
COMMENT ON FUNCTION get_available_payment_options() IS 'Retorna opções de pagamento baseadas no sistema ativo (interno ou externo)';

-- Confirmar transação
COMMIT;

-- Mensagem de sucesso
SELECT 'Todas as atualizações do Abacate Pay foram aplicadas com sucesso!' as message;