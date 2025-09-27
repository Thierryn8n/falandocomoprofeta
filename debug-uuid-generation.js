// Script para testar geração de UUID no navegador
console.log('🧪 Testando geração de UUID...')

// Testar crypto.randomUUID()
try {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const uuid1 = crypto.randomUUID()
    const uuid2 = crypto.randomUUID()
    
    console.log('✅ crypto.randomUUID() disponível')
    console.log('🆔 UUID 1:', uuid1)
    console.log('🆔 UUID 2:', uuid2)
    console.log('📏 Comprimento UUID 1:', uuid1.length)
    console.log('📏 Comprimento UUID 2:', uuid2.length)
    console.log('🔄 UUIDs são diferentes:', uuid1 !== uuid2)
    
    // Verificar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    console.log('✅ UUID 1 formato válido:', uuidRegex.test(uuid1))
    console.log('✅ UUID 2 formato válido:', uuidRegex.test(uuid2))
    
  } else {
    console.error('❌ crypto.randomUUID() não disponível')
    console.log('🔍 crypto object:', typeof crypto)
    if (typeof crypto !== 'undefined') {
      console.log('🔍 crypto.randomUUID:', typeof crypto.randomUUID)
    }
  }
} catch (error) {
  console.error('❌ Erro ao testar crypto.randomUUID():', error)
}

// Função alternativa para gerar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

console.log('\n🔄 Testando função alternativa de UUID...')
const altUuid1 = generateUUID()
const altUuid2 = generateUUID()
console.log('🆔 Alt UUID 1:', altUuid1)
console.log('🆔 Alt UUID 2:', altUuid2)
console.log('🔄 Alt UUIDs são diferentes:', altUuid1 !== altUuid2)