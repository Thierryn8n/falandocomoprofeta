"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Search, Filter, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { RecordedAudioPlayer } from '@/components/recorded-audio-player'

interface HeresyLog {
  id: string
  user_id?: string
  conversation_id?: string
  user_message: string
  detected_heresy_id?: string
  action_taken: string
  ai_classification?: string
  created_at: string
  profiles?: {
    email: string
    name?: string
  }
  heresy_responses?: {
    heresy_phrase: string
  }
}

export function HeresyLogs() {
  const { profile } = useSupabaseAuth()
  const { toast } = useToast()
  const [logs, setLogs] = useState<HeresyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const logsPerPage = 20

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      loadLogs()
    }
  }, [isAdmin, currentPage, filterAction])

  const loadLogs = async () => {
    try {
      setLoading(true)
      
      // Primeiro, buscar os logs básicos (excluindo "passed_to_ai")
      let query = supabase
        .from('heresy_logs')
        .select('*', { count: 'exact' })
        .neq('action_taken', 'passed_to_ai') // Excluir registros "Aprovado"
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * logsPerPage, currentPage * logsPerPage - 1)

      if (filterAction !== 'all') {
        query = query.eq('action_taken', filterAction)
      }

      if (searchTerm) {
        query = query.or(`user_message.ilike.%${searchTerm}%,ai_classification.ilike.%${searchTerm}%`)
      }

      const { data: logsData, error: logsError, count } = await query

      if (logsError) throw logsError

      // Buscar dados relacionados separadamente
      const enrichedLogs = await Promise.all(
        (logsData || []).map(async (log) => {
          const enrichedLog = { ...log }

          // Buscar perfil do usuário se user_id existir
          if (log.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('id', log.user_id)
              .single()
            
            enrichedLog.user_profile = profileData
          }

          // Buscar frase de heresia se detected_heresy_id existir
          if (log.detected_heresy_id) {
            const { data: heresyData } = await supabase
              .from('heresy_responses')
              .select('heresy_phrase')
              .eq('id', log.detected_heresy_id)
              .single()
            
            enrichedLog.heresy_phrase = heresyData
          }

          // Buscar áudio da conversation se conversation_id existir
          if (log.conversation_id) {
            const { data: conversationData } = await supabase
              .from('conversations')
              .select('audio_url')
              .eq('id', log.conversation_id)
              .single()
            
            if (conversationData?.audio_url) {
              // Construir URL completa do Supabase Storage
              const { data: publicUrl } = supabase.storage
                .from('audio')
                .getPublicUrl(conversationData.audio_url.replace('audio/', ''))
              
              enrichedLog.audio_url = publicUrl.publicUrl
            } else {
              enrichedLog.audio_url = null
            }
          }

          return enrichedLog
        })
      )

      setLogs(enrichedLogs)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading heresy logs:', error)
      
      // Mostrar detalhes específicos do erro
      let errorMessage = 'Não foi possível carregar os logs de heresias.'
      
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `Erro: ${error.message}`
        } else if ('details' in error) {
          errorMessage = `Erro: ${error.details}`
        } else if ('hint' in error) {
          errorMessage = `Erro: ${error.hint}`
        }
      }
      
      toast({
        title: 'Erro ao carregar logs',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'responded_with_predefined':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Heresia Detectada</Badge>
      case 'ai_classified_heresy':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />IA: Heresia</Badge>
      case 'passed_to_ai':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>
      case 'ai_classified_irrelevant':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />IA: Irrelevante</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const totalPages = Math.ceil(totalCount / logsPerPage)

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Logs de Heresias
          </CardTitle>
          <CardDescription>
            Histórico de detecções de heresias e classificações da IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por mensagem ou classificação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="responded_with_predefined">Heresia Detectada</SelectItem>
                <SelectItem value="ai_classified_heresy">IA: Heresia</SelectItem>
                <SelectItem value="ai_classified_irrelevant">IA: Irrelevante</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Tabela de Logs */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Carregando logs...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Áudio</TableHead>
                    <TableHead>Ação Tomada</TableHead>
                    <TableHead>Classificação IA</TableHead>
                    <TableHead>Heresia Detectada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum log encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          {log.user_profile?.email ? (
                            <div>
                              <div className="font-medium">{log.user_profile.name || 'Sem nome'}</div>
                              <div className="text-sm text-muted-foreground">{log.user_profile.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Usuário anônimo</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="truncate" title={log.user_message}>
                            {log.user_message}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.audio_url ? (
                            <RecordedAudioPlayer audioUrl={log.audio_url} />
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action_taken)}
                        </TableCell>
                        <TableCell>
                          {log.ai_classification ? (
                            <Badge variant="outline" className="text-xs">
                              {log.ai_classification}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.heresy_phrase?.heresy_phrase ? (
                            <div className="text-sm text-red-600 font-medium">
                              {log.heresy_phrase.heresy_phrase}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * logsPerPage + 1} a {Math.min(currentPage * logsPerPage, totalCount)} de {totalCount} logs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}