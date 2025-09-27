"use client"

import { useState } from "react"
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
} from "lucide-react"

interface ChatGPTLandingPageProps {
  onLogin: () => void
  appConfig: {
    appName: string
    prophetName: string
    prophetAvatar: string
  }
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
    description: "Dialogue com o Profeta William Branham através de IA avançada",
  },
  {
    icon: BookOpen,
    title: "Conhecimento Profundo",
    description: "Acesso às mensagens e ensinamentos do Profeta",
  },
  {
    icon: Shield,
    title: "Respostas Autênticas",
    description: "Baseado nos sermões e doutrinas originais",
  },
  {
    icon: Zap,
    title: "Disponível 24/7",
    description: "Tire suas dúvidas a qualquer hora do dia",
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

export function ChatGPTLandingPage({ onLogin, appConfig }: ChatGPTLandingPageProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleSubmit = () => {
    onLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      {/* BOTÃO INVISÍVEL GIGANTE PARA ATIVAR POPUP */}
      <button
        onClick={onLogin}
        className="fixed inset-0 w-full h-full bg-transparent z-50 cursor-pointer"
        aria-label="Abrir cadastro"
      />

      {/* Header */}
      <header className="relative z-20 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {appConfig.prophetAvatar ? (
                <AvatarImage src={appConfig.prophetAvatar} alt={appConfig.prophetName} />
              ) : (
                <AvatarFallback className="bg-primary/20">
                  {appConfig.prophetName?.charAt(0) || "P"}
                </AvatarFallback>
              )}
                <AvatarFallback>
                  <Crown className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-foreground">{appConfig.appName}</h1>
                <p className="text-sm text-muted-foreground">Converse com {appConfig.prophetName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative z-20">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button onClick={onLogin} className="relative z-20">
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4 px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Converse com o
              <br />
              <span className="text-primary">Profeta William Branham</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Tire suas dúvidas sobre os mistérios da Palavra de Deus através de uma conversa inteligente com o Profeta
              do tempo do fim.
            </p>
          </div>

          {/* Chat Interface Preview */}
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="border-2 border-primary/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-8 w-8">
                    {appConfig.prophetAvatar ? (
                <AvatarImage src={appConfig.prophetAvatar} alt={appConfig.prophetName} />
              ) : (
                <AvatarFallback className="bg-primary/20">
                  {appConfig.prophetName?.charAt(0) || "P"}
                </AvatarFallback>
              )}
                    <AvatarFallback>WB</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{appConfig.prophetName}</p>
                    <p className="text-xs text-muted-foreground">Online agora</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 max-w-xs">
                      <p className="text-sm">
                        Bem-vindo, irmão! Que a paz do Senhor Jesus Cristo esteja contigo. Faça sua pergunta sobre a
                        Palavra de Deus.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2 relative z-20">
                    <Input
                      placeholder="Digite sua pergunta para o Profeta..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="icon" className="relative z-20">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="relative z-20">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSubmit} className="relative z-20">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs relative z-20"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" onClick={onLogin} className="relative z-20 text-lg px-8 py-3">
            Experimentar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher nosso assistente?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uma experiência única para estudar e compreender os ensinamentos do Profeta William Branham
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Suggestions Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas Populares</h2>
            <p className="text-xl text-muted-foreground">Veja algumas das perguntas mais feitas ao Profeta</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/20 hover:border-l-primary relative z-20"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-medium">{suggestion}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O que dizem nossos usuários</h2>
            <p className="text-xl text-muted-foreground">Experiências reais de pessoas que usam nosso assistente</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {testimonial.avatar ? (
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                ) : (
                  <AvatarFallback className="bg-primary/20">
                    {testimonial.name.charAt(0)}
                  </AvatarFallback>
                )}
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-12">
              <div className="mb-6">
                <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Comece sua jornada espiritual hoje</h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Junte-se a milhares de pessoas que já descobriram os mistérios da Palavra através do nosso assistente
                  inteligente.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={onLogin} className="relative z-20 text-lg px-8 py-3">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="relative z-20 text-lg px-8 py-3 bg-transparent">
                  Saber Mais
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Avatar className="h-8 w-8">
                {appConfig.prophetAvatar ? (
                <AvatarImage src={appConfig.prophetAvatar} alt={appConfig.prophetName} />
              ) : (
                <AvatarFallback className="bg-primary/20">
                  {appConfig.prophetName?.charAt(0) || "P"}
                </AvatarFallback>
              )}
                <AvatarFallback>WB</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{appConfig.appName}</p>
                <p className="text-sm text-muted-foreground">Converse com {appConfig.prophetName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                1000+ usuários ativos
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                10k+ conversas
              </Badge>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2024 {appConfig.appName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
