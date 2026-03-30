'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface FloatingInputBarProps {
  panelId: string
  onCardsGenerated: (cards: any[], connections: any[]) => void
  /** dock: bar fixa no fluxo (Modo Miro). overlay: sobre o canvas (Estudos Bíblicos clássico). */
  variant?: 'overlay' | 'dock'
}

export default function FloatingInputBar({
  panelId,
  onCardsGenerated,
  variant = 'overlay',
}: FloatingInputBarProps) {
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTextSubmit = async () => {
    if (!input.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/bible-study/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panelId,
          question: input,
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
                // Add card immediately
                onCardsGenerated([data.card], [])
                console.log('🎯 Card criado em tempo real:', data.card.title)
              } else if (data.type === 'connection') {
                // Add connection immediately
                onCardsGenerated([], [data.connection])
                console.log('🔗 Conexão criada em tempo real:', data.connection.label)
              } else if (data.type === 'complete') {
                console.log('✅ Geração completa!')
                setInput('')
              } else if (data.type === 'error') {
                console.error('❌ Erro:', data.error)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming:', error)
      // Fallback to non-streaming
      const response = await fetch('/api/bible-study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panelId,
          question: input,
        }),
      })

      const data = await response.json()
      if (data.success) {
        onCardsGenerated(data.cards, data.connections)
        setInput('')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        setAudioChunks(chunks)
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      // First, transcribe the audio
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const transcriptionResponse = await fetch('/api/chat-gemini', {
        method: 'POST',
        body: formData,
      })

      const transcriptionData = await transcriptionResponse.json()
      if (transcriptionData.transcription) {
        // Now use the transcription to generate study content
        const studyResponse = await fetch('/api/bible-study', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            panelId,
            audioTranscription: transcriptionData.transcription,
          }),
        })

        const studyData = await studyResponse.json()
        if (studyData.success) {
          onCardsGenerated(studyData.cards, studyData.connections)
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setIsProcessing(false)
      setAudioChunks([])
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processAudio(file)
    }
  }

  return (
    <div
      className={cn(
        'left-0 right-0 p-4 shadow-lg border-t',
        variant === 'dock'
          ? 'relative z-20 w-full shrink-0 bg-background border-border'
          : 'absolute bottom-0 bg-white border-amber-200'
      )}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder="Faça uma pergunta sobre seu estudo bíblico..."
            className="flex-1 px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={isProcessing}
          />
          
          <button
            onClick={handleTextSubmit}
            disabled={isProcessing || !input.trim()}
            className="bg-amber-600 text-white p-3 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`p-3 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-amber-600 text-white hover:bg-amber-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm">Gravando...</span>
              </div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="bg-amber-600 text-white p-3 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
        </div>

        {isProcessing && (
          <div className="mt-2 text-center text-sm text-amber-700">
            Processando sua pergunta e gerando cards...
          </div>
        )}
      </div>
    </div>
  )
}
