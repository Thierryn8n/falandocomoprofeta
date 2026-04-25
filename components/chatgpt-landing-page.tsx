"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  MessageSquare,
  Sparkles,
  Users,
  Shield,
  ArrowRight,
  Send,
  Paperclip,
  Search,
  HelpCircle,
  Star,
  Zap,
  Heart,
  BookOpen,
  Crown,
  Lightbulb,
  Play,
  Quote,
  CheckCircle2,
  Clock,
  Globe,
  Flame,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatGPTLandingPageProps {
  onLogin: () => void
  appConfig: {
    appName: string
    prophetName: string
    prophetAvatar: string
  }
  theme?: any
}

const suggestions = [
  "O que são os Sete Selos?",
  "Explique sobre o batismo em nome de Jesus",
  "Qual é a mensagem do tempo do fim?",
  "Fale sobre a serpente semente",
  "O que é a divindade?",
  "Como receber cura divina?",
]

const features = [
  {
    icon: MessageSquare,
    title: "Conversas Inteligentes",
    description: "Dialogue com o Profeta William Branham através de IA avançada treinada em suas mensagens",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: BookOpen,
    title: "Conhecimento Profundo",
    description: "Acesso completo às mensagens, sermões e ensinamentos do Profeta organizados tematicamente",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500",
  },
  {
    icon: Shield,
    title: "Respostas Autênticas",
    description: "Todas as respostas são baseadas exclusivamente nos sermões e doutrinas originais do Profeta",
    color: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: Zap,
    title: "Disponível 24/7",
    description: "Tire suas dúvidas a qualquer hora do dia, sempre que precisar de orientação espiritual",
    color: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-500",
  },
]

const testimonials = [
  {
    name: "Maria Silva",
    role: "Membro da Igreja",
    content: "Essa ferramenta tem sido uma bênção na minha vida. Posso estudar a Mensagem e receber respostas claras baseadas nos ensinamentos do Profeta.",
    avatar: "https://i.pravatar.cc/150?u=maria_silva",
  },
  {
    name: "João Santos",
    role: "Pastor",
    content: "Como pastor, uso essa ferramenta para aprofundar meu entendimento das Escrituras através das revelações dadas ao Profeta Branham.",
    avatar: "https://i.pravatar.cc/150?u=joao_santos",
  },
  {
    name: "Ana Costa",
    role: "Estudante da Bíblia",
    content: "Finalmente posso acessar os ensinamentos do Profeta de forma interativa e fácil. Isso revolucionou meus estudos bíblicos.",
    avatar: "https://i.pravatar.cc/150?u=ana_costa",
  },
]

const stats = [
  { value: "1000+", label: "Usuários Ativos", icon: Users },
  { value: "10k+", label: "Conversas Realizadas", icon: MessageSquare },
  { value: "1200+", label: "Sermões Indexados", icon: BookOpen },
  { value: "99%", label: "Satisfação", icon: Heart },
]

const howItWorks = [
  {
    step: "01",
    title: "Faça sua Pergunta",
    description: "Digite qualquer dúvida sobre os ensinamentos do Profeta William Branham",
  },
  {
    step: "02",
    title: "IA Analisa",
    description: "Nossa inteligência artificial busca nas mensagens do Profeta a resposta mais adequada",
  },
  {
    step: "03",
    title: "Receba a Resposta",
    description: "Obtenha uma resposta clara, fundamentada e com referências aos sermões originais",
  },
]

