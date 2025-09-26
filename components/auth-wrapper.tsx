'use client'

import { useAuth } from '@/hooks/use-auth'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { ReactNode } from 'react'

interface AuthWrapperProps {
  children: ReactNode
  requiredRoles?: ('admin' | 'manager' | 'operator' | 'viewer')[]
}

export function AuthWrapper({ children, requiredRoles }: AuthWrapperProps) {
  const { user, isLoading } = useAuth()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Se usuário não está logado, redirecionar para login
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  // Verificar se o usuário tem um dos papéis necessários
  if (requiredRoles && !requiredRoles.includes(user.papel)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Se usuário está logado, mostrar layout com sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}