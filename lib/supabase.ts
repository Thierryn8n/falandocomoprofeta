import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wlwwgnimfuvoxjecdnza.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQxNTUsImV4cCI6MjA2ODYzMDE1NX0.cbPMldu0By33z3ntjC7jKQA08S6LcNHQseHR7-QYLmc"

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Singleton instance to prevent multiple clients
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null

// Export a function to get the same client instance
export function createClient() {
  if (!clientInstance) {
    clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  return clientInstance
}

// Admin client with service role (lazy initialization)
let adminClientInstance: ReturnType<typeof createSupabaseClient> | null = null

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin should only be used on server side')
  }
  
  if (!adminClientInstance) {
    const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    }
    
    adminClientInstance = createSupabaseClient(serviceUrl, serviceKey)
  }
  
  return adminClientInstance
}
export interface Profile {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: "user" | "admin"
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface AppConfig {
  id: string
  key: string
  value: any
  description?: string
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  provider: string
  key_name: string
  key_value: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HeresyResponse {
  id: string
  heresy_phrase: string
  correct_response: string
  keywords: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HeresyLog {
  id: string
  user_id?: string
  conversation_id?: string
  user_message: string
  detected_heresy_id?: string
  action_taken:
    | "responded_with_predefined"
    | "ignored_off_topic"
    | "passed_to_ai"
    | "ai_classified_irrelevant"
    | "ai_classified_heresy"
  ai_classification?: string
  created_at: string
}

export interface Document {
  id: string
  title: string
  type: string
  content: string | null
  file_url: string | null
  file_size: number | null
  status: "processing" | "processed" | "error"
  uploaded_by: string | null
  created_at: string
  updated_at: string
}
