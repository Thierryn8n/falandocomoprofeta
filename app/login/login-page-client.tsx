"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { AuthModal } from "@/components/auth-modal"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Crown,
  Flame,
  ArrowLeft,
  Sparkles,
  BookOpen,
  MessageSquare,
  Shield
} from "lucide-react"
import Link from "next/link"

const features = [
  { icon: BookOpen, text: "Acesso à Bíblia" },
  { icon: MessageSquare, text: "Chat com IA" },
  { icon: Shield, text: "100% Seguro" },
]

export default function LoginPageClient() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true)
  const router = useRouter()

  const handleLoginSuccess = () => {
    console.log("[LoginPage] Login success, redirecting to /bible-study-miro")
    router.push('/bible-study-miro')
  }

  const handleModalClose = () => {
    // Don't allow closing the modal - user must login
    // setIsAuthModalOpen(false)
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

        {/* Auth Modal Container */}
        <div className="relative">
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={handleModalClose}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>

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
