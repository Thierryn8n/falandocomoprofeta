"use client"

import { useTheme } from "next-themes"
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
import { TermsAcceptanceModal } from '@/components/terms-acceptance-modal'

// Estilos de tema
const themeStyles = {
  light: {
    name: "Claro",
    bg: "bg-[#FFFFFF]",
    text: "text-[#1A1A1A]",
    verseNum: "text-[#A89080]",
    border: "border-[#E0E0E0]",
    header: "bg-[#FFFFFF]/95 border-[#E0E0E0]",
    card: "bg-[#F5F5F5] border-[#E0E0E0]",
    button: "bg-[#D4D4D4] hover:bg-[#C4C4C4] text-[#1A1A1A]",
    primary: "bg-[#A89080] text-white",
    muted: "text-[#4A4A4A]",
    input: "bg-[#FFFFFF] border-[#E0E0E0]",
    userMessage: "bg-[#A89080] text-white",
    assistantMessage: "bg-[#F5F5F5] text-[#1A1A1A] border-[#E0E0E0]",
  },
  dark: {
    name: "Escuro",
    bg: "bg-[#1A1A1A]",
    text: "text-[#E8E0D5]",
    verseNum: "text-[#A89080]",
    border: "border-[#333333]",
    header: "bg-[#1A1A1A]/95 border-[#333333]",
    card: "bg-[#242424] border-[#333333]",
    button: "bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#E8E0D5]",
    primary: "bg-[#A89080] text-[#1A1A1A]",
    muted: "text-[#B8A898]",
    input: "bg-[#1A1A1A] border-[#333333]",
    userMessage: "bg-[#A89080] text-[#1A1A1A]",
    assistantMessage: "bg-[#242424] text-[#E8E0D5] border-[#333333]",
  },
  sepia: {
    name: "Sépia",
    bg: "bg-[#F4ECD8]",
    text: "text-[#5C4D3C]",
    verseNum: "text-[#8B7355]",
    border: "border-[#D4C4A8]",
    header: "bg-[#F4ECD8]/95 border-[#D4C4A8]",
    card: "bg-[#FAF3E8] border-[#D4C4A8]",
    button: "bg-[#D4C4A8] hover:bg-[#C4B498] text-[#5C4D3C]",
    primary: "bg-[#8B7355] text-white",
    muted: "text-[#6B5D4C]",
    input: "bg-[#FFFFFF] border-[#D4C4A8]",
    userMessage: "bg-[#8B7355] text-white",
    assistantMessage: "bg-[#FAF3E8] text-[#5C4D3C] border-[#D4C4A8]",
  },
  night: {
    name: "Noite",
    bg: "bg-[#0D1117]",
    text: "text-[#C9D1D9]",
    verseNum: "text-[#58A6FF]",
    border: "border-[#21262D]",
    header: "bg-[#0D1117]/95 border-[#21262D]",
    card: "bg-[#161B22] border-[#21262D]",
    button: "bg-[#30363D] hover:bg-[#3D444D] text-[#C9D1D9]",
    primary: "bg-[#58A6FF] text-[#0A0A0A]",
    muted: "text-[#9BA1A6]",
    input: "bg-[#0D1117] border-[#21262D]",
    userMessage: "bg-[#58A6FF] text-[#0A0A0A]",
    assistantMessage: "bg-[#161B22] text-[#C9D1D9] border-[#21262D]",
  }
}

export function CookieConsentWrapper() {
  const { theme } = useTheme()
  const currentTheme = themeStyles[(theme as keyof typeof themeStyles) || "sepia"]
  return <CookieConsentBanner theme={currentTheme} />
}

export function TermsAcceptanceWrapper() {
  const { theme } = useTheme()
  const currentTheme = themeStyles[(theme as keyof typeof themeStyles) || "sepia"]
  return <TermsAcceptanceModal theme={currentTheme} />
}
