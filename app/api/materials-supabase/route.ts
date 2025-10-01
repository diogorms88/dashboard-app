import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// Interfaces para configuração de consumo
interface ConfiguracaoConsumo {
  ppf: Array<{ cor: string; modelo: string }>
  bases: Record<string, { diluente: string; taxa_diluicao: number }>
  geral: {
    base: { consumo: number | null; diluente: string; taxa_diluicao: number; taxa_catalisador: number }
    primer: { consumo: number | null; diluente: string; taxa_diluicao: number; taxa_catalisador: number }
    verniz: { diluente: string; volume_total: number | null; taxa_diluicao: number; taxa_catalisador: number }
  }
  modoTaxa: string
  especificas: Array<{
    cor: string
    modelo: string
    base: string
    primer: string
    verniz: string
  }>
}

// Função para buscar configuração de consumo
async function getConfiguracaoConsumo(): Promise<ConfiguracaoConsumo | null> {
  try {
    const { data, error } = await supabase
      .from('configuracao_consumo_v2')
      .select('configuracao')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return null
    }

    return data?.configuracao as ConfiguracaoConsumo
  } catch (error) {
    return null
  }
}

interface RegistroProducao {
  id: string
  data: string
  hora: string
  skids: number
  skids_vazios: number
  paradas: ParadaItem[]
  producao: ProducaoItem[]
}

interface ParadaItem {
  tipo: string
  tempo: number
  criterio: string
  descricao?: string
}

interface ProducaoItem {
  modelo: string
  cor: string
  qtd: number
  repintura: boolean
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Extrair parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const shift = searchParams.get('shift')

    // 1. Buscar registros da tabela registros com filtros
    
    let registrosQuery = supabase
      .from('registros')
      .select('*')
      .order('data', { ascending: true })
      .order('hora', { ascending: true })

    // Aplicar filtros de data
    if (startDate) {

      registrosQuery = registrosQuery.gte('data', startDate)
    }
    if (endDate) {

      registrosQuery = registrosQuery.lte('data', endDate)
    }


    const { data: registros, error: registrosError } = await registrosQuery

    if (registrosError) {

      return NextResponse.json({ 
        error: 'Erro ao buscar dados de registros',
        details: registrosError.message,
        code: registrosError.code
      }, { status: 500 })
    }

    // Aplicar filtro de turno após buscar os dados (pois o formato de hora é complexo)
    let registrosFiltrados = registros as RegistroProducao[]
    
