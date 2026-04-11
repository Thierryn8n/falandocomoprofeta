import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Array de cores para avatares (estilo Google)
const AVATAR_COLORS = [
  "#E53935", // Red
  "#D81B60", // Pink
  "#8E24AA", // Purple
  "#5E35B1", // Deep Purple
  "#3949AB", // Indigo
  "#1E88E5", // Blue
  "#039BE5", // Light Blue
  "#00ACC1", // Cyan
  "#00897B", // Teal
  "#43A047", // Green
  "#7CB342", // Light Green
  "#C0CA33", // Lime
  "#FDD835", // Yellow
  "#FFB300", // Amber
  "#FB8C00", // Orange
  "#F4511E", // Deep Orange
  "#6D4C41", // Brown
  "#757575", // Gray
]

// Gerar cor consistente baseada no nome/email
export function getAvatarColor(identifier: string): string {
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

// Obter iniciais do nome
export function getInitials(name: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Criar URL de avatar com cor e iniciais (SVG inline)
export function generateAvatarUrl(name: string, email?: string): string {
  const identifier = name || email || "User"
  const color = getAvatarColor(identifier)
  const initials = getInitials(name || email || "?")
  
  // Criar SVG com iniciais
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${color}" rx="50"/>
      <text x="50" y="60" font-size="40" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial, sans-serif">${initials}</text>
    </svg>
  `.trim().replace(/\n/g, "")
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
