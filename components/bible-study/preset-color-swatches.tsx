'use client'

/** Cores pré-definidas para linhas, texto e cartões (estilo Miro / post-its). */
export const MIRO_PRESET_COLORS: { hex: string; label: string }[] = [
  { hex: '#737373', label: 'Cinza' },
  { hex: '#1e293b', label: 'Ardósia' },
  { hex: '#0f172a', label: 'Preto suave' },
  { hex: '#2563eb', label: 'Azul' },
  { hex: '#0891b2', label: 'Ciano' },
  { hex: '#0d9488', label: 'Verde-água' },
  { hex: '#16a34a', label: 'Verde' },
  { hex: '#ca8a04', label: 'Âmbar' },
  { hex: '#ea580c', label: 'Laranja' },
  { hex: '#dc2626', label: 'Vermelho' },
  { hex: '#9333ea', label: 'Roxo' },
  { hex: '#db2777', label: 'Rosa' },
  { hex: '#fef08a', label: 'Amarelo claro' },
  { hex: '#fde68a', label: 'Amarelo' },
  { hex: '#fed7aa', label: 'Pêssego' },
  { hex: '#fecaca', label: 'Rosa claro' },
  { hex: '#ddd6fe', label: 'Lilás claro' },
  { hex: '#bae6fd', label: 'Azul claro' },
  { hex: '#bbf7d0', label: 'Verde claro' },
  { hex: '#f3f4f6', label: 'Cinza claro' },
  { hex: '#ffffff', label: 'Branco' },
]

export function normalizeHexColor(c: string): string {
  const t = c.trim().toLowerCase()
  if (!t) return ''
  return t.startsWith('#') ? t : `#${t}`
}

interface PresetColorSwatchesProps {
  value: string
  onChange: (hex: string) => void
  title?: string
  className?: string
}

export function PresetColorSwatches({ value, onChange, title, className }: PresetColorSwatchesProps) {
  const current = normalizeHexColor(value)

  return (
    <div
      className={`flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 ${className ?? ''}`}
      role="group"
      aria-label={title ?? 'Cores pré-definidas'}
    >
      {MIRO_PRESET_COLORS.map(({ hex, label }) => {
        const selected = current === normalizeHexColor(hex)
        const isLight = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#f3f4f6'
        return (
          <button
            key={hex}
            type="button"
            title={label}
            className={`h-6 w-6 shrink-0 rounded-md border-2 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isLight ? 'border-border' : 'border-transparent'
            } ${selected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110' : ''}`}
            style={{ backgroundColor: hex }}
            onClick={() => onChange(hex)}
          />
        )
      })}
    </div>
  )
}
