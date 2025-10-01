import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withManagerAuth, getUserFromRequest } from '@/lib/auth-middleware'
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

// GET - Buscar solicitação específica
async function handleGet(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { id } = params

    const { data, error } = await supabaseServer
      .from('item_requests')
      .select(`
        *,
        requested_by_user:usuarios!requested_by(id, nome, username),
        assigned_to_user:usuarios!assigned_to(id, nome, username)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
      }
      console.error('Erro ao buscar solicitação:', error)
      return NextResponse.json({ error: 'Erro ao buscar solicitação' }, { status: 500 })
    }

    // Verificar permissões - usuários só podem ver suas próprias solicitações
    if (user.papel !== 'admin' && user.papel !== 'manager' && data.requested_by !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Formatar dados para compatibilidade com o frontend
    const formattedData = {
      id: data.id,
      item_name: data.item_name,
      quantity: data.quantity,
      description: data.description,
      priority: data.priority,
      status: data.status,
      requested_by: data.requested_by,
      assigned_to: data.assigned_to,
      requested_by_name: data.requested_by_user?.nome || 'Usuário não encontrado',
      assigned_to_name: data.assigned_to_user?.nome || null,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// PUT - Atualizar solicitação (apenas admins e managers)
async function handlePut(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Apenas admins e managers podem atualizar solicitações
    if (user.papel !== 'admin' && user.papel !== 'manager') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { status, assigned_to, priority, description } = body

    // Validações
    const updateData: Partial<ItemRequest> = {}

    if (status) {
      if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json({ 
          error: 'Status deve ser: pending, in_progress, completed ou cancelled' 
        }, { status: 400 })
      }
      updateData.status = status
    }

    if (priority) {
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        return NextResponse.json({ 
          error: 'Prioridade deve ser: low, medium, high ou urgent' 
        }, { status: 400 })
      }
      updateData.priority = priority
    }

    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to || null
    }

    if (description !== undefined) {
      updateData.description = description || null
    }

    // Verificar se a solicitação existe
    const { data: existingRequest, error: fetchError } = await supabaseServer
      .from('item_requests')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
      }
      console.error('Erro ao verificar solicitação:', fetchError)
      return NextResponse.json({ error: 'Erro ao verificar solicitação' }, { status: 500 })
    }

    // Atualizar a solicitação
    const { data, error } = await supabaseServer
      .from('item_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar solicitação:', error)
      return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação atualizada com sucesso',
      data
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// DELETE - Deletar solicitação (apenas admins)
async function handleDelete(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Apenas admins podem deletar solicitações
    if (user.papel !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado - apenas administradores' }, { status: 403 })
    }

    const { id } = params

    // Verificar se a solicitação existe
    const { data: existingRequest, error: fetchError } = await supabaseServer
      .from('item_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
      }
      console.error('Erro ao verificar solicitação:', fetchError)
      return NextResponse.json({ error: 'Erro ao verificar solicitação' }, { status: 500 })
    }

    // Deletar a solicitação
    const { error } = await supabaseServer
      .from('item_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar solicitação:', error)
      return NextResponse.json({ error: 'Erro ao deletar solicitação' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withManagerAuth(handlePut)
export const DELETE = withAuth(handleDelete) // Verificação de admin é feita internamente