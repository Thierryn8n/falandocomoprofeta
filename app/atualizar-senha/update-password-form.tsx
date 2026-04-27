"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Check, 
  AlertCircle, 
  Crown,
  Shield,
  Sparkles,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

  // Verificar se o link é válido
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
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
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        throw error
      }
      
      setSuccess(true)
      toast.success('Senha atualizada com sucesso!')
      
      setTimeout(() => {
        router.push('/')
      }, 3000)
      
    } catch (err: any) {
      console.error('Error updating password:', err)
      setError(err.message || 'Erro ao atualizar senha. Tente novamente.')
      toast.error(err.message || 'Erro ao atualizar senha')
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(newPassword)
  const strengthLabels = ['Muito fraca', 'Fraca', 'Média', 'Boa', 'Forte', 'Muito forte']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-emerald-500']

  if (isChecking) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-[#D4C4A8] shadow-2xl bg-[#FAF3E8]">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-10 h-10 border-4 border-[#8B7355]/30 border-t-[#8B7355] rounded-full" />
              </motion.div>
              <p className="text-[#6B5D4C] font-medium">Verificando link...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!isValidLink && !success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-[#D4C4A8] shadow-2xl overflow-hidden bg-[#FAF3E8]">
          <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-b border-[#D4C4A8] p-6">
            <CardHeader className="text-center space-y-4 pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
                className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center ring-4 ring-red-500/20"
              >
                <XCircle className="h-8 w-8 text-red-600" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl font-bold text-red-600">Link Inválido</CardTitle>
                <CardDescription className="text-sm text-[#6B5D4C]">
                  {error}
                </CardDescription>
              </div>
            </CardHeader>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-[#6B5D4C] text-center">
                O link de recuperação pode ter expirado ou já foi usado.
              </p>
              <Link href="/recuperar-senha">
                <Button
                  className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-[#8B7355] to-[#A89080] hover:from-[#7A6545] hover:to-[#978070] text-white shadow-lg shadow-[#8B7355]/30"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Solicitar Novo Link
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-[#D4C4A8] shadow-2xl overflow-hidden bg-[#FAF3E8]">
          <div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-b border-[#D4C4A8] p-6">
            <CardHeader className="text-center space-y-4 pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
                className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center ring-4 ring-green-500/20"
              >
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl font-bold text-green-600">Senha Atualizada!</CardTitle>
                <CardDescription className="text-sm text-[#6B5D4C]">
                  Sua senha foi alterada com sucesso
                </CardDescription>
              </div>
            </CardHeader>
          </div>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-[#6B5D4C]">
                Você será redirecionado para a página de login em alguns segundos...
              </p>
              <motion.div 
                className="w-full bg-[#D4C4A8] rounded-full h-2 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </motion.div>
              <Link href="/">
                <Button variant="outline" className="w-full h-12 rounded-xl border-[#D4C4A8] text-[#8B7355] hover:bg-[#E8DCC8]">
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Ir para Login Agora
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card className="border-2 border-[#D4C4A8] shadow-2xl overflow-hidden bg-[#FAF3E8]">
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-br from-[#8B7355]/15 via-[#A89080]/10 to-transparent border-b border-[#D4C4A8] p-6">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Avatar className="h-16 w-16 mx-auto ring-4 ring-[#8B7355]/30 ring-offset-4 ring-offset-[#FAF3E8]">
                <AvatarImage src="https://wlwwgnimfuvoxjecdnza.supabase.co/storage/v1/object/public/profile-images/avatars/prophet-avatar-1753104005783.png" alt="Profeta William Branham" />
                <AvatarFallback className="bg-gradient-to-br from-[#8B7355]/40 to-[#A89080]/20">
                  <Crown className="h-8 w-8 text-[#8B7355]" />
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 text-[#5C4D3C]">
                <KeyRound className="h-6 w-6 text-[#8B7355]" />
                Nova Senha
              </CardTitle>
              <CardDescription className="text-sm text-[#6B5D4C]">
                Defina uma nova senha segura para sua conta
              </CardDescription>
            </div>
          </CardHeader>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Security Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 bg-[#E8DCC8] text-[#5C4D3C] border-[#D4C4A8]">
                <Shield className="h-4 w-4 text-[#8B7355]" />
                <span className="text-xs font-medium">Criptografia de ponta a ponta</span>
              </Badge>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Nova Senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Nova Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite uma senha forte"
                  required
                  minLength={6}
                  className="h-12 rounded-xl border-2 border-[#D4C4A8] bg-[#F4ECD8] text-[#5C4D3C] placeholder:text-[#8B7355]/60 focus-visible:ring-[#8B7355]/20 focus-visible:border-[#8B7355] pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-[#8B7355]/10 text-[#8B7355]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <div className="flex gap-1 h-1.5">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex-1 rounded-full transition-all duration-300",
                          index < passwordStrength 
                            ? strengthColors[passwordStrength - 1] 
                            : "bg-[#D4C4A8]"
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    "text-xs font-medium",
                    passwordStrength > 0 && strengthColors[passwordStrength - 1].replace('bg-', 'text-')
                  )}>
                    Força: {strengthLabels[passwordStrength]}
                  </p>
                </motion.div>
              )}
              
              <p className="text-xs text-[#8B7355]">
                Mínimo de 6 caracteres. Use letras, números e símbolos para mais segurança.
              </p>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-[#5C4D3C]">
                <CheckCircle2 className="h-4 w-4 text-[#8B7355]" />
                Confirmar Senha
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente a senha"
                required
                minLength={6}
                className={cn(
                  "h-12 rounded-xl border-2 border-[#D4C4A8] bg-[#F4ECD8] text-[#5C4D3C] placeholder:text-[#8B7355]/60 focus-visible:ring-[#8B7355]/20 focus-visible:border-[#8B7355]",
                  confirmPassword && newPassword !== confirmPassword && "border-red-300 focus-visible:ring-red-200"
                )}
              />
              
              {/* Match Indicator */}
              <AnimatePresence>
                {confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "flex items-center gap-2 text-xs font-medium",
                      newPassword === confirmPassword ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Senhas coincidem
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Senhas não coincidem
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botão */}
            <Button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className={cn(
                "w-full h-12 rounded-xl font-semibold text-base text-white",
                "bg-gradient-to-r from-[#8B7355] to-[#A89080] hover:from-[#7A6545] hover:to-[#978070]",
                "shadow-lg shadow-[#8B7355]/30 transition-all hover:shadow-xl hover:shadow-[#8B7355]/40",
                "disabled:opacity-50"
              )}
            >
              {isLoading ? (
                <motion.div 
                  className="flex items-center gap-2"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Atualizando...
                </motion.div>
              ) : (
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ x: 2 }}
                >
                  <Lock className="h-5 w-5" />
                  Atualizar Senha
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              )}
            </Button>
          </form>

          {/* Back Link */}
          <div className="mt-6 pt-4 border-t border-[#D4C4A8] text-center">
            <p className="text-sm text-[#6B5D4C]">
              Lembrou sua senha antiga?{" "}
              <Link href="/" className="text-[#8B7355] font-semibold hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
