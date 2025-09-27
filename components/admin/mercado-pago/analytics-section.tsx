"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  Target,
  PieChart,
  Activity
} from "lucide-react"
import { useState } from "react"

interface AnalyticsData {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  transactions: {
    total: number
    thisMonth: number
    approved: number
    rejected: number
    pending: number
    approvalRate: number
  }
  products: {
    total: number
    active: number
    topSelling: Array<{
      id: string
      name: string
      sales: number
      revenue: number
    }>
  }
  paymentMethods: Array<{
    method: string
    count: number
    percentage: number
    revenue: number
  }>
  customers: {
    total: number
    new: number
    returning: number
  }
  timeline: Array<{
    date: string
    revenue: number
    transactions: number
  }>
}

interface AnalyticsSectionProps {
  analytics: AnalyticsData
  loading: boolean
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
}

export function AnalyticsSection({
  analytics,
  loading,
  formatPrice,
  formatDate
}: AnalyticsSectionProps) {
  const [timeRange, setTimeRange] = useState('30d')

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    } else if (growth < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600"
    if (growth < 0) return "text-red-600"
    return "text-gray-600"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Análise detalhada do desempenho do Mercado Pago</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(analytics.revenue.total)}</div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(analytics.revenue.growth)}
              <span className={getGrowthColor(analytics.revenue.growth)}>
                {analytics.revenue.growth > 0 ? '+' : ''}{analytics.revenue.growth.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.transactions.total}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{analytics.transactions.thisMonth} este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.transactions.approvalRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {analytics.transactions.approved} de {analytics.transactions.total} aprovadas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.customers.total}</div>
            <div className="text-xs text-muted-foreground">
              {analytics.customers.new} novos clientes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Receita por Período
            </CardTitle>
            <CardDescription>
              Evolução da receita nos últimos {timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : timeRange === '90d' ? '90 dias' : 'ano'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.timeline.slice(-7).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(item.date)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(item.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.transactions} transações
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Métodos de Pagamento
            </CardTitle>
            <CardDescription>
              Distribuição por método de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.paymentMethods.map((method, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {method.method.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {method.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{method.count} transações</span>
                    <span>{formatPrice(method.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
          <CardDescription>
            Ranking dos produtos com melhor desempenho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.products.topSelling.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.sales} vendas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatPrice(product.revenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(product.revenue / product.sales)} por venda
                  </div>
                </div>
              </div>
            ))}
            {analytics.products.topSelling.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
                <p>Não há dados suficientes para exibir o ranking de produtos.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analytics.transactions.approved}
            </div>
            <div className="text-sm text-muted-foreground">
              {((analytics.transactions.approved / analytics.transactions.total) * 100).toFixed(1)}% do total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {analytics.transactions.pending}
            </div>
            <div className="text-sm text-muted-foreground">
              {((analytics.transactions.pending / analytics.transactions.total) * 100).toFixed(1)}% do total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rejeitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {analytics.transactions.rejected}
            </div>
            <div className="text-sm text-muted-foreground">
              {((analytics.transactions.rejected / analytics.transactions.total) * 100).toFixed(1)}% do total
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}