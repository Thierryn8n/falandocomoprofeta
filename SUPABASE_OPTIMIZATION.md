# Otimização do Uso de Dados do Supabase

## Problema Identificado
O projeto "supabaseFALANDO-COM-O-PROFETA" estava consumindo **7.03GB de 5GB** (141% do limite), causando possíveis restrições de performance.

## Principais Causas Identificadas

### 1. Session Tracking Excessivo
- **Problema**: Heartbeat a cada 5 segundos
- **Impacto**: ~17.280 consultas por dia por usuário ativo
- **Solução**: Reduzido para 60 segundos (redução de 92%)

### 2. Dashboard Auto-refresh Agressivo
- **Problema**: Refresh automático a cada 5 segundos no painel admin
- **Impacto**: ~17.280 consultas por dia quando admin está ativo
- **Solução**: Reduzido para 30 segundos (redução de 83%)

### 3. Ausência de Cache Local
- **Problema**: Consultas repetidas sem cache
- **Impacto**: Múltiplas consultas desnecessárias para dados estáticos
- **Solução**: Implementado cache de 2-5 minutos nos hooks principais

## Otimizações Implementadas

### ✅ Session Tracking (`use-session-tracking.ts`)
```typescript
// ANTES: heartbeatInterval = setInterval(updateSession, 5000)
// DEPOIS: heartbeatInterval = setInterval(updateSession, 60000)
```
**Redução estimada**: 92% menos consultas de session tracking

### ✅ Dashboard Overview (`dashboard-overview.tsx`)
```typescript
// ANTES: setInterval(() => { fetchMetrics(); fetchRecentActivity(); }, 5000)
// DEPOIS: setInterval(() => { fetchMetrics(); fetchRecentActivity(); }, 30000)
```
**Redução estimada**: 83% menos consultas no dashboard admin

### ✅ Cache em App Config (`use-app-config.ts`)
- Cache de 5 minutos para configurações
- Evita consultas repetidas desnecessárias
- Parâmetro `forceRefresh` para atualizações manuais

### ✅ Cache em Conversas (`use-conversations.ts`)
- Cache de 2 minutos para lista de conversas
- Reduz consultas ao navegar entre páginas
- Mantém dados atualizados sem excesso

## Outras Otimizações Recomendadas

### 🔄 PIX Payment Polling
**Localização**: `components/pix-payment-modal.tsx`
```typescript
// Atual: checkInterval = setInterval(async () => { await checkPaymentStatus() }, 5000)
// Recomendação: Aumentar para 10-15 segundos ou usar webhooks
```

### 🔄 Real-time Subscriptions
- Revisar uso de `supabase.auth.onAuthStateChange`
- Considerar unsubscribe em componentes não ativos
- Implementar debounce em listeners

### 🔄 Consultas com JOIN
- Otimizar consultas que fazem JOIN com múltiplas tabelas
- Considerar desnormalização para dados frequentemente acessados
- Usar `select` específico ao invés de `select("*")`

## Impacto Estimado das Otimizações

### Redução de Consultas por Dia (usuário ativo):
- **Session Tracking**: 17.280 → 1.440 consultas (-15.840)
- **Dashboard Admin**: 17.280 → 2.880 consultas (-14.400)
- **Cache Configs**: ~50% menos consultas repetidas
- **Cache Conversas**: ~60% menos consultas repetidas

### **Redução Total Estimada**: 70-80% do uso de dados

## Monitoramento Contínuo

### Métricas para Acompanhar:
1. **Data Egress** no painel Supabase
2. **Número de consultas** por hora/dia
3. **Performance** da aplicação
4. **Experiência do usuário**

### Alertas Recomendados:
- Configurar alertas em 80% do limite (4GB)
- Monitorar consultas por endpoint
- Acompanhar crescimento de usuários vs. uso de dados

## Próximos Passos

1. **Monitorar** o impacto das otimizações por 48-72h
2. **Implementar** otimizações adicionais se necessário
3. **Considerar upgrade** para Supabase Pro se o crescimento continuar
4. **Implementar** sistema de cache mais robusto (Redis/Memcached)

## Contato para Suporte
- Revisar logs de erro no Supabase
- Implementar logging de performance
- Considerar CDN para assets estáticos