"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Send, Loader2, AlertCircle, BookOpen, Copy, Share2, ChevronDown, ChevronUp, Book, MessageSquare, Image as ImageIcon, Instagram, X, Download, Link } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AudioRecorder from "@/components/audio-recorder"
import { AudioPlayer } from "@/components/audio-player"
import { WhatsAppAudioPlayer } from "@/components/whatsapp-audio-player"
import { useSubscription } from "@/hooks/use-tokens"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { UpgradeModal } from "@/components/upgrade-modal"
import { Crown, Zap } from "lucide-react"
import { generateAvatarUrl } from "@/lib/utils"

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

  // Estados para funcionalidade "Continuar Sermão"
  const [canContinueSermon, setCanContinueSermon] = useState(false)
  const [continueData, setContinueData] = useState<{
    originalQuestion: string
    previousResponse: string
    relevantDocuments: any[]
    bibleReferences: any[]
  } | null>(null)
  const [isContinuing, setIsContinuing] = useState(false)

  // Estados para o modal de compartilhamento
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareData, setShareData] = useState<{
    content: string
    references: string[]
    userQuestion?: string
    imageUrls: string[]
  } | null>(null)

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

    // Limpar estado de continuação ao enviar nova mensagem
    setCanContinueSermon(false)
    setContinueData(null)

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
        messageLength: data.message?.length || 0,
        canContinue: data.canContinue
      })

      // Verificar se a resposta pode ser continuada
      if (data.canContinue) {
        console.log('➡️ Resposta pode ser continuada - ativando botão "Continuar Sermão"')
        setCanContinueSermon(true)
        setContinueData({
          originalQuestion: textToSend,
          previousResponse: data.message,
          relevantDocuments: data.documentsUsed || [],
          bibleReferences: data.bibleReferences || []
        })
      } else {
        setCanContinueSermon(false)
        setContinueData(null)
      }

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

  // Função para continuar o sermão
  const continueSermon = async () => {
    if (!continueData) return

    console.log('➡️ CONTINUANDO SERMAO...')
    setIsContinuing(true)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/continue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalQuestion: continueData.originalQuestion,
          previousResponse: continueData.previousResponse,
          userId: user?.id,
          userName: profile?.name || user?.email?.split('@')[0] || 'irmão/irmã',
          relevantDocuments: continueData.relevantDocuments,
          bibleReferences: continueData.bibleReferences,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao continuar sermão')
      }

      const data = await response.json()
      console.log('✅ Continuação recebida:', {
        hasContinuation: !!data.continuation,
        canContinue: data.canContinue
      })

      // Atualizar estado de continuação
      if (data.canContinue) {
        setCanContinueSermon(true)
        setContinueData({
          ...continueData,
          previousResponse: continueData.previousResponse + '\n\n' + data.continuation
        })
      } else {
        setCanContinueSermon(false)
        setContinueData(null)
      }

      // Atualizar a última mensagem do assistente com a continuação
      setMessages(prevMessages => {
        const newMessages = [...prevMessages]
        const lastAssistantIndex = newMessages.length - 1
        
        if (lastAssistantIndex >= 0 && newMessages[lastAssistantIndex].role === 'assistant') {
          // Concatenar a continuação à mensagem existente
          newMessages[lastAssistantIndex] = {
            ...newMessages[lastAssistantIndex],
            content: newMessages[lastAssistantIndex].content + '\n\n---\n\n**CONTINUAÇÃO DO SERMAO**\n\n' + data.continuation
          }
        }
        
        return newMessages
      })

    } catch (error) {
      console.error('❌ Erro ao continuar sermão:', error)
      setError('Erro ao continuar sermão. Tente novamente.')
    } finally {
      setIsContinuing(false)
      setIsLoading(false)
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
      
      // 🎯 PRIMEIRO: Processar áudio com API Chat unificada
      const response = await fetch('/api/chat', {
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
        hasMessage: !!data.message,
        hasTranscription: !!data.transcription,
        isBlocked: !!data.heresyDetected
      })

      // Verificar se o conteúdo foi bloqueado por heresia
      if (data.heresyDetected) {
        console.log('🚫 Conteúdo de áudio bloqueado por heresia:', data.heresyType)
        
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
          content: data.message, // Mensagem de bloqueio já formatada
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
                audio_url: null, // Áudio é processado separadamente agora
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

      // 🎯 SEGUNDO: Processar resposta normal (não bloqueada)
      if (data.message) {
        // Atualizar mensagem do usuário com transcrição, mantendo audioUrl e ID
        const updatedUserMessage: Message = {
          id: userMessageId, // Usar o mesmo ID da mensagem original
          role: 'user',
          content: data.transcription || '[Mensagem de áudio]',
          timestamp: new Date().toISOString(),
          audioUrl: audioUrl, // Manter URL do áudio para reprodução
          transcription: data.transcription // ← Salvar transcrição
        }
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(), // ID único para a mensagem do assistente
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        }
        
        const finalMessages = [...messages, updatedUserMessage, assistantMessage]
        setMessages(finalMessages)
        
        // 🎯 TERCEIRO: Atualizar conversa com transcrição e resposta do assistente
        if (user?.id) {
          try {
            console.log(' Salvando conversa final com transcrição e resposta...')
            const finalResponse = await fetch("/api/conversations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: user.id,
                conversation_id: conversationId,
                messages: finalMessages,
                audio_url: null, // Áudio processado separadamente agora
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

  // Função para gerar múltiplas imagens divididas da mensagem
  const generateShareImages = async (content: string, references: string[], userQuestion?: string): Promise<string[]> => {
    try {
      const prophetName = appConfig.prophetName || "Profeta William Branham"
      const prophetAvatar = appConfig.prophetAvatar || ""
      
      // Configurações de layout
      const width = 800
      const padding = 50
      const innerPadding = 30
      const lineHeight = 30
      
      // Cores
      const colors = {
        background: '#ffffff',
        cardBg: '#f8fafc',
        border: '#e2e8f0',
        questionBg: '#eff6ff',
        questionBorder: '#3b82f6',
        prophetBg: '#f0fdf4',
        prophetBorder: '#10b981',
        text: '#1e293b',
        textMuted: '#64748b',
        bibleQuote: '#7c3aed',
        bibleBg: '#f5f3ff',
        reference: '#475569'
      }

      const contentWidth = width - padding * 2 - innerPadding * 2
      
      // Dividir o texto em duas partes (por enquanto - depois faremos múltiplas)
      const contentParagraphs = content.split('\n').filter(p => p.trim())
      const midPoint = Math.ceil(contentParagraphs.length / 2)
      const contentPart1 = contentParagraphs.slice(0, midPoint).join('\n')
      const contentPart2 = contentParagraphs.slice(midPoint).join('\n')

      // Função para desenhar avatar
      const drawProphetAvatar = async (ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 45) => {
        ctx.save()
        
        if (prophetAvatar) {
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise<void>((resolve) => {
              img.onload = () => {
                ctx.beginPath()
                ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI)
                ctx.clip()
                ctx.drawImage(img, x, y, size, size)
                ctx.restore()
                resolve()
              }
              img.onerror = () => {
                drawDefaultProphetIcon(ctx, x, y, size)
                resolve()
              }
              img.src = prophetAvatar
            })
          } catch {
            drawDefaultProphetIcon(ctx, x, y, size)
          }
        } else {
          drawDefaultProphetIcon(ctx, x, y, size)
        }
        
        ctx.strokeStyle = colors.prophetBorder
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(x + size/2, y + size/2, size/2 + 2, 0, 2 * Math.PI)
        ctx.stroke()
      }
      
      const drawDefaultProphetIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
        ctx.fillStyle = colors.prophetBorder
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
      
      // Limitador de 11 palavras por linha para melhor legibilidade
      const MAX_WORDS_PER_LINE = 11
      
      const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, limitWords: boolean = true) => {
        const words = text.split(' ')
        const lines: string[] = []
        let currentLine = words[0] || ''
        let wordCount = 1
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i]
          const testLine = currentLine + ' ' + word
          const metrics = ctx.measureText(testLine)
          const wouldExceedWidth = metrics.width > maxWidth && currentLine !== ''
          const wouldExceedWords = limitWords && wordCount >= MAX_WORDS_PER_LINE
          
          if (wouldExceedWidth || wouldExceedWords) {
            lines.push(currentLine)
            currentLine = word
            wordCount = 1
          } else {
            currentLine = testLine
            wordCount++
          }
        }
        lines.push(currentLine)
        return lines
      }

      // Função para calcular altura total do texto (mesma lógica do draw)
      const calculateTextHeight = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number => {
        const paragraphs = text.split('\n').filter(p => p.trim())
        let totalLines = 0
        paragraphs.forEach((paragraph) => {
          const paraLines = wrapText(ctx, paragraph, maxWidth)
          totalLines += paraLines.length
        })
        const paragraphSpacing = (paragraphs.length - 1) * 12
        return totalLines * lineHeight + paragraphSpacing
      }

      // Função auxiliar para desenhar texto com citações bíblicas (destaca apenas a referência, não a linha)
      const drawTextWithQuotes = (ctx: CanvasRenderingContext2D, text: string, x: number, startY: number, maxWidth: number) => {
        let currentY = startY
        const paragraphs = text.split('\n').filter(p => p.trim())
        const bibleRegex = /\*\*\d?\s*[A-Z][a-záàâãéèêíïóôõöúçñ]+\s+\d+:\d+(?:-\d+)?\*\*/g
        
        paragraphs.forEach((paragraph) => {
          const paraLines = wrapText(ctx, paragraph, maxWidth)
          paraLines.forEach((line) => {
            // Verificar se a linha tem citações bíblicas
            const matches = line.match(bibleRegex)
            
            if (matches && matches.length > 0) {
              // Desenhar fundo lilás apenas para as citações
              ctx.fillStyle = colors.bibleBg
              matches.forEach((match) => {
                const beforeText = line.substring(0, line.indexOf(match))
                const beforeWidth = ctx.measureText(beforeText).width
                const matchWidth = ctx.measureText(match).width
                ctx.fillRect(x + beforeWidth - 4, currentY - 18, matchWidth + 8, 26)
              })
              
              // Desenhar a linha em partes
              let currentX = x
              let remainingText = line
              
              while (remainingText.length > 0) {
                const nextMatch = remainingText.match(bibleRegex)
                
                if (nextMatch) {
                  const matchIndex = remainingText.indexOf(nextMatch[0])
                  const beforeText = remainingText.substring(0, matchIndex)
                  const matchText = nextMatch[0]
                  
                  // Texto normal antes da citação
                  if (beforeText) {
                    ctx.fillStyle = colors.text
                    ctx.font = '16px Arial, sans-serif'
                    ctx.fillText(beforeText, currentX, currentY)
                    currentX += ctx.measureText(beforeText).width
                  }
                  
                  // Citação em roxo e negrito
                  ctx.fillStyle = colors.bibleQuote
                  ctx.font = 'bold 16px Arial, sans-serif'
                  ctx.fillText(matchText, currentX, currentY)
                  currentX += ctx.measureText(matchText).width
                  
                  remainingText = remainingText.substring(matchIndex + matchText.length)
                } else {
                  // Resto do texto normal
                  ctx.fillStyle = colors.text
                  ctx.font = '16px Arial, sans-serif'
                  ctx.fillText(remainingText, currentX, currentY)
                  break
                }
              }
            } else {
              // Linha sem citações - texto normal
              ctx.fillStyle = colors.text
              ctx.font = '16px Arial, sans-serif'
              ctx.fillText(line, x, currentY)
            }
            currentY += lineHeight
          })
          currentY += 12 // Espaço entre parágrafos
        })
        
        return currentY
      }

      // GERAR PRIMEIRA IMAGEM (Título + Metade do texto)
      const generateImage1 = async (): Promise<string | null> => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        
        // Calcular altura
        ctx.font = '16px Arial, sans-serif'
        let totalHeight = padding * 2 + 50 // Header
        
        // Card pergunta
        let questionHeight = 0
        if (userQuestion) {
          const qLines = wrapText(ctx, userQuestion, width - padding * 2 - innerPadding * 2 - 60)
          questionHeight = 60 + qLines.length * lineHeight
          totalHeight += questionHeight + 20
        }
        
        // Card resposta (parte 1) - usar função consistente de cálculo de altura
        const textWidth = width - padding * 2 - innerPadding * 2
        const textHeight1 = calculateTextHeight(ctx, contentPart1, textWidth)
        const cardHeightCalc1 = 95 + textHeight1 + 25 // 95=header do card, 25=padding inferior
        totalHeight += cardHeightCalc1 + 30
        
        // Indicador "Continua..." - maior espaço
        totalHeight += 50
        
        canvas.width = width
        canvas.height = totalHeight
        
        // Fundo
        const bgGradient = ctx.createLinearGradient(0, 0, 0, totalHeight)
        bgGradient.addColorStop(0, '#f1f5f9')
        bgGradient.addColorStop(1, '#e2e8f0')
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, width, totalHeight)
        
        // Borda externa
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.strokeRect(10, 10, width - 20, totalHeight - 20)
        
        let currentY = padding
        
        // Header
        ctx.fillStyle = colors.text
        ctx.font = 'bold 22px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(appConfig.appName || "Falando com o Profeta", width / 2, currentY + 18)
        
        ctx.strokeStyle = colors.prophetBorder
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(width / 2 - 60, currentY + 30)
        ctx.lineTo(width / 2 + 60, currentY + 30)
        ctx.stroke()
        
        currentY += 55
        
        // Card da pergunta
        if (userQuestion) {
          const cardX = padding
          const cardY = currentY
          const cardWidth = width - padding * 2
          
          ctx.fillStyle = colors.questionBg
          ctx.fillRect(cardX, cardY, cardWidth, questionHeight)
          ctx.strokeStyle = colors.questionBorder
          ctx.lineWidth = 2
          ctx.strokeRect(cardX, cardY, cardWidth, questionHeight)
          
          ctx.fillStyle = colors.questionBorder
          ctx.fillRect(cardX, cardY, 5, questionHeight)
          
          // Ícone ?
          ctx.fillStyle = colors.questionBorder
          ctx.beginPath()
          ctx.arc(cardX + innerPadding + 15, cardY + 30, 15, 0, 2 * Math.PI)
          ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 18px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('?', cardX + innerPadding + 15, cardY + 36)
          
          ctx.fillStyle = colors.text
          ctx.font = 'bold 15px Arial, sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText('PERGUNTA', cardX + innerPadding + 40, cardY + 22)
          
          const qLines = wrapText(ctx, userQuestion, cardWidth - innerPadding * 2 - 60)
          ctx.font = '16px Arial, sans-serif'
          qLines.forEach((line, index) => {
            ctx.fillText(line, cardX + innerPadding + 40, cardY + 48 + index * lineHeight)
          })
          
          currentY += questionHeight + 20
        }
        
        // Card da resposta (parte 1) - usar mesma função de cálculo
        const cardX = padding
        const cardY = currentY
        const cardWidth = width - padding * 2
        const contentWidth = cardWidth - innerPadding * 2
        const cardHeight = 95 + calculateTextHeight(ctx, contentPart1, contentWidth) + 25
        
        ctx.fillStyle = colors.background
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight)
        ctx.strokeStyle = colors.border
        ctx.lineWidth = 2
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight)
        
        ctx.fillStyle = colors.prophetBorder
        ctx.fillRect(cardX, cardY, 5, cardHeight)
        
        await drawProphetAvatar(ctx, cardX + innerPadding, cardY + 20, 45)
        
        ctx.fillStyle = colors.prophetBorder
        ctx.font = 'bold 17px Arial, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(prophetName.toUpperCase(), cardX + innerPadding + 55, cardY + 42)
        
        ctx.fillStyle = colors.textMuted
        ctx.font = '13px Arial, sans-serif'
        ctx.fillText('Respondendo em nome do Senhor', cardX + innerPadding + 55, cardY + 58)
        
        ctx.strokeStyle = colors.border
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cardX + innerPadding, cardY + 75)
        ctx.lineTo(cardX + cardWidth - innerPadding, cardY + 75)
        ctx.stroke()
        
        // Desenhar texto parte 1
        drawTextWithQuotes(ctx, contentPart1, cardX + innerPadding, cardY + 95, cardWidth - innerPadding * 2)
        
        // Indicador "Continua na próxima imagem..." - maior e mais visível
        ctx.fillStyle = colors.textMuted
        ctx.font = 'italic bold 16px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('◆◆◆  CONTINUA NA PRÓXIMA IMAGEM  ◆◆◆', width / 2, cardY + cardHeight - 20)
        
        return canvas.toDataURL('image/png', 0.95)
      }

      // GERAR SEGUNDA IMAGEM (Restante do texto + Referências)
      const generateImage2 = async (): Promise<string | null> => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        
        // Calcular altura
        ctx.font = '16px Arial, sans-serif'
        let totalHeight = padding * 2 + 50 // Header
        
        // Card resposta (parte 2) - usar função consistente
        const textWidth2 = width - padding * 2 - innerPadding * 2
        const textHeight2 = calculateTextHeight(ctx, contentPart2, textWidth2)
        const contentHeight = 95 + textHeight2 + 25
        totalHeight += contentHeight + 20
        
        // Referências
        if (references.length > 0) {
          totalHeight += 50 + references.length * 28
        }
        
        // Footer
        totalHeight += 50
        
        canvas.width = width
        canvas.height = totalHeight
        
        // Fundo
        const bgGradient = ctx.createLinearGradient(0, 0, 0, totalHeight)
        bgGradient.addColorStop(0, '#f1f5f9')
        bgGradient.addColorStop(1, '#e2e8f0')
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, width, totalHeight)
        
        // Borda externa
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.strokeRect(10, 10, width - 20, totalHeight - 20)
        
        let currentY = padding
        
        // Header (mesmo estilo)
        ctx.fillStyle = colors.text
        ctx.font = 'bold 22px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(appConfig.appName || "Falando com o Profeta", width / 2, currentY + 18)
        
        ctx.strokeStyle = colors.prophetBorder
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(width / 2 - 60, currentY + 30)
        ctx.lineTo(width / 2 + 60, currentY + 30)
        ctx.stroke()
        
        currentY += 55
        
        // Indicador "Continuação" - maior e mais visível
        ctx.fillStyle = colors.textMuted
        ctx.font = 'italic bold 16px Arial, sans-serif'
        ctx.fillText('◆◆◆  CONTINUAÇÃO  ◆◆◆', width / 2, currentY)
        currentY += 30
        
        // Card da resposta (parte 2) - usar mesma função
        const cardX = padding
        const cardY = currentY
        const cardWidth = width - padding * 2
        const contentWidth2 = cardWidth - innerPadding * 2
        let cardHeight = 95 + calculateTextHeight(ctx, contentPart2, contentWidth2) + 25
        if (references.length > 0) {
          cardHeight += 50 + references.length * 28
        }
        
        ctx.fillStyle = colors.background
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight)
        ctx.strokeStyle = colors.border
        ctx.lineWidth = 2
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight)
        
        ctx.fillStyle = colors.prophetBorder
        ctx.fillRect(cardX, cardY, 5, cardHeight)
        
        await drawProphetAvatar(ctx, cardX + innerPadding, cardY + 20, 45)
        
        ctx.fillStyle = colors.prophetBorder
        ctx.font = 'bold 17px Arial, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(prophetName.toUpperCase(), cardX + innerPadding + 55, cardY + 42)
        
        ctx.fillStyle = colors.textMuted
        ctx.font = '13px Arial, sans-serif'
        ctx.fillText('Respondendo em nome do Senhor', cardX + innerPadding + 55, cardY + 58)
        
        ctx.strokeStyle = colors.border
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cardX + innerPadding, cardY + 75)
        ctx.lineTo(cardX + cardWidth - innerPadding, cardY + 75)
        ctx.stroke()
        
        // Desenhar texto parte 2
        let textY = drawTextWithQuotes(ctx, contentPart2, cardX + innerPadding, cardY + 95, cardWidth - innerPadding * 2)
        
        // Referências
        if (references.length > 0) {
          textY += 15
          
          ctx.fillStyle = colors.textMuted
          ctx.font = 'bold 13px Arial, sans-serif'
          ctx.fillText('REFERÊNCIAS:', cardX + innerPadding, textY)
          textY += 25
          
          ctx.fillStyle = colors.reference
          ctx.font = '14px Arial, sans-serif'
          references.forEach((ref, index) => {
            ctx.fillText(`${index + 1}. ${ref}`, cardX + innerPadding + 15, textY)
            textY += 26
          })
        }
        
        currentY += cardHeight + 20
        
        // Footer
        ctx.fillStyle = colors.textMuted
        ctx.font = 'italic 14px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`Compartilhado via ${appConfig.appName || "Falando com o Profeta"}`, width / 2, currentY + 20)
        ctx.font = '12px Arial, sans-serif'
        ctx.fillText(new Date().toLocaleDateString('pt-BR'), width / 2, currentY + 38)
        
        return canvas.toDataURL('image/png', 0.95)
      }

      // Gerar ambas as imagens
      const [image1, image2] = await Promise.all([generateImage1(), generateImage2()])
      
      const images: string[] = []
      if (image1) images.push(image1)
      if (image2) images.push(image2)
      
      return images
    } catch (error) {
      console.error("Erro ao gerar imagens:", error)
      return []
    }
  }

  // Função legada para compatibilidade (retorna apenas primeira imagem)
  const generateShareImage = async (content: string, references: string[], userQuestion?: string): Promise<string | null> => {
    const images = await generateShareImages(content, references, userQuestion)
    return images[0] || null
  }

  // Abrir modal de compartilhamento
  const openShareModal = async (content: string, references: string[], userQuestion?: string) => {
    const imageUrls = await generateShareImages(content, references, userQuestion)
    setShareData({ content, references, userQuestion, imageUrls })
    setShareModalOpen(true)
  }

  // Compartilhar como texto
  const shareAsText = () => {
    if (!shareData) return
    
    const prophetName = appConfig.prophetName || "Profeta William Branham"
    let shareText = ""
    
    if (shareData.userQuestion) {
      shareText += `🤔 *Pergunta:*\n${shareData.userQuestion}\n\n`
    }
    
    shareText += `👤 *${prophetName}*\n\n`
    shareText += `${shareData.content}\n\n`
    
    if (shareData.references.length > 0) {
      shareText += `📚 *Referências:*\n`
      shareData.references.forEach((ref, index) => {
        shareText += `${index + 1}. ${ref}\n`
      })
      shareText += `\n`
    }
    
    shareText += `📱 _Compartilhado via ${appConfig.appName || "Falando com o Profeta"}_`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
    setShareModalOpen(false)
  }

  // Gerar nome do arquivo baseado na pergunta
  const generateFileName = (): string => {
    const date = new Date().toISOString().split('T')[0]
    if (shareData?.userQuestion) {
      // Pegar os primeiros 30 caracteres da pergunta e limpar caracteres especiais
      const cleanQuestion = shareData.userQuestion
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g, '')
        .replace(/\s+/g, '_')
      return `${cleanQuestion}_${date}.png`
    }
    return `mensagem_profeta_${date}.png`
  }

  // Compartilhar como imagem (baixa todas as imagens)
  const shareAsImage = async () => {
    if (!shareData?.imageUrls || shareData.imageUrls.length === 0) return
    
    try {
      const baseFileName = generateFileName().replace('.png', '')
      
      // Baixar todas as imagens em sequência
      for (let i = 0; i < shareData.imageUrls.length; i++) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        const link = document.createElement('a')
        link.href = shareData.imageUrls[i]
        link.download = `${baseFileName}_parte${i + 1}.png`
        link.click()
      }
      
      setShareModalOpen(false)
    } catch (error) {
      console.error("Erro ao baixar imagens:", error)
    }
  }

  // Compartilhar nos stories do WhatsApp (baixa todas as imagens)
  const shareAsStory = () => {
    if (!shareData?.imageUrls || shareData.imageUrls.length === 0) return
    
    const baseFileName = generateFileName().replace('.png', '')
    
    // Baixar todas as imagens
    shareData.imageUrls.forEach((url, index) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = url
        link.download = `${baseFileName}_story_parte${index + 1}.png`
        link.click()
      }, index * 500)
    })
    
    // Mostrar instruções
    alert(`Baixadas ${shareData.imageUrls.length} imagens! Adicione todas aos seus stories em sequência.`)
    setShareModalOpen(false)
  }

  // Função legada para compatibilidade
  const shareMessage = async (content: string, references: string[], userQuestion?: string) => {
    await openShareModal(content, references, userQuestion)
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
    
    // Função para extrair apenas a referência bíblica (livro capítulo:versículo) de um texto
    const extractBibleReference = (text: string): string | null => {
      // Remover asteriscos e parênteses
      const cleanText = text.replace(/\*\*/g, '').replace(/[()]/g, '').trim()
      
      // Padrão para capturar referências bíblicas: livro capítulo:versículo ou número livro capítulo:versículo
      const patterns = [
        // Formato: 1 Timóteo 2:9-10 ou Timóteo 2:9
        /(\d+\s+)?([\wáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+)\s+(\d+):(\d+(?:-\d+)?)/i,
      ]
      
      for (const pattern of patterns) {
        const match = cleanText.match(pattern)
        if (match) {
          const numero = match[1] ? match[1].trim() : ''
          const livro = match[2]
          const capitulo = match[3]
          const versiculo = match[4]
          
          if (numero) {
            return `${numero} ${livro} ${capitulo}:${versiculo}`
          }
          return `${livro} ${capitulo}:${versiculo}`
        }
      }
      
      return null
    }
    
    // Padrões para detectar versículos no texto
    const versePatterns = [
      // Formato com asteriscos: **1 Timóteo 2:9-10** ou **João 3:16**
      /\*\*(?:\d+\s+)?[\wáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+\s+\d+:\d+(?:-\d+)?\*\*/g,
      // Formato com parênteses: (Efésios 2:8-9) ou (1 Timóteo 2:9)
      /\((?:\d+\s+)?[\wáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+\s+\d+:\d+(?:-\d+)?\)/g,
    ]
    
    let verseCounter = 0
    const versesToFetch: { id: string, text: string, reference: string }[] = []
    
    versePatterns.forEach(pattern => {
      processedContent = processedContent.replace(pattern, (match) => {
        const reference = extractBibleReference(match)
        if (!reference) return match
        
        // Criar ID limpo baseado apenas no índice da mensagem e contador
        const verseId = `verse_${messageIndex}_${verseCounter++}`
        
        // Adicionar à lista para buscar se ainda não temos o texto
        versesToFetch.push({ id: verseId, text: reference, reference })
        
        // Retornar marcador com a referência (sem texto extra)
        return `{{VERSE:${verseId}:${reference}}}`
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
                      src={message.role === "user" ? (profile?.avatar_url || generateAvatarUrl(profile?.name || "", profile?.email)) : appConfig.prophetAvatar} 
                      alt={message.role === "user" ? (profile?.name || "User") : appConfig.prophetName}
                      onLoad={() => console.log(`✅ Avatar loaded for ${message.role}:`, message.role === "user" ? (profile?.avatar_url || "generated") : appConfig.prophetAvatar)}
                      onError={() => 
                        console.error(`❌ Failed to load avatar for ${message.role}:`, message.role === "user" ? (profile?.avatar_url || "generated") : appConfig.prophetAvatar)
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
                                          
                                          // Algoritmo para buscar versículo - API primeiro, depois base local
                                          if (!verseText.includes('"') && !verseTexts[verseId]) {
                                            console.log('🔍 Buscando versículo automaticamente:', verseText)
                                            
                                            // Buscar PRIMEIRO na API (fonte mais completa)
                                            console.log('🌐 Buscando na API da Bíblia...')
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
                                                  console.log('✅ Versículo encontrado na API:', foundVerse.reference)
                                                  setVerseTexts(prev => ({
                                                    ...prev,
                                                    [verseId]: fullVerseText
                                                  }))
                                                  return // Sai da função se encontrou na API
                                                }
                                              }
                                            } catch (error) {
                                              console.error('❌ Erro na API, tentando base local:', error)
                                            }
                                            
                                            // Fallback para base local apenas se API falhou
                                            console.log('🔄 Fallback: Buscando na base local...')
                                            const foundVerse = findBibleVerseDirectly(verseText)
                                            if (foundVerse) {
                                              console.log('✅ Versículo encontrado na base local:', foundVerse)
                                              setVerseTexts(prev => ({
                                                ...prev,
                                                [verseId]: `${foundVerse.reference} - "${foundVerse.text}"`
                                              }))
                                            } else {
                                              // Se não encontrou nem na API nem na base local
                                              console.log('❌ Versículo não encontrado em nenhuma fonte')
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
                                        {verseText}
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
                              onClick={async () => {
                                // Para mensagens do assistente, encontrar a pergunta anterior do usuário
                                let userQuestion = undefined
                                if (message.role === "assistant" && index > 0) {
                                  const previousMessage = messages[index - 1]
                                  if (previousMessage.role === "user") {
                                    const { cleanContent: userCleanContent } = await processMessageContent(previousMessage.content)
                                    userQuestion = userCleanContent
                                  }
                                }
                                await shareMessage(cleanContent, allReferences, userQuestion)
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
                            
                            {/* Botão Continuar Sermão - só aparece na última mensagem do assistente quando canContinueSermon é true */}
                            {canContinueSermon && message.role === "assistant" && index === messages.length - 1 && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={continueSermon}
                                disabled={isContinuing}
                                className="h-7 px-3 sm:h-8 sm:px-4 text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white"
                                title="Continuar o sermão"
                              >
                                {isContinuing ? (
                                  <>
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
                                    Continuando...
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Continuar Sermão
                                  </>
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

      {/* Modal de Compartilhamento Compacto */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-sm p-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Share2 className="w-4 h-4" />
              Compartilhar
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escolha o formato
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-2 py-2">
            {/* Opção: Compartilhar como Texto */}
            <Button
              onClick={shareAsText}
              variant="outline"
              size="sm"
              className="flex items-center justify-start gap-2 h-auto py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  Como Texto
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Formato WhatsApp
                </div>
              </div>
            </Button>

            {/* Opção: Compartilhar como Imagem */}
            <Button
              onClick={shareAsImage}
              variant="outline"
              size="sm"
              className="flex items-center justify-start gap-2 h-auto py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  Como Imagem
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Card visual
                </div>
              </div>
            </Button>

            {/* Opção: Compartilhar nos Stories */}
            <Button
              onClick={shareAsStory}
              variant="outline"
              size="sm"
              className="flex items-center justify-start gap-2 h-auto py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                <Instagram className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  Stories
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  WhatsApp Stories
                </div>
              </div>
            </Button>
          </div>

          {/* Preview das imagens (se disponíveis) - compacto */}
          {shareData?.imageUrls && shareData.imageUrls.length > 0 && (
            <div className="border rounded-lg p-2 bg-slate-50 dark:bg-slate-900">
              <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Preview ({shareData.imageUrls.length} {shareData.imageUrls.length === 1 ? 'imagem' : 'imagens'})
              </div>
              <div className={`grid ${shareData.imageUrls.length > 1 ? 'grid-cols-2 gap-2' : 'grid-cols-1'} max-h-40 overflow-y-auto`}>
                {shareData.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Preview parte ${index + 1}`}
                    className="w-full rounded max-h-32 object-contain border border-slate-200"
                  />
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareModalOpen(false)}
              className="flex-1"
            >
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareAsImage()}
              disabled={!shareData?.imageUrls || shareData.imageUrls.length === 0}
              className="flex-1"
            >
              <Download className="w-3 h-3 mr-1" />
              Salvar {shareData?.imageUrls && shareData.imageUrls.length > 1 ? `(${shareData.imageUrls.length} imgs)` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
