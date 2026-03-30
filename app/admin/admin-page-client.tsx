"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DashboardOverview } from "@/components/admin/dashboard-overview"
import { UserManager } from "@/components/admin/user-manager"
import { ContentManager } from "@/components/admin/content-manager"
import { HeresyManagement } from "@/components/admin/heresy-management"
import { HeresyLogs } from "@/components/admin/heresy-logs"
import { APIKeysConfig } from "@/components/admin/api-keys-config"
import { AISettings } from "@/components/admin/ai-settings"
import { ConversationsManager } from "@/components/admin/conversations-manager"
import { GeolocationChart } from "@/components/admin/geolocation-chart"
import { RadioConfig } from "@/components/admin/config/radio-config"
import { AppIdentityConfig } from "@/components/admin/config/app-identity-config"
import { ProphetProfileConfig } from "@/components/admin/config/prophet-profile-config"
import { ChatBehaviorConfig } from "@/components/admin/config/chat-behavior-config"
import { InterfaceThemeConfig } from "@/components/admin/config/interface-theme-config"
import { SecurityConfig } from "@/components/admin/config/security-config"
import { AbacatePayUnified } from "@/components/admin/abacate-pay-unified"
import MercadoPagoUnified from "@/components/admin/mercado-pago-unified"
import PaymentSystemSelector from "@/components/admin/payment-system-selector"
import { DatabaseConfig } from "@/components/admin/config/database-config"
import { EmailNotificationsConfig } from "@/components/admin/config/email-notifications-config"
import { PerformanceConfig } from "@/components/admin/config/performance-config"
import { MobileSettingsConfig } from "@/components/admin/config/mobile-settings-config"
import { AnalyticsConfig } from "@/components/admin/config/analytics-config"
import { AdvancedConfig } from "@/components/admin/config/advanced-config"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useAppConfig } from "@/hooks/use-app-config"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function AdminPageClient() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { user, profile, loading: authLoading, isAdmin } = useSupabaseAuth()
  const { getConfigValue, updateConfig, loading: configLoading } = useAppConfig()
  const { toast } = useToast()

  // Debug logs
  useEffect(() => {
    console.log("Admin Page Debug:", {
      user: user?.email,
      profile: profile,
      isAdmin: isAdmin,
      authLoading: authLoading,
    })
  }, [user, profile, isAdmin, authLoading])

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log("No user found, redirecting to home")
        window.location.href = "/"
      } else if (!isAdmin) {
        console.log("User is not admin, redirecting to home")
        window.location.href = "/"
      } else {
        console.log("User is admin, allowing access")
      }
    }
  }, [user, isAdmin, authLoading])

  const handleConfigUpdate = async (category: string, newValues: Record<string, any>) => {
    try {
      await updateConfig(category, newValues)
      toast({
        title: "Configurações atualizadas",
        description: "As alterações foram salvas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    }
  }



  if (authLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Usuário não encontrado. Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Acesso negado. Você não tem permissões de administrador.</p>
          <p className="text-sm text-muted-foreground mt-2">Role atual: {profile?.role || "não definido"}</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />
      case "users":
        return <UserManager />
      case "conversations":
        return <ConversationsManager />
      case "geolocation":
        return <GeolocationChart />
      case "content":
        return <ContentManager />
      case "heresy":
        return <HeresyManagement />
      case "heresy-logs":
        return <HeresyLogs />
      case "abacate-pay-unified":
        return <AbacatePayUnified />
      case "mercado-pago-unified":
        return <MercadoPagoUnified />
      case "payment-systems":
        return <PaymentSystemSelector />
      case "ai-settings":
        return <AISettings />
      case "app-identity":
        return (
          <AppIdentityConfig
            appConfig={getConfigValue("app_identity", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("app_identity", newValues)}
          />
        )
      case "prophet-profile":
        return (
          <ProphetProfileConfig
            appConfig={getConfigValue("prophet_profile", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("prophet_profile", newValues)}
          />
        )
      case "chat-behavior":
        return (
          <ChatBehaviorConfig
            appConfig={getConfigValue("chat_behavior", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("chat_behavior", newValues)}
          />
        )
      case "interface-theme":
        return (
          <InterfaceThemeConfig
            appConfig={getConfigValue("interface_theme", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("interface_theme", newValues)}
          />
        )
      case "security":
        return (
          <SecurityConfig
            appConfig={getConfigValue("security", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("security", newValues)}
          />
        )
      case "database":
        return (
          <DatabaseConfig
            appConfig={getConfigValue("database", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("database", newValues)}
          />
        )
      case "email-notifications":
        return (
          <EmailNotificationsConfig
            appConfig={getConfigValue("email_notifications", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("email_notifications", newValues)}
          />
        )
      case "performance":
        return (
          <PerformanceConfig
            appConfig={getConfigValue("performance", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("performance", newValues)}
          />
        )
      case "mobile-settings":
        return (
          <MobileSettingsConfig
            appConfig={getConfigValue("mobile_settings", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("mobile_settings", newValues)}
          />
        )
      case "analytics":
        return (
          <AnalyticsConfig
            appConfig={getConfigValue("analytics", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("analytics", newValues)}
          />
        )
      case "advanced":
        return (
          <AdvancedConfig
            appConfig={getConfigValue("advanced", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("advanced", newValues)}
          />
        )
      default:
        return <DashboardOverview />
    }
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      appConfig={{
        appName: getConfigValue("app_identity", {})?.appName || "Falando com o Profeta",
        logo: getConfigValue("app_identity", {})?.logo || "/placeholder.svg?height=32&width=32&text=Logo",
        favicon: getConfigValue("app_identity", {})?.favicon || "/placeholder.svg?height=16&width=16&text=F",
        prophetAvatar:
          getConfigValue("prophet_profile", {})?.prophetAvatar || "/placeholder.svg?height=40&width=40&text=WB",
        prophetName: getConfigValue("prophet_profile", {})?.prophetName || "Profeta William Branham",
      }}
    >
      {renderContent()}
    </AdminLayout>
  )
}
