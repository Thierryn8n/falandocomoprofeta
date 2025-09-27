import { useState, useEffect } from 'react'

interface SubscriptionPlan {
  id: string
  plan_type: string
  price: number
  currency: string
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscription-plans')
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans')
      }
      
      const data = await response.json()
      setPlans(data.plans || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching subscription plans:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const updatePlanPrice = async (planType: string, price: number) => {
    try {
      const response = await fetch('/api/subscription-plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType, price }),
      })

      if (!response.ok) {
        throw new Error('Failed to update plan price')
      }

      // Refresh plans after update
      await fetchPlans()
      return true
    } catch (err) {
      console.error('Error updating plan price:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    updatePlanPrice
  }
}