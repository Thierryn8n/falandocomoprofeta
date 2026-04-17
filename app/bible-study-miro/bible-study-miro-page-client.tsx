'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Modifier,
} from '@dnd-kit/core'
import { supabase } from '@/lib/supabase'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import MobileInputBar from '@/components/bible-study/mobile-input-bar'
import MobileTopBar from '@/components/bible-study/mobile-top-bar'
import MobileBottomNav from '@/components/bible-study/mobile-bottom-nav'
import { Button } from '@/components/ui/button'
import { BookOpen, UserIcon, LogOut, MousePointer2, Type, FileText, Heading, PenTool, Grid3X3, Shapes, Image as ImageIcon, Send, Mic, Cloud } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import MiroLeftToolbar, { type MiroToolId } from '@/components/bible-study/miro-left-toolbar'
import MiroTopBar from '@/components/bible-study/miro-top-bar'
import MiroCanvas from '@/components/bible-study/miro-canvas'
import MiroTextFormatBar from '@/components/bible-study/miro-text-format-bar'
import MiroConnectionFormatBar from '@/components/bible-study/miro-connection-format-bar'
import EmptyStateCard from '@/components/bible-study/miro-empty-state'
import {
  type CanvasElement,
  type CanvasConnection,
  type StudyCardRow,
  type CanvasShapeKind,
  type ConnectionLineStyle,
  canvasElementFromDb,
  studyCardsToCanvasElements,
  connectionsToCanvasConnections,
  canvasConnectionFromDb,
  mergeCanvasElements,
  createPaletteElement,
  createShapeElement,
  createTextLikeCard,
  getBoxStyle,
  type TextCardStyleState,
  type PaletteDropKind,
  type ConnectionSide,
  resolveConnectionSides,
} from '@/lib/miro-canvas-map'

const FORMATTABLE_ELEMENT_TYPES: CanvasElement['type'][] = ['sticky', 'frame', 'table', 'doc', 'shape']

const CANVAS_BASE_W = 2000
const CANVAS_BASE_H = 1400

interface StudyPanel {
  id: string
  user_id: string
  title: string
  description?: string
  bible_version: string
  prophet_assistance: boolean
  theme?: string
  status: 'active' | 'archived' | 'draft'
  created_at: string
  updated_at: string
}

const bibleVersions = [
  'King James 1611',
  'Almeida Revista e Corrigida (ARC)',
  'Almeida Revista e Atualizada (ARA)',
  'Nova Versão Internacional (NVI)',
  'Nova Tradução na Linguagem de Hoje (NTLH)',
]

function toolToPaletteKind(tool: MiroToolId): PaletteDropKind | null {
  switch (tool) {
    case 'select':
      return null
    case 'sticky':
    case 'text':
    case 'title':
    case 'emoji':
      return null
    case 'draw':
      return 'draw'
    case 'frame':
    case 'rect':
      return 'frame'
    case 'table':
      return 'table'
    case 'doc':
      return 'doc'
    case 'connect':
      return 'map'
    default:
      return 'verse'
  }
}

