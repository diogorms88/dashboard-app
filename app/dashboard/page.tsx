'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { FabButton } from '@/components/fab-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, RefreshCw } from 'lucide-react'
import ProductionCharts from '@/components/production-charts'
import { dashboardApiService } from '@/lib/api'

interface DashboardData {
  tempoTotalParada: number;
  percentualParada: number;
  totalSkids: number;
  percentualMeta: number;
  skidsVazios: number;
  percentualRepintura: number;
  quantidadeRepintura: number;
  mtbf: number;
  mttr: number;
  acumuladoHoraHora: number;
  acumuladoProduzido: number;
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [turno, setTurno] = useState('all')
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    tempoTotalParada: 0,
    percentualParada: 0,
    totalSkids: 0,
    percentualMeta: 0,
    skidsVazios: 0,
    percentualRepintura: 0,
    quantidadeRepintura: 0,
    mtbf: 0,
    mttr: 0,
    acumuladoHoraHora: 0,
    acumuladoProduzido: 0
  })
  const [loading, setLoading] = useState(false)

  const handleAtualizar = async () => {
    setLoading(true)
    try {
      const filters = {
        startDate: dataInicial || undefined,
        endDate: dataFinal || undefined,
        shift: turno !== 'all' ? turno : undefined
      }

      const data = await dashboardApiService.getDashboardData(filters)
      setDashboardData(data)
    } catch (error) {
      // Silent error handling for dashboard data loading
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Definir datas padrão (hoje - banco limpo)
    const hoje = new Date().toISOString().split('T')[0]
    setDataInicial(hoje)
    setDataFinal(hoje)
  }, [])

  useEffect(() => {
    if (dataInicial && dataFinal) {
      handleAtualizar()
    }
    
    // Listener para atualização automática após novos lançamentos
    const handleProductionUpdate = () => {
      handleAtualizar()
    }
    
    window.addEventListener('productionRecordCreated', handleProductionUpdate)
    
    return () => {
      window.removeEventListener('productionRecordCreated', handleProductionUpdate)
    }
  }, [dataInicial, dataFinal])

  return (
    <div className="p-6 relative">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Produção</h1>
      
      {/* Seção de Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Turno</label>
              <Select value={turno} onValueChange={setTurno}>
                 <SelectTrigger>
                   <SelectValue placeholder="Todos os turnos" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos os turnos</SelectItem>
                   <SelectItem value="1">1º Turno (06h-15h)</SelectItem>
                   <SelectItem value="2">2º Turno (15h-24h)</SelectItem>
                   <SelectItem value="3">3º Turno (00h-06h)</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            <Button onClick={handleAtualizar} disabled={loading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Card 1: Tempo Total de Parada */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Total de Parada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardData.tempoTotalParada} min</div>
            <div className="text-lg font-semibold text-red-500 mt-1">{dashboardData.percentualParada}%</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo e % de paradas</p>
          </CardContent>
        </Card>

        {/* Card 2: Total de Skids */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Skids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardData.totalSkids}</div>
            <div className="text-lg font-semibold text-blue-500 mt-1">{dashboardData.percentualMeta}%</div>
            <p className="text-xs text-muted-foreground mt-1">Skids processados e % da meta</p>
          </CardContent>
        </Card>

        {/* Card 3: Skids Vazios */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Skids Vazios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardData.skidsVazios}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.totalSkids > 0 ? 
                `${Math.round((dashboardData.skidsVazios / (dashboardData.totalSkids + dashboardData.skidsVazios)) * 100)}% do total de skids` 
                : 'Skids sem produção'
              }
            </p>
          </CardContent>
        </Card>

        {/* Card 4: % Repintura */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">% Repintura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{dashboardData.percentualRepintura}%</div>
            <p className="text-xs text-muted-foreground mt-1">{dashboardData.quantidadeRepintura} peças</p>
          </CardContent>
        </Card>

        {/* Card 5: MTBF */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MTBF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.mtbf} min</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio entre falhas</p>
          </CardContent>
        </Card>

        {/* Card 6: MTTR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MTTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dashboardData.mttr} min</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio de reparo</p>
          </CardContent>
        </Card>

        {/* Card 7: Acumulado Hora Hora */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acumulado Hora Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{dashboardData.acumuladoHoraHora}</div>
            <p className="text-xs text-muted-foreground mt-1">Meta planejada</p>
          </CardContent>
        </Card>

        {/* Card 8: Acumulado Produzido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acumulado Produzido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{dashboardData.acumuladoProduzido}</div>
            <p className="text-xs text-muted-foreground mt-1">de {dashboardData.acumuladoHoraHora} planejados</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos de Produção */}
      <div className="mb-6">
        <ProductionCharts 
          filters={{
            startDate: dataInicial,
            endDate: dataFinal,
            shift: turno
          }}
        />
      </div>
      
      {/* FAB Button */}
      {(user?.papel === 'admin' || user?.papel === 'manager' || user?.papel === 'operator') && (
        <FabButton targetDate={dataInicial} />
      )}
    </div>
  )
}