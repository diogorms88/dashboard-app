import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const createdAfter = searchParams.get('created_after')
    
    if (!createdAfter) {
      return NextResponse.json(
        { error: 'Parameter created_after is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('item_requests')
      .select(`
        *,
        requester:usuarios!item_requests_requested_by_fkey(nome),
        assignee:usuarios!item_requests_assigned_to_fkey(nome)
      `)
      .gte('created_at', createdAfter)
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar solicitações recentes:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Formatar os dados para incluir os nomes dos usuários
    const formattedData = data?.map(item => ({
      id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      description: item.description,
      priority: item.priority,
      status: item.status,
      requested_by: item.requested_by,
      assigned_to: item.assigned_to,
      requested_by_name: item.requester?.nome || 'Usuário não encontrado',
      assigned_to_name: item.assignee?.nome || null,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || []

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}