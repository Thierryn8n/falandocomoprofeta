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
          conversationId: conversationId,
          userId: user?.id || "anonymous",
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
        content: data.message,
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

  const shareMessage = async (content: string, references: string[], userQuestion?: string) => {
    try {
      // Formatação específica para WhatsApp
      const prophetName = appConfig.prophetName || "Profeta William Branham"
      const prophetAvatar = appConfig.prophetAvatar || ""
      
      // Criar canvas para gerar a imagem
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Configurações da imagem
      const width = 800
      const padding = 40
      const lineHeight = 24
      const titleHeight = 40
      let currentY = padding
      
      // Configurar fonte
      ctx.font = '16px Arial, sans-serif'
      
      // Função para desenhar ícones
      const drawIcon = async (type: 'question' | 'prophet' | 'book' | 'share', x: number, y: number, size: number = 20) => {
        ctx.save()
        
        switch (type) {
          case 'question':
            // Desenhar ícone de pergunta com fundo colorido
            ctx.fillStyle = '#3b82f6'
            ctx.beginPath()
            ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI)
            ctx.fill()
            ctx.fillStyle = '#ffffff'
            ctx.font = `bold ${size-6}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText('?', x + size/2, y + size/2 + 4)
            break
          case 'prophet':
            // Desenhar avatar redondo do profeta com borda
            if (prophetAvatar) {
              try {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                await new Promise<void>((resolve, reject) => {
                  img.onload = () => {
                    ctx.save()
                    // Desenhar borda
                    ctx.strokeStyle = '#10b981'
                    ctx.lineWidth = 3
                    ctx.beginPath()
                    ctx.arc(x + size/2, y + size/2, size/2 - 1, 0, 2 * Math.PI)
                    ctx.stroke()
                    // Desenhar imagem
                    ctx.beginPath()
                    ctx.arc(x + size/2, y + size/2, size/2 - 2, 0, 2 * Math.PI)
                    ctx.clip()
                    ctx.drawImage(img, x + 2, y + 2, size - 4, size - 4)
                    ctx.restore()
                    resolve()
                  }
                  img.onerror = () => {
                    // Fallback: desenhar ícone de pessoa com fundo
                    ctx.fillStyle = '#10b981'
                    ctx.beginPath()
                    ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI)
                    ctx.fill()
                    ctx.fillStyle = '#ffffff'
                    ctx.beginPath()
                    ctx.arc(x + size/2, y + size/3, size/6, 0, 2 * Math.PI)
                    ctx.fill()
                    ctx.beginPath()
                    ctx.arc(x + size/2, y + size*0.75, size/3, 0, Math.PI, true)
                    ctx.fill()
                    resolve()
                  }
                  img.src = prophetAvatar
                })
              } catch (error) {
                // Fallback: desenhar ícone de pessoa com fundo
                ctx.fillStyle = '#10b981'
                ctx.beginPath()
                ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI)
                ctx.fill()
                ctx.fillStyle = '#ffffff'
                ctx.beginPath()
                ctx.arc(x + size/2, y + size/3, size/6, 0, 2 * Math.PI)
                ctx.fill()
                ctx.beginPath()
                ctx.arc(x + size/2, y + size*0.75, size/3, 0, Math.PI, true)
                ctx.fill()
              }
            } else {
              // Ícone de pessoa padrão com fundo
              ctx.fillStyle = '#10b981'
              ctx.beginPath()
              ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI)
              ctx.fill()
              ctx.fillStyle = '#ffffff'
              ctx.beginPath()
              ctx.arc(x + size/2, y + size/3, size/6, 0, 2 * Math.PI)
              ctx.fill()
              ctx.beginPath()
              ctx.arc(x + size/2, y + size*0.75, size/3, 0, Math.PI, true)
              ctx.fill()
            }
            break
          case 'book':
            // Desenhar ícone de livro com fundo colorido
            ctx.fillStyle = '#8b5cf6'
            ctx.beginPath()
            ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI)
            ctx.fill()
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(x + size/4, y + size/3, size/2, size/3)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1
            ctx.strokeRect(x + size/4, y + size/3, size/2, size/3)
            ctx.beginPath()
            ctx.moveTo(x + size/4 + 2, y + size/3 + 4)
            ctx.lineTo(x + size*3/4 - 2, y + size/3 + 4)
            ctx.moveTo(x + size/4 + 2, y + size/3 + 8)
            ctx.lineTo(x + size*3/4 - 2, y + size/3 + 8)
            ctx.stroke()
            break
          case 'share':
            // Desenhar ícone de compartilhar com fundo colorido
            ctx.fillStyle = '#6b7280'
            ctx.beginPath()
            ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI)
            ctx.fill()
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.moveTo(x + size/2, y + size/4)
            ctx.lineTo(x + size*3/4, y + size/2)
            ctx.lineTo(x + size/2 + 1, y + size/2)
            ctx.lineTo(x + size/2 + 1, y + size*3/4)
            ctx.lineTo(x + size/2 - 1, y + size*3/4)
            ctx.lineTo(x + size/2 - 1, y + size/2)
            ctx.lineTo(x + size/4, y + size/2)
            ctx.closePath()
            ctx.fill()
            break
        }
        ctx.restore()
      }
      
      // Função para quebrar texto em linhas
      const wrapText = (text: string, maxWidth: number) => {
        const words = text.split(' ')
        const lines = []
        let currentLine = words[0]
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i]
          const testLine = currentLine + ' ' + word
          const metrics = ctx.measureText(testLine)
          if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine)
            currentLine = word
          } else {
            currentLine = testLine
          }
        }
        lines.push(currentLine)
        return lines
      }
      
      // Calcular altura necessária
      let totalHeight = padding * 2
      
      // Título
      if (userQuestion) {
        const questionLines = wrapText(`Pergunta: ${userQuestion}`, width - padding * 2 - 30)
        totalHeight += titleHeight + questionLines.length * lineHeight + 20
      }
      
      // Nome do profeta
      totalHeight += titleHeight + 20
      
      // Conteúdo da resposta
      const contentLines = wrapText(content, width - padding * 2)
      totalHeight += contentLines.length * lineHeight + 20
      
      // Referências
      if (references.length > 0) {
        totalHeight += titleHeight + 10
        references.forEach((ref, index) => {
          const refLines = wrapText(`${index + 1}. ${ref}`, width - padding * 2 - 30)
          totalHeight += refLines.length * lineHeight
        })
        totalHeight += 20
      }
      
      // Assinatura
      totalHeight += lineHeight + 20
      
      // Configurar canvas
      canvas.width = width
      canvas.height = totalHeight
      
      // Fundo com gradiente sutil
      const gradient = ctx.createLinearGradient(0, 0, 0, totalHeight)
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(1, '#f8fafc')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, totalHeight)
      
      // Adicionar sombra sutil nas bordas
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2
      
      // Resetar Y
      currentY = padding
      
      // Desenhar pergunta se fornecida
      if (userQuestion) {
        // Desenhar ícone de pergunta
        await drawIcon('question', padding, currentY, 24)
        
        ctx.fillStyle = '#2563eb'
        ctx.font = 'bold 18px Arial, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('Pergunta:', padding + 30, currentY + 20)
        currentY += titleHeight
        
        ctx.fillStyle = '#374151'
        ctx.font = '16px Arial, sans-serif'
        const questionLines = wrapText(userQuestion, width - padding * 2 - 30)
        questionLines.forEach(line => {
          ctx.fillText(line, padding + 30, currentY)
          currentY += lineHeight
        })
        currentY += 20
      }
      
      // Desenhar avatar do profeta e nome
      await drawIcon('prophet', padding, currentY, 24)
      
      ctx.fillStyle = '#059669'
      ctx.font = 'bold 18px Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${prophetName}`, padding + 30, currentY + 20)
      currentY += titleHeight + 20
      
      // Desenhar conteúdo da resposta
      ctx.fillStyle = '#111827'
      ctx.font = '16px Arial, sans-serif'
      const responseLines = wrapText(content, width - padding * 2)
      responseLines.forEach(line => {
        ctx.fillText(line, padding, currentY)
        currentY += lineHeight
      })
      currentY += 20
      
      // Desenhar referências se existirem
      if (references.length > 0) {
        // Desenhar ícone de livro
        await drawIcon('book', padding, currentY, 24)
        
        ctx.fillStyle = '#7c3aed'
        ctx.font = 'bold 18px Arial, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('Referências e Fontes:', padding + 30, currentY + 20)
        currentY += titleHeight + 10
        
        ctx.fillStyle = '#4b5563'
        ctx.font = '14px Arial, sans-serif'
        references.forEach((ref, index) => {
          const refLines = wrapText(`${index + 1}. ${ref}`, width - padding * 2 - 30)
          refLines.forEach(line => {
            ctx.fillText(line, padding + 30, currentY)
            currentY += lineHeight
          })
        })
        currentY += 20
      }
      
      // Desenhar assinatura
      await drawIcon('share', padding, currentY, 16)
      ctx.fillStyle = '#6b7280'
      ctx.font = 'italic 14px Arial, sans-serif'
      ctx.fillText(`Compartilhado via ${appConfig.appName || "Falando com o Profeta"}`, padding + 20, currentY + 12)
      
      // Converter canvas para blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, 'image/png', 0.9)
      })
      
      // Criar arquivo para compartilhamento
      const file = new File([blob], `mensagem-${prophetName.replace(/\s+/g, '-').toLowerCase()}.png`, {
        type: 'image/png'
      })
      
      // Tentar compartilhar usando Web Share API
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Mensagem do ${prophetName}`,
            text: userQuestion ? `Pergunta: ${userQuestion}` : `Mensagem do ${prophetName}`,
            files: [file]
          })
          return
        } catch (err) {
          console.error("Error sharing with Web Share API:", err)
        }
      }
      
      // Fallback: criar mensagem de texto simples para WhatsApp
      let shareText = ""
      if (userQuestion) {
        shareText += `🤔 Pergunta: ${userQuestion}\n\n`
      }
      shareText += `👤 ${prophetName} ➡️\n\n${content}\n\n`
      if (references.length > 0) {
        shareText += `📚 Referências:\n`
        references.forEach((ref, index) => {
          shareText += `${index + 1}. ${ref}\n`
        })
        shareText += `\n`
      }
      shareText += `📱 Compartilhado via ${appConfig.appName || "Falando com o Profeta"}`
      
      // Abrir WhatsApp com texto (sem baixar imagem)
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(whatsappUrl, '_blank')
      
    } catch (error) {
      console.error("Erro ao gerar imagem:", error)
      
      // Fallback completo: compartilhamento de texto original
      const prophetName = appConfig.prophetName || "Profeta William Branham"
      let shareText = ""
      
      if (userQuestion) {
        shareText += `🤔 *Pergunta:*\n${userQuestion}\n\n`
      }
      
      shareText += `👤 *${prophetName}* ➡️\n\n`
      shareText += `${content}\n\n`
      
      if (references.length > 0) {
        shareText += `📚 *Referências e Fontes:*\n`
        references.forEach((ref, index) => {
          shareText += `${index + 1}. ${ref}\n`
        })
        shareText += `\n`
      }
      
      shareText += `📱 _Compartilhado via ${appConfig.appName || "Falando com o Profeta"}_`
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(whatsappUrl, '_blank')
    }
  }

  const toggleReferences = (index: number) => {
    setExpandedReferences(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const processMessageContent = (content: string) => {
    // Safety check - ensure content is a valid string
    if (!content || typeof content !== 'string') {
      return {
        cleanContent: '',
        references: [],
        sources: []
      }
    }
    
    const references: string[] = []
    const sources: string[] = []
    
    // Extract references with improved regex patterns - support multiple formats
    const referencePatterns = [
      /\*\*(Citações e )?Referências:\*\*([\s\S]*?)(?=\*\*Fontes da base de dados.*?:\*\*|$)/i,
      /\*\*Referências utilizadas:\*\*([\s\S]*?)(?=\*\*Fontes da base de dados.*?:\*\*|$)/i,
      /\*\*Referências:\*\*([\s\S]*?)(?=\*\*Fontes da base de dados.*?:\*\*|$)/i
    ]
    
    for (const pattern of referencePatterns) {
      const referenceMatch = content.match(pattern)
      if (referenceMatch && referenceMatch.length > 2 && referenceMatch[2]) {
        const referenceText = referenceMatch[2]
        // Improved filtering to capture more reference formats
        const referenceLines = referenceText
          .split('\n')
          .filter(line => {
            const trimmed = line.trim()
            return trimmed && (
              trimmed.includes('-') || 
              trimmed.includes('•') || 
              trimmed.includes('*') ||
              /^\d+\./.test(trimmed) || // numbered references
              /^[a-zA-Z][\.\)]/.test(trimmed) || // lettered references
              trimmed.includes(',') // document titles with paragraphs
            )
          })
          .map(line => line.trim().replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^[a-zA-Z][\.\)]\s*/, ''))
        
        references.push(...referenceLines)
        break // Stop after finding the first match
      }
    }
    
    // Extract sources with improved regex patterns and relevance scores
    const sourcePatterns = [
      /\*\*Fontes da base de dados.*?:\*\*([\s\S]*?)$/i,
      /\*\*Fontes utilizadas.*?:\*\*([\s\S]*?)$/i,
      /\*\*Fontes da base de dados utilizadas.*?:\*\*([\s\S]*?)$/i
    ]
    
    for (const pattern of sourcePatterns) {
      const sourceMatch = content.match(pattern)
      if (sourceMatch && sourceMatch.length > 1 && sourceMatch[1]) {
        const sourceText = sourceMatch[1]
        // Improved filtering to capture sources with relevance scores
        const sourceLines = sourceText
          .split('\n')
          .filter(line => {
            const trimmed = line.trim()
            return trimmed && (
              trimmed.includes('-') || 
              trimmed.includes('•') || 
              trimmed.includes('*') ||
              /^\d+\./.test(trimmed) || // numbered sources
              /^[a-zA-Z][\.\)]/.test(trimmed) || // lettered sources
              trimmed.includes('(Relevância:') || // sources with relevance scores
              trimmed.includes('Relevância:') || // alternative format
              trimmed.includes('"') // quoted document titles
            )
          })
          .map(line => line.trim().replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^[a-zA-Z][\.\)]\s*/, ''))
          .sort((a, b) => {
            // Sort by relevance score if available
            const relevanceMatchA = a.match(/\(Relevância:\s*(\d+)\)/) || a.match(/Relevância:\s*(\d+)/)
            const relevanceMatchB = b.match(/\(Relevância:\s*(\d+)\)/) || b.match(/Relevância:\s*(\d+)/)
            const relevanceA = relevanceMatchA ? relevanceMatchA[1] : null
            const relevanceB = relevanceMatchB ? relevanceMatchB[1] : null
            
            if (relevanceA && relevanceB) {
              return parseInt(relevanceB) - parseInt(relevanceA) // Descending order by relevance
            }
            
            // If no relevance score, sort by length (longer content first)
            return b.length - a.length
          })
        
        sources.push(...sourceLines)
        break // Stop after finding the first match
      }
    }
    
    // Clean content - remove reference sections with flexible regex patterns
    let cleanContent = content
    
    // Remove all possible reference section formats
    const cleanPatterns = [
      /\*\*(Citações e )?Referências:\*\*[\s\S]*$/i,
      /\*\*Referências utilizadas:\*\*[\s\S]*$/i,
      /\*\*Referências:\*\*[\s\S]*$/i,
      /\*\*Fontes da base de dados.*?:\*\*[\s\S]*$/i,
      /\*\*Fontes utilizadas.*?:\*\*[\s\S]*$/i,
      /\*\*Fontes da base de dados utilizadas.*?:\*\*[\s\S]*$/i
    ]
    
    for (const pattern of cleanPatterns) {
      cleanContent = cleanContent.replace(pattern, "")
    }
    
    // Clean up any trailing separators and whitespace
    cleanContent = cleanContent.replace(/\n\s*---\s*$/, '').trim()
    
    // Sort references by relevance (longer references first, then alphabetically)
    const sortedReferences = references.sort((a, b) => {
      if (a.length !== b.length) {
        return b.length - a.length // Longer references first
      }
      return a.localeCompare(b) // Alphabetical order for same length
    })
    
    return {
      cleanContent: cleanContent.trim(),
      references: sortedReferences,
      sources: sources // Already sorted by relevance score
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
                <div className={`flex ${message.role === "user" ? "flex-row-reverse" : "flex-row"} items-start space-x-2 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]`}>
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                    <AvatarImage 
                      src={message.role === "user" ? (profile?.avatar_url || "/default-avatar.png") : appConfig.prophetAvatar} 
                      alt={message.role === "user" ? (profile?.name || "User") : appConfig.prophetName}
                      onLoad={() => console.log(`✅ Avatar loaded for ${message.role}:`, message.role === "user" ? (profile?.avatar_url || "/default-avatar.png") : appConfig.prophetAvatar)}
                      onError={() => 
                        console.error(`❌ Failed to load avatar for ${message.role}:`, message.role === "user" ? (profile?.avatar_url || "/default-avatar.png") : appConfig.prophetAvatar)
                      }
                    />
                    <AvatarFallback className="text-xs">{message.role === "user" ? "U" : "WB"}</AvatarFallback>
                  </Avatar>
                  <Card className={`${message.role === "user" ? "bg-primary text-primary-foreground ml-2" : "mr-2"}`}>
                    <CardContent className="p-2 sm:p-3">
                      <div className="space-y-2">
                        {/* Renderizar áudio se existir */}
                        {message.audioUrl && (
                          <div className="mb-2">
                            <WhatsAppAudioPlayer 
                              src={message.audioUrl} 
                              className="max-w-[250px] sm:max-w-xs"
                            />
                          </div>
                        )}
                        
                        {/* Mostrar transcrição se for mensagem de áudio */}
                        {message.transcription && (
                          <div className="mb-2 p-2 bg-muted/50 rounded text-xs sm:text-sm italic border-l-2 border-primary/30">
                            <span className="font-medium">Transcrição:</span> {message.transcription}
                          </div>
                        )}
                        
                        <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{cleanContent}</p>
                        
                        {/* Botões de ação */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(cleanContent)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title="Copiar mensagem"
                            >
                              <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Para mensagens do assistente, encontrar a pergunta anterior do usuário
                                let userQuestion = undefined
                                if (message.role === "assistant" && index > 0) {
                                  const previousMessage = messages[index - 1]
                                  if (previousMessage.role === "user") {
                                    const { cleanContent: userCleanContent } = processMessageContent(previousMessage.content)
                                    userQuestion = userCleanContent
                                  }
                                }
                                shareMessage(cleanContent, allReferences, userQuestion)
                              }}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title="Compartilhar no WhatsApp"
                            >
                              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            
                            {allReferences.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedReferences(prev => ({
                                  ...prev,
                                  [index]: !prev[index]
                                }))}
                                className="h-7 px-2 sm:h-8 sm:px-3 text-xs sm:text-sm"
                                title={expandedReferences[index] ? "Ocultar referências" : "Ver referências"}
                              >
                                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                {allReferences.length}
                                {expandedReferences[index] ? (
                                  <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                                )}
                              </Button>
                            )}
                          </div>
                          
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        
                        {/* Seção de referências expandida */}
                        {expandedReferences[index] && allReferences.length > 0 && (
                          <div className="mt-3 p-2 sm:p-3 bg-muted/30 rounded-lg border">
                            <div className="text-xs space-y-3">
                              {references.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold mb-2 text-foreground flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    Citações e Referências ({references.length})
                                  </h4>
                                  <div className="space-y-1">
                                    {references.map((ref, refIndex) => (
                                      <div key={refIndex} className="flex items-start gap-2 p-2 bg-background/50 rounded border-l-2 border-primary/20">
                                        <span className="text-primary font-medium text-xs mt-0.5 flex-shrink-0">
                                          {refIndex + 1}.
                                        </span>
                                        <span className="text-xs leading-relaxed break-words">{ref}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {sources.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold mb-2 text-foreground flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    Fontes da Base de Dados ({sources.length})
                                  </h4>
                                  <div className="space-y-1">
                                    {sources.map((source, sourceIndex) => (
                                      <div key={sourceIndex} className="flex items-start gap-2 p-2 bg-background/50 rounded border-l-2 border-secondary/20">
                                        <span className="text-secondary font-medium text-xs mt-0.5 flex-shrink-0">
                                          {sourceIndex + 1}.
                                        </span>
                                        <span className="text-xs leading-relaxed break-words">{source}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {references.length === 0 && sources.length === 0 && (
                                <div className="text-center py-4">
                                  <p className="text-xs text-muted-foreground">
                                    Nenhuma referência encontrada nesta mensagem.
                                  </p>
                                </div>
                              )}
                            </div>
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
              <div className="flex items-start space-x-2 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarImage 
                    src={appConfig.prophetAvatar} 
                    alt={appConfig.prophetName}
                    onLoad={() => console.log("✅ Prophet loading avatar loaded:", appConfig.prophetAvatar)}
                    onError={() => 
                      console.error("❌ Failed to load prophet loading avatar:", appConfig.prophetAvatar)
                    }
                  />
                  <AvatarFallback className="text-xs">WB</AvatarFallback>
                </Avatar>
                <Card className="mr-2">
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">O profeta está meditando na Palavra...</span>
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
        <Alert className="mx-2 sm:mx-4 mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="p-2 sm:p-4 border-t">
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
              className="min-h-[40px] sm:min-h-[44px] text-sm sm:text-base"
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
            className="h-[40px] w-[40px] sm:h-[44px] sm:w-[44px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!hasActiveSubscription && !isAdmin && shouldShowUpgradeOffer && (
          <div className="mt-3 sm:mt-4 max-w-4xl mx-auto">
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm">Você tem acesso limitado. Faça upgrade para conversas ilimitadas!</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowUpgradeModal(true)}
                  className="self-start sm:self-auto sm:ml-2"
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
