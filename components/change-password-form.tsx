'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    
    if (newPassword === currentPassword) {
      toast.error('A nova senha deve ser diferente da senha atual')
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      // Atualizar senha no Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        throw error
      }
      
      setSuccess(true)
      toast.success('Senha alterada com sucesso!')
      
      // Limpar campos
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Senha Atual */}
      <div className="space-y-2">
        <Label htmlFor="current-password">Senha Atual</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Digite sua senha atual"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Nova Senha */}
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova Senha</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Digite a nova senha"
            required
            minLength={6}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Mínimo de 6 caracteres
        </p>
      </div>

      {/* Confirmar Nova Senha */}
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showNewPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme a nova senha"
            required
            minLength={6}
            className="pr-10"
          />
        </div>
      </div>

      {/* Mensagem de erro se senhas não coincidem */}
      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          As senhas não coincidem
        </div>
      )}

      {/* Mensagem de sucesso */}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          <Check className="h-4 w-4" />
          Senha alterada com sucesso!
        </div>
      )}

      {/* Botão */}
      <Button
        type="submit"
        disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {isLoading ? (
          <>
            <Lock className="h-4 w-4 mr-2 animate-spin" />
            Alterando...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Alterar Senha
          </>
        )}
      </Button>

      {/* Link para recuperar senha */}
      <div className="text-center pt-2">
        <a 
          href="/recuperar-senha" 
          className="text-sm text-orange-600 hover:underline"
        >
          Esqueceu sua senha atual?
        </a>
      </div>
    </form>
  )
}
