'use client'

import { useAuth } from '@/hooks/use-auth'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { GlobalNotifications, useGlobalNotifications } from '@/components/global-notifications'
import { useRealTimeNotifications } from '@/hooks/use-real-time-notifications'
import { NotificationsButton } from '@/components/notifications-button'
import { ReactNode } from 'react'

interface AuthWrapperProps {
  children: ReactNode
  requiredRoles?: ('admin' | 'manager' | 'operator' | 'viewer')[]
}

export function AuthWrapper({ children, requiredRoles }: AuthWrapperProps) {
  const { user, isLoading } = useAuth()
  // Sempre chamar hooks na mesma ordem para evitar erros do React
  const { notifications, dismissNotification } = useGlobalNotifications()
  // Ativar verificações periódicas de novas solicitações para admin/manager
  useRealTimeNotifications()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Carregando autenticação">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" aria-hidden="true"></div>
        <span className="sr-only">Verificando autenticação...</span>
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
      <div className="flex items-center justify-center min-h-screen" role="main">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" role="heading" aria-level={1}>Acesso Negado</h1>
          <p className="text-muted-foreground" role="alert">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Se usuário está logado, mostrar layout com sidebar

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1" role="main">
        <div className="flex items-center justify-between p-4 border-b">
          <SidebarTrigger />
          <NotificationsButton />
        </div>
        <div className="p-4">
          {children}
        </div>
      </main>
      <GlobalNotifications 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />
    </SidebarProvider>
  )
}