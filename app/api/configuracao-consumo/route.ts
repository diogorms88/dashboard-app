import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// Interfaces para a estrutura de configuração
interface PPFItem {
  cor: string
  modelo: string
}

interface BaseConfig {
  diluente: string
  taxa_diluicao: number
}

interface MaterialGeral {
  consumo: number | null
  diluente: string
  taxa_diluicao: number
  taxa_catalisador: number
}

interface VernizGeral {
  diluente: string
  volume_total: number | null
  taxa_diluicao: number
  taxa_catalisador: number
}

interface EspecificaItem {
  cor: string
  modelo: string
  base: string
  primer: string
  verniz: string
}

interface ConfiguracaoConsumo {
  ppf: PPFItem[]
  bases: Record<string, BaseConfig>
  geral: {
    base: MaterialGeral
    primer: MaterialGeral
    verniz: VernizGeral
  }
  modoTaxa: string
  especificas: EspecificaItem[]
}

interface ConfiguracaoConsumoV2 {
  id?: string
  configuracao: ConfiguracaoConsumo
  created_at?: string
  updated_at?: string
}

// GET - Buscar configuração atual
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

    console.log('🔧 Buscando configuração de consumo do Supabase...')

    // Buscar a configuração mais recente
    const { data, error } = await supabase
      .from('configuracao_consumo_v2')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma configuração encontrada, retornar configuração padrão
        console.log('⚠️ Nenhuma configuração encontrada, retornando padrão')
        return NextResponse.json(getDefaultConfiguration())
      }
      console.error('Erro ao buscar configuração:', error)
      return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
    }

    console.log('✅ Configuração encontrada:', data.id)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API configuracao-consumo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Salvar nova configuração
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { configuracao } = body as { configuracao: ConfiguracaoConsumo }

    if (!configuracao) {
      return NextResponse.json({ error: 'Configuração é obrigatória' }, { status: 400 })
    }

    console.log('💾 Salvando nova configuração de consumo...')

    // Inserir nova configuração
    const { data, error } = await supabase
      .from('configuracao_consumo_v2')
      .insert({
        configuracao: configuracao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar configuração:', error)
      return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
    }

    console.log('✅ Configuração salva com sucesso:', data.id)
    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Erro na API configuracao-consumo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configuração existente
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, configuracao } = body as { id: string, configuracao: ConfiguracaoConsumo }

    if (!id || !configuracao) {
      return NextResponse.json({ error: 'ID e configuração são obrigatórios' }, { status: 400 })
    }

    console.log('🔄 Atualizando configuração de consumo:', id)

    // Atualizar configuração existente
    const { data, error } = await supabase
      .from('configuracao_consumo_v2')
      .update({
        configuracao: configuracao,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar configuração:', error)
      return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
    }

    console.log('✅ Configuração atualizada com sucesso')
    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API configuracao-consumo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para retornar configuração padrão
function getDefaultConfiguration(): ConfiguracaoConsumoV2 {
  return {
    id: 'default',
    configuracao: {
      ppf: [
        { cor: "Branco", modelo: "Polo PA DT" },
        { cor: "Prata", modelo: "Polo PA DT" },
        { cor: "Preto", modelo: "Polo PA DT" },
        { cor: "Platinum", modelo: "Polo PA DT" },
        { cor: "Vermelho", modelo: "Polo PA DT" }
        // Adicionar mais conforme necessário
      ],
      bases: {
        "Prata": { diluente: "Y", taxa_diluicao: 39 },
        "Preto": { diluente: "Y", taxa_diluicao: 41 },
        "Branco": { diluente: "Y", taxa_diluicao: 28 },
        "IceBird": { diluente: "Y", taxa_diluicao: 35 },
        "Platinum": { diluente: "Y", taxa_diluicao: 30 },
        "Vermelho": { diluente: "Y", taxa_diluicao: 26.9 },
        "HyperNova": { diluente: "Y", taxa_diluicao: 37.5 },
        "ClearWater": { diluente: "Y", taxa_diluicao: 33.6 },
        "Azul Biscay": { diluente: "Y", taxa_diluicao: 32 }
      },
      geral: {
        base: { consumo: null, diluente: "Y", taxa_diluicao: 30, taxa_catalisador: 0 },
        primer: { consumo: null, diluente: "X", taxa_diluicao: 30, taxa_catalisador: 0 },
        verniz: { diluente: "Z", volume_total: null, taxa_diluicao: 14.4, taxa_catalisador: 30 }
      },
      modoTaxa: "sobreTotal",
      especificas: []
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}
