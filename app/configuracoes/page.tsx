import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Lock, Bell, Shield } from 'lucide-react'
import { ChangePasswordForm } from '@/components/change-password-form'

export const metadata: Metadata = {
  title: 'Configurações | Flando Como Profeta',
  description: 'Gerencie suas configurações de conta, senha e privacidade.',
}

export default function ConfiguracoesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas preferências e segurança da conta
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Alterar Senha */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Lock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Segurança</CardTitle>
                  <CardDescription>Altere sua senha</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          {/* Perfil */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Perfil</CardTitle>
                  <CardDescription>Informações da conta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Para atualizar seu nome ou email, entre em contato com o suporte.
              </p>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notificações</CardTitle>
                  <CardDescription>Preferências de comunicação</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Em breve você poderá gerenciar suas notificações por email.
              </p>
            </CardContent>
          </Card>

          {/* Privacidade */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Privacidade</CardTitle>
                  <CardDescription>Dados e cookies</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <a 
                href="/politica-privacidade" 
                className="text-sm text-orange-600 hover:underline block"
              >
                Política de Privacidade
              </a>
              <a 
                href="/cookies" 
                className="text-sm text-orange-600 hover:underline block"
              >
                Gerenciar Cookies
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
