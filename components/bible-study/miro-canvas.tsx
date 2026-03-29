'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS, type Transform } from '@dnd-kit/utilities'
import { Settings2, GripVertical } from 'lucide-react'
import type {
  CanvasConnection,
  CanvasElement,
  CanvasShapeKind,
  ConnectionSide,
} from '@/lib/miro-canvas-map'
import {
  getBoxStyle,
  connectionAnchorPoint,
  resolveConnectionSides,
  connectionStrokeDashArray,
  connectionEndShowsArrow,
  connectionResolvedStroke,
} from '@/lib/miro-canvas-map'

const CANVAS_BASE_W = 2000
const CANVAS_BASE_H = 1400

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se'

function computeResize(
  corner: ResizeCorner,
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number
) {
  const minW = 72
  const minH = 40
  let x = start.x
  let y = start.y
  let w = start.w
  let h = start.h
  switch (corner) {
    case 'se':
      w = Math.max(minW, start.w + dx)
      h = Math.max(minH, start.h + dy)
      break
    case 'sw':
      w = Math.max(minW, start.w - dx)
      h = Math.max(minH, start.h + dy)
      x = start.x + (start.w - w)
      break
    case 'ne':
      w = Math.max(minW, start.w + dx)
      h = Math.max(minH, start.h - dy)
      y = start.y + (start.h - h)
      break
    case 'nw':
      w = Math.max(minW, start.w - dx)
      h = Math.max(minH, start.h - dy)
      x = start.x + (start.w - w)
      y = start.y + (start.h - h)
      break
  }
  return { x, y, width: w, height: h }
}

function canvasWheelZoomHandler(scale: number, onScaleChange: (next: number) => void) {
  return (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const next = Math.min(3, Math.max(0.25, scale * factor))
    if (next !== scale) onScaleChange(next)
  }
}

function tableRows(element: CanvasElement): { verse: string; revelation: string }[] {
  const d = element.data as { rows?: { verse: string; revelation: string }[] } | undefined
  if (d?.rows?.length) return d.rows
  if (Array.isArray(element.data)) return element.data as { verse: string; revelation: string }[]
  return []
}

function tableColumnLabels(element: CanvasElement): { verse: string; revelation: string } {
  const d = element.data as { tableColumnLabels?: { verse?: string; revelation?: string } } | undefined
  return {
    verse: d?.tableColumnLabels?.verse ?? 'Versículo',
    revelation: d?.tableColumnLabels?.revelation ?? 'Revelação',
  }
}

const CONNECT_SIDES: ConnectionSide[] = ['n', 'e', 's', 'w']

const SNAP_TO_ANCHOR_PX = 64
const REVEAL_ANCHOR_PAD = 100

/**
 * Converte coordenadas de tela para o espaço lógico do canvas (2000×1400),
 * usando o retângulo transformado do plano — evita erro com scroll + scale.
 */
function clientToCanvasLogicalCoords(
  planeEl: HTMLElement,
  clientX: number,
  clientY: number
) {
  const r = planeEl.getBoundingClientRect()
  const rw = r.width || 1
  const rh = r.height || 1
  const x = ((clientX - r.left) / rw) * CANVAS_BASE_W
  const y = ((clientY - r.top) / rh) * CANVAS_BASE_H
  return { x, y }
}

function isConnectableElement(el: CanvasElement): boolean {
  return (
    el.type === 'sticky' ||
    el.type === 'frame' ||
    el.type === 'table' ||
    el.type === 'doc' ||
    el.type === 'shape'
  )
}

function findBestSnap(
  elements: CanvasElement[],
  fromId: string,
  px: number,
  py: number,
  snapR: number
): { toId: string; toSide: ConnectionSide } | null {
  let best: { toId: string; toSide: ConnectionSide; d: number } | null = null
  for (const el of elements) {
    if (el.id === fromId || !isConnectableElement(el)) continue
    for (const side of CONNECT_SIDES) {
      const p = connectionAnchorPoint(el, side)
      const d = Math.hypot(p.x - px, p.y - py)
      if (d < snapR && (!best || d < best.d)) {
        best = { toId: el.id, toSide: side, d }
      }
    }
  }
  return best ? { toId: best.toId, toSide: best.toSide } : null
}

/** Snap na âncora próxima ou, se o ponteiro estiver sobre o card, na bolinha mais perto do soltar. */
function findWireDropTarget(
  elements: CanvasElement[],
  fromId: string,
  px: number,
  py: number,
  snapR: number
): { toId: string; toSide: ConnectionSide } | null {
  const nearAnchor = findBestSnap(elements, fromId, px, py, snapR)
  if (nearAnchor) return nearAnchor

  let best: { toId: string; toSide: ConnectionSide; d: number } | null = null
  for (const el of elements) {
    if (el.id === fromId || !isConnectableElement(el)) continue
    const r = rectOf(el)
    const pad = 14
    if (px < r.x - pad || px > r.x2 + pad || py < r.y - pad || py > r.y2 + pad) continue
    for (const side of CONNECT_SIDES) {
      const p = connectionAnchorPoint(el, side)
      const d = Math.hypot(p.x - px, p.y - py)
      if (!best || d < best.d) best = { toId: el.id, toSide: side, d }
    }
  }
  return best ? { toId: best.toId, toSide: best.toSide } : null
}

const ROUTE_MARGIN = 22

function rectOf(el: CanvasElement) {
  const w = el.width ?? 220
  const h = el.height ?? 160
  return { x: el.x, y: el.y, w, h, x2: el.x + w, y2: el.y + h }
}

function outwardOffset(el: CanvasElement, side: ConnectionSide, m: number) {
  const p = connectionAnchorPoint(el, side)
  const d = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] } as const
  const [dx, dy] = d[side]
  return { x: p.x + dx * m, y: p.y + dy * m }
}

function dedupePathPoints(points: { x: number; y: number }[]) {
  const out: { x: number; y: number }[] = []
  const eps = 0.25
  for (const p of points) {
    const last = out[out.length - 1]
    if (!last || Math.abs(last.x - p.x) > eps || Math.abs(last.y - p.y) > eps) out.push(p)
  }
  return out
}

/**
 * Shortest orthogonal path between two elements - takes direct route
 * without going around boxes unnecessarily.
 */
