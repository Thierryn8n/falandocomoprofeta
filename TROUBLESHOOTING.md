# Guia de Solução de Problemas - Falando com o Profeta

## 🚨 Problemas Comuns e Soluções

### **1. Erro: "models/gemini-pro is not found"**

**❌ Sintoma:**
\`\`\`
404 - models/gemini-pro is not found for API version v1beta
\`\`\`

**✅ Solução:**
- **Causa**: Modelo descontinuado pelo Google
- **Correção**: Já implementada no código - usa `gemini-1.5-flash`
- **Status**: ✅ RESOLVIDO

### **2. Conversas não estão sendo salvas**

**❌ Sintomas:**
- Mensagens aparecem no chat mas não ficam salvas
- Erro de permissão no banco de dados
- RLS bloqueando inserções

**✅ Solução:**
\`\`\`sql
-- Execute este script:
-- scripts/29-complete-rls-disable.sql
\`\`\`
- **Status**: ✅ RESOLVIDO

### **3. Chave de API não encontrada**

**❌ Sintoma:**
\`\`\`
❌ Chave da API do Gemini não encontrada
\`\`\`

**✅ Solução:**
\`\`\`sql
-- Execute este script:
-- scripts/28-fix-api-keys-and-test.sql
\`\`\`
- **Status**: ✅ RESOLVIDO

### **4. Interface não carrega**

**❌ Possíveis Causas:**
- Erro de build
- Dependências faltando
- Configuração incorreta

**✅ Soluções:**
1. **Reinstalar dependências:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Rebuild do projeto:**
   \`\`\`bash
   npm run build
   \`\`\`

3. **Verificar variáveis de ambiente:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **5. Erro de autenticação**

**❌ Sintomas:**
- Não consegue fazer login
- Sessão expira rapidamente
- Erro de token inválido

**✅ Soluções:**
1. **Verificar configuração do Supabase**
2. **Limpar cache do navegador**
3. **Verificar políticas de RLS** (devem estar desabilitadas)

## 🔧 Scripts de Diagnóstico

### **Verificar Status do Sistema**
\`\`\`sql
-- Verificar tabelas
SELECT table_name, row_security 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar chaves de API
SELECT provider, key_name, is_active 
FROM api_keys;

-- Verificar conversas
SELECT COUNT(*) as total_conversations 
FROM conversations;
\`\`\`

### **Logs Importantes**
- ✅ `🚀 CHAT API CALLED` - API foi chamada
- ✅ `✅ Gemini API key found` - Chave encontrada
- ✅ `🤖 Calling Gemini API with model: gemini-1.5-flash` - Modelo correto
- ✅ `✅ SAVE SUCCESSFUL!` - Conversa salva

## 📞 Suporte

### **Se o problema persistir:**

1. **Verificar logs do console** (F12 no navegador)
2. **Executar scripts SQL** na ordem correta
3. **Verificar configurações** no painel admin
4. **Reiniciar aplicação** se necessário

### **Contatos de Emergência:**
- **Desenvolvedor**: Disponível via chat
- **Documentação**: Este arquivo
- **Logs**: Console do navegador + servidor

---

*Última atualização: 21/01/2025*  
*Status: Todos os problemas conhecidos foram resolvidos* ✅
