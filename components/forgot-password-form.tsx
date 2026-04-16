'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Digite seu email')
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      // Enviar email de recuperação
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      })
      
      if (error) {
        throw error
      }
      
      setSent(true)
      toast.success('Email enviado! Verifique sua caixa de entrada.')
      
    } catch (error: any) {
      console.error('Error sending reset email:', error)
      toast.error(error.message || 'Erro ao enviar email. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-medium">Email Enviado!</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
        </p>
        <p className="text-xs text-gray-500">
          Não recebeu? Verifique a pasta de spam ou lixo eletrônico.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="pl-10"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !email}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Enviar Link de Recuperação
          </>
        )}
      </Button>

      <div className="text-center pt-4">
        <Link 
          href="/login" 
          className="text-sm text-orange-600 hover:underline inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Login
        </Link>
      </div>
    </form>
  )
}
