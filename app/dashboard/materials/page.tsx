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
      console.error('Erro ao buscar dados de materiais:', err);
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
      console.error('Erro ao buscar dados de produção por hora:', err);
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
      console.error('Erro ao buscar dados detalhados de pintura:', err);
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
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados de materiais...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Consumo de Materiais</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Inicial</label>
              <Input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Final</label>
              <Input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Turno</label>
              <Select value={turno} onValueChange={setTurno}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Turnos</SelectItem>
                  <SelectItem value="1">1º Turno</SelectItem>
                  <SelectItem value="2">2º Turno</SelectItem>
                  <SelectItem value="3">3º Turno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAtualizar} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              {(user?.papel === 'admin' || user?.papel === 'manager') && (
                <ConfiguracaoConsumoModal />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 justify-center">
        {/* 1. Total de Peças Pintadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Total de Peças Pintadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 flex flex-col h-full">
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Para-choques:</span>
                  <span className="text-sm font-semibold">{materialData?.totalChoques || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Componentes:</span>
                  <span className="text-sm font-semibold">{materialData?.totalComponentes || 0}</span>
                </div>
              </div>
              <div className="border-t pt-2 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Total Geral:</span>
                  <span className="text-lg font-bold">{materialData?.totalPecasPintadas || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Top 5 Modelo + Cor Pintados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Top 5 Modelo + Cor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {materialData?.topModelos?.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex-1 truncate">
                    <span className="font-medium">{item.modelo}</span>
                    <span className="text-muted-foreground ml-1">({item.cor})</span>
                  </div>
                  <span className="font-bold">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3. Top 10 Cores Mais Pintadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Top 10 Cores Pintadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {materialData?.topCores?.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex-1 truncate">
                    <span className="font-medium">{item.cor}</span>
                  </div>
                  <span className="font-bold">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Consumo Total */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Consumo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{materialData?.consumoTotalMaterial || 0}L</div>
            <p className="text-xs text-muted-foreground">litros utilizados</p>
            {materialData?.consumoDetalhado && (
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primer:</span>
                  <span className="font-medium">{materialData.consumoDetalhado.primer}L</span>
                </div>
                {materialData.consumoDetalhado.cores && materialData.consumoDetalhado.cores.map((cor, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">{cor.nome}:</span>
                    <span className="font-medium">{cor.consumo}L</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verniz:</span>
                  <span className="font-medium">{materialData.consumoDetalhado.verniz}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Catalisador:</span>
                  <span className="font-medium">{materialData.consumoDetalhado.catalisador}L</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Consumo de Diluentes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Consumo de Diluentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{materialData?.consumoTotalDiluentes || 0}L</div>
            <p className="text-xs text-muted-foreground">litros utilizados</p>
            {materialData?.consumoDetalhado && (
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diluente Primer:</span>
                  <span className="font-medium">{materialData.consumoDetalhado.diluentePrimer}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diluente Base:</span>
                  <span className="font-medium">{materialData.consumoDetalhado.diluenteBase}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diluente Verniz:</span>
                  <span className="font-medium">{materialData.consumoDetalhado.diluenteVerniz}L</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Top Modelos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Modelos Pintados</CardTitle>
            <CardDescription>Quantidade de peças pintadas por modelo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
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
          </CardContent>
        </Card>

        {/* Top Cores - Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Cores</CardTitle>
            <CardDescription>Cores mais utilizadas na pintura</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
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
          </CardContent>
        </Card>
      </div>

      {/* Tabelas lado a lado */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tabela de Produção Hora a Hora por Modelo */}
        <Card>
          <CardHeader>
            <CardTitle>Produção Hora a Hora por Modelo</CardTitle>
            <CardDescription>Detalhamento da produção por modelo e horário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Modelo</TableHead>
                    <TableHead className="text-center min-w-[80px]">Total</TableHead>
                    {availableHours.map((hour) => (
                      <TableHead key={hour} className="text-center min-w-[60px]">
                        {String(hour).padStart(2, '0')}h
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hourlyProductionData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        {row.modelo}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {row.total}
                      </TableCell>
                      {availableHours.map((hour) => {
                        const hourKey = `h${String(hour).padStart(2, '0')}`;
                        const value = row[hourKey] || 0;
                        return (
                          <TableCell key={hour} className="text-center">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedPaintingData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.modelo}</TableCell>
                      <TableCell>{row.cor}</TableCell>
                      <TableCell className="text-center font-semibold">{row.quantidade}</TableCell>
                      <TableCell>
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
    </div>
  );
}