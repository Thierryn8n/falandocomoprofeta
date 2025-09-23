import { supabase } from "./supabase"

export interface AppConfig {
  id: string
  key: string
  value: any
  description?: string
  admin_id: string
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  provider: string
  key_name: string
  key_value: string
  is_active: boolean
  admin_id?: string
  created_at: string
  updated_at: string
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
  admin_id?: string
  created_at: string
  updated_at: string
}

export interface HeresyResponse {
  id: string
  heresy_phrase: string
  correct_response: string
  keywords: string[]
  is_active: boolean
  admin_id?: string
  created_at: string
  updated_at: string
}

// Operações para App Config
export const getAppConfigAsAdmin = async (): Promise<AppConfig[]> => {
  const { data, error } = await supabase.from("app_config").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const updateAppConfigAsAdmin = async (key: string, value: any, description?: string): Promise<AppConfig> => {
  // Verificar se já existe
  const { data: existing } = await supabase.from("app_config").select("id").eq("key", key).single()

  if (existing) {
    // Atualizar existente
    const { data, error } = await supabase
      .from("app_config")
      .update({
        value,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Criar novo
    const { data, error } = await supabase
      .from("app_config")
      .insert({
        key,
        value,
        description,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const deleteAppConfigAsAdmin = async (key: string): Promise<void> => {
  const { error } = await supabase.from("app_config").delete().eq("key", key)
  if (error) throw error
}

// Operações para API Keys
export const getApiKeysAsAdmin = async (): Promise<ApiKey[]> => {
  const { data, error } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const updateApiKeyAsAdmin = async (id: string, updates: Partial<ApiKey>): Promise<ApiKey> => {
  const { data, error } = await supabase
    .from("api_keys")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const createApiKeyAsAdmin = async (
  apiKey: Omit<ApiKey, "id" | "created_at" | "updated_at" | "admin_id">,
): Promise<ApiKey> => {
  const { data, error } = await supabase.from("api_keys").insert(apiKey).select().single()

  if (error) throw error
  return data
}

export const deleteApiKeyAsAdmin = async (id: string): Promise<void> => {
  const { error } = await supabase.from("api_keys").delete().eq("id", id)
  if (error) throw error
}

// Operações para Documents
export const getDocumentsAsAdmin = async (): Promise<Document[]> => {
  const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const updateDocumentAsAdmin = async (id: string, updates: Partial<Document>): Promise<Document> => {
  const { data, error } = await supabase
    .from("documents")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const createDocumentAsAdmin = async (
  document: Omit<Document, "id" | "created_at" | "updated_at" | "admin_id">,
): Promise<Document> => {
  const { data, error } = await supabase.from("documents").insert(document).select().single()

  if (error) throw error
  return data
}

export const deleteDocumentAsAdmin = async (id: string): Promise<void> => {
  const { error } = await supabase.from("documents").delete().eq("id", id)
  if (error) throw error
}

// Operações para Heresy Responses
export const getHeresyResponsesAsAdmin = async (): Promise<HeresyResponse[]> => {
  const { data, error } = await supabase.from("heresy_responses").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const updateHeresyResponseAsAdmin = async (
  id: string,
  updates: Partial<HeresyResponse>,
): Promise<HeresyResponse> => {
  const { data, error } = await supabase
    .from("heresy_responses")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const createHeresyResponseAsAdmin = async (
  heresyResponse: Omit<HeresyResponse, "id" | "created_at" | "updated_at" | "admin_id">,
): Promise<HeresyResponse> => {
  const { data, error } = await supabase.from("heresy_responses").insert(heresyResponse).select().single()

  if (error) throw error
  return data
}

export const deleteHeresyResponseAsAdmin = async (id: string): Promise<void> => {
  const { error } = await supabase.from("heresy_responses").delete().eq("id", id)
  if (error) throw error
}

// Operações genéricas para listagem de dados administrativos
export const listAdminData = async (tableName: string): Promise<any[]> => {
  const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

// Verificar se o usuário atual é admin
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  return profile?.role === "admin"
}

// Operações administrativas consolidadas
export const adminOps = {
  // App Config
  getAppConfigs: getAppConfigAsAdmin,
  updateAppConfig: updateAppConfigAsAdmin,
  deleteAppConfig: deleteAppConfigAsAdmin,

  // API Keys
  getApiKeys: getApiKeysAsAdmin,
  updateApiKey: updateApiKeyAsAdmin,
  createApiKey: createApiKeyAsAdmin,
  deleteApiKey: deleteApiKeyAsAdmin,

  // Documents
  getDocuments: getDocumentsAsAdmin,
  updateDocument: updateDocumentAsAdmin,
  createDocument: createDocumentAsAdmin,
  deleteDocument: deleteDocumentAsAdmin,

  // Heresy Responses
  getHeresyResponses: getHeresyResponsesAsAdmin,
  updateHeresyResponse: updateHeresyResponseAsAdmin,
  createHeresyResponse: createHeresyResponseAsAdmin,
  deleteHeresyResponse: deleteHeresyResponseAsAdmin,

  // Utilities
  listData: listAdminData,
  isAdmin: isCurrentUserAdmin,
}
