import { Metadata } from 'next'
import { UpdatePasswordForm } from './update-password-form'

export const metadata: Metadata = {
  title: 'Nova Senha | Flando Como Profeta',
  description: 'Defina uma nova senha para sua conta.',
}

export default function AtualizarSenhaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <UpdatePasswordForm />
    </div>
  )
}