export function ChatGPTLandingPage({ onLogin, appConfig, theme }: ChatGPTLandingPageProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleSubmit = () => {
    onLogin()
  }

  return (
    <div className={cn("min-h-screen relative overflow-hidden", theme?.bg)}>
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn("relative z-50 border-b backdrop-blur-xl sticky top-0", theme?.header, theme?.border)}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                {appConfig.prophetAvatar ? (
                  <AvatarImage src={appConfig.prophetAvatar} alt={appConfig.prophetName} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10">
                    <Crown className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h1 className={cn("text-xl font-bold tracking-tight", theme?.text)}>{appConfig.appName}</h1>
                <p className={cn("text-sm font-medium", theme?.muted)}>Converse com {appConfig.prophetName}</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative z-50 rounded-full"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={onLogin} 
                  className="relative z-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Badge className="mb-6 px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 hover:from-primary/30 hover:to-primary/20 transition-all">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Powered by AI • Baseado em 1200+ Sermões
                </Badge>
              </motion.div>
              
              <motion.h1 
                className={cn("text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight", theme?.text)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Converse com o{" "}
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  Profeta William Branham
                </span>
              </motion.h1>
              
              <motion.p 
                className={cn("text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed", theme?.muted)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Tire suas dúvidas sobre os mistérios da Palavra de Deus através de uma conversa inteligente com o Profeta do tempo do fim.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    onClick={onLogin} 
                    className="relative z-50 text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/30 rounded-xl"
                  >
                    <Flame className="h-5 w-5 mr-2" />
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="relative z-50 text-lg px-8 py-6 rounded-xl border-2 hover:bg-primary/5"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Ver Demonstração
                  </Button>
                </motion.div>
              </motion.div>

              {/* Stats Row */}
              <motion.div 
                className="flex flex-wrap gap-6 justify-center lg:justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                {stats.slice(0, 3).map((stat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <stat.icon className="h-5 w-5 text-primary" />
                    <span className={cn("font-bold", theme?.text)}>{stat.value}</span>
                    <span className={cn("text-sm", theme?.muted)}>{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Chat Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <Card className={cn("border-2 shadow-2xl overflow-hidden", theme?.border, theme?.card)}>
                  {/* Chat Header */}
                  <div className={cn("p-4 border-b flex items-center gap-3", theme?.border)}>
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-2 ring-green-500 ring-offset-2">
                        {appConfig.prophetAvatar ? (
                          <AvatarImage src={appConfig.prophetAvatar} alt={appConfig.prophetName} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10">
                            <Crown className="h-5 w-5 text-primary" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-semibold", theme?.text)}>{appConfig.prophetName}</p>
                      <p className={cn("text-xs flex items-center gap-1", theme?.muted)}>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Online agora
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      IA Ativa
                    </Badge>
                  </div>

                  {/* Chat Messages */}
                  <CardContent className="p-4 space-y-4 min-h-[200px]">
                    <div className="flex justify-start">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 }}
                        className={cn("rounded-2xl rounded-tl-sm p-3 max-w-[80%]", theme?.card, "bg-primary/5 border border-primary/10")}
                      >
                        <p className={cn("text-sm", theme?.text)}>
                          Bem-vindo, irmão! 🙏 Que a paz do Senhor Jesus Cristo esteja contigo. Faça sua pergunta sobre a Palavra de Deus.
                        </p>
                      </motion.div>
                    </div>
                    
                    <div className="flex justify-end">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.5 }}
                        className={cn("rounded-2xl rounded-tr-sm p-3 max-w-[80%] bg-gradient-to-r from-primary/90 to-primary text-primary-foreground")}
                      >
                        <p className="text-sm">
                          O que são os Sete Selos do Apocalipse?
                        </p>
                      </motion.div>
                    </div>

                    <div className="flex justify-start">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 2 }}
                        className={cn("rounded-2xl rounded-tl-sm p-3 max-w-[80%]", theme?.card, "bg-primary/5 border border-primary/10")}
                      >
                        <p className={cn("text-sm", theme?.text)}>
                          Os Sete Selos são mistérios profundos revelados em Apocalipse 6-8. Deixe-me compartilhar o que o Senhor me mostrou sobre eles...
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="flex gap-0.5">
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>

                  {/* Chat Input */}
                  <div className={cn("p-4 border-t", theme?.border)}>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua pergunta..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={cn("flex-1 rounded-xl", theme?.input)}
                      />
                      <Button size="icon" className="relative z-50 rounded-xl shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {suggestions.slice(0, 3).map((suggestion, index) => (
                        <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs relative z-50 rounded-full"
                          >
                            {suggestion}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={cn("py-16 px-4 border-y", theme?.border, theme?.card)}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div 
                  className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <stat.icon className="h-7 w-7 text-primary" />
                </motion.div>
                <motion.p 
                  className={cn("text-3xl md:text-4xl font-bold mb-1", theme?.text)}
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                >
                  {stat.value}
                </motion.p>
                <p className={cn("text-sm font-medium", theme?.muted)}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 px-4 py-2" variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Simples e Rápido
            </Badge>
            <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", theme?.text)}>Como Funciona</h2>
            <p className={cn("text-xl max-w-2xl mx-auto", theme?.muted)}>
              Em apenas 3 passos, você pode começar a conversar com o Profeta
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <Card className={cn("h-full hover:shadow-xl transition-all duration-300 group", theme?.card, theme?.border)}>
                  <CardContent className="p-8 text-center">
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                    >
                      <span className="text-2xl font-bold text-primary">{step.step}</span>
                    </motion.div>
                    <h3 className={cn("text-xl font-bold mb-3", theme?.text)}>{step.title}</h3>
                    <p className={cn("text-sm leading-relaxed", theme?.muted)}>{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={cn("py-20 px-4", theme?.bg)}>
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 px-4 py-2" variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Recursos Exclusivos
            </Badge>
            <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", theme?.text)}>Por que escolher nosso assistente?</h2>
            <p className={cn("text-xl max-w-2xl mx-auto", theme?.muted)}>
              Uma experiência única para estudar e compreender os ensinamentos do Profeta William Branham
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className={cn("h-full group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30", theme?.card, theme?.border)}>
                  <CardContent className="p-6">
                    <motion.div 
                      className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", feature.color)}
                    >
                      <feature.icon className={cn("h-7 w-7", feature.iconColor)} />
                    </motion.div>
                    <h3 className={cn("font-bold text-lg mb-2", theme?.text)}>{feature.title}</h3>
                    <p className={cn("text-sm leading-relaxed", theme?.muted)}>{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Suggestions Section */}
      <section className={cn("py-20 px-4", theme?.card)}>
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 px-4 py-2" variant="outline">
              <Lightbulb className="h-4 w-4 mr-2" />
              Ideias para Começar
            </Badge>
            <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", theme?.text)}>Perguntas Populares</h2>
            <p className={cn("text-xl", theme?.muted)}>Veja algumas das perguntas mais feitas ao Profeta</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className={cn("cursor-pointer hover:shadow-lg transition-all duration-300 group border-l-4 relative z-50 overflow-hidden", theme?.card, theme?.border, "border-l-primary/30 hover:border-l-primary")}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 transition-all"
                        whileHover={{ rotate: 10 }}
                      >
                        <Lightbulb className="h-5 w-5 text-primary" />
                      </motion.div>
                      <p className={cn("font-medium leading-snug", theme?.text)}>{suggestion}</p>
                      <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={cn("py-20 px-4", theme?.bg)}>
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 px-4 py-2" variant="outline">
              <Heart className="h-4 w-4 mr-2" />
              Depoimentos
            </Badge>
            <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", theme?.text)}>O que dizem nossos usuários</h2>
            <p className={cn("text-xl", theme?.muted)}>Experiências reais de pessoas que usam nosso assistente</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -8 }}
              >
                <Card className={cn("h-full hover:shadow-2xl transition-all duration-300", theme?.card, theme?.border)}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-primary/30 mb-3" />
                    <p className={cn("mb-6 leading-relaxed", theme?.muted)}>"{testimonial.content}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        {testimonial.avatar ? (
                          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10">
                            {testimonial.name.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className={cn("font-semibold", theme?.text)}>{testimonial.name}</p>
                        <p className={cn("text-sm", theme?.muted)}>{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className={cn("py-16 px-4 border-y", theme?.border, theme?.card)}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Shield, text: "100% Seguro" },
              { icon: CheckCircle2, text: "Respostas Verificadas" },
              { icon: Clock, text: "Disponível 24/7" },
              { icon: Globe, text: "Acesso Global" },
            ].map((badge, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <badge.icon className="h-5 w-5 text-primary" />
                <span className={cn("font-medium", theme?.text)}>{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className={cn("border-2 overflow-hidden relative", theme?.border, theme?.card)}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
              <CardContent className="p-8 md:p-12 relative">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center"
                  >
                    <Flame className="h-10 w-10 text-primary" />
                  </motion.div>
                  
                  <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", theme?.text)}>
                    Comece sua jornada espiritual hoje
                  </h2>
                  <p className={cn("text-xl mb-8 max-w-2xl mx-auto", theme?.muted)}>
                    Junte-se a milhares de pessoas que já descobriram os mistérios da Palavra através do nosso assistente inteligente.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        size="lg" 
                        onClick={onLogin} 
                        className="relative z-50 text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/30 rounded-xl"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Começar Gratuitamente
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="relative z-50 text-lg px-8 py-6 rounded-xl border-2 hover:bg-primary/5"
                      >
                        Saber Mais
                      </Button>
                    </motion.div>
                  </div>

                  <p className={cn("mt-6 text-sm", theme?.muted)}>
                    ✨ Sem cartão de crédito • 🚀 Acesso instantâneo • 📚 1200+ sermões
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn("border-t py-12 px-4", theme?.border, theme?.card)}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                {appConfig.prophetAvatar ? (
                  <AvatarImage src={appConfig.prophetAvatar} alt={appConfig.prophetName} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10">
                    <Crown className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className={cn("font-bold text-lg", theme?.text)}>{appConfig.appName}</p>
                <p className={cn("text-sm", theme?.muted)}>Converse com {appConfig.prophetName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {stats.slice(0, 2).map((stat, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="flex items-center gap-2 px-3 py-1.5"
                >
                  <stat.icon className="h-4 w-4 text-primary" />
                  {stat.value} {stat.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className={cn("mt-8 pt-8 border-t text-center", theme?.border)}>
            <p className={cn("text-sm", theme?.muted)}>
              © 2024 {appConfig.appName}. Todos os direitos reservados. • 
              <span className="text-primary"> Feito com fé e tecnologia</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
