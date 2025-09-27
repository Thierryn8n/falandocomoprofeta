"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { MessageSquare, Trash2, Search, User, Clock, Eye, AlertTriangle, MoreHorizontal, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Conversation {
  id: string
  user_id: string
  title: string
  messages: any[]
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
  has_blasphemy?: boolean
}

export function ConversationsManager() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const { toast } = useToast()

  const loadConversations = async () => {
    try {
      setLoading(true)
      
      // Buscar todas as conversas
      const { data: conversations, error: conversationsError } = await supabase
        .from("conversations")
        .select('*')
        .order("updated_at", { ascending: false })
      
      if (conversationsError) throw conversationsError
      
      // Buscar informações dos usuários separadamente
      const userIds = conversations.map(conv => conv.user_id);
      
      // Buscar perfis dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select('id, email, full_name')
        .in('id', userIds)
      
      if (profilesError) {
        console.warn("Erro ao carregar perfis:", profilesError);
        // Continuar mesmo com erro nos perfis
      }
      
      // Criar um mapa de perfis por ID para fácil acesso
      const profileMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      
      // Formatar os dados para incluir informações do usuário
      const formattedData = conversations.map((conv: any) => {
        const profile = profileMap[conv.user_id];
        
        return {
          ...conv,
          user_email: profile?.email || "Email não disponível",
          user_name: profile?.full_name || (profile?.email?.split("@")[0]) || "Usuário desconhecido",
          message_count: Array.isArray(conv.messages) ? conv.messages.length : 0,
          has_blasphemy: conv.is_blasphemy
        };
      })
      
      setConversations(formattedData)
    } catch (error) {
      console.error("Erro ao carregar conversas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const handleDeleteConversation = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.")) {
      return
    }
    
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      
      setConversations(conversations.filter(conv => conv.id !== id))
      
      toast({
        title: "Conversa excluída",
        description: "A conversa foi excluída com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir conversa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive",
      })
    }
  }

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setViewDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Conversas</h2>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as conversas dos usuários com o profeta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2 mr-4">
            <Switch
              id="advanced-options"
              checked={showAdvancedOptions}
              onCheckedChange={setShowAdvancedOptions}
            />
            <label htmlFor="advanced-options" className="text-sm cursor-pointer flex items-center">
              <Settings className="h-4 w-4 mr-1" />
              Opções avançadas
            </label>
          </div>
          <Button onClick={loadConversations} variant="outline">
            Atualizar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, usuário ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="outline">
          {filteredConversations.length} conversas
        </Badge>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredConversations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConversations.map((conversation) => (
            <Card 
              key={conversation.id} 
              className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
                conversation.has_blasphemy ? 'border-red-500 border-2' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate text-base sm:text-lg">{conversation.title}</span>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {conversation.has_blasphemy && (
                      <Badge variant="destructive" className="whitespace-nowrap flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Blasfêmia
                      </Badge>
                    )}
                    <Badge variant="outline" className="whitespace-nowrap text-xs">
                      {conversation.message_count} msgs
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{conversation.user_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{formatDate(conversation.updated_at || conversation.created_at)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm px-2 sm:px-3"
                      onClick={() => handleViewConversation(conversation)}
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden xs:inline">Visualizar</span>
                    </Button>
                    
                    {showAdvancedOptions ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs sm:text-sm">
                          <DropdownMenuLabel>Opções avançadas</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={async () => {
                              try {
                                const newValue = !conversation.has_blasphemy;
                                
                                // Atualizar no banco de dados
                                const { error } = await supabase
                                  .from("conversations")
                                  .update({ is_blasphemy: newValue })
                                  .eq("id", conversation.id);
                                
                                if (error) throw error;
                                
                                // Atualizar localmente o estado
                                setConversations(conversations.map(c => 
                                  c.id === conversation.id 
                                    ? {...c, has_blasphemy: newValue} 
                                    : c
                                ));
                                
                                toast({
                                  title: "Conversa atualizada",
                                  description: newValue 
                                    ? "Conversa marcada como blasfêmia." 
                                    : "Conversa desmarcada como blasfêmia.",
                                });
                              } catch (error) {
                                console.error("Erro ao atualizar conversa:", error);
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível atualizar a conversa.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            {conversation.has_blasphemy ? "Desmarcar blasfêmia" : "Marcar como blasfêmia"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteConversation(conversation.id)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Excluir conversa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs sm:text-sm px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteConversation(conversation.id)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Excluir</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhuma conversa encontrada</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Nenhuma conversa corresponde à sua busca." : "Não há conversas registradas no sistema."}
          </p>
        </div>
      )}

      {/* Dialog para visualizar conversa */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedConversation?.title}</DialogTitle>
            <DialogDescription>
              Conversa de {selectedConversation?.user_name} ({selectedConversation?.user_email})
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-4 pr-4">
            <div className="space-y-4">
              {selectedConversation?.messages?.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.role === "assistant" ? "Profeta" : "Usuário"}
                      </span>
                      <span className="text-xs opacity-70">
                        {new Date(message.timestamp || message.created_at || "").toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {(!selectedConversation?.messages || selectedConversation.messages.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Esta conversa não contém mensagens.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}