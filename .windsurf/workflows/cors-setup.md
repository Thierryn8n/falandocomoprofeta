---
description: Configuração CORS restrita e segura para o app
---

# CORS (Cross-Origin Resource Sharing) - FALANDO COMO PROFETA

## Visão Geral

O CORS está configurado em **3 camadas** de proteção:

1. **Middleware** (`middleware.ts`) - Verifica todas as requisições
2. **API Routes** (`lib/cors.ts`) - Proteção adicional para APIs
3. **Next Config** (`next.config.js`) - Headers de segurança

## Origens Permitidas (Whitelist)

### Produção
```javascript
const ALLOWED_ORIGINS = [
  'https://falandocomoprofeta.com.br',
  'https://www.falandocomoprofeta.com.br',
  'https://falandocomoprofeta.vercel.app',
  'https://falandocomoprofeta-git-app-com-supabase-thierryn8n.vercel.app',
]
```

### Desenvolvimento
```javascript
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
]
```

## Arquivos Criados

1. **`middleware.ts`** - Middleware de CORS para todas as rotas
2. **`lib/cors.ts`** - Utilitários para API routes
3. **`.windsurf/workflows/cors-setup.md`** - Este documento

## Como Funciona

### 1. Middleware (Primeira Linha de Defesa)

- Intercepta TODAS as requisições
- Verifica o header `Origin`
- Se origem não permitida → Bloqueia com 403
- Adiciona headers de segurança (CSP, X-Frame-Options, etc.)

### 2. API Routes (Segunda Linha)

Use nos handlers da API:

```typescript
import { withCorsProtection } from '@/lib/cors'

export async function POST(request: NextRequest) {
  return withCorsProtection(request, async () => {
    // Seu código aqui
    return NextResponse.json({ data })
  })
}
```

### 3. Next Config (Terceira Linha)

- Headers de segurança em todas as respostas
- Configuração de CSP (Content Security Policy)

## Headers de Segurança Adicionados

| Header | Valor | Proteção |
|--------|-------|----------|
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Proteção XSS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controle de referrer |
| `Content-Security-Policy` | CSP restritivo | Previne injeção de código |
| `Permissions-Policy` | Restritivo | Controle de APIs do browser |

## Adicionar Novo Domínio

Para adicionar um novo domínio permitido, edite em **3 lugares**:

1. `middleware.ts` - `ALLOWED_ORIGINS` array
2. `lib/cors.ts` - `ALLOWED_ORIGINS` array
3. `next.config.js` - `ALLOWED_ORIGINS` array

```javascript
const ALLOWED_ORIGINS = [
  // ... existentes
  'https://novo-dominio.com.br', // ← Adicionar aqui
]
```

## Testar CORS

### Usando curl

```bash
# Deve funcionar (origem permitida)
curl -H "Origin: https://falandocomoprofeta.com.br" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://seu-app.vercel.app/api/chat

# Deve falhar (origem não permitida)
curl -H "Origin: https://site-malicioso.com" \
     -X GET \
     https://seu-app.vercel.app/api/chat
```

### Usando browser

1. Abra o DevTools (F12)
2. Vá para Console/Network
3. Tente fazer uma requisição de outro domínio
4. Deve ver: `CORS error: Origin not allowed`

## Logs

Requisições bloqueadas são logadas no console:

```
🚫 CORS blocked request from unauthorized origin: https://site-malicioso.com
   Path: /api/chat
   Method: POST
```

## Troubleshooting

### Erro: "CORS error: Origin not allowed"

- Verifique se o domínio está na whitelist
- Adicione o domínio aos 3 arquivos de configuração
- Redeploy da aplicação

### Erro: "blocked by CORS policy"

- Verifique se o middleware está sendo executado
- Confira os headers na aba Network do DevTools
- Verifique se `Vary: Origin` está presente

### Preflight (OPTIONS) falhando

- O middleware já lida com OPTIONS automaticamente
- Verifique se o método HTTP está em `Access-Control-Allow-Methods`

## Segurança

⚠️ **Nunca**:
- Use `Access-Control-Allow-Origin: *` (wildcards)
- Permita origens dinâmicas sem verificação
- Ignore preflight requests

✅ **Sempre**:
- Mantenha a whitelist atualizada
- Use `Vary: Origin` para cache correto
- Valide origens no servidor (não só no cliente)
- Adicione headers de segurança extras

## Monitoramento

Configure alertas para:
- Tentativas de acesso de origens não permitidas
- Mudanças nos arquivos de configuração CORS
- Erros 403 relacionados a CORS
