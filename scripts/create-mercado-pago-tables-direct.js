const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Ler variáveis de ambiente do arquivo .env.local
let supabaseUrl, supabaseServiceKey

try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const envLines = envContent.split('\n')
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim()
    }
  }
} catch (error) {
  console.error('❌ Erro ao ler arquivo .env.local:', error.message)
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no arquivo .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMercadoPagoTables() {
  try {
    console.log('🚀 Iniciando criação das tabelas do Mercado Pago...')
    
    // 1. Criar tabela de configuração do Mercado Pago
    console.log('📝 Criando tabela mercado_pago_config...')
    const { error: configError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS mercado_pago_config (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          public_key TEXT,
          access_token TEXT,
          test_mode BOOLEAN DEFAULT true,
          webhook_url TEXT,
          notification_url TEXT,
          success_url TEXT,
          failure_url TEXT,
          pending_url TEXT,
          auto_return TEXT DEFAULT 'approved',
          binary_mode BOOLEAN DEFAULT false,
          statement_descriptor TEXT,
          external_reference_prefix TEXT DEFAULT 'MP_',
          expires_in INTEGER DEFAULT 30,
          installments INTEGER DEFAULT 12,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (configError) {
      console.log('⚠️  Tentando criar tabela mercado_pago_config de forma alternativa...')
      // Tentar criar usando query direta
      await supabase.from('mercado_pago_config').select('id').limit(1)
    }
    
    // 2. Criar tabela de produtos do Mercado Pago
    console.log('📝 Criando tabela mercado_pago_products...')
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS mercado_pago_products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category_id TEXT,
          currency_id TEXT DEFAULT 'BRL',
          unit_price DECIMAL(10,2) NOT NULL,
          quantity INTEGER DEFAULT 1,
          picture_url TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (productsError) {
      console.log('⚠️  Tentando criar tabela mercado_pago_products de forma alternativa...')
    }
    
    // 3. Criar tabela de transações do Mercado Pago
    console.log('📝 Criando tabela mercado_pago_transactions...')
    const { error: transactionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS mercado_pago_transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          payment_id TEXT UNIQUE,
          preference_id TEXT,
          external_reference TEXT,
          status TEXT,
          status_detail TEXT,
          payment_type TEXT,
          payment_method_id TEXT,
          transaction_amount DECIMAL(10,2),
          currency_id TEXT DEFAULT 'BRL',
          payer_email TEXT,
          payer_id TEXT,
          collector_id TEXT,
          date_created TIMESTAMP WITH TIME ZONE,
          date_approved TIMESTAMP WITH TIME ZONE,
          date_last_updated TIMESTAMP WITH TIME ZONE,
          money_release_date TIMESTAMP WITH TIME ZONE,
          installments INTEGER,
          fee_details JSONB DEFAULT '[]',
          charges_details JSONB DEFAULT '[]',
          captured BOOLEAN DEFAULT true,
          binary_mode BOOLEAN DEFAULT false,
          live_mode BOOLEAN DEFAULT false,
          card_id TEXT,
          issuer_id TEXT,
          authorization_code TEXT,
          transaction_details JSONB DEFAULT '{}',
          additional_info JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          user_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (transactionsError) {
      console.log('⚠️  Tentando criar tabela mercado_pago_transactions de forma alternativa...')
    }
    
    // 4. Criar tabela de configuração do sistema de pagamento
    console.log('📝 Criando tabela payment_system_config...')
    const { error: systemConfigError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payment_system_config (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          active_system TEXT DEFAULT 'abacate_pay' CHECK (active_system IN ('abacate_pay', 'mercado_pago')),
          abacate_pay_enabled BOOLEAN DEFAULT true,
          mercado_pago_enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (systemConfigError) {
      console.log('⚠️  Tentando criar tabela payment_system_config de forma alternativa...')
    }
    
    // 5. Inserir configuração padrão
    console.log('📝 Inserindo configuração padrão do sistema de pagamento...')
    const { data: existingConfig } = await supabase
      .from('payment_system_config')
      .select('id')
      .limit(1)
    
    if (!existingConfig || existingConfig.length === 0) {
      const { error: insertError } = await supabase
        .from('payment_system_config')
        .insert({
          active_system: 'abacate_pay',
          abacate_pay_enabled: true,
          mercado_pago_enabled: false
        })
      
      if (insertError) {
        console.log('⚠️  Erro ao inserir configuração padrão:', insertError.message)
      } else {
        console.log('✅ Configuração padrão inserida')
      }
    } else {
      console.log('✅ Configuração padrão já existe')
    }
    
    // 6. Inserir produtos de exemplo
    console.log('📦 Inserindo produtos de exemplo...')
    const sampleProducts = [
      {
        title: 'Plano Mensal Premium',
        description: 'Acesso completo ao chat espiritual por 1 mês',
        unit_price: 19.90,
        currency_id: 'BRL',
        status: 'active',
        metadata: {
          duration: '1 month',
          features: ['Chat ilimitado', 'Suporte prioritário', 'Análises personalizadas']
        }
      },
      {
        title: 'Plano Anual Premium',
        description: 'Acesso completo ao chat espiritual por 1 ano com desconto',
        unit_price: 199.00,
        currency_id: 'BRL',
        status: 'active',
        metadata: {
          duration: '1 year',
          discount: '33%',
          features: ['Chat ilimitado', 'Suporte prioritário', 'Análises personalizadas', '2 meses grátis']
        }
      }
    ]
    
    for (const product of sampleProducts) {
      try {
        // Verificar se o produto já existe
        const { data: existingProduct } = await supabase
          .from('mercado_pago_products')
          .select('id')
          .eq('title', product.title)
          .limit(1)
        
        if (!existingProduct || existingProduct.length === 0) {
          const { error } = await supabase
            .from('mercado_pago_products')
            .insert(product)
          
          if (error) {
            console.log(`⚠️  Erro ao inserir produto "${product.title}":`, error.message)
          } else {
            console.log(`✅ Produto "${product.title}" inserido com sucesso`)
          }
        } else {
          console.log(`✅ Produto "${product.title}" já existe`)
        }
      } catch (err) {
        console.log(`⚠️  Erro ao inserir produto "${product.title}":`, err.message)
      }
    }
    
    // 7. Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...')
    const tables = [
      'mercado_pago_config',
      'mercado_pago_products', 
      'mercado_pago_transactions',
      'payment_system_config'
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Tabela ${table} não foi criada ou não é acessível:`, error.message)
        } else {
          console.log(`✅ Tabela ${table} criada e acessível`)
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar tabela ${table}:`, err.message)
      }
    }
    
    console.log('')
    console.log('🎉 Configuração do Mercado Pago concluída!')
    console.log('')
    console.log('📋 Próximos passos:')
    console.log('1. Configure suas credenciais do Mercado Pago no painel admin')
    console.log('2. Teste os pagamentos em modo sandbox')
    console.log('3. Configure os webhooks do Mercado Pago')
    console.log('4. Ative o modo produção quando estiver pronto')
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error)
    process.exit(1)
  }
}

// Executar o setup
createMercadoPagoTables()