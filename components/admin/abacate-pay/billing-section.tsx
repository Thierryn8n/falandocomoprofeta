"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2 } from "lucide-react"

interface ExternalPlan {
  id: string
  name: string
  description: string
  price: number
  interval: 'monthly' | 'yearly' | 'one_time'
  status: 'active' | 'inactive' | 'pending'
}

interface BillingSectionProps {
  externalPlans: ExternalPlan[]
  formatPrice: (price: number) => string
  getStatusBadge: (status: string) => React.ReactNode
  editExternalPlan: (plan: ExternalPlan) => void
  deleteExternalPlan: (id: string) => void
  setShowExternalPlanDialog: (show: boolean) => void
}

export function BillingSection({ 
  externalPlans,
  formatPrice,
  getStatusBadge,
  editExternalPlan,
  deleteExternalPlan,
  setShowExternalPlanDialog
}: BillingSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Cobrança</h2>
          <p className="text-muted-foreground">Gerencie produtos e planos de pagamento</p>
        </div>
        <Button onClick={() => setShowExternalPlanDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Link de Produto
        </Button>
      </div>

      {/* Planos Externos */}
      <Card>
        <CardHeader>
          <CardTitle>Links de Produtos Externos</CardTitle>
          <CardDescription>
            Gerencie links para produtos de plataformas externas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {externalPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(plan.price)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {plan.interval === 'monthly' && 'Mensal'}
                      {plan.interval === 'yearly' && 'Anual'}
                      {plan.interval === 'one_time' && 'Único'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editExternalPlan(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteExternalPlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}