function buildShortestOrthogonalPath(
  fromEl: CanvasElement,
  fromSide: ConnectionSide,
  toEl: CanvasElement | null,
  toSide: ConnectionSide | null,
  cursorX?: number,
  cursorY?: number
): string {
  const pA = connectionAnchorPoint(fromEl, fromSide)
  const pExit = outwardOffset(fromEl, fromSide, 12) // Small exit margin

  if (!toEl || !toSide) {
    // Dragging to cursor - direct line
    const targetX = cursorX ?? pExit.x + 100
    const targetY = cursorY ?? pExit.y

    // Build simple orthogonal path
    const pts: { x: number; y: number }[] = [pA, pExit]

    // Add intermediate points for orthogonal routing
    if (fromSide === 'e' || fromSide === 'w') {
      // Horizontal exit
      const midX = (pExit.x + targetX) / 2
      pts.push({ x: midX, y: pExit.y }, { x: midX, y: targetY })
    } else {
      // Vertical exit
      const midY = (pExit.y + targetY) / 2
      pts.push({ x: pExit.x, y: midY }, { x: targetX, y: midY })
    }
    pts.push({ x: targetX, y: targetY })

    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }

  const pB = connectionAnchorPoint(toEl, toSide)
  const pApproach = outwardOffset(toEl, toSide, 12)

  // Check if direct path is clear (doesn't go through either box)
  const fromR = rectOf(fromEl)
  const toR = rectOf(toEl)

  // Build shortest orthogonal path
  const pts: { x: number; y: number }[] = [pA, pExit]

  // Determine routing based on relative positions
  const dx = pApproach.x - pExit.x
  const dy = pApproach.y - pExit.y

  if (fromSide === 'e' && toSide === 'w') {
    // Left to right connection - direct horizontal
    if (Math.abs(dy) < 20) {
      // Nearly aligned - straight line
      pts.push(pApproach, pB)
    } else {
      // L-shape: horizontal then vertical
      pts.push({ x: pApproach.x, y: pExit.y }, pApproach, pB)
    }
  } else if (fromSide === 'w' && toSide === 'e') {
    // Right to left
    if (Math.abs(dy) < 20) {
      pts.push(pApproach, pB)
    } else {
      pts.push({ x: pApproach.x, y: pExit.y }, pApproach, pB)
    }
  } else if (fromSide === 's' && toSide === 'n') {
    // Top to bottom
    if (Math.abs(dx) < 20) {
      pts.push(pApproach, pB)
    } else {
      pts.push({ x: pExit.x, y: pApproach.y }, pApproach, pB)
    }
  } else if (fromSide === 'n' && toSide === 's') {
    // Bottom to top
    if (Math.abs(dx) < 20) {
      pts.push(pApproach, pB)
    } else {
      pts.push({ x: pExit.x, y: pApproach.y }, pApproach, pB)
    }
  } else {
    // Mixed sides - use S-curve or Z-curve
    const midX = (pExit.x + pApproach.x) / 2
    const midY = (pExit.y + pApproach.y) / 2

    if (Math.abs(dx) > Math.abs(dy)) {
      // More horizontal distance - route horizontally first
      pts.push({ x: midX, y: pExit.y }, { x: midX, y: pApproach.y }, pApproach, pB)
    } else {
      // More vertical distance - route vertically first
      pts.push({ x: pExit.x, y: midY }, { x: pApproach.x, y: midY }, pApproach, pB)
    }
  }

  return dedupePathPoints(pts)
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
}

/** Conexão salva: usa caminho mais curto OU waypoints personalizados se existirem */
function buildConnectionPath(
  fromEl: CanvasElement,
  fromSide: ConnectionSide | undefined,
  toEl: CanvasElement,
  toSide: ConnectionSide | undefined,
  waypoints?: { x: number; y: number }[]
): string {
  // Se tem waypoints personalizados, use-os
  if (waypoints && waypoints.length > 0) {
    const pA = connectionAnchorPoint(fromEl, fromSide || 'e')
    const pB = connectionAnchorPoint(toEl, toSide || 'w')
    const pts = [pA, ...waypoints, pB]
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }
  // Caso contrário, use o caminho mais curto automático
  const { fromSide: fs, toSide: ts } = resolveConnectionSides(fromEl, toEl, fromSide, toSide)
  return buildShortestOrthogonalPath(fromEl, fs, toEl, ts)
}

/** @deprecated Use buildConnectionPath with waypoints support */
function buildShortestSavedPath(
  fromEl: CanvasElement,
  fromSide: ConnectionSide | undefined,
  toEl: CanvasElement,
  toSide: ConnectionSide | undefined
): string {
  const { fromSide: fs, toSide: ts } = resolveConnectionSides(fromEl, toEl, fromSide, toSide)
  return buildShortestOrthogonalPath(fromEl, fs, toEl, ts)
}

/** @deprecated Use buildShortestOrthogonalPath for better routing */
function buildOrthogonalWirePath(
  fromEl: CanvasElement,
  fromSide: ConnectionSide,
  toEl: CanvasElement | null,
  toSide: ConnectionSide | null,
  cursorX: number,
  cursorY: number
): string {
  const pA = connectionAnchorPoint(fromEl, fromSide)
  const pExit = outwardOffset(fromEl, fromSide, ROUTE_MARGIN)
  const fromR = rectOf(fromEl)
  const snapped = toEl && toSide

  const ux = snapped
    ? Math.max(fromR.x2, rectOf(toEl).x2)
    : Math.max(fromR.x2, cursorX)
  const extRight = ux + ROUTE_MARGIN

  const minY = snapped ? Math.min(fromR.y, rectOf(toEl).y) : Math.min(fromR.y, cursorY)
  const laneY = minY - ROUTE_MARGIN * 2

  const pts: { x: number; y: number }[] = [pA, pExit, { x: extRight, y: pExit.y }, { x: extRight, y: laneY }]

  if (snapped && toEl && toSide) {
    const pB = connectionAnchorPoint(toEl, toSide)
    const pApproach = outwardOffset(toEl, toSide, ROUTE_MARGIN)
    pts.push({ x: pApproach.x, y: laneY }, pApproach, pB)
  } else {
    pts.push({ x: cursorX, y: laneY }, { x: cursorX, y: cursorY })
  }

  return dedupePathPoints(pts)
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
}

/** @deprecated Use buildShortestSavedPath for better routing */
function buildOrthogonalSavedPath(
  fromEl: CanvasElement,
  fromSide: ConnectionSide | undefined,
  toEl: CanvasElement,
  toSide: ConnectionSide | undefined
): string {
  const { fromSide: fs, toSide: ts } = resolveConnectionSides(fromEl, toEl, fromSide, toSide)
  return buildShortestOrthogonalPath(fromEl, fs, toEl, ts)
}

