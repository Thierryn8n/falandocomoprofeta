import { v4 as uuidv4 } from 'uuid'

export type CanvasElementType = 'sticky' | 'frame' | 'table' | 'image' | 'doc' | 'shape'

/** Geom como no painel de formas estilo Miro */
export type CanvasShapeKind =
  | 'square'
  | 'rounded-square'
  | 'circle'
  | 'diamond'
  | 'star'
  | 'triangle'
  | 'speech-bubble'
  | 'arrow-block'

/** Linha reta, seta reta, quebrada (cotovelo), curva com seta */
export type ConnectionLineStyle = 'straight' | 'arrow' | 'elbow' | 'curved'

export type ConnectionDashStyle = 'solid' | 'dashed' | 'dotted'

/** Ponta na extremidade destino; omitido = inferir de lineStyle (arrow/curved → seta). */
export type ConnectionEndCap = 'none' | 'arrow' | 'dot' | 'diamond' | 'square' | 'closed'

/** Ponto médio de cada borda do card para ancorar conectores (estilo Miro) */
export type ConnectionSide = 'n' | 'e' | 's' | 'w'

export interface CanvasElement {
  id: string
  type: CanvasElementType
  text: string
  color?: string
  x: number
  y: number
  width?: number
  height?: number
  data?: Record<string, unknown>
}

/** Cartões de texto / nota / título / emoji (toolbar esquerda) */
export type TextCardVariant = 'text' | 'sticky' | 'title' | 'emoji'

export interface TextCardStyleState {
  fill: string
  border: string
  borderWidth: number
  borderRadius: number
  fontSize: number
  fontWeight: string
  textColor: string
  textAlign: 'left' | 'center' | 'right'
  borderStyle?: 'solid' | 'dashed' | 'dotted'
}

export function defaultTextCardStyle(variant: TextCardVariant): TextCardStyleState {
  switch (variant) {
    case 'text':
      return {
        fill: '#f8fafc',
        border: '#64748b',
        borderWidth: 2,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: '400',
        textColor: '#0f172a',
        textAlign: 'left',
      }
    case 'title':
      return {
        fill: '#eef2ff',
        border: '#4f46e5',
        borderWidth: 2,
        borderRadius: 10,
        fontSize: 24,
        fontWeight: '700',
        textColor: '#1e1b4b',
        textAlign: 'center',
      }
    case 'emoji':
      return {
        fill: '#fff7ed',
        border: '#ea580c',
        borderWidth: 2,
        borderRadius: 16,
        fontSize: 48,
        fontWeight: '400',
        textColor: '#1c1917',
        textAlign: 'center',
      }
    case 'sticky':
    default:
      return {
        fill: '#fef08a', // Yellow sticky note color
        border: '#a16207',
        borderWidth: 2,
        borderRadius: 14,
        fontSize: 15,
        fontWeight: '600',
        textColor: '#422006',
        textAlign: 'center',
      }
  }
}

export function inferTextVariant(element: CanvasElement): TextCardVariant {
  const d = element.data as { textVariant?: string } | undefined
  if (
    d?.textVariant === 'text' ||
    d?.textVariant === 'title' ||
    d?.textVariant === 'sticky' ||
    d?.textVariant === 'emoji'
  ) {
    return d.textVariant
  }
  return 'sticky'
}

export function getTextCardStyle(element: CanvasElement): TextCardStyleState {
  const variant = inferTextVariant(element)
  const base = defaultTextCardStyle(variant)
  const custom = (element.data as { style?: Partial<TextCardStyleState> } | undefined)?.style
  return { ...base, ...custom }
}

function defaultBoxStyleForType(type: CanvasElementType): TextCardStyleState {
  switch (type) {
    case 'frame':
      return {
        fill: '#faf5ff',
        border: '#7c3aed',
        borderWidth: 2,
        borderRadius: 12,
        fontSize: 14,
        fontWeight: '500',
        textColor: '#4c1d95',
        textAlign: 'center',
      }
    case 'table':
      return {
        fill: '#ffffff',
        border: '#334155',
        borderWidth: 2,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: '600',
        textColor: '#0f172a',
        textAlign: 'left',
      }
    case 'doc':
      return {
        fill: '#f8fafc',
        border: '#475569',
        borderWidth: 2,
        borderRadius: 10,
        fontSize: 13,
        fontWeight: '400',
        textColor: '#1e293b',
        textAlign: 'left',
      }
    case 'shape':
      return {
        fill: '#dbeafe',
        border: '#1d4ed8',
        borderWidth: 2,
        borderRadius: 16,
        fontSize: 14,
        fontWeight: '600',
        textColor: '#1e3a8a',
        textAlign: 'center',
      }
    default:
      return defaultTextCardStyle('sticky')
  }
}

