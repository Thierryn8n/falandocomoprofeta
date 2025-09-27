import crypto from 'crypto'

// Chave de criptografia derivada de variáveis de ambiente
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 32) || 'default-key-change-in-production'
const ALGORITHM = 'aes-256-gcm'

/**
 * Criptografa um texto usando AES-256-GCM
 * @param text Texto a ser criptografado
 * @returns Objeto com texto criptografado, IV e tag de autenticação
 */
export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  if (!text) return { encrypted: '', iv: '', tag: '' }
  
  try {
    // Gera um IV (Initialization Vector) aleatório
    const iv = crypto.randomBytes(16)
    
    // Cria o cipher
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
    cipher.setAAD(Buffer.from('mercado-pago-credentials', 'utf8'))
    
    // Criptografa o texto
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Obtém a tag de autenticação
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  } catch (error) {
    console.error('Erro na criptografia:', error)
    throw new Error('Falha ao criptografar dados sensíveis')
  }
}

/**
 * Descriptografa um texto usando AES-256-GCM
 * @param encryptedData Objeto com dados criptografados
 * @returns Texto descriptografado
 */
export function decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
  if (!encryptedData.encrypted) return ''
  
  try {
    // Cria o decipher
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    decipher.setAAD(Buffer.from('mercado-pago-credentials', 'utf8'))
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
    
    // Descriptografa o texto
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Erro na descriptografia:', error)
    throw new Error('Falha ao descriptografar dados sensíveis')
  }
}

/**
 * Criptografa credenciais do Mercado Pago
 * @param credentials Credenciais a serem criptografadas
 * @returns Credenciais criptografadas
 */
export function encryptCredentials(credentials: {
  publicKey?: string
  accessToken?: string
  clientId?: string
  clientSecret?: string
}) {
  return {
    publicKey: credentials.publicKey ? encrypt(credentials.publicKey) : null,
    accessToken: credentials.accessToken ? encrypt(credentials.accessToken) : null,
    clientId: credentials.clientId ? encrypt(credentials.clientId) : null,
    clientSecret: credentials.clientSecret ? encrypt(credentials.clientSecret) : null
  }
}

/**
 * Descriptografa credenciais do Mercado Pago
 * @param encryptedCredentials Credenciais criptografadas
 * @returns Credenciais descriptografadas
 */
export function decryptCredentials(encryptedCredentials: {
  publicKey?: { encrypted: string; iv: string; tag: string } | null
  accessToken?: { encrypted: string; iv: string; tag: string } | null
  clientId?: { encrypted: string; iv: string; tag: string } | null
  clientSecret?: { encrypted: string; iv: string; tag: string } | null
}) {
  return {
    publicKey: encryptedCredentials.publicKey ? decrypt(encryptedCredentials.publicKey) : '',
    accessToken: encryptedCredentials.accessToken ? decrypt(encryptedCredentials.accessToken) : '',
    clientId: encryptedCredentials.clientId ? decrypt(encryptedCredentials.clientId) : '',
    clientSecret: encryptedCredentials.clientSecret ? decrypt(encryptedCredentials.clientSecret) : ''
  }
}