export default function BibleStudyMiroPageClient() {
  const { user, signOut, loading: authLoading } = useSupabaseAuth()
  const [panels, setPanels] = useState<StudyPanel[]>([])
  const [currentPanel, setCurrentPanel] = useState<StudyPanel | null>(null)
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([])
  const [connections, setConnections] = useState<CanvasConnection[]>([])
  const [step, setStep] = useState(1)
  const [panelConfig, setPanelConfig] = useState({
    title: '',
    description: '',
    bible_version: 'King James 1611',
    prophet_assistance: true,
    theme: '',
  })
  const canvasScrollRef = useRef<HTMLDivElement | null>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const [lineStyle, setLineStyle] = useState<ConnectionLineStyle>('arrow')
  const [connectArmed, setConnectArmed] = useState(false)
  const [connectFromId, setConnectFromId] = useState<string | null>(null)
  const [connectFromSide, setConnectFromSide] = useState<ConnectionSide | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [editingElementId, setEditingElementId] = useState<string | null>(null)
  const [activeMobileTool, setActiveMobileTool] = useState('select')
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const scaleModifier = useMemo<Modifier>(
    () =>
      ({ transform, active }) => {
        if (!active) return transform
        const d = active.data.current as { fromPalette?: boolean } | undefined
        if (d?.fromPalette) return transform
        const s = canvasScale
        return { ...transform, x: transform.x / s, y: transform.y / s }
      },
    [canvasScale]
  )

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    loadPanels(user.id)
  }, [user, authLoading, router])

  useEffect(() => {
    if (!currentPanel) {
      setCanvasElements([])
      setConnections([])
      setSelectedElementId(null)
      setSelectedConnectionId(null)
      setEditingElementId(null)
      return
    }
    setSelectedElementId(null)
    setSelectedConnectionId(null)
    setEditingElementId(null)
    loadCanvasData(currentPanel.id)
    loadConnections(currentPanel.id)
  }, [currentPanel?.id])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          handleDeleteElement(selectedElementId)
        } else if (selectedConnectionId) {
          handleDeleteConnection(selectedConnectionId)
        }
        return
      }
      if (e.key !== 'Escape') return
      if (connectArmed) {
        setConnectArmed(false)
        setConnectFromId(null)
        setConnectFromSide(null)
      }
      setEditingElementId(null)
      setSelectedElementId(null)
      setSelectedConnectionId(null)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [connectArmed, selectedElementId, selectedConnectionId])

  const loadPanels = async (userId: string) => {
    const { data } = await supabase
      .from('bible_study_panels')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    setPanels(data || [])
  }

  const loadPanel = async (panelId: string) => {
    const { data } = await supabase
      .from('bible_study_panels')
      .select('*')
      .eq('id', panelId)
      .single()
    setCurrentPanel(data)
  }

  const loadConnections = async (panelId: string) => {
    console.log('[loadConnections] Loading connections for panel:', panelId)
    const [{ data: legacyRows }, { data: canvasRows, error: canvasErr }] = await Promise.all([
      supabase.from('card_connections').select('*').eq('panel_id', panelId),
      supabase.from('canvas_connections').select('*').eq('panel_id', panelId),
    ])
    console.log('[loadConnections] canvasRows:', canvasRows)
    console.log('[loadConnections] canvasErr:', canvasErr)
    
    const legacyList = connectionsToCanvasConnections(legacyRows || [])
    const canvasList =
      !canvasErr && canvasRows?.length
        ? canvasRows.map((row) => {
            console.log('[loadConnections] Processing row:', row)
            return canvasConnectionFromDb(row as Record<string, unknown>)
          })
        : []
    console.log('[loadConnections] Final canvasList:', canvasList)
    setConnections([...canvasList, ...legacyList])
  }

  const saveCanvasConnection = useCallback(
    async (c: CanvasConnection) => {
      const pid = currentPanel?.id
      if (!pid) return
      const { error } = await supabase.from('canvas_connections').upsert({
        id: c.id,
        panel_id: pid,
        from_element_id: c.fromElementId,
        to_element_id: c.toElementId,
        line_style: c.lineStyle ?? 'straight',
        label: c.label ?? null,
        from_side: c.fromSide ?? null,
        to_side: c.toSide ?? null,
        stroke_width: c.strokeWidth ?? null,
        stroke_color: c.strokeColor ?? null,
        dash_style: c.dashStyle ?? null,
        end_cap: c.endCap ?? null,
        waypoints: c.waypoints ?? null,
      }, { onConflict: 'id' })
      if (error) console.warn('[saveCanvasConnection] Error:', error.message, error)
    },
    [currentPanel?.id]
  )

  const saveCanvasElements = useCallback(
    async (elements: CanvasElement[], panelId?: string) => {
      const pid = panelId ?? currentPanel?.id
      if (!pid) return

      // Filter out elements with invalid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const validElements = elements.filter(el => {
        const isValid = uuidRegex.test(el.id)
        if (!isValid) {
          console.error('[saveCanvasElements] Skipping element with invalid UUID:', el.id, el.type, el.text?.substring(0, 50))
        }
        return isValid
      })

      if (validElements.length !== elements.length) {
        console.warn(`[saveCanvasElements] Filtered out ${elements.length - validElements.length} elements with invalid UUIDs`)
      }

      // Use UPSERT (insert with onConflict) instead of delete+insert
      // This prevents 409 conflicts when elements already exist
      if (validElements.length === 0) {
        // If no elements, delete all for this panel
        await supabase.from('canvas_elements').delete().eq('panel_id', pid)
        return
      }

      const { error } = await supabase.from('canvas_elements').upsert(
        validElements.map((el) => ({
          id: el.id,
          panel_id: pid,
          type: el.type,
          text: el.text,
          color: el.color,
          x: Math.round(el.x),
          y: Math.round(el.y),
          width: el.width ? Math.round(el.width) : null,
          height: el.height ? Math.round(el.height) : null,
          data: el.data,
        })),
        { onConflict: 'id' }
      )

      if (error) {
        console.error('[saveCanvasElements] Error:', error.message)
      }
    },
    [currentPanel?.id]
  )

  const handleDeleteElement = useCallback(
    async (elementId: string) => {
      const pid = currentPanel?.id
      if (!pid) return
      
      // Remove from local state
      const updatedElements = canvasElements.filter((el) => el.id !== elementId)
      setCanvasElements(updatedElements)
      
      // Remove any connections connected to this element
      const updatedConnections = connections.filter(
        (c) => c.fromElementId !== elementId && c.toElementId !== elementId
      )
      setConnections(updatedConnections)
      
      // Clear selection
      setSelectedElementId(null)
      
      // Delete from Supabase
      await supabase.from('canvas_elements').delete().eq('id', elementId)
      
      // Save updated elements and connections
      await saveCanvasElements(updatedElements)
      
      // Delete connections from Supabase that were connected to this element
      const deletedConnectionIds = connections
        .filter((c) => c.fromElementId === elementId || c.toElementId === elementId)
        .map((c) => c.id)
      
      for (const connId of deletedConnectionIds) {
        await supabase.from('canvas_connections').delete().eq('id', connId)
      }
    },
    [currentPanel?.id, canvasElements, connections, saveCanvasElements]
  )

  const handleDeleteConnection = useCallback(
    async (connectionId: string) => {
      const pid = currentPanel?.id
      if (!pid) return
      
      // Remove from local state
      const updatedConnections = connections.filter((c) => c.id !== connectionId)
      setConnections(updatedConnections)
      
      // Clear selection
      setSelectedConnectionId(null)
      
      // Delete from Supabase
      await supabase.from('canvas_connections').delete().eq('id', connectionId)
    },
    [currentPanel?.id, connections]
  )

  const loadCanvasData = async (panelId: string) => {
    const { data: fromCanvas } = await supabase
      .from('canvas_elements')
      .select('*')
      .eq('panel_id', panelId)
      .order('created_at')

    if (fromCanvas?.length) {
      setCanvasElements(fromCanvas.map((row) => canvasElementFromDb(row as Record<string, unknown>)))
      return
    }

    const { data: cards } = await supabase
      .from('study_cards')
      .select('*')
      .eq('panel_id', panelId)
      .order('created_at')

    if (cards?.length) {
      // Detect mobile for vertical layout
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
      const mapped = studyCardsToCanvasElements(cards as StudyCardRow[], isMobile)
      setCanvasElements(mapped)
      await saveCanvasElements(mapped, panelId)
    } else {
      setCanvasElements([])
    }
  }

  const createPanel = async () => {
    if (!user) return
    if (!panelConfig.title.trim()) {
      alert('Por favor, digite um título para o painel')
      return
    }

    const { data, error } = await supabase
      .from('bible_study_panels')
      .insert({
        user_id: user.id,
        title: panelConfig.title,
        description: panelConfig.description,
        bible_version: panelConfig.bible_version,
        prophet_assistance: panelConfig.prophet_assistance,
        theme: panelConfig.theme,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Erro ao criar painel. Tente novamente.')
      return
    }

    await loadPanels(user.id)
    setCurrentPanel(data)
    setPanelConfig({
      title: '',
      description: '',
      bible_version: 'King James 1611',
      prophet_assistance: true,
      theme: '',
    })
    setStep(1)
  }

  const handleCardsGenerated = async (cards: any[], newConnections: any[]) => {
    if (!currentPanel) return
    const rows = (cards || []) as StudyCardRow[]
    if (!rows.length) return

    // Detect mobile for vertical stacking layout
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    // Convert cards to canvas elements - mobile gets vertical alignment
    const newEls = studyCardsToCanvasElements(rows, isMobile)
    
    // Add animation effect for new cards
    newEls.forEach((element) => {
      element.data = {
        ...element.data,
        isNew: true,
        generatedAt: Date.now()
      }
    })

    setCanvasElements((prev) => {
      const merged = mergeCanvasElements(prev, newEls)
      void saveCanvasElements(merged)
      return merged
    })

    if (newConnections?.length) {
      const mapped = connectionsToCanvasConnections(newConnections)
      setConnections((prev) => {
        const byId = new Map(prev.map((c) => [c.id, c]))
        for (const c of mapped) byId.set(c.id, c)
        return Array.from(byId.values())
      })
    } else {
      await loadConnections(currentPanel.id)
    }

    // Remove the "new" indicator after animation
    setTimeout(() => {
      setCanvasElements((prev) => 
        prev.map(el => ({
          ...el,
          data: {
            ...el.data,
            isNew: false
          }
        }))
      )
    }, 2000)
  }

  const addElementAt = (kind: PaletteDropKind, x: number, y: number) => {
    if (!currentPanel) return
    const theme = currentPanel.theme
    const el = createPaletteElement(kind, x, y, theme)
    setCanvasElements((prev) => {
      const merged = mergeCanvasElements(prev, [el])
      void saveCanvasElements(merged)
      return merged
    })
    setSelectedElementId(el.id)
    setEditingElementId(null)
  }

  const addShapeAt = (kind: CanvasShapeKind, x: number, y: number) => {
    if (!currentPanel) return
    const el = createShapeElement(kind, x, y)
    setCanvasElements((prev) => {
      const merged = mergeCanvasElements(prev, [el])
      void saveCanvasElements(merged)
      return merged
    })
    setSelectedElementId(el.id)
    setEditingElementId(null)
  }

  const addShapeAtViewportCenter = (kind: CanvasShapeKind) => {
    const scroll = canvasScrollRef.current
    const s = canvasScale
    const cx = scroll
      ? (scroll.scrollLeft + scroll.clientWidth / 2) / s - 64 + Math.random() * 16
      : 400
    const cy = scroll
      ? (scroll.scrollTop + scroll.clientHeight / 2) / s - 60 + Math.random() * 16
      : 320
    addShapeAt(
      kind,
      Math.max(20, Math.min(CANVAS_BASE_W - 140, cx)),
      Math.max(20, Math.min(CANVAS_BASE_H - 120, cy))
    )
  }

  const onConnectToolbarClick = () => {
    setConnectArmed((a) => !a)
    setConnectFromId(null)
    setConnectFromSide(null)
    setSelectedConnectionId(null)
  }

  const handleConnectPick = useCallback(
    (elementId: string, side?: ConnectionSide) => {
      if (!connectArmed || !currentPanel) return
      if (!connectFromId) {
        setConnectFromId(elementId)
        setConnectFromSide(side ?? null)
        return
      }
      if (connectFromId === elementId) {
        setConnectFromId(null)
        setConnectFromSide(null)
        return
      }
      const fromEl = canvasElements.find((e) => e.id === connectFromId)
      const toEl = canvasElements.find((e) => e.id === elementId)
      if (!fromEl || !toEl) return
      const { fromSide: fs, toSide: ts } = resolveConnectionSides(
        fromEl,
        toEl,
        connectFromSide ?? undefined,
        side ?? undefined
      )
      const newConn: CanvasConnection = {
        id: uuidv4(),
        fromElementId: connectFromId,
        toElementId: elementId,
        lineStyle,
        fromSide: fs,
        toSide: ts,
      }
      setConnections((prev) => [...prev, newConn])
      void saveCanvasConnection(newConn)
      setConnectFromId(null)
      setConnectFromSide(null)
    },
    [canvasElements, connectArmed, connectFromId, connectFromSide, currentPanel, lineStyle, saveCanvasConnection]
  )

  const handleConnectByWire = useCallback(
    (fromId: string, fromSide: ConnectionSide, toId: string, toSide: ConnectionSide) => {
      if (!currentPanel || fromId === toId) return
      setConnections((prev) => {
        if (prev.some((c) => c.fromElementId === fromId && c.toElementId === toId)) return prev
        const newConn: CanvasConnection = {
          id: uuidv4(),
          fromElementId: fromId,
          toElementId: toId,
          lineStyle,
          fromSide,
          toSide,
        }
        void saveCanvasConnection(newConn)
        return [...prev, newConn]
      })
    },
    [currentPanel, lineStyle, saveCanvasConnection]
  )

  const handleUpdateElementData = useCallback(
    (id: string, dataPatch: Record<string, unknown>) => {
      setCanvasElements((prev) => {
        const next = prev.map((e) =>
          e.id === id ? { ...e, data: { ...(e.data || {}), ...dataPatch } } : e
        )
        void saveCanvasElements(next)
        return next
      })
    },
    [saveCanvasElements]
  )

  const patchTextCardStyle = useCallback(
    (patch: Partial<TextCardStyleState>) => {
      if (!selectedElementId) return
      setCanvasElements((prev) => {
        const next = prev.map((e) => {
          if (e.id !== selectedElementId || !FORMATTABLE_ELEMENT_TYPES.includes(e.type)) return e
          const cur = getBoxStyle(e)
          return {
            ...e,
            data: { ...(e.data || {}), style: { ...cur, ...patch } },
          }
        })
        void saveCanvasElements(next)
        return next
      })
    },
    [selectedElementId, saveCanvasElements]
  )

  const handleResizeTextCard = useCallback(
    (id: string, rect: { x: number; y: number; width: number; height: number }) => {
      setCanvasElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...rect } : e)))
    },
    []
  )

  const handleResizeTextCardEnd = useCallback(() => {
    setCanvasElements((prev) => {
      void saveCanvasElements(prev)
      return prev
    })
  }, [saveCanvasElements])

  const handleCommitText = useCallback(
    (id: string, text: string) => {
      setEditingElementId(null)
      setCanvasElements((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, text } : e))
        void saveCanvasElements(next)
        return next
      })
    },
    [saveCanvasElements]
  )

  const selectedFormatElement = useMemo(
    () =>
      canvasElements.find((e) => e.id === selectedElementId && FORMATTABLE_ELEMENT_TYPES.includes(e.type)) ??
      null,
    [canvasElements, selectedElementId]
  )

  const selectedConnection = useMemo(
    () => connections.find((c) => c.id === selectedConnectionId) ?? null,
    [connections, selectedConnectionId]
  )

  const patchConnection = useCallback(
    async (patch: Partial<CanvasConnection>) => {
      console.log('[patchConnection] Called with:', patch, 'selectedConnectionId:', selectedConnectionId)
      if (!selectedConnectionId) return
      setConnections((prev) =>
        prev.map((c) => (c.id === selectedConnectionId ? { ...c, ...patch } : c))
      )
      const row: Record<string, unknown> = {}
      if (patch.lineStyle !== undefined) row.line_style = patch.lineStyle
      if (patch.strokeWidth !== undefined) row.stroke_width = patch.strokeWidth
      if (patch.strokeColor !== undefined) row.stroke_color = patch.strokeColor
      if (patch.dashStyle !== undefined) row.dash_style = patch.dashStyle
      if (patch.endCap !== undefined) row.end_cap = patch.endCap
      if (patch.waypoints !== undefined) row.waypoints = patch.waypoints
      console.log('[patchConnection] Saving to Supabase:', row)
      if (Object.keys(row).length === 0) {
        console.log('[patchConnection] Nothing to save, skipping')
        return
      }
      const { error, data } = await supabase
        .from('canvas_connections')
        .update(row)
        .eq('id', selectedConnectionId)
        .select()
      if (error) {
        console.error('[patchConnection] Error:', error.message, error)
      } else {
        console.log('[patchConnection] Success:', data)
      }
    },
    [selectedConnectionId]
  )

  const handleTool = (tool: MiroToolId) => {
    setConnectArmed(false)
    setConnectFromId(null)
    setConnectFromSide(null)
    setSelectedConnectionId(null)
    if (!currentPanel) return

    if (tool === 'text' || tool === 'sticky' || tool === 'title' || tool === 'emoji') {
      const scroll = canvasScrollRef.current
      const s = canvasScale
      const cx = scroll
        ? (scroll.scrollLeft + scroll.clientWidth / 2) / s - 80 + Math.random() * 12
        : 400
      const cy = scroll
        ? (scroll.scrollTop + scroll.clientHeight / 2) / s - 80 + Math.random() * 12
        : 320
      const variant =
        tool === 'text' ? 'text' : tool === 'title' ? 'title' : tool === 'emoji' ? 'emoji' : 'sticky'
      const el = createTextLikeCard(
        variant,
        Math.max(20, Math.min(CANVAS_BASE_W - 160, cx)),
        Math.max(20, Math.min(CANVAS_BASE_H - 140, cy))
      )
      setCanvasElements((prev) => {
        const merged = mergeCanvasElements(prev, [el])
        void saveCanvasElements(merged)
        return merged
      })
      setSelectedElementId(el.id)
      setEditingElementId(null)
      return
    }

    const kind = toolToPaletteKind(tool)
    if (!kind) return
    const scroll = canvasScrollRef.current
    const s = canvasScale
    const cx = scroll
      ? (scroll.scrollLeft + scroll.clientWidth / 2) / s - 80 + Math.random() * 24
      : 400
    const cy = scroll
      ? (scroll.scrollTop + scroll.clientHeight / 2) / s - 80 + Math.random() * 24
      : 320
    addElementAt(
      kind,
      Math.max(40, Math.min(CANVAS_BASE_W - 120, cx)),
      Math.max(40, Math.min(CANVAS_BASE_H - 120, cy))
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    const activeData = active.data.current as
      | { fromPalette?: boolean; kind?: string; canvasItem?: boolean }
      | undefined

    if (activeData?.fromPalette) {
      if (over?.id === 'miro-canvas-drop' && currentPanel) {
        const scroll = canvasScrollRef.current
        const ae = event.activatorEvent
        if (scroll && ae && 'clientX' in ae) {
          const start = ae as PointerEvent
          const endX = start.clientX + delta.x
          const endY = start.clientY + delta.y
          const r = scroll.getBoundingClientRect()
          const scrollX = scroll.scrollLeft + (endX - r.left)
          const scrollY = scroll.scrollTop + (endY - r.top)
          const s = canvasScale
          const x = Math.max(0, Math.min(CANVAS_BASE_W - 40, scrollX / s))
          const y = Math.max(0, Math.min(CANVAS_BASE_H - 40, scrollY / s))
          const kind = activeData.kind as PaletteDropKind
          addElementAt(kind, x, y)
        }
      }
      return
    }

    const elId = String(active.id)
    console.log('[handleDragEnd] Dragging element:', elId, 'delta:', delta)
    
    setCanvasElements((prev) => {
      const el = prev.find((e) => e.id === elId)
      if (!el) {
        console.warn('[handleDragEnd] Element not found:', elId)
        return prev
      }
      
      // Defensive check for element properties
      if (typeof el.x !== 'number' || typeof el.y !== 'number') {
        console.warn('[handleDragEnd] Element has invalid position:', el)
        return prev
      }
      
      // delta already comes with scale modifier applied
      let newX = Math.max(0, el.x + delta.x)
      let newY = Math.max(0, el.y + delta.y)
      
      const elWidth = el.width ?? 220
      const elHeight = el.height ?? 160
      
      console.log('[handleDragEnd] New position calculated:', { newX, newY, elWidth, elHeight })
      
      const updated = prev.map((e) =>
        e.id === elId ? { ...e, x: newX, y: newY } : e
      )
      void saveCanvasElements(updated)
      return updated
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  if (currentPanel) {
    return (
      <div className="h-screen w-screen flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
        {/* Mobile Top Bar - Highest z-index */}
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
          {/* Novo Estudo Button */}
          <button
            onClick={() => setCurrentPanel(null)}
            className="flex items-center gap-2 border border-gray-300 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span>Novo Estudo</span>
          </button>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Compartilhar Button */}
            <button
              onClick={() => console.log('Share clicked')}
              className="flex items-center gap-2 border border-gray-300 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span>Compartilhar</span>
            </button>

            {/* Profeta Branham Badge */}
            <div className="flex items-center gap-2 border border-gray-300 dark:border-slate-700 rounded-full px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                PB
              </div>
              <span className="text-gray-700 dark:text-slate-200 text-sm font-medium hidden sm:inline">
                Profeta Branham
              </span>
            </div>
          </div>
        </div>

        {/* Main Canvas Area - FULL PAGE */}
        <div className="flex-1 relative z-0 h-screen">
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            modifiers={[scaleModifier]}
            onDragEnd={handleDragEnd}
          >
            {/* Canvas Container - Full page sem rounded corners no mobile */}
            <div 
              ref={canvasScrollRef}
              className="absolute inset-0 overflow-auto bg-white dark:bg-slate-950 pt-[70px] pb-[200px] lg:pb-[180px] touch-pan-y"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {/* Empty State Card */}
              {canvasElements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                  <EmptyStateCard
                    panel={currentPanel}
                    onGenerate={(elements, conns) => {
                      setCanvasElements(elements)
                      setConnections(conns)
                      saveCanvasElements(elements)
                      conns.forEach(async (c) => {
                        await supabase.from('canvas_connections').insert({
                          id: c.id,
                          panel_id: currentPanel.id,
                          from_element_id: c.fromElementId,
                          to_element_id: c.toElementId,
                          line_style: c.lineStyle,
                          label: c.label,
                        })
                      })
                    }}
                  />
                </div>
              )}

              {/* Canvas Elements - Full width no mobile */}
              <div 
                className="relative min-w-[1000px] lg:min-w-[2000px] min-h-[1000px] lg:min-h-[1400px] p-4 lg:p-8"
                style={{ touchAction: 'pan-y pan-x' }}
              >
                <MiroCanvas
                  elements={canvasElements}
                  connections={connections}
                  scrollRef={canvasScrollRef}
                  scale={canvasScale}
                  onScaleChange={setCanvasScale}
                  connectMode={connectArmed}
                  connectSourceId={connectFromId}
                  connectPendingSide={connectFromSide}
                  onConnectPick={handleConnectPick}
                  onConnectByWire={handleConnectByWire}
                  onConnectWireDragStart={() => {
                    setConnectFromId(null)
                    setConnectFromSide(null)
                    setSelectedConnectionId(null)
                  }}
                  selectedElementId={selectedElementId}
                  editingElementId={editingElementId}
                  onSelectElement={(id) => {
                    setSelectedConnectionId(null)
                    setSelectedElementId(id)
                  }}
                  onDeselectCanvas={() => {
                    setSelectedElementId(null)
                    setEditingElementId(null)
                    setSelectedConnectionId(null)
                  }}
                  selectedConnectionId={selectedConnectionId}
                  onSelectConnection={(id) => {
                    setSelectedElementId(null)
                    setEditingElementId(null)
                    setSelectedConnectionId(id)
                  }}
                  onUpdateConnection={(id, patch) => {
                    setConnections((prev) => {
                      const updated = prev.map((c) =>
                        c.id === id ? { ...c, ...patch } : c
                      )
                      const conn = updated.find((c) => c.id === id)
                      if (conn && currentPanel) {
                        supabase.from('canvas_connections').update({
                          waypoints: conn.waypoints,
                          line_style: conn.lineStyle,
                          stroke_width: conn.strokeWidth,
                          stroke_color: conn.strokeColor,
                          dash_style: conn.dashStyle,
                          end_cap: conn.endCap,
                          from_side: conn.fromSide,
                          to_side: conn.toSide,
                          label: conn.label,
                        }).eq('id', id)
                      }
                      return updated
                    })
                  }}
                  onStartEdit={setEditingElementId}
                  onCommitText={handleCommitText}
                  onUpdateElementData={handleUpdateElementData}
                  onResizeTextCard={handleResizeTextCard}
                  onResizeTextCardEnd={handleResizeTextCardEnd}
                />
              </div>
            </div>
          </DndContext>
        </div>

        {/* FLOATING FORMAT BARS - aparecem quando elemento está selecionado */}
        {selectedFormatElement && (
          <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[90] max-w-[90vw]">
            <MiroTextFormatBar
              element={selectedFormatElement}
              onPatchStyle={patchTextCardStyle}
            />
          </div>
        )}

        {selectedConnection && (
          <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[90] max-w-[90vw]">
            <MiroConnectionFormatBar
              connection={selectedConnection}
              onPatch={patchConnection}
            />
          </div>
        )}

        {/* BOTTOM CONTAINER - FLOATING TOOLBAR COM FUNÇÕES REAIS */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-700 shadow-lg p-2 lg:p-3 safe-area-pb">
          {/* Bottom Navigation - Toolbar com ações reais */}
          <div className="flex items-center justify-center gap-1 bg-slate-900 dark:bg-slate-950 rounded-2xl p-2 mb-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'select', icon: MousePointer2, label: 'Selecionar', action: () => handleTool('select') },
              { id: 'text', icon: Type, label: 'Texto', action: () => handleTool('text') },
              { id: 'sticky', icon: FileText, label: 'Nota', action: () => handleTool('sticky') },
              { id: 'title', icon: Heading, label: 'Título', action: () => handleTool('title') },
              { id: 'draw', icon: PenTool, label: 'Desenhar', action: () => handleTool('draw') },
              { id: 'table', icon: Grid3X3, label: 'Tabela', action: () => handleTool('table') },
              { id: 'frame', icon: Shapes, label: 'Frame', action: () => handleTool('frame') },
              { id: 'emoji', icon: ImageIcon, label: 'Emoji', action: () => handleTool('emoji') },
            ].map((tool) => {
              const Icon = tool.icon
              const isActive = activeMobileTool === tool.id
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveMobileTool(tool.id)
                    tool.action()
                  }}
                  className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[44px] min-h-[44px] active:scale-95 ${
                    isActive 
                      ? "bg-orange-500 text-white shadow-inner" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              )
            })}
          </div>

          {/* Input Bar com funcionalidade real */}
          <div className="flex items-center gap-2 px-1">
            {/* Input Field */}
            <input
              type="text"
              placeholder="Pergunte à Bíblia ou ao Profeta..."
              className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-full px-4 py-3 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />

            {/* Send Button - funcional */}
            <button 
              onClick={() => console.log('Send clicked')}
              className="p-3 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl mb-6">
            <span className="text-primary-foreground text-3xl">📖</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-4">
            Estudos Bíblicos — Modo Miro
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Canvas interativo com IA, tema do painel e auxílio do Profeta
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl blur-3xl" />
          <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl shadow-2xl p-10 mb-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Criar painel ou abrir existente</h2>
              <p className="text-muted-foreground">
                Mesmo fluxo do estudo bíblico: duas etapas para configurar versão e Profeta
              </p>
            </div>

            {step === 1 && (
              <div className="space-y-8 max-w-xl mx-auto">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-base font-medium">
                    Título do estudo
                  </Label>
                  <Input
                    id="title"
                    value={panelConfig.title}
                    onChange={(e) => setPanelConfig({ ...panelConfig, title: e.target.value })}
                    placeholder="Ex.: Os sete selos"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={panelConfig.description}
                    onChange={(e) => setPanelConfig({ ...panelConfig, description: e.target.value })}
                    placeholder="Foco do estudo..."
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="theme">Tema principal</Label>
                  <Input
                    id="theme"
                    value={panelConfig.theme}
                    onChange={(e) => setPanelConfig({ ...panelConfig, theme: e.target.value })}
                    placeholder="Ex.: Escatologia, cura divina..."
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full h-14 rounded-xl font-medium"
                >
                  Continuar
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 max-w-xl mx-auto">
                <div className="space-y-3">
                  <Label htmlFor="bible_version">Versão bíblica</Label>
                  <select
                    id="bible_version"
                    value={panelConfig.bible_version}
                    onChange={(e) =>
                      setPanelConfig({ ...panelConfig, bible_version: e.target.value })
                    }
                    className="w-full h-12 px-4 border border-border rounded-xl bg-background"
                  >
                    {bibleVersions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 p-6 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="prophet_assistance"
                      checked={panelConfig.prophet_assistance}
                      onCheckedChange={(checked) =>
                        setPanelConfig({ ...panelConfig, prophet_assistance: checked === true })
                      }
                    />
                    <div>
                      <Label htmlFor="prophet_assistance" className="text-base font-semibold cursor-pointer">
                        Auxílio do Profeta Branham
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Incluir ensinamentos do Profeta William Branham nas respostas da IA
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1 h-14 rounded-xl" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button type="button" className="flex-1 h-14 rounded-xl font-medium" onClick={createPanel}>
                    Criar painel (Modo Miro)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              Seus painéis
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {panels.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum painel ainda</p>
              ) : (
                panels.map((panel) => (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => loadPanel(panel.id)}
                    className="w-full text-left p-4 bg-gradient-to-r from-background/50 to-muted/30 border border-border rounded-2xl hover:border-primary/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold">{panel.title}</span>
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        {panel.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">{panel.bible_version}</div>
                    {panel.prophet_assistance && (
                      <div className="mt-2 text-xs text-primary">Com auxílio do Profeta</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="fixed top-6 right-6 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem>
                <UserIcon className="mr-3 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-3 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
