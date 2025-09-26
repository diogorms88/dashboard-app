import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

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

    console.log('🔧 Buscando configurações de materiais...')

    // Buscar todas as configurações de materiais
    const { data, error } = await supabase
      .from('material_settings')
      .select('*')
      .order('material_name')

    if (error) {
      console.error('❌ Erro ao buscar configurações de materiais:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar configurações de materiais',
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ Encontradas ${data?.length || 0} configurações de materiais`)
    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Erro na API de material-settings:', error)
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
    const { material_name, dilution_rate, diluent_type, catalyst_rate } = body

    if (!material_name) {
      return NextResponse.json({ error: 'Nome do material é obrigatório' }, { status: 400 })
    }

    console.log(`🔧 Salvando configuração de material: ${material_name}`)

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
      console.error('❌ Erro ao salvar configuração de material:', error)
      return NextResponse.json({ 
        error: 'Erro ao salvar configuração de material',
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ Configuração de material salva: ${material_name}`)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API de material-settings (POST):', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
