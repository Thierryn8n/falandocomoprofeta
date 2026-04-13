"use client"

import { useState } from "react"
import { GrokAudioInput } from "./grok-audio-input"

// Exemplo de como usar o componente GrokAudioInput no seu chat
export function GrokAudioExample() {
  const [messages, setMessages] = useState<Array<{type: "text" | "audio", content: string}>>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSendMessage = async (text: string) => {
    // Adiciona mensagem do usuário
    setMessages(prev => [...prev, { type: "text", content: text }])
    
    // Simula processamento
    setIsProcessing(true)
    
    // Aqui você chamaria sua API de chat
    // const response = await fetch("/api/chat", { ... })
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: "text", 
        content: `Resposta processada para: "${text}"` 
      }])
      setIsProcessing(false)
    }, 1000)
  }

  const handleSendAudio = async (audioBlob: Blob) => {
    console.log("Áudio recebido:", audioBlob.size, "bytes")
    
    // Aqui você enviaria o áudio para transcrição
    // const formData = new FormData()
    // formData.append("audio", audioBlob)
    // const response = await fetch("/api/transcribe", { method: "POST", body: formData })
    
    // Simula: adiciona mensagem de áudio
    setMessages(prev => [...prev, { 
      type: "audio", 
      content: `🎤 Áudio enviado (${(audioBlob.size / 1024).toFixed(1)} KB)` 
    }])
  }

  const handleCancelRecording = () => {
    console.log("Gravação cancelada")
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === "audio" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
              msg.type === "audio"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-200"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded-2xl">
              Processando...
            </div>
          </div>
        )}
      </div>

      {/* Input estilo Grok */}
      <div className="p-4">
        <GrokAudioInput
          onSendMessage={handleSendMessage}
          onSendAudio={handleSendAudio}
          onCancelRecording={handleCancelRecording}
          placeholder="Pergunte qualquer coisa"
          disabled={isProcessing}
        />
      </div>
    </div>
  )
}

// Para usar no seu chat existente, substitua o input atual por:
/*
import { GrokAudioInput } from "./grok-audio-input"

// No seu componente de chat:
<GrokAudioInput
  onSendMessage={(text) => sendMessage(text)}
  onSendAudio={(audioBlob) => {
    // Processa o áudio
    const formData = new FormData()
    formData.append("audio", audioBlob)
    fetch("/api/chat", { method: "POST", body: formData })
  }}
  onCancelRecording={() => console.log("Cancelado")}
  placeholder="Pergunte qualquer coisa"
  disabled={isLoading}
/>
*/
