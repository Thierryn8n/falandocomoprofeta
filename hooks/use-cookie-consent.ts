'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useSupabaseAuth } from './use-supabase-auth'

export interface CookieConsent {
  essential: boolean
  analytics: boolean
  marketing: boolean
  acceptedAt?: string
  version: string
}

const CONSENT_KEY = 'cookie-consent-v1'
const CONSENT_VERSION = '1.0.0'

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useSupabaseAuth()

  const getDefaultConsent = (): CookieConsent => ({
    essential: true, // Sempre true
    analytics: false,
    marketing: false,
    version: CONSENT_VERSION
  })

  const loadConsent = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Verificar localStorage primeiro
      const stored = localStorage.getItem(CONSENT_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setConsent(parsed)
        setShowBanner(false)
        setIsLoading(false)
        return
      }

      // 2. Se usuário logado, buscar no Supabase
      if (user) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('cookie_consent, cookie_consent_at')
          .eq('id', user.id)
          .single()

        if (!error && data?.cookie_consent) {
          const consentData: CookieConsent = {
            ...data.cookie_consent,
            acceptedAt: data.cookie_consent_at,
            version: CONSENT_VERSION
          }
          setConsent(consentData)
          localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData))
          setShowBanner(false)
          setIsLoading(false)
          return
        }
      }

      // 3. Nenhum consentimento encontrado - mostrar banner
      setConsent(null)
      setShowBanner(true)
    } catch (error) {
      console.error('Error loading cookie consent:', error)
      setShowBanner(true)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const saveConsent = useCallback(async (newConsent: CookieConsent) => {
    const consentWithTimestamp: CookieConsent = {
      ...newConsent,
      acceptedAt: new Date().toISOString(),
      version: CONSENT_VERSION
    }

    // Salvar no localStorage
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentWithTimestamp))
    setConsent(consentWithTimestamp)
    setShowBanner(false)

    // Se usuário logado, salvar no Supabase
    if (user) {
      try {
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({
            cookie_consent: consentWithTimestamp,
            cookie_consent_at: consentWithTimestamp.acceptedAt
          })
          .eq('id', user.id)
      } catch (error) {
        console.error('Error saving consent to Supabase:', error)
      }
    }

    // Disparar evento para GTM/analytics
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cookie_consent_updated',
        cookie_consent: consentWithTimestamp
      })
    }
  }, [user])

  const acceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      version: CONSENT_VERSION
    })
  }, [saveConsent])

  const acceptEssential = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      version: CONSENT_VERSION
    })
  }, [saveConsent])

  const updateConsent = useCallback((updates: Partial<CookieConsent>) => {
    if (!consent) return
    saveConsent({
      ...consent,
      ...updates,
      version: CONSENT_VERSION
    })
  }, [consent, saveConsent])

  const clearConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY)
    setConsent(null)
    setShowBanner(true)
  }, [])

  const hasConsent = useCallback((type: 'essential' | 'analytics' | 'marketing') => {
    return consent?.[type] || false
  }, [consent])

  useEffect(() => {
    loadConsent()
  }, [loadConsent])

  return {
    consent,
    showBanner,
    isLoading,
    acceptAll,
    acceptEssential,
    updateConsent,
    clearConsent,
    hasConsent,
    saveConsent,
    setShowBanner
  }
}
