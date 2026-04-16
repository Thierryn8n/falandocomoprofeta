'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAuth } from './use-supabase-auth'
import { supabase } from '@/lib/supabase'

interface DonationPackage {
  id: string
  name: string
  description: string
  price: number
  questionsAdded: number
  cardColor: string
  icon: string
  costPerQuestion: string
}

interface UseDonationPackagesReturn {
  packages: DonationPackage[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createDonation: (packageId: string, paymentMethod: 'pix' | 'credit_card') => Promise<{
    donationId: string
    preferenceId: string
    initPoint: string
    questionsAdded: number
  } | null>
  processingPackage: string | null
}

export function useDonationPackages(): UseDonationPackagesReturn {
  const { user } = useSupabaseAuth()
  const [packages, setPackages] = useState<DonationPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingPackage, setProcessingPackage] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)

  // Get session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/donations/packages')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch packages')
      }

      const data = await response.json()
      setPackages(data.packages || [])
    } catch (err) {
      console.error('[useDonationPackages] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const createDonation = useCallback(async (
    packageId: string, 
    paymentMethod: 'pix' | 'credit_card'
  ): Promise<{
    donationId: string
    preferenceId: string
    initPoint: string
    questionsAdded: number
  } | null> => {
    if (!user || !session?.access_token) {
      return null
    }

    setProcessingPackage(packageId)

    try {
      const response = await fetch('/api/donations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          packageId,
          paymentMethod
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create donation')
      }

      return {
        donationId: data.donationId,
        preferenceId: data.preferenceId,
        initPoint: data.initPoint,
        questionsAdded: data.questionsAdded
      }
    } catch (err) {
      console.error('[useDonationPackages] Create error:', err)
      return null
    } finally {
      setProcessingPackage(null)
    }
  }, [user, session])

  // Initial fetch
  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  return {
    packages,
    loading,
    error,
    refresh: fetchPackages,
    createDonation,
    processingPackage
  }
}
