"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Send, Loader2, AlertCircle, BookOpen, Copy, Share2, ChevronDown, ChevronUp, Book } from "lucide-react"
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
  const [expandedVerses, setExpandedVerses] = useState<{ [key: string]: boolean }>({})
  const [verseTexts, setVerseTexts] = useState<{ [key: string]: string }>({})
  const [isRecordingActive, setIsRecordingActive] = useState(false)
  const [progress, setProgress] = useState(0)

  // Animar progresso durante o carregamento
  useEffect(() => {
    if (isLoading) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90 // Manter em 90% até completar
          return prev + Math.random() * 10
        })
      }, 500)
      
      return () => clearInterval(interval)
    } else {
      setProgress(100) // Completar quando terminar
      setTimeout(() => setProgress(0), 500) // Resetar após 500ms
    }
  }, [isLoading])

  // Base de dados local de versículos bíblicos em português
  const localBibleDatabase = [
    { book: "João", chapter: 1, verse: 1, text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.", reference: "João 1:1" },
    { book: "João", chapter: 1, verse: 14, text: "E o Verbo se fez carne e habitou entre nós, e vimos a sua glória, como a glória do Unigênito do Pai, cheio de graça e de verdade.", reference: "João 1:14" },
    { book: "João", chapter: 3, verse: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
    { book: "João", chapter: 13, verse: 34, text: "Um novo mandamento vos dou: Que vos ameis uns aos outros; como eu vos amei a vós, que também vós uns aos outros vos ameis.", reference: "João 13:34" },
    { book: "João", chapter: 14, verse: 6, text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida. Ninguém vem ao Pai senão por mim.", reference: "João 14:6" },
    { book: "Atos", chapter: 2, verse: 38, text: "Então Pedro lhes disse: Arrependei-vos, e cada um de vós seja batizado em nome de Jesus Cristo para perdão dos pecados, e recebereis o dom do Espírito Santo.", reference: "Atos 2:38" },
    { book: "Atos", chapter: 4, verse: 12, text: "E em nenhum outro há salvação, porque também debaixo do céu nenhum outro nome há, dado entre os homens, pelo qual devamos ser salvos.", reference: "Atos 4:12" },
    { book: "Romanos", chapter: 3, verse: 23, text: "Porque todos pecaram e destituídos estão da glória de Deus.", reference: "Romanos 3:23" },
    { book: "Romanos", chapter: 6, verse: 23, text: "Porque o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna, por Cristo Jesus, nosso Senhor.", reference: "Romanos 6:23" },
    { book: "Romanos", chapter: 10, verse: 9, text: "A saber: Se com a tua boca confessares ao Senhor Jesus e em teu coração creres que Deus o ressuscitou dos mortos, serás salvo.", reference: "Romanos 10:9" },
    { book: "Efésios", chapter: 2, verse: 8, text: "Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.", reference: "Efésios 2:8" },
    { book: "Efésios", chapter: 2, verse: 9, text: "Não vem das obras, para que ninguém se glorie.", reference: "Efésios 2:9" },
    { book: "Efésios", chapter: 4, verse: 5, text: "Um só Senhor, uma só fé, um só batismo.", reference: "Efésios 4:5" },
    { book: "Hebreus", chapter: 13, verse: 8, text: "Jesus Cristo é o mesmo ontem, hoje e eternamente.", reference: "Hebreus 13:8" },
    { book: "Hebreus", chapter: 4, verse: 15, text: "Porque não temos um sumo sacerdote que não possa compadecer-se das nossas fraquezas; porém um que, como nós, em tudo foi tentado, mas sem pecado.", reference: "Hebreus 4:15" },
    { book: "Mateus", chapter: 28, verse: 19, text: "Portanto, ide, ensinai todas as nações, batizando-as em nome do Pai, e do Filho, e do Espírito Santo.", reference: "Mateus 28:19" },
    { book: "Mateus", chapter: 1, verse: 21, text: "E ela dará à luz um filho, e lhe porás o nome de Jesus, porque ele salvará o seu povo dos seus pecados.", reference: "Mateus 1:21" },
    { book: "Marcos", chapter: 16, verse: 16, text: "Quem crer e for batizado será salvo; mas quem não crer será condenado.", reference: "Marcos 16:16" },
    { book: "Lucas", chapter: 24, verse: 47, text: "E em seu nome se pregasse o arrependimento e a remissão dos pecados, em todas as nações, começando por Jerusalém.", reference: "Lucas 24:47" },
    { book: "1 João", chapter: 5, verse: 7, text: "Porque três são os que testificam no céu: o Pai, a Palavra e o Espírito Santo; e estes três são um.", reference: "1 João 5:7" },
    { book: "1 João", chapter: 1, verse: 9, text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça.", reference: "1 João 1:9" },
    { book: "Colossenses", chapter: 2, verse: 9, text: "Porque nele habita corporalmente toda a plenitude da divindade.", reference: "Colossenses 2:9" },
    { book: "Filipenses", chapter: 2, verse: 10, text: "Para que ao nome de Jesus se dobre todo joelho dos que estão nos céus, e na terra, e debaixo da terra.", reference: "Filipenses 2:10" },
    { book: "Filipenses", chapter: 2, verse: 11, text: "E toda língua confesse que Jesus Cristo é o Senhor, para glória de Deus Pai.", reference: "Filipenses 2:11" },
    { book: "Apocalipse", chapter: 1, verse: 8, text: "Eu sou o Alfa e o Ômega, o princípio e o fim, diz o Senhor, que é, e que era, e que há de vir, o Todo-poderoso.", reference: "Apocalipse 1:8" },
    { book: "Apocalipse", chapter: 3, verse: 20, text: "Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei em sua casa e com ele cearei, e ele, comigo.", reference: "Apocalipse 3:20" },
    { book: "Apocalipse", chapter: 22, verse: 13, text: "Eu sou o Alfa e o Ômega, o Primeiro e o Último, o Princípio e o Fim.", reference: "Apocalipse 22:13" },
    { book: "Gênesis", chapter: 1, verse: 1, text: "No princípio, criou Deus os céus e a terra.", reference: "Gênesis 1:1" },
    { book: "Gênesis", chapter: 1, verse: 3, text: "E disse Deus: Haja luz. E houve luz.", reference: "Gênesis 1:3" },
    { book: "Gênesis", chapter: 3, verse: 15, text: "E porei inimizade entre ti e a mulher e entre a tua semente e a sua semente; esta te ferirá a cabeça, e tu lhe ferirás o calcanhar.", reference: "Gênesis 3:15" },
    { book: "1 Coríntios", chapter: 15, verse: 3, text: "Porque primeiramente vos entreguei o que também recebi: que Cristo morreu por nossos pecados, segundo as Escrituras.", reference: "1 Coríntios 15:3" },
    { book: "1 Coríntios", chapter: 15, verse: 4, text: "E que foi sepultado, e que ressuscitou ao terceiro dia, segundo as Escrituras.", reference: "1 Coríntios 15:4" }
  ]

  // Função para buscar versículo diretamente na base local
  const findBibleVerseDirectly = (text: string) => {
    const cleanText = text.replace(/[()]/g, '').trim().toLowerCase()
    console.log('🔍 Buscando na base local:', cleanText)
    
    // Padrões para diferentes formatos
    const patterns = [
      /(\w+)\s+(\d+):(\d+)(?:-(\d+))?/i,
      /(\d+)\s+(\w+)\s+(\d+):(\d+)(?:-(\d+))?/i
    ]
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern)
      if (match) {
        let bookName, chapter, verse
        
        if (match.length === 6 && match[1].match(/^\d+$/)) {
          // Formato: 1 João 5:7
          bookName = `${match[1]} ${match[2]}`
          chapter = parseInt(match[3])
          verse = parseInt(match[4])
        } else {
          // Formato: João 3:16
          bookName = match[1]
          chapter = parseInt(match[2])
          verse = parseInt(match[3])
        }
        
        console.log('📖 Procurando:', { bookName, chapter, verse })
        
        // Buscar na base local
        const found = localBibleDatabase.find(v => {
          const bookMatches = v.book.toLowerCase() === bookName.toLowerCase() ||
                             v.reference.toLowerCase().includes(bookName.toLowerCase())
          return bookMatches && v.chapter === chapter && v.verse === verse
        })
        
        if (found) {
          console.log('✅ Encontrado na base local:', found)
          return found
        }
      }
    }
    
    console.log('❌ Não encontrado na base local')
    return null
  }

  const [processedMessages, setProcessedMessages] = useState<{ [key: number]: any }>({})

  // Função para processar mensagens de forma assíncrona
  const processMessage = async (message: any, index: number) => {
    if (processedMessages[index]) {
      return processedMessages[index]
    }
    
    const result = await processMessageContent(message.content, index)
    setProcessedMessages(prev => ({ ...prev, [index]: result }))
    return result
  }

  // Processar mensagens quando elas mudarem
  useEffect(() => {
    messages.forEach(async (message, index) => {
      if (!processedMessages[index]) {
        await processMessage(message, index)
      }
    })
  }, [messages])

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

    const userMessageId = crypto.randomUUID()
    const userMessage: Message = {
      id: userMessageId, // ID único para mensagem de texto do usuário
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")

    try {
      // Removemos o comportamento especial da primeira mensagem
      // Todas as mensagens agora são processadas pela API

      if (!hasActiveSubscription && !isAdmin) {
        setMessages(messages)
        setShowUpgradeModal(true)
        setIsLoading(false)
        setIsSearchingMessages(false)
        return
      }

      // Enviar mensagem para a API de chat
      console.log('📤 Enviando mensagem de texto para processamento...')
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          conversationId: conversationId,
          userId: user?.id || "anonymous",
          userName: profile?.name || user?.email?.split('@')[0] || 'irmão/irmã',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      const data = await response.json()
      console.log('✅ Resposta da API recebida:', {
        hasMessage: !!data.message,
        messageLength: data.message?.length || 0
      })

      const assistantMessage: Message = {
        id: crypto.randomUUID(), // ID único para mensagem do assistente
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)

      if (user?.id) {
        console.log('💾 Salvando conversa com mensagem de texto...')
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
        console.log('📊 Resposta do salvamento:', saveData)
        if (saveData.success && onConversationUpdate) {
          onConversationUpdate()
        }
        console.log('✅ Conversa salva com sucesso!')
      }

      if (refreshSubscription) {
        refreshSubscription()
      }
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error)
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
      formData.append('userName', profile?.name || user?.email?.split('@')[0] || 'irmão/irmã')
      
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

  const processMessageContent = async (content: string, messageIndex: number = 0) => {
    // Safety check - ensure content is a valid string
    if (!content || typeof content !== 'string') {
      return {
        cleanContent: '',
        references: [],
        sources: [],
        bibleReferences: [],
        processedContent: ''
      }
    }
    
    const references: string[] = []
    const sources: string[] = []
    const bibleReferences: string[] = []
    
    // Extract references with improved regex patterns - support multiple formats
    const referencePatterns = [
      /\*\*(Citações e )?Referências:\*\*([\s\S]*?)(?=---|\*\*Fontes da base de dados.*?:\*\*|$)/i,
      /\*\*Referências utilizadas:\*\*([\s\S]*?)(?=---|\*\*Fontes da base de dados.*?:\*\*|$)/i,
      /\*\*Referências:\*\*([\s\S]*?)(?=---|\*\*Fontes da base de dados.*?:\*\*|$)/i
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
              trimmed.includes(',') || // document titles with paragraphs
              trimmed.includes('parágrafos') || // specific to prophet messages
              trimmed.length > 10 // catch longer reference lines
            )
          })
          .map(line => line.trim().replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^[a-zA-Z][\.\)]\s*/, ''))
        
        references.push(...referenceLines)
        break // Stop after finding the first match
      }
    }
    
    // Extract sources with improved regex patterns and relevance scores
    const sourcePatterns = [
      /\*\*Fontes da base de dados utilizadas para esta resposta:\*\*([\s\S]*?)$/i,
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
    
    // Extract Bible references (King James 1611)
    const biblePattern = /\*\*Referências Bíblicas \(King James 1611\):\*\*([\s\S]*?)$/i
    const bibleMatch = content.match(biblePattern)
    if (bibleMatch && bibleMatch[1]) {
      const bibleText = bibleMatch[1]
      const bibleLines = bibleText
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          return trimmed && /^\d+\./.test(trimmed) // numbered bible references
        })
        .map(line => line.trim().replace(/^\d+\.\s*/, ''))
      
      bibleReferences.push(...bibleLines)
    }
    
    // Clean content - remove reference sections with flexible regex patterns
    let cleanContent = content
    
    // Remove all possible reference section formats (including Bible references)
    const cleanPatterns = [
      /\*\*(Citações e )?Referências:\*\*[\s\S]*$/i,
      /\*\*Referências utilizadas:\*\*[\s\S]*$/i,
      /\*\*Referências:\*\*[\s\S]*$/i,
      /\*\*Fontes da base de dados.*?:\*\*[\s\S]*$/i,
      /\*\*Fontes utilizadas.*?:\*\*[\s\S]*$/i,
      /\*\*Fontes da base de dados utilizadas.*?:\*\*[\s\S]*$/i,
      /\*\*Referências Bíblicas \(King James 1611\):\*\*[\s\S]*$/i
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
    
    // Process inline Bible verses in content
    let processedContent = cleanContent
    
    // Padrões mais abrangentes para capturar diferentes formatos de versículos
    const versePatterns = [
      // Padrão genérico para capturar qualquer formato de capítulo:versículo (primeiro para capturar o mais amplo)
      /(\d+\s+\w+\s+\d+:\d+(?:-\d+)?)/g,
      /(\w+\s+\d+:\d+(?:-\d+)?)/g,
      /(\d+:\d+(?:-\d+)?)/g,
      // NOVO: Formato com asteriscos: **1 Timóteo 2:9-10**
      /(\*\*\d+\s+\w+\s+\d+:\d+(?:-\d+)?\*\*)/g,
      /(\*\*\w+\s+\d+:\d+(?:-\d+)?\*\*)/g,
      // Formato: 2:17-18: "texto"
      /(\d+:\d+(?:-\d+)?:\s*"[^"]+?")/g,
      // Formato: Em 1 Timóteo 2:12, está escrito: "texto"
      /(Em\s+\d+\s+\w+\s+\d+:\d+(?:-\d+)?,\s*está\s+escrito:\s*"[^"]+?")/gi,
      // Formato: 1 Timóteo 2:12: "texto"
      /(\d+\s+\w+\s+\d+:\d+(?:-\d+)?:\s*"[^"]+?")/g,
      // Formato: Atos 2:17-18: "texto"
      /(\w+\s+\d+:\d+(?:-\d+)?:\s*"[^"]+?")/g,
      // Formato: como vemos em Atos 2:17-18: "texto"
      /(como\s+vemos\s+em\s+\w+\s+\d+:\d+(?:-\d+)?:\s*"[^"]+?")/gi,
      // Formato genérico: "texto" (livro capítulo:versículo)
      /("[^"]+?"\s*\([^)]*\d+:\d+(?:-\d+)?[^)]*\))/g,
      // Formato: A Bíblia nos ensina sobre... Em 1 Timóteo 2:12, está escrito: "texto"
      /(A\s+Bíblia\s+nos\s+ensina[^"]*Em\s+\d+\s+\w+\s+\d+:\d+(?:-\d+)?,\s*está\s+escrito:\s*"[^"]+?")/gi,
      // Formato: Paulo, inspirado pelo Espírito, nos dá essa instrução
      /(Paulo,\s+inspirado\s+pelo\s+Espírito,\s+nos\s+dá\s+essa\s+instrução[^"]*"[^"]+?")/gi,
      // Formato: como está escrito em... "texto"
      /(como\s+está\s+escrito\s+em[^"]*"[^"]+?")/gi,
      // Formato: A Palavra diz em... "texto"
      /(A\s+Palavra\s+diz\s+em[^"]*"[^"]+?")/gi,
      // Formato: nas Escrituras lemos... "texto"
      /(nas\s+Escrituras\s+lemos[^"]*"[^"]+?")/gi,
      // Formato: o Senhor disse... "texto"
      /(o\s+Senhor\s+disse[^"]*"[^"]+?")/gi,
      // Formato: As Escrituras, em 1 Timóteo 2:12, nos dizem: "texto"
      /(As\s+Escrituras,\s+em\s+\d+\s+\w+\s+\d+:\d+(?:-\d+)?,\s+nos\s+dizem:\s*"[^"]+?")/gi,
      // Formato: E em 1 Coríntios 14:34-35, a Palavra nos adverte: "texto"
      /(E\s+em\s+\d+\s+\w+\s+\d+:\d+(?:-\d+)?,\s+a\s+Palavra\s+nos\s+adverte:\s*"[^"]+?")/gi,
      // Formato: Como já conversamos antes, a Bíblia nos apresenta uma ordem divina
      /(Como\s+já\s+conversamos\s+antes,\s+a\s+Bíblia\s+nos\s+apresenta[^"]*"[^"]+?")/gi,
      // Formato: onde o homem é o cabeça e a mulher deve estar em submissão
      /(onde\s+o\s+homem\s+é\s+o\s+cabeça\s+e\s+a\s+mulher\s+deve\s+estar\s+em\s+submissão[^"]*"[^"]+?")/gi,
      // Formato: mas estejam sujeitas, como também ordena a lei
      /(mas\s+estejam\s+sujeitas,\s+como\s+também\s+ordena\s+a\s+lei[^"]*"[^"]+?")/gi,
      // Formato: E, se querem aprender alguma coisa, interroguem em casa
      /(E,\s+se\s+querem\s+aprender\s+alguma\s+coisa,\s+interroguem\s+em\s+casa[^"]*"[^"]+?")/gi,
      // Formato: porque é vergonhoso que as mulheres falem na igreja
      /(porque\s+é\s+vergonhoso\s+que\s+as\s+mulheres\s+falem\s+na\s+igreja[^"]*"[^"]+?")/gi,
      // NOVO: Formato apenas referência: (Efésios 2:8-9), Atos 2:38, etc.
      /(\([^)]*\w+\s+\d+:\d+(?:-\d+)?[^)]*\))/g,
      /(\w+\s+\d+:\d+(?:-\d+)?(?=[\s.,;!?]|$))/g
    ]
    
    let verseCounter = 0
    const versesToFetch: { id: string, text: string }[] = []
    
    versePatterns.forEach(pattern => {
      processedContent = processedContent.replace(pattern, (match) => {
        // Usar um ID baseado no índice da mensagem e contador para ser consistente
         const verseId = `verse_${messageIndex}_${verseCounter++}`
         
         // Remover asteriscos do texto do versículo
         const cleanVerseText = match.replace(/\*\*/g, '')
         
         // Se não tem texto (aspas), adicionar à lista para buscar
         if (!cleanVerseText.includes('"')) {
           versesToFetch.push({ id: verseId, text: cleanVerseText })
         }
         
        return `{{VERSE:${verseId}:${cleanVerseText}}}`
      })
    })
    
    // Buscar todos os versículos que não têm texto automaticamente
    if (versesToFetch.length > 0) {
      try {
        const fetchPromises = versesToFetch.map(async ({ id, text }) => {
          const response = await fetch('/api/bible-references', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.verses && data.verses.length > 0) {
              const foundVerse = data.verses[0]
              const fullVerseText = `${foundVerse.reference} - "${foundVerse.text}"`
              return { id, fullText: fullVerseText }
            }
          }
          return null
        })
        
        const results = await Promise.all(fetchPromises)
        
        // Atualizar o estado com os versículos encontrados
        const newVerseTexts: { [key: string]: string } = {}
        results.forEach(result => {
          if (result) {
            newVerseTexts[result.id] = result.fullText
          }
        })
        
        if (Object.keys(newVerseTexts).length > 0) {
          setVerseTexts(prev => ({ ...prev, ...newVerseTexts }))
        }
      } catch (error) {
        console.error('Erro ao buscar versículos automaticamente:', error)
      }
    }
    
    return {
      cleanContent: cleanContent.trim(),
      processedContent: processedContent.trim(),
      references: sortedReferences,
      sources: sources, // Already sorted by relevance score
      bibleReferences: bibleReferences
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
            const messageData = processedMessages[index] || {
              cleanContent: message.content,
              references: [],
              sources: [],
              bibleReferences: [],
              processedContent: message.content
            }
            const { cleanContent, references, sources, bibleReferences, processedContent } = messageData
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
                        
                        {/* Renderizar conteúdo com versículos inline */}
                        <div className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                          {processedContent.split(/(\{\{VERSE:[^}]+\}\})/).map((part, partIndex) => {
                            if (part.startsWith('{{VERSE:')) {
                              const match = part.match(/\{\{VERSE:([^:]+):(.+)\}\}/)
                              if (match) {
                                const [, verseId, verseText] = match
                                const isExpanded = expandedVerses[verseId]
                                
                                return (
                                  <div key={partIndex} className="inline-block">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async (e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        console.log('Toggle clicked for verse:', verseId, 'Current state:', isExpanded)
                                          console.log('Verse text:', verseText)
                                          
                                          // Algoritmo direto para buscar versículo sem depender da IA
                                          if (!verseText.includes('"') && !verseTexts[verseId]) {
                                            console.log('🔍 Buscando versículo automaticamente:', verseText)
                                            
                                            // Buscar diretamente na base de dados local
                                            const foundVerse = findBibleVerseDirectly(verseText)
                                            if (foundVerse) {
                                              console.log('✅ Versículo encontrado diretamente:', foundVerse)
                                              setVerseTexts(prev => ({
                                                ...prev,
                                                [verseId]: `${foundVerse.reference} - "${foundVerse.text}"`
                                              }))
                                            } else {
                                              // Fallback para API apenas se não encontrar diretamente
                                              console.log('🔍 Fallback: Buscando na API...')
                                              try {
                                                const response = await fetch('/api/bible-references', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                  },
                                                  body: JSON.stringify({ text: verseText })
                                                })
                                                
                                                if (response.ok) {
                                                  const data = await response.json()
                                                  if (data.verses && data.verses.length > 0) {
                                                    const foundVerse = data.verses[0]
                                                    const fullVerseText = `${foundVerse.reference} - "${foundVerse.text}"`
                                                    setVerseTexts(prev => ({
                                                      ...prev,
                                                      [verseId]: fullVerseText
                                                    }))
                                                  } else {
                                                    // Se não encontrou na API, explicar que não é um versículo válido
                                                    setVerseTexts(prev => ({
                                                      ...prev,
                                                      [verseId]: `"${verseText}" - Esta referência não foi encontrada como um versículo bíblico válido.`
                                                    }))
                                                  }
                                                } else {
                                                  // Se a API retornou erro, explicar que não é um versículo válido
                                                  setVerseTexts(prev => ({
                                                    ...prev,
                                                    [verseId]: `"${verseText}" - Esta referência não foi encontrada como um versículo bíblico válido.`
                                                  }))
                                                }
                                              } catch (error) {
                                                console.error('❌ Erro ao buscar versículo:', error)
                                                // Se não encontrou na API, explicar que não é um versículo válido
                                                setVerseTexts(prev => ({
                                                  ...prev,
                                                  [verseId]: `"${verseText}" - Esta referência não foi encontrada como um versículo bíblico válido.`
                                                }))
                                              }
                                            }
                                        
                                        setExpandedVerses(prev => {
                                          const newState = {
                                            ...prev,
                                            [verseId]: !prev[verseId]
                                          }
                                          console.log('New expanded state:', newState)
                                          return newState
                                        })
                                      }}
                                      className="inline-flex items-center gap-1 h-auto p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded mx-1"
                                    >
                                      <Book className="h-3 w-3" />
                                      <span className="text-xs font-medium">
                                        {(() => {
                                          // Extrair referência de diferentes formatos
                                          if (verseText.includes('Em ') && verseText.includes('está escrito:')) {
                                            const match = verseText.match(/Em\s+(\d+\s+\w+\s+\d+:\d+(?:-\d+)?)/i)
                                            return match ? match[1] : 'Versículo'
                                          } else if (verseText.includes('A Bíblia nos ensina')) {
                                            const match = verseText.match(/Em\s+(\d+\s+\w+\s+\d+:\d+(?:-\d+)?)/i)
                                            return match ? match[1] : 'Versículo'
                                          } else if (verseText.match(/^\d+\s+\w+\s+\d+:\d+/)) {
                                            const match = verseText.match(/^(\d+\s+\w+\s+\d+:\d+(?:-\d+)?)/i)
                                            return match ? match[1] : 'Versículo'
                                          } else if (verseText.match(/^\w+\s+\d+:\d+/)) {
                                            const match = verseText.match(/^(\w+\s+\d+:\d+(?:-\d+)?)/i)
                                            return match ? match[1] : 'Versículo'
                                          } else if (verseText.match(/como\s+vemos\s+em/i)) {
                                            const match = verseText.match(/como\s+vemos\s+em\s+(\w+\s+\d+:\d+(?:-\d+)?)/i)
                                            return match ? match[1] : 'Versículo'
                                          } else if (verseText.includes('(') && verseText.includes(')')) {
                                            const match = verseText.match(/\(([^)]*\d+:\d+(?:-\d+)?[^)]*)\)/)
                                            return match ? match[1] : verseText.replace(/[()]/g, '')
                                          } else if (verseText.includes('Paulo, inspirado')) {
                                            return 'Paulo - Escritura'
                                          } else if (verseText.includes('como está escrito')) {
                                            const match = verseText.match(/(\w+\s+\d+:\d+(?:-\d+)?)/)
                                            return match ? match[1] : 'Escritura'
                                          } else if (verseText.includes('A Palavra diz')) {
                                            const match = verseText.match(/(\w+\s+\d+:\d+(?:-\d+)?)/)
                                            return match ? match[1] : 'A Palavra'
                                          } else if (verseText.includes('nas Escrituras')) {
                                            const match = verseText.match(/(\w+\s+\d+:\d+(?:-\d+)?)/)
                                            return match ? match[1] : 'Escrituras'
                                          } else if (verseText.includes('o Senhor disse')) {
                                            const match = verseText.match(/(\w+\s+\d+:\d+(?:-\d+)?)/)
                                            return match ? match[1] : 'O Senhor'
                                          } else {
                                            const match = verseText.match(/(\w+\s+\d+:\d+(?:-\d+)?)/)
                                            return match ? match[1] : verseText.trim()
                                          }
                                        })()}
                                      </span>
                                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    </Button>
                                    {isExpanded && (
                                      <div className="block w-full mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r text-sm italic shadow-sm">
                                        <div className="font-medium text-blue-800 mb-1">📖 Escritura:</div>
                                        <div className="text-blue-700">{verseTexts[verseId] || verseText}</div>
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                            }
                            return <span key={partIndex}>{part}</span>
                          })}
                        </div>
                        
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
                                    userQuestion = previousMessage.content
                                  }
                                }
                                shareMessage(cleanContent, allReferences, userQuestion)
                              }}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title="Compartilhar no WhatsApp"
                            >
                              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            
                            {(allReferences.length > 0 || bibleReferences.length > 0) && (
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
                                {allReferences.length + bibleReferences.length}
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
                        {expandedReferences[index] && (allReferences.length > 0 || bibleReferences.length > 0) && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="text-sm space-y-4">
                              {references.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Citações dos Sermões do Profeta ({references.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {references.map((ref, refIndex) => {
                                      // Extrair título e parágrafos
                                      const parts = ref.split(', parágrafos ')
                                      const title = parts[0] || ref
                                      const paragraphs = parts[1] || ''
                                      
                                      return (
                                        <div key={refIndex} className="text-sm leading-relaxed">
                                          <div className="flex items-start gap-3">
                                            <span className="font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0 text-base">
                                              {refIndex + 1}.
                                            </span>
                                            <div className="flex-1">
                                              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                                {title}
                                              </div>
                                              {paragraphs && (
                                                <div className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-md">
                                                  <span className="font-medium">Parágrafos utilizados:</span> {paragraphs}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {sources.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Documentos da Base de Dados Utilizados ({sources.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {sources.map((source, sourceIndex) => {
                                      // Extrair título e relevância
                                      const titleMatch = source.match(/"([^"]+)"/)
                                      const relevanceMatch = source.match(/Relevância:\s*(\d+)/)
                                      const title = titleMatch ? titleMatch[1] : source
                                      const relevance = relevanceMatch ? parseInt(relevanceMatch[1]) : 0
                                      
                                      const getRelevanceLabel = (score: number) => {
                                        if (score >= 5000) return 'Muito Alta'
                                        if (score >= 3000) return 'Alta'
                                        if (score >= 1000) return 'Média'
                                        return 'Baixa'
                                      }
                                      
                                      return (
                                        <div key={sourceIndex} className="text-sm leading-relaxed">
                                          <div className="flex items-start gap-3">
                                            <span className="font-semibold text-green-600 dark:text-green-400 flex-shrink-0 text-base">
                                              {sourceIndex + 1}.
                                            </span>
                                            <div className="flex-1">
                                              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                                {title}
                                              </div>
                                              {relevance > 0 && (
                                                <div className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-md">
                                                  <span className="font-medium">Relevância:</span> {getRelevanceLabel(relevance)} ({relevance})
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {bibleReferences.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Referências Bíblicas - King James 1611 ({bibleReferences.length})
                                  </h4>
                                  <div className="space-y-3">
                                    {bibleReferences.map((bibleRef, bibleIndex) => {
                                      // Extrair referência e texto
                                      const parts = bibleRef.split(' - ')
                                      const reference = parts[0] || bibleRef
                                      const text = parts[1] || ''
                                      
                                      return (
                                        <div key={bibleIndex} className="text-sm leading-relaxed">
                                          <div className="flex items-start gap-3">
                                            <span className="font-semibold text-purple-600 dark:text-purple-400 flex-shrink-0 text-base">
                                              {bibleIndex + 1}.
                                            </span>
                                            <div className="flex-1">
                                              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                                {reference}
                                              </div>
                                              {text && (
                                                <div className="text-slate-700 dark:text-slate-300 italic bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-md">
                                                  "{text.replace(/"/g, '')}"
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {references.length === 0 && sources.length === 0 && bibleReferences.length === 0 && (
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
                    {isLoading && (
                      <Progress value={progress} className="w-full mt-2" />
                    )}
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
