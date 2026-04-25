"use client"

import { useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Lock, 
  UserIcon, 
  Eye, 
  EyeOff, 
  Sparkles,
  Flame,
  Crown,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Shield
} from "lucide-react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: () => void
  theme?: any
}

const features = [
  { icon: BookOpen, text: "Acesso à Bíblia" },
  { icon: MessageSquare, text: "Chat com IA" },
  { icon: Shield, text: "100% Seguro" },
]

export function AuthModal({ isOpen, onClose, onLoginSuccess, theme }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const { signIn, signUp } = useSupabaseAuth()

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    const { data, error } = await signIn(email, password)
    setIsLoading(false)

    if (error) {
      toast({
        title: "Erro de Login",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    if (data?.session?.user) {
      onLoginSuccess?.()
      onClose()
    } else {
      toast({
        title: "Não foi possível entrar",
        description: "Confirme seu e-mail ou tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    const { data, error } = await signUp(email, password, name)
    setIsLoading(false)

    if (error) {
      toast({
        title: "Erro de Cadastro",
        description: error.message,
        variant: "destructive",
      })
    } else if (data.user) {
      toast({
        title: "Cadastro Realizado!",
        description: "Verifique seu e-mail para confirmar sua conta.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent className={cn(
        "sm:max-w-[500px] p-0 overflow-hidden border-2",
        theme?.card || "bg-white dark:bg-gray-900",
        theme?.border
      )} onPointerDownOutside={(e) => e.preventDefault()}>
        
        {/* Header with Avatar */}
        <div className={cn(
          "relative p-6 pb-4 border-b",
          theme?.border,
          "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
        )}>
          <DialogHeader className="text-center space-y-4">
            <motion.div 
              className="mx-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Avatar className="h-20 w-20 mx-auto ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
                <AvatarImage src="/prophet-avatar.png" alt="Profeta William Branham" />
                <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/20">
                  <Crown className="h-10 w-10 text-primary" />
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <div className="space-y-2">
              <DialogTitle className={cn(
                "text-2xl font-bold flex items-center justify-center gap-2",
                theme?.text
              )}>
                <Flame className="h-5 w-5 text-primary" />
                Falando com o Profeta
              </DialogTitle>
              <DialogDescription className={cn("text-sm", theme?.muted)}>
                {activeTab === "login" 
                  ? "Bem-vindo de volta! Acesse sua conta para continuar." 
                  : "Junte-se a milhares de pessoas estudando a Mensagem."}
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        {/* Features Badges */}
        <div className="px-6 py-3 flex justify-center gap-2 flex-wrap">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Badge 
                variant="secondary" 
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5",
                  theme?.card
                )}
              >
                <feature.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">{feature.text}</span>
              </Badge>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={cn(
              "grid w-full grid-cols-2 p-1 rounded-xl",
              theme?.card || "bg-muted"
            )}>
              <TabsTrigger 
                value="login"
                className={cn(
                  "rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all",
                  activeTab === "login" && "font-semibold"
                )}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className={cn(
                  "rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all",
                  activeTab === "signup" && "font-semibold"
                )}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="login" className="mt-6 space-y-4">
                <motion.form 
                  onSubmit={handleLogin} 
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className={cn("text-sm font-medium flex items-center gap-2", theme?.text)}>
                      <Mail className="h-4 w-4 text-primary" />
                      Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        className={cn(
                          "pl-4 h-12 rounded-xl border-2 focus-visible:ring-primary/20",
                          theme?.input,
                          theme?.border,
                          theme?.text
                        )}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className={cn("text-sm font-medium flex items-center gap-2", theme?.text)}>
                        <Lock className="h-4 w-4 text-primary" />
                        Senha
                      </Label>
                      <Link 
                        href="/recuperar-senha"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Esqueceu?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        className={cn(
                          "pl-4 pr-12 h-12 rounded-xl border-2 focus-visible:ring-primary/20",
                          theme?.input,
                          theme?.border,
                          theme?.text
                        )}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-primary/10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full h-12 rounded-xl font-semibold text-base",
                      "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                      "shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30",
                      "disabled:opacity-70"
                    )} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div 
                        className="flex items-center gap-2"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Entrando...
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="flex items-center gap-2"
                        whileHover={{ x: 2 }}
                      >
                        Entrar
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    )}
                  </Button>
                </motion.form>

                <motion.p 
                  className={cn("text-center text-sm", theme?.muted)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Não tem uma conta?{" "}
                  <button 
                    onClick={() => setActiveTab("signup")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Cadastre-se gratuitamente
                  </button>
                </motion.p>
              </TabsContent>

              <TabsContent value="signup" className="mt-6 space-y-4">
                <motion.form 
                  onSubmit={handleSignUp} 
                  className="space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className={cn("text-sm font-medium flex items-center gap-2", theme?.text)}>
                      <UserIcon className="h-4 w-4 text-primary" />
                      Nome completo
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Como devemos chamar você?"
                      className={cn(
                        "pl-4 h-12 rounded-xl border-2 focus-visible:ring-primary/20",
                        theme?.input,
                        theme?.border,
                        theme?.text
                      )}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className={cn("text-sm font-medium flex items-center gap-2", theme?.text)}>
                      <Mail className="h-4 w-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      className={cn(
                        "pl-4 h-12 rounded-xl border-2 focus-visible:ring-primary/20",
                        theme?.input,
                        theme?.border,
                        theme?.text
                      )}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className={cn("text-sm font-medium flex items-center gap-2", theme?.text)}>
                      <Lock className="h-4 w-4 text-primary" />
                      Crie uma senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        className={cn(
                          "pl-4 pr-12 h-12 rounded-xl border-2 focus-visible:ring-primary/20",
                          theme?.input,
                          theme?.border,
                          theme?.text
                        )}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-primary/10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full h-12 rounded-xl font-semibold text-base",
                      "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                      "shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30",
                      "disabled:opacity-70"
                    )} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div 
                        className="flex items-center gap-2"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criando conta...
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="flex items-center gap-2"
                        whileHover={{ x: 2 }}
                      >
                        Criar conta gratuita
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    )}
                  </Button>
                </motion.form>

                <motion.p 
                  className={cn("text-center text-xs", theme?.muted)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Ao criar uma conta, você concorda com nossos{" "}
                  <Link href="/termos-de-uso" className="text-primary hover:underline">Termos</Link>
                  {" "}e{" "}
                  <Link href="/politica-privacidade" className="text-primary hover:underline">Privacidade</Link>.
                </motion.p>

                <motion.p 
                  className={cn("text-center text-sm", theme?.muted)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Já tem uma conta?{" "}
                  <button 
                    onClick={() => setActiveTab("login")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Faça login
                  </button>
                </motion.p>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
