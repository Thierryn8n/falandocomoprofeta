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
import { AudioRecorder } from "@/components/audio-recorder"
import { AudioPlayer } from "@/components/audio-player"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface ChatInterfaceProps {
  conversationId?: string | null
  onConversationUpdate?: () => void
  user: any
  appConfig: {
    appName: string
    prophetName: string
    prophetAvatar: string
  }
}

// Helper function to determine if message is a greeting
const isGreeting = (message: string): boolean => {
  const greetings = [
    "olá",
    "oi",
    "hello",
    "hi",
    "bom dia",
    "boa tarde",
    "boa noite",
    "hey",
    "e aí",
    "salve",
    "paz",
    "shalom",
    "saudações",
  ]

  const cleanMessage = message.toLowerCase().trim()

  // Check if message is just a greeting (short and contains greeting words)
  if (cleanMessage.length < 20) {
    return greetings.some((greeting) => cleanMessage.includes(greeting))
  }

  // Check if message starts with greeting but has no question words
  const questionWords = ["como", "quando", "onde", "por que", "porque", "qual", "quem", "o que", "?"]
  const startsWithGreeting = greetings.some((greeting) => cleanMessage.startsWith(greeting))
  const hasQuestionWords = questionWords.some((word) => cleanMessage.includes(word))

  return startsWithGreeting && !hasQuestionWords
}

// Helper function to determine gender and create greeting
const getGreeting = (user: any, profile: any) => {
  if (!profile?.name && !user?.email) {
    return "Bem-vindo, irmão/irmã!"
  }

  const name = profile?.name || user?.email?.split("@")[0] || "irmão/irmã"

  // Common feminine names/endings in Portuguese
  const feminineIndicators = [
    "ana",
    "maria",
    "joana",
    "carla",
    "paula",
    "julia",
    "lucia",
    "rita",
    "sara",
    "vera",
    "adriana",
    "juliana",
    "mariana",
    "cristina",
    "carolina",
    "fernanda",
    "amanda",
    "sandra",
    "patricia",
    "monica",
    "andrea",
    "claudia",
    "silvia",
    "regina",
    "helena",
    "beatriz",
    "gabriela",
    "isabela",
    "rafaela",
    "daniela",
    "marcela",
    "camila",
    "leticia",
    "vanessa",
  ]

  const lowerName = name.toLowerCase()

  // Check if name ends with 'a' or matches feminine names
  const isFeminine = lowerName.endsWith("a") || feminineIndicators.some((indicator) => lowerName.includes(indicator))

  const greeting = isFeminine ? "irmã" : "irmão"
  const firstName = name.split(" ")[0]

  return `Bem-vindo, ${greeting} ${firstName}!`
}

