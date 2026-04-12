# Teste de API - Bíblia no Supabase

## Como executar o teste

### Opção 1: Com Node.js diretamente

1. Configure as variáveis de ambiente:
```bash
# Windows PowerShell
$env:NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon"

# Ou edite o arquivo test-api.js e substitua os valores
```

2. Execute o teste:
```bash
cd scripts
node test-api.js
```

### Opção 2: Com cURL (teste rápido)

```bash
# Testar conexão com Supabase
curl -X GET "https://seu-projeto.supabase.co/rest/v1/bible_verses?limit=1" \
  -H "apikey: sua-chave-anon" \
  -H "Authorization: Bearer sua-chave-anon"

# Consultar livro específico
curl -X GET "https://seu-projeto.supabase.co/rest/v1/bible_verses?book=eq.Marcos&limit=5" \
  -H "apikey: sua-chave-anon" \
  -H "Authorization: Bearer sua-chave-anon"
```

### Opção 3: Com Python

```python
import requests

url = "https://seu-projeto.supabase.co/rest/v1/bible_verses"
headers = {
    "apikey": "sua-chave-anon",
    "Authorization": "Bearer sua-chave-anon",
    "Content-Type": "application/json"
}

# Testar consulta
params = {"book": "eq.Marcos", "limit": 5}
response = requests.get(url, headers=headers, params=params)
print(f"Status: {response.status_code}")
print(f"Dados: {response.json()}")
```

## O que o teste verifica

1. ✅ Configuração das variáveis de ambiente
2. ✅ Conexão com o Supabase
3. ✅ Consulta do livro de Marcos
4. ✅ Consulta do livro de Lucas
5. ✅ Consulta do livro de João
6. ✅ Consulta do livro de Atos
7. 📊 Contagem total de versículos

## Solução de problemas

### Erro 401 (Não autorizado)
- Verifique se a chave API está correta
- Verifique se as políticas RLS estão configuradas

### Erro 404 (Não encontrado)
- Verifique se a tabela `bible_verses` existe
- Verifique se o nome da tabela está correto

### Erro 500 (Erro interno)
- Verifique os logs do Supabase
- Verifique se a estrutura da tabela está correta
