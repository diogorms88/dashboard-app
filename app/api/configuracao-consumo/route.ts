import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, getUserFromRequest } from '@/lib/auth-middleware'

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
async function handleGet(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)



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
  
        return NextResponse.json(getDefaultConfiguration())
      }
      return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
    }


    return NextResponse.json(data)

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)

// POST - Salvar nova configuração
async function handlePost(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    const body = await request.json()
    const { configuracao } = body as { configuracao: ConfiguracaoConsumo }

    if (!configuracao) {
      return NextResponse.json({ error: 'Configuração é obrigatória' }, { status: 400 })
    }



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
      return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
    }


    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)

// PUT - Atualizar configuração existente
async function handlePut(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    const body = await request.json()
    const { id, configuracao } = body as { id: string, configuracao: ConfiguracaoConsumo }

    if (!id || !configuracao) {
      return NextResponse.json({ error: 'ID e configuração são obrigatórios' }, { status: 400 })
    }



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
      return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
    }


    return NextResponse.json(data)

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const PUT = withAuth(handlePut)

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
