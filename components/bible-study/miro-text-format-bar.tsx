'use client'

import { useState } from 'react'
import type { CanvasElement, TextCardStyleState } from '@/lib/miro-canvas-map'
import { getBoxStyle } from '@/lib/miro-canvas-map'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bold, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface MiroTextFormatBarProps {
  element: CanvasElement
  onPatchStyle: (patch: Partial<TextCardStyleState>) => void
}

const PRESET_COLORS = [
  '#6b7280', '#1f2937', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
  '#fde047', '#fdba74', '#fed7aa', '#fecaca', '#e9d5ff', '#bfdbfe', '#a7f3d0', '#fef3c7', '#ffffff', '#f3f4f6', '#d1d5db', '#9ca3af'
]

function ColorSwatches({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PRESET_COLORS.slice(0, 16).map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-5 h-5 rounded-sm border transition-all ${
            value === color ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105'
          }`}
          style={{ backgroundColor: color, borderColor: color === '#ffffff' ? '#e5e7eb' : color }}
          aria-label={`Cor ${color}`}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 p-0 border-0 rounded-sm cursor-pointer"
        title="Cor personalizada"
      />
    </div>
  )
}

export default function MiroTextFormatBar({ element, onPatchStyle }: MiroTextFormatBarProps) {
  const s = getBoxStyle(element)
  const bold = s.fontWeight === '700' || s.fontWeight === 'bold'
  const [activeTab, setActiveTab] = useState('fill')

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
      {/* Tabs de cores */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
        <TabsList className="h-7 bg-muted/50 p-0.5">
          <TabsTrigger value="fill" className="h-6 px-2 text-[10px] uppercase">Fundo</TabsTrigger>
          <TabsTrigger value="border" className="h-6 px-2 text-[10px] uppercase">Borda</TabsTrigger>
          <TabsTrigger value="text" className="h-6 px-2 text-[10px] uppercase">Texto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fill" className="mt-2">
          <ColorSwatches value={s.fill} onChange={(hex) => onPatchStyle({ fill: hex })} />
        </TabsContent>
        <TabsContent value="border" className="mt-2">
          <ColorSwatches value={s.border} onChange={(hex) => onPatchStyle({ border: hex })} />
        </TabsContent>
        <TabsContent value="text" className="mt-2">
          <ColorSwatches value={s.textColor} onChange={(hex) => onPatchStyle({ textColor: hex })} />
        </TabsContent>
      </Tabs>

      {/* Separador */}
      <div className="w-px h-8 bg-border" />

      {/* Sliders compactos */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
          Borda
          <input
            type="range"
            min={0}
            max={6}
            value={s.borderWidth}
            onChange={(e) => onPatchStyle({ borderWidth: Number(e.target.value) })}
            className="w-16 h-1"
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
          Raio
          <input
            type="range"
            min={0}
            max={24}
            value={s.borderRadius}
            onChange={(e) => onPatchStyle({ borderRadius: Number(e.target.value) })}
            className="w-16 h-1"
          />
        </label>
      </div>

      {/* Separador */}
      <div className="w-px h-8 bg-border" />

      {/* Alinhamento */}
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant={s.textAlign === 'left' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPatchStyle({ textAlign: 'left' })}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={s.textAlign === 'center' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPatchStyle({ textAlign: 'center' })}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={s.textAlign === 'right' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPatchStyle({ textAlign: 'right' })}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Bold */}
      <Button
        type="button"
        variant={bold ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 w-7 p-0 font-bold"
        onClick={() => onPatchStyle({ fontWeight: bold ? '400' : '700' })}
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>

      {/* Tamanho */}
      <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <input
          type="number"
          min={10}
          max={48}
          value={s.fontSize}
          onChange={(e) => onPatchStyle({ fontSize: Math.max(10, Number(e.target.value) || 14) })}
          className="h-7 w-10 rounded border border-input bg-background px-1 text-center text-xs"
        />
      </label>
    </div>
  )
}
