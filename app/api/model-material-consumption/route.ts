import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// Interface para configuração de consumo por modelo
interface ModelMaterialConsumption {
  id?: string
  model: string
  color: string
  primer_ml_per_piece: number
  base_ml_per_piece: number
  varnish_ml_per_piece: number
  created_at?: string
  updated_at?: string
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

    console.log('🔧 Buscando configurações de consumo por modelo...')

    // Buscar todas as configurações de consumo por modelo
    const { data, error } = await supabase
      .from('model_material_consumption')
      .select('*')
      .order('model')
      .order('color')

    if (error) {
      console.error('❌ Erro ao buscar configurações de consumo:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar configurações de consumo',
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ Encontradas ${data?.length || 0} configurações de consumo`)
    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Erro na API de model-material-consumption:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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
    const { model, color, primer_ml_per_piece, base_ml_per_piece, varnish_ml_per_piece } = body

    if (!model || !color) {
      return NextResponse.json({ error: 'Modelo e cor são obrigatórios' }, { status: 400 })
    }

    console.log(`🔧 Salvando configuração de consumo: ${model} - ${color}`)

    // Inserir ou atualizar configuração (upsert)
    const { data, error } = await supabase
      .from('model_material_consumption')
      .upsert({
        model,
        color,
        primer_ml_per_piece: primer_ml_per_piece || 0,
        base_ml_per_piece: base_ml_per_piece || 0,
        varnish_ml_per_piece: varnish_ml_per_piece || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'model,color'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao salvar configuração:', error)
      return NextResponse.json({ 
        error: 'Erro ao salvar configuração',
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ Configuração salva: ${model} - ${color}`)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API de model-material-consumption (POST):', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
