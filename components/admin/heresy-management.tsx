"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash, Save, X, Loader2, Lock } from "lucide-react"
import { supabase, type HeresyResponse } from "@/lib/supabase"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

export function HeresyManagement() {
  const { profile, loading: authLoading } = useSupabaseAuth()
  const [heresies, setHeresies] = useState<HeresyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingHeresy, setEditingHeresy] = useState<HeresyResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const isAdmin = profile?.role === "admin"

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchHeresies()
    } else if (!authLoading && !isAdmin) {
      setLoading(false) // Stop loading if not admin
    }
  }, [authLoading, isAdmin])

  const fetchHeresies = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("heresy_responses")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching heresies:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as respostas de heresias.",
        variant: "destructive",
      })
    } else {
      setHeresies(data || [])
    }
    setLoading(false)
  }

  const handleSaveHeresy = async () => {
    if (!isAdmin) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para salvar.",
        variant: "destructive",
      })
      return
    }

    if (!editingHeresy?.heresy_phrase || !editingHeresy?.correct_response) {
      toast({
        title: "Campos obrigatórios",
        description: "A frase da heresia e a resposta correta são obrigatórias.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      let error = null
      if (editingHeresy.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from("heresy_responses")
          .update({
            heresy_phrase: editingHeresy.heresy_phrase,
            correct_response: editingHeresy.correct_response,
            keywords: editingHeresy.keywords,
            is_active: editingHeresy.is_active,
          })
          .eq("id", editingHeresy.id)
        error = updateError
      } else {
        // Insert new
        const { error: insertError } = await supabase.from("heresy_responses").insert({
          heresy_phrase: editingHeresy.heresy_phrase,
          correct_response: editingHeresy.correct_response,
          keywords: editingHeresy.keywords,
          is_active: editingHeresy.is_active,
        })
        error = insertError
      }

      if (error) {
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Definição de heresia salva com sucesso.",
      })
      setIsDialogOpen(false)
      setEditingHeresy(null)
      fetchHeresies()
    } catch (error) {
      console.error("Error saving heresy:", error)
      toast({
        title: "Erro",
        description: `Não foi possível salvar a definição de heresia: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHeresy = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para excluir.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Tem certeza que deseja excluir esta definição de heresia?")) {
      return
    }

    setLoading(true)
    const { error } = await supabase.from("heresy_responses").delete().eq("id", id)
    if (error) {
      console.error("Error deleting heresy:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a definição de heresia.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Definição de heresia excluída.",
      })
      fetchHeresies()
    }
    setLoading(false)
  }

  const handleEditClick = (heresy: HeresyResponse) => {
    setEditingHeresy({ ...heresy })
    setIsDialogOpen(true)
  }

  const handleAddClick = () => {
    setEditingHeresy({
      id: "",
      heresy_phrase: "",
      correct_response: "",
      keywords: [],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setIsDialogOpen(true)
  }

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEditingHeresy((prev) => ({
      ...prev!,
      keywords: value
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    }))
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        <p className="text-sm text-muted-foreground mt-2">Por favor, faça login com uma conta de administrador.</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Gerenciamento de Heresias</CardTitle>
        <Button size="sm" onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Heresia
        </Button>
      </CardHeader>
      <CardDescription className="px-6">
        Defina frases e palavras-chave que a IA deve reconhecer como heresias e forneça respostas bíblicas predefinidas.
      </CardDescription>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Frase da Heresia</TableHead>
              <TableHead>Resposta Correta</TableHead>
              <TableHead>Palavras-chave</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {heresies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  Nenhuma heresia definida ainda.
                </TableCell>
              </TableRow>
            ) : (
              heresies.map((heresy) => (
                <TableRow key={heresy.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{heresy.heresy_phrase}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{heresy.correct_response}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {heresy.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={heresy.is_active} disabled />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(heresy)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteHeresy(heresy.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingHeresy?.id ? "Editar Heresia" : "Adicionar Nova Heresia"}</DialogTitle>
              <DialogDescription>
                {editingHeresy?.id
                  ? "Faça alterações na definição da heresia aqui."
                  : "Adicione uma nova frase de heresia e sua resposta bíblica predefinida."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="heresy-phrase">Frase da Heresia</Label>
                <Input
                  id="heresy-phrase"
                  value={editingHeresy?.heresy_phrase || ""}
                  onChange={(e) => setEditingHeresy((prev) => ({ ...prev!, heresy_phrase: e.target.value }))}
                  placeholder="Ex: 'Jesus é parte de uma Trindade'"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correct-response">Resposta Correta (Bíblica)</Label>
                <Textarea
                  id="correct-response"
                  value={editingHeresy?.correct_response || ""}
                  onChange={(e) => setEditingHeresy((prev) => ({ ...prev!, correct_response: e.target.value }))}
                  placeholder="Ex: 'Assim diz o Senhor, a Bíblia ensina que Deus é um, não três pessoas...'"
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  id="keywords"
                  value={editingHeresy?.keywords.join(", ") || ""}
                  onChange={handleKeywordChange}
                  placeholder="Ex: trindade, deus em 3, 3 pessoas"
                />
                <p className="text-xs text-muted-foreground">
                  Palavras que ajudarão a IA a identificar esta heresia, mesmo que a frase exata não seja usada.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Ativo</Label>
                <Switch
                  id="is-active"
                  checked={editingHeresy?.is_active || false}
                  onCheckedChange={(checked) => setEditingHeresy((prev) => ({ ...prev!, is_active: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveHeresy} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
