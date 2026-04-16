'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, Check, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isValidLink, setIsValidLink] = useState(true)
  const [isChecking, setIsChecking] = useState(true)

  // Verificar se o link é válido (tem token na URL)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        // Se não há sessão, o link pode ter expirado ou ser inválido
        if (!session) {
          // Verificar se há hash na URL (indica que veio do email)
          const hash = window.location.hash
          if (!hash || !hash.includes('access_token')) {
            setIsValidLink(false)
            setError('Link de recuperação inválido ou expirado. Solicite um novo.')
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        setIsChecking(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validações
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        throw error
      }
      
      setSuccess(true)
      toast.success('Senha atualizada com sucesso!')
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/')
      }, 2000)
      
    } catch (err: any) {
      console.error('Error updating password:', err)
      setError(err.message || 'Erro ao atualizar senha. Tente novamente.')
      toast.error(err.message || 'Erro ao atualizar senha')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-gray-600">Verificando link...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isValidLink && !success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-red-600">Link Inválido</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error}
            </p>
            <Button
              onClick={() => router.push('/recuperar-senha')}
              className="mt-4 bg-orange-600 hover:bg-orange-700"
            >
              Solicitar Novo Link
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-green-600">Senha Atualizada!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sua senha foi alterada com sucesso. Você será redirecionado...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Nova Senha</CardTitle>
        <CardDescription>
          Defina uma nova senha para sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Nova Senha */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
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

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Senha</Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              required
              minLength={6}
            />
          </div>

          {/* Validação de senhas */}
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              As senhas não coincidem
            </div>
          )}

          {/* Botão */}
          <Button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Atualizar Senha
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
