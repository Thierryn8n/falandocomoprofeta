'use client'

import React from 'react'
import { BookOpen, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileTopBarProps {
  onNewStudy?: () => void
  onShare?: () => void
}

export default function MobileTopBar({ onNewStudy, onShare }: MobileTopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      {/* Novo Estudo Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onNewStudy}
        className="flex items-center gap-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white rounded-full px-4 py-2 text-sm font-medium"
      >
        <BookOpen className="w-4 h-4" />
        <span>Novo Estudo</span>
      </Button>

      {/* Right side buttons */}
      <div className="flex items-center gap-2">
        {/* Compartilhar Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          className="flex items-center gap-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white rounded-full px-4 py-2 text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          <span>Compartilhar</span>
        </Button>

        {/* Profeta Branham Badge */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
            PB
          </div>
          <span className="text-slate-200 text-sm font-medium hidden sm:inline">
            Profeta Branham
          </span>
        </div>
      </div>
    </div>
  )
}
