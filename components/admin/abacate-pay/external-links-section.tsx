"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Copy, 
  Eye,
  Palette,
  DollarSign,
  Calendar,
  MessageCircle,
  Crown,
  Package,
  Star,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExternalLink {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly' | 'one_time'
  features: string[]
  external_link: string
  external_id: string
  provider: string
  status: 'active' | 'inactive' | 'draft'
  sort_order: number
  metadata: {
    color?: string
    icon?: string
    highlight?: boolean
  }
  created_at: string
  updated_at: string
}

interface ExternalLinksSectionProps {
  externalLinks: ExternalLink[]
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
  getStatusBadge: (status: string) => JSX.Element
  onAddLink: () => void
  onEditLink: (link: ExternalLink) => void
  onDeleteLink: (id: string) => void
}

const iconOptions = [
  { value: 'Calendar', label: 'Calendário', icon: Calendar },
  { value: 'Crown', label: 'Coroa', icon: Crown },
  { value: 'MessageCircle', label: 'Mensagem', icon: MessageCircle },
  { value: 'Package', label: 'Pacote', icon: Package },
  { value: 'Star', label: 'Estrela', icon: Star },
  { value: 'Zap', label: 'Raio', icon: Zap },
  { value: 'DollarSign', label: 'Dólar', icon: DollarSign }
]

