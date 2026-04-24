"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

// Componente para acessibilidade - esconde visualmente mas mantém para screen readers
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
)

// Função segura para copiar texto
const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback para browsers não seguros
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand("copy")
        textArea.remove()
        return true
      } catch (err) {
        console.error("Fallback copy failed:", err)
        textArea.remove()
        return false
      }
    }
  } catch (err) {
    console.error("Copy failed:", err)
    return false
  }
}
import { 
  BookMarked, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Search, 
  X,
  Home,
  ChevronDown,
  Bookmark,
  Share2,
  Type,
  Moon,
  Sun,
  Palette,
  Eye,
  Play,
  Pause,
  Volume2,
  Camera,
  MessageCircle,
  Image as ImageIcon,
  Check,
  Headphones
} from "lucide-react"
import html2canvas from "html2canvas"
import { useAppConfig } from "@/hooks/use-app-config"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Book {
  name: string
  column: string
  testament: "old" | "new"
  chapters: number
}

interface Verse {
  text: string
  verse: number
  chapter: number
}

export default function BibliaPageClient() {
  const router = useRouter()
  const { user, loading: authLoading } = useSupabaseAuth()
  const { getConfigValue } = useAppConfig()
  
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookMenu, setShowBookMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<"old" | "new">("old")
  const [searchQuery, setSearchQuery] = useState("")
  const [bookmarkedVerses, setBookmarkedVerses] = useState<number[]>([])
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium")
  const [theme, setTheme] = useState<"light" | "dark" | "sepia" | "night">("night")
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif")

  // Estados para TTS (Text-to-Speech)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentSpeakingVerse, setCurrentSpeakingVerse] = useState<number | null>(null)
  const [speechRate, setSpeechRate] = useState(1)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const supabase = createClientComponentClient()

  // Estados para seleção de texto
  const [selectedText, setSelectedText] = useState("")
  const [selectedVerses, setSelectedVerses] = useState<number[]>([])
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // Carregar preferências do localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem("bible_reader_prefs")
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs)
        if (prefs.theme) setTheme(prefs.theme)
        if (prefs.fontFamily) setFontFamily(prefs.fontFamily)
        if (prefs.fontSize) setFontSize(prefs.fontSize)
      } catch (e) {
        console.error("Erro ao carregar preferências:", e)
      }
    }
  }, [])

  // Salvar preferências no localStorage
  useEffect(() => {
    localStorage.setItem("bible_reader_prefs", JSON.stringify({
      theme,
      fontFamily,
      fontSize
    }))
  }, [theme, fontFamily, fontSize])

  const appName = getConfigValue("app_identity", {})?.appName || "Falando com o Profeta"

  // Fetch books list
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch("/api/bible?action=getBooks")
        const data = await response.json()
        if (data.success) {
          setBooks(data.books)
          // Set default book (Genesis)
          const genesis = data.books.find((b: Book) => b.column === "genesis")
          if (genesis) {
            setSelectedBook(genesis)
          }
        }
      } catch (error) {
        console.error("Error fetching books:", error)
      }
    }
    fetchBooks()
  }, [])

  // Fetch verses when book/chapter changes
  const fetchVerses = useCallback(async () => {
    if (!selectedBook) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `/api/bible?action=getVerses&book=${encodeURIComponent(selectedBook.name)}&chapter=${selectedChapter}`
      )
      const data = await response.json()
      if (data.success) {
        setVerses(data.verses)
      }
    } catch (error) {
      console.error("Error fetching verses:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedBook, selectedChapter])

  useEffect(() => {
    fetchVerses()
  }, [fetchVerses])

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/")
    }
  }, [user, authLoading, router])

  const filteredBooks = books.filter(book => {
    const matchesTab = book.testament === activeTab
    const matchesSearch = book.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1)
    } else {
      // Go to previous book
      const currentIndex = books.findIndex(b => b.column === selectedBook?.column)
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1]
        setSelectedBook(prevBook)
        setSelectedChapter(prevBook.chapters)
      }
    }
  }

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter < selectedBook.chapters) {
      setSelectedChapter(prev => prev + 1)
    } else {
      // Go to next book
      const currentIndex = books.findIndex(b => b.column === selectedBook?.column)
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1]
        setSelectedBook(nextBook)
        setSelectedChapter(1)
      }
    }
  }

  const fontSizeClasses = {
    small: "text-base",
    medium: "text-lg",
    large: "text-xl"
  }

  const themeStyles = {
    light: {
      name: "Claro",
      bg: "bg-[#FDFBF7]",
      text: "text-[#2C2416]",
      verseNum: "text-[#8B7355]",
      border: "border-[#E8E0D5]",
      header: "bg-[#FDFBF7]/95 border-[#E8E0D5]",
      card: "bg-white border-[#E8E0D5]",
      button: "bg-[#F5F0E8] hover:bg-[#EBE5DB] text-[#5C4D3C]",
      primary: "bg-[#8B7355] text-white",
      muted: "text-[#6B5B4F]",
      previewBg: "#FDFBF7",
      previewText: "#2C2416",
      previewAccent: "#8B7355",
      selectionBg: "#8B7355",
      selectionText: "#FDFBF7"
    },
    dark: {
      name: "Escuro",
      bg: "bg-[#1A1A1A]",
      text: "text-[#E8E0D5]",
      verseNum: "text-[#A89080]",
      border: "border-[#333333]",
      header: "bg-[#1A1A1A]/95 border-[#333333]",
      card: "bg-[#242424] border-[#333333]",
      button: "bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#C0B0A0]",
      primary: "bg-[#A89080] text-[#1A1A1A]",
      muted: "text-[#8B7355]",
      previewBg: "#1A1A1A",
      previewText: "#E8E0D5",
      previewAccent: "#A89080",
      selectionBg: "#A89080",
      selectionText: "#1A1A1A"
    },
    sepia: {
      name: "Sépia",
      bg: "bg-[#F4ECD8]",
      text: "text-[#5C4D3C]",
      verseNum: "text-[#8B7355]",
      border: "border-[#D4C4A8]",
      header: "bg-[#F4ECD8]/95 border-[#D4C4A8]",
      card: "bg-[#FAF3E8] border-[#D4C4A8]",
      button: "bg-[#EBE1D0] hover:bg-[#E0D4C0] text-[#5C4D3C]",
      primary: "bg-[#8B7355] text-white",
      muted: "text-[#7A6B5A]",
      previewBg: "#F4ECD8",
      previewText: "#5C4D3C",
      previewAccent: "#8B7355",
      selectionBg: "#8B7355",
      selectionText: "#F4ECD8"
    },
    night: {
      name: "Noite",
      bg: "bg-[#0D1117]",
      text: "text-[#C9D1D9]",
      verseNum: "text-[#58A6FF]",
      border: "border-[#21262D]",
      header: "bg-[#0D1117]/95 border-[#21262D]",
      card: "bg-[#161B22] border-[#21262D]",
      button: "bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9]",
      primary: "bg-[#58A6FF] text-[#0A0A0A]",
      muted: "text-[#8B949E]",
      previewBg: "#0D1117",
      previewText: "#C9D1D9",
      previewAccent: "#58A6FF",
      selectionBg: "#58A6FF",
      selectionText: "#0D1117"
    }
  }

  const currentTheme = themeStyles[theme]
  const fontClass = fontFamily === "serif" ? "font-serif" : "font-sans"

  // ========== TTS (Text-to-Speech) ==========
  const speakChapter = async () => {
    if (!selectedBook || verses.length === 0) return
    
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setCurrentSpeakingVerse(null)
      return
    }

    setIsSpeaking(true)
    
    for (let i = 0; i < verses.length; i++) {
      if (!isSpeaking) break
      
      const verse = verses[i]
      setCurrentSpeakingVerse(verse.verse)
      
      // Scroll para o versículo atual
      const verseElement = document.getElementById(`verse-${verse.verse}`)
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      
      await speakText(`${verse.verse}. ${verse.text}`)
      
      // Pausa entre versículos
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Avançar para próximo capítulo automaticamente
    if (isSpeaking && selectedBook) {
      const totalChapters = selectedBook.chapters
      if (selectedChapter < totalChapters) {
        setSelectedChapter(prev => prev + 1)
      } else {
        // Próximo livro
        const currentBookIndex = books.findIndex(b => b.column === selectedBook.column)
        const nextBook = books[currentBookIndex + 1]
        if (nextBook) {
          setSelectedBook(nextBook)
          setSelectedChapter(1)
        }
      }
    }
    
    setIsSpeaking(false)
    setCurrentSpeakingVerse(null)
  }

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "pt-BR"
      utterance.rate = speechRate
      
      // Tentar encontrar uma voz em português
      const voices = window.speechSynthesis.getVoices()
      const ptVoice = voices.find(v => v.lang.includes("pt"))
      if (ptVoice) utterance.voice = ptVoice
      
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      
      speechSynthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    })
  }

  // ========== Google Cloud TTS (opcional) ==========
  // Veja TUTORIAL_GOOGLE_TTS.md para configurar
  const speakWithGoogleTTS = async (text: string): Promise<void> => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: "pt-BR-Neural2-B", // Homem brasileiro natural
          speed: speechRate,
        }),
      })

      const data = await response.json()
      
      if (data.success && data.audioBase64) {
        // Toca o áudio gerado pelo Google TTS
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`)
        
        return new Promise((resolve) => {
          audio.onended = () => resolve()
          audio.onerror = () => {
            console.error("Erro ao tocar áudio Google TTS")
            resolve()
          }
          audio.play()
        })
      } else if (data.useFallback) {
        // Fallback para Web Speech API nativa
        console.log("Google TTS não configurado, usando Web Speech API...")
        return speakText(text)
      } else {
        throw new Error(data.error || "Erro no TTS")
      }
    } catch (error) {
      console.error("Google TTS error:", error)
      // Sempre faz fallback para Web Speech API
      return speakText(text)
    }
  }

  // Carregar vozes quando disponíveis
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  // ========== Seleção de Texto ==========
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString()
      setSelectedText(text)
      
      // Identificar versículos selecionados
      const selectedVersesList: number[] = []
      verses.forEach(verse => {
        if (text.includes(verse.text) || text.includes(String(verse.verse))) {
          selectedVersesList.push(verse.verse)
        }
      })
      setSelectedVerses(selectedVersesList)
    }
  }

  const shareAsText = () => {
    if (!selectedText && !selectedBook) return
    
    const textToShare = selectedText || verses.map(v => `${v.verse}. ${v.text}`).join("\n")
    const shareText = `📖 ${selectedBook?.name} ${selectedChapter}\n\n${textToShare}\n\nCompartilhado via ${appName}`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, "_blank")
    setShowShareSheet(false)
  }

  const generateAndShareImage = async () => {
    if (!selectedBook) return
    
    setIsGeneratingImage(true)
    
    try {
      // Criar elemento temporário para capturar
      const tempDiv = document.createElement("div")
      tempDiv.style.cssText = `
        position: fixed;
        top: -9999px;
        left: 0;
        width: 400px;
        padding: 30px;
        font-family: ${fontFamily === "serif" ? "Georgia, serif" : "system-ui, sans-serif"};
        font-size: 18px;
        line-height: 1.6;
        border-radius: 16px;
        background: ${themeStyles[theme].previewBg};
        color: ${themeStyles[theme].previewText};
        border: 2px solid ${themeStyles[theme].previewAccent};
      `
      
      const content = selectedText || verses.slice(0, 5).map(v => `<p style="margin: 0 0 12px 0;"><strong style="color: ${themeStyles[theme].previewAccent};">${v.verse}</strong> ${v.text}</p>`).join("")
      
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid ${themeStyles[theme].previewAccent};">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-bottom: 5px;">${selectedBook.name}</div>
          <div style="font-size: 24px; font-weight: bold; color: ${themeStyles[theme].previewAccent};">Capítulo ${selectedChapter}</div>
        </div>
        <div>${content}</div>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid ${themeStyles[theme].previewAccent}; text-align: center; font-size: 12px; opacity: 0.6;">
          ${appName} • NVI
        </div>
      `
      
      document.body.appendChild(tempDiv)
      
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: themeStyles[theme].previewBg,
        scale: 2
      })
      
      document.body.removeChild(tempDiv)
      
      // Converter para blob e compartilhar
      canvas.toBlob(async (blob: Blob | null) => {
        if (blob) {
          const file = new File([blob], "biblia.png", { type: "image/png" })
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${selectedBook.name} ${selectedChapter}`,
              text: `📖 ${selectedBook.name} ${selectedChapter} - Compartilhado via ${appName}`
            })
          } else {
            // Fallback: download
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${selectedBook.name}_${selectedChapter}.png`
            a.click()
            URL.revokeObjectURL(url)
          }
        }
      })
      
      setShowShareSheet(false)
    } catch (error) {
      console.error("Erro ao gerar imagem:", error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // ========== Bookmarks no Supabase ==========
  const saveBookmark = async (verseNum: number, verseText: string) => {
    if (!user || !selectedBook) return
    
    try {
      const { data: existing } = await supabase
        .from("user_bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_column", selectedBook.column)
        .eq("chapter", selectedChapter)
        .eq("verse", verseNum)
        .single()
      
      if (existing) {
        // Remover bookmark
        await supabase.from("user_bookmarks").delete().eq("id", existing.id)
        setBookmarkedVerses(prev => prev.filter(v => v !== verseNum))
      } else {
        // Adicionar bookmark
        await supabase.from("user_bookmarks").insert({
          user_id: user.id,
          book_name: selectedBook.name,
          book_column: selectedBook.column,
          chapter: selectedChapter,
          verse: verseNum,
          verse_text: verseText
        })
        setBookmarkedVerses(prev => [...prev, verseNum])
      }
    } catch (error) {
      console.error("Erro ao salvar bookmark:", error)
    }
  }

  // Carregar bookmarks ao mudar de capítulo
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!user || !selectedBook) return
      
      const { data } = await supabase
        .from("user_bookmarks")
        .select("verse")
        .eq("user_id", user.id)
        .eq("book_column", selectedBook.column)
        .eq("chapter", selectedChapter)
      
      if (data) {
        setBookmarkedVerses(data.map(b => b.verse))
      }
    }
    
    loadBookmarks()
  }, [selectedBook, selectedChapter, user, supabase])

  // ========== Toggle Bookmark (local) ==========
  const toggleBookmark = (verseNum: number) => {
    const verse = verses.find(v => v.verse === verseNum)
    if (verse) {
      saveBookmark(verseNum, verse.text)
    }
  }

  if (authLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", currentTheme.bg)}>
        <div className={cn("animate-spin rounded-full h-12 w-12 border-2 border-t-transparent", currentTheme.border)} style={{ borderTopColor: "transparent" }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-300", currentTheme.bg, currentTheme.text)}>
      {/* Estilo de seleção dinâmico baseado no tema */}
      <style>{`
        ::selection {
          background-color: ${currentTheme.selectionBg} !important;
          color: ${currentTheme.selectionText} !important;
        }
        ::-moz-selection {
          background-color: ${currentTheme.selectionBg} !important;
          color: ${currentTheme.selectionText} !important;
        }
      `}</style>
      
      {/* Header */}
      <header className={cn("border-b backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300", currentTheme.header)}>
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/welcome")}
              className={cn("h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 hover:!bg-transparent hover:opacity-80", currentTheme.button)}
            >
              <Home className={cn("h-4 w-4 sm:h-5 sm:w-5", currentTheme.text)} />
            </Button>
            
            {/* Book/Chapter Selector */}
            <Sheet open={showBookMenu} onOpenChange={setShowBookMenu}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "gap-1 sm:gap-2 font-semibold text-sm sm:text-base px-2 sm:px-3 h-8 sm:h-9 truncate hover:!bg-transparent hover:opacity-80",
                    currentTheme.card,
                    currentTheme.text,
                    currentTheme.border
                  )}
                >
                  <BookMarked className={cn("h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0", currentTheme.verseNum)} />
                  <span className="truncate">{selectedBook?.name}</span>
                  <span className="flex-shrink-0">{selectedChapter}</span>
                  <ChevronDown className={cn("h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0", currentTheme.muted)} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className={cn("w-full sm:w-96 p-0", currentTheme.bg)}>
                <SheetTitle asChild>
                  <VisuallyHidden>Livros da Bíblia</VisuallyHidden>
                </SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Book Menu Header */}
                  <div className={cn("p-4 border-b", currentTheme.border)}>
                    <h2 className={cn("text-lg font-bold mb-3", currentTheme.text)}>Livros da Bíblia</h2>
                    <div className="relative">
                      <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", currentTheme.muted)} />
                      <Input
                        placeholder="Buscar livro..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn("pl-9", currentTheme.card, currentTheme.text)}
                      />
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant={activeTab === "old" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("old")}
                        className={cn(
                          "flex-1",
                          activeTab === "old" 
                            ? currentTheme.primary 
                            : cn(currentTheme.button, "border-transparent")
                        )}
                      >
                        Antigo Test.
                      </Button>
                      <Button
                        variant={activeTab === "new" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("new")}
                        className={cn(
                          "flex-1",
                          activeTab === "new" 
                            ? currentTheme.primary 
                            : cn(currentTheme.button, "border-transparent")
                        )}
                      >
                        Novo Test.
                      </Button>
                    </div>
                  </div>

                  {/* Books List */}
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      {filteredBooks.map((book) => (
                        <button
                          key={book.column}
                          onClick={() => {
                            setSelectedBook(book)
                            setSelectedChapter(1)
                            setShowBookMenu(false)
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-lg mb-1 transition-colors",
                            selectedBook?.column === book.column
                              ? currentTheme.primary
                              : cn(currentTheme.button, "hover:opacity-80")
                          )}
                        >
                          <span className="font-medium">{book.name}</span>
                          <span className={cn("text-xs opacity-70 ml-2", selectedBook?.column === book.column ? "opacity-90" : currentTheme.muted)}>({book.chapters} cap.)</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Chapter Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevChapter}
              disabled={selectedChapter <= 1 && selectedBook?.column === "genesis"}
              className={cn("h-8 w-8 sm:h-9 sm:w-9 hover:!bg-transparent hover:opacity-80", currentTheme.button)}
            >
              <ChevronLeft className={cn("h-4 w-4 sm:h-5 sm:w-5", currentTheme.text)} />
            </Button>
            
            {/* Chapter Quick Select */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "font-semibold min-w-[50px] sm:min-w-[60px] text-sm sm:text-base px-1 sm:px-3 hover:!bg-transparent hover:opacity-80",
                    currentTheme.text
                  )}
                >
                  <span className="hidden sm:inline">Cap. </span>
                  <span className="sm:hidden">{selectedChapter}</span>
                  <span className="hidden sm:inline">{selectedChapter}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className={cn("h-[50vh]", currentTheme.bg)}>
                <SheetTitle asChild>
                  <VisuallyHidden>Selecionar Capítulo</VisuallyHidden>
                </SheetTitle>
                <div className="p-4">
                  <h3 className={cn("font-bold mb-4", currentTheme.text)}>Selecionar Capítulo - {selectedBook?.name}</h3>
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {selectedBook && Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                      <button
                        key={chapter}
                        onClick={() => setSelectedChapter(chapter)}
                        className={cn(
                          "p-2 sm:p-3 rounded-lg font-medium transition-colors",
                          selectedChapter === chapter
                            ? currentTheme.primary
                            : currentTheme.button
                        )}
                      >
                        {chapter}
                      </button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextChapter}
              disabled={selectedBook?.column === "apocalipse" && selectedChapter >= 22}
              className={cn("h-8 w-8 sm:h-9 sm:w-9 hover:!bg-transparent hover:opacity-80", currentTheme.button)}
            >
              <ChevronRight className={cn("h-4 w-4 sm:h-5 sm:w-5", currentTheme.text)} />
            </Button>
          </div>

          {/* Settings */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Botão Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={speakChapter}
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 hover:!bg-transparent hover:opacity-80",
                isSpeaking ? currentTheme.primary : currentTheme.button
              )}
              title={isSpeaking ? "Pausar leitura" : "Ouvir capítulo"}
            >
              {isSpeaking ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Headphones className={cn("h-4 w-4", currentTheme.text)} />
              )}
            </Button>

            {/* Botão Compartilhar */}
            <Sheet open={showShareSheet} onOpenChange={setShowShareSheet}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8 sm:h-9 sm:w-9 hover:!bg-transparent hover:opacity-80", currentTheme.button)}
                  title="Compartilhar"
                >
                  <Share2 className={cn("h-4 w-4", currentTheme.text)} />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className={cn("h-auto", currentTheme.bg)}>
                <SheetTitle asChild>
                  <VisuallyHidden>Compartilhar</VisuallyHidden>
                </SheetTitle>
                <div className="p-4 space-y-4">
                  <h3 className={cn("font-bold", currentTheme.text)}>Compartilhar</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Compartilhar como texto */}
                    <button
                      onClick={shareAsText}
                      className={cn(
                        "p-4 rounded-xl text-left transition-all border-2 flex flex-col items-center gap-2",
                        currentTheme.card,
                        "hover:opacity-80"
                      )}
                    >
                      <MessageCircle className={cn("h-8 w-8", currentTheme.verseNum)} />
                      <div className={cn("font-medium", currentTheme.text)}>WhatsApp</div>
                      <div className={cn("text-xs", currentTheme.muted)}>Enviar como texto</div>
                    </button>

                    {/* Compartilhar como imagem */}
                    <button
                      onClick={generateAndShareImage}
                      disabled={isGeneratingImage}
                      className={cn(
                        "p-4 rounded-xl text-left transition-all border-2 flex flex-col items-center gap-2",
                        currentTheme.card,
                        isGeneratingImage ? "opacity-50" : "hover:opacity-80"
                      )}
                    >
                      {isGeneratingImage ? (
                        <div className={cn("animate-spin rounded-full h-8 w-8 border-2 border-t-transparent", currentTheme.border)} />
                      ) : (
                        <ImageIcon className={cn("h-8 w-8", currentTheme.verseNum)} />
                      )}
                      <div className={cn("font-medium", currentTheme.text)}>Imagem</div>
                      <div className={cn("text-xs", currentTheme.muted)}>
                        {isGeneratingImage ? "Gerando..." : "Salvar/Compartilhar"}
                      </div>
                    </button>
                  </div>

                  {/* Dica de seleção */}
                  <div className={cn("text-xs p-3 rounded-lg", currentTheme.card, currentTheme.muted)}>
                    💡 Dica: Selecione um texto na Bíblia antes de compartilhar para compartilhar apenas a parte selecionada.
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFontSize(prev => 
                prev === "small" ? "medium" : prev === "medium" ? "large" : "small"
              )}
              className={cn("h-8 w-8 sm:h-9 sm:w-9 hover:!bg-transparent hover:opacity-80", currentTheme.button)}
              title="Tamanho da fonte"
            >
              <Type className={cn("h-4 w-4", currentTheme.text)} />
            </Button>
            
            {/* Theme Selector */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8 sm:h-9 sm:w-9 hover:!bg-transparent hover:opacity-80", currentTheme.button)} 
                  title="Tema"
                >
                  <Palette className={cn("h-4 w-4", currentTheme.text)} />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className={cn("h-auto", currentTheme.bg)}>
                <SheetTitle asChild>
                  <VisuallyHidden>Configurar Tema</VisuallyHidden>
                </SheetTitle>
                <div className="p-4 space-y-4">
                  <h3 className={cn("font-bold", currentTheme.text)}>Tema de Cores</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(themeStyles).map(([key, style]) => (
                      <button
                        key={key}
                        onClick={() => setTheme(key as typeof theme)}
                        className={cn(
                          "p-3 rounded-xl text-left transition-all border-2",
                          theme === key 
                            ? "ring-2 ring-offset-2 ring-primary border-primary" 
                            : "border-transparent hover:scale-[1.02]"
                        )}
                        style={{
                          backgroundColor: style.previewBg,
                          borderColor: theme === key ? style.previewAccent : "transparent"
                        }}
                      >
                        <div 
                          className="font-bold text-sm mb-1"
                          style={{ color: style.previewText }}
                        >
                          {style.name}
                        </div>
                        <div className="text-xs leading-tight" style={{ color: style.previewAccent }}>
                          <span style={{ color: style.previewAccent, fontWeight: 600 }}>1 </span>
                          <span style={{ color: style.previewText }}>
                            {key === "light" && "No princípio..."}
                            {key === "dark" && "No princípio..."}
                            {key === "sepia" && "No princípio..."}
                            {key === "night" && "No princípio..."}
                          </span>
                        </div>
                        {theme === key && (
                          <div 
                            className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-block"
                            style={{ 
                              backgroundColor: style.previewAccent,
                              color: style.previewBg
                            }}
                          >
                            ✓ Ativo
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <h3 className={cn("font-bold pt-2", currentTheme.text)}>Fonte</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFontFamily("serif")}
                      className={cn(
                        "flex-1 p-4 rounded-xl text-left transition-all border-2",
                        fontFamily === "serif" 
                          ? "ring-2 ring-offset-2 ring-primary border-primary bg-muted" 
                          : cn(currentTheme.card, "hover:opacity-80")
                      )}
                    >
                      <div className="font-serif text-2xl mb-1" style={{ color: currentTheme.previewAccent }}>Aa</div>
                      <div className={cn("font-medium font-serif", currentTheme.text)}>Serifada</div>
                      <div className={cn("text-xs", currentTheme.muted)}>Estilo tradicional de Bíblia</div>
                      {fontFamily === "serif" && (
                        <div className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-block bg-primary text-primary-foreground">
                          ✓ Ativo
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => setFontFamily("sans")}
                      className={cn(
                        "flex-1 p-4 rounded-xl text-left transition-all border-2",
                        fontFamily === "sans" 
                          ? "ring-2 ring-offset-2 ring-primary border-primary bg-muted" 
                          : cn(currentTheme.card, "hover:opacity-80")
                      )}
                    >
                      <div className="font-sans text-2xl mb-1" style={{ color: currentTheme.previewAccent }}>Aa</div>
                      <div className={cn("font-medium font-sans", currentTheme.text)}>Sem serifa</div>
                      <div className={cn("text-xs", currentTheme.muted)}>Estilo moderno e limpo</div>
                      {fontFamily === "sans" && (
                        <div className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-block bg-primary text-primary-foreground">
                          ✓ Ativo
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Bible Content */}
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)]">
          <div className="max-w-3xl mx-auto p-3 sm:p-4 md:p-8">
            {/* Book Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              key={`${selectedBook?.column}-${selectedChapter}`}
              className="text-center mb-6 sm:mb-8"
            >
              <h1 className={cn("text-xl sm:text-2xl md:text-3xl font-bold", currentTheme.text)}>
                {selectedBook?.name}
              </h1>
              <p className={cn("text-base sm:text-lg mt-1", currentTheme.muted)}>Capítulo {selectedChapter}</p>
            </motion.div>

            {/* Verses */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <div className={cn("animate-spin rounded-full h-8 w-8 border-2 border-t-transparent", currentTheme.border)} style={{ borderTopColor: "transparent" }} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn("space-y-2 sm:space-y-4", fontSizeClasses[fontSize], fontClass)}
                >
                  {verses.map((verse, index) => (
                    <motion.div
                      id={`verse-${verse.verse}`}
                      key={`${verse.chapter}-${verse.verse}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "group flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors",
                        bookmarkedVerses.includes(verse.verse) && "bg-primary/20",
                        currentSpeakingVerse === verse.verse && "ring-2 ring-primary bg-primary/10"
                      )}
                    >
                      <span className={cn("font-bold text-xs sm:text-sm mt-0.5 sm:mt-1 min-w-[20px] sm:min-w-[28px]", currentTheme.verseNum)}>
                        {verse.verse}
                      </span>
                      <p 
                        className={cn("flex-1 leading-relaxed", currentTheme.text)}
                        onMouseUp={handleTextSelection}
                      >
                        {verse.text}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-7 w-7 sm:h-8 sm:w-8 hover:!bg-transparent hover:opacity-80", currentTheme.button)}
                          onClick={() => toggleBookmark(verse.verse)}
                        >
                          <Bookmark 
                            className={cn(
                              "h-3.5 w-3.5 sm:h-4 sm:w-4",
                              bookmarkedVerses.includes(verse.verse) 
                                ? "fill-primary text-primary" 
                                : currentTheme.text
                            )} 
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-7 w-7 sm:h-8 sm:w-8 hover:!bg-transparent hover:opacity-80", currentTheme.button)}
                          onClick={async () => {
                            const text = `${selectedBook?.name} ${selectedChapter}:${verse.verse} - "${verse.text}"`
                            await copyToClipboard(text)
                          }}
                        >
                          <Share2 className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", currentTheme.text)} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chapter Navigation Bottom */}
            <div className={cn("flex items-center justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t", currentTheme.border)}>
              <Button
                variant="outline"
                onClick={handlePrevChapter}
                disabled={selectedChapter <= 1 && selectedBook?.column === "genesis"}
                className={cn(
                  "gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 hover:!bg-transparent hover:opacity-80",
                  currentTheme.card,
                  currentTheme.text,
                  currentTheme.border
                )}
              >
                <ChevronLeft className={cn("h-4 w-4", currentTheme.text)} />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              
              <span className={cn("text-xs sm:text-sm", currentTheme.muted)}>
                {selectedBook?.name} {selectedChapter}
              </span>
              
              <Button
                variant="outline"
                onClick={handleNextChapter}
                disabled={selectedBook?.column === "apocalipse" && selectedChapter >= 22}
                className={cn(
                  "gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 hover:!bg-transparent hover:opacity-80",
                  currentTheme.card,
                  currentTheme.text,
                  currentTheme.border
                )}
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className={cn("h-4 w-4", currentTheme.text)} />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </main>

      {/* Footer */}
      <footer className={cn("border-t p-3 text-center text-xs", currentTheme.border, currentTheme.bg, currentTheme.muted)}>
        Nova Versão Internacional (NVI) • {appName}
      </footer>
    </div>
  )
}
