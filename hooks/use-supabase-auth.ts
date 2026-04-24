"use client"

import { useState, useEffect, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: "user" | "admin"
  onboarding_completed?: boolean
  created_at: string
  updated_at: string
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setProfile(data)
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log("[Auth] Starting auth check (single subscription)...")

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log("[Auth] Session check complete, user:", session?.user?.id || "none")
        setUser(session?.user ?? null)
        if (session?.user) {
          void loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error("[Auth] Session check error:", err)
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        void loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  // Evita spinner infinito se getSession/onAuthStateChange falharem de forma inesperada
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading((prev) => (prev ? false : prev))
    }, 8000)
    return () => clearTimeout(t)
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Function to complete onboarding
  const completeOnboarding = async () => {
    if (!user) return { error: new Error("User not authenticated") }
    
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq("id", user.id)
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, onboarding_completed: true } : null)
    }
    
    return { error }
  }

  // Computed property to check if user is admin
  const isAdmin = profile?.role === "admin"

  return {
    user,
    profile,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    completeOnboarding,
  }
}
