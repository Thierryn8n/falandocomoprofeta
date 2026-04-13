"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, X, Check, Paperclip, ChevronDown } from "lucide-react"

interface GrokAudioInputProps {
  onSendMessage?: (text: string, responseLength?: "short" | "medium" | "long") => void
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
  const [showLengthMenu, setShowLengthMenu] = useState(false)
  const [responseLength, setResponseLength] = useState<"short" | "medium" | "long">("medium")
  
  const lengthLabels = {
    short: "Sermão pequeno",
    medium: "Sermão médio", 
    long: "Sermão longo"
  }
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number>()
  const recordingIntervalRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const isCancelledRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)

  // Animação das barrinhas de áudio - otimizada para não travar
  useEffect(() => {
    if (isRecording && analyserRef.current && dataArrayRef.current) {
      let frameCount = 0
      
      const animate = () => {
        if (!analyserRef.current || !dataArrayRef.current) return
        
        // Atualiza a cada 2 frames para melhorar performance
        frameCount++
        if (frameCount % 2 !== 0) {
          animationFrameRef.current = requestAnimationFrame(animate)
          return
        }
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
        
        // Divide o array de frequências em 20 segmentos
        const levels = []
        const step = Math.floor(dataArrayRef.current.length / 20)
        
        for (let i = 0; i < 20; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) {
            sum += dataArrayRef.current[i * step + j]
          }
          const average = sum / step
          // Mapeia 0-255 para 3-25 pixels de altura
          const height = Math.max(3, Math.min(25, (average / 255) * 25))
          levels.push(height)
        }
        
        setAudioLevels(levels)
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
      // Reset flag de cancelamento
      isCancelledRef.current = false
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Configurar Web Audio API para análise do microfone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      source.connect(analyser)
      
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceRef.current = source
      dataArrayRef.current = dataArray
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Só envia se NÃO foi cancelado
        if (!isCancelledRef.current && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
          onSendAudio?.(audioBlob)
        }
        
        // Limpar Web Audio API e stream
        audioContextRef.current?.close()
        streamRef.current?.getTracks().forEach(track => track.stop())
        
        // Limpar refs
        audioChunksRef.current = []
        streamRef.current = null
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
      isCancelledRef.current = false
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true
      mediaRecorderRef.current.stop()
      audioContextRef.current?.close()
      streamRef.current?.getTracks().forEach(track => track.stop())
      
      // Limpar tudo
      audioChunksRef.current = []
      streamRef.current = null
      setIsRecording(false)
      onCancelRecording?.()
    }
  }

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage?.(inputText, responseLength)
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
      {/* Container principal - adapta para tema claro/escuro */}
      <div className="relative flex items-center gap-2 px-4 py-3 bg-background/90 backdrop-blur-sm rounded-full border border-border shadow-2xl dark:bg-slate-900/90 dark:border-slate-800">
        
        {/* Botão de anexar (paperclip) */}
        <button
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
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
          className="flex-1 bg-transparent text-foreground placeholder-muted-foreground text-base outline-none min-w-0 disabled:cursor-not-allowed"
        />

        {/* Seletor de Tamanho da Resposta */}
        <div className="relative">
          <button
            onClick={() => setShowLengthMenu(!showLengthMenu)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-accent hover:bg-accent/80 rounded-full transition-all"
            title="Tamanho da resposta"
          >
            {lengthLabels[responseLength]}
            <ChevronDown className={`w-4 h-4 transition-transform ${showLengthMenu ? "rotate-180" : ""}`} />
          </button>

          {/* Menu dropdown de tamanho */}
          {showLengthMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden dark:bg-slate-900 dark:border-slate-800 z-50">
              {(["short", "medium", "long"] as const).map((length) => (
                <button
                  key={length}
                  onClick={() => {
                    setResponseLength(length)
                    setShowLengthMenu(false)
                  }}
                  className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                    responseLength === length
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <span className="font-medium">{lengthLabels[length]}</span>
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
                className="flex-shrink-0 p-2.5 text-muted-foreground hover:text-foreground bg-accent hover:bg-accent/80 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Gravar áudio"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Botão de enviar (só aparece se tem texto) */}
              {inputText.trim() && (
                <button
                  onClick={handleSend}
                  disabled={disabled}
                  className="flex-shrink-0 p-2.5 text-primary-foreground bg-primary hover:bg-primary/90 rounded-full transition-all disabled:opacity-50"
                  title="Enviar mensagem"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            /* Interface de gravação ativa */
            <div className="flex items-center gap-3 px-3 py-1.5 bg-accent/80 rounded-full dark:bg-slate-800/80">
              {/* Timer */}
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatTime(recordingTime)}
              </span>

              {/* Barrinhas animadas de áudio - com gradiente que funciona em ambos temas */}
              <div className="flex items-center gap-0.5 h-6">
                {audioLevels.map((level, index) => (
                  <div
                    key={index}
                    className="w-1 rounded-full transition-all duration-75 bg-gradient-to-t from-primary to-primary/60 dark:from-emerald-500 dark:to-emerald-400"
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
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-accent rounded-full transition-all"
                title="Cancelar gravação"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Botão enviar áudio */}
              <button
                onClick={stopRecording}
                className="p-2 text-primary-foreground bg-primary hover:bg-primary/90 rounded-full transition-all"
                title="Enviar áudio"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside para fechar menu */}
      {showLengthMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLengthMenu(false)}
        />
      )}
    </div>
  )
}
