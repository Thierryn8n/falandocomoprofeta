# Guia de Configuração no Vercel

## 1. Configuração das Variáveis de Ambiente

Acesse o painel do Vercel e configure as seguintes variáveis:

### Variáveis Obrigatórias:
- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `GEMINI_API_KEY`: Sua chave da API do Google Gemini

### Como obter a chave do Gemini:
1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

## 2. Configuração no Painel Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em "Settings" → "Environment Variables"
4. Adicione cada variável:
   - Name: `GEMINI_API_KEY`
   - Value: `sua_chave_aqui`
   - Environment: Production, Preview, Development

## 3. Scripts SQL para Executar

Execute os scripts na seguinte ordem:

1. `scripts/48-insert-production-api-keys.sql`
2. `scripts/49-add-admin-ownership-columns.sql`
3. `scripts/50-create-admin-user.sql`
4. `scripts/51-add-radio-config.sql`

## 4. Configuração do Usuário Admin

1. Execute no Supabase SQL Editor:
\`\`\`sql
SELECT id, email, role FROM public.profiles ORDER BY created_at;
\`\`\`

2. Copie seu UUID e substitua no script 50:
\`\`\`sql
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = 'SEU_UUID_AQUI';
\`\`\`

## 5. Atualização das Chaves

No script 48, substitua:
- `'SUA_CHAVE_GEMINI_AQUI'` pela sua chave real do Gemini

## 6. Deploy

Após configurar tudo:
1. Faça commit das mudanças
2. O Vercel fará deploy automaticamente
3. Teste a aplicação

## 7. Verificação

Para verificar se tudo está funcionando:
1. Acesse a aplicação
2. Faça login como admin
3. Vá em Admin → APIs & Chaves
4. Verifique se as chaves estão configuradas
5. Teste o chat com IA
6. Teste o player de rádio

## Troubleshooting

### Erro "Gemini API key not found":
- Verifique se a variável `GEMINI_API_KEY` está configurada no Vercel
- Verifique se a chave no banco de dados está correta

### Erro "Permission denied":
- Verifique se o usuário tem role 'admin'
- Execute novamente o script 50 com o UUID correto

### Player de rádio não aparece:
- Verifique se o script 51 foi executado
- Vá em Admin → Rádio Web e ative o player
