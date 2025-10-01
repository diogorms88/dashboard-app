import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getUserFromRequest } from '@/lib/auth-middleware'
import { supabaseServer } from '@/lib/supabase'

// Interface para usuários
interface User {
  id: string
  username: string
  nome: string
  papel: 'admin' | 'manager' | 'operator' | 'viewer'
  ativo: boolean
  created_at: string
  updated_at: string
}

// GET - Buscar usuários
async function handleGet(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Apenas admins e managers podem ver a lista de usuários
    if (user.papel !== 'admin' && user.papel !== 'manager') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { data, error } = await supabaseServer
      .from('usuarios')
      .select('id, username, nome, papel, ativo, created_at, updated_at')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)