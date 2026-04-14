/**
 * Script para corrigir recursão infinita nas políticas RLS
 * Execute: node scripts/apply-rls-fix.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sqlCommands = [
  // Remover políticas problemáticas
  `DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;`,
  `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;`,
  `DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;`,
  `DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;`,
  
  // Desabilitar e re-habilitar RLS
  `ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
  
  // Criar políticas simples sem recursão
  `CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);`,
  `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);`,
  `CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
  
  // Remover políticas de admin com recursão
  `DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;`,
  `DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;`,
  `DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics;`,
  `DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;`,
  `DROP POLICY IF EXISTS "Admins can view heresy logs" ON public.heresy_logs;`,
  `DROP POLICY IF EXISTS "Admins can manage api keys" ON public.api_keys;`,
  
  // Criar função is_admin (se ainda não existir)
  `CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid) RETURNS boolean AS $$ BEGIN RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'); END; $$ LANGUAGE plpgsql SECURITY DEFINER;`,
]

async function applyFix() {
  console.log('🔧 CORRIGINDO RECURSÃO INFINITA NO RLS...\n')
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i]
    const preview = sql.substring(0, 60).replace(/\s+/g, ' ')
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`⏭️  [${i+1}/${sqlCommands.length}] Ignorado: ${preview}...`)
          successCount++
        } else {
          console.error(`❌ [${i+1}/${sqlCommands.length}] Erro: ${preview}...`)
          console.error(`   ${error.message}`)
          errorCount++
        }
      } else {
        console.log(`✅ [${i+1}/${sqlCommands.length}] OK: ${preview}...`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ [${i+1}/${sqlCommands.length}] Erro crítico: ${preview}...`)
      console.error(`   ${err.message}`)
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60))
  console.log(`✅ Comandos bem-sucedidos: ${successCount}`)
  console.log(`❌ Comandos com erro: ${errorCount}`)
  console.log('\n✨ Correção aplicada! Recursão infinita deve estar resolvida.')
  console.log('🔄 Recarregue a página do app para testar.')
}

applyFix()
