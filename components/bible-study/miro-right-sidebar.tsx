'use client'
import { useState } from 'react'

interface MiroRightSidebarProps {
  panel: any
}

export default function MiroRightSidebar({ panel }: MiroRightSidebarProps) {
  const [showPrototype, setShowPrototype] = useState(false)

  return (
    <div className="w-80 bg-card border-l p-4 flex flex-col">
      <div className="font-medium mb-4 flex items-center gap-2">
        <span>Prototype</span>
        <span className="text-primary text-xs bg-primary/10 px-2 py-px rounded">Sermão</span>
        <button
          onClick={() => setShowPrototype(!showPrototype)}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPrototype ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {/* Prototype area - só aparece quando toggle está ativo */}
      {showPrototype && (
        <div className="flex-1 border-2 border-dashed border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-inner">
            📖
          </div>
          <p className="text-sm text-muted-foreground">Protótipo de Esboço de Sermão + Slides</p>
          <button className="mt-6 px-6 py-3 bg-foreground text-background rounded-2xl text-sm flex items-center gap-2 hover:bg-muted">
            <span>▶️</span> Executar Protótipo
          </button>
        </div>
      )}

      {/* Drag & drop area - sempre visível */}
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Elementos Bíblicos</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-card border border-border rounded-2xl flex items-center justify-center text-center text-xs font-medium cursor-grab active:cursor-grabbing">
          Versículo em Destaque
        </div>
        <div className="h-20 bg-card border border-border rounded-2xl flex items-center justify-center text-center text-xs font-medium cursor-grab active:cursor-grabbing">
          Imagem Profética
        </div>
        <div className="h-20 bg-card border border-border rounded-2xl flex items-center justify-center text-center text-xs font-medium cursor-grab active:cursor-grabbing">
          Tabela de Referências
        </div>
        <div className="h-20 bg-card border border-border rounded-2xl flex items-center justify-center text-center text-xs font-medium cursor-grab active:cursor-grabbing">
          Mapa de Conexões
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-border text-xs text-muted-foreground flex gap-4">
        <button className="flex-1 py-3 border border-border rounded-2xl hover:bg-muted">+ Slide em branco</button>
        <button className="flex-1 py-3 border border-border rounded-2xl hover:bg-muted">📋 Template de Estudo</button>
      </div>
    </div>
  )
}
