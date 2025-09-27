const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Ler variáveis de ambiente do .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseServiceKey = '';

envLines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseServiceKey = line.split('=')[1].trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixHeresyLogsRLS() {
  try {
    console.log('🔄 Corrigindo políticas RLS da tabela heresy_logs...');
    
    // Executar SQL usando rpc
    const sqlCommands = [
      "DROP POLICY IF EXISTS \"Allow authenticated users to insert heresy logs\" ON public.heresy_logs;",
      "DROP POLICY IF EXISTS \"Allow admins to read all heresy logs\" ON public.heresy_logs;",
      "ALTER TABLE public.heresy_logs ENABLE ROW LEVEL SECURITY;",
      `CREATE POLICY "heresy_logs_insert_policy" ON public.heresy_logs
        FOR INSERT
        TO authenticated
        WITH CHECK (true);`,
      `CREATE POLICY "heresy_logs_select_policy" ON public.heresy_logs
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
          )
        );`
    ];

    for (const sql of sqlCommands) {
      console.log(`Executando: ${sql.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else {
        console.log('✅ Comando executado com sucesso');
      }
    }

    console.log('\n🧪 Testando políticas após correção...');
    
    // Testar se as políticas estão funcionando
    const { data: testData, error: testError } = await supabase
      .from('heresy_logs')
      .select('*')
      .limit(3);
    
    if (testError) {
      console.log('❌ Erro no teste:', testError.message);
    } else {
      console.log(`✅ Teste bem-sucedido: ${testData.length} registros encontrados`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixHeresyLogsRLS();