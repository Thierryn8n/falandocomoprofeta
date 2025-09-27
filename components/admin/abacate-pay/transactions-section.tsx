"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Transaction {
  id: string
  customer_email: string
  product_id: string
  amount: number
  payment_method: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
}

interface TransactionsSectionProps {
  transactions: Transaction[]
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
  getStatusBadge: (status: string) => React.ReactNode
}

export function TransactionsSection({ 
  transactions,
  formatPrice,
  formatDate,
  getStatusBadge
}: TransactionsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Transações</h2>
        <p className="text-muted-foreground">Histórico completo de transações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as transações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {transaction.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{transaction.customer_email}</TableCell>
                  <TableCell>{transaction.product_id}</TableCell>
                  <TableCell>{formatPrice(transaction.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.payment_method}</Badge>
                  </TableCell>
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