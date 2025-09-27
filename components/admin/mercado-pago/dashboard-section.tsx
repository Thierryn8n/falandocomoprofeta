"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  CreditCard,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2
} from "lucide-react"

interface DashboardStats {
  totalRevenue: number
  totalTransactions: number
  activeProducts: number
  conversionRate: number
  todayRevenue: number
  monthlyGrowth: number
  approvedTransactions: number
  averageTicket: number
  recentTransactions: Transaction[]
}

interface Transaction {
  id: string
  payment_id: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  payment_method: string
  payer_email: string
  customer_email: string
  created_at: string
  updated_at: string
}

interface DashboardSectionProps {
  stats: DashboardStats | null
  loading: boolean
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
}

export function DashboardSection({ 
  stats, 
  loading,
  formatPrice, 
  formatDate
}: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dados...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatPrice(stats?.todayRevenue || 0)} hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transações</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.approvedTransactions || 0} aprovadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats?.conversionRate || 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.monthlyGrowth || 0 > 0 ? '+' : ''}{(stats?.monthlyGrowth || 0).toFixed(1)}% este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(stats?.averageTicket || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Produtos ativos: {stats?.activeProducts || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Últimas transações processadas pelo Mercado Pago
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.customer_email}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(transaction.amount)}</p>
                        <Badge 
                          variant={
                            transaction.status === 'approved' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma transação encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}