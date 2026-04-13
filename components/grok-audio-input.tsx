"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, X, Check, Paperclip, ChevronDown } from "lucide-react"

interface GrokAudioInputProps {
  onSendMessage?: (text: string) => void
  onSendAudio?: (audioBlob: Blob) => void
  onCancelRecording?: () => void
  placeholder?: string
  disabled?: boolean
}

export function GrokAudioInput({
  onSendMessage,
  onSendAudio,
  onCancelRecording,
  placeholder = "Pergunte qualquer coisa",
  disabled = false
}: GrokAudioInputProps) {
  const [inputText, setInputText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(3))
  const [showExpertMenu, setShowExpertMenu] = useState(false)
  const [expertMode, setExpertMode] = useState("Expert")
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number>()
  const recordingIntervalRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Animação das barrinhas de áudio
  useEffect(() => {
    if (isRecording) {
      const animate = () => {
        setAudioLevels(prev => 
          prev.map(() => Math.random() * 20 + 3)
        )
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setAudioLevels(Array(20).fill(3))
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRecording])

  // Timer de gravação
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      setRecordingTime(0)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        onSendAudio?.(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error)
      alert("Não foi possível acessar o microfone. Verifique as permissões.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      // Não envia o áudio - descarta
      audioChunksRef.current = []
      setIsRecording(false)
      onCancelRecording?.()
    }
  }

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage?.(inputText)
      setInputText("")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Container principal estilo Grok */}
      <div className="relative flex items-center gap-2 px-4 py-3 bg-zinc-900/90 backdrop-blur-sm rounded-full border border-zinc-800 shadow-2xl">
        
        {/* Botão de anexar (paperclip) */}
        <button
          className="flex-shrink-0 p-2 text-zinc-400 hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-800/50"
          title="Anexar arquivo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input de texto */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={isRecording ? "" : placeholder}
          disabled={disabled || isRecording}
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-base outline-none min-w-0 disabled:cursor-not-allowed"
        />

        {/* Seletor Expert */}
        <div className="relative">
          <button
            onClick={() => setShowExpertMenu(!showExpertMenu)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-all"
          >
            {expertMode}
            <ChevronDown className={`w-4 h-4 transition-transform ${showExpertMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Menu dropdown */}
          {showExpertMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
              {["Expert", "Default", "Creative"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setExpertMode(mode)
                    setShowExpertMenu(false)
                  }}
                  className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                    expertMode === mode
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Área de controle de áudio / enviar */}
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <>
              {/* Botão de microfone (inicia gravação) */}
              <button
                onClick={startRecording}
                disabled={disabled}
                className="flex-shrink-0 p-2.5 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Gravar áudio"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Botão de enviar (só aparece se tem texto) */}
              {inputText.trim() && (
                <button
                  onClick={handleSend}
                  disabled={disabled}
                  className="flex-shrink-0 p-2.5 text-zinc-900 bg-white hover:bg-zinc-200 rounded-full transition-all disabled:opacity-50"
                  title="Enviar mensagem"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            /* Interface de gravação ativa */
            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-800/80 rounded-full">
              {/* Timer */}
              <span className="text-sm font-medium text-zinc-300 tabular-nums">
                {formatTime(recordingTime)}
              </span>

              {/* Barrinhas animadas de áudio */}
              <div className="flex items-center gap-0.5 h-6">
                {audioLevels.map((level, index) => (
                  <div
                    key={index}
                    className="w-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${level}px`,
                      animationDelay: `${index * 0.05}s`
                    }}
                  />
                ))}
              </div>

              {/* Botão cancelar */}
              <button
                onClick={cancelRecording}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 rounded-full transition-all"
                title="Cancelar gravação"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Botão enviar áudio */}
              <button
                onClick={stopRecording}
                className="p-2 text-zinc-900 bg-white hover:bg-zinc-200 rounded-full transition-all"
                title="Enviar áudio"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside para fechar menu */}
      {showExpertMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExpertMenu(false)}
        />
      )}
    </div>
  )
}