function shouldRevealAnchorsNearPointer(
  el: CanvasElement,
  fromId: string,
  px: number,
  py: number
): boolean {
  if (el.id === fromId) return false
  if (!isConnectableElement(el)) return false
  const w = el.width || 220
  const h = el.height || 160
  const pad = REVEAL_ANCHOR_PAD
  const nearBox =
    px >= el.x - pad && px <= el.x + w + pad && py >= el.y - pad && py <= el.y + h + pad
  if (nearBox) return true
  for (const side of CONNECT_SIDES) {
    const p = connectionAnchorPoint(el, side)
    if (Math.hypot(p.x - px, p.y - py) < SNAP_TO_ANCHOR_PX * 2.2) return true
  }
  return false
}

function ConnectEdgeAnchors({
  show,
  anchorInteractive,
  isPendingSource,
  pendingSide,
  isWireSource,
  wireSourceSide,
  snapHighlightSide,
  onAnchorPointerDown,
}: {
  show: boolean
  /** Inicia arraste de fio (segurar e arrastar) */
  anchorInteractive: boolean
  isPendingSource: boolean
  pendingSide: ConnectionSide | null | undefined
  isWireSource: boolean
  wireSourceSide?: ConnectionSide | null
  snapHighlightSide?: ConnectionSide | null
  onAnchorPointerDown?: (side: ConnectionSide, e: React.PointerEvent) => void
}) {
  if (!show) return null
  return (
    <>
      {CONNECT_SIDES.map((side) => {
        const isPendingDot = Boolean(isPendingSource && pendingSide === side)
        const isOutgoing = Boolean(isWireSource && wireSourceSide === side)
        const isSnap = Boolean(snapHighlightSide === side)
        const isActive = isPendingDot || isOutgoing || isSnap
        const pos =
          side === 'n'
            ? 'inset-x-1/2 -top-1.5 h-3 w-3 -translate-x-1/2'
            : side === 's'
              ? 'inset-x-1/2 -bottom-1.5 h-3 w-3 -translate-x-1/2'
              : side === 'w'
                ? '-left-1.5 inset-y-1/2 h-3 w-3 -translate-y-1/2'
                : '-right-1.5 inset-y-1/2 h-3 w-3 -translate-y-1/2'
        const canDragWire = anchorInteractive && !!onAnchorPointerDown
        return (
          <button
            key={side}
            type="button"
            data-connect-anchor=""
            title={canDragWire ? 'Segure e arraste até outro card' : 'Ponto de conexão'}
            className={`absolute z-[100] flex items-center justify-center rounded-full transition-transform ${pos} ${
              canDragWire ? 'cursor-crosshair' : ''
            } -m-[14px] min-h-[44px] min-w-[44px] p-3 ${!canDragWire ? 'pointer-events-none' : ''}`}
            style={{ touchAction: 'none' }}
            onClick={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
            }}
            onPointerDownCapture={(ev) => {
              if (!canDragWire) return
              ev.stopPropagation()
            }}
            onPointerDown={(ev) => {
              console.log('[ConnectEdgeAnchors] PointerDown START:', side)
              console.log('  canDragWire:', canDragWire)
              console.log('  anchorInteractive:', anchorInteractive)
              console.log('  onAnchorPointerDown exists:', !!onAnchorPointerDown)
              console.log('  target:', ev.target)
              console.log('  button:', ev.button)
              if (!canDragWire) {
                console.log('[ConnectEdgeAnchors] BLOCKED - canDragWire is false')
                return
              }
              ev.preventDefault()
              ev.stopPropagation()
              console.log('[ConnectEdgeAnchors] Calling onAnchorPointerDown!')
              onAnchorPointerDown!(side, ev)
            }}
          >
            <span
              className={`flex items-center justify-center rounded-full border-2 border-slate-300 bg-white shadow-md ${
                isActive
                  ? 'h-8 w-8 border-orange-500 bg-orange-500 text-white'
                  : 'h-4 w-4'
              }`}
            >
              {isOutgoing || isPendingDot ? (
                <span className="text-sm font-bold leading-none">→</span>
              ) : null}
            </span>
          </button>
        )
      })}
    </>
  )
}

function shapeInnerStyle(kind: CanvasShapeKind): CSSProperties {
  switch (kind) {
    case 'square':
      return { borderRadius: 4 }
    case 'rounded-square':
      return { borderRadius: 16 }
    case 'circle':
      return { borderRadius: 9999 }
    case 'diamond':
      return {
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      }
    case 'star':
      return {
        clipPath:
          'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      }
    case 'triangle':
      return { clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }
    case 'speech-bubble':
      return { borderRadius: '1rem 1rem 1rem 0.35rem' }
    case 'arrow-block':
      return { clipPath: 'polygon(0% 0%, 72% 0%, 100% 50%, 72% 100%, 0% 100%)' }
    default:
      return { borderRadius: 16 }
  }
}

function ResizeCornerHandles({
  corner,
  cursor,
  className,
  onResizeStart,
}: {
  corner: ResizeCorner
  cursor: string
  className: string
  onResizeStart: (cornerArg: ResizeCorner, e: React.PointerEvent) => void
}) {
  return (
    <div
      role="presentation"
      className={`absolute z-[30] h-3.5 w-3.5 rounded-full border-2 border-[#2563eb] bg-white shadow-sm hover:scale-110 ${className}`}
      style={{ cursor, pointerEvents: 'auto', touchAction: 'none' }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onResizeStart(corner, e)
      }}
    />
  )
}

interface DraggableCanvasItemProps {
  element: CanvasElement
  scale: number
  connectMode?: boolean
  connectSourceId?: string | null
  /** Borda já escolhida no primeiro clique (modo conectar); só aplica ao card origem */
  connectPendingSide?: ConnectionSide | null
  /** Origem do fio durante arraste (segurar âncora) */
  wireDragMeta?: { fromId: string; fromSide: ConnectionSide } | null
  connectWireActive?: boolean
  onBeginConnectWire?: (side: ConnectionSide, e: React.PointerEvent) => void
  /** Durante arraste, mostrar bolinhas ao aproximar do cursor */
  revealWireAnchors?: boolean
  /** Prévia de encaixe na âncora destino */
  wireSnapHighlightSide?: ConnectionSide | null
  onConnectPick?: (id: string, side?: ConnectionSide) => void
  selectedElementId?: string | null
  editingElementId?: string | null
  onSelectElement?: (id: string) => void
  onStartEdit?: (id: string) => void
  onCommitText?: (id: string, text: string) => void
  onUpdateElementData?: (id: string, dataPatch: Record<string, unknown>) => void
  onResizeTextCard?: (
    id: string,
    rect: { x: number; y: number; width: number; height: number }
  ) => void
  onResizeTextCardEnd?: () => void
}

