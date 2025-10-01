'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { ConfiguracaoConsumoModal } from '@/components/configuracao-consumo-modal';

interface MaterialData {
  totalPecasPintadas: number;
  consumoTotalMaterial: number;
  consumoTotalDiluentes: number;
  consumoDetalhado?: {
    primer: string;
    base: string;
    verniz: string;
    cores?: Array<{
      nome: string;
      consumo: string;
    }>;
    catalisador: string;
    diluentePrimer: string;
    diluenteBase: string;
    diluenteVerniz: string;
  };
  topModelos: { modelo: string; cor: string; quantidade: number }[];
  topCores: { cor: string; quantidade: number }[];
  topModelosGrafico: { modelo: string; quantidade: number }[];
}

interface HourlyProductionData {
  modelo: string;
  total: number;
  [key: string]: string | number; // Para as colunas dinâmicas de horas (h00, h01, etc.)
}

interface HourlyProductionResponse {
  data: HourlyProductionData[];
  availableHours: number[];
}

interface DetailedPaintingData {
  modelo: string;
  cor: string;
  quantidade: number;
  tipo: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

export default function MaterialsPage() {
  const { token, user } = useAuth();
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [turno, setTurno] = useState('all');
  const [materialData, setMaterialData] = useState<MaterialData | null>(null);
  const [hourlyProductionData, setHourlyProductionData] = useState<HourlyProductionData[]>([]);
  const [availableHours, setAvailableHours] = useState<number[]>([]);
  const [detailedPaintingData, setDetailedPaintingData] = useState<DetailedPaintingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterialData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dataInicial) params.append('startDate', dataInicial);
      if (dataFinal) params.append('endDate', dataFinal);
      if (turno !== 'all') params.append('shift', turno);
      
      // Adicionar cache-busting para evitar cache
      params.append('_t', Date.now().toString());
      
      const data = await apiRequest(`/materials-supabase?${params.toString()}`, {
        method: 'GET'
      });
      
