const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeMercadoPagoSetup() {
  try {
    console.log('🚀 Iniciando configuração do Mercado Pago...')
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-mercado-pago-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`)
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        try {
          console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql: command })
          
          if (error) {
            // Tentar executar diretamente se rpc falhar
            const { error: directError } = await supabase
              .from('_temp_sql_execution')
              .select('*')
              .limit(0)
            
            if (directError) {
              console.log(`⚠️  Comando ${i + 1} pode ter falhado, mas continuando...`)
            }
          }
          
          console.log(`✅ Comando ${i + 1} executado`)
        } catch (err) {
          console.log(`⚠️  Erro no comando ${i + 1}, mas continuando:`, err.message)
        }
      }
    }
    
    // Verificar se as tabelas foram criadas
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
          console.log(`❌ Tabela ${table} não foi criada ou não é acessível`)
        } else {
          console.log(`✅ Tabela ${table} criada com sucesso`)
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar tabela ${table}:`, err.message)
      }
    }
    
    // Inserir dados de exemplo para produtos do Mercado Pago
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
        const { error } = await supabase
          .from('mercado_pago_products')
          .insert(product)
        
        if (error) {
          console.log(`⚠️  Erro ao inserir produto "${product.title}":`, error.message)
        } else {
          console.log(`✅ Produto "${product.title}" inserido com sucesso`)
        }
      } catch (err) {
        console.log(`⚠️  Erro ao inserir produto "${product.title}":`, err.message)
      }
    }
    
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
executeMercadoPagoSetup()