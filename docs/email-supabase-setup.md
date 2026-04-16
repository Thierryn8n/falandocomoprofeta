# 📧 Configuração de Email do Supabase

Guia completo para personalizar os emails enviados pelo Supabase Authentication.

---

## 🎯 O que você vai aprender

1. Acessar as configurações de email no Supabase
2. Personalizar o template de **Recuperação de Senha**
3. Configurar o remetente (SMTP customizado)
4. Testar o envio de emails

---

## 📍 Passo 1: Acessar Configurações

### No Dashboard do Supabase:

1. Acesse: [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **"Authentication"** (ícone de usuário)
4. Clique na aba **"Email Templates"**

---

## 📝 Passo 2: Template "Reset Password"

### 2.1 Selecione o Template

Na lista de templates, clique em:
- **"Reset Password"** ou **"Recuperação de Senha**

### 2.2 Configure o Assunto (Subject)

```
🔐 Recupere seu acesso - Flando Como Profeta
```

Ou em inglês (padrão Supabase):
```
🔐 Reset Your Password - Flando Como Profeta
```

### 2.3 Cole o Template HTML

Abra o arquivo:
```
email-templates/reset-password-email.html
```

**Copie TODO o conteúdo** e cole no campo **"Body"** do Supabase.

---

## 🔧 Variáveis do Supabase (Substituições)

O Supabase usa variáveis especiais entre `{{ }}`:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{ .ConfirmationURL }}` | Link de recuperação | `https://seuapp.com/atualizar-senha#access_token=...` |
| `{{ .SiteURL }}` | URL base do seu site | `https://seuapp.com` |
| `{{ .Data.email }}` | Email do usuário | `usuario@email.com` |
| `{{ .Data.first_name }}` | Primeiro nome | `João` |
| `{{ .Data.year }}` | Ano atual | `2025` |

### ⚠️ Importante:

- Use **ponto (.)** antes do nome: `{{ .ConfirmationURL }}`
- Não use espaços: ❌ `{{ . ConfirmationURL }}` ✅ `{{ .ConfirmationURL }}`

---

## 🎨 Personalizações Disponíveis

### Cores do Template:

```css
/* Laranja Principal (Botões, destaques) */
#f97316

/* Laranja Escuro (Hover) */
#ea580c

/* Fundo do Header */
linear-gradient(135deg, #f97316 0%, #ea580c 100%)

/* Texto */
#1f2937 (títulos)
#6b7280 (parágrafos)
#9ca3af (footer)
```

### Para mudar as cores:

1. No HTML, procure pelos códigos de cor
2. Substitua pelo código HEX da cor desejada
3. Exemplo: `#f97316` → `#3b82f6` (azul)

---

## 🔗 Passo 3: Configurar URL de Redirecionamento

### No Supabase Dashboard:

1. Vá em **Authentication > URL Configuration**
2. Configure:

```
Site URL: https://seu-dominio.com
```

3. Em **Redirect URLs**, adicione:
```
https://seu-dominio.com/atualizar-senha
https://seu-dominio.com/configuracoes
```

---

## 📤 Passo 4: Configurar SMTP (Opcional - Recomendado)

Por padrão, o Supabase envia emails de `noreply@supabase.io`.

Para usar seu próprio domínio (ex: `noreply@falandocomoprofeta.com.br`):

### 4.1 Acesse SMTP Settings

1. Vá em **Project Settings > Authentication**
2. Role até **SMTP Settings**
3. Ative **"Enable Custom SMTP"**

### 4.2 Configurações de Exemplo (SendGrid)

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.xxxxxxxxxx (sua API key)
Sender Name: Flando Como Profeta
Sender Email: noreply@falandocomoprofeta.com.br
```

### 4.3 Outros Provedores SMTP:

| Provedor | Host | Porta | Username |
|----------|------|-------|----------|
| **SendGrid** | smtp.sendgrid.net | 587 | apikey |
| **Mailgun** | smtp.mailgun.org | 587 | postmaster@... |
| **AWS SES** | email-smtp.us-east-1.amazonaws.com | 587 | SEU_USERNAME |
| **Gmail** | smtp.gmail.com | 587 | seu@gmail.com |

---

## 🧪 Passo 5: Testar o Email

### 5.1 Teste pelo Supabase:

1. Vá em **Authentication > Users**
2. Crie um usuário de teste
3. Na coluna do usuário, clique nos **três pontos (...)**
4. Selecione **"Send password recovery"**
5. Verifique seu email

### 5.2 Teste pelo App:

1. Acesse: `https://seuapp.com/recuperar-senha`
2. Digite um email válido
3. Clique em **"Enviar Link"**
4. Verifique a caixa de entrada

---

## ✅ Checklist de Verificação

- [ ] Template HTML copiado para o Supabase
- [ ] Assunto (Subject) configurado
- [ ] URL de redirecionamento configurada
- [ ] SMTP personalizado (opcional)
- [ ] Teste realizado com sucesso

---

## 🚨 Problemas Comuns

### Email vai para SPAM?

**Soluções:**
1. Configure SMTP personalizado (não use o padrão do Supabase)
2. Adicione SPF e DKIM no DNS do seu domínio
3. Use um domínio próprio (não @gmail.com)

### Link não funciona?

**Verifique:**
1. URL Configuration no Supabase está correta
2. Página `/atualizar-senha` existe no seu app
3. O link no email não está quebrado (use o HTML fornecido)

### Variáveis não aparecem?

**Verifique:**
1. Use `{{ .Variavel }}` (com ponto)
2. Não use espaços dentro das chaves
3. As variáveis são case-sensitive

---

## 📞 Suporte

Se precisar de ajuda:
- 📧 Email: suporte@falandocomoprofeta.com.br
- 📖 Docs Supabase: https://supabase.com/docs/guides/auth/auth-email-templates

---

## 📄 Arquivos do Projeto

```
falandocomoprofeta-main/
├── email-templates/
│   └── reset-password-email.html    ← Template HTML
├── docs/
│   └── email-supabase-setup.md      ← Este guia
└── app/
    ├── configuracoes/               ← Página de configurações
    ├── recuperar-senha/             ← Solicitar recuperação
    └── atualizar-senha/             ← Definir nova senha
```

---

**Pronto!** Seus emails agora terão a cara do seu app! 🎉