      setMaterialData(data);
    } catch (err) {
      setError('Erro ao carregar dados de materiais');
    } finally {
      setLoading(false);
    }
  };

  const fetchHourlyProductionData = async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (dataInicial) params.append('startDate', dataInicial);
      if (dataFinal) params.append('endDate', dataFinal);
      if (turno !== 'all') params.append('shift', turno);

      const result: HourlyProductionResponse = await apiRequest(`/hourly-production-by-model-supabase?${params.toString()}`, {
        method: 'GET'
      });
      
      setHourlyProductionData(result.data || []);
      setAvailableHours(result.availableHours || []);
    } catch (err) {
      // Silent error handling for hourly production data
    }
  };

  const fetchDetailedPaintingData = async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (dataInicial) params.append('startDate', dataInicial);
      if (dataFinal) params.append('endDate', dataFinal);
      if (turno !== 'all') params.append('shift', turno);

      const data: DetailedPaintingData[] = await apiRequest(`/detailed-painting-by-model-color-supabase?${params.toString()}`, {
        method: 'GET'
      });
      
      setDetailedPaintingData(data || []);
    } catch (err) {
      // Silent error handling for detailed painting data
    }
  };

  // Definir datas padrão (data atual)
  useEffect(() => {
    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    setDataInicial(dataAtual);
    setDataFinal(dataAtual);
  }, [])

  // Carregar dados quando o token estiver disponível e as datas estiverem definidas
  useEffect(() => {
    if (token && dataInicial && dataFinal) {
      fetchMaterialData();
      fetchHourlyProductionData();
      fetchDetailedPaintingData();
    }
  }, [token, dataInicial, dataFinal, turno]);

  const handleAtualizar = () => {
    if (token) {
      fetchMaterialData();
      fetchHourlyProductionData();
      fetchDetailedPaintingData();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="text-lg">Carregando dados de materiais...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64" role="alert" aria-live="assertive">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Consumo de Materiais</h1>
      </header>

      {/* Filtros */}
      <section aria-labelledby="filtros-title">
        <Card>
          <CardHeader>
            <CardTitle id="filtros-title" className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" aria-hidden="true" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4" role="search" aria-label="Filtros de data e turno">
              <div>
                <label htmlFor="data-inicial" className="text-sm font-medium mb-2 block">Data Inicial</label>
                <Input
                  id="data-inicial"
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  aria-describedby="data-inicial-help"
                />
                <div id="data-inicial-help" className="sr-only">Selecione a data inicial para o filtro</div>
              </div>
              <div>
                <label htmlFor="data-final" className="text-sm font-medium mb-2 block">Data Final</label>
                <Input
                  id="data-final"
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  aria-describedby="data-final-help"
                />
                <div id="data-final-help" className="sr-only">Selecione a data final para o filtro</div>
              </div>
              <div>
                <label htmlFor="turno-select" className="text-sm font-medium mb-2 block">Turno</label>
                <Select value={turno} onValueChange={setTurno}>
                  <SelectTrigger id="turno-select" aria-label="Selecionar turno">
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent role="listbox" aria-label="Opções de turno">
                    <SelectItem value="all">Todos os Turnos</SelectItem>
                    <SelectItem value="1">1º Turno</SelectItem>
                    <SelectItem value="2">2º Turno</SelectItem>
                    <SelectItem value="3">3º Turno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAtualizar} 
                  className="flex items-center gap-2"
                  aria-label="Atualizar dados de materiais"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Atualizar
                </Button>
                {(user?.papel === 'admin' || user?.papel === 'manager') && (
                  <ConfiguracaoConsumoModal />
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Cards de Resumo */}
      <section aria-labelledby="resumo-title">
        <h2 id="resumo-title" className="sr-only">Resumo de Dados de Produção</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 justify-center">
          {/* 1. Total de Peças Pintadas */}
          <Card role="region" aria-labelledby="total-pecas-title">
            <CardHeader className="pb-2">
              <CardTitle id="total-pecas-title" className="text-xs font-medium">Total de Peças Pintadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Para-choques:</span>
                    <span className="text-sm font-semibold" aria-label={`${materialData?.totalChoques || 0} para-choques`}>{materialData?.totalChoques || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Componentes:</span>
                    <span className="text-sm font-semibold" aria-label={`${materialData?.totalComponentes || 0} componentes`}>{materialData?.totalComponentes || 0}</span>
                  </div>
                </div>
                <div className="border-t pt-2 mt-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Total Geral:</span>
                    <span className="text-lg font-bold" aria-label={`Total geral: ${materialData?.totalPecasPintadas || 0} peças`}>{materialData?.totalPecasPintadas || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Top 5 Modelo + Cor Pintados */}
          <Card role="region" aria-labelledby="top-modelos-title">
            <CardHeader className="pb-2">
              <CardTitle id="top-modelos-title" className="text-xs font-medium">Top 5 Modelo + Cor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1" role="list" aria-label="Lista dos 5 modelos mais pintados">
                {materialData?.topModelos?.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs" role="listitem">
                    <div className="flex-1 truncate">
                      <span className="font-medium">{item.modelo}</span>
                      <span className="text-muted-foreground ml-1">({item.cor})</span>
                    </div>
                    <span className="font-bold" aria-label={`${item.quantidade} unidades`}>{item.quantidade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Top 10 Cores Mais Pintadas */}
          <Card role="region" aria-labelledby="top-cores-title">
            <CardHeader className="pb-2">
              <CardTitle id="top-cores-title" className="text-xs font-medium">Top 10 Cores Pintadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1" role="list" aria-label="Lista das 10 cores mais pintadas">
                {materialData?.topCores?.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs" role="listitem">
                    <div className="flex-1 truncate">
                      <span className="font-medium">{item.cor}</span>
                    </div>
                    <span className="font-bold" aria-label={`${item.quantidade} unidades`}>{item.quantidade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4. Consumo Total */}
          <Card role="region" aria-labelledby="consumo-total-title">
            <CardHeader className="pb-2">
              <CardTitle id="consumo-total-title" className="text-xs font-medium">Consumo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold" aria-label={`Consumo total: ${materialData?.consumoTotalMaterial || 0} litros`}>{materialData?.consumoTotalMaterial || 0}L</div>
              <p className="text-xs text-muted-foreground">litros utilizados</p>
              {materialData?.consumoDetalhado && (
                <div className="mt-2 space-y-1 text-xs" role="list" aria-label="Detalhamento do consumo por material">
                  <div className="flex justify-between" role="listitem">
                    <span className="text-muted-foreground">Primer:</span>
                    <span className="font-medium" aria-label={`Primer: ${materialData.consumoDetalhado.primer} litros`}>{materialData.consumoDetalhado.primer}L</span>
                  </div>
                  {materialData.consumoDetalhado.cores && materialData.consumoDetalhado.cores.map((cor, index) => (
                    <div key={index} className="flex justify-between" role="listitem">
                      <span className="text-muted-foreground">{cor.nome}:</span>
                      <span className="font-medium" aria-label={`${cor.nome}: ${cor.consumo} litros`}>{cor.consumo}L</span>
                    </div>
                  ))}
                  <div className="flex justify-between" role="listitem">
                    <span className="text-muted-foreground">Verniz:</span>
                    <span className="font-medium" aria-label={`Verniz: ${materialData.consumoDetalhado.verniz} litros`}>{materialData.consumoDetalhado.verniz}L</span>
                  </div>
                  <div className="flex justify-between" role="listitem">
                    <span className="text-muted-foreground">Catalisador:</span>
                    <span className="font-medium" aria-label={`Catalisador: ${materialData.consumoDetalhado.catalisador} litros`}>{materialData.consumoDetalhado.catalisador}L</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Consumo de Diluentes */}
          <Card role="region" aria-labelledby="consumo-diluentes-title">
            <CardHeader className="pb-2">
              <CardTitle id="consumo-diluentes-title" className="text-xs font-medium">Consumo de Diluentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold" aria-label={`Consumo total de diluentes: ${materialData?.consumoTotalDiluentes || 0} litros`}>{materialData?.consumoTotalDiluentes || 0}L</div>
              <p className="text-xs text-muted-foreground">litros utilizados</p>
              {materialData?.consumoDetalhado && (
                <div className="mt-2 space-y-1 text-xs" role="list" aria-label="Detalhamento do consumo por tipo de diluente">
                  <div className="flex justify-between" role="listitem">
                    <span className="text-muted-foreground">Diluente Primer:</span>
                    <span className="font-medium" aria-label={`Diluente Primer: ${materialData.consumoDetalhado.diluentePrimer} litros`}>{materialData.consumoDetalhado.diluentePrimer}L</span>
                  </div>
                  <div className="flex justify-between" role="listitem">
                    <span className="text-muted-foreground">Diluente Base:</span>
                    <span className="font-medium" aria-label={`Diluente Base: ${materialData.consumoDetalhado.diluenteBase} litros`}>{materialData.consumoDetalhado.diluenteBase}L</span>
                  </div>
                  <div className="flex justify-between" role="listitem">
                    <span className="text-muted-foreground">Diluente Verniz:</span>
                    <span className="font-medium" aria-label={`Diluente Verniz: ${materialData.consumoDetalhado.diluenteVerniz} litros`}>{materialData.consumoDetalhado.diluenteVerniz}L</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Gráficos lado a lado */}
      <section aria-labelledby="graficos-title">
        <h2 id="graficos-title" className="sr-only">Gráficos de Análise de Produção</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 materials-charts-grid">
          {/* Gráfico de Barras - Top Modelos */}
          <Card role="img" aria-labelledby="grafico-modelos-title" aria-describedby="grafico-modelos-desc">
            <CardHeader>
              <CardTitle id="grafico-modelos-title">Top Modelos Pintados</CardTitle>
              <CardDescription id="grafico-modelos-desc">Quantidade de peças pintadas por modelo</CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label={`Gráfico de barras mostrando os ${materialData?.topModelosGrafico?.length || 0} modelos mais pintados`} className="materials-chart-container">
                <ResponsiveContainer width="100%" height={400} className="materials-bar-chart">
                  <BarChart
                    data={materialData?.topModelosGrafico?.slice(0, 10) || []}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="modelo" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} peças`, 'Quantidade']} />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#8884d8" name="Peças Pintadas">
                      <LabelList dataKey="quantidade" position="top" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Cores - Gráfico de Pizza */}
          <Card role="img" aria-labelledby="grafico-cores-title" aria-describedby="grafico-cores-desc">
            <CardHeader>
              <CardTitle id="grafico-cores-title">Distribuição por Cores</CardTitle>
              <CardDescription id="grafico-cores-desc">Cores mais utilizadas na pintura</CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label={`Gráfico de pizza mostrando a distribuição das ${materialData?.topCores?.length || 0} cores mais utilizadas`} className="materials-chart-container">
                <ResponsiveContainer width="100%" height={400} className="materials-pie-chart">
                  <PieChart>
                    <Pie
                      data={materialData?.topCores?.slice(0, 8) || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ cor, quantidade }) => {
                        const total = materialData?.totalPecasPintadas || 0;
                        const percentage = total ? ((quantidade / total) * 100).toFixed(1) : '0.0';
                        return `${cor}: ${percentage}%`;
                      }}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="quantidade"
                    >
                      {(materialData?.topCores || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} peças`, 'Quantidade']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabelas lado a lado */}
      <section aria-labelledby="tabelas-title">
        <h2 id="tabelas-title" className="sr-only">Tabelas Detalhadas de Produção</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 materials-tables-grid">
          {/* Tabela de Produção Hora a Hora por Modelo */}
          <Card role="region" aria-labelledby="tabela-horaria-title">
            <CardHeader>
              <CardTitle id="tabela-horaria-title">Produção Hora a Hora por Modelo</CardTitle>
              <CardDescription>Detalhamento da produção por modelo e horário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto table-container" role="region" aria-label="Tabela com scroll horizontal" tabIndex={0}>
                <Table role="table" aria-label="Produção hora a hora por modelo">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[150px] table-header table-cell-model" scope="col">Modelo</TableHead>
                      <TableHead className="text-center min-w-[80px] table-header table-cell-number" scope="col">Total</TableHead>
                      {availableHours.map((hour) => (
                        <TableHead key={hour} className="text-center min-w-[60px] table-header table-cell-number" scope="col">
                          {String(hour).padStart(2, '0')}h
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hourlyProductionData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium table-cell table-cell-model" scope="row" data-label="Modelo">
                          {row.modelo}
                        </TableCell>
                        <TableCell className="text-center font-semibold table-cell table-cell-number" aria-label={`Total: ${row.total} peças`} data-label="Total">
                          {row.total}
                        </TableCell>
                        {availableHours.map((hour) => {
                          const hourKey = `h${String(hour).padStart(2, '0')}`;
                          const value = row[hourKey] || 0;
                          return (
                            <TableCell key={hour} className="text-center table-cell table-cell-number" aria-label={`${String(hour).padStart(2, '0')}h: ${value} peças`} data-label={`${String(hour).padStart(2, '0')}h`}>
                              {value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        {/* Tabela de Pintura Detalhada por Modelo e Cor */}
        <Card>
          <CardHeader>
            <CardTitle>Pintura Detalhada por Modelo e Cor</CardTitle>
            <CardDescription>Detalhamento completo da pintura por modelo, cor e tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="table-header table-cell-model">Modelo</TableHead>
                    <TableHead className="table-header">Cor</TableHead>
                    <TableHead className="text-center table-header table-cell-number">Quantidade</TableHead>
                    <TableHead className="table-header">Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedPaintingData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium table-cell table-cell-model" data-label="Modelo">{row.modelo}</TableCell>
                      <TableCell className="table-cell" data-label="Cor">{row.cor}</TableCell>
                      <TableCell className="text-center font-semibold table-cell table-cell-number" data-label="Quantidade">{row.quantidade}</TableCell>
                      <TableCell className="table-cell" data-label="Tipo">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.tipo === 'Normal' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {row.tipo}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}