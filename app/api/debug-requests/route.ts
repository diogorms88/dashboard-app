import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, getSupabaseServerClient } from '@/lib/supabase'
import { withAuth, getUserFromRequest } from '@/lib/auth-middleware'

// Endpoint de debug para verificar dados na tabela item_requests
async function handleGet(request: NextRequest) {
  try {
    // Usar cliente com service role para contornar RLS
    const supabaseAdmin = getSupabaseServerClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const testRpc = searchParams.get('test_rpc')
    const createTest = searchParams.get('create_test')

    // Teste de criação direta se solicitado
    let createTestResult = null
    if (createTest === 'true') {
      const { data: createData, error: createError } = await supabaseAdmin
        .from('item_requests')
        .insert({
          item_name: 'Teste Direto',
          quantity: 5,
          description: 'Teste de inserção direta na tabela',
          priority: 'high',
          status: 'pending',
          requested_by: '9eb13a45-c4fe-452f-b154-6a91ed4f2bc0'
        })
        .select()
      
      createTestResult = {
        data: createData,
        error: createError
      }
    }

    // Teste da função RPC se solicitado
    let rpcTest = null
    if (testRpc === 'true') {
      const { data: rpcData, error: rpcError } = await supabaseAdmin
        .rpc('create_item_request', {
          p_item_name: 'Teste Debug',
          p_quantity: 1,
          p_requested_by: '9eb13a45-c4fe-452f-b154-6a91ed4f2bc0',
          p_description: 'Teste de debug da função RPC',
          p_priority: 'medium'
        })
      
      rpcTest = {
        data: rpcData,
        error: rpcError
      }
    }

    // Buscar todos os dados sem filtros de RLS
    const { data: allData, error: allError } = await supabaseAdmin
      .from('item_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Buscar dados com join para nomes de usuários
    const { data: joinData, error: joinError } = await supabaseAdmin
      .from('item_requests')
      .select(`
        *,
        requested_by_user:usuarios!requested_by(id, nome, username),
        assigned_to_user:usuarios!assigned_to(id, nome, username)
      `)
      .order('created_at', { ascending: false })

    // Buscar dados filtrados por usuário se fornecido
    let filteredData = null
    let filteredError = null
    if (userId) {
      const result = await supabaseServer
        .from('item_requests')
        .select(`
          *,
          requested_by_user:usuarios!requested_by(id, nome, username),
          assigned_to_user:usuarios!assigned_to(id, nome, username)
        `)
        .eq('requested_by', userId)
        .order('created_at', { ascending: false })
      
      filteredData = result.data
      filteredError = result.error
    }

    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      userId: userId,
      rpcTest: rpcTest,
      createTest: createTestResult,
      results: {
        allData: {
          count: allData?.length || 0,
          data: allData,
          error: allError
        },
        joinData: {
          count: joinData?.length || 0,
          data: joinData,
          error: joinError
        },
        filteredData: userId ? {
          count: filteredData?.length || 0,
          data: filteredData,
          error: filteredError
        } : null
      }
    })

  } catch (error) {
    console.error('Erro no debug:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      debug: true
    }, { status: 500 })
  }
}

export const GET = handleGet