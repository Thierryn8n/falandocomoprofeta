'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { QrCode, Key, Save, Check, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface PixSettings {
  id?: string
  pix_key: string
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  beneficiary_name: string
  enabled: boolean
  instructions: string
  created_at?: string
  updated_at?: string
}

export default function PixSettingsPage() {
  const [settings, setSettings] = useState<PixSettings>({
    pix_key: '',
    pix_key_type: 'random',
    beneficiary_name: '',
    enabled: true,
    instructions: 'Após o pagamento, envie o comprovante para validação automática. O sistema analisará e liberará seu acesso em até 5 minutos.'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pix_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('pix_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações PIX</h1>
        <p className="text-gray-600">
          Configure a chave PIX para receber doações diretamente. Os usuários poderão escanear o QR Code ou copiar a chave.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status do PIX */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-orange-600" />
              Status do Sistema PIX
            </CardTitle>
            <CardDescription>
              Ative ou desative o pagamento via PIX direto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pix-enabled">Habilitar PIX Direto</Label>
                <p className="text-sm text-gray-500">
                  Quando ativo, os usuários verão a opção de pagar via PIX
                </p>
              </div>
              <Switch
                id="pix-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações da Chave */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-600" />
              Chave PIX
            </CardTitle>
            <CardDescription>
              Configure a chave PIX que será exibida para os doadores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de Chave */}
            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 'cpf', label: 'CPF' },
                  { value: 'cnpj', label: 'CNPJ' },
                  { value: 'email', label: 'E-mail' },
                  { value: 'phone', label: 'Celular' },
                  { value: 'random', label: 'Aleatória' }
                ].map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={settings.pix_key_type === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings({ ...settings, pix_key_type: type.value as any })}
                    className={settings.pix_key_type === type.value ? 'bg-orange-600' : ''}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chave PIX */}
            <div className="space-y-2">
              <Label htmlFor="pix-key">Chave PIX</Label>
              <div className="relative">
                <Input
                  id="pix-key"
                  type={showKey ? 'text' : 'password'}
                  value={settings.pix_key}
                  onChange={(e) => setSettings({ ...settings, pix_key: e.target.value })}
                  placeholder={
                    settings.pix_key_type === 'cpf' ? '000.000.000-00' :
                    settings.pix_key_type === 'cnpj' ? '00.000.000/0000-00' :
                    settings.pix_key_type === 'email' ? 'email@exemplo.com' :
                    settings.pix_key_type === 'phone' ? '+55 (11) 99999-9999' :
                    '00000000-0000-0000-0000-000000000000'
                  }
                  className="pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.pix_key)
                    toast.success('Chave copiada!')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Esta chave será exibida publicamente para os usuários fazerem PIX
              </p>
            </div>

            {/* Nome do Beneficiário */}
            <div className="space-y-2">
              <Label htmlFor="beneficiary">Nome do Beneficiário</Label>
              <Input
                id="beneficiary"
                value={settings.beneficiary_name}
                onChange={(e) => setSettings({ ...settings, beneficiary_name: e.target.value })}
                placeholder="Nome que aparecerá no QR Code PIX"
              />
              <p className="text-sm text-gray-500">
                Nome que será exibido quando o usuário for pagar via PIX
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções para o Usuário</CardTitle>
            <CardDescription>
              Mensagem exibida após o pagamento via PIX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={settings.instructions}
              onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
              className="w-full min-h-[120px] p-3 border rounded-md text-sm"
              placeholder="Digite as instruções que o usuário verá após fazer o PIX..."
            />
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-700">
                O sistema usará IA para analisar automaticamente os comprovantes enviados e liberar o acesso.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
