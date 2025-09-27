'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  EyeOff, 
  Save, 
  TestTube, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Key,
  Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'

interface MercadoPagoCredentials {
  publicKey: string
  accessToken: string
  clientId: string
  clientSecret: string
}

export default function MercadoPagoConfig() {
  const { toast } = useToast()
  const { user, session } = useSupabaseAuth()
  const [credentials, setCredentials] = useState<MercadoPagoCredentials>({
    publicKey: '',
    accessToken: '',
    clientId: '',
    clientSecret: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showSecrets, setShowSecrets] = useState({
    accessToken: false,
    clientSecret: false
  })

  useEffect(() => {
    if (user && session) {
      loadCredentials()
    }
  }, [user, session])

  const getAuthHeaders = () => {
    if (!session?.access_token) {
      throw new Error('Token de autenticação não encontrado')
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  const loadCredentials = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mercado-pago/credentials', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setCredentials(data)
      } else if (response.status === 401) {
        toast({
          title: "Erro de Autenticação",
          description: "Você precisa estar logado como administrador",
          variant: "destructive"
        })
      } else if (response.status === 403) {
        toast({
          title: "Acesso Negado",
          description: "Apenas administradores podem acessar as credenciais",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar credenciais do Mercado Pago",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveCredentials = async () => {
    try {
      setSaving(true)
      
      // Validação básica
      if (!credentials.accessToken || !credentials.publicKey) {
        toast({
          title: "Erro de Validação",
          description: "Access Token e Public Key são obrigatórios",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/mercado-pago/credentials', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(credentials)
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Credenciais salvas com sucesso no banco de dados seguro"
        })
        loadCredentials() // Recarregar para obter dados atualizados
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar credenciais')
      }
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar credenciais",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    try {
      setTesting(true)
      
      if (!credentials.accessToken) {
        toast({
          title: "Erro",
          description: "Access Token é necessário para testar a conexão",
          variant: "destructive"
        })
        return
      }

      // Teste básico com a API do Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/payment_methods`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Conexão com Mercado Pago estabelecida com sucesso!"
        })
      } else {
        throw new Error('Falha na autenticação com Mercado Pago')
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar com o Mercado Pago. Verifique suas credenciais.",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const toggleSecretVisibility = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const updateCredential = (field: keyof MercadoPagoCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const maskSecret = (secret: string, show: boolean) => {
    if (show || !secret) return secret
    return secret.substring(0, 8) + '•'.repeat(Math.max(0, secret.length - 16)) + secret.substring(secret.length - 8)
  }

  if (!user || !session) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            <span>Você precisa estar logado como administrador para acessar esta seção</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando credenciais...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Configuração do Mercado Pago</h2>
        <p className="text-muted-foreground">
          Configure suas credenciais para integração com o Mercado Pago
        </p>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status da Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {credentials.accessToken && credentials.publicKey ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">Credenciais Configuradas</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-700">Credenciais Incompletas</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Credenciais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credenciais
          </CardTitle>
          <CardDescription>
            Insira suas credenciais do Mercado Pago obtidas no painel de desenvolvedor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Public Key */}
          <div className="space-y-2">
            <Label htmlFor="public-key">Public Key *</Label>
            <Input
              id="public-key"
              type="text"
              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={credentials.publicKey}
              onChange={(e) => updateCredential('publicKey', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Chave pública para identificar sua aplicação
            </p>
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="access-token">Access Token *</Label>
            <div className="relative">
              <Input
                id="access-token"
                type={showSecrets.accessToken ? "text" : "password"}
                placeholder="APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx"
                value={showSecrets.accessToken ? credentials.accessToken : maskSecret(credentials.accessToken, showSecrets.accessToken)}
                onChange={(e) => updateCredential('accessToken', e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleSecretVisibility('accessToken')}
              >
                {showSecrets.accessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Token de acesso para realizar operações (mantenha em segredo)
            </p>
          </div>

          <Separator />

          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="client-id">Client ID</Label>
            <Input
              id="client-id"
              type="text"
              placeholder="1234567890123456"
              value={credentials.clientId}
              onChange={(e) => updateCredential('clientId', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              ID do cliente (opcional, para funcionalidades avançadas)
            </p>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="client-secret">Client Secret</Label>
            <div className="relative">
              <Input
                id="client-secret"
                type={showSecrets.clientSecret ? "text" : "password"}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                value={showSecrets.clientSecret ? credentials.clientSecret : maskSecret(credentials.clientSecret, showSecrets.clientSecret)}
                onChange={(e) => updateCredential('clientSecret', e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleSecretVisibility('clientSecret')}
              >
                {showSecrets.clientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Chave secreta do cliente (opcional, mantenha em segredo)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3">
        <Button onClick={saveCredentials} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Credenciais
            </>
          )}
        </Button>

        <Button 
          variant="outline" 
          onClick={testConnection} 
          disabled={testing || !credentials.accessToken}
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Testar Conexão
            </>
          )}
        </Button>
      </div>

      {/* Informações de Ajuda */}
      <Card>
        <CardHeader>
          <CardTitle>Como obter suas credenciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Acesse sua conta do Mercado Pago</h4>
            <p className="text-sm text-muted-foreground">
              Entre em <a href="https://www.mercadopago.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mercadopago.com.br</a> e faça login
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Vá para Credenciais</h4>
            <p className="text-sm text-muted-foreground">
              Acesse: Seu perfil → Credenciais → Credenciais de produção
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">3. Copie suas credenciais</h4>
            <p className="text-sm text-muted-foreground">
              • <strong>Public Key:</strong> Chave pública para o frontend<br/>
              • <strong>Access Token:</strong> Token privado para o backend<br/>
              • <strong>Client ID/Secret:</strong> Para integrações OAuth (opcional)
            </p>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Segurança:</strong> Suas credenciais são armazenadas de forma criptografada no banco de dados Supabase. 
              Apenas administradores autenticados podem acessá-las.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}