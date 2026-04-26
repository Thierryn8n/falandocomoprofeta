"use client"

import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  ArrowLeft, 
  Check, 
  KeyRound,
  Shield,
  Sparkles,
  Crown,
  Lock,
  ArrowRight
} from "lucide-react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function RecuperarSenhaPage() {
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

  return (
    <div className="min-h-screen bg-[#F4ECD8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#8B7355]/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#A89080]/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Link */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground -ml-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o início
            </Button>
          </Link>
        </motion.div>

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
                  {sent ? (
                    <>
                      <Check className="h-6 w-6 text-green-600" />
                      Email Enviado!
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-6 w-6 text-[#8B7355]" />
                      Recuperar Senha
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-sm text-[#6B5D4C]">
                  {sent 
                    ? "Verifique sua caixa de entrada para continuar" 
                    : "Digite seu email para receber o link de recuperação"}
                </CardDescription>
              </div>
            </CardHeader>
          </div>

          <CardContent className="p-6">
            {sent ? (
              <motion.div 
                className="text-center space-y-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="flex justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <div className="p-4 bg-green-100 rounded-full ring-4 ring-green-600/20">
                    <Mail className="h-10 w-10 text-green-600" />
                  </div>
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#5C4D3C]">Email enviado com sucesso!</h3>
                  <p className="text-sm text-[#6B5D4C]">
                    Enviamos um link de recuperação para <strong className="text-[#8B7355]">{email}</strong>
                  </p>
                  <p className="text-xs text-[#8B7355]">
                    Não recebeu? Verifique sua pasta de spam ou lixo eletrônico.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Link href="/">
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar para Login
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="text-xs"
                    onClick={() => {
                      setSent(false)
                      setEmail('')
                    }}
                  >
                    Enviar para outro email
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Security Badge */}
                <div className="flex justify-center">
                  <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 bg-[#E8DCC8] text-[#5C4D3C] border-[#D4C4A8]">
                    <Shield className="h-4 w-4 text-[#8B7355]" />
                    <span className="text-xs font-medium">Processo 100% seguro</span>
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-[#5C4D3C]">
                    <Mail className="h-4 w-4 text-[#8B7355]" />
                    Email cadastrado
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      className="pl-4 h-12 rounded-xl border-2 border-[#D4C4A8] bg-[#F4ECD8] text-[#5C4D3C] placeholder:text-[#8B7355]/60 focus-visible:ring-[#8B7355]/20 focus-visible:border-[#8B7355]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-[#8B7355]">
                    Digite o mesmo email que você usou para criar sua conta
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-[#8B7355] to-[#A89080] hover:from-[#7A6545] hover:to-[#978070] text-white shadow-lg shadow-[#8B7355]/30 transition-all hover:shadow-xl hover:shadow-[#8B7355]/40"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div 
                      className="flex items-center gap-2"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="flex items-center gap-2"
                      whileHover={{ x: 2 }}
                    >
                      <Sparkles className="h-5 w-5" />
                      Enviar link de recuperação
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  )}
                </Button>

                <div className="text-center space-y-2 pt-2">
                  <p className="text-sm text-[#6B5D4C]">
                    Lembrou sua senha?{" "}
                    <Link href="/" className="text-[#8B7355] font-semibold hover:underline">
                      Faça login
                    </Link>
                  </p>
                </div>

                {/* Help Section */}
                <div className="pt-4 border-t border-[#D4C4A8]">
                  <p className="text-xs text-center text-[#8B7355]">
                    Precisa de ajuda?{" "}
                    <a href="mailto:suporte@falandocomoprofeta.com" className="text-[#8B7355] font-semibold hover:underline">
                      Entre em contato com o suporte
                    </a>
                  </p>
                </div>
              </motion.form>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-[#8B7355]">
            © 2024 Falando com o Profeta. Todos os direitos reservados.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