function TextCardItem({
  element,
  scale,
  connectMode,
  connectSourceId,
  connectPendingSide,
  wireDragMeta,
  connectWireActive,
  onBeginConnectWire,
  revealWireAnchors,
  wireSnapHighlightSide,
  onConnectPick,
  selectedElementId,
  editingElementId,
  onSelectElement,
  onStartEdit,
  onCommitText,
  onUpdateElementData,
  onResizeTextCard,
  onResizeTextCardEnd,
  isDragging,
  setNodeRef,
  transform,
  listeners,
  attributes,
}: DraggableCanvasItemProps & {
  isDragging: boolean
  setNodeRef: (n: HTMLDivElement | null) => void
  transform: Transform | null
  listeners: DraggableSyntheticListeners
  attributes: DraggableAttributes
}) {
  const [draft, setDraft] = useState(element.text)
  const frameSubtitle =
    (element.data as { frameSubtitle?: string } | undefined)?.frameSubtitle ?? ''
  const [frameSubDraft, setFrameSubDraft] = useState(frameSubtitle)
  const [editingFrameSub, setEditingFrameSub] = useState(false)
  const docTitleSaved =
    (element.data as { docTitle?: string } | undefined)?.docTitle ?? 'Esboço de sermão'
  const [docTitleDraft, setDocTitleDraft] = useState(docTitleSaved)
  const [editingDocTitle, setEditingDocTitle] = useState(false)
  const [hoverCard, setHoverCard] = useState(false)
  
  // Mobile controls state
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDragEnabled, setMobileDragEnabled] = useState(false)
  const [showMobileControls, setShowMobileControls] = useState(false)
  
  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const resizeSession = useRef<{
    corner: ResizeCorner
    startClient: { x: number; y: number }
    startRect: { x: number; y: number; w: number; h: number }
  } | null>(null)

  useEffect(() => {
    if (editingElementId !== element.id) setDraft(element.text)
  }, [element.text, editingElementId, element.id])

  useEffect(() => {
    setFrameSubDraft(frameSubtitle || 'Imagem profética / referência visual')
  }, [element.id, frameSubtitle])

  useEffect(() => {
    setDocTitleDraft(docTitleSaved)
  }, [element.id, docTitleSaved])

  const w = element.width || 220
  const h = element.height || 160
  const tok = getBoxStyle(element)
  const showSelectBlueRing = selectedElementId === element.id && !connectMode
  const isSelectedForUi = selectedElementId === element.id
  const isEditing = editingElementId === element.id

  const style: CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: w,
    minHeight: h,
    height: 'auto',
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging || isSelectedForUi ? 50 : 2,
    touchAction: 'none',
  }

  const shellClick = (e: React.MouseEvent) => {
    if (connectMode) {
      e.stopPropagation()
      if ((e.target as HTMLElement).closest('[data-connect-anchor]')) return
      onConnectPick?.(element.id)
      return
    }
    e.stopPropagation()
    onSelectElement?.(element.id)
  }

  const isPendingSource = connectSourceId === element.id
  const isWireSourceForDrag = wireDragMeta?.fromId === element.id
  const showEdgeAnchors =
    !isEditing &&
    (hoverCard ||
      isSelectedForUi ||
      !!connectMode ||
      !!revealWireAnchors ||
      isWireSourceForDrag)
  const anchorStartInteractive =
    !connectWireActive && !!onBeginConnectWire

  const connectRing =
    connectMode || isPendingSource
      ? `ring-2 ${isPendingSource ? 'ring-primary' : 'ring-primary/40'} ring-offset-2 ring-offset-background`
      : ''
  const selectRing = showSelectBlueRing
    ? 'ring-2 ring-[#2563eb] ring-offset-2 ring-offset-background'
    : ''
  const cursorClass = connectMode
    ? 'cursor-crosshair'
    : isDragging
      ? 'cursor-grabbing'
      : isEditing
        ? 'cursor-text'
        : 'cursor-grab'

  const beginResize = (corner: ResizeCorner, e: React.PointerEvent) => {
    resizeSession.current = {
      corner,
      startClient: { x: e.clientX, y: e.clientY },
      startRect: { x: element.x, y: element.y, w: element.width || w, h: element.height || h },
    }
    const onMove = (ev: PointerEvent) => {
      const s = resizeSession.current
      if (!s) return
      const dx = (ev.clientX - s.startClient.x) / scale
      const dy = (ev.clientY - s.startClient.y) / scale
      const r = computeResize(s.corner, s.startRect, dx, dy)
      onResizeTextCard?.(element.id, r)
    }
    const onUp = () => {
      resizeSession.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      onResizeTextCardEnd?.()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const innerChrome: CSSProperties = {
    background: tok.fill,
    borderWidth: tok.borderWidth,
    borderStyle: (tok.borderStyle ?? 'solid') as CSSProperties['borderStyle'],
    borderColor: tok.border,
    borderRadius: tok.borderRadius,
    color: tok.textColor,
    fontSize: tok.fontSize,
    fontWeight: tok.fontWeight,
    textAlign: tok.textAlign,
  }

  const beginEdit = (e: React.MouseEvent) => {
    if (connectMode) return
    e.stopPropagation()
    onStartEdit?.(element.id)
  }

  const textAreaProps = {
    className: 'w-full resize-none bg-transparent p-3 outline-none overflow-hidden',
    style: {
      color: tok.textColor,
      fontSize: tok.fontSize,
      fontWeight: tok.fontWeight,
      textAlign: tok.textAlign,
      fontFamily: 'inherit',
    } as CSSProperties,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: () => onCommitText?.(element.id, draft),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    rows: 1,
  }

  let inner: ReactNode
  switch (element.type) {
    case 'shape': {
      const kind =
        (element.data as { shapeKind?: CanvasShapeKind } | undefined)?.shapeKind ?? 'rounded-square'
      const geom = shapeInnerStyle(kind)
      inner = (
        <div
          className="flex flex-col items-center justify-center p-2"
          style={{ ...innerChrome, ...geom }}
          onDoubleClick={beginEdit}
        >
          {isEditing ? (
            <textarea {...textAreaProps} className={`${textAreaProps.className} text-center`} />
          ) : (
            <div className="whitespace-pre-wrap text-center px-1">{element.text}</div>
          )}
        </div>
      )
      break
    }
    case 'frame':
      inner = (
        <div
          className="flex flex-col items-center justify-center p-4"
          style={innerChrome}
          onDoubleClick={beginEdit}
        >
          {isEditing ? (
            <textarea {...textAreaProps} className={`${textAreaProps.className} text-center`} />
          ) : (
            <>
              <div className="text-5xl mb-2 select-none">🖼️</div>
              <p className="font-medium whitespace-pre-wrap px-1">{element.text}</p>
              {editingFrameSub ? (
                <input
                  type="text"
                  className="mt-2 w-full max-w-[280px] rounded-md border border-input bg-background px-2 py-1 text-center text-xs outline-none"
                  value={frameSubDraft}
                  onChange={(e) => setFrameSubDraft(e.target.value)}
                  onBlur={() => {
                    setEditingFrameSub(false)
                    onUpdateElementData?.(element.id, { frameSubtitle: frameSubDraft })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <p
                  className="text-xs mt-2 cursor-text opacity-80 hover:underline"
                  onDoubleClick={(e) => {
                    if (connectMode) return
                    e.stopPropagation()
                    setEditingFrameSub(true)
                  }}
                >
                  {frameSubtitle || 'Imagem profética / referência visual'}
                </p>
              )}
            </>
          )}
        </div>
      )
      break
    case 'table': {
      const rows = tableRows(element)
      const cols = tableColumnLabels(element)
      const setRows = (next: typeof rows) => onUpdateElementData?.(element.id, { rows: next })
      const setCol = (key: 'verse' | 'revelation', v: string) =>
        onUpdateElementData?.(element.id, {
          tableColumnLabels: { ...cols, [key]: v },
        })
      inner = (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3" style={innerChrome}>
          <div className="text-sm font-bold mb-2 shrink-0 flex items-center gap-2">
            <span>📋</span>
            {isEditing ? (
              <textarea
                {...textAreaProps}
                className={`${textAreaProps.className} mb-0 min-h-[2.5rem] shrink-0`}
              />
            ) : (
              <span className="whitespace-pre-wrap cursor-text" onDoubleClick={beginEdit}>
                {element.text}
              </span>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full text-xs" style={{ color: tok.textColor }}>
              <thead>
                <tr className="border-b opacity-90" style={{ borderColor: tok.border }}>
                  <th className="p-1 text-left align-bottom">
                    <input
                      type="text"
                      className="w-full min-w-0 bg-transparent font-semibold outline-none"
                      value={cols.verse}
                      onChange={(e) => setCol('verse', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  </th>
                  <th className="p-1 text-left align-bottom">
                    <input
                      type="text"
                      className="w-full min-w-0 bg-transparent font-semibold outline-none"
                      value={cols.revelation}
                      onChange={(e) => setCol('revelation', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b last:border-none" style={{ borderColor: tok.border }}>
                    <td className="p-1 align-top">
                      <input
                        type="text"
                        className="w-full min-w-0 bg-transparent outline-none"
                        value={row.verse}
                        onChange={(e) => {
                          const v = e.target.value
                          setRows(rows.map((r, j) => (j === i ? { ...r, verse: v } : r)))
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-1 align-top">
                      <input
                        type="text"
                        className="w-full min-w-0 bg-transparent outline-none opacity-95"
                        value={row.revelation}
                        onChange={(e) => {
                          const v = e.target.value
                          setRows(rows.map((r, j) => (j === i ? { ...r, revelation: v } : r)))
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
      break
    }
    case 'doc':
      inner = (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4" style={innerChrome}>
          {editingDocTitle ? (
            <input
              type="text"
              className="mb-2 shrink-0 rounded-md border border-input bg-background px-2 py-1 text-sm font-semibold outline-none"
              value={docTitleDraft}
              onChange={(e) => setDocTitleDraft(e.target.value)}
              onBlur={() => {
                setEditingDocTitle(false)
                onUpdateElementData?.(element.id, { docTitle: docTitleDraft })
              }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <div
              className="font-semibold text-sm mb-2 shrink-0 cursor-text hover:underline"
              onDoubleClick={(e) => {
                if (connectMode) return
                e.stopPropagation()
                setEditingDocTitle(true)
              }}
            >
              {docTitleSaved}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-auto" onDoubleClick={beginEdit}>
            {isEditing ? (
              <textarea {...textAreaProps} className="min-h-[120px]" />
            ) : (
              <div className="text-xs whitespace-pre-wrap leading-relaxed opacity-95">{element.text}</div>
            )}
          </div>
        </div>
      )
      break
    default:
      inner = (
        <div className="flex flex-col p-3" style={innerChrome} onDoubleClick={beginEdit}>
          {isEditing ? (
            <textarea {...textAreaProps} />
          ) : (
            <div className="whitespace-pre-wrap">{element.text}</div>
          )}
        </div>
      )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        animation: (element.data as any)?.isNew ? 'pulse 0.5s ease-in-out, fadeIn 0.3s ease-in-out' : undefined,
      }}
      className={`relative flex select-none flex-col overflow-visible rounded-md shadow-md ${connectRing} ${selectRing} ${cursorClass}`}
      onClick={shellClick}
      onMouseEnter={() => setHoverCard(true)}
      onMouseLeave={() => setHoverCard(false)}
      {...(isMobile && !mobileDragEnabled ? {} : listeners)}
      {...attributes}
    >
      {/* Mobile Controls - Top Right */}
      {isMobile && isSelectedForUi && !isEditing && (
        <div className="absolute -top-10 right-0 flex items-center gap-1 z-50">
          {/* Edit Tools Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMobileControls(!showMobileControls)
              onStartEdit?.(element.id)
            }}
            className="p-2 bg-slate-800 text-white rounded-lg shadow-lg border border-slate-600 hover:bg-slate-700 transition-colors"
            title="Editar card"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          
          {/* Drag Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMobileDragEnabled(!mobileDragEnabled)
            }}
            className={`p-2 rounded-lg shadow-lg border transition-colors ${
              mobileDragEnabled 
                ? 'bg-orange-500 text-white border-orange-600' 
                : 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700'
            }`}
            title={mobileDragEnabled ? "Arrastar ativado - toque e arraste" : "Ativar arrastar"}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {inner}
      <ConnectEdgeAnchors
        show={showEdgeAnchors}
        anchorInteractive={anchorStartInteractive}
        isPendingSource={isPendingSource}
        pendingSide={connectPendingSide}
        isWireSource={isWireSourceForDrag}
        wireSourceSide={wireDragMeta?.fromSide}
        snapHighlightSide={wireSnapHighlightSide}
        onAnchorPointerDown={onBeginConnectWire}
      />
      {showSelectBlueRing && !isEditing && (
        <>
          <ResizeCornerHandles
            corner="nw"
            cursor="nwse-resize"
            className="-left-2 -top-2"
            onResizeStart={beginResize}
          />
          <ResizeCornerHandles
            corner="ne"
            cursor="nesw-resize"
            className="-right-2 -top-2"
            onResizeStart={beginResize}
          />
          <ResizeCornerHandles
            corner="sw"
            cursor="nesw-resize"
            className="-bottom-2 -left-2"
            onResizeStart={beginResize}
          />
          <ResizeCornerHandles
            corner="se"
            cursor="nwse-resize"
            className="-bottom-2 -right-2"
            onResizeStart={beginResize}
          />
        </>
      )}
    </div>
  )
}

function DraggableCanvasItem(props: DraggableCanvasItemProps) {
  const { element, connectMode, editingElementId } = props

  const dragDisabled = !!connectMode || editingElementId === element.id

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
    data: { canvasItem: true },
    disabled: dragDisabled,
  })

  if (element.type === 'sticky' || element.type === 'frame' || element.type === 'table' || element.type === 'doc' || element.type === 'shape') {
    return (
      <TextCardItem
        {...props}
        isDragging={isDragging}
        setNodeRef={setNodeRef}
        transform={transform}
        listeners={listeners}
        attributes={attributes}
      />
    )
  }

  return null
}

interface MiroCanvasProps {
  elements: CanvasElement[]
  connections: CanvasConnection[]
  scrollRef: React.RefObject<HTMLDivElement | null>
  scale: number
  onScaleChange: (scale: number) => void
  connectMode?: boolean
  connectSourceId?: string | null
  connectPendingSide?: ConnectionSide | null
  onConnectPick?: (id: string, side?: ConnectionSide) => void
  /** Solta o fio perto da âncora do card destino */
  onConnectByWire?: (
    fromId: string,
    fromSide: ConnectionSide,
    toId: string,
    toSide: ConnectionSide
  ) => void
  /** Limpa seleção em dois cliques ao iniciar arraste */
  onConnectWireDragStart?: () => void
  selectedElementId?: string | null
  editingElementId?: string | null
  onSelectElement?: (id: string) => void
  onDeselectCanvas?: () => void
  onStartEdit?: (id: string) => void
  onCommitText?: (id: string, text: string) => void
  onUpdateElementData?: (id: string, dataPatch: Record<string, unknown>) => void
  onResizeTextCard?: (
    id: string,
    rect: { x: number; y: number; width: number; height: number }
  ) => void
  onResizeTextCardEnd?: () => void
  selectedConnectionId?: string | null
  onSelectConnection?: (id: string) => void
  onUpdateConnection?: (id: string, patch: Partial<CanvasConnection>) => void
}

export default function MiroCanvas({
  elements,
  connections,
  scrollRef,
  scale,
  onScaleChange,
  connectMode,
  connectSourceId,
  connectPendingSide,
  onConnectPick,
  onConnectByWire,
  onConnectWireDragStart,
  selectedElementId,
  editingElementId,
  onSelectElement,
  onDeselectCanvas,
  onStartEdit,
  onCommitText,
  onUpdateElementData,
  onResizeTextCard,
  onResizeTextCardEnd,
  selectedConnectionId,
  onSelectConnection,
  onUpdateConnection,
}: MiroCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'miro-canvas-drop',
    data: { canvas: true },
  })

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    ;(scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node
  }

  // Canvas panning state
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })

  const [wireDrag, setWireDrag] = useState<null | {
    fromId: string
    fromSide: ConnectionSide
    px: number
    py: number
  }>(null)

  const elementsRef = useRef(elements)
  elementsRef.current = elements
  const onConnectByWireRef = useRef(onConnectByWire)
  onConnectByWireRef.current = onConnectByWire
  const wireSourceRef = useRef<null | { fromId: string; fromSide: ConnectionSide }>(null)
  const wireCleanupRef = useRef<null | (() => void)>(null)
  const canvasPlaneRef = useRef<HTMLDivElement | null>(null)

  // Handle canvas panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan if clicking on empty canvas (not on elements)
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-pan-area')) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      const scrollEl = scrollRef.current
      if (scrollEl) {
        setScrollStart({ x: scrollEl.scrollLeft, y: scrollEl.scrollTop })
      }
    }
  }, [scrollRef])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault()
      const scrollEl = scrollRef.current
      if (scrollEl) {
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y
        scrollEl.scrollLeft = scrollStart.x - dx
        scrollEl.scrollTop = scrollStart.y - dy
      }
    }
  }, [isPanning, panStart, scrollStart, scrollRef])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleCanvasMouseLeave = useCallback(() => {
    setIsPanning(false)
  }, [])

  const beginConnectWire = useCallback(
    (fromId: string, fromSide: ConnectionSide, e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onConnectWireDragStart?.()
      const plane = canvasPlaneRef.current
      if (!plane) return
      const p = clientToCanvasLogicalCoords(plane, e.clientX, e.clientY)
      wireSourceRef.current = { fromId, fromSide }
      setWireDrag({ fromId, fromSide, px: p.x, py: p.y })

      const onMove = (ev: PointerEvent) => {
        const planeEl = canvasPlaneRef.current
        if (!planeEl) return
        const q = clientToCanvasLogicalCoords(planeEl, ev.clientX, ev.clientY)
        setWireDrag((wd) => (wd ? { ...wd, px: q.x, py: q.y } : null))
      }

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        wireCleanupRef.current = null
      }

      const onUp = (ev: PointerEvent) => {
        cleanup()
        const src = wireSourceRef.current
        wireSourceRef.current = null
        const planeEl = canvasPlaneRef.current
        if (!planeEl) {
          setWireDrag(null)
          return
        }
        const q = clientToCanvasLogicalCoords(planeEl, ev.clientX, ev.clientY)
        if (src && onConnectByWireRef.current) {
          const snap = findBestSnap(elementsRef.current, src.fromId, q.x, q.y, SNAP_TO_ANCHOR_PX)
          if (snap && snap.toId !== src.fromId) {
            onConnectByWireRef.current(src.fromId, src.fromSide, snap.toId, snap.toSide)
          }
        }
        setWireDrag(null)
      }

      wireCleanupRef.current = cleanup
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [onConnectWireDragStart]
  )

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      wireCleanupRef.current?.()
      wireSourceRef.current = null
      setWireDrag(null)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    const el = (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current
    if (!el) return
    const fn = canvasWheelZoomHandler(scale, onScaleChange)
    el.addEventListener('wheel', fn, { passive: false })
    return () => el.removeEventListener('wheel', fn)
  }, [scale, onScaleChange, scrollRef])

  const wireSnapPreview = useMemo(() => {
    if (!wireDrag) return null
    return findWireDropTarget(elements, wireDrag.fromId, wireDrag.px, wireDrag.py, SNAP_TO_ANCHOR_PX)
  }, [wireDrag, elements])

  const lineItems = useMemo(() => {
    return connections
      .map((c) => {
        const from = elements.find((e) => e.id === c.fromElementId)
        const to = elements.find((e) => e.id === c.toElementId)
        if (!from || !to) return null
        return { connection: c, from, to }
      })
      .filter(Boolean) as { connection: CanvasConnection; from: CanvasElement; to: CanvasElement }[]
  }, [connections, elements])

  const wirePathD = useMemo(() => {
    if (!wireDrag) return ''
    const fromEl = elements.find((e) => e.id === wireDrag.fromId)
    if (!fromEl) return ''
    const snap = wireSnapPreview
    if (snap) {
      const toEl = elements.find((e) => e.id === snap.toId)
      if (toEl) {
        return buildOrthogonalWirePath(fromEl, wireDrag.fromSide, toEl, snap.toSide, wireDrag.px, wireDrag.py)
      }
    }
    return buildOrthogonalWirePath(fromEl, wireDrag.fromSide, null, null, wireDrag.px, wireDrag.py)
  }, [wireDrag, wireSnapPreview, elements])

  const scaledW = CANVAS_BASE_W * scale
  const scaledH = CANVAS_BASE_H * scale

  return (
    <div
      ref={setRefs}
      className={`absolute inset-0 overflow-auto bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:40px_40px] min-h-full min-w-full ${
        isOver ? 'ring-2 ring-primary/40 ring-inset' : ''
      }`}
    >
      {connectMode && (
        <div className="sticky top-0 z-40 mx-auto max-w-lg px-3 py-2 text-center text-xs font-medium bg-primary/15 text-foreground border-b border-primary/20">
          Conectar: arraste de uma bolinha até outro card; solte sobre o card ou perto da bolinha de destino.
          Ou clique em dois cards. Esc cancela.
        </div>
      )}
      <div className="relative" style={{ width: scaledW, height: scaledH }}>
        <div
          ref={canvasPlaneRef}
          className={`relative origin-top-left ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            width: CANVAS_BASE_W,
            height: CANVAS_BASE_H,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCanvasMouseDown(e)
              onDeselectCanvas?.()
            }
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
        >
          {elements.map((el) => (
            <DraggableCanvasItem
              key={el.id}
              element={el}
              scale={scale}
              connectMode={connectMode}
              connectSourceId={connectSourceId}
              connectPendingSide={connectPendingSide}
              wireDragMeta={wireDrag ? { fromId: wireDrag.fromId, fromSide: wireDrag.fromSide } : null}
              connectWireActive={!!wireDrag}
              onBeginConnectWire={(side, ev) => beginConnectWire(el.id, side, ev)}
              revealWireAnchors={
                !!wireDrag &&
                shouldRevealAnchorsNearPointer(el, wireDrag.fromId, wireDrag.px, wireDrag.py)
              }
              wireSnapHighlightSide={
                wireSnapPreview?.toId === el.id ? wireSnapPreview.toSide : null
              }
              onConnectPick={onConnectPick}
              selectedElementId={selectedElementId}
              editingElementId={editingElementId}
              onSelectElement={onSelectElement}
              onStartEdit={onStartEdit}
              onCommitText={onCommitText}
              onUpdateElementData={onUpdateElementData}
              onResizeTextCard={onResizeTextCard}
              onResizeTextCardEnd={onResizeTextCardEnd}
            />
          ))}

          <svg
            className="absolute left-0 top-0 z-[24] pointer-events-none"
            width="100%"
            height="100%"
            style={{ minWidth: CANVAS_BASE_W, minHeight: CANVAS_BASE_H }}
          >
            <defs>
              {/* Arrow markers - created for any connection that might need them */}
              {lineItems.map(({ connection: c }) => {
                // Skip if explicitly no end cap
                if (c.endCap === 'none') return null
                
                const { strokeColor } = connectionResolvedStroke(c)
                const selected = c.id === selectedConnectionId
                const arrowFill = selected ? '#2563eb' : strokeColor
                
                // Determine which markers to create based on endCap or default
                const needsArrow = !c.endCap || c.endCap === 'arrow' || connectionEndShowsArrow(c)
                const needsDot = c.endCap === 'dot'
                const needsDiamond = c.endCap === 'diamond'
                const needsSquare = c.endCap === 'square'
                const needsClosed = c.endCap === 'closed'
                
                return (
                  <React.Fragment key={`markers-${c.id}`}>
                    {/* Arrow head - classic triangle */}
                    {needsArrow && (
                      <marker
                        key={`marker-arr-${c.id}`}
                        id={`miro-arr-${c.id}`}
                        viewBox="0 0 10 7"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill={arrowFill} />
                      </marker>
                    )}
                    {/* Circle dot end */}
                    {needsDot && (
                      <marker
                        key={`marker-dot-${c.id}`}
                        id={`miro-dot-${c.id}`}
                        viewBox="0 0 8 8"
                        markerWidth="8"
                        markerHeight="8"
                        refX="6"
                        refY="4"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <circle cx="4" cy="4" r="3" fill={arrowFill} />
                      </marker>
                    )}
                    {/* Diamond end */}
                    {needsDiamond && (
                      <marker
                        key={`marker-diamond-${c.id}`}
                        id={`miro-diamond-${c.id}`}
                        viewBox="0 0 10 10"
                        markerWidth="10"
                        markerHeight="10"
                        refX="8"
                        refY="5"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <polygon points="5 0, 10 5, 5 10, 0 5" fill={arrowFill} />
                      </marker>
                    )}
                    {/* Square end */}
                    {needsSquare && (
                      <marker
                        key={`marker-square-${c.id}`}
                        id={`miro-square-${c.id}`}
                        viewBox="0 0 8 8"
                        markerWidth="8"
                        markerHeight="8"
                        refX="6"
                        refY="4"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <rect x="0" y="0" width="6" height="8" fill={arrowFill} />
                      </marker>
                    )}
                    {/* Arrow with bar (closed) */}
                    {needsClosed && (
                      <marker
                        key={`marker-closed-${c.id}`}
                        id={`miro-closed-${c.id}`}
                        viewBox="0 0 12 8"
                        markerWidth="12"
                        markerHeight="8"
                        refX="10"
                        refY="4"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <polygon points="0 0, 10 4, 0 8" fill="none" stroke={arrowFill} strokeWidth="1.5" />
                        <line x1="10" y1="0" x2="10" y2="8" stroke={arrowFill} strokeWidth="2" />
                      </marker>
                    )}
                  </React.Fragment>
                )
              })}
            </defs>
            {lineItems.map(({ connection: c, from, to }) => {
              const ortho = buildConnectionPath(from, c.fromSide, to, c.toSide, c.waypoints)
              const { strokeWidth, strokeColor, dashStyle } = connectionResolvedStroke(c)
              const dashArr = connectionStrokeDashArray(dashStyle)
              const showArrow = connectionEndShowsArrow(c)
              const selected = c.id === selectedConnectionId
              const w = strokeWidth + (selected ? 1 : 0)
              return (
                <g
                  key={c.id}
                  style={{ pointerEvents: 'auto' }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onSelectConnection?.(c.id)
                  }}
                >
                  <path
                    d={ortho}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(14, w + 10)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  />
                  <path
                    d={ortho}
                    fill="none"
                    stroke={selected ? '#2563eb' : strokeColor}
                    strokeWidth={w}
                    strokeDasharray={dashArr}
                    opacity={selected ? 1 : 0.9}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    markerEnd={
                      c.endCap === 'none' ? undefined :
                      c.endCap === 'dot' ? `url(#miro-dot-${c.id})` :
                      c.endCap === 'diamond' ? `url(#miro-diamond-${c.id})` :
                      c.endCap === 'square' ? `url(#miro-square-${c.id})` :
                      c.endCap === 'closed' ? `url(#miro-closed-${c.id})` :
                      c.endCap === 'arrow' ? `url(#miro-arr-${c.id})` :
                      showArrow ? `url(#miro-arr-${c.id})` : undefined
                    }
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Waypoint handles - shown when connection is selected */}
                  {selected && c.waypoints?.map((wp, idx) => (
                    <circle
                      key={`${c.id}-wp-${idx}`}
                      cx={wp.x}
                      cy={wp.y}
                      r={6}
                      fill="#2563eb"
                      stroke="white"
                      strokeWidth={2}
                      style={{ cursor: 'move', pointerEvents: 'auto' }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        // Start dragging waypoint
                        const startX = e.clientX
                        const startY = e.clientY
                        const startWpX = wp.x
                        const startWpY = wp.y
                        
                        const handleMove = (moveEv: PointerEvent) => {
                          const dx = (moveEv.clientX - startX) / scale
                          const dy = (moveEv.clientY - startY) / scale
                          let newX = startWpX + dx
                          let newY = startWpY + dy
                          
                          // Get previous and next points for orthogonal snap
                          const pA = connectionAnchorPoint(from, c.fromSide || 'e')
                          const pB = connectionAnchorPoint(to, c.toSide || 'w')
                          const pts = [pA, ...(c.waypoints || []), pB]
                          const prev = pts[idx]
                          const next = pts[idx + 2]
                          
                          // Snap to orthogonal - maintain 90° angles
                          if (prev && next) {
                            const dx1 = Math.abs(newX - prev.x)
                            const dy1 = Math.abs(newY - prev.y)
                            const dx2 = Math.abs(newX - next.x)
                            const dy2 = Math.abs(newY - next.y)
                            
                            // Prefer horizontal or vertical alignment
                            if (dx1 < dy1 * 0.5 || dx2 < dy2 * 0.5) {
                              // Snap to horizontal (keep Y aligned)
                              newY = Math.abs(newY - prev.y) < Math.abs(newY - next.y) ? prev.y : next.y
                            } else if (dy1 < dx1 * 0.5 || dy2 < dx2 * 0.5) {
                              // Snap to vertical (keep X aligned)
                              newX = Math.abs(newX - prev.x) < Math.abs(newX - next.x) ? prev.x : next.x
                            }
                          } else if (prev) {
                            // Only previous point - snap to horizontal or vertical
                            const dxPrev = Math.abs(newX - prev.x)
                            const dyPrev = Math.abs(newY - prev.y)
                            if (dxPrev < dyPrev * 0.5) {
                              newY = prev.y // Horizontal
                            } else if (dyPrev < dxPrev * 0.5) {
                              newX = prev.x // Vertical
                            }
                          }
                          
                          const newWaypoints = [...(c.waypoints || [])]
                          newWaypoints[idx] = { x: newX, y: newY }
                          onUpdateConnection?.(c.id, { waypoints: newWaypoints })
                        }
                        
                        const handleUp = () => {
                          window.removeEventListener('pointermove', handleMove)
                          window.removeEventListener('pointerup', handleUp)
                        }
                        
                        window.addEventListener('pointermove', handleMove)
                        window.addEventListener('pointerup', handleUp)
                      }}
                    />
                  ))}
                  {/* Add waypoint button - shown when selected, click on line to add */}
                  {selected && (
                    <>
                      {/* Midpoint handles to add new waypoints */}
                      {(() => {
                        const pA = connectionAnchorPoint(from, c.fromSide || 'e')
                        const pB = connectionAnchorPoint(to, c.toSide || 'w')
                        const pts = [pA, ...(c.waypoints || []), pB]
                        const midpoints: { x: number; y: number; idx: number }[] = []
                        for (let i = 0; i < pts.length - 1; i++) {
                          midpoints.push({
                            x: (pts[i].x + pts[i + 1].x) / 2,
                            y: (pts[i].y + pts[i + 1].y) / 2,
                            idx: i
                          })
                        }
                        return midpoints.map((mp, i) => (
                          <circle
                            key={`${c.id}-mid-${i}`}
                            cx={mp.x}
                            cy={mp.y}
                            r={4}
                            fill="#94a3b8"
                            stroke="white"
                            strokeWidth={1}
                            style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
                            onPointerDown={(e) => {
                              e.stopPropagation()
                              // Add new waypoint at midpoint
                              const newWaypoints = [...(c.waypoints || [])]
                              newWaypoints.splice(mp.idx, 0, { x: mp.x, y: mp.y })
                              onUpdateConnection?.(c.id, { waypoints: newWaypoints })
                            }}
                          />
                        ))
                      })()}
                    </>
                  )}
                </g>
              )
            })}
          </svg>

          {wireDrag && wirePathD ? (
            <svg
              className="absolute left-0 top-0 z-[100] pointer-events-none"
              width={CANVAS_BASE_W}
              height={CANVAS_BASE_H}
              style={{ minWidth: CANVAS_BASE_W, minHeight: CANVAS_BASE_H }}
            >
              <defs>
                <marker
                  id="miro-wire-preview-arrow-top"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                </marker>
              </defs>
              <path
                d={wirePathD}
                fill="none"
                stroke="#ea580c"
                strokeWidth={5}
                opacity={1}
                strokeLinejoin="round"
                strokeLinecap="round"
                markerEnd="url(#miro-wire-preview-arrow-top)"
                style={{ filter: 'drop-shadow(0 0 4px rgba(234, 88, 12, 0.5))' }}
              />
            </svg>
          ) : null}
        </div>
      </div>
    </div>
  )
}
