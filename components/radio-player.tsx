"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Minimize2, ExternalLink, Radio, Loader2 } from "lucide-react"
import { RadioIframeController } from "@/lib/radio-iframe-controller"
import { useRadioConfig } from "@/hooks/use-radio-config"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { cn } from "@/lib/utils"

interface RadioPlayerProps {
  className?: string
}

export function RadioPlayer({ className }: RadioPlayerProps) {
  const { user } = useSupabaseAuth()
  const { radioConfig, loading, savePlayingState } = useRadioConfig(user)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const controllerRef = useRef<RadioIframeController | null>(null)

  const handlePlayingStateChange = useCallback(
    (playing: boolean) => {
      console.log("📻 Estado da reprodução mudou:", playing)
      setIsPlaying(playing)
      setError(null)
      setIsLoading(false)
      savePlayingState(playing)
    },
    [savePlayingState],
  )

  // Inicializar controlador da rádio
  useEffect(() => {
    if (!loading && radioConfig.enabled && radioConfig.radioUrl) {
      console.log("🚀 Inicializando controlador da rádio...")

      if (controllerRef.current) {
        controllerRef.current.destroy()
      }

      controllerRef.current = new RadioIframeController(radioConfig.radioUrl, handlePlayingStateChange)
      setVolume(radioConfig.volume)
      setError(null)

      // Aplicar estado inicial
      setIsPlaying(radioConfig.isPlaying)
      console.log("📻 Estado inicial aplicado:", radioConfig.isPlaying)

      // Auto-start se necessário
      if (radioConfig.isPlaying && !hasAutoStarted) {
        console.log("🎵 Auto-start detectado, iniciando rádio...")
        setHasAutoStarted(true)

        setTimeout(() => {
          if (controllerRef.current) {
            startRadio()
          }
        }, 1000)
      }
    }

    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy()
      }
    }
  }, [
    loading,
    radioConfig.enabled,
    radioConfig.radioUrl,
    radioConfig.volume,
    radioConfig.isPlaying,
    handlePlayingStateChange,
    hasAutoStarted,
  ])

  const startRadio = async () => {
    if (!controllerRef.current) return

    try {
      setIsLoading(true)
      const success = await controllerRef.current.play()
      if (success) {
        setIsPlaying(true)
        savePlayingState(true)
        console.log("▶️ Rádio iniciada automaticamente")
      } else {
        setError("Não foi possível iniciar a rádio")
      }
    } catch (error) {
      console.error("❌ Erro ao iniciar rádio:", error)
      setError("Erro ao iniciar a rádio")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlay = async () => {
    if (!controllerRef.current) {
      setError("Controlador da rádio não inicializado")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🎵 Tentando", isPlaying ? "pausar" : "reproduzir", "rádio...")

      if (isPlaying) {
        const success = await controllerRef.current.pause()
        if (success) {
          setIsPlaying(false)
          savePlayingState(false)
          console.log("⏸️ Rádio pausada")
        } else {
          setError("Não foi possível pausar a rádio")
        }
      } else {
        const success = await controllerRef.current.play()
        if (success) {
          setIsPlaying(true)
          savePlayingState(true)
          console.log("▶️ Rádio iniciada")
        } else {
          setError("Não foi possível iniciar a rádio")
        }
      }
    } catch (error) {
      console.error("❌ Erro ao controlar reprodução:", error)
      setError("Erro ao controlar a reprodução")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0]
    setVolume(vol)
    setIsMuted(vol === 0)

    if (controllerRef.current) {
      controllerRef.current.setVolume(vol)
    }
  }

  const handleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      if (controllerRef.current) {
        controllerRef.current.setVolume(volume)
      }
    } else {
      setIsMuted(true)
      if (controllerRef.current) {
        controllerRef.current.setVolume(0)
      }
    }
  }

  const getPositionClasses = () => {
    const baseClasses = "fixed z-50 transition-all duration-300 shadow-lg"

    switch (radioConfig.position) {
      case "top-left":
        return `${baseClasses} top-4 left-4`
      case "top-right":
        return `${baseClasses} top-4 right-4`
      case "bottom-left":
        return `${baseClasses} bottom-4 left-4`
      case "bottom-right":
      default:
        return `${baseClasses} bottom-4 right-4`
    }
  }

  const getStatusColor = () => {
    if (error) return "bg-red-500"
    if (isLoading) return "bg-yellow-500 animate-pulse"
    if (isPlaying) return "bg-green-500 animate-pulse"
    return "bg-gray-400"
  }

  const getStatusText = () => {
    if (error) return "Erro"
    if (isLoading) return isPlaying ? "Fechando..." : "Carregando..."
    if (isPlaying) return "Ao vivo"
    return "Desconectado"
  }

  if (loading || !radioConfig.enabled || !radioConfig.radioUrl) {
    return null
  }

  return (
    <Card className={cn(getPositionClasses(), className, isMinimized ? "w-16 h-16" : "w-64")}>
      <CardContent className="p-3">
        {isMinimized ? (
          <div className="flex items-center justify-center h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="w-10 h-10 p-0"
              title="Expandir player"
            >
              <Radio className={cn("h-4 w-4", isPlaying && "animate-pulse text-green-500")} />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center flex-shrink-0">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/de%20milagres%20%285%29-I8Mud6moHcQHJTHjnzUFGhP9DDJ473.png"
                    alt="Logo da Rádio"
                    className="w-6 h-6 rounded-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate flex items-center gap-2">
                    <Radio className={cn("h-4 w-4 flex-shrink-0", isPlaying && "animate-pulse text-green-500")} />
                    {radioConfig.radioName}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor())} />
                    {getStatusText()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(radioConfig.radioUrl, "_blank")}
                  className="w-8 h-8 p-0"
                  title="Abrir página da rádio"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="w-8 h-8 p-0"
                  title="Minimizar player"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-2 h-auto p-0 text-xs underline"
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlay}
                disabled={isLoading}
                className={cn(
                  "w-10 h-10 p-0 bg-transparent transition-colors",
                  isPlaying && "border-green-500 text-green-600",
                )}
                title={isPlaying ? "Pausar rádio" : "Reproduzir rádio"}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <div className="flex items-center gap-2 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMute}
                  className="w-8 h-8 p-0"
                  title={isMuted ? "Ativar som" : "Silenciar"}
                  disabled={!isPlaying}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>

                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="flex-1"
                  disabled={!isPlaying}
                />

                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-xs text-muted-foreground text-center bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{isPlaying ? "Fechando página da rádio..." : "Carregando página da rádio..."}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
