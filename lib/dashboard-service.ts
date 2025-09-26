import { supabase } from './supabase'

// Interfaces baseadas na estrutura identificada
export interface RegistroProducao {
  id: string
  data: string
  hora: string
  skids: number
  skids_vazios: number
  paradas: ParadaItem[]
  producao: ProducaoItem[]
}

export interface ParadaItem {
  tipo: string
  tempo: number // em minutos
  criterio: string
  descricao?: string
}

export interface ProducaoItem {
  modelo: string
  cor: string
  qtd: number
  repintura: boolean
}

export interface DashboardData {
  tempoTotalParada: number
  percentualParada: number
  totalSkids: number
  percentualMeta: number
  skidsVazios: number
  percentualRepintura: number
  quantidadeRepintura: number // Nova: quantidade de peças de repintura
  mtbf: number
  mttr: number
  acumuladoHoraHora: number
  acumuladoProduzido: number
}

class DashboardService {
  // Buscar registros com filtros
  async getRegistros(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<RegistroProducao[]> {
    try {
      let query = supabase
        .from('registros')
        .select('*')
        .order('data', { ascending: true })
        .order('hora', { ascending: true })

      // Aplicar filtros de data
      if (filters.startDate) {
        query = query.gte('data', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('data', filters.endDate)
      }

      // Não aplicar filtro de turno no Supabase, vamos filtrar depois
      // pois o formato de hora é complexo para filtrar diretamente

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar registros:', error)
        return []
      }

      let registros = data as RegistroProducao[]

      // Aplicar filtro de turno após buscar os dados
      if (filters.shift && filters.shift !== 'all') {
        registros = registros.filter(registro => {
          const hora = registro.hora
          // Extrair a hora inicial do formato "XXhXX - YYhYY"
          const horaMatch = hora.match(/(\d{2})h\d{2}/)
          if (horaMatch) {
            const horaInicial = parseInt(horaMatch[1])
            
            switch (filters.shift) {
              case '1': // 1º Turno (06h-15h)
                return horaInicial >= 6 && horaInicial <= 14
              case '2': // 2º Turno (15h-24h)
                return horaInicial >= 15 && horaInicial <= 23
              case '3': // 3º Turno (00h-06h)
                return horaInicial >= 0 && horaInicial <= 5
              default:
                return true
            }
          }
          return false
        })
      }

      return registros
    } catch (error) {
      console.error('Erro ao buscar registros:', error)
      return []
    }
  }

  // Calcular dados do dashboard
  async calculateDashboardData(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<DashboardData> {
    const registros = await this.getRegistros(filters)
    
    console.log('📊 Calculando dashboard com', registros.length, 'registros')

    // Tipos de parada que NÃO devem ser contabilizados no tempo total de parada
    // APENAS: LIMPEZA DA CABINE e REFEIÇÃO
    const tiposExcluidos = [
      'LIMPEZA DA CABINE',
      'REFEIÇÃO',
      'REFEICAO'  // Variação de escrita
    ]
    
    // NOTA: Todos os outros tipos (incluindo limpezas específicas) são considerados paradas operacionais

    // Inicializar contadores
    let tempoTotalParada = 0
    let tempoTotalExcluido = 0
    let totalSkids = 0
    let skidsVazios = 0
    let totalPecasProducao = 0
    let totalPecasRepintura = 0
    let totalParadas = 0
    let totalParadasExcluidas = 0
    let tempoExcluidoParaAcumulado = 0 // Para calcular acumulado hora hora
    
    // Contadores específicos para MTBF/MTTR (apenas MANUTENÇÃO)
    let tempoTotalManutencao = 0
    let totalParadasManutencao = 0

    // Processar cada registro
    registros.forEach(registro => {
      // Somar skids
      totalSkids += registro.skids || 0
      skidsVazios += registro.skids_vazios || 0

      // Processar paradas - aplicar filtro de métrica
      if (registro.paradas && Array.isArray(registro.paradas)) {
        registro.paradas.forEach(parada => {
          if (parada.tempo) {
            // Verificar se deve ser excluído do cálculo
            const tipoNormalizado = parada.tipo.toUpperCase()
            const deveExcluir = tiposExcluidos.some(exclusao =>
              tipoNormalizado.includes(exclusao.toUpperCase())
            )

            if (deveExcluir) {
              // Contabilizar separadamente (para debug)
              tempoTotalExcluido += parada.tempo
              totalParadasExcluidas++
              // Para o acumulado hora hora, também contabilizar esses tempos
              tempoExcluidoParaAcumulado += parada.tempo
            } else {
              // Incluir no tempo total de parada (métrica oficial)
              tempoTotalParada += parada.tempo
              totalParadas++
            }

            // Contabilizar paradas de MANUTENÇÃO para MTBF/MTTR (APENAS critério oficial)
            if (parada.criterio && parada.criterio.toUpperCase() === 'MANUTENÇÃO') {
              tempoTotalManutencao += parada.tempo
              totalParadasManutencao++
            }
          }
        })
      }

      // Processar produção
      if (registro.producao && Array.isArray(registro.producao)) {
        registro.producao.forEach(item => {
          totalPecasProducao += item.qtd || 0
          if (item.repintura) {
            totalPecasRepintura += item.qtd || 0
          }
        })
        
        // Total de horas com produção (removido pois não era usado)
      }
    })

    // Calcular percentuais e métricas
    const horasTotais = registros.length
    const percentualParada = horasTotais > 0 ? Math.round((tempoTotalParada / (horasTotais * 60)) * 100) : 0
    
    // Meta: 50 skids por hora (conforme solicitado)
    const metaSkidsPorHora = 50
    
    // Acumulado Hora Hora: Meta total MENOS os skids que não deveriam ser produzidos 
    // devido às paradas excluídas (REFEIÇÃO e LIMPEZA DA CABINE)
    const horasExcluidasEquivalente = tempoExcluidoParaAcumulado / 60 // converter minutos para horas
    const skidsNaoDeveriamSerProduzidos = Math.round(horasExcluidasEquivalente * metaSkidsPorHora)
    const metaTotal = (horasTotais * metaSkidsPorHora) - skidsNaoDeveriamSerProduzidos
    
    const percentualMeta = metaTotal > 0 ? Math.round((totalSkids / metaTotal) * 100) : 0
    
    const percentualRepintura = totalPecasProducao > 0 ? 
      Math.round((totalPecasRepintura / totalPecasProducao) * 100) : 0

    // MTBF (Mean Time Between Failures) - tempo médio entre falhas de MANUTENÇÃO
    // Baseado na capacidade produtiva real: skids produzidos / meta por hora * 60 min
    const horasProdutivasEquivalentes = totalSkids / metaSkidsPorHora
    const tempoProdutivoEquivalente = horasProdutivasEquivalentes * 60
    const mtbf = totalParadasManutencao > 0 ? 
      Math.round(tempoProdutivoEquivalente / totalParadasManutencao) : 0
    
    // MTTR (Mean Time To Repair) - tempo médio de reparo para MANUTENÇÃO
    const mttr = totalParadasManutencao > 0 ? 
      Math.round(tempoTotalManutencao / totalParadasManutencao) : 0

    // Acumulados
    const acumuladoHoraHora = metaTotal // Meta ajustada (planejado)
    const acumuladoProduzido = totalSkids // Skids efetivamente registrados

    const resultado = {
      tempoTotalParada,
      percentualParada,
      totalSkids,
      percentualMeta,
      skidsVazios,
      percentualRepintura,
      quantidadeRepintura: totalPecasRepintura, // Nova: quantidade de peças de repintura
      mtbf,
      mttr,
      acumuladoHoraHora,
      acumuladoProduzido
    }

    console.log('📈 Dados calculados (com métrica aplicada):')
    console.log('  ⏱️ Tempo total de parada (contabilizado):', tempoTotalParada, 'min')
    console.log('  🚫 Tempo excluído (limpeza/refeição):', tempoTotalExcluido, 'min')
    console.log('  📊 Percentual de parada:', percentualParada, '%')
    console.log('  🔢 Total de paradas contabilizadas:', totalParadas)
    console.log('  🔢 Total de paradas excluídas:', totalParadasExcluidas)
    console.log('  📦 Total de skids registrados:', totalSkids)
    console.log('  🎨 Peças repintura:', totalPecasRepintura, `(${percentualRepintura}%)`)
    console.log('  🎯 Meta planejada (acumulado hora hora):', acumuladoHoraHora)
    console.log('  ⏱️ Tempo excluído para cálculo da meta:', tempoExcluidoParaAcumulado, 'min')
    console.log('  📉 Skids descontados da meta:', skidsNaoDeveriamSerProduzidos)
    console.log('  🔧 Paradas de MANUTENÇÃO:', totalParadasManutencao, `(${tempoTotalManutencao} min)`)
    console.log('  ⚙️ Horas produtivas equivalentes:', horasProdutivasEquivalentes.toFixed(1), 'h')
    console.log('  ⏱️ Tempo produtivo equivalente:', tempoProdutivoEquivalente.toFixed(0), 'min')
    console.log('  📈 MTBF (baseado em capacidade):', mtbf, 'min')
    console.log('  📈 MTTR (apenas manutenção):', mttr, 'min')
    
    return resultado
  }

  // Buscar dados de produção por hora (para gráficos)
  async getProductionHourlyData(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<{
    time: string;
    production: number;
    target: number;
    records: number;
  }[]> {
    const registros = await this.getRegistros(filters)

    // Converter para formato de gráfico
    const hourlyData = registros
      .sort((a, b) => {
        const dateA = new Date(`${a.data}T${a.hora.substring(0, 2)}:00:00`).getTime()
        const dateB = new Date(`${b.data}T${b.hora.substring(0, 2)}:00:00`).getTime()
        return dateA - dateB
      })
      .map(registro => ({
        time: registro.hora,
        production: registro.skids || 0,
        target: 50, // Meta fixa de 50 skids/hora
        records: 1
      }))

    return hourlyData
  }

  // Buscar dados para Curva S
  async getSCurveData(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<{
    time: string;
    cumulative: number;
    target: number;
    production: number;
    timeSlot: string;
  }[]> {
    const hourlyData = await this.getProductionHourlyData(filters)
    
    let cumulativeProduction = 0
    let cumulativeTarget = 0

    const sCurveData = hourlyData.map(item => {
      cumulativeProduction += item.production
      cumulativeTarget += item.target // 50 skids por hora (meta sem paradas)
      
      return {
        time: item.time,
        cumulative: cumulativeProduction,
        target: cumulativeTarget,
        production: item.production,
        timeSlot: item.time
      }
    })

    return sCurveData
  }

  // Buscar dados de resumo para gráficos
  async getChartSummary(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<{
    totalProduction: number;
    averageHourlyRate: number;
    targetRate: number;
  }> {
    const hourlyData = await this.getProductionHourlyData(filters)
    
    const totalProduction = hourlyData.reduce((sum, item) => sum + item.production, 0)
    const averageHourlyRate = hourlyData.length > 0 ? totalProduction / hourlyData.length : 0
    const targetRate = 50 // Meta de 50 skids/hora

    return {
      totalProduction,
      averageHourlyRate,
      targetRate
    }
  }

  // Buscar análise de paradas por critério
  async getParadasByCriterio(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<{ criterio: string; tempo: number }[]> {
    const registros = await this.getRegistros(filters)
    
    // Tipos de parada que NÃO devem ser contabilizados (mesma regra do dashboard)
    const tiposExcluidos = [
      'LIMPEZA DA CABINE',
      'REFEIÇÃO',
      'REFEICAO'
    ]

    const paradasPorCriterio = new Map<string, number>()

    registros.forEach(registro => {
      if (registro.paradas && Array.isArray(registro.paradas)) {
        registro.paradas.forEach(parada => {
          const tipoNormalizado = parada.tipo.toUpperCase()
          const deveExcluir = tiposExcluidos.some(exclusao =>
            tipoNormalizado.includes(exclusao.toUpperCase())
          )

          if (!deveExcluir && parada.criterio && parada.tempo) {
            const criterio = parada.criterio.toUpperCase()
            paradasPorCriterio.set(criterio, (paradasPorCriterio.get(criterio) || 0) + parada.tempo)
          }
        })
      }
    })

    return Array.from(paradasPorCriterio.entries()).map(([criterio, tempo]) => ({ criterio, tempo }))
  }

  // Buscar dados do Pareto de paradas (TOP 10)
  async getParetoParadas(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<{
    reason: string;
    frequency: number;
    total_duration: number;
  }[]> {
    const registros = await this.getRegistros(filters)
    
    // Tipos de parada que NÃO devem ser contabilizados
    const tiposExcluidos = [
      'LIMPEZA DA CABINE',
      'REFEIÇÃO',
      'REFEICAO'
    ]

    const paradasMap = new Map<string, { frequency: number; total_duration: number }>()

    registros.forEach(registro => {
      if (registro.paradas && Array.isArray(registro.paradas)) {
        registro.paradas.forEach(parada => {
          const tipoNormalizado = parada.tipo.toUpperCase()
          const deveExcluir = tiposExcluidos.some(exclusao =>
            tipoNormalizado.includes(exclusao.toUpperCase())
          )

          if (!deveExcluir && parada.tipo && parada.tempo) {
            const reason = parada.tipo
            if (!paradasMap.has(reason)) {
              paradasMap.set(reason, { frequency: 0, total_duration: 0 })
            }
            const current = paradasMap.get(reason)!
            current.frequency += 1
            current.total_duration += parada.tempo
          }
        })
      }
    })

    return Array.from(paradasMap.entries())
      .map(([reason, data]) => ({
        reason,
        frequency: data.frequency,
        total_duration: data.total_duration
      }))
      .sort((a, b) => b.frequency - a.frequency) // Ordenar por frequência
      .slice(0, 10) // TOP 10
  }

  // Buscar paradas por área
  async getParadasByArea(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<{
    area: string;
    frequency: number;
    total_duration: number;
  }[]> {
    const registros = await this.getRegistros(filters)

    // Palavras-chave para classificação inteligente quando critério está vazio
    const keywordsMaintenance = [
      'ROBÔ', 'ROBOT', 'TRAVADO', 'PROBLEMA', 'DEFEITO', 'FALHA', 'QUEBRA', 'CAB. BASE', 'CABINE'
    ]
    const keywordsEngineering = [
      'LIMITE DE EIXO', 'LIMITE', 'EIXO', 'PRIMER'
    ]
    const keywordsManagement = [
      'PARADA EXTERNA', 'EXTERNA', 'REFEIÇÃO', 'REFEICAO'
    ]
    const keywordsPainting = [
      'GAP NA FLAMAGEM', 'FLAMAGEM', 'TINTA', 'PRIMER', 'COR'
    ]
    const keywordsSetup = [
      'SETUP', 'SETUP DE COR', 'TROCA'
    ]

    // Mapeamento de critérios para áreas
    const criterioToArea: { [key: string]: string } = {
      'MANUTENÇÃO': '🔧 Manutenção',
      'MANUTENCAO': '🔧 Manutenção',
      'PINTURA': '🎨 Pintura',
      'SETUP': '⚙️ Setup',
      'GESTÃO': '👥 Gestão',
      'GESTAO': '👥 Gestão',
      'ENGENHARIA': '📋 Engenharia',
      'QUALIDADE': '🛡️ Qualidade',
      'LOGÍSTICA': '📦 Logística',
      'LOGISTICA': '📦 Logística'
    }

    const areaMap = new Map<string, { frequency: number; total_duration: number }>()

    registros.forEach(registro => {
      if (registro.paradas && Array.isArray(registro.paradas)) {
        registro.paradas.forEach(parada => {
          if (parada.tempo) {
            const tipoNormalizado = parada.tipo.toUpperCase()
            let area: string
            
            if (parada.criterio && parada.criterio.trim() !== '') {
              // Usar critério definido
              const criterioNormalizado = parada.criterio.toUpperCase()
              area = criterioToArea[criterioNormalizado] || '❓ Outros'
            } else {
              // Critério vazio - classificação inteligente baseada no tipo
              if (keywordsMaintenance.some(keyword => tipoNormalizado.includes(keyword))) {
                area = '🔧 Manutenção'
              } else if (keywordsEngineering.some(keyword => tipoNormalizado.includes(keyword))) {
                area = '📋 Engenharia'  
              } else if (keywordsManagement.some(keyword => tipoNormalizado.includes(keyword))) {
                area = '👥 Gestão'
              } else if (keywordsPainting.some(keyword => tipoNormalizado.includes(keyword))) {
                area = '🎨 Pintura'
              } else if (keywordsSetup.some(keyword => tipoNormalizado.includes(keyword))) {
                area = '⚙️ Setup'
              } else {
                area = '❓ Outros'
              }
            }
            
            if (!areaMap.has(area)) {
              areaMap.set(area, { frequency: 0, total_duration: 0 })
            }
            const current = areaMap.get(area)!
            current.frequency += 1
            current.total_duration += parada.tempo
          }
        })
      }
    })

    return Array.from(areaMap.entries())
      .map(([area, data]) => ({
        area,
        frequency: data.frequency,
        total_duration: data.total_duration
      }))
      .sort((a, b) => b.frequency - a.frequency)
  }

  // Buscar dados do heatmap de paradas
  async getHeatmapParadas(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }): Promise<{
    date: string;
    time_slot: string;
    total_frequency: number;
    total_duration: number;
    reasons: {
      reason: string;
      frequency: number;
      duration: number;
    }[];
  }[]> {
    const registros = await this.getRegistros(filters)
    
    // Tipos de parada que NÃO devem ser contabilizados
    const tiposExcluidos = [
      'LIMPEZA DA CABINE',
      'REFEIÇÃO',
      'REFEICAO'
    ]

    const heatmapMap = new Map<string, {
      date: string;
      time_slot: string;
      reasons: Map<string, { frequency: number; duration: number }>;
    }>()

    registros.forEach(registro => {
      const key = `${registro.data}-${registro.hora}`
      
      if (!heatmapMap.has(key)) {
        heatmapMap.set(key, {
          date: registro.data,
          time_slot: registro.hora,
          reasons: new Map()
        })
      }

      const current = heatmapMap.get(key)!

      if (registro.paradas && Array.isArray(registro.paradas)) {
        registro.paradas.forEach(parada => {
          const tipoNormalizado = parada.tipo.toUpperCase()
          const deveExcluir = tiposExcluidos.some(exclusao =>
            tipoNormalizado.includes(exclusao.toUpperCase())
          )

          if (!deveExcluir && parada.tipo && parada.tempo) {
            const reason = parada.tipo
            
            if (!current.reasons.has(reason)) {
              current.reasons.set(reason, { frequency: 0, duration: 0 })
            }
            const reasonData = current.reasons.get(reason)!
            reasonData.frequency += 1
            reasonData.duration += parada.tempo
          }
        })
      }
    })

    return Array.from(heatmapMap.values())
      .map(item => {
        const reasons = Array.from(item.reasons.entries()).map(([reason, data]) => ({
          reason,
          frequency: data.frequency,
          duration: data.duration
        }))
        
        const total_frequency = reasons.reduce((sum, r) => sum + r.frequency, 0)
        const total_duration = reasons.reduce((sum, r) => sum + r.duration, 0)

        return {
          date: item.date,
          time_slot: item.time_slot,
          total_frequency,
          total_duration,
          reasons
        }
      })
      .filter(item => item.reasons.length > 0) // Apenas slots com paradas
      .sort((a, b) => a.date.localeCompare(b.date) || a.time_slot.localeCompare(b.time_slot))
  }

  // Buscar top modelos produzidos
  async getTopModelos(filters: {
    startDate?: string
    endDate?: string
    shift?: string
  }) {
    const registros = await this.getRegistros(filters)
    const modelosCount: { [key: string]: number } = {}

    registros.forEach(registro => {
      if (registro.producao && Array.isArray(registro.producao)) {
        registro.producao.forEach(item => {
          const key = `${item.modelo} - ${item.cor}`
          modelosCount[key] = (modelosCount[key] || 0) + (item.qtd || 0)
        })
      }
    })

    return Object.entries(modelosCount)
      .map(([modelo, quantidade]) => ({ modelo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10) // Top 10
  }
}

// Singleton instance
export const dashboardService = new DashboardService()
export default dashboardService
