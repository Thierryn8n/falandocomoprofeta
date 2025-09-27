"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, Activity, Package } from "lucide-react"

interface Stats {
  todayRevenue: number
  monthlyGrowth: number
  conversionRate: number
  activeProducts: number
  totalRevenue: number
  totalTransactions: number
}

interface AnalyticsSectionProps {
  stats: Stats
  formatPrice: (price: number) => string
}

export function AnalyticsSection({ 
  stats,
  formatPrice
}: AnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Análises</h2>
        <p className="text-muted-foreground">Relatórios e métricas de desempenho</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Receita do dia atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.monthlyGrowth}%</div>
            <p className="text-xs text-muted-foreground">
              Comparado ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Visitantes que compraram
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo de Performance</CardTitle>
          <CardDescription>
            Métricas principais do sistema de pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Receita Total</span>
              <span className="text-sm">{formatPrice(stats.totalRevenue)}</span>
            </div>
            <Progress value={(stats.totalRevenue / 100000) * 100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transações Processadas</span>
              <span className="text-sm">{stats.totalTransactions}</span>
            </div>
            <Progress value={(stats.totalTransactions / 1000) * 100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taxa de Conversão</span>
              <span className="text-sm">{stats.conversionRate}%</span>
            </div>
            <Progress value={stats.conversionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}