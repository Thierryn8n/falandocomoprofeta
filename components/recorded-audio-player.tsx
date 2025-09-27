"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Loader2 } from "lucide-react"

interface RecordedAudioPlayerProps {
  audioUrl: string
  disabled?: boolean
}

export function RecordedAudioPlayer({ audioUrl, disabled }: RecordedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

      audio.onplay = () => {
        setIsPlaying(true)
        setIsLoading(false)
      }
      
      audio.onpause = () => setIsPlaying(false)
      
      audio.onended = () => {
        setIsPlaying(false)
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

  if (isLoading) {
    return (
      <Button disabled variant="outline" size="icon">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  return (
    <Button variant="outline" size="icon" onClick={playAudio} disabled={disabled}>
      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </Button>
  )
}