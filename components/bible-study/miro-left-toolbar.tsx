'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MousePointer2,
  Type,
  Square,
  FileText,
  Heading,
  Layers,
  PenTool,
  Frame,
  Smile,
  Plus,
  Table,
  Undo,
  Redo,
  Shapes,
  Circle,
  Diamond,
  Star,
  Triangle,
  MessageSquare,
  ArrowBigRight,
} from 'lucide-react'
import type { CanvasShapeKind, ConnectionLineStyle } from '@/lib/miro-canvas-map'

export type MiroToolId =
  | 'select'
  | 'text'
  | 'rect'
  | 'sticky'
  | 'title'
  | 'connect'
  | 'draw'
  | 'frame'
  | 'emoji'
  | 'table'
  | 'doc'

const SHAPE_ITEMS: { kind: CanvasShapeKind; label: string; Icon: typeof Square }[] = [
  { kind: 'square', label: 'Quadrado', Icon: Square },
  { kind: 'rounded-square', label: 'Quadrado arredondado', Icon: Square },
  { kind: 'circle', label: 'Círculo', Icon: Circle },
  { kind: 'diamond', label: 'Losango', Icon: Diamond },
  { kind: 'star', label: 'Estrela', Icon: Star },
  { kind: 'triangle', label: 'Triângulo', Icon: Triangle },
  { kind: 'speech-bubble', label: 'Balão', Icon: MessageSquare },
  { kind: 'arrow-block', label: 'Seta', Icon: ArrowBigRight },
]

const LINE_ITEMS: { style: ConnectionLineStyle; label: string }[] = [
  { style: 'straight', label: 'Linha reta' },
  { style: 'arrow', label: 'Seta reta' },
  { style: 'elbow', label: 'Em ângulo' },
  { style: 'curved', label: 'Curva com seta' },
]

export function LineStyleIcon({ style }: { style: ConnectionLineStyle }) {
  switch (style) {
    case 'straight':
      return <span className="block w-8 h-px bg-foreground mt-2 mb-2 rotate-[-35deg]" aria-hidden />
    case 'arrow':
      return (
        <svg width="32" height="20" viewBox="0 0 32 20" className="text-foreground" aria-hidden>
          <line x1="2" y1="16" x2="26" y2="4" stroke="currentColor" strokeWidth="2" />
          <polygon points="28,3 22,2 24,8" fill="currentColor" />
        </svg>
      )
    case 'elbow':
      return (
        <svg width="32" height="22" viewBox="0 0 32 22" className="text-foreground" aria-hidden>
          <polyline points="4,18 18,18 18,4 28,4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'curved':
      return (
        <svg width="32" height="22" viewBox="0 0 32 22" className="text-foreground" aria-hidden>
          <path d="M 4 16 Q 16 4 28 6" fill="none" stroke="currentColor" strokeWidth="2" />
          <polygon points="30,6 24,4 25,10" fill="currentColor" />
        </svg>
      )
    default:
      return null
  }
}

interface MiroLeftToolbarProps {
  onTool?: (tool: MiroToolId) => void
  onAddShape?: (kind: CanvasShapeKind) => void
  lineStyle: ConnectionLineStyle
  onLineStyleChange: (s: ConnectionLineStyle) => void
  connectArmed: boolean
  onConnectToolbarClick: () => void
}

export default function MiroLeftToolbar({
  onTool,
  onAddShape,
  lineStyle,
  onLineStyleChange,
  connectArmed,
  onConnectToolbarClick,
}: MiroLeftToolbarProps) {
  const [openShapes, setOpenShapes] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpenShapes(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const tools: { id: MiroToolId; icon: typeof MousePointer2; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Selecionar' },
    { id: 'text', icon: Type, label: 'Texto' },
    { id: 'sticky', icon: FileText, label: 'Nota adesiva' },
    { id: 'title', icon: Heading, label: 'Título' },
    { id: 'draw', icon: PenTool, label: 'Desenhar' },
    { id: 'frame', icon: Frame, label: 'Frame' },
    { id: 'emoji', icon: Smile, label: 'Emojis / Ilustrações' },
    { id: 'table', icon: Table, label: 'Tabela' },
  ]

  return (
    <div ref={rootRef} className="relative w-16 bg-card border-r flex flex-col items-center py-3 gap-2 shadow-sm shrink-0">
      <div className="relative mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
          <span className="text-primary-foreground text-2xl">✨</span>
        </div>
        <div className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] px-2 py-px rounded-full font-medium">
          Sidekicks
        </div>
      </div>

      {tools.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-colors"
            title={t.label}
            onClick={() => {
              setOpenShapes(false)
              onTool?.(t.id)
            }}
          >
            <Icon className="w-5 h-5" />
          </button>
        )
      })}

      <button
        type="button"
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
          openShapes ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
        }`}
        title="Formas"
        onClick={() => {
          setOpenShapes((v) => !v)
        }}
      >
        <Shapes className="w-5 h-5" />
      </button>

      <button
        type="button"
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
          connectArmed ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
        }`}
        title="Conectar: dois cliques (ferramenta) ou arraste das bolinhas ao passar o mouse ou com o card selecionado"
        onClick={() => {
          setOpenShapes(false)
          onConnectToolbarClick()
        }}
      >
        <Layers className="w-5 h-5" />
      </button>

      {openShapes && (
        <div className="absolute left-full top-[40%] ml-2 z-[60] w-[200px] rounded-2xl border border-border bg-card shadow-xl p-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Formas</div>
          <div className="grid grid-cols-4 gap-1.5">
            {SHAPE_ITEMS.map(({ kind, label, Icon }) => (
              <button
                key={kind}
                type="button"
                title={label}
                onClick={() => {
                  onAddShape?.(kind)
                  setOpenShapes(false)
                }}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-border hover:bg-muted hover:border-primary/50 transition-colors"
              >
                <Icon className={`w-4 h-4 ${kind === 'rounded-square' ? 'rounded-md' : ''}`} strokeWidth={kind === 'square' ? 2.5 : 2} />
              </button>
            ))}
          </div>
        </div>
      )}

      {connectArmed && (
        <div className="absolute left-full top-[50%] ml-2 z-[60] w-[196px] rounded-2xl border border-border bg-card shadow-xl p-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Tipo de linha</div>
          <div className="grid grid-cols-4 gap-1">
            {LINE_ITEMS.map(({ style, label }) => (
              <button
                key={style}
                type="button"
                title={label}
                onClick={() => onLineStyleChange(style)}
                className={`h-14 flex flex-col items-center justify-center rounded-lg border transition-colors ${
                  lineStyle === style
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <LineStyleIcon style={style} />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 px-1 leading-snug">
            Com Camadas ativa: clique em dois cards. Para arrastar fio pelas bolinhas, não precisa ativar Camadas —
            passe o mouse no card ou selecione-o.
          </p>
        </div>
      )}

      <div className="flex-1" />

      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-colors"
        title="Mais ferramentas"
        onClick={() => {
          setOpenShapes(false)
          onTool?.('doc')
        }}
      >
        <Plus className="w-5 h-5" />
      </button>

      <div className="flex gap-1">
        <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg opacity-50" title="Desfazer">
          <Undo className="h-4 w-4" />
        </button>
        <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg opacity-50" title="Refazer">
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
