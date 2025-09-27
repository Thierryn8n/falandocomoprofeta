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

async function testHeresyQuery() {
  try {
    console.log('🔍 Testando consulta dos logs de heresia...');
    
    // Testar a consulta exata do componente
    console.log('\n1. Testando consulta com JOINs...');
    const { data: joinData, error: joinError } = await supabase
      .from('heresy_logs')
      .select(`
        *,
        user_profile:profiles!heresy_logs_user_id_fkey (email, name),
        heresy_phrase:heresy_responses!heresy_logs_detected_heresy_id_fkey (heresy_phrase)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 9);

    if (joinError) {
      console.log('❌ Erro na consulta com JOINs:', joinError);
    } else {
      console.log(`✅ Consulta com JOINs funcionou: ${joinData.length} registros`);
      console.log('📋 Primeiro registro:', JSON.stringify(joinData[0], null, 2));
    }

    // Testar consulta simples sem JOINs
    console.log('\n2. Testando consulta simples...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('heresy_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (simpleError) {
      console.log('❌ Erro na consulta simples:', simpleError);
    } else {
      console.log(`✅ Consulta simples funcionou: ${simpleData.length} registros`);
      console.log('📋 Primeiro registro:', JSON.stringify(simpleData[0], null, 2));
    }

    // Verificar se as tabelas relacionadas existem
    console.log('\n3. Verificando tabelas relacionadas...');
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .limit(3);

    if (profilesError) {
      console.log('❌ Erro ao acessar profiles:', profilesError);
    } else {
      console.log(`✅ Tabela profiles acessível: ${profilesData.length} registros`);
    }

    const { data: heresyResponsesData, error: heresyResponsesError } = await supabase
      .from('heresy_responses')
      .select('id, heresy_phrase')
      .limit(3);

    if (heresyResponsesError) {
      console.log('❌ Erro ao acessar heresy_responses:', heresyResponsesError);
    } else {
      console.log(`✅ Tabela heresy_responses acessível: ${heresyResponsesData.length} registros`);
    }

    // Testar JOIN alternativo
    console.log('\n4. Testando JOIN alternativo...');
    const { data: altData, error: altError } = await supabase
      .from('heresy_logs')
      .select(`
        *,
        profiles (email, name),
        heresy_responses (heresy_phrase)
      `)
      .limit(5);

    if (altError) {
      console.log('❌ Erro no JOIN alternativo:', altError);
    } else {
      console.log(`✅ JOIN alternativo funcionou: ${altData.length} registros`);
      console.log('📋 Primeiro registro:', JSON.stringify(altData[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testHeresyQuery();