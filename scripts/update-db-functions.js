const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateDatabaseFunctions() {
  console.log('🔄 Atualizando funções do banco de dados...')

  try {
    // 1. Atualizar função can_user_chat
    console.log('📝 Atualizando função can_user_chat...')
    const { error: canUserChatError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION can_user_chat(p_user_id UUID)
        RETURNS BOOLEAN AS $$
        DECLARE
            has_active_subscription BOOLEAN := false;
        BEGIN
            -- Verificar se o usuário tem assinatura ativa
            SELECT EXISTS(
                SELECT 1 FROM public.user_subscriptions us
                JOIN public.subscription_plans sp ON us.plan_id = sp.id
                WHERE us.user_id = p_user_id 
                AND us.status = 'active'
                AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
                AND sp.is_active = true
            ) INTO has_active_subscription;
            
            RETURN has_active_subscription;
        END;
        $$ LANGUAGE plpgsql;
      `
    })

    if (canUserChatError) {
      console.error('❌ Erro ao atualizar can_user_chat:', canUserChatError)
    } else {
      console.log('✅ Função can_user_chat atualizada com sucesso')
    }

    // 2. Criar função log_chat_usage
    console.log('📝 Criando função log_chat_usage...')
    const { error: logChatError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION log_chat_usage(p_user_id UUID, p_conversation_id UUID DEFAULT NULL)
        RETURNS VOID AS $$
        BEGIN
            -- Apenas registrar o uso para estatísticas, sem consumir tokens
            INSERT INTO public.token_usage_history (user_id, conversation_id, tokens_used, action_type)
            VALUES (p_user_id, p_conversation_id, 1, 'chat_message');
        END;
        $$ LANGUAGE plpgsql;
      `
    })

    if (logChatError) {
      console.error('❌ Erro ao criar log_chat_usage:', logChatError)
    } else {
      console.log('✅ Função log_chat_usage criada com sucesso')
    }

    // 3. Criar função has_active_subscription
    console.log('📝 Criando função has_active_subscription...')
    const { error: hasActiveError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN can_user_chat(p_user_id);
        END;
        $$ LANGUAGE plpgsql;
      `
    })

    if (hasActiveError) {
      console.error('❌ Erro ao criar has_active_subscription:', hasActiveError)
    } else {
      console.log('✅ Função has_active_subscription criada com sucesso')
    }

    // 4. Criar função activate_user_subscription
    console.log('📝 Criando função activate_user_subscription...')
    const { error: activateError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION activate_user_subscription(p_user_id UUID, p_plan_id UUID)
        RETURNS VOID AS $$
        DECLARE
            plan_cycle TEXT;
            plan_active BOOLEAN;
        BEGIN
            -- Buscar informações do plano
            SELECT billing_cycle, is_active INTO plan_cycle, plan_active
            FROM public.subscription_plans
            WHERE id = p_plan_id;
            
            -- Verificar se o plano está ativo
            IF NOT plan_active THEN
                RAISE EXCEPTION 'Plano não está ativo';
            END IF;
            
            -- Criar/atualizar assinatura ativa
            INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
            VALUES (
                p_user_id, 
                p_plan_id, 
                'active',
                NOW(),
                CASE 
                    WHEN plan_cycle = 'monthly' THEN NOW() + INTERVAL '1 month'
                    WHEN plan_cycle = 'yearly' THEN NOW() + INTERVAL '1 year'
                    ELSE NULL -- lifetime
                END
            )
            ON CONFLICT (user_id) DO UPDATE SET
                plan_id = EXCLUDED.plan_id,
                status = 'active',
                current_period_start = NOW(),
                current_period_end = EXCLUDED.current_period_end,
                updated_at = NOW();
        END;
        $$ LANGUAGE plpgsql;
      `
    })

    if (activateError) {
      console.error('❌ Erro ao criar activate_user_subscription:', activateError)
    } else {
      console.log('✅ Função activate_user_subscription criada com sucesso')
    }

    // 5. Atualizar planos para remover tokens_included
    console.log('📝 Atualizando planos de assinatura...')
    const { error: updatePlansError } = await supabase
      .from('subscription_plans')
      .update({ tokens_included: 0 })
      .gt('tokens_included', 0)

    if (updatePlansError) {
      console.error('❌ Erro ao atualizar planos:', updatePlansError)
    } else {
      console.log('✅ Planos de assinatura atualizados com sucesso')
    }

    console.log('🎉 Todas as atualizações foram concluídas!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar as atualizações
updateDatabaseFunctions()