"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ExternalLink, 
  Zap, 
  Info, 
  Plus, 
  Trash2, 
  Shield, 
  Globe, 
  CheckCircle, 
  RefreshCw,
  Package,
  Eye
} from "lucide-react"

interface ExternalPlan {
  id: string
  name: string
  description: string
  price: number
  interval: 'monthly' | 'yearly' | 'one_time'
  provider: string
  external_id: string
  features: string[]
  ui_config: {
    customTitle: string
    customDescription: string
    backgroundColor: string
    textColor: string
    buttonColor: string
    highlight: boolean
  }
}

interface ExternalPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPlan: ExternalPlan | null
  form: ExternalPlan
  setForm: React.Dispatch<React.SetStateAction<ExternalPlan>>
  onSave: () => void
  formatPrice: (price: number) => string
}

export function ExternalPlanDialog({
  open,
  onOpenChange,
  selectedPlan,
  form,
  setForm,
  onSave,
  formatPrice
}: ExternalPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedPlan ? "Editar Link de Produto Externo" : "Adicionar Link de Produto Externo"}
          </DialogTitle>
          <DialogDescription>
            Configure um link para um produto externo com personalização visual
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Informações do Produto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Informações do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">Nome do Produto</Label>
                  <Input
                    id="planName"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do produto"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planPrice">Preço</Label>
                    <Input
                      id="planPrice"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planProvider">Provedor</Label>
                    <Select
                      value={form.provider}
                      onValueChange={(value) => setForm(prev => ({ ...prev, provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="abacate-pay">Abacate Pay</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planDescription">Descrição</Label>
                  <Textarea
                    id="planDescription"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada do produto"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planInterval">Tipo de Cobrança</Label>
                    <Select
                      value={form.interval}
                      onValueChange={(value: 'monthly' | 'yearly' | 'one_time') => 
                        setForm(prev => ({ ...prev, interval: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">Pagamento Único</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="externalId">ID/Link Externo</Label>
                    <Input
                      id="externalId"
                      value={form.external_id}
                      onChange={(e) => setForm(prev => ({ ...prev, external_id: e.target.value }))}
                      placeholder="ID ou link do produto externo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recursos Inclusos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recursos Inclusos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {form.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...form.features]
                          newFeatures[index] = e.target.value
                          setForm(prev => ({ ...prev, features: newFeatures }))
                        }}
                        placeholder="Recurso incluído"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFeatures = form.features.filter((_, i) => i !== index)
                          setForm(prev => ({ ...prev, features: newFeatures }))
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm(prev => ({ ...prev, features: [...prev.features, ''] }))}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Recurso
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Personalização Visual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Personalização Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Para novos links de produtos, a personalização será aplicada automaticamente.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="customTitle">Título Personalizado</Label>
                  <Input
                    id="customTitle"
                    value={form.ui_config?.customTitle || ''}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      ui_config: { 
                        ...prev.ui_config, 
                        customTitle: e.target.value 
                      } 
                    }))}
                    placeholder="Deixe vazio para usar o nome do produto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customDescription">Descrição Personalizada</Label>
                  <Textarea
                    id="customDescription"
                    value={form.ui_config?.customDescription || ''}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      ui_config: { 
                        ...prev.ui_config, 
                        customDescription: e.target.value 
                      } 
                    }))}
                    placeholder="Deixe vazio para usar a descrição do produto"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={form.ui_config?.backgroundColor || '#ffffff'}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        ui_config: { 
                          ...prev.ui_config, 
                          backgroundColor: e.target.value 
                        } 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Cor do Texto</Label>
                    <Input
                      id="textColor"
                      type="color"
                      value={form.ui_config?.textColor || '#000000'}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        ui_config: { 
                          ...prev.ui_config, 
                          textColor: e.target.value 
                        } 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonColor">Cor do Botão</Label>
                    <Input
                      id="buttonColor"
                      type="color"
                      value={form.ui_config?.buttonColor || '#ff8100'}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        ui_config: { 
                          ...prev.ui_config, 
                          buttonColor: e.target.value 
                        } 
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="highlight"
                    checked={form.ui_config?.highlight || false}
                    onCheckedChange={(checked) => setForm(prev => ({ 
                      ...prev, 
                      ui_config: { 
                        ...prev.ui_config, 
                        highlight: checked 
                      } 
                    }))}
                  />
                  <Label htmlFor="highlight">Destacar este produto</Label>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Configurações Rápidas</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm(prev => ({ 
                        ...prev, 
                        ui_config: { 
                          ...prev.ui_config,
                          backgroundColor: '#ffffff',
                          textColor: '#000000',
                          buttonColor: '#6b7280',
                          highlight: false
                        } 
                      }))}
                    >
                      Padrão
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm(prev => ({ 
                        ...prev, 
                        ui_config: { 
                          ...prev.ui_config,
                          backgroundColor: '#1f2937',
                          textColor: '#ffffff',
                          buttonColor: '#3b82f6',
                          highlight: false
                        } 
                      }))}
                    >
                      Premium
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm(prev => ({ 
                        ...prev, 
                        ui_config: { 
                          ...prev.ui_config,
                          backgroundColor: '#fef3c7',
                          textColor: '#92400e',
                          buttonColor: '#f59e0b',
                          highlight: true
                        } 
                      }))}
                    >
                      Destaque
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-6 rounded-lg border-2 transition-all duration-200"
                  style={{
                    backgroundColor: form.ui_config?.backgroundColor || '#ffffff',
                    color: form.ui_config?.textColor || '#000000',
                    borderColor: form.ui_config?.highlight ? '#f59e0b' : '#e5e7eb'
                  }}
                >
                  {form.ui_config?.highlight && (
                    <div className="mb-4">
                      <Badge className="bg-yellow-500 text-white">
                        ⭐ Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold mb-2">
                    {form.ui_config?.customTitle || form.name || 'Nome do Produto'}
                  </h3>
                  
                  <p className="text-sm opacity-80 mb-4">
                    {form.ui_config?.customDescription || form.description || 'Descrição do produto'}
                  </p>
                  
                  <div className="mb-4">
                    <span className="text-2xl font-bold">
                      {formatPrice(form.price || 0)}
                    </span>
                    <span className="text-sm opacity-60 ml-2">
                      {form.interval === 'monthly' && '/ mês'}
                      {form.interval === 'yearly' && '/ ano'}
                      {form.interval === 'one_time' && 'pagamento único'}
                    </span>
                  </div>
                  
                  {form.features.length > 0 && (
                    <ul className="space-y-1 mb-6">
                      {form.features.filter(f => f.trim()).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <Button 
                    className="w-full"
                    style={{
                      backgroundColor: form.ui_config?.buttonColor || '#ff8100',
                      color: '#ffffff'
                    }}
                  >
                    Comprar Agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            {selectedPlan ? "Atualizar Link" : "Salvar Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}