'use client'

import {
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
 * Linha só horizontal/vertical, saindo da bolinha, contornando os cards por fora
 * (corredor à direita + faixa acima), nunca em linha reta pelo meio.
 */
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

/** Conexão salva: sempre bordas (bolinhas), preenchendo lados faltantes. */
function buildOrthogonalSavedPath(
  fromEl: CanvasElement,
  fromSide: ConnectionSide | undefined,
  toEl: CanvasElement,
  toSide: ConnectionSide | undefined
): string {
  const { fromSide: fs, toSide: ts } = resolveConnectionSides(fromEl, toEl, fromSide, toSide)
  return buildOrthogonalWirePath(fromEl, fs, toEl, ts, 0, 0)
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
            ? 'left-1/2 -translate-x-1/2 -top-1.5'
            : side === 's'
              ? 'left-1/2 -translate-x-1/2 -bottom-1.5'
              : side === 'w'
                ? 'top-1/2 -translate-y-1/2 -left-1.5'
                : 'top-1/2 -translate-y-1/2 -right-1.5'
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
              if (!canDragWire) return
              ev.preventDefault()
              ev.stopPropagation()
              onAnchorPointerDown!(side, ev)
            }}
          >
            <span
              className={`flex items-center justify-center rounded-full border-2 border-[#2563eb] bg-white shadow-sm ${
                isActive
                  ? 'h-8 w-8 border-white bg-[#2563eb] text-white'
                  : 'h-3.5 w-3.5 md:h-4 md:w-4'
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
    height: h,
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
    !connectWireActive &&
    !!onBeginConnectWire &&
    (!!connectMode || hoverCard || isSelectedForUi)

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
    className: 'min-h-0 w-full flex-1 resize-none bg-transparent p-3 outline-none',
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
    autoFocus: true as const,
  }

  let inner: ReactNode
  switch (element.type) {
    case 'shape': {
      const kind =
        (element.data as { shapeKind?: CanvasShapeKind } | undefined)?.shapeKind ?? 'rounded-square'
      const geom = shapeInnerStyle(kind)
      inner = (
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto p-2"
          style={{ ...innerChrome, ...geom }}
          onDoubleClick={beginEdit}
        >
          {isEditing ? (
            <textarea {...textAreaProps} className={`${textAreaProps.className} text-center`} />
          ) : (
            <div className="max-h-full overflow-auto whitespace-pre-wrap text-center px-1">{element.text}</div>
          )}
        </div>
      )
      break
    }
    case 'frame':
      inner = (
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto p-4"
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
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          style={innerChrome}
          onDoubleClick={beginEdit}
        >
          {isEditing ? (
            <textarea {...textAreaProps} />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-3">{element.text}</div>
          )}
        </div>
      )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex select-none flex-col overflow-visible rounded-md shadow-md ${connectRing} ${selectRing} ${cursorClass}`}
      onClick={shellClick}
      onMouseEnter={() => setHoverCard(true)}
      onMouseLeave={() => setHoverCard(false)}
      {...listeners}
      {...attributes}
    >
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
}: MiroCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'miro-canvas-drop',
    data: { canvas: true },
  })

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    ;(scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node
  }

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
          className="relative origin-top-left cursor-default"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            width: CANVAS_BASE_W,
            height: CANVAS_BASE_H,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onDeselectCanvas?.()
          }}
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
              {lineItems.map(({ connection: c }) => {
                if (!connectionEndShowsArrow(c)) return null
                const { strokeColor } = connectionResolvedStroke(c)
                const selected = c.id === selectedConnectionId
                const arrowFill = selected ? '#2563eb' : strokeColor
                return (
                  <marker
                    key={c.id}
                    id={`miro-arr-${c.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill={arrowFill} />
                  </marker>
                )
              })}
            </defs>
            {lineItems.map(({ connection: c, from, to }) => {
              const ortho = buildOrthogonalSavedPath(from, c.fromSide, to, c.toSide)
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
                    markerEnd={showArrow ? `url(#miro-arr-${c.id})` : undefined}
                    style={{ pointerEvents: 'none' }}
                  />
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
                stroke="#2563eb"
                strokeWidth={3}
                strokeDasharray="8 6"
                opacity={1}
                strokeLinejoin="round"
                strokeLinecap="round"
                markerEnd="url(#miro-wire-preview-arrow-top)"
              />
            </svg>
          ) : null}
        </div>
      </div>
    </div>
  )
}
