'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  DollarSign, 
  CreditCard, 
  Package, 
  TrendingUp, 
  Settings, 
  QrCode 
} from "lucide-react"

interface Stats {
  totalRevenue: number
  totalTransactions: number
  activeProducts: number
  conversionRate: number
  monthlyGrowth: number
}

interface Transaction {
  id: string
  customer_email: string
  amount: number
  status: string
  created_at: string
}

interface DashboardSectionProps {
  stats: Stats
  transactions: Transaction[]
  formatPrice: (price: number, currency?: string) => string
  formatDate: (dateString: string) => string
  getStatusBadge: (status: string) => JSX.Element
  setActiveSection: (section: string) => void
}

export function DashboardSection({ 
  stats, 
  transactions, 
  formatPrice, 
  formatDate, 
  getStatusBadge, 
  setActiveSection 
}: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      {/* Sistema de Pagamento - Opções Principais */}
      <Card className="border-2 border-[#ff8100]/20 bg-gradient-to-r from-[#ff8100]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ff8100" }}>
              <Settings className="w-5 h-5 text-white" />
            </div>
            Sistema de Pagamentos
          </CardTitle>
          <CardDescription>
            Configure e gerencie seu sistema de pagamentos integrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setActiveSection("config")}
            >
              <Settings className="w-6 h-6" />
              Configurar API
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setActiveSection("pix")}
            >
              <QrCode className="w-6 h-6" />
              PIX QRCode
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setActiveSection("billing")}
            >
              <Package className="w-6 h-6" />
              Sistema de Cobrança
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setActiveSection("transactions")}
            >
              <CreditCard className="w-6 h-6" />
              Transações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Total de transações processadas
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
              Produtos disponíveis para venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de conversão média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas transações processadas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {transaction.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{transaction.customer_email}</TableCell>
                  <TableCell>{formatPrice(transaction.amount)}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>{formatDate(transaction.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}