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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
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

        <Card className="border-2 shadow-2xl overflow-hidden">
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b p-6">
            <CardHeader className="text-center space-y-4 pb-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Avatar className="h-16 w-16 mx-auto ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
                  <AvatarImage src="/prophet-avatar.png" alt="Profeta William Branham" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/20">
                    <Crown className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  {sent ? (
                    <>
                      <Check className="h-6 w-6 text-green-500" />
                      Email Enviado!
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-6 w-6 text-primary" />
                      Recuperar Senha
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
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
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full ring-4 ring-green-500/20">
                    <Mail className="h-10 w-10 text-green-600" />
                  </div>
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Email enviado com sucesso!</h3>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um link de recuperação para <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
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
                  <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">Processo 100% seguro</span>
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email cadastrado
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      className="pl-4 h-12 rounded-xl border-2 focus-visible:ring-primary/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite o mesmo email que você usou para criar sua conta
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
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
                  <p className="text-sm text-muted-foreground">
                    Lembrou sua senha?{" "}
                    <Link href="/" className="text-primary font-semibold hover:underline">
                      Faça login
                    </Link>
                  </p>
                </div>

                {/* Help Section */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-center text-muted-foreground">
                    Precisa de ajuda?{" "}
                    <a href="mailto:suporte@falandocomoprofeta.com" className="text-primary hover:underline">
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
          <p className="text-xs text-muted-foreground">
            © 2024 Falando com o Profeta. Todos os direitos reservados.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
