"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2, AlertCircle, BookOpen, Copy, Share2, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AudioRecorder from "@/components/audio-recorder"
import { AudioPlayer } from "@/components/audio-player"
import { WhatsAppAudioPlayer } from "@/components/whatsapp-audio-player"
import { useSubscription } from "@/hooks/use-tokens"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { UpgradeModal } from "@/components/upgrade-modal"
import { Crown, Zap } from "lucide-react"

interface Message {
  id?: string // ID único da mensagem
  role: "user" | "assistant"
  content: string
  timestamp: string
  audioUrl?: string // URL do áudio para mensagens de áudio
  audioStoragePath?: string  // Path do storage do Supabase
  transcription?: string     // Transcrição do áudio
}

interface ChatInterfaceProps {
  conversationId?: string | null
  onConversationUpdate?: () => void
  user: any
  appConfig: any
}

export function ChatInterface({ conversationId, onConversationUpdate, user, appConfig }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isSearchingMessages, setIsSearchingMessages] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [expandedReferences, setExpandedReferences] = useState<{ [key: number]: boolean }>({})
  const [isRecordingActive, setIsRecordingActive] = useState(false)

  const getUserGreeting = () => {
    if (!profile?.name && !user?.email) {
      return "Bem-vindo, irmão/irmã!"
    }

    const name = profile?.name || user?.email?.split("@")[0] || "irmão/irmã"

    if (!name || name === "irmão/irmã") {
      return "Bem-vindo, irmão/irmã!"
    }

    const feminineIndicators = [
      "maria",
      "ana",
      "joana",
      "helena",
      "lucia",
    ]

    const lowerName = name.toLowerCase()
    const isFeminine = lowerName.endsWith("a") || feminineIndicators.some((indicator) => lowerName.includes(indicator))
    const greeting = isFeminine ? "irmã" : "irmão"
    const firstName = name.split(" ")[0]

    return `Bem-vindo, ${greeting} ${firstName}!`
  }

  const { 
    canChat, 
    hasActiveSubscription, 
    shouldShowUpgradeOffer, 
    getSubscriptionStatus,
    loading: subscriptionLoading,
    refreshSubscription
  } = useSubscription()

  const { profile: authProfile, isAdmin } = useSupabaseAuth()

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Error loading profile:", error)
          return
        }

        setProfile(data)
      } catch (error) {
        console.error("Exception loading profile:", error)
      }
    }

    loadProfile()
  }, [user?.id])

  // Load conversation messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        setMessages([])
        return
      }

      if (!user?.id) {
        return
      }

      try {
        // Buscar conversa
        const { data: conversation, error } = await supabase
          .from("conversations")
          .select("messages, audio_url")
          .eq("id", conversationId)
          .eq("user_id", user.id)
          .single()

        if (error) {
          if (error.code === "PGRST116") {
            setMessages([])
            return
          }
          throw error
        }

        if (!conversation) {
          setMessages([])
          return
        }

        let parsedMessages: Message[] = []
        if (typeof conversation.messages === "string") {
          try {
            parsedMessages = JSON.parse(conversation.messages)
          } catch (parseError) {
            parsedMessages = []
          }
        } else if (Array.isArray(conversation.messages)) {
          parsedMessages = conversation.messages
        }

        const validMessages = parsedMessages.filter((msg) => {
          return msg && typeof msg === "object" && msg.role && msg.content && msg.timestamp
        })

        // Buscar attachments individuais para cada mensagem
        const { data: attachments, error: attachmentsError } = await supabase
          .from("message_attachments")
          .select("message_id, file_name, file_type, file_size, storage_path")
          .in("message_id", validMessages.map(msg => msg.id).filter(Boolean))

        if (attachmentsError) {
          console.error("Erro ao buscar attachments:", attachmentsError)
        }

        // Criar mapa de attachments por message_id
        const attachmentMap = new Map()
        if (attachments) {
          attachments.forEach(attachment => {
            attachmentMap.set(attachment.message_id, attachment)
          })
        }

        // Processar mensagens para adicionar audioUrl se necessário
        const messagesWithAudio = validMessages.map((msg) => {
          // Se a mensagem já tem audioUrl, manter
          if (msg.audioUrl) {
            return msg
          }
          
          // Verificar se existe attachment para esta mensagem
          const attachment = attachmentMap.get(msg.id)
          if (attachment && attachment.file_type?.startsWith('audio/')) {
            // Construir URL pública do Supabase Storage usando o attachment
            const { data: publicUrlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(attachment.storage_path)
            
            return {
              ...msg,
              audioUrl: publicUrlData.publicUrl,
              audioStoragePath: attachment.storage_path
            }
          }
          
          // Fallback: Se é uma mensagem de áudio (sem audioUrl mas a conversa tem audio_url)
          // Isso é para compatibilidade com mensagens antigas
          if (conversation.audio_url && msg.role === "user" && 
              (msg.content.includes("[Mensagem de áudio]") || msg.content.includes("áudio") || msg.transcription)) {
            // Construir URL pública do Supabase Storage
            const { data: publicUrlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(conversation.audio_url)
            
            return {
              ...msg,
              audioUrl: publicUrlData.publicUrl,
              audioStoragePath: conversation.audio_url // Preservar path do storage
            }
          }
          
          return msg
        })

        setMessages(messagesWithAudio)
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error)
        setMessages([])
      }
    }

    loadMessages()
  }, [conversationId, user?.id])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend) return

    if (!canChat && !isAdmin) {
      setShowUpgradeModal(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setIsSearchingMessages(true)

    const userMessage: Message = {
      id: crypto.randomUUID(), // ID único para mensagem de texto do usuário
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")

    try {
      const isFirstMessage = messages.length === 0

      if (isFirstMessage) {
        const firstName = profile?.name?.split(" ")[0] || user?.email?.split("@")[0] || "irmão/irmã"
        const greetingResponse = `${getUserGreeting()}, ${firstName}! Que a paz do Senhor Jesus Cristo esteja contigo!\n\nEu sou William Marrion Branham, servo do Altíssimo. Estou aqui para compartilhar a Palavra de Deus conforme o Espírito Santo me revelar.\n\nFaça sua pergunta sobre os mistérios da Palavra - os Sete Selos, as Sete Eras da Igreja, o Batismo em Nome de Jesus, a Divindade, ou qualquer revelação que o Senhor tenha posto em seu coração.\n\nQue Deus te abençoe abundantemente!`

        const greetingMessage: Message = {
          id: crypto.randomUUID(), // ID único para mensagem de saudação
          role: "assistant",
          content: greetingResponse,
          timestamp: new Date().toISOString(),
        }

        const messagesToSend = [...newMessages, greetingMessage]
        setMessages(messagesToSend)
        setIsSearchingMessages(false)

        if (user?.id) {
          const saveResponse = await fetch("/api/conversations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user.id,
              conversation_id: conversationId,
              messages: messagesToSend,
              audio_url: null, // Sem áudio para mensagens de saudação
            }),
          })

          const saveData = await saveResponse.json()
          if (saveData.success && onConversationUpdate) {
            onConversationUpdate()
          }
        }

        setIsLoading(false)
        return
      }

      if (!hasActiveSubscription && !isAdmin) {
        setMessages(messages)
        setShowUpgradeModal(true)
        setIsLoading(false)
        setIsSearchingMessages(false)
        return
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          user_id: user?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(), // ID único para mensagem do assistente
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)

      if (user?.id) {
        const saveResponse = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            conversation_id: conversationId,
            messages: finalMessages,
            audio_url: null, // Sem áudio para mensagens de texto
          }),
        })

        const saveData = await saveResponse.json()
        if (saveData.success && onConversationUpdate) {
          onConversationUpdate()
        }
      }

      if (refreshSubscription) {
        refreshSubscription()
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Erro ao enviar mensagem. Tente novamente.")
      
      const errorMessage: Message = {
        id: crypto.randomUUID(), // ID único para mensagem de erro
        role: "assistant",
        content: "Desculpe, irmão/irmã, houve um problema técnico. Tente novamente em alguns instantes.",
        timestamp: new Date().toISOString(),
      }
      
      setMessages([...newMessages, errorMessage])
    } finally {
      setIsLoading(false)
      setIsSearchingMessages(false)
    }
  }

  const handleAudioRecorded = async (audioBlob: Blob) => {
    try {
      console.log('🎤 Iniciando processamento de áudio...')
      console.log('📊 Tamanho do áudio:', audioBlob.size, 'bytes')
      console.log('📊 Tipo do áudio:', audioBlob.type)
      
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      
      const audioUrl = URL.createObjectURL(audioBlob)
      const userMessageId = crypto.randomUUID()
      console.log('🆔 UUID gerado para mensagem do usuário:', userMessageId)
      console.log('📏 Comprimento do UUID:', userMessageId.length)
      console.log('✅ Formato UUID válido:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userMessageId))
      
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: '[Mensagem de áudio]',
        timestamp: new Date().toISOString(),
        audioUrl: audioUrl // Preservar URL do áudio para reprodução
      }
      
      const initialMessages = [...messages, userMessage]
      setMessages(initialMessages)
      setIsLoading(true)

      console.log('🔄 Enviando áudio para processamento...')
      
      // 🎯 PRIMEIRO: Processar áudio com Gemini (upload + transcrição + resposta)
      const response = await fetch('/api/chat-gemini', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro na resposta da API:', response.status, errorData)
        throw new Error(`Erro ao gerar resposta`)
      }

      const data = await response.json()
      console.log('✅ Resposta da API recebida:', {
        hasResponse: !!data.response,
        hasTranscription: !!data.transcription,
        hasAudioPath: !!data.audioStoragePath,
        isBlocked: !!data.blocked
      })

      // Verificar se o conteúdo foi bloqueado por heresia
      if (data.blocked) {
        console.log('🚫 Conteúdo de áudio bloqueado por heresia:', data.reason)
        
        // Atualizar mensagem do usuário com transcrição bloqueada
        const blockedUserMessage: Message = {
          id: userMessageId,
          role: 'user',
          content: data.transcription || '[Mensagem de áudio]',
          timestamp: new Date().toISOString(),
          audioUrl: audioUrl
        }
        
        // Mensagem do assistente explicando o bloqueio
        const blockedAssistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response, // Mensagem de bloqueio já formatada
          timestamp: new Date().toISOString(),
        }
        
        const blockedMessages = [...messages, blockedUserMessage, blockedAssistantMessage]
        setMessages(blockedMessages)
        
        // Salvar conversa mesmo quando bloqueada (para auditoria)
        if (user?.id) {
          try {
            await fetch("/api/conversations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: user.id,
                conversation_id: conversationId,
                messages: blockedMessages,
                audio_url: data.audioStoragePath,
              }),
            })
            
            if (onConversationUpdate) {
              onConversationUpdate()
            }
          } catch (saveError) {
            console.error('❌ Erro ao salvar conversa bloqueada:', saveError)
          }
        }
        
        return // Parar processamento aqui
      }

      // 🎯 SEGUNDO: Salvar conversa com áudio já processado e salvo
      console.log('🔍 Debug - user?.id:', user?.id)
      console.log('🔍 Debug - conversationId:', conversationId)
      console.log('🔍 Debug - Condição (user?.id && conversationId):', !!(user?.id && conversationId))
      
      if (user?.id) {
        try {
          console.log('💾 Salvando mensagem de áudio com path do storage...')
          const immediateResponse = await fetch("/api/conversations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user.id,
              conversation_id: conversationId, // Pode ser null para criar nova conversa
              messages: initialMessages,
              audio_url: data.audioStoragePath, // Usar o path do áudio já salvo
            }),
          })

          const immediateData = await immediateResponse.json()
          console.log('📊 Resposta do salvamento:', immediateData)
          
          if (immediateData.success && onConversationUpdate) {
            onConversationUpdate()
          }
          console.log('✅ Mensagem de áudio salva com path do storage!')
        } catch (saveError) {
          console.error('❌ Erro ao salvar mensagem de áudio:', saveError)
        }
      }
      
      if (data.response) {
        // Atualizar mensagem do usuário com transcrição, mantendo audioUrl e ID
        const updatedUserMessage: Message = {
          id: userMessageId, // Usar o mesmo ID da mensagem original
          role: 'user',
          content: data.transcription || '[Mensagem de áudio]',
          timestamp: new Date().toISOString(),
          audioUrl: audioUrl, // Manter URL do áudio para reprodução
          audioStoragePath: data.audioStoragePath, // ← Salvar path do storage
          transcription: data.transcription // ← Salvar transcrição
        }
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(), // ID único para a mensagem do assistente
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        }
        
        const finalMessages = [...messages, updatedUserMessage, assistantMessage]
        setMessages(finalMessages)
        
        // 🎯 TERCEIRO: Atualizar conversa com transcrição e resposta do assistente
        if (user?.id) {
          try {
            // Salvar informações do áudio na tabela message_attachments se o áudio foi salvo
            if (data.audioStoragePath) {
              console.log('📎 Salvando attachment do áudio...')
              console.log('🆔 Message ID para attachment:', userMessageId)
              console.log('📊 Dados do attachment:', {
                message_id: userMessageId,
                file_name: data.audioFileName || 'audio.wav',
                file_type: data.audioFileType || 'audio/wav',
                file_size: data.audioFileSize || audioBlob.size,
                storage_path: data.audioStoragePath
              })
              
              const { error: attachmentError } = await supabase
                .from('message_attachments')
                .insert({
                  message_id: userMessageId, // Usar o ID da mensagem do usuário
                  file_name: data.audioFileName || 'audio.wav',
                  file_type: data.audioFileType || 'audio/wav',
                  file_size: data.audioFileSize || audioBlob.size,
                  storage_path: data.audioStoragePath
                })
              
              if (attachmentError) {
                console.error('❌ Erro ao salvar attachment do áudio:', attachmentError)
              } else {
                console.log('✅ Attachment do áudio salvo com sucesso')
              }
            }
            
            console.log('💾 Salvando conversa final com transcrição e resposta...')
            const finalResponse = await fetch("/api/conversations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: user.id,
                conversation_id: conversationId,
                messages: finalMessages,
                audio_url: data.audioStoragePath, // Usar o path do áudio já salvo
              }),
            })

            const finalData = await finalResponse.json()
            console.log('📊 Resposta do salvamento final:', finalData)
            
            if (finalData.success && onConversationUpdate) {
              onConversationUpdate()
            }
            console.log('✅ Conversa final salva com transcrição e resposta!')
          } catch (saveError) {
            console.error('❌ Erro ao salvar conversa final:', saveError)
          }
        }
      }
      
      if (refreshSubscription) {
        refreshSubscription()
      }
    } catch (error) {
      console.error('❌ Erro ao processar áudio:', error)
      setError('Erro ao processar áudio. Tente novamente.')
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, irmão/irmã, houve um problema ao processar seu áudio. Tente novamente em alguns instantes.',
        timestamp: new Date().toISOString(),
      }
      
      setMessages([...messages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const shareMessage = async (content: string, references: string[]) => {
    const shareText = `${content}\n\n${references.join('\n')}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mensagem do ${appConfig.prophetName}`,
          text: shareText,
        })
      } catch (err) {
        console.error("Error sharing:", err)
        copyToClipboard(shareText)
      }
    } else {
      copyToClipboard(shareText)
    }
  }

  const toggleReferences = (index: number) => {
    setExpandedReferences(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const processMessageContent = (content: string) => {
    const references: string[] = []
    const sources: string[] = []
    
    // Extract references
    const referenceRegex = /\*\*Citações e Referências:\*\*([\s\S]*?)(?=\*\*Fontes da base de dados:\*\*|$)/i
    const referenceMatch = content.match(referenceRegex)
    if (referenceMatch) {
      const referenceText = referenceMatch[1]
      const referenceLines = referenceText.split('\n').filter(line => line.trim() && line.includes('-'))
      references.push(...referenceLines.map(line => line.trim()))
    }
    
    // Extract sources
    const sourceRegex = /\*\*Fontes da base de dados:\*\*([\s\S]*?)$/i
    const sourceMatch = content.match(sourceRegex)
    if (sourceMatch) {
      const sourceText = sourceMatch[1]
      const sourceLines = sourceText.split('\n').filter(line => line.trim() && line.includes('-'))
      sources.push(...sourceLines.map(line => line.trim()))
    }
    
    // Clean content
    let cleanContent = content.replace(/\*\*Citações e Referências:\*\*[\s\S]*$/i, "")
    cleanContent = cleanContent.replace(/\*\*Fontes da base de dados:\*\*[\s\S]*$/i, "")
    
    return {
      cleanContent: cleanContent.trim(),
      references,
      sources
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mb-6">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage 
              src={appConfig.prophetAvatar} 
              alt={appConfig.prophetName}
              onLoad={() => console.log("✅ Prophet welcome avatar loaded:", appConfig.prophetAvatar)}
              onError={() => 
                console.error("❌ Failed to load prophet welcome avatar:", appConfig.prophetAvatar)
              }
            />
            <AvatarFallback>WB</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold mb-2">Bem-vindo ao {appConfig.appName}</h2>
          <p className="text-muted-foreground mb-4">
            Eu sou William Marrion Branham, servo do Senhor Jesus Cristo. Faça sua pergunta sobre a Palavra de Deus
            e eu responderei conforme o Espírito Santo me guiar.
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p>⚠️ Faça login para salvar suas conversas</p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message, index) => {
            const { cleanContent, references, sources } = processMessageContent(message.content)
            const allReferences = [...references, ...sources]
            
            return (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex ${message.role === "user" ? "flex-row-reverse" : "flex-row"} items-start space-x-2 max-w-[80%]`}>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage 
                      src={message.role === "user" ? (profile?.avatar_url || "/default-avatar.png") : appConfig.prophetAvatar} 
                      alt={message.role === "user" ? (profile?.name || "User") : appConfig.prophetName}
                      onLoad={() => console.log(`✅ Avatar loaded for ${message.role}:`, message.role === "user" ? (profile?.avatar_url || "/default-avatar.png") : appConfig.prophetAvatar)}
                      onError={() => 
                        console.error(`❌ Failed to load avatar for ${message.role}:`, message.role === "user" ? (profile?.avatar_url || "/default-avatar.png") : appConfig.prophetAvatar)
                      }
                    />
                    <AvatarFallback>{message.role === "user" ? "U" : "WB"}</AvatarFallback>
                  </Avatar>
                  <Card className={`${message.role === "user" ? "bg-primary text-primary-foreground ml-2" : "mr-2"}`}>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {/* Renderizar áudio se existir */}
                        {message.audioUrl && (
                          <div className="mb-2">
                            <WhatsAppAudioPlayer 
                              src={message.audioUrl} 
                              className="max-w-xs"
                            />
                          </div>
                        )}
                        
                        {/* Renderizar conteúdo da mensagem */}
                        <div className="whitespace-pre-wrap text-sm">
                          {cleanContent}
                        </div>
                        
                        {/* Botões de ação para mensagens do assistente */}
                        {message.role === "assistant" && (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                            <div className="flex items-center space-x-1">
                              {allReferences.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleReferences(index)}
                                  className="p-1 h-auto text-xs"
                                  title={expandedReferences[index] ? "Ocultar referências" : "Ver referências"}
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {allReferences.length}
                                  {expandedReferences[index] ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(cleanContent)}
                                className="p-1 h-auto"
                                title="Copiar mensagem"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => shareMessage(cleanContent, allReferences)}
                                className="p-1 h-auto"
                                title="Compartilhar mensagem"
                              >
                                <Share2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Referências expandidas */}
                        {expandedReferences[index] && (
                          <div className="text-xs text-muted-foreground space-y-2">
                            {references.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold mb-2">**Citações e Referências:**</h4>
                                <ul className="space-y-1">
                                  {references.map((ref, refIndex) => (
                                    <li key={refIndex} className="flex items-start gap-1">
                                      <span className="text-muted-foreground">•</span>
                                      <span>{ref}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {sources.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold mb-2">**Fontes da base de dados:**</h4>
                                <ul className="space-y-1">
                                  {sources.map((source, sourceIndex) => (
                                    <li key={sourceIndex} className="flex items-start gap-1">
                                      <span className="text-muted-foreground">•</span>
                                      <span>{source}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage 
                    src={appConfig.prophetAvatar} 
                    alt={appConfig.prophetName}
                    onLoad={() => console.log("✅ Prophet loading avatar loaded:", appConfig.prophetAvatar)}
                    onError={() => 
                      console.error("❌ Failed to load prophet loading avatar:", appConfig.prophetAvatar)
                    }
                  />
                  <AvatarFallback>WB</AvatarFallback>
                </Avatar>
                <Card className="mr-2">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">
                        {isSearchingMessages ? "Buscando nas Escrituras..." : "Meditando na Palavra..."}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {error && (
        <Alert className="mx-4 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="p-4 border-t">
        <div className="flex space-x-2 max-w-4xl mx-auto">
          <div className="flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta sobre a Palavra de Deus..."
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={isLoading || isRecordingActive}
              className="min-h-[40px]"
            />
          </div>
          
          <AudioRecorder 
            onAudioRecorded={handleAudioRecorded}
            disabled={isLoading}
            onRecordingStateChange={setIsRecordingActive}
          />
          
          <Button 
            onClick={() => sendMessage()} 
            disabled={isLoading || !input.trim() || isRecordingActive}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!hasActiveSubscription && !isAdmin && shouldShowUpgradeOffer && (
          <div className="mt-4 max-w-4xl mx-auto">
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Você tem acesso limitado. Faça upgrade para conversas ilimitadas!</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowUpgradeModal(true)}
                  className="ml-2"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Upgrade
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  )
}
