const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSubscriptionSystem() {
  console.log('🔄 Criando sistema de assinaturas...')

  try {
    // 1. Criar tabela user_subscriptions se não existir
    console.log('📝 Criando tabela user_subscriptions...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
        plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
        stripe_subscription_id TEXT,
        current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        current_period_end TIMESTAMP WITH TIME ZONE,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `

    // Usar uma requisição HTTP direta para executar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: createTableSQL })
    })

    if (!response.ok) {
      // Se não conseguir executar SQL diretamente, vamos usar uma abordagem alternativa
      console.log('⚠️ Não foi possível executar SQL diretamente. Verificando se a tabela já existe...')
      
      // Tentar inserir um registro de teste para ver se a tabela existe
      const { error: testError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .limit(1)

      if (testError && testError.code === '42P01') {
        console.log('❌ Tabela user_subscriptions não existe e não foi possível criar via API')
        console.log('📋 Você precisará executar o SQL manualmente no painel do Supabase:')
        console.log(createTableSQL)
      } else {
        console.log('✅ Tabela user_subscriptions já existe ou foi criada')
      }
    } else {
      console.log('✅ Tabela user_subscriptions criada com sucesso')
    }

    // 2. Atualizar planos existentes para usar a nova estrutura
    console.log('📝 Atualizando planos de assinatura...')
    
    const plansToUpdate = [
      {
        plan_type: 'monthly',
        name: 'Mensal',
        description: 'Plano mensal com acesso ilimitado',
        billing_cycle: 'monthly'
      },
      {
        plan_type: 'yearly', 
        name: 'Anual',
        description: 'Plano anual com desconto',
        billing_cycle: 'yearly'
      },
      {
        plan_type: 'lifetime',
        name: 'Vitalício', 
        description: 'Pagamento único para acesso vitalício',
        billing_cycle: 'lifetime'
      }
    ]

    for (const plan of plansToUpdate) {
      const { error: updateError } = await supabase
        .from('subscription_plans')
        .update({
          name: plan.name,
          description: plan.description,
          billing_cycle: plan.billing_cycle
        })
        .eq('plan_type', plan.plan_type)

      if (updateError) {
        console.error(`❌ Erro ao atualizar plano ${plan.plan_type}:`, updateError)
      } else {
        console.log(`✅ Plano ${plan.plan_type} atualizado`)
      }
    }

    // 3. Criar função can_user_chat simplificada
    console.log('📝 Criando função can_user_chat...')
    
    // Como não conseguimos executar SQL diretamente, vamos documentar a função
    const canUserChatFunction = `
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

    console.log('📋 Função SQL para executar manualmente no Supabase:')
    console.log(canUserChatFunction)

    console.log('\n🎉 Sistema de assinaturas configurado!')
    console.log('📋 Para completar a configuração, execute as seguintes funções SQL no painel do Supabase:')
    console.log('\n1. Criar tabela user_subscriptions:')
    console.log(createTableSQL)
    console.log('\n2. Criar função can_user_chat:')
    console.log(canUserChatFunction)

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar criação do sistema
createSubscriptionSystem()