/** Estilo unificado para barra de formatação (sticky + frame + tabela + doc + forma) */
export function getBoxStyle(element: CanvasElement): TextCardStyleState {
  if (element.type === 'sticky') return getTextCardStyle(element)
  const custom = (element.data as { style?: Partial<TextCardStyleState> } | undefined)?.style
  const base = defaultBoxStyleForType(element.type)
  return { ...base, ...custom }
}

export function createTextLikeCard(variant: TextCardVariant, x: number, y: number): CanvasElement {
  const text =
    variant === 'title'
      ? 'Título'
      : variant === 'text'
        ? 'Digite seu texto'
        : variant === 'emoji'
          ? '😀'
          : 'Nota adesiva — edite aqui'
  const w =
    variant === 'title' ? 360 : variant === 'text' ? 280 : variant === 'emoji' ? 120 : 240
  const h = variant === 'title' ? 88 : variant === 'text' ? 120 : variant === 'emoji' ? 120 : 180
  return {
    id: uuidv4(),
    type: 'sticky',
    text,
    x: Math.round(x),
    y: Math.round(y),
    width: w,
    height: h,
    data: {
      textVariant: variant,
      style: defaultTextCardStyle(variant),
    },
  }
}

export interface CanvasConnection {
  id: string
  fromElementId: string
  toElementId: string
  label?: string
  lineStyle?: ConnectionLineStyle
  /** Borda de saída; omitido = centro do card (legado) */
  fromSide?: ConnectionSide
  /** Borda de entrada; omitido = centro */
  toSide?: ConnectionSide
  strokeWidth?: number
  strokeColor?: string
  dashStyle?: ConnectionDashStyle
  endCap?: ConnectionEndCap
  /** Waypoints personalizados para a linha (vértices editáveis) */
  waypoints?: { x: number; y: number }[]
}

const DEFAULT_CONN_STROKE_W = 4
const DEFAULT_CONN_COLOR = '#ea580c'

export function connectionStrokeDashArray(dash?: ConnectionDashStyle): string | undefined {
  switch (dash ?? 'solid') {
    case 'dashed':
      return '12 8'
    case 'dotted':
      return '2 7'
    default:
      return undefined
  }
}

/** Seta no fim da linha (destino). */
export function connectionEndShowsArrow(c: Pick<CanvasConnection, 'lineStyle' | 'endCap'>): boolean {
  if (c.endCap === 'none') return false
  if (c.endCap === 'arrow') return true
  const ls = c.lineStyle ?? 'straight'
  return ls === 'arrow' || ls === 'curved'
}

export function connectionResolvedStroke(c: CanvasConnection): {
  strokeWidth: number
  strokeColor: string
  dashStyle: ConnectionDashStyle
} {
  return {
    strokeWidth: c.strokeWidth ?? DEFAULT_CONN_STROKE_W,
    strokeColor: c.strokeColor ?? DEFAULT_CONN_COLOR,
    dashStyle: c.dashStyle ?? 'solid',
  }
}

/** Study card row from Supabase /api/bible-study response */
export interface StudyCardRow {
  id: string
  title?: string
  content?: string
  card_type?: string
  position_x?: number
  position_y?: number
  width?: number
  height?: number
  bible_reference?: string
  prophet_message?: string
}

/** Connection row from API */
export interface CardConnectionRow {
  id: string
  from_card_id: string
  to_card_id: string
  connection_type?: string
  label?: string
}

const CARD_TYPE_COLORS: Record<string, string> = {
  verse: 'bg-amber-300',
  concept: 'bg-sky-300',
  question: 'bg-rose-300',
  answer: 'bg-emerald-300',
  connection: 'bg-violet-300',
  note: 'bg-yellow-200',
}