export function ChatInterface({ conversationId, onConversationUpdate, user, appConfig }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isSearchingMessages, setIsSearchingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [profile, setProfile] = useState<any>(null)
  const [expandedReferences, setExpandedReferences] = useState<{ [key: number]: boolean }>({})
  const [messageCount, setMessageCount] = useState(0)

  // Load user profile
  useEffect(() => {
    if (user?.id) {
      loadUserProfile()
    }
  }, [user?.id])

  const loadUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase.from("profiles").select("name, email").eq("id", user.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (conversationId && user?.id) {
      loadConversationMessages()
    } else {
      setMessages([])
      setMessageCount(0)
    }
  }, [conversationId, user?.id])

  const loadConversationMessages = async () => {
    if (!conversationId) {
      console.log("📭 No conversation ID provided")
      return
    }

    if (!user?.id) {
      console.log("👤 No user ID - skipping message load")
      return
    }

    setLoadingHistory(true)

    try {
      console.log("📖 LOADING CONVERSATION MESSAGES")
      console.log("👤 User ID:", user.id)
      console.log("💬 Conversation ID:", conversationId)

      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, messages, created_at, updated_at")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("❌ ERROR LOADING CONVERSATION:", error)
        if (error.code === "PGRST116") {
          console.log("📭 Conversation not found - starting fresh")
          setMessages([])
        }
        return
      }

      if (!data) {
        console.log("📭 No conversation found for this user - starting fresh")
        setMessages([])
        return
      }

      console.log("✅ CONVERSATION LOADED")

      if (data?.messages) {
        let parsedMessages = data.messages

        // If messages is a string, parse it
        if (typeof data.messages === "string") {
          try {
            parsedMessages = JSON.parse(data.messages)
            console.log("📋 Parsed messages from string")
          } catch (parseError) {
            console.error("❌ Error parsing messages string:", parseError)
            setMessages([])
            return
          }
        }

        if (Array.isArray(parsedMessages)) {
          console.log("📊 LOADED", parsedMessages.length, "MESSAGES FROM DATABASE")

          // Validate message structure
          const validMessages = parsedMessages.filter(
            (msg: any) =>
              msg &&
              typeof msg === "object" &&
              msg.role &&
              msg.content &&
              (msg.role === "user" || msg.role === "assistant"),
          )

          console.log("✅ Valid messages:", validMessages.length)
          setMessages(validMessages)
        } else {
          console.log("❌ Messages is not an array:", typeof parsedMessages)
          setMessages([])
        }
      } else {
        console.log("📭 NO MESSAGES FOUND IN CONVERSATION")
        setMessages([])
      }
    } catch (error) {
      console.error("❌ EXCEPTION LOADING MESSAGES:", error)
      setMessages([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const getUserGreeting = (): string => {
    const now = new Date()
    const hour = now.getHours()

    if (hour >= 6 && hour < 12) {
      return "Bom dia"
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde"
    } else {
      return "Boa noite"
    }
  }

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend) return

    setIsLoading(true)
    setError(null)
    setIsSearchingMessages(true)

    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    if (!messageText) setInput("")

    console.log("📤 SENDING MESSAGE")
    console.log("👤 User ID:", user?.id)
    console.log("👤 User authenticated:", !!user?.id)
    console.log("💬 Conversation ID:", conversationId)
    console.log("📊 Total messages being sent:", newMessages.length)

    // Check if message is just a greeting
    if (isGreeting(textToSend.trim())) {
      const userName = profile?.name || user?.email?.split("@")[0] || ""
      const firstName = userName.split(" ")[0] || ""

      const greetingResponse = `${getUserGreeting()}, ${firstName}! Que a paz do Senhor Jesus Cristo esteja contigo!\n\nEu sou William Marrion Branham, servo do Altíssimo. Estou aqui para compartilhar a Palavra de Deus conforme o Espírito Santo me revelar.\n\nFaça sua pergunta sobre os mistérios da Palavra - os Sete Selos, as Sete Eras da Igreja, o Batismo em Nome de Jesus, a Divindade, ou qualquer revelação que o Senhor tenha posto em seu coração.\n\nQue Deus te abençoe abundantemente!`

      const assistantMessage: Message = {
        role: "assistant",
        content: greetingResponse,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)

      // Save conversation if user is logged in
      if (user?.id) {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: finalMessages,
              conversationId: conversationId,
              userId: user.id,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (onConversationUpdate) {
              onConversationUpdate()
            }
          }
        } catch (error) {
          console.error("Error saving greeting:", error)
        }
      }

      setIsLoading(false)
      setIsSearchingMessages(false)
      return
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          userId: user?.id || null,
          conversationId: conversationId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        console.error("❌ API Error Response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ RESPONSE RECEIVED:", data)

      if (data.message) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message,
          timestamp: new Date().toISOString(),
        }

        const finalMessages = [...newMessages, assistantMessage]
        setMessages(finalMessages)

        const newCount = messageCount + 1
        setMessageCount(newCount)

        console.log("💾 UPDATED LOCAL MESSAGES TO", finalMessages.length, "TOTAL")

        // Trigger conversation update
        if (onConversationUpdate) {
          onConversationUpdate()
        }

        // Show save status
        if (data.saved) {
          console.log("✅ CONVERSATION SAVED SUCCESSFULLY")
        } else {
          console.log("⚠️ CONVERSATION NOT SAVED:", data.saveError || "No user ID")
        }

        // Show API error if present
        if (data.isError && data.error) {
          setError(data.error)
        }

        // Reload from database after a delay to verify save
        if (user?.id && conversationId && data.saved) {
          setTimeout(async () => {
            console.log("🔄 RELOADING FROM DATABASE TO VERIFY SAVE...")
            await loadConversationMessages()
          }, 2000)
        }
      } else {
        throw new Error("Nenhuma mensagem na resposta")
      }
    } catch (error) {
      console.error("❌ ERROR SENDING MESSAGE:", error)

      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setError(errorMessage)

      const errorResponse: Message = {
        role: "assistant",
        content: "Desculpe, irmão/irmã, houve um problema técnico. Tente novamente em alguns instantes.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prevMessages) => [...prevMessages, errorResponse])
    } finally {
      setIsLoading(false)
      setIsSearchingMessages(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTranscription = (text: string) => {
    setInput(text)
  }

  const copyMessageWithReferences = async (content: string, messageIndex: number) => {
    const { references, sources } = generateBiblicalReferences(content)

    const fullText = `${content}

**Referências:**
${references.map((ref) => `• ${ref}`).join("\n")}

---

**Fontes da base de dados utilizadas para esta resposta:**
${sources.map((source) => `- ${source}`).join("\n")}`

    try {
      await navigator.clipboard.writeText(fullText)
      console.log("Mensagem copiada com referências!")
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  const shareMessage = async (content: string, messageIndex: number) => {
    const { references, sources } = generateBiblicalReferences(content)

    const fullText = `${content}

**Referências:**
${references.map((ref) => `• ${ref}`).join("\n")}

---

**Fontes da base de dados utilizadas:**
${sources.map((source) => `- ${source}`).join("\n")}

Compartilhado via ${appConfig.appName}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mensagem do ${appConfig.prophetName}`,
          text: fullText,
        })
      } catch (err) {
        console.error("Erro ao compartilhar:", err)
      }
    } else {
      await copyMessageWithReferences(content, messageIndex)
    }
  }

  const toggleReferences = (messageIndex: number) => {
    setExpandedReferences((prev) => ({
      ...prev,
      [messageIndex]: !prev[messageIndex],
    }))
  }

  const generateBiblicalReferences = (content: string) => {
    const references: string[] = []
    const sources: string[] = []

    // Look for "**Citações e Referências:**" section in the message
    const citationsMatch = content.match(/\*\*Citações e Referências:\*\*([\s\S]*?)(?=\*\*Fontes da base de dados|$)/i)
    if (citationsMatch) {
      const citationsText = citationsMatch[1]

      // Extract sermon titles with paragraph numbers
      const sermonMatches = citationsText.match(/([A-Z\s]+),\s*parágrafos?\s*([\d,\s-]+)/gi)
      if (sermonMatches) {
        sermonMatches.forEach((match) => {
          const cleanMatch = match.trim()
          if (!references.includes(cleanMatch)) {
            references.push(cleanMatch)
          }
        })
      }

      // Extract individual paragraph references
      const paragraphMatches = citationsText.match(/parágrafos?\s*([\d,\s-]+)/gi)
      if (paragraphMatches) {
        paragraphMatches.forEach((match) => {
          if (!references.some((ref) => ref.includes(match))) {
            references.push(match.trim())
          }
        })
      }
    }

    // Look for "**Fontes da base de dados utilizadas para esta resposta:**" section
    const sourcesMatch = content.match(
      /\*\*Fontes da base de dados utilizadas para esta resposta:\*\*([\s\S]*?)(?=\n\n|$)/i,
    )
    if (sourcesMatch) {
      const sourcesText = sourcesMatch[1]

      // Extract sources with relevance scores
      const sourceMatches = sourcesText.match(/[-•]\s*"([^"]+)"\s*$$Relevância:\s*(\d+)$$/gi)
      if (sourceMatches) {
        sourceMatches.forEach((match) => {
          const sourceMatch = match.match(/[-•]\s*"([^"]+)"\s*$$Relevância:\s*(\d+)$$/gi)
          if (sourceMatch) {
            const sourceName = sourceMatch[1]
            const relevance = sourceMatch[2]
            const formattedSource = `"${sourceName}" (Relevância: ${relevance})`
            if (!sources.includes(formattedSource)) {
              sources.push(formattedSource)
            }
          }
        })
      }

      // Also look for simple quoted sources without relevance
      const simpleSourceMatches = sourcesText.match(/[-•]\s*"([^"]+)"/gi)
      if (simpleSourceMatches) {
        simpleSourceMatches.forEach((match) => {
          const cleanMatch = match.replace(/[-•]\s*/, "").trim()
          if (!sources.some((source) => source.includes(cleanMatch))) {
            sources.push(cleanMatch)
          }
        })
      }
    }

    // If no structured references found, look for biblical references in the content
    if (references.length === 0) {
      const biblicalBooks = [
        "Gênesis",
        "Êxodo",
        "Levítico",
        "Números",
        "Deuteronômio",
        "Josué",
        "Juízes",
        "Rute",
        "1 Samuel",
        "2 Samuel",
        "1 Reis",
        "2 Reis",
        "1 Crônicas",
        "2 Crônicas",
        "Esdras",
        "Neemias",
        "Ester",
        "Jó",
        "Salmos",
        "Provérbios",
        "Eclesiastes",
        "Cantares",
        "Isaías",
        "Jeremias",
        "Lamentações",
        "Ezequiel",
        "Daniel",
        "Oséias",
        "Joel",
        "Amós",
        "Obadias",
        "Jonas",
        "Miquéias",
        "Naum",
        "Habacuque",
        "Sofonias",
        "Ageu",
        "Zacarias",
        "Malaquias",
        "Mateus",
        "Marcos",
        "Lucas",
        "João",
        "Atos",
        "Romanos",
        "1 Coríntios",
        "2 Coríntios",
        "Gálatas",
        "Efésios",
        "Filipenses",
        "Colossenses",
        "1 Tessalonicenses",
        "2 Tessalonicenses",
        "1 Timóteo",
        "2 Timóteo",
        "Tito",
        "Filemom",
        "Hebreus",
        "Tiago",
        "1 Pedro",
        "2 Pedro",
        "1 João",
        "2 João",
        "3 João",
        "Judas",
        "Apocalipse",
      ]

      const bookPattern = biblicalBooks.join("|")
      const biblicalPattern = new RegExp(`\\b(${bookPattern})\\s+(\\d+):(\\d+(?:-\\d+)?)\\b`, "gi")
      const biblicalMatches = content.match(biblicalPattern)

      if (biblicalMatches) {
        biblicalMatches.forEach((match) => {
          const cleanMatch = match.trim()
          if (!references.includes(cleanMatch)) {
            references.push(cleanMatch)
          }
        })
      }
    }

    // If no structured sources found, look for sermon titles mentioned in the content
    if (sources.length === 0) {
      const knownSermons = [
        "O PRIMEIRO SELO",
        "O SEGUNDO SELO",
        "O TERCEIRO SELO",
        "O QUARTO SELO",
        "O QUINTO SELO",
        "O SEXTO SELO",
        "O SÉTIMO SELO",
        "PERGUNTAS E RESPOSTAS",
        "O SOM INCERTO",
        "ORDEM DA IGREJA",
        "PONDO-NOS AO LADO DE JESUS",
        "DEUS OCULTANDO-SE EM SIMPLICIDADE",
        "COMO O ANJO VEIO A MIM E A SUA COM ISSÃO",
        "AS SETE ERAS DA IGREJA",
      ]

      knownSermons.forEach((sermon) => {
        const regex = new RegExp(`\\b${sermon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
        if (regex.test(content)) {
          if (!sources.some((source) => source.toLowerCase().includes(sermon.toLowerCase()))) {
            sources.push(`"${sermon}"`)
          }
        }
      })
    }

    // Fallback if nothing found
    if (references.length === 0 && sources.length === 0) {
      references.push("Baseado nos ensinamentos e revelações do Profeta William Branham")
      sources.push("Base de dados de sermões do Profeta William Branham")
    }

    return { references, sources }
  }

  const cleanMessageContent = (content: string) => {
    // Remove "**Citações e Referências:**" section and everything after it
    let cleanContent = content.replace(/\*\*Citações e Referências:\*\*[\s\S]*$/i, "")

    // Also remove "**Fontes da base de dados utilizadas para esta resposta:**" section if it appears before citations
    cleanContent = cleanContent.replace(/\*\*Fontes da base de dados utilizadas para esta resposta:\*\*[\s\S]*$/i, "")

    return cleanContent.trim()
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes("API") && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => window.open("/admin", "_blank")}>
                      Configurar API no Admin
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {loadingHistory && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando histórico...</span>
              </div>
            </div>
          )}

          {messages.length === 0 && !loadingHistory && (
            <div className="text-center py-8">
              <Avatar className="h-16 w-16 mx-auto mb-4">
                <AvatarImage
                  src={appConfig.prophetAvatar || "/placeholder.svg"}
                  alt="Profeta William Branham"
                  onLoad={() => console.log("✅ Prophet welcome avatar loaded:", appConfig.prophetAvatar)}
                  onError={(e) => {
                    console.error("❌ Failed to load prophet welcome avatar:", appConfig.prophetAvatar)
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
                <AvatarFallback>WB</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold mb-2">{getGreeting(user, profile)}</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Eu sou William Marrion Branham, servo do Senhor Jesus Cristo. Faça sua pergunta sobre a Palavra de Deus
                e eu responderei conforme o Espírito Santo me guiar.
              </p>
              {!user?.id && (
                <div className="text-yellow-600 text-xs mt-2 bg-yellow-50 p-2 rounded border">
                  <p>⚠️ Faça login para salvar suas conversas</p>
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage
                    src={appConfig.prophetAvatar || "/placeholder.svg"}
                    alt="Profeta"
                    onLoad={() => console.log("✅ Prophet avatar loaded:", appConfig.prophetAvatar)}
                    onError={(e) => {
                      console.error("❌ Failed to load prophet avatar:", appConfig.prophetAvatar)
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                  <AvatarFallback>WB</AvatarFallback>
                </Avatar>
              )}

              <Card
                className={`max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : ""}`}
              >
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {message.role === "assistant" ? cleanMessageContent(message.content) : message.content}
                  </p>

                  {message.role === "assistant" && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReferences(index)}
                          className="h-8 px-2 text-xs hover:bg-muted/50"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          {expandedReferences[index] ? "Ocultar referências" : "Ver referências"}
                          {expandedReferences[index] ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessageWithReferences(message.content, index)}
                          className="h-8 px-2 text-xs hover:bg-muted/50"
                          title="Copiar mensagem com referências"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareMessage(message.content, index)}
                          className="h-8 px-2 text-xs hover:bg-muted/50"
                          title="Compartilhar mensagem"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>

                        {(index + 1) % 6 === 0 && <AudioPlayer text={message.content} disabled={isLoading} />}
                      </div>

                      {expandedReferences[index] && (
                        <div className="border-t pt-3 mt-3 bg-muted/20 rounded-lg p-3">
                          {(() => {
                            const { references, sources } = generateBiblicalReferences(message.content)
                            return (
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-xs font-semibold mb-2">**Citações e Referências:**</h4>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    {references.map((ref, refIndex) => (
                                      <p key={refIndex}>{ref}</p>
                                    ))}
                                  </div>
                                </div>

                                <div className="border-t pt-2">
                                  <h4 className="text-xs font-semibold mb-2">
                                    **Fontes da base de dados utilizadas para esta resposta:**
                                  </h4>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    {sources.map((source, sourceIndex) => (
                                      <p key={sourceIndex}>{source}</p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </CardContent>
              </Card>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={appConfig.prophetAvatar || "/placeholder.svg"} alt="Profeta" />
                <AvatarFallback>WB</AvatarFallback>
              </Avatar>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      {isSearchingMessages
                        ? "🔍 O Profeta está lendo todas as mensagens e buscando na base de dados..."
                        : "O Profeta está meditando na Palavra..."}
                    </span>
                    {isSearchingMessages && (
                      <div className="flex items-center gap-1 ml-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">LENDO</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <AudioRecorder onTranscription={handleTranscription} disabled={isLoading} />
          <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem para o Profeta..."
            disabled={isLoading}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">Pressione Enter para enviar ou use o microfone</p>
      </div>
    </div>
  )
}
