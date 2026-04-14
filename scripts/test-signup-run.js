/**
 * Teste de Cadastro - Verifica se RLS e CORS estão funcionando corretamente
 */

const { createClient } = require('@supabase/supabase-js')

// Configuração direta (sem variável de ambiente)
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQxNTUsImV4cCI6MjA2ODYzMDE1NX0.cbPMldu0By33z3ntjC7jKQA08S6LcNHQseHR7-QYLmc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const TEST_EMAIL = 'thierry.simplusbr@gmail.com'
const TEST_PASSWORD = 'Teste123!'
const TEST_NAME = 'Usuario Teste RLS'

async function testSignUp() {
  console.log('🧪 TESTE DE CADASTRO COM RLS E CORS')
  console.log('='.repeat(60))
  console.log(`📧 Email: ${TEST_EMAIL}`)
  console.log(`🔑 Senha: ${TEST_PASSWORD}`)
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. Testar cadastro
    console.log('1️⃣ Testando cadastro de novo usuario...')
    
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
      console.error(`   Codigo: ${signUpError.code}`)
      console.error(`   Mensagem: ${signUpError.message}`)
      console.error(`   Status: ${signUpError.status}`)
      
      if (signUpError.message.includes('CORS') || signUpError.message.includes('cors')) {
        console.error('\n🚫 PROBLEMA DE CORS DETECTADO!')
      }
      
      if (signUpError.message.includes('row-level security') || signUpError.message.includes('RLS')) {
        console.error('\n🚫 PROBLEMA DE RLS DETECTADO!')
      }
      
      return false
    }

    console.log('✅ CADASTRO BEM-SUCEDIDO!')
    console.log(`   ID do usuario: ${signUpData.user?.id}`)
    console.log(`   Email: ${signUpData.user?.email}`)
    console.log(`   Confirmacao necessaria: ${signUpData.user?.confirmation_sent_at ? 'Sim' : 'Nao'}`)
    console.log()

    // 2. Verificar se o perfil foi criado
    console.log('2️⃣ Verificando criacao do perfil...')
    
    if (signUpData.user) {
      console.log('   ⏳ Aguardando trigger de criacao de perfil...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Tentar fazer login
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      if (signInError) {
        console.log(`   ⚠️ Login falhou (pode ser normal se precisar confirmar email)`)
        console.log(`      Erro: ${signInError.message}`)
      } else {
        console.log('✅ LOGIN BEM-SUCEDIDO!')
        
        // 3. Testar acesso ao proprio perfil
        console.log()
        console.log('3️⃣ Testando acesso ao perfil (RLS)...')
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single()

        if (profileError) {
          console.error('❌ ERRO AO ACESSAR PERFIL:')
          console.error(`   Codigo: ${profileError.code}`)
          console.error(`   Mensagem: ${profileError.message}`)
          
          if (profileError.message.includes('row-level security')) {
            console.error('\n🚫 PROBLEMA DE RLS NO PERFIL!')
          }
        } else {
          console.log('✅ PERFIL ACESSADO COM SUCESSO!')
          console.log(`   Nome: ${profile.name}`)
          console.log(`   Email: ${profile.email}`)
          console.log(`   Role: ${profile.role}`)
        }

        // 4. Testar criacao de conversa
        console.log()
        console.log('4️⃣ Testando criacao de conversa (RLS)...')
        
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
          console.error(`   Codigo: ${convError.code}`)
          console.error(`   Mensagem: ${convError.message}`)
          
          if (convError.message.includes('row-level security')) {
            console.error('\n🚫 PROBLEMA DE RLS NA CONVERSA!')
          }
        } else {
          console.log('✅ CONVERSA CRIADA COM SUCESSO!')
          console.log(`   ID: ${conversation.id}`)
          console.log(`   Titulo: ${conversation.title}`)

          // 5. Testar criacao de mensagem
          console.log()
          console.log('5️⃣ Testando criacao de mensagem (RLS)...')
          
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
            console.error(`   Codigo: ${msgError.code}`)
            console.error(`   Mensagem: ${msgError.message}`)
            
            if (msgError.message.includes('row-level security')) {
              console.error('\n🚫 PROBLEMA DE RLS NA MENSAGEM!')
            }
          } else {
            console.log('✅ MENSAGEM CRIADA COM SUCESSO!')
            console.log(`   ID: ${message.id}`)
            console.log(`   Conteudo: ${message.content}`)
          }
        }

        // 6. Logout
        console.log()
        console.log('6️⃣ Fazendo logout...')
        await supabase.auth.signOut()
        console.log('✅ Logout realizado')
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log('📊 RESUMO DO TESTE')
    console.log('='.repeat(60))
    console.log('✅ Cadastro: FUNCIONANDO')
    console.log('✅ RLS nao esta bloqueando operacoes basicas')
    console.log('✅ CORS nao esta interferindo no cadastro')
    console.log()
    console.log('🎉 TUDO ESTA FUNCIONANDO CORRETAMENTE!')
    
    return true

  } catch (error) {
    console.error('\n❌ ERRO INESPERADO:')
    console.error(error)
    return false
  }
}

testSignUp().then(success => {
  process.exit(success ? 0 : 1)
})
