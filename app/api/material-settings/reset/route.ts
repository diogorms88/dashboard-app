import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

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



    // Deletar todas as configurações existentes
    const { error: deleteError } = await supabase
      .from('material_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deletar todos (usando condição que sempre é verdadeira)

    if (deleteError) {
      return NextResponse.json({ 
        error: 'Erro ao resetar configurações',
        details: deleteError.message 
      }, { status: 500 })
    }

    // Inserir configurações padrão
    const defaultSettings = [
      { material_name: 'primer', dilution_rate: 10, diluent_type: 'diluente_primer', catalyst_rate: 0 },
      { material_name: 'branco', dilution_rate: 15, diluent_type: 'diluente_base', catalyst_rate: 0 },
      { material_name: 'preto', dilution_rate: 12, diluent_type: 'diluente_base', catalyst_rate: 0 },
      { material_name: 'platinum', dilution_rate: 18, diluent_type: 'diluente_base', catalyst_rate: 0 },
      { material_name: 'prata_sirius', dilution_rate: 20, diluent_type: 'diluente_base', catalyst_rate: 0 },
      { material_name: 'hypernova', dilution_rate: 16, diluent_type: 'diluente_base', catalyst_rate: 0 },
      { material_name: 'clearwater', dilution_rate: 14, diluent_type: 'diluente_base', catalyst_rate: 0 },
      { material_name: 'icebird', dilution_rate: 17, diluent_type: 'diluente_base', catalyst_rate: 0 },
      { material_name: 'azul_biscay', dilution_rate: 13, diluent_type: 'diluente_base', catalyst_rate: 0 },
      { material_name: 'verniz', dilution_rate: 25, diluent_type: 'diluente_verniz', catalyst_rate: 8 }
    ]

    const { data, error: insertError } = await supabase
      .from('material_settings')
      .insert(defaultSettings)
      .select()

    if (insertError) {
      return NextResponse.json({ 
        error: 'Erro ao inserir configurações padrão',
        details: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Configurações resetadas com sucesso',
      inserted: data?.length || 0
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
