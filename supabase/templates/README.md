# 📧 Templates de Email - Falando com o Profeta

Templates HTML personalizados para emails de autenticação do Supabase Auth, com a identidade visual do app **Falando com o Profeta**.

## 🎨 Identidade Visual

- **Cores**: Paleta sépia/dourado (#F4ECD8, #8B7355, #D4C4A8)
- **Logo**: Avatar de William Marrion Branham
- **Fonte**: Segoe UI (system font)
- **Estilo**: Elegante, cristão, acolhedor

## 📁 Arquivos

| Arquivo | Descrição | Uso no Supabase |
|---------|-----------|-----------------|
| `confirm-signup.html` | Confirmação de cadastro | "Confirm signup" |
| `magic-link.html` | Link mágico de acesso | "Magic link" |
| `reset-password.html` | Redefinição de senha | "Reset password" |
| `change-email.html` | Alteração de email | "Change email address" |
| `invite-user.html` | Convite de usuário | "Invite user" |
| `reauthentication.html` | Reautenticação | "Reauthentication" |

## 🚀 Como Usar

1. Acesse o [Supabase Dashboard](https://app.supabase.io)
2. Selecione seu projeto
3. Vá em **Authentication** → **Email Templates**
4. Para cada template, substitua o conteúdo pelo HTML correspondente
5. Clique em **Save**

## 📸 Preview

Todos os templates incluem:
- ✅ Header com logo do profeta
- ✅ Cores consistentes com o app
- ✅ Botões estilizados
- ✅ Links alternativos
- ✅ Footer com versículo bíblico
- ✅ Design responsivo para mobile

## 🔗 URL da Imagem

A imagem do profeta está hospedada no Storage do Supabase:
```
https://wlwwgnimfuvoxjecdnza.supabase.co/storage/v1/object/public/profile-images/avatars/prophet-avatar-1753104005783.png
```

## 📝 Variáveis Disponíveis

Os templates usam as variáveis padrão do Supabase Auth:
- `{{ .ConfirmationURL }}` - URL de confirmação
- `{{ .Email }}` - Email do usuário
- `{{ .Token }}` - Token de verificação
- `{{ .SiteURL }}` - URL do site
- `{{ .Data }}` - Dados adicionais

## ✨ Características

- **Tema sépia**: Cores quentes que remetem à Bíblia e tradição
- **Avatar do profeta**: William Marrion Branham no cabeçalho
- **Versículos**: Cada email termina com uma passagem bíblica
- **Responsivo**: Funciona bem em desktop e mobile
- **Acessível**: Contraste adequado para leitura

---

**Falando com o Profeta** - Inteligência Artificial Cristã 🤲
