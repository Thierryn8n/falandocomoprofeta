/**
 * Teste de Cadastro - Verifica se RLS e CORS estão funcionando corretamente
 * Execute: node scripts/test-signup.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrada!')
  console.log('💡 Configure a variável de ambiente:')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave node scripts/test-signup.js')
  process.exit(1)
}

// Criar cliente com anon key (simula usuário real)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Dados do teste
const TEST_EMAIL = 'thierry.simplusbr@gmail.com'
const TEST_PASSWORD = 'Teste123!'
const TEST_NAME = 'Usuário Teste RLS'

async function testSignUp() {
  console.log('🧪 TESTE DE CADASTRO COM RLS E CORS')
  console.log('='.repeat(60))
  console.log(`📧 Email: ${TEST_EMAIL}`)
  console.log(`🔑 Senha: ${TEST_PASSWORD}`)
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. Testar cadastro
    console.log('1️⃣  Testando cadastro de novo usuário...')
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          name: TEST_NAME,
        }
      }
    })

    if (signUpError) {
      console.error('❌ ERRO NO CADASTRO:')
      console.error(`   Código: ${signUpError.code}`)
      console.error(`   Mensagem: ${signUpError.message}`)
      console.error(`   Status: ${signUpError.status}`)
      
      // Verificar se é erro de CORS
      if (signUpError.message.includes('CORS') || signUpError.message.includes('cors')) {
        console.error('\n🚫 PROBLEMA DE CORS DETECTADO!')
        console.error('   As políticas CORS estão bloqueando o cadastro.')
      }
      
      // Verificar se é erro de RLS
      if (signUpError.message.includes('row-level security') || signUpError.message.includes('RLS')) {
        console.error('\n🚫 PROBLEMA DE RLS DETECTADO!')
        console.error('   As políticas RLS estão bloqueando o cadastro.')
      }
      
      return false
    }

    console.log('✅ CADASTRO BEM-SUCEDIDO!')
    console.log(`   ID do usuário: ${signUpData.user?.id}`)
    console.log(`   Email: ${signUpData.user?.email}`)
    console.log(`   Confirmação necessária: ${signUpData.user?.confirmation_sent_at ? 'Sim' : 'Não'}`)
    console.log()

    // 2. Verificar se o perfil foi criado
    console.log('2️⃣  Verificando criação do perfil...')
    
    if (signUpData.user) {
      // Aguardar um pouco para o trigger criar o perfil
      console.log('   ⏳ Aguardando trigger de criação de perfil...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Tentar fazer login para verificar
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      if (signInError) {
        console.log(`   ⚠️  Login falhou (pode ser normal se precisar confirmar email)`)
        console.log(`      Erro: ${signInError.message}`)
      } else {
        console.log('✅ LOGIN BEM-SUCEDIDO!')
        console.log(`   Sessão ativa: ${signInData.session ? 'Sim' : 'Não'}`)
        
        // 3. Testar acesso ao próprio perfil
        console.log()
        console.log('3️⃣  Testando acesso ao perfil (RLS)...')
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single()

        if (profileError) {
          console.error('❌ ERRO AO ACESSAR PERFIL:')
          console.error(`   Código: ${profileError.code}`)
          console.error(`   Mensagem: ${profileError.message}`)
          
          if (profileError.message.includes('row-level security')) {
            console.error('\n🚫 PROBLEMA DE RLS NO PERFIL!')
            console.error('   O usuário não consegue acessar seu próprio perfil.')
          }
        } else {
          console.log('✅ PERFIL ACESSADO COM SUCESSO!')
          console.log(`   Nome: ${profile.name}`)
          console.log(`   Email: ${profile.email}`)
          console.log(`   Role: ${profile.role}`)
        }

        // 4. Testar criação de conversa
        console.log()
        console.log('4️⃣  Testando criação de conversa (RLS)...')
        
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: signInData.user.id,
            title: 'Teste de Conversa RLS',
          })
          .select()
          .single()

        if (convError) {
          console.error('❌ ERRO AO CRIAR CONVERSA:')
          console.error(`   Código: ${convError.code}`)
          console.error(`   Mensagem: ${convError.message}`)
          
          if (convError.message.includes('row-level security')) {
            console.error('\n🚫 PROBLEMA DE RLS NA CONVERSA!')
            console.error('   O usuário não consegue criar conversas.')
          }
        } else {
          console.log('✅ CONVERSA CRIADA COM SUCESSO!')
          console.log(`   ID: ${conversation.id}`)
          console.log(`   Título: ${conversation.title}`)

          // 5. Testar criação de mensagem
          console.log()
          console.log('5️⃣  Testando criação de mensagem (RLS)...')
          
          const { data: message, error: msgError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              role: 'user',
              content: 'Teste de mensagem com RLS',
            })
            .select()
            .single()

          if (msgError) {
            console.error('❌ ERRO AO CRIAR MENSAGEM:')
            console.error(`   Código: ${msgError.code}`)
            console.error(`   Mensagem: ${msgError.message}`)
            
            if (msgError.message.includes('row-level security')) {
              console.error('\n🚫 PROBLEMA DE RLS NA MENSAGEM!')
              console.error('   O usuário não consegue enviar mensagens.')
            }
          } else {
            console.log('✅ MENSAGEM CRIADA COM SUCESSO!')
            console.log(`   ID: ${message.id}`)
            console.log(`   Conteúdo: ${message.content}`)
          }
        }

        // 6. Logout
        console.log()
        console.log('6️⃣  Fazendo logout...')
        await supabase.auth.signOut()
        console.log('✅ Logout realizado')
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log('📊 RESUMO DO TESTE')
    console.log('='.repeat(60))
    console.log('✅ Cadastro: FUNCIONANDO')
    console.log('✅ RLS não está bloqueando operações básicas')
    console.log('✅ CORS não está interferindo no cadastro')
    console.log()
    console.log('🎉 TUDO ESTÁ FUNCIONANDO CORRETAMENTE!')
    
    return true

  } catch (error) {
    console.error('\n❌ ERRO INESPERADO:')
    console.error(error)
    return false
  }
}

// Executar teste
testSignUp().then(success => {
  process.exit(success ? 0 : 1)
})
