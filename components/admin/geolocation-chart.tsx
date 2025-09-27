"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { 
  Globe, 
  MapPin, 
  Users, 
  Calendar, 
  RefreshCw, 
  Filter,
  TrendingUp,
  BarChart3
} from "lucide-react"

interface GeolocationStats {
  location: string
  count: number
  percentage: number
}

interface GeolocationData {
  total_users: number
  group_by: string
  stats: GeolocationStats[]
  date_range: {
    start_date: string | null
    end_date: string | null
  }
}

// Cores para o gráfico de pizza
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
]

export function GeolocationChart() {
  const [data, setData] = useState<GeolocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [groupBy, setGroupBy] = useState<"country" | "region" | "city">("country")
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")
  const { toast } = useToast()

  // Função para buscar dados de geolocalização
  const fetchGeolocationData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      params.append('group_by', groupBy)

      const response = await fetch(`/api/geolocation?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados de geolocalização')
      }

      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de geolocalização",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    fetchGeolocationData()
  }, [])

  // Função para aplicar filtros
  const handleApplyFilters = () => {
    fetchGeolocationData()
  }

  // Função para limpar filtros
  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
    setGroupBy("country")
    // Recarregar dados sem filtros
    setTimeout(() => {
      fetchGeolocationData()
    }, 100)
  }

  // Preparar dados para o gráfico de barras
  const prepareBarChartData = () => {
    if (!data?.stats) return []
    
    return data.stats.slice(0, 10).map(item => ({
      name: item.location.length > 20 ? item.location.substring(0, 20) + '...' : item.location,
      fullName: item.location,
      usuarios: item.count,
      porcentagem: item.percentage
    }))
  }

  // Preparar dados para o gráfico de pizza
  const preparePieChartData = () => {
    if (!data?.stats) return []
    
    const topStats = data.stats.slice(0, 8)
    const others = data.stats.slice(8)
    
    let pieData = topStats.map(item => ({
      name: item.location.length > 15 ? item.location.substring(0, 15) + '...' : item.location,
      fullName: item.location,
      value: item.count,
      percentage: item.percentage
    }))
    
    if (others.length > 0) {
      const othersCount = others.reduce((sum, item) => sum + item.count, 0)
      const othersPercentage = others.reduce((sum, item) => sum + item.percentage, 0)
      
      pieData.push({
        name: 'Outros',
        fullName: 'Outros',
        value: othersCount,
        percentage: othersPercentage
      })
    }
    
    return pieData
  }

  // Tooltip customizado para gráfico de barras
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-blue-600">
            <span className="font-medium">Usuários:</span> {data.usuarios}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Porcentagem:</span> {data.porcentagem.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  // Tooltip customizado para gráfico de pizza
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-blue-600">
            <span className="font-medium">Usuários:</span> {data.value}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Porcentagem:</span> {data.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const getGroupByLabel = () => {
    switch (groupBy) {
      case 'country': return 'País'
      case 'region': return 'Estado/Região'
      case 'city': return 'Cidade'
      default: return 'Localização'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            Localização dos Usuários
          </h2>
          <p className="text-muted-foreground">
            Distribuição geográfica dos usuários em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {data?.total_users || 0} usuários
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Configure os filtros para visualizar dados específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Agrupar por</Label>
              <Select value={groupBy} onValueChange={(value: "country" | "region" | "city") => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="country">País</SelectItem>
                  <SelectItem value="region">Estado/Região</SelectItem>
                  <SelectItem value="city">Cidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Gráfico</Label>
              <Select value={chartType} onValueChange={(value: "bar" | "pie") => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="pie">Pizza</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex gap-2">
                <Button 
                  onClick={handleApplyFilters} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  Aplicar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição por {getGroupByLabel()}
          </CardTitle>
          <CardDescription>
            {data?.date_range.start_date || data?.date_range.end_date ? (
              <>
                Período: {data.date_range.start_date ? new Date(data.date_range.start_date).toLocaleDateString('pt-BR') : 'Início'} até {data.date_range.end_date ? new Date(data.date_range.end_date).toLocaleDateString('pt-BR') : 'Hoje'}
              </>
            ) : (
              'Todos os períodos'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Carregando dados...</span>
            </div>
          ) : data?.stats && data.stats.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={prepareBarChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="usuarios" fill="#0088FE" />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={preparePieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {preparePieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <MapPin className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Nenhum dado encontrado</p>
              <p className="text-sm">Não há dados de geolocalização para o período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Estatísticas */}
      {data?.stats && data.stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Detalhadas</CardTitle>
            <CardDescription>
              Lista completa de localizações ordenada por número de usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">#</th>
                    <th className="text-left p-2 font-medium">{getGroupByLabel()}</th>
                    <th className="text-right p-2 font-medium">Usuários</th>
                    <th className="text-right p-2 font-medium">Porcentagem</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stats.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-muted-foreground">{index + 1}</td>
                      <td className="p-2 font-medium">{item.location}</td>
                      <td className="p-2 text-right">{item.count}</td>
                      <td className="p-2 text-right">
                        <Badge variant="secondary">
                          {item.percentage.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}