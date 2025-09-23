"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"

export function DatabaseConfig() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Configuração do Banco de Dados</h1>
        <p className="text-muted-foreground">Conexões e configurações de backup</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurações de BD
          </CardTitle>
          <CardDescription>Em desenvolvimento...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Esta funcionalidade será implementada em breve.</p>
        </CardContent>
      </Card>
    </div>
  )
}
