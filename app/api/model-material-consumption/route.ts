import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, getUserFromRequest } from '@/lib/auth-middleware'

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

async function handleGet(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)



    // Buscar todas as configurações de consumo por modelo
    const { data, error } = await supabase
      .from('model_material_consumption')
      .select('*')
      .order('model')
      .order('color')

    if (error) {

      return NextResponse.json({ 
        error: 'Erro ao buscar configurações de consumo',
        details: error.message 
      }, { status: 500 })
    }


    return NextResponse.json(data || [])

  } catch (error) {

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)

async function handlePost(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    const body = await request.json()
    const { model, color, primer_ml_per_piece, base_ml_per_piece, varnish_ml_per_piece } = body

    if (!model || !color) {
      return NextResponse.json({ error: 'Modelo e cor são obrigatórios' }, { status: 400 })
    }



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

      return NextResponse.json({ 
        error: 'Erro ao salvar configuração',
        details: error.message 
      }, { status: 500 })
    }


    return NextResponse.json(data)

  } catch (error) {

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handlePost)
