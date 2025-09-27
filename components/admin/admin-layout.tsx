"use client"

import type React from "react"
import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
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
}

export function AdminLayout({ children, activeTab, onTabChange, appConfig }: AdminLayoutProps) {
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
    <div className="flex h-screen bg-background">
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
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            appConfig={appConfig}
            onConfigUpdate={handleConfigUpdate}
            onClose={() => setSidebarOpen(false)}
            onToggle={() => {}} // No toggle inside mobile sheet
            isOpen={true} // Always open inside the sheet
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold capitalize">{activeTab.replace(/-/g, " ")}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
