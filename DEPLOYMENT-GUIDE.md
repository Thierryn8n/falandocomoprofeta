# Guia de Deploy - Falando com o Profeta

## 🚀 Deploy em Produção

### **Pré-requisitos**
- ✅ Conta Vercel configurada
- ✅ Banco Supabase configurado
- ✅ Chave de API do Google Gemini válida

### **Variáveis de Ambiente Necessárias**
\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Database (se necessário)
DATABASE_URL=sua_url_database
\`\`\`

### **Passos para Deploy**

#### **1. Preparação do Banco de Dados**
\`\`\`sql
-- Execute TODOS os scripts na ordem:
-- scripts/01-create-tables.sql
-- scripts/02-enable-rls.sql
-- scripts/03-seed-data.sql
-- ...
-- scripts/28-fix-api-keys-and-test.sql
-- scripts/29-complete-rls-disable.sql
\`\`\`

#### **2. Configuração da API Key**
- Acesse `/admin` após o deploy
- Configure a chave do Google Gemini
- Teste a conectividade

#### **3. Deploy na Vercel**
\`\`\`bash
# Via CLI
vercel --prod

# Ou via GitHub
# Push para branch main
git push origin main
\`\`\`

### **Verificações Pós-Deploy**
- ✅ Chat funcionando
- ✅ Conversas sendo salvas
- ✅ Autenticação funcionando
- ✅ Painel admin acessível

### **URLs Importantes**
- **App Principal**: `https://seu-dominio.vercel.app`
- **Admin Panel**: `https://seu-dominio.vercel.app/admin`
- **API Health**: `https://seu-dominio.vercel.app/api/test-api`

## 🔒 Segurança

### **Configurações de Segurança**
- ✅ RLS desabilitado (necessário para funcionamento)
- ✅ Chaves de API protegidas
- ✅ Autenticação via Supabase
- ✅ HTTPS obrigatório

### **Monitoramento**
- Logs da Vercel
- Métricas do Supabase
- Console do navegador

---

*Status: Sistema pronto para produção* ✅
