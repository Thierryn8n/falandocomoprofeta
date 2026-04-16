import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ForgotPasswordForm } from '@/components/forgot-password-form'

export const metadata: Metadata = {
  title: 'Recuperar Senha | Flando Como Profeta',
  description: 'Recupere o acesso à sua conta.',
}

export default function RecuperarSenhaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
            <CardDescription>
              Digite seu email para receber o link de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
