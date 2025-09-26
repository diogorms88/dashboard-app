'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApiService } from '@/lib/api';

interface HourlyProductionData {
  time: string;
  production: number;
  target: number;
  records: number;
}

interface SCurveData {
  time: string;
  cumulative: number;
  production: number;
  timeSlot: string;
}

interface TargetCurveData {
  time: string;
  target: number;
}

interface ParetoData {
  reason: string;
  frequency: number;
  total_duration: number;
}

interface AreaData {
  area: string;
  frequency: number;
  total_duration: number;
}

interface HeatmapData {
  date: string;
  time_slot: string;
  total_frequency: number;
  total_duration: number;
  reasons: {
    reason: string;
    frequency: number;
    duration: number;
  }[];
}

interface ChartData {
  hourlyProduction: HourlyProductionData[];
  sCurve: SCurveData[];
  summary: {
    totalProduction: number;
    averageHourlyRate: number;
    targetRate: number;
  };
}

interface ProductionChartsProps {
  filters?: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  };
}

export default function ProductionCharts({ filters }: ProductionChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [paretoData, setParetoData] = useState<ParetoData[]>([]);
  const [areaData, setAreaData] = useState<AreaData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [paretoMetric, setParetoMetric] = useState<'frequency' | 'time'>('frequency');
  const [areaMetric, setAreaMetric] = useState<'frequency' | 'time'>('frequency');
  const [heatmapMetric, setHeatmapMetric] = useState<'frequency' | 'duration'>('frequency');
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [selectedHeatmapData, setSelectedHeatmapData] = useState<{
    reason: string;
    hour: number;
    details: { date: string; duration: number; frequency: number; }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cores para o gráfico de pizza
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

  // Processar dados do Pareto baseado na métrica selecionada
  const processedParetoData = React.useMemo(() => {
    const data = paretoData.length > 0 ? paretoData : [];
    
    if (data.length === 0) {
      return [];
    }

    return data
      .slice(0, 10) // TOP 10
      .map(item => ({
        reason: item.reason,
        value: paretoMetric === 'frequency' ? item.frequency : item.total_duration // tempo já em minutos
      }))
      .sort((a, b) => b.value - a.value)
      .map((item, index, array) => {
        const total = array.reduce((sum, curr) => sum + curr.value, 0);
        const cumulativeValue = array.slice(0, index + 1).reduce((sum, curr) => sum + curr.value, 0);
        const cumulativePercent = total > 0 ? Math.round((cumulativeValue / total) * 100) : 0;
        return {
          ...item,
          cumulativePercent
        };
      });
  }, [paretoData, paretoMetric]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const chartFilters = {
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        shift: filters?.shift && filters.shift !== 'all' ? filters.shift : undefined
      };

      // Buscar dados em paralelo
      const [hourlyData, sCurveData, summary, paretoData, areaData, heatmapData] = await Promise.all([
        dashboardApiService.getProductionHourlyData(chartFilters),
        dashboardApiService.getSCurveData(chartFilters),
        dashboardApiService.getChartSummary(chartFilters),
        dashboardApiService.getParetoParadas(chartFilters),
        dashboardApiService.getParadasByArea(chartFilters),
        dashboardApiService.getHeatmapParadas(chartFilters)
      ]);

      setChartData({
        hourlyProduction: hourlyData,
        sCurve: sCurveData,
        summary
      });

      setParetoData(paretoData);
      setAreaData(areaData);
      setHeatmapData(heatmapData);
    } catch (err) {
      console.error('Erro ao buscar dados dos gráficos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [filters]);

  // Escutar eventos de atualização de produção
  useEffect(() => {
    const handleProductionUpdate = () => {
      fetchChartData();
    };

    window.addEventListener('productionRecordCreated', handleProductionUpdate);
    return () => {
      window.removeEventListener('productionRecordCreated', handleProductionUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produção por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground">Carregando gráfico...</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Curva S - Produção Acumulada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground">Carregando gráfico...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produção por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-red-500">Erro: {error}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Curva S - Produção Acumulada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-red-500">Erro: {error}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  // Dados da Curva S já vêm com target incluído
  const combinedSCurveData = chartData.sCurve;

  // Dados de produção por hora já vêm formatados
  const formattedHourlyData = chartData.hourlyProduction;

  return (
    <div>
      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Produção por Hora */}
      <Card>
        <CardHeader>
          <CardTitle>Produção por Hora</CardTitle>
          <CardDescription>
            Meta: {chartData.summary.targetRate} skids/hora | 
            Média Atual: {chartData.summary.averageHourlyRate.toFixed(1)} skids/hora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedHourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  label={{ value: 'Skids Produzidos', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} skids`,
                    name === 'production' ? 'Produção Real' : 'Meta'
                  ]}
                  labelFormatter={(label) => `Horário: ${label}`}
                />
                <Legend />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 5" label="Meta (50/h)" />
                <Bar 
                  dataKey="production" 
                  fill="#3b82f6" 
                  name="Produção Real"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
             </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico da Curva S */}
      <Card>
        <CardHeader>
          <CardTitle>Curva S - Produção Acumulada</CardTitle>
          <CardDescription>
            Total Produzido: {chartData.summary.totalProduction} skids
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedSCurveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  label={{ value: 'Skids Acumulados', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} skids`,
                    name === 'cumulative' ? 'Produção Acumulada' : 'Meta Acumulada (sem paradas)'
                  ]}
                  labelFormatter={(label) => `Horário: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Produção Acumulada"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Meta Acumulada (sem paradas)"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Gráficos de Paradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Gráfico Pareto de Paradas (TOP 10) */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Pareto de Paradas (TOP 10)</CardTitle>
                <CardDescription>
                  Principais motivos de parada por {paretoMetric === 'frequency' ? 'Frequência' : 'Tempo'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setParetoMetric('frequency')}
                  className={`px-3 py-1 text-xs rounded ${
                    paretoMetric === 'frequency'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Frequência
                </button>
                <button
                  onClick={() => setParetoMetric('time')}
                  className={`px-3 py-1 text-xs rounded ${
                    paretoMetric === 'time'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tempo
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {processedParetoData.length === 0 ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-medium">Nenhum dado de parada disponível</p>
                  <p className="text-sm mt-2">Os dados aparecerão aqui quando houver registros de paradas no período selecionado.</p>
                </div>
              </div>
            ) : (
              <div className="h-96 flex justify-center">
                <div className="w-full max-w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={processedParetoData}
                      margin={{ top: 30, right: 80, left: 40, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        type="category" 
                        dataKey="reason"
                        axisLine={true}
                        tickLine={true}
                        tick={{ fontSize: 10, fill: '#374151', angle: -45, textAnchor: 'end' }}
                        height={60}
                        interval={0}
                      />
                      <YAxis 
                        type="number" 
                        domain={[0, 'dataMax + 2']}
                        axisLine={true}
                        tickLine={true}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ 
                          value: paretoMetric === 'frequency' ? 'Frequência' : 'Tempo (min)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                        }}
                      />
                      <YAxis 
                        yAxisId="percent"
                        type="number"
                        orientation="right"
                        domain={[0, 100]}
                        axisLine={true}
                        tickLine={true}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ 
                          value: '% Acumulado', 
                          angle: 90, 
                          position: 'insideRight',
                          style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
                        }}
                      />
                     <Tooltip 
                       formatter={(value, name) => {
                         if (name === 'value') {
                           return [
                             `${value} ${paretoMetric === 'frequency' ? 'ocorrências' : 'min'}`,
                             paretoMetric === 'frequency' ? 'Frequência' : 'Tempo Total'
                           ];
                         }
                         if (name === 'cumulativePercent') {
                           return [`${value}%`, '% Acumulado'];
                         }
                         return [value, name];
                       }}
                       labelFormatter={(label) => `Motivo: ${label}`}
                       contentStyle={{
                         backgroundColor: '#ffffff',
                         border: '1px solid #d1d5db',
                         borderRadius: '8px',
                         boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                         fontSize: '12px'
                       }}
                     />
                     <Legend 
                       verticalAlign="bottom"
                       height={36}
                       iconType="rect"
                       wrapperStyle={{ paddingTop: '10px' }}
                     />
                     <Bar 
                        dataKey="value" 
                        fill="#3b82f6" 
                        name={paretoMetric === 'frequency' ? 'Frequência' : 'Tempo (min)'}
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                        minPointSize={3}
                      />
                     <Line 
                        yAxisId="percent"
                        type="monotone" 
                        dataKey="cumulativePercent" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="% Acumulado"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        connectNulls={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Parada por Área */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Paradas por Área</CardTitle>
                <CardDescription>
                  Distribuição de paradas por área por {areaMetric === 'frequency' ? 'Frequência' : 'Tempo'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAreaMetric('frequency')}
                  className={`px-3 py-1 text-xs rounded ${
                    areaMetric === 'frequency'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Frequência
                </button>
                <button
                  onClick={() => setAreaMetric('time')}
                  className={`px-3 py-1 text-xs rounded ${
                    areaMetric === 'time'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tempo
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={areaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => 
                      `${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={areaMetric === 'frequency' ? 'frequency' : 'total_duration'}
                  >
                    {areaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} ${areaMetric === 'frequency' ? 'ocorrências' : 'min'}`,
                      areaMetric === 'frequency' ? 'Frequência' : 'Tempo Total'
                    ]}
                    labelFormatter={(label) => `Área: ${label}`}
                  />
                  <Legend 
                    formatter={(value, entry) => {
                      const area = entry.payload?.area || value;
                      return area.replace(/🧪|👥|📦|🔧|🧽|🏭|✅|⚙️|🎨|🛡️|❓/g, '').trim();
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap de Paradas */}
      <Card className="col-span-full mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Heatmap de Paradas</CardTitle>
              <CardDescription>Intensidade de paradas por horário e motivo (excluindo paradas programadas)</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Métrica:</label>
              <select 
                value={heatmapMetric} 
                onChange={(e) => setHeatmapMetric(e.target.value as 'frequency' | 'duration')}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="frequency">Frequência</option>
                <option value="duration">Duração (min)</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {heatmapData.length > 0 ? (
              <div className="min-w-max">
                {/* Cabeçalho com 24 horas */}
                <div className="grid grid-cols-25 gap-1 mb-2" style={{ gridTemplateColumns: '200px repeat(24, 60px)' }}>
                  <div className="text-xs font-medium p-2 bg-gray-100 rounded text-center">
                    Motivo
                  </div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="text-xs font-medium text-center p-2 bg-gray-100 rounded">
                      {String(i).padStart(2, '0')}h
                    </div>
                  ))}
                </div>
                
                {/* Processar dados por motivo */}
                {(() => {
                  // Agrupar dados por motivo e calcular soma diária
                  const reasonTotals: { [key: string]: number } = {};
                  const reasonHourlyData: { [key: string]: { [hour: number]: { value: number; details: any[] } } } = {};
                  
                  heatmapData.forEach(item => {
                    item.reasons.forEach(reason => {
                      const reasonName = reason.reason;
                      const hour = parseInt(item.time_slot.split('h')[0]);
                      const value = heatmapMetric === 'frequency' ? reason.frequency : reason.duration;
                      
                      if (!reasonTotals[reasonName]) {
                        reasonTotals[reasonName] = 0;
                        reasonHourlyData[reasonName] = {};
                      }
                      
                      reasonTotals[reasonName] += value;
                      
                      if (!reasonHourlyData[reasonName][hour]) {
                        reasonHourlyData[reasonName][hour] = {
                          value: 0,
                          details: []
                        };
                      }
                      
                      reasonHourlyData[reasonName][hour].value += value;
                      reasonHourlyData[reasonName][hour].details.push({
                        date: item.date,
                        duration: reason.duration,
                        frequency: reason.frequency
                      });
                    });
                  });
                  
                  // Ordenar motivos por soma decrescente
                  const sortedReasons = Object.keys(reasonTotals).sort((a, b) => reasonTotals[b] - reasonTotals[a]);
                  
                  return sortedReasons.map(reasonName => (
                    <div key={reasonName} className="grid grid-cols-25 gap-1 mb-1" style={{ gridTemplateColumns: '200px repeat(24, 60px)' }}>
                      {/* Nome do motivo */}
                      <div className="text-xs font-medium p-2 bg-gray-50 rounded flex items-center">
                        <span className="truncate" title={reasonName}>{reasonName}</span>
                      </div>
                      
                      {/* Células para cada hora */}
                      {Array.from({ length: 24 }, (_, hour) => {
                        const hourData = reasonHourlyData[reasonName][hour];
                        const value = hourData?.value || 0;
                        
                        return (
                          <div
                            key={hour}
                            className={`h-8 rounded flex items-center justify-center text-xs font-medium transition-all ${
                              value > 0 ? 'cursor-pointer hover:scale-105 bg-yellow-400 text-black' : 'bg-gray-100'
                            }`}
                            title={value > 0 ? `${reasonName}\n${String(hour).padStart(2, '0')}h\n${heatmapMetric === 'frequency' ? 'Frequência' : 'Duração'}: ${value}${heatmapMetric === 'duration' ? ' min' : ''}\nSoma do motivo no período: ${reasonTotals[reasonName]}${heatmapMetric === 'duration' ? ' min' : ''}` : ''}
                            onClick={() => {
                              if (value > 0 && hourData?.details) {
                                setSelectedHeatmapData({
                                  reason: reasonName,
                                  hour: hour,
                                  details: hourData.details
                                });
                                setShowHeatmapModal(true);
                              }
                            }}
                          >
                            {value > 0 ? value : ''}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Nenhum dado de parada encontrado para o período selecionado
              </div>
            )}
          </div>
        </CardContent>
       </Card>

       {/* Modal de Detalhes do Heatmap */}
       {showHeatmapModal && selectedHeatmapData && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold">
                 {selectedHeatmapData.reason} - {String(selectedHeatmapData.hour).padStart(2, '0')}h
               </h3>
               <button
                 onClick={() => setShowHeatmapModal(false)}
                 className="text-gray-500 hover:text-gray-700 text-xl font-bold"
               >
                 ×
               </button>
             </div>
             
             <div className="space-y-3">
               {selectedHeatmapData.details.map((detail, index) => (
                 <div key={index} className="border rounded-lg p-3 bg-gray-50">
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                       <span className="font-medium text-gray-600">Data:</span>
                       <span className="ml-2">{new Date(detail.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                     </div>
                     <div>
                       <span className="font-medium text-gray-600">Duração:</span>
                       <span className="ml-2">{detail.duration} min</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="mt-4 pt-4 border-t">
               <div className="text-sm text-gray-600">
                 <strong>Total de ocorrências:</strong> {selectedHeatmapData.details.length}
               </div>
               <div className="text-sm text-gray-600">
                 <strong>Duração total:</strong> {selectedHeatmapData.details.reduce((sum, d) => sum + d.duration, 0)} min
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}