import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getUserFromRequest } from '@/lib/auth-middleware'
import { supabaseServer } from '@/lib/supabase'

// DELETE - Limpar todas as solicitações (apenas admins)
async function handleDelete(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Apenas admins podem limpar todas as solicitações
    if (user.papel !== 'admin') {
      return NextResponse.json({ 
        error: 'Acesso negado - apenas administradores podem limpar todas as solicitações' 
      }, { status: 403 })
    }

    // Contar quantas solicitações existem antes de deletar
    const { count: totalCount, error: countError } = await supabaseServer
      .from('item_requests')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Erro ao contar solicitações:', countError)
      return NextResponse.json({ error: 'Erro ao verificar solicitações' }, { status: 500 })
    }

    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma solicitação encontrada para limpar',
        deletedCount: 0
      })
    }

    // Deletar todas as solicitações
    const { error } = await supabaseServer
      .from('item_requests')
      .delete()
      .neq('id', 0) // Condição que sempre será verdadeira para deletar todos os registros

    if (error) {
      console.error('Erro ao limpar solicitações:', error)
      return NextResponse.json({ error: 'Erro ao limpar solicitações' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${totalCount} solicitação(ões) foram removidas com sucesso`,
      deletedCount: totalCount
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export const DELETE = withAuth(handleDelete)