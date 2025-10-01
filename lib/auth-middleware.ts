import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { UserProfile } from '@/lib/auth-supabase'

// Extensão do NextRequest para incluir dados do usuário
interface AuthenticatedRequest extends NextRequest {
  user?: UserProfile
}

type ApiHandler = (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>

interface AuthMiddlewareOptions {
  requireAuth?: boolean
  allowedRoles?: string[]
}

/**
 * Middleware de autenticação para rotas da API
 * Centraliza a lógica de verificação de token e autorização
 */
export function withAuth(
  handler: ApiHandler,
  options: AuthMiddlewareOptions = { requireAuth: true }
): ApiHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const { requireAuth = true, allowedRoles } = options

    if (!requireAuth) {
      return handler(request, context)
    }

    try {
      // Extrair token do header Authorization
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Token de acesso requerido' },
          { status: 401 }
        )
      }

      const token = authHeader.substring(7) // Remove 'Bearer '
      
      if (!token) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }

      // Verificar token
      const user = await verifyToken(token)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }

      // Verificar roles se especificados
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.papel)) {
          return NextResponse.json(
            { error: 'Acesso negado' },
            { status: 403 }
          )
        }
      }

      // Adicionar usuário ao contexto da requisição
      const requestWithUser = request as NextRequest & { user: typeof user }
      requestWithUser.user = user

      return handler(requestWithUser, context)
    } catch (error) {
    return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware específico para administradores
 */
export function withAdminAuth(handler: ApiHandler): ApiHandler {
  return withAuth(handler, {
    requireAuth: true,
    allowedRoles: ['admin']
  })
}

/**
 * Middleware para administradores e gerentes
 */
export function withManagerAuth(handler: ApiHandler): ApiHandler {
  return withAuth(handler, {
    requireAuth: true,
    allowedRoles: ['admin', 'manager']
  })
}

/**
 * Utilitário para extrair usuário da requisição autenticada
 */
export function getUserFromRequest(request: NextRequest): UserProfile | null {
  return (request as AuthenticatedRequest).user || null
}