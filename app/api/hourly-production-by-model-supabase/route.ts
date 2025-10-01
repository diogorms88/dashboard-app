import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// Interfaces para os dados
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
      return NextResponse.json({ error: 'Erro ao buscar dados de registros' }, { status: 500 })
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



    // 2. Processar dados para agrupar por modelo e hora (formato pivot)
    const modelHourData: { [model: string]: { [hour: number]: number } } = {}
    const horasComDados = new Set<number>()

    registrosFiltrados?.forEach(registro => {
      const hora = registro.hora
      // Extrair hora inicial do formato "XXhXX - YYhYY"
      const horaMatch = hora.match(/(\d{2})h\d{2}/)
      
      if (horaMatch && registro.producao && Array.isArray(registro.producao)) {
        const horaInicial = parseInt(horaMatch[1])
        horasComDados.add(horaInicial)
        
        registro.producao.forEach((item: ProducaoItem) => {
          if (!modelHourData[item.modelo]) {
            modelHourData[item.modelo] = {}
          }
          
          if (!modelHourData[item.modelo][horaInicial]) {
            modelHourData[item.modelo][horaInicial] = 0
          }
          
          modelHourData[item.modelo][horaInicial] += item.qtd
        })
      }
    })

    // 3. Converter para formato pivot esperado pelo frontend
    const finalData = Object.keys(modelHourData).map(modelo => {
      const rowData: Record<string, number | string> = { modelo }
      let total = 0
      
      // Adicionar dados para cada hora
      Array.from(horasComDados).sort((a, b) => a - b).forEach(hora => {
        const quantidade = modelHourData[modelo][hora] || 0
        rowData[`h${hora.toString().padStart(2, '0')}`] = quantidade
        total += quantidade
      })
      
      rowData.total = total
      return rowData
    })

    // Ordenar por total decrescente
    finalData.sort((a, b) => (b.total as number) - (a.total as number))



    // Retornar dados com informações sobre as horas disponíveis (formato esperado)
    return NextResponse.json({
      data: finalData,
      availableHours: Array.from(horasComDados).sort((a, b) => a - b)
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}