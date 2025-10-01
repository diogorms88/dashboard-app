import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, getUserFromRequest } from '@/lib/auth-middleware'



// Método GET para buscar registros de produção
async function handleGet(request: NextRequest) {
  try {

    
    const user = await getUserFromRequest(request)

    // Buscar registros na tabela registros

    const { data: registros, error } = await supabase
      .from('registros')
      .select('*')
      .order('data', { ascending: false })
      .order('hora', { ascending: false })

    if (error) {

      return NextResponse.json({ 
        error: 'Erro ao buscar registros',
        message: error.message
      }, { status: 500 })
    }



    // Transformar os dados para o formato esperado pelo frontend
    const formattedRecords = registros?.map(registro => {
      // Criar uma data válida combinando data e hora
      let createdAt
      try {
        if (registro.data && registro.hora) {
          // Extrair a hora inicial do formato "XXhXX - YYhYY" (ex: "12h00 - 13h00")
          const horaMatch = registro.hora.match(/(\d{2})h(\d{2})/)
          if (horaMatch) {
            const [, horas, minutos] = horaMatch
            // Criar data no formato ISO: YYYY-MM-DDTHH:MM:SS
            createdAt = new Date(`${registro.data}T${horas}:${minutos}:00`).toISOString()
          } else {
            // Se não conseguir extrair a hora, usar meio-dia como padrão
            createdAt = new Date(`${registro.data}T12:00:00`).toISOString()
          }
        } else {
          createdAt = new Date().toISOString()
        }
      } catch (dateError) {

        createdAt = new Date().toISOString()
      }

      return {
        id: registro.id,
        time_slot: registro.hora || 'N/A',
        shift: 'N/A', // A tabela não tem campo turno
        skids_produced: registro.skids || 0,
        empty_skids: registro.skids_vazios || 0,
        created_at: createdAt,
        created_by_name: 'Sistema', // Não temos campo de usuário na tabela
        paradas: registro.paradas || [],
        producao: registro.producao || []
      }
    }) || []

    return NextResponse.json(formattedRecords)

  } catch (error) {

    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)

// Função para mapear motivos de parada para critérios
const getAreaFromReason = (reason: string): string => {
  const downtimeReasonsByArea = {
    'ENGENHARIA': [
      'TESTE DE ENGENHARIA',
      'LIMITE DE EIXO'
    ],
    'GESTÃO': [
      'FALTA DE FERRAMENTAS',
      'FALTA DE OPERADOR NA CARGA',
      'FALTA DE PEÇAS DA PREPARAÇÃO',
      'OPERADOR BUSCANDO PEÇA NO ALMOXARIFADO',
      'OPERADOR NA ENFERMARIA',
      'ORGANIZAÇÃO GERAL NO SETOR',
      'PARADA NA CABINE',
      'PARADA NA CARGA - ABASTECENDO A LINHA',
      'PARADA NA DESCARGA - DESCARREGANDO PEÇAS',
      'PARADA EXTERNA',
      'REFEIÇÃO',
      'REGULAGEM DE MÁQUINA',
      'RETRABALHO / LIMPEZA DE PEÇAS',
      'REUNIÃO COM A DIRETORIA',
      'REUNIÃO',
      'TREINAMENTO',
      'TROCA DE TURNO'
    ],
    'LOGÍSTICA': [
      'AGUARDANDO A PROGRAMAÇÃO',
      'FALHA RFID',
      'FALTA DE ABASTECIMENTO DE RACK',
      'FALTA DE EMBALAGEM DA LOGÍSTICA',
      'FALTA DE EMPILHADOR DA LOGÍSTICA ABASTECENDO PEÇAS',
      'FALTA DE MATÉRIA PRIMA (TINTA / VERNIZ)',
      'FALTA DE PEÇAS DO ALMOXARIFADO (REQUISITADO)',
      'FALTA DE PEÇAS INJETADAS',
      'PARADA PROGRAMADA'
    ],
    'MANUTENÇÃO': [
      'AGUARDANDO A MANUTENÇÃO',
      'CABINE DESBALANCEADA',
      'CORRENTE QUEBRADA',
      'FALHA NO ELEVADOR',
      'FALTA AR COMPRIMIDO',
      'FALTA DE ENERGIA',
      'MANGUEIRA ENTUPIDA',
      'MANGUEIRA VAZANDO',
      'MANUTENÇÃO CORRETIVA',
      'SKID TRAVADO',
      'MANUTENÇÃO ELÉTRICA',
      'MANUTENÇÃO MECÂNICA',
      'MANUTENÇÃO PREDIAL',
      'MANUTENÇÃO PREVENTIVA',
      'MANUTENÇÃO SERRALHERIA',
      'PROBLEMA NO ROBÔ CAB. FLAMAGEM',
      'PROBLEMA NO ROBÔ CAB. PRIMER',
      'PROBLEMA NO ROBÔ CAB. BASE',
      'PROBLEMA NO ROBÔ CAB. VERNIZ',
      'PROBLEMA NO MAÇARICO',
      'PROBLEMA NO MOTOR / CORREIA',
      'PROBLEMA NO POWER WASH'
    ],
    'MILCLEAN': [
      'AGUARDANDO OPERADOR PARA LIMPEZA'
    ],
    'PRODUÇÃO': [
      'FALTA DE OPERADOR',
      'FIM DE EXPEDIENTE',
      'LIMPEZA DE MÁQUINA',
      'PAUSA',
      'TROCA DE PEÇAS',
      'TROCA DE SETUP'
    ],
    'QUALIDADE': [
      'ESPERANDO LIBERAÇÃO DA QUALIDADE'
    ],
    'SETUP': [
      'SETUP DE COR',
      'TROCA DE MODELO'
    ],
    'PINTURA': [
      'LIMPEZA DA CABINE',
      'GAP PARA LIMPEZA NA CABINE',
      'LIMPEZA CONJUNTO ECOBELL',
      'GAP NA FLAMAGEM'
    ],
    'SEGURANÇA': [
      'ACIDENTE / INCIDENTE',
      'INSPEÇÃO DE SEGURANÇA'
    ]
  }

  // Encontrar a área baseada no motivo de parada
  for (const [area, reasons] of Object.entries(downtimeReasonsByArea)) {
    if (reasons.includes(reason)) {
      return area
    }
  }
  
  // Se não encontrar, retornar OUTROS
  return 'OUTROS'
}

async function handlePost(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    // Obter dados do corpo da requisição
    const body = await request.json()
    const {
      selectedTime,
      shift,
      skidsProduced,
      emptySkids,
      targetDate,
      downtimes,
      productions
    } = body

    // Validar dados obrigatórios
    if (!selectedTime || !skidsProduced || !targetDate) {
      return NextResponse.json({ 
        error: 'Dados obrigatórios faltando',
        message: 'Horário, skids produzidos e data são obrigatórios'
      }, { status: 400 })
    }

    // Converter skidsProduced para número
    const skidsProducedNum = parseInt(skidsProduced) || 0
    const emptySkidsNum = parseInt(emptySkids) || 0

    // Verificar se já existe um registro para este horário e data
    const { data: existingRecord, error: checkError } = await supabase
      .from('registros')
      .select('id')
      .eq('data', targetDate)
      .eq('hora', selectedTime)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {

      return NextResponse.json({ 
        error: 'Erro interno do servidor',
        message: 'Erro ao verificar registros existentes'
      }, { status: 500 })
    }

    if (existingRecord) {
      return NextResponse.json({ 
        error: 'Registro duplicado',
        message: `Já existe um registro para o horário ${selectedTime} na data ${targetDate}`
      }, { status: 409 })
    }

    // Preparar dados de paradas no formato JSON
    const paradasData = (downtimes || []).map(downtime => ({
      tipo: downtime.reason || '',
      tempo: parseInt(downtime.duration) || 0,
      descrição: downtime.description || '',
      criterio: getAreaFromReason(downtime.reason || '')
    }))

    // Preparar dados de produção no formato JSON
    const producaoData = (productions || []).map(production => ({
      modelo: production.model || '',
      cor: production.color || '',
      qtd: parseInt(production.quantity) || 0,
      repintura: production.isRepaint || false
    }))

    // Inserir registro na tabela registros
    const { data: insertedRecord, error: insertError } = await supabase
      .from('registros')
      .insert({
        data: targetDate,
        hora: selectedTime,
        skids: skidsProducedNum,
        skids_vazios: emptySkidsNum,
        paradas: paradasData,
        producao: producaoData
      })
      .select()
      .single()

    if (insertError) {

      return NextResponse.json({ 
        error: 'Erro ao salvar registro',
        message: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Registro salvo com sucesso',
      data: insertedRecord
    })

  } catch (error) {

    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)