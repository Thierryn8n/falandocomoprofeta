"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useSupabaseAuth } from "./use-supabase-auth"
import { useToast } from "./use-toast"

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  billing_cycle: string
  features: string[]
  is_active: boolean
}

interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: string
  current_period_start?: string
  current_period_end?: string
  plan: SubscriptionPlan
}

export function useSubscription() {
  const { user, profile } = useSupabaseAuth()
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [canChat, setCanChat] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadUserSubscription()
    } else {
      setLoading(false)
    }
  }, [user?.id, profile?.role]) // Adicionando profile.role como dependência

  const loadUserSubscription = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      console.log("🔍 Verificando role do usuário:", profile?.role)
      
      // Verificar se o usuário é admin - admins têm acesso ilimitado
      if (profile?.role === "admin") {
        console.log("✅ Usuário é ADMIN - concedendo acesso ilimitado")
        setCanChat(true)
        setHasActiveSubscription(true)
        setSubscription(null) // Admin não precisa de assinatura
        setLoading(false)
        return
      }

      console.log("👤 Usuário não é admin, verificando assinatura...")

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading subscription:", error)
        setCanChat(false)
        setHasActiveSubscription(false)
        return
      }

      setSubscription(data)
      
      // Verificar se a assinatura está ativa e não expirou
      const isActive = data && data.status === "active" && 
        (!data.current_period_end || new Date(data.current_period_end) > new Date())
      
      setCanChat(isActive)
      setHasActiveSubscription(isActive)
      
    } catch (error) {
      console.error("Error loading subscription:", error)
      setCanChat(false)
      setHasActiveSubscription(false)
    } finally {
      setLoading(false)
    }
  }

  const refreshSubscription = async () => {
    await loadUserSubscription()
  }

  // Função para verificar se precisa mostrar oferta de upgrade
  const shouldShowUpgradeOffer = () => {
    // Admins não precisam ver ofertas de upgrade
    if (profile?.role === "admin") return false
    return !hasActiveSubscription
  }

  // Função para obter informações de status do usuário
  const getSubscriptionStatus = () => {
    // Status especial para admins
    if (profile?.role === "admin") {
      return {
        type: "active" as const,
        message: "Acesso administrativo",
        planName: "Administrador"
      }
    }

    if (hasActiveSubscription) {
      return {
        type: "active" as const,
        message: "Acesso ilimitado ativo",
        planName: subscription?.plan?.name || "Plano Ativo"
      }
    }

    if (loading) {
      return {
        type: "loading" as const,
        message: "Carregando...",
        planName: null
      }
    }

    return {
      type: "inactive" as const,
      message: "Nenhuma assinatura ativa",
      planName: null
    }
  }

  return {
    subscription,
    loading,
    canChat,
    hasActiveSubscription,
    refreshSubscription,
    shouldShowUpgradeOffer,
    getSubscriptionStatus,
    isAdmin: profile?.role === "admin"
  }
}