function cardTypeToElementType(cardType: string | undefined): CanvasElementType {
  switch (cardType) {
    case 'verse':
      return 'sticky'
    case 'question':
      return 'sticky'
    case 'answer':
      return 'sticky'
    case 'concept':
      return 'sticky'
    case 'title':
      return 'sticky'
    case 'text':
      return 'sticky'
    case 'prophet_message':
      return 'frame'
    case 'connection':
      return 'table'
    case 'note':
      return 'doc'
    default:
      return 'sticky'
  }
}

function buildStickyText(card: StudyCardRow): string {
  const title = card.title || 'Card'
  const body = card.content || ''
  const ref = card.bible_reference ? `\n\n📖 ${card.bible_reference}` : ''
  const prophet = card.prophet_message ? `\n\n✨ ${card.prophet_message}` : ''
  return `${title}\n\n${body}${ref}${prophet}`.trim()
}

/**
 * Maps AI-generated study cards to canvas elements. Uses each card's id as element id
 * so positions and DB rows stay aligned with study_cards.
 */
export function studyCardsToCanvasElements(cards: StudyCardRow[], isMobile = false): CanvasElement[] {
  // Check for mobile using window width if not provided
  const mobile = isMobile || (typeof window !== 'undefined' && window.innerWidth < 768)
  
  return cards.map((card, index) => {
    const ct = card.card_type || 'note'
    const color = CARD_TYPE_COLORS[ct] || 'bg-yellow-200'
    const elementType = cardTypeToElementType(ct)
    
    // For mobile: stack vertically with fixed spacing
    // For desktop: use DB positions
    let x: number
    let y: number
    
    if (mobile) {
      // Mobile: center horizontally, stack vertically with 200px spacing
      const cardWidth = card.width ?? 280
      x = Math.round((400 - cardWidth) / 2) // Center in mobile viewport (400px)
      y = 100 + index * 220 // Start at 100px, 220px apart
    } else {
      // Desktop: use DB positions or defaults
      x = Math.round(card.position_x ?? 120 + (index % 3) * 300)
      y = Math.round(card.position_y ?? 120 + Math.floor(index / 3) * 200)
    }
    
    // Use DB dimensions, fallback to type-specific defaults
    let width = card.width ?? 280
    let height = card.height ?? 180
    
    if (elementType === 'frame') {
      width = card.width ?? 350
      height = card.height ?? 250
    } else if (elementType === 'table') {
      width = card.width ?? 380
      height = card.height ?? 220
    } else if (elementType === 'doc') {
      width = card.width ?? 320
      height = card.height ?? 280
    }
    
    return {
      id: card.id,
      type: elementType,
      text: elementType === 'frame' ? card.title || 'Frame' : buildStickyText(card),
      color,
      x,
      y,
      width,
      height,
      data: {
        study_card_id: card.id,
        card_type: ct,
        title: card.title,
        bible_reference: card.bible_reference,
        prophet_message: card.prophet_message,
        isNew: true,
        generatedAt: Date.now(),
        generationOrder: index // Store generation order
      },
    }
  })
}

export function connectionsToCanvasConnections(rows: CardConnectionRow[]): CanvasConnection[] {
  return rows.map((r) => ({
    id: r.id,
    fromElementId: r.from_card_id,
    toElementId: r.to_card_id,
    label: r.label,
    lineStyle: 'straight',
  }))
}

function normalizeLineStyle(v: unknown): ConnectionLineStyle {
  if (v === 'arrow' || v === 'elbow' || v === 'curved' || v === 'straight') return v
  return 'straight'
}

function normalizeDashStyle(v: unknown): ConnectionDashStyle | undefined {
  if (v === 'solid' || v === 'dashed' || v === 'dotted') return v
  return undefined
}

function normalizeEndCap(v: unknown): ConnectionEndCap | undefined {
  if (v === 'none' || v === 'arrow' || v === 'dot' || v === 'diamond' || v === 'square' || v === 'closed') return v
  return undefined
}

