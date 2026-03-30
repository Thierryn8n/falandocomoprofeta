'use client'

import { useState, useRef } from 'react'
import type {
  CanvasConnection,
  ConnectionDashStyle,
  ConnectionEndCap,
  ConnectionLineStyle,
} from '@/lib/miro-canvas-map'
import {
  connectionEndShowsArrow,
  connectionResolvedStroke,
} from '@/lib/miro-canvas-map'
import { LineStyleIcon } from '@/components/bible-study/miro-left-toolbar'
import { PresetColorSwatches } from '@/components/bible-study/preset-color-swatches'

const LINE_STYLES: ConnectionLineStyle[] = ['straight', 'arrow', 'elbow', 'curved']

interface MiroConnectionFormatBarProps {
  connection: CanvasConnection
  onPatch: (patch: Partial<CanvasConnection>) => void
}

export default function MiroConnectionFormatBar({ connection, onPatch }: MiroConnectionFormatBarProps) {
  const { strokeWidth, strokeColor, dashStyle } = connectionResolvedStroke(connection)
  const arrowOn = connectionEndShowsArrow(connection)

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  const setEndCap = (cap: ConnectionEndCap) => {
    onPatch({ endCap: cap })
  }

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    })
  }

  const handleDragEnd = (e: React.PointerEvent) => {
    setIsDragging(false)
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
  }

  return (
    <div 
      className="relative pointer-events-auto max-w-[min(98vw,50rem)] flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-xl select-none"
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Drag handle indicator - much larger for easier grabbing */}
      <div 
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-6 cursor-move flex items-center justify-center z-50 bg-muted/50 rounded-full hover:bg-muted/70 transition-colors"
        onPointerDown={(e) => {
          e.stopPropagation()
          handleDragStart(e)
        }}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div className="w-20 h-2 bg-muted-foreground/50 rounded-full" />
      </div>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-1">Linha</span>

      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-muted/30">
        {LINE_STYLES.map((style) => (
          <button
            key={style}
            type="button"
            title={style}
            className={`h-9 w-9 flex items-center justify-center rounded-md transition-colors ${
              (connection.lineStyle ?? 'straight') === style
                ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                : 'hover:bg-muted'
            }`}
            onClick={() => onPatch({ lineStyle: style })}
          >
            <LineStyleIcon style={style} />
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <span className="text-muted-foreground text-xs shrink-0">Cores</span>
        <PresetColorSwatches
          value={strokeColor}
          onChange={(hex) => onPatch({ strokeColor: hex })}
          title="Cores pré-definidas da linha"
          className="max-w-[min(320px,70vw)]"
        />
        <label className="flex items-center gap-1 text-xs shrink-0">
          <span className="text-muted-foreground hidden sm:inline">Outra</span>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => onPatch({ strokeColor: e.target.value })}
            className="h-8 w-9 cursor-pointer rounded border border-border bg-background p-0"
            title="Cor personalizada"
          />
        </label>
      </div>

      <label className="flex items-center gap-1 text-xs pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
        <span className="text-muted-foreground">Espessura</span>
        <input
          type="range"
          min={1}
          max={12}
          step={0.5}
          value={strokeWidth}
          onChange={(e) => onPatch({ strokeWidth: Number(e.target.value) })}
          className="w-24"
          style={{ touchAction: 'auto' }}
        />
        <span className="tabular-nums text-muted-foreground w-8">{strokeWidth}</span>
      </label>

      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-muted/30">
        {(
          [
            ['solid', 'Contínua'],
            ['dashed', 'Tracejada'],
            ['dotted', 'Pontilhada'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            title={label}
            className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              (connection.dashStyle ?? 'solid') === key
                ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                : 'hover:bg-muted text-muted-foreground'
            }`}
            onClick={() => onPatch({ dashStyle: key as ConnectionDashStyle })}
          >
            {key === 'solid' ? '─' : key === 'dashed' ? '╌' : '·'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-muted/30">
        {(
          [
            ['none', '—'],
            ['arrow', '▶'],
            ['dot', '●'],
            ['diamond', '◆'],
            ['square', '■'],
            ['closed', '▷|'],
          ] as const
        ).map(([key, icon]) => (
          <button
            key={key}
            type="button"
            title={key === 'none' ? 'Sem ponta' : key === 'arrow' ? 'Seta' : key === 'dot' ? 'Ponto' : key === 'diamond' ? 'Losango' : key === 'square' ? 'Quadrado' : 'Fechada'}
            className={`h-8 w-8 flex items-center justify-center rounded-md text-sm transition-colors ${
              (connection.endCap ?? 'arrow') === key
                ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                : 'hover:bg-muted text-muted-foreground'
            }`}
            onClick={() => setEndCap(key as ConnectionEndCap)}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
