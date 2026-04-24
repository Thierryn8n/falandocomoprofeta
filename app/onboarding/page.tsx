"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BookOpen, MessageCircle, BookMarked, ChevronRight, ChevronLeft } from "lucide-react"
import { useAppConfig } from "@/hooks/use-app-config"
import { useAuthFlow } from "@/hooks/use-auth-flow"
import { ModernLoader } from "@/components/modern-loader"

const slides = [
  {
    id: 1,
    title: "Bem-vindo ao Falando com o Profeta",
    subtitle: "Uma experiência espiritual única",
    description: "Converse com o Profeta William Branham através de Inteligência Artificial treinada em suas mensagens.",
    icon: null, // Será substituído pela imagem do profeta
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    id: 2,
    title: "Fale com o Profeta",
    subtitle: "Tire suas dúvidas",
    description: "Faça perguntas sobre a Palavra de Deus e receba respostas baseadas nos sermões do Profeta William Branham.",
    icon: MessageCircle,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    id: 3,
    title: "Estudos Bíblicos",
    subtitle: "Aprofunde seu conhecimento",
    description: "Explore mapas mentais interativos para estudar a Bíblia de forma organizada e completa.",
    icon: BookOpen,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    id: 4,
    title: "Bíblia Almeida Revelada",
    subtitle: "King James 1611",
    description: "Acesse a Bíblia Almeida Revelada, versão King James 1611, diretamente no aplicativo.",
    icon: BookMarked,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
]

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)
  const { getConfigValue } = useAppConfig()
  const { showLoader, finishOnboarding, skipOnboarding, isChecking } = useAuthFlow()

  const prophetName = getConfigValue("prophet_profile", {})?.prophetName || "Profeta William Branham"
  const prophetAvatar = getConfigValue("prophet_profile", {})?.prophetAvatar || "/placeholder.svg"
  const appName = getConfigValue("app_identity", {})?.appName || "Falando com o Profeta"

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1)
      setCurrentSlide(currentSlide + 1)
    } else {
      finishOnboarding()
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1)
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleSkip = () => {
    skipOnboarding()
  }

  // Show loader while checking or transitioning
  if (showLoader || isChecking) {
    return <ModernLoader message="Preparando sua experiência" />
  }

  const slide = slides[currentSlide]
  const Icon = slide.icon

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Pular
      </button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-8 bg-primary"
                : index < currentSlide
                ? "w-1.5 bg-primary/60"
                : "w-1.5 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="text-center"
          >
            {/* Icon / Imagem do Profeta */}
            {currentSlide === 0 ? (
              <div className="mx-auto w-28 h-28 rounded-2xl bg-primary flex items-center justify-center mb-8 shadow-lg overflow-hidden">
                <img 
                  src={prophetAvatar} 
                  alt={prophetName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br ${slide.color} ${slide.bgColor} flex items-center justify-center mb-8 shadow-lg`}>
                {Icon && <Icon className="w-12 h-12 text-white" />}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl font-bold mb-2 text-foreground">
              {slide.title === "Bem-vindo ao Falando com o Profeta" 
                ? `Bem-vindo ao ${appName}` 
                : slide.title}
            </h1>

            {/* Subtitle */}
            <p className={`text-sm font-medium mb-4 bg-gradient-to-r ${slide.color} bg-clip-text text-transparent`}>
              {slide.subtitle}
            </p>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed px-4">
              {slide.description.includes("Profeta William Branham")
                ? slide.description.replace("Profeta William Branham", prophetName)
                : slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-12 left-0 right-0 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`rounded-full ${currentSlide === 0 ? "opacity-0" : "opacity-100"}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            onClick={nextSlide}
            className="rounded-full px-8 py-6 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            {currentSlide === slides.length - 1 ? (
              "Começar"
            ) : (
              <>
                Próximo
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cookie consent note */}
      <p className="absolute bottom-4 text-xs text-muted-foreground text-center px-4">
        Ao continuar, você aceita nossa{" "}
        <a href="/politica-privacidade" className="underline hover:text-foreground">
          Política de Privacidade
        </a>{" "}
        e{" "}
        <a href="/termos-de-uso" className="underline hover:text-foreground">
          Termos de Uso
        </a>
      </p>
    </div>
  )
}
