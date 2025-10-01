import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getUserFromRequest } from '@/lib/auth-middleware'
import { supabaseServer } from '@/lib/supabase'

// Interface para solicitações de itens
interface ItemRequest {
  id?: number
  item_name: string
  quantity: number
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  requested_by: string
  assigned_to?: string
  created_at?: string
  updated_at?: string
}

// GET - Buscar solicitações
async function handleGet(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    // Usar cliente com service role para contornar RLS
    const { getSupabaseServerClient } = await import('@/lib/supabase')
    const supabaseAdmin = getSupabaseServerClient()
    
    let query = supabaseAdmin
      .from('item_requests')
      .select(`
        *,
        requested_by_user:usuarios!requested_by(id, nome, username),
        assigned_to_user:usuarios!assigned_to(id, nome, username)
      `)
      .order('created_at', { ascending: false })

    // Se user_id for fornecido, filtrar por usuário específico
    // Caso contrário, admins e managers veem todas, outros veem apenas suas próprias
    if (userId) {
      query = query.eq('requested_by', userId)
    } else if (user.papel !== 'admin' && user.papel !== 'manager') {
      query = query.eq('requested_by', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar solicitações:', error)
      return NextResponse.json({ error: 'Erro ao buscar solicitações' }, { status: 500 })
    }

    // Formatar dados para compatibilidade com o frontend
    const formattedData = data?.map(item => ({
      id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      description: item.description,
      priority: item.priority,
      status: item.status,
      requested_by: item.requested_by,
      assigned_to: item.assigned_to,
      requested_by_name: item.requested_by_user?.nome || 'Usuário não encontrado',
      assigned_to_name: item.assigned_to_user?.nome || null,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || []

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// POST - Criar nova solicitação
async function handlePost(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { item_name, quantity, description, priority } = body

    // Validações
    if (!item_name || !quantity || !priority) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: item_name, quantity, priority' 
      }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ 
        error: 'Quantidade deve ser maior que zero' 
      }, { status: 400 })
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json({ 
        error: 'Prioridade deve ser: low, medium, high ou urgent' 
      }, { status: 400 })
    }

    const newRequest: Omit<ItemRequest, 'id' | 'created_at' | 'updated_at'> = {
      item_name,
      quantity: parseInt(quantity),
      description: description || null,
      priority,
      status: 'pending',
      requested_by: user.id
    }

    // Usar o cliente servidor com contexto do usuário para respeitar RLS
    const { data, error } = await supabaseServer
      .rpc('create_item_request', {
        p_item_name: newRequest.item_name,
        p_quantity: newRequest.quantity,
        p_requested_by: newRequest.requested_by,
        p_description: newRequest.description,
        p_priority: newRequest.priority
      })

    if (error) {
      console.error('Erro ao criar solicitação:', error)
      return NextResponse.json({ 
        error: 'Erro ao criar solicitação',
        details: error.message 
      }, { status: 500 })
    }

    // A função RPC retorna um array, então pegamos o primeiro item
    const createdRequest = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success: true,
      data: createdRequest,
      message: 'Solicitação criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)