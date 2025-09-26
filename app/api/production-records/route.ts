import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ygdragtafmeowqkryaun.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZHJhZ3RhZm1lb3dxa3J5YXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjU4NzIsImV4cCI6MjA1MTUwMTg3Mn0.Ej8nQJhQJhQJhQJhQJhQJhQJhQJhQJhQJhQJhQJhQJhQ'

const supabase = createClient(supabaseUrl, supabaseKey)

// Função para verificar token Base64 (mesmo sistema do frontend)
async function verifyToken(token: string) {
  try {
    console.log('🔍 Verificando token:', token.substring(0, 20) + '...')
    
    // Verificar se o token existe e não está vazio
    if (!token || token.trim() === '') {
      console.error('❌ Token vazio')
      throw new Error('Token vazio')
    }

    // Tentar decodificar o token
    let decoded
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
      console.log('✅ Token decodificado:', { id: decoded.id, username: decoded.username, timestamp: decoded.timestamp })
    } catch (decodeError) {
      console.error('❌ Erro ao decodificar token:', decodeError)
      throw new Error('Token mal formado')
    }

    // Verificar se o token tem a estrutura esperada
    if (!decoded || !decoded.id || !decoded.username || !decoded.timestamp) {
      console.error('❌ Token com estrutura inválida:', decoded)
      throw new Error('Token com estrutura inválida')
    }
    
    // Verificar se o token não está muito antigo (24 horas)
    const tokenAge = Date.now() - decoded.timestamp
    if (tokenAge > 24 * 60 * 60 * 1000) {
      console.error('❌ Token expirado. Idade:', tokenAge / (60 * 60 * 1000), 'horas')
      throw new Error('Token expirado')
    }

    console.log('🔍 Buscando usuário no Supabase com ID:', decoded.id)

    // Buscar usuário atual no banco
    console.log('🔍 Buscando usuário com ID:', decoded.id)
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', decoded.id)
      .eq('ativo', true)
      .single()

    if (error || !usuario) {
      console.log('❌ Usuário não encontrado ou inativo:', error)
      return null
    }

    console.log('✅ Usuário encontrado:', { id: usuario.id, username: usuario.username })
    return usuario
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error)
    return null
  }
}

// Método GET para buscar registros de produção
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando busca de registros de produção')
    
    // Verificar token de autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token de autorização não fornecido')
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    try {
      await verifyToken(token)
    } catch (error) {
      console.error('❌ Token inválido:', error)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar registros na tabela registros
    console.log('🔍 Buscando registros na tabela registros')
    const { data: registros, error } = await supabase
      .from('registros')
      .select('*')
      .order('data', { ascending: false })
      .order('hora', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar registros:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar registros',
        message: error.message
      }, { status: 500 })
    }

    console.log('✅ Registros encontrados:', registros?.length || 0)

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
        console.warn('Erro ao formatar data:', dateError, 'para registro:', { data: registro.data, hora: registro.hora })
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
    console.error('❌ Erro na API GET production-records:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

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

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Usar a nova função de verificação de token Base64
    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

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

    // Verificar se já existe um registro para este horário e data
    const { data: existingRecord, error: checkError } = await supabase
      .from('registros')
      .select('id')
      .eq('data', targetDate)
      .eq('hora', selectedTime)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar registro existente:', checkError)
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
    const paradasData = downtimes.map(downtime => ({
      tipo: downtime.reason,
      tempo: downtime.duration,
      descrição: downtime.description || '',
      criterio: getAreaFromReason(downtime.reason)
    }))

    // Preparar dados de produção no formato JSON
    const producaoData = productions.map(production => ({
      modelo: production.model,
      cor: production.color,
      qtd: production.quantity,
      repintura: production.isRepaint
    }))

    // Inserir registro na tabela registros
    const { data: insertedRecord, error: insertError } = await supabase
      .from('registros')
      .insert({
        data: targetDate,
        hora: selectedTime,
        skids: skidsProduced,
        skids_vazios: emptySkids || 0,
        paradas: paradasData,
        producao: producaoData
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir registro:', insertError)
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
    console.error('Erro na API production-records:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}