function normalizeStrokeWidth(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function normalizeConnectionSide(v: unknown): ConnectionSide | undefined {
  if (v === 'n' || v === 'e' || v === 's' || v === 'w') return v
  return undefined
}

const CARD_CONNECT_SIDES: ConnectionSide[] = ['n', 'e', 's', 'w']

/** Ponto na bolinha de conexão (coordenadas do canvas) */
export function connectionAnchorPoint(el: CanvasElement, side: ConnectionSide | undefined): { x: number; y: number } {
  const w = el.width ?? 220
  const h = el.height ?? 160
  if (!side) return { x: el.x + w / 2, y: el.y + h / 2 }
  switch (side) {
    case 'n':
      return { x: el.x + w / 2, y: el.y - 6 }
    case 'e':
      return { x: el.x + w + 6, y: el.y + h / 2 }
    case 's':
      return { x: el.x + w / 2, y: el.y + h + 6 }
    case 'w':
      return { x: el.x - 6, y: el.y + h / 2 }
  }
}

/** Borda do card que mais “enxerga” o ponto (tx, ty) — para preencher lado faltante. */
function nearestSideTowardPoint(el: CanvasElement, tx: number, ty: number): ConnectionSide {
  const outward = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] } as const
  let best: ConnectionSide = 'e'
  let bestScore = -Infinity
  for (const side of CARD_CONNECT_SIDES) {
    const p = connectionAnchorPoint(el, side)
    const [ox, oy] = outward[side]
    const dx = tx - p.x
    const dy = ty - p.y
    const len = Math.hypot(dx, dy) || 1
    const score = (dx * ox + dy * oy) / len
    if (score > bestScore) {
      bestScore = score
      best = side
    }
  }
  return best
}

/** Par de lados a partir da disposição dos dois cards (eixo dominante entre centros). */
export function inferConnectionSides(
  fromEl: CanvasElement,
  toEl: CanvasElement
): { fromSide: ConnectionSide; toSide: ConnectionSide } {
  const wA = fromEl.width ?? 220
  const hA = fromEl.height ?? 160
  const wB = toEl.width ?? 220
  const hB = toEl.height ?? 160
  const cAx = fromEl.x + wA / 2
  const cAy = fromEl.y + hA / 2
  const cBx = toEl.x + wB / 2
  const cBy = toEl.y + hB / 2
  const vx = cBx - cAx
  const vy = cBy - cAy
  if (Math.abs(vx) >= Math.abs(vy)) {
    return vx >= 0
      ? { fromSide: 'e', toSide: 'w' }
      : { fromSide: 'w', toSide: 'e' }
  }
  return vy >= 0
    ? { fromSide: 's', toSide: 'n' }
    : { fromSide: 'n', toSide: 's' }
}

/**
 * Garante fromSide/toSide nas bordas (como as bolinhas), nunca linha no centro por falta de dado.
 */
export function resolveConnectionSides(
  fromEl: CanvasElement,
  toEl: CanvasElement,
  fromSide?: ConnectionSide,
  toSide?: ConnectionSide
): { fromSide: ConnectionSide; toSide: ConnectionSide } {
  if (fromSide && toSide) return { fromSide, toSide }
  if (!fromSide && !toSide) return inferConnectionSides(fromEl, toEl)
  if (fromSide) {
    const fp = connectionAnchorPoint(fromEl, fromSide)
    return { fromSide, toSide: nearestSideTowardPoint(toEl, fp.x, fp.y) }
  }
  const tp = connectionAnchorPoint(toEl, toSide!)
  return { fromSide: nearestSideTowardPoint(fromEl, tp.x, tp.y), toSide: toSide! }
}

/** Linhas entre elementos do canvas (tabela canvas_connections) */
export function canvasConnectionFromDb(row: Record<string, unknown>): CanvasConnection {
  return {
    id: String(row.id),
    fromElementId: String(row.from_element_id),
    toElementId: String(row.to_element_id),
    label: row.label != null ? String(row.label) : undefined,
    lineStyle: normalizeLineStyle(row.line_style),
    fromSide: normalizeConnectionSide(row.from_side),
    toSide: normalizeConnectionSide(row.to_side),
    strokeWidth: normalizeStrokeWidth(row.stroke_width),
    strokeColor: row.stroke_color != null ? String(row.stroke_color) : undefined,
    dashStyle: normalizeDashStyle(row.dash_style),
    endCap: normalizeEndCap(row.end_cap),
    waypoints: normalizeWaypoints(row.waypoints),
  }
}

