'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Play, Sparkles, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CanvasElement, CanvasConnection } from '@/lib/miro-canvas-map'
import { studyCardsToCanvasElements, connectionsToCanvasConnections } from '@/lib/miro-canvas-map'

interface EmptyStateCardProps {
  panel: {
    id: string
    title: string
    theme?: string
    bible_version: string
    prophet_assistance: boolean
    description?: string
  }
  onGenerate: (elements: CanvasElement[], connections: CanvasConnection[]) => void
}

export default function EmptyStateCard({ panel, onGenerate }: EmptyStateCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateCompleteStudy = async () => {
    setIsGenerating(true)
    
    try {
      // Use streaming API for real-time generation
      const response = await fetch('/api/bible-study/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panelId: panel.id,
          question: `Crie um estudo completo sobre "${panel.title || panel.theme || 'Estudo Bíblico'}". ${panel.description ? `Descrição: ${panel.description}` : ''}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start streaming')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'card') {
                // Convert study card to canvas element
                const elements = studyCardsToCanvasElements([data.card])
                onGenerate(elements, [])
                console.log('🎯 Card criado em tempo real:', data.card.title)
              } else if (data.type === 'connection') {
                // Convert study connection to canvas connection
                const connections = connectionsToCanvasConnections([data.connection])
                onGenerate([], connections)
                console.log('🔗 Conexão criada em tempo real:', data.connection.label)
              } else if (data.type === 'complete') {
                console.log('✅ Geração completa!')
                setIsGenerating(false)
              } else if (data.type === 'error') {
                console.error('❌ Erro:', data.error)
                setIsGenerating(false)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming:', error)
      // Fallback to static generation
      const theme = panel.theme || 'Estudo Bíblico'
      const centerX = 1000
      const centerY = 400
      const spacingX = 280
      const spacingY = 200

      // Gera elementos em fluxo profissional conectado
      const elements: CanvasElement[] = [
        {
          id: uuidv4(),
          type: 'sticky',
          text: `📖 ${theme}\n\nIntrodução ao estudo bíblico com base na ${panel.bible_version}`,
          x: centerX - spacingX,
          y: centerY,
          width: 220,
          height: 160,
          color: '#fef3c7', // amarelo claro
          data: { style: { fill: '#fef3c7', textColor: '#1f2937', fontSize: 14 } }
        },
        {
          id: uuidv4(),
          type: 'table',
          text: 'Versículos Principais',
          x: centerX,
          y: centerY,
          width: 240,
          height: 180,
          data: {
            verses: [
              { reference: 'João 3:16', text: 'Deus amou o mundo de tal maneira...' },
              { reference: 'Romanos 8:28', text: 'Todas as coisas cooperam para o bem...' },
              { reference: 'Efésios 2:8', text: 'Pela graça sois salvos...' }
            ],
            style: { fill: '#ffffff', textColor: '#1f2937' }
          }
        },
        {
          id: uuidv4(),
          type: 'sticky',
          text: panel.prophet_assistance 
            ? '✨ Revelação do Profeta Branham\n\n"Deus está chamando Seu povo para a unidade na fé."'
            : '💡 Aplicação Prática\n\nComo aplicar este estudo na vida diária',
          x: centerX + spacingX,
          y: centerY,
          width: 220,
          height: 160,
          color: '#d1fae5', // verde claro
          data: { style: { fill: '#d1fae5', textColor: '#1f2937', fontSize: 14 } }
        },
        {
          id: uuidv4(),
          type: 'frame',
          text: `Ilustração: ${theme}`,
          x: centerX - spacingX / 2,
          y: centerY + spacingY,
          width: 260,
          height: 200,
          data: { style: { fill: '#f3f4f6', border: '#8b5cf6', borderWidth: 2, borderStyle: 'dashed' } }
        },
        {
          id: uuidv4(),
          type: 'doc',
          text: 'ESBOÇO DE SERMÃO\n\nI. Introdução\nII. Desenvolvimento\n   A. Ponto 1\n   B. Ponto 2\nIII. Conclusão\nIV. Apelo',
          x: centerX + spacingX / 2,
          y: centerY + spacingY,
          width: 240,
          height: 200,
          data: { style: { fill: '#ffffff', textColor: '#374151', fontSize: 12 } }
        },
        {
          id: uuidv4(),
          type: 'sticky',
          text: '🎯 Conclusão\n\nConclusão do estudo com exortação final para a igreja.',
          x: centerX,
          y: centerY + spacingY * 2,
          width: 220,
          height: 140,
          color: '#dbeafe', // azul claro
          data: { style: { fill: '#dbeafe', textColor: '#1f2937', fontSize: 14 } }
        }
      ]

      // Cria conexões em ordem profissional
      const connections: CanvasConnection[] = [
        {
          id: uuidv4(),
          fromElementId: elements[0].id,
          toElementId: elements[1].id,
          lineStyle: 'straight',
          label: 'Versículos'
        },
        {
          id: uuidv4(),
          fromElementId: elements[1].id,
          toElementId: elements[2].id,
          lineStyle: 'straight',
          label: panel.prophet_assistance ? 'Profeta' : 'Aplicação'
        },
        {
          id: uuidv4(),
          fromElementId: elements[0].id,
          toElementId: elements[3].id,
          lineStyle: 'curved',
          label: 'Visual'
        },
        {
          id: uuidv4(),
          fromElementId: elements[1].id,
          toElementId: elements[4].id,
          lineStyle: 'curved',
          label: 'Esboço'
        },
        {
          id: uuidv4(),
          fromElementId: elements[3].id,
          toElementId: elements[5].id,
          lineStyle: 'straight',
          label: 'Final'
        },
        {
          id: uuidv4(),
          fromElementId: elements[4].id,
          toElementId: elements[5].id,
          lineStyle: 'straight',
          label: 'Conclusão'
        }
      ]

      onGenerate(elements, connections)
      setIsGenerating(false)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl max-w-md text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">
            {panel.theme || 'Novo Estudo Bíblico'}
          </h2>
          <p className="text-muted-foreground mb-6">
            Canvas vazio. Deixe a IA criar um estudo completo e profissional conectado.
          </p>

          {/* Features list */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded-full">📖 Versículos</span>
            <span className="px-2 py-1 bg-muted rounded-full">✨ Revelações</span>
            <span className="px-2 py-1 bg-muted rounded-full">🖼️ Ilustrações</span>
            <span className="px-2 py-1 bg-muted rounded-full">📝 Esboço</span>
            <span className="px-2 py-1 bg-muted rounded-full">🔗 Conexões</span>
          </div>

          {/* Play button */}
          <Button
            onClick={generateCompleteStudy}
            disabled={isGenerating}
            className="w-full h-14 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando estudo...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Iniciar com IA
              </>
            )}
          </Button>

          {/* Prophet badge */}
          {panel.prophet_assistance && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-primary">
              <Sparkles className="w-4 h-4" />
              <span>Inclui auxílio do Profeta Branham</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
