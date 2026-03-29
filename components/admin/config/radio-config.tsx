'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioStation, Play, Pause, Settings } from 'lucide-react'

export default function RadioConfig() {
  const [isLive, setIsLive] = useState(false)
  const [currentTrack, setCurrentTrack] = useState('')
  const [volume, setVolume] = useState(75)
  const [autoPlay, setAutoPlay] = useState(true)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações da Rádio</h1>
        <p className="text-muted-foreground">
          Gerencie a transmissão ao vivo da rádio da igreja
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadioStation className="h-5 w-5" />
              Transmissão Ao Vivo
            </CardTitle>
            <CardDescription>
              Controle da transmissão da rádio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="live">Status da Transmissão</Label>
              <Switch
                id="live"
                checked={isLive}
                onCheckedChange={setIsLive}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="track">Faixa Atual</Label>
              <Input
                id="track"
                value={currentTrack}
                onChange={(e) => setCurrentTrack(e.target.value)}
                placeholder="Nome da faixa ou mensagem"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Volume: {volume}%</Label>
              <input
                id="volume"
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={isLive ? "destructive" : "default"}
                onClick={() => setIsLive(!isLive)}
                className="flex-1"
              >
                {isLive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar Transmissão
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Transmissão
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Adicionais
            </CardTitle>
            <CardDescription>
              Opções avançadas da rádio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoplay">Reprodução Automática</Label>
              <Switch
                id="autoplay"
                checked={autoPlay}
                onCheckedChange={setAutoPlay}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-url">URL da Stream</Label>
              <Input
                id="stream-url"
                placeholder="rtmp://servidor.com/live/chave"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-url">URL de Backup</Label>
              <Input
                id="backup-url"
                placeholder="URL da stream de backup"
                type="url"
              />
            </div>

            <Button variant="outline" className="w-full">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
