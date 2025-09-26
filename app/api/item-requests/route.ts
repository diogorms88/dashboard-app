import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ygdragtafmeowqkryaun.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZHJhZ3RhZm1lb3dxa3J5YXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjU4NzIsImV4cCI6MjA1MTUwMTg3Mn0.Ej8nQJhQJhQJhQJhQJhQJhQJhQJhQJhQJhQJhQJhQJhQ'

const supabase = createClient(supabaseUrl, supabaseKey)

// Função para verificar token Base64
async function verifyToken(token: string) {
  try {
    console.log('🔍 Verificando token...')
    
    // Decodificar o token Base64
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    console.log('📝 Token decodificado:', { id: decoded.id, username: decoded.username })
    
    // Verificar estrutura do token
    if (!decoded.id || !decoded.username || !decoded.timestamp) {
      console.log('❌ Estrutura do token inválida')
      return null
    }
    
    // Verificar se o token não expirou (24 horas)
    const tokenAge = Date.now() - decoded.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas em ms
    
    if (tokenAge > maxAge) {
      console.log('❌ Token expirado')
      return null
    }
    
    // Buscar usuário no Supabase
    console.log('🔍 Buscando usuário no Supabase...')
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', decoded.id)
      .eq('ativo', true)
      .single()
    
    if (error || !user) {
      console.log('❌ Usuário não encontrado ou inativo:', error)
      return null
    }
    
    console.log('✅ Usuário encontrado:', { id: user.id, username: user.username })
    return user
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Como não temos tabela item_requests no Supabase, retornar array vazio por enquanto
    // Isso evitará o erro HTTP 500 e permitirá que o sidebar funcione
    console.log('📝 Retornando array vazio para item_requests (tabela não existe)')
    
    return NextResponse.json([])

  } catch (error) {
    console.error('Erro na API item-requests:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Por enquanto, retornar sucesso sem fazer nada
    // Quando a tabela item_requests for criada, implementar a lógica aqui
    const body = await request.json()
    
    console.log('📝 POST item-requests recebido (não implementado):', body)
    
    return NextResponse.json({
      success: true,
      message: 'Funcionalidade não implementada - tabela item_requests não existe'
    })

  } catch (error) {
    console.error('Erro na API item-requests POST:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}