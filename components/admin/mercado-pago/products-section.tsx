"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  Image as ImageIcon
} from "lucide-react"

interface MercadoPagoProduct {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category_id: string
  picture_url?: string
  status: 'active' | 'paused' | 'closed'
  created_at: string
  updated_at: string
}

interface ProductsSectionProps {
  products: MercadoPagoProduct[]
  isProductDialogOpen: boolean
  setIsProductDialogOpen: (open: boolean) => void
  editingProduct: MercadoPagoProduct | null
  setEditingProduct: (product: MercadoPagoProduct | null) => void
  productForm: Partial<MercadoPagoProduct>
  setProductForm: (form: Partial<MercadoPagoProduct> | ((prev: Partial<MercadoPagoProduct>) => Partial<MercadoPagoProduct>)) => void
  loading: boolean
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
  saveProduct: () => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  loadProducts: () => Promise<void>
}

export function ProductsSection({
  products,
  isProductDialogOpen,
  setIsProductDialogOpen,
  editingProduct,
  setEditingProduct,
  productForm,
  setProductForm,
  loading,
  formatPrice,
  formatDate,
  saveProduct,
  deleteProduct,
  loadProducts
}: ProductsSectionProps) {
  const [viewingProduct, setViewingProduct] = useState<MercadoPagoProduct | null>(null)

  const openProductDialog = (product?: MercadoPagoProduct) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        title: product.title,
        description: product.description,
        price: product.price,
        category_id: product.category_id,
        picture_url: product.picture_url,
        status: product.status
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        title: '',
        description: '',
        price: 0,
        category_id: '',
        picture_url: '',
        status: 'active'
      })
    }
    setIsProductDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
      closed: "bg-red-100 text-red-800 border-red-200"
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status === 'active' && 'Ativo'}
        {status === 'paused' && 'Pausado'}
        {status === 'closed' && 'Fechado'}
      </Badge>
    )
  }

  const categories = [
    { id: 'electronics', name: 'Eletrônicos' },
    { id: 'clothing', name: 'Roupas' },
    { id: 'books', name: 'Livros' },
    { id: 'home', name: 'Casa e Jardim' },
    { id: 'sports', name: 'Esportes' },
    { id: 'toys', name: 'Brinquedos' },
    { id: 'automotive', name: 'Automotivo' },
    { id: 'beauty', name: 'Beleza' },
    { id: 'food', name: 'Alimentação' },
    { id: 'services', name: 'Serviços' },
    { id: 'digital', name: 'Produtos Digitais' },
    { id: 'other', name: 'Outros' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Produtos</h2>
          <p className="text-muted-foreground">Gerencie seus produtos do Mercado Pago</p>
        </div>
        <Button onClick={() => openProductDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-video bg-muted flex items-center justify-center">
              {product.picture_url ? (
                <img 
                  src={product.picture_url} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                {getStatusBadge(product.status)}
              </div>
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {categories.find(c => c.id === product.category_id)?.name || 'Outros'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Criado em {formatDate(product.created_at)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingProduct(product)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openProductDialog(product)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProduct(product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando seu primeiro produto para vender através do Mercado Pago
            </p>
            <Button onClick={() => openProductDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Produto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Atualize as informações do produto' 
                : 'Preencha as informações para criar um novo produto'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Nome do produto"
                value={productForm.title || ''}
                onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição detalhada do produto"
                value={productForm.description || ''}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={productForm.category_id || ''}
                  onValueChange={(value) => setProductForm(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="picture_url">URL da Imagem</Label>
              <Input
                id="picture_url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={productForm.picture_url || ''}
                onChange={(e) => setProductForm(prev => ({ ...prev, picture_url: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={productForm.status || 'active'}
                onValueChange={(value) => setProductForm(prev => ({ ...prev, status: value as 'active' | 'paused' | 'closed' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveProduct} disabled={loading}>
              {editingProduct ? 'Atualizar' : 'Criar'} Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
          </DialogHeader>
          
          {viewingProduct && (
            <div className="space-y-4">
              {viewingProduct.picture_url && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={viewingProduct.picture_url} 
                    alt={viewingProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{viewingProduct.title}</h3>
                <p className="text-muted-foreground">{viewingProduct.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preço</Label>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(viewingProduct.price)}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(viewingProduct.status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <p>{categories.find(c => c.id === viewingProduct.category_id)?.name || 'Outros'}</p>
                </div>
                <div>
                  <Label>ID do Produto</Label>
                  <p className="font-mono text-sm">{viewingProduct.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Criado em</Label>
                  <p>{formatDate(viewingProduct.created_at)}</p>
                </div>
                <div>
                  <Label>Atualizado em</Label>
                  <p>{formatDate(viewingProduct.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingProduct(null)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setViewingProduct(null)
              openProductDialog(viewingProduct!)
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}