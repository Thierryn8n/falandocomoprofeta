'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2, Play, Pause } from 'lucide-react'

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void // Mudança: enviar blob em vez de texto
  onRecordingStateChange?: (isRecording: boolean) => void
  disabled?: boolean
}

export default function AudioRecorder({ onAudioRecorded, onRecordingStateChange, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLevels, setAudioLevels] = useState<number[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Funcao para analisar o audio e criar visualizacao
  const analyzeAudio = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calcular múltiplos níveis para melhor visualização
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const peak = Math.max(...dataArray)
    const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length)
    
    // Usar RMS para melhor detecção de voz humana
    const normalizedLevel = Math.min(1, rms / 128) // Aumentar sensibilidade
    const peakLevel = Math.min(1, peak / 255)
    
    // Combinar RMS e peak para visualização mais responsiva
    const combinedLevel = Math.max(normalizedLevel * 1.5, peakLevel * 0.8)

    setAudioLevels(prev => {
      const newLevels = [...prev, combinedLevel]
      // Manter apenas os ultimos 30 niveis para visualizacao mais fluida
      return newLevels.slice(-30)
    })

    // Continuar a análise apenas se estiver gravando
    // A visualização do canvas será atualizada pelo seu próprio requestAnimationFrame
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      })
      
      // Configurar analise de audio para visualizacao
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      
      // Configurações otimizadas para voz humana
      analyserRef.current.fftSize = 2048 // Maior resolução
      analyserRef.current.smoothingTimeConstant = 0.3 // Menos suavização para resposta mais rápida
      analyserRef.current.minDecibels = -90
      analyserRef.current.maxDecibels = -10
      
      source.connect(analyserRef.current)

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        setAudioLevels([]) // Limpar niveis anteriores
        
        // Parar todas as faixas do stream
        stream.getTracks().forEach(track => track.stop())
        
        // Criar URL para reproducao
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        
        // Reproduzir automaticamente o audio gravado
        playRecordedAudio(url)
        
        // Enviar o áudio diretamente para o chat
        sendAudioBlob(audioBlob)
        
        // Limpar contexto de audio
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      // Notificar mudança de estado
      if (onRecordingStateChange) {
        onRecordingStateChange(true)
      }
      
      // Iniciar analise de audio
      analyzeAudio()
    } catch (error) {
      console.error('Erro ao iniciar gravacao:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      onRecordingStateChange?.(false)
      
      // Parar a análise de áudio
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }

  const playRecordedAudio = (url: string) => {
    const audio = new Audio(url)
    audioElementRef.current = audio
    
    audio.onloadeddata = () => {
      setIsPlaying(true)
      audio.play()
    }

    audio.onended = () => {
      setIsPlaying(false)
      audioElementRef.current = null
    }

    audio.onerror = () => {
      setIsPlaying(false)
      audioElementRef.current = null
    }
  }

  // Função para enviar áudio diretamente
  const sendAudioBlob = (audioBlob: Blob) => {
    // Enviar o blob de áudio diretamente para o chat
    onAudioRecorded(audioBlob)
    
    // Limpar URL do áudio após envio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
  }



  // Cleanup quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Componente de visualizacao das ondas sonoras com canvas
  const WaveVisualization = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number | null>(null)

    // Função para desenhar as ondas no canvas
    const drawWaveform = () => {
      if (!canvasRef.current || !analyserRef.current) return
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteTimeDomainData(dataArray)

      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Configurar estilo da linha
      ctx.lineWidth = 2
      ctx.strokeStyle = isRecording ? '#10b981' : '#3b82f6' // Verde quando gravando, azul quando reproduzindo
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()

      if (isRecording) {
        rafRef.current = requestAnimationFrame(drawWaveform)
      }
    }

    // Iniciar animação quando começar a gravar
    useEffect(() => {
      if (isRecording && analyserRef.current) {
        drawWaveform()
      }
      
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }, [isRecording])

    return (
      <div className="flex items-center justify-center h-16 px-4">
        <canvas
          ref={canvasRef}
          width={300}
          height={60}
          className="border border-border rounded-md bg-background/50"
          style={{ 
            filter: isRecording ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))' : 'none'
          }}
        />
        {!isRecording && audioLevels.length === 0 && (
          // Linha estática quando não está gravando
          <div className="absolute">
            <div className="w-[300px] h-[2px] bg-muted-foreground/30 rounded-full" />
          </div>
        )}
      </div>
    )
  }



  if (isPlaying) {
    return (
      <div className="flex items-center space-x-2">
        <Button disabled variant="outline" size="icon" className="audio-playing">
          <Play className="h-4 w-4" />
        </Button>
        <WaveVisualization />
        <span className="text-sm text-muted-foreground">Reproduzindo seu audio...</span>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="destructive"
          size="icon"
          onClick={stopRecording}
          disabled={disabled}
          className="recording-pulse audio-recording"
        >
          <MicOff className="h-4 w-4" />
        </Button>
        <WaveVisualization />
        <span className="text-sm text-muted-foreground">Gravando... Clique para parar</span>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={startRecording}
      disabled={disabled}
      title="Gravar mensagem de voz"
    >
      <Mic className="h-4 w-4" />
    </Button>
  )
}
