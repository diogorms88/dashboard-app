import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, getUserFromRequest } from '@/lib/auth-middleware'

// Interface para configurações de materiais
interface MaterialSetting {
  id?: string
  material_name: string
  dilution_rate: number
  diluent_type: string
  catalyst_rate: number
  created_at?: string
  updated_at?: string
}

async function handleGet(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)



    // Buscar todas as configurações de materiais
    const { data, error } = await supabase
      .from('material_settings')
      .select('*')
      .order('material_name')

    if (error) {
      return NextResponse.json({ 
        error: 'Erro ao buscar configurações de materiais',
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
    const { material_name, dilution_rate, diluent_type, catalyst_rate } = body

    if (!material_name) {
      return NextResponse.json({ error: 'Nome do material é obrigatório' }, { status: 400 })
    }



    // Inserir ou atualizar configuração (upsert)
    const { data, error } = await supabase
      .from('material_settings')
      .upsert({
        material_name,
        dilution_rate: dilution_rate || 0,
        diluent_type: diluent_type || '',
        catalyst_rate: catalyst_rate || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'material_name'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Erro ao salvar configuração de material',
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
