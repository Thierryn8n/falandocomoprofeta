"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Key, FileText, Shield, Table } from "lucide-react"
import type { AIVerificationResult, TableAnalysis } from "@/lib/ai-verification"

export function AIVerification() {
  const [verification, setVerification] = useState<AIVerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    runVerification()
  }, [])

  const runVerification = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/verify-ai")
      const data = await response.json()

      if (data.success) {
        setVerification(data.verification)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Erro na verificação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível verificar a configuração da IA.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verificação da IA
          </CardTitle>
          <CardDescription>Verificando configuração e acesso aos dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!verification) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verificação da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Erro ao carregar verificação</p>
            <Button onClick={runVerification} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressValue =
    [verification.hasApiKeys, verification.hasSystemPrompt, verification.hasTableAccess].filter(Boolean).length * 33.33

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Status da Configuração da IA
              </CardTitle>
              <CardDescription>
                Verificação completa da configuração e acesso aos dados (Prioridade: Gemini)
              </CardDescription>
            </div>
            <Button variant="outline" onClick={runVerification} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Verificar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso da Configuração</span>
                <span className="text-sm text-muted-foreground">{Math.round(progressValue)}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
            <div className="flex items-center gap-2">
              {verification.isValid ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Incompleto
                </Badge>
              )}
            </div>
          </div>

          {/* Status dos Componentes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Key className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Chaves de API</p>
                {getStatusBadge(verification.hasApiKeys, verification.hasApiKeys ? "Ativa" : "Inativa")}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">System Prompt</p>
                {getStatusBadge(
                  verification.hasSystemPrompt,
                  verification.hasSystemPrompt ? "Configurado" : "Pendente",
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Database className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Acesso aos Dados</p>
                {getStatusBadge(verification.hasTableAccess, verification.hasTableAccess ? "Conectado" : "Erro")}
              </div>
            </div>
          </div>

          {/* Erros e Avisos */}
          {verification.errors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800 dark:text-red-200">Erros Encontrados</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {verification.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {verification.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">Avisos</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                {verification.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise das Tabelas */}
      {verification.tableAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Análise das Tabelas do Supabase
            </CardTitle>
            <CardDescription>Dados disponíveis para a IA processar e usar em suas respostas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verification.tableAnalysis.map((table: TableAnalysis) => (
                <div key={table.tableName} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{table.tableName}</h4>
                    <Badge variant={table.hasData ? "default" : "secondary"}>{table.recordCount} registros</Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Database className="h-3 w-3" />
                      <span>{table.structure.length} campos</span>
                    </div>

                    {table.lastUpdated && (
                      <div className="text-xs">
                        Última atualização: {new Date(table.lastUpdated).toLocaleString("pt-BR")}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mt-2">
                      {table.structure.slice(0, 3).map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                      {table.structure.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{table.structure.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status de Sucesso */}
      {verification.isValid && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-200">
                  IA Configurada e Conectada com Sucesso!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  A IA tem acesso completo aos dados do Supabase e está pronta para fornecer respostas contextualizadas.
                  Prioridade configurada para Gemini.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
