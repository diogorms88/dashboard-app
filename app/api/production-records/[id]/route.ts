import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alrfqjazctnjdewdthun.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Hyy30QVgFAzYHxuEdfwv4w_25uLQkh0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função para verificar e decodificar o token
async function verifyToken(token: string) {
  try {
    // Decodificar o token Base64
    const decoded = JSON.parse(atob(token))
    
    // Verificar se o token tem a estrutura esperada
    if (!decoded.id || !decoded.username || !decoded.timestamp) {
      return null
    }
    
    // Verificar se o token não expirou (24 horas)
    const tokenAge = Date.now() - decoded.timestamp
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return null
    }
    
    // Buscar o usuário no Supabase para verificar se ainda existe e está ativo
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', decoded.id)
      .eq('ativo', true)
      .single()
    
    if (error || !usuario) {
      return null
    }
    
    return usuario
  } catch (error) {
    console.error('Erro ao verificar token:', error)
    return null
  }
}

// Função para determinar o turno baseado no horário
function determineShift(hora: string): string {
  if (!hora) return 'N/A'
  
  // Extrair a hora inicial do formato "XXhXX - YYhYY" (ex: "12h00 - 13h00")
  const horaMatch = hora.match(/(\d{2})h(\d{2})/)
  if (!horaMatch) return 'N/A'
  
  const [, horas] = horaMatch
  const horaNum = parseInt(horas, 10)
  
  // Lógica de turnos:
  // 00h00 às 06h00 - Turno 3
  // 06h00 às 15h00 - Turno 1  
  // 15h00 às 00h00 - Turno 2
  if (horaNum >= 0 && horaNum < 6) {
    return 'Turno 3'
  } else if (horaNum >= 6 && horaNum < 15) {
    return 'Turno 1'
  } else {
    return 'Turno 2'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('🔍 Verificando token...')
    const user = await verifyToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    console.log('📝 Token decodificado:', { id: user.id, username: user.username })
    console.log('🔍 Buscando usuário no Supabase...')
    console.log('✅ Usuário encontrado:', { id: user.id, username: user.username })

    const { id } = await params

    // Buscar o registro específico no Supabase
    const { data: registro, error } = await supabase
      .from('registros')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar registro:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    if (!registro) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
    }

    // Buscar skids vazios da tabela skids_vazios (se existir)
    let skidsVazios = registro.skids_vazios || 0
    try {
      const { data: skidsVaziosData, error: skidsVaziosError } = await supabase
        .from('skids_vazios')
        .select('quantidade')
        .eq('registro_id', id)
        .single()
      
      if (!skidsVaziosError && skidsVaziosData) {
        skidsVazios = skidsVaziosData.quantidade || 0
      }
    } catch (e) {
      // Tabela pode não existir, usar valor do registro principal
      console.log('📝 Usando skids_vazios do registro principal')
    }

    // Buscar paradas da tabela paradas (se existir)
    let paradas = Array.isArray(registro.paradas) ? registro.paradas : []
    try {
      const { data: paradasData, error: paradasError } = await supabase
        .from('paradas')
        .select('tipo, tempo, criterio, descricao')
        .eq('registro_id', id)
      
      if (!paradasError && paradasData && paradasData.length > 0) {
        paradas = paradasData.map(p => ({
          tipo: p.tipo,
          tempo: p.tempo,
          criterio: p.criterio,
          descricao: p.descricao
        }))
      }
    } catch (e) {
      // Tabela pode não existir, usar valor do registro principal
      console.log('📝 Usando paradas do registro principal')
    }

    // Buscar produção da tabela producao (se existir)
    let producao = Array.isArray(registro.producao) ? registro.producao : []
    try {
      const { data: producaoData, error: producaoError } = await supabase
        .from('producao')
        .select('modelo, cor, qtd, repintura')
        .eq('registro_id', id)
      
      if (!producaoError && producaoData && producaoData.length > 0) {
        producao = producaoData.map(p => ({
          modelo: p.modelo,
          cor: p.cor,
          qtd: p.qtd,
          repintura: p.repintura
        }))
      }
    } catch (e) {
      // Tabela pode não existir, usar valor do registro principal
      console.log('📝 Usando produção do registro principal')
    }

    // Formatar o registro para o frontend
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

    const formattedRecord = {
      id: registro.id,
      time_slot: registro.hora || 'N/A',
      shift: determineShift(registro.hora), // Turno automático baseado no horário
      skids_produced: registro.skids || 0, // Skids produzidos da tabela registros
      empty_skids: skidsVazios, // Skids vazios da tabela skids_vazios ou registro
      created_at: createdAt,
      // Campo "Criado Por" removido conforme solicitado
      paradas: paradas, // Paradas da tabela paradas com tipo, tempo, criterio, descricao
      producao: producao, // Produção da tabela producao com modelo, cor, qtd, repintura
      downtimes: paradas.map(p => ({
        id: `${id}-${p.tipo}`,
        reason: p.tipo,
        duration: p.tempo,
        description: p.descricao,
        criterio: p.criterio
      })),
      // Campos adicionais para detalhes
      data: registro.data,
      hora: registro.hora
    }

    return NextResponse.json(formattedRecord)

  } catch (error) {
    console.error('Erro na API de detalhes do registro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}