    if (shift && shift !== 'all') {
      registrosFiltrados = registrosFiltrados.filter(registro => {
        const hora = registro.hora
        // Extrair a hora inicial do formato "XXhXX - YYhYY"
        const horaMatch = hora.match(/(\d{2})h\d{2}/)
        if (horaMatch) {
          const horaInicial = parseInt(horaMatch[1])
          
          switch (shift) {
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



    // 2. Processar dados de produção da tabela registros
    const allProductionDetails: ProducaoItem[] = []
    let totalPecasPintadas = 0
    let totalChoques = 0
    let totalComponentes = 0
    
    // Definir quais modelos são componentes
    const componentesModelos = [
      'Grade Virtus',
      'Grade Virtus GTS', 
      'Aerofólio',
      'Spoiler',
      'Tera Friso DT',
      'Tera Friso TR'
    ]
    
    // Contadores para Tera Polainas (para regra especial)
    let teraPolainaLD = 0
    let teraPolainaLE = 0

    registrosFiltrados?.forEach(registro => {
      if (registro.producao && Array.isArray(registro.producao)) {
        registro.producao.forEach((item: ProducaoItem) => {
          allProductionDetails.push({
            modelo: item.modelo,
            cor: item.cor,
            qtd: item.qtd,
            repintura: item.repintura
          })
          
          // Contagem especial para Tera Polainas
          if (item.modelo === 'Tera Polaina LD') {
            teraPolainaLD += item.qtd
          } else if (item.modelo === 'Tera Polaina LE') {
            teraPolainaLE += item.qtd
          }
          
          // Separar entre componentes e choques
          if (componentesModelos.includes(item.modelo)) {
            totalComponentes += item.qtd
          } else {
            // Para choques, não contar Tera Polainas individualmente
            if (item.modelo !== 'Tera Polaina LD' && item.modelo !== 'Tera Polaina LE') {
              totalChoques += item.qtd
            }
          }
          
          totalPecasPintadas += item.qtd
        })
      }
    })
    
    // Aplicar regra especial: 1 Tera Polaina LD + 1 Tera Polaina LE = 1 Parachoque
    const parachoquesDasPolainas = Math.min(teraPolainaLD, teraPolainaLE)
    totalChoques += parachoquesDasPolainas



    // 3. Buscar configuração de consumo da tabela configuracao_consumo_v2

    let configuracao
    
    try {
      configuracao = await getConfiguracaoConsumo()
    } catch (configError) {

      return NextResponse.json({ 
        error: 'Erro ao buscar configuração de consumo',
        details: configError instanceof Error ? configError.message : 'Erro desconhecido'
      }, { status: 500 })
    }
    
    if (!configuracao) {

      return NextResponse.json({ error: 'Configuração de consumo não encontrada' }, { status: 500 })
    }



    // 4. Calcular consumo de materiais usando a configuração real

    
    let totalPrimerPuroMl = 0
    let totalBasePuraMl = 0
    let totalVernizPuroMl = 0
    let totalDiluentePrimerMl = 0
    let totalDiluenteBaseMl = 0
    let totalDiluenteVernizMl = 0
    let totalCatalisadorMl = 0

    const consumoPorCor: { [key: string]: number } = {}
    const topModelos: { [key: string]: number } = {}
    const topCores: { [key: string]: number } = {}
    
    let itensProcessados = 0
    let errosProcessamento = 0

    allProductionDetails.forEach(detail => {
      try {
        itensProcessados++
        const quantidade = detail.qtd

        // Buscar configuração específica para este modelo/cor
      const configEspecifica = configuracao.especificas.find(
        spec => spec.modelo === detail.modelo && spec.cor === detail.cor
      )

      let primerMl = 0
      let baseMl = 0
      let vernizMl = 0

      // TRATAMENTO ESPECIAL PARA PRIMER P&A
      if (detail.cor === 'Primer P&A') {
        // Primer P&A usa APENAS primer, sem base nem verniz
        if (configEspecifica) {
          primerMl = parseFloat(configEspecifica.primer) * quantidade
          baseMl = 0 // Primer P&A não usa base
          vernizMl = 0 // Primer P&A não usa verniz
          

        } else {
          // Fallback para Primer P&A: usar apenas o primer de configurações similares
          const configsSimilares = configuracao.especificas.filter((s: Record<string, unknown>) => 
            s.modelo === detail.modelo && s.cor !== detail.cor
          )
          
          if (configsSimilares.length > 0) {
            // CORREÇÃO: Para Primer P&A, usar valor mais alto pois é o único material
            // Em vez da média do primer (que é baixo nas outras cores), usar um valor estimado
            // baseado no consumo total típico das outras cores
            const avgTotal = configsSimilares.reduce((sum: number, c: Record<string, unknown>) => {
              const primer = parseFloat(String(c.primer)) || 0
              const base = parseFloat(String(c.base)) || 0
              const verniz = parseFloat(String(c.verniz)) || 0
              return sum + primer + base + verniz
            }, 0) / configsSimilares.length
            
            // Para Primer P&A, usar aproximadamente 70% do consumo total médio
            // (considerando que primer P&A substitui primer + base + verniz)
            const primerPAEstimado = avgTotal * 0.7
            primerMl = primerPAEstimado * quantidade
            baseMl = 0 // Primer P&A não usa base
            vernizMl = 0 // Primer P&A não usa verniz
            

          } else {
            primerMl = (configuracao.geral.primer.consumo || 0) * quantidade
            baseMl = 0
            vernizMl = 0
            

          }
        }
      } else {
        // TRATAMENTO NORMAL PARA OUTRAS CORES
        if (configEspecifica) {
          // Usar configuração específica
          primerMl = parseFloat(configEspecifica.primer) * quantidade
          baseMl = parseFloat(configEspecifica.base) * quantidade
          vernizMl = parseFloat(configEspecifica.verniz) * quantidade
          

        } else {
          // FALLBACK INTELIGENTE: buscar configuração similar do mesmo modelo

          
          // Buscar outras configurações do mesmo modelo para estimar
          const configsSimilares = configuracao.especificas.filter((s: Record<string, unknown>) => 
            s.modelo === detail.modelo && s.cor !== detail.cor
          )
          
          if (configsSimilares.length > 0) {
            // Usar média das configurações existentes do mesmo modelo
            const avgPrimer = configsSimilares.reduce((sum: number, c: Record<string, unknown>) => sum + parseFloat(String(c.primer)), 0) / configsSimilares.length
            const avgBase = configsSimilares.reduce((sum: number, c: Record<string, unknown>) => sum + parseFloat(String(c.base) || '0'), 0) / configsSimilares.length
            const avgVerniz = configsSimilares.reduce((sum: number, c: Record<string, unknown>) => sum + parseFloat(String(c.verniz)), 0) / configsSimilares.length
            
            primerMl = avgPrimer * quantidade
            baseMl = avgBase * quantidade  
            vernizMl = avgVerniz * quantidade
            

          } else {
            // Usar configuração geral como último recurso
            primerMl = (configuracao.geral.primer.consumo || 0) * quantidade
            baseMl = (configuracao.geral.base.consumo || 0) * quantidade
            vernizMl = (configuracao.geral.verniz.volume_total || 0) * quantidade
            

          }
        }
      }

      // Calcular diluentes baseado no modo de taxa
      let primerDiluenteMl = 0
      let baseDiluenteMl = 0
      let vernizDiluenteMl = 0
      let catalisadorMl = 0

      if (configuracao.modoTaxa === 'sobreTotal') {
        // FÓRMULA FINAL CORRETA: valor específico = TOTAL MISTURADO
        // Exemplo: 229.231L total → 30% diluente (68.76L) + 70% puro (160.46L)
        
        // Primer - FÓRMULA EXATA: valor - taxa% = diluente, resto = puro
        const primerTaxaDiluicao = configuracao.geral.primer.taxa_diluicao / 100 // 30%
        const primerTotalMl = primerMl // valor específico (ex: 127.24ml)
        primerDiluenteMl = primerTotalMl * primerTaxaDiluicao // 127.24 × 30% = 38.172ml
        const primerPuroMl = primerTotalMl - primerDiluenteMl // 127.24 - 38.172 = 89.068ml
        primerMl = primerPuroMl // atualizar para ser só o puro
        
        // Base - verificar se há configuração específica para a cor
        const baseConfigCor = configuracao.bases[detail.cor]
        if (!baseConfigCor) {

        }
        const baseTaxaDiluicao = baseConfigCor ? 
          baseConfigCor.taxa_diluicao / 100 : 
          0 // SEM taxa geral para base, só usar específica por cor
        
        const baseTotalMl = baseMl // valor específico (ex: 324.24ml)
        baseDiluenteMl = baseTotalMl * baseTaxaDiluicao // 324.24 × 28% = 90.79ml
        const basePuraMl = baseTotalMl - baseDiluenteMl // 324.24 - 90.79 = 233.45ml
        baseMl = basePuraMl // atualizar para ser só o puro
        
        // VERNIZ - FÓRMULA FINAL CORRETA
        // Valor específico = TOTAL MISTURADO FINAL (igual primer/base)
        // Proporções: 30% catalisador + 14.4% diluente + 55.6% verniz puro
        const vernizTaxaCatalisador = configuracao.geral.verniz.taxa_catalisador / 100 // 30%
        const vernizTaxaDiluicao = configuracao.geral.verniz.taxa_diluicao / 100 // 14.4%
        
        const vernizTotalMl = vernizMl // valor específico = total misturado
        catalisadorMl = vernizTotalMl * vernizTaxaCatalisador // 30% do total
        vernizDiluenteMl = vernizTotalMl * vernizTaxaDiluicao // 14.4% do total
        const vernizPuroMl = vernizTotalMl - catalisadorMl - vernizDiluenteMl // restante = puro
        vernizMl = vernizPuroMl // atualizar para ser só o puro
        

      }

      // Acumular totais
      totalPrimerPuroMl += primerMl
      totalBasePuraMl += baseMl
      totalVernizPuroMl += vernizMl
      totalDiluentePrimerMl += primerDiluenteMl
      totalDiluenteBaseMl += baseDiluenteMl
      totalDiluenteVernizMl += vernizDiluenteMl
      totalCatalisadorMl += catalisadorMl

      // Acumular consumo por cor (apenas a parte pura da base)
      if (detail.cor && detail.cor !== 'Primer P&A' && baseMl > 0) {
        // Para cores normais (não Primer P&A), incluir no consumo por cor
        if (!consumoPorCor[detail.cor]) {
          consumoPorCor[detail.cor] = 0
        }
        consumoPorCor[detail.cor] += baseMl
      }
      
      // NOTA: Primer P&A não precisa de tratamento especial aqui porque:
      // - Já está sendo contabilizado corretamente como primer (linha ~362)
      // - Não usa base nem verniz (baseMl = 0, vernizMl = 0)
      // - Não deve aparecer no consumo por cor pois não é uma cor de base

      // Acumular para tops
      const modelKey = `${detail.modelo} (${detail.cor})`
      topModelos[modelKey] = (topModelos[modelKey] || 0) + detail.qtd
      topCores[detail.cor] = (topCores[detail.cor] || 0) + detail.qtd
      
    } catch (itemError) {
      errosProcessamento++

    }
  })
  


    // 4. Converter ml para litros e preparar dados de resposta
    const totalPrimerPuroL = totalPrimerPuroMl / 1000
    const totalBasePuraL = totalBasePuraMl / 1000
    const totalVernizPuroL = totalVernizPuroMl / 1000
    const totalDiluentePrimerL = totalDiluentePrimerMl / 1000
    const totalDiluenteBaseL = totalDiluenteBaseMl / 1000
    const totalDiluenteVernizL = totalDiluenteVernizMl / 1000
    const totalCatalisadorL = totalCatalisadorMl / 1000

    const consumoTotalMaterial = totalPrimerPuroL + totalBasePuraL + totalVernizPuroL + totalCatalisadorL
    const consumoTotalDiluentes = totalDiluentePrimerL + totalDiluenteBaseL + totalDiluenteVernizL



    // Preparar dados de resposta
    const topModelosArray = Object.entries(topModelos)
      .map(([modelo, quantidade]) => {
        const [modelName, cor] = modelo.split(' (')
        return {
          modelo: modelName,
          cor: cor?.replace(')', '') || '',
          quantidade
        }
      })
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5) // Limitado a Top 5 conforme solicitado

    const topCoresArray = Object.entries(topCores)
      .map(([cor, quantidade]) => ({ cor, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    const topModelosGrafico = Object.entries(topModelos)
      .map(([modelo, quantidade]) => {
        const [modelName] = modelo.split(' (')
        return { modelo: modelName, quantidade }
      })
      .reduce((acc, item) => {
        const existing = acc.find(x => x.modelo === item.modelo)
        if (existing) {
          existing.quantidade += item.quantidade
        } else {
          acc.push(item)
        }
        return acc
      }, [] as { modelo: string; quantidade: number }[])
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    const coresDetalhadas = Object.entries(consumoPorCor)
      .map(([nome, consumo]) => ({
        nome,
        consumo: (consumo / 1000).toFixed(2)
      }))
      .sort((a, b) => parseFloat(b.consumo) - parseFloat(a.consumo))

    const response = {
      totalPecasPintadas,
      totalChoques,
      totalComponentes,
      consumoTotalMaterial: parseFloat(consumoTotalMaterial.toFixed(2)),
      consumoTotalDiluentes: parseFloat(consumoTotalDiluentes.toFixed(2)),
      consumoDetalhado: {
        primer: totalPrimerPuroL.toFixed(2),
        base: totalBasePuraL.toFixed(2),
        verniz: totalVernizPuroL.toFixed(2),
        cores: coresDetalhadas,
        catalisador: totalCatalisadorL.toFixed(2),
        diluentePrimer: totalDiluentePrimerL.toFixed(2),
        diluenteBase: totalDiluenteBaseL.toFixed(2),
        diluenteVerniz: totalDiluenteVernizL.toFixed(2)
      },
      topModelos: topModelosArray,
      topCores: topCoresArray,
      topModelosGrafico
    }



    return NextResponse.json(response)

  } catch (error) {

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}