function normalizeWaypoints(v: unknown): { x: number; y: number }[] | undefined {
  if (!v) return undefined
  if (!Array.isArray(v)) return undefined
  return v
    .filter((p): p is { x: number; y: number } => 
      p && typeof p === 'object' && 
      'x' in p && typeof p.x === 'number' &&
      'y' in p && typeof p.y === 'number'
    )
    .map((p) => ({ x: p.x, y: p.y }))
}

export function mergeCanvasElements(
  current: CanvasElement[],
  incoming: CanvasElement[]
): CanvasElement[] {
  const byId = new Map(current.map((e) => [e.id, { ...e }]))
  for (const el of incoming) {
    byId.set(el.id, { ...el })
  }
  return Array.from(byId.values())
}

/** Map Supabase canvas_elements row → client element */
export function canvasElementFromDb(row: Record<string, unknown>): CanvasElement {
  return {
    id: String(row.id),
    type: (row.type as CanvasElementType) || 'sticky',
    text: String(row.text ?? ''),
    color: row.color as string | undefined,
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    width: row.width != null ? Number(row.width) : undefined,
    height: row.height != null ? Number(row.height) : undefined,
    data: (row.data as Record<string, unknown>) || undefined,
  }
}

/** Tipos soltos da paleta lateral / drop */
export type PaletteDropKind = 'verse' | 'frame' | 'table' | 'doc' | 'map' | 'draw'

export function createPaletteElement(
  kind: PaletteDropKind,
  x: number,
  y: number,
  panelTheme?: string
): CanvasElement {
  const id = uuidv4()
  switch (kind) {
    case 'verse':
      return {
        id,
        type: 'sticky',
        text: 'Versículo em destaque — edite aqui',
        x,
        y,
        width: 200,
        height: 200,
        data: { template: 'verse', textVariant: 'sticky', style: defaultTextCardStyle('sticky') },
      }
    case 'frame':
      return {
        id,
        type: 'frame',
        text: panelTheme ? `Ilustração: ${panelTheme}` : 'Quadro de ilustração',
        x,
        y,
        width: 320,
        height: 220,
        data: {
          template: 'frame',
          style: defaultBoxStyleForType('frame'),
          frameSubtitle: 'Imagem profética / referência visual',
        },
      }
    case 'table':
      return {
        id,
        type: 'table',
        text: 'Tabela de referências',
        x,
        y,
        width: 340,
        height: 240,
        data: {
          template: 'table',
          style: defaultBoxStyleForType('table'),
          tableColumnLabels: { verse: 'Versículo', revelation: 'Revelação' },
          rows: [
            { verse: 'João 3:16', revelation: 'Amor redentor' },
            { verse: 'Rom. 8:28', revelation: 'Propósito de Deus' },
          ],
        },
      }
    case 'doc':
      return {
        id,
        type: 'doc',
        text: 'Introdução\n\nPonto 1\n\nPonto 2\n\nConclusão',
        x,
        y,
        width: 300,
        height: 280,
        data: { template: 'sermon', style: defaultBoxStyleForType('doc'), docTitle: 'Esboço de sermão' },
      }
    case 'draw':
      return {
        id,
        type: 'sticky',
        text: 'Caneta — traços livres em breve. Use formas e texto enquanto isso.',
        x,
        y,
        width: 300,
        height: 96,
        data: {
          template: 'draw',
          textVariant: 'text',
          style: {
            ...defaultTextCardStyle('text'),
            borderStyle: 'dashed',
          },
        },
      }
    case 'map':
    default:
      return {
        id,
        type: 'sticky',
        text: 'Mapa de conexões — ligue ideias no canvas',
        x,
        y,
        width: 200,
        height: 180,
        data: {
          template: 'map',
          textVariant: 'sticky',
          style: {
            ...defaultTextCardStyle('sticky'),
            fill: '#e9d5ff',
            border: '#7c3aed',
            textColor: '#3b0764',
          },
        },
      }
  }
}

/** Formas geométricas arrastáveis no Miro */
export function createShapeElement(kind: CanvasShapeKind, x: number, y: number): CanvasElement {
  const id = uuidv4()
  const isArrowBlock = kind === 'arrow-block'
  const w = isArrowBlock ? 168 : 128
  const h = 120
  return {
    id,
    type: 'shape',
    text: 'Texto',
    x: Math.round(x),
    y: Math.round(y),
    width: w,
    height: h,
    data: { shapeKind: kind, style: defaultBoxStyleForType('shape') },
  }
}

