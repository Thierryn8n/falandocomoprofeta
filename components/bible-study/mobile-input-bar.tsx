'use client'

import React, { useState } from 'react'
import { Send, Mic, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileInputBarProps {
  onSend?: (message: string) => void
  onVoiceStart?: () => void
  onVoiceEnd?: () => void
  onCloudClick?: () => void
  placeholder?: string
  disabled?: boolean
}

export default function MobileInputBar({
  onSend,
  onVoiceStart,
  onVoiceEnd,
  onCloudClick,
  placeholder = 'Faça uma pergunta sobre seu estudo biblico',
  disabled = false,
}: MobileInputBarProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend?.(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false)
      onVoiceEnd?.()
    } else {
      setIsRecording(true)
      onVoiceStart?.()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        {/* Input Field */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-slate-800 border border-slate-700 rounded-full px-4 py-3 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={cn(
            "p-3 rounded-full transition-all duration-200 flex items-center justify-center",
            message.trim() && !disabled
              ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </button>

        {/* Voice Button */}
        <button
          onClick={handleMicClick}
          disabled={disabled}
          className={cn(
            "p-3 rounded-full transition-all duration-200 flex items-center justify-center",
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          )}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Cloud Button */}
        <button
          onClick={onCloudClick}
          disabled={disabled}
          className="p-3 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all duration-200 flex items-center justify-center"
        >
          <Cloud className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
