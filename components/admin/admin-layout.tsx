"use client"

import type React from "react"
import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// Componente para acessibilidade
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
)
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  appConfig: {
    appName: string
    logo: string
    favicon: string
    prophetAvatar: string
    prophetName: string
  }
  theme?: any
}

export function AdminLayout({ children, activeTab, onTabChange, appConfig, theme }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // For mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // For desktop - starts collapsed

  const handleConfigUpdate = (config: any) => {
    console.log("Config update handled in layout:", config)
  }

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    if (sidebarOpen) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className={cn("flex h-screen", theme?.bg)}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          appConfig={appConfig}
          onConfigUpdate={handleConfigUpdate}
          onClose={() => {}} // Not used on desktop
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          isOpen={!sidebarCollapsed}
          theme={theme}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className={cn("p-0 w-80", theme?.card)}>
          <SheetTitle asChild>
            <VisuallyHidden>Menu Admin</VisuallyHidden>
          </SheetTitle>
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            appConfig={appConfig}
            onConfigUpdate={handleConfigUpdate}
            onClose={() => setSidebarOpen(false)}
            onToggle={() => {}} // No toggle inside mobile sheet
            isOpen={true} // Always open inside the sheet
            theme={theme}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className={cn("lg:hidden flex items-center justify-between p-4 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10", theme?.header, theme?.border)}>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className={cn(theme?.button)}>
            <Menu className={cn("h-6 w-6", theme?.muted)} />
          </Button>
          <h1 className={cn("text-lg font-semibold capitalize", theme?.text)}>{activeTab.replace(/-/g, " ")}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
