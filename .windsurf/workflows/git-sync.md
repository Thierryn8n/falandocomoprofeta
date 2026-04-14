---
description: Garantir sincronização correta com GitHub
---

# Git Sync Workflow

## Passos para garantir que commits vão para o GitHub

### 1. Verificar status atual
```bash
git status
git log --oneline -3
```

### 2. Adicionar todas as alterações
```bash
git add -A
```

### 3. Commit com mensagem descritiva
```bash
git commit -m "descrição das alterações"
```

### 4. Verificar branch atual
```bash
git branch --show-current
```

### 5. Push para a branch correta
```bash
# Se estiver na branch app-com-supabase:
git push origin app-com-supabase

# Se estiver na branch main:
git push origin main
```

### 6. Verificar se foi enviado
```bash
git log origin/app-com-supabase..HEAD --oneline
```

Se aparecer commits, ainda há commits locais não enviados.

### 7. Se houver erro de "non-fast-forward"
```bash
git pull origin app-com-supabase --rebase
git push origin app-com-supabase
```

## Verificação Rápida

Compare os hashes:
```bash
echo "LOCAL:" && git rev-parse HEAD
echo "REMOTE:" && git rev-parse origin/app-com-supabase
```

Se forem diferentes, execute o passo 5.
