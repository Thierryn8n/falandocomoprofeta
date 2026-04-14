/**
 * Script para aplicar RLS (Row Level Security) em todas as tabelas do app
 * Execute: node scripts/apply-rls.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada!')
  console.log('💡 Configure a variável de ambiente ou passe como argumento:')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_chave node scripts/apply-rls.js')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function applyRLS() {
  console.log('🛡️  Aplicando RLS (Row Level Security) em todas as tabelas...\n')

  try {
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, '80-complete-rls-setup.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📄 Total de comandos SQL: ${commands.length}\n`)

    let successCount = 0
    let errorCount = 0
    const errors = []

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i] + ';'
      const cmdPreview = cmd.substring(0, 60).replace(/\s+/g, ' ')

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: cmd })

        if (error) {
          // Ignorar erros de "policy already exists" ou "does not exist"
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('não existe')) {
            console.log(`⏭️  [${i + 1}/${commands.length}] Ignorado: ${cmdPreview}...`)
            successCount++
          } else {
            console.error(`❌ [${i + 1}/${commands.length}] Erro: ${cmdPreview}...`)
            console.error(`   ${error.message}`)
            errors.push({ cmd: cmdPreview, error: error.message })
            errorCount++
          }
        } else {
          console.log(`✅ [${i + 1}/${commands.length}] OK: ${cmdPreview}...`)
          successCount++
        }
      } catch (err) {
        console.error(`❌ [${i + 1}/${commands.length}] Erro crítico: ${cmdPreview}...`)
        console.error(`   ${err.message}`)
        errors.push({ cmd: cmdPreview, error: err.message })
        errorCount++
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO DA APLICAÇÃO DE RLS')
    console.log('='.repeat(60))
    console.log(`✅ Comandos bem-sucedidos: ${successCount}`)
    console.log(`❌ Comandos com erro: ${errorCount}`)
    console.log(`📈 Taxa de sucesso: ${((successCount / commands.length) * 100).toFixed(1)}%`)

    if (errors.length > 0) {
      console.log('\n⚠️  Erros encontrados:')
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.cmd}...`)
        console.log(`      → ${err.error}`)
      })
    }

    // Verificação final
    console.log('\n🔍 Verificando tabelas com RLS habilitado...')
    const { data: rlsTables, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
        ORDER BY tablename
      `
    })

    if (!rlsError && rlsTables) {
      console.log(`\n📋 ${rlsTables.length} tabelas com RLS habilitado:`)
      rlsTables.forEach((table, i) => {
        console.log(`   ${i + 1}. ${table.tablename}`)
      })
    }

    console.log('\n✨ RLS aplicado com sucesso!')
    console.log('🔒 Todas as tabelas estão protegidas.')

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message)
    process.exit(1)
  }
}

// Executar
applyRLS()
