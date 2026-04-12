# Teste de API PowerShell para Supabase
# Execute com: .\test-api-simple.ps1

$SUPABASE_URL = "https://jdgcplehsvqnycfaonkm.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZ2NwbGVoc3ZxbnljZmFvbmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNjE3MTcsImV4cCI6MjA1OTczNzcxN30.OLR1xbef0aF0FH2nR9kvEhlu4IGP8WWIvbhh8k4WK9w"

Write-Host "🧪 Iniciando testes de API..." -ForegroundColor Cyan
Write-Host ""

# Headers comuns
$headers = @{
    "apikey" = $SUPABASE_ANON_KEY
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

# Teste 1: Verificar configuração
Write-Host "Teste 1: Verificando configuração..." -ForegroundColor Yellow
if ($SUPABASE_URL -eq "" -or $SUPABASE_ANON_KEY -eq "") {
    Write-Host "❌ Configuração incompleta!" -ForegroundColor Red
    exit
}
Write-Host "✅ Configuração OK" -ForegroundColor Green
Write-Host ""

# Função para testar endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    Write-Host "Testando $Name..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $Url -Headers $headers -Method GET -TimeoutSec 30
        Write-Host "✅ $Name`: $($response.Count) registros encontrados" -ForegroundColor Green
        if ($response.Count -gt 0) {
            Write-Host "   Exemplo: $($response[0].book) $($response[0].chapter):$($response[0].verse)" -ForegroundColor Gray
        }
        return $response.Count
    }
    catch {
        Write-Host "❌ Erro em $Name`: $($_.Exception.Message)" -ForegroundColor Red
        return 0
    }
    Write-Host ""
}

# Testar cada livro
$marcosCount = Test-Endpoint -Name "Marcos" -Url "$SUPABASE_URL/rest/v1/bible_verses?book=eq.Marcos&limit=5"
Write-Host ""

$lucasCount = Test-Endpoint -Name "Lucas" -Url "$SUPABASE_URL/rest/v1/bible_verses?book=eq.Lucas&limit=5"
Write-Host ""

$joaoCount = Test-Endpoint -Name "João" -Url "$SUPABASE_URL/rest/v1/bible_verses?book=eq.João&limit=5"
Write-Host ""

$atosCount = Test-Endpoint -Name "Atos" -Url "$SUPABASE_URL/rest/v1/bible_verses?book=eq.Atos&limit=5"
Write-Host ""

# Resumo
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Marcos: $marcosCount versículos" -ForegroundColor $(if($marcosCount -gt 0){"Green"}else{"Red"})
Write-Host "Lucas: $lucasCount versículos" -ForegroundColor $(if($lucasCount -gt 0){"Green"}else{"Red"})
Write-Host "João: $joaoCount versículos" -ForegroundColor $(if($joaoCount -gt 0){"Green"}else{"Red"})
Write-Host "Atos: $atosCount versículos" -ForegroundColor $(if($atosCount -gt 0){"Green"}else{"Red"})

$total = $marcosCount + $lucasCount + $joaoCount + $atosCount
Write-Host "───────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "Total testado: $total versículos" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

# Teste de consulta específica
Write-Host ""
Write-Host "Teste de consulta específica (Marcos 1:1)..." -ForegroundColor Yellow
try {
    $specific = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/bible_verses?book=eq.Marcos&chapter=eq.1&verse=eq.1" -Headers $headers -Method GET -TimeoutSec 30
    if ($specific.Count -gt 0) {
        Write-Host "✅ Encontrado: $($specific[0].text)" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Erro na consulta específica" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Testes concluídos!" -ForegroundColor Green
