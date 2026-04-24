// Script para fixar RLS via API REST do Supabase
// Execute: node fix-rls-api.js

const https = require('https');

const SUPABASE_URL = 'wlwwgnimfuvoxjecdnza.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          resolve({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🔄 Tentando corrigir RLS via API...\n');

  // Primeiro tentar criar a função exec_sql
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$\nBEGIN\n  EXECUTE sql;\nEND;\n$$;
`;

  console.log('1️⃣ Criando função exec_sql...');
  const result1 = await executeSQL(createFunctionSQL);
  console.log(result1.success ? '✅ Função criada' : `⚠️  ${result1.data}`);

  // Desabilitar RLS
  const disableRLSSQL = `
ALTER TABLE class_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
`;

  console.log('\n2️⃣ Desabilitando RLS...');
  const result2 = await executeSQL(disableRLSSQL);
  console.log(result2.success ? '✅ RLS desabilitado' : `⚠️  ${result2.data}`);

  console.log('\n✅ Processo concluído!');
  console.log('\nSe os comandos falharem, execute manualmente no SQL Editor:');
  console.log('https://supabase.com/dashboard/project/wlwwgnimfuvoxjecdnza/sql-editor');
  console.log('\nSQL para copiar:');
  console.log('----------------------------------------');
  console.log(disableRLSSQL.trim());
  console.log('----------------------------------------');
}

main().catch(console.error);
