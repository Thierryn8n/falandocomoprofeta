'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useSupabaseAuth } from './use-supabase-auth'

export interface TermsAcceptance {
  accepted: boolean
  acceptedAt?: string
  version: string
  termsUrl: string
  privacyUrl: string
}

const TERMS_VERSION = '1.0.0'
const TERMS_KEY = 'terms-accepted-v1'

export function useTerms() {
  const [terms, setTerms] = useState<TermsAcceptance | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user, loading: authLoading } = useSupabaseAuth()

  const checkTerms = useCallback(async () => {
    if (authLoading) return

    // Verificar se está em uma página de termos/privacidade - não mostrar modal nestas páginas
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const excludedPaths = [
        '/termos-de-uso',
        '/politica-privacidade',
        '/cookies',
        '/regras-de-conduta',
        '/termos-recusados'
      ]
      if (excludedPaths.some(excluded => path.startsWith(excluded))) {
        setShowModal(false)
        setIsLoading(false)
        return
      }
    }

    setIsLoading(true)
    try {
      // 1. Verificar localStorage primeiro
      const stored = localStorage.getItem(TERMS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Verificar se a versão é a mesma
        if (parsed.version === TERMS_VERSION) {
          setTerms(parsed)
          setShowModal(false)
          setIsLoading(false)
          return
        }
      }

      // 2. Se usuário logado, buscar no Supabase
      if (user) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('terms_accepted_at, terms_version')
          .eq('id', user.id)
          .single()

        if (!error && data?.terms_accepted_at) {
          // Verificar se a versão aceita é a atual
          if (data.terms_version === TERMS_VERSION) {
            const termsData: TermsAcceptance = {
              accepted: true,
              acceptedAt: data.terms_accepted_at,
              version: TERMS_VERSION,
              termsUrl: '/termos-de-uso',
              privacyUrl: '/politica-privacidade'
            }
            setTerms(termsData)
            localStorage.setItem(TERMS_KEY, JSON.stringify(termsData))
            setShowModal(false)
            setIsLoading(false)
            return
          }
        }
      }

      // 3. Nenhuma aceitação válida encontrada - NÃO mostrar modal automaticamente
      // O modal só aparece quando o usuário clica em "Personalizar"
      setTerms(null)
      setShowModal(false)
    } catch (error) {
      console.error('Error checking terms:', error)
      setShowModal(false)
    } finally {
      setIsLoading(false)
    }
  }, [user, authLoading])

  const acceptTerms = useCallback(async (cookiePreferences?: { analytics?: boolean; marketing?: boolean }) => {
    const now = new Date().toISOString()
    const termsData: TermsAcceptance = {
      accepted: true,
      acceptedAt: now,
      version: TERMS_VERSION,
      termsUrl: '/termos-de-uso',
      privacyUrl: '/politica-privacidade'
    }

    // Salvar termos no localStorage
    localStorage.setItem(TERMS_KEY, JSON.stringify(termsData))
    setTerms(termsData)
    setShowModal(false)

    // Também salvar cookie consent (essenciais sempre true)
    const consentKey = 'cookie-consent-v1'
    const consentData = {
      essential: true,
      analytics: cookiePreferences?.analytics ?? false,
      marketing: cookiePreferences?.marketing ?? false,
      acceptedAt: now,
      version: '1.0.0'
    }
    localStorage.setItem(consentKey, JSON.stringify(consentData))

    // Se usuário logado, salvar no Supabase
    if (user) {
      try {
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({
            terms_accepted_at: now,
            terms_version: TERMS_VERSION,
            cookie_consent: consentData,
            cookie_consent_at: now
          })
          .eq('id', user.id)
      } catch (error) {
        console.error('Error saving terms acceptance:', error)
      }
    }

    // Disparar evento para atualizar o cookie banner
    window.dispatchEvent(new Event('cookieConsentUpdated'))
  }, [user])

  const declineTerms = useCallback(() => {
    // Usuário recusou - redirecionar para página explicativa
    window.location.href = '/termos-recusados'
  }, [])

  const hasAcceptedTerms = useCallback(() => {
    return terms?.accepted === true && terms?.version === TERMS_VERSION
  }, [terms])

  useEffect(() => {
    checkTerms()
  }, [checkTerms])

  return {
    terms,
    showModal,
    isLoading,
    acceptTerms,
    declineTerms,
    hasAcceptedTerms,
    checkTerms,
    setShowModal,
    TERMS_VERSION
  }
}
