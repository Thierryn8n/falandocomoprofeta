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
import FloatingInputBar from '@/components/bible-study/floating-input-bar'
import { Button } from '@/components/ui/button'
import { BookOpen, UserIcon, LogOut } from 'lucide-react'
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
  const [selectedTool, setSelectedTool] = useState<MiroToolId | null>(null)
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

  const handleDeleteSelected = useCallback(() => {
    if (!selectedElementId) return
    
    setCanvasElements((prev) => {
      const filtered = prev.filter((el) => el.id !== selectedElementId)
      void saveCanvasElements(filtered)
      return filtered
    })
    setSelectedElementId(null)
    setEditingElementId(null)
  }, [selectedElementId, saveCanvasElements])

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
    
    const deleteFn = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          handleDeleteSelected()
        } else if (selectedConnectionId) {
          handleDeleteSelectedConnection()
        }
      }
    }
    
    window.addEventListener('keydown', fn)
    window.addEventListener('keydown', deleteFn)
    return () => {
      window.removeEventListener('keydown', fn)
      window.removeEventListener('keydown', deleteFn)
    }
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
    const { data: fromConnections } = await supabase
      .from('canvas_connections')
      .select('*')
      .eq('panel_id', panelId)
      .order('created_at')

    if (fromConnections?.length) {
      setConnections(fromConnections.map((row) => canvasConnectionFromDb(row as Record<string, unknown>)))
      return
    }
    setConnections([])
  }

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
    setCanvasElements([])
  }

  const saveCanvasElements = useCallback(
    async (elements: CanvasElement[], panelId?: string) => {
      const pid = panelId ?? currentPanel?.id
      if (!pid) return
      await supabase.from('canvas_elements').delete().eq('panel_id', pid)
      if (elements.length === 0) return
      await supabase.from('canvas_elements').insert(
        elements.map((el) => ({
          panel_id: pid,
          type: el.type,
          text: el.text,
          color: el.color,
          x: Math.round(el.x),
          y: Math.round(el.y),
          width: el.width,
  const saveCanvasConnection = useCallback(
    async (c: CanvasConnection) => {
      const pid = currentPanel?.id
      if (!pid) return
      const { error } = await supabase.from('canvas_connections').insert({
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
      })
      if (error && error.code !== '23505') console.warn('canvas_connections:', error.message)
    },
    [currentPanel?.id]
  )

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

    const newEls = studyCardsToCanvasElements(rows)
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
      if (Object.keys(row).length === 0) return
      const { error } = await supabase
        .from('canvas_connections')
        .update(row)
        .eq('id', selectedConnectionId)
      if (error) console.warn('canvas_connections update:', error.message)
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
    setCanvasElements((prev) => {
      const el = prev.find((e) => e.id === elId)
      if (!el) return prev
      // delta já vem com o modifier de escala aplicado (coordenadas do canvas)
      const newX = Math.max(0, el.x + delta.x)
      const newY = Math.max(0, el.y + delta.y)
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
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <MiroTopBar
          panel={currentPanel}
          onNewStudy={() => {
            setCurrentPanel(null)
          }}
        />

        <div className="flex flex-1 min-h-0 flex-col">
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            modifiers={[scaleModifier]}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <MiroLeftToolbar
                onTool={setSelectedTool}
                onAddShape={addShapeAtViewportCenter}
                lineStyle={lineStyle}
                onLineStyleChange={setLineStyle}
                connectArmed={connectArmed}
                onConnectToolbarClick={onConnectToolbarClick}
                selectedElementId={selectedElementId}
                onDeleteSelected={handleDeleteSelected}
              />

              <div className="flex-1 relative min-h-0 overflow-hidden bg-background">
                {selectedFormatElement && !connectArmed && (
                  <div className="pointer-events-none absolute bottom-20 left-0 right-0 z-[70] flex justify-center px-2">
                    <MiroTextFormatBar 
                      element={selectedFormatElement} 
                      onPatchStyle={patchTextCardStyle} 
                      onDelete={handleDeleteSelected}
                    />
                  </div>
                )}
                {selectedConnection && !connectArmed && (
                  <div className="pointer-events-none absolute bottom-20 left-0 right-0 z-[71] flex justify-center px-2">
                    <MiroConnectionFormatBar connection={selectedConnection} onPatch={patchConnection} />
                  </div>
                )}
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
                  onStartEdit={setEditingElementId}
                  onCommitText={handleCommitText}
                  onUpdateElementData={handleUpdateElementData}
                  onResizeTextCard={handleResizeTextCard}
                  onResizeTextCardEnd={handleResizeTextCardEnd}
                />
              </div>
            </div>
          </DndContext>

          <FloatingInputBar
            panelId={currentPanel.id}
            onCardsGenerated={handleCardsGenerated}
            variant="dock"
          />
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
