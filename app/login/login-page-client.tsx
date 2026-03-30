'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthModal } from '@/components/auth-modal'

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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Estudos Bíblicos</h1>
          <p className="text-muted-foreground">Faça login para acessar seu painel de estudos</p>
        </div>
        
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={handleModalClose}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </div>
  )
}
