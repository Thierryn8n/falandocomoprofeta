---
description: Setup completo de Row Level Security (RLS) para todo o app
---

# RLS (Row Level Security) - FALANDO COMO PROFETA

## Visão Geral

Este workflow descreve como implementar RLS em todas as tabelas do aplicativo para garantir segurança e privacidade dos dados.

## Arquivos Criados

1. **`scripts/80-complete-rls-setup.sql`** - Script SQL completo com todas as políticas RLS
2. **`scripts/apply-rls.js`** - Script Node.js para aplicar o SQL automaticamente
3. **`.windsurf/workflows/rls-setup.md`** - Este documento

## Tabelas Protegidas

### 1. Usuários e Perfis
- `profiles` - Usuários só veem/editam seu próprio perfil

### 2. Chat e Conversas
- `conversations` - Usuários só acessam suas conversas
- `messages` - Usuários só veem mensagens de suas conversas
- `message_attachments` - Anexos protegidos por ownership

### 3. Documentos
- `documents` - Leitura pública, edição apenas por admins

### 4. Configurações
- `app_config` - Leitura pública, modificação por admins
- `api_keys` - Apenas admins
- `radio_config` - Leitura pública, modificação por admins

### 5. Assinaturas
- `user_subscriptions` - Usuários só veem suas assinaturas
- `subscription_plans` - Leitura pública, modificação por admins

### 6. Análise e Logs
- `analytics` - Apenas admins
- `system_logs` - Apenas admins

### 7. Moderação (Heresia)
- `heresy_logs` - Apenas admins
- `heresy_responses` - Leitura pública, modificação por admins

### 8. Estudos Bíblicos
- `bible_study_panels` - Usuários só acessam seus painéis
- `canvas_elements` - Elementos protegidos por ownership

### 9. Online/Rádio
- `online_users` - Usuários só veem seu próprio status

## Como Aplicar

### Opção 1: Script Automatizado (Recomendado)

```bash
# Configure a variável de ambiente
export SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui

# Execute o script
node scripts/apply-rls.js
```

### Opção 2: SQL Direto no Supabase Dashboard

1. Acesse o dashboard do Supabase
2. Vá para "SQL Editor"
3. Cole o conteúdo de `scripts/80-complete-rls-setup.sql`
4. Execute o script

### Opção 3: Usando a API

```javascript
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(url, serviceRoleKey)
const sql = fs.readFileSync('scripts/80-complete-rls-setup.sql', 'utf8')

// Execute via RPC
const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
```

## Verificação

Após aplicar, verifique se RLS está funcionando:

```sql
-- Listar tabelas com RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Listar políticas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Políticas Padrão

### Usuário Comum
- ✅ Ver/editar próprio perfil
- ✅ Ver/criar/editar/deletar próprias conversas
- ✅ Ver/criar mensagens em conversas próprias
- ✅ Ver documentos públicos
- ✅ Ver configurações do app
- ✅ Ver planos de assinatura
- ✅ Ver respostas de heresia

### Admin
- ✅ Todas as permissões de usuário
- ✅ Ver/editar todos os perfis
- ✅ Ver todas as conversas e mensagens
- ✅ Gerenciar documentos
- ✅ Gerenciar configurações
- ✅ Ver analytics e logs
- ✅ Gerenciar assinaturas
- ✅ Moderar heresia

## Segurança

⚠️ **Importante:**
- Sempre use `SUPABASE_SERVICE_ROLE_KEY` para executar scripts de setup
- Nunca exponha a service key no frontend
- Teste as políticas com usuários reais antes de deploy
- Monitore logs de acesso para detectar problemas

## Troubleshooting

### Erro: "policy already exists"
- O script já lida com isso (ignora automaticamente)

### Erro: "does not exist"
- A tabela pode não existir ainda (ignora automaticamente)

### Erro: "permission denied"
- Verifique se está usando a Service Role Key (não a anon key)

### Dados não aparecem
- Verifique se as políticas foram aplicadas corretamente
- Teste com `SELECT * FROM table_name` como usuário autenticado
