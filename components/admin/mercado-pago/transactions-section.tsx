"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download,
  Eye,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  Clock
} from "lucide-react"

interface Transaction {
  id: string
  product_id: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  payment_method: string
  payment_type: string
  customer_email: string
  customer_name?: string
  external_reference?: string
  description?: string
  created_at: string
  updated_at: string
  mercado_pago_id?: string
  fee_amount?: number
  net_amount?: number
}

interface TransactionsSectionProps {
  transactions: Transaction[]
  loading: boolean
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
  loadTransactions: () => Promise<void>
  exportTransactions: () => Promise<void>
}

export function TransactionsSection({
  transactions,
  loading,
  formatPrice,
  formatDate,
  loadTransactions,
  exportTransactions
}: TransactionsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
      refunded: "bg-blue-100 text-blue-800 border-blue-200"
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status === 'pending' && 'Pendente'}
        {status === 'approved' && 'Aprovado'}
        {status === 'rejected' && 'Rejeitado'}
        {status === 'cancelled' && 'Cancelado'}
        {status === 'refunded' && 'Reembolsado'}
      </Badge>
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit_card':
        return <CreditCard className="w-4 h-4" />
      case 'debit_card':
        return <CreditCard className="w-4 h-4" />
      case 'pix':
        return <DollarSign className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customer_name && transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.external_reference && transaction.external_reference.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    const matchesPaymentMethod = paymentMethodFilter === 'all' || transaction.payment_method === paymentMethodFilter

    return matchesSearch && matchesStatus && matchesPaymentMethod
  })

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const approvedAmount = filteredTransactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Transações</h2>
          <p className="text-muted-foreground">Visualize e gerencie suas transações do Mercado Pago</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTransactions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Transações</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatPrice(totalAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold">{formatPrice(approvedAmount)}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                <p className="text-2xl font-bold">
                  {filteredTransactions.length > 0 
                    ? Math.round((filteredTransactions.filter(t => t.status === 'approved').length / filteredTransactions.length) * 100)
                    : 0
                  }%
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID, email, nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de Pagamento</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Métodos</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{transaction.id.slice(0, 8)}</span>
                    {getStatusBadge(transaction.status)}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {getPaymentMethodIcon(transaction.payment_method)}
                      <span className="capitalize">{transaction.payment_method.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {transaction.customer_name || transaction.customer_email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(transaction.created_at)}
                    </div>
                    {transaction.external_reference && (
                      <div className="flex items-center gap-1">
                        <span>Ref: {transaction.external_reference}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-medium text-lg">{formatPrice(transaction.amount)}</div>
                  {transaction.fee_amount && (
                    <div className="text-sm text-muted-foreground">
                      Taxa: {formatPrice(transaction.fee_amount)}
                    </div>
                  )}
                  {transaction.net_amount && (
                    <div className="text-sm text-green-600">
                      Líquido: {formatPrice(transaction.net_amount)}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingTransaction(transaction)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
                <p>Não há transações que correspondam aos filtros aplicados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={!!viewingTransaction} onOpenChange={() => setViewingTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              Informações completas da transação #{viewingTransaction?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {viewingTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID da Transação</Label>
                  <p className="font-mono text-sm">{viewingTransaction.id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(viewingTransaction.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor</Label>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(viewingTransaction.amount)}
                  </p>
                </div>
                <div>
                  <Label>Método de Pagamento</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getPaymentMethodIcon(viewingTransaction.payment_method)}
                    <span className="capitalize">
                      {viewingTransaction.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {(viewingTransaction.fee_amount || viewingTransaction.net_amount) && (
                <div className="grid grid-cols-2 gap-4">
                  {viewingTransaction.fee_amount && (
                    <div>
                      <Label>Taxa do Mercado Pago</Label>
                      <p className="text-red-600">{formatPrice(viewingTransaction.fee_amount)}</p>
                    </div>
                  )}
                  {viewingTransaction.net_amount && (
                    <div>
                      <Label>Valor Líquido</Label>
                      <p className="text-green-600 font-semibold">{formatPrice(viewingTransaction.net_amount)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p>{viewingTransaction.customer_name || 'Não informado'}</p>
                  <p className="text-sm text-muted-foreground">{viewingTransaction.customer_email}</p>
                </div>
                <div>
                  <Label>ID do Produto</Label>
                  <p className="font-mono text-sm">{viewingTransaction.product_id}</p>
                </div>
              </div>

              {viewingTransaction.external_reference && (
                <div>
                  <Label>Referência Externa</Label>
                  <p>{viewingTransaction.external_reference}</p>
                </div>
              )}

              {viewingTransaction.description && (
                <div>
                  <Label>Descrição</Label>
                  <p>{viewingTransaction.description}</p>
                </div>
              )}

              {viewingTransaction.mercado_pago_id && (
                <div>
                  <Label>ID do Mercado Pago</Label>
                  <p className="font-mono text-sm">{viewingTransaction.mercado_pago_id}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Criado em</Label>
                  <p>{formatDate(viewingTransaction.created_at)}</p>
                </div>
                <div>
                  <Label>Atualizado em</Label>
                  <p>{formatDate(viewingTransaction.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}