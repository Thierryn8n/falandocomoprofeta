'use client'

import React, { useState } from 'react'
import { 
  MousePointer2, 
  Type, 
  FileText, 
  Heading, 
  PenTool, 
  Grid3X3,
  Shapes,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type MobileTool = 'select' | 'text' | 'doc' | 'heading' | 'draw' | 'table' | 'shape' | 'image'

interface MobileBottomNavProps {
  activeTool?: MobileTool
  onToolChange?: (tool: MobileTool) => void
}

export default function MobileBottomNav({ activeTool = 'select', onToolChange }: MobileBottomNavProps) {
  const tools = [
    { id: 'select' as MobileTool, icon: MousePointer2, label: 'Selecionar' },
    { id: 'text' as MobileTool, icon: Type, label: 'Texto' },
    { id: 'doc' as MobileTool, icon: FileText, label: 'Documento' },
    { id: 'heading' as MobileTool, icon: Heading, label: 'Título' },
    { id: 'draw' as MobileTool, icon: PenTool, label: 'Desenhar' },
    { id: 'table' as MobileTool, icon: Grid3X3, label: 'Tabela' },
    { id: 'shape' as MobileTool, icon: Shapes, label: 'Formas' },
    { id: 'image' as MobileTool, icon: ImageIcon, label: 'Imagem' },
  ]

  return (
    <div className="fixed bottom-[140px] left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-2xl px-3 py-2 shadow-2xl">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id
          
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange?.(tool.id)}
              className={cn(
                "p-3 rounded-xl transition-all duration-200 flex items-center justify-center",
                isActive 
                  ? "bg-slate-700 text-white shadow-inner" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
