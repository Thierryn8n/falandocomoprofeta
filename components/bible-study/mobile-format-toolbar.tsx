'use client'

import React, { useState } from 'react'
import { Bold, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileFormatToolbarProps {
  isVisible?: boolean
  onColorChange?: (color: string) => void
  onBorderWidthChange?: (width: number) => void
  onBorderRadiusChange?: (radius: number) => void
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void
  onBoldToggle?: () => void
}

const colors = [
  '#fef08a', // Yellow (default sticky)
  '#fed7aa', // Orange
  '#fecaca', // Red
  '#e9d5ff', // Purple
  '#bfdbfe', // Blue
  '#a7f3d0', // Green
  '#e5e7eb', // Gray
  '#ffffff', // White
  '#1f2937', // Dark
]

export default function MobileFormatToolbar({
  isVisible = false,
  onColorChange,
  onBorderWidthChange,
  onBorderRadiusChange,
  onTextAlignChange,
  onBoldToggle,
}: MobileFormatToolbarProps) {
  const [activeTab, setActiveTab] = useState<'fundo' | 'borda' | 'texto'>('fundo')

  if (!isVisible) return null

  return (
    <div className="fixed bottom-[200px] left-1/2 -translate-x-1/2 z-[40] w-[90%] max-w-md">
      <div className="bg-white dark:bg-slate-900 backdrop-blur-sm border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl dark:shadow-slate-900/50 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-800">
          {(['fundo', 'borda', 'texto'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors",
                activeTab === tab
                  ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white border-b-2 border-orange-500"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'fundo' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">Cor do fundo</div>
              <div className="grid grid-cols-9 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange?.(color)}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-slate-700 shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'borda' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-2">
                  <span>Borda</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  defaultValue="2"
                  onChange={(e) => onBorderWidthChange?.(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-2">
                  <span>Raio</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  defaultValue="14"
                  onChange={(e) => onBorderRadiusChange?.(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'texto' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">Alinhamento</div>
              <div className="flex gap-2">
                <button
                  onClick={() => onTextAlignChange?.('left')}
                  className="flex-1 p-3 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <AlignLeft className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => onTextAlignChange?.('center')}
                  className="flex-1 p-3 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <AlignCenter className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => onTextAlignChange?.('right')}
                  className="flex-1 p-3 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <AlignRight className="w-5 h-5 mx-auto" />
                </button>
              </div>
              <button
                onClick={onBoldToggle}
                className="w-full p-3 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Bold className="w-5 h-5" />
                <span className="text-sm">Negrito</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
