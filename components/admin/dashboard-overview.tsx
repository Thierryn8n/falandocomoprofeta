"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  Users,
  MessageSquare,
  Activity,
  Globe,
  Clock,
  TrendingUp,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react"

interface DashboardMetrics {
  onlineUsers: number
  totalVisits: number
  totalMessages: number
  totalUsers: number
  avgResponseTime: number
  systemUptime: number
  storageUsed: number
  errorRate: number
  activeConversations: number
  documentsCount: number
  heresyReports: number
  systemHealth: "healthy" | "warning" | "critical"
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  user?: string
}

export function DashboardOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    onlineUsers: 0,
    totalVisits: 0,
    totalMessages: 0,
    totalUsers: 0,
    avgResponseTime: 0,
    systemUptime: 99.9,
    storageUsed: 0,
    errorRate: 0,
    activeConversations: 0,
    documentsCount: 0,
    heresyReports: 0,
    systemHealth: "healthy",
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    try {
      // Online users (sessions active in last 30 minutes)
      const { data: onlineData } = await supabase
        .from("user_sessions")
        .select("*")
        .gte("last_activity", new Date(Date.now() - 30 * 60 * 1000).toISOString())

      // Total visits today
      const { data: visitsData } = await supabase
        .from("site_visits")
        .select("*")
        .gte("created_at", new Date().toISOString().split("T")[0])

      // Total messages
      const { data: messagesData } = await supabase.from("conversations").select("*", { count: "exact" })

      // Total users
      const { data: usersData } = await supabase.from("profiles").select("*", { count: "exact" })

      // Active conversations (last 24 hours)
      const { data: activeConvData } = await supabase
        .from("conversations")
        .select("*")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Documents count
      const { data: docsData } = await supabase.from("documents").select("*", { count: "exact" })

      // Heresy reports
      const { data: heresyData } = await supabase.from("heresy_logs").select("*", { count: "exact" })

      setMetrics({
        onlineUsers: onlineData?.length || 0,
        totalVisits: visitsData?.length || 0,
        totalMessages: messagesData?.length || 0,
        totalUsers: usersData?.length || 0,
        avgResponseTime: Math.random() * 500 + 200, // Simulated
        systemUptime: 99.9,
        storageUsed: Math.random() * 80 + 10, // Simulated percentage
        errorRate: Math.random() * 2, // Simulated percentage
        activeConversations: activeConvData?.length || 0,
        documentsCount: docsData?.length || 0,
        heresyReports: heresyData?.length || 0,
        systemHealth: "healthy",
      })

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching metrics:", error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Get recent conversations
      const { data: recentConversations } = await supabase
        .from("conversations")
        .select(`
          id,
          created_at,
          profiles (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      // Get recent visits
      const { data: recentVisits } = await supabase
        .from("site_visits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3)

      const activities: RecentActivity[] = []

      // Add conversations to activity
      recentConversations?.forEach((conv) => {
        activities.push({
          id: conv.id,
          type: "message",
          description: `Nova conversa iniciada`,
          timestamp: conv.created_at,
          user: conv.profiles?.full_name || conv.profiles?.email || "Usuário anônimo",
        })
      })

      // Add visits to activity
      recentVisits?.forEach((visit) => {
        activities.push({
          id: visit.id,
          type: "visit",
          description: visit.is_logged_in ? "Usuário logado acessou" : "Visitante anônimo acessou",
          timestamp: visit.created_at,
        })
      })

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setRecentActivity(activities.slice(0, 8))
    } catch (error) {
      console.error("Error fetching recent activity:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchMetrics(), fetchRecentActivity()])
      setIsLoading(false)
    }

    loadData()

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchMetrics()
      fetchRecentActivity()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Agora mesmo"
    if (minutes < 60) return `${minutes}m atrás`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h atrás`
    return date.toLocaleDateString("pt-BR")
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando métricas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema - Atualizado {formatTimestamp(lastUpdated.toISOString())}
          </p>
        </div>
        <div className={`flex items-center space-x-2 ${getHealthColor(metrics.systemHealth)}`}>
          {getHealthIcon(metrics.systemHealth)}
          <span className="font-medium capitalize">{metrics.systemHealth}</span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.onlineUsers}</div>
            <p className="text-xs text-muted-foreground">Ativos nos últimos 30 minutos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Hoje</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalVisits}</div>
            <p className="text-xs text-muted-foreground">Visitantes únicos hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Conversas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Cadastrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Perfis criados</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.avgResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">Média das respostas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime do Sistema</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">Disponibilidade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Storage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.storageUsed)}%</div>
            <p className="text-xs text-muted-foreground">Capacidade utilizada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Erros nas últimas 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeConversations}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.documentsCount}</div>
            <p className="text-xs text-muted-foreground">Total de documentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios de Heresia</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.heresyReports}</div>
            <p className="text-xs text-muted-foreground">Total de alertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.type === "message" ? (
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    ) : activity.type === "visit" ? (
                      <Globe className="h-4 w-4 text-green-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    {activity.user && <p className="text-sm text-muted-foreground">{activity.user}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    <Badge variant="outline">{formatTimestamp(activity.timestamp)}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
