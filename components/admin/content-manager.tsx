"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Trash2, Edit, Plus, Search, Filter, Eye } from "lucide-react"
import { supabase, type Document } from "@/lib/supabase"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useDocuments } from "@/hooks/use-documents"

export function ContentManager() {
  const { profile } = useSupabaseAuth()
  const { documents, loading, createDocument, updateDocument, deleteDocument, refetch } = useDocuments()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newTextContent, setNewTextContent] = useState("")
  const [newTextTitle, setNewTextTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log("File selected:", file)
    if (file) {
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      })
      setSelectedFile(file)
    }
  }

  const uploadDocument = async () => {
    if (!selectedFile || !profile) {
      console.log("Missing file or profile:", { selectedFile: !!selectedFile, profile: !!profile })
      return
    }

    console.log("Starting upload process for:", selectedFile.name)
    setUploading(true)

    try {
      // Check file size (max 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Máximo 100MB permitido.")
      }

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `documents/${fileName}`

      console.log("Uploading to path:", filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }

      console.log("Upload successful:", uploadData)

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath)

      console.log("Public URL:", publicUrl)

      // Create document record
      const documentData = {
        title: selectedFile.name.replace(/\.[^/.]+$/, ""), // Remove extension
        type: selectedFile.type.includes("pdf")
          ? ("pdf" as const)
          : selectedFile.type.includes("audio")
            ? ("audio" as const)
            : ("text" as const),
        file_url: publicUrl,
        file_size: selectedFile.size,
        status: "processing" as const,
        uploaded_by: profile.id,
      }

      console.log("Creating document record:", documentData)

      const newDoc = await createDocument(documentData)

      if (newDoc) {
        console.log("Document created successfully:", newDoc)
        setSelectedFile(null)

        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""

        toast({
          title: "Upload realizado com sucesso!",
          description: "O documento está sendo processado pela IA.",
        })

        // Simulate processing (in real app, this would be done by a background job)
        setTimeout(async () => {
          try {
            await updateDocument(newDoc.id, { status: "processed" })
            toast({
              title: "Processamento concluído",
              description: "O documento foi adicionado à base de conhecimento.",
            })
          } catch (error) {
            console.error("Error updating document status:", error)
          }
        }, 3000)
      } else {
        throw new Error("Falha ao criar registro do documento")
      }
    } catch (error: any) {
      console.error("Error in uploadDocument:", error.message, error)
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload do arquivo.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const addTextContent = async () => {
    if (!newTextTitle.trim() || !newTextContent.trim() || !profile) return

    try {
      const newDoc = await createDocument({
        title: newTextTitle,
        type: "text",
        content: newTextContent,
        file_size: newTextContent.length,
        status: "processed",
        uploaded_by: profile.id,
      })

      if (newDoc) {
        setNewTextTitle("")
        setNewTextContent("")
        toast({
          title: "Texto adicionado",
          description: "O conteúdo foi adicionado à base de conhecimento.",
        })
      }
    } catch (error) {
      console.error("Error adding text content:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o conteúdo.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      const success = await deleteDocument(id)
      if (success) {
        toast({
          title: "Documento removido",
          description: "O documento foi removido da base de conhecimento.",
        })
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o documento.",
        variant: "destructive",
      })
    }
  }

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document)
    setNewTextTitle(document.title)
    setNewTextContent(document.content || "")
  }

  const saveEditedDocument = async () => {
    if (!editingDocument || !newTextTitle.trim()) return

    try {
      const updated = await updateDocument(editingDocument.id, {
        title: newTextTitle,
        content: newTextContent,
      })

      if (updated) {
        setEditingDocument(null)
        setNewTextTitle("")
        setNewTextContent("")
        toast({
          title: "Documento atualizado",
          description: "As alterações foram salvas com sucesso.",
        })
      }
    } catch (error) {
      console.error("Error updating document:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      })
    }
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.content && doc.content.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "processed":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: Document["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />
      case "audio":
        return <div className="h-4 w-4 rounded-full bg-primary" />
      case "text":
        return <Edit className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Gerenciar Conteúdo</h1>
        <p className="text-muted-foreground">Gerencie a base de conhecimento do Profeta William Branham</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload de Arquivos</TabsTrigger>
          <TabsTrigger value="text">{editingDocument ? "Editar Texto" : "Adicionar Texto"}</TabsTrigger>
          <TabsTrigger value="manage">Gerenciar Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de PDFs e Áudios</CardTitle>
              <CardDescription>Carregue mensagens do Profeta William Branham em PDF ou áudio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Selecionar Arquivo</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.mp3,.wav,.m4a"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>

              {selectedFile && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button onClick={uploadDocument} disabled={uploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Enviando..." : "Fazer Upload"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>Formatos aceitos: PDF, MP3, WAV, M4A</p>
                <p>Tamanho máximo: 100MB por arquivo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingDocument ? "Editar Conteúdo" : "Adicionar Texto Manual"}</CardTitle>
              <CardDescription>
                {editingDocument
                  ? "Edite o conteúdo do documento selecionado"
                  : "Insira trechos específicos, versículos ou ensinamentos"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-title">Título do Conteúdo</Label>
                <Input
                  id="text-title"
                  placeholder="Ex: A Divindade - Mensagem 61-0425"
                  value={newTextTitle}
                  onChange={(e) => setNewTextTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-content">Conteúdo</Label>
                <Textarea
                  id="text-content"
                  placeholder="Cole aqui o texto da mensagem ou ensinamento..."
                  className="min-h-[200px]"
                  value={newTextContent}
                  onChange={(e) => setNewTextContent(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={editingDocument ? saveEditedDocument : addTextContent}
                  disabled={!newTextTitle.trim() || !newTextContent.trim()}
                >
                  {editingDocument ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Conteúdo
                    </>
                  )}
                </Button>

                {editingDocument && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingDocument(null)
                      setNewTextTitle("")
                      setNewTextContent("")
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos na Base de Conhecimento</CardTitle>
              <CardDescription>Gerencie todos os documentos carregados ({documents.length} total)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documentos..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={refetch}>
                  <Filter className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(doc.type)}
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{doc.file_size ? formatFileSize(doc.file_size) : "N/A"}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString("pt-BR")}</span>
                          <Badge variant="secondary" className="ml-2">
                            <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(doc.status)}`} />
                            {doc.status === "processed"
                              ? "Processado"
                              : doc.status === "processing"
                                ? "Processando"
                                : "Erro"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.content && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDocument(doc)}
                          title="Editar conteúdo"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {doc.file_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.file_url, "_blank")}
                          title="Visualizar arquivo"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Excluir documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredDocuments.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum documento encontrado" : "Nenhum documento carregado ainda"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
