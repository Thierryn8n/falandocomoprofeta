'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface StudyCard {
  id: string
  title: string
  content: string
  card_type: string
  position_x: number
  position_y: number
  width: number
  height: number
  color: string
  bible_reference?: string
  prophet_message?: string
}

interface CardConnection {
  id: string
  from_card_id: string
  to_card_id: string
  connection_type: string
  label?: string
  color: string
}

export default function InteractivePanel({ panel }: { panel: any }) {
  const [cards, setCards] = useState<StudyCard[]>([])
  const [connections, setConnections] = useState<CardConnection[]>([])
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPanelData()
  }, [panel.id])

  const loadPanelData = async () => {
    try {
      // Load cards
      const { data: cardsData } = await supabase
        .from('study_cards')
        .select('*')
        .eq('panel_id', panel.id)
        .order('created_at')

      // Load connections
      const { data: connectionsData } = await supabase
        .from('card_connections')
        .select('*')
        .eq('panel_id', panel.id)

      setCards(cardsData || [])
      setConnections(connectionsData || [])
    } catch (error) {
      console.error('Error loading panel data:', error)
    }
  }

  const handleCardDragStart = (cardId: string, e: React.MouseEvent) => {
    setDraggedCard(cardId)
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const offsetX = e.clientX - rect.left - card.position_x
    const offsetY = e.clientY - rect.top - card.position_y

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - rect.left - offsetX
      const newY = moveEvent.clientY - rect.top - offsetY

      setCards(prev => prev.map(c => 
        c.id === cardId 
          ? { ...c, position_x: newX, position_y: newY }
          : c
      ))
    }

    const handleMouseUp = async () => {
      if (draggedCard) {
        const updatedCard = cards.find(c => c.id === cardId)
        if (updatedCard) {
          await supabase
            .from('study_cards')
            .update({ 
              position_x: updatedCard.position_x, 
              position_y: updatedCard.position_y 
            })
            .eq('id', cardId)
        }
      }
      setDraggedCard(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleCardClick = (cardId: string) => {
    if (isConnecting) {
      if (connectingFrom && connectingFrom !== cardId) {
        createConnection(connectingFrom, cardId)
      }
      setIsConnecting(false)
      setConnectingFrom(null)
    } else {
      setSelectedCard(selectedCard === cardId ? null : cardId)
    }
  }

  const createConnection = async (fromId: string, toId: string) => {
    try {
      const { data, error } = await supabase
        .from('card_connections')
        .insert({
          panel_id: panel.id,
          from_card_id: fromId,
          to_card_id: toId,
          connection_type: 'related',
          color: '#3b82f6'
        })
        .select()
        .single()

      if (!error && data) {
        setConnections(prev => [...prev, data])
      }
    } catch (error) {
      console.error('Error creating connection:', error)
    }
  }

  const deleteCard = async (cardId: string) => {
    try {
      await supabase
        .from('study_cards')
        .delete()
        .eq('id', cardId)

      // Also delete connections
      await supabase
        .from('card_connections')
        .delete()
        .or(`from_card_id.eq.${cardId},to_card_id.eq.${cardId}`)

      setCards(prev => prev.filter(c => c.id !== cardId))
      setConnections(prev => prev.filter(
        conn => conn.from_card_id !== cardId && conn.to_card_id !== cardId
      ))
      setSelectedCard(null)
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const getCardColor = (type: string) => {
    const colors = {
      verse: '#fef3c7',
      concept: '#dbeafe',
      question: '#fce7f3',
      answer: '#d1fae5',
      connection: '#e9d5ff',
      note: '#fed7aa'
    }
    return colors[type as keyof typeof colors] || '#ffffff'
  }

  const renderConnection = (connection: CardConnection) => {
    const fromCard = cards.find(c => c.id === connection.from_card_id)
    const toCard = cards.find(c => c.id === connection.to_card_id)
    
    if (!fromCard || !toCard) return null

    const x1 = fromCard.position_x + fromCard.width / 2
    const y1 = fromCard.position_y + fromCard.height / 2
    const x2 = toCard.position_x + toCard.width / 2
    const y2 = toCard.position_y + toCard.height / 2

    return (
      <svg
        key={connection.id}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={connection.color}
          strokeWidth="2"
        />
      </svg>
    )
  }

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full bg-gradient-to-br from-amber-50/50 to-orange-50/50 overflow-hidden"
    >
      {/* Render connections */}
      {connections.map(renderConnection)}

      {/* Render cards */}
      {cards.map(card => (
        <div
          key={card.id}
          className={`absolute rounded-lg shadow-lg cursor-move transition-all ${
            selectedCard === card.id ? 'ring-2 ring-amber-500' : ''
          } ${draggedCard === card.id ? 'opacity-75' : ''}`}
          style={{
            left: `${card.position_x}px`,
            top: `${card.position_y}px`,
            width: `${card.width}px`,
            height: `${card.height}px`,
            backgroundColor: getCardColor(card.card_type),
            zIndex: selectedCard === card.id ? 10 : 2
          }}
          onMouseDown={(e) => handleCardDragStart(card.id, e)}
          onClick={() => handleCardClick(card.id)}
        >
          <div className="p-3 h-full flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-sm text-gray-800 truncate">{card.title}</h3>
              {selectedCard === card.id && (
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsConnecting(true)
                      setConnectingFrom(card.id)
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    🔗
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCard(card.id)
                    }}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-600 flex-1 overflow-hidden">
              <div className="line-clamp-3">{card.content}</div>
              {card.bible_reference && (
                <div className="mt-2 text-amber-700 font-medium">
                  📖 {card.bible_reference}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {isConnecting && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
          Clique em outro card para conectar
        </div>
      )}
    </div>
  )
}
