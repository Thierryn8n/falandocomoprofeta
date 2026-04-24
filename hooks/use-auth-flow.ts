"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSupabaseAuth } from "./use-supabase-auth"

interface AuthFlowState {
  isChecking: boolean
  showLoader: boolean
  loaderMessage: string
}

export function useAuthFlow() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, loading: authLoading, completeOnboarding } = useSupabaseAuth()
  
  const [flowState, setFlowState] = useState<AuthFlowState>({
    isChecking: true,
    showLoader: false,
    loaderMessage: "",
  })

  // Check where to redirect user after login
  const checkRedirect = useCallback(async () => {
    // Don't redirect if already on one of these pages
    const publicPages = ["/", "/login", "/recuperar-senha", "/atualizar-senha", "/termos-de-uso", "/politica-privacidade", "/cookies"]
    if (publicPages.includes(pathname)) {
      setFlowState(prev => ({ ...prev, isChecking: false }))
      return
    }

    // If not logged in, redirect to home
    if (!user && !authLoading) {
      router.replace("/")
      return
    }

    // Wait for profile to load
    if (authLoading || !profile) {
      return
    }

    // Show loader momentarily while deciding
    setFlowState({
      isChecking: true,
      showLoader: true,
      loaderMessage: "Preparando sua experiência",
    })

    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 800))

    // Check if user has completed onboarding
    const hasCompletedOnboarding = profile.onboarding_completed === true

    if (!hasCompletedOnboarding) {
      // User needs to see onboarding
      if (pathname !== "/onboarding") {
        router.replace("/onboarding")
      }
    } else {
      // User has completed onboarding
      // If trying to access onboarding again, redirect to welcome
      if (pathname === "/onboarding") {
        router.replace("/welcome")
      }
    }

    setFlowState(prev => ({
      ...prev,
      isChecking: false,
      showLoader: false,
    }))
  }, [user, profile, authLoading, pathname, router])

  useEffect(() => {
    if (!authLoading) {
      checkRedirect()
    }
  }, [authLoading, checkRedirect])

  // Function to finish onboarding and go to welcome
  const finishOnboarding = async () => {
    setFlowState({
      isChecking: true,
      showLoader: true,
      loaderMessage: "Finalizando configuração",
    })

    // Save to Supabase
    const { error } = await completeOnboarding()
    
    if (!error) {
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push("/welcome")
    }

    setFlowState(prev => ({
      ...prev,
      isChecking: false,
      showLoader: false,
    }))
  }

  // Function to skip onboarding
  const skipOnboarding = async () => {
    setFlowState({
      isChecking: true,
      showLoader: true,
      loaderMessage: "Carregando",
    })

    await completeOnboarding()
    await new Promise(resolve => setTimeout(resolve, 300))
    
    router.push("/welcome")
  }

  return {
    ...flowState,
    finishOnboarding,
    skipOnboarding,
    isAuthenticated: !!user,
    hasCompletedOnboarding: profile?.onboarding_completed === true,
  }
}
