"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Loader2 } from "lucide-react"

interface WhatsAppAudioPlayerProps {
  audioUrl: string
  disabled?: boolean
  duration?: number
}

export function WhatsAppAudioPlayer({ audioUrl, disabled, duration }: WhatsAppAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Gerar dados de waveform simulados (em uma implementação real, você extrairia do áudio)
  useEffect(() => {
    const generateWaveform = () => {
      const data = []
      for (let i = 0; i < 40; i++) {
        data.push(Math.random() * 0.8 + 0.2) // Valores entre 0.2 e 1.0
      }
      setWaveformData(data)
    }
    generateWaveform()
  }, [audioUrl])

  // Desenhar waveform no canvas
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const barWidth = 2
    const barSpacing = 1
    const totalBars = Math.floor(width / (barWidth + barSpacing))
    const progress = audioDuration > 0 ? currentTime / audioDuration : 0

    ctx.clearRect(0, 0, width, height)

    for (let i = 0; i < totalBars; i++) {
      const amplitude = waveformData[i % waveformData.length] || 0.3
      const barHeight = Math.max(2, amplitude * height * 0.9)
      const x = i * (barWidth + barSpacing)
      const y = (height - barHeight) / 2

      // Cor baseada no progresso
      const isPlayed = i / totalBars <= progress
      ctx.fillStyle = isPlayed ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
      
      // Desenhar barra arredondada
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2)
      ctx.fill()
    }
  }, [waveformData, currentTime, audioDuration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const playAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    setIsLoading(true)

    try {
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration)
      }

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime)
      }

      audio.onplay = () => {
        setIsPlaying(true)
        setIsLoading(false)
      }
      
      audio.onpause = () => setIsPlaying(false)
      
      audio.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }

      audio.onerror = (error) => {
        console.error("Erro ao reproduzir áudio:", error)
        setIsPlaying(false)
        setIsLoading(false)
      }

      await audio.play()
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error)
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Cleanup quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className="flex items-center gap-2 bg-green-500 text-white p-2 rounded-2xl max-w-xs shadow-sm">
      {/* Botão Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        onClick={playAudio}
        disabled={disabled || isLoading}
        className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex-shrink-0 p-0"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3 ml-0.5" />
        )}
      </Button>

      {/* Waveform */}
      <div className="flex-1 min-w-0 px-1">
        <canvas
          ref={canvasRef}
          width={100}
          height={16}
          className="w-full h-4"
        />
      </div>

      {/* Duração */}
      <div className="text-xs text-white/90 flex-shrink-0 font-mono">
        {formatTime(isPlaying ? currentTime : audioDuration)}
      </div>

      {/* Ícone de status (check duplo) */}
      <div className="flex-shrink-0 ml-1">
        <svg width="10" height="6" viewBox="0 0 10 6" className="text-white/70">
          <path
            d="M3.5 4.5L1 2L1.7 1.3L3.5 3.1L7.3 -0.7L8 0L3.5 4.5Z"
            fill="currentColor"
          />
          <path
            d="M5 4.5L2.5 2L3.2 1.3L5 3.1L8.8 -0.7L9.5 0L5 4.5Z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      </div>
    </div>
  )
}