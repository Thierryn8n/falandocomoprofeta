const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  try {
    console.log(`🔄 Lendo arquivo SQL: ${filePath}`);

    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Dividir o SQL em statements individuais
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📋 Total de comandos SQL a executar: ${statements.length}`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const shortStmt = stmt.substring(0, 50).replace(/\s+/g, ' ');

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });

        if (error) {
          console.log(`⚠️  Comando ${i + 1} (${shortStmt}...): ${error.message}`);
        } else {
          console.log(`✅ Comando ${i + 1} (${shortStmt}...): OK`);
        }
      } catch (err) {
        console.log(`⚠️  Comando ${i + 1} (${shortStmt}...): ${err.message}`);
      }
    }

    console.log('\n✅ Execução concluída!');
    console.log('📝 Verifique o Supabase Dashboard para confirmar as alterações.');

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
    process.exit(1);
  }
}

// Executar o arquivo SQL passado como argumento ou o padrão
const sqlFile = process.argv[2] || 'fix-rls-recursion.sql';
executeSQLFile(sqlFile);
