"use client"

import { useState, useEffect } from "react"
import { adminOps, type Document } from "@/lib/admin-operations"

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminOps.getDocuments()
      setDocuments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar documentos")
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async (document: Omit<Document, "id" | "created_at" | "updated_at" | "admin_id">) => {
    try {
      const newDocument = await adminOps.createDocument(document)
      setDocuments((prev) => [newDocument, ...prev])
      return newDocument
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar documento")
      throw err
    }
  }

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      const updatedDocument = await adminOps.updateDocument(id, updates)
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? updatedDocument : doc)))
      return updatedDocument
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar documento")
      throw err
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      await adminOps.deleteDocument(id)
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar documento")
      throw err
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    refetch: fetchDocuments,
  }
}