export function ExternalLinksSection({
  externalLinks,
  formatPrice,
  formatDate,
  getStatusBadge,
  onAddLink,
  onEditLink,
  onDeleteLink
}: ExternalLinksSectionProps) {
  const { toast } = useToast()
  const [selectedLink, setSelectedLink] = useState<ExternalLink | null>(null)
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false)
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [editingLink, setEditingLink] = useState<ExternalLink | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'BRL',
    interval: 'monthly' as 'monthly' | 'yearly' | 'one_time',
    features: [''],
    external_link: '',
    external_id: '',
    provider: 'abacate-pay',
    status: 'active' as 'active' | 'inactive' | 'draft',
    sort_order: 0,
    metadata: {
      color: '#f97316',
      icon: 'Package',
      highlight: false
    }
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    })
  }

  const openCustomizationPanel = (link: ExternalLink) => {
    setSelectedLink(link)
    setShowCustomizationPanel(true)
  }

  const openAddModal = () => {
    setEditingLink(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'BRL',
      interval: 'monthly',
      features: [''],
      external_link: '',
      external_id: '',
      provider: 'abacate-pay',
      status: 'active',
      sort_order: externalLinks.length,
      metadata: {
        color: '#f97316',
        icon: 'Package',
        highlight: false
      }
    })
    setShowAddEditModal(true)
  }

  const openEditModal = (link: ExternalLink) => {
    setEditingLink(link)
    setFormData({
      name: link.name,
      description: link.description,
      price: link.price,
      currency: link.currency,
      interval: link.interval,
      features: link.features,
      external_link: link.external_link,
      external_id: link.external_id,
      provider: link.provider,
      status: link.status,
      sort_order: link.sort_order,
      metadata: link.metadata
    })
    setShowAddEditModal(true)
  }

  const handleSaveLink = async () => {
    if (!formData.name || !formData.external_link) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e link externo são obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingLink) {
        // Para edição, passamos o ID e os dados atualizados
        await onEditLink(editingLink.id, formData)
      } else {
        // Para adição, passamos os dados do formulário
        await onAddLink(formData)
      }
      setShowAddEditModal(false)
    } catch (error) {
      console.error('Erro ao salvar link:', error)
    }
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName)
    return iconOption ? iconOption.icon : Package
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Links Externos</h2>
          <p className="text-muted-foreground">
            Gerencie seus links de pagamento externos do Abacate Pay
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Link
        </Button>
      </div>

      {/* Links Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {externalLinks.map((link) => {
          const IconComponent = getIconComponent(link.metadata.icon || 'Package')
          
          return (
            <Card 
              key={link.id} 
              className={`relative transition-all hover:shadow-md ${
                link.metadata.highlight ? 'ring-2 ring-orange-500' : ''
              }`}
              style={{
                backgroundColor: link.metadata.color ? `${link.metadata.color}10` : undefined,
                borderColor: link.metadata.color || undefined
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: link.metadata.color || '#ff8100' }}
                    />
                    <CardTitle className="text-lg">{link.name}</CardTitle>
                    {link.metadata.highlight && (
                      <Badge variant="secondary" className="text-xs">
                        Destaque
                      </Badge>
                    )}
                  </div>
                  {getStatusBadge(link.status)}
                </div>
                <CardDescription className="text-sm">
                  {link.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price and Interval */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: link.metadata.color || '#ff8100' }}>
                      {formatPrice(link.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {link.interval === 'monthly' && 'Por mês'}
                      {link.interval === 'yearly' && 'Por ano'}
                      {link.interval === 'one_time' && 'Pagamento único'}
                    </p>
                  </div>
                </div>

                {/* Features */}
                {link.features.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Recursos:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {link.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-current rounded-full" />
                          {feature}
                        </li>
                      ))}
                      {link.features.length > 3 && (
                        <li className="text-xs">+{link.features.length - 3} mais...</li>
                      )}
                    </ul>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(link.external_link)}
                    className="flex-1 min-w-[80px]"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(link.external_link, '_blank')}
                      className="px-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCustomizationPanel(link)}
                      className="px-2"
                    >
                      <Palette className="w-3 h-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(link)}
                      className="px-2"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteLink(link.id)}
                      className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Empty State */}
        {externalLinks.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ExternalLink className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum link externo</h3>
              <p className="text-muted-foreground text-center mb-4">
                Adicione links externos do Abacate Pay para começar a receber pagamentos
              </p>
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Link
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customization Panel Dialog */}
      <Dialog open={showCustomizationPanel} onOpenChange={setShowCustomizationPanel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personalizar Link</DialogTitle>
            <DialogDescription>
              Customize a aparência e configurações do link "{selectedLink?.name}"
            </DialogDescription>
          </DialogHeader>

          {selectedLink && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Pré-visualização</h4>
                <Card 
                  className={`max-w-sm ${selectedLink.metadata.highlight ? 'ring-2 ring-orange-500' : ''}`}
                  style={{
                    backgroundColor: selectedLink.metadata.color ? `${selectedLink.metadata.color}10` : undefined,
                    borderColor: selectedLink.metadata.color || undefined
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = getIconComponent(selectedLink.metadata.icon || 'Package')
                        return (
                          <IconComponent 
                            className="w-5 h-5" 
                            style={{ color: selectedLink.metadata.color || '#ff8100' }}
                          />
                        )
                      })()}
                      <CardTitle className="text-lg">{selectedLink.name}</CardTitle>
                      {selectedLink.metadata.highlight && (
                        <Badge variant="secondary" className="text-xs">Destaque</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold" style={{ color: selectedLink.metadata.color || '#ff8100' }}>
                      {formatPrice(selectedLink.price)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Customization Options */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cor Principal</Label>
                  <Input
                    type="color"
                    value={selectedLink.metadata.color || '#ff8100'}
                    onChange={(e) => {
                      setSelectedLink(prev => prev ? {
                        ...prev,
                        metadata: { ...prev.metadata, color: e.target.value }
                      } : null)
                    }}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select
                    value={selectedLink.metadata.icon || 'Package'}
                    onValueChange={(value) => {
                      setSelectedLink(prev => prev ? {
                        ...prev,
                        metadata: { ...prev.metadata, icon: value }
                      } : null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 md:col-span-2">
                  <Switch
                    id="highlight"
                    checked={selectedLink.metadata.highlight || false}
                    onCheckedChange={(checked) => {
                      setSelectedLink(prev => prev ? {
                        ...prev,
                        metadata: { ...prev.metadata, highlight: checked }
                      } : null)
                    }}
                  />
                  <Label htmlFor="highlight">Destacar este plano</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomizationPanel(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (selectedLink) {
                onEditLink(selectedLink)
                setShowCustomizationPanel(false)
              }
            }}>
              Salvar Personalização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Link Modal */}
      <Dialog open={showAddEditModal} onOpenChange={setShowAddEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? 'Editar Link' : 'Adicionar Novo Link'}
            </DialogTitle>
            <DialogDescription>
              {editingLink 
                ? 'Edite as informações do link externo'
                : 'Adicione um novo link de pagamento externo do Abacate Pay'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Plano Premium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_link">Link Externo *</Label>
                <Input
                  id="external_link"
                  value={formData.external_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, external_link: e.target.value }))}
                  placeholder="https://abacatepay.com/link/..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que este plano oferece"
                rows={3}
              />
            </div>

            {/* Price and Interval */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Intervalo</Label>
                <Select
                  value={formData.interval}
                  onValueChange={(value: 'monthly' | 'yearly' | 'one_time') => 
                    setFormData(prev => ({ ...prev, interval: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="one_time">Pagamento Único</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Recursos/Características</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Ex: Chat ilimitado"
                      className="flex-1"
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Recurso
                </Button>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="external_id">ID Externo</Label>
                <Input
                  id="external_id"
                  value={formData.external_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, external_id: e.target.value }))}
                  placeholder="ID do produto no Abacate Pay"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'draft') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Appearance */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="color">Cor Principal</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.metadata.color}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, color: e.target.value }
                  }))}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={formData.metadata.icon}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, icon: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="highlight"
                checked={formData.metadata.highlight}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, highlight: checked }
                }))}
              />
              <Label htmlFor="highlight">Destacar este plano</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLink}>
              {editingLink ? 'Salvar Alterações' : 'Adicionar Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}