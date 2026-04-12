// Teste de API para verificar conexão com Supabase e dados da Bíblia
// Execute com: node test-api.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'sua-url-do-supabase';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sua-chave-anon';

async function testAPI() {
  console.log('🧪 Iniciando testes de API...\n');

  // Teste 1: Verificar variáveis de ambiente
  console.log('Teste 1: Verificando configuração...');
  if (SUPABASE_URL === 'sua-url-do-supabase' || SUPABASE_ANON_KEY === 'sua-chave-anon') {
    console.warn('⚠️  Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
  } else {
    console.log('✅ Configuração OK\n');
  }

  try {
    // Teste 2: Consultar dados de Marcos
    console.log('Teste 2: Consultando livro de Marcos...');
    const marcosResponse = await fetch(`${SUPABASE_URL}/rest/v1/bible_verses?book=eq.Marcos&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (marcosResponse.ok) {
      const marcosData = await marcosResponse.json();
      console.log(`✅ Marcos: ${marcosData.length} versículos encontrados`);
      if (marcosData.length > 0) {
        console.log('   Exemplo:', JSON.stringify(marcosData[0], null, 2).substring(0, 150) + '...\n');
      }
    } else {
      console.error(`❌ Erro ao consultar Marcos: ${marcosResponse.status} ${marcosResponse.statusText}`);
      const errorText = await marcosResponse.text();
      console.error('   Detalhes:', errorText, '\n');
    }

    // Teste 3: Consultar dados de Lucas
    console.log('Teste 3: Consultando livro de Lucas...');
    const lucasResponse = await fetch(`${SUPABASE_URL}/rest/v1/bible_verses?book=eq.Lucas&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (lucasResponse.ok) {
      const lucasData = await lucasResponse.json();
      console.log(`✅ Lucas: ${lucasData.length} versículos encontrados\n`);
    } else {
      console.error(`❌ Erro ao consultar Lucas: ${lucasResponse.status}\n`);
    }

    // Teste 4: Consultar dados de João
    console.log('Teste 4: Consultando livro de João...');
    const joaoResponse = await fetch(`${SUPABASE_URL}/rest/v1/bible_verses?book=eq.João&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (joaoResponse.ok) {
      const joaoData = await joaoResponse.json();
      console.log(`✅ João: ${joaoData.length} versículos encontrados\n`);
    } else {
      console.error(`❌ Erro ao consultar João: ${joaoResponse.status}\n`);
    }

    // Teste 5: Consultar dados de Atos
    console.log('Teste 5: Consultando livro de Atos...');
    const atosResponse = await fetch(`${SUPABASE_URL}/rest/v1/bible_verses?book=eq.Atos&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (atosResponse.ok) {
      const atosData = await atosResponse.json();
      console.log(`✅ Atos: ${atosData.length} versículos encontrados\n`);
    } else {
      console.error(`❌ Erro ao consultar Atos: ${atosResponse.status}\n`);
    }

    // Teste 6: Contar total de versículos
    console.log('Teste 6: Contando total de versículos...');
    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/bible_verses?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    if (countResponse.ok) {
      const count = countResponse.headers.get('content-range');
      console.log(`📊 Total de versículos: ${count || 'N/A'}\n`);
    }

    console.log('✅ Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error('\nVerifique se:');
    console.error('1. O Supabase está online');
    console.error('2. As credenciais estão corretas');
    console.error('3. A tabela bible_verses existe');
    console.error('4. As políticas RLS estão configuradas corretamente');
  }
}

// Executar testes
testAPI();
